/** 日本の行政区画（都道府県・市区町村）をオフラインで解決 */

import { CITIES } from './cities.js';

function normalizeAreaQuery(q) {
  return String(q ?? '')
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[－—ー]/g, '-')
    .replace(/\s+/g, '');
}

/** 47都道府県の県庁所在地 */
export const PREFECTURES = {
  北海道: { id: 'pref-hokkaido', capital: '札幌', lat: 43.0629, lng: 141.3544 },
  青森県: { id: 'pref-aomori', capital: '青森', lat: 40.8243, lng: 140.7406 },
  岩手県: { id: 'pref-iwate', capital: '盛岡', lat: 39.7036, lng: 141.1527 },
  宮城県: { id: 'pref-miyagi', capital: '仙台', lat: 38.2688, lng: 140.8721 },
  秋田県: { id: 'pref-akita', capital: '秋田', lat: 39.7186, lng: 140.1023 },
  山形県: { id: 'pref-yamagata', capital: '山形', lat: 38.2404, lng: 140.3633 },
  福島県: { id: 'pref-fukushima', capital: '福島', lat: 37.7508, lng: 140.4676 },
  茨城県: { id: 'pref-ibaraki', capital: '水戸', lat: 36.3418, lng: 140.4468 },
  栃木県: { id: 'pref-tochigi', capital: '宇都宮', lat: 36.5657, lng: 139.8836 },
  群馬県: { id: 'pref-gunma', capital: '前橋', lat: 36.3907, lng: 139.0604 },
  埼玉県: { id: 'pref-saitama', capital: 'さいたま', lat: 35.8617, lng: 139.6455 },
  千葉県: { id: 'pref-chiba', capital: '千葉', lat: 35.6074, lng: 140.1063 },
  東京都: { id: 'pref-tokyo', capital: '東京', lat: 35.6895, lng: 139.6917 },
  神奈川県: { id: 'pref-kanagawa', capital: '横浜', lat: 35.4478, lng: 139.6425 },
  新潟県: { id: 'pref-niigata', capital: '新潟', lat: 37.9026, lng: 139.0236 },
  富山県: { id: 'pref-toyama', capital: '富山', lat: 36.6953, lng: 137.2113 },
  石川県: { id: 'pref-ishikawa', capital: '金沢', lat: 36.5946, lng: 136.6256 },
  福井県: { id: 'pref-fukui', capital: '福井', lat: 36.0652, lng: 136.2216 },
  山梨県: { id: 'pref-yamanashi', capital: '甲府', lat: 35.6642, lng: 138.5685 },
  長野県: { id: 'pref-nagano', capital: '長野', lat: 36.6513, lng: 138.1812 },
  岐阜県: { id: 'pref-gifu', capital: '岐阜', lat: 35.3912, lng: 136.7223 },
  静岡県: { id: 'pref-shizuoka', capital: '静岡', lat: 34.9756, lng: 138.3830 },
  愛知県: { id: 'pref-aichi', capital: '名古屋', lat: 35.1802, lng: 136.9066 },
  三重県: { id: 'pref-mie', capital: '津', lat: 34.7303, lng: 136.5086 },
  滋賀県: { id: 'pref-shiga', capital: '大津', lat: 35.0045, lng: 135.8686 },
  京都府: { id: 'pref-kyoto', capital: '京都', lat: 35.0214, lng: 135.7556 },
  大阪府: { id: 'pref-osaka', capital: '大阪', lat: 34.6863, lng: 135.5200 },
  兵庫県: { id: 'pref-hyogo', capital: '神戸', lat: 34.6901, lng: 135.1955 },
  奈良県: { id: 'pref-nara', capital: '奈良', lat: 34.6851, lng: 135.8327 },
  和歌山県: { id: 'pref-wakayama', capital: '和歌山', lat: 34.2260, lng: 135.1675 },
  鳥取県: { id: 'pref-tottori', capital: '鳥取', lat: 35.5036, lng: 134.2383 },
  島根県: { id: 'pref-shimane', capital: '松江', lat: 35.4723, lng: 133.0505 },
  岡山県: { id: 'pref-okayama', capital: '岡山', lat: 34.6618, lng: 133.9344 },
  広島県: { id: 'pref-hiroshima', capital: '広島', lat: 34.3963, lng: 132.4596 },
  山口県: { id: 'pref-yamaguchi', capital: '山口', lat: 34.1861, lng: 131.4705 },
  徳島県: { id: 'pref-tokushima', capital: '徳島', lat: 34.0658, lng: 134.5590 },
  香川県: { id: 'pref-kagawa', capital: '高松', lat: 34.3403, lng: 134.0434 },
  愛媛県: { id: 'pref-ehime', capital: '松山', lat: 33.8416, lng: 132.7657 },
  高知県: { id: 'pref-kochi', capital: '高知', lat: 33.5597, lng: 133.5311 },
  福岡県: { id: 'pref-fukuoka', capital: '福岡', lat: 33.6064, lng: 130.4181 },
  佐賀県: { id: 'pref-saga', capital: '佐賀', lat: 33.2494, lng: 130.2988 },
  長崎県: { id: 'pref-nagasaki', capital: '長崎', lat: 32.7448, lng: 129.8737 },
  熊本県: { id: 'pref-kumamoto', capital: '熊本', lat: 32.7898, lng: 130.7417 },
  大分県: { id: 'pref-oita', capital: '大分', lat: 33.2382, lng: 131.6126 },
  宮崎県: { id: 'pref-miyazaki', capital: '宮崎', lat: 31.9111, lng: 131.4239 },
  鹿児島県: { id: 'pref-kagoshima', capital: '鹿児島', lat: 31.5602, lng: 130.5581 },
  沖縄県: { id: 'pref-okinawa', capital: '那覇', lat: 26.2124, lng: 127.6809 }
};

