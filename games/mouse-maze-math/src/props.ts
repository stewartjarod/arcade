import * as THREE from 'three'
import { DX, DZ, type Layout } from './maze'
import type { Realm } from './realms'

// Extra decoration for each realm: things on the floor, on top of the walls, hanging from them, or floating.
// Everything is an InstancedMesh (one draw call per kind of thing), with shared low-poly shapes.
// Walls and their wall-face decorations (hedges, bricks, crystals, neon) live in world.ts, not here.

// The maze grid. Cell centres sit every CELL units; walls run along the cell edges, half a cell from the centre.
// world.ts has the same number, but it imports this file, so we keep our own copy (the test checks it stays the same).
const CELL = 4
const WALL_H = 4
// Floor props stay this far from every corridor centre line (the lines through cell centres), so the mouse
// always has room to walk. Props are small, so they never reach the middle of a corridor.
export const MIN_LANE_GAP = 1.1
// Anything higher than this is over the mouse's head (wall tops, hanging things), so it can sit anywhere.
export const OVERHEAD = 2.5

// ---- shared shapes (made the first time they are needed) ----
function lazy<T>(make: () => T): () => T {
  let value: T | undefined
  return () => {
    if (value === undefined) value = make()
    return value
  }
}
const sphereGeo = lazy(() => new THREE.SphereGeometry(1, 6, 4))
const cylGeo = lazy(() => new THREE.CylinderGeometry(1, 1, 1, 6, 1))
const prismGeo = lazy(() => new THREE.CylinderGeometry(1, 1, 1, 3, 1)) // 3 sides: a triangle, like a cheese wedge
const coneGeo = lazy(() => new THREE.ConeGeometry(1, 1, 5))
const capsuleGeo = lazy(() => new THREE.CapsuleGeometry(1, 1, 1, 4))
const boxGeo = lazy(() => new THREE.BoxGeometry(1, 1, 1))
const ringGeo = lazy(() => new THREE.TorusGeometry(1, 0.35, 4, 8, Math.PI)) // a half ring: a candy-cane hook
const wingGeo = lazy(() => {
  const g = new THREE.BoxGeometry(1, 1, 1)
  g.translate(0.5, 0, 0) // so the wing starts at its hinge (the butterfly's middle) and reaches out to +x
  return g
})
const starGeo = lazy(() => {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.45 : 1 // points and dips
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: false })
  g.center()
  return g
})

// ---- shared materials ----
// Lambert is cheap. Its colour comes from each instance, so one material serves every colour.
const paint = lazy(() => new THREE.MeshLambertMaterial({ color: 0xffffff }))
// Glowing things: colours above 1 (set per instance) and toneMapped off, so the bloom pass picks them up.
const glowing = lazy(() => new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }))

// ---- building blocks ----
type Place = {
  x: number
  y: number
  z: number
  s?: [number, number, number] // size (scale)
  r?: [number, number, number] // turn (Euler angles)
  c?: number // colour (hex), set per instance
  k?: number // brightness for glowing colours (above 1 makes bloom)
}
const scratch = new THREE.Object3D()
const tint = new THREE.Color()

// One InstancedMesh for a list of places. Returns null for an empty list, so no empty draw calls are made.
const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, list: Place[]): THREE.InstancedMesh | null => {
  if (list.length === 0) return null
  const mesh = new THREE.InstancedMesh(geo, mat, list.length)
  list.forEach((p, i) => {
    scratch.position.set(p.x, p.y, p.z)
    scratch.rotation.set(p.r?.[0] ?? 0, p.r?.[1] ?? 0, p.r?.[2] ?? 0)
    const s = p.s ?? [1, 1, 1]
    scratch.scale.set(s[0], s[1], s[2])
    scratch.updateMatrix()
    mesh.setMatrixAt(i, scratch.matrix)
    if (p.c !== undefined) mesh.setColorAt(i, tint.setHex(p.c).multiplyScalar(p.k ?? 1))
  })
  mesh.instanceMatrix.needsUpdate = true
  mesh.receiveShadow = true
  return mesh
}

// A spot where something can go. Corner spots are in the middle of a cell's corners. Base spots are
// against a wall, on the cell side. Top spots sit on the wall's top edge. `inX`/`inZ` point from the wall into the cell.
type Spot = { x: number; z: number; along: boolean; inX: number; inZ: number }
type Spots = { corners: Spot[]; bases: Spot[]; tops: Spot[] }

