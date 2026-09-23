import type { DepthLevel, Enemy, EnemyIntent } from '../types/game';
import { ELDRITCH_TRAIT_DEFINITIONS } from './enemyTraits';
import {
  INITIAL_COLOSSAL_SHOGGOTH,
  INITIAL_DAGON_PRIEST,
  INITIAL_DEEP_ONE,
  INITIAL_SHOGGOTH,
  INITIAL_STAR_SPAWN,
} from './eventData';
import { INITIAL_GHOUL } from './initialData';

/* =========================================================
   Enemy Deep Clone Utility
   ========================================================= */

export function cloneEnemy(enemy: Enemy): Enemy {
  return {
    ...enemy,
    currentIntent: { ...enemy.currentIntent },
    intentSequence: enemy.intentSequence ? enemy.intentSequence.map((intent) => ({ ...intent })) : undefined,
    statusEffects: enemy.statusEffects ? enemy.statusEffects.map((status) => ({ ...status })) : undefined,
    traits: enemy.traits ? enemy.traits.map((trait) => ({ ...trait })) : undefined,
  };
}

/* =========================================================
   Depth 1 (阿卡姆封鎖區) Enemies
   ========================================================= */

export const ARKHAM_CULTIST_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 6,
    name: '儀式匕首刺擊',
    description: '異教徒揮動泛著烏光的儀式匕首，預告造成 6 點傷害。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'bleed',
    name: '割脈血祭',
    description: '以鮮血在地面刻劃邪惡星印，預告向你施加 2 層【流血】印記。',
  },
  {
    type: 'defend',
    value: 6,
    name: '狂信護身',
    description: '口中念誦癲狂祈禱凝聚護體屏障，預告獲得 6 點護甲。',
  },
  {
    type: 'attack',
    value: 8,
    name: '盲目突刺',
    description: '眼冒血絲發動亡命撲殺，預告造成 8 點傷害。',
  },
];

export const ENEMY_ARKHAM_CULTIST: Enemy = {
  id: 'enemy_arkham_cultist',
  name: '阿卡姆異教徒',
  title: '狂熱的舊日崇拜者',
  health: 28,
  maxHealth: 28,
  armor: 0,
  category: 'cultist',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.zealous_blood_oath],
  currentIntent: ARKHAM_CULTIST_INTENTS[0],
  intentSequence: ARKHAM_CULTIST_INTENTS,
  currentIntentIndex: 0,
};

export const GHOUL_LURKER_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 6,
    name: '腐臭爪擊',
    description: '揮舞沾滿墓泥與腐肉的利爪，預告造成 6 點傷害。',
  },
  {
    type: 'erode',
    value: 2,
    reduceDraw: 1,
    name: '墓穴死寂恐嚇',
    description: '自喉嚨噴吐令人作嘔的腐臭墓泥，預告侵蝕 2 點理智並使你下回合少抽 1 張牌。',
  },
  {
    type: 'attack',
    value: 8,
    name: '狂暴撕咬',
    description: '張開腥臭巨口猛烈撲咬，預告造成 8 點傷害。',
  },
  {
    type: 'defend',
    value: 5,
    name: '硬化皮層',
    description: '蜷縮身軀以堅韌死皮抵禦打擊，預告獲得 5 點護甲。',
  },
];

export const ENEMY_GHOUL_LURKER: Enemy = {
  id: 'enemy_ghoul_lurker',
  name: '食屍鬼潛伏者',
  title: '墓穴的腐食者',
  health: 32,
  maxHealth: 32,
  armor: 2,
  category: 'ghoul',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.carrion_feeder],
  currentIntent: GHOUL_LURKER_INTENTS[0],
  intentSequence: GHOUL_LURKER_INTENTS,
  currentIntentIndex: 0,
};

export const NIGHTGAUNT_INTENTS: EnemyIntent[] = [
  {
    type: 'apply_status',
    value: 2,
    statusType: 'horror',
    name: '無面深淵凝視',
    description: '光滑無貌的黑面直視心神，預告向你施加 2 層【恐慌】印記。',
  },
  {
    type: 'attack',
    value: 7,
    name: '黑曜石尾針戳刺',
    description: '倒鉤尾刺如毒蛇般疾刺而來，預告造成 7 點傷害。',
  },
  {
    type: 'erode',
    value: 2,
    name: '高空心靈下墜',
    description: '冰冷黑翼拍打捲起幻夢罡風，預告侵蝕 2 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 6,
    name: '幽冥迷蹤',
    description: '身形隱入濃稠夜色之中，預告獲得 6 點護甲。',
  },
];

export const ENEMY_NIGHTGAUNT: Enemy = {
  id: 'enemy_nightgaunt',
  name: '夜魘',
  title: '無貌的黑翼捕食者',
  health: 30,
  maxHealth: 30,
  armor: 0,
  category: 'nightgaunt',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.faceless_terror],
  currentIntent: NIGHTGAUNT_INTENTS[0],
  intentSequence: NIGHTGAUNT_INTENTS,
  currentIntentIndex: 0,
};

export const GHOUL_HIGH_PRIEST_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 9,
    name: '白骨權杖重擊',
    description: '揮動鑲嵌顱骨的權杖，預告造成 9 點傷害。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'vulnerable',
    name: '死者褻瀆咒詛',
    description: '吟誦褻瀆死者的古代咒言，預告向你施加 2 層【易傷】印記。',
  },
  {
    type: 'erode',
    value: 3,
    name: '地底墓穴長嘯',
    description: '引發地底空洞共鳴的淒厲尖叫，預告侵蝕 3 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 8,
    name: '骸骨壁障',
    description: '召集四散的屍骸化作堅壁，預告獲得 8 點護甲。',
  },
  {
    type: 'attack',
    value: 11,
    name: '食腐狂潮',
    description: '指揮成群的腐蟲與骸骨衝擊，預告造成 11 點傷害。',
  },
];

export const ENEMY_GHOUL_HIGH_PRIEST: Enemy = {
  id: 'enemy_ghoul_high_priest',
  name: '食屍鬼大祭司',
  title: '納斯谷地底主祭',
  health: 48,
  maxHealth: 48,
  armor: 5,
  category: 'ghoul',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.ossuary_summoning],
  currentIntent: GHOUL_HIGH_PRIEST_INTENTS[0],
  intentSequence: GHOUL_HIGH_PRIEST_INTENTS,
  currentIntentIndex: 0,
};

