// Shared by the 3D sculpture and its lightweight drawing fallback.
export function threadPoint(t: number, strand: number, looseness: number) {
  const a = t * Math.PI * 3.4 - 2.2, phase = strand * 2.1
  const radius = 1.12 + .38 * Math.cos(3 * a + phase)
  const tight = [
    radius * Math.cos(2 * a + phase) * 1.35,
    radius * Math.sin(2 * a + phase) * .84,
    .66 * Math.sin(3 * a + phase) + (strand - 1) * .12,
  ]
  const loose = [
    (t - .5) * 6.1,
    Math.sin(t * Math.PI * 2 + strand * .65) * .58 + (strand - 1) * .69,
    Math.cos(t * Math.PI * 2 + strand) * .45,
  ]
  return tight.map((value, index) => value + (loose[index] - value) * looseness)
}

export function threadDrawing(strand: number, looseness: number) {
  return Array.from({ length: 161 }, (_, index) => {
    const [x, y] = threadPoint(index / 160, strand, looseness)
    const tiltedX = x * Math.cos(-.22) - y * Math.sin(-.22)
    const tiltedY = x * Math.sin(-.22) + y * Math.cos(-.22)
    return `${index ? 'L' : 'M'}${(400 + tiltedX * 100).toFixed(1)},${(245 - tiltedY * 100).toFixed(1)}`
  }).join(' ')
}
