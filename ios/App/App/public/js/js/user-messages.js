/**
 * ユーザー向けメッセージ（やさしい言葉・プラットフォーム別）
 */
import {
  isAndroidCapacitor,
  isAndroidPwaInstalled,
  isCapacitorNative,
  isIosCapacitor,
} from './native-bridge.js';

export function isNativeApp() {
  return isCapacitorNative();
}

export function isAndroidNative() {
  return isAndroidCapacitor();
}

export function isIosNative() {
  return isIosCapacitor();
}

export function isAndroidBrowser() {
  if (isCapacitorNative()) return false;
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua);
}

export function getInstallKind() {
  if (isAndroidCapacitor()) return 'android-apk';
  if (isIosCapacitor()) return 'ios-apk';
  if (isAndroidPwaInstalled()) return 'android-pwa';
  return 'browser';
}

/**
 * @param {{ googleFitConnected?: boolean, googleFitAvailable?: boolean, fitActive?: boolean, nativeActive?: boolean }} ctx
 */
export function pedometerHint(ctx = {}) {
  const { googleFitConnected, googleFitAvailable, fitActive, nativeActive } = ctx;
  const kind = getInstallKind();

  if (kind === 'android-apk' || nativeActive) {
    return '歩数は自動で記録されます。画面を消していても、今日の歩数が旅に反映されます。';
  }

  if (kind === 'ios-apk') {
    return '歩数は自動で記録されます。アプリを開くたびに、今日の歩数が旅に反映されます。';
  }

  if (kind === 'android-pwa') {
    return '現在はブラウザ版です。常時記録には note に記載の「Android版インストール」ページから APK をインストールしてください。';
  }

  if (fitActive || googleFitConnected) {
    return 'Google 連携により、画面を消していても端末が記録した歩数が旅に反映されます。';
  }

  if (isAndroidBrowser() && googleFitAvailable) {
    return '「Google アカウントと連携」で画面を消したあとも記録できます。常時記録には Android アプリ版もご利用ください。';
  }

  if (isAndroidBrowser()) {
    return '画面を開いている間は歩数を記録します。常時記録は note の「Android版インストール」から APK を入れてください。';
  }

  return '「計測を開始」で歩数を記録します。常時記録はスマホアプリ版をご利用ください。';
}

export function permissionNeededMessage() {
  if (isAndroidNative()) {
    return '歩数を記録するために、表示される画面で「許可」を選んでください。';
  }
  if (isIosNative()) {
    return '歩数を記録するために、モーション（フィットネス）の使用を許可してください。';
  }
  return '歩数を記録するには、端末の設定で許可が必要です。';
}

export function permissionDeniedMessage() {
  if (isNativeApp()) {
    return '歩数の記録がオフになっています。スマホの「設定 → アプリ → 千里の道も一歩から」から、身体活動（と通知）をオンにしてください。';
  }
  return '歩数の記録がオフになっています。端末の設定を確認してください。';
}

/** @param {{ fitActive?: boolean, nativeActive?: boolean, installKind?: string }} ctx */
export function measuringStatusLabel(ctx = {}) {
  const { fitActive, nativeActive, installKind = getInstallKind() } = ctx;
  if (nativeActive || installKind === 'android-apk') {
    return '自動で記録中（画面を消してもOK）';
  }
  if (installKind === 'ios-apk') {
    return '自動で記録中';
  }
  if (fitActive) {
    return '自動で記録中（Google連携）';
  }
  if (installKind === 'android-pwa') {
    return '記録中（ブラウザ版）';
  }
  return '記録中（アプリ表示中）';
}

export function googleFitConnectLabel() {
  return 'Google アカウントと連携（画面を消しても記録）';
}

export function googleFitSuccessMessage() {
  return '連携しました。画面を消していても、端末が記録した歩数が旅に反映されます。';
}

export function googleFitFailMessage() {
  return '連携できませんでした。しばらくしてからもう一度お試しください。';
}

export function pwaInstallWarning() {
  return 'ブラウザ版では画面を消すと歩数の記録が止まります。常時記録には note に記載の Android版（APK）をインストールしてください。';
}
