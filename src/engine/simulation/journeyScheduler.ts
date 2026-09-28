import type { Card, DepthLevel, Relic } from '../../types/game';
import { INITIAL_INVESTIGATOR } from '../initialData';
import { CardRegistry } from '../cards/registry';
import { MONSTERS_BY_DEPTH, type MonsterReviewData } from '../../data/monsterReviewData';
import {
  type AgentPersonaType,
  getAgentPersona,
} from './agentPersona';
import { runSliceRollout, createPrng, type SliceRolloutResult } from './sliceRollout';

// ─────────────────────────────────────────────────────────────
// 0. 輔助計算函數 (Helpers)
// ─────────────────────────────────────────────────────────────
function computeMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─────────────────────────────────────────────────────────────
// 1. 七階切片定義 (Slice Definitions)
// ─────────────────────────────────────────────────────────────
export interface SliceDefinition {
  id: number;
  name: string;
  depth: DepthLevel;
  startLayer: number;
  endLayer: number;
  role: string;
  bossName?: string;
}

export const SLICE_DEFINITIONS: SliceDefinition[] = [
  { id: 1, name: 'Slice 1: Depth 1 前階 (Floor 0~7)', depth: 1, startLayer: 0, endLayer: 7, role: '開局探索' },
  { id: 2, name: 'Slice 2: Depth 1 後階 (Floor 8~15)', depth: 1, startLayer: 8, endLayer: 15, role: '第一深度決戰', bossName: '修格斯幼體' },
  { id: 3, name: 'Slice 3: Depth 2 前階 (Floor 0~7)', depth: 2, startLayer: 0, endLayer: 7, role: '深潛者潮汐滲透' },
  { id: 4, name: 'Slice 4: Depth 2 後階 (Floor 8~15)', depth: 2, startLayer: 8, endLayer: 15, role: '第二深度決戰', bossName: '大袞的深淵祭司' },
  { id: 5, name: 'Slice 5: Depth 3 前階 (Floor 0~7)', depth: 3, startLayer: 0, endLayer: 7, role: '修格斯原核異界' },
  { id: 6, name: 'Slice 6: Depth 3 後階 (Floor 8~15)', depth: 3, startLayer: 8, endLayer: 15, role: '第三深度決戰', bossName: '原生巨型修格斯' },
  { id: 7, name: 'Slice 7: Depth 4 深淵核心 (Floor 0~7)', depth: 4, startLayer: 0, endLayer: 7, role: '終極支配者對決', bossName: '克蘇魯星之眷族' },
];

// ─────────────────────────────────────────────────────────────
// 2. 全域混合存活池 (Global Mixed Pool)
// ─────────────────────────────────────────────────────────────
export interface SurvivingInvestigatorSnapshot {
  health: number;
  maxHealth: number;
  obols: number;
  deck: Card[];
  relics: Relic[];
  occupationId?: 'investigator' | 'occultist';
  sourcePersona: AgentPersonaType;
}

export class GlobalMixedPool {
  private pool: SurvivingInvestigatorSnapshot[] = [];

  add(snapshot: SurvivingInvestigatorSnapshot): void {
    this.pool.push({
      health: snapshot.health,
      maxHealth: snapshot.maxHealth,
      obols: snapshot.obols,
      deck: snapshot.deck.map((c) => ({ ...c })),
      relics: [...snapshot.relics],
      occupationId: snapshot.occupationId,
      sourcePersona: snapshot.sourcePersona,
    });
  }

  sample(
    rng: () => number = Math.random,
    fallbackBaseline: () => SurvivingInvestigatorSnapshot
  ): SurvivingInvestigatorSnapshot {
    if (this.pool.length === 0) {
      return fallbackBaseline();
    }
    const idx = Math.floor(rng() * this.pool.length);
    const picked = this.pool[idx];
    return {
      health: picked.health,
      maxHealth: picked.maxHealth,
      obols: picked.obols,
      deck: picked.deck.map((c) => ({ ...c })),
      relics: [...picked.relics],
      occupationId: picked.occupationId,
      sourcePersona: picked.sourcePersona,
    };
  }

