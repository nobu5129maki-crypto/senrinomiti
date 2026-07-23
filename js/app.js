import {

  stepsToKm,

  positionOnRoute,

  getRoutePath,

  getReachedCheckpoints,

  formatKm,

  formatSteps,

  formatDurationDays
} from './geo.js';

import {

  loadState,

  saveState,

  addSteps,

  addStepsAt,

  resetTodaySteps,

  setRoute,

  markCheckpointPassed,

  clearJourney,

  replaceState,

  markGoalShown,

  isJourneyComplete,

  isStepRecordingLocked,

  remainingStepsToGoal,

  hasCollectionEntry,

  recordJourneyCompletion,

  setStride,

  setMode,

  setPedometerAutoTrack,

  isPedometerAutoTrack,

  setPedometerSessionSteps,

  setExternalPedometerBaseline,

  setPedometerLastNativeTotal,

  getPedometerLastNativeTotal,

  setPedometerDeviceBaseline,

  getPedometerDeviceBaseline,

  rollTodayIfNeeded
} from './storage.js';

import {

  getPresetsForMode,

  createRouteFromPlaces,

  presetWithCustomStart,

  PRESETS,

  resolveLocalPlace

} from './routes.js';

import { initMap, renderRoute, destroyMap, invalidateMapSize, initPickerMap, setPickerClickHandler, setPickerActiveTarget, getPickerActiveTarget, setPickerModeView, setPickerMarkers, invalidatePickerMapSize } from './map.js';
import {
  celebrateGoal,
  celebrateCheckpoint,
  startClearAmbience,
  stopClearAmbience,
  stopClearAmbienceIfActive,
  setCelebrateViewActive
} from './celebrate.js';

import { searchPlaces, searchLocalPlaces, reverseGeocode, getCurrentPosition, looksLikeAddress, normalizeJaAddressQuery, isSamePlaceQuery } from './geocode.js';
import { resolveJapaneseArea, matchesJapaneseAreaResult } from './ja-areas.js';
import { getSpotById, spotToPlace, attachSpotMetadata, findResolvableSpot } from './spots.js';

import * as pedometer from './pedometer.js';
import * as nativeSteps from './native-steps.js';
import { initUpdateChecker } from './update-check.js';
import { initAndroidInstallPrompt } from './android-install.js';
import { initIosInstallPrompt } from './ios-install.js';
import { INSTALL_PAGE_URL, IOS_INSTALL_PAGE_URL } from './distribution-config.js';
import { runWelcomeIfNeeded } from './onboarding.js';
import { runNativeInstallGuideIfNeeded } from './native-install-guide.js';
import { runIosInstallGuideIfNeeded } from './ios-install-guide.js';
import {
  MAX_SAVE_SLOTS,
  deleteSaveSlot,
  formatSavedAt,
  getSaveSlot,
  listSaveSlots,
  saveToSlot,
} from './save-slots.js';
import * as userMsg from './user-messages.js';
import { enrichCheckpoint, getDestinationLandmark, DEFAULT_SPOT, DEFAULT_FOOD, FALLBACK_SPOT, needsRemoteImage, findLandmarkKey } from './landmarks.js';
import { fetchPlaceImage } from './wiki-images.js';
import { applySpotImage, isCatalogSpot, resolveSpotImageUrl } from './spot-image.js';



/** @type {ReturnType<typeof loadState>} */

let state = loadState();

let mapInitialized = false;

let checkpointTimeout = null;
let checkpointQueue = [];
let showingCheckpoint = false;
let goalShareSnapshot = null;

function setImageWithFallback(imgEl, url, fallback = FALLBACK_SPOT) {
  if (!imgEl) return;
  if (url && !url.startsWith('http')) {
    imgEl.removeAttribute('referrerpolicy');
  } else {
    imgEl.referrerPolicy = 'no-referrer';
  }
  imgEl.onerror = () => {
    imgEl.onerror = null;
    // 名所画像の読み込み失敗時は汎用タワー画像にせず fallback.jpg へ
    imgEl.src = fallback;
  };
  imgEl.src = url || fallback;
}

async function loadRemoteSpotImage(imgEl, data, name, lat, lng) {
  if (!imgEl || !data) return;

  const spotId = data.spotId || data.endSpotId;
  if (isCatalogSpot(spotId, name)) {
    applySpotImage(imgEl, spotId, name, data.spotImage);
    return;
  }

  if (!needsRemoteImage(data, name)) return;

  const cityKey = findLandmarkKey(data?.cityKey, name);
  const url = await fetchPlaceImage(name, { lat, lng, cityKey, spotId });
  if (url) setImageWithFallback(imgEl, url, data.spotImage || FALLBACK_SPOT);
}

function showOverlay(el) {
  if (!el) return;
  el.removeAttribute('hidden');
}

function hideOverlay(el) {
  if (!el) return;
  el.setAttribute('hidden', '');
}



/** @type {{ start: object|null, end: object|null }} */

const selectedPlaces = { start: null, end: null };

let searchTimer = null;
let searchSeq = 0;

let deferredInstallPrompt = null;

const INSTALL_DISMISS_KEY = 'senri-install-dismissed';

const $ = (sel) => document.querySelector(sel);

const $$ = (sel) => document.querySelectorAll(sel);



// ===== Init =====

async function init() {
  try { bindNavigation(); } catch (e) { console.error('bindNavigation', e); }
  try { bindDashboard(); } catch (e) { console.error('bindDashboard', e); }
  try { bindPedometer(); } catch (e) { console.error('bindPedometer', e); }
  try { bindPedometerLifecycle(); } catch (e) { console.error('bindPedometerLifecycle', e); }
  try { bindSetup(); } catch (e) { console.error('bindSetup', e); }
  try { bindSaveSlots(); } catch (e) { console.error('bindSaveSlots', e); }
  try { bindGoalModal(); } catch (e) { console.error('bindGoalModal', e); }
  try { bindCheckpointModal(); } catch (e) { console.error('bindCheckpointModal', e); }

  pedometer.setCreditedTodayGetter?.(() => state.pedometerTodaySteps || 0);
  pedometer.setJourneyActiveGetter?.(() => Boolean(state.route));

  initInstallPrompt();
  initAndroidInstallPrompt();
  initIosInstallPrompt();
  updatePedometerHintText();

  await bootstrapPedometer();

  pedometer.drainQueuedSteps(handlePedometerUpdate);
  syncProgressOnLoad();
  onTabViewChanged(getActiveViewName());
  refreshUI();
  initUpdateChecker().catch(() => {});

  if (typeof window.__senriFlushPending === 'function') {
    window.__senriFlushPending();
  }

  document.dispatchEvent(new Event('senri:ready'));
}

function updatePedometerHintText() {
  const hint = $('#pedometer-hint');
  if (!hint) return;
  hint.textContent = userMsg.pedometerHint({
    googleFitConnected: pedometer.isGoogleFitConnected?.(),
    googleFitAvailable: pedometer.isGoogleFitConfigured?.() && pedometer.isAndroidDevice?.(),
    fitActive: pedometer.isGoogleFitPedometerActive?.(),
    nativeActive: pedometer.isNativePedometerActive?.(),
  });
}

function updateInstallModeWarning() {
  const box = $('#pedometer-pwa-warning');
  const text = $('#pedometer-pwa-warning-text');
  const apkLink = $('#pedometer-apk-link');
  const kind = userMsg.getInstallKind();
  const isAndroidWeb = kind === 'android-pwa' || (kind === 'browser' && userMsg.isAndroidBrowser?.());
  const isIosWeb = kind === 'ios-pwa' || (kind === 'browser' && userMsg.isIosBrowser?.());

  if (!box || !text) return;

  if (isAndroidWeb) {
    text.textContent = userMsg.nativeAppInstallWarning();
    box.removeAttribute('hidden');
    if (apkLink) {
      apkLink.href = INSTALL_PAGE_URL || '/install-android.html';
      apkLink.textContent = 'Android版をインストール（常時記録）';
      apkLink.removeAttribute('hidden');
    }
    return;
  }

  if (isIosWeb) {
    text.textContent = userMsg.iosWebInstallWarning();
    box.removeAttribute('hidden');
    if (apkLink) {
      apkLink.href = IOS_INSTALL_PAGE_URL || '/install-ios.html';
      apkLink.textContent = 'ホーム画面に追加（約30秒）';
      apkLink.removeAttribute('hidden');
    }
    return;
  }

  box.setAttribute('hidden', '');
  apkLink?.setAttribute('hidden', '');
}

