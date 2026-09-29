import * as THREE from 'three'
import type { Behavior, Entity } from './entity'

/**
 * Ready-made behaviors. Mix and match:
 *   new Entity(mesh).with(spin(), bob(), collect('player', () => score++))
 */

/** Keep turning around an axis. */
export const spin = (speed = 2, axis: 'x' | 'y' | 'z' = 'y'): Behavior => (e, dt) => {
  e.rotation[axis] += speed * dt
}

/** Float gently up and down. */
export const bob = (height = 0.25, speed = 3): Behavior => {
  let base = 0
  let t = Math.random() * 10
  return {
    start: (e) => (base = e.position.y),
    update: (e, dt) => {
      t += dt
      e.position.y = base + Math.sin(t * speed) * height
    },
  }
}

/** Walk around on the ground with arrows/WASD (top-down / third-person). */
export const moveWithKeys = (speed = 6, { turn = true } = {}): Behavior => (e, dt) => {
  const a = e.game.input.axis()
  e.position.x += a.x * speed * dt
  e.position.z -= a.y * speed * dt
  if (turn && a.lengthSq() > 0.01) {
    const target = Math.atan2(a.x, -a.y)
    e.rotation.y = lerpAngle(e.rotation.y, target, 1 - Math.exp(-12 * dt))
  }
}

/** Side-scroller controls: left/right to run, jump button to jump. Pair with gravity(). */
export const platformer = ({ speed = 7, jump = 12 } = {}): Behavior => (e, dt) => {
  const input = e.game.input
  e.velocity.x = input.axis().x * speed
  if (e.data.onGround && input.pressed('jump')) {
    e.velocity.y = jump
    e.game.sound.play('jump')
  }
  void dt
}

/** Fall down, and stop at the floor (y = floorY) or on anything tagged 'solid'. */
export const gravity = ({ strength = 30, floorY = 0 as number | null } = {}): Behavior => (e, dt) => {
  e.velocity.y -= strength * dt
  e.data.onGround = false
  const feet = e.position.y - e.radius
  if (floorY !== null && feet <= floorY && e.velocity.y <= 0) {
    e.position.y = floorY + e.radius
    e.velocity.y = 0
    e.data.onGround = true
  }
  for (const s of e.game.find('solid')) {
    const box = new THREE.Box3().setFromObject(s.object)
    const top = box.max.y
    const over = e.position.x > box.min.x - e.radius * 0.5 && e.position.x < box.max.x + e.radius * 0.5 &&
      e.position.z > box.min.z - e.radius * 0.5 && e.position.z < box.max.z + e.radius * 0.5
    if (over && e.velocity.y <= 0 && feet <= top && feet >= top - 0.5) {
      e.position.y = top + e.radius
      e.velocity.y = 0
      e.data.onGround = true
    }
  }
}

/** Camera follows this entity from an offset, smoothly. */
export const cameraFollow = (offset = new THREE.Vector3(0, 6, 10), smooth = 5): Behavior => (e, dt) => {
  const cam = e.game.camera
  const want = e.position.clone().add(offset)
  cam.position.lerp(want, 1 - Math.exp(-smooth * dt))
  cam.lookAt(e.position)
}

/** Move toward the nearest entity with a tag (enemies chasing the player). */
export const chase = (tag: string, speed = 3): Behavior => (e, dt) => {
  const target = nearest(e, tag)
  if (!target) return
  const dir = target.position.clone().sub(e.position).setY(0)
  if (dir.lengthSq() < 0.001) return
  dir.normalize()
  e.position.addScaledVector(dir, speed * dt)
  e.rotation.y = Math.atan2(dir.x, dir.z)
}

/** When something tagged `by` touches this, run onCollect and disappear with a pop. */
export const collect = (by: string, onCollect?: (e: Entity, collector: Entity) => void): Behavior => (e) => {
  if (e.data.collected) return
  for (const other of e.game.find(by)) {
    if (e.touches(other)) {
      e.data.collected = true
      onCollect?.(e, other)
      e.game.tweens.to(e.scale, { x: 0, y: 0, z: 0 }, 0.2).then(() => e.destroy())
      return
    }
  }
}

/** Call a function whenever this touches something with the tag (once per touch). */
export const onTouch = (tag: string, fn: (e: Entity, other: Entity) => void): Behavior => {
  const touching = new Set<Entity>()
  return (e) => {
    for (const other of e.game.find(tag)) {
      if (other === e) continue
      const now = e.touches(other)
      if (now && !touching.has(other)) fn(e, other)
      if (now) touching.add(other)
      else touching.delete(other)
    }
  }
}

/** Disappear after some seconds (bullets, particles). */
export const lifetime = (seconds: number): Behavior => {
  let t = 0
  return (e, dt) => {
    if ((t += dt) >= seconds) e.destroy()
  }
}

/** Walk back and forth between two points. */
export const patrol = (from: THREE.Vector3, to: THREE.Vector3, speed = 2): Behavior => {
  let t = 0
  const len = from.distanceTo(to)
  return (e, dt) => {
    t += (dt * speed) / len
    const k = (Math.sin(t * Math.PI) + 1) / 2
    e.position.lerpVectors(from, to, k)
  }
}

/** Keep inside a box (so the player can't walk off the world). */
export const stayInside = (min: THREE.Vector3, max: THREE.Vector3): Behavior => (e) => {
  e.position.clamp(min, max)
}

/** Destroy when far from the origin (cleanup for things that fly away). */
export const despawnFar = (distance = 100): Behavior => (e) => {
  if (e.position.length() > distance) e.destroy()
}

// --- helpers ---

export function nearest(from: Entity, tag: string) {
  let best: Entity | undefined
  let bestD = Infinity
  for (const e of from.game.find(tag)) {
    const d = e.position.distanceToSquared(from.position)
    if (e !== from && d < bestD) (best = e), (bestD = d)
  }
  return best
}

function lerpAngle(a: number, b: number, t: number) {
  const d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  return a + d * t
}
