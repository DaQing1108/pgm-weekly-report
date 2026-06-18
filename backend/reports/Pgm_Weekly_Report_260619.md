# VIA Technologies — Program Sync 週報

---

## 章節 0：報告封面

| 欄位 | 內容 |
| ---- | ---- |
| **報告週期** | 2026/06/15（週一）– 2026/06/19（週五） |
| **報告日期** | 2026/06/17（彙整日） |
| **彙整人** | Alex Liao（PgM） |
| **涵蓋團隊** | Media Agent / TV Solution / 創造栗 / LearnMode / 教育外拓 |

**來源文件清單：**

| # | 檔案名稱 | 性質 |
| --- | ------- | ---- |
| ① | `260615_Program_Progress_Follow.md` | Program Progress Follow 週例會（Alex × Michael） |
| ② | `260615_創造栗例會-小栗方-Pro.md` | 創造栗週例會（黎博主持） |
| ③ | `260615_教育部門-Sales-PM-RD-sync-up-mtg.md` | 教育部門 Sales × PM × RD 同步會（黎博主持） |
| ④ | `260617_Agentic-Meeting.md` | Agentic Platform 技術討論（Alex × Steve × Dream × JH × Tonny） |
| ⑤ | `YYMMDD_Program_Progress_Mtg.md` | [本週無此來源] |

---

## 章節 1：Executive Summary

W25 三條主軸都在為 7 月的密集交付期做最後確認。Agentic 線聚焦 6/24 內部 demo 的範圍收斂：OpenMAM 2.10 入庫正式拆為「打通 API 路徑」與「全量入庫」兩個 milestone，避免用同一個時間點承諾量級相差懸殊的兩件工作；名人庫（Olapedia）先走方案一爭取展示機會，月底升級 2.0 後再評估增刪流程；台標改採「入庫提示 + 實時辨識」，不再規劃全量預先標注。但同時暴露出一個被低估的結構性問題：AD 帳號與 token 交換疑似走明文，且 AD 掛掉曾導致系統全線癱瘓——方案一和方案三都存在這個問題，需要在本週五專題解決，否則 ISO 27001 稽核與跨客戶落地都會卡關。

教育線這週的核心命題不是進度，而是文化。黎博反覆指出，多數縣市拜訪完成後就停在等待，雲林、桃園、大陸 SEL 案三個場景都出現同樣的問題——有高層關係，但缺乏日常跟進的 ownership。創造栗產品線同時面對兩個難解的交付張力：小栗方 Pro IoT 數據目前無法串接創造栗平台，部分探空氣球課程「幾乎不能賣」；3000 批次生產因天線 Module 參數問題送回廠測試，6/30 交貨壓力不小。SEL 基本 demo 鎖定本週五（6/19），8 月底正式推出。V3 車合約進入法務流程，但 PRD 缺口與延遲罰則模糊是高優先級的補齊項目。

管理層需要追蹤三件事：資安弱掃 7/7 Hard Deadline 是教育線最近的剛性關卡，加分霸若掉出採購平台，缺口會比現在的 500–600 萬更大；6/24 demo 前需發出一頁「展示／不展示」清單，避免範圍模糊被解讀為進度不足；AI 文件的版本治理（v1 = 內部初稿、v3 = 團隊審閱、v5 = 可參考品質）尚未成為組織共識，AI 輸出的可信度仍是協作摩擦的根源。

---

## 章節 2：關鍵專案進度

### 2.1 OpenMAM 2.10 × Olapedia 名人庫　🟡 6/24 demo 範圍定案，入庫路徑兩個 milestone 分開

6/17 Agentic Meeting 確認：OpenMAM 2.10 入庫正式拆為兩個 milestone——Milestone 1 是靠 API 打通入庫路徑（測試階段，公司 lab 環境），Milestone 2 是後台全量入庫（搬到 T 台後，DGX 進場才展開）。兩個時間點差距懸殊，不能混為一談。

名人庫整合：6/24 先走方案一（透明名人庫，用 Olapedia API 讓 OpenMAM 入庫並支援名字／圖片查詢），名人庫月底升級至 2.0 後（新增條目化圖片並同步打標籤），再評估是否加入增刪 data path（目標 7/1 第二波 demo）。長期產品化走方案三（前端整合，UI 由 JH 刻，保持各 module 獨立），但 UI 歸屬與接口設計排程尚未排入。

Olapedia server 設置已完成，目前唯一卡點是網路連不上，上海 Jerry（IT）排查中——若 6/24 前無法連通，demo 範圍可能需要進一步縮減。

- **下一里程碑：** Olapedia 網路排通（儘快）；名人庫 2.0 升級（月底）；6/24 內部 demo（JH 入庫 + 人臉搜尋，Steve 新聞 STT）；7/1 視情況加入名人庫增刪

### 2.2 STT / ASR Pipeline　🟡 新聞線技術可行性已驗證，算力與 plug-in 待優化

edge 端 STT 模型已可滿足需求，不需線上，但目前算力仍偏高需再優化；plug-in 對接方式仍待處理。Michael 在會議中示範「三人 AI 群」新聞素材處理配方——成本極低（幾塊錢等級），路徑清晰。Steve 團隊的 demo 計劃在月底展示新聞 STT 生成與對接，範圍侷限新聞，後期處理目標尚未納入。

- **下一里程碑：** 新聞 STT 生成與對接展示（月底）；plug-in 對接方式確認

### 2.3 TVBS DGX 架構 × 歷史資料入庫　🔴 DGX 仍等 7 月底，入庫期待管理問題持續

入庫順序確認以新聞為主；DGX 4 台採購維持抓 7 月底到新莊。正式入庫須等 DGX 進場後才會展開，目前在 lab 環境做 API 打通路徑的測試。PM 與 RD 對期待的落差持續存在——RD 傾向上線後實測再外推，PM 需要能管理客戶預期的 scenario planning。

- **下一里程碑：** DGX 採購簽核追蹤（7 月底）；DGX 到新莊後立即排入庫 benchmark

