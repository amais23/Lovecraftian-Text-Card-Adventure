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

  it('toggleMuteWithFeedback toggles mute state and plays click feedback only when unmuting', () => {
    const playClickSpy = vi.spyOn(soundEngine, 'playClick').mockImplementation(() => {});

    // Ensure currently unmuted
    soundEngine.setMuted(false);
    playClickSpy.mockClear();

    // Mute: should not play click sound
    const isNowMuted = soundEngine.toggleMuteWithFeedback();
    expect(isNowMuted).toBe(true);
    expect(soundEngine.getMuted()).toBe(true);
    expect(playClickSpy).not.toHaveBeenCalled();

    // Unmute: should play click sound feedback
    const isNowUnmuted = soundEngine.toggleMuteWithFeedback();
    expect(isNowUnmuted).toBe(false);
    expect(soundEngine.getMuted()).toBe(false);
    expect(playClickSpy).toHaveBeenCalledTimes(1);

    playClickSpy.mockRestore();
  });

  it('safely handles playHeartbeat, playGunCock, playEngineStart, and playAstralHum without throwing in muted and unmuted states', () => {
    soundEngine.setMuted(true);
    expect(() => soundEngine.playHeartbeat()).not.toThrow();
    expect(() => soundEngine.playGunCock()).not.toThrow();
    expect(() => soundEngine.playEngineStart()).not.toThrow();
    expect(() => soundEngine.playAstralHum()).not.toThrow();
    expect(() => soundEngine.playCosmicBanishment()).not.toThrow();

    soundEngine.setMuted(false);
    expect(() => soundEngine.playHeartbeat()).not.toThrow();
    expect(() => soundEngine.playGunCock()).not.toThrow();
    expect(() => soundEngine.playEngineStart()).not.toThrow();
    expect(() => soundEngine.playAstralHum()).not.toThrow();
    expect(() => soundEngine.playCosmicBanishment()).not.toThrow();
  });
});

