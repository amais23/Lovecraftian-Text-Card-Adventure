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
    styleName: '實體武器',
    conceptLore: '圓潤胖嘟嘟的點38左輪槍身，搭配水汪汪萌系大眼與粉紅腮紅，在嚴肅搏殺中展現強烈荒誕黑色幽默。',
    imageUrl: '/cards/combat/card_revolver.webp',
  },
  card_punch: {
    artId: 'card_punch',
    name: '重拳壓制',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: 'Q版圓滾滾的紅色拳擊大拳套，伴隨漫畫旋轉衝擊速度線與星星撞擊火花。',
    imageUrl: '/cards/combat/card_punch.webp',
  },
  card_bayonet: {
    artId: 'card_bayonet',
    name: '軍刀突刺',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: '圓臉小兵手持反差極大的巨型閃亮刺刀奮力向前衝鋒，帶有逗趣的汗珠與爆炸氣流。',
    imageUrl: '/cards/combat/card_bayonet.webp',
  },
  card_cane: {
    artId: 'card_cane',
    name: '鉛頭手杖',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: '優雅的Q版小紳士圓頂黑禮帽，拿著精緻小黑手杖敲擊出眩暈黃金星號與逗趣音符。',
    imageUrl: '/cards/combat/card_cane.webp',
  },
  card_ritual_dagger: {
    artId: 'card_ritual_dagger',
    name: '防身短刀',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: '銀質短匕首長出一副俏皮可愛微笑，刀刃閃爍著閃亮四角十字星芒。',
    imageUrl: '/cards/combat/card_ritual_dagger.webp',
  },
  card_shotgun: {
    artId: 'card_shotgun',
    name: '雙管獵槍',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: '粗短誇張的雙管獵槍轟出如爆米花般的大朵煙雲與巨大火球，槍管長出大大的卡通萌眼。',
    imageUrl: '/cards/combat/card_shotgun.webp',
  },
  card_quick_draw: {
    artId: 'card_quick_draw',
    name: '快速拔槍',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: '神速拔槍的Q版柯基牛仔，在金色速度殘影與火花爆發中迅捷射擊。',
    imageUrl: '/cards/combat/card_quick_draw.webp',
  },

  // === SKILL CARDS (Realistic Style) ===
  card_sedative: {
    artId: 'card_sedative',
    name: '醫療鎮定劑',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '1920年代復古金屬雙指推桿玻璃針筒，內部充盈琥珀色透明鎮定藥劑，針尖凝結晶瑩反光藥滴。',
    imageUrl: '/cards/skill/card_sedative.webp',
  },
  card_cover: {
    artId: 'card_cover',
    name: '就地掩蔽',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '傾倒的沉重厚木長桌作為防衛掩體，橫斷面木紋層次分明，散落著碎木塊與軍用粗麻沙包。',
    imageUrl: '/cards/skill/card_cover.webp',
  },
  card_breathe: {
    artId: 'card_breathe',
    name: '深呼吸',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '寒夜中調查員深吸一口氣吐出的凝結白霧蒸氣，以溫暖的煤油燈光襯托肉體的生存意志。',
    imageUrl: '/cards/skill/card_breathe.png',
  },
  card_astral_ward: {
    artId: 'card_astral_ward',
    name: '星界庇護',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '黃銅渾天儀與精密星盤刻度所投影出的幾何星軌防護罩，展現嚴謹客觀的幾何力場。',
    imageUrl: '/cards/skill/card_astral_ward.png',
  },
  card_meditate: {
    artId: 'card_meditate',
    name: '心靈冥想',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '紅木書桌前搖曳的單盞溫暖燭火，在深邃黑暗中為理性思緒構築最後的避風港。',
    imageUrl: '/cards/skill/card_meditate.png',
  },
  card_tactical_roll: {
    artId: 'card_tactical_roll',
    name: '戰術翻滾',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '軍用厚皮革戰術靴在戰壕泥濘與碎石間翻滾尋求反擊角度，碎石揚塵極具臨場感。',
    imageUrl: '/cards/skill/card_tactical_roll.png',
  },
  card_ancient_amulet: {
    artId: 'card_ancient_amulet',
    name: '遠古護身符',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '青銅飾牌覆蓋著深綠色氧化包漿，細膩雕刻著舊印古老紋路，散發冰涼冷光。',
    imageUrl: '/cards/skill/card_ancient_amulet.png',
  },
  card_first_aid: {
    artId: 'card_first_aid',
    name: '應急急救包',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '軍用卡其帆布急救包與白底紅十字標章，隨附棉質止血繃帶與防腐碘酒藥瓶。',
    imageUrl: '/cards/skill/card_first_aid.png',
  },

  // === MAGIC CARDS (Sunny High Fantasy Style) ===
  card_magic_blast: {
    artId: 'card_magic_blast',
    name: '靈能衝擊',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法',
    conceptLore: '明媚金色日光照耀下的旋轉紫晶法陣爆發，七彩魔導星軌向外擴散，環繞跳動的金色魔力火花。',
    imageUrl: '/cards/magic/card_magic_blast.webp',
  },
  card_magic_gaze: {
    artId: 'card_magic_gaze',
    name: '厄運凝視',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法',
    conceptLore: '陽光奇幻風格的剔透紫水晶靈魂寶珠，周圍漂浮著柔和的粉紫童話星辰光屑。',
    imageUrl: '/cards/magic/card_magic_gaze.png',
  },
  card_void_fire: {
    artId: 'card_void_fire',
    name: '虛空烈焰',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法',
    conceptLore: '璀璨紫金冷火精靈歡快跳躍，日冕般炫目的光芒將黑暗完全驅散。',
    imageUrl: '/cards/magic/card_void_fire.png',
  },
  card_dread_whisper: {
    artId: 'card_dread_whisper',
    name: '恐懼低語',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法',
    conceptLore: '明麗紫色光譜中的琉璃音波同心漣漪，宛如仙境微光羽毛撫過心靈。',
    imageUrl: '/cards/magic/card_dread_whisper.png',
  },

  // === TRUTH CARDS (Cosmic Horror Style) ===
  card_truth_fragment: {
    artId: 'card_truth_fragment',
    name: '舊日殘頁',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示',
    conceptLore: '深邃冰冷的多維星空中，漂浮著發光羊皮禁書殘頁，背景若隱若現巨大的星穹神性天眼。',
    imageUrl: '/cards/truth/card_truth_fragment.webp',
  },
  card_silver_key: {
    artId: 'card_silver_key',
    name: '銀鑰儀式',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示',
    conceptLore: '懸浮於超維度時空門前的銀白雕花古匙，周圍環繞著冰冷深邃的星系幾何旋轉軌道。',
    imageUrl: '/cards/truth/card_silver_key.png',
  },
  card_truth_glimmer: {
    artId: 'card_truth_glimmer',
    name: '真相微光',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示',
    conceptLore: '漆黑虛空深處，冰冷崇高的巨型天眼投下一道純銀冷光直刺心靈深處。',
    imageUrl: '/cards/truth/card_truth_glimmer.png',
  },
  card_astral_insight: {
    artId: 'card_astral_insight',
    name: '星界洞察',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示',
    conceptLore: '無垠星穹的非歐幾何同心天球網格，凡人渺小目光仰望浩瀚宇宙的真理秩序。',
    imageUrl: '/cards/truth/card_astral_insight.png',
  },
  card_deep_truth: {
    artId: 'card_deep_truth',
    name: '深潛者手札',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示',
    conceptLore: '拉萊耶海底沉淪的黑玄武岩巨石板，鐫刻著閃爍幽藍磷光的深海非人物語。',
    imageUrl: '/cards/truth/card_deep_truth.png',
  },
  card_breakwater: {
    artId: 'card_breakwater',
    name: '心智防波堤',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示',
    conceptLore: '神聖崇高的銀白天體光壁長城，在星穹邊緣抵禦不可名狀的舊日浪潮。',
    imageUrl: '/cards/truth/card_breakwater.png',
  },

  // === MADNESS CARDS (Visceral Abyss Style) ===
  card_blind_claw: {
    artId: 'card_blind_claw',
    name: '盲目爪擊',
    category: 'madness',
    styleTag: 'madness',
    styleName: '深淵異化',
    conceptLore: '異化皮肉崩解長出的黑色畸變利爪，撕裂虛空釋放灼熱狂亂血痕，滴落混沌深淵濁血。',
    imageUrl: '/cards/madness/card_blind_claw.webp',
  },
  card_abyssal_howl: {
    artId: 'card_abyssal_howl',
    name: '深淵狂嘯',
    category: 'madness',
    styleTag: 'madness',
    styleName: '深淵異化',
    conceptLore: '扭曲瘋狂的深淵森白巨口，獠牙參差交錯，噴湧出混沌漆黑的理智崩解衝擊波。',
    imageUrl: '/cards/madness/card_abyssal_howl.png',
  },
  card_frenzy_blade: {
    artId: 'card_frenzy_blade',
    name: '狂亂血刃',
    category: 'madness',
    styleTag: 'madness',
    styleName: '深淵異化',
    conceptLore: '血肉筋膜與黑曜石深淵金屬共生熔鑄的魔刃，刀脊滴落著沸騰狂暴的深紫血液。',
    imageUrl: '/cards/madness/card_frenzy_blade.png',
  },

  // === TIER 4+ EXCLUSIVE BOSS CARDS (ADR-0017) ===
  card_tier4_god_slayer: {
    artId: 'card_tier4_god_slayer',
    name: '屠神裁決爆轟',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器 · 弒神巨砲',
    conceptLore: 'Q版誇張度破表的金色重砲轟出舊印核爆蘑菇雲，舊日觸手驚恐退散，黑色幽默巔峰。',
    imageUrl: '/cards/combat/card_god_slayer.png',
  },
  card_tier4_elder_aegis: {
    artId: 'card_tier4_elder_aegis',
    name: '舊神庇護之陣',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝 · 舊神聖域',
    conceptLore: '純銀渾天儀與古老玄武岩舊印石柱投影出神聖五芒力場，深淵污穢如初雪消融。',
    imageUrl: '/cards/skill/card_elder_aegis.png',
  },
  card_tier4_void_annihilation: {
    artId: 'card_tier4_void_annihilation',
    name: '超維虛空湮滅',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法 · 虛空超新星',
    conceptLore: '陽光奇幻風格的七彩超新星大爆發，絢麗耀眼的彩虹稜鏡魔導光束將深淵異質蒸發殆盡。',
    imageUrl: '/cards/magic/card_void_annihilation.png',
  },
  card_tier4_astral_revelation: {
    artId: 'card_tier4_astral_revelation',
    name: '源初星辰啟示',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 群星共振',
    conceptLore: '超維度萬千幾何星軌正位共振，純銀神性天眼投下貫穿所有維度的終極真理之光。',
    imageUrl: '/cards/truth/card_astral_revelation.png',
  },

  // === TIER 3 MASTER CARDS ===
  card_tier3_dum_dum: {
    artId: 'card_tier3_dum_dum',
    name: '達姆高爆彈連射',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器 · 特製達姆彈',
    conceptLore: '可愛卡通風的特製達姆高爆彈連鎖齊射，引發連環星芒火花與爆裂衝擊波。',
    imageUrl: '/cards/combat/card_dum_dum.png',
  },
  card_tier3_demolition_pack: {
    artId: 'card_tier3_demolition_pack',
    name: '軍用特種炸藥包',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器 · 特種炸藥包',
    conceptLore: 'Q版軍用高爆炸藥背包燃起引線，爆發出排山倒海的烈焰衝擊波與飛濺碎石。',
    imageUrl: '/cards/combat/card_demolition_pack.png',
  },
  card_tier3_impenetrable_bastion: {
    artId: 'card_tier3_impenetrable_bastion',
    name: '不可侵犯之壁',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝 · 鋼鐵堡壘',
    conceptLore: '真實寫實風格的軍用重裝鋼板防線與沙包工事，在漆黑霧氣與異域風暴中固若金湯。',
    imageUrl: '/cards/skill/card_impenetrable_bastion.png',
  },
};

