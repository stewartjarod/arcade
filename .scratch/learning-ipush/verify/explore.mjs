import { openPage, sleep } from './../../candy-quest/cdp.mjs'
import { seedJs } from './seed.mjs'
const [slug, path, subject, grade] = process.argv.slice(2)
const page = await openPage({ url: path })
const { evalJs, shot, logs, close } = page
try {
  await evalJs(seedJs(subject, Number(grade)) + `; localStorage.setItem('arcade:p:guest:candy-quest:taught','true')`)
  await evalJs('location.reload()')
  await sleep(4000)
  await shot(`/tmp/n8-explore-${slug}.png`)
  console.log('TEXT:', (await evalJs('document.body.innerText')).replace(/\s+/g, ' ').slice(0, 500))
  console.log('BUTTONS:', await evalJs(`[...document.querySelectorAll('button')].map(b => b.className + '|' + b.textContent.trim().slice(0,40)).join(' ;; ')`))
} finally {
  console.log('LOGS:', logs.join('\n') || 'clean')
  close()
}
