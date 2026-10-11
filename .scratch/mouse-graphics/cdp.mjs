// Tiny DevTools-protocol driver for local Chromium (no packages). Used for screenshots and perf numbers.
import { spawn } from 'node:child_process'
import { rmSync } from 'node:fs'

const SCRATCH = '/tmp/claude-1000/-home-jarod-Projects-Games/4e4c95a5-850a-4272-8e1f-efd15327a79c/scratchpad'

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function openPage({ url, width = 1280, height = 800, dpr = 1, port = Number(process.env.PORT || 5199) }) {
  const dbg = 9333 + Math.floor(Math.random() * 500)
  const chrome = spawn('/usr/bin/chromium', [
    '--headless=new', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows',
    `--remote-debugging-port=${dbg}`, `--window-size=${width},${height}`, '--no-sandbox',
    '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    `--user-data-dir=${SCRATCH}/mm-chrome-${dbg}`, 'about:blank',
  ], { stdio: 'ignore' })
  let targets = []
  for (let i = 0; i < 50 && !targets.length; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${dbg}/json`)).json() } catch {}
    await sleep(200)
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))
  let id = 0
  const waiting = new Map()
  const logs = []
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data)
    if (d.id && waiting.has(d.id)) { waiting.get(d.id)(d); waiting.delete(d.id) }
    else if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) logs.push(`${d.params.type}: ${d.params.args.map((a) => a.value ?? a.description).join(' ')}`)
    else if (d.method === 'Runtime.exceptionThrown') logs.push('EXCEPTION: ' + (d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text))
  }
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; waiting.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJs = async (expr, ms = 40000) => {
    const r = await Promise.race([new Promise((_, rej) => setTimeout(() => rej(new Error('eval timeout: ' + expr.slice(0, 70))), ms)), send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })])
    if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'eval failed')
    return r.result.result.value
  }
  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }) // keeps the page "visible" so animation frames keep coming
  await send('Page.bringToFront')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: false })
  await send('Page.navigate', { url: `http://localhost:${port}${url}` })
  await sleep(3000)
  for (let i = 0; i < 30 && (await evalJs('typeof window.__mm')) !== 'object'; i++) await sleep(500)
  const shot = async (file) => {
    const { writeFileSync } = await import('node:fs')
    writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).result.data, 'base64'))
  }
  const close = () => { try { ws.close() } catch {} chrome.kill(); setTimeout(() => rmSync(`${SCRATCH}/mm-chrome-${dbg}`, { recursive: true, force: true }), 1500) }
  return { evalJs, send, shot, logs, close }
}
