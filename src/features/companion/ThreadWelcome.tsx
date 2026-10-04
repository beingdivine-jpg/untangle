import { ArrowDown, ArrowRight, ArrowUpRight, LockKeyhole, Play, Sparkles } from 'lucide-react'
import { useTranslation } from '../../i18n/context'
import { ThreadSculpture } from './InteractiveThreads'

export function ThreadWelcome({ begin, resume, hasPlan }: { begin: (mode: 'demo' | 'personal') => void; resume: () => void; hasPlan: boolean }) {
  const { translate } = useTranslation()
  return <section className="thread-welcome">
    <div className="welcome-caption"><span>{translate('YOUR DIGITAL LIFE, AFTER A BREAKUP')}</span><span className="welcome-edition">{translate('One thread at a time.')}<ArrowDown size={15} aria-hidden="true"/></span></div>
    <div className="welcome-stage">
      <h1 id="experience-heading" tabIndex={-1}><span>{translate('Make room')}</span><em>{translate('for you.')}</em></h1>
      <ThreadSculpture/>
      <span className="welcome-margin-note" aria-hidden="true">{translate('a small beginning')}</span>
    </div>
    <div className="welcome-bottom">
      <div className="welcome-context"><p>{translate('Help with the accounts, photos and location you still share after a breakup.')}</p><span>{translate('One thing at a time. You decide what happens next.')}</span></div>
      <div className="welcome-start"><div className="u-intro-actions"><button className="u-primary" onClick={() => begin('personal')}>{translate('Start with my own situation')}<ArrowUpRight size={20} aria-hidden="true"/></button><button className="u-quiet" onClick={() => begin('demo')}><span className="welcome-play"><Play size={16} aria-hidden="true" fill="currentColor"/></span>{translate('Try Me')}<ArrowRight size={18} aria-hidden="true"/></button></div><small><LockKeyhole size={13} aria-hidden="true"/>{translate('No account needed. Your choices stay in this tab.')}</small>{hasPlan && <button className="welcome-resume" onClick={resume}>{translate('Continue my plan')}<ArrowRight size={16} aria-hidden="true"/></button>}</div>
    </div>
    <details className="welcome-explanation"><summary><Sparkles size={17} aria-hidden="true"/>{translate('A companion for the next small step.')}<span>{translate('How it works')}<ArrowDown size={15} aria-hidden="true"/></span></summary><div><p>{translate('Choose what worries you. We will help you find a guide, understand what a change could affect, and decide what to keep in your plan.')}</p><p>{translate('Try Me demonstrates the workflow with a scripted example.')}</p><p>{translate('The moving threads are an illustration. Untangle does not connect to or change your accounts.')}</p></div></details>
  </section>
}
