/**
 * 各地の風景・名物画像データ
 * 名所画像は Wikimedia Commons の実写を優先（Unsplash の汎用・誤画像を排除）
 */

import { getSpotLandmark, getSpotById, matchSpot, resolveRegisteredSpot } from './spots.js';
import { SPOT_IMAGES, DEFAULT_SPOT as DEFAULT_SPOT_URL, FALLBACK_SPOT } from './image-urls.js';
import { lockRouteDestination, lockSpotImage } from './spot-image.js';

const DEFAULT_SPOT = DEFAULT_SPOT_URL;
const DEFAULT_FOOD = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80';

export const LANDMARKS = {
  tokyo: {
    spotLabel: '東京タワー',
    spotImage: SPOT_IMAGES.tokyoTower,
    specialtyName: '江戸前寿司',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80'
  },
  yokohama: {
    spotLabel: 'みなとみらい21',
    spotImage: SPOT_IMAGES.yokohamaMinatoMirai,
    specialtyName: 'シウマイ',
    specialtyImage: 'https://images.unsplash.com/photo-1563245372-28a3f4ccb4b5?w=600&q=80'
  },
  hakone: {
    spotLabel: '箱根と富士山',
    spotImage: SPOT_IMAGES.hakoneFuji,
    specialtyName: '黒たまご',
    specialtyImage: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=600&q=80'
  },
  shizuoka: {
    spotLabel: '静岡の茶畑',
    spotImage: SPOT_IMAGES.shizuokaTea,
    specialtyName: '静岡茶',
    specialtyImage: 'https://images.unsplash.com/photo-1556678189-8654bd754a69?w=600&q=80'
  },
  nagoya: {
    spotLabel: '名古屋城',
    spotImage: SPOT_IMAGES.nagoyaCastle,
    specialtyName: '味噌カツ',
    specialtyImage: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&q=80'
  },
  kyoto: {
    spotLabel: '伏見稲荷の千本鳥居',
    spotImage: SPOT_IMAGES.fushimiInari,
    specialtyName: '抹茶スイーツ',
    specialtyImage: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=600&q=80'
  },
  osaka: {
    spotLabel: '道頓堀',
    spotImage: SPOT_IMAGES.dotonbori,
    specialtyName: 'たこ焼き',
    specialtyImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80'
  },
  kobe: {
    spotLabel: '神戸ポートタワー',
    spotImage: SPOT_IMAGES.kobePort,
    specialtyName: '神戸牛',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80'
  },
  hiroshima: {
    spotLabel: '原爆ドーム',
    spotImage: SPOT_IMAGES.hiroshimaDome,
    specialtyName: 'お好み焼き',
    specialtyImage: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=600&q=80'
  },
  fukuoka: {
    spotLabel: '大濠公園',
    spotImage: SPOT_IMAGES.fukuokaOhori,
    specialtyName: '博多ラーメン',
    specialtyImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80'
  },
  sapporo: {
    spotLabel: '札幌時計台',
    spotImage: SPOT_IMAGES.sapporoClock,
    specialtyName: 'ジンギスカン',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80'
  },
  sendai: {
    spotLabel: '松島',
    spotImage: SPOT_IMAGES.matsushima,
    specialtyName: '牛タン',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80'
  },
  kanazawa: {
    spotLabel: '兼六園',
    spotImage: SPOT_IMAGES.kenrokuen,
    specialtyName: '金沢の海の幸',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80'
  },
  nara: {
    spotLabel: '奈良公園と鹿',
    spotImage: SPOT_IMAGES.naraDeer,
    specialtyName: '柿の葉寿司',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80'
  },
  seoul: {
    spotLabel: 'Nソウルタワー',
    spotImage: SPOT_IMAGES.seoulTower,
    specialtyName: '韓国チキン',
    specialtyImage: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&q=80'
  },
  beijing: {
    spotLabel: '万里の長城',
    spotImage: SPOT_IMAGES.greatWall,
    specialtyName: '北京ダック',
    specialtyImage: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80'
  },
  shanghai: {
    spotLabel: '外滩のスカイライン',
    spotImage: SPOT_IMAGES.shanghaiBund,
    specialtyName: '小籠包',
    specialtyImage: 'https://images.unsplash.com/photo-1563245372-28a3f4ccb4b5?w=600&q=80'
  },
  hongkong: {
    spotLabel: 'ビクトリア・ハーバー',
    spotImage: SPOT_IMAGES.hongKongSkyline,
    specialtyName: '飲茶・点心',
    specialtyImage: 'https://images.unsplash.com/photo-1563245372-28a3f4ccb4b5?w=600&q=80'
  },
  singapore: {
    spotLabel: 'マーライオン',
    spotImage: SPOT_IMAGES.merlion,
    specialtyName: 'チキンライス',
    specialtyImage: 'https://images.unsplash.com/photo-1603133872878-684f208fb89b?w=600&q=80'
  },
  bangkok: {
    spotLabel: 'ワット・アルン',
    spotImage: SPOT_IMAGES.watArun,
    specialtyName: 'トムヤムクン',
    specialtyImage: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4963?w=600&q=80'
  },
  mumbai: {
    spotLabel: 'インド門',
    spotImage: SPOT_IMAGES.gatewayOfIndia,
    specialtyName: 'カレー',
    specialtyImage: 'https://images.unsplash.com/photo-1585937421612-70a008296f36?w=600&q=80'
  },
  dubai: {
    spotLabel: 'ブルジュ・ハリファ',
    spotImage: SPOT_IMAGES.burjKhalifa,
    specialtyName: 'デーツ',
    specialtyImage: 'https://images.unsplash.com/photo-1606312619070-d48b4c652765?w=600&q=80'
  },
  istanbul: {
    spotLabel: 'アヤソフィア',
    spotImage: SPOT_IMAGES.hagiaSophia,
    specialtyName: 'ケバブ',
    specialtyImage: 'https://images.unsplash.com/photo-1529042410759-b054120c7340?w=600&q=80'
  },
  moscow: {
    spotLabel: '聖ワシリイ大聖堂',
    spotImage: SPOT_IMAGES.saintBasils,
    specialtyName: 'ボルシチ',
    specialtyImage: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80'
  },
  berlin: {
    spotLabel: 'ブランデンブルク門',
    spotImage: SPOT_IMAGES.brandenburgGate,
    specialtyName: 'ソーセージ',
    specialtyImage: 'https://images.unsplash.com/photo-1529042410759-b054120c7340?w=600&q=80'
  },
  paris: {
    spotLabel: 'エッフェル塔',
    spotImage: SPOT_IMAGES.eiffelTower,
    specialtyName: 'クロワッサン',
    specialtyImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80'
  },
  london: {
    spotLabel: 'ビッグベンと国会議事堂',
    spotImage: SPOT_IMAGES.palaceOfWestminster,
    specialtyName: 'フィッシュ・アンド・チップス',
    specialtyImage: 'https://images.unsplash.com/photo-1579202673508-aec5791345e7?w=600&q=80'
  },
  rome: {
    spotLabel: 'コロッセオ',
    spotImage: SPOT_IMAGES.colosseum,
    specialtyName: 'パスタ',
    specialtyImage: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80'
  },
  barcelona: {
    spotLabel: 'サグラダ・ファミリア',
    spotImage: SPOT_IMAGES.sagradaFamilia,
    specialtyName: 'パエリア',
    specialtyImage: 'https://images.unsplash.com/photo-1534080564583-6be5225a385d?w=600&q=80'
  },
  amsterdam: {
    spotLabel: '運河と街並み',
    spotImage: SPOT_IMAGES.amsterdamCanal,
    specialtyName: 'ストロープワッフル',
    specialtyImage: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80'
  },
  newyork: {
    spotLabel: '自由の女神',
    spotImage: SPOT_IMAGES.statueOfLiberty,
    specialtyName: 'ニューヨークピザ',
    specialtyImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80'
  },
  losangeles: {
    spotLabel: 'ハリウッドサイン',
    spotImage: SPOT_IMAGES.hollywoodSign,
    specialtyName: 'ハンバーガー',
    specialtyImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80'
  },
  sanfrancisco: {
    spotLabel: 'ゴールデンゲートブリッジ',
    spotImage: SPOT_IMAGES.goldenGate,
    specialtyName: 'クラムチャウダー',
    specialtyImage: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80'
  },
  sydney: {
    spotLabel: 'シドニー・オペラハウス',
    spotImage: SPOT_IMAGES.sydneyOpera,
    specialtyName: 'ラム肉',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80'
  },
  cairo: {
    spotLabel: 'ギザのピラミッド',
    spotImage: SPOT_IMAGES.gizaPyramid,
    specialtyName: 'コシャリ',
    specialtyImage: 'https://images.unsplash.com/photo-1585937421612-70a008296f36?w=600&q=80'
  },
  capetown: {
    spotLabel: 'テーブルマウンテン',
    spotImage: SPOT_IMAGES.tableMountain,
    specialtyName: 'ボボティ',
    specialtyImage: 'https://images.unsplash.com/photo-1585937421612-70a008296f36?w=600&q=80'
  },
  riodejaneiro: {
    spotLabel: 'コルコバードのキリスト像',
    spotImage: SPOT_IMAGES.christRedeemer,
    specialtyName: 'シュラスコ',
    specialtyImage: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80'
  },
  honolulu: {
    spotLabel: 'ワイキキとダイヤモンドヘッド',
    spotImage: SPOT_IMAGES.waikiki,
    specialtyName: 'ポキ',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80'
  },
  guam: {
    spotLabel: 'タモンビーチ',
    spotImage: SPOT_IMAGES.guam,
    specialtyName: 'ケラガンヘンムン（レッドライス）',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    description: '太平洋の楽園・グアムに到着！'
  },
  taipei: {
    spotLabel: '台北101',
    spotImage: SPOT_IMAGES.taipei101,
    specialtyName: '小籠包',
    specialtyImage: 'https://images.unsplash.com/photo-1563245372-28a3f4ccb4b5?w=600&q=80'
  },
  manila: {
    spotLabel: 'マニラ湾の夕日',
    spotImage: SPOT_IMAGES.manilaBay,
    specialtyName: 'アドボ',
    specialtyImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80'
  },
  bali: {
    spotLabel: 'ウルワトゥの断崖',
    spotImage: SPOT_IMAGES.bali,
    specialtyName: 'ナシゴレン',
    specialtyImage: 'https://images.unsplash.com/photo-1585937421612-70a008296f36?w=600&q=80'
  },
  hawaii: {
    spotLabel: 'ワイキキビーチ',
    spotImage: SPOT_IMAGES.waikiki,
    specialtyName: 'ポキ',
    specialtyImage: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80'
  }
};

