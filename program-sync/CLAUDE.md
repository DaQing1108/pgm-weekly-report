# P&D Center Program Sync 週報管理系統
## 系統說明文件 v1 + v2 + v2.1

---

## 概覽

VIA Technologies P&D Center Program Sync 是一套前端單頁應用（SPA）週報管理系統，無需後端伺服器，所有資料儲存於瀏覽器 localStorage。

- **版本**: v2.4
- **目標用戶**: VIA P&D Center Program Manager 及各子組 Lead
- **技術堆疊**: 純 HTML5 + ES Modules + CSS Variables，無框架依賴

---

## 目錄結構

```
program-sync/
├── index.html          # 儀表板（v1）
├── input.html          # 快速輸入 + 批次解析（v1）
├── risks.html          # 風險管理（v1）+ 跨週齡 badge（v2.4）
├── actions.html        # Action Items（v1）+ 跨週齡 badge（v2.4）
├── milestones.html     # 里程碑時間軸（v1）
├── tracker.html        # 跨週未結項目追蹤（v2.4）
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
  project,                       // Dashboard 專案名稱（來自 store projects，optional）
  weekStart,
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
// 注意：project 欄位在資料模型中存在，但新增表單無此輸入，故永遠為空；時間軸不顯示此欄
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

---

## 功能說明

### v1 功能（index / input / risks / actions / milestones）

#### 儀表板（index.html）
- 4 個 KPI 卡片：健康度 % / 專案總數 / 高風險數 / 逾期 Action 數
- 左欄：專案列表，可按狀態篩選（Tab 切換），Tab 標籤為英文：All / On Track / At Risk / Behind / Paused
- 右欄：5×4 熱力圖（5 子組 × 1 組合健康 + 3 個專案）
- 右欄下：高風險決策事項卡片列表
- 首次載入自動呼叫 `seedData()` 填入種子資料
- 監聽 `store:updated` CustomEvent 自動重新渲染

##### `_isHistoryView` 旗標模式（v2.1）
區分「目前週（即時）」與「歷史週（快照）」的資料來源：
```javascript
let _isHistoryView = false;
function _displayProjects() {
  return _isHistoryView ? (_viewState?.projects || []) : store.getAll('projects');
}
// 在 loadWeekView() 中設定：
_isHistoryView = !isLatest;
```
- `_isHistoryView = false`：讀 `store.getAll()`（即時 localStorage）
- `_isHistoryView = true`：讀 `_viewState` 快照資料
- `store:updated` / `pageshow` / `storage` 事件僅在 `!_isHistoryView` 時觸發 `renderAll()`

##### 即時同步（v2.1）
```javascript
// bfcache（瀏覽器返回鍵）
window.addEventListener('pageshow', (e) => {
  if (e.persisted && !_isHistoryView) renderAll();
});
// 跨 tab localStorage 變更
window.addEventListener('storage', (e) => {
  if (e.key?.startsWith('pgm_sync_') && !_isHistoryView) renderAll();
});
```

#### 快速輸入（input.html）
- **快速更新模式**：下拉選擇現有專案，即時拖曳進度條預覽，可新增關聯風險
- **批次貼入模式**：支援 Slack / Email / JIRA / 純文字，呼叫 `parseText()` 解析，勾選確認後匯入

#### 風險管理（risks.html）
- 頂部 5 格統計條（總計 / 高 / 中 / 低 / 已關閉）
- 多條件篩選：
  - 等級：`.level-chip` 單選（高 / 中 / 低 / 全部）
  - 狀態：`.status-chip` **複數選**（開放中 / 處理中 / 已關閉 / 全部狀態）
  - 子組：下拉選單，第一選項為「Objectives」（即全部）
- 狀態篩選實作：`filterStatuses = new Set(['open'])`，切換邏輯：
  ```javascript
  if (status === 'all') {
    filterStatuses = new Set(['all']);
  } else {
    filterStatuses.delete('all');
    filterStatuses.has(status) ? filterStatuses.delete(status) : filterStatuses.add(status);
    if (filterStatuses.size === 0) filterStatuses = new Set(['all']);
  }
  ```
- Risk Row：5 欄 grid，inline 狀態選擇器，點擊展開顯示詳情
- 升降級按鈕（一鍵調整風險等級）
- `generateRiskSuggestions()` 自動分析並顯示建議 banner
- Modal 新增風險表單

#### Action Items（actions.html）
- 頂部整體完成率進度條（含逾期數）
- 三欄並排（技術 / 業務 / 資源），每欄獨立計數
- 點擊狀態 badge 循環切換：待辦 → 進行中 → 完成 → 阻塞
- 逾期 Action 自動添加 `.a-late` 樣式（紅色左邊框 + 紅底）
- 每欄底部有 inline 新增表單（僅有任務名稱 / 負責人 / 截止日）
- 批次完成按鈕

##### `project` 欄位（v2.1 修正）
- 編輯 Action Modal 中的「🔗 關聯專案」下拉
- 動態從 `store.getAll('projects')` 載入，列出 Dashboard 中的實際專案名稱
- value 存 `p.name`（字串），與 Dashboard 專案名稱一致
- 語意：「這個 action 屬於哪個具體專案」，非 Objectives 層級
- inline 新增表單無此欄位（project 為 optional）

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
- **注意**：`project` 欄位存在於資料模型但新增表單未提供輸入，時間軸不顯示此欄（v2.1 已移除 `· ${m.project}` 顯示邏輯）

### v2 功能（report / trends / review）

#### 週報預覽（report.html）—— 雙欄佈局（v2.2）
- **左側（260px）**：報告設定（週次/彙整人）/ 歷史週報引入 / 匯出（MD/DOCX/PDF）/ 儲存雲端
- **中間（1fr）**：Markdown 預覽（marked.js）/ 原始 MD 切換（可手動貼入或直接編輯）

> ⚠️ v2.2 已移除：API Key 設定、自動生成週報（本地/AI 模式）、語氣選擇、章節勾選、章節重生成、右側 AI 控制面板。

##### 歷史週報引入（後端連線時顯示）
- 列出後端可用歷史週報，勾選後點「引入至系統」
- `syncToStore()` 將解析結果（專案/風險/Action/里程碑）寫入 localStorage store

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

##### `_injectCurrentWeek()` 即時資料注入（v2.1）
歷史快照載入後，將最新週的 entry 替換為 live store 資料，確保圖表反映最新狀態：
```javascript
function _injectCurrentWeek() {
  if (!_latestWeek) return;
  const liveEntry = {
    weekLabel: _latestWeek.weekLabel,
    weekStart: _latestWeek.weekStart,
    snap:      null,            // snap=null → _computeMetrics 從原始資料重算
    projects:  store.getAll('projects'),
    risks:     store.getAll('risks'),
    actions:   store.getAll('actions'),
  };
  const idx = _allSnapshots.findIndex(s => s.weekLabel === liveEntry.weekLabel);
  if (idx >= 0) _allSnapshots[idx] = liveEntry;
  else { _allSnapshots.push(liveEntry); _allSnapshots.sort((a,b) => a.weekLabel.localeCompare(b.weekLabel)); }
}
```
監聽三個事件：`store:updated`、`pageshow`（bfcache）、`storage`（跨 tab）。

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

### 跨頁同步三件套（v2.1）
每個需要即時同步的頁面都應加上以下三個監聽器：
```javascript
// 1. 同 tab 內 store 變更（Quick Input → Dashboard 等）
window.addEventListener('store:updated', () => { if (!_isHistoryView) renderAll(); });

