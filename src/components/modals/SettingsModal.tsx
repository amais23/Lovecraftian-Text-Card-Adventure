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
              SETTINGS & AUDIO SYNTHESIS · 系統與音頻控制
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
                <h3>全域音效 (Global Sound Effects)</h3>
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
              採用 Web Audio API 零延遲程序化音效合成器，隨時提供真實手感，無須下載外部音檔。
            </p>
          </section>

          {/* Section 2: Sound Test Board */}
          <section className="settings-section">
            <h3 className="section-title-sub">
              <Sparkles size={16} color="#cfa866" />
              <span>音效試聽面板 (Audio Synthesizer Sandbox)</span>
            </h3>
            <div className="sound-test-grid">
              <button
                className="sound-test-btn"
                onClick={() => soundEngine.playClick()}
                disabled={isMuted}
              >
                <span>羊皮紙點擊</span>
                <span className="sound-cue-tag">UI Click</span>
              </button>

              <button
                className="sound-test-btn"
                onClick={() => soundEngine.playDrawCard()}
                disabled={isMuted}
              >
                <span>抽牌滑動聲</span>
                <span className="sound-cue-tag">Card Draw</span>
              </button>

              <button
                className="sound-test-btn"
                onClick={() => soundEngine.playDamage()}
                disabled={isMuted}
              >
                <Activity size={14} color="#ff334b" />
                <span>肉體受創撕咬</span>
                <span className="sound-cue-tag">Damage Hit</span>
              </button>

              <button
                className="sound-test-btn"
                onClick={() => soundEngine.playTypewriterKey()}
                disabled={isMuted}
              >
                <Keyboard size={14} color="#cfa866" />
                <span>打字機敲擊聲</span>
                <span className="sound-cue-tag">Typewriter</span>
              </button>

              <button
                className="sound-test-btn combat"
                onClick={() => soundEngine.playCardPlay('combat')}
                disabled={isMuted}
              >
                <Swords size={14} color="#e63946" />
                <span>紅卡 (戰鬥打擊)</span>
              </button>

              <button
                className="sound-test-btn skill"
                onClick={() => soundEngine.playCardPlay('skill')}
                disabled={isMuted}
              >
                <Shield size={14} color="#f4a261" />
                <span>黃卡 (戰術護甲)</span>
              </button>

              <button
                className="sound-test-btn magic"
                onClick={() => soundEngine.playCardPlay('magic')}
                disabled={isMuted}
              >
                <Sparkles size={14} color="#c77dff" />
                <span>紫卡 (秘術冷焰)</span>
              </button>

              <button
                className="sound-test-btn truth"
                onClick={() => soundEngine.playCardPlay('truth')}
                disabled={isMuted}
              >
                <Sparkles size={14} color="#f8fafc" />
                <span>白卡 (星界真相)</span>
              </button>

              <button
                className="sound-test-btn madness"
                onClick={() => soundEngine.playCardPlay('madness')}
                disabled={isMuted}
              >
                <Flame size={14} color="#ef4444" />
                <span>黑卡 (狂亂深淵)</span>
              </button>
            </div>
          </section>

          {/* Section 3: About & Version */}
          <section className="settings-section about-section">
            <h3 className="section-title-sub">關於作品 (About)</h3>
            <div className="about-details">
              <p>
                <strong>《克蘇魯文字卡牌冒險》</strong> v0.1.0
              </p>
              <p className="about-flavor">
                基於 H.P. 洛夫克拉夫特宇宙恐懼神話體系打造的文字冒險與卡牌對弈遊戲。
              </p>
              <p className="about-legal">
                純前端 Vite + React 19 + TypeScript 架構 · 免費開放源碼專案
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
