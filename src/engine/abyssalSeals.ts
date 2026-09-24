import type { Card, GameState } from '../types/game';

import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  ABYSSAL_FRAGMENT_3,
  COMPLETE_ANCIENT_SEAL,
  ALL_ABYSSAL_CARDS,
} from './cards/special/abyssal';

export {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  ABYSSAL_FRAGMENT_3,
  COMPLETE_ANCIENT_SEAL,
  ALL_ABYSSAL_CARDS,
};

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

function getRootCardId(id?: string): string {
  if (!id) return '';
  const idx = id.indexOf('_drafted_');
  return idx === -1 ? id : id.slice(0, idx);
}

export function isAbyssalFragment(card: Card | { name?: string; id?: string }): boolean {
  if (card.id) {
    const rootId = getRootCardId(card.id);
    if (ABYSSAL_FRAGMENT_IDS.has(card.id) || ABYSSAL_FRAGMENT_IDS.has(rootId)) {
      return true;
    }
  }
  if (card.name && ABYSSAL_FRAGMENT_NAMES.has(card.name)) {
    return true;
  }
  return false;
}

export { ensureUniqueCardIds } from './cardFactory';
import { ensureUniqueCardIds } from './cardFactory';

export function getAllPermanentCards(state: GameState): Card[] {
  const rawCards = [
    ...state.sanityDeck,
    ...state.hand,
    ...state.discardPile,
  ].filter((c) => !c.isTemporary);
  return ensureUniqueCardIds(rawCards);
}

function matchesFragment(card: Card, fragmentNumber: 1 | 2 | 3): boolean {
  const target =
    fragmentNumber === 1
      ? ABYSSAL_FRAGMENT_1
      : fragmentNumber === 2
      ? ABYSSAL_FRAGMENT_2
      : ABYSSAL_FRAGMENT_3;
  const rootId = getRootCardId(card.id);
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
    const rootId = getRootCardId(card.id);
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
