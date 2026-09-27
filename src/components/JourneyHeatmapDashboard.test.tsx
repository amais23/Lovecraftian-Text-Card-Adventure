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

    // Verify container has aria-label and can trigger scroll event
    const container = screen.getByLabelText(/全地圖七階切片多流派蒙地卡羅平衡模擬熱點地圖/i);
    expect(container).toBeDefined();
    expect(container.classList.contains('journey-heatmap-container')).toBe(true);

    // Simulate vertical scroll
    fireEvent.scroll(container, { target: { scrollTop: 500 } });

    // Verify floating scroll buttons
    const scrollToBottomBtn = screen.getByTitle(/滾動至底部/i);
    expect(scrollToBottomBtn).toBeDefined();
    fireEvent.click(scrollToBottomBtn);

    const scrollToTopBtn = screen.getByTitle(/回到頂部/i);
    expect(scrollToTopBtn).toBeDefined();
    fireEvent.click(scrollToTopBtn);
  });

  it('allows toggling between investigator and occultist occupations', () => {
    render(<JourneyHeatmapDashboard />);

    // Initially investigator is active
    const investigatorBtn = screen.getByRole('button', { name: /私家偵探/i });
    const occultistBtn = screen.getByRole('button', { name: /秘術學者/i });

    expect(investigatorBtn.classList.contains('active')).toBe(true);
    expect(occultistBtn.classList.contains('active')).toBe(false);

    // Switch to Occultist
    fireEvent.click(occultistBtn);
    expect(occultistBtn.classList.contains('active')).toBe(true);
    expect(investigatorBtn.classList.contains('active')).toBe(false);

    // Switch back to Investigator
    fireEvent.click(investigatorBtn);
    expect(investigatorBtn.classList.contains('active')).toBe(true);
  });

  it('allows switching between per-slice granular view and comprehensive 7-slice global overview', () => {
    render(<JourneyHeatmapDashboard />);

    // Switch to 7-Slice Global Overview
    const overviewBtn = screen.getByRole('button', { name: /全程 7 切片宏觀總覽/i });
    fireEvent.click(overviewBtn);

    // Verify 3 global overview blocks are rendered
    expect(screen.getByText(/7 切片全旅程進程走勢矩陣/i)).toBeDefined();
    expect(screen.getByText(/四大代理人策略流派跨切片存活率矩陣/i)).toBeDefined();
    expect(screen.getByText(/全域 26 隻敵怪綜合致死威脅天梯榜/i)).toBeDefined();

    // Click back to Slice 3
    const slice3Btn = screen.getByRole('button', { name: /Slice 3/i });
    fireEvent.click(slice3Btn);

    // Sub-tabs should be restored
    expect(screen.getByRole('button', { name: /敵怪損耗與致死統計/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /精確牌庫/i })).toBeDefined();
  });

  it('displays empty state guidance with npm run sim:journey when simulation data is empty', () => {
    const emptyData = {
      generatedAt: '',
      version: '1.0.0',
      totalRollouts: 0,
      elapsedMilliseconds: 0,
      overallSurvivalRate: 0,
      totalJourneyNetHpLoss: 0,
      progression: [],
      slices: {},
    };

    render(<JourneyHeatmapDashboard customSummaryData={emptyData} />);

    expect(screen.getByTestId('journey-empty-state')).toBeDefined();
    expect(screen.getByText(/尚無全地圖數值模擬資料/i)).toBeDefined();
    expect(screen.getByText(/npm run sim:journey/i)).toBeDefined();
  });

  it('strictly adheres to CONTEXT.md domain language: uses 生命值 and contains zero HP abbreviations in UI', () => {
    const { container } = render(<JourneyHeatmapDashboard />);

    // Verify domain term is present
    expect(screen.getAllByText(/生命值/i).length).toBeGreaterThan(0);

    // Verify no bare HP abbreviation exists in default DOM text
    expect(container.innerHTML).not.toMatch(/\bHP\b/);

    // Click through each sub-tab and verify zero bare HP abbreviations
    const subTabLabels = [/路徑與抉擇/i, /存活對比/i, /精確牌庫/i, /全卡牌效益矩陣/i, /敵怪損耗與致死統計/i];
    for (const tabPattern of subTabLabels) {
      const btn = screen.getByRole('button', { name: tabPattern });
      fireEvent.click(btn);
      expect(container.innerHTML).not.toMatch(/\bHP\b/);
    }

    // Switch to global overview and verify
    const overviewBtn = screen.getByRole('button', { name: /全程 7 切片宏觀總覽/i });
    fireEvent.click(overviewBtn);
    expect(container.innerHTML).not.toMatch(/\bHP\b/);
    expect(screen.getByText(/末均生命值/i)).toBeDefined();
  });
});
