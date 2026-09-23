import type { DepthLevel, Enemy, EnemyIntent, MythosEvent } from '../types/game';
import { ELDRITCH_TRAIT_DEFINITIONS } from './enemyTraits';

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
    type: 'defend',
    value: 8,
    name: '大袞庇護水盾',
    description: '調動深海黑水環繞周身，預告獲得 8 點護甲。',
  },
  {
    type: 'attack',
    value: 12,
    name: '巨尾橫掃',
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
  traits: [ELDRITCH_TRAIT_DEFINITIONS.slippery_mucus],
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
  health: 80,
  maxHealth: 80,
  armor: 6,
  currentIntent: SHOGGOTH_INTENTS[0],
  intentSequence: SHOGGOTH_INTENTS,
  currentIntentIndex: 0,
  traits: [ELDRITCH_TRAIT_DEFINITIONS.organ_proliferation],
};

export const DAGON_PRIEST_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 14,
    name: '深淵三叉戟穿刺',
    description: '大袞的深淵祭司揮動佈滿藤壺的黑鐵三叉戟，預告造成 14 點傷害。',
  },
  {
    type: 'erode',
    value: 4,
    name: '海嘯詛咒之禱',
    description: '祭司向深海低吼非人的祭詞，召來冰冷潮汐，預告侵蝕 4 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 18,
    name: '深海溺亡巨浪',
    description: '沉重的狂怒海水化作巨浪拍擊而至，預告造成 18 點傷害。',
  },
];

export const INITIAL_DAGON_PRIEST: Enemy = {
  id: 'enemy_dagon_priest',
  name: '大袞的深淵祭司',
  title: '深海王廷的主祭',
  health: 110,
  maxHealth: 110,
  armor: 8,
  currentIntent: DAGON_PRIEST_INTENTS[0],
  intentSequence: DAGON_PRIEST_INTENTS,
  currentIntentIndex: 0,
  traits: [ELDRITCH_TRAIT_DEFINITIONS.tide_of_dagon],
};

export const COLOSSAL_SHOGGOTH_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 16,
    name: '黑泥滔天巨潮',
    description: '山嶽般的太古黑泥抽打出數十條巨型黏液觸手，預告造成 16 點傷害。',
  },
  {
    type: 'erode',
    value: 5,
    name: '太古癲狂長嘯',
    description: '數以千計的眼球與巨口同時發出笛音尖嘯，預告侵蝕 5 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 22,
    name: '毀滅性原形吞噬',
    description: '泰克利利！龐大軀體如山崩壓頂，預告造成 22 點毀滅性傷害。',
  },
];

export const INITIAL_COLOSSAL_SHOGGOTH: Enemy = {
  id: 'enemy_colossal_shoggoth',
  name: '原生巨型修格斯',
  title: '太古無底深淵的原形支配者',
  health: 135,
  maxHealth: 135,
  armor: 10,
  currentIntent: COLOSSAL_SHOGGOTH_INTENTS[0],
  intentSequence: COLOSSAL_SHOGGOTH_INTENTS,
  currentIntentIndex: 0,
  traits: [ELDRITCH_TRAIT_DEFINITIONS.organ_proliferation],
};

export const STAR_SPAWN_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 20,
    name: '星辰裂解之握',
    description: '巨型龍翼與章魚巨首的舊日眷族伸出利爪，預告造成 20 點傷害。',
  },
  {
    type: 'erode',
    value: 6,
    name: '舊日不朽凝視',
    description: '源自星辰深處的深淵威壓鎖定你的心智，預告侵蝕 6 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 26,
    name: '群星歸位毀滅之震',
    description: '非歐幾何巨石在虛空中震盪崩裂，預告造成 26 點毀滅打擊。',
  },
];

export const INITIAL_STAR_SPAWN: Enemy = {
  id: 'enemy_star_spawn',
  name: '克蘇魯星之眷族',
  title: '拉萊耶沉睡之主的血脈',
  health: 150,
  maxHealth: 150,
  armor: 12,
  divineImmortality: true,
  traits: [ELDRITCH_TRAIT_DEFINITIONS.divine_immortality],
  currentIntent: STAR_SPAWN_INTENTS[0],
  intentSequence: STAR_SPAWN_INTENTS,
  currentIntentIndex: 0,
};

/* =========================================================
   Event Lore Cards & Sanctuary Templates (ADR-0033)
   ========================================================= */

import {
  CARD_EVENT_BREAKWATER,
  TRUTH_CARD_BREAKWATER,
  CARD_EVENT_UNDERWATER_DEMOLITION,
  CARD_EVENT_TIDE_WHISPER,
  CARD_EVENT_PROTO_TENTACLE,
  CARD_EVENT_ELDER_GEOMETRY,
  CARD_EVENT_STAR_SPAWN_SIGIL,
  CARD_EVENT_DIMENSION_STRIDE,
  CARD_EVENT_FINAL_AWAKENING,
  CARD_EVENT_DEEP_TRUTH,
  EVENT_LORE_CARDS,
} from './cards/special/lore';

