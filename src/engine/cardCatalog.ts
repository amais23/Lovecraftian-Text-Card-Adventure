import type { Card, CardCategory } from '../types/game';
import { CardRegistry } from './cards/registry';

/**
 * 完整典藏卡牌清單 (Card Compendium Catalog)
 * 收錄遊戲中所有 50 張獨立卡牌原型，委託 CardRegistry 提供單一資料源
 */
const CARD_COMPENDIUM_REGISTRY: Card[] = CardRegistry.getAllCompendiumCards();

/**
 * 取得卡牌圖鑑所有卡牌
 */
export function getCardCatalog(): Card[] {
  return [...CARD_COMPENDIUM_REGISTRY];
}

/**
 * 依照五色類別過濾卡牌
 */
export function getCardsByCategory(category: CardCategory): Card[] {
  return CARD_COMPENDIUM_REGISTRY.filter((c) => c.category === category);
}

export interface CardCatalogStats {
  combat: number;
  skill: number;
  magic: number;
  truth: number;
  madness: number;
  total: number;
}

/**
 * 預先計算並快取卡牌圖鑑各分類統計數據
 */
const CARD_COMPENDIUM_STATS: CardCatalogStats = (() => {
  const stats: CardCatalogStats = {
    combat: 0,
    skill: 0,
    magic: 0,
    truth: 0,
    madness: 0,
    total: CARD_COMPENDIUM_REGISTRY.length,
  };
  for (const card of CARD_COMPENDIUM_REGISTRY) {
    stats[card.category]++;
  }
  return stats;
})();

/**
 * 取得卡牌圖鑑各分類統計數據
 */
export function getCardCatalogStats(): CardCatalogStats {
  return { ...CARD_COMPENDIUM_STATS };
}

export interface CardCostDisplay {
  shortText: string;
  detailLabel: string;
  detailValue: string;
}

/**
 * 統一格式化卡牌消耗資訊（支援清單簡短標籤與詳情檢視面板）
 */
export function getCardCostDisplay(
  costType: Card['costType'],
  costValue: number
): CardCostDisplay {
  if (costType === 'free') {
    return {
      shortText: '免費',
      detailLabel: '消耗：',
      detailValue: '免費',
    };
  }
  if (costType === 'sanity') {
    return {
      shortText: `理智 ${costValue}`,
      detailLabel: '理智消耗：',
      detailValue: String(costValue),
    };
  }
  if (costValue === 0) {
    return {
      shortText: '0 精力 (免費)',
      detailLabel: '精力消耗：',
      detailValue: '0 (免費)',
    };
  }
  return {
    shortText: `${costValue} 精力`,
    detailLabel: '精力消耗：',
    detailValue: String(costValue),
  };
}
