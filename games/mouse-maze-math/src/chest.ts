import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// The treasure chest at the end of a maze, and the little cheese wedge that sits beside it.
// Shapes are shared between every chest (built the first time they are needed), so making a new chest is cheap.
// Only the things that belong to ONE chest (its coins, its sparkles, its glow) are freed by dispose().

// Lazy: build a shared thing the first time someone asks, then keep it. Keeps module import free of work.
function lazy<T>(make: () => T): () => T {
  let value: T | undefined
  return () => {
    if (value === undefined) value = make()
    return value
  }
}

// A soft round dot, drawn on a small canvas. The tests run in node (no canvas), so there is no dot there.
let dotCache: THREE.Texture | null | undefined
const dotTexture = (): THREE.Texture | null => {
  if (dotCache !== undefined) return dotCache
  if (typeof document === 'undefined') {
    dotCache = null
    return null
  }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.7)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  dotCache = new THREE.CanvasTexture(canvas)
  return dotCache
}

// ---- shared shapes ----
const roundBlock = lazy(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.12))
const plainBox = lazy(() => new THREE.BoxGeometry(1, 1, 1))
const ball = lazy(() => new THREE.SphereGeometry(1, 8, 6))
const coin = lazy(() => new THREE.CylinderGeometry(1, 1, 1, 8))
// Half a tube of radius 1 that runs across the chest: the curved lid. Its flat side is at the bottom.
const lidArc = lazy(() => {
  const g = new THREE.CylinderGeometry(0.55, 0.55, 1.7, 12, 1, false, 0, Math.PI)
  g.rotateZ(Math.PI / 2) // lay the tube on its side so it runs across the chest
  g.translate(0, 0, 0.55) // the lid group pivots at its back edge, so the arc sits forward of it
  return g
})
// A thin gold ring, half of it, used as the metal bands that go over the lid.
const band = lazy(() => new THREE.TorusGeometry(1, 0.06, 4, 14, Math.PI))
const gem = lazy(() => new THREE.SphereGeometry(1, 8, 6))

// ---- shared materials ----
const woodMat = lazy(() => new THREE.MeshStandardMaterial({ color: 0xa96a34, roughness: 0.45, metalness: 0, side: THREE.DoubleSide }))
const seamMat = lazy(() => new THREE.MeshStandardMaterial({ color: 0x5a3517, roughness: 0.5, metalness: 0 }))
const goldMat = lazy(() => new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.45, metalness: 0.3 }))
const darkMat = lazy(() => new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.6, metalness: 0 }))
const gemMat = lazy(() => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.1 }))
const cheeseMat = lazy(() => new THREE.MeshStandardMaterial({ color: 0xffe27a, roughness: 0.55, metalness: 0 }))
const holeMat = lazy(() => new THREE.MeshStandardMaterial({ color: 0x9a7224, roughness: 0.7, metalness: 0 }))
const cheeseHole = lazy(() => new THREE.SphereGeometry(0.07, 6, 4))

// One scratch object, used only while building (never per frame).
const scratch = new THREE.Object3D()
type Part = { x: number; y: number; z: number; s: [number, number, number]; r?: [number, number, number] }

// Many copies of one shape in a single draw call.
const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, parts: Part[]) => {
  const mesh = new THREE.InstancedMesh(geo, mat, parts.length)
  parts.forEach((p, i) => {
    scratch.position.set(p.x, p.y, p.z)
    scratch.rotation.set(p.r?.[0] ?? 0, p.r?.[1] ?? 0, p.r?.[2] ?? 0)
    scratch.scale.set(p.s[0], p.s[1], p.s[2])
    scratch.updateMatrix()
    mesh.setMatrixAt(i, scratch.matrix)
  })
  mesh.instanceMatrix.needsUpdate = true
  return mesh
}

// Gold coins in a rounded heap. Outer coins sit lower, so the heap looks like a mound.
const coinPile = (count: number): Part[] => {
  const parts: Part[] = []
  for (let i = 0; i < count; i++) {
    const t = i / count
    const radius = 0.5 * Math.sqrt(t) // spiral outward, so the heap fills the middle first
    const angle = i * 2.4 // golden-angle spiral: even spread without random numbers
    const height = 0.2 + 0.2 * (1 - radius / 0.5)
    parts.push({
      x: Math.cos(angle) * radius * 0.9,
      y: height,
      z: Math.sin(angle) * radius * 0.5,
      r: [0.15 * Math.sin(i), i, 0.15 * Math.cos(i)],
      s: [0.12, 0.03, 0.12], // a flat disc: radius 0.12, thin
    })
  }
  return parts
}

