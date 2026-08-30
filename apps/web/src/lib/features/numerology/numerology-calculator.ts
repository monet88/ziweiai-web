export interface NumerologyResult {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
}

const LETTER_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);

export function removeVietnameseDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd');
}

export function reduceToSingleDigit(number: number): number {
  if (number === 0) return 0;
  let current = number;
  while (current > 9 && current !== 11 && current !== 22 && current !== 33) {
    let sum = 0;
    let temp = current;
    while (temp > 0) {
      sum += temp % 10;
      temp = Math.floor(temp / 10);
    }
    current = sum;
  }
  return current;
}

export function calculateNumerology(fullName: string, birthDate: Date): NumerologyResult {
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  const daySum = reduceToSingleDigit(day);
  const monthSum = reduceToSingleDigit(month);
  const yearSum = reduceToSingleDigit(year);

  const lifePath = reduceToSingleDigit(daySum + monthSum + yearSum);

  const normalized = removeVietnameseDiacritics(fullName)
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  let destinySum = 0;
  let soulUrgeSum = 0;
  let personalitySum = 0;

  for (let i = 0; i < normalized.length; i++) {
    const letter = normalized[i]!;
    const val = LETTER_VALUES[letter] ?? 0;
    destinySum += val;

    if (VOWELS.has(letter)) {
      soulUrgeSum += val;
    } else {
      personalitySum += val;
    }
  }

  return {
    lifePath,
    destiny: reduceToSingleDigit(destinySum),
    soulUrge: reduceToSingleDigit(soulUrgeSum),
    personality: reduceToSingleDigit(personalitySum),
  };
}
