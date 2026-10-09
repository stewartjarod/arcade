// Phones dim the screen when nobody touches it. While a round is on, ask the browser to keep it awake
// (menus can sleep as usual). Browsers drop the lock when the tab is hidden, so we ask again on return.
let wanted = false
let lock: WakeLockSentinel | null = null

const acquire = async () => {
  if (!wanted || lock || document.visibilityState !== 'visible') return
  try {
    lock = (await navigator.wakeLock?.request('screen')) ?? null
    lock?.addEventListener('release', () => (lock = null))
    if (!wanted) void release() // asked to stop while we were waiting
  } catch {
    // Unsupported or refused (e.g. low battery) — the screen just sleeps normally.
  }
}

const release = async () => {
  const held = lock
  lock = null
  try {
    await held?.release()
  } catch {
    // Already released.
  }
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => void acquire())

export function keepAwake(on: boolean) {
  wanted = on
  void (on ? acquire() : release())
}
