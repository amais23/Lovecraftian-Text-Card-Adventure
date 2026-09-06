import React from 'react';
import type { GameAction, GameState } from '../types/game';
import { EnemyView } from './EnemyView';
import { BattleLog } from './BattleLog';
import { InvestigatorStatus } from './InvestigatorStatus';
import { CardView } from './CardView';
import { Skull, Trophy, Coins, Compass } from 'lucide-react';

interface CombatScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const CombatScreen: React.FC<CombatScreenProps> = ({ state, dispatch }) => {
  const isCombatEnded = state.phase !== 'combat';
  const totalDeckCount = state.sanityDeck.length + state.hand.length + state.discardPile.length;

  const handlePlayCard = (cardId: string) => {
    dispatch({ type: 'PLAY_CARD', payload: { cardId } });
  };

  const handleEndTurn = () => {
    dispatch({ type: 'END_TURN' });
  };

  const handleRestart = () => {
    dispatch({ type: 'RESET_COMBAT' });
  };

  return (
    <div className="combat-container">
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
          totalDeckCapacity={totalDeckCount}
          turn={state.turn}
          onEndTurn={handleEndTurn}
          isCombatEnded={isCombatEnded}
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
              食屍鬼發出最後的哀嚎倒斃在地，潮濕腥臭的空氣漸漸散去。你的理智在這場驚險的搏殺中經受住了考驗。
            </p>
            <button className="combat-modal-btn" onClick={handleRestart}>
              重新開始冒險 (Restart)
            </button>
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
            <button className="combat-modal-btn" onClick={handleRestart}>
              再次挑戰深淵 (Retry)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
