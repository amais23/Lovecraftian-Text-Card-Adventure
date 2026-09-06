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
    subtitle: 'Sanity Deck · 心智與抽牌庫的絕對等同',
  },
  {
    key: 'cards',
    title: '五色卡牌體系',
    icon: <Layers size={20} color="#ffd700" />,
    subtitle: 'Five Color Categories · 策略對弈五元架構',
  },
  {
    key: 'resources',
    title: '精力與護甲',
    icon: <Shield size={20} color="#68b2e3" />,
    subtitle: 'Stamina & Armor · 行動資源與累積防線',
  },
  {
    key: 'retention',
    title: '手牌保留機制',
    icon: <Award size={20} color="#cfa866" />,
    subtitle: 'Hand Retention · 戰術手牌不強制棄置',
  },
  {
    key: 'madness',
    title: '瘋狂極限狀態',
    icon: <Flame size={20} color="#ef4444" />,
    subtitle: 'Madness State · 理智歸零時的背水一戰',
  },
  {
    key: 'map',
    title: '調查地圖與探索',
    icon: <Map size={20} color="#2a9d8f" />,
    subtitle: 'Investigation Map · 節點分支與凡人肉魄',
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
              INVESTIGATION FIELD MANUAL · 阿卡姆秘聞備忘錄
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
                  <h3 className="article-title">理智即牌庫 (Sanity Deck)</h3>
                  <p className="article-meta">剩餘卡牌數量等同於當前理智值 (Sanity)</p>
                </header>
                <div className="article-body">
                  <p>
                    在克蘇魯的世界裡，調查員的心智是極其脆弱的容器。你的<strong>抽牌庫</strong>不僅僅是戰術資源，它直接具象化為你的<strong>當前理智值</strong>（開局基準為 10~12 點）。
                  </p>
                  <ul className="article-bullet-list">
                    <li>
                      <strong>理智消耗與侵蝕</strong>：每抽取一張卡牌，或是打出紫色魔法卡、遭受敵人的精神侵蝕恐懼攻擊時，都會自牌庫頂棄置卡牌，使理智存量直接降低。
                    </li>
                    <li>
                      <strong>不自動洗牌機制</strong>：抽牌庫抽空時<strong>不會自動洗牌</strong>。若任由思維被抽乾，心智將瞬間滑入無底深淵。
                    </li>
                    <li>
                      <strong>心智重整洗牌</strong>：玩家必須主動打出具備鎮定效果的黃色技能卡（如「深呼吸」或「醫療鎮定劑」），將棄牌堆中的卡牌洗回牌庫以回補理智。
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
                  <h3 className="article-title">五色卡牌體系 (Card Categories)</h3>
                  <p className="article-meta">紅、黃、紫、白、黑五大卡牌職責</p>
                </header>
                <div className="article-body">
                  <div className="category-explainer-grid">
                    <div className="cat-box combat">
                      <div className="cat-box-header">
                        <span className="cat-color-dot combat" />
                        <h4>紅色戰鬥卡 (Combat Card)</h4>
                      </div>
                      <p>
                        造成物理傷害的武器打擊與近身肉搏手段（如左輪射擊、軍刀突刺、雙管獵槍）。消耗精力點數，直接瓦解敵人的物理防禦與生命值。
                      </p>
                    </div>

                    <div className="cat-box skill">
                      <div className="cat-box-header">
                        <span className="cat-color-dot skill" />
                        <h4>黃色技能卡 (Skill Card)</h4>
                      </div>
                      <p>
                        消耗精力點數施展的戰術行動。主要提供跨回合持續累積的防禦護甲、調查抽牌輔助，或將棄牌洗回理智牌庫的心智鎮定手段。
                      </p>
                    </div>

                    <div className="cat-box magic">
                      <div className="cat-box-header">
                        <span className="cat-color-dot magic" />
                        <h4>紫色魔法卡 (Magic Card)</h4>
                      </div>
                      <p>
                        直接自理智牌庫頂端棄牌（消耗理智）施展的強大舊日秘術與超自然咒語。威力駭人，但頻繁施展將使心智迅速逼近瘋狂邊緣。
                      </p>
                    </div>

                    <div className="cat-box truth">
                      <div className="cat-box-header">
                        <span className="cat-color-dot truth" />
                        <h4>白色真相卡 (Truth Card)</h4>
                      </div>
                      <p>
                        主動打出可向理智牌庫注入新卡牌（回補理智存量）的奇蹟手段。大多伴隨肉體認知負擔或代價，但能在狂亂邊緣將調查員拉回現實。
                      </p>
                    </div>

                    <div className="cat-box madness">
                      <div className="cat-box-header">
                        <span className="cat-color-dot madness" />
                        <h4>黑色瘋狂卡 (Madness Card)</h4>
                      </div>
                      <p>
                        平時伴隨負面減益；在理智歸零（觸發瘋狂狀態）時，所有抽取卡牌皆化身為毀滅性威力但伴隨肉體反噬傷害的臨時黑色瘋狂卡。
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {activeKey === 'resources' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag resources">防守與節奏</span>
                  <h3 className="article-title">精力點數與護甲值 (Stamina & Armor)</h3>
                  <p className="article-meta">凡人行動節奏與物理生存防禦</p>
                </header>
                <div className="article-body">
                  <ul className="article-bullet-list">
                    <li>
                      <strong>精力點數 (Stamina)</strong>：每回合開始時刷新至基準值（預設 3 點）。打出紅色戰鬥卡與黃色技能卡均需消耗精力。合理分配精力是每回合攻防佈局的核心。
                    </li>
                    <li>
                      <strong>護甲值 (Armor)</strong>：由黃色技能卡或特定手段提供的物理防禦護盾。
                      <span className="highlight-note">【關鍵機制】護甲跨回合持續累積，不會在回合結束時自動衰退歸零！</span>
                    </li>
                    <li>
                      <strong>傷害抵扣優先級</strong>：當遭受敵人的物理打擊時，護甲值優先替肉體生命值承受傷害，直至護甲耗盡才扣除生命。
                    </li>
                    <li>
                      <strong>古金幣 (Ancient Obols)</strong>：在冒險、事件與戰鬥獲勝時獲得的神祕金幣，可用於在黑市購買稀有卡牌與急救用品。
                    </li>
                  </ul>
                </div>
              </article>
            )}

            {activeKey === 'retention' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag retention">戰術掌控</span>
                  <h3 className="article-title">手牌保留機制 (Hand Retention)</h3>
                  <p className="article-meta">未打出的關鍵卡牌完整留存</p>
                </header>
                <div className="article-body">
                  <p>
                    傳統卡牌遊戲常在回合結束時強制清空手牌，而在《克蘇魯文字卡牌冒險》中：
                  </p>
                  <ul className="article-bullet-list">
                    <li>
                      <strong>不強制棄牌</strong>：回合結束時，手中尚未打出的手牌<strong>予以完整保留</strong>在手中。
                    </li>
                    <li>
                      <strong>補抽至基準張數</strong>：新回合開始時，系統僅會從理智牌庫補抽卡牌至手牌基準張數（預設補至 4 張）。
                    </li>
                    <li>
                      <strong>蓄牌與時機</strong>：這允許調查員提前囤積高傷戰術卡或緊急鎮定劑，在敵人預告強力攻勢時打出關鍵連擊。
                    </li>
                  </ul>
                </div>
              </article>
            )}

            {activeKey === 'madness' && (
              <article className="manual-article">
                <header className="article-header">
                  <span className="article-tag madness">極限逆轉</span>
                  <h3 className="article-title">瘋狂極限狀態 (Madness State)</h3>
                  <p className="article-meta">當理智牌庫歸零時觸發的背水一戰</p>
                </header>
                <div className="article-body">
                  <p>
                    當調查員的理智牌庫被抽空至 0 張時，你並不會立即死亡，而是觸發<strong>「瘋狂極限狀態 (Madness State)」</strong>！
                  </p>
                  <ul className="article-bullet-list">
                    <li>
                      <strong>狂暴黑卡生成</strong>：處於瘋狂狀態時，每次抽牌都會動態生成具有毀滅性殺傷力的臨時黑色瘋狂卡（如盲目爪擊、深淵狂嘯、狂亂血刃）。
                    </li>
                    <li>
                      <strong>肉體致命反噬</strong>：打出這些黑色瘋狂卡雖能造成遠超凡人極限的高額傷害，但每次打出都會直接扣除調查員寶貴的肉體生命值。
                    </li>
                    <li>
                      <strong>解除狂亂</strong>：打出白色真相卡（向牌庫注入新卡牌），使理智牌庫數量大於 0 時，瘋狂狀態立即解除。
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
                  <h3 className="article-title">調查地圖與探索 (Investigation Map)</h3>
                  <p className="article-meta">多分支節點與不可逆的凡人傷痕</p>
                </header>
                <div className="article-body">
                  <ul className="article-bullet-list">
                    <li>
                      <strong>肉體傷勢不自動恢復</strong>：調查員初始具備 25 點凡人生命值。戰鬥勝利後<strong>肉體傷勢不會自動復原</strong>，生命值跨節點累積傳遞。
                    </li>
                    <li>
                      <strong>避難所 (Sanctuary)</strong>：地圖上的安全節點，可供調查員暫時喘息，選擇包紮傷口或沉思冥想。
                    </li>
                    <li>
                      <strong>秘識奇遇 (Mythos Event)</strong>：遭遇文字描繪的不可名狀超自然事件，依照理智與抉擇獲取線索或承受代價。
                    </li>
                    <li>
                      <strong>黑市 (Market)</strong>：與暗中商人進行交易，消耗古金幣添購武器、護符或醫療用品。
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
