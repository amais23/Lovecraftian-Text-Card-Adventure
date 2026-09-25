import { describe, it, expect } from 'vitest';
import {
  computeWeightedJaccardDistance,
  classicalMDS,
  detectEmergentArchetypes,
} from './deckTopology';
import type { Card } from '../../types/game';

describe('Deck Topology & Emergent Archetypes (ADR-0038)', () => {
  const cardA: Card = {
    id: 'card_a',
    name: '卡牌A',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [],
    description: '',
    flavorText: '',
  };

  const cardB: Card = {
    id: 'card_b',
    name: '卡牌B',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [],
    description: '',
    flavorText: '',
  };

  const cardC: Card = {
    id: 'card_c',
    name: '卡牌C',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [],
    description: '',
    flavorText: '',
  };

  const cardD: Card = {
    id: 'card_d',
    name: '卡牌D',
    category: 'magic',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [],
    description: '',
    flavorText: '',
  };

  describe('Weighted Jaccard Distance', () => {
    it('returns 0 for identical decks', () => {
      const deck1 = [cardA, cardA, cardB];
      const deck2 = [cardA, cardA, cardB];
      const dist = computeWeightedJaccardDistance(deck1, deck2);
      expect(dist).toBeCloseTo(0, 5);
    });

    it('returns 1 for completely disjoint decks', () => {
      const deck1 = [cardA, cardB];
      const deck2 = [cardC, cardD];
      const dist = computeWeightedJaccardDistance(deck1, deck2);
      expect(dist).toBeCloseTo(1, 5);
    });

    it('accurately computes partial overlap distance', () => {
      // Deck 1: A:2, B:1 (total 3)
      // Deck 2: A:1, B:2 (total 3)
      // Min: A:1, B:1 (sum = 2)
      // Max: A:2, B:2 (sum = 4)
      // Jaccard = 2/4 = 0.5 -> dist = 0.5
      const deck1 = [cardA, cardA, cardB];
      const deck2 = [cardA, cardB, cardB];
      const dist = computeWeightedJaccardDistance(deck1, deck2);
      expect(dist).toBeCloseTo(0.5, 5);
    });
  });

  describe('Classical Multidimensional Scaling (MDS)', () => {
    it('projects a 3-point equilateral triangle into 2D preserving equal distances', () => {
      // 3 points where all pairwise distances are 1.0
      const distMatrix = [
        [0, 1, 1],
        [1, 0, 1],
        [1, 1, 0],
      ];
      const coords = classicalMDS(distMatrix);
      expect(coords).toHaveLength(3);

      // Verify all coordinates are normalized within [0, 1]
      coords.forEach(([x, y]) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(1);
      });

      // Verify pairwise Euclidean distances in 2D are roughly equal
      const d01 = Math.hypot(coords[0][0] - coords[1][0], coords[0][1] - coords[1][1]);
      const d12 = Math.hypot(coords[1][0] - coords[2][0], coords[1][1] - coords[2][1]);
      const d02 = Math.hypot(coords[0][0] - coords[2][0], coords[0][1] - coords[2][1]);

      expect(Math.abs(d01 - d12)).toBeLessThan(0.1);
      expect(Math.abs(d12 - d02)).toBeLessThan(0.1);
    });

    it('handles small or edge-case distance matrices gracefully', () => {
      const distMatrix1 = [[0]];
      const coords1 = classicalMDS(distMatrix1);
      expect(coords1).toHaveLength(1);
      expect(coords1[0]).toEqual([0.5, 0.5]);

      const distMatrix2 = [
        [0, 2],
        [2, 0],
      ];
      const coords2 = classicalMDS(distMatrix2);
      expect(coords2).toHaveLength(2);
    });
  });

  describe('Emergent Archetype Community Detection', () => {
    it('groups cards with strong pairwise synergies and names them with signature cards', () => {
      // Group 1: cardA and cardB have strong synergy (15)
      // Group 2: cardC and cardD have strong synergy (20)
      // Cross-group synergy is 0
      const cardList = [cardA, cardB, cardC, cardD];
      const synergyMatrix = new Map<string, Map<string, number>>();

      cardList.forEach((c1) => {
        const row = new Map<string, number>();
        cardList.forEach((c2) => {
          if (c1.id === c2.id) {
            row.set(c2.id, 0);
          } else if (
            (c1.id === 'card_a' && c2.id === 'card_b') ||
            (c1.id === 'card_b' && c2.id === 'card_a')
          ) {
            row.set(c2.id, 15);
          } else if (
            (c1.id === 'card_c' && c2.id === 'card_d') ||
            (c1.id === 'card_d' && c2.id === 'card_c')
          ) {
            row.set(c2.id, 20);
          } else {
            row.set(c2.id, 0);
          }
        });
        synergyMatrix.set(c1.id, row);
      });

      const cardScores = new Map<string, number>([
        ['card_a', 85],
        ['card_b', 80],
        ['card_c', 90],
        ['card_d', 75],
      ]);

      const archetypes = detectEmergentArchetypes({
        cards: cardList,
        synergyMatrix,
        cardScores,
      });

      expect(archetypes.length).toBeGreaterThanOrEqual(2);

      // Verify that cardA and cardB are in the same community
      const archA = archetypes.find((a) => a.memberCardIds.includes('card_a'));
      expect(archA?.memberCardIds).toContain('card_b');
      expect(archA?.memberCardIds).not.toContain('card_c');

      // Verify naming format 【signature1＋signature2】體系
      expect(archA?.name).toContain('【');
      expect(archA?.name).toContain('體系');
      expect(archA?.signatureCards).toHaveLength(2);
    });
  });
});
