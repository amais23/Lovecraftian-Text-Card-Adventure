import type { Card } from '../../types/game';
import type { EmergentArchetype } from './balanceTypes';
import { ensureUniqueCardIds } from '../cardFactory';

/**
 * ADR-0038: 科學熱力漸變光譜 (Cold Blue -> Emerald Green -> Bright Yellow)
 * 0: rgb(29, 78, 216) -> 50: rgb(16, 185, 129) -> 100: rgb(250, 204, 21)
 */
export function getHeatmapColor(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped <= 50) {
    const t = clamped / 50;
    const r = Math.round(29 + (16 - 29) * t);
    const g = Math.round(78 + (185 - 78) * t);
    const b = Math.round(216 + (129 - 216) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (clamped - 50) / 50;
    const r = Math.round(16 + (250 - 16) * t);
    const g = Math.round(185 + (204 - 185) * t);
    const b = Math.round(129 + (21 - 129) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * 計算兩套牌組之間的加權 Jaccard 距離 (0.0 ~ 1.0)
 * d(D1, D2) = 1 - (sum(min(c1, c2)) / sum(max(c1, c2)))
 * 0.0 代表完全相同；1.0 代表完全無共通卡牌
 */
export function computeWeightedJaccardDistance(deckA: Card[], deckB: Card[]): number {
  if (deckA.length === 0 && deckB.length === 0) return 0;
  if (deckA.length === 0 || deckB.length === 0) return 1;

  const countsA = new Map<string, number>();
  const countsB = new Map<string, number>();

  for (const card of deckA) {
    countsA.set(card.id, (countsA.get(card.id) ?? 0) + 1);
  }
  for (const card of deckB) {
    countsB.set(card.id, (countsB.get(card.id) ?? 0) + 1);
  }

  const allCardIds = new Set<string>([...countsA.keys(), ...countsB.keys()]);

  let intersectionSum = 0;
  let unionSum = 0;

  for (const id of allCardIds) {
    const cA = countsA.get(id) ?? 0;
    const cB = countsB.get(id) ?? 0;
    intersectionSum += Math.min(cA, cB);
    unionSum += Math.max(cA, cB);
  }

  if (unionSum === 0) return 0;
  return 1 - intersectionSum / unionSum;
}

/**
 * 稀疏牌庫向量結構，預乘 S 矩陣以達到 O(K) 兩兩內積計算
 */
interface SparseDeckRepresentation {
  indices: number[];
  counts: number[];
  Sa: Float64Array;
  norm: number;
}

function buildSparseDeck(
  deck: Card[],
  similarityMatrix: number[][],
  cardIndexMap: Map<string, number>,
  matrixDim: number
): SparseDeckRepresentation {
  if (deck.length === 0 || matrixDim === 0) {
    return {
      indices: [],
      counts: [],
      Sa: new Float64Array(matrixDim),
      norm: 0,
    };
  }

  const countMap = new Map<number, number>();
  for (const card of deck) {
    const idx = cardIndexMap.get(card.id);
    if (idx !== undefined && idx < matrixDim) {
      countMap.set(idx, (countMap.get(idx) ?? 0) + 1);
    }
  }

  const indices = Array.from(countMap.keys());
  const counts = indices.map((idx) => countMap.get(idx)!);
  const Sa = new Float64Array(matrixDim);

  for (let k = 0; k < indices.length; k++) {
    const idx = indices[k];
    const c = counts[k];
    const row = similarityMatrix[idx];
    for (let j = 0; j < matrixDim; j++) {
      Sa[j] += c * row[j];
    }
  }

  let normSq = 0;
  for (let k = 0; k < indices.length; k++) {
    normSq += counts[k] * Sa[indices[k]];
  }

  return {
    indices,
    counts,
    Sa,
    norm: Math.sqrt(Math.max(0, normSq)),
  };
}

function computePairSimilarityFromSparse(
  reprA: SparseDeckRepresentation,
  reprB: SparseDeckRepresentation
): number {
  if (reprA.norm <= 1e-12 && reprB.norm <= 1e-12) return 1.0;
  if (reprA.norm <= 1e-12 || reprB.norm <= 1e-12) return 0.0;

  let dot = 0;
  if (reprA.indices.length <= reprB.indices.length) {
    const indicesA = reprA.indices;
    const countsA = reprA.counts;
    const SaB = reprB.Sa;
    for (let k = 0; k < indicesA.length; k++) {
      dot += countsA[k] * SaB[indicesA[k]];
    }
  } else {
    const indicesB = reprB.indices;
    const countsB = reprB.counts;
    const SaA = reprA.Sa;
    for (let k = 0; k < indicesB.length; k++) {
      dot += countsB[k] * SaA[indicesB[k]];
    }
  }

  const sim = dot / (reprA.norm * reprB.norm);
  return Math.max(0, Math.min(1, sim));
}

function computePairDistanceFromSparse(
  reprA: SparseDeckRepresentation,
  reprB: SparseDeckRepresentation
): number {
  if (reprA.norm <= 1e-12 && reprB.norm <= 1e-12) return 0.0;
  if (reprA.norm <= 1e-12 || reprB.norm <= 1e-12) return 1.0;

  const sim = computePairSimilarityFromSparse(reprA, reprB);
  return Number(Math.sqrt(Math.max(0, 1 - sim)).toFixed(4));
}

/**
 * 軟加權餘弦相似度 (Soft Cosine Measure, Sidorov et al. 2014)
 * 計算兩套牌庫在卡牌力學特徵空間下的連續語意相似度 (0.0 ~ 1.0)
 *
 * Sim_soft(D1, D2) = (a^T * S * b) / (sqrt(a^T * S * a) * sqrt(b^T * S * b))
 */
export function computeSoftCosineSimilarity(
  deckA: Card[],
  deckB: Card[],
  similarityMatrix: number[][],
  cardIndexMap: Map<string, number>
): number {
  if (deckA.length === 0 && deckB.length === 0) return 1.0;
  if (deckA.length === 0 || deckB.length === 0) return 0.0;
  if (similarityMatrix.length === 0) {
    return 1 - computeWeightedJaccardDistance(deckA, deckB);
  }

  const matrixDim = similarityMatrix.length;
  const reprA = buildSparseDeck(deckA, similarityMatrix, cardIndexMap, matrixDim);
  const reprB = buildSparseDeck(deckB, similarityMatrix, cardIndexMap, matrixDim);

  return computePairSimilarityFromSparse(reprA, reprB);
}

/**
 * 軟加權餘弦牌庫距離 (Soft Cosine Distance)
 * d_soft(D1, D2) = sqrt(max(0, 1 - Sim_soft(D1, D2)))
 * 0.0 代表完全相同或力學特徵完全等價；接近 1.0 代表力學機制完全正交無關
 */
export function computeSoftCosineDistance(
  deckA: Card[],
  deckB: Card[],
  similarityMatrix: number[][],
  cardIndexMap: Map<string, number>
): number {
  if (deckA.length === 0 && deckB.length === 0) return 0.0;
  if (deckA.length === 0 || deckB.length === 0) return 1.0;
  if (similarityMatrix.length === 0) {
    return computeWeightedJaccardDistance(deckA, deckB);
  }

  const matrixDim = similarityMatrix.length;
  const reprA = buildSparseDeck(deckA, similarityMatrix, cardIndexMap, matrixDim);
  const reprB = buildSparseDeck(deckB, similarityMatrix, cardIndexMap, matrixDim);

  return computePairDistanceFromSparse(reprA, reprB);
}

/**
 * 批次計算所有牌庫對的軟加權餘弦距離矩陣 (N x N)
 * 針對稀疏卡牌頻率進行預乘與內積最佳化，380 套牌庫耗時 < 15ms
 */
export function computeAllPairSoftCosineDistances(
  decks: Card[][],
  similarityMatrix: number[][],
  cardIndexMap: Map<string, number>
): number[][] {
  const n = decks.length;
  if (n === 0) return [];
  const matrixDim = similarityMatrix.length;

  if (matrixDim === 0) {
    const distMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = computeWeightedJaccardDistance(decks[i], decks[j]);
        distMatrix[i][j] = d;
        distMatrix[j][i] = d;
      }
    }
    return distMatrix;
  }

  const representations = decks.map((d) =>
    buildSparseDeck(d, similarityMatrix, cardIndexMap, matrixDim)
  );

  const distMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    distMatrix[i][i] = 0;
    const reprI = representations[i];
    for (let j = i + 1; j < n; j++) {
      const reprJ = representations[j];
      const d = computePairDistanceFromSparse(reprI, reprJ);
      distMatrix[i][j] = d;
      distMatrix[j][i] = d;
    }
  }

  return distMatrix;
}


