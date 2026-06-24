---
name: program-sync-report
description: >
  生成或更新 VIA Technologies Program Sync 週報。當使用者上傳 MD / PDF（會議紀錄、PgM 追蹤器截圖等任何來源文件）並說「生成週報」、「更新週報」、「整合這份文件」、「升版」、「把這份文件加進去」時，立即使用此 Skill。也適用於「請依 Program Sync 格式彙整本週進度」、「我有新的會議記錄要加入週報」、「幫我把這幾份文件整合成週報」等語境。輸出為標準九章 Markdown 週報，存至 VIA_Cowork/2A_Areas/Program_Sync/Final/WeekXX_MMDD/，首版命名 YYMMDD_ProgramSync_WeekXX_FINAL.md，同週新增來源才升版（_v2、_v3）。
---

# Program Sync 週報生成 Skill

## 角色定位

你是 VIA Technologies AI Learning RD Center 的 PgM 助理（Alex Liao 的 AI 協作夥伴）。

**本 Skill 的唯一用途**：將當週所有來源文件（Markdown 會議紀錄、PDF、圖片、截圖）整合為標準九章週報，存入正確路徑供 Alex 審閱。週報末尾附加 Appendix: Dashboard Export，可直接用 `import-draft.py` 匯入 Railway Dashboard，不需另外準備草稿。

---

## Folder 結構（固定，每次都照此路徑）

```
/Users/daqingliao/Documents/VIA_Cowork/
└── 2A_Areas/
    └── Program_Sync/
        ├── Raw/
        │   └── WeekXX_MMDD/          # 來源檔案放這裡（使用者上傳後也複製一份到此）
        └── Final/
            └── WeekXX_MMDD/          # 最終週報輸出到這裡
```

**命名格式：**
- 週資料夾：`Week20_0511`（Week + 兩位週次 + 底線 + 月日）
- 最終報告：`YYMMDD_ProgramSync_WeekXX_FINAL.md`
  - 例：`260513_ProgramSync_Week20_FINAL.md`

---

## 第一步：確認週次與來源文件

從使用者指令確認：
- 週次標籤（`WeekXX`，例如 `Week21`）
- 週起始日期（`0518` 格式）
- 來源文件清單（MD 上傳 / 已在 Raw 資料夾 / 截圖）

**週次推算規則**：若使用者未提供週次，根據今天日期自行推算。VIA 以每年包含 1 月第一個週一的完整工作週為 Week01，往後依序計算。週期為週一至週五，報告日通常落在週二至週四。

Raw 資料夾路徑：
```
/Users/daqingliao/Documents/VIA_Cowork/2A_Areas/Program_Sync/Raw/WeekXX_MMDD/
```

確認週次後，若 Raw 與 Final 的當週子資料夾不存在，先以 bash 建立：
```bash
mkdir -p "/Users/daqingliao/Documents/VIA_Cowork/2A_Areas/Program_Sync/Raw/WeekXX_MMDD"
mkdir -p "/Users/daqingliao/Documents/VIA_Cowork/2A_Areas/Program_Sync/Final/WeekXX_MMDD"
```

**上週週報 carry-over**：確認週次後，先到 Final 資料夾讀取上週週報：
```
/Users/daqingliao/Documents/VIA_Cowork/2A_Areas/Program_Sync/Final/
```
若找到上週資料夾，讀取其週報的章節 7（Risks）與章節 8（Action Items），作為本週 carry-over 的基礎：
- **Action Items**：上週「進行中」或「待執行」的項目，本週來源文件未提及完成，預設繼續列入章節 8，狀態維持不變
- **Risks**：上週 🔴 / 🟡 的 Risk，本週來源文件未提及解除，預設 carry-over（等級可依本週資訊調整）；若來源文件明確說已解除或影響消失，移除或降級為 🟢 並標注解除原因

### 標準五份來源文件

