import { browser } from '$app/environment';

export interface AudioAdvisorState {
  isPlaying: boolean;
  isPaused: boolean;
  title: string;
  currentSentence: string;
  progressPercent: number;
  rate: number;
  zenSoundEnabled: boolean;
}

class AudioAdvisorEngine {
  isPlaying = $state(false);
  isPaused = $state(false);
  title = $state('Luận Giải Hoàng Cung');
  currentSentence = $state('');
  progressPercent = $state(0);
  rate = $state(1.0);
  zenSoundEnabled = $state(true);

  private sentences: string[] = [];
  private currentIndex = 0;
  private audioCtx: AudioContext | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (browser && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }

  private cleanMarkdown(md: string): string {
    return md
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/~~([^~]+)~~/g, '$1') // Strikethrough
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Markdown Links
      .replace(/https?:\/\/\S+/g, '') // Standalone URLs
      .replace(/^\s*[-*+]\s+/gm, '') // Unordered lists
      .replace(/^\s*\d+\.\s+/gm, '') // Ordered lists
      .replace(/^\s*>\s*/gm, '') // Blockquotes
      .replace(/\|/g, ' ') // Table borders and pipes
      .replace(/[-:]{3,}/g, ' ') // Table dividers
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✦★]/gu, '') // Symbols that speech synthesis might spell out
      .replace(/\n{2,}/g, '. ') // Double linebreaks become sentence breaks
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Sinh âm thanh chuông xoay Tây Tạng / tần số bát nhã Solfeggio 432Hz bằng Web Audio API thuần.
   * 100% Client-side, không tải mp3 ngoài, 0 latency!
   */
  playZenChime() {
    if (!browser || !this.zenSoundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioContextClass();
      } else if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // 1. Tần số cơ bản 432 Hz (Solfeggio Frequency - Tần số rung động an yên)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(432, now);

      // Envelope âm lượng: mềm mại và ngân dài (exponential decay)
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 3.3);

      // 2. Tần số họa ba 864 Hz (Chuông khánh nhẹ)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(864, now);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.exponentialRampToValueAtTime(0.06, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);

      osc2.start(now);
      osc2.stop(now + 2.5);
    } catch (e) {
      console.warn('Web Audio Ambient Chime unhandled:', e);
    }
  }

  private getVietnameseVoice(): SpeechSynthesisVoice | null {
    if (!browser || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    // Ưu tiên voice tiếng Việt tự nhiên
    const viVoices = voices.filter(
      (v) => v.lang === 'vi-VN' || v.lang === 'vi_VN' || v.lang.startsWith('vi'),
    );

    if (viVoices.length > 0) {
      // Ưu tiên voice chất lượng cao như Google, Microsoft, hoặc default
      const natural = viVoices.find(
        (v) =>
          v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('HoaiMy') ||
          v.name.includes('NamMinh') ||
          v.name.includes('Linh'),
      );
      return natural || viVoices[0] || null;
    }
    return null;
  }

  playText(rawMarkdown: string, customTitle?: string) {
    this.play(rawMarkdown, customTitle);
  }

  play(rawMarkdown: string, customTitle = 'Luận Giải Hoàng Cung') {
    if (!browser || !('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ tính năng phát âm thanh Text-To-Speech.');
      return;
    }

    this.stop();
    this.title = customTitle;

    const cleaned = this.cleanMarkdown(rawMarkdown);
    if (!cleaned) return;

    // Tách văn bản thành các câu ngắn để trình duyệt đọc mượt, không bị drop giữa chừng
    const rawSentences = cleaned
      .split(/(?<=[.?!;:])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    this.sentences = rawSentences.length > 0 ? rawSentences : [cleaned];
    this.currentIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.progressPercent = 0;

    // Rung chuông bát nhã khởi đầu buổi luận giải
    this.playZenChime();

    // Bắt đầu đọc câu đầu tiên sau 350ms để tiếng chuông ngân vang
    setTimeout(() => {
      if (this.isPlaying) {
        this.speakNext();
      }
    }, 400);
  }

  private speakNext() {
    if (!this.isPlaying || this.isPaused) return;

    if (this.currentIndex >= this.sentences.length) {
      // Đã đọc xong toàn bộ
      this.playZenChime(); // Chuông kết thúc
      this.stop();
      return;
    }

    const text = this.sentences[this.currentIndex]!;
    this.currentSentence = text;
    this.progressPercent = Math.round(((this.currentIndex + 1) / this.sentences.length) * 100);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = this.rate;
    utterance.pitch = 0.95; // Trầm ấm, uy nghiêm chuẩn phong thái Đạo Sĩ Hoàng Gia

    const voice = this.getVietnameseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      this.currentIndex++;
      // Đọc tiếp câu sau
      this.speakNext();
    };

    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        console.warn('SpeechSynthesis error:', e);
        this.currentIndex++;
        this.speakNext();
      }
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  pause() {
    if (!browser || !('speechSynthesis' in window)) return;
    if (this.isPlaying && !this.isPaused) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (!browser || !('speechSynthesis' in window)) return;
    if (this.isPlaying && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  togglePlayPause() {
    if (this.isPaused) {
      this.resume();
    } else if (this.isPlaying) {
      this.pause();
    }
  }

  stop() {
    if (!browser || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentSentence = '';
    this.progressPercent = 0;
    this.currentUtterance = null;
    this.sentences = [];
    this.currentIndex = 0;
  }

  setRate(newRate: number) {
    this.rate = newRate;
    if (this.isPlaying && !this.isPaused) {
      // Restart current sentence with new rate
      window.speechSynthesis.cancel();
      this.speakNext();
    }
  }

  toggleZenSound() {
    this.zenSoundEnabled = !this.zenSoundEnabled;
    if (this.zenSoundEnabled) {
      this.playZenChime();
    }
  }
}

export const audioAdvisor = new AudioAdvisorEngine();
