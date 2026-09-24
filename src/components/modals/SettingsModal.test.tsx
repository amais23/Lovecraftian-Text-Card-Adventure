import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { devModeManager, DEV_MODE_STORAGE_KEY } from '../../engine/devModeManager';
import { soundEngine } from '../../engine/audioManager';

describe('SettingsModal - Dev Mode Toggle (ADR-0036 / #62)', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    devModeManager.setDevMode(false);
  });

  it('renders Dev Mode toggle switch in closed/off state by default', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('heading', { level: 3, name: /開發者模式/i })).toBeDefined();

    const devToggleBtn = screen.getByRole('button', { name: '開啟開發者模式' });
    expect(devToggleBtn).toBeDefined();
    expect(devToggleBtn.classList.contains('active')).toBe(false);
    expect(screen.getByText('已關閉')).toBeDefined();
  });

  it('toggles dev mode on click, updates UI, and persists to localStorage', () => {
    const playClickSpy = vi.spyOn(soundEngine, 'playClick').mockImplementation(() => {});

    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    const devToggleBtn = screen.getByRole('button', { name: '開啟開發者模式' });
    fireEvent.click(devToggleBtn);

    expect(devModeManager.getDevMode()).toBe(true);
    expect(localStorage.getItem(DEV_MODE_STORAGE_KEY)).toBe('true');
    const activeBtn = screen.getByRole('button', { name: '關閉開發者模式' });
    expect(activeBtn).toBeDefined();
    expect(activeBtn.textContent).toContain('已啟用');

    // Toggle off again
    fireEvent.click(activeBtn);
    expect(devModeManager.getDevMode()).toBe(false);
    expect(localStorage.getItem(DEV_MODE_STORAGE_KEY)).toBe('false');
    const closedBtn = screen.getByRole('button', { name: '開啟開發者模式' });
    expect(closedBtn).toBeDefined();
    expect(closedBtn.textContent).toContain('已關閉');

    playClickSpy.mockRestore();
  });

  it('loads active dev mode state if persisted in localStorage prior to opening', () => {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, 'true');
    devModeManager.reloadFromStorage();

    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    const devToggleBtn = screen.getByRole('button', { name: '關閉開發者模式' });
    expect(devToggleBtn).toBeDefined();
    expect(devToggleBtn.classList.contains('active')).toBe(true);
    expect(devToggleBtn.textContent).toContain('已啟用');
  });
});
