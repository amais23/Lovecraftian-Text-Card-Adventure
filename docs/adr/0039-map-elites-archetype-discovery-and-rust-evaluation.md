# 0039. MAP-Elites 跨深度品質多樣性流派探勘架構與 Rust/Wasm 算力驗證標準 (MAP-Elites Quality-Diversity Archetype Discovery & Rust Compute Evaluation)

## 狀態 (Status)

Accepted（補充 ADR-0036 蒙地卡羅平衡模擬、ADR-0037 Rust/Wasm 統一化架構、ADR-0038 自然湧現拓撲星系圖）

## 脈絡與問題陳述 (Context & Problem Statement)

在 ADR-0038 中，我們實現了非監督式 Louvain 圖論分群與 SVD 牌庫拓撲星系圖。然而，深入檢驗生成機制時發現：

1. **虛假流派與局部極值缺失 (Pseudo-Archetypes vs. True Local Maxima)**：
   現行機制僅是從 4 個粗粒度協同社群中隨機取 70% 成員卡進行微調抖動，生成「人造家族變體」，並未在離散組合空間（$\approx 10^{26}$ 種牌庫）中透過搜尋演算法求得真實的「局部極大值解（Local Maximum Peaks）」。
2. **算力極限與重構必要性之爭 (Issue #66 Causality Debate)**：
   Issue #66 提出將戰鬥核心遷徙至 Rust/Wasm 以獲得百萬場/秒極限算力。然而，窮舉 $10^{26}$ 在物理上即使使用 Rust 亦不可能實現；找不出極值流派的根本瓶頸在於**缺乏搜尋演算法（Optimization Search Algorithm）**，而非語言算力。
3. **前期平民過渡與後期成型神裝之混淆**：
   若不加入卡牌階級約束，單純求全局最高分必然導致搜尋結果全數收斂至「塞滿 Tier 3~4 神話卡的大後期牌庫」，完全忽視了調查員在第 1 深度開局時「純靠低階牌能組出的最強平民流派」。

## 決策內容 (Decision)

經架構評審與深入對齊，確立採用 **MAP-Elites（多維特徵菁英網格演算法，Quality-Diversity）** 於 TypeScript 引擎先行驗證，並以此裁決 Issue #66 的推進優先級：

### 1. 二維風格行為網格 (2D Behavior Feature Grid)

建立 $8 \times 8 = 64$ 格（或 $10 \times 10 = 100$ 格）之特徵網格，每個格子僅保留該風格象限中實戰強度最高的一套「菁英牌庫（Elite Deck）」：

- **維度 X：攻防風格（Armor Ratio, $0.0 \sim 1.0$）**：
  $$\text{Armor Ratio} = \frac{\text{戰鬥累積總護甲}}{\text{戰鬥累積總護甲} + \text{造成總傷害}}$$
  - $0.0 \sim 0.3$：極限直傷 / 穿刺流血 / 自殘爆發（紅色戰鬥卡）
  - $0.4 \sim 0.6$：攻守兼備節奏流
  - $0.7 \sim 1.0$：鐵壁蓄力 / 護甲猛擊反傷（黃色技能防禦卡）

- **維度 Y：牌庫平均階級（Average Card Tier, $1.0 \sim 3.5$）**：
  $$\text{Average Tier} = \frac{\sum \text{Card.tier}}{\text{牌庫總張數}}$$
  - $1.0 \sim 1.5$：前期低階過渡牌庫（幾乎全為基礎與 Tier 1 卡）
  - $1.6 \sim 2.4$：中期成型流派（融入 Tier 2 核心主力）
  - $2.5 \sim 3.5+$：大後期終極神裝（高階 Tier 3~4 神話卡組）

### 2. 跨深度越級壓力測試評測體系 (Punch-Above-Weight Stress Testing)

強度評定（Fitness Function）以「[生命值 (Health)](file:///Users/sandbox1/Documents/文字冒險遊戲/CONTEXT.md#L17) 保留率」與「戰鬥勝率」為核心。為挖掘出真正具備質變協同的流派，強迫執行**跨深度越級抗壓檢定**：

$$\text{Fitness} = 0.4 \times \text{Score}_{\text{Baseline}} + 0.6 \times \text{Score}_{\text{Stretch}}$$

- **前期牌庫（Tier 1.0 ~ 1.5）**：面對第 1 深度普通怪（Baseline）+ **第 2 深度精英怪（Stretch 越級）**。
- **中期牌庫（Tier 1.6 ~ 2.4）**：面對第 2 深度精英怪（Baseline）+ **第 3 深度首領（Stretch 越級）**。
- **後期牌庫（Tier 2.5 ~ 3.5+）**：面對第 3 深度首領（Baseline）+ **第 4 深度舊日支配者（Stretch 越級）**。

### 3. 牌庫合法性物理與變異運算子 (Constraints & Mutations)

- **牌庫規模**：嚴格維持在 $10 \sim 35$ 張 [理智牌庫 (Sanity Deck)](file:///Users/sandbox1/Documents/文字冒險遊戲/CONTEXT.md#L33)。
- **同名卡上限**：單卡上限最多 3 張（防止無效堆疊）。
- **[手牌保留數 (Hand Retention)](file:///Users/sandbox1/Documents/文字冒險遊戲/CONTEXT.md#L29)**：隨機變異於 $2 \sim 6$ 張。
- **變異算子**：
  - 80% 置換卡牌（隨機替換 1 張為全典籍 73 卡之一）
  - 10% 添購卡牌（若 $< 35$ 張）
  - 10% 除役卡牌（若 $> 10$ 張）

### 4. Issue #66（Rust/Wasm 重構）算力裁決門檻

- **門檻 A（驗證成功，Rust 重構暫緩）**：
  若在現有純 TypeScript 引擎下，跑 3,000 ~ 5,000 次演化迭代之總耗時 $\le 15$ 秒，且能成功從網格中萃取出 $\ge 4$ 套獨立且非重疊（軟加權餘弦距離 $\ge 0.4$）的局部極值流派：
  👉 **結論：當前無效能瓶頸，Issue #66 正式標記為 Roadmap / Backlog 暫緩，工程資源優先投入未閉環之 #42 地圖與 #17 結局。**
- **門檻 B（需要 Rust 算力突破）**：
  若 TypeScript 執行 3,000 次迭代耗時 $> 60$ 秒或記憶體溢出：
  👉 **結論：算力確實成為真流派搜尋之瓶頸，立即啟動 Issue #66 進行 Rust/Wasm 遷移。**

## 影響與後續效益 (Consequences)

1. **破除虛假變體**：以 MAP-Elites 徹底取代人工拼湊 70% 核心卡的粗糙作法，使產出的流派具備嚴格的局部極值數學保證。
2. **生態階梯清晰**：設計師能清晰洞察「前期只用平民牌，越級挑戰的最優解長什麼樣」以及「大後期的極致天花板流派為何」。
3. **為重大重構建立客觀驗收門檻**：以客觀數據回答「要不要做 Rust」，杜絕未經實測的過早優化。
