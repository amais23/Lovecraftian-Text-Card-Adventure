import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BalanceMatrixDashboard } from './BalanceMatrixDashboard';

describe('BalanceMatrixDashboard (ADR-0036 / #65)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders overview header and dual-dimension scatter plot canvas/SVG', () => {
    render(<BalanceMatrixDashboard />);

    // Check title and simulation statistics
    expect(screen.getByText('全量平衡性評測與數值矩陣')).toBeDefined();
    expect(screen.getByText(/37,064/)).toBeDefined();

    // Check dual-dimension axes labels
    expect(screen.getAllByText(/肉體生存分/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/心智效率分/).length).toBeGreaterThanOrEqual(1);

    // Scatter plot element
    const scatterPlot = screen.getByTestId('balance-scatter-plot');
    expect(scatterPlot).toBeDefined();
  });

  it('filters scatter points by card category (e.g., combat cards)', () => {
    render(<BalanceMatrixDashboard />);

    // Initially cards list has left-side cards or scatter points
    const combatFilterBtn = screen.getByRole('button', { name: /紅色戰鬥/i });
    fireEvent.click(combatFilterBtn);

    // Left-side card list should contain combat card "左輪射擊"
    expect(screen.getAllByText('左輪射擊').length).toBeGreaterThanOrEqual(1);
    // Non-combat card "心智防波堤" should be filtered out
    expect(screen.queryByText('心智防波堤')).toBeNull();
  });

  it('selects a card and displays its copies curve, archetype synergies, and enemy matchups', () => {
    render(<BalanceMatrixDashboard />);

    // Find and click on "左輪射擊"
    const revolverItem = screen.getAllByText('左輪射擊')[0];
    fireEvent.click(revolverItem);

    // Detail inspector panel
    const detailPanel = screen.getByTestId('balance-detail-inspector');
    expect(detailPanel).toBeDefined();

    // Check copies curve (1x, 2x, 3x)
    expect(screen.getAllByText(/1x 重複/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/2x 重複/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/3x 重複/).length).toBeGreaterThanOrEqual(1);

    // Check archetype synergy section
    expect(screen.getByText(/六大流派協同倍率/)).toBeDefined();
    expect(screen.getAllByText(/護甲反擊/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/流血穿刺/).length).toBeGreaterThanOrEqual(1);

    // Check matchup lists
    expect(screen.getByText(/優勢剋制敵怪/)).toBeDefined();
    expect(screen.getByText(/阿卡姆異教徒/)).toBeDefined();
  });

  it('toggles target type to relics and inspects relic balance report', () => {
    render(<BalanceMatrixDashboard />);

    // Switch to relics
    const relicTypeBtn = screen.getByRole('button', { name: /舊日遺物/i });
    fireEvent.click(relicTypeBtn);

    // Expect relic "古神之印護符" to be visible
    expect(screen.getAllByText('古神之印護符').length).toBeGreaterThanOrEqual(1);

    // Click relic to inspect
    fireEvent.click(screen.getAllByText('古神之印護符')[0]);

    // Relic copies curve from 0x to 3x
    expect(screen.getAllByText(/0x 持有/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/3x 持有/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/邊際效益/)).toBeDefined();
  });

  it('displays the 26-enemy threat leaderboard with ranks and counters, and supports depth filtering', () => {
    render(<BalanceMatrixDashboard />);

    // Switch to enemy threat leaderboard tab/section
    const enemyTabBtn = screen.getByRole('button', { name: /敵怪威脅排行榜/i });
    fireEvent.click(enemyTabBtn);

    const leaderboard = screen.getByTestId('enemy-threat-leaderboard');
    expect(leaderboard).toBeDefined();

    // Top ranked threat enemy
    expect(screen.getByText('星辰古神侍從')).toBeDefined();
    expect(screen.getAllByText(/威脅指數/).length).toBeGreaterThanOrEqual(1);

    // Filter by Depth 1
    const depth1Btn = screen.getByRole('button', { name: /第一深度/i });
    fireEvent.click(depth1Btn);

    // Depth 1 monsters should be visible
    expect(screen.getByText('阿卡姆異教徒')).toBeDefined();
    expect(screen.getByText('牆中變異鼠群')).toBeDefined();
    // Depth 4 monster should not be visible
    expect(screen.queryByText('星辰古神侍從')).toBeNull();
  });
});
