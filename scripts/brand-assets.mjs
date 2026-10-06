// Regenerate every brand file from src/client/lib/brand.ts (the single source of truth):
//   src/client/assets/brand/wordmark.svg   the wordmark alone, in the lockup's 286x52 box (CSS mask in <Logo>)
//   public/favicon.svg                     the mark on a charcoal tile
//   public/icons/*.png                     apple-touch-icon (180), PWA icons (192, 512, 512 maskable)
//   public/og.png                          1200x630 link-preview image
// Usage: node scripts/brand-assets.mjs   (needs Playwright's Chromium: npx playwright install chromium)
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { BARS, LOCKUP, MARK, SCREEN_SURROUND, WORD } from '../src/client/lib/brand.ts';
import { WORD_PATH } from '../src/client/lib/brand-word.ts';

const CHARCOAL = '#121214';
const BONE = '#f1efe9';
/** @param {number} n */
const r = (n) => Math.round(n * 1000) / 1000;

/** @param {string} colour @param {string} id */
function markGroup(colour, id) {
  const bw = MARK.screen.w / BARS.length;
  const s = MARK.screen;
  /** @param {{ x: number; y: number; w: number; h: number; r: number }} b @param {string} fill */
  const box = (b, fill) =>
    `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.r}" fill="${fill}"/>`;
  return (
    `<clipPath id="${id}">${box(s, '#000')}</clipPath>` +
    `<path d="${MARK.antenna.d}" fill="none" stroke="${colour}" stroke-width="${MARK.antenna.width}" stroke-linecap="round" stroke-linejoin="round"/>` +
    box(MARK.body, colour) +
    box(MARK.surround, SCREEN_SURROUND) +
    `<g clip-path="url(#${id})">` +
    BARS.map(
      (c, i) =>
        `<rect x="${r(s.x + i * bw)}" y="${s.y}" width="${r(bw + 0.05)}" height="${s.h}" fill="${c}"/>`,
    ).join('') +
    '</g>'
  );
}

/** @param {string} fill */
const wordPath = (fill) =>
  `<path d="${WORD_PATH}" fill="${fill}" transform="translate(${WORD.x} ${WORD.baseline}) scale(${r(WORD.scale)})"/>`;

// 1. Wordmark in the lockup box (black: only its alpha is used, as a mask).
writeFileSync(
  'src/client/assets/brand/wordmark.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOCKUP.width} ${LOCKUP.height}">${wordPath('#000')}</svg>\n`,
);

// 2. Favicon: the mark centred on a rounded charcoal tile.
/** @param {number} pad @param {number} radius */
const tile = (pad, radius) => {
  const size = MARK.width + pad * 2;
  const dy = (size - MARK.height) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${CHARCOAL}"/><g transform="translate(${pad} ${r(dy)})">${markGroup(BONE, 's')}</g></svg>`;
};
writeFileSync('public/favicon.svg', tile(5, 12) + '\n');

// 3. PNG icons and the link-preview image, rendered in Chromium.
/** @param {string} colour */
const lockupSvg = (colour) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOCKUP.width} ${LOCKUP.height}"><g transform="translate(0 ${LOCKUP.markY})">${markGroup(colour, 'l')}</g>${wordPath(colour)}</svg>`;
const og = `<div style="width:1200px;height:630px;background:${CHARCOAL};display:flex;flex-direction:column;justify-content:center;padding:0 110px;box-sizing:border-box;gap:56px">
  <div style="width:860px">${lockupSvg(BONE)}</div>
  <div style="display:flex;height:22px;width:860px;border-radius:3px;overflow:hidden">${BARS.map((c) => `<span style="flex:1;background:${c}"></span>`).join('')}</div>
  <p style="margin:0;font:600 40px/1.25 system-ui,-apple-system,sans-serif;color:#aaa69e;max-width:900px">Live bingo and chat rooms for UK telly. Open a room when your show airs.</p>
</div>`;

const browser = await chromium.launch();
/** @param {string} html @param {number} w @param {number} h @param {string} path */
const shot = async (html, w, h, path) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(`<body style="margin:0">${html}</body>`);
  await page.screenshot({ path, omitBackground: false });
  await page.close();
};
/** @param {string} svg @param {number} px */
const icon = (svg, px) =>
  `<div style="width:${px}px;height:${px}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>`;
await shot(icon(tile(5, 0), 180), 180, 180, 'public/icons/apple-touch-icon.png'); // iOS rounds the corners itself
await shot(icon(tile(5, 12), 192), 192, 192, 'public/icons/icon-192.png');
await shot(icon(tile(5, 12), 512), 512, 512, 'public/icons/icon-512.png');
await shot(icon(tile(16, 0), 512), 512, 512, 'public/icons/icon-maskable-512.png'); // safe zone for masks
await shot(og, 1200, 630, 'public/og.png');
await browser.close();
console.log('brand assets written');
