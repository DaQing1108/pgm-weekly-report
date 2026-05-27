# VIA Technologies — Program Sync 週報

---

## 章節 0：報告封面

| 欄位 | 內容 |
|------|------|
| **報告週期** | 2026/05/25（週一）– 2026/05/29（週五） |
| **報告日期** | 2026/05/27（彙整日） |
| **彙整人** | Alex Liao（PgM） |
| **涵蓋團隊** | Media Agent / TV Solution / 創造栗 / LearnMode / 教育外拓 |

**來源文件清單：**

| # | 檔案名稱 | 性質 |
|---|----------|------|
| ① | `260525_Program_Progress_Follow.md` | Program Progress Follow 週例會（Alex × Michael） |
| ② | `260526_創造栗例會-小栗方-Pro.md` | 創造栗週例會（Stevens Lee 主持，展廳業務 & 晶片選型 & 閉環生態系戰略） |
| ③ | `260527_教育部門-Sales-PM-RD-sync-up-mtg.md` | 教育部門 Sales × PM × RD 同步會（Stevens Lee 主持） |
| ④ | `260527_Agentic-Meeting.md` | Agentic Platform 技術同步會（Alex × Michael × Dream × Steve × JH × Anna） |
| ⑤ | `260527_PM_Tasks_OpenTasks.md` | PgM 項目追蹤快照（2026/05/27 截圖） |

---

## 章節 1：Executive Summary

本週最緊迫的問題出現在 5/27 Agentic Meeting：500TB 歷史片庫的入庫時間，從之前流傳的「2–3 週」被 Steve 重算為約 **141 天**。這不只是估算修正，而是直接衝擊 TVBS 上線後「歷史資料能否搜尋」的承諾——若入庫要半年，使用者搜尋 2022–2023 年素材時會一無所獲。這個數字必須在 DGX 實機上重新 benchmark，並在交付提案前就讓 TVBS 理解入庫的分階段現實。

同一天，5/25 Program Progress Follow 揭露 API Interface 對齊存在盲點：上週五 JH 與上海團隊的 API 討論幾乎只涵蓋 Ola Media，Ola Pedia 是否納入 2.10 沒有人正式承接，NLP API 也沒有 Steve 的明確回應。這兩件事若不在本週三例會前補確認，6 月底的交付目標就會懸空。Agentic Meeting 也同步定案 Open Edit Plus / Media Clip 的架構路線：AI 深度互動型的影音編輯不能拆成零散的 OpenMAM API call，必須以完整 subsystem 實作，OpenMAM 只管 input / output / storage 邊界。

教育線這週密集跑點，雲林土庫有最強的積極回應——處長表態 10–20 萬預算「沒問題」，是目前縣市拓展中進度最快的節點。同時，金門機會正式評估，金城幼兒園與文化局的切入路線具體可行。L1 庫存危機則是另一條警示線：近 20 個月無人處理，百萬以上庫存閒置，Grace 接手後需在下週 Weekly 提出 Promotion Package 方案。

下週管理層需要追蹤的三件事：DGX benchmark 是否如期完成（直接決定能否對 TVBS 誠實說明入庫時程）；Ola Pedia 2.10 範圍是否明確承接（不確認就拖到整合測試才發現）；雲林土庫的合作方案是否本週出文（有意願的縣市要趁熱跟進）。

---

## 章節 2：關鍵專案進度

### 2.1 OpenMAM 2.10 × 人臉識別整合　🟡 API 對齊有盲點，Ola Pedia 範圍待釐清

5/27 Agentic Meeting 對 2.10 的整合方向做了幾項重要釐清。人臉搜尋的 UI 確定採 **B1 原生整合**：在 OpenMAM 既有介面內增加搜尋入口與搜尋框，AI Server 透過 `search video by name` / media agent API 回傳 media ID，OpenMAM 再查回 metadata 呈現。這比 chat-style 的 B2 更適合 2.10 的範疇，Steve 也認同。

但 5/25 Program Progress Follow 指出 API 對齊的缺口：上週五的 API 討論幾乎都聚焦 Ola Media，**Ola Pedia 是否納入 2.10 仍無人正式承接**，NLP API 也沒有 Steve 的正面回應。Anna 表示不確定時程，Steve 在會議中未明確表態。本週三 double check 是補救的最後時機。

- **下一里程碑：** 本週三 API 文件規格 double check（Alex / JH / Anna / Steve）；確認 Ola Pedia 2.10 範圍（JH / Dream / Steve / Anna）；6/24 Logo + OpenMAM Demo（Steve 確認 OK）；6 月底 Face API 對接完成

### 2.2 Open Edit Plus / Media Clip　🟡 架構方向定案，產品型態仍需收斂

5/27 Agentic Meeting 形成本週最重要的架構共識：AI 影音編輯涉及素材檢索、STT、文字導向剪輯、cut point 微調、片段銜接、使用者行為記憶等連續工作流，**不能拆成一個個 OpenMAM API call**，必須作為完整 plugin / subsystem / standalone entity 設計。OpenMAM 與 AI editing entity 之間仍有 API，但 API 只負責 input / output / storage / metadata 邊界，不應把 AI editing 內部每個小動作都外部化。

