import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameState, GameAction } from '../types/game';
import { ensureAdventureStats, getPermanentDeckCount } from '../engine/gameReducer';
import { soundEngine } from '../engine/audioManager';
import {
  Skull,
  Award,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Coins,
  Swords,
  MapPin,
  Layers,
  Heart,
  BookOpen,
} from 'lucide-react';

export type GazetteEndingType = 'death' | 'victory' | 'true_ending';

export interface ArkhamGazetteProps {
  endingType: GazetteEndingType;
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  onRetryCombat?: () => void;
}

export const ArkhamGazette: React.FC<ArkhamGazetteProps> = ({
  endingType,
  state,
  dispatch,
  onRetryCombat,
}) => {
  const isDeath = endingType === 'death';
  const isTrueEnding = endingType === 'true_ending';
  const { investigator } = state;
  const stats = ensureAdventureStats(state);
  const deckCapacity = getPermanentDeckCount(state);

  useEffect(() => {
    // Play the authentic desk slam impact and ambient eerie drone
    soundEngine.playNewspaperSlam();
    const timer = setTimeout(() => {
      soundEngine.playEndingEerieTension();
    }, 280);
    return () => clearTimeout(timer);
  }, []);

  const handleReturnToTitle = () => {
    soundEngine.playClick();
    dispatch({ type: 'RETURN_TO_TITLE' });
  };

  const handleRetry = () => {
    soundEngine.playClick();
    if (onRetryCombat) {
      onRetryCombat();
    } else {
      dispatch({ type: 'RESET_COMBAT' });
    }
  };

  return (
    <div className="gazette-overlay" id="arkham-gazette-overlay">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      {/* Fullscreen Abyss Shatter / Crack Effect on Death */}
      {isDeath && (
        <motion.div
          className="abyss-shatter-layer"
          id="abyss-shatter-effect"
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0.85, 0.4, 0] }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          aria-hidden="true"
        >
          <div className="shatter-cracks" />
          <div className="shatter-crimson-flash" />
        </motion.div>
      )}

      <div className="gazette-desk-surface">
        <motion.div
          className={`gazette-paper-sheet ${
            isDeath ? 'death-theme' : isTrueEnding ? 'true-ending-theme' : 'victory-theme'
          }`}
          initial={{ scale: 2.6, rotate: -22, opacity: 0, y: -60 }}
          animate={{ scale: 1, rotate: [0, -1, 0], opacity: 1, y: 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 16,
            mass: 0.8,
          }}
        >
          {/* Blood Splatter Layer for Death Ending */}
          {isDeath && <div className="blood-spatter-layer" />}

          {/* Rubber Stamp Overlay */}
          <div
            className={`gazette-stamp ${
              isDeath ? 'death' : isTrueEnding ? 'true-ending' : 'victory'
            }`}
          >
            {isDeath
              ? 'MISKATONIC CORONER · INQUEST'
              : isTrueEnding
              ? 'COSMIC BANISHMENT · TRUE VICTORY'
              : 'SANCTIONED SEAL · RESOLVED'}
          </div>

          {/* Newspaper Masthead */}
          <header className="gazette-masthead">
            <div className="gazette-tagline">
              THE INDEPENDENT JOURNAL OF ESOTERIC RESEARCH & MASSACHUSETTS DISPATCH
            </div>
            <h1 className="gazette-main-title">THE ARKHAM GAZETTE</h1>
            <div className="gazette-sub-title">
              阿卡姆早報 · 密斯卡托尼克郡最權威真相日報
            </div>

            <div className="gazette-dateline-bar">
              <span>
                {isDeath
                  ? 'VOL. XLVIII · NO. 14,892'
                  : isTrueEnding
                  ? 'VOL. XLVIII · NO. 14,999'
                  : 'VOL. XLVIII · NO. 14,893'}
              </span>
              <span>
                {isTrueEnding
                  ? 'ARKHAM, MASS., SUNDAY, OCTOBER 24, 1926'
                  : 'ARKHAM, MASS., SATURDAY, OCTOBER 23, 1926'}
              </span>
              <span>
                {isDeath
                  ? 'LATE CITY DISPATCH · TWO CENTS'
                  : isTrueEnding
                  ? 'ULTRA SPECIAL OVERSEAS EDITION · FIVE CENTS'
                  : 'EXTRA FINAL EDITION · TWO CENTS'}
              </span>
            </div>
          </header>

          {/* Primary Headline Section */}
          <div
            className={`gazette-headline-section ${
              isDeath ? 'death' : isTrueEnding ? 'true-ending' : 'victory'
            }`}
          >
            <div className="gazette-kicker">
              {isDeath
                ? 'SPECIAL DISPATCH · TRAGIC OCCURRENCE AT THE RIVERBANK'
                : isTrueEnding
                ? 'ASTRONOMICAL ANOMALY · THE STARS ARE NO LONGER RIGHT'
                : 'UNPRECEDENTED OCCURRENCE · STRANGE DISTURBANCE REPORTED'}
            </div>
            <h2 className="gazette-primary-headline" id="gazette-primary-headline">
              {isDeath
                ? '【無名殘軀浮現密斯卡托尼克河畔，警方稱純屬意外】'
                : isTrueEnding
                ? '【星辰歸位終告破滅！拉萊耶萬丈黑淵崩解，密斯卡托尼克天文台證實超維星軌封滅】'
                : '【近郊廢棄修道院神秘異變暫歇，官方堅稱瓦斯洩漏，市民聲稱目睹夜空巨瞳】'}
            </h2>
          </div>

          {/* Two-Column Newspaper Layout */}
          <div className="gazette-columns-layout">
            {/* Left Column: News Report */}
            <article className="gazette-article-column">
              <div className="gazette-illustration-box">
                <img
                  src={
                    isDeath
                      ? '/cards/truth/card_truth_fragment.webp'
                      : isTrueEnding
                      ? '/cards/truth/card_complete_ancient_seal.png'
                      : '/cards/truth/card_astral_insight.png'
                  }
                  alt={
                    isDeath
                      ? '密斯卡托尼克河畔物證'
                      : isTrueEnding
                      ? '深淵崩解與完整古印封滅'
                      : '修道院星穹異變'
                  }
                  className="gazette-illustration-img"
                />
                <div className="gazette-illustration-caption">
                  {isDeath
                    ? '▲ 昨日清晨於密斯卡托尼克河下游碼頭起獲之遺物手札殘片（阿卡姆早報記者 攝）'
                    : isTrueEnding
                    ? '▲ 密斯卡托尼克天文台望遠鏡觀測到的超維黑淵封滅景象，古代封印金輝直衝霄漢（阿卡姆早報特派員 攝）'
                    : '▲ 異變平息後廢棄修道院上空拍攝到的超自然星穹透光景象（阿卡姆早報記者 攝）'}
                </div>
              </div>

              <div className="gazette-story-body">
                {isDeath ? (
                  <>
                    <p>
                      昨日破曉時分，密斯卡托尼克河畔的晨霧尚未散去，幾名正在法屬碼頭搬運木料的工人驚駭地發現了一具面部受損嚴重的殘破遺體。死者身穿黑色風衣，隨身物品僅餘一本被黑水侵蝕浸透的皮質調查筆記，以及若干刻滿奇異三叉幾何紋樣的不可名狀羊皮殘頁。
                    </p>
                    <p>
                      阿卡姆警局局長第一時間抵達現場並封鎖碼頭。在今晨的記者會上，警方堅稱死者純屬深夜在迷霧中失足落水溺斃的不幸意外，並嚴正警告各界切勿聽信近郊廢墟「巨大黑色血肉爪牙」之無稽荒誕謠言。死者已被移送密斯卡托尼克大學醫學院解剖室進一步比對身分。
                    </p>
                  </>
                ) : isTrueEnding ? (
                  <>
                    <p>
                      昨夜子夜，阿卡姆上空爆發了人類有記錄以來最為劇烈的天象異動。密斯卡托尼克大學天文台通報，原本逐漸與地平線重疊的詭異晦暗星宿在達到頂點之瞬，遭一股來自深海萬丈黑淵的璀璨金色古印神輝徹底擊穿，撕裂夜空的引力潮汐與不可名狀星軌當場碎滅！
                    </p>
                    <p>
                      據目擊者稱，拉萊耶黑曜石巨塔的虛影在翻湧的墨黑巨浪中發出哀鳴，終極舊日支配者的星之眷族在完整古印的純粹神光下被放逐回永恆的虛無時空裂隙。阿卡姆警局與市政廳已解除全鎮最高戒嚴令，雖然官方依然宣稱此為罕見的「高空電離層磁暴」，但所有深淵低語已徹底歸於寂靜。
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      連日籠罩阿卡姆北郊森林與廢棄修道院地底的地震般沉悶轟鳴與詭異幽綠磷光，於昨夜子夜時分突告平息。今晨晨光初照，封鎖區周圍瀰漫數週的惡臭濃霧開始迅速退散，周遭受驚牲畜亦逐漸安靜。
                    </p>
                    <p>
                      阿卡姆市政委員會與警局隨即發表聯合公報，宣稱該處地底騷動純屬百年老舊天然氣礦管破損引發的低頻共振與化學氣體燃燒，目前已由防護人員控制修復。然而，數十名住在法屬區的夜班工人與學生指誓歷歷地聲稱，在霧氣退散的幾秒鐘內，漆黑星穹曾短暫破裂，浮現一隻冰冷神聖的不可名狀巨大天眼……
                    </p>
                  </>
                )}
              </div>

              <div className="gazette-editorial-note">
                {isDeath
                  ? '社論短評：「這座小鎮在黑夜中又吞噬了一名固執的探求者。阿卡姆的水流依舊冰冷，而深淵的沉眠未曾被打擾。」'
                  : isTrueEnding
                  ? '社論特稿：「星辰正位的終焉時刻被一名血肉凡軀的孤膽調查員硬生生扭轉。古印已銘刻入深淵之底，凡人終在不可名狀的星穹巨獸面前，奪回了人類明日的黎明。」'
                  : '社論短評：「不可名狀的舊日支配者僅僅是翻了個身，再次沉入千年的沉睡。調查員以血肉之軀換來了短暫的喘息……但這座城鎮的迷霧永遠不會真正消散。」'}
              </div>
            </article>

            {/* Right Column: Adventure Dossier & Statistics */}
            <aside className="gazette-dossier-column">
              <div className="dossier-header-bar">
                <h3 className="dossier-title">
                  {isDeath ? (
                    <Skull size={15} color="#e63946" />
                  ) : isTrueEnding ? (
                    <Sparkles size={15} color="#ffd700" />
                  ) : (
                    <Award size={15} color="#ffd700" />
                  )}
                  <span>
                    {isDeath ? '殉職調查員案卷' : isTrueEnding ? '傳奇調查員真結局功勳' : '倖存調查員功勳'}
                  </span>
                </h3>
                <span className="dossier-case-id">NO. 1926-ARK-{stats.nodesVisited}</span>
              </div>

              <div className="dossier-content-card">
                <div className="dossier-investigator-info">
                  <div className="dossier-avatar-badge">
                    {isDeath ? (
                      <Skull size={22} color="#e63946" />
                    ) : isTrueEnding ? (
                      <Sparkles size={22} color="#ffd700" />
                    ) : (
                      <Award size={22} color="#ffd700" />
                    )}
                  </div>
                  <div className="dossier-names">
                    <span className="dossier-name">{investigator.name}</span>
                    <span className="dossier-occupation">{investigator.occupation}</span>
                  </div>
                </div>

                <div className="dossier-metrics-list">
                  <div className="dossier-metric-row">
                    <span className="dossier-metric-label">
                      <Heart size={13} color="#e63946" /> 終局狀態
                    </span>
                    <span
                      className={`dossier-status-pill ${
                        isDeath ? 'dead' : isTrueEnding ? 'true-ending' : 'victory'
                      }`}
                    >
                      {isDeath ? '肉體殞命' : isTrueEnding ? '古印封滅 · 扭轉星辰' : '生還平息'}
                    </span>
                  </div>

                  <div className="dossier-metric-row">
                    <span className="dossier-metric-label">
                      <Swords size={13} color="#f4a261" /> 斬除異端
                    </span>
                    <span className="dossier-metric-value">{stats.enemiesDefeated} 隻</span>
                  </div>

                  <div className="dossier-metric-row">
                    <span className="dossier-metric-label">
                      <Coins size={13} color="#ffd700" /> 累積古金幣
                    </span>
                    <span className="dossier-metric-value">
                      {stats.totalObolsCollected} 枚（結餘 {investigator.obols} 枚）
                    </span>
                  </div>

                  <div className="dossier-metric-row">
                    <span className="dossier-metric-label">
                      <BookOpen size={13} color="#c77dff" /> 終局牌庫規模
                    </span>
                    <span className="dossier-metric-value">{deckCapacity} 張（理智上限）</span>
                  </div>

                  <div className="dossier-metric-row">
                    <span className="dossier-metric-label">
                      <Layers size={13} color="#48cae4" /> 最深探索深度
                    </span>
                    <span className="dossier-metric-value">
                      {isDeath
                        ? `第 ${stats.maxLayer + 1} 層`
                        : isTrueEnding
                        ? '第四深度 · 拉萊耶核心湮滅'
                        : '封鎖區全層貫通 · 宿敵潰散'}
                    </span>
                  </div>

                  <div className="dossier-metric-row">
                    <span className="dossier-metric-label">
                      <MapPin size={13} color="#52b788" /> 走訪調查點
                    </span>
                    <span className="dossier-metric-value">{stats.nodesVisited} 處</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Staff Credits Section for True Ending */}
          {isTrueEnding && (
            <section className="gazette-credits-section" id="gazette-staff-credits">
              <div className="credits-header">
                <span className="credits-rule" />
                <span className="credits-title">【阿卡姆調查手記 · 通關製作名錄】</span>
                <span className="credits-rule" />
              </div>
              <div className="gazette-credits-grid">
                <div className="credit-item">
                  <span className="credit-role">總企劃 / 遊戲設計</span>
                  <span className="credit-name">密斯卡托尼克調查團 (Investigation Team)</span>
                </div>
                <div className="credit-item">
                  <span className="credit-role">克蘇魯原典演繹</span>
                  <span className="credit-name">H.P. Lovecraft 洛夫克拉夫特神話遺產</span>
                </div>
                <div className="credit-item">
                  <span className="credit-role">美術插畫與版面設計</span>
                  <span className="credit-name">阿卡姆古籍修復所 (Arkham Archives)</span>
                </div>
                <div className="credit-item">
                  <span className="credit-role">聲效氛圍與超維音律</span>
                  <span className="credit-name">阿薩托斯宮廷樂章 (Azathoth Resonator)</span>
                </div>
                <div className="credit-item full-width">
                  <span className="credit-role">傳奇特約調查員</span>
                  <span className="credit-name">
                    {investigator.name}（{investigator.occupation}）—— 感謝您拯救阿卡姆！
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Bottom Action Buttons */}
          <footer className="gazette-actions-bar">
            <button
              id="gazette-return-title-btn"
              className="gazette-action-btn"
              onClick={handleReturnToTitle}
            >
              <ArrowLeft size={16} />
              <span>
                {isDeath
                  ? '重新開始調查'
                  : isTrueEnding
                  ? '達成真結局 · 凱旋歸來'
                  : '凱旋返回主選單'}
              </span>
            </button>

            {isDeath && onRetryCombat && (
              <button
                id="gazette-retry-btn"
                className="gazette-action-btn secondary"
                onClick={handleRetry}
              >
                <RotateCcw size={16} />
                <span>原戰鬥重新調查</span>
              </button>
            )}
          </footer>
        </motion.div>
      </div>
    </div>
  );
};
