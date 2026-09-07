import React from 'react';
import { Settings, X, Volume2, VolumeX, Sparkles, Swords, Shield, Flame, Activity, Keyboard } from 'lucide-react';
import { soundEngine } from '../../engine/audioManager';
import { useSoundMuted } from '../../hooks/useSoundMuted';
import { useModalDismiss } from '../../hooks/useModalDismiss';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const isMuted = useSoundMuted();
  const { handleBackdropClick, dismiss } = useModalDismiss({ isOpen, onClose });

  if (!isOpen) return null;

  const handleToggleMute = () => {
    soundEngine.toggleMuteWithFeedback();
  };

  return (
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

          {/* Section 3: About & Version */}
          <section className="settings-section about-section">
            <h3 className="section-title-sub">關於本調查手記</h3>
            <div className="about-details">
              <p>
                <strong>《克蘇魯文字卡牌冒險》</strong> v0.2.0
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
  );
};
