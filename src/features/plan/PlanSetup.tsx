import { useState } from 'react'
import { ArrowRight, Check, HeartHandshake, KeyRound, MapPin, Image, MessageCircle, Home } from 'lucide-react'
import { useTranslation } from '../../i18n/context'
import { navigate } from '../../app/navigation'
import { updateSetup, useSession } from '../../app/session'
import { concerns, taskById } from './content'
import type { TaskId } from './content'
import { services } from './services'
import { addTask, revisePlan } from './model'
import type { Plan } from './model'
import { Button } from '../../components/Primitives'

const concernIcons = { key: KeyRound, pin: MapPin, image: Image, message: MessageCircle, home: Home, heart: HeartHandshake }

export function PlanSetup({ plan, finish }: { plan: Plan; finish: (plan: Plan, preferred?: TaskId) => void }) {
  const { translate } = useTranslation(), session = useSession()
  const setup = session.setup[plan.example ? 'example' : 'personal'] ?? { concerns: plan.concerns, services: plan.services }
  const [pending, setPending] = useState<Plan | null>(null)
  const hasPlan = Object.keys(plan.entries).length > 0
  const removed = pending ? (Object.keys(plan.entries) as TaskId[]).filter(id => !pending.entries[id]) : []
  const review = (next: Plan) => {
    if (Object.keys(plan.entries).some(id => !next.entries[id as TaskId])) setPending(next)
    else finish(next)
  }
  return <div className="plan-setup">
    <header className="p-page-heading"><span className="p-eyebrow">{translate('ONE SMALL START')}</span><h1 id="platform-heading" tabIndex={-1}>{translate(hasPlan ? 'Make this plan fit you.' : 'What is on your mind?')}</h1><p>{translate('Choose a concern and the apps you use. We will show you one place to start. Nothing in your accounts changes here.')}</p></header>
    <p className="session-explanation">{translate('No Untangle account needed. Your choices stay in this tab. Refreshing or closing it clears this session.')}</p>
    <button className="text-button" onClick={() => navigate({ area: 'plan', view: 'support' })}><HeartHandshake size={18} aria-hidden="true"/>{translate('I would rather ask someone for help')}</button>
    <fieldset className="setup-fieldset"><legend>{translate('1. What would you like help with?')}</legend><div className="setup-choices">{concerns.map(c => { const ConcernIcon = concernIcons[c.icon]; return <button type="button" key={c.id} aria-pressed={setup.concerns.includes(c.id)} onClick={() => { setPending(null); updateSetup({ ...setup, concerns: setup.concerns.includes(c.id) ? setup.concerns.filter(id => id !== c.id) : [...setup.concerns, c.id] }) }}><span className={`setup-concern-icon ${c.id}`}><ConcernIcon size={22} aria-hidden="true"/></span><span className="setup-choice-label">{translate(c.title)}</span>{setup.concerns.includes(c.id) && <Check size={18} aria-hidden="true"/>}</button> })}</div><button className="text-button" onClick={() => { updateSetup({ concerns: ['support'], services: ['unknown'] }); review(revisePlan(plan, ['support'], ['unknown'])) }}>{translate('I’m not sure where to start')}</button></fieldset>
    {setup.concerns.length > 0 && <fieldset className="setup-fieldset"><legend>{translate('2. Which of these do you use?')}</legend><p>{translate('Choose only what you recognise. It is okay not to know.')}</p><div className="setup-choices setup-services">{services.map(s => <button type="button" key={s.id} aria-pressed={setup.services.includes(s.id)} onClick={() => { setPending(null); updateSetup({ ...setup, services: setup.services.includes(s.id) ? setup.services.filter(id => id !== s.id) : [...setup.services.filter(id => s.id === 'unknown' ? false : id !== 'unknown'), s.id] }) }}><span><strong>{translate(s.title)}</strong><small>{translate(s.detail)}</small></span>{setup.services.includes(s.id) && <Check size={18} aria-hidden="true"/>}</button>)}</div></fieldset>}
    {setup.concerns.includes('photos') && <aside className="p-soft-note"><div><strong>{translate('Worried about private images?')}</strong><p>{translate('You can go straight to specialist help. You do not need to show us any images.')}</p><button className="text-button" onClick={() => finish(addTask({ ...plan, concerns: [...setup.concerns], services: [...setup.services] }, 'images'), 'images')}>{translate('Get help with private images')}</button></div></aside>}
    {pending ? <section className="p-panel p-restore" role="alert"><h2>{translate('Review what will leave your plan')}</h2><p>{translate('These checks and their notes will be removed. Everything else stays. You can undo this change during this session.')}</p><ul>{removed.map(id => <li key={id}>{translate(taskById[id].title)}</li>)}</ul><div className="p-actions"><Button onClick={() => finish(pending)}>{translate('Use these choices')}</Button><Button secondary onClick={() => setPending(null)}>{translate('Keep editing')}</Button></div></section> : <div className="setup-action"><Button disabled={!setup.concerns.length || !setup.services.length} onClick={() => review(revisePlan(plan, setup.concerns, setup.services))}>{translate(hasPlan ? 'Update my plan' : 'Show my first step')}<ArrowRight size={18} aria-hidden="true"/></Button><small>{translate('Read first. Decide about changes later.')}</small></div>}
  </div>
}
