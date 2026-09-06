import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardCompendium } from './CardCompendium';

// Mock audioManager so it doesn't fail in node environment
vi.mock('../engine/audioManager', () => ({
  soundEngine: {
    playClick: vi.fn(),
    playCardHover: vi.fn(),
    playCardPlay: vi.fn(),
  },
}));

describe('CardCompendium Component', () => {
  it('renders compendium title and all 32 cards by default', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    expect(screen.getByRole('heading', { name: '卡牌圖鑑' })).toBeDefined();
    expect(screen.getByText(/32 張/)).toBeDefined();

    // Check that all 32 card items are rendered and none have playable combat glow
    const cardItems = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardItems.length).toBe(32);
    expect(container.querySelector('.card-item.playable')).toBeNull();
  });

  it('filters cards when category tabs are clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    // Click "紅色戰鬥" tab
    const combatTab = screen.getByText(/紅色戰鬥/);
    fireEvent.click(combatTab);

    let cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(8);

    // Click "黃色技能" tab
    const skillTab = screen.getByText(/黃色技能/);
    fireEvent.click(skillTab);

    cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(9);

    // Click "黑色瘋狂" tab
    const madnessTab = screen.getByText(/黑色瘋狂/);
    fireEvent.click(madnessTab);

    cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(3);
  });

  it('opens detail modal on card click and closes on close button or Esc', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    // Click on the first card
    const firstCard = container.querySelector('.compendium-card-wrapper');
    expect(firstCard).toBeTruthy();
    fireEvent.click(firstCard!);

    // Detail modal should be visible
    expect(container.querySelector('.compendium-detail-modal-box')).toBeTruthy();
    expect(screen.getByText(/背景典故與畫面意境/)).toBeDefined();
    expect(screen.getByText(/手記典藏考證/)).toBeDefined();

    // Press Escape to close modal
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(container.querySelector('.compendium-detail-modal-box')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();

    // Press Escape again should call onClose
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close header button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    const closeBtn = container.querySelector('#close-compendium-btn');
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
