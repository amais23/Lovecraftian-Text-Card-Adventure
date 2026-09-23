import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MarketScreen } from './MarketScreen';
import type { GameState, MarketItem, Card } from '../types/game';
import { INITIAL_INVESTIGATOR, INITIAL_GHOUL } from '../engine/initialData';
import { cloneEnemy } from '../engine/enemyCatalog';
import { soundEngine } from '../engine/audioManager';

const mockCards: Card[] = [
  {
    id: 'test_c1',
    name: '調查員左輪手槍',
    category: 'combat',
    tier: 1,
    costType: 'stamina',
    costValue: 1,
    effects: [{ type: 'damage', value: 6 }],
    description: '造成 6 點傷害。',
    flavorText: '「點38口徑轉輪手槍，在黑暗巷弄中最可靠的防身武器。」',
    isTemporary: false,
  },
  {
    id: 'test_c2',
    name: '敏銳直覺',
    category: 'skill',
    tier: 1,
    costType: 'stamina',
    costValue: 1,
    effects: [{ type: 'armor', value: 5 }],
    description: '獲得 5 點護甲。',
    flavorText: '「在異樣聲響傳來前，神經已本能地緊繃警惕。」',
    isTemporary: false,
  },
];

const mockMarketItems: MarketItem[] = [
  {
    id: 'm_card_1',
    name: '雙管獵槍',
    type: 'card',
    price: 10,
    originalPrice: 20,
    isDiscounted: true,
    discountLabel: '半價特惠',
    card: {
      id: 'card_shotgun',
      name: '雙管獵槍',
      category: 'combat',
      tier: 1,
      costType: 'stamina',
      costValue: 2,
      effects: [{ type: 'damage', value: 14 }],
      description: '造成 14 點物理傷害。',
      flavorText: '「12號口徑鹿彈撕裂腐肉的轟鳴，足以撕裂最深沉的夢魘。」',
      isTemporary: false,
    },
    description: '造成 14 點物理傷害。',
  },
  {
    id: 'm_relic_1',
    name: '古神之印護符',
    type: 'relic',
    price: 28,
    relic: {
      id: 'elder_sign_amulet',
      name: '古神之印護符',
      description: '每場戰鬥開始時獲得 5 點護甲。',
      flavorText: '以不知名星辰金屬鍛鑄的微型古印，觸手冰涼。',
      rarity: 'common',
      icon: 'Shield',
      modifiers: { startingArmor: 5 },
    },
    description: '古老純銀鍛造之避邪護符。每場戰鬥開始時獲得 5 點初始防禦護甲。',
  },
  {
    id: 'm_heal_1',
    name: '軍用嗎啡注射劑',
    type: 'heal',
    price: 15,
    healAmount: 8,
    description: '戰地急救藥品，立即恢復 8 點肉體生命值。',
  },
];

function createScreenTestState(overrides?: Partial<GameState>): GameState {
  return {
    phase: 'market',
    currentDepth: 1,
    turn: 1,
    investigator: {
      ...INITIAL_INVESTIGATOR,
      obols: 50,
      relics: [],
    },
    sanityDeck: mockCards,
    hand: [],
    discardPile: [],
    isMadness: false,
    currentEnemy: cloneEnemy(INITIAL_GHOUL),
    battleLog: [],
    marketItems: mockMarketItems,
    marketPurgeUsed: false,
    ...overrides,
  };
}