5/25 Program Progress Follow 則指出文件目前最弱的兩塊是技術架構與交付時程——Tom 需評估 OpenEdit web-based 擴展邊界，Alex 需細化 interface 與 spec。若這個 subsystem 以 plugin 方式實作，未來打包成獨立 app 也更容易，standalone 產品路線保持開放。

- **下一里程碑：** Steve 補充 AI editing plugin / subsystem 架構想法（共編文件）；Alex 與 JH 確認前端責任邊界；Tom 評估 OpenEdit web 擴展邊界

### 2.3 TVBS DGX 部署與歷史片庫入庫　🔴 入庫時間重算至 141 天，期待管理是核心風險

本週最大的風險升級在入庫時程。Steve 在 5/27 Agentic Meeting 重算：500TB ≈ 20,000 小時影片，以入庫時間約影片長度 17% 計算，需約 3,400 小時，換算成日曆時間約 **141 天**——原本流傳的「2–3 週」估算已無效。這會直接影響 TVBS 上線後對歷史素材可搜尋性的期待。

採購方面，WenChi 已同意採購，供應商本週回來報價（原有 2 台 + 追加 4 台，合計 6 台規模的報價）。若供應商有庫存，約 3 週可到貨，粗估 **6 月下旬**；若無庫存則延後。Olapedia Server 退役設備需求已確認應向 TVBS IT 詢問，Dream後續發信給 TVBS IT / 明智 / Michael 確認。

- **下一里程碑：** Steve 提供 DGX 實測 benchmark（單台 / 多台每 TB 入庫時間）；待 benchmark 後重新估算 500TB 入庫時程並提出 policy 建議；Romeo / TVBS IT 評估 4 台 DGX 機房部署位置、電力與網路

### 2.4 STT / 語音轉文字　🟡 技術邊界待確認，8 月 demo 目標不變

NLP API 未被正式承接的問題，也連帶影響 STT 在 Media Clipper / 快剪架構中的定位。5/25 Program Progress Follow 推測上海團隊可能從既有新聞架構延伸到節目 STT 與快剪場景，高算力需求可能透過 Gemini 或本地模型補強，但這部分需要 Steve 進一步說明，不能只靠文件描述推論。節目 STT demo 目標仍維持 **8 月底**，前提是技術架構、算力需求、離線落地方式本週三前有初步釐清。

- **下一里程碑：** Alex / Tonny 對齊 Devops 開發項目，確認 STT、字幕生成現況；NLP API 是否另開會議討論（可能與 Media Clipper 一起）

### 2.5 小栗方 Pro（創造栗）　🟢 晶片暫定 X5，閉環生態系路線定調

5/26 創造栗例會，Robert 說明 X5 成本：晶片 ¥549、載板近期漲至 ¥900（物料漲價），整機估算已超過 ¥1,500 人民幣。X7 具備 Edge 端無風扇、30–40 TOPS 的優勢，但正式推出後產品成熟可能要到明年中，開發完成預計 2028 年，schedule 風險過高。Stevens Lee 決定目前**觀望 X7**，暫以 X5 推進。

更重要的是 Stevens Lee 的戰略定調：「如果沒有閉環，做出來的東西只是一塊板子，是沒有意義的。」致勝關鍵不在有沒有好板子或 FSD，而在能否建立完整的 Ecosystem 與多個閉環。台灣市場因自駕車法規走得較慢，V3 需考慮台灣專屬用途，在 Road Map 上這是有說服力的展示點。

- **下一里程碑：** 推進展廳三點（蘋果中學活動待通知、去勤股中學新店佈置完成、鵬林展廳 6 月中旬開幕）；Stevens Lee 6 月中旬確認台灣市場用途方向

### 2.6 教育縣市拓展與 UGC 飛輪　🟢 雲林突破，金門評估中，L1 庫存危機啟動

5/27 教育部門例會密度最高的一場。雲林土庫是本週最具體的突破：處長表態 10–20 萬預算「沒問題」，全力配合，需本週出合作方案文件趁熱跟進。金門機會正式評估，現任縣長幾乎確定連任，金城幼兒園可從 SEL 平台出發（50–100 萬預算），文化局方向是大國中心在地化（金門戰地文化主題）。

Stevens Lee 也提出 UGC 飛輪策略應對 2% 活躍率問題：KOL 客戶主動追蹤 + 使用影片上傳抽獎 + 官網曝光 + 線上比賽機制，Janet 6 月底前交出初步成果。L1 人工智能庫存約 20 個月無人處理（Wi-Fi 版 4 台 + 無 Wi-Fi 版 40 台 + 整盒 138 盒），Grace 接手，下週 Weekly 提出 Promotion Package 方案。

- **下一里程碑：** 雲林土庫合作方案本週提出；金門幼兒園 SEL 方案與文化局客製化教案方向確認；Grace 下週 Weekly 提出 L1 Promotion Package；Janet 6 月底第一次 UGC/KOL 成果檢視

---

## 章節 3：子組進度

### 3.1 Media Agent

本週 Media Agent 的討論主要在兩個方向交疊推進。一是 OpenMAM 2.10 與 AI Server 的整合邊界逐漸清楚：OpenMAM 管理 media metadata，AI Server 管理 AI metadata，雙方透過 `ssid` / media ID 串接；搜尋結果由 AI Server 回傳 ID，OpenMAM 查回 metadata 呈現給使用者。這個資料流已在本週達成雙方共識。

