/**
 * fix-agent.js
 * Reads health-report.json, calls Claude to analyze issues and apply minimal fixes.
 * Writes fix-summary.md and sets GitHub Actions output `has_fixes`.
 *
 * Usage: node fix-agent.js
 * Env:   ANTHROPIC_API_KEY, HEALTH_REPORT (path, default: health-report.json)
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const HEALTH_REPORT_PATH = process.env.HEALTH_REPORT
  || path.join(__dirname, 'health-report.json');

// Files the agent is allowed to write (safe scope only)
const WRITABLE_PATHS = new Set([
  'program-sync/index.html',
  'program-sync/input.html',
  'program-sync/risks.html',
  'program-sync/actions.html',
  'program-sync/milestones.html',
  'program-sync/report.html',
  'program-sync/trends.html',
  'program-sync/review.html',
  'program-sync/resources.html',
  'program-sync/assets/js/store.js',
  'program-sync/assets/data/schema.js',
  'program-sync/assets/js/app-init.js',
  'program-sync/assets/js/ui.js',
  'backend/src/index.js',
]);

// ── Tool definitions ───────────────────────────────────────────

const tools = [
  {
    name: 'read_file',
    description: 'Read a source file from the repository',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from repo root (e.g. program-sync/assets/js/store.js)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write a fix to a source file. Only call this for the specific issue being fixed — do not refactor surrounding code.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Relative path from repo root',
        },
        content: {
          type: 'string',
          description: 'Complete new file content',
        },
        reason: {
          type: 'string',
          description: 'One sentence: what was wrong and what was changed',
        },
      },
      required: ['path', 'content', 'reason'],
    },
  },
  {
    name: 'list_files',
    description: 'List files in a directory',
    input_schema: {
      type: 'object',
      properties: {
        dir: {
          type: 'string',
          description: 'Relative directory path from repo root',
        },
      },
      required: ['dir'],
    },
  },
  {
    name: 'finish',
    description: 'Signal completion. Call this when all fixable issues have been addressed (or there are none to fix).',
    input_schema: {
      type: 'object',
      properties: {
        fixed: {
          type: 'array',
          description: 'List of issues that were fixed',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              fix:   { type: 'string' },
              file:  { type: 'string' },
            },
            required: ['issue', 'fix', 'file'],
          },
        },
        skipped: {
          type: 'array',
          description: 'Issues that were skipped and why',
          items: {
            type: 'object',
            properties: {
              issue:  { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['issue', 'reason'],
          },
        },
      },
      required: ['fixed', 'skipped'],
    },
  },
];

// ── Tool execution ─────────────────────────────────────────────

const writtenFiles = [];

function executeTool(name, input) {
  if (name === 'read_file') {
    const abs = path.join(REPO_ROOT, input.path);
    if (!abs.startsWith(REPO_ROOT)) {
      return { error: 'Path traversal denied' };
    }
    try {
      return { content: fs.readFileSync(abs, 'utf-8') };
    } catch (e) {
      return { error: e.message };
    }
  }

  if (name === 'write_file') {
    if (!WRITABLE_PATHS.has(input.path)) {
      return { error: `Write denied: '${input.path}' is not in the allowed write list` };
    }
    const abs = path.join(REPO_ROOT, input.path);
    if (!abs.startsWith(REPO_ROOT)) {
      return { error: 'Path traversal denied' };
    }
    try {
      fs.writeFileSync(abs, input.content, 'utf-8');
      writtenFiles.push({ path: input.path, reason: input.reason });
      process.stderr.write(`[fix-agent] wrote: ${input.path} — ${input.reason}\n`);
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  }

  if (name === 'list_files') {
    const abs = path.join(REPO_ROOT, input.dir);
    if (!abs.startsWith(REPO_ROOT)) {
      return { error: 'Path traversal denied' };
    }
    try {
      const entries = fs.readdirSync(abs);
      return { files: entries };
    } catch (e) {
      return { error: e.message };
    }
  }

  if (name === 'finish') {
    return { acknowledged: true };
  }

  return { error: `Unknown tool: ${name}` };
}

// ── GitHub Actions output helper ───────────────────────────────

function setOutput(key, value) {
  const ghOutput = process.env.GITHUB_OUTPUT;
  if (ghOutput) {
    fs.appendFileSync(ghOutput, `${key}=${value}\n`);
  } else {
    process.stderr.write(`[fix-agent] output: ${key}=${value}\n`);
  }
}

// ── Main agent loop ────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    process.stderr.write('[fix-agent] ANTHROPIC_API_KEY not set — skipping\n');
    setOutput('has_fixes', 'false');
    process.exit(0);
  }

  const report = JSON.parse(fs.readFileSync(HEALTH_REPORT_PATH, 'utf-8'));
  const { issues } = report;

  const actionableIssues = issues.filter(i => i.severity === 'error' || i.severity === 'warning');

  if (actionableIssues.length === 0) {
    process.stderr.write('[fix-agent] No issues found — nothing to fix\n');
    setOutput('has_fixes', 'false');

    fs.writeFileSync(
      path.join(__dirname, 'fix-summary.md'),
      `## Health Check: All Clear\n\nGenerated: ${new Date().toISOString()}\n\nAll ${report.summary.passed} checks passed. No fixes needed.\n`,
    );
    process.exit(0);
  }

  process.stderr.write(`[fix-agent] Found ${actionableIssues.length} issues — starting Claude agent\n`);

  const client = new Anthropic();

  const systemPrompt = `You are a code maintenance agent for the PgM Weekly Report system (Node.js + Express backend, Vanilla JS frontend).

Your job: for each issue in the health check report, read the relevant file and apply a minimal, targeted fix.

Rules:
- Read the file first before writing
- Only fix the specific issue — do not refactor, rename, or add features
- Do not change indentation or formatting of untouched lines
- If an issue is ambiguous or risky to auto-fix, add it to skipped with a clear reason
- When all fixable issues are handled, call finish()

Allowed files to write: ${[...WRITABLE_PATHS].join(', ')}`;

  const userMessage = `Health check report (${new Date(report.generatedAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })} Taipei time):

Base URL: ${report.baseUrl}
Passed: ${report.summary.passed} / Total: ${report.summary.total}

Issues to fix:
${actionableIssues.map((i, n) => `${n + 1}. [${i.severity.toUpperCase()}] ${i.check}\n   ${i.detail}`).join('\n\n')}

Please read the relevant files and apply fixes for each issue you can safely resolve. Call finish() when done.`;

  const messages = [{ role: 'user', content: userMessage }];

  let finishPayload = null;
  let iterations = 0;
  const MAX_ITERATIONS = 20;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: systemPrompt,
      tools,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      break;
    }

    if (response.stop_reason !== 'tool_use') {
      break;
    }

    const toolUses = response.content.filter(b => b.type === 'tool_use');
    const toolResults = [];

    for (const toolUse of toolUses) {
      const result = executeTool(toolUse.name, toolUse.input);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });

      if (toolUse.name === 'finish') {
        finishPayload = toolUse.input;
      }
    }

    messages.push({ role: 'user', content: toolResults });

    if (finishPayload) break;
  }

  // ── Write fix-summary.md ──────────────────────────────────────

  const fixed   = finishPayload?.fixed   || writtenFiles.map(f => ({ file: f.path, fix: f.reason, issue: f.path }));
  const skipped = finishPayload?.skipped || [];
  const hasFixes = fixed.length > 0;

  const summaryLines = [
    '## Weekly Health Check — Fix Summary',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Base URL:** ${report.baseUrl}`,
    '',
    `### Health Check Results`,
    `- ✅ Passed: ${report.summary.passed}`,
    `- ❌ Errors: ${report.summary.errors}`,
    `- ⚠️ Warnings: ${report.summary.warnings}`,
    '',
  ];

  if (fixed.length > 0) {
    summaryLines.push('### Fixes Applied', '');
    fixed.forEach(f => {
      summaryLines.push(`- **${f.file}**: ${f.fix}`);
      if (f.issue && f.issue !== f.file) summaryLines.push(`  > Issue: ${f.issue}`);
    });
    summaryLines.push('');
  }

  if (skipped.length > 0) {
    summaryLines.push('### Skipped (Manual Review Required)', '');
    skipped.forEach(s => {
      summaryLines.push(`- **${s.issue}**: ${s.reason}`);
    });
    summaryLines.push('');
  }

  summaryLines.push(
    '### All Issues',
    '',
    ...actionableIssues.map(i => `- [${i.severity}] **${i.check}**: ${i.detail}`),
    '',
    '---',
    '_Auto-generated by pgm-health-agent_',
  );

  fs.writeFileSync(path.join(__dirname, 'fix-summary.md'), summaryLines.join('\n'));

  setOutput('has_fixes', hasFixes ? 'true' : 'false');
  setOutput('summary', fixed.map(f => `${f.file}: ${f.fix}`).join(' | ') || 'no fixes');

  process.stderr.write(`[fix-agent] done — ${fixed.length} fix(es), ${skipped.length} skipped\n`);
  process.exit(0);
}

main().catch(e => {
  const isBilling = e.message?.includes('credit balance') || e.message?.includes('billing') || e.status === 402;
  if (isBilling) {
    process.stderr.write(`[fix-agent] Skipped: Anthropic API credit balance too low. Add credits at console.anthropic.com/billing\n`);
    setOutput('has_fixes', 'false');
    process.exit(0); // not a workflow failure — just skipped
  }
  process.stderr.write(`[fix-agent] Fatal: ${e.message}\n${e.stack}\n`);
  setOutput('has_fixes', 'false');
  process.exit(2);
});
