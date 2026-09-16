import type {
  Card,
  DepthLevel,
  InvestigationMap,
  Investigator,
  MapNodeType,
  OccupationId,
} from '../../types/game';

/**
 * 調查員於戰後結算時所採取的生存抉擇 (ADR-0023, ADR-0030)
 */
export type SurvivalChoice =
  | { type: 'card'; cardId?: string; card?: Card }
  | { type: 'field_dressing'; healAmount?: number }
  | { type: 'abyssal_seal' }
  | { type: 'skip' };

/**
 * 戰後生存結算輸入快照
 */
export interface SurvivalSettlementContext {
  investigator: Investigator;
  currentCards: Card[];
  currentNodeType?: MapNodeType;
  currentDepth: DepthLevel;
  abyssalSealFused?: boolean;
  rewardObols?: number;
  map?: InvestigationMap;
  shuffledDeck?: Card[];
}

/**
 * 戰後生存結算產出契約
 */
export interface SurvivalSettlementResult {
  investigator: Investigator;
  sanityDeck: Card[];
  hand: Card[];
  discardPile: Card[];
  isMadness: boolean;
  map?: InvestigationMap;
  nextPhase: 'map' | 'depth_transition' | 'combat';
  isTrueEnding: boolean;
  clearFallenRecord: boolean;
  logs: string[];
  addedObols: number;
}

/**
 * 戰鬥獎勵生成輸入快照
 */
export interface CombatRewardContext {
  currentNodeType?: MapNodeType;
  currentDepth: DepthLevel;
  occupationId?: OccupationId;
  currentCards: Card[];
  overrideCards?: Card[];
  overrideObols?: number;
}

/**
 * 戰鬥獎勵生成產出契約
 */
export interface CombatRewardResult {
  rewardCards: Card[];
  rewardObols: number;
  abyssalSealFused?: boolean;
  updatedDeck?: Card[];
  logs: string[];
}
