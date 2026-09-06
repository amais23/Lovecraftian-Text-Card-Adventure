import React, { useEffect } from 'react';
import { FastForward, Compass, Heart, ArrowRight, Skull, Eye } from 'lucide-react';
import type { GameAction, GameState } from '../types/game';
import { soundEngine } from '../engine/audioManager';
import { TypewriterText } from './TypewriterText';

export interface DepthTransitionScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

interface DepthTransitionStory {
  fromDepthName: string;
  toDepthName: string;
  toDepthNumber: number;
  bossDefeatedTitle: string;
  narrative: string;
  buttonLabel: string;
}

const TRANSITION_STORIES: Record<number, DepthTransitionStory> = {
  1: {
    fromDepthName: '第一深度：阿卡姆封鎖區',
    toDepthName: '第二深度：深潛者海蝕迷宮',
    toDepthNumber: 2,
    bossDefeatedTitle: '修格斯幼體 (Shoggoth Progeny) 伏誅',
    narrative:
      '修格斯幼體在劇烈抽搐中化作刺鼻的瀝青黑泥，迅速滲入地底青石裂隙。狂暴的非人威壓隨之消散，下水道中只剩下令人心悸的死寂。\n\n你背靠冰冷潮濕的石壁劇烈喘息，緊繃到極點的神經與肉體撕裂的創傷，在深淵短暫退縮的奇蹟中迅速止血、凝結並奇蹟般復甦——身體生命值已全額恢復至上限！\n\n然而，下水道深處傳來了更低沉浩瀚的怒海潮鳴。夾雜著深海魚腥與鹽漬寒風的冷氣從岩壁裂穴呼嘯而至……你握緊手中的武器與提燈，毅然踏入通往「深潛者海蝕迷宮」的淹沒甬道。',
    buttonLabel: '邁向第二深度 · 深潛者海蝕迷宮',
  },
  2: {
    fromDepthName: '第二深度：深潛者海蝕迷宮',
    toDepthName: '第三深度：無底深淵祭壇',
    toDepthNumber: 3,
    bossDefeatedTitle: '大袞的深淵祭司 (High Priest of Dagon) 伏誅',
    narrative:
      '大袞的深淵祭司發出最後一聲淒厲的深海長嘯，腐朽的珊瑚黑鐵三叉戟在海潮中崩解為細沙碎石。海水在倒灌般的漩渦吸力中退潮散去，露出了直通地心的玄武岩深淵裂谷。\n\n短暫的休憩讓你的身心再度獲得神經性的平靜與完全復甦——身體生命值已全額回滿！\n\n前方矗立著超越凡人想像的非歐幾何巨石祭壇，冰冷的虛空冷火在無底裂縫邊緣靜靜燃燒，不可名狀的原生質低語正在深處盤旋。你重整理智，向著「無底深淵祭壇」邁進。',
    buttonLabel: '邁向第三深度 · 無底深淵祭壇',
  },
  3: {
    fromDepthName: '第三深度：無底深淵祭壇',
    toDepthName: '第四深度：星辰正位 · 拉萊耶核心',
    toDepthNumber: 4,
    bossDefeatedTitle: '原生巨型修格斯 (Colossal Shoggoth) 伏誅',
    narrative:
      '原生巨型修格斯的萬丈黑泥軀體在震耳欲聾的泰克利利哀鳴中崩解為漫天黑雨。天地間的空間維度被徹底撕裂，深海天幕上，沉睡無數紀元的異星正位排列，散發出不可直視的超維光芒。\n\n凡人血肉在不可思議的宇宙共鳴中得到了極限的癒合與激發——身體生命值全額回滿！\n\n深淵之門已然洞開，沉睡的舊日支配者血脈在拉萊耶的核心神殿中睜開了巨目。這是終局之戰，踏入拉萊耶的核心，面對最後的命運！',
    buttonLabel: '踏入拉萊耶核心 · 終局之戰',
  },
};

export const DepthTransitionScreen: React.FC<DepthTransitionScreenProps> = ({ state, dispatch }) => {
  const currentDepth = state.currentDepth ?? 1;
  const story = TRANSITION_STORIES[currentDepth] ?? TRANSITION_STORIES[1];

  useEffect(() => {
    soundEngine.playHeartbeat();
    const whisperTimer = setTimeout(() => {
      soundEngine.playWhisper();
    }, 600);

    const secondHeartbeatTimer = setTimeout(() => {
      soundEngine.playHeartbeat();
    }, 1800);

    return () => {
      clearTimeout(whisperTimer);
      clearTimeout(secondHeartbeatTimer);
    };
  }, [currentDepth]);

  const handleProceed = () => {
    soundEngine.playClick();
    dispatch({ type: 'COMPLETE_DEPTH_TRANSITION' });
  };

  return (
    <div className="title-screen-container depth-transition-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />
      <div className="cosmic-particles-bg" />

      {/* Top Bar */}
      <div className="title-screen-top-bar depth-transition-top-bar">
        <div className="depth-transition-top-badge">
          <Compass size={18} color="#cfa866" />
          <span>深度推進 · 破除宿敵</span>
        </div>

        <button
          id="depth-transition-skip-btn"
          className="prologue-skip-btn"
          onClick={handleProceed}
          title="跳過過渡手記"
        >
          <FastForward size={16} />
          <span>跳過手記</span>
        </button>
      </div>

      {/* Main Narrative Card */}
      <main className="depth-transition-content-wrapper">
        <div className="depth-transition-card">
          <header className="depth-transition-header">
            <div className="depth-transition-icon-badge">
              {currentDepth >= 3 ? <Eye size={36} color="#c77dff" /> : <Skull size={36} color="#ffd700" />}
            </div>
            <div className="depth-transition-title-block">
              <span className="depth-transition-eyebrow">
                {story.fromDepthName} ➔ {story.toDepthName}
              </span>
              <h2 className="depth-transition-title">{story.bossDefeatedTitle}</h2>
              <div className="depth-transition-recovery-badge">
                <Heart size={16} color="#ff334b" />
                <span>【首領決戰復甦】肉體生命值全額回滿 ({state.investigator.health} / {state.investigator.maxHealth})</span>
              </div>
            </div>
          </header>

          <div className="depth-transition-body">
            <div className="depth-transition-story-content">
              <TypewriterText text={story.narrative} speed={15} />
            </div>
          </div>

          <footer className="depth-transition-footer">
            <button
              id="depth-transition-proceed-btn"
              className="depth-transition-proceed-btn"
              onClick={handleProceed}
            >
              <span>{story.buttonLabel}</span>
              <ArrowRight size={18} />
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
};
