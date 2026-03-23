/* ============================================================
   trends.js — Chart.js 圖表渲染
   Program Sync 週報管理系統 v2
   ============================================================ */

// Chart.js 必須從外部 CDN 載入（由 trends.html 引入）
// 所有函式預設 Chart 物件已存在於 window.Chart

const TEAM_COLORS = {
  'media-agent': '#4caf6e',
  'learnmode':   '#378add',
  'chuangzaoli': '#e4a23c',
  'tv-solution': '#9c6fcc',
  'healthcare':  '#d94f4f',
};

const TEAM_LABELS = {
  'media-agent': 'Media Agent',
  'learnmode':   'LearnMode',
  'chuangzaoli': '創造栗',
  'tv-solution': 'TV Solution',
  'healthcare':  'BU2 Healthcare',
};

// 儲存 Chart 實例，避免重複建立
const _charts = {};

function _destroyChart(id) {
  if (_charts[id]) {
    _charts[id].destroy();
    delete _charts[id];
  }
}

// ── 健康度折線圖 ───────────────────────────────────────────────

/**
 * 渲染整體健康度折線圖（onTrackPct）
 * @param {string} canvasId
 * @param {object[]} snapshots - 週快照陣列
 */
export function renderHealthTrend(canvasId, snapshots) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (!snapshots?.length) {
    _showEmpty(canvas, '尚無歷史快照資料');
    return;
  }

  _destroyChart(canvasId);

  const labels = snapshots.map(s => s.weekLabel || s.weekStart?.slice(5) || '?');
  const data   = snapshots.map(s => s.onTrackPct || 0);

  _charts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'On Track %',
        data,
        borderColor: '#4caf6e',
        backgroundColor: 'rgba(76,175,110,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: data.map(v => v >= 80 ? '#4caf6e' : v >= 60 ? '#e4a23c' : '#d94f4f'),
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `On Track: ${ctx.raw}%`,
          },
        },
      },
      scales: {
        y: {
          min: 0, max: 100,
          ticks: {
            callback: v => `${v}%`,
            font: { size: 11 },
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: {
          ticks: { font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

// ── 風險堆疊長條圖 ────────────────────────────────────────────

/**
 * 渲染風險分佈堆疊長條圖
 * @param {string} canvasId
 * @param {object[]} snapshots
 */
export function renderRiskTrend(canvasId, snapshots) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (!snapshots?.length) {
    _showEmpty(canvas, '尚無歷史快照資料');
    return;
  }

  _destroyChart(canvasId);

  const labels = snapshots.map(s => s.weekLabel || s.weekStart?.slice(5) || '?');

  _charts[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'High',
          data: snapshots.map(s => s.highRisks || 0),
          backgroundColor: 'rgba(217,79,79,0.8)',
          stack: 'risks',
        },
        {
          label: 'Medium',
          data: snapshots.map(s => s.mediumRisks || 0),
          backgroundColor: 'rgba(228,162,60,0.8)',
          stack: 'risks',
        },
        {
          label: 'Low',
          data: snapshots.map(s => s.lowRisks || 0),
          backgroundColor: 'rgba(76,175,110,0.8)',
          stack: 'risks',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, boxWidth: 12 },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          stacked: true,
          ticks: { stepSize: 1, font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: {
          stacked: true,
          ticks: { font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

// ── Action 完成率折線圖 ────────────────────────────────────────

/**
 * 渲染 Action 完成率折線圖
 * @param {string} canvasId
 * @param {object[]} snapshots
 */
export function renderActionTrend(canvasId, snapshots) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (!snapshots?.length) {
    _showEmpty(canvas, '尚無歷史快照資料');
    return;
  }

  _destroyChart(canvasId);

  const labels   = snapshots.map(s => s.weekLabel || s.weekStart?.slice(5) || '?');
  const donePcts = snapshots.map(s => {
    const total = s.totalActions || 0;
    if (total === 0) return 0;
    return Math.round(((s.completedActions || 0) / total) * 100);
  });
  const overdue = snapshots.map(s => s.overdueActions || 0);

  _charts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '完成率 %',
          data: donePcts,
          borderColor: '#378add',
          backgroundColor: 'rgba(55,138,221,0.06)',
          borderWidth: 2,
          pointRadius: 4,
          fill: true,
          tension: 0.3,
          yAxisID: 'y1',
        },
        {
          label: '逾期 Actions',
          data: overdue,
          borderColor: '#d94f4f',
          borderWidth: 2,
          borderDash: [4, 3],
          pointRadius: 4,
          fill: false,
          tension: 0.3,
          yAxisID: 'y2',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, boxWidth: 12 },
        },
      },
      scales: {
        y1: {
          type: 'linear',
          position: 'left',
          min: 0, max: 100,
          ticks: { callback: v => `${v}%`, font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        y2: {
          type: 'linear',
          position: 'right',
          min: 0,
          ticks: { stepSize: 1, font: { size: 11 } },
          grid: { drawOnChartArea: false },
        },
        x: {
          ticks: { font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

// ── 各組健康度折線圖 ──────────────────────────────────────────

/**
 * 渲染各組健康度趨勢折線圖
 * @param {string} canvasId
 * @param {object[]} snapshots
 */
export function renderTeamTrend(canvasId, snapshots) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (!snapshots?.length) {
    _showEmpty(canvas, '尚無歷史快照資料');
    return;
  }

  _destroyChart(canvasId);

  const labels = snapshots.map(s => s.weekLabel || s.weekStart?.slice(5) || '?');
  const teams  = Object.keys(TEAM_COLORS);

  const datasets = teams.map(teamId => ({
    label: TEAM_LABELS[teamId],
    data: snapshots.map(s => s.teamHealth?.[teamId] ?? 0),
    borderColor: TEAM_COLORS[teamId],
    backgroundColor: TEAM_COLORS[teamId] + '15',
    borderWidth: 2,
    pointRadius: 3,
    pointHoverRadius: 5,
    fill: false,
    tension: 0.3,
  }));

  _charts[canvasId] = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, boxWidth: 12 },
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}%`,
          },
        },
      },
      scales: {
        y: {
          min: 0, max: 100,
          ticks: { callback: v => `${v}%`, font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        x: {
          ticks: { font: { size: 11 } },
          grid: { display: false },
        },
      },
    },
  });
}

// ── KPI 週對比 ────────────────────────────────────────────────

/**
 * 渲染本週 vs 上週 KPI 對比卡片
 * @param {string} containerId
 * @param {object} cur  - 本週快照
 * @param {object} prev - 上週快照
 */
export function renderWeekComparison(containerId, cur, prev) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!cur) {
    container.innerHTML = '<div class="empty-state"><span class="empty-state__icon">📊</span><p class="empty-state__msg">尚無本週快照資料</p></div>';
    return;
  }

  const kpis = [
    {
      label: '整體健康度',
      cur: `${cur.onTrackPct ?? 0}%`,
      prev: prev ? `${prev.onTrackPct ?? 0}%` : null,
      diff: prev ? (cur.onTrackPct ?? 0) - (prev.onTrackPct ?? 0) : null,
      unit: '%',
      higherIsBetter: true,
    },
    {
      label: '高風險項目',
      cur: `${cur.highRisks ?? 0}`,
      prev: prev ? `${prev.highRisks ?? 0}` : null,
      diff: prev ? (cur.highRisks ?? 0) - (prev.highRisks ?? 0) : null,
      unit: '',
      higherIsBetter: false,
    },
    {
      label: '逾期 Actions',
      cur: `${cur.overdueActions ?? 0}`,
      prev: prev ? `${prev.overdueActions ?? 0}` : null,
      diff: prev ? (cur.overdueActions ?? 0) - (prev.overdueActions ?? 0) : null,
      unit: '',
      higherIsBetter: false,
    },
    {
      label: 'Action 完成率',
      cur: cur.totalActions > 0 ? `${Math.round((cur.completedActions / cur.totalActions) * 100)}%` : '—',
      prev: prev && prev.totalActions > 0 ? `${Math.round((prev.completedActions / prev.totalActions) * 100)}%` : null,
      diff: prev && prev.totalActions > 0 && cur.totalActions > 0
        ? Math.round((cur.completedActions / cur.totalActions) * 100) - Math.round((prev.completedActions / prev.totalActions) * 100)
        : null,
      unit: '%',
      higherIsBetter: true,
    },
  ];

  container.innerHTML = kpis.map(kpi => {
    const diffBadge = _diffBadge(kpi.diff, kpi.higherIsBetter, kpi.unit);
    const prevTxt   = kpi.prev ? `<span class="stats-bar__lbl">前週：${kpi.prev}</span>` : '';
    return `
      <div class="kpi-card ${_kpiClass(kpi.diff, kpi.higherIsBetter)}">
        <div class="kpi-card__label">${kpi.label}</div>
        <div class="kpi-card__value" style="display:flex;align-items:baseline;gap:8px;">
          ${kpi.cur}
          ${diffBadge}
        </div>
        ${prevTxt}
      </div>
    `;
  }).join('');
}

// ── 工具 ──────────────────────────────────────────────────────

function _diffBadge(diff, higherIsBetter, unit = '') {
  if (diff === null || diff === undefined) return '';
  if (diff === 0) return `<span class="diff-badge diff-badge--flat">0${unit}</span>`;

  const positive = (diff > 0) === higherIsBetter;
  const cls = positive ? 'up' : 'down';
  const sign = diff > 0 ? '+' : '';
  return `<span class="diff-badge diff-badge--${cls}">${sign}${diff}${unit}</span>`;
}

function _kpiClass(diff, higherIsBetter) {
  if (diff === null || diff === undefined || diff === 0) return '';
  const positive = (diff > 0) === higherIsBetter;
  return positive ? 'kpi-ok' : 'kpi-bad';
}

function _showEmpty(canvas, message) {
  const wrap = canvas.parentElement;
  canvas.style.display = 'none';
  if (!wrap.querySelector('.chart-empty')) {
    const el = document.createElement('div');
    el.className = 'chart-empty';
    el.innerHTML = `<span>📊</span><span>${message}</span>`;
    wrap.appendChild(el);
  }
}

/**
 * 銷毀所有圖表（頁面卸載時用）
 */
export function destroyAll() {
  Object.keys(_charts).forEach(_destroyChart);
}