async function ensureNativeTrackingIfNeeded() {
  if (!userMsg.isAndroidNative() && !userMsg.isIosNative()) return;
  if (!pedometer.isEnabled?.()) return;
  if (pedometer.isNativePedometerActive?.()) return;
  await pedometer.retryNativeDailyTracking?.(handlePedometerUpdate);
  updatePedometerUI();
  updateInstallModeWarning();
}

async function preparePreJourneyPedometer() {
  pedometer.clearDailySyncMarkers?.();
  if (!state.route) {
    await nativeSteps.resetNativeSessionBaseline?.();
  }
}

async function alignPedometerBaselineForJourney() {
  if (!state.route) {
    await preparePreJourneyPedometer();
  }
  const deviceToday = await pedometer.syncBaselineToDevice();
  state = setPedometerDeviceBaseline(state, deviceToday);
  state = setPedometerLastNativeTotal(state, deviceToday);
  state = setPedometerSessionSteps(state, deviceToday);
  return deviceToday;
}

function getDisplayedDeviceStepsToday() {
  if (!state.route) return 0;
  const deviceBase = getPedometerDeviceBaseline(state);
  const rawDevice = Math.max(0, state.pedometer?.sessionSteps ?? pedometer.getSessionSteps());
  return Math.max(0, rawDevice - deviceBase);
}

async function startPedometerForUser() {
  await alignPedometerBaselineForJourney();
  const result = await pedometer.startAutoDailyTracking(handlePedometerUpdate);
  if (result.ok) {
    state = setPedometerAutoTrack(state, true);
    await pedometer.catchUpAfterBackground?.(5);
    if (!state.route) {
      await alignPedometerBaselineForJourney();
    }
  }
  updatePedometerUI();
  refreshBackgroundTrackingStatus();
  return result;
}

async function bootstrapPedometer() {
  await nativeSteps.waitForNativeReady?.().catch(() => {});
  if (!state.route) {
    await preparePreJourneyPedometer();
  }
  updatePedometerHintText();
  updateInstallModeWarning();

  const isNative = userMsg.isAndroidNative() || userMsg.isIosNative();
  if (isNative) {
    const welcomed = await runWelcomeIfNeeded(startPedometerForUser);
    if (welcomed) return;
    await restorePedometer();
    await ensureNativeTrackingIfNeeded();
    return;
  }

  if (userMsg.isAndroidBrowser?.()) {
    await runNativeInstallGuideIfNeeded();
  } else if (userMsg.isIosBrowser?.()) {
    await runIosInstallGuideIfNeeded();
  }

  await restorePedometer();
}

function exposeApi() {
  window.__senriApplyCustomRoute = () => applyCustomRoute();
  window.__senriSelectPreset = selectPresetById;
  window.__senriSetMode = (mode) => {
    $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
    state = setMode(state, mode);
    selectedPlaces.start = null;
    selectedPlaces.end = null;
    clearMapPickSelectionUi();
    setPickerModeView(mode);
    setPickerMarkers(null, null);
    refreshUI();
  };
  window.__senriOnTab = onTabViewChanged;
  window.__senriReady = true;
}

function selectPresetById(presetId) {
  const preset = PRESETS[state.mode]?.find((p) => p.id === presetId)
    || PRESETS.japan.find((p) => p.id === presetId)
    || PRESETS.world.find((p) => p.id === presetId);
  if (preset) onPresetSelect(preset);
}

function syncProgressOnLoad() {
  ensureJourneyRecorded();

  if (state.goalShown && state.route) {
    showGoalModal({ restore: true });
    return;
  }

  if (!state.route) return;
  checkCheckpoints();
  if (!showingCheckpoint && !checkpointQueue.length && !state.goalShown) {
    checkGoal();
  }
}



function isAppInstalled() {
  return userMsg.isNativeApp?.()
    || window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function initInstallPrompt() {
  const banner = $('#install-banner');
  const btnInstall = $('#btn-install');
  const btnDismiss = $('#install-dismiss');
  const installDesc = $('#install-desc');

  if (!banner || isAppInstalled()) return;

  const isIOS = userMsg.isIosBrowser?.();

  if (isIOS) {
    if (localStorage.getItem(INSTALL_DISMISS_KEY)) return;
    const installTitle = $('#install-title');
    if (installTitle) installTitle.textContent = 'ホーム画面に追加';
    installDesc.textContent = '約30秒・App Store不要';
    if (btnInstall) {
      btnInstall.hidden = false;
      btnInstall.textContent = '手順';
      btnInstall.addEventListener('click', () => {
        location.href = IOS_INSTALL_PAGE_URL || '/install-ios.html';
      });
    }
    banner.removeAttribute('hidden');
    document.body.classList.add('has-install-banner');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (localStorage.getItem(INSTALL_DISMISS_KEY)) return;
    banner.removeAttribute('hidden');
    document.body.classList.add('has-install-banner');
  });

  btnInstall?.addEventListener('click', async () => {
    if (userMsg.isIosBrowser?.()) return;
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    banner.setAttribute('hidden', '');
    document.body.classList.remove('has-install-banner');
  });

  btnDismiss?.addEventListener('click', () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, '1');
    banner.setAttribute('hidden', '');
    document.body.classList.remove('has-install-banner');
  });

  window.addEventListener('appinstalled', () => {
    banner.setAttribute('hidden', '');
    document.body.classList.remove('has-install-banner');
    deferredInstallPrompt = null;
  });
}



async function restorePedometer() {
  const isAndroidNative = pedometer.isAndroidNativeApp?.();
  const wasTracking = isPedometerAutoTrack(state) || state.pedometer?.enabled;
  const userDisabled = pedometer.isPedometerUserDisabled?.();

  const isAndroidWeb = userMsg.isAndroidBrowser?.() && !userMsg.isNativeApp();
  let shouldAutoStart = wasTracking;
  if (!shouldAutoStart && !userDisabled && (isAndroidNative || userMsg.isIosNative())) {
    shouldAutoStart = true;
  }
  if (!shouldAutoStart && !userDisabled && isAndroidWeb && pedometer.isGoogleFitConnected?.()) {
    shouldAutoStart = true;
  }

  if (!shouldAutoStart) return;

  if (wasTracking && state.route && getPedometerDeviceBaseline(state) > 0) {
    restorePedometerSessionBaseline();
  } else {
    await alignPedometerBaselineForJourney();
  }

  const result = await pedometer.startAutoDailyTracking(handlePedometerUpdate);

  if (!result.ok) {
    if (wasTracking) {
      state = setPedometerAutoTrack(state, false);
    }
  } else {
    state = setPedometerAutoTrack(state, true);
    await pedometer.catchUpAfterBackground?.(5);
    if (!state.route) {
      await alignPedometerBaselineForJourney();
    }
  }

  updatePedometerUI();
  refreshBackgroundTrackingStatus();
}



async function handlePedometerUpdate({ sessionSteps, flush, at, pendingDay }) {

  const prevDate = state.todayDate;

  state = setPedometerSessionSteps(state, sessionSteps);

  if (flush && flush > 0) {
    state = setPedometerLastNativeTotal(state, sessionSteps);

    if (state.route && !isStepRecordingLocked(state)) {
      state = addStepsAt(state, flush, 'pedometer', at || Date.now());

      if (prevDate !== state.todayDate) {
        pedometer.restoreSession(getPedometerLastNativeTotal(state));
        state = setPedometerSessionSteps(state, pedometer.getSessionSteps());
      }

      if (pendingDay) {
        pedometer.acknowledgePendingDay?.(pendingDay);
      }

      onProgressUpdate();
    } else if (state.route && isStepRecordingLocked(state)) {
      if (pendingDay) {
        pedometer.acknowledgePendingDay?.(pendingDay);
      }
      updatePedometerUI();
    } else {
      await alignPedometerBaselineForJourney();
      updatePedometerUI();
    }

  } else if (!state.route) {
    state = setPedometerSessionSteps(state, getPedometerDeviceBaseline(state));
    updatePedometerUI();
  } else {
    updatePedometerUI();
  }

}



