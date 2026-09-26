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

describe('SettingsModal - Version & Manual Update Check (ADR-0040 / #74)', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders "版本與更新" section displaying current local version and manual check button', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('heading', { level: 3, name: /版本與更新/i })).toBeDefined();
    expect(screen.getByText('目前本機版本')).toBeDefined();
    expect(screen.getAllByText(/v0\.4\.0/).length).toBeGreaterThanOrEqual(1);

    const checkBtn = screen.getByRole('button', { name: /檢查更新/i });
    expect(checkBtn).toBeDefined();
    expect(checkBtn.hasAttribute('disabled')).toBe(false);
  });

  it('shows loading indicator while checking for updates and disables button', async () => {
    let resolveCheck: (val: any) => void;
    const checkPromise = new Promise((resolve) => {
      resolveCheck = resolve;
    });
    const mockSource = {
      check: vi.fn().mockReturnValue(checkPromise),
    };
    const { UpdateService } = await import('../../services/updateService');
    const testService = new UpdateService(mockSource);

    render(<SettingsModal isOpen={true} onClose={mockOnClose} updateService={testService} />);

    const checkBtn = screen.getByRole('button', { name: /檢查更新/i });
    fireEvent.click(checkBtn);

    // During check, button text reflects checking/loading state and is disabled
    expect(screen.getByText(/檢查中\.\.\./i)).toBeDefined();
    expect(checkBtn.hasAttribute('disabled')).toBe(true);

    // Resolve the promise
    const { act } = await import('@testing-library/react');
    await act(async () => {
      resolveCheck!(null);
    });

    // Afterwards, button is no longer in checking state
    expect(screen.queryByText(/檢查中\.\.\./i)).toBeNull();
  });

  it('displays "目前已是最新版本" when manual check reports no updates', async () => {
    const mockSource = {
      check: vi.fn().mockResolvedValue(null),
    };
    const { UpdateService } = await import('../../services/updateService');
    const testService = new UpdateService(mockSource);

    render(<SettingsModal isOpen={true} onClose={mockOnClose} updateService={testService} />);

    const checkBtn = screen.getByRole('button', { name: /檢查更新/i });
    const { act } = await import('@testing-library/react');
    await act(async () => {
      fireEvent.click(checkBtn);
    });

    expect(screen.getByText(/目前已是最新版本/i)).toBeDefined();
  });

  it('displays clear error message when update check fails or network error occurs', async () => {
    const mockSource = {
      check: vi.fn().mockRejectedValue(new Error('連線逾時，無法連接伺服器')),
    };
    const { UpdateService } = await import('../../services/updateService');
    const testService = new UpdateService(mockSource);

    render(<SettingsModal isOpen={true} onClose={mockOnClose} updateService={testService} />);

    const checkBtn = screen.getByRole('button', { name: /檢查更新/i });
    const { act } = await import('@testing-library/react');
    await act(async () => {
      fireEvent.click(checkBtn);
    });

    expect(screen.getByText(/連線逾時，無法連接伺服器/i)).toBeDefined();
  });

  it('wakes and opens UpdateModal when a new version is found, even if previously dismissed', async () => {
    const mockSource = {
      check: vi.fn().mockResolvedValue({
        version: '0.4.1',
        currentVersion: '0.4.0',
        body: '最新舊日支配者平衡調整與防護修訂',
      }),
    };
    const { UpdateService } = await import('../../services/updateService');
    const testService = new UpdateService(mockSource);
    // User previously dismissed 0.4.1
    testService.dismissVersion('0.4.1');

    render(<SettingsModal isOpen={true} onClose={mockOnClose} updateService={testService} />);

    const checkBtn = screen.getByRole('button', { name: /檢查更新/i });
    const { act } = await import('@testing-library/react');
    await act(async () => {
      fireEvent.click(checkBtn);
    });

    // UpdateModal is awakened and rendered
    const updateModalTitle = await screen.findByRole('heading', { name: /發現新版本/ });
    expect(updateModalTitle).toBeDefined();
    expect(screen.getByText('0.4.1')).toBeDefined();
    expect(screen.getByText(/最新舊日支配者平衡調整與防護修訂/)).toBeDefined();
  });

  it('locks and disables update button with safety warning when game is in progress (進行中對弈防護)', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} isGameInProgress={true} />);

    const checkBtn = screen.getByRole('button', { name: /檢查更新/i });
    expect(checkBtn.hasAttribute('disabled')).toBe(true);

    expect(screen.getByText(/請返回主標題選單進行更新/i)).toBeDefined();
  });

  it('locks update button when isInGame prop is passed as true', () => {
    render(<SettingsModal isOpen={true} onClose={mockOnClose} isInGame={true} />);

    const checkBtn = screen.getByRole('button', { name: /檢查更新/i });
    expect(checkBtn.hasAttribute('disabled')).toBe(true);

    expect(screen.getByText(/請返回主標題選單進行更新/i)).toBeDefined();
  });
});

