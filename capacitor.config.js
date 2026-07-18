import deploy from './deploy.config.json' with { type: 'json' };

/**
 * ネイティブアプリ（デフォルト）: www を APK / IPA に同梱
 * CAP_REMOTE=1 のときのみ Vercel から UI を読み込む（開発・OTA 更新用）
 */
const useRemoteWeb = process.env.CAP_REMOTE === '1';

/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'jp.senri.arukou',
  appName: '千里の道も一歩から',
  webDir: 'www',
  server: useRemoteWeb
    ? {
        url: deploy.productionUrl,
        androidScheme: 'https',
        cleartext: false,
      }
    : {
        androidScheme: 'https',
      },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
