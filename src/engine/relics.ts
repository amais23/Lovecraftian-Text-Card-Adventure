import type { Investigator, Relic, RelicModifier, StatusEffect } from '../types/game';
import { createStatusEffect, addStatusEffect } from './statusEffects';

export const ELDER_SIGN_AMULET: Relic = {
  id: 'elder_sign_amulet',
  name: '古神之印護符',
  description: '古老純銀鍛造之避邪護符。每場戰鬥開始時獲得 5 點初始防禦護甲。',
  flavorText: '以不知名星辰金屬鍛鑄的微型古印，觸手冰涼，能將不可名狀之物的初步物理撲擊悄然抵禦在外。',
  rarity: 'common',
  icon: 'Shield',
  modifiers: {
    startingArmor: 5,
  },
};

export const POCKET_WATCH: Relic = {
  id: 'pocket_watch',
  name: '黃銅懷錶',
  description: '指針倒轉的詭譎懷錶。手牌容量永久 +1（每回合抽牌量與保留上限同步提升 1 張）。',
  flavorText: '這枚懷錶的秒針每隔數秒便會逆時針震顫。在心智緊繃的生死邊緣，它賦予調查員多看透一瞬局勢的從容。',
  rarity: 'rare',
  icon: 'Watch',
  modifiers: {
    handCapacity: 1,
  },
};

export const VITALITY_ELIXIR: Relic = {
  id: 'vitality_elixir',
  name: '活力秘藥',
  description: '散發刺鼻草藥氣息的密斯卡托尼克特製補劑。最大生命值永久 +5，獲得時立即恢復 5 點肉體生命。',
  flavorText: '阿米蒂奇教授在醫學院地窖私下調配的強心劑，混入了某種深海藻類沉澱，能使垂死之軀煥發異常生機。',
  rarity: 'common',
  icon: 'Heart',
  modifiers: {
    maxHealth: 5,
  },
};

export const OBSIDIAN_MIRROR: Relic = {
  id: 'obsidian_mirror',
  name: '黑曜石古鏡',
  description: '映照虛空裂隙的深黑鏡片。每場戰鬥開始時獲得 2 層【堅韌】印記。',
  flavorText: '鏡中映出的並非調查員的面容，而是被灰霧籠罩的堅固石壁，為你的神經鑄上一層堅不可摧的鋼鐵屏障。',
  rarity: 'rare',
  icon: 'Disc',
  modifiers: {
    startingStatusEffects: [{ type: 'resilience', stacks: 2 }],
  },
};

export const DREAD_TALISMAN: Relic = {
  id: 'dread_talisman',
  name: '舊日凶符',
  description: '蝕刻著太古符文的骨質雕像。每場戰鬥開始時獲得 1 層【力量】印記。',
  flavorText: '觸碰此符時，一股源自深淵原核的暴戾狂熱湧入指尖，讓你的每一次打擊都帶有撕裂靈肉的恐怖破壞力。',
  rarity: 'rare',
  icon: 'Skull',
  modifiers: {
    startingStatusEffects: [{ type: 'might', stacks: 1 }],
  },
};

export const ELDRITCH_LANTERN: Relic = {
  id: 'eldritch_lantern',
  name: '異界提燈',
  description: '燃燒幽綠磷火的防風提燈。每場戰鬥開始時獲得 1 點額外行動精力。',
  flavorText: '無須任何燈油亦能永續燃燒的冷光提燈，在踏入未知黑暗的瞬間驅散刺骨寒意，令你行動先發制人。',
  rarity: 'mythic',
  icon: 'Flame',
  modifiers: {
    startingStamina: 1,
  },
};

export const PRESET_RELICS: Relic[] = [
  ELDER_SIGN_AMULET,
  POCKET_WATCH,
  VITALITY_ELIXIR,
  OBSIDIAN_MIRROR,
  DREAD_TALISMAN,
  ELDRITCH_LANTERN,
];

/**
 * 依據 ID 查找預置舊日遺物
 */
export function getRelicById(id: string): Relic | undefined {
  return PRESET_RELICS.find((r) => r.id === id);
}

/**
 * 累加計算複數遺物的所有靜態屬性修飾器
 */
