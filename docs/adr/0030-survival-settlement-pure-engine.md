# 0030. 戰後生存結算深層模組化與純函數晉級引擎 (Modular Survival Settlement & Pure Functional Progression Engine)

## 狀態 (Status)

Accepted（延續 ADR-0023、ADR-0027、ADR-0029 推進生存經濟與遊戲生命週期深層模組化架構）

## 脈絡與決策動機 (Context & Trade-offs)

在 ADR-0023（長程生存經濟與戰地包紮）與 ADR-0029（戰鬥回合生命週期純函數引擎）確立後，戰鬥對弈核心與出牌解析已具備高內聚之純函數縫隙。然而，戰鬥勝利後的**戰後生存整備與結算 (Survival Settlement)**，在 [`src/engine/gameReducer.ts`](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure-card-artworks/src/engine/gameReducer.ts) 內部仍呈現嚴重的結構性摩擦：

1. **三處重複的洩漏縫隙 (Triplicate Leaking Seams)**：
   `CLAIM_CARD_REWARD`、`CLAIM_FIELD_DRESSING` 與 `CLAIM_ABYSSAL_SEAL` 三個 Action 分支各自包含超過 70 行代碼（合計逾 220 行）。三者完全重複了以下邏輯：
   - 提取全局一般卡並過濾戰鬥臨時卡（`getAllPermanentCards`）。
   - 首領決戰復甦（Boss Defeat Full Heal）與凡人體質肉體傷勢保留。
   - 理智牌庫全額重整洗牌（`fisherYatesShuffle`）與固定等量起手抽牌分割（`splitDeckToHandAndSanity`）。
   - 地圖節點推進（`advanceMapAfterNode`）。
   - 第 1、2 深度首領之深度過渡（`depth_transition`）、第 3 深度古印共鳴檢查與普通結局判定、以及第 4 深度真結局結算。
   任何關於章節流轉或牌庫重組的規則修訂，皆必須在三處同時維護，極易引發不同步臭蟲（低區域性，Poor Locality）。

2. **副作用散落與測試表面過寬**：
   現行結算分支在滿足條件時直接調用 `clearFallenInvestigator()`（內部直接對 `localStorage` 進行 I/O 寫入），且依賴不可預期的亂數洗牌。若要測試第 3 深度擊敗原生修格斯時「持有兩枚殘片 vs 未持有」之結局分支，測試必須構造具備 30+ 個屬性的龐大 `GameState`，違反「介面即測試表面」原則。

為此，我們依循 `codebase-design` 之深層模組（Deep Module）原則，為生存結算與章節流轉建立獨立領域模組與純函數縫隙。

---

## 決策內容 (Decision)

### 1. 建立生存領域專屬模組 (`src/engine/survival/`)

將戰後生存整備、獎勵生成、牌庫重構與深度過渡自全域 Reducer 完整剝離，建立集中且內聚的生存領域模組：

```
src/engine/survival/
├── types.ts                 # 生存抉擇、獎勵生成與結算輸入輸出型別契約
├── settlementResolver.ts    # 深層模組：戰利品生成、抉擇結算與章節過渡純函數引擎
├── index.ts                 # 領域對外暴露小接口
└── settlementResolver.test.ts # 針對外部縫隙的高槓桿單元測試
```

### 2. 深層模組介面定義 (High-Leverage Seam)

對外暴露單一極小化之純函數結算介面，以可辨識聯合型別（Discriminated Union）統一表示調查員之生存調配：

```typescript
export type SurvivalChoice =
  | { type: 'card'; cardId?: string }
  | { type: 'field_dressing'; healAmount?: number }
  | { type: 'abyssal_seal' }
  | { type: 'skip' };

export function resolveSurvivalSettlement(
  choice: SurvivalChoice,
  context: SurvivalSettlementContext
): SurvivalSettlementResult;

export function generateCombatReward(
  context: CombatRewardContext
): CombatRewardResult;
```

- **輸入快照（`SurvivalSettlementContext`）**：僅包含生存結算所需的最小屬性（`investigator`, `currentCards`, `currentNodeType`, `currentDepth`, `abyssalSealFused`, `rewardObols`, `map`, `shuffledDeck`）。
- **輸出結果（`SurvivalSettlementResult`）**：提供確定性更新（`investigator`, `sanityDeck`, `hand`, `discardPile`, `isMadness`, `map`, `nextPhase`, `isTrueEnding`, `clearFallenRecord`, `logs`, `addedObols`）。
- **古印共鳴時序**：第 3 深度首領擊敗時，若持有前兩枚殘片，在 `generateCombatReward` 時觸發碎片共鳴融合為【完整的深淵古印】並解鎖第 4 階獎勵；在 `resolveSurvivalSettlement` 時判定推進至第四深度過渡（`depth_transition`）或普通結局。

### 3. 純函數與副作用隔離 (Side-Effect Discipline)

- 模組內部 100% 保持純粹無副作用，嚴禁存取 `localStorage`。當滿足清除殉職記錄時，透過產出欄位 `clearFallenRecord: boolean` 明確通知外層 Reducer 執行實體清理。
- 支援傳入可選的 `shuffledDeck`，確保所有邊界情境（如殘片洗入牌庫順序）具備 100% 確定性重放測試能力。

### 4. 零破壞性變更與向後相容性 (Zero Breaking Changes)

- 全域 Reducer 維持既有 `CLAIM_CARD_REWARD`、`CLAIM_FIELD_DRESSING`、`CLAIM_ABYSSAL_SEAL` Action 簽名不變，前端 UI 組件（`RewardScreen.tsx` 等）無需修改。
- Reducer 內部三個分支全面收斂為將 Payload 映射為 `SurvivalChoice` 並單次分發調用 `resolveSurvivalSettlement`，刪除 200+ 行冗餘分支。

---

## 影響 (Consequences)

- **強區域性與高槓桿 (Locality & Leverage)**：所有生命值處置、首領決戰復甦、理智牌庫重組、深淵殘片獲得與四大深度結局判斷集中於單一模組，修改生存經濟規則僅需維護一處。
- **測試表面大幅收斂**：單元測試無需依賴完整的全域 `GameState`，在毫秒內覆蓋所有章節過渡、真假結局與卡牌精簡之極限測試。
- **架構對稱性**：與 `src/engine/cards/`（出牌行動）、`src/engine/combat/`（戰鬥回合）形成對稱之三大純函數深層引擎，推動 `gameReducer.ts` 進一步向極簡狀態協調器收斂。
