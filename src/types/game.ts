export type CardCategory = 'combat' | 'skill' | 'magic' | 'truth' | 'madness';
export type CostType = 'stamina' | 'sanity' | 'free';
export type CardTier = 1 | 2 | 3 | 4;

export type StatusEffectType = 'might' | 'resilience' | 'vulnerable' | 'bleed' | 'horror' | 'weak';

export interface StatusEffect {
  type: StatusEffectType;
  name: string;
  stacks: number;
  description: string;
}

export type RelicRarity = 'common' | 'rare' | 'mythic';

export interface RelicModifier {
  maxHealth?: number;
  handCapacity?: number;
  startingArmor?: number;
  startingStamina?: number;
  startingStatusEffects?: Array<{ type: StatusEffectType; stacks: number }>;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  flavorText: string;
  rarity: RelicRarity;
  modifiers?: RelicModifier;
  icon?: string;
}

export interface CardEffect {
  type:
    | 'damage'
    | 'armor'
    | 'heal'
    | 'draw'
    | 'erode_sanity'
    | 'restore_sanity'
    | 'self_damage'
    | 'add_to_deck'
    | 'apply_status'
    | 'lose_armor'
    | 'cleanse_debuffs'
    | 'break_armor'
    | 'gain_stamina';
  value: number;
  statusType?: StatusEffectType;
  target?: 'self' | 'enemy';
  hitCount?: number;
  piercing?: boolean;
  scaleFrom?: 'armor' | 'sanity_inverse' | 'status_stacks';
  scaleMultiplier?: number;
  scaleStatusType?: StatusEffectType;
  condition?: {
    type: 'low_sanity' | 'low_health' | 'target_has_status' | 'enemy_intent_is_attack' | 'first_card_played';
    threshold?: number;
    statusType?: StatusEffectType;
    bonusValue?: number;
    multiplier?: number;
  };
}

export type OccupationId = 'investigator' | 'occultist';
export type CardKeyword = 'exhaust' | 'retain' | 'innate' | 'charge_growth';

export interface Card {
  id: string;
  name: string;
  category: CardCategory;
  costType: CostType;
  costValue: number;
  isTemporary: boolean;
  tier?: CardTier;
  isUnplayable?: boolean;
  keywords?: CardKeyword[];
  occupations?: OccupationId[];
  artworkUrl?: string;
  effects: CardEffect[];
  description: string;
  flavorText: string;
  retainedTurns?: number;
}

export type EnemyIntentType = 'attack' | 'erode' | 'defend' | 'apply_status' | 'charge';

export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
  name: string;
  description: string;
  statusType?: StatusEffectType;
  additionalStatuses?: StatusEffect[];
  hitCount?: number;
  drainStamina?: number;
  reduceDraw?: number;
  isCharge?: boolean;
  selfDamage?: number;
}

export type EnemyTraitId =
  | 'zealous_blood_oath'      // 阿卡姆異教徒：狂熱血契
  | 'carrion_feeder'          // 食屍鬼潛伏者：食腐本能
  | 'faceless_terror'         // 夜魘：無貌深淵
  | 'ossuary_summoning'       // 食屍鬼大祭司：白骨聚生
  | 'slippery_mucus'          // 深潛者戰士：滑膩黏液
  | 'waterlogged_grip'        // 溺亡者魂魄：水下寒骨
  | 'tide_of_dagon'           // 大袞深淵祭司：大袞潮汐
  | 'amorphous_body'          // 無定形原生質僕從：非歐流體
  | 'organ_proliferation'     // 修格斯：器官增生 & Tekeli-li 碾壓
  | 'divine_immortality'      // 克蘇魯星之眷族：神性不滅
  | 'swarm_evasion'           // 牆中變異鼠群：鼠群竄動
  | 'blood_fanaticism'        // 異教狂熱信徒：狂信之血
  | 'septic_carapace'         // 墓穴腐生蠕蟲：腐殖外皮
  | 'siren_lure'              // 潮汐塞壬海妖：惑心溺音
  | 'amphibious_vigor'        // 印斯茅斯混血種：兩棲畸變
  | 'razor_shell'             // 深海寄生藤壺群：銳刃甲殼
  | 'surgical_bio_shock'      // 米·戈偵察者：真菌外科術
  | 'dimensional_phase'       // 虛空漫遊者：維度相位
  | 'discordant_dirge'        // 外神盲目吹笛者：無調輓歌
  | 'oneiric_dread'           // 拉萊耶夢境具象：萬古夢魘
  | 'geometric_paradox'       // 非歐幾何異構體：幾何悖論
  | 'prophecy_of_ruin';       // 終焉星辰先知：滅世預言

export interface EnemyTrait {
  id: EnemyTraitId;
  name: string;
  description: string;
  icon?: string;
}