  size(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool = [];
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 全要素客觀統計矩陣輸出資料結構 (Full-Factor Metrics)
// ─────────────────────────────────────────────────────────────
export interface MonsterSliceMetrics {
  id: string;
  name: string;
  depth: DepthLevel;
  role: 'normal' | 'elite' | 'boss';
  health: number;
  armor: number;
  encounters: number;
  encounterRate: number;
  meanHpLoss: number;
  medianHpLoss: number;
  minHpLoss: number;
  maxHpLoss: number;
  avgTurns: number;
  kills: number;
  lethality: number;
  winRate: number;
}

export interface DeckSizeSliceMetrics {
  deckSize: number;
  sampleN: number;
  pathShare: number;
  meanHpLoss: number;
  medianHpLoss: number;
  netHpLoss: number;
  mortality: number;
  madnessRate: number;
  avgTurns: number;
  avgArmor?: number;
}

export interface CardSliceMetrics {
  id: string;
  name: string;
  category: string;
  tier: number;
  offeredN: number;
  offeredRate: number;
  draftedN: number;
  draftedRate: number;
  deltaHp: number;
  mortHeld: number;
  deltaMortality: number;
  survOwnRate: number;
  fallOwnRate: number;
}

export interface PathChoiceMetrics {
  pair: string;
  label: string;
  choiceA: string;
  choiceB: string;
  countA: number;
  countB: number;
  pickRateA: number;
  pickRateB: number;
  deltaMortality: number;
}

export interface IntraNodeChoiceMetrics {
  category: 'reward' | 'sanctuary' | 'market' | 'event';
  action: string;
  count: number;
  pickRate: number;
  deltaHp: number;
  deltaMortality: number;
}

export interface NodeVisitSliceMetrics {
  type: string;
  label: string;
  visitCount: number;
  visitRate: number;
  meanHpLoss: number;
  lethality: number;
}

export interface GroupComparisonMetrics {
  dimension: string;
  survivingValue: string;
  fallenValue: string;
  delta: string;
  note: string;
}

export interface PersonaSliceMetrics {
  persona: AgentPersonaType;
  rolloutsEntered: number;
  rolloutsCompleted: number;
  survivalRate: number;
  meanCombatHpLoss: number;
  meanNetHpLoss: number;
}

export interface SliceSimulationSummary {
  sliceId: number;
  sliceDef: SliceDefinition;
  rolloutsEntered: number;
  rolloutsCompleted: number;
  sliceSurvivalRate: number;
  cumulativeSurvivalRate: number;
  meanCombatHpLoss: number;
  meanNetHpLoss: number;
  meanFinalHp: number;
  meanFinalDeckSize: number;
  madnessTriggerRate: number;
  topFatalMonster?: { name: string; kills: number; percentage: number };
  personas: Record<AgentPersonaType, PersonaSliceMetrics>;
  totalCombatsFought: number;
  monsters: MonsterSliceMetrics[];
  deckSizes: DeckSizeSliceMetrics[];
  cards: CardSliceMetrics[];
  pathChoices: PathChoiceMetrics[];
  intraNodeChoices: IntraNodeChoiceMetrics[];
  nodeVisits?: NodeVisitSliceMetrics[];
  groupComparison: GroupComparisonMetrics[];
}

export interface JourneySimulationOptions {
  timeBudgetSeconds?: number;
  samplesPerSlice?: number;
  occupation?: 'investigator' | 'occultist';
  seedBase?: number;
  onProgress?: (progress: { currentSliceId: number; completedRollouts: number; elapsedSeconds: number }) => void;
}

export interface JourneySimulationResult {
  totalRollouts: number;
  elapsedMilliseconds: number;
  overallSurvivalRate: number;
  slices: Record<number, SliceSimulationSummary>;
  progression: SliceSimulationSummary[];
  totalJourneyNetHpLoss: number;
}

export interface JourneySummaryJson {
  generatedAt: string;
  version: string;
  totalRollouts: number;
  elapsedMilliseconds: number;
  overallSurvivalRate: number;
  totalJourneyNetHpLoss: number;
  progression: SliceSimulationSummary[];
  slices: Record<number, SliceSimulationSummary>;
}

class GroupMetricAccumulator {
  count = 0;
  maxHpSum = 0;
  endHpSum = 0;
  deckSizeSum = 0;
  relicsSum = 0;
  eliteVisits = 0;
  sanctuaryVisits = 0;
  bandagePicks = 0;

  record(result: SliceRolloutResult, endHp: number): void {
    this.count++;
    this.maxHpSum += result.investigator.maxHealth;
    this.endHpSum += endHp;
    this.deckSizeSum += result.finalDeck.length;
    this.relicsSum += result.finalRelics.length;
    this.eliteVisits += result.nodesVisited.filter((n) => n.type === 'elite').length;
    this.sanctuaryVisits += result.nodesVisited.filter((n) => n.type === 'sanctuary').length;
    this.bandagePicks += result.intraNodeChoices.filter((c) => c.action.includes('包紮')).length;
  }

  get avgMaxHp(): number { return this.count > 0 ? this.maxHpSum / this.count : 25; }
  get avgDeckSize(): number { return this.count > 0 ? this.deckSizeSum / this.count : 12; }
  get avgRelics(): number { return this.count > 0 ? this.relicsSum / this.count : 0; }
  get avgEliteVisits(): number { return this.count > 0 ? this.eliteVisits / this.count : 0; }
  get avgSanctuaryVisits(): number { return this.count > 0 ? this.sanctuaryVisits / this.count : 0; }
  get avgBandagePicks(): number { return this.count > 0 ? this.bandagePicks / this.count : 0; }
}

const STANDARD_PERSONAS: AgentPersonaType[] = ['balanced', 'cautious', 'greedy', 'pure_random'];

/**
 * 執行全地圖七階切片蒙地卡羅平衡模擬 (Seven-Stage Slice Journey Simulation)
 */
export function runJourneySimulation(options: JourneySimulationOptions = {}): JourneySimulationResult {
  const {
    timeBudgetSeconds = 15,
    samplesPerSlice,
    occupation = 'investigator',
    seedBase = 1000,
    onProgress,
  } = options;

  const startTime = performance.now();
  const isTimeBudgetMode = samplesPerSlice === undefined;
  const sliceBudgetMs = (timeBudgetSeconds * 1000) / SLICE_DEFINITIONS.length;

  let currentPool = new GlobalMixedPool();
  const slicesResult: Record<number, SliceSimulationSummary> = {};
  const progression: SliceSimulationSummary[] = [];

  let cumulativeSurvivalRate = 1.0;
  let totalRolloutsCount = 0;
  let totalJourneyNetHpLossAcc = 0;

  function createFallbackBaseline(): SurvivingInvestigatorSnapshot {
    return {
      health: INITIAL_INVESTIGATOR.health,
      maxHealth: INITIAL_INVESTIGATOR.maxHealth,
      obols: 30,
      deck: CardRegistry.getStarterDeck(occupation),
      relics: [],
      occupationId: occupation,
      sourcePersona: 'balanced',
    };
  }

  const allMonstersList: MonsterReviewData[] = Object.values(MONSTERS_BY_DEPTH).flat();
  const allCompendiumCards = CardRegistry.getAllCompendiumCards();

  // 依序執行 7 個切片
  for (let sliceIdx = 0; sliceIdx < SLICE_DEFINITIONS.length; sliceIdx++) {
    const sliceDef = SLICE_DEFINITIONS[sliceIdx];
    const sliceStartTime = performance.now();
    const nextPool = new GlobalMixedPool();

    // ─────────────────────────────────────────────────────────
    // 流式計數器 (常數記憶體 O(1))
    // ─────────────────────────────────────────────────────────
    let enteredCount = 0;
    let completedCount = 0;
    let sumCombatHpLoss = 0;
    let sumNetHpLoss = 0;
    let sumFinalHp = 0;
    let sumFinalDeckSize = 0;
    let sumMadnessTriggered = 0;
    let totalCombatsFought = 0;
    const fatalMonsterCounts: Record<string, number> = {};

    const personaStats: Record<AgentPersonaType, { entered: number; completed: number; combatLoss: number; netLoss: number }> = {
      balanced: { entered: 0, completed: 0, combatLoss: 0, netLoss: 0 },
      cautious: { entered: 0, completed: 0, combatLoss: 0, netLoss: 0 },
      greedy: { entered: 0, completed: 0, combatLoss: 0, netLoss: 0 },
      pure_random: { entered: 0, completed: 0, combatLoss: 0, netLoss: 0 },
    };

    // 1. 全 26 隻怪物追蹤器（以 depth_id 複合鍵避免跨深度同名怪碰撞）
    const monsterMap: Record<string, {
      m: MonsterReviewData;
      encounters: number;
      kills: number;
      wins: number;
      hpLossSum: number;
      hpLosses: number[];
      turnsSum: number;
    }> = {};
    for (const m of allMonstersList) {
      const key = `${m.depth}_${m.id}`;
      monsterMap[key] = {
        m,
        encounters: 0,
        kills: 0,
        wins: 0,
        hpLossSum: 0,
        hpLosses: [],
        turnsSum: 0,
      };
    }

    // 2. 精確牌庫張數追蹤器 (8~25+)
    const deckSizeMap: Record<number, {
      sampleN: number;
      combatLossSum: number;
      netLossSum: number;
      hpLosses: number[];
      deaths: number;
      madness: number;
      turnsSum: number;
    }> = {};
    for (let s = 8; s <= 25; s++) {
      deckSizeMap[s] = {
        sampleN: 0,
        combatLossSum: 0,
        netLossSum: 0,
        hpLosses: [],
        deaths: 0,
        madness: 0,
        turnsSum: 0,
      };
    }

    // 3. 全量 73 張卡牌追蹤器
    const cardMap: Record<string, {
      card: Card;
      offeredN: number;
      draftedN: number;
      heldInSurviving: number;
      heldInFallen: number;
      rolloutsHeld: number;
      deathsWhenHeld: number;
      hpLossWhenHeldSum: number;
    }> = {};
    for (const c of allCompendiumCards) {
      cardMap[c.id] = {
        card: c,
        offeredN: 0,
        draftedN: 0,
        heldInSurviving: 0,
        heldInFallen: 0,
        rolloutsHeld: 0,
        deathsWhenHeld: 0,
        hpLossWhenHeldSum: 0,
      };
    }

    // 4. DAG 路徑分支抉擇追蹤器
    const pathMap: Record<string, {
      label: string;
      choiceA: string;
      choiceB: string;
      countA: number;
      countB: number;
      deathsA: number;
      deathsB: number;
    }> = {
      combat_vs_sanctuary: { label: '【常規戰 vs 安全避難所】', choiceA: '常規戰', choiceB: '安全避難所', countA: 0, countB: 0, deathsA: 0, deathsB: 0 },
      combat_vs_elite: { label: '【常規戰 vs 精英遭遇】', choiceA: '常規戰', choiceB: '精英遭遇', countA: 0, countB: 0, deathsA: 0, deathsB: 0 },
      elite_vs_sanctuary: { label: '【精英遭遇 vs 安全避難所】', choiceA: '精英遭遇', choiceB: '安全避難所', countA: 0, countB: 0, deathsA: 0, deathsB: 0 },
      market_vs_event: { label: '【黑市商鋪 vs 秘識奇遇】', choiceA: '黑市商鋪', choiceB: '秘識奇遇', countA: 0, countB: 0, deathsA: 0, deathsB: 0 },
      altar_vs_sanctuary: { label: '【禁忌祭壇 vs 安全避難所】', choiceA: '禁忌祭壇', choiceB: '安全避難所', countA: 0, countB: 0, deathsA: 0, deathsB: 0 },
    };

    // 5. 節點內部抉擇追蹤器
    const intraNodeMap: Record<string, {
      category: 'reward' | 'sanctuary' | 'market' | 'event';
      action: string;
      count: number;
      hpDeltaSum: number;
      deaths: number;
    }> = {};

    // 0. 節點造訪統計器
    const nodeTypeStats: Record<string, { label: string; visits: number; hpLossSum: number; deaths: number }> = {
      combat: { label: '常規遭遇 (Combat)', visits: 0, hpLossSum: 0, deaths: 0 },
      elite: { label: '精英遭遇 (Elite)', visits: 0, hpLossSum: 0, deaths: 0 },
      sanctuary: { label: '安全避難所 (Sanctuary)', visits: 0, hpLossSum: 0, deaths: 0 },
      market: { label: '黑市商鋪 (Market)', visits: 0, hpLossSum: 0, deaths: 0 },
      event: { label: '秘識奇遇 (Event)', visits: 0, hpLossSum: 0, deaths: 0 },
      altar: { label: '禁忌祭壇 (Altar)', visits: 0, hpLossSum: 0, deaths: 0 },
      boss: { label: '首領決戰 (Boss)', visits: 0, hpLossSum: 0, deaths: 0 },
      vault: { label: '遺物秘閣 (Vault)', visits: 0, hpLossSum: 0, deaths: 0 },
      blood_altar: { label: '血之祭壇 (Blood Altar)', visits: 0, hpLossSum: 0, deaths: 0 },
      remains: { label: '屍骨遺骸 (Remains)', visits: 0, hpLossSum: 0, deaths: 0 },
    };

    // 6. 存活組 vs 陣亡組全維度累加器
    const survivingGroup = new GroupMetricAccumulator();
    const fallenGroup = new GroupMetricAccumulator();

    let rolloutIndex = 0;

    while (true) {
      // 4 種流派輪轉抽樣
      const personaType = STANDARD_PERSONAS[rolloutIndex % STANDARD_PERSONAS.length];
      const persona = getAgentPersona(personaType);
      const rolloutSeed = (seedBase + sliceDef.id * 100000 + rolloutIndex) >>> 0;

      // 產生該條 Rollout 的 PRNG (Mulberry32)
      const rolloutPrng = createPrng(rolloutSeed);

      // 從全域混合存活池中抽樣起點（Slice 1 時為空，自動 fallback）
      const initialSnapshot = currentPool.sample(rolloutPrng, createFallbackBaseline);

      const rolloutConfig = {
        sliceId: sliceDef.id,
        depth: sliceDef.depth,
        startLayer: sliceDef.startLayer,
        endLayer: sliceDef.endLayer,
        persona,
        seed: rolloutSeed,
        initialInvestigator: {
          health: initialSnapshot.health,
          maxHealth: initialSnapshot.maxHealth,
          obols: initialSnapshot.obols,
          relics: initialSnapshot.relics,
          occupationId: occupation,
        },
        initialDeck: initialSnapshot.deck,
        initialRelics: initialSnapshot.relics,
        occupation,
      };

      const result: SliceRolloutResult = runSliceRollout(rolloutConfig);

      // 即時累加流式統計
      enteredCount++;
      totalRolloutsCount++;
      personaStats[personaType].entered++;
      totalCombatsFought += result.combatsFought;

      // 局部損血指標
      sumCombatHpLoss += result.combatHpLoss;
      sumNetHpLoss += result.netHpLoss;
      personaStats[personaType].combatLoss += result.combatHpLoss;
      personaStats[personaType].netLoss += result.netHpLoss;

      if (result.madnessTurnsTotal > 0) {
        sumMadnessTriggered++;
      }

      // 累加節點造訪與損害
      for (const log of result.decisionLogs) {
        const stats = nodeTypeStats[log.nodeType];
        if (stats) {
          stats.visits++;
          if (log.deltaHp < 0) {
            stats.hpLossSum += Math.abs(log.deltaHp);
          }
        }
      }
      if (!result.success && result.fatalEncounter) {
        const lastNode = result.nodesVisited[result.nodesVisited.length - 1];
        if (lastNode && nodeTypeStats[lastNode.type]) {
          nodeTypeStats[lastNode.type].deaths++;
        }
      }

      // 累加怪物遭遇
      for (const combat of result.combatRecords) {
        const key = `${combat.depth}_${combat.enemyId}`;
        const monsterTracker = monsterMap[key];
        if (monsterTracker) {
          monsterTracker.encounters++;
          monsterTracker.hpLossSum += combat.healthLost;
          if (monsterTracker.hpLosses.length < 200) {
            monsterTracker.hpLosses.push(combat.healthLost);
          }
          monsterTracker.turnsSum += combat.turnsTaken;
          if (combat.outcome === 'victory') {
            monsterTracker.wins++;
          } else {
            monsterTracker.kills++;
          }
        }
      }

      // 累加卡牌戰利品掉落與選入
      for (const rewardRecord of result.cardRewards) {
        for (const offeredId of rewardRecord.offeredCardIds) {
          if (cardMap[offeredId]) cardMap[offeredId].offeredN++;
        }
        if (rewardRecord.chosenCardId && cardMap[rewardRecord.chosenCardId]) {
          cardMap[rewardRecord.chosenCardId].draftedN++;
        }
      }

      // 累加路徑分支抉擇
      for (const pathChoice of result.pathChoices) {
        if (pathMap[pathChoice.pair]) {
          if (pathChoice.pickedA) {
            pathMap[pathChoice.pair].countA++;
            if (!result.success) pathMap[pathChoice.pair].deathsA++;
          } else {
            pathMap[pathChoice.pair].countB++;
            if (!result.success) pathMap[pathChoice.pair].deathsB++;
          }
        }
      }

      // 累加節點內部抉擇
      for (const intraChoice of result.intraNodeChoices) {
        if (!intraNodeMap[intraChoice.action]) {
          intraNodeMap[intraChoice.action] = {
            category: intraChoice.category,
            action: intraChoice.action,
            count: 0,
            hpDeltaSum: 0,
            deaths: 0,
          };
        }
        intraNodeMap[intraChoice.action].count++;
        intraNodeMap[intraChoice.action].hpDeltaSum += intraChoice.deltaHp;
        if (!result.success) intraNodeMap[intraChoice.action].deaths++;
      }

      // 累加精確牌庫大小統計
      const clampedSize = Math.max(8, Math.min(25, result.finalDeck.length));
      const deckSizeTracker = deckSizeMap[clampedSize];
      deckSizeTracker.sampleN++;
      deckSizeTracker.combatLossSum += result.combatHpLoss;
      deckSizeTracker.netLossSum += result.netHpLoss;
      if (deckSizeTracker.hpLosses.length < 200) {
        deckSizeTracker.hpLosses.push(result.combatHpLoss);
      }
      if (!result.success) deckSizeTracker.deaths++;
      if (result.madnessTurnsTotal > 0) deckSizeTracker.madness++;
      for (const c of result.combatRecords) {
        deckSizeTracker.turnsSum += c.turnsTaken;
      }

      // 累加卡牌持有與死亡率關聯（去除 ensureUniqueCardIds 追加的 _copy_ 後綴以對齊圖鑑母表）
      const uniqueCardIdsInFinal = new Set(
        result.finalDeck.map((c) => c.id.replace(/_copy_\d+$/, ''))
      );
      for (const cardId of uniqueCardIdsInFinal) {
        if (cardMap[cardId]) {
          cardMap[cardId].rolloutsHeld++;
          cardMap[cardId].hpLossWhenHeldSum += result.combatHpLoss;
          if (!result.success) {
            cardMap[cardId].deathsWhenHeld++;
            cardMap[cardId].heldInFallen++;
          } else {
            cardMap[cardId].heldInSurviving++;
          }
        }
      }

      // 累加存活組 vs 陣亡組分析
      if (result.success && result.investigator.health > 0) {
        completedCount++;
        personaStats[personaType].completed++;
        sumFinalHp += result.investigator.health;
        sumFinalDeckSize += result.finalDeck.length;

        survivingGroup.record(result, result.investigator.health);

        // 存活者匯入下一切片的全域混合存活池
        nextPool.add({
          health: result.investigator.health,
          maxHealth: result.investigator.maxHealth,
          obols: result.investigator.obols,
          deck: result.finalDeck,
          relics: result.finalRelics,
          occupationId: occupation,
          sourcePersona: personaType,
        });
      } else {
        fallenGroup.record(result, 0);

        if (result.fatalEncounter) {
          const monsterName = result.fatalEncounter.enemyName ?? '未知強敵';
          fatalMonsterCounts[monsterName] = (fatalMonsterCounts[monsterName] ?? 0) + 1;
        }
      }

      rolloutIndex++;

      // 檢查終止條件
      if (isTimeBudgetMode) {
        const elapsedSlice = performance.now() - sliceStartTime;
        if (elapsedSlice >= sliceBudgetMs && rolloutIndex >= STANDARD_PERSONAS.length) {
          break;
        }
      } else {
        if (rolloutIndex >= samplesPerSlice) {
          break;
        }
      }
    }

    // 計算切片彙整指標
    const sliceSurvivalRate = enteredCount > 0 ? completedCount / enteredCount : 0;
    cumulativeSurvivalRate = cumulativeSurvivalRate * sliceSurvivalRate;

    const meanCombatHpLoss = enteredCount > 0 ? sumCombatHpLoss / enteredCount : 0;
    const meanNetHpLoss = enteredCount > 0 ? sumNetHpLoss / enteredCount : 0;
    totalJourneyNetHpLossAcc += meanNetHpLoss;

    const meanFinalHp = completedCount > 0 ? sumFinalHp / completedCount : 0;
    const meanFinalDeckSize = completedCount > 0 ? sumFinalDeckSize / completedCount : 0;
    const madnessTriggerRate = enteredCount > 0 ? sumMadnessTriggered / enteredCount : 0;

    // 計算頭號致命怪
    let topFatalMonster: { name: string; kills: number; percentage: number } | undefined = undefined;
    const deathCount = enteredCount - completedCount;
    if (deathCount > 0) {
      let maxKills = 0;
      let topMonsterName = '';
      for (const [mName, kills] of Object.entries(fatalMonsterCounts)) {
        if (kills > maxKills) {
          maxKills = kills;
          topMonsterName = mName;
        }
      }
      if (maxKills > 0) {
        topFatalMonster = {
          name: topMonsterName,
          kills: maxKills,
          percentage: (maxKills / deathCount) * 100,
        };
      }
    }

    // 各性格獨立指標
    const personasSummary = {} as Record<AgentPersonaType, PersonaSliceMetrics>;
    for (const pType of STANDARD_PERSONAS) {
      const pData = personaStats[pType];
      personasSummary[pType] = {
        persona: pType,
        rolloutsEntered: pData.entered,
        rolloutsCompleted: pData.completed,
        survivalRate: pData.entered > 0 ? pData.completed / pData.entered : 0,
        meanCombatHpLoss: pData.entered > 0 ? pData.combatLoss / pData.entered : 0,
        meanNetHpLoss: pData.entered > 0 ? pData.netLoss / pData.entered : 0,
      };
    }

    // ─────────────────────────────────────────────────────────
    // 聚合產出矩陣大表 (Aggregation Matrices)
    // ─────────────────────────────────────────────────────────

    // 1. 全 26 隻敵怪分別獨立統計資料
    const totalEncountersInSlice = Object.values(monsterMap).reduce((acc, m) => acc + m.encounters, 0);
    const monstersResult: MonsterSliceMetrics[] = allMonstersList.map((m) => {
      const key = `${m.depth}_${m.id}`;
      const monsterTracker = monsterMap[key];
      const enc = monsterTracker.encounters;
      const meanHp = enc > 0 ? monsterTracker.hpLossSum / enc : 0;
      const medianHp = computeMedian(monsterTracker.hpLosses);
      const minHp = monsterTracker.hpLosses.length > 0 ? Math.min(...monsterTracker.hpLosses) : 0;
      const maxHp = monsterTracker.hpLosses.length > 0 ? Math.max(...monsterTracker.hpLosses) : 0;
      const avgTurns = enc > 0 ? monsterTracker.turnsSum / enc : 0;
      const winRate = enc > 0 ? monsterTracker.wins / enc : 0;
      const lethality = enc > 0 ? monsterTracker.kills / enc : 0;
      const encRate = totalEncountersInSlice > 0 ? enc / totalEncountersInSlice : 0;

      return {
        id: m.id,
        name: m.name,
        depth: m.depth,
        role: m.role,
        health: m.health,
        armor: m.armor,
        encounters: enc,
        encounterRate: Math.round(encRate * 1000) / 1000,
        meanHpLoss: Math.round(meanHp * 10) / 10,
        medianHpLoss: Math.round(medianHp * 10) / 10,
        minHpLoss: minHp,
        maxHpLoss: maxHp,
        avgTurns: Math.round(avgTurns * 10) / 10,
        kills: monsterTracker.kills,
        lethality: Math.round(lethality * 1000) / 1000,
        winRate: Math.round(winRate * 1000) / 1000,
      };
    });

    // 2. 精確卡牌張數分別獨立統計資料 (8~25+)
    const deckSizesResult: DeckSizeSliceMetrics[] = [];
    for (let s = 8; s <= 25; s++) {
      const t = deckSizeMap[s];
      const pathShare = enteredCount > 0 ? t.sampleN / enteredCount : 0;
      const meanLoss = t.sampleN > 0 ? t.combatLossSum / t.sampleN : 0;
      const medianLoss = computeMedian(t.hpLosses);
      const netLoss = t.sampleN > 0 ? t.netLossSum / t.sampleN : 0;
      const mortality = t.sampleN > 0 ? t.deaths / t.sampleN : 0;
      const madnessRate = t.sampleN > 0 ? t.madness / t.sampleN : 0;
      const avgTurns = t.sampleN > 0 ? t.turnsSum / t.sampleN : 0;

      deckSizesResult.push({
        deckSize: s,
        sampleN: t.sampleN,
        pathShare: Math.round(pathShare * 1000) / 1000,
        meanHpLoss: Math.round(meanLoss * 10) / 10,
        medianHpLoss: Math.round(medianLoss * 10) / 10,
        netHpLoss: Math.round(netLoss * 10) / 10,
        mortality: Math.round(mortality * 1000) / 1000,
        madnessRate: Math.round(madnessRate * 1000) / 1000,
        avgTurns: Math.round(avgTurns * 10) / 10,
      });
    }

    // 3. 全量 73 張卡牌分別獨立統計資料
    const totalOfferedInSlice = Object.values(cardMap).reduce((acc, c) => acc + c.offeredN, 0);
    const baselineMortality = sliceSurvivalRate < 1 ? 1 - sliceSurvivalRate : 0;
    const baselineMeanCombatHp = meanCombatHpLoss;

    const cardsResult: CardSliceMetrics[] = allCompendiumCards.map((card) => {
      const t = cardMap[card.id];
      const offeredRate = totalOfferedInSlice > 0 ? t.offeredN / totalOfferedInSlice : 0;
      const draftedRate = t.offeredN > 0 ? t.draftedN / t.offeredN : 0;
      const mortHeld = t.rolloutsHeld > 0 ? t.deathsWhenHeld / t.rolloutsHeld : baselineMortality;
      const deltaMort = mortHeld - baselineMortality;
      const meanHpWith = t.rolloutsHeld > 0 ? t.hpLossWhenHeldSum / t.rolloutsHeld : baselineMeanCombatHp;
      const deltaHp = meanHpWith - baselineMeanCombatHp;

      const survOwn = completedCount > 0 ? t.heldInSurviving / completedCount : 0;
      const fallOwn = deathCount > 0 ? t.heldInFallen / deathCount : 0;

      return {
        id: card.id,
        name: card.name,
        category: card.category,
        tier: card.tier ?? 1,
        offeredN: t.offeredN,
        offeredRate: Math.round(offeredRate * 1000) / 1000,
        draftedN: t.draftedN,
        draftedRate: Math.round(draftedRate * 1000) / 1000,
        deltaHp: Math.round(deltaHp * 10) / 10,
        mortHeld: Math.round(mortHeld * 1000) / 1000,
        deltaMortality: Math.round(deltaMort * 1000) / 1000,
        survOwnRate: Math.round(survOwn * 1000) / 1000,
        fallOwnRate: Math.round(fallOwn * 1000) / 1000,
      };
    });

    // 4. DAG 路徑分支選擇統計
    const pathChoicesResult: PathChoiceMetrics[] = Object.entries(pathMap).map(([pair, data]) => {
      const total = data.countA + data.countB;
      const pickRateA = total > 0 ? data.countA / total : 0;
      const pickRateB = total > 0 ? data.countB / total : 0;
      const mortA = data.countA > 0 ? data.deathsA / data.countA : 0;
      const mortB = data.countB > 0 ? data.deathsB / data.countB : 0;
      return {
        pair,
        label: data.label,
        choiceA: data.choiceA,
        choiceB: data.choiceB,
        countA: data.countA,
        countB: data.countB,
        pickRateA: Math.round(pickRateA * 1000) / 1000,
        pickRateB: Math.round(pickRateB * 1000) / 1000,
        deltaMortality: Math.round((mortA - mortB) * 1000) / 1000,
      };
    });

    // 5. 各節點內部抉擇統計
    const intraNodeChoicesResult: IntraNodeChoiceMetrics[] = Object.values(intraNodeMap).map((data) => {
      const pickRate = enteredCount > 0 ? data.count / enteredCount : 0;
      const deltaHp = data.count > 0 ? data.hpDeltaSum / data.count : 0;
      const mort = data.count > 0 ? data.deaths / data.count : 0;
      return {
        category: data.category,
        action: data.action,
        count: data.count,
        pickRate: Math.round(pickRate * 1000) / 1000,
        deltaHp: Math.round(deltaHp * 10) / 10,
        deltaMortality: Math.round((mort - baselineMortality) * 1000) / 1000,
      };
    });

    // 6. 存活組 vs 陣亡組全維度客觀對比
    const survivingMaxHp = survivingGroup.avgMaxHp;
    const fallenMaxHp = fallenGroup.avgMaxHp;
    const survivingDeckSize = survivingGroup.avgDeckSize;
    const fallenDeckSize = fallenGroup.avgDeckSize;
    const survivingRelicsCount = survivingGroup.avgRelics;
    const fallenRelicsCount = fallenGroup.avgRelics;
    const survivingEliteVisits = survivingGroup.avgEliteVisits;
    const fallenEliteVisits = fallenGroup.avgEliteVisits;
    const survivingSanctuaryVisits = survivingGroup.avgSanctuaryVisits;
    const fallenSanctuaryVisits = fallenGroup.avgSanctuaryVisits;

    const groupComparisonResult: GroupComparisonMetrics[] = [
      {
        dimension: '平均最大生命值',
        survivingValue: `${survivingMaxHp.toFixed(1)} 生命值`,
        fallenValue: `${fallenMaxHp.toFixed(1)} 生命值`,
        delta: `${survivingMaxHp - fallenMaxHp >= 0 ? '+' : ''}${(survivingMaxHp - fallenMaxHp).toFixed(1)} 生命值`,
        note: '高生命上限提供容錯護城河',
      },
      {
        dimension: '平均理智牌庫大小 (Deck Size)',
        survivingValue: `${survivingDeckSize.toFixed(1)} 張`,
        fallenValue: `${fallenDeckSize.toFixed(1)} 張`,
        delta: `${survivingDeckSize - fallenDeckSize >= 0 ? '+' : ''}${(survivingDeckSize - fallenDeckSize).toFixed(1)} 張`,
        note: '過厚牌庫稀釋抽到關鍵防禦牌的機率',
      },
      {
        dimension: '平均持有舊日遺物數 (Relics)',
        survivingValue: `${survivingRelicsCount.toFixed(1)} 件`,
        fallenValue: `${fallenRelicsCount.toFixed(1)} 件`,
        delta: `${survivingRelicsCount - fallenRelicsCount >= 0 ? '+' : ''}${(survivingRelicsCount - fallenRelicsCount).toFixed(1)} 件`,
        note: '被動遺物持續提供數值優勢',
      },
      {
        dimension: '節點造訪: 精英遭遇平均次數',
        survivingValue: `${survivingEliteVisits.toFixed(1)} 次`,
        fallenValue: `${fallenEliteVisits.toFixed(1)} 次`,
        delta: `${survivingEliteVisits - fallenEliteVisits >= 0 ? '+' : ''}${(survivingEliteVisits - fallenEliteVisits).toFixed(1)} 次`,
        note: '頻繁挑釁精英怪顯著抬升暴斃風險',
      },
      {
        dimension: '節點造訪: 避難所平均次數',
        survivingValue: `${survivingSanctuaryVisits.toFixed(1)} 次`,
        fallenValue: `${fallenSanctuaryVisits.toFixed(1)} 次`,
        delta: `${survivingSanctuaryVisits - fallenSanctuaryVisits >= 0 ? '+' : ''}${(survivingSanctuaryVisits - fallenSanctuaryVisits).toFixed(1)} 次`,
        note: '避難所包紮與除役是續航核心關鍵',
      },
      {
        dimension: '戰後抉擇: 戰地包紮平均次數',
        survivingValue: `${survivingGroup.avgBandagePicks.toFixed(1)} 次`,
        fallenValue: `${fallenGroup.avgBandagePicks.toFixed(1)} 次`,
        delta: `${survivingGroup.avgBandagePicks - fallenGroup.avgBandagePicks >= 0 ? '+' : ''}${(survivingGroup.avgBandagePicks - fallenGroup.avgBandagePicks).toFixed(1)} 次`,
        note: '戰後及時包紮回復生命值可有效預防突發暴斃',
      },
    ];

    // 7. 節點造訪率與損耗統計 (動態計算)
    const totalNodeVisitsInSlice = Object.values(nodeTypeStats).reduce((sum, n) => sum + n.visits, 0);
    const nodeVisitsResult: NodeVisitSliceMetrics[] = Object.entries(nodeTypeStats).map(([type, data]) => {
      const visitRate = totalNodeVisitsInSlice > 0 ? data.visits / totalNodeVisitsInSlice : 0;
      const meanLoss = data.visits > 0 ? data.hpLossSum / data.visits : 0;
      const lethality = data.visits > 0 ? data.deaths / data.visits : 0;
      return {
        type,
        label: data.label,
        visitCount: data.visits,
        visitRate: Math.round(visitRate * 1000) / 1000,
        meanHpLoss: Math.round(meanLoss * 10) / 10,
        lethality: Math.round(lethality * 1000) / 1000,
      };
    });

    const summary: SliceSimulationSummary = {
      sliceId: sliceDef.id,
      sliceDef,
      rolloutsEntered: enteredCount,
      rolloutsCompleted: completedCount,
      sliceSurvivalRate,
      cumulativeSurvivalRate,
      meanCombatHpLoss,
      meanNetHpLoss,
      meanFinalHp,
      meanFinalDeckSize,
      madnessTriggerRate,
      topFatalMonster,
      personas: personasSummary,
      totalCombatsFought,
      monsters: monstersResult,
      deckSizes: deckSizesResult,
      cards: cardsResult,
      pathChoices: pathChoicesResult,
      intraNodeChoices: intraNodeChoicesResult,
      nodeVisits: nodeVisitsResult,
      groupComparison: groupComparisonResult,
    };

    slicesResult[sliceDef.id] = summary;
    progression.push(summary);

    if (onProgress) {
      onProgress({
        currentSliceId: sliceDef.id,
        completedRollouts: totalRolloutsCount,
        elapsedSeconds: (performance.now() - startTime) / 1000,
      });
    }

    // 存活池交接至下一切片
    currentPool = nextPool;
  }

  const elapsedMilliseconds = performance.now() - startTime;
  const overallSurvivalRate = progression.length > 0 ? progression[progression.length - 1].cumulativeSurvivalRate : 0;

  return {
    totalRollouts: totalRolloutsCount,
    elapsedMilliseconds,
    overallSurvivalRate,
    slices: slicesResult,
    progression,
    totalJourneyNetHpLoss: totalJourneyNetHpLossAcc,
  };
}

/**
 * 聚合多份獨立蒙地卡羅全地圖模擬結果 (用於多核心並行採樣 Map-Reduce)
 */
/**
 * 聚合多流派表現快照指標
 */
function mergePersonaMetrics(
  sliceSummaries: SliceSimulationSummary[]
): Record<AgentPersonaType, PersonaSliceMetrics> {
  const personaTypes: AgentPersonaType[] = ['balanced', 'cautious', 'greedy', 'pure_random'];
  const personasSummary = {} as Record<AgentPersonaType, PersonaSliceMetrics>;

  for (const pType of personaTypes) {
    const pEntered = sliceSummaries.reduce(
      (sum, s) => sum + (s.personas[pType]?.rolloutsEntered ?? 0),
      0
    );
    const pCompleted = sliceSummaries.reduce(
      (sum, s) => sum + (s.personas[pType]?.rolloutsCompleted ?? 0),
      0
    );
    const pCombatLoss =
      pEntered > 0
        ? sliceSummaries.reduce(
            (sum, s) =>
              sum +
              (s.personas[pType]?.meanCombatHpLoss ?? 0) *
                (s.personas[pType]?.rolloutsEntered ?? 0),
            0
          ) / pEntered
        : 0;
    const pNetLoss =
      pEntered > 0
        ? sliceSummaries.reduce(
            (sum, s) =>
              sum +
              (s.personas[pType]?.meanNetHpLoss ?? 0) *
                (s.personas[pType]?.rolloutsEntered ?? 0),
            0
          ) / pEntered
        : 0;

    personasSummary[pType] = {
      persona: pType,
      rolloutsEntered: pEntered,
      rolloutsCompleted: pCompleted,
      survivalRate: pEntered > 0 ? pCompleted / pEntered : 0,
      meanCombatHpLoss: pCombatLoss,
      meanNetHpLoss: pNetLoss,
    };
  }

  return personasSummary;
}

/**
 * 聚合 26 隻敵怪統計與致命首領
 */
function mergeMonsterMetrics(
  sliceSummaries: SliceSimulationSummary[],
  totalCombatsFought: number,
  rolloutsEntered: number,
  rolloutsCompleted: number
): {
  monsters: MonsterSliceMetrics[];
  topFatalMonster?: { name: string; kills: number; percentage: number };
} {
  const monsterMap: Record<
    string,
    {
      id: string;
      name: string;
      depth: DepthLevel;
      role: 'normal' | 'elite' | 'boss';
      health: number;
      armor: number;
      encounters: number;
      kills: number;
      wins: number;
      hpLossWeightedSum: number;
      medianHpLossWeightedSum: number;
      minHpLoss: number;
      maxHpLoss: number;
      turnsWeightedSum: number;
    }
  > = {};

  for (const s of sliceSummaries) {
    for (const m of s.monsters) {
      const key = `${m.depth}_${m.id}`;
      if (!monsterMap[key]) {
        monsterMap[key] = {
          id: m.id,
          name: m.name,
          depth: m.depth,
          role: m.role,
          health: m.health,
          armor: m.armor,
          encounters: 0,
          kills: 0,
          wins: 0,
          hpLossWeightedSum: 0,
          medianHpLossWeightedSum: 0,
          minHpLoss: m.minHpLoss,
          maxHpLoss: m.maxHpLoss,
          turnsWeightedSum: 0,
        };
      }
      const acc = monsterMap[key];
      acc.encounters += m.encounters;
      acc.kills += m.kills;
      acc.wins += Math.round(m.winRate * m.encounters);
      acc.hpLossWeightedSum += m.meanHpLoss * m.encounters;
      acc.medianHpLossWeightedSum += m.medianHpLoss * m.encounters;
      acc.minHpLoss = Math.min(acc.minHpLoss, m.minHpLoss);
      acc.maxHpLoss = Math.max(acc.maxHpLoss, m.maxHpLoss);
      acc.turnsWeightedSum += m.avgTurns * m.encounters;
    }
  }

  const monstersResult: MonsterSliceMetrics[] = Object.values(monsterMap).map((m) => {
    const encounters = m.encounters;
    return {
      id: m.id,
      name: m.name,
      depth: m.depth,
      role: m.role,
      health: m.health,
      armor: m.armor,
      encounters,
      encounterRate: totalCombatsFought > 0 ? encounters / totalCombatsFought : 0,
      meanHpLoss: encounters > 0 ? m.hpLossWeightedSum / encounters : 0,
      medianHpLoss: encounters > 0 ? m.medianHpLossWeightedSum / encounters : 0,
      minHpLoss: m.minHpLoss,
      maxHpLoss: m.maxHpLoss,
      winRate: encounters > 0 ? m.wins / encounters : 1,
      kills: m.kills,
      lethality: encounters > 0 ? m.kills / encounters : 0,
      avgTurns: encounters > 0 ? m.turnsWeightedSum / encounters : 0,
    };
  });

  let topFatalMonster: { name: string; kills: number; percentage: number } | undefined = undefined;
  const fatalCandidates = monstersResult
    .map((m) => ({ name: m.name, kills: m.kills }))
    .filter((m) => m.kills > 0)
    .sort((a, b) => b.kills - a.kills);

  if (fatalCandidates.length > 0) {
    const deaths = Math.max(1, rolloutsEntered - rolloutsCompleted);
    topFatalMonster = {
      name: fatalCandidates[0].name,
      kills: fatalCandidates[0].kills,
      percentage: (fatalCandidates[0].kills / deaths) * 100,
    };
  }

  return { monsters: monstersResult, topFatalMonster };
}

/**
 * 聚合精確牌庫大小指標 (8 ~ 25+ 張)
 */
function mergeDeckSizeMetrics(
  sliceSummaries: SliceSimulationSummary[],
  rolloutsEntered: number
): DeckSizeSliceMetrics[] {
  const deckSizeMap: Record<
    number,
    {
      deckSize: number;
      sampleN: number;
      deaths: number;
      hpLossWeightedSum: number;
      netLossWeightedSum: number;
      medianWeightedSum: number;
      madnessWeightedSum: number;
      turnsWeightedSum: number;
    }
  > = {};

  for (const s of sliceSummaries) {
    for (const ds of s.deckSizes) {
      if (!deckSizeMap[ds.deckSize]) {
        deckSizeMap[ds.deckSize] = {
          deckSize: ds.deckSize,
          sampleN: 0,
          deaths: 0,
          hpLossWeightedSum: 0,
          netLossWeightedSum: 0,
          medianWeightedSum: 0,
          madnessWeightedSum: 0,
          turnsWeightedSum: 0,
        };
      }
      const acc = deckSizeMap[ds.deckSize];
      acc.sampleN += ds.sampleN;
      acc.deaths += Math.round(ds.mortality * ds.sampleN);
      acc.hpLossWeightedSum += ds.meanHpLoss * ds.sampleN;
      acc.netLossWeightedSum += ds.netHpLoss * ds.sampleN;
      acc.medianWeightedSum += ds.medianHpLoss * ds.sampleN;
      acc.madnessWeightedSum += ds.madnessRate * ds.sampleN;
      acc.turnsWeightedSum += ds.avgTurns * ds.sampleN;
    }
  }

  return Object.values(deckSizeMap)
    .map((ds) => ({
      deckSize: ds.deckSize,
      sampleN: ds.sampleN,
      pathShare: rolloutsEntered > 0 ? ds.sampleN / rolloutsEntered : 0,
      mortality: ds.sampleN > 0 ? ds.deaths / ds.sampleN : 0,
      meanHpLoss: ds.sampleN > 0 ? ds.hpLossWeightedSum / ds.sampleN : 0,
      netHpLoss: ds.sampleN > 0 ? ds.netLossWeightedSum / ds.sampleN : 0,
      medianHpLoss: ds.sampleN > 0 ? ds.medianWeightedSum / ds.sampleN : 0,
      madnessRate: ds.sampleN > 0 ? ds.madnessWeightedSum / ds.sampleN : 0,
      avgTurns: ds.sampleN > 0 ? ds.turnsWeightedSum / ds.sampleN : 0,
    }))
    .sort((a, b) => a.deckSize - b.deckSize);
}

/**
 * 聚合全卡牌 (73 張) 效益統計
 */
function mergeCardMetrics(
  sliceSummaries: SliceSimulationSummary[],
  rolloutsEntered: number,
  rolloutsCompleted: number
): CardSliceMetrics[] {
  const cardMap: Record<
    string,
    {
      id: string;
      name: string;
      category: string;
      tier: number;
      offeredN: number;
      draftedN: number;
      deltaHpWeightedSum: number;
      mortHeldWeightedSum: number;
      deltaMortalityWeightedSum: number;
      survOwnRateWeightedSum: number;
      fallOwnRateWeightedSum: number;
    }
  > = {};

  for (const s of sliceSummaries) {
    for (const c of s.cards) {
      if (!cardMap[c.id]) {
        cardMap[c.id] = {
          id: c.id,
          name: c.name,
          category: c.category,
          tier: c.tier,
          offeredN: 0,
          draftedN: 0,
          deltaHpWeightedSum: 0,
          mortHeldWeightedSum: 0,
          deltaMortalityWeightedSum: 0,
          survOwnRateWeightedSum: 0,
          fallOwnRateWeightedSum: 0,
        };
      }
      const acc = cardMap[c.id];
      acc.offeredN += c.offeredN;
      acc.draftedN += c.draftedN;
      acc.deltaHpWeightedSum += c.deltaHp * c.draftedN;
      acc.mortHeldWeightedSum += c.mortHeld * c.draftedN;
      acc.deltaMortalityWeightedSum += c.deltaMortality * c.draftedN;
      acc.survOwnRateWeightedSum += c.survOwnRate * s.rolloutsCompleted;
      acc.fallOwnRateWeightedSum +=
        c.fallOwnRate * Math.max(0, s.rolloutsEntered - s.rolloutsCompleted);
    }
  }

  const totalFallen = Math.max(1, rolloutsEntered - rolloutsCompleted);
  return Object.values(cardMap).map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    tier: c.tier,
    offeredN: c.offeredN,
    offeredRate: rolloutsEntered > 0 ? c.offeredN / rolloutsEntered : 0,
    draftedN: c.draftedN,
    draftedRate: c.offeredN > 0 ? c.draftedN / c.offeredN : 0,
    deltaHp: c.draftedN > 0 ? c.deltaHpWeightedSum / c.draftedN : 0,
    mortHeld: c.draftedN > 0 ? c.mortHeldWeightedSum / c.draftedN : 0,
    deltaMortality: c.draftedN > 0 ? c.deltaMortalityWeightedSum / c.draftedN : 0,
    survOwnRate: rolloutsCompleted > 0 ? c.survOwnRateWeightedSum / rolloutsCompleted : 0,
    fallOwnRate: c.fallOwnRateWeightedSum / totalFallen,
  }));
}

