import type { ComponentProps } from 'react'
import { ArrowRight, ChevronDown, HeartHandshake, Monitor, BookOpen } from 'lucide-react'
import { Button, Privacy } from '../../components/Primitives'
import { DetailedLanding } from '../start/Landing'

export function Welcome(props: ComponentProps<typeof DetailedLanding> & { begin: (example: boolean) => void }) {
  return <main id="main-content" className="home-shell simple-home">
    <section className="first-step-card">
      <span className="icon-tile peach"><HeartHandshake size={26} aria-hidden="true" /></span>
      <p className="section-label">A LITTLE HELP AFTER A BREAKUP</p>
      <h1 id="hero-title" tabIndex={-1}>You don’t have to figure<br className="desktop-break" /> it all out today.</h1>
      <p className="first-step-intro">Worried your ex could still open your email or photos? Let’s start by looking at the devices using your Google account.</p>
      <div className="one-thing"><Monitor size={22} aria-hidden="true" /><div><strong>One thing to look at. We’ll show you how.</strong><span>You don’t need to know any technical words.</span></div></div>
      <Button arrow className="begin-guide" onClick={() => props.begin(false)}>Help me take the first step</Button>
      <button className="text-button try-guide" onClick={() => props.begin(true)}><BookOpen size={18} aria-hidden="true" />Try without using my account<ArrowRight size={16} aria-hidden="true" /></button>
      <p className="guide-reassurance">Untangle cannot see your accounts or change your settings.</p>
    </section>
    <div className="simple-home-bottom"><Privacy /><details className="advanced-start"><summary>Open the detailed review<ChevronDown size={17} aria-hidden="true" /></summary><p className="advanced-intro">For a longer review of a shared tablet and two Google accounts. You can use it on your own or with someone you trust.</p><DetailedLanding {...props} /></details></div>
  </main>
}
