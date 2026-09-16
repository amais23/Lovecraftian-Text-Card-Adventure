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
      id: 'enemy_ghoul_high_priest',
      name: '食屍鬼大祭司',
      title: '褻瀆墓穴長老',
      depth: 1,
      role: 'elite',
      health: 52,
      armor: 6,
      category: 'ghoul',
      imageUrl: '/enemies/cartoon/enemy_ghoul_high_priest.png',
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
      imageUrl: '/enemies/cartoon/enemy_deep_one_warrior.png',
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
      imageUrl: '/enemies/cartoon/enemy_drowned_soul.png',
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
      id: 'enemy_deep_one_elder',
      name: '深潛者長老',
      title: '太古海裔主祭',
      depth: 2,
      role: 'elite',
      health: 58,
      armor: 8,
      category: 'deep_one',
      imageUrl: '/enemies/cartoon/enemy_deep_one_elder.png',
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
      imageUrl: '/enemies/cartoon/enemy_dagon_priest.png',
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
      id: 'enemy_formless_spawn',
      name: '無定形原生質僕從',
      title: '札特瓜的漆黑穢物',
      depth: 3,
      role: 'normal',
      health: 60,
      armor: 6,
      category: 'formless',
      imageUrl: '/enemies/cartoon/enemy_formless_spawn.png',
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
      imageUrl: '/enemies/cartoon/enemy_hound_of_tindalos.png',
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
      imageUrl: '/enemies/cartoon/enemy_colossal_shoggoth.png',
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
      id: 'enemy_ancient_guardian',
      name: '太古深淵守護者',
      title: '拉萊耶永恆神衛',
      depth: 4,
      role: 'elite',
      health: 95,
      armor: 12,
      category: 'ancient_guardian',
      imageUrl: '/enemies/cartoon/enemy_ancient_guardian.png',
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
      imageUrl: '/enemies/cartoon/enemy_star_spawn.png',
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
