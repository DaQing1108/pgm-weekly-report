# VIA Technologies — Program Sync 週報

---

**報告標題：** VIA Technologies — Program Sync 週報   
**報告週期：** 2026/04/20 – 2026/04/24（W17）   
**報告日期：** 2026/04/24   
**彙整人：** Alex Liao **涵蓋團隊：** Media Agent / 創造栗 / LearnMode / TV Solution / BU2 Healthcare

**來源文件：**  
 ① 260420\_教育部門 Sales/PM/RD sync-up（教育跨職能週會，課程開發 × 彰化活動 × 金門市場 × 客語 ASR × 威栗雲入口）  
 ② 260421\_Program Progress Follow（Alex × Michael，Demo 簡報最終版走讀 × DGX 模型透明度問題 × STT Demo 虛缺問題）   
③ 260421\_創造栗例會：小栗方 Pro（創造栗週二例會，樂高套裝 × 威栗識覺小車 × 認證策略 × 流程紀律）  
 ④ 260422\_VIA Media Agent Product Demo Meeting（4/22 正式 Demo，TVBS \+ CatchPlay 與會，7 情境展示 \+ OpenMAM 整合討論）   
⑤ Program Progress Mtg-（PgM 0420 週狀態）

---

## 章節一：Executive Summary

本週（4/20–4/24）最重要的里程碑是 **4/22 AI Demo 順利舉行**。VIA 向 TVBS 新聞部與集團 AI 團隊、以及 CatchPlay 正式展示 Media Agent 七大情境，出席者包含 TVBS 黃明智、吳楨文（Joe）、Andy 及 Bach Chen，以及 CatchPlay 的 Mark 與 Brian。七情境中 A–E 已上線並完整 Demo；情境 F（STT highlight 校稿，120 分鐘縮短至 15 分鐘）與情境 G（Smart Crop，30 分鐘縮短至 5 分鐘）仍在開發中，預計 Q3 2026。Olapedia v1.0 正式發布，已核驗詞條數確認為 11,231 筆，下一波擴充目標約 13,000 筆，終極目標 100K+。Demo 後第二段深度討論揭示四大 OpenMAM 工程問題，需後續會議釐清。

Demo 現場亦暴露若干技術問題。Alex 在 4/21 Program Sync 中明確指出：STT 情境「很虛」—本次 Demo 的 ASR 後端未接上，僅展示 SRT 後製編輯介面，語音轉寫核心能力並未實際呈現；智慧採接（Smart Crop）模組缺乏 AI 自動追蹤定位，仍需人工調整；語音控制 SRT 時間碼的新功能不直覺，不適合直接對客戶展示。此外，DGX 所使用的模型規格至今仍未公開，Steve Liu 回覆「仍在評估中」，Alex 擔憂這構成對 TVBS 的黑箱風險，若導入後出問題更換模型等於重來。Demo 簡報最終版已完成，3.5 FTE 字眼全數移除，12 週導入時程頁面暫保留作為下次與 TVBS 實質討論的議題。

教育部門方面，4/25 彰化縣活動本週籌備就緒，Demo 改以手機 hotspot 方式展示 SEL APP（WiFi 不穩），12:30 聯訪賴副局長。金門市場拓展本週正式啟動，Eddy Lin 4/21 出發，目標年底兩個專案（約 200-300 萬元）。威栗雲缺乏小栗方Pro 入口的問題本週確立三步驟解決流程，客語外包合約確立 back-to-back 模式。教育 AI 人才幫助計畫（原數位精進方案）需重新申請 A2P，學習吧教育大數據介接尚未完成，成為取得認證資格的瓶頸。

---

## 章節二：關鍵專案進度

### 2.1 TVBS AI Demo（4/22 已舉行）

**狀態：✅ 里程碑完成，後續整合討論啟動**

| 項目 | 說明 |
| :---- | :---- |
| 舉辦日期 | **2026/04/22（週三）✅ 順利舉行** |
| 與會方 | VIA（Dream/Alex/Michael/Steve Liu/TC）+ TVBS（黃明智/Joe/Andy/Bach Chen）+ CatchPlay（Mark/Brian） |
| 簡報名稱 | Media Agent — 打造媒體資產智能化（Gamma 平台） |
| 資料規模展示 | 84,973 支影片 / 9,888 小時 / 79TB；Dream 建議特別 highlight（相較 TVBS PB 級片庫差異懸殊） |
| 核心定位 | 疊加層：資料不外流 / 介面不修改 / 決策不轉移 |

