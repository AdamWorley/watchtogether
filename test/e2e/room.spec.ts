import { expect, joinRoom, newGuardedPage, openTab, startRoom, test, XSS_CHAT, XSS_NAME } from './fixtures';

test('two people share a room: unique cards, chat, bingo claim', async ({ page, browser, problems }) => {
  const url = await startRoom(page, 'traitors', 'Host');
  const guest = await newGuardedPage(browser);
  await joinRoom(guest.page, url, XSS_NAME);

  // Each player has their own card.
  const hostCard = await page.getByRole('group', { name: 'Your bingo card' }).innerText();
  const guestCard = await guest.page.getByRole('group', { name: 'Your bingo card' }).innerText();
  expect(hostCard).not.toEqual(guestCard);

  // Each show speaks in its own voice.
  await openTab(page, 'Chat');
  await expect(page.getByRole('list', { name: 'Chat messages' })).toContainText(
    `${XSS_NAME} has entered the castle`,
  );

  // The host sees the guest's name exactly as typed, as text.
  await openTab(page, 'People');
  await expect(page.getByRole('list', { name: 'People in this room' })).toContainText(XSS_NAME);

  // Chat both ways, XSS payload rendered literally.
  await openTab(guest.page, 'Chat');
  await guest.page.getByRole('textbox', { name: 'Message' }).fill(XSS_CHAT);
  await guest.page.getByRole('button', { name: 'Send' }).click();
  await openTab(page, 'Chat');
  await expect(page.getByRole('list', { name: 'Chat messages' })).toContainText(XSS_CHAT);
  expect(await page.locator('main img, main svg[onload], main script').count()).toBe(0);

  // Host marks the top row and calls a line; the guest sees the claim with the evidence card.
  await openTab(page, 'Bingo');
  const cells = page.getByRole('group', { name: 'Your bingo card' }).getByRole('button');
  const callLine = page.getByRole('button', { name: 'Call LINE!' });
  await expect(callLine).toBeDisabled();
  for (let i = 0; i < 5; i++) await cells.nth(i).click();
  await expect(callLine).toBeEnabled();
  await callLine.click();
  await expect(guest.page.getByRole('status').filter({ hasText: 'called the first LINE' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'LINE called' })).toBeDisabled();

  // Marks survive a refresh (session resumes without asking for a name again).
  await page.reload();
  await expect(page.getByRole('group', { name: 'Your bingo card' })).toBeVisible();
  await expect(cells.nth(0)).toHaveAttribute('aria-pressed', 'true');

  expect(guest.problems).toEqual([]);
  expect(problems).toEqual([]);
});

test('host can rotate the code, lock the room and remove people', async ({ page, browser }) => {
  const oldUrl = await startRoom(page, 'strictly', 'Host');
  const guest = await newGuardedPage(browser);
  await joinRoom(guest.page, oldUrl, 'Guest');

  await openTab(page, 'People');
  await page.getByRole('button', { name: /New code/ }).click();
  await expect(page).not.toHaveURL(oldUrl);
  const newUrl = page.url();

  // Old link no longer works; new one does.
  const late = await newGuardedPage(browser);
  await late.page.goto(oldUrl);
  await late.page.getByLabel('Your name').fill('Late');
  await late.page.getByRole('button', { name: 'Join room' }).click();
  await expect(late.page.getByRole('alert')).toContainText('match an open room');
  await joinRoom(late.page, newUrl, 'Late');

  // Lock: nobody else gets in.
  await page.getByRole('button', { name: /Lock room/ }).click();
  await expect(page.getByRole('button', { name: /Unlock room/ })).toBeVisible();
  const locked = await newGuardedPage(browser);
  await locked.page.goto(newUrl);
  await locked.page.getByLabel('Your name').fill('Blocked');
  await locked.page.getByRole('button', { name: 'Join room' }).click();
  await expect(locked.page.getByRole('alert')).toContainText('locked');

  // Remove the guest (two-step confirm).
  const row = page.getByRole('listitem').filter({ hasText: 'Guest' });
  await row.getByRole('button', { name: 'Remove' }).click();
  await row.getByRole('button', { name: 'Confirm removal' }).click();
  await expect(guest.page.getByRole('heading', { name: 'Sent home early' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'People in this room' })).not.toContainText('Guest');
});

test('joining with a bad code shows a friendly error', async ({ page }) => {
  await page.goto('/traitors/room#ZZZZZ-ZZZZZ');
  await page.getByLabel('Your name').fill('Someone');
  await page.getByRole('button', { name: 'Join room' }).click();
  await expect(page.getByRole('alert')).toContainText('match an open room');
});

test('predictions: open tally, then the host records who went', async ({ page, browser, problems }) => {
  const url = await startRoom(page, 'traitors', 'Host');
  const guest = await newGuardedPage(browser);
  await joinRoom(guest.page, url, 'Guest');

  // The local test series has no curated cast, so the host fills in the line-up (names render as text).
  await openTab(page, 'Picks');
  for (const name of ['Ada', XSS_NAME]) {
    await page.getByLabel('Add someone to the line-up').fill(name);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }

  await openTab(guest.page, 'Picks');
  const banish = guest.page.getByRole('region', { name: 'Who will be banished?' });
  await banish.getByRole('button', { name: /^Ada/ }).click();
  await expect(banish.getByRole('button', { name: /^Ada/ })).toHaveAttribute('aria-pressed', 'true');

  // Everyone sees the tally as it happens.
  const hostBanish = page.getByRole('region', { name: 'Who will be banished?' });
  await expect(hostBanish.getByRole('button', { name: /^Ada/ })).toContainText('1');

  await hostBanish.getByRole('button', { name: 'Record result' }).click();
  await hostBanish.getByRole('button', { name: /^Ada/ }).click();
  await expect(banish).toContainText('Banished');

  await openTab(guest.page, 'Chat');
  await expect(guest.page.getByRole('list', { name: 'Chat messages' })).toContainText(
    'Ada has been banished from the castle. Guest called it.',
  );
  expect(guest.problems).toEqual([]);
  expect(problems).toEqual([]);
});
