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

  it('supports touch drag gestures for vertical parchment scrolling (ADR-0022)', () => {
    const state = createMockMapState(1);
    const dispatch = vi.fn();
    const { container } = render(<MapScreen state={state} dispatch={dispatch} />);

    const viewport = container.querySelector('.map-viewport.vertical-parchment-scroll');
    expect(viewport).toBeDefined();

    // Trigger touch start, move, and end
    fireEvent.touchStart(viewport!, {
      touches: [{ clientY: 300 }],
    });
    expect(viewport?.classList.contains('is-dragging')).toBe(true);

    fireEvent.touchMove(viewport!, {
      touches: [{ clientY: 200 }],
    });

    fireEvent.touchEnd(viewport!);
    expect(viewport?.classList.contains('is-dragging')).toBe(false);
  });

  it('renders SVG connection paths spanning full vertical parchment height without truncation', () => {
    const state = createMockMapState(1);
    const dispatch = vi.fn();
    const { container } = render(<MapScreen state={state} dispatch={dispatch} />);

    const svg = container.querySelector('svg.map-connections-svg') as SVGSVGElement;
    expect(svg).toBeDefined();
    expect(svg.classList.contains('map-connections-svg')).toBe(true);

    // Initial safe fallback height must scale to 16 layers (16 * 140 = 2240px) rather than truncating at 100%
    expect(svg.style.height).toBe(`${16 * 140}px`);

    const paths = Array.from(svg.querySelectorAll('path'));
    expect(paths.length).toBeGreaterThanOrEqual(15);

    // Verify all generated SVG paths contain valid cubic bezier curves M x y C cx1 cy1, cx2 cy2, x y
    const startYValues: number[] = [];
    const endYValues: number[] = [];

    for (const path of paths) {
      const d = path.getAttribute('d') ?? '';
      const match = d.match(/^M\s+(\d+)\s+(\d+)\s+C\s+(\d+)\s+(\d+),\s+(\d+)\s+(\d+),\s+(\d+)\s+(\d+)$/);
      expect(match, `Path d="${d}" must match cubic bezier format`).not.toBeNull();
      if (match) {
        startYValues.push(Number(match[2]));
        endYValues.push(Number(match[8]));
      }
    }

    // Verify paths span from bottom entry (y > 2000) to top boss (y < 200)
    const minY = Math.min(...startYValues, ...endYValues);
    const maxY = Math.max(...startYValues, ...endYValues);
    expect(minY).toBeLessThan(200);
    expect(maxY).toBeGreaterThan(2000);
  });
});