### 2.4 台標辨識模組　🟡 方向收斂：改採入庫提示 + 實時辨識

6/17 會議確認不全量預先標注，改採兩個情境：(1) 入庫當下做提示讓用戶 take down；(2) 用戶調回影片時再 double 確認。台標不必重掃 5 年舊庫，重要性低於人臉，排至 OpenMAM 2.10 結束後（約 2.12 或 2.13 版本）。但技術方向最終須與 T 台訴求正式對齊，否則交付期仍可能被要求全量標注。

- **下一里程碑：** 與 T 台確認台標使用情境與範圍（待排）；2.12／2.13 版本規劃

### 2.5 OpenEdit Plus × OpenShare 2.0 改版　🟡 先做一致化設計，再做 OpenShare 2.0

從 6/15 Program Progress Follow 與 6/17 Agentic Meeting 兩份文件均顯示：OpenEdit 的定位仍存在組織內認知落差——Steve 誤以為 OpenEdit 是 OpenMAM 的附加功能而非獨立應用，Dream 花了一個上午進行認知校正。這個認知錯誤會影響後續 API 設計與市場策略。

改版方向：先請 Sally 做 OpenEdit Plus 的一致化「拉皮」設計（功能不動、風格靠近 OpenMAM 3.0），再做 OpenShare 2.0（整合節目部需求，新聞部短期不改）。

- **下一里程碑：** OpenEdit 定位文件閱讀確認機制建立；Sally 一致化設計啟動（待排）

### 2.6 V3 智能車合約　🟡 進入法務流程，PRD 缺口與延遲罰則須在法務完成前補齊

北里已回覆技術預研項目，6/16 逐條檢視後若無重大問題，合約進入簽署流程。但有兩個高優先缺口：PRD 尚未納入合約正文或附件，以及原合約「延遲 100 天」條款沒有明確的後續處理機制（應改為按天計算的 Delay Penalty）。車體合作（V3 車體與華藝的討論）本週或下週啟動。

- **下一里程碑：** PRD 納入合約附件；延遲罰則明確化；V3 車體合作討論啟動

### 2.7 創造栗 5 項產品 × 探尋科技前線　🟡 前 3 項月底完成，整體 9 月底

前 3 項（探空氣球、氣象雷達、無線電通訊）月底完成；後 2 項（地熱、無線電天文）手作太複雜，暫不納入營隊版本；整體 deadline 9 月底。小栗方 Pro IoT 數據無法串接創造栗平台是商業關鍵路徑上的技術阻塞——Sean 本週確認威力雲／AIoT 串接可行性。創造栗包裝改為一專案一獨立包裝（Janet 重新設計）；台灣定價與 BD plan（StevenCH 負責）。

- **下一里程碑：** Sean 確認 IoT 串接可行性（本週）；前 3 項產品月底完成；台灣定價 BD plan（待確認）

### 2.8 SEL 互動人物　🟡 基本 demo 本週五，8 月底推出

Sean 已把 GE agent 記憶模組做出來但尚未驗證；目標是讓互動人物不只對話，還能依指令動作（蹲、跳舞等），並建立學生／家長／老師三方互動窗口與記憶（VAD 情緒辨識用於識別高風險情緒）。模組已寫好，只待 push 到 railway 伺服器啟動。

- **下一里程碑：** 本週五（6/19）基本 demo 完成，各給 Ruru、Kevin 一份；8 月底正式推出

### 2.9 小栗方 Pro × 3000 批次生產　🟡 天線測試中，6/30 交貨壓力

天線 Module 因型號相同但內部參數不同，需送回天線廠與原始測試結果比對。若測試一致，即可推進 ESP32 板生產，目標 6/30 交貨。來料管控機制已提醒供應商，大貨階段需控管。樂高套裝各項同步生產，每兩天追蹤一次，目標月底完成。

- **下一里程碑：** 天線測試報告（6/15–6/16）；ESP32 板生產推進；小栗方 Pro 6/30 交貨

### 2.10 資安弱掃 × 教育部採購平台　🔴 7/7 Hard Deadline，IT 外掃並行

教育部採購平台續期需通過資安弱掃，標準為 2025 年 OWASP Top Ten。內部掃描（加分霸、創造力、學習吧）持續進行；外部廠商弱掃比價（三家）推進中；弱掃完成後由 RD 修補，自寫程式優先。落地報告下週啟動，約 3 天。Sean 協調 Alex / RD。

- **下一里程碑：** 外部弱掃廠商確認（儘快）；落地報告下週啟動；7/7 所有系統通過

---

## 章節 3：子組進度

### 3.1 Media Agent

W25 的技術同步完成了幾個重要的方向收斂。入庫路徑拆為兩個 milestone 避免了時間點混淆；台標改為實時辨識方向節省了大量資源預先投入；媒體案 ISO 27001 治理機制（VSTS + auditing）正式確立。但 Olapedia 網路連通問題、AD / token 資安問題、以及 6/24 demo 範圍的預期對齊，是本週三件仍待解的卡點。

API 整合架構方面，從 6/15 Program Progress Follow 得知：Steve 團隊傾向自建平行 API 而非整合進 JH 主流程，這會造成維護成本倍增與客戶端混亂，需 Alex 協調 Steve 與 JH 對齊。Oralpedia 資料回填到 OpenMAM 的數據流設計目前缺乏明確 spec，需 PM 或 PgM 啟動。

### 3.2 TV Solution

TVBS DGX 入庫期待管理仍是最大問題。DGX 到位前，客戶何時能搜歷史影片仍無確定答案。台標方向已在 6/17 技術會議中收斂，但需要與 T 台的正式確認才能鎖定。T 台維運文件目前沒有時程承諾——從客戶關係管理角度，即使是 6–9 個月後的 milestone 也好過完全沒有錨點。

### 3.3 創造栗

本週兩個會議（創造栗例會 + 教育部門 sync）共同暴露的問題：今年唯一核心目標是 Break Even，但學校專案毛利僅約 30%（尚未含人力與間接成本），且小栗方 Pro 的數據串接問題直接卡住了部分課程的銷售可行性。北京展廳硬裝點位已定，時程偏緊，Stevens 6/16 到北京 Review。V3 車合約進入法務，但 PRD 和延遲罰則條款必須在法務完成前補齊。

