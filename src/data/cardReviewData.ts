import type { CardCategory, CostType, OccupationId, Card } from '../types/game';
import { CardRegistry } from '../engine/cards/registry';
import {
  synthesizeCardDescription,
  checkDescriptionDrift,
  type CardDriftDifference,
} from '../engine/cards/synthesizer';
import { ACTIVE_CARD_PROPOSALS } from './activeProposals';

export type ReviewTier = 'starter' | 1 | 2 | 3 | 4 | 'special';
export type ReviewDecision = 'accepted' | 'rejected' | 'pending';

export interface CardReviewItem {
  id: string;
  name: string;
  category: CardCategory;
  tier: ReviewTier;
  occupations?: OccupationId[];
  artworkUrl: string;
  original: {
    costType: CostType;
    costValue: number;
    keywords?: string[];
    description: string;
    flavorText?: string;
  };
  proposed: {
    costType: CostType;
    costValue: number;
    keywords?: string[];
    description: string;
    designRationale: string;
    synergies: string[];
    counterplay?: string;
  };
  synthesizedDescription?: string;
  hasDrift?: boolean;
  driftDifferences?: string[];
  detailedDifferences?: CardDriftDifference[];
  hasActiveProposal?: boolean;
}

export interface StoredReviewDecision {
  decision: ReviewDecision;
  note?: string;
  updatedAt: string;
}

/**
 * 依據卡牌原型解析其審查階級
 */
function resolveCardReviewTier(card: Card): ReviewTier {
  if (card.id.startsWith('starter_')) {
    return 'starter';
  }
  if (card.tier && [1, 2, 3, 4].includes(card.tier)) {
    return card.tier as ReviewTier;
  }
  return 'special';
}

/**
 * 動態從引擎建立全量卡牌審查資料 (ADR-0035)
 * 以 src/engine 為單一真實來源 (SSOT)，融合程式合成描述與活躍提案覆蓋層
 */
export function generateCardReviewItems(): CardReviewItem[] {
  const compendiumCards = CardRegistry.getAllCompendiumCards();
  const seenIds = new Set<string>();
  const items: CardReviewItem[] = [];

  for (const card of compendiumCards) {
    if (seenIds.has(card.id)) continue;
    seenIds.add(card.id);

    const reviewTier = resolveCardReviewTier(card);
    const synthDesc = synthesizeCardDescription(card);
    const driftCheck = checkDescriptionDrift(card.description, synthDesc);
    const activeProposal = ACTIVE_CARD_PROPOSALS[card.id];

    const originalData = {
      costType: card.costType,
      costValue: card.costValue,
      keywords: card.keywords ? [...card.keywords] : undefined,
      description: card.description,
      flavorText: card.flavorText,
    };

    let proposedData: CardReviewItem['proposed'];
    let hasActiveProposal = false;

    if (activeProposal) {
      hasActiveProposal = true;
      proposedData = {
        costType: activeProposal.proposed.costType ?? card.costType,
        costValue: activeProposal.proposed.costValue ?? card.costValue,
        keywords: activeProposal.proposed.keywords ?? (card.keywords ? [...card.keywords] : undefined),
        description: activeProposal.proposed.description ?? card.description,
        designRationale: activeProposal.designRationale,
        synergies: activeProposal.synergies,
        counterplay: activeProposal.counterplay,
      };
    } else {
      proposedData = {
        costType: card.costType,
        costValue: card.costValue,
        keywords: card.keywords ? [...card.keywords] : undefined,
        description: card.description,
        designRationale: '現行實裝基準（無待審改動）',
        synergies: [],
      };
    }

    items.push({
      id: card.id,
      name: card.name,
      category: card.category,
      tier: reviewTier,
      occupations: card.occupations ? [...card.occupations] : undefined,
      artworkUrl: card.artworkUrl || '',
      original: originalData,
      proposed: proposedData,
      synthesizedDescription: synthDesc,
      hasDrift: !driftCheck.isMatch,
      driftDifferences: driftCheck.differences,
      detailedDifferences: driftCheck.detailedDifferences,
      hasActiveProposal,
    });
  }

  return items;
}

/**
 * 匯出全量卡牌審查清單（保持既有呼叫端相容性）
 */
export const ALL_CARD_REVIEW_ITEMS: CardReviewItem[] = generateCardReviewItems();
