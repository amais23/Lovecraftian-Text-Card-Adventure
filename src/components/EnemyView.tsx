import React, { useState, useEffect } from 'react';
import type { Enemy, EnemyIntent } from '../types/game';
import {
  Skull,
  Swords,
  Shield,
  Brain,
  AlertCircle,
  Flame,
  Feather,
  Fish,
  Droplets,
  Ghost,
  Eye,
  Bird,
  Layers,
  Compass,
  Moon,
  ShieldAlert,
  Crown,
} from 'lucide-react';
import { useTraumaShake } from '../hooks/useTraumaShake';
import { useSanityFlicker } from '../hooks/useSanityFlicker';
import { getActiveEnemyIllustration } from '../engine/enemyArtworks';
import { StatusEffectBadge } from './StatusEffectBadge';

function formatIntentValue(intent: EnemyIntent): string {
  if (intent.type === 'erode') {
    return `侵蝕 ${intent.value}`;
  }
  if (intent.type === 'defend') {
    return `護甲 +${intent.value}`;
  }
  if (intent.type === 'apply_status') {
    return `印記 +${intent.value}`;
  }
  return `${intent.value}`;
}

function renderIntentIcon(intent: EnemyIntent) {
  if (intent.type === 'attack') return <Swords size={18} />;
  if (intent.type === 'defend') return <Shield size={18} />;
  if (intent.type === 'erode') return <Brain size={18} />;
  if (intent.type === 'apply_status') {
    if (intent.statusType === 'bleed') return <Droplets size={18} className="intent-status-icon bleed" />;
    if (intent.statusType === 'horror') return <Ghost size={18} className="intent-status-icon horror" />;
    if (intent.statusType === 'vulnerable') return <AlertCircle size={18} className="intent-status-icon vulnerable" />;
    return <AlertCircle size={18} />;
  }
  return <Swords size={18} />;
}

function renderEnemyAvatarIcon(enemy: Enemy) {
  const category = enemy.category;
  switch (category) {
    case 'cultist':
      return <Flame className="enemy-avatar-icon icon-cultist" data-testid="enemy-icon-cultist" />;
    case 'ghoul':
      return <Skull className="enemy-avatar-icon icon-ghoul" data-testid="enemy-icon-ghoul" />;
    case 'nightgaunt':
      return <Feather className="enemy-avatar-icon icon-nightgaunt" data-testid="enemy-icon-nightgaunt" />;
    case 'deep_one':
      return <Fish className="enemy-avatar-icon icon-deep_one" data-testid="enemy-icon-deep_one" />;
    case 'drowned':
      return <Droplets className="enemy-avatar-icon icon-drowned" data-testid="enemy-icon-drowned" />;
    case 'shoggoth':
      return <Eye className="enemy-avatar-icon icon-shoggoth" data-testid="enemy-icon-shoggoth" />;
    case 'byakhee':
      return <Bird className="enemy-avatar-icon icon-byakhee" data-testid="enemy-icon-byakhee" />;
    case 'formless':
      return <Layers className="enemy-avatar-icon icon-formless" data-testid="enemy-icon-formless" />;
    case 'hound':
      return <Compass className="enemy-avatar-icon icon-hound" data-testid="enemy-icon-hound" />;
    case 'star_spawn':
      return <Moon className="enemy-avatar-icon icon-star_spawn" data-testid="enemy-icon-star_spawn" />;
    case 'ancient_guardian':
      return <ShieldAlert className="enemy-avatar-icon icon-ancient_guardian" data-testid="enemy-icon-ancient_guardian" />;
    case 'boss':
      return <Crown className="enemy-avatar-icon icon-boss" data-testid="enemy-icon-boss" />;
    default:
      return <Skull className="enemy-avatar-icon icon-default" data-testid="enemy-icon-default" />;
  }
}

export interface EnemyViewProps {
  enemy: Enemy;
  isMadness?: boolean;
  sanityCount?: number;
}

