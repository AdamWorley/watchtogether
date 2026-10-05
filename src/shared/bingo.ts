export const GRID = 5;
export const CELLS = GRID * GRID;
export const FREE_CELL = 12;
/** Card value stored in the FREE centre cell. */
export const FREE = -1;

/** Every winning line as a list of cell positions (5 rows, 5 columns, 2 diagonals). */
export const LINES: readonly (readonly number[])[] = (() => {
  const lines: number[][] = [];
  for (let i = 0; i < GRID; i++) {
    lines.push(Array.from({ length: GRID }, (_, j) => i * GRID + j));
    lines.push(Array.from({ length: GRID }, (_, j) => j * GRID + i));
  }
  lines.push(Array.from({ length: GRID }, (_, j) => j * GRID + j));
  lines.push(Array.from({ length: GRID }, (_, j) => j * GRID + (GRID - 1 - j)));
  return lines;
})();

/** Uniform random integer in [0, max) using rejection sampling over crypto randomness. */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) throw new RangeError('bad max');
  const limit = Math.floor(2 ** 32 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    const n = buf[0]!;
    if (n < limit) return n % max;
  }
}

/**
 * Build a card: 24 distinct pool indices in random order with FREE in the centre.
 * Uses a partial Fisher–Yates shuffle so every card is equally likely.
 */
export function generateCard(poolSize: number, rand: (max: number) => number = randomInt): number[] {
  const needed = CELLS - 1;
  if (poolSize < needed) throw new RangeError(`pool needs at least ${needed} entries`);
  const idx = Array.from({ length: poolSize }, (_, i) => i);
  for (let i = 0; i < needed; i++) {
    const j = i + rand(poolSize - i);
    [idx[i], idx[j]] = [idx[j]!, idx[i]!];
  }
  const picks = idx.slice(0, needed);
  return [...picks.slice(0, FREE_CELL), FREE, ...picks.slice(FREE_CELL)];
}

/** Order-independent identity of a card's contents, used to keep cards unique within a room. */
export function cardKey(card: readonly number[]): string {
  return card
    .filter((v) => v !== FREE)
    .sort((a, b) => a - b)
    .join(',');
}

function markedSet(marks: Iterable<number>): Set<number> {
  const set = new Set(marks);
  set.add(FREE_CELL);
  return set;
}

export function hasLine(marks: Iterable<number>): boolean {
  const set = markedSet(marks);
  return LINES.some((line) => line.every((cell) => set.has(cell)));
}

export function isFullHouse(marks: Iterable<number>): boolean {
  const set = markedSet(marks);
  for (let i = 0; i < CELLS; i++) if (!set.has(i)) return false;
  return true;
}

export type ClaimKind = 'line' | 'house';

export function isValidClaim(kind: ClaimKind, marks: Iterable<number>): boolean {
  return kind === 'line' ? hasLine(marks) : isFullHouse(marks);
}
