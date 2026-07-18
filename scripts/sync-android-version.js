/**
 * deploy.config.json のバージョンを Android build.gradle に反映
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
const deploy = JSON.parse(
  fs.readFileSync(path.join(root, 'deploy.config.json'), 'utf8')
);

const versionName = deploy.appVersion || '1.0.0';
const versionCode = Number(deploy.androidVersionCode) || parseVersionCode(versionName);

function parseVersionCode(semver) {
  const parts = String(semver).split('.').map((n) => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  return parts[0] * 10000 + parts[1] * 100 + parts[2];
}

let gradle = fs.readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${versionName}"`);
fs.writeFileSync(gradlePath, gradle);

console.log(`Android version → ${versionName} (${versionCode})`);
