import type { Enemy, EnemyCategory } from '../types/game';

export interface EnemyArtworkInfo {
  enemyId: string;
  name: string;
  category: EnemyCategory;
  cartoonUrl?: string;
  realisticUrl?: string;
  conceptLore?: string;
}

/**
 * 全遊戲 22 隻敵怪與首領的雙重認知濾鏡插圖註冊表 (ADR-0021)
 * 存放於 public/enemies/cartoon/ 與 public/enemies/realistic/
 */
export const ENEMY_ARTWORKS_REGISTRY: Record<string, EnemyArtworkInfo> = {
  // === Depth 1 (阿卡姆封鎖區) ===
  enemy_arkham_cultist: {
    enemyId: 'enemy_arkham_cultist',
    name: '阿卡姆異教徒',
    category: 'cultist',
    cartoonUrl: '/enemies/cartoon/enemy_arkham_cultist.png',
    realisticUrl: '/enemies/realistic/enemy_arkham_cultist.png',
    conceptLore: '常態下是大腦認知濾鏡下的圓潤兜帽小教徒；瘋狂時顯露滿臉鮮血刺印、手持黑曜石儀式刀的癲狂真身。',
  },
  enemy_ghoul_lurker: {
    enemyId: 'enemy_ghoul_lurker',
    name: '食屍鬼潛伏者',
    category: 'ghoul',
    cartoonUrl: '/enemies/cartoon/enemy_ghoul_lurker.png',
    realisticUrl: '/enemies/realistic/enemy_ghoul_lurker.png',
    conceptLore: '常態為抱著大骨頭的萌系犬齒小食屍鬼；瘋狂狀態化為皮肉潰爛、嘴角裂至耳際的駭人墓穴食腐者。',
  },
  enemy_nightgaunt: {
    enemyId: 'enemy_nightgaunt',
    name: '夜魘捕獵者',
    category: 'nightgaunt',
    cartoonUrl: '/enemies/cartoon/enemy_nightgaunt.png',
    realisticUrl: '/enemies/realistic/enemy_nightgaunt.png',
    conceptLore: '常態為圓溜溜無臉小蝠翼精靈；瘋狂狀態呈現光滑黑曜石無貌皮膚、覆蓋尖銳雙角與深淵尾鉤之可怖身形。',
  },
  enemy_ghoul_high_priest: {
    enemyId: 'enemy_ghoul_high_priest',
    name: '食屍鬼大祭司',
    category: 'ghoul',
    cartoonUrl: '/enemies/cartoon/enemy_ghoul_high_priest.png',
    realisticUrl: '/enemies/realistic/enemy_ghoul_high_priest.png',
    conceptLore: '常態為戴著大主教帽手舞足蹈的矮小祭司；瘋狂狀態顯現披著剝皮人面長袍、散發屍磷磷光的冥府主祭。',
  },
  enemy_walls_rat_swarm: {
    enemyId: 'enemy_walls_rat_swarm',
    name: '牆中變異鼠群',
    category: 'rat_swarm',
    cartoonUrl: '/enemies/cartoon/enemy_walls_rat_swarm.png',
    realisticUrl: '/enemies/realistic/enemy_walls_rat_swarm.png',
    conceptLore: '常態為抱著乳酪吱吱叫的圓滾滾小老鼠；瘋狂時顯露無數赤紅暴凸眼球、尖銳骨齒狂亂啃咬的深淵鼠潮。',
  },
  enemy_cultist_zealot: {
    enemyId: 'enemy_cultist_zealot',
    name: '異教狂熱信徒',
    category: 'cultist',
    cartoonUrl: '/enemies/cartoon/enemy_cultist_zealot.png',
    realisticUrl: '/enemies/realistic/enemy_cultist_zealot.png',
    conceptLore: '常態為揮舞小鈍刀的小信徒；瘋狂時顯露全身刻滿不可名狀刺痕、癲狂割腕血祭的狂暴盲信者。',
  },
  enemy_cemetery_carrion_worm: {
    enemyId: 'enemy_cemetery_carrion_worm',
    name: '墓穴腐生蠕蟲',
    category: 'ghoul',
    cartoonUrl: '/enemies/cartoon/enemy_cemetery_carrion_worm.png',
    realisticUrl: '/enemies/realistic/enemy_cemetery_carrion_worm.png',
    conceptLore: '常態為戴著破花圈的泥土小毛毛蟲；瘋狂狀態裂變為生有數百圈鋒利倒齒、噴吐綠色屍瘴的死土巨蛆。',
  },
  enemy_shoggoth_progeny: {
    enemyId: 'enemy_shoggoth_progeny',
    name: '修格斯幼嗣',
    category: 'boss',
    cartoonUrl: '/enemies/cartoon/enemy_shoggoth_progeny.png',
    // 首領特殊規則：永恆保持可愛卡通形態，不設寫實真身
    conceptLore: '第一深度守關首領。圓球狀如果凍史萊姆般吐著彩虹氣泡的多眼可愛生物，以此荒謬假面嘲弄凡人理智。',
  },

  // === Depth 2 (深潛者海蝕迷宮) ===
  enemy_deep_one_warrior: {
    enemyId: 'enemy_deep_one_warrior',
    name: '深潛者戰士',
    category: 'deep_one',
    cartoonUrl: '/enemies/cartoon/enemy_deep_one_warrior.png',
    realisticUrl: '/enemies/realistic/enemy_deep_one_warrior.png',
    conceptLore: '手持小三叉戟的可愛小魚人 vs 鱗片冰冷潮濕、長有外翻魚鰓與血盆大口的印斯茅斯魚怪。',
  },
  enemy_drowned_soul: {
    enemyId: 'enemy_drowned_soul',
    name: '溺斃亡魂',
    category: 'drowned',
    cartoonUrl: '/enemies/cartoon/enemy_drowned_soul.png',
    realisticUrl: '/enemies/realistic/enemy_drowned_soul.png',
    conceptLore: '吐著水泡的半透明水滴幽靈 vs 浮腫發紫、雙目空洞流淌海水的水底怨魂。',
  },
  enemy_deep_one_elder: {
    enemyId: 'enemy_deep_one_elder',
    name: '深潛者長老',
    category: 'deep_one',
    cartoonUrl: '/enemies/cartoon/enemy_deep_one_elder.png',
    realisticUrl: '/enemies/realistic/enemy_deep_one_elder.png',
    conceptLore: '拄著珊瑚手杖的慈祥老海龜魚人 vs 身軀覆蓋藤壺巨蚌、目光冰冷充滿遠古威能的長老真身。',
  },
  enemy_dagon_champion: {
    enemyId: 'enemy_dagon_champion',
    name: '大袞冠軍鬥士',
    category: 'deep_one',
    cartoonUrl: '/enemies/cartoon/enemy_dagon_champion.png',
    realisticUrl: '/enemies/realistic/enemy_dagon_champion.png',
    conceptLore: '頭戴巨大貝殼盔的矮壯小魚人戰士 vs 肌肉如絞索暴脹、手持深海重刃的狂戰巨獸。',
  },
  enemy_frenzied_deep_one: {
    enemyId: 'enemy_frenzied_deep_one',
    name: '狂暴深潛者',
    category: 'deep_one',
    cartoonUrl: '/enemies/cartoon/enemy_frenzied_deep_one.png',
    realisticUrl: '/enemies/realistic/enemy_frenzied_deep_one.png',
    conceptLore: '旋轉撲咬的逗趣狂躁小鯊魚人 vs 背脊倒刺倒豎、腥紅血眼散發濃烈殺戮氣息的狂暴化巨怪。',
  },
  enemy_tidal_siren: {
    enemyId: 'enemy_tidal_siren',
    name: '潮汐塞壬海妖',
    category: 'drowned',
    cartoonUrl: '/enemies/cartoon/enemy_tidal_siren.png',
    realisticUrl: '/enemies/realistic/enemy_tidal_siren.png',
    conceptLore: '常態為在礁岩上撥弄浪花的萌系小美人魚；瘋狂狀態露出倒刺獠牙、全身覆蓋青紫浮腫水垢的溺魂海妖。',
  },
  enemy_innsmouth_hybrid: {
    enemyId: 'enemy_innsmouth_hybrid',
    name: '印斯茅斯混血種',
    category: 'deep_one',
    cartoonUrl: '/enemies/cartoon/enemy_innsmouth_hybrid.png',
    realisticUrl: '/enemies/realistic/enemy_innsmouth_hybrid.png',
    conceptLore: '常態為穿著水手背心的滑稽凸眼小魚人；瘋狂時顯露外翻魚鰓不斷滲血、生長堅硬死皮的兩棲畸變凶徒。',
  },
  enemy_abyssal_barnacle_mass: {
    enemyId: 'enemy_abyssal_barnacle_mass',
    name: '深海寄生藤壺群',
    category: 'deep_one',
    cartoonUrl: '/enemies/cartoon/enemy_abyssal_barnacle_mass.png',
    realisticUrl: '/enemies/realistic/enemy_abyssal_barnacle_mass.png',
    conceptLore: '常態為背著繽紛彩貝石堡的小寄居蟹怪；瘋狂時化為密佈帶刺利刃甲殼、噴吐腐蝕酸霧的活體寄生集群。',
  },
  enemy_dagon_priest: {
    enemyId: 'enemy_dagon_priest',
    name: '大袞主教',
    category: 'boss',
    cartoonUrl: '/enemies/cartoon/enemy_dagon_priest.png',
    // 首領特殊規則：永恆保持可愛卡通形態
    conceptLore: '第二深度守關首領。披著華麗金邊小袍子、圓肚滾滾的大眼深海主教，以超維荒謬姿態君臨海蝕迷宮。',
  },

  // === Depth 3 (無底深淵祭壇) ===
  enemy_proto_shoggoth_spawn: {
    enemyId: 'enemy_proto_shoggoth_spawn',
    name: '原初修格斯幼體',
    category: 'shoggoth',
    cartoonUrl: '/enemies/cartoon/enemy_proto_shoggoth_spawn.png',
    realisticUrl: '/enemies/realistic/enemy_proto_shoggoth_spawn.png',
    conceptLore: '圓滾滾帶有笑臉眼睛的原生質小球 vs 散發油性惡臭、不斷增生眼球與獠牙的深淵聚合體。',
  },
  enemy_byakhee_rotwing: {
    enemyId: 'enemy_byakhee_rotwing',
    name: '腐翼拜亞基',
    category: 'byakhee',
    cartoonUrl: '/enemies/cartoon/enemy_byakhee_rotwing.png',
    realisticUrl: '/enemies/realistic/enemy_byakhee_rotwing.png',
    conceptLore: '撲閃著肉翅的可愛小蝙蝠鳥 vs 融合昆蟲外骨骼、腐爛鳥身與吸血口器的宇宙星間掠食者。',
  },
  enemy_formless_spawn: {
    enemyId: 'enemy_formless_spawn',
    name: '無形之子',
    category: 'formless',
    cartoonUrl: '/enemies/cartoon/enemy_formless_spawn.png',
    realisticUrl: '/enemies/realistic/enemy_formless_spawn.png',
    conceptLore: '像黑墨滴一般的彈跳小水滴怪 vs 漆黑黏稠、在祭壇肆意翻湧幻化利爪與深喉的札特瓜之嗣。',
  },
  enemy_hound_of_tindalos: {
    enemyId: 'enemy_hound_of_tindalos',
    name: '廷達洛斯獵犬',
    category: 'hound',
    cartoonUrl: '/enemies/cartoon/enemy_hound_of_tindalos.png',
    realisticUrl: '/enemies/realistic/enemy_hound_of_tindalos.png',
    conceptLore: '折紙幾何稜角小柴犬 vs 自空間死角湧出、青白色毒霧繚繞的非歐幾何時空獵犬真身。',
  },
  enemy_ancient_hound: {
    enemyId: 'enemy_ancient_hound',
    name: '遠古廷達洛斯宿尊',
    category: 'hound',
    cartoonUrl: '/enemies/cartoon/enemy_ancient_hound.png',
    realisticUrl: '/enemies/realistic/enemy_ancient_hound.png',
    conceptLore: '戴著金色稜角項圈的大稜鏡小狗 vs 穿梭億萬時空、全身覆蓋尖銳結晶與時間侵蝕灰燼的遠古宿尊。',
  },
  enemy_migo_scout: {
    enemyId: 'enemy_migo_scout',
    name: '米·戈偵察者',
    category: 'migo',
    cartoonUrl: '/enemies/cartoon/enemy_migo_scout.png',
    realisticUrl: '/enemies/realistic/enemy_migo_scout.png',
    conceptLore: '常態為嗡嗡扇動彩虹小翅膀的萌系大甲蟲；瘋狂狀態顯現由猶格斯星菌絲外骨骼構成、揮舞外科解剖鋸鉗的異星偵察者。',
  },
  enemy_void_wanderer: {
    enemyId: 'enemy_void_wanderer',
    name: '虛空漫遊者',
    category: 'formless',
    cartoonUrl: '/enemies/cartoon/enemy_void_wanderer.png',
    realisticUrl: '/enemies/realistic/enemy_void_wanderer.png',
    conceptLore: '常態為像小影子般閃爍捉迷藏的黑糰子；瘋狂狀態化為撕裂三維空間、引發因果坍縮的非實體高維殘影。',
  },
  enemy_outer_god_piper: {
    enemyId: 'enemy_outer_god_piper',
    name: '外神盲目吹笛者',
    category: 'formless',
    cartoonUrl: '/enemies/cartoon/enemy_outer_god_piper.png',
    realisticUrl: '/enemies/realistic/enemy_outer_god_piper.png',
    conceptLore: '常態為吹著小喇叭搖頭晃腦的小偶人；瘋狂時顯露無定形黏液肢體、在虛空裂隙中狂奏無調骨笛的盲目痴愚侍從。',
  },
  enemy_colossal_shoggoth: {
    enemyId: 'enemy_colossal_shoggoth',
    name: '巨型修格斯',
    category: 'boss',
    cartoonUrl: '/enemies/cartoon/enemy_colossal_shoggoth.png',
    // 首領特殊規則：永恆保持可愛卡通形態
    conceptLore: '第三深度守關首領。無比巨大的半透明粉紫果凍巨山，咕嚕嚕叫著冒出巨大愛心氣泡的超常態首領假面。',
  },

  // === Depth 4 (星辰正位 · 拉萊耶核心) ===
  enemy_star_spawn_larva: {
    enemyId: 'enemy_star_spawn_larva',
    name: '星之眷族幼體',
    category: 'star_spawn',
    cartoonUrl: '/enemies/cartoon/enemy_star_spawn_larva.png',
    realisticUrl: '/enemies/realistic/enemy_star_spawn_larva.png',
    conceptLore: '頭頂小章魚爪、撲打小翅膀的萌萌小克蘇魯 vs 散發宇宙輻射與古老心靈威壓的星之眷族。',
  },
  enemy_rlyeh_guard: {
    enemyId: 'enemy_rlyeh_guard',
    name: '拉萊耶近衛',
    category: 'ancient_guardian',
    cartoonUrl: '/enemies/cartoon/enemy_rlyeh_sarcophagus_guard.png',
    realisticUrl: '/enemies/realistic/enemy_rlyeh_sarcophagus_guard.png',
    conceptLore: '扛著巨大石柱玩具的小石雕人 vs 沉眠數萬年的非歐幾何巨石構造體衛士。',
  },
  enemy_rlyeh_sarcophagus_guard: {
    enemyId: 'enemy_rlyeh_sarcophagus_guard',
    name: '拉萊耶石棺守衛',
    category: 'ancient_guardian',
    cartoonUrl: '/enemies/cartoon/enemy_rlyeh_sarcophagus_guard.png',
    realisticUrl: '/enemies/realistic/enemy_rlyeh_sarcophagus_guard.png',
    conceptLore: '常態為抱著非歐幾何盾牌的小石雕木乃伊；瘋狂時顯露自玄武岩石棺中拔起、周身流淌綠色屍瘴與非歐雕文的遠古衛兵。',
  },
  enemy_rlyeh_dream_apparition: {
    enemyId: 'enemy_rlyeh_dream_apparition',
    name: '拉萊耶夢境具象',
    category: 'star_spawn',
    cartoonUrl: '/enemies/cartoon/enemy_rlyeh_dream_apparition.png',
    realisticUrl: '/enemies/realistic/enemy_rlyeh_dream_apparition.png',
    conceptLore: '常態為飄浮在泡泡裡的沉睡小精靈克蘇魯；瘋狂時顯露克蘇魯沉睡潛意識撕裂現實形成的萬古夢魘。',
  },
  enemy_non_euclidean_construct: {
    enemyId: 'enemy_non_euclidean_construct',
    name: '非歐幾何異構體',
    category: 'ancient_guardian',
    cartoonUrl: '/enemies/cartoon/enemy_rlyeh_sarcophagus_guard.png',
    realisticUrl: '/enemies/realistic/enemy_rlyeh_sarcophagus_guard.png',
    conceptLore: '常態為滾動的發光綠色幾何積木塊；瘋狂時展現反向折疊維度、引力逆轉的活體非歐幾何巨石。',
  },
  enemy_cosmic_acolyte: {
    enemyId: 'enemy_cosmic_acolyte',
    name: '星空侍僧',
    category: 'cultist',
    cartoonUrl: '/enemies/cartoon/enemy_cosmic_acolyte.png',
    realisticUrl: '/enemies/realistic/enemy_cosmic_acolyte.png',
    conceptLore: '捧著發光小水晶球眨眼的小侍僧 vs 身體星空虛空化、眼中燃燒超新星殘燼的深空殉道者。',
  },
  enemy_cosmic_prophet: {
    enemyId: 'enemy_cosmic_prophet',
    name: '終焉星辰先知',
    category: 'cultist',
    cartoonUrl: '/enemies/cartoon/enemy_cosmic_prophet.png',
    realisticUrl: '/enemies/realistic/enemy_cosmic_prophet.png',
    conceptLore: '常態為手持小渾天儀與望遠鏡的星空小星象師；瘋狂時化身燃燒星際冷焰、雙眼蒙受星痕宣告群星正位滅世的深空先知。',
  },
  enemy_ancient_guardian: {
    enemyId: 'enemy_ancient_guardian',
    name: '遠古不朽守護者',
    category: 'ancient_guardian',
    cartoonUrl: '/enemies/cartoon/enemy_ancient_guardian.png',
    realisticUrl: '/enemies/realistic/enemy_ancient_guardian.png',
    conceptLore: '頭戴發光星冠的小金人雕像 vs 守衛星辰之門的無解神聖古神造物。',
  },
  enemy_star_spawn: {
    enemyId: 'enemy_star_spawn',
    name: '克蘇魯星之眷族',
    category: 'boss',
    cartoonUrl: '/enemies/cartoon/enemy_star_spawn.png',
    // 首領特殊規則：永恆保持可愛卡通形態
    conceptLore: '第四深度終極首領。擁有巨大碧綠章魚頭、短小龍翼與大眼睛的 Q 版克蘇魯本尊，以永恆假面蔑視一切封印。',
  },

  // === Legacy & Catalog Aliases (相容初始與目錄敵怪 ID) ===
  enemy_ghoul_01: {
    enemyId: 'enemy_ghoul_01',
    name: '食屍鬼',
    category: 'ghoul',
    cartoonUrl: '/enemies/cartoon/enemy_ghoul_lurker.png',
    realisticUrl: '/enemies/realistic/enemy_ghoul_lurker.png',
    conceptLore: '初次遭遇的食屍鬼，對應食屍鬼潛伏者插圖資產。',
  },
  enemy_ancient_hound_of_tindalos: {
    enemyId: 'enemy_ancient_hound_of_tindalos',
    name: '廷達洛斯追獵古獸',
    category: 'hound',
    cartoonUrl: '/enemies/cartoon/enemy_void_wanderer.png',
    realisticUrl: '/enemies/realistic/enemy_void_wanderer.png',
    conceptLore: '穿梭億萬時空死角的廷達洛斯古獸，對應遠古廷達洛斯宿尊美術設定。',
  },
  enemy_ancient_eldritch_guardian: {
    enemyId: 'enemy_ancient_eldritch_guardian',
    name: '舊日太古守護者',
    category: 'ancient_guardian',
    cartoonUrl: '/enemies/cartoon/enemy_rlyeh_sarcophagus_guard.png',
    realisticUrl: '/enemies/realistic/enemy_rlyeh_sarcophagus_guard.png',
    conceptLore: '拉萊耶永恆守望者，對應遠古不朽守護者美術設定。',
  },
};

