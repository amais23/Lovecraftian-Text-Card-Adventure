import { describe, it, expect } from 'vitest';
import { resolveRemainsEntry, resolveRemainsAction } from './handlers/remains';
import type { Card, FallenInvestigatorRecord, Investigator } from '../../types/game';

const MOCK_CARD: Card = {
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

const MOCK_INVESTIGATOR: Investigator = {
  name: '哈維·華特斯',
  occupation: '教授',
  occupationId: 'investigator',
  health: 20,
  maxHealth: 25,
  stamina: 3,
  maxStamina: 3,
  armor: 0,
  handCapacity: 2,
  relics: [],
  obols: 20,
};

describe('remains handler (pure engine)', () => {
  it('resolveRemainsEntry initializes node state updates and literary log', () => {
    const node = {
      id: 'node_remains_1',
      type: 'remains' as const,
      layer: 1,
      col: 0,
      label: '先驅殘骸',
      title: '前輩枯骨',
      description: '骸骨散落',
      nextNodes: [],
      status: 'current' as const,
    };

    const entryWithName = resolveRemainsEntry(node, '愛德華');
    expect(entryWithName.nodeStateUpdates.phase).toBe('remains');
    expect(entryWithName.nodeStateUpdates.remainsClaimed).toBe(false);
    expect(entryWithName.log).toContain('愛德華');

    const entryWithoutName = resolveRemainsEntry(node);
    expect(entryWithoutName.log).toContain('痕跡磨滅殆盡');
  });

  it('resolveRemainsAction inherits card deterministically without ambient Date.now()', () => {
    const fallen: FallenInvestigatorRecord = {
      name: '威廉',
      occupation: '私家偵探',
      deck: [MOCK_CARD],
      obols: 50,
      depth: 1,
      causeOfDeath: '戰死',
      timestamp: 9999,
    };

    const res = resolveRemainsAction(
      { type: 'card', cardId: MOCK_CARD.id },
      {
        investigator: MOCK_INVESTIGATOR,
        sanityDeck: [],
        fallenInvestigator: fallen,
        timestamp: 123456,
      }
    );

    expect(res.success).toBe(true);
    expect(res.sanityDeck).toHaveLength(1);
    expect(res.sanityDeck[0].id).toBe(`${MOCK_CARD.id}_inherited_123456`);
    expect(res.clearFallenRecord).toBe(true);
    expect(res.nodeStateUpdates.remainsClaimed).toBe(true);
    expect(res.logs[0]).toContain('撫摸著枯骨旁沾血的筆記');
  });

  it('resolveRemainsAction inherits obols accurately and marks clearFallenRecord', () => {
    const fallen: FallenInvestigatorRecord = {
      name: '威廉',
      occupation: '私家偵探',
      deck: [],
      obols: 60,
      depth: 1,
      causeOfDeath: '戰死',
      timestamp: 9999,
    };

    const res = resolveRemainsAction(
      { type: 'obols' },
      {
        investigator: MOCK_INVESTIGATOR,
        sanityDeck: [],
        fallenInvestigator: fallen,
      }
    );

    expect(res.success).toBe(true);
    expect(res.investigator.obols).toBe(20 + 30); // 20 + 50% of 60
    expect(res.clearFallenRecord).toBe(true);
    expect(res.logs[0]).toContain('30 枚殘存古金幣');
  });

  it('resolveRemainsAction rejects if remains are already claimed or fallen is missing', () => {
    const resClaimed = resolveRemainsAction(
      { type: 'obols' },
      {
        investigator: MOCK_INVESTIGATOR,
        sanityDeck: [],
        remainsClaimed: true,
      }
    );
    expect(resClaimed.success).toBe(false);

    const resNoFallen = resolveRemainsAction(
      { type: 'obols' },
      {
        investigator: MOCK_INVESTIGATOR,
        sanityDeck: [],
        fallenInvestigator: null,
      }
    );
    expect(resNoFallen.success).toBe(false);
  });
});
