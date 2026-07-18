/**
 * 有料 note 購入者向け — Android 版（APK）インストール案内
 * ブラウザで開いた購入者に、常時記録のためのネイティブ版を案内する
 */
import { INSTALL_PAGE_URL } from './distribution-config.js';
import * as userMsg from './user-messages.js';

const DONE_KEY = 'senri-native-install-guide-done';

function isAndroidWebBuyer() {
  return userMsg.isAndroidBrowser?.() && !userMsg.isNativeApp();
}

function shouldShowGuide() {
  if (!isAndroidWebBuyer()) return false;
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
  if (INSTALL_PAGE_URL.startsWith('http')) return INSTALL_PAGE_URL;
  const base = `${location.origin}${location.pathname.replace(/[^/]*$/, '')}`;
  return new URL(INSTALL_PAGE_URL.replace(/^\//, ''), base).href;
}

function showInstallGuideModal() {
  return new Promise((resolve) => {
    if (document.getElementById('senri-native-install-modal')) {
      resolve(false);
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'senri-native-install-modal';
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
      '<h2 style="margin:0 0 12px;font-size:20px;color:#065954">Android版をインストール</h2>' +
      '<p style="margin:0 0 20px;line-height:1.7;font-size:15px">' +
      '常時で歩数を記録するには、<strong>Android版アプリ</strong>のインストールが必要です。' +
      '画面を消していても、今日の歩数が旅に反映されます。Play ストアは不要です。' +
      '</p>' +
      `<a id="senri-native-install-go" href="${installUrl()}" style="display:block;width:100%;padding:14px;border:none;border-radius:12px;background:#0c7a73;color:#fff;font-size:16px;font-weight:700;text-align:center;text-decoration:none;margin-bottom:10px;box-sizing:border-box">インストール手順を見る</a>` +
      '<button type="button" id="senri-native-install-skip" style="width:100%;padding:12px;border:none;border-radius:12px;background:#eef7f4;color:#5f7a75;font-size:14px">あとで（ブラウザ版で試す）</button>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('senri-native-install-go')?.addEventListener('click', () => {
      markDone();
      overlay.remove();
      resolve(true);
    });

    document.getElementById('senri-native-install-skip')?.addEventListener('click', () => {
      markDone();
      overlay.remove();
      resolve(false);
    });
  });
}

/** Android ブラウザ初回: ネイティブ版インストールを案内 */
export async function runNativeInstallGuideIfNeeded() {
  if (!shouldShowGuide()) return false;
  await showInstallGuideModal();
  return true;
}

export function dismissNativeInstallGuide() {
  markDone();
}
