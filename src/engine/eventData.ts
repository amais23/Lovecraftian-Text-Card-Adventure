import type { Card, Enemy, EnemyIntent, MarketItem, MythosEvent } from '../types/game';

/* =========================================================
   Elite & Boss Enemies
   ========================================================= */

export const DEEP_ONE_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 10,
    name: '珊瑚骨刺穿刺',
    description: '深潛者長老揮動鋒利的珊瑚骨刺，預告造成 10 點傷害。',
  },
  {
    type: 'erode',
    value: 3,
    name: '深海潮汐尖嘯',
    description: '深潛者長老張開鰓裂發出刺耳音波，預告侵蝕 3 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 12,
    name: '深淵拍擊',
    description: '沉重的海獸鱗尾橫掃而來，預告造成 12 點傷害。',
  },
];

export const INITIAL_DEEP_ONE: Enemy = {
  id: 'enemy_deep_one_elder',
  name: '深潛者長老 (Deep One Elder)',
  title: '舊日大袞的祭司',
  health: 45,
  maxHealth: 45,
  armor: 4,
  currentIntent: DEEP_ONE_INTENTS[0],
  intentSequence: DEEP_ONE_INTENTS,
  currentIntentIndex: 0,
};

export const SHOGGOTH_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 12,
    name: '原生質癲狂鞭笞',
    description: '巨大黑泥肉塊抽打出數十條黏液觸手，預告造成 12 點傷害。',
  },
  {
    type: 'erode',
    value: 3,
    name: '不可名狀之眼',
    description: '身上浮現無數閃爍綠光的眼球，預告侵蝕 3 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 16,
    name: '泰克利利碾壓',
    description: '伴隨尖銳的笛音鳴叫泰克利利！龐大軀體泰山壓頂，預告造成 16 點傷害。',
  },
];

export const INITIAL_SHOGGOTH: Enemy = {
  id: 'enemy_shoggoth_progeny',
  name: '修格斯幼體 (Shoggoth Progeny)',
  title: '原形黑泥異構體',
  health: 60,
  maxHealth: 60,
  armor: 6,
  currentIntent: SHOGGOTH_INTENTS[0],
  intentSequence: SHOGGOTH_INTENTS,
  currentIntentIndex: 0,
};

/* =========================================================
   Mythos Events Script Database
   ========================================================= */

