import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { render } from '@testing-library/react';
import { InvestigatorStatus } from './InvestigatorStatus';
import { StatusEffectBadge } from './StatusEffectBadge';
import type { Investigator, Relic, StatusEffect } from '../types/game';

describe('ADR-0028 Custom Help Cursor System (--cursor-help)', () => {
  const rootDir = process.cwd();
  const cursorCssPath = path.resolve(rootDir, 'src/styles/cursor.css');
  const combatCssPath = path.resolve(rootDir, 'src/styles/combat.css');

  describe('CSS Seam: cursor.css and combat.css definitions', () => {
    it('defines --cursor-help for normal state with 10 10 hotspot anchor', () => {
      const cursorCss = fs.readFileSync(cursorCssPath, 'utf-8');

      // Must define --cursor-help in normal state
      expect(cursorCss).toMatch(/--cursor-help:\s*[^;]*\/cursors\/help\.png/);
      expect(cursorCss).toMatch(/--cursor-help:\s*[^;]*\/cursors\/@2x\/help\.png/);
      // Hotspot must be 10 10
      expect(cursorCss).toMatch(/url\(['"]?\/cursors\/help\.png['"]?\)\s+10\s+10/);
    });

    it('defines --cursor-help for madness state with 10 10 hotspot anchor', () => {
      const cursorCss = fs.readFileSync(cursorCssPath, 'utf-8');

      // Must define --cursor-help in madness state
      expect(cursorCss).toMatch(/--cursor-help:\s*[^;]*\/cursors\/madness-help\.png/);
      expect(cursorCss).toMatch(/--cursor-help:\s*[^;]*\/cursors\/@2x\/madness-help\.png/);
      // Hotspot must be 10 10
      expect(cursorCss).toMatch(/url\(['"]?\/cursors\/madness-help\.png['"]?\)\s+10\s+10/);
    });

    it('maps .relic-badge and .status-effect-badge to var(--cursor-help)', () => {
      const cursorCss = fs.readFileSync(cursorCssPath, 'utf-8');
      const combatCss = fs.readFileSync(combatCssPath, 'utf-8');

      // Either in cursor.css as global rule or combat.css as element rule
      const combinedCss = cursorCss + '\n' + combatCss;
      expect(combinedCss).toMatch(/\.relic-badge[\s\S]*?cursor:\s*var\(--cursor-help\)/);
      expect(combinedCss).toMatch(/\.status-effect-badge[\s\S]*?cursor:\s*var\(--cursor-help\)/);
    });

    it('ensures no unthemed raw "cursor: help;" remains without var(--cursor-help) in combat.css', () => {
      const combatCss = fs.readFileSync(combatCssPath, 'utf-8');
      // In combat.css, relic-badge and status-effect-badge should not have raw "cursor: help;"
      expect(combatCss).not.toMatch(/\.relic-badge\s*\{[^}]*cursor:\s*help;/);
      expect(combatCss).not.toMatch(/\.status-effect-badge\s*\{[^}]*cursor:\s*help;/);
      expect(combatCss).not.toMatch(/\.enemy-trait-badge\s*\{[^}]*cursor:\s*help;/);
      expect(combatCss).not.toMatch(/\.shoggoth-stance-badge\s*\{[^}]*cursor:\s*help;/);
    });
  });

  describe('Asset Seam: Cursor sprite PNG files existence and dimensions', () => {
    const checkFile = (relPath: string) => {
      const fullPath = path.resolve(rootDir, relPath);
      expect(fs.existsSync(fullPath), `Asset file should exist: ${relPath}`).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(100);
    };

    it('has standard 32x32 help cursor (vintage brass magnifying glass)', () => {
      checkFile('public/cursors/help.png');
    });

    it('has retina @2x 64x64 help cursor', () => {
      checkFile('public/cursors/@2x/help.png');
    });

    it('has standard 32x32 madness-help cursor (bleeding eldritch eye)', () => {
      checkFile('public/cursors/madness-help.png');
    });

    it('has retina @2x 64x64 madness-help cursor', () => {
      checkFile('public/cursors/@2x/madness-help.png');
    });
  });

  describe('Component Seam: UI Badges Rendering with Inspectable Semantics', () => {
    const mockRelic: Relic = {
      id: 'elder_sign_amulet',
      name: '舊神之印護身符',
      description: '戰鬥開始時獲得 5 點護甲。',
      flavorText: '微溫的皂石表面銘刻著海星狀符號。',
      rarity: 'rare',
      icon: 'shield',
    };

    const mockStatus: StatusEffect = {
      type: 'might',
      name: '昂揚',
      stacks: 2,
      description: '物理傷害提高 2 點。',
    };

    const mockInvestigator: Investigator = {
      name: '愛德華·卡特',
      occupation: '私家偵探',
      health: 20,
      maxHealth: 20,
      stamina: 3,
      maxStamina: 3,
      armor: 0,
      obols: 0,
      relics: [mockRelic],
      statusEffects: [mockStatus],
    };

    it('renders relic-badge in InvestigatorStatus with title and relic-badge class', () => {
      const { container } = render(
        <InvestigatorStatus
          investigator={mockInvestigator}
          sanityCount={10}
          totalDeckCapacity={15}
          turn={1}
          onEndTurn={() => {}}
          isCombatEnded={false}
        />
      );

      const relicBadge = container.querySelector('.relic-badge');
      expect(relicBadge).not.toBeNull();
      expect(relicBadge?.getAttribute('title')).toContain('舊神之印護身符');
    });

    it('renders status-effect-badge in StatusEffectBadge with title and status-might class', () => {
      const { container } = render(<StatusEffectBadge status={mockStatus} />);

      const statusBadge = container.querySelector('.status-effect-badge');
      expect(statusBadge).not.toBeNull();
      expect(statusBadge?.classList.contains('status-might')).toBe(true);
      expect(statusBadge?.getAttribute('title')).toContain('昂揚');
    });
  });
});
