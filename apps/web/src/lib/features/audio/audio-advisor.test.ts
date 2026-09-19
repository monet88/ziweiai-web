import { describe, it, expect, beforeEach } from 'vitest';
import { audioAdvisor } from './audio-advisor.svelte';

describe('AudioAdvisorEngine', () => {
  beforeEach(() => {
    audioAdvisor.stop();
  });

  it('khởi tạo với các giá trị mặc định chính xác', () => {
    expect(audioAdvisor.isPlaying).toBe(false);
    expect(audioAdvisor.isPaused).toBe(false);
    expect(audioAdvisor.rate).toBe(1.0);
    expect(audioAdvisor.zenSoundEnabled).toBe(true);
    expect(audioAdvisor.progressPercent).toBe(0);
  });

  it('hỗ trợ điều chỉnh tốc độ đọc rate (0.8x, 1.0x, 1.2x)', () => {
    audioAdvisor.setRate(1.2);
    expect(audioAdvisor.rate).toBe(1.2);

    audioAdvisor.setRate(0.8);
    expect(audioAdvisor.rate).toBe(0.8);
  });

  it('hỗ trợ bật tắt âm thanh chuông bát nhã 432Hz', () => {
    expect(audioAdvisor.zenSoundEnabled).toBe(true);
    audioAdvisor.toggleZenSound();
    expect(audioAdvisor.zenSoundEnabled).toBe(false);
    audioAdvisor.toggleZenSound();
    expect(audioAdvisor.zenSoundEnabled).toBe(true);
  });

  it('làm sạch các ký tự markdown trước khi đưa vào speech utterance', () => {
    const rawMarkdown = `
# Tiêu Đề Hoàng Cung
**Tử Vi Đẩu Số** là môn chiêm tinh hàng đầu.
- Điểm cát: *Rất Tốt*
> Lời khuyên ngự bút: Hãy bình tâm.
| Cột 1 | Cột 2 |
|---|---|
| Dữ liệu | Chi tiết |
[Xem thêm](https://tuvitoantap.vercel.app)
`;
    // Gọi private method cleanMarkdown thông qua type casting để kiểm tra độ tin cậy
    const cleaned = (audioAdvisor as any).cleanMarkdown(rawMarkdown);
    expect(cleaned).not.toContain('#');
    expect(cleaned).not.toContain('**');
    expect(cleaned).not.toContain('*');
    expect(cleaned).not.toContain('>');
    expect(cleaned).not.toContain('|');
    expect(cleaned).not.toContain('https://');
    expect(cleaned).toContain('Tử Vi Đẩu Số là môn chiêm tinh hàng đầu');
  });
});
