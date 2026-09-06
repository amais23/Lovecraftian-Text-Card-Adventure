import type { Card, Enemy, EnemyIntent, GameAction, GameState, Investigator } from '../types/game';
import { INITIAL_DECK, INITIAL_GHOUL, INITIAL_INVESTIGATOR } from './initialData';

export const BASELINE_HAND_SIZE = 4;

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
  const newArmor = target.armor - absorbed;
  const newHealth = Math.max(0, target.health - effectiveDamage);

  return {
    newHealth,
    newArmor,
    absorbed,
    effectiveDamage,
  };
}

export function createInitialCombatState(
  customEnemy?: Enemy,
  customDeck?: Card[],
  customInvestigator?: Investigator
): GameState {
  const investigator: Investigator = customInvestigator
    ? { ...customInvestigator }
    : { ...INITIAL_INVESTIGATOR };

  const enemy: Enemy = customEnemy
    ? JSON.parse(JSON.stringify(customEnemy))
    : JSON.parse(JSON.stringify(INITIAL_GHOUL));

  const allCards: Card[] = customDeck
    ? [...customDeck]
    : INITIAL_DECK.map((c) => ({ ...c }));

  // Draw BASELINE_HAND_SIZE cards to hand, remaining cards stay in sanityDeck
  const initialHand = allCards.slice(0, BASELINE_HAND_SIZE);
  const remainingSanityDeck = allCards.slice(BASELINE_HAND_SIZE);

  return {
    phase: 'combat',
    turn: 1,
    investigator,
    sanityDeck: remainingSanityDeck,
    hand: initialHand,
    discardPile: [],
    isMadness: remainingSanityDeck.length === 0,
    currentEnemy: enemy,
    battleLog: [
      `遭遇 ${enemy.name}（${enemy.title}）！惡臭與潮濕的黑暗籠罩四周，你握緊武器展開搏殺……`,
    ],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_COMBAT': {
      return createInitialCombatState(
        action.payload?.enemy,
        action.payload?.initialCards
      );
    }

    case 'RESET_COMBAT': {
      return createInitialCombatState();
    }

    case 'PLAY_CARD': {
      if (state.phase !== 'combat') return state;

      const cardIndex = state.hand.findIndex((c) => c.id === action.payload.cardId);
      if (cardIndex === -1) return state;

      const card = state.hand[cardIndex];

      // Check cost
      if (card.costType === 'stamina' && state.investigator.stamina < card.costValue) {
        return {
          ...state,
          battleLog: [`精力不足！打出【${card.name}】需要 ${card.costValue} 點精力。`, ...state.battleLog],
        };
      }

      if (card.costType === 'sanity' && state.sanityDeck.length < card.costValue) {
        return {
          ...state,
          battleLog: [`理智不足！此禁忌秘術需要燃燒 ${card.costValue} 點理智。`, ...state.battleLog],
        };
      }

      // Deduct resource
      const newStamina =
        card.costType === 'stamina'
          ? state.investigator.stamina - card.costValue
          : state.investigator.stamina;

      let newSanityDeck = [...state.sanityDeck];
      // Keep existing discard pile separate to ensure restore_sanity only restores past discards
      const pastDiscardPile = [...state.discardPile];
      const newHand = state.hand.filter((_, idx) => idx !== cardIndex);

      if (card.costType === 'sanity') {
        const burned = newSanityDeck.slice(0, card.costValue);
        newSanityDeck = newSanityDeck.slice(card.costValue);
        pastDiscardPile.push(...burned);
      }

      let enemyHealth = state.currentEnemy.health;
      let enemyArmor = state.currentEnemy.armor;
      let investigatorHealth = state.investigator.health;
      let investigatorArmor = state.investigator.armor;
      const newLogs: string[] = [];

      // Execute card effects
      for (const effect of card.effects) {
        if (effect.type === 'damage') {
          const dmg = applyDamage({ health: enemyHealth, armor: enemyArmor }, effect.value);
          enemyHealth = dmg.newHealth;
          enemyArmor = dmg.newArmor;
          newLogs.push(`調查員打出【${card.name}】，對 ${state.currentEnemy.name} 造成 ${effect.value} 點物理傷害！`);
        } else if (effect.type === 'armor') {
          investigatorArmor += effect.value;
          newLogs.push(`調查員打出【${card.name}】，構築掩體獲得 ${effect.value} 點護甲！`);
        } else if (effect.type === 'heal') {
          investigatorHealth = Math.min(state.investigator.maxHealth, investigatorHealth + effect.value);
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
        }
      }

      // Now add the played card itself to the discard pile
      const finalDiscardPile = [...pastDiscardPile, card];

      // Check Victory
      const isVictory = enemyHealth <= 0;
      if (isVictory) {
        newLogs.unshift(`【戰鬥勝利】${state.currentEnemy.name} 發出臨死的淒厲悲鳴，化為一灘腥臭的黑水消滅了！`);
      }

      return {
        ...state,
        phase: isVictory ? 'victory' : state.phase,
        investigator: {
          ...state.investigator,
          stamina: newStamina,
          health: investigatorHealth,
          armor: investigatorArmor,
        },
        sanityDeck: newSanityDeck,
        hand: newHand,
        discardPile: finalDiscardPile,
        isMadness: newSanityDeck.length === 0,
        currentEnemy: {
          ...state.currentEnemy,
          health: enemyHealth,
          armor: enemyArmor,
        },
        battleLog: [...newLogs, ...state.battleLog],
      };
    }

    case 'END_TURN': {
      if (state.phase !== 'combat') return state;

      const enemy = state.currentEnemy;
      const intent = enemy.currentIntent;
      let investigatorHealth = state.investigator.health;
      let investigatorArmor = state.investigator.armor;
      let sanityDeck = [...state.sanityDeck];
      const discardPile = [...state.discardPile];
      const newLogs: string[] = [];

      // Enemy performs intent action
      if (intent.type === 'attack') {
        const dmg = applyDamage({ health: investigatorHealth, armor: investigatorArmor }, intent.value);
        investigatorHealth = dmg.newHealth;
        investigatorArmor = dmg.newArmor;

        if (dmg.absorbed > 0) {
          newLogs.push(`護甲替你抵擋了 ${dmg.absorbed} 點傷害（剩餘護甲: ${investigatorArmor}）。`);
        }
        if (dmg.effectiveDamage > 0) {
          newLogs.push(`${enemy.name} 施展【${intent.name}】，鋒利的爪牙重創了你，造成 ${dmg.effectiveDamage} 點肉體傷害！`);
        } else {
          newLogs.push(`${enemy.name} 施展【${intent.name}】，但被你的厚重護甲完全抵擋！`);
        }
      } else if (intent.type === 'erode') {
        const erodeCount = Math.min(sanityDeck.length, intent.value);
        if (erodeCount > 0) {
          const eroded = sanityDeck.slice(0, erodeCount);
          sanityDeck = sanityDeck.slice(erodeCount);
          discardPile.push(...eroded);
          newLogs.push(`${enemy.name} 施展精神恐懼，侵蝕了你 ${erodeCount} 點理智牌庫！`);
        } else {
          newLogs.push(`${enemy.name} 施展精神恐懼，但你的心智已徹底陷入瘋狂崩潰，無更多理智可被侵蝕！`);
        }
      }

      // Check GameOver
      if (investigatorHealth <= 0) {
        newLogs.unshift(`【調查員殞命】你的視線被血污模糊，氣力散盡倒在血泊中……未知之物將你吞噬。`);
        return {
          ...state,
          phase: 'gameover',
          investigator: {
            ...state.investigator,
            health: 0,
            armor: investigatorArmor,
          },
          battleLog: [...newLogs, ...state.battleLog],
        };
      }

      // Advance enemy intent sequence
      let nextIntentIndex = 0;
      let nextIntent: EnemyIntent = intent;
      if (enemy.intentSequence && enemy.intentSequence.length > 0) {
        nextIntentIndex = ((enemy.currentIntentIndex ?? 0) + 1) % enemy.intentSequence.length;
        nextIntent = enemy.intentSequence[nextIntentIndex];
      }

      // Hand retention & refill to BASELINE_HAND_SIZE (Without automatic reshuffle!)
      const currentHand = [...state.hand];
      const cardsNeeded = Math.max(0, BASELINE_HAND_SIZE - currentHand.length);
      const cardsToDraw = Math.min(sanityDeck.length, cardsNeeded);
      const drawnCards = sanityDeck.slice(0, cardsToDraw);
      sanityDeck = sanityDeck.slice(cardsToDraw);
      const newHand = [...currentHand, ...drawnCards];

      const nextTurn = state.turn + 1;
      if (cardsNeeded > 0 && cardsToDraw < cardsNeeded && sanityDeck.length === 0) {
        newLogs.push(`【理智告急】理智牌庫已抽空，無法繼續抽牌！根據無自動重洗規則，棄牌堆保持不變。`);
      }
      newLogs.push(`回合結束。未打出的 ${currentHand.length} 張手牌予以保留，自理智牌庫補抽 ${drawnCards.length} 張卡牌。精力已重置回 ${state.investigator.maxStamina}。`);

      return {
        ...state,
        turn: nextTurn,
        investigator: {
          ...state.investigator,
          health: investigatorHealth,
          armor: investigatorArmor,
          stamina: state.investigator.maxStamina,
        },
        sanityDeck,
        hand: newHand,
        discardPile,
        isMadness: sanityDeck.length === 0,
        currentEnemy: {
          ...enemy,
          currentIntent: nextIntent,
          currentIntentIndex: nextIntentIndex,
        },
        battleLog: [...newLogs, ...state.battleLog],
      };
    }

    default:
      return state;
  }
}
