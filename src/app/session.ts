import { useSyncExternalStore } from 'react'
import type { SetStateAction } from 'react'
import { emptyPlan, mergePlan } from '../features/plan/model'
import type { Plan } from '../features/plan/model'
import type { ConcernId } from '../features/plan/content'
import type { ServiceId } from '../features/plan/services'

type CopyState = { snapshot: string; checked: boolean }
type Session = {
  companionGeneration: number;
  personal: Plan; example: Plan; mode: 'personal' | 'example'
  copies: { personal: CopyState | null; example: CopyState | null }
  undo: { personal: Plan | null; example: Plan | null }
  setup: { concerns: ConcernId[]; services: ServiceId[] }
}
const fresh = (): Session => ({ companionGeneration: 0, personal: emptyPlan(), example: { ...emptyPlan(), example: true }, mode: 'personal', undo: { personal: null, example: null }, copies: { personal: null, example: null }, setup: { concerns: [], services: [] } })
let session = fresh()
const listeners = new Set<() => void>()
function publish(next: Session) { session = next; listeners.forEach(fn => fn()) }
export function resetSession() { publish(fresh()) }
export function selectMode(mode: Session['mode']) { if (mode !== session.mode) publish({ ...session, mode }) }
export function updatePlan(next: SetStateAction<Plan>) {
  const mode = session.mode
  publish({ ...session, [mode]: typeof next === 'function' ? next(session[mode]) : next })
}
export function acceptPlan(plan: Plan) {
  const mode = plan.example ? 'example' : 'personal'
  publish({ ...session, mode, [mode]: mergePlan(session[mode], plan) })
}
export function updateSetup(next: Session['setup']) { publish({ ...session, setup: next }) }
export function markCopy(plan: Plan, checked = false) {
  const mode = plan.example ? 'example' : 'personal'
  publish({ ...session, copies: { ...session.copies, [mode]: { snapshot: JSON.stringify(plan), checked } } })
}
export function setUndoPlan(plan: Plan | null) { publish({ ...session, undo: { ...session.undo, [session.mode]: plan } }) }
export function clearPlan() { publish({ ...session, companionGeneration: session.companionGeneration + 1, [session.mode]: { ...emptyPlan(), example: session.mode === 'example' }, copies: { ...session.copies, [session.mode]: null }, undo: { personal: null, example: null }, setup: { concerns: [], services: [] } }) }
export function confirmCopy() {
  const copy = session.copies[session.mode]
  if (copy) publish({ ...session, copies: { ...session.copies, [session.mode]: { ...copy, checked: true } } })
}
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
export function useSession() { return useSyncExternalStore(subscribe, () => session) }
export function usePlan() { const state = useSession(); return [state[state.mode], updatePlan] as const }
