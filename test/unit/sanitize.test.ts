import { describe, expect, it } from 'vitest';
import { cleanText, textLength } from '../../src/shared/sanitize';

const cp = (...codes: number[]) => String.fromCodePoint(...codes);

describe('cleanText', () => {
  it('trims and collapses whitespace, including newlines', () => {
    expect(cleanText('  hello \n\t world  ')).toBe('hello world');
  });

  it('strips bidi overrides and isolates (Trojan Source / spoofing)', () => {
    const input = `abc${cp(0x202e)}cba${cp(0x2066)}x${cp(0x2069)}${cp(0x200f)}`;
    expect(cleanText(input)).toBe('abccbax');
  });

  it('strips zero-width, BOM, soft hyphen and control characters', () => {
    const input = `a${cp(0x200b)}b${cp(0xfeff)}c${cp(0xad)}d${cp(0x0)}e${cp(0x7)}f${cp(0x9b)}g`;
    expect(cleanText(input)).toBe('abcdefg');
  });

  it('strips Unicode tag characters (invisible smuggled text)', () => {
    expect(cleanText(`hi${cp(0xe0041, 0xe0042)}`)).toBe('hi');
  });

  it('strips line and paragraph separators', () => {
    expect(cleanText(`a${cp(0x2028)}b${cp(0x2029)}c`)).toBe('abc');
  });

  it('keeps emoji ZWJ sequences intact', () => {
    const family = cp(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467);
    expect(cleanText(family)).toBe(family);
  });

  it('limits stacked combining marks (zalgo)', () => {
    const zalgo = 'a' + cp(0x301, 0x302, 0x303, 0x304, 0x305);
    expect(cleanText(zalgo)).toBe(('a' + cp(0x301, 0x302)).normalize('NFC'));
  });

  it('NFC-normalises', () => {
    expect(cleanText('e' + cp(0x301))).toBe(cp(0xe9));
  });

  it("leaves HTML-looking text as plain text (escaping is the renderer's job)", () => {
    expect(cleanText('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>');
  });

  it('can reduce text to empty', () => {
    expect(cleanText(`${cp(0x200b)} ${cp(0x202e)} `)).toBe('');
  });
});

describe('textLength', () => {
  it('counts code points, not UTF-16 units', () => {
    expect(textLength('😀😀')).toBe(2);
  });
});