/**
 * 聚合路徑分支二選一數據
 */
function mergePathChoiceMetrics(sliceSummaries: SliceSimulationSummary[]): PathChoiceMetrics[] {
  const pathChoiceMap: Record<
    string,
    {
      pair: string;
      label: string;
      choiceA: string;
      choiceB: string;
      countA: number;
      countB: number;
      deltaMortalityWeighted: number;
    }
  > = {};

  for (const s of sliceSummaries) {
    for (const p of s.pathChoices) {
      if (!pathChoiceMap[p.pair]) {
        pathChoiceMap[p.pair] = {
          pair: p.pair,
          label: p.label,
          choiceA: p.choiceA,
          choiceB: p.choiceB,
          countA: 0,
          countB: 0,
          deltaMortalityWeighted: 0,
        };
      }
      const acc = pathChoiceMap[p.pair];
      const totalP = p.countA + p.countB;
      acc.countA += p.countA;
      acc.countB += p.countB;
      acc.deltaMortalityWeighted += p.deltaMortality * totalP;
    }
  }

  return Object.values(pathChoiceMap).map((p) => {
    const total = p.countA + p.countB;
    return {
      pair: p.pair,
      label: p.label,
      choiceA: p.choiceA,
      choiceB: p.choiceB,
      countA: p.countA,
      countB: p.countB,
      pickRateA: total > 0 ? Math.round((p.countA / total) * 1000) / 1000 : 0.5,
      pickRateB: total > 0 ? Math.round((p.countB / total) * 1000) / 1000 : 0.5,
      deltaMortality: total > 0 ? Math.round((p.deltaMortalityWeighted / total) * 1000) / 1000 : 0,
    };
  });
}

