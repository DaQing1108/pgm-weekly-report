# Changelog — PgM Weekly Report System

## 2026/06/04 — AI 週報匯入 UI + 流程自動化強化

### [功能] Quick Input 頁面新增「AI 週報匯入 & 發布」面板（localhost-only）

三段式匯入流程，取代原本的純命令列操作，適合非技術用戶在本機操作：

**① 匯入前解析預覽**
- 選擇 Final MD 後自動呼叫 `/api/admin/parse-draft`（dry-run，不寫入任何檔案）
- 顯示摘要卡：週次、weekStart、專案數 / Actions 數 / Risks 數 / 里程碑數
- 列出各專案名稱、狀態、進度百分比，讓用戶確認解析結果正確

**② 確認閘門**
- 按「🚀 匯入並發布」前彈出 confirm 對話框，明列即將匯入的週次與各資料筆數
- 確認後才執行，防止誤觸

**③ 部署驗證**
- 匯入 + git release 完成後，自動輪詢 Railway 生產環境 `/api/weeks/WXX`
- 比對 `_savedAt` 時間戳，確認 Railway 已接收最新資料
- 最多輪詢 3 分鐘（每 15 秒一次），成功顯示「✅ 部署驗證通過」

**後端新端點（localhost-only）**
- `POST /api/admin/parse-draft` — dry-run 解析，回傳摘要 JSON
- `POST /api/admin/import-release` — SSE 串流執行完整匯入 + release，done 事件回傳 `weekLabel` + `savedAt`

---

### [功能] import-draft.py 新增旗標

| 旗標 | 說明 |
|------|------|
| `--dry-run` | 只解析 MD 並輸出摘要 JSON，不寫入任何檔案或 Railway |
| `--auto-release` | push 成功後自動呼叫 `release-week.sh WXX --yes`（需搭配 `--push`） |

### [功能] import-draft.py push 成功後自動同步本地 JSON + 印出 release 提示

- Railway push 成功後自動將 payload 寫回 `backend/data/weeks/WXX.json`
- 印出提示：`📌 下一步：執行 ./scripts/release-week.sh WXX`
- 防止 Production 有資料、git 無記錄的落差

### [修復] W23 本地 git 落差補齊

- 根因：W23 透過 Quick Input 頁面直接寫入 Railway PostgreSQL，未走 `import-draft.py` 流程，本地 JSON 與 git 均未更新
- 修復：從 Railway API 拉回 W23 完整資料 → `W23.json` → Final MD 複製至 `backend/reports/` → `release-week.sh W23` 補齊 git 記錄

---

## 2026/05/28 — W22 資料修復與匯入流程強化

**[修正] new-week.sh 遺漏必要欄位**
- 根因：`new-week.sh` 產生的 JSON 缺少 `weekLabel`、`weekStart`、`_dataVersion`，導致首次客戶端存取時以種子資料（11 筆假成員、無里程碑）初始化 Railway DB
- 修復：Python 生成區塊補入 `weekLabel`、`weekStart`、`_dataVersion: 1`，確保 DB 從一開始就有正確結構

**[功能] new-week.sh 新增 `--push` 旗標**
- `./scripts/new-week.sh W## --push` 建立新週後立即 POST 至 Railway，防止種子資料污染 DB
- 支援任意順序傳遞旗標，與週號解析互不干擾

**[修正] import-draft.py STATUS_MAP 錯誤**
- 根因：`STATUS_MAP` 將 `"pending"` 映射至 `"not-started"`（系統不認識的狀態），導致 W22 全部 21 筆 Action Items 狀態無效
- 修復：改為 `"pending" → "pending"`；`"not-started"` 也映射至 `"pending"` 以相容舊格式

**[功能] import-draft.py 自動遞增 `_dataVersion`**
- 根因：`_dataVersion` 固定寫死為 1，導致已快取的客戶端瀏覽器不觸發強制重新載入
- 修復：push 前先讀取 Railway 現有版本，`_dataVersion = existing + 1`，每次匯入都強制客戶端更新

**[功能] import-draft.py 匯入後自動驗證**
- push 完成後自動檢查 payload 完整性：`weekLabel`、`weekStart`、`milestones`、`members` 是否為空；Action 狀態是否合法
- 有問題時印出警告列表，方便快速發現 Appendix 缺漏

**[修正] app-init.js SUPPLEMENTABLE 補充 `members`**
- 根因：`SUPPLEMENTABLE` 不含 `members`，當本機版本較新時，空的 `members` 不會從 Railway 補填
- 修復：`SUPPLEMENTABLE` 陣列加入 `'members'`，確保本機 members 為空時從 Railway 繼承

---

## 2026/05/20 — import-draft.py 全面修正（v2 週報整合）

**[功能] 里程碑解析**
- `import-draft.py` 新增 `parse_milestones()`，從 Appendix `### 里程碑` 自動解析
- `SKILL.md` Appendix 生成規則加入 `### 里程碑` 表格格式（日期／里程碑事項／團隊／狀態）

**[修正] Quick Input 手動更新被覆蓋**
- 根因：`--push` 用本地 W##.json 做合併基底，不含使用者在 Quick Input 做的手動變更
- 修復：新增 `_fetch_railway()`，`--push` 前先 GET Railway 現有資料作為合併基底
- 效果：Quick Input 更新的 progress、status、members 等欄位在下次 push 時完整保留

**[修正] Action Items status 被 MD 覆蓋**
- 根因：`parse_actions()` status 永遠採用 MD 值，忽略 Railway 手動更新
- 修復：Railway 有紀錄時保留 Railway status；MD 標 `done` 時仍更新（進度只進不退）

**[修正] Milestones status 被 MD 覆蓋**
- 同 Action Items 邏輯：Railway 有紀錄時保留 status；MD 標 `done` 時更新

**[修正] Members 被空值覆蓋**
- 根因：v2 格式 import 時 members 預設空陣列，蓋掉 Quick Input 新增的成員
- 修復：members 從 Railway 繼承，不被覆蓋

---

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
