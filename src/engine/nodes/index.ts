export * from './types';
export {
  resolveNodeEntry,
  resolveNodeInteraction,
  resolveNodeLeave,
} from './nodeResolver';

// Domain constants and helpers needed by outside UI and map generator
export {
  MARKET_PURGE_COST,
  generateDefaultMarketItems,
  generateMarketItemsForDepth,
  type GenerateMarketItemsOptions,
} from './handlers/market';

export {
  ALTAR_RITUAL_POOL,
  ALTAR_RITUALS_BY_ID,
  generateAltarRituals,
  getDefaultAltarRituals,
} from './handlers/altar';

export {
  saveFallenInvestigatorFromState,
  saveFallenInvestigator,
  getFallenInvestigator,
  clearFallenInvestigator,
  hasFallenInvestigatorRecord,
  isInheritableCard,
  FALLEN_INVESTIGATOR_STORAGE_KEY,
} from './handlers/remains';
