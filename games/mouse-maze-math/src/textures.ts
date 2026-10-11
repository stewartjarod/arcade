import * as THREE from 'three'
import type { Style } from './realms'

// Painted surfaces for the maze, drawn on tiny canvases so we don't need any image files.
//
// The colours here are near-white and light grey on purpose. Each realm multiplies its own colour into the
// texture (that's the instance colour), so the realm stays in charge of the hue and the texture only adds the
// bumps, seams and shine. Even the "dark" bits (grout, shadows) are mid-grey, not black, for the same reason.

export type SurfaceKind = 'floor' | 'wall' | 'door'
type Ctx = CanvasRenderingContext2D
type Painter = (ctx: Ctx, rng: () => number) => void

// Small on purpose: each texture is painted once per style and shared by every wall and floor in the maze.
export const TEXTURE_SIZE = 256
const S = TEXTURE_SIZE
const INSET = 12 // how far the door's frame sits in from the edge

// ---------- pure helpers (these run fine in node tests, no canvas needed) ----------

// A tiny seeded random number maker. Same seed gives the same numbers every time,
// so a style always looks the same from one visit to the next.
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const textureKey = (style: Style, kind: SurfaceKind) => `${style}:${kind}`

// Turns "style:kind" into a number, so every texture gets its own pattern that is still the same each time.
export const seedFor = (style: Style, kind: SurfaceKind) => {
  const text = textureKey(style, kind)
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

// Canvas wants CSS colour text. Level 0 is black and 1 is white. Clamped so a bad number can't break a paint.
export const grey = (level: number, alpha = 1) => {
  const v = Math.round(Math.min(1, Math.max(0, level)) * 255)
  return `rgba(${v},${v},${v},${alpha})`
}

// A shape that touches an edge also needs a copy on the far side, so the tile repeats with no seam.
// Returns the positions to draw at: the spot itself, plus a wrapped copy if it is close to an edge.
export const wrapCopies = (pos: number, reach: number, size = S) => {
  const spots = [pos]
  if (pos < reach) spots.push(pos + size)
  if (pos > size - reach) spots.push(pos - size)
  return spots
}

// ---------- drawing helpers ----------

// Draws at a spot, and again at any wrapped copies (see wrapCopies).
const spot = (x: number, y: number, reach: number, draw: (x: number, y: number) => void) => {
  for (const px of wrapCopies(x, reach)) for (const py of wrapCopies(y, reach)) draw(px, py)
}

const fill = (ctx: Ctx, color: string) => {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, S, S)
}

const paintRect = (ctx: Ctx, x: number, y: number, w: number, h: number, color: string) =>
  spot(x, y, Math.max(w, h), (px, py) => {
    ctx.fillStyle = color
    ctx.fillRect(px, py, w, h)
  })

