import type { Card, Enemy, EnemyIntent, Investigator } from '../types/game';

export const INITIAL_INVESTIGATOR: Investigator = {
  name: '愛德華·皮爾斯',
  occupation: '私家偵探',
  occupationId: 'investigator',
  health: 25,
  maxHealth: 25,
  stamina: 3,
  maxStamina: 3,
  armor: 0,
  obols: 15,
  handCapacity: 2,
};

import { CardRegistry } from './cards/registry';
import { TIER_1_CARDS } from './cardTiers';

export const INVESTIGATOR_DECK: Card[] = CardRegistry.getStarterDeck('investigator');
export const OCCULTIST_DECK: Card[] = CardRegistry.getStarterDeck('occultist');


export const INITIAL_DECK: Card[] = INVESTIGATOR_DECK;

export interface OccupationDefinition {
  id: 'investigator' | 'occultist';
  name: string;
  occupation: string;
  title: string;
  quote: string;
  description: string;
  stats: {
    health: number;
    stamina: number;
    obols: number;
    handCapacity: number;
  };
  deck: Card[];
}

export const OCCUPATIONS: Record<'investigator' | 'occultist', OccupationDefinition> = {
  investigator: {
    id: 'investigator',
    name: '愛德華·皮爾斯',
    occupation: '私家偵探',
    title: '波士頓老兵 / 私家偵探',
    quote: '「點38轉輪手槍與頑固的直覺，是我在黑暗中僅有的盟友。」',
    description: '波士頓街頭與戰火淬鍊的生存專家。偏好物理肉搏、槍械打擊與實用防禦，戰術風格堅韌沉穩。',
    stats: {
      health: 25,
      stamina: 3,
      obols: 15,
      handCapacity: 2,
    },
    deck: INVESTIGATOR_DECK,
  },
  occultist: {
    id: 'occultist',
    name: '艾蓮諾·凡斯',
    occupation: '秘術學者',
    title: '密斯卡託尼克大學古典學家',
    quote: '「深淵注視著我，但我亦在典籍的殘章中找到了驅使星辰的密語。」',
    description: '深諳舊日神話與古老儀軌的學者。擅長直接消耗理智牌庫施展高破壞力的紫色魔法卡，並善用白色真相卡在狂亂邊緣扭轉乾坤。',
    stats: {
      health: 25,
      stamina: 3,
      obols: 20,
      handCapacity: 2,
    },
    deck: OCCULTIST_DECK,
  },
};

export const REWARD_CARD_POOL: Card[] = TIER_1_CARDS;

/**
 * Fisher-Yates 洗牌演算法（均勻無偏隨機）
 * 支援注入自訂 randomFn，確保測試與模擬的純度與可重現性
 */
export function fisherYatesShuffle<T>(items: readonly T[], randomFn: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 隨機抽取 count 張不重複的戰後獎勵卡牌（使用 Fisher-Yates 無偏洗牌）
 */
export function generateRewardCards(count: number = 3, randomFn: () => number = Math.random): Card[] {
  const shuffled = fisherYatesShuffle(REWARD_CARD_POOL, randomFn);
  return shuffled.slice(0, Math.min(count, shuffled.length)).map((c) => ({ ...c }));
}

// Temporary card factories and templates are defined in cardFactory.ts
export { MADNESS_CARD_TEMPLATES, createMadnessCards, TRUTH_INJECTED_TEMPLATE } from './cardFactory';

export const GHOUL_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 6,
    name: '腐臭爪擊',
    description: '食屍鬼揮舞滴淌著黑血與腐土的利爪，預告造成 6 點傷害。',
  },
  {
    type: 'erode',
    value: 2,
    name: '恐懼嘶吼',
    description: '食屍鬼發出穿透靈魂的尖嘯，預告侵蝕你 2 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 8,
    name: '撕咬猛撲',
    description: '食屍鬼如獵犬般伏地前衝，張開滿嘴銳齒預告造成 8 點傷害。',
  },
  {
    type: 'erode',
    value: 1,
    name: '狂亂凝視',
    description: '泛著磷光的盲目雙眼直視你的靈魂，預告侵蝕你 1 點理智牌庫。',
  },
];

export const INITIAL_GHOUL: Enemy = {
  id: 'enemy_ghoul_01',
  name: '食屍鬼 (Ghoul)',
  title: '墓穴的潛伏者',
  health: 30,
  maxHealth: 30,
  armor: 0,
  currentIntent: GHOUL_INTENTS[0],
  intentSequence: GHOUL_INTENTS,
  currentIntentIndex: 0,
};

