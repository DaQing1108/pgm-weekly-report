# Program Sync 週報

```
報告標題:  VIA Technologies — Program Sync 週報
報告週期:  2026/03/30 – 2026/04/02
報告日期:  2026/04/03
彙整人:    Alex Liao
涵蓋團隊:  Media Agent / 創造栗（小栗方 Pro）/ LearnMode / TV Solution / BU2 Healthcare
來源文件:  ① 260331_Program Progress Follow（Program Sync 週例會，2026-03-31）
           ② 260331_創造栗例會：小栗方 Pro（創造栗週一例會，2026-03-31）
           ③ 260401_Agentic Meeting（Agentic Platform Discussion Meeting，2026-04-01）
           ④ 260401_教育部門 Sales/PM/RD sync-up mtg（教育部門跨部門同步，2026-04-01）
           ⑤ Program Progress Mtg（PgM 追蹤器快照，Alex Liao，截至 2026-04-01）
```

---

## 1. Executive Summary（總摘要）

本週 VIA P&D Center 以**文件制度化、Demo 準備、組織整合協商**三軸同步推進，並以 **STT MRD V6.0 + FaceSearch MRD V3.0 雙版本升版** 及 **STT/FaceSearch PRD 全面完成** 為本週最重要里程碑。

**Top Wins：** 3/30 完成 STT MRD 升版至 V6.0（含少康戰情、新聞大白話等多支節目真實流程驗證）、FaceSearch MRD 升版至 V3.0（含 Face Search / AI Content Tagging / NLP Semantic Search 三軌）。PgM 追蹤器（⑤）確認：STT PRD V2、FaceSearch PRD（Track A/B/C）均已完成（目標日 4/3，提前達成），EDD 流程導入規劃 Draft 仍進行中。4/1 Agentic Meeting 確認 **TVBS Demo 正式排程 4/23**，Demo Rundown 已啟動（Alex，目標 4/2x）。AI Hackathon 4/1 當天順利舉辦（5+1+3 共 9 組 Demo，Michael Chien 主持），為 LearnMode 教育部門本週最重要的可見交付。OpenMAM 3.0 Review 啟動（Dream，4/1 Agentic Meeting），並首次提及 OpenMAM 4.0 排程方向。

**Top Risks：** Sean Peng 發送郵件確認 IoT 伺服器連線一事，至 4/1 Agentic Meeting 仍顯示 Pending，持續阻塞 Q2/Q3 IoT 排程。AI PC 新產品線（Kevin Liu / Tonny Shen / Eva Huang）ownership 與 K8S 架構負責人（Tonny Shen）剛確認，尚缺商業計劃（PM 主導）與生產規格（Bruce Zhong）。創造栗 B2 Pro 量產規模目標 1K，lead time 與 schedule 仍在廠商協調中（Sunny/Carrie/Tanner）。SEL 4/15 Demo 多條線同時截止（Eddy Lin / Alger Wang / Grace），資源集中風險高。

**管理層決策需求：** ① TVBS Demo 4/23 準備資源確認——需 Steve + Alex + Dream 對齊 Demo Rundown 內容，並確認 Olapedia/OlaMedia/STT 三場景的 Runbook 規格；② AI PC 商業計劃誰主導（Kevin Liu 建議 PM 介入，Luffy 待拍板）；③ 創造栗 B2 Pro 1K 量產節奏——lead time 與天津廠進度需 Tanner 本週回報（Sunny/Carrie buffer 方案）。

**📋 PgM 追蹤器快照（⑤ 截至 2026/04/01）**

| 專案項目 | 項目內容 | 負責人 | 狀態 | 預計完成 |
|---------|---------|--------|------|---------|
| Training | TVBS_AI_sharing_Draft | Alex Liao | 🟡 進行中 | 2026/04/24 |
| Media Agent | Media Agent RD Demo：起草試排腳本 / Rundown for 4/23 | Alex Liao | 🟡 進行中 | 2026/04/2x |
| Media Agent | 產品命名（對外） | Alex Liao | ⏸️ 尚未開始 | 2026/04/1x |
| Media Agent | 專案文件 EDD 流程導入規劃_Draft | Alex Liao | 🟡 進行中 | 2026/04/3x |
| Media Agent | Media Agent STT — PRD V2（STT PRD） | Alex Liao | ✅ 已完成 | 2026/04/03 |
| Media Agent | 260330_Media_Agent_PRD — Track A Face Search | Alex Liao | ✅ 已完成 | 2026/04/03 |
| Media Agent | 260330_Media_Agent_PRD — Track B AI Content Tagging V1.0 | Alex Liao | ✅ 已完成 | 2026/04/03 |
| Media Agent | 260330_Media_Agent_PRD — Track C NLP Semantic Search V1.0 | Alex Liao | ✅ 已完成 | 2026/03/3x |
| Media Agent | 260330_Media Agent_STT_MRD_V6.0 | Alex Liao | ✅ 已完成 | 2026/03/30 |
| Media Agent | 260330_Media Agent_Face Search_MRD_V3.0 | Alex Liao | ✅ 已完成 | 2026/03/30 |

