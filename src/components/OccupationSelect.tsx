import React, { useState, useEffect } from 'react';
import {
  Compass,
  BookOpen,
  Heart,
  Zap,
  Coins,
  Sparkles,
  Shield,
  ArrowRight,
  ArrowLeft,
  X,
} from 'lucide-react';
import { OCCUPATIONS } from '../engine/initialData';
import { soundEngine } from '../engine/audioManager';
import { getCardCostDisplay } from '../engine/cardCatalog';
import { getOccupationPortrait } from '../engine/backgroundArtworks';
import { CardView } from './CardView';
import type { Card } from '../types/game';

export interface OccupationSelectProps {
  onBackToMenu: () => void;
  onSelectOccupation: (occupationId: 'investigator' | 'occultist') => void;
}

export const OccupationSelect: React.FC<OccupationSelectProps> = ({
  onBackToMenu,
  onSelectOccupation,
}) => {
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inspectedCard) {
        setInspectedCard(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectedCard]);

  const investigator = OCCUPATIONS.investigator;
  const occultist = OCCUPATIONS.occultist;

  const handleBack = () => {
    soundEngine.playClick();
    onBackToMenu();
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

      {/* Occupation Selection Cards (ADR-0020 Split Column Layout) */}
      <main className="occupation-selection-container">
        {/* Edward Pierce - Private Investigator */}
        <div
          className="occupation-card investigator-card split-layout"
          id="select-investigator-card"
          onClick={() => onSelectOccupation('investigator')}
        >
          <div className="occupation-card-glow" />

          {/* Left Column: 3:4 Character Portrait Frame (ADR-0020) */}
          <div className="occupation-portrait-col">
            <div className="occupation-portrait-frame">
              <img
                src={getOccupationPortrait('investigator')}
                alt={investigator.name}
                className="occupation-portrait-img"
                data-testid="portrait-investigator"
              />
              <div className="occupation-portrait-vignette" />
              <span className="occupation-portrait-tag">物理生存</span>
            </div>
          </div>

          {/* Right Column: Streamlined Info, Stats, Starting Deck, Action */}
          <div className="occupation-info-col">
            <div className="occupation-card-header">
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

              {/* Complete 12 Cards Inspection List */}
              <div className="occupation-cards-preview-list" aria-label="愛德華·皮爾斯起始卡牌清單">
                {investigator.deck.map((card, idx) => {
                  const cost = getCardCostDisplay(card.costType, card.costValue);
                  return (
                    <div
                      key={`${card.id}_${idx}`}
                      className={`occupation-card-chip category-${card.category}`}
                      title={`點擊檢視【${card.name}】卡牌詳情`}
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playClick();
                        setInspectedCard(card);
                      }}
                    >
                      <span className="card-chip-dot" />
                      <span className="card-chip-name">{card.name}</span>
                      <span className="card-chip-cost">{cost.shortText}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              id="choose-investigator-btn"
              className="occupation-select-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelectOccupation('investigator');
              }}
            >
              <span>啟程調查</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* Eleanor Vance - Occultist */}
        <div
          className="occupation-card occultist-card split-layout"
          id="select-occultist-card"
          onClick={() => onSelectOccupation('occultist')}
        >
          <div className="occupation-card-glow" />

          {/* Left Column: 3:4 Character Portrait Frame (ADR-0020) */}
          <div className="occupation-portrait-col">
            <div className="occupation-portrait-frame">
              <img
                src={getOccupationPortrait('occultist')}
                alt={occultist.name}
                className="occupation-portrait-img"
                data-testid="portrait-occultist"
              />
              <div className="occupation-portrait-vignette" />
              <span className="occupation-portrait-tag occultist">秘術真相</span>
            </div>
          </div>

          {/* Right Column: Streamlined Info, Stats, Starting Deck, Action */}
          <div className="occupation-info-col">
            <div className="occupation-card-header">
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

              {/* Complete 12 Cards Inspection List */}
              <div className="occupation-cards-preview-list" aria-label="艾蓮諾·凡斯起始卡牌清單">
                {occultist.deck.map((card, idx) => {
                  const cost = getCardCostDisplay(card.costType, card.costValue);
                  return (
                    <div
                      key={`${card.id}_${idx}`}
                      className={`occupation-card-chip category-${card.category}`}
                      title={`點擊檢視【${card.name}】卡牌詳情`}
                      onClick={(e) => {
                        e.stopPropagation();
                        soundEngine.playClick();
                        setInspectedCard(card);
                      }}
                    >
                      <span className="card-chip-dot" />
                      <span className="card-chip-name">{card.name}</span>
                      <span className="card-chip-cost">{cost.shortText}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              id="choose-occultist-btn"
              className="occupation-select-btn occultist"
              onClick={(e) => {
                e.stopPropagation();
                onSelectOccupation('occultist');
              }}
            >
              <span>啟動秘儀</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>

      {/* Inspected Card Detail Modal */}
      {inspectedCard && (
        <div
          className="compendium-detail-modal-overlay"
          onClick={() => setInspectedCard(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspected-card-title"
        >
          <div
            className="compendium-detail-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="detail-modal-close-btn"
              onClick={() => setInspectedCard(null)}
              aria-label="關閉卡牌詳情"
            >
              <X size={20} />
            </button>

            <div className="detail-modal-split">
              <div className="detail-modal-left">
                <CardView
                  card={inspectedCard}
                  currentStamina={99}
                  currentSanity={99}
                  isStandalone={true}
                />
              </div>

              <div className="detail-modal-right">
                <div className="detail-category-tag-row">
                  <span className={`detail-category-badge ${inspectedCard.category}`}>
                    {inspectedCard.category === 'combat'
                      ? '紅色戰鬥卡'
                      : inspectedCard.category === 'skill'
                      ? '黃色技能卡'
                      : inspectedCard.category === 'magic'
                      ? '紫色魔法卡'
                      : inspectedCard.category === 'truth'
                      ? '白色真相卡'
                      : '黑色瘋狂卡'}
                  </span>
                  <span className="detail-style-badge">
                    {inspectedCard.costType === 'sanity'
                      ? `消耗 ${inspectedCard.costValue} 點理智`
                      : `消耗 ${inspectedCard.costValue} 點精力`}
                  </span>
                </div>

                <h2 id="inspected-card-title" className="detail-card-name">
                  {inspectedCard.name}
                </h2>

                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <BookOpen size={16} /> 戰鬥對弈效果
                  </h4>
                  <p className="detail-effect-text">{inspectedCard.description}</p>
                  {inspectedCard.flavorText && (
                    <p className="detail-flavor-text">{inspectedCard.flavorText}</p>
                  )}
                </div>

                <div className="detail-spec-box">
                  <span className="spec-label">調查員起始武裝：</span>
                  <p className="spec-text">
                    本卡牌為調查員啟程時的專屬初始手牌。在後續調查中，可透過戰後結算或黑市購入更多卡牌擴充理智牌庫。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
