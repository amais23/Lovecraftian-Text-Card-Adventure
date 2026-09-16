import { describe, it, expect } from 'vitest';
import type { Enemy, Investigator } from '../types/game';
import {
  ELDRITCH_TRAIT_DEFINITIONS,
  hasTrait,
  interceptEnemyDamage,
  resolveTurnStartTraits,
  resolveEnemyAction,
  advanceCanonicalIntent,
} from './enemyTraits';
import { createStatusEffect } from './statusEffects';

describe('Enemy Eldritch Traits & Canonical Dynamic AI (Issue #47 / ADR-0026)', () => {
  const createTestEnemy = (overrides: Partial<Enemy> = {}): Enemy => ({
    id: 'test_enemy',
    name: '測試敵怪',
    title: '深淵測試怪',
    health: 30,
    maxHealth: 30,
    armor: 0,
    currentIntent: {
      type: 'attack',
      value: 6,
      name: '普通打擊',
      description: '測試攻擊',
    },
    ...overrides,
  });

  const createTestInvestigator = (overrides: Partial<Investigator> = {}): Investigator => ({
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
  });

  describe('interceptEnemyDamage', () => {
    it('slippery_mucus nullifies physical damage <= 4 completely', () => {
      const deepOne = createTestEnemy({
        traits: [ELDRITCH_TRAIT_DEFINITIONS.slippery_mucus],
      });

      const resSmall = interceptEnemyDamage(deepOne, 4);
      expect(resSmall.modifiedDamage).toBe(0);
      expect(resSmall.logs[0]).toContain('滑膩黏液');

      const resLarge = interceptEnemyDamage(deepOne, 5);
      expect(resLarge.modifiedDamage).toBe(5);
    });

    it('amorphous_body reflects 2 damage back to investigator', () => {
      const spawn = createTestEnemy({
        traits: [ELDRITCH_TRAIT_DEFINITIONS.amorphous_body],
      });

      const res = interceptEnemyDamage(spawn, 8);
      expect(res.modifiedDamage).toBe(8);
      expect(res.reflectedDamageToInvestigator).toBe(2);
      expect(res.logs[0]).toContain('非歐流體');
    });

    it('charging stance increases damage taken by 50%', () => {
      const shoggoth = createTestEnemy({
        shoggothStance: 'charging',
        traits: [ELDRITCH_TRAIT_DEFINITIONS.organ_proliferation],
      });

      const res = interceptEnemyDamage(shoggoth, 10);
      expect(res.modifiedDamage).toBe(15);
      expect(res.logs[0]).toContain('蓄力破綻');
    });

    it('zealous_blood_oath stacks 1 might per 6 accumulated HP damage taken', () => {
      const cultist = createTestEnemy({
        armor: 2,
        traits: [ELDRITCH_TRAIT_DEFINITIONS.zealous_blood_oath],
      });

      // 8 damage against 2 armor = 6 HP damage -> 1 might
      const res = interceptEnemyDamage(cultist, 8);
      expect(res.newEnemyStatusEffects.find((s) => s.type === 'might')?.stacks).toBe(1);
    });
  });

  describe('resolveTurnStartTraits', () => {
    it('waterlogged_grip inflicts 1 horror on investigator at turn start', () => {
      const drowned = createTestEnemy({
        traits: [ELDRITCH_TRAIT_DEFINITIONS.waterlogged_grip],
      });
      const inv = createTestInvestigator();

      const res = resolveTurnStartTraits(drowned, inv);
      expect(res.investigatorStatusEffects.find((s) => s.type === 'horror')?.stacks).toBe(1);
      expect(res.logs[0]).toContain('水下寒骨');
    });

    it('processes reduced draw count and drained stamina', () => {
      const enemy = createTestEnemy();
      const inv = createTestInvestigator({
        reducedDrawNextTurn: 1,
        drainedStaminaNextTurn: 1,
      });

      const res = resolveTurnStartTraits(enemy, inv);
      expect(res.reducedDrawCount).toBe(1);
      expect(res.drainedStaminaCount).toBe(1);
    });
  });

  describe('resolveEnemyAction', () => {
    it('enrages attacks by +50% at turn >= 6 (Anti-Stall Enrage)', () => {
      const enemy = createTestEnemy({
        currentIntent: {
          type: 'attack',
          value: 10,
          name: '猛擊',
          description: '攻擊 10',
        },
      });
      const inv = createTestInvestigator();

      // Turn 5: normal 10
      const resT5 = resolveEnemyAction(enemy, enemy.currentIntent, inv, 5);
      expect(resT5.damageToInvestigator).toBe(10);

      // Turn 6: enraged 10 * 1.5 = 15
      const resT6 = resolveEnemyAction(enemy, enemy.currentIntent, inv, 6);
      expect(resT6.damageToInvestigator).toBe(15);
      expect(resT6.logs[0]).toContain('深淵狂暴');
    });

    it('carrion_feeder heals enemy by 50% of damage dealt when investigator is bleeding', () => {
      const ghoul = createTestEnemy({
        traits: [ELDRITCH_TRAIT_DEFINITIONS.carrion_feeder],
      });
      const bleedingInv = createTestInvestigator({
        statusEffects: [createStatusEffect('bleed', 2)],
      });

      const res = resolveEnemyAction(ghoul, ghoul.currentIntent, bleedingInv, 1);
      expect(res.damageToInvestigator).toBe(6);
      expect(res.healToEnemy).toBe(3); // 50% of 6
      expect(res.logs[0]).toContain('食腐本能');
    });

    it('faceless_terror gains 6 armor after erode attack', () => {
      const nightgaunt = createTestEnemy({
        traits: [ELDRITCH_TRAIT_DEFINITIONS.faceless_terror],
        currentIntent: {
          type: 'erode',
          value: 2,
          name: '無面凝視',
          description: '侵蝕 2',
        },
      });
      const inv = createTestInvestigator();

      const res = resolveEnemyAction(nightgaunt, nightgaunt.currentIntent, inv, 1);
      expect(res.erodeToInvestigator).toBe(2);
      expect(res.armorGainToEnemy).toBe(6);
      expect(res.logs[0]).toContain('陰影滑翔');
    });

    it('tide_of_dagon gains tidal armor on odd turns and explodes tidal damage on even turns, consuming armor', () => {
      const dagon = createTestEnemy({
        armor: 14,
        traits: [ELDRITCH_TRAIT_DEFINITIONS.tide_of_dagon],
      });
      const inv = createTestInvestigator();

      // Turn 1 (Odd): High Tide
      const resT1 = resolveEnemyAction(dagon, { type: 'defend', value: 0, name: '潮汐蓄力', description: '' }, inv, 1);
      expect(resT1.armorGainToEnemy).toBe(14);

      // Turn 2 (Even): Ebb Tide -> remaining 14 armor converted to damage and consumed
      const resT2 = resolveEnemyAction(dagon, { type: 'attack', value: 0, name: '潮退', description: '' }, inv, 2);
      expect(resT2.damageToInvestigator).toBe(14);
      expect(resT2.armorLossToEnemy).toBe(14);
      expect(resT2.logs[0]).toContain('海嘯');
    });

    it('divine_immortality injects madness card into investigator deck every 2 turns', () => {
      const starSpawn = createTestEnemy({
        traits: [ELDRITCH_TRAIT_DEFINITIONS.divine_immortality],
      });
      const inv = createTestInvestigator();

      // Turn 2 (Even): injects madness card
      const resT2 = resolveEnemyAction(starSpawn, { type: 'attack', value: 10, name: '星辰握擊', description: '' }, inv, 2);
      expect(resT2.madnessCardsToDeck).toBeDefined();
      expect(resT2.madnessCardsToDeck?.length).toBe(1);
      expect(resT2.madnessCardsToDeck?.[0].name).toBe('星辰碎裂之囈語');
      expect(resT2.madnessCardsToDeck?.[0].category).toBe('madness');
      expect(resT2.logs.some((l) => l.includes('星辰碎裂之囈語'))).toBe(true);

      // Turn 1 (Odd): does not inject
      const resT1 = resolveEnemyAction(starSpawn, { type: 'attack', value: 10, name: '星辰握擊', description: '' }, inv, 1);
      expect(resT1.madnessCardsToDeck).toBeUndefined();
    });

    it('ossuary_summoning gains 10 bone armor every 3 turns and inflicts vulnerable on break', () => {
      const ghoulPriest = createTestEnemy({
        armor: 10,
        traits: [ELDRITCH_TRAIT_DEFINITIONS.ossuary_summoning],
      });
      const inv = createTestInvestigator();

      // Turn 1 (1 % 3 === 1): gains 10 armor
      const resT1 = resolveEnemyAction(ghoulPriest, { type: 'attack', value: 8, name: '權杖重擊', description: '' }, inv, 1);
      expect(resT1.armorGainToEnemy).toBe(10);
      expect(resT1.logs.some((l) => l.includes('白骨聚生'))).toBe(true);

      // Breaking bone armor inflicts vulnerable on investigator
      const breakRes = interceptEnemyDamage(ghoulPriest, 12);
      expect(breakRes.statusToInvestigator?.type).toBe('vulnerable');
      expect(breakRes.statusToInvestigator?.stacks).toBe(1);
      expect(breakRes.logs.some((l) => l.includes('屍氣爆裂'))).toBe(true);
    });
  });

  describe('advanceCanonicalIntent', () => {
    it('switches Cultist to blind blood sacrifice when HP <= 40%', () => {
      const cultist = createTestEnemy({
        health: 10,
        maxHealth: 30, // 10/30 = 33% <= 40%
        traits: [ELDRITCH_TRAIT_DEFINITIONS.zealous_blood_oath],
      });

      const { nextIntent } = advanceCanonicalIntent(cultist, 2);
      expect(nextIntent.name).toBe('盲目血祭');
      expect(nextIntent.selfDamage).toBe(4);
      expect(nextIntent.statusType).toBe('bleed');
    });

    it('cycles Shoggoth intents between mutation forms, hide stance, and Tekeli-li crush', () => {
      const shoggoth = createTestEnemy({
        traits: [ELDRITCH_TRAIT_DEFINITIONS.organ_proliferation],
      });

      // Turn 1: eyes
      const t1 = advanceCanonicalIntent(shoggoth, 1);
      expect(t1.newShoggothStance).toBe('eyes');
      expect(t1.nextIntent.type).toBe('erode');

      // Turn 2: claws
      const t2 = advanceCanonicalIntent(shoggoth, 2);
      expect(t2.newShoggothStance).toBe('claws');
      expect(t2.nextIntent.type).toBe('attack');

      // Turn 3: charging
      const t3 = advanceCanonicalIntent(shoggoth, 3);
      expect(t3.nextIntent.isCharge).toBe(true);
      expect(t3.newShoggothStance).toBe('charging');

      // Turn 4: Tekeli-li heavy crush (cycle 0)
      const t4 = advanceCanonicalIntent(shoggoth, 4);
      expect(t4.nextIntent.name).toContain('Tekeli-li');
      expect(t4.nextIntent.value).toBe(20);

      // Turn 6: hide stance
      const t6 = advanceCanonicalIntent(shoggoth, 6);
      expect(t6.newShoggothStance).toBe('hide');
      expect(t6.nextIntent.type).toBe('defend');
      expect(t6.nextIntent.value).toBe(14);
    });

    it('correctly checks enemy traits with hasTrait', () => {
      const deepOne = createTestEnemy({
        traits: [ELDRITCH_TRAIT_DEFINITIONS.slippery_mucus],
      });
      expect(hasTrait(deepOne, 'slippery_mucus')).toBe(true);
      expect(hasTrait(deepOne, 'zealous_blood_oath')).toBe(false);
      expect(hasTrait(undefined, 'slippery_mucus')).toBe(false);
    });
  });
});

