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
  fisherYatesShuffle,
} from './initialData';
import {
  cloneEnemy,
  getEncounterEnemy,
  getEnemyTemplateById,
  getBossByDepth,
} from './enemyCatalog';
import {
  createMadnessCards,
  ensureUniqueCardIds,
} from './cardFactory';
import { generateInvestigationMap, generateProceduralInvestigationMap } from './mapGenerator';
import {
  getMythosEventForNode,
  generateMarketItemsForDepth,
  TRUTH_CARD_BREAKWATER,
} from './eventData';
import { generateRewardCardsForDepth } from './cardTiers';
import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  ABYSSAL_FRAGMENT_3,
  hasBothAbyssalFragments,
  fuseAbyssalFragments,
  getAllPermanentCards,
  isCompleteAncientSeal,
} from './abyssalSeals';
import {
  evaluateCardPlay,
  evaluateMadnessTransition,
  applyDamage,
  type CardPlayContext,
  type DamageResult,
} from './cards';
import { applyRelicCombatStart, applyRelicToInvestigator, PRESET_RELICS } from './relics';
import {
  getFallenInvestigator,
  clearFallenInvestigator,
  saveFallenInvestigatorFromState,
  isInheritableCard,
} from './remainsInheritance';
import {
  addStatusEffect,
  calculateArmorGain,
  calculateAttackDamage,
  createStatusEffect,
  resolveTurnEndStatusEffects,
} from './statusEffects';

export const DEFAULT_HAND_CAPACITY = 2;

export { cloneEnemy };

/**
 * 將完整卡牌清單切分為起始手牌（預設 2 張）與理智牌庫（其餘張數）之共用純函式
 */
export function splitDeckToHandAndSanity(
  deck: Card[],
  handSize: number = DEFAULT_HAND_CAPACITY
): { hand: Card[]; sanityDeck: Card[] } {
  return {
    hand: deck.slice(0, handSize),
    sanityDeck: deck.slice(handSize),
  };
}

export { ensureUniqueCardIds };

/**
 * 戰鬥卡牌構建與洗牌純函式（消除重複代碼，支援洗牌覆寫以利確定性測試）
 */
export function setupCombatDeck(
  cards: Card[],
  occupationId: OccupationId = 'investigator',
  overrideDeck?: Card[],
  handCapacity: number = DEFAULT_HAND_CAPACITY
): { hand: Card[]; sanityDeck: Card[] } {
  if (overrideDeck && overrideDeck.length > 0) {
    return splitDeckToHandAndSanity(ensureUniqueCardIds(overrideDeck), handCapacity);
  }
  const permanentCards = cards.filter((c) => !c.isTemporary);
  const occ = OCCUPATIONS[occupationId] ?? OCCUPATIONS.investigator;
  const pool: Card[] = permanentCards.length > 0
    ? permanentCards
    : occ.deck.map((c) => ({ ...c }));
  const sanitizedPool = ensureUniqueCardIds(pool);
  const shuffledDeck = fisherYatesShuffle(sanitizedPool);

  // ADR-0015: 固有抽牌 - 身為真相卡的「完整的深淵古印」必定為第一張起手手牌
  const sealIdx = shuffledDeck.findIndex(isCompleteAncientSeal);
  if (sealIdx > 0) {
    const [sealCard] = shuffledDeck.splice(sealIdx, 1);
    shuffledDeck.unshift(sealCard);
  }

  return splitDeckToHandAndSanity(shuffledDeck, handCapacity);
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
  const handCapacity = customInvestigator?.handCapacity ?? occ.stats.handCapacity ?? DEFAULT_HAND_CAPACITY;
  const baseInvestigator = customInvestigator ?? {
    ...INITIAL_INVESTIGATOR,
    handCapacity,
  };
  const relicStart = applyRelicCombatStart(baseInvestigator, customInvestigator?.stamina ?? occ.stats.stamina);
  const investigator: Investigator = {
    ...baseInvestigator,
    handCapacity,
    armor: relicStart.armor,
    stamina: relicStart.stamina,
    statusEffects: relicStart.statusEffects,
    relics: baseInvestigator.relics ? [...baseInvestigator.relics] : [],
  };

  const enemy: Enemy = customEnemy
    ? cloneEnemy(customEnemy)
    : cloneEnemy(INITIAL_GHOUL);
  if (!enemy.statusEffects) {
    enemy.statusEffects = [];
  }

  const allCards: Card[] = customDeck
    ? [...customDeck]
    : occ.deck.map((c) => ({ ...c }));

  const { hand, sanityDeck } = splitDeckToHandAndSanity(allCards, handCapacity);

  const initialLogs = [
    ...relicStart.logs,
    `遭遇 ${enemy.name}（${enemy.title}）！惡臭與潮濕的黑暗籠罩四周，你握緊武器展開搏殺……`,
  ];

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
    battleLog: initialLogs,
    combatInitialHealth: investigator.health,
  };
}

