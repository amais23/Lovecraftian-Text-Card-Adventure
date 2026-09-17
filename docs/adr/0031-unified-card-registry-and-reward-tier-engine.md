# 0031. 卡牌階級體系收攏與統一獎勵生成深層模組 (Unified Card Registry & Reward Tier Deepening)

## 狀態 (Status)

Accepted（延續 ADR-0025、ADR-0027 完成卡牌領域深層模組化重構）

## 脈絡與決策動機 (Context & Trade-offs)

在 ADR-0027 中，專案建立了模組化卡牌庫架構（`src/engine/cards/`）與純函數解析器 `CardEvaluator`；然而，卡牌階級（Card Tier）與戰後獎勵生成（Reward Generation）仍深陷於舊有架構摩擦中：

1. **跨縫隙嚴重洩漏（Leak Across Seams）**：
   舊模組 `src/engine/cardTiers.ts` 透過手動維護 50 多個字串 ID 陣列（`TIER_1_CARDS` ~ `TIER_4_EXCLUSIVE_CARDS`）來劃分階級。然而，所有獎勵卡在各職業與中立定義檔中早已宣告了 `tier: 1 | 2 | 3 | 4`。每當新增卡牌時，若開發者僅在卡牌檔案標記階級而遺漏更新 `cardTiers.ts` 的字串陣列，該卡牌將在戰後獎勵中永遠無法被抽取，形成隱蔽的維護死角。
2. **獎勵生成規則分歧（Divergent Reward Logic）**：
   - `cardTiers.ts` 實現了 ADR-0015 / ADR-0022 所規範的首領越階（Depth 1 Boss 越階抽 Tier 3、Depth 2+ Boss 專屬 Tier 4 弒神卡）與各深度嚴格階級池。
   - `src/engine/cards/registry.ts` 內部卻存在未整合的 `getRewardPool` 原型，採用混合累積階級且完全忽略首領判定。
   呼叫端（如 `src/engine/survival/settlementResolver.ts`）被迫繞過 `CardRegistry` 縫隙，直接依賴 `cardTiers.ts`。
3. **無效的淺層模組（Shallow Module）**：
   依據 `codebase-design` 之刪除測試（Deletion Test），`cardTiers.ts` 的介面（多個靜態陣列與帶有 5 個位置參數的函式）與其內部實作近乎等大，缺乏足夠的封裝深度。

依據架構檢視與質詢決策，我們採納深度模組原則，徹底將階級劃分與獎勵生成演算法收攏至 `CardRegistry`，並完全廢除 `cardTiers.ts`。

---

## 決策內容 (Decision)

### 1. 單一真理源與動態階級分組 (Single Source of Truth)

- 廢除所有硬編碼字串 ID 陣列。
- `CardRegistry` 內部聚合正規獎勵卡清單 `ALL_REWARD_CARDS`，並依據卡牌宣告的 `tier` 動態分組與檢索：
  ```typescript
  static getCardsByTier(tier: CardTier, occupationId?: OccupationId): Card[];
  static getAllTieredCards(): Card[];
  ```
- 新增或調整卡牌階級時，僅需在卡牌宣告物件中修改 `tier`，全系統自動同步生效，達成零洩漏（Zero-leak）。

### 2. 深層獎勵生成介面 (Deep Reward Generation Seam)

- 在 `CardRegistry` 暴露深層具名參數介面：
  ```typescript
  export interface GenerateRewardCardsOptions {
    depth?: DepthLevel;
    isBoss?: boolean;
    count?: number;
    occupationId?: OccupationId;
    randomFn?: () => number;
  }
  static generateRewardCards(options?: GenerateRewardCardsOptions): Card[];
  ```
- **隱藏於縫隙內部的複雜邏輯**：
  - **首領決戰獎勵規則**：Depth >= 2 產出 Tier 4+ 專屬神話卡（4 選 1）；Depth 1 產出 Tier 3 越階獎勵（3 選 1）。
  - **常態戰鬥獎勵階梯**：Depth 1 產出 Tier 1、Depth 2 產出 Tier 2、Depth >= 3 產出 Tier 3。
  - **職業標籤適配（ADR-0025）**：嚴格排除非當前調查員專屬卡，保留中立通用卡。
  - **純函數無偏隨機洗牌**：內建 Fisher-Yates 洗牌與 `randomFn` 注入支援，產出卡牌進行深拷貝以保障狀態純粹性。

### 3. 全面拔除舊縫隙 (Complete Seam Retirement)

- 直接刪除 `src/engine/cardTiers.ts`。
- 戰後生存結算引擎（`settlementResolver.ts`）直接呼叫 `generateRewardCards`。
- 黑市商人邏輯（`eventData.ts`）改用 `CardRegistry.getCardById(id)` 取代低效的線性尋找 `.find()`。
- 舊單元測試重構並遷移至 `src/engine/cards/rewardTiers.test.ts`。

---

## 影響 (Consequences)

- **強區域性（Strong Locality）**：所有卡牌階級檢索、職業適配過濾與獎勵抽樣演算法 100% 集中於 `CardRegistry`，終結卡牌階級雙重維護問題。
- **高槓桿（High Leverage）**：呼叫端僅需傳入情境參數（`depth`, `isBoss`, `occupationId`），一行代碼即可取得合規的戰利品清單。
- **測試表面收斂（Test Surface Convergence）**：測試透過 `CardRegistry` 介面驗證獎勵行為，即使內部索引或洗牌實作演進，外部測試依然穩定可靠。
