import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CombatScreen } from './CombatScreen';
import type { GameState } from '../types/game';
import { createInitialCombatState } from '../engine/gameReducer';
import { COMPLETE_ANCIENT_SEAL } from '../engine/abyssalSeals';
import { INITIAL_STAR_SPAWN } from '../engine/eventData';
import { soundEngine } from '../engine/audioManager';

vi.mock('../engine/audioManager', () => ({
  soundEngine: {
    playClick: vi.fn(),
    playCardHover: vi.fn(),
    playCardPlay: vi.fn(),
    playDrawCard: vi.fn(),
    playDamage: vi.fn(),
    playCosmicBanishment: vi.fn(),
    playNewspaperSlam: vi.fn(),
    playEndingEerieTension: vi.fn(),
    getMuted: vi.fn(() => false),
    subscribe: vi.fn(() => () => {}),
    setMuted: vi.fn(),
    toggleMuted: vi.fn(),
  },
}));

describe('CombatScreen Component (Cosmic Banishment VFX & True Ending)', () => {
  let mockState: GameState;

  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      ...createInitialCombatState(),
      phase: 'combat',
      investigator: {
        name: '愛德華·皮爾斯',
        occupation: '私家偵探',
        occupationId: 'investigator',
        health: 25,
        maxHealth: 25,
        stamina: 3,
        maxStamina: 3,
        armor: 0,
        obols: 50,
      },
      currentEnemy: {
        ...INITIAL_STAR_SPAWN,
        health: 1,
        maxHealth: 150,
        armor: 0,
        divineImmortality: true,
      },
      hand: [
        {
          ...COMPLETE_ANCIENT_SEAL,
        },
      ],
      sanityDeck: [],
      discardPile: [],
    };
  });

  it('triggers cosmic banishment VFX and audio when playing COMPLETE_ANCIENT_SEAL against 1 health divine boss', () => {
    const dispatch = vi.fn();
    render(<CombatScreen state={mockState} dispatch={dispatch} />);

    // Click on the unlocked ancient seal
    const sealCard = screen.getByText('完整的深淵古印');
    fireEvent.click(sealCard);

    // Audio should be triggered
    expect(soundEngine.playCosmicBanishment).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'PLAY_CARD',
      payload: { cardId: COMPLETE_ANCIENT_SEAL.id },
    });

    // Cosmic banishment VFX overlay should appear
    expect(screen.getByText('【太古星辰封滅 · 舊神放逐】')).toBeDefined();
    expect(
      screen.getByText(/崇高熾白的星穹真理光芒撕裂深淵，克蘇魯星之眷族崩解湮滅/)
    ).toBeDefined();
  });

  it('dismisses cosmic banishment VFX when clicking anywhere on the overlay', () => {
    const dispatch = vi.fn();
    render(<CombatScreen state={mockState} dispatch={dispatch} />);

    // Trigger VFX
    const sealCard = screen.getByText('完整的深淵古印');
    fireEvent.click(sealCard);

    const overlay = screen.getByText('【太古星辰封滅 · 舊神放逐】').closest('.cosmic-banishment-overlay');
    expect(overlay).toBeDefined();

    // Click to dismiss
    fireEvent.click(overlay!);
    expect(screen.queryByText('【太古星辰封滅 · 舊神放逐】')).toBeNull();
  });

  it('renders ArkhamGazette true ending directly when phase is victory and isTrueEnding is true', () => {
    const dispatch = vi.fn();
    const trueEndingState: GameState = {
      ...mockState,
      phase: 'victory',
      isTrueEnding: true,
    };

    render(<CombatScreen state={trueEndingState} dispatch={dispatch} />);

    // Arkham Gazette true ending should be rendered
    expect(screen.getByText('THE ARKHAM GAZETTE')).toBeDefined();
    expect(screen.getByText('COSMIC BANISHMENT · TRUE VICTORY')).toBeDefined();
    expect(screen.getByText('達成真結局 · 凱旋歸來')).toBeDefined();
  });

  describe('CombatScreen Discard Phase (Issue #27 & ADR-0018)', () => {
    it('renders discard phase bar and displays excess hand count & required discard count', () => {
      const dispatch = vi.fn();
      const discardState: GameState = {
        ...mockState,
        hand: [
          { ...COMPLETE_ANCIENT_SEAL, id: 'card_1' },
          { ...COMPLETE_ANCIENT_SEAL, id: 'card_2' },
          { ...COMPLETE_ANCIENT_SEAL, id: 'card_3' },
        ],
        investigator: {
          ...mockState.investigator,
          handCapacity: 2,
        },
        discardPhase: {
          requiredDiscardCount: 1,
          selectedDiscardIds: [],
        },
      };

      render(<CombatScreen state={discardState} dispatch={dispatch} />);

      expect(screen.getByText('【手牌超出容量】')).toBeDefined();
      expect(screen.getByText(/超出容量上限（2 張）/)).toBeDefined();
      expect(screen.getByText(/已選 0\/1/)).toBeDefined();

      const confirmBtn = screen.getByRole('button', { name: /確認棄牌（0\/1）/ });
      expect((confirmBtn as HTMLButtonElement).disabled).toBe(true);

      const cancelBtn = screen.getByRole('button', { name: /取消/ });
      expect(cancelBtn).toBeDefined();

      // Investigator status displays handCapacity badge
      expect(screen.getByText('手牌容量')).toBeDefined();
    });

    it('dispatches TOGGLE_DISCARD_CARD when clicking a card in discard mode', () => {
      const dispatch = vi.fn();
      const discardState: GameState = {
        ...mockState,
        hand: [
          { ...COMPLETE_ANCIENT_SEAL, id: 'discard_target_card', name: '目標棄牌' },
        ],
        discardPhase: {
          requiredDiscardCount: 1,
          selectedDiscardIds: [],
        },
      };

      render(<CombatScreen state={discardState} dispatch={dispatch} />);

      const card = screen.getByText('目標棄牌');
      fireEvent.click(card);

      expect(dispatch).toHaveBeenCalledWith({
        type: 'TOGGLE_DISCARD_CARD',
        payload: { cardId: 'discard_target_card' },
      });
    });

    it('enables confirm button when selectedDiscardIds matches requiredDiscardCount and dispatches CONFIRM_DISCARD', () => {
      const dispatch = vi.fn();
      const discardState: GameState = {
        ...mockState,
        hand: [
          { ...COMPLETE_ANCIENT_SEAL, id: 'card_1', name: '已選棄牌' },
        ],
        discardPhase: {
          requiredDiscardCount: 1,
          selectedDiscardIds: ['card_1'],
        },
      };

      render(<CombatScreen state={discardState} dispatch={dispatch} />);

      const confirmBtn = screen.getByRole('button', { name: /確認棄牌（1\/1）/ });
      expect((confirmBtn as HTMLButtonElement).disabled).toBe(false);

      fireEvent.click(confirmBtn);
      expect(dispatch).toHaveBeenCalledWith({ type: 'CONFIRM_DISCARD' });
    });

    it('dispatches CANCEL_DISCARD when clicking cancel button', () => {
      const dispatch = vi.fn();
      const discardState: GameState = {
        ...mockState,
        discardPhase: {
          requiredDiscardCount: 1,
          selectedDiscardIds: [],
        },
      };

      render(<CombatScreen state={discardState} dispatch={dispatch} />);

      const cancelBtn = screen.getByRole('button', { name: /取消/ });
      fireEvent.click(cancelBtn);

      expect(dispatch).toHaveBeenCalledWith({ type: 'CANCEL_DISCARD' });
    });
  });
});
