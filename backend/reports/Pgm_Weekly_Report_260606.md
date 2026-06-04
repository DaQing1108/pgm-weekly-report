# VIA Technologies — Program Sync 週報

---

## 章節 0：報告封面

| 欄位 | 內容 |
| ---- | ---- |
| **報告週期** | 2026/06/01（週一）– 2026/06/05（週五） |
| **報告日期** | 2026/06/03（彙整日） |
| **彙整人** | Alex Liao（PgM） |
| **涵蓋團隊** | Media Agent / TV Solution / 創造栗 / LearnMode / 教育外拓 |

**來源文件清單：**

| # | 檔案名稱 | 性質 |
| --- | ------- | ---- |
| ① | `260601_Program_Progress_Follow.md` | Program Progress Follow 週例會（Alex × Michael） |
| ② | `260602_創造栗例會-小栗方-Pro.md` | 創造栗週例會（黎博主持，教育部門工程 ownership + AI 認證制度 + 課程同步） |
| ③ | `260603_教育部門-Sales-PM-RD-sync-up-mtg.md` | 教育部門 Sales × PM × RD 同步會（黎博主持，1h29m） |
| ④ | `260603_Agentic-Meeting.md` | Agentic Platform 技術討論會（Alex × Michael × Dream × Steve × JH × TC） |
| ⑤ | `260603_PM_Tasks_OpenTasks.md` | PgM 項目追蹤快照（2026/06/03 截圖） |
| ⑥ | `260603_RD-Project-Review-meeting.md` | RD 專案評審會議（加分吧 AWS 成本 + 暑假活動硬體評估） |
| ⑦ | `2026-06-02_AWS_流量衝擊分析.md` | 加分吧寒假競賽 AWS 流量衝擊分析（Claude 輸出，帳單根因分析） |
| ⑧ | `2026-06-02_AWS_暑假預算估算.md` | AWS 帳單分析與暑假活動預算估算（情境 A/B + Aurora RI 續約） |

---

## 章節 1：Executive Summary

本週 Media Agent 線最重要的進展，是 DGX 入庫效能估算方式的正式轉換。6/03 Agentic Meeting 中，Steve 把估算基準從 TB 容量改為「影片時長」，並給出可換算的數字：單台 DGX 24 小時連續運作，新聞類影片 1 萬小時約需 37 天、節目類約 20.3 天。這讓 TVBS 歷史片庫的入庫規劃第一次有了可排程的參數。4 台 DGX 的資源配置也在這次會議初步定案：3 台動態分配入庫、1 台 dedicated 給即時查詢 / 推理。同一場會議也把 6 月底 Demo 的範圍收斂為三項：OpenMAM 2.10 + Face / Olapedia、台標辨識、OpenNews STT。

6/01 Program Progress Follow 則揭露了幾個更深層的產品問題。OpenEdit 的定位卡在「OpenMAM 延伸」與「獨立 M-Product」之間，Steve 與 JH 對主導權的理解存在落差，若不先釐清，字幕 / STT / AI 剪輯相關推進都會在同一個邊界問題上卡住。DGX 入庫 benchmark 在上週三應該提出、但沒有提出，這也帶出一個專案紀律問題：無法交付時需要提前揭露，而不是等到下次例會。

教育線這週的討論從單點案子往上升了一個層次。6/03 教育部門 Sync 中，黎博明確要求教育產品不能再靠單點活動、單一標案推進，而要整合成可展示、可導流、可銷售、可複製的完整架構。官網要升級為「商務轉換架構」，並進入 GEO（生成式搜尋引擎優化）時代的內容策略。「大國重器」類課程必須改名、改背景，第一個可推廣專題 6 月底前要出來。FDE 工作模式今日由 Michael 正式發信推進 approval。教育部門 source code ownership 逐步轉移，也在這週透過 6/02 例會正式浮上台面。

下週的密集節點：6/05 AI 分享會（Alex）；6/10 開始是 Open Editor AI pipeline review 週（Steve + 全員）；MBO 6/15 啟動；6 月中 Olapedia server 部署完成 + 台北整合測試環境建立；6/24 Logo + OpenMAM Demo。管理層需要追蹤的三件事：DGX 4 台入庫時程是否有可接受的 TVBS 期待管理方案、Open Editor 產品邊界與 Steve / JH 分工何時 close、教育部門官網架構 + FDE approval 能否在 6 月中前落地。

---

## 章節 2：關鍵專案進度

### 2.1 OpenMAM 2.10 × 人臉識別整合　🟢 6 月底 Demo 範圍確認，Olapedia 部署就緒

6/03 Agentic Meeting 確認 6 月底 Demo 包含 OpenMAM 2.10 + Face / Olapedia。Olapedia Server 前置條件（TVBS 端設備）已準備好，本週五後由 Romeo 執行部署。

OpenMAM 2.10 的名人庫 / Face 短期先以**獨立網址 / 獨立 AP 方式**運作，不做 OpenMAM 內的連結，後續再整合回 OpenMAM UI，以求最快完成整合。Face 部分按照公視版本的 OpenMAM 介面（v1），不採用尚未定案的 v2。

6/01 Program Progress Follow 中確認 Face 部分目前問題不大，Olapedia 定位為後台管理人員使用的獨立系統接口，不是一般 end user 工具。NLP 第一階段只提供第一輪對話能力，基於 OpenMAM 2.10 v1 的 UI/UX 延伸，接近公視版本操作介面。

台標 / Logo 辨識收到 6 月底 Demo 確認。Steve 團隊需消化 5/29 MRD 後，決定用檢索或入庫標註方式做 prototype 展示。此功能需與 OpenMAM 版權鎖定 / 回調審核流程串接，Alex + Tonny 需閱讀 OpenMAM 3.0 版權流程章節確認串接方式。

- **下一里程碑：** Olapedia server 本週五部署；6/24 Logo + OpenMAM 整合 Demo；6 月底 Face API 對接完成；6 月中台北整合測試環境建立

### 2.2 Open Editor → AI editing subsystem　🟡 兩條線確認並行，分工問題等下週三 pipeline review

6/03 Agentic Meeting 確認 **Open Editor 與 OpenMAM 2.10 是兩條線，不混在同一條工作流討論**。Steve 已精讀 V2 文件兩遍，整體方向 OK，認為文件已涵蓋多數關鍵點，也已在文件中標注 minor issue。

