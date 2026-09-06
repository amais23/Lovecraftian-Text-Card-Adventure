import React from 'react';
import type { Card } from '../types/game';
import { Swords, Shield, Sparkles, Wind, Flame, Eye } from 'lucide-react';

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
    if (card.category === 'madness') {
      return <Flame size={22} color="#ef4444" />;
    }
    if (card.category === 'truth') {
      return <Eye size={22} color="#f8fafc" />;
    }
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

  const getCategoryLabel = (category: Card['category']) => {
    switch (category) {
      case 'combat':
        return '戰鬥';
      case 'skill':
        return '技能';
      case 'truth':
        return '真相';
      case 'madness':
        return '狂亂';
      default:
        return category;
    }
  };

  const selfDamageEffect = card.effects.find((e) => e.type === 'self_damage');

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
          {getCategoryLabel(card.category)}
        </div>
      </div>

      {/* Body: Icon, Name, Badges, Effect */}
      <div className="card-body">
        <div className="card-icon-container">{getCardIcon()}</div>
        <div className="card-title">{card.name}</div>

        {(card.isTemporary || selfDamageEffect) && (
          <div className="card-badges-row">
            {card.isTemporary && <span className="card-tag-badge temp">臨時</span>}
            {selfDamageEffect && (
              <span className="card-tag-badge recoil" title="打出此卡將直接扣除生命值">
                反噬 -{selfDamageEffect.value}
              </span>
            )}
          </div>
        )}

        <div className="card-effect-desc">{card.description}</div>
        <div className="card-flavor">{card.flavorText}</div>
      </div>

      {/* Bottom prompt */}
      <div className="card-play-prompt">
        {isPlayable ? (card.category === 'madness' ? '發動狂擊' : '點擊打出') : '精力不足'}
      </div>
    </div>
  );
};
