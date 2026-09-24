import { describe, it, expect } from 'vitest';
import { resolveNodeEntry, resolveNodeInteraction } from './index';
import type { Card, FallenInvestigatorRecord, Investigator, MapNode } from '../../types/game';

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

describe('remains handler via public engine seam', () => {
  it('resolveNodeEntry for remains initializes node state updates and literary log', () => {
    const node: MapNode = {
      id: 'node_remains_1',
      type: 'remains',
      layer: 1,
      col: 0,
      label: '先驅殘骸',
      title: '前輩枯骨',
      description: '骸骨散落',
      nextNodes: [],
      status: 'current',
    };

    const entryWithName = resolveNodeEntry(node, {
      depth: 1,
      fallenInvestigator: {
        name: '愛德華',
        occupation: '探險家',
        deck: [],
        obols: 0,
        depth: 1,
        causeOfDeath: '戰死',
        timestamp: 1,
      },
    });
    expect(entryWithName.nodeStateUpdates.phase).toBe('remains');
    expect(entryWithName.nodeStateUpdates.remainsClaimed).toBe(false);
    expect(entryWithName.log).toContain('愛德華');

    const entryWithoutName = resolveNodeEntry(node, { depth: 1 });
    expect(entryWithoutName.log).toContain('痕跡磨滅殆盡');
  });

  it('resolveNodeInteraction for remains inherits card deterministically without ambient Date.now()', () => {
    const fallen: FallenInvestigatorRecord = {
      name: '威廉',
      occupation: '私家偵探',
      deck: [MOCK_CARD],
      obols: 50,
      depth: 1,
      causeOfDeath: '戰死',
      timestamp: 9999,
    };

    const res = resolveNodeInteraction(
      { type: 'INHERIT_REMAINS', payload: { type: 'card', cardId: MOCK_CARD.id } },
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

  it('resolveNodeInteraction for remains inherits obols accurately and marks clearFallenRecord', () => {
    const fallen: FallenInvestigatorRecord = {
      name: '威廉',
      occupation: '私家偵探',
      deck: [],
      obols: 60,
      depth: 1,
      causeOfDeath: '戰死',
      timestamp: 9999,
    };

    const res = resolveNodeInteraction(
      { type: 'INHERIT_REMAINS', payload: { type: 'obols' } },
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

  it('resolveNodeInteraction for remains rejects if remains are already claimed or fallen is missing', () => {
    const resClaimed = resolveNodeInteraction(
      { type: 'INHERIT_REMAINS', payload: { type: 'obols' } },
      {
        investigator: MOCK_INVESTIGATOR,
        sanityDeck: [],
        remainsClaimed: true,
      }
    );
    expect(resClaimed.success).toBe(false);

    const resNoFallen = resolveNodeInteraction(
      { type: 'INHERIT_REMAINS', payload: { type: 'obols' } },
      {
        investigator: MOCK_INVESTIGATOR,
        sanityDeck: [],
        fallenInvestigator: null,
      }
    );
    expect(resNoFallen.success).toBe(false);
  });
});
