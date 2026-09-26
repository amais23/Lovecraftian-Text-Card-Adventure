export interface UpdateInfo {
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
}

export interface CheckUpdateOptions {
  silent?: boolean;
  timeoutMs?: number;
}

export interface UpdateSource {
  check(options?: CheckUpdateOptions): Promise<UpdateInfo | null>;
}

export const CURRENT_APP_VERSION = '0.4.0';
export const IGNORED_UPDATE_VERSION_KEY = 'arkham_ignored_update_version';

export class BrowserFallbackUpdateSource implements UpdateSource {
  async check(): Promise<UpdateInfo | null> {
    // In web browser or mock dev mode without Tauri, no native updates are fetched
    return null;
  }
}

export class UpdateService {
  private source: UpdateSource;

  constructor(source?: UpdateSource) {
    this.source = source ?? new BrowserFallbackUpdateSource();
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
}

export const updateService = new UpdateService();
