import { describe, it, expect } from 'vitest';
import {
  TIER_1_CARDS,
  TIER_2_CARDS,
  TIER_3_CARDS,
  TIER_4_EXCLUSIVE_CARDS,
  ALL_TIERED_CARDS,
  generateRewardCardsForDepth,
} from './cardTiers';

describe('Tiered Card System (cardTiers - Issue #20 / ADR-0015)', () => {
  it('defines 8 cards for Tier 1, Tier 2, and Tier 3 with valid metadata and non-empty effects', () => {
    expect(TIER_1_CARDS).toHaveLength(8);
    expect(TIER_2_CARDS).toHaveLength(8);
    expect(TIER_3_CARDS).toHaveLength(8);

    for (const card of [...TIER_1_CARDS, ...TIER_2_CARDS, ...TIER_3_CARDS]) {
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
    expect(TIER_4_EXCLUSIVE_CARDS).toHaveLength(4);

    const categories = TIER_4_EXCLUSIVE_CARDS.map((c) => c.category);
    expect(categories).toContain('combat');
    expect(categories).toContain('skill');
    expect(categories).toContain('magic');
    expect(categories).toContain('truth');

    for (const card of TIER_4_EXCLUSIVE_CARDS) {
      expect(card.tier).toBe(4);
      expect(card.effects.length).toBeGreaterThan(0);
    }
  });

  it('generates Tier 1 cards for normal combat in Depth 1', () => {
    const rewards = generateRewardCardsForDepth(1, false, 3);
    expect(rewards).toHaveLength(3);
    expect(rewards.every((c) => c.tier === 1)).toBe(true);
  });

  it('generates Tier 2 cards for normal combat in Depth 2', () => {
    const rewards = generateRewardCardsForDepth(2, false, 3);
    expect(rewards).toHaveLength(3);
    expect(rewards.every((c) => c.tier === 2)).toBe(true);
  });

  it('generates Tier 3 cards for normal combat in Depth 3', () => {
    const rewards = generateRewardCardsForDepth(3, false, 3);
    expect(rewards).toHaveLength(3);
    expect(rewards.every((c) => c.tier === 3)).toBe(true);
  });

  it('generates Tier 3 cards for Depth 1 Boss defeat (越階獎勵 3 選 1，排除 Tier 4+ 專屬卡)', () => {
    const rewards = generateRewardCardsForDepth(1, true, 3);
    expect(rewards).toHaveLength(3);
    expect(rewards.every((c) => c.tier === 3)).toBe(true);
  });

  it('generates all 4 Tier 4+ Exclusive cards for Depth 2 Boss defeat (專屬 4 選 1)', () => {
    const rewards = generateRewardCardsForDepth(2, true);
    expect(rewards).toHaveLength(4);
    expect(rewards.every((c) => c.tier === 4)).toBe(true);

    const names = new Set(rewards.map((c) => c.name));
    expect(names.size).toBe(4);
    expect(names.has('屠神裁決爆轟')).toBe(true);
    expect(names.has('舊神庇護之陣')).toBe(true);
    expect(names.has('超維虛空湮滅')).toBe(true);
    expect(names.has('源初星辰啟示')).toBe(true);
  });

  it('ensures all tiered card IDs and names are unique across ALL_TIERED_CARDS', () => {
    expect(ALL_TIERED_CARDS).toHaveLength(8 + 8 + 8 + 4); // 28 cards
    const ids = new Set(ALL_TIERED_CARDS.map((c) => c.id));
    expect(ids.size).toBe(ALL_TIERED_CARDS.length);

    const names = new Set(ALL_TIERED_CARDS.map((c) => c.name));
    expect(names.size).toBe(ALL_TIERED_CARDS.length);
  });
});
