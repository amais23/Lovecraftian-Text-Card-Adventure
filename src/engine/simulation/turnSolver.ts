import type { Card, Enemy, Investigator, StatusEffect } from '../../types/game';
import { evaluateCardPlay } from '../cards/evaluator';
import type { CardPlayContext } from '../cards/types';
import type { SimulationPolicyMode } from './types';

export interface EvaluatedSequence {
  cards: Card[];
  score: number;
  killsEnemy: boolean;
}

/**
 * 評估出牌序列結束時之局面啟發式分數 (Board Heuristic Evaluator)
 */
function evaluateBoardStateScore(
  initialInvestigator: Investigator,
  initialEnemy: Enemy,
  finalInvestigator: { health: number; armor: number; stamina: number; statusEffects?: StatusEffect[] },
  finalEnemy: { health: number; armor: number; statusEffects?: StatusEffect[] },
  finalSanityDeckLength: number,
  initialSanityDeckLength: number,
  cardsPlayedCount: number,
  enemyIntentValue: number = 0,
  enemyIntentType: string = 'attack'
): number {
  // 1. 擊殺敵怪（最高優先度，越少卡牌斬殺越優）
  if (finalEnemy.health <= 0) {
    return 100000 - cardsPlayedCount * 10;
  }

  let score = 0;

  // 2. 造成敵怪生命損耗與破甲
  const damageDealt = Math.max(0, initialEnemy.health - finalEnemy.health);
  const armorBroken = Math.max(0, initialEnemy.armor - finalEnemy.armor);
  score += damageDealt * 12;
  score += armorBroken * 5;

  // 3. 抵擋敵怪意圖傷害（若敵怪即將攻擊，護甲有效吸收傷害提供極高加分）
  if (enemyIntentType === 'attack' && enemyIntentValue > 0) {
    const effectiveArmor = Math.min(finalInvestigator.armor, enemyIntentValue);
    score += effectiveArmor * 18;
    if (finalInvestigator.armor >= enemyIntentValue) {
      score += 60; // 完全抵擋攻擊的額外安全獎勵
    }
  } else {
    // 敵怪非攻擊時，常規護甲積累亦有價值
    score += finalInvestigator.armor * 4;
  }

  // 4. 肉體生命反噬懲罰
  const healthLost = Math.max(0, initialInvestigator.health - finalInvestigator.health);
  score -= healthLost * 30;

  // 5. 狀態印記價值（施加易傷/流血，自身獲得力量/堅韌）
  if (finalEnemy.statusEffects) {
    for (const eff of finalEnemy.statusEffects) {
      if (eff.type === 'vulnerable') score += eff.stacks * 10;
      if (eff.type === 'bleed') score += eff.stacks * 8;
    }
  }
  if (finalInvestigator.statusEffects) {
    for (const eff of finalInvestigator.statusEffects) {
      if (eff.type === 'might') score += eff.stacks * 10;
      if (eff.type === 'resilience') score += eff.stacks * 8;
    }
  }

  // 6. 理智牌庫管理（低理智時回補與注入權重激增）
  const sanityDelta = finalSanityDeckLength - initialSanityDeckLength;
  if (finalSanityDeckLength <= 3) {
    score += sanityDelta * 45; // 瀕臨瘋狂時強烈鼓勵回補理智
  } else {
    score += sanityDelta * 5;
  }

  // 7. 精力合理利用（避免無謂浪費行動點數）
  const staminaSpent = Math.max(0, initialInvestigator.stamina - finalInvestigator.stamina);
  score += staminaSpent * 3;

  return score;
}

/**
 * 求解當前回合的最優或容錯出牌序列 (1-Ply Turn Sequence Solver)
 */
