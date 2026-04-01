# Program Sync 週報

```
報告標題:  VIA Technologies — Program Sync 週報
報告週期:  2026/03/23 – 2026/03/27
報告日期:  2026/03/27
彙整人:    Alex Liao
涵蓋團隊:  Media Agent / 創造栗（小栗方 Pro）/ LearnMode / TV Solution / BU2 Healthcare
來源文件:  ① 260317_Program Progress Follow（Program Sync 週例會，2026-03-17，含本週 Follow-up）
           ② 260323_創造栗例會：小栗方 Pro（創造栗週一例會，2026-03-23）
           ③ 260323_教育部門 Sales/PM/RD sync-up mtg（教育部門跨部門同步，2026-03-23）
           ④ 260325_Agentic Meeting（Agentic Platform Discussion Meeting，2026-03-25）
```

---

## 1. Executive Summary（總摘要）

本週 VIA P&D Center 各 BU 在**平台上線、AI 技術收斂、組織協作協商**三條主軸上同步推進，並以 **Olapedia 1.0 正式上線**為本週最具代表性的里程碑。

**Top Wins：** Olapedia 1.0 已於本週正式上線，URL 為 `https://olamedia.olami.ai/`，累計入庫台北 3,500 小時 + 上海 6,000 小時以上廣播影片、732 位名人資料，支援人臉搜尋、STT 語言索引與多模態搜尋功能。STT MRD 同步升版至 v5，Dream 推進 OpenMAM 0.3 規格研究，Swift Zhu 完成 SRT 字幕原型（`SRT prototype.zip`）。創造栗 AI 特攻隊兩岸均有技術進展：北京（Alger Wang + Bruce Zhong）完成情緒辨識 `emotion2VC` 同步；台灣（Sean Peng）啟動 Whisper V3 + LoRA 訓練流程，使用 HuggingFace，FP16/INT8 量化，目標準確率達 90%，訓練截止日 3/27。AI Hackathon 確認 4/1 舉辦（13:30–16:30）。MBO Q2 目標今日（3/27）截止提交。

**Top Risks：** 小栗方 Pro IoT（智能體/IDE）整合仍在 Sean Peng、Tonny Shen、Michael Chien 三方協商中，NCHC 網路通道申請尚需 Sean 發郵件確認，目前不確定性持續影響 Q2 排程。V2 Pro 市場現況落差大：目前僅有 8 套工程樣品，目標量為 2,000–3,000 套，ESP32 SDK 取得路徑需確認。客語 ASR 算力成本精算仍待定，NCHC Local AI Server 預計 4/9 就緒，Kingston/Raven 設備評估進行中。

**管理層決策需求：** ① 創造栗 P2 需求升 P0/P1——需 黎博 + Michael Chien 正式討論資源安排（Sean 本週已出席 Program Sync，正式進入討論流程）；② V2 Pro 市場切入策略——Engineering Sample 驗證週期、通路商評估與 Q3 推廣節奏；③ 客語 ASR 算力預算最終確認（NCHC vs 自建 GPU，門檻 70 萬）。

---

## 2. 關鍵專案進度（Project Progress）

### 2.1 Media Agent — Olapedia 1.0 正式上線  🟢

**負責人/團隊：** Steve Liu / Tonny / Dream / TC Peng
**狀態：** ✅ 正式上線（`https://olamedia.olami.ai/`）
**本週達成：** 平台 Release，Demo 完成

Olapedia 1.0 本週正式上線，完成 3/25 Agentic Meeting Demo。平台規模：

| 維度 | 數據 |
|------|------|
| 名人庫 | 732 位（Olapedia 1.0） |
| 台北影片 | 3,500 小時廣播影片 |
| 上海影片 | 6,000+ 小時廣播影片 |
| 功能模組 | 人臉搜尋 / STT 語言索引 / 多模態搜尋 |

Steve 在會議中展示平台 PPT，說明 OlaMedia（後端整合層）架構設計。Swift Zhu 完成 `SRT prototype.zip` 字幕原型，可於平台內直接展示字幕流程。Steve 在 Demo 中說明：「This is a SAMPLE ODE to demonstrate our media agent workflow and self-training while loop — our AI agent will handle most of the difficult art…」

**產品命名最終確認（3/17 會議記錄）：**
- **Olapedia**：名人庫系統（人物資料庫 + 人臉辨識查詢）
- **OlaMedia**：整合媒體功能層（含人臉搜尋、STT、Media 應用）

