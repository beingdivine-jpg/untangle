import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Pause, Play } from 'lucide-react'
import { useTranslation } from '../../i18n/context'
import type { ThreadSculpture as Sculpture } from './threadSculptureEngine'
import { threadDrawing } from './threadCurve'

const query = '(prefers-reduced-motion: reduce)'
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(query)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

export function ThreadSculpture() {
  const { translate } = useTranslation()
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true)
  const [paused, setPaused] = useState<boolean | null>(null)
  const [amount, setAmount] = useState(0)
  const [inView, setInView] = useState(false)
  const [visible, setVisible] = useState(() => !document.hidden)
  const [ready, setReady] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const sculpture = useRef<Sculpture | null>(null)
  const preferences = useRef({ playing: false, amount: 0, reduced: true })
  const playing = !(paused ?? reduced)
  const running = playing && inView && visible

  useEffect(() => {
    preferences.current = { playing: running, amount, reduced }
    sculpture.current?.setLooseness(amount / 100, reduced || !running)
    sculpture.current?.setMotion(running)
  }, [running, amount, reduced])

  useEffect(() => {
    const element = canvas.current
    if (!element) return
    let cancelled = false
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    observer.observe(element)
    const resize = new ResizeObserver(() => sculpture.current?.resize())
    resize.observe(element)
    const visibility = () => setVisible(!document.hidden)
    const contextLost = (event: Event) => { event.preventDefault(); sculpture.current?.dispose(); sculpture.current = null; setReady(false) }
    document.addEventListener('visibilitychange', visibility)
    element.addEventListener('webglcontextlost', contextLost)
    // The functional page and vector fallback are available before WebGL loads.
    import('./threadSculptureEngine').then(({ createThreadSculpture }) => {
      if (cancelled) return
      try {
        sculpture.current = createThreadSculpture(element)
        const state = preferences.current
        sculpture.current.setLooseness(state.amount / 100, true)
        sculpture.current.setMotion(state.playing)
        setReady(true)
      } catch { /* Keep the interactive vector drawing when WebGL is unavailable. */ }
    }).catch(() => { /* The page and controls remain usable with the fallback. */ })
    return () => {
      cancelled = true; observer.disconnect(); resize.disconnect()
      document.removeEventListener('visibilitychange', visibility)
      element.removeEventListener('webglcontextlost', contextLost)
      sculpture.current?.dispose(); sculpture.current = null
    }
  }, [])

  return <div className="thread-sculpture" data-motion={running ? 'playing' : 'paused'} data-renderer={ready ? 'webgl' : 'vector'}>
    <div className="sculpture-shadow" aria-hidden="true"/>
    <svg className="sculpture-fallback" aria-hidden="true" viewBox="0 0 800 500" fill="none" style={{ opacity: ready ? 0 : 1 }}>
      <g className="fallback-cords" strokeLinecap="round" strokeWidth="13">
        <path stroke="#ca5f42" d={threadDrawing(0, amount / 100)} />
        <path stroke="#577357" strokeWidth="10" d={threadDrawing(1, amount / 100)} />
        <path stroke="#999e4c" strokeWidth="7" d={threadDrawing(2, amount / 100)} />
      </g>
    </svg>
    <canvas ref={canvas} className="sculpture-canvas" aria-hidden="true" style={{ opacity: ready ? 1 : 0 }}/>
    <div className="sculpture-controls">
      <label className="thread-pull"><span>{translate('A little room to breathe.')}</span><input type="range" min="0" max="100" value={amount} onChange={event => setAmount(Number(event.target.value))} aria-label={translate('Loosen the illustrated threads')} aria-valuetext={translate(amount > 65 ? 'Loosened' : amount > 25 ? 'Loosening' : 'Tangled')}/><small>{translate('Slide to loosen the threads')}</small></label>
      <button className="sculpture-motion" onClick={() => setPaused(playing)} aria-label={translate(playing ? 'Pause illustration' : 'Play illustration')}>{playing ? <Pause size={14} aria-hidden="true"/> : <Play size={14} aria-hidden="true"/>}</button>
    </div>
  </div>
}
