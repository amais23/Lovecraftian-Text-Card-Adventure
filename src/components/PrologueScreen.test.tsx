import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PrologueScreen } from './PrologueScreen';

describe('PrologueScreen (Issue #13)', () => {
  it('renders 1920s Arkham Gazette clipping headline and letter content', () => {
    const mockDispatch = vi.fn();
    render(<PrologueScreen dispatch={mockDispatch} />);

    expect(screen.getByText(/阿卡姆早報 · ARKHAM GAZETTE/i)).toBeDefined();
    expect(screen.getByText(/密斯卡托尼克大學考古隊失聯/i)).toBeDefined();
    expect(screen.getByText(/阿卡姆調查委託密信/i)).toBeDefined();
  });

  it('dispatches COMPLETE_PROLOGUE when clicking skip button', () => {
    const mockDispatch = vi.fn();
    render(<PrologueScreen dispatch={mockDispatch} />);

    const skipBtn = screen.getByRole('button', { name: /跳過序章/i });
    fireEvent.click(skipBtn);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'COMPLETE_PROLOGUE' });
  });

  it('dispatches COMPLETE_PROLOGUE when clicking proceed button', () => {
    const mockDispatch = vi.fn();
    render(<PrologueScreen dispatch={mockDispatch} />);

    const proceedBtn = screen.getByRole('button', { name: /選擇調查員/i });
    fireEvent.click(proceedBtn);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'COMPLETE_PROLOGUE' });
  });

  it('dispatches RETURN_TO_TITLE when clicking back to title menu button', () => {
    const mockDispatch = vi.fn();
    render(<PrologueScreen dispatch={mockDispatch} />);

    const backBtn = screen.getByRole('button', { name: /返回主選單/i });
    fireEvent.click(backBtn);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RETURN_TO_TITLE' });
  });
});
