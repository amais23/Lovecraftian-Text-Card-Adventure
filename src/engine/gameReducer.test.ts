import { describe, it, expect } from 'vitest';
import {
  gameReducer,
  createInitialCombatState,
  createInitialGameState,
  applyDamage,
  cloneEnemy,
  setupCombatDeck,
  advanceMapAfterNode,
} from './gameReducer';
import {
  INITIAL_GHOUL,
  INITIAL_INVESTIGATOR,
  OCCUPATIONS,
  INVESTIGATOR_DECK,
  OCCULTIST_DECK,
  REWARD_CARD_POOL,
  fisherYatesShuffle,
} from './initialData';
import {
  generateInvestigationMap,
  generateProceduralInvestigationMap,
  BASE_MAP_TEMPLATE,
} from './mapGenerator';
import {
  MYTHOS_EVENTS,
  generateDefaultMarketItems,
  generateMarketItemsForDepth,
  INITIAL_DEEP_ONE,
  INITIAL_SHOGGOTH,
  INITIAL_DAGON_PRIEST,
  INITIAL_COLOSSAL_SHOGGOTH,
  INITIAL_STAR_SPAWN,
  getBossByDepth,
} from './eventData';
import { TIER_4_EXCLUSIVE_CARDS } from './cardTiers';
import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  COMPLETE_ANCIENT_SEAL,
  hasBothAbyssalFragments,
  getAllPermanentCards,
} from './abyssalSeals';
import type { Card, GameState, Enemy } from '../types/game';

function createMockCard(overrides?: Partial<Card>): Card {
  return {
    id: overrides?.id ?? `mock_card_${Math.random().toString(36).substring(2, 9)}`,
    name: overrides?.name ?? '測試卡牌',
    category: overrides?.category ?? 'combat',
    costType: overrides?.costType ?? 'stamina',
    costValue: overrides?.costValue ?? 1,
    isTemporary: overrides?.isTemporary ?? false,
    effects: overrides?.effects ?? [],
    description: overrides?.description ?? '測試描述',
    flavorText: overrides?.flavorText ?? '測試短文',
    ...overrides,
  };
}

