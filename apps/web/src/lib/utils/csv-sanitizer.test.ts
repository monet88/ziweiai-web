import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell } from './csv-sanitizer';

describe('sanitizeCsvCell', () => {
  it('handles null and undefined values safely', () => {
    expect(sanitizeCsvCell(null)).toBe('""');
    expect(sanitizeCsvCell(undefined)).toBe('""');
  });

  it('escapes standard strings and numbers', () => {
    expect(sanitizeCsvCell('Normal Text')).toBe('"Normal Text"');
    expect(sanitizeCsvCell(12345)).toBe('"12345"');
  });

  it('escapes internal double quotes properly', () => {
    expect(sanitizeCsvCell('Hello "World"')).toBe('"Hello ""World"""');
  });

  it('neutralizes dangerous formula injection characters', () => {
    expect(sanitizeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
    expect(sanitizeCsvCell('+cmd|')).toBe('"\'+cmd|"');
    expect(sanitizeCsvCell('-1+1')).toBe('"\'-1+1"');
    expect(sanitizeCsvCell('@something')).toBe('"\'@something"');
    expect(sanitizeCsvCell('\tTabStart')).toBe('"\'\tTabStart"');
  });
});