export type EnemyCategory =
  | 'cultist'
  | 'ghoul'
  | 'nightgaunt'
  | 'deep_one'
  | 'drowned'
  | 'shoggoth'
  | 'byakhee'
  | 'formless'
  | 'hound'
  | 'star_spawn'
  | 'ancient_guardian'
  | 'rat_swarm'
  | 'migo'
  | 'boss';

export interface EnemyIllustrationUrls {
  cartoonUrl?: string;
  realisticUrl?: string;
}

export interface Enemy {
  id: string;
  name: string;
  title: string;
  health: number;
  maxHealth: number;
  armor: number;
  divineImmortality?: boolean;
  currentIntent: EnemyIntent;
  intentSequence?: EnemyIntent[];
  currentIntentIndex?: number;
  statusEffects?: StatusEffect[];
  category?: EnemyCategory;
  illustration?: EnemyIllustrationUrls;
  traits?: EnemyTrait[];
  accumulatedDamageTaken?: number;
  shoggothStance?: 'normal' | 'eyes' | 'claws' | 'hide' | 'charging';
}


export interface Investigator {
  name: string;
  occupation: string;
  occupationId?: OccupationId;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  armor: number;
  obols: number;
  handCapacity?: number; // 可變動手牌容量（開局基準值 2，抽牌數 = 手牌保留數）
  relics?: Relic[];      // 持有之舊日遺物（跨戰鬥永久生效）
  statusEffects?: StatusEffect[]; // 戰鬥內暫態印記（戰後清空）
}

export type MapNodeType =
  | 'combat'
  | 'elite'
  | 'event'
  | 'sanctuary'
  | 'market'
  | 'boss'
  | 'altar'
  | 'vault'
  | 'blood_altar'
  | 'remains';

export interface FallenInvestigatorRecord {
  name: string;
  occupation: string;
  occupationId?: OccupationId;
  deck: Card[];
  obols: number;
  depth: DepthLevel;
  causeOfDeath: string;
  timestamp: number;
}

export interface MapNode {
  id: string;
  type: MapNodeType;
  layer: number;
  col: number;
  label: string;
  title: string;
  description: string;
  nextNodes: string[];
  status: 'unvisited' | 'current' | 'visited' | 'accessible';
  enemyId?: string;
}

export type DepthLevel = 1 | 2 | 3 | 4;

export interface InvestigationMap {
  id: string;
  name: string;
  depth?: DepthLevel;
  nodes: Record<string, MapNode>;
  layers: string[][];
  currentNodeId: string | null;
  isCompleted?: boolean;
}

export interface MythosEventConsequence {
  type: 'health_change' | 'sanity_change' | 'gain_obols' | 'gain_card' | 'trigger_combat' | 'gain_relic';
  value?: number;
  card?: Card;
  relic?: Relic;
  enemy?: Enemy;
  narrative: string;
}

export interface MythosEventOption {
  id: string;
  text: string;
  costDescription?: string;
  requires?: { obols?: number; health?: number };
  consequences: MythosEventConsequence[];
}

export interface MythosEvent {
  id: string;
  title: string;
  location: string;
  storyText: string[];
  options: MythosEventOption[];
  selectedOptionId?: string;
  resolvedOutcomeText?: string[];
}

export interface MarketItem {
  id: string;
  name: string;
  type: 'card' | 'heal' | 'relic';
  price: number;
  originalPrice?: number;
  isDiscounted?: boolean;
  discountLabel?: string;
  card?: Card;
  relic?: Relic;
  healAmount?: number;
  description: string;
  isPurchased?: boolean;
  artworkUrl?: string;
}

export interface AdventureStats {
  enemiesDefeated: number;
  totalObolsCollected: number;
  nodesVisited: number;
  maxLayer: number;
}

export type AltarRitualId = 'flesh' | 'time_space' | 'void' | 'chaos' | 'blood_pact' | 'mind' | 'boon';

export interface AltarRitual {
  id: AltarRitualId;
  name: string;
  subtitle: string;
  description: string;
  costDescription: string;
  rewardDescription: string;
  iconName: 'heart' | 'book' | 'sparkles' | 'flame' | 'coins';
}

