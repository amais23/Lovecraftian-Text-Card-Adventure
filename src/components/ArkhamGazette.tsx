import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GameState, GameAction } from '../types/game';
import { ensureAdventureStats, getPermanentDeckCount } from '../engine/gameReducer';
import { soundEngine } from '../engine/audioManager';
import {
  Skull,
  Award,
  ArrowLeft,
  RotateCcw,
  Coins,
  Swords,
  MapPin,
  Layers,
  Heart,
  BookOpen,
} from 'lucide-react';

export type GazetteEndingType = 'death' | 'victory';

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
          className={`gazette-paper-sheet ${isDeath ? 'death-theme' : 'victory-theme'}`}
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
          <div className={`gazette-stamp ${isDeath ? 'death' : 'victory'}`}>
            {isDeath ? 'MISKATONIC CORONER · INQUEST' : 'SANCTIONED SEAL · RESOLVED'}
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
              <span>{isDeath ? 'VOL. XLVIII · NO. 14,892' : 'VOL. XLVIII · NO. 14,893'}</span>
              <span>ARKHAM, MASS., SATURDAY, OCTOBER 23, 1926</span>
              <span>{isDeath ? 'LATE CITY DISPATCH · TWO CENTS' : 'EXTRA FINAL EDITION · TWO CENTS'}</span>
            </div>
          </header>

          {/* Primary Headline Section */}
          <div className={`gazette-headline-section ${isDeath ? 'death' : 'victory'}`}>
            <div className="gazette-kicker">
              {isDeath
                ? 'SPECIAL DISPATCH · TRAGIC OCCURRENCE AT THE RIVERBANK'
                : 'UNPRECEDENTED OCCURRENCE · STRANGE DISTURBANCE REPORTED'}
            </div>
            <h2 className="gazette-primary-headline" id="gazette-primary-headline">
              {isDeath
                ? '【無名殘軀浮現密斯卡托尼克河畔，警方稱純屬意外】'
                : '【近郊廢棄修道院神秘異變暫歇，官方堅稱瓦斯洩漏，市民聲稱目睹夜空巨瞳】'}
            </h2>
          </div>

          {/* Two-Column Newspaper Layout */}
          <div className="gazette-columns-layout">
            {/* Left Column: News Report */}
            <article className="gazette-article-column">
              <div className="gazette-illustration-box">
                <img
                  src={isDeath ? '/cards/truth/card_truth_fragment.webp' : '/cards/truth/card_astral_insight.png'}
                  alt={isDeath ? '密斯卡托尼克河畔物證' : '修道院星穹異變'}
                  className="gazette-illustration-img"
                />
                <div className="gazette-illustration-caption">
                  {isDeath
                    ? '▲ 昨日清晨於密斯卡托尼克河下游碼頭起獲之遺物手札殘片（阿卡姆早報記者 攝）'
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
                  : '社論短評：「不可名狀的舊日支配者僅僅是翻了個身，再次沉入千年的沉睡。調查員以血肉之軀換來了短暫的喘息……但這座城鎮的迷霧永遠不會真正消散。」'}
              </div>
            </article>

            {/* Right Column: Adventure Dossier & Statistics */}
            <aside className="gazette-dossier-column">
              <div className="dossier-header-bar">
                <h3 className="dossier-title">
                  {isDeath ? <Skull size={15} color="#e63946" /> : <Award size={15} color="#ffd700" />}
                  <span>{isDeath ? '殉職調查員案卷' : '倖存調查員功勳'}</span>
                </h3>
                <span className="dossier-case-id">NO. 1926-ARK-{stats.nodesVisited}</span>
              </div>

              <div className="dossier-content-card">
                <div className="dossier-investigator-info">
                  <div className="dossier-avatar-badge">
                    {isDeath ? <Skull size={22} color="#e63946" /> : <Award size={22} color="#ffd700" />}
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
                    <span className={`dossier-status-pill ${isDeath ? 'dead' : 'victory'}`}>
                      {isDeath ? '肉體殞命' : '生還平息'}
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
                      {isDeath ? `第 ${stats.maxLayer + 1} 層` : '封鎖區全層貫通 · 宿敵潰散'}
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

          {/* Bottom Action Buttons */}
          <footer className="gazette-actions-bar">
            <button
              id="gazette-return-title-btn"
              className="gazette-action-btn"
              onClick={handleReturnToTitle}
            >
              <ArrowLeft size={16} />
              <span>{isDeath ? '重新開始調查' : '凱旋返回主選單'}</span>
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
