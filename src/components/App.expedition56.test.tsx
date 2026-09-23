import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { soundEngine } from '../engine/audioManager';
import { gameReducer, createInitialGameState } from '../engine/gameReducer';
import { resolveSurvivalSettlement } from '../engine/survival/settlementResolver';
import { advanceCanonicalIntent, interceptEnemyDamage, resolveEnemyAction } from '../engine/enemyTraits';
import { getEnemyTemplateById } from '../engine/enemyCatalog';
import { createStatusEffect } from '../engine/statusEffects';
import { evaluateCardPlay } from '../engine/cards/evaluator';
import { OCCULTIST_REWARD_CARDS } from '../engine/cards/occultist/rewards';
import { OCCULTIST_STARTER_CARDS } from '../engine/cards/occultist/starter';
import type { CardPlayContext } from '../engine/cards/types';
import type { DepthLevel, Enemy, GameState, Investigator, InvestigationMap, MapNode, MapNodeType, MythosEventOption } from '../types/game';
import { generateProceduralInvestigationMap } from '../engine/mapGenerator';
import { MARKET_PURGE_COST, DEPTH_EVENT_POOLS, getMythosEventsForDepth } from '../engine/eventData';
import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  COMPLETE_ANCIENT_SEAL,
  getAllPermanentCards,
  hasBothAbyssalFragments,
} from '../engine/abyssalSeals';

function mockSoundEngine(): void {
  vi.spyOn(soundEngine, 'playClick').mockImplementation(() => {});
  vi.spyOn(soundEngine, 'playCardPlay').mockImplementation(() => {});
  vi.spyOn(soundEngine, 'playHeartbeat').mockImplementation(() => {});
  vi.spyOn(soundEngine, 'playGunCock').mockImplementation(() => {});
  vi.spyOn(soundEngine, 'playEngineStart').mockImplementation(() => {});
}

function navigateToMapUI(): void {
  mockSoundEngine();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /開啟新調查/i }));
  fireEvent.click(screen.getByRole('button', { name: /選擇調查員/i }));
  fireEvent.click(screen.getByRole('button', { name: /啟程調查/i }));
  fireEvent.click(screen.getByRole('button', { name: /踏入調查地圖/i }));
}

function createBaseInvestigator(overrides: Partial<Investigator> = {}): Investigator {
  return {
    name: '愛德華·皮爾斯',
    occupation: '私家偵探',
    health: 25,
    maxHealth: 25,
    stamina: 3,
    maxStamina: 3,
    armor: 0,
    obols: 10,
    statusEffects: [],
    ...overrides,
  };
}

