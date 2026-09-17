/**
 * 万歩計
 * - Google Fit 連携: 端末の歩数をクラウド経由で取得（インストール不要・バックグラウンド可）
 * - Capacitor ネイティブ版: 端末内蔵センサー（任意）
 * - ブラウザ版フォールバック: 加速度センサー（画面表示中）
 */

import * as nativeSteps from './native-steps.js';
import * as googleFit from './google-fit-sync.js';
import { todayKey } from './geo.js';
import { dateKeyToEndMs, shiftDateKey } from './date-utils.js';
import { createTimestampTracker } from './timestamp-tracker.js';
import {
  computeCatchUpDelta,
  restoreTodayWatermark,
  catchUpDateWindow,
  journeyStartDateKey,
  journeyTodayWatermark,
  resolveCatchUpWatermarks,
  getCreditedForDate,
  setCreditedForDate,
  hasAnyCreditedDate,
  resetCreditedByDate,
  mergeMarkerIntoCredited
} from './step-credit.js';

const NATIVE_DAILY_DATE_KEY = 'senri-daily-native-date';
const NATIVE_DAILY_TOTAL_KEY = 'senri-daily-native-total';

const MIN_STEP_INTERVAL_MS = 320;
const FLUSH_INTERVAL_MS = 1500;
const FLUSH_STEP_THRESHOLD = 5;
const MOTION_STALL_MS = 3000;
const DAILY_SYNC_INTERVAL_MS = 8000;
const FIT_SYNC_INTERVAL_MS = 20000;
const QUEUE_KEY = 'senri-pedo-queue';
const PEDOMETER_DISABLED_KEY = 'senri-pedometer-disabled';
const THRESHOLD_LINEAR = 1.1;
const THRESHOLD_GRAVITY = 0.75;
const BUFFER_SIZE = 8;

const SILENT_WAV =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';

let enabled = false;
let permission = 'unknown';
let sessionSteps = 0;
let pendingSteps = 0;
let lastStepTime = 0;
let lastMotionAt = 0;
let magnitudeBuffer = [];
let onStepsCallback = null;
let motionListening = false;
const clock = createTimestampTracker();
let rafId = null;
let lastFlushAt = 0;
let lastDailySyncAt = 0;
let sensorMode = 'none'; // none | generic | devicemotion | native | google-fit
let wakeLock = null;
let keepAliveAudio = null;
let lockRelease = null;
let linearSensor = null;
let accelSensor = null;
let wasAbove = false;
let lastNativeSessionSteps = 0;
let autoTrackMode = false;
let lastKnownDay = todayKey();
let creditedTodayGetter = null;
let journeyActiveGetter = null;
let journeyStartedAtGetter = null;
let deviceBaselineGetter = null;
/** ベースライン同期直後は差分計上を1回スキップ（停止→再開の誤計上防止） */
let suppressNextDailyCredit = false;
/** 新目的地設定中など、旅への歩数加算を一時停止 */
let creditPaused = false;
/** 本日分の同期済み水位（旅加算の完了を待たずに進める） */
let creditedTodayMemory = null;
let creditedTodayMemoryDate = '';

function isAndroid() {
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return true;
  if (navigator.userAgentData?.platform === 'Android') return true;
  return false;
}

function isMobileDevice() {
  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  if (navigator.userAgentData?.mobile) return true;
  return false;
}

export function isAndroidDevice() {
  return isAndroid();
}

export function isAndroidNativeApp() {
  return isNativeAppShell() && isAndroidDevice() && !isIosDevice();
}

