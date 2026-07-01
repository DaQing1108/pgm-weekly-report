# VIA Technologies — Program Sync 週報

---

## 章節 0：報告封面

| 欄位       | 內容                                                 |
| -------- | -------------------------------------------------- |
| **報告週期** | 2026/06/29（週一）– 2026/07/03（週五）                     |
| **報告日期** | 2026/07/02（彙整日）                                    |
| **彙整人**  | Alex Liao（PgM）                                     |
| **涵蓋團隊** | Media Agent / TV Solution / 創造栗 / LearnMode / 教育外拓 |

**來源文件清單：**

| # | 檔案名稱 | 性質 |
| --- | ------- | ---- |
| ① | `260629_Program_Progress_Follow.md` | PgM 內部同步（Alex × Michael，6/29） |
| ② | `260630_創造栗例會-小栗方-Pro.md` | 創造栗週二例行 Review（6/30） |
| ③ | `260701_教育部門-Sales-PM-RD-sync-up-mtg.md` | 教育部門 Sales×PM×RD 同步會（7/1） |
| ④ | `260701_Agentic-Meeting.md` | Media Agent 例行進度會議（7/1，Dream 請假、JH 請假） |
| ⑤ | `260701_MBO26Q2_summary.md` | 26Q2 MBO 評核總覽（6 份報告） |
| ⑥ | `260701_MediaAgent-Channel-Weekly.md` | MediaAgent Teams channel 追蹤（6/22–6/30） |
| ⑦ | `260701_RD_Resource_Allocation_26Q1Q2.md` | 26Q1 & 26Q2 研發人力資源配置 |

---

## 章節 1：Executive Summary

W27 上半週三條工作線同時推進，但每條線都有一個關鍵前置條件尚未解除。7/1 Agentic 例會上，Steve Liu 以健康 2.0 節目影片完整跑了一遍 STT / AI 字幕校正管線的 Demo，包含大模型糾錯、斷句長度依節目類型調校、節目專屬實體詞庫自訓練、以及小編修改行為學習機制；整體管線在地端已可穩定驗證，這一點是本週最紮實的技術輸出。TVBS 展示時程暫定 8 月底至 9 月初，功能採分階段交付——STT 與臺標先行，文字驅動剪輯、智慧直式裁切另行版本化推出。Olapedia UI 走查同步完成，但整合工期的核心卡點仍在：JH Tseng 團隊的 OpenMAM 用戶權限對接規格，Olapedia × OpenMAM 的 API 整合就無法估工期。Alex 7/1 早上已提醒 Dream，後續待 JH 確認時程。

下週最不能出差錯的是兩個資安截止點：教育平台資安完整報告 7/3 提交，政府採購資安服務供應清單報告 7/7 Hard Deadline；稽核同時新增「AI 揭露」與「對岸連線清單」兩個新要求，若任一截止延誤，政府採購清單推進與學習吧平台形象都會直接受損。學習吧這週同時浮出兩個剛性時間點：8/31 後因未完成大數據平台串接被剔除 A2 平台，以及教育帳號民國 117 年到期。解法方向（課程免費化、FED 接需求）已有初步共識，但技術評估尚未完成，RD Q3 排程已滿。這兩個風險加在一起，需要管理層在 Q3 開始前做出明確的人力投入決策。

本週首度整合進來的 26Q2 人力配置數據揭示一個結構性訊號：創造栗 Q1→Q2 人力從 17.1mm 急遽收縮至 0.95mm（-94%），幾乎退出開發模式，但業務目標（V3、小栗方Pro 40 台推廣、SEL）並未同步縮減；Media Agent 人力增至 60.12mm，佔全部研發人力的 50.6%，標記為 26H1 核心成長動能；TV Solution 持平 55.5mm，但本季需求範圍顯著擴大（STT 節目類 + Olapedia 名人庫整合）。26Q2 MBO 均分 96.34（最高：TC Peng 98.24；最低：Swift Zhu 94.80），反映各線任務本季大體穩定交付——但這個成果建立在人力高度集中於 Media Agent 的前提下，創造栗和 LearnMode 的執行風險在 Q3 預計更加明顯。

---

## 章節 2：關鍵專案進度

### 2.1 OpenMAM 2.10 × Olapedia 名人庫整合　🔴 用戶權限規格未到，整合受阻

7/1 Agentic 例會完成了 Olapedia UI 第一輪走查。目前有兩個觸發流程版本：v1 從左側清單進入後點選名人庫，v2 從使用者功能區塊直接切入；觸發邏輯涉及整體操作架構，需另開會議定案。設計端先處理顏色、字型、大小等可自主調整的部分，Steve Liu 指出設計稿中的範例圖片多為橫版，實務上應改為裁切人臉特寫（確認為設計師疏漏）。Tonny Shen 取得完整 UI 截圖後，列出設計端需補足的素材清單。

整合的核心前置條件仍未到位：OpenMAM 用戶權限對接規格（JH Tseng 團隊端）在 7/1 會議仍未提供。Alex 已在當天早上提醒 Dream 需請 JH 盡快補齊；無此規格則 API 整合無法繼續，工期無法評估。Teams channel 追蹤另揭示兩個未結案的整合問題：Olapedia 新增詞條後如何同步到 MAM（API 自動同步？批次流程？），以及管理者應使用何種帳號操作 Olapedia AAD——兩個問題目前均無明確結論，但直接影響正式部署後的操作流程。

同時，MediaAgent 1.3.8.2 與 OpenMAM MAM v2.10.0 之間的正式版本對映表仍未有人產出（Olamedia / OlaFace / OlaPedia / MediaAgent 命名體系混用中），建議技術 owner 在 7/8 前補上正式口徑，避免 QA 驗過但現場部署版本不一致。

- **下一里程碑：** OpenMAM 用戶權限對接規格（JH 團隊，盡快）；Olapedia UI 觸發流程 v1/v2 定案會議（7/8 前）；Olapedia→MAM 詞條同步機制確認；版本命名對映表產出（7/8）

### 2.2 STT / AI 字幕校正引擎　🟡 Demo 完成，TVBS 展示暫定 8 月底