/**
 * 冪迭代法 (Power Iteration) 求解矩陣主要特徵向量與特徵值
 */
function powerIteration(
  M: Float64Array[],
  n: number,
  initialVec: Float64Array,
  orthogonalTo?: Float64Array,
  iterations = 45
): { vector: Float64Array; lambda: number } {
  const v = new Float64Array(initialVec);
  const tmp = new Float64Array(n);

  const matVecMult = (mat: Float64Array[], vec: Float64Array, out: Float64Array) => {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      const row = mat[i];
      for (let j = 0; j < n; j++) sum += row[j] * vec[j];
      out[i] = sum;
    }
  };

  const normVec = (vec: Float64Array): number => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += vec[i] * vec[i];
    const len = Math.sqrt(sum);
    if (len > 1e-12) {
      const invLen = 1 / len;
      for (let i = 0; i < n; i++) vec[i] *= invLen;
    }
    return len;
  };

  const projectOrthogonal = (target: Float64Array, ref: Float64Array) => {
    let dot = 0;
    for (let i = 0; i < n; i++) dot += target[i] * ref[i];
    for (let i = 0; i < n; i++) target[i] -= dot * ref[i];
  };

  if (orthogonalTo) {
    projectOrthogonal(v, orthogonalTo);
  }
  normVec(v);

  for (let iter = 0; iter < iterations; iter++) {
    matVecMult(M, v, tmp);
    if (orthogonalTo) {
      projectOrthogonal(tmp, orthogonalTo);
    }
    v.set(tmp);
    normVec(v);
  }

  matVecMult(M, v, tmp);
  let lambda = 0;
  for (let i = 0; i < n; i++) lambda += v[i] * tmp[i];

  return { vector: v, lambda: Math.max(0, lambda) };
}

