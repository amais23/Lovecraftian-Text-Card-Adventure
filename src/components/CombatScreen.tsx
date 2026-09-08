import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { GameAction, GameState } from '../types/game';
import { EnemyView } from './EnemyView';
import { BattleLog } from './BattleLog';
import { InvestigatorStatus } from './InvestigatorStatus';
import { CardView } from './CardView';
import { AudioToggle } from './AudioToggle';
import { calculateCardFanOut } from '../engine/handMath';
import { soundEngine } from '../engine/audioManager';
import { Trophy, Coins, Compass, Sparkles, AlertTriangle, Trash2, X } from 'lucide-react';
import { ArkhamGazette } from './ArkhamGazette';
import { isAncientSealUnlocked } from '../engine/abyssalSeals';
import { getCombatBackground } from '../engine/backgroundArtworks';

interface CombatScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const CombatScreen: React.FC<CombatScreenProps> = ({ state, dispatch }) => {
  const [isBanishmentVfxActive, setIsBanishmentVfxActive] = useState<boolean>(false);
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
    const playedCard = state.hand.find((c) => c.id === cardId);
    if (playedCard && isAncientSealUnlocked(playedCard, state.currentEnemy)) {
      soundEngine.playCosmicBanishment();
      setIsBanishmentVfxActive(true);
      setTimeout(() => {
        setIsBanishmentVfxActive(false);
      }, 2200);
    }
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
    dispatch({ type: 'PROCEED_TO_REWARD' });
  };

  const currentDepth = state.currentDepth ?? 1;
  const combatBgUrl = getCombatBackground(currentDepth);

  return (
    <div className={`combat-container ${state.isMadness ? 'madness-mode' : ''}`}>
      {/* Background Ambience Layers (ADR-0020) */}
      <div
        className="combat-bg-image"
        data-testid="combat-bg-image"
        style={{ backgroundImage: `url(${combatBgUrl})` }}
      />
      <div className="combat-bg-overlay" />
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      {/* Top Header */}
      <header className="combat-header">
        <div className="combat-header-title">
          <Compass size={22} color="#cfa866" />
          <h1>克蘇魯文字卡牌冒險</h1>
          <span className="combat-header-badge">
            遭遇戰 · 第 {['一', '二', '三', '四'][(state.currentDepth ?? 1) - 1] ?? '一'} 深度
          </span>
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
        <EnemyView
          enemy={state.currentEnemy}
          isMadness={state.isMadness}
          sanityCount={state.deck?.length ?? 10}
        />
        <BattleLog logs={state.battleLog} />
      </section>

      {/* Lower Split-Screen: Investigator Dashboard & Hand */}
      <section className="combat-lower-section">
        {/* Discard Phase Bar */}
        {state.discardPhase && (
          <div className="discard-phase-bar" id="discard-phase-bar">
            <div className="discard-phase-info">
              <AlertTriangle size={18} className="discard-alert-icon" />
              <div className="discard-phase-text">
                <span className="discard-phase-heading">【手牌超出容量】</span>
                <span className="discard-phase-desc">
                  手牌（{state.hand.length} 張）超出容量上限（{state.investigator.handCapacity ?? 2} 張）。請在下方選取 <strong>{state.discardPhase.requiredDiscardCount}</strong> 張卡牌棄置（已選 {state.discardPhase.selectedDiscardIds.length}/{state.discardPhase.requiredDiscardCount}）。
                </span>
              </div>
            </div>
            <div className="discard-phase-btns">
              <button
                id="confirm-discard-btn"
                className="discard-action-btn confirm"
                disabled={state.discardPhase.selectedDiscardIds.length !== state.discardPhase.requiredDiscardCount}
                onClick={() => {
                  soundEngine.playClick();
                  dispatch({ type: 'CONFIRM_DISCARD' });
                }}
              >
                <Trash2 size={15} /> 確認棄牌（{state.discardPhase.selectedDiscardIds.length}/{state.discardPhase.requiredDiscardCount}）
              </button>
              <button
                id="cancel-discard-btn"
                className="discard-action-btn cancel"
                onClick={() => {
                  soundEngine.playClick();
                  dispatch({ type: 'CANCEL_DISCARD' });
                }}
              >
                <X size={15} /> 取消
              </button>
            </div>
          </div>
        )}

        <InvestigatorStatus
          investigator={state.investigator}
          sanityCount={state.sanityDeck.length}
          totalDeckCapacity={permanentDeckCapacity}
          turn={state.turn}
          onEndTurn={handleEndTurn}
          isCombatEnded={isCombatEnded}
          isMadness={state.isMadness}
          isDiscardMode={Boolean(state.discardPhase)}
        />

        {/* Dynamic Hand Cards with Fan-Out Layout */}
        <div className={`hand-area ${state.discardPhase ? 'discard-phase-active' : ''}`} id="player-hand">
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
                enemy={state.currentEnemy}
                enemyHealth={state.currentEnemy.health}
                enemyDivineImmortality={state.currentEnemy.divineImmortality}
                isDiscardMode={Boolean(state.discardPhase)}
                isSelectedForDiscard={state.discardPhase?.selectedDiscardIds.includes(card.id)}
                onToggleDiscard={(cardId) =>
                  dispatch({ type: 'TOGGLE_DISCARD_CARD', payload: { cardId } })
                }
              />
            );
          })}
        </div>
      </section>

      {/* Victory Modal */}
      {state.phase === 'victory' && !state.isTrueEnding && (
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
                前往戰後結算
              </button>
              <button
                className="combat-modal-btn secondary"
                onClick={handleRestart}
              >
                重試本場戰鬥
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cosmic Banishment Fatal Strike VFX Overlay */}
      {isBanishmentVfxActive && (
        <motion.div
          className="cosmic-banishment-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsBanishmentVfxActive(false)}
        >
          <div className="cosmic-rift-beam" />
          <div className="cosmic-shatter-burst" />
          <motion.div
            className="cosmic-seal-sigil-container"
            initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], rotate: [-30, 10, 0], opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <Sparkles size={80} color="#ffd700" className="cosmic-sigil-icon" />
            <h2 className="cosmic-banishment-title">【太古星辰封滅 · 舊神放逐】</h2>
            <p className="cosmic-banishment-desc">
              崇高熾白的星穹真理光芒撕裂深淵，克蘇魯星之眷族崩解湮滅……
            </p>
            <span className="cosmic-banishment-skip">點擊任意處揭開《阿卡姆早報》真結局</span>
          </motion.div>
        </motion.div>
      )}

      {/* True Ending Gazette Sequence directly on Cosmic Banishment */}
      {state.phase === 'victory' && state.isTrueEnding && !isBanishmentVfxActive && (
        <ArkhamGazette
          endingType="true_ending"
          state={state}
          dispatch={dispatch}
        />
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
