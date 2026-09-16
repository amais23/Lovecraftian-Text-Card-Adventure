import type {
  Card,
  Enemy,
  EnemyIntent,
  EnemyTrait,
  EnemyTraitId,
  Investigator,
  StatusEffect,
} from '../types/game';
import { createWhispersOfShatteredStarsCard } from './cards/special/madness';
import { calculateAttackDamage, createStatusEffect, addStatusEffect } from './statusEffects';

/**
 * 原著特質登錄定義 (ADR-0026)
 */
export const ELDRITCH_TRAIT_DEFINITIONS: Record<EnemyTraitId, EnemyTrait> = {
  zealous_blood_oath: {
    id: 'zealous_blood_oath',
    name: '狂熱血契',
    description: '受到肉體傷害時狂熱加劇，每累計受到 6 點傷害獲得 1 層【力量】；生命低於 40% 時發動【盲目血祭】。',
    icon: 'Flame',
  },
  carrion_feeder: {
    id: 'carrion_feeder',
    name: '食腐本能',
    description: '爪擊命中帶有【流血】的調查員時，恢復造成傷害 50% 的生命值；投擲墓穴腐泥減少調查員抽牌。',
    icon: 'Skull',
  },
  faceless_terror: {
    id: 'faceless_terror',
    name: '無貌深淵',
    description: '理智侵蝕無視物理護甲直擊心靈；侵蝕成功後觸發陰影滑翔獲得 6 點護甲。',
    icon: 'EyeOff',
  },
  ossuary_summoning: {
    id: 'ossuary_summoning',
    name: '白骨聚生',
    description: '每 3 回合自地底喚起 10 點白骨護甲；若骨甲被完全擊破，引發屍氣爆裂使調查員獲得 1 層【易傷】。',
    icon: 'Bone',
  },
  slippery_mucus: {
    id: 'slippery_mucus',
    name: '滑膩黏液',
    description: '滑膩鱗片偏轉微小打擊，單次受到小於等於 4 點的物理傷害完全無效化。',
    icon: 'Waves',
  },
  waterlogged_grip: {
    id: 'waterlogged_grip',
    name: '水下寒骨',
    description: '散發刺骨冰冷，使調查員每回合開始時獲得 1 層【恐慌】；溺水窒息可抽乾調查員精力。',
    icon: 'Droplet',
  },
  tide_of_dagon: {
    id: 'tide_of_dagon',
    name: '大袞潮汐',
    description: '奇數回合【潮漲】獲得 14 點潮汐護甲；偶數回合【潮退】將殘存護甲轉為等量海嘯傷害反噬調查員。',
    icon: 'Compass',
  },
  amorphous_body: {
    id: 'amorphous_body',
    name: '非歐流體',
    description: '完全免疫【流血】與【易傷】狀態；受到物理攻擊時反彈 2 點接觸傷害。',
    icon: 'CircleDot',
  },
  organ_proliferation: {
    id: 'organ_proliferation',
    name: '器官增生',
    description: '體表隨機增生巨目、重爪或厚皮；每 4 回合蓄力【Tekeli-li 碾壓】，蓄力期間承受傷害 +50%。',
    icon: 'Activity',
  },
  divine_immortality: {
    id: 'divine_immortality',
    name: '神性不滅',
    description: '不可名狀之神性，生命值無法降至 1 以下，每 2 回合以瘋狂卡污染牌庫；唯有深淵古印方能封滅。',
    icon: 'Sun',
  },
};

export function hasTrait(enemy: { traits?: EnemyTrait[] } | undefined, traitId: EnemyTraitId): boolean {
  return Boolean(enemy?.traits?.some((t) => t.id === traitId));
}

export interface EnemyDamageInterceptResult {
  modifiedDamage: number;
  reflectedDamageToInvestigator: number;
  newEnemyStatusEffects: StatusEffect[];
  statusToInvestigator?: StatusEffect;
  accumulatedDamageTaken: number;
  logs: string[];
}

