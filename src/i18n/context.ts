import { createContext, useContext } from 'react'
import { localizedUrl, translateText } from './translate'
import type { Locale } from './translate'

export const LanguageContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({ locale: 'en', setLocale: () => {} })
export function useTranslation() {
  const { locale, setLocale } = useContext(LanguageContext)
  return { locale, setLocale, translate: <T,>(value: T) => translateText(value, locale), href: (url: string) => localizedUrl(url, locale) }
}
