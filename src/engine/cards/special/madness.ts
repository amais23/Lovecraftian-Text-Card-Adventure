import type { Card } from '../../../types/game';

/**
 * 黑色瘋狂卡原型模板（理智抽乾或瘋狂狀態下動態印製）
 */
export const MADNESS_CARD_TEMPLATES: Omit<Card, 'id'>[] = [
  {
    name: '盲目爪擊',
    category: 'madness',
    costType: 'stamina',
    costValue: 1,
    isTemporary: true,
    artworkUrl: '/cards/madness/card_blind_claw.webp',
    effects: [
      { type: 'damage', value: 10 },
      { type: 'self_damage', value: 2 },
    ],
    description: '造成 10 點物理傷害，自身承受 2 點反噬傷害。',
    flavorText: '「指甲翻開、血肉模糊，但你已感覺不到痛楚。」',
  },
  {
    name: '深淵狂嘯',
    category: 'madness',
    costType: 'stamina',
    costValue: 1,
    isTemporary: true,
    artworkUrl: '/cards/madness/card_abyssal_howl.png',
    effects: [
      { type: 'damage', value: 14 },
      { type: 'lose_armor', value: 5 },
    ],
    description: '造成 14 點秘術傷害，自身失去 5 點護甲。',
    flavorText: '「非人的狂吼撕裂了喉管，震碎了眼前怪物的血肉。」',
  },
  {
    name: '狂亂血刃',
    category: 'madness',
    costType: 'stamina',
    costValue: 2,
    isTemporary: true,
    artworkUrl: '/cards/madness/card_frenzy_blade.png',
    effects: [
      { type: 'damage', value: 22 },
      { type: 'apply_status', target: 'self', statusType: 'vulnerable', value: 2 },
      { type: 'erode_sanity', value: 2 },
    ],
    description: '造成 22 點物理傷害，使自身陷入 2 層【易傷】並侵蝕 2 張理智牌庫。',
    flavorText: '「燃燒最後的肉魄，化為毀滅深淵的漆黑利刃。」',
  },
];

/**
 * 卡牌圖鑑專屬的瘋狂卡清單
 */
export const COMPENDIUM_MADNESS_CARDS: Card[] = [
  {
    ...MADNESS_CARD_TEMPLATES[0],
    id: 'compendium_madness_claw',
  },
  {
    ...MADNESS_CARD_TEMPLATES[1],
    id: 'compendium_madness_howl',
  },
  {
    ...MADNESS_CARD_TEMPLATES[2],
    id: 'compendium_madness_blade',
  },
];

/**
 * 克蘇魯星之眷族【神性不滅】專屬污染瘋狂卡 (ADR-0026, ADR-0033)
 */
export const CARD_WHISPERS_OF_SHATTERED_STARS: Card = {
  id: 'card_whispers_of_shattered_stars',
  name: '星辰碎裂之囈語',
  category: 'madness',
  costType: 'stamina',
  costValue: 1,
  isTemporary: true,
  artworkUrl: '/cards/madness/card_whispers_of_shattered_stars.png',
  effects: [{ type: 'erode_sanity', value: 2 }],
  description: '不可名狀之星辰囈語；打出時侵蝕自身 2 點理智牌庫。',
  flavorText: '「不可名狀的舊日私語在意識深處回盪，粉碎凡人最後的理性。」',
};

export function createWhispersOfShatteredStarsCard(turn: number, index: number = 0): Card {
  return {
    ...CARD_WHISPERS_OF_SHATTERED_STARS,
    id: `temp_madness_whispers_t${turn}_${index}_${Date.now()}`,
  };
}

/**
 * 遺物秘閣【破除古神封印】專屬詛咒瘋狂卡 (ADR-0032, ADR-0033, Issue #54)
 */
export const CARD_ABYSS_CURSE: Card = {
  id: 'card_abyss_curse',
  name: '深淵詛咒',
  category: 'madness',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  isUnplayable: true,
  artworkUrl: '/cards/madness/card_abyss_curse.png',
  effects: [],
  description: '無法打出。佔據手牌卡槽。強行破除太古封印招致的永恆深淵詛咒。',
  flavorText: '「當你撕開太古符印的那一刻，不可名狀的凝視已烙印在靈魂深處。」',
};

