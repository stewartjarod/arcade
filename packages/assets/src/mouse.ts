import { THREE } from '@arcade/engine'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * The Mouse Maze Math mouse: a plush, round, glossy "toy box" hero.
 * Faces +z, feet at y = 0, about 1.6 units tall. Its origin is between the feet.
 *
 *   const rig = mouseModel({ color: 0xa9805a, hat: 'crown' })
 *   scene.add(rig)
 *   // every frame:
 *   rig.animate(seconds, isWalking)
 *
 * Why it looks like fur without textures: each piece gets a colour on every
 * corner (vertex colour). The back and top are a bit darker, the belly and
 * muzzle lighter, so the shading looks soft. Everything is built from
 * simple shapes and merged, so a mouse is only about ten meshes.
 */
export type MouseHat = 'none' | 'bow' | 'party' | 'wizard' | 'crown'
export const MOUSE_HATS: MouseHat[] = ['none', 'bow', 'party', 'wizard', 'crown']

/** The mouse, plus an `animate` hook that only moves its child parts (never the root). */
export type MouseRig = THREE.Group & { animate(time: number, moving: boolean): void }

// Colours that are the same on every mouse.
const CREAM = 0xfff1e6
const INNER_EAR = 0xff9fb8
const NOSE = 0xff7a9c
const BLUSH = 0xff9ec0
const TAIL = 0xf6b3c8
const IRIS = 0x2b1d22
const WHITE = 0xffffff
const WHISKER = 0x5a4a44

// Where the animated parts pivot (their origin, in mouse space).
const EAR_AT = { x: 0.36, y: 1.2, z: 0.6 }
const ARM_AT = { x: 0.42, y: 0.9, z: 0.3 }
const FOOT_AT = { x: 0.26, y: 0.2, z: 0 }
const EYES_AT = { x: 0, y: 1.12, z: 0 }
const TAIL_AT = { x: 0, y: 0.42, z: -0.62 }
const HAT_AT: Record<Exclude<MouseHat, 'none'>, [number, number, number]> = {
  party: [0, 1.42, 0.74],
  wizard: [0, 1.42, 0.74],
  crown: [0, 1.42, 0.74],
  bow: [0.3, 1.46, 0.96],
}

/** Gives one corner's colour from its position and normal. */
type Pick = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => THREE.Color

// ---- colour helpers -------------------------------------------------------

/** Fur: darker on top and back, lighter underneath and at the front. */
function fur(base: THREE.Color, dim = 1): Pick {
  const c = new THREE.Color()
  return (_x, _y, _z, _nx, ny, nz) => c.copy(base).multiplyScalar(dim * (0.9 - 0.1 * ny + 0.06 * nz))
}

/** One flat colour. */
function solid(hex: number): Pick {
  const c = new THREE.Color(hex)
  return () => c
}

/** Writes per-corner colours onto a geometry (and drops the unused uv so merging works). */
function colour(g: THREE.BufferGeometry, pick: Pick): THREE.BufferGeometry {
  const pos = g.getAttribute('position')
  const nor = g.getAttribute('normal')
  const out = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const c = pick(pos.getX(i), pos.getY(i), pos.getZ(i), nor.getX(i), nor.getY(i), nor.getZ(i))
    out[i * 3] = c.r
    out[i * 3 + 1] = c.g
    out[i * 3 + 2] = c.b
  }
  g.deleteAttribute('uv')
  g.setAttribute('color', new THREE.BufferAttribute(out, 3))
  return g
}

// ---- shape helpers ----------------------------------------------------------

/** A squashed ball: the basic building block (a chubby sphere, not a sharp shape). */
function blob(sx: number, sy: number, sz: number, x: number, y: number, z: number, w = 10, h = 7) {
  const g = new THREE.SphereGeometry(1, w, h)
  g.scale(sx, sy, sz)
  g.translate(x, y, z)
  return g
}

function box(w: number, h: number, d: number, x: number, y: number, z: number) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y, z)
  return g
}