export const MYTHOS_EVENTS: Record<string, MythosEvent> = {
  event_sunken_shrine: {
    id: 'event_sunken_shrine',
    title: '淹沒的無名石龕',
    location: '舊阿卡姆地下排水總渠',
    storyText: [
      '腳下冰冷刺骨的黑水漫過腳踝，空氣中瀰漫著濃烈的死魚與腐爛海藻氣息。在排水管道盡頭，一座被藤壺與墨綠苔蘚覆蓋的黑色玄武岩石龕半浸在積水中。',
      '石龕頂端刻滿了反覆出現的波浪與三叉幾何紋樣，石龕內似乎供奉著某種浸染著非人血液的青銅匣。微弱的潮汐聲在封閉的管道中隱隱迴盪……',
    ],
    options: [
      {
        id: 'shrine_inspect',
        text: '用手套撫摸並擦拭石龕上的波浪銘文',
        costDescription: '消耗 2 點理智牌庫，獲得白色真相卡【深潛者手札】',
        consequences: [
          {
            type: 'sanity_change',
            value: -2,
            narrative: '冰冷滑膩的觸感直刺腦髓，你窺見了深海無光之城的輪廓，理智牌庫被侵蝕了 2 點。',
          },
          {
            type: 'gain_card',
            card: {
              id: 'event_card_deep_truth',
              name: '深潛者手札',
              category: 'truth',
              costType: 'stamina',
              costValue: 1,
              isTemporary: false,
              effects: [
                { type: 'self_damage', value: 2 },
                { type: 'add_to_deck', value: 3 },
              ],
              description: '承受 2 點認知傷害，向理智牌庫注入 3 張真相卡。',
              flavorText: '「在海底兩萬哩的泥濘中，真實正在靜默呼吸。」',
            },
            narrative: '獲得特殊真相卡【深潛者手札】納入理智牌庫！',
          },
        ],
      },
      {
        id: 'shrine_pry',
        text: '用撬棍強行鑿開石龕頂部的青銅裝飾',
        costDescription: '承受 4 點肉體生命傷害，獲得 20 古金幣',
        consequences: [
          {
            type: 'health_change',
            value: -4,
            narrative: '青銅邊緣爆發尖銳的金屬逆刺劃破了你的手臂，造成 4 點肉體生命傷害。',
          },
          {
            type: 'gain_obols',
            value: 20,
            narrative: '散落出 20 枚帶有深海雕刻的古金幣（+20 古金幣）。',
          },
        ],
      },
      {
        id: 'shrine_disturb',
        text: '驚覺水面劇烈翻滾，拔出武器防備！',
        costDescription: '立即觸發常規遭遇戰',
        consequences: [
          {
            type: 'trigger_combat',
            narrative: '一隻渾身覆滿淤泥的食屍鬼從水底猛撲而出！',
          },
        ],
      },
    ],
  },

  event_whispering_bookseller: {
    id: 'event_whispering_bookseller',
    title: '低語的二手古籍商',
    location: '法蘭西斯街角古董暗店',
    storyText: [
      '推開掛著銅鈴的厚重橡木門，店內堆積如山的羊皮手稿與皮革書脊散發出乾燥的陳腐灰塵味。',
      '櫃檯後坐著一位身穿褪色燕尾服、臉色毫無血色的老人。他的眼眶深深凹陷，嘴角咧出一抹詭異而僵硬的微笑：「年輕人，你身上帶著……舊日的餘味。想要買點能防身、或者能看清真實的珍本嗎？」',
    ],
    options: [
      {
        id: 'book_buy',
        text: '購買老人展示的黑皮典籍殘卷',
        costDescription: '花費 15 古金幣，獲得紫色魔法卡【虛空烈焰】',
        requires: { obols: 15 },
        consequences: [
          {
            type: 'gain_obols',
            value: -15,
            narrative: '你交付了 15 枚古金幣。',
          },
          {
            type: 'gain_card',
            card: {
              id: 'event_card_void_flame',
              name: '虛空烈焰',
              category: 'magic',
              costType: 'sanity',
              costValue: 2,
              isTemporary: false,
              effects: [{ type: 'damage', value: 18 }],
              description: '消耗 2 點理智，引燃不可熄滅的紫色冷焰造成 18 點傷害。',
              flavorText: '「燃燒靈魂碎片釋放的星辰冷火。」',
            },
            narrative: '典籍上的文字如活物般蠕動，獲得魔法卡【虛空烈焰】納入理智牌庫！',
          },
        ],
      },
      {
        id: 'book_browse',
        text: '無視警告強行翻閱櫃檯上的發黃星圖',
        costDescription: '承受 3 點肉體生命傷害，獲得白色真相卡【星界洞察】',
        consequences: [
          {
            type: 'health_change',
            value: -3,
            narrative: '書頁邊緣附著腐蝕性粉塵，指尖劇烈灼痛受到 3 點生命傷害。',
          },
          {
            type: 'gain_card',
            card: {
              id: 'event_card_astral_insight',
              name: '星界洞察',
              category: 'truth',
              costType: 'stamina',
              costValue: 1,
              isTemporary: false,
              effects: [
                { type: 'self_damage', value: 2 },
                { type: 'add_to_deck', value: 3 },
              ],
              description: '承受 2 點認知傷害，向理智牌庫注入 3 張真相卡。',
              flavorText: '「意識升入無垠星穹，心智雖千瘡百孔，卻獲得浩瀚的安寧。」',
            },
            narrative: '腦海中烙印下星辰運行的禁忌軌跡，獲得真相卡【星界洞察】！',
          },
        ],
      },
      {
        id: 'book_leave',
        text: '感到寒毛直豎，禮貌致歉並迅速離開',
        costDescription: '無事發生',
        consequences: [
          {
            type: 'sanity_change',
            value: 0,
            narrative: '老人的低笑聲在背後迴盪，你平安退回街角。',
          },
        ],
      },
    ],
  },

  event_asylum_ward: {
    id: 'event_asylum_ward',
    title: '精神療養院的禁忌病房',
    location: '阿卡姆療養院地底禁閉區',
    storyText: [
      '鏽蝕的鐵欄門虛掩著，病房四周鋪設著發霉泛黃的軟墊。牆面上滿是用指甲深刻下的星系同心圓與不可名狀的舊印符號。',
      '地板中央留有一具早已風乾的病患乾屍，手中死死攥著一本浸染著暗褐污漬的病歷記錄。',
    ],
    options: [
      {
        id: 'asylum_blood',
        text: '割破手腕，用自己的鮮血補完牆面未完成的儀式圓環',
        costDescription: '承受 5 點肉體生命傷害，獲得 25 古金幣',
        consequences: [
          {
            type: 'health_change',
            value: -5,
            narrative: '鮮血滴落，圖騰散發出微弱的幽光，你承受了 5 點肉體生命傷害。',
          },
          {
            type: 'gain_obols',
            value: 25,
            narrative: '乾屍指縫間掉落出一袋沉甸甸的古金幣（+25 古金幣）！',
          },
        ],
      },
      {
        id: 'asylum_record',
        text: '拾取並研讀乾屍手中的病歷記錄',
        costDescription: '消耗 1 點理智牌庫，獲得技能卡【應急急救包】',
        consequences: [
          {
            type: 'sanity_change',
            value: -1,
            narrative: '病歷上瘋狂的筆跡衝擊著你的神經，消耗 1 點理智牌庫。',
          },
          {
            type: 'gain_card',
            card: {
              id: 'event_card_first_aid',
              name: '應急急救包',
              category: 'skill',
              costType: 'stamina',
              costValue: 1,
              isTemporary: false,
              effects: [
                { type: 'armor', value: 3 },
                { type: 'restore_sanity', value: 2 },
              ],
              description: '獲得 3 點護甲值，並將棄牌堆中 2 張卡牌洗回理智牌庫。',
              flavorText: '「酒精與繃帶能穩固搖搖欲墜的精神防線。」',
            },
            narrative: '在病床暗格中找到了留存的醫療物資，獲得技能卡【應急急救包】！',
          },
        ],
      },
      {
        id: 'asylum_burn',
        text: '點燃火柴焚毀病房中的邪惡符號，迅速撤離',
        costDescription: '無事發生',
        consequences: [
          {
            type: 'health_change',
            value: 0,
            narrative: '烈火吞噬了褻瀆的痕跡，你轉身離開了這座冰冷的牢籠。',
          },
        ],
      },
    ],
  },

  event_abandoned_carriage: {
    id: 'event_abandoned_carriage',
    title: '迷霧中的傾覆馬車',
    location: '米斯卡託尼克河畔荒道',
    storyText: [
      '濃重的冷霧中橫躺著一輛被巨力掀翻的黑色廂式馬車。拉車的馬匹只剩下殘破的骨架，四周散落著撕裂的皮箱與破爛的衣物。',
      '車廂內部傳來微弱的液體滴答聲，某種未知的沉重喘息在迷霧深處若隱若現……',
    ],
    options: [
      {
        id: 'carriage_search',
        text: '冒險鑽入傾覆的車廂深處搜刮遺留的箱子',
        costDescription: '獲得 15 古金幣',
        consequences: [
          {
            type: 'gain_obols',
            value: 15,
            narrative: '在破損的暗格中摸到了一袋未被搶走的古金幣（+15 古金幣）！',
          },
        ],
      },
      {
        id: 'carriage_salvage',
        text: '搜刮散落的應急防衛工具',
        costDescription: '獲得戰鬥卡【左輪射擊】',
        consequences: [
          {
            type: 'gain_card',
            card: {
              id: 'event_card_revolver_salvaged',
              name: '左輪射擊',
              category: 'combat',
              costType: 'stamina',
              costValue: 1,
              isTemporary: false,
              effects: [{ type: 'damage', value: 6 }],
              description: '造成 6 點物理傷害。',
              flavorText: '「點38子彈出膛的火光，是這座潮濕地窖中唯一的真實。」',
            },
            narrative: '撿起一把還能使用的制式左輪手槍，獲得戰鬥卡【左輪射擊】！',
          },
        ],
      },
      {
        id: 'carriage_flee',
        text: '警惕迷霧中的野獸喘息，謹慎繞道離開',
        costDescription: '無事發生',
        consequences: [
          {
            type: 'health_change',
            value: 0,
            narrative: '你悄無聲息地穿過迷霧，避開了潛伏在暗處的窺伺。',
          },
        ],
      },
    ],
  },
};