/**
 * 當敵怪受到卡牌物理傷害時的特質攔截結算
 */
export function interceptEnemyDamage(
  enemy: {
    name: string;
    armor: number;
    statusEffects?: StatusEffect[];
    traits?: EnemyTrait[];
    shoggothStance?: string;
    accumulatedDamageTaken?: number;
  },
  rawDamage: number,
  isPiercing: boolean = false
): EnemyDamageInterceptResult {
  const logs: string[] = [];
  let modifiedDamage = rawDamage;
  let reflectedDamageToInvestigator = 0;
  let newEnemyStatusEffects = enemy.statusEffects ? [...enemy.statusEffects] : [];
  let accumulatedDamageTaken = enemy.accumulatedDamageTaken ?? 0;
  let statusToInvestigator: StatusEffect | undefined;

  // 1. 滑膩黏液 (slippery_mucus)：單次傷害 <= 4 點完全無效化
  if (hasTrait(enemy, 'slippery_mucus') && modifiedDamage <= 4) {
    logs.push(`【滑膩黏液】${enemy.name} 滑膩帶鱗的皮膚偏轉了輕微打擊，${modifiedDamage} 點傷害被完全無效化！`);
    return {
      modifiedDamage: 0,
      reflectedDamageToInvestigator: 0,
      newEnemyStatusEffects,
      accumulatedDamageTaken,
      logs,
    };
  }

  // 2. 非歐流體 (amorphous_body)：受到物理攻擊反彈 2 點接觸傷害
  if (hasTrait(enemy, 'amorphous_body') && modifiedDamage > 0) {
    reflectedDamageToInvestigator += 2;
    logs.push(`【非歐流體】攻擊觸及黏液原生質，分裂的酸蝕黏液反彈造成調查員 2 點接觸傷害！`);
  }

  // 3. 修格斯 Tekeli-li 蓄力虛弱態：承受傷害 +50%
  if (enemy.shoggothStance === 'charging' && modifiedDamage > 0) {
    const bonus = Math.max(1, Math.floor(modifiedDamage * 0.5));
    modifiedDamage += bonus;
    logs.push(`【蓄力破綻】${enemy.name} 正處於 Tekeli-li 蓄力虛弱狀態，承受傷害增加 ${bonus} 點！`);
  }

  // 4. 狂熱血契 (zealous_blood_oath)：累計傷害計算 (計算穿透護甲後的實傷)
  if (hasTrait(enemy, 'zealous_blood_oath') && modifiedDamage > 0) {
    const effectiveHpDmg = isPiercing ? modifiedDamage : Math.max(0, modifiedDamage - enemy.armor);
    if (effectiveHpDmg > 0) {
      accumulatedDamageTaken += effectiveHpDmg;
      const mightGained = Math.floor(accumulatedDamageTaken / 6);
      if (mightGained > 0) {
        accumulatedDamageTaken %= 6;
        newEnemyStatusEffects = addStatusEffect(
          newEnemyStatusEffects,
          createStatusEffect('might', mightGained)
        );
        logs.push(`【狂熱血契】鮮血刺激了 ${enemy.name} 的狂熱信仰，獲得 ${mightGained} 層【力量】！`);
      }
    }
  }

  // 5. 白骨聚生 (ossuary_summoning)：若骨甲被完全打破則引發屍氣爆裂使調查員獲得 1 層【易傷】
  if (hasTrait(enemy, 'ossuary_summoning') && enemy.armor > 0 && modifiedDamage >= enemy.armor) {
    statusToInvestigator = createStatusEffect('vulnerable', 1);
    logs.push(
      `【屍氣爆裂】${enemy.name} 披覆的堅固白骨護甲被完全擊碎，四濺的骸骨釋放屍氣瘴毒，調查員獲得 1 層【易傷】！`
    );
  }

  return {
    modifiedDamage,
    reflectedDamageToInvestigator,
    newEnemyStatusEffects,
    statusToInvestigator,
    accumulatedDamageTaken,
    logs,
  };
}

