import type { DepthLevel, MarketItem, OccupationId, Relic } from '../types/game';
import { CardRegistry } from './cards/registry';
import { PRESET_RELICS } from './relics';
import { fisherYatesShuffle } from './shuffleUtils';

export const MARKET_PURGE_COST = 30;

export interface GenerateMarketItemsOptions {
  ownedRelicIds?: string[];
  randomFn?: () => number;
}

export const DEPTH_MEDICAL_SUPPLIES: Record<
  number,
  Array<{ id: string; name: string; price: number; healAmount: number; description: string; artworkUrl: string }>
> = {
  1: [
    {
      id: 'market_item_morphine',
      name: '軍用嗎啡注射劑',
      price: 15,
      healAmount: 8,
      description: '戰地急救藥品，立即恢復 8 點肉體生命值（受最大生命值限制）。',
      artworkUrl: '/supplies/supply_morphine.png',
    },
    {
      id: 'market_item_alcohol',
      name: '高純度酒精繃帶',
      price: 10,
      healAmount: 5,
      description: '簡易消毒止血用品，立即恢復 5 點肉體生命值。',
      artworkUrl: '/supplies/supply_alcohol_gauze.png',
    },
  ],
  2: [
    {
      id: 'market_item_surgery_kit_d2',
      name: '高級戰地醫療箱',
      price: 22,
      healAmount: 12,
      description: '專業外科縫合工具與抗生素，立即恢復 12 點肉體生命值。',
      artworkUrl: '/supplies/supply_surgery_kit.png',
    },
    {
      id: 'market_item_antidote_serum_d2',
      name: '深海抗逆血清',
      price: 18,
      healAmount: 8,
      description: '提取自深潛者分泌物的解毒血清，立即恢復 8 點生命值。',
      artworkUrl: '/supplies/supply_antidote_serum.png',
    },
  ],
  3: [
    {
      id: 'market_item_revival_injection_d3',
      name: '禁忌復甦針劑',
      price: 30,
      healAmount: 16,
      description: '注入強心劑與太古活性液體，瞬間恢復 16 點肉體生命值。',
      artworkUrl: '/supplies/supply_revival_injection.png',
    },
    {
      id: 'market_item_sanctified_elixir_d3',
      name: '聖所聖水金樽',
      price: 26,
      healAmount: 10,
      description: '盛放在純金酒樽中的驅邪聖水，立即恢復 10 點生命值。',
      artworkUrl: '/supplies/supply_sanctified_elixir.png',
    },
  ],
};

export function getRelicPrice(relic: Relic): number {
  switch (relic.rarity) {
    case 'mythic':
      return 50;
    case 'rare':
      return 38;
    case 'common':
    default:
      return 28;
  }
}

/**
 * 依據當前探索深度、調查員職業與已持有遺物動態生成黑市商品清單 (ADR-0032, Issue #53)
 * - 3 張卡牌（透過 CardRegistry 適配當前職業與深度階級）
 * - 1~2 件未持有的 PRESET_RELICS
 * - 1 件應急醫療物資
 * - 支援 20% 機率單一商品隨機半價或特惠標籤
 */
export function generateMarketItemsForDepth(
  depth: DepthLevel = 1,
  occupationId?: OccupationId,
  optionsOrRelicIds?: GenerateMarketItemsOptions | string[],
  maybeRandomFn?: () => number
): MarketItem[] {
  let ownedRelicIds: string[] = [];
  let randomFn: () => number = Math.random;

  if (Array.isArray(optionsOrRelicIds)) {
    ownedRelicIds = optionsOrRelicIds;
    if (maybeRandomFn) randomFn = maybeRandomFn;
  } else if (optionsOrRelicIds && typeof optionsOrRelicIds === 'object') {
    if (optionsOrRelicIds.ownedRelicIds) ownedRelicIds = optionsOrRelicIds.ownedRelicIds;
    if (optionsOrRelicIds.randomFn) randomFn = optionsOrRelicIds.randomFn;
  }

  const effectiveDepth: DepthLevel = depth ?? 1;
  const targetTier = effectiveDepth === 2 ? 2 : effectiveDepth >= 3 ? 3 : 1;
  const occ: OccupationId = occupationId ?? 'investigator';

  // 1. 動態抽取 3 張適配職業與階級之卡牌
  let candidateCards = CardRegistry.getCardsByTier(targetTier, occ);
  if (candidateCards.length < 3) {
    candidateCards = CardRegistry.getCardsByTier(targetTier);
  }
  const shuffledCards = fisherYatesShuffle(candidateCards, randomFn);
  const pickedCards = shuffledCards.slice(0, 3);
  const cardItems: MarketItem[] = pickedCards.map((c, idx) => ({
    id: `market_item_${c.id}_${idx + 1}`,
    name: c.name,
    type: 'card',
    price: c.tier === 1 ? 20 : c.tier === 2 ? 26 : 36,
    card: { ...c, id: `card_market_${c.id}` },
    description: c.description,
  }));

  // 2. 動態抽取 1~2 件未持有之舊日遺物（若全數持有則不重複販售）
  const ownedSet = new Set(ownedRelicIds);
  const unownedRelics = PRESET_RELICS.filter((r) => !ownedSet.has(r.id));
  let relicItems: MarketItem[] = [];

  if (unownedRelics.length > 0) {
    const relicCount = unownedRelics.length === 1 ? 1 : randomFn() < 0.5 ? 1 : 2;
    const shuffledRelics = fisherYatesShuffle(unownedRelics, randomFn);
    const pickedRelics = shuffledRelics.slice(0, relicCount);
    relicItems = pickedRelics.map((r) => ({
      id: `market_item_relic_${r.id}`,
      name: r.name,
      type: 'relic',
      price: getRelicPrice(r),
      relic: r,
      description: r.description,
    }));
  }

  // 3. 抽取 1 件深度對應之醫療補給
  const depthKey = effectiveDepth >= 3 ? 3 : effectiveDepth === 2 ? 2 : 1;
  const medPool = DEPTH_MEDICAL_SUPPLIES[depthKey] || DEPTH_MEDICAL_SUPPLIES[1];
  const pickedMed = medPool[Math.floor(randomFn() * medPool.length)];
  const healItem: MarketItem = {
    id: `${pickedMed.id}_${Math.floor(randomFn() * 10000)}`,
    name: pickedMed.name,
    type: 'heal',
    price: pickedMed.price,
    healAmount: pickedMed.healAmount,
    description: pickedMed.description,
    artworkUrl: pickedMed.artworkUrl,
  };

  // 4. 支援 20% 機率單一卡牌隨機半價或特惠標籤 (ADR-0032 §2, CONTEXT.md)
  if (randomFn() < 0.2 && cardItems.length > 0) {
    const discountIdx = Math.floor(randomFn() * cardItems.length);
    const targetItem = cardItems[discountIdx];
    const originalPrice = targetItem.price;
    const discountedPrice = Math.max(1, Math.round(originalPrice * 0.5));
    cardItems[discountIdx] = {
      ...targetItem,
      originalPrice,
      price: discountedPrice,
      isDiscounted: true,
      discountLabel: '半價特惠',
    };
  }

  const allItems: MarketItem[] = [...cardItems, ...relicItems, healItem];

  return allItems;
}

export function generateDefaultMarketItems(occupationId?: OccupationId): MarketItem[] {
  return generateMarketItemsForDepth(1, occupationId);
}
