import { describe, expect, it } from 'vitest';
import {
  CODE_LENGTH,
  formatCode,
  generateCode,
  generateToken,
  normaliseCode,
  TOKEN_RE,
} from '../../src/shared/codes';

describe('access codes', () => {
  it('generates valid, distinct codes', () => {
    const codes = new Set(Array.from({ length: 2000 }, generateCode));
    expect(codes.size).toBe(2000);
    for (const code of codes) {
      expect(code).toHaveLength(CODE_LENGTH);
      expect(normaliseCode(code)).toBe(code);
    }
  });

  it('normalises case, separators and confusables', () => {
    expect(normaliseCode('abcde-fghjk')).toBe('ABCDEFGHJK');
    expect(normaliseCode(' o1l1i 23456 ')).toBe('0111123456');
  });

  it('rejects invalid input', () => {
    for (const bad of ['', 'ABCDE', 'ABCDEFGHJKM', 'ABCDE-FGHJU', '<script>', 'A'.repeat(100)]) {
      expect(normaliseCode(bad)).toBeNull();
    }
  });

  it('formats as XXXXX-XXXXX', () => expect(formatCode('ABCDEFGHJK')).toBe('ABCDE-FGHJK'));
});

describe('session tokens', () => {
  it('are 256-bit base64url', () => {
    const tokens = new Set(Array.from({ length: 500 }, generateToken));
    expect(tokens.size).toBe(500);
    for (const t of tokens) expect(t).toMatch(TOKEN_RE);
  });
});
