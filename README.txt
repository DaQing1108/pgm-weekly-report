================================================================================
  PgM Weekly Report System — README
  VIA Technologies P&D Program Sync
================================================================================

專案名稱：VIA Technologies PgM Weekly Report System
建置日期：2026/03/19
更新日期：2026/04/30（新增跨週追蹤 Tracker）
技術棧：Node.js + Express（backend）/ Vanilla JS SPA（program-sync）
部署平台：Railway
公開網址：https://pgm-weekly-report-production.up.railway.app
GitHub  ：https://github.com/DaQing1108/pgm-weekly-report
本地路徑：/Users/daqingliao/Documents/AI-Workspace/projects/pgm-weekly-report

--------------------------------------------------------------------------------
  系統架構
--------------------------------------------------------------------------------

  使用者瀏覽器
       │ HTTPS
  Railway（單一服務）
  ├── Express Server (port 3001)
  │   ├── GET  /api/health
  │   ├── GET  /api/reports            ← 讀取 backend/reports/*.md
  │   ├── GET  /api/reports/:filename  ← 讀取單份週報
  │   ├── GET  /api/reports/:filename/download
  │   ├── POST /api/reports            ← 儲存週報（需 ADMIN_TOKEN）
  │   ├── GET  /api/weeks              ← 歷史週次清單
  │   ├── GET  /api/weeks/:label       ← 指定週次 JSON
  │   ├── POST /api/weeks/:label       ← 儲存週次快照（需 ADMIN_TOKEN）
  │   ├── GET  /api/state              ← 跨瀏覽器同步狀態
  │   ├── POST /api/state              ← 儲存狀態（需 ADMIN_TOKEN）
  │   ├── GET  /read                   ← NotebookLM 爬取用純 HTML
  │   └── /*  → serve program-sync/（Fallback SPA）
  ├── backend/reports/*.md             ← 週報 Markdown 來源
  ├── backend/data/weeks/*.json        ← 歷史週次快照
  └── program-sync/                    ← 主管理後台（Vanilla JS SPA）

  program-sync 子模組：
  ├── index.html      Dashboard（KPI + 專案列表）
  ├── input.html      快速輸入 / 批次貼上
  ├── risks.html      風險管理（多選篩選）+ 跨週齡 badge
  ├── actions.html    Action Items + 跨週齡 badge
  ├── milestones.html 里程碑時間軸
  ├── tracker.html    跨週未結項目追蹤（Projects / Risks / Actions）
  ├── review.html     審核 / 快照建立
  ├── trends.html     歷史趨勢圖表
  ├── report.html     週報草稿編輯（儲存草稿 + 離頁警告）
  └── assets/
      ├── css/
      │   ├── base.css        CSS variables / reset / typography
      │   ├── components.css  UI 元件樣式庫
      │   └── layout.css      頁面版型 / 格線 / responsive
      └── js/
          ├── store.js        localStorage CRUD + 統計 + 快照
          ├── ui.js           Toast / Modal / 通用 UI helpers
          ├── api.js          後端 API 串接
          ├── app-init.js     跨頁初始化 + 歷史週切換
          ├── export.js       資料匯出
          ├── import.js       資料匯入 / 批次解析
          ├── parse-history.js 歷史紀錄解析
          └── schema.js       資料結構定義（Objectives / 狀態）

--------------------------------------------------------------------------------
  資料模型說明
--------------------------------------------------------------------------------

  Objectives（team）層級：
    Media Agent / LearnMode / 創造栗 / TV Solution / Healthcare / 組織管理

  專案狀態（英文）：On Track / At Risk / Behind / Paused

  Actions.project：關聯 Dashboard 實際專案名稱（動態下拉，選填）
  Milestones.project：欄位已從時間軸移除（不顯示）

  KPI 定義：
    需關注專案 = status 為 "At Risk" + "Behind" 的專案數
    逾期 Actions = dueDate < 今天 且 status ≠ done
    健康度 / 進行中 = 從 store.getAll() 即時計算（非後端快照）

--------------------------------------------------------------------------------
  本地開發啟動
--------------------------------------------------------------------------------

  # 安裝依賴（首次）
  cd backend && npm install && cd ..

  # 啟動後端 (port 3001)
  cd backend && npm run dev

  # program-sync 透過後端自動 serve
  # 開啟瀏覽器：http://localhost:3001

  環境變數（backend/.env）：
    ADMIN_TOKEN=<設定管理員 token>
    CORS_ORIGIN=http://localhost:3001
    REPORT_EXCLUDE_TAG=_v7     # 過濾舊版週報

--------------------------------------------------------------------------------
  部署（Railway）
--------------------------------------------------------------------------------

  git add .
  git commit -m "update"
  git push
  # Railway 自動偵測 Dockerfile 並重新部署（約 2 分鐘）

  詳細建置步驟請見：PgM_週報系統_建置指南.md

--------------------------------------------------------------------------------
  每週發布流程（標準 SOP）
--------------------------------------------------------------------------------

  步驟 1：建立新週基底 JSON
    ./scripts/new-week.sh W19
    # 自動從上週複製 projects/risks/actions/milestones，計算新週 snapshot
    # 輸出：backend/data/weeks/W19.json

  步驟 2：更新本週資料
    # 在瀏覽器 Dashboard 完成本週專案狀態更新
    # 於 review.html 建立本週快照（會更新 W19.json）

  步驟 3：放入 MD 週報
    # 將本週 Markdown 週報放至 backend/reports/
    # 檔名規則：Pgm_Weekly_Report_YYMMDD.md（YYMMDD = 當週週五日期）
    # 必填欄位：報告週期：YYYY/MM/DD – YYYY/MM/DD

  步驟 4：驗證並發布（本地執行時自動完成）
    # 確認歸檔後，系統自動呼叫 POST /api/release/W19
    # 後端執行 release-week.sh --yes → git commit + push
    # Railway 約 1–2 分鐘後自動部署
    #
    # 若需手動執行（或自動發布失敗時）：
    ./scripts/release-week.sh W19

  ⚠ 注意：週報 MD 必須透過 git commit 才能持久化。
          透過 UI 上傳的檔案在 Railway 重新部署後會消失。
  ⚠ 注意：自動發布端點僅接受 localhost 連線。
          Railway 正式環境無法觸發，仍需手動流程。

--------------------------------------------------------------------------------
  Skills
--------------------------------------------------------------------------------

  program-sync-report.skill  週報生成 Skill
    觸發詞：「生成週報」「更新週報」「升版」「整合這份 PDF」
    輸出路徑：backend/reports/

  pptx-template.skill        PPT 範本生成 Skill
    觸發詞：「做成範本」「做 PPT 範本」「參考這份做 PPT」
    輸出路徑：AI-Workspace/<ProjectFolder>/

--------------------------------------------------------------------------------
  Changelog
--------------------------------------------------------------------------------

  ── 2026/04/30  週報歸檔一鍵自動發布 by Alex Liao ──

  [功能] 歸檔後自動 commit & push，無需手動操作

    歸檔流程從 4 步驟 → 1 步驟：
      以前：上傳 .md → 手動移 JSON → 執行 release-week.sh → git push
      現在：上傳 .md → 確認歸檔 → ✅ 完成（其餘全部自動）

    技術實作：
    - POST /api/release/:weekLabel（localhost-only）
      後端以 child_process.spawn 執行 release-week.sh --yes
      回傳 stdout/stderr，瀏覽器顯示進度與結果
    - release-week.sh 新增 --yes 旗標，跳過互動式確認提示
    - input.html 自動呼叫端點，失敗時降級顯示手動指令
    - 修正 bash 3.2 相容性（macOS 預設版本）：
      ${VAR^^} → $(echo "$VAR" | tr '[:lower:]' '[:upper:]')

    Production（Railway）行為不變：仍提供 JSON 下載 + 手動指令

  ── 2026/04/29  W18 問題修復 + 週次管理腳本 by Alex Liao ──

  [修復] Dashboard 數據空白（W18 根因：JSON projects=0）
    - 根因：週報歸檔工具建立新週 JSON 時未從上週複製資料
    - 修復：新增 scripts/new-week.sh — 自動從最近有效週次複製
            projects / risks / actions / milestones，並計算新週 snapshot
    - 防呆：release-week.sh 加入 projects=0 硬停，引導執行 new-week.sh

  [修復] 歷史週報歸檔 MD 上傳後重新部署消失
    - 根因：Railway ephemeral filesystem，UI 上傳不持久
    - 修復：weekly SOP 改為 git commit 方式，MD 納入版控

  [修復] 部分瀏覽器 Dashboard 顯示異常（需清快取）
    - 根因 A：靜態資源被快取，deploy 後繼續使用舊版 JS/CSS
      修復：backend/src/index.js 靜態 serve 加 Cache-Control: no-cache, must-revalidate
    - 根因 B：AbortSignal.timeout() 在舊版 Chrome/Safari 不存在
      修復：api.js 加 polyfill
    - 根因 C：Safari Private Mode 封鎖 localStorage
      修復：store.js 加 _lsAvailable 偵測 + in-memory fallback
    - 根因 D：index.html .main-grid inline style 覆蓋 CSS media query
      修復：移除 inline style，mobile 版面恢復正確

  ── 2026/04/24  專案整理與路徑遷移 by Alex Liao ──

  [架構] 工作路徑遷移
    - 專案路徑由 Claude Contxet/ 改為 AI-Workspace/projects/pgm-weekly-report/
    - Claude Memory 系統重建（my-context.md / project-pgm-weekly-report.md / feedback-dev-rules.md）

  [清理] 廢棄檔案移除
    - 刪除 frontend/（React + Vite，已由 program-sync Vanilla JS 取代）
    - 刪除 PPT_Template/、PPT範本/（與週報系統無關）
    - 刪除 automation/、LOOP_INTEGRATION.md（舊 Loop 整合，已棄用）
    - 刪除 program-sync-report-src/（.skill 打包後原始資料夾）
    - 刪除 pptx-template-eval-review.html、loop_extracted_actions.json
    - 刪除根目錄所有 MediaAgent_週報_*.md 舊格式歷史檔案

  [修正] backend/package.json
    - build script 移除 cd ../frontend 殘留死碼

  [Skills] 路徑更新與整合
    - program-sync-report.skill：更新輸出/參考文件路徑至 AI-Workspace
    - program-sync-report 2.skill：刪除（與主 skill 合併）
    - pptx-template.skill：更新 npm 工作目錄與輸出路徑

  ── 2026/04/08  穩定性升級 by Alex Liao ──

  [System] 表單未儲存防呆（Dirty Tracking）
    - 全站 _initDirtyTracking，有未儲存變更時攔截離頁
    - 搜尋框及過濾欄位加入豁免機制

  [System] 壞檔自救機制（Corrupt Data Self-Healing）
    - localStorage 損毀時提供一鍵「重置該變數」按鈕

  [System] 全局連線狀態監視器（Sync Status Indicator）
    - store.js 廣播 syncing / syncSuccess 事件
    - Navbar 右上角加入呼吸燈狀態綠點（Offline / Syncing / Saved / Failed）

  ── 2026/04/06  UI/UX 改善（Phase 2）by Alex Liao ──

  [Dashboard] 進階排序與過濾
    - 加入搜尋框與下拉排序選單（健康度 / 最近更新）

  [Dashboard] 跨模組關聯聚合
    - 專案展開面板自動呈現隸屬 Risks 與 Actions 預覽

  [Dashboard] 週次選擇器視覺改善
    - 橫向捲動 Tab 取代舊文字下拉選單

  [Dashboard / Actions] 逾期與即將到期視覺強化
    - 3 天內到期未完成：整行黃底 + ⏳ 預警
    - 專案標題右側顯示 ⚠️逾期 / ⏳即將到期

  [System] Dark Mode 切換
    - 各頁頂部加入黑白模式快捷切換開關

  [Trends] 資源瓶頸熱區（Resource Matrix）
    - 動態抓取當週 Pending Actions，Top 5 負責人柱狀圖
    - 超過 3 項時自動高亮紅色（單點故障警示）

  ── 2026/04/06  UI/UX 改善（Phase 1）by Alex Liao ──

  [Dashboard] KPI WoW Delta Badge
    - 4 張 KPI 卡片加入週對週變化 badge（綠升 / 紅降）

  [Input] 刪除專案改用 Styled Confirm Modal（移除原生 window.confirm）

  [Dashboard] Project Row 展開動畫（max-height transition）

  [System] 移除 API Key 管理與 AI 週報生成功能
    - 全站 9 頁面移除 🔑 API Key / 📝 生成週報 按鈕
    - 刪除死碼：ai.js、report.js、TONE_OPTIONS、REPORT_SECTIONS

  [Risks] 狀態篩選改為多選 chips；子組標籤統一為 Objectives

  [Actions] project 欄位改為關聯 Dashboard 專案下拉（非 Objectives 層級）

  [Milestones] 時間軸移除永遠為空的 project 欄位顯示

  [Dashboard] 專案狀態改為英文：On Track / At Risk / Behind / Paused

  [System] 跨頁資料同步補齊
    - risks / actions / milestones / trends 加入 pageshow + storage 事件監聽
    - 引入 _isHistoryView flag 區分最新週 vs 歷史週資料來源

  ── 2026/03/19  初始建置 by Alex Liao ──
    - Express 後端 + program-sync Vanilla JS SPA 建立
    - Railway 部署設定（Dockerfile）
    - GitHub repo 建立：DaQing1108/pgm-weekly-report
    - NotebookLM 整合（/read 純 HTML 路由）
    - 詳見 PgM_週報系統_建置指南.md

--------------------------------------------------------------------------------
  常見問題
--------------------------------------------------------------------------------

  Q：Railway build 失敗，npm: command not found
  A：確認 railway.json 的 builder 設為 DOCKERFILE。

  Q：新增週報沒出現
  A：檔名格式 Pgm_Weekly_Report_YYMMDD.md，放在 backend/reports/，push 後等 2 分鐘。

  Q：KPI delta 不顯示
  A：需後端有至少 2 個歷史週次 JSON（backend/data/weeks/）才有對比值。

  Q：跨頁資料沒更新
  A：從其他分頁或返回鍵進入頁面時，pageshow 事件會自動重新載入資料。

  Q：POST /api/reports 回傳 401
  A：需在 request header 加入 x-admin-token: <ADMIN_TOKEN>。

  Q：Dashboard KPI 全部顯示 0 / 空白
  A：確認 backend/data/weeks/Wxx.json 的 projects 陣列長度 > 0。
     若為空，執行 ./scripts/new-week.sh Wxx 重建基底，再重新操作。

  Q：Dashboard 在部分瀏覽器顯示異常，清快取才能恢復
  A：已於 2026/04/29 修復。後端靜態 serve 加入 Cache-Control: no-cache，
     強制瀏覽器每次重新驗證 JS/CSS，不再需要手動清快取。

  Q：Safari Private Mode 無法使用
  A：Safari Private 模式封鎖 localStorage。已加入 in-memory fallback，
     資料存於記憶體中，關閉分頁後會消失，屬預期行為。

  Q：週報 MD 上傳後過幾天不見了
  A：Railway 使用暫存磁碟，重新部署後只有 git 版控的檔案會保留。
     MD 週報必須放入 backend/reports/ 並 git commit + push 才能持久化。

--------------------------------------------------------------------------------
  建置人：Alex Liao
  維護人：Alex Liao
================================================================================
