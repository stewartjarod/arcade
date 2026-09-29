// Makes the voice clips: `pnpm voices` (add --force to redo them all, e.g. after changing the voice).
// Finds every line the games say out loud, and records the ones we don't have yet with Kokoro
// (a free voice that runs on this computer), saving small mp3 files in packages/learning/audio/.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'

const root = new URL('..', import.meta.url).pathname
const outDir = join(root, 'packages/learning/audio')
const cacheDir = join(root, '.voices') // Python + voice model (~350 MB) live here; git ignores it
const VOICE = process.env.VOICE ?? 'af_bella'
const SPEED = process.env.SPEED ?? '0.9' // a little slow is kind to new readers
const force = process.argv.includes('--force')

// Kokoro lives in a python venv so it doesn't touch the rest of the machine.
const py = join(cacheDir, 'venv/bin/python')
if (!existsSync(py)) {
  console.log('Setting up Kokoro (one time)…')
  mkdirSync(cacheDir, { recursive: true })
  execFileSync('python3', ['-m', 'venv', join(cacheDir, 'venv')], { stdio: 'inherit' })
  execFileSync(py, ['-m', 'pip', 'install', '-q', 'kokoro-onnx', 'soundfile'], { stdio: 'inherit' })
}
const base = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0'
for (const file of ['kokoro-v1.0.onnx', 'voices-v1.0.bin']) {
  if (!existsSync(join(cacheDir, file))) {
    console.log(`Downloading ${file}…`)
    execFileSync('curl', ['-fL', '-o', join(cacheDir, file), `${base}/${file}`], { stdio: 'inherit' })
  }
}

// Load the game code through Vite so we can read the TypeScript lists directly.
const vite = await createServer({ root, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const learning = await vite.ssrLoadModule('/packages/learning/src/index.ts')
const lines = new Set(learning.learningLines())
for (const game of readdirSync(join(root, 'games'))) {
  const file = join(root, 'games', game, 'src/lines.ts')
  if (existsSync(file)) {
    const mod = await vite.ssrLoadModule(file)
    for (const line of mod.LINES) learning.sentences(line).forEach((s) => lines.add(s))
  }
}
await vite.close()

mkdirSync(outDir, { recursive: true })
const wanted = new Map([...lines].map((text) => [learning.clipName(text), text]))
const todo = [...wanted].filter(([name]) => force || !existsSync(join(outDir, name)))

if (todo.length) {
  console.log(`Recording ${todo.length} lines…`)
  const tmp = mkdtempSync(join(tmpdir(), 'voices-'))
  const jobs = Object.fromEntries(todo.map(([name, text]) => [join(tmp, name + '.wav'), text]))
  execFileSync(py, [join(root, 'scripts/voices.py'), cacheDir, VOICE, SPEED], {
    input: JSON.stringify(jobs),
    stdio: ['pipe', 'inherit', 'inherit'],
    env: { ...process.env, PYTHONWARNINGS: 'ignore' },
  })
  for (const [name] of todo) {
    // Small mono mp3 — words are only a few KB.
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(tmp, name + '.wav'), '-ac', '1', '-ar', '24000', '-b:a', '48k', join(outDir, name)])
  }
  rmSync(tmp, { recursive: true })
}

// Clips for lines that no longer exist just waste space.
const stale = readdirSync(outDir).filter((f) => f.endsWith('.mp3') && !wanted.has(f))
for (const f of stale) unlinkSync(join(outDir, f))
writeFileSync(join(outDir, 'lines.txt'), [...wanted.values()].sort().join('\n') + '\n') // handy to read, not used by the games
console.log(`${wanted.size} lines: ${todo.length} recorded, ${wanted.size - todo.length} already there, ${stale.length} old ones removed.`)
