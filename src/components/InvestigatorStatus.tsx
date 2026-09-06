import React from 'react';
import type { Investigator } from '../types/game';
import { Heart, Zap, Shield, BookOpen, UserCheck, Flame } from 'lucide-react';
import { useTraumaShake } from '../hooks/useTraumaShake';

interface InvestigatorStatusProps {
  investigator: Investigator;
  sanityCount: number;
  totalDeckCapacity: number;
  turn: number;
  onEndTurn: () => void;
  isCombatEnded: boolean;
  isMadness?: boolean;
}

export const InvestigatorStatus: React.FC<InvestigatorStatusProps> = ({
  investigator,
  sanityCount,
  totalDeckCapacity,
  turn,
  onEndTurn,
  isCombatEnded,
  isMadness = false,
}) => {
  const { isShaking: isHealthShaking, shakeKey: healthShakeKey } = useTraumaShake(investigator.health);
  const { isShaking: isSanityShaking, shakeKey: sanityShakeKey } = useTraumaShake(sanityCount);

  return (
    <div className="investigator-panel">
      {/* Investigator Identity */}
      <div className="investigator-profile">
        <div className="investigator-avatar">
          <UserCheck size={26} />
        </div>
        <div className="investigator-meta">
          <h3>{investigator.name}</h3>
          <span>{investigator.occupation}</span>
        </div>
      </div>

      {/* Resource Meters */}
      <div className="resource-meters">
        {/* Health */}
        <div
          key={`health-badge-${healthShakeKey}`}
          className={`resource-badge health ${isHealthShaking ? 'trauma-shake' : ''}`}
          title="肉體生命值（凡人體質，戰後不自動恢復）"
        >
          <Heart size={20} className="res-icon" />
          <div className="res-content">
            <span className="res-label">肉體生命</span>
            <span className="res-value">
              {investigator.health} / {investigator.maxHealth}
            </span>
          </div>
        </div>

        {/* Armor */}
        <div className="resource-badge armor" title="物理防禦護甲（跨回合累積保留）">
          <Shield size={20} className="res-icon" />
          <div className="res-content">
            <span className="res-label">累積護甲</span>
            <span className="res-value">{investigator.armor}</span>
          </div>
        </div>

        {/* Stamina */}
        <div className="resource-badge stamina" title="每回合行動精力（回合開始刷新為 3 點）">
          <Zap size={20} className="res-icon" />
          <div className="res-content">
            <span className="res-label">行動精力</span>
            <span className="res-value">
              {investigator.stamina} / {investigator.maxStamina}
            </span>
          </div>
        </div>

        {/* Sanity (Sanity Deck) */}
        <div
          key={`sanity-badge-${sanityShakeKey}`}
          className={`resource-badge sanity ${isMadness ? 'madness' : ''} ${isSanityShaking ? 'trauma-shake' : ''}`}
          title={
            isMadness
              ? '理智牌庫已歸零！處於瘋狂狀態，抽牌將轉為臨時黑色瘋狂卡反噬肉體'
              : '理智牌庫（剩餘卡牌數量即為調查員理智值）'
          }
        >
          {isMadness ? (
            <Flame size={20} className="res-icon" />
          ) : (
            <BookOpen size={20} className="res-icon" />
          )}
          <div className="res-content">
            <span className="res-label">
              {isMadness ? '理智牌庫 · 瘋狂' : '理智牌庫'}
            </span>
            <span className="res-value">
              {sanityCount} / {totalDeckCapacity}
            </span>
          </div>
        </div>
      </div>

      {/* End Turn Button */}
      <button
        id="end-turn-btn"
        className="end-turn-btn"
        onClick={onEndTurn}
        disabled={isCombatEnded}
        title="結束當前回合，保留手牌並補抽至 4 張，承受敵人反擊"
      >
        結束回合 · 第 {turn} 回合
      </button>
    </div>
  );
};
