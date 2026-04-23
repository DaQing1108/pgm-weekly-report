# P&D Center Program Sync — 週報管理系統

> VIA Technologies P&D Center 週報管理與協作平台
> 版本：v3.16 ｜ 部署：Railway ｜ 技術棧：Vanilla HTML5 + Node.js + Anthropic Claude API

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
| **跨瀏覽器一致顯示** | 所有頁面均從 `/api/weeks` 最新週次載入，不依賴 localStorage |
| **週次歷史瀏覽** | Dashboard 可切換歷史週，並透過 sessionStorage 同步；Actions/Milestones/Risks 頁各有週次選擇器可直接切換，歷史週進入唯讀保護模式 |
| **資料持久化** | 各週 JSON 存入 `backend/data/weeks/` 並納入 git，跨 Railway 部署永久保存 |
| **半自動週報歸檔** | Quick Input「週報歸檔」分頁：上傳 .md → 解析 → 預覽驗證 → 一鍵上傳並下載 JSON |
| **統一初始化模組** | `app-init.js` 管理 loading overlay、週次載入、sessionStorage 跨頁 context、歷史 banner、後端離線 banner |
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
          │  GET  /api/weeks             │
          │  GET  /api/weeks/:weekLabel  │── 持久週次歸檔（git 存活）
          │  POST /api/weeks/:weekLabel  │
          │                              │
          │  Storage: /reports/*.md      │
          │           /data/weeks/*.json │
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
├── actions.html         # Action Items 管理（週次選擇器 + 歷史唯讀）
├── milestones.html      # 里程碑時間軸（週次選擇器 + 歷史唯讀）
├── risks.html           # 風險管理（週次選擇器 + 歷史唯讀）
├── trends.html          # 趨勢分析（Chart.js 跨週折線/長條圖）
├── resources.html       # 人力資源管理（季度總覽 / 業務分配 / 趨勢 CRUD）
├── report.html          # 週報生成（三欄佈局）
├── review.html          # 審核流程（Stepper）
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
    │   ├── store.js         # localStorage CRUD 核心層（含 startBackendSync guard）
    │   ├── app-init.js      # 統一初始化模組；window._appInitIsHistoryMode；離線/歷史 banner
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
- 支援線上預覽（Markdown 渲染）、⬇ MD 下載、📥 PDF 匯出、🗑 刪除（含確認對話框）
- PDF 匯出：自動從檔名推算週次標籤（YYMMDD → W??），以 A4 格式輸出含頁碼與頁尾的 PDF

**逾期 Actions KPI（歷史週修正）**
- 歷史模式：優先使用快照內 `overdueActions` 欄位（與記錄當時一致）
- 快照無此欄位：以快照 `weekStart` 為基準日計算，而非今日日期
- 本週模式：依今日日期即時計算

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

**週次選擇器**
- Navbar 下方橫條：動態載入所有可用週次（`listWeeks()`）
- 切換週次即時 reload，透過 sessionStorage 同步
- 瀏覽歷史週時顯示「📅 歷史瀏覽（唯讀）」標籤，自動停用新增/編輯/刪除操作

**操作**
- **點擊狀態 Badge** — 循環切換：待辦 → 進行中 → 完成 → 阻塞 → 待辦
- **✏️ 編輯** — 開啟 Modal 修改任務名稱、所屬專案、分類、狀態、負責人、截止日
- **✕ 刪除** — confirm 確認後刪除
- **批次完成** — 將所有「進行中」標記為完成
- **逾期樣式** — `.a-late`：紅色左邊框 + 紅色日期 + ⚠️ 圖示

---

### 5.4 里程碑（milestones.html）

**週次選擇器**
- 同 actions.html，支援跨週切換與歷史唯讀保護
- 歷史模式停用：新增按鈕、快速新增表單、刪除/狀態變更操作

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

### 5.5 風險管理（risks.html）

**週次選擇器**
- 同 actions.html，支援跨週切換與歷史唯讀保護
- 歷史模式停用：新增風險按鈕、升降級操作、刪除、狀態選擇器

**統計條**（5 格）：總計風險 / 高 / 中 / 低 / 已關閉

**多條件篩選**：等級 chips（全部/高/中/低）× 狀態下拉 × 子組下拉

**AI 建議 Banner**：自動分析逾期高風險、14 天未處理中風險、無因應方案的高風險

---

### 5.6 趨勢分析（trends.html）

**週次範圍選擇**：4 週 / 8 週 / 12 週（切換後即時更新圖表）

**本週 vs 上週 KPI 對比**（4 格 stats-bar）：健康度 / 高風險 / 中風險 / 逾期 Actions，附 ▲▼ 差值標籤

**三個 Chart.js 圖表**

| 圖表 | 類型 | 資料來源 |
|------|------|---------|
| 整體健康度趨勢 | 折線 + fill，點顏色依健康度 | `snap.onTrackPct` |
| 風險分佈趨勢 | 堆疊長條（高/中/低） | `snap.highRisks/mediumRisks/lowRisks` |
| Action 完成率趨勢 | 折線 + 長條雙軸 | `completedActions/totalActions + overdueActions` |

**週次快照明細表**：倒序列出各週健康度、專案數、風險數、Action 完成比

**資料流**：`listWeeks()` → 逐週 `getWeekState()` 並行（Promise.allSettled）→ 取各週最新快照 → 渲染

---

### 5.7 人力資源管理（resources.html）

**資料來源**：Resource_Summary_25Q1–26Q2，涵蓋 6 季度 / 5 條產品線 / 3 個地區分配表

**三個 Tab**

| Tab | 說明 |
|-----|------|
| 📊 季度總覽 | 依季度篩選，顯示各產品線 CN/TW/JP/Total 人月與 MBO 目標表格 |
| 📋 業務分配 | 24H2 / 25H1 / 25H2 三個期間的地區 FTE 分配（AI Learning / VED / 電視台 / Media Agent） |
| 📈 人力趨勢 | 跨季人月投入矩陣（▲▼ 差值標籤）+ 趨勢觀察文字 |

**CRUD 操作**
- **新增**：點擊右上角「+ 新增條目」，Modal 含自動計算 Total（CN + TW + JP）
- **編輯**：✏️ 開啟相同 Modal，修改後儲存
- **刪除**：✕ 確認後刪除

**資料儲存**：`localStorage.pgm_resources_entries`（季度條目）、`localStorage.pgm_resources_charges`（業務分配）

**種子資料**：首次載入自動填入 30 筆季度條目 + 12 筆業務分配（來自 Resource_Summary_25Q1_26Q2.docx）

---

### 5.8 週報生成（report.html）

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
| `POST` | `/api/reports` | 儲存新週報 🔒 需 `X-Admin-Token` |
| `DELETE` | `/api/reports/:filename` | 刪除週報 🔒 需 `X-Admin-Token` |
| `GET` | `/api/state` | 取得全域 App 狀態（跨瀏覽器同步） |
| `POST` | `/api/state` | 儲存全域 App 狀態 |
| `GET` | `/api/weeks` | 取得所有已歸檔週次清單（含 onTrackPct、projectCount） |
| `GET` | `/api/weeks/:weekLabel` | 取得指定週次完整狀態（projects/risks/actions/milestones/snapshots） |
| `POST` | `/api/weeks/:weekLabel` | 歸檔指定週次完整狀態 🔒 需 `X-Admin-Token` |
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

### Admin Token 驗證（v3.6）

後端 `DELETE /api/reports` 與 `POST /api/weeks/:weekLabel` 受 `requireAdminToken` 中介層保護：

- 在 Railway Variables 設定 `ADMIN_TOKEN=<隨機字串>` 即可啟用
- 未設定時跳過驗證（開發環境向下相容）
- 前端於 Console 執行以下指令設定 Token：
  ```javascript
  import('/assets/js/api.js').then(m => m.setAdminToken('your-token'));
  ```
- Token 存於 `sessionStorage`（`pgm_admin_token`），重開分頁需重新設定
- 未帶 Token 時後端回傳 `401 { error: '需要管理員 Token', code: 'UNAUTHORIZED' }`

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
// refDate（選填）：ISO 日期字串，歷史週傳入快照參考日期以正確計算 overdueActions
// 預設為 today（適用於當前週即時統計）
const s = store.stats(refDate?);
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
// app-init.js 統一初始化（actions / milestones / input 共用）
const latestLabel = await appInit();
// 內部流程：
//   1. initApi()（後端斷線 30s 後自動重試，v3.5 修正）
//   2. listWeeks()（sessionStorage 快取 60s，v3.5 修正）→ getWeekState(weeks[0]) → store.importAll()
//   3. 後端無資料時才 seedData()
//   4. 判斷 isHistoryMode = targetLabel !== latestWeekLabel
//   5. 非歷史模式才啟動 store.startBackendSync()（v3.5 修正：歷史模式不同步，防誤寫）
//      ↑ 內部用 _exportWeekObj() 推週次資料（v3.9 修正：不含 resources，防資料污染）

// 切換歷史週次（儀表板週次選擇器）
loadWeekView('W12');      // GET /api/weeks/W12 → 唯讀渲染，顯示歷史 banner
loadWeekView('W13');      // 最新週次 → 無 banner，正常模式
returnToCurrentWeek();    // 回到最新週次（GET /api/weeks 取 weeks[0]）
```

**各頁面初始化流程**

| 頁面 | 初始化方式 | 說明 |
|------|-----------|------|
| `index.html` | 自有 `init()` | 讀最新週至 `_viewState`，read-only 儀表板 |
| `actions.html` | `appInit()` | 共用模組，讀週次 JSON → store → 監聽同步 |
| `milestones.html` | `appInit()` | 同上 |
| `input.html` | `appInit()` | 同上，取代舊 `getState()/saveState()` |

> ⚠️ **v3.4 設計變更**：廢棄 `getState()/saveState()` (ephemeral `/api/state`) 作為主要同步來源，
> 所有頁面改用 `appInit()` 從 `/api/weeks/:latestLabel`（git 持久）載入，
> 編輯後 `startBackendSync` 自動回寫同一週次 JSON，確保跨裝置一致。

**資料持久化策略**

| 層次 | 路徑 | 持久性 | 說明 |
|------|------|--------|------|
| 週次歸檔 | `backend/data/weeks/W*.json` | ✅ Git 版控 | 跨 deploy 永久保存，主要資料來源 |
| 當前狀態 | `backend/data/state.json` | ⚠️ Railway 暫態 | 已廢棄為主要來源，僅保留向下相容 |
| 本地快取 | `localStorage` | ⚠️ 瀏覽器本地 | 清除快取後從 weeks JSON 重建 |

**API Key 管理（v3.6 改為 sessionStorage）**

```javascript
store.setApiKey('sk-ant-...');   // 存入 sessionStorage（重開分頁需重設）
store.getApiKey();               // 讀取
store.clearApiKey();             // 清除
// 注意：v3.5 以前存 localStorage；v3.6 改 sessionStorage 以防 Key 外洩
```

**事件系統**

每次 `store.save()` 或 `store.delete()` 都會觸發（v3.6 修正：delete 不再觸發兩次）：

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
// 初始化（後端斷線 30s 後允許自動重試）
const ok = await initApi();
const ok2 = await checkBackend(true);  // 強制重新偵測

// Admin Token 管理（v3.6 新增，存 sessionStorage）
import { setAdminToken, getAdminToken, clearAdminToken } from './api.js';
setAdminToken('your-token');   // 設定；deleteReport/saveWeekState 自動帶入 X-Admin-Token
getAdminToken();               // 讀取
clearAdminToken();             // 清除

// 取得週次清單（sessionStorage 快取 TTL 60s）
const weeks = await listWeeks();

// 週報清單 / 內容（均有 AbortSignal.timeout）
const reports = await fetchReports();
const content = await fetchReportContent('weekly_2026-W11.md');

// 儲存週報到後端
await saveReport('weekly_2026-W11.md', markdownContent);

// 刪除週報（若後端設定 ADMIN_TOKEN，需先 setAdminToken；401 時拋 code:'UNAUTHORIZED'）
await deleteReport('weekly_2026-W11.md');

// 週次資料讀寫（saveWeekState 自動清除快取 + 帶 Admin Token + timeout 10s）
const data = await getWeekState('W14');
await saveWeekState('W14', stateObject);
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
| `ADMIN_TOKEN` | 未設定（開放） | 設定後，POST/DELETE 週報及 POST 週次存檔需帶 `X-Admin-Token` header |
| `CORS_ORIGIN` | 未設定（允許所有） | 逗號分隔的允許 origin（e.g. `https://your-app.railway.app`） |
| `REPORT_EXCLUDE_TAG` | `_v7` | 週報清單與 `/read` 排除含此標記的舊格式檔案 |

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
| **v3.4** | `app-init.js` 統一初始化模組：廢棄 `/api/state` 為主要來源，所有頁面改從 `/api/weeks/:latestLabel` 載入；修正 `startBackendSync` callback 型別錯誤（stateObj 為 parsed object）；`seedData()` 僅在後端無資料時執行，避免種子快照污染 |
| **v3.5** | **P0 資料修正**：`exportAll()`/`importAll()` 補上 `members` key（原先遺漏）與 `resources.html` 獨立 localStorage 資料（`pgm_resources_entries` / `pgm_resources_charges`）；`stats(refDate?)` 新增選填參考日期參數，歷史週統計不再誤用今天日期。**P1 穩定性**：`listWeeks()` 加 sessionStorage 快取（TTL 60s）並在 `saveWeekState()` 時自動失效；`fetchReports()` 加 `AbortSignal.timeout(8000)`；`checkBackend()` 改為失敗後 30s 自動重試；歷史唯讀模式不再啟動 `startBackendSync`，防止誤寫歷史 JSON。 |
| **v3.6** | **P2 安全性**：後端新增 `requireAdminToken` 中介層（環境變數 `ADMIN_TOKEN`），保護 `DELETE /api/reports` 與 `POST /api/weeks/:weekLabel`；`api.js` 新增 `setAdminToken()`/`getAdminToken()`（sessionStorage），write API 自動帶入 `X-Admin-Token` header，401 時拋出 `code:'UNAUTHORIZED'`；`store.getApiKey()`/`setApiKey()` 改為 sessionStorage（防 API Key 長期暴露）。**P3 品質**：`store.delete()` 移除多餘 `_dispatch()`（原觸發兩次 `store:updated`）；`_uuid()` 改用 `crypto.randomUUID()`；`importAll()` 改為同時接受 string 或 object；`app-init.js` 步驟編號整理（1–10 順序）；`fetchReportContent()` 補 `AbortSignal.timeout(8000)`；`saveWeekState()` 補 `AbortSignal.timeout(10000)`。 |

---

| **v3.7** | **P1 緊急修正**：`_uuid()` 補 `crypto.getRandomValues` fallback，相容 Safari 14（`randomUUID` 要 15.4+，原 v3.6 會 crash）；`store.getApiKey()` 加一次性靜默遷移：首次呼叫若 sessionStorage 無值但 localStorage 有舊 key，自動搬移並清除 localStorage，使用者不需重新輸入 API Key；`startBackendSync` 401 時派出 `store:syncUnauthorized` 事件，`app-init.js` 接收後顯示紅色 Auth Banner（附 Console 指令說明），讓使用者明確知道資料未同步而非靜默失敗。 |

---

| **v3.8** | **P2 安全性**：`POST /api/reports` 加 `requireAdminToken`（S-5），防止未授權覆寫週報；`saveReport()` 改用 `_writeHeaders()`（自動帶 `X-Admin-Token`）並加 `AbortSignal.timeout(10000)`（S-6），同步補上 401 處理。 |
| **v3.9** | **D-1 資料架構**：新增私有 `_exportWeekObj()`，`startBackendSync` 改用此函式推週次資料（不含 `_resources`/`_resourceCharges`），防止跨季人力資料污染歷史週 JSON 並消除冗餘 `JSON.parse(exportAll())`（M-1）。**Quick wins**：`deleteReport()` 改用 `_writeHeaders()`（M-2）；`/read` endpoint 加 try/catch（M-3）；`app-init.js` 頂部過時註解更新（Q-9）；`ai.js` 移除未使用的 `s` 變數（M-5）。 |
| **v3.10** | **S-3 CORS 限縮**：`app.use(cors())` 改為讀取 `CORS_ORIGIN` 環境變數（逗號分隔 allowlist），未設定時維持開放（向下相容）；Railway 部署建議設 `CORS_ORIGIN=https://your-app.railway.app` 防跨站濫用。**Q-6 排除標記可設定**：後端 `GET /api/reports` 與 `GET /read` 的 `_v7` 硬編碼改為讀取 `REPORT_EXCLUDE_TAG` 環境變數（預設 `_v7`），允許未來更換週報格式版本標記而無需修改程式碼。 |
| **v3.11** | **P0**：`POST /api/state` 補 `requireAdminToken`（S-7），防止未授權覆寫跨瀏覽器共用 state；`store.importAll()` 加型別驗證（A-1），收到 `null`/非物件時提前回傳錯誤而非拋 TypeError 導致頁面初始化中斷。**P1**：`report.js _genCover()` 對 author 欄位套用 `_escMd()` 跳脫 Markdown 特殊字元（R-1）；`generateReport()` 的 `weekStart` 預設值改為動態計算當週 Monday，取代過期 hardcode 日期（R-2）；`seed.js` 的 `today` 基準改為 `new Date()`（D-2），讓逾期 / 未來日期隨當前日期動態計算。**P2**：`ui.js generateId()` 改用 `crypto.randomUUID()` + `getRandomValues` fallback，與 store.js 策略一致（S-8）；`seed.js` guard 條件改為檢查 `projects` 是否存在（M-6），防止 snapshots 存在但 projects 已清除時誤跳過 seed；標記 `ui.js weekLabel()` 為 deprecated（Q-11），統一使用 `store.weekLabel()`；移除 `schema.js` 中全站未使用的 `PROJECTS_CATALOG` dead code（Q-12）。 |
| **v3.12** | **週報產出流程 Bug 修正**：B-1 `weekSelect` 切週時即時同步 `weekBadge`，並在初始化時設定正確週次標籤，防止封面顯示過期 W11 預設值；B-2 `btnSaveCloud` 的元素 ID 由不存在的 `weekStart` 改為正確的 `weekSelect`（原為 crash 必現 bug，導致雲端儲存完全失效）；B-3 章節重生成（`regenSection`）改為以 `##` 標題為邊界的智能替換，找到對應章節則原地替換，找不到才 append，解決原本重複章節問題。 |
| **v3.13** | **UI/UX 優化第一輪（U-1～U-17）**：styled confirm modal 取代原生 `window.confirm`（U-1）；批次完成排除 blocked items（U-2/U-44）；刪除操作加 5 秒復原 toast（U-43，actions）；modal 開啟自動聚焦（U-30）；`btnLoading()` 工具函式（U-10）；`app-init.js` 加重試連線按鈕（U-21）；歷史模式加「🔒 唯讀」badge（U-48）；`toast()` 擴充 `onUndo` callback 支援（U-43）；風險升降級按鈕方向修正（U-6）；風險狀態改動加確認 modal 並可回滾 select（U-41）。 |
| **v3.14** | **UI/UX 優化第二輪（U-4～U-50）**：`deleteRisk` / `deleteMs` 加 5 秒復原視窗（U-43）；里程碑拖曳 `cursor:grab` 提示（U-7）；badge 加 `text-overflow:ellipsis` 防溢（U-40）；tab-btn 加副標題說明（U-9）；input.html 新增 `maxlength`（U-24）、`required`（U-25）、Enter 鍵儲存（U-29）、過去日期警告（U-22）；risks.html modal 加 `maxlength`（U-24）、autofocus（U-30）、Enter 鍵（U-29）、過去日期警告（U-22）；Action status badge 顯示下一狀態 tooltip（U-42）；KPI 卡加單位標示（U-34）；首頁空狀態加 CTA「新增第一個專案」按鈕（U-35）；週次選擇器後端離線時仍顯示佔位（U-4）；歷史週報區離線提示（U-49）；匯入按鈕加拖放 title 說明（U-50）；report.html 生成模式說明（U-11）、token 費用參考（U-16）。 |
| **v3.16** | **P0 資料安全修正**：**P0-1** `store.js _get()` 新增具名錯誤日誌 + 派出 `store:corrupt` 自訂事件，`app-init.js` 監聽後顯示紅色損壞警告 banner（含建議匯出備份說明）；**P0-2** `store.importAll()` 加入 schema 驗證（各 entity 必填欄位白名單），malformed items 被過濾並在 `{ok, skipped}` 回傳值中回報數量；**P0-3** `api.js saveWeekState()` 移除吞掉 error 的外層 try-catch，讓錯誤正確傳遞至 `store.startBackendSync` 的 `.catch()`；store.js 新增 `store:syncFailed` 事件（非 401 的網路/5xx 失敗），`app-init.js` 監聽後顯示可自動消失的橘色 banner；**P0-4** `app-init.js` 新增 `_initDirtyTracking()`：監聽全站 `input`/`change` 事件設定 dirty flag，`store:updated` 後清除；瀏覽器關閉/重新整理觸發 `beforeunload` 確認框；Navbar/麵包屑連結在 capture phase 攔截，dirty 時以 `window.confirm` 詢問確認。 |
| **v3.17** | **歷史週報中心 PDF 匯出**：`⬇ 下載` 按鈕更名為 `⬇ MD`；新增 `📥 PDF` 按鈕，點擊後自動抓取週報內容，以 `_filenameToWeekLabel()` 從檔名推算週次（YYMMDD → W??），呼叫 `export.js toPdf()` 以 A4 格式輸出含頁碼與頁尾的 PDF 並自動下載；按鈕具 loading 狀態（`⏳ 產生中…`），完成後 toast 通知。 |
| **v3.15** | **UI/UX 優化第三輪（V-1～V-18）**：**CSS**：必填欄位標籤加粗 + `*` 標示（V-1）；textarea min-height 提升至 120px + 字數計數器（warn/over 顏色提示）（V-4）；dark mode 次要/輔助文字對比度提升至 WCAG AA（V-8）；project-row / risk-row hover 加 box-shadow 邊框（V-9）；active navbar link 底部藍色 underline 指示器（V-18）。**行為**：全站手機 hamburger 選單（V-3，9 頁面 + layout.css）；Actions 新增 Action 日期欄預設為兩週後最近週五（V-5）；Quick Input owner select 加即時搜尋過濾輸入框（V-6）；review.html 評論框加字數計數器（V-4）；review.html Stepper 精簡為 4 步驟（V-12）；resources.html 搜尋過濾橫跨季度表與業務彙整表（V-13）；trends.html 圖表空狀態加 CTA 按鈕（V-15）；**導覽**：8 頁面加麵包屑返回路徑（V-14）；**表單驗證**：input.html / risks.html / actions.html 必填欄位加 `.inp--error` 紅框 + inline 錯誤訊息，取代純 toast 提示（V-2）；Actions 批次完成按鈕改為 btn-primary 並加描述性 title（V-11）。 |
| **v3.18** | **UI/UX 佈局與體驗優化**：**週報生成 (`report.html`)**：將原本擠壓內容的「AI 控制面板」調整為預設收合的 Floating Drawer，釋放中央預覽區空間；匯出按鈕由單選框改為緊湊的 Select 選單；空狀態新增「立即生成」CTA。**Action Items (`actions.html`)**：加入「篩選列（關鍵字、負責人、隱藏已完成）」；導入 SortableJS 支援拖曳排序；優化視覺層次（已完成項目刪除線與半透明）；將原本擁擠的「三欄式」調整為「滿版橫式列表」；新增按鈕置頂並可收合。**儀表板 (`index.html`)**：歷史週報中心改為「預設收合」的 Accordion 設計；清單項目升級為卡片化 (Card-based UI)，按鈕改為隱晦的 Ghost Button 以突顯資料層次。 |

---

*P&D Center Program Sync — Built for VIA Technologies P&D Center*