export const EnemyView: React.FC<EnemyViewProps> = ({
  enemy,
  isMadness = false,
  sanityCount = 10,
}) => {
  const { isShaking, shakeKey } = useTraumaShake(enemy.health);
  const { isFlickering, flickerKey } = useSanityFlicker(sanityCount);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const illustrationUrl = getActiveEnemyIllustration(enemy, {
    isMadness,
    isFlickering,
  });

  useEffect(() => {
    setImageFailed(false);
  }, [enemy.id, illustrationUrl]);

  const healthPercent = Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100));
  const statusEffects = enemy.statusEffects ?? [];
  const statusClass = enemy.currentIntent.statusType ? `status-${enemy.currentIntent.statusType}` : '';

  return (
    <div className="enemy-stage">
      {/* Intent Bubble */}
      <div
        className={`enemy-intent-bubble ${enemy.currentIntent.type} ${statusClass}`}
        title={enemy.currentIntent.description}
      >
        <span className="intent-icon">
          {renderIntentIcon(enemy.currentIntent)}
        </span>
        <span className="intent-name">{enemy.currentIntent.name}</span>
        <span className="intent-val">{formatIntentValue(enemy.currentIntent)}</span>
      </div>

      {/* Enemy Visual Portrait Stage with Core Safe Area (ADR-0021) */}
      <div
        key={`enemy-portrait-${shakeKey}-${flickerKey}`}
        className={`enemy-portrait-stage enemy-category-${enemy.category ?? 'default'} ${isShaking ? 'trauma-shake' : ''} ${isFlickering ? 'is-flickering' : ''}`}
        data-testid="enemy-portrait-stage"
      >
        <div
          className={`enemy-ambient-glow glow-${enemy.category ?? 'default'}`}
          data-testid="enemy-ambient-glow"
        />
        <div className="enemy-safe-area" data-testid="enemy-safe-area">
          {illustrationUrl && !imageFailed ? (
            <img
              src={illustrationUrl}
              alt={enemy.name}
              className={`enemy-portrait-img ${isFlickering ? 'perception-flickering' : ''} ${isMadness ? 'state-madness' : 'state-normal'}`}
              data-testid="enemy-portrait-image"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className="enemy-avatar-wrapper"
              data-testid="enemy-avatar-wrapper"
            >
              <div className={`enemy-avatar-circle enemy-avatar-${enemy.category ?? 'default'}`}>
                {renderEnemyAvatarIcon(enemy)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enemy Identity */}
      <div className="enemy-name">{enemy.name}</div>
      <div className="enemy-title">{enemy.title}</div>

      {/* Status Effects List */}
      {statusEffects.length > 0 && (
        <div className="status-effects-list enemy-statuses" data-testid="enemy-status-effects">
          {statusEffects.map((status) => (
            <StatusEffectBadge key={status.type} status={status} iconSize={12} />
          ))}
        </div>
      )}

      {/* Health Bar */}
      <div
        key={`enemy-health-${shakeKey}`}
        className={`enemy-health-container ${isShaking ? 'trauma-shake' : ''}`}
      >
        <div className="enemy-health-meta">
          <span>生命值</span>
          <span>
            {enemy.health} / {enemy.maxHealth}
            {enemy.armor > 0 && ` (護甲 +${enemy.armor})`}
          </span>
        </div>
        <div className="enemy-health-bar-bg">
          <div
            className="enemy-health-bar-fill"
            style={{ width: `${healthPercent}%` }}
          />
        </div>
      </div>

      {/* Eldritch Trait Badges (Issue #47 / ADR-0026) */}
      {enemy.traits && enemy.traits.length > 0 && (
        <div className="enemy-traits-list" data-testid="enemy-traits-list">
          {enemy.traits.map((trait) => (
            <div
              key={trait.id}
              className="enemy-trait-badge"
              data-testid={`trait-badge-${trait.id}`}
              title={`【原著特質：${trait.name}】\n${trait.description}`}
            >
              <span className="trait-dot" />
              <span className="trait-name">{trait.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Shoggoth Stance Indicator */}
      {enemy.shoggothStance === 'charging' && (
        <div
          className="shoggoth-stance-badge charging"
          data-testid="shoggoth-charging-badge"
          title="蓄力破綻：承受卡牌傷害增加 50%"
        >
          ⚠️ Tekeli-li 蓄力中（承受傷害 +50%）
        </div>
      )}
    </div>
  );
};


