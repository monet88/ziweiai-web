import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isRitualAudioMuted,
  setRitualAudioMuted,
  toggleRitualAudio,
  playCoinClink,
  playSingingBowl,
  playCardFlip,
} from './ritual-audio';

describe('Ritual Audio Synthesizer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to unmuted when no localStorage key exists', () => {
    expect(isRitualAudioMuted()).toBe(false);
  });

  it('correctly sets and toggles mute state in localStorage', () => {
    setRitualAudioMuted(true);
    expect(isRitualAudioMuted()).toBe(true);
    expect(localStorage.getItem('vios_ritual_audio_muted')).toBe('true');

    const toggled = toggleRitualAudio();
    expect(toggled).toBe(false);
    expect(isRitualAudioMuted()).toBe(false);
  });

  it('does not throw when triggering play methods even without real audio hardware', () => {
    expect(() => playCoinClink()).not.toThrow();
    expect(() => playSingingBowl()).not.toThrow();
    expect(() => playCardFlip()).not.toThrow();
  });

  it('respects muted state and does not create audio when muted', () => {
    setRitualAudioMuted(true);
    const audioSpy = vi.fn();
    (window as unknown as { AudioContext: unknown }).AudioContext = audioSpy;

    playCoinClink();
    playSingingBowl();
    playCardFlip();

    expect(audioSpy).not.toHaveBeenCalled();
  });
});
