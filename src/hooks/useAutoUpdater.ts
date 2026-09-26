import { useState, useCallback, useRef, useEffect } from 'react';
import { updateService as defaultUpdateService, type UpdateService, type UpdateInfo } from '../services/updateService';

export type UpdaterStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error';

export interface UseAutoUpdaterOptions {
  service?: UpdateService;
}

export interface UseAutoUpdaterReturn {
  status: UpdaterStatus;
  updateInfo: UpdateInfo | null;
  error: string | null;
  downloadProgress: number | null;
  isModalOpen: boolean;
  isDismissed: boolean;
  openModal: () => void;
  closeModal: () => void;
  checkUpdate: (silent?: boolean) => Promise<void>;
  startDownload: () => Promise<void>;
  relaunch: () => Promise<void>;
  dismissCurrentVersion: () => void;
}

export const useAutoUpdater = (options: UseAutoUpdaterOptions = {}): UseAutoUpdaterReturn => {
  const service = options.service ?? defaultUpdateService;
  const [status, setStatus] = useState<UpdaterStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const dismissCurrentVersion = useCallback(() => {
    if (updateInfo?.version) {
      service.dismissVersion(updateInfo.version);
      if (isMountedRef.current) {
        setIsDismissed(true);
        setIsModalOpen(false);
      }
    }
  }, [service, updateInfo]);

  const checkUpdate = useCallback(
    async (silent: boolean = false) => {
      if (!silent && isMountedRef.current) {
        setStatus('checking');
        setError(null);
      }

      try {
        const info = await service.checkForUpdate({ silent });
        if (!isMountedRef.current) return;

        if (info) {
          setUpdateInfo(info);
          const dismissed = service.isVersionDismissed(info.version);
          setIsDismissed(dismissed);
          setStatus('available');

          if (!silent || !dismissed) {
            setIsModalOpen(true);
          }
        } else if (!silent) {
          setUpdateInfo(null);
          setStatus('up-to-date');
        }
      } catch (err: unknown) {
        if (!isMountedRef.current) return;

        if (!silent) {
          setStatus('error');
          const errorMessage = err instanceof Error ? err.message : '檢查更新失敗';
          setError(errorMessage);
        }
      }
    },
    [service]
  );

  const startDownload = useCallback(async () => {
    if (!isMountedRef.current) return;
    setStatus('downloading');
    setError(null);
    setDownloadProgress(0);

    try {
      await service.downloadAndInstall((pct: number) => {
        if (isMountedRef.current) {
          setDownloadProgress(pct);
        }
      });
      if (isMountedRef.current) {
        setDownloadProgress(100);
        setStatus('ready');
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : '下載或安裝更新失敗';
        setError(errorMessage);
      }
    }
  }, [service]);

  const relaunch = useCallback(async () => {
    try {
      await service.relaunch();
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setStatus('error');
        const errorMessage = err instanceof Error ? err.message : '重啟失敗';
        setError(errorMessage);
      }
    }
  }, [service]);

  return {
    status,
    updateInfo,
    error,
    downloadProgress,
    isModalOpen,
    isDismissed,
    openModal,
    closeModal,
    checkUpdate,
    startDownload,
    relaunch,
    dismissCurrentVersion,
  };
};
