import { Entity, THREE, ball, box, cone, cylinder, capsule, star, group, spin, bob, pick, rand, COLORS } from '@arcade/engine'

/**
 * Things that show up in lots of games. Each function makes a fresh Entity.
 * Tweak colors/sizes with options, or copy one into your game and change it.
 */

/** A little round buddy with eyes. */
export function buddy({ color = '#4dabf7' as THREE.ColorRepresentation } = {}) {
  const body = capsule({ color, radius: 0.45, height: 0.5 })
  const eyeWhite = (x: number) => ball({ color: 'white', radius: 0.14 }).translateX(x).translateY(0.3).translateZ(0.36)
  const pupil = (x: number) => ball({ color: '#222', radius: 0.07 }).translateX(x).translateY(0.3).translateZ(0.48)
  const g = group(body, eyeWhite(-0.16), eyeWhite(0.16), pupil(-0.16), pupil(0.16))
  g.children.forEach((c) => c.translateY(0.7))
  const wrapper = group(g)
  const e = new Entity(wrapper, 'player')
  e.radius = 0.5
  return e
}

/** Spinning gold coin. */
export function coin() {
  const m = cylinder({ color: '#ffc800', radius: 0.4, height: 0.1, glow: true })
  m.rotation.x = Math.PI / 2
  const e = new Entity(group(m), 'coin').with(spin(3), bob(0.2))
  e.radius = 0.5
  return e
}

/** Glowing star (power-up / goal). */
export function starPickup({ color = '#ffd43b' as THREE.ColorRepresentation } = {}) {
  const e = new Entity(group(star({ color, glow: true, radius: 0.6 })), 'star').with(spin(2), bob(0.3))
  e.radius = 0.6
  return e
}

/** Low-poly tree. */
export function tree({ height = rand(1.5, 3) } = {}) {
  const trunk = cylinder({ color: '#8d5524', radius: 0.15, height: height * 0.4 })
  trunk.position.y = height * 0.2
  const leaves = cone({ color: pick(['#2f9e44', '#37b24d', '#40c057']), radius: height * 0.35, height: height * 0.8, flat: true })
  leaves.position.y = height * 0.75
  return new Entity(group(trunk, leaves), 'tree')
}

/** Fluffy cloud that drifts. */
export function cloud() {
  const puff = (x: number, y: number, r: number) => ball({ color: 'white', radius: r }).translateX(x).translateY(y)
  const g = group(puff(0, 0, 1), puff(1, -0.2, 0.8), puff(-1, -0.2, 0.7), puff(0.4, 0.5, 0.7))
  g.traverse((o) => (o.castShadow = false))
  const speed = rand(0.3, 0.8)
  return new Entity(g, 'cloud').with((e, dt) => {
    e.position.x += speed * dt
    if (e.position.x > 40) e.position.x = -40
  })
}

/** Spiky enemy blob. */
export function spiky({ color = '#e03131' as THREE.ColorRepresentation } = {}) {
  const body = ball({ color, radius: 0.5, flat: true })
  const spikes = Array.from({ length: 8 }, (_, i) => {
    const s = cone({ color: '#ffe3e3', radius: 0.12, height: 0.35 })
    const a = (i / 8) * Math.PI * 2
    s.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5)
    s.rotation.set(0, 0, 0)
    s.lookAt(s.position.clone().multiplyScalar(2))
    s.rotateX(Math.PI / 2)
    return s
  })
  const g = group(body, ...spikes)
  g.position.y = 0.5
  const e = new Entity(group(g), 'enemy')
  e.radius = 0.55
  return e
}

/** A colorful block to stand on (tagged 'solid' so gravity() lands on it). */
export function platform({ size = [3, 0.5, 3] as [number, number, number], color = pick(COLORS) as THREE.ColorRepresentation } = {}) {
  return new Entity(box({ size, color }), 'solid')
}
