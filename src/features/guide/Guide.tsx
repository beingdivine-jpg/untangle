import { useTranslation } from '../../i18n/context'
import { useState, type Dispatch } from 'react'
import { ArrowLeft, ArrowUpRight, BookOpen, ChevronDown, CircleHelp, Laptop, Mail, Monitor, Smartphone } from 'lucide-react'
import { Button, SourceLink } from '../../components/Primitives'
import type { Action } from '../../app/state'
import { guideResults, type GuideState, type GuideStep } from './state'

const deviceUrl = 'https://www.google.com/devices'
const steps: Partial<Record<GuideStep, number>> = { open: 1, find: 2, read: 3 }

function GoogleLink() {
  const { translate, href: localizeLink } = useTranslation()

  return <a className="button google-device-link" href={localizeLink(deviceUrl)} target="_blank" rel="noreferrer">{translate("Open Google’s device list")}<ArrowUpRight size={17} aria-hidden="true" /><span className="sr-only">{translate(" (opens in a new tab)")}</span></a>
}

function ExampleDevice({ detail = false }: { detail?: boolean }) {
  const { translate } = useTranslation()

  return <div className="practice-device" aria-label={translate("Made-up device list")}>
    <span className="label-caps">{translate("MADE-UP EXAMPLE · NOT YOUR ACCOUNT")}</span>
    {!detail && <div><Smartphone size={23} aria-hidden="true" /><p><strong>{translate("Your phone")}</strong><span>{translate("The phone you’re using now")}</span></p></div>}
    <div><Laptop size={25} aria-hidden="true" /><p><strong>{translate("Shared laptop")}</strong><span>{translate(detail ? 'Google Chrome' : 'A laptop you used together')}</span></p></div>
  </div>
}

