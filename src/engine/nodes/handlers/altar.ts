import {
  DEFAULT_ALTAR_RITUALS,
  type AdventureStats,
  type AltarRitual,
  type AltarRitualId,
  type Card,
} from '../../../types/game';
import { TRUTH_CARD_BREAKWATER } from '../../eventData';
import { applyRelicToInvestigator, PRESET_RELICS } from '../../relics';
import type { NodeActionResult, NodeInteractionContext } from '../types';

export const ALTAR_RITUAL_POOL: readonly AltarRitual[] = [
  ...DEFAULT_ALTAR_RITUALS,
  {
    id: 'chaos',
    name: '混沌之契 · 混沌換金之誓',
    subtitle: '混沌換金',
    description:
      '向無序翻騰的原初混沌傾吐禱詞，以肉體創痛與部分理智記憶為祭品，換取深淵沉澱的古老財富。承受 4 點傷害並隨機除役 1 張卡牌，換取 50 枚古金幣。',
    costDescription: '承受 4 點傷害並隨機除役 1 張卡牌（牌庫須大於 1 張）',
    rewardDescription: '獲得 50 枚古金幣',
    iconName: 'coins',
  },
  {
    id: 'blood_pact',
    name: '血契之誓 · 禁忌真理之約',
    subtitle: '禁忌古契',
    description:
      '以極致深重的心頭精血締結古神盟約，將理智防禦推向極限。承受 8 點生命值傷害，將真相卡【心智防波堤】永久納入理智牌庫，並獲贈 25 枚古金幣。',
    costDescription: '承受 8 點傷害（生命須大於 8）',
    rewardDescription: '獲得真相卡【心智防波堤】與 25 枚古金幣',
    iconName: 'flame',
  },
];

export const ALTAR_RITUALS_BY_ID: Record<AltarRitualId, AltarRitual> = {
  flesh: ALTAR_RITUAL_POOL[0],
  time_space: ALTAR_RITUAL_POOL[1],
  mind: ALTAR_RITUAL_POOL[1],
  void: ALTAR_RITUAL_POOL[2],
  boon: ALTAR_RITUAL_POOL[2],
  chaos: ALTAR_RITUAL_POOL[3],
  blood_pact: ALTAR_RITUAL_POOL[4],
};

