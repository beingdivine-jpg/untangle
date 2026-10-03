import { services as serviceOptions } from '../plan/services.ts'
import type { ServiceId } from '../plan/services.ts'
import { taskById, tasks } from '../plan/content.ts'
import type { TaskId, ConcernId } from '../plan/content.ts'
import { addTask, buildPlan, emptyPlan } from '../plan/model.ts'

export const stories = [
  { id: 'laptop', title: 'We shared a laptop.', subtitle: 'Accounts, photos, and a password that used to be shared.', topics: ['accounts','photos'] as ConcernId[], facts: ['Maya used her Google account on a shared laptop.', 'She used Google Photos partner sharing.', 'She wants to understand what a password change would leave behind.'], taskIds: ['recovery','devices','password','forwarding','keep','photos'] as TaskId[], note: 'I changed my password but I don’t know about that laptop or our photos.', rewrite: 'I changed my password. I still need to check the shared laptop and photo sharing.', prediction: 'password' as TaskId },
  { id: 'location', title: 'Who can see where I am?', subtitle: 'A location setting is only one part of the picture.', topics: ['location','support'] as ConcernId[], facts: ['Maya previously shared her location in Google Maps.', 'She also uses an iPhone.', 'She wants to understand the options before making a change.'], taskIds: ['maps','apple','support'] as TaskId[], note: 'If I stop sharing on Maps does that mean no one can see where I am?', rewrite: 'Does stopping Google Maps sharing affect location sharing in my other apps?', prediction: 'maps' as TaskId },
  { id: 'memories', title: 'I want to keep what matters.', subtitle: 'Shared photos, family services, and your own next chapter.', topics: ['photos','shared'] as ConcernId[], facts: ['Maya uses Google Photos partner sharing.', 'She belongs to an Apple family group.', 'She wants to keep important photos and understand what she relies on.'], taskIds: ['keep','photos','family','support'] as TaskId[], note: 'I want to leave the shared stuff but keep my photos and the services I need.', rewrite: 'Before leaving shared services, I want to check which photos to keep and what access I would lose.', prediction: 'photos' as TaskId },
] as const
export type StoryId = typeof stories[number]['id']
export interface AgentRequest { services?: ServiceId[]; locale?: 'en' | 'pl'; operation: 'plan' | 'edit'; topics: ConcernId[]; taskIds: TaskId[]; text: string; consent: true }
export interface AgentDraft { taskIds: TaskId[]; editedText: string }
export interface RunEvent { stage: 'received' | 'drafting' | 'checking' | 'ready' | 'error'; message: string; draft?: AgentDraft }
export const allowedTopics = ['accounts','location','photos','messages','shared','support'] as const
export function allowedFor(topics: ConcernId[], services?: ServiceId[]): TaskId[] { return Object.keys(buildPlan(topics, services).entries) as TaskId[] }
export function validateRequest(value: unknown): AgentRequest {
  if (!value || typeof value !== 'object') throw new Error('Invalid request.')
  const v = value as Record<string, unknown>
  if (v.locale !== undefined && v.locale !== 'en' && v.locale !== 'pl') throw new Error('Choose English or Polish.')
  if (v.consent !== true || !['plan','edit'].includes(String(v.operation)) || !Array.isArray(v.topics) || !v.topics.length || v.topics.length > 6 || v.topics.some(x => !allowedTopics.includes(x as ConcernId))) throw new Error('Choose a topic and review what will be sent first.')
  if (!Array.isArray(v.taskIds) || v.taskIds.length > 13 || v.taskIds.some(x => !tasks.some(t => t.id === x))) throw new Error('Choose supported checks only.')
  if (typeof v.text !== 'string' || v.text.length > 500) throw new Error('Keep the draft under 500 characters.')
  if (v.operation === 'plan' && v.text) throw new Error('A plan request only uses selected topics and checks.')
  if (v.operation === 'edit' && !v.text.trim()) throw new Error('Add a short note to edit.')
  // A guard against common accidental disclosures, not a general PII detector.
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|https?:\/\/|\bsk-[a-z0-9-]+|(?:\+?\d[\s().-]?){9,}|(?:password|passcode|api key|hasło|haslo|kod dostępu|klucz api)\s*(?:is|to|:|=)\s*\S+/i.test(v.text)) throw new Error('Remove contact details, links and credentials before sending. Use general labels instead.')
  const topics = [...new Set(v.topics)] as ConcernId[]
  if (v.services !== undefined && (!Array.isArray(v.services) || !v.services.length || v.services.length > 5 || v.services.some(id => !serviceOptions.some(s => s.id === id)))) throw new Error('Choose the apps you use.')
  const services = v.services as ServiceId[] | undefined
  const allowed = allowedFor(topics, services)
  if (v.taskIds.some(id => !allowed.includes(id as TaskId))) throw new Error('A check does not match the selected topics.')
  return { ...(services ? { services: [...new Set(services)] } : {}), ...(v.locale ? { locale: v.locale as 'en' | 'pl' } : {}), operation: v.operation as AgentRequest['operation'], topics, taskIds: [...new Set(v.taskIds)] as TaskId[], text: v.text.trim(), consent: true }
}
export function validateDraft(value: unknown, request: AgentRequest): AgentDraft {
  if (!value || typeof value !== 'object') throw new Error('The assistant did not return a usable draft.')
  const d = value as Record<string, unknown>, allowed = allowedFor(request.topics, request.services)
  if (!Array.isArray(d.taskIds) || d.taskIds.length > 13 || d.taskIds.some(x => !allowed.includes(x as TaskId)) || typeof d.editedText !== 'string' || d.editedText.length > 500) throw new Error('The draft included unsupported content. Your plan has not changed.')
  if (request.operation === 'plan' && !d.taskIds.length) throw new Error('No supported steps were returned. Try the local guide instead.')
  if (request.operation === 'edit' && !d.editedText.trim()) throw new Error('No edited note was returned.')
  if (/(?:jesteś (?:całkowicie |w pełni )?bezpieczna|na pewno bezpieczna|100% bezpiec|on cię śledzi|ona cię śledzi)/i.test(d.editedText)) throw new Error('The draft exceeded the editing scope. Your note has not changed.')
  if (/https?:\/\/|\b(?:guaranteed safe|completely safe|definitely safe|100% safe|risk score|he is tracking|she is tracking|you are safe)\b/i.test(d.editedText)) throw new Error('The draft exceeded the editing scope. Your note has not changed.')
  let prepared = emptyPlan()
  for (const id of (request.operation === 'edit' ? request.taskIds : d.taskIds as TaskId[])) prepared = addTask(prepared, id)
  return { taskIds: Object.keys(prepared.entries) as TaskId[], editedText: request.operation === 'edit' ? d.editedText.trim() : '' }
}
export function localDraft(ids: TaskId[]): AgentDraft {
  let prepared = emptyPlan()
  for (const id of ids) prepared = addTask(prepared, id)
  return { taskIds: Object.keys(prepared.entries) as TaskId[], editedText: '' }
}
export function previewEffect(id: TaskId, planIds: TaskId[]) {
  const t = taskById[id]
  return { title: t.title, impact: t.impact, boundary: t.boundary, preparations: t.prerequisites, remaining: planIds.filter(x => x !== id), url: t.url, source: t.source }
}
