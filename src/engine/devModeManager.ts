/**
 * 開發者模式管理器 (Dev Mode Manager)
 * 遵循 ADR-0036：狀態持久化於 localStorage，提供即時響應式狀態訂閱
 */

export const DEV_MODE_STORAGE_KEY = 'arkham_dev_mode';

export class DevModeManager {
  private isDev: boolean = false;
  private listeners: Set<(enabled: boolean) => void> = new Set();

  constructor() {
    this.reloadFromStorage();
  }

  /**
   * 從 localStorage 重新加載狀態
   */
  public reloadFromStorage(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(DEV_MODE_STORAGE_KEY);
        this.isDev = saved === 'true';
      } catch {
        this.isDev = false;
      }
    }
  }

  /**
   * 獲取當前開發者模式啟用狀態
   */
  public getDevMode(): boolean {
    return this.isDev;
  }

  /**
   * 設置開發者模式狀態並持久化至 localStorage
   */
  public setDevMode(enabled: boolean): void {
    this.isDev = enabled;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(DEV_MODE_STORAGE_KEY, String(enabled));
      } catch (e) {
        console.error('Failed to persist dev mode state to localStorage', e);
      }
    }
    this.notifyListeners();
  }

  /**
   * 切換開發者模式狀態
   */
  public toggleDevMode(): boolean {
    this.setDevMode(!this.isDev);
    return this.isDev;
  }

  /**
   * 訂閱開發者模式狀態變更
   */
  public subscribe(listener: (enabled: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isDev);
      } catch (e) {
        console.error('Error notifying devMode listener', e);
      }
    });
  }
}

export const devModeManager = new DevModeManager();