二是 Open Edit Plus / Media Clip 的架構方向在本週的 Agentic Meeting 中被 Steve 明確定義：AI editing 是高度 AI-interactive 的連續工作流，不能被拆碎成 API 功能清單。這個架構觀點已被 Alex 與 Steve 確認，後續需要 Tom 在 OpenEdit web UI 的擴展邊界上給出技術判斷，Alex 則從產品端補齊 spec 與 interface。

向量庫備份的長期管理也在本週會議中被正視：短期先提供 API / storage location 讓 AI Server 推送備份，避免 DGX 問題後需重新入庫；長期的 disaster recovery、incremental backup、purge policy 留待後續設計。

### 3.2 TV Solution

TVBS 這條線本週最重要的發展是 DGX 採購與入庫時程的雙重更新。採購方向明確，供應商報價本週回來，到貨粗估 6 月下旬。但 Steve 重算的入庫時程（141 天）是一個必須在提案前讓 TVBS 理解的數字。若 TVBS 預期上線當天就能搜尋過去 5 年的素材，這個落差要提早溝通，不能等整合測試才發現。

Olapedia Server 的退役設備需求本週才被正式討論，Alex 需發信給 TVBS IT / 明智 / Michael 確認。台北整合測試環境的計畫也已提出，6 月中旬目標：部署 OpenMAM 2.10 + AI Server，透過正式 API 跑入庫 sample，驗完再移至 TVBS 現場。

### 3.3 創造栗

本週創造栗例會以三個主軸推進。展廳業務三點齊動：蘋果中學待學校通知（本週四或五），去勤股中學新店展廳拆包佈置進行中，鵬林展廳 6 月中旬開幕，已完成現場佈置與運營方的初步股本溝通。Stevens Lee 特別強調，展廳建好之後的後續活動規劃同樣重要，Bruce 需補充說明蘋果中學展廳的活動計畫。

晶片選型方面，X5 暫定、X7 觀望的決定已定案，載板漲價後整機成本超過 ¥1,500 是目前成本壓力的主要來源。Stevens Lee 的閉環生態系定調是本次例會最具戰略意義的一段講話，明確指出比賽功能、教育功能、整體系統建置三者缺一不可，Eva 的系統性思考框架獲得肯定。

### 3.4 LearnMode / 學習吧

本週無新更新。

### 3.5 教育外拓

本週教育線跑點密度高，涵蓋面最廣的一場例會。雲林土庫是最具體的進展，處長表態意願清晰。金門機會正式評估，縣長連任幾乎確定，透過 TVBS 蔡姓主管接觸到對方，幼兒園 + 文化局兩個切入點都具體可行。花蓮 + 宜蘭排定 6 月中旬同行，基隆因議會質詢延至 6 月初，高雄 + 屏東由 Tiffany 與 Stevens Lee 分工接觸。

學術合作方面，郭教授電話未接通，改透過 Line 聯繫；資工系教授合作以小栗方 Pro 教案交換為切入點；陳秀玲教授的高職情緒學習平台與 SEL 有潛在結合點，Stevens Lee 計劃本週聯繫。

---

## 章節 4：跨部門協作與客戶互動

**TVBS 協作進展表**

| 議題 | 狀態 | 下一步 |
|------|------|--------|
| DGX 採購（4 台） | 🔄 進行中 | 報價本週回來，到貨預估 6 月下旬 |
| Olapedia Server 退役設備確認 | 🔄 進行中 | Alex 發信給 TVBS IT / 明智 / Michael |
| OpenMAM 2.10 API 對接 | 🔄 進行中 | 本週三 double check；6 月底完成 |
| 500TB 歷史片庫入庫時程 | ⚠️ 受阻 | Steve 需用 DGX 實測 benchmark；入庫 policy 待提案 |
| 台北整合測試環境建立 | ⚠️ 待啟動 | 6 月中旬目標，Alex / 阿華 / Steve 推進 |
| TVBS 機房 DGX 部署位置 | ⚠️ 待評估 | Romeo / TVBS IT 評估電力、空間、網路 |
| Logo + OpenMAM Demo | 🔄 進行中 | 6/24 里程碑（Steve 確認 OK） |

**教育局 / 縣市政府互動表**

| 對象 | 狀態 | 下一步 |
|------|------|--------|
| 雲林土庫（處長） | 🟢 積極推進 | 本週出合作方案，聯繫陳亞主任確認推進 |
| 金門縣府 / 金城幼兒園 | 🔄 進行中 | 幼兒園 SEL 方案 + 文化局在地化教案方向確認 |
| 花蓮 + 宜蘭 | 📅 排定 | 6 月中旬同行 |
| 基隆 | ⏳ 延後 | 因議會質詢延至 6 月初 |
| 高雄 | 🔄 進行中 | Tiffany 透過 TVBS 人脈協助約訪 |
| 屏東 | 🔄 進行中 | Stevens Lee 直接聯繫舊識（前縣長顧問） |
| 新竹縣 | ⚠️ 待跟進 | 新竹縣主任向局長報告中，StevenCH 追蹤進度 |
| 台南 + 嘉義 | 📅 下半年 | 去年已拜訪，規劃下半年再訪 |

