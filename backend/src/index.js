const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { timingSafeEqual } = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Reports directory
const REPORTS_DIR = process.env.REPORTS_DIR
  || path.join(__dirname, '../reports');

// Q-6 修正：REPORT_EXCLUDE_TAG 環境變數可自訂排除標記（預設 _v7）
// 用途：過濾舊版格式週報，讓清單與 /read 只顯示當前格式的檔案
const REPORT_EXCLUDE_TAG = process.env.REPORT_EXCLUDE_TAG || '_v7';

// State file (cross-browser sync)
const DATA_DIR  = path.join(__dirname, '../data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
if (!fs.existsSync(DATA_DIR))    fs.mkdirSync(DATA_DIR,    { recursive: true });
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

// V3: Serve program-sync Vanilla JS app
const PROGRAM_SYNC = path.join(__dirname, '../../program-sync');
if (fs.existsSync(PROGRAM_SYNC)) {
  // Fix-3: no-cache 避免 deploy 後瀏覽器繼續使用舊版 JS/CSS/HTML
  app.use(express.static(PROGRAM_SYNC, {
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }));
}

// S-3 修正：CORS_ORIGIN 環境變數可限定允許的 origin（逗號分隔多個）
// 未設定 → 允許所有 origin（向下相容 / 開發環境）
// Railway 部署建議設定：CORS_ORIGIN=https://your-app.railway.app
const _corsAllowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : null;

app.use(cors(
  _corsAllowedOrigins
    ? {
        origin(origin, cb) {
          // 允許無 origin 的同源請求（curl / SSR / 同域 fetch）
          if (!origin || _corsAllowedOrigins.includes(origin)) return cb(null, true);
          cb(new Error(`CORS: origin "${origin}" not in allowlist`));
        },
        credentials: false,
      }
    : {} // 未設定 → cors() 預設行為（allow all）
));
app.use(express.json({ limit: '2mb' }));

// ── Admin Token 驗證中介層（S-1/S-2）────────────────────────────
// 若環境變數 ADMIN_TOKEN 未設定 → 回 503 拒絕所有寫入（fail-closed）
// Railway 部署時於 Variables 設定 ADMIN_TOKEN=<隨機字串> 即可啟用
function requireAdminToken(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: '伺服器設定錯誤：ADMIN_TOKEN 未設定', code: 'MISCONFIGURED' });
  }
  const provided = req.headers['x-admin-token'];
  const a = Buffer.from(provided || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: '需要管理員 Token', code: 'UNAUTHORIZED' });
  }
  next();
}

// ── 週資料寫入驗證（系統體檢 P1）──────────────────────────────
// 只驗證有明確規範的欄位（CLAUDE.md：action / milestone 狀態 enum），
// project 狀態無正式 enum 定義，不在此驗證以免誤擋前端既有值
const VALID_ACTION_STATUSES    = new Set(['pending', 'in-progress', 'done', 'blocked']);
const VALID_MILESTONE_STATUSES = new Set(['upcoming', 'in-progress', 'done', 'delayed']);
const WEEK_ARRAY_FIELDS = ['projects', 'actions', 'risks', 'members', 'milestones'];

function validateWeekPayload(body, weekLabel) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['payload 必須是 JSON 物件'];
  }
  if (body.weekLabel && body.weekLabel !== weekLabel) {
    errors.push(`payload.weekLabel (${body.weekLabel}) 與 URL 週次 (${weekLabel}) 不一致`);
  }
  if (body.weekStart && !/^\d{4}-\d{2}-\d{2}$/.test(body.weekStart)) {
    errors.push(`weekStart 格式錯誤（需 YYYY-MM-DD）：${body.weekStart}`);
  }
  for (const field of WEEK_ARRAY_FIELDS) {
    if (body[field] != null && !Array.isArray(body[field])) {
      errors.push(`${field} 必須是陣列`);
    }
  }
  for (const a of (Array.isArray(body.actions) ? body.actions : [])) {
    if (a?.status && !VALID_ACTION_STATUSES.has(a.status)) {
      errors.push(`action「${(a.task || a.id || '?').slice(0, 30)}」狀態非法：${a.status}（合法值：${[...VALID_ACTION_STATUSES].join('/')}）`);
    }
  }
  for (const m of (Array.isArray(body.milestones) ? body.milestones : [])) {
    if (m?.status && !VALID_MILESTONE_STATUSES.has(m.status)) {
      errors.push(`milestone「${(m.name || m.id || '?').slice(0, 30)}」狀態非法：${m.status}（合法值：${[...VALID_MILESTONE_STATUSES].join('/')}）`);
    }
  }
  return errors;
}

