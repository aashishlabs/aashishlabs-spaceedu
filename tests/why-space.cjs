const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const errors=[];
 try{
  const page=await browser.newPage({reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push(e.text())});
  for(const [width,height] of [[1440,900],[1024,768],[768,1024],[430,932],[375,812]]){
   await page.setViewportSize({width,height});
   await page.goto('http://127.0.0.1:4173');
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('#why-explore-space').scrollIntoViewIfNeeded();
   const layout=await page.evaluate(()=>{
    const box=el=>el.getBoundingClientRect().toJSON();
    return {overflow:document.documentElement.scrollWidth>innerWidth,
     stories:[...document.querySelectorAll('.why-space-story')].map(el=>({row:box(el),number:box(el.querySelector('.why-space-number')),copy:box(el.querySelector('.why-space-copy')),art:box(el.querySelector('.why-space-art')),font:parseFloat(getComputedStyle(el.querySelector('p')).fontSize),animation:getComputedStyle(el).animationName}))};
   });
   assert.equal(layout.overflow,false);
   assert.equal(layout.stories.length,3);
   const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
   for(const [i,s] of layout.stories.entries()){
    assert.ok(s.font>=16);
    assert.equal(s.animation,'none');
    assert.ok(!overlaps(s.copy,s.art)&&!overlaps(s.copy,s.number)&&!overlaps(s.art,s.number),'no overlapping editorial elements');
    assert.ok(s.copy.left>=0&&s.copy.right<=width&&s.copy.bottom<=s.row.bottom);
    if(i)assert.ok(s.row.top>=layout.stories[i-1].row.bottom);
   }
   await page.locator('.why-space-art--earth img').scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('.why-space-art--earth img').naturalWidth>0);
   if([1440,430,375].includes(width))await page.locator('#why-explore-space').screenshot({path:`test-results/why-space-${width}.png`});
   console.log(`PASS Why Explore Space ${width}x${height}`);
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('http://127.0.0.1:4173');
  await page.locator('.why-space-story').first().scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.why-space-story').classList.contains('is-revealing'));
  await page.waitForFunction(()=>!document.querySelector('.why-space-story').classList.contains('is-revealing'));
  assert.equal(await page.locator('.why-space-story').first().evaluate(el=>getComputedStyle(el).opacity),'1');
  const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:375,height:812}});
  await noJS.goto('http://127.0.0.1:4173');
  assert.equal(await noJS.locator('.why-space-story').last().evaluate(el=>getComputedStyle(el).opacity),'1');
  assert.deepEqual(errors,[]);
  console.log('PASS reveal, reduced motion, no-JS content, no console/runtime errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