// 2. 瀏覽器返回鍵（bfcache：JS 狀態凍結，init 不重跑）
window.addEventListener('pageshow', (e) => {
  if (e.persisted && !_isHistoryView) renderAll();
});

// 3. 其他 tab 的 localStorage 變更（storage 事件不在修改者 tab 觸發）
window.addEventListener('storage', (e) => {
  if (e.key?.startsWith('pgm_sync_') && !_isHistoryView) renderAll();
});
```

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

- **13 個專案**：8 個 On Track / 2 個 At Risk / 1 個 Behind / 2 個 Paused
- **6 筆風險**：3 高 / 2 中 / 1 低
- **10 筆 Action**：技術 4 / 業務 4 / 資源 2，含 2 筆逾期（daysBefore）
- **6 個里程碑**：2026/03 — 2026/07
- **5 週快照**：W09–W13（2026/02/23 — 2026/03/30），onTrackPct 在 69%-83% 波動

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
- store.js 擴充：快照、草稿版本管理（API Key 方法於 v2.3 移除）
- ai.js / report.js Claude API 串流整合（於 v2.3 移除）

### v2.4
- **tracker.html**（新頁面）：跨週未結項目追蹤，顯示 weekStart < 當前週次且仍未完成的 Projects（at-risk/behind）、Risks（open/in-progress）、Actions（pending/in-progress/blocked）；統計摘要、子組篩選、三種排序、inline 狀態更新
- **跨週齡 badge**：risks.html / actions.html 的每筆列表項，若 `weekStart` < 當前週次則顯示「🕒 WXX · N週」浮標（1週藍 / 2週橘 / 3+週紅）
- **全站 navbar**：加入 Tracker 連結（位於 Milestones 與 Trends 之間），桌面 + 手機選單同步更新

### v2.3
- **全站 navbar**：移除所有頁面的「📝 生成週報」按鈕與 index.html 的「🔑 API Key」按鈕
- **ai.js / report.js**：整支刪除（AI 生成功能已移除，無任何頁面 import）
- **schema.js**：移除 `TONE_OPTIONS`、`REPORT_SECTIONS`（AI 生成功能死碼）
- **store.js**：移除 `getApiKey / setApiKey / clearApiKey / hasApiKey` 四個 API Key 方法
- **report.html**：加入「💾 儲存草稿」按鈕（呼叫 `store.newDraftVersion()`）；加入 `beforeunload` 離頁警告（有未儲存內容時觸發）；加入 `_isDirty` 旗標追蹤編輯狀態
- **review.html**：「此週次尚無草稿」空白狀態補 CTA，引導至週報編輯頁面
- **risks / actions / milestones.html**：補齊 `pageshow`（bfcache）與 `storage`（跨 tab）即時同步監聽器，與 index / trends 一致

### v2.2
- **report.html**：移除 API Key 設定、自動生成週報（本地/AI）、語氣選擇、章節勾選、章節重生成、右側 AI 控制面板；改為雙欄佈局（260px 左側 + 1fr 主區）；頁面定位為手動貼入 / 編輯 Markdown + 匯出

### v2.1
- **index.html**：專案狀態 Tab 標籤改為英文（All / On Track / At Risk / Behind / Paused）；`_isHistoryView` 旗標取代 `!_viewState` 判斷；加入 `pageshow`（bfcache）與 `storage`（跨 tab）即時同步監聽器
- **risks.html**：狀態篩選由單選下拉改為複數選 chip（`filterStatuses = new Set()`）；子組篩選第一選項改為「Objectives」
- **trends.html**：加入 `_injectCurrentWeek()` 將最新週替換為 live store 資料；加入 `store:updated`、`pageshow`、`storage` 三個同步監聽器
- **milestones.html**：移除時間軸中 `· ${m.project}` 顯示邏輯（project 欄位永遠為空）
- **actions.html**：編輯 Modal 的「關聯專案」下拉從 Objectives（TEAMS）固定清單改為 `store.getAll('projects')` 動態載入；移除 `import { TEAMS }`
