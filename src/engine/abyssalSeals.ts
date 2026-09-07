import type { Card, GameState } from '../types/game';

export const ABYSSAL_FRAGMENT_1: Card = {
  id: 'card_abyssal_fragment_1',
  name: '深淵封印殘片·其一',
  category: 'madness',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  isUnplayable: true,
  effects: [],
  description:
    '【無法打出 · 深淵詛咒】此卡沉重地盤踞在手牌中，無法打出，嚴重阻礙手牌運轉。相傳集齊三枚殘片將引發某種不可思議的星辰共鳴……',
  flavorText: '「第一塊浸泡著黑泥的原生殘片，在手心傳遞著刺骨的深淵脈動。」',
};

export const ABYSSAL_FRAGMENT_2: Card = {
  id: 'card_abyssal_fragment_2',
  name: '深淵封印殘片·其二',
  category: 'madness',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  isUnplayable: true,
  effects: [],
  description:
    '【無法打出 · 深淵詛咒】此卡沉重地盤踞在手牌中，無法打出，嚴重阻礙手牌運轉。與第一枚殘片相互吸引，散發幽暗的深海寒意。',
  flavorText: '「第二塊帶有海蝕太古星圖的殘片，低語著拉萊耶的古老潮鳴。」',
};

export const ABYSSAL_FRAGMENT_3: Card = {
  id: 'card_abyssal_fragment_3',
  name: '深淵封印殘片·其三',
  category: 'madness',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  isUnplayable: true,
  effects: [],
  description:
    '【無法打出 · 深淵詛咒】擊敗第三深度首領時自其核心崩解而出的最後殘片。三片齊聚之時，深淵封印將產生劇烈質變。',
  flavorText: '「最後一塊殘片歸位，不可名狀的舊日律動在靈魂深處合為一體。」',
};

export const COMPLETE_ANCIENT_SEAL: Card = {
  id: 'card_complete_ancient_seal',
  name: '完整的深淵古印',
  category: 'truth',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  tier: 4,
  effects: [
    { type: 'restore_sanity', value: 10 },
    { type: 'armor', value: 20 },
    { type: 'add_to_deck', value: 5 },
  ],
  description:
    '【超維真理 · 舊神封印】由三枚深淵封印殘片共鳴融合昇華而成的終極古印。散發崇高冰冷的星穹光芒，完全解除瘋狂狀態，恢復 10 點理智並獲得 20 點護甲。',
  flavorText: '「當三枚殘片嵌合的剎那，深淵的污穢化為純淨真理，虛空裂隙為之洞開。」',
};

export const ALL_ABYSSAL_CARDS: Card[] = [
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  ABYSSAL_FRAGMENT_3,
  COMPLETE_ANCIENT_SEAL,
];

export const ABYSSAL_FRAGMENT_NAMES = new Set<string>([
  ABYSSAL_FRAGMENT_1.name,
  ABYSSAL_FRAGMENT_2.name,
  ABYSSAL_FRAGMENT_3.name,
]);

export function isAbyssalFragment(card: Card | { name: string }): boolean {
  return ABYSSAL_FRAGMENT_NAMES.has(card.name);
}

export function getAllPermanentCards(state: GameState): Card[] {
  return [
    ...state.sanityDeck,
    ...state.hand,
    ...state.discardPile,
  ].filter((c) => !c.isTemporary);
}

export function hasAbyssalFragment(
  cardsOrState: Card[] | GameState,
  fragmentNumber: 1 | 2 | 3
): boolean {
  const cards = Array.isArray(cardsOrState)
    ? cardsOrState
    : getAllPermanentCards(cardsOrState);
  const targetName =
    fragmentNumber === 1
      ? ABYSSAL_FRAGMENT_1.name
      : fragmentNumber === 2
      ? ABYSSAL_FRAGMENT_2.name
      : ABYSSAL_FRAGMENT_3.name;
  return cards.some((c) => c.name === targetName);
}

export function hasBothAbyssalFragments(
  cardsOrState: Card[] | GameState
): boolean {
  const cards = Array.isArray(cardsOrState)
    ? cardsOrState
    : getAllPermanentCards(cardsOrState);
  return (
    cards.some((c) => c.name === ABYSSAL_FRAGMENT_1.name) &&
    cards.some((c) => c.name === ABYSSAL_FRAGMENT_2.name)
  );
}

export function hasCompleteAncientSeal(
  cardsOrState: Card[] | GameState
): boolean {
  const cards = Array.isArray(cardsOrState)
    ? cardsOrState
    : getAllPermanentCards(cardsOrState);
  return cards.some((c) => c.name === COMPLETE_ANCIENT_SEAL.name);
}

/**
 * 執行深淵封印殘片共鳴融合：
 * 移除牌庫中所有的「深淵封印殘片·其一」、「其二」、「其三」，並注入 1 張「完整的深淵古印」
 */
export function fuseAbyssalFragments(deck: Card[]): {
  newDeck: Card[];
  wasFused: boolean;
} {
  const hasFrag1 = deck.some((c) => c.name === ABYSSAL_FRAGMENT_1.name);
  const hasFrag2 = deck.some((c) => c.name === ABYSSAL_FRAGMENT_2.name);
  const filtered = deck.filter((c) => !ABYSSAL_FRAGMENT_NAMES.has(c.name));

  if (hasFrag1 && hasFrag2) {
    return {
      newDeck: [...filtered, { ...COMPLETE_ANCIENT_SEAL }],
      wasFused: true,
    };
  }

  return {
    newDeck: [...deck],
    wasFused: false,
  };
}