const sideways = (rnd: () => number) => MIN_LANE_GAP + rnd() * 0.5 // 1.1 to 1.6 from the cell middle

// Cells that must stay plain: the junction pads, the goal, and the cells right next to them (doors swing there).
const plainCells = (layout: Layout) => {
  const keys = new Set<string>()
  const around = [
    ...layout.junctions.map((j) => [j.x, j.z] as const),
    [layout.goal.x, layout.goal.z] as const,
  ]
  for (const [x, z] of around) {
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) keys.add(`${x + dx!},${z + dz!}`)
  }
  return keys
}

const findSpots = (layout: Layout, rnd: () => number): Spots => {
  const plain = plainCells(layout)
  const corners: Spot[] = []
  const bases: Spot[] = []
  const tops: Spot[] = []
  for (const [x, z] of layout.cells) {
    if (plain.has(`${x},${z}`)) continue
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corners.push({ x: x * CELL + sx * sideways(rnd), z: z * CELL + sz * sideways(rnd), along: false, inX: 0, inZ: 0 })
      }
    }
  }
  for (const w of layout.walls) {
    if (plain.has(`${w.x},${w.z}`)) continue
    const along = w.dir % 2 === 0 // the wall runs along x
    const inX = -DX[w.dir]!
    const inZ = -DZ[w.dir]!
    const ex = (w.x + DX[w.dir]! / 2) * CELL // the middle of the wall's edge
    const ez = (w.z + DZ[w.dir]! / 2) * CELL
    const side = along ? [1, 0] : [0, 1] // sideways along the wall
    const inset = 0.5 + rnd() * 0.45 // 0.5 to 0.95 out from the wall, into the cell
    const slide = (rnd() < 0.5 ? -1 : 1) * sideways(rnd)
    bases.push({ x: ex + inX * inset + side[0]! * slide, z: ez + inZ * inset + side[1]! * slide, along, inX, inZ })
    tops.push({ x: ex, z: ez, along, inX, inZ })
  }
  return { corners, bases, tops }
}

// Every realm's kit. Each one reads the spots, makes its InstancedMeshes, and may return an `animate` for moving bits.
type Kit = { meshes: (THREE.InstancedMesh | null)[]; animate?: (time: number) => void }
type Builder = (spots: Spots, rnd: () => number) => Kit

const spin = (rnd: () => number): [number, number, number] => [0, rnd() * Math.PI * 2, 0]
const pick = <T>(list: T[], rnd: () => number): T => list[Math.floor(rnd() * list.length)]!

// Cheese Cupboards: cheese crumbs, tiny cheese wedges and rounded pebbles on the floor.
const cupboard: Builder = ({ corners, bases }, rnd) => {
  const wedges: Place[] = []
  const crumbs: Place[] = []
  const pebbles: Place[] = []
  for (const s of corners) {
    if (rnd() < 0.1) wedges.push({ x: s.x, y: 0.07, z: s.z, r: spin(rnd), s: [0.24, 0.14, 0.24], c: 0xffd966 })
    if (rnd() < 0.3) crumbs.push({ x: s.x, y: 0.04, z: s.z, s: [0.05, 0.04, 0.05], c: pick([0xf2c14e, 0xffe39a], rnd) })
    if (rnd() < 0.08) pebbles.push({ x: s.x, y: 0.05, z: s.z, r: spin(rnd), s: [0.12, 0.07, 0.11], c: pick([0xb9a88f, 0x9c8a74, 0xd2c3a8], rnd) })
  }
  for (const s of bases) {
    if (rnd() < 0.12) wedges.push({ x: s.x, y: 0.07, z: s.z, r: spin(rnd), s: [0.24, 0.14, 0.24], c: 0xffd966 })
  }
  return { meshes: [instanced(prismGeo(), paint(), wedges), instanced(sphereGeo(), paint(), crumbs), instanced(sphereGeo(), paint(), pebbles)] }
}

