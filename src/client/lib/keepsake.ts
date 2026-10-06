// Draw a player's finished card as a PNG keepsake, entirely on the device. Nothing is uploaded.
// The image takes the current world's tokens and display face, so it looks like the room it came from.
import { FREE, FREE_CELL } from '../../shared/bingo';
import { SHOWS, type ShowSlug } from '../../shared/shows';
import { BARS, LOCKUP, MARK, SCREEN_SURROUND, WORD } from './brand';
import { WORD_PATH } from './brand-word';
import type { RoomConnection } from './room.svelte';
import { roman } from './roman';
import { loadSquares } from './squares';
import { VOICES } from './voice';

export interface KeepsakeInput {
  show: ShowSlug;
  name: string;
  episode: string;
  card: readonly number[];
  marks: readonly number[];
  claims: readonly ('line' | 'house')[];
}

const W = 1080;
const H = 1350;

function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.replace(/\u00AD/g, '').split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= width || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Set the largest font (from `max` down) at which `text` fits in `width`. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  max: number,
  font: (px: number) => string,
) {
  let px = max;
  ctx.font = font(px);
  while (px > 12 && ctx.measureText(text).width > width) {
    px -= 2;
    ctx.font = font(px);
  }
  return px;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draw the WatchTogether lockup centred on (cx, top), `height` px tall, set and wordmark in `colour`. */
function drawLogo(ctx: CanvasRenderingContext2D, cx: number, top: number, height: number, colour: string) {
  const s = height / LOCKUP.height;
  ctx.save();
  ctx.translate(cx - (LOCKUP.width * s) / 2, top);
  ctx.scale(s, s);
  ctx.save();
  ctx.translate(0, LOCKUP.markY);
  ctx.strokeStyle = colour;
  ctx.lineWidth = MARK.antenna.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(new Path2D(MARK.antenna.d));
  const box = (b: { x: number; y: number; w: number; h: number; r: number }, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, b.r);
    ctx.fill();
  };
  box(MARK.body, colour);
  box(MARK.surround, SCREEN_SURROUND);
  ctx.beginPath();
  ctx.roundRect(MARK.screen.x, MARK.screen.y, MARK.screen.w, MARK.screen.h, MARK.screen.r);
  ctx.clip();
  const bar = MARK.screen.w / BARS.length;
  BARS.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(MARK.screen.x + i * bar, MARK.screen.y, bar + 0.05, MARK.screen.h);
  });
  ctx.restore();
  ctx.translate(WORD.x, WORD.baseline);
  ctx.scale(WORD.scale, WORD.scale);
  ctx.fillStyle = colour;
  ctx.fill(new Path2D(WORD_PATH));
  ctx.restore();
}

export async function drawKeepsake(input: KeepsakeInput): Promise<Blob> {
  const squares = await loadSquares(input.show);
  const voice = VOICES[input.show];
  const display = token('--font-display', 'Georgia, serif');
  const body = token('--font-body', 'system-ui, sans-serif');
  await Promise.all([document.fonts.load(`48px ${display}`), document.fonts.ready]);

  const bg = token('--bg', '#121214');
  const surface = token('--surface-2', '#26262b');
  const text = token('--text', '#f1efe9');
  const muted = token('--muted', '#aaa69e');
  const accent = token('--accent', '#f2c230');
  const accentText = token('--accent-text', '#121214');

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  roundRect(ctx, 36, 36, W - 72, H - 72, 18);
  ctx.stroke();

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = text;
  fitFont(ctx, SHOWS[input.show].name, W - 160, 64, (px) => `${px}px ${display}`);
  ctx.fillText(SHOWS[input.show].name, W / 2, 140);
  ctx.fillStyle = muted;
  ctx.font = `600 30px ${body}`;
  ctx.fillText(`${input.name}’s card · ${input.episode}`, W / 2, 192);

  // The card
  const marked = new Set([...input.marks, FREE_CELL]);
  const gap = 12;
  const gridWidth = 820;
  const left = (W - gridWidth) / 2;
  const size = (gridWidth - gap * 4) / 5;
  const top = 236;
  input.card.forEach((value, cell) => {
    const x = left + (cell % 5) * (size + gap);
    const y = top + Math.floor(cell / 5) * (size + gap);
    const on = marked.has(cell);
    ctx.fillStyle = on ? accent : surface;
    roundRect(ctx, x, y, size, size, 12);
    ctx.fill();
    ctx.fillStyle = on ? accentText : text;
    const label = value === FREE ? voice.free.name : (squares[value] ?? '');
    if (value === FREE) fitFont(ctx, label, size - 18, 30, (px) => `${px}px ${display}`);
    else ctx.font = `700 22px ${body}`;
    const lines = value === FREE ? [label] : wrap(ctx, label, size - 20);
    const lh = value === FREE ? 34 : 26;
    const startY = y + size / 2 - ((lines.length - 1) * lh) / 2 + 9;
    lines.forEach((l, i) => ctx.fillText(l, x + size / 2, startY + i * lh));
  });

  // Footer: tally, calls, provenance
  const count = input.marks.length;
  const tally = voice.tally.roman ? `${count ? roman(count) : '0'} of XXIV` : `${count} of 24`;
  const cardBottom = top + 5 * size + 4 * gap;
  ctx.fillStyle = accent;
  ctx.font = `72px ${display}`;
  ctx.fillText(tally, W / 2, cardBottom + 84);
  ctx.fillStyle = text;
  ctx.font = `600 32px ${body}`;
  const calls = input.claims.length
    ? input.claims.map((c) => (c === 'line' ? 'LINE' : 'FULL HOUSE')).join(' · ')
    : 'No calls this time';
  ctx.fillText(`${voice.tally.unit} · ${calls}`, W / 2, cardBottom + 128);
  // Provenance: the brand lockup, then the date.
  drawLogo(ctx, W / 2, cardBottom + 160, 44, text);
  ctx.fillStyle = muted;
  ctx.font = `500 24px ${body}`;
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    Date.now(),
  );
  ctx.fillText(`watchtogether.uk · ${date}`, W / 2, H - 56);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('could not encode image'))),
      'image/png',
    ),
  );
}

/** Share the keepsake (phones) or download it (desktop). Returns false if the user cancelled. */
export async function saveKeepsake(input: KeepsakeInput): Promise<boolean> {
  const blob = await drawKeepsake(input);
  const fileName = `watchtogether-${input.show}-card.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ files: [file], title: `${SHOWS[input.show].name} bingo card` });
      return true;
    } catch {
      return false;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}

/** Build the keepsake input from a live (or just-ended) room connection. */
export function keepsakeFrom(conn: RoomConnection, show: ShowSlug): KeepsakeInput | null {
  if (!conn.you || !conn.room || conn.card.length === 0) return null;
  const ep = conn.room.episode;
  return {
    show,
    name: conn.you.name,
    episode: ep.name || `Series ${ep.season}, episode ${ep.number ?? ''}`,
    card: conn.card,
    marks: conn.marks,
    claims: conn.claims.filter((c) => c.memberId === conn.you?.id).map((c) => c.kind),
  };
}
