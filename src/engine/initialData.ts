import type { Card, Enemy, EnemyIntent, Investigator } from '../types/game';

export const INITIAL_INVESTIGATOR: Investigator = {
  name: '愛德華·皮爾斯 (Edward Pierce)',
  occupation: '私家偵探',
  health: 25,
  maxHealth: 25,
  stamina: 3,
  maxStamina: 3,
  armor: 0,
  obols: 15,
};

export const INITIAL_DECK: Card[] = [
  {
    id: 'card_revolver_1',
    name: '左輪射擊',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 6 }],
    description: '造成 6 點物理傷害。',
    flavorText: '「點38子彈出膛的火光，是這座潮濕地窖中唯一的真實。」',
  },
  {
    id: 'card_revolver_2',
    name: '左輪射擊',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 6 }],
    description: '造成 6 點物理傷害。',
    flavorText: '「清脆的擊錘聲在腐臭的空氣中迴盪。」',
  },
  {
    id: 'card_punch_1',
    name: '重拳壓制',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 4 }],
    description: '造成 4 點物理傷害。',
    flavorText: '「在波士頓碼頭學會的街頭格鬥術，對怪物依然管用。」',
  },
  {
    id: 'card_punch_2',
    name: '重拳壓制',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 4 }],
    description: '造成 4 點物理傷害。',
    flavorText: '「皮肉撞擊的沉悶聲響令人作嘔。」',
  },
  {
    id: 'card_punch_3',
    name: '重拳壓制',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 4 }],
    description: '造成 4 點物理傷害。',
    flavorText: '「凡人的關節在哀鳴，但你別無選擇。」',
  },
  {
    id: 'card_bayonet_1',
    name: '軍刀突刺',
    category: 'combat',
    costType: 'stamina',
    costValue: 2,
    isTemporary: false,
    effects: [{ type: 'damage', value: 11 }],
    description: '消耗 2 點精力，造成 11 點重度物理傷害。',
    flavorText: '「帶著軍旅生涯的殘留記憶，你將鋒利的刺刀狠命扎入敵人的腐肉。」',
  },
  {
    id: 'card_cane_1',
    name: '鉛頭手杖',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 5 }],
    description: '造成 5 點物理傷害。',
    flavorText: '「紳士的防身行頭，手杖內部灌滿了實心黑鉛。」',
  },
  {
    id: 'card_cane_2',
    name: '鉛頭手杖',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'damage', value: 5 }],
    description: '造成 5 點物理傷害。',
    flavorText: '「精準打擊關節，讓畸形軀體為之頓挫。」',
  },
  {
    id: 'card_cover_1',
    name: '就地掩蔽',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'armor', value: 5 }],
    description: '獲得 5 點護甲值（跨回合持續累積）。',
    flavorText: '「翻倒厚重的橡木長桌，碎屑如驟雨般飛濺。」',
  },
  {
    id: 'card_breathe_1',
    name: '深呼吸',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'restore_sanity', value: 1 }],
    description: '將棄牌堆中 1 張卡牌洗回理智牌庫（回補 1 點理智）。',
    flavorText: '「緊閉雙眼，強迫狂亂跳動的心臟放緩節奏。」',
  },
  {
    id: 'card_sedative_1',
    name: '醫療鎮定劑',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'restore_sanity', value: 2 }],
    description: '將棄牌堆中 2 張卡牌洗回理智牌庫（回補 2 點理智）。',
    flavorText: '「刺鼻的化學藥劑推入靜脈，混亂的囈語暫時歸於死寂。」',
  },
  {
    id: 'card_truth_fragment_1',
    name: '舊日殘頁',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [
      { type: 'self_damage', value: 2 },
      { type: 'add_to_deck', value: 2 },
    ],
    description: '自身承受 2 點肉體認知傷害，強行向理智牌庫注入 2 張新卡牌，解除瘋狂狀態。',
    flavorText: '「窺見了世界真實的一角，肉身在戰慄，但混亂的心智為之驟然清醒。」',
  },
];

export const MADNESS_CARD_TEMPLATES: Card[] = [
  {
    id: 'madness_claw',
    name: '盲目爪擊',
    category: 'madness',
    costType: 'stamina',
    costValue: 1,
    isTemporary: true,
    effects: [
      { type: 'damage', value: 10 },
      { type: 'self_damage', value: 2 },
    ],
    description: '造成 10 點極致物理傷害，自身承受 2 點肉體反噬傷害。',
    flavorText: '「指甲翻開、血肉模糊，但你已感覺不到痛楚。」',
  },
  {
    id: 'madness_screaming',
    name: '深淵狂嘯',
    category: 'madness',
    costType: 'stamina',
    costValue: 1,
    isTemporary: true,
    effects: [
      { type: 'damage', value: 14 },
      { type: 'self_damage', value: 3 },
    ],
    description: '造成 14 點毀滅傷害，自身承受 3 點肉體反噬傷害。',
    flavorText: '「非人的狂吼撕裂了喉管，震碎了眼前怪物的血肉。」',
  },
  {
    id: 'madness_blood_frenzy',
    name: '狂亂血刃',
    category: 'madness',
    costType: 'stamina',
    costValue: 2,
    isTemporary: true,
    effects: [
      { type: 'damage', value: 20 },
      { type: 'self_damage', value: 5 },
    ],
    description: '消耗 2 精力造成 20 點滅絕傷害，自身承受 5 點致命反噬傷害。',
    flavorText: '「燃燒最後的肉魄，化為毀滅深淵的漆黑利刃。」',
  },
];

let madnessCardCounter = 0;

export function generateMadnessCards(count: number): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < count; i++) {
    const template = MADNESS_CARD_TEMPLATES[i % MADNESS_CARD_TEMPLATES.length];
    madnessCardCounter += 1;
    cards.push({
      ...template,
      id: `${template.id}_temp_${Date.now()}_${madnessCardCounter}`,
      isTemporary: true,
    });
  }
  return cards;
}

export const GHOUL_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 6,
    name: '腐臭爪擊',
    description: '食屍鬼揮舞滴淌著黑血與腐土的利爪，預告造成 6 點傷害。',
  },
  {
    type: 'erode',
    value: 2,
    name: '恐懼嘶吼',
    description: '食屍鬼發出穿透靈魂的尖嘯，預告侵蝕你 2 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 8,
    name: '撕咬猛撲',
    description: '食屍鬼如獵犬般伏地前衝，張開滿嘴銳齒預告造成 8 點傷害。',
  },
  {
    type: 'erode',
    value: 1,
    name: '狂亂凝視',
    description: '泛著磷光的盲目雙眼直視你的靈魂，預告侵蝕你 1 點理智牌庫。',
  },
];

export const INITIAL_GHOUL: Enemy = {
  id: 'enemy_ghoul_01',
  name: '食屍鬼 (Ghoul)',
  title: '墓穴的潛伏者',
  health: 30,
  maxHealth: 30,
  armor: 0,
  currentIntent: GHOUL_INTENTS[0],
  intentSequence: GHOUL_INTENTS,
  currentIntentIndex: 0,
};

