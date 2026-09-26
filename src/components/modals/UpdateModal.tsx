import React, { useState } from 'react';
import { ArrowUpCircle, X, ExternalLink, Sparkles, ScrollText } from 'lucide-react';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { soundEngine } from '../../engine/audioManager';
import type { UpdateInfo } from '../../services/updateService';

export interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  onDismissVersion: (version: string) => void;
  onStartUpdate?: () => void;
  downloadProgress?: number | null;
  isDownloading?: boolean;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  onDismissVersion,
  onStartUpdate,
  downloadProgress = null,
  isDownloading = false,
}) => {
  const [dontRemind, setDontRemind] = useState<boolean>(false);

  const handleDismissAction = () => {
    if (dontRemind && updateInfo?.version) {
      onDismissVersion(updateInfo.version);
    }
    onClose();
  };

  const { handleBackdropClick, dismiss } = useModalDismiss({
    isOpen,
    onClose: handleDismissAction,
  });

  if (!isOpen || !updateInfo) return null;

  const handleStartUpdateClick = () => {
    soundEngine.playClick();
    onStartUpdate?.();
  };

  const handleOpenReleasePage = () => {
    soundEngine.playClick();
    if (typeof window !== 'undefined') {
      window.open(
        'https://github.com/amais23/Lovecraftian-Text-Card-Adventure/releases/latest',
        '_blank'
      );
    }
  };

  return (
    <div
      className="eldritch-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-modal-title"
    >
      <div className="eldritch-modal-container update-modal-container" style={{ maxWidth: '580px' }}>
        {/* Header */}
        <div className="eldritch-modal-header">
          <div className="modal-header-icon-badge">
            <ArrowUpCircle size={24} color="#cfa866" />
          </div>
          <div>
            <h2 id="update-modal-title" className="eldritch-modal-title">
              異界低語 · 發現新版本
            </h2>
            <p className="eldritch-modal-subtitle">
              時空錨點異動 · 探索手記版本修訂
            </p>
          </div>
          <button
            className="eldritch-modal-close-btn"
            onClick={dismiss}
            aria-label="關閉更新提示"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="settings-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Version badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'rgba(207, 168, 102, 0.08)',
              border: '1px solid rgba(207, 168, 102, 0.25)',
              borderRadius: '8px',
            }}
          >
            <div>
              <span style={{ fontSize: '12px', color: '#9d9685', display: 'block' }}>目前版本</span>
              <span style={{ fontSize: '15px', color: '#ded1bd', fontFamily: 'monospace' }}>
                v{updateInfo.currentVersion}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#cfa866" />
              <span style={{ fontSize: '13px', color: '#cfa866' }}>發現最新</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12px', color: '#9d9685', display: 'block' }}>可更新至</span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#ffd700',
                  fontFamily: 'monospace',
                }}
              >
                {updateInfo.version}
              </span>
            </div>
          </div>

          {/* Release Notes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#cfa866', fontSize: '13px' }}>
              <ScrollText size={16} />
              <span>更新日誌摘要</span>
            </div>
            <div
              style={{
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '12px 14px',
                backgroundColor: 'rgba(10, 12, 16, 0.85)',
                border: '1px solid rgba(157, 150, 133, 0.2)',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#c4baa6',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
              }}
            >
              {updateInfo.body || '包含平衡性修正、系統穩定度提升與不可名狀之異常修復。'}
            </div>
          </div>

          {/* Download Progress if active */}
          {isDownloading && downloadProgress !== null && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cfa866', marginBottom: '4px' }}>
                <span>正在下載更新檔案...</span>
                <span>{Math.round(downloadProgress)}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, downloadProgress))}%`,
                    height: '100%',
                    backgroundColor: '#ffd700',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}

          {/* Checkbox: Do not remind again for this version */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#9d9685',
              cursor: 'pointer',
              marginTop: '4px',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={dontRemind}
              onChange={(e) => setDontRemind(e.target.checked)}
              aria-label="不再提示此版本"
              style={{ cursor: 'pointer', accentColor: '#cfa866' }}
            />
            <span>不再提示此版本（仍可隨時於遊戲設定手動檢查）</span>
          </label>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(207, 168, 102, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="eldritch-btn-secondary"
              onClick={dismiss}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(157, 150, 133, 0.3)',
                color: '#ded1bd',
                cursor: 'pointer',
              }}
            >
              稍後再說
            </button>
            <button
              type="button"
              className="eldritch-btn-primary"
              onClick={handleStartUpdateClick}
              disabled={isDownloading}
              style={{
                padding: '8px 22px',
                borderRadius: '6px',
                backgroundColor: '#9a2424',
                border: '1px solid #ffd700',
                color: '#fff',
                fontWeight: 'bold',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                opacity: isDownloading ? 0.7 : 1,
              }}
            >
              {isDownloading ? '正在下載更新...' : '立即更新'}
            </button>
          </div>

          {/* Portable helper link */}
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#7a7364' }}>
            <span>使用 Windows 免安裝綠色版？</span>
            <button
              type="button"
              onClick={handleOpenReleasePage}
              style={{
                background: 'none',
                border: 'none',
                color: '#cfa866',
                cursor: 'pointer',
                textDecoration: 'underline',
                marginLeft: '4px',
                padding: 0,
                fontSize: '11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              造訪 GitHub Releases 手動下載 ZIP <ExternalLink size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
