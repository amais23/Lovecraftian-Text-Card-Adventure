import { useReducer } from 'react';
import { gameReducer, createInitialCombatState } from './engine/gameReducer';
import { CombatScreen } from './components/CombatScreen';

export function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createInitialCombatState());

  return <CombatScreen state={state} dispatch={dispatch} />;
}

export default App;
