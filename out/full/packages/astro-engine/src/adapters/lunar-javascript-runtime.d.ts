declare module 'lunar-javascript' {
  export interface EightCharLike {
    getYear(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getYearNaYin(): string;
    getYearShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonth(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getMonthNaYin(): string;
    getMonthShiShenGan(): string;
    getMonthShiShenZhi(): string[];
    getDay(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getDayNaYin(): string;
    getDayShiShenGan(): string;
    getDayShiShenZhi(): string[];
    getTime(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getTimeNaYin(): string;
    getTimeShiShenGan(): string;
    getTimeShiShenZhi(): string[];
    getTaiYuan(): string;
    getTaiYuanNaYin(): string;
    getTaiXi(): string;
    getTaiXiNaYin(): string;
    getMingGong(): string;
    getMingGongNaYin(): string;
    getShenGong(): string;
    getShenGongNaYin(): string;
  }

  export interface LunarLike {
    getDay(): number;
    getMonth(): number;
    toString(): string;
    getYearInGanZhiExact(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhiExact(): string;
    getTimeInGanZhi(): string;
    getEightChar(): EightCharLike;
    getJieQi?(): string;
    getPrevJie?(wholeDay?: boolean): { getName?(): string; toString(): string } | null;
    getPrevJieQi?(wholeDay?: boolean): { getName?(): string; toString(): string } | null;
  }

  export interface SolarLike {
    getLunar(): LunarLike;
    toYmdHms(): string;
  }

  export const Solar: {
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): SolarLike;
  };

  export const Lunar: {
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): LunarLike;
  };
}
