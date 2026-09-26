import type { Card } from '../../../types/game';

/**
 * 白色真相注入卡模板（平復心智或啟迪時注入理智牌庫）
 */
export const TRUTH_INJECTED_TEMPLATE: Omit<Card, 'id'> = {
  name: '真相微光',
  category: 'truth',
  costType: 'stamina',
  costValue: 0,
  isTemporary: true,
  keywords: ['exhaust'],
  artworkUrl: '/cards/truth/card_truth_glimmer.png',
  effects: [
    { type: 'armor', value: 3 },
    { type: 'draw', value: 1 },
  ],
  description: '【消耗】獲得 3 點護甲，抽取 1 張卡牌。打出後移出戰鬥。',
  flavorText: '「瘋狂漸漸褪去，但未知的印記已深深烙印在靈魂之中。」',
};

/**
 * 卡牌圖鑑專屬的真相卡原型
 */
export const COMPENDIUM_TRUTH_CARDS: Card[] = [
  {
    ...TRUTH_INJECTED_TEMPLATE,
    id: 'compendium_truth_glimmer',
  },
];