7/1 Demo 以健康 2.0 節目影片完整展示字幕校正管線：ASR 輸出後套用大模型糾錯與斷句（斷句長度依節目類型調校，健康 2.0 約 16 字、少康戰情室約 15 字、一般新聞約 13 字），支援逐字 timecode，小編可按 Enter 手動重新斷句。節目歷史影片（健康 2.0 約 20 支）用於訓練該節目的實體詞庫，修正如來賓姓名等 ASR 誤讀。小編對用字風格的修改行為被系統記錄，達到閾值後成為節目預設風格——這一記錄小編行為的差異化能力是目前與其他廠商的明確區分點。系統限制：常用詞彙組成的稱謂（如「前師姐」）因非專有名詞，仍需小編人工介入確認。

展示時程：雙方確認 8 月底至 9 月初進行階段性展示（比照人臉搜尋上線模式），9 月正式交付前的信心驗證。功能分階段交付，文字驅動剪輯（transcript-based editing）與智慧直式裁切（橫轉豎）另行版本化推出。多 Agent 投票校正機制技術上可行，但受限地端 GPU 資源（A5000 等級），兩台 DGX 加上 P2P 連線是否足夠未驗證，排至 Q3 進一步評估；Michael 建議先以輕量本地 Agent 取代雲端規模的大模型。

- **下一里程碑：** TVBS 8 月底–9 月初階段性展示；STT Pipeline Q3 地端資源優化

### 2.3 TVBS DGX 架構　🟡 設備時程待更新，QA 環境本週重置完成

本週 DGX 無新進展更新，Michael 確認一有進度即同步。Teams channel 確認：QA 環境重置已完成（Tonny 協助，週數據已清空供 QA 切換測試），TFS 登入權限問題（Swift 的 Olamedia collection 可見性異常）已找到原因（團隊權限設定錯誤）並修正。T 台正式部署預計為 DGX×4 + x86×1，設備預計 7/E 到位，目前借用 VIA RD DGX×2 於 TP SQA Lab 進行整合測試。

- **下一里程碑：** T 台 DGX 4 台正式到位（7 月底）；到位後重新評估算力分配

### 2.4 資安弱掃 × 教育部採購平台　🔴 7/3 + 7/7 雙截止，稽核新增要求

兩個並行的資安截止點：（1）7/1 Agentic 例會確認，外部資安公司今天（7/1）提交報告，若有缺漏即協調 Steve 團隊支援，報告需於 7/7 前正式完成，以推進政府採購資安服務供應清單。（2）教育部門 sync 確認，教育平台資安完整報告 7/3 提交（更早），稽核本次新增「AI 揭露」與「對岸連線清單」兩項要求，若未通過恐引發外界對平台資安疑慮的觀感風險。

方向：不主動對外公告，備妥必要說明話術。Michael 明確要求，除資安需求外，其餘教育 RD 需求一律先經 FED 窗口整理，不直接塞給 RD，以保護排程不被零散需求插入。

- **下一里程碑：** 教育平台資安完整報告（7/3）；政府採購清單資安報告（7/7 Hard Deadline）

### 2.5 小栗方Pro 硬體　🟡 天線延誤 PCB 至 7/20，Robert 接手硬體 assessment

6/30 創造栗例會：小栗方Pro 天線廠商兩次送錯樣品（原負責阻抗匹配的工程師出差，下屬代理未掌握狀況），PCB 打樣預計 7/20 完成並逐片檢驗。StevensLee 明確對此延遲表達不滿，「missing the date」並非可接受常態；Luffy Luan 確認本批完成後將與華益召開總結會議，視情況要求整改或 penalty。外殼組裝整改（殼子拼接不緊）已由 Tanner 現場複查確認有效，不會再出現相同問題。

教育部門 sync 另有一個並行的硬體決議：Robert 接手小栗方Pro 硬體板卡供應商 assessment，目標供應商算力足夠（TOPS 等級）、支援周期 5–8 年、人臉辨識介面完整，較另一廠商便宜三分之一至一半；目標 7 月底完成硬體組裝定案，8 月底前可 demo 成品，台灣與大陸兩地同步推進。

- **下一里程碑：** PCB 打樣完成（7/20）；硬體板卡供應商定案（Robert，7 月底）；本批生產後與華益召開總結會議

### 2.6 創造栗 V3 智能車　🔴 合約空窗、CRD 缺失（W26 carry-over）

本週創造栗例會確認 Robert 擔任 V3 系統審視窗口（StevensLee 要求），確保台灣端對 V3 系統細節的掌握度與品質監督。Eva Huang 確認合約已返回法務最後核定，台灣端使用權及 spec 授權範圍需在定案前主動確認——合約中是否已涵蓋此範圍，會議中仍未取得明確結論。RDK X5 漲價問題、北理工合約空窗、CRD 缺失三個 W26 風險本週均無新進展。StevensLee 另提出 V3 板子未來應用不應局限車用，機器人、無人機、無人船等延伸場景的 roadmap 需納入兩岸對齊。

- **下一里程碑：** Eva 在合約定案前確認台灣端使用權（7/8 前）；Kevin V3 客戶訪談（W26 P0 carry-over）

### 2.7 LearnMode / 學習吧　🔴 8/31 A2 下架 + 11 月帳號到期，雙重剛性風險

本週首度確認兩個剛性時間炸彈。7/1 教育部門 sync：（1）學習吧因未完成大數據平台串接，8/31 後將被剔除 A2 平台；解法方向傾向「既有課程改為免費」而非另建架構（改架構時間成本過高、時機已偏晚），需 FED 先評估課表列表結構是否可調整。（2）教育帳號民國 117 年到期需重新申請；Alex 在 6/29 同步指出，數位平台教育帳號若 11 月前未處理，現有用戶將無法登入，產品等同失效。

26Q2 人力配置數據顯示 LearnMode 兩季合計僅投入 1.88mm——這個數字與當前的風險規模嚴重不匹配。Michael Chien 決策：除資安相關需求外，其餘需求統一先經 FED 窗口整理，不直接轉 RD。RD 修復排程估計到 10 月，StevensLee 認為太久，需要在 Q3 開始前做出明確的人力分配決策。

- **下一里程碑：** 學習吧免費專區技術可行性評估（7/8）；LearnMode 帳號 Q3 人力決策（Alex + Michael）；今年度落實報告提交教育部（例行）

### 2.8 教育外拓 × 小栗方Pro 銷售　🟡 業務 proposal 轉化是本週核心工作

