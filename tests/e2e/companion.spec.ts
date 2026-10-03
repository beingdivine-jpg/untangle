import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
const panel=(page:Page)=>page.locator('.u-working-panel')
const tool=(page:Page,name:string)=>page.getByRole('navigation',{name:'Assistant tools'}).getByRole('button',{name,exact:true})
async function demo(page:Page){await page.goto('/');await page.getByRole('button',{name:'Try Me',exact:true}).click()}
async function personal(page:Page,available=false){await page.route('**/api/agent/status',route=>route.fulfill({json:{available,model:available?'test-model':null}}));await page.goto('/');await page.getByRole('button',{name:'Start with my own situation'}).click()}
async function consent(page:Page){await page.getByRole('dialog').getByRole('checkbox').check();await page.getByRole('button',{name:'Send these fields'}).click()}
function stream(draft:unknown){return [{stage:'received',message:'Test input checked.'},{stage:'drafting',message:'Test request started.'},{stage:'checking',message:'Test output checked.'},{stage:'ready',message:'Draft ready for approval.',draft}].map(e=>JSON.stringify(e)).join('\n')+'\n'}
async function capture(page:Page,name:string){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`docs/screenshots/companion-${name}.png`,fullPage:true,animations:'disabled'})}

test('Try Me shows the work, keeps approval separate, and transfers a fictional plan',async({page})=>{
  const requests:string[]=[];page.on('request',r=>{if(r.method()==='POST'||!new URL(r.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/)) requests.push(r.url())})
  await demo(page)
  await expect(page.getByText('TRY ME · FICTIONAL EXAMPLE')).toBeVisible()
  await panel(page).getByRole('button',{name:'Connect the dots',exact:true}).click()
  await expect(page.getByRole('list',{name:'Visible activity'}).getByRole('listitem')).toHaveCount(4)
  await expect(page.getByRole('button',{name:'Open my full plan'})).toHaveCount(0)
  await expect(panel(page).getByRole('checkbox',{name:/Keep a way back/})).toBeDisabled()
  await expect(page.locator('#companion-panel-heading')).toBeFocused()
  await page.getByRole('button',{name:'Keep these steps'}).click()
  await expect(panel(page)).toContainText('6 checks kept by you') // required recovery preparation is retained
  await page.getByRole('button',{name:'Open my full plan'}).click()
  await expect(page.locator('.p-example-banner')).toBeVisible()
  await expect(page.locator('.p-progress-count')).toContainText('0 / 6')
  await page.getByRole('button',{name:/Keep a way back into your account Google/}).click()
  await page.getByRole('button',{name:/My update/}).click()
  await expect(page.getByLabel('A reminder for yourself')).toHaveValue(/I changed my password/)
  expect(requests).toEqual([])
})

test('what-if exploration is source based and never marks a check done',async({page})=>{
  await demo(page);await panel(page).getByRole('button',{name:'Connect the dots',exact:true}).click();await page.getByRole('button',{name:'Keep these steps'}).click()
  await tool(page,'What if I change…').click()
  await page.getByLabel('A change I’m considering').selectOption('photos')
  await expect(panel(page)).toContainText(/saved/i)
  await expect(page.locator('.u-source')).toHaveAttribute('href',/support.google.com\/photos/)
  await expect(panel(page)).toContainText('Preview only')
  await tool(page,'Connect the dots').click();await expect(panel(page)).toContainText('6 checks kept by you')
  await page.getByRole('button',{name:'Open my full plan'}).click();await expect(page.locator('.p-progress-count')).toContainText('0 / 6')
})

test('editing has distinct preview, reject, accept and undo; all three stories work',async({page})=>{
  await demo(page)
  for(const story of ['We shared a laptop.','Who can see where I am?','I want to keep what matters.']){
    await page.getByRole('button',{name:story,exact:true}).click()
    await tool(page,'Help me put it into words').click()
    const original=await page.getByLabel('Maya’s example note').inputValue()
    await page.getByRole('button',{name:'Preview the example edit'}).click()
    await expect(page.getByLabel('Maya’s example note')).toHaveValue(original)
    await page.getByRole('button',{name:'Keep original',exact:true}).click()
    await expect(page.getByLabel('Maya’s example note')).toHaveValue(original)
    await page.getByRole('button',{name:'Preview the example edit'}).click()
    await page.getByLabel('You can edit this draft too').fill('A fictional wording edit for this test.')
    await page.getByRole('button',{name:'Use this wording'}).click()
    await expect(page.getByLabel('Maya’s example note')).toHaveValue('A fictional wording edit for this test.')
    await page.getByRole('button',{name:'Undo wording change'}).click()
    await expect(page.getByLabel('Maya’s example note')).toHaveValue(original)
    await tool(page,'Connect the dots').click();await panel(page).getByRole('button',{name:'Connect the dots',exact:true}).click();await page.getByRole('button',{name:'Keep these steps'}).click()
    await expect(page.getByRole('button',{name:'Open my full plan'})).toBeVisible()
  }
})

