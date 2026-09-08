# 0025. 職業卡牌適配與全域登錄架構 (Occupation Affinity & Multi-Class Extensible Card Registry)

## 狀態 (Status)

Accepted（擴充 ADR-0007 起始角色定位與 ADR-0010 獎勵產出體系）

## 脈絡與決策動機 (Context & Trade-offs)

目前遊戲中，私家偵探（愛德華·皮爾斯）與秘術學者（艾蓮諾·凡斯）雖然擁有不同的開局起始牌組，但戰後獎勵牌庫（`REWARD_CARD_POOL`）與各階級卡庫（`TIER_1_CARDS` 等）完全共通。私家偵探可輕易獲取高階秘術卡，秘術學者亦頻繁抽到槍械卡，導致角色個性隨探險推進逐漸模糊。

在規劃職業差異化與未來擴充時，面臨兩種架構抉擇：
1. **100% 角色硬隔離分色牌庫（Hard-isolated Color Pools，如《殺戮尖塔》）**：
   - 優點：職業界限涇渭分明。
   - 缺點：大量基礎工具牌（如急救包紮、通用掩蔽、真相殘頁、中立道具）需在每個職業目錄下重複宣告與維護；當未來擴充 5~10 個新職業時，卡庫維護成本與重複代碼將成倍激增。
2. **全域登錄與職業適配標籤映射（Global Registry with Occupation Affinity Tags）**：
   - 所有卡牌統一登錄於全域典藏庫中，每張卡牌透過宣告其適配的職業標籤（`occupations?: OccupationId[]`）進行歸屬映射。
   - 單張卡牌既可嚴格綁定單一職業（專屬卡），亦可被部分職業複用，或向全體職業開放（中立通用卡）。
   - 戰後獎勵與黑市商人依據當前調查員身份動態過濾，既保障了本局構築的純粹性，又賦予了系統面對未來多職業擴充時的極致靈活性。

經過推演，我們採納方案 2。

---

## 決策內容 (Decision)

### 1. 標籤化適配機制 (Affinity Tag Mapping)

- 卡牌型別（`Card`）新增可選欄位 `occupations?: OccupationId[]`：
  - **職業專屬卡（Class Exclusive）**：`occupations: ['investigator']` 或 `occupations: ['occultist']`，僅限該職業獲取。
  - **跨職業共用卡（Multi-class Shared）**：`occupations: ['investigator', 'veteran']`，由指定職業群共享。
  - **中立通用卡（Neutral / Universal）**：`occupations` 省略（`undefined`），全體調查員皆可於旅途中遭遇獲取。

### 2. 戰利品與黑市過濾原則 (Reward & Market Filtering)

- **戰後卡牌獎勵（RewardScreen）**：
  - 產出三選一卡牌時，過濾候選池僅保留符合 `occupations.includes(currentOccupation) || !occupations` 之卡牌。
  - 保證每局抽卡皆緊扣當前調查員的戰術體系，徹底杜絕抽到其他職業死卡之負面體驗。
- **黑市商人（MarketScreen）**：
  - 販售清單中僅出現當前職業專屬卡與中立通用卡。

### 3. 全局典藏圖鑑視角 (Universal Card Compendium Integration)

- 主選單之「卡牌圖鑑（Card Compendium）」依然收錄全遊戲所有存在之卡牌原型。
- 圖鑑介面提供職業標籤篩選切換，方便玩家宏觀預覽不同職業的作戰流派與專屬美術。

---

## 影響 (Consequences)

- 卡牌定義（`src/types/game.ts`）與所有卡牌工廠需補齊 `occupations` 屬性。
- 獎勵生成器（`src/engine/cardFactory.ts` / `cardTiers.ts`）需傳入當前調查員之 `occupationId` 以執行精準篩選。
- 未來新增第三位、第四位調查員職業時，零代碼修改即可複用中立卡牌與專屬標籤，具備高擴展性。
