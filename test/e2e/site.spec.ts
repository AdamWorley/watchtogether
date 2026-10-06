import { expect, test } from './fixtures';

test('home lists both shows and navigates to a themed show page', async ({ page, problems }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('The telly’s on');
  await page.getByRole('link', { name: /^The Traitors/ }).click();
  await expect(page).toHaveURL(/\/traitors$/);
  await expect(page.locator('html')).toHaveAttribute('data-world', 'traitors');
  await expect(page).toHaveTitle(/The Traitors/);
  expect(problems).toEqual([]);
});

test('privacy page and unknown routes render', async ({ page }) => {
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await page.goto('/no/such/page');
  await expect(page.getByRole('heading', { name: 'Nothing on this channel' })).toBeVisible();
});

test('security and cache headers', async ({ request, page }) => {
  const html = await request.get('/');
  const headers = html.headers();
  const csp = headers['content-security-policy'] ?? '';
  for (const directive of [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "require-trusted-types-for 'script'",
  ]) {
    expect(csp).toContain(directive);
  }
  expect(csp).not.toContain('unsafe-inline');
  expect(csp).not.toContain('unsafe-eval');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');
  expect(headers['strict-transport-security']).toContain('max-age=');
  expect(headers['cache-control']).toContain('must-revalidate');

  await page.goto('/');
  const script = await page.locator('script[type="module"]').first().getAttribute('src');
  expect(script).toMatch(/^\/assets\/.+\.js$/);
  const asset = await request.get(script!);
  expect(asset.headers()['cache-control']).toBe('public, max-age=31536000, immutable');

  const api = await request.get('/api/schedule/traitors');
  expect(api.headers()['cache-control']).toContain('s-maxage');
});

test('no inline scripts or styles in the HTML shell', async ({ request }) => {
  const body = await (await request.get('/')).text();
  expect(body).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/i);
  expect(body).not.toMatch(/<style/i);
  expect(body).not.toMatch(/\sstyle=/i);
});

// A display face that silently falls back (e.g. a font file missing basic Latin) still reports as
// "loaded". Measuring real glyph widths against a deliberately missing font catches it.
const WORLD_FACES: [string, string][] = [
  ['/traitors', 'IM Fell English SC'],
  ['/strictly', 'Limelight'],
  ['/im-a-celeb', 'Rye'],
  ['/bake-off', 'Leckerli One'],
  ['/dancing-on-ice', 'Righteous'],
];

for (const [path, family] of WORLD_FACES) {
  test(`${family} paints real glyphs on ${path}`, async ({ page }) => {
    await page.goto(path);
    const result = await page.evaluate(async (f) => {
      await document.fonts.load(`40px "${f}"`, 'Abc 123');
      const ctx = document.createElement('canvas').getContext('2d')!;
      const width = (font: string) => {
        ctx.font = font;
        return ctx.measureText('The quick brown fox 0123456789').width;
      };
      return { real: width(`40px "${f}", monospace`), fallback: width('40px "no-such-font", monospace') };
    }, family);
    expect(result.real).not.toBeCloseTo(result.fallback, 0);
  });
}

test('every page has one-tap navigation back to the lobby', async ({ page }) => {
  for (const path of ['/traitors', '/strictly/print', '/privacy', '/traitors/room#ZZZZZ-ZZZZZ']) {
    await page.goto(path);
    await page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'WatchTogether' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The telly’s on');
  }
  // The lobby carries the brand too, marked as the current page.
  await expect(
    page.getByRole('navigation', { name: 'Site' }).getByRole('link', { name: 'WatchTogether' }),
  ).toHaveAttribute('aria-current', 'page');
});
