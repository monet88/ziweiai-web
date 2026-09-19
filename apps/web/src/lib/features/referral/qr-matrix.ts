/**
 * Pure TypeScript QR Code Generator (ISO/IEC 18004)
 * Generates a 2D boolean matrix (true = dark module, false = light module)
 * Optimized for Referral URLs (Byte mode, Version 4: 33x33, ECC Level M).
 * Capacity: up to 64 bytes (perfect for URLs like https://tuvitoantap.vercel.app/share/ref/ABCDEF12).
 * Zero-dependency, 100% offline, prevents Canvas CORS taint.
 */

// Galois Field GF(256) with primitive polynomial 0x11d (285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x <<= 1;
    if (x & 0x100) {
      x ^= 0x11d;
    }
  }
  for (let i = 255; i < 512; i++) {
    EXP_TABLE[i] = EXP_TABLE[i - 255];
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

// Reed-Solomon generator polynomial for given degree
function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const nextPoly = new Uint8Array(poly.length + 1);
    const factor = EXP_TABLE[i];
    for (let j = 0; j < poly.length; j++) {
      nextPoly[j] ^= gfMul(poly[j], factor);
      nextPoly[j + 1] ^= poly[j];
    }
    poly = nextPoly;
  }
  return poly;
}

// Compute Reed-Solomon ECC codewords
function rsComputeEcc(data: Uint8Array, eccLen: number): Uint8Array {
  const gen = rsGeneratorPoly(eccLen);
  const remainder = new Uint8Array(data.length + eccLen);
  remainder.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = remainder[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        remainder[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }
  return remainder.slice(data.length);
}

// QR Version 4 specs (ECC Level M: 64 data codewords, 36 EC codewords split into 2 blocks of 18)
const QR_V4 = {
  version: 4,
  size: 33, // 17 + 4 * 4
  totalCodewords: 100,
  dataCodewords: 64,
  eccCodewords: 36,
  blocks: [
    { dataCount: 32, eccCount: 18 },
    { dataCount: 32, eccCount: 18 },
  ],
  alignmentPatternPos: [6, 26],
};

export function generateQrMatrix(text: string): boolean[][] {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > QR_V4.dataCodewords - 3) {
    throw new Error(`Text too long for Referral QR (max ${QR_V4.dataCodewords - 3} bytes)`);
  }

  // 1. Bitstream encoding: Mode (Byte = 0100, 4 bits) + Count (8 bits for V1-9) + Data
  const bits: number[] = [];
  function pushBits(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte Mode
  pushBits(bytes.length, 8); // Character count
  for (const b of bytes) {
    pushBits(b, 8);
  }

  // Terminator (up to 4 zeroes)
  const maxDataBits = QR_V4.dataCodewords * 8;
  const termLen = Math.min(4, maxDataBits - bits.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Pad bytes (0xEC, 0x11) until data codewords are full
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bits.length < maxDataBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to byte array
  const dataBytes = new Uint8Array(QR_V4.dataCodewords);
  for (let i = 0; i < QR_V4.dataCodewords; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bits[i * 8 + b];
    }
    dataBytes[i] = byteVal;
  }

  // 2. Block partition & Reed-Solomon ECC calculation
  const b1Data = dataBytes.slice(0, 32);
  const b2Data = dataBytes.slice(32, 64);
  const b1Ecc = rsComputeEcc(b1Data, 18);
  const b2Ecc = rsComputeEcc(b2Data, 18);

  // 3. Interleave data and ECC codewords
  const interleaved: number[] = [];
  for (let i = 0; i < 32; i++) {
    interleaved.push(b1Data[i]);
    interleaved.push(b2Data[i]);
  }
  for (let i = 0; i < 18; i++) {
    interleaved.push(b1Ecc[i]);
    interleaved.push(b2Ecc[i]);
  }

  // 4. Construct 33x33 Matrix
  const size = QR_V4.size;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null),
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false),
  );

  function setModule(r: number, c: number, val: boolean, isFunc = false) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (isFunc) isFunction[r][c] = true;
    }
  }

  // Place Finder Pattern (7x7) + Separator
  function placeFinder(startR: number, startC: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = startR + r;
        const col = startC + c;
        if (row < 0 || row >= size || col < 0 || col >= size) continue;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBlack =
            r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(row, col, isBlack, true);
        } else {
          setModule(row, col, false, true); // Separator
        }
      }
    }
  }

  placeFinder(0, 0); // Top-Left
  placeFinder(0, size - 7); // Top-Right
  placeFinder(size - 7, 0); // Bottom-Left

  // Alignment Pattern at (26, 26)
  function placeAlignment(centerR: number, centerC: number) {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBlack = Math.max(Math.abs(r), Math.abs(c)) !== 1;
        setModule(centerR + r, centerC + c, isBlack, true);
      }
    }
  }
  placeAlignment(26, 26);

  // Timing Patterns (Row 6 & Col 6)
  for (let i = 8; i < size - 8; i++) {
    const isBlack = i % 2 === 0;
    if (matrix[6][i] === null) setModule(6, i, isBlack, true);
    if (matrix[i][6] === null) setModule(i, 6, isBlack, true);
  }

  // Dark module
  setModule(size - 8, 8, true, true);

  // Format info reserve (Level M + Mask 0: (row + col) % 2 === 0 -> 0b10000 BCH encoded = 0x537e ^ 0x5412 = 0x076c)
  // Format string for M (00) and Mask 0 (000): Format bits = 0x5412
  // Precomputed 15-bit format info for (Level M = 00, Mask 0 = 000): 101010000010010
  const FORMAT_BITS = 0b101010000010010;
  for (let i = 0; i < 15; i++) {
    const bit = ((FORMAT_BITS >> (14 - i)) & 1) === 1;
    // Top-left
    if (i <= 5) setModule(8, i, bit, true);
    else if (i === 6) setModule(8, 7, bit, true);
    else if (i === 7) setModule(8, 8, bit, true);
    else if (i === 8) setModule(7, 8, bit, true);
    else setModule(14 - i, 8, bit, true);

    // Split around Bottom-left and Top-right
    if (i < 7) {
      setModule(size - 1 - i, 8, bit, true);
    } else {
      setModule(8, size - 15 + i, bit, true);
    }
  }

  // 5. Place Data Bits with Mask 0 ((r + c) % 2 === 0)
  const allBits: number[] = [];
  for (const byte of interleaved) {
    for (let b = 7; b >= 0; b--) {
      allBits.push((byte >> b) & 1);
    }
  }
  // Add 7 remainder bits for V4
  for (let r = 0; r < 7; r++) {
    allBits.push(0);
  }

  let bitIdx = 0;
  let upwards = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // Skip vertical timing pattern column

    const rows = upwards
      ? Array.from({ length: size }, (_, i) => size - 1 - i)
      : Array.from({ length: size }, (_, i) => i);

    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (!isFunction[row][c]) {
          const bitVal = bitIdx < allBits.length ? allBits[bitIdx] : 0;
          bitIdx++;
          // Mask 0: (row + c) % 2 === 0
          const maskInvert = (row + c) % 2 === 0;
          matrix[row][c] = maskInvert ? bitVal === 0 : bitVal === 1;
        }
      }
    }
    upwards = !upwards;
  }

  return matrix.map((row) => row.map((cell) => cell ?? false));
}
