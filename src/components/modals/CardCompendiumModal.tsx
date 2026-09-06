import React, { useState, useMemo } from 'react';
import { Sparkles, X, Swords, Shield, Eye, Flame, Search, Info } from 'lucide-react';
import type { Card, CardCategory } from '../../types/game';
import { getCardCatalog, getCardCatalogStats } from '../../engine/cardCatalog';
import { soundEngine } from '../../engine/audioManager';
import { useModalDismiss } from '../../hooks/useModalDismiss';

interface CardCompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory = 'all' | CardCategory;

const CATEGORY_CONFIG: Record<
  FilterCategory,
  { label: string; shortLabel: string; icon: React.ReactNode; color: string }
> = {
  all: {
    label: '全部典藏',
    shortLabel: '全部',
    icon: <Sparkles size={16} color="#cfa866" />,
    color: '#cfa866',
  },
  combat: {
    label: '紅色戰鬥',
    shortLabel: '戰鬥',
    icon: <Swords size={16} color="#e63946" />,
    color: '#e63946',
  },
  skill: {
    label: '黃色技能',
    shortLabel: '技能',
    icon: <Shield size={16} color="#f4a261" />,
    color: '#f4a261',
  },
  magic: {
    label: '紫色魔法',
    shortLabel: '魔法',
    icon: <Sparkles size={16} color="#c77dff" />,
    color: '#c77dff',
  },
  truth: {
    label: '白色真相',
    shortLabel: '真相',
    icon: <Eye size={16} color="#f8fafc" />,
    color: '#f8fafc',
  },
  madness: {
    label: '黑色瘋狂',
    shortLabel: '瘋狂',
    icon: <Flame size={16} color="#ef4444" />,
    color: '#ef4444',
  },
};

/**
 * 格式化簡短消耗標籤（用於卡牌清單格子）
 */
function formatCardCostShort(costType: Card['costType'], costValue: number): string {
  if (costType === 'free') return '免費';
  if (costType === 'sanity') return `理智 ${costValue}`;
  if (costValue === 0) return '0 精力 (免費)';
  return `${costValue} 精力`;
}

/**
 * 格式化詳細消耗標籤（用於詳情檢視面板）
 */
function formatCardCostDetail(costType: Card['costType'], costValue: number): { label: string; value: string } {
  if (costType === 'free') {
    return { label: '消耗：', value: '免費' };
  }
  if (costType === 'sanity') {
    return { label: '理智消耗：', value: String(costValue) };
  }
  if (costValue === 0) {
    return { label: '精力消耗：', value: '0 (免費)' };
  }
  return { label: '精力消耗：', value: String(costValue) };
}