export const WALLS_RAT_SWARM_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 2,
    hitCount: 3,
    name: '夾壁群鼠狂咬',
    description: '無數尖牙鼠群自牆壁裂縫狂湧而出，預告發動 3 次撕咬。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'bleed',
    name: '黑死菌毒感染',
    description: '鼠群利齒附著墓穴腐敗菌毒，預告向你施加 2 層【流血】印記。',
  },
  {
    type: 'defend',
    value: 6,
    name: '隱入磚石夾層',
    description: '尖叫聲中鼠群迅速隱入木板夾層躲避攻擊，預告獲得 6 點護甲。',
  },
  {
    type: 'attack',
    value: 7,
    name: '飢餓暴食撲襲',
    description: '被狂熱食慾驅使的鼠群匯聚撲咬，預告造成 7 點傷害。',
  },
];

export const ENEMY_WALLS_RAT_SWARM: Enemy = {
  id: 'enemy_walls_rat_swarm',
  name: '牆中變異鼠群',
  title: '陰暗夾壁的囓咬狂潮',
  health: 30,
  maxHealth: 30,
  armor: 0,
  category: 'rat_swarm',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.swarm_evasion],
  currentIntent: WALLS_RAT_SWARM_INTENTS[0],
  intentSequence: WALLS_RAT_SWARM_INTENTS,
  currentIntentIndex: 0,
};

export const CULTIST_ZEALOT_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 6,
    name: '生鏽砍刀揮斬',
    description: '狂信者揮動染血的生鏽砍刀，預告造成 6 點傷害。',
  },
  {
    type: 'erode',
    value: 2,
    name: '群星正位狂咒',
    description: '雙眼翻白頌唱古代污穢讚詞，預告侵蝕 2 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 5,
    name: '癲狂肉身屏障',
    description: '麻痺自身痛覺以血肉硬頂攻擊，預告獲得 5 點護甲。',
  },
  {
    type: 'attack',
    value: 8,
    name: '割腕獻祭怒擊',
    description: '割裂手腕以黑血塗抹刀刃發動突刺，預告造成 8 點傷害。',
  },
];

export const ENEMY_CULTIST_ZEALOT: Enemy = {
  id: 'enemy_cultist_zealot',
  name: '異教狂熱信徒',
  title: '盲目癡愚的獻祭者',
  health: 32,
  maxHealth: 32,
  armor: 2,
  category: 'cultist',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.blood_fanaticism],
  currentIntent: CULTIST_ZEALOT_INTENTS[0],
  intentSequence: CULTIST_ZEALOT_INTENTS,
  currentIntentIndex: 0,
};

export const CEMETERY_CARRION_WORM_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 5,
    name: '黏液環口咀嚼',
    description: '蠕蟲張開環形利齒噴出腐液撕咬，預告造成 5 點傷害。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'vulnerable',
    name: '屍臭瘴毒噴吐',
    description: '自環形口器深處噴吐綠色屍毒煙霧，預告向你施加 2 層【易傷】印記。',
  },
  {
    type: 'defend',
    value: 7,
    name: '死土鑽地收縮',
    description: '身軀鑽入鬆軟腐殖土層收緊角質環，預告獲得 7 點護甲。',
  },
  {
    type: 'attack',
    value: 7,
    name: '劇毒倒鉤抽擊',
    description: '龐大肉軀帶著銳利骨鉤重重甩動，預告造成 7 點傷害。',
  },
];

export const ENEMY_CEMETERY_CARRION_WORM: Enemy = {
  id: 'enemy_cemetery_carrion_worm',
  name: '墓穴腐生蠕蟲',
  title: '死土下的腐食巨蛆',
  health: 34,
  maxHealth: 34,
  armor: 3,
  category: 'ghoul',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.septic_carapace],
  currentIntent: CEMETERY_CARRION_WORM_INTENTS[0],
  intentSequence: CEMETERY_CARRION_WORM_INTENTS,
  currentIntentIndex: 0,
};

/* =========================================================
   Depth 2 (深潛者海蝕迷宮) Enemies
   ========================================================= */

export const DEEP_ONE_WARRIOR_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 9,
    name: '骨矛穿刺',
    description: '揮舞佈滿藤壺的粗糙骨矛，預告造成 9 點傷害。',
  },
  {
    type: 'defend',
    value: 7,
    name: '潮汐硬甲',
    description: '皮膚分泌黏液並收緊堅韌魚鱗，預告獲得 7 點護甲。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'bleed',
    name: '開膛鉤爪',
    description: '帶刺鰭爪橫掃而過撕裂傷口，預告向你施加 2 層【流血】印記。',
  },
  {
    type: 'attack',
    value: 11,
    name: '浪湧重擊',
    description: '藉著浪頭衝力奮力撞擊，預告造成 11 點傷害。',
  },
];

export const ENEMY_DEEP_ONE_WARRIOR: Enemy = {
  id: 'enemy_deep_one_warrior',
  name: '深潛者戰士',
  title: '礁岩海蝕巡獵者',
  health: 42,
  maxHealth: 42,
  armor: 4,
  category: 'deep_one',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.slippery_mucus],
  currentIntent: DEEP_ONE_WARRIOR_INTENTS[0],
  intentSequence: DEEP_ONE_WARRIOR_INTENTS,
  currentIntentIndex: 0,
};

export const DROWNED_SOUL_INTENTS: EnemyIntent[] = [
  {
    type: 'apply_status',
    value: 3,
    statusType: 'horror',
    name: '水下冰冷呼喚',
    description: '水底死者伸出浮腫青紫的手臂，預告向你施加 3 層【恐慌】印記。',
  },
  {
    type: 'erode',
    value: 3,
    drainStamina: 1,
    name: '窒息溺亡幻象',
    description: '冰冷海水灌入感知與肺腑，預告侵蝕 3 點理智牌庫並吸取 1 點精力。',
  },
  {
    type: 'attack',
    value: 8,
    name: '怨毒寒息',
    description: '呼出夾雜碎冰的刺骨怨風，預告造成 8 點傷害。',
  },
  {
    type: 'defend',
    value: 6,
    name: '虛無水幕',
    description: '幻化為透明海水消解實體，預告獲得 6 點護甲。',
  },
];

