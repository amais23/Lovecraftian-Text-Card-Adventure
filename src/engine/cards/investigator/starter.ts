import type { Card } from '../../../types/game';
import { createStarterVariant } from '../../cardFactory';

const BASE_REVOLVER: Omit<Card, 'id' | 'flavorText'> = {
  name: '左輪射擊',
  category: 'combat',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['investigator'],
  artworkUrl: '/cards/combat/card_revolver.webp',
  effects: [
    { type: 'damage', value: 5 },
    { type: 'draw', value: 1, condition: { type: 'target_has_status', statusType: 'vulnerable' } },
  ],
  description: '造成 5 點物理傷害；若目標處於【易傷】狀態，立即抽取 1 張卡牌。',
};

const BASE_PUNCH: Omit<Card, 'id' | 'flavorText'> = {
  name: '重拳壓制',
  category: 'combat',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['investigator'],
  artworkUrl: '/cards/combat/card_punch.webp',
  effects: [
    { type: 'damage', value: 4 },
    {
      type: 'apply_status',
      target: 'enemy',
      statusType: 'weak',
      value: 1,
      condition: { type: 'enemy_intent_is_attack' },
    },
  ],
  description: '造成 4 點物理傷害；若敵方當前意圖為攻擊，使敵方陷入 1 層【破勢】（下回合造成的攻擊傷害降低 50%）。',
};

const BASE_CANE: Omit<Card, 'id' | 'flavorText'> = {
  name: '鉛頭手杖',
  category: 'combat',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['investigator'],
  artworkUrl: '/cards/combat/card_cane.webp',
  effects: [
    { type: 'damage', value: 4 },
    { type: 'apply_status', target: 'enemy', statusType: 'vulnerable', value: 1 },
  ],
  description: '造成 4 點物理傷害，施加 1 層【易傷】（每層使受到的物理傷害 +1）。',
};

/**
 * 愛德華·皮爾斯（私家偵探）起始牌組卡牌 (12 張)
 */
export const INVESTIGATOR_STARTER_CARDS: Card[] = [
  createStarterVariant(
    BASE_REVOLVER,
    'card_revolver_1',
    '「點38子彈出膛的火光，是這座潮濕地窖中唯一的真實。」'
  ),
  createStarterVariant(
    BASE_REVOLVER,
    'card_revolver_2',
    '「清脆的擊錘聲在腐臭的空氣中迴盪。」'
  ),
  createStarterVariant(
    BASE_PUNCH,
    'card_punch_1',
    '「在波士頓碼頭學會的街頭格鬥術，對怪物依然管用。」'
  ),
  createStarterVariant(
    BASE_PUNCH,
    'card_punch_2',
    '「皮肉撞擊的沉悶聲響令人作嘔。」'
  ),
  createStarterVariant(
    BASE_PUNCH,
    'card_punch_3',
    '「凡人的關節在哀鳴，但你別無選擇。」'
  ),
  {
    id: 'card_bayonet_1',
    name: '軍刀突刺',
    category: 'combat',
    costType: 'stamina',
    costValue: 2,
    isTemporary: false,
    tier: 1,
    occupations: ['investigator'],
    artworkUrl: '/cards/combat/card_bayonet.webp',
    effects: [
      {
        type: 'damage',
        value: 9,
        piercing: true,
        condition: { type: 'target_has_status', statusType: 'vulnerable', bonusValue: 4 },
      },
    ],
    description: '造成 9 點物理傷害（真實穿刺，無視護甲直扣生命值）；若目標處於【易傷】狀態，傷害提升至 13 點。',
    flavorText: '「帶著軍旅生涯的殘留記憶，你將鋒利的刺刀狠命扎入敵人的腐肉。」',
  },
  createStarterVariant(
    BASE_CANE,
    'card_cane_1',
    '「紳士的防身行頭，手杖內部灌滿了實心黑鉛。」'
  ),
  createStarterVariant(
    BASE_CANE,
    'card_cane_2',
    '「精準打擊關節，讓畸形軀體為之頓挫。」'
  ),
  {
    id: 'card_cover_1',
    name: '就地掩蔽',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    keywords: ['retain', 'charge_growth'],
    occupations: ['investigator'],
    artworkUrl: '/cards/skill/card_cover.webp',
    effects: [{ type: 'armor', value: 5 }],
    description: '【保留】獲得 5 點護甲；在手中每保留 1 回合，打出時額外獲得 +2 護甲（至多 +6 點護甲）。',
    flavorText: '「翻倒厚重的橡木長桌，碎屑如驟雨般飛濺。」',
  },
  {
    id: 'card_breathe_1',
    name: '深呼吸',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    occupations: ['investigator'],
    artworkUrl: '/cards/skill/card_breathe.webp',
    effects: [
      { type: 'restore_sanity', value: 2 },
      { type: 'heal', value: 4, condition: { type: 'low_health', threshold: 0.5 } },
    ],
    description: '洗回 2 張卡牌至理智牌庫；若當前生命值不高於 50%，額外恢復 4 點肉體生命值。',
    flavorText: '「緊閉雙眼，強迫狂亂跳動的心臟放緩節奏。」',
  },
  {
    id: 'card_sedative_1',
    name: '醫療鎮定劑',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    occupations: ['investigator'],
    artworkUrl: '/cards/skill/card_sedative.webp',
    effects: [
      { type: 'restore_sanity', value: 2 },
      { type: 'cleanse_debuffs', value: 1 },
    ],
    description: '洗回 2 張卡牌至理智牌庫，並淨化自身所有負面狀態印記各 1 層。',
    flavorText: '「刺鼻的化學藥劑推入靜脈，混亂的囈語暫時歸於死寂。」',
  },
  {
    id: 'card_truth_fragment_1',
    name: '舊日殘頁',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    occupations: ['investigator'],
    artworkUrl: '/cards/truth/card_truth_fragment.webp',
    effects: [
      { type: 'self_damage', value: 2 },
      { type: 'add_to_deck', value: 2 },
    ],
    description: '自身承受 2 點反噬傷害，向理智牌庫注入 2 張真相卡牌。',
    flavorText: '「窺見了世界真實的一角，肉身在戰慄，但混亂的心智為之驟然清醒。」',
  },
];
