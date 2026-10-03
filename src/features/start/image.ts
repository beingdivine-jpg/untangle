// Read image dimensions before decoding. A small compressed image can otherwise
// allocate an enormous bitmap. Only static, supported raster formats are allowed.
export const MAX_BYTES = 10 * 1024 * 1024
export const MAX_PIXELS = 16_000_000
export const MAX_DIMENSION = 8_000
export function imageDimensions(bytes: Uint8Array, type: string): [number, number] {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (offset: number, length: number) => String.fromCharCode(...bytes.slice(offset, offset + length))
  if (type === 'image/png' && bytes.length >= 24 && v.getUint32(0) === 0x89504e47 && v.getUint32(4) === 0x0d0a1a0a && ascii(12, 4) === 'IHDR') return [v.getUint32(16), v.getUint32(20)]
  if (type === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let p = 2
    while (p + 8 < bytes.length) {
      if (bytes[p] !== 0xff) break
      while (bytes[p] === 0xff) p++
      const marker = bytes[p++]
      if (marker === 0xd9 || marker === 0xda) break
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
      const length = v.getUint16(p)
      if (length < 2 || p + length > bytes.length) break
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) return [v.getUint16(p + 5), v.getUint16(p + 3)]
      p += length
    }
  }
  if (type === 'image/webp' && bytes.length >= 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const kind = ascii(12, 4)
    if (kind === 'VP8X') {
      if (bytes[20] & 2) throw new Error('Please use a still image, rather than an animated WebP.')
      return [1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16)]
    }
    if (kind === 'VP8 ' && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return [v.getUint16(26, true) & 0x3fff, v.getUint16(28, true) & 0x3fff]
    if (kind === 'VP8L' && bytes[20] === 0x2f) return [1 + bytes[21] + ((bytes[22] & 0x3f) << 8), 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10)]
  }
  throw new Error('This image could not be read. Please choose a valid PNG, JPEG or WebP, or continue without it.')
}
export function validateImageDimensions(width: number, height: number) {
  if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION || width * height > MAX_PIXELS) throw new Error('This image is too large to display. Use at most 8,000 pixels per side and 16 megapixels.')
}
