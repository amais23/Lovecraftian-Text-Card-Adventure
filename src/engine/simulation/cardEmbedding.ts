import type { Card } from '../../types/game';

export interface CardEmbeddingOptions {
  dimensions?: number; // 預設 16 維潛在力學因子
  synergyMatrix?: Map<string, Map<string, number>>; // 雙卡對弈協同矩陣 (可選)
  iterations?: number; // 冪迭代次數，預設 40
}

export interface CardSimilarityResult {
  cardIds: string[];
  embeddings: Map<string, Float64Array>;
  similarityMatrix: number[][]; // N x N 矩陣，值域 [0, 1]，對角線恆為 1.0
  cardIndexMap: Map<string, number>;
  getSimilarity: (idA: string, idB: string) => number;
  toRecord: () => Record<string, Record<string, number>>;
}

/**
 * 依據 ADR-0024 結構化卡牌力學基元提取多維連續力學特徵向量
 */
export function extractCardMechanicsFeatures(
  card: Card,
  synergyMatrix?: Map<string, Map<string, number>>
): number[] {
  // 1. 卡牌類別 One-hot (權重加強至 3.0，確保宏觀流派邊界)
  const isCombat = card.category === 'combat' ? 3.0 : 0;
  const isSkill = card.category === 'skill' ? 3.0 : 0;
  const isMagic = card.category === 'magic' ? 3.0 : 0;
  const isTruth = card.category === 'truth' ? 3.0 : 0;
  const isMadness = card.category === 'madness' ? 3.0 : 0;

  // 2. 消耗資源類型與數值
  const isStamina = card.costType === 'stamina' ? 1.0 : 0;
  const isSanity = card.costType === 'sanity' ? 1.0 : 0;
  const isFree = card.costType === 'free' ? 1.0 : 0;
  const costNorm = (card.costValue || 0) / 3.0;

  // 3. 階級數值
  const tierNorm = (card.tier || 1) / 4.0;

  // 4. 戰鬥行為基元累加
  let totalDamage = 0;
  let hasPiercing = 0;
  let totalArmor = 0;
  let totalHeal = 0;
  let totalDraw = 0;
  let totalErodeSanity = 0;
  let totalRestoreSanity = 0;
  let totalSelfDamage = 0;

  // 狀態印記累加
  let statusBleed = 0;
  let statusHorror = 0;
  let statusMight = 0;
  let statusResilience = 0;
  let statusVulnerable = 0;
  let statusWeak = 0;

  // 觸發條件與數值縮放
  let condLowSanity = 0;
  let condLowHealth = 0;
  let scalesFromArmor = 0;

  for (const eff of card.effects || []) {
    if (eff.type === 'damage') {
      totalDamage += eff.value * (eff.hitCount || 1);
      if (eff.piercing) hasPiercing = 1.0;
    } else if (eff.type === 'armor') {
      totalArmor += eff.value;
      if (eff.scaleFrom === 'armor') scalesFromArmor = 1.0;
    } else if (eff.type === 'heal') {
      totalHeal += eff.value;
    } else if (eff.type === 'draw') {
      totalDraw += eff.value;
    } else if (eff.type === 'erode_sanity') {
      totalErodeSanity += eff.value;
    } else if (eff.type === 'restore_sanity') {
      totalRestoreSanity += eff.value;
    } else if (eff.type === 'self_damage') {
      totalSelfDamage += eff.value;
    } else if (eff.type === 'apply_status') {
      if (eff.statusType === 'bleed') statusBleed += eff.value;
      if (eff.statusType === 'horror') statusHorror += eff.value;
      if (eff.statusType === 'might') statusMight += eff.value;
      if (eff.statusType === 'resilience') statusResilience += eff.value;
      if (eff.statusType === 'vulnerable') statusVulnerable += eff.value;
      if (eff.statusType === 'weak') statusWeak += eff.value;
    }

    if (eff.condition?.type === 'low_sanity') condLowSanity = 1.0;
    if (eff.condition?.type === 'low_health') condLowHealth = 1.0;
  }

  // 5. 實戰雙卡協同摘要 (若提供 synergyMatrix)
  let avgSynergy = 0;
  let maxSynergy = 0;
  if (synergyMatrix && synergyMatrix.has(card.id)) {
    const row = synergyMatrix.get(card.id)!;
    let sum = 0;
    let count = 0;
    for (const syn of row.values()) {
      sum += syn;
      if (syn > maxSynergy) maxSynergy = syn;
      count++;
    }
    avgSynergy = count > 0 ? (sum / count) / 20.0 : 0;
    maxSynergy = maxSynergy / 30.0;
  }

  return [
    isCombat,
    isSkill,
    isMagic,
    isTruth,
    isMadness,
    isStamina,
    isSanity,
    isFree,
    costNorm,
    tierNorm,
    totalDamage / 15.0,
    hasPiercing,
    totalArmor / 15.0,
    totalHeal / 10.0,
    totalDraw / 3.0,
    totalErodeSanity / 5.0,
    totalRestoreSanity / 5.0,
    totalSelfDamage / 10.0,
    statusBleed / 5.0,
    statusHorror / 5.0,
    statusMight / 5.0,
    statusResilience / 5.0,
    statusVulnerable / 5.0,
    statusWeak / 5.0,
    condLowSanity,
    condLowHealth,
    scalesFromArmor,
    avgSynergy,
    maxSynergy,
  ];
}

