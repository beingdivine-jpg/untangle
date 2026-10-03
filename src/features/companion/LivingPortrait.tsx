import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Pause, Play } from 'lucide-react'
import { useTranslation } from '../../i18n/context'

const motionQuery = '(prefers-reduced-motion: reduce)'
const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia(motionQuery)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const readMotion = () => window.matchMedia(motionQuery).matches

/** Decorative motion never represents account activity or the companion's progress. */
export function LivingPortrait() {
  const { translate } = useTranslation()
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, () => true)
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null)
  const [inView, setInView] = useState(false)
  const [pageVisible, setPageVisible] = useState(() => !document.hidden)
  const frame = useRef<HTMLElement>(null)
  const playing = motionChoice ?? !reducedMotion

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    if (frame.current) observer.observe(frame.current)
    const onVisibility = () => setPageVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  return <figure ref={frame} className="living-portrait" data-motion={playing && inView && pageVisible ? 'playing' : 'paused'}>
    <div className="portrait-stage" aria-hidden="true">
      <img className="portrait-image" src="/art/untangle-portrait.jpg" srcSet="/art/untangle-portrait-small.jpg 640w, /art/untangle-portrait.jpg 1254w" sizes="(max-width: 600px) 240px, (max-width: 900px) 380px, 50vw" width="1254" height="1254" alt="" fetchPriority="high"/>
      <svg className="portrait-threads" viewBox="0 0 1000 1000" fill="none">
        <g className="portrait-strands">
          <path className="portrait-strand" d="M201 428 C154 449 117 488 132 568 C152 677 351 753 311 842 C258 960 100 870 75 737 C35 526 151 370 123 251 C107 175 25 186 26 291 C29 465 151 439 201 428"/>
          <path className="portrait-strand strand-two" d="M202 435 C183 518 212 564 244 659 C300 826 514 859 671 801 C945 700 913 491 795 399 C634 274 714 123 844 179 C975 237 917 414 829 444"/>
          <path className="portrait-strand strand-three" d="M337 813 C475 949 738 952 876 827 C998 716 958 534 891 538 C810 543 938 720 998 674"/>
          <path className="portrait-current" pathLength="100" d="M201 428 C154 449 117 488 132 568 C152 677 351 753 311 842 C258 960 100 870 75 737 C35 526 151 370 123 251 C107 175 25 186 26 291 C29 465 151 439 201 428"/>
        </g>
      </svg>
    </div>
    <figcaption className="portrait-caption"><span className="portrait-caption-line"/>{translate('you hold the thread.')}</figcaption>
    <button className="portrait-motion" onClick={() => setMotionChoice(!playing)} aria-label={translate(playing ? 'Pause illustration' : 'Play illustration')}>
      {playing ? <Pause size={14} aria-hidden="true"/> : <Play size={14} aria-hidden="true"/>}
      <span>{translate(playing ? 'Pause motion' : 'Play motion')}</span>
    </button>
  </figure>
}
