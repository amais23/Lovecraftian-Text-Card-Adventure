import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDevMode } from './useDevMode';
import { devModeManager } from '../engine/devModeManager';

describe('useDevMode', () => {
  beforeEach(() => {
    localStorage.clear();
    devModeManager.setDevMode(false);
  });

  it('initially returns false by default', () => {
    const { result } = renderHook(() => useDevMode());
    expect(result.current).toBe(false);
  });

  it('updates reactively when dev mode is changed in devModeManager', () => {
    const { result } = renderHook(() => useDevMode());
    expect(result.current).toBe(false);

    act(() => {
      devModeManager.setDevMode(true);
    });

    expect(result.current).toBe(true);

    act(() => {
      devModeManager.setDevMode(false);
    });

    expect(result.current).toBe(false);
  });
});
