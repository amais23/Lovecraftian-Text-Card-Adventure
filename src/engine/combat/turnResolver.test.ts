import { describe, it, expect } from 'vitest';
import {
  resolveCombatTurnEnd,
  initializeCombatSession,
  setupCombatDeck,
} from './turnResolver';
import type { Card, Enemy, Investigator } from '../../types/game';
import type { CombatTurnContext } from './types';

function createMockCard(overrides?: Partial<Card>): Card {
  return {
    id: overrides?.id ?? `card_${Math.random().toString(36).substring(2, 9)}`,
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

function createMockInvestigator(overrides?: Partial<Investigator>): Investigator {
  return {
    name: '愛德華·皮爾斯',
    occupation: '私家偵探',
    occupationId: 'investigator',
    health: 25,
    maxHealth: 25,
    stamina: 3,
    maxStamina: 3,
    armor: 0,
    obols: 20,
    handCapacity: 2,
    statusEffects: [],
    relics: [],
    ...overrides,
  };
}

function createMockEnemy(overrides?: Partial<Enemy>): Enemy {
  return {
    id: 'mock_enemy',
    name: '測試食屍鬼',
    title: '地下潛伏者',
    health: 30,
    maxHealth: 30,
    armor: 0,
    currentIntent: {
      type: 'attack',
      value: 6,
      name: '利爪撕咬',
      description: '造成 6 點肉體傷害',
    },
    statusEffects: [],
    traits: [],
    ...overrides,
  };
}

describe('CombatTurnResolver (Pure Functional Combat Lifecycle)', () => {
  it('resolves enemy attack with armor absorption and decrements investigator health', () => {
    const investigator = createMockInvestigator({ health: 25, armor: 4 });
    const enemy = createMockEnemy({
      currentIntent: { type: 'attack', value: 6, name: '猛擊', description: '造成 6 點傷害' },
    });
    const sanityDeck = [createMockCard({ id: 'c1' }), createMockCard({ id: 'c2' })];
    const retainedHand = [createMockCard({ id: 'h1' })];

    const context: CombatTurnContext = {
      investigator,
      enemy,
      turn: 1,
      retainedHand,
      sanityDeck,
      discardPile: [],
      isMadness: false,
    };

    const result = resolveCombatTurnEnd(context);

    expect(result.outcome).toBe('ongoing');
    expect(result.investigator.armor).toBe(0);
    expect(result.investigator.health).toBe(23); // 25 - (6 - 4) = 23
    expect(result.turn).toBe(2);
    expect(result.investigator.stamina).toBe(3); // Reset to maxStamina
    expect(result.cardsPlayedThisTurn).toBe(0);
  });

  it('handles multi-hit claw attacks absorbing armor across hits', () => {
    const investigator = createMockInvestigator({ health: 25, armor: 5 });
    const enemy = createMockEnemy({
      currentIntent: {
        type: 'attack',
        value: 3,
        name: '連環撕裂',
        description: '造成 4 次打擊，每次 3 點傷害',
        hitCount: 4,
      },
    });
    const sanityDeck = [createMockCard(), createMockCard()];

    const context: CombatTurnContext = {
      investigator,
      enemy,
      turn: 1,
      retainedHand: [],
      sanityDeck,
      discardPile: [],
      isMadness: false,
    };

    const result = resolveCombatTurnEnd(context);

    // Hit 1: 3 dmg vs 5 armor -> absorbed 3, armor=2, hp=25
    // Hit 2: 3 dmg vs 2 armor -> absorbed 2, eff 1, armor=0, hp=24
    // Hit 3: 3 dmg vs 0 armor -> eff 3, hp=21
    // Hit 4: 3 dmg vs 0 armor -> eff 3, hp=18
    expect(result.investigator.armor).toBe(0);
    expect(result.investigator.health).toBe(18);
    expect(result.logs.some((l) => l.includes('連續狂暴撕咬 4 次'))).toBe(true);
  });

  it('resolves turn-end status effects (bleed damages hp, horror erodes sanity deck) and decays stacks', () => {
    const investigator = createMockInvestigator({
      health: 20,
      statusEffects: [
        { type: 'bleed', stacks: 2, name: '流血', description: '每回合扣除生命' },
        { type: 'horror', stacks: 1, name: '恐慌', description: '每回合侵蝕理智' },
      ],
    });
    const enemy = createMockEnemy({
      currentIntent: { type: 'defend', value: 4, name: '警戒', description: '獲得護甲' },
    });
    const sanityDeck = [createMockCard({ id: 's1' }), createMockCard({ id: 's2' }), createMockCard({ id: 's3' })];

    const context: CombatTurnContext = {
      investigator,
      enemy,
      turn: 1,
      retainedHand: [],
      sanityDeck,
      discardPile: [],
      isMadness: false,
    };

    const result = resolveCombatTurnEnd(context);

    // Bleed 2 stacks dealt 2 damage
    expect(result.investigator.health).toBe(18);
    // Bleed stacks decayed by 1: 2 -> 1
    const nextBleed = result.investigator.statusEffects?.find((s) => s.type === 'bleed');
    expect(nextBleed?.stacks).toBe(1);
    // Horror 1 stack decayed: 1 -> 0 (removed)
    const nextHorror = result.investigator.statusEffects?.find((s) => s.type === 'horror');
    expect(nextHorror).toBeUndefined();
  });

  it('reports defeat outcome when investigator health reaches 0', () => {
    const investigator = createMockInvestigator({ health: 3, armor: 0 });
    const enemy = createMockEnemy({
      currentIntent: { type: 'attack', value: 10, name: '致命重擊', description: '造成 10 點傷害' },
    });

    const context: CombatTurnContext = {
      investigator,
      enemy,
      turn: 1,
      retainedHand: [],
      sanityDeck: [createMockCard()],
      discardPile: [],
      isMadness: false,
    };

    const result = resolveCombatTurnEnd(context);

    expect(result.outcome).toBe('defeat');
    expect(result.investigator.health).toBe(0);
    expect(result.cardsPlayedThisTurn).toBe(0);
    expect(result.logs.some((l) => l.includes('調查員殞命'))).toBe(true);
  });

  it('reports victory outcome when enemy health reaches 0 and clears combat status effects', () => {
    const investigator = createMockInvestigator({
      health: 20,
      statusEffects: [{ type: 'bleed', stacks: 1, name: '流血', description: '' }],
    });
    // Enemy has 2 health, self damages 5 or takes damage
    const enemy = createMockEnemy({
      health: 2,
      currentIntent: {
        type: 'attack',
        value: 0,
        name: '反噬自爆',
        description: '自殘',
        selfDamage: 5,
      },
    });

    const context: CombatTurnContext = {
      investigator,
      enemy,
      turn: 1,
      retainedHand: [],
      sanityDeck: [createMockCard()],
      discardPile: [],
      isMadness: false,
    };

    const result = resolveCombatTurnEnd(context);

    expect(result.outcome).toBe('victory');
    expect(result.enemy.health).toBe(0);
    expect(result.cardsPlayedThisTurn).toBe(0);
    expect(result.investigator.statusEffects).toEqual([]);
    expect(result.logs.some((l) => l.includes('戰鬥勝利'))).toBe(true);
  });

  it('retains hand, increments retainedTurns, and performs fixed draw according to hand capacity', () => {
    const investigator = createMockInvestigator({ handCapacity: 2 });
    const enemy = createMockEnemy({
      currentIntent: { type: 'defend', value: 2, name: '蓄力', description: '' },
    });
    const cardH1 = createMockCard({ id: 'h1', retainedTurns: 1 });
    const cardD1 = createMockCard({ id: 'd1' });
    const cardD2 = createMockCard({ id: 'd2' });
    const cardD3 = createMockCard({ id: 'd3' });

    const context: CombatTurnContext = {
      investigator,
      enemy,
      turn: 1,
      retainedHand: [cardH1],
      sanityDeck: [cardD1, cardD2, cardD3],
      discardPile: [],
      isMadness: false,
    };

    const result = resolveCombatTurnEnd(context);

    // Retained hand has retainedTurns incremented: 1 + 1 = 2
    expect(result.hand[0].id).toBe('h1');
    expect(result.hand[0].retainedTurns).toBe(2);
    // Fixed draw of 2 cards
    expect(result.hand.length).toBe(3); // 1 retained + 2 drawn
    expect(result.hand[1].id).toBe('d1');
    expect(result.hand[2].id).toBe('d2');
    expect(result.sanityDeck.length).toBe(1); // 3 - 2 = 1
    expect(result.drawnCardsCount).toBe(2);
  });

  it('triggers madness state and generates temporary black madness cards when sanity deck is depleted', () => {
    const investigator = createMockInvestigator({ handCapacity: 2 });
    const enemy = createMockEnemy({
      currentIntent: { type: 'defend', value: 2, name: '蓄力', description: '' },
    });

    const context: CombatTurnContext = {
      investigator,
      enemy,
      turn: 1,
      retainedHand: [],
      sanityDeck: [], // Empty sanity deck!
      discardPile: [],
      isMadness: false,
    };

    const result = resolveCombatTurnEnd(context);

    expect(result.isMadness).toBe(true);
    expect(result.hand.length).toBe(2);
    expect(result.hand.every((c) => c.category === 'madness' && c.isTemporary)).toBe(true);
    expect(result.logs.some((l) => l.includes('深淵力量轉化'))).toBe(true);
  });

  it('respects divine immortality on bosses: health never drops below 1 during turn end', () => {
    const investigator = createMockInvestigator();
    const divineBoss = createMockEnemy({
      health: 3,
      divineImmortality: true,
      currentIntent: {
        type: 'attack',
        value: 0,
        name: '星辰反噬',
        description: '自殘',
        selfDamage: 10,
      },
    });

    const context: CombatTurnContext = {
      investigator,
      enemy: divineBoss,
      turn: 1,
      retainedHand: [],
      sanityDeck: [createMockCard()],
      discardPile: [],
      isMadness: false,
    };

    const result = resolveCombatTurnEnd(context);

    expect(result.outcome).toBe('ongoing');
    expect(result.enemy.health).toBe(1); // Clamped to 1!
  });

  it('initializes combat session cleanly with innate cards prioritized and relic bonuses applied', () => {
    const initResult = initializeCombatSession({
      investigator: createMockInvestigator({ handCapacity: 2 }),
      deck: [
        createMockCard({ id: 'normal_1' }),
        createMockCard({ id: 'innate_1', keywords: ['innate'] }),
        createMockCard({ id: 'normal_2' }),
      ],
    });

    expect(initResult.turn).toBe(1);
    expect(initResult.hand.length).toBe(2);
    // Innate card must be drawn into hand
    expect(initResult.hand.some((c) => c.id === 'innate_1')).toBe(true);
    expect(initResult.sanityDeck.length).toBe(1);
    expect(initResult.discardPile).toEqual([]);
    expect(initResult.exhaustPile).toEqual([]);
    expect(initResult.isMadness).toBe(false);
  });

  it('setupCombatDeck filters out temporary cards and ensures innate cards appear in opening hand', () => {
    const rawDeck = [
      createMockCard({ id: 'temp_1', isTemporary: true }),
      createMockCard({ id: 'norm_1' }),
      createMockCard({ id: 'norm_2' }),
      createMockCard({ id: 'innate_alpha', keywords: ['innate'] }),
    ];

    const result = setupCombatDeck(rawDeck, 'investigator', undefined, 2);

    expect(result.hand.length).toBe(2);
    // Temporary cards must be excluded
    expect(result.hand.some((c) => c.id === 'temp_1')).toBe(false);
    expect(result.sanityDeck.some((c) => c.id === 'temp_1')).toBe(false);
    // Innate card must be prioritized into the opening hand
    expect(result.hand.some((c) => c.id === 'innate_alpha')).toBe(true);
    expect(result.sanityDeck.length).toBe(1);
  });
});
