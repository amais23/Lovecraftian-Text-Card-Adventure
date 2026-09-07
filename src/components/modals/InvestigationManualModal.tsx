import React, { useState } from 'react';
import { BookOpen, X, Brain, Shield, Flame, Map, ArrowRight, Layers, Award } from 'lucide-react';
import { soundEngine } from '../../engine/audioManager';
import { useModalDismiss } from '../../hooks/useModalDismiss';

interface InvestigationManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ManualSectionKey = 'sanity' | 'cards' | 'resources' | 'retention' | 'madness' | 'map';

interface ManualSection {
  key: ManualSectionKey;
  title: string;
  icon: React.ReactNode;
  subtitle: string;
}

const MANUAL_SECTIONS: ManualSection[] = [
  {
    key: 'sanity',
    title: '理智即牌庫',
    icon: <Brain size={20} color="#ab47bc" />,
    subtitle: '心智與抽牌庫的絕對等同',
  },
  {
    key: 'cards',
    title: '五色卡牌體系',
    icon: <Layers size={20} color="#ffd700" />,
    subtitle: '策略對弈五元架構',
  },
  {
    key: 'resources',
    title: '精力、護甲與遺物',
    icon: <Shield size={20} color="#68b2e3" />,
    subtitle: '行動資源、防線與被動珍寶',
  },
  {
    key: 'retention',
    title: '手牌保留與超額棄牌',
    icon: <Award size={20} color="#cfa866" />,
    subtitle: '抽2留2與自主超額棄牌',
  },
  {
    key: 'madness',
    title: '瘋狂極限狀態',
    icon: <Flame size={20} color="#a1a1aa" />,
    subtitle: '理智歸零時的背水一戰',
  },
  {
    key: 'map',
    title: '調查地圖與探索',
    icon: <Map size={20} color="#2a9d8f" />,
    subtitle: '多分支節點與深淵封印',
  },
];

