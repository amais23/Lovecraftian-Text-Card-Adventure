import React from 'react';
import type { GameAction, GameState, Relic } from '../types/game';
import { Key, Coins, Sparkles, LogOut, Check, Shield, Watch, Heart, Disc, Skull, Flame } from 'lucide-react';
import { AudioToggle } from './AudioToggle';
import { soundEngine } from '../engine/audioManager';

interface VaultScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const RELIC_ICONS: Record<string, React.ReactNode> = {
  Shield: <Shield size={32} color="#74c69d" />,
  Watch: <Watch size={32} color="#ffd700" />,
  Heart: <Heart size={32} color="#ff4a6e" />,
  Disc: <Disc size={32} color="#b8c0ff" />,
  Skull: <Skull size={32} color="#ff758f" />,
  Flame: <Flame size={32} color="#e0a96d" />,
};

export const VaultScreen: React.FC<VaultScreenProps> = ({ state, dispatch }) => {
  const investigator = state.investigator;
  const relics = state.vaultRelics ?? [];
  const isClaimed = Boolean(state.vaultClaimed);
  const [isDesecrating, setIsDesecrating] = React.useState(false);
  const [selectedRelicIds, setSelectedRelicIds] = React.useState<string[]>([]);

  const handleClaimRelic = (relic: Relic) => {
    if (isClaimed) return;
    soundEngine.playClick();
    dispatch({
      type: 'CLAIM_VAULT_RELIC',
      payload: { relicId: relic.id },
    });
  };

  const handleToggleSelectRelic = (relicId: string) => {
    if (isClaimed) return;
    soundEngine.playClick();
    setSelectedRelicIds((prev) => {
      if (prev.includes(relicId)) {
        return prev.filter((id) => id !== relicId);
      }
      if (prev.length >= 2) return prev;
      return [...prev, relicId];
    });
  };

  const handleConfirmDesecrate = () => {
    if (isClaimed || selectedRelicIds.length !== 2) return;
    soundEngine.playClick();
    soundEngine.playCosmicBanishment();
    dispatch({
      type: 'CLAIM_VAULT_RELIC',
      payload: { relicIds: selectedRelicIds, desecrate: true },
    });
  };

  const handleClaimObols = () => {
    if (isClaimed) return;
    soundEngine.playClick();
    dispatch({
      type: 'CLAIM_VAULT_RELIC',
      payload: { claimObols: true },
    });
  };

  const handleLeave = () => {
    soundEngine.playClick();
    dispatch({ type: 'LEAVE_VAULT' });
  };

  return (
    <div className="vault-screen-container">
      <div className="vignette-overlay" />
      <div className="fog-layer" />

      <div className="vault-card-panel">
        <header className="vault-header">
          <div className="vault-header-top">
            <div className="vault-icon-badge">
              <Key size={36} color="#e0a96d" />
            </div>
            <div className="vault-header-actions">
              <div className="vault-obols-pill">
                <Coins size={20} color="#ffd700" />
                <span>持有古金幣: {investigator.obols} 枚</span>
              </div>
              <AudioToggle />
            </div>
          </div>
          <h1 className="vault-title">遺物秘閣 · 太古密藏</h1>
          <p className="vault-subtitle">
            厚重的青銅巨門之後，三件散發著超自然靈光的舊日遺物靜臥於石台上。凡人旅者可從中自主挑選 1 件納入行囊，或搜括暗格中的殘存古金幣；亦可鋌而走險破除古神封印強奪兩件遺物。
          </p>
        </header>

        {/* Status Strip */}
        <div className="vault-status-strip">
          <span className="vault-status-text">
            {isClaimed
              ? '已自秘閣中獲取寶物，請啟程離開'
              : isDesecrating
              ? '【破除古神封印模式】請在石台選取 2 件遺物，承受【深淵詛咒】強奪雙寶'
              : '自主挑選 1 件舊日遺物加入行囊，或拾取 35 枚古金幣，亦可破除古神封印'}
          </span>
          <span className="vault-current-relics-count">
            目前行囊已收納 {investigator.relics?.length ?? 0} 件遺物
          </span>
        </div>

        {/* 3 Relics Grid */}
        <div className="vault-relics-grid">
          {relics.map((relic) => {
            const isSelected = selectedRelicIds.includes(relic.id);
            const rarityLabel =
              relic.rarity === 'mythic' ? '神話' : relic.rarity === 'rare' ? '珍稀' : '普通';
            const rarityClass = `rarity-${relic.rarity}`;

            return (
              <div
                key={relic.id}
                id={`vault-relic-${relic.id}`}
                className={`vault-relic-card ${rarityClass} ${isClaimed ? 'disabled' : ''} ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => {
                  if (isDesecrating) {
                    handleToggleSelectRelic(relic.id);
                  } else {
                    handleClaimRelic(relic);
                  }
                }}
              >
                <div className="vault-relic-icon-wrap">
                  {RELIC_ICONS[relic.icon ?? ''] ?? <Sparkles size={32} color="#e0a96d" />}
                  <span className={`vault-relic-rarity-badge ${rarityClass}`}>
                    {rarityLabel}
                  </span>
                </div>

                <h3 className="vault-relic-name">{relic.name}</h3>
                <p className="vault-relic-desc">{relic.description}</p>
                <p className="vault-relic-flavor">「{relic.flavorText}」</p>

                <button
                  id={`vault-relic-btn-${relic.id}`}
                  className={`vault-claim-btn ${isSelected ? 'selected' : ''}`}
                  disabled={isClaimed}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isDesecrating) {
                      handleToggleSelectRelic(relic.id);
                    } else {
                      handleClaimRelic(relic);
                    }
                  }}
                >
                  {isClaimed ? (
                    <Check size={16} />
                  ) : isDesecrating ? (
                    isSelected ? (
                      <Check size={16} />
                    ) : (
                      <Key size={16} />
                    )
                  ) : (
                    <Key size={16} />
                  )}
                  <span>
                    {isClaimed
                      ? '已獲取'
                      : isDesecrating
                      ? isSelected
                        ? '已選取'
                        : '納入名額'
                      : '拾取此遺物'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Desecration Box */}
        <div className={`vault-desecration-box ${isDesecrating ? 'active' : ''}`} style={{
          background: 'rgba(255, 51, 75, 0.08)',
          border: '1px solid rgba(255, 51, 75, 0.3)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div className="vault-desecration-info" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <Skull size={32} color="#ff334b" />
            <div>
              <h4 className="vault-desecration-title" style={{ color: '#ff4a6e', margin: '0 0 4px 0', fontSize: '1.05rem' }}>
                破除古神封印 · 貪婪強奪雙遺物
              </h4>
              <p className="vault-desecration-desc" style={{ color: '#bbb', margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>
                強行撕開青銅神龕上的太古封印，一次性掠取其中 2 件舊日遺物！但深淵神祇的注視將化為無法打出的【深淵詛咒】黑色瘋狂卡，永久注入理智牌庫。
              </p>
              {isDesecrating && (
                <p style={{ color: '#ff758f', margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  目前已選取：{selectedRelicIds.length} / 2 件遺物
                </p>
              )}
            </div>
          </div>

          <div className="vault-desecration-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {!isDesecrating ? (
              <button
                id="vault-start-desecrate-btn"
                className="vault-desecrate-start-btn"
                disabled={isClaimed}
                onClick={() => {
                  soundEngine.playClick();
                  setIsDesecrating(true);
                }}
                style={{
                  background: 'rgba(255, 51, 75, 0.2)',
                  border: '1px solid #ff334b',
                  color: '#ff4a6e',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: isClaimed ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                破除古神封印
              </button>
            ) : (
              <>
                <button
                  id="vault-cancel-desecrate-btn"
                  className="vault-desecrate-cancel-btn"
                  disabled={isClaimed}
                  onClick={() => {
                    soundEngine.playClick();
                    setIsDesecrating(false);
                    setSelectedRelicIds([]);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ccc',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  id="vault-confirm-desecrate-btn"
                  className="vault-desecrate-confirm-btn"
                  disabled={isClaimed || selectedRelicIds.length !== 2}
                  onClick={handleConfirmDesecrate}
                  style={{
                    background: selectedRelicIds.length === 2 ? '#d90429' : 'rgba(217, 4, 41, 0.3)',
                    border: '1px solid #ff334b',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: selectedRelicIds.length === 2 && !isClaimed ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                  }}
                >
                  {isClaimed
                    ? '已完成破印'
                    : selectedRelicIds.length === 2
                    ? '確認破除封印 · 掠奪 2 件遺物（注入深淵詛咒）'
                    : `請挑選 2 件遺物（已選 ${selectedRelicIds.length}/2）`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Alternative Obols Box */}
        <div className="vault-alt-box">
          <div className="vault-alt-info">
            <Coins size={24} color="#ffd700" />
            <div>
              <h4 className="vault-alt-title">放棄遺物 · 搜括暗格古金幣</h4>
              <p className="vault-alt-desc">不願承擔遺物未知詛咒，轉而搜掠密閣夾層中存放的 35 枚古金幣。</p>
            </div>
          </div>
          <button
            id="vault-claim-obols-btn"
            className="vault-obols-claim-btn"
            disabled={isClaimed}
            onClick={handleClaimObols}
          >
            <Coins size={16} />
            <span>{isClaimed ? '已選擇' : '搜括 35 古金幣'}</span>
          </button>
        </div>

        {/* Footer */}
        <footer className="vault-footer">
          <button id="vault-leave-btn" className="vault-leave-btn" onClick={handleLeave}>
            <LogOut size={18} />
            <span>離開遺物秘閣</span>
          </button>
        </footer>
      </div>
    </div>
  );
};
