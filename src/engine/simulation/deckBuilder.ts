import type { Card, Relic } from '../../types/game';
import { CardRegistry } from '../cards/registry';
import { ensureUniqueCardIds } from '../cardFactory';

/**
 * 輔助建構器：在基底牌庫中植入指定張數（1~3 張）的目標卡牌
 * 自動維護所有卡牌的執行期唯一 ID，確保重複卡牌在戰鬥結算中各自獨立
 */
export function buildDeckWithCopies(
  baseDeck: Card[],
  targetCard: Card,
  copies: 1 | 2 | 3,
  mode: 'add' | 'replace' = 'add'
): Card[] {
  let deck: Card[];

  if (mode === 'replace') {
    // 移除同名卡牌後補入指定張數
    const filtered = baseDeck.filter((c) => c.name !== targetCard.name);
    const added: Card[] = Array.from({ length: copies }, () => ({ ...targetCard }));
    deck = [...filtered, ...added];
  } else {
    // 直接追加指定張數
    const added: Card[] = Array.from({ length: copies }, () => ({ ...targetCard }));
    deck = [...baseDeck, ...added];
  }

  return ensureUniqueCardIds(deck);
}

/**
 * 輔助建構器：組裝指定重複數量（0~3 個）的舊日遺物清單
 */
export function buildRelicSet(
  baseRelics: Relic[] = [],
  targetRelic?: Relic,
  copies: 0 | 1 | 2 | 3 = 1
): Relic[] {
  if (!targetRelic || copies === 0) {
    return [...baseRelics];
  }

  const added: Relic[] = Array.from({ length: copies }, () => ({ ...targetRelic }));
  return [...baseRelics, ...added];
}

/**
 * 取得標準初始基準牌庫
 */
export function getStarterBaseline(occupation: 'investigator' | 'occultist' = 'investigator'): Card[] {
  return CardRegistry.getStarterDeck(occupation);
}

/**
 * 隨機牌庫抽樣建構器：在指定範圍（預設 10 ~ 35 張）內隨機組成牌庫 (ADR-0001, ADR-0009, ADR-0033)
 * - 不再硬性綁定預設起始手牌或固定 12 張初始牌庫
 * - 從全 73 張典藏卡牌池中進行蒙地卡羅隨機抽樣
 * - 若指定 targetCard 與 copies (1~3)，則確保植入該指定張數的目標卡牌
 */
export function buildRandomizedDeck(options: {
  targetCard?: Card;
  copies?: 1 | 2 | 3;
  minSize?: number;
  maxSize?: number;
  candidatePool?: Card[];
  randomFn?: () => number;
} = {}): Card[] {
  const {
    targetCard,
    copies = 1,
    minSize = 10,
    maxSize = 35,
    candidatePool = CardRegistry.getAllCompendiumCards(),
    randomFn = Math.random,
  } = options;

  const deckSize = minSize + Math.floor(randomFn() * (maxSize - minSize + 1));
  const deck: Card[] = [];

  if (targetCard) {
    for (let i = 0; i < copies; i++) {
      deck.push({ ...targetCard });
    }
  }

  const remaining = Math.max(0, deckSize - deck.length);
  for (let i = 0; i < remaining; i++) {
    const pickIdx = Math.floor(randomFn() * candidatePool.length);
    deck.push({ ...candidatePool[pickIdx] });
  }

  return ensureUniqueCardIds(deck);
}
