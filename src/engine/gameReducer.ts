import type {
  AdventureStats,
  Card,
  DepthLevel,
  Enemy,
  GameAction,
  GameState,
  Investigator,
  InvestigationMap,
  MapNode,
  MythosEvent,
} from '../types/game';
import {
  INITIAL_GHOUL,
  OCCUPATIONS,
} from './initialData';
import {
  cloneEnemy,
  getEncounterEnemy,
  getEnemyTemplateById,
  getBossByDepth,
} from './enemyCatalog';
import {
  ensureUniqueCardIds,
} from './cardFactory';
import {
  generateInvestigationMap,
  generateProceduralInvestigationMap,
  advanceMapAfterNode,
} from './mapGenerator';
import {
  getMythosEvent,
} from './eventData';
import {
  hasBothAbyssalFragments,
  getAllPermanentCards,
} from './abyssalSeals';
import {
  evaluateCardPlay,
  evaluateMadnessTransition,
  applyDamage,
  type CardPlayContext,
  type DamageResult,
} from './cards';
import { applyRelicCombatStart, applyRelicToInvestigator } from './relics';
import {
  resolveNodeEntry,
  resolveNodeInteraction,
  resolveNodeLeave,
  type NodeActionResult,
} from './nodes';
import {
  clearFallenInvestigator,
  getFallenInvestigator,
  saveFallenInvestigatorFromState,
} from './nodes/remainsStorage';
import {
  resolveCombatTurnEnd,
  initializeCombatSession,
  splitDeckToHandAndSanity,
  setupCombatDeck,
  DEFAULT_HAND_CAPACITY,
} from './combat';
import { addStatusEffect } from './statusEffects';
import {
  generateCombatReward,
  resolveSurvivalSettlement,
  type SurvivalSettlementContext,
  type SurvivalSettlementResult,
} from './survival';

export {
  cloneEnemy,
  ensureUniqueCardIds,
  splitDeckToHandAndSanity,
  setupCombatDeck,
  DEFAULT_HAND_CAPACITY,
  advanceMapAfterNode,
};


/**
 * 取得敵人初始模板以利於戰鬥重整 (Reset Combat) 重新迎戰原敵人
 */
export function getFreshEnemyTemplate(candidate?: Enemy, map?: InvestigationMap, depth: DepthLevel = 1): Enemy {
  const currentDepth = depth ?? map?.depth ?? 1;
  const enemyId = candidate?.id;
  if (enemyId) {
    const template = getEnemyTemplateById(enemyId);
    if (template) {
      return template;
    }
  }

  // If node type from map is available
  if (map?.currentNodeId && map.nodes[map.currentNodeId]) {
    const node = map.nodes[map.currentNodeId];
    if (node.enemyId) {
      const template = getEnemyTemplateById(node.enemyId);
      if (template) return template;
    }
    if (node.type === 'elite') return getEncounterEnemy(currentDepth, 'elite');
    if (node.type === 'boss') return getBossByDepth(currentDepth);
    if (node.type === 'combat') return getEncounterEnemy(currentDepth, 'combat');
  }

  if (candidate) {
    return {
      ...candidate,
      health: candidate.maxHealth,
      armor: candidate.armor,
      statusEffects: [],
      currentIntentIndex: 0,
      currentIntent: candidate.intentSequence?.[0] ?? candidate.currentIntent,
    };
  }

  return getEncounterEnemy(currentDepth, 'combat');
}

export {
  evaluateMadnessTransition,
  applyDamage,
  type DamageResult,
};

export function createInitialAdventureStats(
  investigator?: Partial<Investigator>,
  map?: InvestigationMap
): AdventureStats {
  return {
    enemiesDefeated: 0,
    totalObolsCollected: investigator?.obols ?? 0,
    nodesVisited: 0,
    maxLayer: map?.nodes?.[map?.currentNodeId ?? '']?.layer ?? 0,
  };
}

export function ensureAdventureStats(state: Partial<GameState>): AdventureStats {
  return state.adventureStats ?? createInitialAdventureStats(state.investigator, state.map);
}

function applyNodeActionResult(
  state: GameState,
  result: NodeActionResult,
  extraCleans?: Partial<GameState>
): GameState {
  if (!result.success) {
    return result.logs.length > 0
      ? { ...state, battleLog: [...result.logs, ...state.battleLog] }
      : state;
  }
  const currentStats = ensureAdventureStats(state);
  return {
    ...state,
    investigator: result.investigator,
    sanityDeck: result.sanityDeck,
    ...extraCleans,
    ...result.nodeStateUpdates,
    adventureStats: result.adventureStatsUpdate
      ? { ...currentStats, ...result.adventureStatsUpdate }
      : currentStats,
    battleLog: result.logs.concat(state.battleLog),
  };
}

export function getPermanentDeckCount(state: {
  sanityDeck?: Card[];
  hand?: Card[];
  discardPile?: Card[];
}): number {
  return [
    ...(state.sanityDeck ?? []),
    ...(state.hand ?? []),
    ...(state.discardPile ?? []),
  ].filter((c) => !c.isTemporary).length;
}

export function createInitialCombatState(
  customEnemy?: Enemy,
  customDeck?: Card[],
  customInvestigator?: Investigator,
  initialPhase: GameState['phase'] = 'combat'
): GameState {
  const initResult = initializeCombatSession({
    enemy: customEnemy,
    deck: customDeck,
    investigator: customInvestigator,
  });

  return {
    phase: initialPhase,
    currentDepth: 1,
    turn: initResult.turn,
    investigator: initResult.investigator,
    sanityDeck: initResult.sanityDeck,
    hand: initResult.hand,
    discardPile: initResult.discardPile,
    exhaustPile: initResult.exhaustPile,
    isMadness: initResult.isMadness,
    currentEnemy: initResult.enemy,
    lastCombatEnemyId: initResult.enemy?.id,
    adventureStats: createInitialAdventureStats(initResult.investigator),
    battleLog: initResult.logs,
    combatInitialHealth: initResult.investigator.health,
    cardsPlayedThisTurn: 0,
    visitedEventIds: [],
  };
}

