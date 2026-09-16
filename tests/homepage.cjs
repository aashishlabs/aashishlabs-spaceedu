const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
fs.mkdirSync('test-results', { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const [width, height] of [[1440,900],[1024,768],[768,1024],[430,932],[375,812],[375,667],[844,390]]) {
      await page.setViewportSize({ width, height });
      await page.goto('http://127.0.0.1:4173');
      await page.waitForSelector('.has-3d');
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => {
        const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
        return {
          width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth,
          bodyFont: parseFloat(getComputedStyle(document.querySelector('.lede')).fontSize),
          stage: box('.stage'), nav: box('.navbar'), title: box('.title'), lede: box('.lede'),
          cta: box('.cta>a'), left: box('.planet-l'), right: box('.planet-r'),
          bytes: performance.getEntriesByType('resource').reduce((sum, resource) => sum + resource.transferSize, 0),
        };
      });
      assert.equal(metrics.overflow, false, 'no horizontal overflow');
      assert.ok(metrics.bodyFont >= 16, 'supporting copy stays readable');
      assert.ok(metrics.title.top > metrics.nav.bottom, 'title clears navigation');
      assert.ok(metrics.lede.top > metrics.title.bottom, 'description clears title');
      assert.ok(metrics.cta.top >= metrics.lede.bottom, 'CTA clears description');
      const overlaps = (a,b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      for (const key of ['cta','left','right']) {
        const rect = metrics[key];
        assert.ok(rect.width >= 44 && rect.height >= 44, 'tappable ' + key);
        assert.ok(rect.left >= 0 && rect.right <= width && rect.bottom < metrics.stage.bottom, 'fully visible ' + key);
      }
      assert.ok(!overlaps(metrics.cta,metrics.left) && !overlaps(metrics.cta,metrics.right) && !overlaps(metrics.left,metrics.right), 'controls have independent space');
      assert.equal(await page.locator('.scroll').isVisible(), true, 'scroll cue leads to the solar system');
      if (width <= 900) {
        await page.getByRole('button', { name: 'Open navigation' }).click();
        const menu = await page.locator('.links').boundingBox();
        assert.ok(menu.x >= 0 && menu.x + menu.width <= width && menu.y + menu.height <= height, 'menu fits viewport');
        await page.keyboard.press('Escape');
      }
      await page.screenshot({ path: `test-results/homepage-${width}-${height}.png`, fullPage: true });
      console.log(JSON.stringify({ viewport: `${width}x${height}`, heroHeight: metrics.stage.height, bodyFont: metrics.bodyFont, initialMB: +(metrics.bytes / 1e6).toFixed(2) }));
    }
    // Verify the real section now fulfills the hero's scroll contract.
    await page.locator('.scroll').waitFor({ state: 'visible' });
    await page.locator('.scroll').click();
    await page.waitForFunction(() => document.activeElement.id === 'solar-system' && Math.abs(document.querySelector('#solar-system').getBoundingClientRect().top) < 2);
    assert.deepEqual(errors, [], 'no runtime or console errors');
    console.log('PASS responsive layout, readable text, controls, menus, assets and solar-system scroll target');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