async function onPedometerAppResume() {
  pedometer.drainQueuedSteps(handlePedometerUpdate);
  pedometer.flush();

  const { state: nextState, rolled } = rollTodayIfNeeded(state);
  state = nextState;

  if (pedometer.isEnabled() || pedometer.isAutoTrackEnabled?.()) {
    await pedometer.ensureNativeBackground?.();
    await ensureNativeTrackingIfNeeded();
    await pedometer.resumeAfterBackground?.();
  }

  if (rolled && pedometer.isEnabled()) {
    await pedometer.onDayRolled?.();
    state = setPedometerSessionSteps(state, pedometer.getSessionSteps());
  }

  refreshUI();
  if (state.route) {
    checkCheckpoints();
    if (!showingCheckpoint && !checkpointQueue.length && !state.goalShown) {
      checkGoal();
    }
  }
}



function bindPedometerLifecycle() {
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
      if (pedometer.isEnabled()) {
        pedometer.flush();
        pedometer.ensureNativeBackground?.();
      }
      stopUiLoop();
      return;
    }

    await onPedometerAppResume();
    if (pedometer.isEnabled()) {
      startUiLoop();
    }
  });

  window.addEventListener('pageshow', async (e) => {
    if (e.persisted || document.visibilityState === 'visible') {
      await onPedometerAppResume();
      if (pedometer.isEnabled()) startUiLoop();
    }
  });

  window.addEventListener('focus', async () => {
    if (document.visibilityState === 'visible') {
      await onPedometerAppResume();
    }
  });

  if (window.Capacitor?.Plugins?.App?.addListener) {
    window.Capacitor.Plugins.App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        await onPedometerAppResume();
        if (pedometer.isEnabled()) startUiLoop();
      } else if (pedometer.isEnabled()) {
        pedometer.flush();
        pedometer.ensureNativeBackground?.();
        stopUiLoop();
      }
    }).catch(() => {});
  }

  if (pedometer.isEnabled()) startUiLoop();
}

let uiRafId = null;

function startUiLoop() {
  stopUiLoop();
  function tick() {
    if (document.hidden) {
      uiRafId = null;
      return;
    }
    if (pedometer.isEnabled()) {
      updatePedometerUI();
    }
    uiRafId = requestAnimationFrame(tick);
  }
  uiRafId = requestAnimationFrame(tick);
}

function stopUiLoop() {
  if (uiRafId) {
    cancelAnimationFrame(uiRafId);
    uiRafId = null;
  }
}



// ===== Navigation =====

function onTabViewChanged(name) {
  // 花火・紙吹雪は「旅の途中」だけ
  setCelebrateViewActive(name === 'dashboard');

  if (name === 'collection') {
    ensureJourneyRecorded();
    renderCollection();
  }

  if (name === 'setup') {
    ensureSetupPickerMap();
  }

  if (name === 'dashboard') {
    updateMap();
    requestAnimationFrame(() => invalidateMapSize());
    const cleared = Boolean(state.route && (state.goalShown || isJourneyComplete(state)));
    if (cleared) {
      try { startClearAmbience(); } catch { /* ignore */ }
    } else {
      try { stopClearAmbienceIfActive(); } catch { /* ignore */ }
    }
  }
}

function bindNavigation() {
  window.__senriOnTab = onTabViewChanged;
}

function switchView(name) {
  if (!name) return;

  if (typeof window.__senriApplyTabView === 'function') {
    window.__senriApplyTabView(name);
    return;
  }

  onTabViewChanged(name);
}

function getActiveViewName() {
  const active = document.querySelector('.nav-tab.active');
  return active?.dataset.view || 'dashboard';
}



// ===== Pedometer =====

function bindPedometer() {

  $('#btn-pedometer-toggle').addEventListener('click', togglePedometer);

  $('#btn-pedometer-permissions')?.addEventListener('click', async () => {
    const prepared = await pedometer.prepareBackgroundTracking?.();
    if (!prepared?.ok) {
      alert(userMsg.permissionDeniedMessage());
      await refreshBackgroundTrackingStatus();
      updatePedometerUI();
      return;
    }
    if (!pedometer.isEnabled()) {
      const start = await startPedometerForUser();
      if (!start.ok) alert(userMsg.permissionDeniedMessage());
    }
    await refreshBackgroundTrackingStatus();
    updatePedometerUI();
  });

  $('#btn-battery-opt')?.addEventListener('click', async () => {
    await pedometer.requestBatteryOptimizationExemption?.();
    await refreshBackgroundTrackingStatus();
  });

  $('#btn-google-fit-connect')?.addEventListener('click', async () => {
    if (!pedometer.isGoogleFitConfigured?.()) {
      alert(userMsg.googleFitFailMessage());
      return;
    }
    try {
      await pedometer.connectGoogleFit();
      updatePedometerUI();
      alert(userMsg.googleFitSuccessMessage());
    } catch {
      alert(userMsg.googleFitFailMessage());
    }
  });

  $('#btn-sync-external').addEventListener('click', () => {
    if (isStepRecordingLocked(state)) {
      alert('ゴール達成済みのため、歩数は取り込めません。新しい旅を始めてください。');
      return;
    }

    const input = $('#external-pedometer-input');

    const value = Number(input.value);

    if (!value || value <= 0) {

      alert('万歩計の表示歩数を入力してください。');

      return;

    }

    const baseline = state.pedometer?.externalBaseline || 0;

    const delta = pedometer.syncExternalReading(value, baseline);

    if (delta > 0) {

      state = setExternalPedometerBaseline(state, value);

      state = addSteps(state, delta, 'pedometer');

      state = setPedometerSessionSteps(state, pedometer.getSessionSteps());

      input.value = '';

      onProgressUpdate();

      alert(`${formatSteps(delta)}歩を取り込みました！`);

    } else {

      state = setExternalPedometerBaseline(state, value);

      alert('新しい歩数はありませんでした。基準値を更新しました。');

    }

  });

}



function restorePedometerSessionBaseline() {
  pedometer.restoreSession(getPedometerLastNativeTotal(state));
}

async function togglePedometer() {
  if (isStepRecordingLocked(state)) {
    alert('ゴール達成済みのため、計測は停止中です。新しい旅を始めてください。');
    return;
  }

  const willEnable = !pedometer.isEnabled();



  if (willEnable) {
    // 停止→再開で端末の本日歩数全体が旅に加算されないよう、先に基準合わせする
    if (state.route) {
      const deviceToday = await pedometer.syncBaselineToDevice();
      if (getPedometerDeviceBaseline(state) === 0) {
        state = setPedometerDeviceBaseline(state, deviceToday);
      }
      state = setPedometerLastNativeTotal(state, deviceToday);
      state = setPedometerSessionSteps(state, deviceToday);
    } else {
      restorePedometerSessionBaseline();
    }

    const result = await pedometer.startAutoDailyTracking(handlePedometerUpdate);

    if (!result.ok) {

      alert(userMsg.permissionDeniedMessage());

      updatePedometerUI();

      return;

    }

    state = setPedometerAutoTrack(state, true);

  } else {

    await pedometer.stopAutoDailyTracking();

    state = setPedometerAutoTrack(state, false);
    state = setPedometerLastNativeTotal(state, pedometer.getSessionSteps());

  }



  updatePedometerUI();
  refreshBackgroundTrackingStatus();
}

