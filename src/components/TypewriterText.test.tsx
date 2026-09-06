import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TypewriterText } from './TypewriterText';

describe('TypewriterText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders typing progressively and completes', () => {
    const onComplete = vi.fn();
    render(<TypewriterText text="克蘇魯的神話" speed={20} onComplete={onComplete} />);

    // Fast-forward partially
    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(screen.getByText(/克蘇/)).toBeDefined();
    expect(onComplete).not.toHaveBeenCalled();

    // Fast-forward to end
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('克蘇魯的神話')).toBeDefined();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('skips immediately on click without timer leak', () => {
    const onComplete = vi.fn();
    const { container } = render(
      <TypewriterText text="深淵之中傳來不可名狀之低語" speed={50} onComplete={onComplete} />
    );

    const span = container.querySelector('.typewriter-text-span');
    expect(span).toBeTruthy();

    act(() => {
      fireEvent.click(span!);
    });

    // Entire text is displayed immediately
    expect(screen.getByText('深淵之中傳來不可名狀之低語')).toBeDefined();
    expect(onComplete).toHaveBeenCalledTimes(1);

    // Further timer ticks do not revert or re-type
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('深淵之中傳來不可名狀之低語')).toBeDefined();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('does not restart typing when onComplete callback reference changes', () => {
    let callback = vi.fn();
    const { rerender } = render(
      <TypewriterText text="克蘇魯的神話" speed={20} onComplete={callback} />
    );

    // Fast-forward 2 characters (40ms)
    act(() => {
      vi.advanceTimersByTime(40);
    });
    expect(screen.getByText(/克蘇/)).toBeDefined();

    // Re-render with a new onComplete instance
    callback = vi.fn();
    rerender(<TypewriterText text="克蘇魯的神話" speed={20} onComplete={callback} />);

    // Fast-forward 20ms (1 more character: 3 characters total = "克蘇魯")
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByText(/克蘇魯/)).toBeDefined();
  });

  it('resets and types new text when text prop changes', () => {
    const { rerender } = render(<TypewriterText text="第一章" speed={20} />);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.getByText('第一章')).toBeDefined();

    rerender(<TypewriterText text="第二章" speed={20} />);
    // Immediately shows beginning of new text
    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByText(/第/)).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText('第二章')).toBeDefined();
  });
});
