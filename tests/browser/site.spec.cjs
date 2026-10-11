const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { PAGES } = require('../../site/build');
const galleryPath = PAGES.find(page => page[0] === 'gallery.html')[1];
const contactPath = PAGES.find(page => page[0] === 'contact.html')[1];

test.beforeEach(async ({ page }) => {
  // Keep checks local: third-party fonts and embeds are outside this site's contracts.
  await page.route(url => url.hostname !== '127.0.0.1', route => route.fulfill({ status: 200, body: '' }));
});

for (const width of [390, 1280]) {
  test(`pages, local navigation and accessibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [, filename] of PAGES) {
      const response = await page.goto('/' + filename);
      expect(response.status()).toBe(200);
      await expect(page.locator('.site-header nav a')).toHaveCount(6);
      await page.locator('.site-header nav a').first().click();
      await expect(page).toHaveURL(new RegExp(PAGES[0][1].replace('.', '\\.')));
      await page.goto('/' + filename);
      const brokenImages = await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach(image => { image.loading = 'eager'; });
        await Promise.all(images.map(image => image.decode().catch(() => {})));
        return images.filter(image => !image.naturalWidth).map(image => image.src);
      });
      expect(brokenImages).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const report = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(report.violations).toEqual([]);
    }
    expect(errors).toEqual([]);
    for (const filename of [PAGES[0][1], galleryPath, contactPath]) {
      await page.goto('/' + filename);
      await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach(image => { image.loading = 'eager'; });
        await Promise.all(images.map(image => image.decode().catch(() => {})));
      });
      await page.screenshot({ path: `test-results/${filename}-${width}.png`, fullPage: true });
    }
  });
}

test('keyboard lightbox opens, cycles, contains focus, and restores it', async ({ page }) => {
  await page.goto('/' + galleryPath);
  const first = page.locator('.gallery-image').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#imageModal')).toBeVisible();
  await expect(page.locator('#modalClose')).toBeFocused();
  const initial = await page.locator('#modalImg').getAttribute('src');
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('#modalImg').getAttribute('src')).not.toBe(initial);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#modalImg')).toHaveAttribute('src', initial);
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('#imageModal') || document.activeElement === document.body)).toBe(true);
  }
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#imageModal')).not.toBeVisible();
  await expect(first).toBeFocused();
  await first.click();
  await page.locator('#modalClose').click();
  await expect(first).toBeFocused();
});

test('commission brief creates a reviewable email without sending', async ({ page }) => {
  await page.goto('/' + contactPath);
  await page.locator('#briefIdea').fill('A portrait & reference: https://example.com/reference');
  await page.locator('#briefBudget').fill('$100');
  await page.locator('#briefDeadline').fill('Flexible');
  await page.locator('#commissionBrief button').click();
  await expect(page.locator('#briefPreview')).toBeFocused();
  await expect(page.locator('#briefPreview')).toHaveValue(/A portrait & reference/);
  const draft = new URL(await page.locator('#briefEmail').getAttribute('href'));
  expect(draft.protocol).toBe('mailto:');
  expect(draft.searchParams.get('body')).toContain('$100');
  expect(draft.searchParams.get('body')).toContain('Flexible');
});

test('featured artwork and gallery category shortcuts survive keyboard navigation', async ({ page }) => {
  await page.goto('/' + PAGES[0][1]);
  await expect(page.locator('.hero-art img')).toBeVisible();
  await expect(page.locator('.site-header [aria-current="page"]')).toHaveAttribute('href', PAGES[0][1]);
  await page.goto('/' + galleryPath);
  const shortcut = page.locator('.category-nav a[href="#gallery-fursuits"]');
  await shortcut.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#gallery-fursuits$/);
  await expect(shortcut).toHaveAttribute('aria-current', 'location');
  await page.goBack();
  await expect(page.locator('.category-nav a').first()).toHaveAttribute('aria-current', 'location');
});