Steve 建議，在談對接之前，應先把 clip / edit 流程中所有需要 AI 介入的節點列出來，他已有一張整體 pipeline 圖。**下週三（6/10）同一時間先過一次 pipeline**，若能提前分享文件，全員先研讀再討論。

6/01 Program Progress Follow 把 Open Editor 的深層問題點名清楚：Steve 可能不清楚 OpenMAM 內部架構；JH 可能不清楚 Media Agent AI 技術架構。雙方資訊不對稱，容易互相質疑。Face 整合因為有公視案例作為參考，問題相對可控；Open Editor 沒有一個被共同接受的參考產品，風險更高。若不先釐清主導權，後續字幕、STT、AI 剪輯等功能推進都會遇到同一個邊界問題。

- **下一里程碑：** Steve 整理 pipeline 圖（6/10 前）；全員研讀 V2 文件（6/10 前）；6/10 討論 AI 介入點與 pipeline；待 pipeline review 後安排與 JH / Jason 對接

### 2.3 TVBS DGX 架構 × 歷史資料入庫　🔴 入庫時程框架建立，但期待管理仍未完成

6/03 Agentic Meeting 帶來本週最重要的 benchmark 進展。Steve 把估算基準從 TB 容量轉為影片時長，給出可換算的數字：

| 類型 | 估算基準 | 單台 DGX 入庫時間 |
| ---- | -------- | ---------------- |
| 新聞類影片 | 10,000 小時 | 約 37 天 |
| 節目類影片 | 10,000 小時 | 約 20.3 天 |

真正瓶頸是 GPU 進行人臉向量化的速度，IO 讀取、遠端拉檔、解碼等都不是主要瓶頸。**Steve 需以 4 台 DGX 重新估算入庫時程**（3 台入庫 + 1 台查詢 / 推理模式）。

DGX 資源配置初步定案：1 台 dedicated 給即時查詢 / 推理，3 台動態分配給入庫任務，避免查詢與入庫互相干擾。入庫任務透過 API 提供業務優先順序，後台根據優先順序排隊，使用者不需要知道任務跑在哪台機器上。

6/01 Program Progress Follow 中提到，DGX benchmark 在上週三應該提出但沒有提出，這帶出一個專案紀律問題：若某件事無法交付，應在週間就先揭露原因（缺硬體 / 缺文件 / 缺軟體），而不是等到下次例會。

DGX 網路線材採購：兩台一組用 400G 高速線，**Michael 與 Dream 確認直接採購 400G 線材**。四台 DGX 不能視為單一 unified memory resource（兩組之間只有一般 switch 連接）。

DGX 部署位置、Olapedia server、OpenShare server、台北驗證環境**本週五下午統一在部署規劃會議中討論**。

- **下一里程碑：** Steve 以 4 台 DGX 重新估算入庫時程；本週五部署規劃會議；Romeo 部署 Olapedia server

### 2.4 OpenNews STT / 字幕工具　🟡 6 月底 Demo 列入，7 月 Demo 目標維持

6/03 Agentic Meeting 確認 OpenNews STT 列入 6 月底 Demo 範圍。6/01 Program Progress Follow 中也提到，目前其他 STT 相關工作屬於 unscheduled 狀態，初步 Demo 目標落在 **7 月**，現階段最大 blocking issue 仍是 DGX 入庫時間估算與歷史片庫掃描。

- **下一里程碑：** 6 月底 OpenNews STT Demo；Q3 / 9 月 STT + 字幕小工具 demo

### 2.5 創造栗 × 教育部門 Source Code Ownership 轉移　🟡 高層達成共識，transition plan 待規劃

6/02 創造栗例會中，黎博說明已與董事長、Dream、Michael 達成共識：教育部門未來將逐步把相關 source code ownership 轉移到自己手上。雖然不一定正式稱為 engineering team，但方向是讓教育部門具備更完整的技術掌握權與維護能力。

這個方向代表教育部門未來不只是需求或課程單位，而會開始承擔部分產品與技術責任。短期內仍有不少工作需要 RD 支援，需明確列出支援清單與溝通節奏。**具體 transition plan 尚未形成，需後續規劃。**

- **下一里程碑：** 整理需要 RD support 的事項清單；規劃 source code ownership transfer 範圍

### 2.6 AI 認證制度 × 教育產品架構升級　🟡 台灣認證待形成 proposal，官網升級架構下週交付

**AI 認證制度（6/02 例會）：**
中國大陸 PAAT 合作模式確認：課程內容由公司提供，認證 / 等級考試制度與高等計算機研究會合作，公司是編委會之一。黎博認為認證非常重要，台灣 AI certification 仍未有明確 proposal，原本考慮與 TAIA 合作，本週四 / 五需推進策略討論。

**官網架構升級 + GEO 策略（6/03 教育部門 Sync）：**
黎博明確指出，現在搜尋環境已進入 **GEO（Generative Engine Optimization）**時代，AI 搜尋引擎會判斷內容的真實性、知識含量與可信度。官網不能只是資訊展示頁，而必須與 business 連動：社群貼文導回官網、官網承接 TA、引導商務轉換。**Janet 下週需提出官網整體架構**，不只是 SEO 文章。

**「大國重器」課程在地化：**
必須改名（系列名 + 各專題名），第一個最簡單的專題（探空氣球 / 氣象雷達）**6 月底前要有可推廣的成果**。

- **下一里程碑：** 黎博本週四 / 五推進台灣 AI certification 策略；Janet 下週提出官網整體架構；StevenCH 下週提出大國重器改名 + schedule

### 2.7 FDE 工作模式 × 教育外拓　🟢 FDE approval 正式推進，雲林土庫持續最強進展

6/03 教育部門 Sync 中，Michael 提出並獲得黎博同意，今日**正式發信給 Vincent 推進 FDE 工作模式的 approval**。FDE（Forward Deployed Engineer）的角色是站在專案前線，把外包交付、客戶需求、內部平台與後續維運串起來，讓 RD 可以轉為 transition support / architecture review 模式，而不是每次都直接投入大量開發人月。