// Candy Kitchen: sprinkles on the floor, gumdrops, lollipops at the wall bases, candy canes on the wall tops.
const candy: Builder = ({ corners, bases, tops }, rnd) => {
  const sprinkles: Place[] = []
  const drops: Place[] = []
  const sticks: Place[] = []
  const heads: Place[] = []
  const canes: Place[] = []
  const hooks: Place[] = []
  const sprinkleColours = [0xff4f8b, 0x4dd0e1, 0xffd54f, 0x7cd992, 0xb388ff]
  for (const s of corners) {
    if (rnd() < 0.12) {
      // Lying flat: rotate onto its side, then turn it around the up axis.
      sprinkles.push({ x: s.x, y: 0.03, z: s.z, r: [0, rnd() * Math.PI, Math.PI / 2], s: [0.03, 0.12, 0.03], c: pick(sprinkleColours, rnd) })
    }
    if (rnd() < 0.05) drops.push({ x: s.x, y: 0.05, z: s.z, s: [0.14, 0.09, 0.14], c: pick([0xff8fb8, 0x7ee08a, 0xffe066], rnd) })
  }
  for (const s of bases) {
    if (rnd() < 0.3) drops.push({ x: s.x, y: 0.05, z: s.z, s: [0.14, 0.09, 0.14], c: pick([0xff8fb8, 0x7ee08a, 0xffe066], rnd) })
    if (rnd() < 0.18) {
      sticks.push({ x: s.x, y: 0.45, z: s.z, s: [0.025, 0.45, 0.025], c: 0xffffff })
      heads.push({ x: s.x, y: 0.92, z: s.z, r: [Math.PI / 2, 0, 0], s: [0.18, 0.04, 0.18], c: pick([0xff5fa2, 0x9b6bff, 0x4dd0e1], rnd) })
    }
  }
  for (const s of tops) {
    if (rnd() < 0.25) {
      canes.push({ x: s.x, y: WALL_H + 0.47, z: s.z, s: [0.05, 0.8, 0.05], c: 0xe53935 })
      hooks.push({ x: s.x, y: WALL_H + 0.87, z: s.z, s: [0.14, 0.14, 0.14], c: 0xffffff })
    }
  }
  return {
    meshes: [
      instanced(capsuleGeo(), paint(), sprinkles),
      instanced(sphereGeo(), paint(), drops),
      instanced(cylGeo(), paint(), sticks),
      instanced(cylGeo(), paint(), heads),
      instanced(cylGeo(), paint(), canes),
      instanced(ringGeo(), paint(), hooks),
    ],
  }
}