export function isPedometerUserDisabled() {
  try {
    return localStorage.getItem(PEDOMETER_DISABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPedometerUserDisabled() {
  try {
    localStorage.setItem(PEDOMETER_DISABLED_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearPedometerUserDisabled() {
  try {
    localStorage.removeItem(PEDOMETER_DISABLED_KEY);
  } catch {
    /* ignore */
  }
}

export function isIosDevice() {
  return nativeSteps.isIosDevice?.() || false;
}

export function isIosPwa() {
  if (!isIosDevice() || isNativeAppShell()) return false;
  return window.navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
}

export function isIosMobileExperience() {
  return isIosDevice() && (isNativeAppShell() || isIosPwa() || isMobilePedometerDevice());
}

export function isMobilePedometerDevice() {
  return isMobileDevice();
}

function magnitude(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

function flushThreshold() {
  return document.hidden ? 1 : FLUSH_STEP_THRESHOLD;
}

function applySessionDelta(delta, at) {
  if (delta <= 0) return;
  sessionSteps += delta;
  pendingSteps += delta;
  lastStepTime = at || Date.now();
  lastMotionAt = lastStepTime;
  notifyStep();
}

function processSample(x, y, z, isLinear) {
  if (x == null || y == null || z == null) return;
  if (sensorMode === 'native' || sensorMode === 'google-fit') return;

  lastMotionAt = Date.now();
  const raw = magnitude(x, y, z);
  magnitudeBuffer.push(raw);
  if (magnitudeBuffer.length > BUFFER_SIZE) magnitudeBuffer.shift();
  if (magnitudeBuffer.length < 4) return;

  const mean = magnitudeBuffer.reduce((s, v) => s + v, 0) / magnitudeBuffer.length;
  const deviation = Math.abs(raw - mean);
  const threshold = isLinear ? THRESHOLD_LINEAR : THRESHOLD_GRAVITY;
  const now = Date.now();

  if (deviation > threshold && !wasAbove && now - lastStepTime > MIN_STEP_INTERVAL_MS) {
    applySessionDelta(1, now);
  }
  wasAbove = deviation > threshold;
}

function handleMotion(e) {
  if (!enabled || sensorMode === 'generic' || sensorMode === 'native' || sensorMode === 'google-fit') return;

  const lin = e.acceleration;
  if (lin && lin.x != null) {
    processSample(lin.x, lin.y, lin.z, true);
    return;
  }

  const grav = e.accelerationIncludingGravity;
  if (grav && grav.x != null) {
    processSample(grav.x, grav.y, grav.z, false);
  }
}

function queueSteps(n, at) {
  if (n <= 0) return;
  try {
    const q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    q.push({ n, at });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* ignore */
  }
}

function notifyStep() {
  if (onStepsCallback) {
    onStepsCallback({ sessionSteps, pendingSteps });
  }
  if (pendingSteps >= flushThreshold()) {
    flushPending();
  }
}

function flushPending() {
  if (pendingSteps <= 0) return;
  if (creditPaused) {
    pendingSteps = 0;
    return;
  }
  const n = pendingSteps;
  const at = lastStepTime || Date.now();
  pendingSteps = 0;
  if (onStepsCallback) {
    onStepsCallback({ sessionSteps, flush: n, at });
  } else {
    queueSteps(n, at);
  }
}

/** 未反映歩数・キューを破棄（旅には加算しない） */
export function discardPendingSteps() {
  pendingSteps = 0;
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 新しい目的地を設定する直前に呼ぶ。
 * 旧旅の未反映歩数が新旅の累計に乗らないようにする。
 */
export function pauseCreditForNewJourney() {
  creditPaused = true;
  suppressNextDailyCredit = true;
  discardPendingSteps();
}

/** 新旅のベースライン同期後に再開（直後1回は差分スキップ） */
export function resumeCreditAfterNewJourney() {
  creditPaused = false;
  suppressNextDailyCredit = true;
  discardPendingSteps();
}

function handleNativeUpdate({ sessionSteps: nativeSession }) {
  applySourceDay(todayKey(), nativeSession);
}

function getSyncIntervalMs() {
  if (sensorMode === 'google-fit') return FIT_SYNC_INTERVAL_MS;
  if (sensorMode === 'native') return DAILY_SYNC_INTERVAL_MS;
  return FLUSH_INTERVAL_MS;
}

/** FG 中のみ動くティック。BG では完全停止し、復帰時に一括補正 */
function tickForeground() {
  if (!enabled && !autoTrackMode) {
    stopForegroundLoop();
    return;
  }
  if (document.hidden) {
    rafId = null;
    return;
  }

  const now = Date.now();

  if (now - lastFlushAt >= FLUSH_INTERVAL_MS && pendingSteps > 0) {
    flushPending();
    lastFlushAt = now;
  }

  if (sensorMode === 'google-fit' || sensorMode === 'native') {
    if (now - lastDailySyncAt >= getSyncIntervalMs()) {
      syncDailySteps().then(() => {
        lastDailySyncAt = Date.now();
        clock.markSynced();
      });
    }
  }

  if (sensorMode !== 'native' && sensorMode !== 'google-fit') {
    if (lastMotionAt && now - lastMotionAt > MOTION_STALL_MS) {
      restartSensors();
      resumeKeepAlive();
    }
  }

  rafId = requestAnimationFrame(tickForeground);
}

function startForegroundLoop() {
  stopForegroundLoop();
  const now = Date.now();
  lastFlushAt = now;
  lastDailySyncAt = now;
  rafId = requestAnimationFrame(tickForeground);
}

function stopForegroundLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function attachDeviceMotion() {
  if (motionListening) return;
  window.addEventListener('devicemotion', handleMotion, { passive: true });
  motionListening = true;
  lastMotionAt = Date.now();
}

function detachDeviceMotion() {
  if (!motionListening) return;
  window.removeEventListener('devicemotion', handleMotion);
  motionListening = false;
}

function stopGenericSensors() {
  try {
    linearSensor?.stop();
  } catch {
    /* ignore */
  }
  try {
    accelSensor?.stop();
  } catch {
    /* ignore */
  }
  linearSensor = null;
  accelSensor = null;
}

async function startGenericSensors() {
  stopGenericSensors();

  if ('LinearAccelerationSensor' in window) {
    try {
      linearSensor = new LinearAccelerationSensor({ frequency: 50 });
      linearSensor.addEventListener('reading', () => {
        processSample(linearSensor.x, linearSensor.y, linearSensor.z, true);
      });
      linearSensor.start();
      sensorMode = 'generic';
      lastMotionAt = Date.now();
      return true;
    } catch {
      stopGenericSensors();
    }
  }

  if ('Accelerometer' in window) {
    try {
      accelSensor = new Accelerometer({ frequency: 50 });
      accelSensor.addEventListener('reading', () => {
        processSample(accelSensor.x, accelSensor.y, accelSensor.z, false);
      });
      accelSensor.start();
      sensorMode = 'generic';
      lastMotionAt = Date.now();
      return true;
    } catch {
      stopGenericSensors();
    }
  }

  return false;
}

async function startMotionSensors() {
  magnitudeBuffer = [];
  wasAbove = false;
  const genericOk = await startGenericSensors();
  if (genericOk) return true;
  sensorMode = 'devicemotion';
  attachDeviceMotion();
  return true;
}

function getNativeDailyMarker() {
  try {
    return {
      date: localStorage.getItem(NATIVE_DAILY_DATE_KEY) || '',
      total: Number(localStorage.getItem(NATIVE_DAILY_TOTAL_KEY) || 0)
    };
  } catch {
    return { date: '', total: 0 };
  }
}

function setNativeDailyMarker(dateKey, total) {
  try {
    localStorage.setItem(NATIVE_DAILY_DATE_KEY, dateKey);
    localStorage.setItem(NATIVE_DAILY_TOTAL_KEY, String(Math.max(0, Math.floor(total))));
  } catch {
    /* ignore */
  }
}

function isJourneyActive() {
  return journeyActiveGetter ? journeyActiveGetter() : false;
}

function getJourneyStartedAt() {
  return journeyStartedAtGetter ? journeyStartedAtGetter() : null;
}

function getDeviceBaseline() {
  return deviceBaselineGetter ? Math.max(0, Math.floor(Number(deviceBaselineGetter()) || 0)) : 0;
}

function allowBackgroundCatchUp() {
  return Boolean(
    autoTrackMode
    || enabled
    || hasAnyCreditedDate()
    || getNativeDailyMarker().date
    || googleFit.getDailySyncMarker?.().date
  );
}

function getJourneyTodaySteps() {
  return creditedTodayGetter ? Math.max(0, Math.floor(Number(creditedTodayGetter()) || 0)) : 0;
}

function journeyWatermarkForToday() {
  const day = todayKey();
  return journeyTodayWatermark({
    dateKey: day,
    today: day,
    pedometerTodaySteps: getJourneyTodaySteps(),
    deviceBaseline: getDeviceBaseline(),
    journeyStartedAt: getJourneyStartedAt()
  });
}

function seedCreditedMemoryFromJourney() {
  const day = todayKey();
  creditedTodayMemoryDate = day;
  creditedTodayMemory = journeyWatermarkForToday();
}

function creditedWatermarkFor(dateKey, sourceTotal = 0) {
  const day = todayKey();
  if (creditedTodayMemoryDate && creditedTodayMemoryDate !== day) {
    creditedTodayMemory = null;
    creditedTodayMemoryDate = '';
  }

  if (dateKey === day) {
    const marks = resolveCatchUpWatermarks({
      dateKey,
      today: day,
      pedometerTodaySteps: getJourneyTodaySteps(),
      deviceBaseline: getDeviceBaseline(),
      journeyStartedAt: getJourneyStartedAt(),
      memoryCredited: creditedTodayMemoryDate === day ? creditedTodayMemory : null,
      sourceTotal
    });
    return marks;
  }

  return {
    alreadyCredited: getCreditedForDate(dateKey, 0),
    floorCredited: floorForDate(dateKey),
    journeyWatermark: 0
  };
}

function persistCredited(dateKey, total) {
  const day = todayKey();
  setCreditedForDate(dateKey, total, day);
  if (dateKey === day) {
    setNativeDailyMarker(day, total);
    googleFit.setDailySyncMarker(day, total);
  }
}

function floorForDate(dateKey) {
  const startDay = journeyStartDateKey(getJourneyStartedAt());
  if (startDay && dateKey === startDay) return getDeviceBaseline();
  return 0;
}

function applySourceDay(dateKey, sourceTotal, { pendingDay = false } = {}) {
  const deviceToday = Math.max(0, Math.floor(Number(sourceTotal) || 0));
  const isToday = dateKey === todayKey();
  if (isToday) {
    sessionSteps = deviceToday;
    lastNativeSessionSteps = deviceToday;
  }

  const marks = creditedWatermarkFor(dateKey, deviceToday);
  const suppressCredit = creditPaused || !isJourneyActive() || (suppressNextDailyCredit && isToday);

  const result = computeCatchUpDelta({
    sourceTotal: deviceToday,
    alreadyCredited: marks.alreadyCredited,
    floorCredited: marks.floorCredited,
    suppressCredit,
    allowBackgroundCatchUp: allowBackgroundCatchUp()
  });

  const raiseWatermark = !suppressCredit;
  if (raiseWatermark) {
    persistCredited(dateKey, result.nextCredited);
    if (isToday) {
      creditedTodayMemoryDate = dateKey;
      creditedTodayMemory = result.nextCredited;
    }
  }

  if (creditPaused) {
    pendingSteps = 0;
    if (isToday && onStepsCallback) onStepsCallback({ sessionSteps, pendingSteps: 0 });
    return result;
  }

  if (suppressNextDailyCredit) {
    pendingSteps = 0;
    if (isToday && onStepsCallback) onStepsCallback({ sessionSteps, pendingSteps: 0 });
    suppressNextDailyCredit = false;
    return result;
  }

  if (result.delta > 0 && onStepsCallback) {
    const at = isToday ? Date.now() : dateKeyToEndMs(dateKey);
    pendingSteps = 0;
    lastStepTime = at;
    onStepsCallback({
      sessionSteps,
      flush: result.delta,
      at,
      pendingDay: pendingDay ? dateKey : undefined
    });
  } else if (result.delta > 0) {
    pendingSteps += result.delta;
    lastStepTime = Date.now();
    notifyStep();
  } else if (isToday && onStepsCallback) {
    onStepsCallback({ sessionSteps, pendingSteps });
  }

  if (pendingDay && result.delta <= 0) {
    nativeSteps.acknowledgePendingDay?.(dateKey);
  }

  lastMotionAt = Date.now();
  return result;
}

export function clearDailySyncMarkers() {
  const day = todayKey();
  resetCreditedByDate();
  setNativeDailyMarker(day, 0);
  googleFit.setDailySyncMarker(day, 0);
  sessionSteps = 0;
  lastNativeSessionSteps = 0;
  pendingSteps = 0;
  creditedTodayMemory = 0;
  creditedTodayMemoryDate = day;
}

function applyDailySourceTotal(sourceToday) {
  applySourceDay(todayKey(), sourceToday);
}

export function setCreditedTodayGetter(getter) {
  creditedTodayGetter = typeof getter === 'function' ? getter : null;
}

export function setJourneyActiveGetter(getter) {
  journeyActiveGetter = typeof getter === 'function' ? getter : null;
}

export function setJourneyStartedAtGetter(getter) {
  journeyStartedAtGetter = typeof getter === 'function' ? getter : null;
}

export function setDeviceBaselineGetter(getter) {
  deviceBaselineGetter = typeof getter === 'function' ? getter : null;
}

async function syncMissedDays() {
  if (!onStepsCallback || !isJourneyActive() || creditPaused || suppressNextDailyCredit) return;

  const today = todayKey();
  const window = catchUpDateWindow({
    journeyStartedAt: getJourneyStartedAt(),
    today
  });
  const startDay = journeyStartDateKey(getJourneyStartedAt()) || window.from;
  const from = window.from || startDay;
  const to = window.to || shiftDateKey(today, -1);

  const byDate = new Map();

  try {
    const pending = await nativeSteps.getPendingSyncDays();
    for (const item of pending || []) {
      const dateKey = item?.date;
      const steps = Math.max(0, Math.floor(Number(item?.steps) || 0));
      if (dateKey && steps > 0) byDate.set(dateKey, Math.max(byDate.get(dateKey) || 0, steps));
    }
  } catch {
    /* ignore */
  }

  if (from && to && from <= to) {
    try {
      const historical = await nativeSteps.getHistoricalDays?.(from, to);
      for (const item of historical || []) {
        const dateKey = item?.date;
        const steps = Math.max(0, Math.floor(Number(item?.steps) || 0));
        if (dateKey && steps > 0) byDate.set(dateKey, Math.max(byDate.get(dateKey) || 0, steps));
      }
    } catch {
      /* ignore */
    }

    if (googleFit.canUseBackgroundSync()) {
      try {
        const historical = await googleFit.getHistoricalDays(from, to);
        for (const item of historical || []) {
          const dateKey = item?.date;
          const steps = Math.max(0, Math.floor(Number(item?.steps) || 0));
          if (dateKey && steps > 0) byDate.set(dateKey, Math.max(byDate.get(dateKey) || 0, steps));
        }
      } catch {
        /* ignore */
      }
    }
  }

  const dates = new Set(window.days);
  for (const dateKey of byDate.keys()) dates.add(dateKey);
  for (const dateKey of [...dates].sort()) {
    if (!dateKey || dateKey >= today) continue;
    if (startDay && dateKey < startDay) continue;
    const steps = byDate.get(dateKey);
    if (!steps) continue;
    applySourceDay(dateKey, steps, { pendingDay: true });
  }
}

async function readTodaySourceTotal() {
  let nativeToday = 0;
  let fitToday = 0;

  if (await nativeSteps.isNativeStepCounterAvailable()) {
    try {
      nativeToday = Math.max(0, Math.floor(Number(await nativeSteps.getTodaySteps()) || 0));
    } catch {
      nativeToday = 0;
    }
  }

  if (googleFit.canUseBackgroundSync()) {
    try {
      fitToday = Math.max(0, Math.floor(Number(await googleFit.getTodaySteps()) || 0));
    } catch {
      fitToday = 0;
    }
  }

  return Math.max(nativeToday, fitToday);
}

async function syncDailySteps() {
  if (!enabled && !autoTrackMode) return;

  try {
    await syncMissedDays();
    applyDailySourceTotal(await readTodaySourceTotal());
  } catch {
    /* 通信エラー等は次回再試行 */
  }
}

export async function ensureNativeBackground() {
  if (sensorMode !== 'native') return false;
  return nativeSteps.ensureBackgroundService();
}

export async function checkNativePermissions() {
  return nativeSteps.checkNativePermissions?.() ?? { activityRecognition: 'denied', notifications: 'granted' };
}

export async function prepareBackgroundTracking() {
  return nativeSteps.prepareBackgroundTracking?.() ?? { ok: false, reason: 'not-native' };
}

export async function isBatteryOptimizationEnabled() {
  return nativeSteps.isBatteryOptimizationEnabled?.() ?? false;
}

export async function requestBatteryOptimizationExemption() {
  return nativeSteps.requestBatteryOptimizationExemption?.() ?? false;
}

export async function syncDailyStepsNow() {
  await nativeSteps.ensureBackgroundService?.();
  await syncDailySteps();
  flushPending();
}

export async function catchUpAfterBackground(maxAttempts = 5) {
  if (!enabled && !autoTrackMode) return;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await nativeSteps.ensureBackgroundService?.();
    await nativeSteps.catchUpTodaySteps?.();
    await syncDailySteps();
    flushPending();
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
}

export async function onDayRolled() {
  const day = todayKey();
  lastKnownDay = day;
  sessionSteps = 0;
  lastNativeSessionSteps = 0;
  creditedTodayMemory = 0;
  creditedTodayMemoryDate = day;
  googleFit.resetDailySyncMarker(day, 0);
  setNativeDailyMarker(day, 0);
  setCreditedForDate(day, 0, day);
  await syncDailySteps();
}

function checkDayRollover() {
  const day = todayKey();
  if (day === lastKnownDay) return false;
  lastKnownDay = day;
  onDayRolled();
  return true;
}

async function syncFromGoogleFit() {
  await syncDailySteps();
}

async function startGoogleFitSensor() {
  stopGenericSensors();
  detachDeviceMotion();
  sensorMode = 'google-fit';
  lastMotionAt = Date.now();
  await syncDailySteps();
  return true;
}

async function startNativeSensor() {
  lastNativeSessionSteps = sessionSteps;
  const result = await nativeSteps.startNativeSteps(handleNativeUpdate);
  if (!result.ok) return false;
  sensorMode = 'native';
  lastMotionAt = Date.now();
  await syncDailySteps();
  return true;
}

async function startSensors() {
  if (isAndroidNativeApp() || isIosDevice() && isNativeAppShell()) {
    await nativeSteps.waitForNativeReady?.();
    if (await nativeSteps.isNativeStepCounterAvailable()) {
      return startNativeSensor();
    }
    if (isAndroidNativeApp()) {
      return false;
    }
  }
  if (await nativeSteps.isNativeStepCounterAvailable()) {
    return startNativeSensor();
  }
  if (googleFit.canUseBackgroundSync()) {
    return startGoogleFitSensor();
  }
  return startMotionSensors();
}

async function switchToGoogleFitMode() {
  if (!enabled && !autoTrackMode) return false;
  if (!googleFit.canUseBackgroundSync()) return false;
  lastNativeSessionSteps = sessionSteps;
  return startGoogleFitSensor();
}

async function restartSensors() {
  if (!enabled) return;
  if (sensorMode === 'native' || sensorMode === 'google-fit') {
    if (sensorMode === 'google-fit') await syncFromGoogleFit();
    lastMotionAt = Date.now();
    return;
  }

  if (sensorMode === 'generic' && lastMotionAt && Date.now() - lastMotionAt > MOTION_STALL_MS) {
    stopGenericSensors();
    sensorMode = 'devicemotion';
    attachDeviceMotion();
    lastMotionAt = Date.now();
    return;
  }

  if (sensorMode === 'generic') {
    await startGenericSensors();
  } else if (sensorMode === 'devicemotion') {
    detachDeviceMotion();
    attachDeviceMotion();
  }
  lastMotionAt = Date.now();
}

async function stopSensors() {
  stopForegroundLoop();
  if (sensorMode === 'native') {
    await nativeSteps.stopNativeSteps();
  }
  stopGenericSensors();
  detachDeviceMotion();
  sensorMode = 'none';
}

function acquireBackgroundLock() {
  if (!navigator.locks || lockRelease) return;
  navigator.locks.request('senri-pedometer', { mode: 'shared' }, () => {
    return new Promise((resolve) => {
      lockRelease = resolve;
    });
  }).catch(() => {});
}

function releaseBackgroundLock() {
  if (lockRelease) {
    lockRelease();
    lockRelease = null;
  }
}

async function acquireWakeLock() {
  if (!enabled || !('wakeLock' in navigator)) return;
  try {
    if (wakeLock && !wakeLock.released) return;
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
  } catch {
    wakeLock = null;
  }
}

async function releaseWakeLock() {
  if (!wakeLock) return;
  try {
    await wakeLock.release();
  } catch {
    /* ignore */
  }
  wakeLock = null;
}

function setupMediaSession() {
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: '万歩計 計測中',
      artist: '千里の道も一歩から'
    });
    navigator.mediaSession.playbackState = 'playing';
  } catch {
    /* ignore */
  }
}

function ensureKeepAliveAudio() {
  if (keepAliveAudio) return keepAliveAudio;
  const audio = document.createElement('audio');
  audio.setAttribute('playsinline', '');
  audio.loop = true;
  audio.volume = 0.01;
  audio.src = SILENT_WAV;
  audio.preload = 'auto';
  audio.style.display = 'none';
  document.body.appendChild(audio);
  keepAliveAudio = audio;
  return audio;
}

async function resumeKeepAlive() {
  if (!enabled) return;
  const audio = ensureKeepAliveAudio();
  try {
    if (audio.paused) await audio.play();
  } catch {
    /* ignore */
  }
  setupMediaSession();
}

async function startBackgroundSupport() {
  acquireBackgroundLock();
  await resumeKeepAlive();
}

async function stopBackgroundSupport() {
  releaseBackgroundLock();
  await releaseWakeLock();
  if (keepAliveAudio) {
    try {
      keepAliveAudio.pause();
    } catch {
      /* ignore */
    }
  }
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.playbackState = 'none';
    } catch {
      /* ignore */
    }
  }
}

async function onVisibilityChange() {
  if (!enabled && !autoTrackMode) return;

  if (document.hidden) {
    clock.onHidden();
    flushPending();
    nativeSteps.ensureBackgroundService?.();
    stopForegroundLoop();
    return;
  }

  clock.onVisible();
  checkDayRollover();
  await resumeAfterBackground();
  startForegroundLoop();
}

function onPageShow(e) {
  if (!enabled) return;
  if (e.persisted || document.visibilityState === 'visible') {
    resumeAfterBackground();
  }
}

/** 互換用（以前 PiP 用に呼んでいた） */
export function prepareBackgroundMode() {
  if (!enabled && !isMobileDevice()) return;
  resumeKeepAlive();
}

export async function ensureBackgroundMode() {
  if (!enabled) return;
  await resumeKeepAlive();
}

export function getBackgroundModeState() {
  return {
    native: sensorMode === 'native',
    googleFit: sensorMode === 'google-fit',
    motion: sensorMode !== 'none' && sensorMode !== 'native' && sensorMode !== 'google-fit',
    active: enabled
  };
}

export function isBackgroundKeepAliveActive() {
  return sensorMode === 'native' || sensorMode === 'google-fit';
}

export async function isDailyBackgroundTrackingActive() {
  return nativeSteps.isBackgroundTrackingActive();
}

export function isBackgroundSteppingActive() {
  if (sensorMode === 'native' || sensorMode === 'google-fit') return true;
  if (!document.hidden && getLastMotionAge() != null && getLastMotionAge() < 5000) return true;
  return false;
}

export function didPipOpenFail() {
  return false;
}

export async function requestPermission() {
  if (await nativeSteps.isNativeStepCounterAvailable()) {
    const p = await nativeSteps.requestNativePermission();
    permission = p;
    return p;
  }

  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const result = await DeviceMotionEvent.requestPermission();
      permission = result === 'granted' ? 'granted' : 'denied';
      return permission;
    } catch {
      permission = 'denied';
      return 'denied';
    }
  }

  if (navigator.permissions?.query) {
    try {
      const status = await navigator.permissions.query({ name: 'accelerometer' });
      if (status.state === 'denied') {
        permission = 'denied';
        return 'denied';
      }
    } catch {
      /* query 非対応 */
    }
  }

  if (window.DeviceMotionEvent || 'Accelerometer' in window || 'LinearAccelerationSensor' in window) {
    permission = 'granted';
    return 'granted';
  }

  permission = 'unsupported';
  return 'unsupported';
}

export function isSupported() {
  if (nativeSteps.isNativeApp()) return true;
  return Boolean(
    window.DeviceMotionEvent ||
    'Accelerometer' in window ||
    'LinearAccelerationSensor' in window
  );
}

export function getPermission() {
  return permission;
}

export function getSessionSteps() {
  return sessionSteps;
}

export function getPendingSteps() {
  return pendingSteps;
}

export function isEnabled() {
  return enabled;
}

export function getSensorMode() {
  return sensorMode;
}

export function getPedometerModeLabel() {
  if (sensorMode === 'native') return '端末センサー（毎日）';
  if (sensorMode === 'google-fit') return 'Google Fit';
  if (sensorMode === 'generic' || sensorMode === 'devicemotion') return '加速度';
  return '停止中';
}

export function isNativePedometerActive() {
  return sensorMode === 'native';
}

export function isGoogleFitPedometerActive() {
  return sensorMode === 'google-fit';
}

export function isGoogleFitConfigured() {
  return googleFit.isConfigured();
}

export function getGoogleFitSetupMessage() {
  return googleFit.getLastOAuthError?.()
    || googleFit.getSetupMessage?.()
    || '';
}

export function getGoogleFitOAuthHints() {
  return googleFit.getOAuthSetupHints?.() || '';
}

export function isGoogleFitConnected() {
  return googleFit.isConnected();
}

export async function connectGoogleFit() {
  await googleFit.connectInteractive();
  if (enabled || autoTrackMode) {
    await switchToGoogleFitMode();
    await syncDailySteps();
  }
  return true;
}

export function disconnectGoogleFit() {
  googleFit.disconnect();
  if (sensorMode === 'google-fit') {
    sensorMode = 'none';
  }
}

export function isAutoTrackEnabled() {
  return autoTrackMode || enabled;
}

export async function startAutoDailyTracking(onSteps) {
  clearPedometerUserDisabled();
  autoTrackMode = true;
  onStepsCallback = onSteps;
  enabled = true;

  const nativeMarker = getNativeDailyMarker();
  if (nativeMarker.date) mergeMarkerIntoCredited(nativeMarker.date, nativeMarker.total);
  const fitMarker = googleFit.getDailySyncMarker?.() || { date: '', total: 0 };
  if (fitMarker.date) mergeMarkerIntoCredited(fitMarker.date, fitMarker.total);

  seedCreditedMemoryFromJourney();
  suppressNextDailyCredit = false;

  await nativeSteps.waitForNativeReady?.();

  if (isAndroidNativeApp() || (isNativeAppShell() && isIosDevice())) {
    const prepared = await prepareBackgroundTracking();
    if (!prepared.ok && prepared.reason === 'permission-denied') {
      enabled = false;
      autoTrackMode = false;
      permission = 'denied';
      return {
        ok: false,
        error: '歩数を記録するには、身体活動と通知の許可が必要です。',
      };
    }

    if (await nativeSteps.isNativeStepCounterAvailable()) {
      const ok = await startNativeSensor();
      if (ok) {
        clock.start();
        startForegroundLoop();
        await startBackgroundSupport();
        return { ok: true, mode: 'native' };
      }
    }

    if (isAndroidNativeApp()) {
      enabled = false;
      autoTrackMode = false;
      return {
        ok: false,
        error: '端末の歩数センサーを開始できませんでした。アプリを再起動するか、設定で身体活動と通知を許可してください。',
      };
    }
  }

  await syncDailySteps();
  if (googleFit.canUseBackgroundSync()) {
    await startGoogleFitSensor();
    clock.start();
    startForegroundLoop();
    await startBackgroundSupport();
    return { ok: true, mode: 'google-fit' };
  }
  if (await nativeSteps.isNativeStepCounterAvailable()) {
    const ok = await startNativeSensor();
    if (ok) {
      clock.start();
      startForegroundLoop();
      await startBackgroundSupport();
      return { ok: true, mode: 'native' };
    }
  }
  return setEnabled(true, onSteps);
}

/** Android/iOS アプリ版でネイティブ計測に切り替え直す */
export async function retryNativeDailyTracking(onSteps) {
  if (onSteps) onStepsCallback = onSteps;
  if (!isNativeAppShell()) return { ok: false, reason: 'not-native' };

  await nativeSteps.waitForNativeReady?.();
  stopGenericSensors();
  detachDeviceMotion();
  stopForegroundLoop();

  if (isAndroidNativeApp()) {
    await prepareBackgroundTracking();
  }

  if (!(await nativeSteps.isNativeStepCounterAvailable())) {
    return { ok: false, reason: 'plugin-unavailable' };
  }

  const ok = await startNativeSensor();
  if (!ok) return { ok: false, reason: 'start-failed' };

  enabled = true;
  autoTrackMode = true;
  clock.start();
  startForegroundLoop();
  await startBackgroundSupport();
  await catchUpAfterBackground(4);
  return { ok: true, mode: 'native' };
}

function syncBaselineBeforeStop() {
  flushPending();
  const marker = getNativeDailyMarker();
  const day = todayKey();
  const baseline = Math.max(
    marker.date === day ? marker.total : 0,
    sessionSteps
  );
  persistCredited(day, baseline);
  sessionSteps = baseline;
  lastNativeSessionSteps = baseline;
}

/** 端末の本日歩数を基準値に同期（旅への加算なし） */
export async function syncBaselineToDevice() {
  // 未反映分を flush すると新旅の累計に乗ってしまうため破棄する
  discardPendingSteps();
  const day = todayKey();
  let deviceToday = Math.max(0, Math.floor(sessionSteps));

  try {
    deviceToday = Math.max(deviceToday, await readTodaySourceTotal());
  } catch {
    /* 読み取れない場合は現在値を維持 */
  }

  persistCredited(day, deviceToday);
  creditedTodayMemoryDate = day;
  creditedTodayMemory = deviceToday;
  sessionSteps = deviceToday;
  lastNativeSessionSteps = deviceToday;
  pendingSteps = 0;
  suppressNextDailyCredit = true;
  nativeSteps.syncPollBaseline?.(deviceToday);
  if (onStepsCallback) {
    onStepsCallback({ sessionSteps, pendingSteps: 0 });
  }
  return deviceToday;
}

export async function stopAutoDailyTracking() {
  syncBaselineBeforeStop();
  autoTrackMode = false;
  markPedometerUserDisabled();
  return setEnabled(false, onStepsCallback);
}

export function getLastMotionAge() {
  return lastMotionAt ? Date.now() - lastMotionAt : null;
}

export function getElapsedMs() {
  return clock.getElapsedMs();
}

export function restoreSession(deviceBaseline = 0) {
  const day = todayKey();
  const marker = getNativeDailyMarker();
  if (marker.date) mergeMarkerIntoCredited(marker.date, marker.total);
  const restored = restoreTodayWatermark({
    today: day,
    markerDate: marker.date,
    markerTotal: marker.total,
    lastNativeTotal: deviceBaseline
  });
  pendingSteps = 0;
  sessionSteps = restored.sessionSteps;
  lastNativeSessionSteps = restored.sessionSteps;
  suppressNextDailyCredit = false;
  seedCreditedMemoryFromJourney();
  nativeSteps.syncPollBaseline?.(creditedTodayMemory || 0);
}

export function flush() {
  flushPending();
}

export function drainQueuedSteps(onSteps) {
  let q = [];
  try {
    q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    q = [];
  }
  for (const item of q) {
    if (item?.n > 0) {
      onSteps({ sessionSteps, flush: item.n, at: item.at || Date.now() });
    }
  }
}

export async function resumeAfterBackground() {
  if (!enabled && !autoTrackMode) return;
  if (sensorMode === 'native') {
    await nativeSteps.ensureBackgroundService?.();
  }
  await catchUpAfterBackground(4);
  if (sensorMode !== 'native' && sensorMode !== 'google-fit') {
    await restartSensors();
  }
  await startBackgroundSupport();
}

export async function setEnabled(on, onSteps) {
  onStepsCallback = onSteps;

  if (!on) {
    flushPending();
    enabled = false;
    autoTrackMode = false;
    clock.stop();
    stopForegroundLoop();
    googleFit.clearSessionStartMs();
    await stopSensors();
    await stopBackgroundSupport();
    return { ok: true };
  }

  if (!(await isSupported())) {
    permission = 'unsupported';
    return { ok: false, error: 'この端末・ブラウザでは万歩計が使えません。手動入力をご利用ください。' };
  }

  if (permission !== 'granted') {
    const p = await requestPermission();
    if (p !== 'granted') {
      return {
        ok: false,
        error: p === 'unsupported'
          ? 'この端末では万歩計が使えません。手動入力をご利用ください。'
          : isIosDevice()
            ? '歩数を記録するには、モーション（フィットネス）の使用を許可してください。'
            : '歩数を記録するには、端末の設定で身体活動を許可してください。'
      };
    }
  }

  enabled = true;
  autoTrackMode = true;
  const started = await startSensors();
  if (!started) {
    enabled = false;
    autoTrackMode = false;
    return { ok: false, error: '万歩計を開始できませんでした。' };
  }

  await syncDailySteps();
  clock.start();
  startForegroundLoop();
  await startBackgroundSupport();
  return { ok: true };
}

/**
 * 外部万歩計の表示値を取り込む。
 * 旅への加算は呼び出し側（app.js の取り込みボタン）が行うため、
 * ここでは pending に乗せず（flush で二重計上されないよう）セッション歩数のみ進める。
 */
export function syncExternalReading(externalTotal, lastExternalTotal) {
  const delta = Math.max(0, Math.floor(externalTotal) - Math.floor(lastExternalTotal));
  if (delta > 0) {
    sessionSteps += delta;
    lastStepTime = Date.now();
    lastMotionAt = lastStepTime;
  }
  return delta;
}

export async function acknowledgePendingDay(dateKey) {
  await nativeSteps.acknowledgePendingDay(dateKey);
}

export async function resetSessionBaseline() {
  sessionSteps = 0;
  lastNativeSessionSteps = 0;
  pendingSteps = 0;
  const day = todayKey();
  creditedTodayMemory = 0;
  creditedTodayMemoryDate = day;
  googleFit.resetDailySyncMarker(day, 0);
  setNativeDailyMarker(day, 0);
  await nativeSteps.resetNativeSessionBaseline();
}

export function isNativeAppShell() {
  return nativeSteps.isNativeApp();
}

document.addEventListener('visibilitychange', onVisibilityChange);
window.addEventListener('pageshow', onPageShow);
window.addEventListener('pagehide', () => {
  if (enabled) {
    flushPending();
    nativeSteps.ensureBackgroundService?.();
  }
});
window.addEventListener('beforeunload', () => {
  if (enabled) flushPending();
});
document.addEventListener('freeze', () => {
  if (enabled) flushPending();
});
