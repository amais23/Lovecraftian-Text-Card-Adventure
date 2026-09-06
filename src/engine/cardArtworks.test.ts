import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ALL_CARD_ARTWORKS, getCardArtwork, CARD_ARTWORKS_REGISTRY } from './cardArtworks';
import type { Card } from '../types/game';

describe('Card Artworks Registry & ADR-0012 Validation', () => {
  it('should register all 28 unique card artworks across all categories', () => {
    expect(ALL_CARD_ARTWORKS.length).toBe(28);
    expect(Object.keys(CARD_ARTWORKS_REGISTRY).length).toBe(28);

    const categories = ALL_CARD_ARTWORKS.map((a) => a.category);
    expect(categories.filter((c) => c === 'combat').length).toBe(7);
    expect(categories.filter((c) => c === 'skill').length).toBe(8);
    expect(categories.filter((c) => c === 'magic').length).toBe(4);
    expect(categories.filter((c) => c === 'truth').length).toBe(6);
    expect(categories.filter((c) => c === 'madness').length).toBe(3);
  });

  it('should ensure all 28 artwork image files physically exist in public/cards/ with valid WebP/PNG formats', () => {
    const publicCardsDir = path.resolve(process.cwd(), 'public/cards');
    expect(fs.existsSync(publicCardsDir)).toBe(true);

    for (const art of ALL_CARD_ARTWORKS) {
      // art.imageUrl must conform to ADR-0012 (WebP or PNG)
      expect(
        art.imageUrl.endsWith('.webp') || art.imageUrl.endsWith('.png'),
        `Image for ${art.name} must be .webp or .png, got: ${art.imageUrl}`
      ).toBe(true);

      const fileName = path.basename(art.imageUrl);
      const filePath = path.join(publicCardsDir, fileName);
      expect(
        fs.existsSync(filePath),
        `Artwork image file missing for card "${art.name}": ${filePath}`
      ).toBe(true);

      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(0);
    }
  });

  it('should adhere to ADR-0012 style naming conventions', () => {
    for (const art of ALL_CARD_ARTWORKS) {
      switch (art.category) {
        case 'combat':
          expect(art.styleName).toContain('卡通');
          break;
        case 'skill':
          expect(art.styleName).toContain('寫實');
          break;
        case 'magic':
          expect(art.styleName).toContain('陽光');
          break;
        case 'truth':
          expect(art.styleName).toContain('舊日天啟');
          break;
        case 'madness':
          expect(art.styleName).toContain('血肉');
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
    expect(fallbackArt.imageUrl).toBe('/cards/card_magic_blast.webp');
  });
});
