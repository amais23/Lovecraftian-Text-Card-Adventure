import type { Card, CardCategory } from '../types/game';

export interface CardArtworkInfo {
  artId: string;
  name: string;
  category: CardCategory;
  styleTag: 'cartoon' | 'realistic' | 'fantasy' | 'eldritch' | 'madness';
  styleName: string;
  conceptLore: string;
  imageUrl: string;
}

export const CARD_ARTWORKS_REGISTRY: Record<string, CardArtworkInfo> = {
  // === COMBAT CARDS (Cute Cartoon Style) ===
  card_revolver: {
    artId: 'card_revolver',
    name: '左輪射擊',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '可愛卡通風格 (Cute Cartoon)',
    conceptLore: '圓潤胖嘟嘟的點38左輪槍身，搭配水汪汪萌系大眼與粉紅腮紅，在嚴肅搏殺中展現強烈荒誕黑色幽默。',
    imageUrl: '/cards/card_revolver.webp',
  },
  card_punch: {
    artId: 'card_punch',
    name: '重拳壓制',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '可愛卡通風格 (Cute Cartoon)',
    conceptLore: 'Q版圓滾滾的紅色拳擊大拳套，伴隨漫畫旋轉衝擊速度線與星星撞擊火花。',
    imageUrl: '/cards/card_punch.webp',
  },
  card_bayonet: {
    artId: 'card_bayonet',
    name: '軍刀突刺',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '可愛卡通風格 (Cute Cartoon)',
    conceptLore: '圓臉小兵手持反差極大的巨型閃亮刺刀奮力向前衝鋒，帶有逗趣的汗珠與爆炸氣流。',
    imageUrl: '/cards/card_bayonet.webp',
  },
  card_cane: {
    artId: 'card_cane',
    name: '鉛頭手杖',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '可愛卡通風格 (Cute Cartoon)',
    conceptLore: '優雅的Q版小紳士圓頂黑禮帽，拿著精緻小黑手杖敲擊出眩暈黃金星號與逗趣音符。',
    imageUrl: '/cards/card_cane.webp',
  },
  card_ritual_dagger: {
    artId: 'card_ritual_dagger',
    name: '防身短刀',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '可愛卡通風格 (Cute Cartoon)',
    conceptLore: '銀質短匕首長出一副俏皮可愛微笑，刀刃閃爍著閃亮四角十字星芒。',
    imageUrl: '/cards/card_ritual_dagger.webp',
  },
  card_shotgun: {
    artId: 'card_shotgun',
    name: '雙管獵槍',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '可愛卡通風格 (Cute Cartoon)',
    conceptLore: '粗短誇張的雙管獵槍轟出如爆米花般的大朵煙雲與巨大火球，槍管長出大大的卡通萌眼。',
    imageUrl: '/cards/card_shotgun.webp',
  },
  card_quick_draw: {
    artId: 'card_quick_draw',
    name: '快速拔槍',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '可愛卡通風格 (Cute Cartoon)',
    conceptLore: '神速拔槍的Q版柯基牛仔，在金色速度殘影與火花爆發中迅捷射擊。',
    imageUrl: '/cards/card_quick_draw.webp',
  },

  // === SKILL CARDS (Realistic Style) ===
  card_sedative: {
    artId: 'card_sedative',
    name: '醫療鎮定劑',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '真實寫實風格 (Realistic)',
    conceptLore: '1920年代復古金屬雙指推桿玻璃針筒，內部充盈琥珀色透明鎮定藥劑，針尖凝結晶瑩反光藥滴。',
    imageUrl: '/cards/card_sedative.webp',
  },
  card_cover: {
    artId: 'card_cover',
    name: '就地掩蔽',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '真實寫實風格 (Realistic)',
    conceptLore: '傾倒的沉重厚木長桌作為防衛掩體，橫斷面木紋層次分明，散落著碎木塊與軍用粗麻沙包。',
    imageUrl: '/cards/card_cover.webp',
  },
  card_breathe: {
    artId: 'card_breathe',
    name: '深呼吸',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '真實寫實風格 (Realistic)',
    conceptLore: '寒夜中調查員深吸一口氣吐出的凝結白霧蒸氣，以溫暖的煤油燈光襯托肉體的生存意志。',
    imageUrl: '/cards/card_breathe.png',
  },
  card_astral_ward: {
    artId: 'card_astral_ward',
    name: '星界庇護',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '真實寫實風格 (Realistic)',
    conceptLore: '黃銅渾天儀與精密星盤刻度所投影出的幾何星軌防護罩，展現嚴謹客觀的幾何力場。',
    imageUrl: '/cards/card_astral_ward.png',
  },
  card_meditate: {
    artId: 'card_meditate',
    name: '心靈冥想',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '真實寫實風格 (Realistic)',
    conceptLore: '紅木書桌前搖曳的單盞溫暖燭火，在深邃黑暗中為理性思緒構築最後的避風港。',
    imageUrl: '/cards/card_meditate.png',
  },
  card_tactical_roll: {
    artId: 'card_tactical_roll',
    name: '戰術翻滾',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '真實寫實風格 (Realistic)',
    conceptLore: '軍用厚皮革戰術靴在戰壕泥濘與碎石間翻滾尋求反擊角度，碎石揚塵極具臨場感。',
    imageUrl: '/cards/card_tactical_roll.png',
  },
  card_ancient_amulet: {
    artId: 'card_ancient_amulet',
    name: '遠古護身符',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '真實寫實風格 (Realistic)',
    conceptLore: '青銅飾牌覆蓋著深綠色氧化包漿，細膩雕刻著舊印古老紋路，散發冰涼冷光。',
    imageUrl: '/cards/card_ancient_amulet.png',
  },
  card_first_aid: {
    artId: 'card_first_aid',
    name: '應急急救包',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '真實寫實風格 (Realistic)',
    conceptLore: '軍用卡其帆布急救包與白底紅十字標章，隨附棉質止血繃帶與防腐碘酒藥瓶。',
    imageUrl: '/cards/card_first_aid.png',
  },

  // === MAGIC CARDS (Sunny High Fantasy Style) ===
  card_magic_blast: {
    artId: 'card_magic_blast',
    name: '靈能衝擊',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '陽光奇幻風格 (Sunny High Fantasy)',
    conceptLore: '明媚金色日光照耀下的旋轉紫晶法陣爆發，七彩魔導星軌向外擴散，環繞跳動的金色魔力火花。',
    imageUrl: '/cards/card_magic_blast.webp',
  },
  card_magic_gaze: {
    artId: 'card_magic_gaze',
    name: '厄運凝視',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '陽光奇幻風格 (Sunny High Fantasy)',
    conceptLore: '陽光奇幻風格的剔透紫水晶靈魂寶珠，周圍漂浮著柔和的粉紫童話星辰光屑。',
    imageUrl: '/cards/card_magic_gaze.png',
  },
  card_void_fire: {
    artId: 'card_void_fire',
    name: '虛空烈焰',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '陽光奇幻風格 (Sunny High Fantasy)',
    conceptLore: '璀璨紫金冷火精靈歡快跳躍，日冕般炫目的光芒將黑暗完全驅散。',
    imageUrl: '/cards/card_void_fire.png',
  },
  card_dread_whisper: {
    artId: 'card_dread_whisper',
    name: '恐懼低語',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '陽光奇幻風格 (Sunny High Fantasy)',
    conceptLore: '明麗紫色光譜中的琉璃音波同心漣漪，宛如仙境微光羽毛撫過心靈。',
    imageUrl: '/cards/card_dread_whisper.png',
  },

  // === TRUTH CARDS (Cosmic Horror Style) ===
  card_truth_fragment: {
    artId: 'card_truth_fragment',
    name: '舊日殘頁',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日天啟宇宙恐懼 (Cosmic Horror)',
    conceptLore: '深邃冰冷的多維星空中，漂浮著發光羊皮禁書殘頁，背景若隱若現巨大的星穹神性天眼。',
    imageUrl: '/cards/card_truth_fragment.webp',
  },
  card_silver_key: {
    artId: 'card_silver_key',
    name: '銀鑰儀式',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日天啟宇宙恐懼 (Cosmic Horror)',
    conceptLore: '懸浮於超維度時空門前的銀白雕花古匙，周圍環繞著冰冷深邃的星系幾何旋轉軌道。',
    imageUrl: '/cards/card_silver_key.png',
  },
  card_truth_glimmer: {
    artId: 'card_truth_glimmer',
    name: '真相微光',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日天啟宇宙恐懼 (Cosmic Horror)',
    conceptLore: '漆黑虛空深處，冰冷崇高的巨型天眼投下一道純銀冷光直刺心靈深處。',
    imageUrl: '/cards/card_truth_glimmer.png',
  },
  card_astral_insight: {
    artId: 'card_astral_insight',
    name: '星界洞察',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日天啟宇宙恐懼 (Cosmic Horror)',
    conceptLore: '無垠星穹的非歐幾何同心天球網格，凡人渺小目光仰望浩瀚宇宙的真理秩序。',
    imageUrl: '/cards/card_astral_insight.png',
  },
  card_deep_truth: {
    artId: 'card_deep_truth',
    name: '深潛者手札',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日天啟宇宙恐懼 (Cosmic Horror)',
    conceptLore: '拉萊耶海底沉淪的黑玄武岩巨石板，鐫刻著閃爍幽藍磷光的深海非人物語。',
    imageUrl: '/cards/card_deep_truth.png',
  },
  card_breakwater: {
    artId: 'card_breakwater',
    name: '心智防波堤',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日天啟宇宙恐懼 (Cosmic Horror)',
    conceptLore: '神聖崇高的銀白天體光壁長城，在星穹邊緣抵禦不可名狀的舊日浪潮。',
    imageUrl: '/cards/card_breakwater.png',
  },

  // === MADNESS CARDS (Visceral Abyss Style) ===
  card_blind_claw: {
    artId: 'card_blind_claw',
    name: '盲目爪擊',
    category: 'madness',
    styleTag: 'madness',
    styleName: '混亂扭曲血肉異變 (Visceral Abyss)',
    conceptLore: '異化皮肉崩解長出的黑色畸變利爪，撕裂虛空釋放灼熱狂亂血痕，滴落混沌深淵濁血。',
    imageUrl: '/cards/card_blind_claw.webp',
  },
  card_abyssal_howl: {
    artId: 'card_abyssal_howl',
    name: '深淵狂嘯',
    category: 'madness',
    styleTag: 'madness',
    styleName: '混亂扭曲血肉異變 (Visceral Abyss)',
    conceptLore: '扭曲瘋狂的深淵森白巨口，獠牙參差交錯，噴湧出混沌漆黑的理智崩解衝擊波。',
    imageUrl: '/cards/card_abyssal_howl.png',
  },
  card_frenzy_blade: {
    artId: 'card_frenzy_blade',
    name: '狂亂血刃',
    category: 'madness',
    styleTag: 'madness',
    styleName: '混亂扭曲血肉異變 (Visceral Abyss)',
    conceptLore: '血肉筋膜與黑曜石深淵金屬共生熔鑄的魔刃，刀脊滴落著沸騰狂暴的深紫血液。',
    imageUrl: '/cards/card_frenzy_blade.png',
  },
};

