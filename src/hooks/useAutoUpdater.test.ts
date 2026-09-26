import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoUpdater } from './useAutoUpdater';
import { UpdateService, type UpdateSource } from '../services/updateService';

describe('useAutoUpdater', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with idle status and closed modal', () => {
    const service = new UpdateService();
    const { result } = renderHook(() => useAutoUpdater({ service }));

    expect(result.current.status).toBe('idle');
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.updateInfo).toBeNull();
  });

  it('performs silent check and opens modal when new version is available and not dismissed', async () => {
    const mockSource: UpdateSource = {
      check: vi.fn().mockResolvedValue({
        version: '0.4.1',
        currentVersion: '0.4.0',
        body: '版本更新內容說明',
      }),
    };
    const service = new UpdateService(mockSource);
    const { result } = renderHook(() => useAutoUpdater({ service }));

    await act(async () => {
      await result.current.checkUpdate(true);
    });

    expect(result.current.status).toBe('available');
    expect(result.current.updateInfo?.version).toBe('0.4.1');
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.isDismissed).toBe(false);
  });

  it('performs silent check and does NOT open modal if version was dismissed', async () => {
    const mockSource: UpdateSource = {
      check: vi.fn().mockResolvedValue({
        version: '0.4.1',
        currentVersion: '0.4.0',
        body: '版本更新內容說明',
      }),
    };
    const service = new UpdateService(mockSource);
    service.dismissVersion('0.4.1');

    const { result } = renderHook(() => useAutoUpdater({ service }));

    await act(async () => {
      await result.current.checkUpdate(true);
    });

    expect(result.current.status).toBe('available');
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.isDismissed).toBe(true);
  });

  it('allows manual check to open modal even if version was previously dismissed', async () => {
    const mockSource: UpdateSource = {
      check: vi.fn().mockResolvedValue({
        version: '0.4.1',
        currentVersion: '0.4.0',
        body: '版本更新內容說明',
      }),
    };
    const service = new UpdateService(mockSource);
    service.dismissVersion('0.4.1');

    const { result } = renderHook(() => useAutoUpdater({ service }));

    await act(async () => {
      await result.current.checkUpdate(false);
    });

    expect(result.current.status).toBe('available');
    expect(result.current.isModalOpen).toBe(true);
  });

  it('handles dismissCurrentVersion by updating service and closing modal', async () => {
    const mockSource: UpdateSource = {
      check: vi.fn().mockResolvedValue({
        version: '0.4.1',
        currentVersion: '0.4.0',
        body: '版本更新內容說明',
      }),
    };
    const service = new UpdateService(mockSource);
    const { result } = renderHook(() => useAutoUpdater({ service }));

    await act(async () => {
      await result.current.checkUpdate(false);
    });

    expect(result.current.isModalOpen).toBe(true);

    act(() => {
      result.current.dismissCurrentVersion();
    });

    expect(service.isVersionDismissed('0.4.1')).toBe(true);
    expect(result.current.isDismissed).toBe(true);
  });

  it('captures error in manual mode and clears error on next check', async () => {
    const mockSource: UpdateSource = {
      check: vi.fn().mockRejectedValue(new Error('伺服器連線失敗')),
    };
    const service = new UpdateService(mockSource);
    const { result } = renderHook(() => useAutoUpdater({ service }));

    await act(async () => {
      await result.current.checkUpdate(false);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('伺服器連線失敗');
  });

  it('silently ignores error in silent mode', async () => {
    const mockSource: UpdateSource = {
      check: vi.fn().mockRejectedValue(new Error('逾時')),
    };
    const service = new UpdateService(mockSource);
    const { result } = renderHook(() => useAutoUpdater({ service }));

    await act(async () => {
      await result.current.checkUpdate(true);
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.isModalOpen).toBe(false);
  });
});
