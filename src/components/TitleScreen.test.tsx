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

  it('dispatches START_NEW_INVESTIGATION on clicking "開啟新調查" to initiate onboarding flow', () => {
    const playClickSpy = vi.spyOn(soundEngine, 'playClick').mockImplementation(() => {});
    render(<TitleScreen dispatch={mockDispatch} />);

    // Click "開啟新調查"
    const startBtn = screen.getByRole('button', { name: /開啟新調查/i });
    fireEvent.click(startBtn);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'START_NEW_INVESTIGATION' });
    expect(playClickSpy).toHaveBeenCalled();
    playClickSpy.mockRestore();
  });

  it('opens and interacts with the Investigation Manual modal', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Open Manual
    fireEvent.click(screen.getByRole('button', { name: /調查紀錄手冊/i }));

    expect(screen.getByRole('heading', { name: '調查紀錄手冊' })).toBeDefined();
    expect(screen.getByText('心智與抽牌庫的絕對等同')).toBeDefined();

    // Check CONTEXT.md key rule: sanity deck
    expect(screen.getByText(/剩餘卡牌數量等同於當前理智值/i)).toBeDefined();

    // Switch to "五色卡牌體系" tab
    fireEvent.click(screen.getByRole('button', { name: /五色卡牌體系/i }));
    expect(screen.getByRole('heading', { level: 4, name: '紅色戰鬥卡' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 4, name: '黃色技能卡' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 4, name: '紫色魔法卡' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 4, name: '白色真相卡' })).toBeDefined();
    expect(screen.getByRole('heading', { level: 4, name: '黑色瘋狂卡' })).toBeDefined();

    // Switch to "精力與護甲" tab
    fireEvent.click(screen.getByRole('button', { name: /精力與護甲/i }));
    expect(screen.getByText(/護甲跨回合持續累積/i)).toBeDefined();

    // Switch to "手牌保留機制" tab
    fireEvent.click(screen.getByRole('button', { name: /手牌保留機制/i }));
    expect(screen.getByRole('heading', { level: 3, name: '手牌保留機制' })).toBeDefined();

    // Switch to "瘋狂極限狀態" tab
    fireEvent.click(screen.getByRole('button', { name: /瘋狂極限狀態/i }));
    expect(screen.getByRole('heading', { level: 3, name: '瘋狂極限狀態' })).toBeDefined();

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: '關閉手冊' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('heading', { name: '調查紀錄手冊' })).toBeNull();
  });

  it('opens and interacts with the Card Compendium modal', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Open Compendium
    fireEvent.click(screen.getByRole('button', { name: /卡牌圖鑑/i }));

    expect(screen.getByRole('heading', { name: /卡牌圖鑑/i })).toBeDefined();
    expect(screen.getByText(/已收錄 \d+ 張專屬五色卡牌/i)).toBeDefined();

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
    expect(screen.getAllByText(/非人的狂吼撕裂了喉管/i).length).toBeGreaterThanOrEqual(1);

    // Close via close button
    const closeBtn = screen.getByRole('button', { name: '關閉圖鑑' });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('heading', { name: '卡牌圖鑑' })).toBeNull();
  });

  it('synchronizes audio mute state reactively between AudioToggle and SettingsModal', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Initial state: not muted
    const audioToggleBtn = screen.getByRole('button', { name: '靜音' });
    expect(soundEngine.getMuted()).toBe(false);

    // Toggle mute via top AudioToggle button
    fireEvent.click(audioToggleBtn);
    expect(soundEngine.getMuted()).toBe(true);
    expect(screen.getByRole('button', { name: '開啟音效' })).toBeDefined();

    // Now open SettingsModal: it must reflect the muted state
    fireEvent.click(screen.getByRole('button', { name: /遊戲設定/i }));
    expect(screen.getByText('靜音中')).toBeDefined();

    // Toggle mute inside SettingsModal
    const settingsSwitch = screen.getByRole('button', { name: '開啟全域音效' });
    fireEvent.click(settingsSwitch);

    expect(soundEngine.getMuted()).toBe(false);
    expect(screen.getByText('已啟用')).toBeDefined();

    // Verify the outer AudioToggle is also synchronized to unmuted
    expect(screen.getByRole('button', { name: '靜音' })).toBeDefined();

    // Close settings modal
    fireEvent.click(screen.getByRole('button', { name: '關閉設定' }));
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

  it('closes modals on backdrop click', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Open manual
    fireEvent.click(screen.getByRole('button', { name: /調查紀錄手冊/i }));
    const backdrop = screen.getByRole('dialog');
    expect(backdrop).toBeDefined();

    // Click backdrop itself
    fireEvent.click(backdrop);
    expect(screen.queryByRole('heading', { name: '調查紀錄手冊' })).toBeNull();
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
