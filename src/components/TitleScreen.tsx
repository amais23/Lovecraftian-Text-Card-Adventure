import React, { useState } from 'react';
import type { GameAction } from '../types/game';
import { soundEngine } from '../engine/audioManager';
import { TitleMenu } from './TitleMenu';
import { InvestigationManualModal } from './modals/InvestigationManualModal';
import { CardCompendiumModal } from './modals/CardCompendiumModal';
import { SettingsModal } from './modals/SettingsModal';
import { ExitEasterEggModal } from './modals/ExitEasterEggModal';

interface TitleScreenProps {
  dispatch: React.Dispatch<GameAction>;
}

type ModalType = 'manual' | 'compendium' | 'settings' | 'exit' | null;

export const TitleScreen: React.FC<TitleScreenProps> = ({ dispatch }) => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const handleStartNewGame = () => {
    soundEngine.playClick();
    dispatch({ type: 'START_NEW_INVESTIGATION' });
  };

  return (
    <>
      <TitleMenu
        onStartNewGame={handleStartNewGame}
        onOpenManual={() => setActiveModal('manual')}
        onOpenCompendium={() => setActiveModal('compendium')}
        onOpenSettings={() => setActiveModal('settings')}
        onOpenExit={() => setActiveModal('exit')}
      />

      {/* Auxiliary Modals */}
      <InvestigationManualModal
        isOpen={activeModal === 'manual'}
        onClose={() => setActiveModal(null)}
      />
      <CardCompendiumModal
        isOpen={activeModal === 'compendium'}
        onClose={() => setActiveModal(null)}
      />
      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
      />
      <ExitEasterEggModal
        isOpen={activeModal === 'exit'}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};
