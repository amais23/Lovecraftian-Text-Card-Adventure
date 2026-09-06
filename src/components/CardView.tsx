import React, { useState, useMemo } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import type { Card, CardCategory } from '../types/game';
import { Swords, Shield, Sparkles, Wind, Flame, Eye } from 'lucide-react';
import { soundEngine } from '../engine/audioManager';
import type { HandFanOutTransform } from '../engine/handMath';
import { getCardArtwork } from '../engine/cardArtworks';

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
    defaultIcon: <Swords size={16} color="#e63946" />,
  },
  skill: {
    label: '技能',
    defaultPrompt: '精力不足',
    playablePrompt: '點擊或上拖打出',
    defaultIcon: <Shield size={16} color="#f4a261" />,
  },
  truth: {
    label: '真相',
    defaultPrompt: '精力不足',
    playablePrompt: '點擊或上拖打出',
    defaultIcon: <Eye size={16} color="#f8fafc" />,
  },
  madness: {
    label: '瘋狂',
    defaultPrompt: '精力不足',
    playablePrompt: '發動狂擊',
    defaultIcon: <Flame size={16} color="#a1a1aa" />,
  },
  magic: {
    label: '魔法',
    defaultPrompt: '精力不足',
    playablePrompt: '引導秘術',
    defaultIcon: <Sparkles size={16} color="#cfa866" />,
  },
};

export interface CardViewProps {
  card: Card;
  currentStamina: number;
  currentSanity?: number;
  onPlay?: (cardId: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  fanTransform?: HandFanOutTransform;
  onDragStateChange?: (isDragging: boolean) => void;
  isStandalone?: boolean;
  onClick?: () => void;
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
  isStandalone = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const isPlayable =
    !disabled &&
    !isStandalone &&
    (card.costType === 'sanity'
      ? currentSanity !== undefined
        ? currentSanity >= card.costValue
        : true
      : currentStamina >= card.costValue);

  const meta = CATEGORY_META_CONFIG[card.category] ?? {
    label: card.category,
    defaultPrompt: '精力不足',
    playablePrompt: '點擊或上拖打出',
    defaultIcon: <Sparkles size={16} color="#cfa866" />,
  };

  const defaultPrompt = card.costType === 'sanity' ? '理智不足' : meta.defaultPrompt;
  const promptText = isPlayable ? meta.playablePrompt : defaultPrompt;
  const tooltip = isPlayable
    ? `點擊或向上拖曳打出【${card.name}】`
    : card.costType === 'sanity'
    ? '理智不足無法打出'
    : '精力不足無法打出';

  const artwork = useMemo(() => getCardArtwork(card), [card]);

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
    if (isStandalone) return;
    setIsDragging(true);
    onDragStateChange?.(true);
    soundEngine.playCardHover();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isStandalone) return;
    setIsDragging(false);
    onDragStateChange?.(false);
    if (info.offset.y < -85 && isPlayable) {
      soundEngine.playCardPlay(card.category);
      onPlay?.(card.id);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (isPlayable && !isDragging) {
      soundEngine.playCardPlay(card.category);
      onPlay?.(card.id);
    }
  };

  const getCardIcon = () => {
    if (card.effects.some((e) => e.type === 'restore_sanity')) {
      return <Wind size={16} color="#e9d8a6" />;
    }
    return meta.defaultIcon;
  };

  const selfDamageEffect = card.effects.find((e) => e.type === 'self_damage');
  const tierClass = card.category === 'madness' ? 'tier-madness' : `tier-${card.tier ?? 1}`;

  return (
    <motion.div
      layout={!isStandalone}
      className={`card-item ${card.category} ${tierClass} ${
        isStandalone ? 'standalone' : isPlayable ? 'playable' : 'disabled'
      } ${isDragging ? 'dragging' : ''}`}
      initial={isStandalone ? false : { opacity: 0, y: 120, scale: 0.8 }}
      animate={
        isStandalone
          ? { opacity: 1, scale: isHovered ? 1.05 : 1 }
          : {
              opacity: 1,
              x: isDragging ? undefined : (fanTransform?.x ?? 0),
              y: isDragging ? undefined : isHovered ? -75 : (fanTransform?.y ?? 0),
              rotate: isDragging ? 0 : isHovered ? 0 : (fanTransform?.rotate ?? 0),
              scale: isDragging ? 1.08 : isHovered ? 1.2 : 1,
              zIndex: isDragging ? 200 : isHovered ? 100 : (fanTransform?.zIndex ?? 10),
            }
      }
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 28,
        mass: 0.75,
      }}
      drag={!isStandalone && isPlayable}
      dragConstraints={{ left: 0, right: 0, top: -350, bottom: 0 }}
      dragElastic={0.2}
      dragSnapToOrigin={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      title={isStandalone ? card.name : tooltip}
      style={style}
    >
      {/* Top row: Cost Orb and Category Pill */}
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
          <span className="card-category-icon">{getCardIcon()}</span>
          <span>{meta.label}</span>
        </div>
      </div>

      {/* Illustration Frame (ADR-0012 Dedicated Artwork Window) */}
      <div className={`card-illustration-frame frame-${card.category}`}>
        <img
          src={artwork.imageUrl}
          alt={card.name}
          className="card-illustration-img"
          loading="lazy"
        />
        {!isStandalone && <div className="card-illustration-vignette" />}
      </div>

      {/* Title Banner */}
      <div className="card-title-banner">
        <span className="card-title-text">{card.name}</span>
      </div>

      {/* Badges row (Temporary / Recoil) */}
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

      {/* Rule Effect Description */}
      <div className="card-effect-desc">{card.description}</div>

      {/* Flavor Narrative Text */}
      <div className="card-flavor">{card.flavorText}</div>

      {/* Bottom Play Prompt */}
      {!isStandalone && (
        <div className="card-play-prompt">
          {promptText}
        </div>
      )}
    </motion.div>
  );
};
