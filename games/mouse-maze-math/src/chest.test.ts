import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { createChest, createCheeseWedge } from './chest'

// Every triangle of every mesh in a tree, counting each copy of an instanced mesh.
const triangles = (root: THREE.Object3D) => {
  let n = 0
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const g = o.geometry
    const verts = g.index ? g.index.count : g.attributes.position!.count
    n += (verts / 3) * (o instanceof THREE.InstancedMesh ? o.count : 1)
  })
  return n
}

describe('treasure chest', () => {
  test('builds in node with under 5000 triangles, and dispose() runs', () => {
    const chest = createChest()
    expect(triangles(chest.group)).toBeLessThan(5000)
    chest.update(0.016, 0)
    chest.update(0.016, 1)
    expect(() => chest.dispose()).not.toThrow()
  })

  test('the lid pivots on its back top edge, and the front is +z', () => {
    const chest = createChest()
    expect(chest.lid.position.x).toBe(0)
    expect(chest.lid.position.y).toBeCloseTo(0.8)
    expect(chest.lid.position.z).toBeCloseTo(-0.55)
    chest.dispose()
  })

  test('the glow grows with openness', () => {
    const chest = createChest()
    const halo = chest.group.children.find((c): c is THREE.Sprite => c instanceof THREE.Sprite)!
    chest.update(0, 0)
    const closed = halo.scale.x
    chest.update(0, 1)
    expect(halo.scale.x).toBeGreaterThan(closed)
    chest.dispose()
  })

  test('two chests can be made and freed without touching each other', () => {
    const a = createChest()
    const b = createChest()
    a.dispose()
    expect(() => b.update(0.016, 0.5)).not.toThrow()
    b.dispose()
  })
})

describe('cheese wedge', () => {
  test('is a mesh, about 0.55 across, with its base at y = 0', () => {
    const wedge = createCheeseWedge()
    expect(wedge).toBeInstanceOf(THREE.Mesh)
    wedge.geometry.computeBoundingBox()
    const box = wedge.geometry.boundingBox!
    expect(box.min.y).toBeCloseTo(0, 1)
    expect(box.max.x).toBeGreaterThan(0.5)
    expect(triangles(wedge)).toBeLessThan(1000)
  })
})
