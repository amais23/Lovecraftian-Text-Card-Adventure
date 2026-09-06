import React, { useState, useEffect, useRef } from 'react';
import type { Enemy, EnemyIntent } from '../types/game';
import { Skull, Swords, Shield, Brain } from 'lucide-react';

function formatIntentValue(intent: EnemyIntent): string {
  if (intent.type === 'erode') {
    return `侵蝕 ${intent.value}`;
  }
  if (intent.type === 'defend') {
    return `護甲 +${intent.value}`;
  }
  return `${intent.value}`;
}

interface EnemyViewProps {
  enemy: Enemy;
}

export const EnemyView: React.FC<EnemyViewProps> = ({ enemy }) => {
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const prevHealthRef = useRef<number>(enemy.health);
  const healthPercent = Math.max(0, Math.min(100, (enemy.health / enemy.maxHealth) * 100));

  useEffect(() => {
    if (enemy.health < prevHealthRef.current) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 450);
      prevHealthRef.current = enemy.health;
      return () => clearTimeout(timer);
    }
    prevHealthRef.current = enemy.health;
  }, [enemy.health]);

  return (
    <div className="enemy-stage">
      {/* Intent Bubble */}
      <div className={`enemy-intent-bubble ${enemy.currentIntent.type}`} title={enemy.currentIntent.description}>
        <span className="intent-icon">
          {enemy.currentIntent.type === 'attack' && <Swords size={18} />}
          {enemy.currentIntent.type === 'defend' && <Shield size={18} />}
          {enemy.currentIntent.type === 'erode' && <Brain size={18} />}
        </span>
        <span className="intent-name">{enemy.currentIntent.name}</span>
        <span className="intent-val">{formatIntentValue(enemy.currentIntent)}</span>
      </div>

      {/* Enemy Visual Avatar */}
      <div className={`enemy-avatar-wrapper ${isShaking ? 'trauma-shake' : ''}`}>
        <div className="enemy-avatar-circle">
          <Skull className="enemy-avatar-icon" />
        </div>
      </div>

      {/* Enemy Identity */}
      <div className="enemy-name">{enemy.name}</div>
      <div className="enemy-title">{enemy.title}</div>

      {/* Health Bar */}
      <div className={`enemy-health-container ${isShaking ? 'trauma-shake' : ''}`}>
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

