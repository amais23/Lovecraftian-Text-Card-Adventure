import React from 'react';
import type { GameAction, GameState } from '../types/game';
import { Flame, Heart, BookOpen, Sparkles, LogOut, ShieldAlert } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';

interface AltarScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const AltarScreen: React.FC<AltarScreenProps> = ({ state, dispatch }) => {
  const investigator = state.investigator;
  const isUsed = Boolean(state.altarUsed);
  const handCapacity = investigator.handCapacity ?? 2;
  const [mindCostType, setMindCostType] = React.useState<'health' | 'sanity'>('health');

  const handleSacrifice = (optionId: 'flesh' | 'mind' | 'boon', costType?: 'health' | 'sanity') => {
    if (isUsed) return;
    if (optionId === 'flesh' && investigator.health <= 6) return;
    if (optionId === 'mind') {
      const actualCost = costType ?? mindCostType;
      if (actualCost === 'health' && investigator.health <= 10) return;
      if (actualCost === 'sanity' && (state.sanityDeck?.length ?? 0) <= 2) return;
      soundEngine.playClick();
      dispatch({
        type: 'USE_ALTAR',
        payload: { optionId: 'mind', costType: actualCost },
      });
      return;
    }
    if (optionId === 'boon' && investigator.health <= 6) return;

    soundEngine.playClick();
    dispatch({
      type: 'USE_ALTAR',
      payload: { optionId },
    });
  };

  const handleLeave = () => {
    soundEngine.playClick();
    dispatch({ type: 'LEAVE_ALTAR' });
  };

  return (
    <div className="altar-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="altar-card-panel">
        <header className="altar-header">
          <div className="altar-header-top">
            <div className="altar-icon-badge">
              <Flame size={36} color="#ff4a6e" />
            </div>
            <AudioToggle />
          </div>
          <h1 className="altar-title">禁忌祭壇 · 幽藍冷火之所</h1>
          <p className="altar-subtitle">
            古老青石祭壇上燃燒著不熄的冷火，深淵的不可知意志在此等候代價與誓約。凡人唯有獻出切膚之痛，方能換取超然力量。
          </p>
        </header>

        {/* Status Strip */}
        <div className="altar-status-strip">
          <div className="altar-status-pill health">
            <Heart size={18} color="#ff334b" />
            <span>
              肉體生命值: {investigator.health} / {investigator.maxHealth}
            </span>
          </div>

          <div className="altar-status-pill">
            <BookOpen size={18} color="#cfa866" />
            <span>抽牌與保留手牌數: {handCapacity} 張</span>
          </div>

          <div className="altar-status-pill">
            <ShieldAlert size={18} color="#ff4a6e" />
            <span>祭獻狀態：{isUsed ? '本次誓約已完成' : '可選 1 項代價奉獻'}</span>
          </div>
        </div>

        {/* Options Grid */}
        <div className="altar-options-grid">
          {/* Option 1: Flesh */}
          <div
            id="altar-option-flesh"
            className={`altar-option-card ${isUsed || investigator.health <= 6 ? 'disabled' : ''}`}
            onClick={() => handleSacrifice('flesh')}
          >
            <div className="altar-card-icon health">
              <Heart size={28} color="#ff334b" />
            </div>
            <h3 className="altar-card-title">血肉淬鍊之誓</h3>
            <p className="altar-card-desc">
              以利刃割破掌心，以滾燙鮮血澆灌石刻古印。承受 6 點肉體生命值傷害，永久拓展肌體生命極限，最大生命值永久提升 5 點（並立即修補 5 點傷勢）。
            </p>
            <button
              id="altar-flesh-btn"
              className="altar-action-btn"
              disabled={isUsed || investigator.health <= 6}
            >
              {isUsed
                ? '已完成奉獻'
                : investigator.health <= 6
                ? '生命值不足（需 > 6）'
                : '割肉奉獻 · 承受 6 點傷害'}
            </button>
          </div>

          {/* Option 2: Mind */}
          <div
            id="altar-option-mind"
            className={`altar-option-card ${
              isUsed ||
              (mindCostType === 'health'
                ? investigator.health <= 10
                : (state.sanityDeck?.length ?? 0) <= 2)
                ? 'disabled'
                : ''
            }`}
          >
            <div className="altar-card-icon mind">
              <BookOpen size={28} color="#cfa866" />
            </div>
            <h3 className="altar-card-title">超維神經撕裂</h3>
            <p className="altar-card-desc">
              直視幽藍冷火中扭曲的超維幾何裂隙，忍受精神重創。可自主選擇承受 10 點生命值代價或損耗 2 點理智（自牌庫永久除役 2 張卡牌），永久拓展心智容量，手牌容量永久 +1（抽牌與保留手牌數同步提升 1 張）。
            </p>

            <div
              className="altar-cost-toggle-row"
              style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}
            >
              <button
                type="button"
                className={`altar-sub-btn ${mindCostType === 'health' ? 'active' : ''}`}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  background:
                    mindCostType === 'health'
                      ? 'rgba(255, 74, 110, 0.3)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    mindCostType === 'health'
                      ? '1px solid #ff4a6e'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                  color: mindCostType === 'health' ? '#fff' : '#aaa',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                disabled={isUsed}
                onClick={(e) => {
                  e.stopPropagation();
                  setMindCostType('health');
                }}
              >
                承受 10 生命值代價
              </button>
              <button
                type="button"
                className={`altar-sub-btn ${mindCostType === 'sanity' ? 'active' : ''}`}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  background:
                    mindCostType === 'sanity'
                      ? 'rgba(72, 202, 228, 0.3)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    mindCostType === 'sanity'
                      ? '1px solid #48cae4'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                  color: mindCostType === 'sanity' ? '#fff' : '#aaa',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                disabled={isUsed}
                onClick={(e) => {
                  e.stopPropagation();
                  setMindCostType('sanity');
                }}
              >
                損耗 2 點理智代價
              </button>
            </div>