縣市拜訪：雲林土庫（處長預算口頭同意 10–20 萬）、金門（積極推進，金城幼兒園 SEL + 文化局在地化）、基隆（移至 6 月初）、花蓮 + 宜蘭（6 月中東海岸路線）、高雄 + 屏東（洽談中）。屏東確認 6 月第二或第三週；花蓮由黎博親自帶隊確認出訪。

親子天下合作：黎博前一天接觸，對方有上千位老師培訓經驗、約 400 多位取得認證，主要集中在幼兒園與小學低年級。Michael 要求取得該次會議紀錄，評估教師認證合作模式。

- **下一里程碑：** Michael FDE approval 信（今日）；雲林土庫合作方案本週出；花蓮 + 宜蘭 6 月中；本週五各地拜訪 schedule 更新

---

## 章節 3：子組進度

### 3.1 Media Agent

本週 Media Agent 線的核心是三件事的收斂：DGX benchmark 估算方式確立、台標辨識功能定位清楚、AI Server 備份機制方向定案。

DGX 方面，Steve 提出以影片時長取代 TB 容量作為估算基準，並給出具體數字（新聞類 37 天 / 節目類 20.3 天，以單台 DGX 1 萬小時計），讓原本模糊的「500TB 要掃多久」第一次有了可換算的參數。

台標辨識的定位在會議中收斂清楚：AI 在影片入庫時偵測 Logo / 台標並提示管理員，是否版權鎖定仍由片庫管理員人工判斷。Dream 特別強調，台標辨識需與 OpenMAM 3.0 已有的版權鎖定 / 回調審核流程串接思考，不能只做單一偵測功能。

AI Server 備份，Steve 提出不走 API（service 掛掉時 API 也可能不可用），而是由 AI Server 列出需要備份的資料庫 / 向量庫 / 索引，評估復用既有 S3 / MinIO 機制，並由 Steve 與 JH 在 developer meeting 細部對接。runtime software 可重新 setup，真正需要保全的是 DB 資料與索引。

6/01 Program Progress Follow 則把 OpenEdit 定位問題點名：現有 OpenEdit 是透過 OpenShare 去取出 OpenMAM 片庫中的影片，但若未來增加 STT、上字幕、社群發布等功能，就不一定必須完全依賴片庫。這會產生兩條流程：需要片庫的流程，以及不需要片庫的流程。台標 MRD 已產出，但仍在等待 Tonny 的回饋，需本週三前追蹤。

Resource 頁面已整理好所有相關文件（台標訪談、MRD、OpenMAM 權限資料、API 文件等），作為後續對接的集中入口。

### 3.2 TV Solution

DGX 方面，4 台採購方向持續推進，400G 線材採購確認。部署位置、電力、網路配置放到本週五下午會議整體規劃，包含 Olapedia server 放置位置、OpenShare server 位置、台北驗證環境建立（目標 6 月中旬），一起討論不拆開。Olapedia server 的 TVBS 端設備已準備好，本週五後由 Romeo 執行部署。

MBO 時程：6/15 啟動，Q2 內容盡量於 6/22–6/26 前完成（以支援 H1 review paper）。Michael 將準備 MBO 書寫 guideline，協助統一撰寫角度。

### 3.3 創造栗

6/02 例會從過去幾週的硬體 / 展廳討論切到了組織層面：教育部門 source code ownership 的逐步轉移，以及 AI 認證制度的兩岸合作模式確認。小栗方 Pro 四年級課程已完成，正在依照現行網站畫面更新教材截圖。SEL 繪本課程正在與 Sophia 評估，是近期優先處理事項。台灣 SEL 團隊需與中國大陸團隊同步，課程盡量維持同一套，以中性方式設計。

6/03 教育部門 Sync 密度極高，黎博在 1.5 小時內推進了多條線：GEO 內容策略、FDE 工作模式、大國重器改名與在地化、金門整體方案提高層次（包裝為 AI × SEL × 教育 × 文化觀光 × 在地創生）、L1 庫存 Promotion Package（Grace 下週 Weekly 提出）、SEL 模型成本試算（Local Hybrid LLM 評估）、Claude Skill 作為團隊工作方法沉澱工具、辦公室 6–7 月整理成可展示 / demo / training 的空間。

### 3.4 LearnMode / 學習吧

6/03 RD 會議正式討論加分吧（LearnMode edu-plus）AWS 成本問題，也是本週 LearnMode 線最重要的進展。

**AWS 成本現況：**
加分吧平台月費從 2025 年基準月（2025/12）的 NT$18,448，在今年寒假競賽（1/19–3/1，13,559 人）結束後墊高至 NT$25,234（2026/04），增幅 36.8%。六月起的每月費用新基準約為 **NT$25,000**，比競賽前多出 NT$6,000–8,000，若不處理，一年多出約 NT$72,000–96,000。

根因分析確認，問題來源是 **Aurora I/O 長尾效應**（競賽後 3–4 月 I/O 仍是基準 4 倍）與 **backup 容量未清理**（寒假資料留在備份中持續累積），而非活動本身的流量費。這不是架構問題，而是**資料生命週期管理問題**。

**本週決策（6/03 RD ）：**
- 若暑假活動人數維持約 7,000 人（今年預估），**不預先升級 AWS 硬體**，現有 RDS 規格原則上可支撐
- 若人數上升到 10,000–15,000 人，才考慮 RDS 硬體升級（約 +NT$3,750–4,700/月）
- **資料清理是第一優先**，不是硬體升級：先確認寒假活動資料是否與學習歷程有關，再制定清理策略

**James 需本週確認**：加分吧資料結構中，哪些 table 與學習歷程 / 獎狀 / 分數有關，哪些只是活動過程資料、可以 filter 清除。後端原負責人 Colin 目前不在，由 James 先行查看。

**即將到來的費用節點（需提前規劃）：**
- **2026/06/23**：暑假活動開始（情境 A 7,500 人預算 NT$120,000；情境 B 10,000 人 NT$165,000，已產出預算申請文件）
- **2026/08/31**：Aurora Reserved Instance 合約到期
- **2026/09**：Aurora RI 續約費 **NT$98,000** 認列（獨立費用項目，需提前 approve）

### 3.5 教育外拓

