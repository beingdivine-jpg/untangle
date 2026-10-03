import polish from './pl.json'

export type Locale = 'en' | 'pl'
const catalog: Record<string, string> = Object.assign(Object.create(null), polish)
const patterns = Object.entries(catalog).filter(([key]) => /\{\d+\}/.test(key))
  .sort(([a], [b]) => b.replace(/\{\d+\}/g, '').length - a.replace(/\{\d+\}/g, '').length)
  .map(([key, value]) => {
  const slots: string[] = []
  const pattern = key.split(/(\{\d+\})/).map(part => {
    if (/^\{\d+\}$/.test(part)) { slots.push(part); return '(.*?)' }
    return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }).join('')
  return { regex: new RegExp(`^${pattern}$`), value, slots }
})

// Translate presentation strings only. Personal text and stable data IDs never pass here.
export function translateText<T>(value: T, locale: Locale): T {
  if (locale === 'en' || typeof value !== 'string' || !value.trim()) return value
  const key = value.trim().replace(/\s+/g, ' ')
  let translated = catalog[key]
  if (!translated) {
    for (const pattern of patterns) {
      const match = key.match(pattern.regex)
      if (!match) continue
      translated = pattern.value.replace(/\{\d+\}/g, slot => {
        const captured = match[pattern.slots.indexOf(slot) + 1] ?? ''
        return translateText(captured, locale)
      })
      break
    }
  }
  if (!translated) return value
  return ((value.match(/^\s*/)?.[0] ?? '') + translated + (value.match(/\s*$/)?.[0] ?? '')) as T
}

export function localizedUrl(href: string, locale: Locale): string {
  if (href === '/research.html' || href === '/research-pl.html') return locale === 'pl' ? '/research-pl.html?lang=pl' : '/research.html?lang=en'
  if (locale === 'pl' && href.startsWith('https://support.google.com/')) return href.replace(/([?&])hl=en\b/, '$1hl=pl')
  return href
}
