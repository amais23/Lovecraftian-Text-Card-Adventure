import type { Card, DepthLevel } from '../types/game';
import { fisherYatesShuffle } from './initialData';

import { INVESTIGATOR_REWARD_CARDS } from './cards/investigator/rewards';
import { OCCULTIST_REWARD_CARDS } from './cards/occultist/rewards';
import { NEUTRAL_CARDS } from './cards/neutral/common';

const ALL_POOL: Card[] = [
  ...INVESTIGATOR_REWARD_CARDS,
  ...OCCULTIST_REWARD_CARDS,
  ...NEUTRAL_CARDS,
];
const cardMap = new Map<string, Card>(ALL_POOL.map((c) => [c.id, c]));

function getCardsByIds(ids: string[]): Card[] {
  return ids.map((id) => {
    const card = cardMap.get(id);
    if (!card) throw new Error(`Card ${id} not found in rewards pool`);
    return card;
  });
}

export const TIER_1_CARDS: Card[] = getCardsByIds([
  'reward_shotgun_1',
  'reward_quick_draw_1',
  'reward_tactical_roll_1',
  'reward_ancient_amulet_1',
  'reward_void_fire_1',
  'reward_dread_whisper_1',
  'reward_astral_insight_1',
  'reward_first_aid_1',
]);

export const TIER_2_CARDS: Card[] = getCardsByIds([
  'card_tier2_pump_shotgun',
  'card_tier2_silver_blade',
  'card_tier2_iron_will',
  'card_tier2_rapid_suture',
  'card_tier2_frost_grasp',
  'card_tier2_mind_shock',
  'card_tier2_forbidden_tablet',
  'card_tier2_silver_key_glow',
]);

export const TIER_3_CARDS: Card[] = getCardsByIds([
  'card_tier3_dum_dum',
  'card_tier3_demolition_pack',
  'card_tier3_impenetrable_bastion',
  'card_tier3_sanity_anchor',
  'card_tier3_void_collapse',
  'card_tier3_psionic_cleave',
  'card_tier3_rlyeh_codex',
  'card_tier3_star_resonance',
]);

export const TIER_4_EXCLUSIVE_CARDS: Card[] = getCardsByIds([
  'card_tier4_god_slayer',
  'card_tier4_elder_aegis',
  'card_tier4_void_annihilation',
  'card_tier4_astral_revelation',
]);

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