7 月初整理未來 6 個月 AI、Agent、Skill Roadmap（Stevens Lee 確認），台灣與大陸 SEL 框架需要先互通，SEL 大方向一致但 Approach 可能不同。

### 3.4 LearnMode / 學習吧

本週無新更新。

### 3.5 教育外拓

政府客戶開發本週最大的結構性問題是 ownership 文化，不是拜訪數量。黎博明確指出三個場景：雲林（與局長關係深厚但日常無人接管）、桃園（客語切入 + 少年警察隊百萬案，張市長已同意預算但後續跟進不足）、大陸 SEL（上海領港區主動表達合作意願，需 demo site）。金門 proposal 近乎確定，子儀跟進中。SEL demo 交付給桃園 / 上海的時程，取決於本週五的基本 demo 能否達標。

---

## 章節 4：跨部門協作與客戶互動

**TVBS 協作進展表**

| 議題 | 狀態 | 下一步 |
| ---- | ---- | ------ |
| OpenMAM 2.10 API 測試（6/16 已啟動） | 🔄 進行中 | 6/24 內部 demo（JH 入庫 + 人臉搜尋） |
| DGX 4 台採購 × 入庫排程 | 🔄 進行中 | 採購簽核追蹤；7 月底到新莊後立即 benchmark |
| Olapedia 網路連通 | ⚠️ 受阻 | 上海 Jerry（IT）排查中 |
| 台標處理方式 | 🔄 進行中 | 需與 T 台正式對齊「入庫提示 + 實時辨識」方向 |
| T 台維運文件時程承諾 | ⚠️ 受阻 | 需給客戶 milestone，即使是 6–9 個月後也好過無承諾 |
| 資料訓練 configuration 提供 | ⏳ 待執行 | Steve 提供本季訓練模型 config 給 TVBS |
| AI media agent 移至 VSTS | ⏳ 待確認 | 配合 ISO 27001；Steve / JH 負責 |

**教育局 / 縣市政府互動表**

| 對象 | 狀態 | 下一步 |
| ---- | ---- | ------ |
| 金門（金大 + 文化局） | 🔄 近乎確定 | 子儀追進度；紫一回來後確認 proposal |
| 桃園（客語 + 婦幼 + 少年警察隊） | 🔄 進行中 | 少年警察隊百萬案確認跟進窗口；SEL demo 交付 |
| 雲林未來教室 | ⚠️ 等待接管 | 確認「語音科」對接窗口；主動推進 AI 人才方舟計畫連結 |
| 上海領港區（大陸 SEL） | 🔄 初步接觸 | 先分享 SEL 框架；Kevin 在上海協助；需定 demo site |
| 屏東 6/29 | ⏳ 待確認 | 行程確認 |
| 宜蘭 7 月中後 | ⏳ 待排 | 處長受訓後安排 |

---

## 章節 5：重大決策與戰略討論

**決策一：OpenMAM 2.10 入庫拆為兩個 milestone（6/17）**

入庫工作正式拆分：Milestone 1 為 API 打通路徑（lab 環境，6/24 可展示），Milestone 2 為後台全量入庫（T 台環境，DGX 進場後才展開）。避免用同一個時間點承諾量級完全不同的兩件工作，也讓 PM 能對客戶做更精準的期待管理。

**決策二：名人庫短期走方案一，長期走方案三（6/17）**

6/24 demo 先用方案一（透明名人庫，入庫 + 名字／圖片查詢，不含增刪），月底 Olapedia 升級 2.0 後再評估加入增刪 data path（7/1）。長期產品化確認走方案三（前端整合），UI 由 JH 刻，各 module 保持獨立，但 to-do 拆解與設計排程尚未啟動。

**決策三：台標改採「入庫提示 + 實時辨識」（6/17）**

放棄全量預先標注的方向，改為兩個情境：(1) 入庫當下警告用戶 take down，(2) 用戶調回影片時 double 確認。此決策節省大量前期資源投入，排至 OpenMAM 2.10 結束後（約 2.12／2.13 版本），但最終取決於與 T 台的正式確認。

**決策四：媒體案走 ISO 27001，AI media agent 移至 VSTS（6/17）**

7 月起大量資料訓練需要稽核軌跡，媒體案正式確認走 ISO 27001 process。AI media agent 移至 VSTS 支援 auditing 與 continuous keep，Steve / JH 負責配置，模型 configuration 需提供給 TVBS。

**決策五：創造栗包裝改為一專案一獨立包裝（6/15）**

由原本一箱 5 個一組改為一個專案一個獨立包裝，Janet 重新設計。目的是利於逐項採收銷售，加速暑假窗口的變現速度。需先向中國端取得木板檔案。

**決策六：5 項產品時程定案，後 2 項暫不做營隊版（6/15）**

前 3 項（探空氣球、氣象雷達、無線電通訊）月底完成，後 2 項（地熱、無線電天文）手作複雜度過高，暫不納入暑假營隊版本，整體 deadline 9 月底。

**決策七：SEL 基本 demo 本週五，8 月底推出（6/15）**

Sean 的記憶模組已寫好，本週五（6/19）交付基本 demo 給 Ruru 與 Kevin，push 到 railway 伺服器啟動。正式推出目標 8 月底，後續 SEL 開發由 Alex / Michael 接手（Chart 回來後 Sean 的 TVBS 時間 remove）。

**決策八：AI 文件版本治理框架（6/15）**

Michael 提出並確認版本治理規則：v1 = AI 初稿，僅供自己內部使用；v3 = 人工審閱修改後，可供團隊審閱；v5 = 多輪驗證後，可作為參考依據。目的是讓版本號成為組織內 AI 文件可信度的共識語言，目前尚未成為組織共識。

**決策九：V3 車合約 PRD 必須納入，延遲罰則必須明確（6/15）**

