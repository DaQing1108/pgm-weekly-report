# VIA Technologies — PgM Weekly Report System

VIA Technologies Program 團隊週報管理系統。支援多週歷史瀏覽、專案狀態追蹤、Action Items 管理，資料同步至 Railway PostgreSQL，網頁編輯結果永久保存。

**公開網址：** https://pgm-weekly-report-production.up.railway.app

---

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Railway](https://img.shields.io/badge/Deployed_on-Railway-0B0D0E?logo=railway&logoColor=white)
![Security](https://img.shields.io/badge/Security-Hardened-2ea44f)
![WCAG](https://img.shields.io/badge/WCAG_2.1-AA-005A9C)

---

## 功能特色

- **Dashboard** — 當週專案狀態總覽（on-track / at-risk / behind / completed）
- **歷史週次瀏覽** — W09 起所有週次可切換查看
- **Action Items & Risk Register** — 分類追蹤，支援網頁直接編輯
- **PostgreSQL 持久化** — 網頁編輯自動同步至 DB，不受 redeploy 影響
- **AI 草稿生成** — Claude Code 讀取 Notion 會議記錄，自動產出結構化草稿
- **一鍵匯入** — `import-draft.py` 將草稿直接推送至 Railway，跳過手動 JSON 編輯
- **資料驗證工具** — `validate-week.py` + pre-push hook 防止無效資料進入 repo
- **API Payload 驗證** — `POST /api/weeks/:weekLabel` 寫入前驗證狀態合法性與欄位型別，非法資料回傳 422 INVALID_PAYLOAD
- **解析器單元測試** — `tests/test_import_draft.py` 58 個測試案例，覆蓋 Appendix 解析、狀態正規化、保留邏輯
- **WCAG 2.1 AA** — 全站鍵盤可及、螢幕閱讀器友善、焦點管理、`aria-live` 通知

---

## 安全設定

部署前請確認 Railway Variables 已設定以下環境變數：

| 變數 | 說明 | 必填 |
|------|------|------|
| `ADMIN_TOKEN` | API 寫入端點認證 token（任意隨機字串） | ✅ |
| `DATABASE_URL` | PostgreSQL 連線字串 | ✅ |
| `NOTION_TOKEN` | Notion Integration Token | ✅（使用 Notion 功能時） |
| `NOTION_DATABASE_ID` | Notion 工作總結倉庫 Database ID | ✅（使用 Notion 功能時） |
| `NOTION_PAGE_ID` | Notion 同步目標 Page ID | ✅（使用 Notion 功能時） |
| `CORS_ORIGIN` | 允許的 CORS origin | 選填 |

> **注意**：`ADMIN_TOKEN` 未設定時，所有寫入端點將回傳 503 拒絕服務（fail-closed 設計）。

---

## 每週更新流程（SOP）

### 週一：開新週

```bash
./scripts/new-week.sh W23 --push
# 從上週繼承 projects / risks / actions / milestones / members
# --push 立即推送至 Railway，防止 seed 資料污染 DB
```

### 週中：填寫週報

1. **說「生成 Week## 週報」** → AI 讀取 PDF / MD 會議記錄，產出九章敘事週報（含 Dashboard Appendix），存入 `VIA_Cowork/.../Final/Week##_MMDD/`
2. **審閱週報**（確認各章節，補充 `[待確認]` 項目，確認 Appendix 四個區塊齊全）
3. **開啟本機 `http://localhost:3001/input.html`** → 使用「AI 週報匯入 & 發布」面板一鍵完成（見下方說明）

### 詳細流程（UI 版，推薦）

```
./scripts/new-week.sh W## --push          ← 週一：建立新週並推 Railway
    ↓
Claude Cowork 生成 YYMMDD_ProgramSync_Week##_FINAL_v2.md
（九章敘事 + Appendix: Dashboard Export，含四個必填區塊）
    ↓
審閱確認（尤其 ### 里程碑 是否存在）
    ↓
開啟 http://localhost:3001/input.html
→ 選擇 Final MD → 自動顯示解析摘要（專案數 / Actions / Risks / 里程碑）
→ 確認資料正確 → 按「🚀 匯入並發布」→ 彈出確認對話框 → 確認執行
→ 自動：解析 → 寫入本地 JSON → PUT Railway DB → git commit → push
→ 自動輪詢 Railway 確認部署成功（最多 3 分鐘）
    ↓
Railway Dashboard 更新完成，部署驗證通過
```

### 詳細流程（命令列版，進階）

```bash
python3 scripts/import-draft.py \
  "VIA_Cowork/.../Final/Week##_MMDD/YYMMDD_ProgramSync_Week##_FINAL_v2.md" \
  --push --auto-release --yes
# --push：推送至 Railway DB
# --auto-release：push 成功後自動執行 release-week.sh（git commit + push）
# --yes：略過確認提示
```

### import-draft.py 旗標說明

| 旗標 | 說明 |
|------|------|
| `--push` | 同步至 Railway 線上 DB |
| `--yes` | 略過確認直接寫入 |
| `--auto-release` | push 成功後自動執行 `release-week.sh`（需搭配 `--push`） |
| `--dry-run` | 只解析 MD 並輸出摘要 JSON，不寫入任何檔案（供 UI 預覽使用） |

### AI 週報生成（`program-sync-report` Skill v2）

在 Claude Code 說「生成 Week## 週報」即觸發。Skill 執行流程：

1. 建立 `VIA_Cowork/.../Raw/Week##_MMDD/` 和 `Final/Week##_MMDD/` 資料夾
2. 讀取上週 Final 週報 → 提取章節 7（Risks）與章節 8（Action Items）作為 carry-over 基礎
3. 萃取本週所有來源 PDF / MD，合併多份文件
4. 生成九章敘事週報 + Humanizer 後處理
5. 在報告末尾附加 `Appendix: Dashboard Export`（四張 Dashboard 相容表格）
6. 輸出 `YYMMDD_ProgramSync_Week##_FINAL.md`

### 匯入 Dashboard（`import-draft.py`）

支援兩種格式：

| 格式 | 來源 | 解析位置 |
|------|------|---------|
| v2 敘事週報 | `YYMMDD_ProgramSync_Week##_FINAL.md` | `Appendix: Dashboard Export` |
| 舊版草稿 | `ProgramSync_W##_YYYY-MM-DD_draft.md` | 四張 Markdown 表格 |

**Appendix 必填四個區塊**（缺少任一 → 該資料為空，匯入後自動警告）：

```markdown
### 專案進度
| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |

### Action Items
| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |

### Risks
| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
```

> **合法 Action 狀態**：`pending` / `in-progress` / `done` / `blocked`
> **合法里程碑狀態**：`upcoming` / `in-progress` / `done` / `delayed`
> **合法專案狀態**：`on-track` / `at-risk` / `behind` / `completed`
>
> 狀態值不在上述清單時，`import-draft.py` 一律 fallback 為 `pending`（Action）或 `upcoming`（里程碑）。API 端點也會在寫入前驗證，非法值回傳 422。

**資料保留邏輯**：`--push` 時先從 Railway 抓現有資料作為合併基底，確保 Quick Input 手動更新不被覆蓋。

| 欄位 | push 時行為 |
|------|------------|
| 專案 progress % | `[keep]` → 保留 Railway 現有值 |
| Action Items status | Railway 有紀錄 → 保留；MD=`done` → 更新 |
| Milestones status | Railway 有紀錄 → 保留；MD=`done` → 更新 |
| members | 完整繼承 Railway，不被空值覆蓋 |
| `_dataVersion` | 每次 import 自動 +1，客戶端瀏覽器強制重新載入 |

**匯入後自動驗證**：若 `weekLabel`、`weekStart`、`milestones`、`members` 為空，或 action 狀態不合法，腳本會列出警告訊息。

```bash
# v2 九章週報匯入（推薦）
python3 scripts/import-draft.py \
  "VIA_Cowork/.../Final/Week22_0525/260527_ProgramSync_Week22_FINAL.md" --push --yes

# 舊版草稿匯入（仍相容）
python3 scripts/import-draft.py backend/drafts/ProgramSync_W##_YYYY-MM-DD_draft.md --push
```

---

## 快速開始（本機）

```bash
# 1. 安裝依賴
cd backend && npm install

# 2. 啟動後端（localhost:3001）
npm run dev

# 3. 執行 Python 工具依賴（可選）
pip install -r scripts/requirements.txt

# 4. 執行解析器單元測試（可選）
pytest tests/test_import_draft.py -v
```

開啟瀏覽器至 `http://localhost:3001`

> 本機模式使用 `backend/data/weeks/*.json` 作為資料來源，無需 PostgreSQL。

---

## 專案結構

```
pgm-weekly-report/
├── backend/
│   ├── src/
│   │   ├── index.js       # Express API server
│   │   └── db.js          # 雙模式資料層（PG / Filesystem）
│   ├── data/weeks/        # 週次 JSON（W09–）
│   └── drafts/            # AI 產出草稿（.gitignore，不提交）
├── program-sync/          # Vanilla JS 前端 SPA
│   └── input.html         # Quick Input 頁面
├── scripts/
│   ├── import-draft.py    # 草稿 → Railway 匯入工具
│   ├── release-week.sh    # 週報發布（含 Skill 同步防護 + git push）
│   ├── validate-week.py   # JSON 資料驗證器
│   ├── new-week.py        # 新週生成工具
│   ├── requirements.txt   # Python 依賴（python-dotenv, pytest）
│   └── install-hooks.sh   # Git pre-push hook 安裝
├── tests/
│   └── test_import_draft.py  # import-draft.py 解析器單元測試（58 cases）
└── PgM_週報系統_建置指南.md  # 完整建置文件
```

---

## 文件

| 文件 | 說明 |
|------|------|
| [STRUCTURE.md](STRUCTURE.md) | 專案結構說明（每個資料夾與檔案的用途） |
| [PgM_週報系統_建置指南.md](PgM_週報系統_建置指南.md) | 完整架構、Railway 部署、AI 草稿流程 |
| [CHANGELOG.md](CHANGELOG.md) | 版本異動紀錄 |
| [docs/PRD.md](docs/PRD.md) | 產品需求文件 |
| [docs/組織架構與人員名單.md](docs/組織架構與人員名單.md) | 人名、BU、術語對照字典（AI Skill 參考來源） |
| [docs/AAD_整合建議.md](docs/AAD_整合建議.md) | Microsoft AAD 整合規劃（待實作） |
| [program-sync-report-src/SKILL.md](program-sync-report-src/SKILL.md) | AI Skill 原始碼（修改後重新 zip 成 .skill） |

---

*建置人：Alex Liao／VIA Technologies*
