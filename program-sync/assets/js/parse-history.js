/* ============================================================
   parse-history.js — 解析歷史 .md 週報 → store 結構化資料
   V3：讓週報生成系統使用真實歷史資料
   ============================================================ */

/**
 * 從歷史週報 Markdown 解析結構化資料
 * @param {string} md - 週報 Markdown 原文
 * @param {string} filename - 檔名（用於推斷日期）
 * @returns {{ meta, projects, risks, actions, milestones, warnings }}
 */
export function parseHistoricalReport(md, filename = '') {
  const result = {
    meta:       _parseMeta(md, filename),
    projects:   _parseProjects(md),
    risks:      _parseRisks(md),
    actions:    _parseActions(md),
    milestones: _parseMilestones(md),
    warnings:   [],
  };
  result.warnings = _validate(result);
  return result;
}

/**
 * 驗證解析結果，回傳警告訊息陣列
 * @param {{ meta, projects, risks, actions, milestones }} parsed
 * @returns {string[]}
 */
function _validate({ meta, projects, risks, actions, milestones }) {
  const w = [];
  if (!meta.weekStart)
    w.push('⚠️ 無法識別「報告週期」，週次自動偵測失敗，請手動填入週次覆寫欄位');
  if (projects.length === 0)
    w.push('⚠️ 未解析到任何專案，請確認週報包含「## 專案進度總覽」章節');
  if (projects.length > 0 && projects.every(p => !p.owner))
    w.push('ℹ️ 所有專案皆無 owner，owner 欄位可能未填寫');
  if (actions.length === 0)
    w.push('ℹ️ 未解析到 Action Items，請確認週報包含「## 行動項目」或「## Action Items」章節');
  const noStatus = projects.filter(p => !['on-track','at-risk','behind','paused'].includes(p.status));
  if (noStatus.length > 0)
    w.push(`ℹ️ ${noStatus.length} 個專案狀態無法識別（將預設為 on-track）：${noStatus.map(p=>p.name).join('、')}`);
  return w;
}