export const ENEMY_DROWNED_SOUL: Enemy = {
  id: 'enemy_drowned_soul',
  name: '溺死亡魂',
  title: '冰冷潮汐的哀鳴者',
  health: 38,
  maxHealth: 38,
  armor: 0,
  category: 'drowned',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.waterlogged_grip],
  currentIntent: DROWNED_SOUL_INTENTS[0],
  intentSequence: DROWNED_SOUL_INTENTS,
  currentIntentIndex: 0,
};

export const DEEP_ONE_ELDER_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 10,
    name: '珊瑚骨刺穿刺',
    description: '深潛者長老揮動鋒利的珊瑚骨刺，預告造成 10 點傷害。',
  },
  {
    type: 'erode',
    value: 3,
    name: '深海潮汐尖嘯',
    description: '深潛者長老張開鰓裂發出刺耳音波，預告侵蝕 3 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 8,
    name: '大袞庇護水盾',
    description: '調動深海黑水環繞周身，預告獲得 8 點護甲。',
  },
  {
    type: 'attack',
    value: 12,
    name: '深淵拍擊',
    description: '沉重的海獸鱗尾橫掃而來，預告造成 12 點傷害。',
  },
];

export const ENEMY_DEEP_ONE_ELDER: Enemy = {
  id: 'enemy_deep_one_elder',
  name: '深潛者長老',
  title: '舊日大袞的祭司',
  health: 46,
  maxHealth: 46,
  armor: 5,
  category: 'deep_one',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.slippery_mucus],
  currentIntent: DEEP_ONE_ELDER_INTENTS[0],
  intentSequence: DEEP_ONE_ELDER_INTENTS,
  currentIntentIndex: 0,
};

export const DAGON_CHAMPION_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 13,
    name: '玄鐵重戟橫掃',
    description: '沉重的黑鐵海戟呼嘯破空，預告造成 13 點傷害。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'vulnerable',
    name: '深海重壓震懾',
    description: '引發萬仞深海的恐怖重壓，預告向你施加 2 層【易傷】印記。',
  },
  {
    type: 'attack',
    value: 15,
    name: '狂暴潮汐刺擊',
    description: '全身肌肉緊繃發動雷霆穿刺，預告造成 15 點傷害。',
  },
  {
    type: 'defend',
    value: 10,
    name: '潮汐戰甲',
    description: '海流盤旋化作鋼鐵巨盾，預告獲得 10 點護甲。',
  },
  {
    type: 'erode',
    value: 3,
    name: '大袞神威咆哮',
    description: '狂暴咆哮震盪精神深淵，預告侵蝕 3 點理智牌庫。',
  },
];

export const ENEMY_DAGON_CHAMPION: Enemy = {
  id: 'enemy_dagon_champion',
  name: '達貢眷族督軍',
  title: '深淵王廷武侍',
  health: 68,
  maxHealth: 68,
  armor: 8,
  category: 'deep_one',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.slippery_mucus],
  currentIntent: DAGON_CHAMPION_INTENTS[0],
  intentSequence: DAGON_CHAMPION_INTENTS,
  currentIntentIndex: 0,
};

export const FRENZIED_DEEP_ONE_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 12,
    name: '狂躁雙爪亂舞',
    description: '變異巨爪瘋狂連擊，預告造成 12 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'bleed',
    name: '撕裂撕咬',
    description: '畸變利齒深深撕開皮肉，預告向你施加 3 層【流血】印記。',
  },
  {
    type: 'defend',
    value: 8,
    name: '畸變肉壁',
    description: '變異肌肉急速膨脹硬化，預告獲得 8 點護甲。',
  },
  {
    type: 'attack',
    value: 16,
    name: '深淵血怒崩擊',
    description: '燃燒體內古老神血爆發蠻力，預告造成 16 點傷害。',
  },
];

export const ENEMY_FRENZIED_DEEP_ONE: Enemy = {
  id: 'enemy_frenzied_deep_one',
  name: '狂暴深潛者',
  title: '瘋狂變異的海嗣',
  health: 62,
  maxHealth: 62,
  armor: 6,
  category: 'deep_one',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.slippery_mucus],
  currentIntent: FRENZIED_DEEP_ONE_INTENTS[0],
  intentSequence: FRENZIED_DEEP_ONE_INTENTS,
  currentIntentIndex: 0,
};

export const TIDAL_SIREN_INTENTS: EnemyIntent[] = [
  {
    type: 'erode',
    value: 3,
    drainStamina: 1,
    name: '誘溺海妖之歌',
    description: '自礁岩間傳出令人神魂顛倒的深海詠唱，預告侵蝕 3 點理智牌庫並吸取 1 點精力。',
  },
  {
    type: 'attack',
    value: 9,
    name: '帶刺海藻抽擊',
    description: '操縱浸泡毒液的堅韌海藻猛力抽打，預告造成 9 點傷害。',
  },
  {
    type: 'defend',
    value: 8,
    name: '水霧迷蹤退避',
    description: '召喚濃密海霧遮掩身形，預告獲得 8 點護甲。',
  },
  {
    type: 'attack',
    value: 11,
    name: '狂濤尖嘯暴擊',
    description: '面孔驟然撕裂化為尖牙巨口發動驚悚音爆，預告造成 11 點傷害。',
  },
];

export const ENEMY_TIDAL_SIREN: Enemy = {
  id: 'enemy_tidal_siren',
  name: '潮汐塞壬海妖',
  title: '海蝕礁岩的誘溺歌者',
  health: 40,
  maxHealth: 40,
  armor: 0,
  category: 'drowned',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.siren_lure],
  currentIntent: TIDAL_SIREN_INTENTS[0],
  intentSequence: TIDAL_SIREN_INTENTS,
  currentIntentIndex: 0,
};

export const INNSMOUTH_HYBRID_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 10,
    name: '生鏽魚叉突刺',
    description: '緊握鏽跡斑斑的捕鯨骨叉向前猛刺，預告造成 10 點傷害。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'bleed',
    name: '魚鱗開膛爪',
    description: '露出長滿硬鱗的手爪劃破血肉，預告向你施加 2 層【流血】印記。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'horror',
    name: '潮汐泥沼絆步',
    description: '踩踏海水泛起夾雜腐魚內臟的泥漿，預告向你施加 2 層【恐慌】印記。',
  },
  {
    type: 'attack',
    value: 11,
    name: '狂暴撲殺破甲',
    description: '眼白凸起以全身重量發動亡命衝撞，預告造成 11 點傷害。',
  },
];

