import { describe, expect, it } from 'vitest'
import { THREE } from '@arcade/engine'
import { COLORS } from '../../../games/mouse-maze-math/src/catalog'
import { mouseModel, MOUSE_HATS, type MouseRig } from './mouse'

function meshesOf(root: THREE.Object3D) {
  const list: THREE.Mesh[] = []
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) list.push(o)
  })
  return list
}

function triangles(root: THREE.Object3D) {
  return meshesOf(root).reduce((sum, m) => {
    const g = m.geometry
    return sum + (g.index ? g.index.count : g.getAttribute('position').count) / 3
  }, 0)
}

/** Where every vertex of the mouse ends up, in the mouse's own space. */
function worldPoints(rig: THREE.Group) {
  rig.updateMatrixWorld(true)
  const points: THREE.Vector3[] = []
  const v = new THREE.Vector3()
  for (const mesh of meshesOf(rig)) {
    const pos = mesh.geometry.getAttribute('position')
    for (let i = 0; i < pos.count; i++) points.push(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld).clone())
  }
  return points
}

const colours = COLORS.map((c) => c.hex)

describe('mouseModel', () => {
  it('builds for every colour and every hat', () => {
    for (const color of colours) {
      for (const hat of MOUSE_HATS) {
        expect(() => mouseModel({ color, hat })).not.toThrow()
      }
    }
  })

  it('stays under the triangle budget and about ten to twelve meshes', () => {
    for (const color of colours) {
      for (const hat of MOUSE_HATS) {
        const rig = mouseModel({ color, hat })
        expect(triangles(rig), `${color} ${hat} triangles`).toBeLessThanOrEqual(6000)
        expect(meshesOf(rig).length, `${color} ${hat} meshes`).toBeLessThanOrEqual(12)
      }
    }
  })

  it('is about 1.6 tall (within 1.4 to 2.0 with any hat), feet on the floor', () => {
    for (const color of colours) {
      for (const hat of MOUSE_HATS) {
        const box = new THREE.Box3().setFromObject(mouseModel({ color, hat }))
        const height = box.max.y - box.min.y
        expect(height, `${hat} height`).toBeGreaterThanOrEqual(1.4)
        expect(height, `${hat} height`).toBeLessThanOrEqual(2.0)
        expect(Math.abs(box.min.y), `${hat} feet`).toBeLessThan(0.05)
      }
    }
  })

  it('faces +z: the front-most point is the snout, not the tail', () => {
    for (const hat of MOUSE_HATS) {
      const points = worldPoints(mouseModel({ color: 0xb8b8c4, hat }))
      const front = points.reduce((a, b) => (b.z > a.z ? b : a))
      expect(front.z, `${hat} front`).toBeGreaterThan(1.3)
      expect(Math.abs(front.x), `${hat} snout centred`).toBeLessThan(0.1)
      expect(front.y, `${hat} snout height`).toBeGreaterThan(0.8)
      expect(front.y, `${hat} snout height`).toBeLessThan(1.1)
      const back = points.reduce((a, b) => (b.z < a.z ? b : a))
      expect(back.z, `${hat} tail is behind`).toBeLessThan(-1.2)
    }
  })

  it('casts shadows from every mesh', () => {
    for (const m of meshesOf(mouseModel({ hat: 'crown' }))) expect(m.castShadow).toBe(true)
  })

  it('shares geometry between mice of the same colour', () => {
    const a = meshesOf(mouseModel({ color: 0xa9805a }))[0]!
    const b = meshesOf(mouseModel({ color: 0xa9805a }))[0]!
    expect(a.geometry).toBe(b.geometry)
  })

  it('animate only moves child parts, never the root', () => {
    const rig: MouseRig = mouseModel({ color: 0xf4a6c0, hat: 'wizard' })
    rig.position.set(1, 2, 3)
    rig.rotation.set(0.1, 0.2, 0.3)
    rig.scale.set(1.5, 1.5, 1.5)
    const before = { p: rig.position.clone(), r: rig.rotation.clone(), s: rig.scale.clone() }
    for (const t of [0, 0.05, 0.5, 1.7, 3.6, 10, 123.4]) {
      rig.animate(t, true)
      rig.animate(t, false)
    }
    expect(rig.position.equals(before.p)).toBe(true)
    expect(rig.rotation.x).toBe(before.r.x)
    expect(rig.rotation.y).toBe(before.r.y)
    expect(rig.rotation.z).toBe(before.r.z)
    expect(rig.scale.equals(before.s)).toBe(true)
  })

  it('animate moves the legs when walking and settles when still', () => {
    const rig = mouseModel()
    const leg = rig.children.find((c) => c.position.y === 0.2 && c.position.x < 0)!
    rig.animate(0, true)
    rig.animate(0.5, true)
    expect(Math.abs(leg.rotation.x)).toBeGreaterThan(0)
    for (let i = 1; i <= 60; i++) rig.animate(0.5 + i / 30, false)
    expect(Math.abs(leg.rotation.x)).toBeLessThan(0.01)
  })
})
