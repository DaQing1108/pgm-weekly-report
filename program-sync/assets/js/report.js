/* ============================================================
   report.js — 週報生成（Markdown 格式，9個章節）
   Program Sync 週報管理系統
   ============================================================ */

import { store } from './store.js';
import { formatDate } from './ui.js';

// ── 主要生成函式 ───────────────────────────────────────────────

/**
 * 生成週報 Markdown 字串
 * @param {object} options
 * @param {string} options.weekStart     - 'YYYY-MM-DD'
 * @param {string} options.weekLabel     - 'W11'
 * @param {string} options.author        - 彙整人
 * @param {string[]} options.sections    - 要包含的章節 id 陣列
 * @param {'formal'|'concise'|'executive'|'technical'} options.tone
 * @returns {string} Markdown 字串
 */
export function generateReport(options = {}) {
  const {
    // R-2 修正：weekStart 預設值改為動態計算當週 Monday，取代過去日期硬編碼
    weekStart  = store.getAll('snapshots').slice(-1)[0]?.weekStart || _currentWeekStart(),
    weekLabel  = 'W11',
    author     = 'Program Sync System',
    sections   = ['cover','summary','projects','teams','decisions','next','risks','actions','milestones'],
    tone       = 'formal',
  } = options;

  const projects   = store.getAll('projects');
  const risks      = store.getAll('risks');
  const actions    = store.getAll('actions');
  const milestones = store.getAll('milestones');
  const stats      = store.stats();

  const today = new Date().toISOString().split('T')[0];
  const parts = [];

  if (sections.includes('cover')) {
    parts.push(_genCover({ weekStart, weekLabel, author, today }));
  }

  if (sections.includes('summary')) {
    parts.push(_genSummary({ stats, projects, risks, actions, tone }));
  }

  if (sections.includes('projects')) {
    parts.push(_genProjects({ projects, tone }));
  }

  if (sections.includes('teams')) {
    parts.push(_genTeams({ projects, tone }));
  }

  if (sections.includes('decisions')) {
    parts.push(_genDecisions({ risks, tone }));
  }

  if (sections.includes('next')) {
    parts.push(_genNextWeek({ actions, milestones, weekStart, tone }));
  }

  if (sections.includes('risks')) {
    parts.push(_genRiskRegister({ risks, tone }));
  }

  if (sections.includes('actions')) {
    parts.push(_genActions({ actions, tone }));
  }

  if (sections.includes('milestones')) {
    parts.push(_genMilestones({ milestones, today }));
  }

  return parts.join('\n\n---\n\n');
}

// ── AI 生成（串流）────────────────────────────────────────────

/**
 * 呼叫 AI 生成週報
 * @param {object} options - 與 generateReport 相同，額外有 callbacks
 * @returns {Promise<string>} 完整生成的 Markdown
 */
export async function generateWithAI(options = {}) {
  const { generateReportStream } = await import('./ai.js');
  const { toast } = await import('./ui.js');

  const context = _buildContext(options.weekStart);

  let fullText = '';
  await generateReportStream(context, options, {
    onChunk: (chunk) => {
      fullText += chunk;
      options.onChunk?.(chunk, fullText);
    },
    onDone: (text) => {
      fullText = text;
      options.onDone?.(text);
    },
    onError: (err) => {
      toast(`AI 生成失敗：${err.message}`, 'error');
      options.onError?.(err);
    },
    onTokens: (count) => {
      options.onTokens?.(count);
    },
  });

  return fullText;
}

/**
 * 重新生成單一章節
 * @param {string} sectionId
 * @param {object} options
 * @returns {Promise<string>}
 */
export async function regenerateSection(sectionId, options = {}) {
  const { regenerateSection: aiRegen } = await import('./ai.js');
  const context = _buildContext(options.weekStart);
  return aiRegen(sectionId, context, options.tone || 'formal');
}

// ── 章節生成函式 ───────────────────────────────────────────────

