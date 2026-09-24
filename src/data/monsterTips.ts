export interface MonsterTacticalTips {
  threatSummary: string;
  recommendedCards: string[];
  strategy: string;
  traitTrigger?: string;
}

/**
 * 敵怪戰術指南資料庫 (Monster Bestiary Tactical Tips)
 * 提供克蘇魯調查員在遭遇各深度敵怪時的威脅分析、推薦應對卡牌與破局策略 (ADR-0035)。
 */
export const MONSTER_TACTICAL_TIPS: Record<string, MonsterTacticalTips> = {
  // --- 第一深度 ---
  enemy_arkham_cultist: {
    threatSummary: '若無法迅速斬殺，會透過受傷自殘疊加力量，攻擊力越滾越高。',
    recommendedCards: ['鉛頭手杖 (消力量)', '雙管獵槍 (高額斬殺)', '重拳壓制 (破勢)'],
    strategy: '使用【鉛頭手杖】及時消除其力量增益，或在殘血前一發雙管獵槍直接擊殺，避免其觸發血祭。',
    traitTrigger: '生命值低於 40% 時發動【盲目血祭】，消耗自身 4 點生命向調查員施加 2 層流血與 1 層易傷。',
  },
  enemy_ghoul_lurker: {
    threatSummary: '一旦調查員身上帶有流血狀態，食屍鬼會透過攻擊持續吸血，戰鬥易陷入拖延。',
    recommendedCards: ['醫療鎮定劑 (淨化流血)', '戰地急救繃帶 (解流血)', '軍刀突刺 (穿刺)'],
    strategy: '及時打出【醫療鎮定劑】消除自身的流血印記，徹底截斷其吸血來源。',
    traitTrigger: '優先發動撕咬施加流血，隨後投擲墓泥侵蝕理智並干擾抽牌。',
  },
  enemy_nightgaunt: {
    threatSummary: '防禦護甲無法抵擋其心靈侵蝕，極易在前期被迅速抽乾理智牌庫。',
    recommendedCards: ['深呼吸 (補牌庫)', '舊日殘頁 (擴充理智)', '雙發速射 (快攻斬殺)'],
    strategy: '不要過度浪費精力在純防禦上，加速傾瀉戰鬥傷害將其速殺，並用【深呼吸】回補理智。',
    traitTrigger: '侵蝕成功後觸發陰影滑翔，自身獲得 6 點迴避護甲。',
  },
  enemy_walls_rat_swarm: {
    threatSummary: '物理打擊會被大量鼠群分散減傷，多段低傷物理極度吃虧。',
    recommendedCards: ['靈能衝擊 (法術額外+3傷)', '深淵靈能撕裂 (法術震波)', '燃燒瓶 (範圍AOE)'],
    strategy: '優先使用學者或秘術系【法術卡牌】，觸發其弱點額外造成 3 點震波傷害迅速清場。',
    traitTrigger: '物理攻擊減傷 2 點，魔法卡牌攻擊增傷 3 點。',
  },
  enemy_cultist_zealot: {
    threatSummary: '半血以下進入狂暴態，平砍也會撕裂理智牌庫，拖延戰鬥極度危險。',
    recommendedCards: ['雙管獵槍 (高額斬殺)', '弱點狙擊 (一槍斃命)', '軍刀突刺'],
    strategy: '在生命值降至半數前積蓄爆發卡牌，一擊越過狂暴血線將其斬殺。',
    traitTrigger: '生命值低於 50% 時狂暴化，所有攻擊追加理智侵蝕。',
  },
  enemy_cemetery_carrion_worm: {
    threatSummary: '物理肉搏會被反彈易傷，疊加易傷後其抽擊與噴吐傷害倍增。',
    recommendedCards: ['快速拔槍 (遠程射擊避開接觸)', '法術轟擊', '醫療鎮定劑'],
    strategy: '使用遠程槍械或法術進行非接觸打擊，避免近戰肉搏沾染腐殖毒液。',
    traitTrigger: '受到物理肉搏攻擊時對調查員施加 1 層易傷。',
  },
  enemy_ghoul_high_priest: {
    threatSummary: '血厚甲厚，同時具備 12 點重擊與 3 點心智侵蝕，是第一深度最強門檻。',
    recommendedCards: ['泵動式散彈槍 (碎骨甲)', '軍刀突刺 (穿刺直扣生命)', '戰術翻滾'],
    strategy: '使用【泵動式散彈槍】直接打碎其 10 點骨甲觸發反噬，或用【軍刀突刺】無視骨甲直接壓低生命值。',
    traitTrigger: '揮舞權杖造成複合重擊，並伴隨刺耳的地底尖嘯重度侵蝕心智。',
  },
  enemy_shoggoth_progeny: {
    threatSummary: '第一深度關底首領！重擊威脅極大，且帶有黏液反震。',
    recommendedCards: ['就地掩蔽 (蓄力蓄甲)', '重拳壓制 (破勢 -30%)', '雙發速射 (分段打擊規避反噬)'],
    strategy: '在 Tekeli-li 碾壓前夕打出【重拳壓制】降低其 30% 傷害，並打出蓄滿層數的【就地掩蔽】安全化解。',
    traitTrigger: '每 3 回合發動【Tekeli-li 泰山壓頂】，造成 14 點巨大碾壓傷害。',
  },
  initial_shoggoth: {
    threatSummary: '第一深度關底首領！重擊威脅極大，且帶有黏液反震。',
    recommendedCards: ['就地掩蔽 (蓄力蓄甲)', '重拳壓制 (破勢 -30%)', '雙發速射 (分段打擊規避反噬)'],
    strategy: '在 Tekeli-li 碾壓前夕打出【重拳壓制】降低其 30% 傷害，並打出蓄滿層數的【就地掩蔽】安全化解。',
    traitTrigger: '每 3 回合發動【Tekeli-li 泰山壓頂】，造成 14 點巨大碾壓傷害。',
  },

  // --- 第二深度 ---
  enemy_deep_one_warrior: {
    threatSummary: '輕度打擊（如單發 4 點平 A）會被完全彈開，刮痧流派的噩夢。',
    recommendedCards: ['軍刀突刺 (穿刺無視免疫)', '雙管獵槍 (16傷重轟)', '靈能衝擊 (法術無視物理皮甲)'],
    strategy: '切忌使用單段 4 傷以下小技能，果斷使用【軍刀突刺】或高傷武器直接破防。',
    traitTrigger: '逼迫調查員使用高傷重武器、穿刺攻擊或紫色秘術法術破防。',
  },
  enemy_drowned_soul: {
    threatSummary: '每回合被動累積恐慌，且抽乾精力會嚴重干擾出牌節奏。',
    recommendedCards: ['醫療鎮定劑 (解恐慌)', '快速拔槍 (0費調度)', '弱點狙擊 (速殺)'],
    strategy: '優先擊殺，使用【醫療鎮定劑】在關鍵爆發前解掉恐慌。',
    traitTrigger: '施展【溺水窒息】，除造成 8 點傷害外，抽乾調查員 1 點精力。',
  },
  enemy_innsmouth_hybrid: {
    threatSummary: '刮痧打擊無效，魚叉突刺與撲殺輸出兇猛且帶流血與恐慌雙重干擾。',
    recommendedCards: ['軍刀突刺 (穿刺破防)', '雙管獵槍 (高額重轟)', '重拳壓制'],
    strategy: '果斷使用高傷單次輸出打破魚鱗偏斜，儘早擊殺避免流血疊加。',
    traitTrigger: '單次受到小於等於 4 點的物理傷害完全無效。',
  },
  enemy_tidal_siren: {
    threatSummary: '每回合吸取精力並侵蝕理智，歌聲自帶恐慌與受擊反傷。',
    recommendedCards: ['快速拔槍 (搶先手速殺)', '醫療鎮定劑 (解恐慌)', '雙發速射'],
    strategy: '不要與其持久戰，起手交出高傷輸出速殺塞壬，防止精力被抽乾導致卡手。',
    traitTrigger: '每回合被動施加 1 層恐慌，受擊反彈 1 點接觸傷害。',
  },
  enemy_abyssal_barnacle_mass: {
    threatSummary: '甲殼極厚且自帶物理反傷，配合易傷酸霧會讓防線迅速崩潰。',
    recommendedCards: ['泵動式散彈槍 (碎盾)', '靈能衝擊 (法術無視甲殼)', '軍刀突刺'],
    strategy: '使用散彈槍擊碎其 10 點石灰質硬甲，或使用法術傷害繞過反傷機制。',
    traitTrigger: '受到物理肉搏攻擊時反彈 2 點割裂傷害。',
  },
  enemy_deep_one_elder: {
    threatSummary: '多段攻擊打在長老身上會被反彈多次傷害，心智侵蝕高達 4 點。',
    recommendedCards: ['弱點狙擊 (單次致命爆發)', '泵動式散彈槍 (碎盾)', '極限精神錨定'],
    strategy: '避免使用低傷多段攻擊，改用【戰術佯攻】+【弱點狙擊】單次打出 24 點直接斬殺。',
    traitTrigger: '交替吟唱海嘯潮汐咒文與投擲珊瑚三叉戟。',
  },
  enemy_dagon_champion: {
    threatSummary: '大袞的狂暴冠軍，攻擊力隨戰鬥進行激增。',
    recommendedCards: ['泵動式散彈槍', '雙發速射', '軍刀突刺'],
    strategy: '快速壓低血線，在其疊加致命力量前完成擊殺。',
    traitTrigger: '攻擊力隨戰鬥進行激增。',
  },
  enemy_frenzied_deep_one: {
    threatSummary: '狂暴海嗣連續發動多段攻擊，造成大量流血。',
    recommendedCards: ['重拳壓制 (破勢)', '醫療鎮定劑 (解流血)', '不可侵犯之壁'],
    strategy: '使用重拳壓制降低其多段傷害，及時包紮流血傷勢。',
    traitTrigger: '連續發動多段攻擊，造成大量流血。',
  },
  enemy_dagon_priest: {
    threatSummary: '第二深度最強機制怪！如果奇數回合沒破掉 16 點護盾，偶數回合的海嘯傷害會高達 25+！',
    recommendedCards: ['泵動式散彈槍 (一槍擊碎所有護甲)', '深淵靈能撕裂 (破甲50%)', '護甲猛擊'],
    strategy: '只要手牌留一張【泵動式散彈槍】，在奇數回合一槍打碎其所有潮汐護甲，偶數回合的海嘯便不攻自破！',
    traitTrigger: '迫使調查員在奇數回合傾瀉所有輸出破盾，否則偶數回合將面臨滅頂之災。',
  },
  initial_dagon_priest: {
    threatSummary: '第二深度最強機制怪！如果奇數回合沒破掉 16 點護盾，偶數回合的海嘯傷害會高達 25+！',
    recommendedCards: ['泵動式散彈槍 (一槍擊碎所有護甲)', '深淵靈能撕裂 (破甲50%)', '護甲猛擊'],
    strategy: '只要手牌留一張【泵動式散彈槍】，在奇數回合一槍打碎其所有潮汐護甲，偶數回合的海嘯便不攻自破！',
    traitTrigger: '迫使調查員在奇數回合傾瀉所有輸出破盾，否則偶數回合將面臨滅頂之災。',
  },

  // --- 第三深度 ---
  enemy_migo_scout: {
    threatSummary: '星際電弧抽乾精力極度致命，孢子迷霧侵蝕 4 點理智。',
    recommendedCards: ['雙發速射 (快攻打斷)', '就地掩蔽', '戰地急救繃帶'],
    strategy: '留存 0 費卡牌以應對精力被抽乾的情況，盡快破除膜翅護甲將其擊殺。',
    traitTrigger: '特殊攻擊命中時抽乾調查員 1 點精力並侵蝕理智。',
  },
  enemy_void_wanderer: {
    threatSummary: '16 點四維打擊配合 4 點心靈撕裂，且自帶維度護甲。',
    recommendedCards: ['不可侵犯之壁 (留存護盾)', '深淵靈能撕裂 (真實傷害)', '弱點狙擊'],
    strategy: '在其蓄力四維打擊時做好全額護盾防護，把握其護甲間隙全力爆發。',
    traitTrigger: '每 3 回合進入空間折疊獲得 12 點護甲。',
  },
  enemy_outer_god_piper: {
    threatSummary: '理智侵蝕高達 5 點，心靈真空施加 3 層恐慌，是牌庫最大的蒸發者。',
    recommendedCards: ['深呼吸 (牌庫重抽補牌)', '快速拔槍 (爆發輸出)', '精神堅韌'],
    strategy: '切勿拖延戰局，吹笛者防禦較低，優先傾瀉所有進攻牌在 2-3 回合內將其擊斃。',
    traitTrigger: '每回合被動施加 1 層恐慌，大招伴隨 5 點巨量理智侵蝕。',
  },
  enemy_proto_shoggoth_spawn: {
    threatSummary: '原生質修格斯雛形，具備無定形流體分裂防禦。',
    recommendedCards: ['靈能衝擊', '軍用特種炸藥包', '弱點狙擊'],
    strategy: '使用高傷法術或炸藥包迅速擊穿，避免觸肢鞭笞持續侵蝕。',
    traitTrigger: '受到物理打擊時分裂微小黏液，反彈傷害。',
  },
  enemy_byakhee_rotwing: {
    threatSummary: '拜亞基腐翼掠空，高空俯衝攻擊附加深度撕裂。',
    recommendedCards: ['就地掩蔽', '快速拔槍', '雙管獵槍'],
    strategy: '做好防空掩蔽，待其俯衝後抓準破綻進行狙擊。',
    traitTrigger: '高空俯衝掠襲，造成撕裂流血。',
  },
  enemy_formless_spawn: {
    threatSummary: '易傷與流血無效，單純靠平砍會被反彈很多血。',
    recommendedCards: ['靈能衝擊 (法術直傷)', '深淵靈能撕裂 (穿刺)', '護甲猛擊 (巨量護甲砸擊)'],
    strategy: '偵探可利用【不可侵犯之壁】疊厚甲後用【護甲猛擊】一發重創，學者則直接使用高階秘術法術轟擊。',
    traitTrigger: '純物理菜刀隊的天然克星，需使用魔法直傷或真實穿刺破除。',
  },
  enemy_hound_of_tindalos: {
    threatSummary: '閃避率容易讓單發高費大招落空，恐慌印記疊加極快。',
    recommendedCards: ['雙發速射 (多段破閃避)', '達姆高爆彈連射 (4段保證命中)', '醫療鎮定劑'],
    strategy: '先用多段攻擊（如雙發速射）騙出其閃避判定，再打出後續高傷技能。',
    traitTrigger: '攻擊附加非歐藍色膿汁，命中造成 3 層恐慌。',
  },
  enemy_ancient_hound: {
    threatSummary: '遠古廷達洛斯獵犬，時間銳角穿梭能力更強。',
    recommendedCards: ['多段打擊卡牌', '高額護甲防禦', '真實穿刺'],
    strategy: '破除閃避後迅速擊殺，避免戰鬥拖入時間迴廊。',
    traitTrigger: '自幾何銳角穿梭虛空，具備高額閃避判定。',
  },
  enemy_colossal_shoggoth: {
    threatSummary: '第三深度守關大首領！生命值高達 110，且蓄力碾壓傷害致命。',
    recommendedCards: ['不可侵犯之壁 (跨回合留盾)', '軍用特種炸藥包 (爆轟破盾)', '虛空黑洞坍縮'],
    strategy: '在修格斯蓄力回合（受傷 +50%）全力打出【軍用特種炸藥包】與【弱點狙擊】打出致命破防爆發！',
    traitTrigger: '每 4 回合進入【Tekeli-li 泰山壓頂】蓄力態，下回合造成 24 點滅頂傷害，但蓄力期間受傷 +50%。',
  },
  initial_colossal_shoggoth: {
    threatSummary: '第三深度守關大首領！生命值高達 110，且蓄力碾壓傷害致命。',
    recommendedCards: ['不可侵犯之壁 (跨回合留盾)', '軍用特種炸藥包 (爆轟破盾)', '虛空黑洞坍縮'],
    strategy: '在修格斯蓄力回合（受傷 +50%）全力打出【軍用特種炸藥包】與【弱點狙擊】打出致命破防爆發！',
    traitTrigger: '每 4 回合進入【Tekeli-li 泰山壓頂】蓄力態，下回合造成 24 點滅頂傷害，但蓄力期間受傷 +50%。',
  },

  // --- 第四深度 ---
  enemy_rlyeh_sarcophagus_guard: {
    threatSummary: '血厚甲硬，重盾衝撞與深淵重壓威脅極大，伴隨持續恐慌。',
    recommendedCards: ['軍刀突刺 (穿刺穿甲)', '深淵靈能撕裂', '泵動式散彈槍 (碎盾)'],
    strategy: '使用無視護甲的穿刺牌或高階法術直擊本體，避免與 14 點太古封印硬耗。',
    traitTrigger: '每回合被動恐慌，巨石防禦極為堅固。',
  },
  enemy_rlyeh_guard: {
    threatSummary: '拉萊耶巨石近衛，防禦森嚴且攻擊勢大力沉。',
    recommendedCards: ['泵動式散彈槍', '穿刺攻擊', '虛空射線'],
    strategy: '碎盾後迅速以爆發傷害斬殺。',
    traitTrigger: '非歐幾何巨石看守，重擊碾碎。',
  },
  enemy_star_spawn_larva: {
    threatSummary: '眷族幼體具備微弱神性侵蝕，精神威懾極強。',
    recommendedCards: ['醫療鎮定劑', '快速拔槍', '深呼吸'],
    strategy: '防止理智被過快掏空，優先快攻壓制。',
    traitTrigger: '精神威懾侵蝕，幼體蠕動撕咬。',
  },
  enemy_cosmic_acolyte: {
    threatSummary: '群星侍僧詠唱星界秘術，造成大範圍心智混亂。',
    recommendedCards: ['重拳壓制', '雙管獵槍', '法術破除'],
    strategy: '在其詠唱完畢前打出破勢並斬殺。',
    traitTrigger: '吟誦群星歸位讚美詩，大範圍心智侵蝕。',
  },
  enemy_non_euclidean_construct: {
    threatSummary: '非歐幾何結構體，維度反光偏折攻擊。',
    recommendedCards: ['法術直傷', '穿刺傷害', '不可侵犯之壁'],
    strategy: '使用非物理傷害繞過反光幾何偏斜。',
    traitTrigger: '非歐幾何折射偏轉，物理傷害穿透。',
  },
  enemy_rlyeh_dream_apparition: {
    threatSummary: '受擊反震恐慌，20 點超維攻擊與 5 點理智侵蝕兼備。',
    recommendedCards: ['醫療鎮定劑 (解恐慌)', '極限精神錨定', '屠神裁決爆轟'],
    strategy: '不要用低傷多段攻擊頻繁觸發恐慌反震，集中大招單次重創。',
    traitTrigger: '受擊反震心靈恐慌，意圖包含 20 點超維意志湮滅。',
  },
  enemy_cosmic_prophet: {
    threatSummary: '超新星 22 點傷害在易傷狀態下極度致命，不可名狀讖言侵蝕 5 點心智。',
    recommendedCards: ['就地掩蔽 (蓄厚盾)', '雙管獵槍 (爆發壓制)', '重拳壓制 (-30%傷)'],
    strategy: '在超新星震擊前夕務必打出【重拳壓制】削弱其傷害，並用淨化牌解掉易傷。',
    traitTrigger: '每 3 回合施加易傷與恐慌，蓄力超新星狂怒 22 點毀滅傷害。',
  },
  enemy_ancient_guardian: {
    threatSummary: '完全免疫碎盾，任何攻擊都會讓其產生護甲反彈。',
    recommendedCards: ['軍刀突刺 (真實穿刺直擊本體)', '深淵靈能撕裂 (無視護甲)', '屠神裁決爆轟'],
    strategy: '不要與其護盾死磕，全體改用【真實穿刺】卡牌直扣生命核心。',
    traitTrigger: '玄武岩長戟重擊，造成 16 點巨大衝擊。',
  },
  enemy_star_spawn: {
    threatSummary: '遊戲終極 Boss！不打出深淵古印絕對無法通關。',
    recommendedCards: ['完整的深淵古印 (唯一解神性)', '舊神庇護之陣 (減傷40%)', '屠神裁決爆轟', '源初星辰啟示'],
    strategy: '集齊三枚深淵殘片合成【完整的深淵古印】並打出，破除其無敵態後，以【屠神裁決爆轟】或【超維虛空湮滅】給予舊日支配者最後致命一擊！',
    traitTrigger: '每 2 回合將一張【星辰碎裂之囈語】瘋狂卡強行塞入調查員牌庫，造成持續心智干擾。',
  },
  initial_star_spawn: {
    threatSummary: '遊戲終極 Boss！不打出深淵古印絕對無法通關。',
    recommendedCards: ['完整的深淵古印 (唯一解神性)', '舊神庇護之陣 (減傷40%)', '屠神裁決爆轟', '源初星辰啟示'],
    strategy: '集齊三枚深淵殘片合成【完整的深淵古印】並打出，破除其無敵態後，以【屠神裁決爆轟】或【超維虛空湮滅】給予舊日支配者最後致命一擊！',
    traitTrigger: '每 2 回合將一張【星辰碎裂之囈語】瘋狂卡強行塞入調查員牌庫，造成持續心智干擾。',
  },
};
