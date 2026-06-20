# Changelog — PgM Weekly Report System

## 2026/06/20 — Dashboard 完整 Dark Mode + Mobile 響應式優化

透過 `engineering-discipline-loop` Skill（Full 9-Step / L2 risk）執行。

### [優化] Dark Mode 全面支援

- **`base.css`**：補齊 `--shadow-lg`、`--color-primary`、`--banner-warning-*`、`--banner-info-*` 語意色 CSS 變數；`[data-theme="dark"]` 與 `@media (prefers-color-scheme: dark)` 區塊補入 `color-scheme: dark` 及全套暗色覆蓋
- **`components.css`**：`select.inp` 下拉箭頭 SVG 加 dark mode 版（stroke `#8c8a84`）；新增 `.history-banner`、`.history-banner--warning/info`、`.archive-card` 系列 CSS class，取代所有 JS inline hardcoded hex 顏色
- **`index.html`**：`_applyBanner()` 改為 class 切換（移除 `Object.assign(banner.style, {background:'#fff8e6',...})`）；`archiveList` 改用 `.archive-card` DOM 結構

### [優化] Mobile 響應式

- **`layout.css`**：`@media (max-width: 768px)` 補 `.panel__header` flex-wrap、`#statusFilter.tab-bar` 橫滑（不換行 + 隱藏 scrollbar）、`#weekNavBar` flex-wrap 換行（meta 降底部右對齊）、`.archive-card` 垂直堆疊
- **`index.html`**：`weekNavBar` radioGroup 加 `flex-shrink:1; min-width:0` 防止 overflow

---

## 2026/06/15 — 第二輪系統健康檢查修復（H-A/H-E/M-B/M-E）

### [修復] H-A — saveState 前端未傳 Admin Token（api.js）

`POST /api/state` 後端要求 X-Admin-Token，但 `saveState` 的 headers 只帶 `Content-Type`，導致跨瀏覽器 UI 狀態同步一律 401 靜默失敗。改用 `_writeHeaders()` 後，有 token 時自動帶上，與其他寫入端點行為一致。

### [修復] H-E — 加入 HTTP 安全 Headers（index.js）

全域中介層加入三個安全 header：`X-Frame-Options: DENY`（防 clickjacking）、`X-Content-Type-Options: nosniff`（防 MIME sniffing）、`Referrer-Policy: strict-origin-when-cross-origin`（隱私保護）。適用所有 API 及靜態資源回應。

### [修復] M-B — Health Check 加入 DB 連線驗證（index.js）

原本 `/api/health` 永遠回傳 200 ok，PG 故障時 Railway 仍視為健康。現改為非同步執行 `db.getWeek('__health_check__')`，連線失敗時回傳 `503 + { status: 'degraded', db: 'error' }`，使監控工具能正確感知 DB 故障。

### [修復] M-E — localStorage 損壞後自動清除（store.js）

JSON.parse 失敗時原本只派出 `store:corrupt` 事件並 return `[]`，但損壞的 key 仍留在 localStorage，導致使用者每次開頁都重複觸發錯誤。現加入 `localStorage.removeItem()` 自動清除損壞 key，下次讀取時從空陣列起始，無需手動開 DevTools 修復。

---

## 2026/06/14 — 系統健康檢查 & 全面優化（Health Check P0–M10）

### [修復] H2 — PG 連線失敗 fail-fast（index.js）

`DATABASE_URL` 存在但 PG 無法連線時，原本靜默退回 ephemeral FS 模式，redeploy 後資料蒸發。現改為 `process.exit(1)` 強制中止啟動，Railway 顯示失敗而非以半殘狀態運行。

### [修復] H3 — PG 連線池冷啟動保護（db.js）

PG Pool 加入 `connectionTimeoutMillis: 5000`，冷啟動時若 5 秒無法連線立即報錯，不再無限等待。

### [修復] H4 — 資料權威來源說明（README.md）

明確標注 Railway PostgreSQL 為唯一正式資料來源，`backend/data/weeks/*.json` 為本機開發備份，兩者不一致以 PG 為準。

### [修復] H8 — import-draft.py 支援暫存檔匯入（import-draft.py + index.js）

新增 `--week W##` 參數手動指定週次，修正 UI/API 以 `parse_temp.md` 暫存檔呼叫時無法解析週次導致 500 的問題。後端 API 呼叫同步加入 `?week=W##` 傳遞。

### [修復] M2 — /read 端點 HTML escape（index.js）

500 錯誤訊息加 HTML escape，防止 `err.message` 含特殊字元時的 Reflected XSS。

### [修復] M4 — saveState timeout（api.js）

`saveState` 加入 `AbortSignal.timeout(8000)`，防止跨瀏覽器狀態同步時無限等待。

### [修復] M5 — _dataVersion 後端自動遞增（db.js）

`saveWeek` 改由後端讀取現有版本後 +1，FS 模式與 PG 模式皆覆蓋。版本判斷不再依賴客戶端時鐘，解決時鐘漂移下 `_localIsNewer` 判斷失準問題。

### [修復] M7 — projects 空陣列保護（store.js）

