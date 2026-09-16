import { describe, it, expect } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
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

  describe('Theme Categories & Fallback Avatars (Issue #29)', () => {
    it('renders category-specific icons for various Mythos archetypes when fallback is triggered', () => {
      const cultist: Enemy = {
        ...dummyEnemy,
        id: 'unregistered_cultist',
        name: '阿卡姆異教徒',
        category: 'cultist',
      };
      const { rerender } = render(<EnemyView enemy={cultist} />);
      expect(screen.getByTestId('enemy-icon-cultist')).toBeDefined();

      const nightgaunt: Enemy = {
        ...dummyEnemy,
        id: 'unregistered_nightgaunt',
        name: '夜魘',
        category: 'nightgaunt',
      };
      rerender(<EnemyView enemy={nightgaunt} />);
      expect(screen.getByTestId('enemy-icon-nightgaunt')).toBeDefined();

      const deepOne: Enemy = {
        ...dummyEnemy,
        id: 'unregistered_deep_one',
        name: '深潛者戰士',
        category: 'deep_one',
      };
      rerender(<EnemyView enemy={deepOne} />);
      expect(screen.getByTestId('enemy-icon-deep_one')).toBeDefined();

      const hound: Enemy = {
        ...dummyEnemy,
        id: 'unregistered_hound',
        name: '廷達洛斯獵犬',
        category: 'hound',
      };
      rerender(<EnemyView enemy={hound} />);
      expect(screen.getByTestId('enemy-icon-hound')).toBeDefined();

      const starSpawn: Enemy = {
        ...dummyEnemy,
        id: 'unregistered_star_spawn',
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
  });

  describe('Dual-Perception Illustration & Safe Area (Issue #40, ADR-0021)', () => {
    it('renders portrait stage, core safe area, ambient glow, and fallback wrapper when unregistered', () => {
      const unregisteredEnemy: Enemy = {
        ...dummyEnemy,
        id: 'unregistered_boss',
        name: '未知首領',
        category: 'boss',
      };
      render(<EnemyView enemy={unregisteredEnemy} />);

      const stage = screen.getByTestId('enemy-portrait-stage');
      expect(stage).toBeDefined();
      expect(stage.className).toContain('enemy-portrait-stage');
      expect(stage.className).toContain('enemy-category-boss');

      const safeArea = screen.getByTestId('enemy-safe-area');
      expect(safeArea).toBeDefined();

      const glow = screen.getByTestId('enemy-ambient-glow');
      expect(glow).toBeDefined();
      expect(glow.className).toContain('glow-boss');

      const avatarWrapper = screen.getByTestId('enemy-avatar-wrapper');
      expect(avatarWrapper).toBeDefined();
      expect(safeArea.contains(avatarWrapper)).toBe(true);
    });

    it('renders transparent portrait image for registered enemy in normal state', () => {
      const cultist: Enemy = {
        ...dummyEnemy,
        id: 'enemy_arkham_cultist',
        name: '阿卡姆異教徒',
        category: 'cultist',
      };
      render(<EnemyView enemy={cultist} isMadness={false} />);

      const image = screen.getByTestId('enemy-portrait-image') as HTMLImageElement;
      expect(image).toBeDefined();
      expect(image.src).toContain('/enemies/cartoon/enemy_arkham_cultist.png');
      expect(image.className).toContain('state-normal');
    });

    it('switches to realistic illustration in madness state for regular enemies', () => {
      const cultist: Enemy = {
        ...dummyEnemy,
        id: 'enemy_arkham_cultist',
        name: '阿卡姆異教徒',
        category: 'cultist',
      };
      render(<EnemyView enemy={cultist} isMadness={true} />);

      const image = screen.getByTestId('enemy-portrait-image') as HTMLImageElement;
      expect(image).toBeDefined();
      expect(image.src).toContain('/enemies/realistic/enemy_arkham_cultist.png');
      expect(image.className).toContain('state-madness');
    });

    it('maintains cartoon illustration for bosses in madness state (Boss Invariant Mask)', () => {
      const boss: Enemy = {
        ...dummyEnemy,
        id: 'enemy_shoggoth_progeny',
        name: '修格斯幼嗣',
        category: 'boss',
      };
      render(<EnemyView enemy={boss} isMadness={true} />);

      const image = screen.getByTestId('enemy-portrait-image') as HTMLImageElement;
      expect(image).toBeDefined();
      expect(image.src).toContain('/enemies/cartoon/enemy_shoggoth_progeny.png');
    });

    it('falls back to icon avatar when portrait image fails to load', () => {
      const cultist: Enemy = {
        ...dummyEnemy,
        id: 'enemy_arkham_cultist',
        name: '阿卡姆異教徒',
        category: 'cultist',
      };
      render(<EnemyView enemy={cultist} />);

      const image = screen.getByTestId('enemy-portrait-image');
      expect(image).toBeDefined();

      // Trigger image error event
      fireEvent.error(image);

      // Now fallback avatar wrapper should appear
      expect(screen.getByTestId('enemy-avatar-wrapper')).toBeDefined();
      expect(screen.getByTestId('enemy-icon-cultist')).toBeDefined();
    });

    it('triggers flicker when sanityCount decreases', () => {
      const cultist: Enemy = {
        ...dummyEnemy,
        id: 'enemy_arkham_cultist',
        name: '阿卡姆異教徒',
        category: 'cultist',
      };
      const { rerender } = render(<EnemyView enemy={cultist} sanityCount={10} />);

      const stageBefore = screen.getByTestId('enemy-portrait-stage');
      expect(stageBefore.className).not.toContain('is-flickering');

      // Sanity decreases to 8
      rerender(<EnemyView enemy={cultist} sanityCount={8} />);

      const stageAfter = screen.getByTestId('enemy-portrait-stage');
      expect(stageAfter.className).toContain('is-flickering');

      const image = screen.getByTestId('enemy-portrait-image');
      expect(image.className).toContain('perception-flickering');
    });

    it('renders eldritch trait badges and shoggoth stances (charging, eyes, claws, hide)', () => {
      const shoggothWithTraits: Enemy = {
        ...dummyEnemy,
        id: 'enemy_shoggoth',
        name: '修格斯 (Shoggoth)',
        category: 'shoggoth',
        traits: [
          {
            id: 'organ_proliferation',
            name: '器官增生',
            description: '體表隨機增生巨目、重爪或厚皮',
          },
        ],
        shoggothStance: 'charging',
      };

      const { rerender } = render(<EnemyView enemy={shoggothWithTraits} />);

      expect(screen.getByTestId('enemy-traits-list')).toBeDefined();
      expect(screen.getByTestId('trait-badge-organ_proliferation')).toBeDefined();
      expect(screen.getByText('器官增生')).toBeDefined();
      expect(screen.getByTestId('shoggoth-charging-badge')).toBeDefined();
      expect(screen.getByText(/Tekeli-li 蓄力中/)).toBeDefined();

      // Test eyes stance
      rerender(<EnemyView enemy={{ ...shoggothWithTraits, shoggothStance: 'eyes' }} />);
      expect(screen.getByTestId('shoggoth-eyes-badge')).toBeDefined();
      expect(screen.getByText(/巨目凝視/)).toBeDefined();

      // Test claws stance
      rerender(<EnemyView enemy={{ ...shoggothWithTraits, shoggothStance: 'claws' }} />);
      expect(screen.getByTestId('shoggoth-claws-badge')).toBeDefined();
      expect(screen.getByText(/重爪增生/)).toBeDefined();

      // Test hide stance
      rerender(<EnemyView enemy={{ ...shoggothWithTraits, shoggothStance: 'hide' }} />);
      expect(screen.getByTestId('shoggoth-hide-badge')).toBeDefined();
      expect(screen.getByText(/厚皮硬化/)).toBeDefined();
    });
  });
});

