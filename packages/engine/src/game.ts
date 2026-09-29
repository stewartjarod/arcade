import * as THREE from 'three'
import { Entity } from './entity'
import { Input } from './input'
import { Sound } from './sound'
import { Hud } from './hud'
import { Tweens } from './tween'
import { currentPlayer, type Player } from '@arcade/players'

export interface GameOptions {
  /** Element to put the game in. Defaults to document.body. */
  parent?: HTMLElement
  background?: THREE.ColorRepresentation
  /** 'perspective' (3D) or 'ortho' (flat 2D-style view). */
  camera?: 'perspective' | 'ortho'
  /** How many world units fit vertically on screen in ortho mode. */
  orthoSize?: number
  /** Adds a sky light + sun with shadows. On by default. */
  lights?: boolean
  shadows?: boolean
}

/** A level/screen. Called with a fresh, empty world each time it starts. */
export type SceneFn = (game: Game) => void | (() => void)

/**
 * The Game owns everything: renderer, camera, the loop, input, sound and HUD.
 * Make one per game, add entities to it, and call start().
 */
export class Game {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
  readonly input: Input
  readonly sound = new Sound()
  readonly hud: Hud
  readonly tweens = new Tweens()
  readonly timer = new THREE.Timer()

  /** Seconds since the current scene started. */
  time = 0
  paused = false
  /** Free-form shared state for your game (score, lives, level...). */
  state: Record<string, any> = {}
  /** Who's playing (picked on the arcade homepage). */
  readonly player: Player = currentPlayer()

  private entities: Entity[] = []
  private toAdd: Entity[] = []
  private everyFrame: Array<(dt: number) => void> = []
  private currentScene?: SceneFn
  private sceneCleanup?: () => void
  private readonly opts: GameOptions
  private readonly orthoSize: number

  constructor(opts: GameOptions = {}) {
    this.opts = { lights: true, shadows: true, camera: 'perspective', ...opts }
    const parent = opts.parent ?? document.body
    this.orthoSize = opts.orthoSize ?? 20

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = !!this.opts.shadows
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.style.touchAction = 'none'
    parent.appendChild(this.renderer.domElement)

    this.camera = this.opts.camera === 'ortho'
      ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
      : new THREE.PerspectiveCamera(60, 1, 0.1, 1000)
    this.camera.position.set(0, 8, 14)
    this.camera.lookAt(0, 0, 0)

    this.input = new Input(this.renderer.domElement)
    this.hud = new Hud(parent)

    // The page's "🏠 Arcade" link also shows who's playing.
    const home = document.getElementById('home')
    if (home) home.textContent = `🏠 Arcade · ${this.player.avatar} ${this.player.name}`

    window.addEventListener('resize', () => this.resize())
    this.resize()
  }

  private resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    const aspect = w / h
    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = aspect
    } else {
      const s = this.orthoSize / 2
      Object.assign(this.camera, { left: -s * aspect, right: s * aspect, top: s, bottom: -s })
    }
    this.camera.updateProjectionMatrix()
  }

  private resetWorld() {
    this.sceneCleanup?.()
    for (const e of this.entities) e.destroy()
    this.entities = []
    this.toAdd = []
    this.everyFrame = []
    this.tweens.clear()
    this.scene.clear()
    this.hud.clear()
    this.time = 0
    this.scene.background = new THREE.Color(this.opts.background ?? '#87ceeb')
    if (this.opts.lights) this.addDefaultLights()
  }

  private addDefaultLights() {
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#667788', 1.5))
    const sun = new THREE.DirectionalLight('#ffffff', 2)
    sun.position.set(10, 20, 10)
    sun.castShadow = !!this.opts.shadows
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 })
    this.scene.add(sun)
  }

  /** Clear the world and run a scene function (a level, a title screen...). */
  setScene(scene: SceneFn) {
    this.currentScene = scene
    this.resetWorld()
    const cleanup = scene(this)
    if (typeof cleanup === 'function') this.sceneCleanup = cleanup
  }

  /** Start the current scene over (handy for "game over → try again"). */
  restart() {
    if (this.currentScene) this.setScene(this.currentScene)
  }

  /** Start the loop, optionally with a first scene. */
  start(scene?: SceneFn) {
    if (scene) this.setScene(scene)
    else this.resetWorld()
    this.timer.connect(document) // pauses cleanly when the tab is hidden
    this.renderer.setAnimationLoop((t) => this.tick(t))
    return this
  }

  /** Add an entity (or a plain three.js object, which gets wrapped). */
  add<T extends Entity>(thing: T): T
  add(thing: THREE.Object3D): Entity
  add(thing: Entity | THREE.Object3D): Entity {
    const entity = thing instanceof Entity ? thing : new Entity(thing)
    entity.game = this
    this.toAdd.push(entity)
    this.scene.add(entity.object)
    return entity
  }

  /** Run a function every frame (without making an entity). */
  onUpdate(fn: (dt: number) => void) {
    this.everyFrame.push(fn)
  }

  /** Run a function once after `seconds`. Cancelled if the scene changes. */
  after(seconds: number, fn: () => void) {
    let t = 0
    const tick = (dt: number) => {
      t += dt
      if (t >= seconds) {
        this.everyFrame.splice(this.everyFrame.indexOf(tick), 1)
        fn()
      }
    }
    this.everyFrame.push(tick)
  }

  /** Run a function every `seconds`. */
  every(seconds: number, fn: () => void) {
    let t = 0
    this.everyFrame.push((dt) => {
      t += dt
      while (t >= seconds) {
        t -= seconds
        fn()
      }
    })
  }

  /** All live entities that have this tag. */
  find(tag: string): Entity[] {
    return this.entities.filter((e) => e.alive && e.tags.has(tag))
  }

  findOne(tag: string): Entity | undefined {
    return this.entities.find((e) => e.alive && e.tags.has(tag))
  }

  private tick(timestamp: number) {
    this.timer.update(timestamp)
    // Cap dt so a slow frame doesn't make things teleport.
    const dt = Math.min(this.timer.getDelta(), 1 / 20)
    this.input.beginFrame()

    if (!this.paused) {
      this.time += dt
      if (this.toAdd.length) {
        const fresh = this.toAdd
        this.toAdd = []
        this.entities.push(...fresh)
        for (const e of fresh) e.start()
      }
      for (const e of this.entities) if (e.alive) e.update(dt)
      for (const fn of [...this.everyFrame]) fn(dt)
      this.tweens.update(dt)
      this.entities = this.entities.filter((e) => e.alive)
    }

    this.renderer.render(this.scene, this.camera)
    this.input.endFrame()
  }
}
