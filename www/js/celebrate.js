/**
 * 達成演出 — DOM のみ（Canvas / CDN に依存しない）
 * Android WebView でも見えるよう、紙吹雪・花火を #celebrate-root とゴールモーダル内に描画
 */

const FX_Z = 20000;
const COLORS = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#f87171', '#ffffff', '#f59e0b', '#a78bfa', '#fb7185'];

let stylesReady = false;
let ambienceTimer = 0;
let ambienceRunning = false;
/** クリア演出を続けたいか（タブ移動では消さず、表示だけ止める） */
let ambienceWanted = false;
/** 「旅の途中」タブ表示中のみ true */
let viewActive = true;
/** spawnFireworkBurst / celebrateGoal の遅延タイマー */
const pendingFxTimers = new Set();

function trackTimeout(fn, delay) {
  const id = window.setTimeout(() => {
    pendingFxTimers.delete(id);
    fn();
  }, delay);
  pendingFxTimers.add(id);
  return id;
}

function clearPendingFxTimers() {
  for (const id of pendingFxTimers) {
    window.clearTimeout(id);
  }
  pendingFxTimers.clear();
}

function canShowFx() {
  return viewActive;
}

function applyFxVisibility() {
  const root = document.getElementById('celebrate-root');
  if (root) root.style.display = canShowFx() ? '' : 'none';
  const goal = document.getElementById('goal-fx-layer');
  if (goal) goal.style.display = canShowFx() ? '' : 'none';
}

function clearFxLayers() {
  const root = document.getElementById('celebrate-root');
  if (root) root.innerHTML = '';
  const goal = document.getElementById('goal-fx-layer');
  if (goal) goal.innerHTML = '';
}

function pauseAmbienceTimer() {
  if (ambienceTimer) {
    window.clearTimeout(ambienceTimer);
    ambienceTimer = 0;
  }
  ambienceRunning = false;
}

function runAmbienceLoop() {
  if (!ambienceWanted || !canShowFx()) return;
  if (ambienceRunning) {
    spawnConfetti(24);
    spawnFireworkBurst(2);
    return;
  }
  ambienceRunning = true;
  spawnConfetti(50);
  spawnFireworkBurst(3);

  const tick = () => {
    if (!ambienceWanted || !canShowFx()) {
      ambienceRunning = false;
      ambienceTimer = 0;
      return;
    }
    try {
      spawnConfetti(28);
      spawnFireworkBurst(2);
    } catch { /* ignore */ }
    ambienceTimer = window.setTimeout(tick, 2000);
  };
  ambienceTimer = window.setTimeout(tick, 2000);
}

/**
 * タブ切り替え用。「旅の途中」のときだけ演出を表示する
 * @param {boolean} active
 */
export function setCelebrateViewActive(active) {
  viewActive = Boolean(active);
  applyFxVisibility();
  if (!viewActive) {
    pauseAmbienceTimer();
    clearFxLayers();
    return;
  }
  if (ambienceWanted) {
    runAmbienceLoop();
  }
}

function ensureStyles() {
  if (stylesReady) return;
  stylesReady = true;
  if (document.getElementById('senri-fx-style')) return;
  const style = document.createElement('style');
  style.id = 'senri-fx-style';
  style.textContent = `
    #celebrate-root {
      position: fixed !important;
      inset: 0 !important;
      width: 100% !important;
      height: 100% !important;
      pointer-events: none !important;
      z-index: ${FX_Z} !important;
      overflow: hidden !important;
    }
    .goal-fx-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 8;
      overflow: hidden;
    }
    .senri-fx-piece {
      position: absolute;
      pointer-events: none;
      will-change: transform, opacity;
    }
    .senri-fx-confetti {
      width: 10px;
      height: 14px;
      border-radius: 2px;
      animation: senri-fx-fall linear forwards;
    }
    .senri-fx-petal {
      width: 12px;
      height: 10px;
      border-radius: 80% 0 55% 50%;
      animation: senri-fx-fall linear forwards;
    }
    .senri-fx-spark {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      animation: senri-fx-burst ease-out forwards;
      box-shadow: 0 0 6px currentColor;
    }
    .senri-fx-emoji {
      font-size: 34px;
      line-height: 1;
      animation: senri-fx-burst ease-out forwards;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,.4));
    }
    @keyframes senri-fx-fall {
      0% { transform: translate3d(0,-20px,0) rotate(0deg); opacity: 0; }
      8% { opacity: 1; }
      100% { transform: translate3d(var(--dx), 110vh, 0) rotate(720deg); opacity: 0.2; }
    }
    @keyframes senri-fx-burst {
      0% { transform: translate(0,0) scale(0.3); opacity: 0; }
      15% { opacity: 1; transform: translate(0,0) scale(1.15); }
      100% { transform: translate(var(--dx), var(--dy)) scale(0.35); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function getRoot() {
  ensureStyles();
  let root = document.getElementById('celebrate-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'celebrate-root';
    root.setAttribute('aria-hidden', 'true');
    document.body.appendChild(root);
  }
  return root;
}

function getGoalFxLayer() {
  ensureStyles();
  const modal = document.getElementById('goal-modal');
  if (!modal) return null;
  let layer = document.getElementById('goal-fx-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'goal-fx-layer';
    layer.className = 'goal-fx-layer';
    layer.setAttribute('aria-hidden', 'true');
    modal.insertBefore(layer, modal.firstChild);
  }
  return layer;
}

function targets() {
  const list = [getRoot()];
  const goal = getGoalFxLayer();
  if (goal) list.push(goal);
  return list;
}

function addToTargets(factory) {
  for (const parent of targets()) {
    parent.appendChild(factory());
  }
}

function spawnConfetti(count = 40) {
  if (!canShowFx()) return;
  for (let i = 0; i < count; i++) {
    addToTargets(() => {
      const el = document.createElement('span');
      const isPetal = i % 3 === 0;
      el.className = `senri-fx-piece ${isPetal ? 'senri-fx-petal' : 'senri-fx-confetti'}`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${-8 - Math.random() * 20}%`;
      el.style.background = COLORS[i % COLORS.length];
      el.style.setProperty('--dx', `${(Math.random() - 0.5) * 140}px`);
      el.style.animationDuration = `${2.2 + Math.random() * 2.4}s`;
      el.style.animationDelay = `${Math.random() * 0.6}s`;
      return el;
    });
  }
}

