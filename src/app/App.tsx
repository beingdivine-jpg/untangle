import { lazy, Suspense, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Experience } from '../features/companion/Experience'
import type { Plan } from '../features/plan/model'
import { acceptPlan, resetSession, selectMode, useSession } from './session'
import { clearNavigation, navigate, useNavigation, hasOpenedPlan } from './navigation'
import { useTranslation } from '../i18n/context'
import './improvements.css'
import { PlanLoadBoundary, PlanRecovery } from './PlanRecovery'
import { useAccount } from '../features/community/client'
import { JudgeWalkthrough } from '../features/walkthrough/JudgeWalkthrough'

const Resolve = lazy(() => import('../features/resolve/Resolve').then(m => ({ default: m.Resolve })))
const Community = lazy(() => import('../features/community/Community').then(m => ({ default: m.Community })))
const LegacyApp = lazy(() => import('./LegacyApp'))
export default function App() {
  const route = useNavigation(), { translate } = useTranslation(), session = useSession(), account = useAccount()
  const [generation, setGeneration] = useState(0)
  const legacy = route.area === 'plan' || route.area === 'walkthrough'
  useEffect(() => {
    const clear = () => {
      document.documentElement.dataset.exiting = 'true'
      flushSync(() => { resetSession(); setGeneration(n => n + 1) })
    }
    const restore = (event: PageTransitionEvent) => {
      if (event.persisted) { clearNavigation(); delete document.documentElement.dataset.exiting }
    }
    window.addEventListener('pagehide', clear); window.addEventListener('pageshow', restore)
    return () => { window.removeEventListener('pagehide', clear); window.removeEventListener('pageshow', restore) }
  }, [])
  useEffect(() => { selectMode(route.mode ?? (route.area === 'demo' ? 'example' : route.area === 'intro' ? 'personal' : session.mode)) }, [route, session.mode])
  const openPlan = (plan?: Plan, start = false) => {
    if (plan) acceptPlan(plan); else selectMode('personal')
    navigate({ area: 'plan', view: start ? 'setup' : 'plan', mode: plan?.example ? 'example' : 'personal' })
  }
  return <div className="untangle-app" key={generation}>
    <div hidden={legacy || route.area === 'tour' || route.area === 'resolve' || route.area === 'people'}><Experience key={session.companionGeneration} openPlan={openPlan}/></div>
    {route.area === 'tour' && <JudgeWalkthrough />}
    {(route.area === 'resolve' || route.area === 'people') && <PlanLoadBoundary fallback={<PlanRecovery/>}><Suspense fallback={<main className="loading-page" role="status">{translate('Opening your plan…')}</main>}>{route.area === 'resolve' ? <Resolve/> : <Community key={account?.userId ?? 'guest'}/>}</Suspense></PlanLoadBoundary>}
    {hasOpenedPlan() && <div hidden={!legacy}><PlanLoadBoundary fallback={<PlanRecovery/>}><Suspense fallback={<main className="loading-page" role="status">{translate('Opening your plan…')}</main>}>
      <LegacyApp returnToIntro={() => navigate({ area: 'intro' })}/>
    </Suspense></PlanLoadBoundary></div>}
  </div>
}
