import { useState, useReducer, useEffect } from 'react';
import { gameReducer, createInitialGameState } from './engine/gameReducer';
import { TitleScreen } from './components/TitleScreen';
import { PrologueScreen } from './components/PrologueScreen';
import { OccupationSelect } from './components/OccupationSelect';
import { DepartureScreen } from './components/DepartureScreen';
import { MapScreen } from './components/MapScreen';
import { EventScreen } from './components/EventScreen';
import { SanctuaryScreen } from './components/SanctuaryScreen';
import { MarketScreen } from './components/MarketScreen';
import { CombatScreen } from './components/CombatScreen';
import { RewardScreen } from './components/RewardScreen';
import { DepthTransitionScreen } from './components/DepthTransitionScreen';
import { AbyssDeathScreen } from './components/AbyssDeathScreen';
import { AltarScreen } from './components/AltarScreen';
import { VaultScreen } from './components/VaultScreen';
import { BloodAltarScreen } from './components/BloodAltarScreen';
import { RemainsScreen } from './components/RemainsScreen';
import { CustomCursorAtmosphere } from './components/CustomCursorAtmosphere';
import { COMPLETE_ANCIENT_SEAL } from './engine/abyssalSeals';

export function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);

  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    (window as any).__DEBUG__ = {
      dispatch,
      state,
      COMPLETE_ANCIENT_SEAL,
    };
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const sanityState = state.isMadness ? 'madness' : 'normal';
      document.documentElement.dataset.sanityState = sanityState;
    }
  }, [state.isMadness]);

  const [isAbyssDead, setIsAbyssDead] = useState<boolean>(() => {
    try {
      return localStorage.getItem('arkham_abyss_dead') === 'true';
    } catch {
      return false;
    }
  });

  const renderScreen = () => {
    if (isAbyssDead) {
      return <AbyssDeathScreen />;
    }

    if (state.phase === 'title') {
      return <TitleScreen dispatch={dispatch} onAbyssDeath={() => setIsAbyssDead(true)} />;
    }

    if (state.phase === 'prologue') {
      return <PrologueScreen dispatch={dispatch} />;
    }

    if (state.phase === 'occupation_select') {
      return (
        <OccupationSelect
          onBackToMenu={() => dispatch({ type: 'RETURN_TO_TITLE' })}
          onSelectOccupation={(occupationId) =>
            dispatch({
              type: 'SELECT_OCCUPATION',
              payload: { occupationId, procedural: true },
            })
          }
        />
      );
    }

    if (state.phase === 'departure') {
      return <DepartureScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'map') {
      return <MapScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'event' || (state.phase === 'gameover' && state.currentEvent)) {
      return <EventScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'sanctuary') {
      return <SanctuaryScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'market') {
      return <MarketScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'altar') {
      return <AltarScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'vault') {
      return <VaultScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'blood_altar') {
      return <BloodAltarScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'remains') {
      return <RemainsScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'reward') {
      return <RewardScreen state={state} dispatch={dispatch} />;
    }

    if (state.phase === 'depth_transition') {
      return <DepthTransitionScreen state={state} dispatch={dispatch} />;
    }

    return <CombatScreen state={state} dispatch={dispatch} />;
  };

  return (
    <>
      <CustomCursorAtmosphere isMadness={Boolean(state.isMadness)} />
      {renderScreen()}
    </>
  );
}

export default App;


