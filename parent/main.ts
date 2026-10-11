import { GRADES, currentPlayer, listPlayers, updatePlayer, type Player } from '@arcade/players'
import { escapeHTML as esc, ixlReport, peekLearner, scoreLabel, type ReportSkill, type ReportSubject } from '@arcade/learning'

// ------------------------------------------------------------------
//  For grown-ups: IXL-style scores for every player.
//  Kids never see these numbers; this page is the only place they show up.
//  Everything is the browser's own saved progress (nothing leaves this device).
// ------------------------------------------------------------------

const app = document.getElementById('app')!
const OK_KEY = 'arcade:grownup-ok'

const unlocked = () => {
  try {
    return sessionStorage.getItem(OK_KEY) === '1'
  } catch {
    return false
  }
}

function gate() {
  const a = 6 + Math.floor(Math.random() * 7)
  const b = 6 + Math.floor(Math.random() * 7)
  app.innerHTML = `<form class="gate"><h1>📊 Grown-ups</h1><p class="lede">A quick check that you're a grown-up:</p>
    <p><b>${a} × ${b} =</b> <input inputmode="numeric" autocomplete="off" aria-label="answer" /></p>
    <button class="primary" type="submit">Open</button> <p class="note" id="msg"></p></form>`
  const form = app.querySelector('form')!
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (Number(form.querySelector('input')!.value) === a * b) {
      try {
        sessionStorage.setItem(OK_KEY, '1')
      } catch {
        /* the page still opens; it just asks again next time */
      }
      render()
    } else {
      form.querySelector('#msg')!.textContent = 'Not quite, try again.'
    }
  })
}

const gradeWord = (g: number) => (g === 0 ? 'Kindergarten' : `Grade ${g}`)

function scale(score: number | undefined, profile: number | undefined) {
  const pct = (n: number) => `${Math.min(100, Math.max(0, (n / 600) * 100))}%`
  const marks = score === undefined ? '' : `<i style="left:${pct(score)}" title="estimated level"></i>`
  const mine = profile === undefined ? '' : `<i class="profile" style="left:${pct(profile * 100 + 50)}" title="profile grade"></i>`
  return `<div><div class="scale">${mine}${marks}</div><div class="scale-labels">${['K', '1', '2', '3', '4', '5'].map((g) => `<span>${g}</span>`).join('')}</div></div>`
}

function vsProfile(score: number | undefined, profile: number | undefined) {
  if (score === undefined || profile === undefined) return ''
  const diff = score / 100 - profile
  if (Math.abs(diff) < 0.5) return 'about at their profile grade'
  const n = Math.abs(diff).toFixed(1).replace(/\.0$/, '')
  return diff > 0 ? `${n} grade${n === '1' ? '' : 's'} above their profile grade` : `${n} grade${n === '1' ? '' : 's'} below their profile grade`
}

const bandWord = (k: ReportSkill) =>
  k.band === 'new' ? 'not asked yet' : k.band === 'placing' ? 'finding level…' : `${k.smart}${k.band === 'challenge' ? ' · challenge zone' : k.band === 'proficient' ? ' · proficient' : ''}`

function skillRows(s: ReportSubject) {
  return s.skills
    .filter((k) => k.seen > 0)
    .sort((a, b) => b.seen - a.seen || (b.score ?? 0) - (a.score ?? 0))
    .map(
      (k) => `<tr><td>${esc(k.label)}</td><td>${k.ixl ? `${esc(k.ixl.category)} <span class="note">(${esc(gradeWord(k.ixl.grade))})</span>` : '<span class="note">not matched to IXL</span>'}</td>
        <td class="num">${k.score ?? '–'}</td><td class="band-${k.band}">${esc(bandWord(k))}</td><td class="num">${k.seen}</td></tr>`,
    )
    .join('')
}

