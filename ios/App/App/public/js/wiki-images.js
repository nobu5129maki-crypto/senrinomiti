/**
 * 未登録の地名・海外目的地向けに Wikipedia から風景画像を取得
 */

import { resolveRegisteredSpot } from './spots.js';

const CACHE_KEY = 'senri-wiki-images';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const USER_AGENT = 'ArukiTabApp/1.0 (walking-travel-pwa)';

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCacheEntry(key, url) {
  if (!url) return;
  const cache = loadCache();
  cache[key] = { url, at: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* quota exceeded — ignore */
  }
}

function getCached(key) {
  const entry = loadCache()[key];
  if (!entry?.url) return undefined;
  if (Date.now() - entry.at > CACHE_TTL_MS) return undefined;
  if (isBlockedImageUrl(entry.url)) return undefined;
  return entry.url;
}

function isBlockedImageUrl(url) {
  return /tokyoSkytree|tokyoTower|Tokyo_Skytree|Skytree/i.test(url || '');
}

async function searchWikiTitle(query, lang) {
  const api = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  api.searchParams.set('action', 'query');
  api.searchParams.set('list', 'search');
  api.searchParams.set('srsearch', query);
  api.searchParams.set('format', 'json');
  api.searchParams.set('origin', '*');

  const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.query?.search?.[0]?.title || null;
}

