import type { BirthInput } from '@ziweiai/contracts';


export type XuanshuBridgeSettings = {
  name: string;
  occupy: string;
  sex: 0 | 1;
  date: string;
  dateType: 0 | 1;
  leapMonthType: 0 | 1;
};



export function formatXuanshuDateTime(input: BirthInput): string {
  const hour = input.time.hour ?? 0;
  const minute = input.time.minute ?? 0;

  return `${input.date.year}-${String(input.date.month).padStart(2, '0')}-${String(input.date.day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

export function buildXuanshuBridgeSettings(input: BirthInput): XuanshuBridgeSettings {
  return {
    name: '',
    occupy: '',
    sex: input.sexOrGenderForChart === 'female' ? 0 : 1,
    date: formatXuanshuDateTime(input),
    dateType: input.calendar === 'gregorian' ? 0 : 1,
    leapMonthType: input.calendar === 'lunar' && input.date.isLeapMonth ? 1 : 0,
  };
}
