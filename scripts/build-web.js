/**
 * Web 版のビルド。
 * - ソース (ルート) → www/ へ同期
 * - バージョン情報を注入
 * Vercel へデプロイするだけで、ネイティブアプリ利用者にも更新が届く。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const www = path.join(root, 'www');

const deploy = JSON.parse(
  fs.readFileSync(path.join(root, 'deploy.config.json'), 'utf8')
);
const appVersion = deploy.appVersion || '1.0.0';
const builtAt = new Date().toISOString();

const COPY_ITEMS = ['index.html', 'install.html', 'install-android.html', 'install-ios.html', 'privacy.html', 'terms.html', 'manifest.json', 'sw.js', 'css', 'js', 'icons', 'images'];

function absoluteUrl(base, pathValue) {
  if (!pathValue) return '';
  if (pathValue.startsWith('http')) return pathValue;
  return `${base.replace(/\/$/, '')}${pathValue.startsWith('/') ? pathValue : `/${pathValue}`}`;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyItem(item) {
  const src = path.join(root, item);
  if (!fs.existsSync(src)) return;
  copyRecursive(src, path.join(www, item));
}

function writeDistributionConfig() {
  const apkUrl = deploy.androidApkUrl || '';
  const apkInstallUrl = deploy.androidApkInstallUrl || apkUrl;
  const androidPackageId = deploy.androidPackageId || 'jp.senri.arukou';
  const productionUrl = deploy.productionUrl || '';
  const installPageUrl = absoluteUrl(productionUrl, deploy.installPagePath || '/install-android.html');
  const iosInstallPageUrl = absoluteUrl(productionUrl, deploy.iosInstallPagePath || '/install-ios.html');
  const installHubUrl = absoluteUrl(productionUrl, deploy.installHubPath || '/install.html');
  const iosTestFlightUrl = deploy.iosTestFlightUrl || '';

  const content = `/** 自動生成 — scripts/build-web.js */
export const ANDROID_APK_URL = '${apkUrl}';
export const ANDROID_APK_INSTALL_URL = '${apkInstallUrl}';
export const ANDROID_PACKAGE_ID = '${androidPackageId}';
export const INSTALL_PAGE_URL = '${installPageUrl}';
export const IOS_INSTALL_PAGE_URL = '${iosInstallPageUrl}';
export const INSTALL_HUB_URL = '${installHubUrl}';
export const IOS_TESTFLIGHT_URL = '${iosTestFlightUrl}';
export const PRODUCTION_URL = '${productionUrl}';
`;
  fs.writeFileSync(path.join(root, 'js', 'distribution-config.js'), content);
  fs.writeFileSync(path.join(www, 'js', 'distribution-config.js'), content);
}

function publishReleaseApk() {
  const releaseApk = path.join(root, 'release', 'senrinomiti.apk');
  if (!fs.existsSync(releaseApk)) return;
  const downloadDir = path.join(www, 'download');
  fs.mkdirSync(downloadDir, { recursive: true });
  fs.copyFileSync(releaseApk, path.join(downloadDir, 'senrinomiti.apk'));
}

function ensureDownloadDir() {
  const downloadDir = path.join(www, 'download');
  fs.mkdirSync(downloadDir, { recursive: true });
  const readme = path.join(downloadDir, 'README.txt');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      'ここにビルドした senrinomiti.apk を配置してください。\n' +
      'Android Studio: Build > Build Bundle(s) / APK(s) > Build APK(s)\n' +
      '出力例: android/app/build/outputs/apk/release/app-release.apk\n' +
      '→ www/download/senrinomiti.apk にコピーして Vercel へデプロイ\n',
      'utf8'
    );
  }
}

function writeAppVersion() {
  const content = `/** 自動生成 — scripts/build-web.js */\nexport const APP_VERSION = '${appVersion}';\nexport const APP_BUILT_AT = '${builtAt}';\nexport const APP_PRODUCTION_URL = '${deploy.productionUrl}';\n`;
  fs.writeFileSync(path.join(root, 'js', 'app-version.js'), content);
  fs.writeFileSync(path.join(www, 'js', 'app-version.js'), content);
}

function writeVersionJson(targetDir) {
  const payload = JSON.stringify(
    {
      version: appVersion,
      builtAt,
      productionUrl: deploy.productionUrl,
    },
    null,
    2
  );
  fs.writeFileSync(path.join(targetDir, 'version.json'), payload);
}

function writeNoteTemplate() {
  const productionUrl = (deploy.productionUrl || '').replace(/\/$/, '');
  const installPageUrl = absoluteUrl(productionUrl, deploy.installPagePath || '/install-android.html');
  const iosInstallPageUrl = absoluteUrl(productionUrl, deploy.iosInstallPagePath || '/install-ios.html');
  const installHubUrl = absoluteUrl(productionUrl, deploy.installHubPath || '/install.html');

  const templatePath = path.join(root, 'note-article-template.txt');
  if (!fs.existsSync(templatePath)) return;

  const filled = fs.readFileSync(templatePath, 'utf8')
    .replace(/\{\{INSTALL_PAGE_URL\}\}/g, installPageUrl)
    .replace(/\{\{IOS_INSTALL_PAGE_URL\}\}/g, iosInstallPageUrl)
    .replace(/\{\{INSTALL_HUB_URL\}\}/g, installHubUrl)
    .replace(/\{\{PRODUCTION_URL\}\}/g, productionUrl);

  fs.writeFileSync(path.join(root, 'note-article-filled.txt'), filled);
  fs.writeFileSync(path.join(www, 'note-article-filled.txt'), filled);
}

function injectSwVersion() {
  const swPath = path.join(www, 'sw.js');
  if (!fs.existsSync(swPath)) return;
  let sw = fs.readFileSync(swPath, 'utf8');
  sw = sw.replace(/__APP_VERSION__/g, appVersion);
  fs.writeFileSync(swPath, sw);
}

fs.mkdirSync(path.join(root, 'js'), { recursive: true });
fs.mkdirSync(www, { recursive: true });

for (const item of COPY_ITEMS) {
  copyItem(item);
}

writeAppVersion();
writeDistributionConfig();
ensureDownloadDir();
publishReleaseApk();
writeVersionJson(root);
writeVersionJson(www);
injectSwVersion();
writeNoteTemplate();

console.log(`Built web v${appVersion} → www/`);
console.log(`Deploy ${deploy.productionUrl} to push updates without rebuilding APK.`);
console.log(`Note buyers: share ${absoluteUrl(deploy.productionUrl || '', deploy.installHubPath || '/install.html')}`);
