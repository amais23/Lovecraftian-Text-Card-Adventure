import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CustomCursorAtmosphere } from './CustomCursorAtmosphere';

describe('CustomCursorAtmosphere (ADR-0028)', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    originalGetContext = HTMLCanvasElement.prototype.getContext;

    // Mock Canvas 2D context for jsdom
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    }) as any;

    // Provide standard matchMedia mock
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
  });

  it('renders a fixed non-blocking canvas overlay with pointer-events: none', () => {
    const { getByTestId } = render(<CustomCursorAtmosphere isMadness={false} />);
    const canvas = getByTestId('custom-cursor-atmosphere') as HTMLCanvasElement;

    expect(canvas).toBeDefined();
    expect(canvas.tagName.toLowerCase()).toBe('canvas');
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
    expect(canvas.style.pointerEvents).toBe('none');
    expect(canvas.style.position).toBe('fixed');
  });

  it('attaches and removes event listeners cleanly upon mount and unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<CustomCursorAtmosphere isMadness={false} />);

    expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function), expect.anything());
    expect(addSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), expect.anything());
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('handles mousemove and mousedown without throwing exceptions', () => {
    render(<CustomCursorAtmosphere isMadness={false} />);

    expect(() => {
      fireEvent.mouseMove(window, { clientX: 100, clientY: 150 });
      fireEvent.mouseDown(window, { clientX: 100, clientY: 150 });
    }).not.toThrow();
  });

  it('handles madness state switching without crashing', () => {
    const { rerender } = render(<CustomCursorAtmosphere isMadness={false} />);

    expect(() => {
      fireEvent.mouseMove(window, { clientX: 120, clientY: 160 });
    }).not.toThrow();

    rerender(<CustomCursorAtmosphere isMadness={true} />);

    expect(() => {
      fireEvent.mouseMove(window, { clientX: 200, clientY: 250 });
      fireEvent.mouseDown(window, { clientX: 200, clientY: 250 });
    }).not.toThrow();
  });

  it('respects prefers-reduced-motion by remaining dormant', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { getByTestId } = render(<CustomCursorAtmosphere isMadness={false} />);
    const canvas = getByTestId('custom-cursor-atmosphere');
    expect(canvas).toBeDefined();

    // Mouse events should be safe and no-op
    expect(() => {
      fireEvent.mouseMove(window, { clientX: 50, clientY: 50 });
    }).not.toThrow();
  });

  it('supports explicit sanityState prop and handles canvas window resize', () => {
    const { getByTestId, rerender } = render(<CustomCursorAtmosphere sanityState="normal" />);
    const canvas = getByTestId('custom-cursor-atmosphere') as HTMLCanvasElement;

    expect(canvas).toBeDefined();

    // Trigger window resize
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    fireEvent(window, new Event('resize'));
    expect(canvas.width).toBe(1920);
    expect(canvas.height).toBe(1080);

    // Switch to madness via sanityState prop
    rerender(<CustomCursorAtmosphere sanityState="madness" />);
    expect(() => {
      fireEvent.mouseMove(window, { clientX: 300, clientY: 400 });
      fireEvent.mouseDown(window, { clientX: 300, clientY: 400 });
    }).not.toThrow();
  });
});
