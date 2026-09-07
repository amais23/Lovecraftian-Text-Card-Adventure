import React from 'react';
import type { StatusEffect, StatusEffectType } from '../types/game';
import { Swords, Shield, AlertCircle, Droplets, Ghost } from 'lucide-react';

const STATUS_ICONS: Record<StatusEffectType, React.FC<{ size?: number; className?: string }>> = {
  might: Swords,
  resilience: Shield,
  vulnerable: AlertCircle,
  bleed: Droplets,
  horror: Ghost,
};

export interface StatusEffectBadgeProps {
  status: StatusEffect;
  iconSize?: number;
}

export const StatusEffectBadge: React.FC<StatusEffectBadgeProps> = ({
  status,
  iconSize = 13,
}) => {
  const IconComponent = STATUS_ICONS[status.type] ?? AlertCircle;

  return (
    <div
      className={`status-effect-badge status-${status.type}`}
      title={`【${status.name}】${status.stacks} 層\n${status.description}`}
    >
      <IconComponent size={iconSize} />
      <span className="status-name">{status.name}</span>
      <span className="status-stacks">{status.stacks}</span>
    </div>
  );
};
