import type { Card, DepthLevel, Enemy, Investigator, MapNode, MapNodeType, Relic } from '../../types/game';
import { INITIAL_INVESTIGATOR } from '../initialData';
import { generateProceduralInvestigationMap } from '../mapGenerator';
import { getEncounterEnemy, getEnemyTemplateById } from '../enemyCatalog';
import { simulateCombat } from './combatSimulator';
import { CardRegistry } from '../cards/registry';
import { ensureUniqueCardIds } from '../cardFactory';
import { applyRelicToInvestigator, PRESET_RELICS } from '../relics';
import { MYTHOS_EVENTS } from '../eventData';
import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  ABYSSAL_FRAGMENT_3,
} from '../abyssalSeals';
import {
  type AgentPersona,
  type AgentPersonaType,
  getAgentPersona,
  evaluateRewardChoice,
  evaluateSanctuaryChoice,
  evaluateMarketChoice,
  evaluatePathChoice,
  evaluateEventChoice,
  isBasicStarterCard,
  type EvaluationContext,
  type RewardChoiceOption,
  type SanctuaryChoiceOption,
  type MarketChoiceOption,
} from './agentPersona';

export interface SliceRolloutConfig {
  sliceId: number;
  depth: DepthLevel;
  startLayer: number;
  endLayer: number;
  persona: AgentPersona | AgentPersonaType;
  seed: number;
  initialInvestigator?: Partial<Investigator>;
  initialDeck?: Card[];
  initialRelics?: Relic[];
  occupation?: 'investigator' | 'occultist';
}

export interface NodeVisitRecord {
  nodeId: string;
  layer: number;
  col: number;
  type: MapNodeType;
  label: string;
}

export interface DecisionLogRecord {
  layer: number;
  nodeType: MapNodeType;
  actionTaken: string;
  deltaHp: number;
  deltaObols: number;
}

export interface CombatRecord {
  enemyId: string;
  enemyName: string;
  enemyRole: 'normal' | 'elite' | 'boss';
  depth: DepthLevel;
  healthLost: number;
  investigatorHpRemaining: number;
  turnsTaken: number;
  outcome: 'victory' | 'defeat' | 'timeout';
  deckSize: number;
}

export interface CardRewardRecord {
  offeredCardIds: string[];
  chosenType: 'card' | 'bandage' | 'skip' | 'seal_fragment';
  chosenCardId?: string;
}

export interface PathChoiceRecord {
  pair: string;
  label: string;
  choiceA: string;
  choiceB: string;
  pickedA: boolean;
}

export interface IntraNodeChoiceRecord {
  category: 'reward' | 'sanctuary' | 'market' | 'event';
  action: string;
  deltaHp: number;
  deltaObols: number;
}

export interface SliceRolloutResult {
  sliceId: number;
  success: boolean;
  investigator: Investigator;
  finalDeck: Card[];
  finalRelics: Relic[];
  combatsFought: number;
  combatsWon: number;
  combatHpLoss: number;
  netHpLoss: number;
  madnessTurnsTotal: number;
  nodesVisited: NodeVisitRecord[];
  decisionLogs: DecisionLogRecord[];
  combatRecords: CombatRecord[];
  cardRewards: CardRewardRecord[];
  pathChoices: PathChoiceRecord[];
  intraNodeChoices: IntraNodeChoiceRecord[];
  fatalEncounter?: {
    nodeId: string;
    enemyId?: string;
    enemyName?: string;
    layer: number;
  };
}

/**
 * 簡易偽隨機生成器 (Mulberry32)
 */
