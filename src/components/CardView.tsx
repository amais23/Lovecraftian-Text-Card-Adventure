import React from 'react';
import type { Card } from '../types/game';
import { Swords, Shield, Sparkles, Wind } from 'lucide-react';

interface CardViewProps {
  card: Card;
  currentStamina: number;
  onPlay: (cardId: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  currentStamina,
  onPlay,
  disabled = false,
  style,
}) => {
  const isPlayable = !disabled && card.costType === 'stamina' && currentStamina >= card.costValue;

  const handleClick = () => {
    if (isPlayable) {
      onPlay(card.id);
    }
  };

  const getCardIcon = () => {
    if (card.category === 'combat') {
      return <Swords size={22} color="#e63946" />;
    }
    if (card.effects.some((e) => e.type === 'armor')) {
      return <Shield size={22} color="#f4a261" />;
    }
    if (card.effects.some((e) => e.type === 'restore_sanity')) {
      return <Wind size={22} color="#e9d8a6" />;
    }
    return <Sparkles size={22} color="#cfa866" />;
  };

  return (
    <div
      className={`card-item ${card.category} ${isPlayable ? 'playable' : 'disabled'}`}
      onClick={handleClick}
      title={isPlayable ? `點擊打出【${card.name}】` : '精力不足無法打出'}
      style={style}
    >
      {/* Top row: Cost and Category */}
      <div className="card-top-row">
        <div className="card-cost-orb" title={`消耗 ${card.costValue} 點精力`}>
          {card.costValue}
        </div>
        <div className={`card-category-tag ${card.category}`}>
          {card.category === 'combat' ? '戰鬥' : '技能'}
        </div>
      </div>

      {/* Body: Icon, Name, Effect */}
      <div className="card-body">
        <div className="card-icon-container">{getCardIcon()}</div>
        <div className="card-title">{card.name}</div>
        <div className="card-effect-desc">{card.description}</div>
        <div className="card-flavor">{card.flavorText}</div>
      </div>

      {/* Bottom prompt */}
      <div className="card-play-prompt">
        {isPlayable ? '點擊打出' : '精力不足'}
      </div>
    </div>
  );
};
