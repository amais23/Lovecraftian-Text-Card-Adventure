import { useSyncExternalStore } from 'react';
import { soundEngine } from '../engine/audioManager';

function subscribe(callback: () => void) {
  return soundEngine.subscribe(callback);
}

function getSnapshot(): boolean {
  return soundEngine.getMuted();
}

/**
 * 響應式獲取全域音效靜音狀態
 * 使用 useSyncExternalStore 確保 AudioToggle、SettingsModal 等跨元件絕對同步
 */
export function useSoundMuted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
