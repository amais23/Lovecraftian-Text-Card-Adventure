import type { Card, Investigator, MapNode, MythosEvent, MythosEventOption } from '../../types/game';
import { CardRegistry } from '../cards/registry';

export type AgentPersonaType = 'balanced' | 'cautious' | 'greedy' | 'pure_random';

export interface AgentPersona {
  type: AgentPersonaType;
  name: string;
  description: string;
  /** 生命值警戒門檻 (0 ~ 1，當生命值比值低於此門檻時強烈傾向回復生命) */
  healthAlertThreshold: number;
  /** 拿牌與除役偏好 */
  deckTendency: 'balanced' | 'survival' | 'streamline' | 'random';
}

/**
 * 判斷卡牌是否具備生存防禦/回復性質 (涵蓋護甲、治療效果或防護標籤)
 */
export function isSurvivalCard(card?: Card): boolean {
  if (!card) return false;
  if (card.effects?.some((e) => e.type === 'armor' || e.type === 'heal')) {
    return true;
  }
  const id = card.id.toLowerCase();
  return (
    id.includes('first_aid') ||
    id.includes('defend') ||
    id.includes('breakwater') ||
    id.includes('astral_ward') ||
    id.includes('heal') ||
    id.includes('armor')
  );
}

/**
 * 判斷卡牌是否為基礎初始牌 (涵蓋私家偵探與秘術學者之初始牌庫原型)
 */
export function isBasicStarterCard(card?: Card): boolean {
  if (!card) return false;
  const canonicalId = card.id.replace(/_copy_\d+$/, '');
  const starterIds = new Set<string>([
    ...CardRegistry.getStarterDeck('investigator').map((c) => c.id.replace(/_copy_\d+$/, '')),
    ...CardRegistry.getStarterDeck('occultist').map((c) => c.id.replace(/_copy_\d+$/, '')),
  ]);
  if (starterIds.has(canonicalId)) {
    return true;
  }
  return (
    card.name.includes('打擊') ||
    card.name.includes('防禦') ||
    card.name.includes('靈能衝擊') ||
    card.name.includes('厄運凝視') ||
    card.name.includes('星界庇護')
  );
}

export const AGENT_PERSONAS: Record<AgentPersonaType, AgentPersona> = {
  balanced: {
    type: 'balanced',
    name: '常態平衡型',
    description: '理性權衡，中度生命門檻（生命值≤45%時回血），綜合考量卡牌強度評分與牌庫厚度。',
    healthAlertThreshold: 0.45,
    deckTendency: 'balanced',
  },
  cautious: {
    type: 'cautious',
    name: '生存謹慎型',
    description: '保命至上，高度生命門檻（生命值≤65%時全力回血），避開精英與高危祭壇，偏好防禦與治療。',
    healthAlertThreshold: 0.65,
    deckTendency: 'survival',
  },
  greedy: {
    type: 'greedy',
    name: '貪婪構築型',
    description: '極致構築，低度生命門檻（生命值≤25%才回血），優先除役初始普通牌、搶購強力遺物與高階卡。',
    healthAlertThreshold: 0.25,
    deckTendency: 'streamline',
  },
  pure_random: {
    type: 'pure_random',
    name: '純隨機探索型',
    description: '邊界下限基準，所有合法決策選項採 1/K 等機率盲選，不考量數值與狀態。',
    healthAlertThreshold: 0.0,
    deckTendency: 'random',
  },
};

export function getAgentPersona(type?: AgentPersonaType): AgentPersona {
  if (!type || !AGENT_PERSONAS[type]) {
    return AGENT_PERSONAS.balanced;
  }
  return AGENT_PERSONAS[type];
}

export interface EvaluationContext {
  investigator: Investigator;
  sanityDeck: Card[];
  currentDepth: number;
  currentLayer: number;
}

/**
 * 依據權重陣列進行蒙地卡羅抽樣 (Weighted Softmax / Cumulative Sampling)
 */
export function sampleWeightedChoice<T>(
  items: T[],
  weightFn: (item: T) => number,
  randomFn: () => number = Math.random
): T {
  if (items.length === 0) {
    throw new Error('Cannot sample from an empty list');
  }
  if (items.length === 1) {
    return items[0];
  }

  const weights = items.map((item) => Math.max(0.001, weightFn(item)));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const roll = randomFn() * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (roll <= cumulative) {
      return items[i];
    }
  }

  return items[items.length - 1];
}

