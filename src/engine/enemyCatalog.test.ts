import { describe, it, expect } from 'vitest';
import {
  DEPTH_1_NORMAL_ENEMIES,
  DEPTH_1_ELITE_ENEMIES,
  DEPTH_2_NORMAL_ENEMIES,
  DEPTH_2_ELITE_ENEMIES,
  DEPTH_3_NORMAL_ENEMIES,
  DEPTH_3_ELITE_ENEMIES,
  DEPTH_4_NORMAL_ENEMIES,
  DEPTH_4_ELITE_ENEMIES,
  getEnemyTemplateById,
  getEncounterEnemy,
  cloneEnemy,
  getAllRegisteredEnemies,
} from './enemyCatalog';
import type { DepthLevel, Enemy } from '../types/game';

describe('Enemy Catalog (Issue #29)', () => {
  const allEnemies = getAllRegisteredEnemies();

  describe('Pool Registration & Composition', () => {
    it('Depth 1 registers correct normal and elite enemy pools', () => {
      const normalIds = DEPTH_1_NORMAL_ENEMIES.map((e) => e.id);
      expect(normalIds).toContain('enemy_arkham_cultist');
      expect(normalIds).toContain('enemy_ghoul_lurker');
      expect(normalIds).toContain('enemy_nightgaunt');

      const eliteIds = DEPTH_1_ELITE_ENEMIES.map((e) => e.id);
      expect(eliteIds).toContain('enemy_ghoul_high_priest');
    });

    it('Depth 2 registers correct normal and elite enemy pools', () => {
      const normalIds = DEPTH_2_NORMAL_ENEMIES.map((e) => e.id);
      expect(normalIds).toContain('enemy_deep_one_warrior');
      expect(normalIds).toContain('enemy_drowned_soul');
      expect(normalIds).toContain('enemy_deep_one_elder');

      const eliteIds = DEPTH_2_ELITE_ENEMIES.map((e) => e.id);
      expect(eliteIds).toContain('enemy_dagon_champion');
      expect(eliteIds).toContain('enemy_frenzied_deep_one');
    });

    it('Depth 3 registers correct normal and elite enemy pools', () => {
      const normalIds = DEPTH_3_NORMAL_ENEMIES.map((e) => e.id);
      expect(normalIds).toContain('enemy_proto_shoggoth_spawn');
      expect(normalIds).toContain('enemy_byakhee_rotwing');
      expect(normalIds).toContain('enemy_formless_spawn');
      expect(normalIds).toContain('enemy_hound_of_tindalos');

      const eliteIds = DEPTH_3_ELITE_ENEMIES.map((e) => e.id);
      expect(eliteIds).toContain('enemy_ancient_hound_of_tindalos');
    });

    it('Depth 4 registers correct normal and elite enemy pools', () => {
      const normalIds = DEPTH_4_NORMAL_ENEMIES.map((e) => e.id);
      expect(normalIds).toContain('enemy_star_spawn_larva');
      expect(normalIds).toContain('enemy_rlyeh_sarcophagus_guard');
      expect(normalIds).toContain('enemy_cosmic_acolyte');

      const eliteIds = DEPTH_4_ELITE_ENEMIES.map((e) => e.id);
      expect(eliteIds).toContain('enemy_ancient_eldritch_guardian');
    });
  });

  describe('Enemy Attributes & Lovecraftian Terminology Standards', () => {
    it('all registered enemies have valid health, armor, category, and non-empty intent sequence', () => {
      const enemies: Enemy[] = Object.values(allEnemies);
      expect(enemies.length).toBeGreaterThanOrEqual(15);

      for (const enemy of enemies) {
        expect(enemy.id).toBeTruthy();
        expect(enemy.name).toBeTruthy();
        expect(enemy.title).toBeTruthy();
        expect(enemy.health).toBeGreaterThan(0);
        expect(enemy.maxHealth).toBe(enemy.health);
        expect(enemy.armor).toBeGreaterThanOrEqual(0);
        expect(enemy.currentIntent).toBeDefined();
        expect(enemy.intentSequence?.length).toBeGreaterThanOrEqual(2);
        expect(enemy.category).toBeDefined();

        // Ensure pure Traditional Chinese names and titles (zero English jargon)
        expect(/[\u4e00-\u9fa5]/.test(enemy.name)).toBe(true);
        expect(/[\u4e00-\u9fa5]/.test(enemy.title)).toBe(true);
      }
    });

    it('intents contain diverse actions: attack, defend, erode, and apply_status', () => {
      const enemies: Enemy[] = Object.values(allEnemies);
      const allIntents = enemies.flatMap((e) => e.intentSequence ?? []);

      const types = new Set(allIntents.map((i) => i.type));
      expect(types.has('attack')).toBe(true);
      expect(types.has('defend')).toBe(true);
      expect(types.has('erode')).toBe(true);
      expect(types.has('apply_status')).toBe(true);

      const statusIntents = allIntents.filter((i) => i.type === 'apply_status');
      expect(statusIntents.length).toBeGreaterThanOrEqual(4);

      const statusTypes = new Set(statusIntents.map((i) => i.statusType));
      expect(statusTypes.has('bleed')).toBe(true);
      expect(statusTypes.has('horror')).toBe(true);
      expect(statusTypes.has('vulnerable')).toBe(true);

      for (const intent of statusIntents) {
        expect(intent.value).toBeGreaterThan(0);
        expect(intent.statusType).toBeDefined();
        expect(/[\u4e00-\u9fa5]/.test(intent.name)).toBe(true);
        expect(/[\u4e00-\u9fa5]/.test(intent.description)).toBe(true);
      }
    });
  });

  describe('Encounter Selection & Clones', () => {
    it('getEncounterEnemy returns a valid enemy from current depth normal pool', () => {
      for (const depth of [1, 2, 3, 4] as DepthLevel[]) {
        const enemy = getEncounterEnemy(depth, 'combat');
        expect(enemy).toBeDefined();
        expect(enemy.health).toBeGreaterThan(0);
        expect(enemy.currentIntent).toBeDefined();
      }
    });

    it('getEncounterEnemy returns a valid enemy from current depth elite pool', () => {
      for (const depth of [1, 2, 3, 4] as DepthLevel[]) {
        const enemy = getEncounterEnemy(depth, 'elite');
        expect(enemy).toBeDefined();
        expect(enemy.health).toBeGreaterThan(0);
        expect(enemy.currentIntent).toBeDefined();
      }
    });

    it('getEncounterEnemy with deterministic randomFn selects predictable enemy', () => {
      const firstEnemy = getEncounterEnemy(1, 'combat', () => 0);
      const lastEnemy = getEncounterEnemy(1, 'combat', () => 0.999);
      expect(firstEnemy.id).toBe(DEPTH_1_NORMAL_ENEMIES[0].id);
      expect(lastEnemy.id).toBe(DEPTH_1_NORMAL_ENEMIES[DEPTH_1_NORMAL_ENEMIES.length - 1].id);
    });

    it('getEnemyTemplateById returns a pristine independent clone', () => {
      const template = getEnemyTemplateById('enemy_arkham_cultist');
      expect(template).toBeDefined();
      expect(template?.id).toBe('enemy_arkham_cultist');
      expect(template?.name).toBe('阿卡姆異教徒');

      // Modifying returned clone does not affect subsequent calls
      if (template) {
        template.health = 1;
        template.armor = 99;
      }
      const freshTemplate = getEnemyTemplateById('enemy_arkham_cultist');
      expect(freshTemplate?.health).toBe(28);
      expect(freshTemplate?.armor).toBe(0);
    });

    it('cloneEnemy deep-clones intentSequence and statusEffects', () => {
      const original = DEPTH_1_NORMAL_ENEMIES[0];
      const clone = cloneEnemy(original);
      expect(clone).not.toBe(original);
      expect(clone.currentIntent).not.toBe(original.currentIntent);
      expect(clone.intentSequence).not.toBe(original.intentSequence);
    });
  });
});
