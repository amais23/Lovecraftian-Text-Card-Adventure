import type { Card } from '../../../types/game';

export const ABYSSAL_FRAGMENT_1: Card = {
  id: 'card_abyssal_fragment_1',
  name: '深淵封印殘片·其一',
  category: 'madness',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  isUnplayable: true,
  artworkUrl: '/cards/madness/card_abyssal_fragment_1.png',
  effects: [],
  description: '無法打出。佔據手牌卡槽。集齊三枚引發星辰共鳴。',
  flavorText: '「第一塊浸泡著黑泥的原生殘片，在手心傳遞著刺骨的深淵脈動。」',
};

export const ABYSSAL_FRAGMENT_2: Card = {
  id: 'card_abyssal_fragment_2',
  name: '深淵封印殘片·其二',
  category: 'madness',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  isUnplayable: true,
  artworkUrl: '/cards/madness/card_abyssal_fragment_2.png',
  effects: [],
  description: '無法打出。佔據手牌卡槽。散發幽暗深海寒意。',
  flavorText: '「第二塊帶有海蝕太古星圖的殘片，低語著拉萊耶的古老潮鳴。」',
};

export const ABYSSAL_FRAGMENT_3: Card = {
  id: 'card_abyssal_fragment_3',
  name: '深淵封印殘片·其三',
  category: 'madness',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  isUnplayable: true,
  artworkUrl: '/cards/madness/card_abyssal_fragment_3.png',
  effects: [],
  description: '無法打出。佔據手牌卡槽。三枚齊聚深淵質變。',
  flavorText: '「最後一塊殘片歸位，不可名狀的舊日律動在靈魂深處合為一體。」',
};

export const COMPLETE_ANCIENT_SEAL: Card = {
  id: 'card_complete_ancient_seal',
  name: '完整的深淵古印',
  category: 'truth',
  costType: 'free',
  costValue: 0,
  isTemporary: false,
  tier: 4,
  keywords: ['innate'],
  artworkUrl: '/cards/truth/card_complete_ancient_seal.png',
  effects: [
    { type: 'restore_sanity', value: 10 },
    { type: 'armor', value: 20 },
    { type: 'add_to_deck', value: 5 },
  ],
  description: '【固有】開局必定抽至手中。洗回 10 張卡牌至理智牌庫，獲得 20 點護甲，向理智牌庫注入 5 張真相卡牌。終極首領神性未破（生命值大於 1 點）前無法打出；生命值降至 1 點時解鎖釋放，打出即引發太古星辰終極封滅。',
  flavorText: '「當三枚殘片嵌合的剎那，深淵的污穢化為純淨真理，虛空裂隙為之洞開。」',
};

export const ALL_ABYSSAL_CARDS: Card[] = [
  ABYSSAL_FRAGMENT_1,
  ABYSSAL_FRAGMENT_2,
  ABYSSAL_FRAGMENT_3,
  COMPLETE_ANCIENT_SEAL,
];
