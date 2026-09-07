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

export const ABYSSAL_FRAGMENT_IDS = new Set<string>([
  ABYSSAL_FRAGMENT_1.id,
  ABYSSAL_FRAGMENT_2.id,
  ABYSSAL_FRAGMENT_3.id,
]);

export const ABYSSAL_FRAGMENT_NAMES = new Set<string>([
  ABYSSAL_FRAGMENT_1.name,
  ABYSSAL_FRAGMENT_2.name,
  ABYSSAL_FRAGMENT_3.name,
]);

export function isAbyssalFragment(card: Card | { name?: string; id?: string }): boolean {
  if (card.id) {
    const rootId = card.id.split('_drafted_')[0];
    if (ABYSSAL_FRAGMENT_IDS.has(card.id) || ABYSSAL_FRAGMENT_IDS.has(rootId)) {
      return true;
    }
  }
  if (card.name && ABYSSAL_FRAGMENT_NAMES.has(card.name)) {
    return true;
  }
  return false;
}

export function getAllPermanentCards(state: GameState): Card[] {
  return [
    ...state.sanityDeck,
    ...state.hand,
    ...state.discardPile,
  ].filter((c) => !c.isTemporary);
}

function matchesFragment(card: Card, fragmentNumber: 1 | 2 | 3): boolean {
  const target =
    fragmentNumber === 1
      ? ABYSSAL_FRAGMENT_1
      : fragmentNumber === 2
      ? ABYSSAL_FRAGMENT_2
      : ABYSSAL_FRAGMENT_3;
  const rootId = card.id?.split('_drafted_')[0];
  return card.id === target.id || rootId === target.id || card.name === target.name;
}

export function hasAbyssalFragment(
  cardsOrState: Card[] | GameState,
  fragmentNumber: 1 | 2 | 3
): boolean {
  const cards = Array.isArray(cardsOrState)
    ? cardsOrState
    : getAllPermanentCards(cardsOrState);
  return cards.some((c) => matchesFragment(c, fragmentNumber));
}

export function hasBothAbyssalFragments(
  cardsOrState: Card[] | GameState
): boolean {
  const cards = Array.isArray(cardsOrState)
    ? cardsOrState
    : getAllPermanentCards(cardsOrState);
  return (
    cards.some((c) => matchesFragment(c, 1)) &&
    cards.some((c) => matchesFragment(c, 2))
  );
}

export function isCompleteAncientSeal(card: Card | { name?: string; id?: string }): boolean {
  if (card.id) {
    const rootId = card.id.split('_drafted_')[0];
    if (card.id === COMPLETE_ANCIENT_SEAL.id || rootId === COMPLETE_ANCIENT_SEAL.id) {
      return true;
    }
  }
  if (card.name && card.name === COMPLETE_ANCIENT_SEAL.name) {
    return true;
  }
  return false;
}

export interface DivineEnemyTarget {
  health: number;
  divineImmortality?: boolean;
}

/**
 * 判斷「完整的深淵古印」是否處於神性威壓封印中無法打出（首領生命值 > 1 點）
 */
export function isAncientSealLocked(
  card: Card | { name?: string; id?: string },
  enemy?: DivineEnemyTarget
): boolean {
  if (!isCompleteAncientSeal(card)) return false;
  if (!enemy || !enemy.divineImmortality) return false;
  return enemy.health > 1;
}

/**
 * 判斷「完整的深淵古印」是否已破除神性封印、可引發終極處決（首領生命值 <= 1 點）
 */
export function isAncientSealUnlocked(
  card: Card | { name?: string; id?: string },
  enemy?: DivineEnemyTarget
): boolean {
  if (!isCompleteAncientSeal(card)) return false;
  if (!enemy || !enemy.divineImmortality) return false;
  return enemy.health <= 1;
}

export function hasCompleteAncientSeal(
  cardsOrState: Card[] | GameState
): boolean {
  const cards = Array.isArray(cardsOrState)
    ? cardsOrState
    : getAllPermanentCards(cardsOrState);
  return cards.some(isCompleteAncientSeal);
}

/**
 * 執行深淵封印殘片共鳴融合：
 * 理智牌庫中必須同時集齊「深淵封印殘片·其一」、「其二」、「其三」全部三枚殘片，
 * 移除所有殘片並注入 1 張「完整的深淵古印」。
 */
export function fuseAbyssalFragments(deck: Card[]): {
  newDeck: Card[];
  wasFused: boolean;
} {
  const hasFrag1 = deck.some((c) => matchesFragment(c, 1));
  const hasFrag2 = deck.some((c) => matchesFragment(c, 2));
  const hasFrag3 = deck.some((c) => matchesFragment(c, 3));

  if (hasFrag1 && hasFrag2 && hasFrag3) {
    const filtered = deck.filter((c) => !isAbyssalFragment(c));
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
