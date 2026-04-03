/* ============================================================
   app-init.js — 統一初始化模組（P1 跨瀏覽器一致性修正）

   解決的問題：
     1. 各頁面各自實作 init 邏輯，不一致
     2. startBackendSync callback 誤用 JSON.parse(已是 object) → saveWeekState 從未被呼叫
     3. input.html 使用 ephemeral /api/state，部署後資料消失

   資料優先順序（唯一來源）：
     /api/weeks/:latestLabel（git 持久）→ 所有裝置看到一致資料
     若後端無資料 → seedData() fallback
   ============================================================ */

import { store }    from './store.js';
import { seedData } from '../data/seed.js';
import { initApi, listWeeks, getWeekState, saveWeekState, isBackendAvailable } from './api.js';

/**
 * 所有編輯頁面共用初始化：
 *   actions.html / milestones.html / input.html
 *
 * @returns {Promise<string|null>} 最新週次標籤（如 'W13'），後端不可用時為 null
 */
const SESSION_WEEK_KEY = 'pgm_viewWeek';

// ── Loading overlay ──────────────────────────────────────────────
function _showLoader() {
  if (document.getElementById('_appLoader')) return;
  const el = document.createElement('div');
  el.id = '_appLoader';
  el.innerHTML = `<div style="
    position:fixed;inset:0;z-index:9999;
    background:var(--color-bg-primary,#fff);
    display:flex;align-items:center;justify-content:center;
    flex-direction:column;gap:12px;
    transition:opacity .25s;
  ">
    <div style="width:32px;height:32px;border:3px solid var(--color-border-default,#ddd);
      border-top-color:var(--color-info,#378add);border-radius:50%;
      animation:_spin .7s linear infinite;"></div>
    <span style="font-size:13px;color:var(--color-text-secondary,#888);">載入資料中…</span>
  </div>
  <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>`;
  document.body.appendChild(el);
}

function _hideLoader() {
  const el = document.getElementById('_appLoader');
  if (!el) return;
  el.firstElementChild.style.opacity = '0';
  setTimeout(() => el.remove(), 260);
}

export async function appInit() {
  _showLoader();
  // 1. 偵測後端
  await initApi();

  // 2. 取所有週次清單
  const weeks = await listWeeks();
  let latestWeekLabel = weeks.length > 0 ? weeks[0].weekLabel : null;
  let loadedFromServer = false;

  // 3. 跨頁 context：Dashboard 切到歷史週次時，其他頁面同步顯示該週
  //    若 sessionStorage 存的週次等於最新週（表示未曾主動切換歷史），自動清除
  const sessionWeek = sessionStorage.getItem(SESSION_WEEK_KEY);
  if (sessionWeek && sessionWeek === latestWeekLabel) {
    sessionStorage.removeItem(SESSION_WEEK_KEY);
  }
  const effectiveSession = sessionStorage.getItem(SESSION_WEEK_KEY);
  const targetLabel = (effectiveSession && weeks.find(w => w.weekLabel === effectiveSession))
    ? effectiveSession
    : latestWeekLabel;

  if (targetLabel) {
    const data = await getWeekState(targetLabel);
    if (data) {
      // Q-3 修正：直接傳 object，importAll 內部判斷型別，省去冗餘 JSON.stringify
      store.importAll(data);
      loadedFromServer = true;
    }
  }

  // 4. 後端無資料才用種子
  if (!loadedFromServer) seedData();

  // 5. 歷史唯讀模式判斷（Q-4：步驟編號整理）
  const isHistoryMode = !!(targetLabel && latestWeekLabel && targetLabel !== latestWeekLabel);
  window._appInitIsHistoryMode = isHistoryMode;

  // 6. 非歷史模式才啟動後端 sync（歷史模式不同步，防 store:updated 誤寫歷史 JSON）
  if (!isHistoryMode) {
    store.startBackendSync(stateObj => {
      if (!targetLabel) return Promise.resolve();
      return saveWeekState(targetLabel, stateObj);
    });
    // N-3：後端 401 時顯示可見警告 banner，讓使用者知道同步未成功
    window.addEventListener('store:syncUnauthorized', _showAuthBanner);
  }

  // 7. navbar 徽章顯示當前瀏覽週次
  _syncWeekBadge(targetLabel);

  // 8. 後端離線提示
  if (!isBackendAvailable()) _showOfflineBanner();

  // 9. 歷史瀏覽 banner
  if (isHistoryMode) _showHistoryBanner(targetLabel, latestWeekLabel);

  // 10. 移除 loading overlay
  _hideLoader();

  return targetLabel;
}

