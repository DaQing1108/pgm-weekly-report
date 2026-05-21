# 產品需求文件 (PRD) - PgM 週報系統

## 1. 專案概述

- **專案名稱**：VIA Technologies PgM Program Sync 週報管理系統
- **文件版本**：v2.0
- **撰寫日期**：2026/04/06　**最後更新**：2026/05/15
- **系統版本**：program-sync v2.4
- **產品簡介**：本系統為 VIA Technologies P&D Center 的輕量級週報管理平台。以 Vanilla JS SPA 前端搭配 Express 後端，提供專案狀態追蹤、風險管理、Action Items、里程碑時間軸、趨勢分析與審核流程，並透過 Claude Code Skill 自動將 Notion 會議記錄轉換為格式化週報草稿。

---

## 2. 目標與願景

- **痛點解決**：週報資訊散落 Notion / Loop，缺乏統一追蹤入口；跨週未結項目難以掌握；報告撰寫耗時。
- **產品目標**：
  1. 提供單一入口即時掌握所有專案狀態、風險與 Action Items。
  2. 「零資料庫、低維護成本」為基線，本地開發使用 JSON 檔，Production 自動升級至 PostgreSQL。
  3. AI Skill 自動從 Notion 會議記錄產出週報草稿，減少人工整理時間。
  4. 標準化每週發布 SOP（新週建立 → 資料更新 → 快照歸檔 → 一鍵 git push 上線）。

---

## 3. 目標使用者

1. **專案經理 (PgM)**：每週更新專案狀態、管理風險與 Action Items 的主要操作者。
2. **子組 Lead**：在 `input.html` 確認本週進度並新增阻礙事項。
3. **高層主管 / Stakeholders**：透過 Dashboard 快速瀏覽 KPI、健康度與高風險決策事項。
4. **Claude Code AI Skill**：自動讀取 Notion 會議記錄並產出週報草稿（非人類使用者）。

---

## 4. 核心功能需求

### 4.1 Dashboard（index.html）

- **KPI 卡片**：健康度 % / 專案總數 / 高風險數 / 逾期 Action 數，含週對週 (WoW) Delta Badge。
- **專案列表**：狀態 Tab 切換（All / On Track / At Risk / Behind / Paused / 🏁 已完成）；支援搜尋框 + 下拉篩選排序；展開 Row 可見關聯 Risks 與 Actions。
- **子組健康度熱力圖**：5 子組 × 健康分數格狀呈現。
- **高風險決策事項**：自動列出 `level=high` 且 `status≠closed` 的風險卡片。
- **歷史週瀏覽**：橫向捲動 Tab 切換週次，歷史週讀後端 JSON 快照，當週讀 localStorage 即時資料。
- **MD-only 週 Fallback**：當週無系統資料時，自動顯示最近有資料的歷史週快照並提示。
- **Dark Mode**：全站切換。

### 4.2 快速輸入（input.html）

- **快速更新模式**：下拉選擇現有專案，拖曳進度條（0–100%），即時預覽，可連動新增風險。
- **批次貼入模式**：支援 Slack / Email / JIRA / 純文字格式，呼叫 `parseText()` 自動解析，勾選確認後批次匯入。
- **表單防呆**：全站 Dirty Tracking，有未儲存變更時攔截離頁。

### 4.3 風險管理（risks.html）

- 頂部統計條（總計 / 高 / 中 / 低 / 已關閉）。
- 多條件篩選：等級單選、狀態**複數選** chip、子組下拉。
- 升降級按鈕、自動風險建議 banner。
- **跨週齡 Badge**：`weekStart` < 當前週次的項目自動顯示「🕒 WXX · N週」（1週藍 / 2週橘 / 3+週紅）。

### 4.4 Action Items（actions.html）

- 三欄並排（技術 / 業務 / 資源），整體完成率進度條。
- 點擊狀態 badge 循環切換（待辦 → 進行中 → 完成 → 阻塞）。
- 逾期警示（3 天內到期整行黃底 ⏳，已逾期紅色左邊框）。
- 關聯專案下拉動態從 store 載入（`store.getAll('projects')`）。
- **跨週齡 Badge**：同 risks.html。

### 4.5 里程碑時間軸（milestones.html）

- 垂直時間軸，月份分組，今日橘色虛線分隔。
- 節點狀態邏輯：delayed → ⚠️、done → ✅、today → 🎯、future → 📅。
- Drag & Drop 同日排序（交換 `_order` 欄位）。
- inline 編輯面板，歷史唯讀模式。

