import type { Card, CardCategory } from '../types/game';
import {
  INVESTIGATOR_DECK,
  OCCULTIST_DECK,
  REWARD_CARD_POOL,
} from './initialData';
import { MADNESS_CARD_TEMPLATES, TRUTH_INJECTED_TEMPLATE } from './cardFactory';

/**
 * 完整典藏卡牌清單 (Card Compendium Catalog)
 * 收錄遊戲中所有 26 張獨立卡牌原型
 */
const CARD_COMPENDIUM_REGISTRY: Card[] = (() => {
  const seenNames = new Set<string>();
  const catalog: Card[] = [];

  const addUnique = (card: Card) => {
    if (!seenNames.has(card.name)) {
      seenNames.add(card.name);
      catalog.push({ ...card });
    }
  };

  // 1. 調查員起始牌組
  for (const card of INVESTIGATOR_DECK) {
    addUnique(card);
  }

  // 2. 秘術學者起始牌組
  for (const card of OCCULTIST_DECK) {
    addUnique(card);
  }

  // 3. 戰後與商人獎勵牌庫
  for (const card of REWARD_CARD_POOL) {
    addUnique(card);
  }

  // 4. 黑色瘋狂卡模板
  const madnessIds = ['compendium_madness_claw', 'compendium_madness_howl', 'compendium_madness_blade'];
  MADNESS_CARD_TEMPLATES.forEach((template, index) => {
    addUnique({
      ...template,
      id: madnessIds[index] ?? `compendium_madness_${index}`,
    });
  });

  // 5. 白色真相注入卡模板
  addUnique({
    ...TRUTH_INJECTED_TEMPLATE,
    id: 'compendium_truth_glimmer',
  });

  return catalog;
})();

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
 * 取得卡牌圖鑑各分類統計數據
 */
export function getCardCatalogStats(): CardCatalogStats {
  return {
    combat: CARD_COMPENDIUM_REGISTRY.filter((c) => c.category === 'combat').length,
    skill: CARD_COMPENDIUM_REGISTRY.filter((c) => c.category === 'skill').length,
    magic: CARD_COMPENDIUM_REGISTRY.filter((c) => c.category === 'magic').length,
    truth: CARD_COMPENDIUM_REGISTRY.filter((c) => c.category === 'truth').length,
    madness: CARD_COMPENDIUM_REGISTRY.filter((c) => c.category === 'madness').length,
    total: CARD_COMPENDIUM_REGISTRY.length,
  };
}
