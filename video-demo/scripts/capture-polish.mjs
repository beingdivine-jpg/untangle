/* global process, console, document, URL */
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { baseRoot } from './runtime.mjs';
const root=resolve(baseRoot,'polish-final'), out=resolve(root,'assets/captures');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:2,reducedMotion:'reduce'});
const errors=[], forbidden=[], shots={};
const url=process.env.APP_URL || 'http://127.0.0.1:5180';
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(r.method()==='POST'||new URL(r.url()).origin!==new URL(url).origin)forbidden.push(r.url());});
const click=name=>page.getByRole('button',{name,exact:true}).click();
async function shot(name,selector){
 const target=page.locator(selector).filter({visible:true}).first();await target.waitFor();await page.evaluate(()=>document.fonts.ready);
 await target.screenshot({path:resolve(out,`${name}.png`),animations:'disabled'});
 const box=await target.boundingBox(),controls=[];
 for(const b of await target.getByRole('button').all()){const rect=await b.boundingBox();if(rect)controls.push({label:await b.innerText(),x:rect.x-box.x+rect.width/2,y:rect.y-box.y+rect.height/2});}
 shots[name]={selector,width:box.width,height:box.height,controls,text:await target.innerText()};
}
try{
 await page.goto(`${url}/?lang=pl`);await shot('home','.editorial-hero');await shot('launch','.demo-tour-launch');
 await click('Demo krok po kroku');assert.equal(await page.locator('html').getAttribute('lang'),'pl');
 await shot('tour-intro','.jt-stage');await shot('story','.jt-work');
 await click('Przygotuj propozycję dla Mai');assert.equal(await page.getByRole('checkbox').count(),6);
 await shot('checks','.jt-work');
 await click('Zobacz skutki zmiany');await shot('effects','.jt-work');
 assert.match(await page.locator('.jt-source').getAttribute('href'),/hl=pl/);
 await click('Wypróbuj pomoc w pisaniu');await shot('wording','.jt-work');
 const note=await page.locator('#demo-wording').inputValue();assert.match(note,/Zmieniłam hasło/);
 await click('Użyj tej treści');await shot('approval','.jt-work');
 await click('Zachowaj ten plan demo');await shot('result','.jt-work');
 assert.match(await page.locator('.jt-success').innerText(),/Kroki w planie: 6/);
 assert.match(await page.locator('.jt-pending').innerText(),/Jeszcze niesprawdzone/);
 await click('Przejdź do pomocy krok po kroku');await shot('resolve-header','.work-title');await shot('step','.resolution-main .work-panel');await shot('coach','.coach-panel');await shot('human','.human-bridge');
 assert.match(await page.locator('.current-instruction').innerText(),/pomocniczy/);
 await click('Pomóż mi zrozumieć');await shot('lesson','.lesson');await shot('quiz','.learning-check');
 await page.locator('.learning-check').getByRole('button',{name:'Tak',exact:true}).click();
 assert.match(await page.locator('.learning-check [role=status]').innerText(),/Zgadza się/);await shot('quiz-answer','.learning-check');
 await click('Przejdź przez krok');await click('Nie wiem, co dalej');await shot('outcome-pending','.outcome-check');
 await click('Zapisz tę informację w moim planie');await shot('outcome','.outcome-check');
 await page.getByRole('navigation',{name:'Twoja przestrzeń'}).getByRole('button',{name:'Mój plan',exact:true}).click();
 assert.match(await page.locator('.p-progress-count').innerText(),/0\s*\/\s*6/);
 assert.equal(await page.getByLabel('Moja notatka o całej sytuacji').inputValue(),note);await shot('plan','.p-plan-overview');
 await page.getByRole('button',{name:'Demo krok po kroku',exact:true}).click();
 for(const name of ['Przygotuj propozycję dla Mai','Zobacz skutki zmiany','Wypróbuj pomoc w pisaniu','Użyj tej treści','Zachowaj ten plan demo','Przejdź do pomocy krok po kroku'])await click(name);
 await click('Znajdź pomoc człowieka');await shot('support','.support-alternative');
 assert.match(await page.locator('.support-alternative').innerText(),/wsparcia specjalisty/);
 assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);
 await writeFile(resolve(out,'manifest.json'),JSON.stringify({locale:'pl',fictional:true,workflowVerified:true,liveProviderCalls:0,polishDemoVerified:true,approvalVerified:true,guidedStepVerified:true,lessonVerified:true,uncertaintyVerified:true,supportRouteVerified:true,errors,shots},null,2)+'\n');
 const files=['src/features/walkthrough/JudgeWalkthrough.tsx','src/features/resolve/Resolve.tsx','src/features/resolve/lessons.ts','src/features/community/Community.tsx','src/i18n/pl.json','server/coach.ts'];
 const sources=[];for(const file of files){const data=await readFile(resolve(baseRoot,'..',file));sources.push({file,sha256:createHash('sha256').update(data).digest('hex')});}
 await writeFile(resolve(root,'assets/source-snapshot.json'),JSON.stringify({capturedAt:new Date().toISOString(),note:'Latest local implementation, including uncommitted product work. No live AI response or volunteer conversation recorded.',sources},null,2)+'\n');
 console.log(`Captured ${Object.keys(shots).length} Polish regions; approved plan, lesson feedback, uncertain result and human-support route verified.`);
}finally{await browser.close();}
