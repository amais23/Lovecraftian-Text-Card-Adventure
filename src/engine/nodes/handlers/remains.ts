import type { AdventureStats, Card, MapNode } from '../../../types/game';
import { isInheritableCard } from '../../remainsStorage';
import type { NodeActionResult, NodeEntryResult, NodeInteractionContext } from '../types';

/**
 * 處理先驅遺骸節點進入結算（純函數）
 */
export function resolveRemainsEntry(
  node: MapNode,
  fallenName?: string
): NodeEntryResult {
  return {
    nodeStateUpdates: {
      phase: 'remains',
      remainsClaimed: false,
    },
    log: fallenName
      ? `抵達先驅殘骸節點【${node.title}】。此處倒著前代殉職調查員【${fallenName}】的枯骨遺骸，遺物與筆記散落一地。`
      : `抵達先驅殘骸節點【${node.title}】。此處枯骨散落，但歲月已將前人的所有痕跡磨滅殆盡。`,
  };
}

/**
 * 結算先驅遺骸傳承互動動作（純函數，無全域副作用）
 */
export function resolveRemainsAction(
  payload: { type: 'card'; cardId: string } | { type: 'obols' },
  context: NodeInteractionContext
): NodeActionResult {
  const { investigator, sanityDeck, remainsClaimed, fallenInvestigator, adventureStats } = context;

  if (remainsClaimed || !fallenInvestigator) {
    return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
  }

  const logs: string[] = [];
  let updatedInvestigator = { ...investigator };
  let newSanityDeck = [...sanityDeck];
  let statsUpdate: Partial<AdventureStats> | undefined = undefined;

  if (payload.type === 'card') {
    const cardId = payload.cardId;
    const targetCard = fallenInvestigator.deck.find((c) => c.id === cardId);
    if (targetCard && isInheritableCard(targetCard)) {
      const timestamp = context.timestamp ?? fallenInvestigator.timestamp ?? 1;
      const inheritedCard: Card = {
        ...targetCard,
        id: `${targetCard.id}_inherited_${timestamp}`,
        isTemporary: false,
      };
      newSanityDeck.push(inheritedCard);
      logs.push(
        `撫摸著枯骨旁沾血的筆記，繼承了前人遺留的卡牌【${targetCard.name}】納入理智牌庫！`
      );
    }
  } else if (payload.type === 'obols') {
    const inheritedObols = Math.max(15, Math.floor(fallenInvestigator.obols * 0.5));
    updatedInvestigator.obols += inheritedObols;
    statsUpdate = {
      totalObolsCollected: (adventureStats?.totalObolsCollected ?? investigator.obols) + inheritedObols,
    };
    logs.push(`自前代殉職調查員的殘破行囊中，拾取了 ${inheritedObols} 枚殘存古金幣。`);
  }

  return {
    success: true,
    investigator: updatedInvestigator,
    sanityDeck: newSanityDeck,
    nodeStateUpdates: { remainsClaimed: true },
    adventureStatsUpdate: statsUpdate,
    clearFallenRecord: true,
    logs,
  };
}
