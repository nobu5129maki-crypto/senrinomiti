/**
 * 検証済み upload.wikimedia.org 直リンクから全名所画像を取得
 * node scripts/download-spot-images.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../images/spots');
const FALLBACK_DEST = path.join(__dirname, '../images/fallback.jpg');

/** API 不要・upload.wikimedia.org 直リンク */
const REMOTE = {
  tokyoTower: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Tokyo_Tower%2C_Minato_City.jpg/960px-Tokyo_Tower%2C_Minato_City.jpg',
  tokyoSkytree: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Worm%27s-eye_view_of_Tokyo_Skytree_with_vertical_symmetry_impression%2C_a_sunny_day%2C_in_Japan.jpg/960px-Worm%27s-eye_view_of_Tokyo_Skytree_with_vertical_symmetry_impression%2C_a_sunny_day%2C_in_Japan.jpg',
  sensoji: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Five-storied_Pagoda_of_Sensoji_Temple_in_Tokyo%2C_20240821_1616_5263.jpg/960px-Five-storied_Pagoda_of_Sensoji_Temple_in_Tokyo%2C_20240821_1616_5263.jpg',
  meijiJingu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Torii_of_Meiji_Shrine_2018.jpg/960px-Torii_of_Meiji_Shrine_2018.jpg',
  fuji: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Mount_Fuji_at_sunset%2C_March_2025.jpg/960px-Mount_Fuji_at_sunset%2C_March_2025.jpg',
  fushimiInari: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/KyotoFushimiInariLarge.jpg/960px-KyotoFushimiInariLarge.jpg',
  tokyoDisneyland: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Cinderella_Castle_at_Tokyo_Disneyland.JPG/960px-Cinderella_Castle_at_Tokyo_Disneyland.JPG',
  kinkakuji: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Kinkakuji_2004-09-21.jpg/960px-Kinkakuji_2004-09-21.jpg',
  dotonbori: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Dotonbori%2C_Osaka%2C_at_night%2C_November_2016.jpg/960px-Dotonbori%2C_Osaka%2C_at_night%2C_November_2016.jpg',
  itsukushima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Itsukushima_Gate.jpg/960px-Itsukushima_Gate.jpg',
  kenrokuen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Kenrokuen_In_early_spring.jpg/960px-Kenrokuen_In_early_spring.jpg',
  yokohamaMinatoMirai: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Minato_Mirai_21_skyline_at_night%2C_Yokohama%2C_Japan.jpg/960px-Minato_Mirai_21_skyline_at_night%2C_Yokohama%2C_Japan.jpg',
  hakoneFuji: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/080315_Fuji_Hakone_Izu_National_Park_Japan.JPG/960px-080315_Fuji_Hakone_Izu_National_Park_Japan.JPG',
  shizuokaTea: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Green_tea_fields_in_Shizuoka_1.jpg/960px-Green_tea_fields_in_Shizuoka_1.jpg',
  nagoyaCastle: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Nagoya_Castle%28Larger%29.jpg/960px-Nagoya_Castle%28Larger%29.jpg',
  kobePort: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Kobe_Port_Tower%2C_November_2016.jpg/960px-Kobe_Port_Tower%2C_November_2016.jpg',
  hiroshimaDome: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Genbaku_Dome04-r.JPG/960px-Genbaku_Dome04-r.JPG',
  fukuokaOhori: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ohori_Park_Fukuoka.jpg/960px-Ohori_Park_Fukuoka.jpg',
  sapporoClock: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Sapporo_Clock_Tower%2C_Hokkaido%2C_Japan.jpg/960px-Sapporo_Clock_Tower%2C_Hokkaido%2C_Japan.jpg',
  matsushima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Matsushima_miyagi.jpg/960px-Matsushima_miyagi.jpg',
  naraDeer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Nara_Park_Deers.JPG/960px-Nara_Park_Deers.JPG',
  tokyoDome: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tokyo_Dome_2018.jpg/960px-Tokyo_Dome_2018.jpg',
  enoshima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Enoshima_and_Fujisawa_city.jpg/960px-Enoshima_and_Fujisawa_city.jpg',
  roppongiHills: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Roppongi_Hills_Mori_Tower.jpg/960px-Roppongi_Hills_Mori_Tower.jpg',
  odaiba: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Rainbow_Bridge_at_night_from_Odaiba%2C_Tokyo.jpg/960px-Rainbow_Bridge_at_night_from_Odaiba%2C_Tokyo.jpg',
  shibuyaScramble: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Shibuya_Crossing%2C_Tokyo%2C_Japan.jpg/960px-Shibuya_Crossing%2C_Tokyo%2C_Japan.jpg',
  nationalStadium: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Japan_National_Stadium_in_2024.jpg/960px-Japan_National_Stadium_in_2024.jpg',
  nikkoToshogu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Nikko_Toshogu_01.jpg/960px-Nikko_Toshogu_01.jpg',
  himejiCastle: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Himeji_castle_in_may_2015.jpg/960px-Himeji_castle_in_may_2015.jpg',
  osakaCastle: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Osaka_Castle_02bs3200.jpg/960px-Osaka_Castle_02bs3200.jpg',
  kiyomizudera: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Kiyomizu-dera%2C_Kyoto%2C_November_2016_-01.jpg/960px-Kiyomizu-dera%2C_Kyoto%2C_November_2016_-01.jpg',
  shirakawago: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Shirakawa-go%2C_Gifu%2C_Japan.jpg/960px-Shirakawa-go%2C_Gifu%2C_Japan.jpg',
  kamakuraDaibutsu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Kamakura_Daibutsu_from_front.jpg/960px-Kamakura_Daibutsu_from_front.jpg',
  todaiji: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Great_Buddha_in_Todaiji_Nara_Japan01.jpg/960px-Great_Buddha_in_Todaiji_Nara_Japan01.jpg',
  koyasan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Danjo_Garan_Koyasan_Japan06s4592.jpg/960px-Danjo_Garan_Koyasan_Japan06s4592.jpg',
  arashiyama: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Arashiyama%2C_Kyoto%2C_Japan.jpg/960px-Arashiyama%2C_Kyoto%2C_Japan.jpg',
  izumoTaisha: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Izumo-taisha_in_Japan.jpg/960px-Izumo-taisha_in_Japan.jpg',
  kumamotoCastle: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Kumamoto_Castle_02.jpg/960px-Kumamoto_Castle_02.jpg',
  shurijo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Shuri_Castle_Okinawa_Japan.jpg/960px-Shuri_Castle_Okinawa_Japan.jpg',
  churaumi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Okinawa_Churaumi_Aquarium_03.jpg/960px-Okinawa_Churaumi_Aquarium_03.jpg',
  amanohashidate: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Amanohashidate_view_from_Kasamatsu_Park.jpg/960px-Amanohashidate_view_from_Kasamatsu_Park.jpg',
  eiffelTower: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/960px-Tour_Eiffel_Wikimedia_Commons.jpg',
  statueOfLiberty: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Statue_of_Liberty_7.jpg/960px-Statue_of_Liberty_7.jpg',
  greatWall: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg/960px-The_Great_Wall_of_China_at_Jinshanling-edit.jpg',
  sydneyOpera: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Sydney_Opera_House_-_Dec_2008.jpg/960px-Sydney_Opera_House_-_Dec_2008.jpg',
  seoulTower: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/N_Seoul_Tower_at_blue_hour.jpg/960px-N_Seoul_Tower_at_blue_hour.jpg',
  shanghaiBund: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Shanghai_Bund%2C_China%2C_as_seen_from_Huangpu_River_%28cropped%29.jpg/960px-Shanghai_Bund%2C_China%2C_as_seen_from_Huangpu_River_%28cropped%29.jpg',
  hongKongSkyline: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Hong_Kong_Skyline_%281%29.jpg/960px-Hong_Kong_Skyline_%281%29.jpg',
  merlion: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Merlion_sentosa.jpg/960px-Merlion_sentosa.jpg',
  watArun: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Wat_Arun%2C_Bangkok%2C_Thailand.jpg/960px-Wat_Arun%2C_Bangkok%2C_Thailand.jpg',
  gatewayOfIndia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Gateway_of_India%2C_Mumbai%2C_India.jpg/960px-Gateway_of_India%2C_Mumbai%2C_India.jpg',
  burjKhalifa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Burj_Khalifa.jpg/960px-Burj_Khalifa.jpg',
  hagiaSophia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Hagia_Sophia_Mars_2013.jpg/960px-Hagia_Sophia_Mars_2013.jpg',
  saintBasils: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Saint_Basil%27s_Cathedral_in_Moscow%2C_Russia.jpg/960px-Saint_Basil%27s_Cathedral_in_Moscow%2C_Russia.jpg',
  brandenburgGate: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/960px-Brandenburger_Tor_abends.jpg',
  palaceOfWestminster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Palace_of_Westminster%2C_London_-_Feb_2007.jpg/960px-Palace_of_Westminster%2C_London_-_Feb_2007.jpg',
  colosseum: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/960px-Colosseo_2020.jpg',
  sagradaFamilia: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Sagrada_Familia_8.jpg/960px-Sagrada_Familia_8.jpg',
  amsterdamCanal: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Amsterdam_-_Canal_houses_at_the_Brouwersgracht_-_0310.jpg/960px-Amsterdam_-_Canal_houses_at_the_Brouwersgracht_-_0310.jpg',
  hollywoodSign: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Hollywood_Sign_%28Zuschnitt%29.jpg/960px-Hollywood_Sign_%28Zuschnitt%29.jpg',
  goldenGate: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/960px-GoldenGateBridge-001.jpg',
  gizaPyramid: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Kheops-Pyramid.jpg/960px-Kheops-Pyramid.jpg',
  tableMountain: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Table_Mountain_from_V%26A_Waterfront.jpg/960px-Table_Mountain_from_V%26A_Waterfront.jpg',
  christRedeemer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christ_the_Redeemer_statue_in_Rio_de_Janeiro%2C_Brazil.jpg/960px-Christ_the_Redeemer_statue_in_Rio_de_Janeiro%2C_Brazil.jpg',
  waikiki: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/HPD_on_Waikiki_Beach%2C_Honolulu%2C_Hawaii.jpg/960px-HPD_on_Waikiki_Beach%2C_Honolulu%2C_Hawaii.jpg',
  guam: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Corals_and_fish_of_Tumon_Bay%2C_Guam_in_2012.jpg/960px-Corals_and_fish_of_Tumon_Bay%2C_Guam_in_2012.jpg',
  taipei101: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Taipei_Taiwan_Taipei-101-Tower-01.jpg/960px-Taipei_Taiwan_Taipei-101-Tower-01.jpg',
  manilaBay: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Manila_Bay%2C_Sunset%2C_Philippines.jpg/960px-Manila_Bay%2C_Sunset%2C_Philippines.jpg',
  bali: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Luhur_Uluwatu_Temple%2C_Bali%2C_20220826_0953_1016.jpg/960px-Luhur_Uluwatu_Temple%2C_Bali%2C_20220826_0953_1016.jpg'
};

