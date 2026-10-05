import { expect, test } from './fixtures';

test('prints unique offline bingo cards for a show', async ({ page, problems }) => {
  await page.goto('/traitors');
  await page.getByRole('link', { name: 'Print cards for offline play' }).click();
  await expect(page).toHaveURL(/\/traitors\/print$/);

  const sheets = page.getByRole('article');
  await expect(sheets).toHaveCount(4);
  await page.getByLabel('Cards', { exact: true }).selectOption('6');
  await expect(sheets).toHaveCount(6);

  // Every card is different, and each has 25 squares with FREE in the centre.
  const cards = await sheets.evaluateAll((els) =>
    els.map((el) => [...el.querySelectorAll('.square')].map((s) => s.textContent?.trim() ?? '')),
  );
  expect(new Set(cards.map((c) => [...c].sort().join('|'))).size).toBe(6);
  for (const card of cards) {
    expect(card).toHaveLength(25);
    expect(card[12]).toContain('FREE');
  }

  // Print media: controls hidden, white page.
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('button', { name: 'Print' })).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(255, 255, 255)',
  );
  expect(problems).toEqual([]);
});
