import React from 'react';
import { Compass, ArrowRight, ArrowLeft } from 'lucide-react';
import { OCCUPATIONS } from '../engine/initialData';
import { soundEngine } from '../engine/audioManager';
import { getOccupationPortrait } from '../engine/backgroundArtworks';

export interface OccupationSelectProps {
  onBackToMenu: () => void;
  onSelectOccupation: (occupationId: 'investigator' | 'occultist') => void;
}

export const OccupationSelect: React.FC<OccupationSelectProps> = ({
  onBackToMenu,
  onSelectOccupation,
}) => {
  const investigator = OCCUPATIONS.investigator;
  const occultist = OCCUPATIONS.occultist;

  const handleBack = () => {
    soundEngine.playClick();
    onBackToMenu();
  };

  const handleSelect = (id: 'investigator' | 'occultist') => {
    soundEngine.playClick();
    onSelectOccupation(id);
  };

  return (
    <div className="title-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />
      <div className="cosmic-particles-bg" />

      {/* Top navigation row with back button */}
      <div className="title-screen-top-bar occupation-top-bar">
        <button
          id="back-to-menu-btn"
          className="back-to-menu-btn"
          onClick={handleBack}
        >
          <ArrowLeft size={18} />
          <span>返回主選單</span>
        </button>
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
        {/* Investigator: Edward Pierce */}
        <div
          className="occupation-card investigator-card"
          id="select-investigator-card"
          onClick={() => handleSelect('investigator')}
        >
          <div className="occupation-card-glow" />

          {/* 3:4 Character Portrait Frame */}
          <div className="occupation-portrait-frame">
            <img
              src={getOccupationPortrait('investigator')}
              alt={investigator.name}
              className="occupation-portrait-img"
              data-testid="portrait-investigator"
            />
            <div className="occupation-portrait-vignette" />
          </div>

          {/* Name & Occupation Badge directly below portrait */}
          <div className="occupation-identity-block">
            <h2 className="occupation-name">{investigator.name}</h2>
            <span className="occupation-badge">{investigator.occupation}</span>
          </div>

          {/* Quote & Narrative Description */}
          <p className="occupation-quote">{investigator.quote}</p>
          <p className="occupation-desc">{investigator.description}</p>

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

        {/* Occultist: Eleanor Vance */}
        <div
          className="occupation-card occultist-card"
          id="select-occultist-card"
          onClick={() => handleSelect('occultist')}
        >
          <div className="occupation-card-glow" />

          {/* 3:4 Character Portrait Frame */}
          <div className="occupation-portrait-frame">
            <img
              src={getOccupationPortrait('occultist')}
              alt={occultist.name}
              className="occupation-portrait-img"
              data-testid="portrait-occultist"
            />
            <div className="occupation-portrait-vignette" />
          </div>

          {/* Name & Occupation Badge directly below portrait */}
          <div className="occupation-identity-block">
            <h2 className="occupation-name">{occultist.name}</h2>
            <span className="occupation-badge occultist">{occultist.occupation}</span>
          </div>

          {/* Quote & Narrative Description */}
          <p className="occupation-quote">{occultist.quote}</p>
          <p className="occupation-desc">{occultist.description}</p>

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