export const ENEMY_INNSMOUTH_HYBRID: Enemy = {
  id: 'enemy_innsmouth_hybrid',
  name: '印斯茅斯混血種',
  title: '尚未完全退化的海嗣',
  health: 44,
  maxHealth: 44,
  armor: 3,
  category: 'deep_one',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.amphibious_vigor],
  currentIntent: INNSMOUTH_HYBRID_INTENTS[0],
  intentSequence: INNSMOUTH_HYBRID_INTENTS,
  currentIntentIndex: 0,
};

export const ABYSSAL_BARNACLE_MASS_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 8,
    name: '甲殼收縮咬合',
    description: '無數尖銳石灰質甲殼如利刃般同時咬合，預告造成 8 點傷害。',
  },
  {
    type: 'defend',
    value: 10,
    name: '石灰質硬化凝固',
    description: '分泌濃稠石灰質黏液加固軀殼，預告獲得 10 點護甲。',
  },
  {
    type: 'attack',
    value: 9,
    name: '倒刺觸鬚噴射',
    description: '自甲殼縫隙噴射出帶有倒鉤的纖維觸鬚，預告造成 9 點傷害。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'vulnerable',
    name: '腐蝕深海酸霧',
    description: '自氣孔噴出積蓄數百年的深海酸霧，預告向你施加 2 層【易傷】印記。',
  },
];

export const ENEMY_ABYSSAL_BARNACLE_MASS: Enemy = {
  id: 'enemy_abyssal_barnacle_mass',
  name: '深海寄生藤壺群',
  title: '礁岩活體寄生體',
  health: 46,
  maxHealth: 46,
  armor: 6,
  category: 'deep_one',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.razor_shell],
  currentIntent: ABYSSAL_BARNACLE_MASS_INTENTS[0],
  intentSequence: ABYSSAL_BARNACLE_MASS_INTENTS,
  currentIntentIndex: 0,
};

/* =========================================================
   Depth 3 (無底深淵祭壇) Enemies
   ========================================================= */

export const PROTO_SHOGGOTH_SPAWN_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 12,
    name: '原生質鞭笞',
    description: '黑色黏液觸手猛力抽打，預告造成 12 點傷害。',
  },
  {
    type: 'defend',
    value: 9,
    name: '膠質塑形硬化',
    description: '柔軟軀體瞬間凝結為堅硬晶石，預告獲得 9 點護甲。',
  },
  {
    type: 'erode',
    value: 3,
    name: '綠眼凝視',
    description: '黏液表面睜開數十隻熒綠眼珠，預告侵蝕 3 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 15,
    name: '泰克利利幼鳴碾壓',
    description: '發出尖銳笛音泰克利利向前擠壓，預告造成 15 點傷害。',
  },
];

export const ENEMY_PROTO_SHOGGOTH_SPAWN: Enemy = {
  id: 'enemy_proto_shoggoth_spawn',
  name: '原生黑泥幼體',
  title: '太古黏液裂片',
  health: 60,
  maxHealth: 60,
  armor: 6,
  category: 'shoggoth',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.amorphous_body],
  currentIntent: PROTO_SHOGGOTH_SPAWN_INTENTS[0],
  intentSequence: PROTO_SHOGGOTH_SPAWN_INTENTS,
  currentIntentIndex: 0,
};

export const BYAKHEE_ROTWING_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 13,
    name: '星間掠食俯衝',
    description: '拍打著破爛皮翼自高空極速俯衝，預告造成 13 點傷害。',
  },
  {
    type: 'apply_status',
    value: 2,
    statusType: 'vulnerable',
    name: '腐敗毒素注射',
    description: '口器注入星際腐化毒液，預告向你施加 2 層【易傷】印記。',
  },
  {
    type: 'erode',
    value: 3,
    name: '宇宙真空尖嘯',
    description: '發出超越人類聽覺的虛空刺耳嘯叫，預告侵蝕 3 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 16,
    name: '巨顎粉碎咬擊',
    description: '覆蓋死皮的巨顎狠狠合攏，預告造成 16 點傷害。',
  },
];

export const ENEMY_BYAKHEE_ROTWING: Enemy = {
  id: 'enemy_byakhee_rotwing',
  name: '拜亞基腐翼獸',
  title: '星間狂嚎死者',
  health: 56,
  maxHealth: 56,
  armor: 4,
  category: 'byakhee',
  currentIntent: BYAKHEE_ROTWING_INTENTS[0],
  intentSequence: BYAKHEE_ROTWING_INTENTS,
  currentIntentIndex: 0,
};

export const FORMLESS_SPAWN_INTENTS: EnemyIntent[] = [
  {
    type: 'apply_status',
    value: 3,
    statusType: 'bleed',
    name: '劇毒焦黑流質',
    description: '噴濺出腐蝕性極強的黑膠液體，預告向你施加 3 層【流血】印記。',
  },
  {
    type: 'attack',
    value: 12,
    name: '擬形重錘砸擊',
    description: '流質軀體驟然變形為黑鐵巨錘重擊，預告造成 12 點傷害。',
  },
  {
    type: 'defend',
    value: 10,
    name: '無定形流動吸收',
    description: '將打擊力量導入流質消散於無形，預告獲得 10 點護甲。',
  },
  {
    type: 'erode',
    value: 4,
    name: '睡神沉睡低鳴',
    description: '自流質核心迴盪出札特瓜的怠惰催眠，預告侵蝕 4 點理智牌庫。',
  },
];

export const ENEMY_FORMLESS_SPAWN: Enemy = {
  id: 'enemy_formless_spawn',
  name: '無形之子',
  title: '札特瓜的漆黑流質',
  health: 60,
  maxHealth: 60,
  armor: 5,
  category: 'formless',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.amorphous_body],
  currentIntent: FORMLESS_SPAWN_INTENTS[0],
  intentSequence: FORMLESS_SPAWN_INTENTS,
  currentIntentIndex: 0,
};

export const HOUND_OF_TINDALOS_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 14,
    name: '銳角空間突襲',
    description: '自空氣中不可能的角度憑空撲出，預告造成 14 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'horror',
    name: '不潔藍煙瀰漫',
    description: '自嘴角滲出非歐維度的惡臭青煙，預告向你施加 3 層【恐慌】印記。',
  },
  {
    type: 'erode',
    value: 4,
    name: '時間因果撕裂',
    description: '獵犬鎖定你過去與未來的時間線，預告侵蝕 4 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 16,
    name: '時空追獵絕殺',
    description: '無形巨顎咬碎現實屏障，預告造成 16 點傷害。',
  },
];

