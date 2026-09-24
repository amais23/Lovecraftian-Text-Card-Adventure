import type {
  ArchetypeId,
  CardBalanceReport,
  EnemyThreatReport,
  RelicBalanceReport,
} from './balanceTypes';
import type { Card, Enemy, Relic } from '../../types/game';

/**
 * 依據綜合得分評定天梯段位
 */
export function getTierRating(overallScore: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (overallScore >= 85) return 'S';
  if (overallScore >= 72) return 'A';
  if (overallScore >= 58) return 'B';
  if (overallScore >= 42) return 'C';
  return 'D';
}

/**
 * 計算單卡之肉體生存分 (0 ~ 100)
 */
export function calculateHealthScore(winRate: number, avgHealthLost: number, maxExpectedHp: number = 25): number {
  const hpRetention = Math.max(0, 1 - avgHealthLost / maxExpectedHp);
  return Math.round(Math.max(0, Math.min(100, winRate * 60 + hpRetention * 40)));
}

/**
 * 計算單卡之心智效率分 (0 ~ 100)
 */
export function calculateSanityScore(winRate: number, avgSanityExpended: number, maxExpectedSanity: number = 15): number {
  const sanityRetention = Math.max(0, 1 - avgSanityExpended / maxExpectedSanity);
  return Math.round(Math.max(0, Math.min(100, winRate * 50 + sanityRetention * 50)));
}

/**
 * 計算卡牌綜合天梯評分 (0 ~ 100)
 */
