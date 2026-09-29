/**
 * Party time! Emoji confetti raining down the screen.
 *   confetti()                       // default stars and sparkles
 *   confetti(['🧀', '⭐', '🎉'])      // your own
 */
let styled = false

export function confetti(bits: string[] = ['⭐', '🎉', '✨', '🎈', '💛'], count = 50) {
  if (!styled) {
    styled = true
    const style = document.createElement('style')
    style.textContent = `
      .arcade-confetti { position: fixed; top: -40px; font-size: 2rem; pointer-events: none; animation: arcade-fall linear forwards; z-index: 50; }
      @keyframes arcade-fall { to { transform: translateY(110vh) rotate(540deg); } }`
    document.head.append(style)
  }
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    el.className = 'arcade-confetti'
    el.textContent = bits[i % bits.length]!
    el.style.left = `${Math.random() * 100}vw`
    el.style.animationDuration = `${2.5 + Math.random() * 2.5}s`
    el.style.animationDelay = `${Math.random() * 1.2}s`
    document.body.append(el)
    setTimeout(() => el.remove(), 7000)
  }
}
