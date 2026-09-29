import * as THREE from 'three'
import { SIGN_SIZE, answerSign, emojiSprite, sfx } from '@arcade/engine'
import { mouseModel, type MouseHat } from '@arcade/assets'
import { COLORS } from './catalog'
import { DX, DZ, type Dir, type Layout } from './maze'
import { REALMS, type Realm } from './realms'

export const CELL = 4
const WALL_H = 4

const box = new THREE.BoxGeometry(1, 1, 1)
const ball = new THREE.SphereGeometry(1, 20, 14)
const mats = new Map<number, THREE.MeshLambertMaterial>()
const mat = (c: number) => {
  let m = mats.get(c)
  if (!m) mats.set(c, (m = new THREE.MeshLambertMaterial({ color: c })))
  return m
}
const cuboid = (w: number, h: number, d: number, c: number, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(box, mat(c))
  m.scale.set(w, h, d)
  m.position.set(x, y, z)
  return m
}
const blob = (sx: number, sy: number, sz: number, c: number, x: number, y: number, z: number) => {
  const m = new THREE.Mesh(ball, mat(c))
  m.scale.set(sx, sy, sz)
  m.position.set(x, y, z)
  return m
}

const glowMats = new Map<number, THREE.MeshBasicMaterial>()
const glowMat = (c: number) => {
  let m = glowMats.get(c)
  if (!m) glowMats.set(c, (m = new THREE.MeshBasicMaterial({ color: c })))
  return m
}
const gearGeo = (() => {
  const sh = new THREE.Shape()
  const teeth = 12
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 ? 0.62 : 0.8
    const a = (i / (teeth * 2)) * Math.PI * 2
    if (i === 0) sh.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else sh.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  const hole = new THREE.Path()
  hole.absarc(0, 0, 0.22, 0, Math.PI * 2, true)
  sh.holes.push(hole)
  return new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: false })
})()
const cone = new THREE.ConeGeometry(0.5, 1, 5)
const dotTex = (() => {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 64
  const cx = cv.getContext('2d')!
  const g = cx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  cx.fillStyle = g
  cx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(cv)
})()

const angleOf = (d: number) => Math.atan2(DX[d]!, DZ[d]!)
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const easeOutBack = (k: number) => 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2)

type Task = { t: number; dur: number; fn: (k: number) => void; done: () => void }
const tasks: Task[] = []
export const tween = (dur: number, fn: (k: number) => void) =>
  new Promise<void>((done) => tasks.push({ t: 0, dur, fn, done }))
const stepTasks = (dt: number) => {
  for (let i = tasks.length - 1; i >= 0; i--) {
    const task = tasks[i]!
    task.t += dt
    const k = Math.min(1, task.t / task.dur)
    task.fn(k)
    if (k >= 1) {
      tasks.splice(i, 1)
      task.done()
    }
  }
}
export const sleep = (s: number) => tween(s, () => {})

type DoorView = { panel: THREE.Mesh; hinge: THREE.Group; sign: THREE.Mesh; draw: (t: string, mark?: 'good' | 'bad' | null) => void }

