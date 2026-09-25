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
export function calculateHealthScore(
  winRate: number,
  avgHealthLost: number,
  maxExpectedHp: number = 25,
  isUncappedHealth: boolean = false
): number {
  if (isUncappedHealth) {
    // 生命值無上限模式：直接以肉體生命損失評定強弱（承傷越低、減傷/續航/速殺能力越高，得分越高）
    // 基準承傷尺度（全牌庫 10~35 張隨機抽樣與動態 2~6 手牌保留數環境）：
    // <= 2.5 點損失 = 100 分，~7.2 點損失 = 60 分，~8.4 點損失 = 50 分，14.3+ 點損失 = 0 分
    const score = 100 - (avgHealthLost - 2.5) * 8.5;
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  const hpRetention = Math.max(0, 1 - avgHealthLost / maxExpectedHp);
  return Math.round(Math.max(0, Math.min(100, winRate * 60 + hpRetention * 40)));
}

/**
 * 計算單卡之心智效率分 (0 ~ 100)
 * 理智牌庫消耗越低、回補洗回越高、維持常態清醒回合越長，心智效率分越高
 */
export function calculateSanityScore(
  winRate: number,
  avgSanityExpended: number,
  maxExpectedSanity: number = 15,
  isUncappedHealth: boolean = false
): number {
  if (isUncappedHealth) {
    // 基準心智消耗尺度（全牌庫 10~35 張隨機抽樣與動態 2~6 手牌保留數環境）：
    // <= 1.0 張消耗 = 100 分，~5.0 張消耗 = 60 分，~6.0 張（中位數）= 50 分，>= 11.0 張消耗 = 0 分
    const score = 100 - (avgSanityExpended - 1.0) * 10.0;
    return Math.round(Math.max(0, Math.min(100, score)));
  }
  const sanityRetention = Math.max(0, 1 - avgSanityExpended / maxExpectedSanity);
  return Math.round(Math.max(0, Math.min(100, winRate * 50 + sanityRetention * 50)));
}

/**
 * 計算卡牌綜合天梯評分 (0 ~ 100)
 */
export function calculateOverallScore(
  healthScore: number,
  sanityScore: number,
  faultToleranceRatio: number = 1.0,
  isUncappedHealth: boolean = false
): number {
  if (isUncappedHealth) {
    // 生命值無上限模式：以「損失的生命值」為主軸核心權重 (75%)，結合心智消耗 (15%) 與容錯穩定度 (10%)
    const score = healthScore * 0.75 + sanityScore * 0.15 + faultToleranceRatio * 10;
    return Math.round(Math.max(0, Math.min(100, score)));
  }
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
  archetypeHealthLosses?: Record<ArchetypeId, number>;
  enemyMatchups: Array<{ id: string; name: string; winRate: number; avgHealthLost?: number }>;
  isUncappedHealth?: boolean;
}): CardBalanceReport {
  const {
    card,
    base1xMetrics,
    base2xMetrics,
    base3xMetrics,
    faultToleranceRatio,
    archetypeWinRates,
    archetypeHealthLosses,
    enemyMatchups,
    isUncappedHealth = false,
  } = params;

  // 1. 各副本階層得分計算
  const calcScore = (m: { winRate: number; avgHealthLost: number; avgSanityExpended: number }) => {
    const h = calculateHealthScore(m.winRate, m.avgHealthLost, 25, isUncappedHealth);
    const s = calculateSanityScore(m.winRate, m.avgSanityExpended, 15, isUncappedHealth);
    return calculateOverallScore(h, s, faultToleranceRatio, isUncappedHealth);
  };

  const score1x = calcScore(base1xMetrics);
  const score2x = calcScore(base2xMetrics);
  const score3x = calcScore(base3xMetrics);

  const healthScore = calculateHealthScore(base1xMetrics.winRate, base1xMetrics.avgHealthLost, 25, isUncappedHealth);
  const sanityScore = calculateSanityScore(base1xMetrics.winRate, base1xMetrics.avgSanityExpended, 15, isUncappedHealth);
  const overallScore = score1x;
  const tierRating = getTierRating(overallScore);

  // 2. 流派協同倍率計算（相對於 Baseline 裸強度的放大倍率）
  const synergyMultipliers = {} as Record<ArchetypeId, number>;
  let bestArchetype: ArchetypeId = 'armor_counter';
  let maxMultiplier = -1;

  if (isUncappedHealth && archetypeHealthLosses) {
    const baselineLoss = Math.max(5, base1xMetrics.avgHealthLost);
    for (const [archKey, archLoss] of Object.entries(archetypeHealthLosses) as [ArchetypeId, number][]) {
      // 承傷越少，相對於 baseline 的防護/協同放大倍率越高
      const mult = Number(((baselineLoss + 10) / (Math.max(1, archLoss) + 10)).toFixed(2));
      synergyMultipliers[archKey] = mult;
      if (mult > maxMultiplier) {
        maxMultiplier = mult;
        bestArchetype = archKey;
      }
    }
  } else {
    const baselineWinRate = Math.max(0.05, base1xMetrics.winRate);
    for (const [archKey, archWinRate] of Object.entries(archetypeWinRates) as [ArchetypeId, number][]) {
      const mult = Number((archWinRate / baselineWinRate).toFixed(2));
      synergyMultipliers[archKey] = mult;
      if (mult > maxMultiplier) {
        maxMultiplier = mult;
        bestArchetype = archKey;
      }
    }
  }

  // 3. 敵怪優劣勢排序 (Top 3)
  let sortedMatchups: Array<{ id: string; name: string; winRate: number; avgHealthLost?: number }>;
  if (isUncappedHealth) {
    sortedMatchups = [...enemyMatchups].sort((a, b) => (a.avgHealthLost ?? 0) - (b.avgHealthLost ?? 0));
  } else {
    sortedMatchups = [...enemyMatchups].sort((a, b) => b.winRate - a.winRate);
  }
  const favorableEnemies = sortedMatchups.slice(0, 3).map((e) => ({ id: e.id, name: e.name, winRate: e.winRate }));
  const unfavorableEnemies = sortedMatchups.slice(-3).reverse().map((e) => ({ id: e.id, name: e.name, winRate: e.winRate }));

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

export function createRelicBalanceReport(params: {
  relic: Relic;
  copiesMetrics: Record<0 | 1 | 2 | 3, { winRate: number; avgHealthLost: number; avgSanityExpended: number }>;
  isUncappedHealth?: boolean;
}): RelicBalanceReport {
  const { relic, copiesMetrics, isUncappedHealth = false } = params;

  const scoreMap = {
    0: calculateOverallScore(
      calculateHealthScore(copiesMetrics[0].winRate, copiesMetrics[0].avgHealthLost, 25, isUncappedHealth),
      calculateSanityScore(copiesMetrics[0].winRate, copiesMetrics[0].avgSanityExpended, 15, isUncappedHealth),
      1.0,
      isUncappedHealth
    ),
    1: calculateOverallScore(
      calculateHealthScore(copiesMetrics[1].winRate, copiesMetrics[1].avgHealthLost, 25, isUncappedHealth),
      calculateSanityScore(copiesMetrics[1].winRate, copiesMetrics[1].avgSanityExpended, 15, isUncappedHealth),
      1.0,
      isUncappedHealth
    ),
    2: calculateOverallScore(
      calculateHealthScore(copiesMetrics[2].winRate, copiesMetrics[2].avgHealthLost, 25, isUncappedHealth),
      calculateSanityScore(copiesMetrics[2].winRate, copiesMetrics[2].avgSanityExpended, 15, isUncappedHealth),
      1.0,
      isUncappedHealth
    ),
    3: calculateOverallScore(
      calculateHealthScore(copiesMetrics[3].winRate, copiesMetrics[3].avgHealthLost, 25, isUncappedHealth),
      calculateSanityScore(copiesMetrics[3].winRate, copiesMetrics[3].avgSanityExpended, 15, isUncappedHealth),
      1.0,
      isUncappedHealth
    ),
  };

  const delta1 = scoreMap[1] - scoreMap[0];
  const delta2 = scoreMap[2] - scoreMap[1];
  const delta3 = scoreMap[3] - scoreMap[2];
  const avgDelta = (delta1 + delta2 + delta3) / 3;
  const marginalBenefitPerStack = Number(avgDelta.toFixed(1));

  const overallScore = Math.max(0, Math.min(100, Math.round(scoreMap[1] + marginalBenefitPerStack)));
  const tierRating = getTierRating(overallScore);
  const healthScore = calculateHealthScore(copiesMetrics[1].winRate, copiesMetrics[1].avgHealthLost, 25, isUncappedHealth);
  const sanityScore = calculateSanityScore(copiesMetrics[1].winRate, copiesMetrics[1].avgSanityExpended, 15, isUncappedHealth);

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
  archetypeHealthLosses?: Record<ArchetypeId, number>; // 各流派面對此怪之平均生命損失
  isUncappedHealth?: boolean;
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
    archetypeHealthLosses,
    isUncappedHealth = false,
  } = params;

  // 威脅度指數 (0 ~ 100): 越難打贏、打殘調查員越多生命、侵蝕越多理智，威脅度越高
  let threatScore: number;
  if (isUncappedHealth) {
    // 生命值無上限模式：威脅度由「敵怪對調查員造成的肉體生命損耗」主導判定！
    // 基準刻度：最高危險標竿 ~120 點生命損失
    const hpDamageNorm = Math.min(1, avgInvestigatorHealthLost / 120);
    const sanityErodeNorm = Math.min(1, avgSanityEroded / 15);
    threatScore = Math.round(
      Math.max(0, Math.min(100, hpDamageNorm * 75 + sanityErodeNorm * 25))
    );
  } else {
    const defeatRate = 1 - investigatorWinRate;
    const hpDamageNorm = Math.min(1, avgInvestigatorHealthLost / 25);
    const sanityErodeNorm = Math.min(1, avgSanityEroded / 15);
    threatScore = Math.round(
      Math.max(0, Math.min(100, defeatRate * 60 + hpDamageNorm * 25 + sanityErodeNorm * 15))
    );
  }

  // 找出剋制此怪的最優流派與最危險流派
  let vulnerableArchetype: ArchetypeId = 'armor_counter';
  let dangerousArchetype: ArchetypeId = 'madness_sacrifice';

  if (isUncappedHealth && archetypeHealthLosses) {
    // 損失生命最少代表最剋制此怪，損失生命最多代表最受威脅
    let minLoss = Infinity;
    let maxLoss = -1;
    for (const [arch, loss] of Object.entries(archetypeHealthLosses) as [ArchetypeId, number][]) {
      if (loss < minLoss) {
        minLoss = loss;
        vulnerableArchetype = arch;
      }
      if (loss > maxLoss) {
        maxLoss = loss;
        dangerousArchetype = arch;
      }
    }
  } else {
    let maxArchWin = -1;
    let minArchWin = 2;
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