/**
 * 純 TypeScript 截斷奇異值分解 (Truncated SVD / Eigendecomposition)
 * 將全典籍卡牌力學特徵矩陣解析計算為稠密力學向量與半正定餘弦相似度矩陣 S
 */
export function computeCardMechanicsEmbeddings(
  cards: Card[],
  options?: CardEmbeddingOptions
): CardSimilarityResult {
  const n = cards.length;
  const dims = options?.dimensions ?? 16;
  const iterations = options?.iterations ?? 40;
  const synergyMatrix = options?.synergyMatrix;

  const cardIds = cards.map((c) => c.id);
  const cardIndexMap = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    cardIndexMap.set(cards[i].id, i);
  }

  if (n === 0) {
    return {
      cardIds: [],
      embeddings: new Map(),
      similarityMatrix: [],
      cardIndexMap,
      getSimilarity: () => 0,
      toRecord: () => ({}),
    };
  }

  // 1. 特徵矩陣提取 (N x M)
  const rawX: number[][] = cards.map((c) => extractCardMechanicsFeatures(c, synergyMatrix));
  const m = rawX[0].length;

  // 2. 特徵標準化 (Z-score normalization: 均值歸零，方差歸一)
  const means = new Float64Array(m);
  for (let j = 0; j < m; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += rawX[i][j];
    means[j] = s / n;
  }

  const stds = new Float64Array(m);
  for (let j = 0; j < m; j++) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      const diff = rawX[i][j] - means[j];
      s += diff * diff;
    }
    const std = Math.sqrt(s / n);
    stds[j] = std > 1e-7 ? std : 1.0;
  }

  const normX: Float64Array[] = Array.from({ length: n }, (_, i) => {
    const row = new Float64Array(m);
    for (let j = 0; j < m; j++) {
      row[j] = (rawX[i][j] - means[j]) / stds[j];
    }
    return row;
  });

  // 3. 構建 Gram 矩陣 G = X * X^T (N x N，對稱半正定)
  const G: Float64Array[] = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let dot = 0;
      for (let k = 0; k < m; k++) dot += normX[i][k] * normX[j][k];
      G[i][j] = dot;
      G[j][i] = dot;
    }
  }

  // 4. 冪迭代法 (Power Iteration) 提取前 dims 個主特徵向量與特徵值
  const targetDims = Math.min(dims, n, m);
  const eigenvectors: Float64Array[] = [];
  const eigenvalues: number[] = [];
  const currentG: Float64Array[] = G.map((row) => new Float64Array(row));

  for (let d = 0; d < targetDims; d++) {
    const v = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      v[i] = Math.sin((i + 1) * (d + 1) * 1.341);
    }

    // 正交投影至已求出的特徵向量空間之外 (Gram-Schmidt)
    for (const prevU of eigenvectors) {
      let pDot = 0;
      for (let i = 0; i < n; i++) pDot += v[i] * prevU[i];
      for (let i = 0; i < n; i++) v[i] -= pDot * prevU[i];
    }

    let len = 0;
    for (let i = 0; i < n; i++) len += v[i] * v[i];
    len = Math.sqrt(len);
    if (len > 1e-12) {
      for (let i = 0; i < n; i++) v[i] /= len;
    }

    // 冪迭代求解
    const nextV = new Float64Array(n);
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < n; i++) {
        let sum = 0;
        const row = currentG[i];
        for (let j = 0; j < n; j++) sum += row[j] * v[j];
        nextV[i] = sum;
      }

      // Gram-Schmidt 正交化保持數值穩定
      for (const prevU of eigenvectors) {
        let pDot = 0;
        for (let i = 0; i < n; i++) pDot += nextV[i] * prevU[i];
        for (let i = 0; i < n; i++) nextV[i] -= pDot * prevU[i];
      }

      len = 0;
      for (let i = 0; i < n; i++) len += nextV[i] * nextV[i];
      len = Math.sqrt(len);
      if (len > 1e-12) {
        for (let i = 0; i < n; i++) v[i] = nextV[i] / len;
      }
    }

    // 計算對應特徵值 lambda
    let lambda = 0;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      const row = currentG[i];
      for (let j = 0; j < n; j++) sum += row[j] * v[j];
      lambda += v[i] * sum;
    }
    lambda = Math.max(0, lambda);

    eigenvectors.push(v);
    eigenvalues.push(lambda);

    // 矩陣消減 (Hotelling Deflation): G' = G - lambda * (v * v^T)
    for (let i = 0; i < n; i++) {
      const v_i = v[i];
      const row = currentG[i];
      for (let j = 0; j < n; j++) {
        row[j] -= lambda * v_i * v[j];
      }
    }
  }

  // 5. 組裝稠密 Embedding 向量並執行 L2 正規化
  const embeddings = new Map<string, Float64Array>();
  const normalizedVectors: Float64Array[] = [];

  for (let i = 0; i < n; i++) {
    const vec = new Float64Array(targetDims);
    for (let d = 0; d < targetDims; d++) {
      vec[d] = eigenvectors[d][i] * Math.sqrt(eigenvalues[d]);
    }

    let normSq = 0;
    for (let d = 0; d < targetDims; d++) normSq += vec[d] * vec[d];
    const norm = Math.sqrt(normSq);
    if (norm > 1e-12) {
      for (let d = 0; d < targetDims; d++) vec[d] /= norm;
    } else {
      vec[0] = 1.0;
    }

    embeddings.set(cards[i].id, vec);
    normalizedVectors.push(vec);
  }

  // 6. 計算 N x N 餘弦相似度矩陣 S (值域嚴格 [0, 1]，對角線恆為 1.0)
  const similarityMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    similarityMatrix[i][i] = 1.0;
    const vI = normalizedVectors[i];

    for (let j = i + 1; j < n; j++) {
      const vJ = normalizedVectors[j];
      let dot = 0;
      for (let d = 0; d < targetDims; d++) dot += vI[d] * vJ[d];

      // Sidorov (2014) Soft Cosine Measure: S_ij = max(0, cos(v_i, v_j))
      const simVal = Math.max(0, Math.min(1, Number(dot.toFixed(4))));
      similarityMatrix[i][j] = simVal;
      similarityMatrix[j][i] = simVal;
    }
  }

  const getSimilarity = (idA: string, idB: string): number => {
    const idxA = cardIndexMap.get(idA);
    const idxB = cardIndexMap.get(idB);
    if (idxA === undefined || idxB === undefined) return 0;
    return similarityMatrix[idxA][idxB];
  };

  const toRecord = (): Record<string, Record<string, number>> => {
    const result: Record<string, Record<string, number>> = {};
    for (let i = 0; i < n; i++) {
      const idA = cardIds[i];
      result[idA] = {};
      for (let j = 0; j < n; j++) {
        result[idA][cardIds[j]] = similarityMatrix[i][j];
      }
    }
    return result;
  };

  return {
    cardIds,
    embeddings,
    similarityMatrix,
    cardIndexMap,
    getSimilarity,
    toRecord,
  };
}