export const CardCompendiumModal: React.FC<CardCompendiumModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const { handleBackdropClick, dismiss } = useModalDismiss({ isOpen, onClose });

  const allCards = useMemo(() => getCardCatalog(), []);
  const stats = useMemo(() => getCardCatalogStats(), []);

  // Filtered cards based on active category and search
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const matchCategory = activeCategory === 'all' || card.category === activeCategory;
      const matchSearch =
        !searchQuery.trim() ||
        card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [allCards, activeCategory, searchQuery]);

  // Derive currently selected card safely without cascading effects
  const effectiveSelectedCardId =
    selectedCardId && filteredCards.some((c) => c.id === selectedCardId)
      ? selectedCardId
      : filteredCards[0]?.id ?? null;

  const selectedCard = allCards.find((c) => c.id === effectiveSelectedCardId) ?? filteredCards[0];

  if (!isOpen) return null;

  const handleCategoryChange = (cat: FilterCategory) => {
    soundEngine.playClick();
    setActiveCategory(cat);
  };

  const handleCardClick = (card: Card) => {
    soundEngine.playCardHover();
    setSelectedCardId(card.id);
  };

  return (
    <div
      className="eldritch-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compendium-modal-title"
    >
      <div className="eldritch-modal-container compendium-modal-container">
        {/* Header */}
        <div className="eldritch-modal-header">
          <div className="modal-header-icon-badge">
            <Sparkles size={24} color="#cfa866" />
          </div>
          <div>
            <h2 id="compendium-modal-title" className="eldritch-modal-title">
              卡牌圖鑑
            </h2>
            <p className="eldritch-modal-subtitle">
              CARD COMPENDIUM · 已收錄 {stats.total} 張專屬五色手牌
            </p>
          </div>
          <button
            className="eldritch-modal-close-btn"
            onClick={dismiss}
            aria-label="關閉圖鑑"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="compendium-toolbar">
          <div className="compendium-tabs" role="tablist" aria-label="卡牌類別篩選">
            {(['all', 'combat', 'skill', 'magic', 'truth', 'madness'] as FilterCategory[]).map(
              (cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const isActive = activeCategory === cat;
                const count = cat === 'all' ? stats.total : stats[cat];
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    className={`compendium-tab-btn ${cat} ${isActive ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat)}
                    id={`compendium-tab-${cat}`}
                  >
                    <span className="tab-icon">{cfg.icon}</span>
                    <span className="tab-label">{cfg.label}</span>
                    <span className="tab-count-badge">({count})</span>
                  </button>
                );
              }
            )}
          </div>

          <div className="compendium-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="搜尋卡牌名稱或效果..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="compendium-search-input"
              aria-label="搜尋卡牌"
            />
            {searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="清除搜尋"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Layout: Grid of Cards + Detail Panel */}
        <div className="compendium-layout">
          {/* Card Grid */}
          <div className="compendium-cards-list" role="tabpanel">
            {filteredCards.length === 0 ? (
              <div className="compendium-empty-state">
                <Info size={32} color="#9d9685" />
                <p>未找到符合搜尋條件的卡牌</p>
              </div>
            ) : (
              <div className="compendium-grid">
                {filteredCards.map((card) => {
                  const isSelected = card.id === selectedCard?.id;
                  const cfg = CATEGORY_CONFIG[card.category];
                  return (
                    <div
                      key={card.id}
                      className={`compendium-card-preview-cell ${card.category} ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => handleCardClick(card)}
                      id={`compendium-card-${card.id}`}
                    >
                      <div className="cell-top">
                        <span className={`cell-cost ${card.costType}`}>
                          {formatCardCostShort(card.costType, card.costValue)}
                        </span>
                        <span className={`cell-cat-pill ${card.category}`}>
                          {cfg.shortLabel}
                        </span>
                      </div>
                      <div className="cell-name">{card.name}</div>
                      <div className="cell-desc-snip">{card.description}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Card Inspect View */}
          {selectedCard && (
            <aside className="compendium-detail-pane" aria-label="卡牌詳情檢視">
              <div className={`detail-card-preview-frame ${selectedCard.category}`}>
                <div className="frame-glow" />
                <div className="frame-header">
                  {(() => {
                    const detailCost = formatCardCostDetail(
                      selectedCard.costType,
                      selectedCard.costValue
                    );
                    return (
                      <div className={`frame-cost-badge ${selectedCard.costType}`}>
                        <span>
                          {detailCost.label}
                          <strong>{detailCost.value}</strong>
                        </span>
                      </div>
                    );
                  })()}
                  <span className={`frame-category-tag ${selectedCard.category}`}>
                    {CATEGORY_CONFIG[selectedCard.category].label}
                  </span>
                </div>

                <div className="frame-body">
                  <h3 className="frame-card-name">{selectedCard.name}</h3>
                  <div className="frame-badges-row">
                    {selectedCard.isTemporary ? (
                      <span className="frame-badge temp">臨時卡牌 (消散)</span>
                    ) : (
                      <span className="frame-badge permanent">一般卡牌 (戰後保留)</span>
                    )}
                    {selectedCard.effects.some((e) => e.type === 'self_damage') && (
                      <span className="frame-badge recoil">肉體認知反噬</span>
                    )}
                  </div>

                  <div className="frame-effect-box">
                    <h4 className="frame-section-title">卡牌戰術效果</h4>
                    <p className="frame-effect-text">{selectedCard.description}</p>
                  </div>

                  <div className="frame-flavor-box">
                    <h4 className="frame-section-title">阿卡姆秘聞題注</h4>
                    <p className="frame-flavor-text">{selectedCard.flavorText}</p>
                  </div>
                </div>

                <div className="frame-footer">
                  <button
                    className="test-play-sound-btn"
                    onClick={() => soundEngine.playCardPlay(selectedCard.category)}
                  >
                    <Sparkles size={14} />
                    <span>試聽【{selectedCard.name}】打出音</span>
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