**七大展示情境：**

| 情境 | 主題 | 關鍵數字 | 狀態 |
| :---- | :---- | :---- | :---- |
| A | 大司法案件緊急追溯 | ≤7 秒 / 99.9% / 9,888 小時 | ✅ 已上線 |
| B | 焦點人物跨時段快速定位 | 遮蔽仍可識別 / 11,231 筆名人庫 | ✅ 已上線 |
| C | NLP 口語語意搜尋 | 口語句查詢，秒級回傳含 timecode 清單 | ✅ 已上線 |
| D | 靈活別名搜尋（模糊比對） | 輸入「蔣市長」「善政」即找到對應人物 | ✅ 已上線 |
| E | 名人庫管理介面（去重/分級） | AI 自動偵測重複、相似度分級 | ✅ 已上線 |
| F | 採訪逐字稿自動聽打 SRT | 120 分鐘 → 15 分鐘；≥93% 識別準確率 | 🔧 開發中（Q3） |
| G | 多平台構圖轉換 Smart Crop | 30 分鐘 → 5 分鐘；一鍵輸出三比例 | 🔧 開發中（Q3） |

**Olapedia v1.0 正式發布：** 11,231 筆已核驗詞條（修正前期 PPT 11,432/11,232 的混淆）；下一波擴充 \~13,000 筆；終極目標 100K+。

**CatchPlay：** 第一段結束後先行離線，本次無具體下一步，後續視媒體 AI 應用機會再跟進。

---

### 2.2 OpenMAM 2.0 AI 整合（Demo 後浮現四大工程問題）

**狀態：🔴 工程前提未就緒，需優先解決**

4/22 Demo 後第二段討論（VIA \+ TVBS）揭示整合面臨四大工程問題：

| \# | 問題 | 影響 |
| :---- | :---- | :---- |
| 1 | TVBS 現用 OpenMAM 2.x，AI Server 開放 API 接口僅設計於「標案版」，2.x 尚未具備，前後端需修改 | 整合前提不成立 |
| 2 | Media Agent API 規格與 OpenMAM 前後端對接介面尚未正式定義 | 修改範圍無法估算 |
| 3 | 歷史片庫達 PB 等級，全量標註掃描時間與設備配置未有估算 | 部署規劃無從開始 |
| 4 | 向量庫存儲架構（NAS vs. in-memory）未定，影響搜尋時間隨片庫量的增長曲線 | 系統擴展效能不確定 |

**TVBS 黃明智強調**：AI 功能必須無縫嵌入現有 OpenMAM 介面選單，避免多視窗跳轉（以 AVID Media Composer 2024 為參照標準）。

**工程共識（下一步）：**

- Steve Liu \+ JH 先行比對標案 API 規格與現有 Media Agent spec，找出 gap  
- 以現有設備估算歷史片庫全量掃描時間，再決定分批策略  
- 邀請 Sally 參與 OpenMAM 整合後的 UX 介面設計  
- 向量庫架構待 API 規格確定後一併討論

---

### 2.3 STT 技術路線（Demo 暴露虛缺問題）

**狀態：🔴 核心模組誠信問題待解決**

本週 Alex 正式提出三項 Demo 技術虛缺問題：

| 模組 | 問題 | 影響等級 |
| :---- | :---- | :---- |
| STT 聽打（情境 F） | ASR 後端未接上，僅展示 SRT 後製編輯介面，未呈現真正語音轉寫能力 | 🔴 高 |
| Smart Crop（情境 G） | 缺乏 AI 自動定位人物能力，仍需人工調整，與現行作業無實質差異 | 🔴 高 |
| 語音控制 SRT 編輯 | 操作比手動點擊更慢不直覺，不適合對客戶展示 | 🟡 中 |

**DGX 模型不透明問題：** Steve Liu 未公開目前 DGX 所用模型（回覆「仍在評估中」），Alex 認為此為黑箱風險——若導入後出問題、以「模型不給力」為由要求換模型等於重來。Dream 將需求轉向 DGX 硬體規格（幫助 TVBS 評估採購預算）。

**STT 準確率提升路徑（4/22 Demo 後 open issue）：**

- 目標：≥93%  
- 第一層：熱詞詞庫（Hot Word Boosting，IT 或業務可自行更新）  
- 第二層：VIA 提供模型微調（Fine-tuning）服務，使用 TVBS 自有採訪音頻針對性訓練

