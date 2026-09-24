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
import { isAbyssalFragment, isCompleteAncientSeal } from '../abyssalSeals';

/* =========================================================
   Domain Constants & Shared Helpers
   ========================================================= */

export const MARKET_PURGE_COST = 30;

export const DEFAULT_ALTAR_RITUALS: AltarRitual[] = [
  {
    id: 'flesh',
    name: '血肉之契 · 血肉淬鍊之誓',
    subtitle: '凡軀淬鍊',
    description:
      '以利刃割破掌心，以滾燙鮮血澆灌石刻古印。承受 6 點肉體生命值傷害，永久拓展肌體生命極限，最大生命值永久提升 5 點（並立即修補 5 點傷勢）。',
    costDescription: '承受 6 點傷害（生命須大於 6）',
    rewardDescription: '最大生命值永久 +5，並立即恢復 5 點生命值',
    iconName: 'heart',
  },
  {
    id: 'time_space',
    name: '時空之契 · 超維神經撕裂',
    subtitle: '神識拓印',
    description:
      '直視幽藍冷火中扭曲的超維幾何裂隙，忍受精神重創。可自主選擇承受 10 點生命值代價或損耗 2 點理智（自牌庫永久除役 2 張卡牌），永久拓展心智容量，手牌容量永久 +1（抽牌與保留手牌數同步提升 1 張）。',
    costDescription: '承受 10 點傷害（生命須大於 10）或損耗 2 點理智（除役 2 張牌）',
    rewardDescription: '手牌容量永久 +1（抽牌與保留手牌數提升 1 張）',
    iconName: 'book',
  },
  {
    id: 'void',
    name: '虛空之契 · 深淵恩賜喚引',
    subtitle: '隱密秘寶',
    description:
      '將鮮血浸入太古符文槽，自虛空裂隙中喚醒一件古老之物。承受 6 點生命值傷害，隨機獲取 1 件未持有的舊日遺物納入行囊（若已全數持有則獲取 35 枚古金幣）。',
    costDescription: '承受 6 點傷害（生命須大於 6）',
    rewardDescription: '隨機獲得 1 件未持有的舊日遺物（若全持有則獲得 35 枚古金幣）',
    iconName: 'sparkles',
  },
];

export function getDefaultAltarRituals(): AltarRitual[] {
  return [...DEFAULT_ALTAR_RITUALS];
}

/**
 * 判斷卡牌是否可供後繼調查員傳承繼承
 * 排除臨時卡、無法打出的卡牌、深淵封印殘片與完整的深淵古印
 */
export function isInheritableCard(card: Card): boolean {
  if (!card) return false;
  if (card.isTemporary) return false;
  if (card.isUnplayable) return false;
  if (isAbyssalFragment(card)) return false;
  if (isCompleteAncientSeal(card)) return false;
  return true;
}

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
  timestamp?: number;
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
