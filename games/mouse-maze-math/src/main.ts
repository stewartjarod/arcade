import { save } from './save'
import { createGame } from './game'
import { initUI } from './ui'
import { createWorld } from './world'

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
