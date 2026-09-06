import { describe, it, expect, beforeEach } from 'vitest';
import { calculateCardFanOut } from './handMath';
import { SoundEngine } from './audioManager';

describe('Hand Fan-Out Math & Geometry (Issue #7)', () => {
  it('handles empty hand gracefully', () => {
    const transform = calculateCardFanOut(0, 0);
    expect(transform.rotate).toBe(0);
    expect(transform.x).toBe(0);
    expect(transform.y).toBe(0);
  });

  it('handles single card: centered with zero rotation', () => {
    const transform = calculateCardFanOut(0, 1);
    expect(transform.rotate).toBe(0);
    expect(transform.x).toBe(0);
    expect(transform.y).toBe(0);
    expect(transform.zIndex).toBe(10);
  });

  it('calculates symmetrical fan-out for 4 cards', () => {
    const card0 = calculateCardFanOut(0, 4);
    const card1 = calculateCardFanOut(1, 4);
    const card2 = calculateCardFanOut(2, 4);
    const card3 = calculateCardFanOut(3, 4);

    // Leftmost card has negative rotation and x
    expect(card0.rotate).toBeLessThan(0);
    expect(card0.x).toBeLessThan(0);

    // Rightmost card has positive rotation and x
    expect(card3.rotate).toBeGreaterThan(0);
    expect(card3.x).toBeGreaterThan(0);

    // Exact symmetrical magnitude
    expect(Math.abs(card0.rotate)).toBeCloseTo(card3.rotate, 1);
    expect(Math.abs(card0.x)).toBeCloseTo(card3.x, 1);
    expect(Math.abs(card1.rotate)).toBeCloseTo(card2.rotate, 1);
    expect(Math.abs(card1.x)).toBeCloseTo(card2.x, 1);

    // Parabolic vertical arc: outer cards curve downward (higher y value)
    expect(card0.y).toBeGreaterThan(card1.y);
    expect(card3.y).toBeGreaterThan(card2.y);

    // Layer stacking: later cards render above earlier cards
    expect(card0.zIndex).toBeLessThan(card1.zIndex);
    expect(card1.zIndex).toBeLessThan(card2.zIndex);
    expect(card2.zIndex).toBeLessThan(card3.zIndex);
  });

  it('centers the middle card for odd number of cards (3 cards)', () => {
    const card0 = calculateCardFanOut(0, 3);
    const center = calculateCardFanOut(1, 3);
    const card2 = calculateCardFanOut(2, 3);

    expect(center.rotate).toBe(0);
    expect(center.x).toBe(0);
    expect(center.y).toBe(0);

    expect(card0.rotate).toBe(-card2.rotate);
    expect(card0.x).toBe(-card2.x);
    expect(card0.y).toBe(card2.y);
    expect(card0.y).toBeGreaterThan(center.y);
  });
});

describe('Sound Engine & Audio Controls (Issue #7)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default unmuted state and persists toggle in localStorage', () => {
    const engine = new SoundEngine();
    expect(engine.getMuted()).toBe(false);

    const isNowMuted = engine.toggleMute();
    expect(isNowMuted).toBe(true);
    expect(engine.getMuted()).toBe(true);
    expect(localStorage.getItem('lovecraft_card_muted')).toBe('true');

    engine.setMuted(false);
    expect(engine.getMuted()).toBe(false);
    expect(localStorage.getItem('lovecraft_card_muted')).toBe('false');
  });

  it('runs play methods safely without throwing in headless environments', () => {
    const engine = new SoundEngine();

    expect(() => {
      engine.playDrawCard();
      engine.playCardHover();
      engine.playCardPlay('combat');
      engine.playCardPlay('skill');
      engine.playCardPlay('magic');
      engine.playCardPlay('truth');
      engine.playCardPlay('madness');
      engine.playDamage();
      engine.playClick();
      engine.playTypewriterKey();
    }).not.toThrow();
  });
});
