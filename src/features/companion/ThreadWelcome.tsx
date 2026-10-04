import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowRight, ArrowDown, LockKeyhole, Pause, Play, Plus, Minus, RotateCcw, KeyRound, Image, MapPin } from 'lucide-react'
import { useTranslation } from '../../i18n/context'
import type { ConcernId } from '../plan/content'
import { ProductPaths } from '../resolve/EntryPoints'
import { InkPortrait } from './InkPortrait'

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
  const [replay, setReplay] = useState(0)
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
      <div className="editorial-copy">
        <p className="editorial-kicker"><span/>{translate('A PRIVATE GUIDE FOR LIFE AFTER A BREAKUP')}</p>
        <h1 id="experience-heading" tabIndex={-1}><span>{translate('Your life.')}</span><em>{translate('Your terms.')}</em></h1>
        <p className="editorial-lead">{translate('A breakup can leave your digital lives connected. Find a way through shared accounts, photos and location—one clear step at a time.')}</p>
        <div className="u-intro-actions"><button className="u-primary" onClick={() => begin('personal', chapter ?? undefined)}>{translate('Start with my own situation')}<ArrowRight size={20} aria-hidden="true"/></button><button className="u-quiet" aria-label={translate('Try Me')} onClick={() => begin('demo')}><Play size={14} fill="currentColor" aria-hidden="true"/>{translate('Try Me')}<span>{translate('A guided example')}</span></button></div>
        <small className="editorial-reassurance"><LockKeyhole size={13} aria-hidden="true"/>{translate('Start without an account. Your plan stays in this tab.')}</small>
        {hasPlan && <button className="editorial-resume" onClick={resume}>{translate('Continue my plan')}<ArrowRight size={16} aria-hidden="true"/></button>}
      </div>
      <div className="editorial-art">
        <div className="ink-orbit" aria-hidden="true"><span className="orbit-account"><KeyRound size={22}/></span><span className="orbit-photo"><Image size={24}/></span><span className="orbit-location"><MapPin size={22}/></span></div>
        <InkPortrait playing={playing && visible && inView} replay={replay}/>
        <div className="ink-caption"><span>{translate('A little room to begin again.')}</span><div><button onClick={() => { setPaused(false); setReplay(value => value + 1) }} aria-label={translate('Replay the illustration')}><RotateCcw size={15} aria-hidden="true"/></button><button className="editorial-motion" onClick={() => setPaused(playing)} aria-label={translate(playing ? 'Pause illustration' : 'Play illustration')}>{playing ? <Pause size={14} aria-hidden="true"/> : <Play size={14} aria-hidden="true"/>}<span>{translate(playing ? 'Pause motion' : 'Play motion')}</span></button></div></div>
      </div>
    </div>

    <ProductPaths/>
    <div className="editorial-chapters">
      <div className="chapter-intro"><span>{translate('WHAT STILL CONNECTS YOU?')}</span><p>{translate('Choose a thread.')}<ArrowDown size={19} aria-hidden="true"/></p></div>
      <div className="chapter-options" role="group" aria-label={translate('Explore a starting point')}>
        {chapters.map((item, index) => <button key={item.id} className="chapter-option" aria-pressed={chapter === item.id} onClick={() => setChapter(chapter === item.id ? null : item.id)}><span className="chapter-number">0{index + 1}</span><span><strong>{translate(item.title)}</strong><small>{translate(item.detail)}</small></span><ArrowRight size={21} aria-hidden="true"/></button>)}
      </div>
      {current && <div className="chapter-preview" aria-live="polite"><p>{translate(current.next)}</p><button onClick={() => begin('personal', current.id)}>{translate('Start here')}<ArrowRight size={18} aria-hidden="true"/></button><small>{translate('This chooses a topic for your plan. Nothing changes in your accounts.')}</small></div>}
    </div>

    <div className="editorial-companion">
      <div className="companion-introduction"><span className="editorial-kicker">{translate('UNDERSTAND. WORK THROUGH. FIND SUPPORT.')}</span><h2>{translate('A little help with the next step.')}</h2><p>{translate('An assistant for the whole journey: explain the problem, work through a step, learn from it, and bring in a person when you need one.')}</p><button className="companion-demo" onClick={() => begin('demo')}>{translate('Meet the companion')}<ArrowRight size={18} aria-hidden="true"/></button></div>
      <div className="companion-process"><div><span>01</span><p><strong>{translate('You tell us what matters.')}</strong><small>{translate('Choose a topic and the apps you recognise.')}</small></p></div><div><span>02</span><p><strong>{translate('We make the next step clearer.')}</strong><small>{translate('Guides, possible effects, and help with words.')}</small></p></div><div><span>03</span><p><strong>{translate('You have the final say.')}</strong><small>{translate('Every suggestion is yours to review or leave.')}</small></p></div></div>
      <button className="companion-reveal" aria-expanded={expanded} aria-controls="welcome-companion-details" onClick={() => setExpanded(!expanded)}>{translate('How it works')}{expanded ? <Minus size={18} aria-hidden="true"/> : <Plus size={18} aria-hidden="true"/>}</button>
      <div id="welcome-companion-details" hidden={!expanded} className="companion-details"><p>{translate('The assistant retrieves relevant guidance and offers a next step you can review. You act in your own apps and report what happened. Human support has its own account and approval process; you preview every request before sharing.')}</p><p>{translate('Try Me demonstrates the workflow with a scripted example.')} {translate('Untangle does not connect to or change your accounts.')}</p></div>
    </div>
  </section>
}
