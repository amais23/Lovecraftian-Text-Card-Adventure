import type { Card, Enemy } from '../../types/game';
import { CardRegistry } from '../cards/registry';
import { ensureUniqueCardIds } from '../cardFactory';
import { cloneEnemy, getBossByDepth, DEPTH_1_NORMAL_ENEMIES, DEPTH_2_ELITE_ENEMIES } from '../enemyCatalog';
import { simulateCombat } from './combatSimulator';
import { computeWeightedJaccardDistance } from './deckTopology';

export interface MapElitesCell {
  xBin: number; // 0 ~ (xBins - 1)
  yBin: number; // 0 ~ (yBins - 1)
  armorRatio: number; // 0.0 ~ 1.0
  avgTier: number; // 1.0 ~ 3.5
  deck: Card[];
  handRetention: number;
  fitness: number; // 綜合戰鬥評分
  baselineWin: boolean;
  stretchWin: boolean;
  baselineHpLost: number;
  stretchHpLost: number;
  iterationsFound: number;
}

export interface MapElitesOptions {
  iterations?: number; // 預設 3000
  xBins?: number; // 攻防維度網格數，預設 8
  yBins?: number; // 階級維度網格數，預設 8
  randomFn?: () => number;
  onProgress?: (progress: { current: number; total: number; filledCells: number }) => void;
}

export interface MapElitesResult {
  totalIterations: number;
  durationMs: number;
  filledCellsCount: number;
  totalCellsCount: number;
  archive: Map<string, MapElitesCell>;
  peakArchetypes: DiscoveredArchetype[];
}

export interface DiscoveredArchetype {
  id: string;
  name: string;
  description: string;
  cellKey: string;
  armorRatio: number;
  avgTier: number;
  fitness: number;
  handRetention: number;
  deckSize: number;
  topCards: Array<{ name: string; count: number; category: string; tier: number }>;
  deck: Card[];
}

/**
 * 計算理智牌庫的客觀力學特徵維度 (攻防比與平均卡牌階級)
 */
export function calculateDeckBehaviorDescriptors(deck: Card[]): { armorRatio: number; avgTier: number } {
  if (deck.length === 0) {
    return { armorRatio: 0.5, avgTier: 1.0 };
  }

  let totalArmorValue = 0;
  let totalDamageValue = 0;
  let totalTierSum = 0;

  for (const card of deck) {
    totalTierSum += card.tier ?? 1;

    for (const eff of card.effects || []) {
      if (eff.type === 'armor') {
        totalArmorValue += eff.value;
      } else if (eff.type === 'damage') {
        totalDamageValue += eff.value * (eff.hitCount || 1);
      }
    }
  }

  const denom = totalArmorValue + totalDamageValue;
  const armorRatio = denom > 0 ? Number((totalArmorValue / denom).toFixed(4)) : 0.5;
  const avgTier = Number((totalTierSum / deck.length).toFixed(3));

  return {
    armorRatio: Math.max(0, Math.min(1.0, armorRatio)),
    avgTier: Math.max(1.0, Math.min(3.5, avgTier)),
  };
}

/**
 * 依據平均階級決定自適應與越級壓力受測敵怪
 */
function getAdaptiveBenchmarkEnemies(avgTier: number): { baselineEnemy: Enemy; stretchEnemy: Enemy } {
  if (avgTier < 1.6) {
    // 前期低階：基準為第 1 深度普通怪，越級為第 2 深度精英怪
    const baseline = DEPTH_1_NORMAL_ENEMIES[0];
    const stretch = DEPTH_2_ELITE_ENEMIES[0];
    return { baselineEnemy: cloneEnemy(baseline), stretchEnemy: cloneEnemy(stretch) };
  } else if (avgTier < 2.5) {
    // 中期成型：基準為第 2 深度精英怪，越級為第 3 深度首領
    const baseline = DEPTH_2_ELITE_ENEMIES[0];
    const stretch = cloneEnemy(getBossByDepth(2));
    return { baselineEnemy: cloneEnemy(baseline), stretchEnemy: cloneEnemy(stretch) };
  } else {
    // 後期神裝：基準為第 3 深度首領，越級為第 4 深度神話首領
    const baseline = cloneEnemy(getBossByDepth(2));
    const stretch = cloneEnemy(getBossByDepth(3));
    return { baselineEnemy: cloneEnemy(baseline), stretchEnemy: cloneEnemy(stretch) };
  }
}