/**
 * 聚合節點內部行動抉擇數據
 */
function mergeIntraNodeChoiceMetrics(
  sliceSummaries: SliceSimulationSummary[],
  rolloutsEntered: number
): IntraNodeChoiceMetrics[] {
  const intraNodeMap: Record<
    string,
    {
      category: 'reward' | 'sanctuary' | 'market' | 'event';
      action: string;
      count: number;
      hpDeltaWeighted: number;
      deltaMortalityWeighted: number;
    }
  > = {};

  for (const s of sliceSummaries) {
    for (const c of s.intraNodeChoices) {
      if (!intraNodeMap[c.action]) {
        intraNodeMap[c.action] = {
          category: c.category,
          action: c.action,
          count: 0,
          hpDeltaWeighted: 0,
          deltaMortalityWeighted: 0,
        };
      }
      const acc = intraNodeMap[c.action];
      acc.count += c.count;
      acc.hpDeltaWeighted += c.deltaHp * c.count;
      acc.deltaMortalityWeighted += c.deltaMortality * c.count;
    }
  }

  return Object.values(intraNodeMap).map((c) => ({
    category: c.category,
    action: c.action,
    count: c.count,
    pickRate: rolloutsEntered > 0 ? Math.round((c.count / rolloutsEntered) * 1000) / 1000 : 0,
    deltaHp: c.count > 0 ? Math.round((c.hpDeltaWeighted / c.count) * 10) / 10 : 0,
    deltaMortality: c.count > 0 ? Math.round((c.deltaMortalityWeighted / c.count) * 1000) / 1000 : 0,
  }));
}

