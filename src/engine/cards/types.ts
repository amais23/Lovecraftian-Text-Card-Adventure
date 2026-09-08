import type {
  Card,
  CardCategory,
  CardTier,
  CostType,
  CardKeyword,
  OccupationId,
  StatusEffect,
} from '../../types/game';

export type { CardKeyword, OccupationId };

export interface CardFilterOptions {
  tier?: CardTier;
  category?: CardCategory;
  costType?: CostType;
}

export interface CardPlayContext {
  investigator: {
    health: number;
    maxHealth: number;
    stamina: number;
    armor: number;
    statusEffects?: StatusEffect[];
    handCapacity?: number;
    occupationId?: OccupationId;
  };
  enemy: {
    health: number;
    maxHealth: number;
    armor: number;
    name: string;
    divineImmortality?: boolean;
    statusEffects?: StatusEffect[];
  };
  hand: Card[];
  sanityDeck: Card[];
  discardPile: Card[];
  turn: number;
  isMadness: boolean;
}

export interface CardPlayResult {
  success: boolean;
  reason?: string;
  investigator: {
    health: number;
    armor: number;
    stamina: number;
    statusEffects: StatusEffect[];
  };
  enemy: {
    health: number;
    armor: number;
    statusEffects: StatusEffect[];
  };
  hand: Card[];
  sanityDeck: Card[];
  discardPile: Card[];
  exhaustPile?: Card[];
  logs: string[];
  isMadness: boolean;
  combatOutcome?: 'victory' | 'defeat' | 'none';
  isTrueEnding?: boolean;
}
