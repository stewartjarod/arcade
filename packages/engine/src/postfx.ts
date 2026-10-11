import { HalfFloatType, NoToneMapping } from 'three'
import type { Camera, Scene, WebGLRenderer } from 'three'
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  VignetteEffect,
} from 'postprocessing'

// Post-processing: the "glow and colour" pass that runs after the scene is drawn.
// It lives in its own file, and is NOT re-exported from the engine index, so only
// the games that import it (by path) pay for the `postprocessing` library.

export interface PostFxOptions {
  multisampling: number // 0 = off, 4 = smooth edges (MSAA)
  bloom: boolean // start with the glow on or off
}

export interface PostFx {
  render(dt: number): void
  setSize(width: number, height: number): void // CSS pixels, like renderer.setSize
  setBloom(on: boolean): void
  dispose(): void
}

export function createPostFx(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  opts: PostFxOptions,
): PostFx {
  // No tone mapping on purpose: it dulls (or crushes) the bright, saturated colours kids' games are made of.
  // Colours above 1.0 simply clip, which is what makes them glow with the bloom. Remember the old setting for dispose().
  const oldToneMapping = renderer.toneMapping
  renderer.toneMapping = NoToneMapping

  // Half-float buffers keep bright glows from clipping before the bloom step.
  const composer = new EffectComposer(renderer, {
    multisampling: opts.multisampling,
    frameBufferType: HalfFloatType,
  })

  composer.addPass(new RenderPass(scene, camera))

  // Only colours pushed above 1.0 glow, so white walls, snow and sign borders stay crisp.
  // Half resolution keeps the blur cheap on tablets.
  const bloom = new BloomEffect({
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    intensity: 0.6,
    radius: 0.35,
    resolutionScale: 0.5,
  })
  bloom.blendMode.opacity.value = opts.bloom ? 1 : 0

  // A soft edge darkening that pulls the eye to the middle of the screen.
  const vignette = new VignetteEffect({ offset: 0.35, darkness: 0.3 })

  // One effect pass for both effects, so they cost one full-screen draw.
  composer.addPass(new EffectPass(camera, bloom, vignette))

  function setSize(width: number, height: number) {
    // Also resizes the renderer's canvas, so the game does not need to call renderer.setSize.
    // `false` = leave the canvas CSS alone (the page stylesheet sizes it); otherwise stale pixel sizes stick after the glow pass is dropped.
    composer.setSize(width, height, false)
  }

  function setBloom(on: boolean) {
    bloom.blendMode.opacity.value = on ? 1 : 0
  }

  function render(dt: number) {
    composer.render(dt)
  }

  function dispose() {
    composer.dispose()
    renderer.toneMapping = oldToneMapping
  }

  return { render, setSize, setBloom, dispose }
}
