import type { BirthInput } from '@ziweiai/contracts';

export function resolveLunarMonthNumber(input: BirthInput): number {
  const month = Math.abs(input.date.month);
  return input.date.isLeapMonth ? -month : month;
}
