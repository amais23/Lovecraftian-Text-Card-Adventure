import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OccupationSelect } from './OccupationSelect';

describe('OccupationSelect (Issue #13)', () => {
  it('renders both investigators with complete 12 starting cards and attributes', () => {
    const handleBack = vi.fn();
    const handleSelect = vi.fn();

    render(
      <OccupationSelect
        onBackToMenu={handleBack}
        onSelectOccupation={handleSelect}
      />
    );

    // Investigator 1: Edward Pierce
    expect(screen.getByText('愛德華·皮爾斯 (Edward Pierce)')).toBeDefined();
    expect(screen.getByText('私家偵探')).toBeDefined();
    expect(screen.getAllByText('生命值 25').length).toBe(2);
    expect(screen.getAllByText('精力 3').length).toBe(2);
    expect(screen.getByText('古金幣 15')).toBeDefined();
    expect(screen.getByText(/專屬起始卡牌（12 張 · 物理生存）/i)).toBeDefined();

    // 12 cards inspection list for Pierce
    const pierceDeckSection = screen.getByLabelText('愛德華·皮爾斯起始卡牌清單');
    expect(pierceDeckSection).toBeDefined();
    expect(pierceDeckSection.children.length).toBe(12);

    // Investigator 2: Eleanor Vance
    expect(screen.getByText('艾蓮諾·凡斯 (Eleanor Vance)')).toBeDefined();
    expect(screen.getByText('秘術學者')).toBeDefined();
    expect(screen.getByText('古金幣 20')).toBeDefined();
    expect(screen.getByText(/專屬起始卡牌（12 張 · 秘術真相）/i)).toBeDefined();

    // 12 cards inspection list for Vance
    const vanceDeckSection = screen.getByLabelText('艾蓮諾·凡斯起始卡牌清單');
    expect(vanceDeckSection).toBeDefined();
    expect(vanceDeckSection.children.length).toBe(12);
  });

  it('triggers onSelectOccupation when selecting Edward Pierce or Eleanor Vance', () => {
    const handleBack = vi.fn();
    const handleSelect = vi.fn();

    render(
      <OccupationSelect
        onBackToMenu={handleBack}
        onSelectOccupation={handleSelect}
      />
    );

    // Choose Edward Pierce
    const choosePierceBtn = screen.getByRole('button', { name: /啟程調查/i });
    fireEvent.click(choosePierceBtn);
    expect(handleSelect).toHaveBeenCalledWith('investigator');

    // Choose Eleanor Vance
    const chooseVanceBtn = screen.getByRole('button', { name: /啟動秘儀/i });
    fireEvent.click(chooseVanceBtn);
    expect(handleSelect).toHaveBeenCalledWith('occultist');
  });

  it('triggers onBackToMenu when clicking back button', () => {
    const handleBack = vi.fn();
    const handleSelect = vi.fn();

    render(
      <OccupationSelect
        onBackToMenu={handleBack}
        onSelectOccupation={handleSelect}
      />
    );

    const backBtn = screen.getByRole('button', { name: /返回主選單/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('opens card detail modal when clicking on a starting card chip without selecting occupation', () => {
    const handleBack = vi.fn();
    const handleSelect = vi.fn();

    render(
      <OccupationSelect
        onBackToMenu={handleBack}
        onSelectOccupation={handleSelect}
      />
    );

    // Find and click a starting card chip
    const cardChips = screen.getAllByText('左輪射擊');
    fireEvent.click(cardChips[0]);

    // onSelectOccupation must NOT have been called
    expect(handleSelect).not.toHaveBeenCalled();

    // Modal should be displayed with card details
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText('調查員起始武裝：')).toBeDefined();

    // Close the modal
    const closeBtn = screen.getByLabelText('關閉卡牌詳情');
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders split-column layout with 3:4 character portraits (ADR-0020)', () => {
    const handleBack = vi.fn();
    const handleSelect = vi.fn();

    render(
      <OccupationSelect
        onBackToMenu={handleBack}
        onSelectOccupation={handleSelect}
      />
    );

    // Verify split-layout class on cards
    const pierceCard = document.getElementById('select-investigator-card');
    const vanceCard = document.getElementById('select-occultist-card');
    expect(pierceCard?.classList.contains('split-layout')).toBe(true);
    expect(vanceCard?.classList.contains('split-layout')).toBe(true);

    // Verify portraits
    const piercePortrait = screen.getByTestId('portrait-investigator') as HTMLImageElement;
    const vancePortrait = screen.getByTestId('portrait-occultist') as HTMLImageElement;
    expect(piercePortrait).toBeDefined();
    expect(piercePortrait.src).toContain('/occupations/portrait_investigator.webp');
    expect(vancePortrait).toBeDefined();
    expect(vancePortrait.src).toContain('/occupations/portrait_occultist.webp');
  });
});
