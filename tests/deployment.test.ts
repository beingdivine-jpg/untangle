import { test, expect } from 'vitest'
import ts from 'typescript'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

test('deployed Node functions resolve emitted JavaScript imports without a TypeScript loader',()=>{
 const root=mkdtempSync(join(tmpdir(),'untangle-functions-'))
 try{
  writeFileSync(join(root,'package.json'),'{"type":"module"}')
  for(const file of ['api/community.ts','api/coach.ts','server/config.ts','server/community.ts','server/coach.ts','src/features/resolve/coachCore.ts','src/features/plan/content.ts']){
   const target=join(root,file.replace(/\.ts$/,'.js'));mkdirSync(dirname(target),{recursive:true})
   const result=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,verbatimModuleSyntax:true}})
   writeFileSync(target,result.outputText)
  }
  const community=pathToFileURL(join(root,'api/community.js')).href,coach=pathToFileURL(join(root,'api/coach.js')).href
  const script=`process.env.COMMUNITY_ENABLED='false'; process.env.LIVE_COACH_ENABLED='false'; const community=(await import(${JSON.stringify(community)})).default; const coach=(await import(${JSON.stringify(coach)})).default; let status,body; const res={writeHead(s){status=s},end(b){body=b}}; await community({url:'/api/community',method:'GET',headers:{}},res); if(status!==200||JSON.parse(body).available!==false)throw Error('community status'); await coach({url:'/api/coach',method:'POST',headers:{host:'untangle.test',origin:'https://untangle.test','content-type':'application/json'}},res); if(status!==503)throw Error('coach status'); console.log('Functions loaded and returned expected disconnected states');`
  expect(execFileSync(process.execPath,['--input-type=module','-e',script],{encoding:'utf8'})).toContain('Functions loaded')
 }finally{rmSync(root,{recursive:true,force:true})}
})
