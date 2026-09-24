import type { Card, CardEffect, StatusEffectType } from '../../types/game';

export const STATUS_NAMES: Record<StatusEffectType, string> = {
  might: '力量',
  resilience: '堅韌',
  vulnerable: '易傷',
  bleed: '流血',
  horror: '驚恐',
  weak: '破勢',
};

export interface CardDriftDifference {
  type: 'value' | 'keyword' | 'status';
  field: string;
  expected?: any;
  actual?: any;
  message: string;
}

export interface DescriptionDriftResult {
  isMatch: boolean;
  differences: string[];
  detailedDifferences: CardDriftDifference[];
}

/**
 * 格式化單一效果之條件與數值修正子句 (ADR-0035)
 * 統一抽離條件解析邏輯，消除 Repeated Switches 壞味道
 */
export function formatEffectCondition(
  condition: NonNullable<CardEffect['condition']>,
  baseValue?: number
): { prefix?: string; suffix?: string } {
  switch (condition.type) {
    case 'target_has_status': {
      const sName = condition.statusType ? STATUS_NAMES[condition.statusType] || condition.statusType : '狀態';
      if (condition.multiplier && baseValue !== undefined) {
        return { suffix: `；若目標處於【${sName}】狀態，傷害翻倍為 ${baseValue * condition.multiplier} 點` };
      }
      if (condition.bonusValue && baseValue !== undefined) {
        return { suffix: `；若目標處於【${sName}】狀態，傷害提升至 ${baseValue + condition.bonusValue} 點` };
      }
      return { prefix: `若目標處於【${sName}】狀態，` };
    }

    case 'low_sanity': {
      const threshold = condition.threshold ?? 4;
      if (condition.bonusValue) {
        return { suffix: `；若剩餘理智不高於 ${threshold} 張，額外追加 ${condition.bonusValue} 點傷害` };
      }
      if (condition.multiplier && baseValue !== undefined) {
        return { suffix: `；若剩餘理智不高於 ${threshold} 張，傷害提升至 ${baseValue * condition.multiplier} 點` };
      }
      return { prefix: `若理智值不高於 ${threshold}，` };
    }

    case 'low_health': {
      const t = condition.threshold;
      const threshStr = t !== undefined && t <= 1 ? `${Math.round(t * 100)}%` : `${t ?? 10}`;
      return { prefix: `若當前生命值不高於 ${threshStr}，額外` };
    }

    case 'enemy_intent_is_attack':
      return { prefix: '若敵方當前意圖為攻擊，' };

    case 'first_card_played':
      return { prefix: '若為本回合打出的首張卡牌，' };

    default:
      return {};
  }
}

/**
 * 依據單一卡牌效果與條件合成中文敘述句 (ADR-0035)
 */
export function synthesizeSingleEffect(effect: CardEffect): string {
  let mainClause = '';

  switch (effect.type) {
    case 'damage': {
      let dmgText = `造成 ${effect.value} 點`;
      if (effect.piercing) {
        dmgText += '穿透傷害（無視護甲）';
      } else {
        dmgText += '物理傷害';
      }

      if (effect.hitCount && effect.hitCount > 1) {
        dmgText += ` × ${effect.hitCount} 段`;
      }

      if (effect.scaleFrom === 'armor') {
        const mult = effect.scaleMultiplier ?? 1;
        dmgText += `（每具有 1 點護甲額外造成 ${mult} 點傷害）`;
      } else if (effect.scaleFrom === 'sanity_inverse') {
        const mult = effect.scaleMultiplier ?? 1;
        dmgText += `（理智牌庫每減少 1 張卡牌，傷害提升 ${mult} 點）`;
      } else if (effect.scaleFrom === 'status_stacks') {
        const mult = effect.scaleMultiplier ?? 1;
        if (effect.scaleStatusType) {
          const sName = STATUS_NAMES[effect.scaleStatusType] || effect.scaleStatusType;
          dmgText += `（目標每具有 1 層【${sName}】印記使傷害 +${mult}）`;
        } else {
          dmgText += `（目標身上每具有 1 層【流血】或【恐慌】印記，額外造成 ${mult} 點傷害）`;
        }
      }

      mainClause = dmgText;
      break;
    }

    case 'armor': {
      let armorText = `獲得 ${effect.value} 點護甲`;
      if (effect.scaleFrom === 'armor') {
        armorText += '（額外享受護甲翻倍）';
      }
      mainClause = armorText;
      break;
    }

    case 'heal':
      mainClause = `恢復 ${effect.value} 點肉體生命值`;
      break;

    case 'draw':
      mainClause = `抽取 ${effect.value} 張卡牌`;
      break;

    case 'erode_sanity':
      mainClause = `侵蝕自牌庫頂棄置 ${effect.value} 張卡牌（損失 ${effect.value} 點理智）`;
      break;

    case 'restore_sanity':
      mainClause = `向理智牌庫注入/洗回 ${effect.value} 張卡牌`;
      break;

    case 'self_damage':
      mainClause = `自身承受 ${effect.value} 點反噬傷害`;
      break;

    case 'add_to_deck':
      mainClause = `向理智牌庫注入 ${effect.value} 張卡牌`;
      break;

    case 'apply_status': {
      const sName = effect.statusType ? STATUS_NAMES[effect.statusType] || effect.statusType : '狀態';
      const targetStr = effect.target === 'self' ? '自身' : '敵方';
      mainClause = `使${targetStr}陷入 ${effect.value} 層【${sName}】`;
      break;
    }

    case 'lose_armor':
      mainClause = `自身失去 ${effect.value} 點護甲`;
      break;

    case 'cleanse_debuffs':
      mainClause = '清除自身所有負面狀態印記';
      break;

    case 'break_armor':
      mainClause = '完全破除敵方所有當前護甲';
      break;

    case 'gain_stamina':
      mainClause = `回復 ${effect.value} 點精力`;
      break;

    default:
      mainClause = `觸發特殊效果 (${(effect as any).type})`;
      break;
  }

  // 套用條件子句
  if (effect.condition) {
    const { prefix, suffix } = formatEffectCondition(effect.condition, effect.value);
    if (prefix) {
      mainClause = prefix + mainClause;
    }
    if (suffix) {
      mainClause = mainClause + suffix;
    }
  }

  return mainClause;
}