describe('Game State Reducer (Combat Vertical Slice)', () => {
  it('initializes combat with investigator, ghoul enemy, and 4 drawn cards', () => {
    const initialState = createInitialCombatState();

    expect(initialState.phase).toBe('combat');
    expect(initialState.turn).toBe(1);
    expect(initialState.investigator.health).toBe(25);
    expect(initialState.investigator.stamina).toBe(3);
    expect(initialState.investigator.armor).toBe(0);

    // Initial 12 cards: 4 drawn into hand, 8 remaining in sanityDeck (ADR-0007: 10~12 cards)
    expect(initialState.hand.length).toBe(4);
    expect(initialState.sanityDeck.length).toBe(8);
    expect(initialState.discardPile.length).toBe(0);

    // Enemy
    expect(initialState.currentEnemy.name).toContain('食屍鬼');
    expect(initialState.currentEnemy.health).toBe(30);
    expect(initialState.currentEnemy.currentIntent.type).toBe('attack');
    expect(initialState.currentEnemy.currentIntent.value).toBe(6);

    expect(initialState.battleLog.length).toBeGreaterThan(0);
  });

  it('plays a red combat card to deal damage and consume stamina', () => {
    const state = createInitialCombatState();
    const combatCard = state.hand.find((c) => c.category === 'combat' && c.costValue === 1);
    expect(combatCard).toBeDefined();

    if (!combatCard) return;

    const damageEffect = combatCard.effects.find((e) => e.type === 'damage');
    const expectedDamage = damageEffect ? damageEffect.value : 0;
    const initialEnemyHealth = state.currentEnemy.health;

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: combatCard.id },
    });

    // Stamina consumed
    expect(nextState.investigator.stamina).toBe(2);

    // Card moved from hand to discard pile
    expect(nextState.hand.some((c) => c.id === combatCard.id)).toBe(false);
    expect(nextState.discardPile.some((c) => c.id === combatCard.id)).toBe(true);

    // Enemy took damage
    expect(nextState.currentEnemy.health).toBe(initialEnemyHealth - expectedDamage);

    // Battle log updated
    expect(nextState.battleLog[0]).toContain(combatCard.name);
  });

  it('rejects playing a card if investigator has insufficient stamina', () => {
    let state = createInitialCombatState();
    // Force stamina to 0
    state = {
      ...state,
      investigator: {
        ...state.investigator,
        stamina: 0,
      },
    };

    const card = state.hand[0];
    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: card.id },
    });

    // Hand and stamina unchanged
    expect(nextState.investigator.stamina).toBe(0);
    expect(nextState.hand.length).toBe(state.hand.length);
    expect(nextState.currentEnemy.health).toBe(state.currentEnemy.health);
  });

  it('gains cumulative armor when playing a defense skill card', () => {
    const defenseCard: Card = {
      id: 'test_def',
      name: '堅固防禦',
      category: 'skill',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'armor', value: 7 }],
      description: '獲得 7 點護甲。',
      flavorText: '防禦',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [defenseCard],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        stamina: 3,
        armor: 3,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: defenseCard.id },
    });

    // Cumulative armor: 3 + 7 = 10
    expect(nextState.investigator.armor).toBe(10);
    expect(nextState.investigator.stamina).toBe(2);
  });

  it('triggers victory when enemy health reaches 0 or below', () => {
    const lethalCard: Card = {
      id: 'test_lethal',
      name: '致命一擊',
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'damage', value: 50 }],
      description: '造成 50 點傷害。',
      flavorText: '終結',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [lethalCard],
      currentEnemy: {
        ...INITIAL_GHOUL,
        health: 10,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: lethalCard.id },
    });

    expect(nextState.currentEnemy.health).toBe(0);
    expect(nextState.phase).toBe('victory');
    expect(nextState.battleLog[0]).toContain('消滅');
  });

  it('preserves unplayed cards (Hand Retention) and refills up to 4 on turn end', () => {
    const state = createInitialCombatState();
    // Play 1 card, leaving 3 in hand
    const cardToPlay = state.hand[0];
    const stateAfterPlay = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: cardToPlay.id },
    });
    expect(stateAfterPlay.hand.length).toBe(3);

    const retainedCardIds = stateAfterPlay.hand.map((c) => c.id);

    // End turn
    const stateAfterTurn = gameReducer(stateAfterPlay, { type: 'END_TURN' });

    // The 3 retained cards should still be in hand
    retainedCardIds.forEach((id) => {
      expect(stateAfterTurn.hand.some((c) => c.id === id)).toBe(true);
    });

    // Refilled to 4 cards total (3 retained + 1 drawn)
    expect(stateAfterTurn.hand.length).toBe(4);

    // Investigator stamina refreshed to max (3)
    expect(stateAfterTurn.investigator.stamina).toBe(3);

    // Turn counter advanced
    expect(stateAfterTurn.turn).toBe(2);
  });

  it('resolves enemy attack with armor absorption on turn end', () => {
    const state: GameState = {
      ...createInitialCombatState(),
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 25,
        armor: 4,
      },
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'attack',
          value: 6,
          name: '腐臭爪擊',
          description: '攻擊 6 點',
        },
      },
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    // Enemy dealt 6 damage: 4 absorbed by armor, 2 damage to health
    expect(nextState.investigator.armor).toBe(0);
    expect(nextState.investigator.health).toBe(23);
  });

  it('triggers gameover when investigator health reaches 0 from enemy attack', () => {
    const state: GameState = {
      ...createInitialCombatState(),
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 4,
        armor: 0,
      },
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'attack',
          value: 6,
          name: '腐臭爪擊',
          description: '攻擊 6 點',
        },
      },
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    expect(nextState.investigator.health).toBe(0);
    expect(nextState.phase).toBe('gameover');
    expect(nextState.battleLog[0]).toContain('倒在血泊中');
  });

  it('restores previous discard without self-cycling the card currently being played', () => {
    const previousDiscardCard: Card = {
      id: 'old_revolver',
      name: '舊左輪',
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'damage', value: 6 }],
      description: '舊卡',
      flavorText: '舊卡',
    };

    const breatheCard: Card = {
      id: 'test_breathe',
      name: '深呼吸',
      category: 'skill',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'restore_sanity', value: 1 }],
      description: '回補理智',
      flavorText: '心智',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [breatheCard],
      discardPile: [previousDiscardCard],
      sanityDeck: [],
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: breatheCard.id },
    });

    // The restored card in sanityDeck must be old_revolver, NOT the breatheCard itself!
    expect(nextState.sanityDeck.length).toBe(1);
    expect(nextState.sanityDeck[0].id).toBe('old_revolver');

    // The breathe card should be in the discard pile
    expect(nextState.discardPile.length).toBe(1);
    expect(nextState.discardPile[0].id).toBe('test_breathe');
  });

  it('correctly calculates damage and armor absorption with applyDamage', () => {
    // Case 1: Armor absorbs part of damage
    const res1 = applyDamage({ health: 20, armor: 4 }, 6);
    expect(res1.absorbed).toBe(4);
    expect(res1.effectiveDamage).toBe(2);
    expect(res1.newArmor).toBe(0);
    expect(res1.newHealth).toBe(18);

    // Case 2: Armor absorbs all damage
    const res2 = applyDamage({ health: 20, armor: 8 }, 5);
    expect(res2.absorbed).toBe(5);
    expect(res2.effectiveDamage).toBe(0);
    expect(res2.newArmor).toBe(3);
    expect(res2.newHealth).toBe(20);

    // Case 3: Lethal overkill
    const res3 = applyDamage({ health: 5, armor: 0 }, 15);
    expect(res3.effectiveDamage).toBe(15);
    expect(res3.newHealth).toBe(0);
  });

  it('erodes sanity deck directly when enemy executes mental dread erode intent', () => {
    // Fill hand with 4 cards so that turn end refill does not draw additional cards
    const initialHand = [createMockCard(), createMockCard(), createMockCard(), createMockCard()];
    const initialDeck = [createMockCard(), createMockCard(), createMockCard(), createMockCard(), createMockCard()];

    const state: GameState = {
      ...createInitialCombatState(),
      hand: initialHand,
      sanityDeck: initialDeck,
      discardPile: [],
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'erode',
          value: 2,
          name: '恐懼嘶吼',
          description: '侵蝕 2 點理智',
        },
      },
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 25,
        armor: 0,
      },
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    // Direct assertions on deck and discard pile lengths
    expect(nextState.sanityDeck.length).toBe(3); // 5 - 2 = 3
    expect(nextState.discardPile.length).toBe(2); // 0 + 2 = 2
    expect(nextState.investigator.health).toBe(25);
    expect(nextState.battleLog.some((log) => log.includes('侵蝕了你 2 點理智牌庫'))).toBe(true);
  });

  it('handles zero sanity erosion gracefully with breakdown narrative', () => {
    const state: GameState = {
      ...createInitialCombatState(),
      sanityDeck: [],
      hand: [createMockCard(), createMockCard(), createMockCard(), createMockCard()],
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'erode',
          value: 2,
          name: '恐懼嘶吼',
          description: '侵蝕 2 點理智',
        },
      },
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });
    expect(nextState.sanityDeck.length).toBe(0);
    expect(nextState.battleLog.some((log) => log.includes('無更多理智可被侵蝕'))).toBe(true);
  });

  it('cancels automatic reshuffle when sanity deck is empty and triggers madness state', () => {
    const discardCard1 = createMockCard({ id: 'c1' });
    const discardCard2 = createMockCard({ id: 'c2' });

    const state: GameState = {
      ...createInitialCombatState(),
      sanityDeck: [], // Completely empty sanity deck
      hand: [discardCard1], // Only 1 card in hand (needs 3 to reach 4)
      discardPile: [discardCard2],
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'attack',
          value: 0,
          name: '觀察',
          description: '無動作',
        },
      },
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    // No automatic reshuffle: discardPile remains in discardPile, sanityDeck stays 0
    expect(nextState.sanityDeck.length).toBe(0);
    expect(nextState.isMadness).toBe(true);
    // In madness state, hand refills to 4 using temporary black madness cards
    expect(nextState.hand.length).toBe(4);
    expect(nextState.hand.filter((c) => c.category === 'madness').length).toBe(3);
    expect(nextState.discardPile.length).toBe(1);
    expect(nextState.battleLog.some((log) => log.includes('瘋狂'))).toBe(true);
  });

  it('restores multiple cards with Sedative (restore_sanity: 2) from discard pile', () => {
    const discard1 = createMockCard({ id: 'd1' });
    const discard2 = createMockCard({ id: 'd2' });
    const discard3 = createMockCard({ id: 'd3' });

    const sedativeCard: Card = {
      id: 'sedative_test',
      name: '醫療鎮定劑',
      category: 'skill',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'restore_sanity', value: 2 }],
      description: '回補 2 點理智',
      flavorText: '鎮定',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [sedativeCard],
      discardPile: [discard1, discard2, discard3],
      sanityDeck: [],
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: sedativeCard.id },
    });

    // 2 cards restored to sanityDeck
    expect(nextState.sanityDeck.length).toBe(2);
    // Discard pile had 3, 2 restored, and sedativeCard was added => 1 + 1 = 2 cards remaining
    expect(nextState.discardPile.length).toBe(2);
    expect(nextState.discardPile.some((c) => c.id === 'sedative_test')).toBe(true);
  });

  it('accumulates armor across multiple turns without resetting to zero', () => {
    const defenseCard: Card = {
      id: 'def_test',
      name: '掩蔽防禦',
      category: 'skill',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'armor', value: 5 }],
      description: '護甲 +5',
      flavorText: '防禦',
    };

    let state: GameState = {
      ...createInitialCombatState(),
      hand: [defenseCard, defenseCard],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        armor: 0,
        stamina: 3,
      },
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'erode',
          value: 1,
          name: '凝視',
          description: '不造成物理傷害',
        },
      },
    };

    // Play 1st defense card: armor becomes 5
    state = gameReducer(state, { type: 'PLAY_CARD', payload: { cardId: defenseCard.id } });
    expect(state.investigator.armor).toBe(5);

    // End Turn: enemy does erode (no physical damage), armor must NOT reset!
    state = gameReducer(state, { type: 'END_TURN' });
    expect(state.investigator.armor).toBe(5);

    // Play 2nd defense card in turn 2: armor becomes 10 (cumulative!)
    state = gameReducer(state, { type: 'PLAY_CARD', payload: { cardId: defenseCard.id } });
    expect(state.investigator.armor).toBe(10);
  });

  it('triggers madness state automatically when sanity deck reaches 0 and investigator does not die', () => {
    const state: GameState = {
      ...createInitialCombatState(),
      sanityDeck: [createMockCard()], // 1 card left in sanityDeck
      hand: [createMockCard(), createMockCard(), createMockCard(), createMockCard()],
      isMadness: false,
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'erode',
          value: 1,
          name: '狂亂凝視',
          description: '侵蝕 1 點理智',
        },
      },
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    expect(nextState.sanityDeck.length).toBe(0);
    expect(nextState.isMadness).toBe(true);
    expect(nextState.phase).toBe('combat'); // Still fighting, not gameover!
    expect(nextState.battleLog.some((log) => log.includes('瘋狂'))).toBe(true);
  });

  it('generates temporary black madness cards when drawing in madness state', () => {
    const state: GameState = {
      ...createInitialCombatState(),
      sanityDeck: [],
      hand: [createMockCard({ id: 'retained_1' })], // 1 retained card, needs 3 cards to reach 4
      isMadness: true,
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'attack',
          value: 0,
          name: '觀察',
          description: '無動作',
        },
      },
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    // Refilled to 4 cards total
    expect(nextState.hand.length).toBe(4);
    // 3 new cards must all be temporary black madness cards
    const newlyDrawnCards = nextState.hand.filter((c) => c.id !== 'retained_1');
    expect(newlyDrawnCards.length).toBe(3);
    newlyDrawnCards.forEach((c) => {
      expect(c.category).toBe('madness');
      expect(c.isTemporary).toBe(true);
    });
    expect(nextState.battleLog.some((log) => log.includes('瘋狂') || log.includes('黑色瘋狂卡'))).toBe(true);
  });

  it('deals high damage and inflicts self-recoil damage when playing a black madness card', () => {
    const madnessCard: Card = {
      id: 'temp_madness_claw',
      name: '盲目爪擊',
      category: 'madness',
      costType: 'stamina',
      costValue: 1,
      isTemporary: true,
      effects: [
        { type: 'damage', value: 10 },
        { type: 'self_damage', value: 2 },
      ],
      description: '造成 10 點傷害，反噬 2 點生命。',
      flavorText: '狂亂',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [madnessCard],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 20,
        armor: 5,
        stamina: 3,
      },
      currentEnemy: {
        ...INITIAL_GHOUL,
        health: 30,
        armor: 0,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: madnessCard.id },
    });

    // Enemy took 10 damage: 30 - 10 = 20
    expect(nextState.currentEnemy.health).toBe(20);
    // Investigator took 2 self recoil damage directly to health (bypassing armor): 20 - 2 = 18
    expect(nextState.investigator.health).toBe(18);
    expect(nextState.investigator.armor).toBe(5); // Armor preserved
    expect(nextState.battleLog.some((log) => log.includes('反噬'))).toBe(true);
  });

  it('triggers gameover if self-recoil damage from black card reduces investigator health to 0', () => {
    const suicidalCard: Card = {
      id: 'temp_madness_overkill',
      name: '深淵狂嘯',
      category: 'madness',
      costType: 'stamina',
      costValue: 1,
      isTemporary: true,
      effects: [
        { type: 'damage', value: 14 },
        { type: 'self_damage', value: 5 },
      ],
      description: '造成 14 點傷害，反噬 5 點生命。',
      flavorText: '滅亡',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [suicidalCard],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 3, // Less than 5 self_damage
        armor: 0,
        stamina: 3,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: suicidalCard.id },
    });

    expect(nextState.investigator.health).toBe(0);
    expect(nextState.phase).toBe('gameover');
    expect(nextState.battleLog.some((log) => log.includes('殞命') || log.includes('反噬'))).toBe(true);
  });

  it('restores sanity deck and relieves madness state when playing white truth card', () => {
    const truthCard: Card = {
      id: 'card_truth_fragment_1',
      name: '舊日殘頁',
      category: 'truth',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [
        { type: 'self_damage', value: 2 },
        { type: 'add_to_deck', value: 2 },
      ],
      description: '承受 2 點反噬，注入 2 張卡牌至理智牌庫。',
      flavorText: '真理',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      sanityDeck: [], // Currently 0, in madness state
      isMadness: true,
      hand: [truthCard],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 20,
        stamina: 3,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: truthCard.id },
    });

    // Investigator took 2 self damage: 20 - 2 = 18
    expect(nextState.investigator.health).toBe(18);
    // Sanity deck has 2 cards added:
    expect(nextState.sanityDeck.length).toBe(2);
    expect(nextState.sanityDeck.every((c) => c.isTemporary)).toBe(true);
    // Madness state relieved!
    expect(nextState.isMadness).toBe(false);
    expect(nextState.battleLog.some((log) => log.includes('心智平復') || log.includes('清醒'))).toBe(true);
  });

  it('fills remaining hand deficit with temporary black madness cards when sanity deck empties mid-draw on turn end', () => {
    const keptCard = createMockCard({ id: 'kept_card_1', name: '保留手牌' });
    const lastDeckCard = createMockCard({ id: 'last_deck_card', name: '最後理智牌' });

    const state: GameState = {
      ...createInitialCombatState(),
      turn: 1,
      isMadness: false,
      hand: [keptCard], // Needs 3 cards to reach baseline 4
      sanityDeck: [lastDeckCard], // Only 1 card available in deck
      discardPile: [createMockCard({ id: 'discarded_1' })],
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: {
          type: 'attack',
          value: 0,
          name: '觀察',
          description: '無動作',
        },
      },
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    // Sanity deck was exhausted (1 drawn)
    expect(nextState.sanityDeck.length).toBe(0);
    // Madness state entered
    expect(nextState.isMadness).toBe(true);
    // Hand replenished to baseline 4: 1 kept + 1 normal from deck + 2 temporary black madness cards
    expect(nextState.hand.length).toBe(4);
    expect(nextState.hand[0].id).toBe('kept_card_1');
    expect(nextState.hand[1].id).toBe('last_deck_card');
    const madnessCards = nextState.hand.filter((c) => c.category === 'madness');
    expect(madnessCards.length).toBe(2);
    expect(madnessCards.every((c) => c.isTemporary)).toBe(true);
    expect(nextState.battleLog.some((log) => log.includes('手牌缺額立即補入 2 張臨時黑色瘋狂卡'))).toBe(true);
  });

  it('allows investigator in madness state to achieve victory by eliminating the enemy', () => {
    const lethalMadnessCard: Card = {
      id: 'temp_madness_finish',
      name: '盲目爪擊',
      category: 'madness',
      costType: 'stamina',
      costValue: 1,
      isTemporary: true,
      effects: [
        { type: 'damage', value: 10 },
        { type: 'self_damage', value: 1 },
      ],
      description: '斬殺',
      flavorText: '勝負',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      isMadness: true,
      sanityDeck: [],
      hand: [lethalMadnessCard],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 10,
        stamina: 3,
      },
      currentEnemy: {
        ...INITIAL_GHOUL,
        health: 8,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: lethalMadnessCard.id },
    });

    expect(nextState.currentEnemy.health).toBe(0);
    expect(nextState.phase).toBe('victory');
    expect(nextState.isMadness).toBe(true); // Remained in berserk until victory
  });

  it('initializes Edward Pierce with physical deck and 15 obols upon SELECT_OCCUPATION', () => {
    const titleState = createInitialGameState();
    expect(titleState.phase).toBe('title');

    const nextState = gameReducer(titleState, {
      type: 'SELECT_OCCUPATION',
      payload: { occupationId: 'investigator' },
    });

    expect(nextState.phase).toBe('map');
    expect(nextState.map).toBeDefined();
    expect(nextState.map?.layers.length).toBe(5);
    expect(nextState.investigator.name).toContain('Edward Pierce');
    expect(nextState.investigator.occupation).toBe('私家偵探');
    expect(nextState.investigator.health).toBe(25);
    expect(nextState.investigator.obols).toBe(15);
    expect(nextState.hand.length).toBe(4);
    expect(nextState.sanityDeck.length).toBe(8); // 12 total
    expect(nextState.hand.some((c) => c.category === 'combat')).toBe(true);
  });

  it('initializes Eleanor Vance with occultist deck and 20 obols upon SELECT_OCCUPATION', () => {
    const titleState = createInitialGameState();

    const nextState = gameReducer(titleState, {
      type: 'SELECT_OCCUPATION',
      payload: { occupationId: 'occultist' },
    });

    expect(nextState.phase).toBe('map');
    expect(nextState.map).toBeDefined();
    expect(nextState.investigator.name).toContain('Eleanor Vance');
    expect(nextState.investigator.occupation).toBe('秘術學者');
    expect(nextState.investigator.health).toBe(25);
    expect(nextState.investigator.obols).toBe(20);
    expect(nextState.hand.length).toBe(4);
    expect(nextState.sanityDeck.length).toBe(8); // 12 total
    // Eleanor's deck contains magic and truth cards
    const allCards = [...nextState.hand, ...nextState.sanityDeck];
    expect(allCards.some((c) => c.category === 'magic')).toBe(true);
    expect(allCards.some((c) => c.category === 'truth')).toBe(true);
  });

  it('plays purple magic card with costType sanity by discarding from sanity deck', () => {
    const magicCard: Card = {
      id: 'test_magic_blast',
      name: '靈能衝擊',
      category: 'magic',
      costType: 'sanity',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'damage', value: 9 }],
      description: '消耗 1 點理智造成 9 點傷害',
      flavorText: '秘術',
    };

    const sanityCard1 = createMockCard({ id: 's1' });
    const sanityCard2 = createMockCard({ id: 's2' });

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [magicCard],
      sanityDeck: [sanityCard1, sanityCard2],
      discardPile: [],
      currentEnemy: {
        ...INITIAL_GHOUL,
        health: 30,
        armor: 0,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: magicCard.id },
    });

    // 1 card discarded from sanity deck as sanity cost
    expect(nextState.sanityDeck.length).toBe(1);
    expect(nextState.currentEnemy.health).toBe(21); // 30 - 9 = 21
    // Discard pile contains the burned sanity card + the played magic card
    expect(nextState.discardPile.length).toBe(2);
    expect(nextState.battleLog.some((log) => log.includes('9 點傷害'))).toBe(true);
  });

  it('rejects purple magic card if sanity deck has insufficient cards', () => {
    const heavyMagicCard: Card = {
      id: 'test_heavy_magic',
      name: '厄運凝視',
      category: 'magic',
      costType: 'sanity',
      costValue: 3,
      isTemporary: false,
      effects: [{ type: 'damage', value: 16 }],
      description: '消耗 3 點理智造成 16 點傷害',
      flavorText: '秘術',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [heavyMagicCard],
      sanityDeck: [createMockCard({ id: 's1' })], // Only 1 card, needs 3
      currentEnemy: {
        ...INITIAL_GHOUL,
        health: 30,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: heavyMagicCard.id },
    });

    // Rejection: state unchanged, enemy unharmed
    expect(nextState.currentEnemy.health).toBe(30);
    expect(nextState.sanityDeck.length).toBe(1);
    expect(nextState.battleLog.some((log) => log.includes('理智不足'))).toBe(true);
  });

  it('executes draw card effect (Tactical Roll): gains armor and draws card from sanity deck into hand', () => {
    const tacticalRollCard: Card = {
      id: 'reward_tactical_roll_1',
      name: '戰術翻滾',
      category: 'skill',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [
        { type: 'armor', value: 4 },
        { type: 'draw', value: 1 },
      ],
      description: '敏捷閃避獲得 4 點護甲，並立即自理智牌庫抽取 1 張卡牌。',
      flavorText: '「在碎石堆中翻滾尋找下一個反擊角度。」',
    };

    const cardInSanityDeck = createMockCard({ id: 's_deck_1', name: '左輪射擊' });
    const cardInSanityDeck2 = createMockCard({ id: 's_deck_2', name: '軍刀突刺' });

    const state: GameState = {
      ...createInitialCombatState(),
      hand: [tacticalRollCard],
      sanityDeck: [cardInSanityDeck, cardInSanityDeck2],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        stamina: 3,
        armor: 0,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: tacticalRollCard.id },
    });

    // Gains 4 armor
    expect(nextState.investigator.armor).toBe(4);
    // Consumed 1 stamina
    expect(nextState.investigator.stamina).toBe(2);
    // Hand now contains the drawn card
    expect(nextState.hand.length).toBe(1);
    expect(nextState.hand[0].id).toBe('s_deck_1');
    expect(nextState.hand[0].name).toBe('左輪射擊');
    // Sanity deck decreased by 1
    expect(nextState.sanityDeck.length).toBe(1);
    expect(nextState.sanityDeck[0].id).toBe('s_deck_2');
    // Discard pile contains Tactical Roll
    expect(nextState.discardPile.length).toBe(1);
    expect(nextState.discardPile[0].id).toBe('reward_tactical_roll_1');
    // Logs verify both armor and draw messages
    expect(nextState.battleLog.some((log) => log.includes('獲得 4 點護甲'))).toBe(true);
    expect(nextState.battleLog.some((log) => log.includes('敏銳抽牌獲得 【左輪射擊】'))).toBe(true);
  });

  it('executes draw card effect during madness state: draws temporary black madness cards', () => {
    const drawCard: Card = {
      id: 'test_draw_card',
      name: '戰術抽牌',
      category: 'skill',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'draw', value: 1 }],
      description: '抽 1 張卡牌',
      flavorText: '抽牌',
    };

    const state: GameState = {
      ...createInitialCombatState(),
      isMadness: true,
      hand: [drawCard],
      sanityDeck: [],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        stamina: 3,
      },
    };

    const nextState = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: drawCard.id },
    });

    // Hand now contains 1 generated temporary black madness card
    expect(nextState.hand.length).toBe(1);
    expect(nextState.hand[0].category).toBe('madness');
    expect(nextState.hand[0].isTemporary).toBe(true);
    expect(nextState.isMadness).toBe(true);
    expect(nextState.battleLog.some((log) => log.includes('自深淵攫取了 1 張臨時黑色瘋狂卡'))).toBe(true);
  });

  it('transitions from victory to reward screen via PROCEED_TO_REWARD with 3 reward cards', () => {
    const victoryState: GameState = {
      ...createInitialCombatState(),
      phase: 'victory',
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 18,
      },
    };

    const nextState = gameReducer(victoryState, { type: 'PROCEED_TO_REWARD' });

    expect(nextState.phase).toBe('reward');
    expect(nextState.rewardCards).toBeDefined();
    expect(nextState.rewardCards?.length).toBe(3);
    expect(nextState.rewardObols).toBe(15);
  });

  it('claims card reward: adds card to permanent deck, retains wounded health, resets full sanity, dissolves temporary cards', () => {
    const tempMadnessCard = createMockCard({
      id: 'temp_black_card',
      category: 'madness',
      isTemporary: true,
    });
    const regularCard1 = createMockCard({ id: 'reg_1', isTemporary: false });
    const regularCard2 = createMockCard({ id: 'reg_2', isTemporary: false });
    const regularCard3 = createMockCard({ id: 'reg_3', isTemporary: false });
    const regularCard4 = createMockCard({ id: 'reg_4', isTemporary: false });
    const regularCard5 = createMockCard({ id: 'reg_5', isTemporary: false });

    const rewardCard: Card = {
      id: 'drafted_shotgun',
      name: '雙管獵槍',
      category: 'combat',
      costType: 'stamina',
      costValue: 2,
      isTemporary: false,
      effects: [{ type: 'damage', value: 14 }],
      description: '獵槍',
      flavorText: '威力',
    };

    const rewardState: GameState = {
      ...createInitialCombatState(),
      phase: 'reward',
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 16, // Wounded: took 9 damage
        maxHealth: 25,
        armor: 8, // Combat armor
        obols: 15,
      },
      sanityDeck: [regularCard1, regularCard2],
      hand: [regularCard3, tempMadnessCard],
      discardPile: [regularCard4, regularCard5],
      rewardCards: [rewardCard],
      rewardObols: 15,
    };

    const nextState = gameReducer(rewardState, {
      type: 'CLAIM_CARD_REWARD',
      payload: { cardId: rewardCard.id },
    });

    // 1. Enters combat for next encounter
    expect(nextState.phase).toBe('combat');
    expect(nextState.turn).toBe(1);

    // 2. Persistent health damage! 16 remains 16 (does not heal)
    expect(nextState.investigator.health).toBe(16);

    // 3. Combat armor resets to 0
    expect(nextState.investigator.armor).toBe(0);

    // 4. Obols accumulated: 15 + 15 = 30
    expect(nextState.investigator.obols).toBe(30);

    // 5. Total permanent cards: 5 original regular + 1 drafted = 6 cards total
    // (tempMadnessCard was dissolved and not included!)
    const allNextCards = [...nextState.hand, ...nextState.sanityDeck, ...nextState.discardPile];
    expect(allNextCards.length).toBe(6);
    expect(allNextCards.some((c) => c.id === 'temp_black_card')).toBe(false);
    expect(allNextCards.some((c) => c.name === '雙管獵槍')).toBe(true);

    // 6. Full sanity reset: hand drawn to 4, sanityDeck has remaining 2
    expect(nextState.hand.length).toBe(4);
    expect(nextState.sanityDeck.length).toBe(2);
    expect(nextState.discardPile.length).toBe(0);
    expect(nextState.isMadness).toBe(false);
  });

  it('skips card reward: keeps deck size unchanged, awards obols, and retains persistent health damage', () => {
    const regularCards = Array.from({ length: 12 }, (_, i) =>
      createMockCard({ id: `reg_${i}`, isTemporary: false })
    );

    const rewardState: GameState = {
      ...createInitialCombatState(),
      phase: 'reward',
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 19,
        obols: 20,
      },
      sanityDeck: regularCards.slice(0, 8),
      hand: regularCards.slice(8, 12),
      discardPile: [],
      rewardCards: [createMockCard({ id: 'unwanted_card' })],
      rewardObols: 15,
    };

    // Skip reward (no cardId)
    const nextState = gameReducer(rewardState, {
      type: 'CLAIM_CARD_REWARD',
    });

    expect(nextState.phase).toBe('combat');
    // Deck count stays exactly 12
    const allCards = [...nextState.hand, ...nextState.sanityDeck];
    expect(allCards.length).toBe(12);
    expect(nextState.hand.length).toBe(4);
    expect(nextState.sanityDeck.length).toBe(8);
    // Persistent health remains 19
    expect(nextState.investigator.health).toBe(19);
    // Obols increased by 15: 20 + 15 = 35
    expect(nextState.investigator.obols).toBe(35);
  });

  it('returns to title screen from gameover via RETURN_TO_TITLE', () => {
    const gameoverState: GameState = {
      ...createInitialCombatState(),
      phase: 'gameover',
    };

    const nextState = gameReducer(gameoverState, { type: 'RETURN_TO_TITLE' });
    expect(nextState.phase).toBe('title');
  });

  it('retains chosen occupation (Eleanor Vance / occultist) on RESET_COMBAT without reverting to investigator', () => {
    // Start game as Occultist
    const titleState = createInitialGameState();
    const occultistCombat = gameReducer(titleState, {
      type: 'SELECT_OCCUPATION',
      payload: { occupationId: 'occultist', initialPhase: 'combat' },
    });

    expect(occultistCombat.investigator.occupationId).toBe('occultist');
    expect(occultistCombat.investigator.name).toContain('艾蓮諾·凡斯');
    expect(occultistCombat.investigator.occupation).toBe('秘術學者');
    expect(occultistCombat.investigator.obols).toBe(20);

    // Simulate taking damage and entering gameover
    const damagedState: GameState = {
      ...occultistCombat,
      investigator: {
        ...occultistCombat.investigator,
        health: 12,
        armor: 4,
      },
      phase: 'gameover',
    };

    // Trigger RESET_COMBAT without explicit payload
    const resetState = gameReducer(damagedState, { type: 'RESET_COMBAT' });

    // Must preserve Eleanor Vance and occultist starting stats
    expect(resetState.phase).toBe('combat');
    expect(resetState.investigator.occupationId).toBe('occultist');
    expect(resetState.investigator.name).toContain('艾蓮諾·凡斯');
    expect(resetState.investigator.occupation).toBe('秘術學者');
    expect(resetState.investigator.health).toBe(25);
    expect(resetState.investigator.stamina).toBe(3);
    expect(resetState.investigator.obols).toBe(20);

    // Deck must be Eleanor's 12-card occult deck
    const allCards = [...resetState.hand, ...resetState.sanityDeck];
    expect(allCards.length).toBe(12);
    expect(allCards.some((c) => c.category === 'magic')).toBe(true);
    expect(allCards.some((c) => c.category === 'truth')).toBe(true);
  });

  it('retains original elite enemy (Deep One Elder) on RESET_COMBAT without reverting to ghoul', () => {
    const map = generateInvestigationMap();
    map.nodes['node_2_0'].status = 'accessible';

    const eliteCombatState = gameReducer(
      { ...createInitialCombatState(), phase: 'map', map },
      { type: 'NAVIGATE_TO_NODE', payload: { nodeId: 'node_2_0' } }
    );

    expect(eliteCombatState.currentEnemy.id).toBe(INITIAL_DEEP_ONE.id);
    expect(eliteCombatState.currentEnemy.name).toContain('深潛者長老');

    // Simulate taking fatal damage from Deep One Elder
    const gameOverState: GameState = {
      ...eliteCombatState,
      phase: 'gameover',
      investigator: {
        ...eliteCombatState.investigator,
        health: 0,
      },
      currentEnemy: {
        ...eliteCombatState.currentEnemy,
        health: 15, // damaged Deep One
        armor: 0,
      },
    };

    // Retry combat without explicit payload
    const resetState = gameReducer(gameOverState, { type: 'RESET_COMBAT' });

    expect(resetState.phase).toBe('combat');
    // Must NOT revert to Ghoul!
    expect(resetState.currentEnemy.id).toBe(INITIAL_DEEP_ONE.id);
    expect(resetState.currentEnemy.name).toContain('深潛者長老');
    expect(resetState.currentEnemy.health).toBe(INITIAL_DEEP_ONE.health);
    expect(resetState.currentEnemy.armor).toBe(INITIAL_DEEP_ONE.armor);
    expect(resetState.map).toBeDefined();
    expect(resetState.map?.currentNodeId).toBe('node_2_0');
  });

  it('retains original boss enemy (Shoggoth Progeny) on RESET_COMBAT without reverting to ghoul', () => {
    const map = generateInvestigationMap();
    map.nodes['node_4_0'].status = 'accessible';

    const bossCombatState = gameReducer(
      { ...createInitialCombatState(), phase: 'map', map },
      { type: 'NAVIGATE_TO_NODE', payload: { nodeId: 'node_4_0' } }
    );

    expect(bossCombatState.currentEnemy.id).toBe(INITIAL_SHOGGOTH.id);
    expect(bossCombatState.currentEnemy.name).toContain('修格斯幼體');

    // Simulate game over
    const gameOverState: GameState = {
      ...bossCombatState,
      phase: 'gameover',
      investigator: {
        ...bossCombatState.investigator,
        health: 0,
      },
    };

    // Retry combat passing payload with enemy
    const resetState = gameReducer(gameOverState, {
      type: 'RESET_COMBAT',
      payload: {
        occupationId: bossCombatState.investigator.occupationId,
        enemy: bossCombatState.currentEnemy,
      },
    });

    expect(resetState.phase).toBe('combat');
    expect(resetState.currentEnemy.id).toBe(INITIAL_SHOGGOTH.id);
    expect(resetState.currentEnemy.name).toContain('修格斯幼體');
    expect(resetState.currentEnemy.health).toBe(INITIAL_SHOGGOTH.health);
    expect(resetState.currentEnemy.armor).toBe(INITIAL_SHOGGOTH.armor);
    expect(resetState.map?.currentNodeId).toBe('node_4_0');
  });

  it('allows PROCEED_TO_REWARD with pre-generated payload to guarantee reducer purity', () => {
    const victoryState: GameState = {
      ...createInitialCombatState(),
      phase: 'victory',
    };

    const mockRewardCards = [
      createMockCard({ id: 'pure_card_1', name: '確定性卡牌1' }),
      createMockCard({ id: 'pure_card_2', name: '確定性卡牌2' }),
      createMockCard({ id: 'pure_card_3', name: '確定性卡牌3' }),
    ];

    const nextState = gameReducer(victoryState, {
      type: 'PROCEED_TO_REWARD',
      payload: {
        rewardCards: mockRewardCards,
        rewardObols: 15,
      },
    });

    expect(nextState.phase).toBe('reward');
    expect(nextState.rewardCards).toEqual(mockRewardCards);
    expect(nextState.rewardObols).toBe(15);
  });

  it('supports deterministic shuffledDeck in CLAIM_CARD_REWARD for reproducible testing', () => {
    const cardA = createMockCard({ id: 'deterministic_A', name: 'A' });
    const cardB = createMockCard({ id: 'deterministic_B', name: 'B' });
    const cardC = createMockCard({ id: 'deterministic_C', name: 'C' });
    const cardD = createMockCard({ id: 'deterministic_D', name: 'D' });
    const cardE = createMockCard({ id: 'deterministic_E', name: 'E' });

    const rewardState: GameState = {
      ...createInitialCombatState(),
      phase: 'reward',
      sanityDeck: [cardA, cardB],
      hand: [cardC, cardD],
      discardPile: [cardE],
      rewardCards: [],
      rewardObols: 15,
    };

    // Pass custom shuffledDeck to guarantee hand and sanityDeck order
    const deterministicOrder = [cardE, cardD, cardC, cardB, cardA];
    const nextState = gameReducer(rewardState, {
      type: 'CLAIM_CARD_REWARD',
      payload: {
        shuffledDeck: deterministicOrder,
      },
    });

    expect(nextState.hand.map((c) => c.id)).toEqual(['deterministic_E', 'deterministic_D', 'deterministic_C', 'deterministic_B']);
    expect(nextState.sanityDeck.map((c) => c.id)).toEqual(['deterministic_A']);
  });

  it('fisherYatesShuffle uniformly preserves elements and accepts custom random function', () => {
    const original = [1, 2, 3, 4, 5];
    const pseudoRandom = () => 0.42; // Deterministic pseudo-random
    const shuffled = fisherYatesShuffle(original, pseudoRandom);

    expect(shuffled.length).toBe(original.length);
    expect(new Set(shuffled)).toEqual(new Set(original));
  });

  it('ensures zero forbidden domain terms (護盾, 招架, 格擋, 狂暴, 血量, 體力, 抽牌堆, 固有, 戰術牌) across all cards and occupations', () => {
    const forbiddenRegex = /護盾|招架|格擋|狂暴|血量|體力|抽牌堆|固有|戰術牌|戰術卡/;

    const allCardsToCheck = [
      ...INVESTIGATOR_DECK,
      ...OCCULTIST_DECK,
      ...REWARD_CARD_POOL,
    ];

    for (const card of allCardsToCheck) {
      expect(card.name).not.toMatch(forbiddenRegex);
      expect(card.description).not.toMatch(forbiddenRegex);
      expect(card.flavorText).not.toMatch(forbiddenRegex);
    }

    for (const occ of Object.values(OCCUPATIONS)) {
      expect(occ.name).not.toMatch(forbiddenRegex);
      expect(occ.occupation).not.toMatch(forbiddenRegex);
      expect(occ.quote).not.toMatch(forbiddenRegex);
      expect(occ.description).not.toMatch(forbiddenRegex);
    }
  });
});

