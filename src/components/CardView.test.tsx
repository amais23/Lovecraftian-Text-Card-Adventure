import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardView } from './CardView';
import { ABYSSAL_FRAGMENT_1 } from '../engine/abyssalSeals';
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
});
