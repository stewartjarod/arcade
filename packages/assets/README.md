# Shared assets

Anything here can be used by every game.

- `src/prefabs.ts` — ready-made things (buddy, coin, tree, cloud, spiky, platform...). Add more!
- `models/` — `.glb` files. Great free ones: https://kenney.nl/assets and https://poly.pizza
- `sounds/` — `.mp3`/`.ogg` files. Free: https://kenney.nl/assets?q=audio
- `textures/` — images.

Import a file's URL, then load it:

```ts
import dragonUrl from '@arcade/assets/models/dragon.glb?url'
import roarUrl from '@arcade/assets/sounds/roar.mp3?url'
import { loadModel } from '@arcade/engine'

const dragon = await loadModel(dragonUrl)
await game.sound.load('roar', roarUrl)
```

Only the files a game actually imports end up in that game's build.
Files for just one game can go in that game's own `public/` or `src/` folder instead.
