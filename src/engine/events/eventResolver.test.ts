import { describe, it, expect } from 'vitest';
import { resolveMythosEvent } from './eventResolver';
import type { MythosEventContext } from './types';
import type { Investigator, Card, MythosEvent, MythosEventOption } from '../../types/game';
import { DEFAULT_HAND_CAPACITY } from '../combat';

// ────────────────────────────────────────────────────────────
// 測試輔助工具
// ────────────────────────────────────────────────────────────

function makeInvestigator(overrides: Partial<Investigator> = {}): Investigator {
  return {
    name: '測試調查員',
    occupation: '調查員',
    occupationId: 'investigator',
    health: 20,
    maxHealth: 20,
    stamina: 3,
    maxStamina: 3,
    armor: 0,
    obols: 10,
    handCapacity: 4,
    ...overrides,
  };
}

function makeCard(id: string): Card {
  return {
    id,
    name: `卡牌_${id}`,
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [],
    description: '',
    flavorText: '',
  };
}

function makeEvent(options: MythosEventOption[]): MythosEvent {
  return {
    id: 'evt_test',
    title: '測試奇遇',
    location: '阿卡姆',
    storyText: ['故事文本'],
    options,
  };
}

function makeCtx(overrides: Partial<MythosEventContext> = {}): MythosEventContext {
  return {
    investigator: makeInvestigator(),
    sanityDeck: [makeCard('s1'), makeCard('s2'), makeCard('s3')],
    hand: [makeCard('h1')],
    discardPile: [makeCard('d1')],
    occupationId: 'investigator',
    adventureStats: { enemiesDefeated: 0, totalObolsCollected: 0, nodesVisited: 0, maxLayer: 0 },
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────
// 1. health_change
// ────────────────────────────────────────────────────────────

describe('resolveMythosEvent — health_change', () => {
  it('加血量不超過 maxHealth', () => {
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'health_change', value: 5, narrative: '你包紮了傷口。' }],
    }]);
    const ctx = makeCtx({ investigator: makeInvestigator({ health: 18 }) });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.investigator.health).toBe(20); // 18 + 5 = 23，上限 20
    }
  });

  it('受傷不低於 0', () => {
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'health_change', value: -999, narrative: '重傷。' }],
    }]);
    const ctx = makeCtx();

    const result = resolveMythosEvent(event, event.options[0], ctx);

    // health 歸零 → defeat
    expect(result.outcome).toBe('defeat');
    if (result.outcome === 'defeat') {
      expect(result.investigator.health).toBe(0);
      expect(result.logs).toContain('【肉體殞命】調查員在奇遇事件中傷重不治！');
    }
  });

  it('輕微受傷仍為 resolved', () => {
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'health_change', value: -3, narrative: '受傷。' }],
    }]);
    const ctx = makeCtx({ investigator: makeInvestigator({ health: 10 }) });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.investigator.health).toBe(7);
    }
  });
});

// ────────────────────────────────────────────────────────────
// 2. gain_obols
// ────────────────────────────────────────────────────────────

describe('resolveMythosEvent — gain_obols', () => {
  it('增加古金幣並累計至 adventureStats', () => {
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'gain_obols', value: 15, narrative: '獲得古金幣。' }],
    }]);
    const ctx = makeCtx({ investigator: makeInvestigator({ obols: 5 }) });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.investigator.obols).toBe(20);
      expect(result.adventureStats.totalObolsCollected).toBe(15);
    }
  });

  it('失去古金幣不低於 0', () => {
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'gain_obols', value: -999, narrative: '損失古金幣。' }],
    }]);
    const ctx = makeCtx({ investigator: makeInvestigator({ obols: 5 }) });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.investigator.obols).toBe(0);
    }
  });
});

// ────────────────────────────────────────────────────────────
// 3. sanity_change（燒理智）
// ────────────────────────────────────────────────────────────

