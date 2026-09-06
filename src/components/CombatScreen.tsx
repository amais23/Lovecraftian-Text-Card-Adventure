import React, { useState, useEffect, useRef } from 'react';
import type { GameAction, GameState } from '../types/game';
import { EnemyView } from './EnemyView';
import { BattleLog } from './BattleLog';
import { InvestigatorStatus } from './InvestigatorStatus';
import { CardView } from './CardView';
import { AudioToggle } from './AudioToggle';
import { generateRewardCards } from '../engine/initialData';
import { calculateCardFanOut } from '../engine/handMath';
import { soundEngine } from '../engine/audioManager';
import { Trophy, Coins, Compass, Sparkles } from 'lucide-react';
import { ArkhamGazette } from './ArkhamGazette';

interface CombatScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const CombatScreen: React.FC<CombatScreenProps> = ({ state, dispatch }) => {
  const [isDraggingCard, setIsDraggingCard] = useState<boolean>(false);
  const isCombatEnded = state.phase !== 'combat';

  const prevPlayerHealthRef = useRef(state.investigator.health);
  const prevEnemyHealthRef = useRef(state.currentEnemy.health);
  const prevTurnRef = useRef(state.turn);

  // Audio: play damage sound when player or enemy takes damage
  useEffect(() => {
    if (
      state.investigator.health < prevPlayerHealthRef.current ||
      state.currentEnemy.health < prevEnemyHealthRef.current
    ) {
      soundEngine.playDamage();
    }
    prevPlayerHealthRef.current = state.investigator.health;
    prevEnemyHealthRef.current = state.currentEnemy.health;
  }, [state.investigator.health, state.currentEnemy.health]);

  // Audio: play draw card sound on combat start and when turn advances
  useEffect(() => {
    if (state.turn > prevTurnRef.current) {
      soundEngine.playDrawCard();
    }
    prevTurnRef.current = state.turn;
  }, [state.turn]);

  useEffect(() => {
    soundEngine.playDrawCard();
  }, []);

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
    soundEngine.playClick();
    dispatch({ type: 'END_TURN' });
  };

  const handleRestart = () => {
    soundEngine.playClick();
    dispatch({
      type: 'RESET_COMBAT',
      payload: {
        occupationId: state.investigator.occupationId,
        enemy: state.currentEnemy,
      },
    });
  };

  const handleProceedReward = () => {
    soundEngine.playClick();
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

        <div className="combat-header-right">
          <div className="combat-header-obols">
            <Coins size={16} />
            <span>{state.investigator.obols} 古金幣</span>
          </div>
          <div className="combat-header-turn">
            第 {state.turn} 回合
          </div>
          <AudioToggle />
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
        {/* Drag & Drop Guidance Bar */}
        <div className={`drag-drop-target-bar ${isDraggingCard ? 'active' : ''}`}>
          <div className="drop-target-glow" />
          <span className="drop-target-label">
            <Sparkles size={16} /> 向上拖曳至此引導打出 (Drag Up to Cast)
          </span>
        </div>

        <InvestigatorStatus
          investigator={state.investigator}
          sanityCount={state.sanityDeck.length}
          totalDeckCapacity={permanentDeckCapacity}
          turn={state.turn}
          onEndTurn={handleEndTurn}
          isCombatEnded={isCombatEnded}
          isMadness={state.isMadness}
        />

        {/* Dynamic Hand Cards with Fan-Out Layout */}
        <div className="hand-area" id="player-hand">
          {state.hand.map((card, index) => {
            const fan = calculateCardFanOut(index, state.hand.length);

            return (
              <CardView
                key={card.id}
                card={card}
                currentStamina={state.investigator.stamina}
                currentSanity={state.sanityDeck.length}
                onPlay={handlePlayCard}
                disabled={isCombatEnded}
                fanTransform={fan}
                onDragStateChange={setIsDraggingCard}
              />
            );
          })}
        </div>
      </section>

      {/* Victory Modal */}
      {state.phase === 'victory' && (
        <div className="combat-modal-overlay">
          <div className="combat-modal-box victory">
            <Trophy size={48} color="#74c69d" className="modal-hero-icon" />
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

      {/* Arkham Gazette Ending Sequence on Investigator Death */}
      {state.phase === 'gameover' && (
        <ArkhamGazette
          endingType="death"
          state={state}
          dispatch={dispatch}
          onRetryCombat={handleRestart}
        />
      )}
    </div>
  );
};
