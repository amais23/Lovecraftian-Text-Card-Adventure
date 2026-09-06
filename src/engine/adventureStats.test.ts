import { describe, it, expect } from 'vitest';
import {
  gameReducer,
  createInitialGameState,
  createInitialCombatState,
  ensureAdventureStats,
} from './gameReducer';
import type { GameState } from '../types/game';
import { generateInvestigationMap } from './mapGenerator';

describe('AdventureStats Tracking in gameReducer', () => {
  it('initializes adventureStats properly in createInitialGameState and createInitialCombatState', () => {
    const titleState = createInitialGameState();
    expect(titleState.adventureStats).toBeDefined();
    expect(titleState.adventureStats?.enemiesDefeated).toBe(0);
    expect(titleState.adventureStats?.nodesVisited).toBe(0);
    expect(titleState.adventureStats?.maxLayer).toBe(0);

    const combatState = createInitialCombatState();
    expect(combatState.adventureStats?.enemiesDefeated).toBe(0);
  });

  it('safely provides fallback defaults via ensureAdventureStats for legacy/partial states', () => {
    const partialState: Partial<GameState> = {
      investigator: {
        name: '測試調查員',
        occupation: '私家偵探',
        health: 20,
        maxHealth: 25,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 25,
      },
    };

    const stats = ensureAdventureStats(partialState);
    expect(stats.enemiesDefeated).toBe(0);
    expect(stats.totalObolsCollected).toBe(25);
    expect(stats.nodesVisited).toBe(0);
    expect(stats.maxLayer).toBe(0);
  });

  it('increments nodesVisited and updates maxLayer on NAVIGATE_TO_NODE', () => {
    const map = generateInvestigationMap();
    const entryNodeId = map.layers[0][0];

    const state: GameState = {
      ...createInitialCombatState(),
      phase: 'map',
      map,
      adventureStats: {
        enemiesDefeated: 0,
        totalObolsCollected: 10,
        nodesVisited: 0,
        maxLayer: 0,
      },
    };

    const nextState = gameReducer(state, {
      type: 'NAVIGATE_TO_NODE',
      payload: { nodeId: entryNodeId },
    });

    expect(nextState.adventureStats?.nodesVisited).toBe(1);
    expect(nextState.adventureStats?.maxLayer).toBe(map.nodes[entryNodeId].layer);
  });

  it('increments enemiesDefeated when a card play reduces enemy health to 0', () => {
    const combatState: GameState = {
      ...createInitialCombatState(),
      phase: 'combat',
      currentEnemy: {
        id: 'ghoul_weak',
        name: '殘弱食屍鬼',
        title: '墓穴異怪',
        health: 5,
        maxHealth: 20,
        armor: 0,
        currentIntent: { type: 'attack', value: 3, name: '撕咬', description: '' },
      },
      hand: [
        {
          id: 'card_strike_test',
          name: '精準射擊',
          category: 'combat',
          costType: 'stamina',
          costValue: 1,
          isTemporary: false,
          effects: [{ type: 'damage', value: 10 }],
          description: '造成 10 點傷害',
          flavorText: '',
        },
      ],
      adventureStats: {
        enemiesDefeated: 1,
        totalObolsCollected: 15,
        nodesVisited: 2,
        maxLayer: 1,
      },
    };

    const nextState = gameReducer(combatState, {
      type: 'PLAY_CARD',
      payload: { cardId: 'card_strike_test' },
    });

    expect(nextState.phase).toBe('victory');
    expect(nextState.adventureStats?.enemiesDefeated).toBe(2);
  });

  it('accumulates totalObolsCollected when claiming card rewards', () => {
    const rewardState: GameState = {
      ...createInitialCombatState(),
      phase: 'reward',
      rewardObols: 20,
      adventureStats: {
        enemiesDefeated: 1,
        totalObolsCollected: 30,
        nodesVisited: 1,
        maxLayer: 1,
      },
    };

    const nextState = gameReducer(rewardState, {
      type: 'CLAIM_CARD_REWARD',
    });

    expect(nextState.adventureStats?.totalObolsCollected).toBe(50);
  });
});
