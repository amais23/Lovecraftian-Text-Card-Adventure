import { describe, it, expect } from 'vitest';
import { getAllRegisteredEnemies, getBossByDepth } from './enemyCatalog';
import {
  ENEMY_ARTWORKS_REGISTRY,
  getActiveEnemyIllustration,
  isEnemyImageVerified,
} from './enemyArtworks';
import { generateMonstersByDepth } from '../data/monsterReviewData';
import type { DepthLevel } from '../types/game';

describe('Monster Artwork Diagnostics (Diagnosing Bugs Loop)', () => {
  const allEnemies = getAllRegisteredEnemies();
  const existingImages = new Set(Object.keys(import.meta.glob('/public/enemies/**/*.{webp,png}')));

  it('[BUG 1 - Missing Images / 404 Fallback]: all registered enemies have physically existing cartoon & realistic images on disk', () => {
    const missingAssets: string[] = [];

    for (const [id, enemy] of Object.entries(allEnemies)) {
      const art = ENEMY_ARTWORKS_REGISTRY[id];
      if (!art) {
        missingAssets.push(`${id} (${enemy.name}): No entry in ENEMY_ARTWORKS_REGISTRY`);
        continue;
      }

      if (!art.cartoonUrl || !existingImages.has(`/public${art.cartoonUrl}`)) {
        missingAssets.push(`${id} (${enemy.name}): Cartoon image missing at ${art.cartoonUrl}`);
      }

      const isBoss = enemy.category === 'boss' || art.category === 'boss';
      if (!isBoss) {
        if (!art.realisticUrl || !existingImages.has(`/public${art.realisticUrl}`)) {
          missingAssets.push(`${id} (${enemy.name}): Realistic image missing at ${art.realisticUrl}`);
        }
      }
    }

    expect(
      missingAssets,
      `Found ${missingAssets.length} missing monster artwork assets:\n${missingAssets.join('\n')}`
    ).toEqual([]);
  });

  it('[BUG 2 - Wrong / Borrowed Images]: no distinct enemy borrows or reuses another enemy artwork asset', () => {
    const borrowedMismatches: string[] = [];
    const usedCartoonUrls = new Map<string, string[]>();

    for (const [id, enemy] of Object.entries(allEnemies)) {
      const art = ENEMY_ARTWORKS_REGISTRY[id];
      if (!art || !art.cartoonUrl) continue;

      const existing = usedCartoonUrls.get(art.cartoonUrl) || [];
      existing.push(`${id} (${enemy.name})`);
      usedCartoonUrls.set(art.cartoonUrl, existing);
    }

    for (const [url, enemyList] of usedCartoonUrls.entries()) {
      if (enemyList.length > 1) {
        borrowedMismatches.push(`URL ${url} is shared by multiple distinct enemies: ${enemyList.join(', ')}`);
      }
    }

    // Specific check for known wrong mappings:
    const ancientHoundArt = ENEMY_ARTWORKS_REGISTRY['enemy_ancient_hound_of_tindalos'];
    if (ancientHoundArt?.cartoonUrl?.includes('void_wanderer')) {
      borrowedMismatches.push('enemy_ancient_hound_of_tindalos is wrongly mapped to void_wanderer image');
    }

    expect(
      borrowedMismatches,
      `Found ${borrowedMismatches.length} wrong/shared enemy artworks:\n${borrowedMismatches.join('\n')}`
    ).toEqual([]);
  });

  it('[BUG 3 - Image Degradation in Review Lab & Combat]: all depth bosses have valid verified artwork in Review Lab and combat stage', () => {
    const monstersByDepth = generateMonstersByDepth();
    const degradedBosses: string[] = [];

    for (const depth of [1, 2, 3, 4] as DepthLevel[]) {
      const boss = getBossByDepth(depth);
      const illustration = getActiveEnemyIllustration(boss);

      if (!illustration || !isEnemyImageVerified(illustration)) {
        degradedBosses.push(`Depth ${depth} Boss ${boss.id} (${boss.name}) active illustration is unverified: ${illustration}`);
      }

      const reviewMonster = monstersByDepth[depth].find((m) => m.role === 'boss');
      if (!reviewMonster || !reviewMonster.imageUrl) {
        degradedBosses.push(`Depth ${depth} Boss ${boss.id} (${boss.name}) in Review Lab has no imageUrl`);
      }
    }

    expect(
      degradedBosses,
      `Found ${degradedBosses.length} degraded bosses:\n${degradedBosses.join('\n')}`
    ).toEqual([]);
  });

  it('[BUG 4 - getActiveEnemyIllustration returns 404 URL]: getActiveEnemyIllustration should only return verified existing paths, avoiding img onError degradation', () => {
    const unverifiedReturns: string[] = [];

    for (const [id, enemy] of Object.entries(allEnemies)) {
      const normalUrl = getActiveEnemyIllustration(enemy, { isMadness: false });
      if (normalUrl && !isEnemyImageVerified(normalUrl)) {
        unverifiedReturns.push(`${id} (${enemy.name}) normal state returns non-existent path: ${normalUrl}`);
      }

      const madnessUrl = getActiveEnemyIllustration(enemy, { isMadness: true });
      if (madnessUrl && !isEnemyImageVerified(madnessUrl)) {
        unverifiedReturns.push(`${id} (${enemy.name}) madness state returns non-existent path: ${madnessUrl}`);
      }
    }

    expect(
      unverifiedReturns,
      `getActiveEnemyIllustration returned ${unverifiedReturns.length} non-existent URLs that trigger 404 onError:\n${unverifiedReturns.join('\n')}`
    ).toEqual([]);
  });
});
