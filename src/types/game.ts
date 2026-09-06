export type CardCategory = 'combat' | 'skill' | 'magic' | 'truth' | 'madness';
export type CostType = 'stamina' | 'sanity' | 'free';

export interface CardEffect {
  type: 'damage' | 'armor' | 'heal' | 'draw' | 'erode_sanity' | 'restore_sanity' | 'self_damage' | 'add_to_deck';
  value: number;
}

export interface Card {
  id: string;
  name: string;
  category: CardCategory;
  costType: CostType;
  costValue: number;
  isTemporary: boolean;
  effects: CardEffect[];
  description: string;
  flavorText: string;
}

export type EnemyIntentType = 'attack' | 'erode' | 'defend';

export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
  name: string;
  description: string;
}

export interface Enemy {
  id: string;
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  armor: number;
  currentIntent: EnemyIntent;
  intentSequence?: EnemyIntent[];
  currentIntentIndex?: number;
}

export interface Investigator {
  name: string;
  occupation: string;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  armor: number;
  obols: number;
}

export interface GameState {
  phase: 'combat' | 'victory' | 'gameover';
  turn: number;
  investigator: Investigator;
  sanityDeck: Card[]; // 牌庫剩餘數量即等同於當前理智值 (Sanity)
  hand: Card[];       // 當前手牌
  discardPile: Card[];
  isMadness: boolean;
  currentEnemy: Enemy;
  battleLog: string[];
}

export type GameAction =
  | { type: 'START_COMBAT'; payload?: { enemy?: Enemy; initialCards?: Card[] } }
  | { type: 'PLAY_CARD'; payload: { cardId: string } }
  | { type: 'END_TURN' }
  | { type: 'RESET_COMBAT' };
