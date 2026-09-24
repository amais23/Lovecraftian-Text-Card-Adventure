import React, { useState } from 'react';
import type { Card, GameAction, GameState } from '../types/game';
import { Ghost, Coins, BookOpen, LogOut, Check, Sparkles, Skull } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';
import { isInheritableCard } from '../engine/remainsStorage';

interface RemainsScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const RemainsScreen: React.FC<RemainsScreenProps> = ({ state, dispatch }) => {
  const fallen = state.fallenInvestigator;
  const isClaimed = Boolean(state.remainsClaimed);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const inheritableCards = fallen ? (fallen.deck || []).filter(isInheritableCard) : [];
  const residualObols = fallen ? Math.max(15, Math.floor(fallen.obols * 0.5)) : 0;

  const handleInheritCard = () => {
    if (!selectedCardId || isClaimed) return;
    soundEngine.playClick();
    dispatch({
      type: 'INHERIT_REMAINS',
      payload: { type: 'card', cardId: selectedCardId },
    });
  };

  const handleInheritObols = () => {
    if (isClaimed) return;
    soundEngine.playClick();
    dispatch({
      type: 'INHERIT_REMAINS',
      payload: { type: 'obols' },
    });
  };

  const handleLeave = () => {
    soundEngine.playClick();
    dispatch({ type: 'LEAVE_NODE' });
  };

  return (
    <div className="remains-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="remains-card-panel">
        <header className="remains-header">
          <div className="remains-header-top">
            <div className="remains-icon-badge">
              <Ghost size={36} color="#b8c0ff" />
            </div>
            <AudioToggle />
          </div>
          <h1 className="remains-title">屍骨遺骸 · 前代調查員長眠之所</h1>
          <p className="remains-subtitle">
            深灰的石隙間斜倚著一具被風雨浸蝕的殘破骸骨。身旁散落著浸染血漬的調查手記與行囊，無聲訴說著前任探索者未能走完的深淵遠征。
          </p>
        </header>

        {fallen ? (
          <>
            {/* Fallen Dossier */}
            <div className="remains-dossier-card">
              <div className="remains-dossier-header">
                <Skull size={20} color="#ff758f" />
                <span className="remains-dossier-title">殉職調查員手札檔案</span>
              </div>
              <div className="remains-dossier-grid">
                <div className="remains-dossier-item">
                  <span className="label">先驅姓名</span>
                  <span className="value">{fallen.name}</span>
                </div>
                <div className="remains-dossier-item">
                  <span className="label">調查職業</span>
                  <span className="value">{fallen.occupation}</span>
                </div>
                <div className="remains-dossier-item">
                  <span className="label">殞落地點</span>
                  <span className="value">第 {fallen.depth} 深度</span>
                </div>
                <div className="remains-dossier-item">
                  <span className="label">身亡死因</span>
                  <span className="value">{fallen.causeOfDeath || '傷重力竭殞命'}</span>
                </div>
              </div>
            </div>

            {/* Instruction strip */}
            <div className="remains-status-strip">
              <span className="remains-status-text">
                {isClaimed
                  ? '已完成前人遺志傳承，此處骸骨之靈終獲平息'
                  : '二選一傳承：挑選 1 張先驅卡牌繼承，或拾取 50% 殘存古金幣'}
              </span>
            </div>

            {/* Two Choices Layout */}
            <div className="remains-choices-layout">
              {/* Choice 1: Inherit Card */}
              <div className={`remains-choice-block ${isClaimed ? 'disabled' : ''}`}>
                <div className="remains-choice-header">
                  <BookOpen size={20} color="#cfa866" />
                  <h4>繼承先驅手記 · 卡牌傳承</h4>
                </div>
                <p className="remains-choice-desc">
                  自前人殘存的手記中研讀其生前掌握的調查卡牌，將其中 1 張永久納入理智牌庫。
                </p>

                <div className="remains-cards-scroll">
                  <div className="remains-cards-list">
                    {inheritableCards.length > 0 ? (
                      inheritableCards.map((card: Card) => {
                        const isSelected = selectedCardId === card.id;
                        return (
                          <div
                            key={card.id}
                            id={`remains-card-${card.id}`}
                            className={`remains-card-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => !isClaimed && setSelectedCardId(card.id)}
                          >
                            <div className="remains-card-radio">
                              {isSelected ? <Check size={14} color="#fff" /> : null}
                            </div>
                            <div className="remains-card-info">
                              <span className="remains-card-name">{card.name}</span>
                              <span className="remains-card-desc">{card.description}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="remains-empty-hint" style={{ padding: '12px', color: '#888' }}>
                        先驅手記中未遺留可繼承之常規卡牌。
                      </p>
                    )}
                  </div>
                </div>

                <button
                  id="remains-inherit-card-btn"
                  className="remains-confirm-btn"
                  disabled={!selectedCardId || isClaimed}
                  onClick={handleInheritCard}
                >
                  <Sparkles size={16} />
                  <span>{isClaimed ? '已完成繼承' : '繼承選取卡牌'}</span>
                </button>
              </div>

              {/* Choice 2: Inherit Obols */}
              <div className={`remains-choice-block obols-block ${isClaimed ? 'disabled' : ''}`}>
                <div className="remains-choice-header">
                  <Coins size={20} color="#ffd700" />
                  <h4>搜刮行囊物資 · 古金幣傳承</h4>
                </div>
                <p className="remains-choice-desc">
                  自浸透血污的皮革包底拾取前人留存的 50% 古金幣，充實當前探險軍資。
                </p>

                <div className="remains-obols-display">
                  <Coins size={36} color="#ffd700" />
                  <div className="remains-obols-numbers">
                    <span className="amount">+{residualObols} 枚</span>
                    <span className="sub">（原留存 {fallen.obols} 枚古金幣之 50%）</span>
                  </div>
                </div>

                <button
                  id="remains-inherit-obols-btn"
                  className="remains-confirm-btn obols"
                  disabled={isClaimed}
                  onClick={handleInheritObols}
                >
                  <Coins size={16} />
                  <span>{isClaimed ? '已完成領取' : `拾取 ${residualObols} 枚古金幣`}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="remains-empty-state">
            <p>枯骨已被歲月與風蝕磨成粉末，周遭並未留下任何可供繼承之遺物。</p>
          </div>
        )}

        {/* Footer */}
        <footer className="remains-footer">
          <button id="remains-leave-btn" className="remains-leave-btn" onClick={handleLeave}>
            <LogOut size={18} />
            <span>致敬默哀 · 離開遺骨</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
