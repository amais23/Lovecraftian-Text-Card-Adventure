import type { InvestigationMap, MapNode, MapNodeType } from '../types/game';

export interface RawNodeConfig {
  id: string;
  type: MapNodeType;
  layer: number;
  col: number;
  label: string;
  title: string;
  description: string;
  nextNodes: string[];
}

export const BASE_MAP_TEMPLATE: RawNodeConfig[] = [
  // Layer 0: Entry points (2 nodes)
  {
    id: 'node_0_0',
    type: 'combat',
    layer: 0,
    col: 0,
    label: '常規遭遇',
    title: '陰暗小巷',
    description: '潛伏於惡臭雨水後的食屍鬼，正啃噬著新鮮的骨殖……',
    nextNodes: ['node_1_0', 'node_1_1'],
  },
  {
    id: 'node_0_1',
    type: 'event',
    layer: 0,
    col: 1,
    label: '秘識奇遇',
    title: '廢棄警亭',
    description: '倒翻的煤油燈、散落的警員巡邏手札，與牆上風乾的鮮血痕跡。',
    nextNodes: ['node_1_1', 'node_1_2'],
  },

  // Layer 1: Exploration & Market (3 nodes)
  {
    id: 'node_1_0',
    type: 'event',
    layer: 1,
    col: 0,
    label: '秘識奇遇',
    title: '淹沒的石龕',
    description: '下水道深處半浸在黑水中的無名石龕，散發著微弱的潮汐腥味。',
    nextNodes: ['node_2_0', 'node_2_1'],
  },
  {
    id: 'node_1_1',
    type: 'combat',
    layer: 1,
    col: 1,
    label: '常規遭遇',
    title: '地下蓄水池',
    description: '兩側滴淌著墨綠黏液，黑暗中傳來骨爪刮擦青石的刺耳聲響。',
    nextNodes: ['node_2_0', 'node_2_1', 'node_2_2'],
  },
  {
    id: 'node_1_2',
    type: 'market',
    layer: 1,
    col: 2,
    label: '黑市商人',
    title: '灰面卡斯楚的暗室',
    description: '戴著鳥嘴面具的古董商在燭光下撥動算盤，櫃檯上擺著禁忌物件。',
    nextNodes: ['node_2_1', 'node_2_2'],
  },

  // Layer 2: Elite & Sanctuary (3 nodes)
  {
    id: 'node_2_0',
    type: 'elite',
    layer: 2,
    col: 0,
    label: '舊日精英',
    title: '浸水地穴',
    description: '深淵浸染的深潛者長老手持珊瑚尖刺，在黑暗中發出沙啞吟誦！',
    nextNodes: ['node_3_0', 'node_3_1'],
  },
  {
    id: 'node_2_1',
    type: 'sanctuary',
    layer: 2,
    col: 1,
    label: '安全避難所',
    title: '守墓人小屋',
    description: '緊扣的鐵門阻擋了外面的瘋狂與腐臭，壁爐的餘火帶來珍貴的寧靜。',
    nextNodes: ['node_3_0', 'node_3_1', 'node_3_2'],
  },
  {
    id: 'node_2_2',
    type: 'event',
    layer: 2,
    col: 2,
    label: '秘識奇遇',
    title: '低語古書店',
    description: '陳列著發黃星圖與禁忌舊書的密室，空氣中充斥著乾燥的霉味。',
    nextNodes: ['node_3_1', 'node_3_2'],
  },

  // Layer 3: Final Preparations (3 nodes)
  {
    id: 'node_3_0',
    type: 'market',
    layer: 3,
    col: 0,
    label: '黑市商人',
    title: '走私者密碼頭',
    description: '潮水拍打著腐朽木棧道，黑市走私者正兜售最後的軍用應急物資。',
    nextNodes: ['node_4_0'],
  },
  {
    id: 'node_3_1',
    type: 'event',
    layer: 3,
    col: 1,
    label: '秘識奇遇',
    title: '療養院禁忌病房',
    description: '軟墊牆上刻滿扭曲的幾何圖騰，彷彿連空氣都被不可名狀的引力撕扯。',
    nextNodes: ['node_4_0'],
  },
  {
    id: 'node_3_2',
    type: 'sanctuary',
    layer: 3,
    col: 2,
    label: '安全避難所',
    title: '聖壇懺悔室',
    description: '遠離異教徒狂亂聲浪的隱秘祈禱室，提供最後的包紮與心智整頓。',
    nextNodes: ['node_4_0'],
  },

  // Layer 4: Culmination / Boss (1 node)
  {
    id: 'node_4_0',
    type: 'boss',
    layer: 4,
    col: 1,
    label: '舊日宿敵',
    title: '無底深淵祭壇',
    description: '祭壇中央的虛空裂隙中，不可名狀的巨大輪廓正在緩緩凝聚……',
    nextNodes: [],
  },
];

/**
 * 產生全新的調查地圖資料結構，初始將 Layer 0 的節點標記為 accessible
 */
export function generateInvestigationMap(): InvestigationMap {
  const nodes: Record<string, MapNode> = {};
  const layersMap: Record<number, string[]> = {};

  for (const raw of BASE_MAP_TEMPLATE) {
    const isEntryLayer = raw.layer === 0;
    nodes[raw.id] = {
      ...raw,
      status: isEntryLayer ? 'accessible' : 'unvisited',
    };

    if (!layersMap[raw.layer]) {
      layersMap[raw.layer] = [];
    }
    layersMap[raw.layer].push(raw.id);
  }

  const sortedLayerKeys = Object.keys(layersMap)
    .map(Number)
    .sort((a, b) => a - b);
  const layers = sortedLayerKeys.map((k) => layersMap[k]);

  return {
    id: 'map_arkham_quarantine_01',
    name: '阿卡姆封鎖區調查圖',
    nodes,
    layers,
    currentNodeId: null,
  };
}
