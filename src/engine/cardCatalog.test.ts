import { describe, it, expect } from 'vitest';
import { getCardCatalog, getCardsByCategory, getCardCatalogStats } from './cardCatalog';
import type { CardCategory } from '../types/game';

describe('cardCatalog', () => {
  it('returns exactly 26 distinct cards in the comprehensive compendium', () => {
    const catalog = getCardCatalog();
    expect(catalog).toHaveLength(26);

    const ids = new Set(catalog.map((c) => c.id));
    expect(ids.size).toBe(26);

    const names = new Set(catalog.map((c) => c.name));
    expect(names.size).toBe(26);
  });

  it('correctly maps all 5 categories with expected counts', () => {
    const stats = getCardCatalogStats();
    expect(stats.combat).toBe(7);
    expect(stats.skill).toBe(8);
    expect(stats.magic).toBe(4);
    expect(stats.truth).toBe(4);
    expect(stats.madness).toBe(3);
    expect(stats.total).toBe(26);
  });

  it('filters cards by category accurately', () => {
    const categories: CardCategory[] = ['combat', 'skill', 'magic', 'truth', 'madness'];
    for (const cat of categories) {
      const filtered = getCardsByCategory(cat);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((c) => c.category === cat)).toBe(true);
    }
  });

  it('ensures every card has complete and descriptive metadata', () => {
    const catalog = getCardCatalog();
    for (const card of catalog) {
      expect(card.id).toBeTruthy();
      expect(card.name).toBeTruthy();
      expect(card.description).toBeTruthy();
      expect(card.flavorText).toBeTruthy();
      expect(card.effects.length).toBeGreaterThan(0);
      expect(['stamina', 'sanity', 'free']).toContain(card.costType);
    }
  });
});