export interface GameState {
  phase:
    | 'title'
    | 'prologue'
    | 'occupation_select'
    | 'departure'
    | 'map'
    | 'combat'
    | 'victory'
    | 'reward'
    | 'event'
    | 'sanctuary'
    | 'market'
    | 'depth_transition'
    | 'gameover'
    | 'altar'
    | 'vault'
    | 'blood_altar'
    | 'remains';
  currentDepth: DepthLevel;
  turn: number;
  investigator: Investigator;
  sanityDeck: Card[]; // 牌庫剩餘數量即等同於當前理智值 (Sanity)
  hand: Card[];       // 當前手牌
  discardPile: Card[];
  exhaustPile?: Card[]; // 消耗堆（本場戰鬥移出循環牌庫）
  isMadness: boolean;
  currentEnemy: Enemy;
  battleLog: string[];
  rewardCards?: Card[];
  rewardObols?: number;
  map?: InvestigationMap;
  currentEvent?: MythosEvent;
  sanctuaryUsed?: boolean;
  marketItems?: MarketItem[];
  marketPurgeUsed?: boolean;
  altarUsed?: boolean;
  altarRituals?: AltarRitual[];
  vaultRelics?: Relic[];
  vaultClaimed?: boolean;
  bloodAltarUsed?: boolean;
  fallenInvestigator?: FallenInvestigatorRecord | null;
  remainsClaimed?: boolean;
  adventureStats?: AdventureStats;
  abyssalSealFused?: boolean;
  isTrueEnding?: boolean;
  discardPhase?: {
    requiredDiscardCount: number;
    selectedDiscardIds: string[];
  };
  combatInitialHealth?: number; // 踏入當前戰鬥時的初始生命值快照（重試戰鬥時精確還原）
  cardsPlayedThisTurn?: number; // 本回合內已打出的卡牌總數（用於先手拔槍等條件判斷）
  visitedEventIds?: string[]; // 本次冒險已遭遇的奇遇事件 ID 列表（用於單局防重複抽樣）
  lastCombatEnemyId?: string; // 上一次戰鬥遭遇的敵人 ID（用於同一深度內防連續重複遭遇輪替）
}

export type GameAction =
  | { type: 'START_NEW_INVESTIGATION' }
  | { type: 'COMPLETE_PROLOGUE' }
  | { type: 'COMPLETE_DEPARTURE' }
  | { type: 'SELECT_OCCUPATION'; payload: { occupationId: OccupationId; initialPhase?: GameState['phase']; procedural?: boolean; map?: InvestigationMap } }
  | { type: 'NAVIGATE_TO_NODE'; payload: { nodeId: string; shuffledDeck?: Card[]; enemy?: Enemy } }
  | { type: 'RESOLVE_EVENT_OPTION'; payload: { optionId: string; shuffledDeck?: Card[] } }
  | { type: 'COMPLETE_EVENT' }
  | { type: 'USE_SANCTUARY'; payload: { optionId: 'bandage' | 'meditate' | 'purge'; cardId?: string } }
  | { type: 'LEAVE_SANCTUARY' }
  | { type: 'BUY_MARKET_ITEM'; payload: { itemId: string } }
  | { type: 'PURGE_CARD_AT_MARKET'; payload: { cardId: string } }
  | { type: 'LEAVE_MARKET' }
  | { type: 'PROCEED_TO_REWARD'; payload?: { rewardCards?: Card[]; rewardObols?: number; shuffledDeck?: Card[] } }
  | { type: 'CLAIM_CARD_REWARD'; payload?: { cardId?: string; shuffledDeck?: Card[] } }
  | { type: 'CLAIM_FIELD_DRESSING'; payload?: { healAmount?: number; shuffledDeck?: Card[] } }
  | { type: 'CLAIM_ABYSSAL_SEAL'; payload?: { shuffledDeck?: Card[] } }
  | { type: 'COMPLETE_DEPTH_TRANSITION' }
  | { type: 'RETURN_TO_TITLE' }
  | { type: 'START_COMBAT'; payload?: { enemy?: Enemy; initialCards?: Card[]; investigator?: Investigator } }
  | { type: 'PLAY_CARD'; payload: { cardId: string } }
  | { type: 'END_TURN' }
  | { type: 'TOGGLE_DISCARD_CARD'; payload: { cardId: string } }
  | { type: 'CONFIRM_DISCARD'; payload?: { cardIds?: string[] } }
  | { type: 'CANCEL_DISCARD' }
  | { type: 'DISCARD_CARDS_TO_LIMIT'; payload: { cardIds: string[] } }
  | { type: 'ACQUIRE_RELIC'; payload: { relic: Relic } }
  | { type: 'APPLY_STATUS_EFFECT'; payload: { target: 'investigator' | 'enemy'; effect: StatusEffect } }
  | { type: 'RESET_COMBAT'; payload?: { occupationId?: OccupationId; enemy?: Enemy; initialCards?: Card[]; initialHealth?: number } }
  | { type: 'USE_ALTAR'; payload: { optionId: AltarRitualId; costType?: 'health' | 'sanity'; cardId?: string } }
  | { type: 'LEAVE_ALTAR' }
  | { type: 'CLAIM_VAULT_RELIC'; payload: { relicId?: string; relicIds?: string[]; desecrate?: boolean; claimObols?: boolean } }
  | { type: 'LEAVE_VAULT' }
  | { type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR'; payload: { cardIds: string[]; branch?: 'pure' | 'reshape' } }
  | { type: 'LEAVE_BLOOD_ALTAR' }
  | { type: 'INHERIT_REMAINS'; payload: { type: 'card'; cardId: string } | { type: 'obols' } }
  | { type: 'LEAVE_REMAINS' };