export const DEFAULT_EVENT_KEYS = [
  'event_sunken_shrine',
  'event_whispering_bookseller',
  'event_asylum_ward',
  'event_abandoned_carriage',
];

/**
 * 依據節點 ID 或隨機取得一套奇遇劇本
 */
export function getMythosEventForNode(nodeId: string): MythosEvent {
  // Deterministic mapping based on node ID
  if (nodeId.includes('0_1')) return JSON.parse(JSON.stringify(MYTHOS_EVENTS.event_abandoned_carriage));
  if (nodeId.includes('1_0')) return JSON.parse(JSON.stringify(MYTHOS_EVENTS.event_sunken_shrine));
  if (nodeId.includes('2_2')) return JSON.parse(JSON.stringify(MYTHOS_EVENTS.event_whispering_bookseller));
  if (nodeId.includes('3_1')) return JSON.parse(JSON.stringify(MYTHOS_EVENTS.event_asylum_ward));

  return JSON.parse(JSON.stringify(MYTHOS_EVENTS.event_sunken_shrine));
}

/* =========================================================
   Shared Sanctuary & Market Card Templates
   ========================================================= */

export const TRUTH_CARD_BREAKWATER: Omit<Card, 'id'> = {
  name: '心智防波堤',
  category: 'truth',
  costType: 'stamina',
  costValue: 1,
  isTemporary: false,
  effects: [
    { type: 'self_damage', value: 1 },
    { type: 'add_to_deck', value: 3 },
  ],
  description: '承受 1 點肉體傷害，向理智牌庫注入 3 張真相卡。',
  flavorText: '「在不可名狀的瘋狂浪潮面前，構築起頑強的理性防波堤。」',
};

