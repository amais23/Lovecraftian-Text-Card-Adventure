import type { AltarRitual, AltarRitualId } from '../types/game';

export const ALTAR_RITUAL_POOL: readonly AltarRitual[] = [
  {
    id: 'flesh',
    name: '血肉之契 · 血肉淬鍊之誓',
    subtitle: '凡軀淬鍊',
    description:
      '以利刃割破掌心，以滾燙鮮血澆灌石刻古印。承受 6 點肉體生命值傷害，永久拓展肌體生命極限，最大生命值永久提升 5 點（並立即修補 5 點傷勢）。',
    costDescription: '承受 6 點傷害（生命須大於 6）',
    rewardDescription: '最大生命值永久 +5，並立即恢復 5 點生命值',
    iconName: 'heart',
  },
  {
    id: 'time_space',
    name: '時空之契 · 超維神經撕裂',
    subtitle: '神識拓印',
    description:
      '直視幽藍冷火中扭曲的超維幾何裂隙，忍受精神重創。可自主選擇承受 10 點生命值代價或損耗 2 點理智（自牌庫永久除役 2 張卡牌），永久拓展心智容量，手牌容量永久 +1（抽牌與保留手牌數同步提升 1 張）。',
    costDescription: '承受 10 點傷害（生命須大於 10）或損耗 2 點理智（除役 2 張牌）',
    rewardDescription: '手牌容量永久 +1（抽牌與保留手牌數提升 1 張）',
    iconName: 'book',
  },
  {
    id: 'void',
    name: '虛空之契 · 深淵恩賜喚引',
    subtitle: '隱密秘寶',
    description:
      '將鮮血浸入太古符文槽，自虛空裂隙中喚醒一件古老之物。承受 6 點生命值傷害，隨機獲取 1 件未持有的舊日遺物納入行囊（若已全數持有則獲取 35 枚古金幣）。',
    costDescription: '承受 6 點傷害（生命須大於 6）',
    rewardDescription: '隨機獲得 1 件未持有的舊日遺物（若全持有則獲得 35 枚古金幣）',
    iconName: 'sparkles',
  },
  {
    id: 'chaos',
    name: '混沌之契 · 混沌換金之誓',
    subtitle: '混沌換金',
    description:
      '向無序翻騰的原初混沌傾吐禱詞，以肉體創痛與部分理智記憶為祭品，換取深淵沉澱的古老財富。承受 4 點傷害並隨機除役 1 張卡牌，換取 50 枚古金幣。',
    costDescription: '承受 4 點傷害並隨機除役 1 張卡牌（牌庫須大於 1 張）',
    rewardDescription: '獲得 50 枚古金幣',
    iconName: 'coins',
  },
  {
    id: 'blood_pact',
    name: '血契之誓 · 禁忌真理之約',
    subtitle: '禁忌古契',
    description:
      '以極致深重的心頭精血締結古神盟約，將理智防禦推向極限。承受 8 點生命值傷害，將真相卡【心智防波堤】永久納入理智牌庫，並獲贈 25 枚古金幣。',
    costDescription: '承受 8 點傷害（生命須大於 8）',
    rewardDescription: '獲得真相卡【心智防波堤】與 25 枚古金幣',
    iconName: 'flame',
  },
];

export const ALTAR_RITUALS_BY_ID: Record<AltarRitualId, AltarRitual> = {
  flesh: ALTAR_RITUAL_POOL[0],
  time_space: ALTAR_RITUAL_POOL[1],
  mind: ALTAR_RITUAL_POOL[1],
  void: ALTAR_RITUAL_POOL[2],
  boon: ALTAR_RITUAL_POOL[2],
  chaos: ALTAR_RITUAL_POOL[3],
  blood_pact: ALTAR_RITUAL_POOL[4],
};

/**
 * 抽樣 3 種不同的古神儀式契約
 * @param randomFn 偽隨機數產生器（預設 Math.random，可注入特定種子）
 */
export function generateAltarRituals(randomFn: () => number = Math.random): AltarRitual[] {
  const pool = [...ALTAR_RITUAL_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

/**
 * 取得預設的 3 種儀式契約（用於回退或無狀態場景）
 */
export function getDefaultAltarRituals(): AltarRitual[] {
  return [
    ALTAR_RITUALS_BY_ID.flesh,
    ALTAR_RITUALS_BY_ID.time_space,
    ALTAR_RITUALS_BY_ID.void,
  ];
}
