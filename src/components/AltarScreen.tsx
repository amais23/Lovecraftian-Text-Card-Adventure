import React from 'react';
import type { AltarRitual, AltarRitualId, GameAction, GameState } from '../types/game';
import { Flame, Heart, BookOpen, Sparkles, LogOut, ShieldAlert, Coins } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';
import { getDefaultAltarRituals } from '../engine/altarService';

interface AltarScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const AltarScreen: React.FC<AltarScreenProps> = ({ state, dispatch }) => {
  const investigator = state.investigator;
  const isUsed = Boolean(state.altarUsed);
  const handCapacity = investigator.handCapacity ?? 2;
  const [mindCostType, setMindCostType] = React.useState<'health' | 'sanity'>('health');

  const rituals =
    state.altarRituals && state.altarRituals.length === 3
      ? state.altarRituals
      : getDefaultAltarRituals();

  const handleSacrifice = (optionId: AltarRitualId, costType?: 'health' | 'sanity') => {
    if (isUsed) return;
    if (optionId === 'flesh' && investigator.health <= 6) return;
    if (optionId === 'mind' || optionId === 'time_space') {
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
    if ((optionId === 'boon' || optionId === 'void') && investigator.health <= 6) return;
    if (optionId === 'chaos') {
      if (investigator.health <= 4 || (state.sanityDeck?.length ?? 0) <= 1) return;
    }
    if (optionId === 'blood_pact' && investigator.health <= 8) return;

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

  const getRitualMeta = (ritual: AltarRitual) => {
    switch (ritual.id) {
      case 'flesh':
        return {
          iconClass: 'health',
          icon: <Heart size={28} color="#ff334b" />,
          cardId: 'altar-option-flesh',
          testId: 'altar-option-flesh',
          btnId: 'altar-flesh-btn',
          btnTestId: 'altar-flesh-btn',
          disabled: isUsed || investigator.health <= 6,
          btnText: isUsed
            ? '已完成奉獻'
            : investigator.health <= 6
            ? '生命值不足（需 > 6）'
            : '割肉奉獻 · 承受 6 點傷害',
          onSacrifice: () => handleSacrifice('flesh'),
          hasToggle: false,
        };
      case 'time_space':
      case 'mind':
        return {
          iconClass: 'mind',
          icon: <BookOpen size={28} color="#cfa866" />,
          cardId: 'altar-option-mind',
          testId: 'altar-option-time_space',
          btnId: 'altar-mind-btn',
          btnTestId: 'altar-time_space-btn',
          disabled:
            isUsed ||
            (mindCostType === 'health'
              ? investigator.health <= 10
              : (state.sanityDeck?.length ?? 0) <= 2),
          btnText: isUsed
            ? '已完成奉獻'
            : mindCostType === 'health'
            ? investigator.health <= 10
              ? '生命值不足（需 > 10）'
              : '撕裂神經 · 承受 10 點傷害'
            : (state.sanityDeck?.length ?? 0) <= 2
            ? '理智牌庫不足（需 > 2 張）'
            : '損耗理智 · 永久除役 2 張卡牌',
          onSacrifice: () => handleSacrifice('time_space'),
          hasToggle: true,
        };
      case 'void':
      case 'boon':
        return {
          iconClass: 'boon',
          icon: <Sparkles size={28} color="#e0a96d" />,
          cardId: 'altar-option-boon',
          testId: 'altar-option-void',
          btnId: 'altar-boon-btn',
          btnTestId: 'altar-void-btn',
          disabled: isUsed || investigator.health <= 6,
          btnText: isUsed
            ? '已完成奉獻'
            : investigator.health <= 6
            ? '生命值不足（需 > 6）'
            : '引導恩賜 · 承受 6 點傷害',
          onSacrifice: () => handleSacrifice('void'),
          hasToggle: false,
        };
      case 'chaos':
        return {
          iconClass: 'chaos',
          icon: <Coins size={28} color="#ffd700" />,
          cardId: 'altar-option-chaos',
          testId: 'altar-option-chaos',
          btnId: 'altar-chaos-btn',
          btnTestId: 'altar-chaos-btn',
          disabled:
            isUsed || investigator.health <= 4 || (state.sanityDeck?.length ?? 0) <= 1,
          btnText: isUsed
            ? '已完成奉獻'
            : investigator.health <= 4
            ? '生命值不足（需 > 4）'
            : (state.sanityDeck?.length ?? 0) <= 1
            ? '理智牌庫不足（需 > 1 張）'
            : '混沌祈願 · 承受 4 傷並除役 1 牌',
          onSacrifice: () => handleSacrifice('chaos'),
          hasToggle: false,
        };
      case 'blood_pact':
        return {
          iconClass: 'blood_pact',
          icon: <Flame size={28} color="#d90429" />,
          cardId: 'altar-option-blood_pact',
          testId: 'altar-option-blood_pact',
          btnId: 'altar-blood_pact-btn',
          btnTestId: 'altar-blood_pact-btn',
          disabled: isUsed || investigator.health <= 8,
          btnText: isUsed
            ? '已完成奉獻'
            : investigator.health <= 8
            ? '生命值不足（需 > 8）'
            : '締結血契 · 承受 8 點傷害',
          onSacrifice: () => handleSacrifice('blood_pact'),
          hasToggle: false,
        };
      default:
        return null;
    }
  };

  const renderRitualCard = (ritual: AltarRitual) => {
    const meta = getRitualMeta(ritual);
    if (!meta) return null;

    return (
      <div
        key={ritual.id}
        id={meta.cardId}
        data-testid={meta.testId}
        className={`altar-option-card ${meta.disabled ? 'disabled' : ''}`}
        onClick={meta.hasToggle ? undefined : meta.onSacrifice}
      >
        <div className={`altar-card-icon ${meta.iconClass}`}>
          {meta.icon}
        </div>
        <h3 className="altar-card-title">{ritual.name}</h3>
        <p className="altar-card-desc">{ritual.description}</p>

        {meta.hasToggle && (
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
        )}

        <button
          id={meta.btnId}
          data-testid={meta.btnTestId}
          className="altar-action-btn"
          disabled={meta.disabled}
          onClick={meta.onSacrifice}
        >
          {meta.btnText}
        </button>
      </div>
    );
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
          {rituals.map((ritual) => renderRitualCard(ritual))}
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

