import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DepthTransitionScreen } from './DepthTransitionScreen';
import { createInitialGameState } from '../engine/gameReducer';
import type { GameState } from '../types/game';

vi.mock('../engine/audioManager', () => ({
  soundEngine: {
    playHeartbeat: vi.fn(),
    playWhisper: vi.fn(),
    playClick: vi.fn(),
  },
}));

describe('DepthTransitionScreen (Issue #19 / ADR-0015)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders transition from Depth 1 to Depth 2 with bodily recovery', () => {
    const dispatch = vi.fn();
    const state: GameState = {
      ...createInitialGameState(),
      phase: 'depth_transition',
      currentDepth: 1,
      investigator: {
        ...createInitialGameState().investigator,
        health: 25,
        maxHealth: 25,
      },
    };

    render(<DepthTransitionScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText(/第一深度：阿卡姆封鎖區 ➔ 第二深度：深潛者海蝕迷宮/)).toBeDefined();
    expect(screen.getByText(/修格斯幼體伏誅/)).toBeDefined();
    expect(screen.getByText(/【首領決戰復甦】肉體生命值全額回滿/)).toBeDefined();
    expect(screen.getByText(/邁向第二深度 · 深潛者海蝕迷宮/)).toBeDefined();
  });

  it('dispatches COMPLETE_DEPTH_TRANSITION when clicking proceed button', () => {
    const dispatch = vi.fn();
    const state: GameState = {
      ...createInitialGameState(),
      phase: 'depth_transition',
      currentDepth: 1,
    };

    render(<DepthTransitionScreen state={state} dispatch={dispatch} />);

    const proceedBtn = screen.getByRole('button', { name: /邁向第二深度/ });
    fireEvent.click(proceedBtn);

    expect(dispatch).toHaveBeenCalledWith({ type: 'COMPLETE_DEPTH_TRANSITION' });
  });

  it('dispatches COMPLETE_DEPTH_TRANSITION when clicking skip button', () => {
    const dispatch = vi.fn();
    const state: GameState = {
      ...createInitialGameState(),
      phase: 'depth_transition',
      currentDepth: 2,
    };

    render(<DepthTransitionScreen state={state} dispatch={dispatch} />);

    const skipBtn = screen.getByRole('button', { name: /跳過手記/ });
    fireEvent.click(skipBtn);

    expect(dispatch).toHaveBeenCalledWith({ type: 'COMPLETE_DEPTH_TRANSITION' });
  });

  it('renders transition from Depth 2 to Depth 3 with Dagon Priest defeat', () => {
    const dispatch = vi.fn();
    const state: GameState = {
      ...createInitialGameState(),
      phase: 'depth_transition',
      currentDepth: 2,
    };

    render(<DepthTransitionScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText(/第二深度：深潛者海蝕迷宮 ➔ 第三深度：無底深淵祭壇/)).toBeDefined();
    expect(screen.getByText(/大袞的深淵祭司伏誅/)).toBeDefined();
    expect(screen.getByText(/邁向第三深度 · 無底深淵祭壇/)).toBeDefined();
  });
});
