import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialCombatState, applyDamage } from './gameReducer';
import { INITIAL_GHOUL, INITIAL_INVESTIGATOR } from './initialData';
import type { Card, GameState } from '../types/game';

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
    expect(nextState.battleLog.some((log) => log.includes('瘋狂') || log.includes('狂暴'))).toBe(true);
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
      flavorText: '狂暴',
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
});




