import type { Card } from '../../../types/game';
import { TRUTH_CARD_BREAKWATER } from '../../eventData';
import type { NodeActionResult, NodeInteractionContext } from '../types';

export interface SanctuaryActionPayload {
  optionId?: 'bandage' | 'meditate' | 'purge';
  actionType?: 'rest' | 'meditate' | 'purge';
  cardId?: string;
}

export function resolveSanctuaryAction(
  payload: SanctuaryActionPayload,
  context: NodeInteractionContext
): NodeActionResult {
  const { investigator, sanityDeck, sanctuaryUsed, currentNode, currentDepth } = context;

  if (sanctuaryUsed) {
    return {
      success: false,
      investigator,
      sanityDeck,
      nodeStateUpdates: {},
      logs: [],
    };
  }

  const action = payload.optionId ?? (payload.actionType === 'rest' ? 'bandage' : payload.actionType);

  if (action === 'bandage') {
    if (investigator.health >= investigator.maxHealth) {
      return {
        success: false,
        investigator,
        sanityDeck,
        nodeStateUpdates: {},
        logs: [],
      };
    }
    if (investigator.obols < 5 && sanityDeck.length === 0) {
      return {
        success: false,
        investigator,
        sanityDeck,
        nodeStateUpdates: {},
        logs: [],
      };
    }
  } else if (action === 'purge') {
    if (sanityDeck.length <= 1 || !payload.cardId) {
      return {
        success: false,
        investigator,
        sanityDeck,
        nodeStateUpdates: {},
        logs: ['牌庫卡牌數量過少，無法進一步除役焚毀！'],
      };
    }
  }

  let newHealth = investigator.health;
  let newObols = investigator.obols;
  let newSanityDeck = [...sanityDeck];
  const logs: string[] = [];

  const depth = currentDepth ?? 1;
  const isMidDepthHaven = Boolean(currentNode?.layer === 8 && depth <= 3);
  const healAmount = isMidDepthHaven ? 15 : 8;

  if (action === 'bandage') {
    const oldHealth = newHealth;
    newHealth = Math.min(investigator.maxHealth, newHealth + healAmount);
    const actualHealed = newHealth - oldHealth;
    const havenPrefix = isMidDepthHaven ? '【第 8 層中繼避難所】' : '';
    const havenActionText = isMidDepthHaven ? '進行重度休整與外科縫合' : '深層包紮';

    if (investigator.obols >= 5) {
      newObols = investigator.obols - 5;
      logs.push(
        `${havenPrefix}在避難所消耗 5 枚古金幣購置急救藥品與防腐繃帶，${havenActionText}恢復了 ${actualHealed} 點肉體生命值（當前生命值: ${newHealth} / ${investigator.maxHealth}，剩餘古金幣: ${newObols} 枚）。`
      );
    } else {
      if (newSanityDeck.length > 0) {
        newSanityDeck = newSanityDeck.slice(1);
      }
      logs.push(
        `${havenPrefix}因古金幣不足，調查員忍受劇痛強行縫合創口，損耗 1 點理智，${havenActionText}恢復了 ${actualHealed} 點肉體生命值（當前生命值: ${newHealth} / ${investigator.maxHealth}）。`
      );
    }
  } else if (action === 'meditate') {
    const truthCard: Card = {
      ...TRUTH_CARD_BREAKWATER,
      id: `sanctuary_truth_${newSanityDeck.length + 1}`,
    };
    newSanityDeck.push(truthCard);
    logs.push(`在避難所深層冥想，獲得真相卡【心智防波堤】納入理智牌庫！`);
  } else if (action === 'purge') {
    const targetId = payload.cardId;
    const targetIdx = newSanityDeck.findIndex((c) => c.id === targetId);
    if (targetIdx === -1) {
      return {
        success: false,
        investigator,
        sanityDeck,
        nodeStateUpdates: {},
        logs: [],
      };
    }

    const [purgedCard] = newSanityDeck.splice(targetIdx, 1);
    logs.push(`在避難所壁爐餘火中，將卡牌【${purgedCard.name}】投入火堆永久焚毀除役！`);
  }

  return {
    success: true,
    investigator: {
      ...investigator,
      health: newHealth,
      obols: newObols,
    },
    sanityDeck: newSanityDeck,
    nodeStateUpdates: { sanctuaryUsed: true },
    logs,
  };
}