/**
 * 戰鬥回合結束結算純函式：委託 combat/turnResolver 進行深層結算，並處理全域遊戲存檔與統計副作用
 */
export function resolveTurnEndAndFixedDraw(
  state: GameState,
  remainingHand: Card[],
  initialLogs: string[] = []
): GameState {
  const result = resolveCombatTurnEnd({
    investigator: state.investigator,
    enemy: state.currentEnemy,
    turn: state.turn,
    retainedHand: remainingHand,
    sanityDeck: state.sanityDeck,
    discardPile: state.discardPile,
    exhaustPile: state.exhaustPile,
    isMadness: state.isMadness,
    initialLogs,
    cardsPlayedThisTurn: state.cardsPlayedThisTurn ?? 0,
    handCapacity: state.investigator.handCapacity,
  });

  if (result.outcome === 'defeat') {
    const gameoverState: GameState = {
      ...state,
      phase: 'gameover',
      hand: result.hand,
      sanityDeck: result.sanityDeck,
      discardPile: result.discardPile,
      exhaustPile: result.exhaustPile,
      discardPhase: undefined,
      adventureStats: ensureAdventureStats(state),
      investigator: result.investigator,
      battleLog: [...result.logs, ...state.battleLog],
    };
    saveFallenInvestigatorFromState(gameoverState, `遭${state.currentEnemy.name}擊殺殞命`);
    return gameoverState;
  }

  if (result.outcome === 'victory') {
    const stats = ensureAdventureStats(state);
    return {
      ...state,
      phase: 'victory',
      discardPhase: undefined,
      investigator: result.investigator,
      currentEnemy: result.enemy,
      adventureStats: {
        ...stats,
        enemiesDefeated: stats.enemiesDefeated + 1,
      },
      battleLog: [...result.logs, ...state.battleLog],
    };
  }

  return {
    ...state,
    turn: result.turn,
    discardPhase: undefined,
    cardsPlayedThisTurn: result.cardsPlayedThisTurn,
    investigator: result.investigator,
    sanityDeck: result.sanityDeck,
    hand: result.hand,
    discardPile: result.discardPile,
    exhaustPile: result.exhaustPile,
    isMadness: result.isMadness,
    currentEnemy: result.enemy,
    battleLog: [...result.logs, ...state.battleLog],
  };
}

/**
 * 執行手牌棄置並推進回合結算之共用純函式（消除重複代碼）
 */
export function executeCardDiscardAndAdvanceTurn(
  state: GameState,
  cardIdsToDiscard: string[],
  requiredDiscardCount: number
): GameState {
  if (cardIdsToDiscard.length !== requiredDiscardCount) {
    return state;
  }

  const validDiscardCards = state.hand.filter((c) => cardIdsToDiscard.includes(c.id));
  if (validDiscardCards.length !== requiredDiscardCount) {
    return state;
  }

  const remainingHand = state.hand.filter((c) => !cardIdsToDiscard.includes(c.id));
  const newDiscardPile = [
    ...state.discardPile,
    ...validDiscardCards.filter((c) => !c.isTemporary),
  ];

  const discardLog =
    requiredDiscardCount > 0
      ? `【主動棄牌】調查員棄置了 ${validDiscardCards.map((c) => `【${c.name}】`).join('、')}。剩餘 ${remainingHand.length} 張手牌予以保留。`
      : undefined;

  return resolveTurnEndAndFixedDraw(
    { ...state, discardPile: newDiscardPile, discardPhase: undefined },
    remainingHand,
    discardLog ? [discardLog] : []
  );
}

/**
 * 將生存結算產出套用至全域 GameState，統一處理古金幣累加與殉職紀錄實體清理等副作用
 */
export function applySurvivalSettlementResult(
  state: GameState,
  result: SurvivalSettlementResult
): GameState {
  if (result.clearFallenRecord) {
    clearFallenInvestigator();
  }

  const currentStats = ensureAdventureStats(state);
  const updatedStats: AdventureStats = {
    ...currentStats,
    totalObolsCollected: currentStats.totalObolsCollected + result.addedObols,
  };

  return {
    ...state,
    phase: result.nextPhase,
    isTrueEnding: Boolean(state.isTrueEnding || result.isTrueEnding),
    turn: 1,
    investigator: result.investigator,
    sanityDeck: result.sanityDeck,
    hand: result.hand,
    discardPile: result.discardPile,
    isMadness: false,
    rewardCards: undefined,
    rewardObols: undefined,
    currentEnemy: cloneEnemy(INITIAL_GHOUL),
    map: result.map,
    adventureStats: updatedStats,
    battleLog: [...result.logs, ...state.battleLog],
    combatInitialHealth: undefined,
  };
}

