import React, { useState } from 'react';
import type { GameAction, GameState } from '../types/game';
import { Tent, Heart, Sparkles, LogOut, ShieldCheck, Flame, X, Check } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';
import { getAllPermanentCards } from '../engine/abyssalSeals';
import { getCardArtwork } from '../engine/cardArtworks';

interface SanctuaryScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const SanctuaryScreen: React.FC<SanctuaryScreenProps> = ({ state, dispatch }) => {
  const investigator = state.investigator;
  const isUsed = Boolean(state.sanctuaryUsed);
  const canAffordBandage = investigator.obols >= 5 || state.sanityDeck.length > 0;

  const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
  const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;
  const isMidDepthHaven = Boolean(currentNode?.layer === 8 && currentDepth <= 3);
  const healAmount = isMidDepthHaven ? 15 : 8;

  const permanentCards = getAllPermanentCards(state);
  const canPurge = !isUsed && permanentCards.length > 1;

  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [selectedPurgeCardId, setSelectedPurgeCardId] = useState<string | null>(null);

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

  const handleOpenPurge = () => {
    if (!canPurge) {
      soundEngine.playDeny();
      return;
    }
    soundEngine.playClick();
    setIsPurgeModalOpen(true);
  };

  const handleClosePurge = () => {
    soundEngine.playClick();
    setIsPurgeModalOpen(false);
    setSelectedPurgeCardId(null);
  };

  const handleConfirmPurge = () => {
    if (!selectedPurgeCardId || !canPurge) return;
    soundEngine.playClick();
    soundEngine.playCosmicBanishment();
    dispatch({
      type: 'USE_SANCTUARY',
      payload: { optionId: 'purge', cardId: selectedPurgeCardId },
    });
    setIsPurgeModalOpen(false);
    setSelectedPurgeCardId(null);
  };

  const handleLeave = () => {
    soundEngine.playClick();
    dispatch({ type: 'LEAVE_SANCTUARY' });
  };

