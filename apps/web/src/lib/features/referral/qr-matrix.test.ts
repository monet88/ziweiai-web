import { describe, it, expect } from 'vitest';
import { generateQrMatrix } from './qr-matrix';

describe('QR Matrix Generator (Pure TypeScript)', () => {
  it('generates a 33x33 matrix for a referral URL', () => {
    const url = 'https://tuvitoantap.vercel.app/share/ref/ABC12345';
    const matrix = generateQrMatrix(url);

    expect(matrix.length).toBe(33);
    expect(matrix[0].length).toBe(33);
  });

  it('correctly places the 3 finder patterns (7x7)', () => {
    const url = 'https://tuvitoantap.vercel.app/share/ref/TEST';
    const matrix = generateQrMatrix(url);

    // Top-Left Finder corner (0,0) must be true (black)
    expect(matrix[0][0]).toBe(true);
    expect(matrix[0][6]).toBe(true);
    expect(matrix[6][0]).toBe(true);
    expect(matrix[6][6]).toBe(true);
    // Center of finder (3,3) must be true
    expect(matrix[3][3]).toBe(true);
    // White ring (1,1) must be false
    expect(matrix[1][1]).toBe(false);

    // Top-Right Finder (0, 26)
    expect(matrix[0][26]).toBe(true);
    expect(matrix[0][32]).toBe(true);
    expect(matrix[3][29]).toBe(true);

    // Bottom-Left Finder (26, 0)
    expect(matrix[26][0]).toBe(true);
    expect(matrix[32][0]).toBe(true);
    expect(matrix[29][3]).toBe(true);
  });

  it('throws an error if input text exceeds QR capacity', () => {
    const veryLongString = 'A'.repeat(70);
    expect(() => generateQrMatrix(veryLongString)).toThrow('Text too long');
  });
});
