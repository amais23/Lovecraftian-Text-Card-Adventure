import { describe, it, expect } from 'vitest';
import {
  ALL_CARD_ARTWORKS,
  getCardArtwork,
  CARD_ARTWORKS_REGISTRY,
  CARD_NAME_ALIASES,
  WIP_TIERED_CARD_NAMES,
} from './cardArtworks';
import { ALL_TIERED_CARDS } from './cardTiers';
import type { Card } from '../types/game';

describe('Card Artworks Registry & ADR-0012 Validation', () => {
  it('should register all 48 unique card artworks across all categories with 100% dedicated illustrations', () => {
    expect(ALL_CARD_ARTWORKS.length).toBe(48);
    expect(Object.keys(CARD_ARTWORKS_REGISTRY).length).toBe(48);
    expect(WIP_TIERED_CARD_NAMES.size).toBe(0);

    const categories = ALL_CARD_ARTWORKS.map((a) => a.category);
    expect(categories.filter((c) => c === 'combat').length).toBe(12);
    expect(categories.filter((c) => c === 'skill').length).toBe(13);
    expect(categories.filter((c) => c === 'magic').length).toBe(9);
    expect(categories.filter((c) => c === 'truth').length).toBe(11);
    expect(categories.filter((c) => c === 'madness').length).toBe(3);
  });

  it('should ensure all 48 artwork images exist physically in public/cards/ with valid WebP/PNG formats', () => {
    const cardImages = import.meta.glob('/public/cards/**/*.{webp,png}');
    const imagePaths = Object.keys(cardImages);
    expect(imagePaths.length).toBeGreaterThanOrEqual(48);

    for (const art of ALL_CARD_ARTWORKS) {
      expect(
        art.imageUrl.endsWith('.webp') || art.imageUrl.endsWith('.png'),
        `Image for ${art.name} must be .webp or .png, got: ${art.imageUrl}`
      ).toBe(true);

      const expectedKey = `/public${art.imageUrl}`;
      expect(
        imagePaths.includes(expectedKey),
        `Artwork image file missing for card "${art.name}": expected ${expectedKey} in ${JSON.stringify(imagePaths)}`
      ).toBe(true);
    }
  });

  it('should adhere to ADR-0012, ADR-0013, and ADR-0017 style naming conventions', () => {
    for (const art of ALL_CARD_ARTWORKS) {
      switch (art.category) {
        case 'combat':
          expect(art.styleName).toContain('實體武器');
          break;
        case 'skill':
          expect(art.styleName).toContain('生存技藝');
          break;
        case 'magic':
          expect(art.styleName).toContain('星空秘法');
          break;
        case 'truth':
          expect(art.styleName).toContain('舊日啟示');
          break;
        case 'madness':
          expect(art.styleName).toContain('深淵異化');
          break;
      }
      expect(art.conceptLore.length).toBeGreaterThan(10);
    }
  });

  it('should lookup artworks accurately via getCardArtwork', () => {
    const revolverCard: Card = {
      id: 'c1',
      name: '左輪射擊',
      category: 'combat',
      costType: 'stamina',
      costValue: 1,
      isTemporary: false,
      effects: [{ type: 'damage', value: 8 }],
      description: '造成 8 點傷害',
      flavorText: '防身利器。',
    };

    const art = getCardArtwork(revolverCard);
    expect(art.name).toBe('左輪射擊');
    expect(art.category).toBe('combat');
    expect(art.imageUrl).toContain('card_revolver.webp');

    // Fallback test for unknown card
    const unknownCard: Card = {
      id: 'unknown_999',
      name: '神秘遠古符文',
      category: 'magic',
      costType: 'sanity',
      costValue: 2,
      isTemporary: false,
      effects: [{ type: 'draw', value: 1 }],
      description: '抽一張牌',
      flavorText: '未知。',
    };

    const fallbackArt = getCardArtwork(unknownCard);
    expect(fallbackArt.name).toBe('靈能衝擊');
    expect(fallbackArt.category).toBe('magic');
    expect(fallbackArt.imageUrl).toBe('/cards/magic/card_magic_blast.webp');
  });

  it('should accurately map black market item cards to dedicated artworks instead of generic fallback', () => {
    const marketCards = [
      { id: 'card_market_shotgun', name: '戰壕雙管獵槍', category: 'combat' as const, expectedArtId: 'card_shotgun' },
      { id: 'card_market_bronze_amulet', name: '遠古青銅護身符', category: 'skill' as const, expectedArtId: 'card_ancient_amulet' },
      { id: 'card_market_breakwater_scroll', name: '心智防波堤手稿', category: 'truth' as const, expectedArtId: 'card_breakwater' },
      { id: 'card_market_morphine', name: '軍用嗎啡注射劑', category: 'skill' as const, expectedArtId: 'card_sedative' },
      { id: 'card_market_sterile_gauze', name: '高純度酒精繃帶', category: 'skill' as const, expectedArtId: 'card_first_aid' },
    ];

    for (const mc of marketCards) {
      const art = getCardArtwork({
        id: mc.id,
        name: mc.name,
        category: mc.category,
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [],
        description: '',
        flavorText: '',
      });
      expect(art.artId, `Expected ${mc.name} (${mc.id}) to map to ${mc.expectedArtId}, got ${art.artId}`).toBe(mc.expectedArtId);
    }
  });

  it('should prevent accidental substring collisions on card ID token lookups', () => {
    // Under naive substring matching, 'card_discover_truth' would match token 'cover' (skill).
    // With segment boundary matching, it should not match 'cover', falling back to its category default (combat).
    const falseSubstringCard = {
      id: 'card_discover_truth',
      name: '未登記之全新戰技',
      category: 'combat' as const,
      costType: 'stamina' as const,
      costValue: 1,
      isTemporary: false,
      effects: [],
      description: '',
      flavorText: '',
    };

    const art = getCardArtwork(falseSubstringCard);
    // Should fall back to combat fallback ('card_revolver'), NOT skill ('card_cover')
    expect(art.artId).toBe('card_revolver');
    expect(art.category).toBe('combat');
  });

  it('should ensure all CARD_NAME_ALIASES map to existing registered canonical card names', () => {
    const validCanonicalNames = new Set(ALL_CARD_ARTWORKS.map((a) => a.name));
    for (const [alias, canonicalTarget] of Object.entries(CARD_NAME_ALIASES)) {
      expect(
        validCanonicalNames.has(canonicalTarget),
        `Alias '${alias}' points to non-existent artwork name '${canonicalTarget}'`
      ).toBe(true);

      const art = getCardArtwork({ name: alias });
      expect(art.name).toBe(canonicalTarget);
    }
  });

  it('should resolve dedicated artworks for all tiered cards (Tier 1 through Tier 4+)', () => {
    for (const card of ALL_TIERED_CARDS) {
      const art = getCardArtwork(card);
      expect(art).toBeDefined();
      expect(art.artId).toBeTruthy();
      expect(art.imageUrl).toBeTruthy();
      expect(art.category).toBe(card.category);

      // All cards now have dedicated artworks
      expect(art.imageUrl).not.toContain('card_wip_placeholder.svg');
      expect(art.imageUrl).toContain('/cards/');
    }
  });
});