/** 東京23区（区役所付近の代表座標） */
export const TOKYO_WARDS = {
  千代田区: { lat: 35.6940, lng: 139.7536 },
  中央区: { lat: 35.6706, lng: 139.7720 },
  港区: { lat: 35.6581, lng: 139.7514 },
  新宿区: { lat: 35.6938, lng: 139.7036 },
  文京区: { lat: 35.7081, lng: 139.7522 },
  台東区: { lat: 35.7126, lng: 139.7800 },
  墨田区: { lat: 35.7107, lng: 139.8015 },
  江東区: { lat: 35.6731, lng: 139.8170 },
  品川区: { lat: 35.6090, lng: 139.7302 },
  目黒区: { lat: 35.6414, lng: 139.6982 },
  大田区: { lat: 35.5614, lng: 139.7161 },
  世田谷区: { lat: 35.6466, lng: 139.6532 },
  渋谷区: { lat: 35.6640, lng: 139.6982 },
  中野区: { lat: 35.7074, lng: 139.6638 },
  杉並区: { lat: 35.6995, lng: 139.6364 },
  豊島区: { lat: 35.7280, lng: 139.7157 },
  北区: { lat: 35.7528, lng: 139.7335 },
  荒川区: { lat: 35.7362, lng: 139.7834 },
  板橋区: { lat: 35.7514, lng: 139.7096 },
  練馬区: { lat: 35.7356, lng: 139.6514 },
  足立区: { lat: 35.7756, lng: 139.8044 },
  葛飾区: { lat: 35.7437, lng: 139.8472 },
  江戸川区: { lat: 35.7067, lng: 139.8687 }
};

function placeFromCity(key, displayName) {
  const city = CITIES[key];
  if (!city) return null;
  return {
    id: key,
    name: city.name,
    displayName: displayName || city.name,
    lat: city.lat,
    lng: city.lng,
    isArea: true
  };
}

function placeFromPrefecture(prefName, pref, displayName) {
  return {
    id: pref.id,
    name: pref.capital,
    displayName: displayName || `${prefName}（${pref.capital}）`,
    lat: pref.lat,
    lng: pref.lng,
    isArea: true,
    prefecture: prefName
  };
}

function findPrefectureMatch(s) {
  if (PREFECTURES[s]) {
    return { prefName: s, pref: PREFECTURES[s], displayName: s };
  }

  if (s.endsWith('市') && s.length > 2) {
    const base = s.slice(0, -1);
    for (const [prefName, pref] of Object.entries(PREFECTURES)) {
      if (pref.capital === base) {
        return { prefName, pref, displayName: s };
      }
    }
  }

  for (const [prefName, pref] of Object.entries(PREFECTURES)) {
    if (pref.capital === s) {
      const simple = prefName === '京都府' || prefName === '大阪府' || prefName === '東京都';
      return {
        prefName,
        pref,
        displayName: simple ? pref.capital : `${pref.capital}（${prefName}）`
      };
    }
  }

  return null;
}

function parseTokyoWard(query) {
  const s = normalizeAreaQuery(query);
  const m = s.match(/^(?:東京都)?(.+区)$/);
  if (!m) return null;
  const ward = m[1];
  return TOKYO_WARDS[ward] ? ward : null;
}

function labelsForLocation(s) {
  const labels = [s];
  const pref = findPrefectureMatch(s);
  if (pref) {
    labels.push(pref.prefName, pref.pref.capital, `${pref.pref.capital}市`);
  }
  for (const [, city] of Object.entries(CITIES)) {
    if (city.name === s) labels.push(`${city.name}市`);
  }
  return [...new Set(labels.map(normalizeAreaQuery))];
}

function scoreAreaLabel(label, query) {
  const q = normalizeAreaQuery(query);
  const l = normalizeAreaQuery(label);
  if (!q || !l) return 0;
  if (l === q) return 100;
  if (l.startsWith(q)) return 90 - (l.length - q.length);
  if (q.startsWith(l)) return 80 - (q.length - l.length);
  return 0;
}

/** 日本の都市マスタキーを名称から検索（都市名・○○市・都道府県） */
export function lookupJapanCityKey(name) {
  const s = normalizeAreaQuery(name);
  if (!s) return null;

  for (const [key, city] of Object.entries(CITIES)) {
    if (city.name === s || key === s.toLowerCase()) return key;
  }

  const pref = findPrefectureMatch(s);
  if (pref) return pref.pref.id;

  if (s.endsWith('市') && s.length > 2) {
    const base = s.slice(0, -1);
    for (const [key, city] of Object.entries(CITIES)) {
      if (city.name === base) return key;
    }
  }

  for (const [key, city] of Object.entries(CITIES)) {
    if (city.name.startsWith(s) && s.length >= 2) return key;
  }

  return null;
}