---

## 章節 5：重大決策與戰略討論

**決策一：Open Edit Plus / Media Clip 作為完整 subsystem / plugin 設計（2026/05/27）**

Steve 在 Agentic Meeting 明確提出：AI 影音編輯涵蓋多輪連續 AI 推理，不能被拆碎成 OpenMAM 的零散 API call。OpenMAM 的 API 只負責素材取得、metadata 串接、儲存與結果回寫等邊界行為；AI editing 內部的 cut point 判斷、segment selection、個人化偏好、場景切換等均應在 AI editing subsystem 內部完成。這個架構同時保留未來打包成 standalone product 的可能性。

**決策二：OpenMAM 2.10 人臉搜尋採 B1 原生整合，NLP 為搜尋理解而非多輪對話（2026/05/27）**

2.10 短期不做 chat-style B2 介面，在 OpenMAM 既有 UI 中加入搜尋入口即可。NLP 的定位是讓搜尋字串稍微彈性（如用自然語句描述），後台稍微理解語意，不是多輪對話。若效能不達標，可撤回純向量檢索。名人庫管理（新增、編輯）應走 admin / plugin 路線，一般使用者不需要進入名人庫管理頁面。

**決策三：500TB 入庫時程需 DGX 實測 benchmark，2–3 週估算無效（2026/05/27）**

Steve 重算後，500TB 歷史片庫可能需要約 141 天才能完成入庫，與先前流傳的「2–3 週」落差巨大。後續需要用實際 DGX 機器測試單台 / 多台 throughput，提出入庫 policy 建議，並在 TVBS 端做期待管理。

**決策四：多台 DGX 採 workload scheduler 分配，不急著做跨機 stack（2026/05/27）**

多台 DGX 提升併發與效率，透過 AI Server 內部的 priority queue 分配：新入庫優先、歷史片庫次優先、新片空閒時才跑歷史片庫。只有單一 job 超出單機 GPU memory 能力時，才考慮跨機 stack / cluster。

**決策五：小栗方 Pro 晶片暫以 X5 推進，X7 觀望（2026/05/26）**

X7 Edge 端無風扇規格有吸引力，但產品成熟時間預計明年中以後，開發完成估計 2028 年，schedule 風險過高。現有 Mounting 架構理論上可延伸相容 X7，但 SDK 大幅改寫的費用是主要顧慮。Stevens Lee 決定暫以 X5 推進，持續觀察 X7 發展。

**決策六：閉環生態系是小栗方 Pro 致勝關鍵，非板子本身（2026/05/26）**

Stevens Lee 明確定調：公司能否成功不取決於有沒有一塊好板子或 FSD，而在於能否建立完整的 Ecosystem 與多個閉環（競賽、教育、整體系統建置）。台灣市場因法規因素，V3 需要設計台灣專屬用途，而非直接套用比賽規格。

---

## 章節 6：下週重點計劃（W23，2026/06/01–06/05）

| 優先級 | 事項 | 負責人 | 截止 |
|--------|------|--------|------|
| P0 | Steve 提供 DGX 入庫 benchmark（單台 / 多台每 TB 入庫時間） | Steve | 儘早，本週 |
| P0 | Ola Pedia 2.10 範圍確認（是否納入 2.10，對應 API 範圍與時程） | JH / Dream / Steve / Anna | 本週三例會前 |
| P0 | NLP API 是否另開會議對齊，可能與 Media Clipper 一起討論 | Alex / Steve | 本週安排 |
| P0 | 雲林土庫後續合作方案提出，聯繫陳亞主任確認推進 | Sales（Tiffany 協助） | 本週 |
| P0 | Alex 發信詢問 TVBS IT 是否有可供 Olapedia Server 使用的退役設備 | Alex | 本週 |
| P1 | Open Edit Plus B2 文件 + Media Clip MRD 核心邏輯補齊 | Alex | 本週 |
| P1 | Steve 在共編文件補充 AI editing plugin / subsystem 架構想法 | Steve | 下次討論前 |
| P1 | 與 JH 確認 Open Edit Plus 前端責任邊界 | Alex / Michael | 待安排 |
| P1 | TVBS IT 評估 4 台 DGX 機房部署位置、電力、網路 | Romeo / TVBS IT | 報價確認前 |
| P1 | 台北整合測試環境建立計畫確認 | Alex / 阿華 / Steve | 6 月中旬 |
| P1 | Eddy 注音校正 Cloud 轉譯測試，比較效率後決定方案 | Eddy | 5/28（本週四） |
| P1 | Eddy AI 玩偶 / SEL 平台完整成本試算表丟至群組 | Eddy | 本週 |
| P1 | Janet UGC/KOL 追蹤機制 + 比賽 Promotion 方案第一版 | Janet | 6 月底前第一次成果檢視 |
| P2 | Grace L1 人工智能產品資料整理 + Promotion Package 方案 | Grace | 下週 Weekly |
| P2 | 陳秀玲教授：聯繫探討 SEL 平台合作 | Stevens Lee | 本週 |
| P2 | 金門幼兒園 SEL + 文化局在地化教案方向確認 | Stevens Lee + Grace | 近期 |

---

## 章節 7：風險與問題追蹤

