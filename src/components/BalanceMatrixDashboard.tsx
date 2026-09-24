import React, { useState, useMemo } from 'react';
import {
  Activity,
  Shield,
  Swords,
  Sparkles,
  Flame,
  Skull,
  TrendingUp,
  AlertTriangle,
  Award,
  Layers,
  ChevronRight,
  Eye,
  Check,
  Target,
  BarChart3,
  Search,
  Filter,
} from 'lucide-react';
import balanceSummaryDataRaw from '../data/balance/balance_summary_data.json';
import type {
  BalanceSummaryData,
  CardBalanceReport,
  RelicBalanceReport,
  EnemyThreatReport,
  ArchetypeId,
} from '../engine/simulation/balanceTypes';
import type { CardCategory, OccupationId } from '../types/game';

const balanceData = balanceSummaryDataRaw as unknown as BalanceSummaryData;

const ARCHETYPE_ORDER: ArchetypeId[] = [
  'armor_counter',
  'bleed_pierce',
  'truth_restore',
  'madness_sacrifice',
  'high_cost_magic',
  'status_attrition',
];

const ARCHETYPE_NAMES: Record<ArchetypeId, string> = {
  armor_counter: '護甲反擊',
  bleed_pierce: '流血穿刺',
  truth_restore: '真相回補',
  madness_sacrifice: '狂亂自殘',
  high_cost_magic: '高費秘術',
  status_attrition: '狀態磨血',
};

const CATEGORY_NAMES: Record<CardCategory, string> = {
  combat: '紅色戰鬥',
  skill: '黃色技能',
  magic: '紫色魔法',
  truth: '白色真相',
  madness: '黑色瘋狂',
};

const CATEGORY_COLORS: Record<CardCategory, string> = {
  combat: '#ef4444',
  skill: '#f59e0b',
  magic: '#c084fc',
  truth: '#e2e8f0',
  madness: '#64748b',
};

const TIER_COLORS: Record<string, string> = {
  S: '#ffd700',
  A: '#cfa866',
  B: '#38bdf8',
  C: '#94a3b8',
  D: '#64748b',
};

const RELIC_RARITY_LABELS: Record<string, string> = {
  common: '普通階級',
  rare: '珍稀階級',
  mythic: '神話階級',
};

/**
 * 六角形流派協同倍率雷達圖 (Hexagonal Archetype Synergy Radar Chart)
 */
interface RadarChartProps {
  synergies: Record<ArchetypeId, number>;
  bestArchetype: ArchetypeId;
}

