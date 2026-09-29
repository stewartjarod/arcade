import { THREE } from '@arcade/engine'

/**
 * The Mouse Maze Math mouse — round body, big ears, pink tail, optional hat.
 * Faces +z, feet at y = 0, about 1.6 units tall.
 *
 *   scene.add(mouseModel({ color: 0xa9805a, hat: 'crown' }))
 */
export type MouseHat = 'none' | 'bow' | 'party' | 'wizard' | 'crown'
export const MOUSE_HATS: MouseHat[] = ['none', 'bow', 'party', 'wizard', 'crown']

const ball = new THREE.SphereGeometry(1, 20, 14)
const mats = new Map<number, THREE.MeshLambertMaterial>()
const mat = (c: number) => {
  let m = mats.get(c)
  if (!m) mats.set(c, (m = new THREE.MeshLambertMaterial({ color: c })))
  return m
}
const blob = (sx: number, sy: number, sz: number, c: number, x: number, y: number, z: number) => {
  const m = new THREE.Mesh(ball, mat(c))
  m.scale.set(sx, sy, sz)
  m.position.set(x, y, z)
  return m
}

export function mouseModel({ color = 0xb8b8c4, hat = 'none' as MouseHat } = {}) {
  const rig = new THREE.Group()
  const add = (...o: THREE.Object3D[]) => rig.add(...o)
  add(blob(0.62, 0.55, 0.9, color, 0, 0.65, 0), blob(0.42, 0.4, 0.45, color, 0, 0.85, 0.85))
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 12), mat(color))
  snout.rotation.x = Math.PI / 2
  snout.position.set(0, 0.78, 1.3)
  add(snout, blob(0.1, 0.1, 0.1, 0xff7a9c, 0, 0.78, 1.58))
  for (const s of [-1, 1]) {
    add(
      blob(0.07, 0.09, 0.05, 0x111111, s * 0.18, 0.98, 1.15),
      blob(0.3, 0.3, 0.08, color, s * 0.36, 1.3, 0.7),
      blob(0.2, 0.2, 0.06, 0xffb3c6, s * 0.36, 1.3, 0.76),
      blob(0.16, 0.1, 0.24, color, s * 0.32, 0.12, 0.4),
      blob(0.16, 0.1, 0.24, color, s * 0.32, 0.12, -0.4),
    )
  }
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.5, -0.8),
    new THREE.Vector3(0, 0.35, -1.3),
    new THREE.Vector3(0.35, 0.25, -1.8),
    new THREE.Vector3(0.7, 0.4, -2.2),
  ])
  add(new THREE.Mesh(new THREE.TubeGeometry(tail, 16, 0.06, 6), mat(0xffb3c6)))

  const h = new THREE.Group()
  h.position.set(0, 1.2, 0.85)
  if (hat === 'party') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.75, 16), mat(0xd946ef))
    cone.position.y = 0.3
    h.add(cone, blob(0.08, 0.08, 0.08, 0xffe066, 0, 0.7, 0))
  } else if (hat === 'crown') {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.25, 16), mat(0xf2c94c))
    ring.position.y = 0.05
    h.add(ring)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 8), mat(0xf2c94c))
      spike.position.set(Math.cos(a) * 0.26, 0.29, Math.sin(a) * 0.26)
      h.add(spike)
    }
  } else if (hat === 'wizard') {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.0, 16), mat(0x5b3fd1))
    cone.position.y = 0.5
    cone.rotation.z = 0.15
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.05, 20), mat(0x5b3fd1))
    h.add(cone, brim, blob(0.07, 0.07, 0.07, 0xffe066, 0.1, 0.55, 0.36))
  } else if (hat === 'bow') {
    h.position.set(0.36, 1.5, 0.7)
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.32, 10), mat(0xff4d8d))
      wing.rotation.z = -s * (Math.PI / 2)
      wing.position.x = s * 0.16
      h.add(wing)
    }
    h.add(blob(0.07, 0.07, 0.07, 0xd6336c, 0, 0, 0))
  }
  add(h)
  return rig
}
