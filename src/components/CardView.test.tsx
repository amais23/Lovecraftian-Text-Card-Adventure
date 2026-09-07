import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardView } from './CardView';
import { ABYSSAL_FRAGMENT_1, COMPLETE_ANCIENT_SEAL } from '../engine/abyssalSeals';
import type { Card } from '../types/game';

describe('CardView Component (Unplayable Cards & ADR-0015)', () => {
  const mockPlayableCard: Card = {
    id: 'mock_slash',
    name: '精準斬擊',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 8 }],
    description: '造成 8 點物理傷害。',
    flavorText: '「精準而致命的劈砍。」',
  };

  it('renders a normal card as playable and calls onPlay when clicked', () => {
    const onPlay = vi.fn();
    render(
      <CardView
        card={mockPlayableCard}
        currentStamina={2}
        onPlay={onPlay}
      />
    );

    const cardElement = screen.getByText('精準斬擊').closest('.card-item');
    expect(cardElement?.classList.contains('playable')).toBe(true);

    fireEvent.click(cardElement!);
    expect(onPlay).toHaveBeenCalledWith(mockPlayableCard.id);
  });

  it('renders unplayable card with disabled class, unplayable badge, prompt, and prevents onPlay on click', () => {
    const onPlay = vi.fn();
    render(
      <CardView
        card={ABYSSAL_FRAGMENT_1}
        currentStamina={10}
        currentSanity={10}
        onPlay={onPlay}
      />
    );

    const cardElement = screen.getByText(ABYSSAL_FRAGMENT_1.name).closest('.card-item');
    expect(cardElement?.classList.contains('disabled')).toBe(true);
    expect(cardElement?.classList.contains('playable')).toBe(false);

    // Shows badge and bottom prompt
    const unplayableElements = screen.getAllByText('無法打出');
    expect(unplayableElements.length).toBe(2); // One badge, one play-prompt

    // Clicking should NOT invoke onPlay
    fireEvent.click(cardElement!);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('renders generic unplayable card without abyssal fragment wording in tooltip', () => {
    const genericUnplayableCard: Card = {
      ...mockPlayableCard,
      id: 'generic_curse',
      name: '禁錮鎖鏈',
      isUnplayable: true,
    };
    render(
      <CardView
        card={genericUnplayableCard}
        currentStamina={5}
      />
    );
    const cardElement = screen.getByText('禁錮鎖鏈').closest('.card-item');
    expect(cardElement?.getAttribute('title')).toBe('【禁錮鎖鏈】無法打出');
  });

  it('renders COMPLETE_ANCIENT_SEAL as locked when fighting divine immortality enemy with health > 1', () => {
    const onPlay = vi.fn();
    render(
      <CardView
        card={COMPLETE_ANCIENT_SEAL}
        currentStamina={5}
        enemyHealth={50}
        enemyDivineImmortality={true}
        onPlay={onPlay}
      />
    );

    const cardElement = screen.getByText(COMPLETE_ANCIENT_SEAL.name).closest('.card-item');
    expect(cardElement?.classList.contains('seal-locked')).toBe(true);
    expect(cardElement?.classList.contains('disabled')).toBe(true);
    expect(cardElement?.classList.contains('playable')).toBe(false);

    expect(screen.getByText('神性封印')).toBeDefined();
    expect(screen.getByText('神性封印中')).toBeDefined();

    fireEvent.click(cardElement!);
    expect(onPlay).not.toHaveBeenCalled();
  });

  it('renders COMPLETE_ANCIENT_SEAL as unlocked with divine radiance when boss health reaches 1', () => {
    const onPlay = vi.fn();
    render(
      <CardView
        card={COMPLETE_ANCIENT_SEAL}
        currentStamina={5}
        enemyHealth={1}
        enemyDivineImmortality={true}
        onPlay={onPlay}
      />
    );

    const cardElement = screen.getByText(COMPLETE_ANCIENT_SEAL.name).closest('.card-item');
    expect(cardElement?.classList.contains('ancient-seal-unlocked')).toBe(true);
    expect(cardElement?.classList.contains('playable')).toBe(true);
    expect(cardElement?.classList.contains('disabled')).toBe(false);

    expect(screen.getByText('終極斬殺')).toBeDefined();
    expect(screen.getByText('引動終極封滅！')).toBeDefined();

    fireEvent.click(cardElement!);
    expect(onPlay).toHaveBeenCalledWith(COMPLETE_ANCIENT_SEAL.id);
  });

  it('supports passing enemy object directly instead of separate health/divine props', () => {
    const onPlay = vi.fn();
    render(
      <CardView
        card={COMPLETE_ANCIENT_SEAL}
        currentStamina={5}
        enemy={{ health: 1, divineImmortality: true }}
        onPlay={onPlay}
      />
    );

    const cardElement = screen.getByText(COMPLETE_ANCIENT_SEAL.name).closest('.card-item');
    expect(cardElement?.classList.contains('ancient-seal-unlocked')).toBe(true);
    expect(screen.getByText('終極斬殺')).toBeDefined();
  });

  it('renders card with proper layout structure, effect description tooltip, and flavor text tooltip', () => {
    render(
      <CardView
        card={mockPlayableCard}
        currentStamina={2}
      />
    );

    const cardElement = screen.getByText('精準斬擊').closest('.card-item');
    expect(cardElement).toBeDefined();

    // Check inner structure elements
    expect(cardElement?.querySelector('.card-top-row')).toBeDefined();
    expect(cardElement?.querySelector('.card-illustration-frame')).toBeDefined();
    expect(cardElement?.querySelector('.card-title-banner')).toBeDefined();

    const descElement = cardElement?.querySelector('.card-effect-desc');
    expect(descElement).toBeDefined();
    expect(descElement?.getAttribute('title')).toBe(mockPlayableCard.description);

    const flavorElement = cardElement?.querySelector('.card-flavor');
    expect(flavorElement).toBeDefined();
    expect(flavorElement?.getAttribute('title')).toBe(mockPlayableCard.flavorText);

    const promptElement = cardElement?.querySelector('.card-play-prompt');
    expect(promptElement).toBeDefined();
    expect(promptElement?.textContent).toContain('點擊或上拖打出');
  });

  it('renders standalone card with standalone class and without bottom play prompt', () => {
    render(
      <CardView
        card={mockPlayableCard}
        currentStamina={2}
        isStandalone={true}
      />
    );

    const cardElement = screen.getByText('精準斬擊').closest('.card-item');
    expect(cardElement?.classList.contains('standalone')).toBe(true);
    expect(cardElement?.querySelector('.card-play-prompt')).toBeNull();
  });
});


