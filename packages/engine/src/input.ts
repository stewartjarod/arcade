import * as THREE from 'three'

/** Friendly names so games can say input.down('left') instead of key codes. */
const ACTIONS: Record<string, string[]> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['Space'],
  action: ['Enter', 'KeyE', 'KeyJ'],
  pause: ['Escape', 'KeyP'],
}

export class Input {
  /** Pointer position in -1..1 screen space (x right, y up). */
  readonly pointer = new THREE.Vector2()
  pointerDown = false

  private held = new Set<string>()
  private pressedThisFrame = new Set<string>()
  private releasedThisFrame = new Set<string>()
  private pointerPressed = false
  private pads: (Gamepad | null)[] = []

  constructor(private el: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return
      if (e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault()
      this.held.add(e.code)
      this.pressedThisFrame.add(e.code)
    })
    window.addEventListener('keyup', (e) => {
      this.held.delete(e.code)
      this.releasedThisFrame.add(e.code)
    })
    window.addEventListener('blur', () => this.held.clear())
    el.addEventListener('pointermove', (e) => this.setPointer(e))
    el.addEventListener('pointerdown', (e) => {
      this.setPointer(e)
      this.pointerDown = true
      this.pointerPressed = true
    })
    window.addEventListener('pointerup', () => (this.pointerDown = false))
  }

  private setPointer(e: PointerEvent) {
    const r = this.el.getBoundingClientRect()
    this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
  }

  private codes(name: string) {
    return ACTIONS[name] ?? [name]
  }

  /** Is the key/action held right now? e.g. down('left') or down('KeyQ') */
  down(name: string) {
    return this.codes(name).some((c) => this.held.has(c)) || this.padDown(name)
  }

  /** Was it pressed this exact frame? (use for jumping, shooting once) */
  pressed(name: string) {
    return this.codes(name).some((c) => this.pressedThisFrame.has(c)) || this.padPressed.has(name)
  }

  released(name: string) {
    return this.codes(name).some((c) => this.releasedThisFrame.has(c))
  }

  /** Clicked/tapped this frame. */
  get clicked() {
    return this.pointerPressed
  }

  /** -1..1 on each axis from arrows/WASD/gamepad stick. y is "up/forward". */
  axis() {
    const v = new THREE.Vector2(
      (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0),
      (this.down('up') ? 1 : 0) - (this.down('down') ? 1 : 0),
    )
    const pad = this.pads.find(Boolean)
    if (pad && Math.hypot(pad.axes[0], pad.axes[1]) > 0.2) v.set(pad.axes[0], -pad.axes[1])
    return v.lengthSq() > 1 ? v.normalize() : v
  }

  /** Add or change a named action, e.g. map('shoot', ['KeyX', 'KeyK']). */
  map(name: string, codes: string[]) {
    ACTIONS[name] = codes
  }

  // --- gamepad (buttons: 0=A → jump, 1=B → action, 9=start → pause) ---
  private padPressed = new Set<string>()
  private padPrev: Record<string, boolean> = {}
  private static PAD: Record<string, number> = { jump: 0, action: 1, pause: 9, up: 12, down: 13, left: 14, right: 15 }

  private padDown(name: string) {
    const i = Input.PAD[name]
    return i !== undefined && this.pads.some((p) => p?.buttons[i]?.pressed)
  }

  /** @internal */
  beginFrame() {
    this.pads = navigator.getGamepads?.() ?? []
    this.padPressed.clear()
    for (const name in Input.PAD) {
      const now = this.padDown(name)
      if (now && !this.padPrev[name]) this.padPressed.add(name)
      this.padPrev[name] = now
    }
  }

  /** @internal */
  endFrame() {
    this.pressedThisFrame.clear()
    this.releasedThisFrame.clear()
    this.pointerPressed = false
  }
}
