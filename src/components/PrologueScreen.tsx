import React, { useEffect } from 'react';
import { ArrowLeft, FastForward, UserCheck, Newspaper, Mail } from 'lucide-react';
import type { GameAction } from '../types/game';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';
import { TypewriterText } from './TypewriterText';

export interface PrologueScreenProps {
  dispatch: React.Dispatch<GameAction>;
}

export const PrologueScreen: React.FC<PrologueScreenProps> = ({ dispatch }) => {
  useEffect(() => {
    // 初次載入時播放低頻心跳聲，並定時維持深淵心跳氛圍
    const initialTimer = setTimeout(() => {
      soundEngine.playHeartbeat();
    }, 600);

    const heartbeatInterval = setInterval(() => {
      soundEngine.playHeartbeat();
    }, 4500);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(heartbeatInterval);
    };
  }, []);

  const handleProceed = () => {
    soundEngine.playClick();
    dispatch({ type: 'COMPLETE_PROLOGUE' });
  };

  const handleSkip = () => {
    soundEngine.playClick();
    dispatch({ type: 'COMPLETE_PROLOGUE' });
  };

  const handleBack = () => {
    soundEngine.playClick();
    dispatch({ type: 'RETURN_TO_TITLE' });
  };

  const articleText =
    '本報訊——阿卡姆市警局今日清晨緊急封鎖了近郊黑木森林與荒廢修道院。密斯卡托尼克大學歷史系考察隊已失聯逾七十二小時，搜救警員僅在地下暗室尋獲撕碎的研究手稿與泛著磷光的黏稠黑泥。市警局發言人宣稱純屬瓦斯外洩意外，但多名居民聲稱深夜曾目睹夜空裂開幽綠極光……';

  const letterText =
    '致受委託的調查員：\n阿卡姆正在失去理智。那絕非尋常的犯罪，而是沉睡在星辰之外的舊日暗影正在深淵甦醒。我們已為你備妥了最初的防身武裝與必備手記。請立即就位挑選調查員身份，踏入阿卡姆封鎖區中心。願微弱的理智之光伴你前行。';

  return (
    <div className="title-screen-container prologue-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />
      <div className="cosmic-particles-bg" />

      {/* Top Bar Navigation */}
      <div className="title-screen-top-bar">
        <button
          id="prologue-back-btn"
          className="back-to-menu-btn"
          onClick={handleBack}
        >
          <ArrowLeft size={18} />
          <span>返回主選單</span>
        </button>

        <div className="title-screen-top-right-group">
          <button
            id="prologue-skip-btn"
            className="prologue-skip-btn"
            onClick={handleSkip}
            title="跳過序章引導"
          >
            <FastForward size={16} />
            <span>跳過序章</span>
          </button>
          <div className="title-screen-audio-corner">
            <AudioToggle />
          </div>
        </div>
      </div>

      {/* Main Narrative Area */}
      <main className="prologue-content-scroll">
        <div className="prologue-cards-stack">
          {/* 1920s Arkham Gazette Newspaper Clipping */}
          <article className="prologue-newspaper-clipping">
            <header className="newspaper-header">
              <div className="newspaper-masthead">
                <Newspaper size={20} className="newspaper-icon" />
                <span className="newspaper-name">阿卡姆早報 · ARKHAM GAZETTE</span>
              </div>
              <div className="newspaper-meta">
                <span>1926年10月14日 · 星期四 · 特別號外</span>
                <span className="newspaper-tag">【頭版緊急報導】</span>
              </div>
              <h2 className="newspaper-headline">
                密斯卡托尼克大學考古隊失聯！近郊廢棄修道院驚現非人祭壇
              </h2>
            </header>

            <div className="newspaper-body">
              <p className="newspaper-paragraph">
                <TypewriterText
                  text={articleText}
                  speed={16}
                  delay={200}
                  playSound={true}
                />
              </p>
            </div>
          </article>

          {/* Commissioner's Confidential Letter */}
          <section className="prologue-letter-card">
            <div className="letter-seal-badge">
              <Mail size={18} />
              <span>阿卡姆調查委託密信</span>
            </div>
            <div className="letter-body">
              <p className="letter-paragraph">
                <TypewriterText
                  text={letterText}
                  speed={18}
                  delay={800}
                  playSound={true}
                />
              </p>
            </div>
          </section>

          {/* Bottom Action Controls */}
          <footer className="prologue-footer-actions">
            <button
              id="proceed-to-occupation-btn"
              className="prologue-proceed-btn"
              onClick={handleProceed}
            >
              <UserCheck size={20} />
              <span>閱讀完畢 · 選擇調查員</span>
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
};
