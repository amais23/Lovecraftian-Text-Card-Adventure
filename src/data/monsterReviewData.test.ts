import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { MONSTERS_BY_DEPTH, type MonsterReviewData } from './monsterReviewData';

describe('Monster Review Data (Bestiary & Review Lab)', () => {
  const derivativeEnemyIdsByDepth: Record<1 | 2 | 3 | 4, string[]> = {
    1: ['enemy_walls_rat_swarm', 'enemy_cultist_zealot', 'enemy_cemetery_carrion_worm'],
    2: ['enemy_innsmouth_hybrid', 'enemy_tidal_siren', 'enemy_abyssal_barnacle_mass'],
    3: ['enemy_migo_scout', 'enemy_void_wanderer', 'enemy_outer_god_piper'],
    4: ['enemy_rlyeh_sarcophagus_guard', 'enemy_rlyeh_dream_apparition', 'enemy_cosmic_prophet'],
  };

  it('includes all 12 newly added derivative monsters in MONSTERS_BY_DEPTH across Depths 1 to 4', () => {
    for (const [depthStr, expectedIds] of Object.entries(derivativeEnemyIdsByDepth)) {
      const depth = Number(depthStr) as 1 | 2 | 3 | 4;
      const monsters = MONSTERS_BY_DEPTH[depth];
      const monsterIds = monsters.map((m) => m.id);

      for (const expectedId of expectedIds) {
        expect(monsterIds, `Depth ${depth} must contain ${expectedId}`).toContain(expectedId);
      }
    }
  });

  it('ensures all defined imageUrl and realisticUrl physically exist on disk (zero broken images)', () => {
    for (const [depthStr, monsters] of Object.entries(MONSTERS_BY_DEPTH)) {
      const depth = Number(depthStr);
      for (const monster of monsters) {
        if (monster.imageUrl) {
          const filePath = 'public' + monster.imageUrl;
          expect(
            fs.existsSync(filePath),
            `Monster ${monster.id} (Depth ${depth}) imageUrl ${monster.imageUrl} must physically exist on disk`
          ).toBe(true);
        }

        if (monster.realisticUrl) {
          const filePath = 'public' + monster.realisticUrl;
          expect(
            fs.existsSync(filePath),
            `Monster ${monster.id} (Depth ${depth}) realisticUrl ${monster.realisticUrl} must physically exist on disk`
          ).toBe(true);
        }
      }
    }
  });

  it('ensures all 12 derivative monsters have both cartoon and realistic artwork URLs defined and physically present', () => {
    const allDerivativeIds = Object.values(derivativeEnemyIdsByDepth).flat();
    const allMonsters: MonsterReviewData[] = Object.values(MONSTERS_BY_DEPTH).flat();

    for (const id of allDerivativeIds) {
      const monster = allMonsters.find((m) => m.id === id);
      expect(monster, `Monster ${id} must be in review data`).toBeDefined();
      expect(monster?.imageUrl, `Monster ${id} must have cartoon imageUrl`).toBe(`/enemies/cartoon/${id}.png`);
      expect(monster?.realisticUrl, `Monster ${id} must have realistic realisticUrl`).toBe(`/enemies/realistic/${id}.png`);
      expect(fs.existsSync('public' + monster!.imageUrl!)).toBe(true);
      expect(fs.existsSync('public' + monster!.realisticUrl!)).toBe(true);
    }
  });

  it('validates each derivative monster has complete traits, intents, and tactical tips', () => {
    const allDerivativeIds = Object.values(derivativeEnemyIdsByDepth).flat();
    const allMonsters: MonsterReviewData[] = Object.values(MONSTERS_BY_DEPTH).flat();

    for (const id of allDerivativeIds) {
      const monster = allMonsters.find((m) => m.id === id)!;
      expect(monster.trait.name.length).toBeGreaterThan(0);
      expect(monster.trait.description.length).toBeGreaterThan(0);
      expect(monster.trait.trigger.length).toBeGreaterThan(0);
      expect(monster.intents.length).toBeGreaterThanOrEqual(3);
      expect(monster.tacticalTips.threatSummary.length).toBeGreaterThan(0);
      expect(monster.tacticalTips.recommendedCards.length).toBeGreaterThan(0);
      expect(monster.tacticalTips.strategy.length).toBeGreaterThan(0);
    }
  });
});