  return (
    <div className="sanctuary-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className={`sanctuary-card-panel ${isMidDepthHaven ? 'haven-panel' : ''}`}>
        <header className="sanctuary-header">
          <div className="sanctuary-header-top">
            <div className={`sanctuary-icon-badge ${isMidDepthHaven ? 'haven-icon-badge' : ''}`}>
              {isMidDepthHaven ? <Sparkles size={36} color="#74c69d" /> : <Tent size={36} color="#74c69d" />}
            </div>
            <AudioToggle />
          </div>
          <h1 className="sanctuary-title">
            {isMidDepthHaven ? '【第 8 層中繼避難所 · 豐饒安全屋】' : '安全避難所 · 守墓人小屋'}
          </h1>
          <p className="sanctuary-subtitle">
            {isMidDepthHaven
              ? '你在漫長的調查長征中抵達了第 8 層豐饒中繼站。溫暖的爐火驅散了深淵徹骨的寒意，充足的醫藥與補給為你提供深層重度休整。'
              : '厚重的鐵栓阻絕了外界的瘋狂與低語。壁爐的餘火正噼啪作響，提供短暫的喘息與修整機會。'}
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
            <span>
              {isMidDepthHaven ? '中繼避難所重度休整：' : '避難所修整：'}
              {isUsed ? '本次已修整完畢' : '可選 1 項行動'}
            </span>
          </div>
        </div>

        {/* Resting Options */}
        <div className="sanctuary-options-grid">
          {/* Option 1: Bandage Flesh */}
          <div
            id="sanctuary-bandage-card"
            className={`sanctuary-option-card ${isUsed || investigator.health >= investigator.maxHealth || !canAffordBandage ? 'disabled' : ''} ${
              isMidDepthHaven ? 'haven-option-card' : ''
            }`}
            onClick={() => handleUseSanctuary('bandage')}
          >
            <div className="sanctuary-card-icon health">
              <Heart size={28} color="#ff334b" />
            </div>
            <h3 className="sanctuary-card-title">
              {isMidDepthHaven ? '深層重度休整與外科縫合' : '深層縫合與包紮'}
            </h3>
            <p className="sanctuary-card-desc">
              {isMidDepthHaven
                ? `在安全屋中運用充裕的無菌藥品與高級敷料。消耗 5 枚古金幣購置急救補給；若古金幣不足，忍受劇痛損耗 1 點理智。深層重度縫合恢復 ${healAmount} 點肉體生命值（上限 25 點）。`
                : `在凡人極限下清洗撕裂的傷口並重新敷藥。消耗 5 枚古金幣購置急救藥品；若古金幣不足，將忍受劇痛損耗 1 點理智完成自救。恢復 ${healAmount} 點肉體生命值（上限 25 點）。`}
            </p>
            <button
              id="sanctuary-bandage-btn"
              className="sanctuary-action-btn"
              disabled={isUsed || investigator.health >= investigator.maxHealth || !canAffordBandage}
            >
              {isUsed
                ? '本次已修整完畢'
                : investigator.health >= investigator.maxHealth
                ? '生命值已滿'
                : !canAffordBandage
                ? '代價不足 · 需 5 古金幣或 1 理智'
                : investigator.obols >= 5
                ? isMidDepthHaven
                  ? '執行重度休整 · 耗 5 古金幣'
                  : '執行包紮 · 耗 5 古金幣'
                : isMidDepthHaven
                ? '強行重度包紮 · 耗 1 理智'
                : '強行包紮 · 耗 1 理智'}
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
              {isUsed ? '已完成冥想' : '進行冥想 · 納入真相卡'}
            </button>
          </div>

          {/* Option 3: Hearth Purge */}
          <div
            id="sanctuary-purge-card"
            className={`sanctuary-option-card ${isUsed || !canPurge ? 'disabled' : ''}`}
            onClick={handleOpenPurge}
          >
            <div className="sanctuary-card-icon purge">
              <Flame size={28} color="#e63946" />
            </div>
            <h3 className="sanctuary-card-title">壁爐除役與雜質焚毀</h3>
            <p className="sanctuary-card-desc">
              將一張多餘或負面的雜質卡牌投入壁爐熊熊餘火之中，將其自理智牌庫中永久焚毀除役，使心神更為專注精純。
            </p>
            <button
              id="sanctuary-purge-btn"
              className="sanctuary-action-btn"
              disabled={isUsed || !canPurge}
              onClick={handleOpenPurge}
            >
              {isUsed
                ? '已完成修整'
                : !canPurge
                ? '牌庫過少無法除役'
                : '投入壁爐焚毀 · 除役 1 卡'}
            </button>
          </div>
        </div>

        {/* Purge Card Selection Modal */}
        {isPurgeModalOpen && (
          <div className="market-purge-modal-overlay">
            <div className="market-purge-modal-card">
              <div className="market-purge-modal-header">
                <div className="market-purge-modal-title-row">
                  <Flame size={24} color="#e63946" />
                  <h3 className="market-purge-modal-title">壁爐除役 · 選擇要焚毀的卡牌</h3>
                </div>
                <button
                  className="market-purge-close-btn"
                  onClick={handleClosePurge}
                  aria-label="關閉"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="market-purge-modal-desc">
                請自目前牌庫中選取 1 張卡牌投入壁爐餘火中永久燒毀。此操作無法逆轉。
              </p>

              <div className="market-purge-cards-scroll">
                <div className="market-purge-cards-grid">
                  {permanentCards.map((card) => {
                    const isSelected = selectedPurgeCardId === card.id;
                    const artwork = getCardArtwork(card);
                    const categoryColor =
                      card.category === 'combat'
                        ? '#e63946'
                        : card.category === 'skill'
                        ? '#ffd700'
                        : card.category === 'magic'
                        ? '#9d4edd'
                        : card.category === 'truth'
                        ? '#48cae4'
                        : '#ff0055';

                    return (
                      <div
                        key={card.id}
                        id={`sanctuary-purge-card-${card.id}`}
                        className={`market-purge-card-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          soundEngine.playClick();
                          setSelectedPurgeCardId((prev) => (prev === card.id ? null : card.id));
                        }}
                      >
                        <div className="market-purge-card-checkbox">
                          {isSelected ? <Check size={16} color="#fff" /> : null}
                        </div>

                        <div className="market-purge-card-top">
                          <span
                            className="market-purge-card-badge"
                            style={{ borderColor: categoryColor, color: categoryColor }}
                          >
                            {card.category === 'combat'
                              ? '戰鬥'
                              : card.category === 'skill'
                              ? '技能'
                              : card.category === 'magic'
                              ? '魔法'
                              : card.category === 'truth'
                              ? '真相'
                              : '瘋狂'}
                          </span>
                          <span className="market-purge-card-cost">
                            {card.costType === 'stamina'
                              ? `${card.costValue} 精力`
                              : card.costType === 'sanity'
                              ? `${card.costValue} 理智`
                              : '無耗費'}
                          </span>
                        </div>

                        {artwork.imageUrl && (
                          <div className="market-purge-card-art-frame">
                            <img
                              src={artwork.imageUrl}
                              alt={card.name}
                              className="market-purge-card-art"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <h4 className="market-purge-card-name">{card.name}</h4>
                        <p className="market-purge-card-desc">{card.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="market-purge-modal-footer">
                <button className="market-purge-cancel-btn" onClick={handleClosePurge}>
                  取消
                </button>
                <button
                  id="sanctuary-confirm-purge-btn"
                  className="market-purge-confirm-btn"
                  disabled={!selectedPurgeCardId || !canPurge}
                  onClick={handleConfirmPurge}
                >
                  <Flame size={16} />
                  <span>
                    {selectedPurgeCardId
                      ? '確認投入壁爐除役'
                      : '請先點選 1 張欲除役卡牌'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

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
