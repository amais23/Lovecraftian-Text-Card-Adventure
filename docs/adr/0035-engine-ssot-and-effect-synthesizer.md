# 0035. 確立引擎單一真實來源、動態審查轉接層與效果描述合成器 (Engine SSOT, Dynamic Review Adapter & Card Effect Synthesizer)

## 狀態 (Status)

Accepted（延續 ADR-0027 模組化卡牌註冊表與 ADR-0031 統整圖鑑引擎）

## 脈絡與決策動機 (Context & Trade-offs)

本專案在先前的開發中，建立了 `src/data/cardReviewData.ts`（卡牌審查）與 `src/data/monsterReviewData.ts`（怪物圖鑑與戰術指南），供 `CardReviewLab.tsx` 介面及獨立導出的 `card_review_lab.html` 使用。

然而，隨著遊戲核心演進至 ADR-0027、ADR-0031 及 ADR-0033，產生了嚴重的雙重維護與資料落後問題：
1. **雙重維護與版本脫鉤 (Dual Maintenance & Drift)**：
   - 核心遊戲邏輯完全由 `src/engine/cards/` 與 `src/engine/enemyCatalog.ts` 驅動。
   - `src/data` 卻以逾 2,200 行的靜態 TypeScript 硬編碼重複定義卡牌與怪物的數值、效果與意圖。
   - 許多早先在 `src/data` 中提出的 `proposed` 方案早已實裝進引擎，而 `src/data` 的 `original` 卻仍停留在遠古版本，導致資料庫充斥過期歷史 diff。
2. **文案描述與程式效果不一致 (Text Description vs Logic Drift)**：
   - 卡牌擁有手寫的人文描述（`card.description`）與戰鬥實時運行的效果結構（`card.effects: CardEffect[]`）。
   - 當數值經過平衡調整時，常發生手寫描述遺漏更新或條件敘述不吻合的問題，缺乏自動化工具進行對帳比對。

為了徹底根絕雙重維護並確保資料能「隨時動態更新」，我們確立以 `src/engine` 為唯一權威來源，並建立效果合成器。

---

## 決策內容 (Decision)

### 1. 確立 `src/engine` 為唯一真實來源 (Single Source of Truth, SSOT)

- 全遊戲之卡牌原型、職業起始牌庫、階級獎勵池、深淵卡牌統一由 `src/engine/cards/registry.ts` 管轄。
- 敵怪實例、數值、意圖序列、深淵特質與美術路徑統一由 `src/engine/enemyCatalog.ts`、`src/engine/enemyTraits.ts` 與 `src/engine/enemyArtworks.ts` 管轄。
- `src/data` 不得再維護任何卡牌與怪物的數值複本。

### 2. Live Baseline 生命週期與輕量提案覆蓋層 (Proposal Overlay)

- **現行實裝基準 (Live Baseline)**：以 `src/engine` 當下之數值為權威基準。無待審改動之卡牌自動視為穩定現行版。
- **輕量提案覆蓋層 (`src/data/activeProposals.ts`)**：僅針對「當前正在研議修改」之卡牌掛載提案覆蓋（`CardProposalOverlay`），宣告預計調整之費用、效果、設計動機（`designRationale`）與戰術聯動（`synergies`）。
- **實裝即回歸**：提案一旦經程式碼合併至 `src/engine`，只需自 `activeProposals.ts` 移除該項目，該卡便自動以最新引擎數值呈現為乾淨基準，不再殘留歷史陳舊 diff。

### 3. `src/data` 轉型為動態組合層 (Dynamic Adapter)

- `src/data/cardReviewData.ts` 改為純動態適配器，自 `src/engine/cards/registry.ts` 即時讀取全部卡牌，與 `activeProposals.ts` 合併，動態輸出 `ALL_CARD_REVIEW_ITEMS`。
- `src/data/monsterReviewData.ts` 自 `src/engine/enemyCatalog.ts` 動態拉取深度 1~4 敵怪，並與獨立抽離之戰術指南 `src/data/monsterTips.ts` 合併，動態輸出 `MONSTERS_BY_DEPTH`。
- 對外型別與資料介面維持 100% 向後相容，既有呼叫端（`CardReviewLab.tsx`、`generateStandaloneReviewHtml.ts`）零破壞。

### 4. 卡牌效果文字合成器 (Card Effect Synthesizer)

- 於 `src/engine/cards/synthesizer.ts` 實作純函數 `synthesizeCardDescription(card: Card): string`。
- 解析 `CardEffect` 的各類效果型別（`damage`、`armor`、`apply_status`、`draw` 等）、附加參數（`piercing`、`hitCount`、`scaleFrom`）、觸發條件（`condition`）與關鍵字（`exhaust`、`retain`、`innate`），自動合成標準克蘇魯風格之中文敘述。
- 於審查實驗室 (Review Lab) 介面中並列展示「手寫人文描述」與「⚙️ 程式合成效果」，並提供即時一致性檢查與警告（Drift Detection）。

---

## 影響與後續效果 (Consequences)

1. **零雙重維護**：任何在 `src/engine` 進行的數值平衡或新敵怪/新卡牌擴充，Review Lab 與導出 HTML 將自動即時生效。
2. **乾淨生命週期**：`activeProposals.ts` 僅儲存當前待審項目，審查決策落地後直接歸檔，代碼庫不再膨脹逾千行過期文字。
3. **文實一致保障**：透過程式效果合成器，設計者在調整數值或出牌效果時，能第一時間抓出手寫說明與實際程式邏輯之微差。
