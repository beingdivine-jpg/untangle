import { useTranslation } from '../../i18n/context'
import { ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, Mail, Monitor, Route, SlidersHorizontal } from 'lucide-react'
import { Button, Privacy, SourceLink } from '../../components/Primitives'
import { ImageReference } from './ImageReference'
import type { useLocalImage } from './useLocalImage'
import type { Dispatch } from 'react'
import type { Action, State } from '../../app/state'
import type { Topic } from '../../domain/types'

export function DetailedLanding({ state, dispatch, image, startExample }: { state: State; dispatch: Dispatch<Action>; image: ReturnType<typeof useLocalImage>; startExample: () => void }) {
  const { translate } = useTranslation()

  const begin = (topic: Topic) => { dispatch({ type: 'MANUAL' }); dispatch({ type: 'TOPIC', value: topic }) }
  return <section className="detailed-landing">
    <div className="home-grid">
      <div className="home-main">
        <section className="start-card" aria-labelledby="entry-title">
          <div className="card-heading"><span className="icon-tile peach"><Route size={24} aria-hidden="true" /></span><div><h2 id="entry-title">{translate("What would you like help with?")}</h2><p>{translate("Choose what sounds most like your situation.")}</p></div></div>
          <div className="starting-options">
            <button onClick={() => begin('Shared device')}><span className="option-icon"><Monitor size={24} aria-hidden="true" /></span><span><strong>{translate("We used to share a device")}</strong><small>{translate("Start with a shared tablet that might still be signed in to your Google account.")}</small></span><ArrowRight size={19} aria-hidden="true" /></button>
            <button onClick={() => begin('Recovery details')}><span className="option-icon"><Mail size={24} aria-hidden="true" /></span><span><strong>{translate("Our email accounts might be linked")}</strong><small>{translate("One email address may be used to help get back into another account.")}</small></span><ArrowRight size={19} aria-hidden="true" /></button>
            <button onClick={() => begin('Not sure')}><span className="option-icon"><CircleHelp size={24} aria-hidden="true" /></span><span><strong>{translate("I’m not sure where to start")}</strong><small>{translate("That’s okay. We’ll explain what to look for.")}</small></span><ArrowRight size={19} aria-hidden="true" /></button>
          </div>
          <div className="start-reassurance"><Check size={17} aria-hidden="true" /><span>{translate("You can skip any question. Nothing changes in your accounts.")}</span></div>
        </section>
        <details className="optional-context">
          <summary><span>{translate("Add a note or screenshot ")}<small>{translate("Optional")}</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
          <div><p className="small-print">{translate("Only add what you want to refer to during your check. You don’t need to describe your relationship or share personal details.")}</p><form onSubmit={e => { e.preventDefault(); dispatch({ type: 'MANUAL' }) }}><label className="input-label" htmlFor="concern">{translate("What would you like to review?")}</label><textarea id="concern" maxLength={2000} value={state.concern} onChange={e => dispatch({ type: 'CONCERN', value: e.target.value })} placeholder={translate("For example: we used to share a tablet.")} rows={3} /><p className="field-hint">{translate("This is a note for you. Untangle does not analyse it or read your accounts.")}</p><ImageReference image={image} /><Button secondary arrow type="submit">{translate("Start my review")}</Button></form></div>
        </details>
        <section className="how-card" id="how-it-works" aria-labelledby="how-title"><h2 id="how-title">{translate("Here’s what we’ll do together")}</h2><ol><li><span>1</span><div><strong>{translate("Ask a few simple questions")}</strong><p>{translate("Tell us what you know. “I’m not sure” is always okay.")}</p></div></li><li><span>2</span><div><strong>{translate("Explain what your answers mean")}</strong><p>{translate("See how a device or an email account could be connected.")}</p></div></li><li><span>3</span><div><strong>{translate("Make a small next-step list")}</strong><p>{translate("Understand your options, then choose what to check later.")}</p></div></li></ol></section>
      </div>
      <aside className="home-aside">
        <section className="example-card"><span className="icon-tile lavender"><BookOpen size={24} aria-hidden="true" /></span><span className="section-label">{translate("FIRST TIME HERE?")}</span><h2>{translate("Try it with a made-up story.")}</h2><p>{translate("Follow a shared tablet and two email accounts. We’ll give you the example answers and explain what they mean.")}</p><div className="example-mini" aria-hidden="true"><span><Monitor size={20} /><small>{translate("Shared tablet")}</small></span><span className="mini-connection">·····</span><span><Mail size={20} /><small>{translate("Google account")}</small></span></div><Button arrow className="full-width" onClick={startExample}>{translate("Show me an example")}</Button><span className="example-footnote">{translate("No sign-in. No personal details.")}</span></section>
        <section className="expect-card"><h2>{translate("You’re in control")}</h2><ul><li><Check size={17} aria-hidden="true" />{translate("Untangle cannot see your accounts.")}</li><li><Check size={17} aria-hidden="true" />{translate("It won’t change any settings.")}</li><li><Check size={17} aria-hidden="true" />{translate("Your answers stay in this tab.")}</li></ul><p>{translate("Refreshing or closing the page clears your answers.")}</p><Privacy /></section>
        <div className="scope-card"><SlidersHorizontal size={20} aria-hidden="true" /><p><strong>{translate("For now, we cover Google.")}</strong><br />{translate("This first version walks through a shared tablet and two Google accounts.")}</p></div>
      </aside>
    </div>
    <section className="about-strip" id="about"><div><h2>{translate("A little help with a complicated moment.")}</h2><p>{translate("Made for women reviewing digital connections after separation, on their own or with someone they trust.")}</p></div><details className="sources-details"><summary>{translate("About this prototype & our sources ")}<ChevronDown size={16} aria-hidden="true" /></summary><div><p>{translate("Built for ImpactHer at HackYeah. Google is a starting point, not a partner. This prototype uses your answers or made-up examples. It does not check live accounts.")}</p><p>{translate("Research, practitioner feedback and security review are still needed. Provider guidance checked 3 October 2026.")}</p>{(['devices', 'password', 'recovery', 'safety', 'accessibility'] as const).map(id => <SourceLink key={id} id={id} />)}</div></details></section>
  </section>
}
