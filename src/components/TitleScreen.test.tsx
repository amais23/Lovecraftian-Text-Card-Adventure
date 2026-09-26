import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TitleScreen } from './TitleScreen';
import { soundEngine } from '../engine/audioManager';
import { devModeManager } from '../engine/devModeManager';
import { UpdateService } from '../services/updateService';

describe('TitleScreen & TitleMenu Integration', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    devModeManager.setDevMode(false);
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

    // Card Review Lab is hidden by default in normal mode (ADR-0036 / #62)
    expect(screen.queryByRole('button', { name: /卡牌改動審查室/i })).toBeNull();
    expect(screen.queryByText(/卡牌改動審查室/i)).toBeNull();

    // Investigator selection cards are NOT visible initially
    expect(screen.queryByText('命運的十字路口 · 選擇你的調查員')).toBeNull();
    expect(screen.queryByText('愛德華·皮爾斯')).toBeNull();
    expect(screen.queryByText('艾蓮諾·凡斯')).toBeNull();
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

    // Switch to "精力、護甲與遺物" tab
    fireEvent.click(screen.getByRole('button', { name: /精力、護甲與遺物/i }));
    expect(screen.getByText(/護甲跨回合持續累積/i)).toBeDefined();

    // Switch to "手牌保留與超額棄牌" tab
    fireEvent.click(screen.getByRole('button', { name: /手牌保留與超額棄牌/i }));
    expect(screen.getByRole('heading', { level: 3, name: '手牌保留與超額棄牌' })).toBeDefined();

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

  it('renders the cinematic title screen background layer (ADR-0020)', () => {
    render(<TitleScreen dispatch={mockDispatch} />);
    const bgImage = screen.getByTestId('title-screen-bg-image');
    expect(bgImage).toBeDefined();
  });

  it('toggles Dev Mode in SettingsModal and dynamically reveals Card Review Lab in TitleMenu', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Initially, Card Review Lab button is not present
    expect(screen.queryByRole('button', { name: /卡牌改動審查室/i })).toBeNull();

    // Open SettingsModal
    fireEvent.click(screen.getByRole('button', { name: /遊戲設定/i }));
    expect(screen.getByRole('heading', { level: 3, name: /開發者模式/i })).toBeDefined();

    // Turn on Dev Mode
    const devToggle = screen.getByRole('button', { name: '開啟開發者模式' });
    fireEvent.click(devToggle);

    // Close SettingsModal
    fireEvent.click(screen.getByRole('button', { name: '關閉設定' }));

    // Card Review Lab button should now be dynamically visible in TitleMenu
    const reviewBtn = screen.getByRole('button', { name: /卡牌改動審查室/i });
    expect(reviewBtn).toBeDefined();

    // Click Card Review Lab button: opens CardReviewLab modal
    fireEvent.click(reviewBtn);
    expect(screen.getByRole('heading', { name: /卡牌改動審查與數值實驗室/i })).toBeDefined();

    // Close CardReviewLab via return button
    fireEvent.click(screen.getByTitle('返回主選單'));
    expect(screen.queryByRole('heading', { name: /卡牌改動審查與數值實驗室/i })).toBeNull();
  });

  describe('Auto-Updater notification in TitleScreen (ADR-0040 / #73)', () => {
    it('automatically checks and displays UpdateModal when an update is available', async () => {
      const mockSource = {
        check: vi.fn().mockResolvedValue({
          version: '0.4.1',
          currentVersion: '0.4.0',
          body: '重要錯誤修正',
        }),
      };
      const testService = new UpdateService(mockSource);

      await act(async () => {
        render(<TitleScreen dispatch={mockDispatch} updateService={testService} />);
      });

      const updateHeader = await screen.findByRole('heading', { name: /發現新版本/ });
      expect(updateHeader).toBeDefined();
      expect(screen.getByText('0.4.1')).toBeDefined();
    });

    it('does not display UpdateModal when available version is dismissed', async () => {
      const mockSource = {
        check: vi.fn().mockResolvedValue({
          version: '0.4.1',
          currentVersion: '0.4.0',
          body: '重要錯誤修正',
        }),
      };
      const testService = new UpdateService(mockSource);
      testService.dismissVersion('0.4.1');

      await act(async () => {
        render(<TitleScreen dispatch={mockDispatch} updateService={testService} />);
      });

      expect(screen.queryByRole('heading', { name: /發現新版本/ })).toBeNull();
    });

    it('allows investigator to manually check for updates in SettingsModal and awaken UpdateModal even if dismissed', async () => {
      const mockSource = {
        check: vi.fn().mockResolvedValue({
          version: '0.4.1',
          currentVersion: '0.4.0',
          body: '手動檢查發現的最新修訂',
        }),
      };
      const testService = new UpdateService(mockSource);
      testService.dismissVersion('0.4.1');

      await act(async () => {
        render(<TitleScreen dispatch={mockDispatch} updateService={testService} />);
      });

      // Initially suppressed because it's dismissed
      expect(screen.queryByRole('heading', { name: /發現新版本/ })).toBeNull();

      // Open SettingsModal from TitleMenu
      const settingsBtn = screen.getByRole('button', { name: /遊戲設定/i });
      fireEvent.click(settingsBtn);

      expect(screen.getByRole('heading', { level: 3, name: /版本與更新/i })).toBeDefined();

      // Click manual check update button
      const checkBtn = screen.getByRole('button', { name: /檢查更新/i });
      await act(async () => {
        fireEvent.click(checkBtn);
      });

      // UpdateModal is awakened and visible
      const updateHeader = await screen.findByRole('heading', { name: /發現新版本/ });
      expect(updateHeader).toBeDefined();
      expect(screen.getByText('0.4.1')).toBeDefined();
    });

    it('handles download progress and relaunch flow directly from TitleScreen UpdateModal (Issue #75)', async () => {
      const mockDownload = vi.fn().mockImplementation(async (onProgress) => {
        onProgress?.(50, 100);
      });
      const mockRelaunch = vi.fn().mockResolvedValue(undefined);

      const mockSource = {
        check: vi.fn().mockResolvedValue({
          version: '0.4.1',
          currentVersion: '0.4.0',
          body: '重大功能發布',
        }),
        downloadAndInstall: mockDownload,
        relaunch: mockRelaunch,
      };
      const testService = new UpdateService(mockSource);

      await act(async () => {
        render(<TitleScreen dispatch={mockDispatch} updateService={testService} />);
      });

      // Modal appears
      const updateHeader = await screen.findByRole('heading', { name: /發現新版本/ });
      expect(updateHeader).toBeDefined();

      // Click "立即更新"
      const updateBtn = screen.getByRole('button', { name: /立即更新/i });
      await act(async () => {
        fireEvent.click(updateBtn);
      });

      expect(mockDownload).toHaveBeenCalled();
      // Should switch to "立即重啟" once finished
      const relaunchBtn = await screen.findByRole('button', { name: /立即重啟/i });
      expect(relaunchBtn).toBeDefined();

      // Click "立即重啟"
      await act(async () => {
        fireEvent.click(relaunchBtn);
      });

      expect(mockRelaunch).toHaveBeenCalled();
    });
  });
});

