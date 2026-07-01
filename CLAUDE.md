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

## 標準指令：「發布 W## 週報」

當使用者說「**發布 W## 週報**」（例如「發布 W26 週報」），你必須自動執行以下流程，不需要使用者提供路徑或任何技術細節：

### 執行步驟

1. **找到 FINAL.md**
   ```
   find ~/Documents/VIA_Cowork/2A_Areas/Program_Sync/Final -name "*Week##*FINAL*.md" | sort | tail -1
   ```
   將 `##` 替換為實際週次數字（例如 26）。

2. **確認檔案存在**，若找不到則回報：「找不到 W## 的 FINAL.md，請確認檔案已產出在 VIA_Cowork/Final/Week##_MMDD/ 資料夾下。」

3. **執行匯入**（preflight 會自動在內部運行）：
   ```bash
   python3 scripts/import-draft.py "<找到的路徑>" --push --yes
   ```

4. **確認 Railway DB 已更新**：
   ```bash
   curl -s https://pgm-weekly-report-production.up.railway.app/api/weeks/W## | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ W## 確認：{len(d.get(\"projects\",[]))} 專案 / {len(d.get(\"actions\",[]))} Actions / {len(d.get(\"milestones\",[]))} 里程碑')"
   ```

5. **回報結果**，格式如下：
   ```
   ✅ W## 發布完成
   • 專案：N 筆
   • Action Items：N 筆
   • Risks：N 筆
   • 里程碑：N 筆
   • Railway DB：已同步
   ```
   若有 ⚠️ 警告（例如負責人待確認），一併列出。

> 使用者不需要知道 local server、localhost、--push 旗標、Appendix 格式等技術細節。

---

## 每週 SOP

```bash
./scripts/new-week.sh W##          # 週一：從上週複製建立新週 JSON
# … 在瀏覽器 input.html 更新本週資料 …
./scripts/release-week.sh W##      # 週末：驗證 → git commit → git push → Railway DB 同步
```

`release-week.sh` 執行順序：
1. 驗證 JSON 格式
2. git add → git commit → git push
3. **自動** `POST /api/weeks/:week` 將資料同步至 Railway PostgreSQL（從 `.env` 讀取 `ADMIN_TOKEN`）

> ⚠️ **絕對不要在週中 commit `backend/data/weeks/W##.json`**，只有 `release-week.sh` 才應觸發該檔案的提交。

> ⚠️ **Railway 使用 PostgreSQL，JSON 檔案只供本機開發使用。** `git push` 僅部署程式碼，資料必須透過 `POST /api/weeks/:week` 寫入 DB。`release-week.sh` 已自動處理此步驟。

### 手動同步 Railway DB（緊急補救）

若 `release-week.sh` 同步失敗，可手動執行：

```bash
source .env
curl -X POST https://pgm-weekly-report-production.up.railway.app/api/weeks/W## \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d @backend/data/weeks/W##.json
```

> 注意：後端驗證 header 名稱為 `x-admin-token`，不是 `Authorization: Bearer`。

---

## AI 草稿流程

1. 說「生成 W## 週報草稿」→ 觸發 `anthropic-skills:program-sync-report` Skill
2. Skill 讀取 `docs/組織架構與人員名單.md` → fetch Notion 會議頁面 → 解析 PM Tasks 貼入內容
3. 草稿輸出至 `backend/drafts/ProgramSync_W##_YYYY-MM-DD_draft.md`（`.gitignore`，不進版控）
4. 審閱後執行匯入：

```bash
python3 scripts/import-draft.py backend/drafts/ProgramSync_W##_YYYY-MM-DD_draft.md
```

### Appendix 必填區塊（v2 週報格式）

`import-draft.py` 從 `## Appendix: Dashboard Export` 解析四個子區塊，**缺少任何一個將導致該資料為空**：

```markdown
## Appendix: Dashboard Export

### 專案進度
| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |

### Action Items
| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |

### Risks
| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
```

> Action 狀態合法值：`pending` / `in-progress` / `done` / `blocked`
> 里程碑狀態合法值：`upcoming` / `in-progress` / `done` / `delayed`

> ⚠️ **`### 里程碑` 區塊容易被遺漏。** 章節 9 的里程碑總表不會被自動解析，必須在 Appendix 中另行補寫。若 `import-draft.py` 回報「里程碑：0 筆」，代表此區塊缺失。

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

- `program-sync-report-src/SKILL.md` 是唯一應手動編輯的來源。**改完後必須執行 `./scripts/sync-skill.sh`**，一次完成三份副本同步：
  1. 重新打包 `program-sync-report.skill`（進版控）
  2. 安裝到 `~/.claude/skills/program-sync-report/SKILL.md`（Claude Code 實際載入執行的版本）
  3. 驗證三份內容一致
  > ⚠️ **W27 曾踩過的坑**：只改了 `program-sync-report-src/SKILL.md` 並 commit，但忘記重新安裝到 `~/.claude/skills/program-sync-report/`，導致 Claude 實際生成草稿時用的是舊版指令，修復的內容（里程碑必填警告）完全沒生效。改完 Skill 沒跑 `sync-skill.sh` 等於沒改。
- 功能改動後須更新 `CHANGELOG.md`（格式：`## YYYY/MM/DD — 標題`）
- `STRUCTURE.md` 只在新增/刪除檔案或資料夾時才更新

---

## 經驗存檔指令 (#save notion)

當使用者在對話中輸入「#save notion」時，你必須自動啟動「經驗儲存工作流」：
1. **回顧與萃取**：將本次對話的討論內容整理為結構化經驗筆記，包含以下 7 大段落：
   - **1. BLUF** (結論先講)
   - **2. 問題描述 (Problem)**
   - **3. 根因 (Root Cause)**
   - **4. 排查與驗證過程 (Investigation)**
   - **5. 解法 (Resolution / Fix)**
   - **6. 後續行動 (Next Actions)**
   - **7. 可複用摘要 (Reusable Notes)**
2. **生成 Front-Matter**：在最頂部生成符合 Notion 資料庫欄位的屬性：
   ```markdown
   # Title: [Title of the Note]
   - Date: YYYY-MM-DD
   - Tags: Claude, Notion, Automation, Workflow (根據討論內容挑選)
   - Status: Done
   - Source: Claude chat
   - BLUF: [Short one-sentence summary]
   ```
3. **寫入檔案**：將內容寫入本機 `knowledge_note.md` (複寫覆蓋)。
4. **執行同步**：主動執行命令 `node scripts/save-notion.js` 將其新增至 Notion 資料庫「工作總結倉庫」。

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