**下一步：** WER Benchmark 評測啟動；NLE + AI + OpenCloud 整合路徑確認；TVBS 正式 Release 排程

---

### 2.2 Media Agent — STT MRD v5 & TVBS 對接  🟡

**負責人/團隊：** Alex Liao（需求側）/ Steve Liu（技術側）/ Dream（OpenMAM）
**狀態：** STT MRD 升版至 v5；TVBS 現場訪查本週執行

本週 Alex 前往 TVBS（3/24），觀察節目部 STT 作業流程，確認工具現況：TVBS 目前使用 Taption + Google Gemini + NotebookLM 等多工具組合，字幕成本高。STT MRD 升版至 v5（`260325_MediaAgent—STT(MRD)V5`），含本次訪查新增需求補充。Dream 同步推進 OpenMAM 0.3 API 規格研究，作為後續 TVBS MAM 整合基礎。

**OpenMAM API 整合：** 優先級已調整為 P2（3/17 決策），因等待 TVBS 端第三方確認，非本團隊可控，暫不主動追蹤，保持關注即可。

**台語 STT：** 仍維持調研低優先，Anna 持續。

---

### 2.3 Media Agent — EDD 工程文件規範導入  🟡

**負責人/團隊：** Michael Chien（推動）/ RD Lead（執行）/ Alex（協助）
**現況：** 共識達成，下一開發 Round 起正式落實

Michael 引入 **EDD（Engineering Design Document）** 概念，確立理想 RD 文件流程：`MRD → PRD → EDD（開工前完成，Markdown）→ 開發 → 補齊技術文件`。目前問題：Olapedia/OlaMedia 系列產品已成「黑箱」，內部人員不清楚使用了哪些 AI 模型、設計架構，需立即改善。

**已完成：** STT MRD + 人臉搜尋 MRD 均已提交；PRD 進行中。

---

### 2.4 Media Agent — 台標識別 & 機房搬遷  🟢 / 🟡

**負責人/團隊：** Steve 團隊（台標）/ TC Peng（機房）

- **台標（廣播台 Logo）辨識：** 模型訓練預計**四月初**啟動（4 月第一週）
- **機房搬遷：** 目前無急迫性，與模型訓練時程有關，預估**五月以後**才會實際進行

---

### 2.5 TV Solution — MagicView 移交  🟢

**負責人/團隊：** Tom Liu / Stanley / Pear（協調）
**狀態：** ✅ 案件關閉

Pear 已完成安排，Tom Liu 負責與對方完成最終對接。VSTS branch 移交已確認，此案視為 Close。

---

### 2.6 創造栗 — 小栗方 Pro P1/P2 審查  🟡

**負責人/團隊：** Luffy Luan（PM）/ Tonny Shen（RD）/ Swift Zhu / Kevin Liu / Eva Huang
**現況：** P1 Tonny 負責，P2 需求審查進行中

本週 3/23 例會進行 P1/P2 項目審查。P2 新需求（8 項提報）中，部分 PM 端建議升 P0/P1，**Tonny Shen 當場回應：需 黎博 + Michael Chien 正式協商後才能排程，不直接接受升級請求**。Sean Peng 已出席本週 Program Sync（3/17 追蹤項達成），正式進入 P2 資源討論流程。

**P2 MRD：** 由 Swift Zhu/Tonny 負責，Luffy Luan 召集 RD 評估（3/23 已啟動）。

---

### 2.7 創造栗 — 小栗方 Pro IoT / IDE 整合（🔴 持續阻塞）

**負責人/團隊：** Sean Peng（需求側）/ Tonny Shen（RD）/ Steve Liu + Grace Lin / Michael Chien（Q3 排程）
**現況：** 三方討論進行中，待 Sean 確認 NCC 伺服器連線

3/25 Agentic Meeting 確認：IoT 整合涉及 Sean Peng、Tonny Shen、Steve Liu、Grace Lin 與 Michael Chien 多方，具體拆解為：
1. 小栗方 Pro 與 IoT 模組的 RD 整合（1–2 人月評估）
2. NCHC（國家高速網路中心）伺服器連線申請——Sean 需發郵件至 NCC 確認
3. IDE 整合進 Q3 排程——Michael 確認 Q3 排入

**阻塞：** Sean 尚未送出 NCC 郵件；Q3 人力是否充足待確認。

---

### 2.8 創造栗 — 擴張版（Enhanced Edition）生產進度  🟡

**負責人/團隊：** Bruce Zhong / 天津廠
**現況：** 持續追蹤，預計 Q2 交貨

