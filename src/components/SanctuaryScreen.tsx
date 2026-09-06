import React from 'react';
import type { GameAction, GameState } from '../types/game';
import { Tent, Heart, Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';

interface SanctuaryScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const SanctuaryScreen: React.FC<SanctuaryScreenProps> = ({ state, dispatch }) => {
  const investigator = state.investigator;
  const isUsed = Boolean(state.sanctuaryUsed);
  const canAffordBandage = investigator.obols >= 5 || state.sanityDeck.length > 0;

  const handleUseSanctuary = (optionId: 'bandage' | 'meditate') => {
    if (isUsed) return;
    if (optionId === 'bandage') {
      if (investigator.health >= investigator.maxHealth) return;
      if (!canAffordBandage) return;
    }
    soundEngine.playClick();
    dispatch({
      type: 'USE_SANCTUARY',
      payload: { optionId },
    });
  };

  const handleLeave = () => {
    soundEngine.playClick();
    dispatch({ type: 'LEAVE_SANCTUARY' });
  };

  return (
    <div className="sanctuary-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="sanctuary-card-panel">
        <header className="sanctuary-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '12px' }}>
            <div className="sanctuary-icon-badge">
              <Tent size={36} color="#74c69d" />
            </div>
            <AudioToggle />
          </div>
          <h1 className="sanctuary-title">安全避難所 · 守墓人小屋</h1>
          <p className="sanctuary-subtitle">
            厚重的鐵栓阻絕了外界的瘋狂與低語。壁爐的餘火正噼啪作響，提供短暫的喘息與修整機會。
          </p>
        </header>

        {/* Status Indicators */}
        <div className="sanctuary-status-strip">
          <div className="sanctuary-status-pill health">
            <Heart size={18} color="#ff334b" />
            <span>
              肉體生命值: {investigator.health} / {investigator.maxHealth}
            </span>
          </div>

          <div className="sanctuary-status-pill">
            <ShieldCheck size={18} color="#74c69d" />
            <span>避難所修整：{isUsed ? '本次已修整完畢' : '可選 1 項行動'}</span>
          </div>
        </div>

        {/* Resting Options */}
        <div className="sanctuary-options-grid">
          {/* Option 1: Bandage Flesh */}
          <div
            id="sanctuary-bandage-card"
            className={`sanctuary-option-card ${isUsed || investigator.health >= investigator.maxHealth || !canAffordBandage ? 'disabled' : ''}`}
            onClick={() => handleUseSanctuary('bandage')}
          >
            <div className="sanctuary-card-icon health">
              <Heart size={28} color="#ff334b" />
            </div>
            <h3 className="sanctuary-card-title">深層縫合與包紮</h3>
            <p className="sanctuary-card-desc">
              在凡人極限下清洗撕裂的傷口並重新敷藥。消耗 5 枚古金幣購置急救藥品；若古金幣不足，將忍受劇痛損耗 1 點理智完成自救。恢復 8 點肉體生命值（上限 25 點）。
            </p>
            <button
              id="sanctuary-bandage-btn"
              className="sanctuary-action-btn"
              disabled={isUsed || investigator.health >= investigator.maxHealth || !canAffordBandage}
            >
              {investigator.health >= investigator.maxHealth
                ? '生命值已滿'
                : !canAffordBandage
                ? '代價不足 (需 5 古金幣或 1 理智)'
                : investigator.obols >= 5
                ? '執行包紮 (耗 5 古金幣)'
                : '強行包紮 (耗 1 理智)'}
            </button>
          </div>

          {/* Option 2: Meditate */}
          <div
            id="sanctuary-meditate-card"
            className={`sanctuary-option-card ${isUsed ? 'disabled' : ''}`}
            onClick={() => handleUseSanctuary('meditate')}
          >
            <div className="sanctuary-card-icon truth">
              <Sparkles size={28} color="#c77dff" />
            </div>
            <h3 className="sanctuary-card-title">心智冥想與思緒重整</h3>
            <p className="sanctuary-card-desc">
              凝神端坐，以冷靜的意志平抑腦海中的深淵幻覺。將特殊白色真相卡【心智防波堤】永久納入理智牌庫。
            </p>
            <button
              id="sanctuary-meditate-btn"
              className="sanctuary-action-btn"
              disabled={isUsed}
            >
              {isUsed ? '已完成冥想' : '進行冥想 (獲真相卡)'}
            </button>
          </div>
        </div>

        {/* Leave Sanctuary Button */}
        <div className="sanctuary-footer">
          <button
            id="leave-sanctuary-btn"
            className="sanctuary-leave-btn"
            onClick={handleLeave}
          >
            <LogOut size={18} />
            <span>啟程出發，重回調查路線</span>
          </button>
        </div>
      </div>
    </div>
  );
};
