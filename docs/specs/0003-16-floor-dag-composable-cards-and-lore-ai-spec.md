# 規格需求說明書 (PRD Spec): 縱向十六層程序化地圖、可組合卡牌原子系統、職業卡池適配與原著特質動態AI

**狀態 (Triage Label)**: `ready-for-agent`  
**領域情境 (Context)**: [CONTEXT.md](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure/CONTEXT.md)  
**架構決策參考**:
- [ADR-0022](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure/docs/adr/0022-depth-16-floor-procedural-dag-and-haven.md)（縱向十六層程序化調查圖與中繼避難所架構）
- [ADR-0023](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure/docs/adr/0023-long-haul-survival-economy-and-field-dressing.md)（長程探險生存經濟與戰地包紮機制）
- [ADR-0024](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure/docs/adr/0024-composable-card-primitives-and-emergent-synergy.md)（可組合卡牌原子效應與流派湧現體系）
- [ADR-0025](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure/docs/adr/0025-occupation-affinity-and-extensible-card-registry.md)（職業卡牌適配與全域登錄架構）
- [ADR-0026](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure/docs/adr/0026-dynamic-tactical-enemy-ai-and-combat-balancing.md)（基於克蘇魯原著生態之專屬特徵動態 AI 與敵怪數值平衡 - Issue #16）
- [ADR-0027](file:///Users/liuchiahan/Documents/Lovecraftian-Text-Card-Adventure/docs/adr/0027-modular-card-registry-and-functional-evaluator.md)（卡牌系統深度模組化與純函數結算管道）

---

## Problem Statement

目前遊戲在多個關鍵維度存在嚴重的機制限制與體驗瓶頸：
1. **地圖規模與歷程過短**：各深度僅有 16 個節點分佈於 6 層，冒險歷程過於短暫，無法提供如同經典爬塔 Roguelike 的深層路線規劃與牌組成長感。
2. **卡牌機制單一且無流派感**：卡牌僅具備靜態固定數值，缺乏動態縮放、多段打擊、條件觸發與生命週期控制；且兩位調查員職業（私家偵探、秘術學者）獎勵卡池完全共通，無法體現「物理槍械體術」與「理智秘術儀式」的流派差異。
3. **戰鬥缺乏平衡且敵怪 AI 呆板（Issue #16）**：怪物採用機械式固定循環意圖，缺乏狂暴與防拖延機制；怪獸強度未建立清晰矩陣，且所有敵怪行為同質化，脫離了洛夫克拉夫特原著小說中異教徒、食屍鬼、夜魘、深潛者、修格斯各具特色的恐怖生理與心理折磨生態。
4. **長途探險生存經濟缺失**：若將深度擴展為 16 層（全遊戲總計 56 層），調查員初始 25 點凡人生命值若維持戰後零恢復，將在第 4~5 層即無可避免身亡。
5. **程式碼跨模組洩漏與膨脹**：新增一張卡牌需同步修改 5 個不同檔案，打牌結算直接寫在 2,185 行的 Reducer 中，嚴重阻礙後續內容擴充與自動化測試。

---

## Solution

依據 `/grill-with-docs` 確立之 ADR-0022 至 ADR-0027，進行全方位系統重構：

1. **16+16+16+8 縱向卷軸程序化調查圖**：
   - 第一、二、三深度各設 16 個調查樓層（Layers 0~15），第四深度設 8 個調查樓層（Layers 0~7）。
   - 每層隨機生成 1~5 個節點，每節點向前至多延伸 3 條分支連線，拓撲保證全圖無死路。
   - 第 8 層保證為「全避難所中繼層（Mid-Depth Haven）」，所有節點皆為安全避難所。
   - 地圖介面採用由下至上的縱向羊皮紙卷軸，支援平滑滾動、SVG 墨水連線與燭火導航。
2. **長程探險生存經濟與戰地包紮**：
   - 戰後結算介面新增「戰地包紮（Field Dressing）」主動抉擇（放棄選卡，恢復 3~4 HP）。
   - 避難所常規醫療提升至 8 HP；第 8 層中繼避難所提升至 12~15 HP 重度治療。
3. **可組合卡牌原子效應與流派湧現體系**：
   - 實裝四大原子維度：動態數值縮放（護甲聯動、理智反比、印記乘數）、多段打擊與真實穿刺、條件連鎖判定（理智閾值、狀態檢定）、卡牌生命週期關鍵字（消耗、保留、固有）。
   - 全面翻新升級現有卡牌，並擴充新原子卡牌以自發湧現多樣化策略流派。
4. **職業卡牌適配與全域登錄架構**：
   - 卡牌模型支援 `occupations?: OccupationId[]` 標籤，支援專屬、共享與中立通用卡。
   - 戰後獎勵與黑市商人依據當前調查員職業嚴格過濾，杜絕跨職業廢卡，並為未來擴充多職業奠定基礎。
5. **原著生態專屬特質與動態敵怪 AI（Issue #16）**：
   - 依洛夫克拉夫特原著小說，為每種怪物量身打造專屬「深淵被動特質（Eldritch Trait）」與情境意圖（如異教徒狂熱血契、食屍鬼食腐吸血/墓泥妨害、夜魘穿透護甲侵蝕理智、深潛者滑膩免輕傷/潮漲潮落海嘯、修格斯無定形物抗/器官隨機增生）。
   - 嚴格依據「調查深度（Depth 1~4） × 敵怪類別（常規怪 / 精英怪 / 守關首領）」二維矩陣計算數值；超過第 6 回合觸發深淵狂暴（傷害 +50%）防止拖延。
6. **深度模組化架構（CardRegistry + CardEvaluator）**：
   - 建立 `src/engine/cards/` 領域目錄，單一卡牌宣告內聚效果、文本與立繪路徑。
   - `CardRegistry` 封裝查詢；`CardEvaluator` 純函數結算效果，自 `gameReducer.ts` 剝離。

---

## User Stories

### 地圖架構與中繼推進 (Map Architecture & Floors)
1. 作為調查員，當我展開調查時，我看到由 16 個樓層構成的第一深度縱向古地圖，以便我進行長線路線規劃。
2. 作為調查員，當我在地圖介面上操作時，我可以透過滑鼠滾輪或拖曳平滑上下滾動長卷軸，以便查看整張地圖的分支走勢。
3. 作為調查員，當我身處當前樓層時，下一層所有連通的可選節點會以燭火微光呼吸動畫閃爍，引導我做出探索抉擇。
4. 作為調查員，在地圖的每層節點之間，我能看見清晰的復古墨水連線（最多 3 條向前分支），讓我清楚知道每條路線通往何處。
5. 作為調查員，無論我前 7 層走多麼險惡的分支路線，當我抵達第 8 層時，該層所有節點皆為安全避難所（Mid-Depth Haven），確保我能在半程獲得確定性的休整。
6. 作為調查員，當我突破第一、二深度並進入第三深度時，第三深度同樣具備 16 個樓層的完整長度。
7. 作為調查員，當我解鎖隱藏真結局路線進入第四深度（拉萊耶核心）時，我面對一張由 8 個緊湊高危樓層組成的終局地圖。

### 生存經濟與戰地包紮 (Survival Economy & Triage)
8. 作為調查員，在擊敗常規遭遇怪獲勝後，如果我的生命值危險，我可以在獎勵介面點擊「戰地包紮」，放棄拿取新卡牌以換取恢復 3~4 點生命值，藉此調控血量健康。
9. 作為調查員，當我想要維持精簡牌庫、避免無效卡牌稀釋核心流派時，我可以主動選擇「戰地包紮」，達成一舉兩得的戰略目的。
10. 作為調查員，當我進入常規避難所時，我可以執行包紮治療，獲得 8 點生命值恢復。
11. 作為調查員，當我抵達第 8 層中繼避難所時，我可以執行深度休整，獲得 12~15 點生命值的大額治療，為後半程做好充分準備。
12. 作為調查員，當我擊敗該深度的守關舊日首領後，我的身體生命值全額回滿（Heal to Full），讓我以全新姿態邁入下一深度。

### 可組合卡牌原子效應與流派 (Card Primitives & Synergies)
13. 作為調查員，當我打出「重拳壓制」時，我不僅造成物理打擊，還能獲得 2 點護甲，體驗到街頭格鬥的攻防一體感。
14. 作為調查員，當我累積了大量護甲時，我可以打出「護甲猛擊」，造成等同於當前護甲值的巨大傷害，實現以守為攻的流派構築。
15. 作為調查員，當我打出具備【多段打擊】的卡牌（如雙發速射）時，每次攻擊皆能獨立享受【力量】印記加成，使增益效果產生倍率回報。
16. 作為調查員，當目標敵怪身上帶有【易傷】或【流血】時，我可以打出「弱點狙擊」，造成雙倍傷害，體現破綻抓取的策略樂趣。
17. 作為調查員，當我打出標記有【消耗】的強力緊急應變卡（如老兵本能、急救繃帶）時，該卡打出後在該場戰鬥中移出牌庫，不污染後續抽牌。
18. 作為調查員，當我抽到標記有【保留】的戰術防守卡（如就地掩蔽）時，回合結束時它不會被強制棄置，使我能在關鍵回合預備格擋。
19. 作為調查員，當我手牌中有標記有【固有】的卡牌時，每場戰鬥第一回合開局起手必定能抽到該卡。
20. 作為秘術學者，當我的理智牌庫殘留少於 4 張時，我打出的秘術卡牌能動態觸發低理智增傷，讓我在崩潰邊緣體驗極限輸出的快感。
21. 作為秘術學者，我可以打出「深淵引爆」，依據敵怪身上的【恐慌】與【流血】總層數造成倍率毀滅傷害，達成持續折磨後的收割。

### 職業卡牌適配與分流 (Occupation Affinity)
22. 作為私家偵探，在戰後三選一獎勵與黑市商人貨架上，我只會看見私家偵探專屬卡牌（槍械、搏擊、偵查）與中立通用卡牌，絕不會看到其他職業的專屬秘術卡。
23. 作為秘術學者，在戰後獎勵與黑市中，我只會看見秘術學者專屬卡牌（高階秘法、儀式、星界防護）與中立通用卡牌，保持流派構築的純粹。
24. 作為任何調查員，我都能在冒險中獲取中立通用卡牌（如戰地急救手冊、掩體掩蔽、冷靜觀察），作為戰術工具牌補充。
25. 作為遊戲玩家，在主選單打開「卡牌圖鑑」時，我可以看見全遊戲所有職業的卡牌，並能透過標籤切換檢視私家偵探、秘術學者與中立卡的插圖與數值。

### 原著生態敵怪 AI 與戰鬥平衡 (Canonical Lore Enemy AI - Issue #16)
26. 作為調查員，在面對阿卡姆異教徒時，我發現每對他造成累計傷害，他的【狂熱血契】會為他增加力量；當他血量低於 40% 時，他會發動【盲目血祭】自殘並給我施加大量流血，逼迫我謹慎掌控斬殺節奏。
27. 作為調查員，在面對食屍鬼潛伏者時，若我身上帶有【流血】印記，食屍鬼爪擊命中時會觸發【食腐本能】吸血恢復生命，且會向我投擲墓泥減少下回合抽牌，迫使我優先防禦或淨化流血。
28. 作為調查員，在面對夜魘時，夜魘的【無面凝視】直接無視我的物理護甲侵蝕理智牌庫，迫使我迅速打出真相卡回補或速戰速決。
29. 作為調查員，在第二深度面對深潛者戰士時，其【滑膩黏液】會完全無效化小於等於 4 點的輕傷，逼迫我使用高傷害卡牌或魔法卡進行有效打擊。
30. 作為調查員，在面對大袞深淵祭司時，我需要觀察其奇數回合【潮漲】獲得的潮汐護甲，並在偶數回合【潮退】前全力破甲，否則殘留的護甲將轉化為等量海嘯傷害反拍在我身上。
31. 作為調查員，在面對修格斯時，其無定形軀體能減半受到的物理傷害，且每回合會隨機增生巨目、重爪或厚皮，逼迫我根據其形態動態調整出牌。
32. 作為調查員，在第四深度面對克蘇魯星之眷族時，其具備【神性不滅】，生命值無法降至 1 以下，且會持續向我的理智牌庫注入瘋狂污染，直到我將其削弱至 1 點血量並打出【完整的深淵古印】將其終極封滅。
33. 作為調查員，在任何常規戰鬥進行到第 6 回合及以上時，敵怪會觸發【深淵狂暴】（傷害提升 50%），提醒我不可消極無限拖延回合。
34. 作為調查員，在冒險推進中，怪物的基礎生命值與傷害嚴格依「調查深度 × 敵怪類別」呈現清晰合理的梯度，不再有前後期難度失調的混亂感。

---

## Implementation Decisions

### 1. 目錄化卡牌系統與純函數解析器 (`src/engine/cards/`)

- 建立 `src/engine/cards/` 領域目錄：
  - `types.ts`：定義擴充後的 `CardEffect`、`CardTrigger`、`CardKeyword` 與 `CardPlayResult`。
  - `registry.ts`：`CardRegistry` 深度模組，提供簡約查詢介面：
    - `getCardsForOccupation(occupationId, options): Card[]`
    - `getRewardPool(occupationId, depth): Card[]`
    - `getStarterDeck(occupationId): Card[]`
    - `getCardById(id): Card | undefined`
    - `getAllCompendiumCards(): Card[]`
  - 專屬領域子目錄：`investigator/`、`occultist/`、`neutral/`、`special/`。
  - **資料高度內聚**：單一卡牌宣告即內聚其 `id`、`name`、`category`、`tier`、`costType`、`costValue`、`keywords`、`occupations`、`effects`、`description`、`flavorText` 與 `artworkUrl`。
- **純函數卡牌效果解析引擎 (`src/engine/cards/evaluator.ts`)**：
  - 提供 `evaluateCardPlay(card: Card, context: CardPlayContext): CardPlayResult` 純函數。
  - 統一計算印記加成、動態數值縮放、多段打擊、條件連鎖與卡牌生命週期（移入消耗堆、手牌保留）。
  - `gameReducer.ts` 移除長達數百行的效果計算代碼，轉而委託此模組執行並進行 Immutable 狀態寫入。

### 2. 十六層 DAG 隨機地圖生成器 (`src/engine/mapGenerator.ts`)

- 重構 `generateProceduralInvestigationMap`：
  - Depths 1~3 生成 16 個樓層（0~15）；Depth 4 生成 8 個樓層（0~7）。
  - 每一層生成 1~5 個節點，前進分支至多 3 條，基於拓撲排序確保連通且無死路。
  - 第 8 層（Layer 8）生成邏輯固定將所有節點鎖定為 `sanctuary`（Mid-Depth Haven）。
  - 各深度守關首領固定置於頂層（Layer 15 或 Layer 7）。

### 3. 縱向卷軸地圖組件與導航 (`src/components/MapScreen.tsx`)

- 地圖版面由單屏視窗重構為縱向平滑捲動之羊皮紙卷軸（經典爬塔風格）。
- 調查員載入地圖時，視窗自動平滑滾動聚焦於當前所在層級。
- 採用 SVG 曲線即時繪製各節點間的最多 3 條分支連線。
- 當前調查員可前往的下一層節點套用金色燭光呼吸動畫。

### 4. 戰地包紮與分級醫療 (`src/components/RewardScreen.tsx` & `src/engine/gameReducer.ts`)

- `RewardScreen` 中新增「戰地應急包紮」按鈕選項，點選派發 `CLAIM_FIELD_DRESSING` Action，恢復 3~4 HP 並結束結算。
- `SanctuaryScreen` 醫療數值判定：若當前節點所在層級為第 8 層（`node.layer === 8`），治療恢復 12~15 HP；其餘常規避難所恢復 8 HP。

### 5. 原著動態敵怪戰術 AI (`src/engine/enemyCatalog.ts`)

- 敵怪型別擴充 `traits?: EnemyTrait[]` 與動態意圖解析函數 `getNextEnemyIntent(enemy, turnNumber, context)`。
- 實裝洛夫克拉夫特原著專屬特質：狂熱血契、食腐啃咬、無貌深淵、滑膩黏液、大袞潮汐、器官增生、神性不滅。
- 實裝通用防拖延計時：回合數 >= 6 時，意圖攻擊傷害強制提升 50%。
- 依據「深度（1~4） × 類別（常規/精英/首領）」矩陣標準化敵怪生命值與基礎傷害。

---

## Testing Decisions

### 測試品質原則
- **僅測試外部行為，絕不測試內部實現細節**：所有測試僅跨越模組的公開接口縫隙（Seams），不依賴私有變數或中間狀態。
- **高槓桿純函數優先**：核心數學與規則由無副作用的純函數承載，實現毫秒級單元測試。

### 核心測試縫隙 (Seams)
1. **Seam 1: `evaluateCardPlay(card, context)`** (`src/engine/cards/evaluator.test.ts`)
   - 測試動態數值縮放（護甲轉傷害、印記倍率、理智反比）。
   - 測試多段打擊與真實穿刺。
   - 測試條件觸發（低理智、易傷檢定）。
   - 測試卡牌生命週期（消耗堆、保留手牌標記）。
2. **Seam 2: `CardRegistry` 查詢介面** (`src/engine/cards/registry.test.ts`)
   - 測試私家偵探僅能取得偵探專屬卡與中立卡。
   - 測試秘術學者僅能取得學者專屬卡與中立卡。
   - 測試全域圖鑑包含全部卡牌且無重複 ID。
3. **Seam 3: `getNextEnemyIntent(enemy, turn, context)`** (`src/engine/enemyCatalog.test.ts`)
   - 測試異教徒受傷累積力量、低血發動盲目血祭。
   - 測試夜魘無視護甲直擊理智。
   - 測試大袞祭司奇數回合潮漲、偶數回合潮退海嘯轉化。
   - 測試第 6 回合深淵狂暴計時增傷。
4. **Seam 4: `generateProceduralInvestigationMap(options)`** (`src/engine/mapGenerator.test.ts`)
   - 測試第一至三深度精確生成 16 個樓層，第四深度精確生成 8 個樓層。
   - 測試每層節點數落於 1~5 個，前進分支數 <= 3。
   - 測試第 8 層所有節點皆為 `sanctuary`。
   - 測試全圖連通性（由 Layer 0 任一節點皆可到達 Boss 節點，無死路孤島）。
5. **Seam 5: `gameReducer(state, action)`** (`src/engine/gameReducer.test.ts`)
   - 測試 `CLAIM_FIELD_DRESSING` 放棄卡牌並恢復 3~4 HP。
   - 測試第 8 層避難所恢復 12~15 HP。
   - 測試打出消耗卡牌正確移入 `exhaustPile`。

### 既有測試借鑑 (Prior Art)
- `src/engine/handMath.test.ts`（純函數數值計算測試）
- `src/engine/gameReducer.test.ts`（狀態機與動作分發測試）
- `src/engine/cardCatalog.test.ts`（卡牌圖鑑去重測試）

---

## Out of Scope

- 本期不引入多人連線或線上卡牌交易機制。
- 本期不重構或更動現有的雙結局文字敘事文本與序章剪報音效。
- 本期不重構既有的 1920 年代復古寫實肖像立繪（ADR-0020）與雙重認知濾鏡透明立繪（ADR-0021），僅擴充其戰鬥資料綁定。

---

## Further Notes

- 本 PRD 徹底關閉 GitHub Issue #16 之戰鬥平衡性與卡牌擴充技術債。
- 本規格書為後續實裝工作票（Sub-issues / Tickets）之最高權威依據。
