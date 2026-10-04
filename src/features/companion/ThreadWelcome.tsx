import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowRight, ArrowDown, LockKeyhole, Pause, Play, Plus, Minus } from 'lucide-react'
import { useTranslation } from '../../i18n/context'
import type { ConcernId } from '../plan/content'

const chapters = [
  { id: 'accounts', title: 'Your accounts', detail: 'Old passwords. Shared devices. A way back into your account.', next: 'We can help you find where an account is still signed in, and understand what a password change does.' },
  { id: 'photos', title: 'Your photos', detail: 'Shared albums. Saved copies. What you want to keep.', next: 'We can help you understand photo sharing, think about what to keep, and find specialist help for private images.' },
  { id: 'location', title: 'Your location', detail: 'Maps. Your phone. The sharing you may have forgotten.', next: 'We can help you find location-sharing settings in the apps you use and read what a change could affect.' },
] as const
const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(motionQuery)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

export function ThreadWelcome({ begin, resume, hasPlan }: { begin: (mode: 'demo' | 'personal', concern?: ConcernId) => void; resume: () => void; hasPlan: boolean }) {
  const { translate } = useTranslation()
  const [chapter, setChapter] = useState<ConcernId | null>(null)
  const [expanded, setExpanded] = useState(false)
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(motionQuery).matches, () => true)
  const [paused, setPaused] = useState<boolean | null>(null)
  const [visible, setVisible] = useState(!document.hidden)
  const [inView, setInView] = useState(false)
  const hero = useRef<HTMLDivElement>(null)
  const playing = !(paused ?? reduced)
  const current = chapters.find(item => item.id === chapter)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    if (hero.current) observer.observe(hero.current)
    const visibility = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', visibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [])

  return <section className="editorial-welcome">
    <div className="editorial-hero" ref={hero} data-motion={playing && visible && inView ? 'playing' : 'paused'}>
      <div className="editorial-image-wrap" aria-hidden="true"><img className="editorial-image" src="/art/untangle-editorial.jpg" width="1536" height="1024" alt="" fetchPriority="high"/><div className="editorial-image-shade"/></div>
      <div className="editorial-copy">
        <p className="editorial-kicker"><span/>{translate('A PRIVATE GUIDE FOR LIFE AFTER A BREAKUP')}</p>
        <h1 id="experience-heading" tabIndex={-1}><span>{translate('Your life.')}</span><span>{translate('Your terms.')}</span></h1>
        <p className="editorial-lead">{translate('A breakup can leave your digital lives connected. Find a way through shared accounts, photos and location—one clear step at a time.')}</p>
        <div className="u-intro-actions"><button className="u-primary" onClick={() => begin('personal', chapter ?? undefined)}>{translate('Start with my own situation')}<ArrowRight size={20} aria-hidden="true"/></button><button className="u-quiet" aria-label={translate('Try Me')} onClick={() => begin('demo')}><Play size={14} fill="currentColor" aria-hidden="true"/>{translate('Try Me')}<span>{translate('A guided example')}</span></button></div>
        <small className="editorial-reassurance"><LockKeyhole size={13} aria-hidden="true"/>{translate('No sign-up. No account passwords. Your choices stay in this tab.')}</small>
        {hasPlan && <button className="editorial-resume" onClick={resume}>{translate('Continue my plan')}<ArrowRight size={16} aria-hidden="true"/></button>}
      </div>
      <div className="editorial-film-note" aria-hidden="true"><span>01 — UNTANGLE</span><span>{translate('A little clarity. A little more you.')}</span></div>
      <button className="editorial-motion" onClick={() => setPaused(playing)} aria-label={translate(playing ? 'Pause illustration' : 'Play illustration')}>{playing ? <Pause size={14} aria-hidden="true"/> : <Play size={14} aria-hidden="true"/>}</button>
    </div>

    <div className="editorial-chapters">
      <div className="chapter-intro"><span>{translate('WHAT STILL CONNECTS YOU?')}</span><p>{translate('Choose a thread.')}<ArrowDown size={19} aria-hidden="true"/></p></div>
      <div className="chapter-options" role="group" aria-label={translate('Explore a starting point')}>
        {chapters.map((item, index) => <button key={item.id} className="chapter-option" aria-pressed={chapter === item.id} onClick={() => setChapter(chapter === item.id ? null : item.id)}><span className="chapter-number">0{index + 1}</span><span><strong>{translate(item.title)}</strong><small>{translate(item.detail)}</small></span><ArrowRight size={21} aria-hidden="true"/></button>)}
      </div>
      {current && <div className="chapter-preview" aria-live="polite"><p>{translate(current.next)}</p><button onClick={() => begin('personal', current.id)}>{translate('Start here')}<ArrowRight size={18} aria-hidden="true"/></button><small>{translate('This chooses a topic for your plan. Nothing changes in your accounts.')}</small></div>}
    </div>

    <div className="editorial-companion">
      <div className="companion-heading"><span className="companion-mark" aria-hidden="true">u.</span><h2>{translate('A little help with the next step.')}</h2><button className="companion-reveal" aria-expanded={expanded} aria-controls="welcome-companion-details" onClick={() => setExpanded(!expanded)}>{translate('How it works')}{expanded ? <Minus size={18} aria-hidden="true"/> : <Plus size={18} aria-hidden="true"/>}</button></div>
      <div id="welcome-companion-details" hidden={!expanded} className="companion-details"><p>{translate('The planning companion matches guides, explains what a change could affect, and helps put questions into words. You review every suggestion before keeping it.')}</p><p>{translate('Try Me demonstrates the workflow with a scripted example.')} {translate('Untangle does not connect to or change your accounts.')}</p></div>
    </div>
  </section>
}