export function generateAltarRituals(randomFn: () => number = Math.random): AltarRitual[] {
  const pool = [...ALTAR_RITUAL_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

export function getDefaultAltarRituals(): AltarRitual[] {
  return [...DEFAULT_ALTAR_RITUALS];
}

export function resolveAltarAction(
  payload: { optionId: AltarRitualId; costType?: 'health' | 'sanity'; cardId?: string },
  context: NodeInteractionContext
): NodeActionResult {
  const { investigator, sanityDeck, altarUsed, currentDepth, turn = 1, adventureStats, randomFn = Math.random } = context;

  if (altarUsed) {
    return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
  }

  const { optionId, costType } = payload;
  let newHealth = investigator.health;
  let newMaxHealth = investigator.maxHealth;
  let newHandCapacity = investigator.handCapacity ?? 2;
  let updatedRelics = [...(investigator.relics || [])];
  let newObols = investigator.obols;
  let newSanityDeck = [...sanityDeck];
  const logs: string[] = [];
  let statsUpdate: Partial<AdventureStats> | undefined = undefined;

  if (optionId === 'flesh') {
    if (newHealth <= 6) {
      return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
    }
    newHealth -= 6;
    newMaxHealth += 5;
    newHealth = Math.min(newMaxHealth, newHealth + 5);
    logs.push(
      `在禁忌祭壇割破血肉完成誓約，承受 6 點傷害，最大生命值永久提升 5 點（當前生命值: ${newHealth} / ${newMaxHealth}）！`
    );
  } else if (optionId === 'mind' || optionId === 'time_space') {
    if (costType === 'sanity') {
      if (newSanityDeck.length <= 2) {
        return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
      }
      const consumedCards = newSanityDeck.slice(0, 2);
      newSanityDeck = newSanityDeck.slice(2);
      newHandCapacity += 1;
      logs.push(
        `在禁忌祭壇承受理智撕裂侵蝕，損耗 2 點理智（自牌庫永久除役【${consumedCards.map((c) => c.name).join('】與【')}】），手牌容量永久提升 1 點（當前抽牌與保留上限: ${newHandCapacity} 張）！`
      );
    } else {
      if (newHealth <= 10) {
        return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
      }
      newHealth -= 10;
      newHandCapacity += 1;
      logs.push(
        `在禁忌祭壇忍受神經撕裂劇痛，承受 10 點傷害，手牌容量永久提升 1 點（當前抽牌與保留上限: ${newHandCapacity} 張）！`
      );
    }
  } else if (optionId === 'boon' || optionId === 'void') {
    if (newHealth <= 6) {
      return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
    }
    newHealth -= 6;
    const ownedIds = new Set(updatedRelics.map((r) => r.id));
    const unowned = PRESET_RELICS.filter((r) => !ownedIds.has(r.id));
    if (unowned.length > 0) {
      const chosenRelic = unowned[Math.floor(randomFn() * unowned.length)];
      const invWithRelic = applyRelicToInvestigator(
        {
          ...investigator,
          health: newHealth,
          maxHealth: newMaxHealth,
          handCapacity: newHandCapacity,
          relics: updatedRelics,
        },
        chosenRelic
      );
      newHealth = invWithRelic.health;
      newMaxHealth = invWithRelic.maxHealth;
      newHandCapacity = invWithRelic.handCapacity ?? newHandCapacity;
      updatedRelics = invWithRelic.relics ?? updatedRelics;
      logs.push(`在禁忌祭壇獻祭鮮血，獲得舊日恩賜遺物【${chosenRelic.name}】！${chosenRelic.description}`);
    } else {
      newObols += 35;
      statsUpdate = {
        totalObolsCollected: (adventureStats?.totalObolsCollected ?? investigator.obols) + 35,
      };
      logs.push(`在禁忌祭壇獻祭鮮血，舊日微光賜予你 35 枚古金幣！`);
    }
  } else if (optionId === 'chaos') {
    if (newHealth <= 4 || newSanityDeck.length <= 1) {
      return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
    }
    newHealth -= 4;
    const purgeIndex = payload?.cardId
      ? newSanityDeck.findIndex((c) => c.id === payload.cardId)
      : (turn + investigator.health + newSanityDeck.length) % newSanityDeck.length;
    const targetIdx = purgeIndex >= 0 ? purgeIndex : 0;
    const [purgedCard] = newSanityDeck.splice(targetIdx, 1);
    newObols += 50;
    statsUpdate = {
      totalObolsCollected: (adventureStats?.totalObolsCollected ?? investigator.obols) + 50,
    };
    logs.push(
      `在禁忌祭壇簽訂混沌之契，承受 4 點傷害並除役【${purgedCard.name}】，自不可名狀之混沌中汲取了 50 枚古金幣！`
    );
  } else if (optionId === 'blood_pact') {
    if (newHealth <= 8) {
      return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
    }
    newHealth -= 8;
    const truthCard: Card = {
      ...TRUTH_CARD_BREAKWATER,
      id: `altar_truth_${currentDepth || 1}_${newSanityDeck.length + 1}`,
    };
    newSanityDeck.push(truthCard);
    newObols += 25;
    statsUpdate = {
      totalObolsCollected: (adventureStats?.totalObolsCollected ?? investigator.obols) + 25,
    };
    logs.push(`在禁忌祭壇簽訂血契之誓，承受 8 點深重傷害，獲得真相卡【心智防波堤】與 25 枚古金幣！`);
  }

  return {
    success: true,
    investigator: {
      ...investigator,
      health: newHealth,
      maxHealth: newMaxHealth,
      handCapacity: newHandCapacity,
      relics: updatedRelics,
      obols: newObols,
    },
    sanityDeck: newSanityDeck,
    nodeStateUpdates: { altarUsed: true },
    adventureStatsUpdate: statsUpdate,
    logs,
  };
}
