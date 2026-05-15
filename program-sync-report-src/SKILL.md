---
name: program-sync-report
description: >
  生成 VIA Technologies Program Sync 週報草稿（供審閱後匯入 Dashboard）。
  當使用者說「生成 W## 週報草稿」、「整理本週會議記錄」、「產出 W## 草稿」、
  「幫我整理這週的進度」時，立即使用此 Skill。
  輸入來源：Notion 會議記錄（優先）或 PDF 檔案（備用）。
  輸出：`ProgramSync_W##_YYYY-MM-DD_draft.md`，格式對應 Dashboard JSON 欄位，
  審閱確認後再匯入 Dashboard，避免匯入錯誤週報。
---

# Program Sync 週報草稿生成 Skill

## 角色定位

你是 VIA Technologies 的「AI Meeting & Reporting Assistant」。

**本 Skill 的唯一用途**：將會議記錄整理為結構化草稿，讓 PgM 審閱後匯入 Dashboard。
輸出格式直接對應 Dashboard 的 projects / actions / risks 欄位，不是給 NotebookLM 的長篇報告。

---

## 第一步：確認週次與輸出路徑

從使用者指令或 ARGUMENTS 取得：
- `weekLabel`：格式 `W##`（例如 `W21`）
- `outputDir`：輸出目錄（預設 `/Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/backend/drafts`）

輸出檔名格式：
```
ProgramSync_{weekLabel}_{YYYY-MM-DD}_draft.md
例：ProgramSync_W21_2026-05-19_draft.md
```

> 檔名含週次 + 日期 + `_draft`，明確標示這是審閱稿，避免與其他檔案混淆。
> 草稿存放在專案 `backend/drafts/`，已加入 `.gitignore`，不會提交至 git。
> 審閱完成後執行 `python3 scripts/import-draft.py {outputDir}/ProgramSync_{weekLabel}_{date}_draft.md` 匯入。

---

## 第二步：讀取組織架構參考文件（唯讀）

先讀取以下人名與術語字典（用於人名校正、BU 分類、產品名稱標準化）：

```
/Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/docs/組織架構與人員名單.md
```

不存在則略過，直接進行下一步。

---

## 第三步：讀取來源資料

### 每週固定來源

| 來源 | URL 性質 | AI 讀取方式 |
|------|----------|------------|
| 當週會議記錄（N 份 Notion 頁面） | 每週不同，用戶提供 URL 清單 | `notion-fetch` 逐一讀取 |
| PM Tasks（Open Tasks view） | 固定資料庫，無法直接列條目 | 用戶複製貼上文字 |

**AI 不自行搜尋 Notion**，原因：`notion-search` 語意匹配無法跨 Product 類別全覆蓋，且日期過濾用的是修改時間而非 `Start Date` 屬性，會漏掉部分會議記錄。

### 來源 1–N：當週會議記錄

標準流程：
1. 使用者列出當週（W##）所有會議的 Notion 頁面 URL
2. AI 對每個 URL 呼叫 `notion-fetch` 讀取內容
3. 記錄每份來源的頁面標題，列入草稿封面

> **提示給使用者**：若不確定當週會議清單，可開啟 Notion `Meeting & Decision Log` 資料庫，依 `Meeting Date` 篩選該週，手動複製所有頁面 URL。

### PM Tasks

**固定資料庫 URL**：`https://www.notion.so/79c0d6045cd34381a284a09ea213115e`

由於 `notion-fetch` 對資料庫只回傳 schema，採用以下流程：

1. 使用者在 Notion 開啟「Open Tasks」view
2. 全選所有任務列（Cmd+A 或手動框選）→ 複製（Cmd+C）
3. 貼入對話視窗
4. AI 解析文字，提取 Task / Status / Priority / Due Date / Owner，與會議記錄內容合併

PM Tasks 欄位對應：
- `Status`（In Progress / Blocked / Waiting）→ Action Items 的狀態欄
- `Priority`（P0–P3）→ 下週重點的優先級
- `Due Date` → Action Items 的目標日期
- `Type`（Risk Mitigation）→ 對應 Risks 表

### 備用：PDF 或 MD 檔案

若使用者上傳 PDF 或指定本機檔案路徑：

```bash
# PDF 萃取（依序嘗試）
pdftotext "檔案路徑" /tmp/source.txt

# 若失敗，改用 pdfplumber
python3 -c "
import pdfplumber
with pdfplumber.open('檔案路徑') as pdf:
    text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
print(text)
" > /tmp/source.txt
```

萃取後用 `wc -l` 確認行數，再以 `Read` 工具分段讀取（每段 500 行）。

### 多來源合併原則

| 情況 | 處理方式 |
|------|---------|
| 多份文件提到同一專案 | 以最新資訊為主，補充獨有細節，不刪除既有資訊 |
| 多份文件數據有出入 | 以最新文件為準，加括注標明 |
| 文件未提及某專案 | 標記 `[本週無新更新]`，不視為未推進 |

**絕對禁止：**
- ❌ 不得捏造進度百分比、人名、日期
- ❌ 不得將某 BU 進度歸入另一 BU
- ❌ 不得刪除已存在的 Action Items

---

## 第四步：Team 分類規則

每個 project / action / risk 均需標注 `team` 欄位。依以下關鍵字推斷，無法判斷則預設 `media-agent`：

| team 值 | 對應關鍵字（出現其中一個即符合） |
|---------|-------------------------------|
| `tv-solution` | OpenMAM、TVBS、人臉、Face、Aura、Olapedia、Logo、側臉 |
| `media-agent` | STT、語音、AI Server、資料管理、Text-Based、AI 剪輯、AI Sharing、Agentic、片庫 |
| `chuangzaoli` | 小栗方、創造栗、SEL、官網、繪本、樂高 |
| `learnmode` | LearnMode、學習吧、加分吧、教育、客語、學校 |