Stevens Lee 指出原始合約的「延遲 100 天」條款沒有明確後續機制，要求法務流程完成前補齊 PRD 附件與按天計算的 Delay Penalty。2026 年公司核心目標是 Break Even，合約結構不能讓交付風險無法追究。

**決策十：年度核心目標 Break Even——學校專案毛利必須支撐（6/15）**

Stevens Lee 明確：所有案子都要服務 Break Even 目標。學校專案毛利初估約 30%（未含人力），尚不確定是否值得承接。兩條路：提高毛利率，或擴大案量。團隊必須在提案前清楚說服，而非事後用「這個少賺、那個多賺」解釋。

---

## 章節 6：下週重點計劃（W26，2026/06/22–06/26）

| 優先級 | 事項 | 負責人 | 截止 |
| ------ | ---- | ------ | ---- |
| P0 | 6/24 OpenMAM 2.10 + Olapedia 內部 demo（入庫 + 人臉搜尋） | JH / Dream | 06/24 |
| P0 | 6/24 demo 前發出「展示／不展示」清單同步各方預期 | Alex | 06/23 |
| P0 | Olapedia 網路連通排查（確保 6/24 可串接） | Jerry（IT）/ Tonny | 儘快 |
| P0 | AD / token 權限專題討論（本週五 6/19 已召開後）結論落地 | Alex | 06/19 |
| P0 | 教育部弱掃 7/7 deadline — 外部廠商比價確認 | 採購 / IT | 儘快 |
| P0 | V3 車合約 PRD 納入附件 + 延遲罰則條款補齊 | Eva / 法務 | 法務流程中 |
| P1 | 小栗方 Pro 6/30 交貨追蹤（天線測試→ESP32 板生產） | Luffy | 06/30 |
| P1 | SEL 基本 demo 確認交付（本週五已交付後）追蹤 demo 效果 | Sean / Ruru | 06/19 後 |
| P1 | 名人庫升級至 2.0 | Steve 團隊 | 月底 |
| P1 | OpenMAM Face API 整合（carry-over） | Steve Liu 團隊 | 06/30 |
| P1 | Text-Based AI Video Editor（carry-over） | Alex | 06/27 |
| P1 | Q2 MBO 內容完成 | 各負責人 | 06/26 |
| P1 | 暑假營隊 package 初版設計 + pricing（carry-over，已延遲） | Sophia / Steven / Ruru | 儘快 |
| P2 | 新聞 STT 生成與對接展示 | Steve 團隊 | 月底 |
| P2 | Sean 確認威力雲／AIoT 數據串接可行性並回報 | Sean | 本週 |
| P2 | 政府客戶 follow-up owner 追蹤表建立 | Alex / PgM | 待確認 |
| P2 | 未來 6 個月 AI / Agent / Skill Roadmap 整理 | Stevens Lee + 台灣團隊 | 7 月初 |
| P2 | T 台維運文件時程承諾（給 milestone，即使是 6–9 個月後） | Alex / RD | 本週 |

---

## 章節 7：風險與問題追蹤

| Risk ID | 風險描述 | 等級 | 影響範圍 | 緩解行動 |
| ------- | -------- | ---- | -------- | -------- |
| R-01 | 教育部採購平台資安弱掃 7/7 deadline，加分霸若未過可能被踢出採購平台 | 🔴 | 加分霸 / 教育線 H2 營收 | 外部三家比價盡快確認；IT 內部掃描持續；落地報告下週啟動 |
| R-02 | 教育線下半年 forecast 缺口約 500–600 萬，多個項目可能掉出 | 🔴 | 全教育線 H2 目標 | 暑假營隊 package、金門、縣市標案主動推進；Break Even 目標每個案子都要服務 |
| R-03 | TVBS 入庫期待管理：DGX 到位前客戶何時能搜歷史影片仍無答案 | 🔴 | TVBS 客戶關係 / 入庫排程 | 7 月底 DGX 到後立即排 benchmark；現階段對齊等待期期待 |
| R-04 | 小栗方 Pro IoT 數據無法串接創造栗平台，部分課程「幾乎不能賣」 | 🔴 | 創造栗 / 教育線暑假銷售 | Sean 本週確認威力雲 / AIoT 串接可行性；若不能串接，受影響課程是否暫緩上市需決策 |
| R-05 | AD / token 明文資安風險：疑似 plain text 交換，AD 掛掉曾致全系統癱瘓 | 🔴 | Media Agent / ISO 27001 / 產品落地 | 本週五專題討論；先開測試 AD 帳號；token 交換機制需重新設計 |
| R-06 | 小栗方 Pro 3000 批次天線 Module 參數問題，6/30 交貨壓力 | 🟡 | 創造栗交貨 / 教育線設備 | 天線測試報告一出即決策；建立量產來料檢查機制 |
| R-07 | OpenEdit 定位混亂：Steve 誤以為是附加功能而非獨立應用 | 🟡 | Open Editor / Media Agent API 設計 | 建立文件閱讀確認機制；Steve 必須補讀完整 spec |
| R-08 | 名人庫長期整合方案三（前端整合）尚未啟動排程，短期捷徑恐變技術債 | 🟡 | Olapedia / OpenMAM 產品化 | 7/1 後立即啟動方案三 to-do 拆解；UI 歸屬與接口設計需排入 JH 排程 |
| R-09 | Olapedia 網路未連通，可能影響 6/24 demo | 🟡 | 6/24 demo / TVBS 期待管理 | 上海 Jerry（IT）優先排查；demo 前確認可連通 |
| R-10 | 6/24 demo 範圍期待落差：Steve 界定僅新聞，業務端期待「整個串起來」 | 🟡 | 6/24 demo 解讀 / 客戶信任 | 6/23 前發出展示 / 不展示清單並同步各方 |
| R-11 | V3 車合約 PRD 缺口與「延遲 100 天」條款模糊 | 🟡 | V3 合約 / 交付責任 | PRD 納入合約附件；延遲罰則改為按天計算；法務流程前補齊 |
| R-12 | 政府客戶 ownership 文化缺口：拜訪後無人主動接管 | 🟡 | 教育外拓 / 縣市案件變現 | 為每個客戶指定單一 owner 與 escalation 窗口；建立 follow-up 追蹤表 |
| R-13 | 台標辨識方向已收斂，但尚未與 T 台正式對齊確認 | 🟡 | 台標交付範圍 / TVBS 需求 | 盡早與 T 台確認台標使用情境，避免交付期被要求全量標注 |
| R-14 | STT 談話性節目語料 benchmark 仍缺，商用能力待驗證（carry-over W24） | 🟡 | STT 商用 / TVBS 說服力 | 差異化轉向編輯 UX；健康 2.0 案例持續累積；黃仁勳影片 PK |
| R-15 | Steve 與 JH 傾向建平行 API 而非整合主流程，維護成本倍增風險 | 🟡 | Media Agent API 架構 / 長期可維護性 | Alex 協調 Steve 與 JH 對齊架構決策；確認由 Steve 支援 JH 主流程 |