本週教育外拓同時推進多條線：縣市拜訪（雲林 / 金門 / 基隆 / 花蓮 / 宜蘭 / 高雄 / 屏東）、學術合作（師大、陳秀玲教授）、親子天下合作初步接觸、AI 認證制度（台灣 TAIA 合作探索）、客委會案流程確認、新竹客語音辨識公開招標風險評估。黎博提出的大方向是：不能再靠單點銷售或臨時專案，而要形成可展示、可說明、可導流、可複製、可變現的完整架構。

PM Tasks 截圖確認幾個狀態更新：`AI 剪輯工具命名與定位`（5/15 一直逾期）本週正式 **Done** ✅；`Text-Based AI Video Editor` 截止日從 5/22 延至 6/27；新增 `Harness Engineering`（P2 Medium，6/20）；`AI Sharing_AI作戰室_特種部隊`（6/05 本週五）進行中。

---

## 章節 4：跨部門協作與客戶互動

**TVBS 協作進展表**

| 議題 | 狀態 | 下一步 |
| ---- | ---- | ------ |
| DGX 4 台採購（400G 線材） | 🔄 採購進行中 | Michael / Dream 確認 400G 線材採購；週五討論部署位置 |
| Olapedia Server 部署 | 🔄 就緒待部署 | 本週五後 Romeo 執行；週五會議整體規劃部署位置 |
| 歷史片庫入庫時程 | 🔄 框架建立 | Steve 以 4 台 DGX 重新估算時程；提出 TVBS 入庫 policy 建議 |
| 台北整合測試環境 | 🔄 規劃中 | 週五會議討論；目標 6 月中旬完成 |
| 台標辨識 Demo | 🔄 規劃中 | Steve 消化 MRD；決定 Demo prototype 形式；6 月底呈現 |
| Logo + OpenMAM 整合 Demo | 🔄 進行中 | 6/24 Demo 里程碑，Steve 團隊執行 |
| MBO 書寫 | 🔄 準備中 | Michael 準備 guideline；6/15 正式啟動 |

**教育局 / 縣市政府互動表**

| 對象 | 狀態 | 下一步 |
| ---- | ---- | ------ |
| 雲林土庫 | ✅ 預算口頭同意（10–20 萬） | 本週出後續合作方案 |
| 金門 | 🔄 積極推進 | 金城幼兒園 SEL + 文化局在地化；文化園區提案先找窗口預審 |
| 基隆 | 🔄 延期至 6 月初 | 議會質詢後重新約訪 |
| 花蓮 + 宜蘭 | 🔄 排定 6 月中 | 先從底層窗口提出拜訪；黎博往上約處長 |
| 高雄 + 屏東 | 🔄 洽談中 | 屏東 6 月第二或第三週確認；高雄透過都學窗口追蹤 |
| 新竹縣（客語音辨識） | ⚠️ 公開招標風險 | 今日提供黎博可轉發的策略性訊息 |
| 客委會案 | 🔄 流程確認 | Eddy 本週寄信確認；合約可拆開處理 |

---

## 章節 5：重大決策與戰略討論

**決策 D1：DGX 入庫 benchmark 改以影片時長估算（6/03，Agentic Meeting）**

Steve 提出以影片時長取代 TB 容量作為估算基準，因為 TB 數會受影片格式、解析度、壓縮方式影響，換算不穩定。新聞類 1 萬小時約 37 天、節目類約 20.3 天（單台 DGX 24 小時連續運作）。真正瓶頸是 GPU 人臉向量化速度，不是 IO 或解碼。此決策讓 TVBS 歷史片庫入庫規劃第一次有了可排程的量化基礎。

**決策 D2：DGX 資源配置 3 台入庫 + 1 台 dedicated 查詢（6/03，Agentic Meeting）**

為避免使用者查詢時干擾到入庫任務，初步配置 1 台 dedicated 給即時查詢 / 推理，3 台動態分配入庫，並支援動態任務分配（API 提供業務優先順序，後台排隊）。

**決策 D3：6 月底 Demo 範圍確認（6/03，Agentic Meeting）**

三項：OpenMAM 2.10 + Face / Olapedia、台標 / Logo 辨識、OpenNews STT。MBO 6/15 啟動，Q2 內容 6/22–6/26 前完成，以支援 2026 H1 review paper。

**決策 D4：AI Server 備份不走 API，復用 S3 / MinIO 機制（6/03，Agentic Meeting）**

若 service 掛掉，API 也可能不可用，因此備份不應依賴 API。先列出需備份的 DB / 向量庫 / 索引，評估復用既有 S3 / MinIO 機制，runtime software 可重建，真正需要保全的是資料與索引。Steve 與 JH 端後續在 developer meeting 細部對接。

**決策 D5：Open Editor 與 OpenMAM 2.10 確認為兩條線並行（6/03，Agentic Meeting）**

不混在同一條工作流討論。Open Editor 相關文件下週大家先看清楚，6/10 再一起討論 AI 介入點與 pipeline，之後再安排與 JH 的對接。

**決策 D6：OpenMAM 2.10 名人庫短期先獨立運作，後續再整合（6/03，Agentic Meeting）**

時間較趕的情況下，短期先不在 OpenMAM 中做連結，讓名人庫 / Face 以獨立網址或獨立 AP 方式運作，後續再整合回 OpenMAM UI。Face 先走 v1（公視版本的 OpenMAM 介面），不採用尚未定案的 v2。

**決策 D7：教育部門 source code ownership 逐步轉移（6/02，創造栗例會）**

已與董事長、Dream、Michael 達成共識，教育部門將逐步把相關 source code ownership 接回自己手上，方向是讓教育部門具備更完整的技術掌握權與維護能力。具體 transition plan 待後續規劃。

**決策 D8：官網升級為商務轉換架構，內容策略進入 GEO 時代（6/03，教育部門 Sync）**

搜尋環境已進入 GEO 時代，AI 搜尋引擎判斷內容的真實性與知識含量。官網必須與 business 連動，Janet 下週需提出整體官網架構。SEO 文章需增加知識性與可信內容。

**決策 D9：「大國重器」類課程必須改名、改背景，第一個專題 6 月底前出來（6/03，教育部門 Sync）**

系列名稱與各專題名稱必須重新命名，以符合台灣 / 金門在地情境。轉換優先排探空氣球 / 氣象雷達，第一個可推廣成果目標 6 月底。

**決策 D10：FDE 工作模式正式推進 approval，Michael 今日發信（6/03，教育部門 Sync）**

