import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
} from './eventData';
import { getCardsByTier } from './cards/registry';
import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  COMPLETE_ANCIENT_SEAL,
  hasBothAbyssalFragments,
  getAllPermanentCards,
} from './abyssalSeals';
import {
  ELDER_SIGN_AMULET,
  POCKET_WATCH,
  VITALITY_ELIXIR,
  OBSIDIAN_MIRROR,
  DREAD_TALISMAN,
  ELDRITCH_LANTERN,
} from './relics';
import { createStatusEffect } from './statusEffects';
import { ELDRITCH_TRAIT_DEFINITIONS } from './enemyTraits';
import { getEnemyTemplateById, getBossByDepth } from './enemyCatalog';
import { getFreshEnemyTemplate } from './gameReducer';
import type { Card, GameState, Enemy, InvestigationMap, DepthLevel, MythosEvent, Relic } from '../types/game';

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
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes combat with investigator, ghoul enemy, and 4 drawn cards', () => {
    const initialState = createInitialCombatState();

    expect(initialState.phase).toBe('combat');
    expect(initialState.turn).toBe(1);
    expect(initialState.investigator.health).toBe(25);
    expect(initialState.investigator.stamina).toBe(3);
    expect(initialState.investigator.armor).toBe(0);

    // Initial 12 cards: 2 drawn into hand (handCapacity), 10 remaining in sanityDeck (ADR-0018)
    expect(initialState.hand.length).toBe(2);
    expect(initialState.sanityDeck.length).toBe(10);
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

  it('preserves unplayed cards (Hand Retention) and fixed draws handCapacity on turn end', () => {
    const state = createInitialCombatState();
    // Play 1 card, leaving 1 in hand
    const cardToPlay = state.hand[0];
    const stateAfterPlay = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: cardToPlay.id },
    });
    expect(stateAfterPlay.hand.length).toBe(1);

    const retainedCardIds = stateAfterPlay.hand.map((c) => c.id);

    // End turn
    const stateAfterTurn = gameReducer(stateAfterPlay, { type: 'END_TURN' });

    // The 1 retained card should still be in hand
    retainedCardIds.forEach((id) => {
      expect(stateAfterTurn.hand.some((c) => c.id === id)).toBe(true);
    });

    // Fixed draw of 2 cards (1 retained + 2 drawn = 3 total)
    expect(stateAfterTurn.hand.length).toBe(3);

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
    // 2 cards in hand (at handCapacity)
    const initialHand = [createMockCard(), createMockCard()];
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

    // Enemy erodes 2 cards (5 - 2 = 3), then fixed draws 2 cards (3 - 2 = 1)
    expect(nextState.sanityDeck.length).toBe(1);
    expect(nextState.discardPile.length).toBe(2);
    expect(nextState.hand.length).toBe(4); // 2 retained + 2 drawn
    expect(nextState.investigator.health).toBe(25);
    expect(nextState.battleLog.some((log) => log.includes('侵蝕了你 2 點理智牌庫'))).toBe(true);
  });

  it('handles zero sanity erosion gracefully with breakdown narrative', () => {
    const state: GameState = {
      ...createInitialCombatState(),
      sanityDeck: [],
      hand: [createMockCard(), createMockCard()],
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
    // In madness state, fixed draws handCapacity (2) temporary black madness cards (1 retained + 2 madness = 3)
    expect(nextState.hand.length).toBe(3);
    expect(nextState.hand.filter((c) => c.category === 'madness').length).toBe(2);
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
      hand: [createMockCard(), createMockCard()],
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

    // Fixed draws handCapacity (2) cards (1 retained + 2 madness = 3)
    expect(nextState.hand.length).toBe(3);
    // 2 new cards must all be temporary black madness cards
    const newlyDrawnCards = nextState.hand.filter((c) => c.id !== 'retained_1');
    expect(newlyDrawnCards.length).toBe(2);
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
    // Hand replenished with fixed draw 2: 1 kept + 1 normal from deck + 1 temporary black madness card = 3
    expect(nextState.hand.length).toBe(3);
    expect(nextState.hand[0].id).toBe('kept_card_1');
    expect(nextState.hand[1].id).toBe('last_deck_card');
    const madnessCards = nextState.hand.filter((c) => c.category === 'madness');
    expect(madnessCards.length).toBe(1);
    expect(madnessCards.every((c) => c.isTemporary)).toBe(true);
    expect(nextState.battleLog.some((log) => log.includes('手牌缺額立即補入 1 張臨時黑色瘋狂卡'))).toBe(true);
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
    expect(nextState.map?.layers.length).toBe(16);
    expect(nextState.investigator.name).toBe('愛德華·皮爾斯');
    expect(nextState.investigator.occupation).toBe('私家偵探');
    expect(nextState.investigator.health).toBe(25);
    expect(nextState.investigator.obols).toBe(15);
    expect(nextState.hand.length).toBe(2);
    expect(nextState.sanityDeck.length).toBe(10); // 12 total
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
    expect(nextState.investigator.name).toBe('艾蓮諾·凡斯');
    expect(nextState.investigator.occupation).toBe('秘術學者');
    expect(nextState.investigator.health).toBe(25);
    expect(nextState.investigator.obols).toBe(20);
    expect(nextState.hand.length).toBe(2);
    expect(nextState.sanityDeck.length).toBe(10); // 12 total
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
      description: '造成 9 點秘術傷害。',
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
      description: '造成 16 點秘術傷害。',
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

    // 6. Full sanity reset: hand drawn to 2, sanityDeck has remaining 4
    expect(nextState.hand.length).toBe(2);
    expect(nextState.sanityDeck.length).toBe(4);
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
    expect(nextState.hand.length).toBe(2);
    expect(nextState.sanityDeck.length).toBe(10);
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
    const bossNodeId = map.layers[map.layers.length - 1][0];
    map.nodes[bossNodeId].status = 'accessible';

    const bossCombatState = gameReducer(
      { ...createInitialCombatState(), phase: 'map', map },
      { type: 'NAVIGATE_TO_NODE', payload: { nodeId: bossNodeId } }
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
    expect(resetState.map?.currentNodeId).toBe(bossNodeId);
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

    expect(nextState.hand.map((c) => c.id)).toEqual(['deterministic_E', 'deterministic_D']);
    expect(nextState.sanityDeck.map((c) => c.id)).toEqual(['deterministic_C', 'deterministic_B', 'deterministic_A']);
  });

  it('fisherYatesShuffle uniformly preserves elements and accepts custom random function', () => {
    const original = [1, 2, 3, 4, 5];
    const pseudoRandom = () => 0.42; // Deterministic pseudo-random
    const shuffled = fisherYatesShuffle(original, pseudoRandom);

    expect(shuffled.length).toBe(original.length);
    expect(new Set(shuffled)).toEqual(new Set(original));
  });

  it('ensures zero forbidden domain terms (護盾, 招架, 格擋, 狂暴, 血量, 體力, 抽牌堆, 固有卡, 戰術牌) across all cards and occupations', () => {
    const forbiddenRegex = /護盾|招架|格擋|狂暴|血量|體力|抽牌堆|固有卡|戰術牌|戰術卡/;

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
  it('generateInvestigationMap generates a valid 16-layer DAG with accessible entry nodes', () => {
    const map = generateInvestigationMap();

    expect(map.layers.length).toBe(16);
    expect(map.currentNodeId).toBeNull();

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
      if (node.layer < 15) {
        expect(node.nextNodes.length).toBeGreaterThan(0);
        for (const nextId of node.nextNodes) {
          const nextNode = map.nodes[nextId];
          expect(nextNode).toBeDefined();
          expect(nextNode.layer).toBe(node.layer + 1);
        }
      } else {
        expect(node.layer).toBe(15);
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
    expect(nextState.map?.layers.length).toBe(16);
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
    expect(nextState.hand.length).toBe(2);
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
    const bossNodeId = map.layers[map.layers.length - 1][0];
    map.nodes[bossNodeId].status = 'accessible';
    const mapState: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
    };

    const nextState = gameReducer(mapState, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: bossNodeId },
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
    expect(nextState.currentEvent?.title.length).toBeGreaterThan(0);
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
    expect(nextState.marketItems?.length).toBeGreaterThanOrEqual(5);
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

  describe('Sanctuary Hearth Purge (Issue #54 / ADR-0032)', () => {
    it('USE_SANCTUARY purge burns selected card permanently and marks sanctuaryUsed', () => {
      const cardA = createMockCard({ id: 'c1', name: '破舊風衣' });
      const cardB = createMockCard({ id: 'c2', name: '左輪射擊' });
      const cardC = createMockCard({ id: 'c3', name: '恐懼幻影' });

      const sanctuaryState: GameState = {
        ...createInitialCombatState(),
        phase: 'sanctuary',
        sanctuaryUsed: false,
        sanityDeck: [cardA, cardB, cardC],
        hand: [],
        discardPile: [],
      };

      const purgedState = gameReducer(sanctuaryState, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'purge' as any, cardId: 'c3' } as any,
      });

      expect(purgedState.sanctuaryUsed).toBe(true);
      expect(purgedState.sanityDeck).toHaveLength(2);
      expect(purgedState.sanityDeck.some((c) => c.id === 'c3')).toBe(false);
      expect(purgedState.battleLog[0]).toContain('恐懼幻影');
      expect(purgedState.battleLog[0]).toContain('壁爐餘火');

      // Attempting to bandage or meditate after purge is disallowed (mutually exclusive)
      const afterPurgeState = gameReducer(purgedState, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'bandage' },
      });
      expect(afterPurgeState).toBe(purgedState);
    });

    it('USE_SANCTUARY purge protects against purging when deck size <= 1', () => {
      const cardA = createMockCard({ id: 'c1', name: '唯一卡牌' });

      const sanctuaryState: GameState = {
        ...createInitialCombatState(),
        phase: 'sanctuary',
        sanctuaryUsed: false,
        sanityDeck: [cardA],
        hand: [],
        discardPile: [],
      };

      const result = gameReducer(sanctuaryState, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'purge' as any, cardId: 'c1' } as any,
      });

      expect(result.sanctuaryUsed).toBe(false);
      expect(result.sanityDeck).toHaveLength(1);
    });
  });

  describe('Long-Haul Survival Economy & Field Dressing (Issue #45 / ADR-0023)', () => {
    it('CLAIM_FIELD_DRESSING recovers 4 health, discards card drafting, and collects obols', () => {
      const cardA = createMockCard({ id: 'c1' });
      const cardB = createMockCard({ id: 'c2' });
      const rewardCard = createMockCard({ id: 'draft_card_1', name: '強力射擊' });

      const rewardState: GameState = {
        ...createInitialCombatState(),
        phase: 'reward',
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 14,
          maxHealth: 25,
          obols: 20,
        },
        rewardCards: [rewardCard],
        rewardObols: 15,
        sanityDeck: [cardA],
        hand: [cardB],
        discardPile: [],
      };

      const nextState = gameReducer(rewardState, {
        type: 'CLAIM_FIELD_DRESSING',
      });

      // Recovers 4 health: 14 + 4 = 18
      expect(nextState.investigator.health).toBe(18);
      // Collects obols: 20 + 15 = 35
      expect(nextState.investigator.obols).toBe(35);
      // Does not draft the reward card
      const allPermanentCards = [
        ...nextState.hand,
        ...nextState.sanityDeck,
        ...nextState.discardPile,
      ];
      expect(allPermanentCards.some((c) => c.id.includes('draft_card_1'))).toBe(false);
      expect(allPermanentCards.length).toBe(2);
      // Battle log reflects field dressing
      expect(nextState.battleLog.some((log) => log.includes('戰地應急包紮'))).toBe(true);
      expect(nextState.battleLog.some((log) => log.includes('恢復 +4 點'))).toBe(true);
    });

    it('CLAIM_FIELD_DRESSING respects custom healAmount and caps at maxHealth', () => {
      const rewardState: GameState = {
        ...createInitialCombatState(),
        phase: 'reward',
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 23,
          maxHealth: 25,
        },
        rewardCards: [],
        rewardObols: 10,
        sanityDeck: [],
        hand: [],
      };

      const nextState = gameReducer(rewardState, {
        type: 'CLAIM_FIELD_DRESSING',
        payload: { healAmount: 4 },
      });

      // 23 + 4 = 27, capped at 25
      expect(nextState.investigator.health).toBe(25);
    });

    it('CLAIM_FIELD_DRESSING on boss victory fully restores health to maxHealth (Heal to Full)', () => {
      const map = generateInvestigationMap({ depth: 1 });
      const bossNodeId = map.layers[map.layers.length - 1][0];

      const rewardState: GameState = {
        ...createInitialCombatState(),
        phase: 'reward',
        currentDepth: 1,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 5,
          maxHealth: 25,
        },
        map: {
          ...map,
          currentNodeId: bossNodeId,
        },
        rewardCards: [],
        rewardObols: 50,
      };

      const nextState = gameReducer(rewardState, {
        type: 'CLAIM_FIELD_DRESSING',
      });

      // Boss defeat heals to full!
      expect(nextState.investigator.health).toBe(25);
      expect(nextState.battleLog.some((log) => log.includes('首領決戰復甦'))).toBe(true);
    });

    it('USE_SANCTUARY provides 15 HP heavy healing at Mid-Depth Haven (Layer 8, Depths 1~3)', () => {
      const map = generateInvestigationMap({ depth: 1 });
      const havenNodeId = map.layers[8][0];

      const havenState: GameState = {
        ...createInitialCombatState(),
        phase: 'sanctuary',
        currentDepth: 1,
        sanctuaryUsed: false,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          health: 6,
          maxHealth: 25,
          obols: 10,
        },
        map: {
          ...map,
          currentNodeId: havenNodeId,
        },
      };

      const healedState = gameReducer(havenState, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'bandage' },
      });

      // 6 + 15 = 21 HP!
      expect(healedState.investigator.health).toBe(21);
      expect(healedState.sanctuaryUsed).toBe(true);
      expect(healedState.investigator.obols).toBe(5);
      expect(healedState.battleLog[0]).toContain('第 8 層中繼避難所');
      expect(healedState.battleLog[0]).toContain('進行重度休整與外科縫合');
      expect(healedState.battleLog[0]).toContain('恢復了 15 點肉體生命值');
    });
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
    const healItem = defaultItems.find((i) => i.type === 'heal')!;
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

  it('ensures zero forbidden domain terms (護盾, 招架, 格擋, 狂暴, 血量, 體力, 抽牌堆, 固有卡, 戰術牌) across map, events, and market', () => {
    const forbiddenRegex = /護盾|招架|格擋|狂暴|血量|體力|抽牌堆|固有卡|戰術牌|戰術卡/;

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
    // Opening hand must have exactly handCapacity (2 cards), NOT 5!
    expect(combatState.hand.length).toBe(2);
    // Sanity deck has 13 - 2 = 11 cards
    expect(combatState.sanityDeck.length).toBe(11);
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

      // Opening hand should precisely match first 2 cards of deterministicDeck
      expect(combatState.hand.map((c) => c.id)).toEqual(deterministicDeck.slice(0, 2).map((c) => c.id));
      expect(combatState.sanityDeck.map((c) => c.id)).toEqual(deterministicDeck.slice(2).map((c) => c.id));
    });

    it('deduplicates helper functions: cloneEnemy and setupCombatDeck preserve pure state invariants', () => {
      const cloned = cloneEnemy(INITIAL_SHOGGOTH);
      expect(cloned).toEqual(INITIAL_SHOGGOTH);
      expect(cloned).not.toBe(INITIAL_SHOGGOTH);

      const cards = INVESTIGATOR_DECK.map((c) => ({ ...c }));
      const { hand, sanityDeck } = setupCombatDeck(cards, 'investigator');
      expect(hand.length).toBe(2);
      expect(sanityDeck.length).toBe(cards.length - 2);
    });

    it('marks map.isCompleted = true upon boss node defeat in CLAIM_CARD_REWARD', () => {
      const map = generateInvestigationMap();
      const bossNodeId = map.layers[map.layers.length - 1][0];
      map.nodes[bossNodeId].status = 'accessible';

      const bossCombatState = gameReducer(
        {
          ...createInitialCombatState(),
          phase: 'map',
          map,
        },
        {
          type: 'NAVIGATE_TO_NODE',
          payload: { nodeId: bossNodeId },
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
      expect(postBossTransitionState.map?.nodes[bossNodeId].status).toBe('visited');

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
      // 1. Procedural generation creates valid 16-layer DAG
      const procMap = generateProceduralInvestigationMap();
      expect(procMap.layers.length).toBe(16);
      expect(procMap.nodes[procMap.layers[15][0]].type).toBe('boss');
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
      expect(state.map?.layers.length).toBe(16);
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
      expect(nextState.investigator.name).toBe('愛德華·皮爾斯');
      expect(nextState.map).toBeDefined();
      expect(nextState.sanityDeck.length).toBe(10);
      expect(nextState.hand.length).toBe(2);
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

    it('generates 16 layers for Depths 1, 2, 3 with zero dead ends', () => {
      for (const depth of [1, 2, 3] as const) {
        const map = generateProceduralInvestigationMap({ depth });
        expect(map.depth).toBe(depth);
        expect(map.layers.length).toBe(16);

        // Verify boss node is at layer 15
        const bossNodeId = map.layers[15][0];
        expect(map.nodes[bossNodeId].type).toBe('boss');

        // Verify reachability: all non-boss nodes must have outgoing edges
        for (let l = 0; l < 15; l++) {
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

    it('generates 8 layers for Depth 4', () => {
      const map = generateProceduralInvestigationMap({ depth: 4 });
      expect(map.depth).toBe(4);
      expect(map.layers.length).toBe(8);

      const bossNodeId = map.layers[7][0];
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
      expect(depth2State.map?.layers.length).toBe(16);
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
      const bossNodeId = depth2Map.layers[depth2Map.layers.length - 1][0];

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
      expect(depth3State.map?.layers.length).toBe(16);
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
      const bossNodeId = depth4Map.layers[depth4Map.layers.length - 1][0];

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
      const baseMap = generateInvestigationMap();
      expect(baseMap.depth).toBe(1);
      expect(baseMap.layers.length).toBe(16);

      // Explicit procedural: true at depth 1 produces 16 layers
      const procMapDepth1 = generateInvestigationMap({ depth: 1, procedural: true });
      expect(procMapDepth1.depth).toBe(1);
      expect(procMapDepth1.layers.length).toBe(16);

      // Depth 2 produces procedural 16 layers
      const procMapDepth2 = generateInvestigationMap({ depth: 2 });
      expect(procMapDepth2.depth).toBe(2);
      expect(procMapDepth2.layers.length).toBe(16);

      // Depth 4 produces 8 layers
      const procMapDepth4 = generateInvestigationMap({ depth: 4 });
      expect(procMapDepth4.depth).toBe(4);
      expect(procMapDepth4.layers.length).toBe(8);
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
      const d1Cards = depth1Items.filter((item) => item.type === 'card');
      expect(d1Cards).toHaveLength(3);
      expect(d1Cards.every((item) => item.card?.tier === 1)).toBe(true);
      expect(depth1Items.some((item) => item.type === 'heal' && (item.healAmount ?? 0) > 0)).toBe(true);
      expect(depth1Items.some((item) => item.type === 'relic')).toBe(true);

      // Depth 2 Market
      const depth2Items = generateMarketItemsForDepth(2);
      const d2Cards = depth2Items.filter((item) => item.type === 'card');
      expect(d2Cards).toHaveLength(3);
      expect(d2Cards.every((item) => item.card?.tier === 2)).toBe(true);
      expect(depth2Items.some((item) => item.type === 'heal' && (item.healAmount ?? 0) >= 8)).toBe(true);
      expect(depth2Items.some((item) => item.type === 'relic')).toBe(true);

      // Depth 3 Market
      const depth3Items = generateMarketItemsForDepth(3);
      const d3Cards = depth3Items.filter((item) => item.type === 'card');
      expect(d3Cards).toHaveLength(3);
      expect(d3Cards.every((item) => item.card?.tier === 3)).toBe(true);
      expect(depth3Items.some((item) => item.type === 'heal' && (item.healAmount ?? 0) >= 10)).toBe(true);
      expect(depth3Items.some((item) => item.type === 'relic')).toBe(true);
    });

    it('claims Tier 4+ card and executes its combat effect accurately', () => {
      const godSlayerCard = getCardsByTier(4).find((c) => c.name === '屠神裁決爆轟')!;
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

      // 50 - 30 damage (6 x 5 piercing) = 20 health, 3 - 2 stamina = 1 stamina
      expect(afterPlay.currentEnemy.health).toBe(20);
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
      expect(marketState.marketItems?.filter((i) => i.type === 'card').every((i) => i.card?.tier === 2)).toBe(true);
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
      expect(hand).toHaveLength(2);
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

    it('locks enemy health at minimum 1 health against normal card attacks when enemy has divineImmortality', () => {
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

    it('executes divine boss to 0 health, wins combat, and sets isTrueEnding = true when playing COMPLETE_ANCIENT_SEAL at 1 health', () => {
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

  describe('Relics & Status Effects Dual-Track System (ADR-0018)', () => {
    it('ACQUIRE_RELIC updates maxHealth, current health, and handCapacity immediately', () => {
      const state = createInitialCombatState();
      const stateWithRelic = gameReducer(state, {
        type: 'ACQUIRE_RELIC',
        payload: { relic: VITALITY_ELIXIR },
      });

      expect(stateWithRelic.investigator.maxHealth).toBe(30);
      expect(stateWithRelic.investigator.health).toBe(30);
      expect(stateWithRelic.investigator.relics).toHaveLength(1);
      expect(stateWithRelic.investigator.relics?.[0].id).toBe('vitality_elixir');
      expect(stateWithRelic.battleLog[0]).toContain('活力秘藥');

      const stateWithWatch = gameReducer(stateWithRelic, {
        type: 'ACQUIRE_RELIC',
        payload: { relic: POCKET_WATCH },
      });
      expect(stateWithWatch.investigator.handCapacity).toBe(3);
      expect(stateWithWatch.investigator.relics).toHaveLength(2);
    });

    it('START_COMBAT applies starting armor, stamina bonus, and starting status effects from relics', () => {
      const inv = {
        ...INITIAL_INVESTIGATOR,
        relics: [ELDER_SIGN_AMULET, OBSIDIAN_MIRROR, DREAD_TALISMAN, ELDRITCH_LANTERN],
      };

      const combatState = gameReducer(createInitialGameState(), {
        type: 'START_COMBAT',
        payload: { investigator: inv },
      });

      expect(combatState.investigator.armor).toBe(5); // ELDER_SIGN_AMULET gives 5
      expect(combatState.investigator.stamina).toBe(4); // 3 + 1 from ELDRITCH_LANTERN
      expect(combatState.investigator.statusEffects).toHaveLength(2);
      expect(combatState.investigator.statusEffects?.find((e) => e.type === 'resilience')?.stacks).toBe(2);
      expect(combatState.investigator.statusEffects?.find((e) => e.type === 'might')?.stacks).toBe(1);
      expect(combatState.battleLog.some((l) => l.includes('舊日遺物護佑'))).toBe(true);
      expect(combatState.battleLog.some((l) => l.includes('舊日遺物共鳴'))).toBe(true);
    });

    it('PLAY_CARD applies might and vulnerable modifiers to attack damage', () => {
      const attackCard: Card = {
        id: 'test_strike',
        name: '突刺打擊',
        category: 'combat',
        costType: 'free',
        costValue: 0,
        isTemporary: false,
        effects: [{ type: 'damage', value: 6 }],
        description: '造成 6 點物理傷害。',
        flavorText: '',
      };

      const baseState = createInitialCombatState();
      const stateWithStatus: GameState = {
        ...baseState,
        hand: [attackCard],
        investigator: {
          ...baseState.investigator,
          statusEffects: [createStatusEffect('might', 2)],
        },
        currentEnemy: {
          ...baseState.currentEnemy,
          health: 30,
          maxHealth: 30,
          armor: 0,
          statusEffects: [createStatusEffect('vulnerable', 1)],
        },
      };

      // (6 base + 2 might) + 1 vulnerable = 9 damage!
      const afterPlay = gameReducer(stateWithStatus, {
        type: 'PLAY_CARD',
        payload: { cardId: 'test_strike' },
      });

      expect(afterPlay.currentEnemy.health).toBe(21); // 30 - 9
      expect(afterPlay.battleLog[0]).toContain('9 點傷害');
      expect(afterPlay.battleLog[0]).toContain('力量 +2');
      expect(afterPlay.battleLog[0]).toContain('易傷增傷');
    });

    it('PLAY_CARD applies resilience modifier to armor gain', () => {
      const shieldCard: Card = {
        id: 'test_block',
        name: '緊急防禦',
        category: 'skill',
        costType: 'free',
        costValue: 0,
        isTemporary: false,
        effects: [{ type: 'armor', value: 5 }],
        description: '獲得 5 點護甲。',
        flavorText: '',
      };

      const baseState = createInitialCombatState();
      const stateWithResilience: GameState = {
        ...baseState,
        hand: [shieldCard],
        investigator: {
          ...baseState.investigator,
          armor: 0,
          statusEffects: [createStatusEffect('resilience', 3)],
        },
      };

      // 5 base + 3 resilience = 8 armor!
      const afterPlay = gameReducer(stateWithResilience, {
        type: 'PLAY_CARD',
        payload: { cardId: 'test_block' },
      });

      expect(afterPlay.investigator.armor).toBe(8);
      expect(afterPlay.battleLog[0]).toContain('8 點護甲');
      expect(afterPlay.battleLog[0]).toContain('堅韌 +3');
    });

    it('PLAY_CARD supports apply_status card effect targeting self and enemy', () => {
      const applyCard: Card = {
        id: 'test_curse',
        name: '深淵刻印',
        category: 'skill',
        costType: 'free',
        costValue: 0,
        isTemporary: false,
        effects: [
          { type: 'apply_status', value: 2, statusType: 'might', target: 'self' },
          { type: 'apply_status', value: 3, statusType: 'vulnerable', target: 'enemy' },
        ],
        description: '',
        flavorText: '',
      };

      const baseState = createInitialCombatState();
      const stateWithCard: GameState = {
        ...baseState,
        hand: [applyCard],
      };

      const afterPlay = gameReducer(stateWithCard, {
        type: 'PLAY_CARD',
        payload: { cardId: 'test_curse' },
      });

      expect(afterPlay.investigator.statusEffects?.find((e) => e.type === 'might')?.stacks).toBe(2);
      expect(afterPlay.currentEnemy.statusEffects?.find((e) => e.type === 'vulnerable')?.stacks).toBe(3);
    });

    it('END_TURN resolves bleed damage and decays status effects', () => {
      const baseState = createInitialCombatState();
      const stateWithBleed: GameState = {
        ...baseState,
        investigator: {
          ...baseState.investigator,
          health: 20,
          armor: 10,
          statusEffects: [createStatusEffect('bleed', 3), createStatusEffect('might', 2)],
        },
        currentEnemy: {
          ...baseState.currentEnemy,
          health: 25,
          armor: 0,
          statusEffects: [createStatusEffect('bleed', 4)],
          currentIntent: { type: 'defend', value: 3, name: '外殼加固', description: '' },
        },
      };

      const afterTurn = gameReducer(stateWithBleed, { type: 'END_TURN' });

      // Investigator took 3 bleed damage directly to health (ignores 10 armor)
      expect(afterTurn.investigator.health).toBe(17);
      // Might decayed from 2 to 1, Bleed decayed from 3 to 2
      expect(afterTurn.investigator.statusEffects?.find((e) => e.type === 'might')?.stacks).toBe(1);
      expect(afterTurn.investigator.statusEffects?.find((e) => e.type === 'bleed')?.stacks).toBe(2);

      // Enemy took 4 bleed damage (25 - 4 = 21)
      expect(afterTurn.currentEnemy.health).toBe(21);
      // Enemy bleed decayed from 4 to 3
      expect(afterTurn.currentEnemy.statusEffects?.find((e) => e.type === 'bleed')?.stacks).toBe(3);
    });

    it('END_TURN causes victory if enemy dies from bleed damage and clears investigator status effects', () => {
      const baseState = createInitialCombatState();
      const stateDyingEnemy: GameState = {
        ...baseState,
        investigator: {
          ...baseState.investigator,
          relics: [POCKET_WATCH],
          statusEffects: [createStatusEffect('might', 3)],
        },
        currentEnemy: {
          ...baseState.currentEnemy,
          health: 2,
          armor: 0,
          statusEffects: [createStatusEffect('bleed', 3)],
          currentIntent: { type: 'defend', value: 0, name: '無力反抗', description: '' },
        },
      };

      const afterTurn = gameReducer(stateDyingEnemy, { type: 'END_TURN' });

      expect(afterTurn.phase).toBe('victory');
      expect(afterTurn.currentEnemy.health).toBe(0);
      expect(afterTurn.investigator.statusEffects).toEqual([]);
      // Relics remain intact!
      expect(afterTurn.investigator.relics).toHaveLength(1);
      expect(afterTurn.investigator.relics?.[0].id).toBe('pocket_watch');
    });

    it('END_TURN clamps divine enemy health to 1 on bleed damage and does not trigger victory (ADR-0015)', () => {
      const baseState = createInitialCombatState();
      const stateWithDivineEnemy: GameState = {
        ...baseState,
        currentDepth: 4,
        currentEnemy: {
          ...baseState.currentEnemy,
          id: 'divine_avatar',
          name: '克蘇魯星之眷族',
          health: 3,
          armor: 0,
          divineImmortality: true,
          statusEffects: [createStatusEffect('bleed', 10)],
          currentIntent: { type: 'defend', value: 0, name: '深淵神性凝視', description: '' },
        },
      };

      const afterTurn = gameReducer(stateWithDivineEnemy, { type: 'END_TURN' });

      // Bleed of 10 would kill a normal enemy, but divineImmortality clamps health to 1
      expect(afterTurn.currentEnemy.health).toBe(1);
      // Phase must remain in combat, not victory
      expect(afterTurn.phase).toBe('combat');
    });

    it('RESET_COMBAT preserves investigator relics and re-applies relic bonuses', () => {
      const baseState = createInitialCombatState();
      const stateWithRelics: GameState = {
        ...baseState,
        combatInitialHealth: 30,
        investigator: {
          ...baseState.investigator,
          relics: [ELDER_SIGN_AMULET, VITALITY_ELIXIR],
          maxHealth: 30,
          health: 12,
        },
      };

      const resetState = gameReducer(stateWithRelics, { type: 'RESET_COMBAT' });

      expect(resetState.investigator.relics).toHaveLength(2);
      expect(resetState.investigator.armor).toBe(5); // ELDER_SIGN_AMULET
      expect(resetState.investigator.maxHealth).toBe(30);
      expect(resetState.investigator.health).toBe(30);
    });
  });

  describe('Themed Monster Pools & Intent Rotation Engine (Issue #29)', () => {
    it('spawns depth-appropriate themed monsters when navigating to combat nodes', () => {
      // Depth 2 map
      const mapDepth2 = generateInvestigationMap({ depth: 2, procedural: true });
      const combatNodeD2 = Object.values(mapDepth2.nodes).find((n) => n.type === 'combat');
      expect(combatNodeD2).toBeDefined();

      if (combatNodeD2) {
        combatNodeD2.status = 'accessible';
        const stateD2 = gameReducer(
          { ...createInitialCombatState(), phase: 'map', currentDepth: 2, map: mapDepth2 },
          { type: 'NAVIGATE_TO_NODE', payload: { nodeId: combatNodeD2.id } }
        );
        expect(stateD2.phase).toBe('combat');
        const d2EnemyNames = ['深潛者戰士', '溺死亡魂', '深潛者長老'];
        expect(d2EnemyNames.some((name) => stateD2.currentEnemy.name.includes(name))).toBe(true);
      }

      // Depth 3 map
      const mapDepth3 = generateInvestigationMap({ depth: 3, procedural: true });
      const combatNodeD3 = Object.values(mapDepth3.nodes).find((n) => n.type === 'combat');
      expect(combatNodeD3).toBeDefined();

      if (combatNodeD3) {
        combatNodeD3.status = 'accessible';
        const stateD3 = gameReducer(
          { ...createInitialCombatState(), phase: 'map', currentDepth: 3, map: mapDepth3 },
          { type: 'NAVIGATE_TO_NODE', payload: { nodeId: combatNodeD3.id } }
        );
        expect(stateD3.phase).toBe('combat');
        const d3EnemyNames = ['原生黑泥幼體', '拜亞基腐翼獸', '無形之子', '廷達洛斯獵犬'];
        expect(d3EnemyNames.some((name) => stateD3.currentEnemy.name.includes(name))).toBe(true);
      }

      // Depth 4 map
      const mapDepth4 = generateInvestigationMap({ depth: 4, procedural: true });
      const combatNodeD4 = Object.values(mapDepth4.nodes).find((n) => n.type === 'combat');
      expect(combatNodeD4).toBeDefined();

      if (combatNodeD4) {
        combatNodeD4.status = 'accessible';
        const stateD4 = gameReducer(
          { ...createInitialCombatState(), phase: 'map', currentDepth: 4, map: mapDepth4 },
          { type: 'NAVIGATE_TO_NODE', payload: { nodeId: combatNodeD4.id } }
        );
        expect(stateD4.phase).toBe('combat');
        const d4EnemyNames = ['星之眷族幼體', '拉萊耶石棺守衛', '星辰古神侍從'];
        expect(d4EnemyNames.some((name) => stateD4.currentEnemy.name.includes(name))).toBe(true);
      }
    });

    it('RESET_COMBAT recovers pristine state of newly registered enemies without reverting to ghoul', () => {
      const template = getEnemyTemplateById('enemy_hound_of_tindalos');
      expect(template).toBeDefined();
      if (!template) return;

      const damagedState: GameState = {
        ...createInitialCombatState(),
        currentDepth: 3,
        phase: 'gameover',
        investigator: {
          ...createInitialCombatState().investigator,
          health: 0,
        },
        currentEnemy: {
          ...template,
          health: 12,
          armor: 0,
          currentIntentIndex: 2,
          statusEffects: [createStatusEffect('vulnerable', 3)],
        },
      };

      const resetState = gameReducer(damagedState, { type: 'RESET_COMBAT' });

      expect(resetState.phase).toBe('combat');
      expect(resetState.currentEnemy.id).toBe('enemy_hound_of_tindalos');
      expect(resetState.currentEnemy.name).toBe('廷達洛斯獵犬');
      expect(resetState.currentEnemy.health).toBe(template.maxHealth);
      expect(resetState.currentEnemy.armor).toBe(template.armor);
      expect(resetState.currentEnemy.currentIntentIndex).toBe(0);
      expect(resetState.currentEnemy.statusEffects).toHaveLength(0);
    });

    it('enemy executes apply_status intent to inflict bleeding onto investigator and triggers turn-end damage', () => {
      const baseState = createInitialCombatState();
      const enemyWithBleedIntent: Enemy = {
        ...baseState.currentEnemy,
        id: 'enemy_arkham_cultist',
        name: '阿卡姆異教徒',
        currentIntent: {
          type: 'apply_status',
          value: 2,
          statusType: 'bleed',
          name: '割脈血祭',
          description: '向你施加 2 層流血印記',
        },
      };

      const combatState: GameState = {
        ...baseState,
        currentEnemy: enemyWithBleedIntent,
        investigator: {
          ...baseState.investigator,
          health: 20,
          armor: 0,
          statusEffects: [],
        },
      };

      const nextTurnState = gameReducer(combatState, { type: 'END_TURN' });

      // Investigator was afflicted with bleed(2). At turn-end, bleed inflicts 2 damage and decays to 1 stack.
      // Health decreases from 20 to 18.
      expect(nextTurnState.investigator.health).toBe(18);
      const bleedStatus = nextTurnState.investigator.statusEffects?.find((s) => s.type === 'bleed');
      expect(bleedStatus?.stacks).toBe(1);
      expect(nextTurnState.battleLog.some((log) => log.includes('施展【割脈血祭】'))).toBe(true);
    });

    it('enemy executes defend intent gaining dynamic armor', () => {
      const baseState = createInitialCombatState();
      const enemyWithDefendIntent: Enemy = {
        ...baseState.currentEnemy,
        armor: 2,
        currentIntent: {
          type: 'defend',
          value: 7,
          name: '潮汐硬甲',
          description: '凝聚異質防護獲得 7 點護甲',
        },
      };

      const combatState: GameState = {
        ...baseState,
        currentEnemy: enemyWithDefendIntent,
      };

      const nextTurnState = gameReducer(combatState, { type: 'END_TURN' });

      expect(nextTurnState.currentEnemy.armor).toBe(9); // 2 + 7
      expect(nextTurnState.battleLog.some((log) => log.includes('獲得 7 點護甲'))).toBe(true);
    });

    it('getBossByDepth returns independent clones with boss category', () => {
      const bossD1 = getBossByDepth(1);
      expect(bossD1.category).toBe('boss');
      expect(bossD1.id).toBe('enemy_shoggoth_progeny');

      bossD1.health = 1;
      const pristineBossD1 = getBossByDepth(1);
      expect(pristineBossD1.health).toBe(INITIAL_SHOGGOTH.health);
      expect(pristineBossD1.category).toBe('boss');
    });

    it('getFreshEnemyTemplate correctly retrieves cloned boss with category when map node has no enemyId', () => {
      const mockMap: InvestigationMap = {
        id: 'map_mock',
        name: '深潛者海蝕迷宮調查圖',
        depth: 2,
        currentNodeId: 'node_boss',
        nodes: {
          node_boss: {
            id: 'node_boss',
            type: 'boss',
            label: '舊日宿敵',
            layer: 4,
            col: 0,
            title: '深海祭禮殿堂',
            description: '守關首領',
            nextNodes: [],
            status: 'current',
          },
        },
        layers: [['node_boss']],
      };

      const freshBoss = getFreshEnemyTemplate(undefined, mockMap, 2);
      expect(freshBoss.id).toBe('enemy_dagon_priest');
      expect(freshBoss.category).toBe('boss');
      expect(freshBoss.health).toBe(freshBoss.maxHealth);
    });

    it('RESET_COMBAT recovers correct enemy depth using state.map.depth when currentDepth is undefined', () => {
      const mapD2 = generateInvestigationMap({ depth: 2, procedural: true });
      const combatNode = Object.values(mapD2.nodes).find((n) => n.type === 'combat');
      expect(combatNode).toBeDefined();
      if (!combatNode) return;

      mapD2.currentNodeId = combatNode.id;

      const stateWithoutCurrentDepth: GameState = {
        ...createInitialCombatState(),
        currentDepth: undefined as unknown as DepthLevel,
        currentEnemy: undefined as unknown as Enemy,
        map: mapD2,
        phase: 'gameover',
      };

      const resetState = gameReducer(stateWithoutCurrentDepth, { type: 'RESET_COMBAT' });
      expect(resetState.phase).toBe('combat');
      expect(resetState.currentDepth).toBe(2);
      if (combatNode.enemyId) {
        expect(resetState.currentEnemy.id).toBe(combatNode.enemyId);
      }
    });
  });

  describe('4 New Map Node Types & Cross-Run Inheritance (Issue #30)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    describe('Altar Node (禁忌祭壇)', () => {
      it('navigates to altar node and enters altar phase', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'map',
          map: {
            id: 'map_test',
            name: '測試地圖',
            layers: [['node_0_0']],
            currentNodeId: null,
            nodes: {
              node_0_0: {
                id: 'node_0_0',
                type: 'altar',
                layer: 0,
                col: 0,
                label: '禁忌祭壇',
                title: '無名舊神祭壇',
                description: '石台燃燒冷火',
                nextNodes: [],
                status: 'accessible',
              },
            },
          },
        };

        const next = gameReducer(state, {
          type: 'NAVIGATE_TO_NODE',
          payload: { nodeId: 'node_0_0' },
        });

        expect(next.phase).toBe('altar');
        expect(next.altarUsed).toBe(false);
        expect(next.altarRituals).toHaveLength(3);
        expect(next.map?.currentNodeId).toBe('node_0_0');
      });

      it('USE_ALTAR flesh increases maxHealth and heals by 5 after paying 6 HP', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 20,
            maxHealth: 25,
          },
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'flesh' },
        });

        expect(next.altarUsed).toBe(true);
        expect(next.investigator.maxHealth).toBe(30);
        expect(next.investigator.health).toBe(19); // 20 - 6 + 5 = 19
      });

      it('USE_ALTAR flesh prevents sacrifice if health <= 6', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 6,
            maxHealth: 25,
          },
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'flesh' },
        });

        expect(next.altarUsed).toBe(false);
        expect(next.investigator.health).toBe(6);
      });

      it('USE_ALTAR mind increases handCapacity by 1 after paying 10 HP', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 20,
            handCapacity: 2,
          },
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'mind' },
        });

        expect(next.altarUsed).toBe(true);
        expect(next.investigator.health).toBe(10);
        expect(next.investigator.handCapacity).toBe(3);
      });

      it('USE_ALTAR mind increases handCapacity by 1 after paying 2 Sanity cards when costType is sanity', () => {
        const initialSanityDeck = createInitialCombatState().sanityDeck;
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 20,
            handCapacity: 2,
          },
          sanityDeck: [...initialSanityDeck],
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'mind', costType: 'sanity' },
        });

        expect(next.altarUsed).toBe(true);
        expect(next.investigator.health).toBe(20);
        expect(next.sanityDeck.length).toBe(initialSanityDeck.length - 2);
        expect(next.investigator.handCapacity).toBe(3);
      });

      it('USE_ALTAR boon grants a relic after paying 6 HP', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 20,
            relics: [],
          },
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'boon' },
        });

        expect(next.altarUsed).toBe(true);
        expect(next.investigator.health).toBeLessThan(20);
        expect(next.investigator.relics?.length).toBe(1);
      });

      it('USE_ALTAR time_space alias increases handCapacity identically to mind', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 20,
            handCapacity: 2,
          },
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'time_space' },
        });

        expect(next.altarUsed).toBe(true);
        expect(next.investigator.health).toBe(10);
        expect(next.investigator.handCapacity).toBe(3);
      });

      it('USE_ALTAR void alias grants relic identically to boon', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 20,
            relics: [],
          },
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'void' },
        });

        expect(next.altarUsed).toBe(true);
        expect(next.investigator.health).toBe(14);
        expect(next.investigator.relics?.length).toBe(1);
      });

      it('USE_ALTAR chaos damages 4 health, purges 1 card, and grants 50 obols', () => {
        const initialCards = createInitialCombatState().sanityDeck;
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 15,
            obols: 20,
          },
          sanityDeck: [...initialCards],
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'chaos' },
        });

        expect(next.altarUsed).toBe(true);
        expect(next.investigator.health).toBe(11);
        expect(next.investigator.obols).toBe(70);
        expect(next.sanityDeck.length).toBe(initialCards.length - 1);
        expect(next.battleLog[0]).toContain('混沌之契');
        expect(next.battleLog[0]).toContain('50 枚古金幣');
      });

      it('USE_ALTAR chaos rejects if health <= 4 or sanityDeck <= 1', () => {
        const stateLowHp: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 4,
          },
          altarUsed: false,
        };

        const nextLowHp = gameReducer(stateLowHp, {
          type: 'USE_ALTAR',
          payload: { optionId: 'chaos' },
        });
        expect(nextLowHp.altarUsed).toBe(false);

        const stateLowDeck: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 20,
          },
          sanityDeck: [createInitialCombatState().sanityDeck[0]],
          altarUsed: false,
        };

        const nextLowDeck = gameReducer(stateLowDeck, {
          type: 'USE_ALTAR',
          payload: { optionId: 'chaos' },
        });
        expect(nextLowDeck.altarUsed).toBe(false);
      });

      it('USE_ALTAR blood_pact damages 8 health, grants 心智防波堤 Truth card, and 25 obols', () => {
        const initialCards = createInitialCombatState().sanityDeck;
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 20,
            obols: 10,
          },
          sanityDeck: [...initialCards],
          altarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'USE_ALTAR',
          payload: { optionId: 'blood_pact' },
        });

        expect(next.altarUsed).toBe(true);
        expect(next.investigator.health).toBe(12);
        expect(next.investigator.obols).toBe(35);
        expect(next.sanityDeck.length).toBe(initialCards.length + 1);
        expect(next.sanityDeck.some((c) => c.name === '心智防波堤')).toBe(true);
        expect(next.battleLog[0]).toContain('血契之誓');
        expect(next.battleLog[0]).toContain('心智防波堤');
      });

      it('USE_ALTAR blood_pact rejects if health <= 8', () => {
        const stateLowHp: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          investigator: {
            ...createInitialCombatState().investigator,
            health: 8,
          },
          altarUsed: false,
        };

        const next = gameReducer(stateLowHp, {
          type: 'USE_ALTAR',
          payload: { optionId: 'blood_pact' },
        });
        expect(next.altarUsed).toBe(false);
      });

      it('LEAVE_ALTAR advances map and returns to map phase', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'altar',
          map: {
            id: 'map_test',
            name: '測試地圖',
            layers: [['node_0_0'], ['node_1_0']],
            currentNodeId: 'node_0_0',
            nodes: {
              node_0_0: {
                id: 'node_0_0',
                type: 'altar',
                layer: 0,
                col: 0,
                label: '禁忌祭壇',
                title: '無名舊神祭壇',
                description: '石台',
                nextNodes: ['node_1_0'],
                status: 'current',
              },
              node_1_0: {
                id: 'node_1_0',
                type: 'combat',
                layer: 1,
                col: 0,
                label: '常規遭遇',
                title: '巷道',
                description: '敵人',
                nextNodes: [],
                status: 'unvisited',
              },
            },
          },
        };

        const next = gameReducer(state, { type: 'LEAVE_ALTAR' });
        expect(next.phase).toBe('map');
        expect(next.altarRituals).toBeUndefined();
        expect(next.map?.nodes['node_0_0'].status).toBe('visited');
        expect(next.map?.nodes['node_1_0'].status).toBe('accessible');
      });
    });

    describe('Vault Node (遺物秘閣)', () => {
      it('navigates to vault node and populates up to 3 vault relics', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'map',
          map: {
            id: 'map_test',
            name: '測試地圖',
            layers: [['node_0_0']],
            currentNodeId: null,
            nodes: {
              node_0_0: {
                id: 'node_0_0',
                type: 'vault',
                layer: 0,
                col: 0,
                label: '遺物秘閣',
                title: '教授密室',
                description: '秘匣',
                nextNodes: [],
                status: 'accessible',
              },
            },
          },
        };

        const next = gameReducer(state, {
          type: 'NAVIGATE_TO_NODE',
          payload: { nodeId: 'node_0_0' },
        });

        expect(next.phase).toBe('vault');
        expect(next.vaultRelics).toBeDefined();
        expect(next.vaultRelics?.length).toBe(3);
        expect(next.vaultClaimed).toBe(false);
      });

      it('CLAIM_VAULT_RELIC adds chosen relic to investigator and applies modifiers', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'vault',
          investigator: {
            ...createInitialCombatState().investigator,
            relics: [],
            handCapacity: 2,
          },
          vaultRelics: [
            {
              id: 'pocket_watch',
              name: '黃銅懷錶',
              description: '手牌容量 +1',
              flavorText: '懷錶',
              rarity: 'rare',
              icon: 'Watch',
              modifiers: { handCapacity: 1 },
            },
          ],
          vaultClaimed: false,
        };

        const next = gameReducer(state, {
          type: 'CLAIM_VAULT_RELIC',
          payload: { relicId: 'pocket_watch' },
        });

        expect(next.vaultClaimed).toBe(true);
        expect(next.investigator.relics?.some((r) => r.id === 'pocket_watch')).toBe(true);
        expect(next.investigator.handCapacity).toBe(3);
      });

      it('CLAIM_VAULT_RELIC can alternatively claim 35 ancient obols', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'vault',
          investigator: {
            ...createInitialCombatState().investigator,
            obols: 20,
          },
          vaultClaimed: false,
        };

        const next = gameReducer(state, {
          type: 'CLAIM_VAULT_RELIC',
          payload: { claimObols: true },
        });

        expect(next.vaultClaimed).toBe(true);
        expect(next.investigator.obols).toBe(55);
      });

      it('CLAIM_VAULT_RELIC desecrate acquires 2 relics and injects unplayable 深淵詛咒 into sanityDeck (Issue #54)', () => {
        const relicA = {
          id: 'pocket_watch',
          name: '黃銅懷錶',
          description: '手牌容量 +1',
          flavorText: '懷錶',
          rarity: 'rare' as const,
          icon: 'Watch',
          modifiers: { handCapacity: 1 },
        };
        const relicB = {
          id: 'silver_shield',
          name: '符文圓盾',
          description: '開局護甲 +5',
          flavorText: '圓盾',
          rarity: 'rare' as const,
          icon: 'Shield',
          modifiers: { startingArmor: 5 },
        };

        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'vault',
          investigator: {
            ...createInitialCombatState().investigator,
            relics: [],
            handCapacity: 2,
          },
          sanityDeck: [createMockCard({ id: 'deck_card_1', name: '左輪射擊' })],
          vaultRelics: [relicA, relicB],
          vaultClaimed: false,
        };

        const next = gameReducer(state, {
          type: 'CLAIM_VAULT_RELIC',
          payload: { relicIds: ['pocket_watch', 'silver_shield'], desecrate: true } as any,
        });

        expect(next.vaultClaimed).toBe(true);
        // Both relics acquired
        expect(next.investigator.relics).toHaveLength(2);
        expect(next.investigator.handCapacity).toBe(3);

        // Sanity deck has unplayable 深淵詛咒 injected
        expect(next.sanityDeck).toHaveLength(2);
        const curseCard = next.sanityDeck.find((c) => c.name === '深淵詛咒');
        expect(curseCard).toBeDefined();
        expect(curseCard?.category).toBe('madness');
        expect(curseCard?.isUnplayable).toBe(true);
        expect(curseCard?.isTemporary).toBe(false);

        // Log mentions desecration and curse
        expect(next.battleLog[0]).toContain('深淵詛咒');
        expect(next.battleLog[0]).toContain('破除古神封印');
      });

      it('CLAIM_VAULT_RELIC desecrate rejects duplicate relic IDs', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'vault',
          vaultClaimed: false,
        };

        const duplicateNext = gameReducer(state, {
          type: 'CLAIM_VAULT_RELIC',
          payload: { relicIds: ['pocket_watch', 'pocket_watch'], desecrate: true },
        });

        expect(duplicateNext.vaultClaimed).toBe(false);
      });

      it('LEAVE_VAULT returns to map and advances node', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'vault',
          map: {
            id: 'map_test',
            name: '測試地圖',
            layers: [['node_0_0']],
            currentNodeId: 'node_0_0',
            nodes: {
              node_0_0: {
                id: 'node_0_0',
                type: 'vault',
                layer: 0,
                col: 0,
                label: '遺物秘閣',
                title: '教授密室',
                description: '秘匣',
                nextNodes: [],
                status: 'current',
              },
            },
          },
        };

        const next = gameReducer(state, { type: 'LEAVE_VAULT' });
        expect(next.phase).toBe('map');
        expect(next.vaultRelics).toBeUndefined();
      });
    });

    describe('Blood Altar Node (血之祭壇)', () => {
      it('SACRIFICE_CARDS_AT_BLOOD_ALTAR purges 2 selected cards permanently', () => {
        const initialCards = createInitialCombatState().sanityDeck;
        expect(initialCards.length).toBeGreaterThan(4);
        const card1 = initialCards[0];
        const card2 = initialCards[1];

        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'blood_altar',
          sanityDeck: initialCards,
          hand: [],
          discardPile: [],
          bloodAltarUsed: false,
        };

        const next = gameReducer(state, {
          type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
          payload: { cardIds: [card1.id, card2.id] },
        });

        expect(next.bloodAltarUsed).toBe(true);
        expect(next.sanityDeck.length).toBe(initialCards.length - 2);
        expect(next.sanityDeck.some((c) => c.id === card1.id)).toBe(false);
        expect(next.sanityDeck.some((c) => c.id === card2.id)).toBe(false);
      });

      it('purges only the chosen duplicate card copy and keeps other copies intact in sanityDeck', () => {
        const punch1 = createMockCard({ id: 'card_punch', name: '重拳壓制' });
        const punch2 = createMockCard({ id: 'card_punch', name: '重拳壓制' });
        const punch3 = createMockCard({ id: 'card_punch', name: '重拳壓制' });
        const bayonet = createMockCard({ id: 'card_bayonet', name: '軍刀突刺' });

        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'blood_altar',
          bloodAltarUsed: false,
          sanityDeck: [punch1, punch2, punch3, bayonet],
          hand: [],
          discardPile: [],
        };

        const permanentCards = getAllPermanentCards(state);
        expect(permanentCards.map((c) => c.id)).toEqual([
          'card_punch',
          'card_punch_copy_1',
          'card_punch_copy_2',
          'card_bayonet',
        ]);

        // User chooses to sacrifice punch_copy_1 and bayonet
        const nextState = gameReducer(state, {
          type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
          payload: { cardIds: ['card_punch_copy_1', 'card_bayonet'] },
        });

        expect(nextState.bloodAltarUsed).toBe(true);
        // Exactly 2 cards were sacrificed!
        expect(nextState.sanityDeck).toHaveLength(2);
        const remainingIds = nextState.sanityDeck.map((c) => c.id);
        expect(remainingIds).not.toContain('card_punch_copy_1');
        expect(remainingIds).not.toContain('card_bayonet');
        expect(nextState.sanityDeck.filter((c) => c.name === '重拳壓制')).toHaveLength(2);
      });

      it('SACRIFICE_CARDS_AT_BLOOD_ALTAR rejects if not exactly 2 cards or insufficient deck', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'blood_altar',
          bloodAltarUsed: false,
        };

        // 1 card
        const res1 = gameReducer(state, {
          type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
          payload: { cardIds: ['card_1'] },
        });
        expect(res1.bloodAltarUsed).toBe(false);

        // 3 cards
        const res3 = gameReducer(state, {
          type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
          payload: { cardIds: ['c1', 'c2', 'c3'] },
        });
        expect(res3.bloodAltarUsed).toBe(false);
      });

      it('SACRIFICE_CARDS_AT_BLOOD_ALTAR with reshape branch purges 1 card and restores 5 HP (capped at maxHealth)', () => {
        const initialCards = createInitialCombatState().sanityDeck;
        const cardToPurge = initialCards[0];
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'blood_altar',
          sanityDeck: initialCards,
          hand: [],
          discardPile: [],
          bloodAltarUsed: false,
          investigator: {
            ...createInitialCombatState().investigator,
            health: 12,
            maxHealth: 20,
          },
        };

        const next = gameReducer(state, {
          type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
          payload: { cardIds: [cardToPurge.id], branch: 'reshape' },
        });

        expect(next.bloodAltarUsed).toBe(true);
        expect(next.sanityDeck.length).toBe(initialCards.length - 1);
        expect(next.sanityDeck.some((c) => c.id === cardToPurge.id)).toBe(false);
        expect(next.investigator.health).toBe(17);
        expect(next.battleLog[0]).toContain('血肉重塑');
        expect(next.battleLog[0]).toContain('恢復 5 點生命值');
      });

      it('SACRIFICE_CARDS_AT_BLOOD_ALTAR reshape caps healing at maxHealth and rejects invalid card counts', () => {
        const initialCards = createInitialCombatState().sanityDeck;
        const cardToPurge = initialCards[0];
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'blood_altar',
          sanityDeck: initialCards,
          hand: [],
          discardPile: [],
          bloodAltarUsed: false,
          investigator: {
            ...createInitialCombatState().investigator,
            health: 18,
            maxHealth: 20,
          },
        };

        // When health is 18/20, healing 5 should cap at 20
        const healedState = gameReducer(state, {
          type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
          payload: { cardIds: [cardToPurge.id], branch: 'reshape' },
        });
        expect(healedState.bloodAltarUsed).toBe(true);
        expect(healedState.investigator.health).toBe(20);

        // Reshape branch rejects selecting 2 cards or 0 cards
        const reject2 = gameReducer(state, {
          type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
          payload: { cardIds: [initialCards[0].id, initialCards[1].id], branch: 'reshape' },
        });
        expect(reject2.bloodAltarUsed).toBe(false);
      });

      it('LEAVE_BLOOD_ALTAR returns to map and advances node', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'blood_altar',
          map: {
            id: 'map_test',
            name: '測試地圖',
            layers: [['node_0_0']],
            currentNodeId: 'node_0_0',
            nodes: {
              node_0_0: {
                id: 'node_0_0',
                type: 'blood_altar',
                layer: 0,
                col: 0,
                label: '血之祭壇',
                title: '放血槽',
                description: '石槽',
                nextNodes: [],
                status: 'current',
              },
            },
          },
        };

        const next = gameReducer(state, { type: 'LEAVE_BLOOD_ALTAR' });
        expect(next.phase).toBe('map');
      });
    });

    describe('Remains Node & Cross-Run Inheritance (屍骨遺骸)', () => {
      it('saves fallen investigator on fatal combat damage', () => {
        const base = createInitialCombatState();
        const state: GameState = {
          ...base,
          phase: 'combat',
          investigator: {
            ...base.investigator,
            name: '威廉·戴爾',
            occupation: '地質學教授',
            health: 2,
            armor: 0,
            obols: 60,
          },
          currentEnemy: {
            ...base.currentEnemy,
            name: '食屍鬼首領',
            currentIntent: { type: 'attack', value: 15, name: '撕裂骨爪', description: '猛烈撕裂' },
          },
        };

        const deadState = gameReducer(state, { type: 'END_TURN' });
        expect(deadState.phase).toBe('gameover');

        const fallen = JSON.parse(localStorage.getItem('arkham_fallen_investigator') || 'null');
        expect(fallen).not.toBeNull();
        expect(fallen.name).toBe('威廉·戴爾');
        expect(fallen.obols).toBe(60);
        expect(fallen.deck.length).toBeGreaterThan(0);
      });

      it('INHERIT_REMAINS allows player to inherit 1 card from fallen deck and clears tomb record', () => {
        const fallenCard = createInitialCombatState().sanityDeck[0];
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'remains',
          fallenInvestigator: {
            name: '威廉·戴爾',
            occupation: '地質學教授',
            deck: [fallenCard],
            obols: 50,
            depth: 1,
            causeOfDeath: '死因測試',
            timestamp: 12345,
          },
          remainsClaimed: false,
        };

        localStorage.setItem('arkham_fallen_investigator', JSON.stringify(state.fallenInvestigator));

        const next = gameReducer(state, {
          type: 'INHERIT_REMAINS',
          payload: { type: 'card', cardId: fallenCard.id },
        });

        expect(next.remainsClaimed).toBe(true);
        expect(next.sanityDeck.some((c) => c.name === fallenCard.name)).toBe(true);
        // Record is cleared from localStorage
        expect(localStorage.getItem('arkham_fallen_investigator')).toBeNull();
      });

      it('INHERIT_REMAINS allows player to inherit 50% ancient obols and clears tomb record', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'remains',
          investigator: {
            ...createInitialCombatState().investigator,
            obols: 10,
          },
          fallenInvestigator: {
            name: '威廉·戴爾',
            occupation: '地質學教授',
            deck: [],
            obols: 60,
            depth: 1,
            causeOfDeath: '死因測試',
            timestamp: 12345,
          },
          remainsClaimed: false,
        };

        localStorage.setItem('arkham_fallen_investigator', JSON.stringify(state.fallenInvestigator));

        const next = gameReducer(state, {
          type: 'INHERIT_REMAINS',
          payload: { type: 'obols' },
        });

        expect(next.remainsClaimed).toBe(true);
        expect(next.investigator.obols).toBe(40); // 10 + 30
        expect(localStorage.getItem('arkham_fallen_investigator')).toBeNull();
      });

      it('LEAVE_REMAINS clears tomb record and advances map', () => {
        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'remains',
          fallenInvestigator: {
            name: '威廉·戴爾',
            occupation: '地質學教授',
            deck: [],
            obols: 60,
            depth: 1,
            causeOfDeath: '死因測試',
            timestamp: 12345,
          },
          map: {
            id: 'map_test',
            name: '測試地圖',
            layers: [['node_0_0']],
            currentNodeId: 'node_0_0',
            nodes: {
              node_0_0: {
                id: 'node_0_0',
                type: 'remains',
                layer: 0,
                col: 0,
                label: '屍骨遺骸',
                title: '前代枯骨',
                description: '骸骨',
                nextNodes: [],
                status: 'current',
              },
            },
          },
        };

        localStorage.setItem('arkham_fallen_investigator', JSON.stringify(state.fallenInvestigator));

        const next = gameReducer(state, { type: 'LEAVE_REMAINS' });
        expect(next.phase).toBe('map');
        expect(localStorage.getItem('arkham_fallen_investigator')).toBeNull();
      });

      it('INHERIT_REMAINS ignores uninheritable cards like abyssal fragments', () => {
        const unplayableFragment: Card = {
          id: 'card_abyssal_fragment_1',
          name: '深淵封印殘片·其一',
          category: 'madness',
          costType: 'free',
          costValue: 0,
          isTemporary: false,
          isUnplayable: true,
          effects: [],
          description: '無法打出。',
          flavorText: '殘片',
        };

        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'remains',
          fallenInvestigator: {
            name: '威廉·戴爾',
            occupation: '地質學教授',
            deck: [unplayableFragment],
            obols: 60,
            depth: 1,
            causeOfDeath: '死因測試',
            timestamp: 12345,
          },
          sanityDeck: [],
          remainsClaimed: false,
        };

        const next = gameReducer(state, {
          type: 'INHERIT_REMAINS',
          payload: { type: 'card', cardId: 'card_abyssal_fragment_1' },
        });

        // Should reject uninheritable card
        expect(next.sanityDeck).toHaveLength(0);
      });

      it('clears fallen investigator from localStorage upon victory in CLAIM_REWARD', () => {
        localStorage.setItem(
          'arkham_fallen_investigator',
          JSON.stringify({ name: '前人', deck: [], obols: 10 })
        );

        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'reward',
          currentDepth: 3,
          map: {
            id: 'map_d3',
            name: 'Depth 3 Map',
            depth: 3,
            layers: [['node_boss']],
            currentNodeId: 'node_boss',
            nodes: {
              node_boss: {
                id: 'node_boss',
                type: 'boss',
                layer: 5,
                col: 0,
                label: '守關首領',
                title: '原生修格斯',
                description: '首領',
                nextNodes: [],
                status: 'current',
              },
            },
          },
        };

        gameReducer(state, { type: 'CLAIM_CARD_REWARD', payload: {} });
        expect(localStorage.getItem('arkham_fallen_investigator')).toBeNull();
      });
    });

    describe('Card Duplication & Lingering Hand Cards Prevention', () => {
      it('prevents card duplication when investigator is defeated after active discard phase', () => {
        const cardA = createMockCard({ id: 'card_a', name: '卡牌A' });
        const cardB = createMockCard({ id: 'card_b', name: '卡牌B' });
        const cardC = createMockCard({ id: 'card_c', name: '卡牌C' });
        const cardD = createMockCard({ id: 'card_d', name: '卡牌D' });

        const lethalEnemy: Enemy = {
          ...cloneEnemy(INITIAL_GHOUL),
          currentIntent: {
            name: '致命一擊',
            type: 'attack',
            value: 99,
            description: '致命一擊',
          },
        };

        const state: GameState = {
          ...createInitialCombatState(lethalEnemy),
          phase: 'combat',
          turn: 1,
          investigator: {
            ...INITIAL_INVESTIGATOR,
            health: 5,
            armor: 0,
            handCapacity: 2,
          },
          hand: [cardA, cardB, cardC, cardD],
          discardPile: [],
          sanityDeck: [],
          discardPhase: {
            requiredDiscardCount: 2,
            selectedDiscardIds: ['card_c', 'card_d'],
          },
        };

        // Confirm discard: cardC and cardD are discarded, remainingHand is [cardA, cardB]
        // Enemy attacks with 99 damage, killing investigator!
        const gameoverState = gameReducer(state, { type: 'CONFIRM_DISCARD' });

        expect(gameoverState.phase).toBe('gameover');
        expect(gameoverState.hand.map((c) => c.id)).toEqual(['card_a', 'card_b']);
        expect(gameoverState.discardPile.map((c) => c.id)).toEqual(['card_c', 'card_d']);

        // Now retry combat from gameover state
        const resetState = gameReducer(gameoverState, { type: 'RESET_COMBAT' });
        const allResetCards = [...resetState.hand, ...resetState.sanityDeck];

        // Total cards must be exactly 4, with NO duplicate copies of cardC or cardD!
        expect(allResetCards).toHaveLength(4);
        const cardIds = allResetCards.map((c) => c.id);
        expect(new Set(cardIds).size).toBe(4);
        expect(cardIds).toContain('card_a');
        expect(cardIds).toContain('card_b');
        expect(cardIds).toContain('card_c');
        expect(cardIds).toContain('card_d');
      });

      it('prevents card duplication when recovering sanity from discardPile in RESOLVE_EVENT_OPTION', () => {
        const discardedCard = createMockCard({ id: 'card_discarded_1', name: '已棄卡牌' });
        const deckCard = createMockCard({ id: 'card_in_deck_1', name: '牌庫卡牌' });

        const mockEvent: MythosEvent = {
          id: 'test_event_heal_sanity',
          title: '安撫理智奇遇',
          location: '靜謐圖書館',
          storyText: ['你在古籍中找到了安撫心靈的真言。'],
          options: [
            {
              id: 'opt_meditate',
              text: '誦讀安神真言',
              costDescription: '恢復 1 點理智',
              consequences: [
                {
                  type: 'sanity_change',
                  value: 1,
                  narrative: '理智恢復了 1 點。',
                },
              ],
            },
          ],
        };

        const state: GameState = {
          ...createInitialCombatState(),
          phase: 'event',
          currentEvent: mockEvent,
          sanityDeck: [deckCard],
          discardPile: [discardedCard],
          hand: [],
        };

        const eventState = gameReducer(state, {
          type: 'RESOLVE_EVENT_OPTION',
          payload: { optionId: 'opt_meditate' },
        });

        // The card was moved from discardPile into sanityDeck
        expect(eventState.sanityDeck.map((c) => c.id)).toContain('card_discarded_1');
        // Crucial: discardPile must NOT still hold card_discarded_1!
        expect(eventState.discardPile).toHaveLength(0);
      });

      it('automatically assigns unique IDs to duplicates during setupCombatDeck', () => {
        const duplicateCard = createMockCard({ id: 'card_punch_1', name: '重拳壓制' });
        const cardsWithDuplicates = [duplicateCard, duplicateCard, duplicateCard];

        const { hand, sanityDeck } = setupCombatDeck(cardsWithDuplicates, 'investigator', undefined, 2);
        const allCards = [...hand, ...sanityDeck];

        expect(allCards).toHaveLength(3);
        const ids = allCards.map((c) => c.id);
        expect(new Set(ids).size).toBe(3);
        expect(ids).toContain('card_punch_1');
        expect(ids).toContain('card_punch_1_copy_1');
        expect(ids).toContain('card_punch_1_copy_2');
      });

      it('guarantees unique IDs when repeatedly injecting temporary truth cards into sanity deck on the same turn', () => {
        const truthCard1 = createMockCard({
          id: 'card_truth_inject_1',
          name: '真相卡1',
          effects: [{ type: 'add_to_deck', value: 2 }],
          costType: 'stamina',
          costValue: 1,
        });
        const truthCard2 = createMockCard({
          id: 'card_truth_inject_2',
          name: '真相卡2',
          effects: [{ type: 'add_to_deck', value: 2 }],
          costType: 'stamina',
          costValue: 1,
        });

        const state: GameState = {
          ...createInitialCombatState(),
          hand: [truthCard1, truthCard2],
          sanityDeck: [],
          turn: 1,
        };

        // Play truth card 1 on turn 1
        const afterPlay1 = gameReducer(state, {
          type: 'PLAY_CARD',
          payload: { cardId: 'card_truth_inject_1' },
        });

        expect(afterPlay1.sanityDeck).toHaveLength(2);

        // Play truth card 2 on the SAME turn 1
        const afterPlay2 = gameReducer(afterPlay1, {
          type: 'PLAY_CARD',
          payload: { cardId: 'card_truth_inject_2' },
        });

        expect(afterPlay2.sanityDeck).toHaveLength(4);

        // Verify all 4 injected cards have distinct IDs - no duplicate key like temp_truth_t1_1!
        const deckIds = afterPlay2.sanityDeck.map((c) => c.id);
        expect(new Set(deckIds).size).toBe(4);

        // End turn and draw cards into hand
        const endTurnState = gameReducer(afterPlay2, { type: 'END_TURN' });
        const handIds = endTurnState.hand.map((c) => c.id);
        expect(new Set(handIds).size).toBe(endTurnState.hand.length);
      });
    });

    describe('Combat Retry & Persistent Health Restoration (RESET_COMBAT)', () => {
      it('restores investigator health to combat entry health instead of maxHealth when retrying after death', () => {
        const map = generateInvestigationMap();
        const combatNodeId = Object.keys(map.nodes).find((id) => map.nodes[id].type === 'combat')!;
        map.nodes[combatNodeId].status = 'accessible';

        // Investigator enters combat with damaged health (14 HP out of 25)
        const damagedState: GameState = {
          ...createInitialCombatState(),
          phase: 'map',
          map,
          investigator: {
            ...INITIAL_INVESTIGATOR,
            health: 14,
            maxHealth: 25,
          },
        };

        const combatState = gameReducer(damagedState, {
          type: 'NAVIGATE_TO_NODE',
          payload: { nodeId: combatNodeId },
        });

        expect(combatState.phase).toBe('combat');
        expect(combatState.investigator.health).toBe(14);
        expect(combatState.combatInitialHealth).toBe(14);

        // Investigator takes fatal damage and succumbs (0 HP, gameover)
        const gameOverState: GameState = {
          ...combatState,
          phase: 'gameover',
          investigator: {
            ...combatState.investigator,
            health: 0,
          },
        };

        // Retry combat
        const resetState = gameReducer(gameOverState, { type: 'RESET_COMBAT' });

        // Must restore back to 14 HP (combat entry health), NOT 25 HP (maxHealth)!
        expect(resetState.phase).toBe('combat');
        expect(resetState.investigator.health).toBe(14);
        expect(resetState.investigator.maxHealth).toBe(25);
        expect(resetState.combatInitialHealth).toBe(14);
      });

      it('maintains the original combat entry health across multiple consecutive retries', () => {
        const combatState: GameState = {
          ...createInitialCombatState(),
          combatInitialHealth: 11,
          investigator: {
            ...INITIAL_INVESTIGATOR,
            health: 11,
            maxHealth: 25,
          },
        };

        // First death & retry
        const deadState1: GameState = {
          ...combatState,
          phase: 'gameover',
          investigator: { ...combatState.investigator, health: 0 },
        };
        const resetState1 = gameReducer(deadState1, { type: 'RESET_COMBAT' });
        expect(resetState1.investigator.health).toBe(11);
        expect(resetState1.combatInitialHealth).toBe(11);

        // Second death & retry in the same encounter
        const deadState2: GameState = {
          ...resetState1,
          phase: 'gameover',
          investigator: { ...resetState1.investigator, health: 0 },
        };
        const resetState2 = gameReducer(deadState2, { type: 'RESET_COMBAT' });
        expect(resetState2.investigator.health).toBe(11);
        expect(resetState2.combatInitialHealth).toBe(11);
      });

      it('restores entry health when combat was triggered by a mythos event with health damage', () => {
        const mockAmbushEvent: MythosEvent = {
          id: 'event_ambush',
          title: '暗巷伏擊',
          location: '廢棄碼頭',
          storyText: ['你在暗處遭到了伏擊！'],
          options: [
            {
              id: 'opt_fight',
              text: '迎戰',
              consequences: [
                { type: 'health_change', value: -7, narrative: '受到衝擊，失去 7 點體力。' },
                { type: 'trigger_combat', enemy: INITIAL_GHOUL, narrative: '食屍鬼撲了上來！' },
              ],
            },
          ],
        };

        const stateBeforeEvent: GameState = {
          ...createInitialCombatState(),
          phase: 'event',
          currentEvent: mockAmbushEvent,
          investigator: {
            ...INITIAL_INVESTIGATOR,
            health: 25,
            maxHealth: 25,
          },
        };

        const triggeredCombatState = gameReducer(stateBeforeEvent, {
          type: 'RESOLVE_EVENT_OPTION',
          payload: { optionId: 'opt_fight' },
        });

        // Event dealt 7 damage, so investigator entered combat with 18 HP
        expect(triggeredCombatState.phase).toBe('combat');
        expect(triggeredCombatState.investigator.health).toBe(18);
        expect(triggeredCombatState.combatInitialHealth).toBe(18);

        // Investigator dies in this combat
        const gameoverState: GameState = {
          ...triggeredCombatState,
          phase: 'gameover',
          investigator: { ...triggeredCombatState.investigator, health: 0 },
        };

        const resetState = gameReducer(gameoverState, { type: 'RESET_COMBAT' });
        expect(resetState.investigator.health).toBe(18);
        expect(resetState.combatInitialHealth).toBe(18);
      });

      it('restores combat entry health when manual restart is triggered mid-battle', () => {
        const combatState: GameState = {
          ...createInitialCombatState(),
          combatInitialHealth: 16,
          investigator: {
            ...INITIAL_INVESTIGATOR,
            health: 8, // damaged mid-battle
            maxHealth: 25,
          },
        };

        const resetState = gameReducer(combatState, { type: 'RESET_COMBAT' });
        expect(resetState.investigator.health).toBe(16);
      });

      it('preserves abyssalSealFused flag and clears discardPhase upon RESET_COMBAT', () => {
        const combatState: GameState = {
          ...createInitialCombatState(),
          abyssalSealFused: true,
          discardPhase: {
            requiredDiscardCount: 2,
            selectedDiscardIds: ['card_1'],
          },
        };

        const resetState = gameReducer(combatState, { type: 'RESET_COMBAT' });
        expect(resetState.abyssalSealFused).toBe(true);
        expect(resetState.discardPhase).toBeUndefined();
      });

      it('clears combatInitialHealth when proceeding from victory to reward and returning to map', () => {
        const map = generateInvestigationMap();
        const combatNodeId = Object.keys(map.nodes).find((id) => map.nodes[id].type === 'combat')!;
        map.nodes[combatNodeId].status = 'accessible';

        const combatState: GameState = {
          ...createInitialCombatState(),
          phase: 'reward',
          combatInitialHealth: 14,
          map,
          rewardCards: [],
          rewardObols: 15,
        };

        const mapState = gameReducer(combatState, {
          type: 'CLAIM_CARD_REWARD',
          payload: {},
        });

        expect(mapState.phase).toBe('map');
        expect(mapState.combatInitialHealth).toBeUndefined();
      });
    });
  });
});

