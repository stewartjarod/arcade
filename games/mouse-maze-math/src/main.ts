import { keepFullscreen, setMuted } from '@arcade/engine'
import { save } from './save'
import { createGame } from './game'
import { initUI } from './ui'
import { createWorld } from './world'

setMuted(save.muted)
keepFullscreen() // kid mode: back to full screen on the first tap
const world = createWorld(document.getElementById('c') as HTMLCanvasElement)
world.setSkin(save.color, save.hat)
const game = createGame(world)

initUI({
  play: () => void game.play(),
  menu: game.menu,
  realm: game.menu,
  skin: () => world.setSkin(save.color, save.hat),
})
game.menu()

// Developer helpers for screenshots and performance numbers (never in the shipped build).
if (import.meta.env.DEV) {
  void import('./debug').then((m) => m.installDebug(world))
}
