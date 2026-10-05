import { readFileSync } from 'node:fs';
import { expect, joinRoom, newGuardedPage, startRoom, test } from './fixtures';

test('telly mode shows the room leaderboard and a QR code to join', async ({ page, browser, problems }) => {
  const url = await startRoom(page, 'strictly', 'Host');
  const guest = await newGuardedPage(browser);
  await joinRoom(guest.page, url, 'Guest');
  const cells = guest.page.getByRole('group', { name: 'Your bingo card' }).getByRole('button');
  for (const i of [0, 1, 2]) await cells.nth(i).click();

  await page.getByRole('button', { name: 'Telly mode' }).click();
  const telly = page.getByRole('region', { name: 'Telly mode' });
  await expect(telly).toBeVisible();
  await expect(telly.getByRole('heading', { name: 'The leaderboard' })).toBeVisible();
  // Guest has 3 marks: the board shows counts only.
  const board = telly.getByRole('region', { name: 'The leaderboard' });
  await expect(board.getByRole('listitem').filter({ hasText: 'Guest' })).toContainText('3 squares sewn');
  await expect(telly.getByRole('img', { name: 'QR code for the invite link' })).toBeVisible();
  await telly.getByRole('button', { name: 'Leave telly mode' }).click();
  await expect(telly).toBeHidden();
  expect(problems).toEqual([]);
  expect(guest.problems).toEqual([]);
});

test('a FULL HOUSE plays the world finale for everyone', async ({ page, browser }) => {
  const url = await startRoom(page, 'traitors', 'Host');
  const guest = await newGuardedPage(browser);
  await joinRoom(guest.page, url, 'Guest');
  const cells = page.getByRole('group', { name: 'Your bingo card' }).getByRole('button');
  // A human pace: the server rate-limits floods (and the UI rolls back refused marks).
  for (let i = 0; i < 24; i++) {
    await cells.nth(i).click();
    await page.waitForTimeout(220);
  }
  await page.getByRole('button', { name: 'Call FULL HOUSE!' }).click();

  const finale = guest.page.getByRole('status').filter({ hasText: 'The reading is complete' });
  await expect(finale).toBeVisible();
  await expect(finale).toContainText('Host has turned every fate.');
  await finale.getByRole('button', { name: 'Back to the room' }).click();
  await expect(finale).toBeHidden();
  expect(guest.problems).toEqual([]);
});

test('save my card downloads a PNG keepsake drawn on the device', async ({ page }) => {
  await startRoom(page, 'traitors', 'Keeper');
  const cells = page.getByRole('group', { name: 'Your bingo card' }).getByRole('button');
  for (const i of [0, 6, 18]) await cells.nth(i).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save my card' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('watchtogether-traitors-card.png');
  const file = readFileSync(await download.path());
  expect([...file.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(file.length).toBeGreaterThan(20_000);
});
