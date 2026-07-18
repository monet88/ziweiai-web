import type { BirthInput } from '@ziweiai/contracts';

export function toIztroTimeIndex(input: BirthInput): number | null {
  if (input.time.isUnknown) {
    return null;
  }

  const hour = input.time.hour;
  const minute = input.time.minute;

  if (hour === null || minute === null) {
    return null;
  }

  if (hour === 23) {
    return 12;
  }

  if (hour === 0) {
    return 0;
  }

  return Math.floor((hour + 1) / 2);
}
