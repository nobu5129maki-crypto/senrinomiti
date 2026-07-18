/**
 * Google Fit 連携 — 端末がバックグラウンドで記録した歩数を Web アプリが取得
 * ユーザーは APK 不要。Google アカウントで一度連携するだけ。
 */

import { APP_CONFIG } from './app-config.js';
import { todayStartMs } from './date-utils.js';

const SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read';
const TOKEN_KEY = 'senri-google-fit-token';
const TOKEN_EXP_KEY = 'senri-google-fit-token-exp';
const SESSION_START_KEY = 'senri-google-fit-session-start';
const DAILY_SYNC_DATE_KEY = 'senri-daily-fit-date';
const DAILY_SYNC_TOTAL_KEY = 'senri-daily-fit-total';

const FIT_AGGREGATE_URL = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
const ESTIMATED_STEPS =
  'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps';
const CLIENT_ID_PATTERN = /^[\w-]+\.apps\.googleusercontent\.com$/;

let gisLoaded = false;
let tokenClient = null;
let lastOAuthError = '';

function getClientId() {
  return String(APP_CONFIG.GOOGLE_FIT_CLIENT_ID || '').trim();
}

export function isConfigured() {
  return CLIENT_ID_PATTERN.test(getClientId());
}

export function getSetupMessage() {
  if (!getClientId()) {
    return [
      'Google Fit 連携は未設定です。',
      '開発者が js/app-config.js に OAuth クライアント ID を設定する必要があります。',
      'Android アプリ版は「自動計測を開始」で端末センサーをご利用ください。'
    ].join('\n');
  }
  if (!isConfigured()) {
    return [
      'OAuth クライアント ID の形式が正しくありません。',
      'Google Cloud Console の Web アプリ用 ID（*.apps.googleusercontent.com）を js/app-config.js に設定してください。'
    ].join('\n');
  }
  return '';
}

export function getLastOAuthError() {
  return lastOAuthError;
}

function mapOAuthError(error) {
  switch (error) {
    case 'invalid_client':
    case 'unauthorized_client':
      return 'OAuth クライアント ID が無効です。Google Cloud Console の設定と app-config.js を確認してください。';
    case 'access_denied':
      return 'Google アカウントへのアクセスが拒否されました。';
    case 'popup_closed_by_user':
      return '連携画面が閉じられました。もう一度お試しください。';
    default:
      return error
        ? `Google 認証エラー: ${error}`
        : 'Google 認証に失敗しました。';
  }
}

function getOAuthOriginHints() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const hints = [
    'Google Cloud Console → OAuth 2.0 クライアント → 承認済み JavaScript 生成元に以下を追加:',
    '- 公開サイトの URL（例: https://example.com）',
    '- ローカル開発: http://localhost:8080',
    '- Android アプリ（Capacitor）: https://localhost'
  ];
  if (origin && origin !== 'null') {
    hints.splice(1, 0, `- 現在の起動元: ${origin}`);
  }
  return hints.join('\n');
}

function getStoredToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const exp = Number(localStorage.getItem(TOKEN_EXP_KEY) || 0);
    if (!token || !exp || Date.now() >= exp - 60000) return null;
    return token;
  } catch {
    return null;
  }
}

function saveToken(accessToken, expiresInSec = 3600) {
  try {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresInSec * 1000));
  } catch {
    /* ignore */
  }
}

export function isConnected() {
  return Boolean(getStoredToken());
}

export function disconnect() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
  } catch {
    /* ignore */
  }
}