/**
 * 依據卡牌效果、關鍵字與數值，純程式自動合成中文標準效果描述
 */
export function synthesizeCardDescription(card: Pick<Card, 'effects' | 'keywords'>): string {
  const clauses: string[] = [];

  // 1. 關鍵字標籤
  const keywords = card.keywords || [];
  const keywordTags: string[] = [];
  if (keywords.includes('innate')) {
    keywordTags.push('【固有】');
  }
  if (keywords.includes('retain')) {
    keywordTags.push('【保留】');
  }
  if (keywords.includes('exhaust')) {
    keywordTags.push('【消耗】打出後移出戰鬥');
  }
  if (keywords.includes('charge_growth')) {
    keywordTags.push('【蓄力加固】在手中每保留 1 回合打出額外 +2 護甲（至多 +6）');
  }

  // 2. 各效果語句
  if (card.effects && card.effects.length > 0) {
    for (const effect of card.effects) {
      const clause = synthesizeSingleEffect(effect);
      if (clause) {
        clauses.push(clause);
      }
    }
  }

  // 組合句子
  let result = clauses.join('；');
  if (result.length > 0 && !result.endsWith('。')) {
    result += '。';
  }

  if (keywordTags.length > 0) {
    result = `${keywordTags.join('')}${result ? ' ' + result : ''}`;
  }

  return result.trim();
}

/**
 * 簡易數值與關鍵詞比對：檢測手寫人文描述與程式合成效果是否存在實質出入
 */
export function checkDescriptionDrift(
  writtenDescription: string,
  synthesizedDescription: string
): DescriptionDriftResult {
  const differences: string[] = [];
  const detailedDifferences: CardDriftDifference[] = [];

  // 抽取手寫描述中的阿拉伯數字
  const writtenNumbers = (writtenDescription.match(/\d+/g) || []).map(Number);
  // 若手寫描述包含百分比（如 100%），實質對應數值 1 (100% = 1.0)
  if (writtenDescription.includes('100%') || writtenDescription.includes('100 %')) {
    writtenNumbers.push(1);
  }

  // 過濾合成描述中的單位量詞（如 "每具有 1 點", "每減少 1 張"），避免 1:1 比例縮放產生誤報
  const synthTextWithoutScaleUnit = synthesizedDescription
    .replace(/每具有\s*1\s*點/g, '')
    .replace(/每減少\s*1\s*張/g, '')
    .replace(/每具有\s*1\s*層/g, '')
    .replace(/每有\s*1\s*層/g, '')
    .replace(/每保留\s*1\s*回合/g, '');

  const synthNumbers = (synthTextWithoutScaleUnit.match(/\d+/g) || []).map(Number);

  // 檢查所有合成數字是否在手寫描述中出現過
  for (const num of synthNumbers) {
    if (!writtenNumbers.includes(num)) {
      const msg = `效果數值 ${num} 未在手寫描述中體現`;
      differences.push(msg);
      detailedDifferences.push({
        type: 'value',
        field: 'value',
        expected: num,
        actual: writtenNumbers,
        message: msg,
      });
    }
  }

  // 檢查關鍵字
  if (synthesizedDescription.includes('【消耗】') && !writtenDescription.includes('【消耗】')) {
    const msg = '缺少【消耗】關鍵字標註';
    differences.push(msg);
    detailedDifferences.push({
      type: 'keyword',
      field: 'exhaust',
      expected: '【消耗】',
      actual: null,
      message: msg,
    });
  }
  if (synthesizedDescription.includes('【保留】') && !writtenDescription.includes('【保留】')) {
    const msg = '缺少【保留】關鍵字標註';
    differences.push(msg);
    detailedDifferences.push({
      type: 'keyword',
      field: 'retain',
      expected: '【保留】',
      actual: null,
      message: msg,
    });
  }
  if (synthesizedDescription.includes('【固有】') && !writtenDescription.includes('【固有】')) {
    const msg = '缺少【固有】關鍵字標註';
    differences.push(msg);
    detailedDifferences.push({
      type: 'keyword',
      field: 'innate',
      expected: '【固有】',
      actual: null,
      message: msg,
    });
  }

  // 檢查主要狀態標籤
  for (const [_, name] of Object.entries(STATUS_NAMES)) {
    if (synthesizedDescription.includes(`【${name}】`) && !writtenDescription.includes(`【${name}】`)) {
      const msg = `效果施加了【${name}】，但手寫文案中未提及`;
      differences.push(msg);
      detailedDifferences.push({
        type: 'status',
        field: name,
        expected: name,
        actual: null,
        message: msg,
      });
    }
  }

  return {
    isMatch: differences.length === 0,
    differences,
    detailedDifferences,
  };
}