7/1 教育部門 sync 確認三個執行方向。首先，業務端不再停留在拜訪紀錄層次，StevensLee 要求就雲林、國語日報、基隆、屏東等已拜訪縣市提出具體 business proposal（含定價，9,000–15,000 元區間），40 校排程本週補齊。其次，推廣素材（PPT、影片、demo）比課程本身更優先，7/3 前第一版交付 sales 端。第三，問卷修正聚焦 K–5 年級（原 K–12 縮減），7/10 完成第一輪拜訪與修正。政府標案繼續多線推進（屏東、桃園婦幼局、南投），全年目標 10 個以上政府標案；桃園少年隊 AI 資料協作機會由 Eddy 7/2 後整理情報，因資料高度機密，處理需謹慎。

- **下一里程碑：** 各縣市 business proposal（7/8）；推廣素材第一版（7/3）；問卷修正與拜訪（7/10）

---

## 章節 3：子組進度

### 3.1 Media Agent

本週最重要的技術節點是 STT / AI 字幕校正管線的完整 Demo，差異化能力（節目風格記憶、實體詞庫自訓練、小編行為學習）已建立清楚。現階段最緊的卡點是 JH 端用戶權限規格，這個問題已提醒 Dream，但仍待 JH 確認時程，整合工期持續無法估算。

Teams channel 本週整理出幾個需要技術端跟進的問題：Olapedia→MAM 詞條同步方式（API 自動 vs. 批次）、AAD 管理帳號權限模型、MediaAgent 1.3.8.2 對映到哪一套產品的正式版本命名——這些看似細節的問題，在正式部署時都會成為卡點。Op log 需求文件是否已存在也需要 TC Peng 本週確認，若無則需補齊。

資安方面，7/7 Hard Deadline 倒數一週，7/1 外部資安公司提交報告是最關鍵的一步；若報告有缺漏，7/2–7/6 的補漏時間極短，需要 Steve 團隊隨時待命。

### 3.2 TV Solution

本週無新會議紀錄。QA 環境重置（DGX 測試資料清空）和 TFS 登入權限修正在 Teams channel 中確認完成，屬於整合測試基礎設施的修復。台標方向（偵測 + 標注，不做批量入庫）從 W26 定案後仍未與 T 台正式對齊——這是 W26 carry-over，需在 W28 補執行。T 台 DGX 4 台預計 7/E 到位，在此之前借用 VIA RD DGX×2 在 TP SQA Lab 進行整合測試。

### 3.3 創造栗

本週重心落在硬體進度管理與兩岸決策對齊。天線問題的責任追蹤（StevensLee 明確不接受延誤）、V3 合約台灣端使用權確認、Robert 接手 V3 系統審視與硬體板卡 assessment，三個任務同步進行。深圳工廠遷廠後的產線稽核（Robert 負責，Tanner 本週現場拍照）需在本週完成。

人力面的核心警訊：26Q2 創造栗 RD 投入僅 0.95mm，幾乎退出開發模式，但業務端的 V3 合約、小栗方Pro 40 台推廣、SEL 故事等目標完全沒有收縮。這個落差在 Q3 若不被管理層正面處理，會形成持續的執行空轉。

### 3.4 LearnMode / 學習吧

本週首度有具體的剛性時間點進入視野。8/31 A2 下架與 11 月帳號到期不是預警，是已確認的事實。解法選項（課程免費化）在教育部門 sync 中已有初步傾向，但技術評估尚未完成，執行窗口從現在到 8/31 只有兩個月。26Q2 實際人力配置（兩季合計 1.88mm）清楚說明為什麼這個問題一直沒被正視——沒有人力，問題就被往後推；但 8/31 和 11 月不會再等了。

### 3.5 教育外拓

7/1 教育部門 sync 是本週資訊密度最高的會議。政府標案多線推進；客語標案已有縣市簽約，但 Michael 提醒一旦縣政府案開標，schedule 會急遽收緊，客委會端的準備工作需要提前完成。小栗方Pro 銷售本週的核心任務是從「拜訪紀錄」轉化為「有定價的 business proposal」，StevensLee 的語氣非常明確：「不是只是那個 statement…換成 business proposal」。推廣素材（7/3 deadline）與課程繁體化（本週內）同步推進，人力排序需要 leads 確認。

---

## 章節 4：跨部門協作與客戶互動

**TVBS × Media Agent 協作進展表**

| 議題 | 狀態 | 下一步 |
| ---- | ---- | ------ |
| STT / AI 字幕校正引擎 Demo | ✅ 完成（7/1，健康 2.0） | 8 月底–9 月初 TVBS 階段性展示 |
| Olapedia UI 第一輪走查 | ✅ 走查完成 | 設計端補素材；觸發流程 v1/v2 另議（7/8 前） |
| OpenMAM 用戶權限規格（JH 端） | ⚠️ 受阻 | Alex 已提醒 Dream；JH 團隊盡快提供 |
| Olapedia→MAM 詞條同步 + AAD 帳號模型 | ⚠️ 未定案 | 產品端 + 技術端本週確認；建立跨系統追蹤項目 |
| MediaAgent 版本命名對映表 | ⚠️ 未產出 | 技術 owner 7/8 前補正式口徑 |
| TVBS DGX 4 台（7/E 到位） | 🔄 進行中 | 借用 VIA DGX×2 整合測試中；QA 環境重置完成 |
| 資安報告（政府採購清單） | 🔄 進行中 | 外部公司 7/1 提交；7/7 Hard Deadline |
| 文字驅動剪輯 / 智慧直式裁切 | ⏳ 規劃中 | 分階段 / 版本化交付，不與 STT 綁定一次性推出 |
| 多 Agent 投票校正 | ⏳ 待排 | 地端 GPU 資源評估（Q3）；先以輕量 Agent 替代 |
| Op log 需求文件 | ⚠️ 待確認 | TC Peng 查找是否存在，若無則補齊 |

**教育局 / 縣市政府互動表**

| 對象 | 狀態 | 下一步 |
| ---- | ---- | ------ |
| 屏東（客語 + SEL） | 🔄 進行中 | StevensLee 8 月中下旬再拜會縣長 |
| 桃園婦幼局（SEL） | 🔄 進行中 | 討論服務對象延伸至幼齡兒少；標案持續推進 |
| 桃園少年隊（AI 資料協作） | 🔄 初步接觸 | Eddy 7/2 後整理情報；高機密資料需謹慎處理 |
| 南投（客語 + SEL + AI） | 🔄 7/3 StevensLee 拜訪 | 搭配董事長行程；目標納入政府標案 |
| 新竹縣政府（客委會案） | ⚠️ 時程模糊 | 7/8 召開專家會議；要求外包廠提供明確交付日期 |
| 基隆 | 🔄 持續追蹤 | 業務端本週補 business proposal |
| 國語日報 | 🔄 進行中 | 業務端本週補 business proposal |
| 金門 | ⏳ 目標 1–2 案 | 納入今年政府標案目標 |

