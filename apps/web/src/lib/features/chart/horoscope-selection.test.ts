import { describe, expect, it } from 'vitest';
import { createHoroscopeSelection } from './horoscope-selection.svelte';

describe('createHoroscopeSelection — khởi tạo + mặc định', () => {
  it('initial = {} khi default decadal null', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    expect(sel.value).toEqual({});
  });

  it('initial = { decadalIndex: N } khi default = N (áp ngay lúc dựng)', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => 3 });
    expect(sel.value).toEqual({ decadalIndex: 3 });
  });

  it('ensureDefault áp default khi snapshot tới muộn (lần đầu null, sau có giá trị)', () => {
    let def: number | null = null;
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => def });
    expect(sel.value).toEqual({});
    def = 5;
    sel.ensureDefault();
    expect(sel.value).toEqual({ decadalIndex: 5 });
  });

  it('ensureDefault KHÔNG ghi đè sau khi user toggle off đại vận', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => 3 });
    expect(sel.value).toEqual({ decadalIndex: 3 });
    sel.selectDecadal(3); // toggle off
    expect(sel.value).toEqual({});
    sel.ensureDefault(); // không được áp lại — user đã chủ động bỏ
    expect(sel.value).toEqual({});
  });
});

describe('createHoroscopeSelection — đại vận', () => {
  it('selectDecadal lần đầu set decadal', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    expect(sel.value).toEqual({ decadalIndex: 2 });
  });

  it('selectDecadal(M) (M ≠ N) đổi sang M, reset 3 tầng dưới', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    sel.selectYearly(2026);
    sel.selectMonthly(6);
    sel.selectDaily(15);
    sel.selectDecadal(4);
    expect(sel.value).toEqual({ decadalIndex: 4 });
  });

  it('selectDecadal(N) khi đang chọn N = toggle off → {}', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    sel.selectDecadal(2);
    expect(sel.value).toEqual({});
  });
});

describe('createHoroscopeSelection — cascade + noop khi chưa leo tầng', () => {
  it('selectYearly khi decadalIndex null = noop', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectYearly(2026);
    expect(sel.value).toEqual({});
  });

  it('selectYearly đặt yearly, giữ decadal, reset monthly+daily', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    sel.selectYearly(2026);
    sel.selectMonthly(6);
    sel.selectDaily(15);
    sel.selectYearly(2027);
    expect(sel.value).toEqual({ decadalIndex: 2, yearlyYear: 2027 });
  });

  it('selectMonthly khi yearlyYear null = noop', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    sel.selectMonthly(6);
    expect(sel.value).toEqual({ decadalIndex: 2 });
  });

  it('selectDaily khi monthlyMonth null = noop', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    sel.selectYearly(2026);
    sel.selectDaily(15);
    expect(sel.value).toEqual({ decadalIndex: 2, yearlyYear: 2026 });
  });
});

describe('createHoroscopeSelection — toggle off tầng dưới', () => {
  it('toggle off yearly = reset monthly+daily, giữ decadal', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    sel.selectYearly(2026);
    sel.selectMonthly(6);
    sel.selectDaily(15);
    sel.selectYearly(2026); // toggle off
    expect(sel.value).toEqual({ decadalIndex: 2 });
  });

  it('toggle off monthly = reset daily, giữ decadal+yearly', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    sel.selectYearly(2026);
    sel.selectMonthly(6);
    sel.selectDaily(15);
    sel.selectMonthly(6); // toggle off
    expect(sel.value).toEqual({ decadalIndex: 2, yearlyYear: 2026 });
  });

  it('toggle off daily = chỉ bỏ daily', () => {
    const sel = createHoroscopeSelection({ defaultDecadalIndex: () => null });
    sel.selectDecadal(2);
    sel.selectYearly(2026);
    sel.selectMonthly(6);
    sel.selectDaily(15);
    sel.selectDaily(15);
    expect(sel.value).toEqual({ decadalIndex: 2, yearlyYear: 2026, monthlyMonth: 6 });
  });
});