export function calculateRelicModifiers(relics?: Relic[]): Required<Omit<RelicModifier, 'startingStatusEffects'>> {
  const result: Required<Omit<RelicModifier, 'startingStatusEffects'>> = {
    maxHealth: 0,
    handCapacity: 0,
    startingArmor: 0,
    startingStamina: 0,
  };

  if (!relics || relics.length === 0) return result;

  for (const relic of relics) {
    if (relic.modifiers) {
      if (relic.modifiers.maxHealth) result.maxHealth += relic.modifiers.maxHealth;
      if (relic.modifiers.handCapacity) result.handCapacity += relic.modifiers.handCapacity;
      if (relic.modifiers.startingArmor) result.startingArmor += relic.modifiers.startingArmor;
      if (relic.modifiers.startingStamina) result.startingStamina += relic.modifiers.startingStamina;
    }
  }

  return result;
}

/**
 * 當調查員獲得遺物時，立即將遺物加入行囊並生效其被動屬性（如 maxHealth, handCapacity）
 */
export function applyRelicToInvestigator(investigator: Investigator, relic: Relic): Investigator {
  const currentRelics = investigator.relics ? [...investigator.relics] : [];
  const newRelics = [...currentRelics, relic];

  let maxHealth = investigator.maxHealth;
  let health = investigator.health;
  let handCapacity = investigator.handCapacity ?? 2;

  if (relic.modifiers?.maxHealth) {
    maxHealth += relic.modifiers.maxHealth;
    health += relic.modifiers.maxHealth;
  }

  if (relic.modifiers?.handCapacity) {
    handCapacity += relic.modifiers.handCapacity;
  }

  return {
    ...investigator,
    maxHealth,
    health,
    handCapacity,
    relics: newRelics,
  };
}

export interface RelicCombatBonus {
  startingArmor: number;
  startingStaminaBonus: number;
  startingStatusEffects: StatusEffect[];
}

/**
 * 計算戰鬥開始時遺物提供的動態起始數值與印記
 */
export function getRelicCombatBonus(relics?: Relic[]): RelicCombatBonus {
  const mods = calculateRelicModifiers(relics);
  let startingStatusEffects: StatusEffect[] = [];

  if (relics) {
    for (const relic of relics) {
      if (relic.modifiers?.startingStatusEffects) {
        for (const eff of relic.modifiers.startingStatusEffects) {
          startingStatusEffects = addStatusEffect(
            startingStatusEffects,
            createStatusEffect(eff.type, eff.stacks)
          );
        }
      }
    }
  }

  return {
    startingArmor: mods.startingArmor,
    startingStaminaBonus: mods.startingStamina,
    startingStatusEffects,
  };
}

export interface RelicCombatStartResult {
  armor: number;
  stamina: number;
  statusEffects: StatusEffect[];
  logs: string[];
}

/**
 * 戰鬥開始或重整時，統整計算遺物賦予的起始屬性、狀態印記與對應戰鬥手記
 */
export function applyRelicCombatStart(
  investigator: {
    armor?: number;
    stamina?: number;
    maxStamina?: number;
    statusEffects?: StatusEffect[];
    relics?: Relic[];
  },
  baseStamina?: number
): RelicCombatStartResult {
  const relicBonus = getRelicCombatBonus(investigator.relics);
  const startingArmor = (investigator.armor ?? 0) + relicBonus.startingArmor;
  const currentStamina = baseStamina ?? investigator.stamina ?? investigator.maxStamina ?? 3;
  const startingStamina = currentStamina + relicBonus.startingStaminaBonus;
  const startingStatusEffects =
    investigator.statusEffects && investigator.statusEffects.length > 0
      ? [...investigator.statusEffects]
      : [...relicBonus.startingStatusEffects];

  const logs: string[] = [];
  if (relicBonus.startingArmor > 0) {
    logs.push(`【舊日遺物護佑】遺物使你獲得了 ${relicBonus.startingArmor} 點起始防禦護甲！`);
  }
  if (relicBonus.startingStatusEffects.length > 0) {
    const names = relicBonus.startingStatusEffects
      .map((e) => `【${e.name}】${e.stacks}層`)
      .join('、');
    logs.push(`【舊日遺物共鳴】遺物為你賦予了 ${names} 印記！`);
  }

  return {
    armor: startingArmor,
    stamina: startingStamina,
    statusEffects: startingStatusEffects,
    logs,
  };
}
