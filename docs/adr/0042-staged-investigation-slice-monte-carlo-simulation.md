# 0042. 七階切片多流派代理人蒙地卡羅平衡模擬引擎、全域混合存活池與時間預算動態採樣 (Staged Investigation Slice Multi-Archetype Monte Carlo Simulation Engine, Global Mixed Pool & Time-Budget Sampling)

## 狀態 (Status)

Accepted（補充 ADR-0036 正交戰鬥平衡模擬、ADR-0022 深度 16 層 DAG 地圖與 ADR-0030 生存結算引擎）

## 脈絡與決策動機 (Context & Trade-offs)

專案原先於 ADR-0036 建立了針對卡牌與敵怪的單場正交戰鬥模擬器（[combatSimulator.ts](file:///Users/sandbox1/Documents/文字冒險遊戲/src/engine/simulation/combatSimulator.ts)）。然而，該模擬器僅衡量孤立戰鬥環境（滿血開局、預設固定牌庫），無法真實反映調查員在真實遊戲探索進程中的宏觀體驗：

1. **不可逆生存損耗被忽略**：生命值戰後不自動恢復，跨節點的累積損耗（如殘血進入精英戰）才是決定勝率的關鍵。
2. **理智牌庫動態擴充與稀釋**：戰鬥勝利掉落卡牌、深淵封印殘片、避難所與黑市除役機制，持續改變牌庫厚度與流派濃度。
3. **節點資源經濟未聯動**：古金幣獲取、黑市道具採購、安全避難所行動抉擇對長途生存具有決定性影響。

### 窮舉搜尋 vs 蒙地卡羅抽樣之技術權衡 (Trade-offs Evaluation)

在評估全地圖平衡模擬架構時，深入檢驗了兩種核心演算法路線：

- **方案 A：DFS 全排列枚舉＋狀態雜湊去重（已否決）**：
  - **致命缺陷 1（狀態去重失效）**：肉鴿遊戲中每次挑選卡牌、損耗生命值或獲取金幣皆產生微觀狀態分歧，導致快照雜湊 $f(\text{nodeId}, \text{health}, \text{obols}, \text{deckFingerprint})$ 幾乎零碰撞（碰撞率 $< 0.5\%$）。
  - **致命缺陷 2（組合爆炸與 OOM）**：單一切片 8 層路徑在枚舉戰後 5 種選擇、避難所每張卡牌除役、黑市所有子集購買時，未剪枝狀態樹膨脹至 $10^7$（千萬級），全旅程計算量達 $3 \times 10^9$ 次戰鬥，理論耗時高達 $O(10^5\text{ 秒}) \approx 70 \sim 95$ 小時，且必引發 Node.js V8 堆疊溢出（OOM）。
  - **致命缺陷 3（PRNG 序列漂移）**：不同分支抽牌回合長度不一，導致後續節點隨機數指標偏移，無法保證相同節點的環境確定性。
- **方案 B：多流派代理人蒙地卡羅軌跡抽樣（本決策採納）**：
  - **線性複雜度與常數記憶體**：每條 Rollout 為長度 8 層的線性自然軌跡，記憶體開銷 $O(1)$，每條路徑跑完即流式聚合（Streaming Accumulation）。
  - **天然 PRNG 對齊**：每次 Rollout 使用獨立隨機種子生成切片地圖與洗牌，時間序列天然推進，均勻覆蓋全遊戲數萬種隨機地圖生態。
  - **多流派擬真決策**：透過不同代理人性格模擬多元玩家群體行為，避免單一盲選導致的數值失真。
  - **時間預算自適應**：以固定秒數（如 15 秒）作為預算動態跑滿抽樣，兼具開發即時性與統計嚴謹度。

---

## 決策內容 (Decision)

### 1. 全地圖七階調查切片架構 (Seven-Stage Investigation Slice Architecture)

將橫跨 4 個調查深度的完整冒險歷程，以每 8 層為單位劃分為 7 個標準「調查切片（Investigation Slice）」：

- **Slice 1**: Depth 1 前階 (Floor 0 ~ 7，開局探索)
- **Slice 2**: Depth 1 後階 (Floor 8 ~ 15，第一深度決戰，守關首領：修格斯幼體)
- **Slice 3**: Depth 2 前階 (Floor 0 ~ 7，深潛者潮汐滲透)
- **Slice 4**: Depth 2 後階 (Floor 8 ~ 15，第二深度決戰，守關首領：大袞的深淵祭司)
- **Slice 5**: Depth 3 前階 (Floor 0 ~ 7，修格斯原核異界)
- **Slice 6**: Depth 3 後階 (Floor 8 ~ 15，第三深度決戰，守關首領：原生巨型修格斯)
- **Slice 7**: Depth 4 深淵核心 (Floor 0 ~ 7，終極支配者對決，守關首領：克蘇魯星之眷族)

每個切片長度嚴格限制為 8 層，徹底消除整趟長征的跨深度組合膨脹。

### 2. 四種等比例調查代理人性格 (Four Investigation Agent Personas @ 25% each)

在蒙地卡羅採樣中，導入四種代表不同玩家風格的行為代理人（Investigation Agent Persona），預設採等比例（各 25%）抽樣：

1. **平衡型 (Balanced, 25%)**：
   - 常規理性玩家基準。中度生命值警戒門檻（HP $\le 45\%$ 時回血）。
   - 綜合考量卡牌強度評分與牌庫厚度，動態調整戰後拿牌與避難所除役。
2. **謹慎型 (Cautious, 25%)**：
   - 生存保命流。高度生命值警戒門檻（HP $\le 65\%$ 時全力包紮回血）。
   - 路線優先選擇避難所與常規戰，主動避開精英與禁忌祭壇；戰後與黑市偏好防禦及治療手段。
3. **貪婪型 (Greedy, 25%)**：
   - 極限構築流。低度生命值警戒門檻（HP $\le 25\%$ 才被迫回血）。
   - 追求極致精簡牌庫與高 Tier 神話牌；避難所優先除役普通打擊/防禦，衝黑市搶購強力遺物。
4. **純隨機型 (Pure Random, 25%)**：
   - 探索與極限邊界基線。所有地圖前進路徑、戰後獎勵、避難所與奇遇選項均採 $1/K$ 均勻等機率盲選，衡量系統下限。

### 3. 雙參數簡化行為模型與戰鬥出牌求解 (Two-Axis Behavioral Model & 1-Ply Solver)

- **戰鬥內部出牌**：所有流派統一沿用現有 1-ply 最優求解器（[turnSolver.ts](file:///Users/sandbox1/Documents/文字冒險遊戲/src/engine/simulation/turnSolver.ts)），保證戰鬥單場微觀理性與極高運算速度（$\approx 0.08\text{ ms}$ / 場）。
- **非戰鬥決策模型**：簡化為兩大參數切分軸，其餘決策採統一 Softmax 效用函數計算：
  - **`healthAlertThreshold`（生命值警戒門檻）**：觸發時權重壓倒性傾向戰地包紮、避難所治療與醫療物資。
  - **`deckTendency`（拿牌/除役偏好）**：決定卡牌抓取門檻與除役優先順序。

### 4. 全域混合存活池交接與指標局部獨立 (Global Mixed Pool Handoff & Metric Isolation)

- **全域混合存活池（Global Mixed Pool）**：
  - 前一切片結束時，所有存活之調查員實體（保留剩餘 HP、當前牌庫、已獲遺物與金幣）匯入同一個全域存活池。
  - 下一切片開始時，每次 Rollout 隨機從該池中抽樣一隻存活實體作為起點，不分流派來源，健壯、抗全滅且天然模擬不同探索階段玩家風格的交替。
- **指標局部獨立原則**：
  - **物理狀態完全繼承**：調查員完整保留當前 HP、牌庫、古金幣與遺物。
  - **切片指標局部重置**：切片內部的戰鬥損血（Combat HP Loss）與切片淨損血（Slice Net HP Loss）從 0 重新統計該切片表現，徹底消除前置切片的歷史損害干擾。
  - **長征累計獨立追蹤**：頂層進程表另行獨立記錄「全程累計淨損血（Total Journey Net HP Loss）」。

### 5. 時間預算動態採樣模式 (Time-Budget Dynamic Sampling Mode)

- **預設時間預算（Time Budget）**：
  - 預設執行 **15 秒**，均勻平分至 7 個切片（每切片約 2.1 秒）。
  - 單執行緒在 15 秒內預計可完成 **45,000 ～ 50,000+ 條完整軌跡**（涵蓋約 180,000+ 場戰鬥），大數統計信心度極高。
- **命令列靈活覆寫**：
  - `--time <seconds>`：覆寫時限（如 `--time 5` 極速除錯、`--time 60` 深度驗證）。
  - `--samples <count>`：指定每切片固定 Rollout 條數（如 `--samples 10000`）。
  - `--occupation <type>`：指定調查員職業（`investigator` 或 `occultist`）。

### 6. 完整統計產出體系 (Complete Statistical Metrics Suite)

模擬引擎聚合產出兩大層級、完整客觀的純統計數據大表：

#### A. 橫向進程與流派表現快照 (Cross-Progression & Persona Breakdown)

1. **7 切片橫向進程總覽表 (Seven-Slice Cross-Progression Summary)**：
   - 彙整 7 個切片的橫向演變（進入樣本數、通關樣本數、獨立存活率、累積存活率、單場均損血、末均 HP、末均牌庫張數、瘋狂觸發率與頭號致命怪）。
2. **四種代理人流派獨立表現快照 (Persona Breakdown Snapshot)**：
   - 在各切片獨立呈現平衡型、謹慎型、貪婪型與純隨機型的【獨立存活率】與【平均損血量】對比。

#### B. 全要素客觀交叉統計大表 (Exhaustive Cross-Matrix Tables)

1. **節點生成率 vs 實際造訪率表 (Node Generation & Visit Rates)**。
2. **全 26 隻敵怪分別獨立統計表 (All 26 Monsters Breakdown)**：
   - 遭遇次數、遭遇機率、損血均值/中位數/極值、戰鬥回合數、直接致死率與勝率。
3. **精確卡牌張數分別獨立統計表 (Exact Deck Size Breakdown: 8 ~ 25+ 張)**：
   - 各張數之路徑佔比、單場損血、淨損血、死亡率與瘋狂觸發率。
4. **全地圖節點路徑分支與節點內部抉擇統計 (DAG Paths & Intra-Node Choices)**：
   - 分支選取率、戰後選擇（包紮/抓牌/跳過/殘片）、避難所抉擇、黑市各項目選取率與死亡率差值。
5. **每張卡牌分別獨立全量統計表 (Per-Card Exhaustive Breakdown: 73 張全覆蓋)**：
   - 出現率、選入率、損血差 $\Delta\text{HP}$、死亡差值 $\Delta\text{Mortality}$、存活組 vs 陣亡組持有率。
6. **雙群組對比統計分析 (Surviving vs. Fallen Group Comparison)**。

### 7. 資料組織架構、CLI 與 DevMode 整合

- **資料組織架構 (`src/data/balance/journey_summary.json`)**：
  - `progression`: 7 切片宏觀進程陣列。
  - `slices[sliceId]`: 各切片二級物件（含 `personas`、`monsters`、`deckSizes`、`pathChoices`、`intraNodeChoices`、`cards`、`groupComparison`）。
- **CLI 終端互動**：
  - `npm run sim:journey`：輸出宏觀總覽與當前切片明細。
  - `--slice <1-7>`：切換切片明細。
  - `--all-monsters` / `--all-cards`：展開全量 26 隻怪物或 73 張卡牌大表。
- **DevMode 審查室整合 ([CardReviewLab.tsx](file:///Users/sandbox1/Documents/文字冒險遊戲/src/components/CardReviewLab.tsx))**：
  - 第四分頁「全地圖數值熱點地圖」，頂層折線圖展示進程走勢，下方 Tab 切換載入各切片明細。

---

## 影響與後續效果 (Consequences)

1. **消滅算力黑洞，時間確定可控**：將執行時間從理論上的數十小時降至 **15 秒之內**，開發者在日常平衡調整時可隨時執行驗證。
2. **記憶體安全性保障**：每條 Rollout 即時聚合銷毀，記憶體維持常數級 $O(1)$（$< 250\text{ MB}$），杜絕 OOM。
3. **多流派擬真玩家生態**：透過 4 種性格代理人綜合反映真實玩家在不同心態下的決策，平衡指標更具備實際可玩性指導價值。
4. **無偏統計與大數信心**：隨機種子全面抽樣數萬種地圖拓撲，徹底消除單一固定種子的過擬合偏誤。