/**
 * 聚合節點造訪頻率與致死率數據
 */
function mergeNodeVisitMetrics(sliceSummaries: SliceSimulationSummary[]): NodeVisitSliceMetrics[] {
  const nodeVisitsMap: Record<
    string,
    { label: string; visits: number; hpLossWeightedSum: number; deaths: number }
  > = {};

  for (const s of sliceSummaries) {
    if (s.nodeVisits) {
      for (const nv of s.nodeVisits) {
        if (!nodeVisitsMap[nv.type]) {
          nodeVisitsMap[nv.type] = { label: nv.label, visits: 0, hpLossWeightedSum: 0, deaths: 0 };
        }
        nodeVisitsMap[nv.type].visits += nv.visitCount;
        nodeVisitsMap[nv.type].hpLossWeightedSum += nv.meanHpLoss * nv.visitCount;
        nodeVisitsMap[nv.type].deaths += Math.round(nv.lethality * nv.visitCount);
      }
    }
  }

  const totalVisits = Object.values(nodeVisitsMap).reduce((sum, n) => sum + n.visits, 0);
  return Object.entries(nodeVisitsMap).map(([type, data]) => {
    const visitRate = totalVisits > 0 ? data.visits / totalVisits : 0;
    const meanLoss = data.visits > 0 ? data.hpLossWeightedSum / data.visits : 0;
    const lethality = data.visits > 0 ? data.deaths / data.visits : 0;
    return {
      type,
      label: data.label,
      visitCount: data.visits,
      visitRate: Math.round(visitRate * 1000) / 1000,
      meanHpLoss: Math.round(meanLoss * 10) / 10,
      lethality: Math.round(lethality * 1000) / 1000,
    };
  });
}

