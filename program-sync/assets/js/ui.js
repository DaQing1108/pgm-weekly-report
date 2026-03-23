/* ============================================================
   ui.js — 通用 UI 工具函式
   Program Sync 週報管理系統
   ============================================================ */

// ── Toast 通知 ────────────────────────────────────────────────

let _toastContainer = null;

function _getToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.createElement('div');
    _toastContainer.className = 'toast-container';
    document.body.appendChild(_toastContainer);
  }
  return _toastContainer;
}

/**
 * 顯示 toast 通知
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} type
 * @param {number} duration ms
 */
export function toast(message, type = 'success', duration = 3000) {
  const container = _getToastContainer();
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  el.innerHTML = `
    <span class="toast__icon">${icons[type] ?? 'ℹ'}</span>
    <span class="toast__msg">${_escHtml(message)}</span>
  `;

  container.appendChild(el);

  const remove = () => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  };

  const timer = setTimeout(remove, duration);
  el.addEventListener('click', () => { clearTimeout(timer); remove(); });

  return { close: remove };
}

// ── Modal ─────────────────────────────────────────────────────

/**
 * 建立並顯示 Modal
 * @param {string} html - Modal 內容 HTML（含 .modal__header, .modal__body 等）
 * @param {object} options
 * @param {string} [options.size] - 'sm' | 'wide'
 * @returns {{ close: Function, el: HTMLElement }}
 */
export function modal(html, options = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const box = document.createElement('div');
  box.className = `modal${options.size ? ` modal--${options.size}` : ''}`;
  box.innerHTML = html;

  overlay.appendChild(box);
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const close = () => {
    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      overlay.remove();
      document.body.style.overflow = '';
    };
    overlay.style.animation = 'overlay-in 0.15s ease reverse';
    overlay.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 200); // fallback: animationend 未觸發時保底移除
  };

  // 點擊背景關閉
  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  // ESC 關閉
  const onKey = e => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); }
  };
  document.addEventListener('keydown', onKey);

  // 綁定 .modal__close 按鈕
  box.querySelector('.modal__close')?.addEventListener('click', close);

  return { close, el: box };
}

// ── Badge HTML ────────────────────────────────────────────────

/**
 * 依狀態渲染 badge HTML
 * @param {string} status - 'on-track'|'at-risk'|'behind'|'done'|'pending'|'in-progress'|'blocked'
 * @returns {string}
 */
export function renderBadge(status) {
  const map = {
    'on-track':    ['badge-success', '🟢 On Track'],
    'at-risk':     ['badge-warning', '🟡 At Risk'],
    'behind':      ['badge-danger',  '🔴 Behind'],
    'paused':      ['badge-neutral', '⏸️ 暫緩'],
    'done':        ['badge-success', '✅ Done'],
    'pending':     ['badge-neutral', '⏳ 待辦'],
    'in-progress': ['badge-info',    '🔄 進行中'],
    'blocked':     ['badge-danger',  '🚫 阻塞'],
    'open':        ['badge-warning', '📌 Open'],
    'closed':      ['badge-neutral', '✅ Closed'],
    'high':        ['badge-danger',  'High'],
    'medium':      ['badge-warning', 'Medium'],
    'low':         ['badge-success', 'Low'],
    'draft':       ['badge-neutral', 'Draft'],
    'in-review':   ['badge-info',    'In Review'],
    'approved':    ['badge-success', 'Approved'],
    'rejected':    ['badge-danger',  'Rejected'],
  };
  const [cls, label] = map[status] || ['badge-neutral', status];
  return `<span class="badge ${cls}">${label}</span>`;
}

/**
 * 渲染 review-badge
 * @param {'draft'|'in-review'|'approved'|'rejected'} status
 * @returns {string}
 */
export function renderReviewBadge(status) {
  const map = {
    draft:       'Draft',
    'in-review': 'In Review',
    approved:    'Approved',
    rejected:    'Rejected',
  };
  return `<span class="review-badge review-badge--${status}">${map[status] || status}</span>`;
}

