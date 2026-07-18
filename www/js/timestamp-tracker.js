/**
 * setInterval に依存しない、visibilitychange ベースの計測クロック。
 * Date.now() を基準に壁時計の経過を管理する。
 */
export function createTimestampTracker() {
  /** @type {{ running: boolean, startedAt: number|null, hiddenAt: number|null, lastSyncAt: number|null }} */
  let state = {
    running: false,
    startedAt: null,
    hiddenAt: null,
    lastSyncAt: null,
  };

  function start() {
    const now = Date.now();
    state = {
      running: true,
      startedAt: now,
      hiddenAt: null,
      lastSyncAt: now,
    };
    return getSnapshot();
  }

  function stop() {
    const snap = getSnapshot();
    state.running = false;
    state.hiddenAt = null;
    return snap;
  }

  function reset() {
    state = {
      running: false,
      startedAt: null,
      hiddenAt: null,
      lastSyncAt: null,
    };
  }

  /** document.visibilityState === 'hidden' */
  function onHidden() {
    if (!state.running || state.hiddenAt) return null;
    const now = Date.now();
    state.hiddenAt = now;
    state.lastSyncAt = null;
    return { hiddenAt: now };
  }

  /**
   * document.visibilityState === 'visible'
   * @returns {{ hiddenDurationMs: number, sinceLastSyncMs: number, totalElapsedMs: number, now: number } | null}
   */
  function onVisible() {
    if (!state.running) return null;

    const now = Date.now();
    const hiddenDurationMs = state.hiddenAt ? now - state.hiddenAt : 0;
    const sinceLastSyncMs = state.lastSyncAt ? now - state.lastSyncAt : hiddenDurationMs;
    const totalElapsedMs = state.startedAt ? now - state.startedAt : 0;

    state.hiddenAt = null;
    state.lastSyncAt = now;

    return { hiddenDurationMs, sinceLastSyncMs, totalElapsedMs, now };
  }

  function markSynced() {
    state.lastSyncAt = Date.now();
  }

  /** 壁時計ベースの経過ミリ秒 */
  function getElapsedMs() {
    if (!state.running || !state.startedAt) return 0;
    if (state.hiddenAt) {
      return state.hiddenAt - state.startedAt;
    }
    return Date.now() - state.startedAt;
  }

  function isRunning() {
    return state.running;
  }

  function isHidden() {
    return Boolean(state.hiddenAt);
  }

  function getSnapshot() {
    return {
      ...state,
      elapsedMs: getElapsedMs(),
    };
  }

  return {
    start,
    stop,
    reset,
    onHidden,
    onVisible,
    markSynced,
    getElapsedMs,
    isRunning,
    isHidden,
    getSnapshot,
  };
}
