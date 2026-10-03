import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { BookOpen, Check, ChevronRight, CircleHelp, Home, MoveUpRight, X } from 'lucide-react'
import { reducer, initialState } from './state'
import { Thread } from '../components/Thread'
import { Button, Privacy, SourceLink } from '../components/Primitives'
import { Help } from '../components/Help'
import type { Plan } from '../features/plan/model'
import { Platform } from '../features/plan/Platform'
import { Welcome } from '../features/guide/Welcome'
import { Guide } from '../features/guide/Guide'
import { Start } from '../features/start/Start'
import { Review } from '../features/review/Review'
import { Connections } from '../features/connections/Connections'
import { Preview } from '../features/preview/Preview'
import { Followup } from '../features/followup/Followup'
import { useLocalImage } from '../features/start/useLocalImage'
import { ImageReference } from '../features/start/ImageReference'
import { scenarios } from '../domain/scenarios'
import type { ScenarioId, Step } from '../domain/types'

const journey: { id: Step; label: string; description: string }[] = [
  { id: 'start', label: 'Start', description: 'Choose a starting point' },
  { id: 'review', label: 'Your answers', description: 'A few simple questions' },
  { id: 'connections', label: 'Your summary', description: 'Understand what you told us' },
  { id: 'preview', label: 'Your options', description: 'See what a change could do' },
  { id: 'followup', label: 'Next steps', description: 'Keep a list for later' },
]
const EXIT_DESTINATION = 'https://www.wikipedia.org/'

