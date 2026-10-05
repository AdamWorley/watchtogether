import { describe, expect, it } from 'vitest';
import { CELLS } from '../../src/shared/bingo';
import { SQUARE_MAX, SQUARES } from '../../src/shared/content';
import { cleanText } from '../../src/shared/sanitize';
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
