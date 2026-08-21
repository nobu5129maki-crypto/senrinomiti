/**
 * 本日 0:00（ローカル）のミリ秒
 */
export function todayStartMs(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function todayKeyFromDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 日付キー (yyyy-MM-dd) の終端ミリ秒 */
export function dateKeyToEndMs(dateKey) {
  const [y, m, d] = String(dateKey || '').split('-').map(Number);
  if (!y || !m || !d) return Date.now();
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

/** 日付キー (yyyy-MM-dd) の 0:00 ミリ秒 */
export function dateKeyToStartMs(dateKey) {
  const [y, m, d] = String(dateKey || '').split('-').map(Number);
  if (!y || !m || !d) return todayStartMs();
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

/** 日付キーを日数分ずらす */
export function shiftDateKey(dateKey, days) {
  const [y, m, d] = String(dateKey || '').split('-').map(Number);
  if (!y || !m || !d) return todayKeyFromDate();
  const dt = new Date(y, m - 1, d + Number(days || 0));
  return todayKeyFromDate(dt);
}

/** from〜to（含む）の日付キー一覧 */
export function listDateKeysInclusive(fromKey, toKey) {
  if (!fromKey || !toKey || fromKey > toKey) return [];
  const out = [];
  let cur = fromKey;
  let guard = 0;
  while (cur <= toKey && guard < 400) {
    out.push(cur);
    cur = shiftDateKey(cur, 1);
    guard += 1;
  }
  return out;
}