Bruce Zhong 負責擴張版生產追蹤，天津廠持續溝通中，Q2 交貨目標維持。

---

### 2.9 創造栗 — AI 特攻隊（兩岸 SEL + ASR）  🟡

**負責人/團隊：** 北京：Alger Wang + Bruce Zhong；台灣：Sean Peng

**🏙 北京（Alger Wang + Bruce Zhong）：**
- `emotion2VC` 情緒辨識同步完成
- `SyncWord` 功能整合中
- 訓練資料：普通話語音，22 組/3–5 GB
- 台灣版情緒模型適配進度：60–70%
- Q2 目標：TVBS 端 P1 整合
- 3/24 Demo 向 Bruce/Alger 確認（已執行）

**🇹🇼 台灣（Sean Peng）：**

| 模組 | 說明 |
|------|------|
| ASR | Whisper V3（HuggingFace） |
| 量化 | LoRA Fine-tuning，FP16/INT8 |
| 硬體 | 24/32 GPU |
| 輔助 | Wave2Vec VA + Gemini 3 Lite API / Gemini 2B |
| 目標準確率 | ≥ 90%（acoustic model），LoRA 樣本 ~450 筆 |
| 截止日 | **3/27（今日）** Whisper 模型訓練完成 |

---

### 2.10 LearnMode — V2 Pro 工程樣品評估  🟡

**負責人/團隊：** Kevin Liu / Eva Huang / Ruru Lin
**現況：** Engineering Sample 階段，POC 評估中

| 項目 | 數值 |
|------|------|
| 目前完成 | ~105/300 套 |
| 量產目標 | 400–405 套（近期）|
| 市場規模預估 | 2,000–3,000 套 |
| 技術問題 | ESP32 SDK 取得待確認（供應商提供） |
| 配套 | AI Server / Workstation / GPU（Robert 負責採購，4/9 評估） |

V2 Pro 工程樣品需 2–3 週完成 POC 評估，才能進入正式量產。Local AI Server（GPU：Kingston/Raven 品牌評估中）預計 4/9 到位，Robert 負責採購確認。

---

### 2.11 LearnMode — SEL 課程 Demo & 情緒分析  🟡

**負責人/團隊：** Grace（課程）/ Robert / Ruru Lin / Jennifer
**關鍵時程：** SEL Demo 5 個 **今日（3/27）14:00** 完成；整體 36 課進行至 50%

Grace 完成 5 個 SEL 課程 Demo 供本週審閱（3/27 14:00），含各年級覆蓋。整體 36 門課程目前達成 50%。Jennifer 負責 Corporate AI 企業端申請（IC AI 方向），對接 Tiffany 推動。Ruru + Robert 支援 SEL 整體進度管控。

---

### 2.12 LearnMode — 客語（客家語）ASR 算力規劃  🟡

**負責人/團隊：** Eddy Lin + TC Peng / Robert（硬體）/ Ruru（督導）
**技術目標：** ≥ 80% 辨識率；各模組誤差分解見下表

| 算力方案 | 詳情 |
|---------|------|
| NCHC 國家高速網路 | 4/9 伺服器申請就緒，20% GPU 配額，No penalty clause |
| Local AI Server（自建）| GPU：Kingston / Raven 品牌評估，Robert 4/9 交貨確認 |
| 成本結構 | OCR 30% / ASR 30% / 模型訓練 30% / 前端 UI 20% 分拆 |

技術架構：TC 主導規格，LoRA Fine-tuning，整體 4 階段（算力訓練 → 部署上雲 → 負載平衡 → 前端 UI）。預算門檻仍維持 70 萬（若超過，黎博傾向放棄）。

---

### 2.13 LearnMode — V2 課程開發與通路佈局  🟡

**負責人/團隊：** StevenCH / Eddy / Sophia / Shirene
**進度：** 16/32 堂課版本名稱統一（初階/進階），通路佈局啟動

V2 課程 16/32 堂版本已統一命名（初階/進階），Eddy、StevenCH、Shirene 分工推進。B2 車隊（Eddy + Sophia）進行 cost/value 分析，目標量：500 套；L1 通路定位確認中。StevenCH 識別 low-hanging fruit AI 套件機會（Eddy：100–200 個潛在目標）。

---

### 2.14 LearnMode — AI 工具培訓 & 黑客松  🟡

**負責人/團隊：** Eddy / Ruru Lin / 全體教育部門
**AI 黑客松：** 2026/04/01（四）13:30–16:30

