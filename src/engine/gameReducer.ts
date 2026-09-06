import type {
  AdventureStats,
  Card,
  DepthLevel,
  Enemy,
  EnemyIntent,
  GameAction,
  GameState,
  Investigator,
  InvestigationMap,
  MapNode,
  MythosEvent,
  OccupationId,
} from '../types/game';
import {
  INITIAL_GHOUL,
  INITIAL_INVESTIGATOR,
  OCCUPATIONS,
  generateRewardCards,
  fisherYatesShuffle,
} from './initialData';
import { createMadnessCards, createTruthInjectedCards } from './cardFactory';
import { generateInvestigationMap, generateProceduralInvestigationMap } from './mapGenerator';
import {
  INITIAL_DEEP_ONE,
  INITIAL_SHOGGOTH,
  INITIAL_DAGON_PRIEST,
  INITIAL_COLOSSAL_SHOGGOTH,
  INITIAL_STAR_SPAWN,
  getBossByDepth,
  getMythosEventForNode,
  generateDefaultMarketItems,
  TRUTH_CARD_BREAKWATER,
} from './eventData';

export const BASELINE_HAND_SIZE = 4;

/**
 * 敵怪物件深拷貝純函式，避免可變狀態污染
 */
export function cloneEnemy(enemy: Enemy): Enemy {
  return JSON.parse(JSON.stringify(enemy));
}

/**
 * 將完整卡牌清單切分為起始手牌（4張）與理智牌庫（其餘張數）之共用純函式
 */
export function splitDeckToHandAndSanity(
  deck: Card[],
  handSize: number = BASELINE_HAND_SIZE
): { hand: Card[]; sanityDeck: Card[] } {
  return {
    hand: deck.slice(0, handSize),
    sanityDeck: deck.slice(handSize),
  };
}

/**
 * 戰鬥卡牌構建與洗牌純函式（消除重複代碼，支援洗牌覆寫以利確定性測試）
 */
export function setupCombatDeck(
  cards: Card[],
  occupationId: OccupationId = 'investigator',
  overrideDeck?: Card[]
): { hand: Card[]; sanityDeck: Card[] } {
  if (overrideDeck && overrideDeck.length > 0) {
    return splitDeckToHandAndSanity(overrideDeck, BASELINE_HAND_SIZE);
  }
  const permanentCards = cards.filter((c) => !c.isTemporary);
  const occ = OCCUPATIONS[occupationId] ?? OCCUPATIONS.investigator;
  const pool: Card[] = permanentCards.length > 0
    ? permanentCards
    : occ.deck.map((c) => ({ ...c }));
  const shuffledDeck = fisherYatesShuffle(pool);
  return splitDeckToHandAndSanity(shuffledDeck, BASELINE_HAND_SIZE);
}

/**
 * 節點結算後推進地圖：將當前節點標記為 visited，將其連通的下一層節點解鎖為 accessible。
 * 若當前節點為宿敵（boss），標記調查地圖為已破關（isCompleted = true）。
 */
export function advanceMapAfterNode(map?: InvestigationMap): InvestigationMap | undefined {
  if (!map || !map.currentNodeId) return map;
  const currentNode = map.nodes[map.currentNodeId];
  if (!currentNode) return map;

  const updatedNodes: Record<string, MapNode> = {};
  for (const [id, node] of Object.entries(map.nodes)) {
    if (id === currentNode.id) {
      updatedNodes[id] = { ...node, status: 'visited' };
    } else if (currentNode.nextNodes.includes(id)) {
      updatedNodes[id] = { ...node, status: 'accessible' };
    } else {
      updatedNodes[id] = { ...node };
    }
  }

  const isCompleted = currentNode.type === 'boss' || Boolean(map.isCompleted);

  return {
    ...map,
    nodes: updatedNodes,
    isCompleted,
  };
}

const STATIC_ENEMY_TEMPLATES: Record<string, Enemy> = {
  [INITIAL_DEEP_ONE.id]: INITIAL_DEEP_ONE,
  [INITIAL_SHOGGOTH.id]: INITIAL_SHOGGOTH,
  [INITIAL_DAGON_PRIEST.id]: INITIAL_DAGON_PRIEST,
  [INITIAL_COLOSSAL_SHOGGOTH.id]: INITIAL_COLOSSAL_SHOGGOTH,
  [INITIAL_STAR_SPAWN.id]: INITIAL_STAR_SPAWN,
  [INITIAL_GHOUL.id]: INITIAL_GHOUL,
};

/**
 * 取得敵人初始模板以利於戰鬥重整 (Reset Combat) 重新迎戰原敵人
 */