/**
 * All 28 unique card artworks list for Compendium
 */
export const ALL_CARD_ARTWORKS: CardArtworkInfo[] = Object.values(CARD_ARTWORKS_REGISTRY);

// Fast static lookup indexes for O(1) performance
const ARTWORKS_BY_NAME = new Map<string, CardArtworkInfo>(
  ALL_CARD_ARTWORKS.map((art) => [art.name, art])
);

// Aliases for card variants (e.g. black market goods and narrative derivatives)
const CARD_NAME_ALIASES: Record<string, string> = {
  '戰壕雙管獵槍': '雙管獵槍',
  '遠古青銅護身符': '遠古護身符',
  '心智防波堤手稿': '心智防波堤',
  '軍用嗎啡注射劑': '醫療鎮定劑',
  '高純度酒精繃帶': '應急急救包',
};

const ARTWORKS_BY_ID_SUBSTRING: [string, CardArtworkInfo][] = Object.entries(CARD_ARTWORKS_REGISTRY).map(
  ([key, art]) => [key.replace('card_', ''), art]
);

const ID_TOKEN_ALIASES: [string, CardArtworkInfo][] = [
  ['morphine', CARD_ARTWORKS_REGISTRY.card_sedative],
  ['gauze', CARD_ARTWORKS_REGISTRY.card_first_aid],
  ['amulet', CARD_ARTWORKS_REGISTRY.card_ancient_amulet],
];