**AVID 競合關係（新識別風險）：** TVBS 已購入 AVID Media Composer 2024 共 4 套 license，內建 STT 逐字稿及 subclip 功能（離線運作），王昇峰測試後反應極佳。Media Agent STT 模組與 AVID 的定位差異及互補關係尚未明確，需進一步釐清。

---

### 2.4 Olapedia / OlaMedia 獨立產品化

**狀態：🟡 進行中（PgM 追蹤器）**

- Olapedia / OlaMedia 獨立產品化：PgM 追記為「進行中」  
- 產品命名（對外）：PgM 標記為「尚未開始」（預計 5/1x）  
- TVBS\_AI\_sharing\_Draft：PgM 標記為「尚未開始」  
- 威栗雲至國際（台灣）站點更新：PgM 標記為「進行中」

---

### 2.5 創造栗：樂高套裝 & 威栗識覺小車

**狀態：🟡 推進中（報價階段 \+ 料號申請）**

| 項目 | 狀態 | 說明 |
| :---- | :---- | :---- |
| 樂高套裝 6 案例 BOM | ✅ 完成 | BOM 整理完成，供應商已開始依最新 BOM 報價，最終報價待回覆 |
| 樂高案例搭建步驟圖 | 🟡 進行中 | 本週任務：用軟體完成 6 個案例步驟圖製作 |
| 威栗識覺小車料號申請 | 🟡 進行中 | 申請流程已有變化，需重新確認新流程 |
| 威栗識覺小車交期對齊 | ⏳ 待執行 | Kevin 期望 5 月中到貨；需 Luffy \+ Kevin 私下對齊排期 |
| NCC \+ UN38.3 認證 | ⏳ 待啟動 | 確認第一批必做；StevenCH 確認申請進度與執行時程 |
| BSMI 認證 | 🟡 暫緩 | 特定標案要求時補做；現階段非強制優先 |
| 繁/簡體亞克力外殼樣品 | ⏳ 待執行 | Bruce 聯繫供應商製作 |

**流程紀律重要決策（黎博，4/21 創造栗例會）：** 未來所有新產品在進入週會決策前，必須先完成產品端與 Sales 端的私下對齊，並準備含「完成度、Risk、挑戰點」的狀態說明文件；所有細節確認透過 email 留存。

---

## 章節三：子組進度

### 3.1 Media Agent（RD Center）

**本週核心進展：**

- **4/22 AI Demo 順利舉行** ✅（詳見 2.1）  
- **Demo 簡報最終版完成**：PPT 架構按 Michael 建議重構完畢；3.5 FTE 字眼全數移除；成本換算公式保留；Demo 影片以連結形式嵌入各頁底部  
- **Olapedia v1.0 正式發布**：11,231 筆已核驗詞條（下一波目標 \~13,000 筆）  
- **STT Demo 技術虛缺問題正式提出**（Alex，詳見 2.3）——需在後續版本解決再做二次 Demo  
- **PgM 完成項目**：Demo 影片製作✅、Rundown/腳本起草✅、Product Demo Meeting✅  
- **音軌格式問題**：Alex 表示將另行與 TVBS 確認音軌輸出格式，目標改為四軌方式存檔（PgM 追蹤器仍列進行中）  
- **DGX 模型透明度問題**：Steve Liu 未公開模型，Alex 明確提出黑箱風險疑慮，需追蹤（詳見 2.3）

---

### 3.2 創造栗

**本週核心進展（詳見 2.5）：**

- 樂高套裝 BOM 完成，進入供應商報價階段  
- 威栗識覺小車料號申請進行中  
- 認證策略確定：NCC \+ UN38.3 第一批必做，BSMI 暫緩  
- AI 特攻隊 Review 本週繼續（Luffy、Kevin、Eva 下週留下小會）  
- 黎博強調流程紀律：決策會議前產品-Sales 私下對齊、email 留存細節

---

### 3.3 LearnMode（教育事業部）

**📋 月報格式：以下為 4 月份進度月度彙整。**

**課程開發：**

- 小栗方Pro 四年級課程：第 3–16 節共 10 個作品推進中；第 3 課（哪吒→孫悟空）與第 13 課（垃圾分類本地化）暫排後處理；以快速推出可銷售內容為第一優先  
- 三年級 Scratch 積木課（8-12 堂）：繼續翻譯製作（Grace，4/30 前）  
- 水保署課程：14 份教材，文本完成 4 份；4/20 廠商與水保署第一次會議；目標 5 月底上線  
- 小栗方Lite 繪本課程：66 個課程；故事全數完成；正式定稿 5 個，繪本階段 7 個；黎博強調需引入 AI 工具加速圖像生成（主角一致性為主要技術難點）

