import { describe, expect, it } from 'vitest';
import { CELLS } from '../../src/shared/bingo';
import { SQUARE_MAX, SQUARES } from '../../src/shared/content';
import { CAST } from '../../src/shared/content/cast';
import { CONTESTANT_MAX, LINEUP_MAX } from '../../src/shared/predictions';
import { cleanText, textLength } from '../../src/shared/sanitize';
import { SHOW_SLUGS } from '../../src/shared/shows';

describe.each(SHOW_SLUGS)('%s squares', (show) => {
  const squares = SQUARES[show];

  it('has a big enough pool for varied cards', () => expect(squares.length).toBeGreaterThanOrEqual(40));
  it('fits the card', () => expect(squares.length).toBeGreaterThanOrEqual(CELLS - 1));

  it.each(squares.map((s) => [s]))('"%s" is short, clean and unique', (square) => {
    // Soft hyphens are deliberate break hints (see content files); cleanText strips them like any invisible char.
    const visible = square.replaceAll('\u00AD', '');
    expect([...visible].length).toBeLessThanOrEqual(SQUARE_MAX);
    expect(cleanText(square)).toBe(visible);
    expect(squares.filter((s) => s.toLowerCase() === square.toLowerCase())).toHaveLength(1);
  });
});

describe('cast lists', () => {
  for (const [show, cast] of Object.entries(CAST)) {
    it(`${show}: names fit, are clean and unique, and fit a room's line-up`, () => {
      const names = cast.people.map((p) => p.name);
      expect(names.length).toBeLessThanOrEqual(LINEUP_MAX);
      expect(new Set(names.map((n) => n.toLocaleLowerCase())).size).toBe(names.length);
      for (const name of names) {
        expect(cleanText(name)).toBe(name);
        expect(textLength(name)).toBeLessThanOrEqual(CONTESTANT_MAX);
      }
    });
  }
});
