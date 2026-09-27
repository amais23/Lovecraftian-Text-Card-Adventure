import { describe, it, expect } from 'vitest';
import { runSliceRollout, type SliceRolloutConfig } from './sliceRollout';
import { getAgentPersona } from './agentPersona';
import { INITIAL_INVESTIGATOR } from '../initialData';
import { getStarterBaseline } from './deckBuilder';

describe('Single Slice 8-Floor Monte Carlo Rollout (ADR-0042 / Issue #87)', () => {
  const starterDeck = getStarterBaseline('investigator');

  describe('1. Slice 1 Exploration (Depth 1, Floor 0~7)', () => {
    it('executes a complete 8-floor traversal and records structured logs and metrics', () => {
      const config: SliceRolloutConfig = {
        sliceId: 1,
        depth: 1,
        startLayer: 0,
        endLayer: 7,
        persona: getAgentPersona('cautious'),
        seed: 1,
        initialInvestigator: { ...INITIAL_INVESTIGATOR, health: 30, maxHealth: 30, obols: 30 },
        initialDeck: [...starterDeck],
      };

      const result = runSliceRollout(config);

      expect(result.nodesVisited.length).toBe(8); // exactly 8 floors visited (layers 0 through 7)
      expect(result.nodesVisited[0].layer).toBe(0);
      expect(result.nodesVisited[7].layer).toBe(7);
      expect(result.combatsFought).toBeGreaterThanOrEqual(1);
      expect(result.investigator.health).toBeGreaterThan(0);
      expect(result.success).toBe(true);
      expect(result.finalDeck.length).toBeGreaterThanOrEqual(8);
      expect(result.decisionLogs.length).toBe(8);
    });

    it('produces identical deterministic trajectory when given the exact same seed', () => {
      const config1: SliceRolloutConfig = {
        sliceId: 1,
        depth: 1,
        startLayer: 0,
        endLayer: 7,
        persona: getAgentPersona('cautious'),
        seed: 12345,
        initialInvestigator: { ...INITIAL_INVESTIGATOR, health: 25, maxHealth: 25, obols: 30 },
        initialDeck: [...starterDeck],
      };
      const config2 = { ...config1 };

      const result1 = runSliceRollout(config1);
      const result2 = runSliceRollout(config2);

      expect(result1.success).toBe(result2.success);
      expect(result1.investigator.health).toBe(result2.investigator.health);
      expect(result1.investigator.obols).toBe(result2.investigator.obols);
      expect(result1.combatHpLoss).toBe(result2.combatHpLoss);
      expect(result1.nodesVisited.map((n) => n.nodeId)).toEqual(result2.nodesVisited.map((n) => n.nodeId));
    });
  });

  describe('2. Immediate Death Pruning (即刻死亡剪枝)', () => {
    it('halts traversal immediately when investigator health reaches 0 and records fatal encounter', () => {
      const lethalConfig: SliceRolloutConfig = {
        sliceId: 1,
        depth: 1,
        startLayer: 0,
        endLayer: 7,
        persona: getAgentPersona('pure_random'),
        seed: 999,
        // Start with 1 HP so any combat damage will cause immediate death
        initialInvestigator: { ...INITIAL_INVESTIGATOR, health: 1, maxHealth: 25, obols: 0 },
        initialDeck: [...starterDeck],
      };

      const result = runSliceRollout(lethalConfig);

      // Should not have completed all 8 layers
      expect(result.success).toBe(false);
      expect(result.investigator.health).toBe(0);
      expect(result.fatalEncounter).toBeDefined();
      expect(result.fatalEncounter?.layer).toBeLessThan(7);
      expect(result.nodesVisited.length).toBeLessThan(8);
    });
  });

  describe('3. Boss Floor Encounter (Slice 2, Depth 1, Floor 8~15)', () => {
    it('traverses from mid-depth haven (floor 8) through to boss (floor 15)', () => {
      const config: SliceRolloutConfig = {
        sliceId: 2,
        depth: 1,
        startLayer: 8,
        endLayer: 15,
        persona: getAgentPersona('cautious'),
        seed: 777,
        initialInvestigator: { ...INITIAL_INVESTIGATOR, health: 25, maxHealth: 25, obols: 50 },
        initialDeck: [...starterDeck],
      };

      const result = runSliceRollout(config);

      // Traversed layers 8 through 15
      expect(result.nodesVisited[0].layer).toBe(8);
      const lastVisited = result.nodesVisited[result.nodesVisited.length - 1];
      if (result.success) {
        expect(lastVisited.layer).toBe(15);
        expect(lastVisited.type).toBe('boss');
      } else {
        expect(result.fatalEncounter).toBeDefined();
      }
    });
  });
});
