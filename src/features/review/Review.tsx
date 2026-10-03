import type { Dispatch } from 'react'
import { ArrowLeft, BookOpen, ChevronDown, CircleHelp, MapPin } from 'lucide-react'
import { Button, Choice, SourceLink } from '../../components/Primitives'
import type { Action, State } from '../../app/state'
import type { Account, CheckId } from '../../domain/types'
import { questions } from '../../content/questions'
import { scenarios } from '../../domain/scenarios'
import { PASSWORD_EXCEPTIONS } from '../../domain/rules'

export function Review({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const q = questions(state.observations)[state.question]
  const sample = questions(scenarios[state.scenario].observations)[state.question].sample
  const advance = () => state.question === 4 ? dispatch({ type: 'STEP', value: 'connections' }) : dispatch({ type: 'QUESTION', value: state.question + 1 })
  const back = () => state.question > 0 ? dispatch({ type: 'QUESTION', value: state.question - 1 }) : dispatch({ type: 'STEP', value: 'start' })
  return <section className="question-layout">
    <div className="question-main app-card">
      <div className="question-progress"><span>Question {state.question + 1} of 5</span><span>You can skip any question</span></div>
      <div className="question-track" aria-hidden="true"><span style={{ width: `${(state.question + 1) * 20}%` }} /></div>
      <h1 id="step-heading" tabIndex={-1}>{q.title}</h1><p className="step-description">{q.description}</p><div className="inline-definition"><strong>{q.term}</strong><p>{q.definition}</p></div>
      {state.mode === 'example' && <div className="example-context"><BookOpen size={20} aria-hidden="true" /><div><strong>In this made-up example</strong><p>{state.observations.account === 'Main account' ? sample : 'There are no example details for this nickname. You can leave the answers as “I’m not sure”.'}</p><span>We’ve picked the example answer below. You can change it.</span></div></div>}
      {state.question === 0 && state.observations.passwordChanged && <aside className="context-note"><BookOpen size={20} aria-hidden="true" /><div><strong>A changed password may leave some devices signed in.</strong><p>{PASSWORD_EXCEPTIONS} A recent activity time can also come from automatic updates. It doesn’t tell us who used the device.</p><SourceLink id="password" /></div></aside>}
      <div className="choices" aria-label={q.title}>{q.options.map(option => <Choice key={option.value} selected={state.observations[q.key] === option.value} onClick={() => q.key === 'account' ? dispatch({ type: 'ACCOUNT', value: option.value as Account }) : dispatch({ type: 'ANSWER', key: q.key as CheckId, value: option.value })} description={'description' in option ? option.description : undefined}>{option.label}</Choice>)}</div>
      {q.key === 'account' && <p className="field-hint">Changing the account nickname clears answers about the previous account.</p>}
      <details className="where-help"><summary><MapPin size={17} aria-hidden="true" />Show me where to look<ChevronDown size={16} aria-hidden="true" /></summary><div><p>You can read these steps without opening your account now.</p><ol>{q.where.map(item => <li key={item}>{item}</li>)}</ol><SourceLink id={q.source}>Read Google’s instructions</SourceLink></div></details>
      <div className="step-actions"><button className="text-button" onClick={back}><ArrowLeft size={16} aria-hidden="true" />Back</button><div>{q.key !== 'account' && <button className="text-button" onClick={() => { dispatch({ type: 'SKIP', key: q.key as CheckId }); advance() }}>Skip for now</button>}<Button arrow onClick={() => { if (q.key !== 'account') dispatch({ type: 'REVIEWED', key: q.key as CheckId }); advance() }}>{state.question === 4 ? 'Show my summary' : 'Continue'}</Button></div></div>
    </div>
    <aside className="review-margin"><section className="explain-card"><span className="icon-tile lavender"><CircleHelp size={22} aria-hidden="true" /></span><h2>{q.term}</h2><p>{q.definition}</p><div className="why-note"><h3>Why this matters</h3><p>{q.why}</p></div></section><div className="gentle-note"><strong>You don’t need to know every answer.</strong><p>Choose “I’m not sure” or skip. We’ll keep that question on your list for later.</p></div></aside>
  </section>
}
