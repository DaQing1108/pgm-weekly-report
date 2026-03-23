/* ============================================================
   import.js — 文字解析：將貼上的文字自動分類為
   projects / risks / actions / milestones
   Program Sync 週報管理系統
   ============================================================ */

import { generateId } from './ui.js';

// ── 識別規則 regex ────────────────────────────────────────────

const RE_DONE_PROJECT   = /完成|done|✅|finish|delivered|launched/i;
const RE_RISK           = /延遲|blocked|阻塞|風險|⚠️|🔴|blocked|delay|at.?risk|behind/i;
const RE_ACTION         = /@[\w\u4e00-\u9fff]+|負責|action|追蹤|follow.?up|todo|to.?do/i;
const RE_DATE           = /\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4}/;
const RE_PERCENT        = /%\s*\d+|\d+\s*%|進度\s*[:：]\s*\d+/;
const RE_TEAM           = /media.?agent|learnmode|創造栗|tv.?solution|healthcare/i;
const RE_MEMBER         = /Steve\s*Liu|TC\s*Peng|Tonny\s*Shen|Tom\s*Liu|Alex\s*Chen|Michael\s*Wu|Dream\s*Lin|Jenny\s*Huang|Kevin\s*Chang|Lily\s*Tsai|Ryan\s*Hsu/i;

/**
 * 解析純文字為結構化資料
 * @param {string} text - 使用者貼入的文字
 * @param {'slack'|'email'|'jira'|'raw'} source - 來源格式
 * @returns {{ projects: object[], risks: object[], actions: object[], milestones: object[] }}
 */
export function parseText(text, source = 'raw') {
  if (!text || !text.trim()) {
    return { projects: [], risks: [], actions: [], milestones: [] };
  }

  // 預處理：依來源格式清理
  const cleaned = _preprocess(text, source);
  const lines   = cleaned.split('\n').map(l => l.trim()).filter(Boolean);

  const projects   = [];
  const risks      = [];
  const actions    = [];
  const milestones = [];

  for (const line of lines) {
    if (!line || line.startsWith('//') || line.startsWith('#')) continue;

    const parsed = _classifyLine(line);
    if (!parsed) continue;

    switch (parsed.type) {
      case 'project':   projects.push(parsed.data);   break;
      case 'risk':      risks.push(parsed.data);       break;
      case 'action':    actions.push(parsed.data);     break;
      case 'milestone': milestones.push(parsed.data);  break;
    }
  }

  return { projects, risks, actions, milestones };
}

// ── 前處理 ────────────────────────────────────────────────────

function _preprocess(text, source) {
  let out = text;

  switch (source) {
    case 'slack':
      // 移除 Slack 格式：<@U...> → @user，*bold* → bold
      out = out
        .replace(/<@[A-Z0-9]+>/g, '@member')
        .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/~([^~]+)~/g, '$1');
      break;

    case 'email':
      // 移除常見 email 引用符
      out = out.replace(/^>+\s?/gm, '');
      break;

    case 'jira':
      // 移除 JIRA 標記如 [PROJECT-123]
      out = out.replace(/\[[A-Z]+-\d+\]\s*/g, '');
      break;
  }

  return out;
}

// ── 行分類 ────────────────────────────────────────────────────