**平台與系統：**

- 威栗雲小栗方Pro 入口：三步驟流程確立（Sean email Steven CH → StevenCH 確認 → Sean 提需求給 Michael → 上海加入口）  
- AI 人才幫助計畫（原精進方案）：需重新申請 A2P；加分吧已送件；學習吧尚未完成教育大數據介接（為取得資格的瓶頸）

**市場拓展：**

- 彰化縣 4/25 活動：11:00 前到場；11:35 頒獎；12:30-12:40 聯訪賴副局長（加分吧 \+ SEL）；Demo 改用手機（WiFi 不穩），5/3 再展示完整裝置版  
- 金門市場：**Eddy Lin 4/21 出發**，目標年底 2 個專案（200-300 萬元），小栗方Pro 為主要切入產品；Sophia 協助推進  
- 客語教育外包合約：back-to-back（仿客委會原合約），付款條件：驗收通過才付款；Steven CH 負責推進法務並發 mail  
- 代理商通路：Steven CH \+ Eddy 準備拜訪代理商，需先整理現有產品組合（停產項目整理）

---

### 3.4 TV Solution（OpenMAM）

- OpenMAM 2.0 AI 整合：四大工程問題浮現（詳見 2.2），需先解決 API 規格定義  
- OpenMAM 3.0：Dream Review 中，目標月底說明（本週未有新更新）

---

### 3.5 BU2 Healthcare

本週無新更新。

---

## 章節四：跨部門協作與客戶互動

### 4.1 TVBS 黃明智

**4/22 Demo 反饋要點：**

- TVBS iNews metadata 長期包含 SOT 新聞稿全文，建議入庫時利用此現有資料做初步語意關聯，減少全面視頻掃描量  
- AVID Media Composer 2024 已購入 4 套 license，內建 STT 逐字稿 \+ subclip（離線），王昇峰測試效果極佳；AI 功能應嵌入原有介面選單，不應另開視窗  
- 強調先釐清「自動化」（rule-based）與「自主化」（AI 判斷）的區別，前者是近期可執行重點  
- AI 服務成本持續上升（計費點數漲價為例），架構設計須納入長期成本考量

### 4.2 TVBS 吳楨文 Joe

**4/22 Demo 問答與建議：**

- 語意主題分段確認：同一人物在不同主題段落各產生獨立 entry，直接跳對應時間點  
- 建議名人庫 Agent-to-Agent 自動更新（選舉後大量 title 變更為例）  
- 建議字幕校對 ground truth 捕捉為 STT 持續微調訓練資料  
- 建議名人庫別名維護引入 AI 批量更新

### 4.3 TVBS Bach Chen

**4/22 Demo 技術確認：**

- STT 口白語意與 metadata 均納入索引，分段邏輯以語意為準，儲存 timecode 與主題標註  
- 分段參數可調（目前系統自動判斷）  
- 追問單台 DGX capacity：滿格同時處理 4 個影音檔（入庫）；歷史存量與每日增量應分開用不同規格機器

### 4.4 CatchPlay（Mark / Brian）

- 第一段 Demo 結束後先行離線  
- 本次無具體合作下一步，後續視媒體 AI 應用機會再跟進

### 4.5 TVBS / OpenMAM 整合後續未解問題

| 問題 | 負責人 | 時程 |
| :---- | :---- | :---- |
| API 規格對接：比對標案 API 架構與現有 Media Agent API gap | Steve Liu \+ JH | TBD |
| 單台 DGX 各機器 capacity 技術規格提供 | Steve Liu | TBD |
| 歷史片庫全量入庫時間估算 | Steve Liu | TBD |
| UX 設計：整合介面設計方案 | Sally | TBD |
| TVBS iNews SOT metadata 欄位結構確認 | 黃明智 \+ JH | TBD |
| 名人庫別名自動化更新機制研究 | Steve Liu | TBD |
| 字幕校對 ground truth → STT 微調可行性評估 | Steve Liu | TBD |
| AVID Media Composer 與 Media Agent STT 定位差異釐清 | Alex / Dream | TBD |

---

## 章節五：重大決策與戰略討論

