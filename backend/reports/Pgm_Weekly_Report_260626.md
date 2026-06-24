# VIA Technologies — Program Sync 週報

---

## 章節 0：報告封面

| 欄位       | 內容                                                 |
| -------- | -------------------------------------------------- |
| **報告週期** | 2026/06/22（週一）– 2026/06/27（週五）                     |
| **報告日期** | 2026/06/25（彙整日）                                    |
| **彙整人**  | Alex Liao（PgM）                                     |
| **涵蓋團隊** | Media Agent / TV Solution / 創造栗 / LearnMode / 教育外拓 |

**來源文件清單：**

| # | 檔案名稱 | 性質 |
| --- | ------- | ---- |
| ① | `260622_Program_Progress_Follow.md` | Program Progress Follow 週例會（Alex × Michael） |
| ② | `260623_創造栗例會-小栗方-Pro.md` | 創造栗事業部週例會（StevensLee 主持） |
| ③ | `260624_教育部門-Sales-PM-RD-sync-up-mtg.md` | 教育部門 Sales × PM × RD 同步會（StevensLee 主持） |
| ④ | `260624_Agentic-Meeting.md` | Agentic 跨站技術同步（台北 × 上海，Alex × Steve × Tonny × Anna × Tom × Ziv） |

---

## 章節 1：Executive Summary

W26 三條工作線的進展性質截然不同。Agentic 線在週三的跨站技術會議中完成了幾個月來最具體的架構決策——Olapedia 名人庫 2.0 整合確認走方案二（Plugin 嵌入式），OpenMAM 2.10 人臉搜尋完成內部 Demo，DGX 採購追加 4 台合計 6 台一批出貨，台標偵測本階段定位為「偵測 + 標注」不做批量入庫。架構方向有了共識，問題是這個共識的前提——Olapedia 模糊查詢 API——還沒有人產出，整合工期因此無法評估，Demo 展示與正式功能之間的落差若在 7 月初前沒有收斂，6/24 的 Demo 就變成一個無法轉交付的展示品。創造栗線本週最大的訊號是一個壞消息被確認：V3 主控板（RDK X5）漲價近一倍，佔整體成本約 50%，且無替代方案。同週小栗方 Pro 天線打樣問題正式解決，天線板已下單排產，是難得的進展。

下週三個截止點需同步管控：加分吧弱掃廠商本週啟動、七月第一週完成，與 7/7 Hard Deadline 之間只剩一週緩衝，廠商任何延誤或 RD 補漏速度不足都會直接危及教育部採購平台續期資格；Tonny 的 Olapedia API 文件目標七月初，是 OpenMAM 整合工期的解鎖前提；Tom 的資安漏洞複現本週須給出結論，「能複現」或「需委外」兩個答案都可以，但模糊懸著會讓標案風險持續無法管理。

教育線這週兩場會議（創造栗例會 + 教育部門 sync）都暴露相同症狀：方向說清楚了，但驗收標準沒說清楚。外包廠商驗收沒有人 own、官網 owner 未被明確確認、SEL 訪談 due date 討論了多輪仍是空白。Ownership 邊界不清不只是執行效率問題，在合約已簽署的外包情境下，這直接轉化成法律談判空間的損失。

---

## 章節 2：關鍵專案進度

### 2.1 OpenMAM 2.10 × Olapedia 名人庫　🟡 方案二定案，API 缺口是主要卡點

6/24 Agentic Meeting 確認：Olapedia 名人庫 × OpenMAM 整合走方案二（Plugin 嵌入式）。名人庫 UI 保持獨立，OpenMAM 以 plug-in 跳轉方式進入，查詢透過 API 呼叫。方案選定依據：名人庫已有完整增刪改查邏輯，重新在 OpenMAM 實作工作量大且維護兩端都需更新；跳轉方式業界多產品整合慣例也是此架構。

6/24 Demo 展示了 31 筆測試資料的人臉搜尋流程：入庫 → AI 名人搜尋（上傳圖片或輸入姓名）→ 顯示符合影片清單 → 查看名人出現時間段。Demo 中發現兩個問題：文字輸入容錯不足（繁簡轉換或近似字形時無結果、無下拉建議），以及人臉出現時間段切割粒度偏粗（10 秒間距，部分畫面實際未出現該人臉）。10 秒間距已確認為目前 QA 驗收規格，使用單位若有意見再調整。

目前整合的前提條件——Olapedia 模糊查詢 API 及權限對接文件——尚未產出，Alex 的整合切入點設計、SSO token 換發機制、UI 跨域可行性評估都卡在這裡。名人庫現在 demo 環境用的是本地小庫（非正式 1.0 庫），2.0（2 萬人）月底才準備完成。

- **下一里程碑：** Olapedia 模糊查詢 API 文件（Tonny，7 月初）；Olapedia 2.0 升至 2 萬人（月底）；OpenMAM 整合切入點與跨域評估（Alex，7 月初）

### 2.2 STT / ASR Pipeline　🟡 新聞 STT Demo 進行中，下一階段切入綜藝節目

6/22 Alex × Michael 1:1 確認：週三 Demo 聚焦三項，含 STT 新聞節目字幕轉入。下一階段（綜藝節目）預計七月執行。DGX 四台機器到貨時程仍卡在確切到位日，尚無數字。

- **下一里程碑：** 新聞 STT Demo 完成（月底）；綜藝節目 STT 七月啟動

### 2.3 TVBS DGX 架構 × 歷史資料入庫　🟡 DGX 升至 6 台，一批送到

6/24 確認：原訂 2 台 T 台採購 + 追加 4 台 Media Agent，合計 6 台一批出貨，降低安裝協調成本。廠商正在安排出貨。現有 2 台先行做人臉向量入庫的算力評估；算力瓶頸評估待全部 6 台到位後重新計算。批量台標入庫的算力排程未定，DGX 資源目前優先分配給人臉向量入庫。

