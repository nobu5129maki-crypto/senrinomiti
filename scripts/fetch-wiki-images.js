/**
 * 名所画像を Wikimedia からダウンロードし image-urls.js を生成
 * node scripts/fetch-wiki-images.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../images/spots');
const DELAY_MS = 1500;

/** Wikimedia Commons ファイル名 → ローカルキー */
const FILES = {
  tokyoTower: 'Tokyo Tower, Minato City.jpg',
  tokyoSkytree: "Worm's-eye view of Tokyo Skytree with vertical symmetry impression, a sunny day, in Japan.jpg",
  sensoji: 'Five-storied Pagoda of Sensoji Temple in Tokyo, 20240821 1616 5263.jpg',
  meijiJingu: 'Torii of Meiji Shrine 2018.jpg',
  fuji: 'Mount Fuji at sunset, March 2025.jpg',
  fushimiInari: 'KyotoFushimiInariLarge.jpg',
  tokyoDisneyland: 'Cinderella Castle at Tokyo Disneyland 201306.jpg',
  kinkakuji: 'Kinkakuji 2004-09-21.jpg',
  dotonbori: 'Dotonbori, Osaka, at night, November 2016.jpg',
  itsukushima: 'Itsukushima Gate.jpg',
  kenrokuen: 'Kenrokuen In early spring.jpg',
  yokohamaMinatoMirai: 'Minato Mirai 21 skyline at night, Yokohama, Japan.jpg',
  hakoneFuji: '080315 Fuji Hakone Izu National Park Japan.JPG',
  shizuokaTea: 'Green tea fields in Shizuoka 1.jpg',
  nagoyaCastle: 'Nagoya Castle(Larger).jpg',
  kobePort: 'Kobe Port Tower, November 2016.jpg',
  hiroshimaDome: 'Genbaku Dome04-r.JPG',
  fukuokaOhori: 'Ohori Park Fukuoka.jpg',
  sapporoClock: 'Sapporo Clock Tower, Hokkaido, Japan.jpg',
  matsushima: 'Matsushima miyagi.jpg',
  naraDeer: 'Nara Park Deers.JPG',
  tokyoDome: 'Tokyo Dome 2015.jpg',
  enoshima: 'Enoshima Island and Fujisawa city.jpg',
  roppongiHills: 'Roppongi Hills Mori Tower.jpg',
  odaiba: 'Rainbow Bridge at night from Odaiba, Tokyo.jpg',
  shibuyaScramble: 'Shibuya Crossing (2018).jpg',
  nationalStadium: 'Japan National Stadium in 2024.jpg',
  nikkoToshogu: 'Nikko Toshogu 01.jpg',
  himejiCastle: 'Himeji castle in may 2015.jpg',
  osakaCastle: 'Osaka Castle 02bs3200.jpg',
  kiyomizudera: 'Kiyomizu-dera, Kyoto, November 2016 -01.jpg',
  shirakawago: 'Shirakawa-go, Gifu, Japan.jpg',
  kamakuraDaibutsu: 'Kamakura Daibutsu from front.jpg',
  todaiji: 'Great Buddha in Todaiji Nara Japan01.jpg',
  koyasan: 'Danjo Garan Koyasan Japan06s4592.jpg',
  arashiyama: 'Arashiyama, Kyoto, Japan.jpg',
  izumoTaisha: 'Izumo-taisha in Japan.jpg',
  kumamotoCastle: 'Kumamoto Castle 02.jpg',
  shurijo: 'Shuri Castle Okinawa Japan.jpg',
  churaumi: 'Okinawa Churaumi Aquarium 03.jpg',
  amanohashidate: 'Amanohashidate view from Kasamatsu Park.jpg',
  eiffelTower: 'Eiffel Tower from the Trocadéro, Paris 16 November 2017.jpg',
  statueOfLiberty: 'Statue of Liberty 7.jpg',
  greatWall: 'The Great Wall of China at Jinshanling-edit.jpg',
  sydneyOpera: 'Sydney Opera House Sailings, Dec 2018.jpg',
  seoulTower: 'N Seoul Tower at blue hour.jpg',
  shanghaiBund: 'Shanghai Bund, China, as seen from Huangpu River (cropped).jpg',
  hongKongSkyline: 'Hong Kong Skyline (1).jpg',
  merlion: 'Merlion sentosa.jpg',
  watArun: 'Wat Arun, Bangkok, Thailand.jpg',
  gatewayOfIndia: 'Gateway of India, Mumbai, India.jpg',
  burjKhalifa: 'Burj Khalifa.jpg',
  hagiaSophia: 'Hagia Sophia Mars 2013.jpg',
  saintBasils: "Saint Basil's Cathedral in Moscow, Russia.jpg",
  brandenburgGate: 'Brandenburger Tor abends.jpg',
  palaceOfWestminster: 'Palace of Westminster, London - Feb 2007.jpg',
  colosseum: 'Colosseo 2020.jpg',
  sagradaFamilia: 'Sagrada Familia 8.jpg',
  amsterdamCanal: 'Amsterdam - Canal houses at the Brouwersgracht - 0310.jpg',
  hollywoodSign: 'Hollywood Sign (Zuschnitt).jpg',
  goldenGate: 'GoldenGateBridge-001.jpg',
  gizaPyramid: 'Kheops-Pyramid.jpg',
  tableMountain: 'Table Mountain from V&A Waterfront.jpg',
  christRedeemer: 'Christ the Redeemer statue in Rio de Janeiro, Brazil.jpg',
  waikiki: 'Waikiki Beach, Honolulu, Hawaii (2013).jpg',
  guam: 'Tumon Bay, Guam.jpg',
  taipei101: 'Taipei 101 from below.jpg',
  manilaBay: 'Manila Bay Sunset.jpg',
  bali: 'Pura Luhur Uluwatu, Bali.jpg'
};

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function fetchThumbUrl(filename) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('format', 'json');
  api.searchParams.set('origin', '*');
  api.searchParams.set('titles', `File:${filename}`);
  api.searchParams.set('prop', 'imageinfo');
  api.searchParams.set('iiprop', 'url|thumburl');
  api.searchParams.set('iiurlwidth', '960');

  const res = await fetch(api, { headers: { 'User-Agent': 'SenriNoMichiApp/1.0 (local PWA; educational)' } });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`API error: ${text.slice(0, 80)}`);
  }

  const page = Object.values(data.query?.pages || {})[0];
  if (!page || page.missing !== undefined) throw new Error(`Missing file: ${filename}`);
  const url = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
  if (!url) throw new Error(`No URL for: ${filename}`);
  return url;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'SenriNoMichiApp/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const urls = {};
