# 週報系統 UI/UX 極致體驗提升計畫

本計畫旨在透過原生技術（Vanilla CSS + Vanilla JS + SVG）對 PgM 週報管理系統的前端進行深度 UI/UX 優化，不引入任何外部框架與肥大依賴，維持系統一貫的簡潔與高效，同時大幅度提升視覺美感與日常操作的流暢度。

---

## User Review Required

> [!IMPORTANT]
> - 本次優化涵蓋核心前端頁面與樣式系統，優化過程中**不影響現有的 PostgreSQL / 本地 JSON 資料結構**，屬於純前端體驗升級。
> - **草稿自動存檔**將完全儲存於使用者瀏覽器的 `localStorage` 中，不會增加伺服器負擔，並具備優雅降級機制。
> - **Action 看板視圖**與舊的清單表格將透過開關（Toggle）切換，保留使用者舊有的操作習慣。

---

## Proposed Changes

### 1. 🎨 極致視覺過渡 (Theme Transition Smoothness)
**目標**：消除切換深淺色主題或夜間環境自適應時的突兀視覺閃爍，打造絲滑的色彩過渡。

#### [MODIFY] [base.css](file:///Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/program-sync/assets/css/base.css)
* 在 `:root` 中加入過渡時間常數：
  ```css
  --theme-transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                      color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.25s ease;
  ```
* 為 `body`、`.card`、`.navbar`、`input`、`select`、`textarea` 加上 `transition: var(--theme-transition);`。

---

### 2. 💾 表單自動存檔與草稿還原 (Form Auto-Save & Recovery)
**目標**：防止瀏覽器崩潰或手誤關閉頁面導致在 `input.html` 編輯的進度付諸流水。

#### [MODIFY] [input.html](file:///Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/program-sync/input.html)
* **自動存檔機制**：
  * 在所有編輯輸入框（進度、週Done、Blockers、團隊等）上綁定 `input` / `change` 監聽器。
  * 引入 `debounce(fn, 800)`（可使用 `ui.js` 已有的 `debounce` 函式）在編輯後實時將當前表單狀態寫入 `localStorage.setItem('pgm_input_draft', ...)`。
* **草稿還原機制**：
  * 當頁面加載時，檢測 `localStorage` 中是否有較新且未提交的草稿。
  * 若有，透過 `ui.js` 的 `toast()` 觸發頂部精美提示：「偵測到您有未儲存的週報編輯草稿」，並提供「一鍵恢復」與「捨棄」按鈕。
  * 表單提交或手動儲存成功後，自動清除此 `localStorage` 草稿。

---

### 3. 📊 Action Items 看板檢視 (Kanban Board for Actions)
**目標**：提供拖曳或一目了然的直觀看板，清晰掌握 Pending / In Progress / Blocked / Done 四大維度狀態。

#### [MODIFY] [actions.html](file:///Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/program-sync/actions.html)
* 在頂部控制列新增「檢視切換」元件：`清單 ☰` 與 `看板 🔲`。
* 繪製 4 欄式 CSS Grid 看板佈局（預設 `display: none`）。

#### [MODIFY] [components.css](file:///Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/program-sync/assets/css/components.css)
* 新增看板容器、欄位卡片、拖曳高亮、以及狀態對齊的 CSS 樣式：
  * 欄位背景：`var(--color-bg-secondary)`、圓角 `var(--radius-lg)`
  * 卡片背景：`var(--color-bg-primary)`，並依據 status / priority 給予左側彩色邊框（例如 Blocked 為紅色，done 為綠色）。

#### [MODIFY] [app-init.js](file:///Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/program-sync/assets/js/app-init.js) (或在 `actions.html` 的專屬控制邏輯中)
* 渲染 Kanban 卡片，並整合瀏覽器原生的 `HTML5 Drag and Drop API`（不需要引入額外套件），實現卡片在欄位間的流暢拖曳與實時更新。
* 拖曳落入新欄位時，自動調用 `store` 更新 Action Item 狀態並同步到後端，展示同步呼吸燈。

---

### 4. 📅 週次導覽分組與快速下拉 (Week Selector Quarter Grouping)
**目標**：解決週次累積過多時（如 30 週以上），橫向滾動條過長、滑動開銷大的問題。

#### [MODIFY] [app-init.js](file:///Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/program-sync/assets/js/app-init.js)
* **分組邏輯**：
  * 依週Label（如 W09-W13 屬於 Q1，W14-W21 屬於 Q2）進行季度分類摺疊。
* **快速選單**：
  * 在橫向滾動 Tab 欄的最右端，新增一個精美的下拉按鈕 `▼`。
  * 點選後展開一個覆蓋小選單，依季度分類展示所有週次，供使用者「一鍵直達」特定歷史週報。

---

### 5. 📈 指標微型趨勢折線圖 (WoW SVG Sparklines)
**目標**：在 Dashboard 的數據指標欄位中，視覺化呈現近 4 週的趨勢，不再只是冷冰冰的數字。

#### [MODIFY] [index.html](file:///Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/program-sync/index.html)
* 在「本週健康度」與「專案總數」等 KPI 卡片中，規劃嵌入 `<div class="kpi-sparkline"></div>`。

#### [MODIFY] [app-init.js](file:///Users/daqingliao/Documents/AI-Workspace/1P_Projects/pgm-weekly-report/program-sync/assets/js/app-init.js) (Dashboard 渲染部分)
* **數據獲取**：
  * 從 `store.js` 獲取包含當前週在內的最相鄰 4 週歷史快照數據（如 health 比例、行動項總量）。
* **SVG 繪製**：
  * 用極其精煉的 JS 邏輯動態計算座標，渲染一組 inline SVG 趨勢折線與漸層背景（使用 `var(--color-success)`）。
  * 若無歷史資料則優雅隱藏 trend 折線。

---

## Verification Plan

### Automated Tests
* 執行本地健檢 `node agent/health-check.js` 以確保所有基礎 SPA 監聽器與變數沒有在優化過程中損毀。

### Manual Verification
1. **深淺色主題切換**：點擊切換 Dark Mode，檢查是否有平滑色階動畫。
2. **草稿復原測試**：在 `input.html` 任意輸入文字，重整網頁，確認有彈出 Toast 提示，且點擊「一鍵恢復」能完美填回表單。
3. **Action 看板測試**：切換至看板模式，進行卡片拖曳，確認狀態會變更，且重新載入後變更依然被保留（後端儲存成功）。
4. **Sparkline 折線**：查看 Dashboard，確認健康度卡片底部是否生成高質感的波浪折線趨勢圖。
