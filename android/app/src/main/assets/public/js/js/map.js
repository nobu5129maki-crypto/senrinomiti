import { getRoutePath, unwrapPathLng, unwrapLng } from './geo.js';

let map = null;
let routeLine = null;
let walkedLine = null;
let startMarker = null;
let endMarker = null;
let currentMarker = null;
let footprintMarkers = [];

const TILE_JAPAN = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
};

const TILE_WORLD = TILE_JAPAN;

function createIcon(emoji, className) {
  return L.divIcon({
    className: `custom-marker ${className}`,
    html: `<div class="${className}">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
}

export function initMap(containerId) {
  if (map) return map;

  map = L.map(containerId, {
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer(TILE_JAPAN.url, {
    attribution: TILE_JAPAN.attribution,
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
  }
}

function clearLayers() {
  if (!map) return;

  [routeLine, walkedLine, startMarker, endMarker, currentMarker, ...footprintMarkers].forEach((layer) => {
    if (layer) map.removeLayer(layer);
  });

  routeLine = null;
  walkedLine = null;
  startMarker = null;
  endMarker = null;
  currentMarker = null;
  footprintMarkers = [];
}

/** ルート全体と現在地を描画 */
export function renderRoute(route, currentPos, traveledKm) {
  if (!map) return;

  clearLayers();

  const path = unwrapPathLng(getRoutePath(route));
  const latlngs = path.map((wp) => [wp.lat, wp.lng]);

  const displayPos = currentPos
    ? {
      ...currentPos,
      lng: unwrapLng(currentPos.lng, path[Math.min(currentPos.segmentIndex ?? 0, path.length - 1)].lng)
    }
    : null;

  // ルート全体（点線風の薄い線）
  routeLine = L.polyline(latlngs, {
    color: '#94a3b8',
    weight: 4,
    opacity: 0.6,
    dashArray: '8, 8'
  }).addTo(map);

  // 歩いた区間
  if (traveledKm > 0 && displayPos) {
    const walkedPoints = getWalkedPoints(path, traveledKm, displayPos);
    if (walkedPoints.length >= 2) {
      walkedLine = L.polyline(walkedPoints, {
        color: '#0d9488',
        weight: 5,
        opacity: 0.9
      }).addTo(map);
    }

    // 通過済みチェックポイントに足跡
    route.checkpoints.forEach((cp) => {
      if (cp.distanceKm > 0 && cp.distanceKm <= traveledKm) {
        const footprint = L.marker([cp.lat, cp.lng], {
          icon: createIcon('👣', 'marker-start')
        }).addTo(map);
        footprintMarkers.push(footprint);
      }
    });
  }

  const start = route.waypoints[0];
  const end = route.waypoints[route.waypoints.length - 1];

  startMarker = L.marker([start.lat, start.lng], {
    icon: createIcon('🏁', 'marker-start')
  }).addTo(map).bindPopup(`スタート: ${start.name}`);

  endMarker = L.marker([end.lat, end.lng], {
    icon: createIcon('🎯', 'marker-end')
  }).addTo(map).bindPopup(`ゴール: ${end.name}`);

  if (displayPos) {
    currentMarker = L.marker([displayPos.lat, displayPos.lng], {
      icon: createIcon('🥾', 'marker-current'),
      zIndexOffset: 1000
    }).addTo(map).bindPopup('現在地');
  }

  const bounds = L.latLngBounds(latlngs);
  if (displayPos) bounds.extend([displayPos.lat, displayPos.lng]);
  map.fitBounds(bounds, { padding: [40, 40], maxZoom: route.mode === 'japan' ? 8 : 4 });
}

function getWalkedPoints(waypoints, traveledKm, currentPos) {
  const points = [[waypoints[0].lat, waypoints[0].lng]];
  let accumulated = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const segDist = haversine(a.lat, a.lng, b.lat, b.lng);

    if (accumulated + segDist <= traveledKm) {
      points.push([b.lat, b.lng]);
      accumulated += segDist;
    } else {
      points.push([currentPos.lat, currentPos.lng]);
      break;
    }
  }

  return points;
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

export function getMapElement() {
  return document.getElementById('map');
}
