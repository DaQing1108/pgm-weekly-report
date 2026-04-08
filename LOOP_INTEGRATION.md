# Microsoft Loop 與 PgM 週報系統整合技術文件

## 1. 產品目標 (Product Goal)
將現有的 Microsoft Loop 會議記錄或專案文件中的「行動事項 (Action Items)」無縫對接到 PgM 週報追蹤系統 (Action Items Dashboard)。透過自動化 RPA 以及前端的快速匯入機制，消除 PM 手動複製貼上的繁瑣人事成本，進而提升報表產出的效率與準確度。

## 2. 系統架構設計 (Architecture)
為了規避微軟 Loop 嚴格的 API 驗證與動態加載 (React SPA) 機制，並考量到使用者的操作體驗，架構採 **「RPA 離線抓取 + JSON 檔案橋接 + 前端響應式載入」** 的雙層架構：

1. **背景 RPA 引擎 (Python & Playwright)**
   - 負責啟動獨立的受控瀏覽器環境，導航至 Loop 文檔。
   - 解析複雜的 Loop DOM 樹，定位表格結構，萃取結構化資料。
   - 將結果匯出為符合週報系統 Schema 的 `loop_extracted_actions.json`。
2. **週報系統前端 (Vanilla JS & HTML)**
   - 在 Action Items 看板 (`actions.html`) 實作隱藏的 I/O 通道 (`<input type="file">`)。
   - 讀取 JSON 並執行業務邏輯 (資料清理、分類對應、ID 生成)。
   - 寫入本地 `store.js` 並觸發畫面重繪。

---

## 3. 關鍵技術實作詳情 (Technical Implementations)

### 3.1 獨立的 Playwright Context (防干擾機制)
- **挑戰**：一開始嘗試劫持使用者現有的 Chrome (CDP Port 9222)，但會因為系統安全性或防毒機制出現連線異常與鎖定檔衝突 (`SingletonLock`)。
- **解法**：改用 Playwright 的 `launch_persistent_context`。在專案目錄下自動開闢 `automation/loop_profile/` 資料夾，做為「專屬機器人」的登入狀態暫存檔。
- **優勢**：
  - 不會影響使用者的主瀏覽器，支援在背景默默執行。
  - 登入狀態 (JWT/Cookies) 被持久化，第一次手動驗證 M365 MFA 後，未來抓取皆無須重新輸入密碼。

### 3.2 逆向解析 Loop 表格 (DOM Traversing)
- **挑戰**：微軟 Loop 產生的 HTML 類別名稱多為動態 Hash (如 `.fui-Table`)，經常變動。
- **解法**：採用**語意化及階層搜索策略**。
  - 透過 `page.query_selector_all('table')` 或直接以 `<tr role="row">` 為錨點。
  - 在每一行 (row) 內尋找 `<td>` 元素。如果該行含有 Checkbox 的圖示元素 (`fui-Checkbox`) 或圓圈圖示，則判斷該行為任務列。
  - 將每一欄的資料做去頭去尾 (strip) 處理。

### 3.3 資料清理與重構 (Data ETL)
- **狀態映射**：若文字內容發現 `\ue73e` 或類似的字體圖標代替打勾，或欄位內為「完成」，則將 Output Status 對應為週報系統的 `done`；反之為 `pending`。
- **日期洗鍊 (Frontend)**：若 Loop 裡抓下來的日期為 `2025年5月21日 週三`，前端使用 Regex `match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)` 自動轉換成系統支援的 `yyyy-mm-dd` 格式。若無日期，則呼叫系統內建的 `_defaultDueDate()`。
- **類別判讀**：前端實作簡單的文字探勘，若 Action 內容含有「技術」，則存入 `technical` 面板，含有「資源」存入 `resource`，剩餘歸類 `business`。

---

## 4. 使用者路徑與操作流程 (User Flow)

1. **RPA 啟動**：
   使用者在 Terminal 輸入：
   `python3 automation/loop_extractor.py "https://loop.microsoft.com/v/..."`
2. **驗證與萃取**：
   如果是未登入狀態，機器人會暫停 60 秒讓使用者完成手機 Authenticator 同步。登入後自動滾動頁面、等待網路請求完成 (idle)，接著萃取封裝並儲存 JSON。
3. **前端載入**：
   使用者打開 `actions.html`，點擊「🔄 從 Loop 匯入」，選擇生成的 `loop_extracted_actions.json`，系統完成狀態刷新並彈出成功吐司提示 (Toast)。

---

## 5. 未來擴充性評估 (Limitations & Future Scope)

- **無頭模式 (Headless Mode)**：目前 `headless=False` 為了確保 MFA 順利展示，若後續使用 Service Principal 或 Graph API (需要企業授權) 可轉為全後端。
- **排程自動化 (Cron/CI)**：可與 GitHub Actions 或系統排程綁定，每日早上 9 點自動產出 JSON 提供給 PM 檢閱。
- **Graph API 升級途徑**：若微軟開放 Loop 的 Graph API endpoints，可立即淘汰 RPA 爬蟲腳本，直接從系統的 JavaScript 使用 Bearer Token 呼叫，達成真・一鍵同步。