/** Joins geometries that all have the same attributes into one (fewer draw calls). */
function join(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(list, false)
  if (!g) throw new Error('mouse: geometry attributes do not match')
  return g
}

/** A pointed cone that is rounded at the tip, pointing out along +z. */
function snout() {
  const profile = [
    [0.22, 0], [0.2, 0.1], [0.16, 0.2], [0.11, 0.29], [0.06, 0.36], [0.02, 0.4], [0, 0.42],
  ].map(([r, h]) => new THREE.Vector2(r!, h!))
  const g = new THREE.LatheGeometry(profile, 16)
  g.rotateX(Math.PI / 2) // lathe height runs along +z now
  g.translate(0, 0.95, 1.0)
  return g
}

/** One whisker: a thin stick that fans out from the side of the snout. */
function whisker(side: number, row: number) {
  const dir = new THREE.Vector3(side, row * 0.2 - 0.05, 0.12).normalize()
  const start = new THREE.Vector3(side * 0.1, 0.94, 1.2)
  const g = new THREE.CylinderGeometry(0.012, 0.012, 0.6, 5)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir))
  g.translate(start.x + dir.x * 0.3, start.y + dir.y * 0.3, start.z + dir.z * 0.3)
  return g
}

// ---- cached parts -----------------------------------------------------------
// Geometry is built once per colour (or once overall) and shared by every mouse.
// Nothing here runs at import time, and nothing needs a canvas.

type FurParts = { body: THREE.BufferGeometry; ear: THREE.BufferGeometry; arm: THREE.BufferGeometry; foot: THREE.BufferGeometry }

function buildFur(hex: number): FurParts {
  const base = new THREE.Color(hex)
  const cream = new THREE.Color(CREAM)
  const belly = base.clone().lerp(cream, 0.45)
  const muzzle = base.clone().lerp(cream, 0.3)
  return {
    body: join([
      colour(blob(0.52, 0.52, 0.6, 0, 0.74, 0, 16, 12), fur(base)), // chest and back
      colour(blob(0.6, 0.5, 0.66, 0, 0.5, 0, 16, 12), fur(base)), // wide hips: a pear shape
      colour(blob(0.36, 0.4, 0.18, 0, 0.66, 0.48), fur(belly)), // lighter belly patch
      colour(blob(0.48, 0.45, 0.46, 0, 1.05, 0.78, 16, 12), fur(base)), // big head
      colour(blob(0.22, 0.17, 0.17, -0.3, 0.95, 0.92), fur(base)), // chubby cheeks
      colour(blob(0.22, 0.17, 0.17, 0.3, 0.95, 0.92), fur(base)),
      colour(snout(), fur(muzzle)),
    ]),
    // One ear, built around its pivot. Both sides use it (the ears are mirror images).
    ear: join([
      colour(blob(0.22, 0.22, 0.06, 0, 0.2, 0, 12, 8), fur(base, 0.92)),
      colour(blob(0.14, 0.14, 0.035, 0, 0.2, 0.04), solid(INNER_EAR)),
    ]),
    arm: join([
      colour(blob(0.11, 0.2, 0.11, 0, -0.18, 0), fur(base)),
      colour(blob(0.13, 0.12, 0.14, 0, -0.38, 0.03), fur(base)),
    ]),
    foot: colour(blob(0.15, 0.11, 0.22, 0, -0.09, 0.08), fur(base)),
  }
}

const furCache = new Map<number, FurParts>()
function furParts(hex: number): FurParts {
  let parts = furCache.get(hex)
  if (!parts) furCache.set(hex, (parts = buildFur(hex)))
  return parts
}