export {
  CARD_EVENT_BREAKWATER,
  TRUTH_CARD_BREAKWATER,
  CARD_EVENT_UNDERWATER_DEMOLITION,
  CARD_EVENT_TIDE_WHISPER,
  CARD_EVENT_PROTO_TENTACLE,
  CARD_EVENT_ELDER_GEOMETRY,
  CARD_EVENT_STAR_SPAWN_SIGIL,
  CARD_EVENT_DIMENSION_STRIDE,
  CARD_EVENT_FINAL_AWAKENING,
  CARD_EVENT_DEEP_TRUTH,
  EVENT_LORE_CARDS,
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
            card: CARD_EVENT_DEEP_TRUTH,
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
              description: '造成 18 點秘術傷害。',
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
              description: '自身承受 2 點反噬傷害，向理智牌庫注入 3 張真相卡牌。',
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
              description: '獲得 3 點護甲，洗回 2 張卡牌。',
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

  /* =========================================================
     Depth 2 Events (深潛者海蝕迷宮)
     ========================================================= */
  event_drowned_sailor_shrine: {
    id: 'event_drowned_sailor_shrine',
    title: '溺亡水手的黑曜石墓龕',
    location: '深潛者海蝕迷宮 · 鹽漬骨礁',
    storyText: [
      '鹽漬結晶厚重地覆蓋在岩壁上，海水在腳邊退去，露出半具斜倚在玄武岩縫中的水手骸骨。',
      '水手乾枯的雙手緊緊摟抱著一隻刻滿藤壺的青銅海圖匣，身旁散落著帶有海浪花紋的異邦古金幣。空氣中飄散著刺骨的腥冷海風……',
    ],
    options: [
      {
        id: 'sailor_take_relic',
        text: '扳開水手枯指，取走青銅海圖與隨身護符',
        costDescription: '承受 2 點理智牌庫侵蝕，獲得舊日遺物【深海藤壺符】',
        consequences: [
          {
            type: 'sanity_change',
            value: -2,
            narrative: '觸碰護符的瞬間，無盡的溺水窒息感湧入腦海，理智牌庫被侵蝕 2 點。',
          },
          {
            type: 'gain_relic',
            relic: {
              id: 'relic_barnacle_amulet',
              name: '深海藤壺符',
              description: '受大袞祝福的藤壺護符。每場戰鬥開始時獲得 4 點防禦護甲。',
              flavorText: '「海水永不乾涸。」',
              rarity: 'common',
              modifiers: { startingArmor: 4 },
            },
            narrative: '獲得舊日遺物【深海藤壺符】！',
          },
        ],
      },
      {
        id: 'sailor_loot_obols',
        text: '迅速撿拾散落骨礁間的古金幣',
        costDescription: '承受 3 點肉體生命傷害，獲得 22 枚古金幣',
        consequences: [
          {
            type: 'health_change',
            value: -3,
            narrative: '銳利的鹽漬礁石割破了你的腳踝與手掌，造成 3 點肉體生命傷害。',
          },
          {
            type: 'gain_obols',
            value: 22,
            narrative: '自泥沙中拾獲 22 枚浸透海水的古金幣（+22 古金幣）。',
          },
        ],
      },
      {
        id: 'sailor_pray',
        text: '為溺亡者蓋上隨身厚呢外套並低頭默哀',
        costDescription: '恢復 4 點肉體生命值',
        consequences: [
          {
            type: 'health_change',
            value: 4,
            narrative: '片刻的肅穆與尊重驅散了周圍刺骨的陰寒，稍事休整恢復了 4 點肉體生命值。',
          },
        ],
      },
    ],
  },

  event_tide_alchemical_lab: {
    id: 'event_tide_alchemical_lab',
    title: '走私者的深海煉金密窟',
    location: '潮蝕洞窟 · 擱淺破船',
    storyText: [
      '一艘破爛的雙桅走私帆船半卡在海蝕洞穴頂端，船艙內擺滿了散發微弱幽光的玻璃燒杯與蒸餾試管。',
      '木架上的藥劑多數已混濁變質，但其中幾管泛著螢光的藍色液體仍在緩慢沸騰。角落的鐵箱裡還留有未受潮的軍用炸藥物資。',
    ],
    options: [
      {
        id: 'lab_drink_elixir',
        text: '冒險飲用藍色螢光試劑',
        costDescription: '承受 4 點肉體生命傷害，向理智牌庫注入 2 張真相卡【心智防波堤】',
        consequences: [
          {
            type: 'health_change',
            value: -4,
            narrative: '冰涼刺痛的液體如烈火般灼燒食道，承受 4 點肉體生命傷害。',
          },
          {
            type: 'gain_card',
            card: {
              ...TRUTH_CARD_BREAKWATER,
              id: 'event_card_breakwater_d2_1',
            },
            narrative: '藥效激發了意識深處的警覺，向理智牌庫注入真相卡【心智防波堤】！',
          },
        ],
      },
      {
        id: 'lab_take_explosives',
        text: '搬出防水鐵箱中的軍用水下炸藥',
        costDescription: '消耗 15 枚古金幣購買解鎖工具，獲得卡牌【水下爆破】',
        requires: { obols: 15 },
        consequences: [
          {
            type: 'gain_obols',
            value: -15,
            narrative: '使用特殊工具撬開密碼鎖，消耗了 15 枚古金幣。',
          },
          {
            type: 'gain_card',
            card: CARD_EVENT_UNDERWATER_DEMOLITION,
            narrative: '獲得高爆戰鬥卡【水下爆破】納入理智牌庫！',
          },
        ],
      },
      {
        id: 'lab_scavenge_meds',
        text: '翻檢船醫儲物匣尋找急救物資',
        costDescription: '恢復 6 點肉體生命值',
        consequences: [
          {
            type: 'health_change',
            value: 6,
            narrative: '找到未開封的防潮繃帶與消毒酒精，包紮傷口恢復了 6 點肉體生命值。',
          },
        ],
      },
    ],
  },

  event_singing_coral_grotto: {
    id: 'event_singing_coral_grotto',
    title: '鳴響珊瑚的共振洞窟',
    location: '海蝕鐘乳石穴 · 螢光藻淺灘',
    storyText: [
      '洞頂垂下的石乳與水底凸出的幽白珊瑚交錯生長，海水流經珊瑚細孔時，引發出如同多重奏風琴般的尖銳鳴響。',
      '這種聲音正在誘惑你的心智，讓你幾乎想褪去衣衫沉入冰冷的海水之中……',
    ],
    options: [
      {
        id: 'coral_listen',
        text: '沉住心神，仔細記錄海妖般的海底音頻',
        costDescription: '承受 3 點理智牌庫侵蝕，獲得 28 枚古金幣',
        consequences: [
          {
            type: 'sanity_change',
            value: -3,
            narrative: '非人的旋律撕裂了理智防線，理智牌庫被侵蝕 3 點。',
          },
          {
            type: 'gain_obols',
            value: 28,
            narrative: '在音波共振的石壁裂隙中發現了被震落的 28 枚古金幣（+28 古金幣）。',
          },
        ],
      },
      {
        id: 'coral_snap_branch',
        text: '用力掰下散發微光的活體珊瑚分枝',
        costDescription: '獲得特殊真相卡【潮汐之音】',
        consequences: [
          {
            type: 'gain_card',
            card: CARD_EVENT_TIDE_WHISPER,
            narrative: '獲得特殊真相卡【潮汐之音】納入理智牌庫！',
          },
        ],
      },
      {
        id: 'coral_cover_ears',
        text: '捂住雙耳迅速遠離此地',
        costDescription: '承受 1 點肉體生命傷害',
        consequences: [
          {
            type: 'health_change',
            value: -1,
            narrative: '慌忙撤退時在濕滑岩面摔了一跤，受到 1 點擦傷。',
          },
        ],
      },
    ],
  },

  event_dagon_statue_crevice: {
    id: 'event_dagon_statue_crevice',
    title: '滴淌綠泥的大袞神龕',
    location: '玄武岩裂縫 · 海神暗壇',
    storyText: [
      '潮水拍打著一尊由黑色滑石雕琢的異形神像，神像兼具魚類、青蛙與人類的怪誕特徵，體表正滲出微溫的墨綠黏液。',
      '神像底座的放血石槽中殘留著深紅的血跡，周圍的空氣彷彿凝固著深淵巨獸的心跳回音。',
    ],
    options: [
      {
        id: 'dagon_blood_offering',
        text: '刺破手掌，向大袞神龕滴入鮮血',
        costDescription: '承受 5 點肉體生命傷害，獲得舊日遺物【大袞的黑印章】',
        consequences: [
          {
            type: 'health_change',
            value: -5,
            narrative: '鮮血滴落的瞬間被神像貪婪吸吮，承受 5 點肉體生命傷害。',
          },
          {
            type: 'gain_relic',
            relic: {
              id: 'relic_dagon_seal',
              name: '大袞的黑印章',
              description: '沾染深海黏液的玄武岩印章。每場戰鬥開始時獲得 1 層【堅韌】。',
              flavorText: '「深淵王廷的通行符節。」',
              rarity: 'rare',
              modifiers: {
                startingStatusEffects: [{ type: 'resilience', stacks: 1 }],
              },
            },
            narrative: '石槽暗格彈開，獲得舊日遺物【大袞的黑印章】！',
          },
        ],
      },
      {
        id: 'dagon_scrape_gold',
        text: '用短刀刮取神像眼眶鑲嵌的異星黃金',
        costDescription: '承受 2 點理智牌庫侵蝕，獲得 25 枚古金幣',
        consequences: [
          {
            type: 'sanity_change',
            value: -2,
            narrative: '異星金屬的冰冷詛咒刺激著視網膜，理智牌庫被侵蝕 2 點。',
          },
          {
            type: 'gain_obols',
            value: 25,
            narrative: '成功刮下沉甸甸的太古黃金碎屑（+25 古金幣）。',
          },
        ],
      },
      {
        id: 'dagon_desecrate',
        text: '揮動鐵器猛擊神像將其徹底砸碎',
        costDescription: '褻瀆神龕引來復仇長老，觸發突發遭遇戰',
        consequences: [
          {
            type: 'trigger_combat',
            enemy: INITIAL_DEEP_ONE,
            narrative: '石像碎裂的脆響震徹地穴！深處傳來暴怒的沙啞咆哮，深潛者長老破浪而出！',
          },
        ],
      },
    ],
  },

  /* =========================================================
     Depth 3 Events (無底深淵祭壇)
     ========================================================= */
  event_proto_matter_fountain: {
    id: 'event_proto_matter_fountain',
    title: '原生黑泥湧泉',
    location: '無底深淵 · 黑色玄武岩裂谷',
    storyText: [
      '在無底深淵邊緣的石台中央，一口巨大的黑色火山口正源源不絕湧出冒泡的黏稠黑泥。',
      '這些原生質黑泥有節律地蠕動著，彷彿具備獨立生命，表面不斷開闔出微型的眼球與細小的呼吸孔洞。',
    ],
    options: [
      {
        id: 'fountain_embrace',
        text: '伸手觸碰黑色噴泉，汲取原生質力量',
        costDescription: '承受 4 點理智牌庫侵蝕，獲得戰鬥卡牌【原形觸鬚】',
        consequences: [
          {
            type: 'sanity_change',
            value: -4,
            narrative: '太古生命的意志撕裂了你的大腦，理智牌庫被侵蝕 4 點。',
          },
          {
            type: 'gain_card',
            card: CARD_EVENT_PROTO_TENTACLE,
            narrative: '獲得高傷卡牌【原形觸鬚】納入理智牌庫！',
          },
        ],
      },
      {
        id: 'fountain_sip',
        text: '汲取黑泥表面清澈的活性液體塗抹傷口',
        costDescription: '承受 2 點理智牌庫侵蝕，恢復 10 點肉體生命值',
        consequences: [
          {
            type: 'sanity_change',
            value: -2,
            narrative: '微涼的液體滲入創口，神經在陣痛中顫慄，理智牌庫被侵蝕 2 點。',
          },
          {
            type: 'health_change',
            value: 10,
            narrative: '破損的肌肉組織以非自然的速度癒合，恢復了 10 點肉體生命值！',
          },
        ],
      },
      {
        id: 'fountain_burn',
        text: '點燃煤油打火機引爆湧泉表面瓦斯',
        costDescription: '承受 4 點肉體生命傷害，獲得 28 枚古金幣',
        consequences: [
          {
            type: 'health_change',
            value: -4,
            narrative: '洶湧的青藍冷火爆燃開來，衝擊波造成 4 點肉體生命傷害。',
          },
          {
            type: 'gain_obols',
            value: 28,
            narrative: '爆炸炸開了泉底的太古沉積，露出 28 枚古金幣（+28 古金幣）。',
          },
        ],
      },
    ],
  },

  event_astral_projection_mirror: {
    id: 'event_astral_projection_mirror',
    title: '高維星宿投影鏡',
    location: '非歐幾何迴廊 · 漂浮懸石',
    storyText: [
      '懸浮在失重裂谷上方的一面八角形黑曜石古鏡，鏡框由純粹的星際金屬鑄造而成。',
      '鏡面中倒映的不是深淵的岩層，而是遙遠宇宙深處旋轉的巨大暗星與不可名狀的星雲旋渦。',
    ],
    options: [
      {
        id: 'mirror_gaze',
        text: '凝視鏡中星圖，洞察高維空間結構',
        costDescription: '承受 3 點理智牌庫侵蝕，獲得舊日遺物【群星透鏡】',
        consequences: [
          {
            type: 'sanity_change',
            value: -3,
            narrative: '浩瀚星辰的維度壓迫幾乎壓垮理智，理智牌庫被侵蝕 3 點。',
          },
          {
            type: 'gain_relic',
            relic: {
              id: 'relic_stellar_lens',
              name: '群星透鏡',
              description: '折射高維冷光的黑曜石透鏡。手牌容量永久 +1。',
              flavorText: '「窺探群星運行的透鏡。」',
              rarity: 'rare',
              modifiers: { handCapacity: 1 },
            },
            narrative: '自鏡框上取下核心鏡片，獲得舊日遺物【群星透鏡】！',
          },
        ],
      },
      {
        id: 'mirror_cover',
        text: '用防風帆布將鏡面嚴密遮蓋',
        costDescription: '平息混亂心神，恢復 6 點肉體生命值',
        consequences: [
          {
            type: 'health_change',
            value: 6,
            narrative: '切斷異星視線的窺伺後，緊繃的肌肉得以鬆弛，恢復 6 點肉體生命值。',
          },
        ],
      },
      {
        id: 'mirror_shatter',
        text: '揮動鐵鎬猛擊鏡面掠取星辰黑曜石',
        costDescription: '獲得 32 枚古金幣，但引發修格斯僕從突襲戰鬥',
        consequences: [
          {
            type: 'gain_obols',
            value: 32,
            narrative: '鏡面粉碎，拾獲珍貴的星際隕石碎塊（+32 古金幣）。',
          },
          {
            type: 'trigger_combat',
            enemy: INITIAL_SHOGGOTH,
            narrative: '空間震盪驚醒了伏擊在深淵裂隙中的黑泥修格斯幼體！戰鬥爆發！',
          },
        ],
      },
    ],
  },

  event_elder_thing_specimen: {
    id: 'event_elder_thing_specimen',
    title: '古老者凍結殘軀',
    location: '太古先驅者遺址 · 冰封玄武岩拱門',
    storyText: [
      '一座半坍塌的先驅者巨石拱門下，冰封著一具保存完好的太古古老者遺體。',
      '那是一具擁有五角星形頭部與海星狀肉翼的幾何生物，身旁的金屬圓筒仍散發著恆定的微熱。',
    ],
    options: [
      {
        id: 'elder_dissect',
        text: '採集星形頭部的神經組織樣本',
        costDescription: '承受 2 點理智牌庫侵蝕，獲得特殊真相卡【太古幾何密卷】',
        consequences: [
          {
            type: 'sanity_change',
            value: -2,
            narrative: '解讀異星生物的大腦構造讓神經劇烈抽痛，理智牌庫被侵蝕 2 點。',
          },
          {
            type: 'gain_card',
            card: CARD_EVENT_ELDER_GEOMETRY,
            narrative: '獲得特殊真相卡【太古幾何密卷】納入理智牌庫！',
          },
        ],
      },
      {
        id: 'elder_salvage',
        text: '拆卸先驅者胸前的耐壓金屬容器',
        costDescription: '獲得 30 枚古金幣',
        consequences: [
          {
            type: 'gain_obols',
            value: 30,
            narrative: '自金屬容器中倒出 30 枚保存完好的古金幣（+30 古金幣）。',
          },
        ],
      },
      {
        id: 'elder_activate_heater',
        text: '啟動身旁遺留的微型地熱防護罩',
        costDescription: '恢復 8 點肉體生命值',
        consequences: [
          {
            type: 'health_change',
            value: 8,
            narrative: '地熱防護罩散發出柔和的暖流，驅散深淵寒氣，恢復 8 點肉體生命值。',
          },
        ],
      },
    ],
  },

  event_singing_void_chasm: {
    id: 'event_singing_void_chasm',
    title: '虛空長笛裂隙',
    location: '無底深淵 · 虛空斷崖',
    storyText: [
      '站在這座直通地心虛無的黑色斷崖前，深處不斷傳來毫無調性、怪誕混亂的長笛笛音。',
      '那是盲目痴愚之神的僕從在永恆吹奏的音頻，聽得越久，現實的邊界就越發顯得模糊虛妄。',
    ],
    options: [
      {
        id: 'chasm_shout',
        text: '向著虛空長嘯抗爭，鍛造理性心智防線',
        costDescription: '承受 3 點肉體生命傷害，向理智牌庫注入 2 張【心智防波堤】',
        consequences: [
          {
            type: 'health_change',
            value: -3,
            narrative: '聲浪對撞令耳膜震出血絲，承受 3 點肉體生命傷害。',
          },
          {
            type: 'gain_card',
            card: {
              ...TRUTH_CARD_BREAKWATER,
              id: 'event_card_breakwater_d3_1',
            },
            narrative: '不屈的意志凝練出真相卡【心智防波堤】！',
          },
        ],
      },
      {
        id: 'chasm_throw_coins',
        text: '向深淵拋擲 15 枚古金幣祈求迴響平息',
        costDescription: '消耗 15 枚古金幣，恢復 8 點肉體生命值',
        requires: { obols: 15 },
        consequences: [
          {
            type: 'gain_obols',
            value: -15,
            narrative: '古金幣沉入黑暗，刺耳的笛音短暫低伏，消耗 15 枚古金幣。',
          },
          {
            type: 'health_change',
            value: 8,
            narrative: '心跳恢復規律，緊張的精神得以平息，恢復 8 點肉體生命值。',
          },
        ],
      },
      {
        id: 'chasm_capture_relic',
        text: '自斷崖邊緣拾起震落的石質骨笛殘片',
        costDescription: '承受 4 點理智牌庫侵蝕，獲得舊日遺物【阿薩托斯碎笛】',
        consequences: [
          {
            type: 'sanity_change',
            value: -4,
            narrative: '接觸殘片的剎那，宇宙原初混沌在腦海炸裂，理智牌庫被侵蝕 4 點。',
          },
          {
            type: 'gain_relic',
            relic: {
              id: 'relic_azathoth_flute_fragment',
              name: '阿薩托斯碎笛',
              description: '盲目痴愚之神的骨笛殘片。每場戰鬥開始時獲得 1 層【力量】。',
              flavorText: '「無調的混亂長音在靈魂深處低鳴。」',
              rarity: 'mythic',
              modifiers: {
                startingStatusEffects: [{ type: 'might', stacks: 1 }],
              },
            },
            narrative: '獲得舊日遺物【阿薩托斯碎笛】！',
          },
        ],
      },
    ],
  },

  /* =========================================================
     Depth 4 Events (星辰正位 · 拉萊耶核心終局)
     ========================================================= */
  event_cyclopean_bas_relief: {
    id: 'event_cyclopean_bas_relief',
    title: '萬丈綠石浮雕門扉',
    location: '拉萊耶核心 · 浸水巨石穹頂',
    storyText: [
      '巨大的墨綠色巨石門扉高聳入雲，門上雕刻著巨大的章魚頭顱與生有雙翼的龍狀神靈。',
      '巨石表面流淌著古老的冷光，門縫中隱約傳來宇宙深處的心跳轟鳴。',
    ],
    options: [
      {
        id: 'relief_decipher',
        text: '解讀門扉象形文字，窺探神祇的意志',
        costDescription: '承受 5 點理智牌庫侵蝕，獲得卡牌【星之眷族印記】',
        consequences: [
          {
            type: 'sanity_change',
            value: -5,
            narrative: '太古的超維知識如怒潮席捲意識，理智牌庫被侵蝕 5 點。',
          },
          {
            type: 'gain_card',
            card: CARD_EVENT_STAR_SPAWN_SIGIL,
            narrative: '獲得強大卡牌【星之眷族印記】！',
          },
        ],
      },
      {
        id: 'relief_blood_sigil',
        text: '割破手腕，將鮮血注入巨石凹槽激活封印',
        costDescription: '承受 6 點肉體生命傷害，獲得舊日遺物【不可名狀之徽印】',
        consequences: [
          {
            type: 'health_change',
            value: -6,
            narrative: '綠石凹槽貪婪吸乾鮮血，承受 6 點肉體生命傷害。',
          },
          {
            type: 'gain_relic',
            relic: {
              id: 'relic_nameless_sigil',
              name: '不可名狀之徽印',
              description: '拉萊耶巨石之門的古老金屬徽印。最大生命值永久 +10。',
              flavorText: '「群星歸位之日，門扉自會洞開。」',
              rarity: 'mythic',
              modifiers: { maxHealth: 10 },
            },
            narrative: '凹槽內部旋開，獲得舊日遺物【不可名狀之徽印】！',
          },
        ],
      },
      {
        id: 'relief_rest',
        text: '背靠巨石低頭默禱，整理最後的呼吸',
        costDescription: '恢復 8 點肉體生命值',
        consequences: [
          {
            type: 'health_change',
            value: 8,
            narrative: '在風浪的間歇中平息喘息，恢復 8 點肉體生命值。',
          },
        ],
      },
    ],
  },

  event_gravity_anomaly_vault: {
    id: 'event_gravity_anomaly_vault',
    title: '重力倒錯的非歐殿堂',
    location: '拉萊耶天階 · 顛倒幾何殿堂',
    storyText: [
      '在這裡，重力方向隨每一步移動而詭異偏轉。天花板向下淌著黑水，而石柱向著虛無無限延伸。',
      '一座由純金與星際隕石鑄造的古老秘匣正懸浮在上下顛倒的力場死角中。',
    ],
    options: [
      {
        id: 'gravity_leap',
        text: '縱身躍入反重力裂縫奪取秘匣',
        costDescription: '承受 5 點肉體生命傷害，獲得 35 枚古金幣',
        consequences: [
          {
            type: 'health_change',
            value: -5,
            narrative: '重力逆轉將你重重摔向反向石壁，造成 5 點肉體生命傷害。',
          },
          {
            type: 'gain_obols',
            value: 35,
            narrative: '成功打開秘匣，收繳 35 枚古金幣（+35 古金幣）！',
          },
        ],
      },
      {
        id: 'gravity_navigate',
        text: '順應幾何空間曲率，掌握維度穿梭之法',
        costDescription: '承受 3 點理智牌庫侵蝕，獲得卡牌【維度漫步】',
        consequences: [
          {
            type: 'sanity_change',
            value: -3,
            narrative: '克服視覺上的嚴重眩暈感，理智牌庫被侵蝕 3 點。',
          },
          {
            type: 'gain_card',
            card: CARD_EVENT_DIMENSION_STRIDE,
            narrative: '領悟空間法則，獲得卡牌【維度漫步】納入理智牌庫！',
          },
        ],
      },
      {
        id: 'gravity_meditate',
        text: '在引力平衡節點靜坐冥想',
        costDescription: '身心獲得完全放鬆，恢復 10 點肉體生命值',
        consequences: [
          {
            type: 'health_change',
            value: 10,
            narrative: '在無重力狀態下肌肉完全鬆弛，恢復 10 點肉體生命值。',
          },
        ],
      },
    ],
  },

  event_cthulhu_dream_echo: {
    id: 'event_cthulhu_dream_echo',
    title: '沉睡之主的夢境迴音',
    location: '拉萊耶核心神殿外廊',
    storyText: [
      '整個空間瀰漫著潮濕的墨綠薄霧，耳邊傳來跨越億萬年的心靈廣播。',
      '那是沉睡於拉萊耶石城深處的舊日支配者在睡夢中無意識散發的夢境漣漪，凡人的心智在其面前猶如風中殘燭。',
    ],
    options: [
      {
        id: 'dream_embrace',
        text: '敞開心智直面神祇夢境，接納終極真理',
        costDescription: '承受 4 點理智牌庫侵蝕，向理智牌庫注入 3 張真相卡',
        consequences: [
          {
            type: 'sanity_change',
            value: -4,
            narrative: '無垠太古深海的景象衝擊著記憶，理智牌庫被侵蝕 4 點。',
          },
          {
            type: 'gain_card',
            card: {
              ...TRUTH_CARD_BREAKWATER,
              id: 'event_card_breakwater_d4_1',
            },
            narrative: '在夢境浪潮中築起心智防禦，注入真相卡【心智防波堤】！',
          },
        ],
      },
      {
        id: 'dream_sedative',
        text: '使用隨身強效鎮定劑壓制心靈震顫',
        costDescription: '消耗 10 枚古金幣，恢復 6 點肉體生命值',
        requires: { obols: 10 },
        consequences: [
          {
            type: 'gain_obols',
            value: -10,
            narrative: '注射鎮定劑，消耗了 10 枚古金幣的物資。',
          },
          {
            type: 'health_change',
            value: 6,
            narrative: '神經痛楚暫時消退，恢復 6 點肉體生命值。',
          },
        ],
      },
      {
        id: 'dream_fire',
        text: '向著虛空中的幻影扣動扳機',
        costDescription: '槍聲驚醒守護僕從，觸發遭遇戰',
        consequences: [
          {
            type: 'trigger_combat',
            enemy: INITIAL_STAR_SPAWN,
            narrative: '槍聲震動了巨石穹頂！克蘇魯星之眷族自暗影中展翅降臨！',
          },
        ],
      },
    ],
  },

  event_star_metal_altar: {
    id: 'event_star_metal_altar',
    title: '群星正位之殘光祭壇',
    location: '拉萊耶頂峰 · 群星交匯祭禮壇',
    storyText: [
      '站上拉萊耶的最高處，頭頂的星斗正運行至不可名狀的幾何排列。',
      '祭壇中央燃燒著不熄的幽藍冷火，整座石台散發著決定人類命運的超自然威壓。',
    ],
    options: [
      {
        id: 'altar_sac_all_gold',
        text: '將身上所有古金幣投入冷火奉獻',
        costDescription: '消耗 20 枚古金幣，恢復 12 點肉體生命值並獲得特殊真相卡【終焉覺悟】',
        requires: { obols: 20 },
        consequences: [
          {
            type: 'gain_obols',
            value: -20,
            narrative: '古金幣在冷火中化作燦爛星塵，消耗了 20 枚古金幣。',
          },
          {
            type: 'health_change',
            value: 12,
            narrative: '星光洗滌了肉體的疲憊與重創，大幅恢復 12 點肉體生命值！',
          },
          {
            type: 'gain_card',
            card: CARD_EVENT_FINAL_AWAKENING,
            narrative: '獲得終極真相卡【終焉覺悟】納入理智牌庫！',
          },
        ],
      },
      {
        id: 'altar_pouch_relic',
        text: '冒險撬下祭壇邊緣的發光隕石核心',
        costDescription: '承受 6 點肉體生命傷害，獲得舊日遺物【群星正位之石】',
        consequences: [
          {
            type: 'health_change',
            value: -6,
            narrative: '極低溫的星辰金屬凍傷了十指，承受 6 點肉體生命傷害。',
          },
          {
            type: 'gain_relic',
            relic: {
              id: 'relic_stellar_alignment_stone',
              name: '群星正位之石',
              description: '蘊含拉萊耶原核能量的發光隕石。每場戰鬥開始時獲得 6 點防禦護甲與 1 層【堅韌】。',
              flavorText: '「宇宙維度交匯的終極結晶。」',
              rarity: 'mythic',
              modifiers: {
                startingArmor: 6,
                startingStatusEffects: [{ type: 'resilience', stacks: 1 }],
              },
            },
            narrative: '獲得舊日遺物【群星正位之石】！',
          },
        ],
      },
      {
        id: 'altar_quiet_stand',
        text: '在冷光中安靜默立，平復呼吸',
        costDescription: '恢復 5 點肉體生命值',
        consequences: [
          {
            type: 'health_change',
            value: 5,
            narrative: '沐浴在冷光中沉澱心緒，恢復 5 點肉體生命值。',
          },
        ],
      },
    ],
  },
};

