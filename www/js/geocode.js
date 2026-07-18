/** 国土地理院・OpenStreetMap による住所・地名・名所検索 */

import { LOCAL_SPOT_MIN_SCORE, searchSpots, spotToPlace } from './spots.js';
import { buildAreaSearchQueries, looksLikeJapaneseArea, searchJapaneseAreaCandidates } from './ja-areas.js';

const GSI_ADDRESS_URL = 'https://msearch.gsi.go.jp/address-search/AddressSearch';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'ArukiTabApp/1.0 (walking-travel-pwa)';

const KANJI_DIGIT = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

let lastRequestAt = 0;

function throttle(ms = 1100) {
  const now = Date.now();
  if (now - lastRequestAt < ms) return false;
  lastRequestAt = now;
  return true;
}

/** 番地付き住所らしい入力か */
export function looksLikeAddress(q) {
  const s = q.trim();
  if (!s) return false;
  if (/\d/.test(s)) return true;
  return /[丁目番号\-－—ー]/.test(s);
}

/** 住所比較用に正規化（全角数字→半角、ハイフン統一、空白除去） */
export function normalizeJaAddressQuery(q) {
  return String(q ?? '')
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[－—ー]/g, '-')
    .replace(/\s+/g, '');
}

function buildSearchQueries(q, mode) {
  const normalized = normalizeJaAddressQuery(q);
  const queries = [q.trim(), normalized];

  if (mode === 'japan' && looksLikeAddress(normalized)) {
    queries.push(`${normalized}, 日本`);
    if (/^[^都道府県]+区/.test(normalized)) {
      queries.push(`東京都${normalized}`);
    }
    const chome = normalized.match(/(\d+)-(\d+)-(\d+)/);
    if (chome) {
      queries.push(normalized.replace(/(\d+)-(\d+)-(\d+)/, '$1丁目$2-$3'));
      queries.push(normalized.replace(/(\d+)-(\d+)-(\d+)/, '$1丁目$2番$3号'));
    }
  } else if (mode === 'japan' && looksLikeJapaneseArea(normalized)) {
    queries.push(...buildAreaSearchQueries(normalized));
    queries.push(`${q.trim()}, 日本`);
  } else if (mode === 'japan') {
    queries.push(`${q.trim()}, 日本`);
    if (!looksLikeAddress(normalized)) {
      queries.push(`${q.trim()} 観光`);
      queries.push(`${q.trim()} 日本 観光`);
    }
  } else if (!looksLikeAddress(normalized)) {
    queries.push(`${q.trim()} tourist attraction`);
    queries.push(`${q.trim()} landmark`);
  }

  return [...new Set(queries.filter(Boolean))];
}

function buildGsiAddressQueries(q) {
  return buildSearchQueries(q, 'japan');
}

/** 住所比較用（丁目・番の表記ゆれを吸収） */
function normalizeAddressForCompare(q) {
  let s = normalizeJaAddressQuery(q);
  s = s.replace(/([一二三四五六七八九十]+)丁目(\d+)番(\d+)号?/g, (_, chome, ban, go) => {
    const n = KANJI_DIGIT[chome] ?? chome;
    return `${n}-${ban}-${go}`;
  });
  s = s.replace(/(\d+)丁目(\d+)番(\d+)号?/g, '$1-$2-$3');
  s = s.replace(/(\d+)丁目(\d+)-(\d+)/g, '$1-$2-$3');
  s = s.replace(/^(東京都|大阪府|京都府|北海道)/, '');
  return s;
}

/**
 * オフラインで解決できる候補（地域・名所）
 * @param {string} query
 * @param {'japan'|'world'} mode
 */
export function searchLocalPlaces(query, mode = 'japan') {
  const q = query.trim();
  if (q.length < 2) return [];

  const localAreas = mode === 'japan' ? searchJapaneseAreaCandidates(q) : [];
  const localSpots = looksLikeAddress(q)
    ? []
    : searchSpots(q, mode, LOCAL_SPOT_MIN_SCORE).map(spotToPlace);

  const merged = [...localAreas];
  for (const place of localSpots) {
    const dup = merged.some(
      (p) => p.name === place.name ||
        (Math.abs(p.lat - place.lat) < 0.001 && Math.abs(p.lng - place.lng) < 0.001)
    );
    if (!dup) merged.push(place);
  }
  return merged;
}

