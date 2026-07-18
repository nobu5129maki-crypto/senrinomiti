/**
 * 名所画像（ローカル優先 / 未配置は Wikimedia 直リンク）
 * scripts/download-spot-images.js でローカル取得可能
 */

/** Wikimedia 直リンク（ローカル未配置時のバックアップ） */
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
  kenrokuen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Fountain_Kenrokuen_Garden_Kanazawa_Japan.JPG/960px-Fountain_Kenrokuen_Garden_Kanazawa_Japan.JPG',
  yokohamaMinatoMirai: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Minato_Mirai_-_Yokohama_Skyline_March_2025.jpg/960px-Minato_Mirai_-_Yokohama_Skyline_March_2025.jpg',
  hakoneFuji: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/080315_Fuji_Hakone_Izu_National_Park_Japan.JPG/960px-080315_Fuji_Hakone_Izu_National_Park_Japan.JPG',
  shizuokaTea: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Green_tea_fields_in_Shizuoka_1.jpg/960px-Green_tea_fields_in_Shizuoka_1.jpg',
  nagoyaCastle: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Nagoya_Castle%28Larger%29.jpg/960px-Nagoya_Castle%28Larger%29.jpg',
  kobePort: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Kobe_Port_Tower_and_Maritime_Museum%2C_November_2016.jpg/960px-Kobe_Port_Tower_and_Maritime_Museum%2C_November_2016.jpg',
  hiroshimaDome: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Genbaku_Dome04-r.JPG/960px-Genbaku_Dome04-r.JPG',
  fukuokaOhori: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Ohori_Park_Fukuoka.jpg/960px-Ohori_Park_Fukuoka.jpg',
  sapporoClock: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Sapporo_Clock_Tower%2C_Hokkaido%2C_Japan.jpg/960px-Sapporo_Clock_Tower%2C_Hokkaido%2C_Japan.jpg',
  matsushima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Matsushima_miyagi.jpg/960px-Matsushima_miyagi.jpg',
  naraDeer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Nara_Park_Deers.JPG/960px-Nara_Park_Deers.JPG',
  tokyoDome: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Tokyo_Dome_2015.jpg/960px-Tokyo_Dome_2015.jpg',
  enoshima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Enoshima%2C_Japan_%2815662062438%29.jpg/960px-Enoshima%2C_Japan_%2815662062438%29.jpg',
  roppongiHills: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Roppongi_Hills_Mori_Tower.jpg/960px-Roppongi_Hills_Mori_Tower.jpg',
  odaiba: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Rainbow_Bridge%2C_Tokyo%2C_South_view_from_Odaiba_20190419_1.jpg/960px-Rainbow_Bridge%2C_Tokyo%2C_South_view_from_Odaiba_20190419_1.jpg',
  shibuyaScramble: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Tokyo_Shibuya_Scramble_Crossing_2018-10-09.jpg/960px-Tokyo_Shibuya_Scramble_Crossing_2018-10-09.jpg',
  nationalStadium: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/New_national_stadium_tokyo_1.jpg/960px-New_national_stadium_tokyo_1.jpg',
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
  kumamotoCastle: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Kumamoto_Castle_02n3200.jpg/960px-Kumamoto_Castle_02n3200.jpg',
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
  tableMountain: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Cape_Town_%28ZA%29%2C_Table_Mountain_--_2024_--_2825.jpg/960px-Cape_Town_%28ZA%29%2C_Table_Mountain_--_2024_--_2825.jpg',
  christRedeemer: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Christ_the_Redeemer_statue_in_Rio_de_Janeiro%2C_Brazil.jpg/960px-Christ_the_Redeemer_statue_in_Rio_de_Janeiro%2C_Brazil.jpg',
  waikiki: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/HPD_on_Waikiki_Beach%2C_Honolulu%2C_Hawaii.jpg/960px-HPD_on_Waikiki_Beach%2C_Honolulu%2C_Hawaii.jpg',
  guam: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Corals_and_fish_of_Tumon_Bay%2C_Guam_in_2012.jpg/960px-Corals_and_fish_of_Tumon_Bay%2C_Guam_in_2012.jpg',
  taipei101: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Taipei_Taiwan_Taipei-101-Tower-01.jpg/960px-Taipei_Taiwan_Taipei-101-Tower-01.jpg',
  manilaBay: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Manila_Bay%2C_Sunset%2C_Philippines.jpg/960px-Manila_Bay%2C_Sunset%2C_Philippines.jpg',
  bali: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Luhur_Uluwatu_Temple%2C_Bali%2C_20220826_0953_1016.jpg/960px-Luhur_Uluwatu_Temple%2C_Bali%2C_20220826_0953_1016.jpg',
  // ── カタログ専用（Wikimedia Commons 実在ファイル） ──
  sakurajima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Sakurajima-2.jpg/960px-Sakurajima-2.jpg',
  yufuin: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Kinrin-ko_by_~MVI~_in_Yufuin%2C_Oita.jpg/960px-Kinrin-ko_by_~MVI~_in_Yufuin%2C_Oita.jpg',
  beppuOnsen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Beppu_Umi-jigoku04n4272.jpg/960px-Beppu_Umi-jigoku04n4272.jpg',
  kusatsuOnsen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Kusatsu_Onsen_01.JPG/960px-Kusatsu_Onsen_01.JPG',
  dogoOnsen: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Dogo_onsen_honkan_long_exposure.jpg/960px-Dogo_onsen_honkan_long_exposure.jpg',
  yakushima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Jomon_Sugi_07.jpg/960px-Jomon_Sugi_07.jpg',
  takachiho: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Takachiho_Gorge_by_boat.jpg/960px-Takachiho_Gorge_by_boat.jpg',
  asosan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Aso_crater.jpg/960px-Aso_crater.jpg',
  furano: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Farm_Tomita_20140812-1.jpg/960px-Farm_Tomita_20140812-1.jpg',
  bieiBluePond: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Biei_Blue-pond.jpg/960px-Biei_Blue-pond.jpg',
  shiretoko: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/140829_Ichiko_of_Shiretoko_Goko_Lakes_Hokkaido_Japan02s5.jpg/960px-140829_Ichiko_of_Shiretoko_Goko_Lakes_Hokkaido_Japan02s5.jpg',
  kamikochi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Kamik%C5%8Dchi%2C_Hida_Mountains_range%2C_Nagano_Prefecture%3B_September_2007_%2813%29.jpg/960px-Kamik%C5%8Dchi%2C_Hida_Mountains_range%2C_Nagano_Prefecture%3B_September_2007_%2813%29.jpg',
  tottoriSakyu: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Tottori_Sand_Dunes.jpg/960px-Tottori_Sand_Dunes.jpg',
  kurobeDam: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Kurobe_dam.jpg/960px-Kurobe_dam.jpg',
  hitachiKaihin: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Miharashino_Oka_%28Hitachi_Seaside_Park%29_01.jpg/960px-Miharashino_Oka_%28Hitachi_Seaside_Park%29_01.jpg',
  karuizawa: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/220930_St._Paul%27s_Catholic_Church_Karuizawa_Nagano_pref_Japan01s3.jpg/960px-220930_St._Paul%27s_Catholic_Church_Karuizawa_Nagano_pref_Japan01s3.jpg',
  atami: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/%E7%86%B1%E6%B5%B7_Atami_Sun_Beach_-_Feb_10%2C_2008.jpg/960px-%E7%86%B1%E6%B5%B7_Atami_Sun_Beach_-_Feb_10%2C_2008.jpg',
  tojinbo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Tojinbo_01.jpg/960px-Tojinbo_01.jpg',
  akiyoshido: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Inagawa_River_near_Akiyoshi_Cave_4.jpg/960px-Inagawa_River_near_Akiyoshi_Cave_4.jpg',
  kazurabashi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Kazura-bashi%2C_Iya_Valley_01.jpg/960px-Kazura-bashi%2C_Iya_Valley_01.jpg',
  kirishima: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Takachiho-gawara_Kirishima_City_Kagoshima_Pref04n4050.jpg/960px-Takachiho-gawara_Kirishima_City_Kagoshima_Pref04n4050.jpg',
  zaoOkama: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Fall_at_Okama_Crater_Lake%2C_Mt._Zao%2C_Tohoku_region%2C_Japan.jpg/960px-Fall_at_Okama_Crater_Lake%2C_Mt._Zao%2C_Tohoku_region%2C_Japan.jpg',
  towadako: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Lake_Towada_from_Ohanabe_2008.jpg/960px-Lake_Towada_from_Ohanabe_2008.jpg',
  niseko: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/%E3%83%8B%E3%82%BB%E3%82%B3%E3%83%A2%E3%82%A4%E3%83%AF3.JPG/960px-%E3%83%8B%E3%82%BB%E3%82%B3%E3%83%A2%E3%82%A4%E3%83%AF3.JPG',
  kawaguchiko: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Mount_Fuji_at_sunset%2C_March_2025.jpg/960px-Mount_Fuji_at_sunset%2C_March_2025.jpg'
};

/** Wikimedia URL から画像キーを抽出 */
export function imageKeyFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const local = url.match(/\/([^/]+)\.jpg$/i);
  if (local && REMOTE[local[1]]) return local[1];
  return null;
}

/** 表示 URL のリモートフォールバック（ローカルパス → REMOTE） */
export function remoteFallbackForUrl(url) {
  if (!url || url.startsWith('http')) return null;
  const key = imageKeyFromUrl(url);
  return key ? REMOTE[key] : null;
}

function spotImageUrl(key) {
  return REMOTE[key] || REMOTE.tokyoTower;
}

export const SPOT_IMAGES = Object.fromEntries(
  Object.keys(REMOTE).map((key) => [key, spotImageUrl(key)])
);

export const SPOT_REMOTE_FALLBACKS = REMOTE;

export const DEFAULT_SPOT = SPOT_IMAGES.tokyoTower;
export const FALLBACK_SPOT = REMOTE.tokyoTower;