function _genCover({ weekStart, weekLabel, author, today }) {
  const weekEnd = _addDays(weekStart, 6);
  // R-1 修正：使用 _escMd() 跳脫 author 中的 Markdown 特殊字元，防止結構注入
  return `# VIA Technologies P&D Center\n# Program Weekly Report\n\n**週次：** ${weekLabel} (${formatDate(weekStart)} – ${formatDate(weekEnd)})\n\n**彙整人：** ${_escMd(author)}\n\n**生成時間：** ${formatDate(today)}\n\n> 本報告涵蓋 P&D Center 5 個子組、12 個專案的本週進度摘要、風險管理與行動事項。`;
}

function _genSummary({ stats, projects, risks, actions, tone }) {
  const onT  = projects.filter(p => p.status === 'on-track').length;
  const atR  = projects.filter(p => p.status === 'at-risk').length;
  const beh  = projects.filter(p => p.status === 'behind').length;
  const today = new Date().toISOString().split('T')[0];
  const overdueA = actions.filter(a => a.dueDate < today && a.status !== 'done').length;
  const highR = risks.filter(r => r.level === 'high' && r.status !== 'closed').length;

  let body = '';
  if (tone === 'executive') {
    body = `本週整體健康度 **${stats.onTrackPct}%**，${onT} 個專案順利推進，${atR} 個需關注，${beh} 個已落後。建議管理層重點關注 ${highR} 個高風險項目及 ${overdueA} 個逾期行動項。`;
  } else {
    body = `- **整體健康度：** ${stats.onTrackPct}% On Track\n- 🟢 正常推進：${onT} 個專案\n- 🟡 需要關注：${atR} 個專案\n- 🔴 已落後：${beh} 個專案\n- **高風險：** ${highR} 項\n- **逾期 Action：** ${overdueA} 項`;
  }

  return `## 1. Executive Summary\n\n${body}`;
}

function _genProjects({ projects, tone }) {
  const groups = {
    'on-track': projects.filter(p => p.status === 'on-track'),
    'at-risk':  projects.filter(p => p.status === 'at-risk'),
    'behind':   projects.filter(p => p.status === 'behind'),
  };

  let md = '## 2. 專案進度\n\n';

  const statusEmoji = { 'on-track': '🟢', 'at-risk': '🟡', 'behind': '🔴' };
  const statusLabel = { 'on-track': 'On Track', 'at-risk': 'At Risk', 'behind': 'Behind' };

  for (const [status, list] of Object.entries(groups)) {
    if (list.length === 0) continue;
    md += `### ${statusEmoji[status]} ${statusLabel[status]} (${list.length})\n\n`;

    if (tone === 'concise') {
      list.forEach(p => {
        md += `- **${p.name}** (${p.team}) — ${p.progress}%`;
        if (p.blockers) md += `　⚠️ ${p.blockers}`;
        md += '\n';
      });
    } else {
      md += '| 專案 | 子組 | 進度 | 本週完成 | 阻塞 |\n';
      md += '|------|------|------|----------|------|\n';
      list.forEach(p => {
        const prog  = `${p.progress}%`;
        const done  = p.weekDone  ? p.weekDone.substring(0, 40)  : '—';
        const block = p.blockers  ? p.blockers.substring(0, 40) : '—';
        md += `| ${p.name} | ${p.team} | ${prog} | ${done} | ${block} |\n`;
      });
    }
    md += '\n';
  }

  return md.trimEnd();
}

