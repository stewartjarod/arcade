import { THREE, ball, box, cone, cylinder, emojiSprite, group, material, pick, rand, torus, type Entity } from '@arcade/engine'
import { buddy } from '@arcade/assets'
import type { Hat, Scenery } from './lands'

// ------------------------------------------------------------------
//  Things to look at in Candy Quest. Each function makes a fresh 3D object.
//  They're all built from simple shapes, so they're easy to change.
// ------------------------------------------------------------------

/** Buddy in their chosen color, maybe wearing a hat. */
export function hero(color: string, hat: Hat | 'none'): Entity {
  const e = buddy({ color })
  // The hat goes on the inner body group, so it bounces along with every step
  if (hat !== 'none') e.object.children[0]!.add(hatModel(hat).translateY(1.32))
  return e
}

export function hatModel(hat: Hat): THREE.Object3D {
  if (hat === 'party') {
    const party = cone({ radius: 0.28, height: 0.6, color: '#9775fa' })
    party.position.y = 0.3
    const pom = ball({ radius: 0.09, color: '#ffd43b' })
    pom.position.y = 0.62
    return group(party, pom)
  }
  if (hat === 'top') {
    const brim = cylinder({ radius: 0.42, height: 0.05, color: '#212529' })
    const top = cylinder({ radius: 0.27, height: 0.45, color: '#212529' })
    top.position.y = 0.25
    const band = cylinder({ radius: 0.28, height: 0.08, color: '#e64980' })
    band.position.y = 0.08
    return group(brim, top, band)
  }
  // The crown: a gold ring with little points and a jewel on the front
  const ring = cylinder({ radius: 0.3, height: 0.16, color: '#fcc419', metal: true })
  ring.position.y = 0.08
  const points = [0, 1, 2, 3, 4].map((i) => {
    const p = cone({ radius: 0.07, height: 0.2, color: '#fcc419', metal: true })
    const a = (i / 5) * Math.PI * 2
    p.position.set(Math.sin(a) * 0.26, 0.26, Math.cos(a) * 0.26)
    return p
  })
  const jewel = ball({ radius: 0.06, color: '#e03131', glow: true })
  jewel.position.set(0, 0.08, 0.3)
  return group(ring, ...points, jewel)
}

/** A gumdrop: run into it and you go flying! */
export function gumdrop(color: string) {
  const drop = ball({ radius: 0.75, color })
  drop.scale.set(1, 0.8, 1)
  drop.position.y = 0.25
  // Sugar sparkles on top
  const sugar = [0, 1, 2, 3].map(() => ball({ radius: 0.06, color: '#fff' }).translateX(rand(-0.4, 0.4)).translateY(0.75).translateZ(rand(-0.4, 0.4)))
  return group(drop, ...sugar)
}

/** A sticky taffy puddle: it slows you down. Jump over it! */
export function taffy() {
  const goo = cylinder({ radius: 0.95, height: 0.1, color: '#d9480f' })
  goo.position.y = 0.05
  const blobs = [0, 1, 2].map(() => ball({ radius: rand(0.12, 0.2), color: '#ff922b' }).translateY(0.1).translateX(rand(-0.5, 0.5)).translateZ(rand(-0.5, 0.5)))
  return group(goo, ...blobs)
}

/** A wrapped candy to grab (it floats over gumdrops, so bouncing gets it). */
export function wrappedCandy(color: string) {
  const middle = ball({ radius: 0.28, color, glow: true })
  const left = cone({ radius: 0.2, height: 0.3, color })
  left.rotation.z = -Math.PI / 2
  left.position.x = -0.32
  const right = cone({ radius: 0.2, height: 0.3, color })
  right.rotation.z = Math.PI / 2
  right.position.x = 0.32
  const candy = group(middle, left, right)
  candy.scale.setScalar(0.7)
  return candy
}

/** A red-and-white striped post, like a candy cane. */
function candyCanePost(height: number) {
  const stripes = []
  for (let y = 0; y < height; y += 0.4) {
    const s = cylinder({ radius: 0.28, height: 0.4, color: Math.round(y / 0.4) % 2 ? '#fff' : '#e03131' })
    s.position.y = y + 0.2
    stripes.push(s)
  }
  const hook = torus({ radius: 0.4, tube: 0.14, color: '#e03131' })
  hook.position.set(0.4, height, 0)
  return group(...stripes, hook)
}