export function Guide({ guide, dispatch, onFinish }: { guide: GuideState; dispatch: Dispatch<Action>; onFinish: () => void }) {
  const { translate } = useTranslation()

  const [stuck, setStuck] = useState(false)
  const go = (value: GuideStep) => { setStuck(false); dispatch({ type: 'GUIDE_STEP', value }) }
  const outcome = guide.result ? guideResults[guide.result] : null
  const back = () => go(({ ready: 'ready', recognize: 'ready', open: 'ready', find: 'open', read: 'find', result: guide.result === 'paused' ? 'ready' : 'find' } as const)[guide.step])
  const title = guide.step === 'ready' ? 'First, we’ll only look.' : guide.step === 'recognize' ? 'Do either of these look familiar?' : guide.step === 'open' ? (guide.example ? 'Here’s a made-up device list.' : 'Open Google’s device list.') : guide.step === 'find' ? 'Look for a device you used together.' : guide.step === 'read' ? (guide.example ? 'Here’s the shared laptop.' : 'Open that device. What does it say?') : outcome?.title
  return <main id="main-content" className="guide-shell">
    <div className="guide-toolbar"><button className="text-button" onClick={guide.step === 'ready' ? onFinish : back}><ArrowLeft size={17} aria-hidden="true" />{translate(guide.step === 'ready' ? 'Back to start' : 'Back')}</button><span>{translate(guide.example ? <><BookOpen size={16} aria-hidden="true" />{translate("Practice · made up")}</> : 'One small check')}</span></div>
    <section className="guide-card app-card">
      {steps[guide.step] && <p className="guide-step-label">{steps[guide.step]}{translate(" of 3 · ")}{translate(guide.step === 'open' ? 'Find the list' : guide.step === 'find' ? 'Find the device' : 'Read one detail')}</p>}
      <span className="icon-tile lavender"><Monitor size={24} aria-hidden="true" /></span>
      <h1 id="step-heading" tabIndex={-1}>{translate(title)}</h1>
      {guide.step === 'ready' && <>
        <p className="guide-lead">{translate("A device you used together might still open your Gmail or Google Photos. We’ll help you find Google’s list of devices.")}</p>
        <p className="guide-note">{translate(guide.example ? 'We’ll use a made-up laptop. You don’t need to open Google or share anything.' : 'You won’t need to type a password here or change a setting.')}</p>
        <div className="guide-actions"><Button arrow onClick={() => go('open')}>{translate(guide.example ? 'Show me the example' : 'Show me where to look')}</Button>{!guide.example && <button className="text-button" onClick={() => go('recognize')}>{translate("I don’t know if I use Google")}</button>}<button className="text-button" onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'paused' })}>{translate("I don’t feel comfortable checking")}</button></div>
        <details className="guide-detail"><summary>{translate("Could someone notice me checking?")}<ChevronDown size={16} aria-hidden="true" /></summary><p>{translate("Opening Google may ask you to sign in, and a sign-in may be noticed. If someone may monitor this device or account, you can use the made-up example instead.")}</p><SourceLink id="safety">{translate("Read about using a safer device (US)")}</SourceLink></details>
      </>}
      {guide.step === 'recognize' && <>
        <p className="guide-lead">{translate("Gmail is an email app. Google Photos is an app for your pictures. They use a Google account.")}</p>
        <div className="familiar-apps"><span><Mail size={24} aria-hidden="true" /><strong>{translate("Gmail")}</strong></span><span><BookOpen size={24} aria-hidden="true" /><strong>{translate("Google Photos")}</strong></span></div>
        <div className="guide-actions"><Button arrow onClick={() => go('open')}>{translate("Yes, I use one of these")}</Button><Button secondary onClick={() => dispatch({ type: 'BEGIN_GUIDE', example: true })}>{translate("I’m not sure — show me an example")}</Button><button className="text-button" onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'paused' })}>{translate("I don’t use these")}</button></div>
        <p className="guide-note">{translate("This first guide covers Google. It doesn’t check other email or photo apps.")}</p>
      </>}
      {guide.step === 'open' && <>
        <p className="guide-lead">{translate(guide.example ? 'Imagine this list is in your Google account. We’ll look at the shared laptop next.' : 'Use the button below. Google opens in another tab. Come back here when you can see a list of phones, tablets or computers.')}</p>
        {guide.example ? <ExampleDevice /> : <><GoogleLink /><p className="guide-note">{translate("Use your own account. Google may ask you to sign in. Never enter your password in Untangle.")}</p></>}
        <div className="guide-actions"><Button secondary arrow onClick={() => go('find')}>{translate(guide.example ? 'I can see the example list' : 'I can see my device list')}</Button>{!guide.example && <button className="text-button" aria-expanded={stuck} onClick={() => setStuck(!stuck)}><CircleHelp size={17} aria-hidden="true" />{translate("I’m stuck")}</button>}</div>
        {stuck && <div className="stuck-help" role="status"><h2>{translate("Let’s pause here.")}</h2><p>{translate("If Google asks you to sign in and you’re unsure how, you don’t need to continue. You can practise here without an account.")}</p><Button secondary onClick={() => dispatch({ type: 'BEGIN_GUIDE', example: true })}>{translate("Use the made-up example")}</Button><button className="text-button" onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'paused' })}>{translate("Stop for now")}</button></div>}
      </>}
      {guide.step === 'find' && <>
        <p className="guide-lead">{translate(guide.example ? 'In this story, you used to share the laptop below.' : 'Think of a phone, tablet or computer you used with your ex. It may be listed by its brand or model.')}</p>
        {guide.example && <ExampleDevice />}
        <div className="guide-actions"><Button arrow onClick={() => go('read')}>{translate(guide.example ? 'Look at the shared laptop' : 'I found a device we used together')}</Button>{!guide.example && <><Button secondary onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'not-found' })}>{translate("I don’t see one")}</Button><button className="text-button" onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'unsure' })}>{translate("I can’t tell which device is which")}</button></>}</div>
        <details className="guide-detail"><summary>{translate("What do the dates and places mean?")}<ChevronDown size={16} aria-hidden="true" /></summary><p>{translate("A recent time can come from automatic updates. It doesn’t tell you who used the device. A place or a device name may also look unfamiliar.")}</p><SourceLink id="devices" /></details>
      </>}
      {guide.step === 'read' && <>
        <p className="guide-lead">{translate(guide.example ? 'In this story, the laptop’s entry is not marked “Signed out”. Let’s see what that could mean.' : 'Select the device in Google’s list. Look for the words “Signed out”. If there are several entries, choose one to look at first.')}</p>
        {guide.example && <ExampleDevice detail />}
        {guide.example ? <div className="guide-actions"><Button arrow onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'possibly-in' })}>{translate("Explain this example")}</Button></div> : <div className="guide-answer-options"><Button secondary onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'signed-out' })}>{translate("It says “Signed out”")}</Button><Button secondary onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'possibly-in' })}>{translate("I don’t see “Signed out”")}</Button><button className="text-button" onClick={() => dispatch({ type: 'GUIDE_RESULT', value: 'unsure' })}>{translate("I’m not sure what I’m looking at")}</button></div>}
        <p className="guide-note">{translate("“Signed out” means that particular sign-in has ended. You don’t need to press a “Sign out” button to answer this.")}</p>
      </>}
      {guide.step === 'result' && outcome && <>
        {guide.example && <p className="practice-result"><BookOpen size={17} aria-hidden="true" />{translate("This is only the made-up example.")}</p>}
        <p className="guide-lead">{translate(outcome.explanation)}</p>
        <div className="one-next-thing"><h2>{translate(guide.result === 'paused' ? 'Whenever you’re ready' : 'For now, just this')}</h2><p>{translate(outcome.next)}</p></div>
        {guide.result === 'possibly-in' && <details className="guide-detail"><summary>{translate("What would signing out do?")}<ChevronDown size={16} aria-hidden="true" /></summary><p>{translate("If it succeeds in Google, that sign-in should end. Other entries can stay signed in, even on the same device. It does not remove copies of photos or messages someone already has.")}</p><p>{translate("Someone may notice the change. You can talk it through with someone you trust before deciding.")}</p><SourceLink id="devices">{translate("Read Google’s sign-out instructions")}</SourceLink><p>{translate("Any real change happens in Google. Untangle cannot do it for you or confirm it worked.")}</p></details>}
        {guide.result !== 'paused' && <details className="guide-detail"><summary>{translate("Read this with someone I trust")}<ChevronDown size={16} aria-hidden="true" /></summary><p>{translate(guide.example ? 'This is a fictional practice example.' : 'This is what I reported; Untangle has not checked it.')}</p><p><strong>{translate(outcome.title)}</strong> {translate(outcome.explanation)}</p><p>{translate("We only looked at one entry. Other devices, passwords and account recovery details have not been checked here.")}</p><p>{translate("Nothing is sent. This note disappears when you refresh or close this page.")}</p></details>}
        <div className="guide-actions"><Button onClick={onFinish}>{translate("That’s enough for now")}</Button>{guide.result === 'paused' && <button className="text-button" onClick={() => dispatch({ type: 'BEGIN_GUIDE', example: true })}>{translate("Try the made-up example")}</button>}{guide.result !== 'paused' && <button className="text-button" onClick={() => go('find')}>{translate("Go back to the device check")}</button>}</div>
        {guide.result === 'paused' && <SourceLink id="safety">{translate("Support information if checking feels unsafe (US)")}</SourceLink>}
      </>}
    </section>
    <p className="guide-footnote">{translate(guide.example ? 'Made-up details. No account connected.' : 'Untangle only knows what you tell it.')}{translate(" Refreshing clears this visit.")}</p>
  </main>
}
