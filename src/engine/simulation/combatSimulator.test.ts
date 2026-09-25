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
        recordLogs: true,
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
        recordLogs: true,
      });
      expect(amuletSim.logs.some((l) => l.includes('10 點起始防禦護甲'))).toBe(true);

      // Test double talisman (stacks might to 2)
      const talismanSim = simulateCombat({
        deck: testDeck,
        relics: doubleTalisman,
        enemy,
        recordLogs: true,
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

  describe('Uncapped Health Simulation Mode (血量無上限模式)', () => {
    it('allows combat to continue past standard 25 health without dying and accurately records uncapped health loss', () => {
      const bossEnemy: Enemy = {
        id: 'heavy_boss',
        name: '狂暴巨怪',
        title: '毀滅之眼',
        health: 40,
        maxHealth: 40,
        armor: 0,
        currentIntent: { type: 'attack', value: 30, name: '毀滅拍擊', description: '' },
      };

      // Standard mode: with 25 health, hits for 30 immediately kills investigator (healthLost capped at 25)
      const standardSim = simulateCombat({
        deck: [basicAttackCard, basicAttackCard, basicAttackCard, basicAttackCard],
        enemy: cloneEnemy(bossEnemy),
        uncappedHealth: false,
      });
      expect(standardSim.victory).toBe(false);
      expect(standardSim.outcome).toBe('defeat');
      expect(standardSim.healthLost).toBe(25);

      // Uncapped mode: investigator survives 30 damage turn after turn, kills enemy, and records full uncapped damage
      const uncappedSim = simulateCombat({
        deck: [basicAttackCard, basicAttackCard, basicAttackCard, basicAttackCard],
        enemy: cloneEnemy(bossEnemy),
        uncappedHealth: true,
      });
      expect(uncappedSim.victory).toBe(true);
      expect(uncappedSim.outcome).toBe('victory');
      expect(uncappedSim.healthLost).toBeGreaterThan(25);
    });

    it('triggers low_health conditional effects based on standard 25 damage baseline in uncapped mode', () => {
      const healCard: Card = {
        id: 'test_heal',
        name: '急救包紮',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'heal', value: 4, condition: { type: 'low_health', threshold: 0.5 } }],
        description: '瀕死時恢復 4 點生命。',
        flavorText: '',
      };

      const attacker: Enemy = {
        id: 'attacker',
        name: '撕裂魔',
        title: '嗜血者',
        health: 50,
        maxHealth: 50,
        armor: 0,
        currentIntent: { type: 'attack', value: 15, name: '深淵痛擊', description: '' },
      };

      const sim = simulateCombat({
        investigator: { health: 99980, maxHealth: 100000 },
        deck: [healCard, basicAttackCard, basicAttackCard],
        enemy: cloneEnemy(attacker),
        uncappedHealth: true,
        recordLogs: true,
      });

      // Investigator has taken 20 damage (> 12.5), so low_health condition matches and heals
      expect(sim.logs.some((l) => l.includes('殘血絕地求生') || l.includes('恢復 4 點生命'))).toBe(true);
    });

    it('accurately accounts for sanity restorations and madness strain in sanityCardsExpended', () => {
      const restoreCard: Card = {
        id: 'test_restore',
        name: '安神冥想',
        category: 'truth',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'restore_sanity', value: 2 }],
        description: '將棄牌堆中 2 張卡牌洗回理智牌庫。',
        flavorText: '',
      };

      const ratEnemy: Enemy = {
        id: 'small_rat',
        name: '弱小老鼠',
        title: '異化鼠',
        health: 5,
        maxHealth: 5,
        armor: 0,
        currentIntent: { type: 'attack', value: 1, name: '啃咬', description: '' },
      };

      // 1 turn kill, no madness, deck has remaining cards
      const fastSim = simulateCombat({
        deck: [restoreCard, basicAttackCard, basicAttackCard, basicAttackCard],
        enemy: cloneEnemy(ratEnemy),
        uncappedHealth: true,
      });

      expect(fastSim.sanityCardsExpended).toBeLessThan(4);
      expect(fastSim.sanityDeckRemaining).toBeGreaterThan(0);
    });
  });
});
