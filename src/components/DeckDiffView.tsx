import React, { useMemo } from 'react';
import type { DeckTopologyNode } from '../engine/simulation/balanceTypes';
import type { CardCategory } from '../types/game';

export interface DeckDiffViewProps {
  deckA: DeckTopologyNode;
  deckB: DeckTopologyNode;
}

export const DeckDiffView: React.FC<DeckDiffViewProps> = ({ deckA, deckB }) => {
  const handRetentionA = deckA.handRetention ?? deckA.handCapacity ?? 2;
  const handRetentionB = deckB.handRetention ?? deckB.handCapacity ?? 2;

  const diffStats = useMemo(() => {
    return {
      scoreDelta: deckA.overallScore - deckB.overallScore,
      cardsDelta: deckA.totalCards - deckB.totalCards,
      handDelta: handRetentionA - handRetentionB,
      winRateDelta: Number(((deckA.winRate - deckB.winRate) * 100).toFixed(1)),
      hpLossDelta: Number((deckA.avgHealthLost - deckB.avgHealthLost).toFixed(1)),
      sanityDelta: Number((deckA.avgSanityExpended - deckB.avgSanityExpended).toFixed(1)),
    };
  }, [deckA, deckB, handRetentionA, handRetentionB]);

  const diffCardBreakdown = useMemo(() => {
    const bMap = new Map(deckB.cards.map((c) => [c.id, c]));
    const aMap = new Map(deckA.cards.map((c) => [c.id, c]));

    const sharedCards: Array<{
      id: string;
      name: string;
      copiesA: number;
      copiesB: number;
      category: CardCategory;
    }> = [];
    const aOnlyCards: Array<{ id: string; name: string; copies: number; category: CardCategory }> = [];
    const bOnlyCards: Array<{ id: string; name: string; copies: number; category: CardCategory }> = [];

    for (const aCard of deckA.cards) {
      const bCard = bMap.get(aCard.id);
      if (bCard) {
        sharedCards.push({
          id: aCard.id,
          name: aCard.name,
          copiesA: aCard.copies,
          copiesB: bCard.copies,
          category: aCard.category,
        });
      } else {
        aOnlyCards.push(aCard);
      }
    }

    for (const bCard of deckB.cards) {
      if (!aMap.has(bCard.id)) {
        bOnlyCards.push(bCard);
      }
    }

    return { sharedCards, aOnlyCards, bOnlyCards };
  }, [deckA, deckB]);

  return (
    <div className="diff-comparison-view" data-testid="diff-comparison-view">
      <div className="diff-header-row">
        <div>
          <span className="diff-badge diff-badge-a">牌庫 A</span>
          <strong style={{ marginLeft: 6, fontSize: 13, color: '#f8fafc' }}>
            {deckA.name}
          </strong>
        </div>
      </div>
      <div className="diff-header-row">
        <div>
          <span className="diff-badge diff-badge-b">牌庫 B</span>
          <strong style={{ marginLeft: 6, fontSize: 13, color: '#f8fafc' }}>
            {deckB.name}
          </strong>
        </div>
      </div>

      {/* Diff Stats Table */}
      <table className="diff-stats-table">
        <thead>
          <tr>
            <th>評測指標</th>
            <th style={{ color: '#38bdf8' }}>牌庫 A</th>
            <th style={{ color: '#f59e0b' }}>牌庫 B</th>
            <th>差值 (A - B)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>綜合評分</td>
            <td>{deckA.overallScore} 分</td>
            <td>{deckB.overallScore} 分</td>
            <td style={{ color: diffStats.scoreDelta >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
              {diffStats.scoreDelta > 0 ? `+${diffStats.scoreDelta}` : diffStats.scoreDelta} 分
            </td>
          </tr>
          <tr>
            <td>敵怪對弈勝率</td>
            <td>{(deckA.winRate * 100).toFixed(1)}%</td>
            <td>{(deckB.winRate * 100).toFixed(1)}%</td>
            <td style={{ color: diffStats.winRateDelta >= 0 ? '#10b981' : '#ef4444' }}>
              {diffStats.winRateDelta > 0 ? `+${diffStats.winRateDelta}` : diffStats.winRateDelta}%
            </td>
          </tr>
          <tr>
            <td>平均生命損失</td>
            <td>{deckA.avgHealthLost} 點生命</td>
            <td>{deckB.avgHealthLost} 點生命</td>
            <td style={{ color: diffStats.hpLossDelta <= 0 ? '#10b981' : '#ef4444' }}>
              {diffStats.hpLossDelta > 0 ? `+${diffStats.hpLossDelta}` : diffStats.hpLossDelta} 點生命
            </td>
          </tr>
          <tr>
            <td>平均心智消耗</td>
            <td>{deckA.avgSanityExpended} 點理智</td>
            <td>{deckB.avgSanityExpended} 點理智</td>
            <td style={{ color: diffStats.sanityDelta <= 0 ? '#10b981' : '#ef4444' }}>
              {diffStats.sanityDelta > 0 ? `+${diffStats.sanityDelta}` : diffStats.sanityDelta} 點理智
            </td>
          </tr>
          <tr>
            <td>牌庫總數</td>
            <td>{deckA.totalCards} 張</td>
            <td>{deckB.totalCards} 張</td>
            <td>{diffStats.cardsDelta > 0 ? `+${diffStats.cardsDelta}` : diffStats.cardsDelta} 張</td>
          </tr>
          <tr>
            <td>初始手牌保留數</td>
            <td>{handRetentionA} 張</td>
            <td>{handRetentionB} 張</td>
            <td>{diffStats.handDelta > 0 ? `+${diffStats.handDelta}` : diffStats.handDelta} 張</td>
          </tr>
        </tbody>
      </table>

      {/* Card Composition Diff */}
      <div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>
          卡牌構成差異分析：
        </span>
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#38bdf8' }}>
            牌庫 A 獨有卡牌 ({diffCardBreakdown.aOnlyCards.length} 種)：
          </span>
          <div className="diff-card-pills-container">
            {diffCardBreakdown.aOnlyCards.length === 0 ? (
              <span style={{ fontSize: 11, color: '#64748b' }}>無獨有卡牌</span>
            ) : (
              diffCardBreakdown.aOnlyCards.map((c) => (
                <span key={c.id} className="diff-card-pill a-only">
                  {c.name} x{c.copies}
                </span>
              ))
            )}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#f59e0b' }}>
            牌庫 B 獨有卡牌 ({diffCardBreakdown.bOnlyCards.length} 種)：
          </span>
          <div className="diff-card-pills-container">
            {diffCardBreakdown.bOnlyCards.length === 0 ? (
              <span style={{ fontSize: 11, color: '#64748b' }}>無獨有卡牌</span>
            ) : (
              diffCardBreakdown.bOnlyCards.map((c) => (
                <span key={c.id} className="diff-card-pill b-only">
                  {c.name} x{c.copies}
                </span>
              ))
            )}
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            共通卡牌 ({diffCardBreakdown.sharedCards.length} 種)：
          </span>
          <div className="diff-card-pills-container">
            {diffCardBreakdown.sharedCards.length === 0 ? (
              <span style={{ fontSize: 11, color: '#64748b' }}>無共通卡牌</span>
            ) : (
              diffCardBreakdown.sharedCards.map((c) => (
                <span key={c.id} className="diff-card-pill shared">
                  {c.name} (A: {c.copiesA} / B: {c.copiesB})
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
