import type { Card } from '../../types/game';
import type { EmergentArchetype } from './balanceTypes';

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
 * 經典多維尺度變換 (Classical Multidimensional Scaling / Torgerson Scaling)
 * 將 N x N 的幾何距離矩陣投影至 2D 歐幾里得平面，保留相對距離結構
 * 回傳各點正規化至 [0.05, 0.95] 區間之 [x, y] 座標陣列
 */
export function classicalMDS(
  distanceMatrix: number[][],
  _dimensions: number = 2
): Array<[number, number]> {
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

  // 3. 冪迭代法 (Power Iteration) 求解前兩大正特徵值與特徵向量
  // 輔助函數：向量矩陣乘法
  const matVecMult = (M: Float64Array[], v: Float64Array, out: Float64Array) => {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      const row = M[i];
      for (let j = 0; j < n; j++) {
        sum += row[j] * v[j];
      }
      out[i] = sum;
    }
  };

  // 輔助函數：向量正規化
  const normVec = (v: Float64Array): number => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += v[i] * v[i];
    const len = Math.sqrt(sum);
    if (len > 1e-12) {
      const invLen = 1 / len;
      for (let i = 0; i < n; i++) v[i] *= invLen;
    }
    return len;
  };

  // 求第一特徵向量 v1 與特徵值 lambda1
  let v1 = new Float64Array(n);
  for (let i = 0; i < n; i++) v1[i] = Math.sin((i + 1) * 1.5);
  normVec(v1);

  const tmp = new Float64Array(n);
  for (let iter = 0; iter < 45; iter++) {
    matVecMult(B, v1, tmp);
    v1.set(tmp);
    normVec(v1);
  }

  matVecMult(B, v1, tmp);
  let lambda1 = 0;
  for (let i = 0; i < n; i++) lambda1 += v1[i] * tmp[i];
  lambda1 = Math.max(0, lambda1);

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

  // 求第二特徵向量 v2 與特徵值 lambda2
  let v2 = new Float64Array(n);
  for (let i = 0; i < n; i++) v2[i] = Math.cos((i + 1) * 2.3);
  // 正交化 v2 垂直於 v1
  let dot1 = 0;
  for (let i = 0; i < n; i++) dot1 += v2[i] * v1[i];
  for (let i = 0; i < n; i++) v2[i] -= dot1 * v1[i];
  normVec(v2);

  for (let iter = 0; iter < 45; iter++) {
    matVecMult(B2, v2, tmp);
    // 再次正交化確保數值穩定性
    dot1 = 0;
    for (let i = 0; i < n; i++) dot1 += tmp[i] * v1[i];
    for (let i = 0; i < n; i++) v2[i] = tmp[i] - dot1 * v1[i];
    normVec(v2);
  }

  matVecMult(B2, v2, tmp);
  let lambda2 = 0;
  for (let i = 0; i < n; i++) lambda2 += v2[i] * tmp[i];
  lambda2 = Math.max(0, lambda2);

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