test('local fallback works honestly without an AI key and clears on lifecycle restore',async({page})=>{
  let posts=0;page.on('request',r=>{if(r.method()==='POST')posts++})
  await personal(page)
  await expect(page.getByRole('button',{name:'Ask AI for a draft'})).toBeDisabled()
  await expect(panel(page)).toContainText('Live AI is not connected')
  await page.getByRole('button',{name:'Build a draft on this device'}).click()
  await page.getByRole('button',{name:'Keep these steps'}).click()
  expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0})
  await page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))})
  await expect(page.getByRole('button',{name:'Try Me',exact:true})).toBeVisible();expect(posts).toBe(0)
})

test('live path sends nothing before exact-field consent and applies nothing before acceptance',async({page})=>{
  const sent:Record<string,unknown>[]=[]
  await page.route('**/api/agent',async route=>{sent.push(route.request().postDataJSON());await route.fulfill({contentType:'application/x-ndjson',body:stream({taskIds:['password'],editedText:''})})})
  await personal(page,true);await page.getByRole('button',{name:'Ask AI for a draft'}).click()
  await expect(page.getByRole('dialog')).toContainText('OpenAI');await expect(page.getByRole('dialog')).toContainText('Checks included')
  await expect(page.getByRole('button',{name:'Send these fields'})).toBeDisabled();expect(sent).toHaveLength(0)
  await page.getByRole('button',{name:'Stay on this device'}).click();expect(sent).toHaveLength(0)
  await page.getByRole('button',{name:'Ask AI for a draft'}).click();await consent(page)
  await expect(page.getByRole('button',{name:'Keep these steps'})).toBeVisible();expect(sent).toHaveLength(1)
  expect(sent[0]).toMatchObject({operation:'plan',topics:['accounts'],text:'',consent:true})
  await expect(page.getByRole('button',{name:'Open my full plan'})).toHaveCount(0)
  await page.getByRole('button',{name:'Keep these steps'}).click();await expect(panel(page)).toContainText('2 checks kept by you')
})

test('live editor previews the exact note and user can reject; unsupported output is refused',async({page})=>{
  const sent:Record<string,unknown>[]=[]
  await page.route('**/api/agent',route=>{sent.push(route.request().postDataJSON());return route.fulfill({contentType:'application/x-ndjson',body:stream({taskIds:['password'],editedText:'I have questions about the laptop.'})})})
  await personal(page,true);await tool(page,'Help me put it into words').click()
  await page.getByLabel('A note for yourself').fill('I am not sure about the laptop.')
  await page.getByRole('button',{name:'Ask AI to simplify this note'}).click()
  await expect(page.getByRole('dialog')).toContainText('I am not sure about the laptop.');expect(sent).toHaveLength(0)
  await consent(page);await expect(page.getByLabel('You can edit this draft too')).toHaveValue('I have questions about the laptop.')
  await expect(page.getByLabel('A note for yourself')).toHaveValue('I am not sure about the laptop.')
  await page.getByRole('button',{name:'Keep original',exact:true}).click();await expect(page.getByLabel('A note for yourself')).toHaveValue('I am not sure about the laptop.')
  await page.route('**/api/agent',route=>route.fulfill({contentType:'application/x-ndjson',body:stream({taskIds:['maps'],editedText:'You are safe.'})}))
  await page.getByRole('button',{name:'Ask AI to simplify this note'}).click();await consent(page)
  await expect(page.getByRole('alert')).toContainText('unsupported content');await expect(page.getByLabel('You can edit this draft too')).toHaveCount(0)
})

test('cancelled requests cannot revive a stale draft',async({page})=>{
  let release:()=>void=()=>{};const gate=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/api/agent',async route=>{await gate;await route.fulfill({contentType:'application/x-ndjson',body:stream({taskIds:['password'],editedText:''})}).catch(()=>{})})
  await personal(page,true);await page.getByRole('button',{name:'Ask AI for a draft'}).click();await consent(page)
  await expect(page.getByRole('status')).toContainText('Waiting for the AI')
  await page.getByRole('button',{name:'Stop',exact:true}).click();release()
  await expect(panel(page)).toContainText('Request stopped')
  await page.getByRole('button',{name:'Build a draft on this device'}).click();await page.getByRole('button',{name:'Keep these steps'}).click()
  await expect(panel(page)).toContainText('6 checks kept by you')
})

test('intro, draft, preview and consent are responsive and accessible',async({page})=>{
  test.setTimeout(120000);const audits:unknown[]=[]
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:1000});await page.goto('/')
    const button=await page.getByRole('button',{name:'Try Me',exact:true}).boundingBox();expect(button!.y+button!.height).toBeLessThan(1000)
    for(const state of ['home','demo','preview']){
      if(state==='demo'){await page.getByRole('button',{name:'Try Me',exact:true}).click();await panel(page).getByRole('button',{name:'Connect the dots',exact:true}).click()}
      if(state==='preview')await tool(page,'What if I change…').click()
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
      const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();audits.push({width,state,violations:audit.violations});expect(audit.violations).toEqual([])
      if([390,1440].includes(width))await capture(page,`${state}-${width}`)
    }
    await personal(page,true);await page.getByRole('button',{name:'Ask AI for a draft'}).click()
    await expect(page.getByRole('button',{name:'Cancel AI request'})).toBeFocused()
    await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'Stay on this device'})).toBeFocused()
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();audits.push({width,state:'consent',violations:audit.violations});expect(audit.violations).toEqual([])
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  fs.writeFileSync('docs/companion-accessibility-audit.json',JSON.stringify(audits,null,2))
})
