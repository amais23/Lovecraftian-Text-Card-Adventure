import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TitleMenu } from './TitleMenu';
import { devModeManager } from '../engine/devModeManager';

describe('TitleMenu - Dev Mode Conditional Entry (ADR-0036 / #62)', () => {
  const defaultProps = {
    onStartNewGame: vi.fn(),
    onOpenManual: vi.fn(),
    onOpenCompendium: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenExit: vi.fn(),
    onOpenCardReview: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    devModeManager.setDevMode(false);
  });

  it('hides the Card Review Lab button when dev mode is disabled by default', () => {
    render(<TitleMenu {...defaultProps} isDevMode={false} />);

    expect(screen.queryByRole('button', { name: /卡牌改動審查室/i })).toBeNull();
    expect(screen.queryByText(/卡牌改動審查室/i)).toBeNull();
  });

  it('displays the Card Review Lab button when dev mode is enabled and triggers callback on click', () => {
    render(<TitleMenu {...defaultProps} isDevMode={true} />);

    const reviewBtn = screen.getByRole('button', { name: /卡牌改動審查室/i });
    expect(reviewBtn).toBeDefined();

    fireEvent.click(reviewBtn);
    expect(defaultProps.onOpenCardReview).toHaveBeenCalledTimes(1);
  });

  it('reads reactive dev mode state from useDevMode hook when isDevMode prop is omitted', () => {
    render(<TitleMenu {...defaultProps} />);

    // Default: false
    expect(screen.queryByRole('button', { name: /卡牌改動審查室/i })).toBeNull();

    // Toggle dev mode via devModeManager
    act(() => {
      devModeManager.setDevMode(true);
    });

    const reviewBtn = screen.getByRole('button', { name: /卡牌改動審查室/i });
    expect(reviewBtn).toBeDefined();

    fireEvent.click(reviewBtn);
    expect(defaultProps.onOpenCardReview).toHaveBeenCalledTimes(1);
  });
});
