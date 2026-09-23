# 0032. 地圖節點動態內容池與保底生成配額架構 (Dynamic Node Content Pools & Guaranteed DAG Quotas)

## 狀態 (Status)

Accepted（擴充 ADR-0003 與 ADR-0022，深化節點隨機多樣性與 Roguelike 探索深度）

## 脈絡與決策動機 (Context & Trade-offs)

在現有 16 層 DAG 調查地圖架構（ADR-0022）中，雖然已定義了 10 種地圖節點類型，但在實際遊玩中呈現「隨機感薄弱、重複率過高」的瓶頸：

1. **奇遇事件高度重複且硬編碼映射**：
   `eventData.ts` 僅宣告 4 套奇遇劇本，且 `getMythosEventForNode` 僅比對少數特定節點 ID，其餘全數降級為單一的「淹沒的石龕」，使長程探索缺乏未知感。
2. **黑市、避難所與祭壇行為靜態僵化**：
   - 黑市貨架（`generateDefaultMarketItems`）始終販售相同的 4 件物品，且缺乏卡牌除役服務。
   - 安全避難所（`SanctuaryScreen`）僅提供 2 種固定行動，遺漏了文檔中規劃的壁爐焚卡。
   - 禁忌祭壇（`AltarScreen`）與血之祭壇（`BloodAltarScreen`）缺乏儀式隨機性與分支抉擇。
3. **稀有節點出現機率過低且無保底**：
   遺物秘閣（4%）、禁忌祭壇（6%）、血之祭壇（4%）權重極低，單次 16 層冒險中經常整局無法遇見，導致關鍵構築體驗缺席。
4. **戰鬥遭遇怪物池過於緊湊**：
   各深度常規敵人僅 3 種，造成戰鬥遭遇反覆輪迴。

經由架構質詢（Grilling Session），我們決定：**不增加額外節點類型，而是透過「基礎內容隨機庫（Dynamic Content Pool）」與「DAG 保底配額演算法（Guaranteed Node Quota）」全面深化各節點的內部多樣性。**

---

## 決策內容 (Decision)

### 1. 深度分層秘識奇遇庫 (Depth-Stratified Mythos Event Pool)

- 依冒險深度（Depth 1~4）劃分專屬事件庫，全域擴充至 16+ 套原著克蘇魯劇本。
- 單次冒險進行**不重複洗牌抽樣（No-Repeat Draw Pool）**，杜絕同一局重複遭遇相同事件。
- 選項貫徹明確的代價與收益博弈（生命、理智、古金幣、卡牌、遺物）。

### 2. 動態黑市貨架與付費牌庫除役 (Dynamic Black Market & Purge Service)

- 動態貨架組成：
  - 3 張適配當前職業與深度的卡牌（透過 `CardRegistry` 動態抽樣，並有 20% 機率產生隨機特價折扣）。
  - 1~2 件未持有之舊日遺物。
  - 1 件應急醫療物資。
- **牌庫除役服務（Card Purge Service）**：固定提供付費焚卡選項，定價為 30 枚古金幣。

### 3. 避難所、祭壇與秘閣之動態分支

- **安全避難所（Sanctuary）**：補齊為三選一抉擇：
  1. 深度包紮（恢復 8 點生命值，第 8 層 Haven 恢復 15 點）。
  2. 心智冥想（納入白色真相卡【心智防波堤】）。
  3. **爐火除役（Hearth Purge）**（永久燒毀牌庫中 1 張負面/雜質卡牌）。
- **禁忌祭壇（Forbidden Altar）**：
  建立古神契約庫（血肉、時空、混沌、虛空、血契），每次抵達隨機抽選 3 種儀式供調查員奉獻。
- **血之祭壇（Blood Altar）**：
  提供兩種血契分支：「純淨血契」（永久除役 2 張卡牌）或「血肉重塑」（永久除役 1 張卡牌並立即修補 5 點生命值）。
- **遺物秘閣（Relic Vault）**：
  在常規遺物（三選一或 20 古金幣）之外，新增**破除古神封印（Vault Desecration）**：可掠取 2 件遺物，但理智牌庫將被永久注入 1 張無法打出的【深淵詛咒】黑色瘋狂卡。

### 4. 戰鬥遭遇基礎怪物庫擴充 (Encounter Catalog Expansion)

- 維持純粹戰鬥對抗，不引入過度複雜的戰鬥外詞綴。
- 大幅擴充各深度之原著敵怪清單，並解除新手層硬編碼綁定，實施深度敵人防連續重複輪替。

### 5. DAG 保底配額演算法 (Guaranteed Node Quota in Map Generation)

- 在 `src/engine/mapGenerator.ts` 中重構節點類型分佈邏輯：
  - 各深度（16 層）保證至少生成：
    - 遺物秘閣（`vault`）：至少 1 處。
    - 黑市商人（`market`）：1~2 處。
    - 祭壇類節點（`altar` 或 `blood_altar`）：1~2 處。
  - 微調中間層（Layer 3~7, 9~13）權重矩陣，使探索路線具備平衡的策略選擇空間。

---

## 影響與後續工作 (Consequences)

1. `src/engine/eventData.ts`：重構並擴充 16+ 套深度專屬事件，重構 `generateDefaultMarketItems` 為動態貨架生成器。
2. `src/engine/enemyCatalog.ts`：擴充各深度常規敵人與原著特質。
3. `src/engine/mapGenerator.ts`：實作保底配額演算法，移除硬編碼怪物綁定。
4. `src/components/SanctuaryScreen.tsx`、`AltarScreen.tsx`、`BloodAltarScreen.tsx`、`VaultScreen.tsx`、`MarketScreen.tsx`：更新對應分支介面與 Reducer 行動。
