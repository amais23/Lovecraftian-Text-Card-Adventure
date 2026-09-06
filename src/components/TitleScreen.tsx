import React, { useState } from 'react';
import type { GameAction } from '../types/game';
import { soundEngine } from '../engine/audioManager';
import { TitleMenu } from './TitleMenu';
import { InvestigationManualModal } from './modals/InvestigationManualModal';
import { CardCompendium } from './CardCompendium';
import { SettingsModal } from './modals/SettingsModal';
import { ExitEasterEggModal } from './modals/ExitEasterEggModal';
import { AbyssBloodOverlay } from './AbyssBloodOverlay';
import { AbyssDeathScreen } from './AbyssDeathScreen';

interface TitleScreenProps {
  dispatch: React.Dispatch<GameAction>;
  onAbyssDeath?: () => void;
}

type ModalType = 'manual' | 'compendium' | 'settings' | 'exit' | null;

export const TitleScreen: React.FC<TitleScreenProps> = ({ dispatch, onAbyssDeath }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [abyssCount, setAbyssCount] = useState<number>(0);
  const [isDying, setIsDying] = useState<boolean>(false);
  const [isAbyssDead, setIsAbyssDead] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arkham_abyss_dead') === 'true';
    } catch {
      return false;
    }
  });

  const resetAbyss = () => {
    setAbyssCount(0);
  };

  const handleStartNewGame = () => {
    resetAbyss();
    soundEngine.playClick();
    dispatch({ type: 'START_NEW_INVESTIGATION' });
  };

  const handleOpenManual = () => {
    resetAbyss();
    setActiveModal('manual');
  };

  const handleOpenCompendium = () => {
    resetAbyss();
    setActiveModal('compendium');
  };

  const handleOpenSettings = () => {
    resetAbyss();
    setActiveModal('settings');
  };

  const handleOpenExit = () => {
    // Retain current abyssCount
    setActiveModal('exit');
  };

  const handleCloseModal = () => {
    // Dismissing via X or backdrop retains abyssCount
    setActiveModal(null);
  };

  const handleStruggle = () => {
    // Clicking struggle resets abyssCount to 0
    resetAbyss();
    soundEngine.playClick();
    setActiveModal(null);
  };

  const handleAbyssSubmit = () => {
    const nextCount = abyssCount + 1;
    setActiveModal(null);

    if (nextCount >= 5) {
      // 5th click: trigger permanent YOU DIED
      soundEngine.playCardPlay('madness');
      soundEngine.playDamage();
      soundEngine.playEndingEerieTension();
      setIsDying(true);

      try {
        localStorage.setItem('arkham_abyss_dead', 'true');
      } catch (e) {
        console.error('Failed to save abyss dead state', e);
      }

      setTimeout(() => {
        setIsAbyssDead(true);
        if (onAbyssDeath) {
          onAbyssDeath();
        }
      }, 400);
    } else {
      soundEngine.playCardPlay('madness');
      setAbyssCount(nextCount);
    }
  };

  if (isAbyssDead) {
    return <AbyssDeathScreen />;
  }

  // Determine blood stage:
  // count 2 -> stage 1
  // count 3 -> stage 2
  // count 4 -> stage 3
  const bloodStage = abyssCount >= 4 ? 3 : abyssCount === 3 ? 2 : abyssCount === 2 ? 1 : null;

  return (
    <div className={`title-screen-container ${isDying ? 'trauma-shake' : ''}`}>
      <TitleMenu
        onStartNewGame={handleStartNewGame}
        onOpenManual={handleOpenManual}
        onOpenCompendium={handleOpenCompendium}
        onOpenSettings={handleOpenSettings}
        onOpenExit={handleOpenExit}
      />

      {/* Blood Overlay for Stages 1 ~ 3 */}
      {bloodStage !== null && <AbyssBloodOverlay stage={bloodStage} />}

      {/* Auxiliary Modals */}
      <InvestigationManualModal
        isOpen={activeModal === 'manual'}
        onClose={handleCloseModal}
      />
      {activeModal === 'compendium' && (
        <CardCompendium onClose={handleCloseModal} />
      )}
      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={handleCloseModal}
      />
      <ExitEasterEggModal
        isOpen={activeModal === 'exit'}
        onClose={handleCloseModal}
        onSubmitAbyss={handleAbyssSubmit}
        onStruggle={handleStruggle}
      />
    </div>
  );
};
