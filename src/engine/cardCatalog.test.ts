import { describe, it, expect } from 'vitest';
import {
  getCardCatalog,
  getCardsByCategory,
  getCardCatalogStats,
  getCardCostDisplay,
} from './cardCatalog';
import type { CardCategory } from '../types/game';

describe('cardCatalog', () => {
  it('returns all 46 distinct cards in the comprehensive compendium', () => {
    const catalog = getCardCatalog();
    expect(catalog).toHaveLength(46);

    const ids = new Set(catalog.map((c) => c.id));
    expect(ids.size).toBe(46);

    const names = new Set(catalog.map((c) => c.name));
    expect(names.size).toBe(46);
  });

  it('correctly maps all 5 categories with expected counts', () => {
    const stats = getCardCatalogStats();
    expect(stats.combat).toBe(12);
    expect(stats.skill).toBe(13);
    expect(stats.magic).toBe(9);
    expect(stats.truth).toBe(9);
    expect(stats.madness).toBe(3);
    expect(stats.total).toBe(46);
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

  it('correctly formats card cost displays for all cost types', () => {
    expect(getCardCostDisplay('free', 0)).toEqual({
      shortText: '免費',
      detailLabel: '消耗：',
      detailValue: '免費',
    });

    expect(getCardCostDisplay('sanity', 3)).toEqual({
      shortText: '理智 3',
      detailLabel: '理智消耗：',
      detailValue: '3',
    });

    expect(getCardCostDisplay('stamina', 0)).toEqual({
      shortText: '0 精力 (免費)',
      detailLabel: '精力消耗：',
      detailValue: '0 (免費)',
    });

    expect(getCardCostDisplay('stamina', 2)).toEqual({
      shortText: '2 精力',
      detailLabel: '精力消耗：',
      detailValue: '2',
    });
  });
});
