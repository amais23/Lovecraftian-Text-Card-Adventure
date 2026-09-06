import { describe, it, expect, vi } from 'vitest';
import { soundEngine } from './audioManager';

describe('SoundEngine subscription', () => {
  it('notifies subscribers when muted state changes and unsubscribes correctly', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsubscribe1 = soundEngine.subscribe(callback1);
    const unsubscribe2 = soundEngine.subscribe(callback2);

    const initialMuted = soundEngine.getMuted();
    soundEngine.setMuted(!initialMuted);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledWith(!initialMuted);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith(!initialMuted);

    // Unsubscribe callback1
    unsubscribe1();

    soundEngine.setMuted(initialMuted);
    expect(callback1).toHaveBeenCalledTimes(1); // not called again
    expect(callback2).toHaveBeenCalledTimes(2); // called again
    expect(callback2).toHaveBeenLastCalledWith(initialMuted);

    unsubscribe2();
  });
});