export function createPrng(seed: number): () => number {
  let s = (seed ^ 0x12345678) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface NodeResolutionContext {
  depth: DepthLevel;
  currentLayer: number;
  persona: AgentPersona;
  occupation: 'investigator' | 'occultist';
  rng: () => number;
}

interface NodeResolutionResult {
  investigator: Investigator;
  deck: Card[];
  relics: Relic[];
  logAction: string;
  isFatal?: boolean;
  fatalEncounter?: SliceRolloutResult['fatalEncounter'];
  intraNodeChoice?: IntraNodeChoiceRecord;
  combatMetrics?: {
    hpLossInCombat: number;
    isMadness: boolean;
    isVictory: boolean;
    combatRecord: CombatRecord;
    cardRewardRecord?: CardRewardRecord;
  };
}

function resolveCombatNode(
  node: MapNode,
  investigator: Investigator,
  deck: Card[],
  relics: Relic[],
  ctx: NodeResolutionContext
): NodeResolutionResult {
  const { depth, currentLayer, persona, occupation, rng } = ctx;
  const combatRole: 'combat' | 'elite' | 'boss' =
    node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'combat';
  let enemy: Enemy;
  if (node.enemyId) {
    const template = getEnemyTemplateById(node.enemyId);
    enemy = template ? template : getEncounterEnemy(depth, combatRole, rng);
  } else {
    enemy = getEncounterEnemy(depth, combatRole, rng);
  }

  const combatRes = simulateCombat({
    deck,
    relics,
    enemy,
    investigator,
    policyMode: 'optimal',
    randomFn: rng,
  });

  const hpLossInCombat = combatRes.healthLost;
  const updatedInvestigator: Investigator = {
    ...investigator,
    health: combatRes.investigatorHealthRemaining,
    armor: 0,
    statusEffects: [],
  };

  const combatRecord: CombatRecord = {
    enemyId: enemy.id,
    enemyName: enemy.name,
    enemyRole: node.type === 'boss' ? 'boss' : node.type === 'elite' ? 'elite' : 'normal',
    depth,
    healthLost: hpLossInCombat,
    investigatorHpRemaining: updatedInvestigator.health,
    turnsTaken: combatRes.turns,
    outcome: combatRes.outcome,
    deckSize: deck.length,
  };

  if (combatRes.outcome !== 'victory' || updatedInvestigator.health <= 0) {
    updatedInvestigator.health = 0;
    return {
      investigator: updatedInvestigator,
      deck,
      relics,
      isFatal: true,
      fatalEncounter: {
        nodeId: node.id,
        enemyId: enemy.id,
        enemyName: enemy.name,
        layer: currentLayer,
      },
      logAction: `戰鬥陣亡: 遭【${enemy.name}】致命擊破`,
      combatMetrics: {
        hpLossInCombat,
        isMadness: combatRes.isMadness,
        isVictory: false,
        combatRecord,
      },
    };
  }

  const baseObols = node.type === 'boss' ? 50 : node.type === 'elite' ? 25 : 15;
  updatedInvestigator.obols += baseObols;

  const rewardCards = CardRegistry.generateRewardCards({
    depth,
    isBoss: node.type === 'boss',
    count: 3,
    occupationId: occupation,
    randomFn: rng,
  });

  const rewardOptions: RewardChoiceOption[] = [
    ...rewardCards.map((c) => ({ type: 'card' as const, card: c })),
    { type: 'bandage' as const, healAmount: 12 },
    { type: 'skip' as const, obols: 5 },
  ];

  let fragmentCard: Card | undefined = undefined;
  if (node.type === 'boss') {
    fragmentCard = depth === 1 ? { ...ABYSSAL_FRAGMENT_1 } : depth === 2 ? { ...ABYSSAL_FRAGMENT_2 } : { ...ABYSSAL_FRAGMENT_3 };
    rewardOptions.push({
      type: 'seal_fragment',
      fragmentCard,
    });
  }

  const evalCtx: EvaluationContext = {
    investigator: updatedInvestigator,
    sanityDeck: deck,
    currentDepth: depth,
    currentLayer,
  };

  const chosenReward = evaluateRewardChoice(persona, rewardOptions, evalCtx, rng);
  const cardRewardRecord: CardRewardRecord = {
    offeredCardIds: rewardCards.map((c) => c.id),
    chosenType: chosenReward.type,
    chosenCardId:
      chosenReward.type === 'seal_fragment' && chosenReward.fragmentCard
        ? chosenReward.fragmentCard.id
        : chosenReward.type === 'card' && chosenReward.card
        ? chosenReward.card.id
        : undefined,
  };

  let updatedDeck = deck;
  let logAction = '';
  let intraNodeChoice: IntraNodeChoiceRecord;

  if (chosenReward.type === 'card' && chosenReward.card) {
    updatedDeck = ensureUniqueCardIds([...updatedDeck, { ...chosenReward.card }]);
    logAction = `戰勝【${enemy.name}】(+${baseObols} 古金幣)，挑選卡牌【${chosenReward.card.name}】`;
    intraNodeChoice = {
      category: 'reward',
      action: `卡牌構築: 挑選【${chosenReward.card.name}】`,
      deltaHp: 0,
      deltaObols: baseObols,
    };
  } else if (chosenReward.type === 'bandage') {
    const heal = Math.min(updatedInvestigator.maxHealth - updatedInvestigator.health, 12);
    updatedInvestigator.health += heal;
    logAction = `戰勝【${enemy.name}】(+${baseObols} 古金幣)，選擇戰地包紮 (+${heal} 生命值)`;
    intraNodeChoice = {
      category: 'reward',
      action: '戰後選擇: 【戰地包紮】',
      deltaHp: heal,
      deltaObols: baseObols,
    };
  } else if (chosenReward.type === 'seal_fragment' && chosenReward.fragmentCard) {
    const frag = chosenReward.fragmentCard;
    updatedDeck = ensureUniqueCardIds([...updatedDeck, { ...frag }]);
    logAction = `戰勝【${enemy.name}】(+${baseObols} 古金幣)，承受深淵封印殘片【${frag.name}】`;
    intraNodeChoice = {
      category: 'reward',
      action: '戰後選擇: 【承受深淵封印殘片 (Boss)】',
      deltaHp: 0,
      deltaObols: baseObols,
    };
  } else {
    updatedInvestigator.obols += 5;
    logAction = `戰勝【${enemy.name}】(+${baseObols} 古金幣)，跳過戰利品 (+5 古金幣)`;
    intraNodeChoice = {
      category: 'reward',
      action: '戰後選擇: 【跳過獎勵 (精簡牌庫)】',
      deltaHp: 0,
      deltaObols: baseObols + 5,
    };
  }

  return {
    investigator: updatedInvestigator,
    deck: updatedDeck,
    relics,
    logAction,
    intraNodeChoice,
    combatMetrics: {
      hpLossInCombat,
      isMadness: combatRes.isMadness,
      isVictory: true,
      combatRecord,
      cardRewardRecord,
    },
  };
}

function resolveSanctuaryNode(
  _node: MapNode,
  investigator: Investigator,
  deck: Card[],
  relics: Relic[],
  ctx: NodeResolutionContext
): NodeResolutionResult {
  const { depth, currentLayer, persona, rng } = ctx;
  const isHaven = currentLayer === 8 && depth <= 3;
  const healAmount = isHaven ? 15 : 8;

  const sanctuaryOptions: SanctuaryChoiceOption[] = [
    { action: 'bandage', healAmount },
    { action: 'meditate', cardsCount: 3 },
  ];

  if (deck.length > 1) {
    const starterCandidates = deck.filter((c) => isBasicStarterCard(c));
    const otherCandidates = deck.filter((c) => !isBasicStarterCard(c));
    const purgeCandidates = [...starterCandidates, ...otherCandidates].slice(0, 4);
    for (const c of purgeCandidates) {
      sanctuaryOptions.push({ action: 'purge', cardId: c.id });
    }
  }

  const evalCtx: EvaluationContext = {
    investigator,
    sanityDeck: deck,
    currentDepth: depth,
    currentLayer,
  };

  const choice = evaluateSanctuaryChoice(persona, sanctuaryOptions, evalCtx, rng);
  const updatedInvestigator = { ...investigator };
  let updatedDeck = deck;
  let logAction = '';
  let intraNodeChoice: IntraNodeChoiceRecord;

  if (choice.action === 'bandage') {
    const heal = Math.min(updatedInvestigator.maxHealth - updatedInvestigator.health, healAmount);
    updatedInvestigator.health += heal;
    logAction = `避難所休憩：包紮療傷 (+${heal} 生命值)`;
    intraNodeChoice = {
      category: 'sanctuary',
      action: '避難所: 【包紮療傷】',
      deltaHp: heal,
      deltaObols: 0,
    };
  } else if (choice.action === 'purge' && choice.cardId) {
    const removed = updatedDeck.find((c) => c.id === choice.cardId);
    updatedDeck = updatedDeck.filter((c) => c.id !== choice.cardId);
    logAction = `避難所爐火：焚毀除役卡牌【${removed?.name ?? '未知'}】`;
    intraNodeChoice = {
      category: 'sanctuary',
      action: `避難所: 【爐火除役: ${removed?.name ?? '基礎牌'}】`,
      deltaHp: 0,
      deltaObols: 0,
    };
  } else {
    logAction = `避難所冥想：心智澄澈微光 (+真相洞悉)`;
    intraNodeChoice = {
      category: 'sanctuary',
      action: '避難所: 【心智冥想 (+3 真相微光)】',
      deltaHp: 0,
      deltaObols: 0,
    };
  }

  return {
    investigator: updatedInvestigator,
    deck: updatedDeck,
    relics,
    logAction,
    intraNodeChoice,
  };
}

function resolveMarketNode(
  _node: MapNode,
  investigator: Investigator,
  deck: Card[],
  relics: Relic[],
  ctx: NodeResolutionContext
): NodeResolutionResult {
  const { depth, currentLayer, persona, occupation, rng } = ctx;
  const marketOptions: MarketChoiceOption[] = [{ action: 'leave', cost: 0 }];

  if (investigator.obols >= 15) {
    marketOptions.push({ action: 'buy_medical', cost: 15 });
  }
  if (investigator.obols >= 45) {
    const candidateCards = CardRegistry.generateRewardCards({
      depth,
      isBoss: false,
      count: 2,
      occupationId: occupation,
      randomFn: rng,
    });
    if (candidateCards[0]) {
      marketOptions.push({ action: 'buy_card', card: candidateCards[0], cost: 45 });
    }
  }
  if (investigator.obols >= 50) {
    marketOptions.push({ action: 'buy_relic', cost: 50 });
  }
  if (investigator.obols >= 75 && deck.length > 1) {
    const purgeCandidate = deck.find((c) => isBasicStarterCard(c)) ?? deck[0];
    marketOptions.push({
      action: 'purge_card',
      cardId: purgeCandidate.id,
      purgeCard: purgeCandidate,
      cost: 75,
    });
  }

  const evalCtx: EvaluationContext = {
    investigator,
    sanityDeck: deck,
    currentDepth: depth,
    currentLayer,
  };

  const choice = evaluateMarketChoice(persona, marketOptions, evalCtx, rng);
  const updatedInvestigator = { ...investigator };
  let updatedDeck = deck;
  let updatedRelics = relics;
  let logAction = '';
  let intraNodeChoice: IntraNodeChoiceRecord;

  if (choice.action === 'buy_medical' && updatedInvestigator.obols >= 15) {
    updatedInvestigator.obols -= 15;
    const heal = Math.min(updatedInvestigator.maxHealth - updatedInvestigator.health, 8);
    updatedInvestigator.health += heal;
    logAction = `黑市交易：購買應急醫療補給 (-15 古金幣, +${heal} 生命值)`;
    intraNodeChoice = {
      category: 'market',
      action: '黑市: 【採購醫療補給】',
      deltaHp: heal,
      deltaObols: -15,
    };
  } else if (choice.action === 'buy_card' && choice.card && updatedInvestigator.obols >= 45) {
    updatedInvestigator.obols -= 45;
    updatedDeck = ensureUniqueCardIds([...updatedDeck, { ...choice.card }]);
    logAction = `黑市交易：採購卡牌【${choice.card.name}】(-45 古金幣)`;
    intraNodeChoice = {
      category: 'market',
      action: '黑市: 【採購進階卡牌】',
      deltaHp: 0,
      deltaObols: -45,
    };
  } else if (choice.action === 'buy_relic' && updatedInvestigator.obols >= 50) {
    updatedInvestigator.obols -= 50;
    const relicCandidates = PRESET_RELICS.filter((r) => !updatedRelics.some((cr) => cr.id === r.id));
    const relic = relicCandidates[0] ?? PRESET_RELICS[0];
    updatedRelics = [...updatedRelics, relic];
    applyRelicToInvestigator(updatedInvestigator, relic);
    logAction = `黑市交易：收購舊日遺物【${relic.name}】(-50 古金幣)`;
    intraNodeChoice = {
      category: 'market',
      action: '黑市: 【採購舊日遺物】',
      deltaHp: 0,
      deltaObols: -50,
    };
  } else if (choice.action === 'purge_card' && choice.cardId && updatedInvestigator.obols >= 75) {
    updatedInvestigator.obols -= 75;
    const removed = updatedDeck.find((c) => c.id === choice.cardId);
    updatedDeck = updatedDeck.filter((c) => c.id !== choice.cardId);
    logAction = `黑市交易：付費除役卡牌【${removed?.name ?? '未知'}】(-75 古金幣)`;
    intraNodeChoice = {
      category: 'market',
      action: '黑市: 【付費除役卡牌】',
      deltaHp: 0,
      deltaObols: -75,
    };
  } else {
    logAction = '黑市巡視：未做大額交易離開';
    intraNodeChoice = {
      category: 'market',
      action: '黑市: 【全額保留古金幣離開】',
      deltaHp: 0,
      deltaObols: 0,
    };
  }

  return {
    investigator: updatedInvestigator,
    deck: updatedDeck,
    relics: updatedRelics,
    logAction,
    intraNodeChoice,
  };
}

function resolveEventNode(
  node: MapNode,
  investigator: Investigator,
  deck: Card[],
  relics: Relic[],
  ctx: NodeResolutionContext
): NodeResolutionResult {
  const { depth, currentLayer, persona, rng } = ctx;
  const allEvents = Object.values(MYTHOS_EVENTS);
  const pickedEvent = allEvents[Math.floor(rng() * allEvents.length)] ?? allEvents[0];
  const evalCtx: EvaluationContext = {
    investigator,
    sanityDeck: deck,
    currentDepth: depth,
    currentLayer,
  };
  const option = evaluateEventChoice(persona, pickedEvent, evalCtx, rng);

  let deltaHp = 0;
  let deltaObols = 0;
  for (const consequence of option.consequences) {
    if (consequence.type === 'health_change' && consequence.value !== undefined) {
      deltaHp += consequence.value;
    } else if (consequence.type === 'gain_obols' && consequence.value !== undefined) {
      deltaObols += consequence.value;
    }
  }

  const updatedInvestigator: Investigator = {
    ...investigator,
    health: Math.max(0, Math.min(investigator.maxHealth, investigator.health + deltaHp)),
    obols: Math.max(0, investigator.obols + deltaObols),
  };

  const logAction = `奇遇【${pickedEvent.title}】：選擇「${option.text}」(${deltaHp >= 0 ? '+' : ''}${deltaHp} 生命值, ${deltaObols >= 0 ? '+' : ''}${deltaObols} 古金幣)`;
  const intraNodeChoice: IntraNodeChoiceRecord = {
    category: 'event',
    action: `奇遇【${pickedEvent.title}】: ${option.text}`,
    deltaHp,
    deltaObols,
  };

  if (updatedInvestigator.health <= 0) {
    return {
      investigator: updatedInvestigator,
      deck,
      relics,
      logAction,
      intraNodeChoice,
      isFatal: true,
      fatalEncounter: {
        nodeId: node.id,
        enemyName: `奇遇殞命: ${pickedEvent.title}`,
        layer: currentLayer,
      },
    };
  }

  return {
    investigator: updatedInvestigator,
    deck,
    relics,
    logAction,
    intraNodeChoice,
  };
}

function resolveAltarNode(
  _node: MapNode,
  investigator: Investigator,
  deck: Card[],
  relics: Relic[],
  ctx: NodeResolutionContext
): NodeResolutionResult {
  const isCautious = ctx.persona.type === 'cautious';
  const updatedInvestigator = { ...investigator };

  if (!isCautious && updatedInvestigator.health > 8) {
    updatedInvestigator.health -= 4;
    updatedInvestigator.obols += 20;
    return {
      investigator: updatedInvestigator,
      deck,
      relics,
      logAction: '禁忌祭壇：獻祭生命獲得深淵恩賜 (-4 生命值, +20 古金幣)',
      intraNodeChoice: {
        category: 'event',
        action: '禁忌祭壇: 【鮮血祭獻 (+20 古金幣)】',
        deltaHp: -4,
        deltaObols: 20,
      },
    };
  }

  return {
    investigator: updatedInvestigator,
    deck,
    relics,
    logAction: '禁忌祭壇：凝視不可名狀雕像後謹慎離開',
    intraNodeChoice: {
      category: 'event',
      action: '禁忌祭壇: 【謹慎離開】',
      deltaHp: 0,
      deltaObols: 0,
    },
  };
}

function resolveBloodAltarNode(
  _node: MapNode,
  investigator: Investigator,
  deck: Card[],
  relics: Relic[],
  ctx: NodeResolutionContext
): NodeResolutionResult {
  const starterCard = deck.find((c) => isBasicStarterCard(c));
  const updatedInvestigator = { ...investigator };

  if (starterCard && updatedInvestigator.health > 6 && ctx.persona.type !== 'cautious') {
    updatedInvestigator.health -= 3;
    const updatedDeck = deck.filter((c) => c.id !== starterCard.id);
    return {
      investigator: updatedInvestigator,
      deck: updatedDeck,
      relics,
      logAction: `血之祭壇：以鮮血為誓除役卡牌【${starterCard.name}】(-3 生命值)`,
      intraNodeChoice: {
        category: 'sanctuary',
        action: '血之祭壇: 【鮮血除役卡牌】',
        deltaHp: -3,
        deltaObols: 0,
      },
    };
  }

  return {
    investigator: updatedInvestigator,
    deck,
    relics,
    logAction: '血之祭壇：繞過血槽繼續前行',
  };
}

function resolveVaultNode(
  _node: MapNode,
  investigator: Investigator,
  deck: Card[],
  relics: Relic[],
  _ctx: NodeResolutionContext
): NodeResolutionResult {
  const unowned = PRESET_RELICS.filter((r) => !relics.some((cr) => cr.id === r.id));
  const relic = unowned[0] ?? PRESET_RELICS[0];
  const updatedRelics = [...relics, relic];
  const updatedInvestigator = applyRelicToInvestigator(investigator, relic);

  return {
    investigator: updatedInvestigator,
    deck,
    relics: updatedRelics,
    logAction: `遺物秘閣：破除遠古封印獲取舊日遺物【${relic.name}】`,
    intraNodeChoice: {
      category: 'reward',
      action: `遺物秘閣: 【獲取舊日遺物 ${relic.name}】`,
      deltaHp: 0,
      deltaObols: 0,
    },
  };
}

function resolveRemainsNode(
  _node: MapNode,
  investigator: Investigator,
  deck: Card[],
  relics: Relic[],
  _ctx: NodeResolutionContext
): NodeResolutionResult {
  const updatedInvestigator: Investigator = {
    ...investigator,
    obols: investigator.obols + 15,
  };

  return {
    investigator: updatedInvestigator,
    deck,
    relics,
    logAction: '屍骨遺骸：哀悼前人遺骸，拾得遺留的 15 古金幣',
    intraNodeChoice: {
      category: 'reward',
      action: '屍骨遺骸: 【拾得前人古金幣 (+15)】',
      deltaHp: 0,
      deltaObols: 15,
    },
  };
}

interface KnownPathPairConfig {
  pair: string;
  label: string;
  typeA: MapNodeType;
  typeB: MapNodeType;
  choiceA: string;
  choiceB: string;
}

const KNOWN_PATH_PAIRS: KnownPathPairConfig[] = [
  { pair: 'combat_vs_sanctuary', label: '【常規戰 vs 安全避難所】', typeA: 'combat', typeB: 'sanctuary', choiceA: '常規戰', choiceB: '安全避難所' },
  { pair: 'combat_vs_elite', label: '【常規戰 vs 精英遭遇】', typeA: 'combat', typeB: 'elite', choiceA: '常規戰', choiceB: '精英遭遇' },
  { pair: 'elite_vs_sanctuary', label: '【精英遭遇 vs 安全避難所】', typeA: 'elite', typeB: 'sanctuary', choiceA: '精英遭遇', choiceB: '安全避難所' },
  { pair: 'market_vs_event', label: '【黑市商鋪 vs 秘識奇遇】', typeA: 'market', typeB: 'event', choiceA: '黑市商鋪', choiceB: '秘識奇遇' },
  { pair: 'altar_vs_sanctuary', label: '【禁忌祭壇 vs 安全避難所】', typeA: 'altar', typeB: 'sanctuary', choiceA: '禁忌祭壇', choiceB: '安全避難所' },
];

/**
 * 執行單一切片（8 層）之蒙地卡羅軌跡抽樣 (Single Slice 8-Floor Monte Carlo Rollout)
 */
export function runSliceRollout(config: SliceRolloutConfig): SliceRolloutResult {
  const {
    sliceId,
    depth,
    startLayer,
    endLayer,
    persona: personaInput,
    seed,
    initialInvestigator: customInv,
    initialDeck: customDeck,
    initialRelics: customRelics,
    occupation = 'investigator',
  } = config;

  const persona: AgentPersona =
    typeof personaInput === 'string' ? getAgentPersona(personaInput) : (personaInput ?? getAgentPersona('balanced'));

  const rng = createPrng(seed);

  // 1. 初始化調查員與牌庫
  const baseHealth = customInv?.health ?? customInv?.maxHealth ?? INITIAL_INVESTIGATOR.health;
  const baseMaxHealth = customInv?.maxHealth ?? INITIAL_INVESTIGATOR.maxHealth;
  let currentInvestigator: Investigator = {
    ...INITIAL_INVESTIGATOR,
    ...customInv,
    health: baseHealth,
    maxHealth: baseMaxHealth,
    stamina: customInv?.stamina ?? INITIAL_INVESTIGATOR.stamina,
    maxStamina: customInv?.maxStamina ?? INITIAL_INVESTIGATOR.maxStamina,
    armor: 0,
    statusEffects: [],
    relics: customRelics ? [...customRelics] : [...(customInv?.relics ?? [])],
    obols: customInv?.obols ?? 30,
    handRetention: customInv?.handRetention ?? customInv?.handCapacity ?? 2,
    handCapacity: customInv?.handCapacity ?? 2,
    occupationId: occupation,
  };

  let currentDeck: Card[] = ensureUniqueCardIds(
    customDeck ? customDeck.map((c) => ({ ...c })) : CardRegistry.getStarterDeck(occupation)
  );

  let currentRelics: Relic[] = [...(currentInvestigator.relics ?? [])];

  // 2. 產生該深度的完整 DAG 地圖 (16 層或 8 層)
  const map = generateProceduralInvestigationMap({
    depth,
    seed,
    randomFn: rng,
  });

  // 3. 統計指標與軌跡記錄
  let combatsFought = 0;
  let combatsWon = 0;
  let combatHpLoss = 0;
  let madnessTurnsTotal = 0;
  const initialHealthAtSliceStart = currentInvestigator.health;

  const nodesVisited: NodeVisitRecord[] = [];
  const decisionLogs: DecisionLogRecord[] = [];
  const combatRecords: CombatRecord[] = [];
  const cardRewards: CardRewardRecord[] = [];
  const pathChoices: PathChoiceRecord[] = [];
  const intraNodeChoices: IntraNodeChoiceRecord[] = [];
  let fatalEncounter: SliceRolloutResult['fatalEncounter'] | undefined = undefined;

  // 4. 定位 startLayer 的起始候選節點
  const startLayerNodeIds = map.layers[startLayer] ?? [];
  if (startLayerNodeIds.length === 0) {
    throw new Error(`Slice ${sliceId}: startLayer ${startLayer} has no nodes in generated map.`);
  }

  const startCandidates = startLayerNodeIds.map((id) => map.nodes[id]).filter(Boolean);
  let currentNode: MapNode = evaluatePathChoice(
    persona,
    startCandidates,
    {
      investigator: currentInvestigator,
      sanityDeck: currentDeck,
      currentDepth: depth,
      currentLayer: startLayer,
    },
    rng
  );

  // 5. 逐層前進探索 (最多 8 層：從 startLayer 到 endLayer)
  for (let currentLayer = startLayer; currentLayer <= endLayer; currentLayer++) {
    // 記錄造訪節點
    nodesVisited.push({
      nodeId: currentNode.id,
      layer: currentNode.layer,
      col: currentNode.col,
      type: currentNode.type,
      label: currentNode.label,
    });

    const hpBeforeNode = currentInvestigator.health;
    const obolsBeforeNode = currentInvestigator.obols;

    const nodeCtx: NodeResolutionContext = {
      depth,
      currentLayer,
      persona,
      occupation,
      rng,
    };

    let res: NodeResolutionResult;
    switch (currentNode.type) {
      case 'combat':
      case 'elite':
      case 'boss':
        res = resolveCombatNode(currentNode, currentInvestigator, currentDeck, currentRelics, nodeCtx);
        break;
      case 'sanctuary':
        res = resolveSanctuaryNode(currentNode, currentInvestigator, currentDeck, currentRelics, nodeCtx);
        break;
      case 'market':
        res = resolveMarketNode(currentNode, currentInvestigator, currentDeck, currentRelics, nodeCtx);
        break;
      case 'event':
        res = resolveEventNode(currentNode, currentInvestigator, currentDeck, currentRelics, nodeCtx);
        break;
      case 'altar':
        res = resolveAltarNode(currentNode, currentInvestigator, currentDeck, currentRelics, nodeCtx);
        break;
      case 'blood_altar':
        res = resolveBloodAltarNode(currentNode, currentInvestigator, currentDeck, currentRelics, nodeCtx);
        break;
      case 'vault':
        res = resolveVaultNode(currentNode, currentInvestigator, currentDeck, currentRelics, nodeCtx);
        break;
      case 'remains':
        res = resolveRemainsNode(currentNode, currentInvestigator, currentDeck, currentRelics, nodeCtx);
        break;
      default:
        res = {
          investigator: currentInvestigator,
          deck: currentDeck,
          relics: currentRelics,
          logAction: `造訪特殊節點【${currentNode.label}】`,
        };
        break;
    }

    currentInvestigator = res.investigator;
    currentDeck = res.deck;
    currentRelics = res.relics;

    if (res.combatMetrics) {
      combatsFought++;
      combatHpLoss += res.combatMetrics.hpLossInCombat;
      if (res.combatMetrics.isMadness) {
        madnessTurnsTotal++;
      }
      combatRecords.push(res.combatMetrics.combatRecord);
      if (res.combatMetrics.cardRewardRecord) {
        cardRewards.push(res.combatMetrics.cardRewardRecord);
      }
      if (res.combatMetrics.isVictory) {
        combatsWon++;
      }
    }

    if (res.intraNodeChoice) {
      intraNodeChoices.push(res.intraNodeChoice);
    }

    decisionLogs.push({
      layer: currentLayer,
      nodeType: currentNode.type,
      actionTaken: res.logAction,
      deltaHp: currentInvestigator.health - hpBeforeNode,
      deltaObols: currentInvestigator.obols - obolsBeforeNode,
    });

    if (res.isFatal) {
      fatalEncounter = res.fatalEncounter;
      break;
    }

    // ─────────────────────────────────────────────────────────
    // 邁向下一個樓層節點
    // ─────────────────────────────────────────────────────────
    if (currentLayer < endLayer) {
      const nextLayer = currentLayer + 1;
      const outgoingIds = currentNode.nextNodes.filter((id) => Boolean(map.nodes[id]));
      let candidateNextNodes: MapNode[];

      if (outgoingIds.length > 0) {
        candidateNextNodes = outgoingIds.map((id) => map.nodes[id]);
      } else {
        // 保底：若當前節點無合法連線，從下一層所有節點中挑選
        const nextLayerIds = map.layers[nextLayer] ?? [];
        candidateNextNodes = nextLayerIds.map((id) => map.nodes[id]).filter(Boolean);
      }

      if (candidateNextNodes.length === 0) {
        break; // 拓撲無後續節點
      }

      const nextNode = evaluatePathChoice(
        persona,
        candidateNextNodes,
        {
          investigator: currentInvestigator,
          sanityDeck: currentDeck,
          currentDepth: depth,
          currentLayer: nextLayer,
        },
        rng
      );

      if (candidateNextNodes.length > 1) {
        const types = candidateNextNodes.map((n) => n.type);
        for (const pairConfig of KNOWN_PATH_PAIRS) {
          if (types.includes(pairConfig.typeA) && types.includes(pairConfig.typeB)) {
            // 唯有真正挑選了 A 或 B 時才記錄，避免在多分支時產生錯誤歸因
            if (nextNode.type === pairConfig.typeA || nextNode.type === pairConfig.typeB) {
              pathChoices.push({
                pair: pairConfig.pair,
                label: pairConfig.label,
                choiceA: pairConfig.choiceA,
                choiceB: pairConfig.choiceB,
                pickedA: nextNode.type === pairConfig.typeA,
              });
            }
          }
        }
      }

      currentNode = nextNode;
    }
  }

  const isSuccess = currentInvestigator.health > 0;
  const netHpLoss = initialHealthAtSliceStart - currentInvestigator.health;

  return {
    sliceId,
    success: isSuccess,
    investigator: currentInvestigator,
    finalDeck: currentDeck,
    finalRelics: currentRelics,
    combatsFought,
    combatsWon,
    combatHpLoss,
    netHpLoss,
    madnessTurnsTotal,
    nodesVisited,
    decisionLogs,
    combatRecords,
    cardRewards,
    pathChoices,
    intraNodeChoices,
    fatalEncounter,
  };
}
