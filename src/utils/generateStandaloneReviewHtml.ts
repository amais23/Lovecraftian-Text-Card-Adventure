import { ALL_CARD_REVIEW_ITEMS, type StoredReviewDecision } from '../data/cardReviewData';
import { MONSTERS_BY_DEPTH } from '../data/monsterReviewData';

export interface GenerateHtmlOptions {
  currentDecisions?: Record<string, StoredReviewDecision>;
  title?: string;
}

export function generateStandaloneReviewHtml(options: GenerateHtmlOptions = {}): string {
  const initialDecisions = options.currentDecisions || {};
  const pageTitle = options.title || '克蘇魯卡牌改動審查與數值實驗室 (可攜式單一 HTML 版)';

  const cardsDataJson = JSON.stringify(ALL_CARD_REVIEW_ITEMS);
  const monstersDataJson = JSON.stringify(MONSTERS_BY_DEPTH);
  const initialDecisionsJson = JSON.stringify(initialDecisions);

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <style>
    /* =========================================================
       Lovecraftian Gothic Aesthetic Theme (Standalone Version)
       ========================================================= */
    :root {
      --bg-base: #0a0d14;
      --bg-panel: #11141d;
      --bg-card: rgba(20, 24, 36, 0.85);
      --bg-card-hover: rgba(24, 28, 44, 0.95);
      --gold-primary: #cfa866;
      --gold-bright: #ffd700;
      --gold-dim: rgba(207, 168, 102, 0.35);
      --combat-red: #e63946;
      --skill-orange: #f4a261;
      --magic-purple: #9333ea;
      --truth-cyan: #38bdf8;
      --madness-dark: #64748b;
      --green-accept: #34d399;
      --red-reject: #f87171;
      --yellow-pending: #fbbf24;
      --text-main: #e2e8f0;
      --text-dim: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background: var(--bg-base);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Container Window */
    .review-lab-window {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #11141d 0%, #0d0f17 100%);
      overflow: hidden;
    }

    /* Header */
    .review-lab-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      background: rgba(13, 16, 24, 0.95);
      border-bottom: 1px solid var(--gold-dim);
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-titles h1 {
      font-size: 18px;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-titles p {
      font-size: 12px;
      color: var(--text-dim);
      margin-top: 3px;
    }

    .header-mode-tabs {
      display: flex;
      background: rgba(0, 0, 0, 0.4);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      gap: 6px;
    }

    .mode-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px;
      border-radius: 6px;
      background: transparent;
      border: none;
      color: var(--text-dim);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mode-tab-btn:hover {
      color: #fff;
    }

    .mode-tab-btn.active {
      background: rgba(207, 168, 102, 0.2);
      color: var(--gold-bright);
      border: 1px solid var(--gold-dim);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    /* Stats & Quick Actions Bar */
    .review-stats-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 24px;
      background: rgba(18, 22, 33, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      flex-wrap: wrap;
      gap: 12px;
    }

    .stats-cluster {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .stat-pill strong {
      font-size: 13px;
    }

    .stat-pill.total { border-color: var(--gold-dim); color: var(--gold-primary); }
    .stat-pill.accepted { border-color: rgba(52, 211, 153, 0.3); color: var(--green-accept); }
    .stat-pill.rejected { border-color: rgba(248, 113, 113, 0.3); color: var(--red-reject); }
    .stat-pill.pending { border-color: rgba(251, 191, 36, 0.3); color: var(--yellow-pending); }

    .actions-cluster {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    .action-btn.accept-all {
      background: rgba(52, 211, 153, 0.15);
      border-color: rgba(52, 211, 153, 0.35);
      color: var(--green-accept);
    }

    .action-btn.accept-all:hover {
      background: rgba(52, 211, 153, 0.25);
    }

    .action-btn.save-html {
      background: rgba(207, 168, 102, 0.18);
      border-color: var(--gold-primary);
      color: var(--gold-bright);
    }

    .action-btn.save-html:hover {
      background: rgba(207, 168, 102, 0.3);
      box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
    }

    /* Filter Panel */
    .review-filter-panel {
      padding: 10px 24px;
      background: rgba(15, 18, 28, 0.7);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .filter-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-dim);
      min-width: 55px;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-dim);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-chip:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .filter-chip.active {
      background: rgba(207, 168, 102, 0.2);
      border-color: var(--gold-bright);
      color: var(--gold-bright);
      font-weight: 600;
    }

    .filter-chip.combat.active { background: rgba(230, 57, 70, 0.25); border-color: #e63946; color: #ff6b6b; }
    .filter-chip.skill.active { background: rgba(244, 162, 97, 0.25); border-color: #f4a261; color: #f4a261; }
    .filter-chip.magic.active { background: rgba(147, 51, 234, 0.25); border-color: #9333ea; color: #c084fc; }
    .filter-chip.truth.active { background: rgba(56, 189, 248, 0.25); border-color: #38bdf8; color: #7dd3fc; }
    .filter-chip.madness.active { background: rgba(100, 116, 139, 0.25); border-color: #64748b; color: #cbd5e1; }

    .search-box-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 5px 12px;
      width: 100%;
      max-width: 500px;
      margin-top: 2px;
    }

    .search-box-wrapper input {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 13px;
      width: 100%;
      outline: none;
    }

    /* Cards Layout & Scroll Container */
    .review-cards-layout {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .review-cards-list-container {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
      outline: none;
    }

    /* Card Item */
    .card-review-card {
      display: grid;
      grid-template-columns: 240px 1fr 280px;
      gap: 20px;
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 16px;
      transition: all 0.2s ease;
      position: relative;
    }

    .card-review-card:hover {
      background: var(--bg-card-hover);
      border-color: rgba(207, 168, 102, 0.35);
    }

    .card-review-card.decision-accepted {
      border-left: 5px solid var(--green-accept);
    }

    .card-review-card.decision-rejected {
      border-left: 5px solid var(--red-reject);
      opacity: 0.75;
    }

    .card-review-card.decision-pending {
      border-left: 5px solid var(--yellow-pending);
    }

    /* Left Visual Column */
    .card-visual-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .card-art-box {
      width: 140px;
      height: 105px;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
      background: #000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-art-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .art-fallback-icon {
      font-size: 32px;
      opacity: 0.8;
    }

    .category-tag {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 0;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .category-tag.combat { background: rgba(230, 57, 70, 0.9); }
    .category-tag.skill { background: rgba(244, 162, 97, 0.9); }
    .category-tag.magic { background: rgba(147, 51, 234, 0.9); }
    .category-tag.truth { background: rgba(56, 189, 248, 0.9); }
    .category-tag.madness { background: rgba(100, 116, 139, 0.9); }

    .card-title-name {
      font-size: 16px;
      font-weight: 700;
      color: #f8fafc;
      margin: 10px 0 6px 0;
    }

    .meta-badges-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .badge-pill {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
    }

    .badge-pill.tier-starter { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; }
    .badge-pill.tier-1 { background: rgba(52, 211, 153, 0.2); color: #6ee7b7; }
    .badge-pill.tier-2 { background: rgba(56, 189, 248, 0.2); color: #7dd3fc; }
    .badge-pill.tier-3 { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; }
    .badge-pill.tier-4 { background: rgba(251, 191, 36, 0.25); color: #fde047; }
    .badge-pill.tier-special { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

    .card-id-label {
      font-size: 11px;
      color: #64748b;
      margin-top: 6px;
      font-family: monospace;
    }

    /* Center Comparison Column */
    .card-comparison-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .version-box {
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .version-box.original {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .version-box.proposed {
      background: rgba(207, 168, 102, 0.05);
      border: 1px solid rgba(207, 168, 102, 0.25);
    }

    .box-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 6px;
    }

    .box-title {
      font-size: 12px;
      font-weight: 700;
      color: #cbd5e1;
    }

    .box-title.gold {
      color: var(--gold-bright);
    }

    .cost-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.08);
      color: var(--gold-bright);
    }

    .keywords-row {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
    }

    .keyword-chip {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(207, 168, 102, 0.15);
      border: 1px solid rgba(207, 168, 102, 0.3);
      color: var(--gold-bright);
      font-family: monospace;
    }

    .desc-text {
      font-size: 13px;
      line-height: 1.5;
      color: #f1f5f9;
    }

    .flavor-text {
      font-size: 11px;
      color: #64748b;
      font-style: italic;
      margin-top: auto;
      border-top: 1px dashed rgba(255, 255, 255, 0.06);
      padding-top: 6px;
    }

    .rationale-block {
      font-size: 12px;
      color: #cbd5e1;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      padding: 6px 8px;
      line-height: 1.4;
      margin-top: auto;
    }

    .rationale-block strong {
      color: var(--gold-bright);
    }

    .synergy-tags-row {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      font-size: 11px;
      color: var(--text-dim);
    }

    .synergy-pill {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.15);
      color: #7dd3fc;
    }

    /* Right Decision & Note Column */
    .card-decision-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-left: 1px solid rgba(255, 255, 255, 0.08);
      padding-left: 16px;
    }

    .decision-buttons-group {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
    }

    .decision-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 8px 4px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(255, 255, 255, 0.04);
      color: var(--text-dim);
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .decision-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    .decision-btn.accept.active {
      background: rgba(52, 211, 153, 0.25);
      border-color: var(--green-accept);
      color: var(--green-accept);
      box-shadow: 0 0 10px rgba(52, 211, 153, 0.25);
    }

    .decision-btn.reject.active {
      background: rgba(248, 113, 113, 0.25);
      border-color: var(--red-reject);
      color: var(--red-reject);
      box-shadow: 0 0 10px rgba(248, 113, 113, 0.25);
    }

    .decision-btn.pending.active {
      background: rgba(251, 191, 36, 0.25);
      border-color: var(--yellow-pending);
      color: var(--yellow-pending);
      box-shadow: 0 0 10px rgba(251, 191, 36, 0.25);
    }

    .user-note-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .user-note-box label {
      font-size: 11px;
      color: var(--text-dim);
      font-weight: 600;
    }

    .user-note-box textarea {
      flex: 1;
      min-height: 80px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 8px;
      color: #f1f5f9;
      font-size: 12px;
      resize: vertical;
      outline: none;
      font-family: inherit;
    }

    .user-note-box textarea:focus {
      border-color: rgba(207, 168, 102, 0.4);
    }

    /* =========================================================
       Monsters Layout View
       ========================================================= */
    .review-monsters-wrapper {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .depth-selector-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 12px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 18, 28, 0.7);
    }

    .selector-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--gold-primary);
    }

    .depth-tab-btn {
      padding: 7px 15px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--text-dim);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .depth-tab-btn:hover {
      color: #fff;
    }

    .depth-tab-btn.active {
      background: rgba(207, 168, 102, 0.2);
      border-color: var(--gold-bright);
      color: var(--gold-bright);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    }

    .review-monsters-layout {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
      outline: none;
    }

    .monsters-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(440px, 1fr));
      gap: 16px;
    }

    .monster-profile-card {
      background: var(--bg-card);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .monster-profile-card.role-boss {
      border-color: rgba(230, 57, 70, 0.5);
      background: linear-gradient(180deg, rgba(30, 20, 28, 0.9) 0%, rgba(20, 24, 36, 0.85) 100%);
    }

    .monster-profile-card.role-elite {
      border-color: rgba(207, 168, 102, 0.4);
    }

    .monster-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .monster-avatar-box {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: #000;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
    }

    .monster-avatar-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .monster-title-block {
      flex: 1;
    }

    .monster-title-block h3 {
      font-size: 16px;
      color: #f8fafc;
    }

    .monster-lore-title {
      font-size: 11px;
      color: var(--text-dim);
    }

    .role-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .role-badge.boss { background: rgba(230, 57, 70, 0.25); color: #ff6b6b; border: 1px solid #e63946; }
    .role-badge.elite { background: rgba(207, 168, 102, 0.25); color: #ffd700; border: 1px solid #cfa866; }
    .role-badge.normal { background: rgba(255, 255, 255, 0.08); color: #cbd5e1; }

    .monster-stats-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stat-badge {
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
    }

    .stat-badge.hp { background: rgba(230, 57, 70, 0.2); color: #ff6b6b; border: 1px solid rgba(230, 57, 70, 0.35); }
    .stat-badge.armor { background: rgba(56, 189, 248, 0.2); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.35); }

    .monster-section {
      background: rgba(0, 0, 0, 0.25);
      border-radius: 6px;
      padding: 10px;
      font-size: 12px;
      line-height: 1.45;
    }

    .section-heading {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 6px;
      color: var(--gold-bright);
    }

    .intent-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      font-size: 11px;
    }

    .intent-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .intent-badge.attack { background: rgba(230, 57, 70, 0.25); color: #ff6b6b; }
    .intent-badge.defend { background: rgba(56, 189, 248, 0.25); color: #7dd3fc; }
    .intent-badge.erode { background: rgba(147, 51, 234, 0.25); color: #c084fc; }
    .intent-badge.apply_status { background: rgba(251, 191, 36, 0.25); color: #fde047; }

    .counter-card-tag {
      font-size: 11px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      background: rgba(52, 211, 153, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(52, 211, 153, 0.3);
      display: inline-block;
      margin: 2px 3px;
    }

    /* Custom Scrollbars */
    .review-cards-list-container::-webkit-scrollbar,
    .review-monsters-layout::-webkit-scrollbar {
      width: 10px;
    }

    .review-cards-list-container::-webkit-scrollbar-track,
    .review-monsters-layout::-webkit-scrollbar-track {
      background: rgba(8, 11, 18, 0.7);
      border-radius: 5px;
    }

    .review-cards-list-container::-webkit-scrollbar-thumb,
    .review-monsters-layout::-webkit-scrollbar-thumb {
      background: rgba(207, 168, 102, 0.45);
      border-radius: 5px;
      border: 2px solid rgba(13, 16, 24, 0.85);
    }

    .review-cards-list-container::-webkit-scrollbar-thumb:hover,
    .review-monsters-layout::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 215, 0, 0.75);
    }

    /* Floating Jump Controls */
    .floating-scroll-controls {
      position: absolute;
      bottom: 24px;
      right: 28px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 50;
      pointer-events: none;
    }

    .scroll-jump-btn {
      pointer-events: auto;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(18, 22, 33, 0.9);
      border: 1px solid rgba(207, 168, 102, 0.45);
      color: #ffd700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      transition: all 0.25s ease;
      font-size: 16px;
      font-weight: bold;
    }

    .scroll-jump-btn:hover {
      background: rgba(207, 168, 102, 0.25);
      transform: translateY(-2px);
    }

    /* Toast Notification */
    .review-toast {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(13, 17, 26, 0.95);
      border: 1px solid var(--gold-bright);
      color: #f8fafc;
      font-size: 13px;
      font-weight: 600;
      padding: 10px 22px;
      border-radius: 30px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: none;
    }

    /* Modal for JSON Import */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    }

    .modal-box {
      background: #151924;
      border: 1px solid var(--gold-dim);
      border-radius: 10px;
      width: 90%;
      max-width: 600px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
    }

    .modal-box h3 {
      font-size: 16px;
      color: var(--gold-bright);
    }

    .modal-box textarea {
      width: 100%;
      height: 180px;
      background: #090c14;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      padding: 10px;
      color: #f1f5f9;
      font-family: monospace;
      font-size: 12px;
      outline: none;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  </style>
</head>
<body>
  <div class="review-lab-window">
    <!-- Header -->
    <header class="review-lab-header">
      <div class="header-titles">
        <h1>⚖️ 克蘇魯卡牌改動審查與數值實驗室</h1>
        <p>方案 A：可組合原子效應與印記聯動 · 全 64 張卡牌改動審核 & 怪物數值對策圖鑑 · 可攜式獨立版</p>
      </div>
      <div class="header-mode-tabs">
        <button id="tabCardsBtn" class="mode-tab-btn active" onclick="switchMainTab('cards')">
          📖 卡牌改動審查 (64張)
        </button>
        <button id="tabMonstersBtn" class="mode-tab-btn" onclick="switchMainTab('monsters')">
          💀 怪物生態數值表 (分深度 1~4)
        </button>
      </div>
    </header>

    <!-- CARDS VIEW TAB -->
    <div id="cardsView" class="review-cards-layout">
      <!-- Stats & Quick Actions -->
      <div class="review-stats-bar">
        <div class="stats-cluster">
          <div class="stat-pill total">
            <span>總卡牌</span>
            <strong id="statTotal">64 張</strong>
          </div>
          <div class="stat-pill accepted">
            <span>🟢 已接受</span>
            <strong id="statAccepted">0</strong>
          </div>
          <div class="stat-pill rejected">
            <span>🔴 已拒絕</span>
            <strong id="statRejected">0</strong>
          </div>
          <div class="stat-pill pending">
            <span>🟡 待審核</span>
            <strong id="statPending">64</strong>
          </div>
        </div>

        <div class="actions-cluster">
          <button class="action-btn accept-all" onclick="acceptAllCards()">✔ 全部接受</button>
          <button class="action-btn" onclick="resetAllCards()">🔄 全部重置</button>
          <button class="action-btn" onclick="copyDecisionsJson()">📋 複製結果 JSON</button>
          <button class="action-btn" onclick="exportDecisionsJson()">💾 匯出 JSON</button>
          <button class="action-btn" onclick="openImportModal()">📥 匯入 JSON</button>
          <button class="action-btn save-html" onclick="saveStandaloneHtml()" title="將目前所有修改決定與筆記永久保存並另存為新的可攜式 HTML 檔案">📦 另存已編輯 HTML</button>
        </div>
      </div>

      <!-- Filters Panel -->
      <div class="review-filter-panel">
        <div class="filter-group">
          <span class="filter-label">類別:</span>
          <button class="filter-chip active" data-cat="all" onclick="setCategoryFilter('all', this)">全部</button>
          <button class="filter-chip combat" data-cat="combat" onclick="setCategoryFilter('combat', this)">⚔️ 戰鬥 (16)</button>
          <button class="filter-chip skill" data-cat="skill" onclick="setCategoryFilter('skill', this)">🛡️ 技能 (17)</button>
          <button class="filter-chip magic" data-cat="magic" onclick="setCategoryFilter('magic', this)">✨ 魔法 (11)</button>
          <button class="filter-chip truth" data-cat="truth" onclick="setCategoryFilter('truth', this)">👁️ 真相 (14)</button>
          <button class="filter-chip madness" data-cat="madness" onclick="setCategoryFilter('madness', this)">🔥 瘋狂 (6)</button>
        </div>

        <div class="filter-group">
          <span class="filter-label">職業:</span>
          <button class="filter-chip active" data-occ="all" onclick="setOccupationFilter('all', this)">全部</button>
          <button class="filter-chip" data-occ="investigator" onclick="setOccupationFilter('investigator', this)">🕵️ 私家偵探 (40)</button>
          <button class="filter-chip" data-occ="occultist" onclick="setOccupationFilter('occultist', this)">🔮 秘術學者 (40)</button>
          <button class="filter-chip" data-occ="neutral" onclick="setOccupationFilter('neutral', this)">⚖️ 中立通用 (19)</button>
        </div>

        <div class="filter-group">
          <span class="filter-label">階級:</span>
          <button class="filter-chip active" data-tier="all" onclick="setTierFilter('all', this)">全部</button>
          <button class="filter-chip" data-tier="starter" onclick="setTierFilter('starter', this)">起始 (10)</button>
          <button class="filter-chip" data-tier="1" onclick="setTierFilter('1', this)">Tier 1 (18)</button>
          <button class="filter-chip" data-tier="2" onclick="setTierFilter('2', this)">Tier 2 (14)</button>
          <button class="filter-chip" data-tier="3" onclick="setTierFilter('3', this)">Tier 3 (8)</button>
          <button class="filter-chip" data-tier="4" onclick="setTierFilter('4', this)">Tier 4 (6)</button>
          <button class="filter-chip" data-tier="special" onclick="setTierFilter('special', this)">特殊/衍生 (8)</button>
        </div>

        <div class="filter-group">
          <span class="filter-label">狀態:</span>
          <button class="filter-chip active" data-stat="all" onclick="setStatusFilter('all', this)">全部</button>
          <button class="filter-chip" data-stat="pending" onclick="setStatusFilter('pending', this)">🟡 待審核</button>
          <button class="filter-chip" data-stat="accepted" onclick="setStatusFilter('accepted', this)">🟢 已接受</button>
          <button class="filter-chip" data-stat="rejected" onclick="setStatusFilter('rejected', this)">🔴 已拒絕</button>
        </div>

        <div class="search-box-wrapper">
          <span>🔍</span>
          <input id="searchInput" type="text" placeholder="搜尋卡名、穿刺、流血、易傷、碎盾等關鍵字..." oninput="onSearchChange()" />
        </div>
      </div>

      <!-- Cards List Container -->
      <div id="cardsListContainer" class="review-cards-list-container"></div>
    </div>

    <!-- MONSTERS VIEW TAB -->
    <div id="monstersView" class="review-monsters-wrapper" style="display: none;">
      <div class="depth-selector-bar">
        <span class="selector-title">選擇調查深度：</span>
        <button class="depth-tab-btn active" data-depth="1" onclick="setMonsterDepth(1, this)">第一深度 · 阿卡姆封鎖區 (Depth 1)</button>
        <button class="depth-tab-btn" data-depth="2" onclick="setMonsterDepth(2, this)">第二深度 · 深潛者海蝕迷宮 (Depth 2)</button>
        <button class="depth-tab-btn" data-depth="3" onclick="setMonsterDepth(3, this)">第三深度 · 無底深淵祭壇 (Depth 3)</button>
        <button class="depth-tab-btn" data-depth="4" onclick="setMonsterDepth(4, this)">第四深度 · 星辰正位 · 拉萊耶 (Depth 4)</button>
      </div>

      <div id="monstersListContainer" class="review-monsters-layout">
        <div id="monstersGrid" class="monsters-cards-grid"></div>
      </div>
    </div>

    <!-- Floating Scroll Controls -->
    <div class="floating-scroll-controls">
      <button class="scroll-jump-btn" onclick="scrollToTop()" title="回到頂部">▲</button>
      <button class="scroll-jump-btn" onclick="scrollToBottom()" title="滾動至底部">▼</button>
    </div>
  </div>

  <!-- Toast Element -->
  <div id="toastEl" class="review-toast"></div>

  <!-- Import Modal -->
  <div id="importModal" class="modal-backdrop">
    <div class="modal-box">
      <h3>📥 匯入審核結果 JSON</h3>
      <p style="font-size: 12px; color: #94a3b8;">請直接貼上先前匯出或複製的審核結果 JSON，或者選取 JSON 檔案：</p>
      <input type="file" id="jsonFileInput" accept=".json" onchange="handleFileSelected(event)" style="font-size: 12px; color: #cbd5e1;" />
      <textarea id="importJsonText" placeholder='{"starter_revolver": {"decision": "accepted", "note": "同意修改"}}'></textarea>
      <div class="modal-actions">
        <button class="action-btn" onclick="closeImportModal()">取消</button>
        <button class="action-btn accept-all" onclick="applyImportedJson()">確認匯入</button>
      </div>
    </div>
  </div>

  <!-- Embedded Data & Interactive Engine -->
  <script>
    const ALL_CARD_REVIEW_ITEMS = ${cardsDataJson};
    const MONSTERS_BY_DEPTH = ${monstersDataJson};
    const EMBEDDED_INITIAL_DECISIONS = ${initialDecisionsJson};
    const STORAGE_KEY = 'arkham_card_review_decisions';

    // State Management
    let decisions = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        decisions = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    // Merge embedded initial decisions (if present from exported file)
    decisions = Object.assign({}, EMBEDDED_INITIAL_DECISIONS, decisions);

    let activeMainTab = 'cards';
    let activeDepth = 1;
    let filterCategory = 'all';
    let filterOccupation = 'all';
    let filterTier = 'all';
    let filterStatus = 'all';
    let searchQuery = '';

    // Web Audio Click Feedback
    const audioCtx = (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') 
      ? new (window.AudioContext || window.webkitAudioContext)() 
      : null;

    function playBeep(freq = 600, type = 'sine', duration = 0.04) {
      if (!audioCtx) return;
      try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    function saveDecisions() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      updateStats();
    }

    function showToast(msg) {
      const t = document.getElementById('toastEl');
      t.innerText = msg;
      t.style.display = 'block';
      setTimeout(() => {
        t.style.display = 'none';
      }, 2500);
    }

    function switchMainTab(tab) {
      playBeep(520);
      activeMainTab = tab;
      document.getElementById('tabCardsBtn').classList.toggle('active', tab === 'cards');
      document.getElementById('tabMonstersBtn').classList.toggle('active', tab === 'monsters');
      document.getElementById('cardsView').style.display = tab === 'cards' ? 'flex' : 'none';
      document.getElementById('monstersView').style.display = tab === 'monsters' ? 'flex' : 'none';
      if (tab === 'monsters') {
        renderMonsters();
      }
    }

    function setCategoryFilter(val, el) {
      playBeep(640);
      filterCategory = val;
      document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderCards();
    }

    function setOccupationFilter(val, el) {
      playBeep(640);
      filterOccupation = val;
      document.querySelectorAll('[data-occ]').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderCards();
    }

    function setTierFilter(val, el) {
      playBeep(640);
      filterTier = val;
      document.querySelectorAll('[data-tier]').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderCards();
    }

    function setStatusFilter(val, el) {
      playBeep(640);
      filterStatus = val;
      document.querySelectorAll('[data-stat]').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderCards();
    }

    function onSearchChange() {
      searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
      renderCards();
    }

    function setCardDecision(cardId, decision) {
      playBeep(decision === 'accepted' ? 750 : decision === 'rejected' ? 350 : 500);
      if (!decisions[cardId]) {
        decisions[cardId] = { decision, note: '', updatedAt: new Date().toISOString() };
      } else {
        decisions[cardId].decision = decision;
        decisions[cardId].updatedAt = new Date().toISOString();
      }
      saveDecisions();
      updateCardDom(cardId);
    }

    function setCardNote(cardId, note) {
      if (!decisions[cardId]) {
        decisions[cardId] = { decision: 'pending', note, updatedAt: new Date().toISOString() };
      } else {
        decisions[cardId].note = note;
        decisions[cardId].updatedAt = new Date().toISOString();
      }
      saveDecisions();
    }

    function acceptAllCards() {
      playBeep(800, 'triangle', 0.08);
      const now = new Date().toISOString();
      ALL_CARD_REVIEW_ITEMS.forEach(c => {
        decisions[c.id] = {
          decision: 'accepted',
          note: decisions[c.id]?.note || '',
          updatedAt: now
        };
      });
      saveDecisions();
      renderCards();
      showToast('已將全體 64 張卡牌設置為【全部接受】！');
    }

    function resetAllCards() {
      playBeep(300);
      if (confirm('確定要將所有卡牌的審核狀態重置為【待審核】嗎？')) {
        decisions = {};
        saveDecisions();
        renderCards();
        showToast('已重置所有審核狀態為待審核。');
      }
    }

    function copyDecisionsJson() {
      playBeep(600);
      const output = JSON.stringify(decisions, null, 2);
      navigator.clipboard.writeText(output).then(() => {
        showToast('已複製審核結果 JSON 至剪貼簿！');
      }).catch(() => {
        prompt('請手動複製 JSON：', output);
      });
    }

    function exportDecisionsJson() {
      playBeep(600);
      const output = JSON.stringify(decisions, null, 2);
      const blob = new Blob([output], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'arkham_card_review_decisions.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('已匯出 JSON 檔案！');
    }

    function saveStandaloneHtml() {
      playBeep(700, 'triangle', 0.1);
      // Grab current document HTML
      let html = document.documentElement.outerHTML;
      // Replace embedded initial decisions with the latest decisions
      const oldBlock = 'const EMBEDDED_INITIAL_DECISIONS = ' + JSON.stringify(EMBEDDED_INITIAL_DECISIONS);
      const newBlock = 'const EMBEDDED_INITIAL_DECISIONS = ' + JSON.stringify(decisions);
      if (html.includes(oldBlock)) {
        html = html.replace(oldBlock, newBlock);
      } else {
        html = html.replace(/const EMBEDDED_INITIAL_DECISIONS = (.*?);/, 'const EMBEDDED_INITIAL_DECISIONS = ' + JSON.stringify(decisions) + ';');
      }

      const blob = new Blob(['<!DOCTYPE html>' + '\\n' + html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'arkham_card_balance_lab_saved.html';
      a.click();
      URL.revokeObjectURL(url);
      showToast('已另存包含最新筆記與決定的獨立 HTML 檔案！');
    }

    function openImportModal() {
      playBeep(500);
      document.getElementById('importJsonText').value = '';
      document.getElementById('importModal').style.display = 'flex';
    }

    function closeImportModal() {
      document.getElementById('importModal').style.display = 'none';
    }

    function handleFileSelected(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('importJsonText').value = e.target.result;
      };
      reader.readAsText(file);
    }

    function applyImportedJson() {
      const raw = document.getElementById('importJsonText').value.trim();
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          decisions = Object.assign({}, decisions, parsed);
          saveDecisions();
          renderCards();
          closeImportModal();
          showToast('成功匯入審核設定！');
        } else {
          alert('JSON 格式不正確！');
        }
      } catch (err) {
        alert('解析 JSON 失敗：' + err.message);
      }
    }

    function updateStats() {
      let accepted = 0;
      let rejected = 0;
      let pending = 0;
      ALL_CARD_REVIEW_ITEMS.forEach(c => {
        const d = decisions[c.id]?.decision || 'pending';
        if (d === 'accepted') accepted++;
        else if (d === 'rejected') rejected++;
        else pending++;
      });
      document.getElementById('statTotal').innerText = ALL_CARD_REVIEW_ITEMS.length + ' 張';
      document.getElementById('statAccepted').innerText = accepted;
      document.getElementById('statRejected').innerText = rejected;
      document.getElementById('statPending').innerText = pending;
    }

    function renderCards() {
      const container = document.getElementById('cardsListContainer');
      const filtered = ALL_CARD_REVIEW_ITEMS.filter(card => {
        if (filterCategory !== 'all' && card.category !== filterCategory) return false;
        if (filterOccupation !== 'all') {
          if (filterOccupation === 'neutral' && card.occupations && card.occupations.length > 0) return false;
          if (filterOccupation !== 'neutral' && (!card.occupations || !card.occupations.includes(filterOccupation))) return false;
        }
        if (filterTier !== 'all' && String(card.tier) !== String(filterTier)) return false;
        const currentDec = decisions[card.id]?.decision || 'pending';
        if (filterStatus !== 'all' && currentDec !== filterStatus) return false;

        if (searchQuery) {
          const hay = [
            card.name,
            card.id,
            card.category,
            card.original.description,
            card.proposed.description,
            card.proposed.designRationale,
            ...(card.proposed.keywords || []),
            ...(card.proposed.synergies || []),
          ].join(' ').toLowerCase();
          if (!hay.includes(searchQuery)) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 60px 0; color: #64748b;">無符合篩選條件的卡牌</div>';
        return;
      }

      container.innerHTML = filtered.map(card => {
        const uState = decisions[card.id] || { decision: 'pending', note: '' };
        const dec = uState.decision;
        const occBadges = (card.occupations || ['中立']).map(o => {
          const map = { investigator: '🕵️ 偵探', occultist: '🔮 學者', neutral: '⚖️ 中立' };
          return '<span class="badge-pill">' + (map[o] || o) + '</span>';
        }).join('');

        const costLabel = (type, val) => {
          const map = { stamina: '精力', sanity: '心智', focus: '專注' };
          return val + ' ' + (map[type] || type);
        };

        const kwBadges = (card.proposed.keywords || []).map(k => '<span class="keyword-chip">' + k + '</span>').join('');
        const synPills = (card.proposed.synergies || []).map(s => '<span class="synergy-pill">' + s + '</span>').join('');

        return \`
        <article class="card-review-card decision-\${dec}" id="card-row-\${card.id}">
          <!-- Visual Column -->
          <div class="card-visual-col">
            <div class="card-art-box">
              <img src="\${card.artworkUrl}" alt="\${card.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
              <div class="art-fallback-icon" style="display:none;">
                \${card.category === 'combat' ? '⚔️' : card.category === 'skill' ? '🛡️' : card.category === 'magic' ? '✨' : card.category === 'truth' ? '👁️' : '🔥'}
              </div>
              <span class="category-tag \${card.category}">\${card.category}</span>
            </div>
            <h3 class="card-title-name">\${card.name}</h3>
            <div class="meta-badges-row">
              <span class="badge-pill tier-\${card.tier}">\${card.tier === 'starter' ? '起始' : 'T' + card.tier}</span>
              \${occBadges}
            </div>
            <div class="card-id-label">\${card.id}</div>
          </div>

          <!-- Comparison Column -->
          <div class="card-comparison-col">
            <!-- Original -->
            <div class="version-box original">
              <div class="box-header">
                <span class="box-title">【目前原版效果】</span>
                <span class="cost-badge">\${costLabel(card.original.costType, card.original.costValue)}</span>
              </div>
              <p class="desc-text">\${card.original.description}</p>
              \${card.original.flavorText ? '<p class="flavor-text">' + card.original.flavorText + '</p>' : ''}
            </div>

            <!-- Proposed -->
            <div class="version-box proposed">
              <div class="box-header">
                <span class="box-title gold">【方案 A 改造後效果】</span>
                <span class="cost-badge">\${costLabel(card.proposed.costType, card.proposed.costValue)}</span>
              </div>
              \${kwBadges ? '<div class="keywords-row">' + kwBadges + '</div>' : ''}
              <p class="desc-text" style="font-weight: 500;">\${card.proposed.description}</p>
              <div class="rationale-block">
                <strong>🎯 設計意圖：</strong>\${card.proposed.designRationale}
              </div>
              \${card.proposed.counterplay ? '<div class="rationale-block" style="margin-top:4px;"><strong>⚔️ 對策克制：</strong>' + card.proposed.counterplay + '</div>' : ''}
              \${synPills ? '<div class="synergy-tags-row"><strong>🔗 推薦連動：</strong>' + synPills + '</div>' : ''}
            </div>
          </div>

          <!-- Decision & Notes Column -->
          <div class="card-decision-col">
            <div class="decision-buttons-group">
              <button class="decision-btn accept \${dec === 'accepted' ? 'active' : ''}" onclick="setCardDecision('\${card.id}', 'accepted')">
                <span>✔</span>
                <span>接受改動</span>
              </button>
              <button class="decision-btn reject \${dec === 'rejected' ? 'active' : ''}" onclick="setCardDecision('\${card.id}', 'rejected')">
                <span>✖</span>
                <span>保留原版</span>
              </button>
              <button class="decision-btn pending \${dec === 'pending' ? 'active' : ''}" onclick="setCardDecision('\${card.id}', 'pending')">
                <span>⏳</span>
                <span>待定</span>
              </button>
            </div>

            <div class="user-note-box">
              <label>✏️ 您的個人審核意見 / 筆記：</label>
              <textarea placeholder="例如：傷害建議改為 12、或者抽牌太多...（即時自動保存）" oninput="setCardNote('\${card.id}', this.value)">\${uState.note || ''}</textarea>
            </div>
          </div>
        </article>
        \`;
      }).join('');
    }

    function updateCardDom(cardId) {
      const row = document.getElementById('card-row-' + cardId);
      if (!row) {
        renderCards();
        return;
      }
      const dec = decisions[cardId]?.decision || 'pending';
      row.className = 'card-review-card decision-' + dec;
      const btns = row.querySelectorAll('.decision-btn');
      btns[0].classList.toggle('active', dec === 'accepted');
      btns[1].classList.toggle('active', dec === 'rejected');
      btns[2].classList.toggle('active', dec === 'pending');
    }

    function setMonsterDepth(depth, el) {
      playBeep(600);
      activeDepth = depth;
      document.querySelectorAll('.depth-tab-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      renderMonsters();
    }

    function renderMonsters() {
      const grid = document.getElementById('monstersGrid');
      const monsters = MONSTERS_BY_DEPTH[activeDepth] || [];
      grid.innerHTML = monsters.map(m => {
        const intentsHtml = m.intents.map(i => \`
          <div class="intent-row">
            <span class="intent-badge \${i.type}">\${i.name}</span>
            <span style="color:#cbd5e1;">\${i.description}</span>
          </div>
        \`).join('');

        const recCards = m.tacticalTips.recommendedCards.map(c => \`<span class="counter-card-tag">\${c}</span>\`).join('');

        return \`
        <div class="monster-profile-card role-\${m.role}">
          <div class="monster-header">
            <div class="monster-avatar-box">
              <img src="\${m.imageUrl || ''}" alt="\${m.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
              <div style="display:none;">💀</div>
            </div>
            <div class="monster-title-block">
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="role-badge \${m.role}">\${m.role}</span>
                <h3>\${m.name}</h3>
              </div>
              <p class="monster-lore-title">\${m.title}</p>
            </div>
            <div class="monster-stats-row">
              <span class="stat-badge hp">HP: \${m.health}</span>
              <span class="stat-badge armor">護甲: \${m.armor}</span>
            </div>
          </div>

          <div class="monster-section">
            <div class="section-heading">🚀 專屬原著生態特質：\${m.trait.name}</div>
            <p>\${m.trait.description}</p>
            <p style="color:var(--gold-primary); margin-top:4px;"><strong>觸發機制：</strong>\${m.trait.trigger}</p>
          </div>

          <div class="monster-section">
            <div class="section-heading">⚔️ 行動意圖循環</div>
            \${intentsHtml}
          </div>

          <div class="monster-section">
            <div class="section-heading">💡 方案 A 破局克制推薦</div>
            <p><strong>主要威脅：</strong>\${m.tacticalTips.threatSummary}</p>
            <div style="margin: 4px 0;"><strong>推薦克制卡牌：</strong>\${recCards}</div>
            <p><strong>實戰策略：</strong>\${m.tacticalTips.strategy}</p>
          </div>
        </div>
        \`;
      }).join('');
    }

    function scrollToTop() {
      playBeep(700);
      const c = activeMainTab === 'cards' ? document.getElementById('cardsListContainer') : document.getElementById('monstersListContainer');
      if (c) c.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function scrollToBottom() {
      playBeep(450);
      const c = activeMainTab === 'cards' ? document.getElementById('cardsListContainer') : document.getElementById('monstersListContainer');
      if (c) c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' });
    }

    // Init on boot
    updateStats();
    renderCards();
  </script>
</body>
</html>`;
}