const CATEGORY_FALLBACKS: Record<CardCategory, CardArtworkInfo> = {
  combat: CARD_ARTWORKS_REGISTRY.card_revolver,
  skill: CARD_ARTWORKS_REGISTRY.card_cover,
  magic: CARD_ARTWORKS_REGISTRY.card_magic_blast,
  truth: CARD_ARTWORKS_REGISTRY.card_truth_fragment,
  madness: CARD_ARTWORKS_REGISTRY.card_blind_claw,
};

/**
 * Helper to get the canonical artwork for any card based on its name or ID.
 * Optimized with static Map and pre-indexed tokens for O(1) retrieval.
 */
export function getCardArtwork(card: Card | { name: string; category?: CardCategory; id?: string }): CardArtworkInfo {
  // First attempt: match by exact name
  const byName = ARTWORKS_BY_NAME.get(card.name);
  if (byName) {
    return byName;
  }

  // Second attempt: match by name alias
  const aliasName = CARD_NAME_ALIASES[card.name];
  if (aliasName) {
    const byAlias = ARTWORKS_BY_NAME.get(aliasName);
    if (byAlias) {
      return byAlias;
    }
  }

  // Third attempt: match by card id substring
  if (card.id) {
    for (let i = 0; i < ARTWORKS_BY_ID_SUBSTRING.length; i++) {
      const [token, art] = ARTWORKS_BY_ID_SUBSTRING[i];
      if (card.id.includes(token)) {
        return art;
      }
    }
    for (let i = 0; i < ID_TOKEN_ALIASES.length; i++) {
      const [token, art] = ID_TOKEN_ALIASES[i];
      if (card.id.includes(token)) {
        return art;
      }
    }
  }

  // Fallback based on category
  const category = card.category ?? 'combat';
  return CATEGORY_FALLBACKS[category] ?? CARD_ARTWORKS_REGISTRY.card_revolver;
}