---

## 2. 關鍵專案進度（Project Progress）

### 2.1 Media Agent — STT MRD V6.0 & FaceSearch MRD V3.0 升版  🟢

**負責人/團隊：** Alex Liao / Steve Liu / Anna Guo
**狀態：** ✅ 兩份 MRD 均已完成（3/30）

本週完成兩份重要文件升版：

| 文件 | 版本 | 完成日 | 核心更新 |
|------|------|-------|---------|
| STT MRD | V5.0 → **V6.0** | 3/30 | 含少康戰情、新聞大白話等節目 STT 流程驗證；Taption ≈ 1:1 校對比確認；校對開銷臨界點數據補入 |
| FaceSearch MRD | V2.0 → **V3.0** | 3/30 | 三軌架構確立：Face Search / AI Content Tagging / NLP Semantic Search；Amazon Rekognition 比較研究補入 |

3/31 Program Sync 與 4/1 Agentic Meeting 均引用新版 MRD 作為 PRD 基礎。下一步：Tonny Shen 文件評審、Steve EDD 開工前確認。

---

### 2.2 Media Agent — STT PRD & FaceSearch PRD 全面完成  🟢

**負責人/團隊：** Alex Liao
**狀態：** ✅ 全部完成（PgM 追蹤器確認，目標 4/3，提前達成）

| 文件 | 完成狀態 |
|------|---------|
| Media Agent STT — PRD V2 | ✅ 已完成 |
| FaceSearch PRD — Track A：Face Search | ✅ 已完成 |
| FaceSearch PRD — Track B：AI Content Tagging V1.0 | ✅ 已完成 |
| FaceSearch PRD — Track C：NLP Semantic Search V1.0 | ✅ 已完成 |

三軌 FaceSearch PRD 結構：
- **Track A**：人臉搜尋核心（Olapedia 名人庫查詢）
- **Track B**：AI 自動標注（內容標籤 + 場景分類）
- **Track C**：NLP 語意搜尋（自然語言查詢影片內容）

**下一步：** EDD 開工前確認（Steve / Dream / Michael）；RD 文件 VSTS/Azure DevOps 建立（Steve，涵蓋 EDD + AI 模型清單）

---

### 2.3 Media Agent — EDD 工程文件規範 Draft  🟡

**負責人/團隊：** Alex Liao（Draft 負責人）/ Michael Chien（推動）
**狀態：** 🟡 進行中，目標 4/3x

EDD 流程導入規劃 Draft 持續推進中。3/31 Program Sync 確認：Steve 負責 EDD 開工前完成，Dream 負責對應技術章節（RD 文件規範建立，VSTS/Azure DevOps 管理）。MRD → PRD → EDD 文件鏈已全面建立：兩份 MRD ✅ + 四份 PRD ✅ → EDD 🟡 → 開發。

---

### 2.4 Media Agent — TVBS Demo 準備（目標 4/23）  🟡

**負責人/團隊：** Alex Liao（Rundown）/ Steve Liu（Demo 技術）/ Dream（OpenMAM）/ Swift Zhu（SRT）
**狀態：** 🟡 進行中；Demo Rundown 起草中（目標 4/2x）

4/1 Agentic Meeting 正式確認 **TVBS Demo 排程 4/23**（原 4/23 計劃，此次再確認）。Demo 內容框架：

| Demo 場景 | 技術負責 | 狀態 |
|----------|---------|------|
| Olapedia 名人搜尋（URL + partial name + NLP） | Steve Liu | 🟡 準備中 |
| STT 字幕流程（含多節目 workflow） | Alex + Steve | 🟡 準備中（目標 4/8） |
| SRT 字幕輸出展示 | Swift Zhu | 🟡 準備中（目標 4/8） |
| OlaMedia Roadmap clip | Steve | 🟡 TBD |

**PgM 追蹤器：** `Media Agent RD Demo：起草試排腳本 / Rundown for 4/23` — 🟡 進行中，Alex，目標 4/2x

**4/1 Agentic Meeting Action Items（截止 4/8）：**
- Alex：STT Demo 內容對齊 + Rundown 起草
- Swift Zhu：SRT Demo clip 完成
- Steve：Olapedia Demo 準備 + Roadmap clip
- Steve/Alex：Olapedia/OlaMedia 整體 Demo 確認
- Michael：EDD/文件架構確認

