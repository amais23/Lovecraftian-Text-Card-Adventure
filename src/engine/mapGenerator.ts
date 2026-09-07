import type { DepthLevel, InvestigationMap, MapNode, MapNodeType } from '../types/game';
import { getEncounterEnemy } from './enemyCatalog';
import { hasFallenInvestigatorRecord } from './remainsInheritance';

export interface RawNodeConfig {
  id: string;
  type: MapNodeType;
  layer: number;
  col: number;
  label: string;
  title: string;
  description: string;
  nextNodes: string[];
  enemyId?: string;
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
    enemyId: 'enemy_ghoul_lurker',
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
    enemyId: 'enemy_arkham_cultist',
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
    enemyId: 'enemy_deep_one_elder',
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
    nextNodes: ['node_3_2', 'node_3_3'],
  },

  // Layer 3: Danger & Elite Turning Point (4 nodes)
  {
    id: 'node_3_0',
    type: 'combat',
    layer: 3,
    col: 0,
    label: '常規遭遇',
    title: '迷霧屠宰場',
    description: '生鏽的鐵鉤在風中搖晃，嗜血的異形正在血窪中伺機而動。',
    nextNodes: ['node_4_0', 'node_4_1'],
    enemyId: 'enemy_nightgaunt',
  },
  {
    id: 'node_3_1',
    type: 'elite',
    layer: 3,
    col: 1,
    label: '舊日精英',
    title: '詛咒鐘樓',
    description: '狂亂的鐘聲震盪心靈，舊日僕從正展開黑曜石般的巨翼！',
    nextNodes: ['node_4_0', 'node_4_1'],
    enemyId: 'enemy_ghoul_high_priest',
  },
  {
    id: 'node_3_2',
    type: 'event',
    layer: 3,
    col: 2,
    label: '秘識奇遇',
    title: '療養院禁忌病房',
    description: '軟墊牆上刻滿扭曲的幾何圖騰，彷彿連空氣都被不可名狀的引力撕扯。',
    nextNodes: ['node_4_1', 'node_4_2'],
  },
  {
    id: 'node_3_3',
    type: 'market',
    layer: 3,
    col: 3,
    label: '黑市商人',
    title: '鐘錶匠的密閣',
    description: '滴答作響的奇異機械之間，黑市商人展示著來自海外的特殊護符。',
    nextNodes: ['node_4_1', 'node_4_2'],
  },

  // Layer 4: Final Preparations (3 nodes)
  {
    id: 'node_4_0',
    type: 'market',
    layer: 4,
    col: 0,
    label: '黑市商人',
    title: '走私者密碼頭',
    description: '潮水拍打著腐朽木棧道，黑市走私者正兜售最後的軍用應急物資。',
    nextNodes: ['node_5_0'],
  },
  {
    id: 'node_4_1',
    type: 'event',
    layer: 4,
    col: 1,
    label: '秘識奇遇',
    title: '荒廢修道院遺址',
    description: '傾頹的尖頂教堂殘垣下，散落著異端信徒留下的儀式泥板。',
    nextNodes: ['node_5_0'],
  },
  {
    id: 'node_4_2',
    type: 'sanctuary',
    layer: 4,
    col: 2,
    label: '安全避難所',
    title: '聖壇懺悔室',
    description: '遠離異教徒狂亂聲浪的隱秘祈禱室，提供最後的包紮與心智整頓。',
    nextNodes: ['node_5_0'],
  },

  // Layer 5: Culmination / Boss (1 node)
  {
    id: 'node_5_0',
    type: 'boss',
    layer: 5,
    col: 0,
    label: '舊日宿敵',
    title: '無底深淵祭壇',
    description: '祭壇中央的虛空裂隙中，不可名狀的巨大輪廓正在緩緩凝聚……',
    nextNodes: [],
    enemyId: 'enemy_shoggoth_progeny',
  },
];

export interface MapGenerationOptions {
  seed?: number;
  randomFn?: () => number;
  procedural?: boolean;
  depth?: DepthLevel;
  hasFallenInvestigator?: boolean;
}

