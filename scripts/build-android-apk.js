/**
 * Android リリース APK をビルドし www/download/ へ配置（有料 note 配布用）
 *
 * 前提:
 * - JDK 17+、Android SDK
 * - 初回: android/keystore.properties を keystore.properties.example から作成
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const gradlew = process.platform === 'win32'
  ? path.join(androidDir, 'gradlew.bat')
  : path.join(androidDir, 'gradlew');

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runNode(script) {
  const node = process.execPath.includes(' ') ? `"${process.execPath}"` : process.execPath;
  const scriptPath = path.join(root, 'scripts', script);
  const result = spawnSync(`${node} "${scriptPath}"`, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('1/4 Sync Android version…');
runNode('sync-android-version.js');

console.log('2/4 Build web assets…');
runNode('build-web.js');

console.log('2b/4 Remove APK from www before cap sync…');
runNode('prune-www-apk.js');

console.log('3/4 Capacitor sync（ネイティブ同梱モード）…');
run('npx', ['cap', 'sync', 'android'], root);

const keystoreProps = path.join(androidDir, 'keystore.properties');
if (!fs.existsSync(keystoreProps)) {
  console.warn('');
  console.warn('⚠ android/keystore.properties がありません。');
  console.warn('  リリース署名なしで debug キーでビルドします（配布用には署名設定を推奨）。');
  console.warn('  android/keystore.properties.example を参考に作成してください。');
  console.warn('');
}

console.log('4/4 Gradle assembleRelease…');
run(gradlew, ['assembleRelease'], androidDir);

console.log('');
console.log('Copy APK to www/download/…');
runNode('copy-apk.js');

console.log('');
console.log('✓ APK ready: www/download/senrinomiti.apk');
console.log('  次: Vercel へデプロイ（npm run deploy:note で Web + APK を同梱）');
