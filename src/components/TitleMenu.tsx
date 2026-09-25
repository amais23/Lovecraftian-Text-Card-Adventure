import React from 'react';
import {
  Compass,
  Play,
  BookOpen,
  Sparkles,
  Settings,
  Skull,
  ChevronRight,
  Scale,
} from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';
import { useDevMode } from '../hooks/useDevMode';

export interface TitleMenuProps {
  onStartNewGame: () => void;
  onOpenManual: () => void;
  onOpenCompendium: () => void;
  onOpenSettings: () => void;
  onOpenExit: () => void;
  onOpenCardReview?: () => void;
}

export const TitleMenu: React.FC<TitleMenuProps> = ({
  onStartNewGame,
  onOpenManual,
  onOpenCompendium,
  onOpenSettings,
  onOpenExit,
  onOpenCardReview,
}) => {
  const isDevMode = useDevMode();

  const handleItemClick = (action: () => void) => {
    soundEngine.playClick();
    action();
  };

  return (
    <div className="title-menu-wrapper">
      {/* Background Ambience Layers (ADR-0020) */}
      <div className="title-screen-bg-image" data-testid="title-screen-bg-image" />
      <div className="title-screen-bg-overlay" />
      <div className="vignette-overlay" />
      <div className="fog-layer" />
      <div className="cosmic-particles-bg" />

      {/* Audio Quick Switch in Top Right */}
      <div className="title-screen-audio-corner">
        <AudioToggle />
      </div>

      {/* Main Center Content */}
      <main className="title-menu-card">
        {/* Mystic Eldritch Sigil Header */}
        <header className="title-menu-header">
          <div className="title-icon-badge" title="阿卡姆舊印指引">
            <Compass size={40} color="#cfa866" />
          </div>
          <h1 className="title-screen-title">克蘇魯文字卡牌冒險</h1>
          <p className="title-screen-subtitle">LOVECRAFTIAN TEXT-CARD ADVENTURE</p>

          <div className="title-divider">
            <span className="title-divider-line" />
            <span className="title-divider-text">深淵正凝視著你 · 喚醒沉睡的心智</span>
            <span className="title-divider-line" />
          </div>
        </header>

        {/* Vertical Classic Menu Items */}
        <nav className="title-menu-nav" aria-label="經典主選單">
          {/* 1. Start New Investigation */}
          <button
            id="menu-start-btn"
            className="title-menu-btn primary-start-btn"
            onClick={() => handleItemClick(onStartNewGame)}
          >
            <div className="btn-icon-wrap">
              <Play size={20} color="#ffd700" fill="#ffd700" />
            </div>
            <div className="btn-text-group">
              <span className="btn-main-text">開啟新調查</span>
            </div>
            <ChevronRight size={18} className="btn-arrow" />
          </button>

          {/* 2. Investigation Manual */}
          <button
            id="menu-manual-btn"
            className="title-menu-btn"
            onClick={() => handleItemClick(onOpenManual)}
          >
            <div className="btn-icon-wrap">
              <BookOpen size={20} color="#cfa866" />
            </div>
            <div className="btn-text-group">
              <span className="btn-main-text">調查紀錄手冊</span>
            </div>
            <ChevronRight size={18} className="btn-arrow" />
          </button>

          {/* 3. Card Compendium */}
          <button
            id="menu-compendium-btn"
            className="title-menu-btn"
            onClick={() => handleItemClick(onOpenCompendium)}
          >
            <div className="btn-icon-wrap">
              <Sparkles size={20} color="#ab47bc" />
            </div>
            <div className="btn-text-group">
              <span className="btn-main-text">卡牌圖鑑</span>
            </div>
            <ChevronRight size={18} className="btn-arrow" />
          </button>

          {/* 3.5. Card Balance & Review Lab (ADR-0036 / #62: Only visible when Dev Mode is active) */}
          {isDevMode && onOpenCardReview && (
            <button
              id="menu-card-review-btn"
              className="title-menu-btn"
              onClick={() => handleItemClick(onOpenCardReview)}
              aria-label="⚖️ 卡牌改動審查室"
              style={{ borderColor: 'rgba(207, 168, 102, 0.4)' }}
            >
              <div className="btn-icon-wrap">
                <Scale size={20} color="#ffd700" />
              </div>
              <div className="btn-text-group">
                <span className="btn-main-text" style={{ color: '#ffd700' }}>
                  卡牌改動審查室
                </span>
              </div>
              <ChevronRight size={18} className="btn-arrow" />
            </button>
          )}

          {/* 4. Settings */}
          <button
            id="menu-settings-btn"
            className="title-menu-btn"
            onClick={() => handleItemClick(onOpenSettings)}
          >
            <div className="btn-icon-wrap">
              <Settings size={20} color="#9d9685" />
            </div>
            <div className="btn-text-group">
              <span className="btn-main-text">遊戲設定</span>
            </div>
            <ChevronRight size={18} className="btn-arrow" />
          </button>

          {/* 5. Exit Game (Easter Egg) */}
          <button
            id="menu-exit-btn"
            className="title-menu-btn exit-btn"
            onClick={() => handleItemClick(onOpenExit)}
          >
            <div className="btn-icon-wrap">
              <Skull size={20} color="#ef4444" />
            </div>
            <div className="btn-text-group">
              <span className="btn-main-text">離開遊戲</span>
            </div>
            <ChevronRight size={18} className="btn-arrow" />
          </button>
        </nav>

        {/* Footer info */}
        <footer className="title-menu-footer">
          <span>v0.4.0 · ARKHAM INVESTIGATION DIVISION</span>
        </footer>
      </main>
    </div>
  );
};