---

## 章節 8：行動方案追蹤

### Media Agent 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| Olapedia 網路連通問題排查 | Jerry（IT，上海）/ Tonny | 儘快 | 進行中 |
| 名人庫升級至 2.0 | Steve 團隊 | 月底 | 待執行 |
| OpenMAM 2.10 內部 demo（入庫 + 人臉搜尋）準備 | JH 團隊 | 06/24 | 進行中 |
| 6/24 demo 展示／不展示清單發出 | Alex | 06/23 前 | 待執行 |
| 新聞 STT 生成與對接展示 | Steve 團隊 | 月底 | 待執行 |
| 提供本季資料訓練模型 configuration 給 TVBS | Steve 團隊 | 待確認 | 待執行 |
| AI media agent 移至 VSTS（auditing / ISO 27001） | Steve / JH | 待確認 | 待執行 |
| 開測試 AD 帳號給對接方 Joe | IT | 儘快 | 待執行 |
| AD / token 權限專題討論（本週五召開） | Alex（召集） | 06/19 | 進行中 |
| Steve 與 JH API 整合架構決策對齊 | Alex | 本週 | 待執行 |
| Oralpedia backfill 到 OpenMAM 的數據流 spec 啟動 | PM / Alex | 待確認 | 待執行 |
| OpenEdit Plus 一致化設計（Sally 拉皮，靠近 OpenMAM 3.0） | Alex / Sally | 待確認 | 待執行 |
| OpenEdit 定位文件閱讀確認機制（Steve 補讀） | Alex / Dream | 本週 | 待執行 |
| 名人庫方案三 to-do 拆解與設計排程（7/1 後啟動） | Alex / JH | 7/1 後 | 待排 |
| 台標方向與 T 台正式對齊確認 | Alex | 待排 | 待執行 |
| STT Pipeline 持續優化（ASR / LM / RAG / AI 辭典 / 二選一） | Steve 團隊 | 持續 | 進行中 |
| DGX 4 台採購簽核追蹤（目標 7 月底到新莊） | Alex / Michael | 7 月底前 | 進行中 |
| OpenMAM Face API 整合（carry-over） | Steve Liu 團隊 | 06/30 | 進行中 |
| Text-Based AI Video Editor（carry-over） | Alex | 06/27 | 進行中 |
| AI 辭典與個人化偏好規格文件（carry-over） | Tonny | 待確認 | 待執行 |
| AI Lab 目的 / 邊界 / 停止條件文件（carry-over） | Alex | 待確認 | 待執行 |
| Whisper App v1.5 啟動（Web → App 遷移，<3 工作天） | [待確認] | 本週 | 待執行 |

### TV Solution 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| DGX 入庫後建立 benchmark 實測排程 | Dream / Steve / Alex | 7 月底後 | 待排 |
| T 台維運文件時程承諾（給 milestone，即使 6–9 個月） | Alex / RD | 本週 | 待執行 |
| 台標方向與 T 台正式確認（入庫提示 + 實時辨識） | Alex | 待排 | 待執行 |
| 資料訓練 configuration 提供（TVBS 了解訓練作業） | Steve 團隊 | 待確認 | 待執行 |