- **3/27（今日）10:30：** AI 培訓 Sync-up，全部門參與
- **4/1 AI Hackathon：** 確認舉辦，13:30–16:30，五組 Demo 競賽
- **5/9–5/10：** 重要外部活動/發布（規模較大，細節待確認）
- Ruru 統籌 AI Agent 工具 Demo / API 展示（含 Whisper、SEL Demo）

---

### 2.15 LearnMode — AI Agent 應用佈局（TVBS + SEL）  🟡

**負責人/團隊：** Sophia / Ruru Lin / Celine（BD）
**架構方向：** Prompt 驅動 vs Agent 驅動 雙路線評估

針對 TVBS + SEL 應用場景，討論 Prompt-based vs Agent-based 架構差異，Celine（BD 端）推動外部商業落地。Eddy 負責 3 個核心 workflow 設計，目標支援 AI Agent 10 個並發場景（4 月上線）。

---

### 2.16 組織 — MBO Q2 目標提交  🟡

**負責人/團隊：** 全體成員
**截止：** **今日（2026/03/27）**

MBO Q2 全體提交截止今日，Steve Liu 已納入 Google Drive 提交流程（Agentic Meeting 確認），Alex 同步跟進。

---

### 2.17 進度追蹤工具修復  🟡

**負責人/團隊：** Alex Liao
**現況：** DEV vs Published 顯示邏輯 Bug 修復中

進度追蹤工具（Railway 平台 / GitHub CI/CD）在部分環境顯示黑色背景，且停留舊版（58%/33%/14%/0%）。已確認有存取權限者進入 DEV 版本，正確版本（23/39/30）需無痕模式查看。Alex 持續 debug 修正顯示邏輯。

---

## 3. 子組進度

### 3.1 Media Agent 組（Steve Liu / Dream / TC Peng）

**最重大里程碑：Olapedia 1.0 正式上線（olamedia.olami.ai）。** Steve 在 3/25 Agentic Meeting 完成平台 Demo，展示 PPT 說明 OlaMedia 架構，Swift 完成 SRT 字幕原型。STT MRD v5 完成，Dream 推進 OpenMAM 0.3 規格。台標識別訓練四月初啟動，機房搬遷暫無急迫性（五月後）。WER Benchmark 評測列入下週計劃。Alex 3/24 完成 TVBS 現場訪查（Taption + Gemini + NotebookLM 工具組確認）。EDD 工程文件規範共識達成，下一個 Round 正式落實。

### 3.2 創造栗組（Luffy Luan / Swift Zhu / Tonny / Bruce / Kevin / Eva）

3/23 例會完成 P1/P2 審查。P2 升 P0/P1 需求進入 黎博 + Michael 正式協商流程。Sean 已出席 Program Sync（原追蹤項達成）。IoT 整合討論（Sean/Tonny/Steve/Grace/Michael）本週展開，NCC 郵件申請為下一阻塞點。兩岸 AI 特攻隊進展：北京 emotion2VC 同步完成、台灣 Whisper V3+LoRA 訓練截止今日。擴張版 Bruce 持續追蹤。P2 MRD 由 Swift/Tonny 起草，Luffy Luan 召集評估。

### 3.3 LearnMode 組（黎博主導，Ruru Lin 統籌）

SEL 5 個課程 Demo 今日 14:00 完成（Grace），36 課已完成 50%。AI 特攻隊培訓今日（3/27）10:30 執行。V2 Pro Engineering Sample POC 進行中，ESP32 SDK 取得待確認。客語 ASR NCHC + Local AI Server 算力方案規劃中，4/9 為關鍵里程碑。V2 課程命名統一（初階/進階）完成，StevenCH 識別 low-hanging fruit 機會。Celine BD 開始推 AI Agent 商業落地（TVBS + SEL）。4/1 AI Hackathon 確認。Jennifer 推進 Corporate AI 企業端。

### 3.4 TV Solution 組（Tom Liu）

MagicView 案件已關閉（Pear 安排完成，Tom Liu 完成最終對接，VSTS branch 移交確認）。本週無其他重大更新。

---

## 4. 跨部門協作與客戶互動

### 4.1 TVBS — STT 現場訪查成果（3/24）

Alex 完成 TVBS 現場訪查，確認節目部 STT 工具現況：

| 工具 | 使用方式 |
|------|---------|
| Taption | 主要字幕工具（辨識率仍不足） |
| Google Gemini | 補充辨識，帳號共用問題持續 |
| NotebookLM | 輔助整理 |

訪查結果已補入 STT MRD v5，下週安排正式現場 STT 作業流程確認（下下週為目標）。