/**
 * All unique card artworks list for Compendium (28 base cards + 4 Tier 4+ boss exclusive + 3 Tier 3 completed cards)
 */
export const ALL_CARD_ARTWORKS: CardArtworkInfo[] = Object.values(CARD_ARTWORKS_REGISTRY);

/**
 * Standard Lovecraftian Parchment WIP Placeholder for cards whose dedicated artwork is in progress.
 */
export const WIP_CARD_ARTWORK: CardArtworkInfo = {
  artId: 'card_wip_placeholder',
  name: '還沒畫好',
  category: 'truth',
  styleTag: 'eldritch',
  styleName: '繪卷繪製中',
  conceptLore: '密契學者正於阿卡姆手抄館探詢原典，太古殘卷待勘，繪卷繪製中 (WIP)。',
  imageUrl: '/cards/card_wip_placeholder.svg',
};

/**
 * Cards currently pending dedicated illustrations (Tier 2 & remaining Tier 3)
 */
export const WIP_TIERED_CARD_NAMES = new Set<string>([
  // Tier 2 Cards
  '泵動式散彈槍',
  '破魔銀質短刃',
  '鋼鐵意志屏障',
  '戰地快速縫合',
  '深海冰霜之握',
  '心靈震波',
  '禁忌海蝕石板殘卷',
  '銀鑰指引微光',

  // Remaining Tier 3 Cards
  '極限精神錨定',
  '虛空黑洞坍縮',
  '深淵靈能撕裂',
  '拉萊耶原典啟示',
  '超維星辰共鳴',
]);