async function refreshBackgroundTrackingStatus() {
  const permBanner = $('#pedometer-permission-banner');
  const permText = $('#pedometer-permission-text');
  const bgNote = $('#pedometer-bg-note');
  const batteryBtn = $('#btn-battery-opt');

  if (!userMsg.isAndroidNative()) {
    permBanner?.setAttribute('hidden', '');
    bgNote?.setAttribute('hidden', '');
    batteryBtn?.setAttribute('hidden', '');
    return;
  }

  const perms = await pedometer.checkNativePermissions?.();
  const needsPermission = perms?.activityRecognition !== 'granted'
    || perms?.notifications !== 'granted';

  if (needsPermission && !pedometer.isEnabled()) {
    if (permText) permText.textContent = userMsg.permissionNeededMessage();
    permBanner?.removeAttribute('hidden');
  } else {
    permBanner?.setAttribute('hidden', '');
  }

  if (pedometer.isEnabled() && pedometer.isNativePedometerActive?.()) {
    bgNote?.setAttribute('hidden', '');
    const batteryOpt = await pedometer.isBatteryOptimizationEnabled?.();
    if (batteryBtn) {
      if (batteryOpt) {
        batteryBtn.removeAttribute('hidden');
      } else {
        batteryBtn.setAttribute('hidden', '');
      }
    }
  } else {
    bgNote?.setAttribute('hidden', '');
    batteryBtn?.setAttribute('hidden', '');
  }
}



function updatePedometerUI() {

  const status = $('#pedometer-status');

  const btn = $('#btn-pedometer-toggle');

  const supported = pedometer.isSupported();

  const enabled = pedometer.isEnabled();

  const perm = pedometer.getPermission();



  status.className = 'pedometer-status';

  if (!supported) {

    status.textContent = '非対応';

    btn.disabled = true;

    btn.textContent = '非対応の端末です';

  } else if (enabled) {

    const motionAge = pedometer.getLastMotionAge();
    const fitActive = pedometer.isGoogleFitPedometerActive?.();
    const nativeActive = pedometer.isNativePedometerActive?.();
    const modeLabel = pedometer.getPedometerModeLabel?.() || '';

    if (fitActive || nativeActive) {
      status.textContent = userMsg.measuringStatusLabel({
        fitActive,
        nativeActive,
        installKind: userMsg.getInstallKind(),
      });
    } else if (motionAge != null && motionAge > 8000) {
      status.textContent = '準備中';
    } else if (pedometer.isGoogleFitConfigured?.() && !pedometer.isGoogleFitConnected?.()) {
      status.textContent = '記録中';
    } else if (pedometer.isMobilePedometerDevice?.()) {
      status.textContent = '記録中（アプリ表示中）';
    } else {
      status.textContent = '記録中';
    }

    status.title = modeLabel;

    status.classList.add('active');

    btn.textContent = '計測を停止';

    btn.disabled = false;

  } else if (perm === 'denied') {

    status.textContent = '許可が必要';

    status.classList.add('denied');

    btn.textContent = '計測を開始';

    btn.disabled = false;

  } else {

    status.textContent = '停止中';

    btn.textContent = '計測を開始';

    btn.disabled = false;

  }



  $('#pedometer-today').textContent = formatSteps(state.route ? (state.pedometerTodaySteps || 0) : 0);
  $('#pedometer-session').textContent = formatSteps(getDisplayedDeviceStepsToday());

  const fitBtn = $('#btn-google-fit-connect');
  if (fitBtn) {
    const showFit = pedometer.isGoogleFitConfigured?.()
      && !pedometer.isGoogleFitConnected?.()
      && !pedometer.isNativeAppShell?.()
      && pedometer.isAndroidDevice?.();
    fitBtn.hidden = !showFit;
    if (!fitBtn.hidden) fitBtn.textContent = userMsg.googleFitConnectLabel();
  }

  updatePedometerHintText();
  updateInstallModeWarning();
}



// ===== Dashboard =====

function bindDashboard() {

  $('#btn-add-steps').addEventListener('click', () => {
    if (isStepRecordingLocked(state)) {
      alert('ゴール達成済みのため、歩数は追加できません。新しい旅を始めてください。');
      return;
    }

    const input = $('#steps-input');
    const steps = Math.floor(Number(String(input.value).replace(/[^\d.-]/g, '')) || 0);

    if (steps <= 0) {
      alert('1以上の歩数を入力してください。');
      return;
    }

    const beforeToday = state.todaySteps || 0;
    const beforeTotal = state.totalSteps || 0;
    const room = remainingStepsToGoal(state);
    state = addSteps(state, steps, 'manual');
    const added = Math.max(0, (state.totalSteps || 0) - beforeTotal);

    if (added <= 0) {
      if (room <= 0) {
        alert('ゴール達成済みのため、歩数は追加できません。');
      } else {
        alert('歩数を追加できませんでした。もう一度お試しください。');
      }
      onProgressUpdate();
      return;
    }

    input.value = '';
    onProgressUpdate();

    // 本日の歩数が画面上でも増えたことを明示
    if ((state.todaySteps || 0) <= beforeToday) {
      // 表示更新漏れ対策
      $('#today-steps').textContent = formatSteps(state.todaySteps);
    }
  });



  $('#steps-input').addEventListener('keydown', (e) => {

    if (e.key === 'Enter') $('#btn-add-steps').click();

  });



  $('#btn-reset-today').addEventListener('click', async () => {
    if (isStepRecordingLocked(state)) {
      alert('ゴール達成済みのため、歩数は変更できません。新しい旅を始めてください。');
      return;
    }

    if (confirm('本日の歩数をリセットしますか？（累計からも差し引かれます）')) {

      state = resetTodaySteps(state);

      if (pedometer.isEnabled?.()) {
        const deviceToday = await pedometer.syncBaselineToDevice();
        state = setPedometerDeviceBaseline(state, deviceToday);
        state = setPedometerLastNativeTotal(state, deviceToday);
        state = setPedometerSessionSteps(state, deviceToday);
      } else {
        pedometer.restoreSession(0);
        state = setPedometerDeviceBaseline(state, 0);
        state = setPedometerLastNativeTotal(state, 0);
      }

      refreshUI();

    }

  });



  $('#btn-share').addEventListener('click', shareProgress);

}



function onProgressUpdate() {
  checkCheckpoints();
  if (!showingCheckpoint && !checkpointQueue.length) {
    checkGoal();
  }
  refreshUI();
}



function checkCheckpoints() {

  if (!state.route) return;



  const traveledKm = stepsToKm(state.totalSteps, state.strideCm);

  const reached = getReachedCheckpoints(

    state.route.checkpoints,

    traveledKm,

    state.passedCheckpointIds

  );



  for (const cp of reached) {
    state = markCheckpointPassed(state, cp.id);
    const isGoalPoint = cp.id === 'end-final' || cp.name === state.route.endName;
    if (cp.distanceKm > 0 && !isGoalPoint) {
      checkpointQueue.push(enrichCheckpoint(cp, cp.cityKey || cp.spotId));
    }
  }
  showNextCheckpoint();
}

function bindCheckpointModal() {
  $('#checkpoint-close').addEventListener('click', closeCheckpointModal);
  $('#checkpoint-ok').addEventListener('click', closeCheckpointModal);
  $('#checkpoint-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'checkpoint-overlay') closeCheckpointModal();
  });
}

function showNextCheckpoint() {
  if (showingCheckpoint || !checkpointQueue.length) return;
  showingCheckpoint = true;
  showCheckpointModal(checkpointQueue.shift());
}

function showCheckpointModal(cp) {
  const overlay = $('#checkpoint-overlay');
  const data = enrichCheckpoint(cp, cp.spotId || cp.cityKey);

  applySpotImage($('#checkpoint-spot-img'), data.spotId, data.name, data.spotImage);
  if (!isCatalogSpot(data.spotId, data.name)) {
    loadRemoteSpotImage($('#checkpoint-spot-img'), data, data.name, cp.lat, cp.lng);
  }
  $('#checkpoint-spot-img').alt = data.spotLabel || data.name;
  $('#checkpoint-spot-label').textContent = data.spotLabel || data.name;
  $('#checkpoint-arrival').textContent = '📍 チェックポイント到達';
  $('#checkpoint-title').textContent = `${data.name}を通過しました！`;
  $('#checkpoint-desc').textContent = data.description || '';
  setImageWithFallback($('#checkpoint-specialty-img'), data.specialtyImage, DEFAULT_FOOD);
  $('#checkpoint-specialty-img').alt = data.specialtyName;
  $('#checkpoint-specialty-name').textContent = data.specialtyName;

  showOverlay(overlay);
  celebrateCheckpoint();
  clearTimeout(checkpointTimeout);
  checkpointTimeout = setTimeout(closeCheckpointModal, 8000);
}