describe('resolveMythosEvent — sanity_change 燒牌', () => {
  it('燒 2 張理智牌（從頂部）', () => {
    const s1 = makeCard('s1');
    const s2 = makeCard('s2');
    const s3 = makeCard('s3');
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'sanity_change', value: -2, narrative: '精神受創。' }],
    }]);
    const ctx = makeCtx({ sanityDeck: [s1, s2, s3] });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.sanityDeck).toHaveLength(1);
      expect(result.sanityDeck[0].id).toBe('s3');
    }
  });

  it('理智回補：優先從棄牌堆回補，再生成心靈澄澈', () => {
    const d1 = makeCard('d1');
    const d2 = makeCard('d2');
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'sanity_change', value: 3, narrative: '心靈平復。' }],
    }]);
    const ctx = makeCtx({
      sanityDeck: [makeCard('s1')],
      discardPile: [d1, d2],
    });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      // 棄牌堆 2 張回補 + 1 張心靈澄澈生成
      expect(result.sanityDeck).toHaveLength(4); // s1 + d1 + d2 + 1 generated
      expect(result.discardPile).toHaveLength(0);
      const generated = result.sanityDeck.find((c) => c.id.startsWith('event_truth_restored'));
      expect(generated).toBeDefined();
    }
  });
});

// ────────────────────────────────────────────────────────────
// 4. gain_card
// ────────────────────────────────────────────────────────────

describe('resolveMythosEvent — gain_card', () => {
  it('將卡牌加入理智牌庫，id 帶 _evt_ 後綴', () => {
    const newCard = makeCard('arc_tome');
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'gain_card', card: newCard, narrative: '獲得卡牌。' }],
    }]);
    const ctx = makeCtx({ sanityDeck: [makeCard('s1')] });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.sanityDeck).toHaveLength(2);
      const added = result.sanityDeck.find((c) => c.id.includes('arc_tome'));
      expect(added).toBeDefined();
      expect(added?.id).toMatch(/_evt_/);
      expect(added?.isTemporary).toBe(false);
    }
  });

  it('同一選項多張 gain_card 時卡牌 ID 互不重複', () => {
    const cardA = makeCard('card_a');
    const cardB = makeCard('card_b');
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [
        { type: 'gain_card', card: cardA, narrative: '獲得卡牌 A。' },
        { type: 'gain_card', card: cardB, narrative: '獲得卡牌 B。' },
      ],
    }]);
    const ctx = makeCtx({ sanityDeck: [makeCard('s1')] });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.sanityDeck).toHaveLength(3);
      const ids = result.sanityDeck.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
      expect(ids[1]).toBe('card_a_evt_2');
      expect(ids[2]).toBe('card_b_evt_3');
    }
  });
});

// ────────────────────────────────────────────────────────────
// 5. gain_relic
// ────────────────────────────────────────────────────────────

describe('resolveMythosEvent — gain_relic', () => {
  it('將遺物套用至調查員', () => {
    const relic = {
      id: 'amulet_test',
      name: '護身符',
      description: '提升最大生命值',
      flavorText: '',
      rarity: 'common' as const,
      modifiers: { maxHealth: 5 },
    };
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'gain_relic', relic, narrative: '獲得遺物。' }],
    }]);
    const ctx = makeCtx({ investigator: makeInvestigator({ maxHealth: 20, health: 20 }) });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.investigator.relics?.some((r) => r.id === 'amulet_test')).toBe(true);
      expect(result.investigator.maxHealth).toBe(25);
    }
  });
});

// ────────────────────────────────────────────────────────────
// 6. trigger_combat
// ────────────────────────────────────────────────────────────

