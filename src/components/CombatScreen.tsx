import React from 'react';
import type { GameAction, GameState } from '../types/game';
import { EnemyView } from './EnemyView';
import { BattleLog } from './BattleLog';
import { InvestigatorStatus } from './InvestigatorStatus';
import { CardView } from './CardView';
import { generateRewardCards } from '../engine/initialData';
import { Skull, Trophy, Coins, Compass } from 'lucide-react';

interface CombatScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const CombatScreen: React.FC<CombatScreenProps> = ({ state, dispatch }) => {
  const isCombatEnded = state.phase !== 'combat';
  // Compute permanent deck capacity excluding in-combat temporary cards (ADR-0006 & CONTEXT.md)
  const permanentDeckCapacity = [
    ...state.sanityDeck,
    ...state.hand,
    ...state.discardPile,
  ].filter((card) => !card.isTemporary).length;

  const handlePlayCard = (cardId: string) => {
    dispatch({ type: 'PLAY_CARD', payload: { cardId } });
  };

  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN' });
  };

  const handleRestart = () => {
    dispatch({
      type: 'RESET_COMBAT',
      payload: { occupationId: state.investigator.occupationId },
    });
  };

  const handleProceedReward = () => {
    const rewardCards = generateRewardCards(3);
    dispatch({
      type: 'PROCEED_TO_REWARD',
      payload: { rewardCards, rewardObols: 15 },
    });
  };

  return (
    <div className={`combat-container ${state.isMadness ? 'madness-mode' : ''}`}>
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      {/* Top Header */}
      <header className="combat-header">
        <div className="combat-header-title">
          <Compass size={22} color="#cfa866" />
          <h1>克蘇魯文字卡牌冒險</h1>
          <span className="combat-header-badge">遭遇戰 · 第一章</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#ffd700' }}>
            <Coins size={16} />
            <span>{state.investigator.obols} 古金幣</span>
          </div>
          <div className="combat-header-turn">
            第 {state.turn} 回合
          </div>
        </div>
      </header>

      {/* Madness State Warning Banner */}
      {state.isMadness && (
        <div className="madness-status-banner">
          <span>⚠️ 【瘋狂狀態】理智牌庫已抽空！手牌將補入臨時黑色瘋狂卡，威力兇猛但會直接反噬生命值！</span>
        </div>
      )}

      {/* Upper Split-Screen: Enemy & Literary Battle Log */}
      <section className="combat-upper-section">
        <EnemyView enemy={state.currentEnemy} />
        <BattleLog logs={state.battleLog} />
      </section>

      {/* Lower Split-Screen: Investigator Dashboard & Hand */}
      <section className="combat-lower-section">
        <InvestigatorStatus
          investigator={state.investigator}
          sanityCount={state.sanityDeck.length}
          totalDeckCapacity={permanentDeckCapacity}
          turn={state.turn}
          onEndTurn={handleEndTurn}
          isCombatEnded={isCombatEnded}
          isMadness={state.isMadness}
        />

        {/* Dynamic Hand Cards */}
        <div className="hand-area" id="player-hand">
          {state.hand.map((card, index) => {
            const total = state.hand.length;
            const offset = index - (total - 1) / 2;
            const rotateDeg = offset * 2.5;
            const translateY = Math.abs(offset) * 3;

            return (
              <CardView
                key={card.id}
                card={card}
                currentStamina={state.investigator.stamina}
                currentSanity={state.sanityDeck.length}
                onPlay={handlePlayCard}
                disabled={isCombatEnded}
                style={{
                  transform: `rotate(${rotateDeg}deg) translateY(${translateY}px)`,
                }}
              />
            );
          })}
        </div>
      </section>

      {/* Victory Modal */}
      {state.phase === 'victory' && (
        <div className="combat-modal-overlay">
          <div className="combat-modal-box victory">
            <Trophy size={48} color="#74c69d" style={{ margin: '0 auto 16px' }} />
            <h2 className="combat-modal-title">戰鬥勝利</h2>
            <p className="combat-modal-desc">
              敵怪發出最後的哀嚎倒斃在地，潮濕腥臭的空氣漸漸散去。你的理智在這場驚險的搏殺中經受住了考驗。
            </p>
            <div className="combat-modal-actions">
              <button
                id="proceed-reward-btn"
                className="combat-modal-btn"
                onClick={handleProceedReward}
              >
                前往戰後結算 (Claim Rewards)
              </button>
              <button
                className="combat-modal-btn secondary"
                onClick={handleRestart}
              >
                重置戰鬥 (Reset)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {state.phase === 'gameover' && (
        <div className="combat-modal-overlay">
          <div className="combat-modal-box gameover">
            <Skull size={48} color="#ff4d5a" style={{ margin: '0 auto 16px' }} />
            <h2 className="combat-modal-title">調查員殞命</h2>
            <p className="combat-modal-desc">
              你的肉體被鋒利的爪牙撕碎，意識沉入冰冷深邃的無底深淵……未知之物將這座墓穴重新掩埋。
            </p>
            <div className="combat-modal-actions">
              <button
                id="return-title-btn"
                className="combat-modal-btn"
                onClick={() => dispatch({ type: 'RETURN_TO_TITLE' })}
              >
                返回標題畫面 (Title Screen)
              </button>
              <button
                className="combat-modal-btn secondary"
                onClick={handleRestart}
              >
                原戰鬥重試 (Retry)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