function closeCheckpointModal() {
  hideOverlay($('#checkpoint-overlay'));
  clearTimeout(checkpointTimeout);
  showingCheckpoint = false;
  if (checkpointQueue.length) {
    showNextCheckpoint();
  } else {
    checkGoal();
  }
}



function buildJourneyCompletionEntry() {
  const route = state.route;
  if (!route || !isJourneyComplete(state)) return null;

  const dest = getDestinationLandmark(route);
  const spotId = route.endSpotId || dest?.spotId;
  const locked = applySpotImage(document.createElement('img'), spotId, route.endName, route.endSpotImage || route.image);
  const spotLabel = locked?.spotLabel || dest?.spotLabel || route.endName;
  const spotImage = resolveSpotImageUrl(spotId, route.endName, route.endSpotImage || route.image);

  return {
    routeId: route.id,
    label: route.label,
    startName: route.startName,
    endName: route.endName,
    endSpotId: route.endSpotId || null,
    spotLabel,
    image: spotImage,
    totalSteps: state.totalSteps,
    totalKm: route.totalKm,
    startedAt: state.journeyStartedAt || null,
    achievedAt: new Date().toISOString()
  };
}

function ensureJourneyRecorded() {
  const entry = buildJourneyCompletionEntry();
  if (!entry || hasCollectionEntry(state, entry)) return false;
  state = recordJourneyCompletion(state, entry);
  return true;
}

function checkGoal() {
  if (!state.route) return;

  ensureJourneyRecorded();
  if (state.goalShown) return;

  if (isJourneyComplete(state)) {
    showGoalModal();
  }
}

async function stopPedometerForGoal() {
  if (!pedometer.isEnabled()) return;
  await pedometer.stopAutoDailyTracking();
  state = setPedometerAutoTrack(state, false);
  pedometer.restoreSession(0);
}

function showGoalModal({ restore = false } = {}) {
  const route = state.route;
  if (!route) return;

  const modal = $('#goal-modal');
  const dest = getDestinationLandmark(route);
  const spotId = route.endSpotId || dest?.spotId;
  const locked = applySpotImage(
    $('#goal-image'),
    spotId,
    route.endName,
    route.endSpotImage || route.image
  );
  const spotLabel = locked?.spotLabel || dest?.spotLabel || route.endName;
  const spotImage = resolveSpotImageUrl(spotId, route.endName, route.endSpotImage || route.image);

  if (!isCatalogSpot(spotId, route.endName)) {
    const endWp = route.waypoints?.[route.waypoints.length - 1];
    loadRemoteSpotImage($('#goal-image'), dest, route.endName, endWp?.lat, endWp?.lng);
  }
  $('#goal-image').alt = spotLabel;
  $('#goal-spot-label').textContent = spotLabel;
  $('#goal-arrival').textContent = '📍 名所到着';
  $('#goal-title').textContent = `🎉 ${route.endName}に到着！`;
  $('#goal-desc').textContent = dest?.description || `${spotLabel}を目の前に、旅のゴールです！`;
  $('#goal-message').textContent = `${route.startName}から${route.endName}まで、見事ゴールしました！`;
  setImageWithFallback($('#goal-specialty-img'), dest?.specialtyImage, DEFAULT_FOOD);
  $('#goal-specialty-img').alt = dest?.specialtyName || '';
  $('#goal-specialty-name').textContent = dest?.specialtyName || `${route.endName}の名物`;
  $('#goal-stats').textContent =
    `総歩数: ${formatSteps(state.totalSteps)}歩 ／ 距離: ${formatKm(route.totalKm)}`;

  ensureJourneyRecorded();
  const savedEntry = state.collection.find(
    (c) => c.routeId === route.id && c.totalSteps === state.totalSteps
  );
  const achievedAt = savedEntry?.achievedAt || new Date().toISOString();

  goalShareSnapshot = {
    label: route.label,
    totalSteps: state.totalSteps,
    totalKm: route.totalKm,
    journeyStartedAt: state.journeyStartedAt,
    achievedAt,
    pedometerTodaySteps: state.pedometerTodaySteps
  };

  state = markGoalShown(state);
  // 演出は「旅の途中」のみなので、先にそのタブへ
  switchView('dashboard');
  setCelebrateViewActive(true);
  showOverlay(modal);
  enterClearedCelebration({ restore });
}

function enterClearedCelebration(_opts = {}) {
  applyStepLockUI(true);
  showClearBanner(true);

  // 演出を最優先（async の歩数停止より先・例外でも止めない）
  try { startClearAmbience(); } catch { /* ignore */ }
  try { celebrateGoal(); } catch { /* ignore */ }

  window.setTimeout(() => {
    try { startClearAmbience(); } catch { /* ignore */ }
    try { celebrateGoal(); } catch { /* ignore */ }
  }, 300);

  window.setTimeout(() => {
    try { startClearAmbience(); } catch { /* ignore */ }
  }, 1200);

  stopPedometerForGoal().catch(() => {});
}

function showClearBanner(show) {
  const banner = $('#clear-banner');
  if (!banner) return;
  if (show && state.route) {
    const sub = $('#clear-banner-sub');
    if (sub) sub.textContent = state.route.endName + ' に到着！';
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
}

function applyStepLockUI(locked) {
  // 入力欄は disabled にしない（タップ無反応に見えるため）。
  // 追加ボタン等だけ止め、タップ時はハンドラ側で案内する。
  const hardDisable = [
    '#btn-reset-today',
    '#btn-sync-external',
    '#btn-pedometer-toggle'
  ];
  for (const sel of hardDisable) {
    const el = $(sel);
    if (!el) continue;
    el.disabled = Boolean(locked);
  }
  const addBtn = $('#btn-add-steps');
  if (addBtn) {
    addBtn.disabled = Boolean(locked);
    addBtn.textContent = locked ? '達成済み' : '追加';
  }
  const stepsInput = $('#steps-input');
  if (stepsInput) {
    stepsInput.readOnly = Boolean(locked);
    stepsInput.placeholder = locked ? 'ゴール達成済み' : '歩数を入力';
  }
  const externalInput = $('#external-pedometer-input');
  if (externalInput) externalInput.readOnly = Boolean(locked);

  const section = document.querySelector('.steps-input-section');
  if (section) section.classList.toggle('steps-locked', Boolean(locked));
  const pedometerSection = document.querySelector('.pedometer-section');
  if (pedometerSection) pedometerSection.classList.toggle('steps-locked', Boolean(locked));
  const lockNote = $('#clear-steps-lock-note');
  if (lockNote) lockNote.hidden = !locked;
}



function fireConfetti() {
  celebrateGoal();
}



// ===== Setup =====

function bindSetup() {

  bindLocationField('start', '#custom-start', '#start-suggestions', '#start-selected', '#btn-start-gps');

  bindLocationField('end', '#custom-end', '#end-suggestions', '#end-selected', '#btn-end-gps');

  bindMapPicker();



  $('#stride-input').addEventListener('change', (e) => {

    state = setStride(state, e.target.value);

    refreshUI();

  });



  document.addEventListener('click', (e) => {

    if (!e.target.closest('.location-field')) {

      hideAllSuggestions();

    }

  });

}



function bindMapPicker() {
  const pickStartBtn = $('#btn-pick-start');
  const pickEndBtn = $('#btn-pick-end');
  if (!pickStartBtn || !pickEndBtn) return;

  pickStartBtn.addEventListener('click', () => toggleMapPickTarget('start'));
  pickEndBtn.addEventListener('click', () => toggleMapPickTarget('end'));

  setPickerClickHandler(async ({ target, lat, lng }) => {
    await applyMapPickedPlace(target, lat, lng);
  });
}



function ensureSetupPickerMap() {
  initPickerMap('setup-map');
  setPickerModeView(state.mode);
  setPickerMarkers(selectedPlaces.start, selectedPlaces.end);
  requestAnimationFrame(() => {
    invalidatePickerMapSize();
    setTimeout(() => invalidatePickerMapSize(), 120);
  });
}



function toggleMapPickTarget(target) {
  ensureSetupPickerMap();
  const next = getPickerActiveTarget() === target ? null : target;
  setPickerActiveTarget(next);
  updateMapPickUi(next);
}



function clearMapPickSelectionUi() {
  setPickerActiveTarget(null);
  updateMapPickUi(null);
}



function updateMapPickUi(activeTarget) {
  const pickStartBtn = $('#btn-pick-start');
  const pickEndBtn = $('#btn-pick-end');
  const status = $('#map-pick-status');

  pickStartBtn?.classList.toggle('is-active', activeTarget === 'start');
  pickEndBtn?.classList.toggle('is-active', activeTarget === 'end');

  if (!status) return;
  if (activeTarget === 'start') {
    status.textContent = '地図をタップして起点を選んでください';
  } else if (activeTarget === 'end') {
    status.textContent = '地図をタップして目的地を選んでください';
  } else {
    status.textContent = '';
  }
}



async function applyMapPickedPlace(target, lat, lng) {
  const status = $('#map-pick-status');
  const pickStartBtn = $('#btn-pick-start');
  const pickEndBtn = $('#btn-pick-end');
  const busyBtn = target === 'start' ? pickStartBtn : pickEndBtn;

  if (busyBtn) busyBtn.disabled = true;
  if (status) status.textContent = '地点名を取得しています…';

  try {
    let place = await reverseGeocode(lat, lng);
    if (!place) {
      place = {
        id: `map-${lat.toFixed(5)}-${lng.toFixed(5)}`,
        name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        displayName: `地図で選択（${lat.toFixed(4)}, ${lng.toFixed(4)}）`,
        lat,
        lng,
        isLandmark: false,
        isAddress: false
      };
    } else {
      place = {
        ...place,
        lat,
        lng
      };
    }

    const input = $(target === 'start' ? '#custom-start' : '#custom-end');
    const selectedEl = $(target === 'start' ? '#start-selected' : '#end-selected');
    const list = $(target === 'start' ? '#start-suggestions' : '#end-suggestions');
    selectPlace(target, place, input, selectedEl, list);
    setPickerMarkers(selectedPlaces.start, selectedPlaces.end);
    setPickerActiveTarget(null);
    updateMapPickUi(null);
    if (status) {
      status.textContent = target === 'start'
        ? `起点を設定: ${place.name}`
        : `目的地を設定: ${place.name}`;
    }
  } catch (err) {
    if (status) status.textContent = '';
    alert(err.message || '地図からの地点取得に失敗しました。');
  } finally {
    if (busyBtn) busyBtn.disabled = false;
  }
}



function bindSaveSlots() {
  const container = $('#save-slots');
  if (!container) return;

  container.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-save-action]');
    if (!button) return;

    const index = Number(button.dataset.slot);
    const action = button.dataset.saveAction;
    if (!Number.isInteger(index) || index < 0 || index >= MAX_SAVE_SLOTS) return;

    if (action === 'save') {
      await saveCurrentToSlot(index);
    } else if (action === 'load') {
      await loadFromSaveSlot(index);
    } else if (action === 'delete') {
      deleteFromSaveSlot(index);
    }
  });

  renderSaveSlots();
}