| Risk ID | 風險描述 | 等級 | 影響範圍 | 緩解行動 |
|---------|----------|------|----------|----------|
| R-01 | STT 談話性節目（少康等）ASR 準確率無 benchmark，問題在模型不在算力 | 🔴 | Steve Liu | 差異化轉向編輯 UX；模型選型原則需在 AI Server 架構中定義 |
| R-02 | 500TB 歷史片庫入庫時間從 2–3 週重算至約 141 天，TVBS 期待管理風險高 | 🔴 | Steve / Alex | Steve 用 DGX 實測 benchmark 提出準確數字；入庫 policy 與優先順序在提案前對 TVBS 說明清楚 |
| R-03 | Ola Pedia 2.10 範圍未正式承接，NLP API 尚未被 Steve 回應，整合計畫有缺口 | 🟡 | Alex / JH / Anna / Steve | 本週三例會前補確認；必要時將 Ola Pedia 與 NLP 獨立開會對齊 |
| R-04 | DGX-3 並發上限僅 4–5 人（5 秒 / 次），TVBS 若 40–50 人同時使用架構不足 | 🟡 | Dream | 提案前確認 TVBS 日常同時使用人數；多台 DGX 並行為擴展路線 |
| R-05 | 向量庫 single instance 無容錯，DGX 新機穩定度未驗證，AI 產物若遺失需重新入庫 | 🟡 | Steve / JH | Backup 機制列入 2.10；先提供 API / storage location 讓 AI Server 推送備份 |
| R-06 | 小栗方 Pro token 成本過高，AI 玩偶 SEL 場景每用戶每月 600–1,000 TWD，商業模式難打平 | 🟡 | Eddy | 導入 Local Hybrid LLM，目標壓至 300 TWD 以下；完整試算表本週出爐 |
| R-07 | 三 RD 團隊（JH / Steve / TC）整合困難，1–2 個月磨合期 | 🟡 | Dream / Alex | 持續透過 Agentic Meeting 拉近距離；Dream 希望由 Tonny 往下走 |
| R-08 | FDE 台灣只有 Eddy 一人，單點風險高，出問題無人即時處理 | 🟡 | Michael / 黎博 | 先前端後後端分階段交付；Michael Transition 會議已啟動 |
| R-09 | AI 模型大陸口音 / 用語問題，台灣政治敏感場合失分風險 | 🟡 | Alex | Demo 管控原則全員落實；長期更換或微調 TW 版模型 |

---

## 章節 8：行動方案追蹤

### Media Agent 線

| 任務                                                 | 負責人                         | 截止              | PgM 狀態 |
| -------------------------------------------------- | --------------------------- | --------------- | ------ |
| API 文件規格 double check（Ola Media / Ola Pedia / NLP） | Alex / JH / Anna / Steve    | 2026/05/27（本週三） | 進行中    |
| Ola Pedia 2.10 範圍確認（API 範圍、時程、責任窗口）                | JH / Dream / Steve / Anna   | 2026/05/27 前    | 待確認    |
| NLP API 對齊會議評估（可與 Media Clipper 一起討論）              | Alex / Steve / 上海團隊         | 待安排             | 待執行    |
| Open Edit Plus B2 文件 + Media Clip MRD 核心邏輯補齊       | Alex                        | 2026/05/27（原預計） | 進行中    |
| Steve 補充 AI editing plugin / subsystem 架構想法（共編文件）  | Steve                       | 下次討論前           | 待執行    |
| 與 JH 確認 Open Edit Plus 前端責任邊界（OpenMAM vs. AI team） | Alex / Michael / JH         | 待安排             | 待執行    |
| Media Clipper 技術邊界評估（Tom 評估 OpenEdit web 擴展）       | Tom / Alex                  | 進行中             | 進行中    |
| Devops 開發項目對齊（STT、字幕生成現況確認）                        | Alex / Tonny                | 待 follow        | 待執行    |
| Steve 提供 DGX 入庫 benchmark（單台 / 多台每 TB 入庫時間）        | Steve                       | 儘早，不等 6 月中旬     | 待執行    |
| 重新估算 500TB / 全片庫入庫時間，提出入庫 policy 建議                | Steve / Alex                | benchmark 後     | 待執行    |
| 定義 AI Server 向量庫 / AI 產物推送到 OpenMAM / S3 的 API     | OpenMAM team / Steve team   | 整合前需初版          | 待執行    |
| 向量庫備份、snapshot、purge、disaster recovery 長期策略設計      | OpenMAM team / Steve team   | 後續設計            | 待執行    |
| 釐清名人庫 admin UI 入口、權限與 plugin 整合方式                  | Alex / Steve / OpenMAM team | 後續討論            | 待執行    |
| AI Sharing                                         | Alex                        | 2026/06/06      | 進行中    |
| 與 Tonny 對齊 QA 人力實際工作內容                             | Alex                        | TBD             | 待執行    |
| 整理 OpenMAM / Open Edit Plus / 獨立產品 MRD 文件方向        | Alex                        | TBD             | 進行中    |

### TV Solution 線