### 4.2 TVBS — Olapedia 1.0 Demo 完成（3/25）

Steve 在 3/25 Agentic Meeting 完成 TVBS 相關 Demo，展示平台功能。後續 TVBS 正式 Release 規劃進行中（NLE + AI + OpenCloud 整合路徑）。

### 4.3 政府端 — 母親節活動 + AI 合作夥伴交流

| 活動 | 日期 | 負責人 | 狀態 |
|------|------|--------|------|
| 母親節活動內部 Demo | 3/27（今日）| Janet / Tiffany | 🟡 進行中 |
| 兩岸 AI 合作夥伴交流（主場次） | 4/15 | 黎博 | ⏸️ 待執行 |
| 5/9–5/10 大型外部活動 | 5/9–5/10 | 創造栗 / 黎博 | ⏸️ 規劃中 |

### 4.4 企業端 — Corporate AI（Jennifer）

Jennifer 推動 IC AI（企業端 AI 工具應用），對接 Tiffany 確認 Corporate 需求，預計 2026/04 完成第一波佈局。

---

## 5. 重大決策與戰略討論

**決策一：Olapedia 命名架構正式確認（3/17 會議）**
Olapedia（名人庫）與 OlaMedia（整合媒體功能層）正式拆分為兩個產品名稱，公開對外名稱由 Michael 視需要另議。

**決策二：OpenMAM API 整合優先級降為 P2（3/17 會議）**
因等待 TVBS 第三方確認，非本團隊可控，正確解讀為「等別人的 Pending」而非棄置，降為 P2 後不需主動追蹤，但仍保持關注。

**決策三：創造栗 P2 升 P0/P1 需求，進入 黎博 + Michael 正式協商流程（3/17 / 3/23）**
Tonny Shen 不直接接受升級請求，需有正式 justification。Sean 已出席 Program Sync，進入正式討論渠道。

**決策四：EDD 流程導入共識達成（3/17 會議，Michael 推動）**
未來 RD 開工前必須完成 EDD，開發後補齊技術文件（含 AI 模型清單），從下一個開發 Round 起正式落實。目的：解決 Olapedia/OlaMedia「黑箱」問題。

**決策五：台標識別訓練四月初啟動，機房搬遷五月後進行（3/17 會議）**
台標訓練時程明確；機房搬遷無急迫性，與模型訓練時程連動，預估五月以後。

**決策六：MagicView 案件關閉，Tom Liu 完成最終對接（3/25 確認）**
Pear 安排完成，VSTS branch 移交，此案正式 Close。

**決策七：AI Hackathon 確認 4/1 舉辦（創造栗 3/23 + 教育部門 3/23 雙線確認）**
13:30–16:30，五組 Demo 競賽，全體 BU 參與。

---

## 6. 下週重點計劃

| 優先級 | 任務描述 | 負責人 | 預計完成日 | PgM 狀態 |
|--------|---------|--------|-----------|---------|
| **P0** | **MBO Q2 目標提交截止（今日）** | 全體成員 | 2026/03/27 | 🟡 截止中 |
| **P0** | **SEL 5 個課程 Demo 完成（今日 14:00）** | Grace | 2026/03/27 | 🟡 進行中 |
| **P0** | **AI 特攻隊 Whisper 訓練完成（台灣，今日截止）** | Sean Peng | 2026/03/27 | 🟡 截止中 |
| **P0** | **AI Hackathon 執行** | Eddy / Ruru / 全體 | 2026/04/01 | 🎯 即將到來 |
| P0 | Sean 發郵件至 NCC 確認 IoT 伺服器連線 | Sean Peng | 本週 | ⏸️ 待執行 |
| P0 | 進度追蹤工具 DEV/Published 顯示 Bug 修復 | Alex | 儘快 | 🟡 進行中 |
| P1 | Olapedia VM Demo → 安排 TVBS 正式試用帳號開通 | Steve / Tonny | 下週 | ⏸️ 待執行 |
| P1 | 安排現場 TVBS STT 作業流程正式確認（下下週） | Alex | 下下週 | ⏸️ 待執行 |
| P1 | OpenMAM 0.3 Face API 規格完成，安排說明 | Dream | 近期 | 🟡 進行中 |
| P1 | WER Benchmark 評測啟動（Olapedia ASR 精度） | Steve 團隊 / Anna | 下週 | ⏸️ 待執行 |
| P1 | EDD 流程補充至現有專案文件（Olapedia / OlaMedia / STT） | RD Lead + Alex | 下一 Round 起 | ⏸️ 待執行 |
| P1 | 台標識別模型訓練啟動 | Steve 團隊 | 2026/04/初 | ⏸️ 待執行 |
| P1 | 創造栗 P2 升 P0/P1 正式協商（黎博 + Michael） | 黎博 / Michael / Sean | 下週 | 🟡 進行中 |
| P1 | 客語 ASR：NCHC Local AI Server 確認（4/9） | Robert / Eddy / TC | 2026/04/09 | ⏸️ 待執行 |
| P1 | V2 Pro Engineering Sample POC 推進，ESP32 SDK 取得 | Kevin / Eva / Bruce | 2–3 週 | 🟡 進行中 |
| P1 | 兩岸 AI 特攻隊本週進展整理分享 | Alger / Sean / Eddy | 下週 | ⏸️ 待執行 |
| P1 | emotion2VC + SyncWord 下一版本整合計劃 | Alger Wang + Bruce | 近期 | 🟡 進行中 |
| P2 | V2 課程 Low-hanging fruit 識別清單 | StevenCH / Eddy | 近期 | 🟡 進行中 |
| P2 | AI Agent 應用架構決策（Prompt vs Agent）確認 | Sophia / Ruru / Eddy | 4 月 | ⏸️ 待執行 |
| P2 | 5/9–5/10 活動規劃細節確認 | 黎博 / 創造栗 | 4 月初 | ⏸️ 規劃中 |
| P2 | 機房搬遷時程確認（五月後） | TC Peng | 4 月評估 | ⏸️ 待執行 |

