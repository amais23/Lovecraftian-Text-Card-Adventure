import React, { useState, useMemo } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import type { Card, CardCategory } from '../types/game';
import { Swords, Shield, Sparkles, Wind, Flame, Eye } from 'lucide-react';
import { soundEngine } from '../engine/audioManager';
import type { HandFanOutTransform } from '../engine/handMath';
import { getCardArtwork } from '../engine/cardArtworks';
import {
  isAbyssalFragment,
  isAncientSealLocked,
  isAncientSealUnlocked,
  type DivineEnemyTarget,
} from '../engine/abyssalSeals';

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
  enemy?: DivineEnemyTarget;
  enemyHealth?: number;
  enemyDivineImmortality?: boolean;
  isDiscardMode?: boolean;
  isSelectedForDiscard?: boolean;
  onToggleDiscard?: (cardId: string) => void;
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
  enemy,
  enemyHealth,
  enemyDivineImmortality,
  isDiscardMode = false,
  isSelectedForDiscard = false,
  onToggleDiscard,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const targetEnemy: DivineEnemyTarget | undefined = enemy ?? (
    enemyHealth !== undefined
      ? { health: enemyHealth, divineImmortality: enemyDivineImmortality }
      : undefined
  );

  const isSealLocked = isAncientSealLocked(card, targetEnemy);
  const isSealUnlocked = isAncientSealUnlocked(card, targetEnemy);

  const isPlayable =
    !isDiscardMode &&
    !disabled &&
    !isStandalone &&
    !card.isUnplayable &&
    !isSealLocked &&
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

  const tooltip = isDiscardMode
    ? isSelectedForDiscard
      ? `【${card.name}】已選取待棄置，再次點擊取消選取`
      : `點擊選取【${card.name}】以移至棄牌堆`
    : isSealLocked
    ? `【${card.name}】封印中：舊日神性威壓依然籠罩，須將其生命值削弱至 1 點方可引動！`
    : isSealUnlocked
    ? `【神性破除】點擊或向上拖曳打出【${card.name}】，引發星穹天火終極斬殺！`
    : card.isUnplayable
    ? isAbyssalFragment(card)
      ? `【${card.name}】為深淵封印殘片，無法打出`
      : `【${card.name}】無法打出`
    : isPlayable
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
    if (isDiscardMode || isStandalone || card.isUnplayable || isSealLocked) return;
    setIsDragging(true);
    onDragStateChange?.(true);
    soundEngine.playCardHover();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isDiscardMode || isStandalone || card.isUnplayable || isSealLocked) return;
    setIsDragging(false);
    onDragStateChange?.(false);
    if (info.offset.y < -85 && isPlayable) {
      soundEngine.playCardPlay(card.category);
      onPlay?.(card.id);
    }
  };

  const handleClick = () => {
    if (isDiscardMode) {
      soundEngine.playClick();
      onToggleDiscard?.(card.id);
      return;
    }
    if (onClick) {
      onClick();
      return;
    }
    if (card.isUnplayable || isSealLocked) return;
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

  const selfDamageEffect = card.effects?.find((e) => e.type === 'self_damage');
  const tierClass = card.category === 'madness' ? 'tier-madness' : `tier-${card.tier ?? 1}`;

  return (
    <motion.div
      layout={!isStandalone}
      className={`card-item ${card.category} ${tierClass} ${
        isStandalone ? 'standalone' : isPlayable ? 'playable' : 'disabled'
      } ${isDragging ? 'dragging' : ''} ${isSealLocked ? 'seal-locked' : ''} ${
        isSealUnlocked ? 'ancient-seal-unlocked' : ''
      } ${isDiscardMode ? 'discard-mode' : ''} ${
        isSelectedForDiscard ? 'discard-selected' : ''
      }`}
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
      {/* Active Discard Mode Overlay Badge */}
      {isDiscardMode && (
        <div className={`card-discard-overlay ${isSelectedForDiscard ? 'selected' : ''}`}>
          <div className="card-discard-checkbox">
            {isSelectedForDiscard ? '✓' : ''}
          </div>
          <span className="card-discard-label">
            {isSelectedForDiscard ? '待棄置' : '點擊棄牌'}
          </span>
        </div>
      )}

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

      {/* Badges row (Temporary / Recoil / Unplayable / Seal Status) */}
      {(card.isTemporary || selfDamageEffect || card.isUnplayable || isSealLocked || isSealUnlocked) && (
        <div className="card-badges-row">
          {isSealLocked && (
            <span
              className="card-tag-badge seal-locked"
              title="須將首領生命值降至 1 點方可引動"
            >
              神性封印
            </span>
          )}
          {isSealUnlocked && (
            <span
              className="card-tag-badge seal-unlocked"
              title="神性已破除，可引動終極封滅！"
            >
              終極斬殺
            </span>
          )}
          {card.isUnplayable && (
            <span
              className="card-tag-badge unplayable"
              title={
                isAbyssalFragment(card)
                  ? '深淵封印殘片無法打出，佔據手牌卡槽'
                  : '此卡牌無法打出，佔據手牌卡槽'
              }
            >
              無法打出
            </span>
          )}
          {card.isTemporary && <span className="card-tag-badge temp">臨時</span>}
          {selfDamageEffect && (
            <span className="card-tag-badge recoil" title="打出此卡將直接扣除生命值">
              反噬 -{selfDamageEffect.value}
            </span>
          )}
        </div>
      )}

      {/* Rule Effect Description */}
      <div className="card-effect-desc" title={card.description}>{card.description}</div>

      {/* Flavor Narrative Text */}
      {card.flavorText && (
        <div className="card-flavor" title={card.flavorText}>{card.flavorText}</div>
      )}
    </motion.div>
  );
};
