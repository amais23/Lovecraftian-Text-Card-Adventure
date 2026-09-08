import { describe, it, expect } from 'vitest';
import { evaluateCardPlay } from './evaluator';
import type { CardPlayContext } from './types';
import type { Card } from '../../types/game';
import { COMPLETE_ANCIENT_SEAL, ABYSSAL_FRAGMENT_1 } from './special/abyssal';

describe('CardEvaluator (Seam 1)', () => {
  const createBaseContext = (overrides?: Partial<CardPlayContext>): CardPlayContext => ({
    investigator: {
      health: 25,
      maxHealth: 25,
      stamina: 3,
      armor: 0,
      statusEffects: [],
      handCapacity: 2,
      occupationId: 'investigator',
    },
    enemy: {
      health: 30,
      maxHealth: 30,
      armor: 0,
      name: '阿卡姆異教徒',
      divineImmortality: false,
      statusEffects: [],
    },
    hand: [],
    sanityDeck: [
      {
        id: 'sanity_card_1',
        name: '左輪射擊',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 6 }],
        description: '造成 6 點物理傷害。',
        flavorText: '',
      },
      {
        id: 'sanity_card_2',
        name: '就地掩蔽',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'armor', value: 5 }],
        description: '獲得 5 點護甲。',
        flavorText: '',
      },
    ],
    discardPile: [],
    turn: 1,
    isMadness: false,
    ...overrides,
  });

  describe('Guard conditions', () => {
    it('rejects unplayable cards (e.g. Abyssal Fragments) without changing state', () => {
      const context = createBaseContext();
      const result = evaluateCardPlay(ABYSSAL_FRAGMENT_1, context);

      expect(result.success).toBe(false);
      expect(result.logs[0]).toContain('無法被打出');
      expect(result.investigator.stamina).toBe(3);
    });

    it('rejects Complete Ancient Seal when divine enemy has health > 1', () => {
      const context = createBaseContext({
        enemy: {
          health: 10,
          maxHealth: 30,
          armor: 0,
          name: '克蘇魯星之眷族',
          divineImmortality: true,
          statusEffects: [],
        },
      });
      const result = evaluateCardPlay(COMPLETE_ANCIENT_SEAL, context);

      expect(result.success).toBe(false);
      expect(result.logs[0]).toContain('古印封印中');
    });

    it('rejects card play when stamina is insufficient', () => {
      const expensiveCard: Card = {
        id: 'expensive_strike',
        name: '重磅一擊',
        category: 'combat',
        costType: 'stamina',
        costValue: 4,
        isTemporary: false,
        effects: [{ type: 'damage', value: 20 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext();
      const result = evaluateCardPlay(expensiveCard, context);

      expect(result.success).toBe(false);
      expect(result.logs[0]).toContain('精力不足');
      expect(result.investigator.stamina).toBe(3);
    });

    it('rejects magic card play when sanity deck has fewer cards than required', () => {
      const magicCard: Card = {
        id: 'void_blast',
        name: '虛空烈焰',
        category: 'magic',
        costType: 'sanity',
        costValue: 3,
        isTemporary: false,
        effects: [{ type: 'damage', value: 20 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        sanityDeck: [
          {
            id: 'c1',
            name: 'c1',
            category: 'combat',
            costType: 'stamina',
            costValue: 1,
            isTemporary: false,
            effects: [],
            description: '',
            flavorText: '',
          },
        ],
      });
      const result = evaluateCardPlay(magicCard, context);

      expect(result.success).toBe(false);
      expect(result.logs[0]).toContain('理智不足');
    });
  });

  describe('Resource deductions & lifecycle', () => {
    it('deducts stamina and moves regular card from hand to discard pile', () => {
      const card: Card = {
        id: 'revolver_card',
        name: '左輪射擊',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 6 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        hand: [card],
      });

      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.investigator.stamina).toBe(2);
      expect(result.hand).toHaveLength(0);
      expect(result.discardPile.some((c) => c.id === card.id)).toBe(true);
    });

    it('does not put temporary cards into the discard pile (dissolves)', () => {
      const tempCard: Card = {
        id: 'temp_madness_claw',
        name: '盲目爪擊',
        category: 'madness',
        costType: 'stamina',
        costValue: 1,
        isTemporary: true,
        effects: [{ type: 'damage', value: 10 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        hand: [tempCard],
      });

      const result = evaluateCardPlay(tempCard, context);
      expect(result.success).toBe(true);
      expect(result.discardPile).toHaveLength(0);
    });

    it('burns cards from sanityDeck into discardPile when casting sanity magic', () => {
      const magicCard: Card = {
        id: 'magic_blast',
        name: '靈能衝擊',
        category: 'magic',
        costType: 'sanity',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 9 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        hand: [magicCard],
      });

      const result = evaluateCardPlay(magicCard, context);
      expect(result.success).toBe(true);
      expect(result.sanityDeck).toHaveLength(1); // 2 - 1 = 1
      expect(result.discardPile.some((c) => c.id === 'sanity_card_1')).toBe(true);
      expect(result.discardPile.some((c) => c.id === magicCard.id)).toBe(true);
    });
  });

  describe('Damage and Combat resolution', () => {
    it('applies damage factoring in might and vulnerable bonuses', () => {
      const card: Card = {
        id: 'punch',
        name: '重拳壓制',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 4 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        investigator: {
          ...createBaseContext().investigator,
          statusEffects: [{ type: 'might', name: '力量', stacks: 2, description: '' }],
        },
        enemy: {
          ...createBaseContext().enemy,
          armor: 2,
          health: 20,
          statusEffects: [{ type: 'vulnerable', name: '易傷', stacks: 1, description: '' }],
        },
      });

      // Base 4 + 2 (might) = 6 * 1.5 (vulnerable) = 9 damage.
      // Enemy has 2 armor, so 2 absorbed, 7 to health -> 20 - 7 = 13 health, 0 armor.
      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.enemy.armor).toBe(0);
      expect(result.enemy.health).toBe(13);
    });

    it('locks divine enemy health at minimum 1 for non-seal fatal attacks', () => {
      const card: Card = {
        id: 'super_strike',
        name: '極限爆發',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'damage', value: 50 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        enemy: {
          health: 5,
          maxHealth: 50,
          armor: 0,
          name: '克蘇魯星之眷族',
          divineImmortality: true,
          statusEffects: [],
        },
      });

      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.enemy.health).toBe(1);
      expect(result.combatOutcome).toBe('none');
      expect(result.logs.some((l) => l.includes('神性不朽'))).toBe(true);
    });

    it('executes divine boss and achieves true ending when Complete Ancient Seal strikes at 1 health', () => {
      const context = createBaseContext({
        enemy: {
          health: 1,
          maxHealth: 50,
          armor: 10,
          name: '克蘇魯星之眷族',
          divineImmortality: true,
          statusEffects: [],
        },
      });

      const result = evaluateCardPlay(COMPLETE_ANCIENT_SEAL, context);
      expect(result.success).toBe(true);
      expect(result.enemy.health).toBe(0);
      expect(result.enemy.armor).toBe(0);
      expect(result.combatOutcome).toBe('victory');
      expect(result.isTrueEnding).toBe(true);
      expect(result.logs.some((l) => l.includes('太古星辰封滅'))).toBe(true);
    });
  });

  describe('Armor, Healing & Status Effects', () => {
    it('gains armor factoring in resilience stacks', () => {
      const card: Card = {
        id: 'cover',
        name: '就地掩蔽',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'armor', value: 5 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        investigator: {
          ...createBaseContext().investigator,
          statusEffects: [{ type: 'resilience', name: '堅韌', stacks: 3, description: '' }],
        },
      });

      // Base 5 + 3 = 8 armor
      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.investigator.armor).toBe(8);
    });

    it('applies status effects to enemy or self correctly', () => {
      const card: Card = {
        id: 'status_card',
        name: '恐慌符文',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [
          { type: 'apply_status', value: 2, statusType: 'might', target: 'self' },
          { type: 'apply_status', value: 3, statusType: 'vulnerable', target: 'enemy' },
        ],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext();

      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.investigator.statusEffects.some((s) => s.type === 'might' && s.stacks === 2)).toBe(true);
      expect(result.enemy.statusEffects.some((s) => s.type === 'vulnerable' && s.stacks === 3)).toBe(true);
    });

    it('heals investigator capped at maxHealth', () => {
      const card: Card = {
        id: 'heal_card',
        name: '醫療急救',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'heal', value: 10 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        investigator: {
          ...createBaseContext().investigator,
          health: 20,
          maxHealth: 25,
        },
      });

      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.investigator.health).toBe(25);
    });
  });

  describe('Deck manipulation & Sanity transitions', () => {
    it('draws cards from sanity deck', () => {
      const card: Card = {
        id: 'draw_card',
        name: '敏銳觀察',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'draw', value: 1 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext();

      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.hand).toHaveLength(1);
      expect(result.sanityDeck).toHaveLength(1);
    });

    it('generates temporary madness cards when drawing with empty sanity deck', () => {
      const card: Card = {
        id: 'draw_card',
        name: '狂亂攫取',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'draw', value: 2 }],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        sanityDeck: [],
        isMadness: true,
      });

      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.hand).toHaveLength(2);
      expect(result.hand.every((c) => c.category === 'madness' && c.isTemporary)).toBe(true);
    });

    it('restores discarded cards into sanity deck', () => {
      const card: Card = {
        id: 'restore_card',
        name: '心智撫平',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'restore_sanity', value: 2 }],
        description: '',
        flavorText: '',
      };
      const discardedCard1: Card = {
        id: 'disc_1',
        name: '已棄卡1',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [],
        description: '',
        flavorText: '',
      };
      const discardedCard2: Card = {
        id: 'disc_2',
        name: '已棄卡2',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        discardPile: [discardedCard1, discardedCard2],
      });

      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.sanityDeck).toHaveLength(4); // 2 initial + 2 restored
      expect(result.sanityDeck[0].id).toBe('disc_2');
      expect(result.sanityDeck[1].id).toBe('disc_1');
    });

    it('handles self damage and triggers defeat when investigator health reaches 0', () => {
      const card: Card = {
        id: 'suicide_claw',
        name: '盲目爪擊',
        category: 'madness',
        costType: 'stamina',
        costValue: 1,
        isTemporary: true,
        effects: [
          { type: 'damage', value: 10 },
          { type: 'self_damage', value: 10 },
        ],
        description: '',
        flavorText: '',
      };
      const context = createBaseContext({
        investigator: {
          ...createBaseContext().investigator,
          health: 5,
        },
      });

      const result = evaluateCardPlay(card, context);
      expect(result.success).toBe(true);
      expect(result.investigator.health).toBe(0);
      expect(result.combatOutcome).toBe('defeat');
      expect(result.investigator.statusEffects).toHaveLength(0);
    });
  });
});
