import React, { useState } from 'react';
import type { Card, GameAction, GameState } from '../types/game';
import { getAllPermanentCards } from '../engine/abyssalSeals';
import { Droplets, Flame, Check, LogOut, Trash2 } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';

interface BloodAltarScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const BloodAltarScreen: React.FC<BloodAltarScreenProps> = ({ state, dispatch }) => {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const isUsed = Boolean(state.bloodAltarUsed);
  const permanentCards = getAllPermanentCards(state);

  const handleToggleCard = (card: Card) => {
    if (isUsed) return;
    const exists = selectedCardIds.includes(card.id);

    if (exists) {
      soundEngine.playClick();
      setSelectedCardIds((prev) => prev.filter((id) => id !== card.id));
    } else {
      if (selectedCardIds.length >= 2) return;
      soundEngine.playClick();
      setSelectedCardIds((prev) => [...prev, card.id]);
    }
  };

  const handlePurge = () => {
    if (selectedCardIds.length !== 2 || isUsed) return;
    soundEngine.playClick();
    dispatch({
      type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
      payload: { cardIds: selectedCardIds },
    });
    setSelectedCardIds([]);
  };

  const handleLeave = () => {
    soundEngine.playClick();
    dispatch({ type: 'LEAVE_BLOOD_ALTAR' });
  };

  return (
    <div className="blood-altar-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="blood-altar-card-panel">
        <header className="blood-altar-header">
          <div className="blood-altar-header-top">
            <div className="blood-altar-icon-badge">
              <Droplets size={36} color="#d90429" />
            </div>
            <AudioToggle />
          </div>
          <h1 className="blood-altar-title">血之祭壇 · 淨化血契</h1>
          <p className="blood-altar-subtitle">
            以凡人鮮血浸潤石槽，燃起除役純火。自主挑選 2 張卡牌，將其自理智牌庫中永久拔除焚毀，使後續戰鬥心智更為專注精純。
          </p>
        </header>

        {/* Status Strip */}
        <div className="blood-altar-status-strip">
          <div className="blood-altar-status-pill">
            <Flame size={18} color="#ff4a6e" />
            <span>目前牌庫規模：{permanentCards.length} 張</span>
          </div>

          <div className="blood-altar-status-pill highlight">
            <Trash2 size={18} color="#d90429" />
            <span>已選除役卡牌：{selectedCardIds.length} / 2 張</span>
          </div>

          <span className="blood-altar-hint">
            {isUsed
              ? '血契儀式已完成，選取之卡牌已自牌庫永久除役'
              : '點選卡牌進行勾選（上限 2 張），確認後點擊「執行焚血除役」'}
          </span>
        </div>

        {/* Cards Grid */}
        <div className="blood-altar-cards-scroll">
          <div className="blood-altar-cards-grid">
            {permanentCards.map((card) => {
              const isSelected = selectedCardIds.includes(card.id);
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
                  id={`blood-altar-card-${card.id}`}
                  className={`blood-altar-card-item ${isSelected ? 'selected' : ''} ${isUsed ? 'disabled' : ''}`}
                  onClick={() => handleToggleCard(card)}
                >
                  <div className="blood-altar-card-checkbox">
                    {isSelected ? <Check size={16} color="#fff" /> : null}
                  </div>

                  <div className="blood-altar-card-top">
                    <span
                      className="blood-altar-card-badge"
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
                    <span className="blood-altar-card-cost">
                      {card.costType === 'stamina'
                        ? `${card.costValue} 精力`
                        : card.costType === 'sanity'
                        ? `${card.costValue} 理智`
                        : '無耗費'}
                    </span>
                  </div>

                  <h4 className="blood-altar-card-name">{card.name}</h4>
                  <p className="blood-altar-card-desc">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Panel */}
        <footer className="blood-altar-footer">
          <button
            id="blood-altar-purge-btn"
            className="blood-altar-purge-btn"
            disabled={selectedCardIds.length !== 2 || isUsed}
            onClick={handlePurge}
          >
            <Flame size={18} />
            <span>
              {isUsed
                ? '已完成焚血除役'
                : selectedCardIds.length === 2
                ? '執行焚血除役（永久剔除 2 張卡牌）'
                : `請選取 2 張卡牌（目前已選 ${selectedCardIds.length}/2）`}
            </span>
          </button>

          <button id="blood-altar-leave-btn" className="blood-altar-leave-btn" onClick={handleLeave}>
            <LogOut size={18} />
            <span>{isUsed ? '完成血契 · 離開祭壇' : '保留牌組 · 轉身離開'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
