import { Component, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { LanguageSwitch } from '../i18n/LanguageProvider'
import { useTranslation } from '../i18n/context'
import { SavePlan } from '../features/plan/SavePlan'
import { usePlan, updatePlan, resetSession } from './session'
import { navigate, clearNavigation } from './navigation'
import { useHeaderOffset } from '../components/useHeaderOffset'
import '../features/plan/platform.css'
import './recovery.css'

// A failed lazy chunk must not unmount the whole application or erase its session.
export class PlanLoadBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

export function PlanRecovery() {
  const { translate } = useTranslation(), [plan] = usePlan()
  const header = useHeaderOffset<HTMLElement>()
  const notice = useRef<HTMLElement>(null)
  useEffect(() => { notice.current?.focus(); window.scrollTo({ top: 0, behavior: 'instant' }) }, [])
  return <div className="plan-recovery">
    <header className="recovery-header" ref={header}>
      <button className="text-button" onClick={() => navigate({ area: 'intro' })}>{translate('Back to introduction')}</button>
      <LanguageSwitch/>
      <a className="exit-link" href="https://www.wikipedia.org/" rel="noreferrer" onClick={event => { event.preventDefault(); document.documentElement.dataset.exiting = 'true'; flushSync(() => { resetSession(); clearNavigation() }); window.location.replace('https://www.wikipedia.org/') }}>{translate('Leave this page')}</a>
    </header>
    <main className="recovery-main">
      <section className="recovery-notice" role="alert" tabIndex={-1} ref={notice}>
        <h2>{translate('This page couldn’t open.')}</h2>
        <p>{translate('A connection problem or an update may have interrupted loading. Your plan is still in this tab. Save a private copy below before reloading.')}</p>
        <button className="button secondary" onClick={() => window.location.reload()}>{translate('Reload and clear this tab')}</button>
      </section>
      <SavePlan plan={plan} restore={updatePlan} saveOnly/>
    </main>
  </div>
}
