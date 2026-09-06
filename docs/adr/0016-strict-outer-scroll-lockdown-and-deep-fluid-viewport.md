# 0016. 絕對外層溢出封鎖與深層原生自適應佈局 (Strict Outer Scroll Lockdown & Deep Native Fluid Viewport)

## 背景 (Context)

在較小尺寸視窗（例如高度低於 768px 或比例較扁平的筆記型電腦螢幕）中，部分頁面（如標題與角色選擇、戰鬥結算、戰鬥手牌區）會因容器高度固定或設定了 `overflow-y: auto` 而出現破壞沉浸感的外層捲軸，或者在無捲軸時按鈕被擠出可視區域。需要徹底杜絕外層捲軸，並保證在小視窗下所有互動元素、手牌與按鈕皆完整可見且免除外層滾動。

## 決策 (Decision)

1. **絕對外層溢出封鎖 (Absolute Outer Scroll Lockdown)**：
   - 全面拔除各頂層畫面外容器（`html`, `body`, `#root`, `.combat-container`, `.title-screen-container`, `.reward-screen-container` 等）上的外層 `overflow-y: auto`，強制設為 `overflow: hidden`。
   - 僅允許合法的「遊戲內部局部閱讀容器」保留專屬克蘇魯樣式內部滾動條：
     - `BattleLog`（戰鬥日誌文字滾動區）
     - `CardCompendium`（卡牌圖鑑滾動清單）
     - `ArkhamGazette`（早報頭條內文滾動區）
     - `MapViewport`（若縱向節點畫布高度超出視窗時的羊皮紙地圖平滑滾動區）

2. **深層原生響應式伸縮 (Deep Native Fluid Responsive with CSS `clamp()`)**：
   - 拒絕使用全畫面 `transform: scale()`，以避免破壞卡牌向上拖曳判定座標與導致字體模糊。
   - **戰鬥畫面**：
     - 手牌高度改採 `clamp(130px, 20dvh, 260px)` 彈性伸縮，卡牌寬高與文字尺寸隨容器動態緊湊縮放。
     - 敵怪頭像尺寸縮放為 `clamp(60px, 9dvh, 90px)`，上方面板留白縮減。
     - 戰鬥 HUD（生命值、精力、理智、結束回合按鈕）與手牌區在 600px 矮螢幕下始終保持完整在視界內，絕不被裁切。
   - **角色選擇畫面**：
     - 矮螢幕下緊湊化職業卡內部 padding、引用語與卡牌籌碼清單，確保「啟程探索」與「返回」按鈕免滾動立即可點。
   - **結算畫面**：
     - 獎勵卡片與彈窗面板在小高度下自動等比收攏，完整呈現在畫面中央。

## 影響 (Consequences)

- 徹底消除網頁式外層滾動條與出戲感，達成真正掌機/主機級別的獨立遊戲沉浸感。
- 文字閱讀極致清晰銳利，卡牌拖曳與滑鼠懸停判定 100% 精準。
