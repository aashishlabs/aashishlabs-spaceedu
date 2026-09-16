const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const base = 'http://127.0.0.1:4173';
fs.mkdirSync('test-results', { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  async function page(options = {}, setup, liveAnimations = false) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    if (setup) await setup(p);
    await p.goto(base);
    await p.evaluate(() => document.fonts.ready);
    if (!liveAnimations) await p.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}.anim .ent-line,.anim .rule span,.anim .navbar::after{transform:none!important}.anim .logo,.anim .links a,.anim .burger,.anim p.lede,.anim .label,.anim .cta>a,.anim .scroll,.anim .sky{opacity:1!important}' });
    return p;
  }
  async function ready(p) { await p.waitForSelector('.has-3d canvas'); await p.waitForFunction(() => !document.documentElement.classList.contains('anim')); }
  async function shot(p) { return hash(await p.locator('canvas').screenshot()); }
  async function world(p, name) {
    await p.getByRole('button', { name: 'Show ' + name.toUpperCase(), exact: true }).click();
    await p.waitForSelector('canvas[data-planet="' + name + '"][aria-busy="false"]');
    await p.waitForTimeout(800);
    assert.equal(await p.locator('h1').innerText(), name.toUpperCase());
    assert.equal(await p.locator('.stage').evaluate(e => e.scrollLeft), 0, 'side-planet focus must not shift the composition');
  }
  try {
    const p = await page();
    await ready(p);
    const first = await shot(p); await p.waitForTimeout(250);
    assert.notEqual(await shot(p), first, 'automatic rotation changes the rendered planet');
    await p.getByRole('button', { name: 'Pause rotation' }).click();
    await p.waitForTimeout(100);
    const paused = await shot(p); await p.waitForTimeout(200);
    assert.equal(await shot(p), paused, 'pause stops rendering changes');
    await p.mouse.move(720, 760); await p.mouse.down(); await p.mouse.move(870, 800, { steps: 12 }); await p.mouse.up();
    assert.notEqual(await shot(p), paused, 'mouse drag rotates');
    const dragged = await shot(p);
    await p.locator('canvas').focus(); await p.keyboard.press('ArrowLeft');
    assert.notEqual(await shot(p), dragged, 'keyboard rotates');
    const surfaceClip = { x: 400, y: 650, width: 600, height: 150 };
    const earthSurface = hash(await p.screenshot({ clip: surfaceClip }));
    // Check identity on every animation frame, including the hidden commit frame.
    await p.evaluate(() => {
      window.syncErrors = [];
      const check = () => {
        const canvas = document.querySelector('canvas');
        const world = document.querySelector('.copy').dataset.planet;
        if (canvas && (canvas.dataset.planet !== world || document.querySelector('h1').innerText.toLowerCase() !== world || document.querySelector('.cta>a').dataset.planet !== world)) window.syncErrors.push(world);
        const others = ['earth','venus','mars'].filter(x => x !== world);
        if ([...document.querySelectorAll('.planet')].some((b,i) => b.dataset.planet !== others[i]) || [...document.querySelectorAll('.label')].some((b,i) => b.textContent.toLowerCase() !== others[i])) window.syncErrors.push('labels');
        requestAnimationFrame(check);
      }; requestAnimationFrame(check);
    });
    const textureRequests = [];
    p.on('request', request => { if (request.url().includes('/textures/')) textureRequests.push(request.url()); });
    // A slow first texture must leave the current hero intact until ready.
    await p.route('**/textures/mars.jpg', async route => { await new Promise(resolve => setTimeout(resolve, 400)); await route.continue(); });
    await p.getByRole('button', { name: 'Show MARS', exact: true }).click();
    await p.waitForTimeout(150);
    assert.equal(await p.locator('h1').innerText(), 'EARTH');
    assert.equal(await p.locator('canvas').getAttribute('data-planet'), 'earth');
    await p.waitForSelector('canvas[data-planet="mars"][aria-busy="false"]');
    await p.screenshot({ path: 'test-results/mars.png' });
    await world(p, 'venus'); await p.screenshot({ path: 'test-results/venus.png' });
    await world(p, 'earth'); await p.locator('canvas').blur();
    assert.equal(hash(await p.screenshot({ clip: surfaceClip })), earthSurface, 'returning Earth preserves its appearance and orientation');
    await p.screenshot({ path: 'test-results/desktop.png' });
    // The first click owns the transition; subsequent clicks cannot overlap it.
    await p.getByRole('button', { name: 'Show VENUS', exact: true }).click();
    await p.evaluate(() => { for(let i=0;i<12;i++) document.querySelectorAll('.planet')[i%2].click(); });
    // Resize while the outgoing/incoming pose is animated.
    await p.setViewportSize({ width: 1200, height: 800 });
    await p.waitForSelector('canvas[data-planet="venus"][aria-busy="false"]');
    assert.equal(await p.locator('h1').innerText(), 'VENUS');
    await p.setViewportSize({ width: 1440, height: 1000 });
    await world(p, 'earth');
    assert.equal(hash(await p.screenshot({ clip: surfaceClip })), earthSurface, 'resize cannot reveal cached inactive planets');
    assert.deepEqual(await p.evaluate(() => window.syncErrors), [], 'planet, title, labels and CTA stay synchronized on every frame');
    assert.equal(textureRequests.length, new Set(textureRequests).size, 'return visits reuse loaded maps');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.waitForTimeout(100);
    assert.equal(await p.locator('.rotation-toggle').isDisabled(), true);
    const reduced = await shot(p); await p.waitForTimeout(150); assert.equal(await shot(p), reduced);
    console.log('PASS desktop: rendering, rotation, pause, mouse, keyboard, all worlds, rapid switching, live reduced-motion');

    const mobile = await page({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    await ready(mobile);
    const staticPlanet = await shot(mobile); await mobile.waitForTimeout(150); assert.equal(await shot(mobile), staticPlanet);
    const cdp = await mobile.context().newCDPSession(mobile);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 100, y: 650 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 220, y: 650 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.notEqual(await shot(mobile), staticPlanet, 'touch rotates in reduced-motion mode');
    await world(mobile, 'mars'); await world(mobile, 'earth');
    await mobile.screenshot({ path: 'test-results/mobile.png' });
    for (const viewport of [{ width: 320, height: 568 }, { width: 844, height: 390 }]) {
      await mobile.setViewportSize(viewport);
      await mobile.waitForTimeout(100);
      const box = await mobile.locator('canvas').boundingBox();
      const stage = await mobile.locator('.stage').boundingBox();
      assert.equal(box.width, viewport.width); assert.equal(box.height, stage.height);
      assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await mobile.screenshot({ path: `test-results/mobile-${viewport.width}.png` });
    }
    console.log('PASS mobile: touch, reduced-motion initial load, switching, 390/320/landscape rendering');

    const fallback = await page({}, async p => p.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : original.call(this, type, ...args); };
    }));
    await fallback.waitForTimeout(300);
    assert.equal(await fallback.locator('canvas').count(), 0);
    await fallback.getByRole('button', { name: 'Show MARS', exact: true }).click();
    assert.equal(await fallback.locator('h1').innerText(), 'MARS');
    assert.match(await fallback.locator('.sky').evaluate(e => e.style.backgroundImage), /mars-fallback/);
    await fallback.screenshot({ path: 'test-results/fallback.png' });
    // Lose a real context after the user has switched worlds.
    await p.locator('canvas').evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await p.waitForSelector('.stage:not(.has-3d)');
    assert.equal(await p.locator('canvas').count(), 0);
    await p.getByRole('button', { name: 'Show VENUS', exact: true }).click();
    assert.equal(await p.locator('h1').innerText(), 'VENUS');
    console.log('PASS fallback: WebGL unavailable, real context loss, continued world selection');

    const missing = await page({}, p => p.route('**/textures/mars.jpg', route => route.abort()));
    await ready(missing);
    await missing.getByRole('button', { name: 'Show MARS', exact: true }).click();
    await missing.waitForSelector('.stage:not(.has-3d)');
    assert.equal(await missing.locator('h1').innerText(), 'MARS');
    console.log('PASS failed texture load: selected-world fallback');
    const live = await page({}, undefined, true);
    await ready(live);
    for (const name of ['mars', 'venus', 'earth']) {
      const button = live.getByRole('button', { name: 'Show ' + name.toUpperCase(), exact: true });
      const box = await button.boundingBox();
      // The side buttons float continuously: click their visible portion directly.
      await live.mouse.click(Math.max(12, Math.min(1428, box.x + box.width / 2)), box.y + box.height / 2);
      await live.waitForSelector('canvas[data-planet="' + name + '"][aria-busy="false"]');
      await live.waitForTimeout(250);
      await live.screenshot({ path: 'test-results/' + name + '-live.png' });
    }
    console.log('PASS live CSS animations: coordinate clicks through Earth → Mars → Venus → Earth');
    const unexpected = errors.filter(e => !/Error creating WebGL context|net::ERR_FAILED/.test(e));
    assert.deepEqual(unexpected, [], 'no unexpected browser or shader errors');
    console.log('All hero checks passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
