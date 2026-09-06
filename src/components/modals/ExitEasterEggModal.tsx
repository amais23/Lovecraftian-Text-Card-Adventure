import React from 'react';
import { Skull, X, EyeOff, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../../engine/audioManager';
import { useModalDismiss } from '../../hooks/useModalDismiss';

interface ExitEasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExitEasterEggModal: React.FC<ExitEasterEggModalProps> = ({ isOpen, onClose }) => {
  const { handleBackdropClick, dismiss } = useModalDismiss({ isOpen, onClose });

  if (!isOpen) return null;

  const handleSubmitToAbyss = () => {
    soundEngine.playCardPlay('madness');
    onClose();
  };

  const handleStruggle = () => {
    soundEngine.playClick();
    onClose();
  };

  return (
    <div
      className="eldritch-modal-backdrop abyss-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="abyss-modal-title"
    >
      <div className="eldritch-modal-container abyss-modal-container">
        {/* Pulsing Eldritch Eye/Skull Header */}
        <div className="abyss-modal-header">
          <div className="abyss-modal-skull-badge">
            <Skull size={32} color="#ef4444" />
          </div>
          <button
            className="eldritch-modal-close-btn abyss-close-btn"
            onClick={dismiss}
            aria-label="關閉對話"
          >
            <X size={20} />
          </button>
        </div>

        {/* Abyss Text */}
        <div className="abyss-modal-body">
          <h2 id="abyss-modal-title" className="abyss-modal-title">
            深淵呢喃 · 無法逃離
          </h2>
          <p className="abyss-modal-subtitle">WHISPERS FROM THE BLACK SEAS OF INFINITY</p>

          <div className="abyss-quote-box">
            <p className="abyss-quote-line">
              「你以為你能就此抽身離開？
            </p>
            <p className="abyss-quote-line">
              阿卡姆的濃重迷霧早已封閉了所有向外的通道。在此地，所有門扉皆已被未知力量封死……唯一的歸途，唯有凝視深淵深處注視著你的眼睛。」
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="abyss-actions-row">
          <button
            id="abyss-struggle-btn"
            className="abyss-btn struggle"
            onClick={handleStruggle}
          >
            <ShieldAlert size={16} />
            <span>握緊理智 · 掙扎求生</span>
          </button>

          <button
            id="abyss-submit-btn"
            className="abyss-btn submit"
            onClick={handleSubmitToAbyss}
          >
            <EyeOff size={16} />
            <span>屈服並沉入深淵</span>
          </button>
        </div>
      </div>
    </div>
  );
};
