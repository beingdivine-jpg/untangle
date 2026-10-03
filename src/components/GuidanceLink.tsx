import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from '../i18n/context'

export function GuidanceLink({ href, children }: { href: string; children: ReactNode }) {
  const { translate, locale, href: localize } = useTranslation()
  const destination = localize(href)
  const english = locale === 'pl' && (destination.includes('/en-euro/') || destination.includes('techsafety.org') || destination.includes('refuge'))
  return <a className="p-external" href={destination} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={15} aria-hidden="true"/>{english && <small lang="pl">{translate('Guide in English')}</small>}<span className="sr-only">{translate(' (opens in a new tab)')}</span></a>
}