| 任務                                                   | 負責人                       | 截止            | PgM 狀態 |
| ---------------------------------------------------- | ------------------------- | ------------- | ------ |
| 發信詢問 TVBS IT 是否有可供 Olapedia Server 使用的退役設備           | Alex                      | 會後立即          | 待執行    |
| 整理 Olapedia / 相關 server spec（以前次 demo VM spec 為基礎）   | Steve / Alex              | 待確認           | 進行中    |
| TVBS IT 評估 4 台 DGX 機房部署位置、電力、網路                      | Romeo / TVBS IT / Michael | 採購交期確認前       | 待執行    |
| 台北建立類 TVBS 整合測試環境（驗 OpenMAM 2.10 + AI Server + 入庫流程） | Alex / JH / Steve team    | 6 月中旬         | 待執行    |
| DGX 採購報價確認（供應商本週回報 6 台規模報價）                          | Michael                   | 2026/05/27 週內 | 追蹤中    |

### 創造栗 × 教育線

| 任務 | 負責人 | 截止 | PgM 狀態 |
|------|--------|------|---------|
| 雲林土庫後續合作方案提出，聯繫陳亞主任確認推進 | Sales（Tiffany 協助） | 本週 | 待執行 |
| 攝影合約：局處長口頭同意，立即約簽約 | 負責同仁 | 立即 | 待執行 |
| Janet UGC/KOL 追蹤機制 + 比賽 Promotion 方案 | Janet | 6 月底（第一次成果檢視） | 待執行 |
| UGC 影片使用權 Disclaimer 條款詢問法務 | Jenny / Ruru | 本週 | 待執行 |
| Ruru 社群內容主題表 + SEO 題目清單，發給 Grace、Eddy | Ruru | 本週 | 待執行 |
| Eddy AI 玩偶 / SEL 平台完整成本試算表丟至群組 | Eddy | 本週 | 待執行 |
| Eddy 注音校正 Cloud 轉譯測試，比較效率後決定最終方案 | Eddy | 2026/05/28（本週四） | 待執行 |
| Grace L1 人工智能產品資料整理 + Promotion Package 方案 | Grace | 下週 Weekly | 待執行 |
| 金門幼兒園 SEL 方案 + 文化局在地化教案方向確認 | Stevens Lee + Grace | 近期 | 待執行 |
| 陳秀玲教授：聯繫探討 SEL 平台合作 | Stevens Lee | 本週 | 待執行 |
| 高雄拜訪：Tiffany 透過 TVBS 人脈協助約訪 | Tiffany | 近期 | 待執行 |
| 花蓮拜訪：Stevens Lee 6 月中安排 | Ruru（提醒跟進） | 6 月中 | 追蹤中 |
| Sophia 聯繫蒲公英基金會窗口（SEL 合作探詢）[carry-over] | Sophia | 2026/05/27 | 追蹤中 |
| Eddy 評估 token 成本模型（RAG-only + to B vs. to C） | Eddy | TBD | 進行中 |
| 每年級各製作 2 篇繪本 demo（附 AI 旁白語音）[carry-over] | 課程團隊 | 2026/07/01 | 待執行 |
| 確認 Michael FDE 課程開課時間，通知第一批成員 | Eddy | TBD | 待執行 |
| 蘋果中學活動通知後協調支援人員 | Bruce | 待學校通知 | 待確認 |
| 去勤股中學新店展廳拆包佈置完成 | Bruce | 本週 | 進行中 |
| 鵬林展廳 6 月中旬開幕活動細節確認 | Bruce | 6 月中 | 進行中 |
| 申請公司 Claude 帳號（走請購單流程） | 有需求同仁 | 本週 | 待執行 |
| StevenCH 追蹤新竹縣主任向局長報告進度 [carry-over] | StevenCH | 進行中 | 追蹤中 |

---

## 章節 9：關鍵時間節點與總結

**里程碑總表（W22 起往後六週）：**

| 日期 | 事項 |
|------|------|
| 05/27（本週） | Eddy 注音校正 Cloud 轉譯測試；Ola Pedia 2.10 範圍確認例會；Open Edit Plus B2 文件初版 |
| 05/28（本週四） | Eddy 注音校正 Cloud 轉譯測試截止 |
| 05/29（本週五） | 雲林土庫合作方案提出 |
| 06/01–06/05（W23） | Steve DGX benchmark 結果出爐；入庫 policy 提案；基隆拜訪安排 |
| 06/06 | Alex AI Sharing 截止 |
| 06/10 附近 | 基隆拜訪（延至 6 月初） |
| 06/15 附近 | 花蓮 + 宜蘭拜訪；台北整合測試環境啟動 |
| 06/15–06/20 | 鵬林展廳開幕活動 |
| 06/24 | Logo + OpenMAM Demo（TVBS，Steve 確認 OK） |
| 06/30 | Face API 對接完成；Janet UGC/KOL 第一次成果檢視；AI 玩偶 SEL 成本試算定案 |
| 07/01 | 繪本 demo（每年級 2 篇）目標 |
| 07/31–08/01 | OpenMAM 2.10 正式交付 TVBS 客戶端；節目 STT demo 前置準備完成 |
| 08/31 | 節目 STT Demo 目標 |

