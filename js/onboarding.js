/**
 * 初回起動時のやさしい案内（1回だけ）
 */
import * as msg from './user-messages.js';

const DONE_KEY = 'senri-welcome-done';

function shouldShowWelcome() {
  if (msg.isAndroidNative() || msg.isIosNative()) {
    try {
      return localStorage.getItem(DONE_KEY) !== '1';
    } catch {
      return true;
    }
  }
  return false;
}

function markWelcomeDone() {
  try {
    localStorage.setItem(DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

function showWelcomeModal(onStart) {
  return new Promise((resolve) => {
    if (document.getElementById('senri-welcome-modal')) {
      resolve(true);
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'senri-welcome-modal';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:10000', 'background:rgba(6,57,52,.45)',
      'display:flex', 'align-items:center', 'justify-content:center', 'padding:20px'
    ].join(';');

    const card = document.createElement('div');
    card.style.cssText = [
      'background:#fff', 'border-radius:16px', 'padding:24px', 'max-width:360px', 'width:100%',
      'font-family:sans-serif', 'color:#1a3d38', 'box-shadow:0 12px 40px rgba(0,0,0,.18)'
    ].join(';');

    card.innerHTML =
      '<h2 style="margin:0 0 12px;font-size:20px;color:#065954">歩数を自動で記録</h2>' +
      '<p style="margin:0 0 20px;line-height:1.7;font-size:15px">' +
      '千里の道も一歩からは、歩数を自動で記録して旅に反映します。' +
      (msg.isAndroidNative()
        ? '画面を消していても、今日の歩数がたまっていきます。'
        : msg.isIosNative()
          ? 'アプリを開くたびに、今日の歩数が旅に反映されます。'
          : '歩数を自動で記録して旅に反映します。') +
      '</p>' +
      '<button type="button" id="senri-welcome-start" style="width:100%;padding:14px;border:none;border-radius:12px;background:#0c7a73;color:#fff;font-size:16px;font-weight:700">はじめる</button>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('senri-welcome-start')?.addEventListener('click', async () => {
      overlay.remove();
      markWelcomeDone();
      if (typeof onStart === 'function') {
        await onStart();
      }
      resolve(true);
    });
  });
}

/** 初回のみ案内を表示し、計測開始処理を呼ぶ */
export async function runWelcomeIfNeeded(onStart) {
  if (!shouldShowWelcome()) return false;
  await showWelcomeModal(onStart);
  return true;
}

export function dismissWelcomePermanently() {
  markWelcomeDone();
}
