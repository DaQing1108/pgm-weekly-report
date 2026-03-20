const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Reports directory: env var → backend/reports/ → fallback to parent dir (dev)
const REPORTS_DIR = process.env.REPORTS_DIR
  || path.join(__dirname, '../reports');

// Serve built React frontend in production
const FRONTEND_BUILD = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(FRONTEND_BUILD)) {
  app.use(express.static(FRONTEND_BUILD));
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PgM Weekly Report API is running' });
});

app.get('/api/reports', (req, res) => {
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith('.md') && !f.includes('_v7'))
    .map(f => {
      const content = fs.readFileSync(path.join(REPORTS_DIR, f), 'utf-8');
      const versionMatch = f.match(/v(\d+)/);
      const dateMatch = content.match(/報告日期[：:]\s*([\d/]+)/);
      const periodMatch = content.match(/報告週期[：:]\s*([^\n]+)/);
      return {
        filename: f,
        version: versionMatch ? `v${versionMatch[1]}` : f,
        date: dateMatch ? dateMatch[1] : '',
        period: periodMatch ? periodMatch[1].trim() : '',
        content
      };
    })
    .sort((a, b) => b.version.localeCompare(a.version));
  res.json({ reports: files });
});

app.get('/api/reports/:filename', (req, res) => {
  const filePath = path.join(REPORTS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '找不到檔案' });
  const content = fs.readFileSync(filePath, 'utf-8');
  res.json({ content });
});

// 下載 .md 檔案
app.get('/api/reports/:filename/download', (req, res) => {
  const filePath = path.join(REPORTS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: '找不到檔案' });
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.sendFile(filePath);
});

// /read — 純 HTML 靜態頁面，供 NotebookLM / 爬蟲使用
app.get('/read', (req, res) => {
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith('.md') && !f.includes('_v7'))
    .sort()
    .reverse();

  const sections = files.map(f => {
    const raw = fs.readFileSync(path.join(REPORTS_DIR, f), 'utf-8');
    // 移除 markdown 符號，保留純文字
    const text = raw
      .replace(/```[\s\S]*?```/g, '')   // 移除 code block
      .replace(/#{1,6}\s/g, '')          // 移除標題 #
      .replace(/\*\*(.+?)\*\*/g, '$1')  // 移除粗體
      .replace(/\*(.+?)\*/g, '$1')      // 移除斜體
      .replace(/`(.+?)`/g, '$1')        // 移除 inline code
      .replace(/\|.+\|/g, '')           // 移除表格
      .replace(/[-*]\s/g, '')           // 移除列表符號
      .trim();
    return `<section><h2>${f.replace('.md','')}</h2><pre>${text}</pre></section>`;
  }).join('<hr>');

  res.send(`<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="UTF-8"><title>PgM Weekly Reports</title></head>
<body>
<h1>VIA Technologies — PgM Program Sync 週報彙整</h1>
${sections}
</body>
</html>`);
});

// Fallback: serve React app for all non-API routes (production)
if (fs.existsSync(FRONTEND_BUILD)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
