import { describe, it, expect } from 'vitest';
import { generateMarketItemsForDepth } from './eventData';
import { PRESET_RELICS } from './relics';
import { gameReducer } from './gameReducer';
import type { GameState, Card } from '../types/game';
import { INITIAL_INVESTIGATOR, INITIAL_GHOUL } from './initialData';
import { cloneEnemy } from './enemyCatalog';

function createMarketTestState(): GameState {
  const starterCards: Card[] = [
    {
      id: 'c1',
      name: '調查員左輪手槍',
      category: 'combat',
      tier: 1,
      costType: 'stamina',
      costValue: 1,
      effects: [{ type: 'damage', value: 6 }],
      description: '造成 6 點傷害。',
      flavorText: '「點38口徑轉輪手槍，在黑暗巷弄中最可靠的防身武器。」',
      isTemporary: false,
    },
    {
      id: 'c2',
      name: '敏銳直覺',
      category: 'skill',
      tier: 1,
      costType: 'stamina',
      costValue: 1,
      effects: [{ type: 'armor', value: 5 }],
      description: '獲得 5 點護甲。',
      flavorText: '「在異樣聲響傳來前，神經已本能地緊繃警惕。」',
      isTemporary: false,
    },
    {
      id: 'c3',
      name: '舊日詛咒',
      category: 'madness',
      costType: 'stamina',
      costValue: 1,
      effects: [],
      description: '不可名狀的詛咒雜質。',
      flavorText: '「不可名狀的低語在腦髓深處盤旋不去。」',
      isTemporary: false,
    },
  ];

  return {
    phase: 'market',
    currentDepth: 1,
    turn: 1,
    investigator: {
      ...INITIAL_INVESTIGATOR,
      obols: 50,
      relics: [],
    },
    sanityDeck: starterCards,
    hand: [],
    discardPile: [],
    isMadness: false,
    currentEnemy: cloneEnemy(INITIAL_GHOUL),
    battleLog: [],
    marketItems: generateMarketItemsForDepth(1, 'investigator'),
    marketPurgeUsed: false,
  };
}

