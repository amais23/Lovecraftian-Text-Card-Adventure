import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTraumaShake } from './useTraumaShake';

describe('useTraumaShake', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with isShaking false and shakeKey 0', () => {
    const { result } = renderHook(() => useTraumaShake(25));
    expect(result.current.isShaking).toBe(false);
    expect(result.current.shakeKey).toBe(0);
  });

  it('triggers shake when metric decreases', () => {
    const { result, rerender } = renderHook(({ val }) => useTraumaShake(val), {
      initialProps: { val: 25 },
    });

    // Metric decreases (damage sustained)
    rerender({ val: 20 });
    expect(result.current.isShaking).toBe(true);
    expect(result.current.shakeKey).toBe(1);

    // After duration (450ms), stops shaking
    act(() => {
      vi.advanceTimersByTime(450);
    });
    expect(result.current.isShaking).toBe(false);
  });

  it('does not shake when metric increases or stays same', () => {
    const { result, rerender } = renderHook(({ val }) => useTraumaShake(val), {
      initialProps: { val: 20 },
    });

    // Metric increases (healing)
    rerender({ val: 25 });
    expect(result.current.isShaking).toBe(false);
    expect(result.current.shakeKey).toBe(0);

    // Metric stays same
    rerender({ val: 25 });
    expect(result.current.isShaking).toBe(false);
    expect(result.current.shakeKey).toBe(0);
  });

  it('re-triggers shake and increments shakeKey on consecutive rapid hits', () => {
    const { result, rerender } = renderHook(({ val }) => useTraumaShake(val, 450), {
      initialProps: { val: 30 },
    });

    // Hit 1
    rerender({ val: 25 });
    expect(result.current.isShaking).toBe(true);
    expect(result.current.shakeKey).toBe(1);

    // 150ms later, Hit 2 arrives before Hit 1 finishes
    act(() => {
      vi.advanceTimersByTime(150);
    });
    rerender({ val: 20 });
    expect(result.current.isShaking).toBe(true);
    expect(result.current.shakeKey).toBe(2);

    // 350ms after Hit 2 (500ms total), it should still be shaking because Hit 2 reset the 450ms timer
    act(() => {
      vi.advanceTimersByTime(350);
    });
    expect(result.current.isShaking).toBe(true);

    // 100ms later (450ms after Hit 2), stops shaking
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isShaking).toBe(false);
  });
});
