import { describe, it, expect } from 'vitest';
import { CardRegistry } from './registry';

describe('CardRegistry (Seam 2)', () => {
  it('returns exactly 50 distinct unique cards in getAllCompendiumCards()', () => {
    const cards = CardRegistry.getAllCompendiumCards();
    expect(cards).toHaveLength(50);

    const ids = new Set(cards.map((c) => c.id));
    expect(ids.size).toBe(50);

    const names = new Set(cards.map((c) => c.name));
    expect(names.size).toBe(50);
  });

  it('correctly maps all 5 categories with expected counts in compendium', () => {
    const cards = CardRegistry.getAllCompendiumCards();
    const counts = { combat: 0, skill: 0, magic: 0, truth: 0, madness: 0 };
    for (const c of cards) {
      counts[c.category]++;
    }
    expect(counts.combat).toBe(12);
    expect(counts.skill).toBe(13);
    expect(counts.magic).toBe(9);
    expect(counts.truth).toBe(10);
    expect(counts.madness).toBe(6);
  });

  describe('getStarterDeck()', () => {
    it('returns the 12-card starter deck for investigator with correct IDs', () => {
      const deck = CardRegistry.getStarterDeck('investigator');
      expect(deck).toHaveLength(12);
      expect(deck.every((c) => !c.occupations || c.occupations.includes('investigator'))).toBe(true);
      expect(deck.some((c) => c.name === '左輪射擊')).toBe(true);
      expect(deck.some((c) => c.name === '重拳壓制')).toBe(true);
    });

    it('returns the 12-card starter deck for occultist with correct IDs', () => {
      const deck = CardRegistry.getStarterDeck('occultist');
      expect(deck).toHaveLength(12);
      expect(deck.every((c) => !c.occupations || c.occupations.includes('occultist'))).toBe(true);
      expect(deck.some((c) => c.name === '靈能衝擊')).toBe(true);
      expect(deck.some((c) => c.name === '厄運凝視')).toBe(true);
    });
  });

  describe('getCardsForOccupation()', () => {
    it('returns only investigator and neutral cards for investigator', () => {
      const cards = CardRegistry.getCardsForOccupation('investigator');
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        if (card.occupations) {
          expect(card.occupations).toContain('investigator');
        }
      }
      // Should NOT include occultist-only cards like '靈能衝擊' or '厄運凝視'
      expect(cards.some((c) => c.name === '靈能衝擊')).toBe(false);
      expect(cards.some((c) => c.name === '厄運凝視')).toBe(false);
    });

    it('returns only occultist and neutral cards for occultist', () => {
      const cards = CardRegistry.getCardsForOccupation('occultist');
      expect(cards.length).toBeGreaterThan(0);
      for (const card of cards) {
        if (card.occupations) {
          expect(card.occupations).toContain('occultist');
        }
      }
      // Should NOT include investigator-only cards like '左輪射擊' or '重拳壓制'
      expect(cards.some((c) => c.name === '左輪射擊')).toBe(false);
      expect(cards.some((c) => c.name === '重拳壓制')).toBe(false);
    });

    it('supports filtering by tier and category', () => {
      const t1Combat = CardRegistry.getCardsForOccupation('investigator', { tier: 1, category: 'combat' });
      expect(t1Combat.length).toBeGreaterThan(0);
      expect(t1Combat.every((c) => c.tier === 1 && c.category === 'combat')).toBe(true);
    });
  });

  describe('getRewardPool()', () => {
    it('returns valid rewards appropriate for the depth and occupation', () => {
      const depth1Rewards = CardRegistry.getRewardPool('investigator', 1);
      expect(depth1Rewards.length).toBeGreaterThan(0);
      // Depth 1 rewards should not contain occultist-only spells
      expect(depth1Rewards.some((c) => c.name === '虛空烈焰')).toBe(false);
      expect(depth1Rewards.some((c) => c.name === '恐懼低語')).toBe(false);
      // But should contain investigator combat cards or neutral skills
      expect(depth1Rewards.some((c) => c.name === '雙管獵槍')).toBe(true);
    });

    it('returns occultist rewards for occultist in depth 1', () => {
      const occultistRewards = CardRegistry.getRewardPool('occultist', 1);
      expect(occultistRewards.some((c) => c.name === '虛空烈焰')).toBe(true);
      expect(occultistRewards.some((c) => c.name === '雙管獵槍')).toBe(false);
    });
  });

  describe('getCardById()', () => {
    it('retrieves card by exact id', () => {
      const card = CardRegistry.getCardById('card_revolver_1');
      expect(card).toBeDefined();
      expect(card?.name).toBe('左輪射擊');
    });

    it('returns undefined for non-existent id', () => {
      expect(CardRegistry.getCardById('non_existent_card_id')).toBeUndefined();
    });
  });
});
