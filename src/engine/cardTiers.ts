import type { Card, DepthLevel } from '../types/game';
import { fisherYatesShuffle } from './initialData';

/* =========================================================
   Tier 1 Cards (阿卡姆封鎖區 · 基礎與進階獎勵卡庫)
   ========================================================= */

export const TIER_1_CARDS: Card[] = [
  {
    id: 'reward_shotgun_1',
    name: '雙管獵槍',
    category: 'combat',
    costType: 'stamina',
    costValue: 2,
    isTemporary: false,
    tier: 1,
    effects: [{ type: 'damage', value: 14 }],
    description: '消耗 2 點精力，轟出密集的鉛彈，造成 14 點毀滅物理傷害。',
    flavorText: '「近距離的轟鳴撕裂了陰暗中的任何可怖實體。」',
  },
  {
    id: 'reward_quick_draw_1',
    name: '快速拔槍',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    effects: [{ type: 'damage', value: 7 }],
    description: '敏捷射擊，造成 7 點物理傷害。',
    flavorText: '「肌肉記憶超越了大腦對恐懼的本能遲疑。」',
  },
  {
    id: 'reward_tactical_roll_1',
    name: '戰術翻滾',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    effects: [
      { type: 'armor', value: 4 },
      { type: 'draw', value: 1 },
    ],
    description: '敏捷閃避獲得 4 點護甲，並立即自理智牌庫抽取 1 張卡牌。',
    flavorText: '「在碎石堆中翻滾尋找下一個反擊角度。」',
  },
  {
    id: 'reward_ancient_amulet_1',
    name: '遠古護身符',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    effects: [{ type: 'armor', value: 8 }],
    description: '激發符石古老力場，獲得 8 點累積護甲。',
    flavorText: '「青銅上的深綠包漿散發著阻絕污穢的冰涼氣息。」',
  },
  {
    id: 'reward_void_fire_1',
    name: '虛空烈焰',
    category: 'magic',
    costType: 'sanity',
    costValue: 2,
    isTemporary: false,
    tier: 1,
    effects: [{ type: 'damage', value: 18 }],
    description: '消耗 2 點理智（自牌庫頂棄牌），引燃不可熄滅的紫色冷焰，造成 18 點傷害。',
    flavorText: '「燃燒靈魂碎片釋放的星辰冷火。」',
  },
  {
    id: 'reward_dread_whisper_1',
    name: '恐懼低語',
    category: 'magic',
    costType: 'sanity',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    effects: [{ type: 'damage', value: 10 }],
    description: '消耗 1 點理智（自牌庫頂棄牌），將神經震顫轉為 10 點心靈傷害。',
    flavorText: '「在敵人腦海中回放拉萊耶的潮汐聲。」',
  },
  {
    id: 'reward_astral_insight_1',
    name: '星界洞察',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    effects: [
      { type: 'self_damage', value: 2 },
      { type: 'add_to_deck', value: 3 },
    ],
    description: '自身承受 2 點認知傷害，向理智牌庫注入 3 張真相卡牌，解除瘋狂狀態。',
    flavorText: '「意識升入無垠星穹，心智雖千瘡百孔，卻獲得浩瀚的安寧。」',
  },
  {
    id: 'reward_first_aid_1',
    name: '應急急救包',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 1,
    effects: [
      { type: 'armor', value: 3 },
      { type: 'restore_sanity', value: 2 },
    ],
    description: '獲得 3 點護甲，並將棄牌堆中 2 張卡牌洗回理智牌庫。',
    flavorText: '「酒精與繃帶能穩固搖搖欲墜的精神防線。」',
  },
];

/* =========================================================
   Tier 2 Cards (深潛者海蝕迷宮 · 進階強力獎勵卡庫)
   ========================================================= */

