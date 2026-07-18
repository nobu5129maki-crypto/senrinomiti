import { routeTotalDistance, buildGreatCirclePath, greatCirclePoint } from './geo.js';
import { enrichCheckpoint } from './landmarks.js';
import { attachSpotMetadata } from './spots.js';
import { lockRouteDestination, lockSpotImage } from './spot-image.js';
import { CITIES, JAPAN_CITY_KEYS } from './cities.js';
import { lookupJapanCityKey, resolveJapaneseArea } from './ja-areas.js';

export { CITIES } from './cities.js';

/** チェックポイント距離をルート上で計算 */
function buildCheckpoints(waypointKeys, descriptions) {
  const waypoints = waypointKeys.map((k) => CITIES[k]);
  let accumulated = 0;
  const checkpoints = [];

  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    if (i > 0) {
      const prev = waypoints[i - 1];
      accumulated += haversine(prev.lat, prev.lng, wp.lat, wp.lng);
    }
    const desc = descriptions[i];
    if (desc) {
      checkpoints.push(enrichCheckpoint({
        id: `${waypointKeys[i]}-${i}`,
        cityKey: waypointKeys[i],
        name: wp.name,
        lat: wp.lat,
        lng: wp.lng,
        distanceKm: accumulated,
        description: desc
      }, waypointKeys[i]));
    }
  }
  return checkpoints;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** プリセットの目的地画像を取得 */
function endPresetImage(preset) {
  return enrichCheckpoint({ name: CITIES[preset.end].name }, preset.end).spotImage;
}

/** プリセットルート定義 */
export const PRESETS = {
  japan: [
    {
      id: 'tokyo-osaka',
      start: 'tokyo',
      end: 'osaka',
      waypoints: ['tokyo', 'yokohama', 'hakone', 'shizuoka', 'nagoya', 'kyoto', 'osaka'],
      label: '東京 → 大阪（黄金ルート）',
      descriptions: [
        '旅のスタート！日本の首都・東京から歩き始めよう。',
        '港町横浜を通過。中華街の香りが漂ってきそう。',
        '温泉の街・箱根。富士山の眺望は旅のご褒美。',
        '静岡はお茶と富士山の街。一息つこう。',
        '名古屋城の金のシャチホコが見えてきた！',
        '千年の都・京都。神社仏閣の数々を想像しながら。',
        'ゴール！食い倒れの街・大阪に到着しました！'
      ]
    },
    {
      id: 'tokyo-kyoto',
      start: 'tokyo',
      end: 'kyoto',
      waypoints: ['tokyo', 'yokohama', 'shizuoka', 'nagoya', 'kyoto'],
      label: '東京 → 京都',
      descriptions: [
        '東京駅を出発！古都への旅が始まります。',
        '横浜・みなとみらいを通過。',
        '静岡の茶畑が続く風景。',
        '名古屋を通過。味噌カツが恋しい。',
        '京都到着！伏見稲荷の千本鳥居を想像しよう。'
      ]
    },
    {
      id: 'sapporo-tokyo',
      start: 'sapporo',
      end: 'tokyo',
      waypoints: ['sapporo', 'sendai', 'tokyo'],
      label: '札幌 → 東京',
      descriptions: [
        '北海道の中心・札幌からスタート！',
        '仙台を通過。牛タン弁当が食べたい。',
        '東京到着！長い旅お疲れさまでした。'
      ]
    },
    {
      id: 'tokyo-fukuoka',
      start: 'tokyo',
      end: 'fukuoka',
      waypoints: ['tokyo', 'nagoya', 'osaka', 'hiroshima', 'fukuoka'],
      label: '東京 → 福岡（縦断）',
      descriptions: [
        '本州縦断の大旅がスタート！',
        '名古屋を通過。',
        '大阪・道頓堀のネオンを想像。',
        '広島・平和記念公園を通過。',
        '博多ラーメンの街・福岡到着！'
      ]
    },
    {
      id: 'osaka-kanazawa',
      start: 'osaka',
      end: 'kanazawa',
      waypoints: ['osaka', 'kyoto', 'kanazawa'],
      label: '大阪 → 金沢',
      descriptions: [
        '大阪から北陸へ。',
        '京都を通過。',
        '金沢到着！兼六園と海の幸が待っている。'
      ]
    }
  ],
  world: [
    {
      id: 'tokyo-paris',
      start: 'tokyo',
      end: 'paris',
      waypoints: ['tokyo', 'beijing', 'moscow', 'berlin', 'paris'],
      label: '東京 → パリ',
      descriptions: [
        '世界一周の旅、東京から出発！',
        '北京・万里の長城のふもとを通過。',
        'モスクワ・赤の広場を通過。',
        'ベルリンの壁の歴史を思い出す。',
        'パリ到着！エッフェル塔の下で祝福を。'
      ]
    },
    {
      id: 'tokyo-newyork',
      start: 'tokyo',
      end: 'newyork',
      waypoints: ['tokyo', 'honolulu', 'sanfrancisco', 'newyork'],
      label: '東京 → ニューヨーク',
      descriptions: [
        '太平洋横断の大旅が始まる！',
        'ハワイ・ホノルルに到達。アロハ！',
        'サンフランシスコ・ゴールデンゲートブリッジ。',
        'ニューヨーク到着！自由の女神が見える。'
      ]
    },
    {
      id: 'tokyo-london',
      start: 'tokyo',
      end: 'london',
      waypoints: ['tokyo', 'beijing', 'moscow', 'istanbul', 'london'],
      label: '東京 → ロンドン',
      descriptions: [
        'ユーラシア大陸を横断する旅。',
        '北京を通過。',
        'モスクワを通過。',
        'イスタンブール・ボスポラス海峡。',
        'ロンドン到着！ビッグベンが迎えてくれる。'
      ]
    },
    {
      id: 'tokyo-sydney',
      start: 'tokyo',
      end: 'sydney',
      waypoints: ['tokyo', 'hongkong', 'singapore', 'sydney'],
      label: '東京 → シドニー',
      descriptions: [
        '南半球への旅がスタート！',
        '香港・ビクトリアピーク。',
        'シンガポール・マーライオン。',
        'シドニー到着！オペラハウスが見える！'
      ]
    },
    {
      id: 'paris-cairo',
      start: 'paris',
      end: 'cairo',
      waypoints: ['paris', 'rome', 'istanbul', 'cairo'],
      label: 'パリ → カイロ',
      descriptions: [
        'ヨーロッパからアフリカへ。',
        '永遠の都・ローマを通過。',
        'イスタンブールを通過。',
        'カイロ到着！ピラミッドが目前に。'
      ]
    },
    {
      id: 'tokyo-rio',
      start: 'tokyo',
      end: 'riodejaneiro',
      waypoints: ['tokyo', 'losangeles', 'newyork', 'riodejaneiro'],
      label: '東京 → リオデジャネイロ',
      descriptions: [
        '地球の反対側を目指す大冒険！',
        'ロサンゼルス・ハリウッド。',
        'ニューヨークを通過。',
        'リオ到着！コルコバードのキリスト像が見える。'
      ]
    }
  ]
};