function renderSaveSlots() {
  const container = $('#save-slots');
  if (!container) return;

  const slots = listSaveSlots();
  container.innerHTML = '';

  slots.forEach((slot, index) => {
    const card = document.createElement('article');
    card.className = `save-slot${slot ? '' : ' save-slot-empty'}`;

    const title = slot?.summary?.title || '空きスロット';
    const detail = slot
      ? `${slot.summary.detail} · ${formatSavedAt(slot.savedAt)}`
      : 'セーブすると、いまの旅の進捗をここに保存できます';

    card.innerHTML =
      `<div class="save-slot-head">` +
      `<span class="save-slot-title">スロット ${index + 1}</span>` +
      `<span class="save-slot-badge">${slot ? '保存済み' : '空き'}</span>` +
      `</div>` +
      `<p class="save-slot-meta"><strong>${escapeHtml(title)}</strong><br>${escapeHtml(detail)}</p>` +
      `<div class="save-slot-actions">` +
      `<button type="button" class="btn btn-primary" data-save-action="save" data-slot="${index}">セーブ</button>` +
      `<button type="button" class="btn btn-secondary" data-save-action="load" data-slot="${index}"${slot ? '' : ' disabled'}>ロード</button>` +
      `<button type="button" class="btn btn-danger" data-save-action="delete" data-slot="${index}"${slot ? '' : ' disabled'}>削除</button>` +
      `</div>`;

    container.appendChild(card);
  });
}



async function saveCurrentToSlot(index) {
  const existing = getSaveSlot(index);
  if (existing) {
    const ok = window.confirm(`スロット ${index + 1} のデータを上書きします。\nよろしいですか？`);
    if (!ok) return;
  }

  saveToSlot(index, state);
  renderSaveSlots();
  alert(`スロット ${index + 1} にセーブしました。`);
}



async function loadFromSaveSlot(index) {
  const slot = getSaveSlot(index);
  if (!slot?.state) return;

  const ok = window.confirm(
    `スロット ${index + 1} をロードします。\n` +
    'いまの旅の進捗は、このセーブデータに置き換わります。よろしいですか？'
  );
  if (!ok) return;

  if (pedometer.isEnabled?.()) {
    await pedometer.stopAutoDailyTracking();
  }

  state = replaceState(slot.state);
  selectedPlaces.start = null;
  selectedPlaces.end = null;
  destroyMap();
  mapInitialized = false;
  checkpointQueue.length = 0;
  showingCheckpoint = false;
  hideOverlay($('#checkpoint-overlay'));
  hideOverlay($('#goal-modal'));
  syncProgressOnLoad();
  switchView(state.route ? 'dashboard' : 'setup');
  refreshUI();
  await restorePedometer();
  alert(`スロット ${index + 1} をロードしました。`);
}



function deleteFromSaveSlot(index) {
  const slot = getSaveSlot(index);
  if (!slot) return;

  const ok = window.confirm(`スロット ${index + 1} のセーブデータを削除します。\nよろしいですか？`);
  if (!ok) return;

  deleteSaveSlot(index);
  renderSaveSlots();
}



function bindLocationField(key, inputSel, listSel, selectedSel, gpsBtnSel) {

  const input = $(inputSel);

  const list = $(listSel);

  const selectedEl = $(selectedSel);

  const gpsBtn = $(gpsBtnSel);



  input.addEventListener('input', (e) => {
    if (e.isComposing) return;

    selectedPlaces[key] = null;
    selectedEl.hidden = true;
    setPickerMarkers(selectedPlaces.start, selectedPlaces.end);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchAndShow(input.value, list, key), 400);
  });

  input.addEventListener('compositionend', () => {
    selectedPlaces[key] = null;
    selectedEl.hidden = true;
    setPickerMarkers(selectedPlaces.start, selectedPlaces.end);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchAndShow(input.value, list, key), 50);
  });



  input.addEventListener('focus', () => {

    if (input.value.trim().length >= 2) {

      searchAndShow(input.value, list, key);

    }

  });



  gpsBtn.addEventListener('click', async () => {

    gpsBtn.disabled = true;

    gpsBtn.textContent = '…';

    try {

      const pos = await getCurrentPosition();

      const place = await reverseGeocode(pos.lat, pos.lng);

      if (!place) throw new Error('住所の取得に失敗しました。');

      selectPlace(key, place, input, selectedEl, list);

    } catch (err) {

      alert(err.message);

    } finally {

      gpsBtn.disabled = false;

      gpsBtn.textContent = '📍';

    }

  });

}



