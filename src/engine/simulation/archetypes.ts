import type { Card } from '../../types/game';
import { CardRegistry } from '../cards/registry';
import { ensureUniqueCardIds } from '../cardFactory';
import type { ArchetypeId } from './balanceTypes';

export interface ArchetypeDefinition {
  id: ArchetypeId;
  name: string;
  description: string;
  coreCardNames: string[];
}

export const ARCHETYPE_DEFINITIONS: Record<ArchetypeId, ArchetypeDefinition> = {
  armor_counter: {
    id: 'armor_counter',
    name: '護甲反擊 (鐵壁蓄力)',
    description: '依賴高額格擋吸收敵怪傷害，配合護甲猛擊或反傷連鎖終結對手的穩健防禦流派。',
    coreCardNames: ['就地掩蔽', '星界庇護', '護甲猛擊', '鋼鐵意志屏障', '不可侵犯之壁'],
  },
  bleed_pierce: {
    id: 'bleed_pierce',
    name: '流血穿刺 (致命精準)',
    description: '透過高層數流血持續折磨敵怪，搭配穿刺攻擊撕裂厚重護甲的爆發打擊流派。',
    coreCardNames: ['軍刀突刺', '快速拔槍', '弱點狙擊', '破魔銀質短刃', '達姆高爆彈連射'],
  },
  truth_restore: {
    id: 'truth_restore',
    name: '真相回補 (洞悉神智)',
    description: '不斷洗回牌庫並注入真相微光，維持理智充盈與手牌循環的控場長盤流派。',
    coreCardNames: ['舊日殘頁', '銀鑰儀式', '星界洞察', '真相潮汐', '拉萊耶原典啟示'],
  },
  madness_sacrifice: {
    id: 'madness_sacrifice',
    name: '狂亂自殘 (嗜血狂暴)',
    description: '壓低肉體生命與精神理智，主動遁入瘋狂或藉自殘效果換取極限爆發的險招流派。',
    coreCardNames: ['盲目爪擊', '深淵狂嘯', '狂亂血刃', '深淵引爆', '深淵靈能撕裂'],
  },
  high_cost_magic: {
    id: 'high_cost_magic',
    name: '高費秘術 (虛空湮滅)',
    description: '消耗大量理智召喚星辰偉力，具備全屏碾壓或真實穿透性打擊的高位法術流派。',
    coreCardNames: ['靈能衝擊', '厄運凝視', '虛空烈焰', '深海冰霜之握', '超維虛空湮滅'],
  },
  status_attrition: {
    id: 'status_attrition',
    name: '狀態磨血 (弱化衰敗)',
    description: '疊加易傷、恐懼與破勢印記，令敵怪攻擊大幅弱化同時放大調查員後續所有打擊的折磨流派。',
    coreCardNames: ['恐懼低語', '狂亂低語', '戰術佯攻', '心靈震波', '鉛頭手杖'],
  },
};

/**
 * 組裝指定流派的測試專用基礎牌庫
 */
export function buildArchetypeDeck(archetypeId: ArchetypeId): Card[] {
  const compendium = CardRegistry.getAllCompendiumCards();
  const def = ARCHETYPE_DEFINITIONS[archetypeId];

  // 1. 基底取偵探起始牌
  const baseStarter = CardRegistry.getStarterDeck('investigator');

  // 2. 挑出該流派的核心卡牌
  const coreCards: Card[] = [];
  for (const cardName of def.coreCardNames) {
    const found = compendium.find((c) => c.name === cardName);
    if (found) {
      coreCards.push({ ...found });
    }
  }

  // 3. 組合並確保 ID 唯一
  return ensureUniqueCardIds([...baseStarter, ...coreCards]);
}

/**
 * 組裝隨機噪聲雜牌牌庫 (測試泛用適應性)
 */
export function buildNoiseDeck(randomFn: () => number = Math.random): Card[] {
  const compendium = CardRegistry.getAllCompendiumCards();
  const baseStarter = CardRegistry.getStarterDeck('investigator');

  // 隨機抽取 5 張非起始卡
  const candidatePool = compendium.filter((c) => c.tier !== undefined);
  const picked: Card[] = [];
  for (let i = 0; i < 5; i++) {
    const idx = Math.floor(randomFn() * candidatePool.length);
    picked.push({ ...candidatePool[idx] });
  }

  return ensureUniqueCardIds([...baseStarter, ...picked]);
}

/**
 * 組裝隨機化流派牌庫 (10 ~ 35 張) (ADR-0001, ADR-0009, ADR-0033)
 * - 植入該流派核心卡牌
 * - 若有目標卡則植入 1~3 張
 * - 隨機補充至 10 ~ 35 張規模
 */
export function buildRandomizedArchetypeDeck(options: {
  archetypeId: ArchetypeId;
  targetCard?: Card;
  copies?: 1 | 2 | 3;
  minSize?: number;
  maxSize?: number;
  randomFn?: () => number;
}): Card[] {
  const {
    archetypeId,
    targetCard,
    copies = 1,
    minSize = 10,
    maxSize = 35,
    randomFn = Math.random,
  } = options;

  const def = ARCHETYPE_DEFINITIONS[archetypeId];
  const compendium = CardRegistry.getAllCompendiumCards();
  const deckSize = minSize + Math.floor(randomFn() * (maxSize - minSize + 1));
  const deck: Card[] = [];

  // 1. 植入目標卡
  if (targetCard) {
    for (let i = 0; i < copies; i++) {
      deck.push({ ...targetCard });
    }
  }

  // 2. 植入流派核心卡
  for (const cardName of def.coreCardNames) {
    const found = compendium.find((c) => c.name === cardName);
    if (found && deck.length < deckSize) {
      deck.push({ ...found });
    }
  }

  // 3. 補足其餘張數至 deckSize (隨機抽樣自卡池)
  const remaining = Math.max(0, deckSize - deck.length);
  for (let i = 0; i < remaining; i++) {
    const pick = compendium[Math.floor(randomFn() * compendium.length)];
    deck.push({ ...pick });
  }

  return ensureUniqueCardIds(deck);
}