export const ENEMY_HOUND_OF_TINDALOS: Enemy = {
  id: 'enemy_hound_of_tindalos',
  name: '廷達洛斯獵犬',
  title: '非歐維度的獵殺者',
  health: 58,
  maxHealth: 58,
  armor: 6,
  category: 'hound',
  currentIntent: HOUND_OF_TINDALOS_INTENTS[0],
  intentSequence: HOUND_OF_TINDALOS_INTENTS,
  currentIntentIndex: 0,
};

export const ANCIENT_HOUND_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 17,
    name: '非歐幾何折疊重擊',
    description: '撕裂三維空間引發空間折疊爆震，預告造成 17 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'vulnerable',
    name: '維度錨定咒縛',
    description: '將你的坐標釘死在太古時間銳角上，預告向你施加 3 層【易傷】印記。',
  },
  {
    type: 'erode',
    value: 5,
    name: '太古螺旋時光侵蝕',
    description: '逼迫意識跨越無盡紀元的時間深淵，預告侵蝕 5 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 12,
    name: '銳角維度隱匿',
    description: '跨入小於九十度的維度裂隙，預告獲得 12 點護甲。',
  },
  {
    type: 'attack',
    value: 21,
    name: '永恆狂怒撕咬',
    description: '凝結無數紀元的死怨發動終結咬殺，預告造成 21 點毀滅打擊。',
  },
];

export const ENEMY_ANCIENT_HOUND: Enemy = {
  id: 'enemy_ancient_hound_of_tindalos',
  name: '廷達洛斯追獵古獸',
  title: '銳角的永恆追獵者',
  health: 90,
  maxHealth: 90,
  armor: 10,
  category: 'hound',
  currentIntent: ANCIENT_HOUND_INTENTS[0],
  intentSequence: ANCIENT_HOUND_INTENTS,
  currentIntentIndex: 0,
};

export const MIGO_SCOUT_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 13,
    name: '外科金屬鋸鉗',
    description: '昆蟲般的螯鉗高速震顫切削，預告造成 13 點傷害。',
  },
  {
    type: 'attack',
    value: 11,
    drainStamina: 1,
    name: '星際電弧放電',
    description: '自觸角末端釋放異星電弧，預告造成 11 點傷害並抽乾 1 點精力。',
  },
  {
    type: 'erode',
    value: 4,
    name: '真菌孢子迷霧',
    description: '散播自猶格斯星採集的致幻孢子，預告侵蝕 4 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 11,
    name: '甲殼膜翅震盪',
    description: '高速振動半透明膜翅偏轉打擊，預告獲得 11 點護甲。',
  },
];

export const ENEMY_MIGO_SCOUT: Enemy = {
  id: 'enemy_migo_scout',
  name: '米·戈偵察者',
  title: '猶格斯真菌甲殼生物',
  health: 54,
  maxHealth: 54,
  armor: 5,
  category: 'migo',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.surgical_bio_shock],
  currentIntent: MIGO_SCOUT_INTENTS[0],
  intentSequence: MIGO_SCOUT_INTENTS,
  currentIntentIndex: 0,
};

export const VOID_WANDERER_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 14,
    name: '相位虛空射線',
    description: '自扭曲的空間裂痕中導引冰冷虛空射線，預告造成 14 點傷害。',
  },
  {
    type: 'erode',
    value: 4,
    name: '空間因果撕裂',
    description: '跨維度拉扯調查員的神經突觸，預告侵蝕 4 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 12,
    name: '維度坍縮屏障',
    description: '將周遭空間折疊為絕對防護罩，預告獲得 12 點護甲。',
  },
  {
    type: 'attack',
    value: 16,
    name: '四維崩解打擊',
    description: '從不可能的死角引爆維度震波，預告造成 16 點毀滅打擊。',
  },
];

export const ENEMY_VOID_WANDERER: Enemy = {
  id: 'enemy_void_wanderer',
  name: '虛空漫遊者',
  title: '裂隙維度的無形殘影',
  health: 58,
  maxHealth: 58,
  armor: 4,
  category: 'formless',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.dimensional_phase],
  currentIntent: VOID_WANDERER_INTENTS[0],
  intentSequence: VOID_WANDERER_INTENTS,
  currentIntentIndex: 0,
};

export const OUTER_GOD_PIPER_INTENTS: EnemyIntent[] = [
  {
    type: 'erode',
    value: 5,
    name: '混沌無調笛音',
    description: '自骨笛孔洞吹出撕裂靈魂的刺耳長鳴，預告侵蝕 5 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 12,
    name: '盲目狂亂狂舞',
    description: '軟質身軀伴隨狂亂節奏抽搐揮打，預告造成 12 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'horror',
    name: '虛無心靈真空',
    description: '笛音陡然停頓引發極端死寂恐慌，預告向你施加 3 層【恐慌】印記。',
  },
  {
    type: 'attack',
    value: 15,
    name: '終焉音爆轟鳴',
    description: '笛音飆升至凡人耳膜破裂之極限音頻，預告造成 15 點傷害。',
  },
];

export const ENEMY_OUTER_GOD_PIPER: Enemy = {
  id: 'enemy_outer_god_piper',
  name: '外神盲目吹笛者',
  title: '無調笛音的侍從',
  health: 52,
  maxHealth: 52,
  armor: 2,
  category: 'formless',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.discordant_dirge],
  currentIntent: OUTER_GOD_PIPER_INTENTS[0],
  intentSequence: OUTER_GOD_PIPER_INTENTS,
  currentIntentIndex: 0,
};

/* =========================================================
   Depth 4 (星辰正位 · 拉萊耶核心) Enemies
   ========================================================= */

export const STAR_SPAWN_LARVA_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 17,
    name: '章魚觸鬚橫掃',
    description: '長滿吸盤的粗大黏液觸鬚呼嘯抽來，預告造成 17 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'horror',
    name: '星辰初醒意志',
    description: '散發出令凡人理智蒸發的舊日血脈威壓，預告向你施加 3 層【恐慌】印記。',
  },
  {
    type: 'erode',
    value: 4,
    name: '深海夢境殘響',
    description: '引動拉萊耶萬古夢魘的沉音，預告侵蝕 4 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 10,
    name: '星際甲殼',
    description: '初生體表覆蓋著堅韌的星際角質層，預告獲得 10 點護甲。',
  },
];