---

## 7. 風險與問題追蹤（Risk Register）

| Risk ID | 描述 | 影響等級 | 狀態 | 處理進度 | 需協助 |
|---------|------|---------|------|---------|--------|
| R1 | **小栗方 Pro IoT 整合阻塞**：Sean/Tonny/Michael 三方協商未完成，NCC 郵件尚未發出，影響 Q2/Q3 排程 | 🔴 高 | 進行中 | Sean 3/25 出席 Agentic Meeting，討論已啟動；NCC 郵件為最近阻塞點 | Sean 本週發郵件；Michael 確認 Q3 人力 |
| R2 | **客語 ASR 算力成本未定**：NCHC 4/9 才就緒，Local AI Server 採購評估中，若超 70 萬門檻則放棄 | 🔴 高 | 進行中 | Robert 負責設備採購（4/9）；TC + Eddy 精算中 | 黎博 本週決策（門檻 70 萬） |
| R3 | **V2 Pro 量產落差**：Engineering Sample 僅 8 套，目標 2,000–3,000 套，ESP32 SDK 未取得 | 🔴 高 | 新增 | POC 評估 2–3 週進行中；SDK 待 Bruce 協調 | Kevin/Eva 決策量產節奏；Bruce 催 SDK |
| R4 | **創造栗 P2 升 P0/P1 資源不確定**：需 黎博 + Michael 正式拍板，目前懸而未決 | 🟡 中 | 進行中 | Sean 已進入 Program Sync，協商渠道建立；下週正式討論 | 黎博 + Michael 本週決策 |
| R5 | **進度追蹤工具 DEV/Published 顯示錯誤**：有存取權限者看到舊版，影響管理層判斷進度 | 🟡 中 | 進行中 | Alex 持續 debug，暫以無痕模式 workaround | Alex 儘快修復 |
| R6 | **Olapedia 黑箱問題（EDD 缺失）**：Olapedia/OlaMedia 系列 AI 模型清單、架構設計缺乏內部文件，有合規風險 | 🟡 中 | 進行中 | Michael 推動 EDD 流程，下一 Round 起落實；STT/人臉搜尋 MRD 已完成 | RD Lead 補齊 EDD + AI 模型清單 |
| R7 | **台灣 AI 特攻隊 Whisper 訓練樣本不足**：目前 ~450 筆 LoRA 樣本，8 類情緒分佈不均 | 🟡 中 | 進行中 | 持續蒐集；Gemini 2B + Gemini 3 Lite 備用方案 | Sean 今日完成訓練，評估準確率後決策 |
| R8 | **AI Hackathon 5 組 Demo 品質風險**：4/1 舉辦，時間緊迫（僅剩 4 天） | 🟡 中 | 進行中 | 各組 Demo 本週收斂，Ruru 統籌 | Eddy / Ruru 今日前確認各組就緒 |
| R9 | **TVBS Release 路徑待確認**：NLE + AI + OpenCloud 整合需求評估中，Olapedia 1.0 已上線但 TVBS 正式 Release 節奏未定 | 🟡 中 | 新增 | Steve 推進 Release 規劃；Demo 已完成 | Steve + Alex + TVBS 對齊節奏 |
| R10 | **5/9–5/10 活動規模不明**：創造栗/黎博提及但細節未確認，可能影響 Q2 資源配置 | 🟢 低 | 新增 | 尚無具體 Action | 黎博 / 創造栗 4 月初確認細節 |

