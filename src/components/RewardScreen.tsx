import React from 'react';
import type { GameAction, GameState } from '../types/game';
import { CardView } from './CardView';
import { Trophy, Coins, Heart, AlertTriangle, ShieldCheck, FastForward } from 'lucide-react';

interface RewardScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const RewardScreen: React.FC<RewardScreenProps> = ({ state, dispatch }) => {
  const rewardCards = state.rewardCards ?? [];
  const obolsReward = state.rewardObols ?? 15;

  const handleClaimCard = (cardId: string) => {
    dispatch({
      type: 'CLAIM_CARD_REWARD',
      payload: { cardId },
    });
  };

  const handleSkip = () => {
    dispatch({
      type: 'CLAIM_CARD_REWARD',
    });
  };

  return (
    <div className="reward-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="reward-card-panel">
        {/* Victory Header */}
        <div className="reward-header">
          <div className="reward-trophy-icon">
            <Trophy size={42} color="#74c69d" />
          </div>
          <h1 className="reward-title">戰鬥勝利 · 戰利品與卡牌構築</h1>
          <p className="reward-subtitle">
            你擊退了深淵的可怖造物，但在黑暗的盡頭，更龐大的陰影正在蠕動……
          </p>
        </div>

        {/* Resources & Health Persistence Banner */}
        <div className="reward-summary-row">
          {/* Ancient Obols Reward */}
          <div className="reward-pill obols" id="reward-obols-pill">
            <Coins size={22} color="#ffd700" />
            <div className="reward-pill-content">
              <span className="reward-pill-label">獲取古金幣</span>
              <span className="reward-pill-val">+{obolsReward} 枚</span>
            </div>
          </div>

          {/* Persistent Health Notice */}
          <div className="reward-pill health" id="reward-health-pill">
            <Heart size={22} color="#ff334b" />
            <div className="reward-pill-content">
              <span className="reward-pill-label">肉體生命值（傷勢保留）</span>
              <span className="reward-pill-val">
                {state.investigator.health} / {state.investigator.maxHealth}
              </span>
            </div>
          </div>

          {/* Full Sanity Reset Notice */}
          <div className="reward-pill sanity" id="reward-sanity-pill">
            <ShieldCheck size={22} color="#ab47bc" />
            <div className="reward-pill-content">
              <span className="reward-pill-label">理智牌庫重整</span>
              <span className="reward-pill-val">全額重置回滿</span>
            </div>
          </div>
        </div>

        {/* Health Damage Caution Alert */}
        <div className="reward-alert-box">
          <AlertTriangle size={18} color="#e63946" />
          <span>
            【肉體傷勢持久性】調查員身具凡人體質，戰後不自動癒合傷口！所受傷勢將直接帶入下一場遭遇戰。
          </span>
        </div>

        {/* 3-Card Selection Drafting Area */}
        <div className="reward-draft-section">
          <h3 className="reward-draft-title">
            挑選 1 張新卡牌加入你的牌組（增加理智上限，或點擊下方跳過以維持牌庫精煉）
          </h3>

          <div className="reward-cards-grid" id="reward-cards-grid">
            {rewardCards.map((card) => (
              <div
                key={card.id}
                className="reward-card-wrapper"
                onClick={() => handleClaimCard(card.id)}
              >
                <CardView
                  card={card}
                  currentStamina={99}
                  currentSanity={99}
                  onPlay={() => handleClaimCard(card.id)}
                  disabled={false}
                />
                <button
                  className="reward-card-choose-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClaimCard(card.id);
                  }}
                >
                  納入牌組
                </button>
              </div>
            ))}
          </div>

          {/* Skip Button */}
          <div className="reward-skip-container">
            <button
              id="skip-reward-btn"
              className="reward-skip-btn"
              onClick={handleSkip}
              title="不獲取新卡牌，保持現有牌組的抽牌濃度"
            >
              <FastForward size={18} />
              <span>跳過卡牌獎勵（維持牌庫精簡）</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