---

### 2.5 Media Agent — OpenMAM 3.0 Review  🟡

**負責人/團隊：** Dream Ku / Steve Liu / Alex Liao
**狀態：** 🟡 啟動 Review 中（4/1 Agentic Meeting）

4/1 Agentic Meeting 正式啟動 OpenMAM 3.0 Review：

| 項目 | 說明 |
|------|------|
| API 架構 | 2 個主要 API 端點重新梳理 |
| UI Prototyping | UI 框架評估（add/delete metadata server） |
| 升版路徑 | 現行 2.0 → 3.0 → 未來 4.0（排程方向提出，日期 TBD） |
| TVBS 端接口 | TVBS 需求（5 條）對應 2.0 API 能力評估 |

**下一步：** Dream 完成 OpenMAM 3.0 規格文件；Steve + Alex 確認 TVBS 介接路徑（4/8 為目標）。

---

### 2.6 Media Agent — Olapedia 維運 & 擴充  🟡

**負責人/團隊：** Steve Liu / TC Peng / Anna Guo
**現況：** 平台維運進行中；名人庫持續擴充至 9,000+ 素材

4/1 Agentic Meeting 確認：
- Olapedia 名人庫素材已達 9,000+ 條（較上週 732 名人 + 9,500h 影片有進一步核對）
- Anna Guo：400GB Olapedia 素材準備中（STT WER Benchmark 用途）
- TC Peng：A5000 GPU（算力補充，硬體確認中）
- **產品命名（對外）：** ⏸️ 尚未開始（PgM 追蹤器，目標 4/1x）

---

### 2.7 創造栗 — 小栗方 Pro/Lite 生產追蹤  🟡

**負責人/團隊：** Kevin Liu / Bruce Zhong / Tanner / Sunny / Carrie / Robert
**現況：** 3/31 例會確認量產節奏與 lead time

| 項目 | 現況 |
|------|------|
| B2 Pro 量產目標 | **1K 套**（本批次） |
| 生產協調 | Tanner（8D Report CoC 0.4/0.15）、Sunny + Carrie（schedule + buffer）|
| Lead time | Kevin Liu 持續協調廠商 |
| Pro D2 | 版本確認中 |
| Lite | Bruce Zhong：品質規格確認；Robert：硬體採購 |

**Action Items（3/31 例會）：**
- Kevin Liu：B2 Pro lead time 確認（廠商回覆）、Pro D2 schedule、Pro 生產計劃
- Tanner/Sunny/Carrie：schedule + as-if buffer 方案提出（monthly statement）
- Bruce Zhong：B2 Lite 品質規格（spec CC）

---

### 2.8 創造栗 — AI PC 新產品線  🟡

**負責人/團隊：** Kevin Liu（Owner）/ Tonny Shen（K8S Infra）/ Eva Huang / Luffy Luan（Business PM）/ Alger Wang
**狀態：** Ownership 確認，商業計劃待啟動

3/31 例會新確認 AI PC 產品線 Ownership 分工：

| 角色 | 負責人 | 工作項目 |
|------|--------|---------|
| AI PC 整體 Owner | Kevin Liu | VM / Local 架構選型 |
| K8S 基礎設施 | Tonny Shen | K8S 架構設計 |
| AI PC 硬體 | Eva Huang | 規格評估 |
| 商業計劃 PM | Luffy Luan | Business plan 主導 |
| AI 模型整合 | Alger Wang | 60% debug 進行中 |

Kevin 負責 take full ownership（VM / local simulator），Tonny Shen 主導 K8S，Eva 負責 AI PC 硬體，Luffy 起草 Business Plan（PM 主導）。

---

### 2.9 創造栗 — 小栗方 Pro IoT 整合  🔴（持續阻塞）

**負責人/團隊：** Sean Peng / Alex Liao / Michael Chien
**現況：** 郵件至 4/1 Agentic Meeting 仍 Pending

4/1 Agentic Meeting Follow-up 第 1/2 項確認：Sean  email + IoT 整合仍為 Pending，Alex 列為 ASAP 追蹤項目。IoT 伺服器連線未確認，影響 Q2/Q3 排程。

**阻塞：** Sean 尚未發出 NCC 郵件（從上週持續）。

---

### 2.10 創造栗 — AI 特攻隊（SEL + ASR + TTS）  🟡

**負責人/團隊：** 北京：Alger Wang + Bruce Zhong；台灣：Sean Peng；SEL：Eddy Lin

**🏙 北京（Alger Wang）：**
- AI debug 進度：60%（3/31 例會確認）
- 4/15 AI Demo：Alger 主導，Demo 準備進行中（VM + TTS）
- SEL 與 AI 整合持續推進

