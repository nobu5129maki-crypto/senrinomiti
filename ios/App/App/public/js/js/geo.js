/** 地理計算ユーティリティ */

const EARTH_RADIUS_KM = 6371;

/** 度 → ラジアン */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** 2点間の距離（Haversine, km） */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 2点間の最短経度差（-180〜180） */
function shortestLngDelta(lng1, lng2) {
  let d = lng2 - lng1;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

/** 大圏航路上の中間点（fraction 0=始点, 1=終点） */
export function greatCirclePoint(lat1, lng1, lat2, lng2, fraction) {
  const f = Math.min(1, Math.max(0, fraction));
  const φ1 = toRad(lat1);
  const λ1 = toRad(lng1);
  const φ2 = toRad(lat2);
  const λ2 = toRad(lng1 + shortestLngDelta(lng1, lng2));

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinφ2 = Math.sin(φ2);
  const cosφ2 = Math.cos(φ2);
  const Δλ = λ2 - λ1;

  const a =
    Math.sin((φ2 - φ1) / 2) ** 2 +
    cosφ1 * cosφ2 * Math.sin(Δλ / 2) ** 2;
  const δ = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  if (δ < 1e-10) {
    return { lat: lat1, lng: lng1 };
  }

  const sinδ = Math.sin(δ);
  const A = Math.sin((1 - f) * δ) / sinδ;
  const B = Math.sin(f * δ) / sinδ;
  const x = A * cosφ1 * Math.cos(λ1) + B * cosφ2 * Math.cos(λ2);
  const y = A * cosφ1 * Math.sin(λ1) + B * cosφ2 * Math.sin(λ2);
  const z = A * sinφ1 + B * sinφ2;

  return {
    lat: (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI,
    lng: (Math.atan2(y, x) * 180) / Math.PI
  };
}

/** 地図描画用に経度を連続化（日付変更線越えで長い方の経路を描かない） */
export function unwrapPathLng(path) {
  if (!path?.length) return [];
  const out = [{ lat: path[0].lat, lng: path[0].lng }];
  for (let i = 1; i < path.length; i++) {
    let lng = path[i].lng;
    const prevLng = out[i - 1].lng;
    let delta = lng - prevLng;
    while (delta > 180) {
      lng -= 360;
      delta = lng - prevLng;
    }
    while (delta < -180) {
      lng += 360;
      delta = lng - prevLng;
    }
    out.push({ lat: path[i].lat, lng });
  }
  return out;
}

/** 参照経度に合わせて経度を連続化 */
export function unwrapLng(lng, refLng) {
  let result = lng;
  let delta = result - refLng;
  while (delta > 180) {
    result -= 360;
    delta = result - refLng;
  }
  while (delta < -180) {
    result += 360;
    delta = result - refLng;
  }
  return result;
}

/** 地図描画用の大圏航路座標列 */
export function buildGreatCirclePath(lat1, lng1, lat2, lng2) {
  const dist = haversineDistance(lat1, lng1, lat2, lng2);
  const segments = Math.min(64, Math.max(24, Math.ceil(dist / 400)));
  const path = [];

  for (let i = 0; i <= segments; i++) {
    path.push(greatCirclePoint(lat1, lng1, lat2, lng2, i / segments));
  }
  return path;
}

/** 複数ウェイポイントを大圏航路で結んだ描画用パス */
export function buildRoutePath(waypoints) {
  if (!waypoints?.length) return [];
  const path = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const seg = buildGreatCirclePath(a.lat, a.lng, b.lat, b.lng);
    if (i > 0) seg.shift();
    path.push(...seg);
  }
  return path;
}

/** 保存済みルートの path / 距離 / 中間点を大圏航路で再計算 */
export function migrateRoutePath(route) {
  if (!route?.waypoints?.length) return route;

  const start = route.waypoints[0];
  const end = route.waypoints[route.waypoints.length - 1];

  if (route.custom) {
    route.path = buildGreatCirclePath(start.lat, start.lng, end.lat, end.lng);
    route.totalKm = routeTotalDistance(route.path);

    const midPt = greatCirclePoint(start.lat, start.lng, end.lat, end.lng, 0.5);
    const midWp = route.waypoints.find((wp) => wp.key === 'mid');
    if (midWp) {
      midWp.lat = midPt.lat;
      midWp.lng = midPt.lng;
    }

    if (Array.isArray(route.checkpoints)) {
      const half = route.totalKm / 2;
      for (const cp of route.checkpoints) {
        if (cp.id === 'mid-1') {
          cp.lat = midPt.lat;
          cp.lng = midPt.lng;
          cp.distanceKm = half;
        }
        if (cp.id === 'end-final') {
          cp.distanceKm = route.totalKm;
        }
      }
    }
  } else {
    route.path = buildRoutePath(route.waypoints);
    route.totalKm = routeTotalDistance(route.path);
  }

  return route;
}

/** ルート描画・進捗計算に使う座標列 */
export function getRoutePath(route) {
  if (route?.path?.length) return route.path;
  return route?.waypoints || [];
}

/** ルート全体の距離（km）— waypoints を順に結ぶ */
export function routeTotalDistance(waypoints) {
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    total += haversineDistance(a.lat, a.lng, b.lat, b.lng);
  }
  return total;
}