export const ENEMY_STAR_SPAWN_LARVA: Enemy = {
  id: 'enemy_star_spawn_larva',
  name: '星之眷族幼體',
  title: '沉睡之神的初生血脈',
  health: 80,
  maxHealth: 80,
  armor: 8,
  category: 'star_spawn',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.divine_immortality],
  currentIntent: STAR_SPAWN_LARVA_INTENTS[0],
  intentSequence: STAR_SPAWN_LARVA_INTENTS,
  currentIntentIndex: 0,
};

export const RLYEH_GUARD_INTENTS: EnemyIntent[] = [
  {
    type: 'defend',
    value: 12,
    name: '玄武岩巨盾聳立',
    description: '巨型綠色石碑如山般移轉抵擋打擊，預告獲得 12 點護甲。',
  },
  {
    type: 'attack',
    value: 18,
    name: '太古石門重砸',
    description: '撼動百萬噸重的非歐巨石無情砸落，預告造成 18 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'bleed',
    name: '巨石崩裂飛濺',
    description: '石棺碎塊如霰彈般四濺貫穿皮肉，預告向你施加 3 層【流血】印記。',
  },
  {
    type: 'attack',
    value: 20,
    name: '沉睡禁咒震撼',
    description: '釋放封存在石棺內的沉睡詛咒震擊，預告造成 20 點傷害。',
  },
];

export const ENEMY_RLYEH_GUARD: Enemy = {
  id: 'enemy_rlyeh_sarcophagus_guard',
  name: '拉萊耶石棺守衛',
  title: '非歐幾何巨石看守者',
  health: 80,
  maxHealth: 80,
  armor: 10,
  category: 'ancient_guardian',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.waterlogged_grip],
  currentIntent: RLYEH_GUARD_INTENTS[0],
  intentSequence: RLYEH_GUARD_INTENTS,
  currentIntentIndex: 0,
};

export const COSMIC_ACOLYTE_INTENTS: EnemyIntent[] = [
  {
    type: 'erode',
    value: 5,
    name: '群星正位誦歌',
    description: '頌唱迎接群星歸位的禁忌讚美詩，預告侵蝕 5 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 16,
    name: '虛空星火轟擊',
    description: '掌心匯聚黑色的星際冷焰炸裂而至，預告造成 16 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'vulnerable',
    name: '星光維度烙印',
    description: '以異界星光烙印你的肉體神經，預告向你施加 3 層【易傷】印記。',
  },
  {
    type: 'defend',
    value: 9,
    name: '虛無星雲障壁',
    description: '牽引無定形星雲環繞周身，預告獲得 9 點護甲。',
  },
];

export const ENEMY_COSMIC_ACOLYTE: Enemy = {
  id: 'enemy_cosmic_acolyte',
  name: '星辰古神侍從',
  title: '舊日低語的狂侍',
  health: 76,
  maxHealth: 76,
  armor: 6,
  category: 'cultist',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.zealous_blood_oath],
  currentIntent: COSMIC_ACOLYTE_INTENTS[0],
  intentSequence: COSMIC_ACOLYTE_INTENTS,
  currentIntentIndex: 0,
};

export const ANCIENT_GUARDIAN_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 21,
    name: '巨神黑曜刃劈砍',
    description: '雙手揮動長達十米的黑曜石巨劍怒斬，預告造成 21 點傷害。',
  },
  {
    type: 'apply_status',
    value: 4,
    statusType: 'horror',
    name: '萬古主宰威嚴',
    description: '釋放出沉睡之神親臨般的毀滅精神場，預告向你施加 4 層【恐慌】印記。',
  },
  {
    type: 'defend',
    value: 15,
    name: '非歐石壁禁錮',
    description: '喚起整座宮殿的幾何石柱形成絕對障壁，預告獲得 15 點護甲。',
  },
  {
    type: 'erode',
    value: 6,
    name: '群星崩解之嚎',
    description: '咆哮震裂星空與神經元突觸，預告侵蝕 6 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 25,
    name: '終極守護崩滅斬',
    description: '凝聚全部太古靈能斬破次元，預告造成 25 點毀滅傷害。',
  },
];

export const ENEMY_ANCIENT_GUARDIAN: Enemy = {
  id: 'enemy_ancient_eldritch_guardian',
  name: '舊日太古守護者',
  title: '拉萊耶沉睡之扉護衛',
  health: 120,
  maxHealth: 120,
  armor: 12,
  category: 'ancient_guardian',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.divine_immortality],
  currentIntent: ANCIENT_GUARDIAN_INTENTS[0],
  intentSequence: ANCIENT_GUARDIAN_INTENTS,
  currentIntentIndex: 0,
};

export const RLYEH_DREAM_APPARITION_INTENTS: EnemyIntent[] = [
  {
    type: 'erode',
    value: 5,
    name: '夢境深淵凝視',
    description: '凝視著你心靈最深處的恐懼根源，預告侵蝕 5 點理智牌庫。',
  },
  {
    type: 'attack',
    value: 17,
    name: '非歐幾何靈能衝擊',
    description: '釋放拉萊耶巨石沉入海底的毀滅引力波，預告造成 17 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'horror',
    name: '沉眠之神低語',
    description: '不可名狀的低語震盪心神，預告向你施加 3 層【恐慌】印記。',
  },
  {
    type: 'attack',
    value: 20,
    name: '超維意志湮滅',
    description: '調動星辰殘餘靈能實施毀滅性打擊，預告造成 20 點傷害。',
  },
];

export const ENEMY_RLYEH_DREAM_APPARITION: Enemy = {
  id: 'enemy_rlyeh_dream_apparition',
  name: '拉萊耶夢境具象',
  title: '舊日沉睡意識的具象化',
  health: 75,
  maxHealth: 75,
  armor: 6,
  category: 'star_spawn',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.oneiric_dread],
  currentIntent: RLYEH_DREAM_APPARITION_INTENTS[0],
  intentSequence: RLYEH_DREAM_APPARITION_INTENTS,
  currentIntentIndex: 0,
};