**決策一：4/22 AI Demo 順利舉行，七情境 A–E 全數 Demo 完成** 日期：2026/04/22 | 說明：A–E 已上線，F/G 開發中（Q3 2026）；TVBS \+ CatchPlay 均出席。

**決策二：Olapedia v1.0 正式發布，詞條數確認為 11,231 筆** 決策者：Steve Liu / Dream | 日期：2026/04/22 下一波目標 \~13,000 筆；終極目標 100K+；全新人物 24 小時建庫承諾條件仍需再確認。

**決策三：OpenMAM 整合架構確認以 API 外掛方式疊加，不替換不遷移** 決策者：全員共識（4/22 Demo 第二段）| 日期：2026/04/22 三項核心承諾：資料不上雲、介面不改變、決策由記者保留。

**決策四：歷史片庫掃描策略——歷史存量與每日增量分開處理** 決策者：Dream \+ Steve（4/22 討論共識） 歷史量用較高規格機器；日常增量用 DGX 模組化設備；全量時間先估算後決定分批方案。

**決策五：12 週導入時程頁面保留，但改為下次 TVBS 實質討論議題** 決策者：Alex（4/21 Program Sync 決定） 不作為 PPT 承諾；轉為對 TVBS 的議題，實際時程由雙方共同討論確認。

**決策六：小栗方Pro 進口認證——NCC \+ UN38.3 第一批必做，BSMI 暫緩** 決策者：黎博（4/21 創造栗例會）

**決策七：所有新產品進入決策會議前，需完成產品-Sales 私下對齊並準備狀態文件** 決策者：黎博（4/21 創造栗例會） 要求：完成度、Risk、挑戰點三項必載；細節透過 email 留存。

**決策八：威栗雲台灣版加入小栗方Pro 入口——三步驟流程確立** 決策者：黎博（4/20 教育 sync-up） 流程：Sean email 確認積木可用性 → StevenCH email 確認 → Sean 向 Michael 提需求 → 上海工程執行。

**決策九：客語教育外包合約採 back-to-back 模式（仿客委會），Steven CH 負責法務** 決策者：黎博（4/20 教育 sync-up） 付款條件：驗收通過才付款，未達 80% 標準可協商。

**決策十：彰化縣 4/25 活動 Demo 改為手機展示** 決策者：黎博（4/20 教育 sync-up） 原因：現場 WiFi 不穩定；以手機 hotspot 展示 SEL APP；5/3 桃園活動再展示完整裝置版。

**戰略討論：MAM as portal vs. AI as portal 哲學分歧（4/22 Demo 後段）** 黃明智：MAM 為主、AI 為輔（短期務實）→ Bach Chen：短期 AI 整合 MAM，長期 AI 成為新入口 → Steve Liu：對話介面驅動（NLP input 取代傳統 UI）→ Michael：分階段務實，AI-driven 未來難以預測，不應過度押注。此哲學未達共識，後續需各方深入討論後決策。

---

## 章節六：下週重點計劃（2026/04/27–2026/05/01）

| 優先級 | 任務 | 負責人 | 截止 |
| :---- | :---- | :---- | :---- |
| P0 | API 規格對接會議（Steve+JH 比對標案 API vs Media Agent spec） | Dream \+ Bach \+ Steve / JH | 盡快 |
| P0 | 解決 STT Demo 虛缺問題：接上 ASR 後端，為 Q3 Demo 做準備 | Steve Liu / Alex | Q3 前 |
| P0 | 追蹤 DGX 模型選型，要求 Steve 明確回覆（不接受「評估中」） | Alex / Michael | 近期 |
| P1 | 單台 DGX capacity 規格表提供（TVBS 採購評估用） | Steve Liu | TBD |
| P1 | 歷史片庫全量入庫時間估算（可請上海 Steve Liu 試算） | Steve Liu | TBD |
| P1 | OpenMAM UX 整合介面設計研究（邀請 Sally 參與） | Bach Chen | TBD |
| P1 | AVID Media Composer 2024 vs Media Agent STT 定位釐清 | Alex / Dream | 近期 |
| P1 | 完成樂高案例搭建步驟圖（6 個案例） | Luffy | 本週 |
| P1 | 威栗識覺小車：確認新料號申請流程，推進 | Luffy | TBD |
| P1 | 產品端 vs Kevin（Sales）私下對齊威栗識覺小車交期排程 | Luffy \+ Kevin | TBD |
| P1 | 彰化縣 4/25 活動執行 | 雅婷 / Ruru | 4/25 |
| P1 | 5/3 桃園 SEL 親子活動最終準備 | Ruru / Tiffany | 5/3 |
| P2 | TVBS iNews SOT metadata 欄位結構確認 | 黃明智 \+ JH | TBD |
| P2 | 名人庫別名自動化更新機制研究 | Steve Liu | TBD |
| P2 | 字幕校對 ground truth → STT 微調可行性評估 | Steve Liu | TBD |
| P2 | OpenMAM 3.0 月底說明（全組） | Dream | 4/30 前 |
| P2 | 學習吧教育大數據介接時程評估（AI人才幫助計畫 A2P 前提） | Sean / RD | TBD |
| P2 | 客語 ASR 外包合約法務推進 | Steven CH | 盡快 |
| P2 | 金門市場推進（Eddy Lin 拜訪後回報） | Eddy Lin | 4/25 後 |
| P2 | 威栗雲台灣版小栗方Pro 入口：Sean email Steven CH 確認積木清單 | Sean | 4/20（已確認執行） |