const errors = [];

for (const [key, file] of Object.entries(FILES)) {
  const dest = path.join(OUT_DIR, `${key}.jpg`);
  try {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      urls[key] = `./images/spots/${key}.jpg`;
      console.log('SKIP (exists)', key);
      continue;
    }
    await sleep(DELAY_MS);
    const remote = await fetchThumbUrl(file);
    await sleep(300);
    await downloadImage(remote, dest);
    urls[key] = `./images/spots/${key}.jpg`;
    console.log('OK', key);
  } catch (err) {
    errors.push(`${key}: ${err.message}`);
    console.error('FAIL', key, err.message);
  }
}

if (!urls.tokyoTower && urls.kinkakuji) urls.tokyoTower = urls.kinkakuji;
if (!urls.tokyoTower) {
  console.error('No default image available');
  process.exit(1);
}

for (const key of Object.keys(FILES)) {
  if (!urls[key]) urls[key] = urls.tokyoTower;
}

const fallbackSrc = path.join(OUT_DIR, 'tokyoTower.jpg');
const fallbackDest = path.join(__dirname, '../images/fallback.jpg');
fs.mkdirSync(path.dirname(fallbackDest), { recursive: true });
if (fs.existsSync(fallbackSrc)) {
  fs.copyFileSync(fallbackSrc, fallbackDest);
}

const out = `/**
 * 名所画像（ローカル配信 / images/spots/）
 * scripts/fetch-wiki-images.js で生成
 */

export const SPOT_IMAGES = ${JSON.stringify(urls, null, 2)};

export const DEFAULT_SPOT = SPOT_IMAGES.tokyoTower;
export const FALLBACK_SPOT = './images/fallback.jpg';
`;

fs.writeFileSync(path.join(__dirname, '../js/image-urls.js'), out);
console.log(`Done: ${Object.keys(urls).length} images, ${errors.length} fetch errors (filled with fallback)`);
if (errors.length) {
  console.log('Errors:', errors.join('\n'));
}
