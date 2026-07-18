/**
 * Android 版（APK）インストール案内 — note 等 URL 配布向け
 */
import { ANDROID_APK_URL, INSTALL_PAGE_URL } from './distribution-config.js';
import { isAndroidCapacitor, isCapacitorNative } from './native-bridge.js';

const DISMISS_KEY = 'senri-android-install-dismiss';

function isAndroidWebUser() {
  if (isCapacitorNative()) return false;
  return /Android/i.test(navigator.userAgent || '');
}

function installPageUrl() {
  if (INSTALL_PAGE_URL.startsWith('http')) return INSTALL_PAGE_URL;
  const base = window.__senriBase || `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return new URL(INSTALL_PAGE_URL.replace(/^\//, ''), base).href;
}

export function initAndroidInstallPrompt() {
  if (!isAndroidWebUser()) return;

  try {
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
  } catch {
    /* ignore */
  }

  if (document.getElementById('senri-android-install-banner')) return;

  const banner = document.createElement('aside');
  banner.id = 'senri-android-install-banner';
  banner.className = 'android-install-banner';
  banner.innerHTML =
    '<div class="android-install-banner-inner">' +
    '<div class="android-install-banner-text">' +
    '<strong>常時で歩数を記録するには Android版</strong>' +
    '<span>画面を消しても歩数がたまります（note ご購入者向け・Play ストア不要）</span>' +
    '</div>' +
    '<div class="android-install-banner-actions">' +
    `<a class="btn btn-primary btn-block" href="${installPageUrl()}">Android版をインストール</a>` +
    (ANDROID_APK_URL
      ? `<a class="btn btn-secondary btn-block" href="${ANDROID_APK_URL}" download>APKを直接ダウンロード</a>`
      : '') +
    '<button type="button" class="android-install-dismiss" id="senri-android-install-dismiss">あとで</button>' +
    '</div></div>';

  document.body.appendChild(banner);
  document.body.classList.add('has-android-install-banner');

  document.getElementById('senri-android-install-dismiss')?.addEventListener('click', () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    banner.remove();
    document.body.classList.remove('has-android-install-banner');
  });
}

export function isAndroidApkInstalled() {
  return isAndroidCapacitor();
}

export { ANDROID_APK_URL, INSTALL_PAGE_URL };
