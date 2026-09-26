import React, { useState, useMemo } from 'react';
import { GitCompare, Dna, Compass } from 'lucide-react';
import type { DeckTopologyNode, EmergentArchetype } from '../engine/simulation/balanceTypes';
import { getHeatmapColor } from '../engine/simulation/deckTopology';
import { DeckInspectorCard } from './DeckInspectorCard';
import { DeckDiffView } from './DeckDiffView';
import mapElitesDataRaw from '../data/balance/map_elites_archetypes.json';

const PLOT_ORIGIN_X = 40;
const PLOT_ORIGIN_Y = 40;
const PLOT_WIDTH = 620;
const PLOT_HEIGHT = 400;
const NORMALIZED_PADDING = 0.05;
const NORMALIZED_SPAN = 0.90;

export interface DeckTopologyViewProps {
  allDeckNodes: DeckTopologyNode[];
  emergentArchetypes: EmergentArchetype[];
}

export const DeckTopologyView: React.FC<DeckTopologyViewProps> = ({
  allDeckNodes,
  emergentArchetypes,
}) => {
  const [viewMode, setViewMode] = useState<'map_elites' | 'galaxy'>('galaxy');
  const [archetypeFilterTopology, setArchetypeFilterTopology] = useState<string>('all');
  const [selectedDeckId, setSelectedDeckId] = useState<string>(allDeckNodes[0]?.id || '');
  const [diffDeckId, setDiffDeckId] = useState<string | null>(null);
  const [isDiffMode, setIsDiffMode] = useState<boolean>(false);

  // 解析 MAP-Elites 匯出數據 (ADR-0039)
  const mapElitesCells = useMemo(() => {
    return ((mapElitesDataRaw as any)?.cells || []) as (DeckTopologyNode & {
      cellKey: string;
      xBin: number;
      yBin: number;
      isPeakArchetype?: boolean;
      peakArchetypeId?: string;
      armorRatio: number;
      avgTier: number;
      baselineWin: boolean;
      stretchWin: boolean;
      baselineHpLost: number;
      stretchHpLost: number;
    })[];
  }, []);

  const peakArchetypes = useMemo(() => {
    return ((mapElitesDataRaw as any)?.peakArchetypes || []) as Array<{
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
    }>;
  }, []);

  const mapElitesCellMap = useMemo(() => {
    const map = new Map<string, (typeof mapElitesCells)[0]>();
    for (const cell of mapElitesCells) {
      map.set(cell.cellKey, cell);
      map.set(cell.id, cell);
    }
    return map;
  }, [mapElitesCells]);

  // 全量可用牌庫集合 (含 SVD 星系節點與 MAP-Elites 菁英節點)
  const allAvailableDecks = useMemo(() => {
    return [...allDeckNodes, ...(mapElitesCells as DeckTopologyNode[])];
  }, [allDeckNodes, mapElitesCells]);

  // Filtered Deck Nodes (針對星系圖)
  const filteredDeckNodes = useMemo(() => {
    if (archetypeFilterTopology === 'all') return allDeckNodes;
    return allDeckNodes.filter((node) => node.archetypeId === archetypeFilterTopology);
  }, [allDeckNodes, archetypeFilterTopology]);

  // Selected Deck A and Deck B
  const selectedDeckA = useMemo(() => {
    return allAvailableDecks.find((d) => d.id === selectedDeckId) || allDeckNodes[0];
  }, [allAvailableDecks, selectedDeckId, allDeckNodes]);

  const selectedDeckB = useMemo(() => {
    if (!diffDeckId) return null;
    return allAvailableDecks.find((d) => d.id === diffDeckId) || null;
  }, [allAvailableDecks, diffDeckId]);

  const handleDeckNodeClick = (nodeId: string) => {
    if (!isDiffMode) {
      setSelectedDeckId(nodeId);
      return;
    }

    // In Diff Mode:
    if (!selectedDeckId) {
      setSelectedDeckId(nodeId);
    } else if (!diffDeckId) {
      if (nodeId !== selectedDeckId) {
        setDiffDeckId(nodeId);
      }
    } else {
      if (nodeId === selectedDeckId) {
        setSelectedDeckId(diffDeckId);
        setDiffDeckId(null);
      } else if (nodeId === diffDeckId) {
        setDiffDeckId(null);
      } else {
        setDiffDeckId(nodeId);
      }
    }
  };

  const cellWidth = PLOT_WIDTH / 8;
  const cellHeight = PLOT_HEIGHT / 8;

  return (
    <div className="topology-layout" data-testid="balance-topology-view">
      {/* Controls Bar */}
      <div className="topology-controls-bar">
        <div className="topology-filter-group">
          {/* View Mode Switcher */}
          <div className="topology-mode-selector">
            <button
              type="button"
              className={`topology-mode-btn highlight ${viewMode === 'map_elites' ? 'active' : ''}`}
              onClick={() => setViewMode('map_elites')}
              aria-label="切換至 MAP-Elites 8x8 極值生態網格"
            >
              <Dna size={15} />
              <span>MAP-Elites 8×8 極值生態網格 (ADR-0039)</span>
            </button>
            <button
              type="button"
              className={`topology-mode-btn ${viewMode === 'galaxy' ? 'active' : ''}`}
              onClick={() => setViewMode('galaxy')}
              aria-label="切換至語意星系拓撲圖"
            >
              <Compass size={15} />
              <span>語意星系拓撲圖 (SVD 投影)</span>
            </button>
          </div>

          <div className="topology-select-wrap">
            <span>流派過濾：</span>
            <select
              aria-label="自然湧現流派過濾"
              className="topology-select"
              value={archetypeFilterTopology}
              onChange={(e) => setArchetypeFilterTopology(e.target.value)}
            >
              <option value="all">全部自然湧現流派 ({allDeckNodes.length} 套牌庫)</option>
              {emergentArchetypes.map((arch) => (
                <option key={arch.id} value={arch.id}>
                  {arch.name} ({arch.deckCount} 套 / 均分 {arch.avgScore})
                </option>
              ))}
            </select>
          </div>

          <div className="topology-select-wrap">
            <span style={{ color: '#94a3b8' }}>
              顯示 <strong style={{ color: '#ffd700' }}>
                {viewMode === 'map_elites' ? mapElitesCells.length : filteredDeckNodes.length}
              </strong> 套牌庫
            </span>
          </div>
        </div>

        <label className="topology-diff-toggle">
          <input
            type="checkbox"
            aria-label="啟用 Diff 雙套牌庫對比模式"
            checked={isDiffMode}
            onChange={(e) => {
              setIsDiffMode(e.target.checked);
              if (!e.target.checked) {
                setDiffDeckId(null);
              }
            }}
          />
          <GitCompare size={14} />
          <span>啟用 Diff 雙套牌庫對比模式</span>
        </label>
      </div>

      {/* MAP-Elites 探勘出的 6 大局部極值流派推薦卡匣列 */}
      {peakArchetypes.length > 0 && (
        <div className="map-elites-peaks-shelf" data-testid="map-elites-peaks-shelf">
          <div className="map-elites-peaks-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>👑 MAP-Elites 局部極值代表流派 (ADR-0039 演化探勘成果)</span>
              <span style={{ fontSize: 11, color: '#38bdf8', padding: '1px 6px', background: 'rgba(56, 189, 248, 0.15)', borderRadius: 3 }}>
                點擊即時檢視卡表與實戰戰績
              </span>
            </span>
            <span>收斂覆蓋 {mapElitesCells.length}/64 格生態矩陣</span>
          </div>
          <div className="map-elites-peaks-list">
            {peakArchetypes.map((peak, idx) => {
              const matchedNode = mapElitesCellMap.get(peak.cellKey);
              const isSelected = selectedDeckA?.name === peak.name || (matchedNode && selectedDeckA?.id === matchedNode.id);
              return (
                <button
                  key={peak.id}
                  type="button"
                  className={`map-elites-peak-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (matchedNode) {
                      handleDeckNodeClick(matchedNode.id);
                    }
                  }}
                  title={peak.description}
                >
                  <div className="map-elites-peak-title">
                    <span>#{idx + 1}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{peak.name}</span>
                  </div>
                  <div className="map-elites-peak-meta">
                    <span>T{peak.avgTier.toFixed(1)} · {(peak.armorRatio * 100).toFixed(0)}% 護甲</span>
                    <strong style={{ color: getHeatmapColor(peak.fitness) }}>{peak.fitness.toFixed(1)} 分</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main View: Scatter Plot / Grid + Deck Inspector */}
      <div className="topology-main-view">
        {/* Left: 2D MDS Scatter Plot OR MAP-Elites Grid */}
        <div className="topology-scatter-card" data-testid="topology-scatter-card">
          {viewMode === 'map_elites' ? (
            /* MAP-Elites 8x8 Feature Grid */
            <svg
              viewBox="0 0 700 480"
              className="topology-scatter-svg"
              role="img"
              aria-label="MAP-Elites 8x8 特徵生態網格"
            >
              {/* Background Grid */}
              <rect
                x={PLOT_ORIGIN_X}
                y={PLOT_ORIGIN_Y}
                width={PLOT_WIDTH}
                height={PLOT_HEIGHT}
                fill="rgba(15, 23, 42, 0.4)"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* 8x8 Grid Cells */}
              {Array.from({ length: 8 }).map((_, yIdx) => {
                const yBin = 7 - yIdx; // 7 (Top: Tier 3.5) down to 0 (Bottom: Tier 1.0)
                return Array.from({ length: 8 }).map((__, xBin) => {
                  const cellKey = `${xBin}_${yBin}`;
                  const cell = mapElitesCellMap.get(cellKey);
                  const cx = PLOT_ORIGIN_X + xBin * cellWidth + 2;
                  const cy = PLOT_ORIGIN_Y + yIdx * cellHeight + 2;
                  const cw = cellWidth - 4;
                  const ch = cellHeight - 4;

                  const isSelectedA = selectedDeckA && (selectedDeckA.id === cell?.id || selectedDeckA.name === cell?.name);
                  const isSelectedB = isDiffMode && selectedDeckB && (selectedDeckB.id === cell?.id || selectedDeckB.name === cell?.name);

                  if (!cell) {
                    return (
                      <rect
                        key={cellKey}
                        x={cx}
                        y={cy}
                        width={cw}
                        height={ch}
                        fill="rgba(15, 23, 42, 0.25)"
                        stroke="rgba(148, 163, 184, 0.12)"
                        strokeDasharray="3 3"
                        rx={4}
                      >
                        <title>{`生態格 (${xBin}, ${yBin})：未填補區域`}</title>
                      </rect>
                    );
                  }

                  let stroke = cell.isPeakArchetype ? '#ffd700' : 'rgba(255, 255, 255, 0.2)';
                  let strokeWidth = cell.isPeakArchetype ? 2 : 1;
                  let fill = getHeatmapColor(cell.overallScore);

                  if (isSelectedA) {
                    stroke = isDiffMode ? '#38bdf8' : '#ffd700';
                    strokeWidth = 3;
                  } else if (isSelectedB) {
                    stroke = '#f59e0b';
                    strokeWidth = 3;
                  }

                  return (
                    <g
                      key={cell.id}
                      onClick={() => handleDeckNodeClick(cell.id)}
                      className="map-elites-grid-cell"
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={cx}
                        y={cy}
                        width={cw}
                        height={ch}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        opacity={isSelectedA || isSelectedB ? 1.0 : (cell.isPeakArchetype ? 0.95 : 0.85)}
                        rx={4}
                      />
                      <text
                        x={cx + cw / 2}
                        y={cy + ch / 2 - 2}
                        textAnchor="middle"
                        fill="#080c14"
                        fontSize="11"
                        fontWeight="700"
                        pointerEvents="none"
                      >
                        {cell.overallScore.toFixed(0)}分
                      </text>
                      <text
                        x={cx + cw / 2}
                        y={cy + ch / 2 + 12}
                        textAnchor="middle"
                        fill="#080c14"
                        fontSize="9"
                        fontWeight="600"
                        opacity={0.85}
                        pointerEvents="none"
                      >
                        {cell.isPeakArchetype ? '👑極值' : `T${cell.avgTier.toFixed(1)}`}
                      </text>
                      <title>{`${cell.name}\n綜合評分: ${cell.overallScore} 分 | 階級: T${cell.avgTier.toFixed(1)}\n護甲比: ${(cell.armorRatio * 100).toFixed(0)}% | 規模: ${cell.totalCards} 張\n越級結果: ${cell.stretchWin ? '成功擊破 ✅' : '未突破 ❌'}`}</title>
                    </g>
                  );
                });
              })}

              {/* Axes Labels */}
              <text x="350" y="468" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
                攻防風格 (0% 穿刺直傷 ◄────── 平衡 ──────► 100% 鐵壁防禦) →
              </text>
              <text
                x="-240"
                y="22"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="12"
                fontWeight="600"
                transform="rotate(-90)"
              >
                卡牌階級發育軸 (Tier 1.0 前期平民 ◄── 中期 ──► Tier 3.5+ 後期神話) →
              </text>
            </svg>
          ) : (
            /* Galaxy Scatter View */
            <svg
              viewBox="0 0 700 480"
              className="topology-scatter-svg"
              role="img"
              aria-label="理智牌庫拓撲星系散布圖"
            >
              {/* Background Grid */}
              <rect
                x={PLOT_ORIGIN_X}
                y={PLOT_ORIGIN_Y}
                width={PLOT_WIDTH}
                height={PLOT_HEIGHT}
                fill="rgba(15, 23, 42, 0.4)"
                stroke="#334155"
                strokeWidth="1"
              />
              <line x1="195" y1="40" x2="195" y2="440" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="350" y1="40" x2="350" y2="440" stroke="#334155" strokeDasharray="4 4" />
              <line x1="505" y1="40" x2="505" y2="440" stroke="#1e293b" strokeDasharray="4 4" />

              <line x1="40" y1="140" x2="660" y2="140" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="40" y1="240" x2="660" y2="240" stroke="#334155" strokeDasharray="4 4" />
              <line x1="40" y1="340" x2="660" y2="340" stroke="#1e293b" strokeDasharray="4 4" />

              {/* Axes Labels */}
              <text x="350" y="468" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
                力導向星系維度 1 (卡牌機制語意親疏軸) →
              </text>
              <text
                x="-240"
                y="22"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="12"
                fontWeight="600"
                transform="rotate(-90)"
              >
                力導向星系維度 2 (流派演化過渡軸) →
              </text>

              {/* Scatter Nodes */}
              {filteredDeckNodes.map((node) => {
                const cx = PLOT_ORIGIN_X + ((node.x - NORMALIZED_PADDING) / NORMALIZED_SPAN) * PLOT_WIDTH;
                const cy = PLOT_ORIGIN_Y + ((node.y - NORMALIZED_PADDING) / NORMALIZED_SPAN) * PLOT_HEIGHT;
                const isSelectedA = selectedDeckA?.id === node.id;
                const isSelectedB = isDiffMode && selectedDeckB?.id === node.id;
                const color = getHeatmapColor(node.overallScore);

                let r = 5;
                let stroke = 'rgba(0, 0, 0, 0.6)';
                let strokeWidth = 1;
                let opacity = 0.85;

                if (isSelectedA) {
                  r = 8;
                  stroke = isDiffMode ? '#38bdf8' : '#ffd700';
                  strokeWidth = 2.5;
                  opacity = 1;
                } else if (isSelectedB) {
                  r = 8;
                  stroke = '#f59e0b';
                  strokeWidth = 2.5;
                  opacity = 1;
                }

                const handRetention = node.handRetention ?? node.handCapacity ?? 2;

                return (
                  <circle
                    key={node.id}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={color}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                    className="topology-node-point"
                    data-testid={`deck-node-${node.id}`}
                    onClick={() => handleDeckNodeClick(node.id)}
                  >
                    <title>{`${node.name}\n綜合評分: ${node.overallScore} 分 | 勝率: ${(node.winRate * 100).toFixed(0)}%\n規模: ${node.totalCards} 張 | 初始手牌保留數: ${handRetention} 張`}</title>
                  </circle>
                );
              })}
            </svg>
          )}

          {/* Color Bar */}
          <div className="topology-color-bar-container" data-testid="topology-color-bar">
            <div className="color-bar-ticks">
              <span>&lt; 40 分 (弱勢 / 深海冰藍)</span>
              <span>40 ~ 70 分 (中位平衡 / 青綠)</span>
              <span>&ge; 70 分 (頂級強勢 / 明亮鮮黃)</span>
            </div>
            <div className="color-bar-strip" />
            <div className="color-bar-hint">
              {viewMode === 'map_elites'
                ? 'MAP-Elites 8×8 攻防風格 × 卡牌階級生態矩陣 · 金框標註 👑 真正局部極值流派 (ADR-0039)'
                : '以雙軸綜合評分 (肉體生存 75% + 心智消耗 15% + 容錯穩定 10%) 為熱力漸變映射 · 空間距離表徵力導向星系投影 (Soft Cosine Distance)'}
            </div>
          </div>
        </div>

        {/* Right: Deck Inspector Panel */}
        <div className="topology-inspector-card" data-testid="topology-inspector-card">
          {isDiffMode && selectedDeckA && selectedDeckB ? (
            <DeckDiffView deckA={selectedDeckA} deckB={selectedDeckB} />
          ) : (
            selectedDeckA && (
              <DeckInspectorCard
                deck={selectedDeckA}
                isDiffMode={isDiffMode}
                waitingForSecondDeck={isDiffMode && !selectedDeckB}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};