export const createWorld = (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x2a2540)
  scene.fog = new THREE.Fog(0x2a2540, 12, 30)
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7a9a, 1.5)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.4)
  sun.position.set(6, 14, 4)
  scene.add(sun)
  const cam = new THREE.PerspectiveCamera(68, 1, 0.1, 200)

  const level = new THREE.Group()
  const fx = new THREE.Group()
  scene.add(level, fx)

  const mouse = new THREE.Group()
  let rig = new THREE.Group()
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.95, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25 }))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.03
  mouse.add(shadow, rig)
  scene.add(mouse)

  let skin = { color: 'gray', hat: 'none' }
  const setSkin = (color: string, hat: string) => {
    skin = { color, hat }
    mouse.remove(rig)
    rig = mouseModel({ color: COLORS.find((c) => c.id === color)?.hex ?? COLORS[0]!.hex, hat: hat as MouseHat })
    mouse.add(rig)
  }
  setSkin('gray', 'none')

  let realm: Realm = REALMS[0]!
  const flames: THREE.Mesh[] = []
  const spinners: { m: THREE.Object3D; s: number }[] = []
  let dust: { pts: THREE.Points; vel: Float32Array } | null = null
  let views: DoorView[][] = []
  let current = -1
  let chest: { g: THREE.Group; lid: THREE.Group } | null = null
  let cage: THREE.Group | null = null
  let moving = false
  let orbit = false
  let orbitT = 0
  let time = 0
  let camAngle = Math.PI / 2
  let camTarget = camAngle
  let zoom = 1
  const BACK = 4.2
  const trail: [number, number][] = []
  let pickHandler: ((exit: number) => void) | null = null
  let hoverHandler: ((exit: number) => void) | null = null
  let hover = -1
  let focus = 0
  let focusTarget = 0

  const onResize = () => {
    renderer.setSize(innerWidth, innerHeight, false)
    cam.aspect = innerWidth / innerHeight
    cam.updateProjectionMatrix()
    zoom = cam.aspect < 0.8 ? 1.5 : cam.aspect < 1.2 ? 1.2 : 1
  }
  addEventListener('resize', onResize)
  onResize()

  const clearLevel = () => {
    tasks.length = 0
    moving = false
    for (const g of [level, fx]) {
      g.traverse((o) => {
        if (o instanceof THREE.Sprite) {
          o.material.map?.dispose()
          o.material.dispose()
        } else if (o instanceof THREE.InstancedMesh) {
          o.dispose()
          o.material.dispose()
        } else if (o instanceof THREE.Points) {
          o.geometry.dispose()
          ;(o.material as THREE.Material).dispose()
        } else if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshBasicMaterial && o.material.map) {
          o.material.map.dispose()
          o.material.dispose()
        }
      })
      g.clear()
    }
    views = []
    flames.length = 0
    spinners.length = 0
    dust = null
    current = -1
    chest = null
    cage = null
  }

  const resetTrail = (cx: number, cz: number, dir: Dir) => {
    trail.length = 0
    trail.push([cx * CELL - DX[dir]! * 8, cz * CELL - DZ[dir]! * 8], [cx * CELL, cz * CELL])
  }
  const releaseCamera = (cx: number, cz: number, dir: Dir) => {
    resetTrail(cx, cz, dir)
    camTarget = angleOf(dir)
  }

  const inst = (geo: THREE.BufferGeometry, glow: boolean, items: { p: [number, number, number]; s: [number, number, number]; r?: [number, number, number]; c: number }[]) => {
    if (!items.length) return
    const m = new THREE.InstancedMesh(geo, glow ? new THREE.MeshBasicMaterial({ color: 0xffffff }) : new THREE.MeshLambertMaterial({ color: 0xffffff }), items.length)
    const d = new THREE.Object3D()
    const col = new THREE.Color()
    items.forEach((it, i) => {
      d.position.set(...it.p)
      d.scale.set(...it.s)
      d.rotation.set(...(it.r ?? [0, 0, 0]))
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
      m.setColorAt(i, col.set(it.c))
    })
    m.frustumCulled = false
    level.add(m)
  }

  const applyRealm = (r: Realm) => {
    realm = r
    scene.background = new THREE.Color(r.bg)
    scene.fog = new THREE.Fog(r.fog[0], r.fog[1], r.fog[2])
    hemi.color.set(r.hemi[0])
    hemi.groundColor.set(r.hemi[1])
    hemi.intensity = r.hemi[2]
    sun.color.set(r.sun[0])
    sun.intensity = r.sun[1]
  }

  const load = (layout: Layout, r: Realm = REALMS[0]!) => {
    clearLevel()
    applyRealm(r)
    const rnd = Math.random
    const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]!
    for (const [x, z] of layout.cells) {
      level.add(cuboid(CELL, 0.2, CELL, (x + z) % 2 === 0 ? r.floor[0] : r.floor[1], x * CELL, -0.1, z * CELL))
    }
    const leaves: Parameters<typeof inst>[2] = []
    const crystals: Parameters<typeof inst>[2] = []
    const strips: Parameters<typeof inst>[2] = []
    const bricks: Parameters<typeof inst>[2] = []
    const rivets: Parameters<typeof inst>[2] = []
    layout.walls.forEach((w, wi) => {
      const px = (w.x + DX[w.dir]! / 2) * CELL
      const pz = (w.z + DZ[w.dir]! / 2) * CELL
      const along = w.dir % 2 === 0
      const [sx, sz] = along ? [CELL + 0.3, 0.3] : [0.3, CELL + 0.3]
      level.add(cuboid(sx, WALL_H, sz, r.wall, px, WALL_H / 2, pz))
      if (r.style === 'plain' || r.style === 'stone' || r.style === 'brass') level.add(cuboid(sx, 0.15, sz, r.wallTop, px, WALL_H + 0.07, pz))
      const [tx, tz] = along ? [1, 0] : [0, 1]
      const [nx, nz] = along ? [0, 1] : [1, 0]
      const at = (t: number, off: number, y: number): [number, number, number] => [px + tx * t + nx * off, y, pz + tz * t + nz * off]
      const len = CELL + 0.3
      for (const side of [-1, 1]) {
        if (r.style === 'hedge') {
          for (let i = 0; i < 9; i++) {
            const rr = 0.32 + rnd() * 0.28
            leaves.push({ p: at((rnd() - 0.5) * len, side * (0.12 + rnd() * 0.12), 0.25 + rnd() * (WALL_H - 0.1)), s: [rr, rr, rr], c: pick([r.wall, r.wallTop, 0x256b30, 0x4aa856]) })
          }
          if (rnd() < 0.3) leaves.push({ p: at((rnd() - 0.5) * len, side * 0.42, 0.6 + rnd() * 2.6), s: [0.1, 0.1, 0.1], c: pick([0xff8fb8, 0xffffff, 0xffe14d, 0xc08bff]) })
        } else if (r.style === 'stone') {
          for (const y of [0.9, 1.9, 2.9]) bricks.push({ p: at(0, side * 0.16, y), s: [along ? len : 0.05, 0.07, along ? 0.05 : len], c: 0x4a433d })
          if (wi % 5 === 0) {
            level.add(cuboid(0.14, 0.5, 0.14, 0x2b1d14, ...at(0, side * 0.3, 2.0)))
            const f = new THREE.Mesh(ball, glowMat(pick([0xffa040, 0xffc060])))
            f.scale.set(0.2, 0.3, 0.2)
            f.position.set(...at(0, side * 0.3, 2.45))
            flames.push(f)
            level.add(f)
          }
        } else if (r.style === 'crystal') {
          for (let i = 0; i < 2; i++) {
            const h = 0.7 + rnd() * 1.3
            const wd = 0.35 + rnd() * 0.3
            crystals.push({ p: at((rnd() - 0.5) * len, side * (0.32 + rnd() * 0.25), h / 2), s: [wd, h, wd], r: [(along ? side : 0) * 0.3, rnd() * 3, (along ? 0 : -side) * 0.3], c: pick([0x7df9ff, 0xd28bff, 0xff8ad6, 0x8ab4ff]) })
          }
          if (rnd() < 0.5) crystals.push({ p: at((rnd() - 0.5) * len, side * 0.3, WALL_H - 0.6), s: [0.3, 1.1, 0.3], r: [Math.PI + (along ? side : 0) * 0.3, 0, (along ? 0 : -side) * 0.3], c: pick([0x7df9ff, 0xd28bff]) })
        } else if (r.style === 'brass') {
          strips.push({ p: at(0, side * 0.16, 1.5), s: [along ? len : 0.05, 0.14, along ? 0.05 : len], c: 0x7a5a20 })
          for (let t = -1.6; t <= 1.6; t += 0.8) rivets.push({ p: at(t, side * 0.16, WALL_H - 0.35), s: [0.09, 0.09, 0.09], c: 0xfff0b0 })
          if (wi % 4 === side + 1 || (wi % 6 === 0 && side === 1)) {
            const g = new THREE.Mesh(gearGeo, mat(pick([0x8a6420, 0xc79a3b, 0xe0b85a])))
            const sc = 0.8 + rnd() * 0.9
            g.scale.set(sc, sc, 1)
            g.position.set(...at((rnd() - 0.5) * 1.6, side * 0.17, 2.1 + rnd() * 0.9))
            if (!along) g.rotation.y = Math.PI / 2
            spinners.push({ m: g, s: (rnd() < 0.5 ? -1 : 1) * (0.3 + rnd() * 0.4) })
            level.add(g)
          }
        } else if (r.style === 'neon') {
          const c = (w.x + w.z) % 2 === 0 ? 0x39f0ff : 0xff4fd8
          strips.push({ p: at(0, side * 0.17, 0.12), s: [along ? len : 0.06, 0.07, along ? 0.06 : len], c })
          strips.push({ p: at(0, side * 0.17, WALL_H - 0.12), s: [along ? len : 0.06, 0.07, along ? 0.06 : len], c })
          if (rnd() < 0.25) strips.push({ p: at((rnd() - 0.5) * 2, side * 0.17, 2), s: [0.06, 3.4, 0.06], c })
        }
      }
    })
    inst(ball, false, leaves)
    inst(box, false, bricks)
    inst(cone, true, crystals)
    inst(box, true, strips.filter((s0) => r.style === 'neon' || false))
    inst(box, false, strips.filter(() => r.style === 'brass'))
    inst(ball, true, rivets)

    if (r.style === 'neon') {
      const n = 500
      const pos = new Float32Array(n * 3)
      for (let i = 0; i < n; i++) {
        const u = rnd() * Math.PI * 2
        const v = Math.acos(2 * rnd() - 1)
        pos.set([Math.sin(v) * Math.cos(u) * 90, Math.abs(Math.cos(v)) * 70 + 8, Math.sin(v) * Math.sin(u) * 90], i * 3)
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, map: dotTex, size: 3, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false }))
      stars.frustumCulled = false
      level.add(stars)
    }

    const pn = r.particles.count
    const ppos = new Float32Array(pn * 3)
    const pvel = new Float32Array(pn * 3)
    for (let i = 0; i < pn; i++) {
      ppos.set([(rnd() - 0.5) * 30, rnd() * 5, (rnd() - 0.5) * 30], i * 3)
      const m = r.particles.motion
      pvel.set([(rnd() - 0.5) * 0.5, m === 'rise' ? 0.4 + rnd() * 0.5 : m === 'fall' ? -0.5 - rnd() * 0.5 : (rnd() - 0.5) * 0.3, (rnd() - 0.5) * 0.5], i * 3)
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(ppos, 3))
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({ color: r.particles.color, map: dotTex, size: r.particles.size * 4, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false }))
    pts.frustumCulled = false
    level.add(pts)
    dust = { pts, vel: pvel }

    layout.junctions.forEach((j) => {
      level.add(cuboid(CELL - 0.8, 0.04, CELL - 0.8, r.pad, j.x * CELL, 0.02, j.z * CELL))
      const row: DoorView[] = j.exits.map((ex, e) => {
        const g = new THREE.Group()
        g.position.set((j.x + DX[ex.dir]! / 2) * CELL, 0, (j.z + DZ[ex.dir]! / 2) * CELL)
        g.rotation.y = ex.dir % 2 === 1 ? Math.PI / 2 : 0
        const color = r.doors[e]!
        // The door hangs on a hinge at its left edge and swings away from the junction, knob and all.
        const face = ex.dir === 0 || ex.dir === 3 ? 1 : -1
        const dw = CELL - 1.1
        const hinge = new THREE.Group()
        hinge.position.x = -dw / 2
        const panel = cuboid(dw, WALL_H - 0.5, 0.25, color, dw / 2, (WALL_H - 0.5) / 2, 0)
        panel.userData.exit = e
        hinge.userData.face = face
        hinge.add(panel)
        for (const z of [-0.17, 0.17]) hinge.add(blob(0.13, 0.13, 0.1, r.glow, dw - 0.4, 1.5, z))
        for (const y of [0.6, WALL_H - 1.1]) hinge.add(cuboid(0.12, 0.35, 0.3, r.frame, 0.02, y, 0))
        g.add(
          hinge,
          cuboid(0.4, WALL_H, 0.5, r.frame, -(CELL / 2 - 0.25), WALL_H / 2, 0),
          cuboid(0.4, WALL_H, 0.5, r.frame, CELL / 2 - 0.25, WALL_H / 2, 0),
          cuboid(CELL, 0.5, 0.5, r.frame, 0, WALL_H - 0.25, 0),
        )
        if (r.style === 'hedge') {
          for (let i = -4; i <= 4; i++) g.add(blob(0.3, 0.3, 0.3, pick([0x2f7d3a, 0x3f9a49, 0x4aa856]), i * 0.36, WALL_H - 0.1 + Math.cos(i * 0.4) * 0.15, 0.3 * (i % 2 ? 1 : -1)))
        } else if (r.style === 'crystal' || r.style === 'neon') {
          for (const z of [-0.27, 0.27]) {
            const strip = new THREE.Mesh(box, glowMat(r.style === 'neon' ? [0x39f0ff, 0xff4fd8, 0xffe14d][e]! : 0x9ffcff))
            strip.scale.set(CELL - 0.2, 0.09, 0.05)
            strip.position.set(0, WALL_H - 0.5, z)
            g.add(strip)
          }
          for (const x of [-1.25, 1.25]) for (const z of [-0.27, 0.27]) {
            const strip = new THREE.Mesh(box, glowMat(r.style === 'neon' ? [0x39f0ff, 0xff4fd8, 0xffe14d][e]! : 0x9ffcff))
            strip.scale.set(0.08, WALL_H - 0.6, 0.05)
            strip.position.set(x, WALL_H / 2 - 0.2, z)
            g.add(strip)
          }
        } else if (r.style === 'brass') {
          const gear = new THREE.Mesh(gearGeo, mat(0xe0b85a))
          gear.scale.set(0.9, 0.9, 1)
          gear.position.set(0, WALL_H + 0.35, -0.05)
          spinners.push({ m: gear, s: e % 2 ? -0.5 : 0.5 })
          g.add(gear)
        } else if (r.style === 'stone') {
          g.add(cuboid(0.9, 0.5, 0.6, 0x6d655e, 0, WALL_H + 0.25, 0))
        }
        const s = answerSign(color)
        s.mesh.userData.exit = e
        s.mesh.userData.face = face
        s.mesh.userData.g = g
        s.mesh.visible = false
        g.add(s.mesh)
        level.add(g)
        return { panel, hinge, sign: s.mesh, draw: s.draw }
      })
      views.push(row)
    })

    const { goal } = layout
    const gx = goal.x * CELL
    const gz = goal.z * CELL
    level.add(cuboid(CELL - 0.8, 0.04, CELL - 0.8, r.pad, gx, 0.02, gz))
    const g = new THREE.Group()
    g.position.set(gx + DX[goal.heading]! * 1.3, 0, gz + DZ[goal.heading]! * 1.3)
    g.rotation.y = angleOf(goal.heading) + Math.PI
    const lid = new THREE.Group()
    lid.position.set(0, 0.8, -0.55)
    lid.add(cuboid(1.7, 0.35, 1.1, 0xa06a35, 0, 0.175, 0.55), cuboid(0.25, 0.25, 0.15, 0xf2c94c, 0, 0.1, 1.1))
    g.add(cuboid(1.7, 0.8, 1.1, 0x8b5a2b, 0, 0.4, 0), cuboid(1.5, 0.06, 0.9, 0xffd447, 0, 0.82, 0), lid)
    level.add(g)
    chest = { g, lid }
    const wedge = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.5, 16, 1, false, 0, Math.PI * 0.6), mat(0xffd23f))
    wedge.position.set(gx - DX[goal.heading]! * 0.4 + DZ[goal.heading]! * 1.3, 0.25, gz - DZ[goal.heading]! * 0.4 - DX[goal.heading]! * 1.3)
    level.add(wedge)

    const start = layout.junctions[0]!
    mouse.position.set(start.x * CELL, 0, start.z * CELL)
    mouse.rotation.y = angleOf(start.heading)
    camAngle = camTarget = angleOf(start.heading)
    resetTrail(start.x, start.z, start.heading)
    const [bx, bz] = trail[0]!
    cam.position.set(mouse.position.x + (bx - mouse.position.x) * ((BACK * zoom) / 8), 3.6, mouse.position.z + (bz - mouse.position.z) * ((BACK * zoom) / 8))
  }

  const turnToAngle = async (a: number) => {
    const from = mouse.rotation.y
    const d = wrapPi(a - from)
    if (Math.abs(d) < 0.02) return
    await tween(0.15 + Math.abs(d) * 0.12, (k) => (mouse.rotation.y = from + d * ease(k)))
  }
  const turnTo = (dir: Dir) => turnToAngle(angleOf(dir))

  const walkPath = async (pts: [number, number][], speed = 8) => {
    const P: [number, number][] = [[mouse.position.x, mouse.position.z], ...pts.map(([x, z]) => [x * CELL, z * CELL] as [number, number])]
    const segs: { x: number; z: number; dx: number; dz: number; len: number; ang: number; start: number }[] = []
    let total = 0
    for (let i = 1; i < P.length; i++) {
      const dx = P[i]![0] - P[i - 1]![0]
      const dz = P[i]![1] - P[i - 1]![1]
      const len = Math.hypot(dx, dz)
      if (len < 0.01) continue
      segs.push({ x: P[i - 1]![0], z: P[i - 1]![1], dx, dz, len, ang: Math.atan2(dx, dz), start: total })
      total += len
    }
    if (!segs.length) return
    await turnToAngle(segs[0]!.ang)
    moving = true
    let lastK = 0
    let stepAt = 0
    await tween(total / speed, (k) => {
      const d = k * total
      const s = [...segs].reverse().find((sg) => sg.start <= d) ?? segs[0]!
      const f = Math.min(1, (d - s.start) / s.len)
      mouse.position.set(s.x + s.dx * f, 0, s.z + s.dz * f)
      const dt = (k - lastK) * (total / speed)
      lastK = k
      if (d - stepAt > 0.9) {
        stepAt = d
        sfx.step()
      }
      mouse.rotation.y += wrapPi(s.ang - mouse.rotation.y) * (1 - Math.exp(-dt * 14))
      camTarget = s.ang
      const last = trail[trail.length - 1]!
      if (Math.hypot(mouse.position.x - last[0], mouse.position.z - last[1]) > 0.3) trail.push([mouse.position.x, mouse.position.z])
    })
    moving = false
    rig.position.y = 0
    rig.rotation.z = 0
  }

  const emote = (emoji: string) => {
    const s = emojiSprite(emoji)
    s.scale.set(2.2, 2.2, 1)
    fx.add(s)
    const { x, z } = mouse.position
    void tween(1.2, (k) => {
      s.position.set(x, 3 + k * 1.5, z)
      s.material.opacity = 1 - k * k
      if (k >= 1) fx.remove(s)
    })
  }

  const bonk = async () => {
    emote('💥')
    sfx.bonk()
    await tween(0.45, (k) => (rig.rotation.z = Math.sin(k * 22) * 0.3 * (1 - k)))
    rig.rotation.z = 0
  }

  const hop = (n: number) => {
    for (let i = 0; i < n; i++) setTimeout(sfx.boing, i * 350)
    return tween(n * 0.35, (k) => {
      rig.position.y = Math.abs(Math.sin(k * n * Math.PI)) * 1.1
      if (k >= 1) rig.position.y = 0
    })
  }

  const dropCage = async () => {
    const c = new THREE.Group()
    const metal = 0xb8c0cc
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), mat(metal))
      bar.position.set(Math.cos(a) * 1.35, 1.2, Math.sin(a) * 1.35)
      c.add(bar)
    }
    const top = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.08, 6, 20), mat(metal))
    top.rotation.x = Math.PI / 2
    top.position.y = 2.4
    c.add(top, cuboid(2.7, 0.08, 0.08, 0xb8c0cc, 0, 2.4, 0), cuboid(0.08, 0.08, 2.7, 0xb8c0cc, 0, 2.4, 0))
    c.position.set(mouse.position.x, 6, mouse.position.z)
    fx.add(c)
    cage = c
    sfx.whoosh()
    await tween(0.35, (k) => (c.position.y = 6 * (1 - k * k)))
    sfx.snap()
    await tween(0.3, (k) => (c.position.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.25 * (1 - k)))
  }
  const liftCage = async () => {
    const c = cage
    if (!c) return
    sfx.free()
    await tween(0.6, (k) => (c.position.y = 7 * k * k))
    fx.remove(c)
    cage = null
  }

  const openChest = () => {
    const c = chest
    if (c) sfx.chest()
    return c ? tween(0.6, (k) => (c.lid.rotation.x = -1.3 * ease(k))) : Promise.resolve()
  }

  const setDoor = (k: number, e: number, open: boolean) => {
    const hinge = views[k]?.[e]?.hinge
    if (!hinge) return Promise.resolve()
    sfx.door(open)
    const from = hinge.rotation.y
    const to = open ? hinge.userData.face * 1.75 : 0
    return tween(open ? 0.5 : 0.4, (t) => (hinge.rotation.y = from + (to - from) * (open ? easeOutBack(t) : ease(t))))
  }

  const showSigns = (k: number, labels: string[] | null) => {
    current = labels ? k : -1
    hover = -1
    views.forEach((row, i) =>
      row.forEach((d, e) => {
        const on = labels !== null && i === k
        d.sign.visible = on
        d.sign.userData.label = labels?.[e]
        if (on) {
          d.draw(labels![e]!)
          d.sign.userData.pop = 0
          void sleep(e * 0.08).then(() =>
            tween(0.35, (t) => {
              d.sign.userData.pop = ease(t) * (1 + 0.2 * Math.sin(t * Math.PI))
            }),
          )
        }
      }),
    )
  }

  const markSign = (k: number, e: number, good: boolean) =>
    views[k]?.forEach((d, i) => {
      if (i === e) d.draw(d.sign.userData.label, good ? 'good' : 'bad')
      else d.sign.visible = false
    })

  const setHover = (e: number) => {
    if (e === hover) return
    hover = e
    canvas.style.cursor = e >= 0 ? 'pointer' : ''
    hoverHandler?.(e)
  }

  const swivel = new THREE.Vector3()
  const ray = new THREE.Raycaster()
  const ndc = new THREE.Vector2()
  const doorAt = (ev: PointerEvent) => {
    if (!pickHandler || current < 0) return -1
    ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1)
    ray.setFromCamera(ndc, cam)
    const row = views[current]!
    const hit = ray.intersectObjects([...row.map((d) => d.sign), ...row.map((d) => d.panel)], false)[0]
    return hit ? (hit.object.userData.exit as number) : -1
  }
  canvas.addEventListener('pointermove', (ev) => ev.pointerType === 'mouse' && setHover(doorAt(ev)))
  canvas.addEventListener('pointerdown', (ev) => {
    const e = doorAt(ev)
    if (e >= 0) pickHandler?.(e)
  })

  const tick = (dt: number) => {
    time += dt
    stepTasks(dt)
    if (moving) {
      rig.position.y = Math.abs(Math.sin(time * 16)) * 0.14
      rig.rotation.z = Math.sin(time * 16) * 0.05
    } else {
      rig.scale.y = 1 + Math.sin(time * 3) * 0.015
    }

    const inv = new THREE.Quaternion()
    views[current]?.forEach((d, e) => {
      const g = d.sign.userData.g as THREE.Group
      d.sign.position.set(0, WALL_H - 1.6 + Math.sin(time * 2.4 + e * 1.3) * 0.06, d.sign.userData.face * 0.7)
      d.sign.quaternion.copy(inv.copy(g.quaternion).invert().multiply(cam.quaternion))
      const w = d.sign.getWorldPosition(swivel)
      const px = Math.max(48, Math.min(innerHeight * 0.13, innerWidth * 0.13, 120))
      const fit = ((px / innerHeight) * 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * w.distanceTo(cam.position)) / SIGN_SIZE.height
      const hl = e === hover ? 1.14 + Math.sin(time * 8) * 0.03 : 1
      d.sign.scale.setScalar((d.sign.userData.pop ?? 1) * fit * hl)
    })

    flames.forEach((f, i) => f.scale.set(0.2 + Math.sin(time * 11 + i) * 0.04, 0.3 + Math.sin(time * 13 + i * 2) * 0.07, 0.2))
    for (const sp of spinners) sp.m.rotation.z += sp.s * dt
    if (dust) {
      const pos = dust.pts.geometry.getAttribute('position') as THREE.BufferAttribute
      const cx = mouse.position.x
      const cz = mouse.position.z
      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i) + dust.vel[i * 3]! * dt
        let y = pos.getY(i) + dust.vel[i * 3 + 1]! * dt
        let z = pos.getZ(i) + dust.vel[i * 3 + 2]! * dt
        if (x - cx > 15) x -= 30
        else if (x - cx < -15) x += 30
        if (z - cz > 15) z -= 30
        else if (z - cz < -15) z += 30
        if (y > 5.5) y = 0.2
        else if (y < 0.1) y = 5
        pos.setXYZ(i, x, y, z)
      }
      pos.needsUpdate = true
    }

    const mp = mouse.position
    if (orbit) {
      orbitT += dt * 0.35
      cam.position.set(mp.x + Math.cos(orbitT) * 6, 3.4, mp.z + Math.sin(orbitT) * 6)
      cam.lookAt(mp.x, 0.9, mp.z)
      return
    }
    camAngle += wrapPi(camTarget - camAngle) * (1 - Math.exp(-dt * 5))
    focus += (focusTarget - focus) * (1 - Math.exp(-dt * 4))
    const want = new THREE.Vector3(0, 3.6 + focus * 1.6, 0)
    let need = BACK * zoom
    let [px, pz] = [mp.x, mp.z]
    for (let i = trail.length - 1; i >= 0; i--) {
      const [tx, tz] = trail[i]!
      const d = Math.hypot(tx - px, tz - pz)
      if (d >= need || i === 0) {
        const f = d > 0 ? Math.min(1, need / d) : 0
        px += (tx - px) * f
        pz += (tz - pz) * f
        break
      }
      need -= d
      px = tx
      pz = tz
    }
    want.x = px
    want.z = pz
    cam.position.lerp(want, 1 - Math.exp(-dt * 11))
    const ahead = 4 * (1 - focus)
    cam.lookAt(mp.x + Math.sin(camAngle) * ahead, 1 - focus * (cam.aspect < 1 ? 3.2 : 1.2), mp.z + Math.cos(camAngle) * ahead)
  }

  const clock = new THREE.Clock()
  renderer.setAnimationLoop(() => {
    tick(Math.min(clock.getDelta(), 0.05))
    renderer.render(scene, cam)
  })

  return {
    load,
    setSkin,
    getSkin: () => skin,
    setOrbit: (on: boolean) => (orbit = on),
    onPick: (fn: ((exit: number) => void) | null) => (pickHandler = fn),
    releaseCamera,
    showSigns,
    markSign,
    setFocus: (on: boolean) => (focusTarget = on ? 1 : 0),
    setHover,
    onHover: (fn: ((exit: number) => void) | null) => (hoverHandler = fn),
    setDoor,
    walkPath,
    getRealm: () => realm,
    turnTo,
    emote,
    bonk,
    hop,
    dropCage,
    liftCage,
    openChest,
  }
}

export type World = ReturnType<typeof createWorld>