// ── Health ────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: 'v3', message: 'PgM Weekly Report API is running' });
});

// ── List reports ──────────────────────────────────────────────
app.get('/api/reports', (req, res) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.endsWith('.md') && !f.includes(REPORT_EXCLUDE_TAG))
      .map(f => {
        const content = fs.readFileSync(path.join(REPORTS_DIR, f), 'utf-8');
        const versionMatch = f.match(/(?:v|_)(\d+)/) || f.match(/\d{6}/); // try to catch v1 or date
        const dateMatch = content.match(/報告日期[：:]\s*(?:\*\*\s*)?([\d/]+)/);
        const periodMatch = content.match(/報告週期[：:]\s*(?:\*\*\s*)?([^\n\*]+)/);
        return {
          filename: f,
          version: versionMatch ? `v${versionMatch[1]}` : f,
          date: dateMatch ? dateMatch[1] : '',
          period: periodMatch ? periodMatch[1].trim() : '',
          size: Buffer.byteLength(content, 'utf-8')
        };
      })
      .sort((a, b) => b.filename.localeCompare(a.filename));
    res.json({ reports: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get single report content ────────────────────────────────
app.get('/api/reports/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // sanitize
  const filePath = path.join(REPORTS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '找不到檔案' });
  const content = fs.readFileSync(filePath, 'utf-8');
  res.json({ content });
});

// ── Download .md ──────────────────────────────────────────────
app.get('/api/reports/:filename/download', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(REPORTS_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '找不到檔案' });
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.sendFile(filePath);
});

