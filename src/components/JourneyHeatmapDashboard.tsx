import React, { useState, useMemo } from 'react';
import {
  Map,
  Compass,
  Activity,
  Skull,
  Layers,
  Search,
  RefreshCw,
  GitFork,
  Users,
} from 'lucide-react';
import journeySummaryRaw from '../data/balance/journey_summary.json';
import {
  SLICE_DEFINITIONS,
  type JourneySummaryJson,
  type SliceSimulationSummary,
} from '../engine/simulation/journeyScheduler';
import { soundEngine } from '../engine/audioManager';
import '../styles/journeyHeatmap.css';

const summaryData = journeySummaryRaw as unknown as JourneySummaryJson;

type SubTabKey = 'monsters' | 'deck' | 'cards' | 'paths' | 'groups';

export const JourneyHeatmapDashboard: React.FC = () => {
  const [selectedSliceId, setSelectedSliceId] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>('monsters');
  const [showAllMonsters, setShowAllMonsters] = useState<boolean>(false);
  const [cardSearch, setCardSearch] = useState<string>('');
  const [cardCategoryFilter, setCardCategoryFilter] = useState<string>('all');
  const [dataVersion, setDataVersion] = useState<number>(0);

  const currentSlice: SliceSimulationSummary = useMemo(() => {
    if (dataVersion < 0) return summaryData.slices[1];
    return summaryData.slices[selectedSliceId] ?? summaryData.slices[1];
  }, [selectedSliceId, dataVersion]);

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
    <div className="journey-heatmap-container">
      {/* 1. Header & Meta Banner */}
      <div className="journey-meta-banner">
        <div className="journey-title-group">
          <h2>
            <Map size={22} />
            全地圖七階切片多流派蒙地卡羅平衡模擬熱點地圖
          </h2>
          <p>
            基於 ADR-0042 蒙地卡羅多流派抽樣與全域混合存活池交接之客觀數值矩陣
          </p>
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
            <strong>{(summaryData.totalJourneyNetHpLoss ?? 0).toFixed(1)} HP</strong>
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

      {/* 2. Top Progression Overview (7-Slice Timeline) */}
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
                  <strong>{s.meanCombatHpLoss.toFixed(1)} HP</strong>
                </div>
                <div className="progression-metrics-row">
                  <span>累計損血:</span>
                  <strong>{s.meanNetHpLoss.toFixed(1)} HP</strong>
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
                    <strong>{p.meanCombatHpLoss.toFixed(1)} HP</strong>
                  </div>
                  <div className="persona-metric-row">
                    <span>切片淨損血:</span>
                    <strong>{p.meanNetHpLoss.toFixed(1)} HP</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Slice Navigation Tabs */}
      <div className="slice-selector-tabs">
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
                  <th>基礎 HP/護甲</th>
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
                      <td>{m.meanHpLoss.toFixed(1)} HP</td>
                      <td>{m.medianHpLoss.toFixed(1)} HP</td>
                      <td>{m.minHpLoss} ~ {m.maxHpLoss} HP</td>
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
                    <td>{ds.meanHpLoss.toFixed(1)} HP</td>
                    <td>{ds.medianHpLoss.toFixed(1)} HP</td>
                    <td>{ds.netHpLoss.toFixed(1)} HP</td>
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
                  <th>損血差 ΔHP</th>
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
                      {c.deltaHp >= 0 ? '+' : ''}{c.deltaHp.toFixed(1)} HP
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
                    <th>損害影響 ΔHP</th>
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
                      <td>{inc.deltaHp >= 0 ? '+' : ''}{inc.deltaHp.toFixed(1)} HP</td>
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
    </div>
  );
};
