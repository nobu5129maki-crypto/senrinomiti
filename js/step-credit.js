/**
 * 端末がバックグラウンドで記録した歩数を、アプリを都度開かなくても
 * 旅へ加算するための純関数。
 */

import { listDateKeysInclusive, shiftDateKey, todayKeyFromDate } from './date-utils.js';

export const FIRST_SYNC_GUARD_STEPS = 500;
export const CATCH_UP_MAX_DAYS = 31;
export const CREDITED_BY_DATE_KEY = 'senri-credited-by-date';

/**
 * 端末のその日の歩数と、すでに旅へ加算済みの歩数から差分を出す。
 * 計測ONの状態なら、アプリを開いていなかった間の歩数も計上する。
 */
export function computeCatchUpDelta({
  sourceTotal = 0,
  alreadyCredited = 0,
  floorCredited = 0,
  suppressCredit = false,
  allowBackgroundCatchUp = false
} = {}) {
  const source = Math.max(0, Math.floor(Number(sourceTotal) || 0));
  const already = Math.max(0, Math.floor(Number(alreadyCredited) || 0));
  const floor = Math.max(0, Math.floor(Number(floorCredited) || 0));
  const creditedFloor = Math.max(already, floor);
  const delta = source - creditedFloor;

  if (delta <= 0) {
    return {
      delta: 0,
      nextCredited: Math.max(source, creditedFloor),
      reason: 'none'
    };
  }

  if (suppressCredit) {
    return { delta: 0, nextCredited: source, reason: 'suppressed' };
  }

  // 計測を始めたことがない状態での大きな本日値は、旅開始前の歩数なので基準合わせのみ
  if (
    !allowBackgroundCatchUp
    && already <= 0
    && source >= FIRST_SYNC_GUARD_STEPS
  ) {
    return { delta: 0, nextCredited: source, reason: 'first-sync-baseline' };
  }

  return { delta, nextCredited: source, reason: 'credit' };
}

/**
 * アプリ再開時に「本日の計上済み水位」として使ってよい値。
 * 日付が変わっている場合、昨日の端末累計を本日の水位にしてはいけない。
 */
export function restoreTodayWatermark({
  today,
  markerDate,
  markerTotal = 0,
  lastNativeTotal = 0
} = {}) {
  const marker = Math.max(0, Math.floor(Number(markerTotal) || 0));
  const last = Math.max(0, Math.floor(Number(lastNativeTotal) || 0));
  if (markerDate && markerDate === today) {
    const watermark = Math.max(marker, last);
    return { applyToToday: true, watermark, sessionSteps: watermark };
  }
  return { applyToToday: false, watermark: 0, sessionSteps: 0 };
}

/** 旅開始日〜昨日までの取り込み対象日 */
export function catchUpDateWindow({
  journeyStartedAt = null,
  today,
  maxDays = CATCH_UP_MAX_DAYS
} = {}) {
  if (!today) return { from: null, to: null, days: [] };
  const yesterday = shiftDateKey(today, -1);
  let from = shiftDateKey(today, -(Math.max(1, maxDays)));
  if (journeyStartedAt) {
    const started = todayKeyFromDate(new Date(journeyStartedAt));
    if (started && started > from) from = started;
  }
  if (!yesterday || from > yesterday) {
    return { from: null, to: null, days: [] };
  }
  return { from, to: yesterday, days: listDateKeysInclusive(from, yesterday) };
}

export function journeyStartDateKey(journeyStartedAt) {
  if (!journeyStartedAt) return '';
  try {
    return todayKeyFromDate(new Date(journeyStartedAt));
  } catch {
    return '';
  }
}

function readStorage(key) {
  try {
    if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
  } catch {
    /* ignore */
  }
  return null;
}

function writeStorage(key, value) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    /* ignore */
  }
}

function removeStorage(key) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function loadCreditedByDate() {
  try {
    const raw = readStorage(CREDITED_BY_DATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object') return {};
    const out = {};
    for (const [date, value] of Object.entries(parsed)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      out[date] = Math.max(0, Math.floor(Number(value) || 0));
    }
    return out;
  } catch {
    return {};
  }
}

export function saveCreditedByDate(map, today) {
  const next = { ...map };
  if (today) {
    const oldest = shiftDateKey(today, -CATCH_UP_MAX_DAYS - 2);
    for (const date of Object.keys(next)) {
      if (date < oldest) delete next[date];
    }
  }
  writeStorage(CREDITED_BY_DATE_KEY, JSON.stringify(next));
  return next;
}

export function getCreditedForDate(dateKey, fallback = 0) {
  if (!dateKey) return Math.max(0, Math.floor(Number(fallback) || 0));
  const map = loadCreditedByDate();
  if (Object.prototype.hasOwnProperty.call(map, dateKey)) {
    return Math.max(0, Math.floor(Number(map[dateKey]) || 0));
  }
  return Math.max(0, Math.floor(Number(fallback) || 0));
}

export function setCreditedForDate(dateKey, total, today = dateKey) {
  if (!dateKey) return total;
  const map = loadCreditedByDate();
  map[dateKey] = Math.max(0, Math.floor(Number(total) || 0));
  saveCreditedByDate(map, today);
  return map[dateKey];
}

export function hasAnyCreditedDate() {
  return Object.keys(loadCreditedByDate()).length > 0;
}

export function resetCreditedByDate() {
  removeStorage(CREDITED_BY_DATE_KEY);
}

export function mergeMarkerIntoCredited(dateKey, total) {
  if (!dateKey) return;
  const current = getCreditedForDate(dateKey, 0);
  const next = Math.max(current, Math.max(0, Math.floor(Number(total) || 0)));
  setCreditedForDate(dateKey, next, dateKey);
}
