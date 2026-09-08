import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSanityFlicker } from './useSanityFlicker';

describe('useSanityFlicker Hook (ADR-0021)', () => {
  it('does not flicker on initial mount', () => {
    const { result } = renderHook(() => useSanityFlicker(10));
    expect(result.current.isFlickering).toBe(false);
    expect(result.current.flickerKey).toBe(0);
  });

  it('triggers isFlickering when sanityCount decreases and clears after duration', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ count }) => useSanityFlicker(count, 280),
      { initialProps: { count: 10 } }
    );

    expect(result.current.isFlickering).toBe(false);

    // Sanity count drops from 10 to 8
    act(() => {
      rerender({ count: 8 });
    });

    expect(result.current.isFlickering).toBe(true);
    expect(result.current.flickerKey).toBe(1);

    // Fast-forward 280ms
    act(() => {
      vi.advanceTimersByTime(280);
    });

    expect(result.current.isFlickering).toBe(false);

    vi.useRealTimers();
  });

  it('triggers isFlickering with default 850ms duration for jump scare readability', () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ count }) => useSanityFlicker(count),
      { initialProps: { count: 10 } }
    );

    expect(result.current.isFlickering).toBe(false);

    act(() => {
      rerender({ count: 9 });
    });

    expect(result.current.isFlickering).toBe(true);

    // Fast-forward 500ms (still flickering so player can clearly see the horror)
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isFlickering).toBe(true);

    // Fast-forward remaining 350ms (total 850ms)
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.isFlickering).toBe(false);

    vi.useRealTimers();
  });

  it('does NOT trigger flicker when sanityCount increases (e.g. restoring sanity)', () => {
    const { result, rerender } = renderHook(
      ({ count }) => useSanityFlicker(count, 280),
      { initialProps: { count: 5 } }
    );

    act(() => {
      rerender({ count: 8 });
    });

    expect(result.current.isFlickering).toBe(false);
    expect(result.current.flickerKey).toBe(0);
  });
});
