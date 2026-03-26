# P&D Center Program Sync — 週報管理系統

> VIA Technologies P&D Center 週報管理與協作平台
> 版本：v3.0 ｜ 部署：Railway ｜ 技術棧：Vanilla HTML5 + Node.js + Anthropic Claude API

---

## 目錄

1. [系統概覽](#1-系統概覽)
2. [技術架構](#2-技術架構)
3. [目錄結構](#3-目錄結構)
4. [資料模型](#4-資料模型)
5. [前端功能說明](#5-前端功能說明)
6. [後端 API 說明](#6-後端-api-說明)
7. [核心模組說明](#7-核心模組說明)
8. [子組與成員設定](#8-子組與成員設定)
9. [AI 整合](#9-ai-整合)
10. [部署指引](#10-部署指引)
11. [瀏覽器相容性](#11-瀏覽器相容性)

---

## 1. 系統概覽

P&D Center Program Sync 是一套**前後端分離的週報管理系統**，專為 VIA Technologies P&D Center Program Manager 及各子組 Lead 設計。

### 核心設計原則

| 特性 | 說明 |
|------|------|
| **無需登入** | 資料儲存於瀏覽器 localStorage，開箱即用 |
| **無框架依賴** | 純 HTML5 + ES Modules，無 React/Vue 等框架 |
| **AI 輔助生成** | 整合 Anthropic Claude API，可 AI 自動撰寫週報 |
| **跨瀏覽器一致顯示** | 儀表板、Action Items、里程碑頁面均從 `/api/weeks` 最新週次載入，所有瀏覽器顯示相同畫面，不依賴 localStorage |
| **週次歷史瀏覽** | 每週狀態獨立歸檔（`/api/weeks/:weekLabel`），可切換查看 W13/W12/W11… 儀表板 |
| **資料持久化** | 各週 JSON 檔案存入 `backend/data/weeks/` 並納入 git，跨 Railway 部署永久保存 |
| **後端輔助** | Node.js Express 提供歷史週報雲端存取 |
| **一鍵部署** | Docker 容器化，Railway 自動 CI/CD |

### 主要功能模組

```
儀表板 → 快速輸入 → Action Items → 里程碑 → 生成週報
```

---

## 2. 技術架構

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │index.html│  │input.html│  │report.html│  │review  │  │
│  │dashboard │  │quick input│  │AI/local  │  │.html   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │              │              │      │
│  ┌────▼──────────────▼──────────────▼──────────────▼───┐ │
│  │                  store.js                            │ │
│  │           localStorage CRUD Layer                    │ │
│  │  pgm_sync_projects / risks / actions / milestones   │ │
│  │  pgm_sync_snapshots / drafts / members / api_key    │ │
│  └──────────────────────────────────────────────────────┘ │
│                           │                              │
│  ┌────────────────────────▼──────────────────────────┐  │
│  │                    ui.js                          │  │
│  │  Toast │ Modal │ Badge │ DateUtils │ Confirm      │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ Fetch API
          ┌──────────────▼───────────────┐
          │      Node.js Express Backend │
          │    backend/src/index.js      │
          │                              │
          │  GET  /api/health            │
          │  GET  /api/reports           │
          │  POST /api/reports           │
          │  GET  /api/reports/:filename │
          │  DELETE /api/reports/:file   │
          │  GET  /api/state  ←─────────┼── 跨瀏覽器狀態同步
          │  POST /api/state  ─────────→┘
          │                              │
          │  Storage: /reports/*.md      │
          │           /data/state.json   │
          └──────────────────────────────┘
                         │ HTTPS
          ┌──────────────▼───────────────┐
          │   Anthropic Claude API       │
          │  claude-sonnet-4-6 (SSE)     │
          └──────────────────────────────┘
```

### 技術堆疊

| 層次 | 技術 | 版本 |
|------|------|------|
| **前端框架** | Vanilla HTML5 + ES Modules | — |
| **樣式系統** | CSS Variables + Grid/Flexbox | — |
| **資料持久化** | localStorage (瀏覽器) | — |
| **後端伺服器** | Node.js + Express | 20 / 4.18 |
| **AI 引擎** | Anthropic Claude API (SSE 串流) | claude-sonnet-4-6 |
| **Markdown 渲染** | marked.js | 9.0.0 |
| **圖表** | Chart.js | 4.4.0 |
| **DOCX 匯出** | docx + FileSaver | 8.5.0 / 2.0.5 |
| **PDF 匯出** | html2canvas + jsPDF | 1.4.1 / 2.5.1 |
| **容器** | Docker (node:20-alpine) | — |
| **部署平台** | Railway.app | — |

---

## 3. 目錄結構

```
program-sync/
├── index.html           # 儀表板（主頁）
├── input.html           # 快速輸入 & 批次解析
├── actions.html         # Action Items 管理
├── milestones.html      # 里程碑時間軸
├── report.html          # 週報生成（三欄佈局）
├── risks.html           # 風險管理（頁面保留）
├── README.md            # 本文件
├── CLAUDE.md            # Claude Code 開發指南
│
└── assets/
    ├── css/
    │   ├── base.css         # CSS 變數、Reset、工具類
    │   ├── components.css   # 所有 UI 元件樣式
    │   └── layout.css       # 頁面版型、格線系統
    │
    ├── js/
    │   ├── store.js         # localStorage CRUD 核心層
    │   ├── ui.js            # Toast/Modal/Badge/DateUtil
    │   ├── report.js        # 週報 Markdown 生成（9章節）
    │   ├── ai.js            # Claude API 串流整合
    │   ├── api.js           # 後端 REST 通訊
    │   ├── import.js        # 文字解析（Slack/Email/JIRA）
    │   └── export.js        # DOCX + PDF 匯出
    │
    └── data/
        ├── schema.js        # 靜態參考資料（Teams/Members/Catalog）
        └── seed.js          # 初始種子資料（14專案/10Actions/6里程碑/4週快照 W09~W12）

backend/
├── src/
│   └── index.js         # Express REST API Server
├── package.json
└── package-lock.json

Dockerfile               # Docker 建置設定
railway.json             # Railway 部署設定
```

---

## 4. 資料模型

所有資料以 `pgm_sync_` 前綴儲存於 localStorage。

### 4.1 Projects（專案）

```javascript
{
  id,           // UUID — 主鍵
  name,         // 專案名稱
  team,         // 子組 ID（見 TEAMS）
  status,       // 'on-track' | 'at-risk' | 'behind' | 'paused'
  progress,     // 0-100（完成百分比）
  progressMode, // 'auto' | 'manual'（auto 依 Actions 完成率計算）
  owner,        // 負責人姓名
  weekDone,     // 本週完成事項（文字）
  blockers,     // 阻塞項目（文字）
  targetDate,   // 目標完成日（ISO 8601）
  category,     // 專案分類（Platform / AI/ML / Mobile 等）
  weekStart,    // 記錄週起始日（YYYY-MM-DD）
  _source,      // 'history'（來自後端歷史週報）| undefined（手動輸入）
  _createdAt,   // 建立時間（ISO 8601）
  _updatedAt    // 最後更新時間（ISO 8601）
}
```

**Status 說明：**
| 值 | 顯示 | 顏色 |
|----|------|------|
| `on-track` | 🟢 On Track | 綠 |
| `at-risk` | 🟡 At Risk | 黃 |
| `behind` | 🔴 Behind | 紅 |
| `paused` | ⏸️ 暫緩 | 灰（不計入健康度分母） |

---

### 4.2 Actions（行動事項）

```javascript
{
  id,        // UUID
  category,  // 'technical' | 'business' | 'resource'
  task,      // 任務描述
  owner,     // 負責人
  dueDate,   // 截止日期（ISO 8601）
  status,    // 'pending' | 'in-progress' | 'done' | 'blocked'
  project,   // 關聯專案名稱
  weekStart, // 記錄週
  _createdAt, _updatedAt
}
```

---

### 4.3 Milestones（里程碑）

```javascript
{
  id,        // UUID
  name,      // 里程碑名稱
  date,      // 預定日期（ISO 8601）
  team,      // 子組 ID
  project,   // 關聯專案名稱
  status,    // 'upcoming' | 'done' | 'delayed'
  weekStart, // 記錄週
  _order,    // 排序序號（同日拖曳排序）
  _createdAt, _updatedAt
}
```

---

### 4.4 Risks（風險事項）

```javascript
{
  id,          // UUID
  level,       // 'high' | 'medium' | 'low'
  description, // 風險描述
  project,     // 關聯專案名稱
  team,        // 子組 ID
  owner,       // 負責人
  dueDate,     // 截止日期
  status,      // 'open' | 'in-progress' | 'closed'
  mitigation,  // 因應方案
  weekStart,
  _createdAt, _updatedAt
}
```

---

### 4.5 Members（成員）

```javascript
{
  id,     // 小寫連字符格式（'steve-liu'）
  name,   // 顯示名稱
  team,   // 所屬子組 ID
  role,   // 職稱（'Team Lead' / 'Engineer' 等）
  avatar  // 縮寫（'SL'）
}
```

---

### 4.6 WeeklySnapshots（週快照）

```javascript
{
  id,                // 'snap-YYYY-MM-DD'
  weekStart,         // 週起始日
  weekLabel,         // 'W11'
  onTrackPct,        // 健康度 %
  atRiskCount,       // At Risk 專案數
  behindCount,       // Behind 專案數
  highRisks,         // 高風險項數
  mediumRisks,       // 中風險項數
  lowRisks,          // 低風險項數
  totalProjects,     // 專案總數
  overdueActions,    // 逾期 Action 數
  completedActions,  // 完成 Action 數
  totalActions,      // Action 總數
  teamHealth: {      // 各子組健康度
    [teamId]: pct    // 0-100
  },
  reviewStatus,      // 'draft' | 'approved'
  snapshotBy,        // 建立者
  _createdAt, _updatedAt
}
```

---

### 4.7 Drafts（週報草稿）

```javascript
{
  id,            // UUID
  weekStart,     // 週起始日
  version,       // 版本號（1, 2, 3…）
  content,       // Markdown 字串（完整週報）
  reviewStatus,  // 'draft' | 'in-review' | 'approved' | 'rejected'
  author,        // 撰寫人
  reviewedBy,    // 審核人
  reviewedAt,    // 審核時間
  reviewComment, // 審核備註（退回時必填）
  _createdAt, _updatedAt
}
```

---

### 4.8 localStorage Keys 速查表

| Key | 說明 |
|-----|------|
| `pgm_sync_projects` | 專案陣列 |
| `pgm_sync_risks` | 風險陣列 |
| `pgm_sync_actions` | Action 陣列 |
| `pgm_sync_milestones` | 里程碑陣列 |
| `pgm_sync_members` | 成員陣列 |
| `pgm_sync_snapshots` | 週快照陣列 |
| `pgm_sync_drafts` | 週報草稿陣列 |
| `pgm_sync_api_key` | Anthropic API Key |

---

## 5. 前端功能說明

### 5.1 儀表板（index.html）

**KPI 卡片（4 個）**

| 指標 | 資料來源 | 顏色邏輯 |
|------|---------|---------|
| 專案健康度 % | `onTrack / (total - paused)` | ≥80% 綠 / ≥60% 黃 / <60% 紅 |
| 進行中專案 | `totalProjects` | 固定 |
| 需關注專案 | `atRiskProjects + behindProjects` | =0 綠 / ≤3 黃 / >3 紅 |
| 逾期 Actions | `overdue dueDate & status ≠ done` | =0 綠 / ≤3 黃 / >3 紅 |

**專案進度總覽**
- 狀態 Tab 篩選：全部 / 🟢 正常 / 🟡 風險 / 🔴 落後 / ⏸️ 暫緩
- 子組下拉篩選：全部子組 / 各子組名稱
- 兩個篩選條件可同時組合使用
- 點擊列展開：顯示本週完成、阻塞項目、負責人、目標日期
- 進度條：🤖 圖示代表「依 Actions 自動計算」

**歷史週報中心**（後端連線時顯示）
- 自動偵測後端可用性
- 顯示後端儲存的歷史週報清單
- 支援線上預覽（Markdown 渲染）、下載、🗑 刪除（含確認對話框）

**需決策事項**
- 自動從 Risks 資料中篩選 `level === 'high' && status !== 'closed'`
- 最多顯示 5 筆

---

### 5.2 快速輸入（input.html）

**模式一：快速更新**

| 操作 | 說明 |
|------|------|
| 選擇現有專案 | 下拉按子組分組，自動填入現有數據 |
| 新增專案 | 選「+ 新增專案」展開名稱/子組/目標日期輸入 |
| 變更基本資料 | ✏️ 變更按鈕展開可編輯名稱、子組、目標日期 |
| **刪除專案** | 🗑 刪除按鈕，confirm 確認後永久刪除 |
| 完成率模式 | 🤖 自動計算（依 Actions 完成率）/ ✏️ 手動拖曳設定 |
| 關聯風險 | 同時新增關聯風險（等級 + 描述） |

**模式二：批次貼入**

支援四種格式自動識別：
- **Slack** — 訊息格式（時間戳 + 用戶名）
- **Email** — 含 Subject: / From: 標頭
- **JIRA** — Issue 格式（[PROJ-123]）
- **純文字** — 通用格式解析

流程：貼入文字 → 自動解析 → 勾選確認 → 批次匯入

**成員管理面板**（右欄底部）
- 新增成員：姓名 / 子組 / 職稱
- 編輯現有成員
- 刪除成員（confirm 確認）
- 所有「負責人」下拉清單從此動態載入

---

### 5.3 Action Items（actions.html）

**整體進度條**
- 計算公式：`done / total × 100%`
- 顏色：≥80% 綠 / ≥50% 黃 / <50% 紅
- 顯示逾期數量

**三欄面板**

| 欄 | 類型 | 顏色 |
|----|------|------|
| ⚙️ 技術 | technical | 藍 |
| 📋 業務 | business | 黃 |
| 👥 資源 | resource | 綠 |

**操作**
- **點擊狀態 Badge** — 循環切換：待辦 → 進行中 → 完成 → 阻塞 → 待辦
- **✏️ 編輯** — 開啟 Modal 修改任務名稱、所屬專案、分類、狀態、負責人、截止日
- **✕ 刪除** — confirm 確認後刪除
- **批次完成** — 將所有「進行中」標記為完成
- **逾期樣式** — `.a-late`：紅色左邊框 + 紅色日期 + ⚠️ 圖示

---

### 5.4 里程碑（milestones.html）

**時間軸**
- 垂直時間軸，依月份分組
- 今日橘色虛線標記
- 顏色：已完成 🟢 / 今日 🟠 / 未來 🔵 / 延遲 🔴

**拖曳排序**
- HTML5 Drag & Drop
- 僅允許同日里程碑互換順序（交換 `_order` 欄位）

**月份概覽面板（右欄）**
- 每月完成/未完成/延遲計數
- 月份進度條（完成 / 全部）

**子組篩選**
- 頁首下拉篩選，依子組過濾時間軸

**快速新增**
- 面板底部 inline 表單：名稱 + 日期 + 子組

---

### 5.5 週報生成（report.html）

**三欄佈局**

```
┌──────────────┬──────────────────────┬─────────────────┐
│   設定面板    │      Markdown 預覽   │   AI 控制面板   │
│   (260px)    │       (1fr)          │    (280px)      │
└──────────────┴──────────────────────┴─────────────────┘
```

**左欄（設定）**
- 週次選擇（W## 格式）
- 彙整人名稱輸入
- 章節勾選（9 個章節，可單獨開關）
- 匯出格式：Markdown / DOCX / Word
- 匯出 / 複製按鈕

**中欄（預覽）**
- Preview Tab：marked.js 渲染的 HTML 預覽
- Source Tab：可編輯的原始 Markdown
- 雲端儲存按鈕（後端可用時）

**右欄（AI 控制）**
- API Key 狀態 + 設定按鈕
- 生成模式：本地生成 / AI 生成
- 語氣選擇：
  - 正式 Formal：適合正式呈報
  - 簡潔 Concise：精簡要點
  - 高管 Executive：聚焦業務影響
  - 技術 Technical：包含技術細節
- 生成按鈕 + 進度狀態
- Token 計數顯示
- 各章節單獨重新生成（AI 模式）

**9 個章節**

| ID | 章節名稱 | 說明 |
|----|---------|------|
| cover | 封面 | 週次、組織、彙整人 |
| summary | Executive Summary | KPI 摘要、整體健康度 |
| projects | 專案進度 | 所有專案狀態表格 |
| teams | 子組進度 | 各子組健康度分析 |
| decisions | 決策與風險 | 需決策的高風險項目 |
| next | 下週計畫 | 下週重點工作 |
| risks | Risk Register | 完整風險清單 |
| actions | Action Items | 行動事項列表 |
| milestones | 里程碑 | 時間軸里程碑 |

---

---

## 6. 後端 API 說明

### 端點總覽

| Method | 路徑 | 說明 |
|--------|------|------|
| `GET` | `/api/health` | 健康檢查 |
| `GET` | `/api/reports` | 取得週報清單 |
| `GET` | `/api/reports/:filename` | 取得週報內容（Markdown） |
| `GET` | `/api/reports/:filename/download` | 下載週報檔案 |
| `POST` | `/api/reports` | 儲存新週報 |
| `DELETE` | `/api/reports/:filename` | 刪除週報 |
| `GET` | `/api/state` | 取得全域 App 狀態（跨瀏覽器同步） |
| `POST` | `/api/state` | 儲存全域 App 狀態 |
| `GET` | `/api/weeks` | 取得所有已歸檔週次清單（含 onTrackPct、projectCount） |
| `GET` | `/api/weeks/:weekLabel` | 取得指定週次完整狀態（projects/risks/actions/milestones/snapshots） |
| `POST` | `/api/weeks/:weekLabel` | 歸檔指定週次完整狀態（存入 `backend/data/weeks/W13.json` 等） |
| `GET` | `/read` | HTML 格式週報列表（NotebookLM 用） |
| `GET` | `*` | SPA Fallback（回傳 index.html） |

### 健康檢查

```json
GET /api/health
→ { "status": "ok", "version": "v3" }
```

### 週報清單

```json
GET /api/reports
→ [
    {
      "filename": "weekly_report_2026-W11.md",
      "date": "2026-03-16",
      "period": "W11",
      "size": 4821
    }
  ]
```

### 儲存週報

```json
POST /api/reports
Content-Type: application/json

{
  "filename": "weekly_report_2026-W11.md",
  "content": "# P&D Center Weekly Report..."
}
```

### 限制

- 僅接受 `.md` 副檔名
- 最大 payload：2MB
- 檔名僅允許：字母、數字、底線、連字符、點

---

## 7. 核心模組說明

### 7.1 store.js — 資料存取層

所有頁面透過 `store` 物件讀寫 localStorage。

**基礎 CRUD**

```javascript
store.getAll('projects')              // 取得全部專案
store.getById('projects', id)         // 取得單一專案
store.save('projects', item)          // 新增或更新（有 id 更新，無 id 建立）
store.delete('projects', id)          // 刪除
store.query('projects', p => p.status === 'at-risk')  // 條件查詢
store.sortBy('projects', 'name', 'asc')               // 排序查詢
```

**統計方法**

```javascript
const s = store.stats();
// {
//   totalProjects,    onTrackPct,      onTrackProjects,
//   atRiskProjects,   behindProjects,  pausedProjects,
//   highRisks,        overdueActions
// }
```

**快照 & 草稿**

```javascript
store.createSnapshot(weekStart, overrides)          // 建立週快照
store.trendData(8)                                  // 取得最近 8 週快照
store.newDraftVersion(weekStart, markdownContent)   // 建立新草稿版本
store.getLatestDraft(weekStart)                     // 取得最新草稿
```

**週次工具**

```javascript
store.weekLabel('2026-03-23')   // 從 weekStart 字串推算週次 → 'W12'
store.currentWeekLabel()        // 最新週次標籤（快照優先，無快照則從 projects.weekStart 推算）
```

**跨瀏覽器同步 + 週次歷史**

```javascript
// 啟動：store 任何變更 → 2s debounce → POST /api/state
store.startBackendSync(saveState);

// 週次歸檔（init 完成後自動執行）
saveWeekState('W13', currentState);   // 寫入 backend/data/weeks/W13.json

// 切換歷史週次（儀表板週次選擇器）
loadWeekView('W12');      // GET /api/weeks/W12 → 唯讀渲染，顯示歷史 banner
loadWeekView('W13');      // 最新週次 → 無 banner，正常模式
returnToCurrentWeek();    // 回到最新週次（GET /api/weeks 取 weeks[0]）
```

每個頁面初始化流程（index.html）：
1. `getState()` 從後端取得最新狀態（404 = 無後端狀態，走 seed）
2. `store.importAll()` 將後端狀態覆寫 localStorage
3. `seedData()` 補齊快照（若快照為空）；若專案為空則補種子
4. `store.startBackendSync(saveState)` 啟動自動同步
5. `listWeeks()` 取得 `/api/weeks` 清單，自動載入最新週次（`weeks[0]`）為預設畫面
6. `renderWeekNav()` 渲染週次選擇器（從 `/api/weeks` 取得清單，標示「最新」）

> ⚠️ **v3.3 設計變更**：儀表板預設顯示不再依賴 `store.currentWeekLabel()` 或 `localStorage`，
> 改為直接從 API 取得最新週次，確保所有瀏覽器開啟即看到相同畫面。

**資料持久化策略**

| 層次 | 路徑 | 持久性 | 說明 |
|------|------|--------|------|
| 週次歸檔 | `backend/data/weeks/W13.json` | ✅ Git 版控 | 跨 deploy 永久保存 |
| 當前狀態 | `backend/data/state.json` | ⚠️ Railway 暫態 | 重新部署後從 weeks/ 重建 |
| 本地快取 | `localStorage` | ⚠️ 瀏覽器本地 | 清除快取後消失 |

**事件系統**

每次 `store.save()` 或 `store.delete()` 都會觸發：

```javascript
window.addEventListener('store:updated', (e) => {
  // e.detail.key — 被更新的資料集名稱
  renderAll();
});
```

---

### 7.2 ui.js — UI 工具函式

**Toast 通知**

```javascript
toast('✅ 儲存成功', 'success', 3000);
toast('請選擇專案', 'error');
toast('已複製到剪貼簿', 'info');
```

**Modal 對話框**

```javascript
const { close, el } = modal(`
  <div class="modal__header">
    <span class="modal__title">標題</span>
    <button class="modal__close">✕</button>
  </div>
  <div class="modal__body">內容</div>
  <div class="modal__footer">
    <button id="btnSave">儲存</button>
  </div>
`);
el.querySelector('#btnSave').addEventListener('click', () => {
  close(); // 先關閉再存檔（避免 store:updated re-render 干擾）
  store.save('projects', data);
});
```

> ⚠️ **重要**：Modal 儲存時務必先呼叫 `close()` 再呼叫 `store.save()`，避免 `store:updated` 事件觸發重新渲染導致 Modal 被移除前發生錯誤。

**確認對話框**

```javascript
// 使用同步 window.confirm（避免非同步點擊穿透問題）
if (!window.confirm('確定刪除？')) return;
store.delete('projects', id);
```

**Badge 渲染**

```javascript
renderBadge('on-track')  // → <span class="badge badge-success">🟢 On Track</span>
renderBadge('at-risk')   // → <span class="badge badge-warning">🟡 At Risk</span>
renderBadge('paused')    // → <span class="badge badge-neutral">⏸️ 暫緩</span>
```

---

### 7.3 report.js — 週報生成

**本地生成（無 AI）**

```javascript
const markdown = generateReport({
  weekStart: '2026-03-16',
  weekLabel: 'W11',
  author: 'TC Peng',
  sections: ['cover', 'summary', 'projects', 'teams', 'decisions', 'next', 'actions', 'milestones'],
  tone: 'formal'   // 'formal' | 'concise' | 'executive' | 'technical'
});
```

**AI 生成（串流）**

```javascript
await generateWithAI({
  weekStart: '2026-03-16',
  tone: 'executive',
  onChunk: (chunk, full) => preview.innerHTML = marked.parse(full),
  onDone: (text) => store.newDraftVersion(weekStart, text),
  onError: (err) => toast(err.message, 'error'),
  onTokens: ({ input, output }) => updateTokenCounter(input, output)
});
```

---

### 7.4 api.js — 後端通訊

```javascript
// 初始化（頁面載入時自動偵測後端）
const ok = await initApi();

// 取得歷史週報清單
const reports = await fetchReports();
// → [{ filename, date, period, size }, ...]

// 取得週報內容
const content = await fetchReportContent('weekly_2026-W11.md');

// 儲存週報到後端
await saveReport('weekly_2026-W11.md', markdownContent);

// 跨瀏覽器狀態同步
const state = await getState();   // GET /api/state → 物件 或 null
await saveState(stateObject);     // POST /api/state（由 store.startBackendSync 自動呼叫）
```

---

### 7.5 import.js — 批次文字解析

```javascript
const result = parseText(rawText);
// → {
//     projects: [{ name, status, progress, weekDone }],
//     risks:    [{ level, description }],
//     actions:  [{ task, owner, dueDate }]
//   }
```

支援格式：Slack 訊息 / Email / JIRA Issue / 純文字

---

## 8. 子組與成員設定

### 子組（TEAMS）

| ID | 名稱 | Lead | 顏色 |
|----|------|------|------|
| `media-agent` | Media Agent | Steve Liu | #4caf6e |
| `learnmode` | LearnMode | TC Peng | #378add |
| `chuangzaoli` | 創造栗 | Tonny Shen | #e4a23c |
| `tv-solution` | TV Solution | Tom Liu | #9c6fcc |
| `healthcare` | BU2 Healthcare | Tonny Shen | #d94f4f |
| `org-mgmt` | 組織管理 | — | #6b7280 |

### 成員（MEMBERS）

| ID | 姓名 | 子組 | 職稱 |
|----|------|------|------|
| steve-liu | Steve Liu | media-agent | Team Lead |
| tc-peng | TC Peng | learnmode | Team Lead |
| tonny-shen | Tonny Shen | chuangzaoli | Team Lead |
| tom-liu | Tom Liu | tv-solution | Team Lead |
| alex-chen | Alex Chen | media-agent | Engineer |
| michael-wu | Michael Wu | learnmode | Engineer |
| dream-lin | Dream Lin | chuangzaoli | Designer |
| jenny-huang | Jenny Huang | tv-solution | QA Engineer |
| kevin-chang | Kevin Chang | media-agent | PM |
| lily-tsai | Lily Tsai | healthcare | Engineer |
| ryan-hsu | Ryan Hsu | healthcare | BA |

> 成員可在「快速輸入」頁面的「成員管理」面板中動態新增、編輯、刪除。變更後所有負責人下拉清單會即時同步更新。

---

## 9. AI 整合

### API 設定

```javascript
// 端點
POST https://api.anthropic.com/v1/messages

// 模型
claude-sonnet-4-6

// 必要 Headers
{
  'x-api-key': '<USER_API_KEY>',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
  'Content-Type': 'application/json'
}
```

> `anthropic-dangerous-direct-browser-access: true` 為瀏覽器直接呼叫 API 的必要 Header。

### API Key 管理

1. 點擊 navbar 的 **🔑 API Key** 按鈕
2. 貼上 Anthropic API Key
3. 系統自動驗證並儲存至 `pgm_sync_api_key`（localStorage）
4. Key 不隨頁面重新整理消失

### 串流生成流程

```
[使用者點擊生成]
       ↓
[buildContext(weekStart)]      ← 從 store 組裝所有資料
       ↓
[buildSystemPrompt(tone)]      ← 依語氣生成系統提示
       ↓
[Anthropic API (SSE 串流)]     ← 逐字回傳
       ↓
[onChunk callback]             ← 即時更新 Markdown 預覽
       ↓
[onDone callback]              ← 儲存草稿版本
       ↓
[onTokens callback]            ← 更新 Token 計數器
```

### 語氣選項

| 值 | 名稱 | 適用場景 |
|----|------|---------|
| `formal` | 正式 | 呈報上級、正式文件 |
| `concise` | 簡潔 | 快速瀏覽、每項 2 行以內 |
| `executive` | 高管摘要 | 聚焦業務影響與決策需求 |
| `technical` | 技術細節 | 工程師查閱、含架構與指標 |

---

## 10. 部署指引

### 本地開發

```bash
# 進入後端目錄
cd backend

# 安裝依賴
npm install

# 啟動開發伺服器（含 nodemon 熱重載）
npm run dev

# 瀏覽器開啟
open http://localhost:3001/program-sync/index.html
```

### Docker 建置

```bash
# 建置 Image
docker build -t program-sync .

# 執行容器
docker run -p 3001:3001 program-sync

# 瀏覽器開啟
open http://localhost:3001/program-sync/index.html
```

### Railway 部署

1. 將程式碼推送至 GitHub
2. 在 Railway 建立 New Project → 連結 GitHub Repo
3. Railway 自動偵測 `railway.json`，使用 Dockerfile 建置
4. 設定環境變數（選填）：
   - `PORT`：伺服器埠號（預設 3001）
   - `REPORTS_DIR`：週報儲存目錄（預設 `../reports`）

**自動部署**：每次 `git push origin main` 自動觸發 Railway 重新部署。

### 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `PORT` | `3001` | 伺服器監聽埠號 |
| `REPORTS_DIR` | `../reports` | Markdown 週報儲存目錄 |

### 清除 localStorage（重置資料）

在瀏覽器 Console 執行：

```javascript
// 清除全部資料
Object.keys(localStorage)
  .filter(k => k.startsWith('pgm_sync_'))
  .forEach(k => localStorage.removeItem(k));

// 重新整理頁面觸發種子資料載入
location.reload();
```

---

## 11. 瀏覽器相容性

| 瀏覽器 | 最低版本 | 建議 |
|-------|---------|------|
| Chrome / Edge | 90+ | ✅ 建議 |
| Firefox | 88+ | ✅ 支援 |
| Safari | 14+ | ✅ 支援 |

**必要瀏覽器功能：**
- ES2020（Optional chaining `?.`、Nullish coalescing `??`）
- ES Modules (`type="module"`)
- `CustomEvent`
- `localStorage`
- `Fetch API`
- CSS Grid / CSS Variables

---

## 版本歷程

| 版本 | 功能 |
|------|------|
| **v1.0** | 儀表板、快速輸入、風險管理、Action Items、里程碑 |
| **v2.0** | 週報生成（AI + 本地）、週快照、DOCX/PDF 匯出 |
| **v3.0** | 歷史週報中心（後端 API）、歷史週報解析匯入、成員管理 CRUD、Action 完成率自動計算、⏸️ 暫緩狀態、子組篩選、專案刪除功能 |
| **v3.1** | 跨瀏覽器狀態同步（`/api/state`）、移除審核流程 Navbar、歷史週報刪除功能、W12 週次 badge 修正 |
| **v3.2** | 週次歷史瀏覽（`/api/weeks`）、儀表板週次選擇器、W12/W13 歷史狀態歸檔、git 版控資料持久化 |
| **v3.3** | 儀表板預設週次 API 驅動（不依賴 localStorage）、最新週次無 banner、所有瀏覽器一致顯示 |
| **v3.4** | Action Items / 里程碑頁面同步改為 API 驅動初始載入；編輯後自動回寫最新週次歸檔 |

---

*P&D Center Program Sync — Built for VIA Technologies P&D Center*