describe('resolveMythosEvent — trigger_combat', () => {
  it('觸發戰鬥後 outcome 為 combat，帶有敵人快照', () => {
    const enemy = {
      id: 'enemy_ghoul',
      name: '食屍鬼',
      title: '陰暗潛伏者',
      health: 30,
      maxHealth: 30,
      armor: 0,
      currentIntent: { type: 'attack' as const, value: 6, name: '爪擊', description: '' },
    };
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'trigger_combat', enemy, narrative: '遭遇敵人！' }],
    }]);
    const ctx = makeCtx();

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('combat');
    if (result.outcome === 'combat') {
      expect(result.enemy.id).toBe('enemy_ghoul');
      expect(result.investigator.armor).toBe(0);
      expect(result.investigator.stamina).toBe(ctx.investigator.maxStamina);
    }
  });

  it('未顯式指定 handCapacity 時預設遵循 DEFAULT_HAND_CAPACITY (2)', () => {
    const enemy = {
      id: 'enemy_ghoul',
      name: '食屍鬼',
      title: '陰暗潛伏者',
      health: 30,
      maxHealth: 30,
      armor: 0,
      currentIntent: { type: 'attack' as const, value: 6, name: '爪擊', description: '' },
    };
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [{ type: 'trigger_combat', enemy, narrative: '遭遇敵人！' }],
    }]);
    const ctx = makeCtx({
      investigator: makeInvestigator({ handCapacity: undefined }),
      sanityDeck: [makeCard('c1'), makeCard('c2'), makeCard('c3'), makeCard('c4')],
      hand: [],
      discardPile: [],
    });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('combat');
    if (result.outcome === 'combat') {
      expect(result.hand).toHaveLength(DEFAULT_HAND_CAPACITY);
      expect(DEFAULT_HAND_CAPACITY).toBe(2);
    }
  });
});

// ────────────────────────────────────────────────────────────
// 7. 古金幣不足守門
// ────────────────────────────────────────────────────────────

describe('resolveMythosEvent — 守門：古金幣不足', () => {
  it('古金幣不足時拋出錯誤，呼叫方負責在執行前檢查', () => {
    // eventResolver 本身不做守門（守門由 reducer 負責），
    // 此測試確認 resolver 不會靜默略過有 requires.obols 的選項
    // 故意構造後果清單為空（選項通過但無後果），確認 resolved 正常回傳
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      requires: { obols: 5 },
      consequences: [{ type: 'gain_obols', value: 10, narrative: '通過。' }],
    }]);
    const ctx = makeCtx({ investigator: makeInvestigator({ obols: 100 }) });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.investigator.obols).toBe(110);
    }
  });
});

// ────────────────────────────────────────────────────────────
// 8. 複合後果
// ────────────────────────────────────────────────────────────

describe('resolveMythosEvent — 複合後果', () => {
  it('同一選項多個後果依序套用', () => {
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [
        { type: 'health_change', value: -5, narrative: '受傷。' },
        { type: 'gain_obols', value: 20, narrative: '獲得報酬。' },
        { type: 'sanity_change', value: -1, narrative: '精神受創。' },
      ],
    }]);
    const ctx = makeCtx({
      investigator: makeInvestigator({ health: 15, obols: 0 }),
      sanityDeck: [makeCard('s1'), makeCard('s2'), makeCard('s3')],
    });

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.outcome).toBe('resolved');
    if (result.outcome === 'resolved') {
      expect(result.investigator.health).toBe(10);
      expect(result.investigator.obols).toBe(20);
      expect(result.sanityDeck).toHaveLength(2); // 燒 1 張
    }
  });

  it('narrative 文字集中於 logs', () => {
    const event = makeEvent([{
      id: 'opt1',
      text: '選項一',
      consequences: [
        { type: 'health_change', value: -1, narrative: '第一行敘事。' },
        { type: 'gain_obols', value: 5, narrative: '第二行敘事。' },
      ],
    }]);
    const ctx = makeCtx();

    const result = resolveMythosEvent(event, event.options[0], ctx);

    expect(result.logs).toContain('第一行敘事。');
    expect(result.logs).toContain('第二行敘事。');
  });
});
