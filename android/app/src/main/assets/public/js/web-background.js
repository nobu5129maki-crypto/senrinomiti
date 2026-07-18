/**
 * Web版（note URL のみ）向け — Google 連携で常時記録に近づける案内
 * Android: Google Fit / 端末が BG で記録 → 復帰時に Web が同期
 * iOS Web: OS 制限により完全な BG 計測は不可
 */
import * as pedometer from './pedometer.js';
import * as userMsg from './user-messages.js';

const DONE_KEY = 'senri-web-fit-onboarding-done';

function isAndroidWeb() {
  return userMsg.isAndroidBrowser?.() && !userMsg.isNativeApp();
}

function shouldOfferGoogleFit() {
  if (!isAndroidWeb()) return false;
  if (!pedometer.isGoogleFitConfigured?.()) return false;
  if (pedometer.isGoogleFitConnected?.()) return false;
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

function showGoogleFitWelcome(onConnect) {
  return new Promise((resolve) => {
    if (document.getElementById('senri-web-fit-modal')) {
      resolve(false);
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'senri-web-fit-modal';
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
      '<h2 style="margin:0 0 12px;font-size:20px;color:#065954">常時で歩数を記録</h2>' +
      '<p style="margin:0 0 20px;line-height:1.7;font-size:15px">' +
      'Android の Web 版では、<strong>Google アカウントと連携</strong>すると、' +
      '画面を消していても端末が記録した歩数をあとから自動で反映できます。' +
      '</p>' +
      '<button type="button" id="senri-web-fit-connect" style="width:100%;padding:14px;border:none;border-radius:12px;background:#0c7a73;color:#fff;font-size:16px;font-weight:700;margin-bottom:10px">Google と連携する</button>' +
      '<button type="button" id="senri-web-fit-skip" style="width:100%;padding:12px;border:none;border-radius:12px;background:#eef7f4;color:#5f7a75;font-size:14px">あとで（画面表示中のみ記録）</button>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('senri-web-fit-connect')?.addEventListener('click', async () => {
      overlay.remove();
      markDone();
      try {
        await onConnect?.();
        resolve(true);
      } catch {
        resolve(false);
      }
    });

    document.getElementById('senri-web-fit-skip')?.addEventListener('click', () => {
      overlay.remove();
      markDone();
      resolve(false);
    });
  });
}

/** Android Web 初回: Google 連携を案内 */
export async function runWebBackgroundSetupIfNeeded(onAfterConnect) {
  if (!shouldOfferGoogleFit()) return false;
  await showGoogleFitWelcome(async () => {
    await pedometer.connectGoogleFit();
    if (onAfterConnect) await onAfterConnect();
  });
  return true;
}

export function isWebBackgroundCapable() {
  return isAndroidWeb() && pedometer.isGoogleFitConfigured?.();
}

export function isWebBackgroundActive() {
  return pedometer.isGoogleFitPedometerActive?.() || pedometer.isGoogleFitConnected?.();
}
