import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArkhamGazette } from './ArkhamGazette';
import type { GameState } from '../types/game';
import { createInitialCombatState } from '../engine/gameReducer';
import { soundEngine } from '../engine/audioManager';

vi.mock('../engine/audioManager', () => ({
  soundEngine: {
    playClick: vi.fn(),
    playNewspaperSlam: vi.fn(),
    playEndingEerieTension: vi.fn(),
  },
}));

describe('ArkhamGazette Component', () => {
  let mockState: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...createInitialCombatState(),
      investigator: {
        name: '愛德華·皮爾斯',
        occupation: '私家偵探',
        health: 0,
        maxHealth: 25,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 45,
      },
      adventureStats: {
        enemiesDefeated: 3,
        totalObolsCollected: 65,
        nodesVisited: 7,
        maxLayer: 4,
      },
    };
  });

  it('renders Death Ending newspaper with headline, narrative, and dossier stats', () => {
    const dispatch = vi.fn();
    const onRetryCombat = vi.fn();

    render(
      <ArkhamGazette
        endingType="death"
        state={mockState}
        dispatch={dispatch}
        onRetryCombat={onRetryCombat}
      />
    );

    // Masthead & Headline
    expect(screen.getByText('THE ARKHAM GAZETTE')).toBeDefined();
    expect(
      screen.getByText(/【無名殘軀浮現密斯卡托尼克河畔，警方稱純屬意外】/)
    ).toBeDefined();

    // Narrative snippet
    expect(
      screen.getByText(/密斯卡托尼克河畔的晨霧尚未散去/)
    ).toBeDefined();

    // Dossier statistics
    expect(screen.getByText(/殉職調查員案卷/)).toBeDefined();
    expect(screen.getByText('愛德華·皮爾斯')).toBeDefined();
    expect(screen.getByText('私家偵探')).toBeDefined();
    expect(screen.getByText(/肉體殞命/)).toBeDefined();
    expect(screen.getByText('3 隻')).toBeDefined();
    expect(screen.getByText(/65 枚/)).toBeDefined();
    expect(screen.getByText('第 5 層')).toBeDefined();
    expect(screen.getByText('7 處')).toBeDefined();

    // Buttons
    expect(screen.getByText(/重新開始調查/)).toBeDefined();
    expect(screen.getByText(/原戰鬥重新調查/)).toBeDefined();

    // Abyss Shatter Effect on Death
    expect(document.getElementById('abyss-shatter-effect')).not.toBeNull();

    // Audio on mount
    expect(soundEngine.playNewspaperSlam).toHaveBeenCalledTimes(1);
  });

  it('renders Victory Ending newspaper with cosmic eye headline and resolved dossier', () => {
    const dispatch = vi.fn();
    mockState.investigator.health = 18;

    render(
      <ArkhamGazette
        endingType="victory"
        state={mockState}
        dispatch={dispatch}
      />
    );

    // Victory Headline
    expect(
      screen.getByText(/【近郊廢棄修道院神秘異變暫歇，官方堅稱瓦斯洩漏，市民聲稱目睹夜空巨瞳】/)
    ).toBeDefined();

    // Victory narrative
    expect(
      screen.getByText(/封鎖區周圍瀰漫數週的惡臭濃霧開始迅速退散/)
    ).toBeDefined();

    // Dossier
    expect(screen.getByText(/倖存調查員功勳/)).toBeDefined();
    expect(screen.getByText(/生還平息/)).toBeDefined();
    expect(screen.getByText(/封鎖區全層貫通/)).toBeDefined();

    // Victory Action
    expect(screen.getByText(/凱旋返回主選單/)).toBeDefined();
    expect(screen.queryByText(/原戰鬥重新調查/)).toBeNull();
    expect(document.getElementById('abyss-shatter-effect')).toBeNull();
  });

  it('dispatches RETURN_TO_TITLE when return button is clicked', () => {
    const dispatch = vi.fn();
    render(
      <ArkhamGazette
        endingType="death"
        state={mockState}
        dispatch={dispatch}
      />
    );

    const returnBtn = screen.getByText(/重新開始調查/);
    fireEvent.click(returnBtn);

    expect(soundEngine.playClick).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'RETURN_TO_TITLE' });
  });

  it('triggers onRetryCombat callback when retry button is clicked', () => {
    const dispatch = vi.fn();
    const onRetryCombat = vi.fn();

    render(
      <ArkhamGazette
        endingType="death"
        state={mockState}
        dispatch={dispatch}
        onRetryCombat={onRetryCombat}
      />
    );

    const retryBtn = screen.getByText(/原戰鬥重新調查/);
    fireEvent.click(retryBtn);

    expect(soundEngine.playClick).toHaveBeenCalled();
    expect(onRetryCombat).toHaveBeenCalledTimes(1);
  });

  it('renders True Ending newspaper with cosmic banishment headline, special stamp, and staff credits', () => {
    const dispatch = vi.fn();
    mockState.investigator.health = 25;
    mockState.isTrueEnding = true;

    render(
      <ArkhamGazette
        endingType="true_ending"
        state={mockState}
        dispatch={dispatch}
      />
    );

    // True Ending Masthead Dateline & Stamp
    expect(screen.getByText('THE ARKHAM GAZETTE')).toBeDefined();
    expect(screen.getByText('COSMIC BANISHMENT · TRUE VICTORY')).toBeDefined();
    expect(screen.getByText(/ULTRA SPECIAL OVERSEAS EDITION/)).toBeDefined();

    // True Ending Headline & Kicker
    expect(screen.getByText(/ASTRONOMICAL ANOMALY · THE STARS ARE NO LONGER RIGHT/)).toBeDefined();
    expect(
      screen.getByText(/【星辰歸位終告破滅！拉萊耶萬丈黑淵崩解，密斯卡托尼克天文台證實超維星軌封滅】/)
    ).toBeDefined();

    // Narrative snippet
    expect(screen.getByText(/璀璨金色古印神輝徹底擊穿/)).toBeDefined();
    expect(screen.getByText(/星辰正位的終焉時刻被一名血肉凡軀的孤膽調查員硬生生扭轉/)).toBeDefined();

    // True Ending Dossier
    expect(screen.getByText('傳奇調查員真結局功勳')).toBeDefined();
    expect(screen.getByText('古印封滅 · 扭轉星辰')).toBeDefined();
    expect(screen.getByText('第四深度 · 拉萊耶核心湮滅')).toBeDefined();

    // Staff Credits Section
    expect(screen.getByText(/【阿卡姆調查手記 · 通關製作名錄】/)).toBeDefined();
    expect(screen.getByText(/密斯卡托尼克調查團/)).toBeDefined();
    expect(screen.getByText(/H.P. Lovecraft 洛夫克拉夫特神話遺產/)).toBeDefined();
    expect(screen.getByText(/感謝您拯救阿卡姆！/)).toBeDefined();

    // True Ending Return Button
    expect(screen.getByText('達成真結局 · 凱旋歸來')).toBeDefined();
  });
});

