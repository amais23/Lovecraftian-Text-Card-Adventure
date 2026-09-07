import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RewardScreen } from './RewardScreen';
import { createInitialCombatState } from '../engine/gameReducer';
import { generateInvestigationMap } from '../engine/mapGenerator';
import type { GameState } from '../types/game';

describe('RewardScreen Component (Issue #21 / ADR-0015)', () => {
  it('does NOT render abyssal seal button on regular non-boss rewards', () => {
    const map = generateInvestigationMap({ depth: 1 });
    const normalNodeId = map.layers[0][0];

    const state: GameState = {
      ...createInitialCombatState(),
      phase: 'reward',
      currentDepth: 1,
      rewardCards: [],
      rewardObols: 15,
      map: {
        ...map,
        currentNodeId: normalNodeId,
      },
    };

    const dispatch = vi.fn();
    render(<RewardScreen state={state} dispatch={dispatch} />);

    expect(screen.queryByRole('button', { name: /承受深淵封印/ })).toBeNull();
  });

  it('renders abyssal seal option on Depth 1 boss victory and dispatches CLAIM_ABYSSAL_SEAL when clicked', () => {
    const map = generateInvestigationMap({ depth: 1 });
    const bossNodeId = map.layers[map.layers.length - 1][0];

    const state: GameState = {
      ...createInitialCombatState(),
      phase: 'reward',
      currentDepth: 1,
      rewardCards: [],
      rewardObols: 50,
      map: {
        ...map,
        currentNodeId: bossNodeId,
      },
    };

    const dispatch = vi.fn();
    render(<RewardScreen state={state} dispatch={dispatch} />);

    const sealBtn = screen.getByRole('button', { name: /承受深淵封印.*深淵封印殘片·其一/ });
    expect(sealBtn).toBeTruthy();

    fireEvent.click(sealBtn);
    expect(dispatch).toHaveBeenCalledWith({ type: 'CLAIM_ABYSSAL_SEAL' });
  });

  it('renders abyssal seal option with Fragment 2 on Depth 2 boss victory', () => {
    const map = generateInvestigationMap({ depth: 2 });
    const bossNodeId = map.layers[map.layers.length - 1][0];

    const state: GameState = {
      ...createInitialCombatState(),
      phase: 'reward',
      currentDepth: 2,
      rewardCards: [],
      rewardObols: 50,
      map: {
        ...map,
        currentNodeId: bossNodeId,
      },
    };

    const dispatch = vi.fn();
    render(<RewardScreen state={state} dispatch={dispatch} />);

    const sealBtn = screen.getByRole('button', { name: /承受深淵封印.*深淵封印殘片·其二/ });
    expect(sealBtn).toBeTruthy();
    expect(
      screen.getByText(/封印殘片為無法打出的黑色瘋狂卡，將永久佔據手牌與理智牌庫！/)
    ).toBeTruthy();
  });

  it('displays the glowing fusion banner when abyssalSealFused is true', () => {
    const map = generateInvestigationMap({ depth: 3 });
    const bossNodeId = map.layers[map.layers.length - 1][0];

    const state: GameState = {
      ...createInitialCombatState(),
      phase: 'reward',
      currentDepth: 3,
      abyssalSealFused: true,
      rewardCards: [],
      rewardObols: 50,
      map: {
        ...map,
        currentNodeId: bossNodeId,
      },
    };

    const dispatch = vi.fn();
    render(<RewardScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText('【白色真理古印已共鳴融合】')).toBeTruthy();
    expect(
      screen.getByText(/三枚深淵封印殘片劇烈共鳴，昇華為終極白色真相卡【完整的深淵古印】/)
    ).toBeTruthy();
  });
});
