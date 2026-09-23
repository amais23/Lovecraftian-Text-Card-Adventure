import { describe, it, expect } from 'vitest';
import {
  ALTAR_RITUAL_POOL,
  ALTAR_RITUALS_BY_ID,
  generateAltarRituals,
  getDefaultAltarRituals,
} from './altarService';

describe('altarService', () => {
  it('defines 5 unique rituals in the pool', () => {
    expect(ALTAR_RITUAL_POOL).toHaveLength(5);
    const ids = ALTAR_RITUAL_POOL.map((r) => r.id);
    expect(new Set(ids).size).toBe(5);
    expect(ids).toContain('flesh');
    expect(ids).toContain('time_space');
    expect(ids).toContain('void');
    expect(ids).toContain('chaos');
    expect(ids).toContain('blood_pact');
  });

  it('generateAltarRituals samples exactly 3 distinct rituals', () => {
    const sampled = generateAltarRituals();
    expect(sampled).toHaveLength(3);
    const idSet = new Set(sampled.map((r) => r.id));
    expect(idSet.size).toBe(3);
    sampled.forEach((ritual) => {
      expect(ALTAR_RITUAL_POOL.some((p) => p.id === ritual.id)).toBe(true);
    });
  });

  it('generateAltarRituals produces deterministic results when given a deterministic random generator', () => {
    // Sequence that returns predictable indices
    let callCount = 0;
    const mockRandom = () => {
      callCount++;
      return 0; // Will always swap with index 0
    };
    const sampled = generateAltarRituals(mockRandom);
    expect(sampled).toHaveLength(3);
    expect(callCount).toBeGreaterThan(0);
  });

  it('getDefaultAltarRituals returns fallback default 3 rituals', () => {
    const defaults = getDefaultAltarRituals();
    expect(defaults).toHaveLength(3);
    expect(defaults.map((r) => r.id)).toEqual(['flesh', 'time_space', 'void']);
  });

  it('ALTAR_RITUALS_BY_ID supports backward-compatible aliases mind and boon', () => {
    expect(ALTAR_RITUALS_BY_ID.mind).toBe(ALTAR_RITUALS_BY_ID.time_space);
    expect(ALTAR_RITUALS_BY_ID.boon).toBe(ALTAR_RITUALS_BY_ID.void);
  });

  it('all rituals have valid narrative descriptions meeting de-technologization rules', () => {
    for (const ritual of ALTAR_RITUAL_POOL) {
      expect(ritual.name).toBeTruthy();
      expect(ritual.subtitle).toBeTruthy();
      expect(ritual.description).toBeTruthy();
      expect(ritual.costDescription).toBeTruthy();
      expect(ritual.rewardDescription).toBeTruthy();
      expect(['heart', 'book', 'sparkles', 'flame', 'coins']).toContain(ritual.iconName);

      // Verify no raw programming operators in user text
      expect(ritual.name).not.toMatch(/<=|>=|==|null|undefined/);
      expect(ritual.description).not.toMatch(/<=|>=|==|null|undefined/);
    }
  });
});