export const TIER_2_CARDS: Card[] = [
  {
    id: 'card_tier2_pump_shotgun',
    name: '泵動式散彈槍',
    category: 'combat',
    costType: 'stamina',
    costValue: 2,
    isTemporary: false,
    tier: 2,
    effects: [{ type: 'damage', value: 20 }],
    description: '消耗 2 點精力，壓動槍機連續射出重型鹿彈，造成 20 點猛烈物理傷害。',
    flavorText: '「潮濕海風無法阻止機械撞針的咆哮，轟鳴聲在海蝕洞穴深處激起陣陣回音。」',
  },
  {
    id: 'card_tier2_silver_blade',
    name: '破魔銀質短刃',
    category: 'combat',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 2,
    effects: [{ type: 'damage', value: 10 }],
    description: '消耗 1 點精力，迅捷刺入異怪弱點，造成 10 點精準物理傷害。',
    flavorText: '「刀刃浸過聖水與秘銀，對深潛者的黏滑厚皮有著致命的破甲奇效。」',
  },
  {
    id: 'card_tier2_iron_will',
    name: '鋼鐵意志屏障',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 2,
    effects: [{ type: 'armor', value: 12 }],
    description: '消耗 1 點精力，凝聚凡人意志抵禦深淵壓迫，獲得 12 點累積護甲。',
    flavorText: '「在深海異形的非人注視下，緊握雙拳，以鋼鐵般的理智封鎖恐懼。」',
  },
  {
    id: 'card_tier2_rapid_suture',
    name: '戰地快速縫合',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 2,
    effects: [
      { type: 'armor', value: 6 },
      { type: 'restore_sanity', value: 3 },
    ],
    description: '消耗 1 點精力，獲得 6 點護甲，並將棄牌堆中 3 張卡牌洗回理智牌庫。',
    flavorText: '「即便手指被寒風凍得發僵，依然熟練地穿針引線，穩住潰散的精神防線。」',
  },
  {
    id: 'card_tier2_frost_grasp',
    name: '深海冰霜之握',
    category: 'magic',
    costType: 'sanity',
    costValue: 2,
    isTemporary: false,
    tier: 2,
    effects: [{ type: 'damage', value: 25 }],
    description: '消耗 2 點理智（自牌庫頂棄牌），引動深淵極寒海水凝結，造成 25 點超自然傷害。',
    flavorText: '「冰冷徹骨的洋流自異次元裂隙倒灌，連空氣中的水氣都凝結成尖銳冰刺。」',
  },
  {
    id: 'card_tier2_mind_shock',
    name: '心靈震波',
    category: 'magic',
    costType: 'sanity',
    costValue: 1,
    isTemporary: false,
    tier: 2,
    effects: [
      { type: 'damage', value: 14 },
      { type: 'draw', value: 1 },
    ],
    description: '消耗 1 點理智（自牌庫頂棄牌），釋放衝擊波造成 14 點心靈傷害，並抽取 1 張卡牌。',
    flavorText: '「神經元在尖嘯中過載，將腦海中的混亂與回音直接烙印在敵人意識深處。」',
  },
  {
    id: 'card_tier2_forbidden_tablet',
    name: '禁忌海蝕石板殘卷',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 2,
    effects: [
      { type: 'self_damage', value: 2 },
      { type: 'add_to_deck', value: 4 },
    ],
    description: '自身承受 2 點認知傷害，向理智牌庫注入 4 張真相卡牌，解除瘋狂狀態。',
    flavorText: '「石板上的非歐幾何符文正向外滲出幽綠磷光，閱讀它需要承受難以言喻的痛楚。」',
  },
  {
    id: 'card_tier2_silver_key_glow',
    name: '銀鑰指引微光',
    category: 'truth',
    costType: 'free',
    costValue: 0,
    isTemporary: false,
    tier: 2,
    effects: [
      { type: 'draw', value: 1 },
      { type: 'add_to_deck', value: 2 },
    ],
    description: '免費打出，抽取 1 張卡牌並將 2 張真相卡牌洗入理智牌庫。',
    flavorText: '「銀色鑰匙在虛空中劃過優雅弧線，照亮通往宇宙秩序的隱密回廊。」',
  },
];

/* =========================================================
   Tier 3 Cards (無底深淵祭壇 · 大師級高階卡庫)
   ========================================================= */