const dot = (x: number, y: number, r: number, color: string, ctx: Ctx) =>
  spot(x, y, r, (px, py) => {
    ctx.beginPath()
    ctx.arc(px, py, r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  })

// A soft blob that fades out from the middle. Good for drifts, glows and light spots.
const softDot = (ctx: Ctx, x: number, y: number, r: number, inner: string, outer: string) =>
  spot(x, y, r, (px, py) => {
    const g = ctx.createRadialGradient(px, py, 0, px, py, r)
    g.addColorStop(0, inner)
    g.addColorStop(1, outer)
    ctx.fillStyle = g
    ctx.fillRect(px - r, py - r, r * 2, r * 2)
  })

const roundedPath = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

// A soft raised tile: a little shadow underneath, the face, and a shine along the top edge.
// This is the "soft toy" bevel: it makes flat shapes look like they are puffed up.
const pillow = (ctx: Ctx, x: number, y: number, w: number, h: number, r: number, face: string) => {
  if (w < 8 || h < 8) return // too thin to bother (happens at the ragged end of a row)
  spot(x, y, Math.max(w, h) + 4, (px, py) => {
    roundedPath(ctx, px, py + 3, w, h, r)
    ctx.fillStyle = grey(0.8)
    ctx.fill()
    roundedPath(ctx, px, py, w, h, r)
    ctx.fillStyle = face
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(px + r, py + 2)
    ctx.lineTo(px + w - r, py + 2)
    ctx.strokeStyle = grey(1, 0.7)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.stroke()
  })
}

// Rows of bricks (or blocks), every other row shifted by half a brick like real brickwork.
// Each brick is drawn once; pillow() adds the wrapped copies at the edges.
const eachCourseBrick = (rowH: number, brickW: number, draw: (x: number, y: number) => void) => {
  for (let y = 0; y < S; y += rowH) {
    const odd = (y / rowH) % 2 === 1
    for (let x = odd ? brickW / 2 : 0; x < S; x += brickW) draw(x, y)
  }
}

const rivet = (x: number, y: number, ctx: Ctx) => {
  dot(x, y, 3.6, grey(0.5), ctx)
  dot(x - 1, y - 1, 1.2, grey(1, 0.9), ctx)
}

// Four rivets, one near each corner of a panel.
const rivetCorners = (ctx: Ctx, x: number, y: number, w: number, inset: number) => {
  for (const [dx, dy] of [[inset, inset], [w - inset, inset], [inset, w - inset], [w - inset, w - inset]]) {
    rivet(x + dx!, y + dy!, ctx)
  }
}

// Paints a function as if the canvas were turned on its side. Used for sideways planks.
const sideways = (ctx: Ctx, draw: () => void) => {
  ctx.save()
  ctx.setTransform(0, 1, 1, 0, 0, 0)
  draw()
  ctx.restore()
}

// Shading that makes walls look like they have ambient occlusion: darker at the bottom, a gleam at the top.
const shadeBands = (ctx: Ctx) => {
  const low = ctx.createLinearGradient(0, S * 0.78, 0, S)
  low.addColorStop(0, 'rgba(0,0,0,0)')
  low.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = low
  ctx.fillRect(0, S * 0.78, S, S * 0.22)
  const high = ctx.createLinearGradient(0, 0, 0, S * 0.1)
  high.addColorStop(0, 'rgba(255,255,255,0.35)')
  high.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = high
  ctx.fillRect(0, 0, S, S * 0.1)
}

// ---------- floors: one maze cell (4 x 4 world units) per texture ----------

// Plain: a 4 x 4 grid of soft kitchen tiles.
const tileFloor: Painter = (ctx, rng) => {
  fill(ctx, grey(0.8)) // grout
  const t = S / 4
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      pillow(ctx, c * t + 3, r * t + 3, t - 6, t - 6, 10, grey(0.96 + rng() * 0.04))
    }
  }
}

// Hedge: short soft grass with little blades and speckles.
const grassFloor: Painter = (ctx, rng) => {
  fill(ctx, grey(0.96))
  for (let i = 0; i < 300; i++) dot(rng() * S, rng() * S, 1 + rng() * 1.6, grey(0.78 + rng() * 0.2), ctx)
  for (let i = 0; i < 140; i++) {
    const x = rng() * S
    const y = rng() * S
    const len = 5 + rng() * 7
    const lean = (rng() - 0.5) * 6
    const shade = grey(0.72 + rng() * 0.2, 0.9)
    spot(x, y, len, (px, py) => {
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + lean, py - len)
      ctx.strokeStyle = shade
      ctx.lineWidth = 1.6
      ctx.stroke()
    })
  }
}

// Stone: rows of irregular flagstones with dark grout between them.
const flagFloor: Painter = (ctx, rng) => {
  fill(ctx, grey(0.55))
  const rowH = S / 4
  for (let y = 0; y < S; y += rowH) {
    let x = 0
    while (x < S) {
      const left = S - x
      const w = left < 110 ? left : 60 + rng() * 60
      pillow(ctx, x + 3, y + 3, w - 6, rowH - 6, 8, grey(0.9 + rng() * 0.08))
      x += w
    }
  }
}

// Crystal (frozen and caves): a soft snowy floor with drifts and sparkles.
const snowFloor: Painter = (ctx, rng) => {
  fill(ctx, grey(0.97))
  for (let i = 0; i < 16; i++) {
    const x = rng() * S
    const y = rng() * S
    softDot(ctx, x, y, 30 + rng() * 40, grey(0.86, 0.5), grey(0.86, 0))
  }
  for (let i = 0; i < 16; i++) {
    const x = rng() * S
    const y = rng() * S
    softDot(ctx, x, y, 20 + rng() * 30, grey(1, 0.9), grey(1, 0))
  }
  for (let i = 0; i < 40; i++) dot(rng() * S, rng() * S, 1.8, grey(1), ctx)
}