// Fast static lookup indexes for O(1) performance
const ARTWORKS_BY_NAME = new Map<string, CardArtworkInfo>(
  ALL_CARD_ARTWORKS.map((art) => [art.name, art])
);

// Aliases for card variants (e.g. black market narrative goods)
export const CARD_NAME_ALIASES: Record<string, string> = {
  // Market goods variants
  '戰壕雙管獵槍': '雙管獵槍',
  '遠古青銅護身符': '遠古護身符',
  '心智防波堤手稿': '心智防波堤',
  '軍用嗎啡注射劑': '醫療鎮定劑',
  '高純度酒精繃帶': '應急急救包',
  '高級戰地醫療箱': '應急急救包',
  '深海抗逆血清': '醫療鎮定劑',
  '禁忌復甦針劑': '醫療鎮定劑',
  '聖所聖水金樽': '遠古護身符',
};

interface TokenArtworkPattern {
  token: string;
  pattern: RegExp;
  artwork: CardArtworkInfo;
}

/**
 * Pre-compiled segment boundary regexes for canonical card ID tokens.
 * Matches identifiers delimited by underscores or hyphens (e.g. 'card_market_shotgun' or 'card_revolver_1'),
 * preventing accidental substring collisions (e.g. 'cover' matching 'card_discover_clue').
 */