/** Glossy bits: nose, teeth, blush, whiskers. */
function buildTrim(): THREE.BufferGeometry {
  const parts = [
    colour(blob(0.085, 0.075, 0.085, 0, 0.99, 1.38, 12, 8), solid(NOSE)), // shiny pink nose
    colour(blob(0.1, 0.07, 0.02, -0.31, 0.92, 1.14), solid(BLUSH)), // blush cheeks
    colour(blob(0.1, 0.07, 0.02, 0.31, 0.92, 1.14), solid(BLUSH)),
    colour(box(0.07, 0.11, 0.03, -0.04, 0.8, 1.32), solid(WHITE)), // tiny buck teeth
    colour(box(0.07, 0.11, 0.03, 0.04, 0.8, 1.32), solid(WHITE)),
  ]
  for (const side of [-1, 1]) {
    for (const row of [-1, 0, 1]) parts.push(colour(whisker(side, row), solid(WHISKER)))
  }
  return join(parts)
}

/** Two glossy eyes: a dark iris with a big and a small white shine. Built around EYES_AT. */
function buildEyes(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  for (const side of [-1, 1]) {
    const x = side * 0.2
    const y = 1.12
    const z = 1.12
    parts.push(colour(blob(0.13, 0.13, 0.11, x, y, z, 12, 9), solid(IRIS)))
    parts.push(colour(blob(0.045, 0.045, 0.04, x + 0.045, y + 0.05, z + 0.11, 6, 5), solid(WHITE)))
    parts.push(colour(blob(0.02, 0.02, 0.02, x - 0.045, y - 0.05, z + 0.1, 5, 4), solid(WHITE)))
  }
  return join(parts).translate(-EYES_AT.x, -EYES_AT.y, -EYES_AT.z)
}

/** A curly pink tail that is thick at the body and thin at the tip. Built around TAIL_AT. */
function buildTail(): THREE.BufferGeometry {
  const points = [
    [0, 0.42, -0.62], [0, 0.38, -0.95], [0.12, 0.33, -1.25], [0.42, 0.36, -1.42],
    [0.68, 0.52, -1.36], [0.74, 0.72, -1.12], [0.6, 0.82, -0.98],
  ].map(([x, y, z]) => new THREE.Vector3(x!, y!, z!))
  const curve = new THREE.CatmullRomCurve3(points)
  const segs = 30
  const radial = 6
  const g = new THREE.TubeGeometry(curve, segs, 0.07, radial, false)
  // Shrink each ring toward the curve's centre line. That makes the tube taper.
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const centre = new THREE.Vector3()
  const p = new THREE.Vector3()
  for (let i = 0; i <= segs; i++) {
    const u = i / segs
    curve.getPointAt(u, centre)
    const k = 1 - 0.7 * u
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      p.fromBufferAttribute(pos, idx).sub(centre).multiplyScalar(k).add(centre)
      pos.setXYZ(idx, p.x, p.y, p.z)
    }
  }
  g.translate(-TAIL_AT.x, -TAIL_AT.y, -TAIL_AT.z)
  return colour(g, fur(new THREE.Color(TAIL)))
}

let shared: { trim: THREE.BufferGeometry; eyes: THREE.BufferGeometry; tail: THREE.BufferGeometry } | undefined
function sharedParts() {
  return (shared ??= { trim: buildTrim(), eyes: buildEyes(), tail: buildTail() })
}

// ---- hats -------------------------------------------------------------------
// Each hat sits on the head: its origin is the spot on top of the head (HAT_AT).

function partyHat(): THREE.BufferGeometry {
  const stripes = [0xd946ef, 0xffe066, 0x5ee0c8, 0xffffff].map((h) => new THREE.Color(h))
  const cone = new THREE.ConeGeometry(0.24, 0.5, 16, 4)
  cone.translate(0, 0.22, 0)
  // Stripes: each band of rings gets its own colour.
  colour(cone, (_x, y) => stripes[Math.floor((y + 0.03) / 0.125) % 4]!)
  const pompom = colour(blob(0.075, 0.075, 0.075, 0, 0.47, 0, 8, 6), solid(WHITE))
  return join([cone, pompom])
}

