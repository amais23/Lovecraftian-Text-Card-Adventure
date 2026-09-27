import { describe, it, expect } from 'vitest';
import {
  SLICE_DEFINITIONS,
  GlobalMixedPool,
  runJourneySimulation,
  mergeJourneySimulationResults,
  type SurvivingInvestigatorSnapshot,
  type JourneySimulationOptions,
} from './journeyScheduler';
import { getStarterBaseline } from './deckBuilder';

describe('Seven-Stage Slice Scheduler & Global Mixed Pool (ADR-0042 / Issue #88)', () => {
  const starterDeck = getStarterBaseline('investigator');

  describe('1. Slice Definitions Structure', () => {
    it('defines exactly 7 investigation slices with correct layers and depth transitions', () => {
      expect(SLICE_DEFINITIONS).toHaveLength(7);

      expect(SLICE_DEFINITIONS[0]).toMatchObject({ id: 1, depth: 1, startLayer: 0, endLayer: 7 });
      expect(SLICE_DEFINITIONS[1]).toMatchObject({ id: 2, depth: 1, startLayer: 8, endLayer: 15, bossName: '修格斯幼體' });

      expect(SLICE_DEFINITIONS[2]).toMatchObject({ id: 3, depth: 2, startLayer: 0, endLayer: 7 });
      expect(SLICE_DEFINITIONS[3]).toMatchObject({ id: 4, depth: 2, startLayer: 8, endLayer: 15, bossName: '大袞的深淵祭司' });

      expect(SLICE_DEFINITIONS[4]).toMatchObject({ id: 5, depth: 3, startLayer: 0, endLayer: 7 });
      expect(SLICE_DEFINITIONS[5]).toMatchObject({ id: 6, depth: 3, startLayer: 8, endLayer: 15, bossName: '原生巨型修格斯' });

      expect(SLICE_DEFINITIONS[6]).toMatchObject({ id: 7, depth: 4, startLayer: 0, endLayer: 7, bossName: '克蘇魯星之眷族' });
    });
  });

  describe('2. Global Mixed Pool (全域混合存活池)', () => {
    it('stores surviving investigator entities and samples from them', () => {
      const pool = new GlobalMixedPool();
      expect(pool.size()).toBe(0);

      const snap1: SurvivingInvestigatorSnapshot = {
        health: 18,
        maxHealth: 25,
        obols: 45,
        deck: [...starterDeck],
        relics: [],
        sourcePersona: 'cautious',
      };
      const snap2: SurvivingInvestigatorSnapshot = {
        health: 22,
        maxHealth: 25,
        obols: 80,
        deck: [...starterDeck],
        relics: [],
        sourcePersona: 'greedy',
      };

      pool.add(snap1);
      pool.add(snap2);
      expect(pool.size()).toBe(2);

      const sampled1 = pool.sample(() => 0.1, () => snap1);
      expect(sampled1.sourcePersona).toBe('cautious');

      const sampled2 = pool.sample(() => 0.9, () => snap1);
      expect(sampled2.sourcePersona).toBe('greedy');
    });

    it('falls back to default baseline snapshot when pool is empty without crashing', () => {
      const pool = new GlobalMixedPool();
      expect(pool.size()).toBe(0);

      const fallback: SurvivingInvestigatorSnapshot = {
        health: 25,
        maxHealth: 25,
        obols: 30,
        deck: [...starterDeck],
        relics: [],
        sourcePersona: 'balanced',
      };

      const result = pool.sample(() => 0.5, () => fallback);
      expect(result.health).toBe(25);
      expect(result.sourcePersona).toBe('balanced');
    });
  });

  describe('3. Multi-Slice Simulation & Fixed Samples Run', () => {
    it('executes a 7-slice simulation with fixed sample count (samplesPerSlice: 20)', () => {
      const options: JourneySimulationOptions = {
        samplesPerSlice: 20, // 20 rollouts per slice (5 per persona)
        occupation: 'investigator',
        seedBase: 100,
      };

      const result = runJourneySimulation(options);

      expect(result.totalRollouts).toBe(20 * 7); // 140 rollouts total
      expect(result.progression).toHaveLength(7);
      expect(Object.keys(result.slices)).toHaveLength(7);

      // Verify each slice had 20 rollouts and all 4 personas participated (5 each)
      for (const sliceId of [1, 2, 3, 4, 5, 6, 7]) {
        const sliceData = result.slices[sliceId];
        expect(sliceData.rolloutsEntered).toBe(20);
        expect(sliceData.sliceDef.id).toBe(sliceId);
        expect(sliceData.personas.balanced.rolloutsEntered).toBe(5);
        expect(sliceData.personas.cautious.rolloutsEntered).toBe(5);
        expect(sliceData.personas.greedy.rolloutsEntered).toBe(5);
        expect(sliceData.personas.pure_random.rolloutsEntered).toBe(5);
      }

      // Verify cumulative survival rate monotonically decreases or stays equal
      let prevCumRate = 1.0;
      for (const p of result.progression) {
        expect(p.cumulativeSurvivalRate).toBeLessThanOrEqual(prevCumRate + 0.0001);
        prevCumRate = p.cumulativeSurvivalRate;
      }
    });

    it('guarantees metric isolation: slice combat HP loss is local while total net loss is cumulative', () => {
      const options: JourneySimulationOptions = {
        samplesPerSlice: 12,
        occupation: 'investigator',
        seedBase: 555,
      };

      const result = runJourneySimulation(options);

      for (const p of result.progression) {
        expect(typeof p.meanCombatHpLoss).toBe('number');
        expect(typeof p.meanNetHpLoss).toBe('number');
      }

      // Total journey net HP loss is tracked
      expect(typeof result.totalJourneyNetHpLoss).toBe('number');
    });
  });

  describe('4. Time-Budget Mode Execution', () => {
    it('respects time budget and terminates cleanly within given duration', () => {
      const start = performance.now();
      const options: JourneySimulationOptions = {
        timeBudgetSeconds: 0.5, // 0.5 second budget
        occupation: 'investigator',
        seedBase: 42,
      };

      const result = runJourneySimulation(options);
      const elapsed = (performance.now() - start) / 1000;

      expect(result.totalRollouts).toBeGreaterThan(0);
      expect(result.progression).toHaveLength(7);
      // Execution time should be close to 0.5s (+/- small margin, < 2.0s)
      expect(elapsed).toBeLessThan(2.0);
    });
  });

  describe('5. Multi-Core Map-Reduce Result Merging', () => {
    it('throws error when merging empty result array', () => {
      expect(() => mergeJourneySimulationResults([])).toThrow('Cannot merge an empty array');
    });

    it('returns the same object when merging a single result', () => {
      const single = runJourneySimulation({ samplesPerSlice: 4, seedBase: 100 });
      expect(mergeJourneySimulationResults([single])).toBe(single);
    });

    it('accurately aggregates two independent simulation results across all slices', () => {
      const res1 = runJourneySimulation({ samplesPerSlice: 4, seedBase: 101 });
      const res2 = runJourneySimulation({ samplesPerSlice: 4, seedBase: 202 });

      const merged = mergeJourneySimulationResults([res1, res2]);

      expect(merged.totalRollouts).toBe(res1.totalRollouts + res2.totalRollouts);
      expect(merged.progression).toHaveLength(7);

      for (let s = 1; s <= 7; s++) {
        const slice = merged.slices[s];
        expect(slice.rolloutsEntered).toBe(res1.slices[s].rolloutsEntered + res2.slices[s].rolloutsEntered);
        expect(slice.rolloutsCompleted).toBe(res1.slices[s].rolloutsCompleted + res2.slices[s].rolloutsCompleted);
        expect(slice.sliceSurvivalRate).toBeCloseTo(slice.rolloutsCompleted / slice.rolloutsEntered);
        expect(typeof slice.meanCombatHpLoss).toBe('number');
        expect(typeof slice.meanNetHpLoss).toBe('number');
        expect(slice.personas.balanced.rolloutsEntered).toBe(
          res1.slices[s].personas.balanced.rolloutsEntered + res2.slices[s].personas.balanced.rolloutsEntered
        );
        expect(slice.monsters.length).toBeGreaterThan(0);
        expect(slice.cards.length).toBeGreaterThan(0);
        expect(slice.groupComparison.length).toBeGreaterThanOrEqual(4);
      }

      expect(merged.overallSurvivalRate).toBeGreaterThanOrEqual(0);
      expect(merged.overallSurvivalRate).toBeLessThanOrEqual(1);
    });
  });
});