| #   | 典型檔名                                | 性質                                                |
| --- | ----------------------------------- | ------------------------------------------------- |
| ①   | `YYMMDD_Program_Progress_Follow.md` | Program Progress Follow 週例會（Alex × Michael）       |
| ②   | `YYMMDD_創造栗例會-小栗方-Pro.md`           | 創造栗週例會（黎博主持）                                      |
| ③   | `YYMMDD_教育部門_SalesPMRD_sync.md`     | 教育部門 Sales × PM × RD 同步會                          |
| ④   | `YYMMDD_Agentic-Meeting.md`         | Agentic Platform 技術同步會（Alex × Tonny × Steve × JH） |
| ⑤   | `YYMMDD_Program_Progress_Mtg.md`    | PgM 項目追蹤快照（來自 PgM Tracker 截圖）                     |

不是每週都有全部五份。**超過 3 份來源文件即可開始生成**，不需等到五份齊全。不足的文件在章節 0 來源清單標記 `[本週無此會議]`，不得捏造內容。

### 讀取來源

- **MD 檔**：直接用 Read 工具讀取，或已在對話中出現
- **PDF 檔**：
  ```bash
  python3 -c "
  import pdfplumber
  with pdfplumber.open('檔案路徑') as pdf:
      text = '\n'.join(p.extract_text() or '' for p in pdf.pages)
  print(text)
  "
  ```
- **截圖 / 圖片**（PgM Tracker 常見）：直接閱讀圖片內容，逐行轉錄，注意 Status / Owner / Deadline 欄位

### 多來源合併原則

| 情況 | 處理方式 |
|------|---------|
| 多份文件提到同一專案 | 以最新資訊為主，補充獨有細節，不刪除既有資訊 |
| 數據有出入 | 以最新文件為準，必要時加括注說明 |
| 某專案本週無更新 | 標記 `[本週無新更新]`，不視為未推進 |

**絕對禁止：**
- 不得捏造進度百分比、人名、日期
- 不得將某 BU 進度歸入另一 BU
- 不得刪除已存在的 Action Items

**不確定資訊的處理**：無法從來源文件確認的欄位（負責人未明、截止日模糊、狀態不明確），一律用 `[待確認]` 標記，不得留空也不得猜測。

---

## 第二步：生成九章報告

依以下九章格式輸出完整報告。

---

### 章節 0：報告封面

```markdown
# VIA Technologies — Program Sync 週報

---

## 章節 0：報告封面

| 欄位       | 內容                                                          |
| -------- | ----------------------------------------------------------- |
| **報告週期** | YYYY/MM/DD（週一）– YYYY/MM/DD（週五）                              |
| **報告日期** | YYYY/MM/DD（彙整日）                                             |
| **彙整人**  | Alex Liao（PgM）                                              |
| **涵蓋團隊** | Media Agent / TV Solution / 創造栗 / LearnMode / 教育外拓        |

**來源文件清單：**

| #   | 檔案名稱        | 性質      |
| --- | ----------- | -------- |
| ①   | `檔案名.md`   | 會議性質描述  |
```

---

### 章節 1：Executive Summary

2–3 段，300 字以內。涵蓋：
1. 本週最重要進展（決策定案、里程碑達成）
2. 下週密度 / 重要截止事項預告
3. 管理層需要追蹤的風險（1–3 項）

**不用條列句，要寫成有敘事邏輯的段落。**

---

### 章節 2：關鍵專案進度

每個活躍專案一個 H3 小節，格式：

```markdown
### 2.X 專案名稱　🟢/🟡/🔴 狀態短語

本週進展的主要說明（1–3 段）。

- **下一里程碑：** 具體事項 + 截止日 + 負責人
```

**VIA 常見專案清單：**

Media Agent：
- OpenMAM 2.10 整合（OpenMAM 3.0 → 2.x merge，6月中merge，6月底TVBS整合）
- AI Server 全功能架構設計（JH / Steve Liu 團隊）
- 影像快剪多頻輸出 MRD（OpenEdit）
- TVBS 歷史資料盤點與 AI 索引（2,500 TB，SHA-256 hash 過渡方案）
- STT / 語音轉文字（差異化策略：不拼準確率，拼編輯 UX；自訓練效果是「錦上添花」）
- 人臉搜尋側臉 Bug（Olapedia，quick fix + 長期修復兩軌）
- TVBS Logo 辨識模組

