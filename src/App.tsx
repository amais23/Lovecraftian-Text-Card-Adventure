import { useReducer } from 'react';
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

export function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialGameState());

  if (state.phase === 'title') {
    return <TitleScreen dispatch={dispatch} />;
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

  if (state.phase === 'reward') {
    return <RewardScreen state={state} dispatch={dispatch} />;
  }

  return <CombatScreen state={state} dispatch={dispatch} />;
}

export default App;
