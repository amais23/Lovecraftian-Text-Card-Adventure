import type { Card, Enemy, Relic } from '../../types/game';
import { CardRegistry } from '../cards/registry';
import { PRESET_RELICS } from '../relics';
import { cloneEnemy } from '../enemyCatalog';
import { MONSTERS_BY_DEPTH } from '../../data/monsterReviewData';
import { buildDeckWithCopies, buildRelicSet, getStarterBaseline } from './deckBuilder';
import { simulateCombat } from './combatSimulator';
import { ARCHETYPE_DEFINITIONS, buildArchetypeDeck } from './archetypes';
import {
  createCardBalanceReport,
  createEnemyThreatReport,
  createRelicBalanceReport,
} from './balanceAnalyzer';
import type {
  ArchetypeId,
  BalanceSummaryData,
  CardBalanceReport,
  EnemyThreatReport,
  RawCombatLogEntry,
  RelicBalanceReport,
} from './balanceTypes';

export interface BalanceSamplerOptions {
  runsPerMatchup?: number;
  sampleEnemiesCount?: number;
  onProgress?: (progress: { stage: string; current: number; total: number; percent: number }) => void;
  randomFn?: () => number;
}

/**
 * 取得具代表性的 26 隻敵怪清單（跨 Depth 1~4，涵蓋普通、精英與首領）
 */
export function getRepresentativeEnemies(): Array<{ enemy: Enemy; depth: 1 | 2 | 3 | 4; role: 'normal' | 'elite' | 'boss' }> {
  const result: Array<{ enemy: Enemy; depth: 1 | 2 | 3 | 4; role: 'normal' | 'elite' | 'boss' }> = [];
  const seenIds = new Set<string>();

  const depthQuotas: Record<1 | 2 | 3 | 4, number> = {
    1: 7,
    2: 7,
    3: 6,
    4: 6,
  };

  for (const d of [1, 2, 3, 4] as const) {
    const list = MONSTERS_BY_DEPTH[d] || [];
    let count = 0;
    const quota = depthQuotas[d];
    for (const m of list) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        count++;
        const enemyObj = cloneEnemy({
          id: m.id,
          name: m.name,
          title: m.title,
          health: m.health,
          maxHealth: m.health,
          armor: m.armor,
          currentIntent: {
            name: m.intents[0]?.name ?? '爪擊',
            type: m.intents[0]?.type ?? 'attack',
            value: m.intents[0]?.value ?? 6,
            description: m.intents[0]?.description ?? '',
          },
          intentSequence: m.intents.map((i) => ({
            name: i.name,
            type: i.type,
            value: i.value,
            description: i.description,
          })),
        });
        result.push({ enemy: enemyObj, depth: d, role: m.role });
      }
      if (count >= quota) break;
    }
  }

  return result.slice(0, 26);
}

/**
 * 執行分層正交蒙地卡羅全量平衡評測採樣
 */