/** セグメント上の補間点（大圏航路） */
function interpolateSegment(a, b, ratio) {
  return greatCirclePoint(a.lat, a.lng, b.lat, b.lng, ratio);
}

/**
 * ルート上の traveledKm に対応する座標を返す
 * @returns {{ lat, lng, segmentIndex, progressRatio }}
 */
export function positionOnRoute(waypoints, traveledKm) {
  if (!waypoints.length) return null;
  if (waypoints.length === 1 || traveledKm <= 0) {
    return { lat: waypoints[0].lat, lng: waypoints[0].lng, segmentIndex: 0, progressRatio: 0 };
  }

  const total = routeTotalDistance(waypoints);
  if (traveledKm >= total) {
    const last = waypoints[waypoints.length - 1];
    return {
      lat: last.lat,
      lng: last.lng,
      segmentIndex: waypoints.length - 2,
      progressRatio: 1
    };
  }

  let accumulated = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segDist = haversineDistance(a.lat, a.lng, b.lat, b.lng);

    if (accumulated + segDist >= traveledKm) {
      const ratio = segDist > 0 ? (traveledKm - accumulated) / segDist : 0;
      const pos = interpolateSegment(a, b, ratio);
      return { ...pos, segmentIndex: i, progressRatio: traveledKm / total };
    }
    accumulated += segDist;
  }

  const last = waypoints[waypoints.length - 1];
  return { lat: last.lat, lng: last.lng, segmentIndex: waypoints.length - 2, progressRatio: 1 };
}

/** 歩数 → km */
export function stepsToKm(steps, strideCm = 70) {
  return (steps * strideCm) / 100000;
}

/** km → 歩数（概算） */
export function kmToSteps(km, strideCm = 70) {
  return Math.round((km * 100000) / strideCm);
}

/** 到達済みチェックポイントを判定 */
export function getReachedCheckpoints(checkpoints, traveledKm, passedIds = []) {
  const reached = [];
  for (const cp of checkpoints) {
    if (cp.distanceKm <= traveledKm && !passedIds.includes(cp.id)) {
      reached.push(cp);
    }
  }
  return reached;
}

/** 数値フォーマット */
export function formatKm(km) {
  if (km >= 100) return `${Math.round(km)} km`;
  if (km >= 10) return `${km.toFixed(1)} km`;
  return `${km.toFixed(2)} km`;
}

export function formatSteps(n) {
  return n.toLocaleString('ja-JP');
}

/** 旅の開始〜達成までの日数（開始日・達成日を含む） */
export function calcDurationDays(startedAt, achievedAt) {
  if (!startedAt || !achievedAt) return null;
  const start = new Date(startedAt);
  const end = new Date(achievedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function formatDurationDays(startedAt, achievedAt) {
  const days = calcDurationDays(startedAt, achievedAt);
  return days === null ? null : `${days}日`;
}

/** 今日の日付キー YYYY-MM-DD（ローカルタイムゾーン） */
export function todayKey() {
  return dateKeyFromMs(Date.now());
}

/** ミリ秒から日付キー YYYY-MM-DD（ローカルタイムゾーン） */
export function dateKeyFromMs(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
