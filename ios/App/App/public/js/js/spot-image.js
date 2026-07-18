/**

 * 名所画像の固定解決（Wikipedia / 位置検索による上書きを防止）

 */



import { FALLBACK_SPOT, SPOT_REMOTE_FALLBACKS, remoteFallbackForUrl } from './image-urls.js';

import { getSpotLandmark, resolveRegisteredSpot } from './spots.js';



const GENERIC_IMAGE_SPOT_IDS = {

  tokyoTower: new Set(['tokyo-tower']),

  tokyoSkytree: new Set(['skytree'])

};



/** 名所マスタから表示用データを取得（未登録は null） */

export function lockSpotImage(spotId, name) {

  const landmark = getSpotLandmark(spotId, name);

  if (!landmark?.spotImage) return null;

  return { ...landmark };

}



/** プレースホルダとして割り当てられた汎用画像か（spotId 付きで判定） */

function isBlockedGenericUrl(url, spotId = null) {

  if (!url) return false;



  const id = String(spotId || '').toLowerCase();



  if (/tokyoTower/i.test(url)) {

    return !GENERIC_IMAGE_SPOT_IDS.tokyoTower.has(id);

  }

  if (/tokyoSkytree/i.test(url)) {

    return !GENERIC_IMAGE_SPOT_IDS.tokyoSkytree.has(id);

  }



  return false;

}



/** 表示用 URL を決定（登録名所はマスタ画像のみ、それ以外は fallback） */

export function resolveSpotImageUrl(spotId, name, storedUrl = null) {

  const locked = lockSpotImage(spotId, name);

  if (locked?.spotImage && !isBlockedGenericUrl(locked.spotImage, locked.spotId || spotId)) {

    return locked.spotImage;

  }

  if (storedUrl && !isBlockedGenericUrl(storedUrl, spotId)) return storedUrl;

  return FALLBACK_SPOT;

}



/** ルートの目的地画像をマスタで固定 */

export function lockRouteDestination(route) {

  if (!route) return route;



  const locked = lockSpotImage(route.endSpotId, route.endName);

  if (locked) {

    route.endSpotId = locked.spotId;

    route.endSpotImage = locked.spotImage;

    route.image = isBlockedGenericUrl(locked.spotImage, locked.spotId)

      ? FALLBACK_SPOT

      : locked.spotImage;

  } else if (route.endSpotImage && !isBlockedGenericUrl(route.endSpotImage, route.endSpotId)) {

    route.image = route.endSpotImage;

  } else if (isBlockedGenericUrl(route.image, route.endSpotId)) {

    route.image = FALLBACK_SPOT;

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

    : FALLBACK_SPOT;



  if (url && !url.startsWith('http')) {

    imgEl.removeAttribute('referrerpolicy');

  } else if (url) {

    imgEl.referrerPolicy = 'no-referrer';

  }



  imgEl.onerror = () => {
    imgEl.onerror = null;
    const remoteFallback =
      remoteFallbackForUrl(locked?.spotImage || storedUrl) ||
      SPOT_REMOTE_FALLBACKS?.[locked?.spotId || spotId];

    if (remoteFallback && imgEl.src !== remoteFallback) {
      imgEl.referrerPolicy = 'no-referrer';
      imgEl.src = remoteFallback;
      return;
    }

    imgEl.src = fallback;
  };

  imgEl.src = url || fallback;



  return locked;

}