### 創造栗 × 教育線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| 天線測試報告取得並與原始結果比對 | Luffy / 供應商 | 已逾期，儘快 | 進行中 |
| ESP32 板推進生產（待天線測試結果） | Luffy / 華益 | 儘快 | 待執行 |
| 小栗方 Pro 6/30 交貨追蹤 | Luffy | 06/30 | 進行中 |
| 樂高套裝工廠進度追蹤（每 2 天） | Luffy | 月底 | 進行中 |
| V3 車技術預研項目逐條檢視（6/16 已進行） | Eva / Robert / 北里 | 06/16 已進行 | 追蹤中 |
| V3 車合約 PRD 納入附件 + 延遲罰則明確化 | Eva / 法務 | 法務流程中 | 進行中 |
| V3 車體合作與合約討論（華藝） | Eva / 華藝 | 本週最晚下週 | 待執行 |
| V3 供貨年限確認（3–5 年）（carry-over） | Robert | 儘快 | 待執行 |
| SEL 基本 demo 完成並交付（Ruru + Kevin 各一份） | Sean | 06/19 | 進行中 |
| 確認威力雲 / AIoT 數據串接可行性 | Sean | 本週 | 待執行 |
| 弱掃與落地報告協調（OWASP Top Ten；自寫程式優先） | Sean + Alex / RD | 下週啟動 | 待執行 |
| IT 外部弱掃三家廠商比價確認 | 採購 / IT | 儘快 | 進行中 |
| IT 內部弱掃（加分霸、創造力、學習吧） | IT | 持續 | 進行中 |
| 創造栗 5 項產品前 3 項（探空氣球、氣象雷達、無線電通訊） | Grace / Sophia | 月底 | 進行中 |
| 創造栗包裝重新設計（一專案一包裝） | Janet | 待確認 | 待執行 |
| 台灣定價與 BD plan（含 to-C 通路） | StevenCH | 待確認 | 待執行 |
| 說明書繁體用語確認 | Sophia | 待確認 | 待執行 |
| 金門 proposal 追進度（紫一回來後） | 子儀 | 儘快 | 進行中 |
| 設備贈送 schedule（8 單位，搭配凱威同購） | 小月 | 下週 | 待執行 |
| Promotion 短影片與 quick start guide | 待確認 | 7 月內 | 待執行 |
| 觸點漫畫第二版 | Grace | 下週 | 待執行 |
| 展示空間 consolidated road map（連結 AI / SEL / 認證） | StevenCH + 大陸端 | 待確認 | 待執行 |
| 政府客戶 follow-up owner 追蹤表建立 | Alex / PgM | 待確認 | 待執行 |
| 北京展廳硬裝 Review + 軟裝準備（Stevens 已 6/16 到北京） | Eva | 持續 | 進行中 |
| SEL 框架資料分享給大陸端（供大陸 6/16 簡報參考） | Ruru / 台灣團隊 | 已進行 | 追蹤中 |
| 庫存統計表開放查看（Sunny / Carrie） | Sunny / Carrie | 後續 | 待執行 |
| 未來 6 個月 AI / Agent / Skill Roadmap 整理 | Stevens Lee + 台灣團隊 | 7 月初 | 待執行 |
| 暑假營隊 package 初版設計（carry-over） | Sophia / Steven / Grace / Ruru | 儘快 | 進行中 |
| 暑假營隊 package pricing（carry-over） | Steven / Sophia / Ruru | 儘快 | 進行中 |
| 官網 HTML prototype Michael review（carry-over） | Janet / Ruru | 進行中 | 進行中 |
| Q2 MBO 內容完成 | 各負責人 | 06/26 | 進行中 |
| Aurora RI 續約費 NT$98,000 預算規劃 | Alex / PM / 財務 | 08/01 前 | 待執行 |
| AI 認證 MVP 開發 | Alger Wang | 2026/07/18 | 進行中 |

---

## 章節 9：關鍵時間節點與總結

**里程碑總表（W25 起往後六週）：**

| 日期 | 事項 |
| ---- | ---- |
| 06/19（本週五） | SEL 基本 demo 完成；AD / token 權限專題討論 |
| 06/24（下週三） | OpenMAM 2.10 + Olapedia 內部 demo（入庫 + 人臉搜尋；Steve 新聞 STT） |
| 06/26 | Q2 MBO 內容完成 |
| 06/27 | Text-Based AI Video Editor 截止 |
| 06/30 | 小栗方 Pro 目標交貨；OpenMAM Face API 整合完成；樂高套裝月底交貨 |
| 07/01 | 名人庫 2.0 升級後，第二波 demo（加入增刪 data path） |
| 07/07 | **資安弱掃 Hard Deadline — 加分霸 / 創造力 / 學習吧** |
| 07/18 | AI 認證 MVP 展示（Alger Wang） |
| 07/月底 | DGX 4 台到新莊，入庫能力正式放量 |
| 08/31 | Aurora RI 合約到期（須提前確認續約） |
| 08/底 | SEL 正式推出 |
| 09/底 | V3 智能車 demo；創造栗 5 項產品全部完成 |
| 2027/03 | V3 智能車到貨 |

W25 是確認期。Agentic 線的幾個主要技術方向在本週完成了基本的收斂：入庫路徑兩個 milestone、名人庫方案路徑、台標實時辨識方向——這些都已從口頭討論化成了清楚的執行範圍。但每一個方向背後都還有一個尚未鎖定的部分：名人庫方案三的設計排程、台標與 T 台的正式確認、AD / token 的憑證交換機制。這些若在 6/24 之前沒有解決，不只是 demo 當天的問題，而是後面標案報驗和客戶交付的前置卡點。教育線的重心是兩個截止日：本週五 SEL demo 能否達標，決定了 8 月推出的節奏；7/7 弱掃能否通過，決定了加分霸在教育部採購平台的下半年命運。這兩件事不能延。創造栗線天線測試結果是否出來、V3 合約條款能否在法務前補齊，是下週最需要盯緊的兩個硬指標。

---

## Appendix: Dashboard Export
> 本區塊由 import-draft.py 解析，供匯入 Railway Dashboard 使用。請勿手動修改欄位名稱。

### 專案進度

| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| -------- | ---- | ------ | -------- | ---- |
| OpenMAM 2.10 × Olapedia 名人庫整合 | at-risk | [keep] | 入庫拆兩個 milestone；名人庫先走方案一；6/24 demo；Olapedia 網路未連通 | 方案三設計排程待啟動 |
| STT / ASR Pipeline | on-track | [keep] | 新聞 STT 技術可行性驗證；月底 demo；plug-in 對接待處理 | edge 端模型算力仍偏高需優化 |
| TVBS DGX 架構 × 歷史資料入庫 | behind | [keep] | 入庫路徑打通中；DGX 仍等 7 月底；台標改採實時辨識方向 | 台標須與 T 台正式對齊 |
| Open Editor × OpenShare 改版 | at-risk | [keep] | Steve 定位誤解已發現；先做 OpenEdit Plus 一致化設計再做 OpenShare 2.0 | 需建立文件閱讀確認機制 |
| V3 智能車合約 | at-risk | [keep] | 進入法務流程；PRD 缺口與延遲罰則條款需補齊 | 車體合作本週或下週啟動 |
| 創造栗 5 項產品 × 探尋科技前線 | at-risk | [keep] | 前 3 項月底；IoT 串接缺口影響銷售可行性；包裝改設計 | 後 2 項暫不做營隊版 |
| SEL 互動人物 | on-track | [keep] | 記憶模組已寫好；6/19 基本 demo；8 月底推出 | 本週五 push 到 railway |
| 小栗方 Pro × 3000 批次生產 | at-risk | [keep] | 天線測試中；6/30 交貨壓力；樂高套裝進行中 | 測試結果一出即決策 |
| 資安弱掃 × 教育部採購平台 | behind | [keep] | 7/7 Hard Deadline；外部比價進行中；落地報告下週啟動 | 加分霸優先 |
| 教育線 H2 forecast × 暑假營隊 | behind | [keep] | 金門近乎穩；package pricing 仍待推進；500–600 萬缺口持續 | Break Even 唯一目標 |

