import React from 'react';
import type { GameAction } from '../types/game';
import { OCCUPATIONS } from '../engine/initialData';
import { Compass, UserCheck, BookOpen, Heart, Zap, Coins, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';

interface TitleScreenProps {
  dispatch: React.Dispatch<GameAction>;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ dispatch }) => {
  const handleSelect = (occupationId: 'investigator' | 'occultist') => {
    soundEngine.playClick();
    dispatch({
      type: 'SELECT_OCCUPATION',
      payload: { occupationId, procedural: true },
    });
  };

  const investigator = OCCUPATIONS.investigator;
  const occultist = OCCUPATIONS.occultist;

  return (
    <div className="title-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />
      <div className="title-screen-audio-corner">
        <AudioToggle />
      </div>

      {/* Main Title Header */}
      <header className="title-screen-header">
        <div className="title-icon-badge">
          <Compass size={32} color="#cfa866" />
        </div>
        <h1 className="title-screen-title">克蘇魯文字卡牌冒險</h1>
        <p className="title-screen-subtitle">LOVECRAFTIAN TEXT-CARD ADVENTURE</p>
        <div className="title-divider">
          <span className="title-divider-line" />
          <span className="title-divider-text">命運的十字路口 · 選擇你的調查員</span>
          <span className="title-divider-line" />
        </div>
      </header>

      {/* Occupation Selection Cards */}
      <main className="occupation-selection-container">
        {/* Edward Pierce - Private Investigator */}
        <div
          className="occupation-card investigator-card"
          id="select-investigator-card"
          onClick={() => handleSelect('investigator')}
        >
          <div className="occupation-card-glow" />
          <div className="occupation-card-header">
            <div className="occupation-avatar investigator">
              <UserCheck size={36} color="#ffd700" />
            </div>
            <div className="occupation-identity">
              <h2 className="occupation-name">{investigator.name}</h2>
              <span className="occupation-badge">{investigator.occupation}</span>
            </div>
          </div>

          <p className="occupation-quote">{investigator.quote}</p>
          <p className="occupation-desc">{investigator.description}</p>

          {/* Stats Badges */}
          <div className="occupation-stats-grid">
            <div className="occupation-stat-pill health">
              <Heart size={16} color="#ff334b" />
              <span>生命值 {investigator.stats.health}</span>
            </div>
            <div className="occupation-stat-pill stamina">
              <Zap size={16} color="#ffd700" />
              <span>精力 {investigator.stats.stamina}</span>
            </div>
            <div className="occupation-stat-pill obols">
              <Coins size={16} color="#ffd700" />
              <span>古金幣 {investigator.stats.obols}</span>
            </div>
          </div>

          {/* Deck Strategy Features */}
          <div className="occupation-deck-features">
            <div className="deck-feature-title">
              <Shield size={16} color="#cfa866" />
              <span>專屬起始卡牌（12 張 · 物理生存）</span>
            </div>
            <p className="deck-feature-desc">
              配備點38轉輪手槍、重拳壓制、軍刀突刺、就地掩蔽與醫療鎮定劑。擅長以厚重護甲抵禦深淵侵襲。
            </p>
          </div>

          <button
            id="choose-investigator-btn"
            className="occupation-select-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('investigator');
            }}
          >
            <span>啟程調查</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Eleanor Vance - Occultist */}
        <div
          className="occupation-card occultist-card"
          id="select-occultist-card"
          onClick={() => handleSelect('occultist')}
        >
          <div className="occupation-card-glow" />
          <div className="occupation-card-header">
            <div className="occupation-avatar occultist">
              <BookOpen size={36} color="#c77dff" />
            </div>
            <div className="occupation-identity">
              <h2 className="occupation-name">{occultist.name}</h2>
              <span className="occupation-badge occultist">{occultist.occupation}</span>
            </div>
          </div>

          <p className="occupation-quote">{occultist.quote}</p>
          <p className="occupation-desc">{occultist.description}</p>

          {/* Stats Badges */}
          <div className="occupation-stats-grid">
            <div className="occupation-stat-pill health">
              <Heart size={16} color="#ff334b" />
              <span>生命值 {occultist.stats.health}</span>
            </div>
            <div className="occupation-stat-pill stamina">
              <Zap size={16} color="#ffd700" />
              <span>精力 {occultist.stats.stamina}</span>
            </div>
            <div className="occupation-stat-pill obols">
              <Coins size={16} color="#ffd700" />
              <span>古金幣 {occultist.stats.obols}</span>
            </div>
          </div>

          {/* Deck Strategy Features */}
          <div className="occupation-deck-features">
            <div className="deck-feature-title">
              <Sparkles size={16} color="#c77dff" />
              <span>專屬起始卡牌（12 張 · 秘術真相）</span>
            </div>
            <p className="deck-feature-desc">
              配備靈能衝擊、厄運凝視、星界庇護、心靈冥想與銀鑰儀式。可直接自牌庫頂獻祭理智施展高傷秘法。
            </p>
          </div>

          <button
            id="choose-occultist-btn"
            className="occupation-select-btn occultist"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect('occultist');
            }}
          >
            <span>啟動秘儀</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
};
