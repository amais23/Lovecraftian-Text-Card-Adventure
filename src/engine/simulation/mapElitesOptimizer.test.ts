import { describe, it, expect } from 'vitest';
import {
  calculateDeckBehaviorDescriptors,
  runMapElitesOptimization,
  extractDistinctPeakArchetypes,
  type MapElitesCell,
} from './mapElitesOptimizer';
import { CardRegistry } from '../cards/registry';

describe('MAP-Elites Optimizer (ADR-0039)', () => {
  it('calculateDeckBehaviorDescriptors computes armorRatio and avgTier within valid bounds', () => {
    const starter = CardRegistry.getStarterDeck('investigator');
    const desc = calculateDeckBehaviorDescriptors(starter);

    expect(desc.armorRatio).toBeGreaterThanOrEqual(0);
    expect(desc.armorRatio).toBeLessThanOrEqual(1.0);
    expect(desc.avgTier).toBeGreaterThanOrEqual(1.0);
    expect(desc.avgTier).toBeLessThanOrEqual(3.5);
  });

  it('extractDistinctPeakArchetypes preserves diversity and deduplicates close decks', () => {
    const starterA = CardRegistry.getStarterDeck('investigator');
    const starterB = CardRegistry.getStarterDeck('occultist');

    const archive = new Map<string, MapElitesCell>();
    archive.set('0_0', {
      xBin: 0,
      yBin: 0,
      armorRatio: 0.1,
      avgTier: 1.0,
      deck: starterA,
      handRetention: 3,
      fitness: 90,
      baselineWin: true,
      stretchWin: true,
      baselineHpLost: 5,
      stretchHpLost: 8,
      iterationsFound: 10,
    });

    archive.set('0_1', {
      xBin: 0,
      yBin: 1,
      armorRatio: 0.12,
      avgTier: 1.1,
      deck: [...starterA], // 幾乎相同的牌庫
      handRetention: 3,
      fitness: 89,
      baselineWin: true,
      stretchWin: true,
      baselineHpLost: 6,
      stretchHpLost: 9,
      iterationsFound: 20,
    });

    archive.set('7_7', {
      xBin: 7,
      yBin: 7,
      armorRatio: 0.9,
      avgTier: 3.2,
      deck: starterB,
      handRetention: 4,
      fitness: 85,
      baselineWin: true,
      stretchWin: true,
      baselineHpLost: 2,
      stretchHpLost: 5,
      iterationsFound: 30,
    });

    const peaks = extractDistinctPeakArchetypes(archive, 4, 0.2);
    // starterA 和 複製的 starterA 應該被去重，只選出較高分的那套與 starterB
    expect(peaks.length).toBe(2);
    expect(peaks[0].cellKey).toBe('0_0');
    expect(peaks[1].cellKey).toBe('7_7');
  });

  it('runs MAP-Elites optimization for a small budget and populates elite cells', () => {
    // 執行 60 代小預算煙霧測試驗證演算法迴圈完整性
    const result = runMapElitesOptimization({
      iterations: 60,
      xBins: 4,
      yBins: 4,
      randomFn: () => 0.42, // 確定性隨機種子
    });

    expect(result.totalIterations).toBe(60);
    expect(result.filledCellsCount).toBeGreaterThan(0);
    expect(result.peakArchetypes.length).toBeGreaterThan(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
