const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
fs.mkdirSync('test-results', { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    for (const [width,height] of [[1440,900],[1024,768],[768,1024],[430,932],[375,812],[844,390]]) {
      await page.setViewportSize({width,height});
      await page.goto('http://127.0.0.1:4173');
      await page.waitForSelector('.has-3d');
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.scroll').click();
      await page.waitForFunction(() => document.activeElement.id === 'solar-system' && Math.abs(document.querySelector('#solar-system').getBoundingClientRect().top) < 2);
      assert.equal(await page.locator('.solar-world').count(),8);
      assert.deepEqual(await page.locator('.solar-world h3').allTextContents(),['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
      if (width <= 700) {
        for (let i=1;i<8;i++) {
          await page.locator('.solar-next').click();
          await page.waitForFunction(i => document.querySelector('.solar-position').textContent.startsWith(String(i+1).padStart(2,'0')), i);
        }
        assert.equal(await page.locator('.solar-next').isDisabled(),true);
        await page.locator('.solar-world').last().locator('summary').click();
        assert.equal(await page.locator('.solar-world').last().locator('details').getAttribute('open'),'');
        await page.locator('.solar-world').last().locator('summary').click();
        await page.locator('.solar-gallery').evaluate(el => el.scrollLeft=0);
        await page.waitForFunction(() => document.querySelector('.solar-position').textContent.startsWith('01'));
      }
      await page.locator('.solar-world').first().locator('summary').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.solar-world').first().locator('details').getAttribute('open'),'');
      await page.keyboard.press('Enter');
      await page.locator('#solar-system').focus();
      await page.locator('#solar-system').evaluate(el => el.scrollIntoView());
      await page.waitForFunction(() => [...document.querySelectorAll('.solar-portrait img')].filter(el => el.getBoundingClientRect().left < innerWidth && el.getBoundingClientRect().right > 0 && el.getBoundingClientRect().top < innerHeight).every(el=>el.complete&&el.naturalWidth>0));
      if(width===1440) await page.locator('#solar-system').screenshot({path:'test-results/explore-desktop.png'});
      if(width===375||width===430) await page.screenshot({path:`test-results/explore-${width}.png`});
      console.log(`PASS section ${width}x${height}`);
    }
    await page.setViewportSize({width:1440,height:900});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto('http://127.0.0.1:4173');
    await page.waitForSelector('.has-3d');
    await page.waitForTimeout(2400);
    // Only stop selector bobbing so Playwright can perform real, stable clicks.
    await page.addStyleTag({content:'.planet{animation:none!important}'});
    for(const planet of ['MARS','VENUS','EARTH']) {
      await page.getByRole('button',{name:'Show '+planet,exact:true}).click();
      await page.waitForFunction(p => document.querySelector('.copy').dataset.planet===p && document.querySelector('.stage').dataset.switching==='false',planet.toLowerCase());
      assert.equal(await page.locator('.title .ent-line').textContent(),planet);
    }
    await page.getByRole('button',{name:'Pause rotation',exact:true}).click();
    const canvas=page.locator('.planet-renderer canvas');
    const before=await canvas.screenshot();
    await page.mouse.move(950,450);await page.mouse.down();await page.mouse.move(1120,500,{steps:12});await page.mouse.up();
    const after=await canvas.screenshot();
    assert.equal(before.equals(after),false,'drag changes the rendered planet');
    const touch=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    touch.on('pageerror',e=>errors.push(e.message));
    await touch.goto('http://127.0.0.1:4173');
    await touch.locator('.scroll').tap();
    const rail=await touch.locator('.solar-gallery').boundingBox();
    const client=await touch.context().newCDPSession(touch);
    const y=Math.min(rail.y+150,700);
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:310,y}]});
    for(let x=290;x>=60;x-=23) await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touch.waitForFunction(()=>document.querySelector('.solar-gallery').scrollLeft>100);
    assert.equal(await touch.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[],'no console/runtime errors');
    console.log('PASS hero Earth → Mars → Venus → Earth, mouse drag, mobile swipe, keyboard notes, console');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
