import type {
  AdventureStats,
  Card,
  Enemy,
  Investigator,
  MythosEvent,
  MythosEventOption,
  OccupationId,
} from '../../types/game';

/**
 * 秘識奇遇解析器輸入快照
 * 包含後果解析所需的最小上下文，不依賴完整 GameState
 */
export interface MythosEventContext {
  investigator: Investigator;
  sanityDeck: Card[];
  hand: Card[];
  discardPile: Card[];
  /** 選項中 trigger_combat 後的牌庫洗牌排列（可選，測試時傳入固定排列） */
  shuffledDeck?: Card[];
  occupationId?: OccupationId;
  adventureStats: AdventureStats;
  /** 奇遇事件標題（用於殞命日誌） */
  eventTitle: string;
}

/**
 * 秘識奇遇解析器產出結果
 * 三種互斥終局：defeat（殞命）、combat（觸發戰鬥轉場）、resolved（一般奇遇結算）
 */
export type MythosResult =
  | {
      outcome: 'defeat';
      investigator: Investigator;
      updatedEvent: MythosEvent;
      adventureStats: AdventureStats;
      logs: string[];
    }
  | {
      outcome: 'combat';
      investigator: Investigator;
      sanityDeck: Card[];
      hand: Card[];
      discardPile: Card[];
      enemy: Enemy;
      adventureStats: AdventureStats;
      logs: string[];
    }
  | {
      outcome: 'resolved';
      investigator: Investigator;
      sanityDeck: Card[];
      hand: Card[];
      discardPile: Card[];
      updatedEvent: MythosEvent;
      adventureStats: AdventureStats;
      logs: string[];
    };

export type { MythosEvent, MythosEventOption };