本週在技術線和教育線各自出現了一個需要立即處理的問題。技術線的 141 天入庫估算不是一個可以壓後再說的數字，它直接影響 TVBS 對系統價值的認知，必須在 DGX 到貨前就讓對方理解分階段入庫的現實。Ola Pedia 2.10 未被正式承接的問題也是同樣性質——不在本週三補確認，6 月底的交付目標就沒有可靠的技術基礎。教育線最有希望的一個點是雲林土庫，有意願的縣市窗口要趁熱跟進，不能讓它冷下去。Open Edit Plus 的架構已在本週定調，Steve 和 Alex 對 subsystem 路線有共識，接下來是把文件和技術邊界跟上。

---

## Appendix: Dashboard Export
> 本區塊由 import-draft.py 解析，供匯入 Railway Dashboard 使用。請勿手動修改欄位名稱。

### 專案進度

| 專案名稱 | 狀態 | 進度 % | 本週更新 | 備註 |
|----------|------|--------|----------|------|
| OpenMAM 2.10 × 人臉識別整合 | at-risk | [keep] | API 對齊發現 Ola Pedia 範圍缺口；B1 UI 方向定案；本週三 double check | Ola Pedia 2.10 範圍待正式承接 |
| Open Edit Plus / Media Clip | at-risk | [keep] | 架構定案：完整 subsystem，不拆散為 OpenMAM API；B2 文件補齊中 | 技術架構與交付時程仍是最弱環節 |
| TVBS DGX 部署與歷史片庫入庫 | at-risk | [keep] | 500TB 入庫時間從 2–3 週重算至約 141 天；DGX 報價本週回來；到貨 6 月下旬 | 入庫 policy 與期待管理是當前首要任務 |
| STT / 語音轉文字 | at-risk | [keep] | NLP API 尚未被正式承接；技術邊界待本週三確認；8月 demo 目標不變 | 待 Devops 對齊技術現況 |
| 小栗方 Pro（創造栗） | on-track | [keep] | 晶片暫定 X5（X7 觀望）；閉環生態系戰略定調；展廳三點推進中 | 載板漲至 ¥900，整機成本超 ¥1,500 |
| 教育縣市拓展 | on-track | [keep] | 雲林土庫強力突破；金門機會正式評估；花蓮 6 月中安排 | 基隆延至 6 月初 |
| UGC 飛輪策略 | on-track | [keep] | Stevens Lee 定調策略方向；Janet 接手 Owner；6 月底第一次成果檢視 | 目前活躍率約 2%，爆發點需 5%+ |
| L1 人工智能庫存清理 | at-risk | [keep] | Grace 接手；近 20 個月無人處理；下週 Weekly 提出 Promotion Package 方案 | 百萬以上庫存閒置 |

### Action Items

| #   | 任務描述                                               | 負責人                       | 目標日期        | 狀態          | 分類        |
| --- | -------------------------------------------------- | ------------------------- | ----------- | ----------- | --------- |
| 1   | API 文件規格 double check（Ola Media / Ola Pedia / NLP） | Alex / JH / Anna / Steve  | 2026/05/27  | in-progress | technical |
| 2   | Ola Pedia 2.10 範圍確認（API 範圍、時程、責任窗口）                | JH / Dream / Steve / Anna | 2026/05/27  | pending     | technical |
| 3   | NLP API 對齊會議評估                                     | Alex / Steve              | 待安排         | pending     | technical |
| 4   | Open Edit Plus B2 文件 + Media Clip MRD 核心邏輯補齊       | Alex                      | 2026/05/27  | in-progress | business  |
| 5   | Steve 補充 AI editing plugin / subsystem 架構想法（共編文件）  | Steve                     | 下次討論前       | pending     | technical |
| 6   | 與 JH 確認 Open Edit Plus 前端責任邊界                      | Alex / Michael            | 待安排         | pending     | technical |
| 7   | Media Clipper 技術邊界評估（Tom 評估 OpenEdit web 擴展）       | Tom / Alex                | 進行中         | in-progress | technical |
| 8   | Devops 開發項目對齊（STT、字幕生成現況）                          | Alex / Tonny              | 待 follow    | pending     | technical |
| 9   | Steve 提供 DGX 入庫 benchmark（單台 / 多台每 TB 入庫時間）        | Steve                     | 儘早          | pending     | technical |
| 10  | 重新估算 500TB / 全片庫入庫時間並提出入庫 policy 建議                | Steve / Alex              | benchmark 後 | pending     | technical |
| 11  | 定義 AI Server 向量庫推送到 OpenMAM / S3 的 API             | JH / Steve                | 整合前         | pending     | technical |
| 12  | 向量庫備份、snapshot、purge 長期策略設計                        | JH/ Steve                 | 後續          | pending     | technical |
| 13  | 釐清名人庫 admin UI 入口、權限與 plugin 整合方式                  | Alex / Steve / JH         | 後續          | pending     | technical |
| 14  | Text-Based AI Video Editor                         | Alex                      | 2026/05/22  | in-progress | technical |
| 15  | AI Sharing                                         | Alex                      | 2026/06/06  | in-progress | business  |
| 16  | 與 Tonny 對齊 QA 人力實際工作內容                             | Alex                      | TBD         | pending     | resource  |
| 17  | 整理 OpenMAM / Open Edit Plus / 獨立產品 MRD 文件方向        | Alex                      | TBD         | in-progress | business  |
| 18  | 發信詢問 TVBS IT Olapedia Server 退役設備                  | Alex                      | 立即          | pending     | business  |
| 19  | TVBS IT 評估 4 台 DGX 機房部署位置、電力、網路                    | Romeo / TVBS IT           | 採購交期前       | pending     | technical |
| 20  | 台北建立類 TVBS 整合測試環境                                  | Alex / JH / Steve         | 6 月中旬       | pending     | technical |
| 21  | DGX 採購報價確認                                         | Michael                   | 本週          | in-progress | business  |
| 22  | 雲林土庫後續合作方案提出                                       | Sales / Tiffany           | 本週          | pending     | business  |
| 23  | Janet UGC/KOL 追蹤機制 + 比賽 Promotion 方案               | Janet                     | 6 月底        | pending     | business  |
| 24  | Eddy AI 玩偶 / SEL 平台成本試算表                           | Eddy                      | 本週          | pending     | business  |
| 25  | Eddy 注音校正 Cloud 轉譯測試                               | Eddy                      | 2026/05/28  | pending     | technical |
| 26  | Grace L1 人工智能 Promotion Package 方案                 | Grace                     | 下週 Weekly   | pending     | business  |
| 27  | 金門幼兒園 SEL + 文化局在地化教案方向確認                           | Stevens Lee + Grace       | 近期          | pending     | business  |
| 28  | 陳秀玲教授聯繫探討 SEL 平台合作                                 | Stevens Lee               | 本週          | pending     | business  |
| 29  | 每年級各製作 2 篇繪本 demo（附 AI 旁白語音）                       | 課程團隊                      | 2026/07/01  | pending     | business  |