---

## 章節 5：重大決策與戰略討論

**決策一：TVBS 展示暫定 8 月底至 9 月初，功能分階段交付（7/1）**

STT 與臺標檢測先行推出，文字驅動剪輯與智慧直式裁切版本化交付，不與主線功能綁定一次性推出。展示方式比照先前人臉搜尋功能上線的做法，先做內部穩定驗證，再進行客戶端初步展示，以降低提前 demo 的操作風險。Steve 建議展示時間略往後延，原因是團隊自己操作可以避開已知的坑，但客戶端上手測試再回饋的風險較高。

**決策二：Olapedia UI 走查先行，觸發流程另開議題定案（7/1）**

顏色、字型、大小等可自主掌控部分由設計端先行處理；觸發流程 v1（左側清單）vs. v2（使用者功能區塊）涉及整體操作邏輯，須另開會議討論後定案。設計稿中橫版名人示意圖換成裁切人臉特寫已確認為需修正項目。

**決策三：LearnMode 教育帳號問題列入 Q3 必解，需排入議程做決策（6/29）**

數位平台教育帳號若 11 月前未處理，現有用戶將無法登入，等同產品失效。Alex 與 Michael 確認需在 Q3 前完成是否動用 RD 的人力決策，本週 man-hour 估算（Alex 任務，7/3 due）是決策的前提資訊。這個問題不是由教育 BD 主動提出的，但它是產品能否繼續走下去的關鍵。

**決策四：學習吧「免費專區」採最小改動路線，不另建架構（7/1）**

學習吧 8/31 後被 A2 平台剔除，解法方向確認優先「既有課程改免費」而非另建架構，因為改架構的時間成本過高、時機已偏晚。需由 FED 先評估課表列表結構是否可調整，再轉 RD 協助。

**決策五：資安需求優先，其餘教育 RD 需求統一經 FED 窗口整理（7/1）**

Michael Chien 決定：除資安外，所有教育部門需求不可直接塞給 RD，一律先經 FED 接收整理，再視技術需要轉交 RD 協助。此決策旨在保護 RD 排程不被零散需求持續佔用。

**決策六：小栗方Pro 硬體板卡供應商 assessment 交由 Robert 負責（7/1）**

新供應商算力足夠（TOPS 等級）、支援周期 5–8 年、人臉辨識介面完整、語音辨識 ARM 架構。目標 7 月底完成硬體組裝定案，8 月底前可 demo 成品，台灣與大陸兩地同步推進。人臉辨識模組因技術難度較低，待語音部分完成後另外加購整合。

**決策七：V3 系統由 Robert 擔任審視窗口，深圳工廠遷廠稽核由 Robert 負責（6/30）**

V3 系統所有細節層面決策由 Robert 介入審視，確保兩岸系統與品質對齊；深圳工廠遷廠後的產線稽核報告也由 Robert 負責，與 Container 方面協調完成（Tanner 本週現場拍照記錄）。

**決策八：推廣素材優先於課程內容，本週五（7/3）前交付第一版（7/1）**

StevensLee 明確：「這個教材（推廣素材）對我來講比課程更重要。」PPT、影片、demo 範例需在 7/3 前交出第一版給 sales 端使用，課程內容往後排。

**決策九：業務端須就各已拜訪縣市提出正式 business proposal（含定價），不再停留於 statement 階段（7/1）**

StevensLee 要求本週補齊各縣市提案，含定價（9,000–15,000 元區間），以「先拿到案子」為優先，財務可行性後評估。問卷修正範圍收斂至 K–5 年級（原 K–12），7/10 完成。

**決策十：Q2 人力歸屬確認——扣除 Media Agent 與創造栗，其餘計入 TV 支援專案（7/1）**

Alex 已與 Tonny 對過，無爭議。此確認為 MBO 評核與後續資源調配提供基準。

**決策十一：新竹縣政府外包廠須提供明確交付日期，暫以合約兩個時間點為基準（7/1）**

「任何 meeting、contract 裡面沒有 schedule，這個是沒有意義的。」Eddy 今日要求外包廠提供具體交付日期（到號碼日期）；後續要求每兩週一次細部 checkpoint 計畫。

---

## 章節 6：下週重點計劃（W28，2026/07/06–07/10）

| 優先級 | 事項 | 負責人 | 截止 |
| ------ | ---- | ------ | ---- |
| P0 | 政府採購資安服務清單報告正式提交 | Alex / Steve 團隊 | 7/7（Hard Deadline） |
| P0 | OpenMAM 用戶權限對接規格提供 | JH Tseng 團隊 | 盡快（7/7 前） |
| P0 | 學習吧免費專區技術可行性評估（FED 評估課表架構） | [待確認] | 7/8 |
| P0 | LearnMode 教育帳號 Q3 人力決策（是否動用 RD） | Alex + Michael | Q3 前 |
| P1 | Olapedia UI 觸發流程（v1 vs. v2）定案會議 | Alex / Steve | 7/8 前 |
| P1 | Olapedia→MAM 詞條同步機制 + AAD 帳號權限確認 | 產品端 + 技術端 | 7/8 |
| P1 | MediaAgent 版本命名對映表產出 | 技術 owner | 7/8 |
| P1 | V3 合約台灣端使用權及 spec 授權範圍確認 | Eva Huang | 7/8（合約定案前） |
| P1 | 各縣市業務 business proposal 補齊（含定價） | [待確認] | 7/8 |
| P1 | 小栗方Pro PCB 打樣進度持續追蹤 | Luffy Luan | 7/20 目標 |
| P1 | 硬體板卡供應商 assessment（取得參考設計）| Robert | 7 月底定案 |
| P1 | 問卷第一輪修正與拜訪完成（K–5 年級） | [待確認] | 7/10 |
| P2 | Op log 需求文件查找 / 補齊 | TC Peng | 7/8 |
| P2 | 各專案 man-hour 估算（本週 Alex 任務） | Alex | 7/3（本週） |
| P2 | 台標方向與 T 台正式對齊（W26 carry-over） | Alex | 待排 |
| P2 | Kevin V3 客戶訪談，帶回售價接受範圍（W26 P0 carry-over） | Kevin Liu | 盡快 |

---

## 章節 7：風險與問題追蹤

