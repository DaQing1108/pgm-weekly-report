/* ============================================================
   ai.js — Claude API 整合（Anthropic claude-sonnet-4-6）
   Program Sync 週報管理系統
   ============================================================ */

import { store } from './store.js';
import { formatDate } from './ui.js';

const API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const MODEL        = 'claude-sonnet-4-6';
const MAX_TOKENS   = 4096;

// ── API Key 驗證 ───────────────────────────────────────────────

/**
 * 驗證 API Key 是否有效（送一個最小化測試請求）
 * @param {string} key
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function validateApiKey(key) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: _headers(key),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 32,
        messages: [{ role: 'user', content: 'Reply with "ok" only.' }],
      }),
    });

    if (res.status === 401) return { ok: false, message: 'API Key 無效，請確認後重試' };
    if (res.status === 403) return { ok: false, message: 'API Key 權限不足' };
    if (!res.ok) return { ok: false, message: `驗證失敗 (${res.status})` };

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    if (text.toLowerCase().includes('ok')) {
      return { ok: true, message: 'API Key 驗證成功' };
    }
    return { ok: true, message: 'API Key 有效' };
  } catch (e) {
    return { ok: false, message: `網路錯誤：${e.message}` };
  }
}

// ── 非串流生成 ────────────────────────────────────────────────

/**
 * 生成週報（非串流）
 * @param {object} context - 來自 report.js buildContext
 * @param {object} options - { tone, sections, weekLabel, author }
 * @returns {Promise<string>} Markdown 字串
 */
export async function generateReport(context, options = {}) {
  const key = store.getApiKey();
  if (!key) throw new Error('尚未設定 API Key');

  const systemPrompt = buildSystemPrompt('report', options.tone || 'formal');
  const userPrompt   = buildUserPrompt(context, options);

  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: _headers(key),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 錯誤 (${res.status})`);
  }

  const data = await res.json();
  return data?.content?.[0]?.text || '';
}

// ── 串流生成 ──────────────────────────────────────────────────

/**
 * 串流生成週報
 * @param {object} context
 * @param {object} options
 * @param {object} callbacks - { onChunk, onDone, onError, onTokens }
 */
export async function generateReportStream(context, options = {}, callbacks = {}) {
  const key = store.getApiKey();
  if (!key) {
    callbacks.onError?.(new Error('尚未設定 API Key'));
    return;
  }

  const systemPrompt = buildSystemPrompt('report', options.tone || 'formal');
  const userPrompt   = buildUserPrompt(context, options);

  let fullText   = '';
  let inputTokens  = 0;
  let outputTokens = 0;

  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: _headers(key),
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API 錯誤 (${res.status})`);
    }

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;

        try {
          const ev = JSON.parse(raw);

          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            const chunk = ev.delta.text || '';
            fullText += chunk;
            callbacks.onChunk?.(chunk, fullText);
          }

          if (ev.type === 'message_delta' && ev.usage) {
            outputTokens = ev.usage.output_tokens ?? outputTokens;
          }

          if (ev.type === 'message_start' && ev.message?.usage) {
            inputTokens = ev.message.usage.input_tokens ?? 0;
          }

          callbacks.onTokens?.({ input: inputTokens, output: outputTokens });
        } catch {
          // 忽略非 JSON 行
        }
      }
    }

    callbacks.onDone?.(fullText);
  } catch (e) {
    callbacks.onError?.(e);
  }
}

// ── 單一章節重生成 ────────────────────────────────────────────

/**
 * 重新生成特定章節
 * @param {string} sectionId - 章節 id
 * @param {object} context
 * @param {'formal'|'concise'|'executive'|'technical'} tone
 * @returns {Promise<string>}
 */
