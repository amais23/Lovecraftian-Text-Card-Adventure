import type { Card } from '../../../types/game';

/**
 * 中立通用卡牌庫 (全職業通用工具/道具牌，Tier 1 ~ Tier 4)
 */
export const NEUTRAL_CARDS: Card[] = [
  // --- Tier 1 ---
  {
    id: 'reward_ancient_amulet_1',
    name: '遠古護身符',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    occupations: ['investigator', 'occultist'],
    artworkUrl: '/cards/skill/card_cover.webp',
    effects: [{ type: 'armor', value: 8 }],
    description: '獲得 8 點護甲。',
    flavorText: '「青銅上的深綠包漿散發著阻絕污穢的冰涼氣息。」',
  },
  {
    id: 'reward_first_aid_1',
    name: '應急急救包',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    occupations: ['investigator', 'occultist'],
    artworkUrl: '/cards/skill/card_cover.webp',
    effects: [
      { type: 'armor', value: 3 },
      { type: 'restore_sanity', value: 2 },
    ],
    description: '獲得 3 點護甲，洗回 2 張卡牌。',
    flavorText: '「酒精與繃帶能穩固搖搖欲墜的精神防線。」',
  },

  // --- Tier 2 ---
  {
    id: 'card_tier2_rapid_suture',
    name: '戰地快速縫合',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 2,
    occupations: ['investigator', 'occultist'],
    artworkUrl: '/cards/skill/card_cover.webp',
    effects: [
      { type: 'armor', value: 6 },
      { type: 'restore_sanity', value: 3 },
    ],
    description: '獲得 6 點護甲，洗回 3 張卡牌。',
    flavorText: '「即便手指被寒風凍得發僵，依然熟練地穿針引線，穩住潰散的精神防線。」',
  },

  // --- Tier 3 ---
  {
    id: 'card_tier3_sanity_anchor',
    name: '極限精神錨定',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 3,
    occupations: ['investigator', 'occultist'],
    artworkUrl: '/cards/skill/card_cover.webp',
    effects: [
      { type: 'armor', value: 8 },
      { type: 'restore_sanity', value: 5 },
    ],
    description: '獲得 8 點護甲，洗回 5 張卡牌。',
    flavorText: '「以古代舊印銘文將狂暴渙散的心靈死死固定在理性之錨上。」',
  },

  // --- Tier 4 Exclusive ---
  {
    id: 'card_tier4_elder_aegis',
    name: '舊神庇護之陣',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 4,
    occupations: ['investigator', 'occultist'],
    artworkUrl: '/cards/skill/card_cover.webp',
    effects: [
      { type: 'armor', value: 24 },
      { type: 'draw', value: 2 },
    ],
    description: '獲得 24 點護甲，抽取 2 張卡牌。',
    flavorText: '「五芒星光在周身環繞，不可名狀的混沌污穢在光芒前如同初雪般消融。」',
  },
];
