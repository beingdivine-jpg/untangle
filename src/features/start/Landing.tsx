import { ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, Mail, Monitor, Route, SlidersHorizontal } from 'lucide-react'
import { Button, Privacy, SourceLink } from '../../components/Primitives'
import { ImageReference } from './ImageReference'
import type { useLocalImage } from './useLocalImage'
import type { Dispatch } from 'react'
import type { Action, State } from '../../app/state'
import type { Topic } from '../../domain/types'

export function DetailedLanding({ state, dispatch, image, startExample }: { state: State; dispatch: Dispatch<Action>; image: ReturnType<typeof useLocalImage>; startExample: () => void }) {
  const begin = (topic: Topic) => { dispatch({ type: 'MANUAL' }); dispatch({ type: 'TOPIC', value: topic }) }
  return <section className="detailed-landing">
    <div className="home-grid">
      <div className="home-main">
        <section className="start-card" aria-labelledby="entry-title">
          <div className="card-heading"><span className="icon-tile peach"><Route size={24} aria-hidden="true" /></span><div><h2 id="entry-title">What would you like help with?</h2><p>Choose what sounds most like your situation.</p></div></div>
          <div className="starting-options">
            <button onClick={() => begin('Shared device')}><span className="option-icon"><Monitor size={24} aria-hidden="true" /></span><span><strong>We used to share a device</strong><small>Start with a shared tablet that might still be signed in to your Google account.</small></span><ArrowRight size={19} aria-hidden="true" /></button>
            <button onClick={() => begin('Recovery details')}><span className="option-icon"><Mail size={24} aria-hidden="true" /></span><span><strong>Our email accounts might be linked</strong><small>One email address may be used to help get back into another account.</small></span><ArrowRight size={19} aria-hidden="true" /></button>
            <button onClick={() => begin('Not sure')}><span className="option-icon"><CircleHelp size={24} aria-hidden="true" /></span><span><strong>I’m not sure where to start</strong><small>That’s okay. We’ll explain what to look for.</small></span><ArrowRight size={19} aria-hidden="true" /></button>
          </div>
          <div className="start-reassurance"><Check size={17} aria-hidden="true" /><span>You can skip any question. Nothing changes in your accounts.</span></div>
        </section>
        <details className="optional-context">
          <summary><span>Add a note or screenshot <small>Optional</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
          <div><p className="small-print">Only add what you want to refer to during your check. You don’t need to describe your relationship or share personal details.</p><form onSubmit={e => { e.preventDefault(); dispatch({ type: 'MANUAL' }) }}><label className="input-label" htmlFor="concern">What would you like to review?</label><textarea id="concern" maxLength={2000} value={state.concern} onChange={e => dispatch({ type: 'CONCERN', value: e.target.value })} placeholder="For example: we used to share a tablet." rows={3} /><p className="field-hint">This is a note for you. Untangle does not analyse it or read your accounts.</p><ImageReference image={image} /><Button secondary arrow type="submit">Start my review</Button></form></div>
        </details>
        <section className="how-card" id="how-it-works" aria-labelledby="how-title"><h2 id="how-title">Here’s what we’ll do together</h2><ol><li><span>1</span><div><strong>Ask a few simple questions</strong><p>Tell us what you know. “I’m not sure” is always okay.</p></div></li><li><span>2</span><div><strong>Explain what your answers mean</strong><p>See how a device or an email account could be connected.</p></div></li><li><span>3</span><div><strong>Make a small next-step list</strong><p>Understand your options, then choose what to check later.</p></div></li></ol></section>
      </div>
      <aside className="home-aside">
        <section className="example-card"><span className="icon-tile lavender"><BookOpen size={24} aria-hidden="true" /></span><span className="section-label">FIRST TIME HERE?</span><h2>Try it with a made-up story.</h2><p>Follow a shared tablet and two email accounts. We’ll give you the example answers and explain what they mean.</p><div className="example-mini" aria-hidden="true"><span><Monitor size={20} /><small>Shared tablet</small></span><span className="mini-connection">·····</span><span><Mail size={20} /><small>Google account</small></span></div><Button arrow className="full-width" onClick={startExample}>Show me an example</Button><span className="example-footnote">No sign-in. No personal details.</span></section>
        <section className="expect-card"><h2>You’re in control</h2><ul><li><Check size={17} aria-hidden="true" />Untangle cannot see your accounts.</li><li><Check size={17} aria-hidden="true" />It won’t change any settings.</li><li><Check size={17} aria-hidden="true" />Your answers stay in this tab.</li></ul><p>Refreshing or closing the page clears your answers.</p><Privacy /></section>
        <div className="scope-card"><SlidersHorizontal size={20} aria-hidden="true" /><p><strong>For now, we cover Google.</strong><br />This first version walks through a shared tablet and two Google accounts.</p></div>
      </aside>
    </div>
    <section className="about-strip" id="about"><div><h2>A little help with a complicated moment.</h2><p>Made for women reviewing digital connections after separation, on their own or with someone they trust.</p></div><details className="sources-details"><summary>About this prototype & our sources <ChevronDown size={16} aria-hidden="true" /></summary><div><p>Built for ImpactHer at HackYeah. Google is a starting point, not a partner. This prototype uses your answers or made-up examples. It does not check live accounts.</p><p>Research, practitioner feedback and security review are still needed. Provider guidance checked 3 October 2026.</p>{(['devices', 'password', 'recovery', 'safety', 'accessibility'] as const).map(id => <SourceLink key={id} id={id} />)}</div></details></section>
  </section>
}
