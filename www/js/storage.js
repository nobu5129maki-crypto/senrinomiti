import { todayKey, migrateRoutePath, dateKeyFromMs, stepsToKm } from './geo.js';
import { migrateRouteImages, enrichCheckpoint } from './landmarks.js';
import {
  lockRouteDestination,
  resolveSpotImageUrl,
  isBlockedGenericUrl,
  isKnownBrokenUrl,
  isForeignSpotImage
} from './spot-image.js';

const STORAGE_KEY = 'aruki-tab-state';

const DEFAULT_STATE = {
  mode: 'japan',
  strideCm: 70,
  route: null,
  totalSteps: 0,
  todaySteps: 0,
  manualTodaySteps: 0,
  pedometerTodaySteps: 0,
  todayDate: todayKey(),
  passedCheckpointIds: [],
  collection: [],
  journeyStartedAt: null,
  goalShown: false,
  pedometer: {
    enabled: false,
    autoTrack: false,
    sessionSteps: 0,
    externalBaseline: 0,
    lastNativeTotal: 0,
    deviceBaselineAtJourneyStart: 0
  }
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return normalizeState({ ...DEFAULT_STATE, ...JSON.parse(raw) });
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/** 読み込み・セーブデータ復元時の状態を整える */
export function normalizeState(state) {
  if (state.todayDate !== todayKey()) {
    state.todaySteps = 0;
    state.manualTodaySteps = 0;
    state.pedometerTodaySteps = 0;
    state.todayDate = todayKey();
    if (state.pedometer) state.pedometer.sessionSteps = 0;
  }

  if (!state.pedometer) {
    state.pedometer = { ...DEFAULT_STATE.pedometer };
  }
  if (state.pedometer.deviceBaselineAtJourneyStart == null) {
    state.pedometer.deviceBaselineAtJourneyStart = 0;
  }

  if (state.route) {
    state.route = lockRouteDestination(migrateRoutePath(migrateRouteImages(state.route)));
  } else {
    state.totalSteps = 0;
    state.todaySteps = 0;
    state.manualTodaySteps = 0;
    state.pedometerTodaySteps = 0;
    state.pedometer.sessionSteps = 0;
    state.pedometer.lastNativeTotal = 0;
    state.pedometer.deviceBaselineAtJourneyStart = 0;
    state.pedometer.externalBaseline = 0;
  }

  if (Array.isArray(state.collection) && state.collection.length) {
    state.collection = state.collection.map((item) => {
      const dest = enrichCheckpoint({
        name: item.endName,
        spotId: item.endSpotId
      });
      const endName = item.endName;
      const endSpotId = dest.spotId || null;
      const repaired = resolveSpotImageUrl(
        endSpotId,
        endName,
        dest.spotImage || item.image
      );
      const prev = item.image;
      const prevOk = prev
        && !isBlockedGenericUrl(prev, endSpotId)
        && !isKnownBrokenUrl(prev)
        && !isForeignSpotImage(prev, endSpotId, endName);
      const image = repaired || (prevOk ? prev : null) || dest.spotImage || null;
      // 目的地名を優先し、画像はマスタで修復（秋田なのに仙台城、等を防ぐ）
      return {
        ...item,
        endSpotId,
        spotLabel: endName || dest.spotLabel || item.spotLabel,
        image
      };
    });
  }

  return state;
}

/** セーブスロットから復元した状態を現在のプレイデータに反映 */
export function replaceState(nextState) {
  const state = normalizeState({ ...DEFAULT_STATE, ...JSON.parse(JSON.stringify(nextState)) });
  saveState(state);
  return state;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetTodaySteps(state) {
  state.totalSteps = Math.max(0, state.totalSteps - state.todaySteps);
  state.todaySteps = 0;
  state.manualTodaySteps = 0;
  state.pedometerTodaySteps = 0;
  state.todayDate = todayKey();
  if (state.pedometer) state.pedometer.sessionSteps = 0;
  saveState(state);
  return state;
}

function ensureToday(state) {
  if (state.todayDate !== todayKey()) {
    state.todaySteps = 0;
    state.manualTodaySteps = 0;
    state.pedometerTodaySteps = 0;
    state.todayDate = todayKey();
    if (state.pedometer) state.pedometer.sessionSteps = 0;
    return true;
  }
  return false;
}

/** アプリ復帰時などに日付が変わっていれば本日歩数をリセット */
export function rollTodayIfNeeded(state) {
  const rolled = ensureToday(state);
  if (rolled) saveState(state);
  return { state, rolled };
}

/** ゴール達成後は歩数を一切加算しない */
export function isStepRecordingLocked(state) {
  if (!state) return true;
  if (state.goalShown) return true;
  return isJourneyComplete(state);
}

/** ゴールまでにまだ加算できる歩数（端数で 0 にならないよう ceil） */
export function remainingStepsToGoal(state) {
  if (!state?.route?.totalKm) return Infinity;
  if (state.goalShown || isJourneyComplete(state)) return 0;
  const stride = state.strideCm || 70;
  const traveledKm = stepsToKm(state.totalSteps || 0, stride);
  const remainKm = state.route.totalKm - traveledKm;
  if (remainKm <= 0) return 0;
  return Math.max(1, Math.ceil((remainKm * 100000) / stride));
}

export function addSteps(state, steps, source = 'manual') {
  return addStepsAt(state, steps, source, Date.now());
}

/** 計測時刻を指定して歩数を加算（バックグラウンド復帰・日付またぎ対応） */
export function addStepsAt(state, steps, source = 'manual', atMs = Date.now()) {
  if (state.goalShown) return state;

  let n = Math.max(0, Math.floor(Number(steps) || 0));
  if (n === 0) return state;

  // ゴール距離を超えないようキャップ（到達後は加算停止）
  // ※ km→歩の round だと room=0 なのに未ゴールになり、手動入力が消える不具合があった
  if (state.route?.totalKm) {
    const room = remainingStepsToGoal(state);
    if (room <= 0) return state;
    n = Math.min(n, room);
  }

  const stepDay = dateKeyFromMs(atMs);
  const nowDay = todayKey();

  if (stepDay === nowDay) {
    ensureToday(state);
    state.todaySteps += n;
    state.totalSteps += n;
    if (source === 'pedometer') {
      state.pedometerTodaySteps += n;
    } else {
      state.manualTodaySteps += n;
    }
  } else if (stepDay < nowDay) {
    state.totalSteps += n;
    if (state.todayDate === stepDay) {
      state.todaySteps += n;
      if (source === 'pedometer') {
        state.pedometerTodaySteps += n;
      } else {
        state.manualTodaySteps += n;
      }
    }
  } else {
    // 日付キー不一致時も本日として加算（タイムゾーンずれ対策）
    ensureToday(state);
    state.todaySteps += n;
    state.totalSteps += n;
    if (source === 'pedometer') {
      state.pedometerTodaySteps += n;
    } else {
      state.manualTodaySteps += n;
    }
  }

  saveState(state);
  return state;
}

export function setPedometerEnabled(state, enabled) {
  if (!state.pedometer) state.pedometer = { ...DEFAULT_STATE.pedometer };
  state.pedometer.enabled = enabled;
  if (!enabled) state.pedometer.sessionSteps = 0;
  saveState(state);
  return state;
}

export function setPedometerAutoTrack(state, autoTrack) {
  if (!state.pedometer) state.pedometer = { ...DEFAULT_STATE.pedometer };
  state.pedometer.autoTrack = Boolean(autoTrack);
  state.pedometer.enabled = Boolean(autoTrack);
  if (!autoTrack) state.pedometer.sessionSteps = 0;
  saveState(state);
  return state;
}

export function isPedometerAutoTrack(state) {
  return Boolean(state.pedometer?.autoTrack || state.pedometer?.enabled);
}

export function setPedometerSessionSteps(state, sessionSteps) {
  if (!state.pedometer) state.pedometer = { ...DEFAULT_STATE.pedometer };
  state.pedometer.sessionSteps = sessionSteps;
  saveState(state);
  return state;
}

export function setPedometerLastNativeTotal(state, total) {
  if (!state.pedometer) state.pedometer = { ...DEFAULT_STATE.pedometer };
  state.pedometer.lastNativeTotal = Math.max(0, Math.floor(Number(total) || 0));
  saveState(state);
  return state;
}

export function setPedometerDeviceBaseline(state, total) {
  if (!state.pedometer) state.pedometer = { ...DEFAULT_STATE.pedometer };
  state.pedometer.deviceBaselineAtJourneyStart = Math.max(0, Math.floor(Number(total) || 0));
  saveState(state);
  return state;
}

export function getPedometerDeviceBaseline(state) {
  return Math.max(0, Math.floor(Number(state.pedometer?.deviceBaselineAtJourneyStart) || 0));
}

export function getPedometerLastNativeTotal(state) {
  return Math.max(0, Math.floor(Number(state.pedometer?.lastNativeTotal) || 0));
}

export function setExternalPedometerBaseline(state, value) {
  if (!state.pedometer) state.pedometer = { ...DEFAULT_STATE.pedometer };
  state.pedometer.externalBaseline = Math.max(0, Math.floor(Number(value) || 0));
  saveState(state);
  return state;
}

export function setRoute(state, route) {
  const migrated = lockRouteDestination(migrateRoutePath(migrateRouteImages({ ...route })));
  state.route = {
    id: migrated.id,
    mode: migrated.mode,
    label: migrated.label,
    startName: migrated.startName,
    endName: migrated.endName,
    endSpotId: migrated.endSpotId || null,
    endSpotImage: migrated.endSpotImage || null,
    image: migrated.image,
    totalKm: migrated.totalKm,
    waypoints: migrated.waypoints,
    path: migrated.path || null,
    checkpoints: migrated.checkpoints,
    custom: migrated.custom || false,
    presetId: migrated.presetId || null
  };
  state.totalSteps = 0;
  state.todaySteps = 0;
  state.manualTodaySteps = 0;
  state.pedometerTodaySteps = 0;
  state.todayDate = todayKey();
  state.passedCheckpointIds = [];
  state.journeyStartedAt = new Date().toISOString();
  state.goalShown = false;
  if (state.pedometer) {
    state.pedometer.sessionSteps = 0;
    state.pedometer.externalBaseline = 0;
    state.pedometer.lastNativeTotal = 0;
    state.pedometer.deviceBaselineAtJourneyStart = 0;
  }
  saveState(state);
  return state;
}

export function markGoalShown(state) {
  state.goalShown = true;
  saveState(state);
  return state;
}

export function markCheckpointPassed(state, checkpointId) {
  if (!state.passedCheckpointIds.includes(checkpointId)) {
    state.passedCheckpointIds.push(checkpointId);
    saveState(state);
  }
  return state;
}

export function addToCollection(state, entry) {
  state.collection.unshift(entry);
  saveState(state);
  return state;
}

/** 現在の旅がゴール距離に到達しているか */
export function isJourneyComplete(state) {
  if (!state?.route?.totalKm) return false;
  const traveledKm = stepsToKm(state.totalSteps || 0, state.strideCm || 70);
  return traveledKm >= state.route.totalKm;
}

/** 同じ旅の達成記録が既にあるか */
export function hasCollectionEntry(state, entry) {
  if (!entry?.routeId) return false;
  return state.collection.some((item) =>
    item.routeId === entry.routeId
    && item.totalSteps === entry.totalSteps
    && (entry.startedAt == null || item.startedAt === entry.startedAt)
  );
}

/** 旅の足跡へ達成記録を追加（未登録の場合のみ） */
export function recordJourneyCompletion(state, entry) {
  if (!entry?.routeId || hasCollectionEntry(state, entry)) return state;
  return addToCollection(state, entry);
}

export function clearJourney(state) {
  state.route = null;
  state.totalSteps = 0;
  state.todaySteps = 0;
  state.manualTodaySteps = 0;
  state.pedometerTodaySteps = 0;
  state.passedCheckpointIds = [];
  state.journeyStartedAt = null;
  state.goalShown = false;
  if (state.pedometer) {
    state.pedometer.sessionSteps = 0;
    state.pedometer.externalBaseline = 0;
  }
  saveState(state);
  return state;
}

export function setStride(state, cm) {
  state.strideCm = Math.max(50, Math.min(100, Number(cm) || 70));
  saveState(state);
  return state;
}

export function setMode(state, mode) {
  state.mode = mode;
  saveState(state);
  return state;
}