/** Dashboard 切週時呼叫，讓其他頁面跟著切 */
export function setSessionWeek(weekLabel) {
  if (weekLabel) sessionStorage.setItem(SESSION_WEEK_KEY, weekLabel);
  else           sessionStorage.removeItem(SESSION_WEEK_KEY);
}

function _showOfflineBanner() {
  if (document.getElementById('appInitOfflineBanner')) return;
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const bar = document.createElement('div');
  bar.id = 'appInitOfflineBanner';
  bar.style.cssText = 'background:var(--color-danger-bg,#fdecea);border-bottom:1px solid var(--color-danger,#d94f4f);padding:4px 24px;font-size:12px;display:flex;align-items:center;gap:8px;color:var(--color-danger,#d94f4f);';
  bar.innerHTML = `<span>⚠ 後端離線</span><span style="color:var(--color-text-secondary,#888);font-size:11px;">— 資料僅存於本機 localStorage，切換頁面後不保留</span>`;
  nav.insertAdjacentElement('afterend', bar);
}

function _showHistoryBanner(viewing, latest) {
  // 避免重複插入
  if (document.getElementById('appInitHistoryBanner')) return;
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const bar = document.createElement('div');
  bar.id = 'appInitHistoryBanner';
  bar.style.cssText = 'background:var(--color-warning-bg,#fff8e1);border-bottom:1px solid var(--color-warning,#e4a23c);padding:6px 24px;font-size:12px;display:flex;align-items:center;gap:12px;';
  window._appInitReturnLatest = () => { sessionStorage.removeItem(SESSION_WEEK_KEY); location.reload(); };
  bar.innerHTML = `<span>📅 歷史瀏覽模式：${viewing}</span>
    <button onclick="window._appInitReturnLatest()"
      style="background:none;border:1px solid currentColor;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">
      ↩ 回到 ${latest}
    </button>`;
  nav.insertAdjacentElement('afterend', bar);
}

// N-3：後端回 401（ADMIN_TOKEN 已設定但前端未帶 token）時顯示警告
function _showAuthBanner() {
  if (document.getElementById('appInitAuthBanner')) return;
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const bar = document.createElement('div');
  bar.id = 'appInitAuthBanner';
  bar.style.cssText = [
    'background:var(--color-danger-bg,#fdecea)',
    'border-bottom:1px solid var(--color-danger,#d94f4f)',
    'padding:6px 24px',
    'font-size:12px',
    'display:flex',
    'align-items:center',
    'gap:12px',
    'flex-wrap:wrap',
  ].join(';');
  bar.innerHTML = `
    <span style="color:var(--color-danger,#d94f4f);font-weight:600;">🔒 後端同步失敗</span>
    <span style="color:var(--color-text-secondary,#555);">ADMIN_TOKEN 已設定，請在 Console 執行：</span>
    <code style="background:rgba(0,0,0,.07);padding:2px 8px;border-radius:4px;font-size:11px;user-select:all;">
      import('/assets/js/api.js').then(m=&gt;m.setAdminToken('your-token'))
    </code>
    <button onclick="document.getElementById('appInitAuthBanner').remove()"
      style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;line-height:1;color:var(--color-danger,#d94f4f);">✕</button>`;
  nav.insertAdjacentElement('afterend', bar);
}

function _syncWeekBadge(overrideLabel) {
  const el = document.getElementById('weekBadge');
  if (!el) return;
  const label = overrideLabel || store.currentWeekLabel();
  if (label) el.textContent = label;
}