由 Michael 發信給 Vincent，推進 FDE 工作模式的 approval 與內部討論。FDE 承接外包交付、整合、銜接與維運管理，讓外包專案從 one-shot 轉成可管理、可維護的交付模式。

**決策 D11：Claude Skill 作為團隊工作方法沉澱工具（6/03，教育部門 Sync）**

Claude Skill 不只是個人輔助工具，應把團隊的 know-how、工作流程、proposal 模板、教育方案包裝流程等累積成 Skill，讓工作方法產品化與制度化。Michael 已累積四、五十個 Skill 作為示範。

---

## 章節 6：下週重點計劃（W24，2026/06/08–06/12）

| 優先級 | 事項 | 負責人 | 截止 |
| ----- | ---- | ------ | ---- |
| P0 | Open Editor AI 介入點 + pipeline 圖整理與 review | Steve / 全員 | 6/10 |
| P0 | Olapedia server 部署（TVBS 端） | Romeo | 6/6 後 |
| P0 | MBO 書寫 guideline 準備 | Michael | 6/15 前 |
| P0 | 台灣 AI certification 合作策略推進（本週四 / 五先啟動） | 黎博 / Kevin | 6/4–6/5 |
| P1 | Janet 提出官網整體架構（GEO + 商務轉換路徑） | Janet | 下週 Sync 前 |
| P1 | Steve 以 4 台 DGX 重新估算入庫時程 | Steve | 下週三前 |
| P1 | 大國重器系列改名 + 各專題命名 + 轉換 schedule | StevenCH | 下週 |
| P1 | FDE approval 推進（Michael 發信後追蹤） | Michael | 下週 |
| P1 | Developer meeting：AI Server 備份 / restore 細部對接 | Steve / JH | 待安排 |
| P1 | 台北整合測試環境建置規劃（週五討論後推進） | Alex / 阿華 | 6 月中 |
| P1 | Alex 台標 MRD Tonny 回饋追蹤 | Alex / Tonny | 下週三前 |
| P2 | 金大志工合作方案修訂 | StevenCH | 儘快 |
| P2 | 金門文化園區窗口預審 | StevenCH / 紫一 | 儘快 |
| P2 | SEL token / 模型成本試算（Local Hybrid LLM 方向） | Eddy / Robert | 持續 |
| P2 | 辦公室 demo space 初步規劃 | Janet / 相關 | 6–7 月 |

---

## 章節 7：風險與問題追蹤

| Risk ID | 風險描述 | 等級 | 影響範圍 | 緩解行動 |
| ------- | -------- | ---- | -------- | -------- |
| R-01 | **TVBS 歷史片庫入庫期待管理**：以影片時長估算後框架建立（新聞類 1 萬小時 37 天），但 4 台 DGX 的實際時程 + TVBS 入庫 policy 仍待確認（W22 carry-over，本週有進展） | 🔴 | TVBS 交付時程與客戶信任 | Steve 以 4 台 DGX 重新估算；benchmark 完成後與 TVBS 討論入庫優先順序；標示「尚未入庫，不可搜尋」 |
| R-02 | **STT 模型能力未解**：談話性節目 ASR 準確率能否達標至今無 benchmark（W20 carry-over） | 🔴 | Media Agent 核心產品競爭力 | 差異化轉向編輯 UX；技術路徑待 Devops 確認 |
| R-03 | **Open Editor 產品邊界與團隊分工衝突**：Steve vs JH 主導權 / 責任邊界不清楚，V2 文件已 review 但最終型態與分工仍待 6/10 pipeline review 後定案 | 🟡 | Media Agent 產品推進速度 | 6/10 pipeline review；待 review 後安排 JH 對接；Michael 居中協調 |
| R-04 | **台標辨識與 OpenMAM 版權流程串接缺口**：6 月底 Demo 前需確認台標 detect → 版權鎖定 → 回調審核的串接方式；Alex + Tonny 仍需閱讀 3.0 版權流程章節（本週新增） | 🟡 | 6 月底 Demo 品質 | Alex + Tonny 閱讀 OpenMAM 3.0 版權流程；Steve 消化 MRD 後設計 prototype |
| R-05 | **AI Server 備份機制責任邊界未完全定義**：不走 API 的方向已定，但 restore 觸發條件、責任歸屬、誰判斷損壞、誰執行 restore 等細節仍待 developer meeting（W22 carry-over，有進展） | 🟡 | OpenMAM 2.10 服務穩定性 | Steve + JH developer meeting 細部對接；先列出需備份項目；評估復用 S3 / MinIO |
| R-06 | **Ola Pedia / NLP API 對齊缺口**：Ola Pedia 2.10 版本範圍仍未正式承接，NLP API 尚未回應（W22 carry-over） | 🟡 | OpenMAM 2.10 功能完整性 | 持續追蹤；評估另開 NLP 對齊會議 |
| R-07 | **小栗方 Pro token 成本**：雲端 LLM 每用戶每月 600–1,000 TWD，Local Hybrid LLM 評估中（W22 carry-over） | 🟡 | 創造栗 to C 商業可行性 | Eddy 精算試算表；華邦開發板評估 edge AI 部署可能性 |
| R-08 | **教育部門 source code ownership transfer 計劃缺失**：高層共識已達成，但具體 transition plan、範圍與責任邊界均未規劃（本週新增） | 🟡 | 教育部門技術能力建立時程 | 列出需要 RD support 的事項清單；後續規劃 transition plan |
| R-09 | **新竹客語音辨識公開招標競爭風險**：若只走最低價競爭，團隊不一定有優勢（本週新增） | 🟡 | 新竹縣教育標案商機 | 今日提供黎博策略性訊息；提高溝通層級；思考是否調整投標策略 |

---

## 章節 8：行動方案追蹤