/**
 * 聚合存活組 vs 陣亡組全維度客觀指標
 */
function mergeGroupComparisonMetrics(
  sliceSummaries: SliceSimulationSummary[],
  rolloutsEntered: number,
  rolloutsCompleted: number,
  templateSlice: SliceSimulationSummary
): GroupComparisonMetrics[] {
  const parseValueAndUnit = (str: string): { val: number; unit: string } => {
    const match = str.match(/^([+-]?\d+(?:\.\d+)?)\s*(.*)$/);
    if (!match) return { val: 0, unit: '' };
    return { val: parseFloat(match[1]), unit: match[2] };
  };

  const survivingTotalWeight = rolloutsCompleted;
  const fallenTotalWeight = Math.max(1, rolloutsEntered - rolloutsCompleted);

  return templateSlice.groupComparison.map((templateRow, idx) => {
    const { unit } = parseValueAndUnit(templateRow.survivingValue);
    let survSum = 0;
    let fallSum = 0;
    for (const s of sliceSummaries) {
      const row = s.groupComparison[idx];
      if (row) {
        survSum += parseValueAndUnit(row.survivingValue).val * s.rolloutsCompleted;
        fallSum +=
          parseValueAndUnit(row.fallenValue).val *
          Math.max(0, s.rolloutsEntered - s.rolloutsCompleted);
      }
    }
    const avgSurv = survivingTotalWeight > 0 ? survSum / survivingTotalWeight : 0;
    const avgFall = fallenTotalWeight > 0 ? fallSum / fallenTotalWeight : 0;
    const deltaVal = avgSurv - avgFall;
    const deltaStr = `${deltaVal >= 0 ? '+' : ''}${deltaVal.toFixed(1)} ${unit}`.trim();
    return {
      dimension: templateRow.dimension,
      survivingValue: `${avgSurv.toFixed(1)} ${unit}`.trim(),
      fallenValue: `${avgFall.toFixed(1)} ${unit}`.trim(),
      delta: deltaStr,
      note: templateRow.note,
    };
  });
}

