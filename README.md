# VIA Technologies — PgM Weekly Report System

VIA Technologies Program 團隊週報管理系統。支援多週歷史瀏覽、專案狀態追蹤、Action Items 管理，資料同步至 Railway PostgreSQL，網頁編輯結果永久保存。

**公開網址：** https://pgm-weekly-report-production.up.railway.app

---

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Railway](https://img.shields.io/badge/Deployed_on-Railway-0B0D0E?logo=railway&logoColor=white)

---

## 功能特色

- **Dashboard** — 當週專案狀態總覽（on-track / at-risk / behind / completed）
- **歷史週次瀏覽** — W09 起所有週次可切換查看
- **Action Items & Risk Register** — 分類追蹤，支援網頁直接編輯
- **PostgreSQL 持久化** — 網頁編輯自動同步至 DB，不受 redeploy 影響
- **AI 草稿生成** — Claude Code 讀取 Notion 會議記錄，自動產出結構化草稿
- **一鍵匯入** — `import-draft.py` 將草稿直接推送至 Railway，跳過手動 JSON 編輯
- **資料驗證工具** — `validate-week.py` + pre-push hook 防止無效資料進入 repo

---

## 每週更新流程（三步驟）

1. **說「生成 Week## 週報」** → AI 讀取 PDF / MD 會議記錄，產出九章敘事週報（含 Dashboard Appendix），存入 `VIA_Cowork/.../Final/Week##_MMDD/`
2. **開啟週報審閱內容**（確認各章節正確、補充 `[待確認]` 項目）
3. **說「請將 Week## 週報匯入 Dashboard」** → AI 執行 `import-draft.py` 推送至 Railway

### 詳細流程說明

```
提供 W## 會議記錄（PDF 或 MD）
    ↓
Claude 生成 YYMMDD_ProgramSync_Week##_FINAL.md
（九章敘事 + Appendix: Dashboard Export）
    ↓
Alex 審閱確認
    ↓
說「請將 Week## 週報匯入 Dashboard」
    ↓
Railway Dashboard 更新完成
```

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

**資料保留邏輯**：`--push` 時先從 Railway 抓現有資料作為合併基底，確保 Quick Input 手動更新不被覆蓋。

| 欄位 | push 時行為 |
|------|------------|
| 專案 progress % | `[keep]` → 保留 Railway 現有值 |
| Action Items status | Railway 有紀錄 → 保留；MD=`done` → 更新 |
| Milestones status | Railway 有紀錄 → 保留；MD=`done` → 更新 |
| members | 完整繼承 Railway，不被空值覆蓋 |

```bash
# v2 九章週報匯入
python3 scripts/import-draft.py \
  "VIA_Cowork/.../Final/Week21_0518/260520_ProgramSync_Week21_FINAL.md" --push

# 略過確認直接推送
python3 scripts/import-draft.py <path> --push --yes

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
│   ├── validate-week.py   # JSON 資料驗證器
│   ├── new-week.py        # 新週生成工具
│   └── install-hooks.sh   # Git pre-push hook 安裝
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