/**
 * 評定單套牌庫在越階壓力架構下的綜合適應度分數 (Fitness)
 */
function evaluateDeckFitness(
  deck: Card[],
  handRetention: number,
  avgTier: number,
  randomFn: () => number
): {
  fitness: number;
  baselineWin: boolean;
  stretchWin: boolean;
  baselineHpLost: number;
  stretchHpLost: number;
} {
  const { baselineEnemy, stretchEnemy } = getAdaptiveBenchmarkEnemies(avgTier);

  // 1. 基準對弈
  const baseRes = simulateCombat({
    deck,
    enemy: baselineEnemy,
    handRetention,
    handCapacity: handRetention,
    policyMode: 'optimal',
    randomFn,
    uncappedHealth: true,
  });

  // 2. 越級壓力對弈
  const stretchRes = simulateCombat({
    deck,
    enemy: stretchEnemy,
    handRetention,
    handCapacity: handRetention,
    policyMode: 'optimal',
    randomFn,
    uncappedHealth: true,
  });

  // 適應度計算：勝率 50 分 + 生命值保存率 40 分 + 回合效率 10 分
  const calcSubScore = (res: typeof baseRes) => {
    let score = res.victory ? 50 : 10;
    const hpLossPenalty = Math.min(40, res.healthLost * 1.5);
    score += Math.max(0, 40 - hpLossPenalty);
    const turnBonus = Math.max(0, 10 - res.turns * 0.5);
    score += turnBonus;
    return Math.max(0, Math.min(100, score));
  };

  const baseScore = calcSubScore(baseRes);
  const stretchScore = calcSubScore(stretchRes);

  // ADR-0039 權重：40% 基準 + 60% 越級壓力
  const fitness = Number((0.4 * baseScore + 0.6 * stretchScore).toFixed(2));

  return {
    fitness,
    baselineWin: baseRes.victory,
    stretchWin: stretchRes.victory,
    baselineHpLost: baseRes.healthLost,
    stretchHpLost: stretchRes.healthLost,
  };
}

/**
 * 依據 ADR-0039 物理約束執行牌庫突變
 */
function mutateDeck(
  parentDeck: Card[],
  parentRetention: number,
  allCards: Card[],
  randomFn: () => number
): { deck: Card[]; handRetention: number } {
  const compendium = allCards.filter((c) => c.tier !== undefined);
  const newDeck = [...parentDeck];

  const countCards = (cards: Card[]) => {
    const map = new Map<string, number>();
    for (const c of cards) {
      if (!c) continue;
      const baseId = c.id.replace(/_copy_\d+$/, '');
      map.set(baseId, (map.get(baseId) ?? 0) + 1);
    }
    return map;
  };

  const cardCounts = countCards(newDeck);
  const roll = randomFn();

  if (newDeck.length === 0 || roll < 0.8 || newDeck.length <= 10) {
    if (newDeck.length === 0) {
      // 若為空牌庫，保底隨機抽一張
      const pick = compendium[Math.floor(randomFn() * compendium.length)];
      newDeck.push({ ...pick });
    } else {
      // 80% 置換卡牌：隨機抽換 1 張為全典籍有效卡 (確保同名卡 <= 3)
      const replaceIdx = Math.floor(randomFn() * newDeck.length);
      const oldCard = newDeck[replaceIdx];
      if (oldCard) {
        const oldBaseId = oldCard.id.replace(/_copy_\d+$/, '');
        cardCounts.set(oldBaseId, (cardCounts.get(oldBaseId) ?? 1) - 1);
      }

      const validCandidates = compendium.filter((c) => {
        const cBase = c.id.replace(/_copy_\d+$/, '');
        return (cardCounts.get(cBase) ?? 0) < 3;
      });

      if (validCandidates.length > 0) {
        const pick = validCandidates[Math.floor(randomFn() * validCandidates.length)];
        newDeck[replaceIdx] = { ...pick };
      }
    }
  } else if (roll < 0.9 && newDeck.length < 35) {
    // 10% 添購新卡 (10 ~ 35 張約束)
    const validCandidates = compendium.filter((c) => {
      const cBase = c.id.replace(/_copy_\d+$/, '');
      return (cardCounts.get(cBase) ?? 0) < 3;
    });
    if (validCandidates.length > 0) {
      const pick = validCandidates[Math.floor(randomFn() * validCandidates.length)];
      newDeck.push({ ...pick });
    }
  } else if (newDeck.length > 10) {
    // 10% 精簡除役卡牌
    const removeIdx = Math.floor(randomFn() * newDeck.length);
    newDeck.splice(removeIdx, 1);
  }

  // 20% 機率微調手牌保留數 (2 ~ 6)
  let newRetention = parentRetention;
  if (randomFn() < 0.2) {
    const delta = randomFn() < 0.5 ? -1 : 1;
    newRetention = Math.max(2, Math.min(6, parentRetention + delta));
  }

  return {
    deck: ensureUniqueCardIds(newDeck.filter((c): c is Card => c !== undefined)),
    handRetention: newRetention,
  };
}