/** 候補一覧用：オフラインで解決できる行政区画を検索 */
export function searchJapaneseAreaCandidates(query, mode = 'japan') {
  if (mode !== 'japan') return [];

  const q = normalizeAreaQuery(query);
  if (q.length < 2) return [];

  const seen = new Set();
  const scored = [];

  const add = (place, score) => {
    if (!place || seen.has(place.id)) return;
    seen.add(place.id);
    scored.push({ place, score });
  };

  const exact = resolveJapaneseArea(query, mode);
  if (exact) add(exact, 100);

  for (const [prefName, pref] of Object.entries(PREFECTURES)) {
    const labels = [prefName, pref.capital, `${pref.capital}市`];
    const best = Math.max(...labels.map((label) => scoreAreaLabel(label, q)));
    if (best >= 70) add(placeFromPrefecture(prefName, pref, prefName), best);
  }

  for (const [key, city] of Object.entries(CITIES)) {
    const labels = [city.name, `${city.name}市`];
    const best = Math.max(...labels.map((label) => scoreAreaLabel(label, q)));
    if (best >= 70) add(placeFromCity(key, city.name), best);
  }

  for (const [ward, coords] of Object.entries(TOKYO_WARDS)) {
    const labels = [ward, `東京都${ward}`];
    const best = Math.max(...labels.map((label) => scoreAreaLabel(label, q)));
    if (best >= 70) {
      add({
        id: `tokyo-${ward}`,
        name: ward,
        displayName: `東京都${ward}`,
        lat: coords.lat,
        lng: coords.lng,
        isArea: true
      }, best);
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map(({ place }) => place);
}

/** 区・市・都道府県名だけの入力か（番地なし） */
export function looksLikeJapaneseArea(query) {
  const s = normalizeAreaQuery(query);
  if (!s || s.length < 2) return false;
  if (/\d/.test(s) || /[丁目番号\-－—ー]/.test(s)) return false;

  if (PREFECTURES[s] || findPrefectureMatch(s)) return true;
  if (/^東京都.+区$/.test(s)) return true;
  if (/^[^都道府県]{2,10}区$/.test(s)) return true;
  if (/^[^都道府県]{2,12}市$/.test(s)) return true;
  if (/^[^都道府県]{2,8}県$/.test(s)) return true;
  if (lookupJapanCityKey(s)) return true;
  return false;
}

/** 行政区画の追加検索クエリ */
export function buildAreaSearchQueries(query) {
  const normalized = normalizeAreaQuery(query);
  const queries = [];

  const ward = parseTokyoWard(normalized);
  if (ward) {
    queries.push(`東京都${ward}`, `${ward}, 東京都, 日本`, `${ward}, 日本`);
  }

  const pref = findPrefectureMatch(normalized);
  if (pref) {
    queries.push(`${pref.prefName}, 日本`, `${pref.pref.capital}市, 日本`, `${pref.pref.capital}, 日本`);
  }

  if (/^.+(市|町|村)$/.test(normalized)) {
    queries.push(`${normalized}, 日本`);
  }

  return queries;
}

/** ネットワーク不要で行政区画・主要都市を解決 */
export function resolveJapaneseArea(name, mode = 'japan') {
  if (mode !== 'japan') return null;

  const ward = parseTokyoWard(name);
  if (ward) {
    const coords = TOKYO_WARDS[ward];
    return {
      id: `tokyo-${ward}`,
      name: ward,
      displayName: `東京都${ward}`,
      lat: coords.lat,
      lng: coords.lng,
      isArea: true
    };
  }

  const s = normalizeAreaQuery(name);
  const pref = findPrefectureMatch(s);
  if (pref) {
    return placeFromPrefecture(pref.prefName, pref.pref, pref.displayName);
  }

  const cityKey = lookupJapanCityKey(s);
  if (cityKey && CITIES[cityKey]) {
    return placeFromCity(cityKey, s === CITIES[cityKey].name ? CITIES[cityKey].name : s);
  }

  return null;
}

/** ジオコーディング結果が行政区画クエリと一致するか */
export function matchesJapaneseAreaResult(query, place) {
  const area = resolveJapaneseArea(query);
  if (!area || !place) return false;

  const qWard = parseTokyoWard(query);
  if (qWard) {
    const candidates = [place.name, place.displayName]
      .filter(Boolean)
      .map(normalizeAreaQuery);
    return candidates.some((c) => c.includes(qWard) || c.includes(`東京都${qWard}`));
  }

  const labels = labelsForLocation(normalizeAreaQuery(query));
  const candidates = [place.name, place.displayName]
    .filter(Boolean)
    .map(normalizeAreaQuery);
  return candidates.some((c) =>
    labels.some((label) => c === label || c.includes(label) || label.includes(c))
  );
}
