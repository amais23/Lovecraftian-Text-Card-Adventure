import type { Card } from '../../types/game';
import type { CardPlayContext, CardPlayResult } from './types';
import {
  isAbyssalFragment,
  isCompleteAncientSeal,
  isAncientSealLocked,
  isAncientSealUnlocked,
} from '../abyssalSeals';
import {
  calculateAttackDamage,
  calculateArmorGain,
  createStatusEffect,
  addStatusEffect,
  getStatusStacks,
} from '../statusEffects';
import {
  createMadnessCards,
  createTruthInjectedCards,
} from '../cardFactory';

export interface DamageResult {
  newHealth: number;
  newArmor: number;
  absorbed: number;
  effectiveDamage: number;
}

/**
 * 集中計算物理傷害與護甲吸收之共用純函式
 */
export function applyDamage(
  target: { health: number; armor: number },
  damageAmount: number
): DamageResult {
  const absorbed = Math.min(target.armor, damageAmount);
  const effectiveDamage = damageAmount - absorbed;
  const newArmor = Math.max(0, target.armor - absorbed);
  const newHealth = Math.max(0, target.health - effectiveDamage);

  return {
    newHealth,
    newArmor,
    absorbed,
    effectiveDamage,
  };
}

/**
 * 集中評估理智牌庫與瘋狂狀態切換之共用純函式
 */
export function evaluateMadnessTransition(
  wasMadness: boolean,
  sanityDeckLength: number
): { isMadness: boolean; logMessage?: string } {
  if (wasMadness && sanityDeckLength > 0) {
    return {
      isMadness: false,
      logMessage: '【心智平復】理智牌庫已回補卡牌，心智平復解除瘋狂狀態，調查員恢復清醒。',
    };
  }
  if (!wasMadness && sanityDeckLength === 0) {
    return {
      isMadness: true,
      logMessage: '【理智歸零】理智牌庫徹底抽空！調查員進入「瘋狂狀態」！',
    };
  }
  return { isMadness: wasMadness };
}

/**
 * 純函數卡牌打出效果解析引擎 (CardEvaluator)
 * 接受卡牌與當前戰況快照，回傳結算後的各項數值變化、牌庫狀態、戰鬥日誌與勝敗結果
 */