### 4.6 跨週未結項目追蹤（tracker.html）

- 彙整 `weekStart < 當前週次` 且仍未結案的 Projects（at-risk/behind）、Risks（open/in-progress）、Actions（pending/in-progress/blocked）。
- 子組篩選、三種排序、inline 狀態更新。
- 提供跨週積壓問題的全域視角。

### 4.7 趨勢分析（trends.html）

- 週數選擇器（4 / 8 / 12 週）。
- Chart.js 圖表：整體健康度折線、風險堆疊長條（High/Medium/Low）、Action 完成率雙軸折線。
- 各子組健康度折線（5 條線）。
- 本週 vs 上週 KPI 對比卡片（含 diff-badge）。
- `_injectCurrentWeek()`：最新週即時資料注入，圖表反映最新狀態而非僅快照。
- Resource Matrix：Top 5 負責人柱狀圖，超過 3 項自動紅色高亮。

### 4.8 週報預覽與匯出（report.html）

- 雙欄佈局：左側設定面板（260px）+ 主區 Markdown 預覽。
- 支援手動貼入或直接編輯 Markdown；`marked.js` 即時渲染。
- 匯出格式：`.md` 下載 / DOCX（docx.js）/ PDF（html2canvas + jsPDF）。
- 儲存草稿至 store（`store.newDraftVersion()`）。

### 4.9 審核流程（review.html）

- 4 步驟 Stepper：草稿建立 → 送出審核 → 審核中 → 已核准。
- 核准自動建立週快照，退回需填寫原因。
- 版本歷史列表，可切換查看歷史版本。

### 4.10 AI Skill 週報草稿生成

- **觸發方式**：在 Claude Code 說「生成 W## 週報草稿」。
- **輸入來源**：Notion 會議記錄（優先）或 PDF 備用。
- **輸出**：`ProgramSync_W##_YYYY-MM-DD_draft.md`，格式對應 Dashboard JSON 欄位。
- **流程**：草稿輸出 → 人工審閱 → 確認後透過 `scripts/import-draft.py` 匯入後端。

### 4.11 系統穩定性功能

- **Dirty Tracking**：全站攔截未儲存離頁。
- **Corrupt Data Self-Healing**：localStorage 損毀時提供一鍵重置按鈕。
- **連線狀態指示器**：Navbar 右上角呼吸燈（Offline / Syncing / Saved / Failed）。
- **Safari Private Mode Fallback**：localStorage 不可用時自動切換 in-memory 儲存。

---

## 5. 資料模型

### 5.1 前端 localStorage 資料結構（以 `pgm_sync_` 為前綴）

| Key | 說明 |
|-----|------|
| `pgm_sync_projects` | 專案陣列（含 id, name, team, status, progress, owner, blockers…） |
| `pgm_sync_risks` | 風險陣列（含 id, level, description, project, dueDate, status…） |
| `pgm_sync_actions` | Action 陣列（含 id, category, task, owner, dueDate, status, project…） |
| `pgm_sync_milestones` | 里程碑陣列（含 id, name, date, team, status, _order…） |
| `pgm_sync_snapshots` | 週快照陣列（含 weekLabel, onTrackPct, atRiskCount, teamHealth…） |
| `pgm_sync_drafts` | 週報草稿陣列（含 content, reviewStatus, author, reviewedBy…） |

### 5.2 專案狀態值

`on-track` / `at-risk` / `behind` / `paused` / `completed`

### 5.3 後端週次快照（backend/data/weeks/W##.json）

每週歸檔時，前端呼叫 `POST /api/weeks/:weekLabel` 儲存完整週資料（projects + risks + actions + milestones + snapshots）。

---

## 6. 系統架構設計與技術指標

### 6.1 前端

- **技術**：純 HTML5 + ES Modules + CSS Variables（Vanilla JS，**無框架**）
- **版本**：program-sync v2.4
- **CDN 依賴**：marked.js 9.0.0、Chart.js 4.4.0、docx 8.5.0、FileSaver、html2canvas、jsPDF
- **頁面數**：9 個（index / input / risks / actions / milestones / tracker / report / trends / review）

### 6.2 後端

- **技術**：Node.js + Express，同時作為 API 伺服器與靜態檔案伺服器
- **資料層（雙模式）**：
  - 本地開發：JSON 檔案（`backend/data/weeks/W##.json`）
  - Production：PostgreSQL（Railway 提供，環境變數 `DATABASE_URL` 觸發）；首次啟動自動從 JSON 檔種子資料匯入
- **API 端點**（見下表）

