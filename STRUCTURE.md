# 專案結構說明

本文件說明 `pgm-weekly-report/` 根目錄下每個資料夾與檔案的用途，以及何時需要碰它們。

---

## 根目錄檔案

| 檔案 | 用途 | 何時碰它 |
|------|------|---------|
| `README.md` | GitHub landing page，功能概覽、三步驟更新流程、快速啟動 | 系統功能有重大異動時更新 |
| `CHANGELOG.md` | 版本異動紀錄，按日期列出每次修改內容 | 每次發版後補記 |
| `PgM_週報系統_建置指南.md` | 完整技術文件：架構說明、Railway 部署、PostgreSQL 設定、每週 SOP | 建置新環境或 SOP 有變動時查閱/更新 |
| `Dockerfile` | Docker container 設定，Railway 以此建置並部署服務 | 需要更改 Node 版本或 build 步驟時 |
| `railway.json` | Railway 平台部署設定（指定使用 Dockerfile builder） | 幾乎不需要動 |
| `.gitignore` | Git 排除清單（node_modules、.env、backend/drafts/ 等） | 新增不應 commit 的檔案類型時 |
| `pptx-template.skill` | Claude Code Skill：根據參考資料產出 PPT 範本 | 觸發詞：「做成範本」「做 PPT 範本」 |
| `program-sync-report.skill` | Claude Code Skill：讀取 Notion 會議記錄，產出週報草稿 | 觸發詞：「生成週報」「更新週報」「升版」 |

---

## 資料夾

### `backend/` — 後端服務

Express API server + 所有持久化資料。

```
backend/
├── src/
│   ├── index.js     Express server（路由定義、靜態 serve）
│   └── db.js        雙模式資料層：有 PG 環境用 PostgreSQL，否則讀本地 JSON
├── data/
│   └── weeks/       週次快照 JSON（W09.json、W10.json … 永久保存）
├── drafts/          AI 產出的週報草稿（.gitignore，不進版控）
├── reports/         每週 Markdown 週報（Pgm_Weekly_Report_YYMMDD.md，進版控）
├── package.json
└── package-lock.json
```

**何時碰它：**
- `src/` — 需要修改 API 邏輯或新增路由時
- `data/weeks/` — 每週由 `scripts/new-week.sh` 自動建立，通常不手動編輯
- `drafts/` — AI 草稿暫存區，審閱完用 `scripts/import-draft.py` 匯入後可刪除
- `reports/` — 每週將 Markdown 週報放入此處，再 git commit + push 即完成發布

---

### `program-sync/` — 前端管理介面

Vanilla JS SPA，所有網頁管理功能都在這裡。

```
program-sync/
├── index.html        Dashboard（KPI + 專案狀態總覽）
├── input.html        快速輸入 / 本週資料建立（⬅ 每週主要操作入口）
├── risks.html        風險管理（多選篩選 + 跨週齡 badge）
├── actions.html      Action Items（逾期預警 + 跨週追蹤）
├── milestones.html   里程碑時間軸
├── review.html       審核與快照建立（⬅ 週結束時在這裡歸檔）
├── trends.html       歷史趨勢圖表 + 資源矩陣
├── report.html       週報草稿編輯
├── resources.html    資源管理
└── assets/
    ├── css/
    │   ├── base.css        CSS 變數、reset、typography
    │   ├── components.css  UI 元件樣式
    │   └── layout.css      版型、格線、responsive
    └── js/
        ├── store.js        localStorage CRUD + 統計 + 快照
        ├── ui.js           Toast / Modal / 通用 UI helpers
        ├── api.js          後端 API 串接（含 polyfills）
        ├── app-init.js     跨頁初始化 + 歷史週切換
        ├── export.js       資料匯出
        ├── import.js       資料匯入 / 批次解析
        ├── parse-history.js 歷史紀錄解析
        ├── schema.js       資料結構定義（Objectives、STATUS_OPTIONS）
        └── seed.js         初始種子資料
```

**何時碰它：**
- 每天操作用瀏覽器開 `http://localhost:3001`，不需要直接編輯這些檔案
- 需要修改 UI 行為或新增功能時才編輯 JS/CSS

---

### `scripts/` — 自動化工具

每週發布流程使用的腳本，**按順序執行**。

| 腳本 | 用途 | 執行時機 |
|------|------|---------|
| `new-week.sh` | 建立新週 JSON（從上週複製資料） | 每週一，開始新週前 |
| `import-draft.py` | 將 AI 草稿推送至 Railway（跳過手動 JSON 編輯） | 審閱草稿後執行 |
| `validate-week.py` | 驗證週次 JSON 格式是否正確 | release 前，或懷疑資料有問題時 |
| `release-week.sh` | 週結束發布：驗證 → git commit → git push → Railway 自動部署 | 每週結束，完成歸檔後 |
| `gen-report.py` | 輔助生成週報 Markdown 草稿 | 需要時手動執行 |
| `install-hooks.sh` | 安裝 git pre-push hook（push 前自動驗證資料） | 第一次 clone 後執行一次 |

**標準每週流程：**
```bash
./scripts/new-week.sh W21          # 週一：建立新週基底
# … 在瀏覽器更新本週資料 …
./scripts/release-week.sh W21      # 週結束：驗證並發布
```

---

### `agent/` — 健康檢查 Agent

部署在 Railway 的自動化健康監控，不需要手動操作。

| 檔案 | 用途 |
|------|------|
| `health-check.js` | 定期檢查 API 健康狀態，偵測異常 |
| `fix-agent.js` | 自動修復常見問題（路徑保護、資料驗證） |
| `create-pr.sh` | 自動建立修復用 PR |
| `package.json` | Agent 的 npm 依賴（`@anthropic-ai/sdk`） |

---

### `docs/` — 設計與規劃文件

規劃階段產出的文件，不影響系統運作。

| 檔案 | 內容 |
|------|------|
| `PRD.md` | 產品需求文件（v1.0，2026/04/06） |
| `AAD_整合建議.md` | Microsoft AAD 登入整合方案（待規劃，Pre-implementation） |

---

### `.github/` — CI/CD 設定

```
.github/workflows/
└── weekly-health.yml   每週自動執行健康檢查（GitHub Actions）
```

通常不需要修改，除非要調整自動化排程或檢查條件。

---

### `.claude/` — Claude Code 工作設定

Claude Code session 的本地設定，自動管理，不需手動修改。

| 項目 | 說明 |
|------|------|
| `settings.local.json` | 本地 Claude 設定（不進版控） |
| `launch.json` | Claude session 啟動設定 |
| `PRPs/` | Claude Code 產出的 PR review 記錄 |

---

## 快速索引：我要做什麼？

| 任務 | 對應位置 |
|------|---------|
| 開始新的一週 | `./scripts/new-week.sh W##` |
| 更新本週專案狀態 | 瀏覽器 → `input.html` |
| 查看 Dashboard | 瀏覽器 → `index.html` |
| 管理風險 / Action Items | 瀏覽器 → `risks.html` / `actions.html` |
| 生成本週 AI 草稿 | Claude Code 說「生成 W## 週報草稿」 |
| 匯入草稿至 Railway | `python3 scripts/import-draft.py` |
| 週結束發布 | `./scripts/release-week.sh W##` |
| 查看歷史異動 | `CHANGELOG.md` |
| 了解完整技術細節 | `PgM_週報系統_建置指南.md` |
| 了解產品規格 | `docs/PRD.md` |