export interface TurnStartTraitResult {
  investigatorStatusEffects: StatusEffect[];
  reducedDrawCount: number;
  drainedStaminaCount: number;
  logs: string[];
}

/**
 * 回合開始時的原著特質結算（作用於調查員）
 */
export function resolveTurnStartTraits(
  enemy: Enemy,
  investigator: Investigator,
  overrideReducedDraw?: number,
  overrideDrainedStamina?: number
): TurnStartTraitResult {
  const logs: string[] = [];
  let investigatorStatusEffects = investigator.statusEffects ? [...investigator.statusEffects] : [];
  let reducedDrawCount = overrideReducedDraw ?? investigator.reducedDrawNextTurn ?? 0;
  let drainedStaminaCount = overrideDrainedStamina ?? investigator.drainedStaminaNextTurn ?? 0;

  // 水下寒骨 (waterlogged_grip)：每回合開始調查員獲得 1 層恐慌
  if (hasTrait(enemy, 'waterlogged_grip')) {
    investigatorStatusEffects = addStatusEffect(
      investigatorStatusEffects,
      createStatusEffect('horror', 1)
    );
    logs.push(`【水下寒骨】刺骨的深海寒意滲透心靈，調查員獲得 1 層【恐慌】印記！`);
  }

  // 結算腐泥抽牌減少
  if (reducedDrawCount > 0) {
    logs.push(`【墓穴腐泥蒙眼】腐泥遮蔽了視線，本回合抽牌數減少 ${reducedDrawCount} 張！`);
  }

  // 結算溺水精力減少
  if (drainedStaminaCount > 0) {
    logs.push(`【溺水窒息】窒息感剝奪了行動力，本回合精力減少 ${drainedStaminaCount} 點！`);
  }

  return {
    investigatorStatusEffects,
    reducedDrawCount,
    drainedStaminaCount,
    logs,
  };
}

export interface EnemyActResult {
  damageToInvestigator: number;
  healToEnemy: number;
  armorGainToEnemy: number;
  armorLossToEnemy?: number;
  erodeToInvestigator: number;
  statusToInvestigator?: StatusEffect;
  nextTurnReducedDraw?: number;
  nextTurnDrainedStamina?: number;
  selfDamageToEnemy?: number;
  madnessCardsToDeck?: Card[];
  logs: string[];
}

/**
 * 敵怪執行意圖行動時的原著特質效果結算
 */
