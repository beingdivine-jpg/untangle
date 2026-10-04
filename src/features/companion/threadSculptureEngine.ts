import * as THREE from 'three'
import { threadPoint } from './threadCurve'

export interface ThreadSculpture {
  setLooseness(value: number, immediate: boolean): void
  setMotion(value: boolean): void
  resize(): void
  dispose(): void
}

// An original, procedural sculpture. Geometry is prepared once; morph targets
// move the cords without rebuilding their meshes on every animation frame.
export function createThreadSculpture(canvas: HTMLCanvasElement): ThreadSculpture {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.3
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, .1, 50)
  camera.position.set(0, 1.2, 12)
  camera.lookAt(0, 0, 0)
  scene.add(new THREE.HemisphereLight(0xfffaf0, 0x50634b, 2.8))
  const key = new THREE.DirectionalLight(0xffffff, 4)
  key.position.set(-4, 6, 7)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0xffdab4, 2)
  rim.position.set(5, 1, -3)
  scene.add(rim)
  const group = new THREE.Group()
  group.rotation.z = -.22
  scene.add(group)

  const meshes: THREE.Mesh<THREE.TubeGeometry, THREE.MeshPhysicalMaterial>[] = []
  const resources: { dispose(): void }[] = []
  const colors = [0xe66b46, 0x668a64, 0xd5d785]
  for (let strand = 0; strand < 3; strand++) {
    const tight: THREE.Vector3[] = [], loose: THREE.Vector3[] = []
    for (let i = 0; i <= 160; i++) {
      tight.push(new THREE.Vector3(...threadPoint(i / 160, strand, 0)))
      loose.push(new THREE.Vector3(...threadPoint(i / 160, strand, 1)))
    }
    const radius = strand === 0 ? .105 : strand === 1 ? .08 : .058
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tight), 400, radius, 12, false)
    const relaxed = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(loose), 400, radius, 12, false)
    geometry.morphAttributes.position = [relaxed.getAttribute('position').clone()]
    geometry.morphAttributes.normal = [relaxed.getAttribute('normal').clone()]
    relaxed.dispose()
    const material = new THREE.MeshPhysicalMaterial({ color: colors[strand], roughness: .42, metalness: .04, clearcoat: .2, clearcoatRoughness: .55 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    group.add(mesh)
    meshes.push(mesh)
    resources.push(geometry, material)
  }

  let disposed = false, animated = false, frame = 0, last = 0, time = 0
  let current = 0, target = 0
  const render = () => {
    meshes.forEach(mesh => { if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[0] = current })
    renderer.render(scene, camera)
  }
  const schedule = () => { if (!disposed && !frame) frame = requestAnimationFrame(tick) }
  const tick = (now: number) => {
    frame = 0
    if (disposed) return
    // Cap idle motion at 30fps. User input and resize still draw immediately.
    if (now - last < 32) { schedule(); return }
    const delta = Math.min((now - last) / 1000, .06)
    last = now
    current += (target - current) * Math.min(1, delta * 8)
    if (animated) {
      time += delta
      group.rotation.y = Math.sin(time * .22) * .22
      group.rotation.x = Math.sin(time * .3) * .06
      group.position.y = Math.sin(time * .55) * .06
    }
    render()
    if (animated || Math.abs(target - current) > .001) schedule()
  }
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height || disposed) return
    const aspect = width / height
    const halfHeight = aspect < 1.2 ? 2.65 : 2.15
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect
    camera.top = halfHeight; camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
    render()
  }
  resize()
  return {
    resize,
    setLooseness(value, immediate) {
      target = Math.max(0, Math.min(1, value))
      if (immediate) { current = target; render() } else schedule()
    },
    setMotion(value) {
      animated = value
      if (value) schedule()
      else { cancelAnimationFrame(frame); frame = 0; current = target; render() }
    },
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      resources.forEach(resource => resource.dispose())
      renderer.dispose()
    },
  }
}