// ─────────────────────────────────────────────────────────────
// 1. 戰後獎勵決策 (Post-Combat Reward Choice)
// ─────────────────────────────────────────────────────────────
export interface RewardChoiceOption {
  type: 'card' | 'bandage' | 'skip' | 'seal_fragment';
  card?: Card;
  fragmentCard?: Card;
  healAmount?: number;
  obols?: number;
}

export function evaluateRewardChoice(
  persona: AgentPersona,
  options: RewardChoiceOption[],
  ctx: EvaluationContext,
  randomFn: () => number = Math.random
): RewardChoiceOption {
  if (persona.type === 'pure_random') {
    return sampleWeightedChoice(options, () => 1.0, randomFn);
  }

  const { investigator, sanityDeck } = ctx;
  const hpRatio = investigator.health / Math.max(1, investigator.maxHealth);
  const isAlert = hpRatio <= persona.healthAlertThreshold;

  return sampleWeightedChoice(
    options,
    (opt) => {
      let weight = 10;

      if (opt.type === 'bandage') {
        if (isAlert) {
          // 警戒時生命危急，回血權重劇烈提升
          const urgencyMultiplier = (persona.healthAlertThreshold - hpRatio) * 10 + 2;
          weight = persona.type === 'cautious' ? 80 * urgencyMultiplier : 50 * urgencyMultiplier;
        } else {
          // 生命健康時回血價值偏低
          weight = persona.type === 'cautious' ? 15 : persona.type === 'greedy' ? 2 : 8;
        }
      } else if (opt.type === 'card') {
        const card = opt.card;
        const tier = card?.tier ?? 1;
        const isSurvival = isSurvivalCard(card);

        if (persona.type === 'greedy') {
          // 貪婪型極度偏好 Tier 2+ 高階卡，對 Tier 1 基礎卡興趣缺缺
          weight = tier >= 3 ? 60 : tier === 2 ? 35 : 5;
        } else if (persona.type === 'cautious') {
          weight = isSurvival ? 25 : 12;
          if (isAlert) weight *= 0.3; // 瀕危時抓牌慾望下降
        } else {
          // 平衡型
          weight = tier >= 2 ? 25 : 15;
          // 牌庫若過厚 (> 16 張) 抓牌權重遞減
          if (sanityDeck.length >= 16) weight *= 0.6;
          if (isAlert) weight *= 0.5;
        }
      } else if (opt.type === 'skip') {
        // 跳過換古金幣
        if (persona.type === 'greedy') {
          // 貪婪型若無高品質卡牌，優先拿古金幣去黑市採購
          weight = 30;
        } else if (persona.type === 'cautious') {
          weight = isAlert ? 5 : 10;
        } else {
          // 平衡型牌庫過厚時適度跳過
          weight = sanityDeck.length >= 18 ? 25 : 10;
        }
      } else if (opt.type === 'seal_fragment') {
        // 承受深淵封印殘片 (Boss 戰後抉擇)
        if (persona.type === 'greedy') {
          // 貪婪型渴望收集完整深淵古印以達成終極成就
          weight = isAlert ? 15 : 55;
        } else if (persona.type === 'cautious') {
          // 謹慎型忌憚無法打出的黑色瘋狂詛咒卡牌稀釋牌庫
          weight = isAlert ? 2 : 12;
        } else {
          // 平衡型視生命值狀態中度承擔
          weight = isAlert ? 8 : 30;
        }
      }

      return weight;
    },
    randomFn
  );
}

// ─────────────────────────────────────────────────────────────
// 2. 避難所決策 (Sanctuary Choice)
// ─────────────────────────────────────────────────────────────
export interface SanctuaryChoiceOption {
  action: 'bandage' | 'meditate' | 'purge';
  cardId?: string;
  healAmount?: number;
  cardsCount?: number;
}

