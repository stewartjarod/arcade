import { THREE } from '@arcade/engine'

/**
 * The Sun, the eight planets and a rocket — drawn in code, no image files.
 * Sizes are not to scale (Jupiter would be 11× Earth!), but big ones are big and small ones small.
 *
 *   scene.add(planetModel('Saturn'))       // with rings
 *   scene.add(sunModel())
 *   scene.add(rocketModel({ color: '#ff6b6b' }))
 */

export type PlanetName = 'Mercury' | 'Venus' | 'Earth' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune'

/** Radius of each planet model (Earth = 1). */
export const PLANET_SIZE: Record<PlanetName, number> = {
  Mercury: 0.5, Venus: 0.9, Earth: 1, Mars: 0.7, Jupiter: 2.6, Saturn: 2.2, Uranus: 1.6, Neptune: 1.55,
}

/** Main color of each planet, for icons and UI. */
export const PLANET_COLOR: Record<PlanetName, string> = {
  Mercury: '#9c9690', Venus: '#e8c07a', Earth: '#3d7fd9', Mars: '#d0562f',
  Jupiter: '#d8a878', Saturn: '#e6cf8e', Uranus: '#9fe3e8', Neptune: '#3b5fe0',
}

// --- Textures, painted on a canvas ---

function canvasTexture(w: number, h: number, paint: (cx: CanvasRenderingContext2D) => void) {
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  paint(cv.getContext('2d')!)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// A little seeded randomness, so each planet looks the same every time.
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

/** Horizontal bands (gas giants). */
const bands = (colors: string[], seed: number, extra?: (cx: CanvasRenderingContext2D) => void) =>
  canvasTexture(512, 256, (cx) => {
    const r = seeded(seed)
    let y = 0
    while (y < 256) {
      const h = 6 + r() * 22
      cx.fillStyle = colors[Math.floor(r() * colors.length)]!
      cx.fillRect(0, y, 512, h + 1)
      y += h
    }
    // Soften the stripes.
    cx.globalAlpha = 0.25
    for (let i = 0; i < 40; i++) {
      cx.fillStyle = colors[Math.floor(r() * colors.length)]!
      cx.beginPath()
      cx.ellipse(r() * 512, r() * 256, 20 + r() * 60, 2 + r() * 4, 0, 0, Math.PI * 2)
      cx.fill()
    }
    cx.globalAlpha = 1
    extra?.(cx)
  })

/** A base color with blotches (rocky planets). */
const blotches = (base: string, spots: string[], seed: number, count = 60, size = 30) =>
  canvasTexture(512, 256, (cx) => {
    const r = seeded(seed)
    cx.fillStyle = base
    cx.fillRect(0, 0, 512, 256)
    for (let i = 0; i < count; i++) {
      cx.fillStyle = spots[Math.floor(r() * spots.length)]!
      cx.globalAlpha = 0.35 + r() * 0.5
      cx.beginPath()
      cx.arc(r() * 512, r() * 256, 3 + r() * size, 0, Math.PI * 2)
      cx.fill()
    }
    cx.globalAlpha = 1
  })

function earthTexture() {
  return canvasTexture(512, 256, (cx) => {
    const r = seeded(3)
    cx.fillStyle = '#2f6fd0'
    cx.fillRect(0, 0, 512, 256)
    // Continents: clusters of green and tan blobs.
    for (let c = 0; c < 7; c++) {
      const [x, y] = [r() * 512, 50 + r() * 156]
      for (let i = 0; i < 18; i++) {
        cx.fillStyle = r() < 0.8 ? '#3f9a4a' : '#c8b27a'
        cx.beginPath()
        cx.arc(x + (r() - 0.5) * 90, y + (r() - 0.5) * 60, 8 + r() * 18, 0, Math.PI * 2)
        cx.fill()
      }
    }
    // Ice caps and a few clouds.
    cx.fillStyle = '#f4f8ff'
    cx.fillRect(0, 0, 512, 14)
    cx.fillRect(0, 242, 512, 14)
    cx.globalAlpha = 0.6
    for (let i = 0; i < 25; i++) {
      cx.beginPath()
      cx.ellipse(r() * 512, r() * 256, 20 + r() * 40, 4 + r() * 6, 0, 0, Math.PI * 2)
      cx.fill()
    }
    cx.globalAlpha = 1
  })
}

function ringTexture(inner: string, outer: string) {
  return canvasTexture(256, 8, (cx) => {
    const g = cx.createLinearGradient(0, 0, 256, 0)
    g.addColorStop(0, 'rgba(0,0,0,0)')
    g.addColorStop(0.08, inner)
    g.addColorStop(0.45, outer)
    g.addColorStop(0.5, 'rgba(0,0,0,0.15)') // the Cassini gap
    g.addColorStop(0.56, outer)
    g.addColorStop(0.95, inner)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    cx.fillStyle = g
    cx.fillRect(0, 0, 256, 8)
  })
}

const textures = new Map<string, THREE.Texture>()
const once = (name: string, make: () => THREE.Texture) => textures.get(name) ?? (textures.set(name, make()), textures.get(name)!)

function planetTexture(name: PlanetName) {
  return once(name, () => {
    switch (name) {
      case 'Mercury': return blotches('#9c9690', ['#7a746e', '#b8b2ab', '#6a6560'], 1, 90, 14)
      case 'Venus': return bands(['#e8c07a', '#f0d197', '#d9a95e', '#f5dca8'], 2)
      case 'Earth': return earthTexture()
      case 'Mars': return canvasTexture(512, 256, (cx) => {
        const tex = blotches('#c9532e', ['#a3401f', '#e07a45', '#8c3518'], 4, 70, 26).image as HTMLCanvasElement
        cx.drawImage(tex, 0, 0)
        cx.fillStyle = '#f4f1ee' // polar ice cap
        cx.fillRect(0, 0, 512, 16)
      })
      case 'Jupiter': return bands(['#d8a878', '#f0dcc0', '#b9825a', '#e8c9a0', '#a8704a'], 5, (cx) => {
        cx.fillStyle = '#c0452d' // the Great Red Spot
        cx.beginPath()
        cx.ellipse(330, 170, 34, 18, 0, 0, Math.PI * 2)
        cx.fill()
      })
      case 'Saturn': return bands(['#e6cf8e', '#f2e2b0', '#d4b870', '#eadbb0'], 6)
      case 'Uranus': return bands(['#9fe3e8', '#a9e9ed', '#94d9df'], 7)
      case 'Neptune': return bands(['#3b5fe0', '#4a6ff0', '#3353c8', '#5a80f5'], 8, (cx) => {
        cx.fillStyle = '#23349a' // the Great Dark Spot
        cx.beginPath()
        cx.ellipse(200, 150, 26, 14, 0, 0, Math.PI * 2)
        cx.fill()
      })
    }
  })
}

const sphere = new THREE.SphereGeometry(1, 48, 32)

/**
 * A planet, centered at its middle. Its radius is PLANET_SIZE[name] (Earth = 1).
 * The planet itself is `userData.globe` — spin that, not the group, so rings and tilt stay put.
 */
export function planetModel(name: PlanetName) {
  const size = PLANET_SIZE[name]
  const group = new THREE.Group()
  group.name = name
  const globe = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ map: planetTexture(name), roughness: 0.9 }))
  globe.scale.setScalar(size)
  const tilt = new THREE.Group()
  tilt.add(globe)
  group.add(tilt)
  group.userData.globe = globe

  if (name === 'Saturn' || name === 'Uranus') {
    const saturn = name === 'Saturn'
    const ringGeo = new THREE.RingGeometry(size * (saturn ? 1.3 : 1.5), size * (saturn ? 2.3 : 1.8), 96)
    // Map the ring texture from inside to outside.
    const pos = ringGeo.attributes.position!
    const uv = ringGeo.attributes.uv!
    const v = new THREE.Vector3()
    const [r0, r1] = [size * (saturn ? 1.3 : 1.5), size * (saturn ? 2.3 : 1.8)]
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      uv.setXY(i, (v.length() - r0) / (r1 - r0), 0.5)
    }
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        map: once(`${name}-ring`, () => (saturn ? ringTexture('rgba(210,190,140,.7)', 'rgba(240,225,180,.95)') : ringTexture('rgba(180,230,235,.2)', 'rgba(200,240,245,.35)'))),
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      }),
    )
    ring.rotation.x = -Math.PI / 2
    tilt.add(ring)
  }

  // Tilts: Saturn leans a little; Uranus lies on its side.
  if (name === 'Saturn') tilt.rotation.z = 0.47
  if (name === 'Uranus') tilt.rotation.z = 1.71
  if (name === 'Earth') {
    tilt.rotation.z = 0.41
    const moon = new THREE.Mesh(sphere, new THREE.MeshStandardMaterial({ map: once('Moon', () => blotches('#bdbab5', ['#8f8c88', '#d8d5d0'], 9, 60, 12)) }))
    moon.scale.setScalar(0.27)
    moon.position.set(2.2, 0.3, 0)
    const orbit = new THREE.Group()
    orbit.add(moon)
    group.add(orbit)
    group.userData.moonOrbit = orbit
  }
  return group
}

