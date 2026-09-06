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

export type OccupationId = 'investigator' | 'occultist';

export interface Investigator {
  name: string;
  occupation: string;
  occupationId?: OccupationId;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  armor: number;
  obols: number;
}

export type MapNodeType = 'combat' | 'elite' | 'event' | 'sanctuary' | 'market' | 'boss';

export interface MapNode {
  id: string;
  type: MapNodeType;
  layer: number;
  col: number;
  label: string;
  title: string;
  description: string;
  nextNodes: string[];
  status: 'unvisited' | 'current' | 'visited' | 'accessible';
}

export type DepthLevel = 1 | 2 | 3 | 4;

export interface InvestigationMap {
  id: string;
  name: string;
  depth?: DepthLevel;
  nodes: Record<string, MapNode>;
  layers: string[][];
  currentNodeId: string | null;
  isCompleted?: boolean;
}

export interface MythosEventConsequence {
  type: 'health_change' | 'sanity_change' | 'gain_obols' | 'gain_card' | 'trigger_combat';
  value?: number;
  card?: Card;
  enemy?: Enemy;
  narrative: string;
}

export interface MythosEventOption {
  id: string;
  text: string;
  costDescription?: string;
  requires?: { obols?: number; health?: number };
  consequences: MythosEventConsequence[];
}

export interface MythosEvent {
  id: string;
  title: string;
  location: string;
  storyText: string[];
  options: MythosEventOption[];
  selectedOptionId?: string;
  resolvedOutcomeText?: string[];
}

export interface MarketItem {
  id: string;
  name: string;
  type: 'card' | 'heal';
  price: number;
  card?: Card;
  healAmount?: number;
  description: string;
  isPurchased?: boolean;
}

export interface AdventureStats {
  enemiesDefeated: number;
  totalObolsCollected: number;
  nodesVisited: number;
  maxLayer: number;
}

export interface GameState {
  phase: 'title' | 'prologue' | 'occupation_select' | 'departure' | 'map' | 'combat' | 'victory' | 'reward' | 'event' | 'sanctuary' | 'market' | 'depth_transition' | 'gameover';
  currentDepth: DepthLevel;
  turn: number;
  investigator: Investigator;
  sanityDeck: Card[]; // 牌庫剩餘數量即等同於當前理智值 (Sanity)
  hand: Card[];       // 當前手牌
  discardPile: Card[];
  isMadness: boolean;
  currentEnemy: Enemy;
  battleLog: string[];
  rewardCards?: Card[];
  rewardObols?: number;
  map?: InvestigationMap;
  currentEvent?: MythosEvent;
  sanctuaryUsed?: boolean;
  marketItems?: MarketItem[];
  adventureStats?: AdventureStats;
}

export type GameAction =
  | { type: 'START_NEW_INVESTIGATION' }
  | { type: 'COMPLETE_PROLOGUE' }
  | { type: 'COMPLETE_DEPARTURE' }
  | { type: 'SELECT_OCCUPATION'; payload: { occupationId: OccupationId; initialPhase?: GameState['phase']; procedural?: boolean; map?: InvestigationMap } }
  | { type: 'NAVIGATE_TO_NODE'; payload: { nodeId: string; shuffledDeck?: Card[] } }
  | { type: 'RESOLVE_EVENT_OPTION'; payload: { optionId: string; shuffledDeck?: Card[] } }
  | { type: 'COMPLETE_EVENT' }
  | { type: 'USE_SANCTUARY'; payload: { optionId: 'bandage' | 'meditate' } }
  | { type: 'LEAVE_SANCTUARY' }
  | { type: 'BUY_MARKET_ITEM'; payload: { itemId: string } }
  | { type: 'LEAVE_MARKET' }
  | { type: 'PROCEED_TO_REWARD'; payload?: { rewardCards?: Card[]; rewardObols?: number } }
  | { type: 'CLAIM_CARD_REWARD'; payload?: { cardId?: string; shuffledDeck?: Card[] } }
  | { type: 'COMPLETE_DEPTH_TRANSITION' }
  | { type: 'RETURN_TO_TITLE' }
  | { type: 'START_COMBAT'; payload?: { enemy?: Enemy; initialCards?: Card[]; investigator?: Investigator } }
  | { type: 'PLAY_CARD'; payload: { cardId: string } }
  | { type: 'END_TURN' }
  | { type: 'RESET_COMBAT'; payload?: { occupationId?: OccupationId; enemy?: Enemy; initialCards?: Card[] } };