| Risk ID | 風險描述 | 等級 | 影響範圍 | 緩解行動 |
| ------- | -------- | ---- | -------- | -------- |
| R-01 | OpenMAM 用戶權限對接規格（JH 端）未提供，Olapedia × OpenMAM API 整合停滯，工期無法估算 | 🔴 | OpenMAM 2.10 整合交付 | Alex 已提醒 Dream；需請 JH 盡快提供；無規格則整合停滯 |
| R-02 | 資安報告 7/7 Hard Deadline，政府採購資安服務清單推進的前置要件 | 🔴 | 政府採購資格 | 外部公司 7/1 提交；有缺漏即協調 Steve 團隊支援；7/7 前完成 |
| R-03 | 學習吧 8/31 後被剔除 A2 平台；教育帳號 11 月到期 | 🔴 | LearnMode 用戶存取能力 | 免費專區技術評估（FED 接需求）；Q3 人力決策；今年落實報告提交 |
| R-04 | OpenMAM 2.10 Deadline 反覆滑動，RD 形成「賴皮無後果」模式（W26 carry-over） | 🔴 | TVBS 交付時程 | Dream 重提 OKR；Alex 與 Michael 共同向上反映人力排擠問題 |
| R-05 | Olapedia→MAM 詞條同步方式未定案，AAD 管理帳號權限模型未確認 | 🔴 | Olapedia × OpenMAM 整合 | 產品端 + 技術端本週確認同步機制；建立跨系統整合追蹤項目 |
| R-06 | V3 / L1 套裝 CRD 缺失，研發路線建立在內部推測（W26 carry-over） | 🔴 | 創造栗產品商業可行性 | Kevin 安排客戶訪談（W26 P0 carry-over，仍待執行） |
| R-07 | 資安稽核新增「AI 揭露」與「對岸連線清單」要求，若未通過恐引發外界資安疑慮觀感 | 🔴 | 學習吧 / 教育平台品牌 | 7/3 提交完整報告；備妥說明話術，不主動對外公告 |
| R-08 | 創造栗人力 Q1→Q2 從 17.1mm 降至 0.95mm（-94%），業務目標未同步縮減 | 🟡 | 創造栗執行能力 | 管理層 Q3 前做出明確人力調度決策 |
| R-09 | TV Solution 人力（55.5mm）持平，但需求範圍擴大（STT 節目 + 名人庫），Q3 可能出現瓶頸 | 🟡 | TV Solution 交付穩定性 | DGX 到位後重新評估算力與人力分配 |
| R-10 | 小栗方Pro 天線廠商兩次樣品錯誤，PCB 延至 7/20 | 🟡 | 小栗方Pro 生產時程 | 本批完成後與華益召開總結會議；考慮 penalty；Tanner 現場確認 |
| R-11 | V3 合約台灣端使用權及 spec 授權範圍未明確 | 🟡 | V3 台灣端法律保障 | Eva Huang 在合約定案前主動確認並回報 |
| R-12 | 北理工合約空窗期，技術端已跑模型但法律未簽（W26 carry-over） | 🟡 | V3 研發合作法律風險 | 評估赴北京直接會晤院級主管；確認暫行協議 |
| R-13 | LearnMode 兩季人力合計僅 1.88mm，剛性問題（8/31 下架、11 月帳號到期）不會等待 | 🟡 | LearnMode 長期存續 | Q3 人力排入議程；FED 先接需求 |
| R-14 | Olapedia UI 觸發流程（v1 vs. v2）未定案，整合範圍存在不確定性 | 🟡 | OpenMAM 2.10 整合完整度 | 另開會議討論定案；先處理可自主掌控的 UI 部分 |
| R-15 | 業務端拜訪後無正式 business proposal，銷售轉化卡在 statement 層次 | 🟡 | 小栗方Pro / 教育線銷售 | StevensLee 要求本週補齊各縣市 business proposal（含定價） |
| R-16 | 新竹縣政府外包廠排程模糊（僅「8 月中」），無細部 checkpoint | 🟡 | 教育外拓外包交付 | 要求今日補明確日期；暫以合約兩個時間點為基準；雙週 checkpoint |
| R-17 | 台標方向未與 T 台正式對齊（W26 carry-over） | 🟡 | T 台客戶預期管理 | 排入 W28 執行 |
| R-18 | 多 Agent 投票校正受限地端 GPU 資源（A5000/DGX P2P 是否足夠未驗證） | 🟡 | STT 校正精度提升路徑 | Q3 資源優化評估；先以輕量本地 Agent 取代 |
| R-19 | AD / token 資安風險（W25 carry-over，討論結論未確認追蹤） | 🟡 | 系統安全性 / ISO 27001 | Alex 確認 6/19 討論結論是否已記錄並執行 |
| R-20 | 教育 BU 缺乏上位策略主軸，執行持續分散 | 🟡 | 教育 BU 資源投入效率 | 建議 Michael 主導一次教育 BU 策略盤點，明確「解決什麼教育問題」 |

---

## 章節 8：行動方案追蹤

### Media Agent 線

| 任務                                                                | 負責人             | 截止      | PgM 狀態 |
| ----------------------------------------------------------------- | --------------- | ------- | ------ |
| 提供 OpenMAM 用戶權限對接規格                                               | JH Tseng 團隊     | 盡快      | 待執行    |
| 查找 / 補齊 Olapedia Op log 需求文件                                      | TC Peng         | 7/8     | 待執行    |
| 調整 Olapedia UI 設計稿（名人圖片改為裁切人臉特寫）                                  | Sally           | 7/8     | 待執行    |
| 列出 Olapedia UI 需補齊的設計素材清單（按鈕、圖示等）                                 | Tonny Shen      | 7/8     | 待執行    |
| 確認 Olapedia UI 觸發流程（v1 vs. v2），另開定案會議                             | Alex + Steve    | 7/8 前   | 待執行    |
| 確認 Olapedia→MAM 詞條同步機制與 AAD 管理帳號權限模型                              | 產品端 + 技術端       | 7/8     | 待執行    |
| 產出 MediaAgent 版本命名對映表（Olamedia / OlaFace / OlaPedia / MAM 2.10.0） | 技術 owner        | 7/8     | 待執行    |
| 向 Dream / Michael 反映臨時性任務排擠既定人力規劃的問題                              | Alex Liao       | 7/8     | 待執行    |
| 資安相關報告 7/7 前正式完成（政府採購資安服務清單）                                      | Alex / Steve 團隊 | 7/7     | 進行中    |
| 估算各專案目前投入人力（man-hour），提供給 Dream                                   | Alex            | 7/3（本週） | 進行中    |
| Olapedia × OpenMAM 整合切入點 + 跨域可行性評估（W26 carry-over）                | Alex Liao       | 7/8     | 待執行    |
| 已上線人臉辨識產品技術文件（模型說明）                                               | Steve Liu       | 7 月底    | 待執行    |
| S3 storage 設定提供，取得後 OlaMedia / Olapedia 提出備份方案                    | Ziv → Steve Liu | 儘快      | 追蹤中    |
| AI media agent 移至 VSTS（ISO 27001）                                 | Steve / JH      | 待確認     | 待執行    |
| STT Pipeline 持續優化                                                 | Steve 團隊        | 持續      | 進行中    |
| AD / token 討論結論確認記錄並執行（W25 carry-over）                            | Alex            | 儘快      | 追蹤中    |

