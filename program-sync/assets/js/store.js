/* ============================================================
   store.js — localStorage CRUD + 統計 + v2 快照 / AI Key
   Program Sync 週報管理系統
   ============================================================ */

const PREFIX = 'pgm_sync_';

function _key(name) { return PREFIX + name; }

function _get(name) {
  try {
    const raw = localStorage.getItem(_key(name));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    // P0-1 修正：記錄損壞的 key 並派出 store:corrupt 事件，讓 UI 層顯示警告
    console.error(`[store] localStorage 資料損壞 (key: ${name}):`, e.message);
    window.dispatchEvent(new CustomEvent('store:corrupt', {
      detail: { key: name, error: e.message },
      bubbles: true,
    }));
    return [];
  }
}

function _set(name, data) {
  try {
    localStorage.setItem(_key(name), JSON.stringify(data));
    _dispatch(name);
  } catch (e) {
    console.error('[store] 寫入失敗:', e);
  }
}

function _dispatch(name) {
  const ev = new CustomEvent('store:updated', {
    detail: { key: name },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(ev);
}

// ── 基本 CRUD ──────────────────────────────────────────────────
export const store = {

  /** 取得所有記錄 */
  getAll(key) {
    return _get(key);
  },

  /** 依 id 取得單筆 */
  getById(key, id) {
    return _get(key).find(item => item.id === id) || null;
  },

  /** 新增或更新（以 item.id 判斷） */
  save(key, item) {
    if (!item.id) {
      item.id = _uuid();
    }
    item._updatedAt = new Date().toISOString();
    const list = _get(key);
    const idx = list.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      item._createdAt = item._createdAt || new Date().toISOString();
      list.push(item);
    }
    _set(key, list);
    return item;
  },

  /** 刪除單筆 */
  // Q-1 修正：移除多餘的 _dispatch(key)；_set() 內部已觸發一次
  delete(key, id) {
    const list = _get(key).filter(i => i.id !== id);
    _set(key, list);
  },

  /** 清空整個 key */
  clear(key) {
    _set(key, []);
  },

  // ── 查詢工具 ────────────────────────────────────────────────

  /** 篩選 */
  query(key, filterFn) {
    return _get(key).filter(filterFn);
  },

  /** 排序（dir: 'asc' | 'desc'） */
  sortBy(key, field, dir = 'asc') {
    const list = _get(key);
    return list.sort((a, b) => {
      const av = a[field] ?? '';
      const bv = b[field] ?? '';
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // ── 統計 ────────────────────────────────────────────────────

  /**
   * 計算全域統計
   * @param {string} [refDate] - ISO 日期字串（歷史週傳入快照參考日），預設今天
   * @returns {{ totalProjects, onTrackPct, highRisks, overdueActions, atRiskProjects, behindProjects }}
   */
  stats(refDate) {
    const projects = _get('projects');
    const risks    = _get('risks');
    const actions  = _get('actions');

    const totalProjects   = projects.length;
    const onTrackProjects = projects.filter(p => p.status === 'on-track').length;
    const atRiskProjects  = projects.filter(p => p.status === 'at-risk').length;
    const behindProjects  = projects.filter(p => p.status === 'behind').length;
    const pausedProjects  = projects.filter(p => p.status === 'paused').length;
    const activeProjects  = totalProjects - pausedProjects;
    const onTrackPct      = activeProjects > 0
      ? Math.round((onTrackProjects / activeProjects) * 100)
      : 0;

    const highRisks = risks.filter(r => r.level === 'high' && r.status !== 'closed').length;

    const refDay = (typeof refDate === 'string' && refDate)
      ? refDate
      : new Date().toISOString().split('T')[0];
    const overdueActions = actions.filter(a =>
      a.dueDate && a.dueDate < refDay && a.status !== 'done'
    ).length;

    return {
      totalProjects,
      onTrackPct,
      highRisks,
      overdueActions,
      atRiskProjects,
      behindProjects,
      onTrackProjects,
      pausedProjects,
    };
  },

  // ── 匯入/匯出 ────────────────────────────────────────────────

  /** 匯出所有資料為 JSON 字串 */
  exportAll() {
    // #1 修正：補上 members key（原先遺漏，成員資料從未同步至後端）
    const keys = ['projects', 'risks', 'actions', 'milestones', 'snapshots', 'drafts', 'members'];
    const data = {};
    keys.forEach(k => { data[k] = _get(k); });
    // #3 修正：resources 使用獨立 localStorage key（非 pgm_sync_ 前綴），需特別處理
    try {
      const resRaw    = localStorage.getItem('pgm_resources_entries');
      const chargeRaw = localStorage.getItem('pgm_resources_charges');
      data._resources       = resRaw    ? JSON.parse(resRaw)    : [];
      data._resourceCharges = chargeRaw ? JSON.parse(chargeRaw) : [];
    } catch { /* 忽略解析錯誤 */ }
    data._exportedAt = new Date().toISOString();
    data._version = '2.1';
    return JSON.stringify(data, null, 2);
  },

  /** 從 JSON 字串或已解析物件匯入所有資料（覆蓋） */
  // Q-3 修正：接受 string 或 object，消除呼叫端的冗餘 JSON.stringify/parse
  // A-1 修正：進入前先驗證型別，防止 null/非物件輸入導致 TypeError
  // P0-2 修正：每個 entity 加 schema 驗證，malformed items 被過濾並回報數量
  importAll(jsonOrObj) {
    // P0-2：各 entity 最低必填欄位定義
    const REQUIRED_FIELDS = {
      projects:   ['id', 'name'],
      risks:      ['id', 'description'],
      actions:    ['id', 'task'],
      milestones: ['id', 'name'],
      snapshots:  ['id', 'weekStart'],
      drafts:     ['id', 'weekStart'],
      members:    ['id', 'name'],
    };
    try {
      const data = typeof jsonOrObj === 'string' ? JSON.parse(jsonOrObj) : jsonOrObj;
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { ok: false, message: '無效的資料格式（非物件）' };
      }
      // #1 修正：同步補上 members
      const keys = ['projects', 'risks', 'actions', 'milestones', 'snapshots', 'drafts', 'members'];
      let totalSkipped = 0;
      keys.forEach(k => {
        if (!Array.isArray(data[k])) return;
        const required = REQUIRED_FIELDS[k] || ['id'];
        const valid   = data[k].filter(item =>
          item && typeof item === 'object' && !Array.isArray(item) &&
          required.every(f => f in item && item[f] != null)
        );
        const skipped = data[k].length - valid.length;
        if (skipped > 0) {
          console.warn(`[store] importAll: 略過 ${skipped} 筆無效 ${k} 資料（缺少必填欄位）`);
          totalSkipped += skipped;
        }
        _set(k, valid);
      });
      // #3 修正：還原 resources 到獨立 key
      if (Array.isArray(data._resources)) {
        localStorage.setItem('pgm_resources_entries', JSON.stringify(data._resources));
      }
      if (Array.isArray(data._resourceCharges)) {
        localStorage.setItem('pgm_resources_charges', JSON.stringify(data._resourceCharges));
      }
      return {
        ok: true,
        message: totalSkipped > 0 ? `匯入完成（略過 ${totalSkipped} 筆無效資料）` : '匯入成功',
        skipped: totalSkipped,
      };
    } catch (e) {
      return { ok: false, message: `匯入失敗: ${e.message}` };
    }
  },

  // ── v2：快照與草稿 ───────────────────────────────────────────

  /**
   * 建立或更新週快照
   * @param {string} weekStart - ISO 日期 'YYYY-MM-DD'
   * @param {object} [overrides] - 額外欄位
   */
  createSnapshot(weekStart, overrides = {}) {
    // 使用該週週末（weekStart + 6天）作為逾期判定基準，
    // 確保無論何時建立快照，overdueActions 都反映「該週內」的逾期狀況
    let weekEndDate;
    if (weekStart) {
      const d = new Date(weekStart + 'T12:00:00');
      d.setDate(d.getDate() + 6);
      weekEndDate = d.toISOString().split('T')[0];
    }
    const stats = this.stats(weekEndDate);
    const risks = _get('risks');
    const actions = _get('actions');

    const snap = {
      id: `snap-${weekStart}`,
      weekStart,
      weekLabel: _weekLabel(weekStart),
      onTrackPct: stats.onTrackPct,
      atRiskCount: stats.atRiskProjects,
      behindCount: stats.behindProjects,
      highRisks: risks.filter(r => r.level === 'high' && r.status !== 'closed').length,
      mediumRisks: risks.filter(r => r.level === 'medium' && r.status !== 'closed').length,
      lowRisks: risks.filter(r => r.level === 'low' && r.status !== 'closed').length,
      totalProjects: stats.totalProjects,
      overdueActions: stats.overdueActions,
      completedActions: actions.filter(a => a.status === 'done').length,
      totalActions: actions.length,
      teamHealth: _calcTeamHealth(_get('projects')),
      reviewStatus: 'draft',
      snapshotBy: 'System',
      createdAt: new Date().toISOString(),
      ...overrides,
    };
    return this.save('snapshots', snap);
  },

  /**
   * 取得指定週的最新草稿版本
   * @param {string} weekStart
   * @returns {object|null}
   */
  getLatestDraft(weekStart) {
    const drafts = _get('drafts')
      .filter(d => d.weekStart === weekStart)
      .sort((a, b) => b.version - a.version);
    return drafts[0] || null;
  },

  /**
   * 新建草稿版本
   * @param {string} weekStart
   * @param {string} content - Markdown 內容
   * @param {object} [meta]
   * @returns {object}
   */
  newDraftVersion(weekStart, content, meta = {}) {
    const existing = _get('drafts').filter(d => d.weekStart === weekStart);
    const maxVersion = existing.reduce((max, d) => Math.max(max, d.version || 0), 0);
    const draft = {
      id: `draft-${weekStart}-v${maxVersion + 1}`,
      weekStart,
      version: maxVersion + 1,
      content,
      reviewStatus: 'draft',
      createdAt: new Date().toISOString(),
      ...meta,
    };
    return this.save('drafts', draft);
  },

  /**
   * 取得過去 N 週的快照趨勢資料
   * @param {number} weeks
   * @returns {object[]}
   */
  trendData(weeks = 8) {
    const snaps = this.sortBy('snapshots', 'weekStart', 'asc');
    return snaps.slice(-weeks);
  },

  // 啟動跨瀏覽器後端同步：store:updated 後 2s debounce 推送到後端
  // guard 確保每個頁面只掛一個 listener，避免多次呼叫累積重複寫入
  startBackendSync(saveFn) {
    if (this._syncStarted) return;
    this._syncStarted = true;
    let _timer;
    window.addEventListener('store:updated', () => {
      clearTimeout(_timer);
      _timer = setTimeout(() => {
        // D-1/M-1 修正：改用 _exportWeekObj() 回傳物件
        window.dispatchEvent(new CustomEvent('store:syncing'));
        saveFn(_exportWeekObj())
          .then(() => {
            window.dispatchEvent(new CustomEvent('store:syncSuccess'));
          })
          .catch(e => {
            console.warn('[store] 後端同步失敗:', e.message);
            // N-3：401 時派出自訂事件，讓 UI 層（app-init.js）顯示警告 banner
            if (e?.code === 'UNAUTHORIZED') {
              window.dispatchEvent(new CustomEvent('store:syncUnauthorized'));
            } else {
              // P0-3 修正：非 401 的其他同步失敗（網路中斷、5xx 等）也派出事件通知 UI
              window.dispatchEvent(new CustomEvent('store:syncFailed', {
                detail: { message: e.message },
              }));
            }
          });
      }, 500);   // P2 修正：2000ms → 500ms，縮短資料遺失風險視窗
    });
  },

  // 從 weekStart 字串推算週次標籤（e.g. '2026-03-23' → 'W12'）
  weekLabel(weekStart) { return _weekLabel(weekStart); },

  // 推算目前資料中最新的週次標籤（快照優先，次則 projects.weekStart）
  currentWeekLabel() {
    const snaps = this.trendData(1);
    if (snaps.length > 0) return snaps[0].weekLabel;
    const projects = this.getAll('projects');
    const latest = projects.map(p => p.weekStart).filter(Boolean).sort().slice(-1)[0];
    return latest ? _weekLabel(latest) : null;
  },

  // ── API Key 管理 ─────────────────────────────────────────────
  // S-4 修正：改用 sessionStorage，避免 API Key 持久存於 localStorage 而外洩
  // 代價：每次重開分頁需重新輸入；如需跨 session 保留，可改回 localStorage

  getApiKey() {
    // N-2 遷移：v3.6 改為 sessionStorage，首次呼叫若 sessionStorage 無值但 localStorage
    // 有舊 key，靜默搬移後清除 localStorage，使用者不需重新輸入
    const session = sessionStorage.getItem(PREFIX + 'api_key');
    if (session) return session;
    const legacy = localStorage.getItem(PREFIX + 'api_key');
    if (legacy) {
      sessionStorage.setItem(PREFIX + 'api_key', legacy);
      localStorage.removeItem(PREFIX + 'api_key');
      return legacy;
    }
    return null;
  },

  setApiKey(key) {
    if (key) sessionStorage.setItem(PREFIX + 'api_key', key);
  },

  clearApiKey() {
    sessionStorage.removeItem(PREFIX + 'api_key');
  },

  hasApiKey() {
    return !!this.getApiKey();
  },

};

// ── 工具函式（私有）─────────────────────────────────────────────

/**
 * D-1 修正：只含週次相關資料的 plain object（不含 resources 跨季資料）
 * 供 startBackendSync 推送至 /api/weeks/:weekLabel 使用。
 * exportAll() 保留完整資料（含 resources），用於手動匯出下載。
 */
function _exportWeekObj() {
  const keys = ['projects', 'risks', 'actions', 'milestones', 'snapshots', 'drafts', 'members'];
  const data = {};
  keys.forEach(k => { data[k] = _get(k); });
  data._exportedAt = new Date().toISOString();
  data._version = '2.1';
  return data;
}

// Q-2 修正：優先用 crypto.randomUUID()（Chrome 92+ / Firefox 95+ / Safari 15.4+）
// N-1 修正：加 fallback 給 Safari 14（系統需求含 14+，但 randomUUID 要 15.4+）
function _uuid() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Fallback：RFC 4122 v4，使用 crypto.getRandomValues 保持隨機品質
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function _weekLabel(weekStart) {
  const d = new Date(weekStart);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `W${String(weekNo).padStart(2, '0')}`;
}

function _calcTeamHealth(projects) {
  const teams = ['media-agent', 'learnmode', 'chuangzaoli', 'tv-solution', 'healthcare'];
  const result = {};
  teams.forEach(t => {
    const tp = projects.filter(p => p.team === t);
    if (tp.length === 0) { result[t] = 100; return; }
    const on = tp.filter(p => p.status === 'on-track').length;
    result[t] = Math.round((on / tp.length) * 100);
  });
  return result;
}
