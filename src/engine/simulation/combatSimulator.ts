import type { Card, Enemy, Investigator } from '../../types/game';
import { INITIAL_INVESTIGATOR } from '../initialData';
import { initializeCombatSession, resolveCombatTurnEnd } from '../combat/turnResolver';
import { evaluateCardPlay } from '../cards/evaluator';
import { solveBestTurnPlays } from './turnSolver';
import type {
  BatchCombatMetrics,
  BatchCombatOptions,
  SingleCombatOptions,
  SingleCombatResult,
} from './types';

/**
 * 執行單場戰鬥完整模擬 (Pure Single Combat Simulator)
 */
export function simulateCombat(options: SingleCombatOptions): SingleCombatResult {
  const {
    deck,
    relics = [],
    enemy,
    investigator: customInvestigator,
    policyMode = 'optimal',
    maxTurns = 40,
    recordLogs = false,
    randomFn = Math.random,
    uncappedHealth = false,
    handCapacity: optionsHandCapacity,
  } = options;

  // 1. 組裝調查員初始實體
  const defaultInitialHealth = uncappedHealth ? 100000 : INITIAL_INVESTIGATOR.health;
  const defaultMaxHealth = uncappedHealth ? 100000 : INITIAL_INVESTIGATOR.maxHealth;
  const initialHealth = customInvestigator?.health ?? (uncappedHealth ? defaultInitialHealth : (customInvestigator?.maxHealth ?? INITIAL_INVESTIGATOR.health));
  const initialMaxHealth = customInvestigator?.maxHealth ?? defaultMaxHealth;
  const resolvedHandCapacity = optionsHandCapacity ?? customInvestigator?.handCapacity ?? INITIAL_INVESTIGATOR.handCapacity ?? 2;
  const baseInvestigator: Investigator = {
    ...INITIAL_INVESTIGATOR,
    ...customInvestigator,
    health: initialHealth,
    maxHealth: initialMaxHealth,
    stamina: customInvestigator?.stamina ?? INITIAL_INVESTIGATOR.stamina,
    maxStamina: customInvestigator?.maxStamina ?? INITIAL_INVESTIGATOR.maxStamina,
    armor: customInvestigator?.armor ?? 0,
    statusEffects: customInvestigator?.statusEffects ? [...customInvestigator.statusEffects] : [],
    occupationId: customInvestigator?.occupationId ?? INITIAL_INVESTIGATOR.occupationId ?? 'investigator',
    relics: [...relics],
    handCapacity: resolvedHandCapacity,
  };

  // 2. 初始化戰鬥會話
  const session = initializeCombatSession({
    enemy,
    deck,
    investigator: baseInvestigator,
    handCapacity: resolvedHandCapacity,
  });

  let currentInvestigator: Investigator = session.investigator;
  let currentEnemy: Enemy = session.enemy;
  let currentHand: Card[] = session.hand;
  let currentSanityDeck: Card[] = session.sanityDeck;
  let currentDiscard: Card[] = session.discardPile;
  let currentExhaust: Card[] = session.exhaustPile;
  let isMadness = session.isMadness;
  let currentTurn = session.turn;

  const totalLogs: string[] = recordLogs ? [...session.logs] : [];
  let cardsPlayedTotal = 0;
  const initialSanityCount = deck.length;
  let totalSanityRestored = 0;
  let madnessTurns = 0;

  let outcome: 'victory' | 'defeat' | 'timeout' = 'timeout';

  while (currentTurn <= maxTurns) {
    if (isMadness) {
      madnessTurns++;
    }

    // 檢查開局即時勝負
    if (currentInvestigator.health <= 0) {
      outcome = 'defeat';
      break;
    }
    if (currentEnemy.health <= 0) {
      outcome = 'victory';
      break;
    }

    // A. 求解當前回合出牌序列
    const plannedCards = solveBestTurnPlays(
      currentInvestigator,
      currentEnemy,
      currentHand,
      currentSanityDeck,
      currentDiscard,
      currentExhaust,
      currentTurn,
      policyMode,
      randomFn
    );

    let cardsPlayedThisTurn = 0;

    // B. 依序執行出牌
    for (const card of plannedCards) {
      const playContext = {
        investigator: {
          health: currentInvestigator.health,
          maxHealth: currentInvestigator.maxHealth,
          stamina: currentInvestigator.stamina,
          armor: currentInvestigator.armor,
          statusEffects: currentInvestigator.statusEffects,
          occupationId: currentInvestigator.occupationId,
        },
        enemy: currentEnemy,
        hand: currentHand,
        sanityDeck: currentSanityDeck,
        discardPile: currentDiscard,
        exhaustPile: currentExhaust,
        turn: currentTurn,
        isMadness,
        cardsPlayedThisTurn,
        skipLogs: !recordLogs,
        randomFn,
      };

      const deckLenBefore = currentSanityDeck.length;
      const playResult = evaluateCardPlay(card, playContext);
      if (!playResult.success) {
        continue;
      }

      if (playResult.sanityDeck.length > deckLenBefore) {
        totalSanityRestored += playResult.sanityDeck.length - deckLenBefore;
      }

      cardsPlayedThisTurn++;
      cardsPlayedTotal++;
      if (recordLogs) {
        totalLogs.push(...playResult.logs);
      }

      currentInvestigator = {
        ...currentInvestigator,
        health: playResult.investigator.health,
        armor: playResult.investigator.armor,
        stamina: playResult.investigator.stamina,
        statusEffects: playResult.investigator.statusEffects,
      };
      currentEnemy = {
        ...currentEnemy,
        health: playResult.enemy.health,
        armor: playResult.enemy.armor,
        statusEffects: playResult.enemy.statusEffects,
      };
      currentHand = playResult.hand;
      currentSanityDeck = playResult.sanityDeck;
      currentDiscard = playResult.discardPile;
      currentExhaust = playResult.exhaustPile ?? [];
      isMadness = playResult.isMadness;

      // 戰鬥即時結算判定
      if (playResult.combatOutcome === 'victory') {
        outcome = 'victory';
        break;
      } else if (playResult.combatOutcome === 'defeat') {
        outcome = 'defeat';
        break;
      }
    }

    if (outcome === 'victory' || outcome === 'defeat') {
      break;
    }

    // C. 回合結束結算（敵怪行動、印記結算、抽牌）
    const turnEndResult = resolveCombatTurnEnd({
      enemy: currentEnemy,
      investigator: currentInvestigator,
      turn: currentTurn,
      retainedHand: currentHand,
      sanityDeck: currentSanityDeck,
      discardPile: currentDiscard,
      exhaustPile: currentExhaust,
      isMadness,
      initialLogs: [],
      cardsPlayedThisTurn,
    });

    if (recordLogs) {
      totalLogs.push(...turnEndResult.logs);
    }

    currentInvestigator = turnEndResult.investigator;
    currentEnemy = turnEndResult.enemy;
    currentHand = turnEndResult.hand;
    currentSanityDeck = turnEndResult.sanityDeck;
    currentDiscard = turnEndResult.discardPile;
    currentExhaust = turnEndResult.exhaustPile ?? [];
    isMadness = turnEndResult.isMadness;

    if (turnEndResult.outcome === 'victory') {
      outcome = 'victory';
      break;
    } else if (turnEndResult.outcome === 'defeat') {
      outcome = 'defeat';
      break;
    }

    currentTurn++;
  }

  const healthLost = Math.max(0, initialHealth - currentInvestigator.health);
  const baseSanityExpended = Math.max(0, initialSanityCount - currentSanityDeck.length);
  // 心智磨損綜合評估：基礎牌庫淨流失 + 陷入瘋狂深淵的回合損耗 (每回合折算 1.5 張黑卡心智負擔) - 打出卡牌洗回理智牌庫的回補量
  const mentalStrain = uncappedHealth
    ? Math.max(0, baseSanityExpended - totalSanityRestored + madnessTurns * 1.5)
    : Math.max(0, baseSanityExpended - totalSanityRestored);
  const sanityCardsExpended = Number(mentalStrain.toFixed(1));

  return {
    victory: outcome === 'victory',
    outcome,
    turns: Math.min(currentTurn, maxTurns),
    investigatorHealthRemaining: Math.max(0, currentInvestigator.health),
    healthLost,
    sanityDeckRemaining: currentSanityDeck.length,
    sanityCardsExpended,
    isMadness,
    cardsPlayedTotal,
    logs: totalLogs,
  };
}