**🇹🇼 台灣（Sean Peng）：**
- Whisper V3 + LoRA 訓練上週截止（3/27）
- SEL TTS API（Gaozhan 對接）啟動
- Google Play Store 上架目標
- SEL APP Demo 準備中

**LearnMode 端（Eddy Lin）：**
- SEL 4/15 Demo：多線準備（App + TTS + AI），Eddy Lin 為 Project Owner（4/1 教育部門 sync-up 確認）
- 5/2–3 AI 活動
- 5/10 AI 大型活動

---

### 2.11 LearnMode — AI Hackathon 執行  🟢

**負責人/團隊：** Eddy Lin / Ruru Lin / Michael Chien（主持）
**狀態：** ✅ 4/1 順利舉辦

AI Hackathon 於 2026/04/01 13:30 舉辦（教育部門 sync-up 4/1 確認 1:30 PM 開始）。共 **9 組 Demo**（5+1+3）：
- 15 個 Demo 項目（0–7 類 / 0–3 類 / 5 類分組）
- Michael Chien 3:30 PM 主持 AI 分享收尾
- Ruru Lin 統籌 Demo readiness

---

### 2.12 LearnMode — 財務數據審查 & B2C 佈局  🟡

**負責人/團隊：** Sophia Cai / Eddy Lin / Robert / Michael Chien
**現況：** 4/1 教育部門 sync-up 執行財務審查

財務數據審查（items 1–8，多期收入表）：
- B2C SEL 目標：**3,000 套**；總計 1.16M 目標
- 25 個品項詳細 revenue 拆分（各 0.1M–9.4M 區間）
- TVBS follow-out 評估中（Sophia Cai / PM）
- V2 課程 follow-out（Eddy Lin + Grace，目標 4/9）
- 4/25 Teams 20% Revenue 里程碑追蹤（Sophia）

**Action Items（4/1 sync-up）：**
- Robert：硬體 convert（4/8）
- StevenCH / Eddy：Website TA 佈局（4/8）
- Eddy Lin：SEL 多線推進（4/15）
- Monica：Meeting Minutes + 3 SEL 20%
- Sophia Cai：Items 1–7 follow-through

---

### 2.13 LearnMode — 網站 & TA 佈局  🟡

**負責人/團隊：** StevenCH / Eddy Lin
**現況：** Website TA（Target Audience）佈局啟動，目標 4/8

Open Issues（4/1 sync-up）確認：TA 佈局需 Eddy + StevenCH 共同推進，以 B2C 3,000 套為目標定義 TA 規格；B2C PM/Sales 主導策略方向。

---

### 2.14 TV Solution — [本週無新更新]  🟢

MagicView 案件已關閉（上週確認）。本週無新議題。

---

## 3. 子組進度

### 3.1 Media Agent 組（Steve Liu / Dream / TC Peng / Anna / Swift Zhu）

**本週最重大交付：STT MRD V6.0 + FaceSearch MRD V3.0 同步升版（3/30），STT PRD + FaceSearch PRD（4軌）全面完成（4/3前）。** TVBS Demo 4/23 確認，Demo Rundown 由 Alex 起草（4/2x）。Agentic Meeting 確認各項 Demo 分工，截止 4/8。OpenMAM 3.0 Review 由 Dream 啟動，4.0 排程方向提出（日期 TBD）。Anna：400GB Olapedia 素材準備中。TC：A5000 GPU 評估。產品對外命名尚未開始。EDD Draft 持續進行中（Alex，4/3x）。

### 3.2 創造栗組（Luffy Luan / Tonny / Bruce / Kevin / Eva / Sean / Alger）

3/31 例會完成 AI PC ownership 分工確認（Kevin/Tonny/Eva/Luffy/Alger），並審視 B2 Pro/Lite 生產進度。Sean IoT  郵件仍 Pending（⚠️ 持續阻塞）。Sean AI 特攻隊 TTS API（Gaozhan）+ SEL APP demo 推進中。Alger Wang AI debug 60%，4/15 Demo 準備進行中。B2 Pro 量產 1K 套目標，lead time 協調中（Tanner/Sunny/Carrie）。K8S 架構由 Tonny Shen 主導。

### 3.3 LearnMode 組（黎博主導，Ruru Lin / Eddy Lin / Sophia / Michael）

AI Hackathon 4/1 順利執行（9組 Demo，Michael Chien 主持）。4/1 教育部門 sync-up 完成財務數據審查，B2C 目標 3,000 套，總收入 1.16M。SEL 4/15 Demo 多線推進（Eddy 為 Project Owner）。Website TA 佈局啟動（StevenCH/Eddy，4/8）。V2 課程 follow-out（Eddy + Grace，4/9）。Monica 接手 Meeting Minutes。Robert 負責硬體 convert（4/8）。

