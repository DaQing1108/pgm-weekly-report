# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概覽

VIA Technologies PgM 週報管理系統。Express 後端 + Vanilla JS SPA，部署於 Railway。資料同步至 PostgreSQL，本機開發讀本地 JSON。

**線上網址**：https://pgm-weekly-report-production.up.railway.app

---

## 本機開發

```bash
cd backend && npm install
npm run dev        # 啟動於 localhost:3001（nodemon，自動重載）
```

開啟瀏覽器 `http://localhost:3001`。不需要 PostgreSQL，自動使用 `backend/data/weeks/*.json`。

---

## 每週 SOP

```bash
./scripts/new-week.sh W##          # 週一：從上週複製建立新週 JSON
# … 在瀏覽器 input.html 更新本週資料 …
./scripts/release-week.sh W##      # 週末：驗證 → git commit → git push → Railway 自動部署
```

> ⚠️ **絕對不要在週中 commit `backend/data/weeks/W##.json`**，只有 `release-week.sh` 才應觸發該檔案的提交。

---

## AI 草稿流程

1. 說「生成 W## 週報草稿」→ 觸發 `anthropic-skills:program-sync-report` Skill
2. Skill 讀取 `docs/組織架構與人員名單.md` → fetch Notion 會議頁面 → 解析 PM Tasks 貼入內容
3. 草稿輸出至 `backend/drafts/ProgramSync_W##_YYYY-MM-DD_draft.md`（`.gitignore`，不進版控）
4. 審閱後執行匯入：

```bash
python3 scripts/import-draft.py backend/drafts/ProgramSync_W##_YYYY-MM-DD_draft.md
```

---

## 架構

```
Express (backend/src/index.js)
  └── db.js — 雙模式資料層
        ├── 有 DATABASE_URL → PostgreSQL (pg Pool)
        └── 無 → 讀寫 backend/data/weeks/*.json

program-sync/ (Vanilla JS SPA，Express static serve)
  ├── assets/js/store.js   — localStorage CRUD + 統計 + 快照（Safari 無痕 fallback）
  ├── assets/js/api.js     — 後端 API 客戶端（含 AbortSignal.timeout polyfill）
  └── assets/js/app-init.js — 跨頁初始化 + 歷史週切換
```

**資料流**：瀏覽器 store.js（localStorage）→ api.js PUT `/api/weeks/:label` → db.js → PG 或本地 JSON。

**Railway 部署**：`git push` → Dockerfile build → `npm start`。`DATABASE_URL` 決定資料層模式，`ADMIN_TOKEN` 啟用 API 保護，`CORS_ORIGIN` 限制允許的 origin。

---

## 重要限制

- `program-sync-report.skill` 修改後，必須同步更新 `program-sync-report-src/SKILL.md`（兩者內容需一致）
- 功能改動後須更新 `CHANGELOG.md`（格式：`## YYYY/MM/DD — 標題`）
- `STRUCTURE.md` 只在新增/刪除檔案或資料夾時才更新

---

## Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
