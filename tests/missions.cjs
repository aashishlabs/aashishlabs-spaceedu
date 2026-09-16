const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
  for(const [width,height] of [[1440,900],[768,1024],[430,932],[375,812]]){
   await page.setViewportSize({width,height});
   await page.goto('http://127.0.0.1:4173');
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('#historic-missions').scrollIntoViewIfNeeded();
   assert.deepEqual(await page.locator('.missions-year').allTextContents(),['1969','1977','2012','2023']);
   assert.deepEqual(await page.locator('.missions-story h3').allTextContents(),['Apollo 11','Voyager 1','Curiosity','Chandrayaan-3']);
   const metrics=await page.evaluate(()=>{
    const box=el=>el.getBoundingClientRect().toJSON();
    return {overflow:document.documentElement.scrollWidth>innerWidth,stops:[...document.querySelectorAll('.missions-stop')].map(el=>({row:box(el),year:box(el.querySelector('time')),story:box(el.querySelector('.missions-story')),font:parseFloat(getComputedStyle(el.querySelector('.missions-description')).fontSize),animation:getComputedStyle(el.querySelector('.missions-story')).animationName}))};
   });
   assert.equal(metrics.overflow,false);
   for(const [i,s] of metrics.stops.entries()){
    assert.ok(s.font>=16);assert.equal(s.animation,'none');
    assert.ok(s.story.top>=s.year.bottom&&s.story.left>=0&&s.story.right<=width);
    assert.ok(s.story.bottom<=s.row.bottom+1);
    if(i&&width<=700)assert.ok(s.row.top>=metrics.stops[i-1].row.bottom);
    if(i&&width>700)assert.ok(s.row.left>=metrics.stops[i-1].row.right-1);
   }
   if(width!==768)await page.locator('#historic-missions').screenshot({path:`test-results/missions-${width}.png`});
   console.log(`PASS missions ${width}x${height}`);
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('http://127.0.0.1:4173');
  for(const selector of ['.why-space-story','.missions-stop']){
   await page.locator(selector).first().scrollIntoViewIfNeeded();
   await page.waitForFunction(s=>document.querySelector(s).classList.contains('is-revealing'),selector);
   await page.waitForFunction(s=>!document.querySelector(s).classList.contains('is-revealing'),selector);
  }
  const noJS=await browser.newPage({javaScriptEnabled:false});
  await noJS.goto('http://127.0.0.1:4173');
  assert.equal(await noJS.locator('.missions-story').last().evaluate(el=>getComputedStyle(el).opacity),'1');
  assert.deepEqual(errors,[]);
  console.log('PASS mission and Why Explore Space reveals, reduced motion, no-JS content, no console/runtime errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