async function searchRemotePlaces(query, mode = 'japan') {
  const q = query.trim();
  if (q.length < 2) return [];

  if (!throttle()) {
    await new Promise((r) => setTimeout(r, 1100));
  }

  let remote = [];
  if (mode === 'japan' && (looksLikeAddress(q) || looksLikeJapaneseArea(q))) {
    remote = await searchGsi(q);
  }
  if (!remote.length) {
    remote = await searchNominatim(q, mode);
  }
  return remote;
}

/**
 * @param {string} query
 * @param {'japan'|'world'} mode
 * @returns {Promise<Array<{ id, name, displayName, lat, lng, spotId?, isSpot? }>>}
 */
export async function searchPlaces(query, mode = 'japan') {
  const q = query.trim();
  if (q.length < 2) return [];

  const local = searchLocalPlaces(q, mode);
  const remote = await searchRemotePlaces(q, mode);

  const merged = [...local];
  for (const place of remote) {
    const dup = merged.some(
      (p) => p.name === place.name ||
        (Math.abs(p.lat - place.lat) < 0.001 && Math.abs(p.lng - place.lng) < 0.001)
    );
    if (!dup) merged.push(place);
  }

  return merged.slice(0, 15);
}

async function fetchNominatimOnce(q, mode) {
  const params = new URLSearchParams({
    q,
    format: 'json',
    limit: '15',
    'accept-language': 'ja',
    addressdetails: '1',
    dedupe: '1'
  });

  if (mode === 'japan') {
    params.set('countrycodes', 'jp');
  }

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'Accept-Language': 'ja', 'User-Agent': USER_AGENT }
  });
  if (!res.ok) return [];

  const data = await res.json();
  return data.map((item, i) => mapNominatimItem(item, i));
}

async function fetchGsiOnce(q) {
  const params = new URLSearchParams({ q });
  const res = await fetch(`${GSI_ADDRESS_URL}?${params}`);
  if (!res.ok) return [];

  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((item, i) => mapGsiItem(item, i));
}

async function searchGsi(q) {
  const queries = buildGsiAddressQueries(q);

  try {
    for (let i = 0; i < queries.length; i += 1) {
      if (i > 0 && !throttle()) {
        await new Promise((r) => setTimeout(r, 1100));
      }

      const results = await fetchGsiOnce(queries[i]);
      if (results.length) return results;
    }
    return [];
  } catch {
    return [];
  }
}

function mapGsiItem(item, i) {
  const [lng, lat] = item.geometry?.coordinates ?? [0, 0];
  const title = item.properties?.title || '';
  return {
    id: `gsi-${i}-${lat}-${lng}`,
    name: title,
    displayName: title,
    lat,
    lng,
    isAddress: true
  };
}

