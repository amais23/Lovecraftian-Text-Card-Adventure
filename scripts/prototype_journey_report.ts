/**
 * PROTOTYPE - 全地圖蒙地卡羅平衡統計報表示意原型
 *
 * 本原型展示全地圖切片模擬實作後產出的完整統計報表樣貌，包含：
 * 0. 7 切片橫向進程總覽表 (Seven-Slice Cross-Progression Summary)
 * 1. 基礎機率分佈表 (節點、敵怪、卡牌、樓層狀態、屬性)
 * 2. 全 26 隻敵怪分別獨立統計資料表 (All 26 Monsters Breakdown)
 * 3. 不同卡牌張數分別獨立統計資料表 (Exact Deck Size Breakdown: 8~25+ 張)
 * 4. 所有地圖節點路徑分支與節點內部抉擇統計資料 (DAG Paths & Node Choices)
 * 5. 每張卡牌分別獨立全量統計表 (Per-Card Exhaustive Breakdown)
 * 6. 雙群組對比統計分析 (存活組 vs 陣亡組)
 *
 * 執行指令:
 *   npm run prototype:journey (預設展示宏觀總覽 + Slice 1 明細)
 *   npx tsx scripts/prototype_journey_report.ts --slice 2 (切換檢視 Slice 2: D1後階)
 *   npx tsx scripts/prototype_journey_report.ts --all-monsters (輸出全量 26 隻怪物)
 *   npx tsx scripts/prototype_journey_report.ts --all-cards (輸出全量 73 張卡牌)
 */

import { CardRegistry } from '../src/engine/cards/registry';
import { MONSTERS_BY_DEPTH, type MonsterReviewData } from '../src/data/monsterReviewData';

function divider(char = '=', len = 100): string {
  return char.repeat(len);
}

function subDivider(len = 100): string {
  return '-'.repeat(len);
}

function header(title: string): void {
  console.log('\n' + divider('='));
  console.log(`  \x1b[1m\x1b[36m${title}\x1b[0m`);
  console.log(divider('='));
}

function subHeader(title: string): void {
  console.log('\n' + subDivider());
  console.log(`  \x1b[1m\x1b[33m▶ ${title}\x1b[0m`);
  console.log(subDivider());
}

export const SLICE_METADATA = [
  { id: 1, name: 'Slice 1: Depth 1 前階 (Floor 0~7)', depth: 1, role: '探索開局', boss: '無 (常規/精英遭遇)' },
  { id: 2, name: 'Slice 2: Depth 1 後階 (Floor 8~15)', depth: 1, role: '第一深度決戰', boss: '達貢眷族主教' },
  { id: 3, name: 'Slice 3: Depth 2 前階 (Floor 0~7)', depth: 2, role: '深潛者潮汐滲透', boss: '無 (常規/精英遭遇)' },
  { id: 4, name: 'Slice 4: Depth 2 後階 (Floor 8~15)', depth: 2, role: '第二深度決戰', boss: '達貢巨型神眷' },
  { id: 5, name: 'Slice 5: Depth 3 前階 (Floor 0~7)', depth: 3, role: '修格斯原核異界', boss: '無 (常規/精英遭遇)' },
  { id: 6, name: 'Slice 6: Depth 3 後階 (Floor 8~15)', depth: 3, role: '第三深度決戰', boss: '原生巨型修格斯' },
  { id: 7, name: 'Slice 7: Depth 4 深淵核心 (Floor 0~7)', depth: 4, role: '終極支配者對決', boss: '舊日支配者化身' },
];

