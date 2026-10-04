import { useLayoutEffect, useRef } from 'react'

// The header wraps with language, text size and viewport width. Keep native
// anchor, keyboard and scroll-into-view navigation clear of its measured edge.
export function useHeaderOffset<T extends HTMLElement>(active = true) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const header = ref.current
    if (!active || !header) return
    const measure = () => {
      const height = header.getBoundingClientRect().height
      if (height) document.documentElement.style.setProperty('--app-header-height', `${Math.ceil(height)}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(header)
    return () => observer.disconnect()
  }, [active])
  return ref
}
