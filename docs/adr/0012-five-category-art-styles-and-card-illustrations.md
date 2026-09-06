# 0012. 五大卡牌色彩與美術風格分類規範 (Five-Category Art Styles & Dedicated Card Illustrations)

為解決卡牌缺乏專屬視覺插畫的問題，並契合五色卡牌的敘事特色，我們決定建立「每張卡牌專屬插圖、同類別統一風格」的視覺規範：

1. **五大類別美術風格體系**：
   - **紅色戰鬥卡 (Combat)**：**可愛卡通風格 (Cute Cartoon Style)**（以Q版可愛卡通風繪製武器打擊、左輪射擊、重拳出擊、獵槍等，形成鮮明的荒誕黑色幽默反差）。
   - **黃色技能卡 (Skill)**：**真實寫實風格 (Realistic / Photorealistic Style)**（以高度逼真寫實手法刻畫戰術掩護、醫療鎮定針劑、急救繃帶、深呼吸等生存技能）。
   - **紫色魔法卡 (Magic)**：**陽光奇幻風格 (Sunny High Fantasy Style)**（以明亮陽光、絢爛奇幻光彩、七彩魔導星芒描繪不可思議的秘法咒語，宛如明媚童話奇幻世界）。
   - **白色真相卡 (Truth)**：**舊日天啟真理宇宙恐懼風格 (Cosmic Horror / Eldritch Revelation Style)**（以不可名狀的舊日天啟、多維星空、巨大神性眼眸與冰冷崇高感呈現終極真相）。
   - **黑色瘋狂卡 (Madness)**：**混亂扭曲血肉異變深淵風格 (Chaotic Flesh Mutation / Visceral Abyss Style)**（以扭曲崩壞、異化血肉、猙獰利齒與深淵混沌的極限恐怖線條呈現理智歸零的狂亂）。

2. **技術與呈現架構**：
   - 全套卡牌皆配備專屬的高品質插畫資產（WebP/PNG），存放於靜態資產目錄。
   - `CardView` 增設專屬插畫窗框（Illustration Frame）與對應類別的裝飾邊框紋理，並在主選單提供「卡牌圖鑑 (Card Compendium)」供隨時瀏覽。
