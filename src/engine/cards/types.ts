import type {
  Card,
  CardCategory,
  CardTier,
  CostType,
  DepthLevel,
  CardKeyword,
  OccupationId,
  StatusEffect,
  EnemyIntent,
  EnemyTrait,
} from '../../types/game';

export type { CardKeyword, OccupationId };

export interface CardFilterOptions {
  tier?: CardTier;
  category?: CardCategory;
  costType?: CostType;
}

export interface GenerateRewardCardsOptions {
  depth?: DepthLevel;
  isBoss?: boolean;
  count?: number;
  occupationId?: OccupationId;
  randomFn?: () => number;
}

export interface CardPlayContext {
  investigator: {
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina?: number;
    armor: number;
    statusEffects?: StatusEffect[];
    handCapacity?: number;
    occupationId?: OccupationId;
  };
  enemy: {
    id?: string;
    name: string;
    title?: string;
    health: number;
    maxHealth: number;
    armor: number;
    divineImmortality?: boolean;
    statusEffects?: StatusEffect[];
    currentIntent?: EnemyIntent;
    traits?: EnemyTrait[];
  };
  hand: Card[];
  sanityDeck: Card[];
  discardPile: Card[];
  exhaustPile?: Card[];
  turn: number;
  isMadness: boolean;
  cardsPlayedThisTurn?: number;
  randomFn?: () => number;
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
