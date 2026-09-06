import type { Card } from '../types/game';

export const MADNESS_CARD_TEMPLATES: Omit<Card, 'id'>[] = [
  {
    name: '盲目爪擊',
    category: 'madness',
    costType: 'stamina',
    costValue: 1,
    isTemporary: true,
    effects: [
      { type: 'damage', value: 10 },
      { type: 'self_damage', value: 2 },
    ],
    description: '造成 10 點物理傷害，自身承受 2 點肉體反噬傷害。',
    flavorText: '「指甲翻開、血肉模糊，但你已感覺不到痛楚。」',
  },
  {
    name: '深淵狂嘯',
    category: 'madness',
    costType: 'stamina',
    costValue: 1,
    isTemporary: true,
    effects: [
      { type: 'damage', value: 14 },
      { type: 'self_damage', value: 3 },
    ],
    description: '造成 14 點毀滅傷害，自身承受 3 點肉體反噬傷害。',
    flavorText: '「非人的狂吼撕裂了喉管，震碎了眼前怪物的血肉。」',
  },
  {
    name: '狂亂血刃',
    category: 'madness',
    costType: 'stamina',
    costValue: 2,
    isTemporary: true,
    effects: [
      { type: 'damage', value: 20 },
      { type: 'self_damage', value: 5 },
    ],
    description: '消耗 2 精力造成 20 點滅絕傷害，自身承受 5 點致命反噬傷害。',
    flavorText: '「燃燒最後的肉魄，化為毀滅深淵的漆黑利刃。」',
  },
];

export const TRUTH_INJECTED_TEMPLATE: Omit<Card, 'id'> = {
  name: '真相微光',
  category: 'truth',
  costType: 'stamina',
  costValue: 0,
  isTemporary: true,
  effects: [{ type: 'armor', value: 2 }],
  description: '在不可名狀的微光中凝視深淵，獲得 2 點護甲。',
  flavorText: '「瘋狂漸漸褪去，但未知的印記已深深烙印在靈魂之中。」',
};

/**
 * Pure, deterministic factory to generate temporary black madness cards.
 * Uses turn and index to ensure state determinism without relying on Date.now() or global counters.
 */
export function createMadnessCards(count: number, turn: number, offset: number = 0): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const templateIndex = (offset + i) % MADNESS_CARD_TEMPLATES.length;
    const template = MADNESS_CARD_TEMPLATES[templateIndex];
    cards.push({
      ...template,
      id: `temp_madness_t${turn}_${offset + i}`,
      isTemporary: true,
    });
  }
  return cards;
}

/**
 * Pure, deterministic factory to generate temporary white truth cards injected into the sanity deck.
 */
export function createTruthInjectedCards(count: number, turn: number, offset: number = 0): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    cards.push({
      ...TRUTH_INJECTED_TEMPLATE,
      id: `temp_truth_t${turn}_${offset + i}`,
      isTemporary: true,
    });
  }
  return cards;
}