/**
 * 實體磁碟存在之怪獸圖檔白名單 (確保 Review Lab、圖鑑與遊戲運行零破圖)
 */
export const VERIFIED_ENEMY_IMAGE_PATHS = new Set<string>([
  '/enemies/cartoon/enemy_abyssal_barnacle_mass.png',
  '/enemies/cartoon/enemy_arkham_cultist.png',
  '/enemies/cartoon/enemy_cemetery_carrion_worm.png',
  '/enemies/cartoon/enemy_cosmic_prophet.png',
  '/enemies/cartoon/enemy_cultist_zealot.png',
  '/enemies/cartoon/enemy_ghoul_high_priest.png',
  '/enemies/cartoon/enemy_ghoul_lurker.png',
  '/enemies/cartoon/enemy_innsmouth_hybrid.png',
  '/enemies/cartoon/enemy_migo_scout.png',
  '/enemies/cartoon/enemy_nightgaunt.png',
  '/enemies/cartoon/enemy_outer_god_piper.png',
  '/enemies/cartoon/enemy_rlyeh_dream_apparition.png',
  '/enemies/cartoon/enemy_rlyeh_sarcophagus_guard.png',
  '/enemies/cartoon/enemy_shoggoth_progeny.png',
  '/enemies/cartoon/enemy_tidal_siren.png',
  '/enemies/cartoon/enemy_void_wanderer.png',
  '/enemies/cartoon/enemy_walls_rat_swarm.png',
  '/enemies/realistic/enemy_abyssal_barnacle_mass.png',
  '/enemies/realistic/enemy_arkham_cultist.png',
  '/enemies/realistic/enemy_cemetery_carrion_worm.png',
  '/enemies/realistic/enemy_cosmic_prophet.png',
  '/enemies/realistic/enemy_cultist_zealot.png',
  '/enemies/realistic/enemy_ghoul_high_priest.png',
  '/enemies/realistic/enemy_ghoul_lurker.png',
  '/enemies/realistic/enemy_innsmouth_hybrid.png',
  '/enemies/realistic/enemy_migo_scout.png',
  '/enemies/realistic/enemy_nightgaunt.png',
  '/enemies/realistic/enemy_outer_god_piper.png',
  '/enemies/realistic/enemy_rlyeh_dream_apparition.png',
  '/enemies/realistic/enemy_rlyeh_sarcophagus_guard.png',
  '/enemies/realistic/enemy_tidal_siren.png',
  '/enemies/realistic/enemy_void_wanderer.png',
  '/enemies/realistic/enemy_walls_rat_swarm.png',
]);