export const NON_EUCLIDEAN_CONSTRUCT_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 18,
    name: '綠石角柱砸擊',
    description: '撼動非歐角度生長的綠色玄武岩石柱橫掃，預告造成 18 點傷害。',
  },
  {
    type: 'defend',
    value: 14,
    name: '空間折疊閉合',
    description: '石塊結構反向折疊消隱實體，預告獲得 14 點護甲。',
  },
  {
    type: 'attack',
    value: 20,
    name: '悖論重力碾碎',
    description: '反轉局部重力將調查員狠狠摜向石壁，預告造成 20 點傷害。',
  },
  {
    type: 'apply_status',
    value: 3,
    statusType: 'vulnerable',
    name: '太古維度震盪',
    description: '巨石裂隙爆發超維強光，預告向你施加 3 層【易傷】印記。',
  },
];

export const ENEMY_NON_EUCLIDEAN_CONSTRUCT: Enemy = {
  id: 'enemy_non_euclidean_construct',
  name: '非歐幾何異構體',
  title: '崩塌維度的活體石塊',
  health: 78,
  maxHealth: 78,
  armor: 12,
  category: 'ancient_guardian',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.geometric_paradox],
  currentIntent: NON_EUCLIDEAN_CONSTRUCT_INTENTS[0],
  intentSequence: NON_EUCLIDEAN_CONSTRUCT_INTENTS,
  currentIntentIndex: 0,
};

export const COSMIC_PROPHET_INTENTS: EnemyIntent[] = [
  {
    type: 'attack',
    value: 16,
    name: '群星軌跡引爆',
    description: '引導星辰交匯之殘光引發劇烈爆炸，預告造成 16 點傷害。',
  },
  {
    type: 'erode',
    value: 5,
    name: '末日讖言侵蝕',
    description: '宣讀不可名狀之神甦醒的末日讖語，預告侵蝕 5 點理智牌庫。',
  },
  {
    type: 'defend',
    value: 10,
    name: '星界冷焰屏障',
    description: '以異界冷火環繞周身凝聚守護罩，預告獲得 10 點護甲。',
  },
  {
    type: 'attack',
    value: 22,
    name: '超新星狂怒震擊',
    description: '燃燒自身神經元釋放毀滅星爆，預告造成 22 點毀滅傷害。',
  },
];

export const ENEMY_COSMIC_PROPHET: Enemy = {
  id: 'enemy_cosmic_prophet',
  name: '終焉星辰先知',
  title: '群星歸位的宣講者',
  health: 72,
  maxHealth: 72,
  armor: 5,
  category: 'cultist',
  traits: [ELDRITCH_TRAIT_DEFINITIONS.prophecy_of_ruin],
  currentIntent: COSMIC_PROPHET_INTENTS[0],
  intentSequence: COSMIC_PROPHET_INTENTS,
  currentIntentIndex: 0,
};

/* =========================================================
   Enemy Pools by Depth
   ========================================================= */

export const DEPTH_1_NORMAL_ENEMIES: Enemy[] = [
  ENEMY_ARKHAM_CULTIST,
  ENEMY_GHOUL_LURKER,
  ENEMY_NIGHTGAUNT,
  ENEMY_WALLS_RAT_SWARM,
  ENEMY_CULTIST_ZEALOT,
  ENEMY_CEMETERY_CARRION_WORM,
];

export const DEPTH_1_ELITE_ENEMIES: Enemy[] = [
  ENEMY_GHOUL_HIGH_PRIEST,
  ENEMY_DEEP_ONE_ELDER,
];

export const DEPTH_2_NORMAL_ENEMIES: Enemy[] = [
  ENEMY_DEEP_ONE_WARRIOR,
  ENEMY_DROWNED_SOUL,
  ENEMY_DEEP_ONE_ELDER,
  ENEMY_TIDAL_SIREN,
  ENEMY_INNSMOUTH_HYBRID,
  ENEMY_ABYSSAL_BARNACLE_MASS,
];

export const DEPTH_2_ELITE_ENEMIES: Enemy[] = [
  ENEMY_DAGON_CHAMPION,
  ENEMY_FRENZIED_DEEP_ONE,
];

export const DEPTH_3_NORMAL_ENEMIES: Enemy[] = [
  ENEMY_PROTO_SHOGGOTH_SPAWN,
  ENEMY_BYAKHEE_ROTWING,
  ENEMY_FORMLESS_SPAWN,
  ENEMY_HOUND_OF_TINDALOS,
  ENEMY_MIGO_SCOUT,
  ENEMY_VOID_WANDERER,
  ENEMY_OUTER_GOD_PIPER,
];

export const DEPTH_3_ELITE_ENEMIES: Enemy[] = [
  ENEMY_ANCIENT_HOUND,
];

export const DEPTH_4_NORMAL_ENEMIES: Enemy[] = [
  ENEMY_STAR_SPAWN_LARVA,
  ENEMY_RLYEH_GUARD,
  ENEMY_COSMIC_ACOLYTE,
  ENEMY_RLYEH_DREAM_APPARITION,
  ENEMY_NON_EUCLIDEAN_CONSTRUCT,
  ENEMY_COSMIC_PROPHET,
];

export const DEPTH_4_ELITE_ENEMIES: Enemy[] = [
  ENEMY_ANCIENT_GUARDIAN,
];

/* =========================================================
   Enemy Master Registry & Lookup
   ========================================================= */

