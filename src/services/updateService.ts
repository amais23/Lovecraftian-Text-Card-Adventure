export interface UpdateInfo {
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
  isPortable?: boolean;
}

export interface CheckUpdateOptions {
  silent?: boolean;
  timeoutMs?: number;
}

export interface UpdateSource {
  check(options?: CheckUpdateOptions): Promise<UpdateInfo | null>;
  downloadAndInstall?(onProgress?: (progress: number) => void): Promise<void>;
  relaunch?(): Promise<void>;
  isPortableMode?(): Promise<boolean>;
}

export const CURRENT_APP_VERSION = '0.4.0';
export const IGNORED_UPDATE_VERSION_KEY = 'arkham_ignored_update_version';

export class BrowserFallbackUpdateSource implements UpdateSource {
  async check(): Promise<UpdateInfo | null> {
    // In web browser or mock dev mode without Tauri, no native updates are fetched
    return null;
  }

  async downloadAndInstall(onProgress?: (progress: number) => void): Promise<void> {
    onProgress?.(100);
  }

  async relaunch(): Promise<void> {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  }

  async isPortableMode(): Promise<boolean> {
    return false;
  }
}

export class TauriUpdateSource implements UpdateSource {
  private activeUpdate: any = null;
  private isPortable: boolean = false;
  private downloadedTempBinaryPath: string | null = null;
  private portableDownloadUrl: string | null = null;

  async isPortableMode(): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<boolean>('is_portable_mode');
    } catch {
      return false;
    }
  }

  async check(options?: CheckUpdateOptions): Promise<UpdateInfo | null> {
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check({
        timeout: options?.timeoutMs,
      });
      if (!update) return null;
      this.activeUpdate = update;
      this.isPortable = await this.isPortableMode();

      const version = update.version.startsWith('v') ? update.version : `v${update.version}`;
      this.portableDownloadUrl =
        (update.rawJson?.platforms as any)?.['windows-x86_64']?.portable_url ||
        (update.rawJson?.portable_url as string) ||
        `https://github.com/amais23/Lovecraftian-Text-Card-Adventure/releases/download/${version}/LovecraftianCardAdventure.exe`;

      return {
        version: update.version,
        currentVersion: update.currentVersion,
        body: update.body,
        date: update.date,
        isPortable: this.isPortable,
      };
    } catch (err) {
      if (options?.silent) {
        return null;
      }
      throw err;
    }
  }

  async downloadAndInstall(onProgress?: (progress: number) => void): Promise<void> {
    if (!this.activeUpdate) {
      throw new Error('未發現可用的更新物件');
    }

    if (this.isPortable) {
      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      let unlisten: (() => void) | null = null;
      try {
        unlisten = await listen<{ downloaded: number; total: number | null; percent: number | null }>(
          'portable-download-progress',
          (event) => {
            if (event.payload.percent !== null && event.payload.percent !== undefined) {
              onProgress?.(Math.min(100, Math.round(event.payload.percent)));
            }
          }
        );

        const downloadUrl = this.portableDownloadUrl || '';
        const tempPath = await invoke<string>('download_portable_binary', {
          downloadUrl,
        });
        this.downloadedTempBinaryPath = tempPath;
        onProgress?.(100);
      } finally {
        if (unlisten) {
          unlisten();
        }
      }
      return;
    }

    let totalBytes = 0;
    let downloadedBytes = 0;
    await this.activeUpdate.downloadAndInstall((event: any) => {
      if (event.event === 'Started') {
        totalBytes = event.data.contentLength ?? 0;
        downloadedBytes = 0;
        onProgress?.(0);
      } else if (event.event === 'Progress') {
        downloadedBytes += event.data.chunkLength ?? 0;
        if (totalBytes > 0) {
          const pct = Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
          onProgress?.(pct);
        }
      } else if (event.event === 'Finished') {
        onProgress?.(100);
      }
    });
  }

  async relaunch(): Promise<void> {
    if (this.isPortable && this.downloadedTempBinaryPath) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('replace_and_relaunch_portable', {
        newBinaryPath: this.downloadedTempBinaryPath,
      });
      return;
    }

    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  }
}

export class UpdateService {
  private source: UpdateSource;

  constructor(source?: UpdateSource) {
    if (source) {
      this.source = source;
    } else if (this.isTauriEnvironment()) {
      this.source = new TauriUpdateSource();
    } else {
      this.source = new BrowserFallbackUpdateSource();
    }
  }

  getCurrentVersion(): string {
    return CURRENT_APP_VERSION;
  }

  isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  getDismissedVersion(): string | null {
    try {
      return localStorage.getItem(IGNORED_UPDATE_VERSION_KEY);
    } catch {
      return null;
    }
  }

  isVersionDismissed(version: string): boolean {
    const dismissed = this.getDismissedVersion();
    return dismissed === version;
  }

  dismissVersion(version: string): void {
    try {
      localStorage.setItem(IGNORED_UPDATE_VERSION_KEY, version);
    } catch {
      // Ignore localStorage quota or access errors in restricted modes
    }
  }

  clearDismissedVersion(): void {
    try {
      localStorage.removeItem(IGNORED_UPDATE_VERSION_KEY);
    } catch {
      // Ignore
    }
  }

  async checkForUpdate(options: CheckUpdateOptions = {}): Promise<UpdateInfo | null> {
    const { silent = false, timeoutMs = 5000 } = options;

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Update check timed out')), timeoutMs)
    );

    try {
      const updatePromise = this.source.check(options);
      const result = await Promise.race([updatePromise, timeoutPromise]);
      return result;
    } catch (err) {
      if (silent) {
        return null;
      }
      throw err;
    }
  }

  async downloadAndInstall(onProgress?: (progress: number) => void): Promise<void> {
    if (this.source.downloadAndInstall) {
      return this.source.downloadAndInstall(onProgress);
    }
    onProgress?.(100);
  }

  async relaunch(): Promise<void> {
    if (this.source.relaunch) {
      return this.source.relaunch();
    }
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  }

  async isPortableMode(): Promise<boolean> {
    if (this.source.isPortableMode) {
      return this.source.isPortableMode();
    }
    return false;
  }
}

export const updateService = new UpdateService();