async function fetchWikiSummaryImage(title, lang) {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const res = await fetch(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
    { headers: { 'User-Agent': USER_AGENT } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const thumb = data.thumbnail?.source;
  if (thumb && isSceneryImage(thumb)) return thumb.replace(/\/(\d+)px-/, '/960px-');
  const original = data.originalimage?.source;
  if (original && isSceneryImage(original)) return original;
  return null;
}

function isSceneryImage(url) {
  if (!url) return false;
  if (/\.svg|Flag_of|flag_of|Coat_of_arms|Emblem_of|Map_of|Locator_map|logo|Logo|icon|Icon|signage|School|school/i.test(url)) {
    return false;
  }
  return true;
}

/** Commons 検索用の英語クエリ（日本語地名 → 風景写真） */
const COMMONS_QUERIES = {
  グアム: 'Tumon Bay Guam',
  guam: 'Tumon Bay Guam',
  グアム島: 'Tumon Bay Guam',
  台北: 'Taipei 101',
  taipei: 'Taipei 101',
  マニラ: 'Manila Bay sunset',
  manila: 'Manila Bay sunset',
  バリ: 'Uluwatu Bali',
  bali: 'Uluwatu Bali',
  バリ島: 'Uluwatu Bali',
  ハワイ: 'Waikiki Beach Hawaii',
  hawaii: 'Waikiki Beach Hawaii',
  ワイキキ: 'Waikiki Beach Hawaii',
  ワイキキビーチ: 'Waikiki Beach Hawaii',
  waikiki: 'Waikiki Beach Hawaii',
  honolulu: 'Waikiki Beach Hawaii',
  パリ: 'Eiffel Tower Paris',
  paris: 'Eiffel Tower Paris',
  ロンドン: 'Palace of Westminster London',
  london: 'Palace of Westminster London',
  ニューヨーク: 'Statue of Liberty New York',
  newyork: 'Statue of Liberty New York',
  シドニー: 'Sydney Opera House',
  sydney: 'Sydney Opera House',
  ソウル: 'N Seoul Tower',
  seoul: 'N Seoul Tower',
  ドバイ: 'Burj Khalifa Dubai',
  dubai: 'Burj Khalifa Dubai',
  シンガポール: 'Merlion Singapore',
  singapore: 'Merlion Singapore',
  バンコク: 'Wat Arun Bangkok',
  bangkok: 'Wat Arun Bangkok',
  ローマ: 'Colosseum Rome',
  rome: 'Colosseum Rome',
  バルセロナ: 'Sagrada Familia Barcelona',
  barcelona: 'Sagrada Familia Barcelona',
  モスクワ: 'Saint Basil Cathedral Moscow',
  moscow: 'Saint Basil Cathedral Moscow',
  ベルリン: 'Brandenburg Gate Berlin',
  berlin: 'Brandenburg Gate Berlin',
  カイロ: 'Giza Pyramids Egypt',
  cairo: 'Giza Pyramids Egypt',
  ケープタウン: 'Table Mountain Cape Town',
  capetown: 'Table Mountain Cape Town',
  リオデジャネイロ: 'Christ the Redeemer Rio',
  riodejaneiro: 'Christ the Redeemer Rio',
  ロサンゼルス: 'Hollywood Sign Los Angeles',
  losangeles: 'Hollywood Sign Los Angeles',
  サンフランシスコ: 'Golden Gate Bridge',
  sanfrancisco: 'Golden Gate Bridge',
  北京: 'Great Wall of China',
  beijing: 'Great Wall of China',
  上海: 'Shanghai Bund skyline',
  shanghai: 'Shanghai Bund skyline',
  香港: 'Hong Kong skyline',
  hongkong: 'Hong Kong skyline',
  ホノルル: 'Waikiki Beach Hawaii',
  日光東照宮: 'Nikko Toshogu shrine Japan',
  日光: 'Nikko Toshogu shrine Japan',
  東照宮: 'Nikko Toshogu shrine Japan'
};

function commonsQueryFor(name, cityKey) {
  if (cityKey && COMMONS_QUERIES[cityKey]) return COMMONS_QUERIES[cityKey];
  const n = name.trim();
  const key = n.toLowerCase().replace(/\s+/g, '');
  return COMMONS_QUERIES[n] || COMMONS_QUERIES[key] || null;
}

async function searchCommonsImage(query) {
  const searchApi = new URL('https://commons.wikimedia.org/w/api.php');
  searchApi.searchParams.set('action', 'query');
  searchApi.searchParams.set('list', 'search');
  searchApi.searchParams.set('srsearch', query);
  searchApi.searchParams.set('srnamespace', '6');
  searchApi.searchParams.set('srlimit', '5');
  searchApi.searchParams.set('format', 'json');
  searchApi.searchParams.set('origin', '*');

  const searchRes = await fetch(searchApi, { headers: { 'User-Agent': USER_AGENT } });
  if (!searchRes.ok) return null;
  const searchData = await searchRes.json();
  const hits = searchData.query?.search || [];
  if (!hits.length) return null;

  const titles = hits.map((h) => h.title).join('|');
  const infoApi = new URL('https://commons.wikimedia.org/w/api.php');
  infoApi.searchParams.set('action', 'query');
  infoApi.searchParams.set('titles', titles);
  infoApi.searchParams.set('prop', 'imageinfo');
  infoApi.searchParams.set('iiprop', 'url|thumburl');
  infoApi.searchParams.set('iiurlwidth', '960');
  infoApi.searchParams.set('format', 'json');
  infoApi.searchParams.set('origin', '*');

  const infoRes = await fetch(infoApi, { headers: { 'User-Agent': USER_AGENT } });
  if (!infoRes.ok) return null;
  const infoData = await infoRes.json();
  const pages = Object.values(infoData.query?.pages || {});

  for (const page of pages) {
    const url = page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url;
    if (url && isSceneryImage(url)) return url;
  }
  return null;
}

async function fetchGeoImage(lat, lng) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('generator', 'geosearch');
  api.searchParams.set('ggsprimary', 'all');
  api.searchParams.set('ggsradius', '10000');
  api.searchParams.set('ggscoord', `${lat}|${lng}`);
  api.searchParams.set('ggslimit', '10');
  api.searchParams.set('prop', 'imageinfo');
  api.searchParams.set('iiprop', 'url|thumburl');
  api.searchParams.set('iiurlwidth', '960');
  api.searchParams.set('format', 'json');
  api.searchParams.set('origin', '*');

  const res = await fetch(api, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = Object.values(data.query?.pages || {});

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    const url = info?.thumburl || info?.url;
    if (url && isSceneryImage(url)) return url;
  }
  return null;
}

/**
 * @param {string} placeName
 * @param {{ lat?: number, lng?: number, lang?: string, cityKey?: string }} [options]
 * @returns {Promise<string|null>}
 */
export async function fetchPlaceImage(placeName, options = {}) {
  const name = placeName?.trim();
  if (!name) return null;

  if (resolveRegisteredSpot(options.spotId, name)) return null;

  const cacheKey = [options.cityKey, name].filter(Boolean).join(':').toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { lat, lng, cityKey } = options;
  let url = null;

  const hint = commonsQueryFor(name, cityKey);
  if (hint) url = await searchCommonsImage(hint);

  if (!url) {
    for (const lang of ['ja', 'en']) {
      const title = await searchWikiTitle(name, lang);
      if (!title) continue;
      url = await fetchWikiSummaryImage(title, lang);
      if (url) break;
    }
  }

  if (!url && lat != null && lng != null) {
    url = await fetchGeoImage(lat, lng);
  }

  if (!url) {
    url = await searchCommonsImage(`${name} beach OR landscape OR skyline`);
  }
  if (!url) {
    url = await searchCommonsImage(name);
  }

  if (url && !isBlockedImageUrl(url)) saveCacheEntry(cacheKey, url);
  return url && !isBlockedImageUrl(url) ? url : null;
}
