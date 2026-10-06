// The WatchTogether brand: one source for every place the logo appears (the inline SVG, the canvas
// keepsake and, via scripts/brand-assets.mjs, the favicon and app icons), so they can't drift apart.
//
// Mark: a telly showing the lobby's test-card bars (the same seven colours as the home page strip, drawn
// from the show worlds). Wordmark: "WatchTogether" in Bricolage Grotesque ExtraBold, width 85, tracking
// -0.01em (SIL OFL 1.1), outlined to a path so it renders identically on every device and in canvas.
// Geometry is in a 52-unit-high lockup box. The wordmark outline lives in brand-word.ts (font units, baseline
// at 0), separate so the lobby bundle never ships it: the lobby draws it from a static SVG mask instead.

/** Test-card bars, left to right. */
export const BARS = ['#e6dfcd', '#f2c230', '#19d3c5', '#23c06b', '#ff2e93', '#d8402b', '#2c4bb0'] as const;
/** Behind the bars, so the bone bar never merges with a light set. */
export const SCREEN_SURROUND = '#121214';

export const MARK = {
  width: 48,
  height: 44,
  /** Antennae: a stroked polyline. */
  antenna: { d: 'M15.5 2.5 24 10.5 32.5 2.5', width: 3.4 },
  /** The set. */
  body: { x: 0.3, y: 9.8, w: 47.4, h: 33.9, r: 9.5 },
  surround: { x: 4.4, y: 13.9, w: 39.2, h: 25.7, r: 5.4 },
  screen: { x: 5.6, y: 15.1, w: 36.8, h: 23.3, r: 4.4 },
} as const;

export const WORD = {
  /** Advance width and cap height, in font units. */
  advance: 5498,
  cap: 660,
  /** Lockup placement: cap height 27 units, baseline at y = 40, starting 60 units from the left. */
  x: 60,
  baseline: 40,
  scale: 27 / 660,
} as const;

/** Full lockup box (mark + wordmark, including the g's descender). The mark sits 2 units down. */
export const LOCKUP = {
  width: Math.ceil(WORD.x + WORD.advance * WORD.scale + 1),
  height: 52,
  markY: 2,
} as const;