- **下一里程碑：** 廠商確認 DGX 6 台出貨時間（Michael，本週）；DGX 全數到位後重新評估算力分配

### 2.4 臺標偵測模組　🟢 本階段定位確認：偵測 + 標注，不做批量入庫

6/24 確認：臺標偵測 Agent 已可輸出時間軸格式，但本階段不接通 OpenMAM 入庫流程。定位為偵測結果附在影片 metadata，由 OpenMAM 審核流程呈現；版權鎖定邏輯由法務部維護台標名單（約 100 個），入庫或展示時比對決定標注狀態。此定位與 W25 討論方向一致，已在本次技術會議正式確認。

- **下一里程碑：** [本階段無新增里程碑；批量入庫排入 DGX 到位後的算力評估]

### 2.5 資安弱掃 × 教育部採購平台　🔴 7/7 Hard Deadline，廠商本週啟動、Tom 驗證缺口

教育部採購平台續期資安弱掃 7/7 Hard Deadline 持續。加分吧委外廠商弱掃本週啟動，七月第一週完成，與 7/7 只剩約一週緩衝，時間壓力極高。6/22 Alex × Michael 確認廠商本週正式啟動。

6/24 Agentic Meeting 同時暴露了另一個資安問題：凌群（外部資安廠商）針對威栗雲與加分吧的掃描報告指出相關漏洞（medium 以上），Tom 已針對 2 個問題進行修補，但複現驗證尚未完成。Tom 使用的掃描路徑未能重現報告中的漏洞，懷疑測試步驟不同，而凌群不提供工具或測試參數細節。Dream 建議用 OWASP ZAP 以 logged-in 狀態進行 full scan，Tom 本週執行。

- **下一里程碑：** 加分霸弱掃廠商完成掃描（七月第一週）；Tom 以 OWASP ZAP 掃描加分吧及威栗雲（本週）；7/7 所有系統通過

### 2.6 V3 智能自駕車　🔴 主控板漲價近一倍，CRD 缺失，合約未簽

6/23 創造栗例會確認 V3 技術路線維持純視覺方案，與特斯拉 FSD 方向一致，北理工研發團隊已開始跑模型，但院級主管因行程繁忙，合約至今未正式簽署，技術端處於合約空窗期。

主控板（RDK X5）漲價近一倍是本週最大新風險。RDK X5 在同規格裡是價格最低選項，但漲幅近 100%，主控板佔整體成本約 50%，等同整體成本增加約 25–30%。目前無替代方案。同時，V3 和 L1 套裝均已推進至 PRD 階段，但 CRD（客戶需求定義）尚未完成，商務端尚未帶回客戶端真實的售價接受度與需求規模，整個研發路線建立在內部推測而非市場驗證上。

V3 在白名單賽事上佔有自動駕駛唯一賽道，若競爭對手進入，估計仍有約一年先發優勢。從幾千元輕量套裝到數萬元自駕實驗室的完整方案設計仍在規劃中。

- **下一里程碑：** Kevin 安排客戶訪談取得售價接受範圍（下週前）；Bruce 評估 RDK X5 替代方案（[待確認]）；Eva 持續催促北理工合約簽署

### 2.7 創造栗產品線 × 小栗方Pro 生產　🟡 天線問題解決，7 月初交貨

小栗方 Pro 天線打樣問題（W25 carry-over）本週正式解決：供應商兩度送錯型號後，最終版本通過傳輸速率與傳輸距離測試，與原樣機結果一致，天線板已確認下單排產。樂高套裝各零件均已啟動生產，預計 7 月初交貨，每隔幾天 Luffy 與生產負責人確認進度。

芯片長廊業務：屏湖中學芯片展廳部署完成，所有交付工作結束，僅剩教室培訓待執行。L1 芯片套裝：清華呂教授確認設計方向，建議採用「基於模塊」方式（全加器、數據選擇器等），Bruce 本週完成細節調整。芯片競賽方向暫不主動投入，等待有合作方（可接洽政府端、有公關資源）才重啟討論。

台灣版課程文本與上海版的差異問題：台灣版目前無 IoT 功能，涉及 sensor 串接、數據抓取的原文本內容需重寫，不影響基本功能銷售但內容豐富度降低。課程優先序：教育部數位內容 > 小栗方Pro 四年級 > SEL 故事（SEL 故事排至 8 月才能開始）。

- **下一里程碑：** 小栗方Pro 天線板完整排產交期確認（Luffy，6/23 跟進後更新）；樂高套裝 7 月初交貨；L1 細節調整完成（Bruce，6/27）；Kevin V3 客戶訪談（下週前）

### 2.8 SEL 互動平台　🟡 三入口設計方向確認，需先做使用者訪談再繼續開發

6/24 教育部門 sync：Eddy Lin 展示 SEL 平台最新設計方向，從單一學生入口擴充為學生 / 家長 / 老師三個入口，加入權限管理。核心功能：情緒記錄與分析、個人化陪伴角色（可記憶使用者背景）、任務成就系統、教師儀表板。情緒生理資料預計連結繪本銷售。已自行生成約 600–1000 個情境對話，依年齡分三層。

Michael Chien 明確建議：先做使用者訪談（7–10 人，學生 / 家長 / 老師各 2–3 人），再繼續開發，working prototype 已足夠做 go-to-market 驗證。他在 TVBS 有 UX researcher 可以協助 Eddy 了解方法。Eddy 接觸了中國一個 SEL 專家及 Doctor Robin，後者同意成為顧問並授權書籍連結至平台。

- **下一里程碑：** Eddy 提出 SEL 使用者訪談計畫（7/1 前）；低、中、高年級各一本 SEL 繪本（Sophia，7 月底低年級優先）

### 2.9 教育外拓 × 小栗方Pro 推廣　🟡 40 台掛鉤銷售，縣市拜訪持續推進

