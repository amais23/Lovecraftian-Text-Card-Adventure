import type { DepthLevel, Enemy } from '../types/game';
import {
  DEPTH_1_NORMAL_ENEMIES,
  DEPTH_1_ELITE_ENEMIES,
  DEPTH_2_NORMAL_ENEMIES,
  DEPTH_2_ELITE_ENEMIES,
  DEPTH_3_NORMAL_ENEMIES,
  DEPTH_3_ELITE_ENEMIES,
  DEPTH_4_NORMAL_ENEMIES,
  DEPTH_4_ELITE_ENEMIES,
  getBossByDepth,
} from '../engine/enemyCatalog';
import { resolveVerifiedEnemyArtworks } from '../engine/enemyArtworks';
import { MONSTER_TACTICAL_TIPS } from './monsterTips';

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

/**
 * 將 Engine 中的 Enemy 轉換為審查/圖鑑展示模型 (ADR-0035)
 */
function convertEnemyToReviewData(
  enemy: Enemy,
  depth: 1 | 2 | 3 | 4,
  role: 'normal' | 'elite' | 'boss'
): MonsterReviewData {
  const tips = MONSTER_TACTICAL_TIPS[enemy.id];

  const traitDef = enemy.traits && enemy.traits.length > 0 ? enemy.traits[0] : null;
  const trait = {
    name: traitDef?.name || '深淵特質',
    description: traitDef?.description || '未知舊日異變',
    trigger: tips?.traitTrigger || traitDef?.description || '於戰鬥攻防中被動觸發',
  };

  const intents = (enemy.intentSequence || (enemy.currentIntent ? [enemy.currentIntent] : [])).map((i) => ({
    name: i.name,
    type: i.type as 'attack' | 'erode' | 'defend' | 'apply_status',
    value: i.value,
    statusType: i.statusType,
    description: i.description || `${i.name} (${i.value})`,
  }));

  const tacticalTips = tips
    ? {
        threatSummary: tips.threatSummary,
        recommendedCards: [...tips.recommendedCards],
        strategy: tips.strategy,
      }
    : {
        threatSummary: '未知舊日威脅，請調查員提高警惕。',
        recommendedCards: ['雙管獵槍', '就地掩蔽', '醫療鎮定劑'],
        strategy: '及時建立護甲並使用高傷卡牌斬殺。',
      };

  const resolvedArt = resolveVerifiedEnemyArtworks(enemy.id, enemy.illustration);
  const imageUrl = resolvedArt.cartoonUrl;
  const realisticUrl = resolvedArt.realisticUrl;

  return {
    id: enemy.id,
    name: enemy.name,
    title: enemy.title,
    depth,
    role,
    health: enemy.health,
    armor: enemy.armor,
    category: enemy.category || 'abomination',
    imageUrl,
    realisticUrl,
    trait,
    intents,
    tacticalTips,
  };
}

/**
 * 動態從 Engine 組裝各深度怪物清單
 */
export function generateMonstersByDepth(): Record<1 | 2 | 3 | 4, MonsterReviewData[]> {
  const depths: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
  const result: Record<1 | 2 | 3 | 4, MonsterReviewData[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };

  const normalMap: Record<DepthLevel, Enemy[]> = {
    1: DEPTH_1_NORMAL_ENEMIES,
    2: DEPTH_2_NORMAL_ENEMIES,
    3: DEPTH_3_NORMAL_ENEMIES,
    4: DEPTH_4_NORMAL_ENEMIES,
  };

  const eliteMap: Record<DepthLevel, Enemy[]> = {
    1: DEPTH_1_ELITE_ENEMIES,
    2: DEPTH_2_ELITE_ENEMIES,
    3: DEPTH_3_ELITE_ENEMIES,
    4: DEPTH_4_ELITE_ENEMIES,
  };

  for (const depth of depths) {
    const seenIds = new Set<string>();
    const list: MonsterReviewData[] = [];

    // 1. 普通怪物
    for (const enemy of normalMap[depth]) {
      if (!seenIds.has(enemy.id)) {
        seenIds.add(enemy.id);
        list.push(convertEnemyToReviewData(enemy, depth, 'normal'));
      }
    }

    // 2. 精英怪物
    for (const enemy of eliteMap[depth]) {
      if (!seenIds.has(enemy.id)) {
        seenIds.add(enemy.id);
        list.push(convertEnemyToReviewData(enemy, depth, 'elite'));
      }
    }

    // 3. 守關首領
    const boss = getBossByDepth(depth);
    if (boss && !seenIds.has(boss.id)) {
      seenIds.add(boss.id);
      list.push(convertEnemyToReviewData(boss, depth, 'boss'));
    }

    result[depth] = list;
  }

  return result;
}

/**
 * 匯出各深度怪物資料（維持向後相容）
 */
export const MONSTERS_BY_DEPTH: Record<1 | 2 | 3 | 4, MonsterReviewData[]> = generateMonstersByDepth();