### TV Solution 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| 台標方向與 T 台正式對齊（偵測 + 標注定位確認）（W26 carry-over） | Alex | 待排 | 待執行 |
| T 台維運文件時程承諾（給 milestone，即使 6–9 個月後） | Alex / RD | 待排 | 待執行 |
| DGX 到位後建立 benchmark 實測排程 | Dream / Steve / Alex | 7 月底後 | 待排 |

### 創造栗 × 教育線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| 確認 V3 合約台灣端使用權及 spec 授權範圍（合約定案前） | Eva Huang | 7/8 | 待執行 |
| 拍照記錄深圳工廠遷廠後產線，產出稽核報告 | Robert | 7/8 | 待執行 |
| 赴深圳工廠現場確認天線與板子進度（Tanner 複查） | Luffy Luan | 7/8 | 待執行 |
| 本批生產完成後與華益召開總結會議，檢討天線問題 | Luffy Luan | 本批後 | 待執行 |
| 硬體板卡供應商 assessment（取得參考設計進行內部測試） | Robert | 7 月底定案 | 待執行 |
| 與 L1 西名套裝廠商溝通，評估實施方案 | Bruce Zhong | 7/8 | 待執行 |
| 提出北京英才國際學校初步方案 | Bruce Zhong | 7/8 | 待執行 |
| 赴深圳中學進行正式現場彙報（細節效果圖） | Bruce Zhong | 7/8 | 待執行 |
| 確認新竹縣政府外包廠具體交付日期，索取雙週 checkpoint 計畫 | Eddy | ASAP | 待執行 |
| 跟進桃園少年隊資料應用機會，蒐集相關情報 | Eddy | 7/2 後 | 待執行 |
| 就已拜訪縣市（雲林、國語日報、基隆、屏東等）提出正式 business proposal（含定價） | [待確認] | 7/8 | 待執行 |
| 補齊 40 校招生排程規劃（目前僅 2、3、5 校確認） | [待確認] | 7/8 | 待執行 |
| 完成問卷第一輪修正與拜訪，聚焦 K–5 年級 | [待確認] | 7/10 | 待執行 |
| 完成推廣素材（PPT、影片、demo）第一版並交付 sales | [待確認] | 7/3（本週五） | 進行中 |
| 大陸端 roadmap 繁體化與品牌 / LOGO 更新（含創造栗） | Sean | 7/3（本週五） | 進行中 |
| 評估學習吧免費專區技術可行性（課表列表結構調整） | [待確認] | 7/8 | 待執行 |
| LearnMode 教育帳號系統是否動用人力修繕，排入議程做決策 | Alex + Michael | Q3 前 | 待執行 |
| Kevin：V3 客戶訪談，帶回售價接受範圍（W26 P0 carry-over） | Kevin Liu | 盡快 | 追蹤中 |
| SEL 使用者訪談計畫提出（W26 P1 carry-over） | Eddy Lin | [已逾 7/1] | 追蹤中 |
| 台灣端 Road Map + SEL 銷售策略 update（W26 P1 carry-over） | StevenCH | [已逾 7/1] | 追蹤中 |
| 確認 Dr. Robin 顧問合作簽約事宜 | StevensLee | 7/8 | 待執行 |
| 冬令營合作企劃書準備 | Shirene | 10 月底 | 待執行 |

---

## 章節 9：關鍵時間節點與總結

**里程碑總表（W27 起往後六週）：**

| 日期 | 事項 |
| ---- | ---- |
| 7/3（本週五） | 推廣素材第一版交付 sales / 大陸端 LOGO + 品牌更新 / 教育平台資安報告提交 |
| 7/7（下週二） | 🔴 政府採購資安服務清單報告 Hard Deadline |
| 7/8（下週三） | 多項 Action Items due（Olapedia UI、V3 合約確認、業務 proposal、40 校排程等） |
| 7/10 | 問卷第一輪修正與拜訪完成（K–5 年級） |
| 7/12 | 樂高套裝大戶訂單交付（Luffy 持續追蹤） |
| 7/20 | 小栗方Pro PCB 打樣完成，逐片檢驗 |
| 7 月底 | T 台 DGX 4 台正式到位 / 硬體板卡供應商定案（Robert）/ man-hour 分配決策完成 |
| 8/31 | 🔴 學習吧被 A2 平台剔除（若免費專區方案未完成） |
| 8 月底–9 月初 | TVBS STT + 名人庫階段性展示（信心驗證） |
| 11 月 | 🔴 LearnMode 教育帳號到期（若未提前處理，用戶無法登入） |

W27 的資訊密度高，但執行卡點同樣多。7/1 Agentic 例會的 STT Demo 是本週最紮實的技術輸出，讓 TVBS 展示的路徑從模糊變得具體；但 OpenMAM 用戶權限規格的缺口讓整合工期繼續懸在空中，而這個問題的解鎖不在 Alex 或 Steve 手上，在 JH 端。下週一個硬性截止（7/7 資安）不容有任何失誤——外部公司報告若有缺漏，從 7/1 到 7/7 只剩六天補漏，時間壓力不小。

人力配置數據說的事情非常清楚：Media Agent 拿走一半研發人力是有意識的戰略押注，26Q2 MBO 均分 96.34 反映這個押注在本季是有產出的。但創造栗和 LearnMode 的業務風險並沒有隨人力縮減，8/31 和 11 月的剛性時間點只會越來越近，不會因為人力少就自動消失。Q3 規劃的核心挑戰不是 Media Agent 怎麼繼續衝，而是在現有人力格局下，創造栗和 LearnMode 的最低必要投入要如何被明確定義並落地保護。

