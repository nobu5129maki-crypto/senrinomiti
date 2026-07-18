/**
 * ユーザー向けメッセージ（やさしい言葉・プラットフォーム別）
 */
import {
  isAndroidCapacitor,
  isAndroidPwaInstalled,
  isCapacitorNative,
  isIosCapacitor,
  isIosPwaInstalled,
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

export function isIosBrowser() {
  if (isCapacitorNative()) return false;
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/i.test(ua) && !window.MSStream;
}

export function getInstallKind() {
  if (isAndroidCapacitor()) return 'android-apk';
  if (isIosCapacitor()) return 'ios-apk';
  if (isAndroidPwaInstalled()) return 'android-pwa';
  if (isIosPwaInstalled()) return 'ios-pwa';
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

  if (kind === 'ios-pwa') {
    return 'ホーム画面版をご利用中です。画面を開いている間、歩数が旅に反映されます。';
  }

  if (kind === 'android-pwa' || isAndroidBrowser()) {
    return '画面を開いている間は歩数を記録します。常時記録には note に記載の Android版をインストールしてください。';
  }

  if (fitActive || googleFitConnected) {
    return 'Google 連携により、画面を消していても端末が記録した歩数が旅に反映されます。';
  }

  if (googleFitAvailable) {
    return '常時記録には Android版（APK）のインストールをおすすめします。';
  }

  if (isIosBrowser()) {
    return '「計測を開始」で歩数を記録します。ホーム画面に追加すると、アプリのようにすぐ開けます。';
  }

  return '「計測を開始」で歩数を記録します。';
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
  if (isAndroidNative()) {
    return '歩数の記録がオフになっています。スマホの「設定 → アプリ → 千里の道」から、身体活動（と通知）をオンにしてください。';
  }
  if (isIosNative() || isIosPwaInstalled()) {
    return '歩数の記録がオフになっています。「設定 → プライバシーとセキュリティ → モーションとフィットネス → 千里の道」をオンにしてください。';
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
  if (installKind === 'ios-pwa') {
    return '記録中（ホーム画面版）';
  }
  if (fitActive) {
    return '自動で記録中（Google連携）';
  }
  if (installKind === 'android-pwa' || isAndroidBrowser()) {
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

export function iosInstallHint() {
  return 'ホーム画面に追加すると、App Store 不要でアプリのように使えます。';
}

export function nativeAppInstallWarning() {
  return '画面を消すと歩数の記録が止まります。常時記録には note に記載の Android版をインストールしてください。';
}

export function iosWebInstallWarning() {
  return 'iPhone のブラウザ版は、画面を開いている間に歩数を記録します。ホーム画面に追加すると、次回からワンタップで開けます。';
}

export function pwaInstallWarning() {
  return nativeAppInstallWarning();
}

export function webBackgroundConnectWarning() {
  return nativeAppInstallWarning();
}