export function getFreshEnemyTemplate(candidate?: Enemy, map?: InvestigationMap, depth: DepthLevel = 1): Enemy {
  const currentDepth = depth ?? map?.depth ?? 1;
  const enemyId = candidate?.id;
  if (enemyId && STATIC_ENEMY_TEMPLATES[enemyId]) {
    return cloneEnemy(STATIC_ENEMY_TEMPLATES[enemyId]);
  }

  // If node type from map is available
  if (map?.currentNodeId && map.nodes[map.currentNodeId]) {
    const node = map.nodes[map.currentNodeId];
    if (node.type === 'elite') return cloneEnemy(INITIAL_DEEP_ONE);
    if (node.type === 'boss') return cloneEnemy(getBossByDepth(currentDepth));
    if (node.type === 'combat') return cloneEnemy(INITIAL_GHOUL);
  }

  if (candidate) {
    return {
      ...candidate,
      health: candidate.maxHealth,
      armor: candidate.armor,
      currentIntentIndex: 0,
      currentIntent: candidate.intentSequence?.[0] ?? candidate.currentIntent,
    };
  }

  return cloneEnemy(INITIAL_GHOUL);
}

/**
 * 集中評估理智牌庫與瘋狂狀態切換之共用純函式
 */
export function evaluateMadnessTransition(
  wasMadness: boolean,
  sanityDeckLength: number
): { isMadness: boolean; logMessage?: string } {
  if (wasMadness && sanityDeckLength > 0) {
    return {
      isMadness: false,
      logMessage: '【心智平復】理智牌庫已回補卡牌，心智平復解除瘋狂狀態，調查員恢復清醒。',
    };
  }
  if (!wasMadness && sanityDeckLength === 0) {
    return {
      isMadness: true,
      logMessage: '【理智歸零】理智牌庫徹底抽空！調查員進入「瘋狂狀態」！',
    };
  }
  return { isMadness: wasMadness };
}

export interface DamageResult {
  newHealth: number;
  newArmor: number;
  absorbed: number;
  effectiveDamage: number;
}

/**
 * 集中計算物理傷害與護甲吸收之共用純函式
 */