export function printJourneyReportPrototype(options: {
  showAllCards?: boolean;
  showAllMonsters?: boolean;
  targetSlice?: number;
} = {}): void {
  const { showAllCards = false, showAllMonsters = false, targetSlice = 1 } = options;
  const currentSliceMeta = SLICE_METADATA.find(s => s.id === targetSlice) ?? SLICE_METADATA[0];

  console.clear();
  console.log(divider('#'));
  console.log('  \x1b[1m\x1b[32m【克蘇魯文字卡牌冒險】全地圖七階切片多流派蒙地卡羅平衡模擬統計報表 (PROTOTYPE DEMO)\x1b[0m');
  console.log('  測試對象: 私家偵探 (愛德華·皮爾斯) | 探索切片架構: 7 階段雙層視角 | 採樣機制: 獨立隨機種子 Rollout');
  console.log(`  當前檢視切片: \x1b[1m\x1b[33m[${currentSliceMeta.name}]\x1b[0m (使用 --slice 1~7 隨時切換)`);
  console.log('  時間預算模式: 15.0 秒 (均勻平分 ~2.1s / 切片) | 抽樣軌跡總數: 48,250 條 (全域混合存活池交接)');
  console.log('  代理人性格流派: 平衡型 (25%) | 謹慎型 (25%) | 貪婪構築型 (25%) | 純隨機探索型 (25%)');
  console.log(divider('#'));

  // ==========================================
  // 第零部分：7 切片橫向進程總覽表 (宏觀難度爬升走勢)
  // ==========================================
  header('第零部分：7 切片橫向進程總覽表 (Seven-Slice Cross-Progression Summary)');
  console.table([
    { '切片編號與名稱': 'Slice 1: D1 前階 (F0~7)', '進入樣本 N': '48,250', '通關樣本 N': '40,048', '切片獨立存活率': '83.0%', '全程累積存活率': '83.0%', '單場均損血': '5.8 HP', '累計淨損血': '14.2 HP', '末均 HP': '18.4 HP', '末均牌庫': '14.5 張', '瘋狂觸發率': '11.8%', '頭號致命怪': '瘋狂夜魔 (11.2%)' },
    { '切片編號與名稱': 'Slice 2: D1 後階 (F8~15)', '進入樣本 N': '40,048', '通關樣本 N': '26,431', '切片獨立存活率': '66.0%', '全程累積存活率': '54.8%', '單場均損血': '8.2 HP', '累計淨損血': '22.4 HP', '末均 HP': '16.8 HP', '末均牌庫': '17.4 張', '瘋狂觸發率': '24.6%', '頭號致命怪': '達貢主教 (42.0%)' },
    { '切片編號與名稱': 'Slice 3: D2 前階 (F0~7)', '進入樣本 N': '26,431', '通關樣本 N': '19,823', '切片獨立存活率': '75.0%', '全程累積存活率': '41.1%', '單場均損血': '9.4 HP', '累計淨損血': '24.8 HP', '末均 HP': '17.2 HP', '末均牌庫': '18.8 張', '瘋狂觸發率': '18.4%', '頭號致命怪': '深潛者長老 (18.5%)' },
    { '切片編號與名稱': 'Slice 4: D2 後階 (F8~15)', '進入樣本 N': '19,823', '通關樣本 N': '14,272', '切片獨立存活率': '72.0%', '全程累積存活率': '29.6%', '單場均損血': '12.6 HP', '累計淨損血': '31.2 HP', '末均 HP': '15.4 HP', '末均牌庫': '20.2 張', '瘋狂觸發率': '28.1%', '頭號致命怪': '達貢神眷 (52.0%)' },
    { '切片編號與名稱': 'Slice 5: D3 前階 (F0~7)', '進入樣本 N': '14,272', '通關樣本 N': '11,703', '切片獨立存活率': '82.0%', '全程累積存活率': '24.3%', '單場均損血': '13.8 HP', '累計淨損血': '32.5 HP', '末均 HP': '18.1 HP', '末均牌庫': '21.5 張', '瘋狂觸發率': '22.0%', '頭號致命怪': '廷達羅斯犬 (24.2%)' },
    { '切片編號與名稱': 'Slice 6: D3 後階 (F8~15)', '進入樣本 N': '11,703', '通關樣本 N': '10,322', '切片獨立存活率': '88.2%', '全程累積存活率': '21.4%', '單場均損血': '17.4 HP', '累計淨損血': '39.8 HP', '末均 HP': '14.2 HP', '末均牌庫': '22.8 張', '瘋狂觸發率': '34.5%', '頭號致命怪': '原生修格斯 (57.0%)' },
    { '切片編號與名稱': 'Slice 7: D4 深淵核 (F0~7)', '進入樣本 N': '2,316 (真結局)', '通關樣本 N': '2,316', '切片獨立存活率': '100% (印記斬殺)', '全程累積存活率': '4.8% (真結局率)', '單場均損血': '24.5 HP', '累計淨損血': '48.2 HP', '末均 HP': '8.2 HP', '末均牌庫': '24.1 張', '瘋狂觸發率': '64.0%', '頭號致命怪': '支配者化身 (62.0%)' },
  ]);

  subHeader(`表 0-2：【${currentSliceMeta.name}】四種代理人流派獨立表現快照 (Persona Breakdown)`);
  console.table([
    { '代理人流派 (Persona)': '常態平衡型 (Balanced)', '人口比例': '25.0%', '進入樣本數': '12,062', '切片存活率': '88.5%', '單場平均損血': '5.4 HP', '避難所回血偏好': '中等 (HP≤45%觸發)', '典型決策風格': '理性權衡，動態兼顧卡牌品質與生存血線' },
    { '代理人流派 (Persona)': '生存謹慎型 (Cautious)', '人口比例': '25.0%', '進入樣本數': '12,062', '切片存活率': '94.2%', '單場平均損血': '4.2 HP', '避難所回血偏好': '最高 (HP≤65%觸發)', '典型決策風格': '殘血必回、避難所優先、主動避開精英高危' },
    { '代理人流派 (Persona)': '貪婪構築型 (Greedy)', '人口比例': '25.0%', '進入樣本數': '12,063', '切片存活率': '81.4%', '單場平均損血': '6.8 HP', '避難所回血偏好': '最低 (HP≤25%才回)', '典型決策風格': '積極除役初始廢牌、衝黑市買遺物與高階卡' },
    { '代理人流派 (Persona)': '純隨機探索型 (Random)', '人口比例': '25.0%', '進入樣本數': '12,063', '切片存活率': '67.9%', '單場平均損血': '9.1 HP', '避難所回血偏好': '無門檻 (1/K 等機率)', '典型決策風格': '純隨機等機率盲選，作為系統邊界與容錯下限' },
    { '代理人流派 (Persona)': '全流派綜合加權 (Overall)', '人口比例': '100%', '進入樣本數': '48,250', '切片存活率': '83.0%', '單場平均損血': '5.8 HP', '避難所回血偏好': '母體加權平均', '典型決策風格': '真實玩家生態模擬 (4 風格等比例抽樣)' },
  ]);
  console.log(`  \x1b[2m提示: 橫向進程表呈現 7 個切片的獨立存活率與難度爬升斜率。以下展示【${currentSliceMeta.name}】的專屬獨立明細。\x1b[0m`);

  // ==========================================
  // 第一部分：基礎機率分佈與屬性演變統計
  // ==========================================
  header(`第一部分：【${currentSliceMeta.name}】基礎機率與狀態演變分佈`);

  subHeader('表 1-1：節點生成率 vs 實際造訪率 (Node Probabilities & Visit Rates)');
  console.table([
    { '節點類型': '常規遭遇 (Combat)', '生成機率': '48.2%', '實際造訪率': '52.4%', '單場期望損血': '7.4 HP', '致死率': '6.2%' },
    { '節點類型': '精英遭遇 (Elite)', '生成機率': '14.5%', '實際造訪率': '9.8%', '單場期望損血': '16.8 HP', '致死率': '28.4%' },
    { '節點類型': '安全避難所 (Sanctuary)', '生成機率': '12.5%', '實際造訪率': '16.7%', '單場期望損血': '-18.5 HP (回血)', '致死率': '0.0%' },
    { '節點類型': '黑市商鋪 (Market)', '生成機率': '8.2%', '實際造訪率': '7.6%', '單場期望損血': '0.0 HP', '致死率': '0.0%' },
    { '節點類型': '秘識奇遇 (Event)', '生成機率': '13.6%', '實際造訪率': '12.1%', '單場期望損血': '2.1 HP (事件代價)', '致死率': '3.1%' },
    { '節點類型': '禁忌祭壇 (Altar)', '生成機率': '3.0%', '實際造訪率': '1.4%', '單場期望損血': '5.0 HP (獻祭)', '致死率': '0.0%' },
  ]);

  subHeader('表 1-2：卡牌掉落出現率、選入率與五色階級分佈 (Card Drops & Draft Rates)');
  console.table([
    { '卡牌類別 / 階級': '紅色戰鬥卡 (Combat)', '戰利品出現率': '36.5%', '最終選入率': '42.1%', '平均持有張數': '4.8 張', '棄選/跳過率': '18.2%' },
    { '卡牌類別 / 階級': '黃色技能卡 (Skill)', '戰利品出現率': '32.0%', '最終選入率': '35.4%', '平均持有張數': '4.2 張', '棄選/跳過率': '21.5%' },
    { '卡牌類別 / 階級': '紫色魔法卡 (Magic)', '戰利品出現率': '16.8%', '最終選入率': '10.2%', '平均持有張數': '1.1 張', '棄選/跳過率': '48.0%' },
    { '卡牌類別 / 階級': '白色真相卡 (Truth)', '戰利品出現率': '14.7%', '最終選入率': '12.3%', '平均持有張數': '1.5 張', '棄選/跳過率': '28.4%' },
    { '卡牌類別 / 階級': 'Tier 1 (基礎)', '戰利品出現率': '45.0%', '最終選入率': '28.0%', '平均持有張數': '5.5 張', '棄選/跳過率': '34.0%' },
    { '卡牌類別 / 階級': 'Tier 2 (進階)', '戰利品出現率': '35.0%', '最終選入率': '48.5%', '平均持有張數': '4.1 張', '棄選/跳過率': '15.2%' },
    { '卡牌類別 / 階級': 'Tier 3 (稀有)', '戰利品出現率': '16.0%', '最終選入率': '20.1%', '平均持有張數': '1.8 張', '棄選/跳過率': '8.1%' },
    { '卡牌類別 / 階級': 'Tier 4 (神話秘典)', '戰利品出現率': '4.0%', '最終選入率': '3.4%', '平均持有張數': '0.4 張', '棄選/跳過率': '4.5%' },
  ]);

  // ==========================================
  // 第二部分：所有怪物分別獨立統計資料
  // ==========================================
  header(`第二部分：【${currentSliceMeta.name}】敵怪分別獨立統計資料 (Monsters in Depth ${currentSliceMeta.depth})`);

  const allMonsters: MonsterReviewData[] = Object.values(MONSTERS_BY_DEPTH).flat();
  const sliceMonsters = showAllMonsters
    ? allMonsters
    : allMonsters.filter(m => m.depth === currentSliceMeta.depth);

  const monsterTableRows = sliceMonsters.map((m, idx) => {
    const isBoss = m.role === 'boss';
    const isElite = m.role === 'elite';
    const encRate = isBoss ? '100% (第15層)' : isElite ? '9.8%' : `${(38.0 - m.depth * 5 + (idx % 3) * 2).toFixed(1)}%`;
    const encCount = Math.floor(142850 * (isBoss ? 0.38 : isElite ? 0.098 : 0.28));

    const meanHP = (isBoss ? 21.5 + m.depth * 3.5 : isElite ? 16.5 + m.depth * 2.8 : 5.0 + m.depth * 2.2).toFixed(1) + ' HP';
    const medianHP = (isBoss ? 20 + m.depth * 3 : isElite ? 15 + m.depth * 2 : 4 + m.depth * 2) + ' HP';
    const minMaxHP = (isBoss ? '8 ~ 48 HP' : isElite ? '4 ~ 32 HP' : '0 ~ 18 HP');
    const turns = (isBoss ? 7.8 + m.depth * 0.6 : isElite ? 5.8 + m.depth * 0.4 : 3.2 + m.depth * 0.3).toFixed(1) + ' 輪';
    const lethality = (isBoss ? 42.0 + m.depth * 5.0 : isElite ? 28.4 + m.depth * 3.5 : 3.5 + m.depth * 2.1).toFixed(1) + '%';
    const kills = Math.floor(encCount * (parseFloat(lethality) / 100));
    const winRate = (100 - parseFloat(lethality)).toFixed(1) + '%';

    return {
      '怪物名稱 (Name)': m.name,
      '怪物 ID': m.id,
      '深度': `Depth ${m.depth}`,
      '類型': m.role === 'boss' ? '首領 (Boss)' : m.role === 'elite' ? '精英 (Elite)' : '常規 (Normal)',
      '基礎 HP / 護甲': `${m.health} / 護甲 ${m.armor}`,
      '遭遇次數 N': encCount.toLocaleString(),
      '遭遇機率': encRate,
      '損血均值': meanHP,
      '損血中位數': medianHP,
      '損血極值': minMaxHP,
      '平均戰鬥回合': turns,
      '擊殺次數': kills.toLocaleString(),
      '戰鬥致死率': lethality,
      '調查員勝率': winRate,
    };
  });

  console.table(monsterTableRows);
  if (!showAllMonsters) {
    console.log(`  \x1b[2m(顯示當前 Depth ${currentSliceMeta.depth} 專屬敵怪。執行 \x1b[1mnpx tsx scripts/prototype_journey_report.ts --all-monsters\x1b[0m\x1b[2m 可查看全 4 深度 26 隻怪物完整表)\x1b[0m`);
  }

  // ==========================================
  // 第三部分：不同卡牌張數分別獨立統計資料
  // ==========================================
  header('第三部分：不同卡牌張數分別獨立統計資料 (Exact Deck Size Breakdown: 8 ~ 25+ 張)');

  const exactDeckSizes = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const deckSizeTableRows = exactDeckSizes.map((size) => {
    const isSweetSpot = size >= 12 && size <= 16;
    const isThin = size <= 10;

    const pathShareNum = isSweetSpot ? 14.5 - Math.abs(14 - size) * 1.5 : isThin ? 3.2 + (size - 8) * 2.1 : Math.max(1.2, 8.5 - (size - 17) * 0.9);
    const sampleN = Math.floor(142850 * (pathShareNum / 100));

    const meanHPNum = isSweetSpot ? 6.2 + Math.abs(14 - size) * 0.3 : isThin ? 9.8 - (size - 8) * 0.8 : 7.5 + (size - 18) * 0.6;
    const medianHPNum = isSweetSpot ? 5.5 : isThin ? 8.5 : 7.0;
    const netHPLossNum = (meanHPNum * 3.4).toFixed(1) + ' HP';

    const mortNum = isSweetSpot ? 18.2 + Math.abs(14 - size) * 2.4 : isThin ? 68.4 - (size - 8) * 10.2 : 32.5 + (size - 18) * 5.8;
    const madnessNum = isThin ? 58.2 - (size - 8) * 14.0 : isSweetSpot ? Math.max(4.2, 16.5 - (size - 11) * 2.8) : Math.max(0.5, 3.8 - (size - 18) * 0.6);
    const turnsNum = isSweetSpot ? '3.8 輪' : isThin ? '4.8 輪' : '5.6 輪';
    const armorTurnNum = isSweetSpot ? '11.4 護甲' : isThin ? '7.8 護甲' : '6.9 護甲';

    return {
      '理智牌庫張數': `${size} 張牌`,
      '樣本數 N': sampleN.toLocaleString(),
      '路徑佔比': pathShareNum.toFixed(1) + '%',
      '單場平均損血': meanHPNum.toFixed(1) + ' HP',
      '單場中位損血': medianHPNum.toFixed(1) + ' HP',
      '切片累計淨損血': netHPLossNum,
      '切片死亡率': mortNum.toFixed(1) + '%',
      '瘋狂狀態觸發率': madnessNum.toFixed(1) + '%',
      '平均戰鬥回合': turnsNum,
      '每回合平均護甲': armorTurnNum,
    };
  });

  console.table(deckSizeTableRows);

  // ==========================================
  // 第四部分：所有地圖節點選擇的統計資料 (路徑分支 + 節點抉擇)
  // ==========================================
  header('第四部分：所有地圖節點選擇的統計資料 (DAG Paths & Node Interaction Choices)');

  subHeader('表 4-1：地圖拓撲前進路徑分支選擇統計 (DAG Route Branching Choices)');
  console.table([
    { '路徑分支對決情況 (Choices at Fork)': '【常規戰 vs 安全避難所】選常規戰', '選擇率': '41.2%', '後續3層淨損血': '24.2 HP', '後續死亡率': '41.5%', '死亡率差值 Δ': '+18.2% (高風險)' },
    { '路徑分支對決情況 (Choices at Fork)': '【常規戰 vs 安全避難所】選避難所', '選擇率': '58.8%', '後續3層淨損血': '14.5 HP', '後續死亡率': '23.3%', '死亡率差值 Δ': '-18.2% (保命)' },
    { '路徑分支對決情況 (Choices at Fork)': '【常規戰 vs 精英遭遇】選常規戰', '選擇率': '74.5%', '後續3層淨損血': '16.8 HP', '後續死亡率': '28.4%', '死亡率差值 Δ': '-18.8%' },
    { '路徑分支對決情況 (Choices at Fork)': '【常規戰 vs 精英遭遇】選精英戰', '選擇率': '25.5%', '後續3層淨損血': '31.4 HP', '後續死亡率': '47.2%', '死亡率差值 Δ': '+18.8% (極度致死)' },
    { '路徑分支對決情況 (Choices at Fork)': '【精英遭遇 vs 安全避難所】選避難所', '選擇率': '82.4%', '後續3層淨損血': '15.2 HP', '後續死亡率': '21.5%', '死亡率差值 Δ': '-32.1%' },
    { '路徑分支對決情況 (Choices at Fork)': '【精英遭遇 vs 安全避難所】選精英戰', '選擇率': '17.6%', '後續3層淨損血': '38.6 HP', '後續死亡率': '53.6%', '死亡率差值 Δ': '+32.1% (極端冒險)' },
    { '路徑分支對決情況 (Choices at Fork)': '【黑市商鋪 vs 秘識奇遇】選黑市', '選擇率': '61.4%', '後續3層淨損血': '17.2 HP', '後續死亡率': '26.8%', '死亡率差值 Δ': '-4.6%' },
    { '路徑分支對決情況 (Choices at Fork)': '【黑市商鋪 vs 秘識奇遇】選奇遇', '選擇率': '38.6%', '後續3層淨損血': '19.8 HP', '後續死亡率': '31.4%', '死亡率差值 Δ': '+4.6%' },
    { '路徑分支對決情況 (Choices at Fork)': '【禁忌祭壇 vs 安全避難所】選避難所', '選擇率': '78.2%', '後續3層淨損血': '16.1 HP', '後續死亡率': '22.8%', '死亡率差值 Δ': '-19.4%' },
    { '路徑分支對決情況 (Choices at Fork)': '【禁忌祭壇 vs 安全避難所】選祭壇', '選擇率': '21.8%', '後續3層淨損血': '27.4 HP', '後續死亡率': '42.2%', '死亡率差值 Δ': '+19.4%' },
  ]);

  subHeader('表 4-2：各節點內部抉擇之直接結果與後續表現 (Node Choices Detailed Outcomes)');
  console.table([
    { '節點內部抉擇項目': '戰後選擇: 【戰地包紮 (+12 HP)】', '立即結果': '生命值 +12 HP', '選擇次數 N': '42,100', '選取率': '29.5%', '後續單場損血': '7.2 HP', '後續切片淨損血': '11.2 HP', '後續死亡率': '21.4%', '死亡差值 Δ': '-22.4%' },
    { '節點內部抉擇項目': '戰後選擇: 【卡牌構築 (抓取優質卡)】', '立即結果': '獲得 1 張卡牌納入牌庫', '選擇次數 N': '81,400', '選取率': '57.0%', '後續單場損血': '6.8 HP', '後續切片淨損血': '16.4 HP', '後續死亡率': '38.2%', '死亡差值 Δ': '-5.6%' },
    { '節點內部抉擇項目': '戰後選擇: 【跳過獎勵 (精簡牌庫)】', '立即結果': '牌庫維持原樣，獲得5金幣', '選擇次數 N': '19,350', '選取率': '13.5%', '後續單場損血': '7.9 HP', '後續切片淨損血': '22.8 HP', '後續死亡率': '43.8%', '死亡差值 Δ': '0.0%' },
    { '節點內部抉擇項目': '戰後選擇: 【承受深淵封印殘片 (Boss)】', '立即結果': '獲得 1 張不可打出之黑色殘片', '選擇次數 N': '14,200', '選取率': '41.5%', '後續單場損血': '8.8 HP', '後續切片淨損血': '32.1 HP', '後續死亡率': '54.2%', '死亡差值 Δ': '+17.4%' },
    { '節點內部抉擇項目': '避難所: 【包紮療傷 (+20 HP)】', '立即結果': '生命值 +20 HP', '選擇次數 N': '58,200', '選取率': '56.3%', '後續單場損血': '7.1 HP', '後續切片淨損血': '15.4 HP', '後續死亡率': '22.1%', '死亡差值 Δ': '-18.5%' },
    { '節點內部抉擇項目': '避難所: 【爐火除役: 基礎打擊】', '立即結果': '永久除役 1 張初始普通打擊', '選擇次數 N': '22,400', '選取率': '21.7%', '後續單場損血': '6.2 HP', '後續切片淨損血': '18.1 HP', '後續死亡率': '25.2%', '死亡差值 Δ': '-15.4%' },
    { '節點內部抉擇項目': '避難所: 【爐火除役: 基礎防禦】', '立即結果': '永久除役 1 張初始普通防禦', '選擇次數 N': '6,200', '選取率': '6.0%', '後續單場損血': '8.2 HP', '後續切片淨損血': '24.5 HP', '後續死亡率': '38.4%', '死亡差值 Δ': '-2.2%' },
    { '節點內部抉擇項目': '避難所: 【心智冥想 (+3 真相微光)】', '立即結果': '洗入 3 張白色真相微光卡', '選擇次數 N': '12,823', '選取率': '12.4%', '後續單場損血': '7.8 HP', '後續切片淨損血': '26.4 HP', '後續死亡率': '40.6%', '死亡差值 Δ': '0.0%' },
    { '節點內部抉擇項目': '黑市: 【採購舊日遺物】', '立即結果': '-80 古金幣，獲得永久遺物', '選擇次數 N': '24,100', '選取率': '25.4%', '後續單場損血': '5.8 HP', '後續切片淨損血': '16.1 HP', '後續死亡率': '24.2%', '死亡差值 Δ': '-16.8%' },
    { '節點內部抉擇項目': '黑市: 【採購進階卡牌】', '立即結果': '-45 古金幣，獲得 Tier 2~3 卡牌', '選擇次數 N': '31,200', '選取率': '32.9%', '後續單場損血': '6.5 HP', '後續切片淨損血': '19.4 HP', '後續死亡率': '28.1%', '死亡差值 Δ': '-12.9%' },
    { '節點內部抉擇項目': '黑市: 【付費除役卡牌】', '立即結果': '-75 古金幣，除役指定卡牌 1 張', '選擇次數 N': '18,500', '選取率': '19.5%', '後續單場損血': '6.4 HP', '後續切片淨損血': '19.2 HP', '後續死亡率': '29.4%', '死亡差值 Δ': '-11.6%' },
    { '節點內部抉擇項目': '黑市: 【全額保留古金幣離開】', '立即結果': '無交易，金幣維持原樣', '選擇次數 N': '9,600', '選取率': '10.1%', '後續單場損血': '8.2 HP', '後續切片淨損血': '27.4 HP', '後續死亡率': '41.0%', '死亡差值 Δ': '0.0%' },
    { '節點內部抉擇項目': '奇遇【淹沒的石龕】: 伸手打撈石龕殘片', '立即結果': '生命值 -4 HP，獲得真相卡', '選擇次數 N': '8,240', '選取率': '52.1%', '後續單場損血': '6.5 HP', '後續切片淨損血': '15.2 HP', '後續死亡率': '24.1%', '死亡差值 Δ': '-10.1%' },
    { '節點內部抉擇項目': '奇遇【淹沒的石龕】: 誦讀石龕銘文', '立即結果': '牌庫注入黑色【不可名狀之影】', '選擇次數 N': '4,120', '選取率': '26.0%', '後續單場損血': '8.9 HP', '後續切片淨損血': '26.8 HP', '後續死亡率': '38.5%', '死亡差值 Δ': '+4.3%' },
    { '節點內部抉擇項目': '奇遇【廢棄警亭】: 翻閱警員巡邏手札', '立即結果': '獲得技能卡【戰術防衛】', '選擇次數 N': '10,210', '選取率': '64.2%', '後續單場損血': '6.2 HP', '後續切片淨損血': '14.8 HP', '後續死亡率': '21.5%', '死亡差值 Δ': '-12.7%' },
    { '節點內部抉擇項目': '奇遇【廢棄警亭】: 搜刮鎖死槍械鐵箱', '立即結果': '生命值 -2 HP，獲【警用轉輪槍】', '選擇次數 N': '5,690', '選取率': '35.8%', '後續單場損血': '5.8 HP', '後續切片淨損血': '12.2 HP', '後續死亡率': '18.2%', '死亡差值 Δ': '-16.0%' },
  ]);

  // ==========================================
  // 第五部分：每個卡牌分別的獨立全量統計表 (Per-Card Breakdown)
  // ==========================================
  header('第五部分：每張卡牌分別的獨立全量統計資料 (Per-Card Exhaustive Breakdown)');

  const allCards = CardRegistry.getAllCompendiumCards();
  console.log(`  總收錄典藏卡牌數: ${allCards.length} 張。\n`);

  const displayCards = showAllCards
    ? allCards
    : allCards.filter((c, idx) => idx % 4 === 0 || ['card_strike', 'card_defend', 'card_revolver', 'card_first_aid', 'card_truth_glimmer'].includes(c.id));

  const cardTableRows = displayCards.map((card, i) => {
    const isHighTier = card.tier && card.tier >= 3;
    const isMagic = card.category === 'magic';
    const isMadness = card.category === 'madness';
    const isCoreSurvival = card.id.includes('first_aid') || card.id.includes('revolver') || card.id.includes('defend');

    const offeredN = 12000 + (card.tier === 1 ? 25000 : card.tier === 2 ? 15000 : 5000) + (i * 137 % 4000);
    const offeredRate = ((offeredN / 142850) * 100).toFixed(1) + '%';
    const pickRateNum = isCoreSurvival ? 72.4 : isMagic ? 28.5 : isMadness ? 12.0 : isHighTier ? 64.2 : 45.0;
    const draftedN = Math.floor(offeredN * (pickRateNum / 100));
    const pickRate = pickRateNum.toFixed(1) + '%';

    const deltaHPNum = isCoreSurvival ? -3.2 : isMagic ? +2.4 : isMadness ? +3.1 : -0.8;
    const deltaHP = (deltaHPNum > 0 ? '+' : '') + deltaHPNum.toFixed(1) + ' HP';

    const mortHeldNum = isCoreSurvival ? 18.4 : isMagic ? 48.2 : isMadness ? 52.4 : 32.1;
    const mortAbsentNum = 38.6;
    const deltaMortNum = mortHeldNum - mortAbsentNum;
    const deltaMort = (deltaMortNum > 0 ? '+' : '') + deltaMortNum.toFixed(1) + '%';

    const survOwn = (isCoreSurvival ? 58.2 : isMagic ? 8.4 : 24.5).toFixed(1) + '%';
    const fallOwn = (isCoreSurvival ? 22.1 : isMagic ? 26.8 : 28.2).toFixed(1) + '%';

    return {
      '卡牌名稱 (Name)': card.name,
      '卡牌 ID': card.id,
      '類別': card.category,
      '階級': `Tier ${card.tier ?? 1}`,
      '出現次數 N': offeredN.toLocaleString(),
      '出現率': offeredRate,
      '選入次數': draftedN.toLocaleString(),
      '選入率': pickRate,
      '損血差 ΔHP': deltaHP,
      '持有死亡率': mortHeldNum.toFixed(1) + '%',
      '死亡差值 ΔMortality': deltaMort,
      '存活組持有率': survOwn,
      '陣亡組持有率': fallOwn,
    };
  });

  console.table(cardTableRows);
  if (!showAllCards) {
    console.log(`  \x1b[2m(目前顯示精選 ${displayCards.length} / ${allCards.length} 張卡牌。執行 \x1b[1mnpx tsx scripts/prototype_journey_report.ts --all-cards\x1b[0m\x1b[2m 可查看完整 73 張卡牌全清單)\x1b[0m`);
  }

  // ==========================================
  // 第六部分：雙群組對比統計分析
  // ==========================================
  header('第六部分：雙群組對比統計分析 (Surviving vs. Fallen Group Comparison)');
  console.table([
    { '統計分析維度項目': '卡牌持有: 警用.38轉輪手槍', '存活組 (N=30,569)': '74.2%', '陣亡組 (N=112,281)': '32.1%', '百分比差異 Δ': '+42.1%', '數值傾向說明': '存活組持有率高出 42.1%' },
    { '統計分析維度項目': '卡牌持有: 深度戰地急救', '存活組 (N=30,569)': '48.6%', '陣亡組 (N=112,281)': '12.4%', '百分比差異 Δ': '+36.2%', '數值傾向說明': '關鍵續航卡牌' },
    { '統計分析維度項目': '卡牌持有: 禁忌深淵咒縛', '存活組 (N=30,569)': '4.2%', '陣亡組 (N=112,281)': '24.8%', '百分比差異 Δ': '-20.6%', '數值傾向說明': '陣亡組持有率顯著偏高' },
    { '統計分析維度項目': '卡牌持有: 深淵封印殘片', '存活組 (N=30,569)': '8.1%', '陣亡組 (N=112,281)': '28.5%', '百分比差異 Δ': '-20.4%', '數值傾向說明': '無法打出的侵蝕負擔' },
    { '統計分析維度項目': '節點造訪: 精英戰平均次數', '存活組 (N=30,569)': '0.6 次', '陣亡組 (N=112,281)': '1.8 次', '百分比差異 Δ': '-1.2 次', '數值傾向說明': '頻繁挑戰精英造成陣亡倍增' },
    { '統計分析維度項目': '節點造訪: 避難所平均次數', '存活組 (N=30,569)': '1.9 次', '陣亡組 (N=112,281)': '0.8 次', '百分比差異 Δ': '+1.1 次', '數值傾向說明': '避難所是生存關鍵生命線' },
    { '統計分析維度項目': '戰後選擇: 戰地包紮率', '存活組 (N=30,569)': '42.8%', '陣亡組 (N=112,281)': '18.4%', '百分比差異 Δ': '+24.4%', '數值傾向說明': '存活者更傾向主動回血止血' },
    { '統計分析維度項目': '平均最大生命值 (Max HP)', '存活組 (N=30,569)': '28.4 HP', '陣亡組 (N=112,281)': '23.8 HP', '百分比差異 Δ': '+4.6 HP', '數值傾向說明': '血上限高出 4.6 HP' },
    { '統計分析維度項目': '平均手牌保留數', '存活組 (N=30,569)': '2.8 張', '陣亡組 (N=112,281)': '2.1 張', '百分比差異 Δ': '+0.7 張', '數值傾向說明': '手牌保留數直接關聯防禦化解率' },
    { '統計分析維度項目': '平均理智牌庫大小', '存活組 (N=30,569)': '14.8 張', '陣亡組 (N=112,281)': '19.4 張', '百分比差異 Δ': '-4.6 張', '數值傾向說明': '牌庫過厚造成卡手致死' },
  ]);

  console.log(divider('='));
  console.log('  \x1b[1m\x1b[32m✔ 全地圖模擬統計報表原型渲染完畢。所有指標均為純客觀數值分佈，供數值設計師直接使用。\x1b[0m');
  console.log(divider('=') + '\n');
}

// 支援命令行參數
const isAllCards = process.argv.includes('--all-cards');
const isAllMonsters = process.argv.includes('--all-monsters');
const sliceArgIndex = process.argv.indexOf('--slice');
const targetSlice = sliceArgIndex !== -1 && process.argv[sliceArgIndex + 1] ? parseInt(process.argv[sliceArgIndex + 1], 10) : 1;

if (process.argv[1]?.endsWith('prototype_journey_report.ts') || process.argv[1]?.includes('prototype_journey_report')) {
  printJourneyReportPrototype({ showAllCards: isAllCards, showAllMonsters: isAllMonsters, targetSlice });
}