export function getSessionStartMs() {
  try {
    const v = localStorage.getItem(SESSION_START_KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

export function setSessionStartMs(ms = Date.now()) {
  try {
    localStorage.setItem(SESSION_START_KEY, String(ms));
  } catch {
    /* ignore */
  }
}

export function clearSessionStartMs() {
  try {
    localStorage.removeItem(SESSION_START_KEY);
  } catch {
    /* ignore */
  }
}

async function loadGisScript() {
  if (gisLoaded || window.google?.accounts?.oauth2) {
    gisLoaded = true;
    return;
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('gis-load-failed'));
    document.head.appendChild(script);
  });
}

function createTokenClient(interactive = false) {
  const clientId = getClientId();
  if (!isConfigured()) {
    throw new Error('not-configured');
  }
  return window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: (response) => {
      if (tokenClient?._pending) {
        const { resolve, reject } = tokenClient._pending;
        tokenClient._pending = null;
        if (response.error) {
          lastOAuthError = mapOAuthError(response.error);
          reject(new Error(response.error));
          return;
        }
        lastOAuthError = '';
        saveToken(response.access_token, Number(response.expires_in) || 3600);
        resolve(true);
      }
    }
  });
}

async function requestOAuthToken(interactive = false) {
  if (!isConfigured()) {
    const setup = getSetupMessage();
    lastOAuthError = setup || 'not-configured';
    throw new Error('not-configured');
  }
  await loadGisScript();
  if (!window.google?.accounts?.oauth2) {
    lastOAuthError = 'Google 認証スクリプトを読み込めませんでした。';
    throw new Error('gis-unavailable');
  }
  return new Promise((resolve, reject) => {
    tokenClient = createTokenClient(interactive);
    tokenClient._pending = { resolve, reject };
    try {
      tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
    } catch (err) {
      tokenClient._pending = null;
      lastOAuthError = mapOAuthError(err?.message || 'request-failed');
      reject(err);
    }
  });
}

async function ensureToken() {
  const existing = getStoredToken();
  if (existing) return existing;
  throw new Error('not-connected');
}

function sumStepPoints(payload) {
  let total = 0;
  for (const bucket of payload?.bucket || []) {
    for (const dataset of bucket.dataset || []) {
      for (const point of dataset.point || []) {
        for (const value of point.value || []) {
          total += Math.max(0, Number(value.intVal) || 0);
        }
      }
    }
  }
  return total;
}

export async function getStepsBetween(startMs, endMs) {
  const token = await ensureToken();
  const res = await fetch(FIT_AGGREGATE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      aggregateBy: [{
        dataTypeName: 'com.google.step_count.delta',
        dataSourceId: ESTIMATED_STEPS
      }],
      startTimeMillis: Math.floor(startMs),
      endTimeMillis: Math.floor(endMs)
    })
  });

  if (res.status === 401) {
    disconnect();
    throw new Error('token-expired');
  }
  if (!res.ok) throw new Error('fit-api-error');
  return sumStepPoints(await res.json());
}

export async function connect() {
  return requestOAuthToken(false);
}

export async function connectInteractive() {
  return requestOAuthToken(true);
}

export function getOAuthSetupHints() {
  return getOAuthOriginHints();
}

export async function getSessionSteps() {
  const start = getSessionStartMs();
  if (!start || !isConnected()) return 0;
  return getStepsBetween(start, Date.now());
}

export async function getTodaySteps() {
  if (!isConnected()) return 0;
  return getStepsBetween(todayStartMs(), Date.now());
}

export function getDailySyncMarker() {
  try {
    return {
      date: localStorage.getItem(DAILY_SYNC_DATE_KEY) || '',
      total: Number(localStorage.getItem(DAILY_SYNC_TOTAL_KEY) || 0)
    };
  } catch {
    return { date: '', total: 0 };
  }
}

export function setDailySyncMarker(dateKey, total) {
  try {
    localStorage.setItem(DAILY_SYNC_DATE_KEY, dateKey);
    localStorage.setItem(DAILY_SYNC_TOTAL_KEY, String(Math.max(0, Math.floor(total))));
  } catch {
    /* ignore */
  }
}

export function resetDailySyncMarker(dateKey, total = 0) {
  setDailySyncMarker(dateKey, total);
}

export function canUseBackgroundSync() {
  return isConfigured() && isConnected();
}
