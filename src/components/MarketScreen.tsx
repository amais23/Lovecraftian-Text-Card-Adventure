import React, { useState } from 'react';
import type { Card, GameAction, GameState, MarketItem } from '../types/game';
import {
  ShoppingBag,
  Coins,
  Heart,
  LogOut,
  Check,
  Sparkles,
  Swords,
  Shield,
  Disc,
  Flame,
  Trash2,
  X,
} from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';
import { getAllPermanentCards } from '../engine/abyssalSeals';
import { getCardArtwork } from '../engine/cardArtworks';
import { MARKET_PURGE_COST } from '../engine/marketService';

interface MarketScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const MarketScreen: React.FC<MarketScreenProps> = ({ state, dispatch }) => {
  const investigator = state.investigator;
  const items = state.marketItems ?? [];
  const [isPurgeOpen, setIsPurgeOpen] = useState(false);
  const [selectedPurgeCardId, setSelectedPurgeCardId] = useState<string | null>(null);

  const isPurgeUsed = Boolean(state.marketPurgeUsed);
  const canAffordPurge = investigator.obols >= MARKET_PURGE_COST;
  const permanentCards = getAllPermanentCards(state);
  const hasEnoughCards = permanentCards.length > 1;
  const canPurge = !isPurgeUsed && canAffordPurge && hasEnoughCards;

  const handleBuy = (item: MarketItem) => {
    if (!item.isPurchased && investigator.obols >= item.price) {
      soundEngine.playClick();
      dispatch({
        type: 'BUY_MARKET_ITEM',
        payload: { itemId: item.id },
      });
    }
  };

  const handleOpenPurge = () => {
    if (!canPurge) {
      soundEngine.playDeny();
      return;
    }
    soundEngine.playClick();
    setIsPurgeOpen(true);
  };

  const handleClosePurge = () => {
    soundEngine.playClick();
    setIsPurgeOpen(false);
    setSelectedPurgeCardId(null);
  };

  const handleTogglePurgeCard = (card: Card) => {
    soundEngine.playClick();
    setSelectedPurgeCardId((prev) => (prev === card.id ? null : card.id));
  };

  const handleConfirmPurge = () => {
    if (!selectedPurgeCardId || !canPurge) return;
    soundEngine.playClick();
    soundEngine.playCosmicBanishment();
    dispatch({
      type: 'PURGE_CARD_AT_MARKET',
      payload: { cardId: selectedPurgeCardId },
    });
    setIsPurgeOpen(false);
    setSelectedPurgeCardId(null);
  };

  const handleLeave = () => {
    soundEngine.playClick();
    dispatch({ type: 'LEAVE_MARKET' });
  };

