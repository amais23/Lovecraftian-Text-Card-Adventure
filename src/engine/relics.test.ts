import { describe, it, expect } from 'vitest';
import {
  PRESET_RELICS,
  getRelicById,
  calculateRelicModifiers,
  applyRelicToInvestigator,
  getRelicCombatBonus,
  ELDER_SIGN_AMULET,
  POCKET_WATCH,
  VITALITY_ELIXIR,
  OBSIDIAN_MIRROR,
  DREAD_TALISMAN,
  ELDRITCH_LANTERN,
} from './relics';
import type { Investigator } from '../types/game';

describe('Relics System (ADR-0018)', () => {
  const dummyInvestigator: Investigator = {
    name: '愛德華·皮克曼',
    occupation: '私家偵探',
    occupationId: 'investigator',
    health: 25,
    maxHealth: 25,
    stamina: 3,
    maxStamina: 3,
    armor: 0,
    obols: 20,
    handCapacity: 2,
    relics: [],
  };

  it('contains valid preset relics with metadata and modifiers', () => {
    expect(PRESET_RELICS.length).toBeGreaterThanOrEqual(6);
    expect(getRelicById('elder_sign_amulet')).toBeDefined();
    expect(getRelicById('pocket_watch')).toBeDefined();
    expect(getRelicById('vitality_elixir')).toBeDefined();
  });

  describe('applyRelicToInvestigator', () => {
    it('applies vitality elixir to increase maxHealth and current health immediately', () => {
      const inv: Investigator = { ...dummyInvestigator, health: 18, maxHealth: 25 };
      const updated = applyRelicToInvestigator(inv, VITALITY_ELIXIR);

      expect(updated.maxHealth).toBe(30);
      expect(updated.health).toBe(23); // 18 + 5
      expect(updated.relics).toHaveLength(1);
      expect(updated.relics?.[0].id).toBe('vitality_elixir');
    });

    it('applies pocket watch to increase handCapacity', () => {
      const updated = applyRelicToInvestigator(dummyInvestigator, POCKET_WATCH);
      expect(updated.handCapacity).toBe(3); // 2 + 1
      expect(updated.relics).toHaveLength(1);
    });

    it('does not mutate the original investigator object', () => {
      const updated = applyRelicToInvestigator(dummyInvestigator, POCKET_WATCH);
      expect(dummyInvestigator.handCapacity).toBe(2);
      expect(updated.handCapacity).toBe(3);
    });

    it('handles multiple relics applied sequentially', () => {
      let inv = applyRelicToInvestigator(dummyInvestigator, VITALITY_ELIXIR);
      inv = applyRelicToInvestigator(inv, POCKET_WATCH);
      inv = applyRelicToInvestigator(inv, ELDER_SIGN_AMULET);

      expect(inv.relics).toHaveLength(3);
      expect(inv.maxHealth).toBe(30);
      expect(inv.handCapacity).toBe(3);
    });
  });

  describe('calculateRelicModifiers', () => {
    it('sums modifiers across all relics', () => {
      const relics = [VITALITY_ELIXIR, POCKET_WATCH, ELDER_SIGN_AMULET];
      const mods = calculateRelicModifiers(relics);

      expect(mods.maxHealth).toBe(5);
      expect(mods.handCapacity).toBe(1);
      expect(mods.startingArmor).toBe(5);
      expect(mods.startingStamina).toBe(0);
    });

    it('returns zeroes for empty or undefined relics', () => {
      expect(calculateRelicModifiers(undefined)).toEqual({
        maxHealth: 0,
        handCapacity: 0,
        startingArmor: 0,
        startingStamina: 0,
      });
    });
  });

  describe('getRelicCombatBonus', () => {
    it('extracts starting armor, stamina bonus, and initial status effects', () => {
      const relics = [ELDER_SIGN_AMULET, OBSIDIAN_MIRROR, DREAD_TALISMAN, ELDRITCH_LANTERN];
      const bonus = getRelicCombatBonus(relics);

      expect(bonus.startingArmor).toBe(5);
      expect(bonus.startingStaminaBonus).toBe(1);
      expect(bonus.startingStatusEffects).toHaveLength(2);
      expect(bonus.startingStatusEffects.find((e) => e.type === 'resilience')?.stacks).toBe(2);
      expect(bonus.startingStatusEffects.find((e) => e.type === 'might')?.stacks).toBe(1);
    });
  });
});
