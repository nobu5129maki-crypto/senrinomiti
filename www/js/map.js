import { getRoutePath, unwrapPathLng, unwrapLng, traveledKmOnPath, haversineDistance } from './geo.js';

let map = null;
let routeLine = null;
let walkedLine = null;
let startMarker = null;
let endMarker = null;
let currentMarker = null;
let footprintMarkers = [];
let midpointMarkers = [];
let lastFitKey = '';

const TILE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
};

function createIcon(emoji, className) {
  return L.divIcon({
    className: `custom-marker ${className}`,
    html: `<div class="${className}">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

/** ラベル付きマーカー（中間地点など） */
function createLabeledIcon(emoji, className, label) {
  return L.divIcon({
    className: `custom-marker ${className}`,
    html: `<div class="${className}"><span class="marker-emoji">${emoji}</span><span class="marker-label">${label}</span></div>`,
    iconSize: [88, 48],
    iconAnchor: [44, 24]
  });
}

function isMidpointCheckpoint(cp, route) {
  if (!cp || !(cp.distanceKm > 0)) return false;
  if (cp.id === 'end-final' || cp.id === 'start-0') return false;
  if (route?.endName && cp.name === route.endName) return false;
  return true;
}

export function initMap(containerId) {
  if (map) return map;

  map = L.map(containerId, {
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer(TILE.url, {
    attribution: TILE.attribution,
    maxZoom: 18
  }).addTo(map);

  return map;
}

export function destroyMap() {
  if (map) {
    map.remove();
    map = null;
    routeLine = null;
    walkedLine = null;
    startMarker = null;
    endMarker = null;
    currentMarker = null;
    footprintMarkers = [];
    midpointMarkers = [];
    lastFitKey = '';
  }
}

export function invalidateMapSize() {
  if (!map) return;
  map.invalidateSize({ animate: false });
}

function clearLayers() {
  if (!map) return;

  [routeLine, walkedLine, startMarker, endMarker, currentMarker, ...footprintMarkers, ...midpointMarkers].forEach((layer) => {
    if (layer) map.removeLayer(layer);
  });

  routeLine = null;
  walkedLine = null;
  startMarker = null;
  endMarker = null;
  currentMarker = null;
  footprintMarkers = [];
  midpointMarkers = [];
}

/** ルート全体と現在地を描画 */
export function renderRoute(route, currentPos, traveledKm) {
  if (!map) return;

  clearLayers();

  const path = unwrapPathLng(getRoutePath(route));
  if (!path.length) return;

  const latlngs = path.map((wp) => [wp.lat, wp.lng]);

  const displayPos = currentPos
    ? {
      ...currentPos,
      lng: unwrapLng(
        currentPos.lng,
        path[Math.min(Math.max(0, currentPos.segmentIndex ?? 0), path.length - 1)].lng
      )
    }
    : null;

  routeLine = L.polyline(latlngs, {
    color: '#94a3b8',
    weight: 4,
    opacity: 0.6,
    dashArray: '8, 8'
  }).addTo(map);

  const walkedPoints = getWalkedPoints(path, traveledKm, displayPos, route.totalKm);

  if (walkedPoints.length >= 2) {
    walkedLine = L.polyline(walkedPoints, {
      color: '#0d9488',
      weight: 5,
      opacity: 0.9
    }).addTo(map);

    // 歩いた道のりに沿って足跡を等間隔で置く（途中で止まって見えない問題を防ぐ）
    for (const pt of sampleTrailPoints(walkedPoints, route.totalKm, traveledKm)) {
      const footprint = L.marker([pt.lat, pt.lng], {
        icon: createIcon('👣', 'marker-footprint'),
        interactive: false,
        keyboard: false
      }).addTo(map);
      footprintMarkers.push(footprint);
    }
  }

  // 中間地点（スタート／ゴール以外）を常に明示表示
  if (Array.isArray(route.checkpoints)) {
    for (const cp of route.checkpoints) {
      if (!isMidpointCheckpoint(cp, route)) continue;
      const lng = unwrapLng(cp.lng, path[0].lng);
      const reached = cp.distanceKm <= traveledKm;
      const midClass = reached ? 'marker-midpoint marker-midpoint-reached' : 'marker-midpoint';
      const mid = L.marker([cp.lat, lng], {
        icon: createLabeledIcon('🚩', midClass, '中間地点'),
        zIndexOffset: 400
      }).addTo(map).bindPopup(`中間地点: ${cp.name || '折り返し'}`);
      midpointMarkers.push(mid);
    }
  }

  const start = route.waypoints[0];
  const end = route.waypoints[route.waypoints.length - 1];

  startMarker = L.marker([start.lat, unwrapLng(start.lng, path[0].lng)], {
    icon: createIcon('🏁', 'marker-start')
  }).addTo(map).bindPopup(`スタート: ${start.name}`);

  endMarker = L.marker([end.lat, unwrapLng(end.lng, path[path.length - 1].lng)], {
    icon: createIcon('🎯', 'marker-end')
  }).addTo(map).bindPopup(`ゴール: ${end.name}`);

  if (displayPos) {
    currentMarker = L.marker([displayPos.lat, displayPos.lng], {
      icon: createLabeledIcon('🥾', 'marker-current', '現在地'),
      zIndexOffset: 1000
    }).addTo(map).bindPopup('現在地（あなたの位置）');
  }

  const fitKey = `${route.id || route.label}:${Math.floor((traveledKm / Math.max(route.totalKm, 1)) * 20)}`;
  const bounds = L.latLngBounds(latlngs);
  if (displayPos) bounds.extend([displayPos.lat, displayPos.lng]);

  // 初回・大きく進んだときだけフィット（毎回ズームし直して進んで見えないのを防ぐ）
  if (fitKey !== lastFitKey) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: route.mode === 'japan' ? 10 : 4 });
    lastFitKey = fitKey;
  }

  map.invalidateSize({ animate: false });
}

/** 歩いた線上に足跡をサンプル（距離に応じて間隔を変える） */
function sampleTrailPoints(walkedPoints, routeTotalKm, traveledKm) {
  if (walkedPoints.length < 2 || traveledKm <= 0) return [];

  const spacingKm = routeTotalKm >= 500 ? 40
    : routeTotalKm >= 100 ? 12
      : routeTotalKm >= 20 ? 3
        : 0.8;

  const samples = [];
  let sinceLast = 0;

  for (let i = 1; i < walkedPoints.length; i++) {
    const a = walkedPoints[i - 1];
    const b = walkedPoints[i];
    const seg = haversineDistance(a[0], a[1], b[0], b[1]);
    sinceLast += seg;

    while (sinceLast >= spacingKm) {
      const overshoot = sinceLast - spacingKm;
      const t = seg > 0 ? 1 - overshoot / seg : 1;
      samples.push({
        lat: a[0] + (b[0] - a[0]) * t,
        lng: a[1] + (b[1] - a[1]) * t
      });
      sinceLast -= spacingKm;
    }
  }

  // 現在地の少し手前にも必ず1つ
  const last = walkedPoints[walkedPoints.length - 1];
  const prev = walkedPoints[Math.max(0, walkedPoints.length - 2)];
  if (samples.length === 0 && traveledKm > spacingKm * 0.3) {
    samples.push({
      lat: (prev[0] + last[0]) / 2,
      lng: (prev[1] + last[1]) / 2
    });
  }

  return samples;
}

function getWalkedPoints(waypoints, traveledKm, currentPos, routeTotalKm = null) {
  const points = [[waypoints[0].lat, waypoints[0].lng]];
  if (!currentPos || traveledKm <= 0) return points;

  const targetAlongPath = traveledKmOnPath(waypoints, traveledKm, routeTotalKm);
  if (targetAlongPath <= 0) return points;

  let accumulated = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segDist = haversineDistance(a.lat, a.lng, b.lat, b.lng);

    if (accumulated + segDist <= targetAlongPath + 1e-6) {
      points.push([b.lat, b.lng]);
      accumulated += segDist;
    } else {
      points.push([currentPos.lat, currentPos.lng]);
      return points;
    }
  }

  // パス終点まで到達した場合も現在地を末尾に
  const last = points[points.length - 1];
  if (
    Math.abs(last[0] - currentPos.lat) > 1e-6
    || Math.abs(last[1] - currentPos.lng) > 1e-6
  ) {
    points.push([currentPos.lat, currentPos.lng]);
  }

  return points;
}

export function getMapElement() {
  return document.getElementById('map');
}

/* ===== 目的地設定：地図タップ用（旅マップとは別インスタンス） ===== */

let pickerMap = null;
let pickerStartMarker = null;
let pickerEndMarker = null;
let pickerClickHandler = null;
let pickerActiveTarget = null; // 'start' | 'end' | null

const PICKER_VIEWS = {
  japan: { center: [36.5, 138.0], zoom: 5 },
  world: { center: [20, 10], zoom: 2 }
};

export function initPickerMap(containerId = 'setup-map') {
  const el = document.getElementById(containerId);
  if (!el) return null;

  if (pickerMap) {
    invalidatePickerMapSize();
    return pickerMap;
  }

  pickerMap = L.map(containerId, {
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer(TILE.url, {
    attribution: TILE.attribution,
    maxZoom: 18
  }).addTo(pickerMap);

  pickerMap.on('click', (e) => {
    if (!pickerActiveTarget || typeof pickerClickHandler !== 'function') return;
    pickerClickHandler({
      target: pickerActiveTarget,
      lat: e.latlng.lat,
      lng: e.latlng.lng
    });
  });

  const view = PICKER_VIEWS.japan;
  pickerMap.setView(view.center, view.zoom);
  return pickerMap;
}

export function destroyPickerMap() {
  if (!pickerMap) return;
  pickerMap.off('click');
  pickerMap.remove();
  pickerMap = null;
  pickerStartMarker = null;
  pickerEndMarker = null;
  pickerClickHandler = null;
  pickerActiveTarget = null;
}

export function setPickerClickHandler(handler) {
  pickerClickHandler = typeof handler === 'function' ? handler : null;
}

export function setPickerActiveTarget(target) {
  pickerActiveTarget = target === 'start' || target === 'end' ? target : null;
  if (!pickerMap) return;
  const container = pickerMap.getContainer();
  container.classList.toggle('picker-active', Boolean(pickerActiveTarget));
  container.classList.toggle('picker-start', pickerActiveTarget === 'start');
  container.classList.toggle('picker-end', pickerActiveTarget === 'end');
}

export function getPickerActiveTarget() {
  return pickerActiveTarget;
}

export function setPickerModeView(mode = 'japan') {
  if (!pickerMap) return;
  const view = PICKER_VIEWS[mode] || PICKER_VIEWS.japan;
  pickerMap.setView(view.center, view.zoom);
}

export function setPickerMarkers(startPlace, endPlace) {
  if (!pickerMap) return;

  if (pickerStartMarker) {
    pickerMap.removeLayer(pickerStartMarker);
    pickerStartMarker = null;
  }
  if (pickerEndMarker) {
    pickerMap.removeLayer(pickerEndMarker);
    pickerEndMarker = null;
  }

  if (startPlace?.lat != null && startPlace?.lng != null) {
    pickerStartMarker = L.marker([startPlace.lat, startPlace.lng], {
      icon: createIcon('🏁', 'marker-start')
    }).addTo(pickerMap).bindPopup(`起点: ${startPlace.name || ''}`);
  }

  if (endPlace?.lat != null && endPlace?.lng != null) {
    pickerEndMarker = L.marker([endPlace.lat, endPlace.lng], {
      icon: createIcon('🎯', 'marker-end')
    }).addTo(pickerMap).bindPopup(`目的地: ${endPlace.name || ''}`);
  }
}

export function invalidatePickerMapSize() {
  if (!pickerMap) return;
  pickerMap.invalidateSize({ animate: false });
}
