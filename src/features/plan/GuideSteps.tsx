import { useState } from 'react'
import type { Task } from './content'
import { useTranslation } from '../../i18n/context'
import { navigate } from '../../app/navigation'
import { GuidanceLink } from '../../components/GuidanceLink'

export function GuideSteps({ task }: { task: Task }) {
  const { translate } = useTranslation()
  const [step, setStep] = useState(0), [help, setHelp] = useState(''), [device, setDevice] = useState('phone')
  const computer = task.id === 'forwarding' || task.id === 'photos'
  return <div className="guided-steps">
    {computer && <fieldset className="guide-device"><legend>{translate('What are you using right now?')}</legend>{['phone', 'computer'].map(id => <button key={id} aria-pressed={device === id} onClick={() => setDevice(id)}>{translate(id === 'phone' ? 'A phone or tablet' : 'A computer')}</button>)}</fieldset>}
    {computer && device === 'phone' && <p className="p-soft-note">{translate(task.id === 'forwarding' ? 'Gmail’s forwarding settings need a computer. You can keep this check for later or ask someone you trust to sit with you at a computer. You do not need to use someone else’s account.' : 'The steps below describe Google Photos on a computer. On a phone, open the official guide and choose Android or iPhone/iPad for the matching steps.')}</p>}
    <p className="p-eyebrow">{translate('Instruction {0} of {1}').replace('{0}', String(step + 1)).replace('{1}', String(task.steps.length))}</p>
    <p className="guide-instruction" aria-live="polite">{translate(task.steps[step])}</p>
    <div className="p-actions">{step > 0 && <button className="text-button" onClick={() => setStep(step - 1)}>{translate('Previous instruction')}</button>}{step < task.steps.length - 1 && <button className="button" onClick={() => setStep(step + 1)}>{translate('Next instruction')}</button>}</div>
    <details className="p-details"><summary>{translate('I’m stuck or my screen looks different')}</summary><div className="guide-help-options">{['find', 'signin', 'restricted'].map(id => <button key={id} aria-pressed={help === id} onClick={() => setHelp(id)}>{translate(id === 'find' ? 'I cannot find this setting' : id === 'signin' ? 'It asks me to sign in' : 'The option is missing or restricted')}</button>)}</div>
    {help && <p role="status">{translate(help === 'find' ? 'Check that this is the same app and your own account. Menus change; open the official guide below and choose your device if it offers tabs. You can record “I’m not sure” and come back with help.' : help === 'signin' ? 'You are leaving Untangle for the app’s own website. Untangle has no login. Only sign in on the provider’s real website, on a device you trust. Never enter your password in an Untangle note.' : 'Some options depend on your age, family settings, device version or a school/work administrator. Do not try to bypass these controls. Keep this as a question and ask a trusted adult or support service to help.')}</p>}
    <GuidanceLink href={task.url}>{translate('Open the current official guide')}</GuidanceLink><button className="text-button" onClick={() => navigate({ area: 'plan', view: 'support' })}>{translate('I would like someone to help.')}</button></details>
    <p className="p-footnote">{translate('Opening a guide does not give Untangle access to your account. Any sign-in belongs to that other website.')}</p>
  </div>
}
