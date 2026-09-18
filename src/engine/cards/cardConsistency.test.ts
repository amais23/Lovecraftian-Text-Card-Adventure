import { describe, expect, it } from 'vitest';
import { CardRegistry } from './registry';
import { ALL_ABYSSAL_CARDS } from './special/abyssal';

describe('Card Consistency & Terminology Verification (ADR-0001, ADR-0005, ADR-0015, ADR-0019, ADR-0024)', () => {
  // Aggregate all unique cards across canonical compendium, starter decks, and special cards
  const allCards = (() => {
    const map = new Map<string, typeof CardRegistry extends { getCardById: (id: string) => infer C } ? C : never>();
    for (const card of CardRegistry.getAllCompendiumCards()) {
      map.set(card.id, card);
    }
    for (const card of CardRegistry.getStarterDeck('investigator')) {
      map.set(card.id, card);
    }
    for (const card of CardRegistry.getStarterDeck('occultist')) {
      map.set(card.id, card);
    }
    for (const card of ALL_ABYSSAL_CARDS) {
      map.set(card.id, card);
    }
    return Array.from(map.values());
  })();

  it('aggregates at least 50 canonical cards for consistency testing', () => {
    expect(allCards.length).toBeGreaterThanOrEqual(50);
  });

  describe('1. Card Lifecycle Keywords Integrity (ADR-0024)', () => {
    it('enforces 【消耗】 and "移出戰鬥" in description when keywords include exhaust', () => {
      const exhaustCards = allCards.filter((c) => c.keywords?.includes('exhaust'));
      expect(exhaustCards.length).toBeGreaterThan(0);

      for (const card of exhaustCards) {
        expect(
          card.description,
          `Card [${card.name}] (${card.id}) declares 'exhaust' keyword but description misses '【消耗】'`
        ).toContain('【消耗】');
        expect(
          card.description,
          `Card [${card.name}] (${card.id}) declares 'exhaust' keyword but description misses '移出戰鬥'`
        ).toContain('移出戰鬥');
      }
    });

    it('enforces 【保留】 in description when keywords include retain', () => {
      const retainCards = allCards.filter((c) => c.keywords?.includes('retain'));
      expect(retainCards.length).toBeGreaterThan(0);

      for (const card of retainCards) {
        expect(
          card.description,
          `Card [${card.name}] (${card.id}) declares 'retain' keyword but description misses '【保留】'`
        ).toContain('【保留】');
      }
    });

    it('enforces 【固有】 in description when keywords include innate', () => {
      const innateCards = allCards.filter((c) => c.keywords?.includes('innate'));
      expect(innateCards.length).toBeGreaterThan(0);

      for (const card of innateCards) {
        expect(
          card.description,
          `Card [${card.name}] (${card.id}) declares 'innate' keyword but description misses '【固有】'`
        ).toContain('【固有】');
      }
    });

    it('forbids deprecated or non-standard keyword tags like 【起手必抽】', () => {
      for (const card of allCards) {
        expect(
          card.description,
          `Card [${card.name}] (${card.id}) uses non-standard keyword tag 【起手必抽】 instead of 【固有】`
        ).not.toContain('【起手必抽】');
      }
    });
  });

  describe('2. De-technologization & Pure Narrative Style (ADR-0019 & CONTEXT.md)', () => {
    it('forbids raw code comparison operators in descriptions', () => {
      const rawOperators = ['<=', '>=', '==', '!=', '===', '!=='];
      for (const card of allCards) {
        for (const op of rawOperators) {
          expect(
            card.description,
            `Card [${card.name}] (${card.id}) description contains raw programming operator '${op}'`
          ).not.toContain(op);
        }
      }
    });

    it('forbids informal game slang damage abbreviations (e.g. 24 傷)', () => {
      const slangRegex = /\d+\s*傷(?!害)/;
      for (const card of allCards) {
        expect(
          slangRegex.test(card.description),
          `Card [${card.name}] (${card.id}) description contains informal slang abbreviation '${card.description.match(slangRegex)?.[0]}'`
        ).toBe(false);
      }
    });

    it('forbids technical English terms and dev tags', () => {
      const bannedTerms = ['HP', 'SAN', 'Buff', 'Debuff', 'Web Audio', 'UI Click', 'Sandbox'];
      for (const card of allCards) {
        for (const term of bannedTerms) {
          expect(
            card.description.toLowerCase(),
            `Card [${card.name}] (${card.id}) contains forbidden technical term '${term}'`
          ).not.toContain(term.toLowerCase());
        }
      }
    });
  });

  describe('3. Status Effects Bracketing & Terminology (CONTEXT.md)', () => {
    const statusKeywords = ['力量', '堅韌', '易傷', '破勢', '流血', '恐慌'];

    it('ensures status effect mentions are properly enclosed in full-width brackets 【】', () => {
      for (const card of allCards) {
        for (const status of statusKeywords) {
          // Check if status appears in description outside of 【...】
          if (card.description.includes(status)) {
            const bracketedPattern = `【${status}】`;
            // Simple check: the count of unbracketed occurrences should be zero
            // (e.g. description includes '力量', it must be inside '【力量】')
            const totalCount = card.description.split(status).length - 1;
            const bracketedCount = card.description.split(bracketedPattern).length - 1;
            expect(
              bracketedCount,
              `Card [${card.name}] (${card.id}) mentions '${status}' without 【】 brackets in: "${card.description}"`
            ).toBe(totalCount);
          }
        }
      }
    });

    it('forbids undefined damage types like "崩潰傷害" or "衝擊傷害"', () => {
      for (const card of allCards) {
        expect(
          card.description,
          `Card [${card.name}] (${card.id}) contains undefined damage type '崩潰傷害'`
        ).not.toContain('崩潰傷害');
        expect(
          card.description,
          `Card [${card.name}] (${card.id}) contains undefined damage type '衝擊傷害'`
        ).not.toContain('衝擊傷害');
      }
    });
  });

  describe('4. Sanity Deck Target Semantics (ADR-0001)', () => {
    it('requires cards with restore_sanity effect to explicitly state "理智牌庫" in description', () => {
      const restoreSanityCards = allCards.filter((c) =>
        c.effects.some((e) => e.type === 'restore_sanity')
      );
      expect(restoreSanityCards.length).toBeGreaterThan(0);

      for (const card of restoreSanityCards) {
        expect(
          card.description,
          `Card [${card.name}] (${card.id}) has restore_sanity effect but description does not mention '理智牌庫'`
        ).toContain('理智牌庫');
      }
    });
  });

  describe('5. Abyssal Truth Mythic Seal Specification (ADR-0015)', () => {
    it('verifies 完整的深淵古印 specifies innate draw, boss threshold lock, and final banishment', () => {
      const seal = allCards.find((c) => c.id === 'card_complete_ancient_seal');
      expect(seal).toBeDefined();
      expect(seal?.keywords).toContain('innate');
      expect(seal?.description).toContain('【固有】');
      expect(seal?.description).toContain('理智牌庫');
      expect(seal?.description).toContain('生命大於 1 點');
      expect(seal?.description).toContain('太古星辰終極封滅');
    });
  });
});
