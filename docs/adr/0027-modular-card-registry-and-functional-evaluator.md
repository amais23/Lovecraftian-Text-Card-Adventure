# 0027. 卡牌系統深度模組化與純函數結算管道 (Modular Card Architecture & Pure Functional Card Evaluator)

## 狀態 (Status)

Accepted（依據 `codebase-design` 深度模組原則重構卡牌引擎）

## 脈絡與決策動機 (Context & Trade-offs)

隨著卡牌種類預期由 26 張擴充至 40~100+ 張，既有卡牌程式碼架構暴露了嚴重的架構摩擦：
1. **跨縫隙洩漏（Leak Across Seams）**：新增或修改一張卡牌時，資訊散落於 5 個互無直接依賴的檔案中：
   - 數值與文本在 `initialData.ts` 或 `cardTiers.ts`
   - 階級歸屬在 `cardTiers.ts`
   - 立繪圖檔映射在 `cardArtworks.ts`
   - 典藏彙整在 `cardCatalog.ts`
   - 特殊印記在 `abyssalSeals.ts`
2. **Reducer 過度肥大與邏輯耦合**：`src/engine/gameReducer.ts` 超過 2,185 行，打出卡牌（`PLAY_CARD`）的複雜數值換算（力量印記、易傷乘數、護甲計算、理智消耗、牌庫增減）全部直接硬編碼在 Reducer 分支內部。
3. **可測試性貧乏（Low Testability）**：若要測試一張卡牌的效果是否正確，測試必須構造一個龐大而脆弱的全局 `GameState` 物件，測試縫隙過寬。

為此，我們採納 `codebase-design` 之深度模組（Deep Module）原則進行全面解耦與重組。

---

## 決策內容 (Decision)

### 1. 領域模組化卡牌庫目錄架構 (`src/engine/cards/`)

建立集中且內聚的卡牌領域專屬目錄：

```
src/engine/cards/
├── types.ts                # 原子效應、條件、關鍵字與結算結果型別
├── registry.ts             # 深度模組：CardRegistry（全局註冊、查詢與過濾 API）
├── evaluator.ts            # 深度模組：CardEvaluator（純函數卡牌效果解析引擎）
├── investigator/           # 私家偵探起始與專屬階級卡庫
│   ├── starter.ts
│   └── rewards.ts
├── occultist/              # 秘術學者起始與專屬階級卡庫
│   ├── starter.ts
│   └── rewards.ts
├── neutral/                # 中立通用卡庫（全職業可用工具/道具牌）
│   └── common.ts
└── special/                # 黑色瘋狂卡、白色真相卡、深淵印記與首領神話卡
    ├── madness.ts
    ├── truth.ts
    └── abyssal.ts
```

### 2. 資料高度內聚原則 (Single Source of Truth)

- 單一卡牌宣告即完整內聚其全部屬性：
  - 識別與名稱：`id`, `name`, `category`, `tier`
  - 費用與生命週期：`costType`, `costValue`, `keywords: ['exhaust', 'retain', 'innate']`
  - 職業適配標籤：`occupations?: OccupationId[]`
  - 可組合原子效果：`effects: CardEffect[]`
  - 插圖與文本：`artworkUrl`, `description`, `flavorText`
- 徹底終結過去一張卡牌需同步修改 5 個不同檔案的跨模組洩漏問題。

### 3. 深度模組一：`CardRegistry`（高槓桿查詢小接口）

- 對外僅暴露極簡查詢方法，隱藏龐大卡庫的組織、職業過濾與階級權重：
  - `getCardsForOccupation(occupationId, filterOptions)`
  - `getStarterDeck(occupationId)`
  - `getRewardPool(occupationId, depth)`
  - `getCardById(id)`
  - `getAllCompendiumCards()`
- `src/engine/cardCatalog.ts` 簡化為轉接代理，維持原有外部引用之相容性。

### 4. 深度模組二：`CardEvaluator`（純函數效果結算管道）

- 將戰鬥打牌邏輯自 `gameReducer.ts` 中完全剝離：
  ```typescript
  export function evaluateCardPlay(
    card: Card,
    context: CardPlayContext
  ): CardPlayResult;
  ```
- `CardEvaluator` 為無副作用的純函數，輸入卡牌與戰況快照，輸出狀態變化量（`healthDelta`, `armorDelta`, `sanityDeckChange`, `appliedStatus`, `logs`）。
- `gameReducer.ts` 僅負責調用此解析器並以 Immutable 方式更新狀態，自身程式碼量減少 300+ 行。

---

## 影響 (Consequences)

- 建立清楚的外部縫隙（External Seam），卡牌邏輯單元測試無需依賴 React 或龐大 GameState。
- 達成「零洩漏（Zero-leak）」目標：未來無論新增 10 張卡牌或全新調查員職業，僅需於對應資料夾內新增宣告並向 `registry.ts` 註冊，無需改動任何戰鬥引擎或介面代碼。
