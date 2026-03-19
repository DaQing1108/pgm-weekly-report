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

// Fallback: serve React app for all non-API routes (production)
if (fs.existsSync(FRONTEND_BUILD)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
