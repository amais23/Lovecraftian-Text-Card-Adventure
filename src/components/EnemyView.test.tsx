import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { EnemyView } from './EnemyView';
import type { Enemy } from '../types/game';
import { createStatusEffect } from '../engine/statusEffects';

describe('EnemyView Component (ADR-0018)', () => {
  const dummyEnemy: Enemy = {
    id: 'ghoul_scout',
    name: '食屍鬼潛伏者',
    title: '墓穴巡獵之物',
    health: 24,
    maxHealth: 28,
    armor: 5,
    currentIntent: {
      type: 'attack',
      value: 8,
      name: '腐化抓擊',
      description: '揮舞帶毒爪刃造成重擊',
    },
    statusEffects: [],
  };

  it('renders enemy name, title, health, and armor', () => {
    render(<EnemyView enemy={dummyEnemy} />);

    expect(screen.getByText('食屍鬼潛伏者')).toBeDefined();
    expect(screen.getByText('墓穴巡獵之物')).toBeDefined();
    expect(screen.getByText(/24 \/ 28/)).toBeDefined();
    expect(screen.getByText(/護甲 \+5/)).toBeDefined();
  });

  it('renders intent with formatIntentValue for apply_status intent', () => {
    const enemyWithStatusIntent: Enemy = {
      ...dummyEnemy,
      currentIntent: {
        type: 'apply_status',
        value: 2,
        name: '恐懼凝視',
        description: '施加恐慌印記',
        statusType: 'horror',
      },
    };

    render(<EnemyView enemy={enemyWithStatusIntent} />);

    expect(screen.getByText('恐懼凝視')).toBeDefined();
    expect(screen.getByText('印記 +2')).toBeDefined();
  });

  it('renders active status effects badges on enemy', () => {
    const enemyWithStatuses: Enemy = {
      ...dummyEnemy,
      statusEffects: [
        createStatusEffect('vulnerable', 2),
        createStatusEffect('bleed', 4),
      ],
    };

    render(<EnemyView enemy={enemyWithStatuses} />);

    const container = screen.getByTestId('enemy-status-effects');
    expect(container).toBeDefined();
    expect(within(container).getByText('易傷')).toBeDefined();
    expect(within(container).getByText('2')).toBeDefined();
    expect(within(container).getByText('流血')).toBeDefined();
    expect(within(container).getByText('4')).toBeDefined();
  });

  describe('Theme Categories & Avatars (Issue #29)', () => {
    it('renders category-specific icons for various Mythos archetypes', () => {
      const cultist: Enemy = {
        ...dummyEnemy,
        id: 'enemy_arkham_cultist',
        name: '阿卡姆異教徒',
        category: 'cultist',
      };
      const { rerender } = render(<EnemyView enemy={cultist} />);
      expect(screen.getByTestId('enemy-icon-cultist')).toBeDefined();

      const nightgaunt: Enemy = {
        ...dummyEnemy,
        id: 'enemy_nightgaunt',
        name: '夜魘',
        category: 'nightgaunt',
      };
      rerender(<EnemyView enemy={nightgaunt} />);
      expect(screen.getByTestId('enemy-icon-nightgaunt')).toBeDefined();

      const deepOne: Enemy = {
        ...dummyEnemy,
        id: 'enemy_deep_one_warrior',
        name: '深潛者戰士',
        category: 'deep_one',
      };
      rerender(<EnemyView enemy={deepOne} />);
      expect(screen.getByTestId('enemy-icon-deep_one')).toBeDefined();

      const hound: Enemy = {
        ...dummyEnemy,
        id: 'enemy_hound_of_tindalos',
        name: '廷達洛斯獵犬',
        category: 'hound',
      };
      rerender(<EnemyView enemy={hound} />);
      expect(screen.getByTestId('enemy-icon-hound')).toBeDefined();

      const starSpawn: Enemy = {
        ...dummyEnemy,
        id: 'enemy_star_spawn_larva',
        name: '星之眷族幼體',
        category: 'star_spawn',
      };
      rerender(<EnemyView enemy={starSpawn} />);
      expect(screen.getByTestId('enemy-icon-star_spawn')).toBeDefined();
    });

    it('renders erode and defend intents accurately with formatted values', () => {
      const enemyWithErode: Enemy = {
        ...dummyEnemy,
        currentIntent: {
          type: 'erode',
          value: 3,
          name: '狂亂侵蝕',
          description: '侵蝕 3 點理智牌庫',
        },
      };
      const { rerender } = render(<EnemyView enemy={enemyWithErode} />);
      expect(screen.getByText('狂亂侵蝕')).toBeDefined();
      expect(screen.getByText('侵蝕 3')).toBeDefined();

      const enemyWithDefend: Enemy = {
        ...dummyEnemy,
        currentIntent: {
          type: 'defend',
          value: 8,
          name: '潮汐硬甲',
          description: '獲得 8 點護甲',
        },
      };
      rerender(<EnemyView enemy={enemyWithDefend} />);
      expect(screen.getByText('潮汐硬甲')).toBeDefined();
      expect(screen.getByText('護甲 +8')).toBeDefined();
    });

    it('renders apply_status intents for bleed and vulnerable', () => {
      const enemyBleed: Enemy = {
        ...dummyEnemy,
        currentIntent: {
          type: 'apply_status',
          value: 3,
          statusType: 'bleed',
          name: '開膛鉤爪',
          description: '施加 3 層流血印記',
        },
      };
      const { rerender } = render(<EnemyView enemy={enemyBleed} />);
      expect(screen.getByText('開膛鉤爪')).toBeDefined();
      expect(screen.getByText('印記 +3')).toBeDefined();

      const enemyVuln: Enemy = {
        ...dummyEnemy,
        currentIntent: {
          type: 'apply_status',
          value: 2,
          statusType: 'vulnerable',
          name: '維度錨定咒縛',
          description: '施加 2 層易傷印記',
        },
      };
      rerender(<EnemyView enemy={enemyVuln} />);
      expect(screen.getByText('維度錨定咒縛')).toBeDefined();
      expect(screen.getByText('印記 +2')).toBeDefined();
    });

    it('renders portrait stage, core safe area, and ambient glow (ADR-0021)', () => {
      const bossEnemy: Enemy = {
        ...dummyEnemy,
        id: 'enemy_shoggoth_progeny',
        name: '修格斯幼嗣',
        category: 'boss',
      };
      render(<EnemyView enemy={bossEnemy} />);

      const stage = screen.getByTestId('enemy-portrait-stage');
      expect(stage).toBeDefined();
      expect(stage.className).toContain('enemy-portrait-stage');
      expect(stage.className).toContain('enemy-category-boss');

      const safeArea = screen.getByTestId('enemy-safe-area');
      expect(safeArea).toBeDefined();

      const glow = screen.getByTestId('enemy-ambient-glow');
      expect(glow).toBeDefined();
      expect(glow.className).toContain('glow-boss');

      // Fallback avatar wrapper remains inside safe area
      const avatarWrapper = screen.getByTestId('enemy-avatar-wrapper');
      expect(avatarWrapper).toBeDefined();
      expect(safeArea.contains(avatarWrapper)).toBe(true);
    });
  });
});
