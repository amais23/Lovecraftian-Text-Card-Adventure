import type { MapNode } from '../../types/game';
import { advanceMapAfterNode } from '../mapGenerator';
import { PRESET_RELICS } from '../relics';
import { fisherYatesShuffle } from '../shuffleUtils';
import { resolveSanctuaryAction } from './handlers/sanctuary';
import { generateMarketItemsForDepth, resolveMarketBuyItem, resolveMarketPurgeCard } from './handlers/market';
import { generateAltarRituals, resolveAltarAction } from './handlers/altar';
import { resolveVaultAction } from './handlers/vault';
import { resolveBloodAltarAction } from './handlers/bloodAltar';
import { resolveRemainsAction } from './handlers/remains';
import type {
  NodeActionResult,
  NodeEntryContext,
  NodeEntryResult,
  NodeInteractionAction,
  NodeInteractionContext,
  NodeLeaveContext,
  NodeLeaveResult,
} from './types';

/**
 * 處理非戰鬥探索節點之進入初始化
 */
export function resolveNodeEntry(node: MapNode, context: NodeEntryContext): NodeEntryResult {
  const { depth, occupationId, investigatorRelicIds, fallenInvestigator, randomFn = Math.random } = context;

  switch (node.type) {
    case 'sanctuary': {
      return {
        nodeStateUpdates: {
          phase: 'sanctuary',
          sanctuaryUsed: false,
        },
        log: `探索【${node.title}】！抵達安全避難所。`,
      };
    }

    case 'market': {
      const items = generateMarketItemsForDepth(
        depth,
        occupationId ?? 'investigator',
        { ownedRelicIds: investigatorRelicIds, randomFn }
      );
      return {
        nodeStateUpdates: {
          phase: 'market',
          marketItems: items,
          marketPurgeUsed: false,
        },
        log: `探索【${node.title}】！進入黑市商鋪。`,
      };
    }

    case 'altar': {
      const altarRituals = generateAltarRituals(randomFn);
      return {
        nodeStateUpdates: {
          phase: 'altar',
          altarUsed: false,
          altarRituals,
        },
        log: `探索【${node.title}】！古老陰森的禁忌祭壇在前方矗立，幽藍冷火散發著陣陣寒意。`,
      };
    }

    case 'vault': {
      const ownedSet = new Set(investigatorRelicIds || []);
      const unowned = PRESET_RELICS.filter((r) => !ownedSet.has(r.id));
      const candidates = unowned.length >= 3 ? unowned : PRESET_RELICS;
      const shuffled = fisherYatesShuffle(candidates, randomFn);
      const vaultRelics = shuffled.slice(0, 3);
      return {
        nodeStateUpdates: {
          phase: 'vault',
          vaultRelics,
          vaultClaimed: false,
        },
        log: `探索【${node.title}】！厚重的青銅巨門徐徐開啟，遺物秘閣內陳列著太古法器。`,
      };
    }

    case 'blood_altar': {
      return {
        nodeStateUpdates: {
          phase: 'blood_altar',
          bloodAltarUsed: false,
        },
        log: `探索【${node.title}】！血之祭壇前刻劃著純淨之契，可用自身鮮血為媒介淨化理智牌庫。`,
      };
    }

    case 'remains': {
      return {
        nodeStateUpdates: {
          phase: 'remains',
          fallenInvestigator: fallenInvestigator ?? null,
          remainsClaimed: false,
        },
        log: `探索【${node.title}】！在迷霧與碎石間發現了前代殉職調查員的殘破骸骨與行囊。`,
      };
    }

    default:
      return {
        nodeStateUpdates: {},
        log: `探索【${node.title}】。`,
      };
  }
}

/**
 * 處理非戰鬥探索節點之動作交互結算
 */
export function resolveNodeInteraction(
  action: NodeInteractionAction,
  context: NodeInteractionContext
): NodeActionResult {
  switch (action.type) {
    case 'USE_SANCTUARY':
      return resolveSanctuaryAction(action.payload, context);

    case 'BUY_MARKET_ITEM':
      return resolveMarketBuyItem(action.payload, context);

    case 'PURGE_CARD_AT_MARKET':
      return resolveMarketPurgeCard(action.payload, context);

    case 'USE_ALTAR':
      return resolveAltarAction(action.payload, context);

    case 'CLAIM_VAULT_RELIC':
      return resolveVaultAction(action.payload, context);

    case 'SACRIFICE_CARDS_AT_BLOOD_ALTAR':
      return resolveBloodAltarAction(action.payload, context);

    case 'INHERIT_REMAINS':
      return resolveRemainsAction(action.payload, context);

    default: {
      const exhaustiveCheck: never = action;
      return {
        success: false,
        investigator: context.investigator,
        sanityDeck: context.sanityDeck,
        nodeStateUpdates: {},
        logs: [],
      };
    }
  }
}

/**
 * 處理非戰鬥探索節點之退場與地圖推進
 */
export function resolveNodeLeave(context: NodeLeaveContext): NodeLeaveResult {
  const { phase, map } = context;
  const updatedMap = advanceMapAfterNode(map);

  let log = '離開節點，重返調查地圖。';
  let clearFallenRecord = false;
  const nodeStateCleans: Record<string, undefined> = {};

  if (phase === 'sanctuary') {
    log = '離開安全避難所，繼續踏入阿卡姆的迷霧路線。';
    nodeStateCleans.sanctuaryUsed = undefined;
  } else if (phase === 'market') {
    log = '離開黑市暗巷，重新回到調查地圖。';
    nodeStateCleans.marketItems = undefined;
    nodeStateCleans.marketPurgeUsed = undefined;
  } else if (phase === 'altar') {
    log = '告別禁忌祭壇，重回阿卡姆調查地圖。';
    nodeStateCleans.altarUsed = undefined;
    nodeStateCleans.altarRituals = undefined;
  } else if (phase === 'vault') {
    log = '離開遺物秘閣，青銅巨門在身後轟然闔上。';
    nodeStateCleans.vaultRelics = undefined;
    nodeStateCleans.vaultClaimed = undefined;
  } else if (phase === 'blood_altar') {
    log = '離開血之祭壇，牌庫精簡洗鍊，神識重歸清明。';
    nodeStateCleans.bloodAltarUsed = undefined;
  } else if (phase === 'remains') {
    clearFallenRecord = true;
    log = '向殉職前輩的骸骨致敬默哀後，調查員背起行囊繼續踏入迷霧。';
    nodeStateCleans.fallenInvestigator = undefined;
    nodeStateCleans.remainsClaimed = undefined;
  }

  return {
    map: updatedMap,
    nodeStateCleans,
    clearFallenRecord,
    logs: [log],
  };
}
