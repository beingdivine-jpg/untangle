import { useTranslation } from '../../i18n/context'
import type { Dispatch } from 'react'
import { ArrowLeft, ArrowRight, CircleHelp, Eye, ListChecks } from 'lucide-react'
import type { Action, State } from '../../app/state'
import { Button, Choice, SourceLink } from '../../components/Primitives'
import { preview } from '../../domain/rules'

export function Preview({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const { translate } = useTranslation()

  const prediction = preview(state.observations, state.action)
  return <section>
    <div className="section-heading"><span className="section-label">{translate("YOUR OPTIONS")}</span><h1 id="step-heading" tabIndex={-1}>{translate("What could a change do?")}</h1><p className="step-description">{translate("Choose an option to learn about it. This is a preview: clicking here won’t sign anything out or change your email.")}</p></div>
    <div className="action-choices"><Choice selected={state.action === 'sign-out'} onClick={() => dispatch({ type: 'ACTION', value: 'sign-out' })} description={translate("Learn what ending this sign-in on the tablet could affect.")}>{translate("Signing out of the shared tablet")}</Choice><Choice selected={state.action === 'recovery-change'} onClick={() => dispatch({ type: 'ACTION', value: 'recovery-change' })} description={translate("Learn what changing the email used to recover an account could affect.")}>{translate("Changing a recovery email")}</Choice></div>
    <div className="preview-label"><Eye size={18} aria-hidden="true" /><span>{translate("Just an explanation. Your accounts and original answers are unchanged.")}</span></div>
    <div className="preview-grid" key={state.action}><article className={`effect-panel ${prediction.confidence === 'Effect not modeled' ? 'unmodeled' : ''}`}><span className="icon-tile"><ArrowRight size={22} aria-hidden="true" /></span><h2>{translate("What could change")}</h2><span className="status-tag">{translate(prediction.confidence === 'Effect not modeled' ? 'We need more information' : 'Expected effect')}</span><p>{translate(prediction.expectedEffect)}</p><p className="small-print">{translate(prediction.explanation)}</p></article><article><span className="icon-tile lavender"><CircleHelp size={22} aria-hidden="true" /></span><h2>{translate("What still needs checking")}</h2><ul className="check-list">{prediction.unresolved.map(item => <li key={item}><span aria-hidden="true">○</span>{translate(item)}</li>)}</ul></article><article><span className="icon-tile peach"><ListChecks size={22} aria-hidden="true" /></span><h2>{translate("Before you decide")}</h2>{prediction.prerequisites.map(item => <p key={item}>{translate(item)}</p>)}{(state.safety === 'possibly' || state.safety === 'unsure') && <p className="tinted-note">{translate("You can talk these options through with someone you trust or a support service. You don’t have to make a change now.")}</p>}</article></div>
    <details className="source-register"><summary>{translate("Google’s guidance and the limits of this explanation")}</summary><div>{prediction.sourceIds.map(id => <SourceLink id={id} key={id} />)}<p>{translate("Checked 3 October 2026 · ")}{translate(prediction.applicability)}</p><p>{translate(prediction.limitations)}</p></div></details>
    <div className="next-explanation"><strong>{translate("Next: a list you can come back to during this visit")}</strong><p>{translate("Keep the unanswered questions together. If you check a setting, you can add what you saw.")}</p></div><div className="step-actions"><button className="text-button" onClick={() => dispatch({ type: 'STEP', value: 'connections' })}><ArrowLeft size={16} aria-hidden="true" />{translate("Back to my summary")}</button><Button arrow onClick={() => dispatch({ type: 'STEP', value: 'followup' })}>{translate("Make my next-step list")}</Button></div>
  </section>
}
