# P&D Center Program Sync 週報管理系統
## 系統說明文件 v1 + v2

---

## 概覽

VIA Technologies P&D Center Program Sync 是一套前端單頁應用（SPA）週報管理系統，無需後端伺服器，所有資料儲存於瀏覽器 localStorage。

- **版本**: v2.0
- **目標用戶**: VIA P&D Center Program Manager 及各子組 Lead
- **技術堆疊**: 純 HTML5 + ES Modules + CSS Variables，無框架依賴

---

## 目錄結構

```
program-sync/
├── index.html          # 儀表板（v1）
├── input.html          # 快速輸入 + 批次解析（v1）
├── risks.html          # 風險管理（v1）
├── actions.html        # Action Items（v1）
├── milestones.html     # 里程碑時間軸（v1）
├── report.html         # 週報生成（v2 三欄）
├── trends.html         # 趨勢分析（v2）
├── review.html         # 審核流程（v2）
├── CLAUDE.md           # 本文件
└── assets/
    ├── css/
    │   ├── base.css        # CSS 變數、Reset、工具類
    │   ├── components.css  # 所有 UI 元件
    │   └── layout.css      # 頁面版型、格線
    ├── data/
    │   ├── schema.js       # 靜態參考資料（Teams/Members/Projects）
    │   └── seed.js         # 種子資料（12專案/6風險/10Action）
    └── js/
        ├── store.js    # localStorage CRUD + 統計 + 快照
        ├── ui.js       # Toast / Modal / Badge 等 UI 工具
        ├── import.js   # 文字解析（Slack/Email/JIRA/Raw）
        ├── report.js   # 週報 Markdown 生成（9章節）
        ├── ai.js       # Claude API 整合（串流生成）
        ├── export.js   # DOCX + PDF 匯出
        └── trends.js   # Chart.js 圖表渲染
```

---

## 資料模型

### Projects
```javascript
{
  id, name, team, status,        // 'on-track'|'at-risk'|'behind'
  progress,                      // 0-100
  owner, weekDone, blockers,
  targetDate, category, weekStart,
  _createdAt, _updatedAt
}
```

### Risks
```javascript
{
  id, level,                     // 'high'|'medium'|'low'
  description, project, team,
  owner, dueDate, status,        // 'open'|'in-progress'|'closed'
  mitigation, weekStart,
  _createdAt, _updatedAt
}
```

### Actions
```javascript
{
  id, category,                  // 'technical'|'business'|'resource'
  task, owner, dueDate,
  status,                        // 'pending'|'in-progress'|'done'|'blocked'
  project, weekStart,
  _createdAt, _updatedAt
}
```

### Milestones
```javascript
{
  id, name, date, team,
  project, status,               // 'upcoming'|'done'|'delayed'
  weekStart, _order,
  _createdAt, _updatedAt
}
```

### WeeklySnapshots（v2）
```javascript
{
  id, weekStart, weekLabel,
  onTrackPct, atRiskCount, behindCount,
  highRisks, mediumRisks, lowRisks,
  totalProjects, overdueActions,
  completedActions, totalActions,
  teamHealth: { [teamId]: pct },
  reviewStatus, snapshotBy,
  _createdAt, _updatedAt
}
```

### Drafts（v2）
```javascript
{
  id, weekStart, version,
  content,                       // Markdown 字串
  reviewStatus,                  // 'draft'|'in-review'|'approved'|'rejected'
  author, reviewedBy, reviewedAt,
  reviewComment,
  _createdAt, _updatedAt
}
```

---

## localStorage Keys

所有資料以 `pgm_sync_` 前綴儲存：

| Key                   | 說明               |
|-----------------------|--------------------|
| `pgm_sync_projects`   | 專案陣列            |
| `pgm_sync_risks`      | 風險陣列            |
| `pgm_sync_actions`    | Action 陣列        |
| `pgm_sync_milestones` | 里程碑陣列          |
| `pgm_sync_snapshots`  | 週快照陣列          |
| `pgm_sync_drafts`     | 週報草稿陣列        |
| `pgm_sync_api_key`    | Anthropic API Key  |

---

## 功能說明

### v1 功能（index / input / risks / actions / milestones）

#### 儀表板（index.html）
- 4 個 KPI 卡片：健康度 % / 專案總數 / 高風險數 / 逾期 Action 數
- 左欄：專案列表，可按狀態篩選（Tab 切換），點擊展開詳情
- 右欄：5×4 熱力圖（5 子組 × 1 組合健康 + 3 個專案）
- 右欄下：高風險決策事項卡片列表
- 首次載入自動呼叫 `seedData()` 填入種子資料
- 監聽 `store:updated` CustomEvent 自動重新渲染