| 路由 | 方法 | 說明 |
|------|------|------|
| `/api/health` | GET | 健康檢查 |
| `/api/reports` | GET | 列出 Markdown 週報 |
| `/api/reports/:filename` | GET | 取得單份週報內容 |
| `/api/reports/:filename/download` | GET | 下載 .md 檔 |
| `/api/reports` | POST | 儲存週報（需 Admin Token） |
| `/api/reports/:filename` | DELETE | 刪除週報（需 Admin Token） |
| `/api/state` | GET/POST | 跨瀏覽器 App State 同步 |
| `/api/weeks` | GET | 列出所有週次快照摘要 |
| `/api/weeks/:weekLabel` | GET | 取得指定週資料 |
| `/api/weeks/:weekLabel` | POST | 儲存週資料（需 Admin Token） |
| `/api/release/:weekLabel` | POST | 本機觸發 release-week.sh（僅 localhost） |
| `/read` | GET | NotebookLM 整合（純 HTML 彙整所有週報） |

### 6.3 安全性

- **Admin Token**：寫入 API（POST/DELETE）需帶 `X-Admin-Token` header；Railway 部署時設定 `ADMIN_TOKEN` 環境變數啟用。
- **CORS 限制**：`CORS_ORIGIN` 環境變數可限定允許來源（逗號分隔）；未設定則開放（開發環境向下相容）。
- **路徑遍歷防護**：所有檔案路由使用 `path.basename()` 清洗，並限制副檔名為 `.md`。
- **Localhost-only 端點**：`POST /api/release/:weekLabel` 只接受 `127.0.0.1` / `::1`，Production 無法觸發。

### 6.4 基礎設施

- **部署平台**：Railway（Docker container 化）
- **CI/CD**：GitHub Actions 每週自動健康檢查（`.github/workflows/weekly-health.yml`）
- **Agent**：`agent/health-check.js` + `agent/fix-agent.js`，定期監控並自動修復常見問題

---

## 7. 每週操作 SOP

```
週一：./scripts/new-week.sh W##     # 從上週複製資料，建立新週 JSON
      瀏覽器 → input.html            # 更新本週狀態
週中：瀏覽器 → risks / actions       # 持續更新
      Claude Code → 「生成 W## 週報草稿」 # AI 產出草稿
週末：瀏覽器 → review.html 審核通過  # 建立快照
      ./scripts/release-week.sh W## # 驗證 → git commit → push → Railway 自動部署
```

---

## 8. 上線與驗收標準

1. **Dashboard 即時性**：當週資料更新後，所有 KPI 與圖表需即時反映（同 tab `store:updated`、返回鍵 `pageshow`、跨 tab `storage` 三事件同步）。
2. **歷史週查閱**：點擊歷史週 Tab，需在 1 秒內從後端載入並渲染快照資料。
3. **週報草稿**：AI Skill 可在 3 分鐘內從 Notion 會議記錄產出格式正確的草稿 `.md`。
4. **自動部署**：執行 `release-week.sh` 並 push 後，Railway 在 3 分鐘內完成部署。
5. **容錯機制**：localStorage 損毀不導致白屏，提供自救 UI；後端 PostgreSQL 不可用時自動降級至 JSON 檔模式。
6. **效能指標**：初始載入 < 2 秒（正常網路環境）；Bundle 無需建置步驟，直接 serve 靜態 HTML。
7. **跨瀏覽器**：Chrome 90+ / Firefox 88+ / Safari 14+ 均可正常操作。

---

## 9. 未來與後續迭代（Phase 2 & beyond）

### 高優先

- **Microsoft AAD 登入整合**（方案文件已完成：`docs/AAD_整合建議.md`）
  - MSAL.js（前端）+ Express JWT 驗簽（後端）
  - 支援 App Roles：`PgM.Write`（編輯）/ `PgM.Read`（唯讀）
  - 工作量估計：約 2 天（含 IT App Registration）

### 中優先

- **Email / Teams 通知**：Action 逾期或里程碑到期自動發送提醒。
- **行動裝置最佳化**：目前 responsive 僅基本支援，需強化觸控操作體驗。
- **週報 PDF 美化**：目前 PDF 為截圖轉換，需改為排版式輸出。

### 低優先

- **全文搜尋**：跨週次、跨項目的關鍵字搜尋。
- **自動圖表**：進度數據自動視覺化為燃盡圖或甘特圖。
- **評論與標記**：在特定專案 / 風險留言或 @ 成員。
- **Webhook 整合**：從 JIRA 或 GitHub 自動匯入進度更新。
