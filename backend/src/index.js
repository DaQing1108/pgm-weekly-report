const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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
// 若環境變數 ADMIN_TOKEN 未設定 → 跳過驗證（向下相容 / 開發環境）
// Railway 部署時於 Variables 設定 ADMIN_TOKEN=<隨機字串> 即可啟用
function requireAdminToken(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return next(); // 未設定 → 開放
  const provided = req.headers['x-admin-token'];
  if (!provided || provided !== expected) {
    return res.status(401).json({ error: '需要管理員 Token', code: 'UNAUTHORIZED' });
  }
  next();
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

// ── Per-week state archive (persistent via git) ───────────────
const WEEKS_DIR = path.join(__dirname, '../data/weeks');
if (!fs.existsSync(WEEKS_DIR)) fs.mkdirSync(WEEKS_DIR, { recursive: true });

app.get('/api/weeks', (req, res) => {
  try {
    const files = fs.readdirSync(WEEKS_DIR).filter(f => f.endsWith('.json'));
    const weeks = files.map(f => {
      const weekLabel = f.replace('.json', '');
      try {
        const data = JSON.parse(fs.readFileSync(path.join(WEEKS_DIR, f), 'utf8'));
        const snap = (data.snapshots || []).find(s => s.weekLabel === weekLabel)
                   || (data.snapshots || []).slice(-1)[0] || {};
        return {
          weekLabel,
          weekStart:    snap.weekStart    || data.weekStart || '',
          projectCount: (data.projects    || []).length,
          onTrackPct:   snap.onTrackPct   || 0,
          atRiskCount:  snap.atRiskCount  || 0,
          savedAt:      data._savedAt     || ''
        };
      } catch {
        return { weekLabel, weekStart: '', projectCount: 0, onTrackPct: 0, atRiskCount: 0, savedAt: '' };
      }
    }).sort((a, b) => b.weekLabel.localeCompare(a.weekLabel));
    res.json(weeks);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/weeks/:weekLabel', (req, res) => {
  const safe = req.params.weekLabel.replace(/[^a-zA-Z0-9\-]/g, '');
  const file = path.join(WEEKS_DIR, `${safe}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Week not found' });
  try { res.json(JSON.parse(fs.readFileSync(file, 'utf8'))); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/weeks/:weekLabel', requireAdminToken, (req, res) => {
  const safe = req.params.weekLabel.replace(/[^a-zA-Z0-9\-]/g, '');
  const file = path.join(WEEKS_DIR, `${safe}.json`);
  try {
    fs.writeFileSync(file, JSON.stringify({ ...req.body, _savedAt: new Date().toISOString() }, null, 2), 'utf8');
    res.json({ success: true, weekLabel: safe });
  } catch (e) { res.status(500).json({ error: e.message }); }
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
        return `<section><h2>${f.replace('.md', '')}</h2><pre>${text}</pre></section>`;
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
    res.status(500).send(`<p>讀取失敗：${err.message}</p>`);
  }
});

// ── Fallback: serve program-sync SPA ─────────────────────────
if (fs.existsSync(PROGRAM_SYNC)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(PROGRAM_SYNC, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
