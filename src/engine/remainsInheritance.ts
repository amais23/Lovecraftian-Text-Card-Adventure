import type { Card, FallenInvestigatorRecord, GameState } from '../types/game';
import { getAllPermanentCards, isAbyssalFragment, isCompleteAncientSeal } from './abyssalSeals';

export const FALLEN_INVESTIGATOR_STORAGE_KEY = 'arkham_fallen_investigator';

/**
 * 判斷卡牌是否可供後繼調查員傳承繼承
 * 排除臨時卡、無法打出的卡牌、深淵封印殘片與完整的深淵古印
 */
export function isInheritableCard(card: Card): boolean {
  if (!card) return false;
  if (card.isTemporary) return false;
  if (card.isUnplayable) return false;
  if (isAbyssalFragment(card)) return false;
  if (isCompleteAncientSeal(card)) return false;
  return true;
}

/**
 * 儲存殉職調查員傳承紀錄至本機儲存空間
 */
export function saveFallenInvestigator(record: FallenInvestigatorRecord): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const sanitizedRecord: FallenInvestigatorRecord = {
      ...record,
      deck: (record.deck || []).filter(isInheritableCard),
    };
    localStorage.setItem(FALLEN_INVESTIGATOR_STORAGE_KEY, JSON.stringify(sanitizedRecord));
  } catch (err) {
    console.warn('[RemainsInheritance] Failed to save fallen investigator record:', err);
  }
}

/**
 * 自遊戲狀態結算殉職調查員資訊並持久化儲存
 */
export function saveFallenInvestigatorFromState(
  state: GameState,
  causeOfDeath: string = '肉體傷重殞命'
): void {
  try {
    const permanentCards = getAllPermanentCards(state).filter(isInheritableCard);
    if (!permanentCards || permanentCards.length === 0) return;

    const record: FallenInvestigatorRecord = {
      name: state.investigator.name || '無名調查員',
      occupation: state.investigator.occupation || '調查員',
      occupationId: state.investigator.occupationId,
      deck: permanentCards,
      obols: state.investigator.obols ?? 0,
      depth: state.currentDepth ?? state.map?.depth ?? 1,
      causeOfDeath,
      timestamp: Date.now(),
    };

    saveFallenInvestigator(record);
  } catch (err) {
    console.warn('[RemainsInheritance] Failed to extract fallen investigator from state:', err);
  }
}

/**
 * 自本機儲存空間讀取殉職調查員傳承紀錄
 */
export function getFallenInvestigator(): FallenInvestigatorRecord | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(FALLEN_INVESTIGATOR_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.name === 'string' &&
      Array.isArray(parsed.deck) &&
      typeof parsed.obols === 'number'
    ) {
      return {
        ...parsed,
        deck: parsed.deck.filter(isInheritableCard),
      } as FallenInvestigatorRecord;
    }
    return null;
  } catch (err) {
    console.warn('[RemainsInheritance] Failed to read fallen investigator record:', err);
    return null;
  }
}

/**
 * 檢驗當前是否存在前人壞結局遺骸傳承紀錄
 */
export function hasFallenInvestigatorRecord(): boolean {
  return getFallenInvestigator() !== null;
}

/**
 * 清除本機儲存空間之殉職調查員傳承紀錄（領取遺產或探索離開後清除）
 */
export function clearFallenInvestigator(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(FALLEN_INVESTIGATOR_STORAGE_KEY);
  } catch (err) {
    console.warn('[RemainsInheritance] Failed to clear fallen investigator record:', err);
  }
}