#### 快速輸入（input.html）
- **快速更新模式**：下拉選擇現有專案，即時拖曳進度條預覽，可新增關聯風險
- **批次貼入模式**：支援 Slack / Email / JIRA / 純文字，呼叫 `parseText()` 解析，勾選確認後匯入

#### 風險管理（risks.html）
- 頂部 5 格統計條（總計 / 高 / 中 / 低 / 已關閉）
- 多條件篩選：等級 chips + 狀態下拉 + 子組下拉
- Risk Row：5 欄 grid，inline 狀態選擇器，點擊展開顯示詳情
- 升降級按鈕（一鍵調整風險等級）
- `generateRiskSuggestions()` 自動分析並顯示建議 banner
- Modal 新增風險表單

#### Action Items（actions.html）
- 頂部整體完成率進度條（含逾期數）
- 三欄並排（技術 / 業務 / 資源），每欄獨立計數
- 點擊狀態 badge 循環切換：待辦 → 進行中 → 完成 → 阻塞
- 逾期 Action 自動添加 `.a-late` 樣式（紅色左邊框 + 紅底）
- 每欄底部有 inline 新增表單
- 批次完成按鈕

#### 里程碑（milestones.html）
- 垂直時間軸，月份分組標題
- 今日橘色虛線分隔線（`.today-marker`）：自動插入今日前後節點之間
- 里程碑節點顯示邏輯（`status` 優先，日期為輔）：
  - `status='delayed'` → ⚠️ `.milestone--delayed`（橘黃，無論日期）
  - `status='done'` 或 `date < today` → ✅ `.milestone--done`（綠）
  - `date === today` → 🎯 `.milestone--today`（橘）
  - `date > today`（且非 done/delayed）→ 📅 `.milestone--future`（藍）
- 點擊展開 inline 編輯面板：名稱輸入 + 日期選擇 + 狀態下拉 + 💾 儲存 / 刪除
  - 狀態切換即時存檔；名稱 / 日期需點「儲存」才寫入
  - 重繪時自動還原已展開的 detail（`renderAll` 記憶 openIds）
  - 歷史唯讀模式下編輯欄位與按鈕全部 `pointer-events:none`
- HTML5 Drag & Drop（僅限同天排序，交換 `_order` 欄位）
- 右欄月份概覽 + 子組分佈統計
- inline 新增表單

### v2 功能（report / trends / review）

#### 週報生成（report.html）—— 三欄佈局
- **左側（260px）**：報告設定（週次/彙整人）/ 章節勾選 / 格式選擇（MD/DOCX/PDF）/ 審核流程區
- **中間（1fr）**：Markdown 預覽（使用 marked.js）/ 原始 MD 切換 / 可直接編輯
- **右側（280px）**：API Key 狀態 / 生成模式（本地/AI）/ 語氣選擇 / 生成按鈕 / AI 狀態 / Token 計數 / 章節重生成

##### 本地生成流程
1. 選擇章節 + 語氣 + 週次 + 彙整人
2. 點擊「生成週報」
3. `generateReport()` 從 store 讀取資料，生成 9 章節 Markdown
4. marked.js 渲染到預覽區
5. 自動呼叫 `newDraftVersion()` 儲存草稿

##### AI 生成流程
1. 需先設定 API Key（`validateApiKey()` 驗證）
2. `buildContext()` 從 store 組裝 context JSON
3. `generateReportStream()` 串流呼叫 Claude API
4. 每個 chunk 即時渲染到預覽區
5. Token 計數顯示於右側

##### 匯出
- **MD**：直接下載 `.md` 檔案
- **DOCX**：動態載入 docx + FileSaver CDN，生成 Word 文件
- **PDF**：動態載入 marked + html2canvas + jsPDF CDN，截圖轉 PDF

#### 趨勢分析（trends.html）
- 週數選擇器：4 / 8 / 12 週
- 三個圖表（Chart.js 4）：
  - 整體健康度折線（onTrackPct，含顏色點）
  - 風險堆疊長條（High/Medium/Low）
  - Action 完成率折線（完成率 % + 逾期數雙軸）
- 各子組健康度折線（5 條線）
- 本週 vs 上週 KPI 對比卡片（含 diff-badge）
- 快照歷史列表
- 手動建立快照按鈕

#### 審核流程（review.html）——雙欄佈局
- 身份選擇器（Alex / Michael / Dream）
- 週次下拉（自動載入有草稿或快照的週次）
- **左側（35%）**：
  - Stepper 4 步驟：草稿建立 → 送出審核 → 審核中 → 已核准
  - 審核操作：填寫備註 + 核准/退回按鈕
  - 版本歷史列表（可切換查看歷史版本）
