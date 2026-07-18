/**
 * 万歩計
 * - Google Fit 連携: 端末の歩数をクラウド経由で取得（インストール不要・バックグラウンド可）
 * - Capacitor ネイティブ版: 端末内蔵センサー（任意）
 * - ブラウザ版フォールバック: 加速度センサー（画面表示中）
 */

import * as nativeSteps from './native-steps.js';
import * as googleFit from './google-fit-sync.js';
import { todayKey } from './geo.js';
import { dateKeyToEndMs } from './date-utils.js';
import { createTimestampTracker } from './timestamp-tracker.js';

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
  const n = pendingSteps;
  const at = lastStepTime || Date.now();
  pendingSteps = 0;
  if (onStepsCallback) {
    onStepsCallback({ sessionSteps, flush: n, at });
  } else {
    queueSteps(n, at);
  }
}

function handleNativeUpdate({ sessionSteps: nativeSession, delta }) {
  if (delta != null && delta > 0) {
    lastNativeSessionSteps = nativeSession;
    applySessionDelta(delta, Date.now());
    if (sensorMode === 'native') {
      setNativeDailyMarker(todayKey(), nativeSession);
    }
    return;
  }

  const stepDelta = nativeSession - lastNativeSessionSteps;
  if (stepDelta > 0) {
    lastNativeSessionSteps = nativeSession;
    applySessionDelta(stepDelta, Date.now());
    if (sensorMode === 'native') {
      setNativeDailyMarker(todayKey(), nativeSession);
    }
  } else if (nativeSession !== lastNativeSessionSteps) {
    lastNativeSessionSteps = nativeSession;
    sessionSteps = nativeSession;
    if (sensorMode === 'native') {
      setNativeDailyMarker(todayKey(), nativeSession);
    }
    if (onStepsCallback) onStepsCallback({ sessionSteps, pendingSteps });
  }
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

function applyDailySourceTotal(sourceToday, marker, setMarker) {
  const day = todayKey();
  let lastDate = marker.date;
  let lastTotal = marker.total;
  if (lastDate !== day) {
    lastDate = day;
    lastTotal = 0;
    setMarker(day, 0);
  }

  const creditedToday = Math.max(0, Math.floor(Number(creditedTodayGetter?.()) || 0));
  const syncBaseline = Math.max(lastTotal, creditedToday);
  const delta = sourceToday - syncBaseline;
  sessionSteps = sourceToday;

  if (delta > 0) {
    setMarker(day, sourceToday);
    applySessionDelta(delta, Date.now());
  } else if (sourceToday > lastTotal) {
    setMarker(day, sourceToday);
    if (onStepsCallback) onStepsCallback({ sessionSteps, pendingSteps });
  } else if (onStepsCallback) {
    onStepsCallback({ sessionSteps, pendingSteps });
  }
  lastMotionAt = Date.now();
}

export function setCreditedTodayGetter(getter) {
  creditedTodayGetter = typeof getter === 'function' ? getter : null;
}

async function syncPendingDays() {
  if (!onStepsCallback) return;
  try {
    const pending = await nativeSteps.getPendingSyncDays();
    for (const item of pending) {
      const steps = Math.max(0, Math.floor(Number(item?.steps) || 0));
      const dateKey = item?.date;
      if (!dateKey || steps <= 0) continue;
      onStepsCallback({
        sessionSteps: 0,
        flush: steps,
        at: dateKeyToEndMs(dateKey),
        pendingDay: dateKey
      });
    }
  } catch {
    /* ignore */
  }
}

async function syncDailySteps() {
  if (!enabled && !autoTrackMode) return;

  try {
    await syncPendingDays();

    if (googleFit.canUseBackgroundSync()) {
      const sourceToday = await googleFit.getTodaySteps();
      applyDailySourceTotal(sourceToday, googleFit.getDailySyncMarker(), googleFit.setDailySyncMarker);
      return;
    }
    if (await nativeSteps.isNativeStepCounterAvailable()) {
      const sourceToday = await nativeSteps.getTodaySteps();
      applyDailySourceTotal(sourceToday, getNativeDailyMarker(), setNativeDailyMarker);
    }
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
    await syncPendingDays();
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
  googleFit.resetDailySyncMarker(day, 0);
  setNativeDailyMarker(day, 0);
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

export async function stopAutoDailyTracking() {
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

export function restoreSession(savedSessionSteps = 0, creditedToday = 0) {
  sessionSteps = savedSessionSteps;
  lastNativeSessionSteps = savedSessionSteps;
  const day = todayKey();
  const marker = getNativeDailyMarker();
  const credited = Math.max(0, Math.floor(Number(creditedToday) || 0));
  const baseline = Math.max(marker.date === day ? marker.total : 0, credited);
  if (marker.date !== day || marker.total < baseline) {
    setNativeDailyMarker(day, baseline);
  }
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

export function syncExternalReading(externalTotal, lastExternalTotal) {
  const delta = Math.max(0, Math.floor(externalTotal) - Math.floor(lastExternalTotal));
  if (delta > 0) {
    applySessionDelta(delta, Date.now());
    flushPending();
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
