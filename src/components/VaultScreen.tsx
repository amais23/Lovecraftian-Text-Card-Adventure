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

  const handleClaimRelic = (relic: Relic) => {
    if (isClaimed) return;
    soundEngine.playClick();
    dispatch({
      type: 'CLAIM_VAULT_RELIC',
      payload: { relicId: relic.id },
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
            厚重的青銅巨門之後，三件散發著超自然靈光的舊日遺物靜臥於石台上。凡人旅者可從中自主挑選 1 件納入行囊，或搜括暗格中的殘存古金幣。
          </p>
        </header>

        {/* Status Strip */}
        <div className="vault-status-strip">
          <span className="vault-status-text">
            {isClaimed
              ? '已自秘閣中獲取寶物，請啟程離開'
              : '自主挑選 1 件舊日遺物加入行囊，或拾取 35 枚古金幣'}
          </span>
          <span className="vault-current-relics-count">
            目前行囊已收納 {investigator.relics?.length ?? 0} 件遺物
          </span>
        </div>

        {/* 3 Relics Grid */}
        <div className="vault-relics-grid">
          {relics.map((relic) => {
            const rarityLabel =
              relic.rarity === 'mythic' ? '神話' : relic.rarity === 'rare' ? '珍稀' : '普通';
            const rarityClass = `rarity-${relic.rarity}`;

            return (
              <div
                key={relic.id}
                id={`vault-relic-${relic.id}`}
                className={`vault-relic-card ${rarityClass} ${isClaimed ? 'disabled' : ''}`}
                onClick={() => handleClaimRelic(relic)}
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
                  className="vault-claim-btn"
                  disabled={isClaimed}
                >
                  {isClaimed ? <Check size={16} /> : <Key size={16} />}
                  <span>{isClaimed ? '已獲取' : '拾取此遺物'}</span>
                </button>
              </div>
            );
          })}
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
