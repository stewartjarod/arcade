// Dev-only helpers, reached from the browser console as `__mm`. Used for screenshots and performance numbers.
//   __mm.show(3)        load realm #3 with a small maze, in the chase view, with the door signs up
//   __mm.stats()        draw calls, triangles and GPU memory counts for the last frame
//   __mm.fps(2000)      Promise: median frame time (ms) over 2 seconds
import type * as THREE from 'three'
import { generateMaze } from './maze'
import { REALMS } from './realms'
import type { World } from './world'

export const installDebug = (world: World) => {
  const { renderer } = world.debug
  const api = {
    world,
    show(realm: number, sizeLevel = 2) {
      world.setOrbit(false)
      world.load(generateMaze(sizeLevel), REALMS[realm]!)
      world.showSigns(0, ['12', '15', '18'])
    },
    stats() {
      const { render, memory } = renderer.info
      return { calls: render.calls, triangles: render.triangles, geometries: memory.geometries, textures: memory.textures }
    },
    // Counts what is in the scene without rendering it: draw items and triangles (instances included, no culling).
    census() {
      let items = 0
      let triangles = 0
      let instances = 0
      world.debug.scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (!(m.isMesh || (o as THREE.Points).isPoints) || !o.visible) return
        const g = m.geometry
        const per = g.index ? g.index.count / 3 : (g.getAttribute('position')?.count ?? 0) / 3
        const n = (m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1
        items++
        instances += n
        if (m.isMesh) triangles += per * n
      })
      return { items, instances, triangles: Math.round(triangles) }
    },
    fps(ms = 2000) {
      return new Promise<{ medianMs: number; frames: number }>((done) => {
        const times: number[] = []
        let last = performance.now()
        const t0 = last
        const step = (now: number) => {
          times.push(now - last)
          last = now
          if (now - t0 < ms) requestAnimationFrame(step)
          else done({ medianMs: times.sort((a, b) => a - b)[Math.floor(times.length / 2)]!, frames: times.length })
        }
        requestAnimationFrame(step)
      })
    },
  }
  ;(window as unknown as { __mm: typeof api }).__mm = api
}