6/24 確認：40 台小栗方Pro 發放必須與銷售活動掛鉤，不得單獨交付，要連結暑期營隊、數辦拜訪、或銷售談判。StevensLee 已聯繫基隆書辦主任，持續追蹤桃園、宜蘭、台南。6 月 22–23 日全國數位內容辦公室主任集會是重要接觸時機。6/25 StevensLee 帶 Grace 拜訪台北某文化中心（康主任）。

教育部預算今年比往年晚約半年，部分縣市 30–40% 款項尚未 release，但本月至下月有機會正式 release，銷售窗口仍在。學習吧因資安問題尚未解決，本波暫不排入上架，目標 8 月底 / 9 月。從業務面估算，學習吧本波缺席損失約 0.5M，但其他十幾 M 的 forecast 優先順序更高。

展示空間配置：7 月中前完成基本改善布局，目標具備科技感、能接待經銷商與客戶。賽道裝置是否引入（參考上海展區小賽道模式）待確認。

- **下一里程碑：** StevenCH 下週給出台灣 Road Map 及 SEL 銷售策略 update（7/1 前）；Grace 提出官網架構 proposal（7/1 前）；展示空間布局（Tiffany，7 月中前）

---

## 章節 3：子組進度

### 3.1 Media Agent

W26 的技術同步在架構層面完成了關鍵決策：Olapedia 整合方案二確認、台標偵測定位確認、資料庫備份架構確認（由各產品端主動驅動至 OpenMAM 的 S3）。OpenMAM 2.10 人臉搜尋 Demo 已跑起來，TVBS 看到的是功能完整的畫面，但背後的 Olapedia 模糊查詢 API 還沒有，整合工期無法評估。

資安方面有兩個並行問題：加分吧弱掃廠商本週啟動（7/7 deadline）；威栗雲資安漏洞修補的複現驗證缺口（Tom 本週以 OWASP ZAP 嘗試複現）。兩件事都需要在本週有明確結論，不能繼續掛著。DGX 6 台一批出貨是好消息，算力焦慮有望在 7 月底後緩解。

### 3.2 TV Solution

DGX 6 台一批出貨方向確認，7 月底前到新莊。入庫能力放量的時間點因此更清晰，但 TVBS 客戶在此之前仍無法搜尋歷史影片，期待管理的工作持續進行。台標方向本週在 Agentic Meeting 正式確認「偵測 + 標注」定位，不需全量批量入庫，這讓 T 台這端的交付範圍邊界更清楚了，但仍需與 T 台正式對齊此方向（作為 W25 carry-over 任務）。

### 3.3 創造栗

V3 主控板漲價問題是本週創造栗線的核心壓力，沒有替代方案、漲幅近一倍、而商務端的售價驗證工作尚未做，是一個同時需要技術面和業務面回答的問題。天線解決和樂高套裝進度是正面訊號。北理工合約空窗期每延長一天風險就多一天，赴北京直接拜訪院級主管這個選項應儘快確認。

全員 advocate 計劃啟動，Eva 兩週內完成 training materials 並安排約 20 名國內同仁完成考核，這件事在業務達成率落後的現實壓力下有其必要，但 Eva 同時還要催北理工合約、支援 V3 評估，任務排序需要 StevensLee 明確介入。

### 3.4 LearnMode / 學習吧

學習吧本波暫不排入上架，目標 8 月底 / 9 月（資安問題待解決，Media Agent 人力無法在 6 月底前大量抽調）。[本週無新進展更新]

### 3.5 教育外拓

教育部門兩場會議的共同結論是：ownership 邊界是目前執行效率的瓶頸，不是人力或資源本身。官網、外包驗收、SEL 訪談——三件事的共同問題是「有人知道要做但沒有人明確接下來」。本週的幾項決策（Grace 為官網 owner、Ruru Lin 接手外包驗收）是好的開始，但驗收標準仍然模糊。縣市拜訪持續推進，桃園、宜蘭、台南、基隆、台北文化中心都在進行中。部分縣市預算本月至下月 release，機會窗口存在但時間壓縮。

---

## 章節 4：跨部門協作與客戶互動

**TVBS × Media Agent 協作進展表**

| 議題 | 狀態 | 下一步 |
| ---- | ---- | ------ |
| OpenMAM 2.10 人臉搜尋 Demo | ✅ 完成 | 6/24 Demo 已執行；QA 以 10 秒間距為驗收基準 |
| Olapedia 名人庫整合（方案二） | ⚠️ 受阻 | Tonny API 文件 7 月初；Alex 評估整合工期 |
| DGX 6 台採購 × 出貨 | 🔄 進行中 | Michael 本週確認廠商出貨時間；7 月底到新莊 |
| 台標偵測定位確認 | ✅ 定案 | 偵測 + 標注；不做批量入庫；與 T 台正式對齊（待執行） |
| 資安漏洞修補驗證 | ⚠️ 受阻 | Tom 本週 OWASP ZAP 掃描；若無法複現評估委外 |
| AI media agent 移至 VSTS | ⏳ 待確認 | 配合 ISO 27001；Steve / JH 負責 |
| 資料訓練 config 提供 TVBS | ⏳ 待執行 | Steve Liu 技術文件，7 月底前 |
| 資料庫備份架構確認 | ✅ 定案 | 各產品端主動驅動至 S3；Steve Liu 提供備份方案（待 Ziv 提供 S3 設定） |

**教育局 / 縣市政府互動表**

| 對象 | 狀態 | 下一步 |
| ---- | ---- | ------ |
| 基隆（書辦主任） | 🔄 StevensLee 已聯繫 | 確認小栗方Pro 合作方向 |
| 桃園（客語 + 少年警察隊） | 🔄 進行中 | 持續追蹤；40 台配額優先 |
| 宜蘭 | ⏳ 待排 | StevenCH 接手，待排期 |
| 台南 | 🔄 進行中 | StevensLee 持續追蹤 |
| 台北文化中心（康主任） | 🔄 6/25 拜訪 | StevensLee + Grace；探詢科技合作 |
| 上海領港區（SEL） | 🔄 初步接觸 | SEL demo site 待定；Kevin 在上海協助 |
| 國語日報 | ⚠️ 受阻 | Jay 以 v8–9 版型重跑 demo；格式定義需有人 own |

