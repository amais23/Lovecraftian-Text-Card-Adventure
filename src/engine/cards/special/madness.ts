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
    artworkUrl: '/cards/madness/card_screaming_howl.webp',
    effects: [
      { type: 'damage', value: 14 },
      { type: 'self_damage', value: 3 },
    ],
    description: '造成 14 點秘術傷害，自身承受 3 點反噬傷害。',
    flavorText: '「非人的狂吼撕裂了喉管，震碎了眼前怪物的血肉。」',
  },
  {
    name: '狂亂血刃',
    category: 'madness',
    costType: 'stamina',
    costValue: 2,
    isTemporary: true,
    artworkUrl: '/cards/madness/card_tentacle_blade.webp',
    effects: [
      { type: 'damage', value: 20 },
      { type: 'self_damage', value: 5 },
    ],
    description: '造成 20 點物理傷害，自身承受 5 點反噬傷害。',
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
 * 克蘇魯星之眷族【神性不滅】專屬污染瘋狂卡 (ADR-0026)
 */
export const CARD_WHISPERS_OF_SHATTERED_STARS: Omit<Card, 'id'> = {
  name: '星辰碎裂之囈語',
  category: 'madness',
  costType: 'stamina',
  costValue: 1,
  isTemporary: true,
  artworkUrl: '/cards/madness/card_screaming_howl.webp',
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