const DEPTH_METADATA: Record<
  number,
  {
    name: string;
    pools: Record<MapNodeType, { label: string; variants: Array<{ title: string; desc: string }> }>;
  }
> = {
  1: {
    name: '阿卡姆封鎖區調查圖（隨機生成）',
    pools: {
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
          { title: '荒廢修道院遺址', desc: '傾頹的尖頂教堂殘垣下，散落著異端信徒留下的儀式泥板。' },
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
          { title: '無底深淵祭壇', desc: '祭壇中央的虛空裂隙中，不可名狀的修格斯黑泥巨塊正在緩緩凝聚……' },
        ],
      },
      altar: {
        label: '禁忌祭壇',
        variants: [
          { title: '無名舊神祭壇', desc: '石台上凝結著發黑的暗紅血垢，冷冽的微風中夾雜著細碎的非人低語……' },
          { title: '黑曜石供奉台', desc: '以非歐幾何角度切削的黑石祭壇，燃燒著幽藍色的不熄冷火。' },
        ],
      },
      vault: {
        label: '遺物秘閣',
        variants: [
          { title: '阿米蒂奇教授的密室', desc: '密斯卡托尼克大學地窖深處的加固鐵庫，封存著自世界各地搜繳的禁忌物件。' },
          { title: '守墓人古董櫃', desc: '佈滿蛛網與符文的古老木櫥，散發著奇異的金屬寒光。' },
        ],
      },
      blood_altar: {
        label: '血之祭壇',
        variants: [
          { title: '放血淨化石槽', desc: '刻滿除役符文的青石水槽，唯有以鮮血洗滌，方能洗去心智中受污染的雜念卡牌。' },
          { title: '異端悔罪石室', desc: '昏暗的密室中央擺放著帶刺的祭台，能將狂亂記憶永久剝除焚毀。' },
        ],
      },
      remains: {
        label: '屍骨遺骸',
        variants: [
          { title: '前代調查員枯骨', desc: '倚靠在牆角的殘破骸骨，身旁的皮革公事包已被風雨浸透，記錄著前人未能走完的道路……' },
          { title: '殉職探員遺物堆', desc: '被血污浸透的風衣與折斷的鋼筆，無言訴說著前任探索者遭遇的殘酷命運。' },
        ],
      },
    },
  },
  2: {
    name: '深潛者海蝕迷宮調查圖',
    pools: {
      combat: {
        label: '常規遭遇',
        variants: [
          { title: '潮蝕礁石窟', desc: '海水漫過膝蓋，濕滑的海草下隱匿著長著魚鰓的非人物種……' },
          { title: '溺亡者骨礁', desc: '蒼白的骨殖卡在玄武岩縫隙中，惡臭的魚腥黏液滴落在肩頭。' },
          { title: '螢光藻淺灘', desc: '幽綠色的深海菌藻照亮了水下鱗片反光，異形正悄無聲息逼近。' },
          { title: '鹽漬甬道', desc: '被鹽結晶覆蓋的狹長岩道，回盪著非人的嘶鳴與蹼足拍水聲。' },
        ],
      },
      elite: {
        label: '舊日精英',
        variants: [
          { title: '珊瑚浸染長老居所', desc: '全身長滿厚重珊瑚甲殼的深潛者長老手持尖刺，掀起狂暴海浪！' },
          { title: '深海巨獸骨骸', desc: '巨大的史前海獸巨口中，潛伏著受到大袞祝福的狂熱祭司僕從！' },
        ],
      },
      event: {
        label: '秘識奇遇',
        variants: [
          { title: '貝殼祭祀刻痕', desc: '岩壁上鑲嵌著排列成星芒形狀的奇異海貝，隱隱傳出遠古潮汐的呢喃。' },
          { title: '溺死水手遺囊', desc: '卡在礁石間的破爛防水袋，裝著鏽蝕的金幣與寫滿瘋話的航海筆記。' },
          { title: '褪色航海日誌', desc: '記載著通往拉萊耶洋流的古老皮卷，字裡行間透出不可逆轉的心智侵蝕。' },
          { title: '潮汐鐘乳石穴', desc: '自石筍滴下的水珠在水面泛起漣漪，水底倒影浮現出非人的面孔。' },
        ],
      },
      sanctuary: {
        label: '安全避難所',
        variants: [
          { title: '避潮岩龕', desc: '高於海潮線的天然石龕，乾燥的岩面提供了片刻喘息與急救。' },
          { title: '荒廢燈塔基座', desc: '深埋在海蝕洞頂的古燈塔地基，厚重的鑄鐵門阻隔了外面的潮聲。' },
          { title: '海蝕乾燥石穴', desc: '燃點著乾燥海草餘燼的洞窟，提供片刻安歇與心智調理。' },
        ],
      },
      market: {
        label: '黑市商人',
        variants: [
          { title: '兩棲走私客暗礁', desc: '半人半魚的黑市走私者將貨箱浮在水面，眼珠混濁地兜售深海寶物。' },
          { title: '黑潮貨物集散處', desc: '擱淺的走私破船內部，神秘商人點亮油燈展示未開封的禁忌貨物。' },
          { title: '盲眼珍珠商人', desc: '用布條蒙眼的蒼白老人，指尖撫摸著散發不祥微光的黑珍珠與秘術卷軸。' },
        ],
      },
      boss: {
        label: '舊日宿敵',
        variants: [
          { title: '大袞王廷的祭禮石殿', desc: '海水淹沒的太古石殿中，大袞的深淵祭司高舉三叉戟召喚滅頂海嘯！' },
        ],
      },
      altar: {
        label: '禁忌祭壇',
        variants: [
          { title: '潮汐浸血祭台', desc: '珊瑚岩雕琢的海神古壇，海水退去時露出刻滿獻祭盟約的凹槽。' },
          { title: '深淵螺紋祭壇', desc: '巨型鸚鵡螺化石鑄就的供壇，散發著令人心悸的幽暗引力。' },
        ],
      },
      vault: {
        label: '遺物秘閣',
        variants: [
          { title: '沉沒走私者寶庫', desc: '深埋於礁石洞穴的防潮防水密匣，保存著歷代水手打撈出的深海遺物。' },
          { title: '大袞金器儲藏室', desc: '鑲嵌著異星黃金飾物的石壁秘室，封印著未被腐化的古老法器。' },
        ],
      },
      blood_altar: {
        label: '血之祭壇',
        variants: [
          { title: '深海血祭礁岩', desc: '黑潮拍擊的銳利礁岩，以自身鮮血澆灌符文，能永久洗淨牌庫雜質。' },
          { title: '珊瑚淨化石碑', desc: '活體珊瑚構成的奇異共生碑，能吸噬調查員殘存的心智負擔。' },
        ],
      },
      remains: {
        label: '屍骨遺骸',
        variants: [
          { title: '溺亡探索者骸骨', desc: '卡在玄武岩礁石縫隙間的蒼白枯骨，手中緊緊攥著殘存的防水行囊。' },
        ],
      },
    },
  },
  3: {
    name: '無底深淵祭壇調查圖',
    pools: {
      combat: {
        label: '常規遭遇',
        variants: [
          { title: '黑色玄武岩裂谷', desc: '懸空在萬丈深淵之上的黑色岩橋，狂風中伴隨著撕裂靈魂的笛音。' },
          { title: '脈動黑泥廢墟', desc: '古老廢墟的石柱上覆蓋著正在緩緩蠕動的黏稠黑泥，伺機吞噬生命。' },
          { title: '非歐幾何迴廊', desc: '視覺感知完全錯亂的失真空間，不可名狀的形體從不可能的角度發動襲擊。' },
          { title: '腐化地脈裂隙', desc: '從地心噴湧而出的腐蝕冷氣，伴隨著原生質僕從的狂躁衝擊。' },
        ],
      },
      elite: {
        label: '舊日精英',
        variants: [
          { title: '太古原生質異構體', desc: '未完全成型的巨大修格斯分株，揮舞著數十條覆蓋巨目的觸手！' },
          { title: '盲目痴愚的守衛', desc: '無定形的盲目異形吹奏著無調長笛，空間在其周圍扭曲震盪！' },
        ],
      },
      event: {
        label: '秘識奇遇',
        variants: [
          { title: '虛空低語深淵', desc: '凝視著直通虛無的黑暗深淵，不可抗拒的聲音正引誘你向前邁步……' },
          { title: '遠古浮雕壁畫', desc: '刻劃著太古時代造物主與奴隸反叛歷史的巨型浮雕，散發著窒息威壓。' },
          { title: '燃燒的冷火祭壇', desc: '青黑色的火焰在無燃料的祭壇上燃燒，散發出刺骨寒意與心靈震撼。' },
          { title: '漂浮懸石銘文', desc: '逆反重力漂浮於空中的星際隕石，刻滿不可讀取的舊日神諭符號。' },
        ],
      },
      sanctuary: {
        label: '安全避難所',
        variants: [
          { title: '理智固化符文陣', desc: '太古先驅者留下的保護性幾何結界，暫時隔絕了深淵深處的狂亂侵蝕。' },
          { title: '舊神微光庇護所', desc: '雕刻著舊神印記的殘破石壁下，淡淡的暖光給予心靈最深層的慰藉。' },
          { title: '靜滯力場石窟', desc: '時間流速近乎凝滯的隱蔽凹室，能迅速修補瀕臨崩潰的精神防線。' },
        ],
      },
      market: {
        label: '黑市商人',
        variants: [
          { title: '異星物質行商', desc: '全身包裹在發光防護服中的異邦商人，展示著散發奇異輻射的稀世珍品。' },
          { title: '虛空引渡者暗座', desc: '無形的身影在石座上顯現，以古老靈魂金幣交換扭轉因果的強大咒術。' },
          { title: '禁斷星圖密閣', desc: '漂浮在半空中的發光星儀旁，兜售著能夠洞察宇宙深層奧秘的大師典籍。' },
        ],
      },
      boss: {
        label: '舊日宿敵',
        variants: [
          { title: '原形黑泥核心深淵', desc: '太古無底祭壇撕裂開來，山嶽般的原生巨型修格斯發出震耳欲聾的泰克利利笛音！' },
        ],
      },
      altar: {
        label: '禁忌祭壇',
        variants: [
          { title: '原形冷火祭壇', desc: '無定形黑泥環繞的太古祭壇，唯有承受錐心痛苦方能引動恩賜。' },
          { title: '虛空割裂之石', desc: '漂浮於深淵裂隙上的懸空石台，虛空中傳來索求代價的太古回音。' },
        ],
      },
      vault: {
        label: '遺物秘閣',
        variants: [
          { title: '先驅者造物秘匣', desc: '太古高維造物主留下的金屬秘倉，機械核心仍在緩慢運轉。' },
          { title: '星際物質保險庫', desc: '懸浮於反重力場中的發光方匣，蘊藏著顛覆常理的超自然遺物。' },
        ],
      },
      blood_altar: {
        label: '血之祭壇',
        variants: [
          { title: '深淵融解血池', desc: '冒著黑煙的太古原質血池，投入多餘思緒即可將其永久化為虛無。' },
          { title: '虛空燃魂之砧', desc: '以虛無冷火鍛燒靈魂的鐵砧，將不可名狀的污染卡牌自心靈永久拔除。' },
        ],
      },
      remains: {
        label: '屍骨遺骸',
        variants: [
          { title: '深淵遇難者殘骸', desc: '半融入黑色黏液岩壁的探險者遺骸，身旁的探險背包仍閃爍著微光。' },
        ],
      },
    },
  },
  4: {
    name: '星辰正位 · 拉萊耶核心終局圖',
    pools: {
      combat: {
        label: '常規遭遇',
        variants: [
          { title: '浸水巨石穹頂', desc: '萬丈高的綠色巨石建築群從深海浮出，舊日眷族正冷冷俯瞰著你。' },
          { title: '狂亂幾何階梯', desc: '向前走卻不斷向下墜落的悖論天梯，狂暴的神經衝擊每一步行進。' },
        ],
      },
      elite: {
        label: '舊日精英',
        variants: [
          { title: '星之眷族守門僕從', desc: '生有肉翼的巨型章魚異形守衛在神殿門前，發動毀滅性的心靈震盪！' },
        ],
      },
      event: {
        label: '秘識奇遇',
        variants: [
          { title: '群星歸位之裂隙', desc: '天幕被星辰軌跡撕裂，異界的超維光芒照亮了凡人渺小的命運。' },
          { title: '太古巨石銘文', desc: '銘刻著永恆沉睡之主不可直視名諱的石碑，蘊含著終結一切的鑰匙。' },
        ],
      },
      sanctuary: {
        label: '安全避難所',
        variants: [
          { title: '終焉平靜之隙', desc: '在群星交匯的引力死角中，片刻奇蹟般的虛無提供了最後的決死整頓。' },
        ],
      },
      market: {
        label: '黑市商人',
        variants: [
          { title: '星辰交匯殘光', desc: '在現實崩解的邊緣，最後的古幣化為守護人性的終極秘術卡牌。' },
        ],
      },
      boss: {
        label: '舊日宿敵',
        variants: [
          { title: '拉萊耶核心神殿', desc: '星辰正位！沉睡的克蘇魯星之眷族破門而出，神性不朽威壓籠罩萬物！' },
        ],
      },
      altar: {
        label: '禁忌祭壇',
        variants: [
          { title: '群星歸位祭禮壇', desc: '拉萊耶核心巨石頂端的星宿祭壇，宇宙維度在此崩塌交匯。' },
        ],
      },
      vault: {
        label: '遺物秘閣',
        variants: [
          { title: '拉萊耶原核密藏', desc: '群星歸位時方會開啟的深淵核心，封存著抵抗舊日支配者的最終遺物。' },
        ],
      },
      blood_altar: {
        label: '血之祭壇',
        variants: [
          { title: '終局血契聖座', desc: '面對終極恐怖前的決死儀式台，將所有軟弱思緒焚燒殆盡。' },
        ],
      },
      remains: {
        label: '屍骨遺骸',
        variants: [
          { title: '太古先驅者遺骸', desc: '倒在拉萊耶門扉前的孤獨骸骨，為後繼者留下了最後的指引。' },
        ],
      },
    },
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

function buildNodesAndLayers(
  layerTypePools: MapNodeType[][],
  outgoingEdges: string[][][],
  pools: Record<MapNodeType, { label: string; variants: Array<{ title: string; desc: string }> }>,
  pick: <T>(arr: T[]) => T,
  depth: DepthLevel = 1,
  rng: () => number = Math.random
): { nodes: Record<string, MapNode>; layers: string[][] } {
  const nodes: Record<string, MapNode> = {};
  const layers: string[][] = [];

  for (let l = 0; l < layerTypePools.length; l++) {
    const layerNodeIds: string[] = [];
    const count = layerTypePools[l].length;

    for (let c = 0; c < count; c++) {
      const nodeId = `node_${l}_${c}`;
      layerNodeIds.push(nodeId);
      const nodeType = layerTypePools[l][c];
      const theme = pools[nodeType];
      const variant = pick(theme.variants);
      const nextNodes = outgoingEdges[l]?.[c] ?? [];

      let enemyId: string | undefined = undefined;
      if (nodeType === 'combat' || nodeType === 'elite' || nodeType === 'boss') {
        const encounter = getEncounterEnemy(depth, nodeType, rng);
        enemyId = encounter.id;
      }

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
        enemyId,
      };
    }
    layers.push(layerNodeIds);
  }

  return { nodes, layers };
}

