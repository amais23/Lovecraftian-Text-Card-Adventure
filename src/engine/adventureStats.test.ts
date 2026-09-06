import { describe, it, expect } from 'vitest';
import {
  gameReducer,
  createInitialGameState,
  createInitialCombatState,
  ensureAdventureStats,
  createInitialAdventureStats,
  getPermanentDeckCount,
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

  it('preserves adventureStats when RESET_COMBAT is dispatched (Retry Combat)', () => {
    const deadState: GameState = {
      ...createInitialCombatState(),
      phase: 'gameover',
      adventureStats: {
        enemiesDefeated: 4,
        totalObolsCollected: 75,
        nodesVisited: 6,
        maxLayer: 3,
      },
    };

    const retriedState = gameReducer(deadState, {
      type: 'RESET_COMBAT',
    });

    expect(retriedState.phase).toBe('combat');
    expect(retriedState.adventureStats).toBeDefined();
    expect(retriedState.adventureStats?.enemiesDefeated).toBe(4);
    expect(retriedState.adventureStats?.totalObolsCollected).toBe(75);
    expect(retriedState.adventureStats?.nodesVisited).toBe(6);
    expect(retriedState.adventureStats?.maxLayer).toBe(3);
  });

  it('preserves and accumulates totalObolsCollected on peaceful EVENT_CHOICE', () => {
    const eventState: GameState = {
      ...createInitialCombatState(),
      phase: 'event',
      investigator: {
        ...createInitialCombatState().investigator,
        health: 20,
        obols: 10,
      },
      adventureStats: {
        enemiesDefeated: 1,
        totalObolsCollected: 25,
        nodesVisited: 3,
        maxLayer: 2,
      },
      currentEvent: {
        id: 'test_event',
        title: '拾獲古金幣',
        location: '幽暗小徑',
        storyText: ['在碎石瓦礫中發現一枚古老鑄幣。'],
        options: [
          {
            id: 'take_coin',
            text: '拾起金幣',
            consequences: [
              {
                type: 'gain_obols',
                value: 15,
                narrative: '獲得了 15 枚古金幣！',
              },
            ],
          },
        ],
      },
    };

    const nextState = gameReducer(eventState, {
      type: 'RESOLVE_EVENT_OPTION',
      payload: { optionId: 'take_coin' },
    });

    expect(nextState.phase).toBe('event');
    expect(nextState.investigator.obols).toBe(25);
    expect(nextState.adventureStats?.totalObolsCollected).toBe(40);
  });

  it('initializes default stats properly via createInitialAdventureStats', () => {
    const stats = createInitialAdventureStats({ obols: 35 });
    expect(stats.enemiesDefeated).toBe(0);
    expect(stats.totalObolsCollected).toBe(35);
    expect(stats.nodesVisited).toBe(0);
    expect(stats.maxLayer).toBe(0);
  });

  it('correctly calculates permanent deck capacity ignoring temporary cards via getPermanentDeckCount', () => {
    const state = {
      sanityDeck: [
        { id: 'c1', name: '槍擊', category: 'combat', costType: 'stamina', costValue: 1, isTemporary: false, effects: [], description: '', flavorText: '' },
        { id: 'c2', name: '瘋狂', category: 'madness', costType: 'stamina', costValue: 0, isTemporary: true, effects: [], description: '', flavorText: '' },
      ] as any,
      hand: [
        { id: 'c3', name: '格擋', category: 'skill', costType: 'stamina', costValue: 1, isTemporary: false, effects: [], description: '', flavorText: '' },
      ] as any,
      discardPile: [
        { id: 'c4', name: '秘法', category: 'magic', costType: 'sanity', costValue: 1, isTemporary: false, effects: [], description: '', flavorText: '' },
        { id: 'c5', name: '臨時真相', category: 'truth', costType: 'stamina', costValue: 1, isTemporary: true, effects: [], description: '', flavorText: '' },
      ] as any,
    };

    const count = getPermanentDeckCount(state);
    expect(count).toBe(3); // c1, c3, c4
  });
});
