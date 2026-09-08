import { describe, it, expect } from 'vitest';
import {
  getEnemyArtwork,
  getActiveEnemyIllustration,
} from './enemyArtworks';
import type { Enemy } from '../types/game';

describe('Enemy Artworks Registry & Dual-Perception Engine (ADR-0021)', () => {
  const mockCultist: Enemy = {
    id: 'enemy_arkham_cultist',
    name: '阿卡姆異教徒',
    title: '狂熱的舊日崇拜者',
    health: 28,
    maxHealth: 28,
    armor: 0,
    category: 'cultist',
    currentIntent: {
      type: 'attack',
      value: 6,
      name: '儀式匕首刺擊',
      description: '預告造成 6 點傷害',
    },
  };

  const mockBossShoggoth: Enemy = {
    id: 'enemy_shoggoth_progeny',
    name: '修格斯幼嗣',
    title: '無以名狀的黏稠恐懼',
    health: 70,
    maxHealth: 70,
    armor: 10,
    category: 'boss',
    currentIntent: {
      type: 'attack',
      value: 12,
      name: '碾壓撲擊',
      description: '重擊',
    },
  };

  describe('Registry Configuration', () => {
    it('registers all key Depth 1 enemies and boss', () => {
      expect(getEnemyArtwork('enemy_arkham_cultist')).toBeDefined();
      expect(getEnemyArtwork('enemy_ghoul_lurker')).toBeDefined();
      expect(getEnemyArtwork('enemy_nightgaunt')).toBeDefined();
      expect(getEnemyArtwork('enemy_ghoul_high_priest')).toBeDefined();
      expect(getEnemyArtwork('enemy_shoggoth_progeny')).toBeDefined();
    });

    it('has correct cartoon and realistic paths for regular enemies', () => {
      const cultistArt = getEnemyArtwork('enemy_arkham_cultist');
      expect(cultistArt?.cartoonUrl).toBe('/enemies/cartoon/enemy_arkham_cultist.png');
      expect(cultistArt?.realisticUrl).toBe('/enemies/realistic/enemy_arkham_cultist.png');
    });

    it('has cartoon path but NO realistic path for bosses (Boss Invariant Mask)', () => {
      const bossArt = getEnemyArtwork('enemy_shoggoth_progeny');
      expect(bossArt?.cartoonUrl).toBe('/enemies/cartoon/enemy_shoggoth_progeny.png');
      expect(bossArt?.realisticUrl).toBeUndefined();
    });

    it('returns undefined for unknown enemy ID', () => {
      expect(getEnemyArtwork('unknown_creature_999')).toBeUndefined();
    });
  });

  describe('Dual-Perception Illustration Resolution', () => {
    it('resolves cartoonUrl in normal state for non-boss enemies', () => {
      const url = getActiveEnemyIllustration(mockCultist, {
        isMadness: false,
        isFlickering: false,
      });
      expect(url).toBe('/enemies/cartoon/enemy_arkham_cultist.png');
    });

    it('resolves realisticUrl in madness state for non-boss enemies', () => {
      const url = getActiveEnemyIllustration(mockCultist, {
        isMadness: true,
        isFlickering: false,
      });
      expect(url).toBe('/enemies/realistic/enemy_arkham_cultist.png');
    });

    it('resolves realisticUrl when flickering during sanity damage', () => {
      const url = getActiveEnemyIllustration(mockCultist, {
        isMadness: false,
        isFlickering: true,
      });
      expect(url).toBe('/enemies/realistic/enemy_arkham_cultist.png');
    });

    it('ALWAYS resolves cartoonUrl for Bosses even in madness or flickering (Boss Invariant Mask)', () => {
      // Normal state
      expect(
        getActiveEnemyIllustration(mockBossShoggoth, {
          isMadness: false,
          isFlickering: false,
        })
      ).toBe('/enemies/cartoon/enemy_shoggoth_progeny.png');

      // Madness state
      expect(
        getActiveEnemyIllustration(mockBossShoggoth, {
          isMadness: true,
          isFlickering: false,
        })
      ).toBe('/enemies/cartoon/enemy_shoggoth_progeny.png');

      // Flickering
      expect(
        getActiveEnemyIllustration(mockBossShoggoth, {
          isMadness: false,
          isFlickering: true,
        })
      ).toBe('/enemies/cartoon/enemy_shoggoth_progeny.png');

      // Both madness and flickering
      expect(
        getActiveEnemyIllustration(mockBossShoggoth, {
          isMadness: true,
          isFlickering: true,
        })
      ).toBe('/enemies/cartoon/enemy_shoggoth_progeny.png');
    });

    it('falls back to cartoonUrl if realisticUrl is missing when madness or flickering occurs', () => {
      const enemyWithoutRealistic: Enemy = {
        ...mockCultist,
        id: 'test_custom_creature',
        illustration: {
          cartoonUrl: '/custom/cartoon.png',
        },
      };

      const url = getActiveEnemyIllustration(enemyWithoutRealistic, {
        isMadness: true,
        isFlickering: false,
      });
      expect(url).toBe('/custom/cartoon.png');
    });

    it('returns null gracefully when no illustration is registered and none provided on enemy', () => {
      const unknownEnemy: Enemy = {
        id: 'unregistered_dummy',
        name: '未知名怪',
        title: '虛空之影',
        health: 10,
        maxHealth: 10,
        armor: 0,
        currentIntent: {
          type: 'attack',
          value: 1,
          name: '虛無之觸',
          description: '攻擊',
        },
      };

      expect(getActiveEnemyIllustration(unknownEnemy)).toBeNull();
    });

    it('prefers enemy.illustration overrides over the global registry', () => {
      const overriddenEnemy: Enemy = {
        ...mockCultist,
        illustration: {
          cartoonUrl: '/custom/override_cartoon.png',
          realisticUrl: '/custom/override_realistic.png',
        },
      };

      expect(getActiveEnemyIllustration(overriddenEnemy)).toBe(
        '/custom/override_cartoon.png'
      );
      expect(
        getActiveEnemyIllustration(overriddenEnemy, { isMadness: true })
      ).toBe('/custom/override_realistic.png');
    });
  });

  describe('Physical Assets Existence (Depth 1 MVP - Issue #41)', () => {
    it('ensures all 9 Depth 1 transparent PNG assets physically exist on disk in public/enemies/', () => {
      const enemyImages = import.meta.glob('/public/enemies/**/*.{webp,png}');
      const imagePaths = Object.keys(enemyImages);

      const depth1EnemyIds = [
        'enemy_arkham_cultist',
        'enemy_ghoul_lurker',
        'enemy_nightgaunt',
        'enemy_ghoul_high_priest',
      ];

      for (const id of depth1EnemyIds) {
        const art = getEnemyArtwork(id);
        expect(art).toBeDefined();
        expect(imagePaths).toContain(`/public${art!.cartoonUrl}`);
        expect(imagePaths).toContain(`/public${art!.realisticUrl}`);
      }

      // Depth 1 Boss (Cute cartoon only)
      const bossArt = getEnemyArtwork('enemy_shoggoth_progeny');
      expect(bossArt).toBeDefined();
      expect(imagePaths).toContain(`/public${bossArt!.cartoonUrl}`);
    });
  });
});