const ArchetypeRadarChart: React.FC<RadarChartProps> = ({ synergies, bestArchetype }) => {
  const cx = 110;
  const cy = 100;
  const maxR = 64;
  const maxVal = 2.0; // scale up to 2.0x

  // Compute 6 vertex positions
  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const r = Math.min(maxR, Math.max(10, (value / maxVal) * maxR));
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = ARCHETYPE_ORDER.map((arch, i) => {
    const mult = synergies[arch] || 1.0;
    const { x, y } = getCoordinates(mult, i);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Concentric background grid rings at 0.5x, 1.0x, 1.5x, 2.0x
  const rings = [0.5, 1.0, 1.5, 2.0];

  return (
    <div className="radar-chart-container" data-testid="archetype-radar-chart">
      <svg viewBox="0 0 220 200" className="radar-svg" role="img" aria-label="六大流派協同倍率雷達圖">
        {/* Concentric Hexagons */}
        {rings.map((ringVal) => {
          const ringPoints = ARCHETYPE_ORDER.map((_, i) => {
            const { x, y } = getCoordinates(ringVal, i);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          }).join(' ');
          const isBaseline = ringVal === 1.0;
          return (
            <polygon
              key={ringVal}
              points={ringPoints}
              fill="none"
              stroke={isBaseline ? '#cfa866' : '#334155'}
              strokeWidth={isBaseline ? 1.2 : 0.8}
              strokeDasharray={isBaseline ? '3 3' : undefined}
              opacity={isBaseline ? 0.7 : 0.5}
            />
          );
        })}

        {/* Axis Spokes from center */}
        {ARCHETYPE_ORDER.map((arch, i) => {
          const { x, y } = getCoordinates(maxVal, i);
          return (
            <line
              key={arch}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#334155"
              strokeWidth={0.8}
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={polygonPoints}
          fill="rgba(207, 168, 102, 0.25)"
          stroke="#ffd700"
          strokeWidth={2}
          className="radar-data-polygon"
        />

        {/* Vertices and Labels */}
        {ARCHETYPE_ORDER.map((arch, i) => {
          const mult = synergies[arch] || 1.0;
          const { x, y } = getCoordinates(mult, i);
          const labelCoord = getCoordinates(maxVal + 0.35, i);
          const isBest = arch === bestArchetype;

          return (
            <g key={arch} className="radar-vertex-group">
              <circle
                cx={x}
                cy={y}
                r={isBest ? 4 : 2.5}
                fill={isBest ? '#ffd700' : '#38bdf8'}
                stroke="#0b0f19"
                strokeWidth={1}
              />
              <text
                x={labelCoord.x}
                y={labelCoord.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fill={isBest ? '#ffd700' : '#94a3b8'}
                fontWeight={isBest ? '700' : '400'}
              >
                {ARCHETYPE_NAMES[arch]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/**
 * 重複堆疊指標卡片 (Copies Step Card)
 */
interface CopiesStepCardProps {
  label: string;
  score: number;
  winRate: number;
  avgHealthLost: number;
  avgSanityExpended: number;
}

const CopiesStepCard: React.FC<CopiesStepCardProps> = ({
  label,
  score,
  winRate,
  avgHealthLost,
  avgSanityExpended,
}) => (
  <div className="copy-step-card">
    <div className="copy-step-header">
      <span className="copy-badge">{label}</span>
      <span className="copy-score">{score} 分</span>
    </div>
    <div className="copy-metrics">
      <div className="copy-metric-row">
        <span>勝率</span>
        <strong>{(winRate * 100).toFixed(1)}%</strong>
      </div>
      <div className="copy-metric-row">
        <span>平均生命損失</span>
        <strong>{avgHealthLost.toFixed(1)} 點生命</strong>
      </div>
      <div className="copy-metric-row">
        <span>理智消耗</span>
        <strong>{avgSanityExpended.toFixed(1)} 張</strong>
      </div>
    </div>
  </div>
);

/**
 * 重複堆疊效益折線圖 (Copies Benefit Line Chart)
 */
interface CopiesLineChartProps {
  curve: Record<number, { winRate: number; overallScore?: number; score?: number }>;
  isRelic?: boolean;
}

const CopiesLineChart: React.FC<CopiesLineChartProps> = ({ curve, isRelic = false }) => {
  const steps = isRelic ? [0, 1, 2, 3] : [1, 2, 3];
  const chartW = 300;
  const chartH = 115;
  const paddingX = 40;
  const paddingY = 20;

  const getX = (stepIndex: number) => {
    const total = steps.length - 1;
    return paddingX + (stepIndex / total) * (chartW - paddingX * 2);
  };

  const getYScore = (score: number) => {
    // 0 to 100 maps to (chartH - paddingY) down to paddingY
    return chartH - paddingY - (score / 100) * (chartH - paddingY * 2);
  };

  const getYWinRate = (winRate: number) => {
    // 0.0 to 1.0 maps similarly
    return chartH - paddingY - winRate * (chartH - paddingY * 2);
  };

  const scorePoints = steps.map((s, i) => {
    const val = curve[s]?.score ?? curve[s]?.overallScore ?? 50;
    return `${getX(i).toFixed(1)},${getYScore(val).toFixed(1)}`;
  }).join(' ');

  const winRatePoints = steps.map((s, i) => {
    const val = curve[s]?.winRate ?? 0.5;
    return `${getX(i).toFixed(1)},${getYWinRate(val).toFixed(1)}`;
  }).join(' ');

  return (
    <div className="copies-line-chart-container" data-testid="copies-benefit-line-chart">
      <div className="line-chart-legend">
        <span className="legend-label score-legend">
          <span className="legend-line score" /> 評分 (左軸 0-100)
        </span>
        <span className="legend-label winrate-legend">
          <span className="legend-line winrate" /> 勝率 (右軸 0%-100%)
        </span>
      </div>

      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="copies-line-svg" role="img" aria-label="重複堆疊效益折線圖">
        {/* Baseline grid */}
        <line x1={paddingX} y1={paddingY} x2={chartW - paddingX} y2={paddingY} stroke="#1e293b" strokeDasharray="3 3" />
        <line x1={paddingX} y1={chartH / 2} x2={chartW - paddingX} y2={chartH / 2} stroke="#1e293b" strokeDasharray="3 3" />
        <line x1={paddingX} y1={chartH - paddingY} x2={chartW - paddingX} y2={chartH - paddingY} stroke="#334155" />

        {/* Dual Axis Tick Labels */}
        {/* Left Y Axis: Score (Gold) */}
        <text x={paddingX - 6} y={paddingY + 4} textAnchor="end" fontSize={8} fill="#ffd700">100</text>
        <text x={paddingX - 6} y={chartH / 2 + 3} textAnchor="end" fontSize={8} fill="#ffd700">50</text>
        <text x={paddingX - 6} y={chartH - paddingY + 2} textAnchor="end" fontSize={8} fill="#ffd700">0</text>

        {/* Right Y Axis: WinRate (Cyan) */}
        <text x={chartW - paddingX + 6} y={paddingY + 4} textAnchor="start" fontSize={8} fill="#38bdf8">100%</text>
        <text x={chartW - paddingX + 6} y={chartH / 2 + 3} textAnchor="start" fontSize={8} fill="#38bdf8">50%</text>
        <text x={chartW - paddingX + 6} y={chartH - paddingY + 2} textAnchor="start" fontSize={8} fill="#38bdf8">0%</text>

        {/* Polylines */}
        <polyline className="copies-curve score" points={scorePoints} fill="none" stroke="#ffd700" strokeWidth={2} />
        <polyline className="copies-curve winrate" points={winRatePoints} fill="none" stroke="#38bdf8" strokeWidth={1.8} strokeDasharray="4 2" />

        {/* Step Nodes and Labels */}
        {steps.map((s, i) => {
          const x = getX(i);
          const scoreVal = curve[s]?.score ?? curve[s]?.overallScore ?? 50;
          const winRateVal = curve[s]?.winRate ?? 0.5;
          const yScore = getYScore(scoreVal);
          const yWin = getYWinRate(winRateVal);

          return (
            <g key={s}>
              {/* Score Node */}
              <circle cx={x} cy={yScore} r={3.5} fill="#ffd700" stroke="#0b0f19" strokeWidth={1} />
              <text x={x} y={yScore - 7} textAnchor="middle" fontSize={8.5} fill="#ffd700" fontWeight="700">
                {scoreVal}分
              </text>

              {/* WinRate Node */}
              <circle cx={x} cy={yWin} r={3} fill="#38bdf8" stroke="#0b0f19" strokeWidth={1} />
              <text x={x} y={yWin + 11} textAnchor="middle" fontSize={8} fill="#38bdf8">
                {(winRateVal * 100).toFixed(0)}%
              </text>

              {/* X Axis Step Label */}
              <text x={x} y={chartH - 4} textAnchor="middle" fontSize={9} fill="#94a3b8">
                {s}x {isRelic ? '持有' : '重複'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const BalanceMatrixDashboard: React.FC = () => {
  // Navigation sub-tab: 'scatter' (cards & relics) | 'enemies' (26-threat leaderboard)
  const [subTab, setSubTab] = useState<'scatter' | 'enemies'>('scatter');

  // Scatter sub-tab: 'cards' | 'relics'
  const [targetType, setTargetType] = useState<'cards' | 'relics'>('cards');

  // Filters for Cards
  const [categoryFilter, setCategoryFilter] = useState<CardCategory | 'all'>('all');
  const [occupationFilter, setOccupationFilter] = useState<OccupationId | 'all' | 'neutral'>('all');
  const [tierFilter, setTierFilter] = useState<string | 'all'>('all');
  const [archetypeFilter, setArchetypeFilter] = useState<ArchetypeId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item
  const [selectedCardId, setSelectedCardId] = useState<string>('card_revolver_1');
  const [selectedRelicId, setSelectedRelicId] = useState<string>('elder_sign_amulet');

  // Filters for Enemies
  const [enemyDepthFilter, setEnemyDepthFilter] = useState<number | 'all'>('all');
  const [enemyRoleFilter, setEnemyRoleFilter] = useState<'all' | 'normal' | 'elite' | 'boss'>('all');

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return Object.values(balanceData.cards).filter((card) => {
      if (categoryFilter !== 'all' && card.category !== categoryFilter) return false;
      if (tierFilter !== 'all' && String(card.tier) !== tierFilter) return false;
      if (archetypeFilter !== 'all' && card.bestArchetype !== archetypeFilter) return false;

      // Occupation Filter
      if (occupationFilter !== 'all') {
        if (occupationFilter === 'neutral') {
          if (card.occupations && card.occupations.length > 0) return false;
        } else {
          if (!card.occupations || !card.occupations.includes(occupationFilter)) return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = card.name.toLowerCase().includes(query);
        const matchDesc = card.description.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [categoryFilter, occupationFilter, tierFilter, archetypeFilter, searchQuery]);

  // Relics list
  const allRelics = useMemo(() => Object.values(balanceData.relics), []);

  // Filtered Relics
  const filteredRelics = useMemo(() => {
    return allRelics.filter((relic) => {
      if (tierFilter !== 'all') {
        if (relic.tierRating !== tierFilter && relic.rarity !== tierFilter) return false;
      }
      if (archetypeFilter !== 'all' && relic.bestArchetype !== archetypeFilter) return false;
      if (occupationFilter === 'neutral') {
        // relics are universal / neutral
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = relic.name.toLowerCase().includes(query);
        const matchDesc = relic.description.toLowerCase().includes(query);
        if (!matchName && !matchDesc) return false;
      }
      return true;
    });
  }, [allRelics, tierFilter, archetypeFilter, occupationFilter, searchQuery]);

  // Filtered Enemies sorted by rank
  const filteredEnemies = useMemo(() => {
    return Object.values(balanceData.enemies)
      .sort((a, b) => a.rank - b.rank)
      .filter((enemy) => {
        if (enemyDepthFilter !== 'all' && enemy.depth !== enemyDepthFilter) return false;
        if (enemyRoleFilter !== 'all' && enemy.role !== enemyRoleFilter) return false;
        return true;
      });
  }, [enemyDepthFilter, enemyRoleFilter]);

  // Selected card / relic reports
  const currentCard = balanceData.cards[selectedCardId] || filteredCards[0] || Object.values(balanceData.cards)[0];
  const currentRelic = balanceData.relics[selectedRelicId] || filteredRelics[0] || allRelics[0];

  return (
    <div className="balance-matrix-dashboard" data-testid="balance-matrix-dashboard">
      {/* Top Header & Metrics Banner */}
      <header className="balance-dashboard-header">
        <div className="balance-title-block">
          <div className="balance-badge">
            <Activity size={18} color="#ffd700" />
            <span>ADR-0036 數值平衡天梯</span>
          </div>
          <h3>全量平衡性評測與數值矩陣</h3>
          <p className="balance-subtitle">
            分層正交蒙地卡羅全量採樣 · 總模擬場次 {balanceData.totalCombatsSimulated.toLocaleString()} 場 · 數據版本 v{balanceData.version}
          </p>
        </div>

        {/* Sub-view switcher */}
        <div className="balance-sub-nav">
          <button
            type="button"
            className={`balance-nav-btn ${subTab === 'scatter' ? 'active' : ''}`}
            onClick={() => setSubTab('scatter')}
          >
            <BarChart3 size={16} />
            <span>卡牌/遺物數值天梯 (散布圖與曲線)</span>
          </button>
          <button
            type="button"
            className={`balance-nav-btn ${subTab === 'enemies' ? 'active' : ''}`}
            onClick={() => setSubTab('enemies')}
          >
            <Skull size={16} />
            <span>敵怪威脅排行榜 (全26隻)</span>
          </button>
        </div>
      </header>

      {subTab === 'scatter' ? (
        <div className="balance-scatter-layout">
          {/* Controls Bar */}
          <div className="balance-controls-bar">
            {/* Target Type Toggle */}
            <div className="balance-type-toggle">
              <button
                type="button"
                className={`type-btn ${targetType === 'cards' ? 'active' : ''}`}
                onClick={() => setTargetType('cards')}
              >
                <Layers size={14} />
                <span>五色卡牌 ({Object.keys(balanceData.cards).length})</span>
              </button>
              <button
                type="button"
                className={`type-btn ${targetType === 'relics' ? 'active' : ''}`}
                onClick={() => setTargetType('relics')}
              >
                <Award size={14} />
                <span>舊日遺物 ({allRelics.length})</span>
              </button>
            </div>

            <div className="balance-filters-row">
              {/* Category Filter (Cards only) */}
              {targetType === 'cards' && (
                <div className="filter-group">
                  <span className="filter-label">類別：</span>
                  <button
                    type="button"
                    className={`filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('all')}
                  >
                    全部
                  </button>
                  {(Object.keys(CATEGORY_NAMES) as CardCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        borderColor: categoryFilter === cat ? CATEGORY_COLORS[cat] : undefined,
                        color: categoryFilter === cat ? CATEGORY_COLORS[cat] : undefined,
                      }}
                    >
                      {CATEGORY_NAMES[cat]}
                    </button>
                  ))}
                </div>
              )}

              {/* Occupation Filter (Cards only) */}
              {targetType === 'cards' && (
                <div className="filter-group">
                  <span className="filter-label">職業：</span>
                  <select
                    className="balance-select"
                    value={occupationFilter}
                    onChange={(e) => setOccupationFilter(e.target.value as OccupationId | 'all' | 'neutral')}
                    aria-label="職業篩選"
                  >
                    <option value="all">全部職業</option>
                    <option value="investigator">私家偵探</option>
                    <option value="occultist">秘術學者</option>
                    <option value="neutral">通用無職業</option>
                  </select>
                </div>
              )}

              {/* Tier Filter */}
              <div className="filter-group">
                <span className="filter-label">階級：</span>
                <select
                  className="balance-select"
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  aria-label="階級篩選"
                >
                  <option value="all">全部階級</option>
                  {targetType === 'cards' ? (
                    <>
                      <option value="1">Tier 1 基礎</option>
                      <option value="2">Tier 2 進階</option>
                      <option value="3">Tier 3 核心</option>
                      <option value="4">Tier 4 神話</option>
                    </>
                  ) : (
                    <>
                      <option value="common">普通階級</option>
                      <option value="rare">珍稀階級</option>
                      <option value="mythic">神話階級</option>
                      <option value="S">S 級評定</option>
                      <option value="A">A 級評定</option>
                      <option value="B">B 級評定</option>
                    </>
                  )}
                </select>
              </div>

              {/* Archetype Filter */}
              <div className="filter-group">
                <span className="filter-label">最適流派：</span>
                <select
                  className="balance-select"
                  value={archetypeFilter}
                  onChange={(e) => setArchetypeFilter(e.target.value as ArchetypeId | 'all')}
                  aria-label="最適流派篩選"
                >
                  <option value="all">全部流派</option>
                  {Object.entries(ARCHETYPE_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="balance-search-wrap">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="balance-search-input"
                  placeholder={targetType === 'cards' ? '搜尋卡牌名稱或效果...' : '搜尋遺物名稱或效果...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="搜尋名稱或效果"
                />
              </div>
            </div>
          </div>

          {/* Main Visualizer Body: Left (Scatter / Items) & Right (Detail Inspector) */}
          <div className="balance-main-grid">
            {/* Left Column: Dual Dimension Scatter Chart & Item List */}
            <div className="balance-visual-column">
              {/* Dual Dimension Scatter Plot */}
              <div className="scatter-plot-card" data-testid="balance-scatter-plot">
                <div className="scatter-header">
                  <h4>雙維度天梯散布圖 (肉體生存分 vs 心智效率分)</h4>
                  <div className="scatter-legend">
                    <span className="legend-item"><span className="legend-dot tier-s" /> S階 卓越基石</span>
                    <span className="legend-item"><span className="legend-dot tier-a" /> A階 強勢主力</span>
                    <span className="legend-item"><span className="legend-dot tier-b" /> B階 穩健良牌</span>
                    <span className="legend-item"><span className="legend-dot tier-c" /> C/D階 特化陷阱</span>
                  </div>
                </div>

                {/* SVG Coordinate Space */}
                <div className="scatter-canvas-wrap">
                  <svg
                    viewBox="0 0 500 340"
                    className="scatter-svg"
                    role="img"
                    aria-label="雙維度散布圖"
                  >
                    {/* Background Grid */}
                    <rect x="50" y="20" width="430" height="280" fill="#080c14" rx="4" />
                    <line x1="50" y1="160" x2="480" y2="160" stroke="#1e293b" strokeDasharray="4 4" />
                    <line x1="265" y1="20" x2="265" y2="300" stroke="#1e293b" strokeDasharray="4 4" />

                    {/* Quadrant Labels */}
                    <text x="470" y="40" fill="#38bdf8" opacity="0.3" textAnchor="end" fontSize="11">
                      S級 · 全能基石區
                    </text>
                    <text x="60" y="40" fill="#a855f7" opacity="0.3" fontSize="11">
                      高智低抗 · 秘術專精
                    </text>
                    <text x="470" y="290" fill="#f59e0b" opacity="0.3" textAnchor="end" fontSize="11">
                      鐵壁重盾 · 物理蓄力
                    </text>
                    <text x="60" y="290" fill="#ef4444" opacity="0.3" fontSize="11">
                      極限自殘 · 特化下限
                    </text>

                    {/* Axes lines & labels */}
                    <line x1="50" y1="300" x2="480" y2="300" stroke="#475569" strokeWidth="1.5" />
                    <line x1="50" y1="20" x2="50" y2="300" stroke="#475569" strokeWidth="1.5" />

                    {/* Y Axis Label (Sanity Score) */}
                    <text
                      x="-160"
                      y="20"
                      transform="rotate(-90)"
                      fill="#ffd700"
                      fontSize="12"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      心智效率分 (Sanity Score) ↑
                    </text>

                    {/* X Axis Label (Health Score) */}
                    <text
                      x="265"
                      y="330"
                      fill="#ffd700"
                      fontSize="12"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      肉體生存分 (Health Score) →
                    </text>

                    {/* Data Points */}
                    {targetType === 'cards'
                      ? filteredCards.map((card) => {
                          const cx = 50 + (card.healthScore / 100) * 430;
                          const cy = 300 - (card.sanityScore / 100) * 280;
                          const isSelected = card.id === currentCard?.id;
                          const color = TIER_COLORS[card.tierRating] || '#94a3b8';

                          return (
                            <g
                              key={card.id}
                              className="scatter-point-group"
                              onClick={() => setSelectedCardId(card.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              {isSelected && (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={10}
                                  fill="none"
                                  stroke="#ffd700"
                                  strokeWidth={2}
                                  className="scatter-pulse"
                                />
                              )}
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isSelected ? 6 : 4}
                                fill={color}
                                stroke={isSelected ? '#ffffff' : '#0b0f19'}
                                strokeWidth={1.5}
                              />
                            </g>
                          );
                        })
                      : filteredRelics.map((relic) => {
                          // Static relic survival and sanity scores directly from balance matrix
                          const cx = 50 + (relic.healthScore / 100) * 430;
                          const cy = 300 - (relic.sanityScore / 100) * 280;
                          const isSelected = relic.id === currentRelic?.id;
                          const color = TIER_COLORS[relic.tierRating] || '#38bdf8';

                          return (
                            <g
                              key={relic.id}
                              className="scatter-point-group"
                              onClick={() => setSelectedRelicId(relic.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              {isSelected && (
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={11}
                                  fill="none"
                                  stroke="#38bdf8"
                                  strokeWidth={2}
                                />
                              )}
                              <rect
                                x={cx - (isSelected ? 6 : 4)}
                                y={cy - (isSelected ? 6 : 4)}
                                width={isSelected ? 12 : 8}
                                height={isSelected ? 12 : 8}
                                fill={color}
                                stroke="#ffffff"
                                strokeWidth={1}
                              />
                            </g>
                          );
                        })}
                  </svg>
                </div>
              </div>

              {/* Items Compact Grid List */}
              <div className="balance-item-list-wrap">
                <div className="list-header">
                  <h5>{targetType === 'cards' ? `卡牌列表 (${filteredCards.length} 張)` : `遺物列表 (${filteredRelics.length} 件)`}</h5>
                  <span className="list-hint">點選卡牌或遺物以切換深度檢視</span>
                </div>
                <div className="balance-items-grid" data-testid="balance-items-grid">
                  {targetType === 'cards'
                    ? filteredCards.map((card) => {
                        const isSelected = card.id === currentCard?.id;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            className={`balance-card-pill ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedCardId(card.id)}
                          >
                            <span
                              className="tier-badge"
                              style={{
                                backgroundColor: `${TIER_COLORS[card.tierRating]}22`,
                                color: TIER_COLORS[card.tierRating],
                                borderColor: TIER_COLORS[card.tierRating],
                              }}
                            >
                              {card.tierRating}
                            </span>
                            <span className="card-pill-name">{card.name}</span>
                            <span className="card-pill-score">{card.overallScore}分</span>
                          </button>
                        );
                      })
                    : filteredRelics.map((relic) => {
                        const isSelected = relic.id === currentRelic?.id;
                        return (
                          <button
                            key={relic.id}
                            type="button"
                            className={`balance-card-pill relic ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedRelicId(relic.id)}
                          >
                            <span
                              className="tier-badge"
                              style={{
                                backgroundColor: `${TIER_COLORS[relic.tierRating]}22`,
                                color: TIER_COLORS[relic.tierRating],
                                borderColor: TIER_COLORS[relic.tierRating],
                              }}
                            >
                              {relic.tierRating}
                            </span>
                            <span className="card-pill-name">{relic.name}</span>
                            <span className="card-pill-score">{relic.overallScore}分</span>
                          </button>
                        );
                      })}
                </div>
              </div>
            </div>

            {/* Right Column: Deep Inspection Panel */}
            <div className="balance-inspector-column" data-testid="balance-detail-inspector">
              {targetType === 'cards' && currentCard ? (
                <div className="inspector-card">
                  {/* Item Title & Rating Banner */}
                  <div className="inspector-header">
                    <div className="inspector-title-row">
                      <span
                        className="tier-giant-badge"
                        style={{
                          borderColor: TIER_COLORS[currentCard.tierRating],
                          color: TIER_COLORS[currentCard.tierRating],
                        }}
                      >
                        {currentCard.tierRating}
                      </span>
                      <div>
                        <h4>{currentCard.name}</h4>
                        <div className="inspector-tags">
                          <span
                            className="category-tag"
                            style={{ color: CATEGORY_COLORS[currentCard.category] }}
                          >
                            {CATEGORY_NAMES[currentCard.category]}
                          </span>
                          {currentCard.tier && <span className="tier-tag">Tier {currentCard.tier}</span>}
                          <span className="archetype-tag">最適：{ARCHETYPE_NAMES[currentCard.bestArchetype]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="overall-score-badge">
                      <span className="score-num">{currentCard.overallScore}</span>
                      <span className="score-lbl">天梯評分</span>
                    </div>
                  </div>

                  <p className="inspector-desc">{currentCard.description}</p>

                  {/* Core Metrics Grid */}
                  <div className="metrics-quad-grid">
                    <div className="metric-box">
                      <span className="metric-title">綜合勝率</span>
                      <strong className="metric-val text-gold">
                        {(currentCard.winRate * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="metric-box">
                      <span className="metric-title">容錯穩定係數</span>
                      <strong className="metric-val text-cyan">
                        {(currentCard.faultToleranceRatio * 100).toFixed(0)}%
                      </strong>
                    </div>
                    <div className="metric-box">
                      <span className="metric-title">肉體生命損失</span>
                      <strong className="metric-val text-red">
                        {currentCard.avgHealthLost.toFixed(1)} 點生命
                      </strong>
                    </div>
                    <div className="metric-box">
                      <span className="metric-title">理智消耗</span>
                      <strong className="metric-val text-purple">
                        {currentCard.avgSanityExpended.toFixed(1)} 張
                      </strong>
                    </div>
                  </div>

                  {/* 1x, 2x, 3x Copies Curve with SVG Line Chart */}
                  <div className="inspector-section">
                    <h5 className="section-heading">
                      <TrendingUp size={15} />
                      <span>重複堆疊效益曲線 (1x / 2x / 3x 重複)</span>
                    </h5>
                    {/* SVG Line Chart */}
                    <CopiesLineChart curve={currentCard.copiesCurve} isRelic={false} />

                    {/* Step Cards Detail */}
                    <div className="copies-curve-container">
                      {[1, 2, 3].map((copyNum) => {
                        const copyData = currentCard.copiesCurve[copyNum as 1 | 2 | 3];
                        return (
                          <CopiesStepCard
                            key={copyNum}
                            label={`${copyNum}x 重複`}
                            score={copyData.overallScore}
                            winRate={copyData.winRate}
                            avgHealthLost={copyData.avgHealthLost}
                            avgSanityExpended={copyData.avgSanityExpended}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Six Archetypes Synergy Multipliers with Hexagonal Radar Chart */}
                  <div className="inspector-section">
                    <h5 className="section-heading">
                      <Target size={15} />
                      <span>六大流派協同倍率 (六邊形雷達圖)</span>
                    </h5>
                    {/* Hexagonal Radar Chart */}
                    <ArchetypeRadarChart
                      synergies={currentCard.synergyMultipliers}
                      bestArchetype={currentCard.bestArchetype}
                    />

                    {/* Synergy Bars Breakdown */}
                    <div className="archetype-synergy-grid">
                      {ARCHETYPE_ORDER.map((arch) => {
                        const mult = currentCard.synergyMultipliers[arch] || 1.0;
                        const isBest = currentCard.bestArchetype === arch;
                        const pct = Math.min(100, Math.round((mult / 2.0) * 100));

                        return (
                          <div key={arch} className={`synergy-row ${isBest ? 'best' : ''}`}>
                            <div className="synergy-label-row">
                              <span>{ARCHETYPE_NAMES[arch]}</span>
                              <strong>{mult.toFixed(2)}x {isBest && '★'}</strong>
                            </div>
                            <div className="synergy-bar-track">
                              <div
                                className={`synergy-bar-fill ${isBest ? 'gold' : ''}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Matchup Enemies: Favorable vs Unfavorable */}
                  <div className="inspector-section matchups-section">
                    <div className="matchup-half favorable">
                      <h6 className="matchup-title text-green">
                        <Check size={14} />
                        <span>優勢剋制敵怪</span>
                      </h6>
                      <ul className="matchup-list">
                        {currentCard.favorableEnemies.map((e) => (
                          <li key={e.id}>
                            <span className="enemy-name">{e.name}</span>
                            <span className="enemy-winrate">{(e.winRate * 100).toFixed(0)}% 勝率</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="matchup-half unfavorable">
                      <h6 className="matchup-title text-red">
                        <AlertTriangle size={14} />
                        <span>劣勢威脅敵怪</span>
                      </h6>
                      <ul className="matchup-list">
                        {currentCard.unfavorableEnemies.map((e) => (
                          <li key={e.id}>
                            <span className="enemy-name">{e.name}</span>
                            <span className="enemy-winrate">{(e.winRate * 100).toFixed(0)}% 勝率</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : targetType === 'relics' && currentRelic ? (
                <div className="inspector-card">
                  <div className="inspector-header">
                    <div className="inspector-title-row">
                      <span
                        className="tier-giant-badge"
                        style={{
                          borderColor: TIER_COLORS[currentRelic.tierRating],
                          color: TIER_COLORS[currentRelic.tierRating],
                        }}
                      >
                        {currentRelic.tierRating}
                      </span>
                      <div>
                        <h4>{currentRelic.name}</h4>
                        <div className="inspector-tags">
                          <span className="tier-tag">
                            階級：{RELIC_RARITY_LABELS[currentRelic.rarity] || currentRelic.rarity}（{currentRelic.tierRating}級）
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="overall-score-badge">
                      <span className="score-num">{currentRelic.overallScore}</span>
                      <span className="score-lbl">遺物價值評分</span>
                    </div>
                  </div>

                  <p className="inspector-desc">{currentRelic.description}</p>

                  <div className="relic-marginal-box">
                    <span>每件疊加邊際效益：</span>
                    <strong className="text-gold">+{currentRelic.marginalBenefitPerStack.toFixed(1)}% / 件</strong>
                  </div>

                  {/* 0x ~ 3x Relic Curve with Line Chart */}
                  <div className="inspector-section">
                    <h5 className="section-heading">
                      <TrendingUp size={15} />
                      <span>持有件數效益變化 (0x ~ 3x 持有)</span>
                    </h5>
                    {/* SVG Line Chart for Relic */}
                    <CopiesLineChart curve={currentRelic.copiesCurve} isRelic={true} />

                    <div className="copies-curve-container">
                      {([0, 1, 2, 3] as const).map((stack) => {
                        const stackData = currentRelic.copiesCurve[stack];
                        return (
                          <CopiesStepCard
                            key={stack}
                            label={`${stack}x 持有`}
                            score={stackData.score}
                            winRate={stackData.winRate}
                            avgHealthLost={stackData.avgHealthLost}
                            avgSanityExpended={stackData.avgSanityExpended}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Six Archetypes Synergy Multipliers for Relic */}
                  {currentRelic.synergyMultipliers && (
                    <div className="inspector-section">
                      <h5 className="section-heading">
                        <Target size={15} />
                        <span>六大流派協同倍率 (六邊形雷達圖)</span>
                      </h5>
                      <ArchetypeRadarChart
                        synergies={currentRelic.synergyMultipliers}
                        bestArchetype={currentRelic.bestArchetype || 'armor_counter'}
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        /* Enemies Threat Leaderboard (All 26 Enemies) */
        <div className="balance-enemies-layout" data-testid="enemy-threat-leaderboard">
          {/* Depth & Role Filter Bar */}
          <div className="enemy-leaderboard-filters">
            <div className="filter-group">
              <span className="filter-label">調查深度：</span>
              <button
                type="button"
                className={`filter-btn ${enemyDepthFilter === 'all' ? 'active' : ''}`}
                onClick={() => setEnemyDepthFilter('all')}
              >
                全部深度
              </button>
              <button
                type="button"
                className={`filter-btn ${enemyDepthFilter === 1 ? 'active' : ''}`}
                onClick={() => setEnemyDepthFilter(1)}
              >
                第一深度
              </button>
              <button
                type="button"
                className={`filter-btn ${enemyDepthFilter === 2 ? 'active' : ''}`}
                onClick={() => setEnemyDepthFilter(2)}
              >
                第二深度
              </button>
              <button
                type="button"
                className={`filter-btn ${enemyDepthFilter === 3 ? 'active' : ''}`}
                onClick={() => setEnemyDepthFilter(3)}
              >
                第三深度
              </button>
              <button
                type="button"
                className={`filter-btn ${enemyDepthFilter === 4 ? 'active' : ''}`}
                onClick={() => setEnemyDepthFilter(4)}
              >
                第四深度
              </button>
            </div>

            <div className="filter-group">
              <span className="filter-label">敵怪階級：</span>
              <button
                type="button"
                className={`filter-btn ${enemyRoleFilter === 'all' ? 'active' : ''}`}
                onClick={() => setEnemyRoleFilter('all')}
              >
                全部階級
              </button>
              <button
                type="button"
                className={`filter-btn ${enemyRoleFilter === 'normal' ? 'active' : ''}`}
                onClick={() => setEnemyRoleFilter('normal')}
              >
                常態敵怪
              </button>
              <button
                type="button"
                className={`filter-btn ${enemyRoleFilter === 'elite' ? 'active' : ''}`}
                onClick={() => setEnemyRoleFilter('elite')}
              >
                精英宿敵
              </button>
              <button
                type="button"
                className={`filter-btn ${enemyRoleFilter === 'boss' ? 'active' : ''}`}
                onClick={() => setEnemyRoleFilter('boss')}
              >
                守關首領
              </button>
            </div>
          </div>

          {/* Enemies Ranking Table */}
          <div className="enemy-ranking-table-card">
            <div className="table-header-row">
              <span className="th-cell rank">排名</span>
              <span className="th-cell name">敵怪名稱與稱號</span>
              <span className="th-cell depth">深度 / 階級</span>
              <span className="th-cell threat">威脅指數</span>
              <span className="th-cell winrate">調查員勝率</span>
              <span className="th-cell damage">平均損失 (生命 / 理智)</span>
              <span className="th-cell counter">剋制情報 (攻克 / 崩盤)</span>
              <span className="th-cell cards">最佳應對卡牌</span>
            </div>

            <div className="table-body">
              {filteredEnemies.map((enemy) => {
                const threatColor =
                  enemy.threatScore >= 80 ? '#ef4444' : enemy.threatScore >= 60 ? '#f59e0b' : '#38bdf8';

                return (
                  <div key={enemy.id} className="table-row">
                    <span className="td-cell rank">
                      <strong className="rank-num">#{enemy.rank}</strong>
                    </span>
                    <div className="td-cell name">
                      <strong>{enemy.name}</strong>
                      <span className="enemy-sub-title">{enemy.title}</span>
                    </div>
                    <div className="td-cell depth">
                      <span className="depth-badge">Depth {enemy.depth}</span>
                      <span className={`role-badge ${enemy.role}`}>{enemy.role}</span>
                    </div>
                    <div className="td-cell threat">
                      <span className="threat-score-pill" style={{ borderColor: threatColor, color: threatColor }}>
                        {enemy.threatScore}
                      </span>
                    </div>
                    <div className="td-cell winrate">
                      <strong className="winrate-num">
                        {(enemy.investigatorWinRate * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="td-cell damage">
                      <span className="life-loss">{enemy.avgInvestigatorHealthLost.toFixed(1)} 點生命</span>
                      <span className="sanity-loss">{enemy.avgSanityEroded.toFixed(1)} 理智</span>
                    </div>
                    <div className="td-cell counter">
                      <span className="vuln-tag">✓ {ARCHETYPE_NAMES[enemy.vulnerableArchetype]}</span>
                      <span className="danger-tag">✕ {ARCHETYPE_NAMES[enemy.dangerousArchetype]}</span>
                    </div>
                    <div className="td-cell cards">
                      {enemy.counteredByCards.slice(0, 2).map((c) => (
                        <span key={c.id} className="counter-card-chip">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
