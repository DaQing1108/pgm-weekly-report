/* ============================================================
   app-init.js — 統一初始化模組（P1 跨瀏覽器一致性修正）

   解決的問題：
     1. 各頁面各自實作 init 邏輯，不一致
     2. input.html 使用 ephemeral /api/state，部署後資料消失
     3. 歷史唯讀模式仍啟動 startBackendSync，可能誤寫歷史 JSON（v3.5 修正）
     4. resources 跨季資料混入週次 JSON sync（v3.9 修正：改用 _exportWeekObj）
     5. 本機較新但 actions/risks/milestones 為空時不從後端補入，導致頁面空白（P3 修正）

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

// ── 防止深淺色閃爍，立刻套用 theme ───────────────────────────
(function() {
  const saved = localStorage.getItem('pgm_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

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
      // P2 修正：比較本機最新 _updatedAt vs 後端 _savedAt
      //   若本機較新（例如 Railway 重新部署後 git 舊版本把 _savedAt 清空），
      //   保留本機資料並立即 push 到後端，避免新增資料消失。
      const serverTs = data._savedAt || '';
      // P4 修正：優先以 _dataVersion 整數比較，避免時鐘漂移或 git 修正被忽略的問題。
      //   _dataVersion 由工具在 git patch 時遞增（表示「後端刻意更新」），
      //   若 serverVersion > localVersion → 後端勝，接受最新修正。
      const serverVer = (typeof data._dataVersion === 'number') ? data._dataVersion : 0;
      const localVerStr = localStorage.getItem(`pgm_dataVersion_${targetLabel}`);
      const localVer = localVerStr ? parseInt(localVerStr, 10) : 0;
      const _serverVersionWins = serverVer > 0 && serverVer > localVer;

      // P2-2 修正：跨所有實體取最新 _updatedAt，作為 version 相等時的 fallback
      const localTs  = (() => {
        try {
          const KEYS = ['projects','actions','risks','milestones','snapshots','drafts','members'];
          const times = [];
          KEYS.forEach(k => {
            const raw = localStorage.getItem(`pgm_sync_${k}`);
            if (!raw) return;
            const arr = JSON.parse(raw);
            if (!Array.isArray(arr)) return;
            arr.forEach(item => { if (item._updatedAt) times.push(item._updatedAt); });
          });
          times.sort();
          return times.length ? times[times.length - 1] : '';
        } catch { return ''; }
      })();

      // 本機較新條件：版本號未落後後端，且時間戳也較新（或後端無時間戳）
      const _localIsNewer = !_serverVersionWins &&
        !!(localTs && (!serverTs || localTs > serverTs));

      if (_serverVersionWins) {
        // 後端版本較高（git 修正），直接接受後端資料
        console.info(`[appInit] 後端版本(v${serverVer}) > 本機(v${localVer})，接受後端修正`);
        store.importAll(data);
        localStorage.setItem(`pgm_dataVersion_${targetLabel}`, String(serverVer));
      } else if (_localIsNewer) {
        console.info(`[appInit] 本機資料(${localTs}) 比後端(${serverTs || 'none'})新，保留本機，稍後推送`);
        // P3 修正：本機較新時保留用戶的 projects 編輯，
        //   但 actions / risks / milestones / snapshots 若本機為空，則從後端補入。
        const SUPPLEMENTABLE = ['actions', 'risks', 'milestones', 'snapshots'];
        SUPPLEMENTABLE.forEach(key => {
          try {
            const localRaw = localStorage.getItem(`pgm_sync_${key}`);
            const localArr = localRaw ? JSON.parse(localRaw) : [];
            if ((!Array.isArray(localArr) || localArr.length === 0) &&
                Array.isArray(data[key]) && data[key].length > 0) {
              store.save(key, data[key]);
              console.info(`[appInit] 本機 ${key} 為空，從後端補入 ${data[key].length} 筆`);
            }
          } catch { /* silent */ }
        });
        window._appInitLocalNewer = true;
      } else {
        store.importAll(data);
        if (serverVer > 0) localStorage.setItem(`pgm_dataVersion_${targetLabel}`, String(serverVer));
      }
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
    // P2 修正：本機比後端新 → 立即觸發一次同步，把本機資料推送至後端
    if (window._appInitLocalNewer) {
      delete window._appInitLocalNewer;
      window.dispatchEvent(new CustomEvent('store:updated', { detail: { key: '_initSync' } }));
    }
    // N-3：後端 401 時顯示可見警告 banner，讓使用者知道同步未成功
    window.addEventListener('store:syncUnauthorized', _showAuthBanner);
    // P0-3：非 401 的一般同步失敗（網路中斷、5xx）也顯示 banner
    window.addEventListener('store:syncFailed', e => _showSyncFailedBanner(e.detail?.message));
  }

  // P0-1：localStorage 資料損壞時顯示警告 banner
  window.addEventListener('store:corrupt', e => _showCorruptBanner(e.detail?.key));

  // P0-4：監聽表單 dirty 狀態，離頁前警告
  _initDirtyTracking();

  // P0-3：全域連線狀態綠點初始化
  if (!isHistoryMode) {
    _initSyncStatusIndicator();
  }

  // 7. navbar 徽章顯示當前瀏覽週次
  _syncWeekBadge(targetLabel);

  // 8. 後端離線提示
  if (!isBackendAvailable()) _showOfflineBanner();

  // 9. 歷史瀏覽 banner
  if (isHistoryMode) _showHistoryBanner(targetLabel, latestWeekLabel);

  // 10. 移除 loading overlay
  _hideLoader();

  // 11. 插入 Dark mode 狀態切換按鈕
  _initThemeToggle();

  return targetLabel;
}

