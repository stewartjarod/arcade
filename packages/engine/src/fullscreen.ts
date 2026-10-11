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
  lockZoom()
  if (on) void enter()
  else if (isFull()) void document.exitFullscreen().catch(() => {})
}

/** Opened from a home screen icon ("Add to Home Screen"), so there are no browser bars at all. */
export function isHomeScreenApp() {
  return (
    typeof window !== 'undefined' &&
    (matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || !!(navigator as any).standalone)
  )
}

// While kids play full screen, a stray pinch or double tap shouldn't zoom the page — then the
// game is half off the screen and they can't find the way back. Grown-ups browsing normally keep zoom.
const noZoom = () => isFullscreenMode() || isHomeScreenApp()

function lockZoom() {
  const viewport = document.querySelector<HTMLMetaElement>('meta[name=viewport]')
  if (viewport) {
    viewport.dataset.original ??= viewport.content // some games already turn zoom off; put theirs back
    viewport.content = noZoom() ? 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' : viewport.dataset.original
  }
  // Double tap to zoom off; pinch is handled below because iPads ignore "user-scalable=no" in a browser tab.
  document.documentElement.style.touchAction = noZoom() ? 'manipulation' : ''
}

function blockZoomGestures() {
  const stop = (e: Event) => {
    if (noZoom()) e.preventDefault()
  }
  // Safari's pinch events.
  document.addEventListener('gesturestart', stop)
  document.addEventListener('gesturechange', stop)
  // Two fingers moving = a pinch in other browsers. Taps and drags still reach the game.
  document.addEventListener('touchmove', (e) => e.touches.length > 1 && stop(e), { passive: false })
  // Computers: Ctrl + scroll wheel (and trackpad pinch) and Ctrl/Cmd with + - 0.
  window.addEventListener('wheel', (e) => e.ctrlKey && stop(e), { passive: false })
  window.addEventListener('keydown', (e) => (e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key) && stop(e))
}

let listening = false

/** Call once per page: in kid mode, go full screen on the next tap or key press and don't let the page zoom. */
export function keepFullscreen() {
  if (listening || typeof document === 'undefined') return
  listening = true
  lockZoom()
  blockZoomGestures()
  if (!supported()) return
  const again = () => {
    if (isFullscreenMode()) void enter()
  }
  // pointerup (not pointerdown): phones only count a touch as a "real" tap once the finger lifts.
  window.addEventListener('pointerup', again, true)
  window.addEventListener('keydown', again, true)
}

/** Whether this browser can do it at all (not on iPhones or in iPad Firefox/Chrome — the homepage suggests "Add to Home Screen" there). */
export const canFullscreen = supported
