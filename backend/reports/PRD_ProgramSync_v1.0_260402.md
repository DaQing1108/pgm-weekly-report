# PRD — P&D Center Program Sync 週報管理系統

> **文件類型**：Product Requirements Document（PRD）
> **版本**：v1.0
> **撰寫日期**：2026/04/02
> **撰寫人**：Alex Liao（PgM）
> **審核對象**：Michael、黎博、Engineering Team
> **狀態**：Draft

---

## 目錄

1. [產品概述](#1-產品概述)
2. [問題陳述](#2-問題陳述)
3. [目標用戶與使用情境](#3-目標用戶與使用情境)
4. [目標與非目標](#4-目標與非目標)
5. [User Stories](#5-user-stories)
6. [功能需求規格](#6-功能需求規格)
7. [非功能需求](#7-非功能需求)
8. [資料模型規格](#8-資料模型規格)
9. [API 規格](#9-api-規格)
10. [UIUX 設計原則](#10-uiux-設計原則)
11. [成功指標](#11-成功指標)
12. [未來藍圖](#12-未來藍圖)
13. [已知限制與風險](#13-已知限制與風險)
14. [Open Questions](#14-open-questions)

---

## 1. 產品概述

### 1.1 產品背景

VIA Technologies P&D Center 擁有 6 個子組、超過 39 名工程師（TW 8 人、CN 31 人），每週需彙整各子組的專案進度、風險、行動事項與里程碑，產出一份結構化週報供部門主管決策參考。

在導入本系統之前，PM（Alex）每週耗費 3–5 小時以手動方式蒐集各子組 Lead 回報的 Slack 訊息、Email 更新與 JIRA 備註，再以 Word 文件格式撰寫週報，過程中面臨：

- **資料分散、蒐集費時**：各子組回報格式不一，PM 需逐一整合
- **版本混亂**：週報存於個人電腦，無法跨裝置協作與歷史查詢
- **缺乏即時可視化**：主管無法即時掌握各專案健康度與風險趨勢
- **AI 潛力未發揮**：重複性文字彙整工作可由 AI 自動化

### 1.2 產品定義

**P&D Center Program Sync** 是一套前後端分離的週報管理與專案追蹤平台，整合：

- **即時儀表板**：可視化各子組專案健康度
- **多模式資料輸入**：快速更新 / 批次貼入（Slack/Email/JIRA 解析）
- **AI 輔助週報生成**：Claude claude-sonnet-4-6 串流生成 9 章節週報
- **審核流程**：草稿 → 送審 → 核准 4 步驟 Stepper
- **歷史資料歸檔**：git 持久化週次快照，支援跨週趨勢分析
- **人力資源管理**：6 季度 × 5 產品線資源分配 CRUD

### 1.3 技術棧概覽

| 層次 | 技術 |
|------|------|
| 前端 | Vanilla HTML5 + ES Modules，無框架依賴 |
| 資料持久化 | localStorage（即時）+ backend git JSON（持久） |
| 後端 | Node.js + Express |
| AI 引擎 | Anthropic Claude API（claude-sonnet-4-6，SSE 串流） |
| 圖表 | Chart.js 4.4.0 |
| 匯出 | docx + jsPDF + html2canvas |
| 部署 | Railway.app（Docker 容器，CI/CD） |

---

## 2. 問題陳述

**P&D Center PM 每週花費 3–5 小時手動彙整各子組進度報告，過程中資料分散、版本混亂、主管缺乏即時可視性，且重複性文字工作完全依賴人力。**

**受影響者**：Program Manager（每週高頻痛點）、各子組 Lead（回報格式不統一，重複填寫）、部門主管（週報延遲或資訊不完整，影響決策品質）。

**不解決的代價**：週報延遲影響主管決策節奏；PM 將大量時間消耗在格式整理而非策略分析；跨週趨勢無法累積，組織學習能力受限。

---

## 3. 目標用戶與使用情境

### 3.1 用戶角色定義

| 角色 | 代表人物 | 使用頻率 | 核心需求 |
|------|---------|---------|---------|
| **Program Manager** | Alex Liao | 每日 | 彙整進度、產出週報、追蹤風險與行動 |
| **子組 Lead** | Steve Liu / TC Peng / Tom Liu / Tonny Shen | 每週 1–3 次 | 更新本組專案狀態、里程碑、風險 |
| **部門主管** | Michael / 黎博 | 每週 1 次 | 審核週報、掌握風險、了解資源配置 |

### 3.2 使用情境（Use Cases）

**情境 A｜週一更新（子組 Lead）**
> Steve（Media Agent Lead）開啟 Quick Input，在下拉選單中選取「Olapedia 1.0」，拖曳進度條至 88%，在「本週完成」欄填入重點成果，關聯一筆風險後儲存。整個流程 < 3 分鐘。

**情境 B｜批次貼入（Program Manager）**
> Alex 從 Slack 頻道複製 5 則更新訊息，貼入 Quick Input 的批次模式文字框，系統自動解析識別出 3 個專案更新、2 筆風險，Alex 勾選確認後一鍵匯入。

**情境 C｜週五生成週報（Program Manager）**
> Alex 開啟 report.html，選擇「AI 生成」模式、語氣「高管 Executive」，點擊生成，Claude claude-sonnet-4-6 串流輸出 9 章節週報，Alex 微調後上傳至後端存檔，送出 review.html 審核。

**情境 D｜主管審核（Michael）**
> Michael 開啟 review.html，查看 Markdown 預覽，填寫審核備註後點擊「核准」，系統自動建立當週快照，週次資料永久歸檔。

**情境 E｜趨勢回顧（主管季度檢視）**
> 黎博 開啟 trends.html，選擇「12 週」範圍，查看健康度折線圖從 88% 下滑至 71% 的趨勢，以及 Media Agent 人月從 40mm 提升至 57mm 的資源消長。

---

## 4. 目標與非目標

### 4.1 目標

1. **效率目標**：PM 每週週報彙整時間從 3–5 小時縮短至 ≤ 1 小時
2. **可視化目標**：主管可在 < 30 秒內掌握當週各子組健康度與高風險事項
3. **一致性目標**：各子組 Lead 使用統一格式回報，週報品質標準差縮小
4. **歷史追蹤目標**：所有週次資料永久歸檔，支援 N 週趨勢查詢
5. **AI 自動化目標**：≥ 70% 的週報章節由 AI 初稿生成，PM 僅需微調

### 4.2 非目標（Out of Scope for v1）

| 非目標 | 不納入原因 |
|--------|-----------|
| 用戶登入與權限管理 | 導入複雜度高，目前用戶規模小（< 20 人），不值得 v1 投入 |
| 與 JIRA / GitHub 自動同步 | API 整合成本高，批次貼入解析已滿足 80% 需求 |
| 行動裝置（Mobile App） | P&D Center 工作場景以桌面為主 |
| 多組織 / 多部門支援 | 當前只需服務 VIA P&D Center 一個部門 |
| 電子郵件通知推送 | 現有 Slack 通知已足夠，不重複建設 |
| 財務預算管理 | 超出週報系統範疇，應由獨立 ERP 系統負責 |

---

## 5. User Stories

### 5.1 Program Manager（Alex）

- **US-01**：身為 PM，我想在儀表板一眼看到所有子組的健康度 KPI，以便在 < 30 秒判斷本週是否有需緊急處理的風險。
- **US-02**：身為 PM，我想將多則 Slack 訊息批次貼入系統並自動解析為結構化資料，以便省去手動逐筆輸入的時間。
- **US-03**：身為 PM，我想選擇語氣風格後點擊一個按鈕，由 AI 串流生成完整週報草稿，以便我只需微調而非從頭撰寫。
- **US-04**：身為 PM，我想把已核准的週報歸檔至後端 git，以便未來可以查詢任意歷史週的完整狀態。
- **US-05**：身為 PM，我想查看跨 12 週的健康度趨勢圖，以便在季度回顧中呈現部門整體走向。
- **US-06**：身為 PM，我想在 Actions 頁面直接切換週次查看歷史資料，且歷史週進入唯讀模式，以防止誤改過去資料。

### 5.2 子組 Lead（Steve / TC / Tom / Tonny）

- **US-07**：身為子組 Lead，我想在下拉選單中快速找到我負責的專案並更新進度，而不需要填寫不相關的欄位。
- **US-08**：身為子組 Lead，我想以拖曳方式設定專案完成率，或選擇「依 Actions 自動計算」，以便靈活選擇適合的管理方式。
- **US-09**：身為子組 Lead，我想在里程碑時間軸上拖曳調整同日里程碑的順序，以便反映實際優先序。
- **US-10**：身為子組 Lead，我想新增風險時填寫「因應方案」，以便主管可以即時了解風險緩解狀況。

### 5.3 部門主管（Michael / 黎博）

- **US-11**：身為主管，我想在 review.html 上以 Stepper 流程核准週報，並填寫審核備註，以便讓 PM 知道週報是否符合標準。
- **US-12**：身為主管，我想在儀表板看到「需決策事項」卡片清單，以便快速定位需要我介入的高風險項目。
- **US-13**：身為主管，我想查看人力資源管理頁面的跨季趨勢（▲▼差值），以便掌握各產品線人月消長。
- **US-14**：身為主管，我想切換到歷史週次查看當時的快照資料，以便追溯過去決策的背景。

---

## 6. 功能需求規格

### 6.1 Dashboard（index.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-01 | KPI 卡片 × 4（健康度 % / 進行中專案 / 需關注專案 / 逾期 Actions） | 顏色邏輯：≥80% 綠 / ≥60% 黃 / <60% 紅；資料來源：store 即時計算 |
| F-02 | 專案進度總覽列表，支援狀態 Tab 篩選（全部/正常/風險/落後/暫緩）與子組下拉篩選 | 兩個篩選器可同時組合；點擊列展開詳情（本週完成/阻塞/負責人/目標日期） |
| F-03 | 週次切換器（查看歷史週次），切換後其他子頁面同步跟進 | 使用 sessionStorage `pgm_viewWeek` 跨頁同步；歷史模式顯示黃色 banner |
| F-04 | 需決策事項：自動篩選 `level=high && status≠closed` 的風險 | 最多顯示 5 筆；點擊可展開詳情 |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-05 | 歷史週報中心：後端連線時自動列出歷史 .md 檔，支援線上預覽（marked.js）、下載 |
| F-06 | 逾期 Actions 歷史模式使用快照 `overdueActions` 欄位，而非今日日期計算 |

---

### 6.2 Quick Input（input.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-10 | 快速更新模式：下拉選取現有專案，自動填入現有資料，拖曳進度條（0–100%） | 支援 `auto`（依 Actions 完成率）/ `manual` 兩種進度模式 |
| F-11 | 新增專案：輸入名稱 / 子組 / 目標日期，即時建立 | 建立後自動出現在下拉清單 |
| F-12 | 批次貼入模式：自動識別 Slack / Email / JIRA / 純文字格式 | 解析後顯示勾選清單，用戶確認後批次匯入 |
| F-13 | 成員管理面板：新增 / 編輯 / 刪除成員，所有「負責人」下拉從此載入 | 刪除時 confirm 確認 |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-14 | 關聯風險新增：在同一個快速更新介面同時新增相關風險（等級 + 描述） |
| F-15 | 編輯現有專案基本資料（名稱/子組/目標日期）與刪除專案 |

---

### 6.3 Action Items（actions.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-20 | 整體完成率進度條（done/total），含逾期數顯示 | 顏色：≥80% 綠 / ≥50% 黃 / <50% 紅 |
| F-21 | 三欄面板（⚙️ 技術 / 📋 業務 / 👥 資源），各欄獨立計數 | 每欄底部有 inline 新增表單 |
| F-22 | 點擊狀態 Badge 循環切換：待辦 → 進行中 → 完成 → 阻塞 | 切換後即時更新，不需重整頁面 |
| F-23 | 逾期樣式：`.a-late`（紅色左邊框 + 紅色日期 + ⚠️） | 依截止日期 vs 今日自動判斷 |
| F-24 | 週次選擇器（navbar 下方），切換後 reload，歷史週進入唯讀模式 | 唯讀模式：新增表單 / 編輯 / 刪除按鈕 `opacity:0.35; pointer-events:none` |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-25 | 批次完成：將所有「進行中」Actions 一鍵標記為完成（含 confirm 確認） |
| F-26 | 編輯 Action Modal：可修改任務名稱、所屬專案、分類、狀態、負責人、截止日 |

---

### 6.4 Milestones（milestones.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-30 | 垂直時間軸，依月份分組，顯示日期 / 名稱 / 子組 / 專案 | 已完成 ✅ / 今日 🎯 / 未來 📅 三種狀態 |
| F-31 | 週次選擇器 + 歷史唯讀保護 | 同 F-24 規格 |
| F-32 | 子組篩選下拉，依子組過濾時間軸 | — |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-33 | HTML5 Drag & Drop 排序（僅限同日里程碑，交換 `_order` 欄位） |
| F-34 | 右欄：月份概覽（完成率進度條）/ 子組分佈統計圓點圖 |

---

### 6.5 Risks（risks.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-40 | 5 格統計條（總計 / 高 / 中 / 低 / 已關閉） | 實時從 store 計算 |
| F-41 | 多條件篩選：等級 chips × 狀態下拉 × 子組下拉 | 三個篩選器可同時組合 |
| F-42 | 新增風險 Modal（等級 / 子組 / 描述 / 關聯專案 / 負責人 / 截止日 / 因應方案） | 描述為必填 |
| F-43 | 週次選擇器 + 歷史唯讀保護 | 同 F-24 規格 |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-44 | AI 建議 Banner：自動偵測「逾期高風險」/「14 天未處理中風險」/「無因應方案高風險」 |
| F-45 | 升降級操作：一鍵調整風險等級（含 confirm 確認） |

---

### 6.6 Trends（trends.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-50 | 4 / 8 / 12 週範圍切換，即時更新所有圖表 | — |
| F-51 | 本週 vs 上週 KPI 對比（健康度 / 高風險 / 中風險 / 逾期 Actions），含 ▲▼ diff 標籤 | 差值 = 本週值 − 上週值；正差綠 / 負差紅 |
| F-52 | 健康度折線圖（`onTrackPct`），點顏色依健康度自動著色 | ≥80% 綠 / ≥60% 黃 / <60% 紅 |
| F-53 | 風險堆疊長條圖（高/中/低 分色） | 使用 Chart.js 堆疊模式 |
| F-54 | Action 完成率雙軸圖（折線：完成率 % / 長條：逾期數） | — |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-55 | 週次快照明細表（倒序列出，含健康度 / 專案數 / 風險數 / Action 完成比） |

---

### 6.7 Resources（resources.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-60 | 季度總覽 Tab：6 季度切換（25Q1–26Q2），顯示各產品線 CN/TW/JP/Total 人月 + MBO 目標 | 合計列；KPI 統計條（Total/CN/TW 人月）；首次載入自動填入種子資料 |
| F-61 | 季度條目 CRUD：新增（Modal，CN+TW+JP 自動計算 Total）/ 編輯 / 刪除 | 刪除 confirm 確認 |
| F-62 | 業務分配 Tab：24H2 / 25H1 / 25H2 三期間地區 FTE 分配（AI Learning / VED / 電視台 / Media Agent / BU2） | 各期間欄位結構不同，動態渲染表頭 |
| F-63 | 業務分配 CRUD（同 F-61 規格） | — |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-64 | 人力趨勢 Tab：跨季矩陣（▲▼ diff 標籤）+ 趨勢觀察文字 |
| F-65 | 季度條目可匯出為 CSV / Excel |

---

### 6.8 Report（report.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-70 | 三欄佈局（設定 260px / 預覽 1fr / AI 控制 280px） | 設定欄：週次選擇、彙整人、章節勾選；預覽欄：marked.js 渲染 + 可編輯原始 MD |
| F-71 | 本地生成：`generateReport()` 從 store 讀取資料，生成 9 章節 Markdown | 封面 / Executive Summary / 專案進度 / 子組進度 / 決策與風險 / 下週計畫 / Risk Register / Action Items / 里程碑 |
| F-72 | AI 生成：Claude claude-sonnet-4-6 SSE 串流，語氣選項（正式 / 簡潔 / 高管 / 技術） | 串流即時渲染；Token 計數顯示；各章節可單獨重新生成 |
| F-73 | 週次下拉動態從後端 `listWeeks()` 載入 | 後端離線時顯示「後端未連線」 |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-74 | DOCX 匯出（docx + FileSaver，動態 CDN 載入） |
| F-75 | PDF 匯出（html2canvas + jsPDF，動態 CDN 載入） |
| F-76 | 雲端儲存：POST `/api/reports` 上傳 Markdown 至後端 |

---

### 6.9 Review（review.html）

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-80 | 4 步驟 Stepper：草稿建立 → 送出審核 → 審核中 → 已核准 | 步驟狀態以顏色圓點呈現；當前步驟高亮 |
| F-81 | 核准操作：`reviewStatus = 'approved'`，自動呼叫 `createSnapshot()` 建立週次快照 | 快照寫入 `pgm_sync_snapshots` |
| F-82 | 退回操作：`reviewStatus = 'rejected'`，退回原因為必填 | — |
| F-83 | 右側 Markdown 唯讀預覽（marked.js） | — |

#### Nice-to-Have（P1）

| 需求 ID | 描述 |
|---------|------|
| F-84 | 版本歷史列表：可切換查看歷史版本的 Markdown 內容 |

---

### 6.10 跨頁面共用功能

#### Must-Have（P0）

| 需求 ID | 描述 | 驗收標準 |
|---------|------|---------|
| F-90 | 統一 Navbar（7 連結）：Dashboard / Quick Input / Risks / Action Items / Milestones / Review / Resources | 所有 9 個頁面 Navbar 一致 |
| F-91 | Navbar 週次 Badge：顯示當前瀏覽週次標籤（如 W14） | `id="weekBadge"` 由 `_syncWeekBadge()` 更新 |
| F-92 | app-init.js 統一初始化：loading overlay / 週次載入 / sessionStorage 跨頁 context | 後端離線時顯示紅色 ⚠ 離線 banner |
| F-93 | 後端離線時自動 fallback 至 localStorage 資料，不顯示空頁 | — |

---

## 7. 非功能需求

### 7.1 效能

| 指標 | 目標值 |
|------|--------|
| 初始頁面載入（LCP） | ≤ 2 秒（後端可用時） |
| 資料渲染（store → DOM） | ≤ 200ms（任意頁面） |
| AI 生成首字延遲（TTFT） | ≤ 3 秒（Claude API 回應時間） |
| 週次切換（reload） | ≤ 1.5 秒 |
| Chart.js 圖表渲染 | ≤ 500ms |

### 7.2 可靠性

- 後端離線時，前端應顯示明確提示，並繼續以 localStorage 資料運作（降級不崩潰）
- sessionStorage 設計防止跨週次快取污染（`pgm_viewWeek` stale 自動清除）
- `startBackendSync` guard flag 防止多重 listener 累積

### 7.3 安全性

| 風險點 | 現況 | 建議（v2） |
|--------|------|-----------|
| API Key 儲存 | localStorage（明文） | 改為 sessionStorage，每次重整清除 |
| 後端刪除無驗證 | 任何請求可刪除週報 | 加 ADMIN_TOKEN 環境變數驗證 |
| innerHTML XSS | 有 `_escHtml()` 但覆蓋不完全 | 統一改用 textContent 或完整 escape |
| 後端路徑注入 | `path.basename()` 已防護 | 改為白名單正則 `[a-zA-Z0-9_-]` |

### 7.4 瀏覽器相容性

| 瀏覽器 | 最低版本 |
|--------|---------|
| Chrome / Edge | 90+（建議） |
| Firefox | 88+ |
| Safari | 14+ |

**必須支援的 JS 特性**：ES2020 Optional Chaining、Nullish Coalescing、CustomEvent、ResizeObserver、ES Modules

### 7.5 資料容量

| 資料類型 | 預估體積 | localStorage 限制 |
|---------|---------|-----------------|
| 所有 pgm_sync_* 合計 | < 1MB | 5MB（Chrome） |
| 單週 JSON 檔 | 15–30KB | git 無限制 |
| 週報 Markdown | 20–50KB/份 | 後端磁碟 |

---

## 8. 資料模型規格

### 8.1 Projects

```typescript
interface Project {
  id: string;              // UUID（generateId()）
  name: string;            // 專案名稱（必填）
  team: TeamId;            // 子組 ID
  status: 'on-track' | 'at-risk' | 'behind' | 'paused';
  progress: number;        // 0–100（完成百分比）
  progressMode: 'auto' | 'manual';  // auto = 依 Actions 完成率
  owner: string;           // 負責人姓名
  weekDone: string;        // 本週完成事項（Markdown 文字）
  blockers: string;        // 阻塞項目
  targetDate: string;      // 目標完成日（ISO 8601）
  category: string;        // 專案分類
  weekStart: string;       // 記錄週起始日（YYYY-MM-DD）
  _source?: 'history';     // 來源標記
  _createdAt: string;
  _updatedAt: string;
}
```

**localStorage Key**：`pgm_sync_projects`

---

### 8.2 Risks

```typescript
interface Risk {
  id: string;
  level: 'high' | 'medium' | 'low';
  description: string;     // 必填
  project: string;
  team: TeamId;
  owner: string;
  dueDate: string;
  status: 'open' | 'in-progress' | 'closed';
  mitigation: string;      // 因應方案
  weekStart: string;
  _createdAt: string;
  _updatedAt: string;
}
```

**localStorage Key**：`pgm_sync_risks`

---

### 8.3 Actions

```typescript
interface Action {
  id: string;
  category: 'technical' | 'business' | 'resource';
  task: string;            // 必填
  owner: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'done' | 'blocked';
  project: string;
  weekStart: string;
  _createdAt: string;
  _updatedAt: string;
}
```

**localStorage Key**：`pgm_sync_actions`

---

### 8.4 Milestones

```typescript
interface Milestone {
  id: string;
  name: string;            // 必填
  date: string;            // 預定日期（ISO 8601）
  team: TeamId;
  project: string;
  status: 'upcoming' | 'done' | 'delayed';
  weekStart: string;
  _order?: number;         // 同日拖曳排序
  _createdAt: string;
  _updatedAt: string;
}
```

**localStorage Key**：`pgm_sync_milestones`

---

### 8.5 WeeklySnapshots

```typescript
interface WeeklySnapshot {
  id: string;              // 'snap-YYYY-MM-DD'
  weekStart: string;       // 週起始日（此快照的記錄基準日）
  weekLabel: string;       // 'W14'
  onTrackPct: number;      // 健康度 %
  atRiskCount: number;
  behindCount: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  totalProjects: number;
  overdueActions: number;  // 以 weekStart 為基準日計算，非今日
  completedActions: number;
  totalActions: number;
  teamHealth: Record<TeamId, number>;  // 各子組健康度
  reviewStatus: 'draft' | 'approved';
  snapshotBy: string;
  _createdAt: string;
  _updatedAt: string;
}
```

**localStorage Key**：`pgm_sync_snapshots`
**Backend**：`backend/data/weeks/W{N}.json` 的 `snapshots[]` 陣列

---

### 8.6 Drafts

```typescript
interface Draft {
  id: string;
  weekStart: string;
  version: number;         // 1, 2, 3…
  content: string;         // 完整週報 Markdown
  reviewStatus: 'draft' | 'in-review' | 'approved' | 'rejected';
  author: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;  // 退回時必填
  _createdAt: string;
  _updatedAt: string;
}
```

**localStorage Key**：`pgm_sync_drafts`

---

### 8.7 Resources（人力資源）

```typescript
interface ResourceEntry {
  id: string;
  quarter: '25Q1'|'25Q2'|'25Q3'|'25Q4'|'26Q1'|'26Q2';
  productLine: string;
  cn: number;              // 大陸人月
  tw: number;              // 台灣人月
  jp: number;              // 日本人月
  total: number;           // CN + TW + JP
  mbo: string;             // MBO 目標（每行一項）
  remark: string;
}

interface BusinessCharge {
  id: string;
  period: '24H2'|'25H1'|'25H2';
  area: string;            // 地區（TW / 武漢 / 上海 / USA）
  aiLearning: number;      // AI Learning RD Center FTE
  ved: number;             // VED FTE
  tvProject: number;       // 電視台專案 FTE
  mediaAgent: number;      // Media Agent FTE
  bu2: number;             // BU2 Healthcare FTE
  charged?: number;        // Charge AI Learning（24H2 專用）
  notes: string;
}
```

**localStorage Keys**：`pgm_resources_entries` / `pgm_resources_charges`

---

### 8.8 子組 ID 對照表

| TeamId | 顯示名稱 | Lead | 代表色 |
|--------|---------|------|--------|
| `media-agent` | Media Agent | Steve Liu | #4caf6e |
| `learnmode` | LearnMode | TC Peng | #378add |
| `chuangzaoli` | 創造栗 | Tonny Shen | #e4a23c |
| `tv-solution` | TV Solution | Tom Liu | #9c6fcc |
| `healthcare` | BU2 Healthcare | Tonny Shen | #d94f4f |
| `org-mgmt` | 組織管理 | — | #6b7280 |

---

## 9. API 規格

### 9.1 端點總覽

| Method | 路徑 | 說明 | 認證 |
|--------|------|------|------|
| `GET` | `/api/health` | 健康檢查 | 無 |
| `GET` | `/api/weeks` | 取所有已歸檔週次清單（含 weekLabel / weekStart / onTrackPct） | 無 |
| `GET` | `/api/weeks/:weekLabel` | 取指定週次完整狀態 JSON | 無 |
| `POST` | `/api/weeks/:weekLabel` | 歸檔指定週次完整狀態（寫入 git） | 無（v2 需加驗證） |
| `GET` | `/api/reports` | 取歷史週報清單（.md 檔） | 無 |
| `GET` | `/api/reports/:filename` | 取指定週報 Markdown 內容 | 無 |
| `POST` | `/api/reports` | 上傳新週報 Markdown | 無（v2 需加驗證） |
| `DELETE` | `/api/reports/:filename` | 刪除週報 | 無（v2 需加 token） |
| `GET` | `*` | SPA Fallback（回傳 index.html） | — |

### 9.2 主要請求 / 回應格式

**GET /api/weeks**
```json
[
  {
    "weekLabel": "W14",
    "weekStart": "2026-03-30",
    "projectCount": 17,
    "onTrackPct": 71
  }
]
```

**GET /api/weeks/:weekLabel**
```json
{
  "weekStart": "2026-03-30",
  "projects": [...],
  "risks": [...],
  "actions": [...],
  "milestones": [...],
  "snapshots": [...],
  "drafts": [...],
  "_exportedAt": "2026-04-02T00:00:00Z",
  "_version": "2.0"
}
```

**POST /api/reports**
```json
{
  "filename": "Pgm_Weekly_Report_260402.md",
  "content": "# P&D Center Weekly Report..."
}
```

### 9.3 限制與防護

- Payload 上限：2MB（`express.json({ limit: '2mb' })`）
- 僅接受 `.md` 副檔名（週報）、`.json` 副檔名（週次）
- 路徑防護：`path.basename()` 防止路徑遍歷攻擊
- Rate Limiting：v2 計畫導入 `express-rate-limit`

---

## 10. UI/UX 設計原則

### 10.1 設計系統

- **無框架**：純 CSS Variables + Grid/Flexbox，三個 CSS 檔案（base / components / layout）
- **黑暗模式優先**：主色調為深色背景（`--color-bg-primary`），高對比文字
- **色彩語義**：綠（on-track/success）/ 黃（at-risk/warning）/ 紅（behind/danger）/ 藍（info）

### 10.2 互動原則

| 原則 | 實作方式 |
|------|---------|
| **即時回饋** | 所有操作 200ms 內顯示 Toast 通知 |
| **非破壞性確認** | 刪除、批次完成等不可逆操作需 `window.confirm()` |
| **漸進揭露** | 列表預設摺疊，點擊展開詳情，減少視覺雜訊 |
| **狀態恢復** | 頁面 reload 後 sessionStorage 保留週次 context |
| **Loading 保護** | 所有頁面 init 期間顯示 loading overlay，防止用戶在資料載入前操作 |

### 10.3 無障礙

- 所有操作按鈕有 `title` 屬性（hover tooltip）
- 顏色不作為唯一狀態指示（搭配文字或圖示）
- 表單欄位有對應 `label`

### 10.4 響應式

- 目標設備：桌面（1280px+），不需支援手機
- 主要版型：固定左欄 + 彈性右欄、`main-grid`（2欄）、`grid-3`（3欄）

---

## 11. 成功指標

### 11.1 Leading Indicators（短期，1–4 週）

| 指標 | 基準值 | 目標值 | 衡量方式 |
|------|--------|--------|---------|
| 週報產出時間 | 3–5 小時 / 週 | ≤ 1 小時 / 週 | PM 主觀計時 |
| AI 生成採用率 | 0% | ≥ 70% | 觀察 report.html 使用模式 |
| 各子組 Lead 每週更新頻率 | 不固定 | ≥ 1 次 / 週 / 人 | store 更新時間戳 |
| 週報準時率（週五前核准） | ~60% | ≥ 85% | review.html 核准時間戳 |

### 11.2 Lagging Indicators（長期，4–12 週）

| 指標 | 目標值 | 衡量方式 |
|------|--------|---------|
| 主管週報滿意度（1–5 分） | ≥ 4.0 | 季度 survey |
| 高風險事項平均處理週期 | ≤ 2 週 | risks.html 狀態記錄 |
| 連續歸檔週次數（不斷檔） | ≥ 12 週 | backend/data/weeks/ 計數 |
| 趨勢頁面主管使用頻率 | ≥ 1 次 / 月 | 無 Analytics，主觀訪談 |

### 11.3 系統健康指標

| 指標 | 目標值 |
|------|--------|
| 後端可用率 | ≥ 99%（Railway SLA） |
| 頁面錯誤率（JS Exception） | < 1% |
| AI 生成成功率 | ≥ 95%（API Key 有效情況下） |

---

## 12. 未來藍圖

### Phase 2（2026 Q2–Q3）

| 功能 | 優先序 | 說明 |
|------|--------|------|
| API Key 安全儲存 | P0 | 改存 sessionStorage，後端不落地 |
| 後端 Admin Token 驗證 | P0 | 防止未授權刪除週報 / 週次 |
| 各頁週次切換器 | ✅ 已完成 | — |
| 離線提示 Banner | ✅ 已完成 | — |
| trends.html | ✅ 已完成 | — |

### Phase 3（2026 Q3–Q4）

| 功能 | 優先序 | 說明 |
|------|--------|------|
| 用戶身份識別（無登入，以 LocalStorage 記憶身份） | P1 | 讓週報知道「誰」更新了哪個欄位 |
| CSV 匯出（Actions / Milestones / Resources） | P1 | 讓 PM 可用 Excel 做進一步分析 |
| 各頁 Inline 週次切換後編輯歷史資料 | P2 | 目前歷史週為唯讀，需解除限制 |
| Rate Limiting（API 防護） | P1 | 防止惡意重複呼叫 |
| IndexedDB 替代 localStorage | P2 | 解決 5MB 容量上限問題 |

### Phase 4（2027+）

| 功能 | 說明 |
|------|------|
| 多部門支援 | 擴展至 VIA 其他 BU |
| 行動裝置優化 | 針對 iPad 的 responsive 設計 |
| JIRA / GitHub 雙向同步 | 自動拉取 Issue 狀態更新 Actions |
| 週報 AI 品質評分 | Claude 自動評估週報完整性並給分 |
| 主管 Dashboard 專屬視圖 | 精簡版，僅顯示 KPI 與決策事項 |

---

## 13. 已知限制與風險

### 13.1 技術限制

| 限制 | 影響 | 緩解方案 |
|------|------|---------|
| localStorage 5MB 上限 | 長期使用後可能滿溢 | 監控大小；Phase 3 改 IndexedDB |
| 無後端認證 | 任何人可刪除週報 | v2 加 Admin Token |
| API Key 前端明文 | XSS 可竊取 Key | v2 改 sessionStorage |
| CDN 依賴（Chart.js / marked.js / docx 等） | 離線或 CDN 故障時部分功能失效 | 考慮本地打包（Phase 3） |
| 單一 Railway 實例 | 無 HA，重啟時服務中斷 | 接受（小團隊可接受） |

### 13.2 資料風險

| 風險 | 機率 | 影響 | 緩解方案 |
|------|------|------|---------|
| 瀏覽器清除 localStorage | 低 | 高（當週資料遺失） | 後端每週歸檔（git 永久保存） |
| W13 / W14 weekStart 命名混淆 | 已發生 | 中（趨勢圖日期錯誤） | ✅ 已修正；建立命名規範文件 |
| AI 生成品質不穩定 | 中 | 低（有本地生成 fallback） | 保留本地生成模式 |
| Railway 免費方案休眠 | 中 | 低（2–3 秒喚醒延遲） | 可接受；或升級付費方案 |

### 13.3 組織風險

| 風險 | 說明 |
|------|------|
| 子組 Lead 採用率低 | 若 Lead 不使用系統，PM 仍需手動蒐集，系統價值打折 → 需導入期培訓 |
| 週報格式迭代頻繁 | 主管對章節結構有不同意見，每次調整需修改 `report.js` → 考慮章節模板設定化 |

---

## 14. Open Questions

| # | 問題 | 負責方 | 阻塞性 |
|---|------|--------|--------|
| OQ-01 | weekStart 的語義定義：是「該週 Monday」還是「週報發出日」？需統一規範 | Alex + Engineering | ✅ 建議：統一為該週 Monday |
| OQ-02 | 是否需要 Railway 付費方案以避免休眠問題？ | Michael（預算） | 非阻塞 |
| OQ-03 | AI 生成的 Token 費用由誰承擔？每月預估多少？ | Michael（預算） | 非阻塞 |
| OQ-04 | 子組 Lead 是否需要個別帳號以追蹤「誰更新了什麼」？ | Michael（需求確認） | Phase 3 前需確認 |
| OQ-05 | 週報核准後是否要自動發送至固定 Email 或 Slack 頻道？ | Alex + Michael | Phase 2 需確認 |
| OQ-06 | resources.html 的資料是否要與 backend JSON 同步歸檔（現僅存 localStorage）？ | Engineering | Phase 2 |

---

## 附錄 A：localStorage Keys 速查表

| Key | 說明 | 頁面 |
|-----|------|------|
| `pgm_sync_projects` | 專案陣列 | Dashboard / Quick Input |
| `pgm_sync_risks` | 風險陣列 | Risks / Dashboard |
| `pgm_sync_actions` | Action 陣列 | Action Items |
| `pgm_sync_milestones` | 里程碑陣列 | Milestones |
| `pgm_sync_members` | 成員陣列 | Quick Input |
| `pgm_sync_snapshots` | 週快照陣列 | Review / Trends |
| `pgm_sync_drafts` | 週報草稿陣列 | Review |
| `pgm_sync_api_key` | Anthropic API Key | Report |
| `pgm_resources_entries` | 季度人力條目 | Resources |
| `pgm_resources_charges` | 業務分配記錄 | Resources |
| `pgm_viewWeek`（sessionStorage） | 跨頁週次同步 | 全頁面 |

---

## 附錄 B：檔案結構

```
program-sync/
├── index.html           # Dashboard
├── input.html           # Quick Input
├── actions.html         # Action Items
├── milestones.html      # Milestones
├── risks.html           # Risks
├── trends.html          # 趨勢分析
├── resources.html       # 人力資源管理
├── report.html          # 週報生成
├── review.html          # 審核流程
└── assets/
    ├── css/             # base / components / layout
    └── js/
        ├── store.js     # localStorage CRUD
        ├── app-init.js  # 統一初始化
        ├── api.js       # 後端通訊
        ├── ui.js        # UI 元件
        ├── ai.js        # Claude API 串流
        ├── report.js    # 週報生成
        └── export.js    # DOCX / PDF 匯出

backend/
├── src/index.js         # Express API Server
├── data/weeks/          # W09–W14.json（git 持久）
└── reports/             # 歷史週報 .md 檔
```

---

*文件版本：v1.0 ｜ 最後更新：2026/04/02 ｜ 下次審查：2026/05/01*
