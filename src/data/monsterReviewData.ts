export interface MonsterReviewData {
  id: string;
  name: string;
  title: string;
  depth: 1 | 2 | 3 | 4;
  role: 'normal' | 'elite' | 'boss';
  health: number;
  armor: number;
  category: string;
  imageUrl?: string;
  realisticUrl?: string;
  trait: {
    name: string;
    description: string;
    trigger: string;
  };
  intents: Array<{
    name: string;
    type: 'attack' | 'erode' | 'defend' | 'apply_status';
    value: number;
    statusType?: string;
    description: string;
  }>;
  tacticalTips: {
    threatSummary: string;
    recommendedCards: string[];
    strategy: string;
  };
}

export const MONSTERS_BY_DEPTH: Record<1 | 2 | 3 | 4, MonsterReviewData[]> = {
  // ==========================================
  // 【第一深度 · 阿卡姆封鎖區】
  // ==========================================
  1: [
    {
      id: 'enemy_arkham_cultist',
      name: '阿卡姆異教徒',
      title: '狂熱的舊日崇拜者',
      depth: 1,
      role: 'normal',
      health: 28,
      armor: 0,
      category: 'cultist',
      imageUrl: '/enemies/cartoon/enemy_arkham_cultist.png',
      realisticUrl: '/enemies/realistic/enemy_arkham_cultist.png',
      trait: {
        name: '狂熱血契 (Zealous Blood Oath)',
        description: '受到肉體打擊時信仰加劇，每累計受到 6 點傷害自動獲得 1 層【力量】。',
        trigger: '血量低於 40% 時發動【盲目血祭】，消耗自身 4 點生命向玩家施加 2 層流血與 1 層易傷。',
      },
      intents: [
        { name: '儀式匕首刺擊', type: 'attack', value: 6, description: '造成 6 點傷害' },
        { name: '割脈血祭', type: 'apply_status', value: 2, statusType: 'bleed', description: '施加 2 層【流血】' },
        { name: '狂信護身', type: 'defend', value: 6, description: '獲得 6 點護甲' },
        { name: '盲目突刺', type: 'attack', value: 8, description: '造成 8 點傷害' },
      ],
      tacticalTips: {
        threatSummary: '若無法迅速斬殺，會透過受傷自殘疊加力量，攻擊力越滾越高。',
        recommendedCards: ['鉛頭手杖 (消力量)', '雙管獵槍 (高額斬殺)', '重拳壓制 (破勢)'],
        strategy: '使用【鉛頭手杖】及時消除其力量增益，或在殘血前一發雙管獵槍直接擊殺，避免其觸發血祭。',
      },
    },
    {
      id: 'enemy_ghoul_lurker',
      name: '食屍鬼潛伏者',
      title: '墓穴的腐食者',
      depth: 1,
      role: 'normal',
      health: 32,
      armor: 2,
      category: 'ghoul',
      imageUrl: '/enemies/cartoon/enemy_ghoul_lurker.png',
      realisticUrl: '/enemies/realistic/enemy_ghoul_lurker.png',
      trait: {
        name: '食腐本能 (Carrion Feeder)',
        description: '爪擊命中帶有【流血】印記的調查員時，直接恢復等同於造成傷害 50% 的生命值（吸血續航）。',
        trigger: '優先發動撕咬施加流血，隨後投擲墓泥侵蝕理智並干擾抽牌。',
      },
      intents: [
        { name: '腐臭爪擊', type: 'attack', value: 6, description: '造成 6 點傷害' },
        { name: '墓穴死寂恐嚇', type: 'erode', value: 2, description: '侵蝕 2 點理智牌庫' },
        { name: '狂暴撕咬', type: 'attack', value: 8, description: '造成 8 點傷害' },
        { name: '硬化皮層', type: 'defend', value: 5, description: '獲得 5 點護甲' },
      ],
      tacticalTips: {
        threatSummary: '一旦調查員身上帶有流血狀態，食屍鬼會透過攻擊持續吸血，戰鬥易陷入拖延。',
        recommendedCards: ['醫療鎮定劑 (淨化流血)', '戰地急救繃帶 (解流血)', '軍刀突刺 (穿刺)'],
        strategy: '及時打出【醫療鎮定劑】消除自身的流血印記，徹底截斷其吸血來源。',
      },
    },
    {
      id: 'enemy_nightgaunt',
      name: '夜魘捕獵者',
      title: '無貌的黑翼捕食者',
      depth: 1,
      role: 'normal',
      health: 30,
      armor: 0,
      category: 'nightgaunt',
      imageUrl: '/enemies/cartoon/enemy_nightgaunt.png',
      realisticUrl: '/enemies/realistic/enemy_nightgaunt.png',
      trait: {
        name: '無面深淵 (Faceless Terror)',
        description: '所有理智侵蝕攻擊【無視調查員物理護甲】，直接撕裂心靈牌庫。',
        trigger: '侵蝕成功後觸發陰影滑翔，自身獲得 6 點迴避護甲。',
      },
      intents: [
        { name: '無面深淵凝視', type: 'apply_status', value: 2, statusType: 'horror', description: '施加 2 層【恐慌】' },
        { name: '黑曜石尾針戳刺', type: 'attack', value: 7, description: '造成 7 點傷害' },
        { name: '高空心靈下墜', type: 'erode', value: 2, description: '侵蝕 2 點理智牌庫（無視護甲）' },
        { name: '幽冥迷蹤', type: 'defend', value: 6, description: '獲得 6 點護甲' },
      ],
      tacticalTips: {
        threatSummary: '防禦護甲無法抵擋其心靈侵蝕，極易在前期被迅速抽乾理智牌庫。',
        recommendedCards: ['深呼吸 (補牌庫)', '舊日殘頁 (擴充理智)', '雙發速射 (快攻斬殺)'],
        strategy: '不要過度浪費精力在純防禦上，加速傾瀉戰鬥傷害將其速殺，並用【深呼吸】回補理智。',
      },
    },
    {
      id: 'enemy_walls_rat_swarm',
      name: '牆中變異鼠群',
      title: '陰暗夾壁的囓咬狂潮',
      depth: 1,
      role: 'normal',
      health: 30,
      armor: 0,
      category: 'rat_swarm',
      imageUrl: '/enemies/cartoon/enemy_walls_rat_swarm.png',
      realisticUrl: '/enemies/realistic/enemy_walls_rat_swarm.png',
      trait: {
        name: '鼠群竄動 (Swarm Evasion)',
        description: '無數尖牙鼠群在夾壁中四散躲避，受到物理攻擊時減免 2 點傷害（最低承受 1 點傷害）；但受到魔法卡牌攻擊時承受額外 3 點震波傷害。',
        trigger: '物理攻擊減傷 2 點，魔法卡牌攻擊增傷 3 點。',
      },
      intents: [
        { name: '夾壁群鼠狂咬', type: 'attack', value: 5, description: '造成 5 點傷害' },
        { name: '狂犬疫病傳播', type: 'apply_status', value: 2, statusType: 'bleed', description: '施加 2 層【流血】' },
        { name: '破牆四散逃竄', type: 'defend', value: 6, description: '獲得 6 點護甲' },
        { name: '瘋狂囓咬群襲', type: 'attack', value: 7, description: '造成 7 點傷害' },
      ],
      tacticalTips: {
        threatSummary: '物理打擊會被大量鼠群分散減傷，多段低傷物理極度吃虧。',
        recommendedCards: ['靈能衝擊 (法術額外+3傷)', '深淵靈能撕裂 (法術震波)', '燃燒瓶 (範圍AOE)'],
        strategy: '優先使用學者或秘術系【法術卡牌】，觸發其弱點額外造成 3 點震波傷害迅速清場。',
      },
    },
    {
      id: 'enemy_cultist_zealot',
      name: '異教狂熱信徒',
      title: '盲目癡愚的獻祭者',
      depth: 1,
      role: 'normal',
      health: 32,
      armor: 2,
      category: 'cultist',
      imageUrl: '/enemies/cartoon/enemy_cultist_zealot.png',
      realisticUrl: '/enemies/realistic/enemy_cultist_zealot.png',
      trait: {
        name: '狂信之血 (Blood Fanaticism)',
        description: '開局自帶狂信意志；生命值低於 50% 時攻擊附帶精神侵蝕，每次攻擊額外侵蝕 1 點理智牌庫。',
        trigger: '生命值低於 50% 時狂暴化，所有攻擊追加理智侵蝕。',
      },
      intents: [
        { name: '生鏽砍刀揮斬', type: 'attack', value: 6, description: '造成 6 點傷害' },
        { name: '群星正位狂咒', type: 'erode', value: 2, description: '侵蝕 2 點理智牌庫' },
        { name: '癲狂肉身屏障', type: 'defend', value: 5, description: '獲得 5 點護甲' },
        { name: '割腕獻祭怒擊', type: 'attack', value: 8, description: '造成 8 點傷害' },
      ],
      tacticalTips: {
        threatSummary: '半血以下進入狂暴態，平砍也會撕裂理智牌庫，拖延戰鬥極度危險。',
        recommendedCards: ['雙管獵槍 (高額斬殺)', '弱點狙擊 (一槍斃命)', '軍刀突刺'],
        strategy: '在血量降至半血前積蓄爆發卡牌，一擊越過狂暴血線將其斬殺。',
      },
    },
    {
      id: 'enemy_cemetery_carrion_worm',
      name: '墓穴腐生蠕蟲',
      title: '死土下的腐食巨蛆',
      depth: 1,
      role: 'normal',
      health: 34,
      armor: 3,
      category: 'ghoul',
      imageUrl: '/enemies/cartoon/enemy_cemetery_carrion_worm.png',
      realisticUrl: '/enemies/realistic/enemy_cemetery_carrion_worm.png',
      trait: {
        name: '腐殖外皮 (Septic Carapace)',
        description: '體表覆蓋著厚重死土與腐殖黏液，受物理肉搏攻擊時濺射腐毒，使調查員獲得 1 層【易傷】。',
        trigger: '受到物理肉搏攻擊時對調查員施加 1 層易傷。',
      },
      intents: [
        { name: '黏液環口咀嚼', type: 'attack', value: 5, description: '造成 5 點傷害' },
        { name: '屍臭瘴毒噴吐', type: 'apply_status', value: 2, statusType: 'vulnerable', description: '施加 2 層【易傷】' },
        { name: '死土鑽地收縮', type: 'defend', value: 7, description: '獲得 7 點護甲' },
        { name: '劇毒倒鉤抽擊', type: 'attack', value: 7, description: '造成 7 點傷害' },
      ],
      tacticalTips: {
        threatSummary: '物理肉搏會被反彈易傷，疊加易傷後其抽擊與噴吐傷害倍增。',
        recommendedCards: ['快速拔槍 (遠程射擊避開接觸)', '法術轟擊', '醫療鎮定劑'],
        strategy: '使用遠程槍械或法術進行非接觸打擊，避免近戰肉搏沾染腐殖毒液。',
      },
    },
    {
      id: 'enemy_ghoul_high_priest',
      name: '食屍鬼大祭司',
      title: '褻瀆墓穴長老',
      depth: 1,
      role: 'elite',
      health: 52,
      armor: 6,
      category: 'ghoul',
      imageUrl: '/enemies/cartoon/enemy_ghoul_high_priest.png',
      realisticUrl: '/enemies/realistic/enemy_ghoul_high_priest.png',
      trait: {
        name: '白骨聚生 (Ossuary Summoning)',
        description: '每 3 回合凝聚死者顱骨獲得 10 點堅固骨甲；若骨甲被打破則引發屍氣爆裂施加易傷。',
        trigger: '揮舞權杖造成複合重擊，並伴隨刺耳的地底尖嘯重度侵蝕心智。',
      },
      intents: [
        { name: '褻瀆骨杖重擊', type: 'attack', value: 9, description: '造成 9 點傷害' },
        { name: '白骨甲殼咒', type: 'defend', value: 10, description: '獲得 10 點白骨護甲' },
        { name: '地底深淵尖嘯', type: 'erode', value: 3, description: '侵蝕 3 點理智牌庫' },
        { name: '狂暴撕咬', type: 'attack', value: 12, description: '造成 12 點重擊傷害' },
      ],
      tacticalTips: {
        threatSummary: '血厚甲厚，同時具備 12 點重擊與 3 點心智侵蝕，是第一深度最強門檻。',
        recommendedCards: ['泵動式散彈槍 (碎骨甲)', '軍刀突刺 (穿刺直扣生命)', '戰術翻滾'],
        strategy: '使用【泵動式散彈槍】直接打碎其 10 點骨甲觸發反噬，或用【軍刀突刺】無視骨甲直接壓低血量。',
      },
    },
    {
      id: 'enemy_shoggoth_progeny',
      name: '修格斯幼體 (首領)',
      title: '太古原生質原生體',
      depth: 1,
      role: 'boss',
      health: 60,
      armor: 6,
      category: 'boss',
      imageUrl: '/enemies/cartoon/enemy_shoggoth_progeny.png',
      trait: {
        name: '原生黏液 (Protoplasmic Slime)',
        description: '受到單次超過 12 點的巨額傷害時，分泌黏液吸收 30% 傷害，並對調查員施加 1 層恐慌。',
        trigger: '每 3 回合發動【Tekeli-li 泰山壓頂】，造成 14 點巨大碾壓傷害。',
      },
      intents: [
        { name: '原生質重拳拍擊', type: 'attack', value: 8, description: '造成 8 點傷害' },
        { name: '多目恐懼凝視', type: 'erode', value: 3, description: '侵蝕 3 點理智牌庫' },
        { name: '黏液硬化護層', type: 'defend', value: 8, description: '獲得 8 點護甲' },
        { name: 'Tekeli-li 碾壓', type: 'attack', value: 14, description: '蓄力毀滅重壓 14 傷害' },
      ],
      tacticalTips: {
        threatSummary: '第一深度關底首領！重擊威脅極大，且帶有黏液反震。',
        recommendedCards: ['就地掩蔽 (蓄力蓄甲)', '重拳壓制 (破勢 -30%)', '雙發速射 (分段打擊規避反噬)'],
        strategy: '在 Tekeli-li 碾壓前夕打出【重拳壓制】降低其 30% 傷害，並打出蓄滿層數的【就地掩蔽】安全化解。',
      },
    },
  ],

  // ==========================================
  // 【第二深度 · 深潛者海蝕迷宮】
  // ==========================================
  2: [
    {
      id: 'enemy_deep_one_warrior',
      name: '深潛者戰士',
      title: '大袞的巡弋近衛',
      depth: 2,
      role: 'normal',
      health: 42,
      armor: 4,
      category: 'deep_one',
      trait: {
        name: '滑膩黏液 (Slippery Mucus)',
        description: '滑膩帶鱗的皮膚能偏轉輕微打擊，單次受到小於等於 4 點的微小物理傷害被【完全無效化】！',
        trigger: '逼迫調查員使用高傷重武器、穿刺攻擊或紫色秘術法術破防。',
      },
      intents: [
        { name: '骨矛穿刺', type: 'attack', value: 9, description: '造成 9 點傷害' },
        { name: '海潮撕裂', type: 'apply_status', value: 2, statusType: 'bleed', description: '施加 2 層【流血】' },
        { name: '魚鱗偏斜', type: 'defend', value: 8, description: '獲得 8 點護甲' },
      ],
      tacticalTips: {
        threatSummary: '輕度打擊（如單發 4 點平 A）會被完全彈開，刮痧流派的噩夢。',
        recommendedCards: ['軍刀突刺 (穿刺無視免疫)', '雙管獵槍 (16傷重轟)', '靈能衝擊 (法術無視物理皮甲)'],
        strategy: '切忌使用單段 4 傷以下小技能，果斷使用【軍刀突刺】或高傷武器直接破防。',
      },
    },
    {
      id: 'enemy_drowned_soul',
      name: '溺亡者魂魄',
      title: '深淵冰冷寒靈',
      depth: 2,
      role: 'normal',
      health: 36,
      armor: 0,
      category: 'drowned',
      trait: {
        name: '水下寒骨 (Waterlogged Grip)',
        description: '散發刺骨冰冷，使調查員每回合開始時額外承受 1 層【恐慌】。',
        trigger: '施展【溺水窒息】，除造成 8 點傷害外，抽乾調查員 1 點精力。',
      },
      intents: [
        { name: '冰冷水鬼爪', type: 'attack', value: 7, description: '造成 7 點傷害' },
        { name: '溺水窒息', type: 'attack', value: 8, description: '造成 8 點傷害並消耗精力' },
        { name: '水下悲鳴', type: 'erode', value: 3, description: '侵蝕 3 點理智牌庫' },
      ],
      tacticalTips: {
        threatSummary: '每回合被動累積恐慌，且抽乾精力會嚴重干擾出牌節奏。',
        recommendedCards: ['醫療鎮定劑 (解恐慌)', '快速拔槍 (0費調度)', '弱點狙擊 (速殺)'],
        strategy: '優先擊殺，使用【醫療鎮定劑】在關鍵爆發前解掉恐慌。',
      },
    },
    {
      id: 'enemy_innsmouth_hybrid',
      name: '印斯茅斯混血種',
      title: '尚未完全退化的海嗣',
      depth: 2,
      role: 'normal',
      health: 44,
      armor: 3,
      category: 'deep_one',
      imageUrl: '/enemies/cartoon/enemy_innsmouth_hybrid.png',
      realisticUrl: '/enemies/realistic/enemy_innsmouth_hybrid.png',
      trait: {
        name: '兩棲畸變 (Amphibious Vigor)',
        description: '濕滑的畸形魚鱗能偏轉微小打擊，單次受到小於等於 4 點的物理傷害完全無效化。',
        trigger: '單次受到小於等於 4 點的物理傷害完全無效。',
      },
      intents: [
        { name: '生鏽魚叉突刺', type: 'attack', value: 10, description: '造成 10 點傷害' },
        { name: '魚鱗開膛爪', type: 'apply_status', value: 2, statusType: 'bleed', description: '施加 2 層【流血】' },
        { name: '潮汐泥沼絆步', type: 'apply_status', value: 2, statusType: 'horror', description: '施加 2 層【恐慌】' },
        { name: '狂暴撲殺破甲', type: 'attack', value: 11, description: '造成 11 點傷害' },
      ],
      tacticalTips: {
        threatSummary: '刮痧打擊無效，魚叉突刺與撲殺輸出兇猛且帶流血與恐慌雙重干擾。',
        recommendedCards: ['軍刀突刺 (穿刺破防)', '雙管獵槍 (高額重轟)', '重拳壓制'],
        strategy: '果斷使用高傷單次輸出打破魚鱗偏斜，儘早擊殺避免流血疊加。',
      },
    },
    {
      id: 'enemy_tidal_siren',
      name: '潮汐塞壬海妖',
      title: '海蝕礁岩的誘溺歌者',
      depth: 2,
      role: 'normal',
      health: 40,
      armor: 0,
      category: 'drowned',
      imageUrl: '/enemies/cartoon/enemy_tidal_siren.png',
      realisticUrl: '/enemies/realistic/enemy_tidal_siren.png',
      trait: {
        name: '惑心溺音 (Siren Lure)',
        description: '哀傷魅惑的深海歌聲縈繞心神，每回合開始時使調查員獲得 1 層【恐慌】；受擊時發出音波反彈 1 點傷害。',
        trigger: '每回合被動施加 1 層恐慌，受擊反彈 1 點接觸傷害。',
      },
      intents: [
        { name: '誘溺海妖之歌', type: 'erode', value: 3, description: '侵蝕 3 點理智牌庫並吸取 1 點精力' },
        { name: '帶刺海藻抽擊', type: 'attack', value: 9, description: '造成 9 點傷害' },
        { name: '水霧迷蹤退避', type: 'defend', value: 8, description: '獲得 8 點護甲' },
        { name: '狂濤尖嘯暴擊', type: 'attack', value: 11, description: '造成 11 點傷害' },
      ],
      tacticalTips: {
        threatSummary: '每回合吸取精力並侵蝕理智，歌聲自帶恐慌與受擊反傷。',
        recommendedCards: ['快速拔槍 (搶先手速殺)', '醫療鎮定劑 (解恐慌)', '雙發速射'],
        strategy: '不要與其持久戰，起手交出高傷輸出速殺塞壬，防止精力被抽乾導致卡手。',
      },
    },
    {
      id: 'enemy_abyssal_barnacle_mass',
      name: '深海寄生藤壺群',
      title: '礁岩活體寄生體',
      depth: 2,
      role: 'normal',
      health: 46,
      armor: 6,
      category: 'deep_one',
      imageUrl: '/enemies/cartoon/enemy_abyssal_barnacle_mass.png',
      realisticUrl: '/enemies/realistic/enemy_abyssal_barnacle_mass.png',
      trait: {
        name: '銳刃甲殼 (Razor Shell)',
        description: '密集的寄生藤壺甲殼如刀刃般生長，受到物理肉搏攻擊時反彈 2 點割裂傷害。',
        trigger: '受到物理肉搏攻擊時反彈 2 點割裂傷害。',
      },
      intents: [
        { name: '甲殼收縮咬合', type: 'attack', value: 8, description: '造成 8 點傷害' },
        { name: '石灰質硬化凝固', type: 'defend', value: 10, description: '獲得 10 點護甲' },
        { name: '倒刺觸鬚噴射', type: 'attack', value: 9, description: '造成 9 點傷害' },
        { name: '腐蝕深海酸霧', type: 'apply_status', value: 2, statusType: 'vulnerable', description: '施加 2 層【易傷】' },
      ],
      tacticalTips: {
        threatSummary: '甲殼極厚且自帶物理反傷，配合易傷酸霧會讓防線迅速崩潰。',
        recommendedCards: ['泵動式散彈槍 (碎盾)', '靈能衝擊 (法術無視甲殼)', '軍刀突刺'],
        strategy: '使用散彈槍擊碎其 10 點石灰質硬甲，或使用法術傷害繞過反傷機制。',
      },
    },
    {
      id: 'enemy_deep_one_elder',
      name: '深潛者長老',
      title: '太古海裔主祭',
      depth: 2,
      role: 'elite',
      health: 58,
      armor: 8,
      category: 'deep_one',
      trait: {
        name: '太古鱗甲 (Ancient Carapace)',
        description: '受擊時反彈 2 點接觸傷害；生命低於 50% 時召喚深海迷霧獲得 12 點護甲。',
        trigger: '交替吟唱海嘯潮汐咒文與投擲珊瑚三叉戟。',
      },
      intents: [
        { name: '珊瑚三叉戟刺擊', type: 'attack', value: 11, description: '造成 11 點傷害' },
        { name: '大袞海蝕秘咒', type: 'erode', value: 4, description: '侵蝕 4 點理智牌庫' },
        { name: '深海玄武岩護盾', type: 'defend', value: 12, description: '獲得 12 點護甲' },
      ],
      tacticalTips: {
        threatSummary: '多段攻擊打在長老身上會被反彈多次傷害，心智侵蝕高達 4 點。',
        recommendedCards: ['弱點狙擊 (單次致命爆發)', '泵動式散彈槍 (碎盾)', '極限精神錨定'],
        strategy: '避免使用低傷多段攻擊，改用【戰術佯攻】+【弱點狙擊】單次打出 24 點直接斬殺。',
      },
    },
    {
      id: 'enemy_dagon_priest',
      name: '大袞的深淵祭司 (首領)',
      title: '海潮主宰大主教',
      depth: 2,
      role: 'boss',
      health: 85,
      armor: 8,
      category: 'boss',
      trait: {
        name: '大袞潮汐 (Tide of Father Dagon)',
        description: '奇數回合【潮漲】獲得 16 點潮汐護甲；偶數回合【潮退】，若殘留護甲，將剩餘護甲全額轉化為等量【海嘯衝擊】傷害反噬調查員！',
        trigger: '迫使調查員在奇數回合傾瀉所有輸出破盾，否則偶數回合將面臨滅頂之災。',
      },
      intents: [
        { name: '海潮湧動 (潮漲)', type: 'defend', value: 16, description: '獲得 16 點潮汐護甲 (蓄力)' },
        { name: '滅世海嘯 (潮退)', type: 'attack', value: 14, description: '造成 14 基礎傷害 + 剩餘護甲轉化衝擊' },
        { name: '深淵三叉戟橫掃', type: 'attack', value: 12, description: '造成 12 點傷害' },
        { name: '深海溺亡詛咒', type: 'erode', value: 4, description: '侵蝕 4 點理智牌庫' },
      ],
      tacticalTips: {
        threatSummary: '第二深度最強機制怪！如果奇數回合沒破掉 16 點護盾，偶數回合的海嘯傷害會高達 25+！',
        recommendedCards: ['泵動式散彈槍 (一槍擊碎所有護甲)', '深淵靈能撕裂 (破甲50%)', '護甲猛擊'],
        strategy: '只要手牌留一張【泵動式散彈槍】，在奇數回合一槍打碎其所有潮汐護甲，偶數回合的海嘯便不攻自破！',
      },
    },
  ],

  // ==========================================
  // 【第三深度 · 無底深淵祭壇】
  // ==========================================
  3: [
    {
      id: 'enemy_migo_scout',
      name: '米·戈偵察者',
      title: '猶格斯真菌甲殼生物',
      depth: 3,
      role: 'normal',
      health: 54,
      armor: 5,
      category: 'migo',
      imageUrl: '/enemies/cartoon/enemy_migo_scout.png',
      realisticUrl: '/enemies/realistic/enemy_migo_scout.png',
      trait: {
        name: '真菌外科術 (Surgical Bio Shock)',
        description: '米·戈的星際解剖與電漿科技，意圖攻擊時可抽乾調查員精力並麻痺神經。',
        trigger: '特殊攻擊命中時抽乾調查員 1 點精力並侵蝕理智。',
      },
      intents: [
        { name: '外星手術鉗鉗夾', type: 'attack', value: 10, description: '造成 10 點傷害' },
        { name: '星際電弧放電', type: 'attack', value: 11, description: '造成 11 點傷害並抽乾 1 點精力' },
        { name: '真菌孢子迷霧', type: 'erode', value: 4, description: '侵蝕 4 點理智牌庫' },
        { name: '甲殼膜翅震盪', type: 'defend', value: 11, description: '獲得 11 點護甲' },
      ],
      tacticalTips: {
        threatSummary: '星際電弧抽乾精力極度致命，孢子迷霧侵蝕 4 點理智。',
        recommendedCards: ['雙發速射 (快攻打斷)', '就地掩蔽', '戰地急救繃帶'],
        strategy: '留存 0 費卡牌以應對精力被抽乾的情況，盡快破除膜翅護甲將其擊殺。',
      },
    },
    {
      id: 'enemy_void_wanderer',
      name: '虛空漫遊者',
      title: '裂隙維度的無形殘影',
      depth: 3,
      role: 'normal',
      health: 58,
      armor: 4,
      category: 'formless',
      imageUrl: '/enemies/cartoon/enemy_void_wanderer.png',
      realisticUrl: '/enemies/realistic/enemy_void_wanderer.png',
      trait: {
        name: '維度相位 (Dimensional Phase)',
        description: '身形向四維空間折疊，每 3 回合相位隱匿獲得 12 點相位護甲。',
        trigger: '每 3 回合進入空間折疊獲得 12 點護甲。',
      },
      intents: [
        { name: '相位虛空射線', type: 'attack', value: 14, description: '造成 14 點傷害' },
        { name: '空間因果撕裂', type: 'erode', value: 4, description: '侵蝕 4 點理智牌庫' },
        { name: '維度坍縮屏障', type: 'defend', value: 12, description: '獲得 12 點護甲' },
        { name: '四維崩解打擊', type: 'attack', value: 16, description: '造成 16 點毀滅打擊' },
      ],
      tacticalTips: {
        threatSummary: '16 點四維打擊配合 4 點心靈撕裂，且自帶維度護甲。',
        recommendedCards: ['不可侵犯之壁 (留存護盾)', '深淵靈能撕裂 (真實傷害)', '弱點狙擊'],
        strategy: '在其蓄力四維打擊時做好全額護盾防護，把握其護甲間隙全力爆發。',
      },
    },
    {
      id: 'enemy_outer_god_piper',
      name: '外神盲目吹笛者',
      title: '無調笛音的侍從',
      depth: 3,
      role: 'normal',
      health: 52,
      armor: 2,
      category: 'formless',
      imageUrl: '/enemies/cartoon/enemy_outer_god_piper.png',
      realisticUrl: '/enemies/realistic/enemy_outer_god_piper.png',
      trait: {
        name: '無調輓歌 (Discordant Dirge)',
        description: '吹奏超越凡人理智的無調骨笛，每回合開始時使調查員獲得 1 層【恐慌】。',
        trigger: '每回合被動施加 1 層恐慌，大招伴隨 5 點巨量理智侵蝕。',
      },
      intents: [
        { name: '混沌無調笛音', type: 'erode', value: 5, description: '侵蝕 5 點理智牌庫' },
        { name: '盲目狂亂狂舞', type: 'attack', value: 12, description: '造成 12 點傷害' },
        { name: '虛無心靈真空', type: 'apply_status', value: 3, statusType: 'horror', description: '施加 3 層【恐慌】' },
        { name: '終焉音爆轟鳴', type: 'attack', value: 15, description: '造成 15 點傷害' },
      ],
      tacticalTips: {
        threatSummary: '理智侵蝕高達 5 點，心靈真空施加 3 層恐慌，是牌庫最大的蒸發者。',
        recommendedCards: ['深呼吸 (牌庫重抽補牌)', '快速拔槍 (爆發輸出)', '精神堅韌'],
        strategy: '切勿拖延戰局，吹笛者防禦較低，優先傾瀉所有進攻牌在 2-3 回合內將其擊斃。',
      },
    },
    {
      id: 'enemy_formless_spawn',
      name: '無定形原生質僕從',
      title: '札特瓜的漆黑穢物',
      depth: 3,
      role: 'normal',
      health: 60,
      armor: 6,
      category: 'formless',
      trait: {
        name: '非歐流體 (Amorphous Body)',
        description: '完全免疫【流血】與【易傷】狀態；受到物理打擊時分裂微小黏液，反彈 2 點接觸傷害。',
        trigger: '純物理菜刀隊的天然克星，需使用魔法直傷或真實穿刺破除。',
      },
      intents: [
        { name: '漆黑流體觸肢鞭擊', type: 'attack', value: 12, description: '造成 12 點傷害' },
        { name: '原形吞噬消化', type: 'attack', value: 14, description: '造成 14 點吞噬重擊' },
        { name: '異次元流體重組', type: 'defend', value: 10, description: '獲得 10 點護甲' },
      ],
      tacticalTips: {
        threatSummary: '易傷與流血無效，單純靠平砍會被反彈很多血。',
        recommendedCards: ['靈能衝擊 (法術直傷)', '深淵靈能撕裂 (穿刺)', '護甲猛擊 (巨量護甲砸擊)'],
        strategy: '偵探可利用【不可侵犯之壁】疊厚甲後用【護甲猛擊】一發重創，學者則直接使用高階秘術法術轟擊。',
      },
    },
    {
      id: 'enemy_hound_of_tindalos',
      name: '廷達洛斯獵犬',
      title: '時間銳角獵手',
      depth: 3,
      role: 'normal',
      health: 52,
      armor: 0,
      category: 'hound',
      trait: {
        name: '時間拐角 (Angular Geometry)',
        description: '自幾何銳角穿梭虛空，每回合獲得 30% 機率完全閃避一次攻擊。',
        trigger: '攻擊附加非歐藍色膿汁，命中造成 3 層恐慌。',
      },
      intents: [
        { name: '銳角空間瞬移爪擊', type: 'attack', value: 11, description: '造成 11 點傷害' },
        { name: '廷達洛斯之霧凝視', type: 'apply_status', value: 3, statusType: 'horror', description: '施加 3 層【恐慌】' },
        { name: '時間回溯', type: 'defend', value: 8, description: '獲得 8 點護甲' },
      ],
      tacticalTips: {
        threatSummary: '閃避率容易讓單發高費大招落空，恐慌印記疊加極快。',
        recommendedCards: ['雙發速射 (多段破閃避)', '達姆高爆彈連射 (4段保證命中)', '醫療鎮定劑'],
        strategy: '先用多段攻擊（如雙發速射）騙出其閃避判定，再打出後續高傷技能。',
      },
    },
    {
      id: 'enemy_colossal_shoggoth',
      name: '原生巨型修格斯 (首領)',
      title: '太古原初無定黑潮',
      depth: 3,
      role: 'boss',
      health: 110,
      armor: 10,
      category: 'boss',
      trait: {
        name: '器官增生 (Organ Proliferation)',
        description: '每回合體表隨機增生異變——「巨目」（意圖轉為侵蝕 5 點理智）、「重爪」（發動 4 次多段撕咬）、「厚皮」（獲得 18 點護甲）。',
        trigger: '每 4 回合進入【Tekeli-li 泰山壓頂】蓄力態，下回合造成 24 點滅頂傷害，但蓄力期間受傷 +50%。',
      },
      intents: [
        { name: '萬千巨目凝視', type: 'erode', value: 5, description: '侵蝕 5 點理智牌庫' },
        { name: '原生質重爪四連擊', type: 'attack', value: 4, description: '造成 4 點傷害 × 4 次 (共 16 傷)' },
        { name: 'Tekeli-li 終極碾壓 (蓄力)', type: 'defend', value: 18, description: '蓄力中，下回合打出 24 點傷害！' },
      ],
      tacticalTips: {
        threatSummary: '第三深度守關大首領！血量高達 110，且蓄力碾壓傷害致命。',
        recommendedCards: ['不可侵犯之壁 (跨回合留盾)', '軍用特種炸藥包 (爆轟破盾)', '虛空黑洞坍縮'],
        strategy: '在修格斯蓄力回合（受傷 +50%）全力打出【軍用特種炸藥包】與【弱點狙擊】打出致命破防爆發！',
      },
    },
  ],

  // ==========================================
  // 【第四深度 · 星辰正位 · 拉萊耶】
  // ==========================================
  4: [
    {
      id: 'enemy_rlyeh_sarcophagus_guard',
      name: '拉萊耶石棺守衛',
      title: '非歐幾何巨石看守者',
      depth: 4,
      role: 'normal',
      health: 80,
      armor: 10,
      category: 'ancient_guardian',
      imageUrl: '/enemies/cartoon/enemy_rlyeh_sarcophagus_guard.png',
      realisticUrl: '/enemies/realistic/enemy_rlyeh_sarcophagus_guard.png',
      trait: {
        name: '水下寒骨 (Waterlogged Grip)',
        description: '散發刺骨冰冷，使調查員每回合開始時獲得 1 層【恐慌】；溺水窒息可抽乾調查員精力。',
        trigger: '每回合被動恐慌，巨石防禦極為堅固。',
      },
      intents: [
        { name: '石棺重盾衝撞', type: 'attack', value: 15, description: '造成 15 點傷害' },
        { name: '太古封印沉寂', type: 'defend', value: 14, description: '獲得 14 點護甲' },
        { name: '深淵重壓碾碎', type: 'attack', value: 19, description: '造成 19 點重擊傷害' },
        { name: '萬古沉眠侵蝕', type: 'erode', value: 5, description: '侵蝕 5 點理智牌庫' },
      ],
      tacticalTips: {
        threatSummary: '血厚甲硬，重盾衝撞與深淵重壓威脅極大，伴隨持續恐慌。',
        recommendedCards: ['軍刀突刺 (穿刺穿甲)', '深淵靈能撕裂', '泵動式散彈槍 (碎盾)'],
        strategy: '使用無視護甲的穿刺牌或高階法術直擊本體，避免與 14 點太古封印硬耗。',
      },
    },
    {
      id: 'enemy_rlyeh_dream_apparition',
      name: '拉萊耶夢境具象',
      title: '舊日沉睡意識的具象化',
      depth: 4,
      role: 'normal',
      health: 75,
      armor: 6,
      category: 'star_spawn',
      imageUrl: '/enemies/cartoon/enemy_rlyeh_dream_apparition.png',
      realisticUrl: '/enemies/realistic/enemy_rlyeh_dream_apparition.png',
      trait: {
        name: '萬古夢魘 (Oneiric Dread)',
        description: '沉睡之神的夢境殘片，受到攻擊時爆發心靈震盪，使調查員獲得 1 層【恐慌】。',
        trigger: '受擊反震心靈恐慌，意圖包含 20 點超維意志湮滅。',
      },
      intents: [
        { name: '夢境深淵凝視', type: 'erode', value: 5, description: '侵蝕 5 點理智牌庫' },
        { name: '非歐幾何靈能衝擊', type: 'attack', value: 17, description: '造成 17 點傷害' },
        { name: '沉眠之神低語', type: 'apply_status', value: 3, statusType: 'horror', description: '施加 3 層【恐慌】' },
        { name: '超維意志湮滅', type: 'attack', value: 20, description: '造成 20 點傷害' },
      ],
      tacticalTips: {
        threatSummary: '受擊反震恐慌，20 點超維攻擊與 5 點理智侵蝕兼備。',
        recommendedCards: ['醫療鎮定劑 (解恐慌)', '極限精神錨定', '屠神裁決爆轟'],
        strategy: '不要用低傷多段攻擊頻繁觸發恐慌反震，集中大招單次重創。',
      },
    },
    {
      id: 'enemy_cosmic_prophet',
      name: '終焉星辰先知',
      title: '群星歸位的宣講者',
      depth: 4,
      role: 'normal',
      health: 72,
      armor: 5,
      category: 'cultist',
      imageUrl: '/enemies/cartoon/enemy_cosmic_prophet.png',
      realisticUrl: '/enemies/realistic/enemy_cosmic_prophet.png',
      trait: {
        name: '滅世預言 (Prophecy of Ruin)',
        description: '詠唱群星歸位之末日讖言，每 3 回合施展滅世預警，向調查員施加 2 層【易傷】與 2 層【恐慌】。',
        trigger: '每 3 回合施加易傷與恐慌，蓄力超新星狂怒 22 點毀滅傷害。',
      },
      intents: [
        { name: '群星軌跡引爆', type: 'attack', value: 16, description: '造成 16 點傷害' },
        { name: '末日讖言侵蝕', type: 'erode', value: 5, description: '侵蝕 5 點理智牌庫' },
        { name: '星界冷焰屏障', type: 'defend', value: 10, description: '獲得 10 點護甲' },
        { name: '超新星狂怒震擊', type: 'attack', value: 22, description: '造成 22 點毀滅傷害' },
      ],
      tacticalTips: {
        threatSummary: '超新星 22 點傷害在易傷狀態下極度致命，不可名狀讖言侵蝕 5 點心智。',
        recommendedCards: ['就地掩蔽 (蓄厚盾)', '雙管獵槍 (爆發壓制)', '重拳壓制 (-30%傷)'],
        strategy: '在超新星震擊前夕務必打出【重拳壓制】削弱其傷害，並用淨化牌解掉易傷。',
      },
    },
    {
      id: 'enemy_ancient_guardian',
      name: '太古深淵守護者',
      title: '拉萊耶永恆神衛',
      depth: 4,
      role: 'elite',
      health: 95,
      armor: 12,
      category: 'ancient_guardian',
      trait: {
        name: '神廟永恆壁壘 (Eternal Bulwark)',
        description: '免疫任何護甲消除與碎甲效果；受到傷害時自動產生等同於傷害 20% 的反作用力護甲。',
        trigger: '玄武岩長戟重擊，造成 16 點巨大衝擊。',
      },
      intents: [
        { name: '玄武岩長戟重擊', type: 'attack', value: 16, description: '造成 16 點傷害' },
        { name: '太古禁錮力場', type: 'defend', value: 14, description: '獲得 14 點護甲' },
        { name: '拉萊耶重力壓制', type: 'erode', value: 5, description: '侵蝕 5 點理智牌庫' },
      ],
      tacticalTips: {
        threatSummary: '完全免疫碎盾，任何攻擊都會讓其產生護甲反彈。',
        recommendedCards: ['軍刀突刺 (真實穿刺直擊本體)', '深淵靈能撕裂 (無視護甲)', '屠神裁決爆轟'],
        strategy: '不要與其護盾死磕，全體改用【真實穿刺】卡牌直扣生命核心。',
      },
    },
    {
      id: 'enemy_star_spawn',
      name: '克蘇魯星之眷族 (終極首領)',
      title: '沉睡之神的長子',
      depth: 4,
      role: 'boss',
      health: 150,
      armor: 12,
      category: 'boss',
      trait: {
        name: '神性不滅 (Divine Immortality)',
        description: '【生命的鎖定】生命值無法降至 1 以下！唯有打出【完整的深淵古印】方可破除神性鎖滅殺古神！',
        trigger: '每 2 回合將一張【星辰碎裂之囈語】瘋狂卡強行塞入調查員牌庫，造成持續心智干擾。',
      },
      intents: [
        { name: '群星碎裂虛空波', type: 'attack', value: 18, description: '造成 18 點傷害' },
        { name: '深淵終極囈語', type: 'erode', value: 6, description: '侵蝕 6 點理智牌庫' },
        { name: '非歐多維神性屏障', type: 'defend', value: 20, description: '獲得 20 點神性護甲' },
        { name: '星辰湮滅終末之光', type: 'attack', value: 26, description: '造成 26 點毀滅打擊' },
      ],
      tacticalTips: {
        threatSummary: '遊戲終極 Boss！不打出深淵古印絕對無法通關。',
        recommendedCards: ['完整的深淵古印 (唯一解神性)', '舊神庇護之陣 (減傷40%)', '屠神裁決爆轟', '源初星辰啟示'],
        strategy: '集齊三枚深淵殘片合成【完整的深淵古印】並打出，破除其無敵態後，以【屠神裁決爆轟】或【超維虛空湮滅】給予舊日支配者最後致命一擊！',
      },
    },
  ],
};
