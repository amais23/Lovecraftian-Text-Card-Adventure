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

describe('MapScreen Component (Issue #43 / ADR-0022)', () => {
  it('renders 16 layers of nodes for Depth 1 map with Mid-Depth Haven on Layer 8', () => {
    const state = createMockMapState(1);
    const dispatch = vi.fn();

    render(<MapScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText('第一深度：阿卡姆封鎖區 · 調查路線圖')).toBeDefined();
    expect(screen.getByText(/進度 1 \/ 16 層/)).toBeDefined();

    // Verify 16 layer indicators are displayed
    for (let i = 1; i <= 16; i++) {
      expect(screen.getAllByText(`層級 ${i}`).length).toBeGreaterThanOrEqual(1);
    }

    // Verify Mid-Depth Haven (Layer 8) badge is displayed
    expect(screen.getByText(/豐饒中繼站/)).toBeDefined();

    // Verify Boss layer tag is displayed
    expect(screen.getAllByText(/舊日宿敵/).length).toBeGreaterThanOrEqual(1);

    // Verify SVG bezier connection paths are rendered
    const svgPaths = document.querySelectorAll('.map-connections-svg path');
    expect(svgPaths.length).toBeGreaterThan(0);

    // Verify accessible nodes have the candle-breathing micro-glow class
    const accessibleNodes = document.querySelectorAll('.map-node-card.accessible.candle-breathing');
    expect(accessibleNodes.length).toBeGreaterThan(0);
  });

  it('renders 8 layers of nodes for Depth 4 final map', () => {
    const state = createMockMapState(4);
    const dispatch = vi.fn();

    render(<MapScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText('第四深度：星辰正位 · 拉萊耶核心 · 終局之圖')).toBeDefined();
    expect(screen.getByText(/進度 1 \/ 8 層/)).toBeDefined();

    // Verify 8 layer indicators are displayed
    for (let i = 1; i <= 8; i++) {
      expect(screen.getAllByText(`層級 ${i}`).length).toBeGreaterThanOrEqual(1);
    }
    expect(screen.queryByText('層級 9')).toBeNull();

    // Verify SVG bezier connection paths are rendered
    const svgPaths = document.querySelectorAll('.map-connections-svg path');
    expect(svgPaths.length).toBeGreaterThan(0);
  });

  it('dispatches NAVIGATE_TO_NODE when clicking on an accessible node with candle breathing glow', () => {
    const state = createMockMapState(1);
    const dispatch = vi.fn();

    render(<MapScreen state={state} dispatch={dispatch} />);

    // Layer 0 node_0_0 is accessible by default
    const entryNode = document.getElementById('map-node-node_0_0');
    expect(entryNode).toBeDefined();
    expect(entryNode?.classList.contains('accessible')).toBe(true);
    expect(entryNode?.classList.contains('candle-breathing')).toBe(true);

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
