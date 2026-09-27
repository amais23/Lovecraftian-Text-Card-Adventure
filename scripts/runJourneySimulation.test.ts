import { describe, it, expect } from 'vitest';
import { parseJourneyCliArgs } from './runJourneySimulation';
import { runJourneySimulation, type JourneySummaryJson } from '../src/engine/simulation/journeyScheduler';

describe('Production Journey CLI & Summary Generator (ADR-0042 / Issue #89)', () => {
  it('parses default CLI arguments correctly', () => {
    const opts = parseJourneyCliArgs([]);
    expect(opts.targetSlice).toBe(1);
    expect(opts.showAllMonsters).toBe(false);
    expect(opts.showAllCards).toBe(false);
    expect(opts.timeBudgetSeconds).toBe(15);
    expect(opts.samplesPerSlice).toBeUndefined();
    expect(opts.occupation).toBe('investigator');
    expect(opts.outputPath).toContain('journey_summary.json');
    expect(opts.noSave).toBe(false);
  });

  it('parses custom CLI arguments correctly', () => {
    const args = [
      '--slice', '4',
      '--all-monsters',
      '--all-cards',
      '--time', '30',
      '--samples', '500',
      '--occupation', 'occultist',
      '--output', 'custom_journey.json',
      '--no-save',
    ];
    const opts = parseJourneyCliArgs(args);
    expect(opts.targetSlice).toBe(4);
    expect(opts.showAllMonsters).toBe(true);
    expect(opts.showAllCards).toBe(true);
    expect(opts.timeBudgetSeconds).toBe(30);
    expect(opts.samplesPerSlice).toBe(500);
    expect(opts.occupation).toBe('occultist');
    expect(opts.outputPath).toBe('custom_journey.json');
    expect(opts.noSave).toBe(true);
  });

  it('clamps slice argument between 1 and 7', () => {
    expect(parseJourneyCliArgs(['--slice', '0']).targetSlice).toBe(1);
    expect(parseJourneyCliArgs(['--slice', '9']).targetSlice).toBe(7);
  });

  it('automatically sets default outputPath to journey_summary_occultist.json for occultist', () => {
    const opts = parseJourneyCliArgs(['--occupation', 'occultist']);
    expect(opts.occupation).toBe('occultist');
    expect(opts.outputPath).toContain('journey_summary_occultist.json');
  });

  it('generates schema-compliant JSON summary structure', () => {
    const result = runJourneySimulation({
      samplesPerSlice: 4,
      seedBase: 1234,
      occupation: 'investigator',
    });

    const summaryJson: JourneySummaryJson = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      totalRollouts: result.totalRollouts,
      elapsedMilliseconds: result.elapsedMilliseconds,
      overallSurvivalRate: result.overallSurvivalRate,
      totalJourneyNetHpLoss: result.totalJourneyNetHpLoss,
      progression: result.progression,
      slices: result.slices,
    };

    expect(summaryJson.version).toBe('1.0.0');
    expect(summaryJson.progression).toHaveLength(7);
    expect(summaryJson.totalRollouts).toBe(28);

    for (let id = 1; id <= 7; id++) {
      const slice = summaryJson.slices[id];
      expect(slice).toBeDefined();
      expect(slice.monsters.length).toBeGreaterThan(0);
      expect(slice.deckSizes.length).toBeGreaterThan(0);
      expect(slice.cards.length).toBeGreaterThan(0);
      expect(slice.pathChoices).toBeDefined();
      expect(slice.groupComparison.length).toBeGreaterThan(0);
    }
  });
});
