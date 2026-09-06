import React, { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import type { Card, CardCategory } from '../types/game';
import { Swords, Shield, Sparkles, Wind, Flame, Eye } from 'lucide-react';
import { soundEngine } from '../engine/audioManager';
import type { HandFanOutTransform } from '../engine/handMath';

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
    playablePrompt: '點擊或上拖打出',
    defaultIcon: <Swords size={22} color="#e63946" />,
  },
  skill: {
    label: '技能',
    defaultPrompt: '精力不足',
    playablePrompt: '點擊或上拖打出',
    defaultIcon: <Shield size={22} color="#f4a261" />,
  },
  truth: {
    label: '真相',
    defaultPrompt: '精力不足',
    playablePrompt: '點擊或上拖打出',
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

export interface CardViewProps {
  card: Card;
  currentStamina: number;
  currentSanity?: number;
  onPlay: (cardId: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  fanTransform?: HandFanOutTransform;
  onDragStateChange?: (isDragging: boolean) => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  currentStamina,
  currentSanity,
  onPlay,
  disabled = false,
  style,
  fanTransform,
  onDragStateChange,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const isPlayable =
    !disabled &&
    (card.costType === 'sanity'
      ? currentSanity !== undefined
        ? currentSanity >= card.costValue
        : true
      : currentStamina >= card.costValue);

  const meta = CATEGORY_META_CONFIG[card.category] ?? {
    label: card.category,
    defaultPrompt: '精力不足',
    playablePrompt: '點擊或上拖打出',
    defaultIcon: <Sparkles size={22} color="#cfa866" />,
  };

  const defaultPrompt = card.costType === 'sanity' ? '理智不足' : meta.defaultPrompt;
  const promptText = isPlayable ? meta.playablePrompt : defaultPrompt;
  const tooltip = isPlayable
    ? `點擊或向上拖曳打出【${card.name}】`
    : card.costType === 'sanity'
    ? '理智不足無法打出'
    : '精力不足無法打出';

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!disabled) {
      soundEngine.playCardHover();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    onDragStateChange?.(true);
    soundEngine.playDrawCard();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    onDragStateChange?.(false);
    if (info.offset.y < -85 && isPlayable) {
      soundEngine.playCardPlay(card.category);
      onPlay(card.id);
    }
  };

  const handleClick = () => {
    if (isPlayable && !isDragging) {
      soundEngine.playCardPlay(card.category);
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
    <motion.div
      layout
      className={`card-item ${card.category} ${isPlayable ? 'playable' : 'disabled'} ${isDragging ? 'dragging' : ''}`}
      initial={{ opacity: 0, y: 120, scale: 0.8 }}
      animate={{
        opacity: 1,
        x: isDragging ? undefined : (fanTransform?.x ?? 0),
        y: isDragging ? undefined : (isHovered ? -70 : (fanTransform?.y ?? 0)),
        rotate: isDragging ? 0 : (isHovered ? 0 : (fanTransform?.rotate ?? 0)),
        scale: isDragging ? 1.08 : (isHovered ? 1.18 : 1),
        zIndex: isDragging ? 200 : (isHovered ? 100 : (fanTransform?.zIndex ?? 10)),
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 28,
        mass: 0.75,
      }}
      drag={isPlayable}
      dragConstraints={{ left: 0, right: 0, top: -350, bottom: 0 }}
      dragElastic={0.2}
      dragSnapToOrigin={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={tooltip}
      style={style}
    >
      {/* Top row: Cost and Category */}
      <div className="card-top-row">
        <div
          className={`card-cost-orb ${card.costType ?? 'stamina'}`}
          title={
            card.costType === 'sanity'
              ? `消耗 ${card.costValue} 點理智`
              : `消耗 ${card.costValue} 點精力`
          }
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
    </motion.div>
  );
};
