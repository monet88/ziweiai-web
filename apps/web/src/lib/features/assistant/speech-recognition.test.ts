import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSpeechRecognitionSupported,
  formatSpeechErrorMessage,
  createSpeechRecognizer,
} from './speech-recognition';

describe('Speech Recognition Service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  describe('isSpeechRecognitionSupported', () => {
    it('returns false when neither SpeechRecognition nor webkitSpeechRecognition is available', () => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;

      expect(isSpeechRecognitionSupported()).toBe(false);
    });

    it('returns true when SpeechRecognition is present', () => {
      (window as any).SpeechRecognition = class MockSpeechRecognition {};
      expect(isSpeechRecognitionSupported()).toBe(true);
    });

    it('returns true when webkitSpeechRecognition is present', () => {
      (window as any).webkitSpeechRecognition = class MockSpeechRecognition {};
      expect(isSpeechRecognitionSupported()).toBe(true);
    });
  });

  describe('formatSpeechErrorMessage', () => {
    it('returns informative Vietnamese text for not-allowed', () => {
      expect(formatSpeechErrorMessage('not-allowed')).toContain('Microphone');
      expect(formatSpeechErrorMessage('service-not-allowed')).toContain('Microphone');
    });

    it('returns informative text for no-speech', () => {
      expect(formatSpeechErrorMessage('no-speech')).toContain('Chưa nhận được');
    });

    it('returns informative text for audio-capture', () => {
      expect(formatSpeechErrorMessage('audio-capture')).toContain('Microphone');
    });

    it('returns fallback message for unknown error', () => {
      expect(formatSpeechErrorMessage('unknown-err')).toContain('vui lòng thử lại');
    });
  });

  describe('createSpeechRecognizer lifecycle & callbacks', () => {
    let mockInstance: any;

    beforeEach(() => {
      mockInstance = {
        lang: '',
        continuous: false,
        interimResults: false,
        start: vi.fn(),
        stop: vi.fn(),
        abort: vi.fn(),
        onstart: null,
        onresult: null,
        onerror: null,
        onend: null,
      };

      (window as any).SpeechRecognition = function MockSpeechRecognition() {
        return mockInstance;
      };
    });

    it('notifies onError when speech recognition is not supported', () => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;

      const onError = vi.fn();
      const recognizer = createSpeechRecognizer({ onError });

      const ok = recognizer.start();
      expect(ok).toBe(false);
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('chưa hỗ trợ Web Speech API'),
        'unsupported'
      );
    });

    it('starts listening and triggers onStart callback', () => {
      const onStart = vi.fn();
      const recognizer = createSpeechRecognizer({ onStart });

      const ok = recognizer.start();
      expect(ok).toBe(true);
      expect(mockInstance.start).toHaveBeenCalled();

      // Trigger underlying onstart
      mockInstance.onstart();
      expect(onStart).toHaveBeenCalled();
      expect(recognizer.isListening()).toBe(true);
    });

    it('handles speech results for interim and final chunks', () => {
      const onResult = vi.fn();
      const recognizer = createSpeechRecognizer({ onResult });

      recognizer.start();
      mockInstance.onstart();

      // Simulate interim result
      mockInstance.onresult({
        resultIndex: 0,
        results: [
          [{ transcript: 'Xin chào' }],
        ],
      });
      expect(onResult).toHaveBeenCalledWith('Xin chào', false);

      // Simulate final result
      mockInstance.onresult({
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: 'Hỏi về cung Quan Lộc' }], { isFinal: true }),
        ],
      });
      expect(onResult).toHaveBeenCalledWith('Hỏi về cung Quan Lộc', true);
    });

    it('handles error events and invokes onError', () => {
      const onError = vi.fn();
      const recognizer = createSpeechRecognizer({ onError });

      recognizer.start();
      mockInstance.onerror({ error: 'not-allowed' });

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('Microphone'),
        'not-allowed'
      );
    });

    it('stops listening cleanly on stop() or onend', () => {
      const onEnd = vi.fn();
      const recognizer = createSpeechRecognizer({ onEnd });

      recognizer.start();
      mockInstance.onstart();
      expect(recognizer.isListening()).toBe(true);

      recognizer.stop();
      expect(mockInstance.stop).toHaveBeenCalled();

      mockInstance.onend();
      expect(onEnd).toHaveBeenCalled();
      expect(recognizer.isListening()).toBe(false);
    });

    it('destroys and cleans up references', () => {
      const recognizer = createSpeechRecognizer({});
      recognizer.start();
      recognizer.destroy();

      expect(mockInstance.abort).toHaveBeenCalled();
      expect(mockInstance.onstart).toBeNull();
      expect(mockInstance.onresult).toBeNull();
      expect(recognizer.isListening()).toBe(false);
    });
  });
});