/**
 * 隨機程序化生成調查地圖（Procedural DAG Generation）
 * - Depths 1, 2, 3: 生成 16 個節點的多層級隨機連通 DAG（無死路通往該深度守關首領）。
 * - Depth 4: 生成 8 個緊湊高危終局節點 DAG。
 */
export function generateProceduralInvestigationMap(options?: MapGenerationOptions): InvestigationMap {
  const depth: DepthLevel = options?.depth ?? 1;
  const rng = options?.randomFn ?? (options?.seed !== undefined ? createPrng(options.seed) : Math.random);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

  const depthMeta = DEPTH_METADATA[depth] ?? DEPTH_METADATA[1];
  const pools = depthMeta.pools;

  if (depth === 4) {
    // Depth 4: 8 nodes DAG (4 layers: 2 + 2 + 3 + 1 = 8)
    const layerTypePools: MapNodeType[][] = [
      ['combat', 'event'],
      ['elite', 'sanctuary'],
      pick([
        ['vault', 'blood_altar', 'sanctuary'],
        ['market', 'altar', 'sanctuary'],
        ['vault', 'altar', 'combat'],
      ]),
      ['boss'],
    ];

    const outgoingEdges: string[][][] = [
      // Layer 0 (2 nodes) -> Layer 1
      [['node_1_0', 'node_1_1'], ['node_1_0', 'node_1_1']],
      // Layer 1 (2 nodes) -> Layer 2
      [['node_2_0', 'node_2_1'], ['node_2_1', 'node_2_2']],
      // Layer 2 (3 nodes) -> Layer 3 (Boss)
      [['node_3_0'], ['node_3_0'], ['node_3_0']],
      // Layer 3 (Boss)
      [[]],
    ];

    const { nodes, layers } = buildNodesAndLayers(layerTypePools, outgoingEdges, pools, pick, depth, rng);

    return {
      id: `map_depth_${depth}_${Math.floor(rng() * 1000000)}`,
      name: depthMeta.name,
      depth,
      nodes,
      layers,
      currentNodeId: null,
    };
  }

  const hasFallen = (options?.hasFallenInvestigator ?? hasFallenInvestigatorRecord()) && depth === 1;

  // Depths 1, 2, 3: 16 nodes DAG (6 layers: 2 + 3 + 3 + 4 + 3 + 1 = 16 nodes)
  const layer1Choices: MapNodeType[][] = hasFallen
    ? [
        ['remains', 'combat', 'market'],
        ['combat', 'remains', 'vault'],
        ['event', 'remains', 'market'],
      ]
    : [
        ['event', 'combat', 'vault'],
        ['combat', 'event', 'market'],
        ['event', 'vault', 'combat'],
        ['combat', 'vault', 'market'],
      ];

  const layerTypePools: MapNodeType[][] = [
    // Layer 0 (2 nodes: entry points)
    rng() > 0.5 ? ['combat', 'event'] : ['event', 'combat'],
    // Layer 1 (3 nodes: exploration & legacy)
    pick(layer1Choices),
    // Layer 2 (3 nodes: danger, refuge & altars)
    pick([
      ['combat', 'altar', 'sanctuary'],
      ['blood_altar', 'combat', 'market'],
      ['combat', 'event', 'blood_altar'],
      ['event', 'combat', 'sanctuary'],
    ]),
    // Layer 3 (4 nodes: turning point & elite encounters)
    pick([
      ['elite', 'market', 'vault', 'sanctuary'],
      ['altar', 'elite', 'market', 'combat'],
      ['sanctuary', 'elite', 'market', 'blood_altar'],
      ['event', 'altar', 'elite', 'market'],
    ]),
    // Layer 4 (3 nodes: final preparations)
    pick([
      ['sanctuary', 'blood_altar', 'altar'],
      ['market', 'altar', 'combat'],
      ['blood_altar', 'sanctuary', 'combat'],
      ['event', 'combat', 'sanctuary'],
    ]),
    // Layer 5 (1 node: boss)
    ['boss'],
  ];

  // Guaranteed reachability topology with zero dead ends
  const outgoingEdges: string[][][] = [
    // Layer 0 (2 nodes) -> Layer 1 (3 nodes)
    [
      ['node_1_0', 'node_1_1'],
      ['node_1_1', 'node_1_2'],
    ],
    // Layer 1 (3 nodes) -> Layer 2 (3 nodes)
    [
      ['node_2_0', 'node_2_1'],
      ['node_2_0', 'node_2_1', 'node_2_2'],
      ['node_2_1', 'node_2_2'],
    ],
    // Layer 2 (3 nodes) -> Layer 3 (4 nodes)
    [
      ['node_3_0', 'node_3_1'],
      ['node_3_0', 'node_3_1', 'node_3_2'],
      ['node_3_2', 'node_3_3'],
    ],
    // Layer 3 (4 nodes) -> Layer 4 (3 nodes)
    [
      ['node_4_0', 'node_4_1'],
      ['node_4_0', 'node_4_1'],
      ['node_4_1', 'node_4_2'],
      ['node_4_1', 'node_4_2'],
    ],
    // Layer 4 (3 nodes) -> Layer 5 (Boss)
    [
      ['node_5_0'],
      ['node_5_0'],
      ['node_5_0'],
    ],
    // Layer 5 (Boss)
    [[]],
  ];

  const { nodes, layers } = buildNodesAndLayers(layerTypePools, outgoingEdges, pools, pick, depth, rng);

  return {
    id: `map_depth_${depth}_${Math.floor(rng() * 1000000)}`,
    name: depthMeta.name,
    depth,
    nodes,
    layers,
    currentNodeId: null,
  };
}

