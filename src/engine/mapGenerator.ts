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

export interface MapGenerationOptions {
  seed?: number;
  randomFn?: () => number;
  procedural?: boolean;
}

const THEME_POOLS: Record<
  MapNodeType,
  { label: string; variants: Array<{ title: string; desc: string }> }
> = {
  combat: {
    label: '常規遭遇',
    variants: [
      { title: '陰暗小巷', desc: '潛伏於惡臭雨水後的食屍鬼，正啃噬著新鮮的骨殖……' },
      { title: '地下蓄水池', desc: '兩側滴淌著墨綠黏液，黑暗中傳來骨爪刮擦青石的刺耳聲響。' },
      { title: '迷霧屠宰場', desc: '生鏽的鐵鉤在風中搖晃，嗜血的異形正在血窪中伺機而動。' },
      { title: '廢棄倉庫', desc: '陰冷的海風穿堂而過，腐木箱後傳來濕黏的摩擦聲。' },
    ],
  },
  elite: {
    label: '舊日精英',
    variants: [
      { title: '浸水地穴', desc: '深淵浸染的深潛者長老手持珊瑚尖刺，在黑暗中發出沙啞吟誦！' },
      { title: '詛咒鐘樓', desc: '狂亂的鐘聲震盪心靈，舊日僕從正展開黑曜石般的巨翼！' },
    ],
  },
  event: {
    label: '秘識奇遇',
    variants: [
      { title: '廢棄警亭', desc: '倒翻的煤油燈、散落的警員巡邏手札，與牆上風乾的痕跡。' },
      { title: '淹沒的石龕', desc: '下水道深處半浸在黑水中的無名石龕，散發著微弱的潮汐腥味。' },
      { title: '低語古書店', desc: '陳列著發黃星圖與禁忌舊書的密室，空氣中充斥著乾燥的霉味。' },
      { title: '療養院禁忌病房', desc: '軟墊牆上刻滿扭曲的幾何圖騰，彷彿連空氣都被不可名狀的引力撕扯。' },
    ],
  },
  sanctuary: {
    label: '安全避難所',
    variants: [
      { title: '守墓人小屋', desc: '緊扣的鐵門阻擋了外面的瘋狂與腐臭，壁爐的餘火帶來珍貴的寧靜。' },
      { title: '聖壇懺悔室', desc: '遠離異教徒狂亂聲浪的隱秘祈禱室，提供最後的包紮與心智整頓。' },
      { title: '舊船塢避雨棚', desc: '堅實的防水帆布阻隔了腐蝕酸雨，提供片刻安歇與急救。' },
    ],
  },
  market: {
    label: '黑市商人',
    variants: [
      { title: '灰面卡斯楚的暗室', desc: '戴著鳥嘴面具的古董商在燭光下撥動算盤，櫃檯上擺著禁忌物件。' },
      { title: '走私者密碼頭', desc: '潮水拍打著腐朽木棧道，黑市走私者正兜售最後的軍用應急物資。' },
      { title: '鐘錶匠的密閣', desc: '滴答作響的奇異機械之間，黑市商人展示著來自海外的特殊護符。' },
    ],
  },
  boss: {
    label: '舊日宿敵',
    variants: [
      { title: '無底深淵祭壇', desc: '祭壇中央的虛空裂隙中，不可名狀的巨大輪廓正在緩緩凝聚……' },
    ],
  },
};

