import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardReviewLab } from './CardReviewLab';

// Mock audio and canvas APIs for JSDOM
beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
});

describe('CardReviewLab - Monster Ecology and Image Artworks', () => {
  it('renders monster list and allows toggling to Depth 1 derivative monsters', () => {
    render(<CardReviewLab onClose={vi.fn()} />);

    // Switch to monster ecology tab
    const monsterTabBtn = screen.getByRole('button', { name: /怪物生態數值表/i });
    fireEvent.click(monsterTabBtn);

    // Verify Depth 1 derivative monster is displayed
    expect(screen.getByText('牆中變異鼠群')).toBeDefined();
    expect(screen.getByText('異教狂熱信徒')).toBeDefined();
    expect(screen.getByText('墓穴腐生蠕蟲')).toBeDefined();

    // Verify default cartoon artwork is rendered for rat swarm
    const ratSwarmImg = screen.getByAltText('牆中變異鼠群') as HTMLImageElement;
    expect(ratSwarmImg.src).toContain('/enemies/cartoon/enemy_walls_rat_swarm.png');
  });

  it('allows toggling between Cute Cartoon and 1920s Dark Realism art styles', () => {
    render(<CardReviewLab onClose={vi.fn()} />);

    // Switch to monster ecology tab
    fireEvent.click(screen.getByRole('button', { name: /怪物生態數值表/i }));

    const ratSwarmImg = screen.getByAltText('牆中變異鼠群') as HTMLImageElement;
    expect(ratSwarmImg.src).toContain('/enemies/cartoon/enemy_walls_rat_swarm.png');

    // Click 1920s Dark Realism toggle button
    const realisticToggleBtn = screen.getByRole('button', { name: '1920s暗黑寫實' });
    fireEvent.click(realisticToggleBtn);

    // Image src should update to realistic artwork
    expect(ratSwarmImg.src).toContain('/enemies/realistic/enemy_walls_rat_swarm.png');

    // Click Cute Cartoon toggle button to switch back
    const cartoonToggleBtn = screen.getByRole('button', { name: '可愛卡通' });
    fireEvent.click(cartoonToggleBtn);

    expect(ratSwarmImg.src).toContain('/enemies/cartoon/enemy_walls_rat_swarm.png');
  });

  it('navigates through Depths 2, 3, and 4 and verifies newly added monsters', () => {
    render(<CardReviewLab onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /怪物生態數值表/i }));

    // Switch to Depth 2
    fireEvent.click(screen.getByRole('button', { name: /第二深度/i }));
    expect(screen.getByText('印斯茅斯混血種')).toBeDefined();
    expect(screen.getByText('潮汐塞壬海妖')).toBeDefined();
    expect(screen.getByText('深海寄生藤壺群')).toBeDefined();
    const hybridImg = screen.getByAltText('印斯茅斯混血種') as HTMLImageElement;
    expect(hybridImg.src).toContain('/enemies/cartoon/enemy_innsmouth_hybrid.png');

    // Switch to Depth 3
    fireEvent.click(screen.getByRole('button', { name: /第三深度/i }));
    expect(screen.getByText('米·戈偵察者')).toBeDefined();
    expect(screen.getByText('虛空漫遊者')).toBeDefined();
    expect(screen.getByText('外神盲目吹笛者')).toBeDefined();
    const migoImg = screen.getByAltText('米·戈偵察者') as HTMLImageElement;
    expect(migoImg.src).toContain('/enemies/cartoon/enemy_migo_scout.png');

    // Switch to Depth 4
    fireEvent.click(screen.getByRole('button', { name: /第四深度/i }));
    expect(screen.getByText('拉萊耶石棺守衛')).toBeDefined();
    expect(screen.getByText('拉萊耶夢境具象')).toBeDefined();
    expect(screen.getByText('終焉星辰先知')).toBeDefined();
    const sarcophagusImg = screen.getByAltText('拉萊耶石棺守衛') as HTMLImageElement;
    expect(sarcophagusImg.src).toContain('/enemies/cartoon/enemy_rlyeh_sarcophagus_guard.png');
  });

  it('handles image onError gracefully by falling back to Skull icon', () => {
    render(<CardReviewLab onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /怪物生態數值表/i }));

    const ratSwarmImg = screen.getByAltText('牆中變異鼠群');
    expect(ratSwarmImg).toBeDefined();

    // Trigger onError event on the image
    fireEvent.error(ratSwarmImg);

    // The broken img should now be unmounted / replaced with fallback
    expect(screen.queryByAltText('牆中變異鼠群')).toBeNull();
  });

  it('renders the third tab "數值平衡天梯與模擬矩陣" and switches view seamlessly', () => {
    render(<CardReviewLab onClose={vi.fn()} />);

    // Find third tab button
    const balanceTabBtn = screen.getByRole('button', { name: /數值平衡天梯與模擬矩陣/i });
    expect(balanceTabBtn).toBeDefined();

    // Click third tab
    fireEvent.click(balanceTabBtn);

    // Verify balance matrix dashboard container is displayed
    expect(screen.getByTestId('balance-matrix-dashboard')).toBeDefined();
    expect(screen.getByText(/全量平衡性評測/i)).toBeDefined();
  });
});
