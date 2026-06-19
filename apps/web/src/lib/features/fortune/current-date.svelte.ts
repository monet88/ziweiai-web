import { currentMonthAsOf, currentYear, todayAsOf } from './fortune-dates';

/**
 * Mốc thời gian PHẢN ỨNG cho feature vận hạn (US-016). `asOf`/năm KHÔNG được đóng băng lúc
 * mount: một phiên SPA mở xuyên qua nửa đêm (hoặc giao thừa) sẽ hiển thị/yêu cầu sai ngày.
 * Làm tươi `now` khi tab quay lại trạng thái hiển thị — kịch bản thực tế của "phiên dài":
 * user rời tab rồi quay lại sau nửa đêm. Khi `now` đổi, hàm options của createQuery đọc getter
 * này sẽ chạy lại → đổi queryKey → fetch lại đúng ngày.
 */
export function createCurrentDate() {
  let now = $state(new Date());

  $effect(() => {
    const refresh = (): void => {
      if (document.visibilityState === 'visible') {
        now = new Date();
      }
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  });

  return {
    get today(): string {
      return todayAsOf(now);
    },
    get month(): string {
      return currentMonthAsOf(now);
    },
    get year(): number {
      return currentYear(now);
    },
  };
}