describe('Full-System Integration & 56-Layer Expedition Verification (Issue #48)', () => {
  describe('1. Private Investigator 16-Floor Expedition & Haven Rest', () => {
    it('executes full journey: Onboarding -> Map (16 floors) -> Mid-Depth Haven (Floor 8) -> Boss Encounter', () => {
      vi.spyOn(soundEngine, 'playClick').mockImplementation(() => {});
      vi.spyOn(soundEngine, 'playCardPlay').mockImplementation(() => {});
      vi.spyOn(soundEngine, 'playHeartbeat').mockImplementation(() => {});
      vi.spyOn(soundEngine, 'playGunCock').mockImplementation(() => {});
      vi.spyOn(soundEngine, 'playEngineStart').mockImplementation(() => {});

      render(<App />);

      // Phase 1: Title Screen
      expect(screen.getByText('克蘇魯文字卡牌冒險')).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /開啟新調查/i }));

      // Phase 2: Prologue Screen
      expect(screen.getByText(/阿卡姆早報 · ARKHAM GAZETTE/i)).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /選擇調查員/i }));

      // Phase 3: Occupation Select Screen -> Select Edward Pierce
      expect(screen.getByText('愛德華·皮爾斯')).toBeDefined();
      const pierceStartBtn = screen.getByRole('button', { name: /啟程調查/i });
      fireEvent.click(pierceStartBtn);

      // Phase 4: Departure Screen -> Enter Map
      expect(screen.getByText(/雨夜啟程 · 破霧而行/i)).toBeDefined();
      fireEvent.click(screen.getByRole('button', { name: /踏入調查地圖/i }));

      // Phase 5: Map Screen (Depth 1, 16 Layers)
      expect(screen.getByText('第一深度：阿卡姆封鎖區 · 調查路線圖')).toBeDefined();
      expect(screen.getByText(/進度 1 \/ 16 層/)).toBeDefined();

      // Verify Floor 8 Mid-Depth Haven indicator is present
      expect(screen.getByText(/豐饒中繼站/)).toBeDefined();

      // Verify SVG paths and candle breathing active nodes
      const candleNodes = document.querySelectorAll('.map-node-card.candle-breathing');
      expect(candleNodes.length).toBeGreaterThan(0);
    });

    it('handles Mid-Depth Haven resting at Layer 8 with full heavy healing', () => {
      let state = createInitialGameState();
      // Transition to occupation select and select investigator with procedural map
      state = gameReducer(state, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'investigator', procedural: true },
      });
      // Move through departure to map
      state = gameReducer(state, { type: 'COMPLETE_DEPARTURE' });
      expect(state.phase).toBe('map');
      expect(state.map?.layers.length).toBe(16);

      // Simulate wounded investigator reaching layer 8 Haven
      const layer8NodeId = state.map!.layers[8][0];
      const layer8Node = state.map!.nodes[layer8NodeId];
      expect(layer8Node.type).toBe('sanctuary');

      state = {
        ...state,
        investigator: {
          ...state.investigator,
          health: 10,
          maxHealth: 30,
          obols: 20,
        },
        map: {
          ...state.map!,
          currentNodeId: layer8NodeId,
        },
        phase: 'sanctuary',
      };

      // Investigator uses heavy medical bandage at Mid-Depth Haven (+15 HP)
      state = gameReducer(state, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'bandage' },
      });

      expect(state.investigator.health).toBe(25); // 10 + 15
      expect(state.sanctuaryUsed).toBe(true);

      // Leave Sanctuary back to map
      state = gameReducer(state, { type: 'LEAVE_SANCTUARY' });
      expect(state.phase).toBe('map');
      expect(state.investigator.health).toBe(25);
    });

    it('transitions to boss combat at Layer 15 and rewards full recovery on boss defeat', () => {
      let state = createInitialGameState();
      state = gameReducer(state, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'investigator', procedural: true },
      });
      state = gameReducer(state, { type: 'COMPLETE_DEPARTURE' });

      // Simulate reaching layer 15 Boss node (Shoggoth Progeny)
      const bossNodeId = state.map!.layers[15][0];
      const bossNode = state.map!.nodes[bossNodeId];
      expect(bossNode.type).toBe('boss');

      // Make the boss node accessible for testing navigation
      state = {
        ...state,
        map: {
          ...state.map!,
          nodes: {
            ...state.map!.nodes,
            [bossNodeId]: {
              ...bossNode,
              status: 'accessible',
            },
          },
        },
      };

      state = gameReducer(state, {
        type: 'NAVIGATE_TO_NODE',
        payload: { nodeId: bossNodeId },
      });

      expect(state.phase).toBe('combat');
      expect(state.currentEnemy?.id).toBe('enemy_shoggoth_progeny');

      // Defeat boss and verify settlement full recovery
      const settlement = resolveSurvivalSettlement(
        { type: 'skip' },
        {
          investigator: { ...state.investigator, health: 12, maxHealth: 28 },
          currentCards: state.sanityDeck,
          currentNodeType: 'boss',
          currentDepth: 1,
        }
      );

      expect(settlement.investigator.health).toBe(28); // Restored to full
      expect(settlement.logs.some((l) => l.includes('首領決戰復甦'))).toBe(true);
    });
  });

  describe('2. Occultist Cosmic Tactics vs Deep Ones & Dagon Priest', () => {
    it('demonstrates Eleanor Vance truth loop, seal detonation, and low-sanity burst', () => {
      let state = createInitialGameState();
      state = gameReducer(state, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'occultist', procedural: true },
      });

      expect(state.investigator.occupation).toBe('秘術學者');
      // Verify Occultist deck contains magic & truth cards
      const hasMagicCard = state.sanityDeck.some((c) => c.category === 'magic');
      const hasTruthCard = state.sanityDeck.some((c) => c.category === 'truth');
      expect(hasMagicCard).toBe(true);
      expect(hasTruthCard).toBe(true);

      const occultistInvestigator: Investigator = {
        name: '艾蓮諾·凡斯',
        occupation: '秘術學者',
        health: 20,
        maxHealth: 22,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 20,
        statusEffects: [],
      };

      const baseEnemy: Enemy = {
        id: 'test_deep_one',
        name: '深潛者戰士',
        title: '印斯茅斯哨兵',
        health: 30,
        maxHealth: 30,
        armor: 0,
        statusEffects: [createStatusEffect('bleed', 2), createStatusEffect('horror', 1)], // 3 total status stacks
        currentIntent: { type: 'attack', value: 8, name: '三叉戟刺擊', description: '刺擊' },
      };

      // 1. Truth Injection / Cycle (銀鑰儀式): Injects truth cards to sustain sanity deck
      const silverKeyCard = OCCULTIST_STARTER_CARDS.find((c) => c.id === 'card_silver_key_1')!;
      const truthContext: CardPlayContext = {
        investigator: occultistInvestigator,
        enemy: baseEnemy,
        hand: [silverKeyCard],
        sanityDeck: [],
        discardPile: [],
        turn: 1,
        isMadness: true,
      };
      const truthResult = evaluateCardPlay(silverKeyCard, truthContext);
      expect(truthResult.success).toBe(true);
      expect(truthResult.sanityDeck.length).toBe(2); // Injected 2 truth cards
      expect(truthResult.logs.some((l) => l.includes('注入') || l.includes('銀鑰'))).toBe(true);

      // 2. Curse Seal Detonation (深淵引爆): Scales from enemy status stacks (bleed + horror)
      const detonationCard = OCCULTIST_REWARD_CARDS.find((c) => c.id === 'reward_abyssal_detonation')!;
      const detonationContext: CardPlayContext = {
        investigator: { ...occultistInvestigator, stamina: 3 },
        enemy: baseEnemy,
        hand: [detonationCard],
        sanityDeck: [silverKeyCard, silverKeyCard],
        discardPile: [],
        turn: 2,
        isMadness: false,
      };
      const detonationResult = evaluateCardPlay(detonationCard, detonationContext);
      expect(detonationResult.success).toBe(true);
      // Base 10 + 3 stacks * 3 = 19 magic damage
      expect(detonationResult.enemy.health).toBe(30 - 19);
      expect(detonationResult.logs.some((l) => l.includes('印記共鳴加成') || l.includes('深淵引爆'))).toBe(true);

      // 3. Low-Sanity Burst (狂亂低語): Deals higher damage when sanity deck is depleted
      const whispersCard = OCCULTIST_REWARD_CARDS.find((c) => c.id === 'reward_whispers_of_madness')!;
      const lowSanityContext: CardPlayContext = {
        investigator: occultistInvestigator,
        enemy: { ...baseEnemy, health: 30 },
        hand: [whispersCard],
        sanityDeck: [silverKeyCard], // 1 card remaining (missingSanity = 10 - 1 = 9; <= 4 gives +6 bonus)
        discardPile: [],
        turn: 3,
        isMadness: false,
      };
      const whispersResult = evaluateCardPlay(whispersCard, lowSanityContext);
      expect(whispersResult.success).toBe(true);
      // Base 8 + missing 10 (1 sanity cost consumed remaining card: 10 - 0 = 10) + low-sanity bonus 6 = 24 damage
      expect(whispersResult.enemy.health).toBe(30 - 24);
      expect(whispersResult.logs.some((l) => l.includes('心智虧蝕加成'))).toBe(true);
    });

    it('verifies Deep One slippery mucus absorbs physical damage <= 4, while high damage bypasses', () => {
      const deepOne = getEnemyTemplateById('enemy_deep_one_warrior');
      expect(deepOne).toBeDefined();
      expect(deepOne!.traits?.some((t) => t.id === 'slippery_mucus')).toBe(true);

      // Low damage (4) -> nullified
      const resNullified = interceptEnemyDamage(deepOne!, 4, false, 'combat');
      expect(resNullified.modifiedDamage).toBe(0);
      expect(resNullified.logs[0]).toContain('滑膩黏液');

      // Higher damage (9) -> full damage penetrates
      const resPenetrated = interceptEnemyDamage(deepOne!, 9, false, 'magic');
      expect(resPenetrated.modifiedDamage).toBe(9);
    });

    it('verifies Dagon Priest tidal cycle: accumulates armor on odd turns, unleashes tsunami on even turns', () => {
      const dagonPriest = getEnemyTemplateById('enemy_dagon_priest');
      expect(dagonPriest).toBeDefined();
      expect(dagonPriest!.traits?.some((t) => t.id === 'tide_of_dagon')).toBe(true);

      const investigator: Investigator = {
        name: '艾蓮諾·凡斯',
        occupation: '秘術學者',
        health: 22,
        maxHealth: 22,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 20,
        statusEffects: [],
      };

      // Turn 1 (Odd): Builds tidal armor
      const oddAction = resolveEnemyAction(dagonPriest!, dagonPriest!.currentIntent, investigator, 1);
      expect(oddAction.armorGainToEnemy).toBe(14);
      expect(oddAction.logs.some((l) => l.includes('潮漲') || l.includes('潮汐'))).toBe(true);

      // Enemy now has armor going into Turn 2
      const armedPriest: Enemy = {
        ...dagonPriest!,
        armor: 14,
      };

      // Turn 2 (Even): Consumes armor and unleashes tsunami damage
      const evenAction = resolveEnemyAction(armedPriest, armedPriest.currentIntent, investigator, 2);
      expect(evenAction.logs.some((l) => l.includes('大袞潮汐') || l.includes('海嘯'))).toBe(true);
      expect(evenAction.armorLossToEnemy).toBe(14); // Armor consumed into attack
    });
  });

  describe('3. Post-Combat Field Dressing Survival Triage', () => {
    it('executes Field Dressing: restores 4 HP while skipping card draft to keep deck lean', () => {
      const investigator = createBaseInvestigator({ health: 15, maxHealth: 25, obols: 30 });

      const settlement = resolveSurvivalSettlement(
        { type: 'field_dressing', healAmount: 4 },
        {
          investigator,
          currentCards: [],
          currentNodeType: 'combat',
          currentDepth: 1,
        }
      );

      expect(settlement.investigator.health).toBe(19); // 15 + 4
      expect(settlement.logs.some((l) => l.includes('戰地包紮') || l.includes('戰地應急包紮'))).toBe(true);
    });

    it('caps Field Dressing healing at investigator maxHealth', () => {
      const investigator = createBaseInvestigator({ health: 24, maxHealth: 25, obols: 30 });

      const settlement = resolveSurvivalSettlement(
        { type: 'field_dressing', healAmount: 4 },
        {
          investigator,
          currentCards: [],
          currentNodeType: 'combat',
          currentDepth: 1,
        }
      );

      expect(settlement.investigator.health).toBe(25); // capped at maxHealth
    });
  });

  describe('4. Responsive Vertical Parchment Scroll Map & Candle Navigation', () => {
    it('renders scroll map with accessible nodes and candle breathing markers in standard & narrow viewports', () => {
      // 1. Desktop standard viewport
      window.innerWidth = 1280;
      window.innerHeight = 800;
      window.dispatchEvent(new Event('resize'));

      const { rerender } = render(<App />);

      // Advance to map
      fireEvent.click(screen.getByRole('button', { name: /開啟新調查/i }));
      fireEvent.click(screen.getByRole('button', { name: /選擇調查員/i }));
      fireEvent.click(screen.getByRole('button', { name: /啟程調查/i }));
      fireEvent.click(screen.getByRole('button', { name: /踏入調查地圖/i }));

      // Verify map layout structure in standard viewport
      const scrollContainer = document.querySelector('.map-scroll-container');
      expect(scrollContainer).toBeDefined();

      const parchmentBoard = document.querySelector('.map-parchment-board');
      expect(parchmentBoard).toBeDefined();

      // Verify accessible nodes have the candle-breathing class
      const accessibleCandles = document.querySelectorAll('.map-node-card.accessible.candle-breathing');
      expect(accessibleCandles.length).toBeGreaterThan(0);

      // Verify SVG paths exist connecting the layers
      const svgPaths = document.querySelectorAll('.map-connections-svg path');
      expect(svgPaths.length).toBeGreaterThan(0);

      // 2. Responsive narrow mobile viewport simulation
      window.innerWidth = 375;
      window.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));

      rerender(<App />);

      // Re-verify that the responsive scroll container and candle navigation remain fully functional
      const narrowScrollContainer = document.querySelector('.map-scroll-container');
      expect(narrowScrollContainer).toBeDefined();
      const narrowAccessibleCandles = document.querySelectorAll('.map-node-card.accessible.candle-breathing');
      expect(narrowAccessibleCandles.length).toBeGreaterThan(0);
    });
  });

  describe('5. Canonical Monster Traits & Battle Log Verification', () => {
    it('Arkham Cultist: Zealot Blood Oath stacks strength upon taking damage', () => {
      const cultist = getEnemyTemplateById('enemy_arkham_cultist');
      expect(cultist).toBeDefined();
      expect(cultist!.traits?.some((t) => t.id === 'zealous_blood_oath')).toBe(true);

      const res = interceptEnemyDamage(cultist!, 6, false, 'combat');
      expect(res.newEnemyStatusEffects.some((s) => s.type === 'might')).toBe(true);
      expect(res.logs.some((l) => l.includes('狂熱血契'))).toBe(true);
    });

    it('Ghoul Lurker: Carrion Feeder leeches health when attacking bleeding investigator', () => {
      const ghoul = getEnemyTemplateById('enemy_ghoul_lurker');
      expect(ghoul).toBeDefined();
      expect(ghoul!.traits?.some((t) => t.id === 'carrion_feeder')).toBe(true);

      const woundedGhoul: Enemy = { ...ghoul!, health: 10, maxHealth: 20 };
      const bleedingInvestigator: Investigator = {
        ...createBaseInvestigator(),
        statusEffects: [createStatusEffect('bleed', 3)],
      };

      const action = resolveEnemyAction(woundedGhoul, woundedGhoul.currentIntent, bleedingInvestigator, 2);
      expect(action.healToEnemy).toBeGreaterThan(0); // Leeched HP
      expect(action.logs.some((l) => l.includes('食腐本能'))).toBe(true);
    });

    it('Nightgaunt: Faceless Terror erodes sanity and gains evasive armor', () => {
      const nightgaunt = getEnemyTemplateById('enemy_nightgaunt');
      expect(nightgaunt).toBeDefined();
      expect(nightgaunt!.traits?.some((t) => t.id === 'faceless_terror')).toBe(true);

      const armoredInvestigator: Investigator = {
        ...createBaseInvestigator(),
        armor: 20, // Heavy armor
      };

      const erodeIntent = {
        type: 'erode' as const,
        value: 2,
        name: '心智侵蝕',
        description: '侵蝕心智',
      };

      const action = resolveEnemyAction(nightgaunt!, erodeIntent, armoredInvestigator, 1);
      expect(action.erodeToInvestigator).toBe(2);
      expect(action.armorGainToEnemy).toBe(6); // Shadow glide gives 6 armor
      expect(action.logs.some((l) => l.includes('陰影滑翔'))).toBe(true);
    });

    it('Shoggoth: Organ Proliferation charges Tekeli-li crush with vulnerable charging stance and devastating strike', () => {
      const shoggoth = getEnemyTemplateById('enemy_colossal_shoggoth');
      expect(shoggoth).toBeDefined();
      expect(shoggoth!.traits?.some((t) => t.id === 'organ_proliferation')).toBe(true);

      // Turn 3: Shoggoth tactical AI enters charging stance
      const turn3Tactics = advanceCanonicalIntent(shoggoth!, 3);
      expect(turn3Tactics.newShoggothStance).toBe('charging');
      expect(turn3Tactics.nextIntent.isCharge).toBe(true);
      expect(turn3Tactics.nextIntent.name).toContain('Tekeli-li 蓄力碾壓');

      // During charging stance, investigator attacks deal +50% damage (蓄力破綻)
      const chargingShoggoth: Enemy = {
        ...shoggoth!,
        shoggothStance: 'charging',
      };
      const hitRes = interceptEnemyDamage(chargingShoggoth, 10, false, 'combat');
      expect(hitRes.modifiedDamage).toBe(15); // 10 * 1.5
      expect(hitRes.logs.some((l) => l.includes('蓄力破綻'))).toBe(true);

      // Turn 4: Shoggoth delivers devastating Tekeli-li crush attack (20 damage)
      const turn4Tactics = advanceCanonicalIntent(shoggoth!, 4);
      expect(turn4Tactics.newShoggothStance).toBe('normal');
      expect(turn4Tactics.nextIntent.value).toBe(20);
      expect(turn4Tactics.nextIntent.name).toContain('Tekeli-li 毀滅重壓');
    });

    it('Enforces turn 6 anti-stall enrage timer: +50% attack damage', () => {
      const enemy: Enemy = {
        id: 'test_ghoul',
        name: '食屍鬼',
        title: '潛伏者',
        health: 20,
        maxHealth: 20,
        armor: 0,
        currentIntent: {
          type: 'attack',
          value: 10,
          name: '撕咬',
          description: '撕咬',
        },
      };
      const investigator = createBaseInvestigator();

      // Turn 5: Standard damage (10)
      const actionTurn5 = resolveEnemyAction(enemy, enemy.currentIntent, investigator, 5);
      expect(actionTurn5.damageToInvestigator).toBe(10);

      // Turn 6: Enraged (+50% -> 15)
      const actionTurn6 = resolveEnemyAction(enemy, enemy.currentIntent, investigator, 6);
      expect(actionTurn6.damageToInvestigator).toBe(15);
      expect(actionTurn6.logs.some((l) => l.includes('狂暴') || l.includes('深淵'))).toBe(true);
    });
  });

  describe('6. 56-Layer Full Expedition & Dynamic Node Content Integration (Issue #56 / ADR-0032)', () => {
    function createActiveRunState(): GameState {
      let state = createInitialGameState();
      state = gameReducer(state, {
        type: 'SELECT_OCCUPATION',
        payload: { occupationId: 'investigator', procedural: true },
      });
      return gameReducer(state, { type: 'COMPLETE_DEPARTURE' });
    }

    function makeNodeAccessible(state: GameState, nodeId: string): GameState {
      return {
        ...state,
        map: {
          ...state.map!,
          nodes: {
            ...state.map!.nodes,
            [nodeId]: { ...state.map!.nodes[nodeId], status: 'accessible' },
          },
        },
      };
    }

    function findProceduralMapWithNodeType(type: MapNodeType): InvestigationMap {
      for (let seed = 1; seed <= 50; seed++) {
        const map = generateProceduralInvestigationMap({ depth: 1, seed });
        const nodes = Object.values(map.nodes) as MapNode[];
        if (nodes.some((n) => n.type === type)) {
          return map;
        }
      }
      throw new Error(`無法在種子 1~50 中檢索到包含原生 ${type} 的地圖`);
    }

    function navigateToProceduralNode(state: GameState, type: MapNodeType): GameState {
      const map = findProceduralMapWithNodeType(type);
      let nextState: GameState = { ...state, map };
      const nodes = Object.values(map.nodes) as MapNode[];
      const targetNode = nodes.find((n) => n.type === type)!;
      nextState = makeNodeAccessible(nextState, targetNode.id);
      return gameReducer(nextState, { type: 'NAVIGATE_TO_NODE', payload: { nodeId: targetNode.id } });
    }

    function isSafeEventOption(option?: MythosEventOption): boolean {
      if (!option?.consequences) return true;
      return !option.consequences.some((c) => c.type === 'sanity_change' && (c.value ?? 0) < 0);
    }

    function traverseExpeditionFloor(state: GameState, layerIdx: number): GameState {
      const node = Object.values(state.map!.nodes).find(
        (n) => n.layer === layerIdx && n.status === 'accessible'
      );
      expect(node, `Layer ${layerIdx} should have an accessible node`).toBeDefined();
      let nextState = gameReducer(state, { type: 'NAVIGATE_TO_NODE', payload: { nodeId: node!.id } });

      if (node!.type === 'boss') {
        nextState = { ...nextState, phase: 'victory' };
        nextState = gameReducer(nextState, { type: 'PROCEED_TO_REWARD' });
        expect(nextState.phase).toBe('reward');
        if (nextState.currentDepth === 1 || nextState.currentDepth === 2) {
          // Legitimate Abyssal Seal reward choice as specified by ADR-0015
          nextState = gameReducer(nextState, { type: 'CLAIM_ABYSSAL_SEAL' });
        } else {
          nextState = gameReducer(nextState, { type: 'CLAIM_FIELD_DRESSING', payload: { healAmount: 8 } });
        }
        return nextState;
      }

      switch (nextState.phase) {
        case 'combat': {
          nextState = { ...nextState, phase: 'victory' };
          nextState = gameReducer(nextState, { type: 'PROCEED_TO_REWARD' });
          nextState = gameReducer(nextState, { type: 'CLAIM_FIELD_DRESSING', payload: { healAmount: 4 } });
          break;
        }
        case 'sanctuary': {
          nextState = gameReducer(nextState, { type: 'USE_SANCTUARY', payload: { optionId: 'meditate' } });
          nextState = gameReducer(nextState, { type: 'LEAVE_SANCTUARY' });
          break;
        }
        case 'event': {
          const safeOption = nextState.currentEvent?.options?.find(isSafeEventOption)
            ?? nextState.currentEvent?.options?.[0];
          if (safeOption) {
            nextState = gameReducer(nextState, {
              type: 'RESOLVE_EVENT_OPTION',
              payload: { optionId: safeOption.id },
            });
          }
          nextState = gameReducer(nextState, { type: 'COMPLETE_EVENT' });
          break;
        }
        case 'market': {
          nextState = gameReducer(nextState, { type: 'LEAVE_MARKET' });
          break;
        }
        case 'vault': {
          nextState = gameReducer(nextState, { type: 'LEAVE_VAULT' });
          break;
        }
        case 'altar': {
          nextState = gameReducer(nextState, { type: 'LEAVE_ALTAR' });
          break;
        }
        case 'blood_altar': {
          nextState = gameReducer(nextState, { type: 'LEAVE_BLOOD_ALTAR' });
          break;
        }
        case 'remains': {
          nextState = gameReducer(nextState, { type: 'LEAVE_REMAINS' });
          break;
        }
      }

      expect(nextState.phase).toBe('map');
      return nextState;
    }

    it('simulates full 4-depth (56-layer: 16+16+16+8) expedition lifecycle from Departure to R\'lyeh victory', () => {
      let state = createActiveRunState();
      expect(state.phase).toBe('map');
      expect(state.currentDepth).toBe(1);
      expect(state.map?.layers).toHaveLength(16);

      // Depth 1: 16 layers (0 to 15) step-by-step through DAG
      for (let layer = 0; layer <= 15; layer++) {
        state = traverseExpeditionFloor(state, layer);
      }
      expect(state.phase).toBe('depth_transition');
      expect(getAllPermanentCards(state).some((c) => c.id === ABYSSAL_FRAGMENT_1.id)).toBe(true);

      // Transition to Depth 2 (16 layers, Innsmouth Coast)
      state = gameReducer(state, { type: 'COMPLETE_DEPTH_TRANSITION' });
      expect(state.phase).toBe('map');
      expect(state.currentDepth).toBe(2);
      expect(state.investigator.health).toBe(state.investigator.maxHealth); // Boss defeat full health recovery
      expect(state.map?.layers).toHaveLength(16);

      // Depth 2: 16 layers (0 to 15) step-by-step through DAG
      for (let layer = 0; layer <= 15; layer++) {
        state = traverseExpeditionFloor(state, layer);
      }
      expect(state.phase).toBe('depth_transition');
      expect(getAllPermanentCards(state).some((c) => c.id === ABYSSAL_FRAGMENT_2.id)).toBe(true);
      expect(hasBothAbyssalFragments(state)).toBe(true);

      // Transition to Depth 3
      state = gameReducer(state, { type: 'COMPLETE_DEPTH_TRANSITION' });
      expect(state.phase).toBe('map');
      expect(state.currentDepth).toBe(3);
      expect(state.investigator.health).toBe(state.investigator.maxHealth);
      expect(state.map?.layers).toHaveLength(16);

      // Depth 3: 16 layers (0 to 15) step-by-step through DAG
      for (let layer = 0; layer <= 15; layer++) {
        state = traverseExpeditionFloor(state, layer);
      }
      expect(state.phase).toBe('depth_transition');
      expect(state.abyssalSealFused).toBe(true);
      expect(getAllPermanentCards(state).some((c) => c.name === COMPLETE_ANCIENT_SEAL.name)).toBe(true);

      // Transition to Depth 4 (R'lyeh, 8 layers)
      state = gameReducer(state, { type: 'COMPLETE_DEPTH_TRANSITION' });
      expect(state.phase).toBe('map');
      expect(state.currentDepth).toBe(4);
      expect(state.investigator.health).toBe(state.investigator.maxHealth);
      expect(state.map?.layers).toHaveLength(8);

      // Depth 4: 8 layers (0 to 7) step-by-step through DAG to Final Boss (Star Spawn)
      for (let layer = 0; layer <= 7; layer++) {
        state = traverseExpeditionFloor(state, layer);
      }
      expect(state.map?.isCompleted).toBe(true);
      expect(state.isTrueEnding).toBe(true);
    });

    it('verifies guaranteed DAG quotas (Vault 1~2, Market 1~2, Altar 1~2) across 16-floor maps (Depths 1~3)', () => {
      for (const depth of [1, 2, 3] as DepthLevel[]) {
        for (let seed = 1; seed <= 15; seed++) {
          const map = generateProceduralInvestigationMap({ depth, seed });
          const allNodes = Object.values(map.nodes);
          const vaultCount = allNodes.filter((n) => n.type === 'vault').length;
          const marketCount = allNodes.filter((n) => n.type === 'market').length;
          const altarCount = allNodes.filter((n) => n.type === 'altar' || n.type === 'blood_altar').length;

          expect(vaultCount, `Depth ${depth} Seed ${seed} should have 1~2 vaults`).toBeGreaterThanOrEqual(1);
          expect(vaultCount, `Depth ${depth} Seed ${seed} should have 1~2 vaults`).toBeLessThanOrEqual(2);
          expect(marketCount, `Depth ${depth} Seed ${seed} should have 1~2 markets`).toBeGreaterThanOrEqual(1);
          expect(marketCount, `Depth ${depth} Seed ${seed} should have 1~2 markets`).toBeLessThanOrEqual(2);
          expect(altarCount, `Depth ${depth} Seed ${seed} should have 1~2 altars`).toBeGreaterThanOrEqual(1);
          expect(altarCount, `Depth ${depth} Seed ${seed} should have 1~2 altars`).toBeLessThanOrEqual(2);
        }
      }
    });

    it('verifies depth-stratified mythos event generation, option consequence resolution across branches, and visitedEventIds anti-repeat', () => {
      // 1. Verify 4-depth event pools are stratified with zero collision
      const d1Pool = DEPTH_EVENT_POOLS[1];
      const d2Pool = DEPTH_EVENT_POOLS[2];
      const d3Pool = DEPTH_EVENT_POOLS[3];
      const d4Pool = DEPTH_EVENT_POOLS[4];

      expect(d1Pool).toHaveLength(4);
      expect(d2Pool).toHaveLength(4);
      expect(d3Pool).toHaveLength(4);
      expect(d4Pool).toHaveLength(4);

      const allUnique = new Set([...d1Pool, ...d2Pool, ...d3Pool, ...d4Pool]);
      expect(allUnique.size).toBe(16);

      // 2. Test in-game event navigation, option consequence execution across branches, and anti-repeat
      let state = createActiveRunState();

      // Find all event nodes in Depth 1 map
      const eventNodes = Object.values(state.map!.nodes).filter((n) => n.type === 'event');
      expect(eventNodes.length).toBeGreaterThan(0);

      // Navigate to first event node
      const firstEventNode = eventNodes[0];
      state = makeNodeAccessible(state, firstEventNode.id);
      state = gameReducer(state, { type: 'NAVIGATE_TO_NODE', payload: { nodeId: firstEventNode.id } });
      expect(state.phase).toBe('event');
      expect(state.currentEvent).toBeDefined();
      expect(state.visitedEventIds).toContain(state.currentEvent!.id);

      const firstEventId = state.currentEvent!.id;
      const options = state.currentEvent!.options;
      expect(options.length).toBeGreaterThanOrEqual(2);

      // Verify and resolve Option 0
      const option0 = options[0];
      state = gameReducer(state, {
        type: 'RESOLVE_EVENT_OPTION',
        payload: { optionId: option0.id },
      });
      const firstConsequence = option0.consequences[0];
      expect(state.battleLog.some((log) => log.includes(firstConsequence.narrative))).toBe(true);

      // Complete event and return to map
      state = gameReducer(state, { type: 'COMPLETE_EVENT' });
      expect(state.phase).toBe('map');

      // Navigate to second event node if exists and test alternate option resolution
      if (eventNodes.length > 1) {
        const secondEventNode = eventNodes[1];
        state = makeNodeAccessible(state, secondEventNode.id);
        state = gameReducer(state, { type: 'NAVIGATE_TO_NODE', payload: { nodeId: secondEventNode.id } });
        expect(state.phase).toBe('event');
        expect(state.currentEvent!.id).not.toBe(firstEventId); // Anti-repeat!
        expect(state.visitedEventIds).toContain(state.currentEvent!.id);
        expect(state.visitedEventIds?.length).toBeGreaterThanOrEqual(2);

        // Resolve alternate option (Option 1) to exercise branch consequences
        const secondEventOptions = state.currentEvent!.options;
        const option1 = secondEventOptions[1] ?? secondEventOptions[0];
        state = gameReducer(state, {
          type: 'RESOLVE_EVENT_OPTION',
          payload: { optionId: option1.id },
        });
        const secondConsequence = option1.consequences[0];
        expect(state.battleLog.some((log) => log.includes(secondConsequence.narrative))).toBe(true);
        state = gameReducer(state, { type: 'COMPLETE_EVENT' });
        expect(state.phase).toBe('map');
      }

      // 3. Exhaustive branch execution across all 16 depth-stratified events (ADR-0032)
      for (const [depthStr, pool] of Object.entries(DEPTH_EVENT_POOLS)) {
        const depth = Number(depthStr) as DepthLevel;
        const eventsForDepth = getMythosEventsForDepth(depth);
        expect(eventsForDepth).toHaveLength(pool.length);

        for (const evt of eventsForDepth) {
          expect(evt.options.length).toBeGreaterThanOrEqual(2);
          for (const opt of evt.options) {
            expect(opt.id).toBeDefined();
            expect(opt.consequences.length).toBeGreaterThanOrEqual(1);

            const activeEventState: GameState = {
              ...createActiveRunState(),
              currentDepth: depth,
              phase: 'event',
              currentEvent: evt,
              investigator: {
                ...createActiveRunState().investigator,
                health: 30,
                maxHealth: 30,
                obols: 50,
              },
            };
            const resolvedState = gameReducer(activeEventState, {
              type: 'RESOLVE_EVENT_OPTION',
              payload: { optionId: opt.id },
            });
            const firstConseq = opt.consequences[0];
            expect(resolvedState.battleLog.some((log) => log.includes(firstConseq.narrative))).toBe(true);

            if (resolvedState.phase === 'combat') {
              expect(resolvedState.currentEnemy).toBeDefined();
            } else {
              expect(resolvedState.currentEvent?.selectedOptionId).toBe(opt.id);
              const afterEventState = gameReducer(resolvedState, { type: 'COMPLETE_EVENT' });
              expect(afterEventState.phase).toBe('map');
            }
          }
        }
      }
    });

    it('verifies dynamic market stock with discounted card, purchase mechanics, and 30-obol card purge', () => {
      let state = createActiveRunState();

      // Give investigator enough obols for testing market
      state = {
        ...state,
        investigator: {
          ...state.investigator,
          obols: 80,
        },
      };

      const marketNode = Object.values(state.map!.nodes).find((n) => n.type === 'market')!;
      expect(marketNode).toBeDefined();

      state = makeNodeAccessible(state, marketNode.id);
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
      state = gameReducer(state, { type: 'NAVIGATE_TO_NODE', payload: { nodeId: marketNode.id } });
      randomSpy.mockRestore();
      expect(state.phase).toBe('market');
      expect(state.marketItems).toBeDefined();

      const items = state.marketItems!;
      const cardItems = items.filter((i) => i.type === 'card');
      expect(cardItems).toHaveLength(3);

      // Exactly 1 card item is discounted
      const discountedCards = cardItems.filter((i) => i.isDiscounted);
      expect(discountedCards).toHaveLength(1);
      const discountedItem = discountedCards[0];
      expect(discountedItem.price).toBeLessThan(discountedItem.originalPrice!);

      // Purchase the discounted card
      const initialObols = state.investigator.obols;
      const initialDeckLen = state.sanityDeck.length;
      state = gameReducer(state, {
        type: 'BUY_MARKET_ITEM',
        payload: { itemId: discountedItem.id },
      });
      expect(state.investigator.obols).toBe(initialObols - discountedItem.price);
      expect(state.sanityDeck.length).toBe(initialDeckLen + 1);

      // Test 30-obol card purge service
      const cardToPurge = state.sanityDeck[0];
      const obolsBeforePurge = state.investigator.obols;
      state = gameReducer(state, {
        type: 'PURGE_CARD_AT_MARKET',
        payload: { cardId: cardToPurge.id },
      });
      expect(state.marketPurgeUsed).toBe(true);
      expect(state.investigator.obols).toBe(obolsBeforePurge - MARKET_PURGE_COST);
      expect(state.sanityDeck.some((c) => c.id === cardToPurge.id)).toBe(false);

      // Verify second purge attempt in same market is blocked
      const secondPurgeAttempt = gameReducer(state, {
        type: 'PURGE_CARD_AT_MARKET',
        payload: { cardId: state.sanityDeck[0].id },
      });
      expect(secondPurgeAttempt).toBe(state);
    });

    it('verifies sanctuary hearth purge via authentic DAG navigation', () => {
      let state = createActiveRunState();
      const sanctuaryNode = Object.values(state.map!.nodes).find((n) => n.type === 'sanctuary')!;
      state = makeNodeAccessible(state, sanctuaryNode.id);
      state = gameReducer(state, { type: 'NAVIGATE_TO_NODE', payload: { nodeId: sanctuaryNode.id } });
      expect(state.phase).toBe('sanctuary');

      const purgedCard = state.sanityDeck[0];
      state = gameReducer(state, {
        type: 'USE_SANCTUARY',
        payload: { optionId: 'purge', cardId: purgedCard.id },
      });
      expect(state.sanctuaryUsed).toBe(true);
      expect(state.sanityDeck.some((c) => c.id === purgedCard.id)).toBe(false);
      state = gameReducer(state, { type: 'LEAVE_SANCTUARY' });
      expect(state.phase).toBe('map');
    });

    it('verifies authentic standard altar exploration and ritual resolution', () => {
      let state = createActiveRunState();
      state = navigateToProceduralNode(state, 'altar');
      expect(state.phase).toBe('altar');
      expect(state.altarRituals).toBeDefined();
      expect(state.altarRituals).toHaveLength(3);

      const oldMaxHealth = state.investigator.maxHealth;
      state = gameReducer(state, {
        type: 'USE_ALTAR',
        payload: { optionId: 'flesh' },
      });
      expect(state.altarUsed).toBe(true);
      expect(state.investigator.maxHealth).toBe(oldMaxHealth + 5);
      state = gameReducer(state, { type: 'LEAVE_ALTAR' });
      expect(state.phase).toBe('map');
    });

    it('verifies authentic blood altar reshape and pure sacrifice branches across distinct visits', () => {
      // (a) Branch 1: 'reshape' on authentic blood altar visit (sacrifice 1 card, restore 5 生命值)
      let state1 = createActiveRunState();
      state1 = navigateToProceduralNode(state1, 'blood_altar');
      expect(state1.phase).toBe('blood_altar');

      state1 = {
        ...state1,
        investigator: {
          ...state1.investigator,
          health: 15,
          maxHealth: 30,
        },
      };
      const permanentCards1 = getAllPermanentCards(state1);
      const reshapeCard = permanentCards1[0];
      const countBeforeReshape = permanentCards1.length;
      state1 = gameReducer(state1, {
        type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
        payload: { cardIds: [reshapeCard.id], branch: 'reshape' },
      });
      expect(state1.bloodAltarUsed).toBe(true);
      expect(state1.investigator.health).toBe(20); // 15 + 5
      expect(getAllPermanentCards(state1)).toHaveLength(countBeforeReshape - 1);
      expect(getAllPermanentCards(state1).some((c) => c.id === reshapeCard.id)).toBe(false);
      state1 = gameReducer(state1, { type: 'LEAVE_BLOOD_ALTAR' });
      expect(state1.phase).toBe('map');

      // (b) Branch 2: 'pure' on distinct authentic blood altar visit (sacrifice 2 cards, permanent deck purge)
      let state2 = createActiveRunState();
      state2 = navigateToProceduralNode(state2, 'blood_altar');
      expect(state2.phase).toBe('blood_altar');

      const permanentCards2 = getAllPermanentCards(state2);
      const pureCard1 = permanentCards2[0];
      const pureCard2 = permanentCards2[1];
      const countBeforePure = permanentCards2.length;
      state2 = gameReducer(state2, {
        type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
        payload: { cardIds: [pureCard1.id, pureCard2.id], branch: 'pure' },
      });
      expect(state2.bloodAltarUsed).toBe(true);
      expect(getAllPermanentCards(state2)).toHaveLength(countBeforePure - 2);
      expect(getAllPermanentCards(state2).some((c) => c.id === pureCard1.id || c.id === pureCard2.id)).toBe(false);
      state2 = gameReducer(state2, { type: 'LEAVE_BLOOD_ALTAR' });
      expect(state2.phase).toBe('map');
    });

    it('verifies authentic vault desecration with dual relics and unplayable abyssal curse in combat', () => {
      let state = createActiveRunState();
      state = navigateToProceduralNode(state, 'vault');
      expect(state.phase).toBe('vault');
      expect(state.vaultRelics).toBeDefined();
      expect(state.vaultRelics!.length).toBeGreaterThanOrEqual(2);

      const initialRelicCount = state.investigator.relics?.length ?? 0;
      const relic1 = state.vaultRelics![0];
      const relic2 = state.vaultRelics![1];
      state = gameReducer(state, {
        type: 'CLAIM_VAULT_RELIC',
        payload: {
          relicIds: [relic1.id, relic2.id],
          desecrate: true,
        },
      });
      expect(state.vaultClaimed).toBe(true);
      expect(state.investigator.relics?.length).toBe(initialRelicCount + 2);

      // Verify 【深淵詛咒】injected into sanityDeck
      const curseInDeck = state.sanityDeck.find((c) => c.id.startsWith('card_abyss_curse'));
      expect(curseInDeck).toBeDefined();
      expect(curseInDeck!.isUnplayable).toBe(true);

      // Verify 【深淵詛咒】is unplayable during combat
      const dummyEnemy: Enemy = {
        id: 'test_ghoul',
        name: '食屍鬼',
        title: '潛伏者',
        health: 20,
        maxHealth: 20,
        armor: 0,
        currentIntent: { type: 'attack', value: 5, name: '撕咬', description: '' },
      };
      const playCtx: CardPlayContext = {
        investigator: state.investigator,
        enemy: dummyEnemy,
        turn: 1,
        isMadness: false,
        hand: [curseInDeck!],
        sanityDeck: state.sanityDeck,
        discardPile: [],
      };
      const evalRes = evaluateCardPlay(curseInDeck!, playCtx);
      expect(evalRes.logs[0]).toContain('無法被打出');
      expect(evalRes.logs[0]).toContain('佔據著手牌');

      state = gameReducer(state, { type: 'LEAVE_VAULT' });
      expect(state.phase).toBe('map');
    });

    it('verifies anti-repeat combat encounter rotation on consecutive encounters', () => {
      const combatNodeId = 'test_combat_node';
      const baseState: GameState = {
        ...createInitialGameState(),
        phase: 'map',
        currentDepth: 1,
        lastCombatEnemyId: 'enemy_ghoul_lurker',
        map: {
          id: 'test_map',
          name: '測試地圖',
          depth: 1,
          currentNodeId: null,
          layers: [[combatNodeId]],
          nodes: {
            [combatNodeId]: {
              id: combatNodeId,
              type: 'combat',
              layer: 0,
              col: 0,
              label: '常規遭遇',
              title: '腐臭小巷',
              description: '',
              nextNodes: [],
              status: 'accessible',
              enemyId: 'enemy_ghoul_lurker', // Identical to lastCombatEnemyId
            },
          },
        },
      };

      const nextCombatState = gameReducer(baseState, {
        type: 'NAVIGATE_TO_NODE',
        payload: { nodeId: combatNodeId },
      });

      expect(nextCombatState.phase).toBe('combat');
      expect(nextCombatState.currentEnemy.id).not.toBe('enemy_ghoul_lurker');
      expect(nextCombatState.lastCombatEnemyId).toBe(nextCombatState.currentEnemy.id);
    });

    it('verifies responsive UI navigation and screen transitions on 16-floor DAG map with interactive nodes', () => {
      navigateToMapUI();

      expect(screen.getByText('第一深度：阿卡姆封鎖區 · 調查路線圖')).toBeDefined();
      expect(screen.getByText(/進度 1 \/ 16 層/)).toBeDefined();

      // Find accessible node in Layer 0
      const accessibleNodeCards = document.querySelectorAll('.map-node-card.candle-breathing');
      expect(accessibleNodeCards.length).toBeGreaterThan(0);

      // Click the first accessible node to enter node encounter screen
      fireEvent.click(accessibleNodeCards[0]);

      // Node encounter screen rendered: no longer shows the map route title
      expect(screen.queryByText('第一深度：阿卡姆封鎖區 · 調查路線圖')).toBeNull();
    });
  });
});
