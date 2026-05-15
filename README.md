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

1. **在 Claude Code 提供本週會議記錄連結** → AI 讀取 Notion 頁面 + PM Tasks，產出草稿存入 `backend/drafts/`
2. **開啟草稿確認內容無誤**（審閱專案狀態、Action Items、Risks）
3. **在 Claude Code 說「請將 W## 草稿匯入 Dashboard」** → AI 執行 `import-draft.py` 推送至 Railway

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
| [docs/AAD_整合建議.md](docs/AAD_整合建議.md) | Microsoft AAD 整合規劃（待實作） |

---

*建置人：Alex Liao／VIA Technologies*
