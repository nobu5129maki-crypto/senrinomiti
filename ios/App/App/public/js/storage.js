import { todayKey, migrateRoutePath, dateKeyFromMs } from './geo.js';
import { migrateRouteImages, enrichCheckpoint } from './landmarks.js';
import { lockRouteDestination } from './spot-image.js';

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
    lastNativeTotal: 0
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

  if (state.route) {
    state.route = lockRouteDestination(migrateRoutePath(migrateRouteImages(state.route)));
  }

  if (Array.isArray(state.collection) && state.collection.length) {
    state.collection = state.collection.map((item) => {
      const dest = enrichCheckpoint({ name: item.endName, spotId: item.endSpotId });
      return {
        ...item,
        spotLabel: dest.spotLabel,
        image: dest.spotImage
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

export function addSteps(state, steps, source = 'manual') {
  return addStepsAt(state, steps, source, Date.now());
}

/** 計測時刻を指定して歩数を加算（バックグラウンド復帰・日付またぎ対応） */
export function addStepsAt(state, steps, source = 'manual', atMs = Date.now()) {
  const n = Math.max(0, Math.floor(Number(steps) || 0));
  if (n === 0) return state;

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
  state.todayDate = todayKey();
  state.passedCheckpointIds = [];
  state.journeyStartedAt = new Date().toISOString();
  state.goalShown = false;
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
