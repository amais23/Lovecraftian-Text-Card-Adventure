# Walkthrough - 卡牌改動審查與數值實驗室（可攜式單一 HTML 打包與即時編輯版）

我們已完成可攜式單一 HTML 檔案的完整打包與雙向同步功能，讓您與其他測試者或開發者可以在**完全脫離伺服器或開發環境**的情況下，直接開啟單一 HTML 檔案進行全功能編輯、評分與平衡性討論！

---

## 視覺成果展示

### 1. 單一 HTML 獨立檔案運作截圖
![可攜式單一 HTML 審查室](/Users/liuchiahan/.gemini/antigravity-ide/brain/82a54722-67f0-4c25-8c69-a8251ce2c069/card_review_final_1788879623387.png)

---

## 核心新功能與檔案位置

### 1. 產出的獨立單一 HTML 檔案
- **專案根目錄**：[`card_review_lab.html`](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure-card-artworks/card_review_lab.html)
- **公開靜態目錄**：[`public/card_review_lab.html`](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure-card-artworks/public/card_review_lab.html)（亦可直接透過瀏覽器 [http://localhost:5174/card_review_lab.html](http://localhost:5174/card_review_lab.html) 開啟）

> [!TIP]
> **零依賴、純離線可攜性**：
> 此 HTML 檔案大小僅約 118KB，內嵌了全遊戲 **64 張卡牌完整原型與方案 A 改造數據**、**深度 1~4 全部怪物生態數值**、**克蘇魯哥德黑金樣式表**與**音效合成引擎**。任何人無需安裝 Node.js、npm 或執行任何指令，只需直接點兩下檔案或傳送到任何電腦/手機瀏覽器即可完全離線使用！

---

### 2. 即時保存與打包匯出機制（保護您已記錄的筆記）

1. **現有網頁一鍵打包 (`CardReviewLab.tsx`)**：
   - 在目前的開發網頁（[http://localhost:5174/?view=card_review](http://localhost:5174/?view=card_review)）頂端工具列中，已新增 **「📄 打包可攜 HTML」** 按鈕。
   - 點擊後，系統會抓取您目前已在瀏覽器中記錄的**所有接受/拒絕決定與文字筆記**，將其**直接內嵌為 HTML 的預設初值**並自動觸發下載檔案（如 `arkham_card_balance_lab_2026-09-09.html`）。

2. **跨使用者傳閱循環（「另存已編輯 HTML」）**：
   - 任何測試者在獨立版 HTML 檔案中進行審核、勾選與填寫意見後，皆可點擊右上角的 **「📦 另存已編輯 HTML」** 按鈕。
   - 瀏覽器會自動產出一份「已包含該測試者最新評語」的全新單一 HTML 檔案。測試者可將此 HTML 透過 Slack、Discord、Email 或 GitHub 傳給另一位開發者，對方開啟時即可直接看到先前的所有修改紀錄與討論意見！

3. **自動 `localStorage` 同步**：
   - 獨立 HTML 檔案與主遊戲的審查室共用儲存協議（鍵名：`arkham_card_review_decisions`）。無論是在本地伺服器還是獨立 HTML 中編輯，皆會自動即時儲存至瀏覽器本地，重新整理不會遺失任何內容。

---

### 3. 功能完整對齊清單

| 功能模組 | 開發版網頁 | 獨立單一 HTML 檔案 |
| :--- | :---: | :---: |
| **64 張卡牌方案 A 對照審核** | ✅ 包含 | ✅ 完整內嵌 (100%) |
| **三態決策 (接受 / 拒絕 / 待定)** | ✅ 包含 | ✅ 支援且帶音效反饋 |
| **每張卡獨立文字意見與備註** | ✅ 包含 | ✅ 自動即時儲存 |
| **類別 / 職業 / 階級 / 狀態篩選器** | ✅ 包含 | ✅ 即時無刷新篩選 |
| **卡名、ID、關鍵字搜尋引擎** | ✅ 包含 | ✅ 即時毫秒級響應 |
| **第一至第四深度怪物生態數值表** | ✅ 包含 | ✅ 分深度頁籤切換 |
| **破局克制推薦與原著生態特質** | ✅ 包含 | ✅ 完整包含 |
| **複製 JSON / 匯出 JSON / 匯入 JSON** | ✅ 包含 | ✅ 支援貼上或檔案載入 |
| **另存已編輯獨立 HTML 檔案** | ✅ 包含 | ✅ 支援將修改結果另存新檔 |
| **回到頂部 / 底部浮動導航** | ✅ 包含 | ✅ 平滑滾動支援 |

---

## 驗證結果

1. **TypeScript 型別檢查**：`tsc -b --noEmit` 0 錯誤通過。
2. **單元與整合測試**：40 個測試檔案、470 個測試全數綠燈（`470 passed`）。
3. **實體瀏覽器操作驗證**：
   - 驗證 `public/card_review_lab.html` 在 Chrome 瀏覽器中獨立執行正常。
   - 驗證點選卡牌接受/拒絕、輸入備註、刷新頁面自動還原、切換怪物深度 1~4 均正常運作。
   - 驗證主系統 `CardReviewLab.tsx` 之「打包可攜 HTML」按鈕可正確生成並下載包含使用者即時資料的 HTML。
