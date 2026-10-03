import { concerns, defaultTasks, taskById, tasks } from './content.ts'
import type { ConcernId, TaskId } from './content.ts'
export type Outcome = 'reviewed' | 'uncertain' | 'later' | 'support'
export type Status = 'todo' | Outcome
export interface Entry { status: Status; note: string; history: { status: Status; at: string; note: string }[] }
export interface Plan { version: 1; example: boolean; concerns: ConcernId[]; entries: Partial<Record<TaskId, Entry>> }
export const statusLabels: Record<Status, string> = { todo: 'Not checked yet', reviewed: 'Reviewed by me', uncertain: 'Still a question', later: 'For later', support: 'With someone’s help' }
export const emptyPlan = (): Plan => ({ version: 1, example: false, concerns: [], entries: {} })
export function addTask(plan: Plan, id: TaskId): Plan {
  let next = { ...plan, entries: { ...plan.entries } }
  for (const prerequisite of taskById[id].prerequisites) next = addTask(next, prerequisite)
  next.entries[id] ??= { status: 'todo', note: '', history: [] }
  return next
}
export function buildPlan(selected: ConcernId[], services = ['google', 'apple', 'whatsapp']): Plan {
  let plan: Plan = { ...emptyPlan(), concerns: [...selected] }
  for (const concern of selected) for (const id of defaultTasks[concern]) plan = addTask(plan, id)
  for (const id of Object.keys(plan.entries) as TaskId[]) {
    const service = taskById[id].service.toLowerCase()
    if ((service.includes('google') || service.includes('gmail')) && !services.includes('google')) delete plan.entries[id]
    if ((service.includes('apple') || service.includes('iphone')) && !services.includes('apple')) delete plan.entries[id]
    if (service.includes('whatsapp') && !services.includes('whatsapp')) delete plan.entries[id]
  }
  if (selected.includes('accounts') && services.includes('apple')) plan = addTask(plan, 'apple')
  return plan
}
export function record(plan: Plan, id: TaskId, status: Status, note: string, at = new Date().toISOString()): Plan {
  const entry = plan.entries[id]
  if (!entry) return plan
  return { ...plan, entries: { ...plan.entries, [id]: { status, note: note.slice(0, 500), history: [...entry.history, { status, at, note: note.slice(0, 500) }].slice(-30) } } }
}
export function prerequisites(plan: Plan, id: TaskId) {
  return taskById[id].prerequisites.filter(p => plan.entries[p]?.status !== 'reviewed')
}
export function nextTask(plan: Plan): TaskId | undefined {
  const pending = tasks.filter(t => plan.entries[t.id]?.status === 'todo')
  return pending.find(t => !prerequisites(plan, t.id).length)?.id ?? pending[0]?.id
}
export function examplePlan(localize: (text: string) => string = text => text): Plan {
  let plan = buildPlan(['accounts', 'location', 'photos'])
  plan = { ...plan, example: true }
  plan = record(plan, 'recovery', 'reviewed', localize('I can receive messages at my own recovery email.'), '2026-10-03T10:00:00.000Z')
  plan = record(plan, 'devices', 'uncertain', localize('There are two laptop entries. I cannot tell which one we shared.'), '2026-10-03T10:05:00.000Z')
  plan = record(plan, 'maps', 'later', localize('I want to talk to someone before changing location sharing.'), '2026-10-03T10:10:00.000Z')
  return plan
}
export function validatePlan(value: unknown): Plan {
  const fail = (): never => { throw new Error('This file does not contain a supported Untangle plan.') }
  if (!value || typeof value !== 'object') return fail()
  const p = value as Record<string, unknown>
  if (p.version !== 1 || typeof p.example !== 'boolean' || !Array.isArray(p.concerns) || !p.entries || typeof p.entries !== 'object' || Array.isArray(p.entries)) return fail()
  if (p.concerns.length > concerns.length || p.concerns.some(c => !concerns.some(v => v.id === c))) return fail()
  const entries: Plan['entries'] = {}
  const validStatus = (s: unknown): s is Status => typeof s === 'string' && Object.hasOwn(statusLabels, s)
  const validNote = (s: unknown): s is string => typeof s === 'string' && s.length <= 500
  for (const [id, value] of Object.entries(p.entries)) {
    if (!tasks.some(t => t.id === id) || !value || typeof value !== 'object') return fail()
    const e = value as Record<string, unknown>
    if (!validStatus(e.status) || !validNote(e.note) || !Array.isArray(e.history) || e.history.length > 30) return fail()
    const history: Entry['history'] = e.history.map(h => {
      if (!h || typeof h !== 'object' || !validStatus(h.status) || !validNote(h.note) || typeof h.at !== 'string' || h.at.length > 30 || !Number.isFinite(Date.parse(h.at))) return fail()
      return { status: h.status, note: h.note, at: h.at }
    })
    entries[id as TaskId] = { status: e.status, note: e.note, history }
  }
  // Reconstruct only known fields. Imported data never becomes instructions or HTML.
  let result: Plan = { version: 1, example: p.example, concerns: [...new Set(p.concerns)] as ConcernId[], entries }
  for (const id of Object.keys(entries) as TaskId[]) result = addTask(result, id)
  return result
}
