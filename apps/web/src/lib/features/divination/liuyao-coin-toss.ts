// US-029: gieo 3 dong xu cho mot hao Luc Hao. Day la lop trinh dien (animation +
// random toss) nam TREN gia tri thu cong san co: ket qua map ve LiuyaoLineStateKey
// roi ghi qua setLiuyaoLine nhu cu, KHONG doi contract/backend.
//
// Quy uoc 3 dong xu co dien: moi dong sap (head) = 3, ngua (tail) = 2. Tong 3 dong:
//   6 = lao am (oldYin, hao dong)
//   7 = thieu duong (youngYang)
//   8 = thieu am (youngYin)
//   9 = lao duong (oldYang, hao dong)
import type { LiuyaoLineStateKey } from '@ziweiai/contracts';

// true = sap (head, gia tri 3); false = ngua (tail, gia tri 2).
export type CoinFace = boolean;

export function coinSumToLineState(sum: number): LiuyaoLineStateKey {
  switch (sum) {
    case 6:
      return 'oldYin';
    case 7:
      return 'youngYang';
    case 8:
      return 'youngYin';
    case 9:
      return 'oldYang';
    default:
      throw new Error(`Tong 3 dong xu khong hop le: ${sum} (chi nhan 6-9).`);
  }
}

export function coinsToLineState(coins: readonly CoinFace[]): LiuyaoLineStateKey {
  if (coins.length !== 3) {
    throw new Error(`Gieo Luc Hao can dung 3 dong xu, nhan duoc ${coins.length}.`);
  }
  const sum = coins.reduce<number>((total, isHead) => total + (isHead ? 3 : 2), 0);
  return coinSumToLineState(sum);
}

// Gieo 3 dong xu ngau nhien. random() cho phep test bom gia tri xac dinh.
export function tossThreeCoins(random: () => number = Math.random): {
  coins: CoinFace[];
  state: LiuyaoLineStateKey;
} {
  const coins: CoinFace[] = [random() < 0.5, random() < 0.5, random() < 0.5];
  return { coins, state: coinsToLineState(coins) };
}
