import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OccupationSelect } from './OccupationSelect';

describe('OccupationSelect', () => {
  it('renders both investigators with pure Chinese names, portraits, and narratives', () => {
    const handleBack = vi.fn();
    const handleSelect = vi.fn();

    render(
      <OccupationSelect
        onBackToMenu={handleBack}
        onSelectOccupation={handleSelect}
      />
    );

    // Investigator 1: Edward Pierce (pure Chinese name, no English letters)
    expect(screen.getByText('愛德華·皮爾斯')).toBeDefined();
    expect(screen.queryByText(/Edward Pierce/i)).toBeNull();
    expect(screen.getByText('私家偵探')).toBeDefined();
    expect(screen.getByText(/波士頓街頭與戰火淬鍊的生存專家/i)).toBeDefined();

    // Investigator 2: Eleanor Vance (pure Chinese name, no English letters)
    expect(screen.getByText('艾蓮諾·凡斯')).toBeDefined();
    expect(screen.queryByText(/Eleanor Vance/i)).toBeNull();
    expect(screen.getByText('秘術學者')).toBeDefined();
    expect(screen.getByText(/深諳舊日神話與古老儀軌的學者/i)).toBeDefined();

    // 3:4 Character portraits
    const piercePortrait = screen.getByTestId('portrait-investigator') as HTMLImageElement;
    const vancePortrait = screen.getByTestId('portrait-occultist') as HTMLImageElement;
    expect(piercePortrait).toBeDefined();
    expect(piercePortrait.src).toContain('/occupations/portrait_investigator.webp');
    expect(vancePortrait).toBeDefined();
    expect(vancePortrait.src).toContain('/occupations/portrait_occultist.webp');

    // Deleted stats & deck previews should NOT be in the document
    expect(screen.queryByText(/生命值/i)).toBeNull();
    expect(screen.queryByText(/精力/i)).toBeNull();
    expect(screen.queryByText(/古金幣/i)).toBeNull();
    expect(screen.queryByText(/專屬起始卡牌/i)).toBeNull();
    expect(screen.queryByLabelText(/起始卡牌清單/i)).toBeNull();

    // Deleted tags like "物理生存", "秘術真相" should NOT be present
    expect(screen.queryByText('物理生存')).toBeNull();
    expect(screen.queryByText('秘術真相')).toBeNull();
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
});