function _initThemeToggle() {
  // 從 localStorage 恢復深色模式
  const saved = localStorage.getItem('pgm_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  
  const actionsContainer = document.querySelector('.navbar__actions');
  if (!actionsContainer || document.getElementById('btnThemeToggle')) return;

  const btn = document.createElement('button');
  btn.id = 'btnThemeToggle';
  btn.className = 'btn btn-ghost btn-sm';
  btn.style.cssText = 'font-size:16px;padding:4px 8px;margin-right:8px;line-height:1;margin-left:4px;';
  btn.title = '切換深/淺色模式';
  btn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';

  btn.onclick = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('pgm_theme', newTheme);
    btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  };

  // 插入在 hamburger menu 或生成按鈕之前
  actionsContainer.insertBefore(btn, actionsContainer.firstElementChild);
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
  // U-21 修正：加「重試連線」按鈕，讓使用者可重新整理連線狀態
  window._appInitRetry = async () => {
    const { initApi, isBackendAvailable } = await import('./api.js');
    await initApi(true);
    if (isBackendAvailable()) {
      document.getElementById('appInitOfflineBanner')?.remove();
      location.reload();
    } else {
      bar.querySelector('#retryMsg').textContent = '連線失敗，請確認後端服務';
    }
  };
  bar.innerHTML = `
    <span>⚠ 後端離線</span>
    <span style="color:var(--color-text-secondary,#888);font-size:11px;">— 資料僅存於本機 localStorage，切換頁面後不保留</span>
    <button onclick="window._appInitRetry()"
      style="margin-left:8px;background:none;border:1px solid currentColor;border-radius:4px;padding:1px 8px;cursor:pointer;font-size:11px;color:var(--color-danger,#d94f4f);">
      🔄 重試連線
    </button>
    <span id="retryMsg" style="font-size:11px;color:var(--color-text-tertiary,#aaa);"></span>`;
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
  // U-48 修正：加「🔒 唯讀」標示，讓用戶明確知道無法編輯
  bar.innerHTML = `
    <span>📅 歷史瀏覽模式：${viewing}</span>
    <span style="background:var(--color-warning,#e4a23c);color:#fff;border-radius:4px;padding:1px 7px;font-size:11px;font-weight:600;">🔒 唯讀</span>
    <button onclick="window._appInitReturnLatest()"
      style="background:none;border:1px solid currentColor;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:11px;">
      ↩ 回到最新 ${latest}
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

// P0-3：一般同步失敗 banner（非 401，例如網路中斷或後端 5xx）
function _showSyncFailedBanner(message) {
  if (document.getElementById('appInitSyncFailedBanner')) return;
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const bar = document.createElement('div');
  bar.id = 'appInitSyncFailedBanner';
  bar.style.cssText = 'background:var(--color-warning-bg,#fff8e1);border-bottom:1px solid var(--color-warning,#e4a23c);padding:6px 24px;font-size:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
  const msg = message ? `（${message}）` : '';
  bar.innerHTML = `
    <span style="font-weight:600;color:var(--color-warning,#e4a23c);">⚠ 後端同步失敗${msg}</span>
    <span style="color:var(--color-text-secondary,#555);">本機資料已保存，但尚未同步至後端。</span>
    <button onclick="document.getElementById('appInitSyncFailedBanner').remove()"
      style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;line-height:1;color:var(--color-warning,#e4a23c);">✕</button>`;
  nav.insertAdjacentElement('afterend', bar);
  // 30 秒後自動消失（非致命警告）
  setTimeout(() => document.getElementById('appInitSyncFailedBanner')?.remove(), 30_000);
}

// P0-1：localStorage 資料損壞 banner（JSON parse 失敗時觸發）
function _showCorruptBanner(key) {
  const bannerId = 'appInitCorruptBanner';
  // 同一 key 損壞只顯示一次
  if (document.getElementById(bannerId)) return;
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const bar = document.createElement('div');
  bar.id = bannerId;
  bar.style.cssText = 'background:var(--color-danger-bg,#fdecea);border-bottom:2px solid var(--color-danger,#d94f4f);padding:8px 24px;font-size:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;';
  const keyLabel = key ? `「${key}」` : '';
  bar.innerHTML = `
    <span style="font-weight:700;color:var(--color-danger,#d94f4f);">🚨 資料損壞警告</span>
    <span style="color:var(--color-text-secondary,#555);">localStorage 中的 ${keyLabel} 資料無法讀取，已重置為空。</span>
    <button onclick="localStorage.removeItem('${key}'); location.reload();"
      style="margin-left:12px;background:var(--color-danger,#d94f4f);color:#fff;border:none;border-radius:4px;padding:2px 8px;font-size:11px;cursor:pointer;">
      🔄 一鍵重置該變數
    </button>
    <button onclick="document.getElementById('${bannerId}').remove()"
      style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;line-height:1;color:var(--color-danger,#d94f4f);">✕</button>`;
  nav.insertAdjacentElement('afterend', bar);
}

// P0-4：表單 dirty 追蹤 — 使用者輸入後若未儲存直接離頁則顯示確認
function _initDirtyTracking() {
  let _dirty = false;

  // 任何 input/textarea/select 有變動就標為 dirty（排除 modal 與查詢過濾器）
  function checkDirty(e) {
    const el = e.target;
    const tag = el.tagName.toLowerCase();
    if (!['input', 'textarea', 'select'].includes(tag)) return;
    if (el.closest('.modal__overlay')) return; // modal 內屬即時或獨立存檔操作

    // 排除搜尋框、下拉排序、過濾器
    const isSearchOrFilter = el.type === 'search' || 
                             (el.id && el.id.toLowerCase().includes('search')) || 
                             (el.id && el.id.toLowerCase().includes('filter')) ||
                             (el.id && el.id.toLowerCase().includes('sort')) ||
                             el.classList.contains('no-dirty');
                             
    if (!isSearchOrFilter) {
      _dirty = true;
    }
  }

  document.addEventListener('input', checkDirty);
  document.addEventListener('change', checkDirty);

  // store:updated 表示資料已成功寫入 localStorage，清除 dirty flag
  window.addEventListener('store:updated', () => { _dirty = false; });

  // 瀏覽器原生離頁（重新整理、關分頁、輸入新網址）
  window.addEventListener('beforeunload', e => {
    if (_dirty) {
      e.preventDefault();
      // 現代瀏覽器忽略自訂訊息，但需要設定 returnValue 才會顯示對話框
      e.returnValue = '您有尚未儲存的變更，確定要離開？';
    }
  });

  // SPA 內部導航（點擊 Navbar / 麵包屑連結）— capture phase 攔截
  document.addEventListener('click', e => {
    if (!_dirty) return;
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    // 排除錨點、javascript:void、外部連結（這些不需要 dirty 警告）
    if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
    if (!window.confirm('您有尚未儲存的變更，確定要離開此頁？')) {
      e.preventDefault();
    }
  }, true /* capture */);
}

function _syncWeekBadge(overrideLabel) {
  const el = document.getElementById('weekBadge');
  if (!el) return;
  const label = overrideLabel || store.currentWeekLabel();
  if (label) el.textContent = label;
}

// P0-3：全局連線狀態小綠點 (Sync Status Indicator)
function _initSyncStatusIndicator() {
  const actionsContainer = document.querySelector('.navbar__actions');
  if (!actionsContainer) return;
  
  const indicator = document.createElement('span');
  indicator.id = 'syncStatusDot';
  indicator.style.cssText = 'font-size:12px;display:flex;align-items:center;gap:4px;margin-right:12px;color:var(--color-text-secondary);';
  indicator.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-text-tertiary);"></span> Offline`;
  actionsContainer.insertBefore(indicator, actionsContainer.firstChild);

  // 注入 pulse animation keyframes
  if (!document.getElementById('syncPulseStyle')) {
    const style = document.createElement('style');
    style.id = 'syncPulseStyle';
    style.textContent = '@keyframes syncPulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }';
    document.head.appendChild(style);
  }

  window.addEventListener('store:syncing', () => {
    indicator.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-primary,#378add);animation:syncPulse 1s infinite;"></span> Syncing...`;
    document.getElementById('appInitSyncFailedBanner')?.remove();
  });
  window.addEventListener('store:syncSuccess', () => {
    indicator.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-success,#4caf6e);"></span> Saved`;
  });
  window.addEventListener('store:syncFailed', () => {
    indicator.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-danger,#d94f4f);"></span> Failed`;
  });
  window.addEventListener('store:syncUnauthorized', () => {
    indicator.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--color-warning,#e4a23c);"></span> Auth Error`;
  });
}
