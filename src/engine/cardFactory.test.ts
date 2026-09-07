import { describe, it, expect } from 'vitest';
import {
  createTruthInjectedCards,
  createMadnessCards,
  ensureUniqueCardIds,
  TRUTH_INJECTED_TEMPLATE,
  MADNESS_CARD_TEMPLATES,
} from './cardFactory';
import type { Card } from '../types/game';

describe('Card Factory Pure & Deterministic ID Generation', () => {
  it('is completely pure and deterministic given identical arguments', () => {
    const callA = createTruthInjectedCards(2, 1, 0);
    const callB = createTruthInjectedCards(2, 1, 0);

    expect(callA).toEqual(callB);
    expect(callA[0].id).toBe('temp_truth_t1_0');
    expect(callA[1].id).toBe('temp_truth_t1_1');
  });

  it('generates unique IDs across sequential batches using offset or existing card array for truth cards', () => {
    const batch1 = createTruthInjectedCards(2, 1, 0);
    // Passing existing cards or numeric offset cleanly offsets the ID generation
    const batch2 = createTruthInjectedCards(2, 1, batch1);

    expect(batch1).toHaveLength(2);
    expect(batch2).toHaveLength(2);

    expect(batch1.map((c) => c.id)).toEqual(['temp_truth_t1_0', 'temp_truth_t1_1']);
    expect(batch2.map((c) => c.id)).toEqual(['temp_truth_t1_2', 'temp_truth_t1_3']);

    const allCards = [...batch1, ...batch2];
    const allIds = allCards.map((c) => c.id);

    expect(new Set(allIds).size).toBe(4);

    for (const card of allCards) {
      expect(card.isTemporary).toBe(true);
      expect(card.category).toBe('truth');
      expect(card.name).toBe(TRUTH_INJECTED_TEMPLATE.name);
    }
  });

  it('generates unique IDs across sequential batches using offset or existing card array for madness cards', () => {
    const batch1 = createMadnessCards(3, 2, 0);
    const batch2 = createMadnessCards(3, 2, batch1);

    expect(batch1).toHaveLength(3);
    expect(batch2).toHaveLength(3);

    expect(batch1.map((c) => c.id)).toEqual([
      'temp_madness_t2_0',
      'temp_madness_t2_1',
      'temp_madness_t2_2',
    ]);
    expect(batch2.map((c) => c.id)).toEqual([
      'temp_madness_t2_3',
      'temp_madness_t2_4',
      'temp_madness_t2_5',
    ]);

    const allCards = [...batch1, ...batch2];
    const allIds = allCards.map((c) => c.id);

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

  describe('ensureUniqueCardIds', () => {
    it('returns empty array when given empty array', () => {
      expect(ensureUniqueCardIds([])).toEqual([]);
    });

    it('returns identical array when IDs are already unique', () => {
      const cards: Card[] = [
        { ...TRUTH_INJECTED_TEMPLATE, id: 'c1', isTemporary: false },
        { ...TRUTH_INJECTED_TEMPLATE, id: 'c2', isTemporary: false },
      ];
      expect(ensureUniqueCardIds(cards)).toEqual(cards);
    });

    it('appends deterministic _copy_X suffix to duplicate IDs', () => {
      const cards: Card[] = [
        { ...TRUTH_INJECTED_TEMPLATE, id: 'card_dup', isTemporary: false },
        { ...TRUTH_INJECTED_TEMPLATE, id: 'card_dup', isTemporary: false },
        { ...TRUTH_INJECTED_TEMPLATE, id: 'card_dup', isTemporary: false },
      ];
      const result = ensureUniqueCardIds(cards);
      expect(result.map((c) => c.id)).toEqual([
        'card_dup',
        'card_dup_copy_1',
        'card_dup_copy_2',
      ]);
    });
  });
});
