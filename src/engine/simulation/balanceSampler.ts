import type { Card, Enemy, Relic } from '../../types/game';
import { CardRegistry } from '../cards/registry';
import { PRESET_RELICS } from '../relics';
import { cloneEnemy } from '../enemyCatalog';
import { MONSTERS_BY_DEPTH } from '../../data/monsterReviewData';
import { buildRandomizedDeck, buildRelicSet } from './deckBuilder';
import { simulateCombat } from './combatSimulator';
import { ARCHETYPE_DEFINITIONS, buildRandomizedArchetypeDeck } from './archetypes';
import {
  calculateHealthScore,
  calculateSanityScore,
  calculateOverallScore,
  createCardBalanceReport,
  createEnemyThreatReport,
  createRelicBalanceReport,
} from './balanceAnalyzer';
import {
  computeAllPairSoftCosineDistances,
  classicalMDS,
  detectEmergentArchetypes,
  generateArchetypeFamilyDecks,
} from './deckTopology';


import { computeCardMechanicsEmbeddings } from './cardEmbedding';
import type {
  ArchetypeId,
  BalanceSummaryData,
  CardBalanceReport,
  DeckTopologyNode,
  EnemyThreatReport,
  RawCombatLogEntry,
  RelicBalanceReport,
} from './balanceTypes';

export interface BalanceSamplerOptions {
  runsPerMatchup?: number;
  sampleEnemiesCount?: number;
  onProgress?: (progress: { stage: string; current: number; total: number; percent: number }) => void;
  randomFn?: () => number;
  uncappedHealth?: boolean;
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
    uncappedHealth = false,
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
      cardWinRates: Map<string, { cardName: string; wins: number; runs: number; totalHpLost: number }>;
      archetypeWins: Map<ArchetypeId, { wins: number; runs: number; totalHpLost: number }>;
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

  // 全域單卡與雙卡戰鬥表現統計 (ADR-0038)
  const singleCardCombatStats = new Map<string, { runs: number; totalScore: number }>();
  const pairCombatStats = new Map<string, { runs: number; totalScore: number }>();