### Risks

| Risk ID | 風險描述 | 嚴重度 | 負責人 | 因應措施 |
|---------|----------|--------|--------|----------|
| R-01 | STT 談話性節目 ASR 準確率無 benchmark，問題在模型不在算力 | high | Steve Liu | 差異化轉向編輯 UX；模型選型原則在 AI Server 架構中定義 |
| R-02 | 500TB 歷史片庫入庫時間從 2–3 週重算至約 141 天，TVBS 期待管理風險高 | high | Steve / Alex | DGX 實測 benchmark；入庫 policy 在提案前對 TVBS 說明 |
| R-03 | Ola Pedia 2.10 範圍未正式承接，NLP API 尚未被 Steve 回應 | medium | Alex / JH / Anna / Steve | 本週三例會前補確認；必要時獨立開會對齊 |
| R-04 | DGX-3 並發上限僅 4–5 人，TVBS 若 40–50 人同時使用架構不足 | medium | Dream | 提案前確認 TVBS 日常同時使用人數；多台 DGX 並行為擴展路線 |
| R-05 | 向量庫 single instance 無容錯，DGX 新機穩定度未驗證 | medium | Steve / JH | Backup 機制列入 2.10；先提供 API / storage location 讓 AI Server 推送備份 |
| R-06 | 小栗方 Pro token 成本過高，AI 玩偶 SEL 場景每用戶每月 600–1,000 TWD | medium | Eddy | 導入 Local Hybrid LLM，目標壓至 300 TWD 以下 |
| R-07 | 三 RD 團隊整合困難，1–2 個月磨合期 | medium | Dream / Alex | 持續透過 Agentic Meeting 拉近距離 |
| R-08 | FDE 台灣只有 Eddy 一人，單點風險高 | medium | Michael / 黎博 | 先前端後後端分階段交付；Michael Transition 會議已啟動 |
| R-09 | AI 模型大陸口音 / 用語問題，政治敏感場合失分風險 | medium | Alex | Demo 管控原則全員落實；長期更換或微調 TW 版模型 |

### 下週重點

| 優先級 | 任務                                       | 負責人                       |
| --- | ---------------------------------------- | ------------------------- |
| P0  | Steve 提供 DGX 入庫 benchmark                | Steve                     |
| P0  | Ola Pedia 2.10 範圍確認                      | JH / Dream / Steve / Anna |
| P0  | NLP API 對齊會議評估                           | Alex / Steve              |
| P0  | 雲林土庫後續合作方案提出                             | Sales / Tiffany           |
| P0  | Dream 發信詢問 TVBS IT Olapedia Server 退役設備  | Dream                     |
| P1  | Open Edit Plus B2 文件 + Media Clip MRD 補齊 | Alex                      |
| P1  | Steve 補充 AI editing plugin 架構想法          | Steve                     |
| P1  | 與 JH 確認 Open Edit Plus 前端責任邊界            | Alex / Michael            |
| P1  | TVBS IT 評估 DGX 機房部署位置                    | Romeo / TVBS IT           |
| P1  | 台北整合測試環境建立計畫確認                           | Alex / JH / Steve         |
| P1  | Eddy 注音校正 Cloud 轉譯測試                     | Eddy                      |
| P1  | Eddy AI 玩偶 / SEL 平台成本試算表                 | Eddy                      |
| P2  | Grace L1 人工智能 Promotion Package 方案       | Grace                     |
| P2  | 陳秀玲教授聯繫探討 SEL 平台合作                       | Stevens Lee               |
| P2  | 金門幼兒園 SEL + 文化局在地化教案方向確認                 | Stevens Lee + Grace       |