### 3.4 TV Solution 組（Tom Liu）

本週無新進展。MagicView 已完成關閉。

---

## 4. 跨部門協作與客戶互動

### 4.1 TVBS — Demo 4/23 正式確認

4/1 Agentic Meeting 正式確認 TVBS Demo 排程為 **4/23**，三場景規劃：Olapedia 名人搜尋、STT 字幕流程、OlaMedia Roadmap。Demo Rundown 由 Alex 起草（4/2x），技術端由 Steve 主導。

### 4.2 TVBS — STT 現場訪查後續

上週（3/24）TVBS 現場訪查結果（Taption ≈ 1:1 校對比、少康戰情 + 新聞大白話流程）已完整納入 STT MRD V6.0（3/30 完成），作為本次 PRD 起草的核心依據。

### 4.3 政府端 — SEL 活動時程

| 活動 | 日期 | 負責人 | 狀態 |
|------|------|--------|------|
| SEL 多線 Demo 完成 | 4/15 | Eddy Lin / Alger / Grace | 🟡 進行中 |
| 兩岸 AI 合作夥伴交流 | 4/15 | 黎博 | ⏸️ 待執行 |
| AI 活動（5/2–3） | 5/2–3 | Eddy Lin | ⏸️ 規劃中 |
| 大型外部 AI 活動（5/10） | 5/10 | 創造栗 / 黎博 | ⏸️ 規劃中 |

### 4.4 企業端 — Corporate AI（Jennifer）/ B2C 佈局

B2C 3,000 套目標確立（4/1 教育部門 sync-up），Sophia/PM/Sales 主導策略。TVBS follow-out 評估（PM 端）。Jennifer Corporate AI 方向持續（本週無新更新）。

---

## 5. 重大決策與戰略討論

**決策一：STT MRD V6.0 + FaceSearch MRD V3.0 升版確認（3/30 + 3/31 Program Sync）**
兩份 MRD 正式升版，PRD 基礎確立；FaceSearch 三軌架構（A: Face Search / B: AI Tagging / C: NLP Semantic）正式定案。

**決策二：TVBS Demo 4/23 正式確認（4/1 Agentic Meeting）**
Demo 日期鎖定 4/23，Rundown 由 Alex 起草。三場景框架（Olapedia + STT + Roadmap）確認。4/8 為各 Demo 準備完成目標日。

**決策三：OpenMAM 3.0 Review 啟動，4.0 排程方向提出（4/1 Agentic Meeting）**
Dream 主導 3.0 API + UI Review，TVBS 介接路徑評估中；4.0 排程首次提出（日期 TBD，Alex 2026/4/22 為相關節點）。

**決策四：AI PC ownership 確認（3/31 創造栗例會）**
Kevin Liu：整體 Owner + VM/local 架構；Tonny Shen：K8S；Eva Huang：硬體規格；Luffy Luan：商業計劃 PM；Alger Wang：AI 模型整合。

**決策五：Eddy Lin 確認為 SEL Project Owner（4/1 教育部門 sync-up）**
Michael Chien 正式確認 Eddy Lin 為 SEL 項目 Project Owner，Robert 負責硬體。

**決策六：B2C SEL 目標 3,000 套，總收入目標 1.16M（4/1 教育部門 sync-up）**
Sophia Cai 財務數據審查完成，B2C 定量目標確立。

**決策七：RD 文件管理遷入 VSTS/Azure DevOps（3/31 Program Sync，Steve 主導）**
EDD + AI 模型清單 + 技術文件統一在 VSTS/Azure DevOps 管理，解決黑箱問題。

---

## 6. 下週重點計劃

