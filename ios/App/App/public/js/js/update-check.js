/**
 * アプリ更新 — ユーザー操作なしで静かに反映
 */
import { APP_VERSION } from './app-version.js';

function versionUrl() {
  const base = window.__senriBase || `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return new URL(`version.json?t=${Date.now()}`, base).href;
}

async function fetchRemoteVersion() {
  try {
    const res = await fetch(versionUrl(), { cache: 'no-store' });
    if (!res.ok) return null;
    const remote = await res.json();
    if (!remote?.version || remote.version === APP_VERSION) return null;
    return remote.version;
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

/** 起動中に新しい版が配信されたら、次にアプリを開いたとき自動で反映 */
export async function initUpdateChecker() {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;
    const newer = await fetchRemoteVersion();
    if (newer) applyUpdateSilently();
  });
}
