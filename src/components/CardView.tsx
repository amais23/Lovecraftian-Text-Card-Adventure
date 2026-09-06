import React from 'react';
import type { Card, CardCategory } from '../types/game';
import { Swords, Shield, Sparkles, Wind, Flame, Eye } from 'lucide-react';

interface CategoryMeta {
  label: string;
  defaultPrompt: string;
  playablePrompt: string;
  defaultIcon: React.ReactNode;
}

const CATEGORY_META_CONFIG: Record<CardCategory, CategoryMeta> = {
  combat: {
    label: '戰鬥',
    defaultPrompt: '精力不足',
    playablePrompt: '點擊打出',
    defaultIcon: <Swords size={22} color="#e63946" />,
  },
  skill: {
    label: '技能',
    defaultPrompt: '精力不足',
    playablePrompt: '點擊打出',
    defaultIcon: <Shield size={22} color="#f4a261" />,
  },
  truth: {
    label: '真相',
    defaultPrompt: '精力不足',
    playablePrompt: '點擊打出',
    defaultIcon: <Eye size={22} color="#f8fafc" />,
  },
  madness: {
    label: '瘋狂',
    defaultPrompt: '精力不足',
    playablePrompt: '發動狂擊',
    defaultIcon: <Flame size={22} color="#ef4444" />,
  },
  magic: {
    label: '魔法',
    defaultPrompt: '精力不足',
    playablePrompt: '引導秘術',
    defaultIcon: <Sparkles size={22} color="#cfa866" />,
  },
};

interface CardViewProps {
  card: Card;
  currentStamina: number;
  currentSanity?: number;
  onPlay: (cardId: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  currentStamina,
  currentSanity,
  onPlay,
  disabled = false,
  style,
}) => {
  const isPlayable = !disabled && (
    card.costType === 'sanity'
      ? (currentSanity !== undefined ? currentSanity >= card.costValue : true)
      : currentStamina >= card.costValue
  );

  const meta = CATEGORY_META_CONFIG[card.category] ?? {
    label: card.category,
    defaultPrompt: '精力不足',
    playablePrompt: '點擊打出',
    defaultIcon: <Sparkles size={22} color="#cfa866" />,
  };

  const defaultPrompt = card.costType === 'sanity' ? '理智不足' : meta.defaultPrompt;
  const promptText = isPlayable ? meta.playablePrompt : defaultPrompt;
  const tooltip = isPlayable
    ? `點擊打出【${card.name}】`
    : card.costType === 'sanity'
      ? '理智不足無法打出'
      : '精力不足無法打出';

  const handleClick = () => {
    if (isPlayable) {
      onPlay(card.id);
    }
  };

  const getCardIcon = () => {
    if (card.effects.some((e) => e.type === 'restore_sanity')) {
      return <Wind size={22} color="#e9d8a6" />;
    }
    return meta.defaultIcon;
  };

  const selfDamageEffect = card.effects.find((e) => e.type === 'self_damage');

  return (
    <div
      className={`card-item ${card.category} ${isPlayable ? 'playable' : 'disabled'}`}
      onClick={handleClick}
      title={tooltip}
      style={style}
    >
      {/* Top row: Cost and Category */}
      <div className="card-top-row">
        <div
          className={`card-cost-orb ${card.costType ?? 'stamina'}`}
          title={card.costType === 'sanity' ? `消耗 ${card.costValue} 點理智` : `消耗 ${card.costValue} 點精力`}
        >
          {card.costValue}
        </div>
        <div className={`card-category-tag ${card.category}`}>
          {meta.label}
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
        {promptText}
      </div>
    </div>
  );
};