`startBackendSync` 前檢查 `projects` 是否為空，localStorage 損壞導致 `projects=[]` 時拒絕上傳，防止意外清空後端資料。

### [修復] M10 — _fetch_railway 錯誤區分（import-draft.py）

`_fetch_railway` 現區分 HTTP 404（正常：Railway 無此週資料）與連線異常（印出 ⚠️ 警告），不再所有失敗情境靜默回 `None`。

---

## 2026/06/14 — 跨瀏覽器資料不一致修復（Admin Token 持久化 + 強制 modal）

### [修復] Chrome vs Safari 看到不同資料

**根因**：`ADMIN_TOKEN` 存於 `sessionStorage`，每次重開瀏覽器後 token 消失，`saveWeekState` 回傳 401 靜默失敗，Chrome 的 localStorage 編輯從未推送至 Railway。Safari（無 localStorage）從 Railway 讀到舊版資料，造成兩者不一致。

**修復**：
- `api.js`：Admin Token 改存 `localStorage`，跨 session 持久，設定一次永久有效
- `app-init.js`：401 時改為強制輸入 modal（取代可被忽略的 banner），要求輸入 token 後才恢復同步，防止靜默失敗

**首次設定方式**（換新瀏覽器 / 換電腦時）：
```javascript
import('/assets/js/api.js').then(m => m.setAdminToken('YOUR_ADMIN_TOKEN'))
```

---

## 2026/06/10 — Skill 打包同步修復（里程碑區塊遺漏）

### [修復] program-sync-report.skill 重新打包

**根因**：`program-sync-report.skill`（2026/05/15 打包）與 `program-sync-report-src/SKILL.md` 不同步——舊版打包檔完全沒有 `## Appendix: Dashboard Export` 區塊，導致 W24 AI 草稿缺少 `### 里程碑`，`import-draft.py` 解析出 0 筆里程碑。

**修復**：
- 從最新 src 重新打包 `.skill`（已驗證含 `### 里程碑` 區塊）
- W24 FINAL md 手動補回里程碑表（17 筆）並重新 import + push

**提醒**：修改 `program-sync-report-src/SKILL.md` 後必須重新打包 `.skill` 並重新安裝至 Claude，兩者才會一致（CLAUDE.md 既有規範）。

### [新增] API 寫入端 payload 驗證 + release-week.sh Skill 同步防護（系統體檢 P1）

**API 驗證（`backend/src/index.js`）**：
- 新增 `validateWeekPayload()` 函式，在 `POST /api/weeks/:weekLabel` 寫入前驗證：
  - action 狀態合法性（`pending/in-progress/done/blocked`）
  - milestone 狀態合法性（`upcoming/in-progress/done/delayed`）
  - 陣列欄位型別（`projects/actions/risks/members/milestones` 必須是陣列）
  - `weekLabel` URL 與 body 一致性
  - `weekStart` 日期格式（`YYYY-MM-DD`）
- 驗證失敗回傳 `422 INVALID_PAYLOAD`，明確列出每一筆錯誤，防止髒資料寫入

**Skill 打包防護（`scripts/release-week.sh`）**：
- Section 0 新增 Skill 同步檢查：`program-sync-report.skill` 內的 `SKILL.md` 與 `program-sync-report-src/SKILL.md` 必須一致
- 不一致時擋下 `release-week.sh`，顯示重新打包命令，防止重蹈 W24 草稿缺少里程碑區塊的問題

### [修復] import-draft.py 狀態 fallback bug + 歷史資料清洗（系統體檢 P0）

**根因**：`STATUS_MAP.get(status, "not-started")` 的 fallback 是非法值（合法狀態僅 `pending/in-progress/done/blocked`），任何未知狀態字串都會以 `not-started` 寫入資料，污染 Dashboard 統計。

**修復**：
- `import-draft.py` 兩處 fallback 改為 `"pending"`（L242、L260）
- 清洗 W19/W21/W22 歷史資料：`not-started`→`pending`（33 筆）、`waiting`→`blocked`（1 筆）、`overdue`→`pending`（2 筆，逾期為 dueDate 衍生屬性非狀態）
- W22 漂移解決：刪除本地多出的 2 筆 actions（`action-w22-12`、`action-w22-14`，以線上為準）
- 三週清洗後資料已推送 Railway，16 週全數通過狀態合法性與本地/線上一致性驗證

## 2026/06/04 — Trends 歷史資料修復 + Code Review 修正

### [修復] trends.html 完成率 & 逾期數歷史資料不準確

**根因**：`_computeMetrics` 一律從 raw actions 重算，但 actions 狀態在後續 import 中被覆蓋，導致歷史週的數值與當週實際情況不符：
- 完成率：W11–W13 應為 50%，raw 重算顯示 0%
- 逾期數：W15–W17 應為 0，raw 重算虛增至 8/15/5 筆

**修復**：歷史週（`s.snap` 存在）優先使用 snapshot 存值（import 時計算準確），當週（`s.snap = null`，由 `_injectCurrentWeek` 注入）才從 raw actions 重算：