/** プリセットを Route オブジェクトに変換 */
export function presetToRoute(preset) {
  const waypoints = preset.waypoints.map((key) => ({
    key,
    ...CITIES[key]
  }));
  const checkpoints = buildCheckpoints(preset.waypoints, preset.descriptions);
  const totalKm = routeTotalDistance(waypoints);

  return {
    id: preset.id,
    mode: PRESETS.japan.some((p) => p.id === preset.id) ? 'japan' : 'world',
    label: preset.label,
    startName: CITIES[preset.start].name,
    endName: CITIES[preset.end].name,
    image: endPresetImage(preset),
    waypoints,
    checkpoints,
    totalKm
  };
}

/** 地点オブジェクトからルートを生成 */
export function createRouteFromPlaces(start, end, mode, options = {}) {
  start = attachSpotMetadata(start);
  end = attachSpotMetadata(end);

  const midPt = greatCirclePoint(start.lat, start.lng, end.lat, end.lng, 0.5);
  const mid = {
    name: `${start.name}と${end.name}の途中`,
    lat: midPt.lat,
    lng: midPt.lng
  };

  const path = buildGreatCirclePath(start.lat, start.lng, end.lat, end.lng);
  const totalKm = routeTotalDistance(path);

  const waypoints = [
    { key: start.spotId || 'start', name: start.name, lat: start.lat, lng: start.lng, spotId: start.spotId || null },
    { key: 'mid', ...mid },
    { key: end.spotId || 'end', name: end.name, lat: end.lat, lng: end.lng, spotId: end.spotId || null }
  ];

  const checkpoints = buildPlaceCheckpoints(start, mid, end, totalKm, options.presetCheckpoints);

  const slug = `${start.lat.toFixed(3)}-${end.lat.toFixed(3)}`;
  const locked = lockSpotImage(end.spotId, end.name);
  const endLandmark = enrichCheckpoint({ name: end.name, spotId: locked?.spotId || end.spotId }, locked?.spotId || end.spotId);

  return lockRouteDestination({
    id: options.id || `custom-${slug}`,
    mode,
    label: options.label || `${start.name} → ${end.name}`,
    startName: start.name,
    endName: locked?.spotLabel || end.name,
    endSpotId: locked?.spotId || end.spotId || null,
    endSpotImage: locked?.spotImage || endLandmark.spotImage || null,
    image: locked?.spotImage || options.image || endLandmark.spotImage,
    waypoints,
    path,
    checkpoints,
    totalKm,
    custom: !options.presetId,
    presetId: options.presetId || null
  });
}

