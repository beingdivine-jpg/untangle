import { useTranslation } from '../../i18n/context'
import { Image, KeyRound, Laptop, MapPin, Users } from 'lucide-react'
import type { TaskId } from '../plan/content'
import { taskById } from '../plan/content'

export function ThreadScene({ active = false, ids = [], selected, onSelect, intro = false }: { active?: boolean; ids?: TaskId[]; selected?: TaskId; onSelect?: (id: TaskId) => void; intro?: boolean }) {
  const { translate } = useTranslation()

  const shown = intro ? ['recovery','devices','photos'] as TaskId[] : ids.slice(0,6)
  const Icon = (id: TaskId) => id === 'devices' ? Laptop : id === 'photos' || id === 'keep' ? Image : id === 'maps' || id === 'apple' ? MapPin : id === 'family' || id === 'support' ? Users : KeyRound
  return <div className={`thread-scene ${active ? 'connected' : ''} ${intro ? 'intro-scene' : ''}`}>
    <div className="scene-caption"><span className="tiny-dot"/>{translate(intro ? 'A LITTLE CLARITY, TAKING SHAPE' : 'YOUR SELECTED CHECKS')}</div>
    <svg className="scene-lines" viewBox="0 0 580 520" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M88 130 C280 90 80 410 278 268 C390 180 300 65 454 110"/><path d="M90 338 C240 330 230 80 310 237 C440 495 550 235 450 330"/><path d="M140 430 C200 270 350 430 465 430"/><path className="scene-trace" d="M88 130 C280 90 80 410 278 268 C390 180 300 65 454 110"/></svg>
    <div className="scene-center"><span className="scene-knot" aria-hidden="true"><svg viewBox="0 0 44 44" fill="none"><path d="M5 34C5 20 34 6 36 18C40 34 8 33 14 17C19 4 35 10 29 23C25 31 24 32 40 35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span><strong>{translate(intro ? 'Your next chapter' : 'Your choices')}</strong><small>{translate(intro ? 'Still yours to shape.' : 'Nothing changes without you.')}</small></div>
    <div className="scene-nodes">{shown.map((id,i) => { const NodeIcon=Icon(id); const name = id === 'recovery' ? 'Your way back in' : id === 'devices' ? 'A shared laptop' : id === 'photos' ? 'Your photos' : id === 'password' ? 'A new password' : id === 'maps' ? 'Location sharing' : id === 'keep' ? 'What to keep' : taskById[id].service; return <button type="button" disabled={!onSelect} aria-pressed={selected === id} className={`scene-node node-${i} ${selected === id ? 'selected' : ''}`} key={id} onClick={() => onSelect?.(id)}><span className="node-icon"><NodeIcon size={19} aria-hidden="true"/></span><strong>{translate(name)}</strong><small>{translate(intro ? i === 0 ? 'Keep access' : i === 1 ? 'Check connections' : 'Keep what matters' : active ? 'Ready to explore' : 'Selected for review')}</small></button> })}</div>
    {!intro && ids.length > shown.length && <span className="scene-more">{translate("Plus {0} more checks in the list").replace("{0}", String(ids.length - shown.length))}</span>}<span className="scene-bottom">{translate(intro ? 'One thread at a time.' : 'A visual index, not a scan of your accounts.')}</span>
  </div>
}
