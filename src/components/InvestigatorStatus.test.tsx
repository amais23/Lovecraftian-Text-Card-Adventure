import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { InvestigatorStatus } from './InvestigatorStatus';
import type { Investigator } from '../types/game';
import { ELDER_SIGN_AMULET, POCKET_WATCH } from '../engine/relics';
import { createStatusEffect } from '../engine/statusEffects';

describe('InvestigatorStatus Component (ADR-0018)', () => {
  const dummyInvestigator: Investigator = {
    name: '愛德華·皮爾斯',
    occupation: '私家偵探',
    health: 22,
    maxHealth: 25,
    stamina: 2,
    maxStamina: 3,
    armor: 4,
    obols: 30,
    handCapacity: 2,
    relics: [],
    statusEffects: [],
  };

  it('renders standard investigator resource meters', () => {
    render(
      <InvestigatorStatus
        investigator={dummyInvestigator}
        sanityCount={10}
        totalDeckCapacity={12}
        turn={1}
        onEndTurn={vi.fn()}
        isCombatEnded={false}
      />
    );

    expect(screen.getByText('愛德華·皮爾斯')).toBeDefined();
    expect(screen.getByText('私家偵探')).toBeDefined();
    expect(screen.getByText('22 / 25')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('2 / 3')).toBeDefined();
    expect(screen.getByText('10 / 12')).toBeDefined();
    expect(screen.getByText('手牌容量')).toBeDefined();
  });

  it('renders relics tray when investigator holds relics', () => {
    const invWithRelics: Investigator = {
      ...dummyInvestigator,
      relics: [ELDER_SIGN_AMULET, POCKET_WATCH],
    };

    render(
      <InvestigatorStatus
        investigator={invWithRelics}
        sanityCount={8}
        totalDeckCapacity={12}
        turn={2}
        onEndTurn={vi.fn()}
        isCombatEnded={false}
      />
    );

    expect(screen.getByTestId('relics-tray')).toBeDefined();
    expect(screen.getByText('古神之印護符')).toBeDefined();
    expect(screen.getByText('黃銅懷錶')).toBeDefined();
  });

  it('renders active status effects badges with correct stacks and tooltips', () => {
    const invWithStatuses: Investigator = {
      ...dummyInvestigator,
      statusEffects: [
        createStatusEffect('might', 3),
        createStatusEffect('vulnerable', 2),
        createStatusEffect('bleed', 1),
      ],
    };

    render(
      <InvestigatorStatus
        investigator={invWithStatuses}
        sanityCount={6}
        totalDeckCapacity={12}
        turn={3}
        onEndTurn={vi.fn()}
        isCombatEnded={false}
      />
    );

    const statusContainer = screen.getByTestId('investigator-status-effects');
    expect(statusContainer).toBeDefined();
    expect(within(statusContainer).getByText('力量')).toBeDefined();
    expect(within(statusContainer).getByText('3')).toBeDefined();
    expect(within(statusContainer).getByText('易傷')).toBeDefined();
    expect(within(statusContainer).getByText('2')).toBeDefined();
    expect(within(statusContainer).getByText('流血')).toBeDefined();
    expect(within(statusContainer).getByText('1')).toBeDefined();
  });

  it('calls onEndTurn when clicking end turn button in active combat', () => {
    const onEndTurnMock = vi.fn();
    render(
      <InvestigatorStatus
        investigator={dummyInvestigator}
        sanityCount={10}
        totalDeckCapacity={12}
        turn={1}
        onEndTurn={onEndTurnMock}
        isCombatEnded={false}
      />
    );

    const btn = screen.getByRole('button', { name: /結束回合/i });
    fireEvent.click(btn);
    expect(onEndTurnMock).toHaveBeenCalledTimes(1);
  });
});
