import type {
  AdventureStats,
  AltarRitual,
  AltarRitualId,
  Card,
  DepthLevel,
  FallenInvestigatorRecord,
  GameState,
  Investigator,
  InvestigationMap,
  MapNode,
  MapNodeType,
  MarketItem,
  OccupationId,
  Relic,
} from '../../types/game';

/* =========================================================
   Node Entry Types
   ========================================================= */

export interface NodeEntryContext {
  depth: DepthLevel;
  occupationId?: OccupationId;
  investigatorRelicIds?: string[];
  fallenInvestigator?: FallenInvestigatorRecord | null;
  randomFn?: () => number;
}

export interface NodeEntryResult {
  nodeStateUpdates: Partial<GameState>;
  log: string;
}

/* =========================================================
   Node Action & Interaction Types
   ========================================================= */

export type NodeInteractionAction =
  | { type: 'USE_SANCTUARY'; payload: { optionId: 'bandage' | 'meditate' | 'purge'; cardId?: string } }
  | { type: 'BUY_MARKET_ITEM'; payload: { itemId: string } }
  | { type: 'PURGE_CARD_AT_MARKET'; payload: { cardId: string } }
  | { type: 'USE_ALTAR'; payload: { optionId: AltarRitualId; costType?: 'health' | 'sanity'; cardId?: string } }
  | { type: 'CLAIM_VAULT_RELIC'; payload: { relicId?: string; relicIds?: string[]; desecrate?: boolean; claimObols?: boolean } }
  | { type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR'; payload: { cardIds: string[]; branch?: 'pure' | 'reshape' } }
  | { type: 'INHERIT_REMAINS'; payload: { type: 'card'; cardId: string } | { type: 'obols' } };

export interface NodeInteractionContext {
  investigator: Investigator;
  sanityDeck: Card[];
  currentNode?: MapNode;
  currentDepth?: DepthLevel;
  turn?: number;
  adventureStats?: AdventureStats;
  randomFn?: () => number;
  // Node-specific transient states
  marketItems?: MarketItem[];
  marketPurgeUsed?: boolean;
  altarUsed?: boolean;
  altarRituals?: AltarRitual[];
  vaultRelics?: Relic[];
  vaultClaimed?: boolean;
  bloodAltarUsed?: boolean;
  fallenInvestigator?: FallenInvestigatorRecord | null;
  remainsClaimed?: boolean;
  sanctuaryUsed?: boolean;
}

export interface NodeActionResult {
  success: boolean;
  investigator: Investigator;
  sanityDeck: Card[];
  nodeStateUpdates: Partial<GameState>;
  adventureStatsUpdate?: Partial<AdventureStats>;
  clearFallenRecord?: boolean;
  logs: string[];
}

/* =========================================================
   Node Leave Types
   ========================================================= */

export interface NodeLeaveContext {
  phase: MapNodeType | string;
  map?: InvestigationMap;
}

export interface NodeLeaveResult {
  map?: InvestigationMap;
  nodeStateCleans: Partial<GameState>;
  clearFallenRecord?: boolean;
  logs: string[];
}
