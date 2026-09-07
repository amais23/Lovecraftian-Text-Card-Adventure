import { describe, it, expect } from 'vitest';
import {
  getCardCatalog,
  getCardsByCategory,
  getCardCatalogStats,
  getCardCostDisplay,
} from './cardCatalog';
import type { CardCategory } from '../types/game';

describe('cardCatalog', () => {
  it('returns all 50 distinct cards in the comprehensive compendium', () => {
    const catalog = getCardCatalog();
    expect(catalog).toHaveLength(50);

    const ids = new Set(catalog.map((c) => c.id));
    expect(ids.size).toBe(50);

    const names = new Set(catalog.map((c) => c.name));
    expect(names.size).toBe(50);
  });

  it('correctly maps all 5 categories with expected counts', () => {
    const stats = getCardCatalogStats();
    expect(stats.combat).toBe(12);
    expect(stats.skill).toBe(13);
    expect(stats.magic).toBe(9);
    expect(stats.truth).toBe(10);
    expect(stats.madness).toBe(6);
    expect(stats.total).toBe(50);
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
      if (!card.isUnplayable) {
        expect(card.effects.length).toBeGreaterThan(0);
      }
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

  describe('Card description standardization (Issue #25)', () => {
    it('ensures no card in the entire catalog contains redundant cost phrases or legacy keywords', () => {
      const catalog = getCardCatalog();
      for (const card of catalog) {
        expect(card.description, `Card "${card.name}" has redundant cost`).not.toMatch(/消耗\s*\d+\s*點(精力|理智)/);
        expect(card.description, `Card "${card.name}" has legacy discard hint`).not.toContain('自牌庫頂棄牌');
        expect(card.description, `Card "${card.name}" has legacy accumulation note`).not.toContain('跨回合持續累積');
        expect(card.description, `Card "${card.name}" has legacy 回補 text`).not.toContain('回補');
        expect(card.description, `Card "${card.name}" has legacy 護甲值 text`).not.toContain('護甲值');
        expect(card.description, `Card "${card.name}" has legacy 認知傷害 text`).not.toContain('認知傷害');
      }
    });

    it('ensures damage cards follow the standardized "造成 X 點...傷害" paradigm', () => {
      const catalog = getCardCatalog();
      for (const card of catalog) {
        const damageEffect = card.effects.find((e) => e.type === 'damage');
        if (damageEffect && !card.isUnplayable) {
          expect(card.description, `Card "${card.name}" missing standardized damage phrasing`).toMatch(
            new RegExp(`^造成 ${damageEffect.value} 點`)
          );
          expect(card.description, `Card "${card.name}" missing 傷害 suffix`).toContain('傷害');
        }
      }
    });

    it('ensures armor cards follow the standardized "獲得 X 點護甲" paradigm', () => {
      const catalog = getCardCatalog();
      for (const card of catalog) {
        const armorEffect = card.effects.find((e) => e.type === 'armor');
        if (armorEffect && !card.isUnplayable) {
          expect(card.description, `Card "${card.name}" missing standardized armor phrasing`).toContain(
            `獲得 ${armorEffect.value} 點護甲`
          );
        }
      }
    });

    it('ensures restore sanity cards follow the standardized "洗回 X 張卡牌（回復 X 點理智）" paradigm', () => {
      const catalog = getCardCatalog();
      for (const card of catalog) {
        const restoreEffect = card.effects.find((e) => e.type === 'restore_sanity');
        if (restoreEffect && !card.isUnplayable) {
          expect(card.description, `Card "${card.name}" missing standardized restore sanity phrasing`).toContain(
            `洗回 ${restoreEffect.value} 張卡牌（回復 ${restoreEffect.value} 點理智）`
          );
        }
      }
    });

    it('ensures self-damage cards follow the standardized "自身承受 X 點反噬傷害" paradigm', () => {
      const catalog = getCardCatalog();
      for (const card of catalog) {
        const selfDamageEffect = card.effects.find((e) => e.type === 'self_damage');
        if (selfDamageEffect && !card.isUnplayable) {
          expect(card.description, `Card "${card.name}" missing standardized self-damage phrasing`).toContain(
            `自身承受 ${selfDamageEffect.value} 點反噬傷害`
          );
        }
      }
    });

    it('ensures unplayable abyssal fragments state "無法打出。佔據手牌卡槽。"', () => {
      const catalog = getCardCatalog();
      const fragments = catalog.filter((c) => c.name.startsWith('深淵封印殘片'));
      expect(fragments).toHaveLength(3);
      for (const fragment of fragments) {
        expect(fragment.description).toContain('無法打出。佔據手牌卡槽。');
      }
    });
  });
});
