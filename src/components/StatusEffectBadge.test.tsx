import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusEffectBadge } from './StatusEffectBadge';
import { createStatusEffect } from '../engine/statusEffects';

describe('StatusEffectBadge Component', () => {
  it('renders status name, stacks, and title tooltip correctly', () => {
    const status = createStatusEffect('might', 3);
    const { container } = render(<StatusEffectBadge status={status} />);

    expect(screen.getByText('力量')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    const badge = container.querySelector('.status-effect-badge');
    expect(badge).toBeTruthy();
    expect(badge?.classList.contains('status-might')).toBe(true);
    expect(badge?.getAttribute('title')).toBe('【力量】3 層\n' + status.description);
  });

  it('renders resilience and vulnerable badges with expected classes', () => {
    const resilience = createStatusEffect('resilience', 2);
    const { container: c1 } = render(<StatusEffectBadge status={resilience} />);
    expect(c1.querySelector('.status-resilience')).toBeTruthy();

    const vulnerable = createStatusEffect('vulnerable', 1);
    const { container: c2 } = render(<StatusEffectBadge status={vulnerable} />);
    expect(c2.querySelector('.status-vulnerable')).toBeTruthy();
  });
});
