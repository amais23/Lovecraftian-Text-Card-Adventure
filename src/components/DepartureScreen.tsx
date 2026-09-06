import React, { useEffect } from 'react';
import { FastForward, MapPin, Compass, Sparkles } from 'lucide-react';
import type { GameAction, GameState } from '../types/game';
import { soundEngine } from '../engine/audioManager';
import { TypewriterText } from './TypewriterText';

export interface DepartureScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const DepartureScreen: React.FC<DepartureScreenProps> = ({ state, dispatch }) => {
  const isPierce = state.investigator.occupationId !== 'occultist';

  useEffect(() => {
    if (isPierce) {
      const gunTimer = setTimeout(() => {
        soundEngine.playGunCock();
      }, 400);

      const engineTimer = setTimeout(() => {
        soundEngine.playEngineStart();
      }, 1200);

      return () => {
        clearTimeout(gunTimer);
        clearTimeout(engineTimer);
      };
    } else {
      const astralTimer = setTimeout(() => {
        soundEngine.playAstralHum();
      }, 500);

      return () => {
        clearTimeout(astralTimer);
      };
    }
  }, [isPierce]);

  const handleEnterMap = () => {
    soundEngine.playClick();
    dispatch({ type: 'COMPLETE_DEPARTURE' });
  };

  const handleSkip = () => {
    soundEngine.playClick();
    dispatch({ type: 'COMPLETE_DEPARTURE' });
  };

  const pierceNarrative =
    '暴雨重重敲擊著老舊汽車的擋風玻璃，阿卡姆的昏黃街燈在濃霧中暈開如一團團幽魂。愛德華·皮爾斯面無表情地拉動套筒，將點38子彈俐落壓入轉輪手槍彈巢，金屬撞針發出清脆冷硬的脆響。他深吸了一口燃燒著苦澀煙草的潮濕空氣，猛踩油門，引擎爆發出低沉的咆哮，車輪揚起水花轟然切開伸手不見五指的迷霧……';

  const vanceNarrative =
    '沉重的石門將外界的淒厲風雨隔絕於檔案室之外。艾蓮諾·凡斯戴上羊皮手套，在搖曳的燭光中翻開了浸染著古老符記的牛皮紙殘典，空氣中驟然泛起冰冷刺骨的臭氧氣味。當她將那柄刻著星圖的古老銀鑰置於法陣中央時，虛空之中傳來空靈而震顫的宏大微鳴，無數微光撕裂維度，指引出通往不可名狀之境的軌跡……';

  return (
    <div className={`title-screen-container departure-screen-container ${isPierce ? 'pierce-theme' : 'vance-theme'}`}>
      <div className="vignette-overlay" />
      <div className="fog-layer" />
      <div className="cosmic-particles-bg" />
      {isPierce ? <div className="rain-effect-layer" /> : <div className="astral-rune-layer" />}

      {/* Top Bar Navigation: Badge on left edge, Skip on right edge */}
      <div className="title-screen-top-bar departure-top-bar">
        <div className="departure-top-badge">
          <Compass size={18} color="#cfa866" />
          <span>調查員啟程過場</span>
        </div>

        <button
          id="departure-skip-btn"
          className="prologue-skip-btn"
          onClick={handleSkip}
          title="跳過過場動畫"
        >
          <FastForward size={16} />
          <span>跳過過場</span>
        </button>
      </div>

      {/* Cinematic Showcase Card */}
      <main className="departure-content-wrapper">
        <div className="departure-cinematic-card">
          <header className="departure-card-header">
            <div className={`departure-avatar-badge ${isPierce ? 'investigator' : 'occultist'}`}>
              {isPierce ? <Compass size={32} color="#ffd700" /> : <Sparkles size={32} color="#c77dff" />}
            </div>
            <div className="departure-identity-block">
              <span className="departure-eyebrow">
                {isPierce ? '雨夜啟程 · 破霧而行' : '星扉初啟 · 銀鑰生輝'}
              </span>
              <h2 className="departure-hero-name">{state.investigator.name}</h2>
              <span className="departure-sub-location">
                {isPierce ? '阿卡姆近郊街頭 · 暴雨與封鎖線前哨' : '密斯卡托尼克大學地下特藏室 · 禁忌星圖'}
              </span>
            </div>
          </header>

          <div className="departure-cinematic-body">
            <p className="departure-narrative-text">
              <TypewriterText
                text={isPierce ? pierceNarrative : vanceNarrative}
                speed={18}
                delay={300}
                playSound={true}
              />
            </p>
          </div>

          <footer className="departure-card-footer">
            <button
              id="enter-map-btn"
              className={`departure-enter-map-btn ${isPierce ? 'investigator' : 'occultist'}`}
              onClick={handleEnterMap}
            >
              <MapPin size={20} />
              <span>踏入調查地圖 · 展開冒險</span>
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
};
