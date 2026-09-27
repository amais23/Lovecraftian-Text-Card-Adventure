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
  type AgentPersona,
  type AgentPersonaType,
  getAgentPersona,
  evaluateRewardChoice,
  evaluateSanctuaryChoice,
  evaluateMarketChoice,
  evaluatePathChoice,
  evaluateEventChoice,
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
  chosenType: 'card' | 'bandage' | 'skip';
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
function createPrng(seed: number): () => number {
  let s = (seed ^ 0x12345678) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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

    const evalCtx: EvaluationContext = {
      investigator: currentInvestigator,
      sanityDeck: currentDeck,
      currentDepth: depth,
      currentLayer,
    };

    let logAction = '';
    const hpBeforeNode = currentInvestigator.health;
    const obolsBeforeNode = currentInvestigator.obols;

    // ─────────────────────────────────────────────────────────
    // 節點事件處理
    // ─────────────────────────────────────────────────────────
    if (currentNode.type === 'combat' || currentNode.type === 'elite' || currentNode.type === 'boss') {
      combatsFought++;
      let enemy: Enemy;
      if (currentNode.enemyId) {
        const template = getEnemyTemplateById(currentNode.enemyId);
        enemy = template ? template : getEncounterEnemy(depth, currentNode.type, rng);
      } else {
        enemy = getEncounterEnemy(depth, currentNode.type, rng);
      }

      // 執行單場戰鬥
      const combatRes = simulateCombat({
        deck: currentDeck,
        relics: currentRelics,
        enemy,
        investigator: currentInvestigator,
        policyMode: 'optimal',
        randomFn: rng,
      });

      const hpLossInCombat = combatRes.healthLost;
      combatHpLoss += hpLossInCombat;
      if (combatRes.isMadness) {
        madnessTurnsTotal++;
      }
      currentInvestigator = {
        ...currentInvestigator,
        health: combatRes.investigatorHealthRemaining,
        armor: 0,
        statusEffects: [],
      };

      combatRecords.push({
        enemyId: enemy.id,
        enemyName: enemy.name,
        enemyRole: currentNode.type === 'boss' ? 'boss' : currentNode.type === 'elite' ? 'elite' : 'normal',
        depth,
        healthLost: hpLossInCombat,
        investigatorHpRemaining: currentInvestigator.health,
        turnsTaken: combatRes.turns,
        outcome: combatRes.outcome,
        deckSize: currentDeck.length,
      });

      // 檢查戰鬥死亡 (即刻死亡剪枝)
      if (combatRes.outcome !== 'victory' || currentInvestigator.health <= 0) {
        currentInvestigator.health = 0;
        fatalEncounter = {
          nodeId: currentNode.id,
          enemyId: enemy.id,
          enemyName: enemy.name,
          layer: currentLayer,
        };
        decisionLogs.push({
          layer: currentLayer,
          nodeType: currentNode.type,
          actionTaken: `戰鬥陣亡: 遭【${enemy.name}】致命擊破`,
          deltaHp: -hpLossInCombat,
          deltaObols: 0,
        });
        break; // 停止後續探索
      }

      combatsWon++;

      // 戰勝結算：生成戰利品
      const baseObols = currentNode.type === 'boss' ? 50 : currentNode.type === 'elite' ? 25 : 15;
      currentInvestigator.obols += baseObols;

      const rewardCards = CardRegistry.generateRewardCards({
        depth,
        isBoss: currentNode.type === 'boss',
        count: 3,
        occupationId: occupation,
        randomFn: rng,
      });

      const rewardOptions: RewardChoiceOption[] = [
        ...rewardCards.map((c) => ({ type: 'card' as const, card: c })),
        { type: 'bandage' as const, healAmount: 12 },
        { type: 'skip' as const, obols: 5 },
      ];

      const chosenReward = evaluateRewardChoice(persona, rewardOptions, evalCtx, rng);
      cardRewards.push({
        offeredCardIds: rewardCards.map((c) => c.id),
        chosenType: chosenReward.type,
        chosenCardId: chosenReward.type === 'card' && chosenReward.card ? chosenReward.card.id : undefined,
      });

      if (chosenReward.type === 'card' && chosenReward.card) {
        currentDeck = ensureUniqueCardIds([...currentDeck, { ...chosenReward.card }]);
        logAction = `戰勝【${enemy.name}】(+${baseObols} 古金幣)，挑選卡牌【${chosenReward.card.name}】`;
        intraNodeChoices.push({
          category: 'reward',
          action: `卡牌構築: 挑選【${chosenReward.card.name}】`,
          deltaHp: 0,
          deltaObols: baseObols,
        });
      } else if (chosenReward.type === 'bandage') {
        const heal = Math.min(currentInvestigator.maxHealth - currentInvestigator.health, 12);
        currentInvestigator.health += heal;
        logAction = `戰勝【${enemy.name}】(+${baseObols} 古金幣)，選擇戰地包紮 (+${heal} 生命值)`;
        intraNodeChoices.push({
          category: 'reward',
          action: '戰後選擇: 【戰地包紮】',
          deltaHp: heal,
          deltaObols: baseObols,
        });
      } else {
        currentInvestigator.obols += 5;
        logAction = `戰勝【${enemy.name}】(+${baseObols} 古金幣)，跳過戰利品 (+5 古金幣)`;
        intraNodeChoices.push({
          category: 'reward',
          action: '戰後選擇: 【跳過獎勵 (精簡牌庫)】',
          deltaHp: 0,
          deltaObols: baseObols + 5,
        });
      }
    } else if (currentNode.type === 'sanctuary') {
      const isHaven = currentLayer === 8 && depth <= 3;
      const healAmount = isHaven ? 15 : 8;

      const sanctuaryOptions: SanctuaryChoiceOption[] = [
        { action: 'bandage', healAmount },
        { action: 'meditate', cardsCount: 3 },
      ];

      // 牌庫大於 1 張時允許除役
      if (currentDeck.length > 1) {
        // 挑選最多 3 張候選卡牌供代理人除役考慮
        const purgeCandidates = currentDeck.slice(0, 4);
        for (const c of purgeCandidates) {
          sanctuaryOptions.push({ action: 'purge', cardId: c.id });
        }
      }

      const choice = evaluateSanctuaryChoice(persona, sanctuaryOptions, evalCtx, rng);
      if (choice.action === 'bandage') {
        const heal = Math.min(currentInvestigator.maxHealth - currentInvestigator.health, healAmount);
        currentInvestigator.health += heal;
        logAction = `避難所休憩：包紮療傷 (+${heal} 生命值)`;
        intraNodeChoices.push({
          category: 'sanctuary',
          action: '避難所: 【包紮療傷】',
          deltaHp: heal,
          deltaObols: 0,
        });
      } else if (choice.action === 'purge' && choice.cardId) {
        const removed = currentDeck.find((c) => c.id === choice.cardId);
        currentDeck = currentDeck.filter((c) => c.id !== choice.cardId);
        logAction = `避難所爐火：焚毀除役卡牌【${removed?.name ?? '未知'}】`;
        intraNodeChoices.push({
          category: 'sanctuary',
          action: `避難所: 【爐火除役: ${removed?.name ?? '基礎牌'}】`,
          deltaHp: 0,
          deltaObols: 0,
        });
      } else {
        logAction = `避難所冥想：心智澄澈微光 (+真相洞悉)`;
        intraNodeChoices.push({
          category: 'sanctuary',
          action: '避難所: 【心智冥想 (+3 真相微光)】',
          deltaHp: 0,
          deltaObols: 0,
        });
      }
    } else if (currentNode.type === 'market') {
      const marketOptions: MarketChoiceOption[] = [{ action: 'leave', cost: 0 }];

      if (currentInvestigator.obols >= 15) {
        marketOptions.push({ action: 'buy_medical', cost: 15 });
      }
      if (currentInvestigator.obols >= 45) {
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
      if (currentInvestigator.obols >= 50) {
        marketOptions.push({ action: 'buy_relic', cost: 50 });
      }
      if (currentInvestigator.obols >= 75 && currentDeck.length > 1) {
        marketOptions.push({ action: 'purge_card', cardId: currentDeck[0].id, cost: 75 });
      }

      const choice = evaluateMarketChoice(persona, marketOptions, evalCtx, rng);
      if (choice.action === 'buy_medical' && currentInvestigator.obols >= 15) {
        currentInvestigator.obols -= 15;
        const heal = Math.min(currentInvestigator.maxHealth - currentInvestigator.health, 8);
        currentInvestigator.health += heal;
        logAction = `黑市交易：購買應急醫療補給 (-15 古金幣, +${heal} 生命值)`;
        intraNodeChoices.push({
          category: 'market',
          action: '黑市: 【採購醫療補給】',
          deltaHp: heal,
          deltaObols: -15,
        });
      } else if (choice.action === 'buy_card' && choice.card && currentInvestigator.obols >= 45) {
        currentInvestigator.obols -= 45;
        currentDeck = ensureUniqueCardIds([...currentDeck, { ...choice.card }]);
        logAction = `黑市交易：採購卡牌【${choice.card.name}】(-45 古金幣)`;
        intraNodeChoices.push({
          category: 'market',
          action: '黑市: 【採購進階卡牌】',
          deltaHp: 0,
          deltaObols: -45,
        });
      } else if (choice.action === 'buy_relic' && currentInvestigator.obols >= 50) {
        currentInvestigator.obols -= 50;
        const relicCandidates = PRESET_RELICS.filter((r) => !currentRelics.some((cr) => cr.id === r.id));
        const relic = relicCandidates[0] ?? PRESET_RELICS[0];
        currentRelics = [...currentRelics, relic];
        currentInvestigator = applyRelicToInvestigator(currentInvestigator, relic);
        logAction = `黑市交易：收購舊日遺物【${relic.name}】(-50 古金幣)`;
        intraNodeChoices.push({
          category: 'market',
          action: '黑市: 【採購舊日遺物】',
          deltaHp: 0,
          deltaObols: -50,
        });
      } else if (choice.action === 'purge_card' && choice.cardId && currentInvestigator.obols >= 75) {
        currentInvestigator.obols -= 75;
        const removed = currentDeck.find((c) => c.id === choice.cardId);
        currentDeck = currentDeck.filter((c) => c.id !== choice.cardId);
        logAction = `黑市交易：付費除役卡牌【${removed?.name ?? '未知'}】(-75 古金幣)`;
        intraNodeChoices.push({
          category: 'market',
          action: '黑市: 【付費除役卡牌】',
          deltaHp: 0,
          deltaObols: -75,
        });
      } else {
        logAction = '黑市巡視：未做大額交易離開';
        intraNodeChoices.push({
          category: 'market',
          action: '黑市: 【全額保留古金幣離開】',
          deltaHp: 0,
          deltaObols: 0,
        });
      }
    } else if (currentNode.type === 'event') {
      const allEvents = Object.values(MYTHOS_EVENTS);
      const pickedEvent = allEvents[Math.floor(rng() * allEvents.length)] ?? allEvents[0];
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

      currentInvestigator.health = Math.max(0, Math.min(currentInvestigator.maxHealth, currentInvestigator.health + deltaHp));
      currentInvestigator.obols = Math.max(0, currentInvestigator.obols + deltaObols);

      logAction = `奇遇【${pickedEvent.title}】：選擇「${option.text}」(${deltaHp >= 0 ? '+' : ''}${deltaHp} 生命值, ${deltaObols >= 0 ? '+' : ''}${deltaObols} 古金幣)`;
      intraNodeChoices.push({
        category: 'event',
        action: `奇遇【${pickedEvent.title}】: ${option.text}`,
        deltaHp,
        deltaObols,
      });

      if (currentInvestigator.health <= 0) {
        fatalEncounter = {
          nodeId: currentNode.id,
          enemyName: `奇遇殞命: ${pickedEvent.title}`,
          layer: currentLayer,
        };
        decisionLogs.push({
          layer: currentLayer,
          nodeType: currentNode.type,
          actionTaken: logAction,
          deltaHp: currentInvestigator.health - hpBeforeNode,
          deltaObols: currentInvestigator.obols - obolsBeforeNode,
        });
        break;
      }
    } else {
      // 祭壇或其他類型
      logAction = `造訪特殊節點【${currentNode.label}】`;
    }

    decisionLogs.push({
      layer: currentLayer,
      nodeType: currentNode.type,
      actionTaken: logAction,
      deltaHp: currentInvestigator.health - hpBeforeNode,
      deltaObols: currentInvestigator.obols - obolsBeforeNode,
    });

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
        if (types.includes('combat') && types.includes('sanctuary')) {
          pathChoices.push({
            pair: 'combat_vs_sanctuary',
            label: '【常規戰 vs 安全避難所】',
            choiceA: '常規戰',
            choiceB: '安全避難所',
            pickedA: nextNode.type === 'combat',
          });
        } else if (types.includes('combat') && types.includes('elite')) {
          pathChoices.push({
            pair: 'combat_vs_elite',
            label: '【常規戰 vs 精英遭遇】',
            choiceA: '常規戰',
            choiceB: '精英遭遇',
            pickedA: nextNode.type === 'combat',
          });
        } else if (types.includes('elite') && types.includes('sanctuary')) {
          pathChoices.push({
            pair: 'elite_vs_sanctuary',
            label: '【精英遭遇 vs 安全避難所】',
            choiceA: '精英遭遇',
            choiceB: '安全避難所',
            pickedA: nextNode.type === 'elite',
          });
        } else if (types.includes('market') && types.includes('event')) {
          pathChoices.push({
            pair: 'market_vs_event',
            label: '【黑市商鋪 vs 秘識奇遇】',
            choiceA: '黑市商鋪',
            choiceB: '秘識奇遇',
            pickedA: nextNode.type === 'market',
          });
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
