import type {
  Card,
  CardCategory,
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
  swarm_evasion: {
    id: 'swarm_evasion',
    name: '鼠群竄動',
    description: '無數尖牙鼠群在夾壁中四散躲避，受到物理攻擊時減免 2 點傷害（最低承受 1 點傷害）；但受到魔法卡牌攻擊時承受額外 3 點震波傷害。',
    icon: 'Rat',
  },
  blood_fanaticism: {
    id: 'blood_fanaticism',
    name: '狂信之血',
    description: '開局自帶狂信意志；生命值低於 50% 時攻擊附帶精神侵蝕，每次攻擊額外侵蝕 1 點理智牌庫。',
    icon: 'Flame',
  },
  septic_carapace: {
    id: 'septic_carapace',
    name: '腐殖外皮',
    description: '體表覆蓋著厚重死土與腐殖黏液，受物理肉搏攻擊時濺射腐毒，使調查員獲得 1 層【易傷】。',
    icon: 'Bug',
  },
  siren_lure: {
    id: 'siren_lure',
    name: '惑心溺音',
    description: '哀傷魅惑的深海歌聲縈繞心神，每回合開始時使調查員獲得 1 層【恐慌】；受擊時發出音波反彈 1 點傷害。',
    icon: 'Music',
  },
  amphibious_vigor: {
    id: 'amphibious_vigor',
    name: '兩棲畸變',
    description: '濕滑的畸形魚鱗能偏轉微小打擊，單次受到小於等於 4 點的物理傷害完全無效化。',
    icon: 'Waves',
  },
  razor_shell: {
    id: 'razor_shell',
    name: '銳刃甲殼',
    description: '密集的寄生藤壺甲殼如刀刃般生長，受到物理肉搏攻擊時反彈 2 點割裂傷害。',
    icon: 'Shield',
  },
  surgical_bio_shock: {
    id: 'surgical_bio_shock',
    name: '真菌外科術',
    description: '米·戈的星際解剖與電漿科技，意圖攻擊時可抽乾調查員精力並麻痺神經。',
    icon: 'Zap',
  },
  dimensional_phase: {
    id: 'dimensional_phase',
    name: '維度相位',
    description: '身形向四維空間折疊，每 3 回合相位隱匿獲得 12 點相位護甲。',
    icon: 'CircleDot',
  },
  discordant_dirge: {
    id: 'discordant_dirge',
    name: '無調輓歌',
    description: '吹奏超越凡人理智的無調骨笛，每回合開始時使調查員獲得 1 層【恐慌】。',
    icon: 'Radio',
  },
  oneiric_dread: {
    id: 'oneiric_dread',
    name: '萬古夢魘',
    description: '沉睡之神的夢境殘片，受到攻擊時爆發心靈震盪，使調查員獲得 1 層【恐慌】。',
    icon: 'Moon',
  },
  geometric_paradox: {
    id: 'geometric_paradox',
    name: '幾何悖論',
    description: '非歐幾何結構偏轉極端重擊，受到單次大於 15 點傷害時偏轉 50% 傷害，且受物理肉搏攻擊反彈 2 點傷害。',
    icon: 'Hexagon',
  },
  prophecy_of_ruin: {
    id: 'prophecy_of_ruin',
    name: '滅世預言',
    description: '詠唱群星歸位之末日讖言，每 3 回合施展滅世預警，向調查員施加 2 層【易傷】與 2 層【恐慌】。',
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
  isPiercing: boolean = false,
  cardCategory?: CardCategory
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

  // 2. 非歐流體 (amorphous_body)：受到物理肉搏攻擊反彈 2 點接觸傷害（僅限 combat 卡牌，不包含 magic 秘術）
  const isPhysicalContact = !cardCategory || cardCategory === 'combat';
  if (hasTrait(enemy, 'amorphous_body') && modifiedDamage > 0 && isPhysicalContact) {
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

  // 6. 兩棲畸變 (amphibious_vigor)：單次傷害 <= 4 點完全無效化
  if (hasTrait(enemy, 'amphibious_vigor') && modifiedDamage <= 4) {
    logs.push(`【兩棲畸變】${enemy.name} 堅韌濕滑的畸形死皮偏轉了微小攻擊，${modifiedDamage} 點傷害被完全無效化！`);
    return {
      modifiedDamage: 0,
      reflectedDamageToInvestigator: 0,
      newEnemyStatusEffects,
      accumulatedDamageTaken,
      logs,
    };
  }

  // 7. 鼠群竄動 (swarm_evasion)：物理減免 2 點（保底受 1 點傷害），魔法承受額外 3 點傷害
  if (hasTrait(enemy, 'swarm_evasion') && modifiedDamage > 0) {
    if (cardCategory === 'magic') {
      modifiedDamage += 3;
      logs.push(`【鼠群散逸】狂暴的秘術魔法震散了變異鼠群，承受額外 3 點震波傷害！`);
    } else {
      const reduced = Math.min(2, Math.max(0, modifiedDamage - 1));
      if (reduced > 0) {
        modifiedDamage -= reduced;
        logs.push(`【鼠群竄動】鼠群在夾壁中四散躲避，減免了 ${reduced} 點物理傷害！`);
      }
    }
  }

  // 8. 惑心溺音 (siren_lure)：受創時發出刺耳尖嘯反彈 1 點傷害
  if (hasTrait(enemy, 'siren_lure') && modifiedDamage > 0) {
    reflectedDamageToInvestigator += 1;
    logs.push(`【惑心溺音】${enemy.name} 在受創時發出刺耳尖嘯，反彈 1 點音波傷害！`);
  }

  // 9. 銳刃甲殼 (razor_shell)：受物理肉搏攻擊反彈 2 點割裂傷害
  if (hasTrait(enemy, 'razor_shell') && modifiedDamage > 0 && isPhysicalContact) {
    reflectedDamageToInvestigator += 2;
    logs.push(`【銳刃甲殼】鋒利的寄生藤壺如刀刃般劃破肢體，反彈 2 點割裂傷害！`);
  }

  // 10. 腐殖外皮 (septic_carapace)：受物理肉搏攻擊濺射腐毒施加 1 層易傷
  if (hasTrait(enemy, 'septic_carapace') && modifiedDamage > 0 && isPhysicalContact) {
    statusToInvestigator = createStatusEffect('vulnerable', 1);
    logs.push(`【腐殖外皮】${enemy.name} 體表飛濺的腐液沾染了調查員，調查員獲得 1 層【易傷】！`);
  }

  // 11. 萬古夢魘 (oneiric_dread)：受創引發心靈震盪施加 1 層恐慌
  if (hasTrait(enemy, 'oneiric_dread') && modifiedDamage > 0) {
    statusToInvestigator = createStatusEffect('horror', 1);
    logs.push(`【萬古夢魘】${enemy.name} 受創引發不可名狀的心靈震盪，調查員獲得 1 層【恐慌】！`);
  }

  // 12. 幾何悖論 (geometric_paradox)：偏轉單次 >15 點高傷 50%，受物理攻擊反彈 2 點傷害
  if (hasTrait(enemy, 'geometric_paradox') && modifiedDamage > 15) {
    const absorbed = Math.floor(modifiedDamage * 0.5);
    modifiedDamage -= absorbed;
    logs.push(`【幾何悖論】非歐幾何結構偏轉了重擊，減免 ${absorbed} 點傷害！`);
  }
  if (hasTrait(enemy, 'geometric_paradox') && modifiedDamage > 0 && isPhysicalContact) {
    reflectedDamageToInvestigator += 2;
    logs.push(`【幾何悖論】接觸非歐幾何巨石產生維度震盪，反彈 2 點傷害！`);
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
  let reducedDrawCount = overrideReducedDraw ?? 0;
  let drainedStaminaCount = overrideDrainedStamina ?? 0;

  // 水下寒骨 (waterlogged_grip)：每回合開始調查員獲得 1 層恐慌
  if (hasTrait(enemy, 'waterlogged_grip')) {
    investigatorStatusEffects = addStatusEffect(
      investigatorStatusEffects,
      createStatusEffect('horror', 1)
    );
    logs.push(`【水下寒骨】刺骨的深海寒意滲透心靈，調查員獲得 1 層【恐慌】印記！`);
  }

  // 無調輓歌 (discordant_dirge)：每回合開始調查員獲得 1 層恐慌
  if (hasTrait(enemy, 'discordant_dirge')) {
    investigatorStatusEffects = addStatusEffect(
      investigatorStatusEffects,
      createStatusEffect('horror', 1)
    );
    logs.push(`【無調輓歌】無名吹笛者奏出混沌刺耳的長鳴，調查員獲得 1 層【恐慌】印記！`);
  }

  // 惑心溺音 (siren_lure)：每回合開始調查員獲得 1 層恐慌
  if (hasTrait(enemy, 'siren_lure')) {
    investigatorStatusEffects = addStatusEffect(
      investigatorStatusEffects,
      createStatusEffect('horror', 1)
    );
    logs.push(`【惑心溺音】哀傷魅惑的歌聲縈繞心神，調查員獲得 1 層【恐慌】印記！`);
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
  hitCount?: number;
  singleHitDamage?: number;
  healToEnemy: number;
  armorGainToEnemy: number;
  armorLossToEnemy?: number;
  erodeToInvestigator: number;
  statusToInvestigator?: StatusEffect;
  statusesToInvestigator?: StatusEffect[];
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
  let hitCount = intent.hitCount ?? 1;
  let singleHitDamage: number | undefined;
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
    const singleHitFinal = calculateAttackDamage(
      rawVal,
      enemy.statusEffects ?? [],
      investigator.statusEffects ?? []
    );
    damageToInvestigator = singleHitFinal * hitCount;
    if (hitCount > 1) {
      singleHitDamage = singleHitFinal;
    }

    // 食腐本能 (carrion_feeder)：命中帶有流血的調查員吸血 50%
    const hasBleed = (investigator.statusEffects ?? []).some((s) => s.type === 'bleed' && s.stacks > 0);
    if (hasTrait(enemy, 'carrion_feeder') && hasBleed && damageToInvestigator > 0) {
      healToEnemy = Math.max(1, Math.floor(damageToInvestigator * 0.5));
      logs.push(`【食腐本能】${enemy.name} 啃噬了撕裂的鮮血傷口，恢復了 ${healToEnemy} 點生命值！`);
    }

    // 狂信之血 (blood_fanaticism)：生命值 <= 50% 時攻擊附帶精神侵蝕，額外侵蝕 1 點理智牌庫
    if (hasTrait(enemy, 'blood_fanaticism')) {
      const hpRatio = enemy.health / enemy.maxHealth;
      if (hpRatio <= 0.5) {
        erodeToInvestigator += 1;
        logs.push(`【狂信之血】${enemy.name} 陷入瀕死癲狂，攻擊附帶精神侵蝕，額外侵蝕 1 點理智牌庫！`);
      }
    }
  } else if (intent.type === 'defend') {
    armorGainToEnemy = intent.value;
  } else if (intent.type === 'heal') {
    healToEnemy = intent.value;
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

  const statusesToInvestigator: StatusEffect[] = [];
  if (statusToInvestigator) {
    statusesToInvestigator.push(statusToInvestigator);
  }
  if (intent.additionalStatuses && intent.additionalStatuses.length > 0) {
    statusesToInvestigator.push(...intent.additionalStatuses);
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

  // 真菌外科術 (surgical_bio_shock)
  // 米·戈的星際解剖與電漿科技，意圖攻擊時可抽乾調查員精力並麻痺神經
  if (
    hasTrait(enemy, 'surgical_bio_shock') &&
    (intent.drainStamina || (intent.type === 'attack' && intent.name?.includes('電弧')))
  ) {
    const drain = intent.drainStamina ?? 1;
    nextTurnDrainedStamina = Math.max(nextTurnDrainedStamina ?? 0, drain);
    statusesToInvestigator.push(createStatusEffect('horror', 1));
    logs.push(
      `【真菌外科術】${enemy.name} 導引星際電漿外科解剖，抽乾 ${drain} 點精力並麻痺神經施加 1 層【恐慌】！`
    );
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

  // 7. 維度相位 (dimensional_phase)
  // 每 3 回合身形向四維空間折疊，獲得 12 點相位護甲
  if (hasTrait(enemy, 'dimensional_phase') && turn % 3 === 0) {
    armorGainToEnemy += 12;
    logs.push(`【維度相位】${enemy.name} 身形向四維空間折疊，獲得 12 點相位護甲！`);
  }

  // 8. 滅世預言 (prophecy_of_ruin)
  // 每 3 回合詠唱群星正位之讖言，向調查員施加 2 層【易傷】與 2 層【恐慌】
  if (hasTrait(enemy, 'prophecy_of_ruin') && turn % 3 === 0) {
    statusesToInvestigator.push(
      createStatusEffect('vulnerable', 2),
      createStatusEffect('horror', 2)
    );
    logs.push(`【滅世預言】${enemy.name} 詠唱群星正位之讖言，向調查員施加 2 層【易傷】與 2 層【恐慌】！`);
  }

  return {
    damageToInvestigator,
    hitCount: hitCount > 1 ? hitCount : undefined,
    singleHitDamage,
    healToEnemy,
    armorGainToEnemy,
    armorLossToEnemy,
    erodeToInvestigator,
    statusToInvestigator,
    statusesToInvestigator: statusesToInvestigator.length > 0 ? statusesToInvestigator : undefined,
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
          additionalStatuses: [createStatusEffect('vulnerable', 2)],
          selfDamage: 4,
          name: '盲目血祭',
          description: '異教徒陷入瘋狂自殘，扣減自身 4 點生命值，向你施加 3 層【流血】與 2 層【易傷】！',
        },
        nextIntentIndex: 99,
      };
    }
  }

  // 2. 修格斯：器官增生與 Tekeli-li 碾壓
  if (hasTrait(enemy, 'organ_proliferation')) {
    // 第一深度首領：修格斯幼體 (Shoggoth Progeny) 專屬 4 回合再生與動態碾壓循環
    if (enemy.id === 'enemy_shoggoth_progeny') {
      const cycle = nextTurn % 4;
      if (cycle === 1) {
        return {
          nextIntent: {
            type: 'attack',
            value: 10,
            name: '原生質癲狂鞭笞',
            description: '巨大黑泥肉塊抽打出數十條黏液觸手，預告造成 10 點傷害。',
          },
          nextIntentIndex: 0,
          newShoggothStance: 'normal',
        };
      } else if (cycle === 2) {
        return {
          nextIntent: {
            type: 'heal',
            value: 7,
            name: '原生質細胞再生',
            description: '黑泥肉塊翻滾劇烈聚合，預告恢復 7 點生命值！',
          },
          nextIntentIndex: 1,
          newShoggothStance: 'hide',
        };
      } else if (cycle === 3) {
        return {
          nextIntent: {
            type: 'erode',
            value: 3,
            name: '不可名狀之眼',
            description: '身上浮現無數閃爍綠光的眼球，預告侵蝕 3 點理智牌庫！',
          },
          nextIntentIndex: 2,
          newShoggothStance: 'eyes',
        };
      } else {
        // cycle === 0 (Turn 4, Turn 8...): 造成 1/4 BOSS 剩餘生命值的傷害
        const quarterDmg = Math.max(1, Math.round(enemy.health / 4));
        return {
          nextIntent: {
            type: 'attack',
            value: quarterDmg,
            name: '泰克利利碾壓',
            description: `伴隨尖銳的笛音鳴叫泰克利利！龐大黑泥泰山壓頂，造成 1/4 剩餘生命值 (${quarterDmg}點) 傷害！`,
          },
          nextIntentIndex: 3,
          newShoggothStance: 'normal',
        };
      }
    }

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
            value: 3,
            hitCount: 4,
            name: '原生質重爪撕裂',
            description: '異化出數根重爪發動 4 次狂暴撕咬，每次造成 3 點傷害（共 12 點）！',
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
