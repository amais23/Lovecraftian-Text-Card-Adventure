import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BalanceMatrixDashboard } from './BalanceMatrixDashboard';
import balanceData from '../data/balance/balance_summary_data.json';

describe('BalanceMatrixDashboard (ADR-0036 / #65)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders overview header and dual-dimension scatter plot canvas/SVG', () => {
    render(<BalanceMatrixDashboard />);

    // Check title and simulation statistics
    expect(screen.getByText('全量平衡性評測與數值矩陣')).toBeDefined();
    expect(screen.getByText(/總模擬場次/)).toBeDefined();

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
    expect(screen.getByText(/劣勢威脅敵怪/)).toBeDefined();
    const revolverData = balanceData.cards['card_revolver_1'];
    if (revolverData && revolverData.favorableEnemies.length > 0) {
      expect(screen.getByText(new RegExp(revolverData.favorableEnemies[0].name))).toBeDefined();
    }
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

  it('filters cards by occupation (investigator, occultist, neutral)', () => {
    render(<BalanceMatrixDashboard />);

    const occupationSelect = screen.getByLabelText(/職業/);
    const itemsGrid = screen.getByTestId('balance-items-grid');

    // Filter by investigator
    fireEvent.change(occupationSelect, { target: { value: 'investigator' } });
    expect(itemsGrid.textContent).toContain('左輪射擊');
    expect(itemsGrid.textContent).not.toContain('靈能衝擊');

    // Filter by occultist
    fireEvent.change(occupationSelect, { target: { value: 'occultist' } });
    expect(itemsGrid.textContent).toContain('靈能衝擊');
    expect(itemsGrid.textContent).not.toContain('左輪射擊');

    // Filter by neutral
    fireEvent.change(occupationSelect, { target: { value: 'neutral' } });
    expect(itemsGrid.textContent).toContain('盲目爪擊');
    expect(itemsGrid.textContent).not.toContain('左輪射擊');
    expect(itemsGrid.textContent).not.toContain('靈能衝擊');
  });

  it('renders SVG hexagonal radar chart and copies benefit line chart for selected card', () => {
    render(<BalanceMatrixDashboard />);

    // Select card "左輪射擊"
    fireEvent.click(screen.getAllByText('左輪射擊')[0]);

    // Archetype radar chart should exist and render SVG polygon
    const radar = screen.getByTestId('archetype-radar-chart');
    expect(radar).toBeDefined();
    const radarSvg = radar.querySelector('svg.radar-svg');
    expect(radarSvg).not.toBeNull();
    const dataPolygon = radar.querySelector('polygon.radar-data-polygon');
    expect(dataPolygon).not.toBeNull();

    // Copies benefit line chart should exist and render SVG polylines
    const lineChart = screen.getByTestId('copies-benefit-line-chart');
    expect(lineChart).toBeDefined();
    const lineSvg = lineChart.querySelector('svg.copies-line-svg');
    expect(lineSvg).not.toBeNull();
    const curves = lineChart.querySelectorAll('polyline.copies-curve');
    expect(curves.length).toBe(2); // score curve and winrate curve
  });

  it('renders SVG hexagonal radar chart and copies benefit line chart for selected relic', () => {
    render(<BalanceMatrixDashboard />);

    // Switch to relics
    fireEvent.click(screen.getByRole('button', { name: /舊日遺物/i }));
    fireEvent.click(screen.getAllByText('古神之印護符')[0]);

    // Archetype radar chart should exist for relic
    const radar = screen.getByTestId('archetype-radar-chart');
    expect(radar).toBeDefined();

    // Copies benefit line chart should exist for relic
    const lineChart = screen.getByTestId('copies-benefit-line-chart');
    expect(lineChart).toBeDefined();
  });

  it('filters relics by tier and archetype on scatter plot and list', () => {
    render(<BalanceMatrixDashboard />);

    // Switch to relics
    fireEvent.click(screen.getByRole('button', { name: /舊日遺物/i }));
    const itemsGrid = screen.getByTestId('balance-items-grid');

    // Filter by rarity "common"
    const tierSelect = screen.getByLabelText(/階級/);
    fireEvent.change(tierSelect, { target: { value: 'common' } });
    expect(itemsGrid.textContent).toContain('古神之印護符'); // common
    expect(itemsGrid.textContent).not.toContain('黃銅懷錶'); // rare

    // Filter by archetype "armor_counter"
    const archSelect = screen.getByLabelText(/最適流派/);
    fireEvent.change(archSelect, { target: { value: 'armor_counter' } });
    expect(itemsGrid.textContent).toContain('古神之印護符');
    expect(itemsGrid.textContent).not.toContain('黃銅懷錶');
  });

  it('strictly adheres to domain health terminology without forbidden terms', () => {
    const { container } = render(<BalanceMatrixDashboard />);

    // Check scatter & inspector view
    const scatterHtml = container.innerHTML;
    expect(scatterHtml).not.toMatch(/\bHP\b/i);
    expect(scatterHtml).not.toContain('血量');
    expect(scatterHtml).not.toContain('掉血');

    // Switch to enemies leaderboard tab
    const enemyTabBtn = screen.getByRole('button', { name: /敵怪威脅排行榜/i });
    fireEvent.click(enemyTabBtn);

    const enemyHtml = container.innerHTML;
    expect(enemyHtml).not.toMatch(/\bHP\b/i);
    expect(enemyHtml).not.toContain('血量');
    expect(enemyHtml).not.toContain('掉血');
  });

  describe('ADR-0038: Deck Topology MDS Scatter & Emergent Archetypes', () => {
    it('switches to topology tab and renders MDS scatter plot with nodes and color bar', () => {
      render(<BalanceMatrixDashboard />);

      // Switch to topology tab
      const topologyTabBtn = screen.getByRole('button', { name: /自然流派拓撲生態/i });
      fireEvent.click(topologyTabBtn);

      // Verify topology view and scatter SVG
      expect(screen.getByTestId('balance-topology-view')).toBeDefined();
      expect(screen.getByTestId('topology-scatter-card')).toBeDefined();
      expect(screen.getByTestId('topology-inspector-card')).toBeDefined();

      // Verify scientific heatmap color bar and ticks
      const colorBar = screen.getByTestId('topology-color-bar');
      expect(colorBar).toBeDefined();
      expect(screen.getByText(/0 分 \(弱勢組合 \/ 冰藍\)/)).toBeDefined();
      expect(screen.getByText(/50 分 \(中位平衡 \/ 青綠\)/)).toBeDefined();
      expect(screen.getByText(/100 分 \(頂級強勢 \/ 明黃\)/)).toBeDefined();

      // Verify presence of representative deck nodes
      const sampleNode = screen.getByTestId('deck-node-deck_node_1');
      expect(sampleNode).toBeDefined();
    });

    it('inspects a deck node displaying card breakdown, metrics, and driving combos', () => {
      render(<BalanceMatrixDashboard />);

      // Switch to topology tab
      fireEvent.click(screen.getByRole('button', { name: /自然流派拓撲生態/i }));

      // Click node 1
      const node1 = screen.getByTestId('deck-node-deck_node_1');
      fireEvent.click(node1);

      const inspector = screen.getByTestId('topology-inspector-card');
      expect(inspector.textContent).toContain('雙軸綜合評分');
      expect(inspector.textContent).toContain('對弈勝率');
      expect(inspector.textContent).toContain('平均生命損失');
      expect(inspector.textContent).toContain('平均心智消耗');
      expect(inspector.textContent).toContain('牌庫卡表明細');
    });

    it('supports Diff mode toggling and side-by-side comparison between two decks', () => {
      render(<BalanceMatrixDashboard />);

      // Switch to topology tab
      fireEvent.click(screen.getByRole('button', { name: /自然流派拓撲生態/i }));

      // Toggle Diff mode checkbox
      const diffCheckbox = screen.getByLabelText(/啟用 Diff 雙套牌庫對比模式/i);
      fireEvent.click(diffCheckbox);

      // Select Deck 1 as A
      fireEvent.click(screen.getByTestId('deck-node-deck_node_1'));

      // Prompt banner should prompt selecting 2nd deck
      expect(screen.getByText(/請在左側星系散布圖點選第二套牌庫/)).toBeDefined();

      // Select Deck 2 as B
      fireEvent.click(screen.getByTestId('deck-node-deck_node_2'));

      // Diff comparison view should now appear
      const diffView = screen.getByTestId('diff-comparison-view');
      expect(diffView).toBeDefined();
      expect(screen.getAllByText('牌庫 A').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('牌庫 B').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('差值 (A - B)')).toBeDefined();
      expect(screen.getByText(/卡牌構成差異分析/)).toBeDefined();
    });

    it('filters deck nodes by emergent archetype', () => {
      render(<BalanceMatrixDashboard />);

      // Switch to topology tab
      fireEvent.click(screen.getByRole('button', { name: /自然流派拓撲生態/i }));

      const archSelect = screen.getByLabelText(/自然湧現流派過濾/i) as HTMLSelectElement;
      expect(archSelect).toBeDefined();

      // Select the first emergent archetype
      const firstArchOption = archSelect.options[1];
      if (firstArchOption) {
        fireEvent.change(archSelect, { target: { value: firstArchOption.value } });
        expect(archSelect.value).toBe(firstArchOption.value);
      }
    });

    it('strictly adheres to domain health terminology in topology view without forbidden terms', () => {
      const { container } = render(<BalanceMatrixDashboard />);

      // Switch to topology tab
      fireEvent.click(screen.getByRole('button', { name: /自然流派拓撲生態/i }));

      const topologyHtml = container.innerHTML;
      expect(topologyHtml).not.toMatch(/\bHP\b/i);
      expect(topologyHtml).not.toContain('血量');
      expect(topologyHtml).not.toContain('掉血');
      expect(topologyHtml).toContain('點生命');
    });
  });
});
