import { describe, it, expect } from 'vitest';
import { generateStandaloneReviewHtml } from './generateStandaloneReviewHtml';

describe('generateStandaloneReviewHtml (Pure Unit Test without FS Side-effects)', () => {
  it('generates valid standalone review html structure with embedded cards and monsters data', () => {
    const html = generateStandaloneReviewHtml();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="zh-TW">');
    expect(html).toContain('ALL_CARD_REVIEW_ITEMS');
    expect(html).toContain('MONSTERS_BY_DEPTH');
    expect(html).toContain('EMBEDDED_INITIAL_DECISIONS');
    // ADR-0035 synthesized description and drift detection in standalone HTML
    expect(html).toContain('synthesized-desc-box');
    expect(html).toContain('drift-badge');
    expect(html).toContain('⚙️ 程式實際效果合成');
    // Ensure card count is dynamic rather than hardcoded 64
    expect(html).not.toContain('全 64 張卡牌');
    expect(html).not.toContain('卡牌改動審查 (64張)');
  });

  it('accepts custom options such as title and current decisions', () => {
    const customTitle = '測試卡牌實驗室';
    const html = generateStandaloneReviewHtml({
      title: customTitle,
      currentDecisions: {
        card_revolver_1: { decision: 'accepted', updatedAt: '2026-09-25T00:00:00Z' },
      },
    });

    expect(html).toContain(`<title>${customTitle}</title>`);
    expect(html).toContain('"card_revolver_1":{"decision":"accepted"');
  });
});
