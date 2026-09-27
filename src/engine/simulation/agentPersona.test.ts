import { describe, it, expect } from 'vitest';
import {
  getAgentPersona,
  getPersonaLabel,
  computeAlertState,
  evaluateRewardChoice,
  evaluateSanctuaryChoice,
  evaluatePathChoice,
  type EvaluationContext,
} from './agentPersona';
import type { Card, MapNode } from '../../types/game';
import { INITIAL_INVESTIGATOR } from '../initialData';

describe('Agent Persona Decision Engine (ADR-0042 / Issue #87)', () => {
  const dummyContext: EvaluationContext = {
    investigator: {
      ...INITIAL_INVESTIGATOR,
      health: 25,
      maxHealth: 25,
      obols: 50,
    },
    sanityDeck: [
      { id: 'c1', name: '普通打擊', category: 'combat', tier: 1, costType: 'stamina', costValue: 1, isTemporary: false, effects: [], description: '', flavorText: '' },
      { id: 'c2', name: '普通防禦', category: 'skill', tier: 1, costType: 'stamina', costValue: 1, isTemporary: false, effects: [], description: '', flavorText: '' },
      { id: 'c3', name: '警用.38轉輪手槍', category: 'combat', tier: 2, costType: 'stamina', costValue: 1, isTemporary: false, effects: [], description: '', flavorText: '' },
    ],
    currentDepth: 1,
    currentLayer: 2,
  };

  describe('1. Persona Definitions & Parameters', () => {
    it('defines all 4 standard personas with distinct alert thresholds and deck tendencies', () => {
      const balanced = getAgentPersona('balanced');
      const cautious = getAgentPersona('cautious');
      const greedy = getAgentPersona('greedy');
      const pureRandom = getAgentPersona('pure_random');

      expect(balanced.healthAlertThreshold).toBe(0.45);
      expect(cautious.healthAlertThreshold).toBe(0.65);
      expect(greedy.healthAlertThreshold).toBe(0.25);
      expect(pureRandom.healthAlertThreshold).toBe(0.0);

      expect(balanced.deckTendency).toBe('balanced');
      expect(cautious.deckTendency).toBe('survival');
      expect(greedy.deckTendency).toBe('streamline');
      expect(pureRandom.deckTendency).toBe('random');
    });

    it('retrieves personas correctly from registry and falls back to balanced on unknown', () => {
      expect(getAgentPersona('greedy').type).toBe('greedy');
      expect(getAgentPersona('unknown' as any).type).toBe('balanced');
    });

    it('provides label, shortRole, uiClass and getPersonaLabel helper for UI and reporting consistency', () => {
      expect(getPersonaLabel('balanced')).toBe('常態平衡型 (Balanced)');
      expect(getPersonaLabel('cautious')).toBe('生存謹慎型 (Cautious)');
      expect(getPersonaLabel('greedy')).toBe('貪婪構築型 (Greedy)');
      expect(getPersonaLabel('pure_random')).toBe('純隨機探索型 (Random)');
      expect(getPersonaLabel('unknown' as any)).toBe('常態平衡型 (Balanced)');

      const cautious = getAgentPersona('cautious');
      expect(cautious.label).toBe('生存謹慎型 (Cautious)');
      expect(cautious.shortRole).toContain('高警戒');
      expect(cautious.uiClass).toBe('cautious');
    });

    it('computes alert state correctly via computeAlertState', () => {
      const cautious = getAgentPersona('cautious'); // threshold 0.65
      const state1 = computeAlertState(cautious, { ...INITIAL_INVESTIGATOR, health: 13, maxHealth: 20 });
      expect(state1.hpRatio).toBeCloseTo(0.65);
      expect(state1.isAlert).toBe(true);

      const state2 = computeAlertState(cautious, { ...INITIAL_INVESTIGATOR, health: 14, maxHealth: 20 });
      expect(state2.hpRatio).toBeCloseTo(0.70);
      expect(state2.isAlert).toBe(false);
    });
  });

  describe('2. Post-Combat Reward Decisions', () => {
    const highTierCard: Card = {
      id: 'high_card',
      name: '神話審判之槍',
      category: 'combat',
      tier: 3,
      costType: 'stamina',
      costValue: 2,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    };
    const basicCard: Card = {
      id: 'basic_card',
      name: '粗劣短棍',
      category: 'combat',
      tier: 1,
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    };

    const rewardOptions = [
      { type: 'card' as const, card: highTierCard },
      { type: 'card' as const, card: basicCard },
      { type: 'bandage' as const, healAmount: 12 },
      { type: 'skip' as const, obols: 5 },
    ];

    it('cautious persona strongly prefers bandage when health is below 65%', () => {
      const lowHpContext: EvaluationContext = {
        ...dummyContext,
        investigator: {
          ...dummyContext.investigator,
          health: 12, // 12 / 25 = 48% < 65%
        },
      };

      // Run multiple deterministic tests with varied randomFn to verify probability mass
      const cautious = getAgentPersona('cautious');
      let bandageChosen = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        const choice = evaluateRewardChoice(cautious, rewardOptions, lowHpContext, () => i / trials);
        if (choice.type === 'bandage') bandageChosen++;
      }

      // Bandage should be picked the vast majority of times (> 70%)
      expect(bandageChosen).toBeGreaterThanOrEqual(70);
    });

    it('greedy persona prefers high tier card or skip over bandage when health is above 25%', () => {
      const healthyContext: EvaluationContext = {
        ...dummyContext,
        investigator: {
          ...dummyContext.investigator,
          health: 20, // 20 / 25 = 80% > 25%
        },
      };

      const greedy = getAgentPersona('greedy');
      let highCardOrSkipChosen = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        const choice = evaluateRewardChoice(greedy, rewardOptions, healthyContext, () => i / trials);
        if (choice.type === 'card' && choice.card?.id === 'high_card') highCardOrSkipChosen++;
        if (choice.type === 'skip') highCardOrSkipChosen++;
      }

      expect(highCardOrSkipChosen).toBeGreaterThanOrEqual(70);
    });

    it('pure random persona samples options uniformly', () => {
      const pureRandom = getAgentPersona('pure_random');
      const counts: Record<string, number> = { bandage: 0, skip: 0, high_card: 0, basic_card: 0 };
      const trials = 400;

      for (let i = 0; i < trials; i++) {
        const choice = evaluateRewardChoice(pureRandom, rewardOptions, dummyContext, () => (i + 0.5) / trials);
        if (choice.type === 'bandage') counts.bandage++;
        else if (choice.type === 'skip') counts.skip++;
        else if (choice.card?.id === 'high_card') counts.high_card++;
        else if (choice.card?.id === 'basic_card') counts.basic_card++;
      }

      // Each of the 4 options should receive roughly 25% (around 100 +/- 15)
      for (const key of Object.keys(counts)) {
        expect(counts[key]).toBeGreaterThan(70);
        expect(counts[key]).toBeLessThan(130);
      }
    });
  });

  describe('3. Sanctuary Decisions', () => {
    const sanctuaryOptions = [
      { action: 'bandage' as const, healAmount: 15 },
      { action: 'meditate' as const, cardsCount: 3 },
      { action: 'purge' as const, cardId: 'c1' }, // remove basic strike
      { action: 'purge' as const, cardId: 'c2' }, // remove basic defend
    ];

    it('greedy persona strongly prioritizes purge (card removal) over bandage when healthy', () => {
      const greedy = getAgentPersona('greedy');
      let purgeCount = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        const choice = evaluateSanctuaryChoice(greedy, sanctuaryOptions, dummyContext, () => i / trials);
        if (choice.action === 'purge') purgeCount++;
      }
      expect(purgeCount).toBeGreaterThanOrEqual(60);
    });

    it('greedy persona recognizes occultist starter cards as purge candidates', () => {
      const occultistContext: EvaluationContext = {
        ...dummyContext,
        sanityDeck: [
          { id: 'card_magic_blast_0', name: '靈能衝擊', category: 'magic', tier: 1, costType: 'sanity', costValue: 1, isTemporary: false, effects: [], description: '', flavorText: '' },
          { id: 'card_astral_ward_0', name: '星界庇護', category: 'skill', tier: 1, costType: 'stamina', costValue: 1, isTemporary: false, effects: [], description: '', flavorText: '' },
          { id: 'card_high_magic', name: '星辰裂解', category: 'magic', tier: 3, costType: 'sanity', costValue: 2, isTemporary: false, effects: [], description: '', flavorText: '' },
        ],
      };
      const occSanctuaryOptions = [
        { action: 'bandage' as const, healAmount: 15 },
        { action: 'meditate' as const, cardsCount: 3 },
        { action: 'purge' as const, cardId: 'card_magic_blast_0' },
      ];
      const greedy = getAgentPersona('greedy');
      let purgeCount = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        const choice = evaluateSanctuaryChoice(greedy, occSanctuaryOptions, occultistContext, () => i / trials);
        if (choice.action === 'purge') purgeCount++;
      }
      expect(purgeCount).toBeGreaterThanOrEqual(60);
    });

    it('cautious persona strongly prioritizes bandage when hurt', () => {
      const hurtContext: EvaluationContext = {
        ...dummyContext,
        investigator: {
          ...dummyContext.investigator,
          health: 10,
        },
      };
      const cautious = getAgentPersona('cautious');
      let bandageCount = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        const choice = evaluateSanctuaryChoice(cautious, sanctuaryOptions, hurtContext, () => i / trials);
        if (choice.action === 'bandage') bandageCount++;
      }
      expect(bandageCount).toBeGreaterThanOrEqual(75);
    });
  });

  describe('4. DAG Path Decisions', () => {
    const outgoingNodes: MapNode[] = [
      { id: 'n1', type: 'combat', layer: 3, col: 0, label: '常規遭遇', title: '', description: '', nextNodes: [], status: 'unvisited' },
      { id: 'n2', type: 'elite', layer: 3, col: 1, label: '舊日精英', title: '', description: '', nextNodes: [], status: 'unvisited' },
      { id: 'n3', type: 'sanctuary', layer: 3, col: 2, label: '安全避難所', title: '', description: '', nextNodes: [], status: 'unvisited' },
    ];

    it('cautious persona avoids elite and favors sanctuary when low health', () => {
      const hurtContext: EvaluationContext = {
        ...dummyContext,
        investigator: { ...dummyContext.investigator, health: 8 },
      };
      const cautious = getAgentPersona('cautious');
      let sanctuaryChosen = 0;
      let eliteChosen = 0;
      const trials = 100;
      for (let i = 0; i < trials; i++) {
        const node = evaluatePathChoice(cautious, outgoingNodes, hurtContext, () => i / trials);
        if (node.type === 'sanctuary') sanctuaryChosen++;
        if (node.type === 'elite') eliteChosen++;
      }
      expect(sanctuaryChosen).toBeGreaterThan(60);
      expect(eliteChosen).toBeLessThan(10);
    });
  });
});
