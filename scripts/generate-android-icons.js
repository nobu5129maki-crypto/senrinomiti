/**
 * PWA アイコン (icons/icon-master.png) から Android ランチャー・スプラッシュを生成
 * node scripts/generate-android-icons.js
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const MASTER = path.join(ROOT, 'icons', 'icon-master.png');
const BACKGROUND = '#0c7a73';

const LAUNCHER_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

const SPLASH_SIZES = {
  'drawable': { width: 480, height: 320 },
  'drawable-port-mdpi': { width: 320, height: 480 },
  'drawable-port-hdpi': { width: 480, height: 800 },
  'drawable-port-xhdpi': { width: 720, height: 1280 },
  'drawable-port-xxhdpi': { width: 960, height: 1600 },
  'drawable-port-xxxhdpi': { width: 1280, height: 1920 },
  'drawable-land-mdpi': { width: 480, height: 320 },
  'drawable-land-hdpi': { width: 800, height: 480 },
  'drawable-land-xhdpi': { width: 1280, height: 720 },
  'drawable-land-xxhdpi': { width: 1600, height: 960 },
  'drawable-land-xxxhdpi': { width: 1920, height: 1280 },
};

async function writeSquareIcon(input, size, dest) {
  await sharp(input)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(dest);
}

async function writeSplash(input, width, height, dest) {
  const iconSize = Math.round(Math.min(width, height) * 0.38);
  const icon = await sharp(input).resize(iconSize, iconSize, { fit: 'cover' }).png().toBuffer();
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 238, g: 247, b: 244, alpha: 1 },
    },
  })
    .composite([{ input: icon, left: Math.round((width - iconSize) / 2), top: Math.round((height - iconSize) / 2) }])
    .png()
    .toFile(dest);
}

async function main() {
  if (!fs.existsSync(MASTER)) {
    console.error('icons/icon-master.png がありません。先に node scripts/generate-icons.js を実行してください。');
    process.exit(1);
  }

  for (const [folder, size] of Object.entries(LAUNCHER_SIZES)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    await writeSquareIcon(MASTER, size, path.join(dir, 'ic_launcher.png'));
    await writeSquareIcon(MASTER, size, path.join(dir, 'ic_launcher_round.png'));
    console.log('Created', `${folder}/ic_launcher.png`);
  }

  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    await writeSquareIcon(MASTER, size, path.join(dir, 'ic_launcher_foreground.png'));
    console.log('Created', `${folder}/ic_launcher_foreground.png`);
  }

  for (const [folder, { width, height }] of Object.entries(SPLASH_SIZES)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    await writeSplash(MASTER, width, height, path.join(dir, 'splash.png'));
    console.log('Created', `${folder}/splash.png`);
  }

  const bgFile = path.join(RES, 'values', 'ic_launcher_background.xml');
  fs.writeFileSync(
    bgFile,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BACKGROUND}</color>\n</resources>\n`,
  );
  console.log('Updated values/ic_launcher_background.xml');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
