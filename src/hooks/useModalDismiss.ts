import React, { useEffect, useCallback } from 'react';
import { soundEngine } from '../engine/audioManager';

interface UseModalDismissOptions {
  isOpen: boolean;
  onClose: () => void;
  playDismissSound?: boolean;
}

/**
 * 彈窗通用關閉處理 Hook
 * 統一處理 Escape 鍵盤監聽與 Backdrop 點擊關閉，消除重複樣板代碼
 */
export function useModalDismiss({
  isOpen,
  onClose,
  playDismissSound = true,
}: UseModalDismissOptions) {
  const dismiss = useCallback(() => {
    if (playDismissSound) {
      soundEngine.playClick();
    }
    onClose();
  }, [onClose, playDismissSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        dismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dismiss]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        dismiss();
      }
    },
    [dismiss]
  );

  return {
    handleBackdropClick,
    dismiss,
  };
}