---

## 章節 5：重大決策與戰略討論

**決策一：Olapedia 名人庫 × OpenMAM 整合採方案二——Plugin 嵌入式（6/24）**

名人庫 UI 保持獨立，OpenMAM 以 plug-in 跳轉方式連結名人庫介面，增刪改查邏輯由名人庫端維護，OpenMAM 透過 API 呼叫查詢。決策依據：工作量小、維護獨立、與業界多產品整合慣例一致。跳轉方式（另開分頁 vs. iframe）需前端工程師評估跨域可行性後確認。

**決策二：DGX 追加 4 台，合計 6 台一批出貨（6/24）**

原訂 2 台（T 台）+ 追加 4 台（Media Agent）= 6 台合計，一批出貨降低安裝協調成本。現有 2 台先行做人臉向量入庫算力評估；6 台全數到位後重新計算算力分配。

**決策三：臺標偵測本階段定位為「偵測 + 標注」，不做批量入庫（6/24）**

DGX 算力優先分配給人臉向量入庫；台標入庫需額外算力，現階段延後排程。偵測結果以時間軸格式附在影片 metadata，版權鎖定邏輯由法務部台標名單管理。

**決策四：資料庫備份由各產品端主動驅動，備份至 OpenMAM 的 S3（6/24）**

各產品（OlaMedia / Olapedia）最清楚自身最佳備份時機，外部驅動在架構上耦合度過高。OpenMAM 提供 S3 設定，上海端根據此建立備份方案。

**決策五：V3 繼續推進，但須先完成 CRD（6/23）**

V3 技術路線確認純視覺方案，但現在的研發路線建立在內部推測上——Kevin 須安排 2–3 個明確意向客戶訪談，帶回具體售價接受度與需求，再對照 RDK X5 漲價後的成本結構評估可行性。

**決策六：芯片競賽方向暫不主動投入（6/23）**

市場出口不明確、規則難定義、缺乏政府政策背書、現有客戶規模太小。等待有合作方（可接洽政府端、有公關資源）才重啟討論。芯片套裝先完成，競賽方向先觀望。

**決策七：全員 advocate 計劃啟動，兩週內完成（6/23）**

業務達成率落後，需擴大推廣人力。Eva 兩週內完成 road map、教案、training materials（含國內市場因素），並安排約 20 名國內同仁完成簡單考核，讓每位成員能向任何潛在客戶說清楚產品。

**決策八：外包廠商合約 ownership 由 Ruru Lin 接手，Eddy Lin 退出驗收（6/24）**

Eddy Lin 同時是外包專案發起人與驗收人，形成球員兼裁判的狀態。Ruru Lin 接手 end-to-end，Eddy 退出驗收，專注 SEL 開發。合約當初驗收條款未明確載明，Ruru Lin 本週調出合約逐條確認。

**決策九：SEL 先做使用者訪談，再繼續開發（6/24）**

working prototype 已足夠做 go-to-market 驗證，用最低成本向真實用戶學習。訪談目標 7–10 人（學生 / 家長 / 老師各 2–3 人），Michael 協助安排 UX research 資源。

**決策十：學習吧本波暫不排入上架，目標 8 月底 / 9 月（6/24）**

資安問題尚未解決，Media Agent 人力 6 月底前無法大量抽調。本波損失估算約 0.5M，但其他十幾 M 的 forecast 優先順序更高。[注：StevensLee 6/24 下午開會後是否有進一步調整待確認]

**決策十一：課程內容優先序：教育部數位內容 > 小栗方Pro 四年級 > SEL 故事（6/24）**

與銷售直接相關者優先。SEL 故事排至 8 月才能開始。小栗方Pro 四年級課程文本已有預修改版本，但平台尚未進去，需補製操作動線說明與截圖。

---

## 章節 6：下週重點計劃（W27，2026/06/29–07/03）

| 優先級 | 事項 | 負責人 | 截止 |
| ------ | ---- | ------ | ---- |
| P0 | 加分霸弱掃廠商掃描完成並提交 RD 補漏清單 | 採購 / IT / Tom | 7/1（七月第一週）|
| P0 | Olapedia 模糊查詢 API 文件 + 權限對接規格（整合工期前提） | Tonny Shieh | 7/1–7/3 |
| P0 | Tom：OWASP ZAP logged-in 掃描結論（能複現 / 需委外） | Tom Liu | 6/27（本週五）|
| P0 | Kevin：安排客戶訪談，取回 V3 售價接受範圍 | Kevin Liu | 7/3 前 |
| P0 | DGX 6 台廠商出貨時間確認 | Michael | 6/26 |
| P1 | 官網架構 proposal（含互動方案選項） | Grace | 7/1 |
| P1 | 台灣端 Road Map + SEL 銷售策略 update | StevenCH | 7/1 |
| P1 | SEL 使用者訪談計畫提出 | Eddy Lin | 7/1 |
| P1 | Olapedia × OpenMAM 整合切入點與跨域可行性初評 | Alex | 7/1–7/3 |
| P1 | 小栗方Pro 天線板完整交期確認 | Luffy | 本週已追跡 |
| P1 | L1 套裝細節調整完成 | Bruce Zhong | 6/27 |
| P1 | 外包廠商合約驗收條款調出確認 | Ruru Lin | 6/26 |
| P2 | Eva 全員 advocate training materials 進度追蹤 | Eva Huang | 7/7 |
| P2 | 國語日報 demo 以 v8–9 版型重跑（Jay） | Jay | 待確認 |
| P2 | 展示空間布局方案提出 | Tiffany | 7 月中 |

---

## 章節 7：風險與問題追蹤

