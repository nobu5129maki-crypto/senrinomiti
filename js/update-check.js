/**
 * アプリ更新チェック
 * - Web / リモートシェル: 静かにリロード
 * - ネイティブ同梱版: 新 APK の案内（リロードでは更新不可）
 */
import { APP_VERSION, APP_PRODUCTION_URL } from './app-version.js';
import { isCapacitorNative, isIosCapacitor } from './native-bridge.js';
import { INSTALL_PAGE_URL, IOS_INSTALL_PAGE_URL, IOS_TESTFLIGHT_URL } from './distribution-config.js';

function versionUrl() {
  if (isBundledNativeApp() && APP_PRODUCTION_URL) {
    const base = APP_PRODUCTION_URL.replace(/\/$/, '') + '/';
    return new URL(`version.json?t=${Date.now()}`, base).href;
  }
  const base = window.__senriBase || `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return new URL(`version.json?t=${Date.now()}`, base).href;
}

/** APK に UI が同梱されているネイティブ版 */
export function isBundledNativeApp() {
  if (!isCapacitorNative()) return false;
  const host = location.hostname || '';
  return host === 'localhost' || host === '127.0.0.1';
}

async function fetchRemoteVersion() {
  try {
    const res = await fetch(versionUrl(), { cache: 'no-store' });
    if (!res.ok) return null;
    const remote = await res.json();
    if (!remote?.version || remote.version === APP_VERSION) return null;
    return remote;
  } catch {
    return null;
  }
}

async function applyUpdateSilently() {
  if ('serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
  }
  location.reload();
}

function showNativeUpdateBanner(remoteVersion) {
  if (document.getElementById('senri-native-update-banner')) return;

  const installUrl = isIosCapacitor() && IOS_TESTFLIGHT_URL
    ? IOS_TESTFLIGHT_URL
    : (isIosCapacitor()
      ? (IOS_INSTALL_PAGE_URL.startsWith('http')
        ? IOS_INSTALL_PAGE_URL
        : `${APP_PRODUCTION_URL?.replace(/\/$/, '') || location.origin}${IOS_INSTALL_PAGE_URL}`)
      : (INSTALL_PAGE_URL.startsWith('http')
        ? INSTALL_PAGE_URL
        : `${APP_PRODUCTION_URL?.replace(/\/$/, '') || location.origin}${INSTALL_PAGE_URL}`));
  const updateLabel = isIosCapacitor() ? 'iPhone版を更新' : 'Android版を更新';

  const banner = document.createElement('aside');
  banner.id = 'senri-native-update-banner';
  banner.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:9998',
    'background:#065954', 'color:#fff', 'padding:14px 16px',
    'font-family:sans-serif', 'font-size:14px', 'line-height:1.5',
    'box-shadow:0 -4px 20px rgba(0,0,0,.15)'
  ].join(';');
  banner.innerHTML =
    `<strong>新しいバージョン（v${remoteVersion}）があります</strong><br>` +
    `<a href="${installUrl}" style="color:#a7f3d0;font-weight:700">${updateLabel}</a>` +
    ' · ' +
    '<button type="button" id="senri-native-update-dismiss" style="background:none;border:none;color:#cce8e2;font-size:13px;padding:0">あとで</button>';

  document.body.appendChild(banner);
  document.getElementById('senri-native-update-dismiss')?.addEventListener('click', () => {
    try { sessionStorage.setItem('senri-update-dismiss', remoteVersion); } catch { /* ignore */ }
    banner.remove();
  });
}

/** 起動中に新しい版が配信されたら反映または案内 */
export async function initUpdateChecker() {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;

    const remote = await fetchRemoteVersion();
    if (!remote?.version) return;

    try {
      if (sessionStorage.getItem('senri-update-dismiss') === remote.version) return;
    } catch {
      /* ignore */
    }

    if (isBundledNativeApp()) {
      showNativeUpdateBanner(remote.version);
      return;
    }

    await applyUpdateSilently();
  });
}
