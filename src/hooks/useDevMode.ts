import { useSyncExternalStore } from 'react';
import { devModeManager } from '../engine/devModeManager';

function subscribe(callback: () => void) {
  return devModeManager.subscribe(callback);
}

function getSnapshot(): boolean {
  return devModeManager.getDevMode();
}

/**
 * 響應式獲取開發者模式 (Dev Mode) 啟用狀態
 * 使用 useSyncExternalStore 確保 SettingsModal、TitleMenu 等跨元件絕對同步
 */
export function useDevMode(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