| 優先級 | 任務描述 | 負責人 | 預計完成日 | PgM 狀態 |
|--------|---------|--------|-----------|---------|
| **P0** | **IoT 郵件發出（最長阻塞項）** | Sean Peng | **ASAP** | 🔴 仍 Pending |
| **P0** | **TVBS Demo 4/23 Rundown 起草完成** | Alex Liao | 2026/04/2x | 🟡 進行中（⑤） |
| **P0** | **STT Demo 內容 + Olapedia Demo 確認** | Alex + Steve | 2026/04/08 | ⏸️ 待執行 |
| **P0** | **Swift Zhu SRT Demo clip 完成** | Swift Zhu | 2026/04/08 | ⏸️ 待執行 |
| **P0** | **OpenMAM 3.0 規格文件（Dream）** | Dream Ku | 2026/04/08 | 🟡 進行中 |
| P1 | EDD 流程導入規劃 Draft 完成 | Alex Liao | 2026/04/3x | 🟡 進行中（⑤） |
| P1 | 產品命名（對外）確認 | Alex + Michael | 2026/04/1x | ⏸️ 尚未開始（⑤） |
| P1 | A5000 GPU 確認（TC Peng） | TC Peng | 近期 | ⏸️ 待執行 |
| P1 | Steve：Olapedia Roadmap clip + distributed edge inference server Q2 規劃 | Steve Liu | 2026/04/08 | ⏸️ 待執行 |
| P1 | WER Benchmark 評測啟動（Anna，400GB 素材） | Anna Guo | 近期 | 🟡 進行中 |
| P1 | 台標識別模型訓練啟動 | Steve 團隊 | 2026/04/初 | ⏸️ 待執行 |
| P1 | Kevin Liu：B2 Pro lead time + Pro D2 schedule 回報 | Kevin Liu | 本週 | 🟡 進行中 |
| P1 | Bruce Zhong：B2 Lite 品質規格 CC | Bruce Zhong | 本週 | 🟡 進行中 |
| P1 | Luffy Luan：AI PC 商業計劃起草 | Luffy Luan | 近期 | ⏸️ 待執行 |
| P1 | Alger Wang AI debug → 4/15 Demo 就緒 | Alger Wang | 2026/04/15 | 🟡 進行中 |
| P1 | SEL APP + TTS Demo 準備（Sean Peng） | Sean Peng | 2026/04/15 | 🟡 進行中 |
| P1 | Eddy Lin：SEL 多線推進（App / 課程 / TVBS） | Eddy Lin | 2026/04/15 | 🟡 進行中 |
| P1 | StevenCH + Eddy：Website TA 佈局 | StevenCH / Eddy | 2026/04/08 | ⏸️ 待執行 |
| P1 | Robert：硬體 convert（教育部門） | Robert | 2026/04/08 | ⏸️ 待執行 |
| P1 | 財務數據 Items 1–7 follow-through | Sophia Cai | 近期 | 🟡 進行中 |
| P1 | TVBS AI Sharing Draft 推進 | Alex Liao | 2026/04/24 | 🟡 進行中（⑤） |
| P2 | Monica：Meeting Minutes 接手 + 3 SEL 20% | Monica | 近期 | 🟡 進行中 |
| P2 | 5/2–3 / 5/10 活動規劃細節確認 | 黎博 / 創造栗 | 4 月中 | ⏸️ 規劃中 |
| P2 | OpenMAM 4.0 排程初步定案 | Dream / Steve / Alex | 2026/04/22 | ⏸️ 待執行 |

---

## 7. 風險與問題追蹤（Risk Register）

| Risk ID | 描述 | 影響等級 | 狀態 | 處理進度 | 需協助 |
|---------|------|---------|------|---------|--------|
| R1 | **IoT 郵件持續 Pending**：4/1 Agentic Meeting 確認仍未發出，阻塞 Q2/Q3 IoT 整合排程 | 🔴 高 | 持續 | Alex 列為 ASAP；Sean 執行中 | Sean 本週立即發郵件 |
| R2 | **TVBS Demo 4/23 準備時間緊迫**：剩不到 3 週，三場景 Runbook 需對齊，部分技術項目截止 4/8 | 🔴 高 | 新增 | Rundown 由 Alex 起草；各 Demo 分工確認 | Steve + Alex + Dream 本週對齊 Runbook 規格 |
| R3 | **客語 ASR 算力成本未定**：NCHC 4/9 就緒，Local AI Server 採購評估中，70 萬門檻 | 🔴 高 | 持續 | Robert 4/9 硬體到位；TC Peng A5000 評估中 | 黎博 最終決策 |
| R4 | **Ｖ2 Pro 量產 1K 套 lead time 風險**：廠商 schedule 協調中，Sunny/Carrie buffer 方案待出 | 🟡 中 | 進行中 | Kevin Liu 主導；Tanner 8D Report 跟進 | Tanner/Sunny 本週回報 schedule |
| R5 | **AI PC 商業計劃缺位**：Ownership 分工已確認，但 Business Plan 尚未啟動（Luffy 待起草） | 🟡 中 | 新增 | 3/31 例會確認 Luffy 為 PM | Luffy 本週開始起草 Business Plan |
| R6 | **SEL 4/15 截止多線並行**：Alger AI demo + Sean TTS APP + Eddy 課程三線同時收斂 | 🟡 中 | 進行中 | Eddy 為 Project Owner；Ruru 統籌 | 各線本週確認 demo readiness |
| R7 | **EDD 黑箱問題未完全解決**：EDD Draft 進行中（Alex），RD VSTS 建立（Steve）待執行 | 🟡 中 | 進行中 | 文件鏈 MRD ✅ PRD ✅ EDD 🟡；VSTS 計劃中 | Steve 本週建立 VSTS EDD 結構 |
| R8 | **OpenMAM 3.0→4.0 路徑不確定**：4.0 排程方向提出但日期 TBD，TVBS 2.0 介接評估中 | 🟡 中 | 新增 | Dream 3.0 Review 啟動；4.0 TBD | Dream + Steve 4/8 前完成 3.0 規格 |
| R9 | **產品對外命名未啟動**：PgM 追蹤器顯示「尚未開始」（目標 4/1x），影響 TVBS Demo 4/23 材料準備 | 🟡 中 | 新增（⑤） | Alex 追蹤中 | Alex + Michael 本週確認命名方向 |
| R10 | **5/9–5/10 活動規模不明**：細節未確認，可能影響 Q2 資源配置 | 🟢 低 | 持續 | 4 月中確認細節 | 黎博 / 創造栗 確認 |

