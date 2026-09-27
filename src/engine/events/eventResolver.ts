import type { Card, Enemy, MythosEvent, MythosEventOption } from '../../types/game';
import { applyRelicToInvestigator } from '../relics';
import { cloneEnemy } from '../enemyCatalog';
import { INITIAL_GHOUL } from '../initialData';
import { setupCombatDeck, DEFAULT_HAND_CAPACITY } from '../combat';
import type { MythosEventContext, MythosResult } from './types';

/**
 * 秘識奇遇後果解析器（純函數）
 *
 * 接受奇遇事件、所選選項與當前快照，回傳確定性的 MythosResult。
 * 三種互斥終局：
 *   - defeat   — 調查員生命值歸零
 *   - combat   — 奇遇觸發戰鬥轉場
 *   - resolved — 一般奇遇結算完成
 *
 * 無副作用：不讀寫 localStorage，不觸發全域導航。
 * saveFallenInvestigatorFromState 等持久化操作由外層 Reducer 根據 outcome 統一處理。
 */
export function resolveMythosEvent(
  event: MythosEvent,
  option: MythosEventOption,
  ctx: MythosEventContext,
): MythosResult {
  const {
    sanityDeck: initialSanityDeck,
    hand: initialHand,
    discardPile: initialDiscardPile,
    adventureStats,
    occupationId,
    shuffledDeck,
  } = ctx;

  let investigator = { ...ctx.investigator };
  let sanityDeck = [...initialSanityDeck];
  let discardPile = [...initialDiscardPile];
  const hand = [...initialHand];
  let triggerCombatEnemy: Enemy | undefined;
  const logs: string[] = [];
  let gainedCardsCount = 0;

  // ── 逐一套用後果 ──────────────────────────────────────────
  for (const consequence of option.consequences) {
    logs.push(consequence.narrative);

    switch (consequence.type) {
      case 'health_change': {
        if (consequence.value === undefined) break;
        investigator = {
          ...investigator,
          health: Math.max(0, Math.min(investigator.maxHealth, investigator.health + consequence.value)),
        };
        break;
      }

      case 'gain_obols': {
        if (consequence.value === undefined) break;
        investigator = {
          ...investigator,
          obols: Math.max(0, investigator.obols + consequence.value),
        };
        break;
      }

      case 'sanity_change': {
        if (consequence.value === undefined) break;
        if (consequence.value < 0) {
          // 燒牌（從牌庫頂部移除）
          const burnCount = Math.min(sanityDeck.length, Math.abs(consequence.value));
          sanityDeck = sanityDeck.slice(burnCount);
        } else if (consequence.value > 0) {
          // 回補：優先從棄牌堆取，剩餘缺額生成心靈澄澈
          let deficit = consequence.value;
          if (discardPile.length > 0) {
            const recoverCount = Math.min(discardPile.length, deficit);
            const recovered = discardPile.splice(0, recoverCount);
            sanityDeck = [...sanityDeck, ...recovered];
            deficit -= recoverCount;
          }
          for (let i = 0; i < deficit; i++) {
            sanityDeck.push(makeClarityCard(sanityDeck.length + 1));
          }
        }
        break;
      }

      case 'gain_card': {
        if (!consequence.card) break;
        gainedCardsCount++;
        const injected: Card = {
          ...consequence.card,
          id: `${consequence.card.id}_evt_${initialSanityDeck.length + gainedCardsCount}`,
          isTemporary: false,
        };
        sanityDeck = [...sanityDeck, injected];
        break;
      }

      case 'gain_relic': {
        if (!consequence.relic) break;
        investigator = applyRelicToInvestigator(investigator, consequence.relic);
        break;
      }

      case 'trigger_combat': {
        triggerCombatEnemy = consequence.enemy ?? INITIAL_GHOUL;
        break;
      }
    }
  }

  // ── 計算古金幣增量並累計至 adventureStats ─────────────────
  const gainedObols = Math.max(0, investigator.obols - ctx.investigator.obols);
  const updatedStats = {
    ...adventureStats,
    totalObolsCollected: adventureStats.totalObolsCollected + gainedObols,
  };

  // ── 更新奇遇事件快照（選項已選 + 後果文本） ────────────────
  const updatedEvent: MythosEvent = {
    ...event,
    selectedOptionId: option.id,
    resolvedOutcomeText: option.consequences.map((c) => c.narrative),
  };

  // ── 終局 1：調查員殞命 ─────────────────────────────────────
  if (investigator.health <= 0) {
    return {
      outcome: 'defeat',
      investigator,
      updatedEvent,
      adventureStats: updatedStats,
      logs: ['【肉體殞命】調查員在奇遇事件中傷重不治！'],
    };
  }

  // ── 終局 2：觸發戰鬥轉場 ──────────────────────────────────
  if (triggerCombatEnemy) {
    const currentCards = [...sanityDeck, ...hand, ...discardPile];
    const handCapacity = investigator.handCapacity ?? DEFAULT_HAND_CAPACITY;
    const { hand: combatHand, sanityDeck: combatSanityDeck } = setupCombatDeck(
      currentCards,
      occupationId ?? 'investigator',
      shuffledDeck,
      handCapacity,
    );

    return {
      outcome: 'combat',
      investigator: {
        ...investigator,
        armor: 0,
        stamina: investigator.maxStamina,
      },
      sanityDeck: combatSanityDeck,
      hand: combatHand,
      discardPile: [],
      enemy: cloneEnemy(triggerCombatEnemy),
      adventureStats: updatedStats,
      logs,
    };
  }

  // ── 終局 3：一般奇遇結算 ───────────────────────────────────
  return {
    outcome: 'resolved',
    investigator,
    sanityDeck,
    hand,
    discardPile,
    updatedEvent,
    adventureStats: updatedStats,
    logs,
  };
}

// ────────────────────────────────────────────────────────────
// 內部工具
// ────────────────────────────────────────────────────────────

function makeClarityCard(index: number): Card {
  return {
    id: `event_truth_restored_${index}`,
    name: '心靈澄澈',
    category: 'truth',
    costType: 'stamina',
    costValue: 1,
    isTemporary: false,
    effects: [{ type: 'add_to_deck', value: 2 }],
    description: '平抑恐慌與混亂，向理智牌庫注入 2 張真相卡。',
    flavorText: '「在混沌之中覓得一絲清明。」',
  };
}