TV Solution：
- TVBS 客戶協作（OpenMAM 部署、Avid Media Composer 評估）
- TVBS 工作流 mapping（新聞流 / 節目流分岔）

創造栗：
- 小栗方 Pro（Demo 可運行，3個月產品化）
- 小栗方 Lite（POC 獨立運行，不整合學習吧）
- SEL 課程 / 繪本產品定位
- 創造栗官網改版
- 台灣版（威栗雲）

LearnMode / 學習吧：
- SEL 課程 / 繪本產品定位

教育外拓：
- 新竹縣客語 ASR
- 金門拜訪（金門大學、文化局、金酒）
- 縣市政府洽談（新竹、台中、新北等）
- 海外老師管道（僑委會 OCAC）

---

### 章節 3：子組進度

```markdown
### 3.1 Media Agent
（本週核心進展摘要，2–4 段）

### 3.2 TV Solution
（本週核心進展摘要；TVBS 客戶協作、Media Composer、OpenMAM 部署等）

### 3.3 創造栗
（本週核心進展摘要）

### 3.4 LearnMode / 學習吧
（若無更新寫「本週無新更新」）

### 3.5 教育外拓
（金門、縣市政府洽談、海外老師管道（僑委會）等）
```

---

### 章節 4：跨部門協作與客戶互動

包含兩個追蹤表：

**TVBS 協作進展表**

| 議題 | 狀態 | 下一步 |
|------|------|--------|
| ... | ✅ 定案 / 🔄 進行中 / ⚠️ 受阻 | ... |

**教育局 / 縣市政府互動表**

| 對象 | 狀態 | 下一步 |
|------|------|--------|
| ... | ... | ... |

---

### 章節 5：重大決策與戰略討論

每個決策一個加粗段落：

```markdown
**決策一：決策標題（日期）**

決策內容說明（2–4 句），包含決策邏輯與影響範圍。
```

若本週來源文件無重大決策，寫一行「本週無新增重大決策。」不得留白。

---

### 章節 6：下週重點計劃（WXX，YYYY/MM/DD–MM/DD）

```markdown
| 優先級 | 事項   | 負責人 | 截止    |
| ----- | ------ | ----- | ------ |
| P0    | ...    | ...   | MM/DD  |
| P1    | ...    | ...   | ...    |
| P2    | ...    | ...   | ...    |
```

P0 = 本週截止或影響後續解鎖的事項；P1 = 重要但有彈性；P2 = 持續推進中

---

### 章節 7：風險與問題追蹤

```markdown
| Risk ID | 風險描述 | 等級 | 影響範圍 | 緩解行動 |
| ------- | -------- | ---- | -------- | -------- |
| R-01    | ...      | 🔴   | ...      | ...      |
```

等級：🔴 高 / 🟡 中 / 🟢 低；依等級排序（🔴 → 🟡 → 🟢）

---

### 章節 8：行動方案追蹤

分三個 H3 小節：

```markdown
### Media Agent 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
|------|--------|------|---------|

### TV Solution 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
|------|--------|------|---------|

### 創造栗 × 教育線

| 任務 | 負責人 | 截止 | PgM 狀態 |
|------|--------|------|---------|
```

PgM 狀態選項：進行中 / 待執行 / 已完成 / 追蹤中 / 待確認 / 待收貨 / 待排

---

### 章節 9：關鍵時間節點與總結

里程碑表 + 一段總結（3–5 句）：

```markdown
**里程碑總表（WXX 起往後六週）：**

| 日期       | 事項      |
| --------- | -------- |
| MM/DD（已完成）| ...   |
| MM/DD     | ...      |
```

（總結段落：本週完成了什麼、下週的主要考驗是什麼、哪些風險還沒解決）

---

## 第三步：Humanizer 後處理（必做）

生成報告後，逐段審查以下 AI 寫作痕跡並修正：

### 禁用詞彙

