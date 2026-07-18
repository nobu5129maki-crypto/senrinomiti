/**
 * Android / iOS ネイティブ歩数センサー（Capacitor アプリ版）
 * Android では DailySteps プラグインでバックグラウンド日次計測を行う。
 */

import { todayStartMs } from './date-utils.js';
import {
  isAndroidCapacitor,
  isAndroidPwaInstalled,
  isCapacitorNative,
  isIosCapacitor,
  waitForCapacitorBridge,
  waitForDailyStepsPlugin,
} from './native-bridge.js';

const BASELINE_KEY = 'senri-native-step-baseline';

let plugin = null;
let listenerHandle = null;
let deviceBaseline = null;
let lastDeviceTotal = null;
let onStepCallback = null;
let lastPolledToday = 0;

export function isNativeApp() {
  return isCapacitorNative();
}

export { isAndroidCapacitor, isAndroidPwaInstalled, isIosCapacitor };

export async function waitForNativeReady() {
  await waitForCapacitorBridge();
  await waitForDailyStepsPlugin();
}

export function isIosDevice() {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

export function getNativePlatform() {
  return window.Capacitor?.getPlatform?.() || '';
}

export function isIosNativeApp() {
  return isIosCapacitor();
}

async function resolveDailyPlugin() {
  return waitForDailyStepsPlugin();
}

function getPedometerPlugin() {
  const plugins = window.Capacitor?.Plugins;
  if (!plugins) return null;
  return plugins.CapacitorPedometer || plugins.Pedometer || null;
}

export async function isDailyStepTrackingAvailable() {
  if (!(await waitForCapacitorBridge())) return false;
  const daily = await resolveDailyPlugin();
  if (!daily) return false;
  try {
    const avail = await daily.isAvailable();
    return Boolean(avail?.available);
  } catch {
    return false;
  }
}

export async function isNativeStepCounterAvailable() {
  if (await isDailyStepTrackingAvailable()) return true;
  if (!isNativeApp()) return false;
  plugin = getPedometerPlugin();
  if (!plugin) return false;
  try {
    const avail = await plugin.isAvailable();
    return Boolean(avail?.stepCounting);
  } catch {
    return false;
  }
}

export async function requestNativePermission() {
  await waitForCapacitorBridge();
  const daily = await resolveDailyPlugin();
  if (daily?.requestPermissions) {
    try {
      const status = await daily.requestPermissions();
      if (status?.activityRecognition === 'granted') return 'granted';
      if (isIosNativeApp() || isIosDevice()) {
        return await requestIosMotionPermission();
      }
      return 'denied';
    } catch {
      if (isIosNativeApp() || isIosDevice()) {
        return await requestIosMotionPermission();
      }
      return 'denied';
    }
  }

  if (isIosDevice()) {
    return requestIosMotionPermission();
  }

  if (!plugin) plugin = getPedometerPlugin();
  if (!plugin?.requestPermissions) return 'denied';
  try {
    const status = await plugin.requestPermissions();
    return status?.activityRecognition === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export async function checkNativePermissions() {
  const daily = await resolveDailyPlugin();
  if (daily?.checkPermissions) {
    try {
      return await daily.checkPermissions();
    } catch {
      /* ignore */
    }
  }
  return {
    activityRecognition: 'denied',
    notifications: 'granted',
  };
}

/** 身体活動・通知・FG サービス・電池最適化の準備 */
export async function prepareBackgroundTracking() {
  if (!isNativeApp()) return { ok: false, reason: 'not-native' };
  if (!(await isDailyStepTrackingAvailable())) {
    return { ok: false, reason: 'plugin-missing' };
  }

  const perm = await requestNativePermission();
  if (perm !== 'granted') {
    return { ok: false, reason: 'permission-denied' };
  }

  const started = await ensureBackgroundService();
  if (!started) {
    return { ok: false, reason: 'service-failed' };
  }

  if (!isIosNativeApp()) {
    await requestBatteryOptimizationIfNeeded();
  }

  return { ok: true };
}

export async function isBatteryOptimizationEnabled() {
  const daily = await resolveDailyPlugin();
  if (!daily?.isBatteryOptimized) return false;
  try {
    const status = await daily.isBatteryOptimized();
    return Boolean(status?.optimized);
  } catch {
    return false;
  }
}

export async function requestBatteryOptimizationExemption() {
  const daily = await resolveDailyPlugin();
  if (!daily?.requestIgnoreBatteryOptimizations) return false;
  try {
    await daily.requestIgnoreBatteryOptimizations();
    return true;
  } catch {
    return false;
  }
}

/** FG 復帰時・明示呼び出し時に差分を取得（タイムスタンプ方式） */
export async function catchUpTodaySteps() {
  if (!onStepCallback) return 0;
  await ensureBackgroundService();
  const today = await getTodaySteps();
  let delta = 0;
  if (today > lastPolledToday) {
    delta = today - lastPolledToday;
    lastPolledToday = today;
    onStepCallback({ sessionSteps: today, deviceTotal: today, delta });
  } else if (today !== lastPolledToday) {
    lastPolledToday = today;
    onStepCallback({ sessionSteps: today, deviceTotal: today, delta: 0 });
  }
  return delta;
}

function handleMeasurement(data) {
  const total = Math.max(0, Math.floor(Number(data?.numberOfSteps) || 0));
  if (total <= 0) return;

  if (deviceBaseline == null) {
    deviceBaseline = loadBaseline() ?? total;
    saveBaseline(deviceBaseline);
  }

  lastDeviceTotal = total;
  const sessionSteps = Math.max(0, total - deviceBaseline);
  onStepCallback?.({ sessionSteps, deviceTotal: total });
}

async function startLegacyPedometer(onUpdate) {
  onStepCallback = onUpdate;
  if (!plugin) plugin = getPedometerPlugin();
  if (!plugin) return { ok: false, error: 'native-plugin-missing' };

  const perm = await requestNativePermission();
  if (perm !== 'granted') {
    return { ok: false, error: 'permission-denied' };
  }

  deviceBaseline = loadBaseline();
  lastDeviceTotal = null;

  try {
    if (listenerHandle?.remove) {
      await listenerHandle.remove();
      listenerHandle = null;
    }
    if (plugin.removeAllListeners) {
      await plugin.removeAllListeners();
    }

    listenerHandle = await plugin.addListener('measurement', handleMeasurement);
    await plugin.startMeasurementUpdates();

    if (plugin.getMeasurement) {
      try {
        const now = Date.now();
        const m = await plugin.getMeasurement({ start: now - 60000, end: now });
        if (m?.numberOfSteps) handleMeasurement(m);
      } catch {
        /* ignore */
      }
    }

    return { ok: true, mode: 'legacy' };
  } catch {
    return { ok: false, error: 'start-failed' };
  }
}

async function requestIosMotionPermission() {
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    try {
      const result = await DeviceMotionEvent.requestPermission();
      return result === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }
  return 'granted';
}

async function startDailyTracking(onUpdate) {
  onStepCallback = onUpdate;
  const daily = await resolveDailyPlugin();
  if (!daily?.startTracking) return { ok: false, error: 'daily-plugin-missing' };

  const prepared = await prepareBackgroundTracking();
  if (!prepared.ok) {
    if (prepared.reason === 'permission-denied') {
      return { ok: false, error: 'permission-denied' };
    }
    return { ok: false, error: prepared.reason || 'start-failed' };
  }

  try {
    if (daily.addListener) {
      try {
        if (listenerHandle?.remove) await listenerHandle.remove();
        listenerHandle = await daily.addListener('stepsUpdated', (data) => {
          const today = Math.max(0, Math.floor(Number(data?.steps) || 0));
          if (today > lastPolledToday) {
            const delta = today - lastPolledToday;
            lastPolledToday = today;
            onStepCallback?.({ sessionSteps: today, deviceTotal: today, delta });
          } else if (today !== lastPolledToday) {
            lastPolledToday = today;
            onStepCallback?.({ sessionSteps: today, deviceTotal: today, delta: 0 });
          }
        });
      } catch {
        /* ignore */
      }
    }

    if (daily.ensureRunning) {
      await daily.ensureRunning();
    } else {
      await daily.startTracking();
    }
    const today = await getTodaySteps();
    lastPolledToday = today;
    onStepCallback?.({ sessionSteps: today, deviceTotal: today, delta: 0 });
    return { ok: true, mode: 'daily' };
  } catch {
    return { ok: false, error: 'start-failed' };
  }
}

export async function ensureBackgroundService() {
  const daily = await resolveDailyPlugin();
  if (!daily) return false;
  try {
    const perms = await checkNativePermissions();
    if (perms.activityRecognition !== 'granted') {
      return false;
    }
    if (daily.ensureRunning) {
      await daily.ensureRunning();
    } else if (daily.startTracking) {
      await daily.startTracking();
    } else {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function requestBatteryOptimizationIfNeeded() {
  const daily = await resolveDailyPlugin();
  if (!daily?.isBatteryOptimized || !daily?.requestIgnoreBatteryOptimizations) return;
  try {
    const status = await daily.isBatteryOptimized();
    if (status?.optimized) {
      await daily.requestIgnoreBatteryOptimizations();
    }
  } catch {
    /* ignore */
  }
}

export async function startNativeSteps(onUpdate) {
  if (isNativeApp()) {
    const dailyResult = await startDailyTracking(onUpdate);
    if (dailyResult.ok) return dailyResult;
    const legacy = await startLegacyPedometer(onUpdate);
    if (legacy.ok) return legacy;
    return dailyResult;
  }
  if (await isDailyStepTrackingAvailable()) {
    return startDailyTracking(onUpdate);
  }
  return startLegacyPedometer(onUpdate);
}

export async function stopNativeSteps() {
  onStepCallback = null;
  lastPolledToday = 0;

  const daily = await resolveDailyPlugin();
  if (daily?.stopTracking) {
    try {
      await daily.stopTracking();
    } catch {
      /* ignore */
    }
  }

  try {
    if (listenerHandle?.remove) {
      await listenerHandle.remove();
      listenerHandle = null;
    }
    if (daily?.removeAllListeners) {
      await daily.removeAllListeners();
    }
    if (plugin?.stopMeasurementUpdates) {
      await plugin.stopMeasurementUpdates();
    }
    if (plugin?.removeAllListeners) {
      await plugin.removeAllListeners();
    }
  } catch {
    /* ignore */
  }

  deviceBaseline = null;
  lastDeviceTotal = null;
}

export async function resetNativeSessionBaseline() {
  const daily = await resolveDailyPlugin();
  if (daily?.resetToday) {
    try {
      await daily.resetToday();
      lastPolledToday = 0;
    } catch {
      /* ignore */
    }
    return;
  }

  deviceBaseline = lastDeviceTotal;
  if (deviceBaseline != null) saveBaseline(deviceBaseline);
  else clearBaselineStorage();
}

export function getNativeModeLabel() {
  if (isCapacitorNative()) return 'daily-native';
  return 'none';
}

export function getLastDeviceTotal() {
  return lastDeviceTotal;
}

export async function getTodaySteps() {
  await ensureBackgroundService();
  const daily = await resolveDailyPlugin();
  if (daily?.getTodaySteps) {
    try {
      const result = await daily.getTodaySteps();
      return Math.max(0, Math.floor(Number(result?.steps) || 0));
    } catch {
      return 0;
    }
  }

  if (!plugin) plugin = getPedometerPlugin();
  if (!plugin?.getMeasurement) return 0;
  try {
    const now = Date.now();
    const m = await plugin.getMeasurement({ start: todayStartMs(), end: now });
    return Math.max(0, Math.floor(Number(m?.numberOfSteps) || 0));
  } catch {
    return 0;
  }
}

export async function getPendingSyncDays() {
  const daily = await resolveDailyPlugin();
  if (!daily?.getPendingDays) return [];
  try {
    const result = await daily.getPendingDays();
    return Array.isArray(result?.days) ? result.days : [];
  } catch {
    return [];
  }
}

export async function acknowledgePendingDay(dateKey) {
  const daily = await resolveDailyPlugin();
  if (!daily?.acknowledgePendingDay || !dateKey) return;
  try {
    await daily.acknowledgePendingDay({ date: dateKey });
  } catch {
    /* ignore */
  }
}

export async function isBackgroundTrackingActive() {
  const daily = await resolveDailyPlugin();
  if (!daily?.isTracking) return false;
  try {
    const result = await daily.isTracking();
    return Boolean(result?.tracking);
  } catch {
    return false;
  }
}

function loadBaseline() {
  try {
    const v = localStorage.getItem(BASELINE_KEY);
    return v != null ? Number(v) : null;
  } catch {
    return null;
  }
}

function saveBaseline(value) {
  try {
    localStorage.setItem(BASELINE_KEY, String(value));
  } catch {
    /* ignore */
  }
}

function clearBaselineStorage() {
  try {
    localStorage.removeItem(BASELINE_KEY);
  } catch {
    /* ignore */
  }
}
