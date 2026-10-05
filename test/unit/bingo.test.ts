import { describe, expect, it } from 'vitest';
import {
  CELLS,
  cardKey,
  FREE,
  FREE_CELL,
  generateCard,
  bestLine,
  hasLine,
  isFullHouse,
  isValidClaim,
  LINES,
  randomInt,
} from '../../src/shared/bingo';

describe('generateCard', () => {
  it('has 24 distinct in-range squares with FREE in the centre', () => {
    for (let i = 0; i < 200; i++) {
      const card = generateCard(50);
      expect(card).toHaveLength(CELLS);
      expect(card[FREE_CELL]).toBe(FREE);
      const picks = card.filter((v) => v !== FREE);
      expect(new Set(picks).size).toBe(24);
      expect(picks.every((v) => v >= 0 && v < 50)).toBe(true);
    }
  });

  it('rejects pools that are too small', () => {
    expect(() => generateCard(23)).toThrow(RangeError);
    expect(
      generateCard(24)
        .filter((v) => v !== FREE)
        .sort((a, b) => a - b),
    ).toEqual(Array.from({ length: 24 }, (_, i) => i));
  });

  it('picks squares roughly uniformly', () => {
    const counts = new Array<number>(50).fill(0);
    const runs = 4000;
    for (let i = 0; i < runs; i++) for (const v of generateCard(50)) if (v !== FREE) counts[v]!++;
    const expected = (runs * 24) / 50;
    for (const c of counts) expect(Math.abs(c - expected) / expected).toBeLessThan(0.1);
  });

  it('produces practically unique cards', () => {
    const keys = new Set(Array.from({ length: 1000 }, () => cardKey(generateCard(50))));
    expect(keys.size).toBe(1000);
  });
});

describe('randomInt', () => {
  it('stays in range and rejects bad bounds', () => {
    for (let i = 0; i < 1000; i++) {
      const n = randomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
    expect(() => randomInt(0)).toThrow();
    expect(() => randomInt(1.5)).toThrow();
  });
});

describe('cardKey', () => {
  it('ignores order and the FREE cell', () => {
    expect(cardKey([3, 1, FREE, 2])).toBe(cardKey([1, 2, 3]));
  });
});

describe('win detection', () => {
  it('has 12 lines', () => expect(LINES).toHaveLength(12));

  it.each(LINES.map((l) => [l.join(',')]))('detects line %s', (line) => {
    const cells = line.split(',').map(Number);
    expect(hasLine(cells)).toBe(true);
    expect(isValidClaim('line', cells)).toBe(true);
  });

  it('counts the FREE centre towards lines', () => {
    expect(hasLine([10, 11, 13, 14])).toBe(true); // middle row
    expect(hasLine([2, 7, 17, 22])).toBe(true); // middle column
  });

  it('rejects near misses', () => {
    expect(hasLine([])).toBe(false);
    expect(hasLine([0, 1, 2, 3])).toBe(false);
    expect(hasLine([0, 6, 18, 24])).toBe(true);
    expect(hasLine([0, 6, 18])).toBe(false);
    expect(hasLine([0, 5, 10, 15, 21])).toBe(false);
  });

  it('detects a full house only when every cell is marked', () => {
    const all = Array.from({ length: CELLS }, (_, i) => i).filter((i) => i !== FREE_CELL);
    expect(isFullHouse(all)).toBe(true);
    expect(isValidClaim('house', all)).toBe(true);
    expect(isFullHouse(all.slice(1))).toBe(false);
    expect(isValidClaim('house', [0, 1, 2, 3, 4])).toBe(false);
  });
});

describe('bestLine', () => {
  it('counts the most marked cells in any line, with the free centre', () => {
    expect(bestLine([])).toBe(1);
    expect(bestLine([0, 1])).toBe(2);
    expect(bestLine([10, 11, 13])).toBe(4);
    expect(bestLine([0, 1, 2, 3, 4])).toBe(5);
  });
});
