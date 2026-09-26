import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  UpdateService,
  CURRENT_APP_VERSION,
  IGNORED_UPDATE_VERSION_KEY,
  openExternalUrl,
  type UpdateSource,
} from './updateService';

describe('UpdateService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Version dismissal persistence', () => {
    it('correctly reports when no version is dismissed', () => {
      const service = new UpdateService();
      expect(service.isVersionDismissed('0.4.1')).toBe(false);
      expect(service.getDismissedVersion()).toBeNull();
    });

    it('persists dismissed version to localStorage and returns true', () => {
      const service = new UpdateService();
      service.dismissVersion('0.4.1');
      expect(localStorage.getItem(IGNORED_UPDATE_VERSION_KEY)).toBe('0.4.1');
      expect(service.isVersionDismissed('0.4.1')).toBe(true);
      expect(service.getDismissedVersion()).toBe('0.4.1');
    });

    it('returns false if checked version is different from dismissed version', () => {
      const service = new UpdateService();
      service.dismissVersion('0.4.1');
      expect(service.isVersionDismissed('0.4.2')).toBe(false);
    });

    it('clears dismissed version properly', () => {
      const service = new UpdateService();
      service.dismissVersion('0.4.1');
      service.clearDismissedVersion();
      expect(service.isVersionDismissed('0.4.1')).toBe(false);
      expect(localStorage.getItem(IGNORED_UPDATE_VERSION_KEY)).toBeNull();
    });
  });

  describe('Check for updates with mock source', () => {
    it('returns update info when mock source has a newer version', async () => {
      const mockSource: UpdateSource = {
        check: vi.fn().mockResolvedValue({
          version: '0.4.1',
          currentVersion: CURRENT_APP_VERSION,
          body: '修復理智抽卡異常、平衡敵怪數值',
          date: '2026-09-26',
        }),
      };

      const service = new UpdateService(mockSource);
      const update = await service.checkForUpdate();

      expect(update).not.toBeNull();
      expect(update?.version).toBe('0.4.1');
      expect(update?.body).toContain('修復理智抽卡異常');
    });

    it('returns null when mock source has same or older version', async () => {
      const mockSource: UpdateSource = {
        check: vi.fn().mockResolvedValue(null),
      };

      const service = new UpdateService(mockSource);
      const update = await service.checkForUpdate();

      expect(update).toBeNull();
    });

    it('handles network error in silent mode without throwing', async () => {
      const mockSource: UpdateSource = {
        check: vi.fn().mockRejectedValue(new Error('Network timeout')),
      };

      const service = new UpdateService(mockSource);
      const update = await service.checkForUpdate({ silent: true });

      expect(update).toBeNull();
    });

    it('throws error when check fails in non-silent (manual) mode', async () => {
      const mockSource: UpdateSource = {
        check: vi.fn().mockRejectedValue(new Error('Network timeout')),
      };

      const service = new UpdateService(mockSource);
      await expect(service.checkForUpdate({ silent: false })).rejects.toThrow('Network timeout');
    });
  });

  describe('Download and relaunch operations (ADR-0040 / #75)', () => {
    it('delegates downloadAndInstall to source and reports progress', async () => {
      const progressUpdates: number[] = [];
      const mockSource: UpdateSource = {
        check: vi.fn().mockResolvedValue(null),
        downloadAndInstall: vi.fn().mockImplementation(async (onProgress) => {
          onProgress?.(25);
          onProgress?.(75);
          onProgress?.(100);
        }),
      };

      const service = new UpdateService(mockSource);
      await service.downloadAndInstall((pct) => progressUpdates.push(pct));

      expect(mockSource.downloadAndInstall).toHaveBeenCalled();
      expect(progressUpdates).toEqual([25, 75, 100]);
    });

    it('delegates relaunch to source', async () => {
      const mockSource: UpdateSource = {
        check: vi.fn().mockResolvedValue(null),
        relaunch: vi.fn().mockResolvedValue(undefined),
      };

      const service = new UpdateService(mockSource);
      await service.relaunch();

      expect(mockSource.relaunch).toHaveBeenCalled();
    });

    it('provides safe fallback for browser mode without throwing', async () => {
      const service = new UpdateService();
      const progressUpdates: number[] = [];
      await expect(
        service.downloadAndInstall((pct) => progressUpdates.push(pct))
      ).resolves.not.toThrow();
      expect(progressUpdates).toContain(100);
    });

    it('reports isPortableMode false in browser environment', async () => {
      const service = new UpdateService();
      expect(await service.isPortableMode()).toBe(false);
    });

    it('delegates isPortableMode to source when implemented', async () => {
      const mockSource: UpdateSource = {
        check: vi.fn().mockResolvedValue(null),
        isPortableMode: vi.fn().mockResolvedValue(true),
      };
      const service = new UpdateService(mockSource);
      expect(await service.isPortableMode()).toBe(true);
      expect(mockSource.isPortableMode).toHaveBeenCalled();
    });
  });

  describe('TauriUpdateSource Portable Flow (Issue #76 / self_replace)', () => {
    it('executes download_portable_binary and replace_and_relaunch_portable in portable mode', async () => {
      const { TauriUpdateSource } = await import('./updateService');

      let progressHandler: ((event: any) => void) | null = null;
      const mockInvoke = vi.fn().mockImplementation((cmd) => {
        if (cmd === 'is_portable_mode') return Promise.resolve(true);
        if (cmd === 'download_portable_binary') {
          if (progressHandler) {
            progressHandler({
              payload: {
                downloaded: 50,
                total: 100,
                percent: 50,
              },
            });
          }
          return Promise.resolve('C:\\temp\\update.tmp');
        }
        if (cmd === 'replace_and_relaunch_portable') return Promise.resolve(undefined);
        return Promise.resolve(null);
      });

      const mockListen = vi.fn().mockImplementation((event, handler) => {
        if (event === 'portable-download-progress') {
          progressHandler = handler;
        }
        return Promise.resolve(() => {});
      });

      const mockUpdaterCheck = vi.fn().mockResolvedValue({
        version: '0.4.1',
        currentVersion: '0.4.0',
        body: '可攜版綠色更新',
        date: '2026-09-26',
        rawJson: {
          platforms: {
            'windows-x86_64': {
              portable_url: 'https://github.com/amais23/Lovecraftian-Text-Card-Adventure/releases/download/v0.4.1/LovecraftianCardAdventure.exe',
            },
          },
        },
      });

      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke,
      }));
      vi.doMock('@tauri-apps/api/event', () => ({
        listen: mockListen,
      }));
      vi.doMock('@tauri-apps/plugin-updater', () => ({
        check: mockUpdaterCheck,
      }));

      const source = new TauriUpdateSource();
      const isPortable = await source.isPortableMode();
      expect(isPortable).toBe(true);
      expect(mockInvoke).toHaveBeenCalledWith('is_portable_mode');

      const info = await source.check();
      expect(info).not.toBeNull();
      expect(info?.version).toBe('0.4.1');
      expect(info?.isPortable).toBe(true);

      const progressValues: number[] = [];
      await source.downloadAndInstall((pct) => progressValues.push(pct));

      expect(mockInvoke).toHaveBeenCalledWith('download_portable_binary', {
        downloadUrl: 'https://github.com/amais23/Lovecraftian-Text-Card-Adventure/releases/download/v0.4.1/LovecraftianCardAdventure.exe',
      });
      expect(progressValues).toContain(50);
      expect(progressValues).toContain(100);

      // Now test relaunch
      await source.relaunch();
      expect(mockInvoke).toHaveBeenCalledWith('replace_and_relaunch_portable', {
        newBinaryPath: 'C:\\temp\\update.tmp',
      });
    });
  });

  describe('openExternalUrl helper', () => {
    it('uses window.open in browser environment when __TAURI_INTERNALS__ is absent', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      await openExternalUrl('https://example.com');
      expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com', '_blank');
      windowOpenSpy.mockRestore();
    });

    it('delegates to Tauri invoke open_external_url when __TAURI_INTERNALS__ is present', async () => {
      const mockInvoke = vi.fn().mockResolvedValue(undefined);
      vi.doMock('@tauri-apps/api/core', () => ({
        invoke: mockInvoke,
      }));

      // Simulate Tauri environment
      (window as any).__TAURI_INTERNALS__ = {};

      try {
        await openExternalUrl('https://github.com/amais23');
        expect(mockInvoke).toHaveBeenCalledWith('open_external_url', {
          url: 'https://github.com/amais23',
        });
      } finally {
        delete (window as any).__TAURI_INTERNALS__;
      }
    });
  });
});
