import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './build.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}),context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage();
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4180',evidence=join(root,process.env.BROWSER_EVIDENCE_DIR||'doc/evidence/v0.1.2');mkdirSync(evidence,{recursive:true});
const results=[],errors=[];const fixture=JSON.parse(readFileSync(join(root,'tests/fixtures/v0.1.1-save.json'),'utf8'));
function observe(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});}
observe(page);
async function ready(p){await p.waitForSelector('html[data-ready="true"]');}
async function board(p){return p.evaluate(()=>SandpileApp.board);}
async function check(name,fn){await fn();results.push(`${name}: PASS`);console.log(results.at(-1));}
async function cell(p,x,y,touch=false){await p.locator('#main-board').scrollIntoViewIfNeeded();const s=await board(p),b=await p.locator('#main-board').boundingBox();const px=b.x+(x+.5)*b.width/s.width,py=b.y+(y+.5)*b.height/s.height;if(touch)await p.touchscreen.tap(px,py);else await p.mouse.click(px,py);}
async function tapButton(p,id){await p.locator('#'+id).scrollIntoViewIfNeeded();const b=await p.locator('#'+id).boundingBox();await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}
async function stopped(p){await p.waitForFunction(()=>!SandpileApp.running);}
try{
 await page.goto(base);await ready(page);
 await check('T01 grouped ten lessons and optional prediction preserve original input flow',async()=>{
   assert.equal(await page.locator('[data-version]').textContent(),'0.1.2');assert.equal(await page.locator('#lesson-panel').isVisible(),false);
   await page.locator('[data-mode="challenge"]').click();assert.equal(await page.locator('#level optgroup').count(),2);assert.equal(await page.locator('#level option').count(),10);assert.equal(await page.locator('#lesson-hints li').count(),0);
   await cell(page,1,1);await stopped(page);assert.match(await page.locator('#challenge-result').textContent(),/挑战完成/);assert.equal((await page.evaluate(()=>SandpileApp.lesson)).topplings,1);
 });
 await check('T02 wrong prediction, paused physical move and read-only wave replay',async()=>{
   await page.locator('#level').selectOption('chain');await page.locator('[data-prediction="quiet"]').click();await page.locator('#step-observe').check();await cell(page,1,1);
   assert.equal(await page.evaluate(()=>SandpileApp.running),false);assert.match(await page.locator('#prediction-feedback').textContent(),/预测不同/);
   const before=await board(page);assert.equal(before.cells[4],4);assert.equal(before.topplings,0);assert.deepEqual(await page.evaluate(()=>SandpileApp.lesson),{index:0,waves:2,topplings:2,lost:1});
   await page.locator('#replay-next').click();assert.match(await page.locator('#wave-explanation').textContent(),/新触发.*\(1,0\)/);assert.deepEqual(await board(page),before);
   await page.locator('#replay-range').focus();await page.keyboard.press('ArrowRight');assert.equal((await page.evaluate(()=>SandpileApp.lesson)).index,2);assert.deepEqual(await board(page),before);
   await page.locator('#replay-prev').click();assert.equal((await page.evaluate(()=>SandpileApp.lesson)).index,1);assert.deepEqual(await board(page),before);
   await page.locator('#step').click();assert.equal((await board(page)).topplings,1);await page.locator('#step').click();assert.equal((await board(page)).topplings,2);assert.match(await page.locator('#challenge-result').textContent(),/挑战完成/);
 });
 await check('T03 undo/reset/level change clear stale observations and correct prediction works',async()=>{
   await page.locator('#undo').click();assert.equal(await page.evaluate(()=>SandpileApp.lesson),null);assert.equal(await page.locator('#lesson-hints li').count(),0);
   await page.locator('#step-observe').uncheck();await page.locator('[data-prediction="cascade"]').click();await cell(page,1,1);await stopped(page);assert.match(await page.locator('#prediction-feedback').textContent(),/预测正确/);
   await page.locator('#reset').click();await page.locator('#confirm-action').click();assert.equal(await page.evaluate(()=>SandpileApp.lesson),null);
   await cell(page,1,1);await stopped(page);await page.locator('#level').selectOption('bridge');assert.equal(await page.evaluate(()=>SandpileApp.lesson),null);
 });
 await check('T04 hints are progressive and final distribution is only revealed on request',async()=>{
   assert.equal(await page.locator('#lesson-hints li').count(),0);await page.locator('#hint-button').click();assert.equal(await page.locator('#lesson-hints li').count(),1);assert.doesNotMatch(await page.locator('#lesson-hints').textContent(),/落点分配/);
   await page.locator('#hint-button').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#lesson-hints li').count(),2);assert.doesNotMatch(await page.locator('#lesson-hints').textContent(),/落点分配/);
   await page.locator('#hint-button').click();assert.match(await page.locator('#lesson-hints').textContent(),/落点分配/);assert.equal(await page.locator('#hint-button').isDisabled(),true);
 });
 await check('T05 advanced critical ring exposes six waves and fourteen basic topplings',async()=>{
   await page.locator('#level').selectOption('critical-ring');assert.equal(await page.locator('#lesson-hints li').count(),0);await page.locator('#step-observe').check();await cell(page,2,3);await cell(page,2,3);
   assert.deepEqual(await page.evaluate(()=>SandpileApp.lesson),{index:0,waves:6,topplings:14,lost:0});const before=await board(page);
   await page.locator('#replay-range').fill('3');await page.locator('#replay-range').dispatchEvent('input');assert.equal((await page.evaluate(()=>SandpileApp.lesson)).index,3);assert.deepEqual(await board(page),before);
   await page.screenshot({path:join(evidence,'desktop-teaching.png'),fullPage:true});
 });
 await check('T06 old save-v1 imports exactly; refresh keeps progress and no classroom state',async()=>{
   await page.locator('#import').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await page.locator('#confirm-action').click();assert.deepEqual(await page.evaluate(()=>SandpileApp.snapshot()),fixture);assert.equal(await page.evaluate(()=>SandpileApp.lesson),null);
   await page.reload();await ready(page);assert.deepEqual(await page.evaluate(()=>SandpileApp.snapshot()),fixture);assert.equal(await page.evaluate(()=>SandpileApp.lesson),null);assert.equal(await page.evaluate(()=>SandpileApp.running),false);assert.equal(await page.locator('#step-observe').isChecked(),false);
 });
 await check('T07 320px touch replay and hints stay readable and never modify physical state',async()=>{
   const c=await browser.newContext({viewport:{width:320,height:740},deviceScaleFactor:2,hasTouch:true}),p=await c.newPage();observe(p);await p.goto(base);await ready(p);await p.locator('[data-mode="challenge"]').click();await p.locator('#level').selectOption('critical-ring');await p.locator('#step-observe').check();await cell(p,2,3,true);await cell(p,2,3,true);const before=await board(p);
   await tapButton(p,'replay-next');assert.equal((await p.evaluate(()=>SandpileApp.lesson)).index,1);assert.deepEqual(await board(p),before);await tapButton(p,'hint-button');assert.equal(await p.locator('#lesson-hints li').count(),1);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:join(evidence,'mobile-teaching.png'),fullPage:true});await p.setViewportSize({width:740,height:320});assert.deepEqual(await board(p),before);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await c.close();
 });
 await check('T08 subpath and completely offline built file include teaching assets',async()=>{
   for(const url of [base+'/assets/games/abelian-sandpile/',pathToFileURL(join(root,'dist/index.html')).href]){const c=await browser.newContext();if(url.startsWith('file:'))await c.setOffline(true);const p=await c.newPage();observe(p);await p.goto(url);await ready(p);await p.locator('[data-mode="challenge"]').click();await p.locator('#level').selectOption('chain');await cell(p,1,1);await stopped(p);assert.equal((await p.evaluate(()=>SandpileApp.lesson)).waves,2);await p.locator('#replay-next').click();assert.equal((await p.evaluate(()=>SandpileApp.lesson)).index,1);await c.close();}
 });
 assert.deepEqual(errors,[]);const report=[`Chrome ${browser.version()}; real DOM/canvas; mobile simulated touch`,...results,`${results.length} passed; 0 failed; 0 page/console/HTTP errors`,'v0.1.2 web only; Android/hall not verified.'].join('\n')+'\n';writeFileSync(join(evidence,'teaching-browser.txt'),report);console.log(report);
}finally{await browser.close();}
