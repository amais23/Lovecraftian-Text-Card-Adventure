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
  const [branch, setBranch] = useState<'pure' | 'reshape'>('pure');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const isUsed = Boolean(state.bloodAltarUsed);
  const permanentCards = getAllPermanentCards(state);
  const maxSelected = branch === 'reshape' ? 1 : 2;

  const handleBranchChange = (nextBranch: 'pure' | 'reshape') => {
    if (isUsed || nextBranch === branch) return;
    soundEngine.playClick();
    setBranch(nextBranch);
    setSelectedCardIds([]);
  };

  const handleToggleCard = (card: Card) => {
    if (isUsed) return;
    const exists = selectedCardIds.includes(card.id);

    if (exists) {
      soundEngine.playClick();
      setSelectedCardIds((prev) => prev.filter((id) => id !== card.id));
    } else {
      if (selectedCardIds.length >= maxSelected) return;
      soundEngine.playClick();
      setSelectedCardIds((prev) => [...prev, card.id]);
    }
  };

  const handlePurge = () => {
    if (selectedCardIds.length !== maxSelected || isUsed) return;
    soundEngine.playClick();
    dispatch({
      type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
      payload: { cardIds: selectedCardIds, branch },
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
            以凡人鮮血浸潤石槽，燃起除役純火。自主挑選血契分支：徹底洗鍊 2 張卡牌，或除役 1 張卡牌並藉由古神恩典恢復生命。
          </p>
        </header>

        {/* Branch Selector */}
        <div className="blood-altar-branch-container">
          <button
            type="button"
            id="blood-altar-branch-pure-btn"
            className={`blood-altar-branch-btn ${branch === 'pure' ? 'active' : ''}`}
            onClick={() => handleBranchChange('pure')}
            disabled={isUsed}
          >
            <Flame size={20} color="#ff4a6e" />
            <div className="blood-altar-branch-text">
              <span className="blood-altar-branch-name">純淨血契</span>
              <span className="blood-altar-branch-desc">除役 2 張卡牌 · 極限洗鍊牌庫</span>
            </div>
          </button>

          <button
            type="button"
            id="blood-altar-branch-reshape-btn"
            className={`blood-altar-branch-btn ${branch === 'reshape' ? 'active' : ''}`}
            onClick={() => handleBranchChange('reshape')}
            disabled={isUsed}
          >
            <Droplets size={20} color="#d90429" />
            <div className="blood-altar-branch-text">
              <span className="blood-altar-branch-name">血肉重塑</span>
              <span className="blood-altar-branch-desc">除役 1 張卡牌 · 恢復 5 點生命</span>
            </div>
          </button>
        </div>

        {/* Status Strip */}
        <div className="blood-altar-status-strip">
          <div className="blood-altar-status-pill">
            <Flame size={18} color="#ff4a6e" />
            <span>目前牌庫規模：{permanentCards.length} 張</span>
          </div>

          <div className="blood-altar-status-pill highlight">
            <Trash2 size={18} color="#d90429" />
            <span>已選除役卡牌：{selectedCardIds.length} / {maxSelected} 張</span>
          </div>

          <span className="blood-altar-hint">
            {isUsed
              ? '血契儀式已完成，選取之卡牌已自牌庫永久除役'
              : branch === 'pure'
              ? '點選卡牌進行勾選（上限 2 張），確認後點擊「執行純淨血契」'
              : '點選卡牌進行勾選（上限 1 張），確認後點擊「執行血肉重塑」'}
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
            disabled={selectedCardIds.length !== maxSelected || isUsed}
            onClick={handlePurge}
          >
            {branch === 'pure' ? <Flame size={18} /> : <Droplets size={18} />}
            <span>
              {isUsed
                ? '已完成焚血除役'
                : selectedCardIds.length === maxSelected
                ? (branch === 'pure'
                    ? '執行純淨血契（永久剔除 2 張卡牌）'
                    : '執行血肉重塑（除役 1 張卡牌並恢復 5 點生命）')
                : `請選取 ${maxSelected} 張卡牌（目前已選 ${selectedCardIds.length}/${maxSelected}）`}
            </span>
          </button>

          <button id="blood-altar-leave-btn" className="blood-altar-leave-btn" onClick={handleLeave}>
            <LogOut size={18} />
            <span>{isUsed ? '完成血契 · 離開血之祭壇' : '保留牌組 · 離開血之祭壇'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
