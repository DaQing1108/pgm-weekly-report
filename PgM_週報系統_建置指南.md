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
9. [PostgreSQL 資料持久化](#9-postgresql-資料持久化)
10. [版本歷程](#10-版本歷程)

---

## 1. 系統架構

```
┌─────────────────────────────────────┐
│           使用者瀏覽器               │
└──────────────┬──────────────────────┘
               │ HTTPS
┌──────────────▼──────────────────────┐
│     Railway — 主服務                 │
│                                     │
│  Express Server (port 3001)         │
│  ├── GET  /api/health               │
│  ├── GET  /api/reports   ←── .md    │
│  ├── GET  /api/weeks/:label         │
│  ├── POST /api/weeks/:label  ──┐    │
│  └── /*  → Vanilla JS SPA      │    │
│                                │    │
│  backend/src/db.js             │    │
│  ├── DATABASE_URL 存在 → PG 模式│    │
│  └── 未設定 → 本機 JSON 檔案    │    │
└────────────────────────────────┼────┘
                                 │ Railway 內網
                 ┌───────────────▼──────────────┐
                 │  Railway — PostgreSQL 服務    │
                 │  postgres:16-alpine           │
                 │  週次資料永久保存              │
                 │  (weeks 表，JSONB 欄位)        │
                 └──────────────────────────────┘
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
│   ├── data/weeks/          # ← 週次 JSON 資料（W09–）
│   │   ├── W20.json
│   │   └── ...
│   ├── drafts/              # ← AI 草稿暫存（已加入 .gitignore）
│   │   └── ProgramSync_W##_YYYY-MM-DD_draft.md
│   └── src/
│       ├── index.js         # Express server
│       └── db.js            # 雙模式資料層（PG / Filesystem）
├── program-sync/            # Vanilla JS 前端 SPA
│   ├── index.html           # Dashboard 主頁
│   └── input.html           # Quick Input 頁面
└── scripts/
    ├── import-draft.py      # 草稿 → Railway 匯入工具
    ├── validate-week.py     # JSON 資料驗證器
    ├── new-week.py          # 新週骨架生成工具
    └── install-hooks.sh     # Git pre-push hook 安裝
```

**重點：週次資料存放規則**
- 已確認資料：`backend/data/weeks/W##.json`（提交至 git）
- AI 草稿：`backend/drafts/ProgramSync_W##_date_draft.md`（不提交，僅本機暫存）

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

### 標準流程（AI 草稿 → 審閱 → 匯入）

本系統採用「AI 輔助生成 → 人工審閱 → 一鍵匯入」的三階段流程，無需手動編輯 JSON。

#### Stage 1：AI 生成草稿（Claude Code）

在 Claude Code 中提供本週資料來源：

| # | 來源 | 提供方式 |
|---|------|----------|
| 1–N | 本週 Notion 會議記錄 | 提供頁面 URL，AI 自動讀取 |
| N+1 | PM Tasks（Open Tasks view） | 在 Notion 全選任務欄 → 複製貼入對話視窗 |

AI 讀取後產出草稿，存入 `backend/drafts/ProgramSync_W##_YYYY-MM-DD_draft.md`。

**找到本週會議 URL 的方式：**  
開啟 Notion `Meeting & Decision Log` 資料庫，依 `Meeting Date` 篩選該週，複製所有頁面 URL。

#### Stage 2：審閱草稿

開啟 `backend/drafts/ProgramSync_W##_YYYY-MM-DD_draft.md`，確認：

- [ ] 週次正確（W##）
- [ ] 所有專案狀態合法（on-track / at-risk / behind / completed）
- [ ] 所有 Action Items 均有負責人與分類
- [ ] Risks 嚴重度已填寫
- [ ] 沒有捏造的數字或人名

#### Stage 3：匯入 Dashboard

在 Claude Code 說「**請將 W## 草稿匯入 Dashboard**」，AI 執行：

```bash
python3 scripts/import-draft.py backend/drafts/ProgramSync_W##_YYYY-MM-DD_draft.md --push
```

工具會自動完成：
1. 解析草稿 Markdown 表格
2. 與現有 W##.json 合併（保留 id、_createdAt）
3. 重新計算 snapshot（on-track/at-risk/behind 計數）
4. 驗證資料格式
5. 推送至 Railway PostgreSQL

---

### 備用流程：使用 new-week.py 生成骨架後手動填寫

適合無 AI 協助或需要快速建立骨架的場景：

```bash
# Step 1：生成新週骨架（攜帶未完成事項）
python3 scripts/new-week.py W21

# Step 2：手動編輯 backend/data/weeks/W21.json

# Step 3：驗證
python3 scripts/validate-week.py W21

# Step 4：commit & push
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

### import-draft.py — 草稿匯入工具

將 AI 產出的週報草稿（Markdown 格式）解析並推送至 Railway Dashboard。

**功能：**
- 解析草稿中的「專案進度」、「Action Items」、「Risks」、「下週重點」Markdown 表格
- 與現有週次 JSON 合併（匹配現有項目，保留 `id` 與 `_createdAt`）
- 自動重新計算 snapshot 計數
- 執行 `validate-week.py` 驗證後推送至 Railway API

```bash
# 預覽（不實際寫入）
python3 scripts/import-draft.py backend/drafts/ProgramSync_W21_draft.md

# 確認並推送至 Railway
python3 scripts/import-draft.py backend/drafts/ProgramSync_W21_draft.md --push

# 跳過確認提示
python3 scripts/import-draft.py backend/drafts/ProgramSync_W21_draft.md --push --yes
```

**前置需求：** 環境變數 `ADMIN_TOKEN`（Railway 後端 API Token）

```bash
export ADMIN_TOKEN="your-token-here"
```

---

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

## 9. PostgreSQL 資料持久化

Railway 的 Docker 容器在每次 redeploy 後，檔案系統會還原為 git 原始狀態。  
v3.22 起改用 **PostgreSQL** 儲存週次資料，網頁編輯結果永久保存，不受 redeploy 影響。

### 雙模式資料層（`backend/src/db.js`）

| 環境 | 模式 | 說明 |
|------|------|------|
| 本機開發（未設 `DATABASE_URL`） | Filesystem | 讀寫 `backend/data/weeks/*.json` |
| Railway 生產環境 | PostgreSQL | 讀寫 `weeks` 資料表（JSONB） |

程式碼自動判斷，切換零成本：

```js
module.exports = process.env.DATABASE_URL ? buildPgImpl() : fsImpl;
```

### PostgreSQL Schema

```sql
CREATE TABLE IF NOT EXISTS weeks (
  week_label TEXT        PRIMARY KEY,  -- 'W20'
  data       JSONB       NOT NULL,     -- 完整週次 JSON
  saved_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Auto-Seed（首次啟動自動移入）

`initDB()` 在啟動時檢查 `weeks` 表是否為空；若空，自動將 `backend/data/weeks/*.json` 中所有週次一次性匯入。之後的更新以 DB 為主，不再讀取 JSON 檔案。

```
[db] Seeding 12 week(s) from JSON files…
[db] Seed complete.
[db] PostgreSQL mode — schema ready
```

### Railway 設定步驟

**Step 1：在 Railway 專案中新增 PostgreSQL 服務**

1. 開啟 Railway 專案 Dashboard
2. 點選 **+ Add Service** → **Database** → **PostgreSQL**
3. 選擇 `postgres:16-alpine`（官方映像）
4. 等待 Deploy 完成（約 40 秒）

**Step 2：取得內網連線字串**

PostgreSQL 服務 Deploy 完成後，在其 **Variables** 頁取得：

| 變數 | 範例值 |
|------|--------|
| `PGHOST` | `postgres-xxxx.railway.internal` |
| `PGPASSWORD` | `<自動生成>` |
| `PGPORT` | `5432` |
| `PGDATABASE` | `railway` |

**Step 3：設定主服務的 `DATABASE_URL`**

在**主服務**（Express）的 Variables 頁新增：

```
DATABASE_URL=postgresql://postgres:<PASSWORD>@<PGHOST>:5432/railway?sslmode=disable
```

> `?sslmode=disable` 是必要的：Railway 內網 postgres:16 預設未啟用 SSL，  
> 省略此參數會報錯 `"The server does not support SSL connections"`。

**Step 4：觸發 Redeploy**

設定 `DATABASE_URL` 後，主服務會自動 redeploy。啟動日誌應出現：

```
[db] Seeding N week(s) from JSON files…
[db] PostgreSQL mode — schema ready
Server running at http://localhost:3001
```

### 驗證

```bash
# 透過 API 確認週次已存入 DB
curl https://pgm-weekly-report-production.up.railway.app/api/weeks | jq '.[] | {weekLabel, projectCount, onTrackPct}'
```

---

## 10. 版本歷程

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
| **v3.22** | **2026/05/15** | **PostgreSQL 資料持久化** |
| | | Railway 新增 PostgreSQL 服務（postgres:16-alpine） |
| | | `backend/src/db.js`：雙模式資料層（PG / Filesystem） |
| | | Auto-seed：首次啟動自動將 W09–W20 匯入 DB |
| | | `DATABASE_URL` + `?sslmode=disable` 設定於主服務 |
| | | 網頁編輯資料永久保存，不受 redeploy 影響 |
| **v3.23** | **2026/05/15** | **AI 草稿生成 + 一鍵匯入流程** |
| | | 新工具：`scripts/import-draft.py`（草稿 MD → Railway API） |
| | | 新目錄：`backend/drafts/`（AI 草稿暫存，已加入 .gitignore） |
| | | SKILL.md：program-sync-report Skill 更新為 5 來源標準流程 |
| | | input.html：移除「週報歸檔」Tab，改為非技術三步驟說明 |
| | | 每週流程：AI 草稿 → 審閱 → import-draft.py → Railway |

---

*建置人：Alex Liao／2026/03/19，最後更新：2026/05/15*
