# Changelog — PgM Weekly Report System

## 2026/05/08 — Dashboard UX 優化

**[修正]** MD-only 週 Dashboard 週次 Tab 顯示錯誤週次
- 根因：`_viewingLabel` 設為 W18（資料來源），Tab 高亮顯示 W18 而非本週 W19
- 修復：`renderWeekNav()` 在 `_isMdOnlyFallback` 時改用 `_latestWeekLabel` 決定 Tab 高亮

**[修正]** MD-only Banner 文字更清楚
- 舊：「W19 尚未輸入系統資料，自動顯示 W18 快照」
- 新：「W19 沒有新的專案，自動帶入 W18 專案」

---

## 2026/05/07 — W19 修復與功能優化

**[修復]** Tracker 跨週未結項目停留在 W18 週次
- 根因：`_currentWeekStart()` 從 snapshots 取最新快照日期；MD-only 週（W19）無快照 → 永遠回傳 W18
- 修復：改為直接從 `new Date()` 計算本週一，不依賴快照是否存在

**[修復]** Action Items 跨週關聯專案遺失
- 根因：W18 舊資料 `action.project` 存 ID（`'p16-001'`）；`actions.html` v2.1+ 比對 `p.name` → ID vs name 永遠不符
- 修復：新增 `_resolveProjectName(val)` — 先查 ID、再查 name，fallback 顯示原值；下次儲存自動遷移為 name（self-healing）

**[功能]** 新增「已完成」第五專案狀態
- `input.html` 新增 Completed 選項
- Dashboard 預設 All Tab 不顯示（可切換 🏁 Tab 查看）
- `exportAll()` / `_exportWeekObj()` 自動排除，完成專案不帶入下週
- `stats()` 健康度計算排除，不影響分子分母
- `schema.js` STATUS_OPTIONS 新增 `completed`
- `ui.js renderBadge` 新增 completed 樣式

**[功能]** MD-only 週 Dashboard 自動 Fallback 顯示前週快照
- 當本週 projects=0（MD-only 發布），`init()` 自動找最近有資料的歷史週
- 頂部藍色 Banner：「本週無系統資料，顯示 WXX 快照」
- `_isMdOnlyFallback` flag 區分 MD-only fallback 與一般歷史瀏覽

**[修正]** 程式碼品質（Code Review）
- `agent/fix-agent.js`：路徑遍歷判斷補 `path.sep`，防止誤放行兄弟目錄
- `scripts/release-week.sh`：`set -e` → `set -eo pipefail`，pipe 中段失敗不再靜默吞掉
- `.github/workflows/weekly-health.yml`：Node 版本 20 → 22（Node 20 六月 EOL）
- `agent/health-check.js`：`statusValues` 加入 `'completed'`，消除誤警告

---

## 2026/04/30 — 週報歸檔一鍵自動發布

**[功能]** 歸檔後自動 commit & push，無需手動操作

歸檔流程從 4 步驟 → 1 步驟：
- 以前：上傳 .md → 手動移 JSON → 執行 release-week.sh → git push
- 現在：上傳 .md → 確認歸檔 → ✅ 完成（其餘全部自動）

技術實作：
- `POST /api/release/:weekLabel`（localhost-only）後端以 `child_process.spawn` 執行 `release-week.sh --yes`
- `release-week.sh` 新增 `--yes` 旗標，跳過互動式確認提示
- `input.html` 自動呼叫端點，失敗時降級顯示手動指令
- 修正 bash 3.2 相容性（macOS 預設版本）：`${VAR^^}` → `$(echo "$VAR" | tr '[:lower:]' '[:upper:]')`

---

## 2026/04/29 — W18 問題修復 + 週次管理腳本

**[修復]** Dashboard 數據空白（W18 根因：JSON projects=0）
- 根因：週報歸檔工具建立新週 JSON 時未從上週複製資料
- 修復：新增 `scripts/new-week.sh` — 自動從最近有效週次複製 projects/risks/actions/milestones
- 防呆：`release-week.sh` 加入 projects=0 硬停，引導執行 `new-week.sh`

**[修復]** 歷史週報歸檔 MD 上傳後重新部署消失
- 根因：Railway ephemeral filesystem，UI 上傳不持久
- 修復：weekly SOP 改為 git commit 方式，MD 納入版控

**[修復]** 部分瀏覽器 Dashboard 顯示異常
- 根因 A：靜態資源被快取 → 加 `Cache-Control: no-cache, must-revalidate`
- 根因 B：`AbortSignal.timeout()` 在舊版 Chrome/Safari 不存在 → `api.js` 加 polyfill
- 根因 C：Safari Private Mode 封鎖 localStorage → `store.js` 加 `_lsAvailable` 偵測 + in-memory fallback
- 根因 D：`index.html` `.main-grid` inline style 覆蓋 CSS media query → 移除 inline style

---

## 2026/04/24 — 專案整理與路徑遷移

**[架構]** 工作路徑遷移至 `AI-Workspace/1P_Projects/pgm-weekly-report/`

**[清理]** 廢棄檔案移除
- 刪除 `frontend/`（React + Vite，已由 program-sync Vanilla JS 取代）
- 刪除 `PPT_Template/`、`PPT範本/`（與週報系統無關）
- 刪除 `automation/`、`LOOP_INTEGRATION.md`（舊 Loop 整合，已棄用）
- 刪除 `program-sync-report-src/`（.skill 打包後原始資料夾）

---

## 2026/04/08 — 穩定性升級

**[System]** 表單未儲存防呆（Dirty Tracking）：全站 `_initDirtyTracking`，有未儲存變更時攔截離頁

**[System]** 壞檔自救機制（Corrupt Data Self-Healing）：localStorage 損毀時提供一鍵「重置該變數」按鈕

**[System]** 全局連線狀態監視器：Navbar 右上角呼吸燈（Offline / Syncing / Saved / Failed）

---

## 2026/04/06 — UI/UX 改善（Phase 2）

- **[Dashboard]** 進階排序與過濾（搜尋框 + 下拉選單）
- **[Dashboard]** 跨模組關聯聚合（展開面板顯示隸屬 Risks 與 Actions）
- **[Dashboard]** 週次選擇器改為橫向捲動 Tab
- **[Dashboard/Actions]** 逾期視覺強化（3 天內到期整行黃底 + ⏳ 預警）
- **[System]** Dark Mode 切換
- **[Trends]** Resource Matrix：Top 5 負責人柱狀圖，超過 3 項自動高亮紅色

---

## 2026/04/06 — UI/UX 改善（Phase 1）

- **[Dashboard]** KPI WoW Delta Badge（週對週變化 badge）
- **[Input]** 刪除專案改用 Styled Confirm Modal
- **[Dashboard]** Project Row 展開動畫（max-height transition）
- **[System]** 移除 API Key 管理與 AI 週報生成功能（全站 9 頁面）
- **[Risks]** 狀態篩選改為多選 chips
- **[Actions]** project 欄位改為關聯 Dashboard 專案下拉
- **[Dashboard]** 專案狀態改為英文：On Track / At Risk / Behind / Paused

---

## 2026/03/19 — 初始建置

- Express 後端 + program-sync Vanilla JS SPA 建立
- Railway 部署設定（Dockerfile）
- GitHub repo 建立：DaQing1108/pgm-weekly-report
- NotebookLM 整合（`/read` 純 HTML 路由）