/* =========================================================
   Black Market Stock Generator
   ========================================================= */

export function generateDefaultMarketItems(): MarketItem[] {
  return [
    {
      id: 'market_item_trench_gun',
      name: '戰壕雙管獵槍',
      type: 'card',
      price: 20,
      description: '強大的物理重型武器，造成 14 點巨大物理傷害。',
      card: {
        id: 'card_market_shotgun',
        name: '雙管獵槍',
        category: 'combat',
        costType: 'stamina',
        costValue: 2,
        isTemporary: false,
        effects: [{ type: 'damage', value: 14 }],
        description: '造成 14 點物理傷害。',
        flavorText: '「12號口徑鹿彈撕裂腐肉的轟鳴，足以撕裂最深沉的夢魘。」',
      },
    },
    {
      id: 'market_item_amulet',
      name: '遠古青銅護身符',
      type: 'card',
      price: 18,
      description: '銘刻舊印符號的青銅飾物，獲得 8 點累積護甲值。',
      card: {
        id: 'card_market_amulet',
        name: '遠古護身符',
        category: 'skill',
        costType: 'stamina',
        costValue: 1,
        isTemporary: false,
        effects: [{ type: 'armor', value: 8 }],
        description: '激發符石古老力場，獲得 8 點護甲值。',
        flavorText: '「青銅上的深綠包漿散發著阻絕污穢的冰涼氣息。」',
      },
    },
    {
      id: 'market_item_truth_scroll',
      name: '心智防波堤手稿',
      type: 'card',
      price: 15,
      description: '記載精神分析與冥想防護的真相典籍，將 3 張真相卡洗回理智牌庫。',
      card: {
        ...TRUTH_CARD_BREAKWATER,
        id: 'card_market_breakwater',
      },
    },
    {
      id: 'market_item_morphine',
      name: '軍用嗎啡注射劑',
      type: 'heal',
      price: 15,
      healAmount: 8,
      description: '戰地急救藥品，立即恢復 8 點肉體生命值（受最大生命值限制）。',
    },
    {
      id: 'market_item_alcohol',
      name: '高純度酒精繃帶',
      type: 'heal',
      price: 10,
      healAmount: 5,
      description: '簡易消毒止血用品，立即恢復 5 點肉體生命值。',
    },
  ];
}
