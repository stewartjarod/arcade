import * as THREE from 'three'
import type { Game } from './game'
import { rand } from './util'

/** A burst of little cubes — for coins, explosions, confetti. */
export function burst(
  game: Game,
  at: THREE.Vector3,
  { count = 16, color = '#ffd43b' as THREE.ColorRepresentation | THREE.ColorRepresentation[], speed = 6, size = 0.15, life = 0.7 } = {},
) {
  const colors = Array.isArray(color) ? color : [color]
  const geo = new THREE.BoxGeometry(size, size, size)
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true }))
    m.position.copy(at)
    const e = game.add(m)
    e.velocity.set(rand(-1, 1), rand(0.3, 1.5), rand(-1, 1)).normalize().multiplyScalar(speed * rand(0.5, 1))
    let t = 0
    e.with((p, dt) => {
      t += dt
      p.velocity.y -= 15 * dt
      p.rotation.x += dt * 8
      ;(m.material as THREE.MeshBasicMaterial).opacity = 1 - t / life
      if (t >= life) p.destroy()
    })
  }
}
