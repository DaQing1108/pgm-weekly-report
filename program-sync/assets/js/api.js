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

// ── 偵測後端是否可用 ──────────────────────────────────────────
export async function checkBackend() {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    _backendAvailable = data.status === 'ok';
  } catch {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

export function isBackendAvailable() {
  return _backendAvailable === true;
}

// ── 取得所有週報清單 ──────────────────────────────────────────
export async function fetchReports() {
  const res = await fetch(`${API_BASE}/reports`);
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

// ── 初始化：頁面載入時自動偵測後端 ────────────────────────────
export async function initApi() {
  const available = await checkBackend();
  document.documentElement.dataset.backend = available ? 'true' : 'false';
  return available;
}