/**
 * 執行雙軌批次戰鬥評測（上限 vs 容錯雙軌對比）
 */
export function simulateCombatBatch(options: BatchCombatOptions): BatchCombatMetrics {
  const { runs = 50, randomFn = Math.random } = options;

  // 1. 跑最優模式 (Optimal Runs)
  let optWins = 0;
  let optHealthLostSum = 0;
  let optSanityExpendedSum = 0;
  let optTurnsSum = 0;

  for (let i = 0; i < runs; i++) {
    const res = simulateCombat({
      ...options,
      policyMode: 'optimal',
      randomFn,
    });
    if (res.victory) optWins++;
    optHealthLostSum += res.healthLost;
    optSanityExpendedSum += res.sanityCardsExpended;
    optTurnsSum += res.turns;
  }

  const optimalMetrics = {
    winRate: optWins / runs,
    avgHealthLost: optHealthLostSum / runs,
    avgSanityExpended: optSanityExpendedSum / runs,
    avgTurns: optTurnsSum / runs,
  };

  // 2. 跑容錯壓力模式 (Fault Tolerant Runs)
  let ftWins = 0;
  let ftHealthLostSum = 0;
  let ftSanityExpendedSum = 0;
  let ftTurnsSum = 0;

  for (let i = 0; i < runs; i++) {
    const res = simulateCombat({
      ...options,
      policyMode: 'fault_tolerant',
      randomFn,
    });
    if (res.victory) ftWins++;
    ftHealthLostSum += res.healthLost;
    ftSanityExpendedSum += res.sanityCardsExpended;
    ftTurnsSum += res.turns;
  }

  const ftMetrics = {
    winRate: ftWins / runs,
    avgHealthLost: ftHealthLostSum / runs,
    avgSanityExpended: ftSanityExpendedSum / runs,
    avgTurns: ftTurnsSum / runs,
  };

  // 3. 計算容錯穩定係數 (Fault Tolerance Ratio, 0.0 ~ 1.0)
  // 基於次優模式勝率相對於最優模式的保持率，並納入生命損失差距修正
  let faultToleranceRatio = 1.0;
  if (optimalMetrics.winRate > 0) {
    const winRateRatio = ftMetrics.winRate / optimalMetrics.winRate;
    const hpPenalty = Math.max(0, ftMetrics.avgHealthLost - optimalMetrics.avgHealthLost) * 0.02;
    faultToleranceRatio = Math.max(0, Math.min(1.0, winRateRatio - hpPenalty));
  } else {
    faultToleranceRatio = 0.0;
  }

  return {
    runs,
    optimal: optimalMetrics,
    faultTolerant: ftMetrics,
    faultToleranceRatio,
  };
}