---

## 8. 行動方案追蹤（Action Items）

#### Media Agent — Demo & 文件（優先級：高）

| 項次 | 行動項目 | 負責人 | 目標時間 | PgM 狀態 |
|------|---------|--------|---------|---------|
| 1 | **IoT  郵件發出（ASAP）** | Sean Peng / Alex 追蹤 | ASAP | 🔴 Pending（④） |
| 2 | TVBS Demo 4/23 Rundown 起草 | Alex Liao | 2026/04/2x | 🟡 進行中（⑤） |
| 3 | STT Demo 內容準備（STT + MRD v6 場景） | Alex + Steve | 2026/04/08 | ⏸️ 待執行 |
| 4 | SRT Demo clip 完成（Swift Zhu） | Swift Zhu | 2026/04/08 | ⏸️ 待執行 |
| 5 | Olapedia Demo 確認（Steve / Alex） | Steve / Alex | 2026/04/08 | ⏸️ 待執行 |
| 6 | Olapedia Roadmap clip + Q2 roadmap distributed edge inference server | Steve Liu | 2026/04/08 | ⏸️ 待執行 |
| 7 | EDD 流程導入規劃 Draft 完成 | Alex Liao | 2026/04/3x | 🟡 進行中（⑤） |
| 8 | VSTS/Azure DevOps EDD + AI 模型清單結構建立 | Steve Liu | 近期 | ⏸️ 待執行 |
| 9 | OpenMAM 3.0 規格文件完成 | Dream Ku | 2026/04/08 | 🟡 進行中 |
| 10 | OpenMAM 4.0 排程初步定案 | Dream / Steve / Alex | 2026/04/22 | ⏸️ 待執行 |
| 11 | 產品對外命名確認 | Alex + Michael | 2026/04/1x | ⏸️ 尚未開始（⑤） |
| 12 | WER Benchmark 評測啟動（Anna，400GB 素材） | Anna Guo | 近期 | 🟡 進行中 |
| 13 | A5000 GPU 採購/確認（算力補充） | TC Peng | 近期 | ⏸️ 待執行 |
| 14 | 台標識別模型訓練啟動 | Steve 團隊 | 2026/04/初 | ⏸️ 待執行 |
| 15 | TVBS AI Sharing Draft 推進 | Alex Liao | 2026/04/24 | 🟡 進行中（⑤） |
| 16 | Michael：EDD / 文件架構確認 | Michael Chien | 2026/04/08 | ⏸️ 待執行 |

#### 創造栗 — 硬體 & AI 特攻隊（優先級：高）

| 項次 | 行動項目 | 負責人 | 目標時間 | PgM 狀態 |
|------|---------|--------|---------|---------|
| 17 | V2 Pro lead time 廠商確認 | Kevin Liu | 本週 | 🟡 進行中 |
| 18 | V2 Pro 生產 schedule（as-if buffer 方案） | Tanner / Sunny / Carrie | 本週 | 🟡 進行中 |
| 19 | V2 Lite 品質規格 CC（spec） | Bruce Zhong | 本週 | 🟡 進行中 |
| 20 | K8S 架構設計（AI PC Infra） | Tonny Shen | 近期 | 🟡 進行中 |
| 21 | AI PC 商業計劃起草 | Luffy Luan | 近期 | ⏸️ 待執行 |
| 22 | AI PC 硬體規格評估 | Eva Huang | 近期 | 🟡 進行中 |
| 23 | Alger Wang AI debug 完成 → 4/15 Demo 就緒 | Alger Wang | 2026/04/15 | 🟡 進行中 |
| 24 | Sean Peng SEL TTS APP Demo 準備 | Sean Peng | 2026/04/15 | 🟡 進行中 |

#### LearnMode — 課程、AI 工具、教育活動（優先級：高）