### Action Items

| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | -------- | ------ | -------- | ---- | ---- |
| 1 | Olapedia 網路連通排查 | Jerry（IT）/ Tonny | 儘快 | in-progress | technical |
| 2 | 6/24 demo 展示／不展示清單發出 | Alex | 2026/06/23 | pending | business |
| 3 | OpenMAM 2.10 內部 demo（入庫 + 人臉搜尋） | JH 團隊 | 2026/06/24 | in-progress | technical |
| 4 | AD / token 權限專題討論（本週五） | Alex（召集） | 2026/06/19 | in-progress | technical |
| 5 | 名人庫升級至 2.0 | Steve 團隊 | 月底 | pending | technical |
| 6 | 新聞 STT 生成與對接展示 | Steve 團隊 | 月底 | pending | technical |
| 7 | 提供本季資料訓練模型 config 給 TVBS | Steve 團隊 | 待確認 | pending | technical |
| 8 | AI media agent 移至 VSTS（ISO 27001） | Steve / JH | 待確認 | pending | technical |
| 9 | 開測試 AD 帳號給對接方 | IT | 儘快 | pending | technical |
| 10 | Steve 與 JH API 整合架構決策對齊 | Alex | 本週 | pending | technical |
| 11 | Oralpedia backfill 到 OpenMAM 的數據流 spec | PM / Alex | 待確認 | pending | technical |
| 12 | OpenEdit Plus 一致化設計（Sally 拉皮） | Alex / Sally | 待確認 | pending | technical |
| 13 | OpenEdit 定位文件閱讀確認（Steve 補讀） | Alex / Dream | 本週 | pending | business |
| 14 | 台標方向與 T 台正式對齊確認 | Alex | 待排 | pending | business |
| 15 | STT Pipeline 持續優化 | Steve 團隊 | 持續 | in-progress | technical |
| 16 | DGX 4 台採購追蹤（7 月底到新莊） | Alex / Michael | 2026/07/31 | in-progress | technical |
| 17 | OpenMAM Face API 整合 | Steve Liu 團隊 | 2026/06/30 | in-progress | technical |
| 18 | Text-Based AI Video Editor | Alex | 2026/06/27 | in-progress | technical |
| 19 | AI 辭典與個人化偏好規格文件 | Tonny | 待確認 | pending | technical |
| 20 | AI Lab 目的 / 邊界 / 停止條件文件 | Alex | 待確認 | pending | technical |
| 21 | Whisper App v1.5（Web → App，<3 工作天） | [待確認] | 本週 | pending | technical |
| 22 | T 台維運文件時程承諾（給 milestone） | Alex / RD | 本週 | pending | business |
| 23 | DGX 入庫後 benchmark 排程建立 | Dream / Steve / Alex | 7 月底後 | pending | technical |
| 24 | 天線測試報告取得並比對 | Luffy / 供應商 | 儘快 | in-progress | technical |
| 25 | 小栗方 Pro 6/30 交貨追蹤 | Luffy | 2026/06/30 | in-progress | business |
| 26 | 樂高套裝工廠進度追蹤（每 2 天） | Luffy | 月底 | in-progress | business |
| 27 | V3 車合約 PRD 納入附件 + 延遲罰則明確化 | Eva / 法務 | 法務流程中 | in-progress | business |
| 28 | V3 車體合作討論（華藝） | Eva / 華藝 | 本週最晚下週 | pending | business |
| 29 | V3 供貨年限確認 | Robert | 儘快 | pending | business |
| 30 | SEL 基本 demo 完成（Ruru + Kevin 各一份） | Sean | 2026/06/19 | in-progress | technical |
| 31 | 確認威力雲 / AIoT 數據串接可行性 | Sean | 本週 | pending | technical |
| 32 | 弱掃與落地報告協調（OWASP Top Ten） | Sean + Alex / RD | 下週啟動 | pending | technical |
| 33 | 外部弱掃三家廠商比價確認 | 採購 / IT | 儘快 | in-progress | business |
| 34 | IT 內部弱掃（加分霸、創造力、學習吧） | IT | 持續 | in-progress | technical |
| 35 | 創造栗 5 項產品前 3 項（月底） | Grace / Sophia | 月底 | in-progress | business |
| 36 | 創造栗包裝重新設計（一專案一包裝） | Janet | 待確認 | pending | business |
| 37 | 台灣定價與 BD plan | StevenCH | 待確認 | pending | business |
| 38 | 金門 proposal 追進度 | 子儀 | 儘快 | in-progress | business |
| 39 | 設備贈送 schedule（8 單位，搭配凱威同購） | 小月 | 下週 | pending | business |
| 40 | Promotion 短影片與 quick start guide | 待確認 | 7 月內 | pending | business |
| 41 | 政府客戶 follow-up owner 追蹤表建立 | Alex / PgM | 待確認 | pending | business |
| 42 | 未來 6 個月 AI / Agent / Skill Roadmap | Stevens Lee + 台灣團隊 | 7 月初 | pending | business |
| 43 | 暑假營隊 package 初版設計 + pricing | Sophia / Steven / Ruru | 儘快 | in-progress | business |
| 44 | 官網 HTML prototype Michael review | Janet / Ruru | 進行中 | in-progress | business |
| 45 | Q2 MBO 內容完成 | 各負責人 | 2026/06/26 | in-progress | business |
| 46 | Aurora RI 續約費 NT$98,000 預算規劃 | Alex / PM / 財務 | 2026/08/01 | pending | resource |
| 47 | AI 認證 MVP 開發 | Alger Wang | 2026/07/18 | in-progress | technical |
| 48 | 北京展廳硬裝 Review 後續軟裝準備 | Eva | 持續 | in-progress | business |

### Risks

| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| ------- | -------- | ------ | ------ | -------- |
| R-01 | 教育部採購平台資安弱掃 7/7 deadline，加分霸可能被踢出 | high | IT / Sean / Alex | 外部三家比價盡快確認；IT 內部掃描；落地報告下週啟動 |
| R-02 | 教育線 H2 forecast 缺口約 500–600 萬 | high | 黎博 / 全教育線 | 暑假 package / 金門 / 縣市標案；每個案子服務 Break Even |
| R-03 | TVBS 入庫期待管理：DGX 到前客戶無法搜歷史片 | high | Steve / Alex | 7 月底 DGX 到後立即 benchmark；現階段對齊等待期期待 |
| R-04 | 小栗方 Pro IoT 數據無法串接創造栗平台，部分課程幾乎不能賣 | high | Sean / Alex | Sean 本週確認串接可行性；若不能，受影響課程是否暫緩需決策 |
| R-05 | AD / token 明文資安風險，AD 掛掉曾致全系統癱瘓 | high | Alex / IT / Steve | 本週五專題討論；先開測試帳號；token 交換機制重新設計 |
| R-06 | 小栗方 Pro 天線 Module 參數問題，6/30 交貨壓力 | medium | Luffy | 天線測試結果一出即決策；建立量產來料檢查機制 |
| R-07 | OpenEdit 定位混亂，Steve 誤以為是附加功能 | medium | Alex / Dream | 建立文件閱讀確認機制；Steve 補讀完整 spec |
| R-08 | 名人庫長期方案三設計排程未啟動，短期捷徑恐變技術債 | medium | Alex / JH / Steve | 7/1 後立即啟動 to-do 拆解；UI 歸屬與接口設計排入 JH 排程 |
| R-09 | Olapedia 網路未連通，可能影響 6/24 demo | medium | Jerry（IT）/ Tonny | 上海 Jerry 優先排查；demo 前確認可連通 |
| R-10 | 6/24 demo 範圍期待落差 | medium | Alex / JH / Steve | 6/23 前發出展示 / 不展示清單 |
| R-11 | V3 車合約 PRD 缺口與延遲罰則模糊 | medium | Eva / 法務 | PRD 納入合約；延遲罰則按天計算；法務流程前補齊 |
| R-12 | 政府客戶 ownership 缺口，拜訪後無人主動接管 | medium | Alex / Sales | 指定每個客戶單一 owner 與 escalation 窗口；建立追蹤表 |
| R-13 | 台標辨識方向未與 T 台正式對齊 | medium | Alex | 儘早確認 T 台台標使用情境，避免全量標注需求反彈 |
| R-14 | STT 談話性節目 benchmark 缺口（carry-over） | medium | Steve / Tonny | 差異化轉向編輯 UX；健康 2.0 案例累積 |
| R-15 | Steve 與 JH 各建平行 API，維護成本倍增 | medium | Alex | 架構決策對齊；由 Steve 支援 JH 主流程 |

### 里程碑

| 日期 | 里程碑事項 | 團隊 | 狀態 |
| ---- | ---------- | ---- | ---- |
| 2026/06/19 | SEL 基本 demo 完成；AD / token 權限專題討論 | 教育線 / Media Agent | upcoming |
| 2026/06/24 | OpenMAM 2.10 + Olapedia 內部 demo（入庫 + 人臉搜尋；Steve 新聞 STT） | Media Agent | upcoming |
| 2026/06/26 | Q2 MBO 內容完成 | 全團隊 | upcoming |
| 2026/06/27 | Text-Based AI Video Editor 截止 | Media Agent | upcoming |
| 2026/06/30 | 小栗方 Pro 目標交貨；OpenMAM Face API 整合完成；樂高套裝月底交貨 | 創造栗 / Media Agent | upcoming |
| 2026/07/01 | 名人庫 2.0 升級後第二波 demo（加入增刪 data path） | Media Agent | upcoming |
| 2026/07/07 | 資安弱掃 Hard Deadline — 加分霸 / 創造力 / 學習吧 | 教育線 / IT | upcoming |
| 2026/07/18 | AI 認證 MVP 展示（Alger Wang） | LearnMode | upcoming |
| 2026/07/31 | DGX 4 台到新莊，入庫能力正式放量 | Media Agent / TV Solution | upcoming |
| 2026/08/31 | Aurora RI 合約到期（須提前確認續約） | 全團隊 | upcoming |
| 2026/08/31 | SEL 正式推出 | 教育線 | upcoming |
| 2026/09/30 | V3 智能車 demo；創造栗 5 項產品全部完成 | 創造栗 | upcoming |
| 2027/03/31 | V3 智能車到貨 | 創造栗 | upcoming |

### 下週重點

| 優先級 | 任務 | 負責人 |
| ------ | ---- | ------ |
| P0 | 6/24 OpenMAM 2.10 + Olapedia 內部 demo | JH / Dream / Steve |
| P0 | 6/24 demo 展示清單發出 | Alex |
| P0 | Olapedia 網路連通（確保 6/24 可串接） | Jerry（IT）/ Tonny |
| P0 | AD / token 權限決策落地 | Alex / IT / Steve |
| P0 | 弱掃 7/7 deadline — 外部廠商確認 | 採購 / IT |
| P0 | V3 合約 PRD + 延遲罰則補齊 | Eva / 法務 |
| P1 | 小栗方 Pro 6/30 交貨追蹤 | Luffy |
| P1 | SEL 基本 demo 交付確認 | Sean / Ruru |
| P1 | 名人庫升級至 2.0 | Steve 團隊 |
| P1 | OpenMAM Face API 整合（6/30） | Steve Liu 團隊 |
| P1 | Text-Based AI Video Editor（6/27） | Alex |
| P1 | Q2 MBO 完成（6/26） | 各負責人 |
| P2 | 暑假營隊 package pricing 初版 | Steven / Sophia / Ruru |
| P2 | Sean 確認 IoT 串接可行性回報 | Sean |
| P2 | 政府客戶 follow-up 追蹤表建立 | Alex / PgM |