describe('MarketScreen Component (Issue #53)', () => {
  it('renders dynamic items shelf with cards, relics, and medical supplies', () => {
    const state = createScreenTestState();
    const dispatch = vi.fn();
    render(<MarketScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText('雙管獵槍')).toBeTruthy();
    expect(screen.getByText('古神之印護符')).toBeTruthy();
    expect(screen.getByText('軍用嗎啡注射劑')).toBeTruthy();

    // Check relic badge
    expect(screen.getByText('舊日遺物')).toBeTruthy();
    expect(screen.getByText('醫療補給')).toBeTruthy();
    expect(screen.getByText('典藏卡牌')).toBeTruthy();
  });

  it('renders discount label and struck-through original price for discounted item', () => {
    const state = createScreenTestState();
    const dispatch = vi.fn();
    const { container } = render(<MarketScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText('半價特惠')).toBeTruthy();
    const originalPriceEl = container.querySelector('.market-item-original-price');
    expect(originalPriceEl).toBeTruthy();
    expect(originalPriceEl?.textContent).toContain('20');
  });

  it('handles buying an item and dispatching BUY_MARKET_ITEM', () => {
    const state = createScreenTestState();
    const dispatch = vi.fn();
    render(<MarketScreen state={state} dispatch={dispatch} />);

    const buyButtons = screen.getAllByRole('button', { name: /購買/ });
    expect(buyButtons.length).toBeGreaterThan(0);

    fireEvent.click(buyButtons[0]);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'BUY_MARKET_ITEM',
      payload: { itemId: mockMarketItems[0].id },
    });
  });

  it('renders Card Purge service section with 30 obols price and allows purging', () => {
    const state = createScreenTestState();
    const dispatch = vi.fn();
    render(<MarketScreen state={state} dispatch={dispatch} />);

    expect(screen.getByText(/黑市牌庫除役服務/)).toBeTruthy();
    expect(screen.getByText(/30 古金幣/)).toBeTruthy();

    const openPurgeBtn = screen.getByRole('button', { name: /委託除役服務/ });
    expect(openPurgeBtn).toBeTruthy();
    expect(openPurgeBtn.hasAttribute('disabled')).toBe(false);

    // Open purge selector
    fireEvent.click(openPurgeBtn);

    // Should display deck cards to choose
    expect(screen.getByText('調查員左輪手槍')).toBeTruthy();
    expect(screen.getByText('敏銳直覺')).toBeTruthy();

    // Select first card
    const cardOption = screen.getByTestId('purge-card-test_c1');
    fireEvent.click(cardOption);

    // Confirm purge button
    const confirmBtn = screen.getByRole('button', { name: /確認焚毀除役/ });
    expect(confirmBtn).toBeTruthy();
    expect(confirmBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(confirmBtn);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'PURGE_CARD_AT_MARKET',
      payload: { cardId: 'test_c1' },
    });
  });

  it('disables purge button when player has insufficient obols (< 30) and plays denial audio on click', () => {
    const playDenySpy = vi.spyOn(soundEngine, 'playDeny');
    const state = createScreenTestState({
      investigator: {
        ...INITIAL_INVESTIGATOR,
        obols: 20,
      },
    });
    const dispatch = vi.fn();
    const { container } = render(<MarketScreen state={state} dispatch={dispatch} />);

    const openPurgeBtn = screen.getByRole('button', { name: /古金幣不足/ });
    expect(openPurgeBtn).toBeTruthy();
    expect(openPurgeBtn.hasAttribute('disabled')).toBe(true);

    const btnWrapper = container.querySelector('.market-purge-btn-wrapper');
    expect(btnWrapper).toBeTruthy();
    fireEvent.click(btnWrapper!);
    expect(playDenySpy).toHaveBeenCalled();
    playDenySpy.mockRestore();
  });

  it('disables purge button when purge service was already used in this visit', () => {
    const state = createScreenTestState({
      marketPurgeUsed: true,
    });
    const dispatch = vi.fn();
    render(<MarketScreen state={state} dispatch={dispatch} />);

    const openPurgeBtn = screen.getByRole('button', { name: /本次已除役/ });
    expect(openPurgeBtn).toBeTruthy();
    expect(openPurgeBtn.hasAttribute('disabled')).toBe(true);
  });

  it('dispatches LEAVE_MARKET when clicking leave button', () => {
    const state = createScreenTestState();
    const dispatch = vi.fn();
    render(<MarketScreen state={state} dispatch={dispatch} />);

    const leaveBtn = screen.getByRole('button', { name: /離開黑市/ });
    fireEvent.click(leaveBtn);
    expect(dispatch).toHaveBeenCalledWith({ type: 'LEAVE_MARKET' });
  });
});
