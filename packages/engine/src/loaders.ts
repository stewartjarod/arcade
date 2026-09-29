import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js'

/**
 * Load models/textures once, reuse everywhere.
 *   const tree = await loadModel(treeUrl)   // each call returns a fresh copy
 */
const gltf = new GLTFLoader()
const textures = new THREE.TextureLoader()
const cache = new Map<string, Promise<any>>()

function once<T>(url: string, load: () => Promise<T>): Promise<T> {
  if (!cache.has(url)) cache.set(url, load())
  return cache.get(url)!
}

export async function loadModel(url: string) {
  const data = await once(url, () => gltf.loadAsync(url))
  const model = cloneSkinned(data.scene)
  model.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true
  })
  model.userData.animations = data.animations
  return model
}

export async function loadTexture(url: string, { pixelated = false, repeat = 1 } = {}) {
  const tex = await once(url, () => textures.loadAsync(url))
  const t = tex.clone()
  t.colorSpace = THREE.SRGBColorSpace
  if (pixelated) t.magFilter = THREE.NearestFilter
  if (repeat !== 1) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat, repeat)
  }
  return t
}
