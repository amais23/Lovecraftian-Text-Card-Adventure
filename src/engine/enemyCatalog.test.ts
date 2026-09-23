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

  describe('Pool Registration & Composition (Issue #55)', () => {
    it('Depth 1 registers correct normal and elite enemy pools with expanded canonical monsters', () => {
      const normalIds = DEPTH_1_NORMAL_ENEMIES.map((e) => e.id);
      expect(normalIds).toContain('enemy_arkham_cultist');
      expect(normalIds).toContain('enemy_ghoul_lurker');
      expect(normalIds).toContain('enemy_nightgaunt');
      expect(normalIds).toContain('enemy_walls_rat_swarm');
      expect(normalIds).toContain('enemy_cultist_zealot');
      expect(normalIds).toContain('enemy_cemetery_carrion_worm');
      expect(normalIds.length).toBeGreaterThanOrEqual(6);

      const eliteIds = DEPTH_1_ELITE_ENEMIES.map((e) => e.id);
      expect(eliteIds).toContain('enemy_ghoul_high_priest');
    });

    it('Depth 2 registers correct normal and elite enemy pools with expanded canonical monsters', () => {
      const normalIds = DEPTH_2_NORMAL_ENEMIES.map((e) => e.id);
      expect(normalIds).toContain('enemy_deep_one_warrior');
      expect(normalIds).toContain('enemy_drowned_soul');
      expect(normalIds).toContain('enemy_deep_one_elder');
      expect(normalIds).toContain('enemy_tidal_siren');
      expect(normalIds).toContain('enemy_innsmouth_hybrid');
      expect(normalIds).toContain('enemy_abyssal_barnacle_mass');
      expect(normalIds.length).toBeGreaterThanOrEqual(6);

      const eliteIds = DEPTH_2_ELITE_ENEMIES.map((e) => e.id);
      expect(eliteIds).toContain('enemy_dagon_champion');
      expect(eliteIds).toContain('enemy_frenzied_deep_one');
    });

    it('Depth 3 registers correct normal and elite enemy pools with expanded canonical monsters', () => {
      const normalIds = DEPTH_3_NORMAL_ENEMIES.map((e) => e.id);
      expect(normalIds).toContain('enemy_proto_shoggoth_spawn');
      expect(normalIds).toContain('enemy_byakhee_rotwing');
      expect(normalIds).toContain('enemy_formless_spawn');
      expect(normalIds).toContain('enemy_hound_of_tindalos');
      expect(normalIds).toContain('enemy_migo_scout');
      expect(normalIds).toContain('enemy_void_wanderer');
      expect(normalIds).toContain('enemy_outer_god_piper');
      expect(normalIds.length).toBeGreaterThanOrEqual(7);

      const eliteIds = DEPTH_3_ELITE_ENEMIES.map((e) => e.id);
      expect(eliteIds).toContain('enemy_ancient_hound_of_tindalos');
    });

    it('Depth 4 registers correct normal and elite enemy pools with expanded canonical monsters', () => {
      const normalIds = DEPTH_4_NORMAL_ENEMIES.map((e) => e.id);
      expect(normalIds).toContain('enemy_star_spawn_larva');
      expect(normalIds).toContain('enemy_rlyeh_sarcophagus_guard');
      expect(normalIds).toContain('enemy_cosmic_acolyte');
      expect(normalIds).toContain('enemy_rlyeh_dream_apparition');
      expect(normalIds).toContain('enemy_non_euclidean_construct');
      expect(normalIds).toContain('enemy_cosmic_prophet');
      expect(normalIds.length).toBeGreaterThanOrEqual(6);

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

    it('all normal enemy health points adhere strictly to ADR-0026 balance matrix', () => {
      // Depth 1: HP 28 ~ 34
      for (const enemy of DEPTH_1_NORMAL_ENEMIES) {
        expect(enemy.health).toBeGreaterThanOrEqual(28);
        expect(enemy.health).toBeLessThanOrEqual(34);
      }

      // Depth 2: HP 38 ~ 46
      for (const enemy of DEPTH_2_NORMAL_ENEMIES) {
        expect(enemy.health).toBeGreaterThanOrEqual(38);
        expect(enemy.health).toBeLessThanOrEqual(46);
      }

      // Depth 3: HP 50 ~ 62
      for (const enemy of DEPTH_3_NORMAL_ENEMIES) {
        expect(enemy.health).toBeGreaterThanOrEqual(50);
        expect(enemy.health).toBeLessThanOrEqual(62);
      }

      // Depth 4: HP 68 ~ 80
      for (const enemy of DEPTH_4_NORMAL_ENEMIES) {
        expect(enemy.health).toBeGreaterThanOrEqual(68);
        expect(enemy.health).toBeLessThanOrEqual(80);
      }
    });

    it('anti-repeat rotation: getEncounterEnemy never returns excludeEnemyId if pool has > 1 enemy', () => {
      for (const depth of [1, 2, 3, 4] as DepthLevel[]) {
        const fullPool = depth === 1 ? DEPTH_1_NORMAL_ENEMIES : depth === 2 ? DEPTH_2_NORMAL_ENEMIES : depth === 3 ? DEPTH_3_NORMAL_ENEMIES : DEPTH_4_NORMAL_ENEMIES;
        for (const targetEnemy of fullPool) {
          // Draw multiple times with excludeEnemyId set to targetEnemy.id
          for (let i = 0; i < 20; i++) {
            const drawn = getEncounterEnemy(depth, 'combat', Math.random, targetEnemy.id);
            expect(drawn.id).not.toBe(targetEnemy.id);
          }
        }
      }
    });

    it('anti-repeat rotation: consecutive draws in same depth never repeat the exact same enemy', () => {
      for (const depth of [1, 2, 3, 4] as DepthLevel[]) {
        let lastId: string | undefined = undefined;
        for (let i = 0; i < 50; i++) {
          const drawn = getEncounterEnemy(depth, 'combat', Math.random, lastId);
          if (lastId !== undefined) {
            expect(drawn.id).not.toBe(lastId);
          }
          lastId = drawn.id;
        }
      }
    });
  });
});
