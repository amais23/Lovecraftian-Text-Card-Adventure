import type { Card, Investigator } from '../../types/game';
import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  ABYSSAL_FRAGMENT_3,
  hasBothAbyssalFragments,
  fuseAbyssalFragments,
  ensureUniqueCardIds,
} from '../abyssalSeals';
import { generateRewardCardsForDepth } from '../cardTiers';
import { fisherYatesShuffle } from '../initialData';
import { splitDeckToHandAndSanity, DEFAULT_HAND_CAPACITY } from '../combat';
import { advanceMapAfterNode } from '../mapGenerator';
import type {
  CombatRewardContext,
  CombatRewardResult,
  SurvivalChoice,
  SurvivalSettlementContext,
  SurvivalSettlementResult,
} from './types';

/**
 * 戰鬥勝利獎勵生成引擎 (ADR-0030)
 * 包含古金幣、卡牌戰利品生成，以及第 3 深度首領擊破時之深淵古印共鳴融合
 */
export function generateCombatReward(context: CombatRewardContext): CombatRewardResult {
  const isBossFight = context.currentNodeType === 'boss';
  const isElite = context.currentNodeType === 'elite';
  const currentDepth = context.currentDepth;
  const occupationId = context.occupationId ?? 'investigator';

  // 第 3 深度首領戰勝：持有前兩枚殘片時，三枚殘片共鳴融合為白色真相卡「完整的深淵古印」並解鎖第四深度獎勵
  if (currentDepth === 3 && isBossFight && hasBothAbyssalFragments(context.currentCards)) {
    const permanentCards = context.currentCards.filter((c) => !c.isTemporary);
    const withFrag3 = [...permanentCards, { ...ABYSSAL_FRAGMENT_3 }];
    const { newDeck } = fuseAbyssalFragments(withFrag3);
    const rewardCards =
      context.overrideCards ??
      generateRewardCardsForDepth(3, true, 3, Math.random, occupationId);
    const rewardObols = context.overrideObols ?? 50;

    return {
      rewardCards,
      rewardObols,
      abyssalSealFused: true,
      updatedDeck: newDeck,
      logs: [
        '【白色真理共鳴】第三深度原生巨型修格斯崩解！三枚深淵封印殘片劇烈震顫、光芒大盛，融合為至高真理【完整的深淵古印】！通往第四深度的虛空裂隙已然開闢！',
        `戰鬥結算：獲得 ${rewardObols} 古金幣！請挑選 1 張專屬第四階構築卡牌或跳過以精簡牌庫。`,
      ],
    };
  }

  const baseObols = isBossFight ? 50 : isElite ? 25 : 15;
  const rewardObols = context.overrideObols ?? baseObols;
  const rewardCards =
    context.overrideCards ??
    generateRewardCardsForDepth(currentDepth, isBossFight, 3, Math.random, occupationId);

  return {
    rewardCards,
    rewardObols,
    logs: [
      `戰鬥結算：獲得 ${rewardObols} 古金幣！請挑選 1 張卡牌構築獎勵或選擇跳過以精簡牌庫。`,
    ],
  };
}

/**
 * 戰後生存結算深層模組 (ADR-0030)
 * 統一處理卡牌構築/戰地包紮/封印殘片抉擇、首領全額復甦、理智牌庫重組、深度過渡與普通/真結局判定
 */