// ── Date utilities ────────────────────────────────────────────

/**
 * 格式化 ISO 日期字串
 * @param {string} isoStr
 * @returns {string} 'YYYY/MM/DD'
 */
export function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

/**
 * 相對時間（如 "3 天前"）
 * @param {string} isoStr
 * @returns {string}
 */
export function relativeTime(isoStr) {
  if (!isoStr) return '';
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return '剛剛';
  if (mins < 60) return `${mins} 分鐘前`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.round(days / 30);
  return `${months} 個月前`;
}

/**
 * 取得當週 Monday 的日期（ISO 格式）
 * @param {Date} [d]
 * @returns {string}
 */
export function getWeekStart(d = new Date()) {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().split('T')[0];
}

/**
 * 週標籤（W11 格式）
 * @param {string} weekStart ISO
 * @returns {string}
 */
export function weekLabel(weekStart) {
  const d = new Date(weekStart);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `W${String(weekNo).padStart(2, '0')}`;
}

/**
 * 是否逾期
 * @param {string} dueDateStr ISO
 * @returns {boolean}
 */
export function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  return dueDateStr < new Date().toISOString().split('T')[0];
}

// ── Debounce ──────────────────────────────────────────────────

/**
 * @param {Function} fn
 * @param {number} ms
 * @returns {Function}
 */
export function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ── UUID ──────────────────────────────────────────────────────

/**
 * 產生 UUID v4 字串
 * @returns {string}
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ── Confirm dialog ────────────────────────────────────────────

/**
 * 確認 Modal（Promise-based）
 * @param {string} message
 * @param {string} [confirmLabel]
 * @returns {Promise<boolean>}
 */
export function confirm(message, confirmLabel = '確認') {
  return new Promise(resolve => {
    const { close, el } = modal(`
      <div class="modal__header">
        <span class="modal__title">確認操作</span>
        <button class="modal__close" type="button">✕</button>
      </div>
      <div class="modal__body">
        <p style="font-size:var(--font-size-md);line-height:1.6;">${_escHtml(message)}</p>
      </div>
      <div class="modal__footer">
        <button class="btn btn-outline" id="_conf-cancel">取消</button>
        <button class="btn btn-danger" id="_conf-ok">${_escHtml(confirmLabel)}</button>
      </div>
    `);

    el.querySelector('#_conf-cancel').addEventListener('click', e => { e.stopPropagation(); close(); setTimeout(() => resolve(false), 50); });
    el.querySelector('#_conf-ok').addEventListener('click', e => { e.stopPropagation(); close(); setTimeout(() => resolve(true), 50); });
  });
}

// ── Progress bar helper ────────────────────────────────────────

/**
 * 根據進度值取得顏色 class
 * @param {number} pct 0-100
 * @param {string} [statusOverride]
 * @returns {string}
 */
export function progressColor(pct, statusOverride) {
  if (statusOverride === 'behind')  return 'var(--color-danger)';
  if (statusOverride === 'at-risk') return 'var(--color-warning)';
  return 'var(--color-success)';
}

// ── Escape HTML ───────────────────────────────────────────────

function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export { _escHtml as escHtml };

// ── Loading spinner ────────────────────────────────────────────

/**
 * 覆蓋式 Loading overlay
 * @param {HTMLElement} container
 * @param {string} [message]
 * @returns {{ remove: Function }}
 */
export function loadingOverlay(container, message = '載入中...') {
  const el = document.createElement('div');
  el.style.cssText = `
    position:absolute;inset:0;background:rgba(255,255,255,0.75);
    display:flex;align-items:center;justify-content:center;
    border-radius:inherit;z-index:10;gap:8px;font-size:var(--font-size-sm);
    color:var(--color-text-secondary);
  `;
  el.innerHTML = `<span class="ai-status__spinner"></span>${_escHtml(message)}`;
  const pos = getComputedStyle(container).position;
  if (pos === 'static') container.style.position = 'relative';
  container.appendChild(el);
  return { remove: () => el.remove() };
}