export function evaluateSanctuaryChoice(
  persona: AgentPersona,
  options: SanctuaryChoiceOption[],
  ctx: EvaluationContext,
  randomFn: () => number = Math.random
): SanctuaryChoiceOption {
  if (persona.type === 'pure_random') {
    return sampleWeightedChoice(options, () => 1.0, randomFn);
  }

  const { investigator, sanityDeck } = ctx;
  const hpRatio = investigator.health / Math.max(1, investigator.maxHealth);
  const isAlert = hpRatio <= persona.healthAlertThreshold;

  return sampleWeightedChoice(
    options,
    (opt) => {
      let weight = 10;

      if (opt.action === 'bandage') {
        if (isAlert) {
          const urgencyMultiplier = (persona.healthAlertThreshold - hpRatio) * 8 + 3;
          weight = persona.type === 'cautious' ? 120 * urgencyMultiplier : 60 * urgencyMultiplier;
        } else {
          weight = persona.type === 'cautious' ? 30 : persona.type === 'greedy' ? 3 : 15;
        }
      } else if (opt.action === 'purge') {
        const targetCard = sanityDeck.find((c) => c.id === opt.cardId);
        const isBasicCard = isBasicStarterCard(targetCard);

        if (persona.type === 'greedy') {
          // 貪婪型優先除役初始白板卡以精簡牌庫
          weight = isBasicCard ? 75 : 30;
          if (isAlert) weight *= 0.5;
        } else if (persona.type === 'cautious') {
          weight = 8;
        } else {
          // 平衡型：若牌庫過厚或為初始打擊則積極除役
          weight = isBasicCard && sanityDeck.length >= 14 ? 35 : 15;
          if (isAlert) weight *= 0.3;
        }
      } else if (opt.action === 'meditate') {
        // 心智冥想洗入真相微光
        if (persona.type === 'cautious') {
          weight = 20;
        } else if (persona.type === 'greedy') {
          weight = 5; // 貪婪型不喜增加雜質牌
        } else {
          weight = sanityDeck.length <= 10 ? 30 : 10;
        }
      }

      return weight;
    },
    randomFn
  );
}

// ─────────────────────────────────────────────────────────────
// 3. 黑市交易決策 (Black Market Choice)
// ─────────────────────────────────────────────────────────────
export interface MarketChoiceOption {
  action: 'buy_relic' | 'buy_card' | 'purge_card' | 'buy_medical' | 'leave';
  relicId?: string;
  card?: Card;
  cardId?: string;
  purgeCard?: Card;
  cost: number;
}

export function evaluateMarketChoice(
  persona: AgentPersona,
  options: MarketChoiceOption[],
  ctx: EvaluationContext,
  randomFn: () => number = Math.random
): MarketChoiceOption {
  if (persona.type === 'pure_random') {
    return sampleWeightedChoice(options, () => 1.0, randomFn);
  }

  const { investigator, sanityDeck } = ctx;
  const hpRatio = investigator.health / Math.max(1, investigator.maxHealth);
  const isAlert = hpRatio <= persona.healthAlertThreshold;

  return sampleWeightedChoice(
    options,
    (opt) => {
      // 資金不足直接賦予極小權重
      if (opt.cost > investigator.obols && opt.action !== 'leave') {
        return 0.001;
      }

      let weight = 10;
      if (opt.action === 'buy_medical') {
        if (isAlert) {
          weight = persona.type === 'cautious' ? 80 : 50;
        } else {
          weight = 5;
        }
      } else if (opt.action === 'buy_relic') {
        weight = persona.type === 'greedy' ? 80 : 35;
      } else if (opt.action === 'purge_card') {
        const isBasic = opt.purgeCard ? isBasicStarterCard(opt.purgeCard) : true;
        if (persona.type === 'greedy') {
          weight = isBasic ? 70 : 35;
        } else if (persona.type === 'cautious') {
          weight = 10;
        } else {
          weight = isBasic && sanityDeck.length >= 14 ? 35 : 15;
        }
      } else if (opt.action === 'buy_card') {
        const tier = opt.card?.tier ?? 1;
        weight = persona.type === 'greedy' ? (tier >= 2 ? 45 : 10) : 20;
      } else if (opt.action === 'leave') {
        weight = 12;
      }

      return weight;
    },
    randomFn
  );
}