/** The candy gate across the path. Its jelly wall melts away when you spell the word. */
export function candyGate(color: string) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(7.4, 3, 0.4), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.75, roughness: 0.2 }))
  wall.position.y = 1.5
  const left = candyCanePost(3.4).translateX(-4)
  const right = candyCanePost(3.4).translateX(4)
  right.rotation.y = Math.PI
  const sign = emojiSprite('✏️')
  sign.scale.setScalar(1.6)
  sign.position.set(0, 3.9, 0)
  return { object: group(wall, left, right, sign), wall }
}

/** A big red X on the ground: the treasure is here! */
export function xMark() {
  const a = box({ size: [3, 0.06, 0.6], color: '#e03131' })
  const b = box({ size: [3, 0.06, 0.6], color: '#e03131' })
  a.rotation.y = Math.PI / 4
  b.rotation.y = -Math.PI / 4
  return group(a, b).translateY(0.04)
}

/** The treasure chest. The lid swings open on a hinge at the back. */
export function chest() {
  const base = box({ size: [2, 1, 1.3], color: '#a0522d' })
  base.position.y = 0.5
  const trim = box({ size: [2.05, 0.15, 1.35], color: '#fcc419', metal: true })
  trim.position.y = 0.95
  const lidBox = box({ size: [2, 0.4, 1.3], color: '#8b4513' })
  lidBox.position.set(0, 0.2, 0.65) // offset so the hinge sits at the back edge
  const lid = group(lidBox)
  lid.position.set(0, 1, -0.65)
  const lock = box({ size: [0.3, 0.35, 0.1], color: '#fcc419', metal: true })
  lock.position.set(0, 0.85, 0.68)
  const glow = new THREE.PointLight('#ffd43b', 0, 8)
  glow.position.y = 1.4
  return { object: group(base, trim, lid, lock, glow), lid, glow }
}

/** A landmark from the map, standing beside the path (a giant emoji). */
export function landmark(emoji: string) {
  const s = emojiSprite(emoji)
  s.scale.setScalar(4)
  s.position.y = 2.6
  const stand = cylinder({ radius: 1.2, height: 0.3, color: '#fff' })
  return group(s, stand)
}

/** One bit of scenery for beside the path, in the style of the land. */
export function scenery(kind: Scenery, candy: string[]): THREE.Object3D {
  const c = () => pick(candy)!
  if (kind === 'clouds') {
    // Cotton candy on a stick
    const stick = cylinder({ radius: 0.08, height: 2, color: '#fff' })
    stick.position.y = 1
    const puffs = [0, 1, 2].map(() => ball({ radius: rand(0.8, 1.2), color: c() }).translateY(rand(2.2, 2.8)).translateX(rand(-0.5, 0.5)))
    return group(stick, ...puffs)
  }
  if (kind === 'chocolate') {
    // Chocolate bar blocks and wafer stacks
    if (Math.random() < 0.5) return box({ size: [1.4, rand(1, 2.5), 1.4], color: '#6f4e37' }).translateY(0.8)
    const stack = [0, 1, 2].map((i) => box({ size: [1.6, 0.3, 1], color: i % 2 ? '#fff4e6' : '#e8a87c' }).translateY(0.15 + i * 0.3))
    return group(...stack)
  }
  if (kind === 'gumdrops') {
    // Gumdrop mountains: tall colorful cones
    const h = rand(3, 6)
    const m = cone({ radius: h * 0.5, height: h, color: c(), flat: true })
    m.position.y = h / 2
    return m
  }
  if (kind === 'lollipops') {
    const h = rand(2.5, 4)
    const stick = cylinder({ radius: 0.1, height: h, color: '#fff' })
    stick.position.y = h / 2
    const swirl = cylinder({ radius: rand(0.8, 1.2), height: 0.25, color: c() })
    swirl.rotation.x = Math.PI / 2
    swirl.position.y = h
    const ring = torus({ radius: 0.6, tube: 0.12, color: '#fff' })
    ring.position.set(0, h, 0.14)
    return group(stick, swirl, ring)
  }
  // Castle: frosted towers with pointy roofs
  const h = rand(3, 5)
  const tower = cylinder({ radius: 0.9, height: h, color: c() })
  tower.position.y = h / 2
  const roof = cone({ radius: 1.1, height: 1.6, color: '#e64980' })
  roof.position.y = h + 0.8
  return group(tower, roof)
}

/** A stretch of path. Chocolate River gets real chocolate rivers on both sides. */
export function pathPiece(length: number, color: string, kind: Scenery) {
  const road = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, length), material({ color }))
  road.position.y = -0.1
  road.receiveShadow = true
  if (kind !== 'chocolate') return road
  const river = (x: number) => box({ size: [5, 0.1, length], color: '#7b4a2a' }).translateX(x).translateY(-0.05)
  return group(road, river(-7), river(7))
}