部門正式名稱對照（草稿正文中使用）：
- `tv-solution` → TV Solution 事業部
- `media-agent` → Media Agent BU
- `chuangzaoli` → 創造栗 / 小栗方Pro 事業部
- `learnmode` → LearnMode

---

## 第五步：生成草稿

依以下格式輸出，內容直接對應 Dashboard 欄位：

```markdown
# Program Sync 週報草稿 — {weekLabel}

> **用途**：審閱確認後匯入 Dashboard，請勿直接轉發。
> **來源**：{來源文件清單，逐項列出}
> **產出日期**：{YYYY/MM/DD}
> **對應週次**：{weekLabel}（{weekStart} 起）

---

## 審閱清單

匯入 Dashboard 前，請確認以下項目：

- [ ] 週次正確（{weekLabel}）
- [ ] 所有專案狀態合法（on-track / at-risk / behind / completed）
- [ ] progress=100% 的專案狀態已標記 completed
- [ ] 所有 Action Items 均有負責人（owner 欄不空白）
- [ ] 所有 Action Items 均有分類（technical / business / resource）
- [ ] 所有 project / action / risk 均有 team 欄位
- [ ] Risks 嚴重度已填寫（high / medium / low）
- [ ] 沒有捏造的數字或人名

---

## 本週摘要

（2–3 段，涵蓋本週主要進展、待解決風險、需管理層決策事項。不超過 300 字。）

---

## 專案進度

| 專案名稱 | Team | 狀態 | 進度 % | 本週完成 | 阻礙 / 備註 |
|----------|------|------|--------|----------|------------|
| ...      | tv-solution / media-agent / chuangzaoli / learnmode | on-track / at-risk / behind / completed | 0–100 | ... | ... |

欄位說明（對應 JSON 欄位）：
- 專案名稱 → `name`
- Team → `team`
- 狀態 → `status`（合法值：on-track / at-risk / behind / completed）
- 進度 % → `progress`（整數 0–100）
- 本週完成 → `weekDone`
- 阻礙 / 備註 → `blockers`

---

## Action Items

| # | 任務描述 | 負責人 | Team | 目標日期 | 優先級 | 狀態 | 分類 |
|---|----------|--------|------|----------|--------|------|------|
| 1 | ...      | ...    | ...  | YYYY/MM/DD | P0–P3 | not-started / in-progress / done / cancelled | technical / business / resource |

欄位說明（對應 JSON 欄位）：
- 任務描述 → `task`
- 負責人 → `owner`
- Team → `team`
- 目標日期 → `dueDate`（格式 YYYY-MM-DD）
- 優先級 → `priority`（P0 / P1 / P2 / P3）
- 狀態 → `status`（合法值：not-started / in-progress / done / cancelled）
- 分類 → `category`（technical / business / resource）

---

## Risks

| Risk ID | 風險描述 | Team | 嚴重度 | 狀態 | 因應措施 |
|---------|----------|------|--------|------|----------|
| R-01    | ...      | ...  | high / medium / low | open / in-progress / resolved | ... |

Risks 按嚴重度排序：high → medium → low

欄位說明（對應 JSON 欄位）：
- 風險描述 → `description`
- Team → `team`
- 嚴重度 → `level`（合法值：high / medium / low）
- 狀態 → `status`（open / in-progress / resolved）
- 因應措施 → `mitigation`

---

## 下週重點

| 優先級 | 任務 | 負責人 | Team |
|--------|------|--------|------|
| P0     | ...  | ...    | ...  |
| P1     | ...  | ...    | ...  |
```

---

## 第六步：儲存輸出

```bash
mkdir -p "{outputDir}"
```

使用 `Write` 工具將草稿寫入：
```
{outputDir}/ProgramSync_{weekLabel}_{YYYY-MM-DD}_draft.md
```

---

## 第七步：交付

提供檔案連結，並簡要說明：
1. 來源文件清單（讀取了哪些）
2. 識別到幾個專案、幾個 Action Items、幾個 Risks
3. 審閱清單中有哪些項目需要人工補充（例如負責人未知）
4. 匯入指令

格式：
```
草稿已產出：[ProgramSync_{weekLabel}_{date}_draft.md](computer://{outputDir}/ProgramSync_{weekLabel}_{date}_draft.md)

識別結果：N 個專案 / N 個 Action Items / N 個 Risks
需人工補充：{列出需補充的欄位}

匯入至 Dashboard：
cd /Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report
python3 scripts/import-draft.py {outputDir}/ProgramSync_{weekLabel}_{date}_draft.md
```

---

## 常用術語速查

| 術語                    | 說明                                        |
| --------------------- | ----------------------------------------- |
| STT / ASR             | 語音轉文字 / 自動語音辨識                            |
| MRD                   | Market Requirements Document，市場需求文件       |
| Olapedia              | 名人庫系統                                     |
| OpenMAM               | 開放式媒體資產管理系統                               |
| MBO                   | Management by Objectives，目標管理             |
| NLE / AVID            | 非線性剪輯工作站                                  |
| 校對開銷臨界點               | Correction Overhead Threshold，校對工時 ÷ 影片時長 |
| PgM 追蹤器               | Program Manager 的個人 Action Item 進度表       |
| AI Learning RD Center | VIA 內部 AI 研發中心（Alex 所屬單位）                 |
| LearnMode             | VIA 教育產品線（連寫，非 Learn Mode）                |
| AIWize                | AI 賦能工具線（AIWize，非 AI Wize）                |