export function resolveSurvivalSettlement(
  choice: SurvivalChoice,
  context: SurvivalSettlementContext
): SurvivalSettlementResult {
  const currentPermanentCards = ensureUniqueCardIds(
    context.currentCards.filter((c) => !c.isTemporary)
  );
  const isBossFight = context.currentNodeType === 'boss';
  const currentDepth = context.currentDepth;
  const handCapacity = context.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;

  let draftedCard: Card | undefined;
  let addedObols = context.rewardObols ?? 15;
  const newPermanentDeck = [...currentPermanentCards];
  const newLogs: string[] = [];

  if (choice.type === 'card') {
    if (choice.card) {
      draftedCard = {
        ...choice.card,
        id: `${choice.card.id}_drafted_${currentPermanentCards.length + 1}`,
        isTemporary: false,
      };
    } else if (choice.cardId) {
      draftedCard = {
        id: `${choice.cardId}_drafted_${currentPermanentCards.length + 1}`,
        name: '構築卡牌',
        costType: 'stamina',
        costValue: 1,
        category: 'combat',
        description: '獲得卡牌',
        flavorText: '',
        effects: [],
        isTemporary: false,
      };
    }
    if (draftedCard) {
      newPermanentDeck.push(draftedCard);
      newLogs.push(`獲得一般卡【${draftedCard.name}】納入理智牌庫！`);
    } else {
      newLogs.push(`跳過卡牌構築獎勵，維持牌庫精簡。`);
    }
  } else if (choice.type === 'field_dressing') {
    newLogs.push(`跳過卡牌構築獎勵，執行【戰地包紮】處理傷勢。`);
  } else if (choice.type === 'abyssal_seal') {
    addedObols = 0; // 承受封印殘片時放棄古金幣獎勵
    const fragmentCard: Card = currentDepth === 1
      ? { ...ABYSSAL_FRAGMENT_1 }
      : { ...ABYSSAL_FRAGMENT_2 };
    newPermanentDeck.push(fragmentCard);
    newLogs.push(
      `【承受深淵封印】調查員放棄常規構築獎勵與古金幣，自首領殘骸中拾取【${fragmentCard.name}】！漆黑詛咒烙印在理智深處。`
    );
  } else if (choice.type === 'skip') {
    newLogs.push(`跳過卡牌構築獎勵，維持牌庫精簡。`);
  }

  // 1. 生命值計算：首領戰全額回滿；戰地包紮恢復 3~4 點；其餘保留傷勢
  const isHealingToFull = Boolean(isBossFight);
  let nextHealth = context.investigator.health;
  if (isHealingToFull) {
    nextHealth = context.investigator.maxHealth;
    newLogs.push(
      `【首領決戰復甦】古老宿敵伏誅，威壓短暫退散。調查員身體生命值全額恢復至上限（${context.investigator.maxHealth} / ${context.investigator.maxHealth}）！`
    );
  } else if (choice.type === 'field_dressing') {
    const healAmount = choice.healAmount ?? 4;
    nextHealth = Math.min(context.investigator.maxHealth, context.investigator.health + healAmount);
    const actualHealed = nextHealth - context.investigator.health;
    newLogs.push(
      `【戰地應急包紮】放棄卡牌構築，專注縫合撕裂傷勢。身體生命值恢復 +${actualHealed} 點（當前生命值: ${nextHealth} / ${context.investigator.maxHealth}）。`
    );
  } else {
    newLogs.push(`【肉體傷勢保留】當前生命值: ${nextHealth} / ${context.investigator.maxHealth}。`);
  }

  // 2. 古金幣結算
  const nextObols = context.investigator.obols + addedObols;
  if (addedObols > 0) {
    newLogs.push(`獲得古金幣 +${addedObols}（當前擁有: ${nextObols} 枚）。`);
  }

  // 3. 理智牌庫全額重組洗牌與固定起手抽牌分割
  const resetDeck = context.shuffledDeck
    ? [...context.shuffledDeck]
    : fisherYatesShuffle(newPermanentDeck);
  const { hand, sanityDeck } = splitDeckToHandAndSanity(resetDeck, handCapacity);
  newLogs.push(
    `戰後重整：所有一般卡洗回理智牌庫，理智回滿至 ${newPermanentDeck.length} 點。戰鬥臨時卡已消散。`
  );

  // 4. 章節與結局推進 (Depth Progression & Endings)
  const updatedMap = advanceMapAfterNode(context.map);
  const isFinalBoss = isBossFight && currentDepth >= 4;
  let nextPhase: 'map' | 'depth_transition' | 'combat' = context.map ? 'map' : 'combat';
  let clearFallenRecord = false;
  let isTrueEnding = Boolean(isFinalBoss);

  if (isBossFight && context.map) {
    if (currentDepth === 3 && !context.abyssalSealFused) {
      // 第 3 深度擊敗原生修格斯但未湊齊兩枚殘片 -> 普通結局
      nextPhase = 'map';
      if (updatedMap) updatedMap.isCompleted = true;
      clearFallenRecord = true;
    } else if (!isFinalBoss) {
      // 第 1、2 深度或第 3 深度已融合古印 -> 進入深度過渡演出
      nextPhase = 'depth_transition';
    }
  }

  if (isFinalBoss) {
    clearFallenRecord = true;
  }

  const updatedInvestigator: Investigator = {
    ...context.investigator,
    health: nextHealth,
    armor: 0,
    stamina: context.investigator.maxStamina,
    obols: nextObols,
  };

  return {
    investigator: updatedInvestigator,
    sanityDeck,
    hand,
    discardPile: [],
    isMadness: false,
    map: updatedMap,
    nextPhase,
    isTrueEnding,
    clearFallenRecord,
    logs: newLogs,
    addedObols,
  };
}
