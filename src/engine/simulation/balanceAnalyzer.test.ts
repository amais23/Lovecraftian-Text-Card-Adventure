import { describe, it, expect } from 'vitest';
import {
  calculateHealthScore,
  calculateSanityScore,
  calculateOverallScore,
  getTierRating,
  createCardBalanceReport,
  createRelicBalanceReport,
  createEnemyThreatReport,
} from './balanceAnalyzer';
import { buildArchetypeDeck, ARCHETYPE_DEFINITIONS } from './archetypes';
import { getRepresentativeEnemies } from './balanceSampler';
import { POCKET_WATCH } from '../relics';
import type { Card, Enemy } from '../../types/game';

describe('Balance Analyzer & Orthogonal Sampler (Issue #64)', () => {
  const dummyCard: Card = {
    id: 'test_card_1',
    name: '測試戰鬥卡',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 10 }],
    description: '造成 10 點傷害。',
    flavorText: '',
  };

  const dummyEnemy: Enemy = {
    id: 'test_enemy_1',
    name: '測試食屍鬼',
    title: '食屍鬼僕從',
    health: 20,
    maxHealth: 20,
    armor: 0,
    currentIntent: { type: 'attack', value: 8, name: '撕咬', description: '' },
  };

  describe('Scoring & Tier Normalization', () => {
    it('correctly maps overall score to tier rating (S, A, B, C, D)', () => {
      expect(getTierRating(90)).toBe('S');
      expect(getTierRating(85)).toBe('S');
      expect(getTierRating(75)).toBe('A');
      expect(getTierRating(65)).toBe('B');
      expect(getTierRating(50)).toBe('C');
      expect(getTierRating(30)).toBe('D');
    });

    it('clamps health and sanity scores within 0 ~ 100', () => {
      // 100% win rate, 0 hp lost -> 100
      expect(calculateHealthScore(1.0, 0)).toBe(100);
      // 0% win rate, massive hp lost -> 0
      expect(calculateHealthScore(0.0, 50)).toBe(0);

      // 100% win rate, 0 sanity expended -> 100
      expect(calculateSanityScore(1.0, 0)).toBe(100);
      // 0% win rate, massive sanity lost -> 0
      expect(calculateSanityScore(0.0, 30)).toBe(0);
    });

    it('evaluates healthScore directly by health lost in uncapped health mode', () => {
      // 0 health lost = 100
      expect(calculateHealthScore(1.0, 0, 25, true)).toBe(100);
      // 0.6 health lost differentiates from 0 (98)
      expect(calculateHealthScore(1.0, 0.6, 25, true)).toBe(98);
      // 2.5 health lost does not plateau at 100 (84)
      expect(calculateHealthScore(1.0, 2.5, 25, true)).toBe(84);
      // 7.0 health lost = 50 (midpoint benchmark for 35 enemies with bosses)
      expect(calculateHealthScore(1.0, 7.0, 25, true)).toBe(50);
      // 10.0 health lost = 36
      expect(calculateHealthScore(1.0, 10, 25, true)).toBe(36);
      // 25 health lost does not immediately hit 0 due to max hp scaling in roguelike (~12)
      expect(calculateHealthScore(1.0, 25, 25, true)).toBe(12);
      // 50 health lost retains a small survival rating (~4)
      expect(calculateHealthScore(1.0, 50, 25, true)).toBe(4);
      // 100+ health lost smoothly approaches 0
      expect(calculateHealthScore(1.0, 120, 25, true)).toBeLessThanOrEqual(2);
    });

    it('evaluates sanityScore directly by mental strain in uncapped health mode', () => {
      // 0 ~ 1.0 sanity expended = 100 ~ 98
      expect(calculateSanityScore(1.0, 0, 15, true)).toBe(100);
      expect(calculateSanityScore(1.0, 1.0, 15, true)).toBe(98);
      // 3.0 sanity expended = 79
      expect(calculateSanityScore(1.0, 3.0, 15, true)).toBe(79);
      // 5.5 sanity expended = 50 (midpoint benchmark for 3-turn battle baseline)
      expect(calculateSanityScore(1.0, 5.5, 15, true)).toBe(50);
      // 10.0 sanity expended = 21
      expect(calculateSanityScore(1.0, 10.0, 15, true)).toBe(21);
      // 25.0+ sanity expended smoothly approaches 0
      expect(calculateSanityScore(1.0, 25, 15, true)).toBeLessThanOrEqual(5);
    });

    it('calculates overall score combining health, sanity, and fault tolerance ratio', () => {
      const overall = calculateOverallScore(80, 70, 0.9);
      expect(overall).toBeGreaterThanOrEqual(0);
      expect(overall).toBeLessThanOrEqual(100);
      // 80*0.5 (40) + 70*0.35 (24.5) + 0.9*15 (13.5) = 78
      expect(overall).toBe(78);

      // Uncapped mode: (80*0.75 + 70*0.25) * (0.85 + 0.15*0.9) = 77.5 * 0.985 = 76
      const overallUncapped = calculateOverallScore(80, 70, 0.9, true);
      expect(overallUncapped).toBe(76);
    });
  });

  describe('Card Balance Report Assembly', () => {
    it('assembles a full card report with 1x, 2x, 3x duplicate curve and 6 archetype synergies', () => {
      const report = createCardBalanceReport({
        card: dummyCard,
        base1xMetrics: { winRate: 0.6, avgHealthLost: 6.0, avgSanityExpended: 3.5, avgTurns: 4.2 },
        base2xMetrics: { winRate: 0.75, avgHealthLost: 4.0, avgSanityExpended: 2.8, avgTurns: 3.8 },
        base3xMetrics: { winRate: 0.85, avgHealthLost: 2.5, avgSanityExpended: 2.2, avgTurns: 3.2 },
        faultToleranceRatio: 0.85,
        archetypeWinRates: {
          armor_counter: 0.5,
          bleed_pierce: 0.9, // strong synergy
          truth_restore: 0.6,
          madness_sacrifice: 0.65,
          high_cost_magic: 0.55,
          status_attrition: 0.7,
        },
        enemyMatchups: [
          { id: 'ghoul', name: '食屍鬼', winRate: 0.8 },
          { id: 'cultist', name: '異教徒', winRate: 0.7 },
          { id: 'boss', name: '深淵祭司', winRate: 0.3 },
        ],
      });

      expect(report.id).toBe(dummyCard.id);
      expect(report.name).toBe(dummyCard.name);
      expect(report.healthScore).toBeGreaterThan(0);
      expect(report.sanityScore).toBeGreaterThan(0);
      expect(report.overallScore).toBeGreaterThan(0);

      // Verify copiesCurve progression
      expect(report.copiesCurve[1].overallScore).toBeLessThanOrEqual(report.copiesCurve[2].overallScore);
      expect(report.copiesCurve[2].overallScore).toBeLessThanOrEqual(report.copiesCurve[3].overallScore);

      // Verify archetype synergies
      expect(report.synergyMultipliers.bleed_pierce).toBeGreaterThan(1.0);
      expect(report.bestArchetype).toBe('bleed_pierce');

      // Verify favorable/unfavorable enemies
      expect(report.favorableEnemies[0].id).toBe('ghoul');
      expect(report.unfavorableEnemies[0].id).toBe('boss');
    });
  });

  describe('Relic Balance Report Assembly', () => {
    it('assembles a full relic report evaluating 0 to 3 copies and marginal benefit', () => {
      const report = createRelicBalanceReport({
        relic: POCKET_WATCH,
        copiesMetrics: {
          0: { winRate: 0.5, avgHealthLost: 8.0, avgSanityExpended: 5.0 },
          1: { winRate: 0.65, avgHealthLost: 6.0, avgSanityExpended: 4.0 },
          2: { winRate: 0.78, avgHealthLost: 4.5, avgSanityExpended: 3.2 },
          3: { winRate: 0.88, avgHealthLost: 3.0, avgSanityExpended: 2.5 },
        },
      });

      expect(report.id).toBe(POCKET_WATCH.id);
      expect(report.copiesCurve[0].score).toBeLessThan(report.copiesCurve[1].score);
      expect(report.copiesCurve[1].score).toBeLessThan(report.copiesCurve[2].score);
      expect(report.marginalBenefitPerStack).toBeGreaterThan(0);
    });
  });

  describe('Enemy Threat Report Assembly', () => {
    it('assembles an enemy threat report computing threatScore and archetype vulnerability', () => {
      const report = createEnemyThreatReport({
        enemy: dummyEnemy,
        depth: 1,
        role: 'normal',
        investigatorWinRate: 0.4,
        avgInvestigatorHealthLost: 12.0,
        avgSanityEroded: 5.0,
        avgCombatDurationTurns: 5.5,
        counteredByCards: [
          { id: 'shotgun', name: '雙管獵槍', winRate: 0.75 },
          { id: 'cover', name: '就地掩蔽', winRate: 0.7 },
        ],
        archetypePerformances: {
          armor_counter: 0.65, // strong vs this enemy
          bleed_pierce: 0.5,
          truth_restore: 0.4,
          madness_sacrifice: 0.2, // weak vs this enemy
          high_cost_magic: 0.35,
          status_attrition: 0.45,
        },
      });

      expect(report.id).toBe(dummyEnemy.id);
      expect(report.threatScore).toBeGreaterThan(0);
      expect(report.counteredByCards[0].id).toBe('shotgun');
      expect(report.vulnerableArchetype).toBe('armor_counter');
      expect(report.dangerousArchetype).toBe('madness_sacrifice');
    });

    it('assembles an enemy threat report in uncapped health mode driven by investigator health loss', () => {
      const deadlyBossReport = createEnemyThreatReport({
        enemy: dummyEnemy,
        depth: 4,
        role: 'boss',
        investigatorWinRate: 1.0,
        avgInvestigatorHealthLost: 120.0,
        avgSanityEroded: 15.0,
        avgCombatDurationTurns: 12.0,
        counteredByCards: [
          { id: 'shield', name: '大盾', winRate: 1.0 },
        ],
        archetypePerformances: {
          armor_counter: 1.0,
          bleed_pierce: 1.0,
          truth_restore: 1.0,
          madness_sacrifice: 1.0,
          high_cost_magic: 1.0,
          status_attrition: 1.0,
        },
        archetypeHealthLosses: {
          armor_counter: 60.0, // lowest damage taken -> vulnerable
          bleed_pierce: 100.0,
          truth_restore: 110.0,
          madness_sacrifice: 150.0, // highest damage taken -> dangerous
          high_cost_magic: 120.0,
          status_attrition: 90.0,
        },
        isUncappedHealth: true,
      });

      // 120 damage / 120 * 75 (75) + 15 sanity / 15 * 25 (25) = 100
      expect(deadlyBossReport.threatScore).toBe(100);
      expect(deadlyBossReport.vulnerableArchetype).toBe('armor_counter');
      expect(deadlyBossReport.dangerousArchetype).toBe('madness_sacrifice');
    });
  });

  describe('Representative Enemies & Archetypes Deck Generation', () => {
    it('provides exactly 35 representative enemies spanning depths 1~4', () => {
      const list = getRepresentativeEnemies();
      expect(list.length).toBe(35);
      const depths = new Set(list.map((item) => item.depth));
      expect(depths.has(1)).toBe(true);
      expect(depths.has(2)).toBe(true);
      expect(depths.has(3)).toBe(true);
      expect(depths.has(4)).toBe(true);
    });

    it('builds decks for all 6 canonical archetypes without error and ensures unique card IDs', () => {
      for (const archId of Object.keys(ARCHETYPE_DEFINITIONS) as Array<keyof typeof ARCHETYPE_DEFINITIONS>) {
        const deck = buildArchetypeDeck(archId);
        expect(deck.length).toBeGreaterThan(10);
        const ids = new Set(deck.map((c) => c.id));
        expect(ids.size).toBe(deck.length);
      }
    });
  });
});
