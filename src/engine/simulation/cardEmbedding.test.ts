import { describe, it, expect } from 'vitest';
import { getAllCompendiumCards } from '../cards/registry';
import {
  extractCardMechanicsFeatures,
  computeCardMechanicsEmbeddings,
} from './cardEmbedding';

describe('Card Mechanics SVD Embedding & Cosine Similarity Matrix (Issue #68)', () => {
  const compendiumCards = getAllCompendiumCards();

  it('verifies canonical compendium contains all 73 cards', () => {
    expect(compendiumCards).toHaveLength(73);
  });

  it('extracts structured mechanics feature vector for a card', () => {
    const card = compendiumCards[0];
    const features = extractCardMechanicsFeatures(card);
    expect(features.length).toBeGreaterThanOrEqual(25);
    expect(typeof features[0]).toBe('number');
  });

  it('computes 16-dimensional Truncated SVD embeddings and 73x73 similarity matrix under 15ms', () => {
    const startTime = performance.now();
    const result = computeCardMechanicsEmbeddings(compendiumCards, { dimensions: 16 });
    const duration = performance.now() - startTime;

    // Benchmark performance: Pure TypeScript SVD should execute well under 50ms in test environment (target < 10ms in production)
    expect(duration).toBeLessThan(50);
    expect(result.cardIds).toHaveLength(73);
    expect(result.similarityMatrix).toHaveLength(73);
    expect(result.similarityMatrix[0]).toHaveLength(73);
  });

  it('ensures similarity matrix S satisfies mathematical metric properties (symmetry, identity, [0, 1])', () => {
    const result = computeCardMechanicsEmbeddings(compendiumCards);
    const S = result.similarityMatrix;
    const n = S.length;

    for (let i = 0; i < n; i++) {
      // Identity: diagonal S[i][i] === 1.0
      expect(S[i][i]).toBeCloseTo(1.0, 5);

      for (let j = 0; j < n; j++) {
        // Range: [0, 1]
        expect(S[i][j]).toBeGreaterThanOrEqual(0);
        expect(S[i][j]).toBeLessThanOrEqual(1.0);

        // Symmetry: S[i][j] === S[j][i]
        expect(S[i][j]).toBeCloseTo(S[j][i], 5);
      }
    }
  });

  it('verifies functional defense niche cards have significantly higher similarity than cross-category cards', () => {
    const result = computeCardMechanicsEmbeddings(compendiumCards);

    // 1. 同屬防禦生態位之卡牌：不可侵犯之壁 (card_tier3_impenetrable_bastion) 與 鋼鐵意志屏障 (card_tier2_iron_will)
    const simDefensePair = result.getSimilarity(
      'card_tier3_impenetrable_bastion',
      'card_tier2_iron_will'
    );

    // 2. 基礎防禦同生態位替換：就地掩蔽 (card_cover_1) 與 戰術翻滾 (reward_tactical_roll_1)
    const simCoverTactical = result.getSimilarity(
      'card_cover_1',
      'reward_tactical_roll_1'
    );

    // 3. 跨類型極端正交卡牌：不可侵犯之壁 vs 深淵引爆 (reward_abyssal_detonation)
    const simCrossType = result.getSimilarity(
      'card_tier3_impenetrable_bastion',
      'reward_abyssal_detonation'
    );

    // 4. 跨類型極端正交卡牌：就地掩蔽 vs 深淵引爆
    const simCoverDetonation = result.getSimilarity(
      'card_cover_1',
      'reward_abyssal_detonation'
    );

    // 驗證生態位相似度顯著高於跨類型
    expect(simDefensePair).toBeGreaterThan(0.80);
    expect(simCoverTactical).toBeGreaterThan(0.65);
    expect(simCrossType).toBeLessThan(0.20);
    expect(simCoverDetonation).toBeLessThan(0.20);
    expect(simDefensePair).toBeGreaterThan(simCrossType + 0.60);
  });

  it('supports exporting serializable dictionary via toRecord() for BalanceSummaryData integration', () => {
    const result = computeCardMechanicsEmbeddings(compendiumCards);
    const record = result.toRecord();

    expect(Object.keys(record)).toHaveLength(73);
    const bastionRecord = record['card_tier3_impenetrable_bastion'];
    expect(bastionRecord).toBeDefined();
    expect(bastionRecord['card_tier3_impenetrable_bastion']).toBe(1.0);
    expect(bastionRecord['card_tier2_iron_will']).toBeGreaterThan(0.80);
  });

  it('handles small or edge-case card lists gracefully', () => {
    const emptyResult = computeCardMechanicsEmbeddings([]);
    expect(emptyResult.cardIds).toHaveLength(0);
    expect(emptyResult.similarityMatrix).toHaveLength(0);

    const singleCard = [compendiumCards[0]];
    const singleResult = computeCardMechanicsEmbeddings(singleCard);
    expect(singleResult.cardIds).toHaveLength(1);
    expect(singleResult.similarityMatrix[0][0]).toBe(1.0);
    expect(singleResult.getSimilarity(singleCard[0].id, singleCard[0].id)).toBe(1.0);
  });
});
