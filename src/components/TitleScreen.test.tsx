import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TitleScreen } from './TitleScreen';
import { soundEngine } from '../engine/audioManager';

describe('TitleScreen & TitleMenu Integration', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the classic Title Menu by default and does not immediately show character selection', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Main title and subtitle
    expect(screen.getByText('克蘇魯文字卡牌冒險')).toBeDefined();
    expect(screen.getByText('LOVECRAFTIAN TEXT-CARD ADVENTURE')).toBeDefined();
    expect(screen.getByText('深淵正凝視著你 · 喚醒沉睡的心智')).toBeDefined();

    // 5 main menu options
    expect(screen.getByText('開啟新調查')).toBeDefined();
    expect(screen.getByText('調查紀錄手冊')).toBeDefined();
    expect(screen.getByText('卡牌圖鑑')).toBeDefined();
    expect(screen.getByText('遊戲設定')).toBeDefined();
    expect(screen.getByText('離開遊戲')).toBeDefined();

    // Investigator selection cards are NOT visible initially
    expect(screen.queryByText('命運的十字路口 · 選擇你的調查員')).toBeNull();
    expect(screen.queryByText('愛德華·皮爾斯 (Edward Pierce)')).toBeNull();
    expect(screen.queryByText('艾蓮諾·凡斯 (Eleanor Vance)')).toBeNull();
  });

  it('transitions to character selection on clicking "開啟新調查" and allows returning to Title Menu', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Click "開啟新調查"
    const startBtn = screen.getByRole('button', { name: /開啟新調查/i });
    fireEvent.click(startBtn);

    // Now character selection screen is visible
    expect(screen.getByText('命運的十字路口 · 選擇你的調查員')).toBeDefined();
    expect(screen.getByText('愛德華·皮爾斯 (Edward Pierce)')).toBeDefined();
    expect(screen.getByText('艾蓮諾·凡斯 (Eleanor Vance)')).toBeDefined();

    // Click "返回主選單"
    const backBtn = screen.getByRole('button', { name: /返回主選單/i });
    fireEvent.click(backBtn);

    // Returns to classic Title Menu
    expect(screen.getByText('深淵正凝視著你 · 喚醒沉睡的心智')).toBeDefined();
    expect(screen.queryByText('命運的十字路口 · 選擇你的調查員')).toBeNull();
  });

  it('dispatches SELECT_OCCUPATION when choosing an investigator on the selection screen', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Navigate to selection
    fireEvent.click(screen.getByRole('button', { name: /開啟新調查/i }));

    // Click choose Edward Pierce
    const choosePierceBtn = screen.getByRole('button', { name: /啟程調查/i });
    fireEvent.click(choosePierceBtn);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SELECT_OCCUPATION',
      payload: { occupationId: 'investigator', procedural: true },
    });

    // Or click Eleanor Vance card
    const occultistCard = screen.getByText('艾蓮諾·凡斯 (Eleanor Vance)');
    fireEvent.click(occultistCard);

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SELECT_OCCUPATION',
      payload: { occupationId: 'occultist', procedural: true },
    });
  });

  it('opens and interacts with the Investigation Manual modal', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Open Manual
    fireEvent.click(screen.getByRole('button', { name: /調查紀錄手冊/i }));

    expect(screen.getByRole('heading', { name: '調查紀錄手冊' })).toBeDefined();
    expect(screen.getByText(/Sanity Deck · 心智與抽牌庫的絕對等同/i)).toBeDefined();

    // Check CONTEXT.md key rule: sanity deck
    expect(screen.getByText(/剩餘卡牌數量等同於當前理智值/i)).toBeDefined();

    // Switch to "五色卡牌體系" tab
    fireEvent.click(screen.getByRole('button', { name: /五色卡牌體系/i }));
    expect(screen.getByText(/紅色戰鬥卡 \(Combat Card\)/i)).toBeDefined();
    expect(screen.getByText(/黃色技能卡 \(Skill Card\)/i)).toBeDefined();
    expect(screen.getByText(/紫色魔法卡 \(Magic Card\)/i)).toBeDefined();
    expect(screen.getByText(/白色真相卡 \(Truth Card\)/i)).toBeDefined();
    expect(screen.getByText(/黑色瘋狂卡 \(Madness Card\)/i)).toBeDefined();

    // Switch to "精力與護甲" tab
    fireEvent.click(screen.getByRole('button', { name: /精力與護甲/i }));
    expect(screen.getByText(/護甲跨回合持續累積/i)).toBeDefined();

    // Switch to "手牌保留機制" tab
    fireEvent.click(screen.getByRole('button', { name: /手牌保留機制/i }));
    expect(screen.getByText(/手牌保留機制 \(Hand Retention\)/i)).toBeDefined();

    // Switch to "瘋狂極限狀態" tab
    fireEvent.click(screen.getByRole('button', { name: /瘋狂極限狀態/i }));
    expect(screen.getAllByText(/瘋狂極限狀態 \(Madness State\)/i).length).toBeGreaterThanOrEqual(1);

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: '關閉手冊' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('heading', { name: '調查紀錄手冊' })).toBeNull();
  });

  it('opens and interacts with the Card Compendium modal', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Open Compendium
    fireEvent.click(screen.getByRole('button', { name: /卡牌圖鑑/i }));

    expect(screen.getByRole('heading', { name: '卡牌圖鑑' })).toBeDefined();
    expect(screen.getByText(/已收錄 26 張專屬五色手牌/i)).toBeDefined();

    // Filter by category: combat
    const combatTab = screen.getByRole('tab', { name: /紅色戰鬥/i });
    fireEvent.click(combatTab);
    expect(screen.getAllByText('左輪射擊').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('軍刀突刺')).toBeDefined();

    // Filter by category: magic
    const magicTab = screen.getByRole('tab', { name: /紫色魔法/i });
    fireEvent.click(magicTab);
    expect(screen.getAllByText('靈能衝擊').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('厄運凝視')).toBeDefined();

    // Filter by category: truth
    const truthTab = screen.getByRole('tab', { name: /白色真相/i });
    fireEvent.click(truthTab);
    expect(screen.getAllByText('舊日殘頁').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('銀鑰儀式')).toBeDefined();

    // Filter by category: madness
    const madnessTab = screen.getByRole('tab', { name: /黑色瘋狂/i });
    fireEvent.click(madnessTab);
    expect(screen.getAllByText('盲目爪擊').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('深淵狂嘯')).toBeDefined();

    // Inspect card details
    const howlCard = screen.getByText('深淵狂嘯');
    fireEvent.click(howlCard);
    expect(screen.getByText(/非人的狂吼撕裂了喉管/i)).toBeDefined();

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: '關閉圖鑑' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('heading', { name: '卡牌圖鑑' })).toBeNull();
  });

  it('opens Settings modal and toggles global audio and sound cues', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Open Settings
    fireEvent.click(screen.getByRole('button', { name: /遊戲設定/i }));

    expect(screen.getByRole('heading', { name: '遊戲設定' })).toBeDefined();

    // Toggle mute
    const initialMuted = soundEngine.getMuted();
    const toggleBtn = screen.getByLabelText(/全域音效/i);
    fireEvent.click(toggleBtn);
    expect(soundEngine.getMuted()).toBe(!initialMuted);

    // Click sound test buttons
    const testClickBtn = screen.getByRole('button', { name: /羊皮紙點擊/i });
    fireEvent.click(testClickBtn);

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: '關閉設定' }));
    expect(screen.queryByRole('heading', { name: '遊戲設定' })).toBeNull();
  });

  it('opens Exit Easter Egg dialog and triggers abyss options', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Open Exit
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));

    expect(screen.getByRole('heading', { name: '深淵呢喃 · 無法逃離' })).toBeDefined();
    expect(screen.getByText(/所有門扉皆已被未知力量封死/i)).toBeDefined();

    // Click struggle
    const struggleBtn = screen.getByRole('button', { name: /握緊理智 · 掙扎求生/i });
    fireEvent.click(struggleBtn);

    expect(screen.queryByRole('heading', { name: '深淵呢喃 · 無法逃離' })).toBeNull();

    // Reopen and click submit
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    const submitBtn = screen.getByRole('button', { name: /屈服並沉入深淵/i });
    fireEvent.click(submitBtn);

    expect(screen.queryByRole('heading', { name: '深淵呢喃 · 無法逃離' })).toBeNull();
  });

  it('closes modals on Escape key press', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Open manual
    fireEvent.click(screen.getByRole('button', { name: /調查紀錄手冊/i }));
    expect(screen.getByRole('heading', { name: '調查紀錄手冊' })).toBeDefined();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('heading', { name: '調查紀錄手冊' })).toBeNull();
  });
});
