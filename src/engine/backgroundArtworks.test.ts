import { describe, it, expect } from 'vitest';
import {
  BACKGROUND_ARTWORKS,
  OCCUPATION_PORTRAITS,
  getCombatBackground,
  getOccupationPortrait,
} from './backgroundArtworks';

describe('backgroundArtworks module', () => {
  it('should define title menu and map desk artworks', () => {
    expect(BACKGROUND_ARTWORKS.title_menu.imageUrl).toBe('/backgrounds/bg_title_menu.webp');
    expect(BACKGROUND_ARTWORKS.map_desk.imageUrl).toBe('/backgrounds/bg_map_desk.webp');
  });

  it('should return correct combat backgrounds for depths 1 through 4', () => {
    expect(getCombatBackground(1)).toBe('/backgrounds/bg_combat_depth1.webp');
    expect(getCombatBackground(2)).toBe('/backgrounds/bg_combat_depth2.webp');
    expect(getCombatBackground(3)).toBe('/backgrounds/bg_combat_depth3.webp');
    expect(getCombatBackground(4)).toBe('/backgrounds/bg_combat_depth4.webp');
  });

  it('should clamp combat backgrounds if depth is out of bounds or undefined', () => {
    expect(getCombatBackground(0)).toBe('/backgrounds/bg_combat_depth1.webp');
    expect(getCombatBackground(5)).toBe('/backgrounds/bg_combat_depth4.webp');
    expect(getCombatBackground(undefined as unknown as number)).toBe('/backgrounds/bg_combat_depth1.webp');
  });

  it('should return correct occupation portraits', () => {
    expect(OCCUPATION_PORTRAITS.investigator.portraitUrl).toBe('/occupations/portrait_investigator.webp');
    expect(OCCUPATION_PORTRAITS.occultist.portraitUrl).toBe('/occupations/portrait_occultist.webp');

    expect(getOccupationPortrait('investigator')).toBe('/occupations/portrait_investigator.webp');
    expect(getOccupationPortrait('occultist')).toBe('/occupations/portrait_occultist.webp');
    expect(getOccupationPortrait('unknown')).toBe('/occupations/portrait_investigator.webp');
  });
});
