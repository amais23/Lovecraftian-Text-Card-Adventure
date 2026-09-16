import type { Card, Enemy, Investigator } from '../../types/game';

/**
 * 戰鬥回合結束結算輸入快照
 * 包含結算敵怪意圖、狀態印記、理智牌庫與抽牌所需之全部最小上下文
 */
export interface CombatTurnContext {
  investigator: Investigator;
  enemy: Enemy;
  turn: number;
  retainedHand: Card[];
  sanityDeck: Card[];
  discardPile: Card[];
  exhaustPile?: Card[];
  isMadness: boolean;
  cardsPlayedThisTurn?: number;
  handCapacity?: number;
  initialLogs?: string[];
}

/**
 * 戰鬥回合結束結算產出結果
 * 輸出無副作用之更新數值、抽牌結果、對戰終局狀態與敘事日誌
 */
export interface CombatTurnResult {
  outcome: 'ongoing' | 'victory' | 'defeat';
  turn: number;
  investigator: Investigator;
  enemy: Enemy;
  hand: Card[];
  sanityDeck: Card[];
  discardPile: Card[];
  exhaustPile?: Card[];
  isMadness: boolean;
  logs: string[];
  drawnCardsCount: number;
}

/**
 * 戰鬥啟動初始化輸入快照
 */
export interface CombatInitContext {
  enemy?: Enemy;
  deck?: Card[];
  investigator?: Investigator;
  handCapacity?: number;
  overrideDeck?: Card[];
}

/**
 * 戰鬥啟動初始化產出結果
 */
export interface CombatInitResult {
  investigator: Investigator;
  enemy: Enemy;
  hand: Card[];
  sanityDeck: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  isMadness: boolean;
  logs: string[];
  turn: number;
}
