import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpdateModal } from './UpdateModal';
import type { UpdateInfo } from '../../services/updateService';

describe('UpdateModal', () => {
  const sampleUpdateInfo: UpdateInfo = {
    version: '0.4.1',
    currentVersion: '0.4.0',
    body: '### v0.4.1 更新摘要\n- 修復敵怪意圖計算異常\n- 調整調查員初始手牌保留數',
    date: '2026-09-26',
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <UpdateModal
        isOpen={false}
        onClose={vi.fn()}
        updateInfo={sampleUpdateInfo}
        onDismissVersion={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with version info and release notes when isOpen is true', () => {
    render(
      <UpdateModal
        isOpen={true}
        onClose={vi.fn()}
        updateInfo={sampleUpdateInfo}
        onDismissVersion={vi.fn()}
      />
    );

    expect(screen.getByText(/發現新版本/)).toBeDefined();
    expect(screen.getByText('0.4.1')).toBeDefined();
    expect(screen.getByText(/修復敵怪意圖計算異常/)).toBeDefined();
    expect(screen.getByRole('checkbox', { name: /不再提示此版本/ })).toBeDefined();
  });

  it('calls onClose when clicking "稍後再說"', () => {
    const handleClose = vi.fn();
    render(
      <UpdateModal
        isOpen={true}
        onClose={handleClose}
        updateInfo={sampleUpdateInfo}
        onDismissVersion={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /稍後再說/ }));
    expect(handleClose).toHaveBeenCalled();
  });

  it('calls onDismissVersion when checkbox is checked and modal is closed', () => {
    const handleClose = vi.fn();
    const handleDismiss = vi.fn();
    render(
      <UpdateModal
        isOpen={true}
        onClose={handleClose}
        updateInfo={sampleUpdateInfo}
        onDismissVersion={handleDismiss}
      />
    );

    const checkbox = screen.getByRole('checkbox', { name: /不再提示此版本/ }) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: /稍後再說/ }));
    expect(handleDismiss).toHaveBeenCalledWith('0.4.1');
    expect(handleClose).toHaveBeenCalled();
  });

  it('triggers onStartUpdate when clicking "立即更新"', () => {
    const handleStartUpdate = vi.fn();
    render(
      <UpdateModal
        isOpen={true}
        onClose={vi.fn()}
        updateInfo={sampleUpdateInfo}
        onDismissVersion={vi.fn()}
        onStartUpdate={handleStartUpdate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /立即更新/ }));
    expect(handleStartUpdate).toHaveBeenCalled();
  });
});