function _genTeams({ projects }) {
  const TEAMS_ORDER = ['media-agent', 'learnmode', 'chuangzaoli', 'tv-solution', 'healthcare'];
  const TEAM_NAMES = {
    'media-agent': 'Media Agent',
    'learnmode':   'LearnMode',
    'chuangzaoli': '創造栗',
    'tv-solution': 'TV Solution',
    'healthcare':  'BU2 Healthcare',
  };

  let md = '## 3. 子組進度\n\n';

  TEAMS_ORDER.forEach(teamId => {
    const tp = projects.filter(p => p.team === teamId);
    if (tp.length === 0) return;

    const on  = tp.filter(p => p.status === 'on-track').length;
    const health = Math.round((on / tp.length) * 100);
    const emoji = health >= 80 ? '🟢' : health >= 60 ? '🟡' : '🔴';

    md += `### ${emoji} ${TEAM_NAMES[teamId]} — ${health}%\n\n`;
    tp.forEach(p => {
      const statusE = p.status === 'on-track' ? '🟢' : p.status === 'at-risk' ? '🟡' : '🔴';
      md += `- ${statusE} **${p.name}** (${p.progress}%)`;
      if (p.weekDone) md += `\n  - ✅ ${p.weekDone}`;
      if (p.blockers) md += `\n  - ⚠️ ${p.blockers}`;
      md += '\n';
    });
    md += '\n';
  });

  return md.trimEnd();
}

function _genDecisions({ risks }) {
  const open = risks.filter(r => r.status !== 'closed');
  if (open.length === 0) {
    return '## 4. 決策需求與關鍵風險\n\n本週無需特別決策事項。';
  }

  let md = '## 4. 決策需求與關鍵風險\n\n';

  const high = open.filter(r => r.level === 'high');
  if (high.length > 0) {
    md += '### 🔴 需立即決策\n\n';
    high.forEach(r => {
      md += `**[${r.project || '—'}]** ${r.description}\n\n`;
      md += `- **負責人：** ${r.owner || '—'}\n`;
      md += `- **截止：** ${r.dueDate ? formatDate(r.dueDate) : 'TBD'}\n`;
      if (r.mitigation) md += `- **因應：** ${r.mitigation}\n`;
      md += '\n';
    });
  }

  const med = open.filter(r => r.level === 'medium');
  if (med.length > 0) {
    md += '### 🟡 持續監控\n\n';
    med.forEach(r => {
      md += `- **[${r.project || '—'}]** ${r.description}（負責：${r.owner || '—'}）\n`;
    });
    md += '\n';
  }

  return md.trimEnd();
}

function _genNextWeek({ actions, milestones, weekStart, tone }) {
  const nextWeekEnd = _addDays(weekStart, 13); // 下週末

  const nextActions = actions
    .filter(a => a.status !== 'done' && a.dueDate <= nextWeekEnd)
    .slice(0, 8);

  const upcomingMs = milestones
    .filter(m => m.date >= weekStart && m.date <= nextWeekEnd)
    .sort((a, b) => a.date.localeCompare(b.date));

  let md = '## 5. 下週計畫\n\n';

  if (upcomingMs.length > 0) {
    md += '### 📅 里程碑\n\n';
    upcomingMs.forEach(m => {
      md += `- **${formatDate(m.date)}** — ${m.name} (${m.team || '—'})\n`;
    });
    md += '\n';
  }

  if (nextActions.length > 0) {
    md += '### ✅ 重要行動\n\n';
    nextActions.forEach(a => {
      const due = a.dueDate ? `（截止 ${formatDate(a.dueDate)}）` : '';
      md += `- [ ] **${a.owner || '—'}：** ${a.task}${due}\n`;
    });
  } else {
    md += '_尚無下週行動項。_\n';
  }

  return md.trimEnd();
}

function _genRiskRegister({ risks }) {
  if (risks.length === 0) {
    return '## 6. Risk Register\n\n本週無開放風險。';
  }

  let md = '## 6. Risk Register\n\n';
  md += '| 等級 | 描述 | 專案 | 負責人 | 截止 | 狀態 |\n';
  md += '|------|------|------|--------|------|------|\n';

  const levelOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...risks].sort((a, b) =>
    (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3)
  );

  const levelLabel = { high: '🔴 高', medium: '🟡 中', low: '🟢 低' };

  sorted.forEach(r => {
    const desc = r.description.substring(0, 50) + (r.description.length > 50 ? '…' : '');
    const due  = r.dueDate ? formatDate(r.dueDate) : 'TBD';
    const stat = r.status === 'closed' ? '✅ 關閉' : r.status === 'in-progress' ? '🔄 處理中' : '📌 尚未處理';
    md += `| ${levelLabel[r.level] || r.level} | ${desc} | ${r.project || '—'} | ${r.owner || '—'} | ${due} | ${stat} |\n`;
  });

  return md;
}

