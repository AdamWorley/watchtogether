import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

// Every bingo square, rendered in a real phone-width tile, must never split a word without a hyphen.
// Allowed: breaks at soft hyphens, at real hyphens, and auto-hyphenation of long (9+ letter) lowercase words.
// Chrome never auto-hyphenates capitalised words, so those must fit whole.
// Each pool is checked inside its own world's tile (the page's data-world is switched per world).
const WORLD_POOLS: Record<string, string[]> = {
  traitors: ['celebrity-traitors', 'traitors'],
  strictly: ['strictly'],
  jungle: ['im-a-celeb'],
  bakeoff: ['bake-off'],
  ice: ['dancing-on-ice'],
};

/** Parse a TS string literal (single- or double-quoted) without eval. */
function literal(src: string): string {
  const quote = src[0];
  const body = src.slice(1, -1);
  const json = quote === "'" ? body.replace(/\\'/g, "'").replace(/"/g, '\\"') : body;
  return JSON.parse(`"${json}"`) as string;
}

function pool(name: string): string[] {
  const src = readFileSync(`src/shared/content/${name}.ts`, 'utf8');
  return [...src.matchAll(/^\s*((["'])(?:\\.|(?!\2).)*\2),$/gm)].map((m) => literal(m[1]!));
}

// 375px: the narrowest common phone (iPhone SE / mini), in Chromium.
test.use({ viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

test('captions stay inside the frame and never split a word without a hyphen (375px, every pool in its own world)', async ({
  page,
}) => {
  await page.goto('/traitors');
  await page.getByLabel('Your name').fill('Probe');
  await page.getByRole('button', { name: 'Start a room' }).click();
  await page.getByRole('group', { name: 'Your bingo card' }).waitFor();

  const failures: string[] = [];
  for (const [world, pools] of Object.entries(WORLD_POOLS)) {
    const squares = pools.flatMap(pool);
    const bad = await page.evaluate(
      async ({ world, list }) => {
        document.documentElement.dataset.world = world;
        await document.fonts.ready;
        const txt = document.querySelector('.spread button.cell .txt')!;
        const out: string[] = [];
        const cell = txt.closest('.cell')!;
        for (const sq of list) {
          txt.textContent = sq;
          await Promise.resolve(); // let the fit action (a MutationObserver) step the type down if needed
          const node = txt.firstChild!;
          // The caption must sit inside the frame: the tile's content box (padding = frame clearance).
          const c = getComputedStyle(cell);
          const box = cell.getBoundingClientRect();
          const left = box.left + cell.clientLeft + parseFloat(c.paddingLeft) - 0.5;
          const right = box.left + cell.clientLeft + cell.clientWidth - parseFloat(c.paddingRight) + 0.5;
          const all = document.createRange();
          all.selectNodeContents(txt);
          for (const rect of all.getClientRects()) {
            if (rect.width > 0 && (rect.left < left || rect.right > right)) {
              out.push(`${world}: crosses the frame in "${sq.replace(/\u00AD/g, '')}"`);
              break;
            }
          }
          for (const m of node.textContent!.matchAll(/\S+/g)) {
            const r = document.createRange();
            r.setStart(node, m.index);
            r.setEnd(node, m.index + m[0].length);
            if (new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size < 2) continue;
            const core = m[0].replace(/\u00AD/g, '').replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
            const allowed =
              m[0].includes('\u00AD') ||
              core.includes('-') ||
              (/^[a-z]/.test(core) && core.replace(/[^a-z]/gi, '').length >= 9);
            if (!allowed) out.push(`${world}: ${core} in "${sq.replace(/\u00AD/g, '')}"`);
          }
        }
        return out;
      },
      { world, list: squares },
    );
    failures.push(...bad);
  }
  expect(failures).toEqual([]);
});
