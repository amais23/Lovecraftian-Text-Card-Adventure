import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JourneyHeatmapDashboard } from './JourneyHeatmapDashboard';
import { CardReviewLab } from './CardReviewLab';

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe('JourneyHeatmapDashboard - ADR-0042 Slice 4 Visualization (Issue #90)', () => {
  it('renders top progression timeline and persona breakdown snapshot', () => {
    render(<JourneyHeatmapDashboard />);

    // 1. Verify Top Progression Section
    expect(screen.getByText(/七階切片宏觀進程走勢/i)).toBeDefined();
    expect(screen.getAllByText(/Slice 1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Slice 7/i).length).toBeGreaterThan(0);

    // 2. Verify Persona Cards
    expect(screen.getByText(/常態平衡型/i)).toBeDefined();
    expect(screen.getByText(/生存謹慎型/i)).toBeDefined();
    expect(screen.getByText(/貪婪構築型/i)).toBeDefined();
    expect(screen.getByText(/純隨機探索型/i)).toBeDefined();
  });

  it('allows clicking slice tabs to switch between Slice 1 and Slice 2', () => {
    render(<JourneyHeatmapDashboard />);

    const slice2Btn = screen.getByRole('button', { name: /Slice 2/i });
    fireEvent.click(slice2Btn);

    // Verify Slice 2 header or role
    expect(screen.getByText(/第一深度決戰/i)).toBeDefined();
  });

  it('switches between sub-tabs within a slice', () => {
    render(<JourneyHeatmapDashboard />);

    // Sub-tab: 精確牌庫
    const deckSubTab = screen.getByRole('button', { name: /精確牌庫/i });
    fireEvent.click(deckSubTab);
    expect(screen.getByText(/理智牌庫張數/i)).toBeDefined();

    // Sub-tab: 路徑抉擇
    const pathSubTab = screen.getByRole('button', { name: /路徑與抉擇/i });
    fireEvent.click(pathSubTab);
    expect(screen.getByText(/地圖拓撲前進路徑分支選擇/i)).toBeDefined();

    // Sub-tab: 存活對比
    const compSubTab = screen.getByRole('button', { name: /存活對比/i });
    fireEvent.click(compSubTab);
    expect(screen.getByText(/雙群組對比統計分析/i)).toBeDefined();
  });

  it('integrates seamlessly into CardReviewLab as the 4th tab', () => {
    render(<CardReviewLab onClose={vi.fn()} />);

    // Verify 4th tab button is present
    const journeyTabBtn = screen.getByRole('button', { name: /全地圖數值熱點地圖/i });
    expect(journeyTabBtn).toBeDefined();

    // Click 4th tab
    fireEvent.click(journeyTabBtn);

    // Verify heatmap dashboard is rendered
    expect(screen.getByText(/七階切片宏觀進程走勢/i)).toBeDefined();
  });
});