export function runStratifiedBalanceSampling(options: BalanceSamplerOptions = {}): {
  summary: BalanceSummaryData;
  rawLogs: RawCombatLogEntry[];
} {
  const {
    runsPerMatchup = 8,
    onProgress,
    randomFn = Math.random,
  } = options;

  const cards = CardRegistry.getAllCompendiumCards();
  const relics = PRESET_RELICS;
  const representativeEnemies = getRepresentativeEnemies();

  const rawLogs: RawCombatLogEntry[] = [];
  let totalCombats = 0;

  // 1. 準備敵怪數據累加器
  const enemyStats = new Map<
    string,
    {
      enemy: Enemy;
      depth: 1 | 2 | 3 | 4;
      role: 'normal' | 'elite' | 'boss';
      totalRuns: number;
      investigatorWins: number;
      totalHpLost: number;
      totalSanityEroded: number;
      totalTurns: number;
      cardWinRates: Map<string, { cardName: string; wins: number; runs: number }>;
      archetypeWins: Map<ArchetypeId, { wins: number; runs: number }>;
    }
  >();

  for (const item of representativeEnemies) {
    enemyStats.set(item.enemy.id, {
      enemy: item.enemy,
      depth: item.depth,
      role: item.role,
      totalRuns: 0,
      investigatorWins: 0,
      totalHpLost: 0,
      totalSanityEroded: 0,
      totalTurns: 0,
      cardWinRates: new Map(),
      archetypeWins: new Map(),
    });
  }

  // 輔助函式：批次模擬指定牌組面對特定敵怪
  function testMatchup(
    deck: Card[],
    enemy: Enemy,
    runs: number,
    relicList: Relic[] = []
  ) {
    let optWins = 0;
    let optHpLost = 0;
    let optSanity = 0;
    let optTurns = 0;

    let ftWins = 0;
    let ftHpLost = 0;

    for (let r = 0; r < runs; r++) {
      totalCombats += 2; // 雙軌：1 次 optimal + 1 次 fault_tolerant

      const resOpt = simulateCombat({
        deck,
        relics: relicList,
        enemy: cloneEnemy(enemy),
        policyMode: 'optimal',
        randomFn,
      });
      if (resOpt.victory) optWins++;
      optHpLost += resOpt.healthLost;
      optSanity += resOpt.sanityCardsExpended;
      optTurns += resOpt.turns;

      const resFt = simulateCombat({
        deck,
        relics: relicList,
        enemy: cloneEnemy(enemy),
        policyMode: 'fault_tolerant',
        randomFn,
      });
      if (resFt.victory) ftWins++;
      ftHpLost += resFt.healthLost;
    }

    const winRate = optWins / runs;
    const avgHpLost = optHpLost / runs;
    const avgSanity = optSanity / runs;
    const avgTurns = optTurns / runs;

    const ftWinRate = ftWins / runs;
    const ftAvgHpLost = ftHpLost / runs;
    let faultToleranceRatio = 1.0;
    if (winRate > 0) {
      const ratio = ftWinRate / winRate;
      const penalty = Math.max(0, ftAvgHpLost - avgHpLost) * 0.02;
      faultToleranceRatio = Math.max(0, Math.min(1.0, ratio - penalty));
    } else {
      faultToleranceRatio = 0.0;
    }

    return { winRate, avgHpLost, avgSanity, avgTurns, faultToleranceRatio };
  }

  // ==========================================
  // 階段一：73 張卡牌評測 (1x, 2x, 3x 及六大流派)
  // ==========================================
  const cardReports: Record<string, CardBalanceReport> = {};
  const baseStarter = getStarterBaseline('investigator');
  const archetypesList: ArchetypeId[] = [
    'armor_counter',
    'bleed_pierce',
    'truth_restore',
    'madness_sacrifice',
    'high_cost_magic',
    'status_attrition',
  ];

  for (let cIdx = 0; cIdx < cards.length; cIdx++) {
    const card = cards[cIdx];
    if (onProgress) {
      onProgress({
        stage: `評測卡牌 (${card.name})`,
        current: cIdx + 1,
        total: cards.length,
        percent: Math.round(((cIdx + 1) / cards.length) * 70),
      });
    }

    const deck1x = buildDeckWithCopies(baseStarter, card, 1, 'add');
    const deck2x = buildDeckWithCopies(baseStarter, card, 2, 'add');
    const deck3x = buildDeckWithCopies(baseStarter, card, 3, 'add');

    // 對抗 26 隻敵怪統計
    let total1xWins = 0;
    let total1xHpLost = 0;
    let total1xSanity = 0;
    let total1xTurns = 0;
    let totalFtRatio = 0;

    let total2xWins = 0;
    let total2xHpLost = 0;
    let total2xSanity = 0;
    let total2xTurns = 0;

    let total3xWins = 0;
    let total3xHpLost = 0;
    let total3xSanity = 0;
    let total3xTurns = 0;

    const enemyMatchups: Array<{ id: string; name: string; winRate: number }> = [];

    for (const item of representativeEnemies) {
      // 1x 測試
      const m1 = testMatchup(deck1x, item.enemy, runsPerMatchup);
      total1xWins += m1.winRate;
      total1xHpLost += m1.avgHpLost;
      total1xSanity += m1.avgSanity;
      total1xTurns += m1.avgTurns;
      totalFtRatio += m1.faultToleranceRatio;

      enemyMatchups.push({ id: item.enemy.id, name: item.enemy.name, winRate: m1.winRate });

      // 累加至敵怪統計
      const eStat = enemyStats.get(item.enemy.id)!;
      eStat.totalRuns += runsPerMatchup;
      eStat.investigatorWins += m1.winRate * runsPerMatchup;
      eStat.totalHpLost += m1.avgHpLost * runsPerMatchup;
      eStat.totalSanityEroded += m1.avgSanity * runsPerMatchup;
      eStat.totalTurns += m1.avgTurns * runsPerMatchup;

      const cMap = eStat.cardWinRates.get(card.id) ?? { cardName: card.name, wins: 0, runs: 0 };
      cMap.wins += m1.winRate * runsPerMatchup;
      cMap.runs += runsPerMatchup;
      eStat.cardWinRates.set(card.id, cMap);

      // 2x 測試
      const m2 = testMatchup(deck2x, item.enemy, Math.max(2, Math.floor(runsPerMatchup / 2)));
      total2xWins += m2.winRate;
      total2xHpLost += m2.avgHpLost;
      total2xSanity += m2.avgSanity;
      total2xTurns += m2.avgTurns;

      // 3x 測試
      const m3 = testMatchup(deck3x, item.enemy, Math.max(2, Math.floor(runsPerMatchup / 2)));
      total3xWins += m3.winRate;
      total3xHpLost += m3.avgHpLost;
      total3xSanity += m3.avgSanity;
      total3xTurns += m3.avgTurns;
    }

    const enemyCount = representativeEnemies.length;
    const base1x = {
      winRate: total1xWins / enemyCount,
      avgHealthLost: total1xHpLost / enemyCount,
      avgSanityExpended: total1xSanity / enemyCount,
      avgTurns: total1xTurns / enemyCount,
    };
    const base2x = {
      winRate: total2xWins / enemyCount,
      avgHealthLost: total2xHpLost / enemyCount,
      avgSanityExpended: total2xSanity / enemyCount,
      avgTurns: total2xTurns / enemyCount,
    };
    const base3x = {
      winRate: total3xWins / enemyCount,
      avgHealthLost: total3xHpLost / enemyCount,
      avgSanityExpended: total3xSanity / enemyCount,
      avgTurns: total3xTurns / enemyCount,
    };
    const faultToleranceRatio = totalFtRatio / enemyCount;

    // 測試六大流派協同倍率（挑選各深度代表怪進行快速協同檢測）
    const archetypeWinRates = {} as Record<ArchetypeId, number>;
    const sampleArchetypeEnemies = [representativeEnemies[0], representativeEnemies[Math.floor(enemyCount / 2)]];

    for (const archId of archetypesList) {
      const archDeck = buildDeckWithCopies(buildArchetypeDeck(archId), card, 1, 'add');
      let archWins = 0;
      for (const item of sampleArchetypeEnemies) {
        const m = testMatchup(archDeck, item.enemy, 3);
        archWins += m.winRate;

        // 累計敵怪流派表現
        const eStat = enemyStats.get(item.enemy.id)!;
        const aWin = eStat.archetypeWins.get(archId) ?? { wins: 0, runs: 0 };
        aWin.wins += m.winRate * 3;
        aWin.runs += 3;
        eStat.archetypeWins.set(archId, aWin);
      }
      archetypeWinRates[archId] = archWins / sampleArchetypeEnemies.length;
    }

    cardReports[card.id] = createCardBalanceReport({
      card,
      base1xMetrics: base1x,
      base2xMetrics: base2x,
      base3xMetrics: base3x,
      faultToleranceRatio,
      archetypeWinRates,
      enemyMatchups,
    });

    rawLogs.push({
      targetId: card.id,
      targetType: 'card',
      copies: 1,
      context: 'baseline',
      enemyId: 'all_avg',
      runs: runsPerMatchup * enemyCount,
      wins: Math.round(base1x.winRate * runsPerMatchup * enemyCount),
      avgHpLost: base1x.avgHealthLost,
      avgSanityExpended: base1x.avgSanityExpended,
      avgTurns: base1x.avgTurns,
      faultToleranceRatio,
    });
  }

  // ==========================================
  // 階段二：6 種舊日遺物評測 (0, 1, 2, 3 件)
  // ==========================================
  const relicReports: Record<string, RelicBalanceReport> = {};
  for (let rIdx = 0; rIdx < relics.length; rIdx++) {
    const relic = relics[rIdx];
    if (onProgress) {
      onProgress({
        stage: `評測舊日遺物 (${relic.name})`,
        current: rIdx + 1,
        total: relics.length,
        percent: 70 + Math.round(((rIdx + 1) / relics.length) * 15),
      });
    }

    const testCopies = [0, 1, 2, 3] as const;
    const copiesMetrics = {} as Record<0 | 1 | 2 | 3, { winRate: number; avgHealthLost: number; avgSanityExpended: number }>;

    for (const c of testCopies) {
      const relicSet = buildRelicSet([], relic, c);
      let winsSum = 0;
      let hpLostSum = 0;
      let sanitySum = 0;

      // 抽樣對抗部分敵怪
      for (const item of representativeEnemies.slice(0, 10)) {
        const m = testMatchup(baseStarter, item.enemy, 3, relicSet);
        winsSum += m.winRate;
        hpLostSum += m.avgHpLost;
        sanitySum += m.avgSanity;
      }

      const sampleSize = Math.min(10, representativeEnemies.length);
      copiesMetrics[c] = {
        winRate: winsSum / sampleSize,
        avgHealthLost: hpLostSum / sampleSize,
        avgSanityExpended: sanitySum / sampleSize,
      };

      rawLogs.push({
        targetId: relic.id,
        targetType: 'relic',
        copies: c,
        context: 'baseline',
        enemyId: 'sample_avg',
        runs: 3 * sampleSize,
        wins: Math.round((winsSum / sampleSize) * 3 * sampleSize),
        avgHpLost: hpLostSum / sampleSize,
        avgSanityExpended: sanitySum / sampleSize,
        avgTurns: 5,
        faultToleranceRatio: 1.0,
      });
    }

    relicReports[relic.id] = createRelicBalanceReport({ relic, copiesMetrics });
  }

  // ==========================================
  // 階段三：敵怪危險度排行榜整理
  // ==========================================
  const enemyReports: Record<string, EnemyThreatReport> = {};
  const unrankedEnemyReports: EnemyThreatReport[] = [];

  for (const item of representativeEnemies) {
    const stat = enemyStats.get(item.enemy.id)!;
    const runs = Math.max(1, stat.totalRuns);
    const winRate = stat.investigatorWins / runs;
    const avgHpLost = stat.totalHpLost / runs;
    const avgSanity = stat.totalSanityEroded / runs;
    const avgTurns = stat.totalTurns / runs;

    // 計算剋制卡牌 Top 3
    const cardPerformances: Array<{ id: string; name: string; winRate: number }> = [];
    for (const [cardId, val] of stat.cardWinRates.entries()) {
      if (val.runs > 0) {
        cardPerformances.push({ id: cardId, name: val.cardName, winRate: val.wins / val.runs });
      }
    }
    cardPerformances.sort((a, b) => b.winRate - a.winRate);

    // 計算流派表現
    const archPerformances = {} as Record<ArchetypeId, number>;
    for (const arch of archetypesList) {
      const aw = stat.archetypeWins.get(arch);
      archPerformances[arch] = aw && aw.runs > 0 ? aw.wins / aw.runs : winRate;
    }

    const report = createEnemyThreatReport({
      enemy: item.enemy,
      depth: item.depth,
      role: item.role,
      investigatorWinRate: winRate,
      avgInvestigatorHealthLost: avgHpLost,
      avgSanityEroded: avgSanity,
      avgCombatDurationTurns: avgTurns,
      counteredByCards: cardPerformances,
      archetypePerformances: archPerformances,
    });

    unrankedEnemyReports.push(report);
  }

  // 依 threatScore 由高到低排序並標註名次
  unrankedEnemyReports.sort((a, b) => b.threatScore - a.threatScore);
  unrankedEnemyReports.forEach((rep, idx) => {
    rep.rank = idx + 1;
    enemyReports[rep.id] = rep;
  });

  const summary: BalanceSummaryData = {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    totalCombatsSimulated: totalCombats,
    cards: cardReports,
    relics: relicReports,
    enemies: enemyReports,
    archetypeDefinitions: ARCHETYPE_DEFINITIONS,
  };

  return { summary, rawLogs };
}