export function calculateOverallScore(
  healthScore: number,
  sanityScore: number,
  faultToleranceRatio: number = 1.0
): number {
  const score = healthScore * 0.5 + sanityScore * 0.35 + faultToleranceRatio * 15;
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * 組合單張卡牌的完整平衡性評測報告
 */
export function createCardBalanceReport(params: {
  card: Card;
  base1xMetrics: { winRate: number; avgHealthLost: number; avgSanityExpended: number; avgTurns: number };
  base2xMetrics: { winRate: number; avgHealthLost: number; avgSanityExpended: number; avgTurns: number };
  base3xMetrics: { winRate: number; avgHealthLost: number; avgSanityExpended: number; avgTurns: number };
  faultToleranceRatio: number;
  archetypeWinRates: Record<ArchetypeId, number>;
  enemyMatchups: Array<{ id: string; name: string; winRate: number }>;
}): CardBalanceReport {
  const { card, base1xMetrics, base2xMetrics, base3xMetrics, faultToleranceRatio, archetypeWinRates, enemyMatchups } = params;

  // 1. 各副本階層得分計算
  const calcScore = (m: { winRate: number; avgHealthLost: number; avgSanityExpended: number }) => {
    const h = calculateHealthScore(m.winRate, m.avgHealthLost);
    const s = calculateSanityScore(m.winRate, m.avgSanityExpended);
    return calculateOverallScore(h, s, faultToleranceRatio);
  };

  const score1x = calcScore(base1xMetrics);
  const score2x = calcScore(base2xMetrics);
  const score3x = calcScore(base3xMetrics);

  const healthScore = calculateHealthScore(base1xMetrics.winRate, base1xMetrics.avgHealthLost);
  const sanityScore = calculateSanityScore(base1xMetrics.winRate, base1xMetrics.avgSanityExpended);
  const overallScore = score1x;
  const tierRating = getTierRating(overallScore);

  // 2. 流派協同倍率計算（相對於 Baseline 裸強度的放大倍率）
  const baselineWinRate = Math.max(0.05, base1xMetrics.winRate);
  const synergyMultipliers = {} as Record<ArchetypeId, number>;
  let bestArchetype: ArchetypeId = 'armor_counter';
  let maxMultiplier = -1;

  for (const [archKey, archWinRate] of Object.entries(archetypeWinRates) as [ArchetypeId, number][]) {
    const mult = Number((archWinRate / baselineWinRate).toFixed(2));
    synergyMultipliers[archKey] = mult;
    if (mult > maxMultiplier) {
      maxMultiplier = mult;
      bestArchetype = archKey;
    }
  }

  // 3. 敵怪優劣勢排序 (Top 3)
  const sortedMatchups = [...enemyMatchups].sort((a, b) => b.winRate - a.winRate);
  const favorableEnemies = sortedMatchups.slice(0, 3);
  const unfavorableEnemies = sortedMatchups.slice(-3).reverse();

  return {
    id: card.id,
    name: card.name,
    category: card.category,
    tier: card.tier,
    occupations: card.occupations,
    costType: card.costType,
    costValue: card.costValue,
    description: card.description,

    healthScore,
    sanityScore,
    overallScore,
    tierRating,

    winRate: Number(base1xMetrics.winRate.toFixed(3)),
    avgHealthLost: Number(base1xMetrics.avgHealthLost.toFixed(1)),
    avgSanityExpended: Number(base1xMetrics.avgSanityExpended.toFixed(1)),
    avgTurns: Number(base1xMetrics.avgTurns.toFixed(1)),
    faultToleranceRatio: Number(faultToleranceRatio.toFixed(2)),

    copiesCurve: {
      1: {
        winRate: Number(base1xMetrics.winRate.toFixed(3)),
        overallScore: score1x,
        avgHealthLost: Number(base1xMetrics.avgHealthLost.toFixed(1)),
        avgSanityExpended: Number(base1xMetrics.avgSanityExpended.toFixed(1)),
      },
      2: {
        winRate: Number(base2xMetrics.winRate.toFixed(3)),
        overallScore: score2x,
        avgHealthLost: Number(base2xMetrics.avgHealthLost.toFixed(1)),
        avgSanityExpended: Number(base2xMetrics.avgSanityExpended.toFixed(1)),
      },
      3: {
        winRate: Number(base3xMetrics.winRate.toFixed(3)),
        overallScore: score3x,
        avgHealthLost: Number(base3xMetrics.avgHealthLost.toFixed(1)),
        avgSanityExpended: Number(base3xMetrics.avgSanityExpended.toFixed(1)),
      },
    },

    synergyMultipliers,
    bestArchetype,
    favorableEnemies,
    unfavorableEnemies,
  };
}

/**
 * 組合舊日遺物的完整平衡性評測報告
 */
export function createRelicBalanceReport(params: {
  relic: Relic;
  copiesMetrics: Record<0 | 1 | 2 | 3, { winRate: number; avgHealthLost: number; avgSanityExpended: number }>;
}): RelicBalanceReport {
  const { relic, copiesMetrics } = params;

  const scoreMap = {
    0: calculateOverallScore(
      calculateHealthScore(copiesMetrics[0].winRate, copiesMetrics[0].avgHealthLost),
      calculateSanityScore(copiesMetrics[0].winRate, copiesMetrics[0].avgSanityExpended)
    ),
    1: calculateOverallScore(
      calculateHealthScore(copiesMetrics[1].winRate, copiesMetrics[1].avgHealthLost),
      calculateSanityScore(copiesMetrics[1].winRate, copiesMetrics[1].avgSanityExpended)
    ),
    2: calculateOverallScore(
      calculateHealthScore(copiesMetrics[2].winRate, copiesMetrics[2].avgHealthLost),
      calculateSanityScore(copiesMetrics[2].winRate, copiesMetrics[2].avgSanityExpended)
    ),
    3: calculateOverallScore(
      calculateHealthScore(copiesMetrics[3].winRate, copiesMetrics[3].avgHealthLost),
      calculateSanityScore(copiesMetrics[3].winRate, copiesMetrics[3].avgSanityExpended)
    ),
  };

  const delta1 = scoreMap[1] - scoreMap[0];
  const delta2 = scoreMap[2] - scoreMap[1];
  const delta3 = scoreMap[3] - scoreMap[2];
  const avgDelta = (delta1 + delta2 + delta3) / 3;
  const marginalBenefitPerStack = Number(avgDelta.toFixed(1));

  const overallScore = Math.max(0, Math.min(100, Math.round(scoreMap[1] + marginalBenefitPerStack)));
  const tierRating = getTierRating(overallScore);
  const healthScore = calculateHealthScore(copiesMetrics[1].winRate, copiesMetrics[1].avgHealthLost);
  const sanityScore = calculateSanityScore(copiesMetrics[1].winRate, copiesMetrics[1].avgSanityExpended);

  const RELIC_SYNERGIES: Record<string, { bestArchetype: ArchetypeId; synergies: Record<ArchetypeId, number> }> = {
    elder_sign_amulet: {
      bestArchetype: 'armor_counter',
      synergies: { armor_counter: 1.8, status_attrition: 1.4, truth_restore: 1.2, high_cost_magic: 1.1, bleed_pierce: 1.0, madness_sacrifice: 1.0 },
    },
    pocket_watch: {
      bestArchetype: 'high_cost_magic',
      synergies: { high_cost_magic: 1.6, truth_restore: 1.5, status_attrition: 1.4, bleed_pierce: 1.3, madness_sacrifice: 1.2, armor_counter: 1.1 },
    },
    vitality_elixir: {
      bestArchetype: 'madness_sacrifice',
      synergies: { madness_sacrifice: 1.7, armor_counter: 1.4, bleed_pierce: 1.2, status_attrition: 1.2, truth_restore: 1.1, high_cost_magic: 1.0 },
    },
    obsidian_mirror: {
      bestArchetype: 'status_attrition',
      synergies: { status_attrition: 1.6, armor_counter: 1.5, truth_restore: 1.3, bleed_pierce: 1.2, high_cost_magic: 1.1, madness_sacrifice: 1.0 },
    },
    dread_talisman: {
      bestArchetype: 'bleed_pierce',
      synergies: { bleed_pierce: 1.8, madness_sacrifice: 1.5, armor_counter: 1.3, high_cost_magic: 1.2, status_attrition: 1.1, truth_restore: 1.0 },
    },
    eldritch_lantern: {
      bestArchetype: 'truth_restore',
      synergies: { truth_restore: 1.7, high_cost_magic: 1.6, bleed_pierce: 1.4, madness_sacrifice: 1.3, armor_counter: 1.2, status_attrition: 1.2 },
    },
  };

  const synergyInfo = RELIC_SYNERGIES[relic.id] || {
    bestArchetype: 'armor_counter' as ArchetypeId,
    synergies: { armor_counter: 1.0, bleed_pierce: 1.0, truth_restore: 1.0, madness_sacrifice: 1.0, high_cost_magic: 1.0, status_attrition: 1.0 },
  };

  return {
    id: relic.id,
    name: relic.name,
    rarity: relic.rarity,
    description: relic.description,
    icon: relic.icon,
    copiesCurve: {
      0: {
        winRate: Number(copiesMetrics[0].winRate.toFixed(3)),
        avgHealthLost: Number(copiesMetrics[0].avgHealthLost.toFixed(1)),
        avgSanityExpended: Number(copiesMetrics[0].avgSanityExpended.toFixed(1)),
        score: scoreMap[0],
      },
      1: {
        winRate: Number(copiesMetrics[1].winRate.toFixed(3)),
        avgHealthLost: Number(copiesMetrics[1].avgHealthLost.toFixed(1)),
        avgSanityExpended: Number(copiesMetrics[1].avgSanityExpended.toFixed(1)),
        score: scoreMap[1],
      },
      2: {
        winRate: Number(copiesMetrics[2].winRate.toFixed(3)),
        avgHealthLost: Number(copiesMetrics[2].avgHealthLost.toFixed(1)),
        avgSanityExpended: Number(copiesMetrics[2].avgSanityExpended.toFixed(1)),
        score: scoreMap[2],
      },
      3: {
        winRate: Number(copiesMetrics[3].winRate.toFixed(3)),
        avgHealthLost: Number(copiesMetrics[3].avgHealthLost.toFixed(1)),
        avgSanityExpended: Number(copiesMetrics[3].avgSanityExpended.toFixed(1)),
        score: scoreMap[3],
      },
    },
    marginalBenefitPerStack,
    healthScore,
    sanityScore,
    overallScore,
    tierRating,
    synergyMultipliers: synergyInfo.synergies,
    bestArchetype: synergyInfo.bestArchetype,
  };
}

/**
 * 組合敵怪的危險度評測報告
 */
export function createEnemyThreatReport(params: {
  enemy: Enemy;
  depth: 1 | 2 | 3 | 4;
  role: 'normal' | 'elite' | 'boss';
  investigatorWinRate: number;
  avgInvestigatorHealthLost: number;
  avgSanityEroded: number;
  avgCombatDurationTurns: number;
  counteredByCards: Array<{ id: string; name: string; winRate: number }>;
  archetypePerformances: Record<ArchetypeId, number>; // 各流派面對此怪之勝率
}): EnemyThreatReport {
  const {
    enemy,
    depth,
    role,
    investigatorWinRate,
    avgInvestigatorHealthLost,
    avgSanityEroded,
    avgCombatDurationTurns,
    counteredByCards,
    archetypePerformances,
  } = params;

  // 威脅度指數 (0 ~ 100): 越難打贏、打殘調查員越多生命、侵蝕越多理智，威脅度越高
  const defeatRate = 1 - investigatorWinRate;
  const hpDamageNorm = Math.min(1, avgInvestigatorHealthLost / 25);
  const sanityErodeNorm = Math.min(1, avgSanityEroded / 15);
  const threatScore = Math.round(
    Math.max(0, Math.min(100, defeatRate * 60 + hpDamageNorm * 25 + sanityErodeNorm * 15))
  );

  // 找出剋制此怪的最優流派與最危險流派
  let maxArchWin = -1;
  let minArchWin = 2;
  let vulnerableArchetype: ArchetypeId = 'armor_counter';
  let dangerousArchetype: ArchetypeId = 'madness_sacrifice';

  for (const [arch, win] of Object.entries(archetypePerformances) as [ArchetypeId, number][]) {
    if (win > maxArchWin) {
      maxArchWin = win;
      vulnerableArchetype = arch;
    }
    if (win < minArchWin) {
      minArchWin = win;
      dangerousArchetype = arch;
    }
  }

  return {
    id: enemy.id,
    name: enemy.name,
    title: enemy.title,
    depth,
    role,
    health: enemy.health,
    armor: enemy.armor,

    threatScore,
    rank: 0, // 由外部統一排序後注入
    investigatorWinRate: Number(investigatorWinRate.toFixed(3)),
    avgInvestigatorHealthLost: Number(avgInvestigatorHealthLost.toFixed(1)),
    avgSanityEroded: Number(avgSanityEroded.toFixed(1)),
    avgCombatDurationTurns: Number(avgCombatDurationTurns.toFixed(1)),

    counteredByCards: counteredByCards.slice(0, 3),
    vulnerableArchetype,
    dangerousArchetype,
  };
}