export function resolveEnemyAction(
  enemy: Enemy,
  intent: EnemyIntent,
  investigator: Investigator,
  turn: number
): EnemyActResult {
  const logs: string[] = [];
  let damageToInvestigator = 0;
  let healToEnemy = 0;
  let armorGainToEnemy = 0;
  let armorLossToEnemy = 0;
  let erodeToInvestigator = 0;
  let statusToInvestigator: StatusEffect | undefined;
  let nextTurnReducedDraw: number | undefined;
  let nextTurnDrainedStamina: number | undefined;
  let selfDamageToEnemy: number | undefined;
  let madnessCardsToDeck: Card[] | undefined;

  // 1. 防拖延深淵狂暴 (Turn >= 6 傷害提升 50%)
  const isEnraged = turn >= 6;
  const enrageMultiplier = isEnraged ? 1.5 : 1.0;
  if (isEnraged && intent.type === 'attack') {
    logs.push(`【深淵狂暴】戰鬥已持續至第 ${turn} 回合，不可名狀之深淵徹底狂暴，敵怪攻擊傷害提升 50%！`);
  }

  // 2. 結算意圖基礎值
  if (intent.type === 'attack') {
    const rawVal = Math.floor(intent.value * enrageMultiplier);
    damageToInvestigator = calculateAttackDamage(
      rawVal,
      enemy.statusEffects ?? [],
      investigator.statusEffects ?? []
    );

    // 食腐本能 (carrion_feeder)：命中帶有流血的調查員吸血 50%
    const hasBleed = (investigator.statusEffects ?? []).some((s) => s.type === 'bleed' && s.stacks > 0);
    if (hasTrait(enemy, 'carrion_feeder') && hasBleed && damageToInvestigator > 0) {
      healToEnemy = Math.max(1, Math.floor(damageToInvestigator * 0.5));
      logs.push(`【食腐本能】${enemy.name} 啃噬了撕裂的鮮血傷口，恢復了 ${healToEnemy} 點生命值！`);
    }
  } else if (intent.type === 'defend') {
    armorGainToEnemy = intent.value;
  } else if (intent.type === 'erode') {
    erodeToInvestigator = intent.value;
    // 無貌深淵 (faceless_terror)：侵蝕成功後觸發陰影滑翔獲得 6 護甲
    if (hasTrait(enemy, 'faceless_terror')) {
      armorGainToEnemy += 6;
      logs.push(`【陰影滑翔】${enemy.name} 撕裂心智後沒入陰影滑翔，自身構築獲得 6 點迴避護甲！`);
    }
  } else if (intent.type === 'apply_status' && intent.statusType) {
    statusToInvestigator = createStatusEffect(intent.statusType, intent.value);
  }

  // 3. 特殊情境意圖附加屬性
  if (intent.reduceDraw) {
    nextTurnReducedDraw = intent.reduceDraw;
  }
  if (intent.drainStamina) {
    nextTurnDrainedStamina = intent.drainStamina;
  }
  if (intent.selfDamage) {
    selfDamageToEnemy = intent.selfDamage;
    logs.push(`【盲目血祭】${enemy.name} 狂熱自殘，割裂軀體承受 ${intent.selfDamage} 點反噬傷害！`);
  }

  // 4. 大袞潮汐 (tide_of_dagon)
  // 奇數回合潮漲獲得 14 潮汐護甲；偶數回合潮退將剩餘潮汐護甲轉為海嘯衝擊傷害並清空護甲
  if (hasTrait(enemy, 'tide_of_dagon')) {
    if (turn % 2 === 1) {
      // 潮漲 (High Tide)
      armorGainToEnemy += 14;
      logs.push(`【大袞潮汐·潮漲】潮水狂湧，${enemy.name} 凝聚了 14 點深海潮汐護甲！`);
    } else {
      // 潮退 (Ebb Tide)
      const remainingTidalArmor = enemy.armor;
      if (remainingTidalArmor > 0) {
        damageToInvestigator += remainingTidalArmor;
        armorLossToEnemy = remainingTidalArmor;
        logs.push(
          `【大袞潮汐·海嘯】潮水退去！${enemy.name} 將殘留的 ${remainingTidalArmor} 點潮汐護甲全額轉化為狂暴的【海嘯衝擊】，直撲調查員！`
        );
      }
    }
  }

  // 5. 白骨聚生 (ossuary_summoning)
  // 每 3 回合自地底召喚死人顱骨，披上 10 點堅固骨甲
  if (hasTrait(enemy, 'ossuary_summoning') && turn % 3 === 1) {
    armorGainToEnemy += 10;
    logs.push(`【白骨聚生】${enemy.name} 念動褻瀆咒文，自地底死土中喚起死人顱骨，披上 10 點堅固骨甲！`);
  }

  // 6. 神性不滅 (divine_immortality)
  // 每 2 回合將 1 張【星辰碎裂之囈語】瘋狂卡洗入調查員的理智牌庫
  if (hasTrait(enemy, 'divine_immortality') && turn % 2 === 0) {
    const whispersCard = createWhispersOfShatteredStarsCard(turn);
    madnessCardsToDeck = [whispersCard];
    logs.push(
      `【神性不滅】不可名狀的星辰囈語侵蝕虛空，一張【星辰碎裂之囈語】瘋狂卡被強行洗入你的理智牌庫！`
    );
  }

  return {
    damageToInvestigator,
    healToEnemy,
    armorGainToEnemy,
    armorLossToEnemy,
    erodeToInvestigator,
    statusToInvestigator,
    nextTurnReducedDraw,
    nextTurnDrainedStamina,
    selfDamageToEnemy,
    madnessCardsToDeck,
    logs,
  };
}

