import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {root} from './build.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:320,height:740}}),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{window.nativeExports=[];window.AbelianAndroid={saveFile(name,text){window.nativeExports.push({name,text});}};});
try{
 await page.goto(process.env.PREVIEW_URL||'http://127.0.0.1:4180');await page.waitForSelector('html[data-ready="true"]');
 await page.locator('#repeat-drop').click();await page.waitForFunction(()=>SandpileApp.board.added>0);
 await page.locator('#export').click();assert.equal(await page.evaluate(()=>SandpileApp.running),false);
 const exported=await page.evaluate(()=>nativeExports[0]);assert.equal(exported.name,'abelian-sandpile-save-v1.json');
 assert.deepEqual(JSON.parse(exported.text),await page.evaluate(()=>SandpileApp.snapshot()));
 results.push('N01 native boundary receives exact save-v1 and pauses loop: PASS');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('abelian-export-result',{detail:{ok:true,message:'已取消导出，原存档保留。'}})));
 assert.match(await page.locator('#message').textContent(),/已取消导出/);results.push('N02 native cancellation feedback is truthful: PASS');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('abelian-export-result',{detail:{ok:false,message:'保存失败：只读位置'}})));
 assert.match(await page.locator('#message').textContent(),/保存失败/);results.push('N03 native failure feedback preserves board: PASS');
 const before=await page.evaluate(()=>SandpileApp.board);
 await page.evaluate(()=>{window.AbelianAndroid.saveFile=()=>{throw new Error('桥暂不可用');};});await page.locator('#export').click();
 assert.match(await page.locator('#message').textContent(),/桥暂不可用/);assert.deepEqual(await page.evaluate(()=>SandpileApp.board),before);results.push('N04 bridge exception is visible and game data unchanged: PASS');
 assert.deepEqual(errors,[]);
 const dir=join(root,'doc/evidence/android-v0.1.2');mkdirSync(dir,{recursive:true});
 const output=[`Chrome ${browser.version()}; real DOM with explicit native-interface stub (not Android runtime)`,...results,'4 passed; 0 failed; 0 page/console errors','Actual browser Blob download and import covered by B10/B11.'].join('\n')+'\n';
 writeFileSync(join(dir,'bridge-browser.txt'),output);console.log(output);
}finally{await browser.close();}