| Risk ID | 風險描述 | 等級 | 影響範圍 | 緩解行動 |
| ------- | -------- | ---- | -------- | -------- |
| R-01 | 資安弱掃 7/7 Hard Deadline，廠商本週啟動、補漏時間不到兩週 | 🔴 | 教育部採購平台 / 加分霸 | 廠商掃描七月第一週完成；RD 預先確認補漏人力；7/7 前所有系統通過 |
| R-02 | 資安漏洞複現驗證缺口（Tom 無法重現凌群報告的漏洞） | 🔴 | 威栗雲 / 加分吧資安標案 | Tom 本週 OWASP ZAP logged-in 模式嘗試複現；若仍失敗評估委外費用 |
| R-03 | V3 主控板（RDK X5）漲價近一倍，無替代方案，成本結構惡化 | 🔴 | V3 智能車商業可行性 | Kevin 訪談客戶取回售價接受範圍；Bruce 啟動替代主控板調研 |
| R-04 | V3 / L1 套裝 CRD 缺失，研發空轉風險 | 🔴 | 創造栗產品線 | Kevin 安排 2–3 個明確意向客戶訪談，下週例會前帶回結構化需求資訊 |
| R-05 | Olapedia API 延遲，OpenMAM 整合工期無法評估 | 🔴 | OpenMAM 2.10 整合交付 | Tonny 7 月初確認 API 文件；Alex 待 API 後才評估整合工期與設計 |
| R-06 | 外包廠商合約驗收條款不完整，ownership 交接後談判空間受限 | 🔴 | 教育外拓外包專案 | Ruru Lin 本週調出合約，逐條確認是否有可補充附件或備忘錄 |
| R-07 | 教育線 H2 forecast 缺口（carry-over） | 🔴 | 教育 BU 年度業績 | 全員 advocate 計劃；40 台掛鉤銷售；縣市拜訪持續推進 |
| R-08 | 小栗方Pro IoT 數據無法串接創造栗平台，台灣版課程豐富度降低 | 🔴 | 課程銷售可行性 | 台灣版課程文本重寫（不含 sensor 串接內容）；確認無 IoT 版的銷售可行性 |
| R-09 | 北理工合約空窗期，技術端已跑模型、法律未簽 | 🟡 | V3 研發合作 | 評估赴北京拜訪直接會晤院級主管；確認工作成果歸屬的暫行協議 |
| R-10 | TVBS DGX 入庫期待管理，6 台 7 月底才到位 | 🟡 | TVBS 客戶期待 | 7 月底前持續對齊等待期期待；到位後立即 benchmark |
| R-11 | Olapedia × OpenMAM 跨域 / SSO 技術障礙未評估 | 🟡 | 方案二整合完整度 | Alex 指定前端工程師本週評估跨域可行性與工期 |
| R-12 | 學習吧上架時程未拍板（6/24 下午公司會議後待確認） | 🟡 | 教育線本波 forecast | Ruru Lin 今日公司會議後即時確認 Michael，業務端需明確數字 |
| R-13 | 政府客戶拜訪後無人主動 own，follow-up 空窗 | 🟡 | 教育外拓銷售轉化 | 每個縣市指定單一 owner；追蹤表建立 |
| R-14 | Eva 單點負荷過重（全員 training + 北理工催約 + V3 評估支援） | 🟡 | 創造栗執行效率 | StevensLee 介入任務排序；確認三項任務優先順序與可協助人力 |
| R-15 | V3 車合約 PRD 缺口與延遲罰則（carry-over） | 🟡 | V3 法律保障 | PRD 納入合約附件；延遲罰則按天計算；法務流程中持續追蹤 |
| R-16 | PgM 跨部門介入邊界無正式共識（JH 團隊三角溝通） | 🟡 | 跨部門風險管理效率 | Alex × Michael 就跨部門邊界做明確認知對齊 |
| R-17 | STT 談話性節目 benchmark 缺口（carry-over） | 🟡 | STT 差異化策略 | 差異化轉向編輯 UX；健康 2.0 案例累積 |
| R-18 | 台標方向未與 T 台正式對齊（carry-over） | 🟡 | T 台客戶預期 | 儘早確認 T 台台標使用情境，避免全量標注需求反彈 |
| R-19 | AD / token 資安風險（carry-over，W25 專題討論結論尚未追蹤） | 🟡 | 系統安全性 / ISO 27001 | 確認 6/19 AD/token 討論結論是否已記錄並執行 |
| R-20 | 教育 BU 缺乏上位策略主軸，執行持續分散 | 🟡 | 教育 BU 資源投入效率 | 建議 Michael 進場做一次教育 BU 策略盤點，明確「解決什麼教育問題」 |

---

## 章節 8：行動方案追蹤

### Media Agent 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| 產出 Olapedia 模糊查詢 API 文件及權限對接規格 | Tonny Shieh | 7 月初 | 待執行 |
| OpenMAM × Olapedia UI 跳轉切入點、跨域問題、SSO token 換發機制評估 | Alex Liao | 7 月初 | 待執行 |
| Olapedia UI 風格規範確認，提供統一設計規範給上海（Sally 參與） | Alex Liao | 7 月初 | 待執行 |
| OWASP ZAP logged-in 模式掃描加分吧及威栗雲 | Tom Liu | 本週 | 進行中 |
| 已上線人臉辨識產品技術文件（模型說明） | Steve Liu | 7 月底 | 待執行 |
| S3 storage 設定提供，取得後 OlaMedia/Olapedia 提出備份方案 | Ziv → Steve Liu | 儘快 | 待執行 |
| AI media agent 移至 VSTS（ISO 27001） | Steve / JH | 待確認 | 待執行 |
| STT Pipeline 持續優化 | Steve 團隊 | 持續 | 進行中 |
| OpenMAM Face API 整合（6/30，carry-over） | Steve Liu 團隊 | 06/30 | 進行中 |
| 弱掃廠商掃描完成，RD 補漏清單執行 | 採購 / IT / Tom | 7/1（七月第一週）| 進行中 |
| 向 SQA 部門取 OpenShare 完整測試環境，交 Sally 做 OpenEditor 畫面設計 | Alex | 本週 | 進行中 |
| AD / token 討論結論確認記錄並執行（W25 carry-over） | Alex | 儘快 | 追蹤中 |
| 確認 DGX 6 台廠商出貨時間 | Michael | 6/26 | 待執行 |