---

## 章節七：風險與問題追蹤（Risk Register）

| Risk ID | 風險描述 | 影響等級 | 狀態 | 負責人 |
| :---- | :---- | :---- | :---- | :---- |
| R01 | STT 情境 F / Smart Crop 情境 G 為開發中模組，Q3 發布壓力大；且 Demo 暴露 ASR 後端未接的誠信問題 | 🔴 高 | Open | Steve Liu / Alex |
| R02 | DGS 模型選型不透明（Steve Liu 未公開），對 TVBS 形成黑箱風險；若導入後換模型等於重來 | 🔴 高 | Open | Alex → 追蹤 Steve |
| R03 | OpenMAM 2.x 尚無 AI Server 開放 API 接口，整合工程前提不成立；API 規格定義、前後端修改範圍均未確定 | 🔴 高 | Open | Dream \+ Steve / JH |
| R04 | AVID Media Composer 2024（4 套 license，測試效果極佳）與 Media Agent STT 定位競合關係未釐清 | 🔴 高 | Open | Alex / Dream |
| R05 | 法務合規：模型訓練資料來源合規狀態仍未釐清（上週已識別，本週未解） | 🔴 高 | Open | Michael |
| R06 | TVBS 歷史片庫達 PB 等級，全量標註時間與設備配置未估算，影響部署規劃 | 🟡 中 | Open | Steve Liu |
| R07 | 上海工程團隊溝通習慣問題持續（四人群組仍未成為主要溝通場域） | 🟡 中 | Open | Michael / Alex |
| R08 | 教育 AI人才幫助計畫（A2P）瓶頸：學習吧教育大數據介接尚未完成 | 🟡 中 | Open | Sean / RD |
| R09 | 小栗方Lite 繪本課程進度落後（66 個課程，繪本階段僅 7 個），需 AI 工具加速 | 🟡 中 | Open | 黎博指導，執行方 |
| R10 | 威栗識覺小車 Sales 期望 5 月中到貨，生產排期尚未確認；產品-Sales 私下對齊未完成 | 🟡 中 | Open | Luffy \+ Kevin |
| R11 | 客語 ASR 合約 4/1 起算已達 3 週仍未擬定 | 🟡 中 | Open | Michael \+ TC Peng |
| R12 | 向量庫架構（NAS vs. in-memory）未定，影響搜尋效能隨片庫量擴展的可預測性 | 🟡 中 | Open | Dream \+ Steve |
| R13 | 公視交件延至 8 月 | 🟢 低 | Open | Dream |

---

## 章節八：行動方案追蹤（Action Items）

### Media Agent 相關

