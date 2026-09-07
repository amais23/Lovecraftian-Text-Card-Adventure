import { describe, it, expect } from 'vitest';
import {
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  ABYSSAL_FRAGMENT_3,
  COMPLETE_ANCIENT_SEAL,
  ALL_ABYSSAL_CARDS,
  isAbyssalFragment,
  hasAbyssalFragment,
  hasBothAbyssalFragments,
  hasCompleteAncientSeal,
  isCompleteAncientSeal,
  isAncientSealLocked,
  isAncientSealUnlocked,
  fuseAbyssalFragments,
  ensureUniqueCardIds,
} from './abyssalSeals';
import type { Card } from '../types/game';

describe('Abyssal Seals Module (Issue #21 / ADR-0015)', () => {
  it('defines the 3 unplayable madness fragments with correct properties', () => {
    expect(ALL_ABYSSAL_CARDS).toHaveLength(4);
    const fragments = [ABYSSAL_FRAGMENT_1, ABYSSAL_FRAGMENT_2, ABYSSAL_FRAGMENT_3];

    for (const fragment of fragments) {
      expect(fragment.category).toBe('madness');
      expect(fragment.isUnplayable).toBe(true);
      expect(fragment.isTemporary).toBe(false);
      expect(fragment.costType).toBe('free');
      expect(fragment.costValue).toBe(0);
      expect(fragment.effects).toEqual([]);
      expect(fragment.description).toContain('無法打出');
      expect(isAbyssalFragment(fragment)).toBe(true);
    }

    expect(ABYSSAL_FRAGMENT_1.name).toBe('深淵封印殘片·其一');
    expect(ABYSSAL_FRAGMENT_2.name).toBe('深淵封印殘片·其二');
    expect(ABYSSAL_FRAGMENT_3.name).toBe('深淵封印殘片·其三');
  });

  it('defines the fused complete ancient seal as a powerful Tier 4 Truth card', () => {
    expect(COMPLETE_ANCIENT_SEAL.name).toBe('完整的深淵古印');
    expect(COMPLETE_ANCIENT_SEAL.category).toBe('truth');
    expect(COMPLETE_ANCIENT_SEAL.tier).toBe(4);
    expect(COMPLETE_ANCIENT_SEAL.isTemporary).toBe(false);
    expect(COMPLETE_ANCIENT_SEAL.isUnplayable).toBeUndefined();
    expect(isAbyssalFragment(COMPLETE_ANCIENT_SEAL)).toBe(false);

    expect(COMPLETE_ANCIENT_SEAL.effects).toContainEqual({
      type: 'restore_sanity',
      value: 10,
    });
    expect(COMPLETE_ANCIENT_SEAL.effects).toContainEqual({
      type: 'armor',
      value: 20,
    });
    expect(COMPLETE_ANCIENT_SEAL.effects).toContainEqual({
      type: 'add_to_deck',
      value: 5,
    });
  });

  it('accurately identifies presence of fragments and complete seal', () => {
    const deckWithoutFragments: Card[] = [
      {
        id: 'c1',
        name: '左輪射擊',
        category: 'combat',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [],
        description: '',
        flavorText: '',
      },
    ];

    expect(hasAbyssalFragment(deckWithoutFragments, 1)).toBe(false);
    expect(hasBothAbyssalFragments(deckWithoutFragments)).toBe(false);
    expect(hasCompleteAncientSeal(deckWithoutFragments)).toBe(false);

    const deckWithFrag1 = [...deckWithoutFragments, ABYSSAL_FRAGMENT_1];
    expect(hasAbyssalFragment(deckWithFrag1, 1)).toBe(true);
    expect(hasAbyssalFragment(deckWithFrag1, 2)).toBe(false);
    expect(hasBothAbyssalFragments(deckWithFrag1)).toBe(false);

    const deckWithBoth = [...deckWithFrag1, ABYSSAL_FRAGMENT_2];
    expect(hasAbyssalFragment(deckWithBoth, 1)).toBe(true);
    expect(hasAbyssalFragment(deckWithBoth, 2)).toBe(true);
    expect(hasBothAbyssalFragments(deckWithBoth)).toBe(true);
  });

  it('fuses 3 fragments into 1 complete ancient seal and removes fragments', () => {
    const normalCard: Card = {
      id: 'c1',
      name: '左輪射擊',
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    };

    const initialDeck = [
      normalCard,
      ABYSSAL_FRAGMENT_1,
      ABYSSAL_FRAGMENT_2,
      ABYSSAL_FRAGMENT_3,
    ];

    const result = fuseAbyssalFragments(initialDeck);
    expect(result.wasFused).toBe(true);
    expect(result.newDeck).toHaveLength(2); // normalCard + COMPLETE_ANCIENT_SEAL
    expect(result.newDeck.some((c) => c.name === '完整的深淵古印')).toBe(true);
    expect(result.newDeck.some((c) => isAbyssalFragment(c))).toBe(false);
  });

  it('does not fuse if fragments are incomplete (including only fragments 1 and 2 without 3)', () => {
    const onlyFrag1 = [ABYSSAL_FRAGMENT_1];
    expect(fuseAbyssalFragments(onlyFrag1).wasFused).toBe(false);
    expect(fuseAbyssalFragments(onlyFrag1).newDeck).toEqual(onlyFrag1);

    const onlyFrag1And2 = [ABYSSAL_FRAGMENT_1, ABYSSAL_FRAGMENT_2];
    const result1And2 = fuseAbyssalFragments(onlyFrag1And2);
    expect(result1And2.wasFused).toBe(false);
    expect(result1And2.newDeck).toEqual(onlyFrag1And2);

    const onlyFrag2And3 = [ABYSSAL_FRAGMENT_2, ABYSSAL_FRAGMENT_3];
    expect(fuseAbyssalFragments(onlyFrag2And3).wasFused).toBe(false);
  });

  it('matches fragments and complete seal by id as well as display name', () => {
    const renamedFrag1: Card = {
      ...ABYSSAL_FRAGMENT_1,
      name: '自訂殘片名稱',
    };
    expect(isAbyssalFragment(renamedFrag1)).toBe(true);
    expect(hasAbyssalFragment([renamedFrag1], 1)).toBe(true);

    const draftedFrag2: Card = {
      ...ABYSSAL_FRAGMENT_2,
      id: `${ABYSSAL_FRAGMENT_2.id}_drafted_5`,
    };
    expect(isAbyssalFragment(draftedFrag2)).toBe(true);
    expect(hasAbyssalFragment([draftedFrag2], 2)).toBe(true);

    const draftedSeal: Card = {
      ...COMPLETE_ANCIENT_SEAL,
      id: `${COMPLETE_ANCIENT_SEAL.id}_drafted_8`,
    };
    expect(isCompleteAncientSeal(draftedSeal)).toBe(true);
    expect(hasCompleteAncientSeal([draftedSeal])).toBe(true);

    const normalCard: Card = {
      id: 'mock_card',
      name: '一般攻擊',
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    };
    expect(isCompleteAncientSeal(normalCard)).toBe(false);
  });

  it('evaluates isAncientSealLocked correctly for divine enemy based on health', () => {
    // Sealed when enemy has divineImmortality and health > 1
    expect(
      isAncientSealLocked(COMPLETE_ANCIENT_SEAL, { health: 100, divineImmortality: true })
    ).toBe(true);
    expect(
      isAncientSealLocked(COMPLETE_ANCIENT_SEAL, { health: 2, divineImmortality: true })
    ).toBe(true);

    // Not locked when health <= 1
    expect(
      isAncientSealLocked(COMPLETE_ANCIENT_SEAL, { health: 1, divineImmortality: true })
    ).toBe(false);
    expect(
      isAncientSealLocked(COMPLETE_ANCIENT_SEAL, { health: 0, divineImmortality: true })
    ).toBe(false);

    // Not locked for non-divine enemies
    expect(
      isAncientSealLocked(COMPLETE_ANCIENT_SEAL, { health: 50, divineImmortality: false })
    ).toBe(false);

    // Not locked for normal cards
    const normalCard: Card = {
      id: 'mock_card',
      name: '一般攻擊',
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    };
    expect(isAncientSealLocked(normalCard, { health: 50, divineImmortality: true })).toBe(false);
  });

  it('evaluates isAncientSealUnlocked correctly when divine enemy health is 1 or below', () => {
    // Unlocked when enemy has divineImmortality and health <= 1
    expect(
      isAncientSealUnlocked(COMPLETE_ANCIENT_SEAL, { health: 1, divineImmortality: true })
    ).toBe(true);
    expect(
      isAncientSealUnlocked(COMPLETE_ANCIENT_SEAL, { health: 0, divineImmortality: true })
    ).toBe(true);

    // Locked when health > 1
    expect(
      isAncientSealUnlocked(COMPLETE_ANCIENT_SEAL, { health: 2, divineImmortality: true })
    ).toBe(false);

    // Not unlocked for non-divine enemies
    expect(
      isAncientSealUnlocked(COMPLETE_ANCIENT_SEAL, { health: 1, divineImmortality: false })
    ).toBe(false);

    // Not unlocked for normal cards
    const normalCard: Card = {
      id: 'mock_card',
      name: '一般攻擊',
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    };
    expect(isAncientSealUnlocked(normalCard, { health: 1, divineImmortality: true })).toBe(false);
  });

  describe('ensureUniqueCardIds', () => {
    const makeCard = (id: string, name: string = '卡牌'): Card => ({
      id,
      name,
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    });

    it('returns empty array unchanged', () => {
      expect(ensureUniqueCardIds([])).toEqual([]);
    });

    it('returns cards unchanged when all IDs are already unique', () => {
      const c1 = makeCard('card_1');
      const c2 = makeCard('card_2');
      const result = ensureUniqueCardIds([c1, c2]);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('card_1');
      expect(result[1].id).toBe('card_2');
    });

    it('deduplicates duplicate card IDs with _copy_1, _copy_2', () => {
      const c1 = makeCard('card_punch');
      const c2 = makeCard('card_punch');
      const c3 = makeCard('card_punch');
      const result = ensureUniqueCardIds([c1, c2, c3]);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('card_punch');
      expect(result[1].id).toBe('card_punch_copy_1');
      expect(result[2].id).toBe('card_punch_copy_2');
    });

    it('avoids collisions when array already contains a card with _copy_1 suffix', () => {
      const c1 = makeCard('card_punch');
      const c2 = makeCard('card_punch_copy_1');
      const c3 = makeCard('card_punch');
      const result = ensureUniqueCardIds([c1, c2, c3]);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('card_punch');
      expect(result[1].id).toBe('card_punch_copy_1');
      // Must NOT collide with card_punch_copy_1! It should become card_punch_copy_2
      expect(result[2].id).toBe('card_punch_copy_2');
      const allIds = result.map((c) => c.id);
      expect(new Set(allIds).size).toBe(3);
    });
  });
});

