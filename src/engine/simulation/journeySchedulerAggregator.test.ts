import { describe, it, expect } from 'vitest';
import {
  runJourneySimulation,
  SLICE_DEFINITIONS,
  type JourneySimulationResult,
} from './journeyScheduler';

describe('Full-Factor Objective Statistical Matrix Aggregation (ADR-0042 / Issue #89)', () => {
  it('aggregates exhaustive metrics across all 7 slices with minimal samples', () => {
    const result: JourneySimulationResult = runJourneySimulation({
      samplesPerSlice: 8, // 2 per persona
      timeBudgetSeconds: 5,
      occupation: 'investigator',
      seedBase: 42,
    });

    expect(result.progression).toHaveLength(7);
    expect(result.totalRollouts).toBe(7 * 8);
    expect(result.overallSurvivalRate).toBeGreaterThanOrEqual(0);
    expect(result.overallSurvivalRate).toBeLessThanOrEqual(1);

    for (const sliceDef of SLICE_DEFINITIONS) {
      const slice = result.slices[sliceDef.id];
      expect(slice).toBeDefined();
      expect(slice.sliceId).toBe(sliceDef.id);
      expect(slice.rolloutsEntered).toBe(8);

      // 1. Monsters breakdown
      expect(Array.isArray(slice.monsters)).toBe(true);
      expect(slice.monsters.length).toBeGreaterThan(0);
      for (const m of slice.monsters) {
        expect(typeof m.id).toBe('string');
        expect(typeof m.name).toBe('string');
        expect(typeof m.meanHpLoss).toBe('number');
        expect(m.encounters).toBeGreaterThanOrEqual(0);
        expect(m.winRate).toBeGreaterThanOrEqual(0);
        expect(m.winRate).toBeLessThanOrEqual(1);
        expect(m.lethality).toBeGreaterThanOrEqual(0);
        expect(m.lethality).toBeLessThanOrEqual(1);
      }

      // 2. Exact deck size breakdown (8~25+)
      expect(Array.isArray(slice.deckSizes)).toBe(true);
      expect(slice.deckSizes.length).toBeGreaterThanOrEqual(5);
      for (const ds of slice.deckSizes) {
        expect(ds.deckSize).toBeGreaterThanOrEqual(8);
        expect(typeof ds.pathShare).toBe('number');
        expect(typeof ds.meanHpLoss).toBe('number');
        expect(typeof ds.mortality).toBe('number');
        expect(typeof ds.madnessRate).toBe('number');
      }

      // 3. All cards breakdown
      expect(Array.isArray(slice.cards)).toBe(true);
      expect(slice.cards.length).toBeGreaterThan(10);
      for (const card of slice.cards) {
        expect(typeof card.id).toBe('string');
        expect(typeof card.name).toBe('string');
        expect(typeof card.offeredN).toBe('number');
        expect(typeof card.draftedN).toBe('number');
        expect(typeof card.draftedRate).toBe('number');
        expect(typeof card.deltaHp).toBe('number');
        expect(typeof card.deltaMortality).toBe('number');
        expect(typeof card.survOwnRate).toBe('number');
        expect(typeof card.fallOwnRate).toBe('number');
      }

      // 4. DAG path choices & node interaction choices
      expect(Array.isArray(slice.pathChoices)).toBe(true);
      expect(Array.isArray(slice.intraNodeChoices)).toBe(true);

      // 5. Surviving vs Fallen Group comparison
      expect(Array.isArray(slice.groupComparison)).toBe(true);
      expect(slice.groupComparison.length).toBeGreaterThanOrEqual(4);
      for (const comp of slice.groupComparison) {
        expect(typeof comp.dimension).toBe('string');
        expect(typeof comp.survivingValue).toBe('string');
        expect(typeof comp.fallenValue).toBe('string');
        expect(typeof comp.delta).toBe('string');
      }

      // 6. Persona breakdown snapshot
      expect(slice.personas.balanced).toBeDefined();
      expect(slice.personas.cautious).toBeDefined();
      expect(slice.personas.greedy).toBeDefined();
      expect(slice.personas.pure_random).toBeDefined();
      expect(slice.personas.balanced.rolloutsEntered).toBe(2);
    }
  });

  it('correctly associates duplicated card copies (_copy_n) with canonical card metrics', () => {
    const result = runJourneySimulation({
      samplesPerSlice: 4,
      occupation: 'investigator',
      seedBase: 123,
    });

    const slice1 = result.slices[1];
    const starterCard = slice1.cards.find((c) => c.id === 'card_punch_1');
    expect(starterCard).toBeDefined();
    expect(starterCard!.survOwnRate).toBeGreaterThanOrEqual(0);
  });
});