export async function regenerateSection(sectionId, context, tone = 'formal') {
  const key = store.getApiKey();
  if (!key) throw new Error('尚未設定 API Key');

  const sectionLabels = {
    cover:      '封面',
    summary:    'Executive Summary',
    projects:   '專案進度',
    teams:      '子組進度',
    decisions:  '決策與風險',
    next:       '下週計畫',
    risks:      'Risk Register',
    actions:    'Action Items',
    milestones: '里程碑',
  };

  const label = sectionLabels[sectionId] || sectionId;

  const systemPrompt = buildSystemPrompt('section', tone);
  const userPrompt = `請只重新生成「${label}」章節的 Markdown 內容。\n\n以下是本週資料：\n\n${JSON.stringify(context, null, 2)}`;

  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: _headers(key),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 錯誤 (${res.status})`);
  }

  const data = await res.json();
  return data?.content?.[0]?.text || '';
}

// ── System Prompt 建構 ────────────────────────────────────────

/**
 * @param {'report'|'section'} mode
 * @param {string} tone
 */
export function buildSystemPrompt(mode, tone = 'formal') {
  const toneInstructions = {
    formal: '使用正式、專業的繁體中文撰寫，語氣客觀中立，適合呈報給上級主管。',
    concise: '使用精簡、要點式的繁體中文，每個項目控制在 2 行以內，突出最重要資訊。',
    executive: '撰寫高管摘要風格，聚焦業務影響、決策需求和 KPI，避免技術細節。',
    technical: '使用技術性語言，包含具體的技術指標、架構說明和實作細節。',
  };

  const toneGuide = toneInstructions[tone] || toneInstructions.formal;

  const base = `你是 VIA Technologies P&D Center 的資深 Program Manager，負責撰寫每週的部門進度週報。

寫作風格：${toneGuide}

格式規範：
- 輸出純 Markdown 格式
- 使用繁體中文，技術術語可保留英文
- 狀態使用 emoji：🟢（On Track）、🟡（At Risk）、🔴（Behind）
- 章節使用 ## 標題，子節使用 ###
- 表格用於列表資料
- 數字要具體，避免模糊描述
- 保持客觀，不誇大也不遮掩問題`;

  if (mode === 'section') {
    return base + '\n\n注意：只輸出指定章節內容，不要輸出其他章節。';
  }

  return base + `\n\n週報結構：
1. 封面（標題、週次、彙整人）
2. Executive Summary（整體健康度、重要數字）
3. 專案進度（依狀態分組）
4. 子組進度（各組摘要）
5. 決策需求與關鍵風險
6. 下週計畫
7. Risk Register（完整風險表）
8. Action Items（分類行動表）
9. 里程碑（可選）`;
}

/**
 * 建構 User Prompt
 */
export function buildUserPrompt(context, options = {}) {
  const {
    weekLabel = 'W??',
    author    = 'Program Manager',
    sections  = null,
    tone      = 'formal',
  } = options;

  const weekDateStr = context.weekStart
    ? `${formatDate(context.weekStart)} 週`
    : '本週';

  const sectionsNote = sections
    ? `\n\n只需生成以下章節：${sections.join('、')}`
    : '';

  return `請為 VIA Technologies P&D Center 生成 ${weekDateStr}（${weekLabel}）的週報，彙整人：${author}。

語氣要求：${tone}${sectionsNote}

以下是本週完整數據，請據此生成週報：

${JSON.stringify(context, null, 2)}`;
}

/**
 * 建構 context 物件（從 store 取資料）
 * @param {string} weekStart
 */
export function buildContext(weekStart) {
  const { store: s } = { store };

  const projects   = store.getAll('projects');
  const risks      = store.getAll('risks');
  const actions    = store.getAll('actions');
  const milestones = store.getAll('milestones');
  const stats      = store.stats();

  return {
    weekStart,
    generatedAt: new Date().toISOString(),
    stats,
    summary: {
      totalProjects:  stats.totalProjects,
      onTrackPct:     stats.onTrackPct,
      atRiskProjects: stats.atRiskProjects,
      behindProjects: stats.behindProjects,
      highRisks:      stats.highRisks,
      overdueActions: stats.overdueActions,
    },
    projects: projects.map(p => ({
      name: p.name, team: p.team, status: p.status,
      progress: p.progress, owner: p.owner,
      weekDone: p.weekDone || '', blockers: p.blockers || '',
      targetDate: p.targetDate || '',
    })),
    risks: risks
      .filter(r => r.status !== 'closed')
      .map(r => ({
        level: r.level, description: r.description,
        project: r.project || '', owner: r.owner || '',
        dueDate: r.dueDate || '', mitigation: r.mitigation || '',
        status: r.status,
      })),
    actions: actions
      .filter(a => a.status !== 'done')
      .map(a => ({
        task: a.task, owner: a.owner || '',
        dueDate: a.dueDate || '', status: a.status,
        category: a.category,
      })),
    milestones: milestones
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => ({
        name: m.name, date: m.date, team: m.team || '',
        status: m.status,
      })),
  };
}

// ── 內部工具 ──────────────────────────────────────────────────

function _headers(apiKey) {
  return {
    'Content-Type':      'application/json',
    'x-api-key':         apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };
}
