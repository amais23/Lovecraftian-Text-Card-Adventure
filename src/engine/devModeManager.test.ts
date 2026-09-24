import { describe, it, expect, beforeEach, vi } from 'vitest';
import { devModeManager, DEV_MODE_STORAGE_KEY } from './devModeManager';

describe('devModeManager', () => {
  beforeEach(() => {
    localStorage.clear();
    devModeManager.setDevMode(false);
  });

  it('defaults to false when localStorage is empty', () => {
    expect(devModeManager.getDevMode()).toBe(false);
  });

  it('initializes from localStorage if pre-set to true', () => {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, 'true');
    // Re-synchronize or load from storage
    devModeManager.reloadFromStorage();
    expect(devModeManager.getDevMode()).toBe(true);
  });

  it('sets dev mode to true and persists to localStorage', () => {
    devModeManager.setDevMode(true);
    expect(devModeManager.getDevMode()).toBe(true);
    expect(localStorage.getItem(DEV_MODE_STORAGE_KEY)).toBe('true');
  });

  it('sets dev mode to false and persists to localStorage', () => {
    devModeManager.setDevMode(true);
    devModeManager.setDevMode(false);
    expect(devModeManager.getDevMode()).toBe(false);
    expect(localStorage.getItem(DEV_MODE_STORAGE_KEY)).toBe('false');
  });

  it('toggles dev mode state and returns updated boolean', () => {
    expect(devModeManager.getDevMode()).toBe(false);
    const toggled = devModeManager.toggleDevMode();
    expect(toggled).toBe(true);
    expect(devModeManager.getDevMode()).toBe(true);
    expect(localStorage.getItem(DEV_MODE_STORAGE_KEY)).toBe('true');

    const toggledBack = devModeManager.toggleDevMode();
    expect(toggledBack).toBe(false);
    expect(devModeManager.getDevMode()).toBe(false);
    expect(localStorage.getItem(DEV_MODE_STORAGE_KEY)).toBe('false');
  });

  it('notifies subscribers when dev mode changes', () => {
    const subscriber = vi.fn();
    const unsubscribe = devModeManager.subscribe(subscriber);

    devModeManager.setDevMode(true);
    expect(subscriber).toHaveBeenCalledWith(true);

    devModeManager.toggleDevMode();
    expect(subscriber).toHaveBeenCalledWith(false);

    unsubscribe();
    devModeManager.setDevMode(true);
    // Should not receive further notifications after unsubscribe
    expect(subscriber).toHaveBeenCalledTimes(2);
  });
});