async function download(url, dest) {
  const res = await fetch(url, { headers: { 'User-Agent': 'SenriNoMichiApp/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`Too small (${buf.length} bytes)`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(FALLBACK_DEST), { recursive: true });

const local = {};
const failures = [];

for (const [key, url] of Object.entries(REMOTE)) {
  const dest = path.join(OUT_DIR, `${key}.jpg`);
  try {
    const size = await download(url, dest);
    local[key] = `./images/spots/${key}.jpg`;
    console.log('OK', key, size);
    await new Promise((r) => setTimeout(r, 800));
  } catch (e) {
    failures.push(`${key}: ${e.message}`);
    console.error('FAIL', key, e.message);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
      local[key] = `./images/spots/${key}.jpg`;
    }
  }
}

if (!local.tokyoTower) {
  console.error('Failed to download default image');
  process.exit(1);
}

for (const key of Object.keys(REMOTE)) {
  if (!local[key]) local[key] = local.tokyoTower;
}

fs.copyFileSync(path.join(OUT_DIR, 'tokyoTower.jpg'), FALLBACK_DEST);

const js = `/**
 * 名所画像（ローカル配信 / images/spots/）
 * scripts/download-spot-images.js で生成
 */

export const SPOT_IMAGES = ${JSON.stringify(local, null, 2)};

export const DEFAULT_SPOT = SPOT_IMAGES.tokyoTower;
export const FALLBACK_SPOT = './images/fallback.jpg';
`;

fs.writeFileSync(path.join(__dirname, '../js/image-urls.js'), js);
console.log(`Done: ${Object.keys(local).length} keys, ${failures.length} failures`);
if (failures.length) console.log(failures.join('\n'));