/**
 * 戰鬥回合結束結算純函式：結算敵怪意圖、狂亂狀態、回合計數、精力重置，並依據手牌容量固定抽取卡牌
 */
export function resolveTurnEndAndFixedDraw(
  state: GameState,
  remainingHand: Card[],
  initialLogs: string[] = []
): GameState {
  const enemy = state.currentEnemy;
  const intent = enemy.currentIntent;
  let investigatorHealth = state.investigator.health;
  let investigatorArmor = state.investigator.armor;
  let enemyHealth = enemy.health;
  let enemyArmor = enemy.armor;
  let sanityDeck = [...state.sanityDeck];
  let discardPile = [...state.discardPile];
  const newLogs: string[] = [...initialLogs];

  let investigatorStatusEffects = state.investigator.statusEffects ? [...state.investigator.statusEffects] : [];
  let enemyStatusEffects = enemy.statusEffects ? [...enemy.statusEffects] : [];

  // Enemy performs intent action
  if (intent.type === 'attack') {
    const finalDamage = calculateAttackDamage(intent.value, enemyStatusEffects, investigatorStatusEffects);
    const dmg = applyDamage({ health: investigatorHealth, armor: investigatorArmor }, finalDamage);
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
  } else if (intent.type === 'defend') {
    const finalArmor = calculateArmorGain(intent.value, enemyStatusEffects);
    enemyArmor += finalArmor;
    newLogs.push(`${enemy.name} 施展【${intent.name}】，凝聚異質防護獲得 ${finalArmor} 點護甲！`);
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
  } else if (intent.type === 'apply_status' && intent.statusType) {
    const status = createStatusEffect(intent.statusType, intent.value);
    investigatorStatusEffects = addStatusEffect(investigatorStatusEffects, status);
    newLogs.push(`${enemy.name} 施展【${intent.name}】，向你施加了 ${intent.value} 層【${status.name}】印記！`);
  }

  // 結算回合結束狀態印記（流血生命扣減、恐慌理智侵蝕）與印記衰減
  const invStatusRes = resolveTurnEndStatusEffects(
    { health: investigatorHealth, sanityDeck, discardPile },
    investigatorStatusEffects,
    '調查員'
  );
  investigatorHealth = invStatusRes.newHealth;
  sanityDeck = invStatusRes.newSanityDeck;
  discardPile = invStatusRes.newDiscardPile;
  investigatorStatusEffects = invStatusRes.decayedEffects;
  newLogs.push(...invStatusRes.logs);

  const enemyStatusRes = resolveTurnEndStatusEffects(
    { health: enemyHealth },
    enemyStatusEffects,
    enemy.name
  );
  enemyHealth = enemyStatusRes.newHealth;
  const isDivineEnemy = Boolean(enemy.divineImmortality);
  if (isDivineEnemy && enemyHealth < 1) {
    enemyHealth = 1;
  }
  enemyStatusEffects = enemyStatusRes.decayedEffects;
  newLogs.push(...enemyStatusRes.logs);

  // Check GameOver / Victory
  if (investigatorHealth <= 0) {
    newLogs.unshift(`【調查員殞命】你的視線被血污模糊，神識散盡倒在血泊中……未知之物將你吞噬。`);
    const gameoverState: GameState = {
      ...state,
      phase: 'gameover',
      hand: remainingHand,
      sanityDeck,
      discardPile,
      discardPhase: undefined,
      adventureStats: ensureAdventureStats(state),
      investigator: {
        ...state.investigator,
        health: 0,
        armor: investigatorArmor,
        statusEffects: [],
      },
      battleLog: [...newLogs, ...state.battleLog],
    };
    saveFallenInvestigatorFromState(gameoverState, `遭${enemy.name}擊殺殞命`);
    return gameoverState;
  }

  if (enemyHealth <= 0) {
    newLogs.unshift(`【戰鬥勝利】${enemy.name} 在流血與創傷中發出臨死哀嚎，化為一灘黑水消滅了！`);
    const stats = ensureAdventureStats(state);
    return {
      ...state,
      phase: 'victory',
      discardPhase: undefined,
      investigator: {
        ...state.investigator,
        health: investigatorHealth,
        armor: investigatorArmor,
        statusEffects: [], // clear status effects on combat victory
      },
      currentEnemy: {
        ...enemy,
        health: 0,
        armor: enemyArmor,
        statusEffects: [],
      },
      adventureStats: {
        ...stats,
        enemiesDefeated: stats.enemiesDefeated + 1,
      },
      battleLog: [...newLogs, ...state.battleLog],
    };
  }

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
  const capacity = state.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;

  // Fixed draw of capacity cards
  let newHand = [...remainingHand];
  let drawnCardsCount = 0;

  if (isMadnessNow) {
    // In madness state, drawn cards are transformed into temporary black madness cards!
    const existingTurnMadnessCount = [
      ...remainingHand,
      ...sanityDeck,
      ...discardPile,
    ].filter((c) => c.id.startsWith(`temp_madness_t${nextTurn}_`)).length;
    const madnessCards = createMadnessCards(capacity, nextTurn, existingTurnMadnessCount);
    newHand = [...remainingHand, ...madnessCards];
    drawnCardsCount = capacity;
    newLogs.push(`【瘋狂抽牌】處於瘋狂狀態！深淵力量轉化為 ${capacity} 張臨時黑色瘋狂卡！`);
  } else {
    const cardsToDraw = Math.min(sanityDeck.length, capacity);
    const drawnCards = sanityDeck.slice(0, cardsToDraw);
    sanityDeck = sanityDeck.slice(cardsToDraw);
    newHand = [...remainingHand, ...drawnCards];
    drawnCardsCount = cardsToDraw;

    if (cardsToDraw < capacity && sanityDeck.length === 0) {
      isMadnessNow = true;
      const deficit = capacity - cardsToDraw;
      const existingTurnMadnessCount = [
        ...newHand,
        ...sanityDeck,
        ...discardPile,
      ].filter((c) => c.id.startsWith(`temp_madness_t${nextTurn}_`)).length;
      const madnessCards = createMadnessCards(deficit, nextTurn, existingTurnMadnessCount);
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

  newLogs.push(`回合結束。未打出的 ${remainingHand.length} 張手牌予以保留，固定抽取 ${drawnCardsCount} 張卡牌。精力已重置回 ${state.investigator.maxStamina}。`);

  return {
    ...state,
    turn: nextTurn,
    discardPhase: undefined,
    investigator: {
      ...state.investigator,
      health: investigatorHealth,
      armor: investigatorArmor,
      stamina: state.investigator.maxStamina,
      statusEffects: investigatorStatusEffects,
    },
    sanityDeck: ensureUniqueCardIds(sanityDeck),
    hand: ensureUniqueCardIds(newHand),
    discardPile,
    isMadness: isMadnessNow,
    currentEnemy: {
      ...enemy,
      health: enemyHealth,
      armor: enemyArmor,
      currentIntent: nextIntent,
      currentIntentIndex: nextIntentIndex,
      statusEffects: enemyStatusEffects,
    },
    battleLog: [...newLogs, ...state.battleLog],
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

        const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;

        if (action.payload.enemy) {
          enemy = cloneEnemy(action.payload.enemy);
        } else if (targetNode.enemyId) {
          const template = getEnemyTemplateById(targetNode.enemyId);
          enemy = template ? template : getEncounterEnemy(currentDepth, targetNode.type);
        } else {
          enemy = getEncounterEnemy(currentDepth, targetNode.type);
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
          marketItems: generateMarketItemsForDepth(state.currentDepth ?? state.map?.depth ?? 1),
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！進入黑市商鋪。`,
            ...state.battleLog,
          ],
        };
      }

      if (targetNode.type === 'altar') {
        return {
          ...state,
          phase: 'altar',
          map: updatedMap,
          altarUsed: false,
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！古老陰森的禁忌祭壇在前方矗立，幽藍冷火散發著陣陣寒意。`,
            ...state.battleLog,
          ],
        };
      }

      if (targetNode.type === 'vault') {
        const ownedRelicIds = new Set((state.investigator.relics || []).map((r) => r.id));
        const unowned = PRESET_RELICS.filter((r) => !ownedRelicIds.has(r.id));
        const candidates = unowned.length >= 3 ? unowned : PRESET_RELICS;
        const shuffled = [...candidates].sort(() => 0.5 - Math.random());
        const vaultRelics = shuffled.slice(0, 3);
        return {
          ...state,
          phase: 'vault',
          map: updatedMap,
          vaultRelics,
          vaultClaimed: false,
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！厚重的青銅巨門徐徐開啟，遺物秘閣內陳列著太古法器。`,
            ...state.battleLog,
          ],
        };
      }

      if (targetNode.type === 'blood_altar') {
        return {
          ...state,
          phase: 'blood_altar',
          map: updatedMap,
          bloodAltarUsed: false,
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！血之祭壇前刻劃著純淨之契，可用自身鮮血為媒介淨化理智牌庫。`,
            ...state.battleLog,
          ],
        };
      }

      if (targetNode.type === 'remains') {
        const fallen = getFallenInvestigator();
        return {
          ...state,
          phase: 'remains',
          map: updatedMap,
          fallenInvestigator: fallen,
          remainsClaimed: false,
          adventureStats: updatedStats,
          battleLog: [
            `探索【${targetNode.title}】！在迷霧與碎石間發現了前代殉職調查員的殘破骸骨與行囊。`,
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
      let newDiscardPile = [...state.discardPile];
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
        saveFallenInvestigatorFromState(state, `於奇遇【${state.currentEvent?.title ?? '未知奇遇'}】中傷重不治`);
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
          ...newDiscardPile,
        ];
        const handCapacity = updatedInvestigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
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
          combatInitialHealth: updatedInvestigator.health,
        };
      }

      return {
        ...state,
        investigator: updatedInvestigator,
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

      const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
      const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;
      const isMidDepthHaven = Boolean(currentNode?.layer === 8 && currentDepth <= 3);
      const healAmount = isMidDepthHaven ? 15 : 8;

      if (optionId === 'bandage') {
        const oldHealth = newHealth;
        newHealth = Math.min(state.investigator.maxHealth, newHealth + healAmount);
        const actualHealed = newHealth - oldHealth;
        const havenPrefix = isMidDepthHaven ? '【第 8 層中繼避難所】' : '';
        const havenActionText = isMidDepthHaven ? '進行重度休整與外科縫合' : '深層包紮';

        if (state.investigator.obols >= 5) {
          newObols = state.investigator.obols - 5;
          newLogs.push(
            `${havenPrefix}在避難所消耗 5 枚古金幣購置急救藥品與防腐繃帶，${havenActionText}恢復了 ${actualHealed} 點肉體生命值（當前生命值: ${newHealth} / ${state.investigator.maxHealth}，剩餘古金幣: ${newObols} 枚）。`
          );
        } else {
          if (newSanityDeck.length > 0) {
            newSanityDeck = newSanityDeck.slice(1);
          }
          newLogs.push(
            `${havenPrefix}因古金幣不足，調查員忍受劇痛強行縫合創口，損耗 1 點理智，${havenActionText}恢復了 ${actualHealed} 點肉體生命值（當前生命值: ${newHealth} / ${state.investigator.maxHealth}）。`
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
      const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;
      const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
      const isBossFight = currentNode?.type === 'boss';
      const isElite = currentNode?.type === 'elite';

      // ADR-0015: 第三深度首領戰勝分歧
      if (isBossFight && currentDepth === 3) {
        if (!hasBothAbyssalFragments(state)) {
          // 未湊齊前兩枚殘片：直接進入普通結局（Arkham Gazette）
          const updatedMap = advanceMapAfterNode(state.map);
          const currentPermanentCards = getAllPermanentCards(state);
          const resetDeck = action.payload?.shuffledDeck
            ? [...action.payload.shuffledDeck]
            : fisherYatesShuffle(currentPermanentCards);
          const handCapacity = state.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
          const { hand, sanityDeck } = splitDeckToHandAndSanity(resetDeck, handCapacity);
          clearFallenInvestigator();
          return {
            ...state,
            phase: 'map',
            map: updatedMap ? { ...updatedMap, isCompleted: true } : undefined,
            investigator: {
              ...state.investigator,
              health: state.investigator.maxHealth,
              armor: 0,
              stamina: state.investigator.maxStamina,
            },
            sanityDeck,
            hand,
            discardPile: [],
            isMadness: false,
            rewardCards: undefined,
            rewardObols: undefined,
            battleLog: [
              '【阿卡姆常規終局】第三深度原生巨型修格斯伏誅！未湊齊深淵古印殘片，深淵裂隙漸漸平息，調查員逃離深淵……',
              ...state.battleLog,
            ],
          };
        } else {
          // 持有前兩枚殘片：解鎖第三殘片，三殘片共鳴融合為白色真相卡「完整的深淵古印」，解鎖第四深度！
          const currentPermanentCards = getAllPermanentCards(state);
          const withFrag3 = [...currentPermanentCards, { ...ABYSSAL_FRAGMENT_3 }];
          const { newDeck } = fuseAbyssalFragments(withFrag3);
          const rewardCards = action.payload?.rewardCards ?? generateRewardCardsForDepth(3, true);
          const rewardObols = action.payload?.rewardObols ?? 50;

          return {
            ...state,
            phase: 'reward',
            abyssalSealFused: true,
            sanityDeck: newDeck,
            hand: [],
            discardPile: [],
            rewardCards,
            rewardObols,
            battleLog: [
              '【白色真理共鳴】第三深度原生巨型修格斯崩解！三枚深淵封印殘片劇烈震顫、光芒大盛，融合為至高真理【完整的深淵古印】！通往第四深度的虛空裂隙已然開闢！',
              `戰鬥結算：獲得 ${rewardObols} 古金幣！請挑選 1 張專屬第四階構築卡牌或跳過以精簡牌庫。`,
              ...state.battleLog,
            ],
          };
        }
      }

      const baseObols = isBossFight ? 50 : isElite ? 25 : 15;
      const rewardObols = action.payload?.rewardObols ?? baseObols;
      const rewardCards =
        action.payload?.rewardCards ?? generateRewardCardsForDepth(currentDepth, isBossFight);

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
      const currentPermanentCards = getAllPermanentCards(state);

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

      const isBossFight = Boolean(state.map?.currentNodeId && state.map.nodes[state.map.currentNodeId]?.type === 'boss');

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

      const { hand, sanityDeck } = splitDeckToHandAndSanity(resetDeck, updatedInvestigator.handCapacity ?? DEFAULT_HAND_CAPACITY);

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
      if (isBossFight && state.map) {
        if (currentDepth === 3 && !state.abyssalSealFused) {
          nextPhase = 'map';
          if (updatedMap) updatedMap.isCompleted = true;
          clearFallenInvestigator();
        } else if (!isFinalBoss) {
          nextPhase = 'depth_transition';
        }
      }

      if (isFinalBoss) {
        clearFallenInvestigator();
      }

      return {
        ...state,
        phase: nextPhase,
        isTrueEnding: Boolean(state.isTrueEnding || isFinalBoss),
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
        combatInitialHealth: undefined,
      };
    }

    case 'CLAIM_FIELD_DRESSING': {
      if (state.phase !== 'reward') return state;

      const currentPermanentCards = getAllPermanentCards(state);
      const newPermanentDeck = [...currentPermanentCards];

      const addedObols = state.rewardObols ?? 15;
      const currentStats = ensureAdventureStats(state);
      const updatedStats: AdventureStats = {
        ...currentStats,
        totalObolsCollected: currentStats.totalObolsCollected + addedObols,
      };

      const isBossFight = Boolean(state.map?.currentNodeId && state.map.nodes[state.map.currentNodeId]?.type === 'boss');
      const isHealingToFull = Boolean(isBossFight);
      const healAmount = action.payload?.healAmount ?? 4;
      const nextHealth = isHealingToFull
        ? state.investigator.maxHealth
        : Math.min(state.investigator.maxHealth, state.investigator.health + healAmount);
      const actualHealed = nextHealth - state.investigator.health;

      const updatedInvestigator: Investigator = {
        ...state.investigator,
        health: nextHealth,
        armor: 0,
        stamina: state.investigator.maxStamina,
        obols: state.investigator.obols + addedObols,
      };

      const resetDeck = action.payload?.shuffledDeck
        ? [...action.payload.shuffledDeck]
        : fisherYatesShuffle(newPermanentDeck);

      const { hand, sanityDeck } = splitDeckToHandAndSanity(resetDeck, updatedInvestigator.handCapacity ?? DEFAULT_HAND_CAPACITY);

      const newLogs: string[] = [];
      newLogs.push(`戰後重整：所有一般卡洗回理智牌庫，理智回滿至 ${newPermanentDeck.length} 點。戰鬥臨時卡已消散。`);
      if (isHealingToFull) {
        newLogs.push(
          `【首領決戰復甦】古老宿敵伏誅，威壓短暫退散。調查員身體生命值全額恢復至上限（${updatedInvestigator.maxHealth} / ${updatedInvestigator.maxHealth}）！`
        );
      } else {
        newLogs.push(
          `【戰地應急包紮】放棄卡牌構築，專注縫合撕裂傷勢。身體生命值恢復 +${actualHealed} 點（當前生命值: ${updatedInvestigator.health} / ${updatedInvestigator.maxHealth}）。`
        );
      }
      newLogs.push(`獲得古金幣 +${addedObols}（當前擁有: ${updatedInvestigator.obols} 枚）。`);

      const nextEnemy = cloneEnemy(INITIAL_GHOUL);

      const updatedMap = advanceMapAfterNode(state.map);
      const currentDepth = state.currentDepth ?? 1;
      const isFinalBoss = isBossFight && currentDepth >= 4;
      let nextPhase: GameState['phase'] = state.map ? 'map' : 'combat';
      if (isBossFight && state.map) {
        if (currentDepth === 3 && !state.abyssalSealFused) {
          nextPhase = 'map';
          if (updatedMap) updatedMap.isCompleted = true;
          clearFallenInvestigator();
        } else if (!isFinalBoss) {
          nextPhase = 'depth_transition';
        }
      }

      if (isFinalBoss) {
        clearFallenInvestigator();
      }

      return {
        ...state,
        phase: nextPhase,
        isTrueEnding: Boolean(state.isTrueEnding || isFinalBoss),
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
        combatInitialHealth: undefined,
      };
    }

    case 'CLAIM_ABYSSAL_SEAL': {
      if (state.phase !== 'reward') return state;
      const currentDepth = state.currentDepth ?? state.map?.depth ?? 1;
      const currentNode = state.map?.currentNodeId ? state.map.nodes[state.map.currentNodeId] : undefined;
      const isBossFight = currentNode?.type === 'boss';

      if (!isBossFight || (currentDepth !== 1 && currentDepth !== 2)) {
        return state;
      }

      const fragmentCard: Card = currentDepth === 1
        ? { ...ABYSSAL_FRAGMENT_1 }
        : { ...ABYSSAL_FRAGMENT_2 };

      const currentPermanentCards = getAllPermanentCards(state);
      const newPermanentDeck = [...currentPermanentCards, fragmentCard];

      const currentStats = ensureAdventureStats(state);
      const updatedStats: AdventureStats = {
        ...currentStats,
      };

      const updatedInvestigator: Investigator = {
        ...state.investigator,
        health: state.investigator.maxHealth,
        armor: 0,
        stamina: state.investigator.maxStamina,
      };

      const resetDeck = action.payload?.shuffledDeck
        ? [...action.payload.shuffledDeck]
        : fisherYatesShuffle(newPermanentDeck);

      const { hand, sanityDeck } = splitDeckToHandAndSanity(resetDeck, updatedInvestigator.handCapacity ?? DEFAULT_HAND_CAPACITY);
      const updatedMap = advanceMapAfterNode(state.map);

      const newLogs: string[] = [
        `【承受深淵封印】調查員放棄常規構築獎勵與古金幣，自首領殘骸中拾取【${fragmentCard.name}】！漆黑詛咒烙印在理智深處。`,
        `【首領決戰復甦】古老宿敵伏誅，威壓短暫退散。調查員身體生命值全額恢復至上限（${updatedInvestigator.maxHealth} / ${updatedInvestigator.maxHealth}）！`,
        `戰後重整：所有一般卡（含深淵封印殘片）洗回理智牌庫，理智回滿至 ${newPermanentDeck.length} 點。`,
      ];

      return {
        ...state,
        phase: 'depth_transition',
        turn: 1,
        investigator: updatedInvestigator,
        sanityDeck,
        hand,
        discardPile: [],
        isMadness: false,
        rewardCards: undefined,
        rewardObols: undefined,
        currentEnemy: cloneEnemy(INITIAL_GHOUL),
        map: updatedMap,
        adventureStats: updatedStats,
        battleLog: [...newLogs, ...state.battleLog],
        combatInitialHealth: undefined,
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
        isMadness: false,
        currentEnemy: enemy,
        map: state.map,
        adventureStats: ensureAdventureStats(state),
        battleLog: [...resetLogs, ...state.battleLog],
        abyssalSealFused: state.abyssalSealFused,
        combatInitialHealth: state.combatInitialHealth ?? restoredHealth,
        discardPhase: undefined,
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
        turn: state.turn,
        isMadness: state.isMadness,
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

      // 若未打出手牌數量大於手牌容量上限，切換至主動棄牌階段
      if (state.hand.length > capacity) {
        const requiredDiscardCount = state.hand.length - capacity;
        return {
          ...state,
          discardPhase: {
            requiredDiscardCount,
            selectedDiscardIds: [],
          },
          battleLog: [
            `【手牌超出容量】未打出手牌（${state.hand.length} 張）超出容量上限（${capacity} 張），請挑選並棄置 ${requiredDiscardCount} 張卡牌。`,
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
      const requiredDiscardCount = state.hand.length - capacity;

      return executeCardDiscardAndAdvanceTurn(state, cardIdsToDiscard, requiredDiscardCount);
    }

    case 'DISCARD_CARDS_TO_LIMIT': {
      if (state.phase !== 'combat') return state;
      const cardIdsToDiscard = action.payload.cardIds;
      const capacity = state.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
      const requiredDiscardCount = Math.max(0, state.hand.length - capacity);

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
      if (state.phase !== 'altar' || state.altarUsed) return state;
      const { optionId, costType } = action.payload;
      let newHealth = state.investigator.health;
      let newMaxHealth = state.investigator.maxHealth;
      let newHandCapacity = state.investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
      let updatedRelics = [...(state.investigator.relics || [])];
      let newObols = state.investigator.obols;
      let newSanityDeck = [...state.sanityDeck];
      const newLogs: string[] = [];

      if (optionId === 'flesh') {
        if (newHealth <= 6) return state;
        newHealth = newHealth - 6;
        newMaxHealth = newMaxHealth + 5;
        newHealth = Math.min(newMaxHealth, newHealth + 5);
        newLogs.push(
          `在禁忌祭壇割破血肉完成誓約，承受 6 點傷害，最大生命值永久提升 5 點（當前生命值: ${newHealth} / ${newMaxHealth}）！`
        );
      } else if (optionId === 'mind') {
        if (costType === 'sanity') {
          if (newSanityDeck.length <= 2) return state;
          const consumedCards = newSanityDeck.slice(0, 2);
          newSanityDeck = newSanityDeck.slice(2);
          newHandCapacity = newHandCapacity + 1;
          newLogs.push(
            `在禁忌祭壇承受理智撕裂侵蝕，損耗 2 點理智（自牌庫永久除役【${consumedCards.map((c) => c.name).join('】與【')}】），手牌容量永久提升 1 點（當前抽牌與保留上限: ${newHandCapacity} 張）！`
          );
        } else {
          if (newHealth <= 10) return state;
          newHealth = newHealth - 10;
          newHandCapacity = newHandCapacity + 1;
          newLogs.push(
            `在禁忌祭壇忍受神經撕裂劇痛，承受 10 點傷害，手牌容量永久提升 1 點（當前抽牌與保留上限: ${newHandCapacity} 張）！`
          );
        }
      } else if (optionId === 'boon') {
        if (newHealth <= 6) return state;
        newHealth = newHealth - 6;
        const ownedIds = new Set(updatedRelics.map((r) => r.id));
        const unowned = PRESET_RELICS.filter((r) => !ownedIds.has(r.id));
        if (unowned.length > 0) {
          const chosenRelic = unowned[Math.floor(Math.random() * unowned.length)];
          const invWithRelic = applyRelicToInvestigator(
            {
              ...state.investigator,
              health: newHealth,
              maxHealth: newMaxHealth,
              handCapacity: newHandCapacity,
              relics: updatedRelics,
            },
            chosenRelic
          );
          newHealth = invWithRelic.health;
          newMaxHealth = invWithRelic.maxHealth;
          newHandCapacity = invWithRelic.handCapacity ?? newHandCapacity;
          updatedRelics = invWithRelic.relics ?? updatedRelics;
          newLogs.push(`在禁忌祭壇獻祭鮮血，獲得舊日恩賜遺物【${chosenRelic.name}】！${chosenRelic.description}`);
        } else {
          newObols += 35;
          newLogs.push(`在禁忌祭壇獻祭鮮血，舊日微光賜予你 35 枚古金幣！`);
        }
      }

      return {
        ...state,
        investigator: {
          ...state.investigator,
          health: newHealth,
          maxHealth: newMaxHealth,
          handCapacity: newHandCapacity,
          relics: updatedRelics,
          obols: newObols,
        },
        sanityDeck: newSanityDeck,
        altarUsed: true,
        battleLog: newLogs.concat(state.battleLog),
      };
    }

    case 'LEAVE_ALTAR': {
      if (state.phase !== 'altar') return state;
      const updatedMap = advanceMapAfterNode(state.map);
      return {
        ...state,
        phase: 'map',
        map: updatedMap,
        altarUsed: undefined,
        battleLog: ['告別禁忌祭壇，重回阿卡姆調查地圖。', ...state.battleLog],
      };
    }

    case 'CLAIM_VAULT_RELIC': {
      if (state.phase !== 'vault' || state.vaultClaimed) return state;
      const { relicId, claimObols } = action.payload;
      const newLogs: string[] = [];
      let updatedInvestigator = { ...state.investigator };
      const currentStats = ensureAdventureStats(state);
      let updatedStats = currentStats;

      if (claimObols) {
        updatedInvestigator.obols += 35;
        updatedStats = {
          ...currentStats,
          totalObolsCollected: currentStats.totalObolsCollected + 35,
        };
        newLogs.push(`在遺物秘閣中搜括暗格，獲得了 35 枚古金幣！`);
      } else if (relicId) {
        const targetRelic =
          (state.vaultRelics || []).find((r) => r.id === relicId) ||
          PRESET_RELICS.find((r) => r.id === relicId);
        if (targetRelic) {
          updatedInvestigator = applyRelicToInvestigator(updatedInvestigator, targetRelic);
          newLogs.push(`在遺物秘閣中選取了【${targetRelic.name}】收入行囊！${targetRelic.description}`);
        }
      }

      return {
        ...state,
        investigator: updatedInvestigator,
        vaultClaimed: true,
        adventureStats: updatedStats,
        battleLog: newLogs.concat(state.battleLog),
      };
    }

    case 'LEAVE_VAULT': {
      if (state.phase !== 'vault') return state;
      const updatedMap = advanceMapAfterNode(state.map);
      return {
        ...state,
        phase: 'map',
        map: updatedMap,
        vaultRelics: undefined,
        vaultClaimed: undefined,
        battleLog: ['離開遺物秘閣，青銅巨門在身後轟然闔上。', ...state.battleLog],
      };
    }

    case 'SACRIFICE_CARDS_AT_BLOOD_ALTAR': {
      if (state.phase !== 'blood_altar' || state.bloodAltarUsed) return state;
      const cardIds = action.payload.cardIds;
      if (!cardIds || cardIds.length !== 2) return state;
      const idSet = new Set(cardIds);
      if (idSet.size !== 2) return state;

      const permanentCards = getAllPermanentCards(state);
      if (permanentCards.length - cardIds.length < 2) {
        return state;
      }

      const purgedNames: string[] = [];
      const remainingCards = permanentCards.filter((c) => {
        if (idSet.has(c.id)) {
          purgedNames.push(c.name);
          return false;
        }
        return true;
      });

      if (remainingCards.length !== permanentCards.length - 2) {
        return state;
      }

      return {
        ...state,
        sanityDeck: remainingCards,
        hand: [],
        discardPile: [],
        bloodAltarUsed: true,
        battleLog: [
          `在血之祭壇燃起淨化血火，將【${purgedNames.join('】與【')}】自理智牌庫中永久除役！`,
          ...state.battleLog,
        ],
      };
    }

    case 'LEAVE_BLOOD_ALTAR': {
      if (state.phase !== 'blood_altar') return state;
      const updatedMap = advanceMapAfterNode(state.map);
      return {
        ...state,
        phase: 'map',
        map: updatedMap,
        bloodAltarUsed: undefined,
        battleLog: ['離開血之祭壇，牌庫精簡洗鍊，神識重歸清明。', ...state.battleLog],
      };
    }

    case 'INHERIT_REMAINS': {
      if (state.phase !== 'remains' || state.remainsClaimed) return state;
      const fallen = state.fallenInvestigator;
      if (!fallen) return state;

      const newLogs: string[] = [];
      let updatedInvestigator = { ...state.investigator };
      let newSanityDeck = [...state.sanityDeck];
      const currentStats = ensureAdventureStats(state);
      let updatedStats = currentStats;

      if (action.payload.type === 'card') {
        const cardId = action.payload.cardId;
        const targetCard = fallen.deck.find((c) => c.id === cardId);
        if (targetCard && isInheritableCard(targetCard)) {
          const inheritedCard: Card = {
            ...targetCard,
            id: `${targetCard.id}_inherited_${Date.now()}`,
            isTemporary: false,
          };
          newSanityDeck.push(inheritedCard);
          newLogs.push(
            `撫摸著枯骨旁沾血的筆記，繼承了前人遺留的卡牌【${targetCard.name}】納入理智牌庫！`
          );
        }
      } else if (action.payload.type === 'obols') {
        const inheritedObols = Math.max(15, Math.floor(fallen.obols * 0.5));
        updatedInvestigator = {
          ...updatedInvestigator,
          obols: updatedInvestigator.obols + inheritedObols,
        };
        updatedStats = {
          ...currentStats,
          totalObolsCollected: currentStats.totalObolsCollected + inheritedObols,
        };
        newLogs.push(`自前代殉職調查員的殘破行囊中，拾取了 ${inheritedObols} 枚殘存古金幣。`);
      }

      clearFallenInvestigator();

      return {
        ...state,
        investigator: updatedInvestigator,
        sanityDeck: newSanityDeck,
        remainsClaimed: true,
        adventureStats: updatedStats,
        battleLog: newLogs.concat(state.battleLog),
      };
    }

    case 'LEAVE_REMAINS': {
      if (state.phase !== 'remains') return state;
      clearFallenInvestigator();
      const updatedMap = advanceMapAfterNode(state.map);
      return {
        ...state,
        phase: 'map',
        map: updatedMap,
        fallenInvestigator: undefined,
        remainsClaimed: undefined,
        battleLog: ['向殉職前輩的骸骨致敬默哀後，調查員背起行囊繼續踏入迷霧。', ...state.battleLog],
      };
    }

    default:
      return state;
  }
}

