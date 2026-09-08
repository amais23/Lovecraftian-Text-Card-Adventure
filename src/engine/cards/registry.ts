import type { Card, CardTier, DepthLevel, OccupationId } from '../../types/game';
import type { CardFilterOptions } from './types';
import { INVESTIGATOR_STARTER_CARDS } from './investigator/starter';
import { INVESTIGATOR_REWARD_CARDS } from './investigator/rewards';
import { OCCULTIST_STARTER_CARDS } from './occultist/starter';
import { OCCULTIST_REWARD_CARDS } from './occultist/rewards';
import { NEUTRAL_CARDS } from './neutral/common';
import { COMPENDIUM_MADNESS_CARDS } from './special/madness';
import { COMPENDIUM_TRUTH_CARDS } from './special/truth';
import { ALL_ABYSSAL_CARDS } from './special/abyssal';

/**
 * 典藏卡牌清單 (Card Compendium Registry)
 * 嚴格收錄遊戲中全部 50 張獨立不重複之卡牌原型
 */
const CANONICAL_COMPENDIUM: Card[] = (() => {
  const seenNames = new Set<string>();
  const catalog: Card[] = [];

  const addUnique = (card: Card) => {
    if (!seenNames.has(card.name)) {
      seenNames.add(card.name);
      catalog.push({ ...card });
    }
  };

  // 1. 調查員起始卡
  for (const card of INVESTIGATOR_STARTER_CARDS) {
    addUnique(card);
  }

  // 2. 秘術學者起始卡
  for (const card of OCCULTIST_STARTER_CARDS) {
    addUnique(card);
  }

  // 3. 一階獎勵卡 (Tier 1 Rewards: 包含偵探、學者與中立)
  const tier1Rewards = [
    ...INVESTIGATOR_REWARD_CARDS.filter((c) => c.tier === 1),
    ...OCCULTIST_REWARD_CARDS.filter((c) => c.tier === 1),
    ...NEUTRAL_CARDS.filter((c) => c.tier === 1),
  ];
  for (const card of tier1Rewards) {
    addUnique(card);
  }

  // 4. 黑色瘋狂卡模板
  for (const card of COMPENDIUM_MADNESS_CARDS) {
    addUnique(card);
  }

  // 5. 白色真相注入卡模板
  for (const card of COMPENDIUM_TRUTH_CARDS) {
    addUnique(card);
  }

  // 6. 二階獎勵卡 (Tier 2)
  const tier2Cards = [
    ...INVESTIGATOR_REWARD_CARDS.filter((c) => c.tier === 2),
    ...OCCULTIST_REWARD_CARDS.filter((c) => c.tier === 2),
    ...NEUTRAL_CARDS.filter((c) => c.tier === 2),
  ];
  for (const card of tier2Cards) {
    addUnique(card);
  }

  // 7. 三階獎勵卡 (Tier 3)
  const tier3Cards = [
    ...INVESTIGATOR_REWARD_CARDS.filter((c) => c.tier === 3),
    ...OCCULTIST_REWARD_CARDS.filter((c) => c.tier === 3),
    ...NEUTRAL_CARDS.filter((c) => c.tier === 3),
  ];
  for (const card of tier3Cards) {
    addUnique(card);
  }

  // 8. 四階首領專屬卡 (Tier 4 Exclusive)
  const tier4Cards = [
    ...INVESTIGATOR_REWARD_CARDS.filter((c) => c.tier === 4),
    ...OCCULTIST_REWARD_CARDS.filter((c) => c.tier === 4),
    ...NEUTRAL_CARDS.filter((c) => c.tier === 4),
  ];
  for (const card of tier4Cards) {
    addUnique(card);
  }

  // 9. 深淵殘片與古印
  for (const card of ALL_ABYSSAL_CARDS) {
    addUnique(card);
  }

  return catalog;
})();

/**
 * 快取全域卡牌索引以達成 O(1) 檢索
 */
const CARDS_BY_ID = new Map<string, Card>();

