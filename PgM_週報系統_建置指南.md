# PgM 週報系統 — 建置指南

```
專案名稱：VIA Technologies PgM Weekly Report System
建置日期：2026/03/19
技術棧：React + Vite（前端）／ Node.js + Express（後端）
部署平台：Railway
公開網址：https://pgm-weekly-report-production.up.railway.app
GitHub：https://github.com/DaQing1108/pgm-weekly-report
```

---

## 目錄

1. [系統架構](#1-系統架構)
2. [本地開發環境建置](#2-本地開發環境建置)
3. [專案結構說明](#3-專案結構說明)
4. [GitHub 推送](#4-github-推送)
5. [Railway 部署](#5-railway-部署)
6. [新增週報流程](#6-新增週報流程)
7. [常見問題排解](#7-常見問題排解)

---

## 1. 系統架構

```
┌─────────────────────────────────────┐
│           使用者瀏覽器               │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│     Railway（單一服務）              │
│                                     │
│  Express Server (port 3001)         │
│  ├── GET /api/health                │
│  ├── GET /api/reports   ←── 讀取    │
│  │                          .md檔   │
│  └── /*  → 提供 React 靜態檔案      │
│                                     │
│  backend/reports/*.md（週報來源）    │
│  frontend/dist/（React 打包產出）    │
└─────────────────────────────────────┘
```

**設計原則：前後端合併為單一服務**
- Express 同時提供 API 與 React 靜態檔案
- Railway 只需一個服務（省免費額度）
- 新增週報只需 push .md 檔，無需改程式碼

---

## 2. 本地開發環境建置

### 前置需求

```bash
node --version   # 需要 v18 以上
npm --version    # 需要 v9 以上
```

### Step 1：建立目錄結構

```bash
mkdir -p pgm-weekly-report/backend/src
mkdir -p pgm-weekly-report/backend/reports
mkdir -p pgm-weekly-report/frontend/src
cd pgm-weekly-report
```

### Step 2：建立 Backend

**`backend/package.json`**
```json
{
  "name": "pgm-weekly-report-backend",
  "version": "1.0.0",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "build": "cd ../frontend && npm install && npm run build"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

**`backend/src/index.js`**
```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const REPORTS_DIR = process.env.REPORTS_DIR
  || path.join(__dirname, '../reports');

// 生產環境：提供 React 靜態檔案
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
    .filter(f => f.endsWith('.md'))
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

// SPA fallback（生產環境）
if (fs.existsSync(FRONTEND_BUILD)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

### Step 3：建立 Frontend

**`frontend/package.json`**
```json
{
  "name": "pgm-weekly-report-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "marked": "^17.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8"
  }
}
```

**`frontend/vite.config.js`**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'  // 開發時 proxy 到 backend
    }
  }
})
```

**`frontend/index.html`**
```html
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <title>PgM Weekly Report</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**`frontend/src/main.jsx`**
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
```

> `frontend/src/App.jsx` 內容見 GitHub repo，包含側欄版本切換、Markdown 渲染、API 串接等完整邏輯。

### Step 4：安裝套件並啟動

```bash
# 安裝後端套件
cd backend && npm install && cd ..

# 安裝前端套件
cd frontend && npm install && cd ..
```

**啟動開發伺服器：**

```bash
# Terminal 1：啟動 backend（port 3001）
cd backend && npm run dev

# Terminal 2：啟動 frontend（port 5173）
cd frontend && npm run dev
```

瀏覽器開啟 `http://localhost:5173` 即可預覽。

### Step 5：設定 .claude/launch.json（Claude Code 快速啟動）

建立 `.claude/launch.json`：
```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "Backend (Express API)",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 3001,
      "cwd": "backend"
    },
    {
      "name": "Frontend (React + Vite)",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "port": 5173,
      "cwd": "frontend"
    }
  ]
}
```

---

## 3. 專案結構說明

```
pgm-weekly-report/
├── .claude/
│   └── launch.json          # Claude Code dev server 設定
├── .gitignore
├── Dockerfile               # Railway 部署用
├── railway.json             # Railway 設定
├── backend/
│   ├── package.json
│   ├── reports/             # ← 週報 .md 檔放這裡
│   │   ├── MediaAgent_週報_v6.md
│   │   └── MediaAgent_週報_v8.md
│   └── src/
│       └── index.js         # Express server
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        └── App.jsx          # 主要 UI 元件
```

**重點：週報 `.md` 檔一律放在 `backend/reports/`**
- 命名格式：`任意名稱_vN.md`（含 `v數字` 即可被識別版本號）
- 內文需包含 `報告週期：YYYY/MM/DD – YYYY/MM/DD` 供側欄顯示

---

## 4. GitHub 推送

### 初次設定

```bash
cd pgm-weekly-report
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的帳號/pgm-weekly-report.git
git push -u origin main
```

### 後續更新

```bash
git add .
git commit -m "add v9 weekly report"
git push
```

push 後 Railway 自動偵測並重新部署（約 2 分鐘）。

---

## 5. Railway 部署

### 初次部署

1. 前往 [railway.app](https://railway.app) → **New Project**
2. 選擇 **Deploy from GitHub repo**
3. 選擇 `pgm-weekly-report` repo
4. Railway 自動讀取 `railway.json` 開始 build
5. Build 完成後：**Settings → Networking → Generate Domain**

### Dockerfile 說明

Railway 使用此 `Dockerfile` 進行 build：

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# Setup backend（production deps only）
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev
COPY backend/ ./backend/

EXPOSE 3001
CMD ["node", "backend/src/index.js"]
```

### railway.json 說明

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

---

## 6. 新增週報流程

每次有新週報，只需 3 個步驟：

```bash
# Step 1：將新週報 .md 複製至 backend/reports/
cp /path/to/新週報_v9.md backend/reports/

# Step 2：commit
git add backend/reports/
git commit -m "add v9 weekly report (2026/03/23~03/27)"

# Step 3：push（Railway 自動部署）
git push
```

約 2 分鐘後，新週報即出現在網站側欄。

---

## 7. 常見問題排解

### Q：Railway build 失敗，`npm: command not found`
**A：** 確認 `railway.json` 的 builder 設為 `DOCKERFILE`，不要使用 `NIXPACKS` 加 `buildCommand`。

### Q：前端無法連到 API（本地開發）
**A：** 確認 backend 已在 port 3001 啟動，`vite.config.js` 中的 proxy 設定正確。

### Q：新增的週報沒有出現
**A：** 確認：
1. 檔名包含 `_vN`（如 `_v9`）
2. 檔案放在 `backend/reports/`，不是根目錄
3. `git push` 後等待約 2 分鐘重新部署

### Q：側欄日期顯示為空
**A：** 確認 `.md` 檔內文包含這行（冒號後有空格）：
```
報告週期：2026/03/23 – 2026/03/27
```

### Q：想隱藏某個版本不顯示
**A：** 在 `backend/src/index.js` 的 filter 加入版本號：
```javascript
.filter(f => f.endsWith('.md') && !f.includes('_v7'))
```

---

*建置人：Alex Liao／2026/03/19*