const CITY_NAMES = {
  tokyo: '東京', yokohama: '横浜', hakone: '箱根', shizuoka: '静岡',
  nagoya: '名古屋', kyoto: '京都', osaka: '大阪', kobe: '神戸',
  hiroshima: '広島', fukuoka: '福岡', sapporo: '札幌', sendai: '仙台',
  kanazawa: '金沢', nara: '奈良', seoul: 'ソウル', beijing: '北京',
  shanghai: '上海', hongkong: '香港', singapore: 'シンガポール',
  bangkok: 'バンコク', mumbai: 'ムンバイ', dubai: 'ドバイ',
  istanbul: 'イスタンブール', moscow: 'モスクワ', berlin: 'ベルリン',
  paris: 'パリ', london: 'ロンドン', rome: 'ローマ', barcelona: 'バルセロナ',
  amsterdam: 'アムステルダム', newyork: 'ニューヨーク', losangeles: 'ロサンゼルス',
  sanfrancisco: 'サンフランシスコ', sydney: 'シドニー', cairo: 'カイロ',
  capetown: 'ケープタウン', riodejaneiro: 'リオデジャネイロ', honolulu: 'ホノルル',
  guam: 'グアム', taipei: '台北', manila: 'マニラ', bali: 'バリ'
};

const ALIASES_TO_KEY = {
  グアム: 'guam',
  guam: 'guam',
  グアム島: 'guam',
  台北: 'taipei',
  taipei: 'taipei',
  台北市: 'taipei',
  マニラ: 'manila',
  manila: 'manila',
  バリ: 'bali',
  bali: 'bali',
  バリ島: 'bali',
  ハワイ: 'hawaii',
  hawaii: 'hawaii',
  ホノルル: 'honolulu',
  honolulu: 'honolulu',
  ワイキキ: 'honolulu',
  ワイキキビーチ: 'honolulu',
  waikiki: 'honolulu'
};

