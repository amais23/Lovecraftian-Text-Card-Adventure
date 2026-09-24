import type { NodeActionResult, NodeInteractionContext } from '../types';

export function resolveBloodAltarAction(
  payload: { cardIds: string[]; branch?: 'pure' | 'reshape' },
  context: NodeInteractionContext
): NodeActionResult {
  const { investigator, sanityDeck, bloodAltarUsed } = context;

  if (bloodAltarUsed) {
    return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
  }

  const branch = payload.branch || 'pure';
  const requiredCount = branch === 'reshape' ? 1 : 2;
  const cardIds = payload.cardIds;
  if (!cardIds || cardIds.length !== requiredCount) {
    return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
  }

  const idSet = new Set(cardIds);
  if (idSet.size !== requiredCount) {
    return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
  }

  const permanentCards = sanityDeck.filter((c) => !c.isTemporary);
  const minRemaining = branch === 'reshape' ? 1 : 2;
  if (permanentCards.length - cardIds.length < minRemaining) {
    return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
  }

  const purgedNames: string[] = [];
  const remainingCards = permanentCards.filter((c) => {
    if (idSet.has(c.id)) {
      purgedNames.push(c.name);
      return false;
    }
    return true;
  });

  if (remainingCards.length !== permanentCards.length - requiredCount) {
    return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
  }

  let updatedInvestigator = { ...investigator };
  let logMessage = '';

  if (branch === 'reshape') {
    const healAmount = 5;
    const newHealth = Math.min(investigator.maxHealth, investigator.health + healAmount);
    updatedInvestigator.health = newHealth;
    logMessage = `在血之祭壇進行血肉重塑，將【${purgedNames[0]}】永久除役，並藉由古神恩典恢復 ${healAmount} 點生命值（當前生命: ${newHealth}/${investigator.maxHealth}）。`;
  } else {
    logMessage = `在血之祭壇燃起淨化血火，將【${purgedNames.join('】與【')}】自理智牌庫中永久除役！`;
  }

  return {
    success: true,
    investigator: updatedInvestigator,
    sanityDeck: remainingCards,
    nodeStateUpdates: { bloodAltarUsed: true },
    logs: [logMessage],
  };
}
