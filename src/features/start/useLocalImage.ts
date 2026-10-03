import { useCallback, useEffect, useRef, useState } from 'react'
import { imageDimensions, MAX_BYTES, validateImageDimensions } from './image'

export function useLocalImage() {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const current = useRef<string | null>(null)
  const pending = useRef(new Set<string>())
  const generation = useRef(0)
  const clear = useCallback(() => {
    generation.current++
    if (current.current) URL.revokeObjectURL(current.current)
    for (const item of pending.current) URL.revokeObjectURL(item)
    pending.current.clear()
    current.current = null
    setUrl(null); setError(''); setBusy(false)
  }, [])
  useEffect(() => () => {
    generation.current++
    if (current.current) URL.revokeObjectURL(current.current)
    for (const item of pending.current) URL.revokeObjectURL(item)
  }, [])
  const select = async (files: FileList | File[]) => {
    if (!files.length) return
    const ticket = ++generation.current
    setError(''); setBusy(false)
    if (files.length !== 1) { setError('Choose one image at a time. Your previous reference has been kept.'); return }
    const file = files[0]
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Use a PNG, JPEG or WebP image. Other file types are not supported.'); return }
    if (file.size > MAX_BYTES) { setError('This file is larger than 10 MB. Choose a smaller image.'); return }
    setBusy(true)
    let candidate: string | null = null
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      if (ticket !== generation.current) return
      validateImageDimensions(...imageDimensions(bytes, file.type))
      candidate = URL.createObjectURL(file)
      pending.current.add(candidate)
      const img = new Image()
      img.src = candidate
      await img.decode()
      validateImageDimensions(img.naturalWidth, img.naturalHeight)
      if (ticket !== generation.current) return
      if (current.current) URL.revokeObjectURL(current.current)
      current.current = candidate
      pending.current.delete(candidate)
      setUrl(candidate)
      candidate = null
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      if (ticket === generation.current) setError(message.startsWith('This image') || message.startsWith('Please use') ? message : 'This image could not be read. Try another image or continue without it.')
    } finally {
      if (candidate) { URL.revokeObjectURL(candidate); pending.current.delete(candidate) }
      if (ticket === generation.current) setBusy(false)
    }
  }
  return { url, error, busy, clear, select }
}
