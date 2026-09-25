import type { CardCategory, CardTier, CostType, OccupationId, RelicRarity } from '../../types/game';

/**
 * 六大專屬流派標識
 */
export type ArchetypeId =
  | 'armor_counter'       // 護甲反擊 (鐵壁蓄力)
  | 'bleed_pierce'        // 流血穿刺 (致命精準)
  | 'truth_restore'       // 真相回補 (洞悉神智)
  | 'madness_sacrifice'   // 狂亂自殘 (嗜血狂暴)
  | 'high_cost_magic'     // 高費秘術 (虛空湮滅)
  | 'status_attrition';   // 狀態磨血 (弱化衰敗)

/**
 * 單張卡牌平衡性評測報告
 */
export interface CardBalanceReport {
  id: string;
  name: string;
  category: CardCategory;
  tier?: CardTier;
  occupations?: OccupationId[];
  costType: CostType;
  costValue: number;
  description: string;

  // 雙維度評分 (0 ~ 100)
  healthScore: number;       // 肉體生存分 (越能保護生命值或速殺減傷，分數越高)
  sanityScore: number;       // 心智效率分 (理智牌庫消耗越低、回補越高，分數越高)
  overallScore: number;      // 綜合天梯得分 (0 ~ 100)
  tierRating: 'S' | 'A' | 'B' | 'C' | 'D'; // 天梯段位

  // 基準對弈指標 (以 1x 在全矩陣下的平均表現)
  winRate: number;           // 綜合勝率 (0.0 ~ 1.0)
  avgHealthLost: number;     // 平均肉體掉血
  avgSanityExpended: number; // 平均消耗理智卡張數
  avgTurns: number;          // 平均持續回合
  faultToleranceRatio: number;// 容錯穩定係數 (0.0 ~ 1.0)

  // 1x, 2x, 3x 重複堆疊效益折線
  copiesCurve: {
    1: { winRate: number; overallScore: number; avgHealthLost: number; avgSanityExpended: number };
    2: { winRate: number; overallScore: number; avgHealthLost: number; avgSanityExpended: number };
    3: { winRate: number; overallScore: number; avgHealthLost: number; avgSanityExpended: number };
  };

  // 六大流派協同倍率 (相對於 Baseline 裸強度的相對放大倍率，基準為 1.0)
  synergyMultipliers: Record<ArchetypeId, number>;
  bestArchetype: ArchetypeId;

  // 針對敵怪的優劣勢清單
  favorableEnemies: Array<{ id: string; name: string; winRate: number }>;
  unfavorableEnemies: Array<{ id: string; name: string; winRate: number }>;
}

/**
 * 舊日遺物平衡性評測報告
 */
export interface RelicBalanceReport {
  id: string;
  name: string;
  rarity: RelicRarity;
  description: string;
  icon?: string;

  // 持有 0, 1, 2, 3 件時的各項表現
  copiesCurve: {
    0: { winRate: number; avgHealthLost: number; avgSanityExpended: number; score: number };
    1: { winRate: number; avgHealthLost: number; avgSanityExpended: number; score: number };
    2: { winRate: number; avgHealthLost: number; avgSanityExpended: number; score: number };
    3: { winRate: number; avgHealthLost: number; avgSanityExpended: number; score: number };
  };

  marginalBenefitPerStack: number; // 每多持有一件的邊際效益增幅 (百分比, 例如 +12.5%)
  healthScore: number;            // 基準肉體生存分 (0 ~ 100)
  sanityScore: number;            // 基準心智效率分 (0 ~ 100)
  overallScore: number;           // 遺物總體價值評分 (0 ~ 100)
  tierRating: 'S' | 'A' | 'B' | 'C' | 'D';
  synergyMultipliers?: Record<ArchetypeId, number>; // 六大流派協同倍率
  bestArchetype?: ArchetypeId;    // 最適流派
}

/**
 * 敵怪威脅度評測報告
 */
export interface EnemyThreatReport {
  id: string;
  name: string;
  title: string;
  depth: 1 | 2 | 3 | 4;
  role: 'normal' | 'elite' | 'boss';
  health: number;
  armor: number;

  threatScore: number;               // 威脅度指數 (0 ~ 100，越高代表對調查員越致命)
  rank: number;                      // 1 ~ N 排行榜名次
  investigatorWinRate: number;       // 調查員面對此怪之平均勝率 (0.0 ~ 1.0)
  avgInvestigatorHealthLost: number; // 平均打殘調查員肉體生命值
  avgSanityEroded: number;           // 平均耗損理智牌張數
  avgCombatDurationTurns: number;

  // 剋制與應對情報
  counteredByCards: Array<{ id: string; name: string; winRate: number }>; // 最有效應對的推薦卡牌 Top 3
  vulnerableArchetype: ArchetypeId;  // 最容易攻克此怪的流派
  dangerousArchetype: ArchetypeId;   // 面對此怪最易崩盤的流派
}

/**
 * ADR-0038: 理智牌庫拓撲星系散布圖之節點實體
 */
export interface DeckTopologyNode {
  id: string;
  name: string;
  cards: Array<{ id: string; name: string; copies: number; category: CardCategory }>;
  totalCards: number;
  handRetention: number;
  /** @deprecated 領域術語已規範化為 handRetention，此欄位保留以相容舊版結構 */
  handCapacity?: number;
  winRate: number;
  avgHealthLost: number;
  avgSanityExpended: number;
  overallScore: number;
  archetypeId: string;
  archetypeName: string;
  drivingCombos: Array<{ cards: string[]; synergy: number }>;
  x: number; // 0.0 ~ 1.0 (投影歸一化 X 座標)
  y: number; // 0.0 ~ 1.0 (投影歸一化 Y 座標)
}

/**
 * ADR-0038: 非監督式圖論社群偵測之自然湧現流派實體
 */
export interface EmergentArchetype {
  id: string;
  name: string;
  signatureCards: Array<{ id: string; name: string }>;
  memberCardIds: string[];
  coreCombos: Array<{ cardIds: string[]; cardNames: string[]; synergyScore: number }>;
  deckCount: number;
  avgScore: number;
  avgHealthLost: number;
  avgSanityExpended: number;
}

/**
 * 全量平衡性評測彙總數據產物 (Summary JSON)
 */
export interface BalanceSummaryData {
  generatedAt: string;
  version: string;
  totalCombatsSimulated: number;
  cards: Record<string, CardBalanceReport>;
  relics: Record<string, RelicBalanceReport>;
  enemies: Record<string, EnemyThreatReport>;
  archetypeDefinitions: Record<
    ArchetypeId,
    { name: string; description: string; coreCardNames: string[] }
  >;
  // ADR-0038: 自然湧現流派與理智牌庫拓撲生態數據
  deckTopology?: DeckTopologyNode[];
  emergentArchetypes?: EmergentArchetype[];
  cardSimilarityMatrix?: Record<string, Record<string, number>>;
}

/**
 * 原始模擬對弈記錄項目 (用於 Raw Data JSON)
 */
export interface RawCombatLogEntry {
  targetId: string;
  targetType: 'card' | 'relic';
  copies: number;
  context: 'baseline' | ArchetypeId | 'random_noise';
  enemyId: string;
  runs: number;
  wins: number;
  avgHpLost: number;
  avgSanityExpended: number;
  avgTurns: number;
  faultToleranceRatio: number;
}