function buildPlaceCheckpoints(start, mid, end, totalKm, extraCheckpoints = []) {
  const endDesc = end.description || `${end.name}に到着！`;
  const midDist = totalKm / 2;

  const base = [
    enrichCheckpoint({
      id: 'start-0',
      name: start.name,
      lat: start.lat,
      lng: start.lng,
      spotId: start.spotId || null,
      distanceKm: 0,
      description: start.description || `${start.name}を出発！`
    }, start.spotId)
  ];

  const extras = extraCheckpoints
    .filter((cp) => cp.distanceKm > 0)
    .map((cp) => enrichCheckpoint(cp, cp.cityKey));

  base.push(enrichCheckpoint({
    id: 'mid-1',
    name: mid.name,
    lat: mid.lat,
    lng: mid.lng,
    distanceKm: midDist,
    description: '折り返し地点を通過。あと半分！'
  }));

  base.push(...extras);

  base.push(enrichCheckpoint({
    id: 'end-final',
    name: end.name,
    lat: end.lat,
    lng: end.lng,
    spotId: end.spotId || null,
    distanceKm: totalKm,
    description: endDesc
  }, end.spotId));

  return base.sort((a, b) => a.distanceKm - b.distanceKm);
}

/** waypoints 配列からチェックポイントを構築 */
function buildCheckpointsFromWaypoints(waypoints, descriptions = []) {
  let accumulated = 0;
  const checkpoints = [];

  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    if (i > 0) {
      const prev = waypoints[i - 1];
      accumulated += haversine(prev.lat, prev.lng, wp.lat, wp.lng);
    }
    const desc = descriptions[i];
    if (desc) {
      checkpoints.push(enrichCheckpoint({
        id: `${wp.key || 'wp'}-${i}`,
        cityKey: wp.key,
        name: wp.name,
        lat: wp.lat,
        lng: wp.lng,
        distanceKm: accumulated,
        description: desc
      }, wp.key));
    }
  }
  return checkpoints;
}

/** プリセットルートの起点だけ差し替え */
export function presetWithCustomStart(preset, startPlace) {
  const base = presetToRoute(preset);
  const descriptions = [...preset.descriptions];
  descriptions[0] = `${startPlace.name}を出発！`;

  const waypoints = preset.waypoints.map((key, i) => {
    if (i === 0) {
      return { key: 'custom-start', name: startPlace.name, lat: startPlace.lat, lng: startPlace.lng };
    }
    return { key, ...CITIES[key] };
  });

  const checkpoints = buildCheckpointsFromWaypoints(waypoints, descriptions);
  const totalKm = routeTotalDistance(waypoints);
  const endWp = waypoints[waypoints.length - 1];

  const endLandmark = enrichCheckpoint({ name: endWp.name, cityKey: endWp.key }, endWp.key);

  return {
    id: `${preset.id}-from-${startPlace.lat.toFixed(3)}`,
    mode: base.mode,
    label: `${startPlace.name} → ${endWp.name}`,
    startName: startPlace.name,
    endName: endWp.name,
    image: endLandmark.spotImage,
    waypoints,
    checkpoints,
    totalKm,
    custom: false,
    presetId: preset.id
  };
}

/** 都市名マスタからルート生成（フォールバック） */
export function createCustomRouteFromCities(startName, endName, mode) {
  const startKey = findCityKey(startName);
  const endKey = findCityKey(endName);

  if (!startKey || !endKey) return { error: '都市が見つかりません。' };

  if (mode === 'japan') {
    const japanKeys = JAPAN_CITY_KEYS;
    if (!japanKeys.includes(startKey) || !japanKeys.includes(endKey)) {
      return { error: '日本版モードでは国内の都市のみ選択できます。' };
    }
  }

  const start = CITIES[startKey];
  const end = CITIES[endKey];
  return {
    route: createRouteFromPlaces(start, end, mode, { id: `custom-${startKey}-${endKey}` })
  };
}

/** 地点オブジェクトまたは地名文字列からルート生成 */
export function createCustomRoute(start, end, mode) {
  if (typeof start === 'object' && typeof end === 'object') {
    return { route: createRouteFromPlaces(start, end, mode) };
  }
  return createCustomRouteFromCities(start, end, mode);
}

function findCityKey(name) {
  return lookupJapanCityKey(name);
}

/** ネットワーク不要で都市名から地点を解決 */
export function resolveLocalPlace(name, mode = 'japan') {
  const key = findCityKey(name);
  if (!key || !CITIES[key]) {
    return resolveJapaneseArea(name, mode);
  }
  if (mode === 'japan' && !JAPAN_CITY_KEYS.includes(key)) return null;
  const city = CITIES[key];
  return {
    id: key,
    name: city.name,
    displayName: city.name,
    lat: city.lat,
    lng: city.lng
  };
}

export function getPresetsForMode(mode) {
  return PRESETS[mode].map(presetToRoute);
}

export function findPresetById(id) {
  for (const mode of ['japan', 'world']) {
    const found = PRESETS[mode].find((p) => p.id === id);
    if (found) return presetToRoute(found);
  }
  return null;
}