| 項次 | 行動項目 | 負責人 | 目標時間 | PgM 狀態 |
|------|---------|--------|---------|---------|
| 25 | SEL 多線 Demo 準備（App + TTS + AI 場景）| Eddy Lin | 2026/04/15 | 🟡 進行中 |
| 26 | Website TA 佈局（B2C 3,000 套 TA 定義） | StevenCH / Eddy | 2026/04/08 | ⏸️ 待執行 |
| 27 | 硬體 convert（教育部門） | Robert | 2026/04/08 | ⏸️ 待執行 |
| 28 | 財務數據 Items 1–7 follow-through | Sophia Cai | 近期 | 🟡 進行中 |
| 29 | V2 課程 follow-out（Grace 支援） | Eddy Lin / Grace | 2026/04/09 | 🟡 進行中 |
| 30 | Monica：Meeting Minutes 接手 + SEL 20% | Monica | 近期 | 🟡 進行中 |
| 31 | 兩岸 AI 合作夥伴交流主場次（4/15）準備 | 黎博 | 近期 | ⏸️ 待執行 |

---

## 9. 關鍵時間節點與總結

**未來 8 週重要里程碑：**

| 日期 | 里程碑 | 負責人 | PgM 狀態 |
|------|--------|--------|---------|
| **2026/04/01（本週）** | AI Hackathon 舉辦 ✅ | Eddy / Ruru / Michael | ✅ 完成 |
| **2026/04/08** | TVBS Demo 分場景 Demo 準備完成（STT + SRT + Olapedia）；OpenMAM 3.0 規格；Michael EDD 確認 | Alex / Steve / Swift / Dream / Michael | ⏸️ 待執行 |
| 2026/04/初 | 台標識別模型訓練啟動 | Steve 團隊 | ⏸️ 待執行 |
| **2026/04/09** | 客語 ASR NCHC Local AI Server 到位 | Robert / TC | ⏸️ 待執行 |
| **2026/04/15** | SEL 多線 Demo（Alger AI demo + Sean TTS APP + Eddy）；兩岸 AI 合作夥伴交流 | Eddy / Alger / Sean / 黎博 | 🟡 進行中 |
| **2026/04/23** | **TVBS Demo（Olapedia + STT + OlaMedia Roadmap）** | Steve / Alex / Dream / Swift | 🟡 準備中 |
| 2026/04/24 | TVBS AI Sharing 培訓 Deck 完成 | Alex Liao | 🟡 進行中 |
| 2026/04/30 | SEL 全部課程目標達成；B2C 3,000 套佈局推進 | Eddy / Sophia | 🟡 進行中 |
| **2026/05/02–03** | AI 活動（LearnMode / 創造栗） | Eddy / 黎博 | ⏸️ 規劃中 |
| **2026/05/10** | AI 大型外部活動 | 創造栗 / 黎博 | ⏸️ 規劃中 |
| 2026/06/30 | AI 人力效能 Phase 1：釋放 1/3 人力 | Eddy / Dream | 🟡 進行中 |

**本週戰略核心總結：**

本週以 **STT MRD V6.0 + FaceSearch MRD V3.0 同步升版** 及 **STT/FaceSearch PRD 四軌全面完成** 為最重要技術里程碑——MRD → PRD → EDD 的文件鏈條在兩條主線上同時打通，是 Media Agent 在 TVBS 正式交付前最後一個文件制度化的關鍵節點。4/1 Agentic Meeting 確認 **TVBS Demo 4/23 正式日期**，使接下來的工作重心清晰聚焦：各 Demo 場景準備完成截止 4/8，Rundown 由 Alex 主導。創造栗側，AI PC 新產品線的 ownership 本週正式確認，K8S（Tonny）+ 商業計劃（Luffy）+ 硬體（Eva）三線分工，標誌著從研究走向產品化的第一步。LearnMode 側，AI Hackathon 4/1 順利舉辦，下一個關鍵事件是 **4/15 SEL 多線 Demo**（Alger + Sean + Eddy 三線收斂），資源集中，需確保 demo readiness。**最緊迫未解阻塞項：Sean NCC 郵件，已持續兩週 Pending，需立即推動。**

---

*來源文件：*
- *① 260331_Program Progress Follow（Program Sync 週例會，2026-03-31）*
- *② 260331_創造栗例會：小栗方 Pro（創造栗週一例會，2026-03-31）*
- *③ 260401_Agentic Meeting（Agentic Platform Discussion Meeting，2026-04-01）*
- *④ 260401_教育部門 Sales/PM/RD sync-up mtg（教育部門跨部門同步，2026-04-01）*
- *⑤ Program Progress Mtg（PgM 追蹤器快照，Alex Liao，截至 2026-04-01）*