const ARTWORKS_BY_ID_TOKENS: TokenArtworkPattern[] = Object.entries(CARD_ARTWORKS_REGISTRY).map(
  ([key, art]) => {
    const token = key.replace(/^card_/, '');
    return {
      token,
      pattern: new RegExp(`(?:^|[_-])${token}(?:[_-]|\\d+|$)`, 'i'),
      artwork: art,
    };
  }
);

const ID_TOKEN_ALIAS_PATTERNS: TokenArtworkPattern[] = [
  { token: 'morphine', pattern: /(?:^|[_-])morphine(?:[_-]|\d+|$)/i, artwork: CARD_ARTWORKS_REGISTRY.card_sedative },
  { token: 'gauze', pattern: /(?:^|[_-])gauze(?:[_-]|\d+|$)/i, artwork: CARD_ARTWORKS_REGISTRY.card_first_aid },
  { token: 'amulet', pattern: /(?:^|[_-])amulet(?:[_-]|\d+|$)/i, artwork: CARD_ARTWORKS_REGISTRY.card_ancient_amulet },
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

  // Second attempt: check if card is a WIP tiered card awaiting dedicated artwork
  if (WIP_TIERED_CARD_NAMES.has(card.name)) {
    return {
      ...WIP_CARD_ARTWORK,
      name: card.name,
      category: card.category ?? 'combat',
    };
  }

  // Third attempt: match by name alias
  const aliasName = CARD_NAME_ALIASES[card.name];
  if (aliasName) {
    const byAlias = ARTWORKS_BY_NAME.get(aliasName);
    if (byAlias) {
      return byAlias;
    }
  }

  // Third attempt: match by card id token with segment boundary protection
  if (card.id) {
    for (let i = 0; i < ARTWORKS_BY_ID_TOKENS.length; i++) {
      if (ARTWORKS_BY_ID_TOKENS[i].pattern.test(card.id)) {
        return ARTWORKS_BY_ID_TOKENS[i].artwork;
      }
    }
    for (let i = 0; i < ID_TOKEN_ALIAS_PATTERNS.length; i++) {
      if (ID_TOKEN_ALIAS_PATTERNS[i].pattern.test(card.id)) {
        return ID_TOKEN_ALIAS_PATTERNS[i].artwork;
      }
    }
  }

  // Fallback based on category
  const category = card.category ?? 'combat';
  return CATEGORY_FALLBACKS[category] ?? CARD_ARTWORKS_REGISTRY.card_revolver;
}
