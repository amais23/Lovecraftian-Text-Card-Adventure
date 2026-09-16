import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ALL_CARD_REVIEW_ITEMS,
  type ReviewDecision,
  type StoredReviewDecision,
  type ReviewTier,
} from '../data/cardReviewData';
import { MONSTERS_BY_DEPTH } from '../data/monsterReviewData';
import { soundEngine } from '../engine/audioManager';
import type { CardCategory, OccupationId } from '../types/game';
import {
  Check,
  X,
  Clock,
  Download,
  Upload,
  Copy,
  Search,
  Shield,
  Swords,
  Sparkles,
  Eye,
  Flame,
  Skull,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  FileCode,
} from 'lucide-react';
import { generateStandaloneReviewHtml } from '../utils/generateStandaloneReviewHtml';
import '../styles/cardReview.css';

const STORAGE_KEY = 'arkham_card_review_decisions';

interface CardReviewLabProps {
  onClose: () => void;
}

export const CardReviewLab: React.FC<CardReviewLabProps> = ({ onClose }) => {
  // Navigation Tabs: 'cards' or 'monsters'
  const [activeTab, setActiveTab] = useState<'cards' | 'monsters'>('cards');

  // Storage state for card decisions: { [cardId]: { decision: 'accepted'|'rejected'|'pending', note: string } }
  const [decisions, setDecisions] = useState<Record<string, StoredReviewDecision>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load card review decisions', e);
    }
    return {};
  });

  // Filters for Cards
  const [categoryFilter, setCategoryFilter] = useState<CardCategory | 'all'>('all');
  const [occupationFilter, setOccupationFilter] = useState<OccupationId | 'all' | 'neutral'>('all');
  const [tierFilter, setTierFilter] = useState<ReviewTier | 'all'>('all');
  const [decisionFilter, setDecisionFilter] = useState<ReviewDecision | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Depth Filter for Monsters
  const [monsterDepth, setMonsterDepth] = useState<1 | 2 | 3 | 4>(1);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Scroll references and controls
  const cardsListRef = useRef<HTMLDivElement>(null);
  const monstersListRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleCardsScroll = () => {
    if (cardsListRef.current) {
      setShowScrollTop(cardsListRef.current.scrollTop > 300);
    }
  };

  const handleMonstersScroll = () => {
    if (monstersListRef.current) {
      setShowScrollTop(monstersListRef.current.scrollTop > 300);
    }
  };

  const scrollToTop = () => {
    soundEngine.playClick();
    if (activeTab === 'cards' && cardsListRef.current) {
      cardsListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeTab === 'monsters' && monstersListRef.current) {
      monstersListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    soundEngine.playClick();
    if (activeTab === 'cards' && cardsListRef.current) {
      cardsListRef.current.scrollTo({ top: cardsListRef.current.scrollHeight, behavior: 'smooth' });
    } else if (activeTab === 'monsters' && monstersListRef.current) {
      monstersListRef.current.scrollTo({ top: monstersListRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  // Delegate mouse wheel from fixed header/filter bars to scrollable list
  const handleHeaderWheel = (e: React.WheelEvent) => {
    if (activeTab === 'cards' && cardsListRef.current) {
      cardsListRef.current.scrollTop += e.deltaY;
    } else if (activeTab === 'monsters' && monstersListRef.current) {
      monstersListRef.current.scrollTop += e.deltaY;
    }
  };

  // Save to localStorage whenever decisions change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
    } catch (e) {
      console.error('Failed to save card review decisions', e);
    }
  }, [decisions]);

  // Decision update handler
  const handleSetDecision = (cardId: string, decision: ReviewDecision) => {
    soundEngine.playClick();
    setDecisions((prev) => ({
      ...prev,
      [cardId]: {
        decision,
        note: prev[cardId]?.note || '',
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  // Note update handler
  const handleSetNote = (cardId: string, note: string) => {
    setDecisions((prev) => ({
      ...prev,
      [cardId]: {
        decision: prev[cardId]?.decision || 'pending',
        note,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  // Bulk actions
  const handleAcceptAll = () => {
    soundEngine.playCardPlay('combat');
    const now = new Date().toISOString();
    const updated: Record<string, StoredReviewDecision> = {};
    for (const card of ALL_CARD_REVIEW_ITEMS) {
      updated[card.id] = {
        decision: 'accepted',
        note: decisions[card.id]?.note || '',
        updatedAt: now,
      };
    }
    setDecisions(updated);
    showToast('已將全體 64 張卡牌設置為【全部接受】！');
  };

  const handleResetAll = () => {
    soundEngine.playClick();
    if (window.confirm('確定要將所有卡牌的審核狀態重置為【待審核】嗎？')) {
      setDecisions({});
      showToast('已重置所有審核狀態為待審核。');
    }
  };

  // Export / Copy
  const handleCopyJson = () => {
    soundEngine.playClick();
    const report = {
      timestamp: new Date().toISOString(),
      proposal: 'Proposal A (Atomic Primitives & Synergies)',
      summary: counts,
      items: ALL_CARD_REVIEW_ITEMS.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        tier: c.tier,
        occupations: c.occupations,
        decision: decisions[c.id]?.decision || 'pending',
        note: decisions[c.id]?.note || '',
        proposedEffect: c.proposed.description,
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    showToast('審核結果 JSON 已成功複製到剪貼簿！');
  };

  const handleDownloadJson = () => {
    soundEngine.playClick();
    const report = {
      timestamp: new Date().toISOString(),
      proposal: 'Proposal A (Atomic Primitives & Synergies)',
      summary: counts,
      items: ALL_CARD_REVIEW_ITEMS.map((c) => ({
        id: c.id,
        name: c.name,
        category: c.category,
        tier: c.tier,
        occupations: c.occupations,
        decision: decisions[c.id]?.decision || 'pending',
        note: decisions[c.id]?.note || '',
        proposedEffect: c.proposed.description,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arkham_card_review_proposal_a_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('審核結果 JSON 檔案下載完成！');
  };

  const handleImportJson = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && Array.isArray(parsed.items)) {
            const importedDecisions: Record<string, StoredReviewDecision> = {};
            for (const item of parsed.items) {
              if (item.id) {
                importedDecisions[item.id] = {
                  decision: item.decision || 'pending',
                  note: item.note || '',
                  updatedAt: new Date().toISOString(),
                };
              }
            }
            setDecisions(importedDecisions);
            showToast(`成功匯入 ${Object.keys(importedDecisions).length} 筆審核紀錄！`);
          } else {
            showToast('JSON 格式無效，未找到 items 陣列。');
          }
        } catch (err) {
          showToast('解析 JSON 檔案失敗！');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDownloadStandaloneHtml = () => {
    soundEngine.playClick();
    const html = generateStandaloneReviewHtml({
      currentDecisions: decisions,
    });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arkham_card_balance_lab_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('已打包下載單一可攜式 HTML 檔案（已內嵌當前記錄）！');
  };

  // Compute decision counts
  const counts = useMemo(() => {
    let accepted = 0;
    let rejected = 0;
    let pending = 0;
    for (const card of ALL_CARD_REVIEW_ITEMS) {
      const d = decisions[card.id]?.decision || 'pending';
      if (d === 'accepted') accepted++;
      else if (d === 'rejected') rejected++;
      else pending++;
    }
    return { accepted, rejected, pending, total: ALL_CARD_REVIEW_ITEMS.length };
  }, [decisions]);

  // Filtered cards
  const filteredCards = useMemo(() => {
    return ALL_CARD_REVIEW_ITEMS.filter((card) => {
      // Category filter
      if (categoryFilter !== 'all' && card.category !== categoryFilter) {
        return false;
      }
      // Occupation filter
      if (occupationFilter !== 'all') {
        if (occupationFilter === 'neutral') {
          if (!card.occupations || card.occupations.length < 2) return false;
        } else {
          if (!card.occupations || !card.occupations.includes(occupationFilter)) return false;
        }
      }
      // Tier filter
      if (tierFilter !== 'all') {
        if (card.tier !== tierFilter) return false;
      }
      // Decision filter
      const d = decisions[card.id]?.decision || 'pending';
      if (decisionFilter !== 'all' && d !== decisionFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = card.name.toLowerCase().includes(query);
        const matchOrig = card.original.description.toLowerCase().includes(query);
        const matchProp = card.proposed.description.toLowerCase().includes(query);
        const matchRationale = card.proposed.designRationale.toLowerCase().includes(query);
        const matchKeywords = card.proposed.keywords?.some((k) => k.toLowerCase().includes(query));
        if (!matchName && !matchOrig && !matchProp && !matchRationale && !matchKeywords) {
          return false;
        }
      }
      return true;
    });
  }, [categoryFilter, occupationFilter, tierFilter, decisionFilter, searchQuery, decisions]);

  return (
    <div className="card-review-lab-overlay">
      {toastMessage && <div className="review-toast-box">{toastMessage}</div>}

      <div className="card-review-lab-window">
        {/* Top Header */}
        <header className="review-lab-header">
          <div className="header-left">
            <button className="review-back-btn" onClick={onClose} title="返回主選單">
              <ArrowLeft size={18} />
              <span>返回</span>
            </button>
            <div className="header-titles">
              <h2>⚖️ 克蘇魯卡牌改動審查與數值實驗室</h2>
              <p>方案 A：可組合原子效應與印記聯動 · 全 64 張卡牌改動審核 & 怪物數值對策圖鑑</p>
            </div>
          </div>

          {/* Navigation Mode Switcher */}
          <div className="header-mode-tabs">
            <button
              className={`mode-tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('cards');
              }}
            >
              <BookOpen size={16} />
              <span>卡牌改動審查 ({ALL_CARD_REVIEW_ITEMS.length}張)</span>
            </button>
            <button
              className={`mode-tab-btn ${activeTab === 'monsters' ? 'active' : ''}`}
              onClick={() => {
                soundEngine.playClick();
                setActiveTab('monsters');
              }}
            >
              <Skull size={16} />
              <span>怪物生態數值表 (分深度 1~4)</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        {activeTab === 'cards' ? (
          <div className="review-cards-layout">
            {/* Status Summary & Quick Actions Bar */}
            <div className="review-stats-bar" onWheel={handleHeaderWheel}>
              <div className="stat-pill total">
                <span>總卡牌</span>
                <strong>{counts.total} 張</strong>
              </div>
              <div className="stat-pill accepted">
                <CheckCircle2 size={16} />
                <span>已接受</span>
                <strong>{counts.accepted}</strong>
              </div>
              <div className="stat-pill rejected">
                <XCircle size={16} />
                <span>已拒絕</span>
                <strong>{counts.rejected}</strong>
              </div>
              <div className="stat-pill pending">
                <HelpCircle size={16} />
                <span>待審核</span>
                <strong>{counts.pending}</strong>
              </div>

              <div className="actions-cluster">
                <button className="action-btn accept-all" onClick={handleAcceptAll} title="全部標記為接受">
                  <Check size={14} />
                  <span>全部接受</span>
                </button>
                <button className="action-btn reset-all" onClick={handleResetAll} title="全部重置為待審核">
                  <RotateCcw size={14} />
                  <span>全部重置</span>
                </button>
                <button className="action-btn copy-json" onClick={handleCopyJson} title="複製審核結果 JSON">
                  <Copy size={14} />
                  <span>複製結果 JSON</span>
                </button>
                <button className="action-btn download-json" onClick={handleDownloadJson} title="下載 JSON 檔案">
                  <Download size={14} />
                  <span>匯出檔案</span>
                </button>
                <button className="action-btn upload-json" onClick={handleImportJson} title="匯入已有的審核 JSON">
                  <Upload size={14} />
                  <span>匯入</span>
                </button>
                <button
                  className="action-btn save-html"
                  onClick={handleDownloadStandaloneHtml}
                  title="打包下載單一可攜式 HTML 檔案（內嵌您當前所有的修改決定與筆記，方便分享與討論）"
                >
                  <FileCode size={14} />
                  <span>打包可攜 HTML</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="review-filter-panel" onWheel={handleHeaderWheel}>
              {/* Category Filter */}
              <div className="filter-group">
                <span className="filter-label">類別:</span>
                <button
                  className={`filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('all')}
                >
                  全部
                </button>
                <button
                  className={`filter-chip combat ${categoryFilter === 'combat' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('combat')}
                >
                  <Swords size={13} /> 戰鬥 (16)
                </button>
                <button
                  className={`filter-chip skill ${categoryFilter === 'skill' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('skill')}
                >
                  <Shield size={13} /> 技能 (17)
                </button>
                <button
                  className={`filter-chip magic ${categoryFilter === 'magic' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('magic')}
                >
                  <Sparkles size={13} /> 魔法 (11)
                </button>
                <button
                  className={`filter-chip truth ${categoryFilter === 'truth' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('truth')}
                >
                  <Eye size={13} /> 真相 (14)
                </button>
                <button
                  className={`filter-chip madness ${categoryFilter === 'madness' ? 'active' : ''}`}
                  onClick={() => setCategoryFilter('madness')}
                >
                  <Flame size={13} /> 瘋狂 (6)
                </button>
              </div>

              {/* Occupation Filter */}
              <div className="filter-group">
                <span className="filter-label">職業:</span>
                <button
                  className={`filter-chip ${occupationFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setOccupationFilter('all')}
                >
                  全部
                </button>
                <button
                  className={`filter-chip ${occupationFilter === 'investigator' ? 'active' : ''}`}
                  onClick={() => setOccupationFilter('investigator')}
                >
                  🕵️ 私家偵探 (40)
                </button>
                <button
                  className={`filter-chip ${occupationFilter === 'occultist' ? 'active' : ''}`}
                  onClick={() => setOccupationFilter('occultist')}
                >
                  🔮 秘術學者 (40)
                </button>
                <button
                  className={`filter-chip ${occupationFilter === 'neutral' ? 'active' : ''}`}
                  onClick={() => setOccupationFilter('neutral')}
                >
                  ⚖️ 中立通用 (19)
                </button>
              </div>

              {/* Tier Filter */}
              <div className="filter-group">
                <span className="filter-label">階級:</span>
                <button
                  className={`filter-chip ${tierFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setTierFilter('all')}
                >
                  全部
                </button>
                <button
                  className={`filter-chip ${tierFilter === 'starter' ? 'active' : ''}`}
                  onClick={() => setTierFilter('starter')}
                >
                  起始 (10)
                </button>
                <button
                  className={`filter-chip ${tierFilter === 1 ? 'active' : ''}`}
                  onClick={() => setTierFilter(1)}
                >
                  Tier 1 (18)
                </button>
                <button
                  className={`filter-chip ${tierFilter === 2 ? 'active' : ''}`}
                  onClick={() => setTierFilter(2)}
                >
                  Tier 2 (14)
                </button>
                <button
                  className={`filter-chip ${tierFilter === 3 ? 'active' : ''}`}
                  onClick={() => setTierFilter(3)}
                >
                  Tier 3 (8)
                </button>
                <button
                  className={`filter-chip ${tierFilter === 4 ? 'active' : ''}`}
                  onClick={() => setTierFilter(4)}
                >
                  Tier 4 (6)
                </button>
                <button
                  className={`filter-chip ${tierFilter === 'special' ? 'active' : ''}`}
                  onClick={() => setTierFilter('special')}
                >
                  特殊/衍生 (8)
                </button>
              </div>

              {/* Decision Filter */}
              <div className="filter-group">
                <span className="filter-label">審查狀態:</span>
                <button
                  className={`filter-chip ${decisionFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDecisionFilter('all')}
                >
                  全部
                </button>
                <button
                  className={`filter-chip state-pending ${decisionFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setDecisionFilter('pending')}
                >
                  🟡 待審核 ({counts.pending})
                </button>
                <button
                  className={`filter-chip state-accepted ${decisionFilter === 'accepted' ? 'active' : ''}`}
                  onClick={() => setDecisionFilter('accepted')}
                >
                  🟢 已接受 ({counts.accepted})
                </button>
                <button
                  className={`filter-chip state-rejected ${decisionFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => setDecisionFilter('rejected')}
                >
                  🔴 已拒絕 ({counts.rejected})
                </button>
              </div>

              {/* Search Box */}
              <div className="search-box-wrapper">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="搜尋卡名、穿刺、流血、易傷、碎盾等關鍵字..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Cards Scrollable List */}
            <div
              ref={cardsListRef}
              onScroll={handleCardsScroll}
              tabIndex={0}
              className="review-cards-list-container"
              aria-label="卡牌改動審查列表"
            >
              {filteredCards.length === 0 ? (
                <div className="no-cards-placeholder">
                  <Info size={32} />
                  <p>沒有符合當前篩選條件的卡牌。</p>
                </div>
              ) : (
                filteredCards.map((card) => {
                  const userState = decisions[card.id] || { decision: 'pending', note: '' };
                  const currentDecision = userState.decision;

                  return (
                    <article
                      key={card.id}
                      className={`card-review-card ${card.category} decision-${currentDecision}`}
                    >
                      {/* Left: Card Visual Profile */}
                      <div className="card-visual-col">
                        <div className="card-art-box">
                          <img src={card.artworkUrl} alt={card.name} />
                          <div className={`category-tag ${card.category}`}>
                            {card.category === 'combat' && '戰鬥'}
                            {card.category === 'skill' && '技能'}
                            {card.category === 'magic' && '魔法'}
                            {card.category === 'truth' && '真相'}
                            {card.category === 'madness' && '瘋狂'}
                          </div>
                        </div>

                        <div className="card-meta-info">
                          <h3 className="card-title-name">{card.name}</h3>
                          <div className="meta-badges-row">
                            <span className="badge tier-badge">
                              {typeof card.tier === 'number'
                                ? `Tier ${card.tier}`
                                : card.tier === 'starter'
                                ? '起始'
                                : '特殊'}
                            </span>
                            {card.occupations ? (
                              <span className="badge occ-badge">
                                {card.occupations.length === 2
                                  ? '通用'
                                  : card.occupations[0] === 'investigator'
                                  ? '偵探'
                                  : '學者'}
                              </span>
                            ) : (
                              <span className="badge occ-badge">通用</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Before vs After Comparison */}
                      <div className="card-comparison-col">
                        <div className="comparison-box before-box">
                          <div className="box-header">
                            <span className="version-label current">【目前原版效果】</span>
                            <span className="cost-tag">
                              {card.original.costType === 'free'
                                ? '0 費'
                                : `${card.original.costValue} ${
                                    card.original.costType === 'stamina' ? '精力' : '理智'
                                  }`}
                            </span>
                          </div>
                          <p className="card-desc-text">{card.original.description}</p>
                          {card.original.flavorText && (
                            <p className="flavor-italic">{card.original.flavorText}</p>
                          )}
                        </div>

                        <div className="comparison-box after-box">
                          <div className="box-header">
                            <span className="version-label proposed">【方案 A 改造後效果】</span>
                            <span className="cost-tag highlight">
                              {card.proposed.costType === 'free'
                                ? '0 費 (免費)'
                                : `${card.proposed.costValue} ${
                                    card.proposed.costType === 'stamina' ? '精力' : '理智'
                                  }`}
                            </span>
                          </div>
                          <div className="keywords-badge-row">
                            {card.proposed.keywords?.map((kw, i) => (
                              <span key={i} className="kw-badge">
                                {kw}
                              </span>
                            ))}
                          </div>
                          <p className="card-desc-text new-desc">{card.proposed.description}</p>

                          <div className="rationale-block">
                            <div className="rationale-item">
                              <strong>🎯 設計意圖：</strong>
                              <span>{card.proposed.designRationale}</span>
                            </div>
                            {card.proposed.counterplay && (
                              <div className="rationale-item counter">
                                <strong>⚔️ 對策克制：</strong>
                                <span>{card.proposed.counterplay}</span>
                              </div>
                            )}
                            <div className="rationale-item synergy">
                              <strong>🔗 推薦連動：</strong>
                              <span className="synergy-tags">
                                {card.proposed.synergies.join(' · ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: User Decision & Feedback Notes */}
                      <div className="card-decision-col">
                        <div className="decision-buttons-group">
                          <button
                            className={`decision-btn accept ${
                              currentDecision === 'accepted' ? 'active' : ''
                            }`}
                            onClick={() => handleSetDecision(card.id, 'accepted')}
                            title="接受方案 A 改動"
                          >
                            <Check size={16} />
                            <span>接受改動</span>
                          </button>
                          <button
                            className={`decision-btn reject ${
                              currentDecision === 'rejected' ? 'active' : ''
                            }`}
                            onClick={() => handleSetDecision(card.id, 'rejected')}
                            title="拒絕，保留原版效果"
                          >
                            <X size={16} />
                            <span>保留原版</span>
                          </button>
                          <button
                            className={`decision-btn pending ${
                              currentDecision === 'pending' ? 'active' : ''
                            }`}
                            onClick={() => handleSetDecision(card.id, 'pending')}
                            title="尚未決定 / 待定"
                          >
                            <Clock size={16} />
                            <span>待定</span>
                          </button>
                        </div>

                        <div className="user-note-box">
                          <label>✏️ 您的個人審核意見 / 微調筆記：</label>
                          <textarea
                            placeholder="例如：傷害建議改為 12、或者抽牌太多...（即時自動保存）"
                            value={userState.note || ''}
                            onChange={(e) => handleSetNote(card.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Monster Bestiary by Depth */
          <div className="review-monsters-wrapper">
            {/* Depth Filter Tabs */}
            <div className="depth-selector-bar" onWheel={handleHeaderWheel}>
              <span className="selector-title">選擇調查深度：</span>
              <button
                className={`depth-tab-btn ${monsterDepth === 1 ? 'active' : ''}`}
                onClick={() => {
                  soundEngine.playClick();
                  setMonsterDepth(1);
                }}
              >
                第一深度 · 阿卡姆封鎖區 (Depth 1)
              </button>
              <button
                className={`depth-tab-btn ${monsterDepth === 2 ? 'active' : ''}`}
                onClick={() => {
                  soundEngine.playClick();
                  setMonsterDepth(2);
                }}
              >
                第二深度 · 深潛者海蝕迷宮 (Depth 2)
              </button>
              <button
                className={`depth-tab-btn ${monsterDepth === 3 ? 'active' : ''}`}
                onClick={() => {
                  soundEngine.playClick();
                  setMonsterDepth(3);
                }}
              >
                第三深度 · 無底深淵祭壇 (Depth 3)
              </button>
              <button
                className={`depth-tab-btn ${monsterDepth === 4 ? 'active' : ''}`}
                onClick={() => {
                  soundEngine.playClick();
                  setMonsterDepth(4);
                }}
              >
                第四深度 · 星辰正位 · 拉萊耶 (Depth 4)
              </button>
            </div>

            {/* Monsters List */}
            <div
              ref={monstersListRef}
              onScroll={handleMonstersScroll}
              tabIndex={0}
              className="review-monsters-layout"
              aria-label="怪物生態數值列表"
            >
              <div className="monsters-cards-grid">
                {MONSTERS_BY_DEPTH[monsterDepth].map((monster) => (
                <div key={monster.id} className={`monster-profile-card role-${monster.role}`}>
                  <div className="monster-header">
                    <div className="monster-avatar-box">
                      {monster.imageUrl ? (
                        <img src={monster.imageUrl} alt={monster.name} />
                      ) : (
                        <Skull size={40} color="#e63946" />
                      )}
                    </div>
                    <div className="monster-title-block">
                      <span className={`role-badge ${monster.role}`}>
                        {monster.role === 'boss'
                          ? '守關首領 BOSS'
                          : monster.role === 'elite'
                          ? '舊日精英 ELITE'
                          : '常規遭遇 NORMAL'}
                      </span>
                      <h3>{monster.name}</h3>
                      <p className="monster-lore-title">{monster.title}</p>
                    </div>

                    <div className="monster-stats-badge">
                      <div className="hp-stat">
                        <span className="label">HP</span>
                        <span className="value">{monster.health}</span>
                      </div>
                      <div className="armor-stat">
                        <span className="label">護甲</span>
                        <span className="value">{monster.armor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Eldritch Trait */}
                  <div className="monster-section trait-box">
                    <h4 className="section-heading">🧬 專屬原著生態特質 (Canonical Trait)</h4>
                    <div className="trait-content">
                      <strong className="trait-name">{monster.trait.name}</strong>
                      <p>{monster.trait.description}</p>
                      <p className="trait-trigger">
                        <em>觸發機制：</em> {monster.trait.trigger}
                      </p>
                    </div>
                  </div>

                  {/* Intent Sequence */}
                  <div className="monster-section intents-box">
                    <h4 className="section-heading">⚔️ 行動意圖循環 (Intent Sequence)</h4>
                    <div className="intents-list">
                      {monster.intents.map((intent, idx) => (
                        <div key={idx} className="intent-row">
                          <span className={`intent-badge ${intent.type}`}>
                            {intent.type === 'attack' && '攻擊'}
                            {intent.type === 'defend' && '護甲'}
                            {intent.type === 'erode' && '心智侵蝕'}
                            {intent.type === 'apply_status' && '施加印記'}
                          </span>
                          <span className="intent-name">{intent.name}</span>
                          <span className="intent-desc">{intent.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tactical Counterplay */}
                  <div className="monster-section counter-box">
                    <h4 className="section-heading">💡 方案 A 破局克制推薦</h4>
                    <p className="threat-summary">
                      <strong>主要威脅：</strong> {monster.tacticalTips.threatSummary}
                    </p>
                    <div className="recommended-cards-row">
                      <strong>推薦克制卡牌：</strong>
                      {monster.tacticalTips.recommendedCards.map((c, i) => (
                        <span key={i} className="counter-card-tag">
                          {c}
                        </span>
                      ))}
                    </div>
                    <p className="tactical-strategy">
                      <strong>實戰策略：</strong> {monster.tacticalTips.strategy}
                    </p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Floating Scroll Controls */}
        <div className="floating-scroll-controls">
          <button
            className={`scroll-jump-btn ${showScrollTop ? 'visible' : ''}`}
            onClick={scrollToTop}
            title="回到頂部 (Scroll to Top)"
          >
            <ChevronUp size={20} />
          </button>
          <button
            className="scroll-jump-btn visible"
            onClick={scrollToBottom}
            title="滾動至底部 (Scroll to Bottom)"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