            <button
              id="altar-mind-btn"
              className="altar-action-btn"
              disabled={
                isUsed ||
                (mindCostType === 'health'
                  ? investigator.health <= 10
                  : (state.sanityDeck?.length ?? 0) <= 2)
              }
              onClick={() => handleSacrifice('mind')}
            >
              {isUsed
                ? '已完成奉獻'
                : mindCostType === 'health'
                ? investigator.health <= 10
                  ? '生命值不足（需 > 10）'
                  : '撕裂神經 · 承受 10 點傷害'
                : (state.sanityDeck?.length ?? 0) <= 2
                ? '理智牌庫不足（需 > 2 張）'
                : '損耗理智 · 永久除役 2 張卡牌'}
            </button>
          </div>

          {/* Option 3: Boon */}
          <div
            id="altar-option-boon"
            className={`altar-option-card ${isUsed || investigator.health <= 6 ? 'disabled' : ''}`}
            onClick={() => handleSacrifice('boon')}
          >
            <div className="altar-card-icon boon">
              <Sparkles size={28} color="#e0a96d" />
            </div>
            <h3 className="altar-card-title">深淵恩賜喚引</h3>
            <p className="altar-card-desc">
              將鮮血浸入太古符文槽，自虛空裂隙中喚醒一件古老之物。承受 6 點生命值傷害，隨機獲取 1 件未持有的舊日遺物納入行囊（若已全數持有則獲取 35 枚古金幣）。
            </p>
            <button
              id="altar-boon-btn"
              className="altar-action-btn"
              disabled={isUsed || investigator.health <= 6}
            >
              {isUsed
                ? '已完成奉獻'
                : investigator.health <= 6
                ? '生命值不足（需 > 6）'
                : '引導恩賜 · 承受 6 點傷害'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="altar-footer">
          <button id="altar-leave-btn" className="altar-leave-btn" onClick={handleLeave}>
            <LogOut size={18} />
            <span>{isUsed ? '結束祭獻 · 離開禁忌祭壇' : '轉身離開 · 離開禁忌祭壇'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