### Media Agent 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| Open Editor AI 介入點與 pipeline 圖整理 | Steve | 6/10 前 | 待執行 |
| 全員研讀 Open Editor V2 文件 | 全體相關成員 | 6/10 前 | 待執行 |
| 以 4 台 DGX 重新估算入庫時程（3台入庫 + 1台查詢模式） | Steve | 下週三前 | 待執行 |
| AI Server 需備份項目清單 | Steve 團隊 | Developer meeting 前 | 待執行 |
| 整理現有標案備份機制文件（S3 / MinIO / snapshot 策略） | JH | 近期 | 待執行 |
| Developer meeting：備份 / restore 細部對接 | Steve / JH | 待安排 | 待排 |
| 指派 Steve 與 JH 端對接窗口 | Steve / JH | 近期 | 待執行 |
| 消化台標訪談與 MRD（5/29），決定 Demo prototype 形式 | Steve 團隊 | 近期 | 待執行 |
| 研讀 OpenMAM 3.0 版權回調流程（台標串接用） | Alex / Tonny | 近期 | 待執行 |
| 補充 API 文件到 Resource 頁面 | Alex / JH / Steve | 近期 | 進行中 |
| 追 Tonny 對台標 MRD 的回饋 | Alex / Tonny | 6/10 前 | 待執行 |
| 整理 OpenMAM 與 AAD 權限資料（給 Tonny） | Alex | 待安排 | 待執行 |
| 持續整理 Resource Loop（共享知識庫） | Alex | 進行中 | 進行中 |
| OpenMAM 2.1 Face API 整合 | Steve Liu 團隊 | 6 月底 | 進行中 |
| Logo + OpenMAM 整合 Demo | Steve Liu 團隊 | 6/24 | 進行中 |
| Q2 MBO 內容完成 | 各負責人 | 6/22–6/26 | 待執行 |
| AI Sharing_AI作戰室_特種部隊（分享會） | Alex | 6/5（今日） | 進行中 |
| Text-Based AI Video Editor | Alex | 6/27 | 進行中 |
| Harness Engineering | Alex | 6/20 | 進行中 |
| STT + 字幕小工具（Q3 Demo） | Steve Liu 團隊 | Q3 / 9 月 | 進行中 |

### TV Solution 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| Olapedia server 部署（TVBS 端） | Romeo | 本週五後 | 待執行 |
| 週五會議：DGX / Olapedia / OpenShare / 台北驗證環境統一規劃 | Alex / Dream / Michael | 本週五下午 | 待執行 |
| DGX 400G 線材採購確認 | Michael / Dream | 進行中 | 追蹤中 |
| 台北整合測試環境建立（OpenMAM 2.10 + AI Server） | Alex / 阿華 | 6 月中旬 | 待執行 |
| TVBS IT 評估 4 台 DGX 機房部署位置、網路、電力 | Romeo / TVBS IT / Michael | 採購交期確認前 | 待執行 |
| 確認 TVBS 實際同時使用人數（DGX 並發評估） | Dream / Alex | 待確認 | 待確認 |
| MBO 書寫 guideline | Michael | 6/15 前 | 待執行 |

### LearnMode / 學習吧 × 加分吧線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| 確認活動資料是否與學習歷程有關（口頭詢問 BT / 教育端窗口） | Alex / LMX / 教育端窗口 | 本週 | 待執行 |
| 檢查加分吧資料結構（哪些 table 可清、哪些必須保留） | James | 本週 | 待執行 |
| 建立資料清理策略（學習歷程必要資料 / 活動過程資料 / 可刪暫存資料） | PM / RD / 教育端 | 近期 | 待執行 |
| 估算資料清理後可降低多少成本（目標回到 NT$19,000–21,000） | RD / RE | 近期 | 待執行 |
| 確認暑假活動預估人數（是否超過 7,000 人） | PM / 活動窗口 | 本週 | 待執行 |
| 準備 RDS 升級 SOP（含關機 / 升級 / 開機 / 注意事項） | Steven / RE | 近期 | 待執行 |
| 培訓第二位可操作 RDS 升級人員（避免 Steven 單點依賴） | Steven / RE | 近期 | 待執行 |
| 暑假活動 AWS 預算申請送審（情境 A NT$120,000 / 情境 B NT$165,000） | Alex / PM | 儘快 | 進行中 |
| Aurora RI 續約費 NT$98,000 預算規劃（2026/09 認列） | Alex / PM / 財務 | 2026/08 前 | 待排 |

### 創造栗 × 教育線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| 整理需要 RD support 的事項清單 | 黎博 / 相關 PM | 近期 | 待執行 |
| 規劃 source code ownership transfer 範圍與計劃 | 黎博 / Dream / Michael | 待規劃 | 待排 |
| 台灣 AI certification 合作策略討論（本週四 / 五） | 黎博 / Kevin | 6/4–6/5 | 待執行 |
| 釐清 PAAT 認證合作架構（公司 / 高等計算機研究會角色） | 黎博 / Kevin | 下一場會議 | 待執行 |
| 更新小栗方 Pro 四年級教材截圖 | 課程團隊 | 進行中 | 進行中 |
| SEL 繪本課程評估 | 課程團隊 / Sophia | 進行中 | 進行中 |
| 台灣 SEL 與中國大陸課程同步 | SEL 團隊 / 大陸課程 | 近期 | 待執行 |
| Janet 提出官網整體架構（GEO + business 連動 + 轉換路徑） | Janet | 下週 Sync 前 | 待執行 |
| 新竹客語音辨識案策略性訊息給黎博 | 負責窗口 | 今日 | 待執行 |
| 客委會案發信確認 | Eddy | 本週 | 待執行 |
| Michael FDE approval 發信給 Vincent | Michael | 今日 | 進行中 |
| 大國重器系列改名 + 各專題命名 | StevenCH | 下週 | 待執行 |
| 大國重器轉換 schedule（第一個 6月底前出來） | StevenCH / Grace | 下週 | 待執行 |
| 金大志工合作方案修訂（合作模式 + 時程 + 經費） | StevenCH | 儘快 | 待執行 |
| 金門文化園區提案窗口預審 | StevenCH / 紫一 | 儘快 | 待執行 |
| 親子天下會議紀錄提供給 Michael | Ruru / 相關窗口 | 儘快 | 待執行 |
| 師大合作資源聯繫 | Tiffany / Eddy | 持續 | 進行中 |
| SEL token / 模型成本試算（Local Hybrid LLM 評估） | Eddy / Robert | 持續 | 待執行 |
| Edge AI / 開發板評估（華邦） | Ruru / Eddy | 後續 | 待排 |
| 團隊 AI 自動化與人力釋放 | 全體 | 6 月底 | 進行中 |
| 花蓮 / 宜蘭 / 屏東 / 高雄拜訪 schedule | StevenCH / 相關業務 | 今日 / 本週五 | 待執行 |
| 雲林土庫後續合作方案提出 | Sales / Tiffany 協助 | 本週 | 待執行 |
| 攝影合約立即約簽 | 負責同仁 | 立即 | 待執行 |
| 辦公室 demo space 初步規劃 | Janet / 相關 | 6–7 月 | 待排 |
| 經銷商分析業務校正（業務市場資訊修正 AI 分析） | Eddy / 業務 | 持續 | 進行中 |
| 繪本 demo 製作（每年級 2 篇附 AI 旁白語音） | 課程團隊 | 7 月前 | 待執行 |
| Luffy 廠商 3,000 pcs 分批裝箱協商 | Luffy Luan | 盡快 | 進行中 |

