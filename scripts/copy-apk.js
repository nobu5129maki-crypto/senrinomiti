/**
 * ビルド済み APK を www/download/ へコピーする（note 配布用）
 * 使い方: node scripts/copy-apk.js [apkファイルのパス]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dest = path.join(root, 'www', 'download', 'senrinomiti.apk');

const defaultCandidates = [
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.join('C:', 'dev', 'senrinomiti-main', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
  path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
];

const src = process.argv[2]
  || defaultCandidates
    .filter((candidate) => fs.existsSync(candidate))
    .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];

if (!src || !fs.existsSync(src)) {
  console.error('APK が見つかりません:', src || '(候補なし)');
  console.error('Android Studio で APK をビルド後、以下を実行してください:');
  console.error('  node scripts/copy-apk.js path/to/app-release.apk');
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);

const releaseDir = path.join(root, 'release');
const releaseDest = path.join(releaseDir, 'senrinomiti.apk');
fs.mkdirSync(releaseDir, { recursive: true });
fs.copyFileSync(src, releaseDest);

console.log(`Copied → ${dest}`);
console.log(`Copied → ${releaseDest}`);
console.log('次: npm run build:web && Vercel へデプロイ');