---

## Appendix: Dashboard Export
> 本區塊由 import-draft.py 解析，供匯入 Railway Dashboard 使用。請勿手動修改欄位名稱。

### 專案進度

| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| -------- | ---- | ------ | -------- | ---- |
| OpenMAM 2.10 × Olapedia 整合 | at-risk | [keep] | UI 走查完成；JH 用戶權限規格未到，整合卡點持續 | 版本對映表待補 |
| STT / AI 字幕校正引擎 | on-track | [keep] | 健康 2.0 Demo 完成；TVBS 展示暫定 8月底–9月初 | 分階段交付確認 |
| TVBS DGX 架構 | on-track | [keep] | 無新進展；借用 VIA DGX×2 整合測試；QA 環境重置完成 | T 台 DGX 7/E 到位 |
| 資安弱掃 × 教育部採購平台 | at-risk | [keep] | 7/3 教育報告 / 7/7 Hard Deadline；稽核新增 AI 揭露要求 | 雙截止並行 |
| 小栗方Pro 硬體 | at-risk | [keep] | PCB 7/20 完成；天線延誤；Robert 接手硬體 assessment | |
| 創造栗 V3 智能車 | behind | [keep] | 無新進展；Robert 擔任 V3 審視窗口 | 合約空窗、CRD 缺失 |
| LearnMode / 學習吧 | behind | [keep] | 8/31 A2 下架 + 11月帳號到期確認；免費專區評估中 | 雙重剛性風險 |
| 教育外拓 × 小栗方Pro 銷售 | on-track | [keep] | 業務 proposal 轉化進行中；多縣市推進 | 7/3 推廣素材截止 |

### Action Items

| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| - | -------- | ------ | -------- | ---- | ---- |
| 1 | 提供 OpenMAM 用戶權限對接規格 | JH Tseng 團隊 | 盡快 | pending | technical |
| 2 | 查找 / 補齊 Olapedia Op log 需求文件 | TC Peng | 2026/07/08 | pending | technical |
| 3 | 調整 Olapedia UI 設計稿（名人圖片改裁切人臉特寫） | Sally | 2026/07/08 | pending | technical |
| 4 | 列出 Olapedia UI 需補齊設計素材清單 | Tonny Shen | 2026/07/08 | pending | technical |
| 5 | Olapedia UI 觸發流程（v1 vs. v2）定案會議 | Alex + Steve | 2026/07/08 | pending | technical |
| 6 | 確認 Olapedia→MAM 詞條同步機制與 AAD 帳號權限 | 產品端 + 技術端 | 2026/07/08 | pending | technical |
| 7 | 產出 MediaAgent 版本命名對映表 | 技術 owner | 2026/07/08 | pending | technical |
| 8 | 向 Dream / Michael 反映臨時性任務排擠人力問題 | Alex Liao | 2026/07/08 | pending | business |
| 9 | 資安報告 7/7 前完成（政府採購清單） | Alex / Steve 團隊 | 2026/07/07 | in-progress | technical |
| 10 | 估算各專案 man-hour，提供給 Dream | Alex | 2026/07/03 | in-progress | resource |
| 11 | Olapedia × OpenMAM 整合切入點 + 跨域評估 | Alex Liao | 2026/07/08 | pending | technical |
| 12 | 已上線人臉辨識技術文件（模型說明） | Steve Liu | 2026/07/31 | pending | technical |
| 13 | S3 storage 設定提供 + 備份方案 | Ziv → Steve Liu | ASAP | pending | technical |
| 14 | AI media agent 移至 VSTS（ISO 27001） | Steve / JH | [待確認] | pending | technical |
| 15 | STT Pipeline 持續優化 | Steve 團隊 | 持續 | in-progress | technical |
| 16 | AD / token 討論結論確認並執行 | Alex | ASAP | pending | technical |
| 17 | 台標方向與 T 台正式對齊（W26 carry-over） | Alex | [待排] | pending | business |
| 18 | T 台維運文件時程承諾 | Alex / RD | [待排] | pending | business |
| 19 | DGX 到位後 benchmark 排程 | Dream / Steve / Alex | 2026/07/31 後 | pending | technical |
| 20 | 確認 V3 合約台灣端使用權及 spec 授權範圍 | Eva Huang | 2026/07/08 | pending | business |
| 21 | 深圳工廠遷廠後產線稽核報告 | Robert | 2026/07/08 | pending | business |
| 22 | 赴深圳工廠確認天線 / 板子進度 | Luffy Luan | 2026/07/08 | pending | business |
| 23 | 本批完成後與華益召開總結會議（天線問題） | Luffy Luan | 本批後 | pending | business |
| 24 | 硬體板卡供應商 assessment（取得參考設計） | Robert | 2026/07/31 | pending | technical |
| 25 | L1 西名套裝廠商溝通評估 | Bruce Zhong | 2026/07/08 | pending | business |
| 26 | 北京英才國際學校初步方案 | Bruce Zhong | 2026/07/08 | pending | business |
| 27 | 深圳中學現場彙報（細節效果圖） | Bruce Zhong | 2026/07/08 | pending | business |
| 28 | 新竹縣政府外包廠交付日期確認 + 雙週 checkpoint | Eddy | ASAP | pending | business |
| 29 | 桃園少年隊資料應用情報蒐集 | Eddy | 2026/07/02 後 | pending | business |
| 30 | 各縣市正式 business proposal（含定價） | [待確認] | 2026/07/08 | pending | business |
| 31 | 40 校招生排程規劃補齊 | [待確認] | 2026/07/08 | pending | business |
| 32 | 問卷第一輪修正與拜訪（K–5 年級） | [待確認] | 2026/07/10 | pending | business |
| 33 | 推廣素材第一版交付 sales | [待確認] | 2026/07/03 | in-progress | business |
| 34 | 大陸端 roadmap 繁體化與品牌 LOGO 更新 | Sean | 2026/07/03 | in-progress | business |
| 35 | 學習吧免費專區技術可行性評估 | [待確認] | 2026/07/08 | pending | technical |
| 36 | LearnMode 教育帳號 Q3 人力決策 | Alex + Michael | Q3 前 | pending | resource |
| 37 | Kevin V3 客戶訪談（W26 carry-over） | Kevin Liu | 盡快 | pending | business |
| 38 | SEL 使用者訪談計畫提出（W26 carry-over） | Eddy Lin | [已逾期] | pending | business |
| 39 | 台灣端 Road Map + SEL 銷售策略 update（W26 carry-over） | StevenCH | [已逾期] | pending | business |
| 40 | 確認 Dr. Robin 顧問合作簽約 | StevensLee | 2026/07/08 | pending | business |
| 41 | 冬令營合作企劃書準備 | Shirene | 2026/10/31 | pending | business |