/**
 * 經典多維尺度變換 (Classical Multidimensional Scaling / Torgerson Scaling)
 * 將 N x N 的幾何距離矩陣投影至 2D 歐幾里得平面，保留相對距離結構
 * 回傳各點正規化至 [0.05, 0.95] 區間之 [x, y] 座標陣列
 */
export function classicalMDS(distanceMatrix: number[][]): Array<[number, number]> {
  const n = distanceMatrix.length;
  if (n === 0) return [];
  if (n === 1) return [[0.5, 0.5]];
  if (n === 2) {
    return [
      [0.25, 0.5],
      [0.75, 0.5],
    ];
  }

  // 1. 計算平方距離矩陣 S_ij = D_ij^2
  const S: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const rowSums = new Float64Array(n);
  let totalSum = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const d = distanceMatrix[i][j];
      const sq = d * d;
      S[i][j] = sq;
      rowSums[i] += sq;
      totalSum += sq;
    }
  }

  // 2. 雙重中心化 (Double Centering) B = -0.5 * H * S * H
  // B_ij = -0.5 * (S_ij - mean(row_i) - mean(col_j) + mean(all))
  const B: Float64Array[] = Array.from({ length: n }, () => new Float64Array(n));
  const invN = 1 / n;
  const meanAll = totalSum / (n * n);

  for (let i = 0; i < n; i++) {
    const meanRowI = rowSums[i] * invN;
    for (let j = 0; j < n; j++) {
      const meanColJ = rowSums[j] * invN;
      B[i][j] = -0.5 * (S[i][j] - meanRowI - meanColJ + meanAll);
    }
  }

  // 3. 冪迭代法求解前兩大正特徵值與特徵向量
  const initV1 = new Float64Array(n);
  for (let i = 0; i < n; i++) initV1[i] = Math.sin((i + 1) * 1.5);
  const { vector: v1, lambda: lambda1 } = powerIteration(B, n, initV1);

  // 矩陣消減 (Deflation): B' = B - lambda1 * (v1 * v1^T)
  const B2: Float64Array[] = Array.from({ length: n }, (_, i) => {
    const row = new Float64Array(n);
    const bRow = B[i];
    const v1i = v1[i];
    for (let j = 0; j < n; j++) {
      row[j] = bRow[j] - lambda1 * v1i * v1[j];
    }
    return row;
  });

  const initV2 = new Float64Array(n);
  for (let i = 0; i < n; i++) initV2[i] = Math.cos((i + 1) * 2.3);
  const { vector: v2, lambda: lambda2 } = powerIteration(B2, n, initV2, v1);

  // 4. 計算 2D 坐標 X = [v1 * sqrt(lambda1), v2 * sqrt(lambda2)]
  const scale1 = Math.sqrt(lambda1);
  const scale2 = Math.sqrt(lambda2);

  const rawCoords: Array<[number, number]> = new Array(n);
  let minX = Infinity,
    maxX = -Infinity;
  let minY = Infinity,
    maxY = -Infinity;

  for (let i = 0; i < n; i++) {
    const x = v1[i] * scale1;
    const y = v2[i] * scale2;
    rawCoords[i] = [x, y];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  // 5. 歸一化至 [0.05, 0.95] 區間
  const pad = 0.05;
  const usable = 1 - pad * 2;

  return rawCoords.map(([rx, ry]) => {
    const nx = pad + ((rx - minX) / rangeX) * usable;
    const ny = pad + ((ry - minY) / rangeY) * usable;
    return [Number(nx.toFixed(4)), Number(ny.toFixed(4))];
  });
}

