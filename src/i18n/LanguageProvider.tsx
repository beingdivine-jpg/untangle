import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { LanguageContext, useTranslation } from './context'
import type { Locale } from './translate'
import './language.css'

const readLocale = (): Locale => new URLSearchParams(window.location.search).get('lang') === 'pl' ? 'pl' : 'en'
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>(readLocale)
  function setLocale(next: Locale) {
    const url = new URL(window.location.href)
    url.searchParams.set('lang', next)
    // Only the interface preference goes in the URL. No answers or notes are saved.
    window.history.replaceState(window.history.state, '', url)
    updateLocale(next)
  }
  useEffect(() => {
    document.documentElement.lang = locale
    document.title = locale === 'pl' ? 'Untangle — Twoje cyfrowe życie po rozstaniu' : 'Untangle — A little less tangled.'
  }, [locale])
  useEffect(() => {
    const restore = () => updateLocale(readLocale())
    window.addEventListener('popstate', restore)
    return () => window.removeEventListener('popstate', restore)
  }, [])
  return <LanguageContext value={{ locale, setLocale }}>{children}</LanguageContext>
}

export function LanguageSwitch() {
  const { locale, setLocale } = useTranslation()
  return <div className="language-switch" role="group" aria-label="Language / Język">
    <button type="button" lang="en" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>English</button>
    <button type="button" lang="pl" aria-pressed={locale === 'pl'} onClick={() => setLocale('pl')}>Polski</button>
  </div>
}