### Risks

| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| ------- | -------- | ------ | ------ | -------- |
| R-01 | OpenMAM 用戶權限規格未到，Olapedia × OpenMAM 整合停滯 | high | JH Tseng / Alex Liao | Alex 已提醒 Dream；JH 盡快提供規格 |
| R-02 | 資安報告 7/7 Hard Deadline | high | Alex Liao / Steve 團隊 | 外部公司 7/1 提交；有缺漏即協調支援 |
| R-03 | 學習吧 8/31 A2 下架 + 11 月教育帳號到期 | high | Alex Liao / Michael Chien | 免費專區評估；FED 接需求；Q3 人力決策 |
| R-04 | OpenMAM 2.10 Deadline 反覆滑動 | high | Dream Ku / Alex Liao | Dream 重提 OKR；向上反映人力排擠 |
| R-05 | Olapedia→MAM 詞條同步 + AAD 帳號未定案 | high | 產品端 + 技術端 | 本週確認同步機制；建立整合追蹤項目 |
| R-06 | V3 / L1 CRD 缺失 | high | Kevin Liu | Kevin 安排客戶訪談帶回需求 |
| R-07 | 資安稽核新增 AI 揭露 + 對岸連線清單要求 | high | Alex Liao / Michael Chien | 7/3 提交報告；備妥說明話術 |
| R-08 | 創造栗人力急遽收縮（0.95mm），業務需求不減 | medium | StevensLee / Alex Liao | 管理層 Q3 前做出明確人力決策 |
| R-09 | TV Solution 需求擴大，人力未增，Q3 可能出現瓶頸 | medium | Dream Ku / Alex Liao | DGX 到位後重新評估算力與人力 |
| R-10 | 小栗方Pro PCB 天線延誤至 7/20 | medium | Luffy Luan | 總結會議檢討；考慮 penalty；Tanner 現場確認 |
| R-11 | V3 合約台灣端使用權及 spec 授權範圍未明確 | medium | Eva Huang | 合約定案前主動確認並回報 |
| R-12 | 北理工合約空窗期 | medium | Eva Huang | 評估赴北京直接會晤；確認暫行協議 |
| R-13 | LearnMode 人力（1.88mm 兩季合計）vs 風險嚴重不匹配 | medium | Alex Liao / Michael Chien | Q3 人力決策；FED 先接需求 |
| R-14 | Olapedia UI 觸發流程未定案 | medium | Alex Liao / Steve Liu | 另開會議定案；先處理可自主掌控 UI |
| R-15 | 業務 proposal 仍停在 statement 層次 | medium | StevensLee / 業務端 | 本週各縣市提出含定價 business proposal |
| R-16 | 外包廠排程模糊（新竹縣政府） | medium | Eddy | 要求明確日期；雙週 checkpoint |
| R-17 | 台標未與 T 台正式對齊（W26 carry-over） | medium | Alex Liao | W28 排入執行 |
| R-18 | 多 Agent 校正受限地端 GPU 資源 | medium | Steve Liu | Q3 資源優化；先以輕量 Agent 取代 |
| R-19 | AD / token 資安風險（W25 carry-over） | medium | Alex Liao | 確認 6/19 討論結論是否已執行 |
| R-20 | 教育 BU 缺乏策略主軸 | medium | Michael Chien | 建議 Michael 主導一次策略盤點 |

### 里程碑

| 日期 | 里程碑事項 | 團隊 | 狀態 |
|------|-----------|------|------|
| 2026/07/03 | 推廣素材第一版交付 sales；大陸端 LOGO + 品牌更新；教育平台資安報告提交 | 教育線 / 創造栗 | upcoming |
| 2026/07/07 | 🔴 政府採購資安服務清單報告 Hard Deadline | 教育線 | upcoming |
| 2026/07/08 | 多項 Action Items due（Olapedia UI、V3 合約確認、業務 proposal、40 校排程等） | Media Agent / 創造栗 / 教育線 | upcoming |
| 2026/07/10 | 問卷第一輪修正與拜訪完成（K–5 年級） | 教育線 | upcoming |
| 2026/07/12 | 樂高套裝大戶訂單交付（Luffy 持續追蹤） | 創造栗 | upcoming |
| 2026/07/20 | 小栗方Pro PCB 打樣完成，逐片檢驗 | 創造栗 | upcoming |
| 2026/07/31 | T 台 DGX 4 台正式到位；硬體板卡供應商定案（Robert）；man-hour 分配決策完成 | TV Solution / 創造栗 / 組織管理 | upcoming |
| 2026/08/31 | 🔴 學習吧被 A2 平台剔除（若免費專區方案未完成） | 教育線 | upcoming |
| 2026/09/01 | TVBS STT + 名人庫階段性展示（信心驗證，8 月底–9 月初） | Media Agent | upcoming |
| 2026/11/30 | 🔴 LearnMode 教育帳號到期（若未提前處理，用戶無法登入） | 教育線 | upcoming |

### 下週重點

| 優先級 | 任務 | 負責人 |
| ------ | ---- | ------ |
| P0 | 政府採購資安服務清單報告提交（7/7） | Alex / Steve 團隊 |
| P0 | OpenMAM 用戶權限對接規格提供 | JH Tseng 團隊 |
| P0 | 學習吧免費專區技術可行性評估 | [待確認] |
| P0 | LearnMode 教育帳號 Q3 人力決策 | Alex + Michael |
| P1 | Olapedia UI 觸發流程定案會議 | Alex / Steve |
| P1 | Olapedia→MAM 詞條同步 + AAD 帳號確認 | 產品端 + 技術端 |
| P1 | MediaAgent 版本命名對映表產出 | 技術 owner |
| P1 | V3 合約台灣端使用權確認 | Eva Huang |
| P1 | 各縣市業務 business proposal 補齊 | [待確認] |
| P2 | Op log 需求文件查找 / 補齊 | TC Peng |
| P2 | 台標方向與 T 台正式對齊 | Alex |
| P2 | Kevin V3 客戶訪談 | Kevin Liu |
