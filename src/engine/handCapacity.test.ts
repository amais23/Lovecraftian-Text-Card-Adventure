import { describe, it, expect } from 'vitest';
import {
  createInitialCombatState,
  gameReducer,
  DEFAULT_HAND_CAPACITY,
  setupCombatDeck,
} from './gameReducer';
import type { GameState, Investigator } from '../types/game';
import { INITIAL_INVESTIGATOR, INVESTIGATOR_DECK, OCCUPATIONS } from './initialData';
import { COMPLETE_ANCIENT_SEAL } from './abyssalSeals';

describe('Hand Capacity, Fixed Draw & Discard Flow (Issue #27 & ADR-0018)', () => {
  it('initializes Investigator with handCapacity = 2 by default', () => {
    expect(INITIAL_INVESTIGATOR.handCapacity).toBe(2);
    expect(DEFAULT_HAND_CAPACITY).toBe(2);
    expect(OCCUPATIONS.investigator.stats.handCapacity).toBe(2);
    expect(OCCUPATIONS.occultist.stats.handCapacity).toBe(2);

    const state = createInitialCombatState();
    expect(state.investigator.handCapacity).toBe(2);
  });

  it('draws starting hand of exactly handCapacity (2 cards) on Turn 1', () => {
    const state = createInitialCombatState();
    // Default investigator deck has 12 cards -> 2 in hand, 10 in sanity deck
    expect(state.hand.length).toBe(2);
    expect(state.sanityDeck.length).toBe(10);
    expect(state.turn).toBe(1);
  });

  it('supports custom/variable handCapacity (e.g. 3 cards)', () => {
    const customInvestigator: Investigator = {
      ...INITIAL_INVESTIGATOR,
      handCapacity: 3,
    };
    const state = createInitialCombatState(undefined, undefined, customInvestigator);
    expect(state.investigator.handCapacity).toBe(3);
    expect(state.hand.length).toBe(3);
    expect(state.sanityDeck.length).toBe(9);
  });

  it('preserves unplayed cards and fixed draws handCapacity cards when hand <= handCapacity', () => {
    const state = createInitialCombatState();
    expect(state.hand.length).toBe(2);

    // Play 1 card, leaving 1 card in hand
    const cardToPlay = state.hand[0];
    const retainedCard = state.hand[1];
    const stateAfterPlay = gameReducer(state, {
      type: 'PLAY_CARD',
      payload: { cardId: cardToPlay.id },
    });
    expect(stateAfterPlay.hand.length).toBe(1);

    // End turn: 1 <= 2, so retains the 1 card and fixed draws 2 new cards -> total 3 in hand
    const stateAfterTurn = gameReducer(stateAfterPlay, { type: 'END_TURN' });

    expect(stateAfterTurn.discardPhase).toBeUndefined();
    expect(stateAfterTurn.turn).toBe(2);
    expect(stateAfterTurn.hand.some((c) => c.id === retainedCard.id)).toBe(true);
    expect(stateAfterTurn.hand.length).toBe(3); // 1 retained + 2 drawn
    expect(stateAfterTurn.sanityDeck.length).toBe(8); // 10 - 2 = 8
    expect(stateAfterTurn.battleLog.some((log) => log.includes('固定抽取 2 張卡牌'))).toBe(true);
    expect(stateAfterTurn.battleLog.some((log) => log.includes('未打出的 1 張手牌予以保留'))).toBe(true);
  });

  it('retains 2 unplayed cards and fixed draws 2 cards if 0 cards played on Turn 1', () => {
    const state = createInitialCombatState();
    expect(state.hand.length).toBe(2);

    // End turn without playing any cards: hand.length (2) <= capacity (2)
    const stateAfterTurn = gameReducer(state, { type: 'END_TURN' });

    expect(stateAfterTurn.discardPhase).toBeUndefined();
    expect(stateAfterTurn.turn).toBe(2);
    expect(stateAfterTurn.hand.length).toBe(4); // 2 retained + 2 drawn
    expect(stateAfterTurn.sanityDeck.length).toBe(8);
  });

  it('triggers discardPhase when remaining hand exceeds handCapacity on END_TURN', () => {
    const state = createInitialCombatState();
    // Turn 1 ends with 2 cards retained, draws 2 -> Turn 2 hand has 4 cards
    const turn2State = gameReducer(state, { type: 'END_TURN' });
    expect(turn2State.hand.length).toBe(4);
    expect(turn2State.turn).toBe(2);

    // On Turn 2, if player plays 0 cards and clicks END_TURN:
    // 4 cards > handCapacity (2), must discard 2 cards!
    const discardPhaseState = gameReducer(turn2State, { type: 'END_TURN' });

    expect(discardPhaseState.discardPhase).toBeDefined();
    expect(discardPhaseState.discardPhase?.requiredDiscardCount).toBe(2);
    expect(discardPhaseState.discardPhase?.selectedDiscardIds).toEqual([]);
    // Turn must NOT advance and enemy must NOT have attacked yet
    expect(discardPhaseState.turn).toBe(2);
    expect(discardPhaseState.battleLog[0]).toContain('【手牌超出容量】');
    expect(discardPhaseState.battleLog[0]).toContain('請挑選並棄置 2 張卡牌');
  });

  it('prevents PLAY_CARD while discardPhase is active', () => {
    const state = createInitialCombatState();
    const turn2State = gameReducer(state, { type: 'END_TURN' });
    const discardPhaseState = gameReducer(turn2State, { type: 'END_TURN' });
    expect(discardPhaseState.discardPhase).toBeDefined();

    const cardToPlay = discardPhaseState.hand[0];
    const afterPlayAttempt = gameReducer(discardPhaseState, {
      type: 'PLAY_CARD',
      payload: { cardId: cardToPlay.id },
    });

    // Should be completely ignored
    expect(afterPlayAttempt).toBe(discardPhaseState);
  });

  it('toggles cards for discard and enforces requiredDiscardCount limit', () => {
    const state = createInitialCombatState();
    const turn2State = gameReducer(state, { type: 'END_TURN' });
    let discardState = gameReducer(turn2State, { type: 'END_TURN' });

    const [c1, c2, c3] = discardState.hand;

    // Toggle c1 -> selected
    discardState = gameReducer(discardState, {
      type: 'TOGGLE_DISCARD_CARD',
      payload: { cardId: c1.id },
    });
    expect(discardState.discardPhase?.selectedDiscardIds).toEqual([c1.id]);

    // Toggle c2 -> selected (now at max 2)
    discardState = gameReducer(discardState, {
      type: 'TOGGLE_DISCARD_CARD',
      payload: { cardId: c2.id },
    });
    expect(discardState.discardPhase?.selectedDiscardIds).toEqual([c1.id, c2.id]);

    // Attempting to toggle c3 should be ignored because requiredDiscardCount is 2
    discardState = gameReducer(discardState, {
      type: 'TOGGLE_DISCARD_CARD',
      payload: { cardId: c3.id },
    });
    expect(discardState.discardPhase?.selectedDiscardIds).toEqual([c1.id, c2.id]);

    // Toggling c1 again unselects it
    discardState = gameReducer(discardState, {
      type: 'TOGGLE_DISCARD_CARD',
      payload: { cardId: c1.id },
    });
    expect(discardState.discardPhase?.selectedDiscardIds).toEqual([c2.id]);
  });

  it('cancels discard phase on CANCEL_DISCARD and returns to playing phase', () => {
    const state = createInitialCombatState();
    const turn2State = gameReducer(state, { type: 'END_TURN' });
    const discardState = gameReducer(turn2State, { type: 'END_TURN' });
    expect(discardState.discardPhase).toBeDefined();

    const canceledState = gameReducer(discardState, { type: 'CANCEL_DISCARD' });
    expect(canceledState.discardPhase).toBeUndefined();
    expect(canceledState.battleLog[0]).toContain('取消主動棄牌');

    // Player can now play cards again
    const playableCard = canceledState.hand[0];
    const afterPlay = gameReducer(canceledState, {
      type: 'PLAY_CARD',
      payload: { cardId: playableCard.id },
    });
    expect(afterPlay.hand.length).toBe(3);
  });

  it('confirms discard, moves selected cards to discard pile, and proceeds with turn end', () => {
    const state = createInitialCombatState();
    const turn2State = gameReducer(state, { type: 'END_TURN' });
    let discardState = gameReducer(turn2State, { type: 'END_TURN' });

    const [c1, c2, c3, c4] = discardState.hand;

    // Select c1 and c2
    discardState = gameReducer(discardState, {
      type: 'TOGGLE_DISCARD_CARD',
      payload: { cardId: c1.id },
    });
    discardState = gameReducer(discardState, {
      type: 'TOGGLE_DISCARD_CARD',
      payload: { cardId: c2.id },
    });

    // Confirm discard
    const resolvedState = gameReducer(discardState, { type: 'CONFIRM_DISCARD' });

    expect(resolvedState.discardPhase).toBeUndefined();
    expect(resolvedState.turn).toBe(3);

    // c1 and c2 should now be in discardPile
    expect(resolvedState.discardPile.some((c) => c.id === c1.id)).toBe(true);
    expect(resolvedState.discardPile.some((c) => c.id === c2.id)).toBe(true);

    // c3 and c4 retained (2 cards) + fixed draw 2 cards = 4 cards in hand
    expect(resolvedState.hand.some((c) => c.id === c3.id)).toBe(true);
    expect(resolvedState.hand.some((c) => c.id === c4.id)).toBe(true);
    expect(resolvedState.hand.length).toBe(4);

    expect(resolvedState.battleLog.some((log) => log.includes('【主動棄牌】'))).toBe(true);
    expect(resolvedState.battleLog.some((log) => log.includes('固定抽取 2 張卡牌'))).toBe(true);
  });

  it('supports direct DISCARD_CARDS_TO_LIMIT action', () => {
    const state = createInitialCombatState();
    const turn2State = gameReducer(state, { type: 'END_TURN' });
    const [c1, c2] = turn2State.hand;

    const resolvedState = gameReducer(turn2State, {
      type: 'DISCARD_CARDS_TO_LIMIT',
      payload: { cardIds: [c1.id, c2.id] },
    });

    expect(resolvedState.turn).toBe(3);
    expect(resolvedState.discardPile.some((c) => c.id === c1.id)).toBe(true);
    expect(resolvedState.discardPile.some((c) => c.id === c2.id)).toBe(true);
    expect(resolvedState.hand.length).toBe(4); // 2 retained + 2 drawn
  });

  it('converts deficit into temporary madness cards when sanityDeck has fewer cards than handCapacity', () => {
    const state: GameState = {
      ...createInitialCombatState(),
      hand: [],
      sanityDeck: [INVESTIGATOR_DECK[0]], // Only 1 card left!
      isMadness: false,
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    // handCapacity is 2. 1 drawn from sanityDeck, 1 deficit converted to madness card!
    expect(nextState.hand.length).toBe(2);
    expect(nextState.sanityDeck.length).toBe(0);
    expect(nextState.isMadness).toBe(true);
    expect(nextState.hand.some((c) => c.category === 'madness')).toBe(true);
    expect(nextState.battleLog.some((l) => l.includes('理智牌庫已抽空！調查員進入「瘋狂狀態」'))).toBe(true);
  });

  it('draws full handCapacity as madness cards if already in madness state', () => {
    const state: GameState = {
      ...createInitialCombatState(),
      hand: [],
      sanityDeck: [],
      isMadness: true,
    };

    const nextState = gameReducer(state, { type: 'END_TURN' });

    expect(nextState.hand.length).toBe(2);
    expect(nextState.hand.every((c) => c.category === 'madness')).toBe(true);
    expect(nextState.battleLog.some((l) => l.includes('【瘋狂抽牌】處於瘋狂狀態！深淵力量轉化為 2 張臨時黑色瘋狂卡！'))).toBe(true);
  });

  it('places COMPLETE_ANCIENT_SEAL at index 0 of opening hand respecting handCapacity', () => {
    const cards = [
      ...INVESTIGATOR_DECK.slice(0, 5),
      COMPLETE_ANCIENT_SEAL,
      ...INVESTIGATOR_DECK.slice(5),
    ];
    const { hand, sanityDeck } = setupCombatDeck(cards, 'investigator', undefined, 2);

    expect(hand.length).toBe(2);
    expect(hand[0].id).toBe(COMPLETE_ANCIENT_SEAL.id);
    expect(sanityDeck.length).toBe(cards.length - 2);
  });
});
