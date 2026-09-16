import { describe, it, expect } from 'vitest';
import type { Card, InvestigationMap, Investigator } from '../../types/game';
import {
  generateCombatReward,
  resolveSurvivalSettlement,
} from './settlementResolver';
import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  COMPLETE_ANCIENT_SEAL,
} from '../abyssalSeals';

const MOCK_INVESTIGATOR: Investigator = {
  name: '愛德華·皮爾斯',
  occupation: '私家偵探',
  occupationId: 'investigator',
  health: 15,
  maxHealth: 25,
  stamina: 3,
  maxStamina: 3,
  armor: 2,
  obols: 20,
  handCapacity: 2,
  relics: [],
};

const CARD_A: Card = {
  id: 'card_a',
  name: '左輪射擊',
  costType: 'stamina',
  costValue: 1,
  category: 'combat',
  description: '造成 6 點傷害',
  flavorText: '',
  isTemporary: false,
  effects: [{ type: 'damage', value: 6 }],
};

const CARD_B: Card = {
  id: 'card_b',
  name: '掩體躲避',
  costType: 'stamina',
  costValue: 1,
  category: 'skill',
  description: '獲得 5 點護甲',
  flavorText: '',
  isTemporary: false,
  effects: [{ type: 'armor', value: 5 }],
};

const TEMP_CARD: Card = {
  id: 'temp_madness_1',
  name: '狂亂囈語',
  costType: 'free',
  costValue: 0,
  category: 'madness',
  description: '臨時卡',
  flavorText: '',
  isTemporary: true,
  effects: [],
};

const MOCK_MAP: InvestigationMap = {
  id: 'map_d1',
  name: '阿卡姆地圖',
  depth: 1,
  currentNodeId: 'node_boss',
  layers: [['node_boss']],
  nodes: {
    node_boss: {
      id: 'node_boss',
      type: 'boss',
      layer: 0,
      col: 0,
      label: '修格斯幼體',
      title: '修格斯幼體之巢',
      description: 'BOSS',
      nextNodes: [],
      status: 'current',
    },
  },
};

