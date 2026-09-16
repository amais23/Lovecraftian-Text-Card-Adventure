import { describe, it, expect } from 'vitest';
import {
  createStatusEffect,
  addStatusEffect,
  getStatusStacks,
  decayStatusEffects,
  calculateAttackDamage,
  calculateArmorGain,
  resolveTurnEndStatusEffects,
  cleanseDebuffs,
} from './statusEffects';
import type { Card, StatusEffect } from '../types/game';

describe('Status Effects System (ADR-0018)', () => {
  describe('createStatusEffect', () => {
    it('creates might status effect with correct metadata', () => {
      const effect = createStatusEffect('might', 2);
      expect(effect.type).toBe('might');
      expect(effect.stacks).toBe(2);
      expect(effect.name).toBe('力量');
      expect(effect.description).toContain('攻擊傷害');
    });

    it('creates resilience, vulnerable, bleed, and horror correctly', () => {
      expect(createStatusEffect('resilience', 1).name).toBe('堅韌');
      expect(createStatusEffect('vulnerable', 2).name).toBe('易傷');
      expect(createStatusEffect('bleed', 3).name).toBe('流血');
      expect(createStatusEffect('horror', 1).name).toBe('恐慌');
    });
  });

  describe('addStatusEffect & getStatusStacks', () => {
    it('adds a new effect to empty or undefined list', () => {
      const effect = createStatusEffect('might', 2);
      const list = addStatusEffect(undefined, effect);
      expect(list).toHaveLength(1);
      expect(getStatusStacks(list, 'might')).toBe(2);
    });

    it('stacks with an existing effect of the same type', () => {
      const initial = [createStatusEffect('might', 2)];
      const updated = addStatusEffect(initial, createStatusEffect('might', 3));
      expect(updated).toHaveLength(1);
      expect(getStatusStacks(updated, 'might')).toBe(5);
    });

    it('keeps distinct effects separate', () => {
      let list: StatusEffect[] = [];
      list = addStatusEffect(list, createStatusEffect('might', 2));
      list = addStatusEffect(list, createStatusEffect('resilience', 1));
      expect(list).toHaveLength(2);
      expect(getStatusStacks(list, 'might')).toBe(2);
      expect(getStatusStacks(list, 'resilience')).toBe(1);
      expect(getStatusStacks(list, 'vulnerable')).toBe(0);
    });
  });

  describe('decayStatusEffects', () => {
    it('decrements stacks by 1 for all active effects', () => {
      const effects = [
        createStatusEffect('might', 3),
        createStatusEffect('resilience', 2),
      ];
      const decayed = decayStatusEffects(effects);
      expect(getStatusStacks(decayed, 'might')).toBe(2);
      expect(getStatusStacks(decayed, 'resilience')).toBe(1);
    });

    it('removes effects whose stacks drop to 0 or below', () => {
      const effects = [
        createStatusEffect('might', 1),
        createStatusEffect('vulnerable', 2),
      ];
      const decayed = decayStatusEffects(effects);
      expect(decayed).toHaveLength(1);
      expect(getStatusStacks(decayed, 'might')).toBe(0);
      expect(getStatusStacks(decayed, 'vulnerable')).toBe(1);
    });

    it('handles undefined or empty lists gracefully', () => {
      expect(decayStatusEffects(undefined)).toEqual([]);
      expect(decayStatusEffects([])).toEqual([]);
    });
  });

  describe('cleanseDebuffs', () => {
    it('reduces all debuffs by 1 stack and removes depleted ones', () => {
      const effects = [
        createStatusEffect('might', 2),
        createStatusEffect('vulnerable', 1),
        createStatusEffect('bleed', 2),
        createStatusEffect('horror', 1),
        createStatusEffect('weak', 2),
      ];
      const { cleansedEffects, removedDebuffs } = cleanseDebuffs(effects, 1);
      expect(removedDebuffs).toEqual([
        '【易傷】-1層',
        '【流血】-1層',
        '【恐慌】-1層',
        '【破勢】-1層',
      ]);
      expect(getStatusStacks(cleansedEffects, 'might')).toBe(2);
      expect(getStatusStacks(cleansedEffects, 'vulnerable')).toBe(0);
      expect(getStatusStacks(cleansedEffects, 'bleed')).toBe(1);
      expect(getStatusStacks(cleansedEffects, 'horror')).toBe(0);
      expect(getStatusStacks(cleansedEffects, 'weak')).toBe(1);
    });
  });

  describe('calculateAttackDamage', () => {
    it('returns base damage without any status effects', () => {
      expect(calculateAttackDamage(6)).toBe(6);
    });

    it('adds might from attacker to damage', () => {
      const attackerEffects = [createStatusEffect('might', 3)];
      expect(calculateAttackDamage(6, attackerEffects)).toBe(9);
    });

    it('reduces damage by 50% when attacker has weak', () => {
      const attackerEffects = [createStatusEffect('weak', 1)];
      expect(calculateAttackDamage(6, attackerEffects)).toBe(3);
      expect(calculateAttackDamage(7, attackerEffects)).toBe(3); // Math.floor(7 * 0.5)
    });

    it('increases damage by 1 per stack when defender has vulnerable', () => {
      const defenderEffects1 = [createStatusEffect('vulnerable', 1)];
      expect(calculateAttackDamage(6, undefined, defenderEffects1)).toBe(7);
      const defenderEffects2 = [createStatusEffect('vulnerable', 3)];
      expect(calculateAttackDamage(6, undefined, defenderEffects2)).toBe(9);
    });

    it('combines might, weak, and vulnerable correctly', () => {
      // (6 base + 2 might) = 8 -> weak (50%) = 4 -> vulnerable +2 = 6
      const attackerEffects = [
        createStatusEffect('might', 2),
        createStatusEffect('weak', 1),
      ];
      const defenderEffects = [createStatusEffect('vulnerable', 2)];
      expect(calculateAttackDamage(6, attackerEffects, defenderEffects)).toBe(6);
    });

    it('never drops damage below 0', () => {
      expect(calculateAttackDamage(-5)).toBe(0);
    });
  });

  describe('calculateArmorGain', () => {
    it('returns base armor without resilience', () => {
      expect(calculateArmorGain(4)).toBe(4);
    });

    it('adds resilience to armor gain', () => {
      const effects = [createStatusEffect('resilience', 2)];
      expect(calculateArmorGain(4, effects)).toBe(6);
    });

    it('never drops below 0', () => {
      expect(calculateArmorGain(0)).toBe(0);
    });
  });

  describe('resolveTurnEndStatusEffects', () => {
    const dummyCard = (id: string): Card => ({
      id,
      name: '卡牌',
      category: 'skill',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    });

    it('resolves bleed damage directly to health and decays by 1', () => {
      const effects = [createStatusEffect('bleed', 3)];
      const result = resolveTurnEndStatusEffects(
        { health: 20 },
        effects,
        '調查員'
      );
      expect(result.newHealth).toBe(17);
      expect(result.decayedEffects).toHaveLength(1);
      expect(getStatusStacks(result.decayedEffects, 'bleed')).toBe(2);
      expect(result.logs.some((l) => l.includes('流血') && l.includes('3 點生命'))).toBe(true);
    });

    it('resolves horror by eroding sanity deck into discard pile and decays by 1', () => {
      const effects = [createStatusEffect('horror', 2)];
      const sanityDeck = [dummyCard('1'), dummyCard('2'), dummyCard('3')];
      const discardPile: Card[] = [];

      const result = resolveTurnEndStatusEffects(
        { health: 15, sanityDeck, discardPile },
        effects,
        '調查員'
      );

      expect(result.erodedCards).toHaveLength(2);
      expect(result.newSanityDeck).toHaveLength(1);
      expect(result.newDiscardPile).toHaveLength(2);
      expect(result.decayedEffects).toHaveLength(1);
      expect(getStatusStacks(result.decayedEffects, 'horror')).toBe(1);
      expect(result.logs.some((l) => l.includes('恐慌') && l.includes('2'))).toBe(true);
    });

    it('handles bleed and horror together along with non-turn-end effects decaying', () => {
      const effects = [
        createStatusEffect('bleed', 1),
        createStatusEffect('horror', 1),
        createStatusEffect('might', 1),
      ];
      const result = resolveTurnEndStatusEffects(
        { health: 10, sanityDeck: [dummyCard('c1')], discardPile: [] },
        effects,
        '調查員'
      );
      expect(result.newHealth).toBe(9);
      expect(result.newSanityDeck).toHaveLength(0);
      expect(result.newDiscardPile).toHaveLength(1);
      // All 3 effects were at 1 stack, so after decaying all are removed
      expect(result.decayedEffects).toHaveLength(0);
    });
  });
});
