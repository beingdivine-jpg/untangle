/* global console, document */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { baseRoot, serve } from './runtime.mjs';
const {server,url}=await serve();
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
 const metadata=await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight}));
 assert.deepEqual(metadata,{duration:78,width:1920,height:1080});
 assert.equal(await page.locator('html').getAttribute('lang'),'pl');
 await page.getByRole('button',{name:'Krok i nauka',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('video').currentTime>=57&&document.querySelector('video').readyState>=2);
 await page.locator('video').evaluate(v=>v.pause());
 assert(await page.locator('video').evaluate(v=>v.currentTime<60));
 await page.setViewportSize({width:390,height:844});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth)<=390);
 const textPromise=page.waitForEvent('download');await page.getByRole('link',{name:'English script · TXT',exact:true}).click();
 const text=await textPromise;assert.equal(text.suggestedFilename(),'script-english.txt');
 assert.equal(await readFile(await text.path(),'utf8'),await readFile(resolve(baseRoot,'polish-final/script-english.txt'),'utf8'));
 const moviePromise=page.waitForEvent('download');await page.getByRole('link',{name:'Pobierz film MP4',exact:true}).click();
 const movie=await moviePromise;const bytes=await readFile(await movie.path());
 const verification=JSON.parse(await readFile(resolve(baseRoot,'polish-final/output/verification.json'),'utf8'));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),verification.sha256);
 const range=await page.request.get(`${url}/polish-final/output/untangle-final-pl-78s.mp4`,{headers:{Range:'bytes=0-1023'}});
 assert.equal(range.status(),206);assert.equal((await range.body()).length,1024);
 await page.goto(`${url}/polish-final/`);await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
 assert.equal(await page.locator('video').evaluate(v=>v.duration),78);assert.deepEqual(errors,[]);
 const report={...metadata,locale:'pl',chapterSeekingPassed:true,mobile390Passed:true,englishScriptDownloadPassed:true,mp4DownloadHashMatches:true,byteRangeStreamingPassed:true,nestedPlayerPassed:true,errors};
 await writeFile(resolve(baseRoot,'polish-final/output/playback-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(done=>server.close(done));}
