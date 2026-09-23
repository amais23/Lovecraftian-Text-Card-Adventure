import type { Card } from '../../../types/game';

/* =========================================================
   Event Lore Cards & Sanctuary Templates (ADR-0033)
   ========================================================= */

export const CARD_EVENT_BREAKWATER: Card = {
  id: 'card_event_breakwater',
  name: '心智防波堤',
  category: 'truth',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/truth/card_breakwater.png',
  effects: [
    { type: 'self_damage', value: 1 },
    { type: 'add_to_deck', value: 3 },
  ],
  description: '自身承受 1 點反噬傷害，向理智牌庫注入 3 張真相卡牌。',
  flavorText: '「在不可名狀的瘋狂浪潮面前，構築起頑強的理性防波堤。」',
};

export const TRUTH_CARD_BREAKWATER: Omit<Card, 'id'> = CARD_EVENT_BREAKWATER;

export const CARD_EVENT_UNDERWATER_DEMOLITION: Card = {
  id: 'card_event_underwater_demolition',
  name: '水下爆破',
  category: 'combat',
  costType: 'stamina',
  costValue: 2,
  isTemporary: false,
  tier: 2,
  keywords: ['exhaust'],
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/combat/card_underwater_demolition.png',
  effects: [{ type: 'damage', value: 16 }],
  description: '造成 16 點物理傷害。【消耗】引爆強力水下炸藥，打出後移出戰鬥。',
  flavorText: '「在深海狹道中，火藥是凡人唯一的依靠。」',
};

export const CARD_EVENT_TIDE_WHISPER: Card = {
  id: 'card_event_tide_whisper',
  name: '潮汐之音',
  category: 'truth',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 2,
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/truth/card_tide_whisper.png',
  effects: [{ type: 'add_to_deck', value: 3 }],
  description: '傾聽深海潮音，向理智牌庫注入 3 張真相卡牌。',
  flavorText: '「在無休止的潮汐拍擊中重獲清明。」',
};

export const CARD_EVENT_PROTO_TENTACLE: Card = {
  id: 'card_event_proto_tentacle',
  name: '原形觸鬚',
  category: 'combat',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 2,
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/combat/card_proto_tentacle.png',
  effects: [
    { type: 'damage', value: 14 },
    { type: 'self_damage', value: 2 },
  ],
  description: '造成 14 點物理傷害。揮舞原生質觸手，自身承受 2 點反噬傷害。',
  flavorText: '「以肉身為媒介釋放的原生狂怒。」',
};

export const CARD_EVENT_ELDER_GEOMETRY: Card = {
  id: 'card_event_elder_geometry',
  name: '太古幾何密卷',
  category: 'truth',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 2,
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/truth/card_elder_geometry.png',
  effects: [
    { type: 'self_damage', value: 1 },
    { type: 'add_to_deck', value: 4 },
  ],
  description: '自身承受 1 點反噬傷害，向理智牌庫注入 4 張真相卡牌。',
  flavorText: '「超越三維空間的古老真理。」',
};

export const CARD_EVENT_STAR_SPAWN_SIGIL: Card = {
  id: 'card_event_star_spawn_sigil',
  name: '星之眷族印記',
  category: 'skill',
  costType: 'stamina',
  costValue: 2,
  isTemporary: false,
  tier: 3,
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/skill/card_star_spawn_sigil.png',
  effects: [
    { type: 'armor', value: 12 },
    { type: 'add_to_deck', value: 2 },
  ],
  description: '凝聚星辰護壁，獲得 12 點護甲並向理智牌庫注入 2 張真相卡牌。',
  flavorText: '「神祇巨影投射在現實裂隙上的堅固屏障。」',
};

export const CARD_EVENT_DIMENSION_STRIDE: Card = {
  id: 'card_event_dimension_stride',
  name: '維度漫步',
  category: 'skill',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 3,
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/skill/card_dimension_stride.png',
  effects: [
    { type: 'damage', value: 10 },
    { type: 'armor', value: 8 },
  ],
  description: '造成 10 點物理傷害，獲得 8 點護甲。穿梭於重力倒錯的維度間。',
  flavorText: '「在非歐幾何的殿堂中，直線並非最短距離。」',
};

export const CARD_EVENT_FINAL_AWAKENING: Card = {
  id: 'card_event_final_awakening',
  name: '終焉覺悟',
  category: 'truth',
  costType: 'stamina',
  costValue: 0,
  isTemporary: false,
  tier: 4,
  keywords: ['exhaust'],
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/truth/card_final_awakening.png',
  effects: [{ type: 'add_to_deck', value: 5 }],
  description: '【消耗】。向理智牌庫注入 5 張真相卡牌，堅定最後的理智意志。打出後移出戰鬥。',
  flavorText: '「縱使星辰正位，人性永不磨滅。」',
};

export const CARD_EVENT_DEEP_TRUTH: Card = {
  id: 'event_card_deep_truth',
  name: '深潛者手札',
  category: 'truth',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  tier: 1,
  occupations: ['investigator', 'occultist'],
  artworkUrl: '/cards/truth/card_deep_truth.png',
  effects: [
    { type: 'self_damage', value: 2 },
    { type: 'add_to_deck', value: 3 },
  ],
  description: '自身承受 2 點反噬傷害，向理智牌庫注入 3 張真相卡牌。',
  flavorText: '「在海底兩萬哩的泥濘中，真實正在靜默呼吸。」',
};

export const EVENT_LORE_CARDS: Card[] = [
  CARD_EVENT_UNDERWATER_DEMOLITION,
  CARD_EVENT_TIDE_WHISPER,
  CARD_EVENT_PROTO_TENTACLE,
  CARD_EVENT_ELDER_GEOMETRY,
  CARD_EVENT_STAR_SPAWN_SIGIL,
  CARD_EVENT_DIMENSION_STRIDE,
  CARD_EVENT_FINAL_AWAKENING,
  CARD_EVENT_DEEP_TRUTH,
  CARD_EVENT_BREAKWATER,
];