function spawnFireworkBurst(rounds = 4) {
  if (!canShowFx()) return;
  const emojis = ['🎆', '🎇', '✨', '💥', '🌟', '🎉'];
  for (let r = 0; r < rounds; r++) {
    trackTimeout(() => {
      if (!canShowFx()) return;
      const cx = 10 + Math.random() * 80;
      const cy = 10 + Math.random() * 45;
      for (let i = 0; i < 24; i++) {
        addToTargets(() => {
          const el = document.createElement('span');
          el.className = 'senri-fx-piece senri-fx-spark';
          const angle = (Math.PI * 2 * i) / 24;
          const dist = 50 + Math.random() * 100;
          el.style.left = `${cx}%`;
          el.style.top = `${cy}%`;
          el.style.background = COLORS[i % COLORS.length];
          el.style.color = COLORS[i % COLORS.length];
          el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
          el.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
          el.style.animationDuration = `${0.9 + Math.random() * 0.5}s`;
          return el;
        });
      }
      for (let i = 0; i < 6; i++) {
        addToTargets(() => {
          const el = document.createElement('span');
          el.className = 'senri-fx-piece senri-fx-emoji';
          const angle = (Math.PI * 2 * i) / 6;
          const dist = 40 + Math.random() * 70;
          el.textContent = emojis[i % emojis.length];
          el.style.left = `${cx}%`;
          el.style.top = `${cy}%`;
          el.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
          el.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
          el.style.animationDuration = '1.2s';
          return el;
        });
      }
    }, r * 450);
  }
}

export function rainPetals({ count = 40 } = {}) {
  if (!canShowFx()) return;
  try { spawnConfetti(count); } catch { /* ignore */ }
}

export function launchFireworks({ rounds = 5 } = {}) {
  if (!canShowFx()) return;
  try {
    spawnFireworkBurst(rounds);
    spawnConfetti(30);
    if (typeof window.confetti === 'function') {
      for (let i = 0; i < rounds; i++) {
        trackTimeout(() => {
          if (!canShowFx()) return;
          try {
            window.confetti({
              particleCount: 60,
              spread: 70,
              origin: { x: 0.2 + Math.random() * 0.6, y: 0.25 + Math.random() * 0.2 },
              zIndex: FX_Z,
              disableForReducedMotion: false
            });
          } catch { /* ignore */ }
        }, i * 350);
      }
    }
  } catch { /* ignore */ }
}

export function celebrateCheckpoint() {
  if (!canShowFx()) return;
  rainPetals({ count: 36 });
  trackTimeout(() => launchFireworks({ rounds: 3 }), 50);
}

export function celebrateGoal() {
  if (!canShowFx()) return;
  try {
    getRoot();
    getGoalFxLayer();
    applyFxVisibility();
    rainPetals({ count: 70 });
    launchFireworks({ rounds: 8 });
    trackTimeout(() => {
      if (!canShowFx()) return;
      rainPetals({ count: 40 });
      launchFireworks({ rounds: 4 });
    }, 1800);
  } catch (e) {
    console.warn('[celebrate] celebrateGoal failed', e);
  }
}

export function startClearAmbience() {
  try {
    ambienceWanted = true;
    getRoot();
    getGoalFxLayer();
    applyFxVisibility();
    if (!canShowFx()) return;
    runAmbienceLoop();
  } catch (e) {
    console.warn('[celebrate] startClearAmbience failed', e);
  }
}

export function stopClearAmbience() {
  ambienceWanted = false;
  pauseAmbienceTimer();
  clearPendingFxTimers();
  clearFxLayers();
  try {
    if (typeof window.confetti === 'function' && typeof window.confetti.reset === 'function') {
      window.confetti.reset();
    }
  } catch { /* ignore */ }
}

/** クリア用ループが動いているときだけ止める（チェックポイント一発演出は消さない） */
export function stopClearAmbienceIfActive() {
  if (!ambienceWanted) return;
  stopClearAmbience();
}

export function isClearAmbienceRunning() {
  return ambienceRunning && canShowFx();
}
