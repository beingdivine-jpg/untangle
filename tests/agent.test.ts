import { describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { allowedFor, localDraft, previewEffect, validateDraft, validateRequest } from '../src/features/companion/agentCore'
import type { AgentRequest } from '../src/features/companion/agentCore'
import { agentHandler } from '../server/agent'

const request: AgentRequest = { operation:'plan', topics:['accounts'], taskIds:['password'], text:'', consent:true }
const response = (draft:unknown, status='completed') => new Response(JSON.stringify({ status, output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(draft)}]}] }), {headers:{'Content-Type':'application/json'}})
class Reply extends EventEmitter {
  status=0; headers:Record<string,string>={}; output=''; writableEnded=false; destroyed=false
  writeHead(status:number,headers:Record<string,string>){this.status=status;this.headers=headers;return this}
  write(chunk:string){this.output+=chunk;return true}
  end(chunk=''){this.output+=chunk;this.writableEnded=true;return this}
}
function invoke(handler:ReturnType<typeof agentHandler>, options:{body?:unknown;raw?:string;path?:string;method?:string;origin?:string;host?:string}={}) {
  const req=Readable.from([options.raw ?? JSON.stringify(options.body ?? request)]) as IncomingMessage
  req.url=options.path ?? '/api/agent'; req.method=options.method ?? 'POST'
  req.headers={host:options.host ?? '127.0.0.1:5173',origin:options.origin ?? 'http://127.0.0.1:5173','content-type':'application/json'}
  Object.defineProperty(req,'socket',{value:{remoteAddress:'127.0.0.1'}})
  const res=new Reply(), next=vi.fn()
  const done=handler(req,res as unknown as ServerResponse,next)
  return {res,done,next}
}
describe('bounded draft contract',()=>{
  it('requires consent, bounded known topics and operation-specific data',()=>{
    for(const change of [{consent:false},{topics:[]},{topics:['invented']},{operation:'change-password'},{taskIds:['maps']},{text:'a'.repeat(501)},{text:'Unapproved story'}]) expect(()=>validateRequest({...request,...change})).toThrow()
    expect(()=>validateRequest({...request,operation:'edit',text:' '})).toThrow()
    expect(validateRequest({...request,topics:['accounts','accounts'],secret:'never send this'})).toEqual(request)
  })
  it('blocks common accidental credentials and contact details without promising a PII detector',()=>{
    for(const text of ['email me at maya@example.test','password is: exampleonly','https://example.test/private','phone 12345678901','sk-fictionaltest']) expect(()=>validateRequest({...request,operation:'edit',text})).toThrow('Remove contact')
    expect(validateRequest({...request,operation:'edit',text:'I am unsure which laptop is mine.'}).text).toContain('unsure')
  })
  it('rejects unsupported output and absolute safety claims; adds required preparation',()=>{
    expect(validateDraft({taskIds:['password'],editedText:''},request).taskIds).toEqual(['recovery','password'])
    for(const value of [{taskIds:['unknown'],editedText:''},{taskIds:['maps'],editedText:''},{taskIds:[],editedText:''},{taskIds:['password'],editedText:'You are safe.'},{taskIds:['password'],editedText:'a'.repeat(501)}]) expect(()=>validateDraft(value,request)).toThrow()
  })
  it('an edit cannot alter the plan, and preview cannot mutate observations',()=>{
    const edit={...request,operation:'edit' as const,text:'I am unsure about the laptop.'}
    const result=validateDraft({taskIds:['devices'],editedText:'I still have questions about the laptop.'},edit)
    expect(result.taskIds).toEqual(['recovery','password'])
    expect(result.editedText).toContain('questions')
    const ids=localDraft(['photos']).taskIds, before=[...ids]
    const preview=previewEffect('photos',ids)
    expect(preview.preparations).toContain('keep');expect(preview.impact + preview.boundary).toMatch(/saved/i)
    expect(ids).toEqual(before);expect(allowedFor(['location'])).not.toContain('password')
  })
})
describe('server-only agent adapter',()=>{
  it('reports configuration honestly and rejects unauthorised origins before provider access',async()=>{
    const fetcher=vi.fn<typeof fetch>(),handler=agentHandler({apiKey:'test-key-not-real',model:'test-model',fetcher})
    for(const options of [{origin:'https://evil.example'},{host:'example.com:5173'}]){const {res,done}=invoke(handler,options);await done;expect(res.status).toBe(403)}
    expect(fetcher).not.toHaveBeenCalled()
    const unavailable=invoke(agentHandler({}),{path:'/api/agent/status',method:'GET'});await unavailable.done
    expect(JSON.parse(unavailable.res.output)).toMatchObject({available:false,model:null})
    const missing=invoke(agentHandler({}));await missing.done;expect(missing.res.status).toBe(503)
  })
  it('uses only reviewed fields, disables storage, has no tools, and streams real completion stages',async()=>{
    const fetcher=vi.fn<typeof fetch>().mockResolvedValue(response({taskIds:['password'],editedText:''}))
    const {res,done}=invoke(agentHandler({apiKey:'test-key-not-real',model:'test-model',fetcher}),{body:{...request,otherNotes:'DO NOT TRANSMIT'}});await done
    const sent=JSON.parse(fetcher.mock.calls[0][1]!.body as string)
    expect(sent.store).toBe(false);expect(sent.tools).toBeUndefined();expect(sent.text.format.strict).toBe(true)
    expect(JSON.stringify(sent)).not.toContain('DO NOT TRANSMIT');expect(JSON.parse(sent.input).text).toBe('')
    const events=res.output.trim().split('\n').map(line=>JSON.parse(line))
    expect(events.map(e=>e.stage)).toEqual(['received','drafting','checking','ready'])
    expect(events.at(-1).draft.taskIds).toEqual(['recovery','password'])
    expect(res.output).not.toContain('test-key-not-real');expect(res.headers['Cache-Control']).toBe('no-store')
  })
  it('rejects malformed inputs and oversized requests before inference',async()=>{
    const fetcher=vi.fn<typeof fetch>(),handler=agentHandler({apiKey:'test',model:'test',fetcher})
    for(const raw of ['{broken','x'.repeat(12001),JSON.stringify({...request,consent:false})]){const {res,done}=invoke(handler,{raw});await done;expect([400,413]).toContain(res.status)}
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('does not release refused, incomplete or out-of-scope provider drafts',async()=>{
    for(const result of [response({taskIds:['password'],editedText:''},'incomplete'),response({taskIds:['maps'],editedText:''}),new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'refusal',refusal:'no'}]}]})),new Response('provider error',{status:500})]){
      const {res,done}=invoke(agentHandler({apiKey:'test',model:'test',fetcher:vi.fn<typeof fetch>().mockResolvedValue(result)}));await done
      const events=res.output.trim().split('\n').map(line=>JSON.parse(line));expect(events.at(-1).stage).toBe('error');expect(events.some(e=>e.stage==='ready')).toBe(false)
    }
  })
  it('masks network errors and aborts the provider request when the client closes',async()=>{
    const masked=invoke(agentHandler({apiKey:'test',model:'test',fetcher:vi.fn<typeof fetch>().mockRejectedValue(new Error('secret-test-payload'))}));await masked.done
    expect(masked.res.output).not.toContain('secret-test-payload')
    let signal:AbortSignal|undefined
    const fetcher=vi.fn<typeof fetch>().mockImplementation((_url,options)=>new Promise((_resolve,reject)=>{signal=options!.signal!;signal.addEventListener('abort',()=>reject(new Error('aborted')))}))
    const {res,done}=invoke(agentHandler({apiKey:'test',model:'test',fetcher}))
    await vi.waitFor(()=>expect(fetcher).toHaveBeenCalled());res.emit('close');await done
    expect(signal!.aborted).toBe(true);expect(res.output).not.toContain('"stage":"ready"')
  })
  it('enforces the local request limit',async()=>{
    const fetcher=vi.fn<typeof fetch>().mockImplementation(async()=>response({taskIds:['password'],editedText:''})),handler=agentHandler({apiKey:'test',model:'test',fetcher})
    for(let i=0;i<12;i++){const run=invoke(handler);await run.done;expect(run.res.status).toBe(200)}
    const limited=invoke(handler);await limited.done;expect(limited.res.status).toBe(429);expect(fetcher).toHaveBeenCalledTimes(12)
  })
})