// Brass: a floor of big riveted metal plates.
const plateFloor: Painter = (ctx) => {
  fill(ctx, grey(0.5))
  const h = S / 2
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const x = c * h + 4
      const y = r * h + 4
      pillow(ctx, x, y, h - 8, h - 8, 6, grey(0.92))
      rivetCorners(ctx, x, y, h - 8, 14)
    }
  }
}

// Neon: a dark-ish floor with glowing grid lines and bright junctions.
const gridFloor: Painter = (ctx) => {
  fill(ctx, grey(0.86))
  const step = S / 4
  for (let i = 0; i < 4; i++) {
    paintRect(ctx, i * step - 1.5, 0, 3, S, grey(1))
    paintRect(ctx, 0, i * step - 1.5, S, 3, grey(1))
  }
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) softDot(ctx, i * step, j * step, 14, grey(1, 0.9), grey(1, 0))
  }
}

// ---------- walls: 4.3 x 4 world units, painted once ----------

// Plain: red-brick style courses (here in white, so the realm colour makes them brick-coloured).
const brickWall: Painter = (ctx, rng) => {
  fill(ctx, grey(0.72)) // mortar
  eachCourseBrick(32, 64, (x, y) => pillow(ctx, x + 2, y + 2, 60, 28, 4, grey(0.95 + rng() * 0.05)))
}

// Hedge: a mass of little leaves, light and dark, so it reads as leafy.
const leafWall: Painter = (ctx, rng) => {
  fill(ctx, grey(0.72))
  for (let i = 0; i < 600; i++) {
    const x = rng() * S
    const y = rng() * S
    const rx = 5 + rng() * 5
    const ry = rx * 0.45
    const angle = rng() * Math.PI
    const shade = grey(0.8 + rng() * 0.2)
    spot(x, y, rx, (px, py) => {
      ctx.beginPath()
      ctx.ellipse(px, py, rx, ry, angle, 0, Math.PI * 2)
      ctx.fillStyle = shade
      ctx.fill()
    })
  }
}

// Stone: big chunky blocks with dark mortar and a little grit.
const blockWall: Painter = (ctx, rng) => {
  fill(ctx, grey(0.55))
  eachCourseBrick(64, 128, (x, y) => pillow(ctx, x + 3, y + 3, 122, 58, 5, grey(0.88 + rng() * 0.1)))
  for (let i = 0; i < 260; i++) dot(rng() * S, rng() * S, 1.2, grey(0.6, 0.35), ctx)
}

// Ice: frosted pale panels with cracks running through them.
const iceWall: Painter = (ctx, rng) => {
  fill(ctx, grey(0.96))
  const sheen = ctx.createLinearGradient(0, 0, S, S)
  sheen.addColorStop(0, grey(1, 0.8))
  sheen.addColorStop(0.5, grey(0.9, 0))
  sheen.addColorStop(1, grey(1, 0.6))
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 12; i++) crack(ctx, rng)
  for (let i = 0; i < 90; i++) dot(rng() * S, rng() * S, 0.8 + rng() * 1.8, grey(1), ctx)
}

// A random wiggly line. It is drawn 9 times (offset by a whole canvas) so it wraps at the edges.
const crack = (ctx: Ctx, rng: () => number) => {
  let x = rng() * S
  let y = rng() * S
  let angle = rng() * Math.PI * 2
  const points: number[][] = [[x, y]]
  for (let i = 0; i < 10; i++) {
    angle += (rng() - 0.5) * 1.2
    x += Math.cos(angle) * 9
    y += Math.sin(angle) * 9
    points.push([x, y])
  }
  ctx.strokeStyle = grey(0.66, 0.7)
  ctx.lineWidth = 1.3
  ctx.lineCap = 'round'
  for (const dx of [-S, 0, S]) {
    for (const dy of [-S, 0, S]) {
      ctx.beginPath()
      points.forEach(([px, py], k) => (k === 0 ? ctx.moveTo(px! + dx, py! + dy) : ctx.lineTo(px! + dx, py! + dy)))
      ctx.stroke()
    }
  }
}

