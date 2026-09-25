import type { Card, Enemy, Investigator, Relic } from '../../types/game';

/**
 * 模擬決策策略模式
 * - optimal: 1-Ply 當前回合最優啟發式出牌順序（測量強度上限）
 * - fault_tolerant: 注入次優抉擇噪音與亂序檢定（測量強度下限與容錯率）
 */
export type SimulationPolicyMode = 'optimal' | 'fault_tolerant';

/**
 * 單場戰鬥模擬設定
 */
export interface SingleCombatOptions {
  investigator?: Partial<Investigator>;
  deck: Card[];
  relics?: Relic[];
  enemy: Enemy;
  policyMode?: SimulationPolicyMode;
  maxTurns?: number;
  recordLogs?: boolean;
  randomFn?: () => number;
  uncappedHealth?: boolean;
  handCapacity?: number;
}

/**
 * 單場戰鬥模擬輸出結果
 */
export interface SingleCombatResult {
  victory: boolean;
  outcome: 'victory' | 'defeat' | 'timeout';
  turns: number;
  investigatorHealthRemaining: number;
  healthLost: number;
  sanityDeckRemaining: number;
  sanityCardsExpended: number;
  isMadness: boolean;
  cardsPlayedTotal: number;
  logs: string[];
}

/**
 * 批次戰鬥模擬設定
 */
export interface BatchCombatOptions {
  investigator?: Partial<Investigator>;
  deck: Card[];
  relics?: Relic[];
  enemy: Enemy;
  runs?: number;
  maxTurns?: number;
  randomFn?: () => number;
  uncappedHealth?: boolean;
  handCapacity?: number;
}

/**
 * 批次戰鬥統計指標摘要（含雙軌上限 vs 容錯評測）
 */
export interface BatchCombatMetrics {
  runs: number;
  optimal: {
    winRate: number;
    avgHealthLost: number;
    avgSanityExpended: number;
    avgTurns: number;
  };
  faultTolerant: {
    winRate: number;
    avgHealthLost: number;
    avgSanityExpended: number;
    avgTurns: number;
  };
  /**
   * 容錯穩定係數 (Fault Tolerance Stability Ratio, 0.0 ~ 1.0)
   * 衡量在次優操作下相對於最優操作的性能保留比例（值越接近 1.0 代表容錯率越高，越穩健）
   */
  faultToleranceRatio: number;
}
