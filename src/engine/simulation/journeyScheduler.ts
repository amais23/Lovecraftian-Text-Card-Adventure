import type { Card, DepthLevel, Relic } from '../../types/game';
import { INITIAL_INVESTIGATOR } from '../initialData';
import { CardRegistry } from '../cards/registry';
import {
  type AgentPersonaType,
  getAgentPersona,
} from './agentPersona';
import { runSliceRollout, type SliceRolloutResult } from './sliceRollout';

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
  { id: 2, name: 'Slice 2: Depth 1 後階 (Floor 8~15)', depth: 1, startLayer: 8, endLayer: 15, role: '第一深度決戰', bossName: '達貢眷族主教' },
  { id: 3, name: 'Slice 3: Depth 2 前階 (Floor 0~7)', depth: 2, startLayer: 0, endLayer: 7, role: '深潛者潮汐滲透' },
  { id: 4, name: 'Slice 4: Depth 2 後階 (Floor 8~15)', depth: 2, startLayer: 8, endLayer: 15, role: '第二深度決戰', bossName: '達貢巨型神眷' },
  { id: 5, name: 'Slice 5: Depth 3 前階 (Floor 0~7)', depth: 3, startLayer: 0, endLayer: 7, role: '修格斯原核異界' },
  { id: 6, name: 'Slice 6: Depth 3 後階 (Floor 8~15)', depth: 3, startLayer: 8, endLayer: 15, role: '第三深度決戰', bossName: '原生巨型修格斯' },
  { id: 7, name: 'Slice 7: Depth 4 深淵核心 (Floor 0~7)', depth: 4, startLayer: 0, endLayer: 7, role: '終極支配者對決', bossName: '舊日支配者化身' },
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

  getAll(): SurvivingInvestigatorSnapshot[] {
    return this.pool;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. 模擬選項與輸出資料結構
// ─────────────────────────────────────────────────────────────
export interface JourneySimulationOptions {
  timeBudgetSeconds?: number;
  samplesPerSlice?: number;
  occupation?: 'investigator' | 'occultist';
  seedBase?: number;
  onProgress?: (progress: { currentSliceId: number; completedRollouts: number; elapsedSeconds: number }) => void;
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
}

export interface JourneySimulationResult {
  totalRollouts: number;
  elapsedMilliseconds: number;
  overallSurvivalRate: number;
  slices: Record<number, SliceSimulationSummary>;
  progression: SliceSimulationSummary[];
  totalJourneyNetHpLoss: number;
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

  // 依序執行 7 個切片
  for (let sliceIdx = 0; sliceIdx < SLICE_DEFINITIONS.length; sliceIdx++) {
    const sliceDef = SLICE_DEFINITIONS[sliceIdx];
    const sliceStartTime = performance.now();
    const nextPool = new GlobalMixedPool();

    // 流式計數器 (常數記憶體 O(1))
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

    let rolloutIndex = 0;

    while (true) {
      // 4 種流派輪轉抽樣
      const personaType = STANDARD_PERSONAS[rolloutIndex % STANDARD_PERSONAS.length];
      const persona = getAgentPersona(personaType);
      const rolloutSeed = (seedBase + sliceDef.id * 100000 + rolloutIndex) >>> 0;

      // 產生該條 Rollout 的 PRNG
      let s = rolloutSeed;
      const rolloutPrng = () => {
        s = (s + 0x6d2b79f5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };

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

      if (result.success && result.investigator.health > 0) {
        completedCount++;
        personaStats[personaType].completed++;
        sumFinalHp += result.investigator.health;
        sumFinalDeckSize += result.finalDeck.length;

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
      } else if (result.fatalEncounter) {
        const monsterName = result.fatalEncounter.enemyName ?? '未知強敵';
        fatalMonsterCounts[monsterName] = (fatalMonsterCounts[monsterName] ?? 0) + 1;
      }

      rolloutIndex++;

      // 檢查終止條件
      if (isTimeBudgetMode) {
        const elapsedSlice = performance.now() - sliceStartTime;
        // 確保每個性格至少各跑 1 輪 (至少 4 條) 且超過該切片時間預算
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
