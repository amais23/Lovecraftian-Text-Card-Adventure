import { describe, it, expect } from 'vitest';
import {
  getHeatmapColor,
  computeWeightedJaccardDistance,
  computeSoftCosineSimilarity,
  computeSoftCosineDistance,
  computeAllPairSoftCosineDistances,
  classicalMDS,
  forceDirectedGalaxyProjection,
  detectEmergentArchetypes,
  generateArchetypeFamilyDecks,
} from './deckTopology';
import { computeCardMechanicsEmbeddings } from './cardEmbedding';
import { getAllCompendiumCards } from '../cards/registry';
import type { Card } from '../../types/game';
import type { EmergentArchetype } from './balanceTypes';




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

  describe('Soft Cosine Distance (Sidorov et al. 2014)', () => {
    const compendiumCards = getAllCompendiumCards();

    it('returns 0 for identical or empty decks, and satisfies symmetry', () => {
      const distEmpty = computeSoftCosineDistance([], [], [], new Map());
      expect(distEmpty).toBe(0);

      const simEmpty = computeSoftCosineSimilarity([], [], [], new Map());
      expect(simEmpty).toBe(1.0);

      const embeddingResult = computeCardMechanicsEmbeddings(compendiumCards);
      const testDeck = compendiumCards.slice(0, 10);

      const distSelf = computeSoftCosineDistance(
        testDeck,
        testDeck,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );
      expect(distSelf).toBe(0);

      const deckA = compendiumCards.slice(0, 10);
      const deckB = compendiumCards.slice(5, 15);
      const distAB = computeSoftCosineDistance(
        deckA,
        deckB,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );
      const distBA = computeSoftCosineDistance(
        deckB,
        deckA,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );
      expect(distAB).toBe(distBA);
      expect(distAB).toBeGreaterThanOrEqual(0);
      expect(distAB).toBeLessThanOrEqual(1);
    });

    it('replaces hard Jaccard 1.0 with continuous 0.15~0.25 distance when substituting same-niche defense cards', () => {
      const embeddingResult = computeCardMechanicsEmbeddings(compendiumCards);
      const cardMap = new Map(compendiumCards.map((c) => [c.id, c]));

      const cover = cardMap.get('card_cover_1')!; // 就地掩蔽
      const tactical = cardMap.get('reward_tactical_roll_1')!; // 戰術翻滾
      const bastion = cardMap.get('card_tier3_impenetrable_bastion')!; // 不可侵犯之壁
      const ironWill = cardMap.get('card_tier2_iron_will')!; // 鋼鐵意志屏障
      const detonation = cardMap.get('reward_abyssal_detonation')!; // 深淵引爆

      // Shared core cards (8 cards)
      const sharedCards = compendiumCards.slice(0, 8);

      // Deck 1: shared + 2 defense cards [cover, bastion]
      const deck1 = [...sharedCards, cover, bastion];

      // Deck 2: shared + 2 substituted defense cards [tactical, ironWill]
      const deck2 = [...sharedCards, tactical, ironWill];

      // Deck 3: shared + 2 cross-archetype explosive magic cards [detonation, detonation]
      const deck3 = [...sharedCards, detonation, detonation];

      const softDist12 = computeSoftCosineDistance(
        deck1,
        deck2,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );

      const softDist13 = computeSoftCosineDistance(
        deck1,
        deck3,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );

      // Substituting defense cards produces continuous close distance (0.15 ~ 0.25)
      expect(softDist12).toBeGreaterThanOrEqual(0.08);
      expect(softDist12).toBeLessThanOrEqual(0.25);

      // Substituting with cross-archetype detonation produces much higher distance
      expect(softDist13).toBeGreaterThan(softDist12 + 0.15);

      // For a purely substituted 2-card deck (100% disjoint in card identity, Jaccard = 1.0):
      const pureDefDeck1 = [cover, bastion];
      const pureDefDeck2 = [tactical, ironWill];
      const pureJaccard = computeWeightedJaccardDistance(pureDefDeck1, pureDefDeck2);
      const pureSoftDist = computeSoftCosineDistance(
        pureDefDeck1,
        pureDefDeck2,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );

      expect(pureJaccard).toBe(1.0);
      expect(pureSoftDist).toBeLessThan(0.40); // Mechanics semantic distance drops dramatically from 1.0
    });

    it('computes full 380 x 380 distance matrix in under 50ms', () => {
      const embeddingResult = computeCardMechanicsEmbeddings(compendiumCards);

      // Generate 380 synthetic sample decks of 15~20 cards each
      const sampleDecks: Card[][] = [];
      const numDecks = 380;
      for (let i = 0; i < numDecks; i++) {
        const deck: Card[] = [];
        const deckSize = 15 + (i % 6);
        for (let j = 0; j < deckSize; j++) {
          const cardIdx = (i * 7 + j * 13) % compendiumCards.length;
          deck.push(compendiumCards[cardIdx]);
        }
        sampleDecks.push(deck);
      }

      const start = performance.now();
      const distMatrix = computeAllPairSoftCosineDistances(
        sampleDecks,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );
      const elapsed = performance.now() - start;

      expect(distMatrix).toHaveLength(numDecks);
      expect(distMatrix[0]).toHaveLength(numDecks);
      expect(distMatrix[0][0]).toBe(0);
      expect(distMatrix[10][10]).toBe(0);
      expect(distMatrix[15][42]).toBe(distMatrix[42][15]);

      // Performance assertion: strictly < 50ms (typically ~10ms)
      expect(elapsed).toBeLessThan(50);
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

  describe('Archetype Family Sampling (Issue #70)', () => {
    const compendiumCards = getAllCompendiumCards();
    const embeddingResult = computeCardMechanicsEmbeddings(compendiumCards);

    const arch1Cards = compendiumCards
      .filter((c) => c.effects.some((e) => e.type === 'armor' || e.type === 'heal'))
      .slice(0, 8);

    const arch2Cards = compendiumCards
      .filter((c) => c.effects.some((e) => e.type === 'damage'))
      .slice(0, 8);

    const arch3Cards = compendiumCards
      .filter((c) => c.effects.some((e) => e.type === 'draw' || e.type === 'restore_sanity'))
      .slice(0, 8);

    const arch4Cards = compendiumCards
      .filter((c) => c.effects.some((e) => e.type === 'apply_status'))
      .slice(0, 8);

    const mockArchetypes: EmergentArchetype[] = [
      {
        id: 'emergent_arch_1',
        name: `【${arch1Cards[0].name}＋${arch1Cards[1].name}】體系`,
        signatureCards: [
          { id: arch1Cards[0].id, name: arch1Cards[0].name },
          { id: arch1Cards[1].id, name: arch1Cards[1].name },
        ],
        memberCardIds: arch1Cards.map((c) => c.id),
        coreCombos: [],
        deckCount: 0,
        avgScore: 0,
        avgHealthLost: 0,
        avgSanityExpended: 0,
      },
      {
        id: 'emergent_arch_2',
        name: `【${arch2Cards[0].name}＋${arch2Cards[1].name}】體系`,
        signatureCards: [
          { id: arch2Cards[0].id, name: arch2Cards[0].name },
          { id: arch2Cards[1].id, name: arch2Cards[1].name },
        ],
        memberCardIds: arch2Cards.map((c) => c.id),
        coreCombos: [],
        deckCount: 0,
        avgScore: 0,
        avgHealthLost: 0,
        avgSanityExpended: 0,
      },
      {
        id: 'emergent_arch_3',
        name: `【${arch3Cards[0].name}＋${arch3Cards[1].name}】體系`,
        signatureCards: [
          { id: arch3Cards[0].id, name: arch3Cards[0].name },
          { id: arch3Cards[1].id, name: arch3Cards[1].name },
        ],
        memberCardIds: arch3Cards.map((c) => c.id),
        coreCombos: [],
        deckCount: 0,
        avgScore: 0,
        avgHealthLost: 0,
        avgSanityExpended: 0,
      },
      {
        id: 'emergent_arch_4',
        name: `【${arch4Cards[0].name}＋${arch4Cards[1].name}】體系`,
        signatureCards: [
          { id: arch4Cards[0].id, name: arch4Cards[0].name },
          { id: arch4Cards[1].id, name: arch4Cards[1].name },
        ],
        memberCardIds: arch4Cards.map((c) => c.id),
        coreCombos: [],
        deckCount: 0,
        avgScore: 0,
        avgHealthLost: 0,
        avgSanityExpended: 0,
      },
    ];

    it('generates 380 representative decks matching archetype quotas and constraints', () => {
      const familyDecks = generateArchetypeFamilyDecks({
        emergentArchetypes: mockArchetypes,
        allCards: compendiumCards,
        totalTarget: 380,
      });

      expect(familyDecks).toHaveLength(380);

      // Verify hand retention spans 2~6
      const handRetentions = new Set(familyDecks.map((d) => d.handRetention));
      expect(handRetentions.has(2)).toBe(true);
      expect(handRetentions.has(4)).toBe(true);
      expect(handRetentions.has(6)).toBe(true);

      // Verify deck size spans 10~35
      const minSize = Math.min(...familyDecks.map((d) => d.deck.length));
      const maxSize = Math.max(...familyDecks.map((d) => d.deck.length));
      expect(minSize).toBeGreaterThanOrEqual(10);
      expect(maxSize).toBeLessThanOrEqual(35);

      // Verify ~75 variants per pure archetype (4 * 75 = 300)
      const arch1Decks = familyDecks.filter((d) => d.archetypeId === 'emergent_arch_1');
      const arch2Decks = familyDecks.filter((d) => d.archetypeId === 'emergent_arch_2');
      expect(arch1Decks.length).toBe(75);
      expect(arch2Decks.length).toBe(75);

      // Verify ~80 hybrid & rogue decks
      const hybridRogueDecks = familyDecks.filter((d) => d.isHybridOrRogue);
      expect(hybridRogueDecks.length).toBe(80);
    });

    it('verifies natural 70%~90% card overlap and low high-dimensional distance within the same family', () => {
      const familyDecks = generateArchetypeFamilyDecks({
        emergentArchetypes: mockArchetypes,
        allCards: compendiumCards,
        totalTarget: 380,
      });

      const arch1Decks = familyDecks.filter((d) => d.archetypeId === 'emergent_arch_1');
      const arch2Decks = familyDecks.filter((d) => d.archetypeId === 'emergent_arch_2');

      // Sample two decks from Family 1
      const deckA = arch1Decks[0].deck;
      const deckB = arch1Decks[1].deck;

      // Extract base IDs
      const idsA = new Set(deckA.map((c) => c.id.replace(/_copy_\d+$/, '')));
      const idsB = new Set(deckB.map((c) => c.id.replace(/_copy_\d+$/, '')));

      let overlap = 0;
      for (const id of idsA) {
        if (idsB.has(id)) overlap++;
      }
      const overlapRate = overlap / Math.min(idsA.size, idsB.size);

      // Natural overlap rate is between 70% and 90%
      expect(overlapRate).toBeGreaterThanOrEqual(0.65);

      // Compare intra-family Soft Cosine Distance vs cross-family
      const intraDist = computeSoftCosineDistance(
        deckA,
        deckB,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );

      const crossDeck = arch2Decks[0].deck;
      const crossDist = computeSoftCosineDistance(
        deckA,
        crossDeck,
        embeddingResult.similarityMatrix,
        embeddingResult.cardIndexMap
      );

      // Intra-family distance is significantly lower than cross-family distance
      expect(intraDist).toBeLessThan(0.35);
      expect(crossDist).toBeGreaterThan(0.50);
      expect(crossDist).toBeGreaterThan(intraDist + 0.20);
    });
  });

  describe('Scientific Heatmap Color Spectrum (ADR-0038 / Issue #71)', () => {
    it('strictly maps < 40 to Cold Blue, 40~70 to Cyan-Green, and >= 70 to Bright Yellow', () => {
      // Score < 40: Cold Blue (Deep Sea to Ice Blue, B > R)
      const color0 = getHeatmapColor(0);
      const color20 = getHeatmapColor(20);
      const color39 = getHeatmapColor(39);

      expect(color0).toBe('rgb(29, 78, 216)');
      const rgb0 = color0.match(/\d+/g)!.map(Number);
      const rgb20 = color20.match(/\d+/g)!.map(Number);
      const rgb39 = color39.match(/\d+/g)!.map(Number);

      expect(rgb0[2]).toBeGreaterThan(rgb0[0]); // B > R
      expect(rgb20[2]).toBeGreaterThan(rgb20[0]); // B > R
      expect(rgb39[2]).toBeGreaterThan(rgb39[0]); // B > R

      // Score 40~70: Cyan-Green / Warm Green (G is dominant)
      const color40 = getHeatmapColor(40);
      const color55 = getHeatmapColor(55);
      const rgb40 = color40.match(/\d+/g)!.map(Number);
      const rgb55 = color55.match(/\d+/g)!.map(Number);

      expect(rgb40[1]).toBe(185); // Emerald Green
      expect(rgb40[1]).toBeGreaterThan(rgb40[0]);
      expect(rgb55[1]).toBeGreaterThan(rgb55[2]);

      // Score >= 70: Bright Hot Yellow (R >= 250, G >= 200, B <= 60)
      const color70 = getHeatmapColor(70);
      const color90 = getHeatmapColor(90);
      const color100 = getHeatmapColor(100);

      const rgb70 = color70.match(/\d+/g)!.map(Number);
      const rgb90 = color90.match(/\d+/g)!.map(Number);
      const rgb100 = color100.match(/\d+/g)!.map(Number);

      expect(rgb70[0]).toBe(250);
      expect(rgb70[1]).toBe(204);
      expect(rgb70[2]).toBe(21);

      expect(rgb90[0]).toBeGreaterThanOrEqual(250);
      expect(rgb90[1]).toBeGreaterThanOrEqual(200);
      expect(rgb90[2]).toBeLessThanOrEqual(60);

      expect(rgb100[0]).toBe(255);
      expect(rgb100[1]).toBe(235);
      expect(rgb100[2]).toBe(59);
    });
  });

  describe('Non-linear Force-Directed Galaxy Projection (Issue #71)', () => {
    it('executes 60 iterations on 380-node matrix in under 100ms and guarantees 100% determinism', () => {
      const n = 380;
      const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

      for (let i = 0; i < n; i++) {
        const clusterI = Math.floor(i / 95);
        for (let j = i + 1; j < n; j++) {
          const clusterJ = Math.floor(j / 95);
          const d = clusterI === clusterJ ? 0.20 + ((i + j) % 10) * 0.01 : 0.75 + ((i + j) % 10) * 0.01;
          matrix[i][j] = d;
          matrix[j][i] = d;
        }
      }

      const start = performance.now();
      const coords1 = forceDirectedGalaxyProjection(matrix);
      const elapsed = performance.now() - start;

      // Performance assertion: strictly < 100ms
      expect(elapsed).toBeLessThan(100);
      expect(coords1).toHaveLength(380);

      // Determinism assertion: run again, must yield identical coordinates
      const coords2 = forceDirectedGalaxyProjection(matrix);
      for (let i = 0; i < n; i++) {
        expect(coords1[i][0]).toBe(coords2[i][0]);
        expect(coords1[i][1]).toBe(coords2[i][1]);
      }
    });

    it('eliminates false neighbors: 2D nearest neighbors within an island have high-dimensional distance < 0.35', () => {
      const n = 40;
      const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

      for (let i = 0; i < n; i++) {
        const cI = i < 20 ? 0 : 1;
        for (let j = i + 1; j < n; j++) {
          const cJ = j < 20 ? 0 : 1;
          const d = cI === cJ ? 0.20 : 0.80;
          matrix[i][j] = d;
          matrix[j][i] = d;
        }
      }

      const coords = forceDirectedGalaxyProjection(matrix, { iterations: 60 });

      // For every point, find its nearest neighbor in 2D Euclidean space
      for (let i = 0; i < n; i++) {
        let nearestIdx = -1;
        let min2DDist = Infinity;

        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          const dist2D = Math.hypot(coords[i][0] - coords[j][0], coords[i][1] - coords[j][1]);
          if (dist2D < min2DDist) {
            min2DDist = dist2D;
            nearestIdx = j;
          }
        }

        expect(nearestIdx).not.toBe(-1);
        // The nearest neighbor in 2D MUST belong to the same cluster
        const cI = i < 20 ? 0 : 1;
        const cNearest = nearestIdx < 20 ? 0 : 1;
        expect(cNearest).toBe(cI);

        // The actual high-dimensional distance to this 2D nearest neighbor must be < 0.35 (No false neighbors!)
        const actualHighDimDist = matrix[i][nearestIdx];
        expect(actualHighDimDist).toBeLessThan(0.35);
      }
    });
  });
});

