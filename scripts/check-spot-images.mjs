/**
 * image-urls.js の Wikimedia URL を順次 HEAD チェック（レート制限対策で間隔あり）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = fs.readFileSync(path.join(root, 'js/image-urls.js'), 'utf8');

const entries = [];
const re = /(\w+):\s*'(https:\/\/upload\.wikimedia\.org[^']+)'/g;
let m;
while ((m = re.exec(text))) {
  entries.push({ key: m[1], url: m[2] });
}

const broken = [];
const ok = [];
const limited = [];

for (const { key, url } of entries) {
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (r.status === 429) limited.push(key);
    else if (r.ok) ok.push(key);
    else broken.push({ key, status: r.status, url });
  } catch (e) {
    broken.push({ key, status: 'ERR', url, err: e.message });
  }
  await new Promise((r) => setTimeout(r, 400));
}

console.log(`OK ${ok.length} / 404ish ${broken.length} / 429 ${limited.length} (total ${entries.length})`);
for (const b of broken) {
  console.log(`${b.status}\t${b.key}\t${b.url}`);
}
