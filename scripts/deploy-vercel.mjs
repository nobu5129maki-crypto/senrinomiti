/**
 * www を本番 Vercel へデプロイ（APK 同梱を確認）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apk = path.join(root, 'www', 'download', 'senrinomiti.apk');

if (!fs.existsSync(apk)) {
  console.error('www/download/senrinomiti.apk がありません。先に npm run copy:apk を実行してください。');
  process.exit(1);
}

const sizeMb = (fs.statSync(apk).size / (1024 * 1024)).toFixed(1);
console.log(`APK OK: ${apk} (${sizeMb} MB)`);

const steps = [
  ['node', ['scripts/copy-apk.js']],
  ['node', ['scripts/build-web.js']],
  ['npx', ['vercel', 'deploy', 'www', '--prod', '--yes', '--force']]
];

for (const [cmd, args] of steps) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status || 1);
}

console.log('\nDeploy finished. Verify: https://senrinomiti.vercel.app/download/senrinomiti.apk');
