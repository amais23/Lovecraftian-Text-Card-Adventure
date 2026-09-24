import { describe, it, expect, beforeEach } from 'vitest';
import type { Card, FallenInvestigatorRecord, Investigator, MapNode, MarketItem } from '../../types/game';
import {
  resolveNodeEntry,
  resolveNodeInteraction,
  resolveNodeLeave,
  saveFallenInvestigator,
  getFallenInvestigator,
  clearFallenInvestigator,
  FALLEN_INVESTIGATOR_STORAGE_KEY,
} from './index';
import { PRESET_RELICS } from '../relics';
import { TRUTH_CARD_BREAKWATER } from '../eventData';

describe('NodeResolver Pure Engine (ADR-0034)', () => {
  let mockInvestigator: Investigator;
  let mockDeck: Card[];

  beforeEach(() => {
    mockInvestigator = {
      id: 'inv_1',
      name: '愛德華·皮爾斯',
      occupation: '私家偵探',
      occupationId: 'investigator',
      health: 20,
      maxHealth: 25,
      stamina: 3,
      maxStamina: 3,
      armor: 0,
      obols: 50,
      relics: [],
      handCapacity: 2,
    };

    mockDeck = [
      { id: 'c1', name: '左輪射擊', category: 'combat', costType: 'stamina', costValue: 1, effects: [], description: '1' },
      { id: 'c2', name: '掩體射擊', category: 'skill', costType: 'stamina', costValue: 1, effects: [], description: '2' },
      { id: 'c3', name: '重拳壓制', category: 'combat', costType: 'stamina', costValue: 1, effects: [], description: '3' },
      { id: 'c4', name: '戰術閃避', category: 'skill', costType: 'stamina', costValue: 1, effects: [], description: '4' },
    ];

    clearFallenInvestigator();
  });

  /* =========================================================
     1. Node Entry Tests
     ========================================================= */
  describe('resolveNodeEntry', () => {
    it('initializes sanctuary entry state and narrative log', () => {
      const node: MapNode = {
        id: 'node_1',
        type: 'sanctuary',
        layer: 3,
        col: 1,
        label: '安全避難所',
        title: '守墓人小屋',
        description: '壁爐散發著餘溫',
        nextNodes: [],
        status: 'current',
      };

      const result = resolveNodeEntry(node, { depth: 1 });
      expect(result.nodeStateUpdates.phase).toBe('sanctuary');
      expect(result.nodeStateUpdates.sanctuaryUsed).toBe(false);
      expect(result.log).toContain('抵達安全避難所');
    });

    it('initializes market entry state with generated items and purge available', () => {
      const node: MapNode = {
        id: 'node_2',
        type: 'market',
        layer: 4,
        col: 0,
        label: '黑市商人',
        title: '灰面卡斯楚的暗室',
        description: '禁忌物件陳列',
        nextNodes: [],
        status: 'current',
      };

      const result = resolveNodeEntry(node, { depth: 1, occupationId: 'investigator' });
      expect(result.nodeStateUpdates.phase).toBe('market');
      expect(result.nodeStateUpdates.marketPurgeUsed).toBe(false);
      expect(result.nodeStateUpdates.marketItems).toBeDefined();
      expect(result.nodeStateUpdates.marketItems!.length).toBeGreaterThanOrEqual(4);
      expect(result.log).toContain('進入黑市商鋪');
    });

    it('initializes altar entry state with 3 rituals', () => {
      const node: MapNode = {
        id: 'node_3',
        type: 'altar',
        layer: 5,
        col: 2,
        label: '禁忌祭壇',
        title: '無名冷火祭壇',
        description: '幽藍冷火',
        nextNodes: [],
        status: 'current',
      };

      const result = resolveNodeEntry(node, { depth: 1 });
      expect(result.nodeStateUpdates.phase).toBe('altar');
      expect(result.nodeStateUpdates.altarUsed).toBe(false);
      expect(result.nodeStateUpdates.altarRituals?.length).toBe(3);
      expect(result.log).toContain('禁忌祭壇在前方矗立');
    });

    it('initializes vault entry state with 3 candidate relics', () => {
      const node: MapNode = {
        id: 'node_4',
        type: 'vault',
        layer: 6,
        col: 1,
        label: '遺物秘閣',
        title: '青銅密室',
        description: '太古法器',
        nextNodes: [],
        status: 'current',
      };

      const result = resolveNodeEntry(node, { depth: 1 });
      expect(result.nodeStateUpdates.phase).toBe('vault');
      expect(result.nodeStateUpdates.vaultClaimed).toBe(false);
      expect(result.nodeStateUpdates.vaultRelics?.length).toBe(3);
      expect(result.log).toContain('厚重的青銅巨門徐徐開啟');
    });

    it('initializes blood altar entry state', () => {
      const node: MapNode = {
        id: 'node_5',
        type: 'blood_altar',
        layer: 7,
        col: 0,
        label: '血之祭壇',
        title: '石刻血壇',
        description: '腥味撲鼻',
        nextNodes: [],
        status: 'current',
      };

      const result = resolveNodeEntry(node, { depth: 1 });
      expect(result.nodeStateUpdates.phase).toBe('blood_altar');
      expect(result.nodeStateUpdates.bloodAltarUsed).toBe(false);
      expect(result.log).toContain('純淨之契');
    });

    it('initializes remains entry state with saved fallen record', () => {
      const fallenRecord: FallenInvestigatorRecord = {
        name: '前人',
        occupation: '私家偵探',
        deck: [mockDeck[0]],
        obols: 40,
        depth: 1,
        causeOfDeath: '戰死',
        timestamp: 12345,
      };
      saveFallenInvestigator(fallenRecord);

      const node: MapNode = {
        id: 'node_6',
        type: 'remains',
        layer: 2,
        col: 1,
        label: '屍骨遺骸',
        title: '先驅殘骸',
        description: '枯骨散落',
        nextNodes: [],
        status: 'current',
      };

      const result = resolveNodeEntry(node, { depth: 1 });
      expect(result.nodeStateUpdates.phase).toBe('remains');
      expect(result.nodeStateUpdates.remainsClaimed).toBe(false);
      expect(result.nodeStateUpdates.fallenInvestigator?.name).toBe('前人');
      expect(result.log).toContain('前代殉職調查員');
    });
  });

  /* =========================================================
     2. Sanctuary Interaction Tests
     ========================================================= */
  describe('Sanctuary Interaction', () => {
    it('heals 8 HP on normal sanctuary layer and caps at maxHealth', () => {
      mockInvestigator.health = 20;
      mockInvestigator.maxHealth = 25;

      const res = resolveNodeInteraction(
        { type: 'USE_SANCTUARY', payload: { actionType: 'rest' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, currentNode: { layer: 3 } as any }
      );

      expect(res.success).toBe(true);
      expect(res.investigator.health).toBe(25);
      expect(res.nodeStateUpdates.sanctuaryUsed).toBe(true);
      expect(res.logs[0]).toContain('恢復了 5 點肉體生命值');
    });

    it('heals 15 HP on layer 8 Mid-Depth Haven sanctuary', () => {
      mockInvestigator.health = 5;
      mockInvestigator.maxHealth = 25;

      const res = resolveNodeInteraction(
        { type: 'USE_SANCTUARY', payload: { actionType: 'rest' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, currentNode: { layer: 8 } as any }
      );

      expect(res.success).toBe(true);
      expect(res.investigator.health).toBe(20);
      expect(res.logs[0]).toContain('進行重度休整與外科縫合');
    });

    it('injects Truth Card Breakwater on meditate action', () => {
      const res = resolveNodeInteraction(
        { type: 'USE_SANCTUARY', payload: { actionType: 'meditate' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, currentDepth: 1 }
      );

      expect(res.success).toBe(true);
      expect(res.sanityDeck.length).toBe(mockDeck.length + 1);
      expect(res.sanityDeck[res.sanityDeck.length - 1].name).toBe(TRUTH_CARD_BREAKWATER.name);
      expect(res.logs[0]).toContain('深層冥想');
    });

    it('purges selected card on purge action', () => {
      const res = resolveNodeInteraction(
        { type: 'USE_SANCTUARY', payload: { actionType: 'purge', cardId: 'c2' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck }
      );

      expect(res.success).toBe(true);
      expect(res.sanityDeck.length).toBe(3);
      expect(res.sanityDeck.find((c) => c.id === 'c2')).toBeUndefined();
      expect(res.logs[0]).toContain('永久焚毀除役');
    });

    it('blocks purge action if deck has 1 or fewer cards', () => {
      const res = resolveNodeInteraction(
        { type: 'USE_SANCTUARY', payload: { actionType: 'purge', cardId: 'c1' } },
        { investigator: mockInvestigator, sanityDeck: [mockDeck[0]] }
      );

      expect(res.success).toBe(false);
      expect(res.logs[0]).toContain('牌庫卡牌數量過少');
    });
  });

  /* =========================================================
     3. Market Interaction Tests
     ========================================================= */
  describe('Market Interaction', () => {
    it('purchases medical supplies and restores HP', () => {
      mockInvestigator.health = 10;
      mockInvestigator.maxHealth = 25;
      mockInvestigator.obols = 30;

      const healItem: MarketItem = {
        id: 'item_heal_1',
        name: '軍用嗎啡注射劑',
        type: 'heal',
        price: 15,
        healAmount: 8,
        description: '急救藥品',
      };

      const res = resolveNodeInteraction(
        { type: 'BUY_MARKET_ITEM', payload: { itemId: 'item_heal_1' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, marketItems: [healItem] }
      );

      expect(res.success).toBe(true);
      expect(res.investigator.obols).toBe(15);
      expect(res.investigator.health).toBe(18);
      expect(res.nodeStateUpdates.marketItems?.[0].isPurchased).toBe(true);
      expect(res.logs[0]).toContain('恢復了 8 點生命值');
    });

    it('rejects purchase if obols are insufficient', () => {
      mockInvestigator.obols = 5;
      const expensiveItem: MarketItem = {
        id: 'item_relic_1',
        name: '昂貴遺物',
        type: 'relic',
        price: 35,
        description: '古物',
      };

      const res = resolveNodeInteraction(
        { type: 'BUY_MARKET_ITEM', payload: { itemId: 'item_relic_1' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, marketItems: [expensiveItem] }
      );

      expect(res.success).toBe(false);
      expect(res.logs[0]).toContain('古金幣不足');
    });

    it('purges card at market for 30 obols', () => {
      mockInvestigator.obols = 40;
      const res = resolveNodeInteraction(
        { type: 'PURGE_CARD_AT_MARKET', payload: { cardId: 'c1' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck }
      );

      expect(res.success).toBe(true);
      expect(res.investigator.obols).toBe(10);
      expect(res.sanityDeck.length).toBe(3);
      expect(res.nodeStateUpdates.marketPurgeUsed).toBe(true);
      expect(res.logs[0]).toContain('灰面卡斯楚的碎形焚爐');
    });

    it('rejects purge at market if obols < 30', () => {
      mockInvestigator.obols = 20;
      const res = resolveNodeInteraction(
        { type: 'PURGE_CARD_AT_MARKET', payload: { cardId: 'c1' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck }
      );

      expect(res.success).toBe(false);
      expect(res.logs[0]).toContain('古金幣不足');
    });
  });

  /* =========================================================
     4. Altar Interaction Tests
     ========================================================= */
  describe('Altar Interaction', () => {
    it('executes flesh ritual: costs 6 HP, increases maxHealth by 5, heals 5', () => {
      mockInvestigator.health = 15;
      mockInvestigator.maxHealth = 25;

      const res = resolveNodeInteraction(
        { type: 'USE_ALTAR', payload: { optionId: 'flesh' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck }
      );

      expect(res.success).toBe(true);
      // health: 15 - 6 + 5 = 14; maxHealth: 25 + 5 = 30
      expect(res.investigator.health).toBe(14);
      expect(res.investigator.maxHealth).toBe(30);
      expect(res.nodeStateUpdates.altarUsed).toBe(true);
    });

    it('blocks flesh ritual if health <= 6', () => {
      mockInvestigator.health = 6;
      const res = resolveNodeInteraction(
        { type: 'USE_ALTAR', payload: { optionId: 'flesh' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck }
      );
      expect(res.success).toBe(false);
    });

    it('executes time_space sanity ritual: purges 2 cards and increases handCapacity', () => {
      mockInvestigator.handCapacity = 2;
      const res = resolveNodeInteraction(
        { type: 'USE_ALTAR', payload: { optionId: 'time_space', costType: 'sanity' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck }
      );

      expect(res.success).toBe(true);
      expect(res.sanityDeck.length).toBe(2);
      expect(res.investigator.handCapacity).toBe(3);
    });

    it('executes chaos ritual: costs 4 HP, purges 1 card, gains 50 obols', () => {
      mockInvestigator.health = 10;
      mockInvestigator.obols = 10;

      const res = resolveNodeInteraction(
        { type: 'USE_ALTAR', payload: { optionId: 'chaos', cardId: 'c1' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, turn: 1 }
      );

      expect(res.success).toBe(true);
      expect(res.investigator.health).toBe(6);
      expect(res.investigator.obols).toBe(60);
      expect(res.sanityDeck.length).toBe(3);
      expect(res.adventureStatsUpdate?.totalObolsCollected).toBe(60);
    });
  });

  /* =========================================================
     5. Vault Interaction Tests
     ========================================================= */
  describe('Vault Interaction', () => {
    it('claims single relic from vault', () => {
      const relic = PRESET_RELICS[0];
      const res = resolveNodeInteraction(
        { type: 'CLAIM_VAULT_RELIC', payload: { relicId: relic.id } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, vaultRelics: [relic] }
      );

      expect(res.success).toBe(true);
      expect(res.investigator.relics?.some((r) => r.id === relic.id)).toBe(true);
      expect(res.nodeStateUpdates.vaultClaimed).toBe(true);
    });

    it('desecrates vault: claims 2 relics and injects abyss curse into sanityDeck', () => {
      const r1 = PRESET_RELICS[0];
      const r2 = PRESET_RELICS[1];

      const res = resolveNodeInteraction(
        { type: 'CLAIM_VAULT_RELIC', payload: { desecrate: true, relicIds: [r1.id, r2.id] } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, vaultRelics: [r1, r2] }
      );

      expect(res.success).toBe(true);
      expect(res.investigator.relics?.length).toBe(2);
      expect(res.sanityDeck.some((c) => c.id.startsWith('card_abyss_curse'))).toBe(true);
      expect(res.logs[0]).toContain('強行破除古神封印');
    });

    it('rejects desecrate with duplicate relic IDs', () => {
      const r1 = PRESET_RELICS[0];
      const res = resolveNodeInteraction(
        { type: 'CLAIM_VAULT_RELIC', payload: { desecrate: true, relicIds: [r1.id, r1.id] } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, vaultRelics: [r1] }
      );
      expect(res.success).toBe(false);
    });
  });

  /* =========================================================
     6. Blood Altar Interaction Tests
     ========================================================= */
  describe('Blood Altar Interaction', () => {
    it('purges 2 cards under pure branch', () => {
      const res = resolveNodeInteraction(
        { type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR', payload: { cardIds: ['c1', 'c2'], branch: 'pure' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck }
      );

      expect(res.success).toBe(true);
      expect(res.sanityDeck.length).toBe(2);
      expect(res.nodeStateUpdates.bloodAltarUsed).toBe(true);
    });

    it('purges 1 card and heals 5 HP under reshape branch', () => {
      mockInvestigator.health = 10;
      mockInvestigator.maxHealth = 25;

      const res = resolveNodeInteraction(
        { type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR', payload: { cardIds: ['c1'], branch: 'reshape' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck }
      );

      expect(res.success).toBe(true);
      expect(res.sanityDeck.length).toBe(3);
      expect(res.investigator.health).toBe(15);
    });
  });

  /* =========================================================
     7. Remains Interaction Tests
     ========================================================= */
  describe('Remains Interaction', () => {
    it('inherits card from fallen investigator', () => {
      const fallenRecord: FallenInvestigatorRecord = {
        name: '前人',
        occupation: '私家偵探',
        deck: [mockDeck[0]],
        obols: 40,
        depth: 1,
        causeOfDeath: '戰死',
        timestamp: 12345,
      };

      const res = resolveNodeInteraction(
        { type: 'INHERIT_REMAINS', payload: { type: 'card', cardId: 'c1' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, fallenInvestigator: fallenRecord }
      );

      expect(res.success).toBe(true);
      expect(res.sanityDeck.length).toBe(mockDeck.length + 1);
      expect(res.nodeStateUpdates.remainsClaimed).toBe(true);
      expect(getFallenInvestigator()).toBeNull();
    });

    it('inherits 50% obols from fallen investigator', () => {
      const fallenRecord: FallenInvestigatorRecord = {
        name: '前人',
        occupation: '私家偵探',
        deck: [mockDeck[0]],
        obols: 40,
        depth: 1,
        causeOfDeath: '戰死',
        timestamp: 12345,
      };

      const res = resolveNodeInteraction(
        { type: 'INHERIT_REMAINS', payload: { type: 'obols' } },
        { investigator: mockInvestigator, sanityDeck: mockDeck, fallenInvestigator: fallenRecord }
      );

      expect(res.success).toBe(true);
      expect(res.investigator.obols).toBe(70); // 50 + 20
      expect(res.adventureStatsUpdate?.totalObolsCollected).toBe(70);
    });
  });

  /* =========================================================
     8. Node Leave Tests
     ========================================================= */
  describe('resolveNodeLeave', () => {
    it('advances map and clears sanctuary state with literary log', () => {
      const res = resolveNodeLeave({ phase: 'sanctuary', map: { nodes: {}, currentNodeId: 'n1' } as any });
      expect(res.nodeStateCleans.sanctuaryUsed).toBeUndefined();
      expect(res.logs[0]).toBe('離開安全避難所，繼續踏入阿卡姆的迷霧路線。');
    });

    it('advances map and clears market state with literary log', () => {
      const res = resolveNodeLeave({ phase: 'market', map: { nodes: {}, currentNodeId: 'n1' } as any });
      expect(res.nodeStateCleans.marketItems).toBeUndefined();
      expect(res.nodeStateCleans.marketPurgeUsed).toBeUndefined();
      expect(res.logs[0]).toBe('離開黑市暗巷，重新回到調查地圖。');
    });

    it('advances map and clears altar state with literary log', () => {
      const res = resolveNodeLeave({ phase: 'altar', map: { nodes: {}, currentNodeId: 'n1' } as any });
      expect(res.nodeStateCleans.altarUsed).toBeUndefined();
      expect(res.nodeStateCleans.altarRituals).toBeUndefined();
      expect(res.logs[0]).toBe('告別禁忌祭壇，重回阿卡姆調查地圖。');
    });

    it('advances map and clears vault state with literary log', () => {
      const res = resolveNodeLeave({ phase: 'vault', map: { nodes: {}, currentNodeId: 'n1' } as any });
      expect(res.nodeStateCleans.vaultRelics).toBeUndefined();
      expect(res.nodeStateCleans.vaultClaimed).toBeUndefined();
      expect(res.logs[0]).toBe('離開遺物秘閣，青銅巨門在身後轟然闔上。');
    });

    it('advances map and clears blood altar state with literary log', () => {
      const res = resolveNodeLeave({ phase: 'blood_altar', map: { nodes: {}, currentNodeId: 'n1' } as any });
      expect(res.nodeStateCleans.bloodAltarUsed).toBeUndefined();
      expect(res.logs[0]).toBe('離開血之祭壇，牌庫精簡洗鍊，神識重歸清明。');
    });

    it('advances map, clears fallen record and remains state with literary log', () => {
      saveFallenInvestigator({ name: '測試', deck: [], obols: 0, depth: 1, causeOfDeath: '傷重', timestamp: 0 });
      const res = resolveNodeLeave({ phase: 'remains', map: { nodes: {}, currentNodeId: 'n1' } as any });
      expect(res.nodeStateCleans.fallenInvestigator).toBeUndefined();
      expect(res.nodeStateCleans.remainsClaimed).toBeUndefined();
      expect(res.logs[0]).toContain('向殉職前輩的骸骨致敬默哀');
      expect(getFallenInvestigator()).toBeNull();
    });
  });
});