export function createInitialGameState(): GameState {
  return createInitialCombatState(undefined, undefined, undefined, 'title');
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_NEW_INVESTIGATION': {
      return {
        ...createInitialGameState(),
        phase: 'prologue',
        currentDepth: 1,
        lastCombatEnemyId: undefined,
        visitedEventIds: [],
        battleLog: [
          '【調查啟程 · 序章引導】翻開 1920 年代阿卡姆失蹤懸案剪報與神秘委託密信，深淵的呼喚隱隱傳來……',
        ],
      };
    }

    case 'COMPLETE_PROLOGUE': {
      return {
        ...state,
        phase: 'occupation_select',
        battleLog: [
          '【調查員集結】請在命運的十字路口，挑選本次深入阿卡姆的調查員身份。',
          ...state.battleLog,
        ],
      };
    }

    case 'COMPLETE_DEPARTURE': {
      return {
        ...state,
        phase: 'map',
        battleLog: [
          `【啟程赴險】調查員 ${state.investigator.name} 踏入阿卡姆的濃重迷霧，展開調查地圖！`,
          ...state.battleLog,
        ],
      };
    }

    case 'SELECT_OCCUPATION': {
      const occ = OCCUPATIONS[action.payload.occupationId] ?? OCCUPATIONS.investigator;
      const investigator: Investigator = {
        name: occ.name,
        occupation: occ.occupation,
        occupationId: occ.id,
        health: occ.stats.health,
        maxHealth: occ.stats.health,
        stamina: occ.stats.stamina,
        maxStamina: occ.stats.stamina,
        armor: 0,
        obols: occ.stats.obols,
        handCapacity: occ.stats.handCapacity ?? DEFAULT_HAND_CAPACITY,
      };
      const allCards = ensureUniqueCardIds(occ.deck.map((c) => ({ ...c })));
      const { hand, sanityDeck } = splitDeckToHandAndSanity(allCards, investigator.handCapacity);
      const enemy = cloneEnemy(INITIAL_GHOUL);
      const map = action.payload.map ?? (action.payload.procedural ? generateProceduralInvestigationMap({ depth: 1, procedural: true }) : generateInvestigationMap({ depth: 1 }));
      const defaultPhase = state.phase === 'occupation_select' ? 'departure' : 'map';
      const nextPhase = action.payload.initialPhase ?? defaultPhase;

      const logMsg = nextPhase === 'departure'
        ? `【確認身份】調查員 ${investigator.name}（${investigator.occupation}）整裝待發，準備啟程！`
        : `【踏入黑暗】調查員 ${investigator.name}（${investigator.occupation}）抵達阿卡姆封鎖區！請在調查地圖中挑選啟程路線。`;

      return {
        phase: nextPhase,
        currentDepth: 1,
        turn: 1,
        investigator,
        sanityDeck,
        hand,
        discardPile: [],
        isMadness: false,
        currentEnemy: enemy,
        lastCombatEnemyId: undefined,
        map,
        visitedEventIds: [],
        adventureStats: createInitialAdventureStats(investigator, map),
        battleLog: [logMsg, ...state.battleLog],
      };
    }

    case 'NAVIGATE_TO_NODE': {
      if (!state.map) return state;
      const targetNode = state.map.nodes[action.payload.nodeId];
      if (!targetNode || targetNode.status !== 'accessible') return state;

      const updatedNodes: Record<string, MapNode> = {};
      for (const [id, node] of Object.entries(state.map.nodes)) {
        if (id === targetNode.id) {
          updatedNodes[id] = { ...node, status: 'current' };
        } else if (node.status === 'current') {
          updatedNodes[id] = { ...node, status: 'visited' };
        } else if (node.status === 'accessible') {
          updatedNodes[id] = { ...node, status: 'unvisited' };
        } else {
          updatedNodes[id] = { ...node };
        }
      }

      const updatedMap: InvestigationMap = {
        ...state.map,
        nodes: updatedNodes,
        currentNodeId: targetNode.id,
      };

      const currentStats = ensureAdventureStats(state);
      const updatedStats: AdventureStats = {
        ...currentStats,
        nodesVisited: currentStats.nodesVisited + 1,
        maxLayer: Math.max(currentStats.maxLayer, targetNode.layer),
      };

      if (targetNode.type === 'combat' || targetNode.type === 'elite' || targetNode.type === 'boss') {
        let enemy: Enemy;
        let logMsg: string;

        const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;

        const encounterType = targetNode.type;
        const fallbackEnemy = () =>
          getEncounterEnemy(currentDepth, encounterType, Math.random, state.lastCombatEnemyId);

        if (action.payload.enemy) {
          enemy = cloneEnemy(action.payload.enemy);
        } else if (
          targetNode.enemyId &&
          (targetNode.type === 'boss' || !state.lastCombatEnemyId || targetNode.enemyId !== state.lastCombatEnemyId)
        ) {
          enemy = getEnemyTemplateById(targetNode.enemyId) ?? fallbackEnemy();
        } else {
          enemy = fallbackEnemy();
        }

        updatedNodes[targetNode.id] = {
          ...targetNode,
          status: 'current',
          enemyId: enemy.id,
        };

        if (targetNode.type === 'boss') {
          logMsg = `踏入【${targetNode.title}】！終局宿敵降臨：${enemy.name}（${enemy.title}）！`;
        } else if (targetNode.type === 'elite') {
          logMsg = `探索【${targetNode.title}】！遭遇舊日精英敵人：${enemy.name}（${enemy.title}）！`;
        } else {
          logMsg = `探索【${targetNode.title}】！遭遇常規敵人：${enemy.name}（${enemy.title}）。`;
        }

        const currentCards = [
          ...state.sanityDeck,
          ...state.hand,
          ...state.discardPile,
        ];
        const handCapacity = state.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
        const { hand, sanityDeck } = setupCombatDeck(
          currentCards,
          state.investigator.occupationId ?? 'investigator',
          action.payload.shuffledDeck,
          handCapacity
        );

        const relicStart = applyRelicCombatStart({
          armor: 0,
          relics: state.investigator.relics,
          maxStamina: state.investigator.maxStamina,
        });

        return {
          ...state,
          phase: 'combat',
          lastCombatEnemyId: enemy.id,
          turn: 1,
          investigator: {
            ...state.investigator,
            armor: relicStart.armor,
            stamina: relicStart.stamina,
            statusEffects: relicStart.statusEffects,
          },
          sanityDeck,
          hand,
          discardPile: [],
          isMadness: false,
          map: updatedMap,
          currentEnemy: {
            ...enemy,
            statusEffects: [],
          },
          adventureStats: updatedStats,
          battleLog: [logMsg, ...relicStart.logs, ...state.battleLog],
          combatInitialHealth: state.investigator.health,
          cardsPlayedThisTurn: 0,
        };
      }

      if (targetNode.type === 'event') {
        const depth = state.currentDepth ?? state.map?.depth ?? 1;
        const event = getMythosEvent(depth, state.visitedEventIds ?? []);
        const updatedVisitedEventIds = [...(state.visitedEventIds ?? []), event.id];
        return {
          ...state,
          phase: 'event',
          map: updatedMap,
          currentEvent: event,
          visitedEventIds: updatedVisitedEventIds,
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！觸發秘識奇遇【${event.title}】。`,
            ...state.battleLog,
          ],
        };
      }

      if (['sanctuary', 'market', 'altar', 'vault', 'blood_altar', 'remains'].includes(targetNode.type)) {
        const entryResult = resolveNodeEntry(targetNode, {
          depth: state.currentDepth ?? state.map?.depth ?? 1,
          occupationId: state.investigator.occupationId,
          investigatorRelicIds: (state.investigator.relics ?? []).map((r) => r.id),
          fallenInvestigator: targetNode.type === 'remains' ? getFallenInvestigator() : undefined,
        });
        return {
          ...state,
          ...entryResult.nodeStateUpdates,
          map: updatedMap,
          adventureStats: updatedStats,
          battleLog: [
            entryResult.log,
            ...state.battleLog,
          ],
        };
      }

      return state;
    }

    case 'RESOLVE_EVENT_OPTION': {
      if (state.phase !== 'event' || !state.currentEvent) return state;
      const option = state.currentEvent.options.find((opt) => opt.id === action.payload.optionId);
      if (!option) return state;

      if (option.requires?.obols && state.investigator.obols < option.requires.obols) {
        return {
          ...state,
          battleLog: [`古金幣不足！此抉擇需要 ${option.requires.obols} 枚古金幣。`, ...state.battleLog],
        };
      }

      let currentInvestigator: Investigator = { ...state.investigator };
      let newSanityDeck = [...state.sanityDeck];
      let newDiscardPile = [...state.discardPile];
      const newHand = [...state.hand];
      let triggerCombatEnemy: Enemy | undefined;
      const outcomeTexts: string[] = [];

      for (const consequence of option.consequences) {
        outcomeTexts.push(consequence.narrative);
        if (consequence.type === 'health_change' && consequence.value !== undefined) {
          currentInvestigator.health = Math.max(0, Math.min(currentInvestigator.maxHealth, currentInvestigator.health + consequence.value));
        } else if (consequence.type === 'gain_obols' && consequence.value !== undefined) {
          currentInvestigator.obols = Math.max(0, currentInvestigator.obols + consequence.value);
        } else if (consequence.type === 'sanity_change' && consequence.value !== undefined) {
          if (consequence.value < 0) {
            const burnCount = Math.min(newSanityDeck.length, Math.abs(consequence.value));
            newSanityDeck = newSanityDeck.slice(burnCount);
          } else if (consequence.value > 0) {
            let deficit = consequence.value;
            if (newDiscardPile.length > 0) {
              const recoverCount = Math.min(newDiscardPile.length, deficit);
              const recovered = newDiscardPile.splice(0, recoverCount);
              newSanityDeck = [...newSanityDeck, ...recovered];
              deficit -= recoverCount;
            }
            for (let i = 0; i < deficit; i++) {
              newSanityDeck.push({
                id: `event_truth_restored_${newSanityDeck.length + 1}`,
                name: '心靈澄澈',
                category: 'truth',
                costType: 'stamina',
                costValue: 1,
                isTemporary: false,
                effects: [{ type: 'add_to_deck', value: 2 }],
                description: '平抑恐慌與混亂，向理智牌庫注入 2 張真相卡。',
                flavorText: '「在混沌之中覓得一絲清明。」',
              });
            }
          }
        } else if (consequence.type === 'gain_card' && consequence.card) {
          newSanityDeck.push({
            ...consequence.card,
            id: `${consequence.card.id}_evt_${state.sanityDeck.length + 1}`,
            isTemporary: false,
          });
        } else if (consequence.type === 'gain_relic' && consequence.relic) {
          currentInvestigator = applyRelicToInvestigator(currentInvestigator, consequence.relic);
        } else if (consequence.type === 'trigger_combat') {
          triggerCombatEnemy = consequence.enemy ?? INITIAL_GHOUL;
        }
      }

      const gainedObols = Math.max(0, currentInvestigator.obols - state.investigator.obols);
      const currentStats = ensureAdventureStats(state);
      const updatedStats: AdventureStats = {
        ...currentStats,
        totalObolsCollected: currentStats.totalObolsCollected + gainedObols,
      };

      const updatedEvent: MythosEvent = {
        ...state.currentEvent,
        selectedOptionId: option.id,
        resolvedOutcomeText: outcomeTexts,
      };

      if (currentInvestigator.health <= 0) {
        saveFallenInvestigatorFromState(state, `於奇遇【${state.currentEvent?.title ?? '未知奇遇'}】中傷重不治`);
        return {
          ...state,
          phase: 'gameover',
          investigator: currentInvestigator,
          currentEvent: updatedEvent,
          adventureStats: updatedStats,
          battleLog: [`【肉體殞命】調查員在奇遇事件中傷重不治！`, ...state.battleLog],
        };
      }

      if (triggerCombatEnemy) {
        const currentCards = [
          ...newSanityDeck,
          ...newHand,
          ...newDiscardPile,
        ];
        const handCapacity = currentInvestigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
        const { hand, sanityDeck } = setupCombatDeck(
          currentCards,
          state.investigator.occupationId ?? 'investigator',
          action.payload.shuffledDeck,
          handCapacity
        );

        return {
          ...state,
          phase: 'combat',
          turn: 1,
          investigator: {
            ...currentInvestigator,
            armor: 0,
            stamina: currentInvestigator.maxStamina,
          },
          sanityDeck,
          hand,
          discardPile: [],
          isMadness: false,
          currentEnemy: cloneEnemy(triggerCombatEnemy),
          currentEvent: undefined,
          adventureStats: updatedStats,
          battleLog: outcomeTexts.concat(state.battleLog),
          combatInitialHealth: currentInvestigator.health,
          cardsPlayedThisTurn: 0,
        };
      }

      return {
        ...state,
        investigator: currentInvestigator,
        sanityDeck: newSanityDeck,
        hand: newHand,
        discardPile: newDiscardPile,
        currentEvent: updatedEvent,
        adventureStats: updatedStats,
        battleLog: outcomeTexts.concat(state.battleLog),
      };
    }

    case 'COMPLETE_EVENT': {
      if (state.phase !== 'event') return state;
      const updatedMap = advanceMapAfterNode(state.map);
      return {
        ...state,
        phase: 'map',
        map: updatedMap,
        currentEvent: undefined,
        battleLog: ['秘識奇遇結束，調查員整理行囊重回調查地圖。', ...state.battleLog],
      };
    }

    case 'USE_SANCTUARY': {
      if (state.phase !== 'sanctuary') return state;
      const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
      const deckForSanctuary = action.payload.optionId === 'purge' ? getAllPermanentCards(state) : state.sanityDeck;
      const result = resolveNodeInteraction(action, {
        investigator: state.investigator,
        sanityDeck: deckForSanctuary,
        currentNode,
        currentDepth: state.currentDepth ?? state.map?.depth ?? 1,
        sanctuaryUsed: state.sanctuaryUsed,
      });
      const extraCleans = action.payload.optionId === 'purge' ? { hand: [], discardPile: [] } : {};
      return applyNodeActionResult(state, result, extraCleans);
    }

    case 'BUY_MARKET_ITEM': {
      if (state.phase !== 'market') return state;
      const result = resolveNodeInteraction(action, {
        investigator: state.investigator,
        sanityDeck: state.sanityDeck,
        marketItems: state.marketItems,
      });
      return applyNodeActionResult(state, result);
    }

    case 'PURGE_CARD_AT_MARKET': {
      if (state.phase !== 'market') return state;
      const permanentCards = getAllPermanentCards(state);
      const result = resolveNodeInteraction(action, {
        investigator: state.investigator,
        sanityDeck: permanentCards,
        marketPurgeUsed: state.marketPurgeUsed,
      });
      return applyNodeActionResult(state, result, { hand: [], discardPile: [] });
    }

    case 'PROCEED_TO_REWARD': {
      if (state.phase !== 'victory') return state;
      const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;
      const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
      const isBossFight = currentNode?.type === 'boss';

      // ADR-0015: 第三深度首領戰勝分歧（未湊齊前兩枚殘片直接進入普通結局）
      if (isBossFight && currentDepth === 3 && !hasBothAbyssalFragments(state)) {
        const context: SurvivalSettlementContext = {
          investigator: state.investigator,
          currentCards: getAllPermanentCards(state),
          currentNodeType: 'boss',
          currentDepth: 3,
          abyssalSealFused: false,
          rewardObols: 0,
          map: state.map,
          shuffledDeck: action.payload?.shuffledDeck,
        };
        const result = resolveSurvivalSettlement({ type: 'skip' }, context);
        if (result.clearFallenRecord) {
          clearFallenInvestigator();
        }
        return {
          ...state,
          phase: result.nextPhase,
          map: result.map,
          investigator: result.investigator,
          sanityDeck: result.sanityDeck,
          hand: result.hand,
          discardPile: [],
          isMadness: false,
          rewardCards: undefined,
          rewardObols: undefined,
          battleLog: [
            '【阿卡姆常規終局】第三深度原生巨型修格斯伏誅！未湊齊深淵古印殘片，深淵裂隙漸漸平息，調查員逃離深淵……',
            ...state.battleLog,
          ],
        };
      }

      const reward = generateCombatReward({
        currentNodeType: currentNode?.type,
        currentDepth,
        occupationId: state.investigator.occupationId,
        currentCards: getAllPermanentCards(state),
        overrideCards: action.payload?.rewardCards,
        overrideObols: action.payload?.rewardObols,
      });

      return {
        ...state,
        phase: 'reward',
        abyssalSealFused: Boolean(state.abyssalSealFused || reward.abyssalSealFused),
        sanityDeck: reward.updatedDeck ?? state.sanityDeck,
        hand: reward.updatedDeck ? [] : state.hand,
        discardPile: reward.updatedDeck ? [] : state.discardPile,
        rewardCards: reward.rewardCards,
        rewardObols: reward.rewardObols,
        battleLog: [...reward.logs, ...state.battleLog],
      };
    }

    case 'CLAIM_CARD_REWARD': {
      if (state.phase !== 'reward') return state;
      const selectedCard = action.payload?.cardId && state.rewardCards
        ? state.rewardCards.find((c) => c.id === action.payload?.cardId)
        : undefined;

      const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
      const context: SurvivalSettlementContext = {
        investigator: state.investigator,
        currentCards: getAllPermanentCards(state),
        currentNodeType: currentNode?.type,
        currentDepth: state.currentDepth ?? state.map?.depth ?? 1,
        abyssalSealFused: state.abyssalSealFused,
        rewardObols: state.rewardObols ?? 15,
        map: state.map,
        shuffledDeck: action.payload?.shuffledDeck,
      };

      const result = resolveSurvivalSettlement(
        { type: 'card', cardId: action.payload?.cardId, card: selectedCard },
        context
      );

      return applySurvivalSettlementResult(state, result);
    }

    case 'CLAIM_FIELD_DRESSING': {
      if (state.phase !== 'reward') return state;
      const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
      const context: SurvivalSettlementContext = {
        investigator: state.investigator,
        currentCards: getAllPermanentCards(state),
        currentNodeType: currentNode?.type,
        currentDepth: state.currentDepth ?? state.map?.depth ?? 1,
        abyssalSealFused: state.abyssalSealFused,
        rewardObols: state.rewardObols ?? 15,
        map: state.map,
        shuffledDeck: action.payload?.shuffledDeck,
      };

      const result = resolveSurvivalSettlement(
        { type: 'field_dressing', healAmount: action.payload?.healAmount ?? 4 },
        context
      );

      return applySurvivalSettlementResult(state, result);
    }

    case 'CLAIM_ABYSSAL_SEAL': {
      if (state.phase !== 'reward') return state;
      const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;
      const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
      const isBossFight = currentNode?.type === 'boss';

      if (!isBossFight || (currentDepth !== 1 && currentDepth !== 2)) {
        return state;
      }

      const context: SurvivalSettlementContext = {
        investigator: state.investigator,
        currentCards: getAllPermanentCards(state),
        currentNodeType: 'boss',
        currentDepth,
        abyssalSealFused: state.abyssalSealFused,
        rewardObols: state.rewardObols,
        map: state.map,
        shuffledDeck: action.payload?.shuffledDeck,
      };

      const result = resolveSurvivalSettlement(
        { type: 'abyssal_seal' },
        context
      );

      return applySurvivalSettlementResult(state, result);
    }

    case 'COMPLETE_DEPTH_TRANSITION': {
      if (state.phase !== 'depth_transition') return state;
      const currentDepth = state.currentDepth ?? 1;
      if (currentDepth >= 4) {
        return {
          ...state,
          phase: 'map',
          map: state.map ? { ...state.map, isCompleted: true } : undefined,
        };
      }
      const nextDepth = (currentDepth + 1) as DepthLevel;
      const newMap = generateInvestigationMap({ depth: nextDepth, procedural: true });
      return {
        ...state,
        phase: 'map',
        currentDepth: nextDepth,
        lastCombatEnemyId: undefined,
        map: newMap,
        sanctuaryUsed: false,
        battleLog: [
          `【邁向新深淵】調查員整裝深入第 ${nextDepth} 深度：${newMap.name}！`,
          ...state.battleLog,
        ],
      };
    }

    case 'RETURN_TO_TITLE': {
      return {
        ...createInitialCombatState(),
        phase: 'title',
        lastCombatEnemyId: undefined,
        battleLog: ['返回標題畫面。請選擇調查員開始新的探險。'],
      };
    }

    case 'START_COMBAT': {
      const occId = action.payload?.investigator?.occupationId ?? state.investigator?.occupationId ?? 'investigator';
      const occ = OCCUPATIONS[occId] ?? OCCUPATIONS.investigator;
      const handCapacity = action.payload?.investigator?.handCapacity ?? state.investigator?.handCapacity ?? occ.stats.handCapacity ?? DEFAULT_HAND_CAPACITY;
      const relicList = action.payload?.investigator?.relics ?? state.investigator?.relics;

      const investigator: Investigator = action.payload?.investigator
        ? {
            ...action.payload.investigator,
            handCapacity,
            relics: relicList ? [...relicList] : [],
          }
        : {
            name: occ.name,
            occupation: occ.occupation,
            occupationId: occ.id,
            health: occ.stats.health,
            maxHealth: occ.stats.health,
            stamina: occ.stats.stamina,
            maxStamina: occ.stats.stamina,
            armor: 0,
            obols: occ.stats.obols,
            handCapacity,
            relics: relicList ? [...relicList] : [],
          };
      const initialCards = action.payload?.initialCards
        ? [...action.payload.initialCards]
        : occ.deck.map((c) => ({ ...c }));
      return createInitialCombatState(
        action.payload?.enemy,
        initialCards,
        investigator,
        'combat'
      );
    }

    case 'RESET_COMBAT': {
      const occId = action.payload?.occupationId ?? state.investigator?.occupationId ?? 'investigator';
      const occ = OCCUPATIONS[occId] ?? OCCUPATIONS.investigator;
      const handCapacity = state.investigator?.handCapacity ?? occ.stats.handCapacity ?? DEFAULT_HAND_CAPACITY;
      const baseInvestigator = {
        armor: 0,
        relics: state.investigator?.relics,
        maxStamina: state.investigator?.maxStamina ?? occ.stats.stamina,
      };
      const relicStart = applyRelicCombatStart(baseInvestigator);

      const maxHealth = state.investigator?.maxHealth ?? occ.stats.health;
      const initialCombatHealth = action.payload?.initialHealth
        ?? state.combatInitialHealth
        ?? maxHealth;
      const restoredHealth = Math.min(maxHealth, Math.max(1, initialCombatHealth));

      const investigator: Investigator = {
        name: state.investigator?.name ?? occ.name,
        occupation: state.investigator?.occupation ?? occ.occupation,
        occupationId: occ.id,
        health: restoredHealth,
        maxHealth,
        stamina: relicStart.stamina,
        maxStamina: state.investigator?.maxStamina ?? occ.stats.stamina,
        armor: relicStart.armor,
        obols: state.investigator?.obols ?? occ.stats.obols,
        handCapacity,
        relics: state.investigator?.relics ? [...state.investigator.relics] : [],
        statusEffects: relicStart.statusEffects,
      };

      // Gather permanent cards to preserve crafted deck upon retrying
      const currentPermanentCards = [
        ...state.sanityDeck,
        ...state.hand,
        ...state.discardPile,
      ];

      const { hand, sanityDeck } = setupCombatDeck(
        currentPermanentCards,
        occ.id,
        action.payload?.initialCards,
        handCapacity
      );
      const candidateEnemy = action.payload?.enemy ?? state.currentEnemy;
      const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;
      const enemy = getFreshEnemyTemplate(candidateEnemy, state.map, currentDepth);
      enemy.statusEffects = [];

      const resetLogs = [
        `重整戰鬥！調查員 ${investigator.name}（${investigator.occupation}）重新迎戰 ${enemy.name}！`,
        ...relicStart.logs,
      ];

      return {
        phase: 'combat',
        currentDepth,
        turn: 1,
        investigator,
        sanityDeck,
        hand,
        discardPile: [],
        exhaustPile: [],
        isMadness: false,
        currentEnemy: enemy,
        map: state.map,
        visitedEventIds: state.visitedEventIds ?? [],
        adventureStats: ensureAdventureStats(state),
        battleLog: [...resetLogs, ...state.battleLog],
        abyssalSealFused: state.abyssalSealFused,
        combatInitialHealth: state.combatInitialHealth ?? restoredHealth,
        discardPhase: undefined,
        cardsPlayedThisTurn: 0,
      };
    }

    case 'PLAY_CARD': {
      if (state.phase !== 'combat' || Boolean(state.discardPhase)) return state;

      const cardIndex = state.hand.findIndex((c) => c.id === action.payload.cardId);
      if (cardIndex === -1) return state;

      const card = state.hand[cardIndex];

      const context: CardPlayContext = {
        investigator: state.investigator,
        enemy: state.currentEnemy,
        hand: state.hand,
        sanityDeck: state.sanityDeck,
        discardPile: state.discardPile,
        exhaustPile: state.exhaustPile,
        turn: state.turn,
        isMadness: state.isMadness,
        cardsPlayedThisTurn: state.cardsPlayedThisTurn ?? 0,
      };

      const result = evaluateCardPlay(card, context);

      if (!result.success) {
        return {
          ...state,
          battleLog: [...result.logs, ...state.battleLog],
        };
      }

      let phase: GameState['phase'] = state.phase;
      let stats = ensureAdventureStats(state);
      let isTrueEnding = state.isTrueEnding || Boolean(result.isTrueEnding);

      if (result.combatOutcome === 'defeat') {
        phase = 'gameover';
        saveFallenInvestigatorFromState(state, '承受深淵反噬殞命');
      } else if (result.combatOutcome === 'victory') {
        phase = 'victory';
        stats = {
          ...stats,
          enemiesDefeated: stats.enemiesDefeated + 1,
        };
        if (result.isTrueEnding) {
          clearFallenInvestigator();
        }
      }

      return {
        ...state,
        phase,
        isTrueEnding,
        cardsPlayedThisTurn: (state.cardsPlayedThisTurn ?? 0) + 1,
        investigator: {
          ...state.investigator,
          stamina: result.investigator.stamina,
          health: result.investigator.health,
          armor: result.investigator.armor,
          statusEffects: result.investigator.statusEffects,
        },
        sanityDeck: ensureUniqueCardIds(result.sanityDeck),
        hand: ensureUniqueCardIds(result.hand),
        discardPile: result.discardPile,
        exhaustPile: result.exhaustPile,
        isMadness: result.isMadness,
        currentEnemy: {
          ...state.currentEnemy,
          health: result.enemy.health,
          armor: result.enemy.armor,
          statusEffects: result.enemy.statusEffects,
        },
        adventureStats: stats,
        battleLog: [...result.logs, ...state.battleLog],
      };
    }

    case 'END_TURN': {
      if (state.phase !== 'combat' || Boolean(state.discardPhase)) return state;

      const capacity = state.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
      const nonRetainHand = state.hand.filter((c) => !c.keywords?.includes('retain'));

      // 若未打出之非保留手牌數量大於手牌容量上限，切換至主動棄牌階段
      if (nonRetainHand.length > capacity) {
        const requiredDiscardCount = nonRetainHand.length - capacity;
        return {
          ...state,
          discardPhase: {
            requiredDiscardCount,
            selectedDiscardIds: [],
          },
          battleLog: [
            `【手牌超出容量】未打出手牌（非保留 ${nonRetainHand.length} 張）超出容量上限（${capacity} 張），請挑選並棄置 ${requiredDiscardCount} 張卡牌。`,
            ...state.battleLog,
          ],
        };
      }

      // 手牌未超量：全額保留未打出手牌，直接進入敵怪行動並固定抽取 capacity 張卡牌
      return resolveTurnEndAndFixedDraw(state, state.hand, []);
    }

    case 'TOGGLE_DISCARD_CARD': {
      if (state.phase !== 'combat' || !state.discardPhase) return state;
      const { cardId } = action.payload;
      const { requiredDiscardCount, selectedDiscardIds } = state.discardPhase;

      if (!state.hand.some((c) => c.id === cardId)) return state;

      let nextSelected: string[];
      if (selectedDiscardIds.includes(cardId)) {
        nextSelected = selectedDiscardIds.filter((id) => id !== cardId);
      } else {
        if (selectedDiscardIds.length >= requiredDiscardCount) {
          return state;
        }
        nextSelected = [...selectedDiscardIds, cardId];
      }

      return {
        ...state,
        discardPhase: {
          ...state.discardPhase,
          selectedDiscardIds: nextSelected,
        },
      };
    }

    case 'CANCEL_DISCARD': {
      if (state.phase !== 'combat' || !state.discardPhase) return state;
      return {
        ...state,
        discardPhase: undefined,
        battleLog: [
          '取消主動棄牌，返回戰鬥出牌階段。',
          ...state.battleLog,
        ],
      };
    }

    case 'CONFIRM_DISCARD': {
      if (state.phase !== 'combat' || !state.discardPhase) return state;
      const cardIdsToDiscard = action.payload?.cardIds ?? state.discardPhase.selectedDiscardIds;
      const capacity = state.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
      const nonRetainHand = state.hand.filter((c) => !c.keywords?.includes('retain'));
      const requiredDiscardCount = Math.max(0, nonRetainHand.length - capacity);

      return executeCardDiscardAndAdvanceTurn(state, cardIdsToDiscard, requiredDiscardCount);
    }

    case 'DISCARD_CARDS_TO_LIMIT': {
      if (state.phase !== 'combat') return state;
      const cardIdsToDiscard = action.payload.cardIds;
      const capacity = state.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
      const nonRetainHand = state.hand.filter((c) => !c.keywords?.includes('retain'));
      const requiredDiscardCount = Math.max(0, nonRetainHand.length - capacity);

      return executeCardDiscardAndAdvanceTurn(state, cardIdsToDiscard, requiredDiscardCount);
    }

    case 'ACQUIRE_RELIC': {
      const relic = action.payload.relic;
      const updatedInvestigator = applyRelicToInvestigator(state.investigator, relic);
      const rarityLabel =
        relic.rarity === 'mythic' ? '神話' : relic.rarity === 'rare' ? '珍稀' : '普通';
      return {
        ...state,
        investigator: updatedInvestigator,
        battleLog: [
          `【獲得舊日遺物】你在探索中獲得了【${relic.name}】（${rarityLabel}遺物）。${relic.description}`,
          ...state.battleLog,
        ],
      };
    }

    case 'APPLY_STATUS_EFFECT': {
      if (action.payload.target === 'investigator') {
        const updated = addStatusEffect(state.investigator.statusEffects, action.payload.effect);
        return {
          ...state,
          investigator: {
            ...state.investigator,
            statusEffects: updated,
          },
          battleLog: [
            `調查員獲得了 ${action.payload.effect.stacks} 層【${action.payload.effect.name}】印記！`,
            ...state.battleLog,
          ],
        };
      } else {
        const updated = addStatusEffect(state.currentEnemy.statusEffects, action.payload.effect);
        return {
          ...state,
          currentEnemy: {
            ...state.currentEnemy,
            statusEffects: updated,
          },
          battleLog: [
            `${state.currentEnemy.name} 獲得了 ${action.payload.effect.stacks} 層【${action.payload.effect.name}】印記！`,
            ...state.battleLog,
          ],
        };
      }
    }

    case 'USE_ALTAR': {
      if (state.phase !== 'altar') return state;
      const currentStats = ensureAdventureStats(state);
      const result = resolveNodeInteraction(action, {
        investigator: state.investigator,
        sanityDeck: state.sanityDeck,
        altarUsed: state.altarUsed,
        altarRituals: state.altarRituals,
        currentDepth: state.currentDepth ?? state.map?.depth ?? 1,
        turn: state.turn,
        adventureStats: currentStats,
      });
      return applyNodeActionResult(state, result);
    }

    case 'CLAIM_VAULT_RELIC': {
      if (state.phase !== 'vault') return state;
      const currentStats = ensureAdventureStats(state);
      const result = resolveNodeInteraction(action, {
        investigator: state.investigator,
        sanityDeck: state.sanityDeck,
        vaultClaimed: state.vaultClaimed,
        vaultRelics: state.vaultRelics,
        adventureStats: currentStats,
      });
      return applyNodeActionResult(state, result);
    }

    case 'SACRIFICE_CARDS_AT_BLOOD_ALTAR': {
      if (state.phase !== 'blood_altar') return state;
      const permanentCards = getAllPermanentCards(state);
      const result = resolveNodeInteraction(action, {
        investigator: state.investigator,
        sanityDeck: permanentCards,
        bloodAltarUsed: state.bloodAltarUsed,
      });
      return applyNodeActionResult(state, result, { hand: [], discardPile: [] });
    }

    case 'INHERIT_REMAINS': {
      if (state.phase !== 'remains') return state;
      const currentStats = ensureAdventureStats(state);
      const result = resolveNodeInteraction(action, {
        investigator: state.investigator,
        sanityDeck: state.sanityDeck,
        fallenInvestigator: state.fallenInvestigator,
        remainsClaimed: state.remainsClaimed,
        adventureStats: currentStats,
      });
      if (result.clearFallenRecord) {
        clearFallenInvestigator();
      }
      return applyNodeActionResult(state, result);
    }

    case 'LEAVE_NODE': {
      const allowedPhases = ['sanctuary', 'market', 'altar', 'vault', 'blood_altar', 'remains'];
      if (!allowedPhases.includes(state.phase)) return state;
      const result = resolveNodeLeave({
        phase: state.phase,
        map: state.map,
      });
      if (result.clearFallenRecord) {
        clearFallenInvestigator();
      }
      return {
        ...state,
        phase: 'map',
        map: result.map,
        ...result.nodeStateCleans,
        battleLog: result.logs.concat(state.battleLog),
      };
    }

    default:
      return state;
  }
}