// Brass: a 2 x 2 wall of riveted panels with a few scratches.
const panelWall: Painter = (ctx, rng) => {
  fill(ctx, grey(0.5))
  const h = S / 2
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const x = c * h + 3
      const y = r * h + 3
      pillow(ctx, x, y, h - 6, h - 6, 6, grey(0.93 + rng() * 0.05))
      rivetCorners(ctx, x, y, h - 6, 14)
    }
  }
  for (let i = 0; i < 6; i++) {
    const x = rng() * S
    const y = rng() * S
    paintRect(ctx, x, y, 14 + rng() * 20, 1, grey(1, 0.5))
  }
}

// Neon: a glowing circuit board. Traces join up dots on a grid; some junctions glow.
const circuitWall: Painter = (ctx, rng) => {
  fill(ctx, grey(0.78))
  const step = 32
  const trace = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = grey(1, 0.95)
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const x = 16 + i * step
      const y = 16 + j * step
      if (i < 7 && rng() < 0.55) trace(x, y, x + step, y)
      if (j < 7 && rng() < 0.55) trace(x, y, x, y + step)
    }
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const x = 16 + i * step
      const y = 16 + j * step
      if (rng() < 0.25) softDot(ctx, x, y, 14, grey(1, 0.6), grey(1, 0))
      dot(x, y, 4, grey(1), ctx)
    }
  }
}

// ---------- doors: 2.9 x 3.5 world units, a rounded arch with a frame ----------

// The arch shape: straight sides with a round top, inset from the edge.
const archPath = (ctx: Ctx) => {
  const r = (S - INSET * 2) / 2
  ctx.beginPath()
  ctx.moveTo(INSET, S - INSET)
  ctx.lineTo(INSET, INSET + r)
  ctx.arc(INSET + r, INSET + r, r, Math.PI, Math.PI * 2)
  ctx.lineTo(S - INSET, S - INSET)
  ctx.closePath()
}

// Frame first, then the door panel painted inside the arch, then a dark outline.
const doorFace = (panel: Painter): Painter => (ctx, rng) => {
  fill(ctx, grey(0.62))
  ctx.save()
  archPath(ctx)
  ctx.clip()
  panel(ctx, rng)
  ctx.restore()
  ctx.save()
  archPath(ctx)
  ctx.strokeStyle = grey(0.4)
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.restore()
}

const knob = (x: number, y: number, ctx: Ctx) => {
  dot(x, y, 8, grey(0.55), ctx)
  dot(x - 2.5, y - 2.5, 3, grey(1, 0.9), ctx)
}

