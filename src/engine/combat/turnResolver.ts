import type {
  Card,
  Enemy,
  Investigator,
  OccupationId,
} from '../../types/game';
import {
  INITIAL_GHOUL,
  INITIAL_INVESTIGATOR,
  OCCUPATIONS,
  fisherYatesShuffle,
} from '../initialData';
import { cloneEnemy } from '../enemyCatalog';
import { createMadnessCards, ensureUniqueCardIds } from '../cardFactory';
import { applyDamage, evaluateMadnessTransition } from '../cards/evaluator';
import { applyRelicCombatStart } from '../relics';
import { isCompleteAncientSeal } from '../abyssalSeals';
import {
  resolveEnemyAction,
  resolveTurnStartTraits,
  advanceCanonicalIntent,
} from '../enemyTraits';
import {
  addStatusEffect,
  calculateArmorGain,
  resolveTurnEndStatusEffects,
} from '../statusEffects';
import type {
  CombatInitContext,
  CombatInitResult,
  CombatTurnContext,
  CombatTurnResult,
} from './types';

export const DEFAULT_HAND_CAPACITY = 2;

/**
 * 將完整卡牌清單切分為起始手牌（預設 2 張）與理智牌庫（其餘張數）
 * 固有（innate）卡牌與完整的深淵古印必定優先抽入起手手牌
 */
export function splitDeckToHandAndSanity(
  deck: Card[],
  handSize: number = DEFAULT_HAND_CAPACITY
): { hand: Card[]; sanityDeck: Card[] } {
  const innateCards: Card[] = [];
  const normalCards: Card[] = [];

  for (const card of deck) {
    if (card.keywords?.includes('innate') || isCompleteAncientSeal(card)) {
      innateCards.push(card);
    } else {
      normalCards.push(card);
    }
  }

  const sortedDeck = [...innateCards, ...normalCards];
  return {
    hand: sortedDeck.slice(0, handSize),
    sanityDeck: sortedDeck.slice(handSize),
  };
}

/**
 * 戰鬥卡牌構建與洗牌純函式（支援洗牌覆寫以利確定性測試）
 */
export function setupCombatDeck(
  cards: Card[],
  occupationId: OccupationId = 'investigator',
  overrideDeck?: Card[],
  handCapacity: number = DEFAULT_HAND_CAPACITY
): { hand: Card[]; sanityDeck: Card[] } {
  if (overrideDeck && overrideDeck.length > 0) {
    return splitDeckToHandAndSanity(ensureUniqueCardIds(overrideDeck), handCapacity);
  }
  const permanentCards = cards.filter((c) => !c.isTemporary);
  const occ = OCCUPATIONS[occupationId] ?? OCCUPATIONS.investigator;
  const pool: Card[] = permanentCards.length > 0
    ? permanentCards
    : occ.deck.map((c) => ({ ...c }));
  const sanitizedPool = ensureUniqueCardIds(pool);
  let shuffledDeck = fisherYatesShuffle(sanitizedPool);

  const innateCards = shuffledDeck.filter((c) => c.keywords?.includes('innate') || isCompleteAncientSeal(c));
  const otherCards = shuffledDeck.filter((c) => !c.keywords?.includes('innate') && !isCompleteAncientSeal(c));
  shuffledDeck = [...innateCards, ...otherCards];

  return splitDeckToHandAndSanity(shuffledDeck, handCapacity);
}

/**
 * 初始化戰鬥會話 (Initialize Combat Session)
 * 整合遺物開局加成、起手牌庫構建、首回合敵怪特質與開場日誌
 */
