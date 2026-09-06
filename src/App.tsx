import { useReducer } from 'react';
import { gameReducer, createInitialGameState } from './engine/gameReducer';
import { TitleScreen } from './components/TitleScreen';
import { CombatScreen } from './components/CombatScreen';
import { RewardScreen } from './components/RewardScreen';

export function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialGameState());

  if (state.phase === 'title') {
    return <TitleScreen state={state} dispatch={dispatch} />;
  }

  if (state.phase === 'reward') {
    return <RewardScreen state={state} dispatch={dispatch} />;
  }

  return <CombatScreen state={state} dispatch={dispatch} />;
}

export default App;
