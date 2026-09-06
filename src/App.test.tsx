import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { soundEngine } from './engine/audioManager';

describe('App Onboarding Flow Integration (Issue #13)', () => {
  it('executes full 5-phase onboarding flow: Title -> Prologue -> Occupation Select -> Departure -> Map', () => {
    const playClickSpy = vi.spyOn(soundEngine, 'playClick').mockImplementation(() => {});
    const heartbeatSpy = vi.spyOn(soundEngine, 'playHeartbeat').mockImplementation(() => {});
    const gunSpy = vi.spyOn(soundEngine, 'playGunCock').mockImplementation(() => {});
    const engineSpy = vi.spyOn(soundEngine, 'playEngineStart').mockImplementation(() => {});

    render(<App />);

    // Phase 1: Title Screen
    expect(screen.getByText('克蘇魯文字卡牌冒險')).toBeDefined();
    const startNewGameBtn = screen.getByRole('button', { name: /開啟新調查/i });

    // Click "開啟新調查"
    fireEvent.click(startNewGameBtn);

    // Phase 2: Prologue Screen
    expect(screen.getByText(/阿卡姆早報 · ARKHAM GAZETTE/i)).toBeDefined();
    expect(screen.getByText(/密斯卡托尼克大學考古隊失聯/i)).toBeDefined();
    const proceedToOccupationBtn = screen.getByRole('button', { name: /選擇調查員/i });

    // Click proceed to occupation select
    fireEvent.click(proceedToOccupationBtn);

    // Phase 3: Occupation Select Screen
    expect(screen.getByText('命運的十字路口 · 選擇你的調查員')).toBeDefined();
    expect(screen.getByText('愛德華·皮爾斯 (Edward Pierce)')).toBeDefined();
    expect(screen.getByText('艾蓮諾·凡斯 (Eleanor Vance)')).toBeDefined();

    // Select Edward Pierce
    const choosePierceBtn = screen.getByRole('button', { name: /啟程調查/i });
    fireEvent.click(choosePierceBtn);

    // Phase 4: Departure Screen
    expect(screen.getByText(/雨夜啟程 · 破霧而行/i)).toBeDefined();
    expect(screen.getByText(/阿卡姆近郊街頭 · 暴雨與封鎖線前哨/i)).toBeDefined();
    const enterMapBtn = screen.getByRole('button', { name: /踏入調查地圖/i });

    // Click enter map
    fireEvent.click(enterMapBtn);

    // Phase 5: Map Screen
    expect(screen.getByText(/阿卡姆封鎖區/i)).toBeDefined();

    playClickSpy.mockRestore();
    heartbeatSpy.mockRestore();
    gunSpy.mockRestore();
    engineSpy.mockRestore();
  });

  it('allows skipping prologue directly to occupation select', () => {
    render(<App />);

    // Title -> click start
    fireEvent.click(screen.getByRole('button', { name: /開啟新調查/i }));
    expect(screen.getByText(/阿卡姆早報 · ARKHAM GAZETTE/i)).toBeDefined();

    // Click skip prologue
    const skipPrologueBtn = screen.getByRole('button', { name: /跳過序章/i });
    fireEvent.click(skipPrologueBtn);

    // Landed directly on Occupation Select
    expect(screen.getByText('命運的十字路口 · 選擇你的調查員')).toBeDefined();
  });

  it('allows returning to title from occupation select', () => {
    render(<App />);

    // Title -> Prologue -> Occupation Select
    fireEvent.click(screen.getByRole('button', { name: /開啟新調查/i }));
    fireEvent.click(screen.getByRole('button', { name: /跳過序章/i }));
    expect(screen.getByText('命運的十字路口 · 選擇你的調查員')).toBeDefined();

    // Click back to menu
    const backBtn = screen.getByRole('button', { name: /返回主選單/i });
    fireEvent.click(backBtn);

    // Back at Title Menu
    expect(screen.getByText('深淵正凝視著你 · 喚醒沉睡的心智')).toBeDefined();
    expect(screen.queryByText('命運的十字路口 · 選擇你的調查員')).toBeNull();
  });
});
