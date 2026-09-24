import { describe, it, expect } from 'vitest';
import {
  synthesizeCardDescription,
  checkDescriptionDrift,
  formatEffectCondition,
} from './synthesizer';
import type { Card } from '../../types/game';

describe('Card Effect Synthesizer (ADR-0035)', () => {
  it('synthesizes damage, condition, and draw correctly', () => {
    const card: Pick<Card, 'effects' | 'keywords'> = {
      effects: [
        { type: 'damage', value: 5 },
        { type: 'draw', value: 1, condition: { type: 'target_has_status', statusType: 'vulnerable' } },
      ],
    };

    const text = synthesizeCardDescription(card);
    expect(text).toContain('造成 5 點物理傷害');
    expect(text).toContain('若目標處於【易傷】狀態，抽取 1 張卡牌');
  });

  it('synthesizes piercing damage and multiple hits', () => {
    const card: Pick<Card, 'effects' | 'keywords'> = {
      effects: [{ type: 'damage', value: 4, hitCount: 2, piercing: true }],
    };

    const text = synthesizeCardDescription(card);
    expect(text).toContain('造成 4 點穿透傷害（無視護甲） × 2 段');
  });

  it('synthesizes status effects and keywords', () => {
    const card: Pick<Card, 'effects' | 'keywords'> = {
      keywords: ['exhaust', 'retain'],
      effects: [
        { type: 'armor', value: 8 },
        { type: 'apply_status', target: 'enemy', statusType: 'weak', value: 2 },
      ],
    };

    const text = synthesizeCardDescription(card);
    expect(text).toContain('【保留】');
    expect(text).toContain('【消耗】打出後移出戰鬥');
    expect(text).toContain('獲得 8 點護甲');
    expect(text).toContain('使敵方陷入 2 層【破勢】');
  });

  it('formats condition clauses with formatEffectCondition helper without repeated switches', () => {
    const targetStatusCond = formatEffectCondition(
      { type: 'target_has_status', statusType: 'vulnerable', multiplier: 2 },
      12
    );
    expect(targetStatusCond.suffix).toContain('傷害翻倍為 24 點');

    const lowHealthCond = formatEffectCondition({ type: 'low_health', threshold: 0.5 });
    expect(lowHealthCond.prefix).toContain('若當前生命值不高於 50%');

    const firstCardCond = formatEffectCondition({ type: 'first_card_played' });
    expect(firstCardCond.prefix).toContain('若為本回合打出的首張卡牌');
  });

  it('avoids false positives on percentage scaling (100% vs multiplier 1 unit text)', () => {
    const written = '造成 4 點物理傷害，並附加等同於當前護甲 100% 的額外物理傷害。';
    const synth = '造成 4 點物理傷害（每具有 1 點護甲額外造成 1 點傷害）。';

    const drift = checkDescriptionDrift(written, synth);
    expect(drift.isMatch).toBe(true);
    expect(drift.differences).toHaveLength(0);
    expect(drift.detailedDifferences).toHaveLength(0);
  });

  it('avoids false positives on percentage thresholds (50% vs threshold 0.5)', () => {
    const written = '洗回 2 張卡牌至理智牌庫；若當前生命值不高於 50%，額外恢復 4 點肉體生命值。';
    const synth = '向理智牌庫注入/洗回 2 張卡牌；若當前生命值不高於 50%，額外恢復 4 點肉體生命值。';

    const drift = checkDescriptionDrift(written, synth);
    expect(drift.isMatch).toBe(true);
    expect(drift.differences).toHaveLength(0);
  });

  it('detects missing keywords or numbers in description drift check with structured detailedDifferences', () => {
    const written = '造成 5 點物理傷害。';
    const synth = '【消耗】打出後移出戰鬥 造成 5 點物理傷害；獲得 6 點護甲；使敵方陷入 1 層【易傷】。';

    const drift = checkDescriptionDrift(written, synth);
    expect(drift.isMatch).toBe(false);
    expect(drift.differences.length).toBeGreaterThan(0);
    expect(drift.differences.some((d) => d.includes('6'))).toBe(true);
    expect(drift.differences.some((d) => d.includes('易傷'))).toBe(true);
    expect(drift.differences.some((d) => d.includes('【消耗】'))).toBe(true);

    // Verify structured detailedDifferences
    expect(drift.detailedDifferences).toBeDefined();
    expect(drift.detailedDifferences.some((d) => d.type === 'value' && d.expected === 6)).toBe(true);
    expect(drift.detailedDifferences.some((d) => d.type === 'status' && d.field === '易傷')).toBe(true);
    expect(drift.detailedDifferences.some((d) => d.type === 'keyword' && d.field === 'exhaust')).toBe(true);
  });
});