// ─────────────────────────────────────────────────────────────
// 4. DAG 地圖路徑選擇 (DAG Map Path Choice)
// ─────────────────────────────────────────────────────────────
export function evaluatePathChoice(
  persona: AgentPersona,
  outgoingNodes: MapNode[],
  ctx: EvaluationContext,
  randomFn: () => number = Math.random
): MapNode {
  if (outgoingNodes.length === 0) {
    throw new Error('No outgoing nodes available to choose from');
  }
  if (outgoingNodes.length === 1) {
    return outgoingNodes[0];
  }
  if (persona.type === 'pure_random') {
    return sampleWeightedChoice(outgoingNodes, () => 1.0, randomFn);
  }

  const { investigator } = ctx;
  const hpRatio = investigator.health / Math.max(1, investigator.maxHealth);
  const isAlert = hpRatio <= persona.healthAlertThreshold;

  return sampleWeightedChoice(
    outgoingNodes,
    (node) => {
      let weight = 20;

      switch (node.type) {
        case 'boss':
          weight = 100; // 首領節點為終點宿敵，拓撲連通時必經
          break;

        case 'sanctuary':
          if (isAlert) {
            weight = persona.type === 'cautious' ? 100 : 60;
          } else {
            weight = persona.type === 'greedy' ? 35 : 25; // 貪婪型仍喜愛避難所除役
          }
          break;

        case 'market':
          weight = persona.type === 'greedy' ? 70 : 25;
          break;

        case 'vault':
          weight = persona.type === 'greedy' ? 60 : persona.type === 'cautious' ? 25 : 35;
          break;

        case 'blood_altar':
          weight = persona.type === 'greedy' ? 40 : persona.type === 'cautious' ? (isAlert ? 1 : 5) : (isAlert ? 3 : 20);
          break;

        case 'remains':
          weight = persona.type === 'greedy' ? 45 : 30;
          break;

        case 'elite':
          if (isAlert) {
            weight = 0.5; // 殘血時極力避開精英
          } else if (persona.type === 'cautious') {
            weight = 5; // 謹慎型常態避開精英
          } else if (persona.type === 'greedy') {
            weight = 40; // 貪婪型追求精英的高額遺物與古金幣
          } else {
            weight = 20;
          }
          break;

        case 'altar':
          weight = persona.type === 'cautious' ? 3 : persona.type === 'greedy' ? 35 : 15;
          break;

        case 'event':
          weight = 25;
          break;

        case 'combat':
        default:
          weight = isAlert ? 10 : 30;
          break;
      }

      return weight;
    },
    randomFn
  );
}

// ─────────────────────────────────────────────────────────────
// 5. 秘識奇遇選項抉擇 (Mythos Event Option Choice)
// ─────────────────────────────────────────────────────────────
export function evaluateEventChoice(
  persona: AgentPersona,
  event: MythosEvent,
  ctx: EvaluationContext,
  randomFn: () => number = Math.random
): MythosEventOption {
  const options = event.options;
  if (options.length === 0) {
    throw new Error(`Mythos event ${event.id} has no options`);
  }
  if (options.length === 1 || persona.type === 'pure_random') {
    return sampleWeightedChoice(options, () => 1.0, randomFn);
  }

  const { investigator } = ctx;
  const hpRatio = investigator.health / Math.max(1, investigator.maxHealth);
  const isAlert = hpRatio <= persona.healthAlertThreshold;

  return sampleWeightedChoice(
    options,
    (opt) => {
      let weight = 20;

      // 檢查後果中有無損血
      const healthChange = opt.consequences
        .filter((c) => c.type === 'health_change' && c.value !== undefined)
        .reduce((sum, c) => sum + (c.value ?? 0), 0);

      if (healthChange < 0) {
        if (isAlert) {
          weight = 2; // 殘血避開扣血選項
        } else if (persona.type === 'cautious') {
          weight = 8;
        } else if (persona.type === 'greedy') {
          weight = 30; // 貪婪型願為收益扣血
        }
      } else if (healthChange > 0) {
        weight = isAlert ? 60 : 25;
      }

      // 檢查有無獲取卡牌或遺物
      const gainsCardsOrRelics = opt.consequences.some(
        (c) => c.type === 'gain_card' || c.type === 'gain_relic' || c.type === 'gain_obols'
      );
      if (gainsCardsOrRelics && persona.type === 'greedy') {
        weight += 30;
      }

      return weight;
    },
    randomFn
  );
}
