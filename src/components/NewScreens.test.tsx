import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AltarScreen } from './AltarScreen';
import { VaultScreen } from './VaultScreen';
import { BloodAltarScreen } from './BloodAltarScreen';
import { RemainsScreen } from './RemainsScreen';
import { createInitialCombatState } from '../engine/gameReducer';
import type { GameState } from '../types/game';

describe('New Node Screens (Issue #30)', () => {
  describe('AltarScreen', () => {
    it('renders altar screen and dispatches USE_ALTAR and LEAVE_ALTAR', () => {
      const dispatch = vi.fn();
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'altar',
        investigator: {
          ...createInitialCombatState().investigator,
          health: 20,
          maxHealth: 25,
          handCapacity: 2,
        },
        altarUsed: false,
      };

      render(<AltarScreen state={state} dispatch={dispatch} />);

      expect(screen.getByText(/禁忌祭壇 · 幽藍冷火之所/)).toBeDefined();
      expect(screen.getByText(/血肉淬鍊之誓/)).toBeDefined();
      expect(screen.getByText(/超維神經撕裂/)).toBeDefined();
      expect(screen.getByText(/深淵恩賜喚引/)).toBeDefined();

      const fleshBtn = screen.getByText(/割肉奉獻/);
      fireEvent.click(fleshBtn);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'USE_ALTAR',
        payload: { optionId: 'flesh' },
      });

      const leaveBtn = screen.getByText(/轉身離開/);
      fireEvent.click(leaveBtn);
      expect(dispatch).toHaveBeenCalledWith({ type: 'LEAVE_ALTAR' });
    });

    it('handles mind sacrifice with sanity payment option', () => {
      const dispatch = vi.fn();
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'altar',
        investigator: {
          ...createInitialCombatState().investigator,
          health: 8, // <= 10 HP, cannot pay with HP
          handCapacity: 2,
        },
        sanityDeck: createInitialCombatState().sanityDeck, // has > 2 cards
        altarUsed: false,
      };

      render(<AltarScreen state={state} dispatch={dispatch} />);

      // Switch to paying with sanity
      const sanityToggleBtn = screen.getByText(/損耗 2 點理智代價/);
      fireEvent.click(sanityToggleBtn);

      const mindBtn = screen.getByText(/損耗理智 · 永久除役 2 張卡牌/);
      fireEvent.click(mindBtn);

      expect(dispatch).toHaveBeenCalledWith({
        type: 'USE_ALTAR',
        payload: { optionId: 'mind', costType: 'sanity' },
      });
    });
  });

  describe('VaultScreen', () => {
    it('renders 3 vault relics and handles relic or obols claim', () => {
      const dispatch = vi.fn();
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'vault',
        vaultRelics: [
          {
            id: 'elder_sign_amulet',
            name: '古神之印護符',
            description: '每場戰鬥開始獲得 5 點初始護甲',
            flavorText: '古印護符',
            rarity: 'common',
            icon: 'Shield',
          },
          {
            id: 'pocket_watch',
            name: '黃銅懷錶',
            description: '手牌容量 +1',
            flavorText: '懷錶',
            rarity: 'rare',
            icon: 'Watch',
          },
          {
            id: 'vitality_elixir',
            name: '活力秘藥',
            description: '最大生命值 +5',
            flavorText: '秘藥',
            rarity: 'common',
            icon: 'Heart',
          },
        ],
        vaultClaimed: false,
      };

      const { container } = render(<VaultScreen state={state} dispatch={dispatch} />);

      expect(screen.getByText(/遺物秘閣 · 太古密藏/)).toBeDefined();
      expect(screen.getByText('古神之印護符')).toBeDefined();
      expect(screen.getByText('黃銅懷錶')).toBeDefined();
      expect(screen.getByText('活力秘藥')).toBeDefined();

      // Claim relic
      const claimRelicBtn = container.querySelector('#vault-relic-btn-elder_sign_amulet') as HTMLElement;
      expect(claimRelicBtn).toBeDefined();
      fireEvent.click(claimRelicBtn);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'CLAIM_VAULT_RELIC',
        payload: { relicId: 'elder_sign_amulet' },
      });

      // Claim obols
      const claimObolsBtn = screen.getByText(/搜括 35 古金幣/);
      fireEvent.click(claimObolsBtn);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'CLAIM_VAULT_RELIC',
        payload: { claimObols: true },
      });

      // Leave
      const leaveBtn = screen.getByText(/離開遺物秘閣/);
      fireEvent.click(leaveBtn);
      expect(dispatch).toHaveBeenCalledWith({ type: 'LEAVE_VAULT' });
    });
  });

  describe('BloodAltarScreen', () => {
    it('allows toggling exactly 2 cards and purging them', () => {
      const dispatch = vi.fn();
      const base = createInitialCombatState();
      const state: GameState = {
        ...base,
        phase: 'blood_altar',
        bloodAltarUsed: false,
      };

      const { container } = render(<BloodAltarScreen state={state} dispatch={dispatch} />);

      expect(screen.getByText(/血之祭壇 · 淨化血契/)).toBeDefined();

      const purgeBtn = container.querySelector('#blood-altar-purge-btn') as HTMLButtonElement;
      expect(purgeBtn.disabled).toBe(true);

      // Select first two cards
      const cardItems = container.querySelectorAll('.blood-altar-card-item');
      expect(cardItems.length).toBeGreaterThan(2);

      fireEvent.click(cardItems[0]);
      fireEvent.click(cardItems[1]);

      expect(purgeBtn.disabled).toBe(false);

      fireEvent.click(purgeBtn);
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
          payload: expect.objectContaining({ cardIds: expect.any(Array) }),
        })
      );

      const leaveBtn = screen.getByText(/保留牌組 · 離開血之祭壇/);
      fireEvent.click(leaveBtn);
      expect(dispatch).toHaveBeenCalledWith({ type: 'LEAVE_BLOOD_ALTAR' });
    });

    it('selects only the clicked card and does NOT select all copies when multiple copies of the same card exist', () => {
      const dispatch = vi.fn();
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'blood_altar',
        bloodAltarUsed: false,
        sanityDeck: [
          {
            id: 'card_punch_1',
            name: '重拳壓制',
            category: 'combat',
            costType: 'stamina',
            costValue: 1,
            isTemporary: false,
            effects: [{ type: 'damage', value: 4 }],
            description: '造成 4 點物理傷害。',
            flavorText: '「第一拳」',
          },
          {
            id: 'card_punch_2',
            name: '重拳壓制',
            category: 'combat',
            costType: 'stamina',
            costValue: 1,
            isTemporary: false,
            effects: [{ type: 'damage', value: 4 }],
            description: '造成 4 點物理傷害。',
            flavorText: '「第二拳」',
          },
          {
            id: 'card_punch_3',
            name: '重拳壓制',
            category: 'combat',
            costType: 'stamina',
            costValue: 1,
            isTemporary: false,
            effects: [{ type: 'damage', value: 4 }],
            description: '造成 4 點物理傷害。',
            flavorText: '「第三拳」',
          },
          {
            id: 'card_bayonet_1',
            name: '軍刀突刺',
            category: 'combat',
            costType: 'stamina',
            costValue: 2,
            isTemporary: false,
            effects: [{ type: 'damage', value: 11 }],
            description: '造成 11 點物理傷害。',
            flavorText: '「突刺」',
          },
        ],
        hand: [],
        discardPile: [],
      };

      const { container } = render(<BloodAltarScreen state={state} dispatch={dispatch} />);

      const cardItems = container.querySelectorAll('.blood-altar-card-item');
      expect(cardItems).toHaveLength(4);

      // Verify all 3 punch cards have the same display title
      const titles = Array.from(cardItems).map((c) => c.querySelector('.blood-altar-card-name')?.textContent);
      expect(titles[0]).toBe('重拳壓制');
      expect(titles[1]).toBe('重拳壓制');
      expect(titles[2]).toBe('重拳壓制');

      // Click ONLY the first copy
      fireEvent.click(cardItems[0]);

      // Copy 1 must be selected
      expect(cardItems[0].classList.contains('selected')).toBe(true);
      expect(cardItems[0].querySelector('.blood-altar-card-checkbox svg')).toBeDefined();

      // Copies 2 and 3 must NOT be selected!
      expect(cardItems[1].classList.contains('selected')).toBe(false);
      expect(cardItems[2].classList.contains('selected')).toBe(false);
      expect(cardItems[1].querySelector('.blood-altar-card-checkbox svg')).toBeNull();
      expect(cardItems[2].querySelector('.blood-altar-card-checkbox svg')).toBeNull();

      // Selected count indicator should show exactly 1 / 2
      expect(screen.getByText(/已選除役卡牌：1 \/ 2 張/)).toBeDefined();

      // Click the second copy
      fireEvent.click(cardItems[1]);
      expect(cardItems[0].classList.contains('selected')).toBe(true);
      expect(cardItems[1].classList.contains('selected')).toBe(true);
      expect(cardItems[2].classList.contains('selected')).toBe(false);
      expect(screen.getByText(/已選除役卡牌：2 \/ 2 張/)).toBeDefined();

      // Click the purge button
      const purgeBtn = container.querySelector('#blood-altar-purge-btn') as HTMLButtonElement;
      expect(purgeBtn.disabled).toBe(false);
      fireEvent.click(purgeBtn);

      expect(dispatch).toHaveBeenCalledWith({
        type: 'SACRIFICE_CARDS_AT_BLOOD_ALTAR',
        payload: { cardIds: ['card_punch_1', 'card_punch_2'] },
      });
    });
  });


  describe('RemainsScreen', () => {
    it('renders fallen investigator details and handles card/obols inheritance', () => {
      const dispatch = vi.fn();
      const fallenCard = createInitialCombatState().sanityDeck[0];
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'remains',
        fallenInvestigator: {
          name: '威廉·戴爾',
          occupation: '地質學教授',
          deck: [fallenCard],
          obols: 60,
          depth: 2,
          causeOfDeath: '遭未知之物吞噬',
          timestamp: 1700000000000,
        },
        remainsClaimed: false,
      };

      const { container } = render(<RemainsScreen state={state} dispatch={dispatch} />);

      expect(screen.getByText(/屍骨遺骸 · 前代調查員長眠之所/)).toBeDefined();
      expect(screen.getByText('威廉·戴爾')).toBeDefined();
      expect(screen.getByText('地質學教授')).toBeDefined();
      expect(screen.getByText(/第 2 深度/)).toBeDefined();
      expect(screen.getByText(/遭未知之物吞噬/)).toBeDefined();

      // Select and inherit card
      const cardItem = container.querySelector('.remains-card-item');
      expect(cardItem).toBeDefined();
      if (cardItem) fireEvent.click(cardItem);

      const inheritCardBtn = screen.getByText(/繼承選取卡牌/);
      fireEvent.click(inheritCardBtn);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'INHERIT_REMAINS',
        payload: { type: 'card', cardId: fallenCard.id },
      });

      // Inherit obols
      const inheritObolsBtn = screen.getByText(/拾取 30 枚古金幣/); // 60 * 0.5 = 30
      fireEvent.click(inheritObolsBtn);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'INHERIT_REMAINS',
        payload: { type: 'obols' },
      });

      // Leave
      const leaveBtn = screen.getByText(/致敬默哀 · 離開遺骨/);
      fireEvent.click(leaveBtn);
      expect(dispatch).toHaveBeenCalledWith({ type: 'LEAVE_REMAINS' });
    });

    it('filters out abyssal fragments and unplayable cards from remains card selection', () => {
      const dispatch = vi.fn();
      const state: GameState = {
        ...createInitialCombatState(),
        phase: 'remains',
        fallenInvestigator: {
          name: '亨利·阿米蒂奇',
          occupation: '密斯卡托尼克圖書館長',
          deck: [
            {
              id: 'card_abyssal_fragment_1',
              name: '深淵封印殘片·其一',
              category: 'madness',
              costType: 'free',
              costValue: 0,
              isTemporary: false,
              isUnplayable: true,
              effects: [],
              description: '無法打出。',
              flavorText: '深淵之物',
            },
          ],
          obols: 40,
          depth: 2,
          causeOfDeath: '心智瘋狂墜入深淵',
          timestamp: 1700000000000,
        },
        remainsClaimed: false,
      };

      render(<RemainsScreen state={state} dispatch={dispatch} />);
      expect(screen.queryByText('深淵封印殘片·其一')).toBeNull();
      expect(screen.getByText(/先驅手記中未遺留可繼承之常規卡牌/)).toBeDefined();
    });
  });
});
