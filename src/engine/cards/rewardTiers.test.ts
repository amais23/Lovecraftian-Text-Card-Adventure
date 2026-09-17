import { describe, it, expect } from 'vitest';
import {
  CardRegistry,
  generateRewardCards,
  getCardsByTier,
  getAllTieredCards,
} from './registry';

describe('Card Tier & Reward System (CardRegistry - ADR-0031)', () => {
  it('dynamically retrieves cards for Tier 1, Tier 2, and Tier 3 with valid metadata', () => {
    const tier1 = CardRegistry.getCardsByTier(1);
    const tier2 = CardRegistry.getCardsByTier(2);
    const tier3 = CardRegistry.getCardsByTier(3);

    expect(tier1.length).toBeGreaterThanOrEqual(8);
    expect(tier2.length).toBeGreaterThanOrEqual(8);
    expect(tier3).toHaveLength(8);

    for (const card of [...tier1, ...tier2, ...tier3]) {
      expect(card.id).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(card.tier).toBeDefined();
      expect(card.description.length).toBeGreaterThan(5);
      expect(card.flavorText.length).toBeGreaterThan(5);
      expect(card.effects.length).toBeGreaterThan(0);
      expect(card.isTemporary).toBe(false);
      expect(['combat', 'skill', 'magic', 'truth']).toContain(card.category);
    }
  });

  it('defines exactly 4 distinct Tier 4+ Exclusive cards covering the 4 major categories', () => {
    const tier4 = CardRegistry.getCardsByTier(4);
    expect(tier4).toHaveLength(4);

    const categories = tier4.map((c) => c.category);
    expect(categories).toContain('combat');
    expect(categories).toContain('skill');
    expect(categories).toContain('magic');
    expect(categories).toContain('truth');

    for (const card of tier4) {
      expect(card.tier).toBe(4);
      expect(card.effects.length).toBeGreaterThan(0);
    }
  });

  it('generates Tier 1 cards for normal combat in Depth 1', () => {
    const rewards = CardRegistry.generateRewardCards({ depth: 1, isBoss: false, count: 3 });
    expect(rewards).toHaveLength(3);
    expect(rewards.every((c) => c.tier === 1)).toBe(true);
  });

  it('generates Tier 2 cards for normal combat in Depth 2', () => {
    const rewards = CardRegistry.generateRewardCards({ depth: 2, isBoss: false, count: 3 });
    expect(rewards).toHaveLength(3);
    expect(rewards.every((c) => c.tier === 2)).toBe(true);
  });

  it('generates Tier 3 cards for normal combat in Depth 3, 4, and higher depths (ADR-0031 Depth >= 3 rule)', () => {
    const rewardsD3 = CardRegistry.generateRewardCards({ depth: 3, isBoss: false, count: 3 });
    expect(rewardsD3).toHaveLength(3);
    expect(rewardsD3.every((c) => c.tier === 3)).toBe(true);

    const rewardsD4 = CardRegistry.generateRewardCards({ depth: 4, isBoss: false, count: 3 });
    expect(rewardsD4).toHaveLength(3);
    expect(rewardsD4.every((c) => c.tier === 3)).toBe(true);

    // Any depth >= 3 should strictly produce Tier 3 cards according to ADR-0031
    const rewardsD5 = CardRegistry.generateRewardCards({ depth: 5 as any, isBoss: false, count: 3 });
    expect(rewardsD5).toHaveLength(3);
    expect(rewardsD5.every((c) => c.tier === 3)).toBe(true);
  });

  it('generates Tier 3 cards for Depth 1 Boss defeat (越階獎勵 3 選 1，排除 Tier 4+ 專屬卡)', () => {
    const rewards = CardRegistry.generateRewardCards({ depth: 1, isBoss: true, count: 3 });
    expect(rewards).toHaveLength(3);
    expect(rewards.every((c) => c.tier === 3)).toBe(true);
  });

  it('generates all 4 Tier 4+ Exclusive cards for Depth 2+ Boss defeat (專屬 4 選 1)', () => {
    const rewards = CardRegistry.generateRewardCards({ depth: 2, isBoss: true });
    expect(rewards).toHaveLength(4);
    expect(rewards.every((c) => c.tier === 4)).toBe(true);

    const names = new Set(rewards.map((c) => c.name));
    expect(names.size).toBe(4);
    expect(names.has('屠神裁決爆轟')).toBe(true);
    expect(names.has('舊神庇護之陣')).toBe(true);
    expect(names.has('超維虛空湮滅')).toBe(true);
    expect(names.has('源初星辰啟示')).toBe(true);
  });

  it('ensures all tiered card IDs and names are unique across getAllTieredCards()', () => {
    const allTiered = CardRegistry.getAllTieredCards();
    const tier1 = CardRegistry.getCardsByTier(1);
    const tier2 = CardRegistry.getCardsByTier(2);
    const tier3 = CardRegistry.getCardsByTier(3);
    const tier4 = CardRegistry.getCardsByTier(4);

    expect(allTiered).toHaveLength(tier1.length + tier2.length + tier3.length + tier4.length);

    const ids = new Set(allTiered.map((c) => c.id));
    expect(ids.size).toBe(allTiered.length);

    const names = new Set(allTiered.map((c) => c.name));
    expect(names.size).toBe(allTiered.length);
  });

  it('filters reward cards strictly by occupation with zero cross-class cards (ADR-0025)', () => {
    const investigatorRewards = CardRegistry.generateRewardCards({
      depth: 1,
      isBoss: false,
      count: 5,
      occupationId: 'investigator',
    });
    expect(investigatorRewards.every((c) => !c.occupations || c.occupations.includes('investigator'))).toBe(true);
    expect(investigatorRewards.some((c) => c.occupations?.length === 1 && c.occupations[0] === 'occultist')).toBe(false);

    const occultistRewards = CardRegistry.generateRewardCards({
      depth: 1,
      isBoss: false,
      count: 5,
      occupationId: 'occultist',
    });
    expect(occultistRewards.every((c) => !c.occupations || c.occupations.includes('occultist'))).toBe(true);
    expect(occultistRewards.some((c) => c.occupations?.length === 1 && c.occupations[0] === 'investigator')).toBe(false);
  });

  it('supports standalone function exports for ergonomic direct consumption', () => {
    const t1 = getCardsByTier(1);
    expect(t1.length).toBeGreaterThan(0);

    const all = getAllTieredCards();
    expect(all.length).toBeGreaterThan(0);

    const rewards = generateRewardCards({ depth: 1 });
    expect(rewards).toHaveLength(3);
  });
});