describe('Investigation Map & Mythos Events System (Issue #6)', () => {
  it('generateInvestigationMap generates a valid 5-layer DAG with accessible entry nodes', () => {
    const map = generateInvestigationMap();

    expect(map.id).toBe('map_arkham_quarantine_01');
    expect(map.layers.length).toBe(5);
    expect(map.currentNodeId).toBeNull();

    const nodeIds = Object.keys(map.nodes);
    expect(nodeIds.length).toBe(12);

    // Layer 0 nodes must be accessible; all others unvisited
    for (const nodeId of map.layers[0]) {
      expect(map.nodes[nodeId].status).toBe('accessible');
      expect(map.nodes[nodeId].layer).toBe(0);
    }

    for (let l = 1; l < map.layers.length; l++) {
      for (const nodeId of map.layers[l]) {
        expect(map.nodes[nodeId].status).toBe('unvisited');
        expect(map.nodes[nodeId].layer).toBe(l);
      }
    }

    // DAG integrity: nodes point only to the immediately next layer (except boss which has 0 nextNodes)
    for (const node of Object.values(map.nodes)) {
      if (node.layer < 4) {
        expect(node.nextNodes.length).toBeGreaterThan(0);
        for (const nextId of node.nextNodes) {
          const nextNode = map.nodes[nextId];
          expect(nextNode).toBeDefined();
          expect(nextNode.layer).toBe(node.layer + 1);
        }
      } else {
        expect(node.layer).toBe(4);
        expect(node.type).toBe('boss');
        expect(node.nextNodes.length).toBe(0);
      }
    }
  });

  it('SELECT_OCCUPATION initializes map and defaults phase to map', () => {
    const titleState: GameState = {
      ...createInitialCombatState(),
      phase: 'title',
    };

    const nextState = gameReducer(titleState, {
      type: 'SELECT_OCCUPATION',
      payload: {
        occupationId: 'investigator',
      },
    });

    expect(nextState.phase).toBe('map');
    expect(nextState.map).toBeDefined();
    expect(nextState.map?.layers.length).toBe(5);
    expect(nextState.investigator.name).toContain('愛德華·皮爾斯');
    expect(nextState.investigator.health).toBe(25);
    expect(nextState.investigator.obols).toBe(15);
  });

  it('NAVIGATE_TO_NODE ignores invalid or inaccessible nodes', () => {
    const map = generateInvestigationMap();
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    // Non-existent node
    const invalidState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'non_existent_node_xyz' },
    });
    expect(invalidState).toBe(mapState);

    // Inaccessible layer 2 node
    const unvisitedState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_2_0' },
    });
    expect(unvisitedState.phase).toBe('map');
    expect(unvisitedState.map?.currentNodeId).toBeNull();
  });

  it('NAVIGATE_TO_NODE enters combat for normal combat node', () => {
    const map = generateInvestigationMap();
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    const nextState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_0_0' },
    });

    expect(nextState.phase).toBe('combat');
    expect(nextState.map?.currentNodeId).toBe('node_0_0');
    expect(nextState.map?.nodes['node_0_0'].status).toBe('current');
    expect(nextState.currentEnemy.name).toContain('食屍鬼');
    expect(nextState.turn).toBe(1);
    expect(nextState.hand.length).toBe(4);
    expect(nextState.battleLog[0]).toContain('陰暗小巷');
  });

  it('NAVIGATE_TO_NODE enters elite combat with Deep One Elder', () => {
    const map = generateInvestigationMap();
    // Force node_2_0 to accessible for test
    map.nodes['node_2_0'].status = 'accessible';
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    const nextState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_2_0' },
    });

    expect(nextState.phase).toBe('combat');
    expect(nextState.currentEnemy.id).toBe(INITIAL_DEEP_ONE.id);
    expect(nextState.currentEnemy.health).toBe(INITIAL_DEEP_ONE.health);
    expect(nextState.currentEnemy.armor).toBe(INITIAL_DEEP_ONE.armor);
    expect(nextState.battleLog[0]).toContain('深潛者長老');
  });

  it('NAVIGATE_TO_NODE enters boss combat with Shoggoth Progeny', () => {
    const map = generateInvestigationMap();
    map.nodes['node_4_0'].status = 'accessible';
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    const nextState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_4_0' },
    });

    expect(nextState.phase).toBe('combat');
    expect(nextState.currentEnemy.id).toBe(INITIAL_SHOGGOTH.id);
    expect(nextState.currentEnemy.health).toBe(INITIAL_SHOGGOTH.health);
    expect(nextState.currentEnemy.armor).toBe(INITIAL_SHOGGOTH.armor);
    expect(nextState.battleLog[0]).toContain('修格斯幼體');
  });

  it('NAVIGATE_TO_NODE enters event node and loads Mythos Event', () => {
    const map = generateInvestigationMap();
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    const nextState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_0_1' },
    });

    expect(nextState.phase).toBe('event');
    expect(nextState.currentEvent).toBeDefined();
    expect(nextState.currentEvent?.title).toBe('迷霧中的傾覆馬車');
    expect(nextState.currentEvent?.options.length).toBeGreaterThan(0);
    expect(nextState.map?.currentNodeId).toBe('node_0_1');
    expect(nextState.map?.nodes['node_0_1'].status).toBe('current');
  });

  it('NAVIGATE_TO_NODE enters sanctuary node', () => {
    const map = generateInvestigationMap();
    map.nodes['node_2_1'].status = 'accessible';
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    const nextState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_2_1' },
    });

    expect(nextState.phase).toBe('sanctuary');
    expect(nextState.sanctuaryUsed).toBe(false);
    expect(nextState.battleLog[0]).toContain('安全避難所');
  });

  it('NAVIGATE_TO_NODE enters market node and initializes market items', () => {
    const map = generateInvestigationMap();
    map.nodes['node_1_2'].status = 'accessible';
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    const nextState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_1_2' },
    });

    expect(nextState.phase).toBe('market');
    expect(nextState.marketItems).toBeDefined();
    expect(nextState.marketItems?.length).toBe(5);
    expect(nextState.battleLog[0]).toContain('黑市商鋪');
  });

  it('executes full Macro Game Loop: map -> combat victory -> claim reward -> return to map with next layer unlocked', () => {
    const map = generateInvestigationMap();
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    // 1. Navigate to node_0_0 (combat)
    const combatState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_0_0' },
    });
    expect(combatState.phase).toBe('combat');
    expect(combatState.map?.currentNodeId).toBe('node_0_0');

    // 2. Victory state and proceed to reward
    const victoryState: GameState = {
      ...combatState,
      phase: 'victory',
    };
    const rewardState = gameReducer(victoryState, { type: 'PROCEED_TO_REWARD' });
    expect(rewardState.phase).toBe('reward');

    // 3. Claim reward to advance map
    const nextMapState = gameReducer(rewardState, {
      type: 'CLAIM_CARD_REWARD',
    });

    expect(nextMapState.phase).toBe('map');
    expect(nextMapState.map).toBeDefined();

    // Previous node is visited
    expect(nextMapState.map?.nodes['node_0_0'].status).toBe('visited');
    // Sibling node_0_1 remains unvisited
    expect(nextMapState.map?.nodes['node_0_1'].status).toBe('unvisited');

    // Next nodes (node_1_0, node_1_1) connected to node_0_0 are now accessible!
    expect(nextMapState.map?.nodes['node_1_0'].status).toBe('accessible');
    expect(nextMapState.map?.nodes['node_1_1'].status).toBe('accessible');
    // node_1_2 was only connected to node_0_1, so it stays unvisited
    expect(nextMapState.map?.nodes['node_1_2'].status).toBe('unvisited');

    // Investigator can now seamlessly navigate to newly accessible node_1_0
    const nextEventState = gameReducer(nextMapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_1_0' },
    });
    expect(nextEventState.phase).toBe('event');
    expect(nextEventState.map?.currentNodeId).toBe('node_1_0');
  });

  it('Mythos Event resolves sanity change and card reward, then returns to map on completion', () => {
    const map = generateInvestigationMap();
    const eventState: GameState = {
      ...createInitialCombatState(),
      phase: 'event',
      map: {
        ...map,
        currentNodeId: 'node_0_1',
      },
      currentEvent: MYTHOS_EVENTS.event_sunken_shrine,
      sanityDeck: [
        createMockCard({ id: 'c1' }),
        createMockCard({ id: 'c2' }),
        createMockCard({ id: 'c3' }),
      ],
      hand: [],
    };

    // Option 1: shrine_inspect costs 2 sanity, gives Truth Card
    const resolvedState = gameReducer(eventState, {
      type: 'RESOLVE_EVENT_OPTION',
      payload: { optionId: 'shrine_inspect' },
    });

    expect(resolvedState.sanityDeck.length).toBe(2);
    expect(resolvedState.sanityDeck.some((c) => c.name === '深潛者手札')).toBe(true);
    expect(resolvedState.hand.length).toBe(0);
    expect(resolvedState.currentEvent?.selectedOptionId).toBe('shrine_inspect');
    expect(resolvedState.currentEvent?.resolvedOutcomeText?.length).toBeGreaterThan(0);

    // Complete event to return to map
    const postEventState = gameReducer(resolvedState, {
      type: 'COMPLETE_EVENT',
    });

    expect(postEventState.phase).toBe('map');
    expect(postEventState.currentEvent).toBeUndefined();
    expect(postEventState.map?.nodes['node_0_1'].status).toBe('visited');
    // Children of node_0_1 (node_1_1, node_1_2) are now accessible
    expect(postEventState.map?.nodes['node_1_1'].status).toBe('accessible');
    expect(postEventState.map?.nodes['node_1_2'].status).toBe('accessible');
  });

  it('Mythos Event triggers ambush combat seamlessly', () => {
    const map = generateInvestigationMap();
    const eventState: GameState = {
      ...createInitialCombatState(),
      phase: 'event',
      map: {
        ...map,
        currentNodeId: 'node_0_1',
      },
      currentEvent: MYTHOS_EVENTS.event_sunken_shrine,
    };

    // Option 3: shrine_disturb triggers ambush
    const combatState = gameReducer(eventState, {
      type: 'RESOLVE_EVENT_OPTION',
      payload: { optionId: 'shrine_disturb' },
    });

    expect(combatState.phase).toBe('combat');
    expect(combatState.currentEnemy.name).toContain('食屍鬼');
    expect(combatState.currentEvent).toBeUndefined();
    expect(combatState.battleLog[0]).toContain('食屍鬼');
  });

  it('Mythos Event handles fatal health consequence with game over', () => {
    const map = generateInvestigationMap();
    const lethalEventState: GameState = {
      ...createInitialCombatState(),
      phase: 'event',
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 2,
      },
      map,
      currentEvent: {
        id: 'fatal_test_event',
        title: '致命陷阱',
        location: '深淵裂隙',
        storyText: ['眼前是深不見底的刀刃機關。'],
        options: [
          {
            id: 'trigger_trap',
            text: '直接踩上機關',
            consequences: [
              {
                type: 'health_change',
                value: -10,
                narrative: '機關貫穿了你的胸膛！',
              },
            ],
          },
        ],
      },
    };

    const gameOverState = gameReducer(lethalEventState, {
      type: 'RESOLVE_EVENT_OPTION',
      payload: { optionId: 'trigger_trap' },
    });

    expect(gameOverState.phase).toBe('gameover');
    expect(gameOverState.investigator.health).toBe(0);
    expect(gameOverState.battleLog[0]).toContain('肉體殞命');
  });

  it('Sanctuary recovers +8 health (capped at 25), prevents double use, and returns to map', () => {
    const map = generateInvestigationMap();
    map.nodes['node_2_1'].status = 'accessible';

    const sanctuaryState: GameState = {
      ...createInitialCombatState(),
      phase: 'sanctuary',
      sanctuaryUsed: false,
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 12,
        maxHealth: 25,
      },
      map: {
        ...map,
        currentNodeId: 'node_2_1',
      },
    };

    // Use bandage: +8 HP
    const healedState = gameReducer(sanctuaryState, {
      type: 'USE_SANCTUARY',
      payload: { optionId: 'bandage' },
    });

    expect(healedState.investigator.health).toBe(20);
    expect(healedState.sanctuaryUsed).toBe(true);

    // Attempting to bandage again in the same visit is disallowed
    const doubleHealState = gameReducer(healedState, {
      type: 'USE_SANCTUARY',
      payload: { optionId: 'bandage' },
    });
    expect(doubleHealState.investigator.health).toBe(20);

    // Leave sanctuary
    const mapState = gameReducer(healedState, {
      type: 'LEAVE_SANCTUARY',
    });

    expect(mapState.phase).toBe('map');
    expect(mapState.sanctuaryUsed).toBeUndefined();
    expect(mapState.map?.nodes['node_2_1'].status).toBe('visited');
    // Next nodes (node_3_0, node_3_1, node_3_2) are now accessible
    expect(mapState.map?.nodes['node_3_0'].status).toBe('accessible');
    expect(mapState.map?.nodes['node_3_1'].status).toBe('accessible');
    expect(mapState.map?.nodes['node_3_2'].status).toBe('accessible');
  });

  it('Sanctuary meditation grants Truth Card 心智防波堤', () => {
    const sanctuaryState: GameState = {
      ...createInitialCombatState(),
      phase: 'sanctuary',
      sanctuaryUsed: false,
      hand: [],
    };

    const meditatedState = gameReducer(sanctuaryState, {
      type: 'USE_SANCTUARY',
      payload: { optionId: 'meditate' },
    });

    expect(meditatedState.sanctuaryUsed).toBe(true);
    expect(meditatedState.sanityDeck.some((c) => c.name === '心智防波堤')).toBe(true);
    expect(meditatedState.hand.length).toBe(0);
  });

  it('Black Market allows purchasing cards and healing supplies with Ancient Obols', () => {
    const map = generateInvestigationMap();
    map.nodes['node_1_2'].status = 'accessible';
    const defaultItems = generateDefaultMarketItems();

    const marketState: GameState = {
      ...createInitialCombatState(),
      phase: 'market',
      investigator: {
        ...INITIAL_INVESTIGATOR,
        health: 15,
        maxHealth: 25,
        obols: 35,
      },
      map: {
        ...map,
        currentNodeId: 'node_1_2',
      },
      marketItems: defaultItems,
      hand: [],
    };

    const cardItem = defaultItems.find((i) => i.type === 'card' && i.price <= 30)!;
    expect(cardItem).toBeDefined();

    // 1. Buy card item
    const boughtCardState = gameReducer(marketState, {
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: cardItem.id },
    });

    expect(boughtCardState.investigator.obols).toBe(35 - cardItem.price);
    expect(boughtCardState.sanityDeck.some((c) => c.name === cardItem.card!.name)).toBe(true);
    expect(boughtCardState.hand.length).toBe(0);
    const updatedCardItem = boughtCardState.marketItems?.find((i) => i.id === cardItem.id);
    expect(updatedCardItem?.isPurchased).toBe(true);

    // 2. Re-buying already purchased item is rejected
    const rebuyState = gameReducer(boughtCardState, {
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: cardItem.id },
    });
    expect(rebuyState.investigator.obols).toBe(boughtCardState.investigator.obols);

    // 3. Buying with insufficient obols is rejected
    const expensiveItem = rebuyState.marketItems?.find(
      (i) => !i.isPurchased && i.price > rebuyState.investigator.obols
    );
    expect(expensiveItem).toBeDefined();
    if (expensiveItem) {
      const failedState = gameReducer(rebuyState, {
        type: 'BUY_MARKET_ITEM',
        payload: { itemId: expensiveItem.id },
      });
      expect(failedState.investigator.obols).toBe(rebuyState.investigator.obols);
      expect(failedState.battleLog[0]).toContain('古金幣不足');
    }

    // 4. Buying healing item heals health
    const healItem = defaultItems.find((i) => i.type === 'heal' && i.price <= 10)!;
    const richState: GameState = {
      ...marketState,
      investigator: {
        ...marketState.investigator,
        health: 15,
        obols: 50,
      },
    };
    const healedState = gameReducer(richState, {
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: healItem.id },
    });
    expect(healedState.investigator.health).toBe(15 + (healItem.healAmount ?? 0));
    expect(healedState.investigator.obols).toBe(50 - healItem.price);

    // 5. Leave market
    const leaveState = gameReducer(healedState, {
      type: 'LEAVE_MARKET',
    });
    expect(leaveState.phase).toBe('map');
    expect(leaveState.marketItems).toBeUndefined();
    expect(leaveState.map?.nodes['node_1_2'].status).toBe('visited');
  });

  it('ensures zero forbidden domain terms (護盾, 招架, 格擋, 狂暴, 血量, 體力, 抽牌堆, 固有, 戰術牌) across map, events, and market', () => {
    const forbiddenRegex = /護盾|招架|格擋|狂暴|血量|體力|抽牌堆|固有|戰術牌|戰術卡/;

    // Map template
    for (const node of BASE_MAP_TEMPLATE) {
      expect(node.label).not.toMatch(forbiddenRegex);
      expect(node.title).not.toMatch(forbiddenRegex);
      expect(node.description).not.toMatch(forbiddenRegex);
    }

    // Mythos events
    for (const event of Object.values(MYTHOS_EVENTS)) {
      expect(event.title).not.toMatch(forbiddenRegex);
      expect(event.location).not.toMatch(forbiddenRegex);
      for (const st of event.storyText) {
        expect(st).not.toMatch(forbiddenRegex);
      }
      for (const opt of event.options) {
        expect(opt.text).not.toMatch(forbiddenRegex);
        expect(opt.costDescription).not.toMatch(forbiddenRegex);
        for (const cons of opt.consequences) {
          expect(cons.narrative).not.toMatch(forbiddenRegex);
          if (cons.card) {
            expect(cons.card.name).not.toMatch(forbiddenRegex);
            expect(cons.card.description).not.toMatch(forbiddenRegex);
          }
        }
      }
    }

    // Market items
    const items = generateDefaultMarketItems();
    for (const item of items) {
      expect(item.name).not.toMatch(forbiddenRegex);
      expect(item.description).not.toMatch(forbiddenRegex);
    }
  });

  it('ensures obtained cards from market, sanctuary, and events are added to deck and not directly into next combat opening hand', () => {
    const map = generateInvestigationMap();
    const initialState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
      investigator: {
        ...INITIAL_INVESTIGATOR,
        obols: 50,
      },
    };

    const initialTotalCards = [...initialState.sanityDeck, ...initialState.hand, ...initialState.discardPile].length;
    expect(initialTotalCards).toBe(12);

    // 1. Enter Market and buy a card
    map.nodes['node_1_2'].status = 'accessible';
    const marketState = gameReducer(initialState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_1_2' },
    });
    expect(marketState.phase).toBe('market');

    const cardItem = marketState.marketItems!.find((i) => i.type === 'card')!;
    const afterBuyState = gameReducer(marketState, {
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: cardItem.id },
    });

    // Acquired card must be in sanityDeck (deck), NOT hand
    expect(afterBuyState.hand.length).toBe(initialState.hand.length);
    expect(afterBuyState.sanityDeck.some((c) => c.name === cardItem.card!.name)).toBe(true);

    const leftMarketState = gameReducer(afterBuyState, { type: 'LEAVE_MARKET' });
    expect(leftMarketState.phase).toBe('map');

    // 2. Now navigate to a combat node
    leftMarketState.map!.nodes['node_1_1'].status = 'accessible';
    const combatState = gameReducer(leftMarketState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_1_1' },
    });

    expect(combatState.phase).toBe('combat');
    // Opening hand must have exactly BASELINE_HAND_SIZE (4 cards), NOT 5!
    expect(combatState.hand.length).toBe(4);
    // Sanity deck has 13 - 4 = 9 cards
    expect(combatState.sanityDeck.length).toBe(9);
    // Total permanent cards across battle is 13
    const totalBattleCards = [...combatState.hand, ...combatState.sanityDeck];
    expect(totalBattleCards.length).toBe(13);
    expect(totalBattleCards.some((c) => c.name === cardItem.card!.name)).toBe(true);
  });

  describe('Code Review Improvements & Hardening', () => {
    it('ensures reducer determinism: no Date.now() used for card IDs in events, sanctuary, and market', () => {
      const baseState: GameState = {
        ...createInitialCombatState(),
        phase: 'map',
        map: generateInvestigationMap(),
        investigator: {
          ...INITIAL_INVESTIGATOR,
          obols: 50,
        },
      };

      // 1. Event card acquisition ID determinism
      const eventState: GameState = {
        ...baseState,
        phase: 'event',
        currentEvent: MYTHOS_EVENTS['event_sunken_shrine'],
      };
      const eventResult = gameReducer(eventState, {
        type: 'RESOLVE_EVENT_OPTION',
        payload: { optionId: 'shrine_inspect' },
      });
      const eventCard = eventResult.sanityDeck[eventResult.sanityDeck.length - 1];
      expect(eventCard.id).toBe(`event_card_deep_truth_evt_${baseState.sanityDeck.length + 1}`);
      expect(eventCard.id).toMatch(/_evt_\d+$/);
      expect(eventCard.id).not.toContain('undefined');
      expect(eventCard.id).not.toContain('NaN');

      // 2. Sanctuary meditate ID determinism
      const sanctuaryState: GameState = {
        ...baseState,
        phase: 'sanctuary',
        sanctuaryUsed: false,
      };
      const sanctuaryResult = gameReducer(sanctuaryState, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'meditate' },
      });
      const sanctuaryCard = sanctuaryResult.sanityDeck[sanctuaryResult.sanityDeck.length - 1];
      expect(sanctuaryCard.id).toBe(`sanctuary_truth_${baseState.sanityDeck.length + 1}`);

      // 3. Market buy card ID determinism
      const marketState: GameState = {
        ...baseState,
        phase: 'market',
        marketItems: generateDefaultMarketItems(),
      };
      const marketCardItem = marketState.marketItems!.find((i) => i.type === 'card')!;
      const marketResult = gameReducer(marketState, {
        type: 'BUY_MARKET_ITEM',
        payload: { itemId: marketCardItem.id },
      });
      const marketCard = marketResult.sanityDeck[marketResult.sanityDeck.length - 1];
      expect(marketCard.id).toBe(`${marketCardItem.card!.id}_purchased_${baseState.sanityDeck.length + 1}`);
    });

    it('supports deterministic opening hand override via action payload shuffledDeck', () => {
      const map = generateInvestigationMap();
      const mapState: GameState = {
        ...createInitialCombatState(),
        phase: 'map',
        map,
      };

      const deterministicDeck = INVESTIGATOR_DECK.map((c) => ({ ...c })).reverse();
      const combatState = gameReducer(mapState, {
        type: 'NAVIGATE_TO_NODE',
        payload: { nodeId: 'node_0_0', shuffledDeck: deterministicDeck },
      });

      // Opening hand should precisely match first 4 cards of deterministicDeck
      expect(combatState.hand.map((c) => c.id)).toEqual(deterministicDeck.slice(0, 4).map((c) => c.id));
      expect(combatState.sanityDeck.map((c) => c.id)).toEqual(deterministicDeck.slice(4).map((c) => c.id));
    });

    it('deduplicates helper functions: cloneEnemy and setupCombatDeck preserve pure state invariants', () => {
      const cloned = cloneEnemy(INITIAL_SHOGGOTH);
      expect(cloned).toEqual(INITIAL_SHOGGOTH);
      expect(cloned).not.toBe(INITIAL_SHOGGOTH);

      const cards = INVESTIGATOR_DECK.map((c) => ({ ...c }));
      const { hand, sanityDeck } = setupCombatDeck(cards, 'investigator');
      expect(hand.length).toBe(4);
      expect(sanityDeck.length).toBe(cards.length - 4);
    });

    it('marks map.isCompleted = true upon boss node defeat in CLAIM_CARD_REWARD', () => {
      const map = generateInvestigationMap();
      map.nodes['node_4_0'].status = 'accessible';

      const bossCombatState = gameReducer(
        {
          ...createInitialCombatState(),
          phase: 'map',
          map,
        },
        {
          type: 'NAVIGATE_TO_NODE',
          payload: { nodeId: 'node_4_0' },
        }
      );

      expect(bossCombatState.currentEnemy.id).toBe(INITIAL_SHOGGOTH.id);

      // Win combat and claim reward
      const victoryState: GameState = {
        ...bossCombatState,
        phase: 'victory',
      };
      const rewardState = gameReducer(victoryState, { type: 'PROCEED_TO_REWARD' });
      const postBossTransitionState = gameReducer(rewardState, { type: 'CLAIM_CARD_REWARD' });

      // Boss defeat triggers full-screen depth transition and marks map completed
      expect(postBossTransitionState.phase).toBe('depth_transition');
      expect(postBossTransitionState.map?.isCompleted).toBe(true);
      expect(postBossTransitionState.map?.nodes['node_4_0'].status).toBe('visited');

      // Completing depth transition advances depth and enters new depth map
      const postBossMapState = gameReducer(postBossTransitionState, { type: 'COMPLETE_DEPTH_TRANSITION' });
      expect(postBossMapState.phase).toBe('map');
      expect(postBossMapState.currentDepth).toBe(2);

      // Direct test of advanceMapAfterNode on boss node
      const directAdvanced = advanceMapAfterNode(bossCombatState.map);
      expect(directAdvanced?.isCompleted).toBe(true);

      // Return to title works from completed state
      const titleState = gameReducer(postBossMapState, { type: 'RETURN_TO_TITLE' });
      expect(titleState.phase).toBe('title');
    });

    it('deducts explicit cost for sanctuary flesh bandaging (5 obols or 1 sanity card)', () => {
      // Case 1: Investigator has sufficient obols (>= 5)
      const stateWithObols: GameState = {
        ...createInitialCombatState(),
        phase: 'sanctuary',
        sanctuaryUsed: false,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 10,
          obols: 15,
        },
      };

      const afterBandageWithObols = gameReducer(stateWithObols, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'bandage' },
      });

      expect(afterBandageWithObols.investigator.health).toBe(18);
      expect(afterBandageWithObols.investigator.obols).toBe(10); // 15 - 5
      expect(afterBandageWithObols.sanityDeck.length).toBe(stateWithObols.sanityDeck.length);
      expect(afterBandageWithObols.battleLog[0]).toContain('消耗 5 枚古金幣');

      // Case 2: Investigator has insufficient obols (< 5), burns 1 sanity card
      const stateWithoutObols: GameState = {
        ...createInitialCombatState(),
        phase: 'sanctuary',
        sanctuaryUsed: false,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 10,
          obols: 2,
        },
      };

      const afterBandageWithoutObols = gameReducer(stateWithoutObols, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'bandage' },
      });

      expect(afterBandageWithoutObols.investigator.health).toBe(18);
      expect(afterBandageWithoutObols.investigator.obols).toBe(2);
      expect(afterBandageWithoutObols.sanityDeck.length).toBe(stateWithoutObols.sanityDeck.length - 1);
      expect(afterBandageWithoutObols.battleLog[0]).toContain('損耗 1 點理智');
    });

    it('handles positive sanity changes in events by restoring cards into sanity deck', () => {
      const baseState: GameState = {
        ...createInitialCombatState(),
        phase: 'event',
        sanityDeck: INVESTIGATOR_DECK.slice(0, 5),
        discardPile: INVESTIGATOR_DECK.slice(5, 8),
        currentEvent: {
          id: 'test_event',
          title: '心靈綠洲',
          location: '聖堂廢墟',
          storyText: ['陽光灑落，安撫了殘破的意志。'],
          options: [
            {
              id: 'opt_calm',
              text: '深呼吸感受平靜',
              consequences: [
                {
                  type: 'sanity_change',
                  value: 3,
                  narrative: '意志得到療癒，理智重新回流。',
                },
              ],
            },
          ],
        },
      };

      const nextState = gameReducer(baseState, {
        type: 'RESOLVE_EVENT_OPTION',
        payload: { optionId: 'opt_calm' },
      });

      // Sanity deck should have increased from 5 to 8
      expect(nextState.sanityDeck.length).toBe(8);
    });

    it('supports procedural map generation with seedable and random variations', () => {
      // 1. Procedural generation creates valid 6-layer 16-node DAG
      const procMap = generateProceduralInvestigationMap();
      expect(procMap.layers.length).toBe(6);
      expect(procMap.nodes['node_5_0'].type).toBe('boss');
      expect(Object.keys(procMap.nodes).length).toBe(16);
      expect(procMap.nodes['node_0_0'].status).toBe('accessible');
      expect(procMap.nodes['node_0_1'].status).toBe('accessible');

      // 2. Deterministic PRNG with same seed generates identical maps
      const map1 = generateProceduralInvestigationMap({ seed: 42 });
      const map2 = generateProceduralInvestigationMap({ seed: 42 });
      expect(Object.keys(map1.nodes).map((id) => map1.nodes[id].title)).toEqual(
        Object.keys(map2.nodes).map((id) => map2.nodes[id].title)
      );

      // 3. Different seeds generate different node variations
      const map3 = generateProceduralInvestigationMap({ seed: 999 });
      const titles1 = Object.values(map1.nodes).map((n) => n.title);
      const titles3 = Object.values(map3.nodes).map((n) => n.title);
      expect(titles1).not.toEqual(titles3);
    });

    it('preserves trim permanent deck with fewer than 10 cards instead of resetting to starter deck', () => {
      const customTrimCards: Card[] = [
        {
          id: 'card_custom_1',
          name: '精準點射',
          category: 'combat',
          costType: 'stamina',
          costValue: 1,
          isTemporary: false,
          effects: [{ type: 'damage', value: 8 }],
          description: '精準射擊',
          flavorText: '「一槍斃命。」',
        },
        {
          id: 'card_custom_2',
          name: '緊急閃避',
          category: 'skill',
          costType: 'stamina',
          costValue: 1,
          isTemporary: false,
          effects: [{ type: 'armor', value: 6 }],
          description: '閃避攻擊',
          flavorText: '「千鈞一髮。」',
        },
        {
          id: 'card_custom_3',
          name: '醫療鎮定劑',
          category: 'skill',
          costType: 'stamina',
          costValue: 1,
          isTemporary: false,
          effects: [{ type: 'heal', value: 4 }],
          description: '恢復生命',
          flavorText: '「暫緩痛楚。」',
        },
        {
          id: 'card_custom_4',
          name: '冷靜意志',
          category: 'truth',
          costType: 'stamina',
          costValue: 0,
          isTemporary: false,
          effects: [{ type: 'add_to_deck', value: 1 }],
          description: '回補理智',
          flavorText: '「清醒的判斷。」',
        },
        {
          id: 'card_custom_5',
          name: '軍刀突刺',
          category: 'combat',
          costType: 'stamina',
          costValue: 1,
          isTemporary: false,
          effects: [{ type: 'damage', value: 6 }],
          description: '突刺攻擊',
          flavorText: '「短兵相接。」',
        },
        {
          id: 'card_custom_6',
          name: '就地掩蔽',
          category: 'skill',
          costType: 'stamina',
          costValue: 1,
          isTemporary: false,
          effects: [{ type: 'armor', value: 8 }],
          description: '尋找掩護',
          flavorText: '「防範未然。」',
        },
      ];

      const { hand, sanityDeck } = setupCombatDeck(
        customTrimCards,
        'investigator'
      );

      expect(hand.length + sanityDeck.length).toBe(6);
      const allNames = [...hand, ...sanityDeck].map((c) => c.name);
      expect(allNames).toContain('精準點射');
      expect(allNames).toContain('冷靜意志');
      expect(allNames).not.toContain('點38轉輪手槍');
    });

    it('does not spend obols or sanity cards when using bandage at full health in sanctuary', () => {
      const stateAtFullHealth: GameState = {
        ...createInitialCombatState(),
        phase: 'sanctuary',
        investigator: {
          ...createInitialCombatState().investigator,
          health: 25,
          maxHealth: 25,
          obols: 20,
        },
        sanityDeck: [
          {
            id: 'sanity_card_1',
            name: '一般卡1',
            category: 'skill',
            costType: 'stamina',
            costValue: 1,
            isTemporary: false,
            effects: [],
            description: '測試卡',
            flavorText: '「測試。」',
          },
        ],
        sanctuaryUsed: false,
      };

      const nextState = gameReducer(stateAtFullHealth, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'bandage' },
      });

      expect(nextState).toBe(stateAtFullHealth);
      expect(nextState.investigator.obols).toBe(20);
      expect(nextState.sanityDeck.length).toBe(1);
      expect(nextState.sanctuaryUsed).toBeFalsy();
    });

    it('rejects bandage healing when investigator cannot afford it (obols < 5 and sanityDeck is empty)', () => {
      const stateBrokeAndInsane: GameState = {
        ...createInitialCombatState(),
        phase: 'sanctuary',
        investigator: {
          ...createInitialCombatState().investigator,
          health: 10,
          maxHealth: 25,
          obols: 2, // Less than 5 obols
        },
        sanityDeck: [], // Zero sanity cards left
        sanctuaryUsed: false,
      };

      const nextState = gameReducer(stateBrokeAndInsane, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'bandage' },
      });

      // Must be rejected: no healing granted, sanctuary not marked as used, state unchanged
      expect(nextState).toBe(stateBrokeAndInsane);
      expect(nextState.investigator.health).toBe(10);
      expect(nextState.sanctuaryUsed).toBeFalsy();
    });

    it('sets phase to gameover, retains currentEvent on fatal event option, and resets via RETURN_TO_TITLE', () => {
      const stateInFatalEvent: GameState = {
        ...createInitialCombatState(),
        phase: 'event',
        investigator: {
          ...createInitialCombatState().investigator,
          health: 5,
          maxHealth: 25,
          obols: 10,
        },
        currentEvent: {
          id: 'test_fatal_event',
          title: '古老陷阱',
          location: '廢棄地穴',
          storyText: ['你踩中了某種符文機關。'],
          options: [
            {
              id: 'opt_touch',
              text: '觸碰符文',
              consequences: [
                {
                  type: 'health_change',
                  value: -10,
                  narrative: '血色符文爆發出致命衝擊！',
                },
              ],
            },
          ],
        },
      };

      const gameoverState = gameReducer(stateInFatalEvent, {
        type: 'RESOLVE_EVENT_OPTION',
        payload: { optionId: 'opt_touch' },
      });

      expect(gameoverState.phase).toBe('gameover');
      expect(gameoverState.investigator.health).toBe(0);
      expect(gameoverState.currentEvent).toBeDefined();
      expect(gameoverState.currentEvent?.selectedOptionId).toBe('opt_touch');
      expect(gameoverState.currentEvent?.resolvedOutcomeText).toContain('血色符文爆發出致命衝擊！');

      const titleState = gameReducer(gameoverState, { type: 'RETURN_TO_TITLE' });
      expect(titleState.phase).toBe('title');
      expect(titleState.currentEvent).toBeUndefined();
    });

    it('initializes procedural map when SELECT_OCCUPATION has procedural: true', () => {
      const state = gameReducer(createInitialCombatState(), {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'investigator', procedural: true },
      });

      expect(state.phase).toBe('map');
      expect(state.map).toBeDefined();
      expect(state.map?.name).toBe('阿卡姆封鎖區調查圖（隨機生成）');
      expect(state.map?.layers.length).toBe(6);
      expect(Object.keys(state.map?.nodes ?? {}).length).toBe(16);
    });

    it('adheres to CONTEXT.md domain standards: zero occurrences of forbidden term 牌組', () => {
      const eventJson = JSON.stringify(MYTHOS_EVENTS);
      expect(eventJson.includes('牌組')).toBe(false);

      const occJson = JSON.stringify(OCCUPATIONS);
      expect(occJson.includes('牌組')).toBe(false);
    });
  });

  describe('Onboarding Flow & Transition Sequences (Issue #13)', () => {
    it('transitions from title to prologue via START_NEW_INVESTIGATION', () => {
      const titleState = createInitialGameState();
      expect(titleState.phase).toBe('title');

      const nextState = gameReducer(titleState, { type: 'START_NEW_INVESTIGATION' });
      expect(nextState.phase).toBe('prologue');
      expect(nextState.battleLog.some((log) => log.includes('序章') || log.includes('剪報') || log.includes('密信'))).toBe(true);
    });

    it('transitions from prologue to occupation_select via COMPLETE_PROLOGUE', () => {
      const prologueState: GameState = {
        ...createInitialGameState(),
        phase: 'prologue',
      };

      const nextState = gameReducer(prologueState, { type: 'COMPLETE_PROLOGUE' });
      expect(nextState.phase).toBe('occupation_select');
      expect(nextState.battleLog.some((log) => log.includes('調查員'))).toBe(true);
    });

    it('transitions from occupation_select to departure on SELECT_OCCUPATION without explicit initialPhase', () => {
      const selectState: GameState = {
        ...createInitialGameState(),
        phase: 'occupation_select',
      };

      const nextState = gameReducer(selectState, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'investigator', procedural: true },
      });

      expect(nextState.phase).toBe('departure');
      expect(nextState.investigator.name).toContain('Edward Pierce');
      expect(nextState.map).toBeDefined();
      expect(nextState.sanityDeck.length).toBe(8);
      expect(nextState.hand.length).toBe(4);
    });

    it('transitions from departure to map via COMPLETE_DEPARTURE', () => {
      const departureState: GameState = {
        ...createInitialGameState(),
        phase: 'departure',
        investigator: {
          ...INITIAL_INVESTIGATOR,
        },
      };

      const nextState = gameReducer(departureState, { type: 'COMPLETE_DEPARTURE' });
      expect(nextState.phase).toBe('map');
      expect(nextState.battleLog.some((log) => log.includes('阿卡姆') || log.includes('調查地圖'))).toBe(true);
    });

    it('resets back to title from prologue, occupation_select, and departure via RETURN_TO_TITLE', () => {
      for (const phase of ['prologue', 'occupation_select', 'departure'] as const) {
        const state: GameState = {
          ...createInitialGameState(),
          phase,
        };
        const resetState = gameReducer(state, { type: 'RETURN_TO_TITLE' });
        expect(resetState.phase).toBe('title');
      }
    });

    it('maintains backward compatibility: SELECT_OCCUPATION from title or other phases defaults to map or explicit initialPhase', () => {
      const titleState = createInitialGameState();
      const mapDefaultState = gameReducer(titleState, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'occultist' },
      });
      expect(mapDefaultState.phase).toBe('map');

      const explicitCombatState = gameReducer(titleState, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'investigator', initialPhase: 'combat' },
      });
      expect(explicitCombatState.phase).toBe('combat');
    });
  });

  describe('Multi-Depth Chapters & Boss Recovery (Issue #19 / ADR-0015)', () => {
    it('initializes currentDepth to 1 upon investigation start and occupation select', () => {
      const initial = createInitialGameState();
      expect(initial.currentDepth).toBe(1);

      const selectState = gameReducer(initial, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'investigator' },
      });
      expect(selectState.currentDepth).toBe(1);
    });

    it('generates 16 nodes across 6 layers for Depths 1, 2, 3 with zero dead ends', () => {
      for (const depth of [1, 2, 3] as const) {
        const map = generateProceduralInvestigationMap({ depth });
        expect(map.depth).toBe(depth);
        expect(map.layers.length).toBe(6);
        expect(Object.keys(map.nodes).length).toBe(16);

        // Verify layer node counts: 2 + 3 + 3 + 4 + 3 + 1 = 16
        expect(map.layers[0].length).toBe(2);
        expect(map.layers[1].length).toBe(3);
        expect(map.layers[2].length).toBe(3);
        expect(map.layers[3].length).toBe(4);
        expect(map.layers[4].length).toBe(3);
        expect(map.layers[5].length).toBe(1);

        // Verify boss node is at layer 5
        const bossNodeId = map.layers[5][0];
        expect(map.nodes[bossNodeId].type).toBe('boss');

        // Verify reachability: all non-boss nodes must have outgoing edges
        for (let l = 0; l < 5; l++) {
          for (const nodeId of map.layers[l]) {
            const node = map.nodes[nodeId];
            expect(node.nextNodes.length).toBeGreaterThan(0);
            // All outgoing edges must target the subsequent layer
            for (const nextId of node.nextNodes) {
              expect(map.nodes[nextId].layer).toBe(l + 1);
            }
          }
        }
      }
    });

    it('generates 8 nodes across 4 layers for Depth 4', () => {
      const map = generateProceduralInvestigationMap({ depth: 4 });
      expect(map.depth).toBe(4);
      expect(map.layers.length).toBe(4);
      expect(Object.keys(map.nodes).length).toBe(8);

      // Verify layer node counts: 2 + 2 + 3 + 1 = 8
      expect(map.layers[0].length).toBe(2);
      expect(map.layers[1].length).toBe(2);
      expect(map.layers[2].length).toBe(3);
      expect(map.layers[3].length).toBe(1);

      const bossNodeId = map.layers[3][0];
      expect(map.nodes[bossNodeId].type).toBe('boss');
    });

    it('spawns depth-appropriate bosses: Shoggoth (Depth 1), Dagon Priest (Depth 2), Colossal Shoggoth (Depth 3), Star Spawn (Depth 4)', () => {
      expect(getBossByDepth(1).id).toBe(INITIAL_SHOGGOTH.id);
      expect(getBossByDepth(2).id).toBe(INITIAL_DAGON_PRIEST.id);
      expect(getBossByDepth(3).id).toBe(INITIAL_COLOSSAL_SHOGGOTH.id);
      expect(getBossByDepth(4).id).toBe(INITIAL_STAR_SPAWN.id);
    });

    it('heals investigator bodily health to maxHealth (Heal to Full) upon boss victory and transitions to depth_transition', () => {
      const map = generateInvestigationMap();
      const bossNode = map.layers[map.layers.length - 1][0];

      // Enter boss node
      const bossCombat = gameReducer(
        {
          ...createInitialCombatState(),
          phase: 'map',
          currentDepth: 1,
          investigator: {
            ...INITIAL_INVESTIGATOR,
            health: 8, // Severely damaged
            maxHealth: 25,
          },
          map: {
            ...map,
            nodes: {
              ...map.nodes,
              [bossNode]: {
                ...map.nodes[bossNode],
                status: 'accessible',
              },
            },
          },
        },
        { type: 'NAVIGATE_TO_NODE', payload: { nodeId: bossNode } }
      );

      expect(bossCombat.phase).toBe('combat');
      expect(bossCombat.currentEnemy.id).toBe(INITIAL_SHOGGOTH.id);
      expect(bossCombat.investigator.health).toBe(8);

      // Defeat boss and enter reward
      const victoryState: GameState = { ...bossCombat, phase: 'victory' };
      const rewardState = gameReducer(victoryState, { type: 'PROCEED_TO_REWARD' });

      // Claim reward -> Should Heal to Full and enter depth_transition
      const claimState = gameReducer(rewardState, { type: 'CLAIM_CARD_REWARD' });
      expect(claimState.phase).toBe('depth_transition');
      expect(claimState.investigator.health).toBe(claimState.investigator.maxHealth);
      expect(claimState.investigator.health).toBe(25);
      expect(claimState.battleLog.some((log) => log.includes('首領決戰復甦'))).toBe(true);

      // Complete depth transition -> advances to Depth 2 with new map
      const depth2State = gameReducer(claimState, { type: 'COMPLETE_DEPTH_TRANSITION' });
      expect(depth2State.phase).toBe('map');
      expect(depth2State.currentDepth).toBe(2);
      expect(depth2State.map?.name).toBe('深潛者海蝕迷宮調查圖');
      expect(Object.keys(depth2State.map?.nodes ?? {}).length).toBe(16);
      expect(depth2State.battleLog.some((log) => log.includes('邁向新深淵'))).toBe(true);
    });

    it('retains persistent health damage without healing when defeating normal enemies', () => {
      const normalCombat = createInitialCombatState();
      const woundedCombat: GameState = {
        ...normalCombat,
        phase: 'victory',
        investigator: {
          ...normalCombat.investigator,
          health: 12,
          maxHealth: 25,
        },
        map: generateInvestigationMap(),
      };

      const rewardState = gameReducer(woundedCombat, { type: 'PROCEED_TO_REWARD' });
      const claimState = gameReducer(rewardState, { type: 'CLAIM_CARD_REWARD' });

      // Normal combat victory should NOT heal health
      expect(claimState.investigator.health).toBe(12);
      expect(claimState.battleLog.some((log) => log.includes('肉體傷勢保留'))).toBe(true);
      expect(claimState.phase).toBe('map');
    });

    it('correctly advances through Depth 2 boss and enters Depth 3', () => {
      const depth2Map = generateProceduralInvestigationMap({ depth: 2 });
      const bossNodeId = depth2Map.layers[5][0];

      // Navigate to Depth 2 boss
      const depth2Combat = gameReducer(
        {
          ...createInitialCombatState(),
          phase: 'map',
          currentDepth: 2,
          investigator: {
            ...INITIAL_INVESTIGATOR,
            health: 10,
            maxHealth: 25,
          },
          map: {
            ...depth2Map,
            nodes: {
              ...depth2Map.nodes,
              [bossNodeId]: {
                ...depth2Map.nodes[bossNodeId],
                status: 'accessible',
              },
            },
          },
        },
        { type: 'NAVIGATE_TO_NODE', payload: { nodeId: bossNodeId } }
      );

      // Verify Dagon Priest was loaded
      expect(depth2Combat.currentEnemy.id).toBe(INITIAL_DAGON_PRIEST.id);
      expect(depth2Combat.currentEnemy.name).toBe('大袞的深淵祭司');

      // Win and claim reward
      const victoryState: GameState = { ...depth2Combat, phase: 'victory' };
      const rewardState = gameReducer(victoryState, { type: 'PROCEED_TO_REWARD' });
      const transitionState = gameReducer(rewardState, { type: 'CLAIM_CARD_REWARD' });

      expect(transitionState.phase).toBe('depth_transition');
      expect(transitionState.investigator.health).toBe(25); // Full heal

      // Advance to Depth 3
      const depth3State = gameReducer(transitionState, { type: 'COMPLETE_DEPTH_TRANSITION' });
      expect(depth3State.phase).toBe('map');
      expect(depth3State.currentDepth).toBe(3);
      expect(depth3State.map?.name).toBe('無底深淵祭壇調查圖');
      expect(Object.keys(depth3State.map?.nodes ?? {}).length).toBe(16);
    });

    it('guards COMPLETE_DEPTH_TRANSITION against advancing beyond max depth 4 and completes map', () => {
      const stateAtDepth4: GameState = {
        ...createInitialCombatState(),
        phase: 'depth_transition',
        currentDepth: 4,
        map: generateProceduralInvestigationMap({ depth: 4 }),
      };

      const result = gameReducer(stateAtDepth4, { type: 'COMPLETE_DEPTH_TRANSITION' });
      expect(result.currentDepth).toBe(4);
      expect(result.phase).toBe('map');
      expect(result.map?.isCompleted).toBe(true);
    });

    it('completes the entire adventure with map.isCompleted = true and transitions to map (Arkham Gazette victory) upon defeating Depth 4 final boss', () => {
      const depth4Map = generateProceduralInvestigationMap({ depth: 4 });
      const bossNodeId = depth4Map.layers[3][0];

      // Navigate to Depth 4 boss
      const depth4Combat = gameReducer(
        {
          ...createInitialCombatState(),
          phase: 'map',
          currentDepth: 4,
          investigator: {
            ...INITIAL_INVESTIGATOR,
            health: 15,
            maxHealth: 25,
          },
          map: {
            ...depth4Map,
            nodes: {
              ...depth4Map.nodes,
              [bossNodeId]: {
                ...depth4Map.nodes[bossNodeId],
                status: 'accessible',
              },
            },
          },
        },
        { type: 'NAVIGATE_TO_NODE', payload: { nodeId: bossNodeId } }
      );

      expect(depth4Combat.currentEnemy.id).toBe(INITIAL_STAR_SPAWN.id);
      expect(depth4Combat.currentEnemy.name).toBe('克蘇魯星之眷族');

      // Win and claim reward
      const victoryState: GameState = { ...depth4Combat, phase: 'victory' };
      const rewardState = gameReducer(victoryState, { type: 'PROCEED_TO_REWARD' });
      const finalState = gameReducer(rewardState, { type: 'CLAIM_CARD_REWARD' });

      // Final boss victory must return to phase: 'map' with isCompleted: true for Arkham Gazette ending sequence
      expect(finalState.phase).toBe('map');
      expect(finalState.map?.isCompleted).toBe(true);
      expect(finalState.investigator.health).toBe(25); // Healed to full
      expect(finalState.battleLog.some((log) => log.includes('首領決戰復甦'))).toBe(true);
    });

    it('handles generateInvestigationMap predicate correctly for deterministic vs procedural', () => {
      // Default: deterministic base map template
      const baseMap = generateInvestigationMap();
      expect(baseMap.depth).toBe(1);
      expect(Object.keys(baseMap.nodes).length).toBe(12);

      // Explicit procedural: true at depth 1 produces 16 nodes
      const procMapDepth1 = generateInvestigationMap({ depth: 1, procedural: true });
      expect(procMapDepth1.depth).toBe(1);
      expect(Object.keys(procMapDepth1.nodes).length).toBe(16);

      // Depth 2 without explicit procedural flag defaults to procedural 16 nodes
      const procMapDepth2 = generateInvestigationMap({ depth: 2 });
      expect(procMapDepth2.depth).toBe(2);
      expect(Object.keys(procMapDepth2.nodes).length).toBe(16);
    });
  });

  describe('Tiered Card System & Evolving Market (Issue #20 / ADR-0015)', () => {
    it('generates Tier 1 reward cards and 15 obols for Depth 1 normal combat', () => {
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'victory',
        currentDepth: 1,
        map: generateInvestigationMap({ depth: 1 }),
      };

      const rewardState = gameReducer(state, { type: 'PROCEED_TO_REWARD' });
      expect(rewardState.phase).toBe('reward');
      expect(rewardState.rewardObols).toBe(15);
      expect(rewardState.rewardCards).toHaveLength(3);
      expect(rewardState.rewardCards?.every((c) => c.tier === 1)).toBe(true);
    });

    it('generates Tier 2 reward cards and 15 obols for Depth 2 normal combat', () => {
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'victory',
        currentDepth: 2,
        map: generateInvestigationMap({ depth: 2 }),
      };

      const rewardState = gameReducer(state, { type: 'PROCEED_TO_REWARD' });
      expect(rewardState.phase).toBe('reward');
      expect(rewardState.rewardObols).toBe(15);
      expect(rewardState.rewardCards).toHaveLength(3);
      expect(rewardState.rewardCards?.every((c) => c.tier === 2)).toBe(true);
    });

    it('generates Tier 3 reward cards and 15 obols for Depth 3 normal combat', () => {
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'victory',
        currentDepth: 3,
        map: generateInvestigationMap({ depth: 3 }),
      };

      const rewardState = gameReducer(state, { type: 'PROCEED_TO_REWARD' });
      expect(rewardState.phase).toBe('reward');
      expect(rewardState.rewardObols).toBe(15);
      expect(rewardState.rewardCards).toHaveLength(3);
      expect(rewardState.rewardCards?.every((c) => c.tier === 3)).toBe(true);
    });

    it('generates 50 obols and Tier 3 cards (3 選 1) upon defeating Depth 1 Boss', () => {
      const map = generateInvestigationMap({ depth: 1 });
      const bossNodeId = map.layers[map.layers.length - 1][0];

      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'victory',
        currentDepth: 1,
        map: {
          ...map,
          currentNodeId: bossNodeId,
        },
      };

      const rewardState = gameReducer(state, { type: 'PROCEED_TO_REWARD' });
      expect(rewardState.rewardObols).toBe(50);
      expect(rewardState.rewardCards).toHaveLength(3);
      expect(rewardState.rewardCards?.every((c) => c.tier === 3)).toBe(true);
    });

    it('generates 50 obols and all 4 Tier 4+ Exclusive cards (4 選 1) upon defeating Depth 2 Boss', () => {
      const map = generateInvestigationMap({ depth: 2 });
      const bossNodeId = map.layers[map.layers.length - 1][0];

      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'victory',
        currentDepth: 2,
        map: {
          ...map,
          currentNodeId: bossNodeId,
        },
      };

      const rewardState = gameReducer(state, { type: 'PROCEED_TO_REWARD' });
      expect(rewardState.rewardObols).toBe(50);
      expect(rewardState.rewardCards).toHaveLength(4);
      expect(rewardState.rewardCards?.every((c) => c.tier === 4)).toBe(true);

      const cardNames = rewardState.rewardCards?.map((c) => c.name);
      expect(cardNames).toContain('屠神裁決爆轟');
      expect(cardNames).toContain('舊神庇護之陣');
      expect(cardNames).toContain('超維虛空湮滅');
      expect(cardNames).toContain('源初星辰啟示');
    });

    it('evolves Black Market inventory dynamically across Depth 1, Depth 2, and Depth 3', () => {
      // Depth 1 Market
      const depth1Items = generateMarketItemsForDepth(1);
      expect(depth1Items.some((item) => item.card?.name === '雙管獵槍' && item.card?.tier === 1)).toBe(true);
      expect(depth1Items.some((item) => item.name === '軍用嗎啡注射劑')).toBe(true);

      // Depth 2 Market
      const depth2Items = generateMarketItemsForDepth(2);
      expect(depth2Items.some((item) => item.card?.name === '泵動式散彈槍' && item.card?.tier === 2)).toBe(true);
      expect(depth2Items.some((item) => item.card?.name === '鋼鐵意志屏障' && item.card?.tier === 2)).toBe(true);
      expect(depth2Items.some((item) => item.name === '高級戰地醫療箱' && item.healAmount === 12)).toBe(true);

      // Depth 3 Market
      const depth3Items = generateMarketItemsForDepth(3);
      expect(depth3Items.some((item) => item.card?.name === '達姆高爆彈連射' && item.card?.tier === 3)).toBe(true);
      expect(depth3Items.some((item) => item.card?.name === '不可侵犯之壁' && item.card?.tier === 3)).toBe(true);
      expect(depth3Items.some((item) => item.name === '禁忌復甦針劑' && item.healAmount === 16)).toBe(true);
    });

    it('claims Tier 4+ card and executes its combat effect accurately', () => {
      const godSlayerCard = TIER_4_EXCLUSIVE_CARDS.find((c) => c.name === '屠神裁決爆轟')!;
      expect(godSlayerCard).toBeDefined();

      const combatState: GameState = {
        ...createInitialCombatState(),
        phase: 'combat',
        turn: 1,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          stamina: 3,
        },
        currentEnemy: {
          ...cloneEnemy(INITIAL_GHOUL),
          health: 50,
          maxHealth: 50,
          armor: 0,
        },
        hand: [godSlayerCard],
        sanityDeck: [],
        discardPile: [],
      };

      const afterPlay = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: godSlayerCard.id },
      });

      // 50 - 34 damage = 16 health, 3 - 2 stamina = 1 stamina
      expect(afterPlay.currentEnemy.health).toBe(16);
      expect(afterPlay.investigator.stamina).toBe(1);
      expect(afterPlay.discardPile).toHaveLength(1);
      expect(afterPlay.discardPile[0].name).toBe('屠神裁決爆轟');
    });

    it('loads depth-appropriate market inventory when navigating to market node', () => {
      const mapDepth2 = generateInvestigationMap({ depth: 2 });
      let marketNodeId = '';
      for (const [id, node] of Object.entries(mapDepth2.nodes)) {
        if (node.type === 'market') {
          marketNodeId = id;
          break;
        }
      }

      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'map',
        currentDepth: 2,
        map: {
          ...mapDepth2,
          nodes: {
            ...mapDepth2.nodes,
            [marketNodeId]: {
              ...mapDepth2.nodes[marketNodeId],
              status: 'accessible',
            },
          },
        },
      };

      const marketState = gameReducer(state, {
        type: 'NAVIGATE_TO_NODE',
        payload: { nodeId: marketNodeId },
      });

      expect(marketState.phase).toBe('market');
      expect(marketState.marketItems).toBeDefined();
      expect(marketState.marketItems?.some((item) => item.name === '泵動式散彈槍')).toBe(true);
    });
  });

  describe('Abyssal Seals & Hidden Depth 4 Mechanics (ADR-0015, Issue #21)', () => {
    it('claims Depth 1 Abyssal Seal Fragment 1, adds 0 obols, heals to full, and advances to depth_transition', () => {
      const map = generateInvestigationMap({ depth: 1 });
      const bossNodeId = map.layers[map.layers.length - 1][0];

      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'reward',
        currentDepth: 1,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 8,
          maxHealth: 25,
          obols: 30,
        },
        rewardObols: 50,
        map: {
          ...map,
          currentNodeId: bossNodeId,
        },
      };

      const result = gameReducer(state, { type: 'CLAIM_ABYSSAL_SEAL' });
      expect(result.phase).toBe('depth_transition');
      expect(result.investigator.health).toBe(25); // Healed to full
      expect(result.investigator.obols).toBe(30); // 0 obols gained (forsaken)
      expect(result.rewardObols).toBeUndefined();

      const allCards = getAllPermanentCards(result);
      expect(allCards.some((c) => c.name === ABYSSAL_FRAGMENT_1.name)).toBe(true);
      expect(allCards.some((c) => c.isUnplayable === true)).toBe(true);
      expect(result.battleLog.some((l) => l.includes('承受深淵封印'))).toBe(true);
    });

    it('claims Depth 2 Abyssal Seal Fragment 2, adds 0 obols, heals to full, and advances to depth_transition', () => {
      const map = generateInvestigationMap({ depth: 2 });
      const bossNodeId = map.layers[map.layers.length - 1][0];

      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'reward',
        currentDepth: 2,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 12,
          maxHealth: 25,
          obols: 45,
        },
        rewardObols: 50,
        map: {
          ...map,
          currentNodeId: bossNodeId,
        },
      };

      const result = gameReducer(state, { type: 'CLAIM_ABYSSAL_SEAL' });
      expect(result.phase).toBe('depth_transition');
      expect(result.investigator.health).toBe(25);
      expect(result.investigator.obols).toBe(45);

      const allCards = getAllPermanentCards(result);
      expect(allCards.some((c) => c.name === ABYSSAL_FRAGMENT_2.name)).toBe(true);
    });

    it('guards PLAY_CARD against unplayable cards in combat', () => {
      const unplayableCard: Card = {
        ...ABYSSAL_FRAGMENT_1,
        id: 'test_unplayable_frag_1',
      };

      const combatState: GameState = {
        ...createInitialCombatState(),
        phase: 'combat',
        hand: [unplayableCard],
        investigator: {
          ...INITIAL_INVESTIGATOR,
          stamina: 3,
        },
        battleLog: ['戰鬥開始'],
      };

      const afterPlay = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: unplayableCard.id },
      });

      // Card must remain in hand and stamina must not be consumed
      expect(afterPlay.hand).toHaveLength(1);
      expect(afterPlay.hand[0].id).toBe(unplayableCard.id);
      expect(afterPlay.investigator.stamina).toBe(3);
      expect(afterPlay.battleLog[0]).toContain('深淵封印殘片');
      expect(afterPlay.battleLog[0]).toContain('無法被打出');
    });

    it('guards PLAY_CARD against generic unplayable cards with non-abyssal log', () => {
      const genericCard: Card = {
        ...createMockCard(),
        id: 'generic_unplayable',
        name: '石化封禁',
        isUnplayable: true,
      };

      const combatState: GameState = {
        ...createInitialCombatState(),
        phase: 'combat',
        hand: [genericCard],
        investigator: {
          ...INITIAL_INVESTIGATOR,
          stamina: 3,
        },
        battleLog: ['戰鬥開始'],
      };

      const afterPlay = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: genericCard.id },
      });

      expect(afterPlay.hand).toHaveLength(1);
      expect(afterPlay.battleLog[0]).toBe('【石化封禁】無法被打出！它沉重地佔據著手牌。');
    });

    it('diverges to Normal Ending directly on Depth 3 Boss victory when player lacks abyssal fragments', () => {
      const map = generateInvestigationMap({ depth: 3 });
      const bossNodeId = map.layers[map.layers.length - 1][0];

      const victoryState: GameState = {
        ...createInitialCombatState(),
        phase: 'victory',
        currentDepth: 3,
        sanityDeck: OCCUPATIONS.investigator.deck.map((c) => ({ ...c })),
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 10,
          maxHealth: 25,
        },
        map: {
          ...map,
          currentNodeId: bossNodeId,
        },
      };

      expect(hasBothAbyssalFragments(victoryState)).toBe(false);

      const presetCards = OCCUPATIONS.investigator.deck.map((c) => ({ ...c }));
      const result = gameReducer(victoryState, {
        type: 'PROCEED_TO_REWARD',
        payload: { shuffledDeck: presetCards },
      });
      // Normal ending: finishes map, sets isCompleted = true, phase = 'map'
      expect(result.phase).toBe('map');
      expect(result.map?.isCompleted).toBe(true);
      expect(result.abyssalSealFused).toBeFalsy();
      expect(result.investigator.health).toBe(25); // Heals to full on boss defeat
      expect(result.hand[0].id).toBe(presetCards[0].id);
      expect(result.battleLog.some((l) => l.includes('阿卡姆常規終局'))).toBe(true);
    });

    it('fuses 3 fragments into COMPLETE_ANCIENT_SEAL and unlocks Depth 4 upon Depth 3 Boss victory with fragments 1 and 2', () => {
      const map = generateInvestigationMap({ depth: 3 });
      const bossNodeId = map.layers[map.layers.length - 1][0];

      const baseDeck = OCCUPATIONS.investigator.deck.map((c) => ({ ...c }));
      const deckWithFragments: Card[] = [
        ...baseDeck,
        { ...ABYSSAL_FRAGMENT_1 },
        { ...ABYSSAL_FRAGMENT_2 },
      ];

      const victoryState: GameState = {
        ...createInitialCombatState(),
        phase: 'victory',
        currentDepth: 3,
        sanityDeck: deckWithFragments,
        hand: [],
        discardPile: [],
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 10,
          maxHealth: 25,
          obols: 60,
        },
        map: {
          ...map,
          currentNodeId: bossNodeId,
        },
      };

      expect(hasBothAbyssalFragments(victoryState)).toBe(true);

      const rewardState = gameReducer(victoryState, { type: 'PROCEED_TO_REWARD' });
      expect(rewardState.phase).toBe('reward');
      expect(rewardState.abyssalSealFused).toBe(true);
      expect(rewardState.rewardObols).toBe(50);
      expect(rewardState.rewardCards).toHaveLength(4); // 4-pick-1 Tier 4+ cards
      expect(rewardState.battleLog.some((l) => l.includes('白色真理共鳴'))).toBe(true);

      // Verify fragments are removed and COMPLETE_ANCIENT_SEAL is in deck
      const rewardDeck = getAllPermanentCards(rewardState);
      expect(rewardDeck.some((c) => c.name === ABYSSAL_FRAGMENT_1.name)).toBe(false);
      expect(rewardDeck.some((c) => c.name === ABYSSAL_FRAGMENT_2.name)).toBe(false);
      expect(rewardDeck.some((c) => c.name === COMPLETE_ANCIENT_SEAL.name)).toBe(true);

      // Claim reward and verify transition to Depth 4 (depth_transition)
      const transitionState = gameReducer(rewardState, { type: 'CLAIM_CARD_REWARD' });
      expect(transitionState.phase).toBe('depth_transition');
      expect(transitionState.investigator.health).toBe(25);
      expect(transitionState.investigator.obols).toBe(110); // 60 + 50

      // Complete depth transition to reach Depth 4
      const depth4State = gameReducer(transitionState, { type: 'COMPLETE_DEPTH_TRANSITION' });
      expect(depth4State.phase).toBe('map');
      expect(depth4State.currentDepth).toBe(4);
      expect(depth4State.map?.name).toBe('星辰正位 · 拉萊耶核心終局圖');
      expect(depth4State.map?.isCompleted).toBeFalsy();
    });

    it('inherently places COMPLETE_ANCIENT_SEAL as first card in opening hand during setupCombatDeck', () => {
      const cards: Card[] = [
        ...OCCUPATIONS.investigator.deck.map((c) => ({ ...c })),
        { ...COMPLETE_ANCIENT_SEAL },
      ];

      const { hand, sanityDeck } = setupCombatDeck(cards, 'investigator');
      expect(hand).toHaveLength(4);
      expect(hand[0].name).toBe(COMPLETE_ANCIENT_SEAL.name);
      expect(sanityDeck.some((c) => c.name === COMPLETE_ANCIENT_SEAL.name)).toBe(false);
    });
  });

  describe('Depth 4 Divine Immortality & True Ending Strike (Issue #22 / ADR-0015)', () => {
    const slashCard: Card = {
      id: 'test_heavy_slash',
      name: '重磅斬擊',
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'damage', value: 999 }],
      description: '造成 999 點物理傷害。',
      flavorText: '「全力一擊。」',
    };

    it('locks enemy health at minimum 1 HP against normal card attacks when enemy has divineImmortality', () => {
      const divineEnemy: Enemy = {
        ...INITIAL_STAR_SPAWN,
        health: 50,
        maxHealth: 150,
        armor: 0,
        divineImmortality: true,
      };

      const combatState: GameState = {
        ...createInitialCombatState(),
        phase: 'combat',
        currentEnemy: divineEnemy,
        hand: [slashCard],
        investigator: {
          ...INITIAL_INVESTIGATOR,
          stamina: 3,
        },
        battleLog: [],
      };

      const afterPlay = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: slashCard.id },
      });

      // Health must be locked at 1, combat phase must remain 'combat'
      expect(afterPlay.currentEnemy.health).toBe(1);
      expect(afterPlay.phase).toBe('combat');
      expect(afterPlay.battleLog[0]).toContain('神性不朽');
      expect(afterPlay.battleLog[0]).toContain('生命值被鎖定在 1 點');
    });

    it('prevents playing COMPLETE_ANCIENT_SEAL when divine enemy health > 1', () => {
      const divineEnemy: Enemy = {
        ...INITIAL_STAR_SPAWN,
        health: 20,
        maxHealth: 150,
        armor: 0,
        divineImmortality: true,
      };

      const sealCard: Card = {
        ...COMPLETE_ANCIENT_SEAL,
      };

      const combatState: GameState = {
        ...createInitialCombatState(),
        phase: 'combat',
        currentEnemy: divineEnemy,
        hand: [sealCard],
        investigator: {
          ...INITIAL_INVESTIGATOR,
          stamina: 3,
        },
        battleLog: ['戰鬥開始'],
      };

      const afterPlay = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: sealCard.id },
      });

      // Card must remain in hand, log notes seal is locked
      expect(afterPlay.hand).toHaveLength(1);
      expect(afterPlay.hand[0].id).toBe(sealCard.id);
      expect(afterPlay.currentEnemy.health).toBe(20);
      expect(afterPlay.battleLog[0]).toContain('古印封印中');
      expect(afterPlay.battleLog[0]).toContain('生命值尚未削弱至 1 點極限');
    });

    it('executes divine boss to 0 HP, wins combat, and sets isTrueEnding = true when playing COMPLETE_ANCIENT_SEAL at 1 HP', () => {
      const divineEnemy: Enemy = {
        ...INITIAL_STAR_SPAWN,
        health: 1,
        maxHealth: 150,
        armor: 0,
        divineImmortality: true,
      };

      const sealCard: Card = {
        ...COMPLETE_ANCIENT_SEAL,
      };

      const combatState: GameState = {
        ...createInitialCombatState(),
        phase: 'combat',
        currentEnemy: divineEnemy,
        hand: [sealCard],
        investigator: {
          ...INITIAL_INVESTIGATOR,
          stamina: 3,
        },
        battleLog: [],
      };

      const afterPlay = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: sealCard.id },
      });

      expect(afterPlay.currentEnemy.health).toBe(0);
      expect(afterPlay.phase).toBe('victory');
      expect(afterPlay.isTrueEnding).toBe(true);
      expect(afterPlay.battleLog[0]).toContain('達成真結局');
      expect(afterPlay.battleLog.some((l) => l.includes('太古星辰封滅'))).toBe(true);
    });

    it('transitions to map with isCompleted = true and isTrueEnding = true upon claiming final boss victory', () => {
      const map = generateInvestigationMap({ depth: 4 });
      const bossNodeId = map.layers[map.layers.length - 1][0];

      const victoryState: GameState = {
        ...createInitialCombatState(),
        phase: 'victory',
        currentDepth: 4,
        isTrueEnding: true,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 10,
          maxHealth: 25,
          obols: 80,
        },
        map: {
          ...map,
          currentNodeId: bossNodeId,
        },
      };

      const rewardState = gameReducer(victoryState, { type: 'PROCEED_TO_REWARD' });
      expect(rewardState.phase).toBe('reward');
      expect(rewardState.rewardObols).toBe(50);

      const finalState = gameReducer(rewardState, { type: 'CLAIM_CARD_REWARD' });
      expect(finalState.phase).toBe('map');
      expect(finalState.map?.isCompleted).toBe(true);
      expect(finalState.isTrueEnding).toBe(true);
      expect(finalState.investigator.health).toBe(25); // Healed to full
      expect(finalState.investigator.obols).toBe(130); // 80 + 50
    });
  });
});