---

## 8. 行動方案追蹤（Action Items）

#### Media Agent — 平台與技術（優先級：高）

| 項次 | 行動項目 | 負責人 | 目標時間 | PgM 狀態 |
|------|---------|--------|---------|---------|
| 1 | Olapedia 1.0 WER Benchmark 評測啟動 | Steve / Anna | 下週 | ⏸️ 待執行 |
| 2 | TVBS 正式 Release 規劃（NLE + AI + OpenCloud 整合路徑） | Steve Liu | 近期 | 🟡 進行中 |
| 3 | OpenMAM 0.3 Face API 規格完成，安排說明 | Dream | 近期 | 🟡 進行中 |
| 4 | STT MRD v5 評審（Team 內部）| Alex / Steve | 下週 | ⏸️ 待執行 |
| 5 | 安排 TVBS 現場 STT 作業流程正式確認 | Alex | 下下週 | ⏸️ 待執行 |
| 6 | 進度追蹤工具 DEV/Published 顯示 Bug 修復 | Alex | 儘快 | 🟡 進行中 |
| 7 | 台標識別模型訓練啟動 | Steve 團隊 | 2026/04/初 | ⏸️ 待執行 |
| 8 | EDD 流程補充至 Olapedia / OlaMedia / STT 專案文件 | RD Lead + Alex | 下一 Round | ⏸️ 待執行 |
| 9 | 台語 ASR 持續調研 | Anna | 長期 | 🟡 進行中 |

#### 創造栗 — 軟體 & IoT（優先級：高）

| 項次 | 行動項目 | 負責人 | 目標時間 | PgM 狀態 |
|------|---------|--------|---------|---------|
| 10 | **Sean 發郵件至 NCC 確認 IoT 伺服器連線** | Sean Peng | 本週 | ⏸️ 待執行 |
| 11 | IoT 整合 Q3 排程，Michael 確認人力 | Michael Chien | 下週 | ⏸️ 待執行 |
| 12 | P2 升 P0/P1 正式協商（黎博 + Michael，Sean 列席） | 黎博 / Michael / Sean | 下週 | 🟡 進行中 |
| 13 | P2 MRD 起草（Swift Zhu / Tonny，Luffy Luan 召集 RD 評估） | Swift Zhu / Tonny / Luffy | 近期 | 🟡 進行中 |

#### 創造栗 — 硬體 & AI 特攻隊（優先級：中）

| 項次 | 行動項目 | 負責人 | 目標時間 | PgM 狀態 |
|------|---------|--------|---------|---------|
| 14 | Whisper V3 + LoRA 訓練完成，回報準確率 | Sean Peng | **2026/03/27（今日）** | 🟡 截止中 |
| 15 | emotion2VC + SyncWord 下版整合計劃 | Alger Wang + Bruce | 近期 | 🟡 進行中 |
| 16 | 擴張版生產追蹤，與天津廠定期溝通 | Bruce Zhong | 持續 | 🟡 進行中 |
| 17 | V2 Pro Engineering Sample POC 推進 + ESP32 SDK 取得 | Kevin / Eva / Bruce | 2–3 週 | 🟡 進行中 |

#### LearnMode — 課程、AI 工具、客語（優先級：高）

| 項次 | 行動項目 | 負責人 | 目標時間 | PgM 狀態 |
|------|---------|--------|---------|---------|
| 18 | **SEL 5 個課程 Demo 完成（今日 14:00）** | Grace | **2026/03/27 14:00** | 🟡 截止中 |
| 19 | **4/1 AI Hackathon 執行** | Eddy / Ruru / 全體 | **2026/04/01** | 🎯 即將到來 |
| 20 | 客語 ASR：NCHC Local AI Server 確認（Kingston/Raven） | Robert | 2026/04/09 | ⏸️ 待執行 |
| 21 | 客語 ASR：精算預算表回報黎博（最終決策） | Eddy + TC | 本週 | 🟡 進行中 |
| 22 | V2 課程 Low-hanging fruit 清單整理 | StevenCH / Eddy | 近期 | 🟡 進行中 |
| 23 | Corporate AI（IC AI）推進，Jennifer 對接 Tiffany | Jennifer | 2026/04 | 🟡 進行中 |
| 24 | AI Agent 架構決策（TVBS + SEL：Prompt vs Agent）| Sophia / Ruru / Eddy | 4 月 | ⏸️ 待執行 |
| 25 | Celine（BD）推動 AI Agent 商業落地首波案例 | Celine / Ruru | 近期 | 🟡 進行中 |