export const DEPTH_EVENT_POOLS: Record<DepthLevel, string[]> = {
  1: [
    'event_abandoned_carriage',
    'event_sunken_shrine',
    'event_whispering_bookseller',
    'event_asylum_ward',
  ],
  2: [
    'event_drowned_sailor_shrine',
    'event_tide_alchemical_lab',
    'event_singing_coral_grotto',
    'event_dagon_statue_crevice',
  ],
  3: [
    'event_proto_matter_fountain',
    'event_astral_projection_mirror',
    'event_elder_thing_specimen',
    'event_singing_void_chasm',
  ],
  4: [
    'event_cyclopean_bas_relief',
    'event_gravity_anomaly_vault',
    'event_cthulhu_dream_echo',
    'event_star_metal_altar',
  ],
};

export const DEFAULT_EVENT_KEYS = [
  'event_sunken_shrine',
  'event_whispering_bookseller',
  'event_asylum_ward',
  'event_abandoned_carriage',
];

/**
 * 依深度取得所有註冊的奇遇事件清單
 */
export function getMythosEventsForDepth(depth: DepthLevel): MythosEvent[] {
  const ids = DEPTH_EVENT_POOLS[depth] ?? DEPTH_EVENT_POOLS[1];
  return ids.map((id) => JSON.parse(JSON.stringify(MYTHOS_EVENTS[id])));
}

