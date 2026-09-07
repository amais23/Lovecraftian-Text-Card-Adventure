import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapScreen } from './MapScreen';
import { generateInvestigationMap } from '../engine/mapGenerator';
import { INITIAL_INVESTIGATOR, INITIAL_GHOUL } from '../engine/initialData';
import type { GameState } from '../types/game';

function createMockMapState(depth: 1 | 2 | 3 | 4 = 1): GameState {
  const map = generateInvestigationMap({ depth });
  return {
    phase: 'map',
    currentDepth: depth,
    turn: 1,
    investigator: { ...INITIAL_INVESTIGATOR },
    sanityDeck: [],
    hand: [],
    discardPile: [],
    isMadness: false,
    currentEnemy: { ...INITIAL_GHOUL },
    battleLog: [],
    map,
  };
}

describe('MapScreen Component (Issue #26)', () => {
  it('renders 6 layers of nodes for Depth 1 map', () => {
    const state = createMockMapState(1);
    const dispatch = vi.fn();

    render(<MapScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText('第一深度：阿卡姆封鎖區 · 調查路線圖')).toBeDefined();
    expect(screen.getByText(/進度 1 \/ 6 層/)).toBeDefined();

    // Verify 6 layer indicators are displayed
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByText(`層級 ${i}`)).toBeDefined();
    }

    // Verify all 16 node cards are rendered
    const nodeCards = document.querySelectorAll('.map-node-card');
    expect(nodeCards.length).toBe(16);

    // Verify SVG connection lines are rendered
    const svgLines = document.querySelectorAll('.map-connections-svg line');
    expect(svgLines.length).toBeGreaterThan(0);
  });

  it('renders 4 layers of nodes for Depth 4 final map', () => {
    const state = createMockMapState(4);
    const dispatch = vi.fn();

    render(<MapScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText('第四深度：星辰正位 · 拉萊耶核心 · 終局之圖')).toBeDefined();
    expect(screen.getByText(/進度 1 \/ 4 層/)).toBeDefined();

    // Verify 4 layer indicators are displayed
    for (let i = 1; i <= 4; i++) {
      expect(screen.getByText(`層級 ${i}`)).toBeDefined();
    }
    expect(screen.queryByText('層級 5')).toBeNull();

    // Verify 8 node cards are rendered
    const nodeCards = document.querySelectorAll('.map-node-card');
    expect(nodeCards.length).toBe(8);
  });

  it('dispatches NAVIGATE_TO_NODE when clicking on an accessible node', () => {
    const state = createMockMapState(1);
    const dispatch = vi.fn();

    render(<MapScreen state={state} dispatch={dispatch} />);

    // Layer 0 node_0_0 is accessible by default
    const entryNode = document.getElementById('map-node-node_0_0');
    expect(entryNode).toBeDefined();
    expect(entryNode?.classList.contains('accessible')).toBe(true);

    fireEvent.click(entryNode!);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: 'node_0_0' },
    });
  });

  it('does not dispatch NAVIGATE_TO_NODE when clicking on unvisited inaccessible node', () => {
    const state = createMockMapState(1);
    const dispatch = vi.fn();

    render(<MapScreen state={state} dispatch={dispatch} />);

    // Layer 1 node_1_0 is unvisited and inaccessible initially
    const lockedNode = document.getElementById('map-node-node_1_0');
    expect(lockedNode).toBeDefined();
    expect(lockedNode?.classList.contains('unvisited')).toBe(true);

    fireEvent.click(lockedNode!);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('renders the cinematic Arkham cartographic chart background layer (ADR-0020)', () => {
    const state = createMockMapState(1);
    const dispatch = vi.fn();
    render(<MapScreen state={state} dispatch={dispatch} />);

    const bgImage = screen.getByTestId('map-screen-bg-image');
    expect(bgImage).toBeDefined();
  });
});
