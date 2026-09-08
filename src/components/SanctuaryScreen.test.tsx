import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SanctuaryScreen } from './SanctuaryScreen';
import { createInitialCombatState } from '../engine/gameReducer';
import { generateInvestigationMap } from '../engine/mapGenerator';
import type { GameState } from '../types/game';

describe('SanctuaryScreen Component (Issue #45 / ADR-0023)', () => {
  it('renders regular sanctuary with 8 HP recovery text and handles bandage action', () => {
    const map = generateInvestigationMap({ depth: 1 });
    // Pick regular sanctuary at layer 2
    const regularSanctuaryNodeId = 'node_2_1';

    const state: GameState = {
      ...createInitialCombatState(),
      phase: 'sanctuary',
      currentDepth: 1,
      investigator: {
        ...createInitialCombatState().investigator,
        health: 12,
        maxHealth: 25,
        obols: 10,
      },
      map: {
        ...map,
        currentNodeId: regularSanctuaryNodeId,
      },
      sanctuaryUsed: false,
    };

    const dispatch = vi.fn();
    render(<SanctuaryScreen state={state} dispatch={dispatch} />);

    // Header title for regular sanctuary
    expect(screen.getByText('安全避難所 · 守墓人小屋')).toBeTruthy();
    expect(screen.getByText('深層縫合與包紮')).toBeTruthy();
    expect(screen.getByText(/恢復 8 點肉體生命值/)).toBeTruthy();

    const bandageBtn = screen.getByRole('button', { name: /執行包紮 · 耗 5 古金幣/ });
    expect(bandageBtn).toBeTruthy();

    fireEvent.click(bandageBtn);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'USE_SANCTUARY',
      payload: { optionId: 'bandage' },
    });
  });

  it('renders Mid-Depth Haven sanctuary on Layer 8 with 15 HP recovery text and haven presentation', () => {
    const map = generateInvestigationMap({ depth: 1 });
    // Pick Layer 8 node (Mid-Depth Haven)
    const havenNodeId = map.layers[8][0];

    const state: GameState = {
      ...createInitialCombatState(),
      phase: 'sanctuary',
      currentDepth: 1,
      investigator: {
        ...createInitialCombatState().investigator,
        health: 8,
        maxHealth: 25,
        obols: 10,
      },
      map: {
        ...map,
        currentNodeId: havenNodeId,
      },
      sanctuaryUsed: false,
    };

    const dispatch = vi.fn();
    const { container } = render(<SanctuaryScreen state={state} dispatch={dispatch} />);

    // Haven panel class applied
    expect(container.querySelector('.haven-panel')).toBeTruthy();

    // Header title for Mid-Depth Haven
    expect(screen.getByText('【第 8 層中繼避難所 · 豐饒安全屋】')).toBeTruthy();
    expect(screen.getByText('深層重度休整與外科縫合')).toBeTruthy();
    expect(screen.getByText(/深層重度縫合恢復 15 點肉體生命值/)).toBeTruthy();

    const havenBandageBtn = screen.getByRole('button', { name: /執行重度休整 · 耗 5 古金幣/ });
    expect(havenBandageBtn).toBeTruthy();

    fireEvent.click(havenBandageBtn);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'USE_SANCTUARY',
      payload: { optionId: 'bandage' },
    });
  });
});