export function solveBestTurnPlays(
  investigator: Investigator,
  enemy: Enemy,
  hand: Card[],
  sanityDeck: Card[],
  discardPile: Card[],
  exhaustPile: Card[] = [],
  turn: number,
  policyMode: SimulationPolicyMode = 'optimal',
  randomFn: () => number = Math.random
): Card[] {
  if (hand.length === 0) return [];

  const candidateSequences: EvaluatedSequence[] = [];
  const enemyIntentValue = enemy.currentIntent?.value ?? 0;
  const enemyIntentType = enemy.currentIntent?.type ?? 'attack';

  // 空出牌序列（直接結束回合的基準分）
  const baseScore = evaluateBoardStateScore(
    investigator,
    enemy,
    { health: investigator.health, armor: investigator.armor, stamina: investigator.stamina },
    { health: enemy.health, armor: enemy.armor },
    sanityDeck.length,
    sanityDeck.length,
    0,
    enemyIntentValue,
    enemyIntentType
  );
  candidateSequences.push({ cards: [], score: baseScore, killsEnemy: false });

  // 遞迴窮舉當前回合的所有合法出牌排列
  function searchPermutations(
    currentInv: Investigator,
    currentEnemy: Enemy,
    currentHand: Card[],
    currentSanityDeck: Card[],
    currentDiscard: Card[],
    currentExhaust: Card[],
    currentSequence: Card[],
    cardsPlayed: number,
    depth: number
  ) {
    // 防止極端無限迴圈抽牌（單回合出牌上限 8 張）
    if (depth >= 8) return;

    for (let i = 0; i < currentHand.length; i++) {
      const card = currentHand[i];

      const playContext: CardPlayContext = {
        investigator: {
          health: currentInv.health,
          maxHealth: currentInv.maxHealth,
          stamina: currentInv.stamina,
          armor: currentInv.armor,
          statusEffects: currentInv.statusEffects ? [...currentInv.statusEffects] : [],
          occupationId: currentInv.occupationId,
        },
        enemy: {
          ...currentEnemy,
          statusEffects: currentEnemy.statusEffects ? [...currentEnemy.statusEffects] : [],
        },
        hand: currentHand,
        sanityDeck: currentSanityDeck,
        discardPile: currentDiscard,
        exhaustPile: currentExhaust,
        turn,
        isMadness: currentSanityDeck.length === 0,
        cardsPlayedThisTurn: cardsPlayed,
        randomFn,
      };

      const result = evaluateCardPlay(card, playContext);
      if (!result.success) {
        continue;
      }

      const nextSequence = [...currentSequence, card];
      const killsEnemy = result.enemy.health <= 0;

      const score = evaluateBoardStateScore(
        investigator,
        enemy,
        result.investigator,
        result.enemy,
        result.sanityDeck.length,
        sanityDeck.length,
        nextSequence.length,
        enemyIntentValue,
        enemyIntentType
      );

      candidateSequences.push({
        cards: nextSequence,
        score,
        killsEnemy,
      });

      // 若已擊殺敵怪，不必繼續浪費資源出牌
      if (killsEnemy) {
        continue;
      }

      // 下一深度遞迴
      const nextInv: Investigator = {
        ...currentInv,
        health: result.investigator.health,
        armor: result.investigator.armor,
        stamina: result.investigator.stamina,
        statusEffects: result.investigator.statusEffects,
      };
      const nextEnemy: Enemy = {
        ...currentEnemy,
        health: result.enemy.health,
        armor: result.enemy.armor,
        statusEffects: result.enemy.statusEffects,
      };

      searchPermutations(
        nextInv,
        nextEnemy,
        result.hand,
        result.sanityDeck,
        result.discardPile,
        result.exhaustPile ?? [],
        nextSequence,
        cardsPlayed + 1,
        depth + 1
      );
    }
  }

  searchPermutations(
    investigator,
    enemy,
    hand,
    sanityDeck,
    discardPile,
    exhaustPile,
    [],
    0,
    0
  );

  // 排序候選序列（按啟發式得分由高至低）
  candidateSequences.sort((a, b) => b.score - a.score);

  if (candidateSequences.length === 0) {
    return [];
  }

  // 1. 最優模式 (Optimal Policy - 測量上限)
  if (policyMode === 'optimal') {
    return candidateSequences[0].cards;
  }

  // 2. 容錯模式 (Fault-Tolerant Policy - 注入次優抉擇噪音)
  // 35% 機率選擇次優或亂序路徑，若有斬殺序列則保留 80% 把握斬殺
  const roll = randomFn();
  const bestIsKill = candidateSequences[0].killsEnemy;

  if (bestIsKill && roll > 0.20) {
    return candidateSequences[0].cards;
  }

  if (roll < 0.35 && candidateSequences.length > 1) {
    // 選取中游次優序列（非最優但仍是合法出牌）
    const pickIdx = Math.min(
      candidateSequences.length - 1,
      Math.floor(randomFn() * Math.min(candidateSequences.length, 3)) + 1
    );
    return candidateSequences[pickIdx].cards;
  }

  return candidateSequences[0].cards;
}