// Planks: side by side, each a little different in shade, with a wavy grain line or two.
const planks = (count: number, base: number): Painter => (ctx, rng) => {
  const w = S / count
  for (let i = 0; i < count; i++) {
    const x = i * w
    ctx.fillStyle = grey(base - 0.03 + rng() * 0.06)
    ctx.fillRect(x, 0, w, S)
    ctx.fillStyle = grey(0.6)
    ctx.fillRect(x, 0, 2, S) // the crack between two planks
    for (let g = 0; g < 4; g++) {
      const gx = x + 4 + rng() * (w - 8)
      const phase = rng() * 6
      ctx.beginPath()
      for (let y = 0; y <= S; y += 16) {
        const wobble = gx + Math.sin(y * 0.04 + phase) * 2.5
        if (y === 0) ctx.moveTo(wobble, y)
        else ctx.lineTo(wobble, y)
      }
      ctx.strokeStyle = grey(0.82, 0.55)
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
}

// Iron or brass straps across the door, with rivets down them.
const strap = (x: number, ctx: Ctx) => {
  ctx.fillStyle = grey(0.6)
  ctx.fillRect(x, 0, 20, S)
  for (let y = 20; y < S; y += 40) rivet(x + 10, y, ctx)
}

const plainDoor = doorFace((ctx, rng) => {
  planks(5, 0.97)(ctx, rng)
  knob(200, 140, ctx)
})

const hedgeDoor = doorFace((ctx, rng) => {
  sideways(ctx, () => planks(6, 0.94)(ctx, rng))
  knob(200, 140, ctx)
})

const stoneDoor = doorFace((ctx, rng) => {
  planks(5, 0.82)(ctx, rng)
  for (const y of [60, 186]) {
    ctx.fillStyle = grey(0.42)
    ctx.fillRect(0, y, S, 14)
    for (let x = 30; x < S; x += 40) dot(x, y + 7, 2.5, grey(0.25), ctx)
  }
  knob(200, 130, ctx)
})

const crystalDoor = doorFace((ctx, rng) => {
  planks(5, 0.98)(ctx, rng)
  const sheen = ctx.createLinearGradient(0, 0, S, S)
  sheen.addColorStop(0, grey(1, 0.5))
  sheen.addColorStop(0.6, grey(0.9, 0))
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 50; i++) dot(rng() * S, rng() * S, 1.5, grey(1), ctx)
  knob(200, 140, ctx)
})

const brassDoor = doorFace((ctx, rng) => {
  planks(4, 0.9)(ctx, rng)
  strap(60, ctx)
  strap(176, ctx)
  knob(200, 140, ctx)
})

const neonDoor = doorFace((ctx) => {
  fill(ctx, grey(0.55))
  for (let x = 24; x < S; x += 36) paintRect(ctx, x, 0, 2, S, grey(1, 0.9))
  for (let y = 24; y < S; y += 36) paintRect(ctx, 0, y, S, 2, grey(1, 0.9))
  knob(200, 140, ctx)
})

// ---------- the lookup tables ----------

const FLOOR: Record<Style, Painter> = {
  plain: tileFloor,
  hedge: grassFloor,
  stone: flagFloor,
  crystal: snowFloor,
  brass: plateFloor,
  neon: gridFloor,
}

const WALL: Record<Style, Painter> = {
  plain: brickWall,
  hedge: leafWall,
  stone: blockWall,
  crystal: iceWall,
  brass: panelWall,
  neon: circuitWall,
}

const DOOR: Record<Style, Painter> = {
  plain: plainDoor,
  hedge: hedgeDoor,
  stone: stoneDoor,
  crystal: crystalDoor,
  brass: brassDoor,
  neon: neonDoor,
}

const PAINTERS: Record<SurfaceKind, Record<Style, Painter>> = { floor: FLOOR, wall: WALL, door: DOOR }

// ---------- the public bit: build once, then hand out the same texture ----------

const cache = new Map<string, THREE.CanvasTexture>()

// Turns RGBA pixels into plain grey of the same brightness (a little lighter, so the pattern does not dim the realm colour).
export const NEUTRAL_GAIN = 1.12
export const neutralizePixels = (data: Uint8ClampedArray | number[], gain: number) => {
  for (let i = 0; i < data.length; i += 4) {
    const grey = Math.min(255, (0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!) * gain)
    data[i] = data[i + 1] = data[i + 2] = grey
  }
}

// Paints the picture onto a new canvas. Only runs in the browser (it needs a document).
const paintCanvas = (style: Style, kind: SurfaceKind) => {
  const canvas = document.createElement('canvas')
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')!
  PAINTERS[kind][style](ctx, mulberry32(seedFor(style, kind)))
  if (kind === 'wall') shadeBands(ctx)
  // The realm colour is multiplied on top of the texture, so a brown wood or a blue ice texture would tint it a second
  // time (muddy doors, far-too-dark ice). Keep only the light-and-dark pattern. Neon floors and walls keep their glow lines.
  if (style !== 'neon' || kind === 'door') {
    const pixels = ctx.getImageData(0, 0, S, S)
    neutralizePixels(pixels.data, NEUTRAL_GAIN)
    ctx.putImageData(pixels, 0, 0)
  }
  return canvas
}

// The texture for a style and kind of surface. Calling it again gives back the SAME object,
// so the GPU only ever gets one copy.
export const surfaceTexture = (style: Style, kind: SurfaceKind): THREE.CanvasTexture => {
  const key = textureKey(style, kind)
  const found = cache.get(key)
  if (found) return found
  const tex = new THREE.CanvasTexture(paintCanvas(style, kind))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.generateMipmaps = true // smaller copies for far-away surfaces, so they shimmer less
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = 4 // sharper when the floor is seen at a slant
  cache.set(key, tex)
  return tex
}

// Frees every cached texture. The next surfaceTexture() call paints them again.
export const disposeTextures = () => {
  cache.forEach((tex) => tex.dispose())
  cache.clear()
}
