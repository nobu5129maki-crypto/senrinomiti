/**
 * PWA 用 PNG アイコン生成
 * node scripts/generate-icons.js
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ICONS = path.join(ROOT, 'icons');
const ASSETS = path.join(ROOT, 'images');

const MASTER_CANDIDATES = [
  path.join(ROOT, 'icons', 'icon-master.png'),
  path.join(ROOT, 'assets', 'app-icon-master.png'),
  path.join(process.env.USERPROFILE || '', '.cursor', 'projects', 'c-Users-Admin-Desktop', 'assets', 'app-icon-master.png')
];

function findMaster() {
  for (const p of MASTER_CANDIDATES) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** マスク可能アイコン用（Android セーフゾーン 80%） */
async function toMaskable(input, size, dest) {
  const inner = Math.round(size * 0.72);
  const pad = Math.round((size - inner) / 2);
  const resized = await sharp(input).resize(inner, inner, { fit: 'cover' }).png().toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 12, g: 122, b: 115, alpha: 1 }
    }
  })
    .composite([{ input: resized, left: pad, top: pad }])
    .png()
    .toFile(dest);
}

async function main() {
  fs.mkdirSync(ICONS, { recursive: true });
  fs.mkdirSync(ASSETS, { recursive: true });

  let master = findMaster();
  if (!master) {
    console.error('Master icon not found. Place icon-master.png in icons/');
    process.exit(1);
  }

  if (!fs.existsSync(path.join(ICONS, 'icon-master.png'))) {
    fs.copyFileSync(master, path.join(ICONS, 'icon-master.png'));
    master = path.join(ICONS, 'icon-master.png');
  }

  const sizes = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'icon-maskable-192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512.png', size: 512, maskable: true }
  ];

  for (const { name, size, maskable } of sizes) {
    const dest = path.join(ICONS, name);
    if (maskable) {
      await toMaskable(master, size, dest);
    } else {
      await sharp(master).resize(size, size, { fit: 'cover' }).png().toFile(dest);
    }
    console.log('Created', name);
  }

  // スプラッシュ / ブランディング用
  await sharp(master)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(path.join(ASSETS, 'og-image.png'));
  console.log('Created images/og-image.png');

  await sharp({
    create: {
      width: 1170,
      height: 2532,
      channels: 4,
      background: { r: 240, g: 253, b: 250, alpha: 1 }
    }
  })
    .composite([
      {
        input: await sharp(master).resize(320, 320).png().toBuffer(),
        left: 425,
        top: 900
      }
    ])
    .png()
    .toFile(path.join(ASSETS, 'splash.png'));
  console.log('Created images/splash.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
