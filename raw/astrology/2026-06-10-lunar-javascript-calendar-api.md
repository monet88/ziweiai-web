---
Source: https://github.com/6tail/lunar-javascript
Collected: 2026-06-10
Published: 2022-01-15
---

# Lunar-javascript API and Calendar Reference

Here are the API usages and code patterns extracted from reference repositories regarding lunar calendar conversion, Gan-Zhi calculations, and solar terms.

## Solar to Lunar and Lunar to Solar Conversion

```javascript
// Solar to Lunar
const { Solar, Lunar } = require('lunar-javascript');
let solar = Solar.fromYmd(1986, 5, 29);
let lunar = solar.getLunar();

console.log(lunar.getYear());  // 1986 (lunar year)
console.log(lunar.getMonth()); // 4 (lunar month)
console.log(lunar.getDay());   // 21 (lunar day)
console.log(lunar.isLeap());   // false (is leap month)

// Lunar to Solar (Handling leap months)
// If month value is negative, it represents a leap month (e.g., -4 for leap April)
let lunarLeap = Lunar.fromYmdHms(1986, -4, 21, 12, 0, 0);
let solarBack = lunarLeap.getSolar();
```

## Gan-Zhi (Can Chi) Extraction Options

`lunar-javascript` provides different methods for calculating Gan-Zhi based on boundary configurations (e.g., Spring Begins/Li Chun vs. Spring Festival/Lunar New Year):

### Year Gan-Zhi and Sheng Xiao
- `lunar.getYearInGanZhi()`: boundary is Lunar New Year (正月初一).
- `lunar.getYearInGanZhiByLiChun()`: boundary is Spring Begins (立春).
- `lunar.getYearInGanZhiExact()`: boundary is exact moment of Spring Begins.
- `lunar.getYearShengXiao()` / `getYearShengXiaoByLiChun()` / `getYearShengXiaoExact()`: corresponding Sheng Xiao (生肖) calculations.

### Month Gan-Zhi
- `lunar.getMonthInGanZhi()`: normal lunar month.
- `lunar.getMonthInGanZhiExact()`: divided strictly by solar terms (节气) - crucial for Bazi.

### Day Gan-Zhi
- `lunar.getDayInGanZhiExact()`: normal calculation.
- `lunar.getDayInGanZhiExact2()`: alternative day Gan-Zhi calculation accounting for specific time splits.

### Hour Gan-Zhi
- Gotten from `EightChar` object:
  ```javascript
  const eightChar = lunar.getEightChar();
  const hourGanZhi = eightChar.getTime(); // Returns Gan-Zhi of birth hour (e.g., "癸酉")
  const hourGan = eightChar.getTimeGan();
  const hourZhi = eightChar.getTimeZhi();
  ```

## Solar Terms (Jie Qi)
- `lunar.getPrevJie(byDay)`: previous Solar Term.
- `lunar.getNextJie(byDay)`: next Solar Term.
- `lunar.getPrevQi(byDay)`: previous Zhong Qi.
- `lunar.getNextQi(byDay)`: next Zhong Qi.
