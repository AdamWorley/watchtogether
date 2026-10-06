import { test as base, expect, type Browser, type Page } from '@playwright/test';

// Must fit NAME_MAX (24) to get through the form, and still be a live payload if ever parsed as HTML.
export const XSS_NAME = '<svg onload=alert(1)>';
export const XSS_CHAT = '<script>alert(document.domain)</script><svg onload=alert(1)>';

/**
 * Every page in these tests fails on: JS dialogs (an XSS payload executing), CSP / Trusted Types
 * violations, and uncaught errors.
 */
export async function guardPage(page: Page): Promise<string[]> {
  const problems: string[] = [];
  page.on('dialog', (d) => {
    problems.push(`dialog: ${d.message()}`);
    void d.dismiss();
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Content Security Policy|Trusted Type/i.test(msg.text())) {
      problems.push(`csp: ${msg.text()}`);
    }
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`Content Security Policy violation: ${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  return problems;
}

export async function newGuardedPage(browser: Browser): Promise<{ page: Page; problems: string[] }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const problems = await guardPage(page);
  return { page, problems };
}

export const test = base.extend<{ problems: string[] }>({
  problems: async ({ page }, use) => {
    const problems = await guardPage(page);
    await use(problems);
    expect(problems, 'security/runtime problems on the page').toEqual([]);
  },
});

export { expect };

/** Start a room as host from the show page; returns the share URL. */
export async function startRoom(page: Page, show: 'traitors' | 'strictly', name: string): Promise<string> {
  await page.goto(`/${show}`);
  await expect(page.getByText('On now')).toBeVisible();
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Start a room' }).click();
  await expect(page).toHaveURL(new RegExp(`/${show}/room#[0-9A-Z]{10}$`));
  await expect(page.getByRole('group', { name: 'Your bingo card' })).toBeVisible();
  return page.url();
}

export async function joinRoom(page: Page, url: string, name: string): Promise<void> {
  await page.goto(url);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join room' }).click();
  await expect(page.getByRole('group', { name: 'Your bingo card' })).toBeVisible();
}

/** On phones the room is tabbed; on desktop all panels are visible. */
export async function openTab(page: Page, tab: 'Bingo' | 'Chat' | 'Picks' | 'People'): Promise<void> {
  const button = page.getByRole('navigation', { name: 'Room sections' }).getByRole('button', { name: tab });
  if (await button.isVisible()) await button.click();
}
