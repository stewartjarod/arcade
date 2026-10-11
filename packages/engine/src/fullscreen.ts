// Kid mode: keep the arcade full screen so little fingers can't reach the back button, tabs or address bar.
// It's a setting for this device (not per player), switched on from the homepage.
//
// Browsers drop full screen whenever the page changes (homepage → game → homepage), and only let a page
// go full screen right after a tap or key press. So every page listens for the next tap and goes back
// to full screen then.
const KEY = 'arcade:fullscreen'

const supported = () => typeof document !== 'undefined' && !!document.documentElement.requestFullscreen
const isFull = () => !!document.fullscreenElement

/** Is kid mode switched on for this device? */
export function isFullscreenMode() {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

async function enter() {
  if (!supported() || isFull()) return
  try {
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    // On computers, one press of Esc would leave full screen. Locking Esc (Chrome/Edge) means
    // a grown-up has to *hold* Esc instead, which a kid mashing keys won't do by accident.
    await (navigator as any).keyboard?.lock?.(['Escape'])
  } catch {
    // Not allowed right now (no tap yet) or not supported — we'll try again on the next tap.
  }
}

/** Switch kid mode on or off. Call it from a click so the browser lets us go full screen right away. */
export function setFullscreenMode(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // Private mode etc. — it still works for this page.
  }
  if (on) void enter()
  else if (isFull()) void document.exitFullscreen().catch(() => {})
}

let listening = false

/** Call once per page: if kid mode is on, go full screen on the next tap or key press. */
export function keepFullscreen() {
  if (listening || !supported()) return
  listening = true
  const again = () => {
    if (isFullscreenMode()) void enter()
  }
  // pointerup (not pointerdown): phones only count a touch as a "real" tap once the finger lifts.
  window.addEventListener('pointerup', again, true)
  window.addEventListener('keydown', again, true)
}

/** Whether this browser can do it at all (not on iPhones or in iPad Firefox/Chrome — the homepage suggests "Add to Home Screen" there). */
export const canFullscreen = supported