describe('Composable Card Primitives & Occupation Filtering (Issue #46)', () => {
  it('prioritizes innate cards into opening hand during combat deck setup', () => {
    const regular1 = createMockCard({ id: 'reg_1', name: '一般牌1' });
    const regular2 = createMockCard({ id: 'reg_2', name: '一般牌2' });
    const regular3 = createMockCard({ id: 'reg_3', name: '一般牌3' });
    const innateCard = createMockCard({
      id: 'innate_test_card',
      name: '老兵本能測試',
      keywords: ['innate'],
    });

    const titleState = createInitialGameState();
    const state: GameState = {
      ...titleState,
      phase: 'reward',
      hand: [regular1, regular2],
      sanityDeck: [regular3],
      discardPile: [],
      rewardCards: [innateCard],
      rewardObols: 10,
    };

    const combatState = gameReducer(state, {
      type: 'CLAIM_CARD_REWARD',
      payload: { cardId: innateCard.id },
    });

    expect(combatState.phase).toBe('combat');
    // Opening hand has 2 cards, and innateCard must be in opening hand
    expect(combatState.hand.some((c) => c.name === '老兵本能測試')).toBe(true);
  });

  it('moves exhaust card to exhaustPile instead of discardPile upon playing', () => {
    const exhaustCard: Card = {
      id: 'exhaust_test_card',
      name: '戰地急救測試',
      category: 'skill',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      keywords: ['exhaust'],
      effects: [{ type: 'armor', value: 4 }],
      description: '測試消耗',
      flavorText: '「急救」',
    };

    const combatState: GameState = {
      ...createInitialCombatState(),
      hand: [exhaustCard],
      discardPile: [],
      exhaustPile: [],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        stamina: 3,
        armor: 0,
      },
    };

    const nextState = gameReducer(combatState, {
      type: 'PLAY_CARD',
      payload: { cardId: exhaustCard.id },
    });

    expect(nextState.hand.length).toBe(0);
    expect(nextState.discardPile.length).toBe(0);
    expect(nextState.exhaustPile).toBeDefined();
    expect(nextState.exhaustPile?.length).toBe(1);
    expect(nextState.exhaustPile?.[0].id).toBe('exhaust_test_card');
    expect(nextState.battleLog.some((l) => l.includes('移入消耗堆'))).toBe(true);
  });

  it('excludes retain cards from hand capacity discard at end of turn', () => {
    const retainCard1 = createMockCard({
      id: 'retain_1',
      name: '就地掩蔽',
      keywords: ['retain'],
    });
    const retainCard2 = createMockCard({
      id: 'retain_2',
      name: '星界折射',
      keywords: ['retain'],
    });
    const normalCard1 = createMockCard({ id: 'norm_1', name: '普通牌1' });
    const normalCard2 = createMockCard({ id: 'norm_2', name: '普通牌2' });
    const normalCard3 = createMockCard({ id: 'norm_3', name: '普通牌3' });

    // Hand capacity is 4. Hand has 5 cards (2 retain + 3 normal).
    // Non-retain cards (3) <= handCapacity (4).
    // Should NOT trigger discard phase!
    const combatState: GameState = {
      ...createInitialCombatState(),
      hand: [retainCard1, retainCard2, normalCard1, normalCard2, normalCard3],
      investigator: {
        ...INITIAL_INVESTIGATOR,
        handCapacity: 4,
      },
      currentEnemy: {
        ...INITIAL_GHOUL,
        currentIntent: { type: 'defend', value: 3, name: '護甲', description: '' },
      },
    };

    const nextState = gameReducer(combatState, { type: 'END_TURN' });
    expect(nextState.discardPhase).toBeUndefined();
    // Both retain cards remain in hand
    expect(nextState.hand.some((c) => c.id === 'retain_1')).toBe(true);
    expect(nextState.hand.some((c) => c.id === 'retain_2')).toBe(true);
  });

  it('generates combat rewards strictly filtered by investigator occupation', () => {
    // 1. Investigator occupation
    const victoryInvestigator: GameState = {
      ...createInitialCombatState(),
      phase: 'victory',
      investigator: {
        ...INITIAL_INVESTIGATOR,
        occupationId: 'investigator',
      },
    };

    const rewardInvestigator = gameReducer(victoryInvestigator, { type: 'PROCEED_TO_REWARD' });
    expect(rewardInvestigator.rewardCards).toBeDefined();
    for (const card of rewardInvestigator.rewardCards!) {
      const occupations = card.occupations;
      const isValid = !occupations || occupations.length === 0 || occupations.includes('investigator');
      expect(isValid).toBe(true);
      expect(occupations?.includes('occultist') && !occupations?.includes('investigator')).toBeFalsy();
    }

    // 2. Occultist occupation
    const victoryOccultist: GameState = {
      ...createInitialCombatState(),
      phase: 'victory',
      investigator: {
        ...INITIAL_INVESTIGATOR,
        occupationId: 'occultist',
      },
    };

    const rewardOccultist = gameReducer(victoryOccultist, { type: 'PROCEED_TO_REWARD' });
    expect(rewardOccultist.rewardCards).toBeDefined();
    for (const card of rewardOccultist.rewardCards!) {
      const occupations = card.occupations;
      const isValid = !occupations || occupations.length === 0 || occupations.includes('occultist');
      expect(isValid).toBe(true);
      expect(occupations?.includes('investigator') && !occupations?.includes('occultist')).toBeFalsy();
    }
  });

  it('generates black market items strictly filtered by investigator occupation', () => {
    const map = generateInvestigationMap();
    const marketNodeId = Object.keys(map.nodes).find((id) => map.nodes[id].type === 'market')!;
    map.nodes[marketNodeId].status = 'accessible';

    // Occultist enters black market
    const marketState = gameReducer(
      {
        ...createInitialCombatState(),
        phase: 'map',
        map,
        investigator: {
          ...INITIAL_INVESTIGATOR,
          occupationId: 'occultist',
        },
      },
      { type: 'NAVIGATE_TO_NODE', payload: { nodeId: marketNodeId } }
    );

    expect(marketState.phase).toBe('market');
    expect(marketState.marketItems).toBeDefined();
    for (const item of marketState.marketItems!) {
      if (item.card) {
        const occupations = item.card.occupations;
        const isValid = !occupations || occupations.length === 0 || occupations.includes('occultist');
        expect(isValid).toBe(true);
      }
    }
  });

  describe('Canonical Enemy Traits & Dynamic Tactical AI (Issue #47 / ADR-0026)', () => {
    it('triggers Turn 6 anti-stall Enrage (+50% attack damage) on enemy attack', () => {
      const baseState = createInitialCombatState();
      const stateTurn6: GameState = {
        ...baseState,
        turn: 6,
        investigator: {
          ...baseState.investigator,
          health: 30,
          armor: 0,
        },
        currentEnemy: {
          ...baseState.currentEnemy,
          currentIntent: {
            type: 'attack',
            value: 10,
            name: '狂亂重擊',
            description: '',
          },
        },
      };

      const nextState = gameReducer(stateTurn6, { type: 'END_TURN' });

      // Turn 6 Enrage: 10 * 1.5 = 15 damage. Investigator health: 30 - 15 = 15
      expect(nextState.investigator.health).toBe(15);
      expect(nextState.battleLog.some((log) => log.includes('【深淵狂暴】'))).toBe(true);
      expect(nextState.battleLog.some((log) => log.includes('造成 15 點肉體傷害'))).toBe(true);
    });

    it('triggers carrion_feeder leech healing 50% of damage against bleeding investigator', () => {
      const baseState = createInitialCombatState();
      const ghoulWithFeeder: Enemy = {
        ...baseState.currentEnemy,
        health: 20,
        maxHealth: 30,
        traits: [ELDRITCH_TRAIT_DEFINITIONS.carrion_feeder],
        currentIntent: {
          type: 'attack',
          value: 8,
          name: '腐臭爪擊',
          description: '',
        },
      };

      const combatState: GameState = {
        ...baseState,
        turn: 2,
        currentEnemy: ghoulWithFeeder,
        investigator: {
          ...baseState.investigator,
          health: 30,
          armor: 0,
          statusEffects: [createStatusEffect('bleed', 2)],
        },
      };

      const nextState = gameReducer(combatState, { type: 'END_TURN' });

      // Damage dealt: 8. Ghoul heals 50% = 4 HP. Ghoul health: 20 + 4 = 24.
      // (Ghoul took no bleed damage itself).
      expect(nextState.currentEnemy.health).toBe(24);
      expect(nextState.battleLog.some((log) => log.includes('【食腐本能】'))).toBe(true);
    });

    it('slippery_mucus negates card physical damage <= 4', () => {
      const baseState = createInitialCombatState();
      const deepOne: Enemy = {
        ...baseState.currentEnemy,
        health: 40,
        maxHealth: 40,
        armor: 0,
        traits: [ELDRITCH_TRAIT_DEFINITIONS.slippery_mucus],
      };

      const weakStrikeCard: Card = {
        id: 'test_weak_strike',
        name: '輕巧刺擊',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 4 }],
        description: '造成 4 點物理傷害。',
        flavorText: '',
      };

      const combatState: GameState = {
        ...baseState,
        currentEnemy: deepOne,
        hand: [weakStrikeCard],
        investigator: {
          ...baseState.investigator,
          stamina: 3,
        },
      };

      const afterPlay = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: weakStrikeCard.id },
      });

      // 4 damage negated by slippery_mucus -> enemy health remains 40
      expect(afterPlay.currentEnemy.health).toBe(40);
      expect(afterPlay.battleLog.some((log) => log.includes('【滑膩黏液】'))).toBe(true);
    });

    it('waterlogged_grip inflicts horror at combat start and erode intent drains stamina', () => {
      const drownedSoul: Enemy = {
        id: 'enemy_drowned_soul',
        name: '溺死亡魂',
        title: '冰冷潮汐的哀鳴者',
        health: 38,
        maxHealth: 38,
        armor: 0,
        traits: [ELDRITCH_TRAIT_DEFINITIONS.waterlogged_grip],
        currentIntent: {
          type: 'erode',
          value: 3,
          drainStamina: 1,
          name: '窒息溺亡幻象',
          description: '',
        },
      };

      // 1. Check combat start: waterlogged_grip applies 1 horror
      const startState = createInitialCombatState(drownedSoul);
      expect(startState.investigator.statusEffects?.some((s) => s.type === 'horror')).toBe(true);
      expect(startState.battleLog.some((log) => log.includes('【水下寒骨】'))).toBe(true);

      // 2. Check turn end with drainStamina
      const nextState = gameReducer(startState, { type: 'END_TURN' });
      // Investigator stamina recovers to maxStamina - 1 (3 - 1 = 2)
      expect(nextState.investigator.stamina).toBe(2);
      expect(nextState.battleLog.some((log) => log.includes('【溺水窒息】'))).toBe(true);
    });

    it('cultist dynamically switches to blind sacrifice when health drops to <= 40%', () => {
      const baseState = createInitialCombatState();
      const cultist: Enemy = {
        ...baseState.currentEnemy,
        id: 'enemy_arkham_cultist',
        name: '阿卡姆異教徒',
        health: 10,
        maxHealth: 28, // 10 / 28 = 35.7% <= 40%
        armor: 0,
        traits: [ELDRITCH_TRAIT_DEFINITIONS.zealous_blood_oath],
        currentIntent: {
          type: 'defend',
          value: 6,
          name: '狂信護身',
          description: '',
        },
      };

      const combatState: GameState = {
        ...baseState,
        currentEnemy: cultist,
      };

      const nextTurnState = gameReducer(combatState, { type: 'END_TURN' });

      // Cultist switches intent to 盲目血祭
      expect(nextTurnState.currentEnemy.currentIntent.name).toBe('盲目血祭');
      expect(nextTurnState.currentEnemy.currentIntent.selfDamage).toBe(4);
    });

    it('shoggoth charging stance increases card damage taken by 50%', () => {
      const baseState = createInitialCombatState();
      const chargingShoggoth: Enemy = {
        ...baseState.currentEnemy,
        id: 'enemy_shoggoth',
        name: '修格斯',
        health: 80,
        maxHealth: 80,
        armor: 0,
        shoggothStance: 'charging',
        traits: [ELDRITCH_TRAIT_DEFINITIONS.organ_proliferation],
      };

      const strikeCard: Card = {
        id: 'test_strike_10',
        name: '強力射擊',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 10 }],
        description: '造成 10 點物理傷害。',
        flavorText: '',
      };

      const combatState: GameState = {
        ...baseState,
        currentEnemy: chargingShoggoth,
        hand: [strikeCard],
        investigator: {
          ...baseState.investigator,
          stamina: 3,
        },
      };

      const afterPlay = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: strikeCard.id },
      });

      // 10 damage + 50% bonus = 15 damage! Health: 80 - 15 = 65.
      expect(afterPlay.currentEnemy.health).toBe(65);
      expect(afterPlay.battleLog.some((log) => log.includes('【蓄力破綻】'))).toBe(true);
    });

    it('tide_of_dagon consumes remaining armor on even turn tsunami attack in gameReducer', () => {
      const baseState = createInitialCombatState();
      const dagonEnemy: Enemy = {
        ...baseState.currentEnemy,
        id: 'enemy_dagon',
        name: '大袞深淵祭司',
        armor: 14,
        traits: [ELDRITCH_TRAIT_DEFINITIONS.tide_of_dagon],
        currentIntent: {
          type: 'attack',
          value: 0,
          name: '海嘯',
          description: '',
        },
      };

      const combatState: GameState = {
        ...baseState,
        turn: 2, // Even turn -> Ebb tide
        currentEnemy: dagonEnemy,
      };

      const afterTurn = gameReducer(combatState, { type: 'END_TURN' });
      // Tsunami dealt 14 damage and armor was consumed
      expect(afterTurn.currentEnemy.armor).toBe(0);
      expect(afterTurn.battleLog.some((log) => log.includes('【大袞潮汐·海嘯】'))).toBe(true);
    });

    it('divine_immortality injects madness card into sanity deck on even turn in gameReducer', () => {
      const baseState = createInitialCombatState();
      const starSpawnEnemy: Enemy = {
        ...baseState.currentEnemy,
        id: 'enemy_star_spawn',
        name: '克蘇魯星之眷族',
        traits: [ELDRITCH_TRAIT_DEFINITIONS.divine_immortality],
        currentIntent: {
          type: 'attack',
          value: 10,
          name: '星辰握擊',
          description: '',
        },
      };

      const combatState: GameState = {
        ...baseState,
        turn: 2, // Even turn -> pollution
        currentEnemy: starSpawnEnemy,
      };

      const afterTurn = gameReducer(combatState, { type: 'END_TURN' });
      const injectedWhispers = [
        ...afterTurn.sanityDeck,
        ...afterTurn.hand,
        ...afterTurn.discardPile,
      ].filter((c) => c.name === '星辰碎裂之囈語');
      expect(injectedWhispers.length).toBeGreaterThanOrEqual(1);
      expect(afterTurn.battleLog.some((log) => log.includes('星辰碎裂之囈語'))).toBe(true);
    });

    it('increments retainedTurns on cards kept in hand across turns', () => {
      const baseState = createInitialCombatState();
      const retainCard: Card = {
        id: 'test_retain_card',
        name: '保留測試卡',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        keywords: ['retain'],
        effects: [{ type: 'armor', value: 5 }],
        description: '',
        flavorText: '',
      };

      const combatState: GameState = {
        ...baseState,
        turn: 1,
        hand: [retainCard],
      };

      const afterTurn1 = gameReducer(combatState, { type: 'END_TURN' });
      const keptCard = afterTurn1.hand.find((c) => c.id === retainCard.id);
      expect(keptCard?.retainedTurns).toBe(1);

      const afterTurn2 = gameReducer(afterTurn1, { type: 'END_TURN' });
      const keptCard2 = afterTurn2.hand.find((c) => c.id === retainCard.id);
      expect(keptCard2?.retainedTurns).toBe(2);
    });

    it('tracks cardsPlayedThisTurn across card plays within a turn and resets on END_TURN', () => {
      const baseState = createInitialCombatState();
      expect(baseState.cardsPlayedThisTurn).toBe(0);

      const playableCard1: Card = {
        id: 'play_1',
        name: '卡牌1',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 4 }],
        description: '',
        flavorText: '',
      };
      const playableCard2: Card = {
        id: 'play_2',
        name: '卡牌2',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 4 }],
        description: '',
        flavorText: '',
      };

      const combatState: GameState = {
        ...baseState,
        hand: [playableCard1, playableCard2],
        investigator: {
          ...baseState.investigator,
          stamina: 3,
        },
      };

      const afterCard1 = gameReducer(combatState, {
        type: 'PLAY_CARD',
        payload: { cardId: playableCard1.id },
      });
      expect(afterCard1.cardsPlayedThisTurn).toBe(1);

      const afterCard2 = gameReducer(afterCard1, {
        type: 'PLAY_CARD',
        payload: { cardId: playableCard2.id },
      });
      expect(afterCard2.cardsPlayedThisTurn).toBe(2);

      // Advance turn -> cardsPlayedThisTurn resets to 0
      const afterTurn = gameReducer(afterCard2, { type: 'END_TURN' });
      expect(afterTurn.cardsPlayedThisTurn).toBe(0);
    });

    it('resolves multi-hit enemy attack against investigator armor and health accurately', () => {
      const baseState = createInitialCombatState();
      const multiHitEnemy: Enemy = {
        ...baseState.currentEnemy,
        currentIntent: {
          type: 'attack',
          value: 3,
          hitCount: 4,
          name: '原生質重爪撕裂',
          description: '',
        },
      };

      // Investigator has 5 armor and 25 health.
      // Attack is 4 hits of 3 damage:
      // Hit 1: 3 damage against 5 armor -> 2 armor left, 0 HP dmg
      // Hit 2: 3 damage against 2 armor -> 0 armor left, 1 HP dmg -> 24 HP
      // Hit 3: 3 damage against 0 armor -> 0 armor left, 3 HP dmg -> 21 HP
      // Hit 4: 3 damage against 0 armor -> 0 armor left, 3 HP dmg -> 18 HP
      // Total: 7 HP damage, 18 HP remaining, 0 armor remaining
      const combatState: GameState = {
        ...baseState,
        currentEnemy: multiHitEnemy,
        investigator: {
          ...baseState.investigator,
          armor: 5,
          health: 25,
          statusEffects: [],
        },
      };

      const afterTurn = gameReducer(combatState, { type: 'END_TURN' });
      expect(afterTurn.investigator.armor).toBe(0);
      expect(afterTurn.investigator.health).toBe(18);
      expect(afterTurn.battleLog.some((log) => log.includes('連續狂暴撕咬 4 次'))).toBe(true);
    });

    it('applies multiple statuses from enemy intent (such as blind blood sacrifice) to investigator', () => {
      const baseState = createInitialCombatState();
      const sacrificeEnemy: Enemy = {
        ...baseState.currentEnemy,
        currentIntent: {
          type: 'apply_status',
          statusType: 'bleed',
          value: 3,
          additionalStatuses: [createStatusEffect('vulnerable', 2)],
          selfDamage: 4,
          name: '盲目血祭',
          description: '',
        },
      };

      const combatState: GameState = {
        ...baseState,
        currentEnemy: sacrificeEnemy,
        investigator: {
          ...baseState.investigator,
          statusEffects: [],
        },
      };

      const afterTurn = gameReducer(combatState, { type: 'END_TURN' });
      // 3 bleed inflicted, 1 stack decays at turn end -> 2 remaining (and 3 bleed damage taken)
      expect(afterTurn.investigator.statusEffects?.find((s) => s.type === 'bleed')?.stacks).toBe(2);
      // 2 vulnerable inflicted, 1 stack decays at turn end -> 1 remaining
      expect(afterTurn.investigator.statusEffects?.find((s) => s.type === 'vulnerable')?.stacks).toBe(1);
      expect(afterTurn.battleLog.some((log) => log.includes('3 層【流血】'))).toBe(true);
      expect(afterTurn.battleLog.some((log) => log.includes('2 層【易傷】'))).toBe(true);
    });
  });

  describe('Depth-Stratified Mythos Events & visitedEventIds (ADR-0032 / Issue #52)', () => {
    it('records visitedEventIds when entering event node and prevents duplicate events', () => {
      const initial = createInitialGameState();
      const map = generateInvestigationMap({ depth: 1 });

      const node1Id = map.layers[0].find((id) => map.nodes[id].type === 'event') ?? 'node_0_1';
      map.nodes[node1Id].type = 'event';

      const state1 = gameReducer(
        { ...initial, phase: 'map', map, currentDepth: 1, visitedEventIds: [] },
        { type: 'NAVIGATE_TO_NODE', payload: { nodeId: node1Id } }
      );

      expect(state1.phase).toBe('event');
      expect(state1.currentEvent).toBeDefined();
      expect(state1.visitedEventIds).toBeDefined();
      expect(state1.visitedEventIds).toHaveLength(1);
      expect(state1.visitedEventIds![0]).toBe(state1.currentEvent!.id);

      // Complete event and return to map
      const stateAfterComplete = gameReducer(state1, { type: 'COMPLETE_EVENT' });
      expect(stateAfterComplete.phase).toBe('map');
      expect(stateAfterComplete.currentEvent).toBeUndefined();
      expect(stateAfterComplete.visitedEventIds).toHaveLength(1);

      // Select another event node
      const node2Id = stateAfterComplete.map?.layers[1]?.find((id) => stateAfterComplete.map?.nodes[id].type === 'event') ?? 'node_1_0';
      const stateForNav: GameState = {
        ...stateAfterComplete,
        map: {
          ...stateAfterComplete.map!,
          nodes: {
            ...stateAfterComplete.map!.nodes,
            [node2Id]: {
              ...stateAfterComplete.map!.nodes[node2Id],
              type: 'event',
              status: 'accessible',
            },
          },
        },
      };

      const state2 = gameReducer(stateForNav, {
        type: 'NAVIGATE_TO_NODE',
        payload: { nodeId: node2Id },
      });

      expect(state2.phase).toBe('event');
      expect(state2.currentEvent).toBeDefined();
      expect(state2.currentEvent!.id).not.toBe(state1.currentEvent!.id);
      expect(state2.visitedEventIds).toHaveLength(2);
      expect(state2.visitedEventIds).toContain(state2.currentEvent!.id);
    });

    it('resolves gain_relic consequence in RESOLVE_EVENT_OPTION and applies modifiers', () => {
      const initial = createInitialGameState();
      const testRelic: Relic = {
        id: 'relic_stellar_lens',
        name: '群星透鏡',
        description: '折射高維冷光的黑曜石透鏡。手牌容量永久 +1。',
        flavorText: '「窺探群星運行的透鏡。」',
        rarity: 'rare',
        modifiers: {
          handCapacity: 1,
          maxHealth: 5,
        },
      };

      const testEvent: MythosEvent = {
        id: 'event_test_relic',
        title: '測試遺物奇遇',
        location: '深海石室',
        storyText: ['你在石台上看見一件散發微光的古老遺物……'],
        options: [
          {
            id: 'opt_take_relic',
            text: '拾起群星透鏡',
            consequences: [
              {
                type: 'gain_relic',
                relic: testRelic,
                narrative: '獲得舊日遺物【群星透鏡】！',
              },
            ],
          },
        ],
      };

      const eventState: GameState = {
        ...initial,
        phase: 'event',
        currentEvent: testEvent,
        investigator: {
          ...initial.investigator,
          handCapacity: 2,
          maxHealth: 20,
          health: 20,
          relics: [],
        },
      };

      const resolved = gameReducer(eventState, {
        type: 'RESOLVE_EVENT_OPTION',
        payload: { optionId: 'opt_take_relic' },
      });

      expect(resolved.investigator.relics).toBeDefined();
      expect(resolved.investigator.relics!.some((r) => r.id === 'relic_stellar_lens')).toBe(true);
      expect(resolved.investigator.handCapacity).toBe(3);
      expect(resolved.investigator.maxHealth).toBe(25);
      expect(resolved.investigator.health).toBe(25);
      expect(resolved.battleLog.some((log) => log.includes('獲得舊日遺物【群星透鏡】'))).toBe(true);
    });

    it('initializes visitedEventIds on START_NEW_INVESTIGATION and SELECT_OCCUPATION', () => {
      const startState = gameReducer(createInitialGameState(), { type: 'START_NEW_INVESTIGATION' });
      expect(startState.visitedEventIds).toEqual([]);

      const selectedState = gameReducer(startState, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'investigator' },
      });
      expect(selectedState.visitedEventIds).toEqual([]);
    });

    it('preserves visitedEventIds on RESET_COMBAT', () => {
      const stateWithEvents: GameState = {
        ...createInitialGameState(),
        phase: 'combat',
        visitedEventIds: ['event_sunken_shrine', 'event_drowned_sailor_shrine'],
      };

      const resetState = gameReducer(stateWithEvents, { type: 'RESET_COMBAT' });
      expect(resetState.visitedEventIds).toEqual(['event_sunken_shrine', 'event_drowned_sailor_shrine']);
    });
  });
});