| \# | 任務 | 負責人 | 目標時間 | 狀態 | 來源 |
| :---- | :---- | :---- | :---- | :---- | :---- |
| A01 | API 規格對接：比對標案 API 架構與現有 Media Agent API gap，確認 OpenMAM 前後端修改範圍 | Dream \+ Bach \+ Steve/JH | TBD | ⏳ 待啟動 | ④ |
| A02 | 提供單台 DGX 各機器 capacity 技術規格（入庫每小時可處理量、同時處理路數） | Steve Liu | TBD | ⏳ 待提供 | ④ |
| A03 | 估算以現有設備對 TVBS 現有資料量進行全量人臉特徵入庫所需時間 | Steve Liu（上海） | TBD | ⏳ 待執行 | ④ |
| A04 | OpenMAM 整合後 UX 設計：邀請 Sally 參與研究介面設計方案 | JH | TBD | ⏳ 待安排 | ④ |
| A05 | 確認 TVBS iNews SOT metadata 欄位結構與時間起始點，評估能否作為歷史影片語意索引快速通道 | 黃明智 \+ JH | TBD | ⏳ 待確認 | ④ |
| A06 | 研究名人庫別名自動化更新機制 | Steve Liu | TBD | ⏳ 待啟動 | ④ |
| A07 | 評估字幕校對 ground truth 用於 STT 模型持續訓練的可行性 | Steve Liu | TBD | ⏳ 待評估 | ④ |
| A08 | 情境 F（STT highlight 校稿）與情境 G（Smart Crop）持續開發，對準 Q3 2026 | Steve Liu / Alex | Q3 2026 | 🟡 進行中 | ④⑤ |
| A09 | 追蹤 DGX 模型選型，要求 Steve 明確回覆 | Alex | 近期 | 🟡 追蹤中 | ② |
| A10 | 確認 TVBS 音軌輸出格式，評估改為四軌方式存檔可行性 | Alex | TBD | 🟡 進行中 | ②⑤ |
| A11 | TVBS AI Sharing Draft 完成 | Alex | 4/2x | ⏳ 尚未開始 | ⑤ |
| A12 | 產品命名（對外）文件化 | Alex | 5/1x | ⏳ 尚未開始 | ⑤ |
| A13 | Olapedia / OlaMedia 獨立產品化具體做法文件化 | Alex | 近期 | 🟡 進行中 | ⑤ |
| A14 | 威栗雲至國際（台灣）站點更新 | 相關工程 | 近期 | 🟡 進行中 | ⑤ |
| A15 | AVID Media Composer 2024 vs Media Agent STT 定位差異釐清 | Alex / Dream | 近期 | ⏳ 待啟動 | ④ |
| A16 | 蒐集更多節目字幕前後對照 PDF 樣本 | Alex | 4/3x | 🟡 進行中 | ⑤ |
| A17 | 推動 Alex/Dream/Michael/Steve 四人群組作為主要溝通場域 | Michael / Alex | 持續 | 🟡 進行中 | ② |
| A18 | 確認模型訓練資料法務合規狀態（與法務並行） | Michael | 盡快 | 🟡 追蹤中 | 前期 |
| A19 | OpenMAM 3.0 月底說明（全組） | Dream | 4/30 前 | ⏳ 待執行 | 前期 |

### 創造栗相關

| \# | 任務 | 負責人 | 目標時間 | 狀態 | 來源 |
| :---- | :---- | :---- | :---- | :---- | :---- |
| B01 | 完成 6 個樂高案例搭建步驟圖（使用軟體製作） | Luffy | 本週 | 🟡 進行中 | ③ |
| B02 | 確認威栗識覺小車最新料號申請流程並依新流程推進 | Luffy | TBD | 🟡 進行中 | ③ |
| B03 | 產品端（Luffy）與 Kevin（Sales）就威栗識覺小車交期私下對齊，提出排期 | Luffy \+ Kevin | TBD | ⏳ 待執行 | ③ |
| B04 | 確認小栗方Pro NCC 認證申請進度與執行時程 | StevenCH | TBD | ⏳ 待確認 | ③ |
| B05 | 確認小栗方Pro UN 38.3 認證申請進度與執行時程 | StevenCH | TBD | ⏳ 待確認 | ③ |
| B06 | 製作繁/簡體亞克力外殼樣品，供台灣 Demo 使用 | Bruce | 盡快 | ⏳ 待執行 | 前期 |
| B07 | 供應商最終報價跟進（樂高套裝 6 案例 BOM 基礎上） | Carrie / Luffy | TBD | ⏳ 待回覆 | ③ |

### 教育部門相關