/**
 * 依據原著生態與血量狀態計算下一回合動態意圖
 */
export function advanceCanonicalIntent(
  enemy: Enemy,
  nextTurn: number
): { nextIntent: EnemyIntent; nextIntentIndex: number; newShoggothStance?: Enemy['shoggothStance'] } {
  // 1. 阿卡姆異教徒：HP < 40% 切換至【盲目血祭】
  if (hasTrait(enemy, 'zealous_blood_oath')) {
    const hpRatio = enemy.health / enemy.maxHealth;
    if (hpRatio <= 0.4) {
      return {
        nextIntent: {
          type: 'apply_status',
          statusType: 'bleed',
          value: 3,
          selfDamage: 4,
          name: '盲目血祭',
          description: '異教徒陷入瘋狂自殘，扣減自身 4 HP，向你施加 3 層【流血】！',
        },
        nextIntentIndex: 99,
      };
    }
  }

  // 2. 修格斯：器官增生與 Tekeli-li 碾壓
  if (hasTrait(enemy, 'organ_proliferation')) {
    // 每 4 回合第 3 回合蓄力，第 4 回合碾壓
    const cycle = nextTurn % 4;
    if (cycle === 3) {
      return {
        nextIntent: {
          type: 'charge',
          value: 0,
          isCharge: true,
          name: 'Tekeli-li 蓄力碾壓',
          description: '修格斯巨大身軀向上隆起聚攏，正在蓄力泰山壓頂！此時防禦虛弱（受傷害 +50%）！',
        },
        nextIntentIndex: 3,
        newShoggothStance: 'charging',
      };
    } else if (cycle === 0) {
      return {
        nextIntent: {
          type: 'attack',
          value: 20,
          name: 'Tekeli-li 毀滅重壓',
          description: '太古原生質黑泥帶著刺耳呼嘯轟然砸下，預告造成 20 點毀滅傷害！',
        },
        nextIntentIndex: 0,
        newShoggothStance: 'normal',
      };
    } else if (cycle === 1) {
      // 巨目精神侵蝕
      return {
        nextIntent: {
          type: 'erode',
          value: 3,
          name: '深淵巨目凝視',
          description: '黑泥體表睜開數十隻血紅巨目，預告侵蝕 3 點理智牌庫！',
        },
        nextIntentIndex: 1,
        newShoggothStance: 'eyes',
      };
    } else {
      // cycle === 2: 交替出現重爪多段撕咬 (claws) 或太古厚皮硬化 (hide)
      const isHideTurn = Math.floor(nextTurn / 4) % 2 === 1;
      if (isHideTurn) {
        return {
          nextIntent: {
            type: 'defend',
            value: 14,
            name: '太古厚皮硬化',
            description: '原生質黑泥急劇角質硬化，預告獲得 14 點厚皮護甲！',
          },
          nextIntentIndex: 4,
          newShoggothStance: 'hide',
        };
      } else {
        return {
          nextIntent: {
            type: 'attack',
            value: 12,
            name: '原生質重爪撕裂',
            description: '異化出數根重爪猛烈撕咬，預告造成 12 點傷害！',
          },
          nextIntentIndex: 2,
          newShoggothStance: 'claws',
        };
      }
    }
  }

  // 3. 常規循環意圖
  if (enemy.intentSequence && enemy.intentSequence.length > 0) {
    const nextIntentIndex = ((enemy.currentIntentIndex ?? 0) + 1) % enemy.intentSequence.length;
    return {
      nextIntent: enemy.intentSequence[nextIntentIndex],
      nextIntentIndex,
    };
  }

  return {
    nextIntent: enemy.currentIntent,
    nextIntentIndex: 0,
  };
}