function wizardHat(): THREE.BufferGeometry {
  const indigo = 0x5b3fd1
  const gold = 0xf2c94c
  const cone = new THREE.ConeGeometry(0.3, 0.5, 16, 2)
  cone.translate(0, 0.23, 0)
  const brim = new THREE.CylinderGeometry(0.44, 0.44, 0.05, 20, 1)
  const band = new THREE.CylinderGeometry(0.25, 0.25, 0.07, 16, 1)
  band.translate(0, 0.09, 0)
  const parts = [colour(cone, solid(indigo)), colour(brim, solid(indigo)), colour(band, solid(gold))]
  // A band of little gold stars.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    parts.push(colour(blob(0.03, 0.03, 0.012, Math.cos(a) * 0.255, 0.09, Math.sin(a) * 0.255, 6, 4), solid(0xffe066)))
  }
  // A curled tip that bends over sideways (it stays under the 2.0 height limit).
  const tipCurve = new THREE.CatmullRomCurve3([
    [0, 0.46, 0], [0.02, 0.5, 0], [0.08, 0.5, 0], [0.13, 0.47, 0], [0.14, 0.42, 0],
  ].map(([x, y, z]) => new THREE.Vector3(x!, y!, z!)))
  parts.push(colour(new THREE.TubeGeometry(tipCurve, 10, 0.025, 5, false), solid(indigo)))
  return join(parts)
}

function crownHat(): THREE.BufferGeometry {
  const gold = 0xf2c94c
  const band = new THREE.CylinderGeometry(0.26, 0.23, 0.18, 18, 1)
  band.translate(0, 0.09, 0)
  const parts = [colour(band, solid(gold))]
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const spike = new THREE.ConeGeometry(0.07, 0.2, 8, 1)
    spike.translate(Math.cos(a) * 0.25, 0.28, Math.sin(a) * 0.25)
    parts.push(colour(spike, solid(gold)))
    // A gem between each pair of spikes, alternating red and blue.
    const b = ((i + 0.5) / 5) * Math.PI * 2
    const gem = new THREE.SphereGeometry(0.045, 8, 6)
    gem.translate(Math.cos(b) * 0.27, 0.09, Math.sin(b) * 0.27)
    parts.push(colour(gem, solid(i % 2 === 0 ? 0xff4d6d : 0x4cc9f0)))
  }
  return join(parts)
}

function bowHat(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  for (const side of [-1, 1]) {
    const loop = blob(0.12, 0.085, 0.035, 0, 0, 0, 10, 7)
    loop.rotateZ(side * 0.5) // tilt each loop out like wings
    loop.translate(side * 0.12, 0, 0)
    parts.push(colour(loop, solid(0xff4d8d)))
  }
  parts.push(colour(blob(0.055, 0.055, 0.05, 0, 0, 0.02, 8, 6), solid(0xd6336c))) // the knot
  return join(parts)
}

const hatCache = new Map<MouseHat, THREE.BufferGeometry>()
function hatGeometry(hat: Exclude<MouseHat, 'none'>): THREE.BufferGeometry {
  let g = hatCache.get(hat)
  if (!g) {
    const build = { party: partyHat, wizard: wizardHat, crown: crownHat, bow: bowHat }[hat]
    hatCache.set(hat, (g = build()))
  }
  return g
}

// ---- materials --------------------------------------------------------------

// A soft warm rim: light gets added where the surface turns away from the camera.
// It stays under 0.12, so it never pushes the colour past 1.0 and triggers the bloom.
const RIM_GLOW = `#include <emissivemap_fragment>
  float rimFacing = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
  totalEmissiveRadiance += vec3(1.0, 0.85, 0.7) * pow(1.0 - rimFacing, 3.0) * 0.12;`

function makeMaterial(roughness: number) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness, metalness: 0 })
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', RIM_GLOW)
  }
  // Every material here uses the same shader code, so they can share one program.
  m.customProgramCacheKey = () => 'mouse-rim'
  return m
}

let mats: { fur: THREE.MeshStandardMaterial; gloss: THREE.MeshStandardMaterial; hat: THREE.MeshStandardMaterial } | undefined
function materials() {
  return (mats ??= { fur: makeMaterial(0.75), gloss: makeMaterial(0.25), hat: makeMaterial(0.5) })
}

