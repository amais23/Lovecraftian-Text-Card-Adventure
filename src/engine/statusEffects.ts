import type { Card, StatusEffect, StatusEffectType } from '../types/game';

export interface StatusMetadata {
  name: string;
  description: string;
  icon: string;
}

export const STATUS_EFFECT_METADATA: Record<StatusEffectType, StatusMetadata> = {
  might: {
    name: '力量',
    description: '每層使造成的攻擊傷害增加 1 點。回合結束時衰減 1 層。',
    icon: 'Swords',
  },
  resilience: {
    name: '堅韌',
    description: '每層使獲得的防禦護甲增加 1 點。回合結束時衰減 1 層。',
    icon: 'Shield',
  },
  vulnerable: {
    name: '易傷',
    description: '每層使受到的物理攻擊傷害增加 1 點。回合結束時衰減 1 層。',
    icon: 'AlertCircle',
  },
  bleed: {
    name: '流血',
    description: '回合結束時承受等同於層數的肉體傷害（無視護甲）。回合結束時衰減 1 層。',
    icon: 'Droplets',
  },
  horror: {
    name: '恐慌',
    description: '回合結束時自理智牌庫頂侵蝕等同於層數的卡牌。回合結束時衰減 1 層。',
    icon: 'Ghost',
  },
  weak: {
    name: '破勢',
    description: '每層使造成的攻擊傷害降低 50%。回合結束時衰減 1 層。',
    icon: 'ShieldAlert',
  },
};

export const DEBUFF_TYPES: StatusEffectType[] = ['vulnerable', 'bleed', 'horror', 'weak'];

/**
 * 淨化負面印記（所有負面印記各扣減指定層數）
 */
export function cleanseDebuffs(
  effects: StatusEffect[] = [],
  stacksPerDebuff: number = 1
): { cleansedEffects: StatusEffect[]; removedDebuffs: string[] } {
  const removedDebuffs: string[] = [];
  const cleansedEffects: StatusEffect[] = [];

  for (const eff of effects) {
    if (DEBUFF_TYPES.includes(eff.type)) {
      const remaining = eff.stacks - stacksPerDebuff;
      removedDebuffs.push(`【${eff.name}】-${Math.min(eff.stacks, stacksPerDebuff)}層`);
      if (remaining > 0) {
        cleansedEffects.push({ ...eff, stacks: remaining });
      }
    } else {
      cleansedEffects.push({ ...eff });
    }
  }

  return { cleansedEffects, removedDebuffs };
}

/**
 * 建立指定類型與層數的狀態印記
 */
export function createStatusEffect(type: StatusEffectType, stacks: number): StatusEffect {
  const meta = STATUS_EFFECT_METADATA[type];
  return {
    type,
    name: meta.name,
    stacks: Math.max(0, stacks),
    description: meta.description,
  };
}

/**
 * 將狀態印記附加至清單中（若已有同類型印記則疊加層數）
 */
export function addStatusEffect(
  effects: StatusEffect[] = [],
  newEffect: StatusEffect
): StatusEffect[] {
  if (newEffect.stacks <= 0) return [...effects];

  const existingIndex = effects.findIndex((e) => e.type === newEffect.type);
  if (existingIndex >= 0) {
    return effects.map((e, idx) =>
      idx === existingIndex
        ? { ...e, stacks: e.stacks + newEffect.stacks }
        : e
    );
  }

  return [...effects, { ...newEffect }];
}

/**
 * 取得指定狀態印記的當前層數
 */
export function getStatusStacks(
  effects: StatusEffect[] = [],
  type: StatusEffectType
): number {
  const found = effects.find((e) => e.type === type);
  return found ? found.stacks : 0;
}

/**
 * 每回合結束時將所有狀態印記層數衰減 1 層，層數歸零者予以移除
 */
export function decayStatusEffects(effects: StatusEffect[] = []): StatusEffect[] {
  return effects
    .map((e) => ({ ...e, stacks: e.stacks - 1 }))
    .filter((e) => e.stacks > 0);
}

/**
 * 計入攻擊方【力量】/【破勢】與防禦方【易傷】後之實際攻擊傷害純函式
 */
export function calculateAttackDamage(
  baseDamage: number,
  attackerEffects: StatusEffect[] = [],
  defenderEffects: StatusEffect[] = []
): number {
  if (baseDamage <= 0) return 0;

  const mightStacks = getStatusStacks(attackerEffects, 'might');
  let damage = baseDamage + mightStacks;

  // 破勢 (Weak)：造成的攻擊傷害降低 50%
  const weakStacks = getStatusStacks(attackerEffects, 'weak');
  if (weakStacks > 0 && damage > 0) {
    damage = Math.floor(damage * 0.5);
  }

  // 易傷 (Vulnerable)：每層受到的物理攻擊傷害 +1
  const vulnerableStacks = getStatusStacks(defenderEffects, 'vulnerable');
  if (vulnerableStacks > 0 && damage > 0) {
    damage += vulnerableStacks;
  }

  return Math.max(0, damage);
}

/**
 * 計入獲得方【堅韌】後之實際護甲值純函式
 */
export function calculateArmorGain(
  baseArmor: number,
  recipientEffects: StatusEffect[] = []
): number {
  if (baseArmor <= 0) return 0;

  const resilienceStacks = getStatusStacks(recipientEffects, 'resilience');
  return Math.max(0, baseArmor + resilienceStacks);
}

export interface ResolveStatusTurnEndResult {
  newHealth: number;
  newSanityDeck: Card[];
  newDiscardPile: Card[];
  erodedCards: Card[];
  decayedEffects: StatusEffect[];
  logs: string[];
}

/**
 * 回合結束結算目標狀態印記（流血生命扣減、恐慌理智侵蝕）並執行全體印記衰減
 */
export function resolveTurnEndStatusEffects(
  target: { health: number; sanityDeck?: Card[]; discardPile?: Card[] },
  effects: StatusEffect[] = [],
  targetName: string = '調查員'
): ResolveStatusTurnEndResult {
  const logs: string[] = [];
  let newHealth = target.health;
  let newSanityDeck = target.sanityDeck ? [...target.sanityDeck] : [];
  let newDiscardPile = target.discardPile ? [...target.discardPile] : [];
  const erodedCards: Card[] = [];

  // 1. 結算流血 (Bleed)
  const bleedStacks = getStatusStacks(effects, 'bleed');
  if (bleedStacks > 0) {
    newHealth = Math.max(0, newHealth - bleedStacks);
    logs.push(
      `【流血發作】${targetName} 的撕裂傷口噴湧出鮮血，承受 ${bleedStacks} 點生命傷害！`
    );
  }

  // 2. 結算恐慌 (Horror)
  const horrorStacks = getStatusStacks(effects, 'horror');
  if (horrorStacks > 0 && newSanityDeck.length > 0) {
    const erodeCount = Math.min(newSanityDeck.length, horrorStacks);
    const eroded = newSanityDeck.slice(0, erodeCount);
    newSanityDeck = newSanityDeck.slice(erodeCount);
    newDiscardPile.push(...eroded);
    erodedCards.push(...eroded);
    logs.push(
      `【恐慌侵蝕】精神恐慌襲來，${targetName} 的心智劇烈動搖，自理智牌庫頂侵蝕了 ${erodeCount} 張卡牌！`
    );
  }

  // 3. 衰減所有狀態印記
  const decayedEffects = decayStatusEffects(effects);

  return {
    newHealth,
    newSanityDeck,
    newDiscardPile,
    erodedCards,
    decayedEffects,
    logs,
  };
}
