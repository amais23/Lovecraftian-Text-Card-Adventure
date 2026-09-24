import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FALLEN_INVESTIGATOR_STORAGE_KEY,
  saveFallenInvestigator,
  saveFallenInvestigatorFromState,
  getFallenInvestigator,
  hasFallenInvestigatorRecord,
  clearFallenInvestigator,
} from './remainsStorage';
import type { Card, FallenInvestigatorRecord, GameState } from '../../types/game';

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

describe('remainsStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves and reads fallen investigator record via localStorage', () => {
    const record: FallenInvestigatorRecord = {
      name: '哈維·華特斯',
      occupation: '教授',
      occupationId: 'investigator',
      deck: [MOCK_CARD_1, MOCK_CARD_2],
      obols: 45,
      depth: 2,
      causeOfDeath: '心智崩潰發狂殞命',
      timestamp: 123456789,
    };

    saveFallenInvestigator(record);
    expect(hasFallenInvestigatorRecord()).toBe(true);

    const retrieved = getFallenInvestigator();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('哈維·華特斯');
    expect(retrieved?.obols).toBe(45);
    expect(retrieved?.depth).toBe(2);
    expect(retrieved?.causeOfDeath).toBe('心智崩潰發狂殞命');
    expect(retrieved?.deck).toHaveLength(2);
    expect(retrieved?.deck[0].id).toBe('card_gun_1');
  });

  it('filters out temporary cards and ensures only inheritable cards are stored', () => {
    const tempCard: Card = {
      id: 'card_temp_wound',
      name: '撕裂傷',
      category: 'madness',
      costType: 'stamina',
      costValue: 1,
      isTemporary: true,
      effects: [],
      description: '臨時傷口',
      flavorText: '劇烈刺痛',
    };

    const record: FallenInvestigatorRecord = {
      name: '殉職者',
      occupation: '退伍軍人',
      deck: [MOCK_CARD_1, tempCard],
      obols: 20,
      depth: 1,
      causeOfDeath: '戰死',
      timestamp: 1000,
    };

    saveFallenInvestigator(record);
    const retrieved = getFallenInvestigator();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.deck).toHaveLength(1);
    expect(retrieved?.deck[0].id).toBe('card_gun_1');
  });

  it('clears fallen investigator record from localStorage', () => {
    const record: FallenInvestigatorRecord = {
      name: '殉職者',
      occupation: '私家偵探',
      deck: [MOCK_CARD_1],
      obols: 10,
      depth: 1,
      causeOfDeath: '失血過多',
      timestamp: 2000,
    };

    saveFallenInvestigator(record);
    expect(hasFallenInvestigatorRecord()).toBe(true);

    clearFallenInvestigator();
    expect(hasFallenInvestigatorRecord()).toBe(false);
    expect(getFallenInvestigator()).toBeNull();
  });

  it('safely handles malformed localStorage data or quota errors', () => {
    localStorage.setItem(FALLEN_INVESTIGATOR_STORAGE_KEY, 'invalid json{]');
    expect(getFallenInvestigator()).toBeNull();

    localStorage.setItem(FALLEN_INVESTIGATOR_STORAGE_KEY, JSON.stringify({ invalid: 'schema' }));
    expect(getFallenInvestigator()).toBeNull();

    // Storage error during setItem
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

  it('filters out abyssal fragments and unplayable cards when saving from state', () => {
    const unplayableFragment: Card = {
      id: 'card_abyssal_fragment_1',
      name: '深淵封印殘片·其一',
      category: 'madness',
      costType: 'free',
      costValue: 0,
      isTemporary: false,
      isUnplayable: true,
      effects: [],
      description: '無法打出。',
      flavorText: '殘片',
    };

    const temporaryCard: Card = {
      id: 'temp_madness_card',
      name: '臨時瘋狂卡',
      category: 'madness',
      costType: 'free',
      costValue: 0,
      isTemporary: true,
      effects: [],
      description: '臨時卡',
      flavorText: '消散',
    };

    const mockState = {
      phase: 'gameover',
      currentDepth: 2,
      investigator: {
        name: '探險家',
        occupation: '私家偵探',
        obols: 20,
      },
      sanityDeck: [MOCK_CARD_1, unplayableFragment, temporaryCard],
      hand: [],
      discardPile: [],
    } as unknown as GameState;

    saveFallenInvestigatorFromState(mockState, '遭深淵吞噬');

    const loaded = getFallenInvestigator();
    expect(loaded).not.toBeNull();
    expect(loaded?.deck).toHaveLength(1);
    expect(loaded?.deck[0].id).toBe(MOCK_CARD_1.id);
  });
});
