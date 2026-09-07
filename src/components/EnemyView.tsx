import React from 'react';
import type { Enemy, EnemyIntent } from '../types/game';
import { Skull, Swords, Shield, Brain, AlertCircle } from 'lucide-react';
import { useTraumaShake } from '../hooks/useTraumaShake';
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

interface EnemyViewProps {
  enemy: Enemy;
}

export const EnemyView: React.FC<EnemyViewProps> = ({ enemy }) => {
  const { isShaking, shakeKey } = useTraumaShake(enemy.health);
  const healthPercent = Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100));
  const statusEffects = enemy.statusEffects ?? [];

  return (
    <div className="enemy-stage">
      {/* Intent Bubble */}
      <div className={`enemy-intent-bubble ${enemy.currentIntent.type}`} title={enemy.currentIntent.description}>
        <span className="intent-icon">
          {enemy.currentIntent.type === 'attack' && <Swords size={18} />}
          {enemy.currentIntent.type === 'defend' && <Shield size={18} />}
          {enemy.currentIntent.type === 'erode' && <Brain size={18} />}
          {enemy.currentIntent.type === 'apply_status' && <AlertCircle size={18} />}
        </span>
        <span className="intent-name">{enemy.currentIntent.name}</span>
        <span className="intent-val">{formatIntentValue(enemy.currentIntent)}</span>
      </div>

      {/* Enemy Visual Avatar */}
      <div
        key={`enemy-avatar-${shakeKey}`}
        className={`enemy-avatar-wrapper ${isShaking ? 'trauma-shake' : ''}`}
      >
        <div className="enemy-avatar-circle">
          <Skull className="enemy-avatar-icon" />
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
    </div>
  );
};


