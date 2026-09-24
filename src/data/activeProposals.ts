import type { CostType } from '../types/game';

export interface CardProposalOverlay {
  proposed: {
    costType?: CostType;
    costValue?: number;
    keywords?: string[];
    description?: string;
  };
  designRationale: string;
  synergies: string[];
  counterplay?: string;
}

/**
 * 活躍的待審查改動草案 (Active Card Proposals)
 * 依據 ADR-0035，僅收錄「當前正在研議修改」之卡牌草案。
 * 一旦草案於 src/engine 實裝合併，只需將該項目自本映射表中移除，該卡即自動回歸最新 Live Baseline，杜絕陳舊 diff。
 */
export const ACTIVE_CARD_PROPOSALS: Record<string, CardProposalOverlay> = {
  // 目前所有卡牌已實裝至引擎基準線，初始歸零為乾淨狀態。
};
