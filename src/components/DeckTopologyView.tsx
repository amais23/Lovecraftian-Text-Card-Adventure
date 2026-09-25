import React, { useState, useMemo } from 'react';
import { GitCompare } from 'lucide-react';
import type { DeckTopologyNode, EmergentArchetype } from '../engine/simulation/balanceTypes';
import { getHeatmapColor } from '../engine/simulation/deckTopology';
import { DeckInspectorCard } from './DeckInspectorCard';
import { DeckDiffView } from './DeckDiffView';

export interface DeckTopologyViewProps {
  allDeckNodes: DeckTopologyNode[];
  emergentArchetypes: EmergentArchetype[];
}

export const DeckTopologyView: React.FC<DeckTopologyViewProps> = ({
  allDeckNodes,
  emergentArchetypes,
}) => {
  const [archetypeFilterTopology, setArchetypeFilterTopology] = useState<string>('all');
  const [selectedDeckId, setSelectedDeckId] = useState<string>(allDeckNodes[0]?.id || '');
  const [diffDeckId, setDiffDeckId] = useState<string | null>(null);
  const [isDiffMode, setIsDiffMode] = useState<boolean>(false);

  // Filtered Deck Nodes
  const filteredDeckNodes = useMemo(() => {
    if (archetypeFilterTopology === 'all') return allDeckNodes;
    return allDeckNodes.filter((node) => node.archetypeId === archetypeFilterTopology);
  }, [allDeckNodes, archetypeFilterTopology]);

  // Selected Deck A and Deck B
  const selectedDeckA = useMemo(() => {
    return allDeckNodes.find((d) => d.id === selectedDeckId) || allDeckNodes[0];
  }, [allDeckNodes, selectedDeckId]);

  const selectedDeckB = useMemo(() => {
    if (!diffDeckId) return null;
    return allDeckNodes.find((d) => d.id === diffDeckId) || null;
  }, [allDeckNodes, diffDeckId]);

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

  return (
    <div className="topology-layout" data-testid="balance-topology-view">
      {/* Controls Bar */}
      <div className="topology-controls-bar">
        <div className="topology-filter-group">
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
              共顯示 <strong style={{ color: '#ffd700' }}>{filteredDeckNodes.length}</strong> 套代表性牌庫
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

      {/* Main View: Scatter Plot + Deck Inspector */}
      <div className="topology-main-view">
        {/* Left: 2D MDS Scatter Plot */}
        <div className="topology-scatter-card" data-testid="topology-scatter-card">
          <svg
            viewBox="0 0 700 480"
            className="topology-scatter-svg"
            role="img"
            aria-label="理智牌庫拓撲星系散布圖"
          >
            {/* Background Grid */}
            <rect x="40" y="40" width="620" height="400" fill="rgba(15, 23, 42, 0.4)" stroke="#334155" strokeWidth="1" />
            <line x1="195" y1="40" x2="195" y2="440" stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="350" y1="40" x2="350" y2="440" stroke="#334155" strokeDasharray="4 4" />
            <line x1="505" y1="40" x2="505" y2="440" stroke="#1e293b" strokeDasharray="4 4" />

            <line x1="40" y1="140" x2="660" y2="140" stroke="#1e293b" strokeDasharray="4 4" />
            <line x1="40" y1="240" x2="660" y2="240" stroke="#334155" strokeDasharray="4 4" />
            <line x1="40" y1="340" x2="660" y2="340" stroke="#1e293b" strokeDasharray="4 4" />

            {/* Axes Labels */}
            <text x="350" y="468" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
              MDS 維度 1 (加權 Jaccard 卡牌構成親疏空間) →
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
              MDS 維度 2 (流派演化過渡軸) →
            </text>

            {/* Scatter Nodes */}
            {filteredDeckNodes.map((node) => {
              const cx = 40 + ((node.x - 0.05) / 0.9) * 620;
              const cy = 40 + ((node.y - 0.05) / 0.9) * 400;
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

          {/* Color Bar */}
          <div className="topology-color-bar-container" data-testid="topology-color-bar">
            <div className="color-bar-ticks">
              <span>0 分 (弱勢組合 / 冰藍)</span>
              <span>50 分 (中位平衡 / 青綠)</span>
              <span>100 分 (頂級強勢 / 明黃)</span>
            </div>
            <div className="color-bar-strip" />
            <div className="color-bar-hint">
              以雙軸綜合評分 (肉體生存 75% + 心智消耗 15% + 容錯穩定 10%) 為熱力漸變映射 · 距離表徵加權 Jaccard 相似度
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