/**
 * 依深度與單局已造訪清單抽取奇遇劇本（單局防重複機制 · ADR-0032）
 */
export function getMythosEvent(
  depth: DepthLevel = 1,
  visitedEventIds: string[] = [],
  randomFn: () => number = Math.random
): MythosEvent {
  const poolIds = DEPTH_EVENT_POOLS[depth] ?? DEPTH_EVENT_POOLS[1];
  const unvisitedIds = poolIds.filter((id) => !visitedEventIds.includes(id));
  const candidateIds = unvisitedIds.length > 0 ? unvisitedIds : poolIds;
  const pickedId = candidateIds[Math.floor(randomFn() * candidateIds.length)];
  const evt = MYTHOS_EVENTS[pickedId] ?? MYTHOS_EVENTS.event_sunken_shrine;
  return JSON.parse(JSON.stringify(evt));
}

/**
 * 依據節點 ID 或深度取得奇遇劇本（相容舊介面）
 * @deprecated 請優先使用 `getMythosEvent(depth, visitedEventIds)` 進行基於深度與防重複抽樣之奇遇選取
 */
export function getMythosEventForNode(
  _nodeId: string,
  depth?: DepthLevel,
  visitedEventIds: string[] = [],
  randomFn: () => number = Math.random
): MythosEvent {
  const effectiveDepth: DepthLevel = depth ?? 1;
  return getMythosEvent(effectiveDepth, visitedEventIds, randomFn);
}

/* =========================================================
   Black Market Stock Generator (Re-exported from marketService)
   ========================================================= */

export {
  generateMarketItemsForDepth,
  generateDefaultMarketItems,
  MARKET_PURGE_COST,
  type GenerateMarketItemsOptions,
} from './marketService';