// ---- building the mouse -----------------------------------------------------

function part(geo: THREE.BufferGeometry, material: THREE.Material) {
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  return m
}

/** Puts a child under a group whose origin is the pivot point. */
function pivoted(at: { x: number; y: number; z: number }, child: THREE.Object3D) {
  const g = new THREE.Group()
  g.position.set(at.x, at.y, at.z)
  g.add(child)
  return g
}

export function mouseModel({ color = 0xb8b8c4, hat = 'none' as MouseHat } = {}): MouseRig {
  const fur = furParts(color)
  const common = sharedParts()
  const m = materials()

  const body = part(fur.body, m.fur)
  const trim = part(common.trim, m.gloss)
  const eyes = pivoted(EYES_AT, part(common.eyes, m.gloss))
  const earL = pivoted({ x: -EAR_AT.x, y: EAR_AT.y, z: EAR_AT.z }, part(fur.ear, m.fur))
  const earR = pivoted(EAR_AT, part(fur.ear, m.fur))
  const armL = pivoted({ x: -ARM_AT.x, y: ARM_AT.y, z: ARM_AT.z }, part(fur.arm, m.fur))
  const armR = pivoted(ARM_AT, part(fur.arm, m.fur))
  const footL = pivoted({ x: -FOOT_AT.x, y: FOOT_AT.y, z: FOOT_AT.z }, part(fur.foot, m.fur))
  const footR = pivoted(FOOT_AT, part(fur.foot, m.fur))
  const tail = pivoted(TAIL_AT, part(common.tail, m.fur))

  // Rest poses: ears stick out a little, arms hang out from the body.
  earL.rotation.z = 0.25
  earR.rotation.z = -0.25
  armL.rotation.z = 0.12
  armR.rotation.z = -0.12

  const rig = new THREE.Group()
  rig.add(body, trim, eyes, earL, earR, armL, armR, footL, footR, tail)
  if (hat !== 'none') {
    const at = HAT_AT[hat]
    rig.add(pivoted({ x: at[0], y: at[1], z: at[2] }, part(hatGeometry(hat), m.hat)))
  }

  // The per-frame hook. Only child parts move, so world.ts keeps owning the root.
  // It does no allocations; it only sets numbers on the parts.
  let last = 0
  let walk = 0 // 0 = standing still, 1 = walking; eases between the two
  const animate = (t: number, moving: boolean) => {
    const dt = Math.min(Math.max(t - last, 0), 0.1)
    last = t
    walk += ((moving ? 1 : 0) - walk) * (1 - Math.exp(-dt * 10))

    // Walk cycle: feet swing in opposite pairs, and the arms swing against the legs.
    const step = Math.sin(t * 11) * 0.6 * walk
    footL.rotation.x = step
    footR.rotation.x = -step
    armL.rotation.x = -step * 0.8
    armR.rotation.x = step * 0.8

    // Blink: a quick squeeze of the eyes every few seconds.
    const blinkT = (t + 0.7) % 3.6
    eyes.scale.y = blinkT < 0.14 ? 1 - Math.sin((blinkT / 0.14) * Math.PI) * 0.9 : 1

    // Ears: a slow idle wiggle, a quick twitch now and then, and small flaps while walking.
    const twitchT = t % 5.5
    const twitch = twitchT < 0.3 ? Math.sin((twitchT / 0.3) * Math.PI * 2) * 0.3 : 0
    const idle = (Math.sin(t * 1.6) * 0.06 + twitch) * (1 - walk)
    const wiggle = idle + Math.sin(t * 16) * 0.12 * walk
    earL.rotation.z = 0.25 + wiggle
    earR.rotation.z = -0.25 - wiggle

    // Tail: sways slowly when standing, and quickly when walking.
    tail.rotation.y = Math.sin(t * (moving ? 10 : 2.6)) * (moving ? 0.3 : 0.14)
  }

  return Object.assign(rig, { animate })
}
