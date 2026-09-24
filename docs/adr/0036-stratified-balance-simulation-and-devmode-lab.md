# 0036. 分層正交蒙地卡羅平衡模擬引擎、洗牌機制語意修正與開發者審查室 (Stratified Orthogonal Balance Simulation Engine, Deck Shuffling Correction & In-Game DevMode Lab)

## 狀態 (Status)

Accepted（補充 ADR-0002 理智牌庫機制、ADR-0026 敵怪動態平衡與 ADR-0035 審查適配層）

## 脈絡與決策動機 (Context & Trade-offs)

本專案現已收錄 73 張典藏卡牌原型、6 種舊日遺物與跨 4 個調查深度的 26 隻敵怪。然而，戰鬥數值長期缺乏全面性、自動化的全組合量化平衡測試工具，導致改動時難以客觀衡量單卡、遺物與敵怪的真實強度。

在規劃數值平衡測試與檢視底層戰鬥代碼時，浮現出四項關鍵衝突與架構權衡：

1. **洗牌機制與卡面語意脫鉤 (Shuffle Implementation Drift)**：
   - 卡牌文案載明「洗回 2 張卡牌至理智牌庫」或「注入真相微光」，但 [evaluator.ts](file:///Users/sandbox1/Documents/文字冒險遊戲/src/engine/cards/evaluator.ts) 底層實作使用 `unshift` 將卡牌硬塞於牌庫最前端（Index 0），且未呼叫 `fisherYatesShuffle`。
   - 這導致剛洗回或注入的卡牌 100% 於下次回合第一時間被抽回，產生了非預期的「無限連續護甲/頓悟自循環」，嚴重扭曲戰鬥真實難度與平衡性評估。
2. **多回合深層 Minimax 的算力膨脹與 TAS 機器人偏誤 (Minimax vs Stochastic Combat)**：
   - 卡牌對弈每回合存在隨機抽牌（Expectimax 難題），前瞻 2~3 回合的狀態樹分支高達數十萬節點，對數萬組牌組進行窮舉將導致算力崩潰。
   - 更致命的是，Minimax 假設玩家擁有 0% 失誤率的算力神仙操作，會將極易暴斃的極限自殘卡誤判為 T0 神卡，同時低估高容錯的穩健基石卡。
3. **純隨機蒙地卡羅（Naive Random Sampling）的不均勻盲點**：
   - 若僅依靠純隨機組牌進行模擬，高階或冷門連鎖卡（如神印、護甲猛擊、引爆）極難有機湊齊，會產生樣本偏誤與極大統計方差。
4. **瀏覽器端即時計算 vs 離線終端批次產出**：
   - 在前端 React 執行緒或 Web Worker 進行大規模組合模擬會搶佔客戶端資源；最理想的架構是由開發者在終端離線批次產出結構化數據，遊戲前端則零負擔直接讀取展示。

---

## 決策內容 (Decision)

### 1. 戰鬥引擎洗牌機制語意修正 (Full Reshuffle on Restore & Injected Truth)

- 修正 [src/engine/cards/evaluator.ts](file:///Users/sandbox1/Documents/文字冒險遊戲/src/engine/cards/evaluator.ts)：
  - `restore_sanity`（技能卡洗回棄牌）：卡牌移入 `newSanityDeck` 後，立即調用 `fisherYatesShuffle(newSanityDeck)` 徹底隨機打亂，符合卡面「洗回」語意。
  - `add_to_deck`（白色真相卡注入【真相微光】）：卡牌生成移入 `newSanityDeck` 後，同步調用 `fisherYatesShuffle(newSanityDeck)` 隨機打亂，防止置頂連續自循環。
- 同步調整單元測試斷言，由原先硬編碼檢查索引 0/1 改為牌庫長度與集合包含性檢驗（`toContain`）。

### 2. 雙軌啟發式決策 AI：上限與容錯下限壓力測試 (Dual-Track 1-Ply Policy & Fault Tolerance)

捨棄多回合深層 Minimax，改採雙軌啟發式決策引擎：

1. **單回合最優決策求解（1-Ply Turn-Optimal Policy - 測量強度上限）**：
   - 當前手牌與敵怪意圖為完全確定性資訊。窮舉當前回合手牌的所有合法出牌順序（排列數 $<16$，單回合運算耗時 $<0.02$ms）。
   - 以啟發式評價函數選取當回合最佳出牌路徑（優先斬殺、化解即將承受的致命傷害、依破甲/易傷/力量/護甲堆疊的最優順序出牌）。
2. **容錯壓力測試（Fault-Tolerance Stress Test - 測量強度下限）**：
   - 注入次優抉擇噪音與亂序出牌檢定，評估卡牌在抽牌不順或操作失誤時的穩健度。
   - 產出【容錯穩定係數】：甄別「高難度特化陷阱卡」（上限極高但下限暴跌）與「S 級高容錯基石卡」（上下限皆穩健）。

### 3. 分層正交蒙地卡羅採樣（Stratified Orthogonal Monte Carlo Sampling）

為確保 73 張卡牌、6 種遺物與 26 隻敵怪獲得 100% 絕對均勻且無死角的全面覆蓋：

1. **受試對象保證配額 (Guaranteed Quota)**：
   - 73 張卡牌逐一作為受試變因，強制以 $1\times, 2\times, 3\times$ 重複張數植入受試牌組，每項配置保證進行固定場次模擬（$N = 200$ 場）。
   - 6 種舊日遺物固定以持有 $0, 1, 2, 3$ 個分別進行對稱測試。
2. **敵怪全矩陣對決 (Full 26-Enemy Matrix)**：
   - 每種牌組輪番單挑 Depth 1 至 Depth 4 全量 26 隻敵怪，產出全深度剋制矩陣。
3. **三重環境分層 (Tri-Context Stratification)**：
   - **純淨初始環境**：測試無特定流派時的單卡裸強度（Baseline Power）。
   - **六大流派基底**：測試在專屬流派（護甲反擊、流血穿刺、真相回補、狂亂自殘、高費秘術、狀態磨血）下的協同放大倍率（Synergy Multiplier）。
   - **隨機噪聲環境**：測試在雜牌混合時的泛用適應性。

### 4. 終端離線批次計算 + 結構化 JSON 輸出 (Offline Simulation Script)

- 開發者於終端機執行 `scripts/balanceSimulator.ts`（搭配 Node.js 多執行緒 / Worker Threads），1~2 分鐘內完成全量分層模擬。
- 輸出純淨資料產物：
  - `src/data/balance/balance_raw_data.json`（原始對弈結果）
  - `src/data/balance/balance_summary_data.json`（已統計之天梯分、雙維度雷達、重複堆疊曲線與敵怪威脅表）。

### 5. 遊戲內 Dev Mode 與卡牌審查室整合 (In-Game DevMode Lab)

- **設定開關**：[src/components/modals/SettingsModal.tsx](file:///Users/sandbox1/Documents/文字冒險遊戲/src/components/modals/SettingsModal.tsx) 增設「開發者模式 (Dev Mode)」切換按鈕，預設為關閉，狀態持久化於 `localStorage`。
- **動態選單入口**：主選單 [src/components/TitleMenu.tsx](file:///Users/sandbox1/Documents/文字冒險遊戲/src/components/TitleMenu.tsx) 僅在 Dev Mode 開啟時顯示「⚖️ 卡牌改動審查室」。
- **審查室第三分頁**：在 [src/components/CardReviewLab.tsx](file:///Users/sandbox1/Documents/文字冒險遊戲/src/components/CardReviewLab.tsx) 內擴充「數值平衡天梯與模擬矩陣」分頁，直接靜態讀取 `balance_summary_data.json`，秒開渲染交互式散布圖、雷達圖與重複效益折線圖，瀏覽器執行緒零計算負擔。

---

## 影響與後續效果 (Consequences)

1. **戰鬥物理純淨無暇**：修正了長久以來真相卡與洗回卡置頂之漏洞，使抽牌機率模型與「理智牌庫不可逆消耗」之克蘇魯恐怖核心設定一致。
2. **科學客觀的平衡天平**：透過分層正交採樣與雙軌啟發式評估，終結憑感覺調數值的歷史，精準抓出隱藏超模卡與陷阱廢卡。
3. **零運行期效能負擔**：將龐大算力完全隔離在終端機離線階段，遊戲前端與打包體積不受模擬演算法膨脹影響。
