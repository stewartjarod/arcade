import * as THREE from 'three'
import type { Realm } from './realms'
import { mulberry32 } from './textures'

// The sky is a big ball we see from the inside. It sits around the camera (see follow()), so it looks
// infinitely far away. Its colour fades from the horizon (exactly the fog colour, so the fog melts into it)
// up to a zenith colour picked for each realm. Everything here is cheap: one dome, one glow, a few sprites.

// Far enough that the overview camera (height 260, far plane 400) never clips it.
export const SKY_RADIUS = 300
const STAR_RADIUS = 280
const STAR_COUNT = 300

// The colour at the very top of the sky, per realm id. The horizon colour is always the realm's fog colour.
export const SKY_ZENITH: Record<string, number> = {
  cupboard: 0x5e3f5a, // warm kitchen glow: a mauve dusk
  candy: 0xff9fcf, // pastel candy pink, a bit deeper overhead
  garden: 0x4a9de0, // sunny blue
  frozen: 0x9fd3f5, // icy pale blue
  cellar: 0x2b211b, // dark, warm, torch-lit
  crystal: 0x3b1f7a, // deep violet
  clockwork: 0xb07a2a, // amber brass
  star: 0x0d0a3a, // starry indigo-black
}

// Realms that are dark enough to get stars (and a moon-coloured glow) instead of a sun and clouds.
const NIGHT_REALMS = new Set(['cellar', 'crystal', 'star'])
const CLOUD_REALMS = new Set(['cupboard', 'candy', 'garden'])

// Pure: the two colours for the dome. horizon always equals the fog colour, so fog and sky meet with no line.
export const skyColors = (realmId: string, fogHex: number) => ({
  horizon: fogHex,
  zenith: SKY_ZENITH[realmId] ?? fogHex,
})

export const isNightRealm = (realmId: string) => NIGHT_REALMS.has(realmId)

// Pure: random star spots on the upper half of a sphere. Same seed gives the same sky.
// Returns x,y,z triples packed in one Float32Array (ready for a BufferAttribute).
export const starDirections = (count: number, seed: number) => {
  const rng = mulberry32(seed)
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const up = 0.03 + rng() * 0.97 // height: keep them above the horizon line
    const ring = Math.sqrt(1 - up * up)
    const angle = rng() * Math.PI * 2
    out[i * 3] = Math.cos(angle) * ring * STAR_RADIUS
    out[i * 3 + 1] = up * STAR_RADIUS
    out[i * 3 + 2] = Math.sin(angle) * ring * STAR_RADIUS
  }
  return out
}

// A soft white dot that fades to nothing at the edge. Used for stars and the sun/moon glow.
const radialCanvas = (inner: string) => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, inner)
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return canvas
}

// A fluffy cloud: a few soft white blobs on one little wide canvas.
const cloudCanvas = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const blobs = [
    [40, 38, 26],
    [70, 30, 30],
    [96, 40, 22],
  ]
  for (const [x, y, r] of blobs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r!)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.7, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(x! - r!, y! - r!, r! * 2, r! * 2)
  }
  return canvas
}

// Sets every dome vertex to a colour between horizon (low down) and zenith (overhead).
const paintDome = (dome: THREE.Mesh, horizon: THREE.Color, zenith: THREE.Color) => {
  const pos = dome.geometry.getAttribute('position')
  const col = dome.geometry.getAttribute('color') as THREE.BufferAttribute
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    const up = pos.getY(i) / SKY_RADIUS // -1 (under us) to 1 (straight up)
    const t = THREE.MathUtils.smoothstep(up, 0, 0.7)
    c.copy(horizon).lerp(zenith, t)
    col.setXYZ(i, c.r, c.g, c.b)
  }
  col.needsUpdate = true
}

export const createSky = () => {
  const group = new THREE.Group()
  // Everything we make is kept here so dispose() can free it all.
  const owned: { dispose(): void }[] = []

  // 1. The dome: one draw call. Low segments are fine because the colour is a smooth gradient.
  const domeGeo = new THREE.SphereGeometry(SKY_RADIUS, 24, 12)
  domeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(domeGeo.attributes.position!.count * 3), 3))
  const domeMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })
  const dome = new THREE.Mesh(domeGeo, domeMat)
  dome.frustumCulled = false
  dome.renderOrder = -1000 // drawn first, so everything else paints over it
  group.add(dome)
  owned.push(domeGeo, domeMat)

  // 2. The sun (day) or moon (night) glow: one sprite.
  const glowTex = new THREE.CanvasTexture(radialCanvas('rgba(255,255,255,1)'))
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })
  const glow = new THREE.Sprite(glowMat)
  glow.position.set(-0.35, 0.45, -0.82).normalize().multiplyScalar(240)
  glow.scale.set(120, 120, 1)
  glow.renderOrder = -900
  glow.frustumCulled = false
  group.add(glow)
  owned.push(glowTex, glowMat)

  // 3. Two soft clouds for the sunny realms (day only).
  const cloudTex = new THREE.CanvasTexture(cloudCanvas())
  const clouds = [
    { at: [-150, 95, -120], scale: 150 },
    { at: [130, 115, 140], scale: 120 },
  ].map(({ at, scale }) => {
    const mat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: 0.9 })
    const sprite = new THREE.Sprite(mat)
    sprite.position.set(at[0]!, at[1]!, at[2]!)
    sprite.scale.set(scale, scale / 2, 1)
    sprite.renderOrder = -800
    sprite.frustumCulled = false
    group.add(sprite)
    owned.push(mat)
    return sprite
  })
  owned.push(cloudTex)

  // 4. A few hundred soft stars for the dark realms: one Points object, one draw call.
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starDirections(STAR_COUNT, 7), 3))
  const starMat = new THREE.PointsMaterial({ map: glowTex, color: 0xffffff, size: 3, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false })
  const stars = new THREE.Points(starGeo, starMat)
  stars.frustumCulled = false
  stars.renderOrder = -950
  group.add(stars)
  owned.push(starGeo, starMat)

  const horizonColor = new THREE.Color()
  const zenithColor = new THREE.Color()

  // Re-colours the sky for a realm. Only sets colours and visibility; no new objects, so it is cheap.
  const apply = (realm: Realm) => {
    const colors = skyColors(realm.id, realm.fog[0])
    horizonColor.set(colors.horizon)
    zenithColor.set(colors.zenith)
    paintDome(dome, horizonColor, zenithColor)

    const night = isNightRealm(realm.id)
    stars.visible = night
    clouds.forEach((cloud) => (cloud.visible = !night && CLOUD_REALMS.has(realm.id)))
    glowMat.color.set(night ? realm.glow : realm.sun[0])
    glowMat.opacity = night ? 0.6 : 0.5
  }

  // Keeps the dome centred on the camera, so it never gets closer or further away.
  const follow = (camera: THREE.Camera) => {
    group.position.copy(camera.position)
  }

  const dispose = () => {
    owned.forEach((thing) => thing.dispose())
    owned.length = 0
  }

  return { group, apply, follow, dispose }
}
