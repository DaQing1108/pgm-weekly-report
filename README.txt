================================================================================
  PgM Weekly Report System — README
  VIA Technologies P&D Program Sync
================================================================================

專案名稱：VIA Technologies PgM Weekly Report System
建置日期：2026/03/19
更新日期：2026/04/06
技術棧：React + Vite（frontend）/ Node.js + Express（backend）
         program-sync：Vanilla JS SPA（主管理後台）
部署平台：Railway
公開網址：https://pgm-weekly-report-production.up.railway.app
GitHub  ：https://github.com/DaQing1108/pgm-weekly-report

--------------------------------------------------------------------------------
  系統架構
--------------------------------------------------------------------------------

  使用者瀏覽器
       │ HTTPS
  Railway（單一服務）
  ├── Express Server (port 3001)
  │   ├── GET  /api/health
  │   ├── GET  /api/reports       ← 讀取 backend/reports/*.md
  │   ├── GET  /api/weeks         ← 歷史週次清單
  │   ├── GET  /api/weeks/:label  ← 指定週次 JSON
  │   └── /*  → 提供靜態檔案
  ├── backend/reports/*.md        ← 週報 Markdown 來源
  ├── backend/data/weeks/*.json   ← 歷史週次快照
  └── program-sync/               ← 主管理後台（Vanilla JS SPA）

  program-sync 子模組：
  ├── index.html      Dashboard（KPI + 專案列表）
  ├── input.html      快速輸入 / 批次貼上
  ├── risks.html      風險管理
  ├── actions.html    Action Items
  ├── milestones.html 里程碑
  ├── review.html     審核 / 快照建立
  ├── trends.html     歷史趨勢圖表
  ├── report.html     AI 週報生成
  └── assets/
      ├── css/
      │   ├── base.css        CSS variables / reset / typography
      │   ├── components.css  UI 元件樣式庫
      │   └── layout.css      頁面版型 / 格線 / responsive
      └── js/
          ├── store.js        localStorage CRUD + 統計 + 快照
          ├── ui.js           Toast / Modal / 通用 UI helpers
          ├── api.js          後端 API 串接
          ├── app-init.js     跨頁初始化
          ├── report.js       週報生成邏輯（本地 + AI）
          └── schema.js       資料結構定義

--------------------------------------------------------------------------------
  本地開發啟動
--------------------------------------------------------------------------------

  # 安裝依賴（首次）
  cd backend  && npm install && cd ..
  cd frontend && npm install && cd ..

  # Terminal 1：後端 (port 3001)
  cd backend && npm run dev

  # Terminal 2：前端 React viewer (port 5173)
  cd frontend && npm run dev

  # program-sync 直接用瀏覽器開啟 program-sync/index.html
  # 或透過後端做 static serve

  環境變數（backend/.env）：
    ADMIN_TOKEN=<設定管理員 token>
    CORS_ORIGIN=http://localhost:5173
    REPORT_EXCLUDE_TAG=_v7     # 過濾舊版週報

--------------------------------------------------------------------------------
  部署（Railway）
--------------------------------------------------------------------------------

  git add .
  git commit -m "update"
  git push
  # Railway 自動偵測並重新部署（約 2 分鐘）

  詳細建置步驟請見：PgM_週報系統_建置指南.md

--------------------------------------------------------------------------------
  新增週報流程
--------------------------------------------------------------------------------

  1. 將新週報 .md 放至 backend/reports/
  2. git add backend/reports/ && git commit -m "add vN weekly report"
  3. git push（Railway 自動部署）

  檔名規則：含 _vN（如 _v9）才會被識別版本號
  必填欄位：報告週期：YYYY/MM/DD – YYYY/MM/DD

--------------------------------------------------------------------------------
  Changelog
--------------------------------------------------------------------------------

  ── 2026/04/06  UI/UX 改善（高優先 5 項）by Alex Liao / Antigravity ──

  [Fix #1] KPI WoW Delta Badge（index.html + components.css）
    - 新增 _prevSnap 模組變數追蹤前一週快照
    - 新增 _deltaBadge(cur, prev, lowerIsBetter) helper
    - init() 和 loadWeekView() 都會自動更新 _prevSnap
    - 4 張 KPI 卡片加入 .kpi-delta-wrap slot
    - 綠色（▲ 上升好）/ 紅色（▼ 下降壞）pill badge CSS
    - overdueActions / needAttn 設 lowerIsBetter=true（越少越好）
    - 無前一週快照時，delta slot 為空，不影響現有排版

  [Fix #2] 刪除專案改用 Styled Confirm Modal（input.html）
    - btnDeleteProj click handler 改為 async
    - window.confirm() 替換為 await uiConfirm()
    - uiConfirm 已在 imports 中（與 removeReport 同一版本）
    - 解決 Safari 原生 alert 可能被 blocked 的問題

  [Fix #3] Project Row 展開動畫（components.css）
    - .project-row__detail 從 display:none/block 改為 max-height transition
    - max-height: 0 → 300px，opacity: 0 → 1，duration: 0.25s ease
    - padding 同步 animate（0 → var(--space-md)）
    - 無需改任何 JS，toggle class 'open' 邏輯不變

  [Fix #4] report.html 三欄 Responsive（layout.css + report.html）
    - 新增 @media (max-width: 1280px) breakpoint
    - 1280px 以下：三欄變兩欄（左+中），右側 AI 控制欄收起
    - 右側欄改為 .three-col__ai-panel，1280px 以下為 position:fixed right drawer
    - Navbar 加入 "⚙ AI 設定" toggle button（≥1281px 自動隱藏）
    - 點擊 toggle 開關 drawer，點擊 panel 外部自動關閉

  [Fix #5] 批次輸入重複專案偵測（input.html）
    - renderParseResult() 加入 _normalize() + _isDuplicate() 模糊比對
    - 比對規則：lowercase + 移除空格/dash/underscore 後 includes 互查
    - 偵測到重複：橙黃背景、"⚠ 可能重複" badge、預設不勾選（須手動確認）
    - 未重複：沿用原本白底 + 預設勾選

  [Bonus] CSS Lint Fix（components.css）
    - .inp-range 補加標準 appearance: none（原只有 -webkit-appearance）

  ── 2026/03/19  初始建置 by Alex Liao ──
    - React Vite 前端 + Express 後端建立
    - Railway 部署設定
    - program-sync Vanilla JS SPA 建立
    - 詳見 PgM_週報系統_建置指南.md

--------------------------------------------------------------------------------
  常見問題
--------------------------------------------------------------------------------

  Q：Railway build 失敗，npm: command not found
  A：確認 railway.json 的 builder 設為 DOCKERFILE。

  Q：前端無法連到 API（本地開發）
  A：確認 backend 已在 port 3001，vite.config.js proxy 設定正確。

  Q：新增週報沒出現
  A：檔名含 _vN、放在 backend/reports/、push 後等 2 分鐘。

  Q：KPI delta 不顯示
  A：需後端有至少 2 個歷史週次 JSON（backend/data/weeks/）才有對比值。

  Q：report.html AI 控制欄不見了
  A：螢幕寬度 ≤1280px 時改為 drawer 模式，點 navbar 的 "⚙ AI 設定" 開啟。

--------------------------------------------------------------------------------
  建置人：Alex Liao
  維護人：Alex Liao
================================================================================

## 2026-04-06 UI/UX 改善實裝 (Phase 2)
1. **[Dashboard] 進階排序與過濾 (#1)**
   - 加入了「🔍 搜尋」與下拉式「排序選單」。
   - 支援專案近況摘要模糊搜尋，並能針對「健康度（拉響警報）」與「最近更新」等維度聰明排序。
2. **[Dashboard] 跨模組關聯聚合 (#2)**
   - 當專案折疊面板展開時，會自動呈現隸屬於該專案的 Risks 與 Actions 預覽。
   - 針對風險警示會顯示 Level 與標題，而行動方案會提供前三筆快速確認加上總結狀態。
3. **[Dashboard] 週次選擇器視覺改善 (#3)**
   - 全新的週次切換器（取代了舊的文字下拉選單），透過靈活的橫向捲動 Tab 呈現近四次的快速週次切換。超過過往週期的將透過縮減的菜單顯示。
4. **[Dashboard / Actions] 逾期與即將到期視覺強化 (#4)**
   - `Actions` 若在三天內將到期但尚未完成，整行會黃底且顯示 ⏳ 預警。
   - `Dashboard 專案` 同理，小於 3 天到期與逾期的狀態現在都會直接反饋至專案標題右側（⚠️逾期 / ⏳即將到期）。
5. **[System] 一鍵切換 Dark Mode 黑暗模式 (#5)**
   - 各頁頂部新增了黑白模式快捷切換開關，徹底去除閃爍白光的 Bug 並優化對比度呈現！

## 2026-04-06 商業邏輯升級：歷史經驗視覺化 (Trends)
1. **[Trends] 資源瓶頸熱區 (Resource Matrix)**
   - 於趨勢分析頁整合了全新的資源負載觀測面板。
   - 動態抓取當週所有的 Pending Actions，即時統計並呈現 Top 5 任務負責人。
   - 當單一處理人負擔超過 3 項目時，柱狀圖將自動高亮呈危險紅色（單點故障警示）。
2. **[System] 全局面板導航銜接**
   - 將 Trends (趨勢分析) 視圖以第一級選單姿態加入全站所有的 Navbar 中，無縫俯視專案脈絡。

## 2026-04-08 穩定性與防護體驗升級 (Resilience Engineering)
1. **表單未儲存防呆 (Dirty Tracking)**
   - 實裝全站 `_initDirtyTracking`，在使用者有未儲存變更時進行離頁攔截。
   - 針對搜尋框 (`type="search"`) 及過濾狀態欄位加入了豁免機制，確保查詢時不誤觸防呆。
2. **壞檔自救機制 (Corrupt Data Self-Healing)**
   - 強化 `_showCorruptBanner`：當 localStorage 欄位損毀無法解析時，提供一鍵「重置該變數」按鈕，幫助專案經理省去進開發者工具除錯的繁瑣步驟。
3. **全局連線狀態監視器 (Sync Status Indicator)**
   - 修改 `store.js` 使其向上廣播 `syncing` 與 `syncSuccess` 事件。
   - 在全站 Navbar 右上角導入類似現代協作軟體的呼吸燈狀態綠點 (Offline / Syncing / Saved / Failed)，大幅提升與後端同步時的安全感與 UX 透明度。