export function applyDamage(
  target: { health: number; armor: number },
  damageAmount: number
): DamageResult {
  const absorbed = Math.min(target.armor, damageAmount);
  const effectiveDamage = damageAmount - absorbed;
  const newArmor = target.armor - absorbed;
  const newHealth = Math.max(0, target.health - effectiveDamage);

  return {
    newHealth,
    newArmor,
    absorbed,
    effectiveDamage,
  };
}

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
  const occId = customInvestigator?.occupationId ?? 'investigator';
  const occ = OCCUPATIONS[occId] ?? OCCUPATIONS.investigator;
  const investigator: Investigator = customInvestigator
    ? { ...customInvestigator }
    : { ...INITIAL_INVESTIGATOR };

  const enemy: Enemy = customEnemy
    ? cloneEnemy(customEnemy)
    : cloneEnemy(INITIAL_GHOUL);

  const allCards: Card[] = customDeck
    ? [...customDeck]
    : occ.deck.map((c) => ({ ...c }));

  const { hand, sanityDeck } = splitDeckToHandAndSanity(allCards, BASELINE_HAND_SIZE);

  return {
    phase: initialPhase,
    currentDepth: 1,
    turn: 1,
    investigator,
    sanityDeck,
    hand,
    discardPile: [],
    isMadness: sanityDeck.length === 0,
    currentEnemy: enemy,
    adventureStats: createInitialAdventureStats(investigator),
    battleLog: [
      `遭遇 ${enemy.name}（${enemy.title}）！惡臭與潮濕的黑暗籠罩四周，你握緊武器展開搏殺……`,
    ],
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
      };
      const allCards = occ.deck.map((c) => ({ ...c }));
      const { hand, sanityDeck } = splitDeckToHandAndSanity(allCards, BASELINE_HAND_SIZE);
      const enemy = cloneEnemy(INITIAL_GHOUL);
      const map = action.payload.map ?? (action.payload.procedural ? generateProceduralInvestigationMap({ depth: 1 }) : generateInvestigationMap({ depth: 1 }));
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
        map,
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

        if (targetNode.type === 'elite') {
          enemy = cloneEnemy(INITIAL_DEEP_ONE);
          logMsg = `探索【${targetNode.title}】！遭遇舊日精英敵人：${enemy.name}（${enemy.title}）！`;
        } else if (targetNode.type === 'boss') {
          enemy = cloneEnemy(getBossByDepth(state.currentDepth ?? state.map?.depth ?? 1));
          logMsg = `踏入【${targetNode.title}】！終局宿敵降臨：${enemy.name}（${enemy.title}）！`;
        } else {
          enemy = cloneEnemy(INITIAL_GHOUL);
          logMsg = `探索【${targetNode.title}】！遭遇常規敵人：${enemy.name}（${enemy.title}）。`;
        }

        const currentCards = [
          ...state.sanityDeck,
          ...state.hand,
          ...state.discardPile,
        ];
        const { hand, sanityDeck } = setupCombatDeck(
          currentCards,
          state.investigator.occupationId ?? 'investigator',
          action.payload.shuffledDeck
        );

        return {
          ...state,
          phase: 'combat',
          turn: 1,
          investigator: {
            ...state.investigator,
            armor: 0,
            stamina: state.investigator.maxStamina,
          },
          sanityDeck,
          hand,
          discardPile: [],
          isMadness: false,
          map: updatedMap,
          currentEnemy: enemy,
          adventureStats: updatedStats,
          battleLog: [logMsg, ...state.battleLog],
        };
      }

      if (targetNode.type === 'event') {
        const event = getMythosEventForNode(targetNode.id);
        return {
          ...state,
          phase: 'event',
          map: updatedMap,
          currentEvent: event,
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！觸發秘識奇遇【${event.title}】。`,
            ...state.battleLog,
          ],
        };
      }

      if (targetNode.type === 'sanctuary') {
        return {
          ...state,
          phase: 'sanctuary',
          map: updatedMap,
          sanctuaryUsed: false,
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！抵達安全避難所。`,
            ...state.battleLog,
          ],
        };
      }

      if (targetNode.type === 'market') {
        return {
          ...state,
          phase: 'market',
          map: updatedMap,
          marketItems: generateDefaultMarketItems(),
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！進入黑市商鋪。`,
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

      let newHealth = state.investigator.health;
      let newObols = state.investigator.obols;
      let newSanityDeck = [...state.sanityDeck];
      const newHand = [...state.hand];
      let triggerCombatEnemy: Enemy | undefined;
      const outcomeTexts: string[] = [];

      for (const consequence of option.consequences) {
        outcomeTexts.push(consequence.narrative);
        if (consequence.type === 'health_change' && consequence.value !== undefined) {
          newHealth = Math.max(0, Math.min(state.investigator.maxHealth, newHealth + consequence.value));
        } else if (consequence.type === 'gain_obols' && consequence.value !== undefined) {
          newObols = Math.max(0, newObols + consequence.value);
        } else if (consequence.type === 'sanity_change' && consequence.value !== undefined) {
          if (consequence.value < 0) {
            const burnCount = Math.min(newSanityDeck.length, Math.abs(consequence.value));
            newSanityDeck = newSanityDeck.slice(burnCount);
          } else if (consequence.value > 0) {
            let deficit = consequence.value;
            if (state.discardPile.length > 0) {
              const recoverCount = Math.min(state.discardPile.length, deficit);
              const recovered = state.discardPile.slice(0, recoverCount);
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
        } else if (consequence.type === 'trigger_combat') {
          triggerCombatEnemy = consequence.enemy ?? INITIAL_GHOUL;
        }
      }

      const gainedObols = Math.max(0, newObols - state.investigator.obols);
      const currentStats = ensureAdventureStats(state);
      const updatedStats: AdventureStats = {
        ...currentStats,
        totalObolsCollected: currentStats.totalObolsCollected + gainedObols,
      };

      const updatedInvestigator: Investigator = {
        ...state.investigator,
        health: newHealth,
        obols: newObols,
      };

      const updatedEvent: MythosEvent = {
        ...state.currentEvent,
        selectedOptionId: option.id,
        resolvedOutcomeText: outcomeTexts,
      };

      if (newHealth <= 0) {
        return {
          ...state,
          phase: 'gameover',
          investigator: updatedInvestigator,
          currentEvent: updatedEvent,
          adventureStats: updatedStats,
          battleLog: [`【肉體殞命】調查員在奇遇事件中傷重不治！`, ...state.battleLog],
        };
      }

      if (triggerCombatEnemy) {
        const currentCards = [
          ...newSanityDeck,
          ...newHand,
          ...state.discardPile,
        ];
        const { hand, sanityDeck } = setupCombatDeck(
          currentCards,
          state.investigator.occupationId ?? 'investigator',
          action.payload.shuffledDeck
        );

        return {
          ...state,
          phase: 'combat',
          turn: 1,
          investigator: {
            ...updatedInvestigator,
            armor: 0,
            stamina: updatedInvestigator.maxStamina,
          },
          sanityDeck,
          hand,
          discardPile: [],
          isMadness: false,
          currentEnemy: cloneEnemy(triggerCombatEnemy),
          currentEvent: undefined,
          adventureStats: updatedStats,
          battleLog: outcomeTexts.concat(state.battleLog),
        };
      }

      return {
        ...state,
        investigator: updatedInvestigator,
        sanityDeck: newSanityDeck,
        hand: newHand,
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
      if (state.phase !== 'sanctuary' || state.sanctuaryUsed) return state;
      const optionId = action.payload.optionId;
      if (optionId === 'bandage') {
        if (state.investigator.health >= state.investigator.maxHealth) {
          return state;
        }
        if (state.investigator.obols < 5 && state.sanityDeck.length === 0) {
          return state;
        }
      }

      let newHealth = state.investigator.health;
      let newObols = state.investigator.obols;
      let newSanityDeck = [...state.sanityDeck];
      const newLogs: string[] = [];

      if (optionId === 'bandage') {
        newHealth = Math.min(state.investigator.maxHealth, newHealth + 8);
        if (state.investigator.obols >= 5) {
          newObols = state.investigator.obols - 5;
          newLogs.push(
            `在避難所消耗 5 枚古金幣購置急救藥品與防腐繃帶，深層包紮恢復了 8 點肉體生命值（當前生命值: ${newHealth} / ${state.investigator.maxHealth}，剩餘古金幣: ${newObols} 枚）。`
          );
        } else {
          if (newSanityDeck.length > 0) {
            newSanityDeck = newSanityDeck.slice(1);
          }
          newLogs.push(
            `因古金幣不足，調查員忍受劇痛強行縫合創口，損耗 1 點理智，深層包紮恢復了 8 點肉體生命值（當前生命值: ${newHealth} / ${state.investigator.maxHealth}）。`
          );
        }
      } else if (optionId === 'meditate') {
        const truthCard: Card = {
          ...TRUTH_CARD_BREAKWATER,
          id: `sanctuary_truth_${state.sanityDeck.length + 1}`,
        };
        newSanityDeck.push(truthCard);
        newLogs.push(`在避難所深層冥想，獲得真相卡【心智防波堤】納入理智牌庫！`);
      }

      return {
        ...state,
        investigator: {
          ...state.investigator,
          health: newHealth,
          obols: newObols,
        },
        sanityDeck: newSanityDeck,
        hand: state.hand,
        sanctuaryUsed: true,
        battleLog: newLogs.concat(state.battleLog),
      };
    }

    case 'LEAVE_SANCTUARY': {
      if (state.phase !== 'sanctuary') return state;
      const updatedMap = advanceMapAfterNode(state.map);
      return {
        ...state,
        phase: 'map',
        map: updatedMap,
        sanctuaryUsed: undefined,
        battleLog: ['離開安全避難所，繼續踏入阿卡姆的迷霧路線。', ...state.battleLog],
      };
    }

    case 'BUY_MARKET_ITEM': {
      if (state.phase !== 'market' || !state.marketItems) return state;
      const item = state.marketItems.find((i) => i.id === action.payload.itemId);
      if (!item || item.isPurchased) return state;

      if (state.investigator.obols < item.price) {
        return {
          ...state,
          battleLog: [`古金幣不足！【${item.name}】需要 ${item.price} 古金幣，目前僅有 ${state.investigator.obols} 枚。`, ...state.battleLog],
        };
      }

      let newHealth = state.investigator.health;
      const newSanityDeck = [...state.sanityDeck];
      const newLogs: string[] = [];

      if (item.type === 'heal' && item.healAmount) {
        newHealth = Math.min(state.investigator.maxHealth, newHealth + item.healAmount);
        newLogs.push(`在黑市購買【${item.name}】，立即恢復了 ${item.healAmount} 點生命值（當前: ${newHealth} / ${state.investigator.maxHealth}）。`);
      } else if (item.type === 'card' && item.card) {
        newSanityDeck.push({
          ...item.card,
          id: `${item.card.id}_purchased_${state.sanityDeck.length + 1}`,
          isTemporary: false,
        });
        newLogs.push(`在黑市花費 ${item.price} 古金幣購入卡牌【${item.card.name}】納入理智牌庫！`);
      }

      const updatedItems = state.marketItems.map((i) =>
        i.id === item.id ? { ...i, isPurchased: true } : i
      );

      return {
        ...state,
        investigator: {
          ...state.investigator,
          health: newHealth,
          obols: state.investigator.obols - item.price,
        },
        sanityDeck: newSanityDeck,
        hand: state.hand,
        marketItems: updatedItems,
        battleLog: newLogs.concat(state.battleLog),
      };
    }

    case 'LEAVE_MARKET': {
      if (state.phase !== 'market') return state;
      const updatedMap = advanceMapAfterNode(state.map);
      return {
        ...state,
        phase: 'map',
        map: updatedMap,
        marketItems: undefined,
        battleLog: ['離開黑市暗巷，重新回到調查地圖。', ...state.battleLog],
      };
    }

    case 'PROCEED_TO_REWARD': {
      if (state.phase !== 'victory') return state;
      const rewardCards = action.payload?.rewardCards ?? generateRewardCards(3);
      const rewardObols = action.payload?.rewardObols ?? 15;
      return {
        ...state,
        phase: 'reward',
        rewardCards,
        rewardObols,
        battleLog: [
          `戰鬥結算：獲得 ${rewardObols} 古金幣！請挑選 1 張卡牌構築獎勵或選擇跳過以精簡牌庫。`,
          ...state.battleLog,
        ],
      };
    }

    case 'CLAIM_CARD_REWARD': {
      if (state.phase !== 'reward') return state;
      const selectedCard = action.payload?.cardId && state.rewardCards
        ? state.rewardCards.find((c) => c.id === action.payload?.cardId)
        : undefined;

      // 1. Gather all permanent cards across current battle state (temporary cards discarded)
      const currentPermanentCards = [
        ...state.sanityDeck,
        ...state.hand,
        ...state.discardPile,
      ].filter((c) => !c.isTemporary);

      const newPermanentDeck = selectedCard
        ? [
            ...currentPermanentCards,
            {
              ...selectedCard,
              id: `${selectedCard.id}_drafted_${currentPermanentCards.length + 1}`,
              isTemporary: false,
            },
          ]
        : [...currentPermanentCards];

      const addedObols = state.rewardObols ?? 15;
      const currentStats = ensureAdventureStats(state);
      const updatedStats: AdventureStats = {
        ...currentStats,
        totalObolsCollected: currentStats.totalObolsCollected + addedObols,
      };

      const isBossFight = state.map?.currentNodeId && state.map.nodes[state.map.currentNodeId]?.type === 'boss';

      // 2. Persistent health: investigator.health does NOT heal normally, EXCEPT on Boss defeat!
      const isHealingToFull = Boolean(isBossFight);
      const nextHealth = isHealingToFull ? state.investigator.maxHealth : state.investigator.health;

      const updatedInvestigator: Investigator = {
        ...state.investigator,
        health: nextHealth,
        armor: 0,
        stamina: state.investigator.maxStamina,
        obols: state.investigator.obols + addedObols,
      };

      // 3. Reset full sanity deck with all permanent cards shuffled (temporary cards dissolved)
      // Support optional payload.shuffledDeck for 100% deterministic test replay
      const resetDeck = action.payload?.shuffledDeck
        ? [...action.payload.shuffledDeck]
        : fisherYatesShuffle(newPermanentDeck);

      const { hand, sanityDeck } = splitDeckToHandAndSanity(resetDeck, BASELINE_HAND_SIZE);

      const newLogs: string[] = [];
      newLogs.push(`戰後重整：所有一般卡洗回理智牌庫，理智回滿至 ${newPermanentDeck.length} 點。戰鬥臨時卡已消散。`);
      if (selectedCard) {
        newLogs.push(`獲得一般卡【${selectedCard.name}】納入理智牌庫！`);
      } else {
        newLogs.push(`跳過卡牌構築獎勵，維持牌庫精簡。`);
      }
      newLogs.push(`獲得古金幣 +${addedObols}（當前擁有: ${updatedInvestigator.obols} 枚）。`);
      if (isHealingToFull) {
        newLogs.push(
          `【首領決戰復甦】古老宿敵伏誅，威壓短暫退散。調查員身體生命值全額恢復至上限（${updatedInvestigator.maxHealth} / ${updatedInvestigator.maxHealth}）！`
        );
      } else {
        newLogs.push(`【肉體傷勢保留】當前生命值: ${updatedInvestigator.health} / ${updatedInvestigator.maxHealth}。`);
      }

      const nextEnemy = cloneEnemy(INITIAL_GHOUL);

      // Advance map if map is present, otherwise remain in combat
      const updatedMap = advanceMapAfterNode(state.map);
      const currentDepth = state.currentDepth ?? 1;
      const isFinalBoss = isBossFight && currentDepth >= 4;
      let nextPhase: GameState['phase'] = state.map ? 'map' : 'combat';
      if (isBossFight && state.map && !isFinalBoss) {
        nextPhase = 'depth_transition';
      }

      return {
        ...state,
        phase: nextPhase,
        turn: 1,
        investigator: updatedInvestigator,
        sanityDeck,
        hand,
        discardPile: [],
        isMadness: false,
        rewardCards: undefined,
        rewardObols: undefined,
        currentEnemy: nextEnemy,
        map: updatedMap,
        adventureStats: updatedStats,
        battleLog: [...newLogs, ...state.battleLog],
      };
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
        battleLog: ['返回標題畫面。請選擇調查員開始新的探險。'],
      };
    }

    case 'START_COMBAT': {
      const occId = action.payload?.investigator?.occupationId ?? state.investigator?.occupationId ?? 'investigator';
      const occ = OCCUPATIONS[occId] ?? OCCUPATIONS.investigator;
      const investigator = action.payload?.investigator
        ? { ...action.payload.investigator }
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
      const investigator: Investigator = {
        name: occ.name,
        occupation: occ.occupation,
        occupationId: occ.id,
        health: state.investigator?.maxHealth ?? occ.stats.health,
        maxHealth: state.investigator?.maxHealth ?? occ.stats.health,
        stamina: state.investigator?.maxStamina ?? occ.stats.stamina,
        maxStamina: state.investigator?.maxStamina ?? occ.stats.stamina,
        armor: 0,
        obols: state.investigator?.obols ?? occ.stats.obols,
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
        action.payload?.initialCards
      );
      const candidateEnemy = action.payload?.enemy ?? state.currentEnemy;
      const currentDepth = state.currentDepth ?? 1;
      const enemy = getFreshEnemyTemplate(candidateEnemy, state.map, currentDepth);

      return {
        phase: 'combat',
        currentDepth,
        turn: 1,
        investigator,
        sanityDeck,
        hand,
        discardPile: [],
        isMadness: false,
        currentEnemy: enemy,
        map: state.map,
        adventureStats: ensureAdventureStats(state),
        battleLog: [
          `重整戰鬥！調查員 ${investigator.name}（${investigator.occupation}）重新迎戰 ${enemy.name}！`,
        ],
      };
    }

    case 'PLAY_CARD': {
      if (state.phase !== 'combat') return state;

      const cardIndex = state.hand.findIndex((c) => c.id === action.payload.cardId);
      if (cardIndex === -1) return state;

      const card = state.hand[cardIndex];

      // Check cost
      if (card.costType === 'stamina' && state.investigator.stamina < card.costValue) {
        return {
          ...state,
          battleLog: [`精力不足！打出【${card.name}】需要 ${card.costValue} 點精力。`, ...state.battleLog],
        };
      }

      if (card.costType === 'sanity' && state.sanityDeck.length < card.costValue) {
        return {
          ...state,
          battleLog: [`理智不足！此禁忌秘術需要燃燒 ${card.costValue} 點理智。`, ...state.battleLog],
        };
      }

      // Deduct resource
      const newStamina =
        card.costType === 'stamina'
          ? state.investigator.stamina - card.costValue
          : state.investigator.stamina;

      let newSanityDeck = [...state.sanityDeck];
      // Keep existing discard pile separate to ensure restore_sanity only restores past discards
      const pastDiscardPile = [...state.discardPile];
      let newHand = state.hand.filter((_, idx) => idx !== cardIndex);

      if (card.costType === 'sanity') {
        const burned = newSanityDeck.slice(0, card.costValue);
        newSanityDeck = newSanityDeck.slice(card.costValue);
        pastDiscardPile.push(...burned);
      }

      let enemyHealth = state.currentEnemy.health;
      let enemyArmor = state.currentEnemy.armor;
      let investigatorHealth = state.investigator.health;
      let investigatorArmor = state.investigator.armor;
      const newLogs: string[] = [];

      // Execute card effects
      for (const effect of card.effects) {
        if (effect.type === 'damage') {
          const dmg = applyDamage({ health: enemyHealth, armor: enemyArmor }, effect.value);
          enemyHealth = dmg.newHealth;
          enemyArmor = dmg.newArmor;
          newLogs.push(`調查員打出【${card.name}】，對 ${state.currentEnemy.name} 造成 ${effect.value} 點傷害！`);
        } else if (effect.type === 'armor') {
          investigatorArmor += effect.value;
          newLogs.push(`調查員打出【${card.name}】，構築掩體獲得 ${effect.value} 點護甲！`);
        } else if (effect.type === 'draw') {
          const cardsNeeded = effect.value;
          if (cardsNeeded > 0) {
            if (state.isMadness || newSanityDeck.length === 0) {
              const madnessCards = createMadnessCards(cardsNeeded, state.turn, newHand.length);
              newHand = [...newHand, ...madnessCards];
              newLogs.push(`調查員打出【${card.name}】，在瘋狂狀態中自深淵攫取了 ${cardsNeeded} 張臨時黑色瘋狂卡！`);
            } else {
              const cardsToDraw = Math.min(newSanityDeck.length, cardsNeeded);
              const drawnCards = newSanityDeck.slice(0, cardsToDraw);
              newSanityDeck = newSanityDeck.slice(cardsToDraw);
              newHand = [...newHand, ...drawnCards];
              const cardNames = drawnCards.map((c) => `【${c.name}】`).join('、');
              newLogs.push(`調查員打出【${card.name}】，敏銳抽牌獲得 ${cardNames}！`);

              if (cardsToDraw < cardsNeeded && newSanityDeck.length === 0) {
                const deficit = cardsNeeded - cardsToDraw;
                const madnessCards = createMadnessCards(deficit, state.turn, newHand.length);
                newHand = [...newHand, ...madnessCards];
                newLogs.push(`【理智抽乾】抽牌庫見底！手牌缺額補入 ${deficit} 張臨時黑色瘋狂卡！`);
              }
            }
          }
        } else if (effect.type === 'heal') {
          investigatorHealth = Math.min(state.investigator.maxHealth, investigatorHealth + effect.value);
          newLogs.push(`調查員打出【${card.name}】，包紮傷口恢復 ${effect.value} 點生命！`);
        } else if (effect.type === 'restore_sanity') {
          const restoreCount = Math.min(pastDiscardPile.length, effect.value);
          if (restoreCount > 0) {
            const restoredCards: Card[] = [];
            for (let i = 0; i < restoreCount; i++) {
              const cardToRestore = pastDiscardPile.pop();
              if (cardToRestore) {
                restoredCards.push(cardToRestore);
              }
            }
            newSanityDeck.unshift(...restoredCards);
            const cardNames = restoredCards.map((c) => `【${c.name}】`).join('、');
            newLogs.push(`調查員打出【${card.name}】，平復焦躁的心智，將 ${cardNames} 洗回理智牌庫！`);
          } else {
            newLogs.push(`調查員打出【${card.name}】，但棄牌堆中尚無任何已棄卡牌可供洗回！`);
          }
        } else if (effect.type === 'erode_sanity') {
          const erodeCount = Math.min(newSanityDeck.length, effect.value);
          if (erodeCount > 0) {
            const eroded = newSanityDeck.slice(0, erodeCount);
            newSanityDeck = newSanityDeck.slice(erodeCount);
            pastDiscardPile.push(...eroded);
            newLogs.push(`受到理智侵蝕，自牌庫頂棄置了 ${erodeCount} 張卡牌！`);
          }
        } else if (effect.type === 'self_damage') {
          investigatorHealth = Math.max(0, investigatorHealth - effect.value);
          newLogs.push(`受到不可名狀的反噬傷害，自身損失 ${effect.value} 點肉體生命！`);
        } else if (effect.type === 'add_to_deck') {
          const injectedCards = createTruthInjectedCards(effect.value, state.turn);
          newSanityDeck.unshift(...injectedCards);
          newLogs.push(`調查員打出【${card.name}】，向理智牌庫注入了 ${effect.value} 張深淵真相卡牌！`);
        }
      }

      // If temporary card, it dissolves and is not put into discard pile
      const finalDiscardPile = card.isTemporary ? [...pastDiscardPile] : [...pastDiscardPile, card];

      // Check Madness transitions
      const madnessEval = evaluateMadnessTransition(state.isMadness, newSanityDeck.length);
      const isMadnessNow = madnessEval.isMadness;
      if (madnessEval.logMessage) {
        newLogs.push(madnessEval.logMessage);
      }

      // Check Victory / Defeat
      let phase: GameState['phase'] = state.phase;
      let stats = ensureAdventureStats(state);
      if (investigatorHealth <= 0) {
        phase = 'gameover';
        newLogs.unshift(`【調查員殞命】不可名狀的反噬耗盡了你最後一絲氣息，你倒在血泊中……`);
      } else if (enemyHealth <= 0) {
        phase = 'victory';
        stats = {
          ...stats,
          enemiesDefeated: stats.enemiesDefeated + 1,
        };
        newLogs.unshift(`【戰鬥勝利】${state.currentEnemy.name} 發出臨死的淒厲悲鳴，化為一灘腥臭的黑水消滅了！`);
      }

      return {
        ...state,
        phase,
        investigator: {
          ...state.investigator,
          stamina: newStamina,
          health: investigatorHealth,
          armor: investigatorArmor,
        },
        sanityDeck: newSanityDeck,
        hand: newHand,
        discardPile: finalDiscardPile,
        isMadness: isMadnessNow,
        currentEnemy: {
          ...state.currentEnemy,
          health: enemyHealth,
          armor: enemyArmor,
        },
        adventureStats: stats,
        battleLog: [...newLogs, ...state.battleLog],
      };
    }

    case 'END_TURN': {
      if (state.phase !== 'combat') return state;

      const enemy = state.currentEnemy;
      const intent = enemy.currentIntent;
      let investigatorHealth = state.investigator.health;
      let investigatorArmor = state.investigator.armor;
      let sanityDeck = [...state.sanityDeck];
      const discardPile = [...state.discardPile];
      const newLogs: string[] = [];

      // Enemy performs intent action
      if (intent.type === 'attack') {
        const dmg = applyDamage({ health: investigatorHealth, armor: investigatorArmor }, intent.value);
        investigatorHealth = dmg.newHealth;
        investigatorArmor = dmg.newArmor;

        if (dmg.absorbed > 0) {
          newLogs.push(`護甲替你抵擋了 ${dmg.absorbed} 點傷害（剩餘護甲: ${investigatorArmor}）。`);
        }
        if (dmg.effectiveDamage > 0) {
          newLogs.push(`${enemy.name} 施展【${intent.name}】，鋒利的爪牙重創了你，造成 ${dmg.effectiveDamage} 點肉體傷害！`);
        } else {
          newLogs.push(`${enemy.name} 施展【${intent.name}】，但被你的厚重護甲完全抵擋！`);
        }
      } else if (intent.type === 'erode') {
        const erodeCount = Math.min(sanityDeck.length, intent.value);
        if (erodeCount > 0) {
          const eroded = sanityDeck.slice(0, erodeCount);
          sanityDeck = sanityDeck.slice(erodeCount);
          discardPile.push(...eroded);
          newLogs.push(`${enemy.name} 施展精神恐懼，侵蝕了你 ${erodeCount} 點理智牌庫！`);
        } else {
          newLogs.push(`${enemy.name} 施展精神恐懼，但你的心智已徹底陷入瘋狂崩潰，無更多理智可被侵蝕！`);
        }
      }

      // Check GameOver
      if (investigatorHealth <= 0) {
        newLogs.unshift(`【調查員殞命】你的視線被血污模糊，氣力散盡倒在血泊中……未知之物將你吞噬。`);
        return {
          ...state,
          phase: 'gameover',
          adventureStats: ensureAdventureStats(state),
          investigator: {
            ...state.investigator,
            health: 0,
            armor: investigatorArmor,
          },
          battleLog: [...newLogs, ...state.battleLog],
        };
      }

      // Check madness state transition
      // Check madness state transition
      const madnessEval = evaluateMadnessTransition(state.isMadness, sanityDeck.length);
      let isMadnessNow = madnessEval.isMadness;
      if (madnessEval.logMessage) {
        newLogs.push(madnessEval.logMessage);
      }

      // Advance enemy intent sequence
      let nextIntentIndex = 0;
      let nextIntent: EnemyIntent = intent;
      if (enemy.intentSequence && enemy.intentSequence.length > 0) {
        nextIntentIndex = ((enemy.currentIntentIndex ?? 0) + 1) % enemy.intentSequence.length;
        nextIntent = enemy.intentSequence[nextIntentIndex];
      }

      const nextTurn = state.turn + 1;

      // Hand retention & refill to BASELINE_HAND_SIZE
      const currentHand = [...state.hand];
      const cardsNeeded = Math.max(0, BASELINE_HAND_SIZE - currentHand.length);
      let newHand = [...currentHand];
      let drawnCardsCount = 0;

      if (isMadnessNow && cardsNeeded > 0) {
        // In madness state, drawn cards are transformed into temporary black madness cards!
        const madnessCards = createMadnessCards(cardsNeeded, nextTurn, 0);
        newHand = [...currentHand, ...madnessCards];
        drawnCardsCount = cardsNeeded;
        newLogs.push(`【瘋狂抽牌】處於瘋狂狀態！深淵力量轉化為 ${cardsNeeded} 張臨時黑色瘋狂卡！`);
      } else if (cardsNeeded > 0) {
        const cardsToDraw = Math.min(sanityDeck.length, cardsNeeded);
        const drawnCards = sanityDeck.slice(0, cardsToDraw);
        sanityDeck = sanityDeck.slice(cardsToDraw);
        newHand = [...currentHand, ...drawnCards];
        drawnCardsCount = cardsToDraw;

        if (cardsToDraw < cardsNeeded && sanityDeck.length === 0) {
          isMadnessNow = true;
          const deficit = cardsNeeded - cardsToDraw;
          const madnessCards = createMadnessCards(deficit, nextTurn, 0);
          newHand = [...newHand, ...madnessCards];
          drawnCardsCount += deficit;
          newLogs.push(
            `【理智告急】理智牌庫已抽空！調查員進入「瘋狂狀態」，手牌缺額立即補入 ${deficit} 張臨時黑色瘋狂卡！`
          );
        } else if (sanityDeck.length === 0 && !isMadnessNow) {
          isMadnessNow = true;
          newLogs.push(`【理智告急】理智牌庫已抽空！調查員進入「瘋狂狀態」！`);
        }
      }

      newLogs.push(`回合結束。未打出的 ${currentHand.length} 張手牌予以保留，補抽 ${drawnCardsCount} 張卡牌。精力已重置回 ${state.investigator.maxStamina}。`);

      return {
        ...state,
        turn: nextTurn,
        investigator: {
          ...state.investigator,
          health: investigatorHealth,
          armor: investigatorArmor,
          stamina: state.investigator.maxStamina,
        },
        sanityDeck,
        hand: newHand,
        discardPile,
        isMadness: isMadnessNow,
        currentEnemy: {
          ...enemy,
          currentIntent: nextIntent,
          currentIntentIndex: nextIntentIndex,
        },
        battleLog: [...newLogs, ...state.battleLog],
      };
    }

    default:
      return state;
  }
}
