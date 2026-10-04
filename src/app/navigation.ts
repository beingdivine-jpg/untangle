import { useSyncExternalStore } from 'react'
import type { TaskId } from '../features/plan/content'

export type PlanView = 'plan' | 'explore' | 'together' | 'save' | 'support' | 'setup'
export type Route = { area: 'intro' | 'plan' | 'assistant' | 'demo' | 'walkthrough' | 'tour' | 'resolve' | 'people'; view?: PlanView; task?: TaskId; stage?: number; mode?: 'personal' | 'example'; returnRoute?: Route; supportTab?: 'help' | 'volunteer' | 'inbox' | 'admin'; learn?: boolean }
const initial = (): Route => {
  const view = new URLSearchParams(window.location.search).get('view')
  return view === 'resolve' ? { area: 'resolve' } : view === 'people' ? { area: 'people' } : view === 'demo' ? { area: 'tour' } : view === 'walkthrough' ? { area: 'walkthrough' } : view === 'plan' ? { area: 'plan', view: 'plan' } : view === 'assistant' ? { area: 'assistant' } : { area: 'intro' }
}
let current = initial()
let openedPlan = current.area === 'plan' || current.area === 'walkthrough'
export function hasOpenedPlan() { return openedPlan }
const listeners = new Set<() => void>()
// History contains opaque keys only. Concerns, guide IDs and notes never leave memory.
const routes = new Map<string, Route>()
const key = () => crypto.randomUUID()
function publish(route: Route) { if (route.area === 'plan' || route.area === 'walkthrough') openedPlan = true; current = route; listeners.forEach(fn => fn()) }
export function navigate(route: Route, replace = false) {
  const id = key()
  routes.set(id, route)
  const url = new URL(window.location.href)
  if (route.area === 'intro' || route.area === 'demo') url.searchParams.delete('view')
  else url.searchParams.set('view', route.area === 'resolve' || route.area === 'people' ? route.area : route.area === 'tour' ? 'demo' : route.area === 'assistant' ? 'assistant' : route.area === 'walkthrough' ? 'walkthrough' : 'plan')
  url.hash = ''
  window.history[replace ? 'replaceState' : 'pushState']({ untangleRoute: id }, '', url)
  publish(route)
}
export function clearNavigation() { routes.clear(); navigate({ area: 'intro' }, true) }
window.addEventListener('popstate', event => {
  publish(routes.get(event.state?.untangleRoute) ?? initial())
})
navigate(current, true)
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
export function useNavigation() { return useSyncExternalStore(subscribe, () => current) }