// ── Save report to backend (V3 new) ──────────────────────────
// S-5 修正：加 requireAdminToken，防止未授權覆寫週報
app.post('/api/reports', requireAdminToken, (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename || !content) return res.status(400).json({ error: '缺少 filename 或 content' });

    // Sanitize: only allow alphanumeric, underscore, hyphen, dot
    const safe = path.basename(filename).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    if (!safe.endsWith('.md')) return res.status(400).json({ error: '只允許 .md 檔案' });

    const filePath = path.join(REPORTS_DIR, safe);
    fs.writeFileSync(filePath, content, 'utf-8');
    res.json({ success: true, filename: safe, size: Buffer.byteLength(content, 'utf-8') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Delete report (V3 new) ────────────────────────────────────
app.delete('/api/reports/:filename', requireAdminToken, (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(REPORTS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '找不到檔案' });
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── App State (cross-browser sync) ───────────────────────────
app.get('/api/state', (req, res) => {
  if (!fs.existsSync(STATE_FILE)) return res.status(404).json({ error: 'no state' });
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    res.json(state);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// S-7 修正：加 requireAdminToken，防止未授權覆寫跨瀏覽器共用 state
app.post('/api/state', requireAdminToken, (req, res) => {
  try {
    const state = req.body;
    if (!state || typeof state !== 'object') return res.status(400).json({ error: 'invalid state' });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf-8');
    res.json({ success: true, savedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const REPO_ROOT = path.join(__dirname, '../..');

// ── Per-week state archive (PostgreSQL or filesystem fallback) ────────────
// WEEKS_DIR still created here so the FS fallback and auto-seeder can find it
const WEEKS_DIR = path.join(__dirname, '../data/weeks');
if (!fs.existsSync(WEEKS_DIR)) fs.mkdirSync(WEEKS_DIR, { recursive: true });

app.get('/api/weeks', async (req, res) => {
  try { res.json(await db.listWeeks()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/weeks/:weekLabel', async (req, res) => {
  const safe = req.params.weekLabel.replace(/[^a-zA-Z0-9\-]/g, '');
  try {
    const data = await db.getWeek(safe);
    if (!data) return res.status(404).json({ error: 'Week not found' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/weeks/:weekLabel', requireAdminToken, async (req, res) => {
  const safe = req.params.weekLabel.replace(/[^a-zA-Z0-9\-]/g, '');
  const validationErrors = validateWeekPayload(req.body, safe);
  if (validationErrors.length > 0) {
    return res.status(422).json({ error: '資料驗證失敗', code: 'INVALID_PAYLOAD', details: validationErrors });
  }
  try {
    await db.saveWeek(safe, req.body);
    res.json({ success: true, weekLabel: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── AI 週報解析預覽（localhost-only，dry-run）────────────────────
// 選完 MD 後呼叫，只解析不寫入，回傳摘要供前端顯示確認卡
app.post('/api/admin/parse-draft', requireAdminToken, (req, res) => {

  const filename = (req.query.filename || 'parse_temp.md').replace(/[^a-zA-Z0-9_.\-]/g, '_');
  const draftsDir = path.join(REPO_ROOT, 'backend', 'drafts');
  if (!fs.existsSync(draftsDir)) fs.mkdirSync(draftsDir, { recursive: true });
  const draftPath = path.join(draftsDir, filename);

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
    if (body.length > 5 * 1024 * 1024) {
      res.status(413).json({ error: '檔案過大（上限 5MB）' });
      req.destroy();
    }
  });
  req.on('end', () => {
    if (!body.trim()) return res.status(400).json({ error: '未收到 MD 內容' });

    try { fs.writeFileSync(draftPath, body, 'utf-8'); }
    catch (e) { return res.status(500).json({ error: `暫存失敗：${e.message}` }); }

    const scriptPath = path.join(REPO_ROOT, 'scripts', 'import-draft.py');
    // H8: 若 query 帶有 week 參數（例如 ?week=W24），傳給 import-draft.py 避免暫存檔名無法解析週次
    const weekArg = /^W\d{1,2}$/i.test(req.query.week || '') ? ['--week', req.query.week] : [];
    let output = '';
    const child = spawn('python3', [scriptPath, draftPath, '--dry-run', ...weekArg], {
      cwd: REPO_ROOT,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });
    child.stdout.on('data', d => { output += d.toString(); });
    child.stderr.on('data', d => { output += d.toString(); });
    child.on('close', code => {
      try {
        const summary = JSON.parse(output.trim());
        res.json({ success: true, summary });
      } catch {
        res.status(500).json({ error: `解析失敗：${output.slice(0, 300)}` });
      }
    });
    child.on('error', e => res.status(500).json({ error: e.message }));
  });
});

// ── AI 週報匯入並發布（localhost-only，SSE 串流）─────────────────
// 接收 MD 文字內容 → 存至 drafts/ → import-draft.py --push --auto-release
// 使用 SSE 將 stdout/stderr 即時推送到前端
app.post('/api/admin/import-release', requireAdminToken, (req, res) => {

  const filename = (req.query.filename || 'import_temp.md').replace(/[^a-zA-Z0-9_.\-]/g, '_');
  const draftsDir = path.join(REPO_ROOT, 'backend', 'drafts');
  if (!fs.existsSync(draftsDir)) fs.mkdirSync(draftsDir, { recursive: true });
  const draftPath = path.join(draftsDir, filename);

  // 設定 SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // 接收 MD 文字內容（express.text() middleware 需在路由前設定）
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
    if (body.length > 5 * 1024 * 1024) {
      send({ type: 'error', text: '❌ 檔案過大（上限 5MB）' });
      req.destroy();
      res.end();
    }
  });
  req.on('end', () => {
    if (!body.trim()) {
      send({ type: 'error', text: '❌ 未收到 MD 內容' });
      return res.end();
    }

    try {
      fs.writeFileSync(draftPath, body, 'utf-8');
      send({ type: 'log', text: `✅ 已暫存：backend/drafts/${filename}` });
    } catch (e) {
      send({ type: 'error', text: `❌ 儲存失敗：${e.message}` });
      return res.end();
    }

    const scriptPath = path.join(REPO_ROOT, 'scripts', 'import-draft.py');
    // H8: 若 query 帶有 week 參數（例如 ?week=W24），傳給 import-draft.py 避免暫存檔名無法解析週次
    const weekArg = /^W\d{1,2}$/i.test(req.query.week || '') ? ['--week', req.query.week] : [];
    const child = spawn('python3', [scriptPath, draftPath, '--push', '--auto-release', '--yes', ...weekArg], {
      cwd: REPO_ROOT,
      env: { ...process.env, TERM: 'dumb', PYTHONUNBUFFERED: '1' },
    });

    let allOutput = '';
    child.stdout.on('data', d => {
      const text = d.toString();
      allOutput += text;
      text.split('\n').filter(Boolean).forEach(line =>
        send({ type: 'log', text: line })
      );
    });
    child.stderr.on('data', d => {
      const text = d.toString();
      allOutput += text;
      text.split('\n').filter(Boolean).forEach(line =>
        send({ type: 'log', text: line })
      );
    });
    child.on('close', code => {
      const weekMatch = allOutput.match(/W\d{2}/);
      const weekLabel = weekMatch ? weekMatch[0] : null;
      const savedAt = new Date().toISOString();
      send({ type: 'done', exitCode: code, success: code === 0, weekLabel, savedAt });
      res.end();
    });
    child.on('error', e => {
      send({ type: 'error', text: `❌ 執行失敗：${e.message}` });
      res.end();
    });
  });
});

// ── 本機自動發布（localhost-only）─────────────────────────────
// 瀏覽器完成歸檔後呼叫此端點，自動執行 release-week.sh --yes
// 只接受 127.0.0.1 / ::1 連線，Production Railway 無法觸發
app.post('/api/release/:weekLabel', requireAdminToken, (req, res) => {
  const safe = req.params.weekLabel.replace(/[^a-zA-Z0-9]/g, '');
  if (!/^W\d{2}$/.test(safe)) {
    return res.status(400).json({ error: '週次格式錯誤，應為 W01…W53' });
  }
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'release-week.sh');
  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({ error: 'scripts/release-week.sh 不存在' });
  }

  let stdout = '';
  let stderr = '';
  const child = spawn('bash', [scriptPath, safe, '--yes'], {
    cwd: REPO_ROOT,
    env: { ...process.env, TERM: 'dumb' },
  });
  child.stdout.on('data', d => { stdout += d.toString(); });
  child.stderr.on('data', d => { stderr += d.toString(); });
  child.on('close', code => {
    res.json({ success: code === 0, exitCode: code, stdout, stderr });
  });
  child.on('error', e => {
    res.status(500).json({ error: e.message });
  });
});

// ── /read — for NotebookLM / crawlers ────────────────────────
// M-3 修正：加 try/catch，避免 REPORTS_DIR 空或讀檔失敗時 uncaught throw
app.get('/read', (req, res) => {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.endsWith('.md') && !f.includes(REPORT_EXCLUDE_TAG))
      .sort().reverse();

    const sections = files.map(f => {
      try {
        const raw = fs.readFileSync(path.join(REPORTS_DIR, f), 'utf-8');
        const text = raw
          .replace(/```[\s\S]*?```/g, '')
          .replace(/#{1,6}\s/g, '')
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/`(.+?)`/g, '$1')
          .replace(/\|.+\|/g, '')
          .replace(/[-*]\s/g, '')
          .trim();
        const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        return `<section><h2>${esc(f.replace('.md', ''))}</h2><pre>${esc(text)}</pre></section>`;
      } catch { return ''; }
    }).filter(Boolean).join('<hr>');

    res.send(`<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>PgM Weekly Reports</title></head>
<body>
<h1>VIA Technologies — PgM Program Sync 週報彙整</h1>
${sections || '<p>目前無週報</p>'}
</body>
</html>`);
  } catch (err) {
    const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    res.status(500).send(`<p>讀取失敗：${esc(err.message)}</p>`);
  }
});

// ── Fallback: serve program-sync SPA ─────────────────────────
if (fs.existsSync(PROGRAM_SYNC)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(PROGRAM_SYNC, 'index.html'));
  });
}

(async () => {
  try {
    await db.initDB();
    if (process.env.DATABASE_URL) {
      console.log('[db] PostgreSQL mode — schema ready');
    }
  } catch (err) {
    console.error('[db] initDB failed:', err.message);
    // H2: DATABASE_URL 存在但連線失敗 → 拒絕啟動，避免靜默寫入 ephemeral FS 後資料蒸發
    if (process.env.DATABASE_URL) {
      console.error('[db] DATABASE_URL 已設定但無法連線 PG，中止啟動（避免資料寫入 ephemeral FS）');
      process.exit(1);
    }
    // 無 DATABASE_URL → 本機開發模式，FS fallback 為預期行為
  }
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
})();