  // 輔助函式：批次模擬指定牌庫面對特定敵怪（支援動態隨機牌庫工廠與 2~6 手牌保留數採樣）
  function testMatchup(
    deckSource: Card[] | ((runIndex: number) => { deck: Card[]; handRetention?: number; handCapacity?: number }),
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

      // 取得本次戰鬥之隨機牌庫與 2~6 變動手牌保留數 (ADR-0001, ADR-0009)
      const defaultHandRet = (2 + (r % 5)) as 2 | 3 | 4 | 5 | 6;
      let deck: Card[];
      let handRetention = defaultHandRet;

      if (typeof deckSource === 'function') {
        const generated = deckSource(r);
        deck = generated.deck;
        const genHand = generated.handRetention ?? generated.handCapacity;
        if (genHand !== undefined) {
          handRetention = Math.max(2, Math.min(6, Math.round(genHand))) as 2 | 3 | 4 | 5 | 6;
        }
      } else {
        deck = deckSource;
      }

      const resOpt = simulateCombat({
        deck,
        relics: relicList,
        enemy: cloneEnemy(enemy),
        handRetention,
        handCapacity: handRetention,
        policyMode: 'optimal',
        randomFn,
        uncappedHealth,
      });
      if (resOpt.victory) optWins++;
      optHpLost += resOpt.healthLost;
      optSanity += resOpt.sanityCardsExpended;
      optTurns += resOpt.turns;

      // ADR-0038: 統計全域單卡與雙卡共現表現
      const cHealthScore = calculateHealthScore(resOpt.victory ? 1 : 0, resOpt.healthLost, 25, uncappedHealth);
      const cSanityScore = calculateSanityScore(resOpt.victory ? 1 : 0, resOpt.sanityCardsExpended, 15, uncappedHealth);
      const cScore = calculateOverallScore(cHealthScore, cSanityScore, 1.0, uncappedHealth);

      const uniqueCardIds = Array.from(new Set(deck.map((c) => c.id)));
      for (let i = 0; i < uniqueCardIds.length; i++) {
        const id1 = uniqueCardIds[i];
        let sStat = singleCardCombatStats.get(id1);
        if (!sStat) {
          sStat = { runs: 0, totalScore: 0 };
          singleCardCombatStats.set(id1, sStat);
        }
        sStat.runs++;
        sStat.totalScore += cScore;

        for (let j = i + 1; j < uniqueCardIds.length; j++) {
          const id2 = uniqueCardIds[j];
          const pairKey = id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;
          let pStat = pairCombatStats.get(pairKey);
          if (!pStat) {
            pStat = { runs: 0, totalScore: 0 };
            pairCombatStats.set(pairKey, pStat);
          }
          pStat.runs++;
          pStat.totalScore += cScore;
        }
      }

      const resFt = simulateCombat({
        deck,
        relics: relicList,
        enemy: cloneEnemy(enemy),
        handRetention,
        handCapacity: handRetention,
        policyMode: 'fault_tolerant',
        randomFn,
        uncappedHealth,
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

    const enemyMatchups: Array<{ id: string; name: string; winRate: number; avgHealthLost?: number }> = [];

    for (const item of representativeEnemies) {
      // 1x 測試 (10~35 張隨機牌庫，含 1 張目標卡，手牌容量 2~6)
      const m1 = testMatchup(
        (r) => ({
          deck: buildRandomizedDeck({ targetCard: card, copies: 1, minSize: 10, maxSize: 35, randomFn }),
          handCapacity: (2 + (r % 5)) as 2 | 3 | 4 | 5 | 6,
        }),
        item.enemy,
        runsPerMatchup
      );
      total1xWins += m1.winRate;
      total1xHpLost += m1.avgHpLost;
      total1xSanity += m1.avgSanity;
      total1xTurns += m1.avgTurns;
      totalFtRatio += m1.faultToleranceRatio;

      enemyMatchups.push({
        id: item.enemy.id,
        name: item.enemy.name,
        winRate: m1.winRate,
        avgHealthLost: m1.avgHpLost,
      });

      // 累加至敵怪統計
      const eStat = enemyStats.get(item.enemy.id)!;
      eStat.totalRuns += runsPerMatchup;
      eStat.investigatorWins += m1.winRate * runsPerMatchup;
      eStat.totalHpLost += m1.avgHpLost * runsPerMatchup;
      eStat.totalSanityEroded += m1.avgSanity * runsPerMatchup;
      eStat.totalTurns += m1.avgTurns * runsPerMatchup;

      const cMap = eStat.cardWinRates.get(card.id) ?? { cardName: card.name, wins: 0, runs: 0, totalHpLost: 0 };
      cMap.wins += m1.winRate * runsPerMatchup;
      cMap.runs += runsPerMatchup;
      cMap.totalHpLost += m1.avgHpLost * runsPerMatchup;
      eStat.cardWinRates.set(card.id, cMap);

      // 2x 測試 (10~35 張隨機牌庫，含 2 張目標卡，手牌容量 2~6)
      const m2 = testMatchup(
        (r) => ({
          deck: buildRandomizedDeck({ targetCard: card, copies: 2, minSize: 10, maxSize: 35, randomFn }),
          handCapacity: (2 + (r % 5)) as 2 | 3 | 4 | 5 | 6,
        }),
        item.enemy,
        Math.max(2, Math.floor(runsPerMatchup / 2))
      );
      total2xWins += m2.winRate;
      total2xHpLost += m2.avgHpLost;
      total2xSanity += m2.avgSanity;
      total2xTurns += m2.avgTurns;

      // 3x 測試 (10~35 張隨機牌庫，含 3 張目標卡，手牌容量 2~6)
      const m3 = testMatchup(
        (r) => ({
          deck: buildRandomizedDeck({ targetCard: card, copies: 3, minSize: 10, maxSize: 35, randomFn }),
          handCapacity: (2 + (r % 5)) as 2 | 3 | 4 | 5 | 6,
        }),
        item.enemy,
        Math.max(2, Math.floor(runsPerMatchup / 2))
      );
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
    const archetypeHealthLosses = {} as Record<ArchetypeId, number>;
    const sampleArchetypeEnemies = [representativeEnemies[0], representativeEnemies[Math.floor(enemyCount / 2)]];

    for (const archId of archetypesList) {
      let archWins = 0;
      let archHpLost = 0;
      for (const item of sampleArchetypeEnemies) {
        const m = testMatchup(
          (r) => ({
            deck: buildRandomizedArchetypeDeck({
              archetypeId: archId,
              targetCard: card,
              copies: 1,
              minSize: 10,
              maxSize: 35,
              randomFn,
            }),
            handCapacity: (2 + (r % 5)) as 2 | 3 | 4 | 5 | 6,
          }),
          item.enemy,
          3
        );
        archWins += m.winRate;
        archHpLost += m.avgHpLost;

        // 累計敵怪流派表現
        const eStat = enemyStats.get(item.enemy.id)!;
        const aWin = eStat.archetypeWins.get(archId) ?? { wins: 0, runs: 0, totalHpLost: 0 };
        aWin.wins += m.winRate * 3;
        aWin.runs += 3;
        aWin.totalHpLost += m.avgHpLost * 3;
        eStat.archetypeWins.set(archId, aWin);
      }
      archetypeWinRates[archId] = archWins / sampleArchetypeEnemies.length;
      archetypeHealthLosses[archId] = archHpLost / sampleArchetypeEnemies.length;
    }

    cardReports[card.id] = createCardBalanceReport({
      card,
      base1xMetrics: base1x,
      base2xMetrics: base2x,
      base3xMetrics: base3x,
      faultToleranceRatio,
      archetypeWinRates,
      archetypeHealthLosses,
      enemyMatchups,
      isUncappedHealth: uncappedHealth,
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
        const m = testMatchup(
          (r) => ({
            deck: buildRandomizedDeck({ minSize: 10, maxSize: 35, randomFn }),
            handCapacity: (2 + (r % 5)) as 2 | 3 | 4 | 5 | 6,
          }),
          item.enemy,
          3,
          relicSet
        );
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

    relicReports[relic.id] = createRelicBalanceReport({
      relic,
      copiesMetrics,
      isUncappedHealth: uncappedHealth,
    });
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
    const cardPerformances: Array<{ id: string; name: string; winRate: number; avgHealthLost: number }> = [];
    for (const [cardId, val] of stat.cardWinRates.entries()) {
      if (val.runs > 0) {
        cardPerformances.push({
          id: cardId,
          name: val.cardName,
          winRate: val.wins / val.runs,
          avgHealthLost: val.totalHpLost / val.runs,
        });
      }
    }
    if (uncappedHealth) {
      cardPerformances.sort((a, b) => a.avgHealthLost - b.avgHealthLost);
    } else {
      cardPerformances.sort((a, b) => b.winRate - a.winRate);
    }

    // 計算流派表現
    const archPerformances = {} as Record<ArchetypeId, number>;
    const archHealthLosses = {} as Record<ArchetypeId, number>;
    for (const arch of archetypesList) {
      const aw = stat.archetypeWins.get(arch);
      archPerformances[arch] = aw && aw.runs > 0 ? aw.wins / aw.runs : winRate;
      archHealthLosses[arch] = aw && aw.runs > 0 ? aw.totalHpLost / aw.runs : avgHpLost;
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
      archetypeHealthLosses: archHealthLosses,
      isUncappedHealth: uncappedHealth,
    });

    unrankedEnemyReports.push(report);
  }

  // 依 threatScore 由高到低排序並標註名次
  unrankedEnemyReports.sort((a, b) => b.threatScore - a.threatScore);
  unrankedEnemyReports.forEach((rep, idx) => {
    rep.rank = idx + 1;
    enemyReports[rep.id] = rep;
  });

  // ==========================================
  // 階段四：計算 73x73 雙卡協同矩陣與圖論非監督式社群偵測 (ADR-0038)
  // ==========================================
  if (onProgress) {
    onProgress({
      stage: '計算非監督式自然流派與牌組拓撲星系圖 (ADR-0038)',
      current: 1,
      total: 1,
      percent: 92,
    });
  }

  const synergyMatrix = new Map<string, Map<string, number>>();
  for (const c1 of cards) {
    const row = new Map<string, number>();
    const s1 = singleCardCombatStats.get(c1.id);
    const avg1 = s1 && s1.runs > 0 ? s1.totalScore / s1.runs : 50;

    for (const c2 of cards) {
      if (c1.id === c2.id) {
        row.set(c2.id, 0);
        continue;
      }
      const pairKey = c1.id < c2.id ? `${c1.id}:${c2.id}` : `${c2.id}:${c1.id}`;
      const pStat = pairCombatStats.get(pairKey);
      if (pStat && pStat.runs >= 2) {
        const avgPair = pStat.totalScore / pStat.runs;
        const s2 = singleCardCombatStats.get(c2.id);
        const avg2 = s2 && s2.runs > 0 ? s2.totalScore / s2.runs : 50;
        const delta = Number((avgPair - Math.max(avg1, avg2)).toFixed(1));
        row.set(c2.id, delta);
      } else {
        row.set(c2.id, 0);
      }
    }
    synergyMatrix.set(c1.id, row);
  }

  const cardScoresMap = new Map<string, number>();
  for (const [cId, rep] of Object.entries(cardReports)) {
    cardScoresMap.set(cId, rep.overallScore);
  }

  const emergentArchetypes = detectEmergentArchetypes({
    cards,
    synergyMatrix,
    cardScores: cardScoresMap,
    maxCommunities: 4,
  });

  // ADR-0038 / Issue #68: 計算 73x73 卡牌力學 SVD 餘弦相似度矩陣
  const cardSimilarityResult = computeCardMechanicsEmbeddings(cards, { synergyMatrix });

  // ==========================================
  // 階段五：自然湧現流派家族變體牌庫生成、對弈評測與軟加權距離投影 (ADR-0038 / Issues #69, #70)
  // ==========================================
  const familyDecks = generateArchetypeFamilyDecks({
    emergentArchetypes,
    allCards: cards,
    totalTarget: 380,
    randomFn,
  });

  const numDecks = familyDecks.length;

  // 1. 批次計算 380 x 380 軟加權餘弦距離矩陣 (Soft Cosine Distance)
  const distMatrix = computeAllPairSoftCosineDistances(
    familyDecks.map((d) => d.deck),
    cardSimilarityResult.similarityMatrix,
    cardSimilarityResult.cardIndexMap
  );

  const mdsCoords = classicalMDS(distMatrix);

  // 2. 封裝 DeckTopologyNode 列表並聚合實戰戰績
  const deckTopologyNodes: DeckTopologyNode[] = [];
  const archStatsMap = new Map<string, { deckCount: number; scoreSum: number; hpSum: number; sanitySum: number }>();

  // 選取 3 隻具代表性不同深度的敵怪進行實測評估 (1 普通, 1 精英, 1 首領)
  const enemySample = [
    representativeEnemies[0]?.enemy,
    representativeEnemies[1]?.enemy,
    representativeEnemies[2]?.enemy,
  ].filter((e): e is Enemy => e !== undefined);

  for (let i = 0; i < numDecks; i++) {
    const s = familyDecks[i];
    const coords = mdsCoords[i] || [0.5, 0.5];

    // 進行實戰模擬以獲取勝率與耗損數據
    let wins = 0;
    let totalHpLost = 0;
    let totalSanity = 0;

    for (const enemy of enemySample) {
      const res = simulateCombat({
        deck: s.deck,
        relics: PRESET_RELICS,
        enemy: cloneEnemy(enemy),
        handRetention: s.handRetention,
        handCapacity: s.handRetention,
        policyMode: 'optimal',
        randomFn,
        uncappedHealth,
      });
      if (res.victory) wins++;
      totalHpLost += res.healthLost;
      totalSanity += res.sanityCardsExpended;
    }

    const runs = enemySample.length || 1;
    const winRate = Number((wins / runs).toFixed(3));
    const avgHp = Number((totalHpLost / runs).toFixed(1));
    const avgSanity = Number((totalSanity / runs).toFixed(1));

    const hScore = calculateHealthScore(winRate, avgHp, 25, uncappedHealth);
    const sScore = calculateSanityScore(winRate, avgSanity, 15, uncappedHealth);
    const overallScore = calculateOverallScore(hScore, sScore, 1.0, uncappedHealth);

    // 判定歸屬之自然流派
    const baseIdList = s.deck.map((c) => c.id.replace(/_copy_\d+$/, ''));
    const cardIdSet = new Set(baseIdList);

    let matchedArch = emergentArchetypes.find((a) => a.id === s.archetypeId);
    if (!matchedArch) {
      let maxAffinity = -1;
      for (const arch of emergentArchetypes) {
        let overlap = 0;
        for (const mId of arch.memberCardIds) {
          if (cardIdSet.has(mId)) overlap++;
        }
        const unionCount = cardIdSet.size + arch.memberCardIds.length - overlap;
        const affinity = unionCount > 0 ? overlap / unionCount : 0;
        if (affinity > maxAffinity) {
          maxAffinity = affinity;
          matchedArch = arch;
        }
      }
    }

    // 統計卡牌種類與張數
    const countMap = new Map<string, { card: Card; copies: number }>();
    for (const c of s.deck) {
      const baseId = c.id.replace(/_copy_\d+$/, '');
      const existing = countMap.get(baseId);
      if (existing) {
        existing.copies++;
      } else {
        countMap.set(baseId, { card: c, copies: 1 });
      }
    }

    const cardDetails = Array.from(countMap.values()).map(({ card, copies }) => ({
      id: card.id.replace(/_copy_\d+$/, ''),
      name: card.name,
      copies,
      category: card.category,
    }));

    // 檢查是否包含該流派的核心 Combo
    const drivingCombos: Array<{ cards: string[]; synergy: number }> = [];
    if (matchedArch) {
      for (const combo of matchedArch.coreCombos) {
        if (combo.cardIds.every((id) => cardIdSet.has(id))) {
          drivingCombos.push({ cards: combo.cardNames, synergy: combo.synergyScore });
        }
      }
    }

    const nodeName = s.isHybridOrRogue
      ? `${s.archetypeName} #${i + 1}`
      : `${matchedArch ? matchedArch.name : s.archetypeName} 變體 #${i + 1}`;

    const node: DeckTopologyNode = {
      id: `deck_node_${i + 1}`,
      name: nodeName,
      cards: cardDetails,
      totalCards: s.deck.length,
      handRetention: s.handRetention,
      handCapacity: s.handRetention,
      winRate,
      avgHealthLost: avgHp,
      avgSanityExpended: avgSanity,
      overallScore,
      archetypeId: matchedArch ? matchedArch.id : s.archetypeId,
      archetypeName: matchedArch ? matchedArch.name : s.archetypeName,
      drivingCombos,
      x: coords[0],
      y: coords[1],
    };

    deckTopologyNodes.push(node);

    if (matchedArch) {
      let aStat = archStatsMap.get(matchedArch.id);
      if (!aStat) {
        aStat = { deckCount: 0, scoreSum: 0, hpSum: 0, sanitySum: 0 };
        archStatsMap.set(matchedArch.id, aStat);
      }
      aStat.deckCount++;
      aStat.scoreSum += overallScore;
      aStat.hpSum += avgHp;
      aStat.sanitySum += avgSanity;
    }
  }

  // 回填 emergentArchetypes 的彙總戰績
  for (const arch of emergentArchetypes) {
    const aStat = archStatsMap.get(arch.id);
    if (aStat && aStat.deckCount > 0) {
      arch.deckCount = aStat.deckCount;
      arch.avgScore = Math.round(aStat.scoreSum / aStat.deckCount);
      arch.avgHealthLost = Number((aStat.hpSum / aStat.deckCount).toFixed(1));
      arch.avgSanityExpended = Number((aStat.sanitySum / aStat.deckCount).toFixed(1));
    }
  }

  const summary: BalanceSummaryData = {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    totalCombatsSimulated: totalCombats,
    cards: cardReports,
    relics: relicReports,
    enemies: enemyReports,
    archetypeDefinitions: ARCHETYPE_DEFINITIONS,
    deckTopology: deckTopologyNodes,
    emergentArchetypes,
    cardSimilarityMatrix: cardSimilarityResult.toRecord(),
  };

  return { summary, rawLogs };
}
