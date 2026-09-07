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
});