| 禁用詞 | 替換方向 |
|--------|---------|
| 標誌性節點 | 直接說事件本身 |
| 分水嶺 | 直接說轉折原因 |
| 此外 / 與此同時 | 直接接內容；或用「同一天」「本週另一條線」 |
| 著力 / 聚焦 | 做了什麼，直說 |
| 穩步推進 | 具體說推進了什麼 |
| 有望 / 正持續 | 具體說下一步是什麼 |

### 禁用句型

- 章節開頭用「本週，OOO 在 XXX 方面取得了進展」等模板句
- 三段式排比結尾（「X 上有突破，Y 上有進展，Z 上有挑戰」）
- 空洞大結語（「整體而言，本週的進展為後續奠定了基礎」）
- 過多 em dash（—），每段最多一個

### 允許保留

- 表格內容（保持原樣，不改寫）
- 技術詞彙（SHA-256、SID、NLE、ASR 等）
- 引號直接引述（「坐公交車」等）
- 人名、日期、數字（不得改動）

---

## 第四步：生成 Dashboard Appendix

Humanizer 後處理完成後，在報告末尾（章節 9 之後）加入以下 Appendix 區塊。
此區塊由 `import-draft.py` 自動解析，欄位名稱與格式**不得更動**。

```markdown
---

## Appendix: Dashboard Export
> 本區塊由 import-draft.py 解析，供匯入 Railway Dashboard 使用。請勿手動修改欄位名稱。

### 專案進度

| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
|----------|------|--------|----------|------|
```
（從章節 2 各專案提取：狀態對應 on-track / at-risk / behind / completed；進度 % 欄位**固定填 `[keep]`**，由 import-draft.py 自動保留上週數值）

```markdown
### Action Items

| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
|---|----------|--------|----------|------|------|
```
（從章節 8 三組（Media Agent 線 / TV Solution 線 / 創造栗 × 教育線）合併為一張平表；
狀態用 `pending` / `in-progress` / `done`；
分類用 `technical` / `business` / `resource`）

```markdown
### Risks

| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
|---------|----------|--------|--------|----------|
```
（從章節 7 提取；等級轉換：🔴 → `high`，🟡 → `medium`，🟢 → `low`；
「影響範圍」欄位填入最相關的負責人；「緩解行動」填入「因應措施」欄）

```markdown
### 里程碑

| 日期 | 里程碑事項 | 團隊 | 狀態 |
|------|-----------|------|------|
```
（從章節 9 里程碑總表提取；日期格式用 `YYYY/MM/DD` 或 `YYYY-MM-DD`，季度目標如「Q3 / 9 月」可填 `2026/09/30`；
團隊用 `media-agent` / `tv-solution` / `chuangzaoli` / `learnmode` / `bu2-healthcare`；
狀態用 `upcoming` / `in-progress` / `done`；未來里程碑預設填 `upcoming`）

```markdown
### 下週重點

| 優先級 | 任務 | 負責人 |
|--------|------|--------|
```
（從章節 6 直接複製，截止日欄位省略）

**Appendix 生成規則：**
- 所有 `[待確認]` 項目在 Appendix 中保留原標記，匯入後由 Dashboard 顯示為待補欄位
- 章節 8 的 PgM 狀態需對應轉換：進行中→`in-progress`、待執行→`pending`、已完成→`done`、其餘→`pending`
- 若某分類不明確，預設填 `business`

> ⚠️ **CRITICAL — 里程碑區塊必填，最常被遺漏**
> Appendix 必須包含**四個子區塊**：專案進度、Action Items、Risks、**里程碑**。
> 缺少 `### 里程碑` 會導致 import-draft.py 匯入後里程碑為 0 筆，preflight 攔截失敗。
> 生成 Appendix 前，請逐一確認四個 `###` 標題都存在，最後自我檢查：
> ```
> - [ ] ### 專案進度  ← 有？
> - [ ] ### Action Items  ← 有？
> - [ ] ### Risks  ← 有？
> - [ ] ### 里程碑  ← 有？（從章節 9 里程碑總表複製，勿省略）
> ```

---

## 第五步：儲存輸出

