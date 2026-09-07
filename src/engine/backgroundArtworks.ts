export interface BackgroundArtworkInfo {
  id: string;
  name: string;
  category: 'menu' | 'map' | 'combat';
  depth?: number;
  imageUrl: string;
  description: string;
}

export interface OccupationPortraitInfo {
  occupationId: 'investigator' | 'occultist';
  name: string;
  occupation: string;
  portraitUrl: string;
  conceptLore: string;
}

export const BACKGROUND_ARTWORKS: Record<string, BackgroundArtworkInfo> = {
  title_menu: {
    id: 'title_menu',
    name: '阿卡姆雨夜街頭',
    category: 'menu',
    imageUrl: '/backgrounds/bg_title_menu.webp',
    description: '1920年代阿卡姆雨夜街頭，煤氣路燈、哥德式建築與隱晦克蘇魯暗紫綠微光。',
  },
  map_desk: {
    id: 'map_desk',
    name: '阿卡姆調查案頭古地圖',
    category: 'map',
    imageUrl: '/backgrounds/bg_map_desk.webp',
    description: '偵探案頭上的復古羊皮紙密檔、泛黃阿卡姆手繪地圖、老舊黃銅羅盤與墨水污漬。',
  },
  combat_depth1: {
    id: 'combat_depth1',
    name: '阿卡姆封鎖區',
    category: 'combat',
    depth: 1,
    imageUrl: '/backgrounds/bg_combat_depth1.webp',
    description: '第一深度：雨夜濕漉石板路、警用路障、破損磚牆與鐵絲網，修格斯幼體潛伏之暗巷。',
  },
  combat_depth2: {
    id: 'combat_depth2',
    name: '深潛者海蝕迷宮',
    category: 'combat',
    depth: 2,
    imageUrl: '/backgrounds/bg_combat_depth2.webp',
    description: '第二深度：潮濕陰森的海蝕洞窟、怪異礁石與深潛者出沒之暗湧水道。',
  },
  combat_depth3: {
    id: 'combat_depth3',
    name: '無底深淵祭壇',
    category: 'combat',
    depth: 3,
    imageUrl: '/backgrounds/bg_combat_depth3.webp',
    description: '第三深度：黑曜石巨石陣列、幽暗符文刻印與翻騰虛空能量之祭壇。',
  },
  combat_depth4: {
    id: 'combat_depth4',
    name: '星辰正位 · 拉萊耶核心',
    category: 'combat',
    depth: 4,
    imageUrl: '/backgrounds/bg_combat_depth4.webp',
    description: '第四深度：非歐幾何巨型巨石建築、倒懸的宇宙星門與終極決戰場。',
  },
};

export const OCCUPATION_PORTRAITS: Record<'investigator' | 'occultist', OccupationPortraitInfo> = {
  investigator: {
    occupationId: 'investigator',
    name: '愛德華·皮爾斯',
    occupation: '私家偵探',
    portraitUrl: '/occupations/portrait_investigator.webp',
    conceptLore: '身著磨損風衣與軟呢帽，雨夜中緊握點38左輪的硬漢偵探。',
  },
  occultist: {
    occupationId: 'occultist',
    name: '艾蓮諾·凡斯',
    occupation: '秘術學者',
    portraitUrl: '/occupations/portrait_occultist.webp',
    conceptLore: '佩戴金絲眼鏡，手捧散發微光古代殘典的密斯卡托尼克大學典雅學者。',
  },
};

/**
 * 依據當前調查深度 (Depth 1~4) 取得對應戰鬥背景圖片路徑
 */
export function getCombatBackground(depth: number = 1): string {
  const normalizedDepth = Math.max(1, Math.min(4, Math.floor(depth || 1)));
  const key = `combat_depth${normalizedDepth}`;
  return BACKGROUND_ARTWORKS[key]?.imageUrl ?? BACKGROUND_ARTWORKS.combat_depth1.imageUrl;
}

/**
 * 依據職業 ID 取得專屬肖像立繪路徑
 */
export function getOccupationPortrait(occupationId: string): string {
  if (occupationId === 'occultist') {
    return OCCUPATION_PORTRAITS.occultist.portraitUrl;
  }
  return OCCUPATION_PORTRAITS.investigator.portraitUrl;
}
