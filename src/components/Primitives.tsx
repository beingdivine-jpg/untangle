import { ArrowRight, ArrowUpRight, Check, ChevronDown } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { sources } from '../content/sources'

export function Button({ children, secondary = false, arrow = false, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean; arrow?: boolean }) {
  return <button className={`${secondary ? 'button secondary' : 'button'} ${className}`} {...props}>{children}{arrow && <ArrowRight size={18} aria-hidden="true" />}</button>
}
export function SourceLink({ id, children }: { id: keyof typeof sources; children?: ReactNode }) {
  return <a className="source-link" href={sources[id].url} target="_blank" rel="noreferrer">{children || sources[id].title}<ArrowUpRight size={14} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a>
}
export function Choice({ selected, children, onClick, description }: { selected: boolean; children: ReactNode; onClick: () => void; description?: string }) {
  return <button type="button" className={`choice ${selected ? 'selected' : ''}`} aria-pressed={selected} onClick={onClick}><span className="choice-dot">{selected && <Check size={13} aria-hidden="true" />}</span><span>{children}{description && <small>{description}</small>}</span></button>
}
export function Privacy({ expanded = false }: { expanded?: boolean }) {
  return <details className="privacy" open={expanded || undefined}><summary>What happens to my answers?<ChevronDown size={14} aria-hidden="true" /></summary><div><p>Your note, answers and image stay in this browser tab. Refreshing, closing or clearing the review removes them from this tab. The plan workspace also offers an optional password-protected file through Save & resume; files you download remain on your device. Untangle doesn’t upload them, connect to your accounts or change settings.</p><p>“Leave this page” clears this review and opens Wikipedia. It does not erase browser history, cached pages, downloads, monitoring or network records.</p><p>If this device may be monitored, consider reading support information on a device you trust. Changes to settings may be noticed by others.</p><SourceLink id="safety" /></div></details>
}