const ENEMY_CATALOG: Record<string, Enemy> = {
  // Depth 1
  [ENEMY_ARKHAM_CULTIST.id]: ENEMY_ARKHAM_CULTIST,
  [ENEMY_GHOUL_LURKER.id]: ENEMY_GHOUL_LURKER,
  [ENEMY_NIGHTGAUNT.id]: ENEMY_NIGHTGAUNT,
  [ENEMY_GHOUL_HIGH_PRIEST.id]: ENEMY_GHOUL_HIGH_PRIEST,
  [ENEMY_WALLS_RAT_SWARM.id]: ENEMY_WALLS_RAT_SWARM,
  [ENEMY_CULTIST_ZEALOT.id]: ENEMY_CULTIST_ZEALOT,
  [ENEMY_CEMETERY_CARRION_WORM.id]: ENEMY_CEMETERY_CARRION_WORM,

  // Depth 2
  [ENEMY_DEEP_ONE_WARRIOR.id]: ENEMY_DEEP_ONE_WARRIOR,
  [ENEMY_DROWNED_SOUL.id]: ENEMY_DROWNED_SOUL,
  [ENEMY_DEEP_ONE_ELDER.id]: ENEMY_DEEP_ONE_ELDER,
  [ENEMY_DAGON_CHAMPION.id]: ENEMY_DAGON_CHAMPION,
  [ENEMY_FRENZIED_DEEP_ONE.id]: ENEMY_FRENZIED_DEEP_ONE,
  [ENEMY_TIDAL_SIREN.id]: ENEMY_TIDAL_SIREN,
  [ENEMY_INNSMOUTH_HYBRID.id]: ENEMY_INNSMOUTH_HYBRID,
  [ENEMY_ABYSSAL_BARNACLE_MASS.id]: ENEMY_ABYSSAL_BARNACLE_MASS,

  // Depth 3
  [ENEMY_PROTO_SHOGGOTH_SPAWN.id]: ENEMY_PROTO_SHOGGOTH_SPAWN,
  [ENEMY_BYAKHEE_ROTWING.id]: ENEMY_BYAKHEE_ROTWING,
  [ENEMY_FORMLESS_SPAWN.id]: ENEMY_FORMLESS_SPAWN,
  [ENEMY_HOUND_OF_TINDALOS.id]: ENEMY_HOUND_OF_TINDALOS,
  [ENEMY_ANCIENT_HOUND.id]: ENEMY_ANCIENT_HOUND,
  [ENEMY_MIGO_SCOUT.id]: ENEMY_MIGO_SCOUT,
  [ENEMY_VOID_WANDERER.id]: ENEMY_VOID_WANDERER,
  [ENEMY_OUTER_GOD_PIPER.id]: ENEMY_OUTER_GOD_PIPER,

  // Depth 4
  [ENEMY_STAR_SPAWN_LARVA.id]: ENEMY_STAR_SPAWN_LARVA,
  [ENEMY_RLYEH_GUARD.id]: ENEMY_RLYEH_GUARD,
  [ENEMY_COSMIC_ACOLYTE.id]: ENEMY_COSMIC_ACOLYTE,
  [ENEMY_ANCIENT_GUARDIAN.id]: ENEMY_ANCIENT_GUARDIAN,
  [ENEMY_RLYEH_DREAM_APPARITION.id]: ENEMY_RLYEH_DREAM_APPARITION,
  [ENEMY_NON_EUCLIDEAN_CONSTRUCT.id]: ENEMY_NON_EUCLIDEAN_CONSTRUCT,
  [ENEMY_COSMIC_PROPHET.id]: ENEMY_COSMIC_PROPHET,

  // Bosses
  [INITIAL_SHOGGOTH.id]: { ...INITIAL_SHOGGOTH, category: 'boss' },
  [INITIAL_DAGON_PRIEST.id]: { ...INITIAL_DAGON_PRIEST, category: 'boss' },
  [INITIAL_COLOSSAL_SHOGGOTH.id]: { ...INITIAL_COLOSSAL_SHOGGOTH, category: 'boss' },
  [INITIAL_STAR_SPAWN.id]: { ...INITIAL_STAR_SPAWN, category: 'boss' },

  // Legacy aliases
  [INITIAL_GHOUL.id]: { ...INITIAL_GHOUL, category: 'ghoul' },
  [INITIAL_DEEP_ONE.id]: { ...INITIAL_DEEP_ONE, category: 'deep_one' },
};

/**
 * 取得全部已註冊的敵人原始模板映射表
 */
export function getAllRegisteredEnemies(): Record<string, Enemy> {
  return { ...ENEMY_CATALOG };
}

/**
 * 依敵人 ID 取得乾淨重置的敵人副本
 */
export function getEnemyTemplateById(id: string): Enemy | undefined {
  const template = ENEMY_CATALOG[id];
  if (!template) return undefined;
  return cloneEnemy(template);
}

/**
 * 依深度取得對應守關首領
 */
export function getBossByDepth(depth: DepthLevel = 1): Enemy {
  switch (depth) {
    case 2:
      return cloneEnemy(ENEMY_CATALOG[INITIAL_DAGON_PRIEST.id]);
    case 3:
      return cloneEnemy(ENEMY_CATALOG[INITIAL_COLOSSAL_SHOGGOTH.id]);
    case 4:
      return cloneEnemy(ENEMY_CATALOG[INITIAL_STAR_SPAWN.id]);
    case 1:
    default:
      return cloneEnemy(ENEMY_CATALOG[INITIAL_SHOGGOTH.id]);
  }
}

/**
 * 依深度與節點類型，隨機抽取對應怪物並回傳乾淨副本
 * 支援 excludeEnemyId 參數（可為單一 ID 或 ID 陣列），達成同一深度內防連續重複遭遇機制 (Issue #55)
 */
export function getEncounterEnemy(
  depth: DepthLevel = 1,
  nodeType: 'combat' | 'elite' | 'boss',
  randomFn: () => number = Math.random,
  excludeEnemyId?: string | string[]
): Enemy {
  if (nodeType === 'boss') {
    return getBossByDepth(depth);
  }

  const normalPools: Record<DepthLevel, Enemy[]> = {
    1: DEPTH_1_NORMAL_ENEMIES,
    2: DEPTH_2_NORMAL_ENEMIES,
    3: DEPTH_3_NORMAL_ENEMIES,
    4: DEPTH_4_NORMAL_ENEMIES,
  };

  const elitePools: Record<DepthLevel, Enemy[]> = {
    1: DEPTH_1_ELITE_ENEMIES,
    2: DEPTH_2_ELITE_ENEMIES,
    3: DEPTH_3_ELITE_ENEMIES,
    4: DEPTH_4_ELITE_ENEMIES,
  };

  const fullPool = nodeType === 'elite' ? elitePools[depth] ?? elitePools[1] : normalPools[depth] ?? normalPools[1];

  // 防連續重複遭遇：若候選池大於 1，且指定了欲排除的敵人 ID，則過濾排除該敵人
  const excluded = Array.isArray(excludeEnemyId)
    ? excludeEnemyId
    : excludeEnemyId
    ? [excludeEnemyId]
    : [];

  const eligiblePool =
    excluded.length > 0 && fullPool.length > 1
      ? fullPool.filter((e) => !excluded.includes(e.id))
      : fullPool;

  const pool = eligiblePool.length > 0 ? eligiblePool : fullPool;
  const index = Math.floor(randomFn() * pool.length);
  const selected = pool[Math.min(index, pool.length - 1)];

  return cloneEnemy(selected);
}