### TV Solution 線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| 台標方向與 T 台正式對齊（偵測 + 標注定位確認） | Alex | 待排 | 待執行 |
| T 台維運文件時程承諾（給 milestone，即使 6–9 個月後） | Alex / RD | 待排 | 待執行 |
| DGX 入庫後建立 benchmark 實測排程 | Dream / Steve / Alex | 7 月底後 | 待排 |

### 創造栗 × 教育線

| 任務 | 負責人 | 截止 | PgM 狀態 |
| ---- | ------ | ---- | -------- |
| Kevin：安排 V3 客戶訪談，帶回售價接受範圍 | Kevin Liu | 7/3 前 | 待執行 |
| Bruce：L1 套裝細節調整完成 | Bruce Zhong | 6/27 | 進行中 |
| Bruce：RDK X5 替代方案或設計降成本調研 | Bruce Zhong | [待確認] | 待執行 |
| Eva：持續催促北理工教授完成合約簽署 | Eva Huang | 持續跟進 | 進行中 |
| 小栗方Pro 天線板完整排產交期確認 | Luffy Luan | 已追蹤 6/23 | 進行中 |
| 小栗方Pro 6/30 交貨追蹤（carry-over） | Luffy Luan | 06/30 | 進行中 |
| 樂高套裝工廠進度追蹤（每隔幾天確認） | Luffy Luan | 7 月初 | 進行中 |
| Eva：road map、教案、training materials（含國內市場因素） | Eva Huang | 07/07 | 進行中 |
| Eva：安排約 20 名國內同仁完成產品推廣考核 | Eva Huang | 07/07 | 待執行 |
| V3 車合約 PRD 納入附件 + 延遲罰則明確化（carry-over） | Eva / 法務 | 法務流程中 | 進行中 |
| 創造栗 5 項產品前 3 項（探空氣球、氣象雷達、無線電通訊） | Sophia 等 | 月底 | 進行中 |
| Grace：提出官網架構 proposal（含互動方案選項） | Grace | 7/1 | 待執行 |
| StevenCH：台灣端產品線 Road Map + SEL 銷售策略 update | StevenCH | 7/1 | 待執行 |
| Eddy Lin：SEL 使用者訪談計畫（7–10 人） | Eddy Lin | 7/1 | 待執行 |
| Ruru Lin：接手外包廠商聯絡與驗收；調出合約確認驗收條款 | Ruru Lin | 本週內啟動 | 進行中 |
| Sophia：小栗方Pro 四年級課程文本 + 操作動線說明與截圖 | Sophia | 8 月前 | 進行中 |
| Sophia：SEL 繪本故事各年級各一本（低年級優先） | Sophia | 7 月底（低年級）| 待執行 |
| Jay：以 v8–9 版型重跑國語日報 demo | Jay | 待確認 | 待執行 |
| Tiffany：展示空間改善布局方案 | Tiffany | 7 月中前 | 待執行 |
| 政府客戶 follow-up owner 追蹤表建立（carry-over） | Alex / PgM | 待確認 | 待執行 |
| 未來 6 個月 AI / Agent / Skill Roadmap（carry-over） | Stevens Lee + 台灣團隊 | 7 月初 | 待執行 |
| Q2 MBO 內容完成（carry-over） | 各負責人 | 06/26 | 進行中 |
| Aurora RI 續約費 NT$98,000 預算規劃（carry-over） | Alex / PM / 財務 | 08/01 前 | 待執行 |
| AI 認證 MVP 開發（carry-over） | Alger Wang | 07/18 | 進行中 |

---

## 章節 9：關鍵時間節點與總結

**里程碑總表（W26 起往後六週）：**

| 日期 | 事項 |
| ---- | ---- |
| 06/24（本週，已完成）| OpenMAM 2.10 + Olapedia 內部 Demo；Agentic 架構決策定案 |
| 06/25 | StevensLee + Grace 拜訪台北文化中心（康主任） |
| 06/26 | Q2 MBO 內容完成 |
| 06/27 | Bruce L1 細節調整完成；Tom OWASP ZAP 掃描結論 |
| 06/30 | 小栗方Pro 目標交貨；OpenMAM Face API 整合完成；樂高套裝目標交貨 |
| 07/01 | Olapedia API 文件（Tonny）；Grace 官網 proposal；StevenCH Road Map；Eddy SEL 訪談計畫 |
| 07/07 | **資安弱掃 Hard Deadline — 加分霸 / 創造力 / 學習吧** |
| 07/07 | Eva 全員 advocate training materials + 考核完成 |
| 07/15 | SEL 使用者訪談執行完成（建議 deadline） |
| 07/中 | 展示空間基本布局完成 |
| 07/18 | AI 認證 MVP 展示（Alger Wang） |
| 07/底 | DGX 6 台到新莊，入庫能力正式放量；Steve Liu 人臉辨識技術文件 |
| 08/01 | Aurora RI 續約費預算規劃截止 |
| 08/底 | SEL 正式推出；學習吧目標上架 |
| 09/底 | V3 智能車 demo；創造栗 5 項產品全部完成 |
| 2027/03 | V3 智能車到貨 |

W26 在幾個月來最多的架構決策中收尾：方案二確認、台標定位確認、DGX 6 台方向確認。但每個決策背後都有一個尚未鎖定的前提——API 還沒有、客戶售價驗證還沒有、合約還沒有簽。下週的核心任務是把這些「方向共識」轉成「可執行的前提條件」：Tonny 的 API 文件、Kevin 的客戶訪談回報、Tom 的資安複現結論，這三件事都不能繼續以「進行中」掛著。7/7 弱掃 Hard Deadline 是目前整個組織最近的剛性關卡，廠商啟動後 RD 補漏的速度是關鍵，需要從現在開始預先確認人力 ready。

