import { lazy, Suspense, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { Experience } from '../features/companion/Experience'
import type { Plan } from '../features/plan/model'
import { acceptPlan, resetSession, selectMode, useSession } from './session'
import { clearNavigation, navigate, useNavigation, hasOpenedPlan } from './navigation'
import { useTranslation } from '../i18n/context'
import './improvements.css'

const LegacyApp = lazy(() => import('./LegacyApp'))
export default function App() {
  const route = useNavigation(), { translate } = useTranslation(), session = useSession()
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
    <div hidden={legacy}><Experience key={session.companionGeneration} openPlan={openPlan}/></div>
    {hasOpenedPlan() && <div hidden={!legacy}><Suspense fallback={<main className="loading-page" role="status">{translate('Opening your plan…')}</main>}>
      <LegacyApp returnToIntro={() => navigate({ area: 'intro' })}/>
    </Suspense></div>}
  </div>
}