export function initializeCombatSession(context: CombatInitContext): CombatInitResult {
  const occId = context.investigator?.occupationId ?? 'investigator';
  const occ = OCCUPATIONS[occId] ?? OCCUPATIONS.investigator;
  const handCapacity = context.handCapacity
    ?? context.investigator?.handCapacity
    ?? occ.stats.handCapacity
    ?? DEFAULT_HAND_CAPACITY;

  const baseInvestigator = context.investigator ?? {
    ...INITIAL_INVESTIGATOR,
    handCapacity,
  };
  const relicStart = applyRelicCombatStart(baseInvestigator, context.investigator?.stamina ?? occ.stats.stamina);
  const investigator: Investigator = {
    ...baseInvestigator,
    handCapacity,
    armor: relicStart.armor,
    stamina: relicStart.stamina,
    statusEffects: relicStart.statusEffects,
    relics: baseInvestigator.relics ? [...baseInvestigator.relics] : [],
  };

  const enemy: Enemy = context.enemy
    ? cloneEnemy(context.enemy)
    : cloneEnemy(INITIAL_GHOUL);
  if (!enemy.statusEffects) {
    enemy.statusEffects = [];
  }

  const allCards: Card[] = context.deck
    ? [...context.deck]
    : occ.deck.map((c) => ({ ...c }));

  const deckToUse = context.overrideDeck && context.overrideDeck.length > 0
    ? context.overrideDeck
    : allCards;

  const { hand, sanityDeck } = splitDeckToHandAndSanity(
    ensureUniqueCardIds(deckToUse),
    handCapacity
  );

  const startTraitRes = resolveTurnStartTraits(enemy, investigator, 0, 0);
  investigator.statusEffects = startTraitRes.investigatorStatusEffects;

  const initialLogs = [
    ...relicStart.logs,
    `遭遇 ${enemy.name}（${enemy.title}）！惡臭與潮濕的黑暗籠罩四周，你握緊武器展開搏殺……`,
    ...startTraitRes.logs,
  ];

  return {
    turn: 1,
    investigator,
    enemy,
    hand,
    sanityDeck,
    discardPile: [],
    exhaustPile: [],
    isMadness: sanityDeck.length === 0,
    logs: initialLogs,
  };
}

/**
 * 戰鬥回合結束結算純函數 (Resolve Combat Turn End)
 * 依序結算：
 * 1. 敵怪執行意圖與深淵原著特質行動
 * 2. 雙方狀態印記衰減與結算（流血、恐慌）
 * 3. 調查員殞命與敵怪伏誅判定（神性不滅下限防禦）
 * 4. 瘋狂極限狀態臨界轉換
 * 5. 下回合開始時特質觸發（恐慌、精力扣減、抽牌減少）
 * 6. 敵怪動態 AI 意圖推進
 * 7. 手牌保留更新與固定容量抽牌（瘋狂狀態缺額生成臨時黑卡）
 * 8. 精力刷新重置
 */