/**
 * 產生調查地圖資料結構 (16+16+16+8 規格 · ADR-0015)
 * - 深度 1、2、3 一律產生 16 個節點（6 層：2+3+3+4+3+1）
 * - 深度 4 一律產生 8 個節點（4 層：2+2+3+1）
 * - 若未指定 options.procedural 且深度為 1，回傳確定性 16 節點基底範本
 * - 若指定 options.procedural 為 true，或深度 >= 2，則執行動態程序化隨機分佈生成
 */
export function generateInvestigationMap(options?: MapGenerationOptions): InvestigationMap {
  const depth: DepthLevel = options?.depth ?? 1;
  const isProcedural = options?.procedural ?? (depth > 1);

  if (isProcedural) {
    return generateProceduralInvestigationMap(options);
  }

  const nodes: Record<string, MapNode> = {};
  const layersMap: Record<number, string[]> = {};

  const hasFallen = Boolean(options?.hasFallenInvestigator) && depth === 1;

  for (const raw of BASE_MAP_TEMPLATE) {
    const isEntryLayer = raw.layer === 0;
    nodes[raw.id] = {
      ...raw,
      enemyId: raw.enemyId,
      status: isEntryLayer ? 'accessible' : 'unvisited',
    };

    if (!layersMap[raw.layer]) {
      layersMap[raw.layer] = [];
    }
    layersMap[raw.layer].push(raw.id);
  }

  if (hasFallen && nodes['node_1_0']) {
    const variant = DEPTH_METADATA[1].pools.remains.variants[0];
    nodes['node_1_0'] = {
      ...nodes['node_1_0'],
      type: 'remains',
      label: DEPTH_METADATA[1].pools.remains.label,
      title: variant.title,
      description: variant.desc,
    };
  }

  const sortedLayerKeys = Object.keys(layersMap)
    .map(Number)
    .sort((a, b) => a - b);
  const layers = sortedLayerKeys.map((k) => layersMap[k]);

  return {
    id: 'map_arkham_quarantine_01',
    name: '阿卡姆封鎖區調查圖',
    depth: 1,
    nodes,
    layers,
    currentNodeId: null,
  };
}