export const InvestigationManualModal: React.FC<InvestigationManualModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeKey, setActiveKey] = useState<ManualSectionKey>('sanity');
  const { handleBackdropClick, dismiss } = useModalDismiss({ isOpen, onClose });

  if (!isOpen) return null;

  const handleTabClick = (key: ManualSectionKey) => {
    soundEngine.playClick();
    setActiveKey(key);
  };

  return (
    <div
      className="eldritch-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-modal-title"
    >
      <div className="eldritch-modal-container manual-modal-container">
        {/* Modal Header */}
        <div className="eldritch-modal-header">
          <div className="modal-header-icon-badge">
            <BookOpen size={24} color="#cfa866" />
          </div>
          <div>
            <h2 id="manual-modal-title" className="eldritch-modal-title">
              調查紀錄手冊
            </h2>
            <p className="eldritch-modal-subtitle">
              阿卡姆秘聞手記 · 調查指引備忘錄
            </p>
          </div>
          <button
            className="eldritch-modal-close-btn"
            onClick={dismiss}
            aria-label="關閉手冊"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Sidebar Nav + Content Area */}
        <div className="manual-modal-layout">
          {/* Navigation Sidebar */}
          <nav className="manual-sidebar" aria-label="手冊章節導覽">
            {MANUAL_SECTIONS.map((sec) => {
              const isActive = activeKey === sec.key;
              return (
                <button
                  key={sec.key}
                  className={`manual-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabClick(sec.key)}
                >
                  <span className="manual-nav-icon">{sec.icon}</span>
                  <div className="manual-nav-labels">
                    <span className="manual-nav-title">{sec.title}</span>
                    <span className="manual-nav-subtitle">{sec.subtitle}</span>
                  </div>
                  {isActive && <ArrowRight size={14} className="manual-nav-arrow" />}
                </button>
              );
            })}
          </nav>

          {/* Section Content Display */}
          <div className="manual-content-panel">
            {activeKey === 'sanity' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag sanity">心智存量核心</span>
                  <h3 className="article-title">理智即牌庫</h3>
                  <p className="article-meta">剩餘卡牌數量等同於當前理智值</p>
                </header>
                <div className="article-body">
                  <p>
                    在克蘇魯的世界裡，調查員的心智是極其脆弱的容器。你的<strong>抽牌庫</strong>不僅僅是戰術資源，它直接具象化為你的<strong>當前理智值</strong>（開局基準為 10~12 點）。
                  </p>
                  <ul className="article-bullet-list">
                    <li>
                      <strong>理智消耗與侵蝕</strong>：每抽取一張卡牌，或是打出紫色魔法卡、遭受敵人的精神恐懼與侵蝕攻擊時，都會自牌庫頂棄置卡牌，使理智存量直接降低。
                    </li>
                    <li>
                      <strong>不自動洗牌機制</strong>：抽牌庫抽空時<strong>不會自動洗牌</strong>。若任由思維被抽乾，心智將瞬間滑入瘋狂極限狀態。
                    </li>
                    <li>
                      <strong>心智重整洗牌</strong>：調查員可主動打出具備鎮定效果的黃色技能卡（如「深呼吸」或「醫療鎮定劑」），將棄牌堆中的卡牌洗回牌庫以回補理智存量。
                    </li>
                    <li>
                      <strong>戰後理智歸位</strong>：每場戰鬥勝利後，所有一般卡完整洗回理智牌庫，理智自動重置回牌組全額狀態。
                    </li>
                  </ul>
                </div>
              </article>
            )}

            {activeKey === 'cards' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag cards">五元對弈</span>
                  <h3 className="article-title">五色卡牌體系</h3>
                  <p className="article-meta">紅、黃、紫、白、黑五大卡牌職責</p>
                </header>
                <div className="article-body">
                  <div className="category-explainer-grid">
                    <div className="cat-box combat">
                      <div className="cat-box-header">
                        <span className="cat-color-dot combat" />
                        <h4>紅色戰鬥卡</h4>
                      </div>
                      <p>
                        造成物理傷害的武器打擊與近身肉搏手段（如左輪射擊、軍刀突刺、雙管獵槍）。消耗精力點數，直接瓦解敵人的物理防禦與生命值。
                      </p>
                    </div>

                    <div className="cat-box skill">
                      <div className="cat-box-header">
                        <span className="cat-color-dot skill" />
                        <h4>黃色技能卡</h4>
                      </div>
                      <p>
                        消耗精力點數施展的戰術行動。主要提供跨回合持續累積的防禦護甲、調查抽牌輔助，或將棄牌洗回理智牌庫的心智鎮定手段。
                      </p>
                    </div>

                    <div className="cat-box magic">
                      <div className="cat-box-header">
                        <span className="cat-color-dot magic" />
                        <h4>紫色魔法卡</h4>
                      </div>
                      <p>
                        直接自理智牌庫頂端棄牌（消耗理智）施展的強大舊日秘術與超自然咒語。威力駭人且不消耗精力，但頻繁施展將使心智迅速逼近瘋狂邊緣。
                      </p>
                    </div>

                    <div className="cat-box truth">
                      <div className="cat-box-header">
                        <span className="cat-color-dot truth" />
                        <h4>白色真相卡</h4>
                      </div>
                      <p>
                        主動打出可向理智牌庫注入新卡牌（回補理智存量）的奇蹟手段。大多伴隨肉體認知負擔或代價，但能在狂亂邊緣將調查員拉回現實。
                      </p>
                    </div>

                    <div className="cat-box madness">
                      <div className="cat-box-header">
                        <span className="cat-color-dot madness" />
                        <h4>黑色瘋狂卡</h4>
                      </div>
                      <p>
                        不設階級之分的深淵卡牌。平時作為心智受創的負面減益牌；在理智歸零（瘋狂極限狀態）時，所有抽取卡牌皆化身為毀滅性威力但伴隨肉體反噬傷害的臨時黑色瘋狂卡。
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {activeKey === 'resources' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag resources">防守、節奏與珍寶</span>
                  <h3 className="article-title">精力、護甲與舊日遺物</h3>
                  <p className="article-meta">凡人行動節奏、防禦防線與冒險珍寶</p>
                </header>
                <div className="article-body">
                  <ul className="article-bullet-list">
                    <li>
                      <strong>精力點數</strong>：每回合開始時刷新至基準值（預設 3 點）。打出紅色戰鬥卡與黃色技能卡均需消耗精力。合理分配精力是每回合攻防佈局的核心。
                    </li>
                    <li>
                      <strong>護甲值</strong>：由黃色技能卡或特定手段提供的物理防禦防線。護甲跨回合持續累積，不會在回合結束時自動衰退歸零。
                    </li>
                    <li>
                      <strong>傷害抵扣優先級</strong>：當遭受敵人的物理打擊時，護甲值優先替肉體生命值承受傷害，直至護甲耗盡才扣除生命。
                    </li>
                    <li>
                      <strong>古金幣</strong>：在冒險、事件抉擇與戰鬥獲勝時獲得的神祕貨幣，可用於在黑市購買稀有卡牌與急救用品。
                    </li>
                    <li>
                      <strong>舊日遺物</strong>：於黑市採購、擊敗精英、探索密閣或奇遇獲取的神秘寶物。放置於行囊中跨戰鬥永久生效，提供屬性修正或特殊被動機制。
                    </li>
                  </ul>
                </div>
              </article>
            )}

            {activeKey === 'retention' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag retention">戰術掌控</span>
                  <h3 className="article-title">手牌保留與超額棄牌</h3>
                  <p className="article-meta">開局抽2留2與回合結束自主棄牌</p>
                </header>
                <div className="article-body">
                  <p>
                    傳統卡牌遊戲常在回合結束時強制清空所有手牌，而在《克蘇魯文字卡牌冒險》中：
                  </p>
                  <ul className="article-bullet-list">
                    <li>
                      <strong>起始抽牌與保留基準</strong>：開局抽牌數與手牌保留數基準皆為 <strong>2 張</strong>（非固定抽至手牌上限）。此數值可因特殊節點或舊日遺物增減。
                    </li>
                    <li>
                      <strong>回合固定補牌</strong>：新回合開始時，系統固定從理智牌庫抽取等同於當前抽牌數的卡牌（預設 2 張），未打出的手牌在保留數額度內予以留存。
                    </li>
                    <li>
                      <strong>超額手牌棄牌階段</strong>：回合結束時，若手中剩餘手牌數量超過當前手牌保留數，將強制觸發<strong>「棄牌階段」</strong>，由調查員自主抉擇棄置多餘卡牌，直至手牌數量符合保留上限。
                    </li>
                    <li>
                      <strong>蓄牌與戰術抉擇</strong>：這允許調查員提前囤積關鍵戰術牌或救命鎮定劑，但也考驗每回合的打牌節奏，避免被迫在回合末割捨強力資源。
                    </li>
                  </ul>
                </div>
              </article>
            )}

            {activeKey === 'madness' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag madness">極限逆轉</span>
                  <h3 className="article-title">瘋狂極限狀態</h3>
                  <p className="article-meta">當理智牌庫歸零時觸發的背水一戰</p>
                </header>
                <div className="article-body">
                  <p>
                    當調查員的理智牌庫被抽空至 0 張時，你並不會立即死亡，而是觸發<strong>「瘋狂極限狀態」</strong>！
                  </p>
                  <ul className="article-bullet-list">
                    <li>
                      <strong>狂暴黑卡生成</strong>：處於瘋狂狀態時，每次抽牌都會動態生成具有毀滅性殺傷力的臨時黑色瘋狂卡（如盲目爪擊、深淵狂嘯、狂亂血刃）。
                    </li>
                    <li>
                      <strong>肉體致命反噬</strong>：黑色瘋狂卡不消耗精力或理智，但每次打出都會直接扣除調查員寶貴的肉體生命值。
                    </li>
                    <li>
                      <strong>解除狂亂</strong>：打出白色真相卡（向牌庫注入新卡牌），使理智牌庫數量重新大於 0 時，瘋狂狀態立即解除。
                    </li>
                    <li>
                      <strong>狂戰到底</strong>：若無法回補牌庫，調查員可持續保持狂暴對攻，直至徹底撕碎眼前的怪物或肉體生命歸零。
                    </li>
                  </ul>
                </div>
              </article>
            )}

            {activeKey === 'map' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag map">長途涉險</span>
                  <h3 className="article-title">調查地圖與深淵探索</h3>
                  <p className="article-meta">多分支探索節點、首領復甦與第四深度</p>
                </header>
                <div className="article-body">
                  <ul className="article-bullet-list">
                    <li>
                      <strong>凡人肉魄與首領決戰復甦</strong>：調查員初始具備 25 點生命值。常態戰鬥勝利後<strong>肉體傷勢不會自動復原</strong>，生命值跨節點累積傳遞；但當你歷經死鬥<strong>成功擊敗當前深度的守關舊日首領後，身體生命值將全額回滿</strong>，以備迎接下一深度的恐怖。
                    </li>
                    <li>
                      <strong>豐富多樣的調查節點</strong>：
                        <ul className="article-sub-bullet-list" style={{ marginTop: '6px', paddingLeft: '18px', lineHeight: '1.7' }}>
                          <li><strong>常規遭遇與舊日精英</strong>：直面阿卡姆異教徒與深淵怪物，獲取古金幣、戰利品與卡牌獎勵。</li>
                          <li><strong>安全避難所</strong>：可進行肉體治療（恢復生命值）或心智冥想（鎮定心智）。</li>
                          <li><strong>黑市商人</strong>：消耗古金幣購買高階卡牌、強大遺物或醫療用品。</li>
                          <li><strong>遺物秘閣</strong>：深入密室探尋三選一的珍稀舊日遺物。</li>
                          <li><strong>血之祭壇</strong>：藉由古老血契儀式，永久燒毀牌組中的 2 張卡牌以精簡牌庫。</li>
                          <li><strong>禁忌祭壇</strong>：承受肉體或心智代價，換取最大生命值、抽牌手牌數提升等特殊恩賜。</li>
                          <li><strong>屍骨遺骸</strong>：在前次冒險身亡殉職處悼念前人，繼承前世的卡牌或古金幣。</li>
                          <li><strong>秘識奇遇</strong>：以文字描述展開的超自然遭遇，依照理智與抉擇獲取線索或承受代價。</li>
                        </ul>
                    </li>
                    <li>
                      <strong>深淵封印與第四深度真結局</strong>：在首領戰利品中捨棄常規獎勵以蒐集三枚「深淵封印殘片」，將在第三深度首領戰後共鳴融合為「完整的深淵古印」，開啟通往「第四深度 · 拉萊耶核心」的隱藏通道，迎向弒神的真結局！
                    </li>
                  </ul>
                </div>
              </article>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
