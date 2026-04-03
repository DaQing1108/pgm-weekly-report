/* ============================================================
   api.js — 後端 API 客戶端
   V3：program-sync 與 Express 後端整合
   ============================================================ */

const API_BASE = (() => {
  // 若在 Railway / 同源部署，使用相對路徑
  if (window.location.port === '' || window.location.port === '443' || window.location.port === '80') {
    return '/api';
  }
  // 本地開發：嘗試連到 backend port 3001
  return `${window.location.protocol}//${window.location.hostname}:3001/api`;
})();

let _backendAvailable = null;
let _backendLastChecked = 0;
const _BACKEND_RETRY_MS = 30_000; // 斷線後 30s 自動重試

// ── 偵測後端是否可用 ──────────────────────────────────────────
// #6 修正：_backendAvailable=false 不再永久快取；30s 後自動重試
export async function checkBackend(forceRecheck = false) {
  const now = Date.now();
  const shouldCheck =
    _backendAvailable === null ||
    forceRecheck ||
    (_backendAvailable === false && now - _backendLastChecked > _BACKEND_RETRY_MS);
  if (!shouldCheck) return _backendAvailable;
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    _backendAvailable = data.status === 'ok';
  } catch {
    _backendAvailable = false;
  }
  _backendLastChecked = Date.now();
  return _backendAvailable;
}

export function isBackendAvailable() {
  return _backendAvailable === true;
}

// ── 取得所有週報清單 ──────────────────────────────────────────
// #P1 修正：加 AbortSignal.timeout 防止無限等待
export async function fetchReports() {
  const res = await fetch(`${API_BASE}/reports`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.reports || [];
}

// ── 取得單份週報內容 ──────────────────────────────────────────
export async function fetchReportContent(filename) {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(filename)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.content || '';
}

// ── 儲存週報到後端 ────────────────────────────────────────────
export async function saveReport(filename, content) {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return await res.json();
}

// ── 下載週報 URL ──────────────────────────────────────────────
export function downloadUrl(filename) {
  return `${API_BASE}/reports/${encodeURIComponent(filename)}/download`;
}

// ── 刪除週報 ──────────────────────────────────────────────────
export async function deleteReport(filename) {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(filename)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return await res.json();
}

// ── 跨瀏覽器狀態同步 ──────────────────────────────────────────
export async function getState() {
  try {
    const res = await fetch(`${API_BASE}/state`, { signal: AbortSignal.timeout(5000) });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveState(data) {
  try {
    const res = await fetch(`${API_BASE}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[api] saveState 失敗:', e.message);
  }
}

// ── 週次歸檔（per-week persistent archive）────────────────────

// #4 修正：listWeeks 加 sessionStorage 快取（TTL 60s）
// 避免 9 個頁面各自初始化時打出 9 次並行請求
const _WEEKS_CACHE_KEY = 'pgm_weeksCache';
const _WEEKS_CACHE_TTL = 60_000;

export async function listWeeks() {
  try {
    const cached = sessionStorage.getItem(_WEEKS_CACHE_KEY);
    if (cached) {
      const { ts, data } = JSON.parse(cached);
      if (Date.now() - ts < _WEEKS_CACHE_TTL) return data;
    }
  } catch { /* 快取讀取失敗不阻斷 */ }

  try {
    const res = await fetch(`${API_BASE}/weeks`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    try {
      sessionStorage.setItem(_WEEKS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* sessionStorage 寫入失敗不阻斷 */ }
    return data;
  } catch { return []; }
}

export async function getWeekState(weekLabel) {
  try {
    const res = await fetch(`${API_BASE}/weeks/${encodeURIComponent(weekLabel)}`,
      { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function saveWeekState(weekLabel, data) {
  try {
    // 寫入後立即清除 listWeeks 快取，下次取得最新清單
    sessionStorage.removeItem(_WEEKS_CACHE_KEY);
    const res = await fetch(`${API_BASE}/weeks/${encodeURIComponent(weekLabel)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.warn('[api] saveWeekState 失敗:', e.message);
  }
}

// ── 初始化：頁面載入時自動偵測後端 ────────────────────────────
export async function initApi() {
  const available = await checkBackend();
  document.documentElement.dataset.backend = available ? 'true' : 'false';
  return available;
}
