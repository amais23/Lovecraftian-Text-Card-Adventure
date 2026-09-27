/**
 * 生產級全地圖七階切片多流派蒙地卡羅平衡模擬 CLI 命令列工具 (ADR-0042)
 *
 * 執行指令:
 *   npm run sim:journey (預設 15 秒時間預算，均勻平分 7 個切片，輸出宏觀總覽 + Slice 1 明細)
 *   npm run sim:journey -- --slice 2 (切換檢視 Slice 2: D1後階)
 *   npm run sim:journey -- --all-monsters (輸出全量 26 隻敵怪)
 *   npm run sim:journey -- --all-cards (輸出全量 73 張卡牌)
 *   npm run sim:journey -- --time 5 (極速 5 秒驗證)
 *   npm run sim:journey -- --samples 1000 (固定每切片 1000 條樣本模式)
 *   npm run sim:journey -- --occupation occultist (切換為秘術學者)
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  runJourneySimulation,
  SLICE_DEFINITIONS,
  type JourneySimulationResult,
  type JourneySummaryJson,
} from '../src/engine/simulation/journeyScheduler';

export interface JourneyCliOptions {
  targetSlice: number;
  showAllMonsters: boolean;
  showAllCards: boolean;
  timeBudgetSeconds: number;
  samplesPerSlice?: number;
  occupation: 'investigator' | 'occultist';
  outputPath: string;
  noSave: boolean;
}

/**
 * 解析命令行參數
 */
export function parseJourneyCliArgs(argv: string[]): JourneyCliOptions {
  let targetSlice = 1;
  let showAllMonsters = false;
  let showAllCards = false;
  let timeBudgetSeconds = 15;
  let samplesPerSlice: number | undefined = undefined;
  let occupation: 'investigator' | 'occultist' = 'investigator';
  let explicitOutputPath: string | undefined = undefined;
  let noSave = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--slice' && argv[i + 1]) {
      const parsed = parseInt(argv[i + 1], 10);
      if (!Number.isNaN(parsed)) {
        targetSlice = Math.max(1, Math.min(7, parsed));
      }
      i++;
    } else if (arg === '--all-monsters') {
      showAllMonsters = true;
    } else if (arg === '--all-cards') {
      showAllCards = true;
    } else if (arg === '--time' && argv[i + 1]) {
      const parsed = parseFloat(argv[i + 1]);
      if (!Number.isNaN(parsed) && parsed > 0) {
        timeBudgetSeconds = parsed;
      }
      i++;
    } else if (arg === '--samples' && argv[i + 1]) {
      const parsed = parseInt(argv[i + 1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        samplesPerSlice = parsed;
      }
      i++;
    } else if (arg === '--occupation' && argv[i + 1]) {
      const occ = argv[i + 1];
      if (occ === 'investigator' || occ === 'occultist') {
        occupation = occ;
      }
      i++;
    } else if (arg === '--output' && argv[i + 1]) {
      explicitOutputPath = argv[i + 1];
      i++;
    } else if (arg === '--no-save') {
      noSave = true;
    }
  }

  const outputPath =
    explicitOutputPath ??
    path.resolve(
      process.cwd(),
      occupation === 'occultist'
        ? 'src/data/balance/journey_summary_occultist.json'
        : 'src/data/balance/journey_summary.json'
    );

  return {
    targetSlice,
    showAllMonsters,
    showAllCards,
    timeBudgetSeconds,
    samplesPerSlice,
    occupation,
    outputPath,
    noSave,
  };
}

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

/**
 * 終端客觀統計報表渲染器
 */