export const TIER_3_CARDS: Card[] = [
  {
    id: 'card_tier3_dum_dum',
    name: '達姆高爆彈連射',
    category: 'combat',
    costType: 'stamina',
    costValue: 2,
    isTemporary: false,
    tier: 3,
    effects: [{ type: 'damage', value: 26 }],
    description: '消耗 2 點精力，打出特製達姆高爆子彈，造成 26 點毀滅性穿甲傷害。',
    flavorText: '「開花彈在接觸肉體的瞬間引爆，即便是舊日支配者的僕從亦難以承受此等破壞力。」',
  },
  {
    id: 'card_tier3_demolition_pack',
    name: '軍用特種炸藥包',
    category: 'combat',
    costType: 'stamina',
    costValue: 3,
    isTemporary: false,
    tier: 3,
    effects: [{ type: 'damage', value: 36 }],
    description: '消耗 3 點精力，點燃雷管引爆整包烈性炸藥，造成 36 點震撼天地的物理重創。',
    flavorText: '「凡人科技的極致破壞力，在太古黑石祭壇上炸出耀眼的硝煙火海。」',
  },
  {
    id: 'card_tier3_impenetrable_bastion',
    name: '不可侵犯之壁',
    category: 'skill',
    costType: 'stamina',
    costValue: 2,
    isTemporary: false,
    tier: 3,
    effects: [{ type: 'armor', value: 22 }],
    description: '消耗 2 點精力，築起固若金湯的防線，獲得 22 點超重型累積護甲。',
    flavorText: '「無懼非人泰克利利哀鳴，調查員築起凡人血肉所能構築的最堅固壁壘。」',
  },
  {
    id: 'card_tier3_sanity_anchor',
    name: '極限精神錨定',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 3,
    effects: [
      { type: 'armor', value: 8 },
      { type: 'restore_sanity', value: 5 },
    ],
    description: '消耗 1 點精力，獲得 8 點護甲，並將棄牌堆中 5 張卡牌洗回理智牌庫。',
    flavorText: '「以古代舊印銘文將狂暴渙散的心靈死死固定在理性之錨上。」',
  },
  {
    id: 'card_tier3_void_collapse',
    name: '虛空黑洞坍縮',
    category: 'magic',
    costType: 'sanity',
    costValue: 2,
    isTemporary: false,
    tier: 3,
    effects: [{ type: 'damage', value: 34 }],
    description: '消耗 2 點理智（自牌庫頂棄牌），在敵人體內撕開引力黑洞，造成 34 點極限魔法傷害。',
    flavorText: '「空間維度在此處發生不可逆轉的扭曲，一切物質皆向著虛無的奇點崩陷。」',
  },
  {
    id: 'card_tier3_psionic_cleave',
    name: '深淵靈能撕裂',
    category: 'magic',
    costType: 'sanity',
    costValue: 1,
    isTemporary: false,
    tier: 3,
    effects: [{ type: 'damage', value: 20 }],
    description: '消耗 1 點理智（自牌庫頂棄牌），將狂暴意志化作利刃，造成 20 點高額超自然傷害。',
    flavorText: '「靈能風暴猶如實質利刃，自神經深處劈開敵人的保護甲殼。」',
  },
  {
    id: 'card_tier3_rlyeh_codex',
    name: '拉萊耶原典啟示',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 3,
    effects: [{ type: 'add_to_deck', value: 6 }],
    description: '消耗 1 點精力，解讀太古原典，向理智牌庫大量注入 6 張真相卡牌。',
    flavorText: '「沉睡千億年的深海真言在眼前展開，浩瀚的星辰秩序驅散了深淵狂亂。」',
  },
  {
    id: 'card_tier3_star_resonance',
    name: '超維星辰共鳴',
    category: 'truth',
    costType: 'free',
    costValue: 0,
    isTemporary: false,
    tier: 3,
    effects: [
      { type: 'armor', value: 10 },
      { type: 'add_to_deck', value: 3 },
    ],
    description: '免費打出，獲得 10 點護甲，並將 3 張真相卡牌洗入理智牌庫。',
    flavorText: '「群星在遙遠天穹正位共振，為調查員的心智披上一層不可穿透的星光紗幕。」',
  },
];

/* =========================================================
   Tier 4+ Exclusive Cards (第二深度首領專屬掉落 · 4 選 1 全遊戲唯一產出)
   ========================================================= */