export default function LegacyApp({ initialPlan, returnToIntro, clearSeed }: { initialPlan?: Plan; returnToIntro?: () => void; clearSeed?: () => void }) {
  const planRef = useRef<{ home: () => void }>(null)
  const [workspace, setWorkspace] = useState(() => new URLSearchParams(window.location.search).get('view') !== 'walkthrough')
  const [workspaceVersion, setWorkspaceVersion] = useState(0)
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const image = useLocalImage()
  const [confirmReset, setConfirmReset] = useState(false)
  const [info, setInfo] = useState<'how' | 'help' | 'about' | null>(null)
  const clearImage = image.clear
  const reset = useCallback(() => { clearImage(); dispatch({ type: 'RESET' }); setConfirmReset(false); setInfo(null) }, [clearImage])
  const clearAll = useCallback(() => { reset(); clearSeed?.(); setWorkspaceVersion(v => v + 1) }, [reset, clearSeed])
  const resetAndFocus = () => { flushSync(reset); window.scrollTo({ top: 0, behavior: 'instant' }); document.querySelector<HTMLElement>('#hero-title')?.focus() }
  const exit = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    document.documentElement.dataset.exiting = 'true'
    flushSync(clearAll)
    window.location.replace(EXIT_DESTINATION)
  }
  useEffect(() => {
    const hide = () => { document.documentElement.dataset.exiting = 'true'; flushSync(clearAll) }
    const restore = (e: PageTransitionEvent) => { if (e.persisted) { flushSync(clearAll); delete document.documentElement.dataset.exiting } }
    window.addEventListener('pagehide', hide)
    window.addEventListener('pageshow', restore)
    return () => { window.removeEventListener('pagehide', hide); window.removeEventListener('pageshow', restore) }
  }, [clearAll])
  useEffect(() => {
    if (state.active && !workspace) {
      document.getElementById('step-heading')?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [workspace, state.active, state.step, state.question, state.startPhase, state.scenario, state.guide?.step, state.guide?.example])
  useEffect(() => { if (info) document.getElementById('info-heading')?.focus() }, [info])
  const startExample = (scenario: ScenarioId = 'tablet') => { image.clear(); setConfirmReset(false); setInfo(null); dispatch({ type: 'EXAMPLE', scenario }) }
  const beginGuide = (example: boolean) => { image.clear(); setConfirmReset(false); setInfo(null); dispatch({ type: 'BEGIN_GUIDE', example }) }
  const index = journey.findIndex(item => item.id === state.step)
  const closeInfo = () => { flushSync(() => setInfo(null)); document.getElementById(workspace ? 'platform-heading' : state.active ? 'step-heading' : 'hero-title')?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }) }
  return <>
    <a className="skip-link" href={info ? "#info-heading" : workspace ? "#platform-main" : "#main-content"}>Skip to content</a>
    <div className="header-wrap"><header className="site-header">
      <button className="wordmark" aria-label="Untangle home" onClick={() => workspace ? (setInfo(null), planRef.current?.home()) : state.active ? setConfirmReset(true) : closeInfo()}><Thread small /><span>untangle<span className="wordmark-period">.</span></span></button>
      <span className="brand-description">{returnToIntro ? <button className="text-button" onClick={returnToIntro}>Back to introduction</button> : 'One step at a time.'}</span>
      {workspace && <button className="platform-help" aria-label="Help & words" onClick={() => setInfo(info === 'help' ? null : 'help')}><CircleHelp size={18} aria-hidden="true"/><span>Help & words</span></button>}
      <a className="exit-link" href={EXIT_DESTINATION} onClick={exit} rel="noreferrer">Leave this page<MoveUpRight size={16} aria-hidden="true" /></a>
    </header></div>
    {!workspace && <nav className="app-tabs" aria-label="Main navigation">
      <button className={!info ? 'active' : ''} aria-current={!info ? 'page' : undefined} onClick={closeInfo}><Home size={17} aria-hidden="true" />{state.active ? 'My check' : 'Start here'}</button>
      {state.active && !state.guide && <button className={info === 'how' ? 'active' : ''} aria-current={info === 'how' ? 'page' : undefined} onClick={() => setInfo(info === 'how' ? null : 'how')}><BookOpen size={17} aria-hidden="true" />How it works</button>}
      <button id="help-trigger" className={info === 'help' ? 'active' : ''} aria-current={info === 'help' ? 'page' : undefined} onClick={() => setInfo(info === 'help' ? null : 'help')}><CircleHelp size={17} aria-hidden="true" />Help & words</button>
      <button onClick={() => { setWorkspace(true); setInfo(null) }}>Back to my plan</button>
      <span className="tab-reassurance">No Untangle account needed</span>
    </nav>}
    {info && <section className="info-panel app-card" role="main" aria-labelledby="info-heading"><button className="icon-button" aria-label="Close information" onClick={closeInfo}><X size={20} aria-hidden="true" /></button><span className="section-label">A LITTLE EXPLANATION</span><h1 id="info-heading" tabIndex={-1}>{info === 'how' ? 'What does Untangle actually do?' : info === 'help' ? 'Let’s make this easier to understand.' : 'About this prototype'}</h1>{info === 'help' ? <Help /> : <><p className="step-description">{info === 'how' ? 'Untangle helps you think through devices and accounts you may have shared with someone. It uses what you tell us, and explains what you might want to check next.' : 'Untangle is an ImpactHer at HackYeah prototype for women reviewing digital connections after separation. It helps you organise checks across services, understand effects before changes, and keep unanswered questions. A sourced research review informed this prototype; practitioner, security and real-user validation are still needed.'}</p><ol className="how-inline"><li><strong>Answer a few questions.</strong> We explain unfamiliar words as you go.</li><li><strong>Read your summary.</strong> See what you know and what you haven’t checked.</li><li><strong>Understand your options.</strong> See what a change might affect. Nothing changes here.</li><li><strong>Keep a next-step list.</strong> You can review it with someone you trust.</li></ol><p>You don’t need to connect an account, type a password or know all the answers.</p><Privacy /><a className="source-link" href="/research.html" target="_blank" rel="noreferrer">Read the product research and limitations</a>{info === 'about' && <div className="info-sources">{(['devices', 'password', 'recovery', 'safety'] as const).map(id => <SourceLink id={id} key={id} />)}</div>}</>}<Button secondary onClick={closeInfo}>{workspace ? 'Back to my plan' : state.active ? 'Back to my check' : 'Back to start'}</Button></section>}
    {confirmReset && <section className="reset-confirm" role="alert"><div><strong>Clear this review and start fresh?</strong><p>Your answers, image and follow-up notes will be removed from this tab.</p></div><div><Button secondary onClick={() => setConfirmReset(false)}>Keep reviewing</Button><Button onClick={resetAndFocus}>Yes, clear review</Button></div></section>}
    <div hidden={!!info || !workspace}><Platform initialPlan={workspaceVersion === 0 ? initialPlan : undefined} key={workspaceVersion} homeRef={planRef} onWalkthrough={() => { setWorkspace(false); setInfo(null); window.scrollTo({ top: 0, behavior: 'instant' }) }}/></div>
    {!workspace && <div hidden={!!info}>{!state.active ? <Welcome state={state} dispatch={dispatch} image={image} startExample={() => startExample()} begin={beginGuide} /> : state.guide ? <Guide guide={state.guide} dispatch={dispatch} onFinish={resetAndFocus} /> : <main id="main-content" className="review-shell">
      <div className="review-toolbar"><div className="mode-label"><span className={`status-tag ${state.mode === 'example' ? 'lavender' : 'sage'}`}>{state.mode === 'example' ? <BookOpen size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}<span>{state.mode === 'example' ? 'Fictional example' : 'My check'}</span></span>{state.mode === 'example' ? <label className="scenario-picker"><span>Example story</span><select aria-label="Choose fictional scenario" value={state.scenario} onChange={e => startExample(e.target.value as ScenarioId)}>{Object.entries(scenarios).map(([id, scenario]) => <option key={id} value={id}>{scenario.title}</option>)}</select></label> : <span className="toolbar-note">We use your answers. We can’t see your accounts.</span>}</div><button className="text-button clear-button" onClick={() => setConfirmReset(true)}>Clear this review<X size={14} aria-hidden="true" /></button></div>
      <nav className="journey" aria-label="Review progress"><p className="journey-caption">Step {index + 1} of 5 <ChevronRight size={14} aria-hidden="true" /><strong>{journey[index].description}</strong></p><ol>{journey.map((item, i) => <li key={item.id} className={`${i === index ? 'current' : ''} ${i < index ? 'past' : ''}`}><button disabled={i > state.furthestStep} aria-current={i === index ? 'step' : undefined} onClick={() => dispatch({ type: 'STEP', value: item.id })}><span className="step-number">{i < index ? <Check size={13} aria-hidden="true" /> : i + 1}</span><span>{item.label}</span></button></li>)}</ol></nav>
      {state.mode === 'example' && <p className="practice-notice"><BookOpen size={17} aria-hidden="true" />You’re practising with made-up details. None of this comes from your accounts.</p>}
      {(state.safety === 'possibly' || state.safety === 'unsure') && <aside className="safety-context"><span>You can just read and learn. You don’t have to change anything.</span><SourceLink id="safety">Support information (US)</SourceLink></aside>}
      {image.url && <details className="review-image"><summary>My screenshot — a reference for these questions</summary><ImageReference image={image} compact /></details>}
      {state.concern && <details className="review-note"><summary>My note</summary><p>{state.concern}</p></details>}
      <div className="step-content" key={`${state.step}-${state.question}-${state.startPhase}-${state.scenario}`}>{state.step === 'start' && <Start state={state} dispatch={dispatch} />}{state.step === 'review' && <Review state={state} dispatch={dispatch} />}{state.step === 'connections' && <Connections state={state} dispatch={dispatch} />}{state.step === 'preview' && <Preview state={state} dispatch={dispatch} />}{state.step === 'followup' && <Followup state={state} dispatch={dispatch} />}</div>
      <div className="review-bottom"><span className="small-print">Your answers stay in this tab. Refreshing clears them.</span><button className="text-button" onClick={() => setInfo('help')}><CircleHelp size={17} aria-hidden="true" />I need an explanation</button></div>
    </main>}</div>}
    <footer className="site-footer"><div><Thread small /><span>One small step is still a step.</span></div><div>{returnToIntro&&<button className="text-button" onClick={returnToIntro}>Back to introduction</button>}<button className="text-button" onClick={() => setInfo('about')}>About Untangle</button></div></footer>
    <div className="sr-only" role="status" aria-live="polite">{workspace ? 'Your Untangle plan workspace.' : state.guide ? `One small check. ${state.guide.example ? 'Made-up example.' : ''}` : state.active ? `${journey[index].label}, step ${index + 1} of 5${state.step === 'review' ? `, question ${state.question + 1} of 5` : ''}` : 'Welcome to Untangle.'}</div>
  </>
}