function _classifyLine(line) {
  const text = line.replace(/^[-•*✓✗✅🟢🟡🔴⚠️📌]\s*/, '').trim();
  if (!text) return null;

  const pct     = _extractPercent(line);
  const date    = _extractDate(line);
  const owner   = _extractOwner(line);
  const team    = _extractTeam(line);

  // 里程碑：有明確日期且含關鍵詞
  if (date && /里程碑|milestone|上線|launch|release|GA|截止|deadline|due/i.test(line)) {
    return {
      type: 'milestone',
      data: {
        id: generateId(),
        name: _cleanText(text),
        date: _normalizeDate(date),
        team: team || '',
        status: 'upcoming',
        _raw: line,
      },
    };
  }

  // 風險：含風險關鍵詞
  if (RE_RISK.test(line)) {
    const level = _extractRiskLevel(line);
    return {
      type: 'risk',
      data: {
        id: generateId(),
        description: _cleanText(text),
        level,
        owner: owner || '',
        dueDate: date ? _normalizeDate(date) : '',
        status: 'open',
        mitigation: '',
        _raw: line,
      },
    };
  }

  // Action：含 @人名 或 action 關鍵詞
  if (RE_ACTION.test(line)) {
    return {
      type: 'action',
      data: {
        id: generateId(),
        task: _cleanText(text),
        owner: owner || '',
        dueDate: date ? _normalizeDate(date) : '',
        status: 'pending',
        category: 'technical',
        _raw: line,
      },
    };
  }

  // 專案：有完成/done 關鍵詞，或有明確進度百分比
  if (RE_DONE_PROJECT.test(line) || pct !== null) {
    return {
      type: 'project',
      data: {
        id: generateId(),
        name: _cleanText(text),
        status: _extractProjectStatus(line),
        progress: pct ?? 50,
        owner: owner || '',
        team: team || '',
        weekDone: _cleanText(text),
        blockers: '',
        targetDate: date ? _normalizeDate(date) : '',
        _raw: line,
      },
    };
  }

  // 預設：若有日期視為里程碑
  if (date) {
    return {
      type: 'milestone',
      data: {
        id: generateId(),
        name: _cleanText(text),
        date: _normalizeDate(date),
        team: team || '',
        status: 'upcoming',
        _raw: line,
      },
    };
  }

  // 最後：若有 owner 相關資訊視為 action
  if (owner) {
    return {
      type: 'action',
      data: {
        id: generateId(),
        task: _cleanText(text),
        owner,
        dueDate: '',
        status: 'pending',
        category: 'business',
        _raw: line,
      },
    };
  }

  return null;
}

// ── 擷取工具 ──────────────────────────────────────────────────

function _extractPercent(line) {
  const m = line.match(/(\d+)\s*%/) || line.match(/%\s*(\d+)/) || line.match(/進度\s*[:：]\s*(\d+)/);
  if (!m) return null;
  const v = parseInt(m[1]);
  return isNaN(v) ? null : Math.min(100, Math.max(0, v));
}

function _extractDate(line) {
  const m = line.match(RE_DATE);
  return m ? m[0] : null;
}

function _extractOwner(line) {
  // @人名
  const atMatch = line.match(/@([\w\u4e00-\u9fff]+)/);
  if (atMatch) return atMatch[1];

  // 已知成員名稱
  const memberMatch = line.match(RE_MEMBER);
  if (memberMatch) return memberMatch[0].trim();

  // 負責人: xxx
  const resp = line.match(/負責[:：]\s*([\w\u4e00-\u9fff\s]+)/);
  if (resp) return resp[1].trim().split(/\s+/)[0];

  return '';
}

function _extractTeam(line) {
  const m = line.match(RE_TEAM);
  if (!m) return '';
  const t = m[0].toLowerCase().replace(/\s/g, '');
  if (t.includes('media') || t.includes('agent')) return 'media-agent';
  if (t.includes('learn')) return 'learnmode';
  if (t.includes('創造') || t.includes('czl') || t.includes('chuang')) return 'chuangzaoli';
  if (t.includes('tv')) return 'tv-solution';
  if (t.includes('health') || t.includes('care')) return 'healthcare';
  return '';
}

function _extractRiskLevel(line) {
  if (/high|高|嚴重|critical/i.test(line)) return 'high';
  if (/medium|中|moderate/i.test(line)) return 'medium';
  if (/low|低|minor/i.test(line)) return 'low';
  if (/🔴/.test(line)) return 'high';
  if (/⚠️|🟡/.test(line)) return 'medium';
  return 'medium';
}

function _extractProjectStatus(line) {
  if (/🔴|behind|落後|延遲大|blocked/i.test(line)) return 'behind';
  if (/⚠️|🟡|at.?risk|風險|延遲/i.test(line)) return 'at-risk';
  return 'on-track';
}

function _normalizeDate(dateStr) {
  // 支援 YYYY/MM/DD 或 DD/MM/YYYY 或 YYYY-MM-DD
  if (!dateStr) return '';
  const clean = dateStr.replace(/\//g, '-');
  const parts = clean.split('-');
  if (parts.length !== 3) return dateStr;

  // 判斷格式
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    const [y, m, d] = parts;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  } else {
    // DD-MM-YYYY
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
  }
}

function _cleanText(text) {
  return text
    .replace(RE_DATE, '')
    .replace(RE_PERCENT, '')
    .replace(/@[\w\u4e00-\u9fff]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