function subjectBlock(p: Player, s: ReportSubject) {
  const started = s.answers > 0 || s.skills.some((k) => k.seen > 0)
  const confidence = !started ? 'not started' : s.placing ? `rough guess so far (${s.answers} answers)` : `${s.answers} answers`
  const score =
    s.score === undefined
      ? '<span class="note">not matched to IXL</span>'
      : `<span class="score"><b>${s.score}</b> <small>${esc(scoreLabel(s.score))}</small></span>`
  return `<details class="subject" data-subject="${s.id}" ${started ? 'open' : ''}>
    <summary><span class="subject-name">${s.emoji} ${esc(s.name)}</span>
      <span>${score}${s.score !== undefined && started ? scale(s.score, p.grade) : ''}</span>
      <span class="note ${s.placing && started ? 'warn' : ''}">${esc(confidence)}</span></summary>
    <p class="note">${started ? esc(vsProfile(s.score, p.grade)) : 'Starts at their profile grade.'}${s.review ? ` · ${s.review} missed fact${s.review === 1 ? '' : 's'} coming back` : ''}</p>
    ${started ? `<p class="note">${s.skills.filter((k) => k.seen === 0 && k.level > 0).length} more skills haven't been asked yet; they start near this level.</p><table><thead><tr><th>Skill (current level)</th><th>IXL topic</th><th>Score</th><th>SmartScore</th><th>Answers</th></tr></thead><tbody>${skillRows(s)}</tbody></table>` : ''}
    ${started ? `<div class="actions"><button class="danger" data-replace="${p.id}|${s.id}">Re-place ${esc(s.name)} from ${esc(gradeWord(p.grade ?? 0))}</button>
      <span class="note">Starts every ${esc(s.name.toLowerCase())} skill over at that grade and finds their level again. Missed facts are kept.</span></div>` : ''}
  </details>`
}

function kidBlock(p: Player) {
  const report = ixlReport(peekLearner(p.id))
  const shown = report.filter((s) => s.score !== undefined || s.answers > 0)
  return `<section class="kid" data-player="${p.id}">
    <div class="kid-head"><span class="avatar">${p.avatar}</span><h2>${esc(p.name)}</h2>
      <span class="grade-pick">Starts at grade: ${GRADES.map((g, i) => `<button data-grade="${p.id}|${i}" class="${p.grade === i ? 'on' : ''}">${g}</button>`).join('')}</span></div>
    ${p.grade === undefined ? '<p class="note warn">No grade set, so new skills start in Kindergarten until the game finds their level. Pick a grade above to start higher.</p>' : ''}
    ${shown.map((s) => subjectBlock(p, s)).join('') || '<p class="empty">Nothing practiced yet.</p>'}
  </section>`
}

function render() {
  if (!unlocked()) return gate()
  const players = listPlayers()
  const open = new Set([...app.querySelectorAll<HTMLDetailsElement>('details.subject[open]')].map((d) => `${d.closest('.kid')?.getAttribute('data-player')}|${d.dataset.subject}`))
  app.innerHTML = `<h1>📊 How everyone is doing</h1>
    <p class="lede">An <b>IXL-style estimate</b> from the games: 0 is the start of Kindergarten and every grade adds 100 (so 134 is a third of the way through 1st grade). It's our own estimate, not IXL's Diagnostic score. Kids don't see any of these numbers. The first dozen answers in a subject move it the most; after that it follows how they're really doing.</p>
    ${players.length ? players.map(kidBlock).join('') : kidBlock(currentPlayer())}
    <p class="note"><a href="../index.html">← Back to the arcade</a></p>`
  app.querySelectorAll<HTMLDetailsElement>('details.subject').forEach((d) => {
    const key = `${d.closest('.kid')?.getAttribute('data-player')}|${d.dataset.subject}`
    if (open.size && open.has(key)) d.open = true
  })
}

app.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest('button')
  if (!t) return
  if (t.dataset.grade) {
    const [id, g] = t.dataset.grade.split('|')
    updatePlayer(id!, { grade: Number(g) })
    render()
  } else if (t.dataset.replace) {
    e.preventDefault()
    const [id, subject] = t.dataset.replace.split('|')
    const p = listPlayers().find((x) => x.id === id) ?? currentPlayer()
    if (!confirm(`Start ${p.name}'s ${subject} over from ${gradeWord(p.grade ?? 0)}? Their skill levels in it reset, then the game finds their level again.`)) return
    // A fresh read, so a game open in another tab can't be overwritten with an old copy.
    const l = peekLearner(id!)
    l.replace(subject!, p.grade ?? 0)
    l.save()
    render()
  }
})

render()
