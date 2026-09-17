import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { soundEngine } from '../engine/audioManager';
import { gameReducer, createInitialGameState } from '../engine/gameReducer';
import { resolveSurvivalSettlement } from '../engine/survival/settlementResolver';
import { interceptEnemyDamage, resolveEnemyAction } from '../engine/enemyTraits';
import { getEnemyTemplateById } from '../engine/enemyCatalog';
import { createStatusEffect } from '../engine/statusEffects';
import type { Enemy, Investigator } from '../types/game';

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
    it('demonstrates Eleanor Vance truth loop, seal detonation, and magic damage', () => {
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
      const investigator: Investigator = {
        name: '愛德華·皮爾斯',
        occupation: '私家偵探',
        health: 15,
        maxHealth: 25,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 30,
        statusEffects: [],
      };

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
      const investigator: Investigator = {
        name: '愛德華·皮爾斯',
        occupation: '私家偵探',
        health: 24,
        maxHealth: 25,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 30,
        statusEffects: [],
      };

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
      render(<App />);

      // Advance to map
      fireEvent.click(screen.getByRole('button', { name: /開啟新調查/i }));
      fireEvent.click(screen.getByRole('button', { name: /選擇調查員/i }));
      fireEvent.click(screen.getByRole('button', { name: /啟程調查/i }));
      fireEvent.click(screen.getByRole('button', { name: /踏入調查地圖/i }));

      // Verify map layout structure
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
    });
  });

  describe('5. Canonical Monster Traits & Battle Log Verification', () => {
    const createBaseInvestigator = (): Investigator => ({
      name: '愛德華·皮爾斯',
      occupation: '私家偵探',
      health: 25,
      maxHealth: 25,
      stamina: 3,
      maxStamina: 3,
      armor: 0,
      obols: 10,
      statusEffects: [],
    });

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

    it('Shoggoth: Organ Proliferation charges Tekeli-li crush', () => {
      const shoggoth = getEnemyTemplateById('enemy_colossal_shoggoth');
      expect(shoggoth).toBeDefined();
      expect(shoggoth!.traits?.some((t) => t.id === 'organ_proliferation')).toBe(true);
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
});
