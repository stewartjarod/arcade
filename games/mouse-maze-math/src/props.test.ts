import { describe, expect, test } from 'vitest'
import * as THREE from 'three'
import { generateMaze, type Layout } from './maze'
import { REALMS } from './realms'
import { buildProps } from './props'

// The corridor rule (documented here, checked below):
// the mouse walks along the centre lines of the maze, the lines x = k * 4 and z = k * 4 through the cell centres.
// A prop that stands low (below OVERHEAD, so the mouse can walk under it) must be at least 1.0 away from
// every one of those lines, on BOTH the x and the z axis. Wall tops and hanging things are above the mouse's
// head, so they are exempt. Floor props also never go in a junction cell, the goal cell, or a cell next to them.

const CELL = 4
const OVERHEAD = 2.5 // matches props.ts
const CLEAR = 1.0 // the rule above (props.ts places them at 1.1 or more; the 0.1 is room for blade jitter)

// Seeded random numbers, so a failure happens the same way every time.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

// How far a value is from the nearest corridor centre line (a multiple of CELL).
const lineGap = (v: number) => Math.abs(v - Math.round(v / CELL) * CELL)

// Every triangle of every instance, as the GPU draws them.
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

// Cells the floor props must stay out of: junctions, the goal, and their neighbours.
const plainKeys = (layout: Layout) => {
  const keys = new Set<string>()
  const centres = [...layout.junctions.map((j) => [j.x, j.z]), [layout.goal.x, layout.goal.z]]
  for (const [x, z] of centres) {
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) keys.add(`${x! + dx!},${z! + dz!}`)
  }
  return keys
}

const positionsOf = (mesh: THREE.InstancedMesh) => {
  const out: THREE.Vector3[] = []
  const m = new THREE.Matrix4()
  const p = new THREE.Vector3()
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m)
    out.push(p.setFromMatrixPosition(m).clone())
  }
  return out
}

describe.each([
  ['a small maze', 3],
  ['a big maze', 10],
])('props on %s', (_name, junctions) => {
  const layout = generateMaze(junctions)

  for (const realm of REALMS) {
    test(`${realm.id}: few draw calls, small triangle count`, () => {
      const { group, dispose } = buildProps(layout, realm, seeded(7))
      const meshes = group.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh)
      expect(meshes.length).toBeLessThanOrEqual(10)
      expect(triangles(group)).toBeLessThanOrEqual(25_000)
      dispose()
    })

    test(`${realm.id}: floor props stay out of the corridors and the plain cells (many random seeds)`, () => {
      const plain = plainKeys(layout)
      // Props are placed by random numbers, so one lucky seed proves little: try a lot of them.
      for (let seed = 1; seed <= 40; seed++) {
        const { group, dispose } = buildProps(layout, realm, seeded(seed))
        for (const mesh of group.children as THREE.InstancedMesh[]) {
          for (const p of positionsOf(mesh)) {
            if (p.y >= OVERHEAD) continue // over the mouse's head: exempt
            expect(lineGap(p.x) >= CLEAR && lineGap(p.z) >= CLEAR, `${realm.id} seed ${seed} at ${p.x.toFixed(2)},${p.z.toFixed(2)}`).toBe(true)
            const cell = `${Math.round(p.x / CELL)},${Math.round(p.z / CELL)}`
            expect(plain.has(cell), `${realm.id} seed ${seed} prop in plain cell ${cell}`).toBe(false)
          }
        }
        dispose()
      }
    })
  }
})

test('the glow is made with colours above 1 and tone mapping off, so bloom catches it', () => {
  const layout = generateMaze(3)
  const garden = REALMS.find((r) => r.id === 'star')!
  const { group, dispose } = buildProps(layout, garden, seeded(3))
  const glowMeshes = group.children.filter((c): c is THREE.InstancedMesh => c instanceof THREE.InstancedMesh && !(c.material as THREE.Material).toneMapped)
  expect(glowMeshes.length).toBeGreaterThan(0)
  dispose()
})

test('update() moves the butterflies and orbs without throwing, and dispose() empties the group', () => {
  const layout = generateMaze(3)
  for (const realm of REALMS) {
    const props = buildProps(layout, realm, seeded(5))
    expect(() => {
      props.update(0.016, 1.5)
      props.update(0.016, 2.25)
    }).not.toThrow()
    props.dispose()
    expect(props.group.children.length).toBe(0)
  }
})
