import React from 'react';
import type { DeckTopologyNode } from '../engine/simulation/balanceTypes';
import { getHeatmapColor } from '../engine/simulation/deckTopology';

const CATEGORY_COLORS: Record<string, string> = {
  combat: '#ef4444',
  skill: '#3b82f6',
  magic: '#a855f7',
  truth: '#f8fafc',
  madness: '#64748b',
};

export interface DeckInspectorCardProps {
  deck: DeckTopologyNode;
  isDiffMode?: boolean;
  waitingForSecondDeck?: boolean;
}

export const DeckInspectorCard: React.FC<DeckInspectorCardProps> = ({
  deck,
  isDiffMode = false,
  waitingForSecondDeck = false,
}) => {
  const handRetention = deck.handRetention ?? deck.handCapacity ?? 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isDiffMode && waitingForSecondDeck && (
        <div className="diff-prompt-banner">
          已選定牌庫 A【{deck.name}】。請在左側星系散布圖點選第二套牌庫以啟動並列 Diff 深度比對！
        </div>
      )}

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <h4 style={{ margin: 0, fontSize: 15, color: '#ffd700' }}>{deck.name}</h4>
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              borderRadius: 4,
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {deck.archetypeName}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="deck-metrics-grid">
        <div className="deck-metric-box">
          <span className="deck-metric-lbl">雙軸綜合評分</span>
          <span className="deck-metric-val" style={{ color: getHeatmapColor(deck.overallScore) }}>
            {deck.overallScore} 分
          </span>
        </div>
        <div className="deck-metric-box">
          <span className="deck-metric-lbl">對弈勝率</span>
          <span className="deck-metric-val">{(deck.winRate * 100).toFixed(1)}%</span>
        </div>
        <div className="deck-metric-box">
          <span className="deck-metric-lbl">平均生命損失</span>
          <span className="deck-metric-val">{deck.avgHealthLost} 點生命</span>
        </div>
        <div className="deck-metric-box">
          <span className="deck-metric-lbl">平均心智消耗</span>
          <span className="deck-metric-val">{deck.avgSanityExpended} 點理智</span>
        </div>
        <div className="deck-metric-box">
          <span className="deck-metric-lbl">牌庫張數</span>
          <span className="deck-metric-val">{deck.totalCards} 張</span>
        </div>
        <div className="deck-metric-box">
          <span className="deck-metric-lbl">初始手牌保留數</span>
          <span className="deck-metric-val">{handRetention} 張</span>
        </div>
      </div>

      {/* Driving Combos */}
      {deck.drivingCombos.length > 0 && (
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>核心驅動連鎖：</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {deck.drivingCombos.map((combo, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  background: 'rgba(255, 215, 0, 0.1)',
                  color: '#ffd700',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: 4,
                }}
              >
                【{combo.cards.join(' ＋ ')}】(+{combo.synergy} 協同)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Full Cards List */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>
            牌庫卡表明細 ({deck.cards.length} 種 / 共 {deck.totalCards} 張)：
          </span>
        </div>
        <div className="deck-cards-list">
          {deck.cards.map((c) => {
            const catColor = CATEGORY_COLORS[c.category] || '#94a3b8';
            return (
              <div
                key={c.id}
                className="deck-card-row"
                style={{ borderLeftColor: catColor }}
              >
                <div className="deck-card-name-group">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: catColor,
                      display: 'inline-block',
                    }}
                  />
                  <span>{c.name}</span>
                </div>
                <strong style={{ color: '#ffd700' }}>x{c.copies}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
