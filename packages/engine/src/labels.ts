import * as THREE from 'three'

/**
 * Words and emoji inside the 3D world.
 *
 *   const s = emojiSprite('💥')                 // a flat emoji that always faces the camera
 *   const sign = answerSign('#e4572e')           // a speech-bubble sign for showing answers
 *   sign.draw('12')  → later  sign.draw('12', 'good')   // turns green with a ✓
 */

/** An emoji drawn onto a sprite (always faces the camera). Scale it to taste. */
export function emojiSprite(emoji: string) {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const cx = cv.getContext('2d')!
  cx.font = '96px serif'
  cx.textAlign = 'center'
  cx.textBaseline = 'middle'
  cx.fillText(emoji, 64, 72)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
}

/** Size of an answerSign in world units (before you scale it). */
export const SIGN_SIZE = { width: 2.5, height: 1.55 } as const

export interface AnswerSign {
  mesh: THREE.Mesh
  /** Redraw the sign. Mark it 'good' (green ✓) or 'bad' (red ✗) after an answer. */
  draw(label: string, mark?: 'good' | 'bad' | null): void
}

/**
 * A chunky speech-bubble sign with big readable text — for showing answer choices in 3D.
 * Drawn on top of everything so it never hides behind walls.
 */
export function answerSign(color: THREE.ColorRepresentation): AnswerSign {
  const cv = document.createElement('canvas')
  cv.width = 512
  cv.height = 320
  const cx = cv.getContext('2d')!
  cx.scale(2, 2)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(SIGN_SIZE.width, SIGN_SIZE.height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, fog: false, depthTest: false }),
  )
  mesh.renderOrder = 10
  const hex = `#${new THREE.Color(color).getHexString()}`
  const draw = (label: string, mark: 'good' | 'bad' | null = null) => {
    cx.clearRect(0, 0, 256, 160)
    const fill = mark === 'good' ? '#22c55e' : mark === 'bad' ? '#ef4444' : hex
    cx.fillStyle = 'rgba(0,0,0,.28)'
    cx.beginPath()
    cx.roundRect(14, 20, 228, 118, 34)
    cx.fill()
    cx.fillStyle = '#ffffff'
    cx.beginPath()
    cx.roundRect(8, 8, 240, 124, 36)
    cx.moveTo(110, 130)
    cx.lineTo(128, 154)
    cx.lineTo(146, 130)
    cx.fill()
    cx.fillStyle = fill
    cx.beginPath()
    cx.roundRect(18, 18, 220, 104, 28)
    cx.moveTo(116, 120)
    cx.lineTo(128, 138)
    cx.lineTo(140, 120)
    cx.fill()
    cx.fillStyle = 'rgba(255,255,255,.22)'
    cx.beginPath()
    cx.roundRect(28, 24, 200, 36, 18)
    cx.fill()
    const text = mark === 'good' ? `✓ ${label}` : mark === 'bad' ? `✗ ${label}` : label
    let size = 96
    do cx.font = `700 ${(size -= 4)}px Fredoka, ui-rounded, system-ui, sans-serif`
    while (cx.measureText(text).width > 190 && size > 30)
    cx.textAlign = 'center'
    cx.textBaseline = 'middle'
    cx.lineJoin = 'round'
    cx.lineWidth = 12
    cx.strokeStyle = 'rgba(30,20,60,.55)'
    cx.strokeText(text, 128, 74)
    cx.fillStyle = '#ffffff'
    cx.fillText(text, 128, 74)
    tex.needsUpdate = true
  }
  return { mesh, draw }
}