```javascript
// 逾期數
const overdue = s.snap?.overdueActions != null
  ? s.snap.overdueActions         // 歷史週：snapshot 存值
  : rawCalculation;               // 當週：即時重算

// 完成率
const useSnap = typeof s.snap?.totalActions === 'number' && s.snap.totalActions > 0;
const total   = useSnap ? s.snap.totalActions    : acts.length;
const done    = useSnap ? (s.snap.completedActions ?? 0) : rawDoneCount;
```

**影響週次**：W11–W23 的完成率與逾期數趨勢圖現在顯示歷史準確值。

---

### [修復] Code Review 三項修正（M1、M2、M3）

- **M1 `input.html`**：刪除 `filenameLabel.textContent` 無效的雙重賦值（第 910 行立即被覆蓋）
- **M2 `index.js`**：兩個 admin 端點加入 5MB body 上限，超過回 HTTP 413 並中斷連線
- **M3 `import-draft.py`**：`--auto-release` 加 `returncode` 檢查，失敗時印出警告而非靜默吞掉
- **L1 `input.html`**：刪除宣告後從未讀取的 `doneMsg` 變數

---

## 2026/06/04 — 全系統安全加固 & 無障礙改善（Ultra Code Review）

Ultra Code Review 發現並修復 7 Critical、14 High 問題，同時完成 WCAG 2.1 AA 無障礙升級。

### [安全] 認證與授權

- **ADMIN_TOKEN bypass 修復**：`requireAdminToken` 未設定時改為回傳 503，不再 bypass 認證
- **Admin 端點保護**：`/api/admin/parse-draft`、`/api/admin/import-release`、`/api/release/:weekLabel` 從無效的 localhost IP 判斷改為 `requireAdminToken`（Railway 代理後 IP 判斷失效）
- **Token 比對防 timing attack**：改用 `crypto.timingSafeEqual`
- **前端補送 token header**：`input.html` 兩個 XHR 補 `X-Admin-Token`

### [安全] XSS 防護

- **stored XSS — marked.js**：`report.html`、`review.html` 所有 `marked.parse()` 輸出套 DOMPurify
- **stored XSS — list render**：全站 7 個頁面所有自由文字欄位（name、task、description、blockers、owner 等）套 `escHtml()`
- **banner XSS**：`app-init.js` 的 sync-failed / corrupt banner 加 `_esc()` 跳脫
- **`/read` 端點 XSS**：後端 HTML 輸出的檔名與內容套 HTML encode
- **Notion link URL 驗證**：`save-notion.js`、`sync-notion.js` 只允許 `http(s)://`，拒絕 `javascript:` 等危險 protocol

### [安全] 機密管理

- **移除硬編碼 Notion ID**：`DATABASE_ID`、`PAGE_ID` 改讀 `NOTION_DATABASE_ID`、`NOTION_PAGE_ID` env var
- **移除絕對路徑**：`sync-notion.js` 中 `/Users/daqingliao/...` 硬編碼路徑完全移除
- **修復 .env 手寫 parser**：`import-draft.py` 改用 `python-dotenv`，新增 `scripts/requirements.txt`

### [安全] 其他

- **AI agent 寫入範圍縮小**：`fix-agent.js` 移除 `backend/src/index.js` 的可寫授權
- **child process 最小化 env**：移除子程序繼承全部 secrets 的預設行為

### [修復] 邏輯 Bug

- **localStorage 損壞**：`store.save(key, array)` 改為逐筆 `forEach` 寫入，修復 P3 補入邏輯
- **store 不可變**：`store.save()` 先 spread clone 再賦值，不 mutate 呼叫方物件

### [無障礙] WCAG 2.1 AA 升級

- **焦點樣式**：加 `:focus-visible` 全域樣式、`.sr-only` / `.sr-only-focusable` 工具類、`prefers-reduced-motion` 支援
- **Landmark 結構**：全站 10 頁加 skip link、`<main id="main-content">`、`<nav aria-label="主導覽">`
- **Modal 語意**：`ui.js modal()` 加 `role="dialog" aria-modal="true"`、focus trap、Escape 關閉、焦點還原
- **Button 語意**：KPI 卡片、risk-row、section header 從 `<div onclick>` 改為 `<button>`，加 `aria-expanded`/`aria-controls`
- **Hamburger 狀態**：全站 hamburger 補 `aria-expanded`、`aria-controls`
- **表單標籤**：主要頁面搜尋框、週次選擇、篩選下拉加 `aria-label`/`label`
- **Toast 公告**：全站 `toastContainer` 加 `role="status" aria-live="polite"`
- **Canvas 替代文字**：`trends.html` 四個圖表加 `role="img" aria-label`
- **對比度修正**：`--color-text-tertiary` 從 `#9a9890`（2.6:1）提升至 `#6e6d66`（~4.6:1），通過 WCAG AA
- **Icon 按鈕**：編輯/刪除/升降級等 icon-only 按鈕補 `aria-label`

### [維護]

- Python `open()` 全加 `encoding='utf-8'`（`validate-week.py`、`new-week.py`）

---

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