describe('Dynamic Black Market Generation (Issue #53 / ADR-0032)', () => {
  it('generates 3 tiered cards adapted to occupation across Depths 1, 2, and 3', () => {
    // Depth 1: Tier 1 cards for detective
    const d1Items = generateMarketItemsForDepth(1, 'investigator');
    const d1Cards = d1Items.filter((i) => i.type === 'card');
    expect(d1Cards).toHaveLength(3);
    for (const item of d1Cards) {
      expect(item.card).toBeDefined();
      expect(item.card?.tier).toBe(1);
      if (item.card?.occupations) {
        expect(item.card.occupations).toContain('investigator');
      }
    }

    // Depth 2: Tier 2 cards for occultist
    const d2Items = generateMarketItemsForDepth(2, 'occultist');
    const d2Cards = d2Items.filter((i) => i.type === 'card');
    expect(d2Cards).toHaveLength(3);
    for (const item of d2Cards) {
      expect(item.card).toBeDefined();
      expect(item.card?.tier).toBe(2);
      if (item.card?.occupations) {
        expect(item.card.occupations).toContain('occultist');
      }
    }

    // Depth 3: Tier 3 cards
    const d3Items = generateMarketItemsForDepth(3, 'investigator');
    const d3Cards = d3Items.filter((i) => i.type === 'card');
    expect(d3Cards).toHaveLength(3);
    for (const item of d3Cards) {
      expect(item.card).toBeDefined();
      expect(item.card?.tier).toBe(3);
    }
  });

  it('generates 1~2 unowned relics from PRESET_RELICS and filters out owned relics', () => {
    const ownedRelic = PRESET_RELICS[0];
    const items = generateMarketItemsForDepth(1, 'investigator', {
      ownedRelicIds: [ownedRelic.id],
    });

    const relicItems = items.filter((i) => i.type === 'relic');
    expect(relicItems.length).toBeGreaterThanOrEqual(1);
    expect(relicItems.length).toBeLessThanOrEqual(2);

    for (const item of relicItems) {
      expect(item.relic).toBeDefined();
      expect(item.relic?.id).not.toBe(ownedRelic.id);
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it('generates exactly 1 medical supply appropriate for current depth', () => {
    const d1Items = generateMarketItemsForDepth(1, 'investigator');
    const d1Heal = d1Items.filter((i) => i.type === 'heal');
    expect(d1Heal).toHaveLength(1);
    expect(d1Heal[0].healAmount).toBeGreaterThan(0);

    const d2Items = generateMarketItemsForDepth(2, 'investigator');
    const d2Heal = d2Items.filter((i) => i.type === 'heal');
    expect(d2Heal).toHaveLength(1);
    expect(d2Heal[0].healAmount).toBeGreaterThanOrEqual(8);

    const d3Items = generateMarketItemsForDepth(3, 'investigator');
    const d3Heal = d3Items.filter((i) => i.type === 'heal');
    expect(d3Heal).toHaveLength(1);
    expect(d3Heal[0].healAmount).toBeGreaterThanOrEqual(10);
  });

  it('applies 20% discount to a single item when discount triggers', () => {
    // Mock randomFn returning 0.1 (< 0.2 trigger)
    const itemsWithDiscount = generateMarketItemsForDepth(1, 'investigator', {
      randomFn: () => 0.1,
    });

    const discountedItems = itemsWithDiscount.filter((i) => i.isDiscounted);
    expect(discountedItems).toHaveLength(1);

    const discounted = discountedItems[0];
    expect(discounted.originalPrice).toBeDefined();
    expect(discounted.price).toBe(Math.round(discounted.originalPrice! * 0.5));
    expect(discounted.discountLabel).toBe('半價特惠');

    // Mock randomFn returning 0.5 (>= 0.2 no discount)
    const itemsWithoutDiscount = generateMarketItemsForDepth(1, 'investigator', {
      randomFn: () => 0.5,
    });
    expect(itemsWithoutDiscount.some((i) => i.isDiscounted)).toBe(false);
  });
});

describe('Black Market Relic Purchase & Card Purge Service (Reducer)', () => {
  it('allows purchasing a relic, deducting obols, and applying relic modifiers to investigator', () => {
    const state = createMarketTestState();
    const relicItem = state.marketItems?.find((i) => i.type === 'relic');
    expect(relicItem).toBeDefined();
    if (!relicItem) return;

    const initialObols = state.investigator.obols;
    const nextState = gameReducer(state, {
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: relicItem.id },
    });

    expect(nextState.investigator.obols).toBe(initialObols - relicItem.price);
    expect(nextState.investigator.relics?.some((r) => r.id === relicItem.relic?.id)).toBe(true);
    expect(nextState.marketItems?.find((i) => i.id === relicItem.id)?.isPurchased).toBe(true);
    expect(nextState.battleLog[0]).toContain(relicItem.relic?.name);
  });

  it('purges selected card at market for 30 obols and marks service as used', () => {
    const state = createMarketTestState();
    expect(state.investigator.obols).toBe(50);
    expect(state.sanityDeck).toHaveLength(3);

    const targetCardId = 'c3'; // '舊日詛咒'
    const nextState = gameReducer(state, {
      type: 'PURGE_CARD_AT_MARKET',
      payload: { cardId: targetCardId },
    });

    // 50 - 30 = 20
    expect(nextState.investigator.obols).toBe(20);
    expect(nextState.sanityDeck.some((c) => c.id === targetCardId)).toBe(false);
    expect(nextState.sanityDeck).toHaveLength(2);
    expect(nextState.marketPurgeUsed).toBe(true);
    expect(nextState.battleLog[0]).toContain('舊日詛咒');
    expect(nextState.battleLog[0]).toContain('永久除役焚毀');

    // Re-purging in same market visit is rejected
    const repeatState = gameReducer(nextState, {
      type: 'PURGE_CARD_AT_MARKET',
      payload: { cardId: 'c1' },
    });
    expect(repeatState.investigator.obols).toBe(20);
    expect(repeatState.sanityDeck).toHaveLength(2);
  });

  it('rejects card purge if obols are insufficient (< 30)', () => {
    const state = createMarketTestState();
    const poorState: GameState = {
      ...state,
      investigator: {
        ...state.investigator,
        obols: 25,
      },
    };

    const nextState = gameReducer(poorState, {
      type: 'PURGE_CARD_AT_MARKET',
      payload: { cardId: 'c3' },
    });

    expect(nextState.investigator.obols).toBe(25);
    expect(nextState.sanityDeck).toHaveLength(3);
    expect(nextState.marketPurgeUsed).toBe(false);
    expect(nextState.battleLog[0]).toContain('古金幣不足');
  });

  it('purges only the targeted single copy when deck contains duplicate card IDs', () => {
    const state = createMarketTestState();
    const duplicateDeck: Card[] = [
      { ...state.sanityDeck[0], id: 'duplicate_gun' },
      { ...state.sanityDeck[0], id: 'duplicate_gun' },
      state.sanityDeck[1],
    ];
    const deckState: GameState = {
      ...state,
      sanityDeck: duplicateDeck,
    };
    const nextState = gameReducer(deckState, {
      type: 'PURGE_CARD_AT_MARKET',
      payload: { cardId: 'duplicate_gun' },
    });
    expect(nextState.sanityDeck).toHaveLength(2);
    expect(nextState.sanityDeck[0].name).toBe(state.sanityDeck[0].name);
    expect(nextState.sanityDeck[1].id).toBe(state.sanityDeck[1].id);
  });

  it('rejects card purge when deck has only 1 card left', () => {
    const state = createMarketTestState();
    const singleCardState: GameState = {
      ...state,
      sanityDeck: [state.sanityDeck[0]],
    };
    const nextState = gameReducer(singleCardState, {
      type: 'PURGE_CARD_AT_MARKET',
      payload: { cardId: state.sanityDeck[0].id },
    });
    expect(nextState.sanityDeck).toHaveLength(1);
    expect(nextState.investigator.obols).toBe(50);
    expect(nextState.marketPurgeUsed).toBe(false);
    expect(nextState.battleLog[0]).toContain('牌庫卡牌數量過少');
  });

  it('clears market items and purge used flag when leaving market', () => {
    const state = createMarketTestState();
    const leaveState = gameReducer(state, { type: 'LEAVE_MARKET' });

    expect(leaveState.phase).toBe('map');
    expect(leaveState.marketItems).toBeUndefined();
    expect(leaveState.marketPurgeUsed).toBeUndefined();
  });
});

