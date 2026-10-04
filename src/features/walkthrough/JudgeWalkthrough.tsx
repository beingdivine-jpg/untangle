import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCheck, FilePenLine, RotateCcw, X } from 'lucide-react'
import { Thread } from '../../components/Thread'
import { LanguageSwitch } from '../../i18n/LanguageProvider'
import { useTranslation } from '../../i18n/context'
import { navigate, useNavigation } from '../../app/navigation'
import { resetSession, selectMode, setUndoPlan, updatePlan } from '../../app/session'
import { localDraft, previewEffect, stories } from '../companion/agentCore'
import { taskById } from '../plan/content'
import type { TaskId } from '../plan/content'
import { addTask, emptyPlan, nextTask } from '../plan/model'
import type { Plan } from '../plan/model'
import './walkthrough.css'

const story = stories[0]

export function JudgeWalkthrough() {
  const { translate, href } = useTranslation(), route = useNavigation()
  const [step, setStep] = useState(0)
  const [choices, setChoices] = useState<TaskId[]>([])
  const [edited, setEdited] = useState<string | null>(null)
  const [useRewrite, setUseRewrite] = useState(true)
  const [result, setResult] = useState<Plan | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const steps = [translate('The situation'), translate('Suggested checks'), translate('Change preview'), translate('Wording help'), translate('Your approval'), translate('The result')]
  const titles = [translate('One story. One clear route.'), translate('A proposal you can change.'), translate('A password is only one piece.'), translate('Clearer words. Your approval.'), translate('You decide what stays.'), translate('A plan she can act on.')]
  const guidance = [
    translate('Maya shared a laptop and photos with her ex. Use her fictional story to see how Untangle helps.'),
    translate('The planner matched guides to her story. Choose what to keep; preparation checks stay with the steps that need them.'),
    translate('Before deciding, read what a password change affects and what still needs checking.'),
    translate('The assistant proposes clearer wording. Edit it, accept it, or keep the original. You have the last word.'),
    translate('Review your choices. Approving creates a fictional plan in this tab; it makes no changes to accounts.'),
    translate('The result is a practical next step, with sources and unanswered checks. Maya decides when to act.'),
  ]
  const selected = localDraft(choices).taskIds
  const suggestion = edited ?? translate(story.rewrite)
  const note = useRewrite ? suggestion.trim() : translate(story.note)
  const effect = previewEffect(story.prediction, selected)
  const first = result && nextTask(result)
  // Only this component owns the tour draft. Personal and example sessions stay intact until handoff.
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [step])
  const exit = () => navigate(route.returnRoute ?? { area: 'intro' })
  const restart = () => { setChoices([]); setEdited(null); setUseRewrite(true); setResult(null); setStep(0) }
  const approve = () => {
    let plan: Plan = { ...emptyPlan(), example: true, concerns: [...story.topics], services: ['google'], note }
    for (const id of selected) plan = addTask(plan, id)
    setResult(plan); setStep(5)
  }
  const openExample = () => {
    if (!result) return
    selectMode('example'); updatePlan({ ...result, note }); setUndoPlan(null)
    navigate({ area: 'plan', view: 'plan', mode: 'example' })
  }
  const chosenChecks = <ul className="jt-summary-list">{selected.map(id => <li key={id}><Check size={16} aria-hidden="true"/>{translate(taskById[id].title)}</li>)}</ul>
  return <div className="judge-tour">
    <a className="skip-link" href="#demo-content">{translate('Skip to content')}</a>
    <header className="jt-header">
      <button className="wordmark" aria-label={translate('Untangle home')} onClick={exit}><Thread small/><span>untangle<span className="wordmark-period">.</span></span></button>
      <span className="jt-header-label">{translate('Demo walkthrough')}</span>
      <LanguageSwitch/>
      <button className="jt-exit" onClick={exit}>{translate('Exit demo')}<X size={16} aria-hidden="true"/></button>
      <a className="jt-quick-exit" href="https://www.wikipedia.org/" rel="noreferrer" onClick={e => { e.preventDefault(); document.documentElement.dataset.exiting = 'true'; flushSync(resetSession); window.location.replace('https://www.wikipedia.org/') }}>{translate('Leave this page')}<ArrowUpRight size={14} aria-hidden="true"/></a>
    </header>
    <main id="demo-content" className="jt-main">
      <div className="jt-tour-meta"><span>{translate('A two-minute product tour')}</span><span>{translate('Fictional story · Your own plan stays separate')}</span></div>
      <ol className="jt-progress" aria-label={translate('Walkthrough progress')}>
        {steps.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} className={index < step ? 'is-complete' : ''}><span className="jt-step-number">{index < step ? <Check size={13} aria-hidden="true"/> : `0${index + 1}`}</span><span>{label}</span></li>)}
      </ol>
      <div className="jt-stage" key={step}>
        <section className="jt-coach" aria-labelledby="demo-heading">
          <p className="jt-eyebrow">{translate('Step')} {step + 1} / 6 <span>— {steps[step]}</span></p>
          <h1 id="demo-heading" tabIndex={-1} ref={heading}>{titles[step]}</h1>
          <p className="jt-guidance">{guidance[step]}</p>
          <div className="jt-takeaway"><span className="jt-small-label">{translate('What this shows')}</span><p>{[
            translate('A starting point without sign-up or technical knowledge.'),
            translate('Visible reasoning: story → relevant guides → preparation first.'),
            translate('Sourced explanations of effects and limits, before any action.'),
            translate('AI assistance with a human decision at every handoff.'),
            translate('Suggestions become a plan only after approval.'),
            translate('A clear first step, without pretending everything is resolved.'),
          ][step]}</p></div>
          <p className="jt-demo-disclosure">{translate('Scripted assistant examples. Real planning logic. No live AI call or account scan.')}</p>
        </section>
        <section className="jt-work" aria-label={steps[step]}>
          {step === 0 && <>
            <div className="jt-story-header"><div><span className="jt-small-label">{translate('Meet Maya · Fictional example')}</span><h2>{translate(story.title)}</h2></div><Thread small/></div>
            <ul className="jt-facts">{story.facts.map((fact, i) => <li key={fact}><span>0{i + 1}</span>{translate(fact)}</li>)}</ul>
            <div className="jt-note"><span className="jt-small-label">{translate('In her words')}</span><p>“{translate(story.note)}”</p></div>
            <div className="jt-actions"><button className="jt-primary" onClick={() => { setChoices(localDraft([...story.taskIds]).taskIds); setStep(1) }}>{translate('Build Maya’s draft')}<ArrowRight size={18} aria-hidden="true"/></button></div>
          </>}
          {step === 1 && <>
            <div className="jt-receipt"><CheckCheck size={20} aria-hidden="true"/><div><strong>{translate('Draft ready for review')}</strong><p>{translate('3 story details → 6 suggested checks. Nothing applied.')}</p></div></div>
            <fieldset className="jt-choices"><legend>{translate('Choose the checks to include')}</legend>{story.taskIds.map(id => {
              const required = selected.some(other => taskById[other].prerequisites.includes(id))
              return <label key={id} className={selected.includes(id) ? 'is-selected' : ''}><input type="checkbox" checked={selected.includes(id)} disabled={required} onChange={e => setChoices(current => e.target.checked ? [...current, id] : current.filter(value => value !== id))}/><span>{translate(taskById[id].title)}{required && <small>{translate('Preparation for your selected checks')}</small>}</span></label>
            })}</fieldset>
            <div className="jt-actions"><button className="jt-primary" disabled={!selected.length} onClick={() => setStep(2)}>{translate('Preview a change')}<ArrowRight size={18} aria-hidden="true"/></button><span className="jt-action-hint" role="status">{translate('Selected checks')}: {selected.length}</span></div>
          </>}
          {step === 2 && <>
            <span className="jt-small-label">{translate('Example: changing a Google password')}</span>
            <div className="jt-effect"><h2>{translate('What it can change')}</h2><p>{translate(effect.impact)}</p></div>
            <div className="jt-effect jt-effect-limit"><h2>{translate('What still needs attention')}</h2><p>{translate(effect.boundary)}</p></div>
            <a className="jt-source" href={href(effect.url)} target="_blank" rel="noreferrer">{translate(effect.source)}<ArrowUpRight size={14} aria-hidden="true"/><span className="sr-only">{translate('Opens in a new tab')}</span></a>
            <div className="jt-actions"><button className="jt-primary" onClick={() => setStep(3)}>{translate('Try wording help')}<ArrowRight size={18} aria-hidden="true"/></button></div>
          </>}
          {step === 3 && <>
            <div className="jt-note"><span className="jt-small-label">{translate('Original note')}</span><p>{translate(story.note)}</p></div>
            <label className="jt-edit-label" htmlFor="demo-wording"><FilePenLine size={18} aria-hidden="true"/>{translate('Suggested wording · Edit if you like')}</label>
            <textarea id="demo-wording" value={suggestion} maxLength={500} onChange={e => setEdited(e.target.value)} aria-describedby="demo-edit-hint"/>
            <p id="demo-edit-hint" className="jt-action-hint">{translate('A scripted example of the editing assistant. Nothing is sent.')}</p>
            <div className="jt-actions"><button className="jt-primary" disabled={!suggestion.trim()} onClick={() => { setUseRewrite(true); setStep(4) }}>{translate('Use this wording')}<ArrowRight size={18} aria-hidden="true"/></button><button className="jt-secondary" onClick={() => { setUseRewrite(false); setStep(4) }}>{translate('Keep original')}</button></div>
          </>}
          {step === 4 && <>
            <span className="jt-small-label">{translate('Ready when you are')}</span>
            {chosenChecks}
            <div className="jt-note"><span className="jt-small-label">{translate(useRewrite ? 'Your chosen wording' : 'Original wording kept')}</span><p>{note}</p></div>
            <div className="jt-actions"><button className="jt-primary" onClick={approve}>{translate('Keep this demo plan')}<Check size={18} aria-hidden="true"/></button></div>
          </>}
          {step === 5 && result && first && <>
            <div className="jt-receipt jt-success"><CheckCheck size={23} aria-hidden="true"/><div><strong>{translate('Walkthrough complete')}</strong><p>{translate('Checks in the plan')}: {selected.length} · {translate('Account changes')}: 0</p></div></div>
            <span className="jt-small-label">{translate('Her first step')}</span>
            <h2 className="jt-result-title">{translate(taskById[first].title)}</h2>
            <p className="jt-result-intro">{translate(taskById[first].intro)}</p>
            <div className="jt-pending"><span aria-hidden="true"/>{translate('Not checked yet')}</div>
            <details className="jt-result-details"><summary>{translate('See the full example plan')}</summary>{chosenChecks}<p className="jt-result-note">{note}</p></details>
            <div className="jt-actions"><button className="jt-primary" onClick={openExample}>{translate('Open example plan')}<ArrowRight size={18} aria-hidden="true"/></button><button className="jt-secondary" onClick={exit}>{translate('Finish tour')}</button></div>
            <p className="jt-action-hint">{translate('Opening this result replaces only the practice plan. Your personal plan stays as it is.')}</p>
          </>}
        </section>
      </div>
      <footer className="jt-footer"><button className="jt-secondary" onClick={step ? () => setStep(s => s - 1) : exit}><ArrowLeft size={15} aria-hidden="true"/>{translate(step ? 'Previous step' : 'Back to the product')}</button><span>{translate('You control the pace.')}</span>{step > 0 && <button className="jt-secondary" onClick={restart}><RotateCcw size={14} aria-hidden="true"/>{translate('Restart tour')}</button>}</footer>
    </main>
  </div>
}
