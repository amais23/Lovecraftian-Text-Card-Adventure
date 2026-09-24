# 0034. 探索節點生命週期深度模組化與純函數互動引擎 (Modular Exploration Node Lifecycle & Pure Functional Engine)

## 狀態 (Status)

Accepted（延續 ADR-0029、ADR-0030 推進探索領域深層模組化架構）

## 脈絡與決策動機 (Context & Trade-offs)

在先前的架構演進中，戰鬥回合生命週期（ADR-0029）與戰後生存結算（ADR-0030）皆已成功抽取為獨立的領域純函數引擎。然而，全域非戰鬥探索節點——安全避難所（`sanctuary`）、黑市商人（`market`）、禁忌祭壇（`altar`）、遺物秘閣（`vault`）、血之祭壇（`blood_altar`）與先驅遺骸（`remains`）——其生命週期仍重度耦合於 `src/engine/gameReducer.ts` 內部：

1. **生命週期三截割裂與程式碼重複**：
   - **進入階段**：全數擠在 `NAVIGATE_TO_NODE`（超過 230 行的 `if-else` 分支），手動初始化各節點狀態、抽取商品或抽樣儀式。
   - **互動階段**：6 組獨立的 Action Types，每個 Action 皆在 Reducer 行內直接檢驗生命值、古金幣、牌庫張數等領域守門限制，並手動解包組裝 `investigator` 的各項屬性與文字日誌。
   - **退場階段**：存在 6 個實作完全相同的退場 Action（`LEAVE_SANCTUARY`、`LEAVE_MARKET`、`LEAVE_ALTAR`、`LEAVE_VAULT`、`LEAVE_BLOOD_ALTAR`、`LEAVE_REMAINS`），皆重複執行 `advanceMapAfterNode`、清理節點暫態並切換 `phase = 'map'`。
2. **淺模組（Shallow Modules）與局部性（Locality）喪失**：
   - 既有的 `altarService.ts` 與 `marketService.ts` 僅宣告靜態資料池與陣列洗牌函式，依據刪除測試（Deletion Test），若將其刪除，真正的核心領域規則（如祭壇生命值檢驗、代價計算、黑市醫療補血與牌庫除役限制）根本未受影響，因為這些規則全裸露在 Reducer 之中。
3. **測試表面過寬（Wide Test Surface）**：
   - 驗證單一節點的簡單規則（例如生命值不足時禁忌祭壇是否守門）必須構造一個擁有 40+ 欄位的龐大 `GameState` 物件，透過 `gameReducer` 派發 Action 驗證，導致 `gameReducer.test.ts` 膨脹至超過 215 KB（逾 5,000 行）。

為此，我們採納 `codebase-design` 之深層模組（Deep Module）原則，為探索節點建立集中且內聚的領域純函數引擎。

---

## 決策內容 (Decision)

### 1. 建立探索節點專屬領域模組 (`src/engine/nodes/`)

將 6 大非戰鬥資源型探索節點之領域邏輯自全域 Reducer 與分散的淺模組完全剝離，收攏至專屬目錄：

```
src/engine/nodes/
├── types.ts          # 探索情境輸入、互動動作、結算輸出與型別定義
├── nodeResolver.ts   # 深層模組核心接縫：進入、互動結算與退場推進
├── handlers/         # 各節點私有領域實作（內部縫隙，對外不直接暴露）
│   ├── sanctuary.ts
│   ├── market.ts
│   ├── altar.ts
│   ├── vault.ts
│   ├── bloodAltar.ts
│   └── remains.ts
├── index.ts          # 領域對外暴露小介面
└── nodeResolver.test.ts # 針對探索接縫的高槓桿單元測試
```

### 2. 極簡純函數接縫定義 (Small Interface & Pure Engine)

模組對外僅暴露三個純函數接縫：

```typescript
// 節點進入初始化
export function resolveNodeEntry(
  node: MapNode,
  context: NodeEntryContext
): NodeEntryResult;

// 節點動作互動結算
export function resolveNodeInteraction(
  action: NodeInteractionAction,
  context: NodeInteractionContext
): NodeActionResult;

// 節點退場與地圖推進
export function resolveNodeLeave(
  context: NodeLeaveContext
): NodeLeaveResult;
```

- **輸入**：極窄領域快照（`investigator`、`sanityDeck`、`currentNode`、`currentDepth` 及必要之節點暫態），完全不依賴全域 `GameState`。
- **輸出**：確定性結果（更新後之 `investigator`、`sanityDeck`、`nodeStateUpdates`、`adventureStatsUpdate`、文學風格之 `logs`）。
- **副作用隔離**：所有互動結算皆為純粹資料轉換，無全域狀態修改，具備完整的可測試性。

### 3. Reducer Action 雙層收攏 (Hybrid Action Consolidation)

- **退場動作收攏**：將原先分散的 6 個 `LEAVE_*` Action 正式整併為單一強型別動作 `LEAVE_NODE`，UI 畫面統一派發 `LEAVE_NODE`，由 `resolveNodeLeave` 根據當前節點類型自動清理對應暫態並產生專屬文學退場日誌。
- **互動動作保留強型別委派**：各節點具體互動動作（`USE_SANCTUARY`、`BUY_MARKET_ITEM`、`PURGE_CARD_AT_MARKET`、`USE_ALTAR`、`CLAIM_VAULT_RELIC`、`SACRIFICE_CARDS_AT_BLOOD_ALTAR`、`INHERIT_REMAINS`）在 Reducer 的 `GameAction` 中維持獨立強型別，但 Reducer 內部不再進行任何行內計算，統一委派至 `resolveNodeInteraction`。

### 4. 舊淺模組硬切換與測試遷移 (Hard Cutover)

- 廢除並刪除舊有分散之淺模組（`altarService.ts`、`marketService.ts`、`remainsInheritance.ts`），將其實作完整吸納至 `src/engine/nodes/`。
- 將既有測試（`altarService.test.ts`、`marketService.test.ts`、`remainsInheritance.test.ts`）重構整併至 `src/engine/nodes/` 測試套件中，確保所有邊界條件與儲存異常防護完整繼承。

---

## 影響 (Consequences)

- **強局部性 (Locality)**：所有非戰鬥探索節點的數值平衡、代價扣除、商品定價、契約守門與文字日誌完全集中於單一模組，修改任一節點規則不會洩漏或影響戰鬥/地圖狀態機。
- **大幅縮減 Reducer 複雜度 (Leverage)**：`src/engine/gameReducer.ts` 程式碼行數減少 500~600 行，消除重複退場樣板。
- **測試表面收斂 (Test Surface Convergence)**：節點驗證無需拼裝龐大 `GameState`，能在輕量環境下直接對接縫進行毫秒級測試。
- **架構對稱性**：與 `src/engine/combat/`（戰鬥回合）及 `src/engine/survival/`（戰後結算）形成三足鼎立的清晰領域劃分。