describe('Survival Settlement Pure Engine (ADR-0030)', () => {
  describe('generateCombatReward', () => {
    it('generates standard reward for regular combat', () => {
      const reward = generateCombatReward({
        currentNodeType: 'combat',
        currentDepth: 1,
        occupationId: 'investigator',
        currentCards: [CARD_A, CARD_B],
      });

      expect(reward.rewardObols).toBe(15);
      expect(reward.rewardCards.length).toBe(3);
      expect(reward.abyssalSealFused).toBeUndefined();
    });

    it('generates enhanced obols for elite node', () => {
      const reward = generateCombatReward({
        currentNodeType: 'elite',
        currentDepth: 1,
        occupationId: 'investigator',
        currentCards: [CARD_A, CARD_B],
      });

      expect(reward.rewardObols).toBe(25);
    });

    it('generates 50 obols for boss node', () => {
      const reward = generateCombatReward({
        currentNodeType: 'boss',
        currentDepth: 1,
        occupationId: 'investigator',
        currentCards: [CARD_A, CARD_B],
      });

      expect(reward.rewardObols).toBe(50);
    });

    it('fuses abyssal seal fragments at Depth 3 boss victory when both fragments are held', () => {
      const reward = generateCombatReward({
        currentNodeType: 'boss',
        currentDepth: 3,
        occupationId: 'investigator',
        currentCards: [CARD_A, ABYSSAL_FRAGMENT_1, ABYSSAL_FRAGMENT_2],
      });

      expect(reward.abyssalSealFused).toBe(true);
      expect(reward.rewardObols).toBe(50);
      expect(reward.updatedDeck).toBeDefined();
      const hasCompleteSeal = reward.updatedDeck?.some((c) => c.id === COMPLETE_ANCIENT_SEAL.id);
      expect(hasCompleteSeal).toBe(true);
      // Fragment 1 & 2 should be consumed
      const hasFrag1 = reward.updatedDeck?.some((c) => c.id === ABYSSAL_FRAGMENT_1.id);
      expect(hasFrag1).toBe(false);
    });
  });

  describe('resolveSurvivalSettlement', () => {
    it('claims card reward on regular combat: retains damage and advances map', () => {
      const result = resolveSurvivalSettlement(
        { type: 'card', cardId: 'reward_card_1' },
        {
          investigator: MOCK_INVESTIGATOR,
          currentCards: [CARD_A, CARD_B, TEMP_CARD],
          currentNodeType: 'combat',
          currentDepth: 1,
          rewardObols: 15,
          map: {
            ...MOCK_MAP,
            currentNodeId: 'node_0',
            nodes: {
              node_0: {
                id: 'node_0',
                type: 'combat',
                layer: 0,
                col: 0,
                label: '小怪',
                title: '常規遭遇',
                description: '小怪',
                nextNodes: ['node_1'],
                status: 'current',
              },
              node_1: {
                id: 'node_1',
                type: 'event',
                layer: 1,
                col: 0,
                label: '奇遇',
                title: '奇遇',
                description: '奇遇',
                nextNodes: [],
                status: 'unvisited',
              },
            },
          },
        }
      );

      // Retains health (凡人體質)
      expect(result.investigator.health).toBe(15);
      expect(result.investigator.armor).toBe(0);
      expect(result.investigator.obols).toBe(35); // 20 + 15
      // Temporary card evaporated, drafted card added
      const allPermanentCards = [...result.sanityDeck, ...result.hand];
      expect(allPermanentCards.length).toBe(3); // CARD_A, CARD_B + drafted card
      expect(allPermanentCards.some((c) => c.id === TEMP_CARD.id)).toBe(false);
      // Map advanced: node_0 visited, node_1 accessible
      expect(result.map?.nodes['node_0'].status).toBe('visited');
      expect(result.map?.nodes['node_1'].status).toBe('accessible');
      expect(result.nextPhase).toBe('map');
      expect(result.clearFallenRecord).toBe(false);
    });

    it('claims card reward on boss victory: full heal to maxHealth and advances to depth_transition', () => {
      const result = resolveSurvivalSettlement(
        { type: 'card', cardId: 'reward_card_1' },
        {
          investigator: MOCK_INVESTIGATOR,
          currentCards: [CARD_A, CARD_B],
          currentNodeType: 'boss',
          currentDepth: 1,
          rewardObols: 50,
          map: MOCK_MAP,
        }
      );

      // Boss recovery rule: heals to maxHealth
      expect(result.investigator.health).toBe(25);
      expect(result.nextPhase).toBe('depth_transition');
    });

    it('claims field dressing: restores 4 HP on normal combat and skips card reward', () => {
      const result = resolveSurvivalSettlement(
        { type: 'field_dressing', healAmount: 4 },
        {
          investigator: MOCK_INVESTIGATOR, // health 15
          currentCards: [CARD_A, CARD_B],
          currentNodeType: 'combat',
          currentDepth: 1,
          rewardObols: 15,
          map: MOCK_MAP,
        }
      );

      expect(result.investigator.health).toBe(19); // 15 + 4
      const allPermanentCards = [...result.sanityDeck, ...result.hand];
      expect(allPermanentCards.length).toBe(2); // No new card added
      expect(result.investigator.obols).toBe(35);
    });

    it('claims abyssal seal at Depth 1 boss: grants fragment 1 and transitions to depth 2', () => {
      const result = resolveSurvivalSettlement(
        { type: 'abyssal_seal' },
        {
          investigator: MOCK_INVESTIGATOR,
          currentCards: [CARD_A, CARD_B],
          currentNodeType: 'boss',
          currentDepth: 1,
          rewardObols: 50,
          map: MOCK_MAP,
        }
      );

      // Abyssal seal choice does NOT add reward obols (放棄常規構築與金幣)
      expect(result.investigator.obols).toBe(20);
      expect(result.investigator.health).toBe(25); // Boss full heal
      const allCards = [...result.sanityDeck, ...result.hand];
      expect(allCards.some((c) => c.id === ABYSSAL_FRAGMENT_1.id)).toBe(true);
      expect(result.nextPhase).toBe('depth_transition');
    });

    it('handles Depth 3 boss victory without seal fusion: triggers Normal Ending and marks clearFallenRecord', () => {
      const result = resolveSurvivalSettlement(
        { type: 'card' },
        {
          investigator: MOCK_INVESTIGATOR,
          currentCards: [CARD_A, CARD_B],
          currentNodeType: 'boss',
          currentDepth: 3,
          abyssalSealFused: false,
          rewardObols: 50,
          map: {
            ...MOCK_MAP,
            depth: 3,
          },
        }
      );

      expect(result.nextPhase).toBe('map');
      expect(result.map?.isCompleted).toBe(true);
      expect(result.clearFallenRecord).toBe(true);
      expect(result.isTrueEnding).toBe(false);
    });

    it('handles Depth 3 boss victory with seal fusion: transitions to Depth 4', () => {
      const result = resolveSurvivalSettlement(
        { type: 'card' },
        {
          investigator: MOCK_INVESTIGATOR,
          currentCards: [CARD_A, CARD_B],
          currentNodeType: 'boss',
          currentDepth: 3,
          abyssalSealFused: true,
          rewardObols: 50,
          map: {
            ...MOCK_MAP,
            depth: 3,
          },
        }
      );

      expect(result.nextPhase).toBe('depth_transition');
      expect(result.clearFallenRecord).toBe(false);
      expect(result.isTrueEnding).toBe(false);
    });

    it('handles Depth 4 final boss victory: triggers True Ending and clears fallen record', () => {
      const result = resolveSurvivalSettlement(
        { type: 'card' },
        {
          investigator: MOCK_INVESTIGATOR,
          currentCards: [CARD_A, CARD_B],
          currentNodeType: 'boss',
          currentDepth: 4,
          rewardObols: 50,
          map: {
            ...MOCK_MAP,
            depth: 4,
          },
        }
      );

      expect(result.isTrueEnding).toBe(true);
      expect(result.clearFallenRecord).toBe(true);
    });

    it('supports deterministic shuffledDeck override for test replay', () => {
      const deterministicDeck = [CARD_B, CARD_A];
      const result = resolveSurvivalSettlement(
        { type: 'skip' },
        {
          investigator: { ...MOCK_INVESTIGATOR, handCapacity: 1 },
          currentCards: [CARD_A, CARD_B],
          currentNodeType: 'combat',
          currentDepth: 1,
          shuffledDeck: deterministicDeck,
          map: MOCK_MAP,
        }
      );

      // handCapacity = 1, so first card goes to hand
      expect(result.hand[0].id).toBe(CARD_B.id);
      expect(result.sanityDeck[0].id).toBe(CARD_A.id);
    });
  });
});
