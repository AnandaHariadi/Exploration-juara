import { expect, test } from '@playwright/test';

// Every navigable route at desktop, laptop and phone width: loads, no console
// or page errors, no horizontal page overflow, and no internal link that 404s.
const ROUTES = ['/', '/dashboard', '/projects', '/projects/new', '/projects/PRJ-NSR', '/projects/PRJ-ASL', '/monitoring', '/finance', '/change-requests', '/alerts', '/legal-ai'];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];
const SHOTS = process.env.SHOT_DIR;

test.beforeAll(async ({ request }) => {
  expect((await request.post('/api/demo/reset')).ok()).toBeTruthy();
});

for (const vp of VIEWPORTS) {
  test(`routes render cleanly at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`${page.url()} pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`${page.url()} console: ${msg.text()}`);
    });
    for (const route of ROUTES) {
      const res = await page.goto(route);
      expect(res?.status(), route).toBeLessThan(400);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(/Memuat (proyek|ringkasan|peringatan|data|permintaan|pemantauan)…/)).toHaveCount(0);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} horizontal overflow at ${vp.name}`).toBeLessThanOrEqual(1);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/${vp.name}${route.replace(/\//g, '_') || '_root'}.png`, fullPage: true });
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('no internal link leads to a 404', async ({ page, request }) => {
  const hrefs = new Set<string>();
  for (const route of ROUTES) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    for (const href of await page.locator('a[href^="/"]').evaluateAll((els) => els.map((a) => a.getAttribute('href') as string))) {
      hrefs.add(href.split('#')[0]);
    }
  }
  const broken: string[] = [];
  for (const href of hrefs) {
    const res = await request.get(href);
    if (res.status() >= 400) broken.push(`${href} → ${res.status()}`);
  }
  expect(broken, broken.join('\n')).toEqual([]);
  expect(hrefs.size).toBeGreaterThan(10);
});
