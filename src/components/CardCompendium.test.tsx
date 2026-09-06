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
  it('renders compendium title and all 28 cards by default', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    expect(screen.getByText(/卡牌圖鑑 \(Card Compendium\)/)).toBeDefined();
    expect(screen.getByText(/28 張/)).toBeDefined();

    // Check that all 28 card items are rendered and none have playable combat glow
    const cardItems = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardItems.length).toBe(28);
    expect(container.querySelector('.card-item.playable')).toBeNull();
  });

  it('filters cards when category tabs are clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    // Click "紅色戰鬥" tab
    const combatTab = screen.getByText(/紅色戰鬥/);
    fireEvent.click(combatTab);

    let cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(7);

    // Click "黃色技能" tab
    const skillTab = screen.getByText(/黃色技能/);
    fireEvent.click(skillTab);

    cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(8);

    // Click "黑色瘋狂" tab
    const madnessTab = screen.getByText(/黑色瘋狂/);
    fireEvent.click(madnessTab);

    cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(3);
  });

  it('filters cards by search query', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    const searchInput = screen.getByPlaceholderText(/搜尋卡牌名稱、效果或典故/);
    fireEvent.change(searchInput, { target: { value: '左輪' } });

    // Should find the revolver card
    expect(screen.getByText('左輪射擊')).toBeDefined();
    const cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(1);

    // Searching non-existent query should show empty state
    fireEvent.change(searchInput, { target: { value: '不存在的無敵卡牌' } });
    expect(screen.getByText(/未找到符合搜尋條件的卡牌/)).toBeDefined();
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
    expect(screen.getByText(/ADR-0012 規範對應/)).toBeDefined();

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