/**
 * 檢查給定之圖檔路徑是否為實體磁碟存在之可用資產
 */
export function isEnemyImageVerified(url?: string): boolean {
  if (!url) return false;
  return VERIFIED_ENEMY_IMAGE_PATHS.has(url);
}

/**
 * 依敵怪 ID 查詢美術插圖資訊
 */
export function getEnemyArtwork(enemyId: string): EnemyArtworkInfo | undefined {
  return ENEMY_ARTWORKS_REGISTRY[enemyId];
}

export interface ResolveIllustrationOptions {
  isMadness?: boolean;
  isFlickering?: boolean;
}

/**
 * 依據敵怪狀態與認知濾鏡規則解析當前應展示的透明插圖 URL (ADR-0021)
 *
 * 核心規則：
 * 1. 首領永恆假面（Boss Invariant Mask）：
 *    若 enemy.category === 'boss' 或 artwork.category === 'boss'，永遠鎖定回傳 cartoonUrl，
 *    無論處於瘋狂狀態或受損閃爍中皆不顯現寫實真身。
 * 2. 雙重認知濾鏡（Dual-Perception Filter）：
 *    在理智受損閃爍（isFlickering）或瘋狂狀態（isMadness）下，優先回傳 realisticUrl；
 *    若無 realisticUrl 則降級回傳 cartoonUrl。
 * 3. 常態（Normal）：
 *    回傳 cartoonUrl；若無 cartoonUrl 則回傳 realisticUrl。
 * 4. 優雅回退（Graceful Fallback）：
 *    若查無任何圖檔或無註冊項，回傳 null，通知 UI 降級渲染通用類別圖標。
 */
export function getActiveEnemyIllustration(
  enemy: Enemy,
  options: ResolveIllustrationOptions = {}
): string | null {
  const { isMadness = false, isFlickering = false } = options;

  // 1. 優先取敵怪自帶之 illustration，次取全域註冊表
  const registered = ENEMY_ARTWORKS_REGISTRY[enemy.id];
  const cartoonUrl = enemy.illustration?.cartoonUrl ?? registered?.cartoonUrl;
  const realisticUrl = enemy.illustration?.realisticUrl ?? registered?.realisticUrl;

  const isBoss = enemy.category === 'boss' || registered?.category === 'boss';

  // 2. 首領永恆假面：舊日首領永遠保持可愛卡通形態
  if (isBoss) {
    return cartoonUrl ?? null;
  }

  // 3. 認知防衛瓦解狀態（理智受損閃爍中 或 理智歸零之瘋狂狀態）
  if (isFlickering || isMadness) {
    if (realisticUrl) return realisticUrl;
    if (cartoonUrl) return cartoonUrl;
    return null;
  }

  // 4. 常態（理智尚存）：大腦保護性濾鏡呈現可愛卡通形態
  if (cartoonUrl) return cartoonUrl;
  if (realisticUrl) return realisticUrl;

  return null;
}