function renderSuggestionList(results, listEl, key) {
  listEl.innerHTML = '';

  results.forEach((place) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="suggestion-name">${place.name}${place.isArea ? '<span class="spot-tag">地域</span>' : ''}${place.isSpot ? '<span class="spot-tag">名所</span>' : ''}${place.isLandmark ? '<span class="spot-tag">観光</span>' : ''}${place.isAddress ? '<span class="spot-tag">住所</span>' : ''}</span>
      <span class="suggestion-detail">${place.displayName}</span>
    `;

    li.addEventListener('click', () => {
      const input = key === 'start' ? $('#custom-start') : $('#custom-end');
      const selectedEl = key === 'start' ? $('#start-selected') : $('#end-selected');
      selectPlace(key, place, input, selectedEl, listEl);
    });

    listEl.appendChild(li);
  });
}

async function searchAndShow(query, listEl, key) {
  const q = query.trim();

  if (q.length < 2) {
    listEl.hidden = true;
    return;
  }

  const seq = ++searchSeq;
  const localResults = searchLocalPlaces(q, state.mode);

  if (localResults.length) {
    renderSuggestionList(localResults, listEl, key);
    listEl.hidden = false;
  } else {
    listEl.innerHTML = '<li class="loading">検索中…</li>';
    listEl.hidden = false;
  }

  const results = await searchPlaces(q, state.mode);
  if (seq !== searchSeq) return;

  if (!results.length) {
    listEl.innerHTML = '<li class="no-result">候補が見つかりません</li>';
    return;
  }

  renderSuggestionList(results, listEl, key);
}



function selectPlace(key, place, input, selectedEl, listEl) {

  selectedPlaces[key] = {
    ...attachSpotMetadata(place),
    queryText: normalizeJaAddressQuery(input.value.trim()) || input.value.trim() || place.name
  };

  input.value = place.name;

  selectedEl.textContent = `📍 ${place.displayName}`;

  selectedEl.hidden = false;

  listEl.hidden = true;

  setPickerMarkers(selectedPlaces.start, selectedPlaces.end);

}



function hideAllSuggestions() {

  $('#start-suggestions').hidden = true;

  $('#end-suggestions').hidden = true;

}



async function resolvePlace(key, inputValue) {
  const q = inputValue.trim();
  if (!q) return null;

  if (selectedPlaces[key] && isSamePlaceQuery(q, selectedPlaces[key])) {
    return selectedPlaces[key];
  }

  if (!looksLikeAddress(q)) {
    if (state.mode === 'japan') {
      const localArea = resolveJapaneseArea(q, state.mode);
      if (localArea) return localArea;
    }

    const localCity = resolveLocalPlace(q, state.mode);
    if (localCity) return localCity;

    const resolvedSpot = findResolvableSpot(q, state.mode);
    if (resolvedSpot) {
      return attachSpotMetadata(spotToPlace(resolvedSpot));
    }
  }

  const results = await searchPlaces(q, state.mode);
  if (!results.length) return null;

  const norm = normalizeJaAddressQuery(q);
  const exact = results.find((p) =>
    isSamePlaceQuery(q, p) ||
    normalizeJaAddressQuery(p.name) === norm ||
    matchesJapaneseAreaResult(q, p)
  );

  return attachSpotMetadata(exact || results[0]);
}

function renderSpotChips() {
  const container = $('#spot-chips');
  if (!container) return;

  container.innerHTML = '';
  ['nikko-toshogu', 'kinkakuji', 'tokyo-disneyland']
    .map((id) => getSpotById(id))
    .filter(Boolean)
    .forEach((spot) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'spot-chip';
    btn.textContent = spot.name;
    btn.addEventListener('click', () => {
      const place = spotToPlace(spot);
      selectPlace('end', place, $('#custom-end'), $('#end-selected'), $('#end-suggestions'));
    });
    container.appendChild(btn);
  });
}



async function applyCustomRoute() {

  const startInput = $('#custom-start').value;

  const endInput = $('#custom-end').value;



  if (!startInput || !endInput) {

    alert('起点と目的地を入力してください。');

    return;

  }



  const btn = $('#btn-custom-route');

  btn.disabled = true;

  btn.textContent = '検索中…';



  try {

    const start = attachSpotMetadata(await resolvePlace('start', startInput));

    const end = attachSpotMetadata(await resolvePlace('end', endInput));



    if (!start) {

      alert('起点が見つかりません。別の表記で試すか、候補から選んでください。');

      return;

    }

    if (!end) {

      alert('目的地が見つかりません。別の表記で試すか、候補から選んでください。');

      return;

    }



    const route = createRouteFromPlaces(start, end, state.mode);

    if (!confirmNewDestination()) return;

    applyRoute(route);

  } catch (err) {

    console.error(err);

    alert('ルートの設定に失敗しました。もう一度お試しください。');

  } finally {

    btn.disabled = false;

    btn.textContent = 'ルートを設定';

  }

}



function renderPresets() {
  const list = $('#preset-list');
  if (!list) return;



  const presets = getPresetsForMode(state.mode);

  $$('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));



  PRESETS[state.mode].forEach((preset) => {

    const route = presets.find((r) => r.id === preset.id);

    if (!route) return;

    const btn = document.createElement('button');

    btn.type = 'button';

    btn.className = 'preset-item' + (state.route?.presetId === preset.id || state.route?.id === preset.id ? ' selected' : '');

    btn.dataset.presetId = preset.id;

    btn.setAttribute('onclick', "window.__senriTriggerPreset('" + preset.id + "')");

    btn.innerHTML = `

      <div>

        <div class="preset-name">${route.label}</div>

        <div class="preset-distance">${route.startName} → ${route.endName}</div>

      </div>

      <span class="preset-km">${formatKm(route.totalKm)}</span>

    `;

    list.appendChild(btn);

  });

}



async function onPresetSelect(preset) {

  if (!confirmNewDestination()) return;



  try {

    let route;



    if (selectedPlaces.start) {

      route = presetWithCustomStart(preset, selectedPlaces.start);

    } else {

      const startInput = $('#custom-start').value.trim();

      if (startInput) {

        const start = await resolvePlace('start', startInput);

        if (start) {

          route = presetWithCustomStart(preset, start);

        } else {

          alert('起点が見つかりません。候補から選ぶか、表記を変えてください。');

          return;

        }

      } else {

        route = getPresetsForMode(state.mode).find((r) => r.id === preset.id);

      }

    }



    if (!route) {

      alert('ルートの取得に失敗しました。');

      return;

    }



    applyRoute(route);

  } catch (err) {

    console.error(err);

    alert('ルートの設定に失敗しました。もう一度お試しください。');

  }

}



function applyRoute(route) {
  void applyRouteAsync(route);
}

async function applyRouteAsync(route) {
  ensureJourneyRecorded();

  // 前のゴール演出が残らないように必ず止める
  stopClearAmbience();
  showClearBanner(false);
  applyStepLockUI(false);

  // 旧旅の未反映歩数が新旅の累計に乗らないよう、先に加算を止めて破棄
  pedometer.pauseCreditForNewJourney?.();
  // 直前の目的地選択が残ると画像・spotId が食い違う
  selectedPlaces.start = null;
  selectedPlaces.end = null;

  state = setRoute(state, route);

  try {
    if (pedometer.isEnabled?.() || pedometer.isAutoTrackEnabled?.()) {
      const deviceToday = await pedometer.syncBaselineToDevice();
      state = setPedometerDeviceBaseline(state, deviceToday);
      state = setPedometerLastNativeTotal(state, deviceToday);
      state = setPedometerSessionSteps(state, deviceToday);
    } else {
      pedometer.restoreSession(0);
      state = setPedometerDeviceBaseline(state, 0);
      state = setPedometerLastNativeTotal(state, 0);
    }
  } finally {
    pedometer.resumeCreditAfterNewJourney?.();
  }

  // 同期中に漏れ込んだ歩数があればゼロに戻す
  if ((state.totalSteps || 0) > 0 || (state.todaySteps || 0) > 0) {
    state.totalSteps = 0;
    state.todaySteps = 0;
    state.manualTodaySteps = 0;
    state.pedometerTodaySteps = 0;
    saveState(state);
  }

  destroyMap();

  mapInitialized = false;

  switchView('dashboard');

  refreshUI();
}



function confirmNewDestination() {
  if (!state.route) return true;
  return window.confirm(
    '新しい目的地を設定すると、累計・本日の歩数と旅の進捗がすべてリセットされます。\n' +
    '残したい場合は「セーブデータ」に保存してから設定してください。\n\nよろしいですか？'
  );
}



// ===== Goal modal =====

function bindGoalModal() {

  $('#btn-share-goal').addEventListener('click', () => shareGoalAchievement());

  $('#btn-new-journey').addEventListener('click', async () => {
    hideOverlay($('#goal-modal'));
    goalShareSnapshot = null;
    await finishActiveJourney();
    switchView('setup');
  });

}



async function finishActiveJourney() {
  stopClearAmbience();
  showClearBanner(false);
  applyStepLockUI(false);
  selectedPlaces.start = null;
  selectedPlaces.end = null;
  if (pedometer.isEnabled()) {
    await pedometer.stopAutoDailyTracking();
    state = setPedometerAutoTrack(state, false);
  }
  pedometer.restoreSession(0);
  state = clearJourney(state);
  destroyMap();
  mapInitialized = false;
  refreshUI();
}



// ===== Collection =====

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCollection() {
  const list = $('#collection-list');

  if (!state.collection.length) {
    list.innerHTML = '<p class="empty-state">まだ制覇した目的地はありません</p>';
    return;
  }

  list.innerHTML = '';

  state.collection.forEach((item) => {
    const dest = enrichCheckpoint({ name: item.endName, spotId: item.endSpotId });
    const spotLabel = item.endName || item.spotLabel || dest.spotLabel || '目的地';
    const img = document.createElement('img');
    img.alt = spotLabel;
    img.loading = 'lazy';
    // マスタ画像を優先（保存済みが東京タワー等の誤画像でも上書き）
    applySpotImage(img, item.endSpotId || dest.spotId, item.endName, dest.spotImage || item.image);
    if (!isCatalogSpot(item.endSpotId || dest.spotId, item.endName)) {
      loadRemoteSpotImage(img, dest, item.endName);
    }

    const duration = formatDurationDays(item.startedAt, item.achievedAt);
    const durationPart = duration ? `所要 ${duration} ／ ` : '';

    const article = document.createElement('article');
    article.className = 'collection-item';

    const body = document.createElement('div');
    body.className = 'collection-body';
    body.innerHTML = `
      <div class="collection-route">${escapeHtml(spotLabel)}</div>
      <div class="collection-subroute">${escapeHtml(item.label || `${item.startName || ''} → ${item.endName || ''}`)}</div>
      <div class="collection-meta">
        ${new Date(item.achievedAt).toLocaleDateString('ja-JP')} 達成 ／
        ${durationPart}${formatSteps(item.totalSteps)}歩 ／ ${formatKm(item.totalKm)}
      </div>
    `;

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn btn-outline btn-block collection-share-btn';
    shareBtn.textContent = '達成をシェア';
    shareBtn.addEventListener('click', () => shareCollectionItem(item));

    article.appendChild(img);
    article.appendChild(body);
    body.appendChild(shareBtn);
    list.appendChild(article);
  });
}



// ===== Map =====

function updateMap() {

  const placeholder = $('#map-placeholder');



  if (!state.route) {

    placeholder.hidden = false;

    return;

  }



  placeholder.hidden = false;



  if (!mapInitialized) {

    setTimeout(() => {

      initMap('map');

      mapInitialized = true;

      placeholder.hidden = true;

      drawMap();

    }, 100);

  } else {

    placeholder.hidden = true;

    drawMap();

  }

}



function drawMap() {

  if (!state.route || !mapInitialized) return;



  const traveledKm = stepsToKm(state.totalSteps, state.strideCm);
  const routePath = getRoutePath(state.route);
  const currentPos = positionOnRoute(routePath, traveledKm, state.route.totalKm);

  renderRoute(state.route, currentPos, traveledKm);
  invalidateMapSize();

}



// ===== Share =====

function buildGoalShareText(label, totalSteps, { totalKm, startedAt, achievedAt } = {}, pedoNote = '') {
  const duration = formatDurationDays(startedAt, achievedAt);
  const lines = [`🎉 ${label} をゴール達成！`];
  if (duration) lines.push(`所要: ${duration}`);
  if (totalKm != null) lines.push(`距離: ${formatKm(totalKm)}`);
  lines.push(`総歩数: ${formatSteps(totalSteps)}歩${pedoNote}`);
  lines.push('#千里の道も一歩から');
  return lines.join('\n');
}

async function shareText(text) {
  if (navigator.share) {
    try {
      await navigator.share({ text });
    } catch {
      copyToClipboard(text);
    }
  } else {
    copyToClipboard(text);
  }
}

async function shareGoalAchievement() {
  if (goalShareSnapshot) {
    const snap = goalShareSnapshot;
    const pedoNote = snap.pedometerTodaySteps
      ? `\n万歩計: ${formatSteps(snap.pedometerTodaySteps)}歩`
      : '';
    await shareText(buildGoalShareText(snap.label, snap.totalSteps, {
      totalKm: snap.totalKm,
      startedAt: snap.journeyStartedAt,
      achievedAt: snap.achievedAt
    }, pedoNote));
    return;
  }

  await shareProgress(true);
}

async function shareCollectionItem(item) {
  await shareText(buildGoalShareText(item.label, item.totalSteps, {
    totalKm: item.totalKm,
    startedAt: item.startedAt,
    achievedAt: item.achievedAt
  }));
}

async function shareProgress(isGoal = false) {

  if (!state.route) return;



  const traveledKm = stepsToKm(state.totalSteps, state.strideCm);

  const remaining = Math.max(0, state.route.totalKm - traveledKm);

  const percent = Math.min(100, Math.round((traveledKm / state.route.totalKm) * 100));



  const pedoNote = state.pedometerTodaySteps

    ? `\n万歩計: ${formatSteps(state.pedometerTodaySteps)}歩`

    : '';



  const text = isGoal

    ? buildGoalShareText(state.route.label, state.totalSteps, {
      totalKm: state.route.totalKm,
      startedAt: state.journeyStartedAt,
      achievedAt: new Date().toISOString()
    }, pedoNote)

    : `🥾 ${state.route.label}\n進捗: ${percent}%（${formatKm(traveledKm)} / ${formatKm(state.route.totalKm)}）\n残り ${formatKm(remaining)}${pedoNote}\n#千里の道も一歩から`;



  await shareText(text);

}



function copyToClipboard(text) {

  navigator.clipboard.writeText(text).then(

    () => alert('シェア用テキストをコピーしました！'),

    () => alert(text)

  );

}



// ===== UI Refresh =====

function refreshUI() {

  const modeBadge = $('#mode-badge');

  modeBadge.textContent = state.mode === 'japan' ? '🇯🇵 日本版' : '🌍 世界版';



  const routeLabel = $('#route-label');

  const routeDistance = $('#route-distance');

  const progressSection = $('#progress-section');

  const shareSection = $('#share-section');



  if (state.route) {

    routeLabel.textContent = state.route.label;

    routeDistance.textContent = `総距離 ${formatKm(state.route.totalKm)} ／ 1歩=${state.strideCm}cm`;

    progressSection.hidden = false;

    shareSection.hidden = false;

  } else {

    routeLabel.textContent = '目的地を設定してください';

    routeDistance.textContent = '「目的地設定」タブから旅を始めましょう';

    progressSection.hidden = true;

    shareSection.hidden = true;

  }



  $('#today-steps').textContent = formatSteps(state.todaySteps);

  $('#total-steps').textContent = formatSteps(state.totalSteps);



  if (state.route) {

    const traveledKm = stepsToKm(state.totalSteps, state.strideCm);

    const remaining = Math.max(0, state.route.totalKm - traveledKm);

    const percent = Math.min(100, (traveledKm / state.route.totalKm) * 100);



    $('#remaining-km').textContent = formatKm(remaining);

    $('#walked-km').textContent = formatKm(traveledKm);

    $('#progress-percent').textContent = `${Math.round(percent)}%`;

    $('#progress-fill').style.width = `${percent}%`;

  }



  $('#stride-input').value = state.strideCm;

  const cleared = Boolean(state.route && (state.goalShown || isJourneyComplete(state)));
  applyStepLockUI(cleared);
  showClearBanner(cleared);
  // クリア中かつ「旅の途中」タブのときだけ演出。未クリアならループを止める
  setCelebrateViewActive(getActiveViewName() === 'dashboard');
  if (cleared && getActiveViewName() === 'dashboard') {
    startClearAmbience();
  } else {
    stopClearAmbienceIfActive();
  }

  updatePedometerUI();

  updateMap();

  renderSaveSlots();

}



function bootstrap() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

exposeApi();

if (typeof window.__senriMarkLoaded === 'function') {
  window.__senriMarkLoaded();
}

bootstrap();


