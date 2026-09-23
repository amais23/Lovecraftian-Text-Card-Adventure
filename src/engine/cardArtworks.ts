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
  card_double_tap: {
    artId: 'card_double_tap',
    name: '雙發速射',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: 'Q版圓潤左輪手槍同時射出兩枚帶有俏皮笑臉的大子彈，伴隨金色漫畫星芒與逗趣雙重煙霧。',
    imageUrl: '/cards/combat/card_double_tap.png',
  },
  card_shield_slam: {
    artId: 'card_shield_slam',
    name: '護甲猛擊',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: '可愛Q版小警探高舉不成比例的巨大防暴鐵盾向前猛衝撞擊，震盪出鮮明漫畫狀撞擊星火與速度線。',
    imageUrl: '/cards/combat/card_shield_slam.png',
  },
  card_weakpoint_snipe: {
    artId: 'card_weakpoint_snipe',
    name: '弱點狙擊',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: '復古卡通獵槍透過圓形狙擊鏡鎖定閃亮可愛的紅色破綻愛心標記，精準射線帶來逗趣致命反差。',
    imageUrl: '/cards/combat/card_weakpoint_snipe.png',
  },
  card_tactical_feint: {
    artId: 'card_tactical_feint',
    name: '戰術佯攻',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器',
    conceptLore: '敏捷的Q版偵探靈巧側翻留下虛線殘影，持小刀虛晃一招，讓紫色觸手怪物暈頭轉向滿頭問號。',
    imageUrl: '/cards/combat/card_tactical_feint.png',
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
  card_veteran_instinct: {
    artId: 'card_veteran_instinct',
    name: '老兵本能',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '一戰戰壕老兵滿是泥濘與老繭的粗糙雙手，緊握軍刀握柄與黃銅懷錶，在昏暗提燈下沉著備戰。',
    imageUrl: '/cards/skill/card_veteran_instinct.png',
  },
  card_astral_refraction: {
    artId: 'card_astral_refraction',
    name: '星界折射',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '古典書房中調查員轉動多面體玻璃稜鏡，將冷色星芒折射為幾何守護陣，精密投射於古籍羊皮紙上。',
    imageUrl: '/cards/skill/card_astral_refraction.png',
  },
  card_field_bandage: {
    artId: 'card_field_bandage',
    name: '戰地急救繃帶',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '粗糙木板上的戰地醫療靜物，厚棉布繃帶、深棕色烈酒藥瓶、弧形縫合針線與黃色硫磺消毒粉末。',
    imageUrl: '/cards/skill/card_field_bandage.png',
  },
  card_calm_observation: {
    artId: 'card_calm_observation',
    name: '冷靜觀察',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝',
    conceptLore: '皮革手套手持精緻黃銅放大鏡端詳調查筆記上的解剖草圖，黃銅馬燈在陰暗藏書館投射沉靜專注的光影。',
    imageUrl: '/cards/skill/card_calm_observation.png',
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
  card_whispers_of_madness: {
    artId: 'card_whispers_of_madness',
    name: '狂亂低語',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法',
    conceptLore: '明媚陽光下飛揚著七彩繽紛的魔導音符與夢幻光環，絢爛紫金光粒如精靈般在天際跳躍起舞。',
    imageUrl: '/cards/magic/card_whispers_of_madness.png',
  },
  card_abyssal_detonation: {
    artId: 'card_abyssal_detonation',
    name: '深淵引爆',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法',
    conceptLore: '陽光明媚的青翠草地上綻放華麗的紫金召喚法陣，璀璨水晶簇升騰爆發出煙火般炫目的慶典式魔力光芒。',
    imageUrl: '/cards/magic/card_abyssal_detonation.png',
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
  card_tide_of_truth: {
    artId: 'card_tide_of_truth',
    name: '真相潮汐',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示',
    conceptLore: '浩瀚星海與多維虛空邊界湧動的宇宙真相潮汐，冰冷純銀與暗紫星光交織，巨大克蘇魯天眼在浪潮深處俯瞰凡世。',
    imageUrl: '/cards/truth/card_tide_of_truth.png',
  },
  card_remnant_seal: {
    artId: 'card_remnant_seal',
    name: '舊印殘印',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示',
    conceptLore: '古老玄武岩石板上殘存發光的舊印五芒星微光，冰冷銀白符文在星穹虛空中發出古老威壓，封鎮深淵侵蝕。',
    imageUrl: '/cards/truth/card_remnant_seal.png',
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
  card_abyssal_fragment_1: {
    artId: 'card_abyssal_fragment_1',
    name: '深淵封印殘片·其一',
    category: 'madness',
    styleTag: 'madness',
    styleName: '深淵異化 · 封印殘片',
    conceptLore: '浸泡在修格斯漆黑原形黏液中的黑曜石殘片，異化血肉纖維蠕動纏繞，隱隱透露出不可名狀的心跳脈動。',
    imageUrl: '/cards/madness/card_abyssal_fragment_1.png',
  },
  card_abyssal_fragment_2: {
    artId: 'card_abyssal_fragment_2',
    name: '深淵封印殘片·其二',
    category: 'madness',
    styleTag: 'madness',
    styleName: '深淵異化 · 潮汐殘片',
    conceptLore: '沉沒於萬米海蝕深淵的玄武岩星圖斷片，幽綠磷光星紋在冰冷海流中若隱若現，低語著深潛者的太古祭歌。',
    imageUrl: '/cards/madness/card_abyssal_fragment_2.png',
  },
  card_abyssal_fragment_3: {
    artId: 'card_abyssal_fragment_3',
    name: '深淵封印殘片·其三',
    category: 'madness',
    styleTag: 'madness',
    styleName: '深淵異化 · 原核殘片',
    conceptLore: '原生修格斯崩解核心結晶化形成的拱頂楔石，深紫狂亂異象在此處劇烈共振，即將引發太古封印的昇華質變。',
    imageUrl: '/cards/madness/card_abyssal_fragment_3.png',
  },
  card_complete_ancient_seal: {
    artId: 'card_complete_ancient_seal',
    name: '完整的深淵古印',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 終極古印',
    conceptLore: '三枚深淵殘片在星穹神性光輝中合為一體的崇高神器，純白真理天火與神聖幾何星軌徹底驅散深淵，洞開多維星門。',
    imageUrl: '/cards/truth/card_complete_ancient_seal.png',
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

  // === TIER 2 ADVANCED CARDS ===
  card_tier2_pump_shotgun: {
    artId: 'card_tier2_pump_shotgun',
    name: '泵動式散彈槍',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器 · 重型散彈',
    conceptLore: 'Q版霰彈槍猛烈上膛，近距離射出漫天鉛彈與破甲鋼珠，火力壓制一切異怪。',
    imageUrl: '/cards/combat/card_pump_shotgun.png',
  },
  card_tier2_silver_dagger: {
    artId: 'card_tier2_silver_dagger',
    name: '破魔銀質短刃',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器 · 秘銀短刃',
    conceptLore: '卡通風格的刻印銀刃，在黑夜中閃爍微光，對污穢血肉造成撕裂與持續流血傷害。',
    imageUrl: '/cards/combat/card_silver_dagger.png',
  },
  card_tier2_iron_will: {
    artId: 'card_tier2_iron_will',
    name: '鋼鐵意志屏障',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝 · 意志防線',
    conceptLore: '寫實手法刻畫調查員咬緊牙關抵抗恐懼，以凡人堅定意志築起堅固累積護甲。',
    imageUrl: '/cards/skill/card_iron_will.png',
  },
  card_tier2_rapid_suture: {
    artId: 'card_tier2_rapid_suture',
    name: '戰地快速縫合',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝 · 急救術式',
    conceptLore: '高清寫實的醫用持針鉗與羊腸線，在戰鬥間隙迅速止血並平復精神震顫。',
    imageUrl: '/cards/skill/card_rapid_suture.png',
  },
  card_tier2_frost_grasp: {
    artId: 'card_tier2_frost_grasp',
    name: '深海冰霜之握',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法 · 冰霜洋流',
    conceptLore: '陽光奇幻光彩中召喚出的極寒冰霜之爪，晶瑩剔透的冰晶凍結敵人的深淵肢體。',
    imageUrl: '/cards/magic/card_frost_grasp.png',
  },
  card_tier2_mind_blast: {
    artId: 'card_tier2_mind_blast',
    name: '心靈震波',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法 · 靈能衝擊波',
    conceptLore: '絢麗七彩靈能同心圓光環如漣漪般擴散，驅散敵人的狂亂意識與防護。',
    imageUrl: '/cards/magic/card_mind_blast.png',
  },
  card_tier2_sea_tablet: {
    artId: 'card_tier2_sea_tablet',
    name: '禁忌海蝕石板殘卷',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 潮汐銘刻',
    conceptLore: '在海潮侵蝕的玄武岩石板上，泛著磷光的太古蠕行符號若隱若現，揭露深海秩序。',
    imageUrl: '/cards/truth/card_sea_tablet.png',
  },
  card_tier2_silver_key_guiding: {
    artId: 'card_tier2_silver_key_guiding',
    name: '銀鑰指引微光',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 星門微光',
    conceptLore: '虛空中劃過的一道銀色微光，指引著通往多維度時空節點的神秘門扉。',
    imageUrl: '/cards/truth/card_silver_key_guiding.png',
  },

  // === TIER 3 MASTER CARDS ===
  card_tier3_sanity_anchor: {
    artId: 'card_tier3_sanity_anchor',
    name: '極限精神錨定',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝 · 理性之錨',
    conceptLore: '寫實鐵錨緊鎖於黑曜石基石之上，銘刻舊印的粗重鎖鏈死死拉住狂暴崩潰的心智。',
    imageUrl: '/cards/skill/card_sanity_anchor.png',
  },
  card_tier3_void_collapse: {
    artId: 'card_tier3_void_collapse',
    name: '虛空黑洞坍縮',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法 · 引力奇點',
    conceptLore: '耀眼的高魔星雲旋渦向內塌縮，星光與以太匯聚成吞噬萬物的微型奇點。',
    imageUrl: '/cards/magic/card_void_collapse.png',
  },
  card_tier3_psionic_cleave: {
    artId: 'card_tier3_psionic_cleave',
    name: '深淵靈能撕裂',
    category: 'magic',
    styleTag: 'fantasy',
    styleName: '星空秘法 · 靈能刀鋒',
    conceptLore: '耀眼奪目的紫光靈能光刃劃破多維度空間，無堅不摧的以太鋒芒橫掃戰場。',
    imageUrl: '/cards/magic/card_psionic_cleave.png',
  },
  card_tier3_rlyeh_codex: {
    artId: 'card_tier3_rlyeh_codex',
    name: '拉萊耶原典啟示',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 太古秘卷',
    conceptLore: '沉睡海溝深處的拉萊耶原典展開冰冷光芒，太古星辰幾何秩序驅散無盡瘋狂。',
    imageUrl: '/cards/truth/card_rlyeh_codex.png',
  },
  card_tier3_star_resonance: {
    artId: 'card_tier3_star_resonance',
    name: '超維星辰共鳴',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 多維星軌',
    conceptLore: '星空深處萬千軌道同時鳴響，崇高的幾何秩序在心靈周圍築起無形護甲屏障。',
    imageUrl: '/cards/truth/card_star_resonance.png',
  },

  // === EVENT LORE & SPECIAL MECHANISM CARDS (ADR-0033) ===
  card_underwater_demolition: {
    artId: 'card_underwater_demolition',
    name: '水下爆破',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器 · 水下重火器',
    conceptLore: 'Q版圓滾滾的水下定時魚雷炸藥冒著萌系氣泡與驚慌大眼，在深海珊瑚礁間引爆如爆米花般的漫畫狀星火。',
    imageUrl: '/cards/combat/card_underwater_demolition.png',
  },
  card_proto_tentacle: {
    artId: 'card_proto_tentacle',
    name: '原形觸鬚',
    category: 'combat',
    styleTag: 'cartoon',
    styleName: '實體武器 · 原生質觸手',
    conceptLore: '圓滾滾如果凍般的小修格斯萌系觸鬚揮舞著可愛吸盤，伴隨誇張漫畫速度線抽打出粉紫小星星與衝擊火花。',
    imageUrl: '/cards/combat/card_proto_tentacle.png',
  },
  card_star_spawn_sigil: {
    artId: 'card_star_spawn_sigil',
    name: '星之眷族印記',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝 · 太古星符',
    conceptLore: '1920年代銅綠斑駁的深海青銅星狀護符，在昏暗防風馬燈下散發冰涼冷光，旁邊擺放著調查手記與皮質手套。',
    imageUrl: '/cards/skill/card_star_spawn_sigil.png',
  },
  card_dimension_stride: {
    artId: 'card_dimension_stride',
    name: '維度漫步',
    category: 'skill',
    styleTag: 'realistic',
    styleName: '生存技藝 · 時空折疊',
    conceptLore: '泥濘石板路上調查員皮靴踏出的折疊空間殘影，時空輪廓泛起水銀般的幾何波紋，極具戰術臨場感。',
    imageUrl: '/cards/skill/card_dimension_stride.png',
  },
  card_tide_whisper: {
    artId: 'card_tide_whisper',
    name: '潮汐之音',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 深海潮音',
    conceptLore: '深邃海底沉睡的拉萊耶玄武岩巨石，漂浮著純銀幾何天球與多維星海潮汐，巨大天眼俯瞰無垠虛空。',
    imageUrl: '/cards/truth/card_tide_whisper.png',
  },
  card_elder_geometry: {
    artId: 'card_elder_geometry',
    name: '太古幾何密卷',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 非歐幾何',
    conceptLore: '懸浮於虛空中的發光羊皮紙手抄卷，鐫刻著旋轉的非歐幾何同心圓星軌與純白神聖星系光輝。',
    imageUrl: '/cards/truth/card_elder_geometry.png',
  },
  card_final_awakening: {
    artId: 'card_final_awakening',
    name: '終焉覺悟',
    category: 'truth',
    styleTag: 'eldritch',
    styleName: '舊日啟示 · 宇宙覺醒',
    conceptLore: '穿透無垠深淵的純銀宇宙冷光，多維度星門敞開，凡人渺小靈魂在宏大真理秩序前直面宇宙終極真實。',
    imageUrl: '/cards/truth/card_final_awakening.png',
  },
  card_abyss_curse: {
    artId: 'card_abyss_curse',
    name: '深淵詛咒',
    category: 'madness',
    styleTag: 'madness',
    styleName: '深淵異化 · 封印碎裂',
    conceptLore: '被強行撕開的青銅太古封印碎裂，湧出黑曜石結晶與蠕動深淵血肉觸鬚，散發無法擺脫的絕望凝視。',
    imageUrl: '/cards/madness/card_abyss_curse.png',
  },
  card_whispers_of_shattered_stars: {
    artId: 'card_whispers_of_shattered_stars',
    name: '星辰碎裂之囈語',
    category: 'madness',
    styleTag: 'madness',
    styleName: '深淵異化 · 星空粉碎',
    conceptLore: '黑暗星空中碎裂的非歐幾何星球殘片，神經元般的紫黑觸手在虛空中震顫，散發侵蝕理智的深空回響。',
    imageUrl: '/cards/madness/card_whispers_of_shattered_stars.png',
  },
};

/**
 * All unique card artworks list for Compendium (All 73 game cards with 100% completed dedicated artworks - ADR-0033)
 */
export const ALL_CARD_ARTWORKS: CardArtworkInfo[] = Object.values(CARD_ARTWORKS_REGISTRY);

/**
 * Standard Lovecraftian Parchment WIP Placeholder for fallback.
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
 * Cards currently pending dedicated illustrations (Empty Set: all 73 cards now have completed dedicated illustrations)
 */
export const WIP_TIERED_CARD_NAMES = new Set<string>();

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

/* =========================================================
   Apothecary Supply Artworks (黑市藥品專屬繪卷 - ADR-0033)
   ========================================================= */

export interface ApothecarySupplyArtworkInfo {
  supplyId: string;
  name: string;
  imageUrl: string;
  styleName: string;
  conceptLore: string;
}

export const APOTHECARY_SUPPLY_ARTWORKS: Record<string, ApothecarySupplyArtworkInfo> = {
  market_item_morphine: {
    supplyId: 'market_item_morphine',
    name: '軍用嗎啡注射劑',
    imageUrl: '/supplies/supply_morphine.png',
    styleName: '1920s戰地藥劑',
    conceptLore: '一戰軍用黃銅雙指推桿玻璃針筒與棕色藥瓶，裝載琥珀色液體，置於粗糙麻布上。',
  },
  market_item_alcohol: {
    supplyId: 'market_item_alcohol',
    name: '高純度酒精繃帶',
    imageUrl: '/supplies/supply_alcohol_gauze.png',
    styleName: '1920s消毒敷料',
    conceptLore: '厚棉布醫用卷軸繃帶、敞口的卡波酸棕色玻璃藥瓶與金屬鑷子，散發揮發性藥味質感。',
  },
  market_item_surgery_kit_d2: {
    supplyId: 'market_item_surgery_kit_d2',
    name: '高級戰地醫療箱',
    imageUrl: '/supplies/supply_surgery_kit.png',
    styleName: '1920s野戰外科箱',
    conceptLore: '敞開的軍用深色木質野戰醫療箱，內置整齊的銀質持針鉗、弧形縫合針線與止血藥劑。',
  },
  market_item_antidote_serum_d2: {
    supplyId: 'market_item_antidote_serum_d2',
    name: '深海抗逆血清',
    imageUrl: '/supplies/supply_antidote_serum.png',
    styleName: '深海異化血清',
    conceptLore: '密封在厚壁玻璃安瓿中的深海幽綠磷光血清，外層套有黃銅防震支架，泛著深潛者黏液微光。',
  },
  market_item_revival_injection_d3: {
    supplyId: 'market_item_revival_injection_d3',
    name: '禁忌復甦針劑',
    imageUrl: '/supplies/supply_revival_injection.png',
    styleName: '太古氣壓注射槍',
    conceptLore: '刻滿太古封印銘文的重型金屬氣壓注射槍，內部流動著沸騰的深紫原質活力藥液。',
  },
  market_item_sanctified_elixir_d3: {
    supplyId: 'market_item_sanctified_elixir_d3',
    name: '聖所聖水金樽',
    imageUrl: '/supplies/supply_sanctified_elixir.png',
    styleName: '修道院純金聖樽',
    conceptLore: '古老修道院純金浮雕高腳酒樽，盛滿閃爍銀白星光的純淨驅邪聖水，周圍環繞溫暖燭火。',
  },
};

export function getSupplyArtwork(idOrName: string): ApothecarySupplyArtworkInfo | undefined {
  if (APOTHECARY_SUPPLY_ARTWORKS[idOrName]) {
    return APOTHECARY_SUPPLY_ARTWORKS[idOrName];
  }
  for (const art of Object.values(APOTHECARY_SUPPLY_ARTWORKS)) {
    if (art.name === idOrName || idOrName.startsWith(art.supplyId)) {
      return art;
    }
  }
  return undefined;
}

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
  { token: 'silver_blade', pattern: /(?:^|[_-])silver_blade(?:[_-]|\d+|$)/i, artwork: CARD_ARTWORKS_REGISTRY.card_tier2_silver_dagger },
  { token: 'mind_shock', pattern: /(?:^|[_-])mind_shock(?:[_-]|\d+|$)/i, artwork: CARD_ARTWORKS_REGISTRY.card_tier2_mind_blast },
  { token: 'forbidden_tablet', pattern: /(?:^|[_-])forbidden_tablet(?:[_-]|\d+|$)/i, artwork: CARD_ARTWORKS_REGISTRY.card_tier2_sea_tablet },
  { token: 'silver_key_glow', pattern: /(?:^|[_-])silver_key_glow(?:[_-]|\d+|$)/i, artwork: CARD_ARTWORKS_REGISTRY.card_tier2_silver_key_guiding },
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
