import type { ChartSnapshot, HoroscopeFrame, HoroscopeScope } from '@ziweiai/contracts';
import { toIztroGender, mapHoroscopeAge, mapHoroscopeItem, buildZiweiAstrolabeSource } from './adapters/iztro-chart-adapter';
import { toIztroTimeIndex } from './adapters/iztro-time-index';

export interface ComputeZiweiHoroscopeInput {
  /** Snapshot lá số gốc đã lưu (chứa `birth.originalInput` để dựng lại astrolabe). */
  snapshot: ChartSnapshot;
  /** Mốc thời gian ISO `YYYY-MM-DD`. */
  asOf: string;
  /** Các tầng cần tính. `decadal`/`yearly` luôn có trong frame; `monthly`/`daily` chỉ thêm khi được yêu cầu. */
  scopes: HoroscopeScope[];
}

/**
 * Tính vận hạn Tử Vi cho 1 mốc thời gian, chạy server-side (decision 0011).
 *
 * Dựng lại astrolabe iztro từ `snapshot.birth.originalInput` qua đúng đường
 * `buildZiweiAstrolabeSource` mà adapter lá số gốc dùng — nhờ vậy `index` cung
 * Mệnh các tầng vận hạn khớp tuyệt đối với `palace.index` của snapshot đã lưu.
 *
 * Output đã ánh xạ Hán → ChartKey (ASCII) qua `mapHoroscopeItem`/`mapHoroscopeAge`,
 * nên không bao giờ rò ký tự Hán ra contract.
 */
export function computeZiweiHoroscope(input: ComputeZiweiHoroscopeInput): HoroscopeFrame {
  const { snapshot, asOf, scopes } = input;

  if (snapshot.chartSystem !== 'zi-wei-dou-shu') {
    throw new Error(`computeZiweiHoroscope chỉ hỗ trợ zi-wei-dou-shu, nhận: ${snapshot.chartSystem}`);
  }

  const birthInput = snapshot.birth.originalInput;
  const gender = toIztroGender(birthInput);
  const timeIndex = toIztroTimeIndex(birthInput);

  if (!gender || timeIndex === null) {
    throw new Error('Không thể tính vận hạn: lá số thiếu giới tính hoặc giờ sinh xác định.');
  }

  const astrolabe = buildZiweiAstrolabeSource(birthInput, gender, timeIndex);
  const source = astrolabe.horoscope(asOf, timeIndex);

  const frame: HoroscopeFrame = {
    decadal: mapHoroscopeItem(source.decadal),
    age: mapHoroscopeAge(source.age),
    yearly: mapHoroscopeItem(source.yearly),
  };

  if (scopes.includes('monthly') && source.monthly) {
    frame.monthly = mapHoroscopeItem(source.monthly);
  }
  if (scopes.includes('daily') && source.daily) {
    frame.daily = mapHoroscopeItem(source.daily);
  }

  return frame;
}
