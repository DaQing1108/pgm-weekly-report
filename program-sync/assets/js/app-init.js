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
import { initApi, listWeeks, getWeekState, saveWeekState } from './api.js';

/**
 * 所有編輯頁面共用初始化：
 *   actions.html / milestones.html / input.html
 *
 * @returns {Promise<string|null>} 最新週次標籤（如 'W13'），後端不可用時為 null
 */
export async function appInit() {
  // 1. 偵測後端
  await initApi();

  // 2. 取最新週次 JSON（git 持久，跨部署存活）
  const weeks = await listWeeks();
  let latestWeekLabel = null;
  let loadedFromServer = false;

  if (weeks.length > 0) {
    latestWeekLabel = weeks[0].weekLabel;
    const data = await getWeekState(latestWeekLabel);
    if (data) {
      store.importAll(JSON.stringify(data)); // 觸發 store:updated → 各頁 renderAll
      loadedFromServer = true;
    }
  }

  // 3. 後端無資料才用種子（guard 在 seedData 內部：有 projects 就跳過）
  if (!loadedFromServer) {
    seedData();
  }

  // 4. 任何編輯 → 2s debounce → 寫回週次 JSON
  //    注意：startBackendSync 傳入的參數已是 parsed object，不可再 JSON.parse
  store.startBackendSync(stateObj => {
    if (!latestWeekLabel) return Promise.resolve();
    return saveWeekState(latestWeekLabel, stateObj);
  });

  // 5. 更新 navbar 週次徽章
  _syncWeekBadge(latestWeekLabel);

  return latestWeekLabel;
}

function _syncWeekBadge(overrideLabel) {
  const el = document.getElementById('weekBadge');
  if (!el) return;
  const label = overrideLabel || store.currentWeekLabel();
  if (label) el.textContent = label;
}
