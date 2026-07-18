/**
 * iPhone 版インストール案内 — note 購入者向け（負担を最小化）
 */
import { IOS_INSTALL_PAGE_URL, IOS_TESTFLIGHT_URL } from './distribution-config.js';
import { isCapacitorNative, isIosPwaInstalled } from './native-bridge.js';

const DISMISS_KEY = 'senri-ios-install-dismiss';

export function isIosBrowser() {
  if (isCapacitorNative()) return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/i.test(ua) && !window.MSStream;
}

export function isIosSafariBrowser() {
  if (!isIosBrowser()) return false;
  const ua = navigator.userAgent || '';
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|Line|Instagram|FBAN|FBAV/i.test(ua);
}

function installPageUrl() {
  if (IOS_INSTALL_PAGE_URL.startsWith('http')) return IOS_INSTALL_PAGE_URL;
  const base = window.__senriBase || `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return new URL(IOS_INSTALL_PAGE_URL.replace(/^\//, ''), base).href;
}

export function initIosInstallPrompt() {
  if (!isIosBrowser() || isIosPwaInstalled()) return;

  try {
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
  } catch {
    /* ignore */
  }

  if (document.getElementById('senri-ios-install-banner')) return;

  const inSafari = isIosSafariBrowser();
  const banner = document.createElement('aside');
  banner.id = 'senri-ios-install-banner';
  banner.className = 'ios-install-banner';
  banner.innerHTML =
    '<div class="ios-install-banner-inner">' +
    '<div class="ios-install-banner-text">' +
    '<strong>iPhone版をホーム画面に追加</strong>' +
    `<span>${inSafari ? '約30秒・App Store不要。次回からワンタップで開けます' : 'Safari で開くと、3タップでインストールできます'}</span>` +
    '</div>' +
    '<div class="ios-install-banner-actions">' +
    `<a class="btn btn-primary btn-block" href="${installPageUrl()}">${inSafari ? '追加手順を見る' : 'Safariで開く'}</a>` +
    (IOS_TESTFLIGHT_URL
      ? `<a class="btn btn-secondary btn-block" href="${IOS_TESTFLIGHT_URL}">TestFlight版</a>`
      : '') +
    '<button type="button" class="ios-install-dismiss" id="senri-ios-install-dismiss">あとで</button>' +
    '</div></div>';

  document.body.appendChild(banner);
  document.body.classList.add('has-ios-install-banner');

  document.getElementById('senri-ios-install-dismiss')?.addEventListener('click', () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    banner.remove();
    document.body.classList.remove('has-ios-install-banner');
  });
}
