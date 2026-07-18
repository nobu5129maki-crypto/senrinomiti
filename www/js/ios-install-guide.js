/**
 * iPhone ブラウザ初回 — ホーム画面追加を案内（Android版と同様の購入者導線）
 */
import { IOS_INSTALL_PAGE_URL } from './distribution-config.js';
import { isIosBrowser, isIosSafariBrowser } from './ios-install.js';
import { isCapacitorNative, isIosPwaInstalled } from './native-bridge.js';

const DONE_KEY = 'senri-ios-install-guide-done';

function shouldShowGuide() {
  if (!isIosBrowser() || isCapacitorNative() || isIosPwaInstalled()) return false;
  try {
    return localStorage.getItem(DONE_KEY) !== '1';
  } catch {
    return true;
  }
}

function markDone() {
  try {
    localStorage.setItem(DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

function installUrl() {
  if (IOS_INSTALL_PAGE_URL.startsWith('http')) return IOS_INSTALL_PAGE_URL;
  const base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return new URL(IOS_INSTALL_PAGE_URL.replace(/^\//, ''), base).href;
}

function showInstallGuideModal() {
  return new Promise((resolve) => {
    if (document.getElementById('senri-ios-install-modal')) {
      resolve(false);
      return;
    }

    const inSafari = isIosSafariBrowser();
    const overlay = document.createElement('div');
    overlay.id = 'senri-ios-install-modal';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:10001', 'background:rgba(6,57,52,.5)',
      'display:flex', 'align-items:center', 'justify-content:center', 'padding:20px'
    ].join(';');

    const card = document.createElement('div');
    card.style.cssText = [
      'background:#fff', 'border-radius:16px', 'padding:24px', 'max-width:380px', 'width:100%',
      'font-family:sans-serif', 'color:#1a3d38', 'box-shadow:0 12px 40px rgba(0,0,0,.2)'
    ].join(';');

    card.innerHTML =
      '<span style="display:inline-block;background:#ecfdf5;color:#065954;font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:999px;margin-bottom:10px">有料 note ご購入者向け</span>' +
      '<h2 style="margin:0 0 12px;font-size:20px;color:#065954">iPhone版を追加</h2>' +
      '<p style="margin:0 0 20px;line-height:1.7;font-size:15px">' +
      (inSafari
        ? 'ホーム画面に追加すると、<strong>アプリのようにワンタップ</strong>で開けます。App Store 不要・約30秒で完了します。'
        : 'インストール手順ページを <strong>Safari</strong> で開くと、3タップでホーム画面に追加できます。') +
      '</p>' +
      `<a id="senri-ios-install-go" href="${installUrl()}" style="display:block;width:100%;padding:14px;border:none;border-radius:12px;background:#0c7a73;color:#fff;font-size:16px;font-weight:700;text-align:center;text-decoration:none;margin-bottom:10px;box-sizing:border-box">${inSafari ? '追加手順を見る' : 'Safariで手順を見る'}</a>` +
      '<button type="button" id="senri-ios-install-skip" style="width:100%;padding:12px;border:none;border-radius:12px;background:#eef7f4;color:#5f7a75;font-size:14px">あとで（ブラウザのまま使う）</button>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('senri-ios-install-go')?.addEventListener('click', () => {
      markDone();
      overlay.remove();
      resolve(true);
    });

    document.getElementById('senri-ios-install-skip')?.addEventListener('click', () => {
      markDone();
      overlay.remove();
      resolve(false);
    });
  });
}

export async function runIosInstallGuideIfNeeded() {
  if (!shouldShowGuide()) return false;
  await showInstallGuideModal();
  return true;
}

export function dismissIosInstallGuide() {
  markDone();
}
