import React, { useState, useMemo } from 'react';
import {
  Map as MapIcon,
  Globe,
  Compass,
  Activity,
  Skull,
  Layers,
  Search,
  RefreshCw,
  GitFork,
  Users,
} from 'lucide-react';
import journeySummaryInvestigatorRaw from '../data/balance/journey_summary.json';
import journeySummaryOccultistRaw from '../data/balance/journey_summary_occultist.json';
import {
  SLICE_DEFINITIONS,
  type JourneySummaryJson,
  type SliceSimulationSummary,
} from '../engine/simulation/journeyScheduler';
import { soundEngine } from '../engine/audioManager';
import '../styles/journeyHeatmap.css';

type SubTabKey = 'monsters' | 'deck' | 'cards' | 'paths' | 'groups';

export interface JourneyHeatmapDashboardProps {
  containerRef?: React.Ref<HTMLDivElement>;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  customSummaryData?: JourneySummaryJson;
}

export const JourneyHeatmapDashboard: React.FC<JourneyHeatmapDashboardProps> = ({
  containerRef,
  onScroll,
  customSummaryData,
}) => {
  const [selectedOccupation, setSelectedOccupation] = useState<'investigator' | 'occultist'>('investigator');
  const [selectedSliceId, setSelectedSliceId] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('monsters');
  const [showAllMonsters, setShowAllMonsters] = useState<boolean>(false);
  const [cardSearch, setCardSearch] = useState<string>('');
  const [cardCategoryFilter, setCardCategoryFilter] = useState<string>('all');
  const [dataVersion, setDataVersion] = useState<number>(0);

  const summaryData: JourneySummaryJson = useMemo(() => {
    if (customSummaryData) {
      return customSummaryData;
    }
    if (dataVersion < 0) return journeySummaryInvestigatorRaw as unknown as JourneySummaryJson;
    return selectedOccupation === 'occultist'
      ? (journeySummaryOccultistRaw as unknown as JourneySummaryJson)
      : (journeySummaryInvestigatorRaw as unknown as JourneySummaryJson);
  }, [customSummaryData, selectedOccupation, dataVersion]);

  const hasData = Boolean(
    summaryData &&
    summaryData.progression &&
    summaryData.progression.length > 0 &&
    (summaryData.totalRollouts ?? 0) > 0
  );

  const investigatorTotalRollouts = useMemo(() => {
    if (customSummaryData && selectedOccupation === 'investigator') {
      return summaryData.totalRollouts;
    }
    return (journeySummaryInvestigatorRaw as unknown as JourneySummaryJson)?.totalRollouts;
  }, [customSummaryData, selectedOccupation, summaryData]);

  const occultistTotalRollouts = useMemo(() => {
    if (customSummaryData && selectedOccupation === 'occultist') {
      return summaryData.totalRollouts;
    }
    return (journeySummaryOccultistRaw as unknown as JourneySummaryJson)?.totalRollouts;
  }, [customSummaryData, selectedOccupation, summaryData]);

  const formatSampleCount = (count?: number) => {
    if (!count) return '';
    return `${(count / 10000).toFixed(0)}萬樣本`;
  };

  const currentSlice: SliceSimulationSummary | undefined = useMemo(() => {
    if (!summaryData?.slices) return undefined;
    const id = selectedSliceId === 0 ? 1 : selectedSliceId;
    return summaryData.slices[id] ?? summaryData.slices[1];
  }, [summaryData, selectedSliceId]);

  // Global 26-monsters threat ranking across all slices
  const globalMonstersLeaderboard = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      depth: number;
      role: string;
      health: number;
      armor: number;
      encounters: number;
      kills: number;
      totalHpLoss: number;
    }>();

    Object.values(summaryData?.slices || {}).forEach((slice) => {
      (slice.monsters || []).forEach((m) => {
        const existing = map.get(m.id);
        if (existing) {
          existing.encounters += m.encounters;
          existing.kills += m.kills;
          existing.totalHpLoss += m.meanHpLoss * m.encounters;
        } else {
          map.set(m.id, {
            id: m.id,
            name: m.name,
            depth: m.depth,
            role: m.role,
            health: m.health,
            armor: m.armor,
            encounters: m.encounters,
            kills: m.kills,
            totalHpLoss: m.meanHpLoss * m.encounters,
          });
        }
      });
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        lethality: item.encounters > 0 ? item.kills / item.encounters : 0,
        meanHpLoss: item.encounters > 0 ? item.totalHpLoss / item.encounters : 0,
      }))
      .sort((a, b) => b.kills - a.kills);
  }, [summaryData]);

  // 4-Persona cross-slice survival matrix
  const personaProgressionMatrix = useMemo(() => {
    const personas: Array<{ key: 'balanced' | 'cautious' | 'greedy' | 'pure_random'; label: string }> = [
      { key: 'cautious', label: '生存謹慎型 (Cautious)' },
      { key: 'balanced', label: '常態平衡型 (Balanced)' },
      { key: 'greedy', label: '貪婪構築型 (Greedy)' },
      { key: 'pure_random', label: '純隨機探索型 (Random)' },
    ];

    return personas.map((p) => {
      const sliceRates = (summaryData?.progression || []).map((s) => {
        const perf = s.personas?.[p.key];
        return perf ? { survivalRate: perf.survivalRate, meanCombatHpLoss: perf.meanCombatHpLoss } : null;
      });
      return {
        ...p,
        sliceRates,
      };
    });
  }, [summaryData]);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    if (!currentSlice?.cards) return [];
    return currentSlice.cards.filter((card) => {
      const matchSearch =
        card.name.toLowerCase().includes(cardSearch.toLowerCase()) ||
        card.id.toLowerCase().includes(cardSearch.toLowerCase());
      const matchCat = cardCategoryFilter === 'all' || card.category === cardCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [currentSlice, cardSearch, cardCategoryFilter]);

  // Filtered Monsters
  const filteredMonsters = useMemo(() => {
    if (!currentSlice?.monsters) return [];
    return showAllMonsters
      ? currentSlice.monsters
      : currentSlice.monsters.filter((m) => m.depth === currentSlice.sliceDef.depth);
  }, [currentSlice, showAllMonsters]);

  const handleSliceClick = (id: number) => {
    soundEngine.playClick();
    setSelectedSliceId(id);
  };

  const handleSubTabClick = (tab: SubTabKey) => {
    soundEngine.playClick();
    setActiveSubTab(tab);
  };

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="journey-heatmap-container"
      tabIndex={0}
      aria-label="全地圖七階切片多流派蒙地卡羅平衡模擬熱點地圖"
    >
      {/* 1. Header & Meta Banner */}
      <div className="journey-meta-banner">
        <div className="journey-title-group">
          <h2>
            <MapIcon size={22} />
            全地圖七階切片多流派蒙地卡羅平衡模擬熱點地圖
          </h2>
          <p>
            基於 ADR-0042 蒙地卡羅多流派抽樣與全域混合存活池交接之客觀數值矩陣
          </p>
        </div>

        {/* Occupation Switcher */}
        <div className="journey-occupation-tabs">
          <button
            type="button"
            className={`journey-occ-chip ${selectedOccupation === 'investigator' ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setSelectedOccupation('investigator');
            }}
          >
            🕵️ 私家偵探 {investigatorTotalRollouts ? `(${formatSampleCount(investigatorTotalRollouts)})` : ''}
          </button>
          <button
            type="button"
            className={`journey-occ-chip ${selectedOccupation === 'occultist' ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playClick();
              setSelectedOccupation('occultist');
            }}
          >
            🔮 秘術學者 {occultistTotalRollouts ? `(${formatSampleCount(occultistTotalRollouts)})` : ''}
          </button>
        </div>

        <div className="journey-stat-badges">
          <div className="journey-badge">
            <span>總抽樣軌跡</span>
            <strong>{summaryData.totalRollouts?.toLocaleString() ?? 0} 條</strong>
          </div>
          <div className="journey-badge highlight">
            <span>全程累積存活率</span>
            <strong>{((summaryData.overallSurvivalRate ?? 0) * 100).toFixed(2)}%</strong>
          </div>
          <div className="journey-badge">
            <span>歷程淨損血</span>
            <strong>{(summaryData?.totalJourneyNetHpLoss ?? 0).toFixed(1)} 生命值</strong>
          </div>
          <div className="journey-badge">
            <span>模擬耗時</span>
            <strong>{((summaryData.elapsedMilliseconds ?? 0) / 1000).toFixed(1)} 秒</strong>
          </div>
          <button
            type="button"
            className="sub-tab-btn"
            style={{ border: '1px solid rgba(148, 163, 184, 0.2)' }}
            onClick={() => {
              soundEngine.playClick();
              setDataVersion((v) => v + 1);
            }}
            title="手動重新載入報告"
          >
            <RefreshCw size={14} />
            重新載入
          </button>
        </div>
      </div>

      {/* 2. Empty State vs Full Progression Overview */}
      {!hasData || !currentSlice ? (
        <div className="journey-empty-state" data-testid="journey-empty-state" role="alert">
          <div className="journey-empty-icon">
            <Activity size={44} />
          </div>
          <h3 className="journey-empty-title">尚無全地圖數值模擬資料</h3>
          <p className="journey-empty-description">
            尚未在 <code>src/data/balance/journey_summary.json</code> 檢測到有效的模擬報告數據。
          </p>
          <div className="journey-empty-guidance">
            請於終端機執行下列命令以產生最新全地圖七階切片平衡模擬報告：
          </div>
          <div className="journey-empty-code-box">
            <code>npm run sim:journey</code>
          </div>
          <button
            type="button"
            className="journey-empty-retry-btn"
            onClick={() => {
              soundEngine.playClick();
              setDataVersion((v) => v + 1);
            }}
          >
            <RefreshCw size={15} />
            <span>重新載入報告</span>
          </button>
        </div>
      ) : (
        <>
          {/* Top Progression Overview (7-Slice Timeline) */}
          <div className="progression-section">
            <div className="progression-section-title">
              <Compass size={18} />
              七階切片宏觀進程走勢 (Seven-Slice Cross-Progression Overview)
            </div>

        <div className="progression-cards-grid">
          {summaryData.progression?.map((s) => {
            const isActive = s.sliceId === selectedSliceId;
            const survPct = (s.sliceSurvivalRate * 100).toFixed(1);
            const barColor =
              s.sliceSurvivalRate >= 0.7
                ? '#22c55e'
                : s.sliceSurvivalRate >= 0.4
                ? '#f59e0b'
                : '#ef4444';

            return (
              <div
                key={s.sliceId}
                className={`progression-card ${isActive ? 'active' : ''}`}
                onClick={() => handleSliceClick(s.sliceId)}
              >
                <div className="progression-card-header">
                  <span className="progression-card-title">Slice {s.sliceId}</span>
                  <span className="progression-card-depth">Depth {s.sliceDef.depth}</span>
                </div>
                <div className="progression-card-role">{s.sliceDef.role}</div>

                <div className="progression-bar-container">
                  <div
                    className="progression-bar-fill"
                    style={{ width: `${survPct}%`, backgroundColor: barColor }}
                  />
                </div>

                <div className="progression-metrics-row">
                  <span>存活率:</span>
                  <strong>{survPct}%</strong>
                </div>
                <div className="progression-metrics-row">
                  <span>單場損血:</span>
                  <strong>{s.meanCombatHpLoss.toFixed(1)} 生命值</strong>
                </div>
                <div className="progression-metrics-row">
                  <span>累計損血:</span>
                  <strong>{s.meanNetHpLoss.toFixed(1)} 生命值</strong>
                </div>
                {s.topFatalMonster && (
                  <div className="progression-metrics-row" style={{ marginTop: '6px', color: '#f87171' }}>
                    <span>致命怪:</span>
                    <strong style={{ color: '#fca5a5' }}>{s.topFatalMonster.name}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Persona Breakdown for Current Slice */}
        {currentSlice?.personas && (
          <div className="persona-cards-grid">
            {Object.values(currentSlice.personas).map((p) => {
              const pClass =
                p.persona === 'balanced'
                  ? 'balanced'
                  : p.persona === 'cautious'
                  ? 'cautious'
                  : p.persona === 'greedy'
                  ? 'greedy'
                  : 'random';
              const pLabel =
                p.persona === 'balanced'
                  ? '常態平衡型 (Balanced)'
                  : p.persona === 'cautious'
                  ? '生存謹慎型 (Cautious)'
                  : p.persona === 'greedy'
                  ? '貪婪構築型 (Greedy)'
                  : '純隨機探索型 (Random)';
              const pRole =
                p.persona === 'balanced'
                  ? '理性兼顧生存與卡牌品質'
                  : p.persona === 'cautious'
                  ? '高警戒必回血、避開精英'
                  : p.persona === 'greedy'
                  ? '極致除役廢牌、搶購遺物'
                  : '等機率盲選衡量邊界下限';

              return (
                <div key={p.persona} className={`persona-card ${pClass}`}>
                  <div className="persona-card-header">
                    <span className="persona-card-title">{pLabel}</span>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>25% 人口</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{pRole}</div>
                  <div className="persona-metric-row">
                    <span>切片存活率:</span>
                    <strong style={{ color: p.survivalRate >= 0.5 ? '#4ade80' : '#f87171' }}>
                      {(p.survivalRate * 100).toFixed(1)}%
                    </strong>
                  </div>
                  <div className="persona-metric-row">
                    <span>單場均損血:</span>
                    <strong>{p.meanCombatHpLoss.toFixed(1)} 生命值</strong>
                  </div>
                  <div className="persona-metric-row">
                    <span>切片淨損血:</span>
                    <strong>{p.meanNetHpLoss.toFixed(1)} 生命值</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Slice Navigation Tabs */}
      <div className="slice-selector-tabs">
        <button
          type="button"
          className={`slice-tab-btn overview-tab ${selectedSliceId === 0 ? 'active' : ''}`}
          onClick={() => handleSliceClick(0)}
        >
          <Globe size={15} />
          🌐 全程 7 切片宏觀總覽
        </button>
        {SLICE_DEFINITIONS.map((s) => {
          const isActive = s.id === selectedSliceId;
          return (
            <button
              key={s.id}
              type="button"
              className={`slice-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSliceClick(s.id)}
            >
              Slice {s.id}: D{s.depth} {s.bossName ? `(${s.bossName})` : s.role}
            </button>
          );
        })}
      </div>

      {selectedSliceId === 0 ? (
        <div className="journey-global-overview">
          {/* 1. 7 切片橫向進程矩陣表 */}
          <div className="overview-block">
            <h3 className="overview-block-title">
              <Compass size={18} />
              7 切片全旅程進程走勢矩陣 (Cross-Progression Matrix)
            </h3>
            <div className="journey-table-container">
              <table className="journey-data-table">
                <thead>
                  <tr>
                    <th>切片編號與名稱</th>
                    <th>深度階段</th>
                    <th>進入樣本 N</th>
                    <th>通關樣本 N</th>
                    <th>切片存活率</th>
                    <th>全程累積存活率</th>
                    <th>單場均損血</th>
                    <th>累計淨損血</th>
                    <th>末均生命值</th>
                    <th>末均牌庫</th>
                    <th>頭號致命威脅</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.progression?.map((s) => (
                    <tr key={s.sliceId}>
                      <td style={{ fontWeight: 600, color: '#38bdf8' }}>{s.sliceDef.name}</td>
                      <td>Depth {s.sliceDef.depth}</td>
                      <td>{s.rolloutsEntered.toLocaleString()}</td>
                      <td>{s.rolloutsCompleted.toLocaleString()}</td>
                      <td className={s.sliceSurvivalRate >= 0.3 ? 'highlight-green' : s.sliceSurvivalRate < 0.1 ? 'highlight-red' : ''}>
                        {(s.sliceSurvivalRate * 100).toFixed(1)}%
                      </td>
                      <td className={s.cumulativeSurvivalRate >= 0.1 ? 'highlight-green' : 'highlight-red'}>
                        {(s.cumulativeSurvivalRate * 100).toFixed(2)}%
                      </td>
                      <td>{s.meanCombatHpLoss.toFixed(1)} 生命值</td>
                      <td>{s.meanNetHpLoss.toFixed(1)} 生命值</td>
                      <td>{s.meanFinalHp.toFixed(1)} 生命值</td>
                      <td>{s.meanFinalDeckSize.toFixed(1)} 張</td>
                      <td style={{ color: '#fca5a5' }}>
                        {s.topFatalMonster ? `${s.topFatalMonster.name} (${s.topFatalMonster.percentage.toFixed(1)}%)` : '無'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="sub-tab-btn"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', border: '1px solid rgba(56, 189, 248, 0.3)' }}
                          onClick={() => handleSliceClick(s.sliceId)}
                        >
                          深入檢視 ➔
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. 四大流派跨切片存活矩陣 */}
          <div className="overview-block">
            <h3 className="overview-block-title">
              <Users size={18} />
              四大代理人策略流派跨切片存活率矩陣 (4-Persona Cross-Slice Matrix)
            </h3>
            <div className="journey-table-container">
              <table className="journey-data-table">
                <thead>
                  <tr>
                    <th>代理人流派</th>
                    <th>人口權重</th>
                    <th>Slice 1</th>
                    <th>Slice 2</th>
                    <th>Slice 3</th>
                    <th>Slice 4 (瓶頸)</th>
                    <th>Slice 5</th>
                    <th>Slice 6</th>
                    <th>Slice 7 (終局)</th>
                  </tr>
                </thead>
                <tbody>
                  {personaProgressionMatrix.map((p) => (
                    <tr key={p.key}>
                      <td style={{ fontWeight: 700, color: '#f1f5f9' }}>{p.label}</td>
                      <td>25.0%</td>
                      {p.sliceRates.map((sr, idx) => (
                        <td key={idx} className={sr && sr.survivalRate >= 0.3 ? 'highlight-green' : sr && sr.survivalRate < 0.05 ? 'highlight-red' : ''}>
                          {sr ? `${(sr.survivalRate * 100).toFixed(1)}%` : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. 全旅程敵怪致死威脅總榜 */}
          <div className="overview-block">
            <h3 className="overview-block-title">
              <Skull size={18} />
              全域 26 隻敵怪綜合致死威脅天梯榜 (All-Monsters Global Threat Ranking)
            </h3>
            <div className="journey-table-container">
              <table className="journey-data-table">
                <thead>
                  <tr>
                    <th>排名</th>
                    <th>敵怪名稱</th>
                    <th>所屬深度</th>
                    <th>類型</th>
                    <th>總遭遇人次</th>
                    <th>總斬殺人數</th>
                    <th>平均損血</th>
                    <th>綜合戰鬥致死率</th>
                  </tr>
                </thead>
                <tbody>
                  {globalMonstersLeaderboard.map((m, idx) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700, color: idx < 3 ? '#ffd700' : '#94a3b8' }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>Depth {m.depth}</td>
                      <td>
                        <span style={{ color: m.role === 'boss' ? '#f87171' : m.role === 'elite' ? '#fbbf24' : '#94a3b8' }}>
                          {m.role === 'boss' ? '首領' : m.role === 'elite' ? '精英' : '常規'}
                        </span>
                      </td>
                      <td>{m.encounters.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: m.kills > 1000 ? '#fca5a5' : '#f1f5f9' }}>{m.kills.toLocaleString()}</td>
                      <td>{m.meanHpLoss.toFixed(1)} 生命值</td>
                      <td className={m.lethality >= 0.2 ? 'highlight-red' : ''}>{(m.lethality * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 4. Sub-Tabs Bar */}
          <div className="sub-tabs-bar">
        <button
          type="button"
          className={`sub-tab-btn ${activeSubTab === 'monsters' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('monsters')}
        >
          <Skull size={15} />
          敵怪損耗與致死統計 ({filteredMonsters.length})
        </button>
        <button
          type="button"
          className={`sub-tab-btn ${activeSubTab === 'deck' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('deck')}
        >
          <Layers size={15} />
          精確牌庫 (8~25+)
        </button>
        <button
          type="button"
          className={`sub-tab-btn ${activeSubTab === 'cards' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('cards')}
        >
          <Activity size={15} />
          全卡牌效益矩陣 ({filteredCards.length})
        </button>
        <button
          type="button"
          className={`sub-tab-btn ${activeSubTab === 'paths' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('paths')}
        >
          <GitFork size={15} />
          路徑與抉擇
        </button>
        <button
          type="button"
          className={`sub-tab-btn ${activeSubTab === 'groups' ? 'active' : ''}`}
          onClick={() => handleSubTabClick('groups')}
        >
          <Users size={15} />
          存活對比分析
        </button>
      </div>

      {/* 5. Sub-Tab Content Views */}

      {/* 5-1. Monsters View */}
      {activeSubTab === 'monsters' && (
        <div>
          <div className="journey-filter-toolbar">
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              顯示切片 Depth {currentSlice.sliceDef.depth} 怪物。點選右方切換全量 26 隻敵怪。
            </span>
            <button
              type="button"
              className={`sub-tab-btn ${showAllMonsters ? 'active' : ''}`}
              style={{ border: '1px solid rgba(148, 163, 184, 0.2)' }}
              onClick={() => {
                soundEngine.playClick();
                setShowAllMonsters(!showAllMonsters);
              }}
            >
              {showAllMonsters ? '切換僅看當前深度' : '查看全量 26 隻敵怪'}
            </button>
          </div>

          <div className="journey-table-container">
            <table className="journey-data-table">
              <thead>
                <tr>
                  <th>怪物名稱</th>
                  <th>深度</th>
                  <th>類型</th>
                  <th>基礎生命值/護甲</th>
                  <th>遭遇次數 N</th>
                  <th>遭遇率</th>
                  <th>均值損血</th>
                  <th>中位損血</th>
                  <th>損血極值</th>
                  <th>戰鬥回合</th>
                  <th>擊殺次數</th>
                  <th>戰鬥致死率</th>
                  <th>調查員勝率</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonsters.map((m) => {
                  const lethalityPct = (m.lethality * 100).toFixed(1);
                  const isHighRisk = m.lethality >= 0.2;
                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td>Depth {m.depth}</td>
                      <td>
                        <span
                          style={{
                            color:
                              m.role === 'boss'
                                ? '#f87171'
                                : m.role === 'elite'
                                ? '#fbbf24'
                                : '#94a3b8',
                          }}
                        >
                          {m.role === 'boss' ? '首領' : m.role === 'elite' ? '精英' : '常規'}
                        </span>
                      </td>
                      <td>{m.health} / 護甲 {m.armor}</td>
                      <td>{m.encounters.toLocaleString()}</td>
                      <td>{(m.encounterRate * 100).toFixed(1)}%</td>
                      <td>{m.meanHpLoss.toFixed(1)} 生命值</td>
                      <td>{m.medianHpLoss.toFixed(1)} 生命值</td>
                      <td>{m.minHpLoss} ~ {m.maxHpLoss} 生命值</td>
                      <td>{m.avgTurns.toFixed(1)} 輪</td>
                      <td>{m.kills.toLocaleString()}</td>
                      <td className={isHighRisk ? 'highlight-red' : ''}>{lethalityPct}%</td>
                      <td className={m.winRate >= 0.8 ? 'highlight-green' : ''}>
                        {(m.winRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5-2. Deck Sizes View */}
      {activeSubTab === 'deck' && (
        <div className="journey-table-container">
          <table className="journey-data-table">
            <thead>
              <tr>
                <th>理智牌庫張數</th>
                <th>樣本數 N</th>
                <th>路徑佔比</th>
                <th>單場平均損血</th>
                <th>單場中位損血</th>
                <th>切片累計淨損血</th>
                <th>切片死亡率</th>
                <th>瘋狂狀態觸發率</th>
                <th>平均戰鬥回合</th>
              </tr>
            </thead>
            <tbody>
              {currentSlice.deckSizes?.map((ds) => {
                const isSweetSpot = ds.deckSize >= 12 && ds.deckSize <= 16;
                return (
                  <tr
                    key={ds.deckSize}
                    style={
                      isSweetSpot
                        ? { background: 'rgba(34, 197, 94, 0.08)' }
                        : undefined
                    }
                  >
                    <td style={{ fontWeight: 600 }}>
                      {ds.deckSize} 張牌
                      {isSweetSpot && (
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '0.7rem',
                            color: '#4ade80',
                            border: '1px solid #4ade80',
                            borderRadius: '4px',
                            padding: '1px 5px',
                          }}
                        >
                          黃金厚度
                        </span>
                      )}
                    </td>
                    <td>{ds.sampleN.toLocaleString()}</td>
                    <td>{(ds.pathShare * 100).toFixed(1)}%</td>
                    <td>{ds.meanHpLoss.toFixed(1)} 生命值</td>
                    <td>{ds.medianHpLoss.toFixed(1)} 生命值</td>
                    <td>{ds.netHpLoss.toFixed(1)} 生命值</td>
                    <td
                      style={{
                        color: ds.mortality >= 0.5 ? '#f87171' : ds.mortality <= 0.25 ? '#4ade80' : '#cbd5e1',
                      }}
                    >
                      {(ds.mortality * 100).toFixed(1)}%
                    </td>
                    <td>{(ds.madnessRate * 100).toFixed(1)}%</td>
                    <td>{ds.avgTurns.toFixed(1)} 輪</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5-3. Cards Breakdown View */}
      {activeSubTab === 'cards' && (
        <div>
          <div className="journey-filter-toolbar">
            <div className="journey-search-box">
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="搜尋卡牌名稱或 ID..."
                value={cardSearch}
                onChange={(e) => setCardSearch(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'combat', 'skill', 'magic', 'truth', 'madness'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`sub-tab-btn ${cardCategoryFilter === cat ? 'active' : ''}`}
                  onClick={() => {
                    soundEngine.playClick();
                    setCardCategoryFilter(cat);
                  }}
                >
                  {cat === 'all'
                    ? '全部'
                    : cat === 'combat'
                    ? '戰鬥'
                    : cat === 'skill'
                    ? '技能'
                    : cat === 'magic'
                    ? '魔法'
                    : cat === 'truth'
                    ? '真相'
                    : '瘋狂'}
                </button>
              ))}
            </div>
          </div>

          <div className="journey-table-container">
            <table className="journey-data-table">
              <thead>
                <tr>
                  <th>卡牌名稱</th>
                  <th>類別</th>
                  <th>階級</th>
                  <th>出現次數</th>
                  <th>出現率</th>
                  <th>選入次數</th>
                  <th>選入率</th>
                  <th>損血差 Δ生命值</th>
                  <th>持有死亡率</th>
                  <th>死亡差值 ΔMort</th>
                  <th>存活組持有率</th>
                  <th>陣亡組持有率</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.category}</td>
                    <td>Tier {c.tier}</td>
                    <td>{c.offeredN.toLocaleString()}</td>
                    <td>{(c.offeredRate * 100).toFixed(1)}%</td>
                    <td>{c.draftedN.toLocaleString()}</td>
                    <td>{(c.draftedRate * 100).toFixed(1)}%</td>
                    <td style={{ color: c.deltaHp < 0 ? '#4ade80' : c.deltaHp > 0 ? '#f87171' : '#94a3b8' }}>
                      {c.deltaHp >= 0 ? '+' : ''}{c.deltaHp.toFixed(1)} 生命值
                    </td>
                    <td>{(c.mortHeld * 100).toFixed(1)}%</td>
                    <td style={{ color: c.deltaMortality < 0 ? '#4ade80' : c.deltaMortality > 0 ? '#f87171' : '#94a3b8' }}>
                      {c.deltaMortality >= 0 ? '+' : ''}{(c.deltaMortality * 100).toFixed(1)}%
                    </td>
                    <td style={{ color: '#4ade80' }}>{(c.survOwnRate * 100).toFixed(1)}%</td>
                    <td style={{ color: '#f87171' }}>{(c.fallOwnRate * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5-4. Paths & Decisions View */}
      {activeSubTab === 'paths' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div className="progression-section-title">
              地圖拓撲前進路徑分支選擇 (DAG Route Branching Choices)
            </div>
            <div className="journey-table-container">
              <table className="journey-data-table">
                <thead>
                  <tr>
                    <th>路徑分支對決情況</th>
                    <th>選擇 A</th>
                    <th>選擇 B</th>
                    <th>選擇次數 A / B</th>
                    <th>死亡率差值 Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSlice.pathChoices?.map((pc) => (
                    <tr key={pc.pair}>
                      <td style={{ fontWeight: 600 }}>{pc.label}</td>
                      <td>{pc.choiceA} ({(pc.pickRateA * 100).toFixed(1)}%)</td>
                      <td>{pc.choiceB} ({(pc.pickRateB * 100).toFixed(1)}%)</td>
                      <td>{pc.countA} 次 / {pc.countB} 次</td>
                      <td style={{ color: pc.deltaMortality > 0 ? '#f87171' : '#4ade80', fontWeight: 600 }}>
                        {pc.deltaMortality >= 0 ? '+' : ''}{(pc.deltaMortality * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="progression-section-title">
              節點內部抉擇直接結果與後續表現 (Intra-Node Choices)
            </div>
            <div className="journey-table-container">
              <table className="journey-data-table">
                <thead>
                  <tr>
                    <th>節點內部抉擇項目</th>
                    <th>類型</th>
                    <th>選擇次數 N</th>
                    <th>選取率</th>
                    <th>損害影響 (生命值)</th>
                    <th>死亡率差值 Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSlice.intraNodeChoices?.slice(0, 20).map((inc, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{inc.action}</td>
                      <td>{inc.category}</td>
                      <td>{inc.count.toLocaleString()}</td>
                      <td>{(inc.pickRate * 100).toFixed(1)}%</td>
                      <td>{inc.deltaHp >= 0 ? '+' : ''}{inc.deltaHp.toFixed(1)} 生命值</td>
                      <td style={{ color: inc.deltaMortality > 0 ? '#f87171' : '#4ade80' }}>
                        {inc.deltaMortality >= 0 ? '+' : ''}{(inc.deltaMortality * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5-5. Groups Comparison View */}
      {activeSubTab === 'groups' && (
        <div>
          <div className="progression-section-title">
            雙群組對比統計分析 (Surviving vs. Fallen Group Comparison)
          </div>
          <div className="journey-table-container">
            <table className="journey-data-table">
              <thead>
                <tr>
                  <th>統計分析維度項目</th>
                  <th>存活組表現</th>
                  <th>陣亡組表現</th>
                  <th>差異數值 Δ</th>
                  <th>客觀數值傾向說明</th>
                </tr>
              </thead>
              <tbody>
                {currentSlice.groupComparison?.map((gc, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{gc.dimension}</td>
                    <td style={{ color: '#4ade80', fontWeight: 600 }}>{gc.survivingValue}</td>
                    <td style={{ color: '#f87171' }}>{gc.fallenValue}</td>
                    <td style={{ fontWeight: 600 }}>{gc.delta}</td>
                    <td>{gc.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}
        </>
      )}
    </div>
  );
};