export function evaluateCardPlay(
  card: Card,
  context: CardPlayContext
): CardPlayResult {
  const { investigator, enemy, hand, sanityDeck, discardPile, turn, isMadness } = context;
  const isAncientSeal = isCompleteAncientSeal(card);
  const isDivineEnemy = Boolean(enemy.divineImmortality);

  const baseResult: CardPlayResult = {
    success: false,
    investigator: {
      health: investigator.health,
      armor: investigator.armor,
      stamina: investigator.stamina,
      statusEffects: investigator.statusEffects ? [...investigator.statusEffects] : [],
    },
    enemy: {
      health: enemy.health,
      armor: enemy.armor,
      statusEffects: enemy.statusEffects ? [...enemy.statusEffects] : [],
    },
    hand: [...hand],
    sanityDeck: [...sanityDeck],
    discardPile: [...discardPile],
    logs: [],
    isMadness,
    combatOutcome: 'none',
  };

  // 1. 守門：無法打出之卡牌 (如深淵殘片)
  if (card.isUnplayable) {
    const logMsg = isAbyssalFragment(card)
      ? `【${card.name}】是深淵封印殘片，無法被打出！它沉重地佔據著手牌。`
      : `【${card.name}】無法被打出！它沉重地佔據著手牌。`;
    return {
      ...baseResult,
      logs: [logMsg],
    };
  }

  // 2. 守門：神性敵人未削弱至 1 點血量前，古印鎖定無法引動
  if (isAncientSealLocked(card, enemy)) {
    return {
      ...baseResult,
      logs: [
        `【古印封印中】${enemy.name} 的深淵神性威壓依然磅礡，生命值尚未削弱至 1 點極限！【完整的深淵古印】無法引動！`,
      ],
    };
  }

  // 3. 守門：精力不足
  if (card.costType === 'stamina' && investigator.stamina < card.costValue) {
    return {
      ...baseResult,
      logs: [`精力不足！打出【${card.name}】需要 ${card.costValue} 點精力。`],
    };
  }

  // 4. 守門：理智不足
  if (card.costType === 'sanity' && sanityDeck.length < card.costValue) {
    return {
      ...baseResult,
      logs: [`理智不足！此禁忌秘術需要燃燒 ${card.costValue} 點理智。`],
    };
  }

  // 扣除精力資源
  const newStamina =
    card.costType === 'stamina'
      ? investigator.stamina - card.costValue
      : investigator.stamina;

  let newSanityDeck = [...sanityDeck];
  const pastDiscardPile = [...discardPile];
  const cardIdx = hand.findIndex((c) => c.id === card.id);
  let newHand = [...hand];
  if (cardIdx !== -1) {
    newHand.splice(cardIdx, 1);
  }

  // 扣除理智資源（燃燒牌庫頂牌置入棄牌堆）
  if (card.costType === 'sanity') {
    const burned = newSanityDeck.slice(0, card.costValue);
    newSanityDeck = newSanityDeck.slice(card.costValue);
    pastDiscardPile.push(...burned);
  }

  let enemyHealth = enemy.health;
  let enemyArmor = enemy.armor;
  let investigatorHealth = investigator.health;
  let investigatorArmor = investigator.armor;
  let investigatorStatusEffects = investigator.statusEffects ? [...investigator.statusEffects] : [];
  let enemyStatusEffects = enemy.statusEffects ? [...enemy.statusEffects] : [];
  const newLogs: string[] = [];

  // 古印神性斬殺：鎖血怪在 1 點生命值時受到古印引動
  if (isAncientSealUnlocked(card, enemy)) {
    enemyHealth = 0;
    enemyArmor = 0;
    newLogs.push(
      `【太古星辰封滅】調查員高舉【${card.name}】！崇高熾白的星穹真理光芒撕裂深淵，${enemy.name} 在淒厲的太古哀嚎中灰飛煙滅，舊日支配者的意志被永遠放逐！`
    );
  }

  // 執行原子卡牌效果
  for (const effect of card.effects) {
    if (effect.type === 'damage') {
      const finalDamage = calculateAttackDamage(effect.value, investigatorStatusEffects, enemyStatusEffects);
      const dmg = applyDamage({ health: enemyHealth, armor: enemyArmor }, finalDamage);
      if (isDivineEnemy && !isAncientSeal && dmg.newHealth < 1) {
        // Divine Immortality locks health at minimum 1
        enemyHealth = 1;
        enemyArmor = dmg.newArmor;
        newLogs.push(
          `調查員打出【${card.name}】，對 ${enemy.name} 造成打擊！但【神性不朽】抵禦了致命傷，生命值被鎖定在 1 點！唯有【完整的深淵古印】方能將其終極封滅！`
        );
      } else {
        enemyHealth = dmg.newHealth;
        enemyArmor = dmg.newArmor;
        const mightBonus = getStatusStacks(investigatorStatusEffects, 'might');
        const vulnBonus = getStatusStacks(enemyStatusEffects, 'vulnerable');
        let bonusDesc = '';
        if (mightBonus > 0 || vulnBonus > 0) {
          const parts: string[] = [];
          if (mightBonus > 0) parts.push(`力量 +${mightBonus}`);
          if (vulnBonus > 0) parts.push(`易傷增傷`);
          bonusDesc = `（${parts.join('，')}）`;
        }
        newLogs.push(`調查員打出【${card.name}】，對 ${enemy.name} 造成 ${finalDamage} 點傷害${bonusDesc}！`);
      }
    } else if (effect.type === 'armor') {
      const finalArmor = calculateArmorGain(effect.value, investigatorStatusEffects);
      investigatorArmor += finalArmor;
      const resilienceBonus = getStatusStacks(investigatorStatusEffects, 'resilience');
      const bonusDesc = resilienceBonus > 0 ? `（堅韌 +${resilienceBonus}）` : '';
      newLogs.push(`調查員打出【${card.name}】，構築掩體獲得 ${finalArmor} 點護甲${bonusDesc}！`);
    } else if (effect.type === 'apply_status' && effect.statusType) {
      const status = createStatusEffect(effect.statusType, effect.value);
      if (effect.target === 'enemy') {
        enemyStatusEffects = addStatusEffect(enemyStatusEffects, status);
        newLogs.push(`調查員打出【${card.name}】，向 ${enemy.name} 施加了 ${effect.value} 層【${status.name}】印記！`);
      } else {
        investigatorStatusEffects = addStatusEffect(investigatorStatusEffects, status);
        newLogs.push(`調查員打出【${card.name}】，為自身賦予了 ${effect.value} 層【${status.name}】印記！`);
      }
    } else if (effect.type === 'draw') {
      const cardsNeeded = effect.value;
      if (cardsNeeded > 0) {
        if (isMadness || newSanityDeck.length === 0) {
          const existingTurnMadnessCount = [
            ...newHand,
            ...newSanityDeck,
            ...pastDiscardPile,
          ].filter((c) => c.id.startsWith(`temp_madness_t${turn}_`)).length;
          const madnessCards = createMadnessCards(cardsNeeded, turn, existingTurnMadnessCount);
          newHand = [...newHand, ...madnessCards];
          newLogs.push(`調查員打出【${card.name}】，在瘋狂狀態中自深淵攫取了 ${cardsNeeded} 張臨時黑色瘋狂卡！`);
        } else {
          const cardsToDraw = Math.min(newSanityDeck.length, cardsNeeded);
          const drawnCards = newSanityDeck.slice(0, cardsToDraw);
          newSanityDeck = newSanityDeck.slice(cardsToDraw);
          newHand = [...newHand, ...drawnCards];
          const cardNames = drawnCards.map((c) => `【${c.name}】`).join('、');
          newLogs.push(`調查員打出【${card.name}】，敏銳抽牌獲得 ${cardNames}！`);

          if (cardsToDraw < cardsNeeded && newSanityDeck.length === 0) {
            const deficit = cardsNeeded - cardsToDraw;
            const existingTurnMadnessCount = [
              ...newHand,
              ...newSanityDeck,
              ...pastDiscardPile,
            ].filter((c) => c.id.startsWith(`temp_madness_t${turn}_`)).length;
            const madnessCards = createMadnessCards(deficit, turn, existingTurnMadnessCount);
            newHand = [...newHand, ...madnessCards];
            newLogs.push(`【理智抽乾】抽牌庫見底！手牌缺額補入 ${deficit} 張臨時黑色瘋狂卡！`);
          }
        }
      }
    } else if (effect.type === 'heal') {
      investigatorHealth = Math.min(investigator.maxHealth, investigatorHealth + effect.value);
      newLogs.push(`調查員打出【${card.name}】，包紮傷口恢復 ${effect.value} 點生命！`);
    } else if (effect.type === 'restore_sanity') {
      const restoreCount = Math.min(pastDiscardPile.length, effect.value);
      if (restoreCount > 0) {
        const restoredCards: Card[] = [];
        for (let i = 0; i < restoreCount; i++) {
          const cardToRestore = pastDiscardPile.pop();
          if (cardToRestore) {
            restoredCards.push(cardToRestore);
          }
        }
        newSanityDeck.unshift(...restoredCards);
        const cardNames = restoredCards.map((c) => `【${c.name}】`).join('、');
        newLogs.push(`調查員打出【${card.name}】，平復焦躁的心智，將 ${cardNames} 洗回理智牌庫！`);
      } else {
        newLogs.push(`調查員打出【${card.name}】，但棄牌堆中尚無任何已棄卡牌可供洗回！`);
      }
    } else if (effect.type === 'erode_sanity') {
      const erodeCount = Math.min(newSanityDeck.length, effect.value);
      if (erodeCount > 0) {
        const eroded = newSanityDeck.slice(0, erodeCount);
        newSanityDeck = newSanityDeck.slice(erodeCount);
        pastDiscardPile.push(...eroded);
        newLogs.push(`受到理智侵蝕，自牌庫頂棄置了 ${erodeCount} 張卡牌！`);
      }
    } else if (effect.type === 'self_damage') {
      investigatorHealth = Math.max(0, investigatorHealth - effect.value);
      newLogs.push(`受到不可名狀的反噬傷害，自身損失 ${effect.value} 點肉體生命！`);
    } else if (effect.type === 'add_to_deck') {
      const existingTurnTruthCount = [
        ...newSanityDeck,
        ...newHand,
        ...pastDiscardPile,
      ].filter((c) => c.id.startsWith(`temp_truth_t${turn}_`)).length;
      const injectedCards = createTruthInjectedCards(effect.value, turn, existingTurnTruthCount);
      newSanityDeck.unshift(...injectedCards);
      newLogs.push(`調查員打出【${card.name}】，向理智牌庫注入了 ${effect.value} 張深淵真相卡牌！`);
    }
  }

  // 卡牌生命週期：臨時卡消散不入棄牌堆，一般卡入棄牌堆
  const finalDiscardPile = card.isTemporary ? [...pastDiscardPile] : [...pastDiscardPile, card];

  // 評估瘋狂狀態轉移
  const madnessEval = evaluateMadnessTransition(isMadness, newSanityDeck.length);
  const isMadnessNow = madnessEval.isMadness;
  if (madnessEval.logMessage) {
    newLogs.push(madnessEval.logMessage);
  }

  // 判定勝敗
  let combatOutcome: 'victory' | 'defeat' | 'none' = 'none';
  let isTrueEnding = false;

  if (investigatorHealth <= 0) {
    combatOutcome = 'defeat';
    investigatorStatusEffects = [];
    newLogs.unshift(`【調查員殞命】不可名狀的反噬耗盡了你最後一絲氣息，你倒在血泊中……`);
  } else if (enemyHealth <= 0) {
    combatOutcome = 'victory';
    investigatorStatusEffects = [];
    enemyStatusEffects = [];
    if (isAncientSeal && isDivineEnemy) {
      isTrueEnding = true;
      newLogs.unshift(`【達成真結局】群星歸位終告破滅，調查員以凡人之軀拯救了世界！`);
    } else {
      newLogs.unshift(`【戰鬥勝利】${enemy.name} 發出臨死的淒厲悲鳴，化為一灘腥臭的黑水消滅了！`);
    }
  }

  return {
    success: true,
    investigator: {
      health: investigatorHealth,
      armor: investigatorArmor,
      stamina: newStamina,
      statusEffects: investigatorStatusEffects,
    },
    enemy: {
      health: enemyHealth,
      armor: enemyArmor,
      statusEffects: enemyStatusEffects,
    },
    hand: newHand,
    sanityDeck: newSanityDeck,
    discardPile: finalDiscardPile,
    logs: newLogs,
    isMadness: isMadnessNow,
    combatOutcome,
    isTrueEnding,
  };
}