/**
 * 基於雙卡協同矩陣之圖論非監督式社群偵測（自然湧現流派分類）
 */
export function detectEmergentArchetypes(params: {
  cards: Card[];
  synergyMatrix: Map<string, Map<string, number>>;
  cardScores?: Map<string, number>;
  maxCommunities?: number;
}): EmergentArchetype[] {
  const { cards, synergyMatrix, cardScores = new Map(), maxCommunities = 6 } = params;
  if (cards.length === 0) return [];

  const cardMap = new Map<string, Card>(cards.map((c) => [c.id, c]));
  const cardIds = cards.map((c) => c.id);

  // 1. 初始化：每張卡各自獨立為一個社群
  // communityId -> Set of cardIds
  const communities = new Map<number, Set<string>>();
  const cardCommunity = new Map<string, number>();

  cardIds.forEach((id, idx) => {
    communities.set(idx, new Set([id]));
    cardCommunity.set(id, idx);
  });

  // 計算兩群之間的正規化平均協同強度 (True Average Linkage + Size Balance Penalty)
  const targetCommunities = Math.max(2, Math.min(maxCommunities, Math.floor(cards.length / 2)));
  const maxCommunitySize = Math.max(8, Math.ceil((cards.length / targetCommunities) * 1.45));

  const getCommunitySynergy = (c1: Set<string>, c2: Set<string>): number => {
    let sum = 0;
    for (const id1 of c1) {
      const row = synergyMatrix.get(id1);
      if (!row) continue;
      for (const id2 of c2) {
        sum += row.get(id2) ?? 0;
      }
    }
    const sizeProduct = c1.size * c2.size;
    let avgSyn = sizeProduct > 0 ? sum / sizeProduct : 0;

    // 若合併後超過上限規模，施加軟性規模懲罰以避免雪球效應
    const combinedSize = c1.size + c2.size;
    if (combinedSize > maxCommunitySize) {
      avgSyn -= (combinedSize - maxCommunitySize) * 2.0;
    }
    return avgSyn;
  };

  // 2. 貪婪凝聚合併 (Agglomerative Clustering)
  // 合併直到社群總數達到目標群數 targetCommunities (預設 5~6 群)
  while (communities.size > targetCommunities) {
    let bestPair: [number, number] | null = null;
    let maxSynergy = -Infinity;

    const commIds = Array.from(communities.keys());
    for (let i = 0; i < commIds.length; i++) {
      for (let j = i + 1; j < commIds.length; j++) {
        const idA = commIds[i];
        const idB = commIds[j];
        const setA = communities.get(idA)!;
        const setB = communities.get(idB)!;
        const syn = getCommunitySynergy(setA, setB);
        if (syn > maxSynergy) {
          maxSynergy = syn;
          bestPair = [idA, idB];
        }
      }
    }

    if (maxSynergy <= -100 || !bestPair) {
      // 若已無適當的協同或合併對象，合併目前規模最小的兩個社群
      const sortedBySizes = Array.from(communities.entries()).sort(
        (a, b) => a[1].size - b[1].size
      );
      if (sortedBySizes.length >= 2) {
        bestPair = [sortedBySizes[0][0], sortedBySizes[1][0]];
      } else {
        break;
      }
    }

    const [keepId, mergeId] = bestPair;
    const keepSet = communities.get(keepId)!;
    const mergeSet = communities.get(mergeId)!;

    for (const cardId of mergeSet) {
      keepSet.add(cardId);
      cardCommunity.set(cardId, keepId);
    }
    communities.delete(mergeId);
  }

  // 3. 後處理：將過小群 (< 4 張卡) 吸收合併至相容度最高的主群中，確保每個湧現流派均具備足夠卡牌基底
  const minCommunitySize = Math.max(1, Math.min(4, Math.floor(cards.length / (targetCommunities * 2))));
  let smallCommFound = true;
  let safetyLoop = 0;
  while (smallCommFound && communities.size > 2 && safetyLoop < 50) {
    safetyLoop++;
    smallCommFound = false;
    for (const [cId, cSet] of Array.from(communities.entries())) {
      if (cSet.size < minCommunitySize) {
        smallCommFound = true;
        // 尋找最佳合併對象
        let targetId = -1;
        let maxTargetSyn = -Infinity;
        for (const [otherId, otherSet] of communities.entries()) {
          if (otherId === cId) continue;
          const syn = getCommunitySynergy(cSet, otherSet);
          if (syn > maxTargetSyn) {
            maxTargetSyn = syn;
            targetId = otherId;
          }
        }
        if (targetId !== -1) {
          const targetSet = communities.get(targetId)!;
          for (const cardId of cSet) {
            targetSet.add(cardId);
            cardCommunity.set(cardId, targetId);
          }
          communities.delete(cId);
          break;
        }
      }
    }
  }

  // 3. 封裝自然湧現流派實體 (EmergentArchetype)
  const results: EmergentArchetype[] = [];
  let archCounter = 1;

  for (const memberSet of communities.values()) {
    if (memberSet.size === 0) continue;
    const memberCardIds = Array.from(memberSet);

    // 依單卡強度 (cardScores) 與群內度中心性 (degree centrality) 排序，找出 2 張核心代表卡
    const cardRanked = memberCardIds
      .map((id) => {
        const score = cardScores.get(id) ?? 50;
        let internalSynergy = 0;
        const row = synergyMatrix.get(id);
        if (row) {
          for (const otherId of memberCardIds) {
            if (otherId !== id) internalSynergy += Math.max(0, row.get(otherId) ?? 0);
          }
        }
        return {
          id,
          name: cardMap.get(id)?.name ?? id,
          combinedPower: score + internalSynergy * 2,
        };
      })
      .sort((a, b) => b.combinedPower - a.combinedPower);

    const sig1 = cardRanked[0];
    const sig2 = cardRanked.length > 1 ? cardRanked[1] : cardRanked[0];

    const archetypeId = `emergent_arch_${archCounter}`;
    const archetypeName = `【${sig1.name}＋${sig2.name}】體系`;

    // 挖掘群內最強 2~3 卡 Combo
    const coreCombos: Array<{ cardIds: string[]; cardNames: string[]; synergyScore: number }> = [];
    if (memberCardIds.length >= 2) {
      // 找出群內協同最高的兩卡配對
      let topPair: [string, string] | null = null;
      let topPairSyn = -1;

      for (let i = 0; i < memberCardIds.length; i++) {
        for (let j = i + 1; j < memberCardIds.length; j++) {
          const id1 = memberCardIds[i];
          const id2 = memberCardIds[j];
          const syn = synergyMatrix.get(id1)?.get(id2) ?? 0;
          if (syn > topPairSyn) {
            topPairSyn = syn;
            topPair = [id1, id2];
          }
        }
      }

      if (topPair) {
        coreCombos.push({
          cardIds: [topPair[0], topPair[1]],
          cardNames: [cardMap.get(topPair[0])?.name ?? topPair[0], cardMap.get(topPair[1])?.name ?? topPair[1]],
          synergyScore: Number(topPairSyn.toFixed(1)),
        });
      }
    }

    results.push({
      id: archetypeId,
      name: archetypeName,
      signatureCards: [
        { id: sig1.id, name: sig1.name },
        { id: sig2.id, name: sig2.name },
      ],
      memberCardIds,
      coreCombos,
      deckCount: 0,
      avgScore: 0,
      avgHealthLost: 0,
      avgSanityExpended: 0,
    });

    archCounter++;
  }

  return results;
}