---

## 章節 9：關鍵時間節點與總結

**里程碑總表（W23 起往後六週）：**

| 日期 | 事項 |
| ---- | ---- |
| 6/4–6/5 | 黎博推進台灣 AI certification 合作策略；黎博 × Michael FDE approval 追蹤 |
| 6/5（今日） | AI 分享會 — AI作戰室_特種部隊（Alex）；Michael 發信 Vincent 推進 FDE |
| 6/6 後 | Romeo 執行 Olapedia server 部署；週五下午部署規劃會議 |
| 6/10（下週三） | Open Editor AI 介入點 + pipeline review（Steve + 全員） |
| 6/初 | 基隆拜訪（議會質詢後）；新竹客語案策略訊息發出 |
| 6/15 | MBO 正式啟動 |
| 6/中旬 | 花蓮 + 宜蘭拜訪；台北整合測試環境建立完成；鵬林展廳開幕（同齡） |
| 6/22–6/26 | Q2 MBO 內容完成（以支援 H1 review paper） |
| 6/23 | **加分吧暑假活動開始**（情境 A 7,500 人 / 情境 B 10,000 人；AWS 預算需提前 approve） |
| 6/24 | Logo 電視模組 Demo + OpenMAM 整合 Demo |
| 6/底 | OpenMAM 2.10 Face API 對接完成；大國重器第一個在地化專題出爐；Janet UGC 方案第一次成果檢視 |
| 6/27 | Text-Based AI Video Editor 截止 |
| 7 月 | OpenNews STT 初步 Demo；繪本 demo（每年級 2 篇） |
| 8/31 | **Aurora RI 合約到期**（db.r6g.large × 2，需提前確認續約） |
| 2026/09 | **Aurora RI 續約費 NT$98,000 認列**（獨立費用項目，需提前 approve） |
| Q3 / 9 月 | STT + 字幕小工具 demo |

本週的核心任務是把模糊問題轉換成可執行的參數。DGX 入庫估算從「TB 容量」切換到「影片時長」，讓排程第一次有了可討論的數字；AI Server 備份從「走 API」轉向「資料層備份」，讓責任邊界第一次講清楚了方向；Open Editor 從混在 OpenMAM 討論，切割成兩條明確並行的線，避免後續持續打架。這三個定案都是從模糊往具體走的過程，但最後一公里——4 台 DGX 實際時程、Open Editor 分工、備份 restore 細節——都還要等下週的 follow-up。教育線的密度很高，但多數仍停在「提出」階段：官網架構下週交、大國重器改名下週交、FDE approval 今日發信、AI certification 本週四 / 五談。這些事項只要有一件卡住，就會產生連鎖延遲。6 月底的 Demo 節點（6/24）和 MBO 節點（6/15 啟動、6/26 完成）是接下來兩週最重要的雙錨。

---

## Appendix: Dashboard Export
> 本區塊由 import-draft.py 解析，供匯入 Railway Dashboard 使用。請勿手動修改欄位名稱。

### 專案進度

| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| -------- | ---- | ------ | -------- | ---- |
| OpenMAM 2.10 × 人臉識別整合 | on-track | [keep] | 6月底 Demo 確認（Face/Olapedia + 台標 + STT）；Olapedia server 本週五部署；名人庫短期先獨立運作 | 6/24 Logo Demo；6月底 Face API 完成 |
| Open Editor → AI editing subsystem | at-risk | [keep] | Steve review V2 文件 OK；確認兩條線並行；6/10 pipeline review 後再討論 JH 對接 | 產品邊界 + 分工主導權問題仍需 close |
| TVBS DGX 架構 × 歷史資料入庫 | behind | [keep] | Benchmark 方法確立（以影片時長估算）；4台 DGX 配置初步定案（3入庫+1查詢）；Steve 需重新估算 4台時程 | TVBS 入庫 policy 仍待討論 |
| OpenNews STT / 字幕工具 | at-risk | [keep] | 列入 6月底 Demo 範圍；7月初步 Demo 目標維持 | 技術路徑待確認 |
| 教育部門 Source Code Ownership 轉移 | at-risk | [keep] | 高層共識已達成；具體 transition plan 尚未規劃 | 新增專案線 |
| AI 認證制度 × 官網架構升級 | at-risk | [keep] | GEO 策略方向定案；台灣 AI certification 本週四/五推進；官網架構 Janet 下週提 | 大國重器改名 + schedule 下週交 |
| 教育外拓 × FDE 工作模式 | on-track | [keep] | FDE Michael 今日發信 approval；雲林土庫持續最強；花蓮+宜蘭6月中；親子天下初步接觸 | 新竹公開招標競爭風險需管理 |

### Action Items

| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | -------- | ------ | -------- | ---- | ---- |
| 1 | Open Editor AI 介入點與 pipeline 圖整理 | Steve | 2026/06/10 | pending | technical |
| 2 | 全員研讀 Open Editor V2 文件 | 全體相關成員 | 2026/06/10 | pending | technical |
| 3 | 以 4 台 DGX 重新估算入庫時程（3入庫+1查詢） | Steve | 2026/06/10 | pending | technical |
| 4 | Olapedia server 部署（TVBS 端） | Romeo | 2026/06/06 | pending | technical |
| 5 | 週五部署規劃會議（DGX/Olapedia/OpenShare/台北驗證環境） | Alex / Dream / Michael | 2026/06/06 | pending | technical |
| 6 | AI Server 需備份項目清單 | Steve 團隊 | TBD | pending | technical |
| 7 | 整理現有標案備份機制文件（S3/MinIO/snapshot） | JH | TBD | pending | technical |
| 8 | Developer meeting：備份 / restore 細部對接 | Steve / JH | TBD | pending | technical |
| 9 | 消化台標 MRD，決定 Demo prototype 形式 | Steve 團隊 | TBD | pending | technical |
| 10 | 研讀 OpenMAM 3.0 版權回調流程 | Alex / Tonny | TBD | pending | technical |
| 11 | 追 Tonny 對台標 MRD 的回饋 | Alex / Tonny | 2026/06/10 | pending | business |
| 12 | OpenMAM 2.1 Face API 整合 | Steve Liu 團隊 | 2026/06/30 | in-progress | technical |
| 13 | Logo + OpenMAM 整合 Demo | Steve Liu 團隊 | 2026/06/24 | in-progress | technical |
| 14 | Q2 MBO 內容完成 | 各負責人 | 2026/06/26 | pending | business |
| 15 | MBO 書寫 guideline | Michael | 2026/06/15 | pending | business |
| 16 | Text-Based AI Video Editor | Alex | 2026/06/27 | in-progress | technical |
| 17 | AI Sharing_AI作戰室_特種部隊 | Alex | 2026/06/05 | in-progress | business |
| 18 | Harness Engineering | Alex | 2026/06/20 | in-progress | technical |
| 19 | 台灣 AI certification 合作策略討論 | 黎博 / Kevin | 2026/06/05 | pending | business |
| 20 | 整理需要 RD support 的事項清單 | 黎博 / 相關 PM | TBD | pending | resource |
| 21 | Janet 提出官網整體架構 | Janet | 下週 Sync 前 | pending | business |
| 22 | 新竹客語音辨識案策略性訊息給黎博 | 負責窗口 | 2026/06/03 | pending | business |
| 23 | 客委會案發信確認 | Eddy | TBD | pending | business |
| 24 | Michael FDE approval 發信給 Vincent | Michael | 2026/06/03 | in-progress | resource |
| 25 | 大國重器系列改名 + 各專題命名 + schedule | StevenCH | 下週 | pending | business |
| 26 | 金大志工合作方案修訂 | StevenCH | TBD | pending | business |
| 27 | 金門文化園區提案窗口預審 | StevenCH / 紫一 | TBD | pending | business |
| 28 | 親子天下會議紀錄提供給 Michael | Ruru / 相關窗口 | TBD | pending | business |
| 29 | 花蓮 / 宜蘭 / 屏東 / 高雄拜訪 schedule | StevenCH / 業務 | 2026/06/05 | pending | business |
| 30 | 雲林土庫後續合作方案 | Sales / Tiffany | TBD | pending | business |
| 31 | SEL token / 模型成本試算 | Eddy / Robert | TBD | pending | business |
| 32 | 團隊 AI 自動化與人力釋放 | 全體 | 2026/06/30 | in-progress | resource |
| 33 | 繪本 demo 製作（每年級 2 篇） | 課程團隊 | 2026/07/01 | pending | business |
| 34 | 確認加分吧活動資料是否與學習歷程有關 | Alex / LMX / 教育端 | TBD | pending | business |
| 35 | 檢查加分吧資料結構（James 評估可清理範圍） | James | TBD | pending | technical |
| 36 | 暑假活動 AWS 預算申請送審（NT$120,000 或 NT$165,000） | Alex / PM | TBD | in-progress | business |
| 37 | Aurora RI 續約費 NT$98,000 預算規劃（2026/09 認列） | Alex / PM / 財務 | 2026/08/01 | pending | business |

### Risks

| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| ------- | -------- | ------ | ------ | -------- |
| R-01 | TVBS 歷史片庫入庫期待管理：框架建立，但 4 台 DGX 時程 + 入庫 policy 仍待確認 | high | Steve / Alex | 4台 DGX 重新估算；與 TVBS 討論入庫 policy；標示未入庫範圍 |
| R-02 | STT 模型能力未解：談話性節目準確率無 benchmark | high | Steve / Tonny | 差異化轉向編輯 UX；技術路徑確認 |
| R-03 | Open Editor 產品邊界與分工主導權衝突 | medium | Alex / Steve / JH / Michael | 6/10 pipeline review；Michael 居中協調 |
| R-04 | 台標辨識與 OpenMAM 版權流程串接缺口 | medium | Alex / Tonny / Steve | 閱讀 3.0 版權流程；Steve 設計符合流程的 prototype |
| R-05 | AI Server 備份機制責任邊界未完全定義 | medium | Steve / JH | Developer meeting 細部對接；先列出備份項目 |
| R-06 | Ola Pedia / NLP API 對齊缺口 | medium | Alex / JH / Dream | 持續追蹤；評估另開 NLP 對齊會議 |
| R-07 | 小栗方 Pro token 成本：雲端 LLM 每用戶 600–1,000 TWD/月 | medium | Eddy / 黎博 | 精算試算表；評估 Local Hybrid LLM + edge AI |
| R-08 | 教育部門 source code ownership transition plan 缺失 | medium | 黎博 / Dream / Michael | 列出 RD support 清單；規劃 transition plan |
| R-09 | 新竹客語音辨識公開招標競爭風險 | medium | 黎博 / 相關業務 | 提供策略性訊息；提高溝通層級；思考投標策略 |

### 下週重點

| 優先級 | 任務 | 負責人 |
| ------ | ---- | ------ |
| P0 | Open Editor AI 介入點 + pipeline review | Steve / 全員 |
| P0 | Olapedia server 部署 | Romeo |
| P0 | MBO 書寫 guideline 準備 | Michael |
| P0 | 台灣 AI certification 策略（本週四/五先啟動） | 黎博 / Kevin |
| P1 | Janet 官網整體架構 | Janet |
| P1 | Steve 4 台 DGX 入庫時程重算 | Steve |
| P1 | 大國重器改名 + schedule | StevenCH |
| P1 | Developer meeting：AI Server 備份 / restore | Steve / JH |
| P1 | 台標 MRD Tonny 回饋追蹤 | Alex / Tonny |
| P2 | 金大志工合作方案修訂 | StevenCH |
| P2 | SEL token / 模型成本試算 | Eddy / Robert |
