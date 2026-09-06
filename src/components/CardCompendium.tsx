import React, { useState, useMemo, useEffect } from 'react';
import type { CardCategory, Card } from '../types/game';
import { ALL_CARD_ARTWORKS, type CardArtworkInfo } from '../engine/cardArtworks';
import { CardView } from './CardView';
import { soundEngine } from '../engine/audioManager';
import { Search, X, BookOpen, Sparkles, Filter, Info, Shield, Swords, Eye, Flame } from 'lucide-react';

// Representative card data mapped from registry for preview in compendium
import { INVESTIGATOR_DECK, OCCULTIST_DECK, REWARD_CARD_POOL, MADNESS_CARD_TEMPLATES, TRUTH_INJECTED_TEMPLATE } from '../engine/initialData';
import { MYTHOS_EVENTS, TRUTH_CARD_BREAKWATER, generateDefaultMarketItems } from '../engine/eventData';

const CATEGORY_NAMES: Record<CardCategory, string> = {
  combat: '紅色戰鬥卡',
  skill: '黃色技能卡',
  magic: '紫色魔法卡',
  truth: '白色真相卡',
  madness: '黑色瘋狂卡',
};

interface CardCompendiumProps {
  onClose: () => void;
}

export const CardCompendium: React.FC<CardCompendiumProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDetailCard, setActiveDetailCard] = useState<CardArtworkInfo | null>(null);

  // Keyboard Escape support to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDetailCard) {
          setActiveDetailCard(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDetailCard, onClose]);

  // Consolidate full card definitions dictionary for preview
  const cardMap = useMemo(() => {
    const map: Record<string, Card> = {};

    const registerCard = (c: Card) => {
      if (!map[c.name]) {
        map[c.name] = c;
      }
    };

    INVESTIGATOR_DECK.forEach(registerCard);
    OCCULTIST_DECK.forEach(registerCard);
    REWARD_CARD_POOL.forEach(registerCard);
    MADNESS_CARD_TEMPLATES.forEach((t, i) => registerCard({ ...t, id: `madness_comp_${i}` }));
    registerCard({ ...TRUTH_INJECTED_TEMPLATE, id: 'truth_injected_comp' });
    registerCard({ ...TRUTH_CARD_BREAKWATER, id: 'breakwater_comp' });

    // Events cards
    Object.values(MYTHOS_EVENTS).forEach((ev) => {
      ev.options.forEach((opt) => {
        opt.consequences.forEach((c) => {
          if (c.card) registerCard(c.card);
        });
      });
    });

    // Black market cards
    generateDefaultMarketItems().forEach((item) => {
      if (item.card) registerCard(item.card);
    });

    return map;
  }, []);

  const filteredArtworks = useMemo(() => {
    return ALL_CARD_ARTWORKS.filter((art) => {
      const matchCat = selectedCategory === 'all' || art.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        art.name.toLowerCase().includes(query) ||
        art.conceptLore.toLowerCase().includes(query) ||
        art.styleName.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  const handleFilterClick = (cat: CardCategory | 'all') => {
    soundEngine.playClick();
    setSelectedCategory(cat);
  };

  const handleCardClick = (art: CardArtworkInfo) => {
    soundEngine.playClick();
    setActiveDetailCard(art);
  };

  const resolveCardForArtwork = (art: CardArtworkInfo): Card => {
    if (cardMap[art.name]) {
      return cardMap[art.name];
    }
    return {
      id: art.artId,
      name: art.name,
      category: art.category,
      costType: art.category === 'magic' ? 'sanity' : 'stamina',
      costValue: 1,
      isTemporary: art.category === 'madness',
      effects: [{ type: 'damage', value: 8 }],
      description: art.conceptLore,
      flavorText: '「在不可名狀的命運長卷中，此卡已被永久銘刻。」',
    };
  };

  return (
    <div className="compendium-overlay">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="compendium-window">
        {/* Header Bar */}
        <header className="compendium-header">
          <div className="compendium-title-group">
            <div className="compendium-icon-badge">
              <BookOpen size={24} color="#ffd700" />
            </div>
            <div>
              <h1 className="compendium-title">卡牌圖鑑 (Card Compendium)</h1>
              <p className="compendium-subtitle">
                密斯卡託尼克古典典藏研究室 · 五大類別全套專屬插畫收錄 ({ALL_CARD_ARTWORKS.length} 張)
              </p>
            </div>
          </div>

          <button
            id="close-compendium-btn"
            className="compendium-close-btn"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            title="返回主選單 (Esc)"
          >
            <X size={22} />
          </button>
        </header>

        {/* Toolbar: Category Filters and Search Input */}
        <div className="compendium-toolbar">
          <div className="compendium-filter-tabs">
            <button
              className={`compendium-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterClick('all')}
            >
              <Filter size={14} />
              <span>全部 ({ALL_CARD_ARTWORKS.length})</span>
            </button>
            <button
              className={`compendium-tab-btn combat ${selectedCategory === 'combat' ? 'active' : ''}`}
              onClick={() => handleFilterClick('combat')}
            >
              <Swords size={14} />
              <span>紅色戰鬥 (7 · Q版可愛卡通)</span>
            </button>
            <button
              className={`compendium-tab-btn skill ${selectedCategory === 'skill' ? 'active' : ''}`}
              onClick={() => handleFilterClick('skill')}
            >
              <Shield size={14} />
              <span>黃色技能 (8 · 真實寫實工藝)</span>
            </button>
            <button
              className={`compendium-tab-btn magic ${selectedCategory === 'magic' ? 'active' : ''}`}
              onClick={() => handleFilterClick('magic')}
            >
              <Sparkles size={14} />
              <span>紫色魔法 (4 · 陽光奇幻魔導)</span>
            </button>
            <button
              className={`compendium-tab-btn truth ${selectedCategory === 'truth' ? 'active' : ''}`}
              onClick={() => handleFilterClick('truth')}
            >
              <Eye size={14} />
              <span>白色真相 (6 · 舊日天啟恐懼)</span>
            </button>
            <button
              className={`compendium-tab-btn madness ${selectedCategory === 'madness' ? 'active' : ''}`}
              onClick={() => handleFilterClick('madness')}
            >
              <Flame size={14} />
              <span>黑色瘋狂 (3 · 混亂血肉深淵)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="compendium-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="compendium-search-input"
              placeholder="搜尋卡牌名稱、效果或典故..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Card Grid Area */}
        <div className="compendium-grid-container">
          {filteredArtworks.length === 0 ? (
            <div className="compendium-empty-state">
              <Info size={36} color="#ca8a04" />
              <p>未找到符合搜尋條件的卡牌，請嘗試更換關鍵字或類別標籤。</p>
            </div>
          ) : (
            <div className="compendium-cards-grid">
              {filteredArtworks.map((art) => {
                const card = resolveCardForArtwork(art);
                return (
                  <div
                    key={art.artId}
                    className="compendium-card-wrapper"
                    onClick={() => handleCardClick(art)}
                  >
                    <CardView
                      card={card}
                      currentStamina={0}
                      currentSanity={0}
                      isStandalone={true}
                      onClick={() => handleCardClick(art)}
                    />
                    <div className="compendium-card-caption">
                      <span className={`compendium-style-badge ${art.category}`}>
                        {art.styleName.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Card Detail Modal (特寫鑑賞彈窗) */}
      {activeDetailCard && (
        <div
          className="compendium-detail-modal-overlay"
          onClick={() => setActiveDetailCard(null)}
        >
          <div
            className="compendium-detail-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="detail-modal-close-btn"
              onClick={() => setActiveDetailCard(null)}
            >
              <X size={20} />
            </button>

            <div className="detail-modal-split">
              {/* Left Column: Enlarged Card Preview */}
              <div className="detail-modal-left">
                <CardView
                  card={resolveCardForArtwork(activeDetailCard)}
                  currentStamina={0}
                  currentSanity={0}
                  isStandalone={true}
                />
              </div>

              {/* Right Column: In-depth Lore, Style, and Mechanics */}
              <div className="detail-modal-right">
                <div className="detail-category-tag-row">
                  <span className={`detail-category-badge ${activeDetailCard.category}`}>
                    {CATEGORY_NAMES[activeDetailCard.category]}
                  </span>
                  <span className="detail-style-badge">
                    {activeDetailCard.styleName}
                  </span>
                </div>

                <h2 className="detail-card-name">{activeDetailCard.name}</h2>

                {/* Concept & Lore */}
                <div className="detail-section">
                  <h4 className="detail-section-title">
                    <Sparkles size={16} /> 背景典故與畫面意境
                  </h4>
                  <p className="detail-concept-text">{activeDetailCard.conceptLore}</p>
                </div>

                {/* Game Mechanics Breakdown */}
                {cardMap[activeDetailCard.name] && (
                  <div className="detail-section">
                    <h4 className="detail-section-title">
                      <BookOpen size={16} /> 戰鬥對弈效果
                    </h4>
                    <p className="detail-effect-text">
                      {cardMap[activeDetailCard.name].description}
                    </p>
                    <p className="detail-flavor-text">
                      {cardMap[activeDetailCard.name].flavorText}
                    </p>
                  </div>
                )}

                {/* ADR-0012 Style Specification Notes */}
                <div className="detail-spec-box">
                  <span className="spec-label">ADR-0012 規範對應：</span>
                  <p className="spec-text">
                    本卡牌精確體現 ADR-0012 所規範之「{activeDetailCard.styleName}」，具備專屬插畫資產、類別特色窗框與光效。
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
