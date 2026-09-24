import type { AdventureStats, Card, Relic } from '../../../types/game';
import { CardRegistry } from '../../cards/registry';
import { applyRelicToInvestigator, PRESET_RELICS } from '../../relics';
import type { NodeActionResult, NodeInteractionContext } from '../types';

export function resolveVaultAction(
  payload: { relicId?: string; relicIds?: string[]; desecrate?: boolean; claimObols?: boolean },
  context: NodeInteractionContext
): NodeActionResult {
  const { investigator, sanityDeck, vaultClaimed, vaultRelics, adventureStats } = context;

  if (vaultClaimed) {
    return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
  }

  const { relicId, relicIds, desecrate, claimObols } = payload;
  const logs: string[] = [];
  let updatedInvestigator = { ...investigator };
  let newSanityDeck = [...sanityDeck];
  let statsUpdate: Partial<AdventureStats> | undefined = undefined;

  if (desecrate) {
    const ids = relicIds ?? (relicId ? [relicId] : []);
    if (ids.length !== 2) {
      return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
    }
    const idSet = new Set(ids);
    if (idSet.size !== 2) {
      return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
    }

    const availableRelics = vaultRelics || PRESET_RELICS;
    const targetRelics = ids
      .map((id) => availableRelics.find((r) => r.id === id) || PRESET_RELICS.find((r) => r.id === id))
      .filter(Boolean) as Relic[];

    if (targetRelics.length !== 2) {
      return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
    }

    for (const relic of targetRelics) {
      updatedInvestigator = applyRelicToInvestigator(updatedInvestigator, relic);
    }

    const baseCurse = CardRegistry.getCardById('card_abyss_curse');
    if (!baseCurse) {
      return { success: false, investigator, sanityDeck, nodeStateUpdates: {}, logs: [] };
    }
    const curseCard: Card = {
      ...baseCurse,
      id: `card_abyss_curse_${newSanityDeck.length + 1}`,
    };
    newSanityDeck.push(curseCard);

    logs.push(
      `在遺物秘閣強行破除古神封印，掠取了【${targetRelics.map((r) => r.name).join('】與【')}】兩件太古遺物！但深淵詛咒已悄然烙印，無法打出的【深淵詛咒】瘋狂卡已永久注入理智牌庫！`
    );
  } else if (claimObols) {
    updatedInvestigator.obols += 20;
    statsUpdate = {
      totalObolsCollected: (adventureStats?.totalObolsCollected ?? investigator.obols) + 20,
    };
    logs.push(`在遺物秘閣中搜括暗格，獲得了 20 枚古金幣！`);
  } else if (relicId) {
    const targetRelic =
      (vaultRelics || []).find((r) => r.id === relicId) ||
      PRESET_RELICS.find((r) => r.id === relicId);
    if (targetRelic) {
      updatedInvestigator = applyRelicToInvestigator(updatedInvestigator, targetRelic);
      logs.push(`在遺物秘閣中選取了【${targetRelic.name}】收入行囊！${targetRelic.description}`);
    }
  }

  return {
    success: true,
    investigator: updatedInvestigator,
    sanityDeck: newSanityDeck,
    nodeStateUpdates: { vaultClaimed: true },
    adventureStatsUpdate: statsUpdate,
    logs,
  };
}
