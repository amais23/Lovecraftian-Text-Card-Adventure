# 0029. 戰鬥回合生命週期深度模組化與純函數結算引擎 (Modular Combat Turn Lifecycle & Pure Functional Engine)

## 狀態 (Status)

Accepted（延續 ADR-0026、ADR-0027 推進戰鬥領域深層模組化架構）

## 脈絡與決策動機 (Context & Trade-offs)

在 ADR-0027 中，卡牌打出結算（`evaluateCardPlay`）成功抽取為無副作用之純函數解析器；然而，戰鬥生命週期的另一核心——**戰鬥回合結束與輪替結算（Combat Turn Cycle）**——仍深陷於 `src/engine/gameReducer.ts` 內部：

1. **跨模組嚴重洩漏（Leak Across Seams）**：
   `resolveTurnEndAndFixedDraw` 佔據了 `gameReducer.ts` 超過 300 行代碼。每當回合結束時，全域 Reducer 必須直接匯入並編排 5 個不同模組：
   - `enemyTraits.ts`（敵怪原著特質行動、多段撕咬、下回合減益前置）
   - `cards/evaluator.ts`（傷害折算、瘋狂狀態臨界判定）
   - `statusEffects.ts`（護甲增益倍率、回合結束流血與恐慌結算、印記衰減）
   - `cardFactory.ts`（瘋狂狀態缺額臨時卡生成）
   - `handCapacity.ts` / `handMath.ts`（保留手牌與固定抽牌張數）
2. **測試表面過寬（Wide Test Surface）**：
   若要驗證敵怪特質、大袞潮汐護甲轉化、恐慌侵蝕或瘋狂抽牌等邏輯，測試必須構造一個具有 30+ 個無關屬性（如地圖節點、商店物件、奇遇進度）的龐大 `GameState`，並透過 Reducer 分發 `END_TURN`，違反了「介面即測試表面（The interface is the test surface）」原則。
3. **型別窄化與狀態脆弱性**：
   在手牌保留次數累加（`retainedTurns`）與臨時瘋狂卡拼接過程中，因全域 Reducer 承擔過多非同步互動與狀態拼裝，容易產生型別推導不一致與變數洩漏。

為此，我們採納 `codebase-design` 之深層模組（Deep Module）原則，為戰鬥生命週期建立獨立領域模組與純函數縫隙。

---

## 決策內容 (Decision)

### 1. 建立戰鬥領域專屬模組 (`src/engine/combat/`)

將戰鬥生命週期與回合演進自全域 Reducer 完全剝離，建立集中且內聚的戰鬥領域目錄：

```
src/engine/combat/
├── types.ts          # 戰鬥快照輸入、回合結算輸出與生命週期型別
├── turnResolver.ts   # 深層模組：回合結束推進與戰鬥啟動純函數解析器
├── index.ts          # 領域對外暴露小接口
└── turnResolver.test.ts # 針對外部縫隙的高槓桿單元測試
```

### 2. 深層模組介面定義 (High-Leverage Seam)

模組對外僅暴露極簡的純函數介面（Pure Functional Seam）：

```typescript
export function resolveCombatTurnEnd(
  context: CombatTurnContext
): CombatTurnResult;

export function initializeCombatSession(
  context: CombatInitContext
): CombatInitResult;
```

- **輸入**：極小化戰鬥快照（`investigator`, `enemy`, `turn`, `retainedHand`, `sanityDeck`, `discardPile`, `cardsPlayedThisTurn`, `handCapacity`）。
- **輸出**：確定性結果（`nextInvestigator`, `nextEnemy`, `nextHand`, `nextSanityDeck`, `nextDiscardPile`, `outcome: 'ongoing' | 'victory' | 'defeat'`, `logs`, `isMadness`）。
- **副作用隔離**：模組內部 100% 保持純粹無副作用，不讀寫 `localStorage`，不觸發全域導航；持久化存檔（如 `saveFallenInvestigatorFromState`）由外層 Reducer 根據 `outcome` 統一處理。

### 3. 內部縫隙封裝 (Internal Seams Encapsulation)

- `enemyTraits.ts`（原著特質行動、意圖序列推進）與 `statusEffects.ts`（狀態衰減與結算）成為 `turnResolver` 的**內部縫隙（Internal Seams）**。
- `gameReducer.ts` 不再直接編排特質與狀態細節，僅需單次調用 `resolveCombatTurnEnd`，自身程式碼量減少 300+ 行。

### 4. 棄牌生命週期切分 (Hand Discard Boundary)

- 主動棄牌階段（`discardPhase`）涉及 UI 互動選擇（`selectedDiscardIds`），屬於互動狀態管理，由 Reducer 主管。
- 當玩家確認棄牌或未超量時，將確定性的保留手牌傳入 `resolveCombatTurnEnd`，維護結算介面之純粹性。

---

## 影響 (Consequences)

- **高槓桿與強區域性 (Leverage & Locality)**：所有回合結束判定、意圖執行、特質反應與抽牌缺額計算集中於單一深層模組，修改特質或狀態衰減規則僅需維護一處。
- **測試表面收斂 (Test Surface Convergence)**：戰鬥生命週期單元測試無需構建全域 `GameState`，在毫秒內完成純粹且嚴謹的斷言。
- **架構對稱性**：與 `src/engine/cards/evaluator.ts`（出牌行動）並立，使戰鬥核心具備「出牌結算」與「回合結算」兩大清晰對稱之深層引擎。
