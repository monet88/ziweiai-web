/**
 * Speech Recognition Controller: Web Speech API wrapper for Khâm Thiên Giám (AssistantPanel).
 * Hỗ trợ nhận diện giọng nói tiếng Việt chuẩn xác (vi-VN) cho ViOS.
 */

export interface SpeechRecognizerOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string, rawError?: string) => void;
  onEnd?: () => void;
}

export interface SpeechRecognizer {
  start: () => boolean;
  stop: () => void;
  abort: () => void;
  isListening: () => boolean;
  destroy: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

export function formatSpeechErrorMessage(errorType: string): string {
  switch (errorType) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Vui lòng cấp quyền sử dụng Microphone trên trình duyệt để đàm đạo bằng giọng nói.';
    case 'no-speech':
      return 'Chưa nhận được âm thanh giọng nói. Đương Số vui lòng thử lại.';
    case 'audio-capture':
      return 'Không tìm thấy thiết bị Microphone hoặc mic đang bị chiếm dụng.';
    case 'network':
      return 'Lỗi kết nối mạng trong quá trình nhận diện giọng nói tiếng Việt.';
    case 'aborted':
      return 'Đã dừng thu âm giọng nói.';
    default:
      return 'Không thể nhận diện giọng nói lúc này, vui lòng thử lại.';
  }
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export function createSpeechRecognizer(options: SpeechRecognizerOptions): SpeechRecognizer {
  let recognition: SpeechRecognitionLike | null = null;
  let listening = false;
  let isExplicitStop = false;

  const {
    lang = 'vi-VN',
    continuous = false,
    interimResults = true,
    onStart,
    onResult,
    onError,
    onEnd,
  } = options;

  function initRecognition(): SpeechRecognitionLike | null {
    if (!isSpeechRecognitionSupported()) return null;
    const windowObj = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const RecognitionConstructor = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
    if (!RecognitionConstructor) return null;

    try {
      const instance = new RecognitionConstructor();
      instance.lang = lang;
      instance.continuous = continuous;
      instance.interimResults = interimResults;

      instance.onstart = () => {
        listening = true;
        isExplicitStop = false;
        onStart?.();
      };

      instance.onresult = (event: any) => {
        if (!event?.results) return;
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0]?.transcript || '';
          } else {
            interimChunk += res[0]?.transcript || '';
          }
        }

        if (finalChunk) {
          onResult?.(finalChunk.trim(), true);
        } else if (interimChunk) {
          onResult?.(interimChunk.trim(), false);
        }
      };

      instance.onerror = (event: any) => {
        const errType = event?.error || 'unknown';
        // 'aborted' khi user chủ động ngắt không xem là lỗi nghiêm trọng
        if (errType === 'aborted' && isExplicitStop) {
          return;
        }
        const friendlyMsg = formatSpeechErrorMessage(errType);
        onError?.(friendlyMsg, errType);
      };

      instance.onend = () => {
        listening = false;
        onEnd?.();
      };

      return instance;
    } catch {
      return null;
    }
  }

  return {
    start: () => {
      if (!isSpeechRecognitionSupported()) {
        onError?.('Trình duyệt của bạn chưa hỗ trợ Web Speech API nhận diện giọng nói.', 'unsupported');
        return false;
      }

      if (listening) return true;

      try {
        if (!recognition) {
          recognition = initRecognition();
        }
        if (!recognition) {
          onError?.('Không thể khởi tạo bộ nhận diện giọng nói.', 'init-failed');
          return false;
        }
        isExplicitStop = false;
        recognition.start();
        return true;
      } catch (err: any) {
        // Tránh exception nếu start() được gọi khi đang pending
        listening = false;
        const msg = formatSpeechErrorMessage(err?.message || 'unknown');
        onError?.(msg, 'start-failed');
        return false;
      }
    },

    stop: () => {
      if (!recognition || !listening) return;
      isExplicitStop = true;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      listening = false;
    },

    abort: () => {
      if (!recognition || !listening) return;
      isExplicitStop = true;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      listening = false;
    },

    isListening: () => listening,

    destroy: () => {
      if (recognition) {
        isExplicitStop = true;
        try {
          recognition.abort();
        } catch {
          // ignore
        }
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition = null;
      }
      listening = false;
    },
  };
}
