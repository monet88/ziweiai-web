import { currentMonthAsOf, currentYear, todayAsOf } from './fortune-dates';

/** Số ms từ `from` tới đúng 00:00 LOCAL kế tiếp (đầu ngày mai theo giờ máy). */
function msUntilNextLocalMidnight(from: Date): number {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - from.getTime();
}

/**
 * Mốc thời gian PHẢN ỨNG cho feature vận hạn (US-016). `asOf`/năm KHÔNG được đóng băng lúc
 * mount: một phiên SPA mở xuyên qua nửa đêm (hoặc giao thừa) sẽ hiển thị/yêu cầu sai ngày.
 * Khi `now` đổi, hàm options của createQuery đọc getter này sẽ chạy lại → đổi queryKey → fetch lại.
 *
 * Hai cơ chế làm tươi bổ trợ nhau, phủ cả hai kịch bản "phiên dài":
 *  1. Hẹn giờ tới đúng nửa đêm LOCAL kế tiếp — bắt trường hợp tab MỞ & HIỂN THỊ liên tục xuyên
 *     nửa đêm (visibilitychange không bắn). Bắn xong tự lên lịch cho ngày kế.
 *  2. visibilitychange — timer nền có thể bị trình duyệt throttle khi tab ẩn, nên làm tươi ngay
 *     khi tab quay lại hiển thị (user rời tab rồi quay lại sau nửa đêm), rồi đặt lại lịch.
 */
export function createCurrentDate() {
  let now = $state(new Date());

  $effect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = (): void => {
      // +1s đệm để chắc chắn đã vượt ranh giới ngày khi callback chạy.
      timer = setTimeout(() => {
        now = new Date();
        scheduleMidnight();
      }, msUntilNextLocalMidnight(new Date()) + 1000);
    };
    scheduleMidnight();

    const refresh = (): void => {
      if (document.visibilityState === 'visible') {
        now = new Date();
        clearTimeout(timer);
        scheduleMidnight();
      }
    };
    document.addEventListener('visibilitychange', refresh);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
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