| \# | 任務 | 負責人 | 目標時間 | 狀態 | 來源 |
| :---- | :---- | :---- | :---- | :---- | :---- |
| C01 | Sean 發 email 給 StevenCH，列出積木塊驗收確認點清單 | Sean | 4/20（已確認） | ✅ 已執行 | ① |
| C02 | StevenCH 逐點確認 AI Kit 2 積木塊可用性，email 回覆 Sean | StevenCH | TBD | ⏳ 待回覆 | ① |
| C03 | Sean 向 Michael 提需求，請上海為台灣版威栗雲加入小栗方Pro 入口 | Sean | 本週（StevenCH 確認後） | ⏳ 待執行 | ① |
| C04 | 與 Michael 確認：① Scratch 積木介接上線 ② 教育大數據串接方向 | 黎博 | 近期（4/21 已討論） | 🟡 進行中 | ① |
| C05 | 請 RD 評估學習吧完成教育大數據介接之時程 | Sean | TBD | ⏳ 待啟動 | ① |
| C06 | 推進客語教育外包合約（back-to-back），發 mail 給法務 | StevenCH | 盡快 | 🟡 進行中 | ① |
| C07 | 水保署課程：影片製作持續跟進，確保 5 月底上線 | 雅婷 | 5/30 前 | 🟡 進行中 | ① |
| C08 | 彰化縣 4/25 活動執行：SEL APP 手機 Demo \+ 備用錄影 | 雅婷 / Ruru | 4/25 | ⏳ 準備中 | ① |
| C09 | 金門市場拓展：Eddy 拜訪教育局相關單位，推進年底 2 個專案 | Eddy Lin | 4/21 出發 → 年底 | 🟢 已出發 | ① |
| C10 | 5/3 桃園 SEL 親子活動最終準備（Rundown / 宣傳物料 / 贈禮） | Ruru / Tiffany | 5/3 | 🟡 進行中 | 前期 |
| C11 | 跟進水保局標案，確認是否可提前交付爭取 Q2 款項 | StevenCH | 近期 | 🟡 進行中 | 前期 |
| C12 | 4/12 智高客戶泰國訂單後續跟進 | StevenCH | ASAP | 🟡 進行中 | 前期 |

---

## 章節九：關鍵時間節點與總結

### 里程碑總覽

| 日期 | 里程碑 | 負責人 | 狀態 |
| :---- | :---- | :---- | :---- |
| 2026/04/21 | Eddy Lin 赴金門市場拓展啟程 | Eddy Lin | ✅ 已出發 |
| 2026/04/22 | **TVBS AI Demo 順利舉行**（7 情境 A–E，11,231 筆 Olapedia v1.0） | Alex | ✅ 完成 |
| 2026/04/25 | 彰化縣活動（12:30 聯訪賴副局長） | Ruru / 雅婷 | ⏳ 本週 |
| 2026/04/30 | OpenMAM 3.0 進度說明（全組） | Dream | ⏳ 待執行 |
| 2026/04/30 | 三年級積木課程 15 份翻譯完成 | Grace | 🟡 進行中 |
| 2026/05/03 | 桃園 SEL 親子活動（市長夫人出席） | 黎博 / Ruru | ⏳ 準備中 |
| 2026/05/中 | 威栗識覺小車 Kevin 期望到貨時間 | Luffy \+ Kevin | ⚠️ 需私下對齊排期 |
| 2026/05/底 | 水保署課程上線 | 雅婷 / Sophia | 🟡 進行中 |
| 2026/Q3 | 情境 F（STT 聽打）+ G（Smart Crop）正式發布 | Steve / Alex | 🔧 開發中 |
| 2026/Q2 底 | OpenMAM 2.0 上線測試 \+ TVBS 新聞部片庫自動標註 | Dream / Steve | ⚠️ 前提未就緒 |
| 2026/年底 | 金門 2 個專案目標（約 200-300 萬元） | Eddy Lin | 🟡 推進中 |

### 總結

本週以 4/22 AI Demo 的順利舉行為最重要里程碑，TVBS 與 CatchPlay 同場出席，VIA 正式向客戶完整展示了 Media Agent 的媒資智能化能力。Demo 的進行本身是成功的，但同時也清晰揭示了後續工程落地的挑戰：四大 OpenMAM 整合工程問題（API 規格未定義、2.x 版本前提不成立、歷史片庫規模未估算、向量庫架構未定）使 Q2 底里程碑的可行性存疑，需在本週啟動 API 規格對接會議。STT 模組的技術虛缺問題、DGX 模型不透明問題，以及 AVID 競合關係，則是需要 Alex 與 Steve Liu 在 Demo 熱度消退後認真面對的議題。

教育側的活動週——彰化 4/25、金門拓展出發——標誌著教育部門下半年市場攻勢的起點，金門的成功與否將是 Q3 業績補位的重要觀察點。

---

*本報告由 AI Meeting & Reporting Assistant 自動彙整，最終內容以與會人員確認為準。* *版本：v1.0 | 生成時間：2026/04/24*  
