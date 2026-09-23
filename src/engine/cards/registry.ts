import type { Card, CardTier, DepthLevel, OccupationId } from '../../types/game';
import type { CardFilterOptions, GenerateRewardCardsOptions } from './types';
import { fisherYatesShuffle } from '../shuffleUtils';
import { INVESTIGATOR_STARTER_CARDS } from './investigator/starter';
import { INVESTIGATOR_REWARD_CARDS } from './investigator/rewards';
import { OCCULTIST_STARTER_CARDS } from './occultist/starter';
import { OCCULTIST_REWARD_CARDS } from './occultist/rewards';
import { NEUTRAL_CARDS } from './neutral/common';
import { COMPENDIUM_MADNESS_CARDS, CARD_ABYSS_CURSE } from './special/madness';
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
  CARD_ABYSS_CURSE,
]) {
  CARDS_BY_ID.set(card.id, card);
}

/**
 * 全域階級獎勵卡牌清單 (Tier 1 ~ 4)
 * 單一真理源（Single Source of Truth），直接自各職業與中立獎勵檔案聚合
 */
const ALL_REWARD_CARDS: Card[] = [
  ...INVESTIGATOR_REWARD_CARDS,
  ...OCCULTIST_REWARD_CARDS,
  ...NEUTRAL_CARDS,
];

/**
 * 依冒險深度計算常態卡牌獎勵階級（Depth 1 -> Tier 1, Depth 2 -> Tier 2, Depth >= 3 -> Tier 3）
 */
function getRewardTierForDepth(depth: DepthLevel): CardTier {
  if (depth === 2) return 2;
  if (depth >= 3) return 3;
  return 1;
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
   * 依階級取得可用卡牌（支援可選職業過濾）
   */
  static getCardsByTier(tier: CardTier, occupationId?: OccupationId): Card[] {
    return ALL_REWARD_CARDS.filter((card) => {
      if (card.tier !== tier) return false;
      if (occupationId && card.occupations && !card.occupations.includes(occupationId)) {
        return false;
      }
      return true;
    }).map((c) => ({ ...c }));
  }

  /**
   * 取得全域所有帶有階級（Tier 1~4）的獎勵卡牌清單
   */
  static getAllTieredCards(): Card[] {
    return ALL_REWARD_CARDS.map((c) => ({ ...c }));
  }

  /**
   * 統一戰後卡牌獎勵生成（ADR-0015, ADR-0022, ADR-0031）
   * - 首領戰（isBoss）：Depth >= 2 產出全部 4 張 Tier 4+ 專屬神話卡（4 選 1）；Depth 1 產出 Tier 3 越階卡牌（3 選 1）
   * - 常態戰鬥：Depth 1 產出 Tier 1、Depth 2 產出 Tier 2、Depth >= 3 產出 Tier 3
   * - 支援 occupationId 嚴格適配過濾與 randomFn 注入
   */
  static generateRewardCards(options?: GenerateRewardCardsOptions): Card[] {
    const depth = options?.depth ?? 1;
    const isBoss = options?.isBoss ?? false;
    const randomFn = options?.randomFn ?? Math.random;
    const occupationId = options?.occupationId;

    if (isBoss && depth >= 2) {
      // 第二深度以上首領：限定產出 Tier 4+ 專屬神話卡（4 選 1，不限職業）
      const tier4Cards = ALL_REWARD_CARDS.filter((c) => c.tier === 4);
      const shuffled = fisherYatesShuffle(tier4Cards, randomFn);
      const targetCount = options?.count ?? tier4Cards.length;
      return shuffled.slice(0, Math.min(targetCount, shuffled.length)).map((c) => ({ ...c }));
    }

    // 第一深度首領越階抽取 Tier 3；常態戰鬥依深度階梯產出 (Depth 1 -> Tier 1, Depth 2 -> Tier 2, Depth >= 3 -> Tier 3)
    const targetTier: CardTier = isBoss ? 3 : getRewardTierForDepth(depth);
    const pool = CardRegistry.getCardsByTier(targetTier, occupationId);

    const targetCount = options?.count ?? Math.min(3, pool.length);
    const shuffled = fisherYatesShuffle(pool, randomFn);
    return shuffled.slice(0, Math.min(targetCount, shuffled.length)).map((c) => ({ ...c }));
  }

  /**
   * 取得指定深度與職業之常態獎勵候選卡庫池（去重）
   */
  static getRewardPool(
    occupationId: OccupationId,
    depth: DepthLevel
  ): Card[] {
    const targetTier = getRewardTierForDepth(depth);
    return CardRegistry.getCardsByTier(targetTier, occupationId);
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
export const getCardsByTier = CardRegistry.getCardsByTier;
export const getAllTieredCards = CardRegistry.getAllTieredCards;
export const generateRewardCards = CardRegistry.generateRewardCards;
export { CARD_ABYSS_CURSE };
