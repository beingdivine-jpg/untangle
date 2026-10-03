import { ImagePlus, X } from 'lucide-react'
import { useId, useState } from 'react'
import type { useLocalImage } from './useLocalImage'

export function ImageReference({ image, compact = false }: { image: ReturnType<typeof useLocalImage>; compact?: boolean }) {
  const id = useId()
  const [dragging, setDragging] = useState(false)
  return <div className={`image-reference ${compact ? 'compact' : ''}`}>
    {image.url ? <div className="image-preview"><img src={image.url} alt="Your local settings image reference" /><div><strong>Image reference</strong><p>Confirm the details below. No image analysis.</p><div className="image-actions"><label className="replace-image">{image.busy ? 'Checking image…' : 'Replace image'}<input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Replace image reference" aria-describedby={`${id}-help ${image.error ? `${id}-error` : ''}`} aria-invalid={!!image.error} onChange={e => { if (e.target.files) void image.select(e.target.files); e.target.value = '' }} /></label><button type="button" className="text-button" onClick={image.clear}><X size={14} aria-hidden="true" />Remove image</button></div></div></div> : <label className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); void image.select(e.dataTransfer.files) }} htmlFor={id}><ImagePlus size={22} strokeWidth={1.4} aria-hidden="true" /><span><strong>{image.busy ? 'Checking your image…' : 'Add a settings screenshot'}</strong><small>Drop an image or <span className="underline">choose a file.</span></small></span><input id={id} type="file" accept="image/png,image/jpeg,image/webp" aria-label="Add a settings screenshot" aria-describedby={`${id}-help ${image.error ? `${id}-error` : ''}`} aria-invalid={!!image.error} onChange={e => { if (e.target.files) void image.select(e.target.files); e.target.value = '' }} /></label>}
    <p id={`${id}-help`} className="image-help">Optional. Use a redacted image. It stays in this tab in this prototype.<span>PNG, JPEG or WebP · up to 10 MB</span></p>
    {image.error && <p id={`${id}-error`} className="field-error" role="alert">{image.error}</p>}
  </div>
}
