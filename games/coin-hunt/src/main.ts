import {
  Game, THREE, ground, moveWithKeys, cameraFollow, collect, chase, onTouch,
  stayInside, burst, rand, storage,
} from '@arcade/engine'
import { buddy, coin, tree, cloud, spiky, starPickup } from '@arcade/assets'
import { mathChallenge } from '@arcade/learning'

// ------------------------------------------------------------------
//  Coin Hunt
//  Arrow keys / WASD to move. Grab every coin. Don't touch the spikies!
//  Bonus stars ask a math question at your level — get it right to save time.
// ------------------------------------------------------------------

const game = new Game({ background: '#87ceeb' })
const save = storage('coin-hunt')

const COINS = 10
const WORLD = 18 // how far from the middle the world goes

function level(game: Game) {
  game.state.score = 0
  game.hud.set('score', `🪙 0 / ${COINS}`)
  game.hud.set('best', `🏆 ${save.get('best', 0)}`, 'top')

  // The world
  game.add(ground({ size: WORLD * 2 + 20 }))
  for (let i = 0; i < 25; i++) game.add(tree()).at(rand(-WORLD, WORLD), 0, rand(-WORLD, WORLD))
  for (let i = 0; i < 6; i++) game.add(cloud()).at(rand(-30, 30), rand(8, 12), rand(-20, 10))

  // The player
  const player = game.add(buddy({ color: '#4dabf7' })).with(
    moveWithKeys(7),
    stayInside(new THREE.Vector3(-WORLD, 0, -WORLD), new THREE.Vector3(WORLD, 0, WORLD)),
    cameraFollow(new THREE.Vector3(0, 9, 11)),
  )

  // Coins to collect
  for (let i = 0; i < COINS; i++) {
    game.add(coin()).at(rand(-WORLD, WORLD), 0.8, rand(-WORLD, WORLD)).with(
      collect('player', (c) => {
        game.state.score++
        game.sound.play('coin', { pitch: 1 + game.state.score * 0.05 })
        burst(game, c.position)
        game.hud.set('score', `🪙 ${game.state.score} / ${COINS}`)
        if (game.state.score === COINS) win()
      }),
    )
  }

  // Bonus stars: a math question at the player's level (it levels up their profile in every game)
  const spawnStar = () =>
    game.add(starPickup()).at(rand(-WORLD, WORLD), 1, rand(-WORLD, WORLD)).with(
      collect('player', async () => {
        game.paused = true
        const { solved } = await mathChallenge({ title: '⭐ Bonus star! Solve it for −10 seconds' })
        game.paused = false
        if (solved) {
          game.time = Math.max(0, game.time - 10)
          game.hud.message('−10 seconds! ⏱️', { seconds: 1.2 })
        }
      }),
    )
  spawnStar()
  game.every(20, spawnStar)

  // A new spiky shows up every 5 seconds and chases you
  const spawnSpiky = () => game.add(spiky()).at(rand(-WORLD, WORLD), 0, -WORLD).with(chase('player', 2.5))
  spawnSpiky()
  game.every(5, spawnSpiky)

  player.with(onTouch('enemy', () => lose()))

  function win() {
    const seconds = Math.round(game.time)
    const score = Math.max(1, 120 - seconds)
    const record = save.highScore(score)
    game.sound.play('win')
    game.paused = true
    game.hud.message('You win! 🎉', {
      subtitle: `${seconds} seconds — score ${score}${record ? ' — NEW RECORD!' : ''}`,
      button: 'Play again',
      onClick: () => ((game.paused = false), game.restart()),
    })
  }

  function lose() {
    game.sound.play('lose')
    burst(game, player.position, { color: ['#4dabf7', '#fff'], count: 30 })
    player.destroy()
    game.after(0.8, () => {
      game.paused = true
      game.hud.message('Ouch!', {
        button: 'Try again',
        onClick: () => ((game.paused = false), game.restart()),
      })
    })
  }
}

game.start(level)
