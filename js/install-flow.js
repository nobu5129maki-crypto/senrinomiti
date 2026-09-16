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

export function isAndroidUser(ua = navigator.userAgent || '') {
  return /Android/i.test(ua);
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

function intentUrl(hostPath, extras = '') {
  return `intent://${hostPath}#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;launchFlags=0x10000000${extras};end`;
}

function toHostPath(url) {
  try {
    const parsed = new URL(url, 'https://senrinomiti.vercel.app');
    return `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return String(url || '').replace(/^https?:\/\//, '');
  }
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

/** ページを Chrome で開く候補（先頭を <a href> に使う） */
export function openInChromeCandidates(url) {
  const raw = String(url || 'https://senrinomiti.vercel.app/install.html');
  const hostPath = toHostPath(raw);
  const encoded = encodeURIComponent(raw);
  return [
    intentUrl(hostPath, `;S.browser_fallback_url=${encoded}`),
    intentUrl(hostPath),
    `googlechrome://${hostPath}`,
  ];
}

/** 同じタップ内で外部アプリを開く（新規 <a> のプログラムクリックは WebView に無視される） */
export function openHref(href) {
  if (!href) return false;
  try {
    window.location.href = href;
    return true;
  } catch {
    return false;
  }
}

export function tryOpenHrefs(hrefs) {
  const list = (hrefs || []).filter(Boolean);
  if (!list.length) return false;
  return openHref(list[0]);
}

/**
 * ボタン／リンクに Intent をバインド。
 * アプリ内ブラウザは「ユーザーが押した <a href="intent:">」だけを外部アプリに渡す。
 * preventDefault や別要素のクリックは無反応になるため、アンカーはネイティブ遷移に任せる。
 */
export function bindIntentControl(el, hrefs, { onFail, onClick, ua } = {}) {
  if (!el) return;
  const list = (hrefs || []).filter(Boolean);
  if (list[0] && el.tagName === 'A') {
    el.setAttribute('href', list[0]);
  }
  el.addEventListener('click', (event) => {
    if (typeof onClick === 'function') onClick(event);
    const android = isAndroidUser(ua ?? navigator.userAgent ?? '');
    // Android のアプリ内ブラウザは、ユーザーが押した <a href="intent:"> だけを外部へ渡す
    if (el.tagName === 'A' && list[0] && android) {
      return;
    }
    event.preventDefault();
    if (!android) return;
    const ok = tryOpenHrefs(list);
    if (!ok && typeof onFail === 'function') onFail();
  });
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await withTimeout(navigator.clipboard.writeText(text), 400);
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
