import { useEffect, useRef, useState } from 'react'

type Point = { x: number; y: number; phase: number; weight: number }
const SOURCE = '/art/untangle-ink.webp'

/** An ink drawing, not an account scan. All pixels and motion stay on this device. */
export function InkPortrait({ playing, replay }: { playing: boolean; replay: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const pointer = useRef({ x: -1000, y: -1000, until: 0 })
  const controls = useRef({ playing, replay })
  const wake = useRef<() => void>(() => {})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    controls.current = { playing, replay }
    wake.current()
  }, [playing, replay])

  useEffect(() => {
    const el = canvas.current, container = host.current
    const ctx = el?.getContext('2d')
    if (!el || !container || !ctx) return
    let disposed = false, frame = 0, width = 0, height = 0, time = 0, last = 0, burst = 1
    let seenReplay = controls.current.replay
    const buckets: Point[][] = Array.from({ length: 5 }, () => [])
    const source = new Image()
    let loaded = false
    const draw = () => {
      if (!width || !height || !loaded) return
      ctx.clearRect(0, 0, width, height)
      const scale = Math.min(width / 435, height / 515)
      const offsetX = (width - 400 * scale) / 2, offsetY = (height - 600 * scale) / 2
      const p = pointer.current
      const interactive = controls.current.playing && performance.now() < p.until
      // Wide, breathing ink threads remain legible even when Safari limits frame rate.
      ctx.lineWidth = .8
      for (let strand = 0; strand < 5; strand++) {
        ctx.strokeStyle = strand % 2 ? '#9c57444d' : '#817d703b'
        ctx.beginPath()
        for (let j = 0; j <= 70; j++) {
          const u = j / 70, x = width * (.55 + .42 * u)
          const y = height * (.36 + .085 * strand) + Math.sin(u * 8 + time * .7 + strand) * (16 + u * 31)
          if (!j) ctx.moveTo(x, y); else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
      buckets.forEach((points, bucket) => {
        ctx.fillStyle = `rgba(43, 40, 36, ${.28 + bucket * .17})`
        ctx.beginPath()
        for (const dot of points) {
          const edge = Math.max(0, Math.abs(dot.x - 185) / 185 - .32)
          let x = offsetX + dot.x * scale + Math.sin(time * .75 + dot.y * .026) * edge * 7
          let y = offsetY + dot.y * scale + Math.cos(time * .6 + dot.x * .023) * edge * 4
          const spread = burst * (12 + dot.weight * 62)
          x += Math.cos(dot.phase) * spread; y += Math.sin(dot.phase) * spread
          if (interactive) {
            const dx = x - p.x, dy = y - p.y, distance = Math.hypot(dx, dy)
            if (distance < 85 && distance > .1) {
              const push = (1 - distance / 85) ** 2 * 32
              x += dx / distance * push; y += dy / distance * push
            }
          }
          const radius = Math.max(.5, scale * (.58 + dot.weight * .32))
          ctx.moveTo(x + radius, y); ctx.arc(x, y, radius, 0, Math.PI * 2)
        }
        ctx.fill()
      })
      el.dataset.frame = String(Number(el.dataset.frame ?? 0) + 1)
    }
    const tick = (now: number) => {
      frame = 0
      if (disposed || !controls.current.playing || !loaded) return
      if (now - last >= 1000 / 30) {
        const delta = Math.min((now - last) / 1000, .06)
        last = now; time += delta
        if (seenReplay !== controls.current.replay) { seenReplay = controls.current.replay; burst = 1 }
        burst = Math.max(0, burst - delta * .52)
        draw()
      }
      frame = requestAnimationFrame(tick)
    }
    wake.current = () => {
      cancelAnimationFrame(frame); frame = 0
      if (controls.current.playing) { last = performance.now(); frame = requestAnimationFrame(tick) }
      else { burst = 0; draw() }
    }
    const resize = () => {
      const box = container.getBoundingClientRect()
      if (!box.width || !box.height) return
      width = box.width; height = box.height
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      el.width = Math.round(width * ratio); el.height = Math.round(height * ratio)
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    source.onload = () => {
      if (disposed) return
      try {
        const sample = document.createElement('canvas')
        sample.width = 400; sample.height = 600
        const sampleContext = sample.getContext('2d', { willReadFrequently: true })
        if (!sampleContext) return
        sampleContext.drawImage(source, 0, 0, 400, 600)
        const pixels = sampleContext.getImageData(0, 0, 400, 600).data
        // Deterministic sampling avoids flicker and preserves the same drawing on resize.
        let seed = 417
        const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
        for (let y = 0; y < 600; y += 1.6) for (let x = 0; x < 400; x += 1.6) {
          const px = Math.min(399, Math.floor(x + random() * 1.5)), py = Math.min(599, Math.floor(y + random() * 1.5))
          const index = (py * 400 + px) * 4
          const ink = pixels[index + 3] / 255 * (1 - (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 765)
          if (ink < .06 || random() > ink * 1.6) continue
          buckets[Math.min(4, Math.floor(ink * 5))].push({ x: px, y: py, phase: random() * Math.PI * 2, weight: random() })
        }
        loaded = true; if (!controls.current.playing) burst = 0
        resize(); setReady(true); wake.current()
      } catch { /* The original transparent artwork remains visible if canvas is unavailable. */ }
    }
    source.src = SOURCE
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); source.onload = null; wake.current = () => {} }
  }, [])

  return <div ref={host} className="ink-portrait" data-ready={ready} aria-hidden="true" onPointerMove={event => {
    if (event.pointerType === 'touch') return
    const box = event.currentTarget.getBoundingClientRect()
    pointer.current = { x: event.clientX - box.left, y: event.clientY - box.top, until: performance.now() + 160 }
  }} onPointerDown={event => {
    const box = event.currentTarget.getBoundingClientRect()
    pointer.current = { x: event.clientX - box.left, y: event.clientY - box.top, until: performance.now() + 700 }
  }}>
    <img className="ink-fallback" src={SOURCE} alt="" width="1024" height="1536" fetchPriority="high"/>
    <canvas ref={canvas} className="ink-canvas"/>
  </div>
}
