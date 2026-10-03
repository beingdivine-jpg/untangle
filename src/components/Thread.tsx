export function Thread({ small = false }: { small?: boolean }) {
  if (small) return <svg className="thread-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M5 34C5 20 34 6 36 18C40 34 8 33 14 17C19 4 35 10 29 23C25 31 24 32 40 35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  return <svg className="hero-thread" viewBox="0 0 840 650" fill="none" aria-hidden="true"><path className="thread-shadow" d="M830 28C596 -12 692 277 490 287C258 300 312 105 442 159C570 212 389 417 217 429C98 438 169 563 3 624" /><path d="M830 24C596 -16 692 273 490 283C258 296 312 101 442 155C570 208 389 413 217 425C98 434 169 559 3 620" /></svg>
}
