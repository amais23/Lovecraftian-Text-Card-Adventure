import React from 'react';
import { Settings, X, Volume2, VolumeX, Sparkles, Swords, Shield, Flame, Activity, Keyboard, Terminal, RefreshCw, Loader2 } from 'lucide-react';
import { soundEngine } from '../../engine/audioManager';
import { useSoundMuted } from '../../hooks/useSoundMuted';
import { useModalDismiss } from '../../hooks/useModalDismiss';
import { useDevMode } from '../../hooks/useDevMode';
import { devModeManager } from '../../engine/devModeManager';
import { updateService as defaultUpdateService, type UpdateService } from '../../services/updateService';
import { useAutoUpdater } from '../../hooks/useAutoUpdater';
import { UpdateModal } from './UpdateModal';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGameInProgress?: boolean;
  isInGame?: boolean;
  updateService?: UpdateService;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isGameInProgress = false,
  isInGame = false,
  updateService: updateServiceProp,
}) => {
  const isMuted = useSoundMuted();
  const isDevMode = useDevMode();
  const { handleBackdropClick, dismiss } = useModalDismiss({ isOpen, onClose });

  const isGameActive = Boolean(isGameInProgress || isInGame);
  const activeUpdateService = updateServiceProp ?? defaultUpdateService;
  const currentVersion = activeUpdateService.getCurrentVersion();
  const updater = useAutoUpdater({ service: activeUpdateService });

  if (!isOpen) return null;

  const handleToggleMute = () => {
    soundEngine.toggleMuteWithFeedback();
  };

  const handleToggleDevMode = () => {
    soundEngine.playClick();
    devModeManager.toggleDevMode();
  };

  const handleCheckUpdate = () => {
    if (isGameActive || updater.status === 'checking') return;
    soundEngine.playClick();
    void updater.checkUpdate(false);
  };

  return (
    <>
      <div
        className="eldritch-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="eldritch-modal-container settings-modal-container">
        {/* Header */}
        <div className="eldritch-modal-header">
          <div className="modal-header-icon-badge">
            <Settings size={24} color="#cfa866" />
          </div>
          <div>
            <h2 id="settings-modal-title" className="eldritch-modal-title">
              遊戲設定
            </h2>
            <p className="eldritch-modal-subtitle">
              感官調節 · 聲音反饋與手記記載
            </p>
          </div>
          <button
            className="eldritch-modal-close-btn"
            onClick={dismiss}
            aria-label="關閉設定"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="settings-modal-body">
          {/* Section 1: Audio Switch */}
          <section className="settings-section">
            <div className="settings-section-header">
              <div className="section-title-wrap">
                {isMuted ? <VolumeX size={20} color="#9d9685" /> : <Volume2 size={20} color="#ffd700" />}
                <h3>全域氛圍音效</h3>
              </div>
              <button
                id="settings-mute-toggle-btn"
                className={`settings-toggle-switch ${!isMuted ? 'active' : ''}`}
                onClick={handleToggleMute}
                aria-label={isMuted ? '開啟全域音效' : '關閉全域音效'}
              >
                <span className="toggle-slider-knob" />
                <span className="toggle-status-text">{isMuted ? '靜音中' : '已啟用'}</span>
              </button>
            </div>
            <p className="settings-hint">
              程序化氛圍音頻即時生成，提供沉浸身歷其境的感官反饋。
            </p>
          </section>

          {/* Section 2: Sound Test Board */}
          <section className="settings-section">
            <h3 className="section-title-sub">
              <Sparkles size={16} color="#cfa866" />
              <span>聲效感官試聽</span>
            </h3>
            <div className="sound-test-grid">
              <button
                className="sound-test-btn"
                onClick={() => soundEngine.playClick()}
                disabled={isMuted}
              >
                <span>羊皮紙點擊</span>
                <span className="sound-cue-tag">點擊</span>
              </button>

              <button
                className="sound-test-btn"
                onClick={() => soundEngine.playDrawCard()}
                disabled={isMuted}
              >
                <span>抽牌滑動聲</span>
                <span className="sound-cue-tag">抽牌</span>
              </button>

              <button
                className="sound-test-btn"
                onClick={() => soundEngine.playDamage()}
                disabled={isMuted}
              >
                <Activity size={14} color="#ff334b" />
                <span>肉體受創撕咬</span>
                <span className="sound-cue-tag">受創</span>
              </button>

              <button
                className="sound-test-btn"
                onClick={() => soundEngine.playTypewriterKey()}
                disabled={isMuted}
              >
                <Keyboard size={14} color="#cfa866" />
                <span>打字機敲擊聲</span>
                <span className="sound-cue-tag">打字</span>
              </button>

              <button
                className="sound-test-btn combat"
                onClick={() => soundEngine.playCardPlay('combat')}
                disabled={isMuted}
              >
                <Swords size={14} color="#e63946" />
                <span>紅色戰鬥卡 · 物理打擊</span>
              </button>

              <button
                className="sound-test-btn skill"
                onClick={() => soundEngine.playCardPlay('skill')}
                disabled={isMuted}
              >
                <Shield size={14} color="#f4a261" />
                <span>黃色技能卡 · 生存護甲</span>
              </button>

              <button
                className="sound-test-btn magic"
                onClick={() => soundEngine.playCardPlay('magic')}
                disabled={isMuted}
              >
                <Sparkles size={14} color="#c77dff" />
                <span>紫色魔法卡 · 秘術冷焰</span>
              </button>

              <button
                className="sound-test-btn truth"
                onClick={() => soundEngine.playCardPlay('truth')}
                disabled={isMuted}
              >
                <Sparkles size={14} color="#f8fafc" />
                <span>白色真相卡 · 星界啟示</span>
              </button>

              <button
                className="sound-test-btn madness"
                onClick={() => soundEngine.playCardPlay('madness')}
                disabled={isMuted}
              >
                <Flame size={14} color="#ef4444" />
                <span>黑色瘋狂卡 · 狂亂深淵</span>
              </button>
            </div>
          </section>

          {/* Section: Dev Mode (ADR-0036 / #62) */}
          <section className="settings-section">
            <div className="settings-section-header">
              <div className="section-title-wrap">
                <Terminal size={20} color={isDevMode ? '#ffd700' : '#9d9685'} />
                <h3>開發者模式 (Dev Mode)</h3>
              </div>
              <button
                id="settings-dev-mode-toggle-btn"
                className={`settings-toggle-switch ${isDevMode ? 'active' : ''}`}
                onClick={handleToggleDevMode}
                aria-label={isDevMode ? '關閉開發者模式' : '開啟開發者模式'}
              >
                <span className="toggle-slider-knob" />
                <span className="toggle-status-text">{isDevMode ? '已啟用' : '已關閉'}</span>
              </button>
            </div>
            <p className="settings-hint">
              啟用後可於主選單進入卡牌改動審查室與開發除錯工具。
            </p>
          </section>

          {/* Section: Version & Update (Issue #74 / ADR-0040) */}
          <section className="settings-section settings-update-section">
            <div className="settings-section-header">
              <div className="section-title-wrap">
                <RefreshCw
                  size={20}
                  color="#ffd700"
                  className={updater.status === 'checking' ? 'spin-animation' : ''}
                />
                <h3>版本與更新</h3>
              </div>
              <div className="settings-version-pill">
                <span className="version-label">目前本機版本</span>
                <span className="version-number">v{currentVersion}</span>
              </div>
            </div>

            <div className="settings-update-body">
              <div className="settings-update-action-row">
                <button
                  id="settings-check-update-btn"
                  className={`settings-action-btn ${isGameActive ? 'disabled' : ''} ${updater.status === 'checking' ? 'checking' : ''}`}
                  onClick={handleCheckUpdate}
                  disabled={isGameActive || updater.status === 'checking'}
                  aria-label="檢查更新"
                  title={isGameActive ? '請返回主標題選單進行更新' : '檢查更新'}
                >
                  {updater.status === 'checking' ? (
                    <>
                      <Loader2 size={16} className="spin-animation" />
                      <span>檢查中...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>檢查更新</span>
                    </>
                  )}
                </button>

                {isGameActive && (
                  <p className="settings-update-guard-hint" role="status">
                    ⚠️ 請返回主標題選單進行更新
                  </p>
                )}

                {!isGameActive && updater.status === 'up-to-date' && (
                  <p className="settings-update-status up-to-date" role="status">
                    ✓ 目前已是最新版本
                  </p>
                )}

                {!isGameActive && updater.status === 'error' && (
                  <p className="settings-update-status error" role="alert">
                    ✕ {updater.error || '檢查更新失敗：無法連線至更新伺服器'}
                  </p>
                )}

                {!isGameActive && updater.status === 'available' && (
                  <div className="settings-update-available-info">
                    <span className="settings-update-status available" role="status">
                      ★ 發現新版本 v{updater.updateInfo?.version}
                    </span>
                    <button
                      className="settings-view-update-btn"
                      onClick={updater.openModal}
                    >
                      檢視更新資訊
                    </button>
                  </div>
                )}
              </div>

              <p className="settings-hint">
                {isGameActive
                  ? '為保障記憶體即時對局與存檔資料完整，探險與戰鬥途中鎖定更新重啟。'
                  : '手動檢查 GitHub Releases 最新發布版本，即使用戶曾勾選略過此版本仍可手動喚起更新。'}
              </p>
            </div>
          </section>

          {/* Section 4: About & Version */}
          <section className="settings-section about-section">
            <h3 className="section-title-sub">關於本調查手記</h3>
            <div className="about-details">
              <p>
                <strong>《克蘇魯文字卡牌冒險》</strong> v{currentVersion}
              </p>
              <p className="about-flavor">
                基於 H.P. 洛夫克拉夫特宇宙恐懼神話體系打造的文字冒險與卡牌對弈遊戲。
              </p>
              <p className="about-legal">
                洛夫克拉夫特宇宙恐懼神話對弈體驗 · 調查員手記
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>

    <UpdateModal
        isOpen={updater.isModalOpen}
        onClose={updater.closeModal}
        updateInfo={updater.updateInfo}
        onDismissVersion={updater.dismissCurrentVersion}
      />
    </>
  );
};
