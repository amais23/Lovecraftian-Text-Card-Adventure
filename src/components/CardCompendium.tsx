import React, { useState, useMemo, useEffect } from 'react';
import type { CardCategory, Card } from '../types/game';
import { ALL_CARD_ARTWORKS, type CardArtworkInfo } from '../engine/cardArtworks';
import { CardView } from './CardView';
import { soundEngine } from '../engine/audioManager';
import { X, BookOpen, Sparkles, Filter, Info, Shield, Swords, Eye, Flame } from 'lucide-react';

import { INVESTIGATOR_DECK, OCCULTIST_DECK, REWARD_CARD_POOL, MADNESS_CARD_TEMPLATES, TRUTH_INJECTED_TEMPLATE } from '../engine/initialData';
import { MYTHOS_EVENTS, TRUTH_CARD_BREAKWATER, generateDefaultMarketItems } from '../engine/eventData';
import { ALL_TIERED_CARDS } from '../engine/cardTiers';
import { ALL_ABYSSAL_CARDS } from '../engine/abyssalSeals';

const CATEGORY_NAMES: Record<CardCategory, string> = {
  combat: '紅色戰鬥卡',
  skill: '黃色技能卡',
  magic: '紫色魔法卡',
  truth: '白色真相卡',
  madness: '黑色瘋狂卡',
};

const CATEGORY_ORDER: Record<CardCategory, number> = {
  combat: 1, // 紅色戰鬥卡
  skill: 2,  // 黃色技能卡
  magic: 3,  // 紫色魔法卡
  truth: 4,  // 白色真相卡
  madness: 5, // 黑色瘋狂卡
};

interface CategoryTabConfig {
  category: CardCategory;
  name: string;
  sub: string;
  icon: React.ReactNode;
}

const CATEGORY_TABS: CategoryTabConfig[] = [
  { category: 'combat', name: '紅色戰鬥', sub: '實體武器', icon: <Swords size={14} /> },
  { category: 'skill', name: '黃色技能', sub: '生存技藝', icon: <Shield size={14} /> },
  { category: 'magic', name: '紫色魔法', sub: '星空秘法', icon: <Sparkles size={14} /> },
  { category: 'truth', name: '白色真相', sub: '舊日啟示', icon: <Eye size={14} /> },
  { category: 'madness', name: '黑色瘋狂', sub: '深淵異化', icon: <Flame size={14} /> },
];

interface CardCompendiumProps {
  onClose: () => void;
}

export const CardCompendium: React.FC<CardCompendiumProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | 'all'>('all');
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

    // Tiered, Boss Exclusive, and Abyssal Seal cards
    ALL_TIERED_CARDS.forEach(registerCard);
    ALL_ABYSSAL_CARDS.forEach(registerCard);

    return map;
  }, []);

  // Sort artworks: Category (Red -> Yellow -> Purple -> White -> Black), then Tier (Tier 1 -> 4).
  // In same tier, stable sort preserves original registration order.
  const sortedArtworks = useMemo(() => {
    return ALL_CARD_ARTWORKS.map((art, index) => ({ art, index }))
      .sort((a, b) => {
        const catDiff = CATEGORY_ORDER[a.art.category] - CATEGORY_ORDER[b.art.category];
        if (catDiff !== 0) return catDiff;
        const tierA = cardMap[a.art.name]?.tier ?? 1;
        const tierB = cardMap[b.art.name]?.tier ?? 1;
        if (tierA !== tierB) return tierA - tierB;
        return a.index - b.index;
      })
      .map((item) => item.art);
  }, [cardMap]);

  const filteredArtworks = useMemo(() => {
    if (selectedCategory === 'all') return sortedArtworks;
    return sortedArtworks.filter((art) => art.category === selectedCategory);
  }, [selectedCategory, sortedArtworks]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CardCategory, number> = {
      combat: 0,
      skill: 0,
      magic: 0,
      truth: 0,
      madness: 0,
    };
    for (const art of ALL_CARD_ARTWORKS) {
      if (counts[art.category] !== undefined) {
        counts[art.category]++;
      }
    }
    return counts;
  }, []);

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
              <h1 className="compendium-title">卡牌圖鑑</h1>
              <p className="compendium-subtitle">
                密斯卡托尼克特藏手記 · 已收錄 {ALL_CARD_ARTWORKS.length} 張專屬五色卡牌
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
            aria-label="關閉圖鑑"
            title="返回主選單"
          >
            <X size={22} />
          </button>
        </header>

        {/* Toolbar: Category Filters */}
        <div className="compendium-toolbar">
          <div className="compendium-filter-tabs" role="tablist" aria-label="卡牌類別篩選">
            <button
              role="tab"
              aria-selected={selectedCategory === 'all'}
              className={`compendium-tab-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterClick('all')}
            >
              <Filter size={14} />
              <span>全部 ({ALL_CARD_ARTWORKS.length})</span>
            </button>
            {CATEGORY_TABS.map(({ category, name, sub, icon }) => (
              <button
                key={category}
                role="tab"
                aria-selected={selectedCategory === category}
                className={`compendium-tab-btn ${category} ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => handleFilterClick(category)}
              >
                {icon}
                <span>
                  {name} ({categoryCounts[category]} · {sub})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Card Grid Area */}
        <div className="compendium-grid-container">
          {filteredArtworks.length === 0 ? (
            <div className="compendium-empty-state">
              <Info size={36} color="#ca8a04" />
              <p>該類別暫無收錄卡牌。</p>
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

                {/* Card Compendium Archive Notes */}
                <div className="detail-spec-box">
                  <span className="spec-label">手記典藏考證：</span>
                  <p className="spec-text">
                    本卡牌已完整收錄於阿卡姆調查手記，具備專屬考證繪卷、類別特色窗框與秘術光效。
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