---

## Appendix: Dashboard Export
> 本區塊由 import-draft.py 解析，供匯入 Railway Dashboard 使用。請勿手動修改欄位名稱。

### 專案進度

| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
| -------- | ---- | ------ | -------- | ---- |
| OpenMAM 2.10 × Olapedia 名人庫整合 | at-risk | [keep] | 方案二定案；Demo 完成；Olapedia API 尚未產出；整合工期待評估 | 跨域 / SSO 技術可行性待評估 |
| STT / ASR Pipeline | on-track | [keep] | 新聞 STT Demo 進行中；下一階段綜藝節目七月啟動 | DGX 到貨前算力有限 |
| TVBS DGX 架構 × 歷史資料入庫 | at-risk | [keep] | DGX 升至 6 台一批出貨；7 月底到新莊；入庫期待管理持續 | 台標入庫延後排程 |
| 臺標偵測模組 | on-track | [keep] | 偵測 + 標注定位確認；不做批量入庫；與 T 台正式對齊待執行 | API 介面技術上可提供 |
| V3 智能自駕車 | behind | [keep] | 主控板漲價近一倍；CRD 缺失；北理工合約未簽 | Kevin 本週安排客戶訪談 |
| 創造栗產品線 × 小栗方Pro 生產 | at-risk | [keep] | 天線問題解決、下單排產；樂高套裝 7 月初；台灣版無 IoT 課程重寫 | 6/30 交貨壓力持續 |
| SEL 互動平台 | at-risk | [keep] | 三入口設計確認；先做使用者訪談再繼續開發（Michael 建議） | 訪談計畫 7/1 前提出 |
| 教育外拓 × 小栗方Pro 推廣 | at-risk | [keep] | 40 台掛鉤銷售；縣市拜訪持續；學習吧本波延至 8–9 月 | 教育部預算本月至下月 release |
| 資安弱掃 × 教育部採購平台 | behind | [keep] | 廠商本週啟動；7/7 Hard Deadline；Tom 資安漏洞複現缺口 | 兩個並行資安問題 |
| L1 芯片套裝 | at-risk | [keep] | 清華呂教授確認方向；Bruce 細節調整本週完成；競賽方向暫不主動投入 | CRD 缺失問題同 V3 |

### Action Items

| # | 任務描述 | 負責人 | 目標日期 | 狀態 | 分類 |
| --- | -------- | ------ | -------- | ---- | ---- |
| 1 | Olapedia 模糊查詢 API 文件及權限對接規格 | Tonny Shieh | 2026/07/01 | pending | technical |
| 2 | OpenMAM × Olapedia 整合切入點、跨域、SSO 評估 | Alex Liao | 2026/07/03 | pending | technical |
| 3 | Olapedia UI 風格規範確認，提供給上海 | Alex Liao | 2026/07/03 | pending | technical |
| 4 | OWASP ZAP 掃描加分吧及威栗雲 | Tom Liu | 2026/06/27 | in-progress | technical |
| 5 | 已上線人臉辨識技術文件 | Steve Liu | 2026/07/31 | pending | technical |
| 6 | S3 storage 設定 + OlaMedia 備份方案 | Ziv / Steve Liu | [待確認] | pending | technical |
| 7 | Kevin：V3 客戶訪談，取回售價接受範圍 | Kevin Liu | 2026/07/03 | pending | business |
| 8 | Bruce：L1 套裝細節調整完成 | Bruce Zhong | 2026/06/27 | in-progress | technical |
| 9 | Bruce：RDK X5 替代方案調研 | Bruce Zhong | [待確認] | pending | technical |
| 10 | 持續催促北理工合約簽署 | Eva Huang | 持續 | in-progress | business |
| 11 | 小栗方Pro 天線板完整交期確認 | Luffy Luan | 2026/06/23 已跟進 | in-progress | business |
| 12 | 小栗方Pro 6/30 交貨追蹤 | Luffy Luan | 2026/06/30 | in-progress | business |
| 13 | 樂高套裝工廠進度追蹤 | Luffy Luan | 2026/07/01 | in-progress | business |
| 14 | Eva：全員 advocate training materials | Eva Huang | 2026/07/07 | in-progress | business |
| 15 | 官網架構 proposal | Grace | 2026/07/01 | pending | business |
| 16 | 台灣端 Road Map + SEL 銷售策略 | StevenCH | 2026/07/01 | pending | business |
| 17 | SEL 使用者訪談計畫 | Eddy Lin | 2026/07/01 | pending | business |
| 18 | 外包廠商合約接手、驗收條款確認 | Ruru Lin | 2026/06/26 | in-progress | business |
| 19 | 小栗方Pro 四年級課程文本 + 操作動線說明 | Sophia | 2026/08 前 | in-progress | business |
| 20 | SEL 繪本故事（低年級優先） | Sophia | 2026/07/31 | pending | business |
| 21 | 國語日報 v8–9 版型 demo | Jay | [待確認] | pending | technical |
| 22 | 展示空間改善布局方案 | Tiffany | 2026/07/15 | pending | business |
| 23 | 確認 DGX 6 台廠商出貨時間 | Michael | 2026/06/26 | pending | business |
| 24 | Q2 MBO 內容完成 | 各負責人 | 2026/06/26 | in-progress | business |
| 25 | Aurora RI 續約費預算規劃 | Alex / 財務 | 2026/08/01 | pending | resource |
| 26 | AI 認證 MVP 開發 | Alger Wang | 2026/07/18 | in-progress | technical |
| 27 | 政府客戶 follow-up owner 追蹤表建立 | Alex / PgM | [待確認] | pending | business |
| 28 | 未來 6 個月 AI / Agent / Skill Roadmap | Stevens Lee + 台灣團隊 | 2026/07 初 | pending | business |
| 29 | AD / token 討論結論確認記錄並執行 | Alex | 儘快 | in-progress | technical |
| 30 | 台標方向與 T 台正式對齊 | Alex | 待排 | pending | business |

