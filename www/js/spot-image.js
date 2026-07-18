/**
 * 名所画像の固定解決（Wikipedia / 位置検索による上書きを防止）
 */

import { FALLBACK_SPOT, SPOT_REMOTE_FALLBACKS, remoteFallbackForUrl } from './image-urls.js';
import { getSpotLandmark, resolveRegisteredSpot, findSpotByImageUrl, spotNameMatches } from './spots.js';

const GENERIC_IMAGE_SPOT_IDS = {
  tokyoTower: new Set(['tokyo-tower']),
  tokyoSkytree: new Set(['skytree'])
};

/** 削除済み・404 が確認された古い Wikimedia パス */
const KNOWN_BROKEN_IMAGE_RE = [
  /\/Matsushima_miyagi\.jpg/i, // 旧URL（_z 無し）は削除済み
];

function isKnownBrokenUrl(url) {
  if (!url) return false;
  return KNOWN_BROKEN_IMAGE_RE.some((re) => re.test(url));
}

/** 名所マスタから表示用データを取得（未登録は null）。名称を優先 */
export function lockSpotImage(spotId, name) {
  // 名称一致を先に見ないと、直前目的地の spotId が残ったときに誤画像になる
  const landmark = getSpotLandmark(null, name) || getSpotLandmark(spotId, name);
  if (!landmark?.spotImage) return null;
  return { ...landmark };
}

/** プレースホルダとして割り当てられた汎用画像か（spotId 付きで判定） */
function isBlockedGenericUrl(url, spotId = null) {
  if (!url) return false;
  if (isKnownBrokenUrl(url)) return true;

  const id = String(spotId || '').toLowerCase();

  if (/tokyoTower/i.test(url) || /Tokyo_Tower/i.test(url)) {
    return !GENERIC_IMAGE_SPOT_IDS.tokyoTower.has(id);
  }
  if (/tokyoSkytree/i.test(url) || /Tokyo_Skytree/i.test(url) || /Skytree/i.test(url)) {
    return !GENERIC_IMAGE_SPOT_IDS.tokyoSkytree.has(id);
  }

  return false;
}

/** 保存済み URL が別の名所の画像なら捨てる（秋田なのに仙台城画像、など） */
function isForeignSpotImage(url, spotId, name) {
  if (!url) return false;
  const owner = findSpotByImageUrl(url);
  if (!owner) return false;
  if (spotId && owner.id === spotId) return false;
  if (name && spotNameMatches(owner, name)) return false;
  const self = resolveRegisteredSpot(spotId, name);
  if (self && self.id === owner.id) return false;
  return true;
}

/** 表示用 URL を決定（登録名所はマスタ画像のみ、それ以外は fallback） */
export function resolveSpotImageUrl(spotId, name, storedUrl = null) {
  const locked = lockSpotImage(spotId, name);
  if (locked?.spotImage && !isBlockedGenericUrl(locked.spotImage, locked.spotId || spotId)) {
    return locked.spotImage;
  }

  if (
    storedUrl
    && !isBlockedGenericUrl(storedUrl, spotId)
    && !isKnownBrokenUrl(storedUrl)
    && !isForeignSpotImage(storedUrl, spotId, name)
  ) {
    return storedUrl;
  }

  // 東京タワーを「不明時の共通画像」にしない（他目的地で誤表示されるため）
  const id = String(locked?.spotId || spotId || '').toLowerCase();
  if (GENERIC_IMAGE_SPOT_IDS.tokyoTower.has(id)) return FALLBACK_SPOT;
  return locked?.spotImage || null;
}

/** ルートの目的地画像をマスタで固定 */
export function lockRouteDestination(route) {
  if (!route) return route;

  const locked = lockSpotImage(route.endSpotId, route.endName);
  if (locked) {
    route.endSpotId = locked.spotId;
    route.endName = route.endName || locked.spotLabel;
    route.endSpotImage = locked.spotImage;
    route.image = locked.spotImage;
  } else if (
    route.endSpotImage
    && !isBlockedGenericUrl(route.endSpotImage, route.endSpotId)
    && !isForeignSpotImage(route.endSpotImage, route.endSpotId, route.endName)
  ) {
    route.image = route.endSpotImage;
  } else if (
    isBlockedGenericUrl(route.image, route.endSpotId)
    || isKnownBrokenUrl(route.image)
    || isForeignSpotImage(route.image, route.endSpotId, route.endName)
  ) {
    route.image = resolveSpotImageUrl(route.endSpotId, route.endName, null);
    route.endSpotImage = route.image;
    // 矛盾する旧 spotId をクリア
    if (route.endSpotId && !resolveRegisteredSpot(route.endSpotId, route.endName)) {
      route.endSpotId = null;
    }
  }

  return route;
}

/** 名所マスタ登録済みか */
export function isCatalogSpot(spotId, name) {
  return Boolean(resolveRegisteredSpot(spotId, name));
}

/** img 要素に名所画像を適用（登録名所は外部検索しない） */
export function applySpotImage(imgEl, spotId, name, storedUrl = null) {
  if (!imgEl) return lockSpotImage(spotId, name);

  const locked = lockSpotImage(spotId, name);
  const url = resolveSpotImageUrl(spotId, name, storedUrl);
  const fallback = (locked?.spotImage && !isBlockedGenericUrl(locked.spotImage, locked.spotId || spotId))
    ? locked.spotImage
    : null;

  if (url && !url.startsWith('http')) {
    imgEl.removeAttribute('referrerpolicy');
  } else if (url) {
    imgEl.referrerPolicy = 'no-referrer';
  }

  imgEl.onerror = () => {
    imgEl.onerror = null;
    const rawId = locked?.spotId || spotId || '';
    const camelKey = String(rawId).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const remoteFallback =
      remoteFallbackForUrl(locked?.spotImage || storedUrl || url) ||
      SPOT_REMOTE_FALLBACKS?.[rawId] ||
      SPOT_REMOTE_FALLBACKS?.[camelKey] ||
      (locked?.spotImage && locked.spotImage !== imgEl.src ? locked.spotImage : null);

    if (remoteFallback && !String(imgEl.src || '').includes(remoteFallback.split('/').pop())) {
      if (isForeignSpotImage(remoteFallback, rawId, name)) {
        imgEl.removeAttribute('src');
        imgEl.classList.add('spot-image-missing');
        return;
      }
      imgEl.referrerPolicy = 'no-referrer';
      imgEl.src = remoteFallback;
      return;
    }

    // 他目的地で東京タワーを出さない
    if (fallback && fallback !== imgEl.src && !isBlockedGenericUrl(fallback, rawId)) {
      imgEl.src = fallback;
      return;
    }
    imgEl.removeAttribute('src');
    imgEl.classList.add('spot-image-missing');
  };

  imgEl.src = url || fallback || '';
  if (!imgEl.src) imgEl.classList.add('spot-image-missing');
  else imgEl.classList.remove('spot-image-missing');

  return locked;
}

export { isBlockedGenericUrl, isKnownBrokenUrl, isForeignSpotImage };
