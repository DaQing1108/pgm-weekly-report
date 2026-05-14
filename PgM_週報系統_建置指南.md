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
8. [資料品質工具](#8-資料品質工具)
9. [版本歷程](#9-版本歷程)

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

### 方式一：使用 new-week.py 自動生成（建議）

```bash
# Step 1：從上週自動生成新週 JSON（攜帶未完成專案與任務）
python3 scripts/new-week.py W21

# Step 2：編輯 backend/data/weeks/W21.json
#   - 更新各專案 progress、description
#   - 新增本週 Action Items
#   - 修改已解決的 risks
#   - 加入本週 snapshot 資料

# Step 3：驗證資料（可加 --fix 自動修正常見問題）
python3 scripts/validate-week.py W21

# Step 4：commit & push（pre-push hook 會自動再驗證一次）
git add backend/data/weeks/W21.json
git commit -m "data: add W21 weekly snapshot"
git push
```

### 方式二：手動建立 JSON

直接複製前一週 JSON 並修改，完成後務必執行驗證：

```bash
cp backend/data/weeks/W20.json backend/data/weeks/W21.json
# 編輯 W21.json...
python3 scripts/validate-week.py W21 --fix
git add backend/data/weeks/W21.json
git commit -m "data: add W21 weekly snapshot"
git push
```

> push 後 Railway 自動偵測並重新部署（約 2 分鐘）。

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

---

## 8. 資料品質工具

所有工具位於 `scripts/` 目錄，使用 Python 3.8+，無需安裝額外套件。

### validate-week.py — JSON 資料驗證器

檢查項目：
- `_savedAt`、`weekLabel`、`weekStart` 根欄位是否存在
- `_dataVersion` 整數版本號是否存在
- 所有專案 `status` 是否為合法值（`on-track` / `at-risk` / `behind` / `completed`）
- 所有專案是否有 `progress` 欄位
- `progress=100%` 的專案是否已標記 `completed`
- 所有 action items 是否有 `category`（`technical` / `business` / `resource`）
- `snapshots` 陣列中對應週次的 `onTrackPct`、`atRiskCount`、`behindCount` 是否與實際專案數一致

```bash
# 驗證單週
python3 scripts/validate-week.py W20

# 驗證所有週
python3 scripts/validate-week.py --all

# 自動修正安全問題（加 _savedAt、補 category、修 snapshot 數值等）
python3 scripts/validate-week.py --all --fix
```

**Exit code：** 0 = 全部通過，1 = 有錯誤（會封鎖 pre-push）

---

### new-week.py — 新週生成工具

從前一週 JSON 自動生成新週骨架：
- 攜帶所有 `status != "completed"` 的專案
- 攜帶 `status != "done"` 的 action items（重置為 `pending`）
- 攜帶未解決的 risks
- 複製 `snapshots` 歷史陣列
- 自動設定 `weekStart`、`weekLabel`、`_savedAt`、`_dataVersion`

```bash
python3 scripts/new-week.py W21              # 自動以 W20 為來源
python3 scripts/new-week.py W21 --from W19  # 指定來源週
```

生成後仍需手動：更新各專案進度、新增本週任務與 risks、加入 snapshot。

---

### install-hooks.sh — Git Pre-Push Hook 安裝

安裝後，每次 `git push` 前會自動執行 `validate-week.py --all`，有錯誤則封鎖推送。

```bash
bash scripts/install-hooks.sh
```

> 只需執行一次。Hook 安裝在 `.git/hooks/pre-push`，不會 commit 進 repo。

---

### _dataVersion 版本同步機制

每個週次 JSON 含有整數欄位 `_dataVersion`（值等於週次數字，如 W20 = 20）。

瀏覽器 localStorage 會記錄已讀取的版本號（`pgm_dataVersion_W##`）。初始化時：
- `serverVersion > localVersion` → **後端版本較新**，接受後端資料（git patch 優先）
- `serverVersion <= localVersion` → 維持時間戳比較邏輯（保留使用者本機編輯）

當需要強制讓所有瀏覽器接受後端修正時，在 JSON 中手動遞增 `_dataVersion`。

---

## 9. 版本歷程

| 版本 | 日期 | 說明 |
|------|------|------|
| v1.0 | 2026/03 | 初始 React + Vite 架構，`.md` 週報 |
| v2.0 | 2026/03 | Program Sync Dashboard（program-sync/）取代 React 前端 |
| v3.0 | 2026/04 | 歷史週次瀏覽、localStorage ↔ 後端同步 |
| v3.5 | 2026/04 | 歷史唯讀模式修正（防止誤寫歷史 JSON） |
| v3.9 | 2026/04 | Resources 跨季資料隔離 |
| v3.19 | 2026/05/07 | Tracker 當週高亮修正 |
| v3.20 | 2026/05/08 | Dashboard 週次 Tab 修正 |
| **v3.21** | **2026/05/14** | **P0/P1/P2 改善計劃** |
| | | W09–W15 資料補完（_savedAt、weekLabel、completed 狀態） |
| | | W11–W14 progress=100% 專案標記為 completed |
| | | W09–W20 新增 `_dataVersion` 整數版本號 |
| | | app-init.js：version-based sync（git patch 優先邏輯） |
| | | P3 擴充：空 snapshots 也從後端補入 |
| | | 新工具：`scripts/validate-week.py` |
| | | 新工具：`scripts/new-week.py` |
| | | 新工具：`scripts/install-hooks.sh`（pre-push 驗證） |

---

*建置人：Alex Liao／2026/03/19，最後更新：2026/05/14*