/**
 * 聚合多份獨立蒙地卡羅全地圖模擬結果 (用於多核心並行採樣 Map-Reduce)
 */
export function mergeJourneySimulationResults(
  results: JourneySimulationResult[]
): JourneySimulationResult {
  if (results.length === 0) {
    throw new Error('Cannot merge an empty array of simulation results');
  }
  if (results.length === 1) {
    return results[0];
  }

  const first = results[0];
  const sliceIds = Object.keys(first.slices)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);
  const mergedSlices: Record<number, SliceSimulationSummary> = {};
  const mergedProgression: SliceSimulationSummary[] = [];

  let cumulativeRateAcc = 1.0;
  let totalRolloutsSum = 0;
  let totalNetHpLossAcc = 0;

  for (const sliceId of sliceIds) {
    const sliceSummaries = results.map((r) => r.slices[sliceId]).filter(Boolean);
    const firstSlice = sliceSummaries[0];
    const sliceDef = firstSlice.sliceDef;

    const rolloutsEntered = sliceSummaries.reduce((sum, s) => sum + s.rolloutsEntered, 0);
    const rolloutsCompleted = sliceSummaries.reduce((sum, s) => sum + s.rolloutsCompleted, 0);
    totalRolloutsSum += rolloutsEntered;

    const sliceSurvivalRate = rolloutsEntered > 0 ? rolloutsCompleted / rolloutsEntered : 0;
    cumulativeRateAcc *= sliceSurvivalRate;

    const weightedAvg = (
      valFn: (s: SliceSimulationSummary) => number,
      weightFn: (s: SliceSimulationSummary) => number
    ) => {
      const totalWeight = sliceSummaries.reduce((sum, s) => sum + weightFn(s), 0);
      if (totalWeight <= 0) return 0;
      return sliceSummaries.reduce((sum, s) => sum + valFn(s) * weightFn(s), 0) / totalWeight;
    };

    // 損血均值母體為進入該切片之所有樣本 (rolloutsEntered)
    const meanCombatHpLoss = weightedAvg((s) => s.meanCombatHpLoss, (s) => s.rolloutsEntered);
    const meanNetHpLoss = weightedAvg((s) => s.meanNetHpLoss, (s) => s.rolloutsEntered);
    // 終局生命值與理智牌庫僅存活者有結算數據 (rolloutsCompleted)
    const meanFinalHp = weightedAvg((s) => s.meanFinalHp, (s) => s.rolloutsCompleted);
    const meanFinalDeckSize = weightedAvg((s) => s.meanFinalDeckSize, (s) => s.rolloutsCompleted);
    const madnessTriggerRate = weightedAvg((s) => s.madnessTriggerRate, (s) => s.rolloutsEntered);
    const totalCombatsFought = sliceSummaries.reduce((sum, s) => sum + s.totalCombatsFought, 0);
    totalNetHpLossAcc += meanNetHpLoss;

    const personasSummary = mergePersonaMetrics(sliceSummaries);
    const { monsters: monstersResult, topFatalMonster } = mergeMonsterMetrics(
      sliceSummaries,
      totalCombatsFought,
      rolloutsEntered,
      rolloutsCompleted
    );
    const deckSizesResult = mergeDeckSizeMetrics(sliceSummaries, rolloutsEntered);
    const cardsResult = mergeCardMetrics(sliceSummaries, rolloutsEntered, rolloutsCompleted);
    const mergedPathChoices = mergePathChoiceMetrics(sliceSummaries);
    const mergedIntraNodeChoices = mergeIntraNodeChoiceMetrics(sliceSummaries, rolloutsEntered);
    const mergedNodeVisits = mergeNodeVisitMetrics(sliceSummaries);
    const mergedGroupComparison = mergeGroupComparisonMetrics(
      sliceSummaries,
      rolloutsEntered,
      rolloutsCompleted,
      firstSlice
    );

    const mergedSummary: SliceSimulationSummary = {
      sliceId: sliceDef.id,
      sliceDef,
      rolloutsEntered,
      rolloutsCompleted,
      sliceSurvivalRate,
      cumulativeSurvivalRate: cumulativeRateAcc,
      meanCombatHpLoss,
      meanNetHpLoss,
      meanFinalHp,
      meanFinalDeckSize,
      madnessTriggerRate,
      topFatalMonster,
      personas: personasSummary,
      totalCombatsFought,
      monsters: monstersResult,
      deckSizes: deckSizesResult,
      cards: cardsResult,
      pathChoices: mergedPathChoices,
      intraNodeChoices: mergedIntraNodeChoices,
      nodeVisits: mergedNodeVisits,
      groupComparison: mergedGroupComparison,
    };

    mergedSlices[sliceDef.id] = mergedSummary;
    mergedProgression.push(mergedSummary);
  }

  const elapsedMilliseconds = Math.max(...results.map((r) => r.elapsedMilliseconds));
  const overallSurvivalRate =
    mergedProgression.length > 0
      ? mergedProgression[mergedProgression.length - 1].cumulativeSurvivalRate
      : 0;

  return {
    totalRollouts: totalRolloutsSum,
    elapsedMilliseconds,
    overallSurvivalRate,
    slices: mergedSlices,
    progression: mergedProgression,
    totalJourneyNetHpLoss: totalNetHpLossAcc,
  };
}
