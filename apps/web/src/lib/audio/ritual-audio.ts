// Ritual Audio Synthesizer (US-Sprint-54): Web Audio API synthesizer cho chiêm bái tâm linh.
// Tạo âm thanh chân thực (đồng xu cổ, chuông xoay Tây Tạng, lật bài) bằng bộ dao động tần số,
// không phụ thuộc file âm thanh ngoài, zero-bandwidth, tương thích 100% mọi trình duyệt hiện đại.

const MUTED_STORAGE_KEY = 'vios_ritual_audio_muted';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isRitualAudioMuted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(MUTED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setRitualAudioMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MUTED_STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // Ignore storage errors
  }
}

export function toggleRitualAudio(): boolean {
  const next = !isRitualAudioMuted();
  setRitualAudioMuted(next);
  return next;
}

/**
 * Âm thanh kim loại va chạm của 3 đồng tiền cổ Khang Hy/Càn Long rơi xuống đĩa gỗ/sứ.
 */
export function playCoinClink(): void {
  if (isRitualAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 3 đồng xu rơi so le nhau 25ms và 55ms
  const coinDelays = [0, 0.028, 0.058];
  const baseFreqs = [3800, 4300, 5100];

  coinDelays.forEach((delay, idx) => {
    const hitTime = now + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    // Dao động tần số nhẹ mô phỏng đồng xu rung lắc
    const freq = baseFreqs[idx] + (Math.random() * 300 - 150);
    osc.frequency.setValueAtTime(freq, hitTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, hitTime + 0.12);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, hitTime);

    // Envelope đanh và tắt nhanh trong 140ms
    gain.gain.setValueAtTime(0, hitTime);
    gain.gain.linearRampToValueAtTime(0.18, hitTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(hitTime);
    osc.stop(hitTime + 0.15);
  });
}

/**
 * Âm thanh chuông xoay Tây Tạng / chuông đồng ngân vang thiền định (Tần số 432Hz và họa âm).
 */
export function playSingingBowl(): void {
  if (isRitualAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const fundamental = 432; // Tần số thiền định
  const harmonics = [1, 2.01, 3.02, 4.04];
  const harmonicGains = [0.22, 0.11, 0.05, 0.02];

  harmonics.forEach((multiplier, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(fundamental * multiplier, now);

    // Hiệu ứng vibrato nhẹ nhàng (4Hz)
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.setValueAtTime(4.2, now);
    vibratoGain.gain.setValueAtTime(1.5, now);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.start(now);
    vibrato.stop(now + 2.8);

    // Envelope chuông ngân dài 2.5s
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(harmonicGains[i], now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 2.6);
  });
}

/**
 * Âm thanh lật lá bài Tarot chân thực bằng tiếng sột soạt giấy bồi cổ phong.
 */
export function playCardFlip(): void {
  if (isRitualAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.08; // 80ms
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Sinh white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, now);
  filter.Q.setValueAtTime(3.0, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.09);
}

/**
 * Âm thanh xóc ống thẻ xăm Quan Thánh chân thực bằng tiếng va đập của các thanh tre rỗng.
 */
export function playStickShake(): void {
  if (isRitualAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Chuỗi các va chạm thanh tre lách cách dồn dập
  const clickDelays = [0, 0.06, 0.13, 0.22, 0.31, 0.42, 0.55];
  const resonantFreqs = [880, 1150, 960, 1320, 1050, 1220, 920];

  clickDelays.forEach((delay, idx) => {
    const hitTime = now + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(resonantFreqs[idx], hitTime);
    osc.frequency.exponentialRampToValueAtTime(resonantFreqs[idx] * 0.7, hitTime + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(resonantFreqs[idx], hitTime);
    filter.Q.setValueAtTime(4.0, hitTime);

    const amp = 0.14 * (1 - idx * 0.08); // giảm dần về cuối
    gain.gain.setValueAtTime(0, hitTime);
    gain.gain.linearRampToValueAtTime(amp, hitTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, hitTime + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(hitTime);
    osc.stop(hitTime + 0.05);
  });
}

