/**
 * セーブスロット（最大3）
 */
import { stepsToKm } from './geo.js';
import { cloneState } from './storage.js';

export const MAX_SAVE_SLOTS = 3;
const SLOT_PREFIX = 'aruki-tab-save-slot-';

function slotKey(index) {
  return `${SLOT_PREFIX}${index}`;
}

export function describeSaveSlot(state) {
  if (!state?.route) {
    return {
      title: '旅のデータなし',
      detail: '目的地未設定',
      progressPercent: 0,
      collectionCount: Array.isArray(state?.collection) ? state.collection.length : 0,
    };
  }

  const traveledKm = stepsToKm(state.totalSteps || 0, state.strideCm || 70);
  const progressPercent = state.route.totalKm > 0
    ? Math.min(100, Math.round((traveledKm / state.route.totalKm) * 100))
    : 0;

  return {
    title: state.route.label || `${state.route.startName} → ${state.route.endName}`,
    detail: `進捗 ${progressPercent}% · 制覇 ${Array.isArray(state.collection) ? state.collection.length : 0}件`,
    progressPercent,
    collectionCount: Array.isArray(state.collection) ? state.collection.length : 0,
  };
}

export function listSaveSlots() {
  const slots = [];
  for (let i = 0; i < MAX_SAVE_SLOTS; i += 1) {
    slots.push(getSaveSlot(i));
  }
  return slots;
}

export function getSaveSlot(index) {
  if (index < 0 || index >= MAX_SAVE_SLOTS) return null;
  try {
    const raw = localStorage.getItem(slotKey(index));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveToSlot(index, state) {
  if (index < 0 || index >= MAX_SAVE_SLOTS) return false;
  const summary = describeSaveSlot(state);
  const payload = {
    savedAt: new Date().toISOString(),
    summary,
    state: cloneState(state),
  };
  localStorage.setItem(slotKey(index), JSON.stringify(payload));
  return true;
}

export function deleteSaveSlot(index) {
  if (index < 0 || index >= MAX_SAVE_SLOTS) return;
  localStorage.removeItem(slotKey(index));
}

export function formatSavedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
