# 0013. 原生遊戲沉浸體驗與視窗彈性自適應規範 (Native Immersion & Fluid Viewport Adaptation)

為消除網頁應用程式特徵所帶來的出戲感，並解決文字冒險與卡牌對弈過程中的視窗溢出、捲動與縮放問題，我們制定本規範：

1. **全面去技術化與純粹中文敘事原則 (Pure Chinese Narrative & De-technologization)**：
   - 全面移除所有面向使用者的開發用英文括號附註（例如：`(Battle Log)`、`(Claim Rewards)`、`(Drag Up to Cast)`、`(Case Dossier)`、`(Deceased)`、`(Retry Combat)`、`(SAN)`）。
   - 移除所有技術架構名詞與開發工具名詞（例如：設定頁中的 `Web Audio API`、`Vite`、`React`、`UI Click`、`Sandbox` 等），轉化為符應 1920 年代克蘇魯世界觀之典籍文筆。
   - 移除卡牌圖鑑與美術註冊表中的 AI 提示詞風格標籤（如「Q版可愛卡通」、「陽光奇幻魔導」），改以遊戲世界觀之秘法與武裝分類呈現。

2. **鎖定瀏覽器網頁特性 (Browser Immersion Lockdown)**：
   - **禁止全域捲動與彈跳**：全域 `overscroll-behavior: none`、`html, body, #root` 限制為 `overflow: hidden`，徹底杜絕外層捲軸與橡皮筋彈跳效果。
   - **禁止瀏覽器級縮放手勢**：於 Viewport Meta 與全域 CSS 停用捏合縮放（`user-scalable=no`）與雙擊縮放（`touch-action: manipulation`）。
   - **選取保護**：全域啟用 `user-select: none` 與 `-webkit-user-drag: none`，僅在內部特定文字滾動閱讀區域允許必要交互。
   - **局部內部捲動**：所有需要閱讀長文的區域（戰鬥日誌、調查手冊、阿卡姆早報、圖鑑清單）採用獨立內部容器與專屬克蘇魯樣式滾動條。

3. **桌面端彈性自適應視窗（Fluid Adaptive Layout with Bounds）**：
   - 專注於桌面標準解析度（1280x720 以上及各式比例，如 16:9、16:10、寬螢幕等）。
   - 主體架構採用 `100dvh` / `100vw` 彈性高度與網格佈局，各模組高度與卡牌尺寸採用 CSS `clamp()` 與彈性收縮，防止內容因筆電高度不足而溢出畫面邊界或被裁切。
