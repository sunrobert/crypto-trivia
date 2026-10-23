import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const base=process.argv[2]||'http://localhost:3051';
const output=process.argv[3]||'output/playwright/audit';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[],report=[];
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text()+' '+m.location().url)});page.on('response',r=>{if(r.status()>=500)console.log('HTTP failure',r.status(),r.url())});
  await page.goto(base+'/?test=1');await page.waitForFunction(()=>window.render_game_to_text);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
  await page.screenshot({path:output+'/desktop-home.png'});
  const local=base.includes('localhost');
  await page.locator(local?'#start-btn':'#practice-btn').click({force:true});await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='preview');
  if(local)await page.evaluate(()=>window.advanceTime(3100));else await page.waitForTimeout(3200);
  await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='answering');
  await page.waitForTimeout(450);await page.screenshot({path:output+'/desktop-answer.png'});
  await page.locator('#answer').fill('zzzzzzzzzz');await page.locator('#answer').press('Enter');await page.waitForFunction(()=>document.getElementById('answer-status').textContent.includes('zzzzzzzzzz'));
  await page.locator('#answer').fill('Dogecoim');await page.locator('#answer').press('Enter');await page.waitForFunction(()=>document.getElementById('answer-status').textContent.includes('corrects to'));assert.equal(await page.locator('#answer').inputValue(),'Dogecoin');
  await page.locator('#answer').press('Enter');await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='landed',{timeout:15000});
  await page.waitForTimeout(1000);await page.screenshot({path:output+'/desktop-landing.png'});
  const answers=['Youbit','Nervos Network','Paul Le Roux','NuBits','Etheria','Allinvain'];
  for(let i=0;i<answers.length;i++){
    await page.locator('#next-btn').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='preview');
    if(local)await page.evaluate(()=>window.advanceTime(3100));else await page.waitForTimeout(3200);
    await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='answering');
    if(i===0){await page.locator('#menu-btn').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).paused);await page.waitForTimeout(120);await page.getByRole('button',{name:'Close menu',exact:true}).click();await page.waitForFunction(()=>!JSON.parse(window.render_game_to_text()).paused);}
    if(i===5&&local){await page.locator('#answer').fill('');await page.evaluate(()=>window.advanceTime(26000));}else{await page.locator('#answer').fill(answers[i]);await page.locator('#answer').press('Enter');}
    await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='landed',{timeout:20000});
  }
  await page.locator('#next-btn').click();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='done',{timeout:20000});await page.waitForFunction(()=>!!document.querySelector('#distribution svg'));
  const state=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));assert.equal(state.results.length,7);assert.ok(state.score>=300);assert.equal(state.results[6].score,local?0:100);assert.equal(state.sound.state,'running');
  await page.screenshot({path:output+'/desktop-results.png'});await page.locator('[data-review="3"]').click();assert.ok(await page.locator('.review-expanded').nth(3).isVisible());
  await page.locator('#copy-result').click();assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes(' #'));
  // Post on X opens the composer with the result text; the image button downloads a 1200x675 card.
  await context.route(/https:\/\/x\.com\//,r=>r.fulfill({status:200,contentType:'text/plain',body:'intercepted'}));
  const popupPromise=page.waitForEvent('popup');await page.locator('#share-x').click();const popup=await popupPromise;
  const posted=new URL(popup.url());assert.equal(posted.origin+posted.pathname,'https://x.com/intent/post');const text=posted.searchParams.get('text');assert.match(text,/\/700 · [\d,]+m · /);
  // The link is this run's share page, so X previews it with the result card.
  const link=text.split('\n').at(-1);assert.match(link,/\/s\/\d+-[nmhdosx]{7}$/,link);await popup.close();
  const cardReq=page.waitForRequest(r=>/\/og\/\d+-[nmhdosx]{7}\.png$/.test(r.url()));const dl=page.waitForEvent('download');await page.locator('#share-image').click();await cardReq;const file=await dl;assert.match(file.suggestedFilename(),/^proof-of-dig-\d+\.png$/);
  const png=await sharp(await file.path()).metadata();assert.equal(png.width,1200);assert.equal(png.height,675);
  const stats=await sharp(await file.path()).stats();assert.ok(stats.channels[0].stdev>20,'card is not blank');await sharp(await file.path()).toFile(output+'/share-card.png');
  { const sp=await context.newPage();sp.on('pageerror',e=>errors.push(e.message));await sp.goto(new URL(new URL(link).pathname,base).href);await sp.waitForFunction(()=>window.render_game_to_text);
    assert.match(await sp.locator('.subline').textContent(),/a friend dug [\d,]+m/);assert.match(await sp.locator('meta[name="twitter:image"]').getAttribute('content'),/\/og\/\d+-[nmhdosx]{7}\.png$/);
    await sp.waitForTimeout(1200);if(JSON.parse(await sp.evaluate(()=>window.render_game_to_text())).phase==='done')assert.equal(await sp.locator('#hero').evaluate(e=>getComputedStyle(e).opacity),'0','title hidden behind results');
    await sp.screenshot({path:output+'/share-landing.png'});await sp.close(); }
  await page.reload();await page.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='done');assert.equal(JSON.parse(await page.evaluate(()=>window.render_game_to_text())).score,state.score);report.push({desktop:'pass',game:state});
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,colorScheme:'light'});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push(e.message));
  await mp.goto(base+'/?test=1');await mp.waitForFunction(()=>window.render_game_to_text);await mp.evaluate(()=>document.fonts.ready);await mp.waitForFunction(()=>/#\d/.test(document.getElementById('day-number').textContent));await mp.screenshot({path:output+'/mobile-home.png'});
  assert.equal(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mp.locator(local?'#start-btn':'#practice-btn').click({force:true});await mp.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='preview');if(local)await mp.evaluate(()=>window.advanceTime(3100));else await mp.waitForTimeout(3200);await mp.waitForFunction(()=>JSON.parse(window.render_game_to_text()).phase==='answering');await mp.waitForTimeout(700);await mp.screenshot({path:output+'/mobile-answer.png'});
  await mp.setViewportSize({width:390,height:480});await mp.waitForTimeout(450);await mp.screenshot({path:output+'/mobile-keyboard-height.png'});const dock=await mp.locator('#answer-form').boundingBox();assert.ok(dock.y+dock.height<=480);assert.ok(dock.y>=0);const prompt=await mp.locator('#prompt-card').boundingBox();const hud=await mp.locator('.hud').boundingBox();assert.ok(prompt.y>=hud.y+hud.height+15,'short viewport keeps prompt below the HUD');assert.ok(prompt.y+prompt.height<dock.y-15,'short viewport keeps prompt above input');
  report.push({mobile:'pass',keyboardHeight:'pass'});
  await writeFile(output+'/report.json',JSON.stringify({report,errors},null,2));assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,output,checks:report.map(r=>Object.keys(r)),errors}));
}finally{await browser.close();}
