import { describe, it, expect } from 'vitest';
import { gameReducer, createInitialCombatState } from './gameReducer';
import { INITIAL_GHOUL, INITIAL_INVESTIGATOR } from './initialData';
import type { Card, GameState } from '../types/game';

describe('Game State Reducer (Combat Vertical Slice)', () => {
  it('initializes combat with investigator, ghoul enemy, and 4 drawn cards', () => {
    const initialState = createInitialCombatState();

    expect(initialState.phase).toBe('combat');
    expect(initialState.turn).toBe(1);
    expect(initialState.investigator.health).toBe(25);
    expect(initialState.investigator.stamina).toBe(3);
    expect(initialState.investigator.armor).toBe(0);

    // Initial 10 cards: 4 drawn into hand, 6 remaining in sanityDeck (Sanity = 6)
    expect(initialState.hand.length).toBe(4);
    expect(initialState.sanityDeck.length).toBe(6);
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
});