const NAME_TO_KEY = Object.fromEntries(
  Object.entries(CITY_NAMES).map(([key, name]) => [name, key])
);

const UNTRUSTED_IMAGE_PATTERNS = [
  /source\.unsplash\.com/,
  /^unsplash\.com/,
  /picsum\.photos/
];

const DEPRECATED_UNSPLASH_IDS = [
  'photo-1590559899731-a382839e5549',
  'photo-1493974677843-e2811c5c7ebd',
  'photo-1528164344705-47542687000d',
  'photo-1540959733332-eab4deabeeaf',
  'photo-1490806843957-31f4c9a91c65',
  'photo-1513326738677-b964603b136d'
];

export function isBrokenImageUrl(url) {
  if (!url || typeof url !== 'string') return true;
  if (UNTRUSTED_IMAGE_PATTERNS.some((re) => re.test(url))) return true;
  return DEPRECATED_UNSPLASH_IDS.some((id) => url.includes(id));
}

export function isGenericImageUrl(url, spotId = null) {
  if (!url) return true;
  if (/^https:\/\/upload\.wikimedia\.org\//i.test(url)) return false;
  if (/fallback\.jpg$/i.test(url)) return true;

  const id = String(spotId || '').toLowerCase();
  if (/tokyoTower/i.test(url)) return id !== 'tokyo-tower';
  if (/tokyoSkytree/i.test(url)) return id !== 'skytree';
  return false;
}

function normalizePlaceName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

export function findLandmarkKey(cityKey, name) {
  if (cityKey && LANDMARKS[cityKey]) return cityKey;
  if (cityKey && getSpotById(cityKey)) return cityKey;
  if (!name) return null;

  const n = name.trim();
  const normalized = normalizePlaceName(n);
  if (NAME_TO_KEY[n]) return NAME_TO_KEY[n];
  if (ALIASES_TO_KEY[n]) return ALIASES_TO_KEY[n];
  if (ALIASES_TO_KEY[normalized]) return ALIASES_TO_KEY[normalized];

  let best = null;
  let bestLen = 0;
  for (const [label, key] of Object.entries(NAME_TO_KEY)) {
    if (n.includes(label) || label.includes(n)) {
      if (label.length > bestLen) {
        bestLen = label.length;
        best = key;
      }
    }
  }
  if (best) return best;

  for (const [alias, key] of Object.entries(ALIASES_TO_KEY)) {
    if (n.includes(alias) || alias.includes(n)) return key;
    const na = normalizePlaceName(alias);
    if (normalized.includes(na) || na.includes(normalized)) return key;
  }
  return null;
}

/** マスタにない地名、または汎用画像のとき Wikipedia から取得が必要 */
export function needsRemoteImage(data, name) {
  // 名所マスタ登録済みは Wikipedia 検索しない（誤った画像で上書きしない）
  if (resolveRegisteredSpot(data?.spotId, name)) return false;

  const image = data?.spotImage;
  if (image && !isGenericImageUrl(image, data?.spotId) && !isBrokenImageUrl(image)) return false;

  const key = findLandmarkKey(data?.cityKey, name);
  if (key && LANDMARKS[key]?.spotImage && !isGenericImageUrl(LANDMARKS[key].spotImage, key)) {
    return false;
  }

  return true;
}

function fallbackImages(name) {
  return {
    spotLabel: name || '目的地',
    spotImage: FALLBACK_SPOT,
    specialtyName: `${name || '現地'}の名物`,
    specialtyImage: DEFAULT_FOOD
  };
}

function resolveLandmarkData(cityKey, name, spotId = null) {
  const locked = lockSpotImage(spotId, name);
  if (locked) return locked;

  const spot = getSpotLandmark(spotId, name);
  if (spot) return spot;

  const key = findLandmarkKey(cityKey, name);
  return key ? LANDMARKS[key] : fallbackImages(name);
}

/** チェックポイントに風景・特産画像を付与（マスタデータを常に優先） */
export function enrichCheckpoint(cp, cityKey = null) {
  const data = resolveLandmarkData(cityKey || cp.cityKey, cp.name, cp.spotId);
  const resolvedKey = data.spotId || cp.spotId || findLandmarkKey(cityKey || cp.cityKey, cp.name);

  return {
    ...cp,
    spotId: data.spotId || cp.spotId || null,
    cityKey: resolvedKey || cp.cityKey,
    spotLabel: data.spotLabel,
    spotImage: data.spotImage || (data.spotId ? FALLBACK_SPOT : DEFAULT_SPOT),
    specialtyName: data.specialtyName,
    specialtyImage: data.specialtyImage || DEFAULT_FOOD,
    description: cp.description || data.description
  };
}

/** 目的地の画像データを取得 */
export function getDestinationLandmark(route) {
  if (!route) return null;
  const lastWp = route.waypoints?.[route.waypoints.length - 1];
  const endCp = route.checkpoints?.[route.checkpoints.length - 1];
  const endName = route.endName;
  const spotId = route.endSpotId || lastWp?.spotId || endCp?.spotId ||
    matchSpot(endName, route.mode)?.id;

  return enrichCheckpoint(
    {
      name: endName,
      description: endCp?.description,
      cityKey: spotId || lastWp?.key,
      spotId
    },
    spotId || lastWp?.spotId || lastWp?.key
  );
}

/** 保存済みルートの画像データを修復 */
export function migrateRouteImages(route) {
  if (!route) return route;

  if (Array.isArray(route.checkpoints)) {
    route.checkpoints = route.checkpoints.map((cp) => {
      const isEnd = cp.id === 'end-final' || cp.name === route.endName;
      return enrichCheckpoint(
        {
          ...cp,
          spotId: cp.spotId || (isEnd ? route.endSpotId : null) || null
        },
        cp.spotId || cp.cityKey
      );
    });
  }

  const lastWp = route.waypoints?.[route.waypoints.length - 1];
  if (lastWp?.spotId) route.endSpotId = route.endSpotId || lastWp.spotId;

  const dest = getDestinationLandmark(route);
  if (dest) {
    route.image = dest.spotImage;
  }

  return lockRouteDestination(route);
}

export { DEFAULT_SPOT, DEFAULT_FOOD, FALLBACK_SPOT };
