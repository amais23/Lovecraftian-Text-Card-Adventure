import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DepartureScreen } from './DepartureScreen';
import type { GameState } from '../types/game';
import { createInitialGameState } from '../engine/gameReducer';
import { OCCUPATIONS } from '../engine/initialData';
import { soundEngine } from '../engine/audioManager';

describe('DepartureScreen (Issue #13)', () => {
  it('renders Edward Pierce specific departure narrative and elements', () => {
    const mockDispatch = vi.fn();
    const gunSpy = vi.spyOn(soundEngine, 'playGunCock').mockImplementation(() => {});
    const engineSpy = vi.spyOn(soundEngine, 'playEngineStart').mockImplementation(() => {});

    const state: GameState = {
      ...createInitialGameState(),
      phase: 'departure',
      investigator: {
        name: OCCUPATIONS.investigator.name,
        occupation: OCCUPATIONS.investigator.occupation,
        occupationId: 'investigator',
        health: 25,
        maxHealth: 25,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 15,
      },
    };

    render(<DepartureScreen state={state} dispatch={mockDispatch} />);

    expect(screen.getByText(/雨夜啟程 · 破霧而行/i)).toBeDefined();
    expect(screen.getByText(/愛德華·皮爾斯/i)).toBeDefined();

    const portrait = screen.getByTestId('departure-hero-portrait') as HTMLImageElement;
    expect(portrait).toBeDefined();
    expect(portrait.src).toContain('/occupations/portrait_investigator.webp');

    gunSpy.mockRestore();
    engineSpy.mockRestore();
  });

  it('renders Eleanor Vance specific departure narrative and elements', () => {
    const mockDispatch = vi.fn();
    const astralSpy = vi.spyOn(soundEngine, 'playAstralHum').mockImplementation(() => {});

    const state: GameState = {
      ...createInitialGameState(),
      phase: 'departure',
      investigator: {
        name: OCCUPATIONS.occultist.name,
        occupation: OCCUPATIONS.occultist.occupation,
        occupationId: 'occultist',
        health: 25,
        maxHealth: 25,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 20,
      },
    };

    render(<DepartureScreen state={state} dispatch={mockDispatch} />);

    expect(screen.getByText(/星扉初啟 · 銀鑰生輝/i)).toBeDefined();
    expect(screen.getByText(/艾蓮諾·凡斯/i)).toBeDefined();

    const portrait = screen.getByTestId('departure-hero-portrait') as HTMLImageElement;
    expect(portrait).toBeDefined();
    expect(portrait.src).toContain('/occupations/portrait_occultist.webp');

    astralSpy.mockRestore();
  });

  it('dispatches COMPLETE_DEPARTURE on clicking enter map button', () => {
    const mockDispatch = vi.fn();
    const state: GameState = {
      ...createInitialGameState(),
      phase: 'departure',
    };

    render(<DepartureScreen state={state} dispatch={mockDispatch} />);

    const enterBtn = screen.getByRole('button', { name: /踏入調查地圖/i });
    fireEvent.click(enterBtn);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'COMPLETE_DEPARTURE' });
  });

  it('dispatches COMPLETE_DEPARTURE on clicking skip button', () => {
    const mockDispatch = vi.fn();
    const state: GameState = {
      ...createInitialGameState(),
      phase: 'departure',
    };

    render(<DepartureScreen state={state} dispatch={mockDispatch} />);

    const skipBtn = screen.getByRole('button', { name: /跳過過場/i });
    fireEvent.click(skipBtn);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'COMPLETE_DEPARTURE' });
  });
});
