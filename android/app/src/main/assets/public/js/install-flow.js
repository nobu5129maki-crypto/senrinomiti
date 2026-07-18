/** Android インストール補助（有料 note · APK 配布） */
export const APP_PACKAGE = 'jp.senri.arukou';
export const APK_FILENAME = 'senrinomiti.apk';

export function detectBrowserPackage() {
  const ua = navigator.userAgent || '';
  if (/SamsungBrowser/i.test(ua)) return 'com.sec.android.app.sbrowser';
  if (/Firefox/i.test(ua)) return 'org.mozilla.firefox';
  if (/EdgA/i.test(ua)) return 'com.microsoft.emmx';
  return 'com.android.chrome';
}

export function isAndroidInAppBrowser() {
  const ua = navigator.userAgent || '';
  if (!/Android/i.test(ua)) return false;
  if (/Line\/|Instagram|FBAN|FBAV|Twitter|MicroMessenger|; wv\)/i.test(ua)) return true;
  // note アプリ等（Chrome 表記でも WebView 相当）
  if (/Notes?|note\.com|Hatena/i.test(ua)) return true;
  if (/Chrome\/\d+/i.test(ua) && !/; wv\)/i.test(ua)) return false;
  return true;
}

/** アプリ詳細（アンインストール） */
export function appDetailsIntentCandidates(packageName = APP_PACKAGE) {
  const pkg = packageName || APP_PACKAGE;
  return [
    `intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;data=package:${pkg};end`,
    `intent://settings/#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;S.android.intent.extra.PACKAGE_NAME=${pkg};end`,
    `package:${pkg}`,
  ];
}

/** 不明なアプリのインストール許可 */
export function unknownSourcesIntentCandidates(packageName = detectBrowserPackage()) {
  const pkg = packageName || 'com.android.chrome';
  return [
    `intent:#Intent;action=android.settings.MANAGE_UNKNOWN_APP_SOURCES;data=package:${pkg};end`,
    `intent:#Intent;action=android.settings.MANAGE_UNKNOWN_APP_SOURCES;end`,
    `intent:#Intent;action=android.settings.SECURITY_SETTINGS;end`,
  ];
}

/** ページを Chrome で開く候補 */
export function openInChromeCandidates(url) {
  const raw = String(url || '');
  const clean = raw.replace(/^https?:\/\//, '');
  const encoded = encodeURIComponent(raw);
  return [
    `intent://${clean}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;S.browser_fallback_url=${encoded};end`,
    `intent://${clean}#Intent;scheme=https;package=com.android.chrome;end`,
    `googlechrome://navigate?url=${encoded}`,
  ];
}

/** 単一 Intent を <a> クリックで開く（location.href 連鎖より確実） */
export function openHref(href) {
  if (!href) return false;
  try {
    const a = document.createElement('a');
    a.href = href;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    try {
      window.location.href = href;
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Intent を順に試す。
 * 以前は 600ms ごとに全部飛ばして打ち消し合っていたため、
 * 先頭を開き、ページが残っているときだけ次を試す。
 */
export function tryOpenHrefs(hrefs) {
  const list = (hrefs || []).filter(Boolean);
  if (!list.length) return false;

  let index = 0;
  const tryNext = () => {
    if (index >= list.length) return;
    openHref(list[index++]);
    if (index < list.length) {
      window.setTimeout(() => {
        // 画面がまだ見えている（遷移できていない）ときだけ次候補
        if (!document.hidden) tryNext();
      }, 900);
    }
  };
  tryNext();
  return true;
}

/** ボタン／リンクに Intent をバインド（JS 無効時は href 直リンク） */
export function bindIntentControl(el, hrefs, { onFail } = {}) {
  if (!el) return;
  const list = (hrefs || []).filter(Boolean);
  if (list[0] && el.tagName === 'A') {
    el.setAttribute('href', list[0]);
  }
  el.addEventListener('click', (event) => {
    // <a href="intent:..."> でも、連鎖フォールバックのため prevent して制御する
    event.preventDefault();
    const ok = tryOpenHrefs(list);
    if (!ok && typeof onFail === 'function') onFail();
  });
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