function createPrng(seed: number): () => number {
  let s = Math.abs(seed) % 2147483647;
  if (s <= 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 隨機程序化生成調查地圖（Procedural DAG Generation）
 * 保證多分支拓撲健全度：Layer 0 為入口節點、Layer 4 為宿敵節點，中繼層保證所有路徑皆可通達終點。
 */
export function generateProceduralInvestigationMap(options?: MapGenerationOptions): InvestigationMap {
  const rng = options?.randomFn ?? (options?.seed !== undefined ? createPrng(options.seed) : Math.random);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  // 定義 5 層結構之候選型態分布
  const layerTypePools: MapNodeType[][] = [
    // Layer 0 (2 nodes: entry points)
    rng() > 0.5 ? ['combat', 'event'] : ['event', 'combat'],
    // Layer 1 (3 nodes: exploration)
    pick([
      ['event', 'combat', 'market'],
      ['combat', 'event', 'market'],
      ['event', 'event', 'combat'],
    ]),
    // Layer 2 (3 nodes: danger & refuge)
    pick([
      ['elite', 'sanctuary', 'event'],
      ['event', 'sanctuary', 'elite'],
      ['elite', 'event', 'market'],
    ]),
    // Layer 3 (3 nodes: final preparations)
    pick([
      ['market', 'event', 'sanctuary'],
      ['sanctuary', 'elite', 'market'],
      ['market', 'combat', 'sanctuary'],
    ]),
    // Layer 4 (1 node: boss)
    ['boss'],
  ];

  // 連接規則拓撲（保證所有分支連通無死路，封裝為結構化層級拓撲規則）
  interface LayerAdjacencyRule {
    layer: number;
    outgoingEdgesByCol: string[][];
  }

  const LAYER_TOPOLOGY_RULES: LayerAdjacencyRule[] = [
    // Layer 0 -> Layer 1
    {
      layer: 0,
      outgoingEdgesByCol: [['node_1_0', 'node_1_1'], ['node_1_1', 'node_1_2']],
    },
    // Layer 1 -> Layer 2
    {
      layer: 1,
      outgoingEdgesByCol: [['node_2_0', 'node_2_1'], ['node_2_0', 'node_2_1', 'node_2_2'], ['node_2_1', 'node_2_2']],
    },
    // Layer 2 -> Layer 3
    {
      layer: 2,
      outgoingEdgesByCol: [['node_3_0', 'node_3_1'], ['node_3_0', 'node_3_1', 'node_3_2'], ['node_3_1', 'node_3_2']],
    },
    // Layer 3 -> Layer 4
    {
      layer: 3,
      outgoingEdgesByCol: [['node_4_0'], ['node_4_0'], ['node_4_0']],
    },
    // Layer 4 (Boss node has no outgoing edges)
    {
      layer: 4,
      outgoingEdgesByCol: [[]],
    },
  ];

  const nodes: Record<string, MapNode> = {};
  const layers: string[][] = [];

  for (let l = 0; l < layerTypePools.length; l++) {
    const layerNodeIds: string[] = [];
    const count = layerTypePools[l].length;

    for (let c = 0; c < count; c++) {
      const nodeId = `node_${l}_${c}`;
      layerNodeIds.push(nodeId);
      const nodeType = layerTypePools[l][c];
      const theme = THEME_POOLS[nodeType];
      const variant = pick(theme.variants);
      const nextNodes = LAYER_TOPOLOGY_RULES[l]?.outgoingEdgesByCol[c] ?? [];

      nodes[nodeId] = {
        id: nodeId,
        type: nodeType,
        layer: l,
        col: c,
        label: theme.label,
        title: variant.title,
        description: variant.desc,
        nextNodes,
        status: l === 0 ? 'accessible' : 'unvisited',
      };
    }
    layers.push(layerNodeIds);
  }

  return {
    id: `map_arkham_${Math.floor(rng() * 1000000)}`,
    name: '阿卡姆封鎖區調查圖（隨機生成）',
    nodes,
    layers,
    currentNodeId: null,
  };
}

/**
 * 產生調查地圖資料結構
 * - 預設回傳穩定之基底範本（確保測試與單元驗收 100% 重現）
 * - 若指定 options.procedural 為 true，則進行動態隨機程序化生成
 */
export function generateInvestigationMap(options?: MapGenerationOptions): InvestigationMap {
  if (options?.procedural) {
    return generateProceduralInvestigationMap(options);
  }

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
