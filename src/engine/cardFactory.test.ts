import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTruthInjectedCards,
  createMadnessCards,
  resetTempCardCounter,
  TRUTH_INJECTED_TEMPLATE,
  MADNESS_CARD_TEMPLATES,
} from './cardFactory';

describe('Card Factory Unique ID Generation', () => {
  beforeEach(() => {
    resetTempCardCounter();
  });

  it('generates completely unique IDs across multiple calls on the same turn for truth injected cards', () => {
    const batch1 = createTruthInjectedCards(2, 1);
    const batch2 = createTruthInjectedCards(2, 1);

    expect(batch1).toHaveLength(2);
    expect(batch2).toHaveLength(2);

    const allCards = [...batch1, ...batch2];
    const allIds = allCards.map((c) => c.id);

    // All 4 cards must have distinct IDs - no collisions such as duplicate temp_truth_t1_1!
    expect(new Set(allIds).size).toBe(4);

    for (const card of allCards) {
      expect(card.isTemporary).toBe(true);
      expect(card.category).toBe('truth');
      expect(card.name).toBe(TRUTH_INJECTED_TEMPLATE.name);
    }
  });

  it('generates completely unique IDs across multiple calls on the same turn for madness cards', () => {
    const batch1 = createMadnessCards(3, 2, 0);
    const batch2 = createMadnessCards(3, 2, 0);

    expect(batch1).toHaveLength(3);
    expect(batch2).toHaveLength(3);

    const allCards = [...batch1, ...batch2];
    const allIds = allCards.map((c) => c.id);

    // All 6 cards must have distinct IDs
    expect(new Set(allIds).size).toBe(6);

    for (const card of allCards) {
      expect(card.isTemporary).toBe(true);
      expect(card.category).toBe('madness');
    }
  });

  it('preserves MADNESS_CARD_TEMPLATES cyclic distribution with unique identifiers', () => {
    const cards = createMadnessCards(5, 1);
    expect(cards).toHaveLength(5);
    expect(new Set(cards.map((c) => c.id)).size).toBe(5);

    expect(cards[0].name).toBe(MADNESS_CARD_TEMPLATES[0].name);
    expect(cards[1].name).toBe(MADNESS_CARD_TEMPLATES[1].name);
    expect(cards[2].name).toBe(MADNESS_CARD_TEMPLATES[2].name);
    expect(cards[3].name).toBe(MADNESS_CARD_TEMPLATES[0].name);
    expect(cards[4].name).toBe(MADNESS_CARD_TEMPLATES[1].name);
  });
});
