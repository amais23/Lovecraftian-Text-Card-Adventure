import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FALLEN_INVESTIGATOR_STORAGE_KEY,
  saveFallenInvestigator,
  saveFallenInvestigatorFromState,
  getFallenInvestigator,
  hasFallenInvestigatorRecord,
  clearFallenInvestigator,
} from './remainsInheritance';
import type { Card, FallenInvestigatorRecord, GameState } from '../types/game';

const MOCK_CARD_1: Card = {
  id: 'card_gun_1',
  name: '.38 左輪手槍',
  category: 'combat',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  effects: [{ type: 'damage', value: 6 }],
  description: '造成 6 點傷害',
  flavorText: '防身配槍',
};

const MOCK_CARD_2: Card = {
  id: 'card_evasion_1',
  name: '機敏閃避',
  category: 'skill',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  effects: [{ type: 'armor', value: 4 }],
  description: '獲得 4 點護甲',
  flavorText: '側身翻滾',
};

describe('remainsInheritance', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('correctly saves, reads and clears a fallen investigator record', () => {
    expect(hasFallenInvestigatorRecord()).toBe(false);
    expect(getFallenInvestigator()).toBeNull();

    const record: FallenInvestigatorRecord = {
      name: '愛德華·皮斯利',
      occupation: '私家偵探',
      occupationId: 'investigator',
      deck: [MOCK_CARD_1, MOCK_CARD_2],
      obols: 45,
      depth: 2,
      causeOfDeath: '遭深潛者長老撕裂',
      timestamp: 1700000000000,
    };

    saveFallenInvestigator(record);
    expect(hasFallenInvestigatorRecord()).toBe(true);

    const loaded = getFallenInvestigator();
    expect(loaded).toEqual(record);

    clearFallenInvestigator();
    expect(hasFallenInvestigatorRecord()).toBe(false);
    expect(getFallenInvestigator()).toBeNull();
  });

  it('correctly extracts and saves record from GameState', () => {
    const mockState = {
      phase: 'gameover',
      currentDepth: 3,
      investigator: {
        name: '湯瑪斯·奧恩',
        occupation: '秘術學者',
        occupationId: 'occultist',
        health: 0,
        maxHealth: 25,
        stamina: 0,
        maxStamina: 3,
        armor: 0,
        obols: 80,
      },
      sanityDeck: [MOCK_CARD_1],
      hand: [MOCK_CARD_2],
      discardPile: [],
    } as unknown as GameState;

    saveFallenInvestigatorFromState(mockState, '遭修格斯黑泥吞噬');

    expect(hasFallenInvestigatorRecord()).toBe(true);
    const loaded = getFallenInvestigator();
    expect(loaded?.name).toBe('湯瑪斯·奧恩');
    expect(loaded?.occupation).toBe('秘術學者');
    expect(loaded?.occupationId).toBe('occultist');
    expect(loaded?.obols).toBe(80);
    expect(loaded?.depth).toBe(3);
    expect(loaded?.causeOfDeath).toBe('遭修格斯黑泥吞噬');
    expect(loaded?.deck).toHaveLength(2);
  });

  it('handles corrupted localStorage data safely without crashing', () => {
    localStorage.setItem(FALLEN_INVESTIGATOR_STORAGE_KEY, 'invalid_json_{{');
    expect(getFallenInvestigator()).toBeNull();
    expect(hasFallenInvestigatorRecord()).toBe(false);

    localStorage.setItem(FALLEN_INVESTIGATOR_STORAGE_KEY, JSON.stringify({ random: 'data' }));
    expect(getFallenInvestigator()).toBeNull();
  });

  it('handles storage exceptions gracefully when localStorage throws', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });

    const record: FallenInvestigatorRecord = {
      name: '測試者',
      occupation: '私家偵探',
      deck: [MOCK_CARD_1],
      obols: 10,
      depth: 1,
      causeOfDeath: '測試死因',
      timestamp: 12345,
    };

    expect(() => saveFallenInvestigator(record)).not.toThrow();
    setItemSpy.mockRestore();
  });
});