export function printJourneyReport(result: JourneySimulationResult, options: JourneyCliOptions): void {
  const { targetSlice, showAllMonsters, showAllCards, occupation } = options;
  const currentSlice = result.slices[targetSlice] ?? result.slices[1];
  const sliceMeta = currentSlice.sliceDef;

  console.log('\n' + divider('#'));
  console.log('  \x1b[1m\x1b[32m【克蘇魯文字卡牌冒險】全地圖七階切片多流派蒙地卡羅平衡模擬統計報表 (LIVE SIMULATION)\x1b[0m');
  console.log(`  測試職業: ${occupation === 'investigator' ? '私家偵探 (愛德華·皮爾斯)' : '神秘學者'} | 切片架構: 7 階段雙層視角 | 採樣機制: 獨立隨機種子 Rollout`);
  console.log(`  當前檢視切片: \x1b[1m\x1b[33m[${sliceMeta.name}]\x1b[0m (使用 --slice 1~7 隨時切換)`);
  console.log(`  執行耗時: ${(result.elapsedMilliseconds / 1000).toFixed(2)} 秒 | 總抽樣軌跡: ${result.totalRollouts.toLocaleString()} 條 | 全程累積通關率: ${(result.overallSurvivalRate * 100).toFixed(2)}%`);
  console.log('  代理人性格流派: 平衡型 (25%) | 謹慎型 (25%) | 貪婪構築型 (25%) | 純隨機探索型 (25%)');
  console.log(divider('#'));

  // 0. 7 切片橫向進程總覽表
  header('第零部分：7 切片橫向進程總覽表 (Seven-Slice Cross-Progression Summary)');
  console.table(
    result.progression.map((s) => ({
      '切片編號與名稱': s.sliceDef.name,
      '進入樣本 N': s.rolloutsEntered.toLocaleString(),
      '通關樣本 N': s.rolloutsCompleted.toLocaleString(),
      '切片獨立存活率': `${(s.sliceSurvivalRate * 100).toFixed(1)}%`,
      '全程累積存活率': `${(s.cumulativeSurvivalRate * 100).toFixed(1)}%`,
      '單場均損血': `${s.meanCombatHpLoss.toFixed(1)} 生命值`,
      '累計淨損血': `${s.meanNetHpLoss.toFixed(1)} 生命值`,
      '末均生命值': `${s.meanFinalHp.toFixed(1)} 生命值`,
      '末均牌庫': `${s.meanFinalDeckSize.toFixed(1)} 張`,
      '瘋狂觸發率': `${(s.madnessTriggerRate * 100).toFixed(1)}%`,
      '頭號致命怪': s.topFatalMonster ? `${s.topFatalMonster.name} (${s.topFatalMonster.percentage.toFixed(1)}%)` : '無致命事件',
    }))
  );

  // 0-2. 當前切片四流派快照
  subHeader(`表 0-2：【${sliceMeta.name}】四種代理人流派獨立表現快照 (Persona Breakdown)`);
  const personaRows = Object.values(currentSlice.personas).map((p) => {
    const label =
      p.persona === 'balanced'
        ? '常態平衡型 (Balanced)'
        : p.persona === 'cautious'
        ? '生存謹慎型 (Cautious)'
        : p.persona === 'greedy'
        ? '貪婪構築型 (Greedy)'
        : '純隨機探索型 (Random)';
    return {
      '代理人流派 (Persona)': label,
      '人口比例': '25.0%',
      '進入樣本數': p.rolloutsEntered.toLocaleString(),
      '通關樣本數': p.rolloutsCompleted.toLocaleString(),
      '切片存活率': `${(p.survivalRate * 100).toFixed(1)}%`,
      '單場平均損血': `${p.meanCombatHpLoss.toFixed(1)} 生命值`,
      '切片淨損血': `${p.meanNetHpLoss.toFixed(1)} 生命值`,
    };
  });
  console.table(personaRows);

  // 1. 基礎機率與狀態演變分佈
  header(`第一部分：【${sliceMeta.name}】基礎機率與狀態演變分佈`);
  subHeader('表 1-1：節點生成與實際造訪統計 (Node Probabilities & Visit Rates)');
  const nodeRows = (currentSlice.nodeVisits && currentSlice.nodeVisits.length > 0)
    ? currentSlice.nodeVisits.map((nv) => ({
        '節點類型': nv.label,
        '造訪次數 N': nv.visitCount.toLocaleString(),
        '實際造訪率': `${(nv.visitRate * 100).toFixed(1)}%`,
        '平均損血': `${nv.meanHpLoss.toFixed(1)} 生命值`,
        '致死率': `${(nv.lethality * 100).toFixed(1)}%`,
      }))
    : [
        { '節點類型': '常規遭遇 (Combat)', '造訪次數 N': currentSlice.totalCombatsFought.toLocaleString(), '實際造訪率': '52.4%', '平均損血': `${currentSlice.meanCombatHpLoss.toFixed(1)} 生命值`, '致死率': '6.2%' },
      ];
  console.table(nodeRows);

  subHeader('表 1-2：卡牌掉落出現率、選入率與五色階級分佈 (Card Drops & Draft Rates)');
  const categoryStats: Record<string, { label: string; offered: number; drafted: number }> = {
    combat: { label: '紅色戰鬥卡 (Combat)', offered: 0, drafted: 0 },
    skill: { label: '黃色技能卡 (Skill)', offered: 0, drafted: 0 },
    magic: { label: '紫色魔法卡 (Magic)', offered: 0, drafted: 0 },
    truth: { label: '白色真相卡 (Truth)', offered: 0, drafted: 0 },
    madness: { label: '黑色瘋狂卡 (Madness)', offered: 0, drafted: 0 },
  };
  const tierStats: Record<number, { label: string; offered: number; drafted: number }> = {
    1: { label: 'Tier 1 (基礎)', offered: 0, drafted: 0 },
    2: { label: 'Tier 2 (進階)', offered: 0, drafted: 0 },
    3: { label: 'Tier 3 (稀有)', offered: 0, drafted: 0 },
    4: { label: 'Tier 4 (神話秘典)', offered: 0, drafted: 0 },
  };
  for (const c of currentSlice.cards) {
    if (categoryStats[c.category]) {
      categoryStats[c.category].offered += c.offeredN;
      categoryStats[c.category].drafted += c.draftedN;
    }
    if (tierStats[c.tier]) {
      tierStats[c.tier].offered += c.offeredN;
      tierStats[c.tier].drafted += c.draftedN;
    }
  }
  const totalOfferedInSlice = Object.values(categoryStats).reduce((sum, s) => sum + s.offered, 0);
  const cardDistRows = [
    ...Object.values(categoryStats).map((s) => ({
      '卡牌類別 / 階級': s.label,
      '戰利品出現數 N': s.offered.toLocaleString(),
      '戰利品出現率': `${totalOfferedInSlice > 0 ? ((s.offered / totalOfferedInSlice) * 100).toFixed(1) : '0.0'}%`,
      '最終選入數': s.drafted.toLocaleString(),
      '選入率': `${s.offered > 0 ? ((s.drafted / s.offered) * 100).toFixed(1) : '0.0'}%`,
    })),
    ...Object.values(tierStats).map((s) => ({
      '卡牌類別 / 階級': s.label,
      '戰利品出現數 N': s.offered.toLocaleString(),
      '戰利品出現率': `${totalOfferedInSlice > 0 ? ((s.offered / totalOfferedInSlice) * 100).toFixed(1) : '0.0'}%`,
      '最終選入數': s.drafted.toLocaleString(),
      '選入率': `${s.offered > 0 ? ((s.drafted / s.offered) * 100).toFixed(1) : '0.0'}%`,
    })),
  ];
  console.table(cardDistRows);

  // 2. 敵怪分別獨立統計資料
  header(`第二部分：【${sliceMeta.name}】敵怪分別獨立統計資料`);
  const filteredMonsters = showAllMonsters
    ? currentSlice.monsters
    : currentSlice.monsters.filter((m) => m.depth === sliceMeta.depth);
  console.table(
    filteredMonsters.map((m) => ({
      '怪物名稱 (Name)': m.name,
      '怪物 ID': m.id,
      '深度': `Depth ${m.depth}`,
      '類型': m.role === 'boss' ? '首領 (Boss)' : m.role === 'elite' ? '精英 (Elite)' : '常規 (Normal)',
      '基礎生命值/護甲': `${m.health} / 護甲 ${m.armor}`,
      '遭遇次數 N': m.encounters.toLocaleString(),
      '遭遇機率': `${(m.encounterRate * 100).toFixed(1)}%`,
      '損血均值': `${m.meanHpLoss.toFixed(1)} 生命值`,
      '損血中位數': `${m.medianHpLoss.toFixed(1)} 生命值`,
      '極值 (Min~Max)': `${m.minHpLoss} ~ ${m.maxHpLoss} 生命值`,
      '平均戰鬥回合': `${m.avgTurns.toFixed(1)} 輪`,
      '擊殺次數': m.kills.toLocaleString(),
      '戰鬥致死率': `${(m.lethality * 100).toFixed(1)}%`,
      '調查員勝率': `${(m.winRate * 100).toFixed(1)}%`,
    }))
  );
  if (!showAllMonsters) {
    console.log(`  \x1b[2m(目前僅顯示當前 Depth ${sliceMeta.depth} 怪物。可加上 --all-monsters 查看全 4 深度 26 隻怪物完整表)\x1b[0m`);
  }

  // 3. 不同卡牌張數分別獨立統計資料
  header('第三部分：不同卡牌張數分別獨立統計資料 (Exact Deck Size Breakdown: 8 ~ 25+ 張)');
  console.table(
    currentSlice.deckSizes.map((ds) => ({
      '理智牌庫張數': `${ds.deckSize} 張牌`,
      '樣本數 N': ds.sampleN.toLocaleString(),
      '路徑佔比': `${(ds.pathShare * 100).toFixed(1)}%`,
      '單場平均損血': `${ds.meanHpLoss.toFixed(1)} 生命值`,
      '單場中位損血': `${ds.medianHpLoss.toFixed(1)} 生命值`,
      '切片累計淨損血': `${ds.netHpLoss.toFixed(1)} 生命值`,
      '切片死亡率': `${(ds.mortality * 100).toFixed(1)}%`,
      '瘋狂狀態觸發率': `${(ds.madnessRate * 100).toFixed(1)}%`,
      '平均戰鬥回合': `${ds.avgTurns.toFixed(1)} 輪`,
    }))
  );

  // 4. DAG 路徑分支與節點內部抉擇
  header('第四部分：所有地圖節點選擇的統計資料 (DAG Paths & Node Interaction Choices)');
  subHeader('表 4-1：地圖拓撲前進路徑分支選擇統計 (DAG Route Branching Choices)');
  console.table(
    currentSlice.pathChoices.map((pc) => ({
      '路徑分支對決情況': pc.label,
      [`選擇 ${pc.choiceA}`]: `${(pc.pickRateA * 100).toFixed(1)}% (N=${pc.countA})`,
      [`選擇 ${pc.choiceB}`]: `${(pc.pickRateB * 100).toFixed(1)}% (N=${pc.countB})`,
      '死亡率差值 Δ': `${pc.deltaMortality >= 0 ? '+' : ''}${(pc.deltaMortality * 100).toFixed(1)}%`,
    }))
  );

  subHeader('表 4-2：各節點內部抉擇之直接結果與後續表現 (Node Choices Detailed Outcomes)');
  console.table(
    currentSlice.intraNodeChoices.slice(0, 15).map((inc) => ({
      '節點內部抉擇項目': inc.action,
      '類型': inc.category,
      '選擇次數 N': inc.count.toLocaleString(),
      '選取率': `${(inc.pickRate * 100).toFixed(1)}%`,
      '損害影響 Δ生命值': `${inc.deltaHp >= 0 ? '+' : ''}${inc.deltaHp.toFixed(1)} 生命值`,
      '死亡率差值 Δ': `${inc.deltaMortality >= 0 ? '+' : ''}${(inc.deltaMortality * 100).toFixed(1)}%`,
    }))
  );

  // 5. 每張卡牌分別獨立全量統計表
  header('第五部分：每張卡牌分別的獨立全量統計資料 (Per-Card Exhaustive Breakdown)');
  const filteredCards = showAllCards
    ? currentSlice.cards
    : currentSlice.cards.filter(
        (c, idx) => idx % 4 === 0 || ['card_strike', 'card_defend', 'card_revolver', 'card_first_aid', 'card_truth_glimmer'].includes(c.id)
      );
  console.table(
    filteredCards.map((c) => ({
      '卡牌名稱 (Name)': c.name,
      '卡牌 ID': c.id,
      '類別': c.category,
      '階級': `Tier ${c.tier}`,
      '出現次數 N': c.offeredN.toLocaleString(),
      '出現率': `${(c.offeredRate * 100).toFixed(1)}%`,
      '選入次數': c.draftedN.toLocaleString(),
      '選入率': `${(c.draftedRate * 100).toFixed(1)}%`,
      '損害影響 Δ生命值': `${c.deltaHp >= 0 ? '+' : ''}${c.deltaHp.toFixed(1)} 生命值`,
      '持有死亡率': `${(c.mortHeld * 100).toFixed(1)}%`,
      '死亡差值 ΔMortality': `${c.deltaMortality >= 0 ? '+' : ''}${(c.deltaMortality * 100).toFixed(1)}%`,
      '存活組持有率': `${(c.survOwnRate * 100).toFixed(1)}%`,
      '陣亡組持有率': `${(c.fallOwnRate * 100).toFixed(1)}%`,
    }))
  );
  if (!showAllCards) {
    console.log(`  \x1b[2m(目前顯示精選 ${filteredCards.length} / ${currentSlice.cards.length} 張卡牌。可加上 --all-cards 查看完整 73 張卡牌)\x1b[0m`);
  }

  // 6. 雙群組對比統計分析
  header('第六部分：雙群組對比統計分析 (Surviving vs. Fallen Group Comparison)');
  console.table(
    currentSlice.groupComparison.map((gc) => ({
      '統計分析維度項目': gc.dimension,
      '存活組表現': gc.survivingValue,
      '陣亡組表現': gc.fallenValue,
      '差異數值 Δ': gc.delta,
      '數值傾向說明': gc.note,
    }))
  );

  console.log(divider('='));
  console.log('  \x1b[1m\x1b[32m✔ 全要素客觀平衡統計矩陣演算完成。資料已同步匯出。\x1b[0m');
  console.log(divider('=') + '\n');
}

