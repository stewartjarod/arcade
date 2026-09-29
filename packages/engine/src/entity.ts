import * as THREE from 'three'
import type { Game } from './game'

/**
 * A behavior is a reusable piece of logic you attach to an entity:
 * spin, bob, follow the player, move with arrow keys...
 * Either a function called every frame, or an object with hooks.
 */
export type Behavior =
  | ((entity: Entity, dt: number) => void)
  | {
      start?(entity: Entity): void
      update?(entity: Entity, dt: number): void
      destroy?(entity: Entity): void
    }

/**
 * Anything that lives in the game: player, coin, enemy, cloud.
 * Wraps a three.js object and gives it behaviors, tags and a velocity.
 */
export class Entity {
  game!: Game
  readonly object: THREE.Object3D
  readonly tags = new Set<string>()
  readonly velocity = new THREE.Vector3()
  /** Collision radius used by touches() / collide behaviors. */
  radius = 0.5
  alive = true
  /** Free-form data for your game (health, points, speed...). */
  data: Record<string, any> = {}

  private behaviors: Behavior[] = []
  private started = false

  constructor(object: THREE.Object3D = new THREE.Group(), ...tags: string[]) {
    this.object = object
    for (const t of tags) this.tags.add(t)
    // Guess a collision radius from the object's size.
    const box = new THREE.Box3().setFromObject(object)
    if (!box.isEmpty()) this.radius = box.getSize(new THREE.Vector3()).length() / 3
  }

  get position() {
    return this.object.position
  }
  get rotation() {
    return this.object.rotation
  }
  get scale() {
    return this.object.scale
  }

  tag(...tags: string[]) {
    for (const t of tags) this.tags.add(t)
    return this
  }

  is(tag: string) {
    return this.tags.has(tag)
  }

  /** Attach behaviors. Returns the entity so you can chain: new Entity(m).with(spin(), bob()) */
  with(...behaviors: Behavior[]) {
    for (const b of behaviors) {
      this.behaviors.push(b)
      if (this.started && typeof b === 'object') b.start?.(this)
    }
    return this
  }

  at(x: number, y: number, z = 0) {
    this.object.position.set(x, y, z)
    return this
  }

  /** True if this entity is overlapping another (sphere check). */
  touches(other: Entity) {
    return other.alive && this.position.distanceTo(other.position) < this.radius + other.radius
  }

  /** Remove from the game. */
  destroy() {
    if (!this.alive) return
    this.alive = false
    for (const b of this.behaviors) if (typeof b === 'object') b.destroy?.(this)
    this.object.removeFromParent()
  }

  /** @internal */
  start() {
    this.started = true
    for (const b of this.behaviors) if (typeof b === 'object') b.start?.(this)
  }

  /** @internal */
  update(dt: number) {
    this.object.position.addScaledVector(this.velocity, dt)
    for (const b of this.behaviors) {
      if (!this.alive) return
      if (typeof b === 'function') b(this, dt)
      else b.update?.(this, dt)
    }
  }
}