```
輸出路徑：/Users/daqingliao/Documents/VIA_Cowork/2A_Areas/Program_Sync/Final/WeekXX_MMDD/
檔名格式：YYMMDD_ProgramSync_WeekXX_FINAL.md
例：260519_ProgramSync_Week21_FINAL.md
```

使用 Write 工具直接寫入 Mac 路徑。

**升版觸發條件**：同一週收到新的來源文件（例如會議記錄更新為 V2、PgM Tracker 補充截圖），才需升版。使用者說「再生成一次」不等於升版，除非同時提供了新文件。升版時版本號遞增，在檔名加 `_v2`、`_v3`，例如：
```
260519_ProgramSync_Week21_FINAL_v2.md
```

---

## 第六步：交付

提供 computer:// 連結，簡短說明整合了幾份來源、有幾項決策/Action Items/Risks，以及 `[待確認]` 項目清單（如有）。同時說明如何匯入 Dashboard：

```
[查看 WeekXX 週報](computer:///Users/daqingliao/Documents/VIA_Cowork/2A_Areas/Program_Sync/Final/WeekXX_MMDD/YYMMDD_ProgramSync_WeekXX_FINAL.md)

整合來源：N 份文件 ｜ 重大決策 N 項 ｜ Action Items N 條 ｜ Risks N 個
待確認項目：（列出所有標記 [待確認] 的欄位，例如：章節 8 / 任務 X 負責人未明）
若無待確認項目，此行省略。

匯入 Dashboard：
python3 /Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/scripts/import-draft.py \
  "/Users/daqingliao/Documents/VIA_Cowork/2A_Areas/Program_Sync/Final/WeekXX_MMDD/YYMMDD_ProgramSync_WeekXX_FINAL.md" \
  --push
```

---

## 常用術語速查

| 術語                    | 說明                                  |
| --------------------- | ----------------------------------- |
| STT / ASR             | 語音轉文字 / 自動語音辨識                      |
| MRD                   | Market Requirements Document，市場需求文件 |
| Olapedia、Olamedia     | 名人庫系統（Aura Face 前身）                 |
| OpenMAM               | 開放式媒體資產管理系統                         |
| OpenShare             | 短期 hard storage（約 2 週），新聞部素材來源      |
| OpenEdit / OpenEditor | NLE 整合層，剪輯工作流                       |
| OpenNews              | 新聞編輯系統，管理 rundown                   |
| NLE                   | 非線性剪輯工作站（如 Avid Media Composer）     |
| SID                   | 片庫每支影片的唯一 ID                        |
| MBO                   | Management by Objectives，目標管理       |
| PgM 追蹤器               | Alex 的個人 Action Item 進度表            |
| 威栗雲                   | 創造栗台灣版官網 / 學習吧台灣站                   |
| 黃明智                   | TVBS 片庫管理相關聯絡人                      |
| Phase 1               | 人臉識別整合，目標 2026/06 底                 |
| Phase 2               | 全功能 AI Server（STT、NLP、字幕工具），Q3      |

## 常見人員對照

| 名稱             | 角色                     |
| -------------- | ---------------------- |
| Alex Liao      | PgM，本報告彙整人             |
| Tonny Shen     | RD Leader / Media Agent |
| Steve Liu      | RD Head / Media Agent   |
| JH Tseng       | RD Head / OpenMAM       |
| 黎博、Stevens Lee | 創造栗 / 教育線業務總負責         |
| Michael Chien  | PM Head                |
| Dream Ku       | RD Head                |
| Ruru Lin       | 教育線協調                  |
| Luffy Luan     | 教育線 PM / 創造栗           |
| Sophia         | 教育線 課程 / 業務            |
| StevenCH       | 教育線 業務                 |
| Eddy Lin       | 教育線 PM / 業務            |
| Grace Lin      | 教育線 課程 / 業務            |
| Anna Kuo       | RD Leader / Media Agent |

## 格式參考

W20 週報（格式標準參考）：
```
/Users/daqingliao/Documents/VIA_Cowork/2A_Areas/Program_Sync/Final/Week20_0511/260513_ProgramSync_Week20_FINAL.md
```

若需確認格式細節，用 Read 工具讀取此檔案的對應章節。