// Hedge Labyrinth: flowers, grass tufts, little mushrooms and butterflies that flap above the paths.
const garden: Builder = ({ corners }, rnd) => {
  const stems: Place[] = []
  const petals: Place[] = []
  const centres: Place[] = []
  const blades: Place[] = []
  const mushStems: Place[] = []
  const mushCaps: Place[] = []
  const flowerColours = [0xff7aa2, 0xffe066, 0xffffff, 0xc39bff]
  for (const s of corners) {
    if (rnd() < 0.1) {
      stems.push({ x: s.x, y: 0.25, z: s.z, s: [0.02, 0.5, 0.02], c: 0x4caf50 })
      petals.push({ x: s.x, y: 0.52, z: s.z, s: [0.14, 0.07, 0.14], c: pick(flowerColours, rnd) })
      centres.push({ x: s.x, y: 0.56, z: s.z, s: [0.045, 0.045, 0.045], c: 0xffd23f, k: 1.5 })
    }
    if (rnd() < 0.18) {
      for (let b = 0; b < 3; b++) {
        blades.push({
          x: s.x + (rnd() - 0.5) * 0.12,
          y: 0.22,
          z: s.z + (rnd() - 0.5) * 0.12,
          r: [(rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5],
          s: [0.05, 0.45, 0.05],
          c: pick([0x5cb85c, 0x3e9b45, 0x7cc76b], rnd),
        })
      }
    }
    if (rnd() < 0.06) {
      mushStems.push({ x: s.x, y: 0.1, z: s.z, s: [0.05, 0.2, 0.05], c: 0xfff3e0 })
      mushCaps.push({ x: s.x, y: 0.22, z: s.z, s: [0.14, 0.09, 0.14], c: 0xe74c3c })
    }
  }
  const butterflies = findButterflies(corners, rnd)
  const wings = butterflies.length ? new THREE.InstancedMesh(wingGeo(), paint(), butterflies.length * 2) : null
  butterflies.forEach((_b, i) => {
    const colour = pick([0xff8fc7, 0xffd23f, 0x7ec8ff, 0xffffff], rnd)
    wings?.setColorAt(i * 2, tint.setHex(colour))
    wings?.setColorAt(i * 2 + 1, tint.setHex(colour))
  })
  const animate = (time: number) => {
    if (!wings) return
    butterflies.forEach((b, i) => {
      const flap = Math.sin(time * 12 + b.phase) * 0.9 // wings going up and down
      const bob = Math.sin(time * 2 + b.phase) * 0.08
      placeWing(wings, i * 2, b.x, b.y + bob, b.z, b.yaw, flap)
      placeWing(wings, i * 2 + 1, b.x, b.y + bob, b.z, b.yaw + Math.PI, flap) // the other wing faces the other way
    })
    wings.instanceMatrix.needsUpdate = true
  }
  if (wings) animate(0)
  return {
    meshes: [
      instanced(cylGeo(), paint(), stems),
      instanced(sphereGeo(), paint(), petals),
      instanced(sphereGeo(), glowing(), centres),
      instanced(coneGeo(), paint(), blades),
      instanced(cylGeo(), paint(), mushStems),
      instanced(sphereGeo(), paint(), mushCaps),
      wings,
    ],
    animate,
  }
}

type Butterfly = { x: number; y: number; z: number; yaw: number; phase: number }
const findButterflies = (corners: Spot[], rnd: () => number): Butterfly[] => {
  const list: Butterfly[] = []
  for (const s of corners) {
    if (list.length >= 8 || rnd() > 0.03) continue
    list.push({ x: s.x, y: 1.4 + rnd() * 1.0, z: s.z, yaw: rnd() * Math.PI * 2, phase: rnd() * 6.28 })
  }
  return list
}

// Matrices for one wing: its hinge at (x, y, z), turned by yaw, then flapped by `flap` around its own hinge.
const flapQuat = new THREE.Quaternion()
const yawQuat = new THREE.Quaternion()
const flipQuat = new THREE.Quaternion()
const UP = new THREE.Vector3(0, 1, 0)
const OUT = new THREE.Vector3(0, 0, 1)
const placeWing = (mesh: THREE.InstancedMesh, index: number, x: number, y: number, z: number, yaw: number, flap: number) => {
  yawQuat.setFromAxisAngle(UP, yaw)
  flipQuat.setFromAxisAngle(OUT, flap)
  scratch.quaternion.copy(yawQuat).multiply(flipQuat)
  scratch.position.set(x, y, z)
  scratch.scale.set(0.34, 0.02, 0.24)
  scratch.updateMatrix()
  mesh.setMatrixAt(index, scratch.matrix)
}

// Frozen Pantry: snow drifts at the wall bases, icicles hanging under the wall tops, snow on the tops.
const frozen: Builder = ({ corners, bases, tops }, rnd) => {
  const drifts: Place[] = []
  const dots: Place[] = []
  const icicles: Place[] = []
  const caps: Place[] = []
  for (const s of bases) {
    if (rnd() < 0.3) drifts.push({ x: s.x, y: 0.06, z: s.z, r: spin(rnd), s: [0.32, 0.14, 0.22], c: pick([0xffffff, 0xe6f4ff], rnd) })
  }
  for (const s of corners) {
    if (rnd() < 0.1) dots.push({ x: s.x, y: 0.05, z: s.z, s: [0.09, 0.07, 0.09], c: 0xffffff })
  }
  for (const s of tops) {
    if (rnd() < 0.3) {
      // Hangs from the underside of the wall top, on the cell side. Pointed down (rotated half a turn).
      icicles.push({ x: s.x + s.inX * 0.2, y: WALL_H - 0.3, z: s.z + s.inZ * 0.2, r: [Math.PI, 0, 0], s: [0.06, 0.6, 0.06], c: pick([0xd6f0ff, 0xbfe6ff], rnd) })
    }
    if (rnd() < 0.25) {
      caps.push({ x: s.x, y: WALL_H + 0.12, z: s.z, r: [0, s.along ? 0 : Math.PI / 2, 0], s: s.along ? [0.8, 0.14, 0.22] : [0.22, 0.14, 0.8], c: 0xffffff })
    }
  }
  return {
    meshes: [instanced(sphereGeo(), paint(), drifts), instanced(sphereGeo(), paint(), dots), instanced(coneGeo(), paint(), icicles), instanced(sphereGeo(), paint(), caps)],
  }
}

// Torch Cellars: small rocks on the floor, barrels and crates at the wall bases (sparse), chains hanging from the walls.
const cellar: Builder = ({ corners, bases, tops }, rnd) => {
  const rocks: Place[] = []
  const barrels: Place[] = []
  const crates: Place[] = []
  const chains: Place[] = []
  for (const s of corners) {
    if (rnd() < 0.12) rocks.push({ x: s.x, y: 0.07, z: s.z, r: spin(rnd), s: [0.16, 0.1, 0.14], c: pick([0x7b7f86, 0x62666d, 0x9aa0a6], rnd) })
  }
  for (const s of bases) {
    const roll = rnd()
    if (roll < 0.18) barrels.push({ x: s.x, y: 0.3, z: s.z, s: [0.26, 0.5, 0.26], c: 0x8b5a2b })
    else if (roll < 0.28) crates.push({ x: s.x, y: 0.21, z: s.z, r: spin(rnd), s: [0.42, 0.42, 0.42], c: 0xa0703f })
  }
  for (const s of tops) {
    if (rnd() < 0.3) chains.push({ x: s.x + s.inX * 0.25, y: WALL_H - 0.6, z: s.z + s.inZ * 0.25, s: [0.03, 1.2, 0.03], c: 0x5a5f66 })
  }
  return {
    meshes: [
      instanced(sphereGeo(), paint(), rocks),
      instanced(cylGeo(), paint(), barrels),
      instanced(boxGeo(), paint(), crates),
      instanced(cylGeo(), paint(), chains),
    ],
  }
}

// Crystal Caves: glowing mushrooms and clusters of crystal shards on the floor.
const crystal: Builder = ({ corners }, rnd) => {
  const caps: Place[] = []
  const stems: Place[] = []
  const shards: Place[] = []
  const glowColours = [0x7df9ff, 0xff7adf, 0xb2ff7a]
  const shardColours = [0x9b7bff, 0x6fd3ff, 0xc78bff]
  for (const s of corners) {
    if (rnd() < 0.1) {
      stems.push({ x: s.x, y: 0.12, z: s.z, s: [0.04, 0.25, 0.04], c: 0xe8e0ff })
      caps.push({ x: s.x, y: 0.28, z: s.z, s: [0.17, 0.1, 0.17], c: pick(glowColours, rnd), k: 1.6 })
    }
    if (rnd() < 0.08) {
      // Spread the two shards only AWAY from the middle of the cell: spots can sit right at the edge of the walking lane.
      const awayX = Math.sign(s.x - Math.round(s.x / CELL) * CELL)
      const awayZ = Math.sign(s.z - Math.round(s.z / CELL) * CELL)
      for (let b = 0; b < 2; b++) {
        shards.push({
          x: s.x + awayX * (b ? 0.12 : 0),
          y: 0.3,
          z: s.z + awayZ * rnd() * 0.05,
          r: [(rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5],
          s: [0.14, 0.6, 0.14],
          c: pick(shardColours, rnd),
        })
      }
    }
  }
  return {
    meshes: [instanced(sphereGeo(), glowing(), caps), instanced(cylGeo(), paint(), stems), instanced(coneGeo(), paint(), shards)],
  }
}

// Clockwork Tower: floor cogs with hubs, bolts, and copper pipes along the wall tops.
const clockwork: Builder = ({ corners, tops }, rnd) => {
  const cogs: Place[] = []
  const hubs: Place[] = []
  const bolts: Place[] = []
  const pipes: Place[] = []
  for (const s of corners) {
    if (rnd() < 0.1) {
      cogs.push({ x: s.x, y: 0.03, z: s.z, r: spin(rnd), s: [0.42, 0.06, 0.42], c: 0xd9a441 })
      hubs.push({ x: s.x, y: 0.07, z: s.z, s: [0.14, 0.09, 0.14], c: 0x8a5a1f })
    }
    if (rnd() < 0.2) bolts.push({ x: s.x, y: 0.025, z: s.z, s: [0.07, 0.05, 0.07], c: 0x9aa3ad })
  }
  for (const s of tops) {
    if (rnd() < 0.3) {
      // A pipe runs the length of the wall top: a cylinder laid on its side, along the wall.
      pipes.push({ x: s.x, y: WALL_H + 0.19, z: s.z, r: s.along ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0], s: [0.12, CELL + 0.3, 0.12], c: 0xc77a3a })
    }
  }
  return {
    meshes: [instanced(cylGeo(), paint(), cogs), instanced(cylGeo(), paint(), hubs), instanced(cylGeo(), paint(), bolts), instanced(cylGeo(), paint(), pipes)],
  }
}

// Star Labyrinth: floating glowing orbs and star shapes that bob and spin, plus glow dots on the floor.
const star: Builder = ({ corners, tops }, rnd) => {
  const dots: Place[] = []
  const orbs: Place[] = []
  const stars: Place[] = []
  const orbColours = [0x7df9ff, 0xff7adf, 0xfff27a, 0x9dffb0]
  const starColours = [0xffe14d, 0x27e1c1, 0xff3d81]
  for (const s of corners) {
    if (rnd() < 0.08) dots.push({ x: s.x, y: 0.02, z: s.z, s: [0.2, 0.02, 0.2], c: pick([0x7df9ff, 0xff7adf], rnd), k: 1.4 })
    if (rnd() < 0.1) orbs.push({ x: s.x, y: 1.6 + rnd() * 0.9, z: s.z, s: [0.16, 0.16, 0.16], c: pick(orbColours, rnd), k: 1.8 })
  }
  for (const s of tops) {
    if (rnd() < 0.25) stars.push({ x: s.x, y: WALL_H + 0.9 + rnd() * 1.2, z: s.z, s: [0.28, 0.28, 0.28], c: pick(starColours, rnd), k: 1.6 })
  }
  const orbMesh = instanced(sphereGeo(), glowing(), orbs)
  const starMesh = instanced(starGeo(), glowing(), stars)
  const orbBase = orbs.map((o) => o.y)
  const starBase = stars.map((s) => s.y)
  const animate = (time: number) => {
    orbs.forEach((o, i) => {
      // Each orb bobs up and down, out of step with its neighbours.
      scratch.position.set(o.x, orbBase[i]! + Math.sin(time * 1.4 + i) * 0.12, o.z)
      scratch.rotation.set(0, 0, 0)
      scratch.scale.set(0.16, 0.16, 0.16)
      scratch.updateMatrix()
      orbMesh?.setMatrixAt(i, scratch.matrix)
    })
    stars.forEach((st, i) => {
      scratch.position.set(st.x, starBase[i]!, st.z)
      scratch.rotation.set(0, time * 0.8 + i, 0)
      scratch.scale.set(0.28, 0.28, 0.28)
      scratch.updateMatrix()
      starMesh?.setMatrixAt(i, scratch.matrix)
    })
    if (orbMesh) orbMesh.instanceMatrix.needsUpdate = true
    if (starMesh) starMesh.instanceMatrix.needsUpdate = true
  }
  return { meshes: [instanced(cylGeo(), glowing(), dots), orbMesh, starMesh], animate }
}

const KITS: Record<string, Builder> = { cupboard, candy, garden, frozen, cellar, crystal, clockwork, star }

/**
 * The extra decoration for one maze in one realm. Add `group` to the level, call `update(dt, time)` every frame,
 * and call `dispose()` when the level is cleared. Only floor, wall-top, hanging and floating things are made here.
 */
export const buildProps = (layout: Layout, realm: Realm, rnd: () => number) => {
  const group = new THREE.Group()
  const spots = findSpots(layout, rnd)
  const kit = (KITS[realm.id] ?? cupboard)(spots, rnd)
  const meshes = kit.meshes.filter((m): m is THREE.InstancedMesh => m !== null)
  for (const m of meshes) group.add(m)
  return {
    group,
    update(_dt: number, time: number) {
      kit.animate?.(time)
    },
    dispose() {
      for (const m of meshes) {
        group.remove(m)
        m.dispose() // frees the per-mesh instance buffers. The shared shapes and materials stay.
      }
    },
  }
}
