# 0041. 秘識奇遇事件解析器深度模組化與純函數引擎 (Modular Mythos Event Resolver & Pure Engine)

## 狀態 (Status)

Accepted（延續 ADR-0029、ADR-0030、ADR-0034 推進引擎領域深層模組化架構）

## 脈絡與決策動機 (Context & Trade-offs)

在先前的架構演進中，戰鬥回合生命週期（ADR-0029）、戰後生存結算（ADR-0030）以及探索節點生命週期（ADR-0034）皆已成功抽取為獨立的領域純函數引擎。然而，秘識奇遇（Mythos Event）的後果結算邏輯仍嵌留在 `src/engine/gameReducer.ts` 內部：

1. **Reducer 行內邏輯膨脹**：
   - `RESOLVE_EVENT_OPTION` case 內含約 135 行行內結算代碼，負責迭代選項的所有後果（`health_change`、`sanity_change`、`gain_obols`、`gain_card`、`gain_relic`、`trigger_combat`）。
   - 包含理智牌庫燒牌、棄牌回補、真相卡注入（心靈澄澈）、金幣增量累計至 `adventureStats`、殞命分支判定以及轉場戰鬥牌庫建立（`setupCombatDeck`）等邏輯。
2. **測試表面過寬（Wide Test Surface）**：
   - 驗證單一奇遇選項的數值變更或分支終局，必須構建擁有 40+ 欄位的龐大 `GameState` 物件並透過全域 Reducer 派發 Action，提高測試維護成本與脆弱性。
3. **架構不對稱性**：
   - 探索節點互動皆已有 `resolveNodeInteraction`（ADR-0034），而同屬探索地圖重要事件的奇遇選項結算卻仍為 Reducer 行內特例。

為此，我們採納 `codebase-design` 之深層模組（Deep Module）原則，為秘識奇遇結算建立集中且內聚的領域純函數引擎。

---

## 決策內容 (Decision)

### 1. 建立秘識奇遇專屬領域模組 (`src/engine/events/`)

將奇遇後果解析邏輯自全域 Reducer 剝離，收攏至專屬目錄：

```
src/engine/events/
├── types.ts          # 輸入快照與互斥三終局輸出型別 (MythosEventContext, MythosResult)
├── eventResolver.ts  # 純函數解析核心：resolveMythosEvent(event, option, ctx)
├── index.ts          # 領域對外暴露小介面 (Small Seam)
└── eventResolver.test.ts # 針對事件結算接縫的高槓桿單元測試 (13 tests)
```

### 2. 極簡純函數接縫定義 (Small Interface & Pure Engine)

模組對外僅暴露單一純函數接縫：

```typescript
export function resolveMythosEvent(
  event: MythosEvent,
  option: MythosEventOption,
  ctx: MythosEventContext,
): MythosResult;
```

輸入快照 `MythosEventContext` 僅需 8 個必要屬性（`investigator`、`sanityDeck`、`hand`、`discardPile`、`adventureStats`、`eventTitle`，可選 `shuffledDeck`、`occupationId`），不依賴龐大的 `GameState`。

輸出型別 `MythosResult` 明確定義三種互斥終局，以 TypeScript 標籤聯集（Discriminated Union）保證型別安全：
- `defeat`: 調查員生命值歸零，包含死亡日誌與結算後的 `adventureStats`。
- `combat`: 觸發戰鬥轉場，包含重置狀態的調查員、戰鬥抽牌與牌庫、敵怪副本。
- `resolved`: 一般奇遇完成結算，包含更新後的調查員、牌庫、手牌、棄牌與事件快照。

### 3. 副作用外推與 Reducer 職責純化

`resolveMythosEvent` 為 100% 無副作用純函數（不存取 `localStorage`、不發起全域導航）。`saveFallenInvestigatorFromState` 等持久化副作用由外層 `gameReducer` 依據 `outcome === 'defeat'` 統一處置。

`gameReducer` 的 `RESOLVE_EVENT_OPTION` 減縮為純粹的呼叫轉發與狀態合併：

```typescript
const mythosResult = resolveMythosEvent(state.currentEvent, option, mythosCtx);

if (mythosResult.outcome === 'defeat') {
  saveFallenInvestigatorFromState(state, `於奇遇【${state.currentEvent.title}】中傷重不治`);
  return { ...state, phase: 'gameover', ... };
}
// combat & resolved 處理...
```

---

## 後續影響與成效 (Consequences)

1. **Reducer 行數大幅精簡**：`RESOLVE_EVENT_OPTION` 由原本 135 行縮減至約 50 行狀態協調，原行內邏輯全數刪除。
2. **高槓桿快速單元測試**：新建 `eventResolver.test.ts`，以極小測試 fixture 覆蓋全部 6 種後果類型與 3 種終局分支（13 tests, ~5ms 執行完畢）。
3. **零回歸保證**：既有 `gameReducer.test.ts`（193 tests）無任何改動下全數綠燈通過，全套件 72 個測試檔、867 項測試全綠。
