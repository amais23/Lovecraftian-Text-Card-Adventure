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
  cleanseDebuffs,
} from '../statusEffects';
import {
  createMadnessCards,
  createTruthInjectedCards,
} from '../cardFactory';
import { hasTrait, interceptEnemyDamage } from '../enemyTraits';
import { fisherYatesShuffle } from '../shuffleUtils';

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
  damageAmount: number,
  piercing: boolean = false
): DamageResult {
  if (piercing) {
    const effectiveDamage = damageAmount;
    const newHealth = Math.max(0, target.health - effectiveDamage);
    return {
      newHealth,
      newArmor: target.armor,
      absorbed: 0,
      effectiveDamage,
    };
  }

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
    exhaustPile: context.exhaustPile ? [...context.exhaustPile] : [],
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
  let newStamina =
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
  const newLogs: string[] = context.skipLogs ? ({ push: () => 0, unshift: () => 0, length: 0 } as unknown as string[]) : [];

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
    // 條件判定
    let conditionMatched = true;
    let conditionDesc = '';
    if (effect.condition) {
      const cond = effect.condition;
      conditionMatched = false;
      if (cond.type === 'low_sanity') {
        const threshold = cond.threshold ?? 4;
        conditionMatched = newSanityDeck.length <= threshold;
        if (conditionMatched) {
          conditionDesc = cond.multiplier
            ? `瀕死狂亂增傷 ×${cond.multiplier}`
            : `低理智爆發 +${cond.bonusValue ?? 0}`;
        }
      } else if (cond.type === 'low_health') {
        const thresholdRatio = cond.threshold ?? 0.5;
        // 若在生命值無上限模擬模式下（初始生命 >= 1000），以標準 25 點生命損失作為判定基準（損失超過 12.5 點視為低生命）
        if (investigator.maxHealth >= 1000) {
          const effectiveDamageTaken = investigator.maxHealth - investigatorHealth;
          conditionMatched = effectiveDamageTaken >= 25 * (1 - thresholdRatio);
        } else {
          conditionMatched = (investigatorHealth / investigator.maxHealth) <= thresholdRatio;
        }
        if (conditionMatched) {
          conditionDesc = `殘血絕地求生`;
        }
      } else if (cond.type === 'target_has_status') {
        const sType = cond.statusType ?? 'vulnerable';
        const stacks = getStatusStacks(enemyStatusEffects, sType);
        conditionMatched = stacks > 0;
        if (conditionMatched) {
          conditionDesc = cond.multiplier
            ? `破綻狙擊翻倍 ×${cond.multiplier}`
            : `目標帶有【${sType}】+${cond.bonusValue ?? 0}`;
        }
      } else if (cond.type === 'enemy_intent_is_attack') {
        conditionMatched = enemy.currentIntent?.type === 'attack';
        if (conditionMatched) {
          conditionDesc = `破勢敵怪攻擊意圖`;
        }
      } else if (cond.type === 'first_card_played') {
        conditionMatched = (context.cardsPlayedThisTurn ?? 0) === 0;
        if (conditionMatched) {
          conditionDesc = `先手拔槍把握先機`;
        }
      } else if (cond.type === 'investigator_has_armor') {
        conditionMatched = investigatorArmor > 0;
        if (conditionMatched) {
          conditionDesc = `固守陣地連鎖`;
        }
      }

      // 非傷害類效果若未滿足條件，直接跳過執行
      if (effect.type !== 'damage' && !conditionMatched) {
        continue;
      }
    }

    if (effect.type === 'damage') {
      let baseVal = effect.value;

      if (effect.condition && conditionMatched) {
        if (effect.condition.multiplier) {
          baseVal = Math.floor(baseVal * effect.condition.multiplier);
        }
        if (effect.condition.bonusValue) {
          baseVal += effect.condition.bonusValue;
        }
      }

      // 2. 動態數值縮放 (Dynamic Scaling)
      let dynamicBonus = 0;
      let scalingDesc = '';
      if (effect.scaleFrom === 'armor') {
        const mult = effect.scaleMultiplier ?? 1.0;
        dynamicBonus = Math.floor(investigatorArmor * mult);
        if (dynamicBonus > 0) {
          scalingDesc = `護甲加成 +${dynamicBonus}`;
        }
      } else if (effect.scaleFrom === 'sanity_inverse') {
        const missingSanity = Math.max(0, 10 - newSanityDeck.length);
        const mult = effect.scaleMultiplier ?? 1.0;
        dynamicBonus = Math.floor(missingSanity * mult);
        if (dynamicBonus > 0) {
          scalingDesc = `心智虧蝕加成 +${dynamicBonus}`;
        }
      } else if (effect.scaleFrom === 'status_stacks') {
        const mult = effect.scaleMultiplier ?? 2.0;
        if (effect.scaleStatusType) {
          const stacks = getStatusStacks(enemyStatusEffects, effect.scaleStatusType);
          dynamicBonus = Math.floor(stacks * mult);
          if (dynamicBonus > 0) {
            scalingDesc = `【${effect.scaleStatusType}】加成 +${dynamicBonus}`;
          }
        } else {
          const bleed = getStatusStacks(enemyStatusEffects, 'bleed');
          const horror = getStatusStacks(enemyStatusEffects, 'horror');
          const totalStacks = bleed + horror;
          dynamicBonus = Math.floor(totalStacks * mult);
          if (dynamicBonus > 0) {
            scalingDesc = `印記共鳴加成 +${dynamicBonus}`;
          }
        }
      }

      const singleHitBase = baseVal + dynamicBonus;
      const hitCount = Math.max(1, effect.hitCount ?? 1);
      const isPiercing = Boolean(effect.piercing);

      const hitDamages: number[] = [];
      let totalEffectiveDamage = 0;

      for (let h = 0; h < hitCount; h++) {
        const singleHitFinal = calculateAttackDamage(singleHitBase, investigatorStatusEffects, enemyStatusEffects);

        // 敵怪特質攔截結算 (如滑膩黏液免輕傷、非歐流體反彈、Tekeli-li 蓄力增傷、狂熱血契疊力量)
        const currentEnemySnapshot = {
          ...enemy,
          health: enemyHealth,
          armor: enemyArmor,
          statusEffects: enemyStatusEffects,
        };
        const interceptRes = interceptEnemyDamage(currentEnemySnapshot, singleHitFinal, isPiercing, card.category);
        if (interceptRes.logs.length > 0) {
          newLogs.push(...interceptRes.logs);
        }
        if (interceptRes.reflectedDamageToInvestigator > 0) {
          investigatorHealth = Math.max(0, investigatorHealth - interceptRes.reflectedDamageToInvestigator);
        }
        enemyStatusEffects = interceptRes.newEnemyStatusEffects;
        if (interceptRes.statusToInvestigator) {
          investigatorStatusEffects = addStatusEffect(
            investigatorStatusEffects,
            interceptRes.statusToInvestigator
          );
        }

        const effectiveDmgAmount = interceptRes.modifiedDamage;
        hitDamages.push(effectiveDmgAmount);
        const dmg = applyDamage({ health: enemyHealth, armor: enemyArmor }, effectiveDmgAmount, isPiercing);

        if (isDivineEnemy && !isAncientSeal && dmg.newHealth < 1) {
          enemyHealth = 1;
          enemyArmor = dmg.newArmor;
        } else {
          enemyHealth = dmg.newHealth;
          enemyArmor = dmg.newArmor;
        }
        totalEffectiveDamage += dmg.effectiveDamage;
      }

      if (isDivineEnemy && !isAncientSeal && enemyHealth === 1 && totalEffectiveDamage >= enemy.health) {
        newLogs.push(
          `調查員打出【${card.name}】，對 ${enemy.name} 造成打擊！但【神性不朽】抵禦了致命傷，生命值被鎖定在 1 點！唯有【完整的深淵古印】方能將其終極封滅！`
        );
      } else {
        const mightBonus = getStatusStacks(investigatorStatusEffects, 'might');
        const vulnBonus = getStatusStacks(enemyStatusEffects, 'vulnerable');
        const parts: string[] = [];
        if (mightBonus > 0) parts.push(`力量 +${mightBonus}`);
        if (vulnBonus > 0) parts.push(`易傷增傷`);
        if (conditionDesc) parts.push(conditionDesc);
        if (scalingDesc) parts.push(scalingDesc);
        if (isPiercing) parts.push(`真實穿刺無視護甲`);
        const bonusDesc = parts.length > 0 ? `（${parts.join('，')}）` : '';

        if (hitCount > 1) {
          const totalDmg = hitDamages.reduce((a, b) => a + b, 0);
          newLogs.push(`調查員打出【${card.name}】，對 ${enemy.name} 發動 ${hitCount} 連擊，造成總計 ${totalDmg} 點傷害${bonusDesc}！`);
        } else {
          newLogs.push(`調查員打出【${card.name}】，對 ${enemy.name} 造成 ${hitDamages[0]} 點傷害${bonusDesc}！`);
        }
      }
    } else if (effect.type === 'armor') {
      let finalArmor = calculateArmorGain(effect.value, investigatorStatusEffects);
      if (card.keywords?.includes('charge_growth')) {
        const retainBonus = Math.min(6, (card.retainedTurns ?? 0) * 2);
        finalArmor += retainBonus;
        if (retainBonus > 0) {
          newLogs.push(`【工事加固】掩體經耐心理智留存加固，額外獲得 ${retainBonus} 點護甲！`);
        }
      }
      investigatorArmor += finalArmor;
      const resilienceBonus = getStatusStacks(investigatorStatusEffects, 'resilience');
      const bonusDesc = resilienceBonus > 0 ? `（堅韌 +${resilienceBonus}）` : '';
      newLogs.push(`調查員打出【${card.name}】，構築掩體獲得 ${finalArmor} 點護甲${bonusDesc}！`);
    } else if (effect.type === 'break_armor') {
      const broken = enemyArmor;
      enemyArmor = 0;
      newLogs.push(`調查員打出【${card.name}】，重擊完全擊碎了 ${enemy.name} 的全部 ${broken} 點護甲！`);
    } else if (effect.type === 'lose_armor') {
      const lost = Math.min(investigatorArmor, effect.value);
      investigatorArmor = Math.max(0, investigatorArmor - effect.value);
      newLogs.push(`【強烈後座力】打出【${card.name}】後自身失去了 ${lost} 點護甲！`);
    } else if (effect.type === 'cleanse_debuffs') {
      const { cleansedEffects, removedDebuffs } = cleanseDebuffs(investigatorStatusEffects, effect.value || 1);
      investigatorStatusEffects = cleansedEffects;
      if (removedDebuffs.length > 0) {
        newLogs.push(`調查員打出【${card.name}】，淨化自身負面狀態：${removedDebuffs.join('、')}！`);
      } else {
        newLogs.push(`調查員打出【${card.name}】，調勻氣息，但身上無可淨化之負面印記。`);
      }
    } else if (effect.type === 'gain_stamina') {
      const maxStam = investigator.maxStamina ?? 3;
      const gained = Math.min(maxStam - newStamina, effect.value);
      newStamina = Math.min(maxStam, newStamina + effect.value);
      newLogs.push(`調查員打出【${card.name}】，敏銳把握先機，返還 ${gained} 點精力！`);
    } else if (effect.type === 'apply_status' && effect.statusType) {
      if (effect.target === 'enemy' && hasTrait(enemy, 'amorphous_body') && (effect.statusType === 'bleed' || effect.statusType === 'vulnerable')) {
        newLogs.push(`【非歐流體】${enemy.name} 為非歐幾里得原生質，完全免疫【${effect.statusType}】印記！`);
      } else {
        const status = createStatusEffect(effect.statusType, effect.value);
        if (effect.target === 'enemy') {
          enemyStatusEffects = addStatusEffect(enemyStatusEffects, status);
          newLogs.push(`調查員打出【${card.name}】，向 ${enemy.name} 施加了 ${effect.value} 層【${status.name}】印記！`);
        } else {
          investigatorStatusEffects = addStatusEffect(investigatorStatusEffects, status);
          newLogs.push(`調查員打出【${card.name}】，為自身賦予了 ${effect.value} 層【${status.name}】印記！`);
        }
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
        newSanityDeck.push(...restoredCards);
        newSanityDeck = fisherYatesShuffle(newSanityDeck, context.randomFn);
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
      newSanityDeck.push(...injectedCards);
      newSanityDeck = fisherYatesShuffle(newSanityDeck, context.randomFn);
      newLogs.push(`調查員打出【${card.name}】，向理智牌庫注入了 ${effect.value} 張深淵真相卡牌！`);
    }
  }

  // 卡牌生命週期：消耗卡移入消耗堆、臨時卡消散不入棄牌堆、一般卡入棄牌堆
  const isExhaust = Boolean(card.keywords?.includes('exhaust'));
  const currentExhaustPile = context.exhaustPile ? [...context.exhaustPile] : [];
  let finalExhaustPile = currentExhaustPile;
  let finalDiscardPile = pastDiscardPile;

  if (isExhaust) {
    finalExhaustPile = [...currentExhaustPile, card];
    newLogs.push(`【卡牌消耗】打出【${card.name}】後，該卡牌化為飛灰移入消耗堆！`);
  } else if (!card.isTemporary) {
    finalDiscardPile = [...pastDiscardPile, card];
  }

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
    exhaustPile: finalExhaustPile,
    logs: Array.isArray(newLogs) ? newLogs : [],
    isMadness: isMadnessNow,
    combatOutcome,
    isTrueEnding,
  };
}