export function resolveCombatTurnEnd(context: CombatTurnContext): CombatTurnResult {
  const {
    enemy,
    investigator,
    turn,
    retainedHand,
    exhaustPile = [],
    initialLogs = [],
  } = context;

  const intent = enemy.currentIntent;
  let investigatorHealth = investigator.health;
  let investigatorArmor = investigator.armor;
  let enemyHealth = enemy.health;
  let enemyArmor = enemy.armor;
  let sanityDeck = [...context.sanityDeck];
  let discardPile = [...context.discardPile];
  const newLogs: string[] = [...initialLogs];

  let investigatorStatusEffects = investigator.statusEffects ? [...investigator.statusEffects] : [];
  let enemyStatusEffects = enemy.statusEffects ? [...enemy.statusEffects] : [];

  // 1. 敵怪執行意圖與原著特質行動結算
  const currentEnemyForAction: Enemy = {
    ...enemy,
    health: enemyHealth,
    armor: enemyArmor,
    statusEffects: enemyStatusEffects,
  };
  const currentInvestigatorForAction: Investigator = {
    ...investigator,
    health: investigatorHealth,
    armor: investigatorArmor,
    statusEffects: investigatorStatusEffects,
  };
  const enemyActionResult = resolveEnemyAction(
    currentEnemyForAction,
    intent,
    currentInvestigatorForAction,
    turn
  );
  newLogs.push(...enemyActionResult.logs);

  if (enemyActionResult.damageToInvestigator > 0) {
    if (
      enemyActionResult.hitCount &&
      enemyActionResult.hitCount > 1 &&
      enemyActionResult.singleHitDamage !== undefined
    ) {
      let totalAbsorbed = 0;
      let totalEffective = 0;
      for (let h = 0; h < enemyActionResult.hitCount; h++) {
        const dmg = applyDamage(
          { health: investigatorHealth, armor: investigatorArmor },
          enemyActionResult.singleHitDamage
        );
        totalAbsorbed += dmg.absorbed;
        totalEffective += dmg.effectiveDamage;
        investigatorHealth = dmg.newHealth;
        investigatorArmor = dmg.newArmor;
      }
      if (totalAbsorbed > 0) {
        newLogs.push(`護甲替你抵擋了 ${totalAbsorbed} 點傷害（剩餘護甲: ${investigatorArmor}）。`);
      }
      if (totalEffective > 0) {
        newLogs.push(
          `${enemy.name} 施展【${intent.name}】，連續狂暴撕咬 ${enemyActionResult.hitCount} 次，造成共計 ${totalEffective} 點肉體傷害！`
        );
      } else {
        newLogs.push(`${enemy.name} 施展【${intent.name}】，但連續打擊被你的厚重護甲完全抵擋！`);
      }
    } else {
      const dmg = applyDamage(
        { health: investigatorHealth, armor: investigatorArmor },
        enemyActionResult.damageToInvestigator
      );
      investigatorHealth = dmg.newHealth;
      investigatorArmor = dmg.newArmor;

      if (dmg.absorbed > 0) {
        newLogs.push(`護甲替你抵擋了 ${dmg.absorbed} 點傷害（剩餘護甲: ${investigatorArmor}）。`);
      }
      if (dmg.effectiveDamage > 0) {
        newLogs.push(
          `${enemy.name} 施展【${intent.name}】，鋒利的爪牙重創了你，造成 ${dmg.effectiveDamage} 點肉體傷害！`
        );
      } else {
        newLogs.push(`${enemy.name} 施展【${intent.name}】，但被你的厚重護甲完全抵擋！`);
      }
    }
  }

  if (enemyActionResult.healToEnemy > 0) {
    enemyHealth = Math.min(enemy.maxHealth, enemyHealth + enemyActionResult.healToEnemy);
  }

  if (enemyActionResult.armorGainToEnemy > 0) {
    const finalArmor = calculateArmorGain(enemyActionResult.armorGainToEnemy, enemyStatusEffects);
    enemyArmor += finalArmor;
    if (intent.type === 'defend') {
      newLogs.push(`${enemy.name} 施展【${intent.name}】，凝聚異質防護獲得 ${finalArmor} 點護甲！`);
    }
  }

  if (enemyActionResult.erodeToInvestigator > 0) {
    const erodeCount = Math.min(sanityDeck.length, enemyActionResult.erodeToInvestigator);
    if (erodeCount > 0) {
      const eroded = sanityDeck.slice(0, erodeCount);
      sanityDeck = sanityDeck.slice(erodeCount);
      discardPile.push(...eroded);
      newLogs.push(`${enemy.name} 施展精神恐懼，侵蝕了你 ${erodeCount} 點理智牌庫！`);
    } else {
      newLogs.push(`${enemy.name} 施展精神恐懼，但你的心智已徹底陷入瘋狂崩潰，無更多理智可被侵蝕！`);
    }
  }

  const statusesToApply = enemyActionResult.statusesToInvestigator ?? (
    enemyActionResult.statusToInvestigator ? [enemyActionResult.statusToInvestigator] : []
  );
  for (const status of statusesToApply) {
    investigatorStatusEffects = addStatusEffect(investigatorStatusEffects, status);
    newLogs.push(
      `${enemy.name} 施展【${intent.name}】，向你施加了 ${status.stacks} 層【${status.name}】印記！`
    );
  }

  if (enemyActionResult.armorLossToEnemy && enemyActionResult.armorLossToEnemy > 0) {
    enemyArmor = Math.max(0, enemyArmor - enemyActionResult.armorLossToEnemy);
  }

  if (enemyActionResult.madnessCardsToDeck && enemyActionResult.madnessCardsToDeck.length > 0) {
    sanityDeck = [...sanityDeck, ...enemyActionResult.madnessCardsToDeck];
  }

  if (enemyActionResult.selfDamageToEnemy && enemyActionResult.selfDamageToEnemy > 0) {
    const isDivineEnemy = Boolean(enemy.divineImmortality);
    enemyHealth = Math.max(isDivineEnemy ? 1 : 0, enemyHealth - enemyActionResult.selfDamageToEnemy);
  }

  // 2. 結算回合結束狀態印記（流血生命扣減、恐慌理智侵蝕）與印記衰減
  const invStatusRes = resolveTurnEndStatusEffects(
    { health: investigatorHealth, sanityDeck, discardPile },
    investigatorStatusEffects,
    '調查員'
  );
  investigatorHealth = invStatusRes.newHealth;
  sanityDeck = invStatusRes.newSanityDeck;
  discardPile = invStatusRes.newDiscardPile;
  investigatorStatusEffects = invStatusRes.decayedEffects;
  newLogs.push(...invStatusRes.logs);

  const enemyStatusRes = resolveTurnEndStatusEffects(
    { health: enemyHealth },
    enemyStatusEffects,
    enemy.name
  );
  enemyHealth = enemyStatusRes.newHealth;
  const isDivineEnemy = Boolean(enemy.divineImmortality);
  if (isDivineEnemy && enemyHealth < 1) {
    enemyHealth = 1;
  }
  enemyStatusEffects = enemyStatusRes.decayedEffects;
  newLogs.push(...enemyStatusRes.logs);

  // 3. 終局勝負判定
  if (investigatorHealth <= 0) {
    newLogs.unshift(`【調查員殞命】你的視線被血污模糊，神識散盡倒在血泊中……未知之物將你吞噬。`);
    return {
      outcome: 'defeat',
      turn,
      investigator: {
        ...investigator,
        health: 0,
        armor: investigatorArmor,
        statusEffects: [],
      },
      enemy: {
        ...enemy,
        health: enemyHealth,
        armor: enemyArmor,
        statusEffects: enemyStatusEffects,
      },
      hand: retainedHand,
      sanityDeck,
      discardPile,
      exhaustPile,
      isMadness: context.isMadness,
      logs: newLogs,
      drawnCardsCount: 0,
    };
  }

  if (enemyHealth <= 0) {
    newLogs.unshift(`【戰鬥勝利】${enemy.name} 在流血與創傷中發出臨死哀嚎，化為一灘黑水消滅了！`);
    return {
      outcome: 'victory',
      turn,
      investigator: {
        ...investigator,
        health: investigatorHealth,
        armor: investigatorArmor,
        statusEffects: [],
      },
      enemy: {
        ...enemy,
        health: 0,
        armor: enemyArmor,
        statusEffects: [],
      },
      hand: retainedHand,
      sanityDeck,
      discardPile,
      exhaustPile,
      isMadness: context.isMadness,
      logs: newLogs,
      drawnCardsCount: 0,
    };
  }

  // 4. 瘋狂狀態判定
  const madnessEval = evaluateMadnessTransition(context.isMadness, sanityDeck.length);
  let isMadnessNow = madnessEval.isMadness;
  if (madnessEval.logMessage) {
    newLogs.push(madnessEval.logMessage);
  }

  // 5. 結算下回合開始時原著特質（水下寒骨施加恐慌、腐泥少抽牌、溺水扣精力）
  const startTraitRes = resolveTurnStartTraits(
    enemy,
    { ...investigator, statusEffects: investigatorStatusEffects },
    enemyActionResult.nextTurnReducedDraw ?? 0,
    enemyActionResult.nextTurnDrainedStamina ?? 0
  );
  newLogs.push(...startTraitRes.logs);
  investigatorStatusEffects = startTraitRes.investigatorStatusEffects;
  const reducedDraw = startTraitRes.reducedDrawCount;
  const drainedStamina = startTraitRes.drainedStaminaCount;

  // 6. 推進敵怪動態意圖序列
  const nextTurn = turn + 1;
  const currentEnemyForNextIntent: Enemy = {
    ...enemy,
    health: enemyHealth,
    armor: enemyArmor,
    statusEffects: enemyStatusEffects,
  };
  const { nextIntent, nextIntentIndex, newShoggothStance } = advanceCanonicalIntent(
    currentEnemyForNextIntent,
    nextTurn
  );

  // 7. 固定抽牌與手牌保留更新
  const baseCapacity = investigator.handCapacity ?? context.handCapacity ?? DEFAULT_HAND_CAPACITY;
  const capacity = Math.max(1, baseCapacity - reducedDraw);

  const updatedRemainingHand: Card[] = retainedHand.map((c) => ({
    ...c,
    retainedTurns: (c.retainedTurns ?? 0) + 1,
  }));
  let newHand: Card[] = [...updatedRemainingHand];
  let drawnCardsCount = 0;

  if (isMadnessNow) {
    const existingTurnMadnessCount = [
      ...updatedRemainingHand,
      ...sanityDeck,
      ...discardPile,
    ].filter((c) => c.id.startsWith(`temp_madness_t${nextTurn}_`)).length;
    const madnessCards = createMadnessCards(capacity, nextTurn, existingTurnMadnessCount);
    newHand = [...updatedRemainingHand, ...madnessCards];
    drawnCardsCount = capacity;
    newLogs.push(`【瘋狂抽牌】處於瘋狂狀態！深淵力量轉化為 ${capacity} 張臨時黑色瘋狂卡！`);
  } else {
    const cardsToDraw = Math.min(sanityDeck.length, capacity);
    const drawnCards = sanityDeck.slice(0, cardsToDraw);
    sanityDeck = sanityDeck.slice(cardsToDraw);
    newHand = [...updatedRemainingHand, ...drawnCards];
    drawnCardsCount = cardsToDraw;

    if (cardsToDraw < capacity && sanityDeck.length === 0) {
      isMadnessNow = true;
      const deficit = capacity - cardsToDraw;
      const existingTurnMadnessCount = [
        ...newHand,
        ...sanityDeck,
        ...discardPile,
      ].filter((c) => c.id.startsWith(`temp_madness_t${nextTurn}_`)).length;
      const madnessCards = createMadnessCards(deficit, nextTurn, existingTurnMadnessCount);
      newHand = [...newHand, ...madnessCards];
      drawnCardsCount += deficit;
      newLogs.push(
        `【理智告急】理智牌庫已抽空！調查員進入「瘋狂狀態」，手牌缺額立即補入 ${deficit} 張臨時黑色瘋狂卡！`
      );
    } else if (sanityDeck.length === 0 && !isMadnessNow) {
      isMadnessNow = true;
      newLogs.push(`【理智告急】理智牌庫已抽空！調查員進入「瘋狂狀態」！`);
    }
  }

  // 8. 精力重置
  const actualStamina = Math.max(0, investigator.maxStamina - drainedStamina);
  newLogs.push(
    `回合結束。未打出的 ${retainedHand.length} 張手牌予以保留，固定抽取 ${drawnCardsCount} 張卡牌。精力已重置回 ${actualStamina}。`
  );

  return {
    outcome: 'ongoing',
    turn: nextTurn,
    investigator: {
      ...investigator,
      health: investigatorHealth,
      armor: investigatorArmor,
      stamina: actualStamina,
      statusEffects: investigatorStatusEffects,
    },
    enemy: {
      ...enemy,
      health: enemyHealth,
      armor: enemyArmor,
      currentIntent: nextIntent,
      currentIntentIndex: nextIntentIndex,
      shoggothStance: newShoggothStance ?? enemy.shoggothStance,
      statusEffects: enemyStatusEffects,
    },
    hand: ensureUniqueCardIds(newHand),
    sanityDeck: ensureUniqueCardIds(sanityDeck),
    discardPile,
    exhaustPile,
    isMadness: isMadnessNow,
    logs: newLogs,
    drawnCardsCount,
  };
}