const sparkleRing = (count: number) => {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const height = 0.6 + ((i * 37) % 10) / 10 // a fixed "random" height so the ring looks loose
    positions[i * 3] = Math.cos(angle) * 1.25
    positions[i * 3 + 1] = height
    positions[i * 3 + 2] = Math.sin(angle) * 1.25
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geo
}

/**
 * A treasure chest. Local +z is the front, the feet are at y = 0, and it is about 1.7 wide, 0.8 high and 1.1 deep.
 * `lid` pivots on its back top edge: the integrator opens it with lid.rotation.x going to about -1.3.
 * `update(dt, openness)` animates the sparkles and the glow. openness is 0 (closed) to 1 (open).
 */
export const createChest = () => {
  const group = new THREE.Group()
  let time = 0

  // The body is a bottom slab and four walls, so the top is open and the coins can be seen when the lid is up.
  const slab = new THREE.Mesh(roundBlock(), woodMat())
  slab.scale.set(1.7, 0.16, 1.1)
  slab.position.set(0, 0.08, 0)
  const wallFront = new THREE.Mesh(roundBlock(), woodMat())
  wallFront.scale.set(1.7, 0.64, 0.14)
  wallFront.position.set(0, 0.48, 0.48)
  const wallBack = wallFront.clone()
  wallBack.position.set(0, 0.48, -0.48)
  const wallLeft = new THREE.Mesh(roundBlock(), woodMat())
  wallLeft.scale.set(0.14, 0.64, 0.96)
  wallLeft.position.set(-0.78, 0.48, 0)
  const wallRight = wallLeft.clone()
  wallRight.position.set(0.78, 0.48, 0)
  group.add(slab, wallFront, wallBack, wallLeft, wallRight)

  // Dark plank lines and gold straps on the outside of the body, drawn as small boxes.
  const seams: Part[] = [-0.3, 0.3].flatMap((x) => [
    { x, y: 0.48, z: 0.555, s: [0.025, 0.6, 0.02] },
    { x, y: 0.48, z: -0.555, s: [0.025, 0.6, 0.02] },
  ])
  group.add(instanced(plainBox(), seamMat(), seams))
  const strapParts: Part[] = [-0.55, 0.55].flatMap((x) => [
    { x, y: 0.4, z: 0.565, s: [0.12, 0.8, 0.04] },
    { x, y: 0.4, z: -0.565, s: [0.12, 0.8, 0.04] },
  ])
  group.add(instanced(plainBox(), goldMat(), strapParts))
  // Round gold rivets at the four corners, top and bottom.
  const rivets: Part[] = []
  for (const x of [-0.85, 0.85]) for (const z of [-0.55, 0.55]) for (const y of [0.08, 0.72]) {
    rivets.push({ x, y, z, s: [0.1, 0.1, 0.1] })
  }
  group.add(instanced(ball(), goldMat(), rivets))

  // The coins and a few gold lumps inside the open top.
  const coins = instanced(coin(), goldMat(), coinPile(26))
  const lumps = instanced(ball(), goldMat(), [
    { x: 0.05, y: 0.42, z: 0, s: [0.15, 0.1, 0.13] },
    { x: -0.25, y: 0.34, z: 0.1, s: [0.13, 0.09, 0.12] },
    { x: 0.3, y: 0.32, z: -0.12, s: [0.12, 0.09, 0.11] },
    { x: -0.1, y: 0.3, z: -0.25, s: [0.12, 0.08, 0.1] },
  ])
  group.add(coins, lumps)

  // The lid: a curved wooden top with gold bands, a lock and three gems on the ridge.
  const lid = new THREE.Group()
  lid.position.set(0, 0.8, -0.55)
  const top = new THREE.Mesh(lidArc(), woodMat())
  lid.add(top)
  lid.add(
    instanced(band(), goldMat(), [-0.5, 0.5].map((x) => ({ x, y: 0, z: 0.55, s: [0.56, 0.56, 0.56], r: [0, Math.PI / 2, 0] }))),
  )
  lid.add(
    instanced(plainBox(), goldMat(), [{ x: 0, y: 0.04, z: 1.1, s: [0.3, 0.36, 0.06] }]),
    instanced(ball(), goldMat(), [{ x: 0, y: 0.04, z: 1.17, s: [0.1, 0.1, 0.1] }]),
  )
  // A keyhole: a dark slot on the lock plate.
  lid.add(instanced(plainBox(), darkMat(), [{ x: 0, y: 0.02, z: 1.2, s: [0.04, 0.12, 0.03] }]))
  // Gems sit on the top ridge of the lid, half sunk, so they read as jewels.
  const gems = instanced(gem(), gemMat(), [
    { x: -0.35, y: 0.56, z: 0.55, s: [0.07, 0.07, 0.07] },
    { x: 0, y: 0.56, z: 0.55, s: [0.08, 0.08, 0.08] },
    { x: 0.35, y: 0.56, z: 0.55, s: [0.07, 0.07, 0.07] },
  ])
  gems.setColorAt(0, new THREE.Color(0xe0245e))
  gems.setColorAt(1, new THREE.Color(0x35c9ff))
  gems.setColorAt(2, new THREE.Color(0x4ddb7a))
  if (gems.instanceColor) gems.instanceColor.needsUpdate = true
  lid.add(gems)
  group.add(lid)

  // The glow: a soft additive sprite above the open chest (not a real light). It grows as the chest opens.
  // The colour is above 1, so the bloom pass makes it shine. toneMapped is off so the tone map does not dull it.
  const haloMat = new THREE.SpriteMaterial({
    map: dotTexture(),
    color: new THREE.Color(0xffe08a).multiplyScalar(1.6),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
  const halo = new THREE.Sprite(haloMat)
  halo.position.set(0, 0.9, 0)
  halo.scale.setScalar(0.5)
  group.add(halo)

  // The sparkle ring: small glints that twinkle around the chest. One Points object, so one draw call.
  const sparkleMat = new THREE.PointsMaterial({
    map: dotTexture(),
    size: 0.28,
    color: new THREE.Color(0xfff1b0).multiplyScalar(2),
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
  const sparkles = new THREE.Points(sparkleRing(14), sparkleMat)
  group.add(sparkles)

  const update = (dt: number, openness: number) => {
    time += dt
    const open = Math.min(1, Math.max(0, openness))
    haloMat.opacity = 0.85 * open
    halo.scale.setScalar(0.5 + 2.2 * open)
    sparkles.rotation.y += dt * 0.5
    sparkleMat.opacity = (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * 6))) * (0.5 + 0.5 * open)
  }

  // Frees what only this chest owns. The shared shapes and materials stay, for the next chest.
  const dispose = () => {
    haloMat.dispose()
    sparkleMat.dispose()
    sparkles.geometry.dispose()
    group.traverse((o) => {
      if (o instanceof THREE.InstancedMesh) o.dispose()
    })
  }

  return { group, lid, update, dispose }
}

/**
 * A wedge of cheese, pale yellow with a rounded edge and a few holes. Its origin is the middle of its base,
 * and it is about 0.55 across. The holes are children of the mesh, so they move with it.
 */
const cheeseGeo = lazy(() => {
  const shape = new THREE.Shape()
  const angle = Math.PI * 0.6 // the wedge is a slice of a circle, like a piece of cake
  shape.moveTo(0, 0)
  shape.lineTo(0.55, 0)
  shape.absarc(0, 0, 0.55, 0, angle, false)
  shape.lineTo(0, 0)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2, // the soft, rounded edge
    curveSegments: 12,
  })
  geo.rotateX(-Math.PI / 2) // lie the wedge flat, with the thickness pointing up
  geo.translate(0, 0.04, 0) // so the bottom of the bevel sits at y = 0
  return geo
})

export const createCheeseWedge = (): THREE.Mesh => {
  const wedge = new THREE.Mesh(cheeseGeo(), cheeseMat())
  // Three holes: flat dark dots pressed into the top, placed inside the slice.
  const spots: [number, number][] = [
    [0.2, 0.25],
    [0.35, 0.8],
    [0.25, 1.3],
  ]
  for (const [radius, a] of spots) {
    const hole = new THREE.Mesh(cheeseHole(), holeMat())
    // The top of the wedge is at y = 0.54. Sink the hole so only a shallow dimple shows.
    hole.position.set(Math.cos(a) * radius, 0.53, -Math.sin(a) * radius)
    hole.scale.set(1, 0.35, 1)
    wedge.add(hole)
  }
  return wedge
}
