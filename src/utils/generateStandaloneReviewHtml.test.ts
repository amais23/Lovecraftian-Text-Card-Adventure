import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { generateStandaloneReviewHtml } from './generateStandaloneReviewHtml';

describe('generateStandaloneReviewHtml', () => {
  it('generates standalone review html containing cards and monsters data and keeps files in sync', () => {
    const html = generateStandaloneReviewHtml();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('ALL_CARD_REVIEW_ITEMS');
    expect(html).toContain('MONSTERS_BY_DEPTH');

    const rootPath = path.resolve(process.cwd(), 'card_review_lab.html');
    const publicPath = path.resolve(process.cwd(), 'public/card_review_lab.html');
    fs.writeFileSync(rootPath, html, 'utf-8');
    fs.writeFileSync(publicPath, html, 'utf-8');
    expect(fs.existsSync(rootPath)).toBe(true);
    expect(fs.existsSync(publicPath)).toBe(true);
  });
});