- **右側（65%）**：週報 Markdown 唯讀預覽（使用 marked.js）

**審核邏輯**：
- 核准：`reviewStatus = 'approved'` + 呼叫 `createSnapshot()` 建立快照
- 退回：`reviewStatus = 'rejected'`，必須填寫退回原因
- 退回草稿：重置為 `draft` 狀態，可重新修改後送審

---

## AI 整合（ai.js）

### API 端點
```
POST https://api.anthropic.com/v1/messages
Model: claude-sonnet-4-6
```

### Headers
```javascript
{
  'Content-Type': 'application/json',
  'x-api-key': '<USER_API_KEY>',
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true'
}
```

> 注意：直接從瀏覽器呼叫 Anthropic API 需要加上 `anthropic-dangerous-direct-browser-access: true` Header。

### 語氣選項
| 值         | 說明                           |
|------------|--------------------------------|
| `formal`   | 正式、專業，適合呈報上級        |
| `concise`  | 精簡要點，每項 2 行以內         |
| `executive`| 高管摘要，聚焦業務影響與決策    |
| `technical`| 技術細節，包含架構與指標        |

---

## CDN 依賴

| 套件         | 版本   | 用途           | CDN                              |
|--------------|--------|----------------|----------------------------------|
| marked.js    | 9.0.0  | Markdown 渲染   | jsDelivr                         |
| Chart.js     | 4.4.0  | 圖表            | jsDelivr                         |
| docx         | 8.5.0  | DOCX 生成       | jsDelivr（動態載入）             |
| file-saver   | 2.0.5  | 檔案下載        | jsDelivr（動態載入）             |
| html2canvas  | 1.4.1  | HTML 截圖       | cdnjs（動態載入）                |
| jsPDF        | 2.5.1  | PDF 生成        | cdnjs（動態載入）                |

DOCX / PDF 相關 CDN 僅在使用者點擊對應匯出按鈕時才動態載入，不影響初始載入速度。

---

## 開發指引

### 新增功能
1. 若需要新增資料類型，在 `store.js` 的 `exportAll()` 和 `importAll()` 中加入新的 key
2. 新增 HTML 頁面時，需引入三個 CSS 檔案，並在 navbar 加入對應連結
3. 所有 JS 使用 ES Module（`type="module"`），import 路徑使用相對路徑

### store:updated 事件
所有頁面監聽 `window.addEventListener('store:updated', callback)` 來響應資料變更。
每次呼叫 `store.save()` 或 `store.delete()` 都會觸發此事件，`event.detail.key` 包含被更新的資料 key。

### 清除資料
在瀏覽器 Console 執行：
```javascript
// 清除所有資料
Object.keys(localStorage).filter(k => k.startsWith('pgm_sync_')).forEach(k => localStorage.removeItem(k));
// 或使用 store.clear()
```

---

## 子組資料

| ID             | 名稱           | Lead         | 顏色    |
|----------------|----------------|--------------|---------|
| `media-agent`  | Media Agent    | Steve Liu    | #4caf6e |
| `learnmode`    | LearnMode      | TC Peng      | #378add |
| `chuangzaoli`  | 創造栗          | Tonny Shen   | #e4a23c |
| `tv-solution`  | TV Solution    | Tom Liu      | #9c6fcc |
| `healthcare`   | BU2 Healthcare | Tonny Shen   | #d94f4f |

---

## 種子資料概覽

- **12 個專案**：9 個 On Track / 2 個 At Risk / 1 個 Behind
- **6 筆風險**：3 高 / 2 中 / 1 低
- **10 筆 Action**：技術 4 / 業務 4 / 資源 2，含 2 筆逾期
- **6 個里程碑**：2026/03 — 2026/07
- **8 週快照**：2026/01/26 — 2026/03/16，onTrackPct 在 68%-88% 波動

---

## 瀏覽器相容性

- Chrome / Edge 90+（建議）
- Firefox 88+
- Safari 14+

需要支援：ES2020（optional chaining, nullish coalescing）、CustomEvent、ResizeObserver

---

## 版本歷程

### v1.0
- index / input / risks / actions / milestones 五個頁面
- localStorage CRUD
- 種子資料
- 基礎 CSS 系統

### v2.0
- report.html 三欄佈局 + AI 生成 + DOCX/PDF 匯出
- trends.html Chart.js 趨勢圖表
- review.html Stepper 審核流程
- store.js 擴充：快照、草稿版本、API Key 管理
- ai.js Claude API 串流整合
