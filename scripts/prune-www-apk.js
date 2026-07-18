/**
 * cap sync 前に www/download/*.apk を削除する。
 * 旧 APK がネイティブ資産に同梱されると APK サイズが肥大化し Vercel 上限を超える。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const downloadDir = path.join(__dirname, '..', 'www', 'download');

if (!fs.existsSync(downloadDir)) {
  process.exit(0);
}

for (const name of fs.readdirSync(downloadDir)) {
  if (!name.toLowerCase().endsWith('.apk')) continue;
  const file = path.join(downloadDir, name);
  fs.unlinkSync(file);
  console.log(`Removed ${file} (exclude from native bundle)`);
}