export interface ArchetypeFamilyDeck {
  deck: Card[];
  handRetention: 2 | 3 | 4 | 5 | 6;
  archetypeId: string;
  archetypeName: string;
  isHybridOrRogue: boolean;
}

export interface ArchetypeFamilySamplingParams {
  emergentArchetypes: EmergentArchetype[];
  allCards: Card[];
  totalTarget?: number; // 預設 380 套代表性牌庫
  randomFn?: () => number;
}

/**
 * 依據自然湧現流派生成 380 套高代表性家族變體牌庫 (Issue #70)
 * - 4 大流派各自生成約 75 套變體（70% 核心卡 + 30% 全典籍對策卡，涵蓋 10~35 張與 2~6 手牌保留數）
 * - 生成約 80 套跨流派雙修混搭與 Rogue 牌庫
 * - 同家族內部牌庫自然保持 70%~90% 卡牌重疊率，高維距離為 0.15~0.30
 */
export function generateArchetypeFamilyDecks(
  params: ArchetypeFamilySamplingParams
): ArchetypeFamilyDeck[] {
  const {
    emergentArchetypes,
    allCards,
    totalTarget = 380,
    randomFn = Math.random,
  } = params;

  if (allCards.length === 0) return [];

  // 若尚未探勘出湧現流派，以全卡牌隨機白噪音牌庫作為備用方案
  if (emergentArchetypes.length === 0) {
    const fallbackDecks: ArchetypeFamilyDeck[] = [];
    for (let i = 0; i < totalTarget; i++) {
      const size = 12 + Math.floor(randomFn() * 15);
      const picked: Card[] = [];
      for (let s = 0; s < size; s++) {
        picked.push(allCards[Math.floor(randomFn() * allCards.length)]);
      }
      fallbackDecks.push({
        deck: ensureUniqueCardIds(picked),
        handRetention: (3 + (i % 3)) as 3 | 4 | 5,
        archetypeId: 'fallback',
        archetypeName: '通用探索牌庫',
        isHybridOrRogue: true,
      });
    }
    return fallbackDecks;
  }

  // 1. 鎖定前 4 大主要自然湧現流派 (若不足 4 群則全部納入)
  const targetArchetypes = emergentArchetypes.slice(0, 4);
  const numArch = targetArchetypes.length;

  const cardMap = new Map<string, Card>(allCards.map((c) => [c.id, c]));
  const results: ArchetypeFamilyDeck[] = [];

  // 規模與手牌保留數階梯序列 (涵蓋 10~35 張規模與 2~6 手牌保留數)
  const sizeProgression = [10, 12, 14, 16, 18, 20, 22, 25, 28, 30, 32, 35];
  const retentionProgression: Array<2 | 3 | 4 | 5 | 6> = [2, 3, 4, 4, 4, 5, 6];

  // 計算各流派變體牌庫配額 (例如 4 群各 75 套 = 300 套)
  const pureTargetTotal = Math.min(300, Math.floor(totalTarget * 0.79));
  const decksPerArch = Math.floor(pureTargetTotal / numArch);
  const hybridRogueTotal = totalTarget - decksPerArch * numArch; // 約 80 套

  // 2. 生成各自然湧現流派家族變體 (各約 75 套)
  for (let aIdx = 0; aIdx < numArch; aIdx++) {
    const arch = targetArchetypes[aIdx];
    const memberPool: Card[] = arch.memberCardIds
      .map((id) => cardMap.get(id))
      .filter((c): c is Card => c !== undefined);

    const pool = memberPool.length > 0 ? memberPool : allCards;
    const sigPool: Card[] = arch.signatureCards
      .map((sig) => cardMap.get(sig.id))
      .filter((c): c is Card => c !== undefined);

    for (let v = 0; v < decksPerArch; v++) {
      const deckSize = sizeProgression[v % sizeProgression.length];
      const handRetention = retentionProgression[v % retentionProgression.length];

      // 70% 該流派核心卡 (65%~80%)，其餘為全典籍對策外掛卡
      const coreCount = Math.max(2, Math.round(deckSize * 0.70));
      const utilityCount = Math.max(1, deckSize - coreCount);

      const deckCards: Card[] = [];

      // 1. 先將流派成員卡置入核心牌庫（確保同家族變體共享完整的核心骨架）
      for (const memberCard of pool) {
        if (deckCards.length < coreCount) {
          deckCards.push(memberCard);
        }
      }

      // 2. 若仍有核心配額，追加代表性卡牌（Signature Cards）之複本
      let sigIdx = 0;
      while (deckCards.length < coreCount && sigPool.length > 0) {
        deckCards.push(sigPool[sigIdx % sigPool.length]);
        sigIdx++;
      }

      // 3. 若仍有配額，追加成員卡複本
      let extraIdx = 0;
      while (deckCards.length < coreCount) {
        deckCards.push(pool[extraIdx % pool.length]);
        extraIdx++;
      }

      // 4. 置入 30% 全典籍對策/功能外掛卡 (提供 2~3 張對策微調)
      for (let u = 0; u < utilityCount; u++) {
        const utilIdx = (v * 3 + u) % allCards.length;
        deckCards.push(allCards[utilIdx]);
      }

      results.push({
        deck: ensureUniqueCardIds(deckCards),
        handRetention,
        archetypeId: arch.id,
        archetypeName: arch.name,
        isHybridOrRogue: false,
      });
    }
  }

  // 3. 生成跨流派雙修混搭 (約 60 套) 與 Rogue 牌庫 (約 20 套)
  const rogueCount = Math.min(20, Math.floor(hybridRogueTotal * 0.25));
  const hybridCount = hybridRogueTotal - rogueCount;

  // 雙修混搭 (Dual-Archetype Hybrids)
  for (let h = 0; h < hybridCount; h++) {
    const archA = targetArchetypes[h % numArch];
    const archB = targetArchetypes[(h + 1 + Math.floor(h / numArch)) % numArch];

    const poolA = archA.memberCardIds.map((id) => cardMap.get(id)).filter((c): c is Card => c !== undefined);
    const poolB = archB.memberCardIds.map((id) => cardMap.get(id)).filter((c): c is Card => c !== undefined);

    const deckSize = 15 + (h % 16); // 15~30 張
    const handRetention = retentionProgression[(h + 1) % retentionProgression.length];

    const countA = Math.max(2, Math.round(deckSize * 0.40));
    const countB = Math.max(2, Math.round(deckSize * 0.40));
    const countUtil = Math.max(1, deckSize - countA - countB);

    const deckCards: Card[] = [];
    const actualPoolA = poolA.length > 0 ? poolA : allCards;
    const actualPoolB = poolB.length > 0 ? poolB : allCards;

    for (let i = 0; i < countA; i++) {
      deckCards.push(actualPoolA[Math.floor(randomFn() * actualPoolA.length)]);
    }
    for (let i = 0; i < countB; i++) {
      deckCards.push(actualPoolB[Math.floor(randomFn() * actualPoolB.length)]);
    }
    for (let i = 0; i < countUtil; i++) {
      deckCards.push(allCards[Math.floor(randomFn() * allCards.length)]);
    }

    const shortNameA = archA.name.replace(/【|】|體系/g, '');
    const shortNameB = archB.name.replace(/【|】|體系/g, '');

    results.push({
      deck: ensureUniqueCardIds(deckCards),
      handRetention,
      archetypeId: `${archA.id}_${archB.id}_hybrid`,
      archetypeName: `【${shortNameA}＋${shortNameB}】雙修`,
      isHybridOrRogue: true,
    });
  }

  // Rogue / 創意雜牌 (Rogue Variants)
  for (let r = 0; r < rogueCount; r++) {
    const deckSize = 12 + (r % 14); // 12~25 張
    const handRetention = retentionProgression[r % retentionProgression.length];
    const deckCards: Card[] = [];

    for (let i = 0; i < deckSize; i++) {
      deckCards.push(allCards[Math.floor(randomFn() * allCards.length)]);
    }

    results.push({
      deck: ensureUniqueCardIds(deckCards),
      handRetention,
      archetypeId: 'rogue_variant',
      archetypeName: '【混沌漫遊】非主流變體',
      isHybridOrRogue: true,
    });
  }

  return results;
}