### Risks

| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
| ------- | -------- | ------ | ------ | -------- |
| R-01 | 資安弱掃 7/7 Hard Deadline，補漏時間不足兩週 | high | IT / Tom / Alex | 廠商七月第一週完成；RD 預確認補漏人力 |
| R-02 | 資安漏洞複現驗證缺口 | high | Tom Liu | OWASP ZAP 本週掃描；失敗則評估委外 |
| R-03 | V3 主控板漲價近一倍，無替代方案 | high | Kevin / Bruce | 客戶售價訪談；替代主控板調研 |
| R-04 | V3 / L1 套裝 CRD 缺失 | high | Kevin Liu | 安排意向客戶訪談，帶回結構化需求 |
| R-05 | Olapedia API 延遲，整合工期無法評估 | high | Tonny Shieh | 7 月初 API 文件完成作為硬截止點 |
| R-06 | 外包合約驗收條款不完整 | high | Ruru Lin | 本週調出合約逐條確認 |
| R-07 | 教育線 H2 forecast 缺口 | high | 黎博 / 全教育線 | 全員 advocate；縣市拜訪推進 |
| R-08 | 小栗方Pro 台灣版無 IoT，課程豐富度降低 | high | Sophia / Alex | 文本重寫，確認無 IoT 版銷售可行性 |
| R-09 | 北理工合約空窗期 | medium | Eva Huang | 評估赴北京直接拜訪院級主管 |
| R-10 | TVBS DGX 入庫期待管理 | medium | Steve / Alex | 持續對齊等待期；到位後立即 benchmark |
| R-11 | Olapedia × OpenMAM 跨域 / SSO 技術障礙 | medium | Alex Liao | 前端工程師本週評估可行性 |
| R-12 | 學習吧上架時程未拍板 | medium | Ruru Lin | 6/24 公司會議後即時確認 |
| R-13 | 政府客戶拜訪後無人 own | medium | Alex / Sales | 指定單一 owner；建立追蹤表 |
| R-14 | Eva 單點負荷過重 | medium | StevensLee | 任務排序明確介入；確認可協助人力 |
| R-15 | V3 合約 PRD 缺口與延遲罰則 | medium | Eva / 法務 | PRD 納入附件；按天計算罰則 |
| R-16 | PgM 跨部門邊界無正式共識 | medium | Alex / Michael | Alex × Michael 做一次邊界對齊討論 |
| R-17 | STT 談話性節目 benchmark 缺口 | medium | Steve / Tonny | 差異化轉向編輯 UX；案例累積 |
| R-18 | 台標未與 T 台正式對齊 | medium | Alex | 儘早確認 T 台台標使用情境 |
| R-19 | AD / token 資安結論未追蹤 | medium | Alex | 確認 6/19 討論結論記錄與執行 |
| R-20 | 教育 BU 無策略主軸 | medium | Michael / 黎博 | 建議 Michael 進場做一次策略盤點 |

### 下週重點

| 優先級 | 任務 | 負責人 |
| ------ | ---- | ------ |
| P0 | 加分霸弱掃廠商掃描完成並提交補漏清單 | 採購 / IT / Tom |
| P0 | Olapedia 模糊查詢 API 文件 | Tonny Shieh |
| P0 | OWASP ZAP 掃描結論（能複現 / 需委外） | Tom Liu |
| P0 | Kevin：V3 客戶訪談取回售價接受範圍 | Kevin Liu |
| P0 | DGX 6 台廠商出貨時間確認 | Michael |
| P1 | 官網架構 proposal | Grace |
| P1 | 台灣端 Road Map + SEL 銷售策略 update | StevenCH |
| P1 | SEL 使用者訪談計畫提出 | Eddy Lin |
| P1 | Olapedia 整合切入點與跨域可行性初評 | Alex |
| P1 | 外包廠商合約驗收條款確認 | Ruru Lin |
| P2 | Eva 全員 advocate training 進度追蹤 | Eva Huang |
| P2 | 國語日報 v8–9 demo 重跑 | Jay |

### 里程碑
| 日期 | 里程碑事項 | 團隊 | 狀態 |
|------|-----------|------|------|
| 2026/06/24 | OpenMAM 2.10 + Olapedia 內部 Demo；Agentic 架構決策定案 | Media Agent | done |
| 2026/06/25 | StevensLee + Grace 拜訪台北文化中心 | 教育線 | done |
| 2026/06/26 | Q2 MBO 內容完成 | 全團隊 | upcoming |
| 2026/06/27 | Bruce L1 細節調整完成；Tom OWASP ZAP 掃描結論 | 創造栗 / TV Solution | upcoming |
| 2026/06/30 | 小栗方Pro 目標交貨；OpenMAM Face API 整合完成；樂高套裝目標交貨 | 創造栗 / Media Agent | upcoming |
| 2026/07/01 | Olapedia API 文件（Tonny）；Grace 官網 proposal；StevenCH Road Map；Eddy SEL 訪談計畫 | Media Agent / 教育線 | upcoming |
| 2026/07/07 | 資安弱掃 Hard Deadline — 加分霸 / 創造力 / 學習吧 | 全團隊 | upcoming |
| 2026/07/07 | Eva 全員 advocate training materials 考核完成 | 組織管理 | upcoming |
| 2026/07/15 | SEL 使用者訪談執行完成 | 教育線 | upcoming |
| 2026/07/18 | AI 認證 MVP 展示（Alger Wang） | Media Agent | upcoming |
| 2026/07/31 | DGX 6 台到新莊，入庫能力正式放量；Steve Liu 人臉辨識技術文件 | Media Agent | upcoming |
| 2026/08/01 | Aurora RI 續約費預算規劃截止 | 組織管理 | upcoming |
| 2026/09/30 | V3 智能車 demo；創造栗 5 項產品全部完成 | 創造栗 | upcoming |
