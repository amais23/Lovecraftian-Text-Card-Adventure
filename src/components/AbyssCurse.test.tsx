import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TitleScreen } from './TitleScreen';
import { App } from '../App';

describe('Abyss Curse & Blood Overlay (ADR-0014)', () => {
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('progresses blood overlay through 5 stages when repeatedly succumbing to abyss', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Initially no blood
    expect(screen.queryByTestId(/abyss-blood-stage/)).toBeNull();

    // 1st surrender: open exit modal -> click submit
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));

    // 1st click: modal closes, no blood overlay yet
    expect(screen.queryByTestId(/abyss-blood-stage/)).toBeNull();

    // 2nd surrender
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));

    // 2nd click: stage 1 blood appears
    expect(screen.getByTestId('abyss-blood-stage-1')).toBeDefined();

    // 3rd surrender
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));

    // 3rd click: stage 2 blood appears
    expect(screen.getByTestId('abyss-blood-stage-2')).toBeDefined();

    // 4th surrender
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));

    // 4th click: stage 3 blood appears
    expect(screen.getByTestId('abyss-blood-stage-3')).toBeDefined();

    // 5th surrender: triggers permanent YOU DIED
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(localStorage.getItem('arkham_abyss_dead')).toBe('true');
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('YOU DIED')).toBeDefined();
  });

  it('retains blood overlay when dismissing exit modal via X button', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Reach stage 1 (2 clicks)
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));

    expect(screen.getByTestId('abyss-blood-stage-1')).toBeDefined();

    // Open exit modal again, then close via X
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /關閉對話/i }));

    // Blood stage 1 is still retained!
    expect(screen.getByTestId('abyss-blood-stage-1')).toBeDefined();

    // Next click continues accumulation to stage 2!
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));
    expect(screen.getByTestId('abyss-blood-stage-2')).toBeDefined();
  });

  it('resets count and clears blood overlay when clicking struggle button', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Reach stage 2 (3 clicks)
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
      fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));
    }
    expect(screen.getByTestId('abyss-blood-stage-2')).toBeDefined();

    // Open modal and choose struggle
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /握緊理智 · 掙扎求生/i }));

    // Blood overlay is immediately cleared
    expect(screen.queryByTestId(/abyss-blood-stage/)).toBeNull();

    // Subsequent click restarts from 1st click (no blood)
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));
    expect(screen.queryByTestId(/abyss-blood-stage/)).toBeNull();
  });

  it('resets count and clears blood overlay when clicking other title menu options', () => {
    render(<TitleScreen dispatch={mockDispatch} />);

    // Reach stage 1 (2 clicks)
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));
    fireEvent.click(screen.getByRole('button', { name: /離開遊戲/i }));
    fireEvent.click(screen.getByRole('button', { name: /屈服並沉入深淵/i }));
    expect(screen.getByTestId('abyss-blood-stage-1')).toBeDefined();

    // Click Manual button
    fireEvent.click(screen.getByRole('button', { name: /調查紀錄手冊/i }));

    // Blood overlay cleared
    expect(screen.queryByTestId(/abyss-blood-stage/)).toBeNull();
  });

  it('App directly renders AbyssDeathScreen when localStorage has arkham_abyss_dead flag', () => {
    localStorage.setItem('arkham_abyss_dead', 'true');

    render(<App />);

    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('YOU DIED')).toBeDefined();
    expect(screen.queryByRole('button', { name: /開啟新調查/i })).toBeNull();
  });
});
