import type { Card } from '../../../types/game';
import { createStarterVariant } from '../../cardFactory';

const BASE_MAGIC_BLAST: Omit<Card, 'id' | 'flavorText'> = {
  name: '靈能衝擊',
  category: 'magic',
  costType: 'sanity',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['occultist'],
  artworkUrl: '/cards/magic/card_magic_blast.webp',
  effects: [{ type: 'damage', value: 9 }],
  description: '造成 9 點秘術傷害。',
};

const BASE_MAGIC_GAZE: Omit<Card, 'id' | 'flavorText'> = {
  name: '厄運凝視',
  category: 'magic',
  costType: 'sanity',
  costValue: 2,
  isTemporary: false,
  tier: 1,
  occupations: ['occultist'],
  artworkUrl: '/cards/magic/card_magic_gaze.png',
  effects: [{ type: 'damage', value: 16 }],
  description: '造成 16 點秘術傷害。',
};

const BASE_ASTRAL_WARD: Omit<Card, 'id' | 'flavorText'> = {
  name: '星界庇護',
  category: 'skill',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['occultist'],
  artworkUrl: '/cards/skill/card_astral_ward.png',
  effects: [{ type: 'armor', value: 6 }],
  description: '獲得 6 點護甲。',
};

const BASE_MEDITATE: Omit<Card, 'id' | 'flavorText'> = {
  name: '心靈冥想',
  category: 'skill',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['occultist'],
  artworkUrl: '/cards/skill/card_meditate.png',
  effects: [{ type: 'restore_sanity', value: 2 }],
  description: '洗回 2 張卡牌至理智牌庫。',
};

const BASE_RITUAL_DAGGER: Omit<Card, 'id' | 'flavorText'> = {
  name: '防身短刀',
  category: 'combat',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['occultist'],
  artworkUrl: '/cards/combat/card_ritual_dagger.webp',
  effects: [
    { type: 'damage', value: 3 },
    { type: 'armor', value: 3 },
  ],
  description: '造成 3 點物理傷害，獲得 3 點護甲。',
};

/**
 * 艾蓮諾·凡斯（秘術學者）起始牌組卡牌 (12 張)
 */
export const OCCULTIST_STARTER_CARDS: Card[] = [
  createStarterVariant(
    BASE_MAGIC_BLAST,
    'card_magic_blast_1',
    '「思維被撕裂的瞬間，無形的衝擊波在空中炸裂出紫色火花。」'
  ),
  createStarterVariant(
    BASE_MAGIC_BLAST,
    'card_magic_blast_2',
    '「精神共鳴化為刺痛神經的利箭。」'
  ),
  createStarterVariant(
    BASE_MAGIC_GAZE,
    'card_magic_gaze_1',
    '「直視來自異次元的虛空陰影，受創的怪物皮肉開始崩解腐化。」'
  ),
  createStarterVariant(
    BASE_MAGIC_GAZE,
    'card_magic_gaze_2',
    '「深淵的回響將眼前的邪物撕得支離破碎。」'
  ),
  createStarterVariant(
    BASE_ASTRAL_WARD,
    'card_astral_ward_1',
    '「在周身勾勒出不可名狀的星軌結界。」'
  ),
  createStarterVariant(
    BASE_ASTRAL_WARD,
    'card_astral_ward_2',
    '「古老的幾何符號偏轉了怪物的致命撲殺。」'
  ),
  createStarterVariant(
    BASE_MEDITATE,
    'card_meditate_1',
    '「在狂亂的幻覺浪潮中，強行構築一道理性的防波堤。」'
  ),
  createStarterVariant(
    BASE_MEDITATE,
    'card_meditate_2',
    '「重新默誦《玄密七章》的安定真言。」'
  ),
  {
    id: 'card_silver_key_1',
    name: '銀鑰儀式',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    occupations: ['occultist'],
    artworkUrl: '/cards/truth/card_silver_key.png',
    effects: [
      { type: 'self_damage', value: 1 },
      { type: 'add_to_deck', value: 2 },
    ],
    description: '自身承受 1 點反噬傷害，向理智牌庫注入 2 張真相卡牌。',
    flavorText: '「旋轉銀色鑰匙，推開通向終極真相的一絲門縫。」',
  },
  {
    id: 'card_truth_fragment_2',
    name: '舊日殘頁',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    occupations: ['occultist'],
    artworkUrl: '/cards/truth/card_truth_fragment.webp',
    effects: [
      { type: 'self_damage', value: 2 },
      { type: 'add_to_deck', value: 2 },
    ],
    description: '自身承受 2 點反噬傷害，向理智牌庫注入 2 張真相卡牌。',
    flavorText: '「窺見了世界真實的一角，肉身在戰慄，但混亂的心智為之驟然清醒。」',
  },
  createStarterVariant(
    BASE_RITUAL_DAGGER,
    'card_ritual_dagger_1',
    '「刀柄刻滿如尼守護文的銀質短刀，防身亦可用於刻印儀式。」'
  ),
  createStarterVariant(
    BASE_RITUAL_DAGGER,
    'card_ritual_dagger_2',
    '「在近身肉搏中精準刺向敵人的致命關節。」'
  ),
];
