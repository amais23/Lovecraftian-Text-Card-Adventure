import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  UpdateService,
  CURRENT_APP_VERSION,
  IGNORED_UPDATE_VERSION_KEY,
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
  });
});