#### 組織 & 流程（優先級：高）

| 項次 | 行動項目 | 負責人 | 目標時間 | PgM 狀態 |
|------|---------|--------|---------|---------|
| 26 | **MBO Q2 全體目標提交** | 全體成員 | **2026/03/27（今日）** | 🟡 截止中 |
| 27 | 母親節活動 3/27 內部 Demo 執行 | Janet / Tiffany | **2026/03/27** | 🟡 進行中 |
| 28 | 5/9–5/10 活動規劃細節確認 | 黎博 / 創造栗 | 4 月初 | ⏸️ 規劃中 |
| 29 | 兩岸 AI 合作夥伴交流主場次（4/15）準備 | 黎博 | 近期 | ⏸️ 待執行 |

---

## 9. 關鍵時間節點與總結

**未來 8 週重要里程碑：**

| 日期 | 里程碑 | 負責人 | PgM 狀態 |
|------|--------|--------|---------|
| **2026/03/27（今日）** | **MBO Q2 全體提交截止；SEL 5 個 Demo 完成（14:00）；Whisper V3 訓練截止；AI 培訓 Sync-up（10:30）；母親節活動內部 Demo** | 全體 / Grace / Sean | 🟡 進行中 |
| **2026/04/01（週四）** | **AI Hackathon（13:30–16:30）** | Eddy / Ruru / 全體 | 🎯 即將到來 |
| 2026/04/初 | 台標識別模型訓練啟動 | Steve 團隊 | ⏸️ 待執行 |
| **2026/04/09** | **客語 ASR NCHC Local AI Server 到位（Kingston/Raven 採購確認）** | Robert | ⏸️ 待執行 |
| 2026/04/15 | 兩岸 AI 合作夥伴交流主場次 | 黎博 | ⏸️ 待執行 |
| 2026/04/30 | SEL 全部課程 50% → 目標達成；V2 Pro POC 評估完成 | Grace / Kevin / Eva | 🟡 進行中 |
| **2026/05/02** | 小栗子 Light（SEL）台灣首發 | 黎博 / Kevin / Eva | 🟡 進行中 |
| **2026/05/09–05/10** | 重大外部活動（創造栗 / 黎博，細節待確認） | 創造栗 | ⏸️ 規劃中 |
| 2026/05/底 | 水保署課程截止（Grace） | Grace | 🟡 進行中 |
| 2026/06/30 | AI 人力效能 Phase 1：釋放 1/3 人力 | Eddy / Dream | 🟡 進行中 |

**本週戰略核心總結：**

本週以 **Olapedia 1.0 正式上線（olamedia.olami.ai）** 為最重要里程碑——這是 VIA Media Agent 團隊從 PoC 到真實產品的關鍵跨越，732 名人庫 + 9,500 小時影片入庫，完整實現人臉搜尋 + STT + 多模態查詢三大功能。與此同時，今日（3/27）是本週的「執行收斂日」：MBO 提交、SEL Demo、Whisper 訓練三線同時截止，是 Q1 成果的最後收割節點。**下週的關鍵任務**明確集中在三件事：① 4/1 AI Hackathon 精彩呈現（最近的可見交付），② Sean 盡快完成 NCC 郵件申請（IoT 整合最小阻塞點），③ 黎博 + Michael 正式協商 P2 升 P0/P1 排程（Q2 人力決策的前置條件）。Olapedia 上線後，下一個清晰目標是 TVBS 正式 Release 路徑——NLE + AI + OpenCloud 的整合規劃需要本月確立。

---

*來源文件：*
- *① 260317_Program Progress Follow（Program Sync 週例會，含本週 Follow-up 事項，2026-03-17）*
- *② 260323_創造栗例會：小栗方 Pro（創造栗週一例會，2026-03-23）*
- *③ 260323_教育部門 Sales/PM/RD sync-up mtg（教育部門跨部門同步，2026-03-23）*
- *④ 260325_Agentic Meeting（Agentic Platform Discussion Meeting，2026-03-25）*
