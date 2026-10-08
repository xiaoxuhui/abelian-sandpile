import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { root } from './build.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),C=require('../src/domain/sandpile.js');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4180';
const evidence=join(root,'doc/evidence/v0.1.1');mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'});
const results=[],errors=[];
const context=await browser.newContext({viewport:{width:1280,height:1000},acceptDownloads:true});
const page=await context.newPage();
function observe(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});}
observe(page);
async function ready(p){await p.waitForSelector('html[data-ready="true"]');}
async function snap(p){return p.evaluate(()=>SandpileApp.snapshot());}
async function check(name,fn){await fn();results.push(`${name}: PASS`);console.log(results.at(-1));}
async function fill(p,id,value){await p.locator('#'+id).fill(String(value));await p.locator('#'+id).dispatchEvent('change');}
async function begin(p){await p.locator('#repeat-drop').click();await p.waitForFunction(()=>Boolean(SandpileApp.pouring));}
async function waitAdded(p,n){await p.waitForFunction(n=>SandpileApp.snapshot().experiment.state.added>=n,n,{timeout:10000});}
async function unchanged(p){const before=(await snap(p)).experiment.state;await delay(250);assert.deepEqual((await snap(p)).experiment.state,before);assert.equal(await p.evaluate(()=>SandpileApp.running),false);assert.equal(await p.evaluate(()=>SandpileApp.pouring),null);}
async function confirm(p){await p.locator('#confirm-action').click();}
async function importSave(p,bundle){await p.locator('#import').setInputFiles({name:'save.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bundle))});await confirm(p);}
try{
 await page.goto(base);await ready(page);
 await check('R01 desktop continuous selected-cell input, locked configuration and stop',async()=>{
   assert.equal(await page.locator('[data-version]').textContent(),'0.1.1');
   await fill(page,'coord-x',31);await fill(page,'coord-y',30);await fill(page,'amount',4);await fill(page,'pour-interval',100);
   await begin(page);await waitAdded(page,12);assert.deepEqual(await page.evaluate(()=>SandpileApp.pouring),{x:31,y:30,amount:4,interval:100});
   assert.equal(await page.locator('#amount').isDisabled(),true);assert.equal(await page.locator('#pour-interval').isDisabled(),true);
   assert.match(await page.locator('#pour-status').textContent(),/31, 30/);await page.screenshot({path:join(evidence,'desktop-repeat.png'),fullPage:true});
   await page.locator('#repeat-drop').click();await unchanged(page);assert.equal(await page.locator('#amount').isDisabled(),false);
 });
 await check('R02 keyboard toggle and pause stop automatic input',async()=>{
   const before=(await snap(page)).experiment.state.added;await page.locator('#repeat-drop').focus();await page.keyboard.press('Space');await waitAdded(page,before+4);
   await page.locator('#run').click();await unchanged(page);
   await page.locator('#repeat-drop').focus();await page.keyboard.press('Enter');await waitAdded(page,(await snap(page)).experiment.state.added+4);
   await page.locator('#repeat-drop').focus();await page.keyboard.press('Space');await unchanged(page);
 });
 await check('R03 invalid interval does not add grains; reset confirmation pauses and cancels old frames',async()=>{
   const before=(await snap(page)).experiment.state;await fill(page,'pour-interval',99);await page.locator('#repeat-drop').click();assert.deepEqual((await snap(page)).experiment.state,before);assert.equal(await page.evaluate(()=>SandpileApp.pouring),null);assert.match(await page.locator('#message').textContent(),/间隔/);
   await fill(page,'pour-interval',100);await begin(page);await page.locator('#reset').click();assert.equal(await page.evaluate(()=>SandpileApp.pouring),null);await page.locator('#cancel-action').click();await unchanged(page);
   await begin(page);await page.locator('#reset').click();await confirm(page);await unchanged(page);assert.equal((await snap(page)).experiment.state.total,0);
 });
 await check('R04 switching to challenge cancels loop; challenge keeps one-grain rules',async()=>{
   await begin(page);await waitAdded(page,4);await page.locator('[data-mode="challenge"]').click();assert.equal(await page.locator('#repeat-drop').isVisible(),false);await unchanged(page);
   const box=await page.locator('#main-board').boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);
   await page.waitForFunction(()=>!SandpileApp.running);assert.equal((await snap(page)).challenge.moves,1);assert.match(await page.locator('#challenge-result').textContent(),/挑战完成/);
   await page.locator('[data-mode="explore"]').click();assert.equal(await page.evaluate(()=>SandpileApp.pouring),null);
 });
 await check('R05 save-v1 export/import, reload and hidden/pagehide events never restart pouring',async()=>{
   await begin(page);await waitAdded(page,(await snap(page)).experiment.state.added+8);const event=page.waitForEvent('download');await page.locator('#export').click();const download=await event;assert.ok(await download.path());
   const saved=await snap(page);assert.equal(saved.schemaVersion,1);assert.equal('pouring' in saved,false);await importSave(page,saved);await unchanged(page);assert.deepEqual(await snap(page),saved);
   await begin(page);await waitAdded(page,saved.experiment.state.added+4);await page.reload();await ready(page);await unchanged(page);assert.equal(await page.locator('#repeat-drop').textContent(),'开始循环投沙');
   await begin(page);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await unchanged(page);
   await begin(page);await page.evaluate(()=>dispatchEvent(new Event('pagehide')));await unchanged(page);
 });
 await check('R06 cumulative budget automatically stops before partial input',async()=>{
   const bundle=await snap(page),state=C.create(1,1,[999996]);C.stabilize(state);
   bundle.experiment={state,queue:[],selected:{x:0,y:0}};bundle.settings.amount=3;await importSave(page,bundle);await fill(page,'pour-interval',100);
   await page.locator('#repeat-drop').click();await page.waitForFunction(()=>!SandpileApp.running&&document.getElementById('message').dataset.error==='true');
   assert.equal((await snap(page)).experiment.state.added,3);assert.match(await page.locator('#message').textContent(),/累计/);await unchanged(page);
 });
 await check('R07 320px touch start/stop and responsive loop controls',async()=>{
   const c=await browser.newContext({viewport:{width:320,height:740},hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();observe(p);await p.goto(base);await ready(p);await fill(p,'amount',4);await fill(p,'pour-interval',100);
   async function tap(){await p.locator('#repeat-drop').scrollIntoViewIfNeeded();const b=await p.locator('#repeat-drop').boundingBox();await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}
   await tap();await waitAdded(p,12);await p.screenshot({path:join(evidence,'mobile-repeat.png'),fullPage:true});await tap();await unchanged(p);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await c.close();
 });
 await check('R08 offline built file supports repeat input and stops cleanly',async()=>{
   const c=await browser.newContext();await c.setOffline(true);const p=await c.newPage();observe(p);await p.goto(pathToFileURL(join(root,'dist/index.html')).href);await ready(p);
   await fill(p,'pour-interval',100);const before=(await snap(p)).experiment.state.added;await begin(p);await waitAdded(p,before+2);await p.locator('#repeat-drop').click();await unchanged(p);await c.close();
 });
 assert.deepEqual(errors,[]);
 const report=[`Chrome ${browser.version()}, headless real DOM/canvas, simulated mobile touch`,...results,`${results.length} passed; 0 failed; 0 page/console/HTTP errors`,'Web-only; no Android WebView or hall changes.'].join('\n')+'\n';writeFileSync(join(evidence,'repeat-browser.txt'),report);console.log(report);
}finally{await browser.close();}