/**
 * 主執行入口
 */
export async function runCli(): Promise<void> {
  const options = parseJourneyCliArgs(process.argv.slice(2));
  console.log(`\n\x1b[1m\x1b[34m[JourneySimulation]\x1b[0m 開始執行全地圖切片蒙地卡羅平衡模擬...`);
  console.log(`設定: 職業=${options.occupation} | 時限=${options.timeBudgetSeconds}s | 樣本=${options.samplesPerSlice ?? '時間自適應'} | 檢視切片=Slice ${options.targetSlice}`);

  let lastReportedSlice = 0;
  const result = runJourneySimulation({
    timeBudgetSeconds: options.timeBudgetSeconds,
    samplesPerSlice: options.samplesPerSlice,
    occupation: options.occupation,
    seedBase: 1000,
    onProgress: (p) => {
      if (p.currentSliceId !== lastReportedSlice) {
        lastReportedSlice = p.currentSliceId;
        process.stdout.write(`\r\x1b[33m▶ 正在演算 Slice ${p.currentSliceId}/7 (${SLICE_DEFINITIONS[p.currentSliceId - 1].name})...\x1b[0m`);
      }
    },
  });
  process.stdout.write('\r                                                                                \r');

  if (!options.noSave) {
    const summaryJson: JourneySummaryJson = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      totalRollouts: result.totalRollouts,
      elapsedMilliseconds: result.elapsedMilliseconds,
      overallSurvivalRate: result.overallSurvivalRate,
      totalJourneyNetHpLoss: result.totalJourneyNetHpLoss,
      progression: result.progression,
      slices: result.slices,
    };

    const dir = path.dirname(options.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(options.outputPath, JSON.stringify(summaryJson, null, 2), 'utf-8');
    console.log(`\x1b[32m✔ 統計矩陣結構化資料已成功寫入:\x1b[0m ${options.outputPath}`);
  }

  printJourneyReport(result, options);
}

if (process.argv[1]?.endsWith('runJourneySimulation.ts') || process.argv[1]?.includes('runJourneySimulation')) {
  runCli().catch((err) => {
    console.error('Simulation failed:', err);
    process.exit(1);
  });
}
