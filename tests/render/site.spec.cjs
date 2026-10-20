const { test, expect } = require('@playwright/test');
const { PAGES } = require('../../site/build');

async function capture(page, testInfo, name) {
  await page.evaluate(async () => {
    const images = [...document.images];
    images.forEach(image => { image.loading = 'eager'; });
    await Promise.all(images.map(image => image.decode()));
    await document.fonts.ready;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await testInfo.attach(name, { body: await page.screenshot({ fullPage: true, animations: 'disabled', type: 'jpeg', quality: 80 }), contentType: 'image/jpeg' });
}

test.beforeEach(async ({ context, page }) => {
  await context.route(url => url.origin !== 'http://127.0.0.1:4173', route => route.abort());
  page.on('pageerror', error => { throw error; });
});

for (const [, filename] of PAGES) {
  test(`render ${filename}`, async ({ page }, testInfo) => {
    expect((await page.goto('/' + filename)).status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.site-header nav a')).toHaveCount(6);
    await capture(page, testInfo, filename);
    await page.locator('.site-header nav a').first().click();
    await expect(page).toHaveURL(/\/index\.html$/);
  });
}

test('gallery lightbox and category navigation', async ({ page }, testInfo) => {
  await page.goto('/gallery.html');
  await page.locator('.category-nav a[href="#gallery-fursuits"]').click();
  await expect(page).toHaveURL(/#gallery-fursuits$/);
  const first = page.locator('.gallery-image').first();
  await first.click();
  await expect(page.locator('#imageModal')).toBeVisible();
  const initial = await page.locator('#modalImg').getAttribute('src');
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('#modalImg').getAttribute('src')).not.toBe(initial);
  await capture(page, testInfo, 'gallery-lightbox');
  await page.keyboard.press('Escape');
  await expect(page.locator('#imageModal')).not.toBeVisible();
  await expect(first).toBeFocused();
});

test('commission brief preview without sending', async ({ page }, testInfo) => {
  await page.goto('/contact.html');
  await page.locator('#briefIdea').fill('Synthetic render test: a colorful portrait');
  await page.locator('#briefBudget').fill('$100');
  await page.locator('#briefDeadline').fill('Flexible');
  await page.locator('#commissionBrief button').click();
  await expect(page.locator('#briefPreview')).toHaveValue(/Synthetic render test/);
  const draft = new URL(await page.locator('#briefEmail').getAttribute('href'));
  expect(draft.protocol).toBe('mailto:');
  expect(draft.searchParams.get('body')).toContain('$100');
  await capture(page, testInfo, 'commission-brief-preview');
  // Never click the mailto link, external commission forms, or payment links.
});