function _genActions({ actions }) {
  if (actions.length === 0) {
    return '## 7. Action Items\n\n本週無行動事項。';
  }

  const today = new Date().toISOString().split('T')[0];
  const categories = [
    { id: 'technical', label: '⚙️ 技術' },
    { id: 'business',  label: '📋 業務' },
    { id: 'resource',  label: '👥 資源' },
  ];

  let md = '## 7. Action Items\n\n';

  categories.forEach(cat => {
    const list = actions.filter(a => a.category === cat.id);
    if (list.length === 0) return;

    md += `### ${cat.label}\n\n`;
    md += '| 任務 | 負責人 | 截止 | 狀態 |\n';
    md += '|------|--------|------|------|\n';

    list.forEach(a => {
      const due   = a.dueDate ? formatDate(a.dueDate) : '—';
      const late  = a.dueDate && a.dueDate < today && a.status !== 'done' ? ' ⚠️' : '';
      const statLabel = {
        'done': '✅ 完成', 'in-progress': '🔄 進行中',
        'pending': '⏳ 待辦', 'blocked': '🚫 阻塞'
      }[a.status] || a.status;
      md += `| ${a.task} | ${a.owner || '—'} | ${due}${late} | ${statLabel} |\n`;
    });
    md += '\n';
  });

  return md.trimEnd();
}

function _genMilestones({ milestones, today }) {
  if (milestones.length === 0) {
    return '## 8. 里程碑\n\n本週無里程碑資料。';
  }

  const sorted = [...milestones].sort((a, b) => a.date.localeCompare(b.date));
  let md = '## 8. 里程碑\n\n';
  md += '| 日期 | 里程碑 | 子組 | 狀態 |\n';
  md += '|------|--------|------|------|\n';

  sorted.forEach(m => {
    const isPast   = m.date < today;
    const isToday  = m.date === today;
    const emoji    = isPast ? '✅' : isToday ? '🎯' : '📅';
    const statusLbl = m.status === 'done' ? '已完成' : isToday ? '今日' : '即將到來';
    md += `| ${formatDate(m.date)} | ${emoji} ${m.name} | ${m.team || '—'} | ${statusLbl} |\n`;
  });

  return md;
}

// ── 內部工具 ──────────────────────────────────────────────────

// R-2 修正：動態計算本週 Monday（取代 hardcode 日期）
function _currentWeekStart() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// R-1 修正：跳脫 Markdown 特殊字元，防止 author 欄位注入額外章節
function _escMd(str) {
  return String(str ?? '').replace(/[\\`*_{}[\]()#+\-.!|]/g, '\\$&');
}

function _addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function _buildContext(weekStart) {
  const projects   = store.getAll('projects');
  const risks      = store.getAll('risks');
  const actions    = store.getAll('actions');
  const milestones = store.getAll('milestones');
  const stats      = store.stats();

  return {
    weekStart,
    stats,
    projects: projects.map(p => ({
      name: p.name, team: p.team, status: p.status,
      progress: p.progress, owner: p.owner,
      weekDone: p.weekDone, blockers: p.blockers,
    })),
    risks: risks.filter(r => r.status !== 'closed').map(r => ({
      level: r.level, description: r.description,
      project: r.project, owner: r.owner,
      dueDate: r.dueDate, mitigation: r.mitigation,
    })),
    actions: actions.filter(a => a.status !== 'done').map(a => ({
      task: a.task, owner: a.owner, dueDate: a.dueDate,
      status: a.status, category: a.category,
    })),
    milestones: milestones.map(m => ({
      name: m.name, date: m.date, team: m.team,
    })),
  };
}
