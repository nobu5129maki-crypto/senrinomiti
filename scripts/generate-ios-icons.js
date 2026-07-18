/**
 * PWA アイコン (icons/icon-master.png) から iOS AppIcon・スプラッシュを生成
 * node scripts/generate-ios-icons.js
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets');
const MASTER = path.join(ROOT, 'icons', 'icon-master.png');
const SPLASH_BG = { r: 238, g: 247, b: 244, alpha: 1 };

async function writeAppIcon(input, dest) {
  await sharp(input)
    .resize(1024, 1024, { fit: 'cover' })
    .flatten({ background: SPLASH_BG })
    .png()
    .toFile(dest);
}

async function writeSplash(input, size, dest) {
  const iconSize = Math.round(size * 0.28);
  const icon = await sharp(input).resize(iconSize, iconSize, { fit: 'cover' }).png().toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: SPLASH_BG,
    },
  })
    .composite([{ input: icon, left: Math.round((size - iconSize) / 2), top: Math.round((size - iconSize) / 2) }])
    .png()
    .toFile(dest);
}

async function main() {
  if (!fs.existsSync(MASTER)) {
    console.error('icons/icon-master.png がありません。先に node scripts/generate-icons.js を実行してください。');
    process.exit(1);
  }

  const appIconDir = path.join(ASSETS, 'AppIcon.appiconset');
  fs.mkdirSync(appIconDir, { recursive: true });
  await writeAppIcon(MASTER, path.join(appIconDir, 'AppIcon-512@2x.png'));
  console.log('Created AppIcon.appiconset/AppIcon-512@2x.png');

  const splashDir = path.join(ASSETS, 'Splash.imageset');
  fs.mkdirSync(splashDir, { recursive: true });
  const splashFiles = [
    'splash-2732x2732-2.png',
    'splash-2732x2732-1.png',
    'splash-2732x2732.png',
  ];
  for (const name of splashFiles) {
    await writeSplash(MASTER, 2732, path.join(splashDir, name));
    console.log('Created Splash.imageset/' + name);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
