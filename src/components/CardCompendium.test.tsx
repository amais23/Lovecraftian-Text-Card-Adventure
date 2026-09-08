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
  it('renders compendium title and all 64 cards by default', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    expect(screen.getByRole('heading', { name: '卡牌圖鑑' })).toBeDefined();
    expect(screen.getByText(/64 張/)).toBeDefined();

    // Check that all 64 card items are rendered and none have playable combat glow
    const cardItems = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardItems.length).toBe(64);
    expect(container.querySelector('.card-item.playable')).toBeNull();
  });

  it('orders cards by category (Red -> Yellow -> Purple -> White -> Black) and then by Tier', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    const cardItems = Array.from(container.querySelectorAll('.compendium-card-wrapper .card-item'));
    expect(cardItems.length).toBe(64);

    // Extract categories in rendered sequence
    const categories = cardItems.map((el) => {
      if (el.classList.contains('combat')) return 'combat';
      if (el.classList.contains('skill')) return 'skill';
      if (el.classList.contains('magic')) return 'magic';
      if (el.classList.contains('truth')) return 'truth';
      if (el.classList.contains('madness')) return 'madness';
      return 'unknown';
    });

    // Verify ordering sequence: all combat come first, then skill, then magic, then truth, then madness
    const orderRank = { combat: 1, skill: 2, magic: 3, truth: 4, madness: 5 };
    for (let i = 0; i < categories.length - 1; i++) {
      const currentRank = orderRank[categories[i] as keyof typeof orderRank];
      const nextRank = orderRank[categories[i + 1] as keyof typeof orderRank];
      expect(currentRank).toBeLessThanOrEqual(nextRank);
    }

    // Verify tier ordering within combat cards
    const combatCards = cardItems.filter((el) => el.classList.contains('combat'));
    const combatTiers = combatCards.map((el) => {
      const match = el.className.match(/tier-(\d+)/);
      return match ? parseInt(match[1], 10) : 1;
    });
    for (let i = 0; i < combatTiers.length - 1; i++) {
      expect(combatTiers[i]).toBeLessThanOrEqual(combatTiers[i + 1]);
    }
  });

  it('filters cards when category tabs are clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    // Click "紅色戰鬥" tab
    const combatTab = screen.getByText(/紅色戰鬥/);
    fireEvent.click(combatTab);

    let cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(16);

    // Click "黃色技能" tab
    const skillTab = screen.getByText(/黃色技能/);
    fireEvent.click(skillTab);

    cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(17);

    // Click "黑色瘋狂" tab
    const madnessTab = screen.getByText(/黑色瘋狂/);
    fireEvent.click(madnessTab);

    cardWrappers = container.querySelectorAll('.compendium-card-wrapper');
    expect(cardWrappers.length).toBe(6);
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

  it('filters cards by occupation (all, investigator, occultist, neutral)', () => {
    const onClose = vi.fn();
    const { container } = render(<CardCompendium onClose={onClose} />);

    // Check that occupation filter tabs are present
    const investigatorTab = screen.getByText(/私家偵探/);
    const occultistTab = screen.getByText(/秘術學者/);
    const neutralTab = screen.getByText(/中立通用/);
    const allOccTab = screen.getByText(/全部職業/);

    expect(investigatorTab).toBeDefined();
    expect(occultistTab).toBeDefined();
    expect(neutralTab).toBeDefined();
    expect(allOccTab).toBeDefined();

    // Click "私家偵探"
    fireEvent.click(investigatorTab);
    const investigatorCards = container.querySelectorAll('.compendium-card-wrapper');
    expect(investigatorCards.length).toBeGreaterThan(0);
    expect(investigatorCards.length).toBeLessThan(64);

    // Click "秘術學者"
    fireEvent.click(occultistTab);
    const occultistCards = container.querySelectorAll('.compendium-card-wrapper');
    expect(occultistCards.length).toBeGreaterThan(0);
    expect(occultistCards.length).toBeLessThan(64);

    // Click "中立通用"
    fireEvent.click(neutralTab);
    const neutralCards = container.querySelectorAll('.compendium-card-wrapper');
    expect(neutralCards.length).toBeGreaterThan(0);
    expect(neutralCards.length).toBeLessThan(64);

    // Investigator + Occultist + Neutral counts should sum to >= 64
    expect(investigatorCards.length + occultistCards.length + neutralCards.length).toBeGreaterThanOrEqual(64);

    // Reset to "全部職業"
    fireEvent.click(allOccTab);
    expect(container.querySelectorAll('.compendium-card-wrapper').length).toBe(64);
  });
});
