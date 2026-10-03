import type { AgentRequest, RunEvent } from './agentCore'
import { validateDraft } from './agentCore'
export async function runAgent(request: AgentRequest, signal: AbortSignal, event: (e: RunEvent) => void) {
  const response = await fetch('/api/agent', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(request), signal })
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(typeof body.error === 'string' ? body.error : 'The assistant is unavailable. Nothing changed.') }
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response was received.')
  const decoder = new TextDecoder(); let buffered = '', received = 0, ready = false
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break
      received += value.length; if (received > 32000) throw new Error('The response was too large. Nothing changed.')
      buffered += decoder.decode(value, { stream:true })
      let line: number
      while ((line = buffered.indexOf('\n')) >= 0) {
        const chunk = buffered.slice(0,line); buffered = buffered.slice(line+1); if (!chunk.trim()) continue
        const next = JSON.parse(chunk) as RunEvent
        if (!['received','drafting','checking','ready','error'].includes(next.stage) || typeof next.message !== 'string' || next.message.length > 300) throw new Error('The response could not be verified.')
        if (next.stage === 'error') throw new Error(next.message)
        if (next.stage === 'ready') { next.draft = validateDraft(next.draft, request); ready = true }
        if (!signal.aborted) event(next)
      }
    }
    if (!ready) throw new Error('The response ended before a draft was ready. Nothing changed.')
  } finally { await reader.cancel().catch(() => undefined); reader.releaseLock() }
}