  return (
    <div className="market-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="market-card-panel">
        <header className="market-header">
          <div className="market-header-left">
            <div className="market-icon-badge">
              <ShoppingBag size={32} color="#ffd700" />
            </div>
            <div>
              <h1 className="market-title">黑市暗室 · 灰面卡斯楚的貨棧</h1>
              <p className="market-subtitle">
                「只要你的古金幣足夠，無論是軍火、違禁藥劑還是異鄉典籍，我都能為你弄到。」
              </p>
            </div>
          </div>

          <div className="market-header-actions">
            <div className="market-obols-badge" id="market-current-obols">
              <Coins size={22} color="#ffd700" />
              <div className="market-obols-info">
                <span className="market-obols-label">持有古金幣</span>
                <span className="market-obols-val">{investigator.obols} 枚</span>
              </div>
            </div>
            <AudioToggle />
          </div>
        </header>

        {/* Health status strip */}
        <div className="market-status-strip">
          <div className="market-status-pill health">
            <Heart size={16} color="#ff334b" />
            <span>生命值: {investigator.health} / {investigator.maxHealth}</span>
          </div>
          <span className="market-hint">點選物品花費古金幣採購，購買後直接納入理智牌庫、行囊或生效</span>
        </div>

        {/* Items Shelf */}
        <div className="market-items-grid">
          {items.map((item) => {
            const canAfford = investigator.obols >= item.price;
            const isSold = Boolean(item.isPurchased);

            return (
              <div
                key={item.id}
                id={`market-item-${item.id}`}
                className={`market-item-card ${isSold ? 'sold-out' : ''} ${item.type} ${item.isDiscounted ? 'discounted' : ''}`}
              >
                <div className="market-item-header">
                  <div className="market-item-icon">
                    {item.type === 'heal' ? (
                      <Heart size={20} color="#ff334b" />
                    ) : item.type === 'relic' ? (
                      <Disc size={20} color="#ffd700" />
                    ) : item.card?.category === 'combat' ? (
                      <Swords size={20} color="#e63946" />
                    ) : item.card?.category === 'skill' ? (
                      <Shield size={20} color="#cfa866" />
                    ) : (
                      <Sparkles size={20} color="#c77dff" />
                    )}
                  </div>
                  <div className="market-item-badges">
                    {item.isDiscounted && (
                      <span className="market-item-discount-badge">
                        {item.discountLabel || '半價特惠'}
                      </span>
                    )}
                    <span className="market-item-type-badge">
                      {item.type === 'heal'
                        ? '醫療補給'
                        : item.type === 'relic'
                        ? '舊日遺物'
                        : '典藏卡牌'}
                    </span>
                  </div>
                </div>

                <h3 className="market-item-name">{item.name}</h3>
                <p className="market-item-desc">{item.description}</p>

                <div className="market-item-footer">
                  <div className="market-item-price-block">
                    {item.isDiscounted && item.originalPrice ? (
                      <span className="market-item-original-price">
                        {item.originalPrice} 古金幣
                      </span>
                    ) : null}
                    <div className="market-item-price">
                      <Coins size={16} color="#ffd700" />
                      <span>{item.price} 古金幣</span>
                    </div>
                  </div>

                  <button
                    className={`market-buy-btn ${!canAfford && !isSold ? 'unaffordable' : ''}`}
                    disabled={isSold || !canAfford}
                    onClick={() => handleBuy(item)}
                  >
                    {isSold ? (
                      <>
                        <Check size={16} />
                        <span>已售罄</span>
                      </>
                    ) : !canAfford ? (
                      <span>餘額不足</span>
                    ) : (
                      <span>購買</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Black Market Card Purge Service */}
        <section className="market-purge-section">
          <div className="market-purge-header">
            <div className="market-purge-left">
              <div className="market-purge-icon">
                <Flame size={24} color="#ff5400" />
              </div>
              <div className="market-purge-info">
                <div className="market-purge-title-row">
                  <h3 className="market-purge-title">黑市牌庫除役服務 · 灰面卡斯楚的碎形焚爐</h3>
                  <span className="market-purge-cost-tag">
                    <Coins size={14} color="#ffd700" />
                    <span>{MARKET_PURGE_COST} 古金幣</span>
                  </span>
                </div>
                <p className="market-purge-desc">
                  支付 {MARKET_PURGE_COST} 枚古金幣，自當前牌庫中永久挑選 1 張卡牌投入焚爐燒毀，使後續戰鬥心智更為專注精純。
                </p>
              </div>
            </div>

            <div
              className="market-purge-btn-wrapper"
              onClick={() => {
                if (!canPurge) {
                  soundEngine.playDeny();
                }
              }}
            >
              <button
                id="market-open-purge-btn"
                className={`market-purge-open-btn ${!canPurge ? 'disabled' : ''}`}
                disabled={!canPurge}
                onClick={handleOpenPurge}
              >
                <Trash2 size={16} />
                <span>
                  {isPurgeUsed
                    ? '本次已除役'
                    : !canAffordPurge
                    ? '古金幣不足'
                    : !hasEnoughCards
                    ? '牌庫卡牌不足'
                    : '委託除役服務'}
                </span>
              </button>
            </div>
          </div>

          {/* Purge Selection Drawer / Modal */}
          {isPurgeOpen && (
            <div className="market-purge-modal-overlay">
              <div className="market-purge-modal">
                <div className="market-purge-modal-header">
                  <div className="market-purge-modal-title-box">
                    <Flame size={20} color="#ff5400" />
                    <h3 className="market-purge-modal-title">選取 1 張卡牌永久除役焚毀</h3>
                  </div>
                  <button className="market-purge-close-btn" onClick={handleClosePurge}>
                    <X size={18} />
                  </button>
                </div>

                <p className="market-purge-modal-subtitle">
                  點選欲銷毀之卡牌，確認後將扣除 {MARKET_PURGE_COST} 枚古金幣並自理智牌庫永久除役。此操作無法復原。
                </p>

                <div className="market-purge-cards-scroll">
                  <div className="market-purge-cards-grid">
                    {permanentCards.map((card) => {
                      const isSelected = selectedPurgeCardId === card.id;
                      const artwork = getCardArtwork(card);
                      const categoryColor =
                        card.category === 'combat'
                          ? '#e63946'
                          : card.category === 'skill'
                          ? '#ffd700'
                          : card.category === 'magic'
                          ? '#9d4edd'
                          : card.category === 'truth'
                          ? '#48cae4'
                          : '#ff0055';

                      return (
                        <div
                          key={card.id}
                          id={`purge-card-${card.id}`}
                          data-testid={`purge-card-${card.id}`}
                          className={`market-purge-card-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleTogglePurgeCard(card)}
                        >
                          <div className="market-purge-card-checkbox">
                            {isSelected ? <Check size={14} color="#fff" /> : null}
                          </div>

                          <div className="market-purge-card-top">
                            <span
                              className="market-purge-card-badge"
                              style={{ borderColor: categoryColor, color: categoryColor }}
                            >
                              {card.category === 'combat'
                                ? '戰鬥'
                                : card.category === 'skill'
                                ? '技能'
                                : card.category === 'magic'
                                ? '魔法'
                                : card.category === 'truth'
                                ? '真相'
                                : '瘋狂'}
                            </span>
                            <span className="market-purge-card-cost">
                              {card.costType === 'stamina'
                                ? `${card.costValue} 精力`
                                : card.costType === 'sanity'
                                ? `${card.costValue} 理智`
                                : '無耗費'}
                            </span>
                          </div>

                          {artwork.imageUrl && (
                            <div className="market-purge-card-art-frame">
                              <img
                                src={artwork.imageUrl}
                                alt={card.name}
                                className="market-purge-card-art"
                                loading="lazy"
                              />
                            </div>
                          )}

                          <h4 className="market-purge-card-name">{card.name}</h4>
                          <p className="market-purge-card-desc">{card.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="market-purge-modal-footer">
                  <button className="market-purge-cancel-btn" onClick={handleClosePurge}>
                    取消
                  </button>
                  <button
                    id="market-confirm-purge-btn"
                    className="market-purge-confirm-btn"
                    disabled={!selectedPurgeCardId || !canPurge}
                    onClick={handleConfirmPurge}
                  >
                    <Flame size={16} />
                    <span>
                      {selectedPurgeCardId
                        ? '確認焚毀除役'
                        : '請先點選 1 張欲除役卡牌'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Leave Market */}
        <div className="market-footer">
          <button
            id="leave-market-btn"
            className="market-leave-btn"
            onClick={handleLeave}
          >
            <LogOut size={18} />
            <span>離開黑市，返回調查地圖</span>
          </button>
        </div>
      </div>
    </div>
  );
};