/**
 * 執行 MAP-Elites 品質多樣性流派探勘演算法
 */
export function runMapElitesOptimization(options: MapElitesOptions = {}): MapElitesResult {
  const {
    iterations = 3000,
    xBins = 8,
    yBins = 8,
    randomFn = Math.random,
    onProgress,
  } = options;

  const startTime = performance.now();
  const allCards = CardRegistry.getAllCompendiumCards();
  const archive = new Map<string, MapElitesCell>();

  const getCellCoords = (armorRatio: number, avgTier: number) => {
    const xBin = Math.max(0, Math.min(xBins - 1, Math.floor(armorRatio * xBins)));
    const yNorm = (avgTier - 1.0) / (3.5 - 1.0);
    const yBin = Math.max(0, Math.min(yBins - 1, Math.floor(yNorm * yBins)));
    return { xBin, yBin, key: `${xBin}_${yBin}` };
  };

  // 1. 初始化種子族群 (各職業基礎卡與隨機初胚)
  const starters = (['investigator', 'occultist'] as const).map((occ) => CardRegistry.getStarterDeck(occ));
  const initialPool: Array<{ deck: Card[]; handRetention: number }> = [];

  for (const starter of starters) {
    initialPool.push({ deck: starter, handRetention: 3 });
  }

  // 加入 15 套均勻隨機初胚涵蓋不同規模與階級
  for (let i = 0; i < 15; i++) {
    const size = 12 + Math.floor(randomFn() * 12);
    const candidatePool = allCards.filter((c) => c.tier !== undefined);
    const picked: Card[] = [];
    for (let s = 0; s < size; s++) {
      picked.push(candidatePool[Math.floor(randomFn() * candidatePool.length)]);
    }
    initialPool.push({
      deck: ensureUniqueCardIds(picked),
      handRetention: 3 + Math.floor(randomFn() * 3),
    });
  }

  // 評估並置入種子
  for (const init of initialPool) {
    const desc = calculateDeckBehaviorDescriptors(init.deck);
    const { xBin, yBin, key } = getCellCoords(desc.armorRatio, desc.avgTier);
    const evalRes = evaluateDeckFitness(init.deck, init.handRetention, desc.avgTier, randomFn);

    const cell: MapElitesCell = {
      xBin,
      yBin,
      armorRatio: desc.armorRatio,
      avgTier: desc.avgTier,
      deck: init.deck,
      handRetention: init.handRetention,
      fitness: evalRes.fitness,
      baselineWin: evalRes.baselineWin,
      stretchWin: evalRes.stretchWin,
      baselineHpLost: evalRes.baselineHpLost,
      stretchHpLost: evalRes.stretchHpLost,
      iterationsFound: 0,
    };
    archive.set(key, cell);
  }

  // 2. 主演化迭代
  const progressInterval = Math.max(100, Math.floor(iterations / 20));

  for (let iter = 1; iter <= iterations; iter++) {
    // 從現有菁英中均勻隨機挑選一位親代
    const cells = Array.from(archive.values());
    const parent = cells[Math.floor(randomFn() * cells.length)];

    // 變異
    const child = mutateDeck(parent.deck, parent.handRetention, allCards, randomFn);
    const desc = calculateDeckBehaviorDescriptors(child.deck);
    const { xBin, yBin, key } = getCellCoords(desc.armorRatio, desc.avgTier);

    // 評估適應度
    const evalRes = evaluateDeckFitness(child.deck, child.handRetention, desc.avgTier, randomFn);

    // MAP-Elites 核心競爭：若格子空白或新子代適應度更高，取代該格菁英
    const existing = archive.get(key);
    if (!existing || evalRes.fitness > existing.fitness) {
      archive.set(key, {
        xBin,
        yBin,
        armorRatio: desc.armorRatio,
        avgTier: desc.avgTier,
        deck: child.deck,
        handRetention: child.handRetention,
        fitness: evalRes.fitness,
        baselineWin: evalRes.baselineWin,
        stretchWin: evalRes.stretchWin,
        baselineHpLost: evalRes.baselineHpLost,
        stretchHpLost: evalRes.stretchHpLost,
        iterationsFound: iter,
      });
    }

    if (onProgress && iter % progressInterval === 0) {
      onProgress({ current: iter, total: iterations, filledCells: archive.size });
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  const peakArchetypes = extractDistinctPeakArchetypes(archive, 6, 0.35);

  return {
    totalIterations: iterations,
    durationMs,
    filledCellsCount: archive.size,
    totalCellsCount: xBins * yBins,
    archive,
    peakArchetypes,
  };
}

/**
 * 從網格中萃取相互獨立且非重疊的局部極大值代表性流派
 */
export function extractDistinctPeakArchetypes(
  archive: Map<string, MapElitesCell>,
  maxArchetypes: number = 6,
  minJaccardDistance: number = 0.35
): DiscoveredArchetype[] {
  const sortedCells = Array.from(archive.values()).sort((a, b) => b.fitness - a.fitness);
  const selected: MapElitesCell[] = [];

  for (const cell of sortedCells) {
    let tooClose = false;
    for (const chosen of selected) {
      const dist = computeWeightedJaccardDistance(cell.deck, chosen.deck);
      if (dist < minJaccardDistance) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      selected.push(cell);
      if (selected.length >= maxArchetypes) {
        break;
      }
    }
  }

  return selected.map((cell, idx) => {
    // 統計卡牌構成
    const cardCounts = new Map<string, { card: Card; count: number }>();
    for (const c of cell.deck) {
      const baseId = c.id.replace(/_copy_\d+$/, '');
      const existing = cardCounts.get(baseId);
      if (existing) {
        existing.count++;
      } else {
        cardCounts.set(baseId, { card: c, count: 1 });
      }
    }

    const topCards = Array.from(cardCounts.values())
      .sort((a, b) => b.count - a.count || (b.card.tier ?? 1) - (a.card.tier ?? 1))
      .slice(0, 5)
      .map(({ card, count }) => ({
        name: card.name,
        count,
        category: card.category,
        tier: card.tier ?? 1,
      }));

    // 自動依風格命名
    let styleTitle = '平衡流派';
    if (cell.armorRatio > 0.65) styleTitle = cell.avgTier < 1.6 ? '越級鐵壁反擊' : '神聖堡壘反傷';
    else if (cell.armorRatio < 0.35) styleTitle = cell.avgTier < 1.6 ? '越級穿刺直傷' : '虛空終極湮滅';
    else styleTitle = cell.avgTier < 1.6 ? '越級節奏游擊' : '深淵全能構裝';

    const coreNames = topCards.slice(0, 2).map((c) => c.name).join('＋');

    return {
      id: `peak_archetype_${idx + 1}`,
      name: `【${styleTitle}】${coreNames}`,
      description: `平均階級 Tier ${cell.avgTier.toFixed(1)}，攻防比 ${(cell.armorRatio * 100).toFixed(0)}%，適應度評分 ${cell.fitness.toFixed(1)} 分 (越級勝率: ${cell.stretchWin ? '勝' : '負'})`,
      cellKey: `${cell.xBin}_${cell.yBin}`,
      armorRatio: cell.armorRatio,
      avgTier: cell.avgTier,
      fitness: cell.fitness,
      handRetention: cell.handRetention,
      deckSize: cell.deck.length,
      topCards,
      deck: cell.deck,
    };
  });
}
