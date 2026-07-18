/**
 * Capacitor ネイティブブリッジの待機とプラグイン取得
 */
const WAIT_MS = 6000;
const POLL_MS = 80;

export function isCapacitorNative() {
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

export function getCapacitorPlatform() {
  return window.Capacitor?.getPlatform?.() || '';
}

export function isAndroidCapacitor() {
  return isCapacitorNative() && getCapacitorPlatform() === 'android';
}

export function isIosCapacitor() {
  return isCapacitorNative() && getCapacitorPlatform() === 'ios';
}

/** ホーム画面に追加した PWA（Capacitor APK ではない） */
export function isAndroidPwaInstalled() {
  if (isCapacitorNative()) return false;
  const ua = navigator.userAgent || '';
  if (!/Android/i.test(ua)) return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export async function waitForCapacitorBridge() {
  if (isCapacitorNative()) return true;
  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    if (isCapacitorNative()) return true;
  }
  return isCapacitorNative();
}

/** DailySteps カスタムプラグイン */
export function getDailyStepsPlugin() {
  const cap = window.Capacitor;
  if (!cap) return null;
  if (typeof cap.registerPlugin === 'function') {
    try {
      return cap.registerPlugin('DailySteps');
    } catch {
      /* ignore */
    }
  }
  return cap.Plugins?.DailySteps || null;
}

export async function waitForDailyStepsPlugin() {
  await waitForCapacitorBridge();
  let plugin = getDailyStepsPlugin();
  if (plugin) return plugin;

  const deadline = Date.now() + WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    plugin = getDailyStepsPlugin();
    if (plugin) return plugin;
  }
  return getDailyStepsPlugin();
}
