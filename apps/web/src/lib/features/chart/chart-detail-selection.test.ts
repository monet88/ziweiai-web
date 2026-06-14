// Reset state cung khi đổi lá số (US-006 acceptance): selection là factory runes thuần.
// Route bọc model trong {#key chartId} → đổi chartId tạo instance MỚI. Test mô phỏng:
//   - instance mới luôn bắt đầu selectedPalaceKey = null (đổi lá số = reset đúng);
//   - select/toggle/clear hoạt động trong một instance;
//   - hai instance độc lập (chọn cung ở instance A không rò sang B).
import { describe, expect, it } from 'vitest';
import { createPalaceSelection } from './chart-detail-model.svelte';

describe('createPalaceSelection (reset theo chartId)', () => {
  it('instance mới bắt đầu với selectedPalaceKey = null', () => {
    const selection = createPalaceSelection();
    expect(selection.selectedPalaceKey).toBeNull();
  });

  it('select đặt cung, chọn lại cùng cung sẽ bỏ chọn (toggle)', () => {
    const selection = createPalaceSelection();
    selection.select('wealthPalace');
    expect(selection.selectedPalaceKey).toBe('wealthPalace');
    selection.select('wealthPalace');
    expect(selection.selectedPalaceKey).toBeNull();
  });

  it('clear đưa selection về null', () => {
    const selection = createPalaceSelection();
    selection.select('careerPalace');
    selection.clear();
    expect(selection.selectedPalaceKey).toBeNull();
  });

  it('đổi lá số = instance mới: cung lá số cũ KHÔNG rò sang lá số mới', () => {
    const oldChart = createPalaceSelection();
    oldChart.select('spousePalace');
    expect(oldChart.selectedPalaceKey).toBe('spousePalace');

    // Mô phỏng remount {#key chartId}: tạo instance mới cho lá số khác.
    const newChart = createPalaceSelection();
    expect(newChart.selectedPalaceKey).toBeNull();
    // Instance cũ không bị ảnh hưởng (độc lập state).
    expect(oldChart.selectedPalaceKey).toBe('spousePalace');
  });
});
