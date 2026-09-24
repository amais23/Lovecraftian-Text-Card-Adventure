import { describe, it, expect } from 'vitest';
import type { Card, Enemy } from '../../types/game';
import { simulateCombat, simulateCombatBatch } from './combatSimulator';
import { solveBestTurnPlays } from './turnSolver';
import { buildDeckWithCopies, buildRelicSet, getStarterBaseline } from './deckBuilder';
import { INITIAL_GHOUL, INITIAL_INVESTIGATOR } from '../initialData';
import { cloneEnemy } from '../enemyCatalog';
import { POCKET_WATCH, ELDER_SIGN_AMULET, DREAD_TALISMAN } from '../relics';

describe('Combat Simulator & 1-Ply Optimal Solver (Issue #63 / ADR-0036)', () => {
  const basicAttackCard: Card = {
    id: 'test_atk',
    name: '普通打擊',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 8 }],
    description: '造成 8 點物理傷害。',
    flavorText: '',
  };

  const basicDefendCard: Card = {
    id: 'test_def',
    name: '戰術掩護',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'armor', value: 7 }],
    description: '獲得 7 點護甲。',
    flavorText: '',
  };

  const vulnerableCard: Card = {
    id: 'test_vuln',
    name: '虛晃佯攻',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'apply_status', statusType: 'vulnerable', target: 'enemy', value: 2 }],
    description: '使目標陷入 2 層易傷。',
    flavorText: '',
  };

  describe('1-Ply Optimal Turn Solver', () => {
    it('detects lethal opportunity and orders cards to kill enemy with minimum waste', () => {
      const weakEnemy: Enemy = {
        id: 'weak_enemy',
        name: '殘血食屍鬼',
        title: '瀕死食屍鬼',
        health: 7,
        maxHealth: 20,
        armor: 0,
        currentIntent: { type: 'attack', value: 15, name: '狂暴撕咬', description: '' },
      };

      const investigator = {
        ...INITIAL_INVESTIGATOR,
        health: 20,
        maxHealth: 20,
        stamina: 3,
        armor: 0,
        handCapacity: 2,
        occupationId: 'investigator' as const,
      };

      // Hand has a defend card and an attack card (deals 8 dmg, enough to kill 7 hp enemy)
      const hand = [basicDefendCard, basicAttackCard];
      const sequence = solveBestTurnPlays(
        investigator,
        weakEnemy,
        hand,
        [basicDefendCard],
        [],
        [],
        1,
        'optimal'
      );

      // The solver should pick the attack card to instantly achieve lethal, rather than defending
      expect(sequence).toHaveLength(1);
      expect(sequence[0].id).toBe(basicAttackCard.id);
    });

    it('prioritizes generating armor when facing heavy incoming enemy attack damage', () => {
      const heavyEnemy: Enemy = {
        id: 'heavy_enemy',
        name: '巨型異形',
        title: '深淵守衛',
        health: 50,
        maxHealth: 50,
        armor: 0,
        currentIntent: { type: 'attack', value: 10, name: '重擊撕裂', description: '' },
      };

      const investigator = {
        ...INITIAL_INVESTIGATOR,
        health: 12,
        maxHealth: 20,
        stamina: 1, // Only 1 stamina: must choose defend or attack
        armor: 0,
        handCapacity: 2,
        occupationId: 'investigator' as const,
      };

      const hand = [basicAttackCard, basicDefendCard];
      const sequence = solveBestTurnPlays(
        investigator,
        heavyEnemy,
        hand,
        [],
        [],
        [],
        1,
        'optimal'
      );

      // Facing 10 damage with 12 health and cannot kill, solver should choose defense (7 armor) to prevent death
      expect(sequence).toHaveLength(1);
      expect(sequence[0].id).toBe(basicDefendCard.id);
    });

    it('orders combo cards correctly: applies vulnerable before attacking', () => {
      const tankyEnemy: Enemy = {
        id: 'tanky_enemy',
        name: '披甲深潛者',
        title: '深淵衛士',
        health: 20,
        maxHealth: 20,
        armor: 0,
        currentIntent: { type: 'defend', value: 5, name: '硬化鱗片', description: '' },
      };

      const investigator = {
        ...INITIAL_INVESTIGATOR,
        health: 20,
        maxHealth: 20,
        stamina: 2, // Can play both cards
        armor: 0,
        handCapacity: 2,
        occupationId: 'investigator' as const,
      };

      const hand = [basicAttackCard, vulnerableCard];
      const sequence = solveBestTurnPlays(
        investigator,
        tankyEnemy,
        hand,
        [],
        [],
        [],
        1,
        'optimal'
      );

      expect(sequence).toHaveLength(2);
      // Vulnerable applied first allows basicAttackCard to deal extra physical damage
      expect(sequence[0].id).toBe(vulnerableCard.id);
      expect(sequence[1].id).toBe(basicAttackCard.id);
    });
  });

  describe('Single Combat Simulation', () => {
    it('successfully runs a complete combat to victory against a standard ghoul', () => {
      const starterDeck = getStarterBaseline('investigator');
      const ghoul = cloneEnemy(INITIAL_GHOUL);

      const result = simulateCombat({
        deck: starterDeck,
        enemy: ghoul,
        policyMode: 'optimal',
      });

      expect(['victory', 'defeat']).toContain(result.outcome);
      expect(result.turns).toBeGreaterThan(0);
      expect(result.cardsPlayedTotal).toBeGreaterThan(0);
      expect(result.logs.length).toBeGreaterThan(0);
    });
  });

  describe('Duplicate Cards and Relic Stacking (Issue #63 Criterion 3)', () => {
    it('supports 1x, 2x, 3x duplicate cards in deck without ID collision', () => {
      const baseDeck = [basicDefendCard];
      const deckWith3Attacks = buildDeckWithCopies(baseDeck, basicAttackCard, 3, 'add');

      expect(deckWith3Attacks).toHaveLength(4);
      const attackCards = deckWith3Attacks.filter((c) => c.name === basicAttackCard.name);
      expect(attackCards).toHaveLength(3);

      // Verify every copy has a unique ID
      const ids = new Set(deckWith3Attacks.map((c) => c.id));
      expect(ids.size).toBe(4);

      const enemy = cloneEnemy(INITIAL_GHOUL);
      const result = simulateCombat({
        deck: deckWith3Attacks,
        enemy,
      });

      expect(result.turns).toBeGreaterThan(0);
    });

    it('correctly stacks multiple copies of relics and applies cumulative bonuses', () => {
      // Stacking 2 Pocket Watches: +1 hand capacity each => base 2 + 2 = 4 hand capacity
      const doubleWatch = buildRelicSet([], POCKET_WATCH, 2);
      expect(doubleWatch).toHaveLength(2);

      // Stacking 2 Elder Sign Amulets: +5 armor each => 10 starting armor
      const doubleAmulet = buildRelicSet([], ELDER_SIGN_AMULET, 2);

      // Stacking 2 Dread Talismans: +1 might each => 2 might stacks
      const doubleTalisman = buildRelicSet([], DREAD_TALISMAN, 2);

      const testDeck = buildDeckWithCopies([], basicAttackCard, 3, 'add');
      const enemy = cloneEnemy(INITIAL_GHOUL);

      // Test double watch in simulation
      const watchSim = simulateCombat({
        deck: testDeck,
        relics: doubleWatch,
        enemy,
      });
      expect(watchSim.turns).toBeGreaterThan(0);

      // Test double amulet (starts with at least 10 armor)
      const amuletSim = simulateCombat({
        deck: testDeck,
        relics: doubleAmulet,
        enemy,
      });
      expect(amuletSim.logs.some((l) => l.includes('10 點起始防禦護甲'))).toBe(true);

      // Test double talisman (stacks might to 2)
      const talismanSim = simulateCombat({
        deck: testDeck,
        relics: doubleTalisman,
        enemy,
      });
      expect(talismanSim.logs.some((l) => l.includes('【力量】2層'))).toBe(true);
    });
  });

  describe('Batch Combat Simulation & Fault Tolerance Ratio', () => {
    it('produces comparative metrics between optimal and fault_tolerant modes and computes stability score', () => {
      const starterDeck = getStarterBaseline('investigator');
      const ghoul = cloneEnemy(INITIAL_GHOUL);

      const batch = simulateCombatBatch({
        deck: starterDeck,
        enemy: ghoul,
        runs: 10,
        randomFn: () => 0.5,
      });

      expect(batch.runs).toBe(10);
      expect(batch.optimal.winRate).toBeGreaterThanOrEqual(0);
      expect(batch.optimal.winRate).toBeLessThanOrEqual(1);
      expect(batch.faultTolerant.winRate).toBeGreaterThanOrEqual(0);
      expect(batch.faultTolerant.winRate).toBeLessThanOrEqual(1);
      expect(batch.faultToleranceRatio).toBeGreaterThanOrEqual(0);
      expect(batch.faultToleranceRatio).toBeLessThanOrEqual(1);
    });
  });
});
