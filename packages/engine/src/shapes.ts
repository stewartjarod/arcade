import * as THREE from 'three'

/**
 * Quick colorful shapes so you can build a game before you have any models.
 *   box({ color: 'tomato', size: [2, 1, 2] })
 */
type Size3 = number | [number, number, number]
interface ShapeOpts {
  color?: THREE.ColorRepresentation
  /** Shiny metal look */
  metal?: boolean
  /** Glows by itself */
  glow?: boolean
  flat?: boolean
}

export function material({ color = '#ff6b6b', metal, glow, flat }: ShapeOpts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: metal ? 0.8 : 0,
    roughness: metal ? 0.25 : 0.7,
    emissive: glow ? color : '#000000',
    emissiveIntensity: glow ? 0.8 : 0,
    flatShading: !!flat,
  })
}

function mesh(geo: THREE.BufferGeometry, opts: ShapeOpts) {
  const m = new THREE.Mesh(geo, material(opts))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

const s3 = (s: Size3): [number, number, number] => (typeof s === 'number' ? [s, s, s] : s)

export const box = (o: ShapeOpts & { size?: Size3 } = {}) => mesh(new THREE.BoxGeometry(...s3(o.size ?? 1)), o)
export const ball = (o: ShapeOpts & { radius?: number } = {}) =>
  mesh(new THREE.SphereGeometry(o.radius ?? 0.5, 32, 16), o)
export const cylinder = (o: ShapeOpts & { radius?: number; height?: number } = {}) =>
  mesh(new THREE.CylinderGeometry(o.radius ?? 0.5, o.radius ?? 0.5, o.height ?? 1, 24), o)
export const cone = (o: ShapeOpts & { radius?: number; height?: number } = {}) =>
  mesh(new THREE.ConeGeometry(o.radius ?? 0.5, o.height ?? 1, 24), o)
export const capsule = (o: ShapeOpts & { radius?: number; height?: number } = {}) =>
  mesh(new THREE.CapsuleGeometry(o.radius ?? 0.4, o.height ?? 0.8, 8, 16), o)
export const torus = (o: ShapeOpts & { radius?: number; tube?: number } = {}) =>
  mesh(new THREE.TorusGeometry(o.radius ?? 0.5, o.tube ?? 0.15, 16, 32), o)
export const star = (o: ShapeOpts & { radius?: number } = {}) => {
  const r = o.radius ?? 0.5
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const rr = i % 2 ? r * 0.45 : r
    i ? shape.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : shape.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: r * 0.3, bevelEnabled: true, bevelSize: r * 0.08, bevelThickness: r * 0.08 })
  geo.center()
  return mesh(geo, o)
}

/** A big flat floor. */
export function ground({ size = 100, color = '#7ec850' }: { size?: number; color?: THREE.ColorRepresentation } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material({ color }))
  m.rotation.x = -Math.PI / 2
  m.receiveShadow = true
  return m
}

/** Group several shapes into one object: group(body, head.translateY(1)) */
export function group(...children: THREE.Object3D[]) {
  const g = new THREE.Group()
  g.add(...children)
  return g
}