// ── 元資料解析 ────────────────────────────────────────────────
function _parseMeta(md, filename) {
  const period  = md.match(/報告週期[：:]\s*([^\n`]+)/)?.[1]?.trim() || '';
  const date    = md.match(/報告日期[：:]\s*([\d/]+)/)?.[1]?.trim() || '';
  const author  = md.match(/彙整人[：:]\s*([^\n`]+)/)?.[1]?.trim() || '';
  const teams   = md.match(/涵蓋團隊[：:]\s*([^\n`]+)/)?.[1]?.trim() || '';
  const title   = md.match(/報告標題[：:]\s*([^\n`]+)/)?.[1]?.trim() || filename.replace('.md','');

  // 從週期字串推算 weekStart (e.g. "2026/03/16 – 2026/03/20" → "2026-03-16")
  const weekStartMatch = period.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  const weekStart = weekStartMatch
    ? `${weekStartMatch[1]}-${weekStartMatch[2]}-${weekStartMatch[3]}`
    : date.replace(/\//g, '-').split('（')[0];

  return { title, period, date, author, teams, weekStart };
}

// ── 專案解析 ──────────────────────────────────────────────────
function _parseProjects(md) {
  const projects = [];

  // 匹配 ### N.M 專案名稱 — 狀態emoji 模式
  const sectionRegex = /###\s+[\d.]+\s+(.+?)\s+(🟢|🟡|🔴)\s*\n([\s\S]*?)(?=\n###|\n##|\n---|\n#\s|$)/g;
  let match;

  while ((match = sectionRegex.exec(md)) !== null) {
    const rawTitle  = match[1].trim();
    const emoji     = match[2];
    const body      = match[3];

    // 去掉狀態 emoji 殘留
    const name = rawTitle.replace(/[🟢🟡🔴]/g, '').trim();

    // 從標題推斷團隊
    const team = _inferTeam(name + ' ' + body);

    // 解析負責人
    const ownerMatch = body.match(/\*\*負責人[^*]*\*\*[：:]\s*([^\n,（(]+)/);
    const owner = ownerMatch ? ownerMatch[1].trim() : '';

    // 解析狀態
    const status = emoji === '🟢' ? 'on-track'
                 : emoji === '🔴' ? 'behind'
                 : 'at-risk';

    // 解析預計完成日
    const dateMatch = body.match(/預計完成[日期]?[：:]\s*([\d/]+)/);
    const targetDate = dateMatch ? dateMatch[1].replace(/\//g, '-') : '';

    // 本週完成事項：抓 ✅ 結尾或 **現況** 後的內容
    const doneLines = [...body.matchAll(/[✅✔☑]\s*(.+)/g)].map(m => m[1].trim());
    const weekDone = doneLines.length > 0
      ? doneLines.slice(0, 3).join('\n')
      : _extractSection(body, ['現況', '本週完成', '進展'], 200);

    // 阻塞項
    const blockers = _extractSection(body, ['阻塞', '阻礙', '延遲', 'blocked'], 150)
      || [...body.matchAll(/[⏸️🔴❌]\s*(.+)/g)].map(m => m[1]).slice(0,2).join('\n');

    if (name.length > 1) {
      projects.push({
        id:         _genId(name),
        name,
        team,
        owner,
        status,
        progress:   _inferProgress(body, status),
        weekDone:   weekDone.substring(0, 500),
        blockers:   blockers.substring(0, 300),
        targetDate,
        _source: 'history',
      });
    }
  }

  return projects;
}

// ── 風險解析 ──────────────────────────────────────────────────
function _parseRisks(md) {
  const risks = [];

  // 抓風險章節（Risk Register 或 風險 相關章節）
  const riskSectionMatch = md.match(/##\s+.*[Rr]isk.*\n([\s\S]*?)(?=\n##|$)/);
  if (!riskSectionMatch) return _parseInlineRisks(md);

  const riskBody = riskSectionMatch[1];

  // 抓表格行 | ID | 描述 | 等級 | 負責人 | 狀態 |
  const tableRows = [...riskBody.matchAll(/\|\s*([R\d]+)\s*\|\s*([^|]+)\|\s*(高|中|低|high|medium|low)\s*\|\s*([^|]*)\|\s*([^|]*)\|/gi)];

  for (const row of tableRows) {
    const level = _normalizeLevel(row[3]);
    risks.push({
      id:          row[1].trim(),
      description: row[2].trim(),
      level,
      owner:       row[4].trim(),
      status:      _normalizeRiskStatus(row[5]),
      mitigation:  '',
      _source: 'history',
    });
  }

  // 若表格解析無結果，嘗試項目符號解析
  if (risks.length === 0) return _parseInlineRisks(md);

  return risks;
}

function _parseInlineRisks(md) {
  const risks = [];
  // Top Risks 段落
  const topRisksMatch = md.match(/Top\s+Risks[：:：]?\s*([\s\S]*?)(?=\n##|管理層決策|$)/i);
  if (!topRisksMatch) return risks;

  const body = topRisksMatch[1];
  const lines = body.split('\n').filter(l => l.trim().length > 20);

  lines.slice(0, 6).forEach((line, i) => {
    const level = line.includes('高') || line.includes('重大') || line.includes('未決') ? 'high'
                : line.includes('中') ? 'medium' : 'low';
    risks.push({
      id:          `R${i+1}`,
      description: line.replace(/^[-*•\d.]\s*/, '').substring(0, 200),
      level,
      owner:       '',
      status:      'open',
      mitigation:  '',
      _source: 'history',
    });
  });

  return risks;
}

// ── Action Items 解析 ─────────────────────────────────────────
function _parseActions(md) {
  const actions = [];

  // 抓 Action Items / PgM 追蹤器 段落
  const actionSectionMatch = md.match(/##\s+.*(?:[Aa]ction|PgM\s*追蹤|行動|下週計畫).*\n([\s\S]*?)(?=\n##|$)/);
  if (!actionSectionMatch) return actions;

  const body = actionSectionMatch[1];

  // 表格解析
  const tableRows = [...body.matchAll(/\|\s*([^|]+)\|\s*([^|]*)\|\s*([\d/]+|本週|下週|TBD)?\s*\|\s*([^|]*)\|/g)];
  for (const row of tableRows) {
    const task = row[1].trim();
    if (task.length < 3 || task === '行動' || task === '任務') continue;
    const owner   = row[2].trim();
    const dueRaw  = row[3]?.trim() || '';
    const status  = _normalizeActionStatus(row[4]?.trim() || '');
    const dueDate = _parseDate(dueRaw);

    actions.push({
      id:       _genId(task),
      task:     task.substring(0, 200),
      owner,
      dueDate,
      status,
      category: _inferActionCategory(task),
      _source: 'history',
    });
  }

  // 項目符號解析（@負責人 格式）
  if (actions.length === 0) {
    const bulletItems = [...body.matchAll(/[-*•]\s+(.{10,}?)(?:\（@([^）]+)）|(?:\s+[@＠](\S+)))?$/gm)];
    bulletItems.slice(0, 10).forEach((item, i) => {
      const task  = item[1].trim();
      const owner = (item[2] || item[3] || '').trim();
      actions.push({
        id:       `a_h_${i}`,
        task:     task.substring(0, 200),
        owner,
        dueDate:  '',
        status:   'pending',
        category: _inferActionCategory(task),
        _source: 'history',
      });
    });
  }

  return actions;
}

// ── 里程碑解析 ────────────────────────────────────────────────
function _parseMilestones(md) {
  const milestones = [];
  // 抓所有明確日期 + 描述
  const dateItems = [...md.matchAll(/\*?\*?(20\d\d\/\d{1,2}\/\d{1,2})\*?\*?\s*[|｜]?\s*(.{5,80}?)(?:\s*[|｜]|\s*\n)/g)];

  dateItems.slice(0, 8).forEach((m, i) => {
    const dateStr = m[1].replace(/\//g, '-');
    const label   = m[2].replace(/\*\*/g, '').trim();
    const today   = new Date().toISOString().split('T')[0];
    const status  = dateStr < today ? 'done' : 'upcoming';

    if (label.length > 3) {
      milestones.push({
        id:     `ms_h_${i}`,
        name:   label.substring(0, 100),
        date:   dateStr,
        status,
        team:   '',
        _source: 'history',
      });
    }
  });

  return milestones;
}

// ── 輔助函式 ──────────────────────────────────────────────────
function _inferTeam(text) {
  const t = text.toLowerCase();
  if (t.includes('media agent') || t.includes('olapedia') || t.includes('stt') || t.includes('openman') || t.includes('tvbs')) return 'media-agent';
  if (t.includes('learnmode') || t.includes('sel') || t.includes('教育') || t.includes('learn')) return 'learnmode';
  if (t.includes('創造栗') || t.includes('小栗方') || t.includes('chuangzaoli') || t.includes('aiot')) return 'chuangzaoli';
  if (t.includes('tv solution') || t.includes('openmam') || t.includes('magicview')) return 'tv-solution';
  if (t.includes('healthcare') || t.includes('bu2') || t.includes('醫療') || t.includes('patient')) return 'healthcare';
  return 'media-agent';
}

function _inferProgress(body, status) {
  // 抓百分比
  const pct = body.match(/(\d{1,3})%/);
  if (pct) return Math.min(100, parseInt(pct[1]));
  // 根據狀態推估
  return status === 'on-track' ? 75 : status === 'at-risk' ? 45 : 20;
}

function _inferActionCategory(task) {
  const t = task.toLowerCase();
  if (t.includes('業務') || t.includes('demo') || t.includes('客戶') || t.includes('銷售') || t.includes('推廣') || t.includes('展示')) return 'business';
  if (t.includes('人力') || t.includes('資源') || t.includes('預算') || t.includes('招募') || t.includes('採購')) return 'resource';
  return 'technical';
}

function _normalizeLevel(raw = '') {
  const r = raw.trim().toLowerCase();
  if (r === '高' || r === 'high') return 'high';
  if (r === '低' || r === 'low') return 'low';
  return 'medium';
}

function _normalizeRiskStatus(raw = '') {
  const r = raw.trim().toLowerCase();
  if (r.includes('解決') || r.includes('close') || r.includes('done')) return 'closed';
  if (r.includes('進行') || r.includes('progress')) return 'in-progress';
  return 'open';
}

function _normalizeActionStatus(raw = '') {
  const r = raw.trim().toLowerCase();
  if (r.includes('完成') || r.includes('done') || r.includes('✅')) return 'done';
  if (r.includes('進行') || r.includes('progress') || r.includes('🟡')) return 'in-progress';
  if (r.includes('阻塞') || r.includes('block')) return 'blocked';
  return 'pending';
}

function _parseDate(raw = '') {
  // e.g. "2026/03/25" → "2026-03-25"
  const m = raw.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  // "本週" → 本週末
  if (raw.includes('本週')) {
    const d = new Date(); d.setDate(d.getDate() + (5 - d.getDay()));
    return d.toISOString().split('T')[0];
  }
  return '';
}

function _extractSection(text, keywords, maxLen = 200) {
  for (const kw of keywords) {
    const re = new RegExp(`\\*\\*${kw}[^*]*\\*\\*[：:]?\\s*([^\\n]{5,})`, 'i');
    const m = text.match(re);
    if (m) return m[1].trim().substring(0, maxLen);
  }
  return '';
}

function _genId(name) {
  return 'h_' + name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '_').substring(0, 20) + '_' + Date.now().toString(36);
}

/**
 * 將解析結果同步到 store（覆蓋同名項目，保留手動輸入的項目）
 * @param {object} parsed - parseHistoricalReport 的輸出
 * @param {object} store  - store 模組
 * @param {object} options
 * @param {boolean} options.replaceAll - 是否清除舊資料後再寫入
 */
export function syncToStore(parsed, store, options = { replaceAll: false }) {
  const { projects, risks, actions, milestones, meta } = parsed;

  if (options.replaceAll) {
    store.clear('projects');
    store.clear('risks');
    store.clear('actions');
    store.clear('milestones');
  }

  let counts = { projects: 0, risks: 0, actions: 0, milestones: 0 };

  for (const p of projects) {
    // 避免重複：若已存在同名項目則跳過（除非 replaceAll）
    if (!options.replaceAll) {
      const existing = store.query('projects', x => x.name === p.name);
      if (existing.length > 0) continue;
    }
    store.save('projects', p);
    counts.projects++;
  }

  for (const r of risks) {
    if (!options.replaceAll) {
      const existing = store.query('risks', x => x.description === r.description);
      if (existing.length > 0) continue;
    }
    store.save('risks', r);
    counts.risks++;
  }

  for (const a of actions) {
    if (!options.replaceAll) {
      const existing = store.query('actions', x => x.task === a.task);
      if (existing.length > 0) continue;
    }
    store.save('actions', a);
    counts.actions++;
  }

  for (const m of milestones) {
    if (!options.replaceAll) {
      const existing = store.query('milestones', x => x.name === m.name && x.date === m.date);
      if (existing.length > 0) continue;
    }
    store.save('milestones', m);
    counts.milestones++;
  }

  return counts;
}