/** The Sun: a glowing ball with a soft halo. Radius about 5. */
export function sunModel() {
  const group = new THREE.Group()
  group.name = 'Sun'
  const tex = once('Sun', () => blotches('#ffb52e', ['#ffd45e', '#ff9a1f', '#fff08a'], 10, 120, 20))
  const ball = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex }))
  ball.scale.setScalar(5)
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: once('halo', () =>
        canvasTexture(128, 128, (cx) => {
          const g = cx.createRadialGradient(64, 64, 20, 64, 64, 64)
          g.addColorStop(0, 'rgba(255,210,90,0.9)')
          g.addColorStop(0.4, 'rgba(255,170,40,0.35)')
          g.addColorStop(1, 'rgba(255,140,0,0)')
          cx.fillStyle = g
          cx.fillRect(0, 0, 128, 128)
        }),
      ),
      transparent: true,
      depthWrite: false,
    }),
  )
  halo.scale.setScalar(22)
  group.add(halo, ball)
  group.userData.globe = ball
  return group
}

/** A cartoon rocket pointing toward -z (the way it flies), with a flame at `userData.flame`. */
export function rocketModel({ color = '#ff6b6b' as THREE.ColorRepresentation } = {}) {
  const group = new THREE.Group()
  const mat = (c: THREE.ColorRepresentation, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, ...extra })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 2, 24), mat('#f4f4f8'))
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 24), mat(color))
  nose.position.y = 1.5
  const window = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat('#4dabf7', { emissive: '#1c5a99', emissiveIntensity: 0.6 }))
  window.position.set(0, 0.4, 0.45)
  window.scale.z = 0.5
  const fins = [0, 1, 2].map((i) => {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.6), mat(color))
    const a = (i / 3) * Math.PI * 2
    fin.position.set(Math.sin(a) * 0.55, -0.75, Math.cos(a) * 0.55)
    fin.rotation.y = a
    return fin
  })
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.1, 16), new THREE.MeshBasicMaterial({ color: '#ffb52e', transparent: true, opacity: 0.9 }))
  flame.position.y = -1.5
  flame.rotation.x = Math.PI
  const ship = new THREE.Group()
  ship.add(body, nose, window, ...fins, flame)
  ship.rotation.x = -Math.PI / 2 // lie down, nose forward (-z)
  group.add(ship)
  group.userData.flame = flame
  group.traverse((o) => (o.castShadow = true))
  return group
}