// 預先註冊所有可能出現的卡牌（包含不同副本 ID 的起始卡牌）
for (const card of [
  ...CANONICAL_COMPENDIUM,
  ...INVESTIGATOR_STARTER_CARDS,
  ...OCCULTIST_STARTER_CARDS,
  ...INVESTIGATOR_REWARD_CARDS,
  ...OCCULTIST_REWARD_CARDS,
  ...NEUTRAL_CARDS,
  ...ALL_ABYSSAL_CARDS,
]) {
  CARDS_BY_ID.set(card.id, card);
}

/**
 * 深度模組：CardRegistry
 * 集中封裝卡牌庫查詢、職業過濾、獎勵池計算與圖鑑檢索
 */
export class CardRegistry {
  /**
   * 取得卡牌圖鑑全部 50 張不重複卡牌
   */
  static getAllCompendiumCards(): Card[] {
    return CANONICAL_COMPENDIUM.map((c) => ({ ...c }));
  }

  /**
   * 取得特定職業之起始牌組
   */
  static getStarterDeck(occupationId: OccupationId): Card[] {
    if (occupationId === 'investigator') {
      return INVESTIGATOR_STARTER_CARDS.map((c) => ({ ...c }));
    }
    if (occupationId === 'occultist') {
      return OCCULTIST_STARTER_CARDS.map((c) => ({ ...c }));
    }
    return [];
  }

  /**
   * 依照職業與篩選條件取得可用卡牌清單
   */
  static getCardsForOccupation(
    occupationId: OccupationId,
    options?: CardFilterOptions
  ): Card[] {
    return CANONICAL_COMPENDIUM.filter((card) => {
      // 檢查職業相容性：若無宣告 occupations 或 occupations 包含該職業
      if (card.occupations && !card.occupations.includes(occupationId)) {
        return false;
      }
      if (options?.tier !== undefined && card.tier !== options.tier) {
        return false;
      }
      if (options?.category !== undefined && card.category !== options.category) {
        return false;
      }
      if (options?.costType !== undefined && card.costType !== options.costType) {
        return false;
      }
      return true;
    }).map((c) => ({ ...c }));
  }

  /**
   * 取得指定深度與職業之獎勵卡庫池
   */
  static getRewardPool(
    occupationId: OccupationId,
    depth: DepthLevel
  ): Card[] {
    // 依據深度篩選相應階級
    let allowedTiers: CardTier[] = [1];
    if (depth === 1) {
      allowedTiers = [1, 2];
    } else if (depth === 2) {
      allowedTiers = [1, 2, 3];
    } else if (depth === 3) {
      allowedTiers = [2, 3, 4];
    } else if (depth === 4) {
      allowedTiers = [3, 4];
    }

    const allRewardCandidates = [
      ...INVESTIGATOR_REWARD_CARDS,
      ...OCCULTIST_REWARD_CARDS,
      ...NEUTRAL_CARDS,
    ];

    const pool = allRewardCandidates.filter((card) => {
      if (card.occupations && !card.occupations.includes(occupationId)) {
        return false;
      }
      if (card.tier && !allowedTiers.includes(card.tier)) {
        return false;
      }
      return true;
    });

    // 去重回傳
    const seenNames = new Set<string>();
    const uniquePool: Card[] = [];
    for (const card of pool) {
      if (!seenNames.has(card.name)) {
        seenNames.add(card.name);
        uniquePool.push({ ...card });
      }
    }
    return uniquePool;
  }

  /**
   * 依 ID 取得卡牌原型
   */
  static getCardById(id: string): Card | undefined {
    const card = CARDS_BY_ID.get(id);
    return card ? { ...card } : undefined;
  }
}

// 同步導出獨立函數介面，方便直接引入使用
export const getAllCompendiumCards = CardRegistry.getAllCompendiumCards;
export const getStarterDeck = CardRegistry.getStarterDeck;
export const getCardsForOccupation = CardRegistry.getCardsForOccupation;
export const getRewardPool = CardRegistry.getRewardPool;
export const getCardById = CardRegistry.getCardById;