export const TIER_4_EXCLUSIVE_CARDS: Card[] = [
  {
    id: 'card_tier4_god_slayer',
    name: '屠神裁決爆轟',
    category: 'combat',
    costType: 'stamina',
    costValue: 2,
    isTemporary: false,
    tier: 4,
    effects: [{ type: 'damage', value: 34 }],
    description: '消耗 2 點精力，引爆融合舊印秘金的高爆彈藥，造成 34 點超越凡人極限的弒神傷害。',
    flavorText: '「凡人的工藝與禁忌秘銀在此刻昇華，這一擊的威力足以讓舊日支配者的血脈為之顫慄。」',
  },
  {
    id: 'card_tier4_elder_aegis',
    name: '舊神庇護之陣',
    category: 'skill',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 4,
    effects: [
      { type: 'armor', value: 24 },
      { type: 'draw', value: 2 },
    ],
    description: '消耗 1 點精力，展開古老舊神的防護力場，獲得 24 點強大護甲，並立即抽取 2 張卡牌。',
    flavorText: '「五芒星光在周身環繞，不可名狀的混沌污穢在光芒前如同初雪般消融。」',
  },
  {
    id: 'card_tier4_void_annihilation',
    name: '超維虛空湮滅',
    category: 'magic',
    costType: 'sanity',
    costValue: 2,
    isTemporary: false,
    tier: 4,
    effects: [{ type: 'damage', value: 42 }],
    description: '消耗 2 點理智（自牌庫頂棄牌），引爆超維度虛空裂隙，造成 42 點毀天滅地的超自然湮滅打擊。',
    flavorText: '「宇宙黑洞深處的奇異點在眼前剎那綻放，將目光所及的一切狂暴異質徹底撕裂。」',
  },
  {
    id: 'card_tier4_astral_revelation',
    name: '源初星辰啟示',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    tier: 4,
    effects: [
      { type: 'add_to_deck', value: 8 },
      { type: 'armor', value: 12 },
    ],
    description: '消耗 1 點精力，向理智牌庫注入 8 張真相卡牌，並獲得 12 點護甲，完全解除瘋狂狀態。',
    flavorText: '「當意識凌駕於群星之上，深淵的詛咒與瘋狂皆化為無垠宇宙中的一粒微塵。」',
  },
];

export const ALL_TIERED_CARDS: Card[] = [
  ...TIER_1_CARDS,
  ...TIER_2_CARDS,
  ...TIER_3_CARDS,
  ...TIER_4_EXCLUSIVE_CARDS,
];

/**
 * 依據當前深度與首領戰勝狀態生成戰後卡牌三選一/四選一獎勵
 * - 第一深度首領：越階抽取 Tier 3+ 高階卡牌（3 選 1）
 * - 第二深度首領：限定產出專屬第四階強力卡牌（Tier 4+ Exclusive，4 選 1）
 * - 常態戰鬥：依深度分別產出 Tier 1 (Depth 1)、Tier 2 (Depth 2)、Tier 3 (Depth >= 3)
 */
export function generateRewardCardsForDepth(
  depth: DepthLevel = 1,
  isBoss: boolean = false,
  count?: number,
  randomFn: () => number = Math.random
): Card[] {
  if (isBoss) {
    if (depth === 2) {
      // 第二深度首領：專屬第四階強力卡牌（Tier 4+ Exclusive，完整 4 選 1）
      return TIER_4_EXCLUSIVE_CARDS.map((c) => ({ ...c }));
    }
    if (depth === 1) {
      // 第一深度首領：越階抽取 Tier 3 高階強力卡牌（3 選 1，Tier 4+ 專屬卡限定第二深度首領獨佔）
      const pool = TIER_3_CARDS;
      const targetCount = count ?? 3;
      const shuffled = fisherYatesShuffle(pool, randomFn);
      return shuffled.slice(0, Math.min(targetCount, shuffled.length)).map((c) => ({ ...c }));
    }
    // 第三深度以上首領 fallback
    return TIER_4_EXCLUSIVE_CARDS.map((c) => ({ ...c }));
  }

  // 常規與精英戰鬥獎勵池演進
  let pool: Card[];
  switch (depth) {
    case 2:
      pool = TIER_2_CARDS;
      break;
    case 3:
    case 4:
      pool = TIER_3_CARDS;
      break;
    case 1:
    default:
      pool = TIER_1_CARDS;
      break;
  }

  const targetCount = count ?? 3;
  const shuffled = fisherYatesShuffle(pool, randomFn);
  return shuffled.slice(0, Math.min(targetCount, shuffled.length)).map((c) => ({ ...c }));
}