async function searchNominatim(q, mode) {
  const queries = buildSearchQueries(q, mode);
  const seen = new Set();
  const merged = [];

  try {
    for (let i = 0; i < queries.length; i += 1) {
      if (i > 0 && !throttle()) {
        await new Promise((r) => setTimeout(r, 1100));
      }

      const results = await fetchNominatimOnce(queries[i], mode);
      for (const place of results) {
        const key = `${place.lat.toFixed(3)}-${place.lng.toFixed(3)}-${place.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(place);
      }
    }
    return rankNominatimResults(merged, q);
  } catch {
    return [];
  }
}

const LANDMARK_CLASSES = new Set(['tourism', 'historic', 'amenity', 'natural', 'leisure', 'building']);

function rankNominatimResults(results, query) {
  const q = normalizeJaAddressQuery(query);
  return results
    .map((place, i) => ({ place, score: scoreNominatimPlace(place, q, i) }))
    .sort((a, b) => b.score - a.score)
    .map(({ place }) => place);
}

function scoreNominatimPlace(place, q, index) {
  let score = 40 - index;
  if (place.isLandmark) score += 35;
  if (place.isAddress) score -= 15;

  const name = normalizeJaAddressQuery(place.name);
  const display = normalizeJaAddressQuery(place.displayName);
  if (name === q) score += 40;
  else if (name.includes(q) || q.includes(name)) score += 25;
  else if (display.includes(q) || q.includes(display)) score += 15;

  // 名所タグは名称が入力と十分一致するときだけ加点（弱い別名一致の名所がジオ結果より上に来ないように）
  if (place.isSpot && (name === q || name.includes(q) || q.includes(name))) {
    score += 50;
  }

  return score;
}

function mapNominatimItem(item, i) {
  const landmarkClass = item.class || '';
  const isLandmark = LANDMARK_CLASSES.has(landmarkClass) &&
    !looksLikeAddress(item.name || '') &&
    !item.address?.house_number;

  return {
    id: `${item.place_id}-${i}`,
    name: formatShortName(item),
    displayName: formatDisplayName(item),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    isLandmark,
    isAddress: !isLandmark && (looksLikeAddress(formatShortName(item)) || Boolean(item.address?.house_number))
  };
}

function formatDisplayName(item) {
  if (item.name && item.name.trim().length >= 2) {
    const loc = item.address?.country_code === 'jp'
      ? formatJapaneseAddress(item.address)
      : item.display_name.split(',').slice(0, 2).join(', ').trim();
    if (loc && !loc.includes(item.name)) return `${item.name}（${loc}）`;
    return item.name.trim();
  }

  if (item.address?.country_code === 'jp') {
    const short = formatJapaneseAddress(item.address);
    if (short) return short;
  }
  return item.display_name;
}

function formatJapaneseAddress(a) {
  if (!a) return '';

  const prefecture = a.state || a.prefecture || '';
  const ward = a.city_district || a.borough || '';
  const city = (!ward && (a.city || a.town || a.village)) || '';
  const area = a.suburb || a.quarter || a.neighbourhood || a.hamlet || '';
  const road = a.road || a.pedestrian || a.footway || a.path || '';
  const house = a.house_number || '';

  let line2 = ward || city || area;
  if (ward && area && !line2.includes(area)) {
    line2 = ward + area;
  } else if (!ward && area) {
    line2 = area;
  }

  const streetPart = road + house;
  const body = (line2 + streetPart) || road || area || ward || city;

  return (prefecture + body) || '';
}

function formatShortName(item) {
  if (item.name && item.name.trim().length >= 2) {
    return item.name.trim();
  }

  const a = item.address || {};

  if (a.country_code === 'jp' || a.country === '日本') {
    const ja = formatJapaneseAddress(a);
    if (ja.length >= 2) return ja;
  }

  const parts = [
    a.house_number,
    a.road,
    a.pedestrian,
    a.tourism,
    a.amenity,
    a.quarter,
    a.suburb,
    a.neighbourhood,
    a.city_district,
    a.town,
    a.village,
    a.city,
    a.state,
    a.prefecture
  ].filter(Boolean);

  const unique = [...new Set(parts)];
  if (unique.length) return unique.slice(0, 4).join(' ');
  return item.display_name.split(',')[0];
}

/** 入力値と検索結果が同一地点か */
export function isSamePlaceQuery(input, place) {
  const norm = normalizeJaAddressQuery(input);
  if (!norm || !place) return false;

  const candidates = [
    place.queryText,
    place.name,
    place.displayName
  ].filter(Boolean).map(normalizeJaAddressQuery);

  const normAddr = normalizeAddressForCompare(input);
  const addrCandidates = candidates.map(normalizeAddressForCompare);

  // 部分一致は「仙台」と無関係な入力でも旧選択を再利用してしまうため禁止
  const same = (a, b) => {
    if (!a || !b) return false;
    if (a === b) return true;
    // 秋田 ↔ 秋田市 / 秋田県 のみ許容
    const bases = [a, b].map((x) => x.replace(/(都|道|府|県|市|区|町|村)$/g, ''));
    return bases[0].length >= 2 && bases[0] === bases[1];
  };

  return candidates.some((c) => same(c, norm)) ||
    addrCandidates.some((c) => same(c, normAddr));
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{ name, displayName, lat, lng }|null>}
 */
export async function reverseGeocode(lat, lng) {
  if (!throttle()) {
    await new Promise((r) => setTimeout(r, 1100));
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    'accept-language': 'ja',
    addressdetails: '1'
  });

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { 'Accept-Language': 'ja', 'User-Agent': USER_AGENT }
    });
    if (!res.ok) return null;

    const item = await res.json();
    return mapNominatimItem(item, 0);
  } catch {
    return null;
  }
}

/** 現在地取得 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('この端末では位置情報が利用できません。'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || '位置情報の取得に失敗しました。')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  });
}
