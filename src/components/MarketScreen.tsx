import React from 'react';
import type { GameAction, GameState, MarketItem } from '../types/game';
import { ShoppingBag, Coins, Heart, LogOut, Check, Sparkles, Swords, Shield } from 'lucide-react';

interface MarketScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const MarketScreen: React.FC<MarketScreenProps> = ({ state, dispatch }) => {
  const investigator = state.investigator;
  const items = state.marketItems ?? [];

  const handleBuy = (item: MarketItem) => {
    if (!item.isPurchased && investigator.obols >= item.price) {
      dispatch({
        type: 'BUY_MARKET_ITEM',
        payload: { itemId: item.id },
      });
    }
  };

  const handleLeave = () => {
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

          <div className="market-obols-badge" id="market-current-obols">
            <Coins size={22} color="#ffd700" />
            <div className="market-obols-info">
              <span className="market-obols-label">持有古金幣</span>
              <span className="market-obols-val">{investigator.obols} 枚</span>
            </div>
          </div>
        </header>

        {/* Health status strip */}
        <div className="market-status-strip">
          <div className="market-status-pill health">
            <Heart size={16} color="#ff334b" />
            <span>生命值: {investigator.health} / {investigator.maxHealth}</span>
          </div>
          <span className="market-hint">點選物品花費古金幣採購，購買後直接納入牌組或生效</span>
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
                className={`market-item-card ${isSold ? 'sold-out' : ''} ${item.type}`}
              >
                <div className="market-item-header">
                  <div className="market-item-icon">
                    {item.type === 'heal' ? (
                      <Heart size={20} color="#ff334b" />
                    ) : item.card?.category === 'combat' ? (
                      <Swords size={20} color="#e63946" />
                    ) : item.card?.category === 'skill' ? (
                      <Shield size={20} color="#cfa866" />
                    ) : (
                      <Sparkles size={20} color="#c77dff" />
                    )}
                  </div>
                  <span className="market-item-type-badge">
                    {item.type === 'heal' ? '醫療補給' : '戰術卡牌'}
                  </span>
                </div>

                <h3 className="market-item-name">{item.name}</h3>
                <p className="market-item-desc">{item.description}</p>

                <div className="market-item-footer">
                  <div className="market-item-price">
                    <Coins size={16} color="#ffd700" />
                    <span>{item.price} 古金幣</span>
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
