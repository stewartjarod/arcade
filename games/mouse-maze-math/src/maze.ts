export type Dir = 0 | 1 | 2 | 3
export const DX = [0, 1, 0, -1]
export const DZ = [-1, 0, 1, 0]

export type ExitKind = 'path' | 'dead' | 'trap'
export type Cell = [number, number]
export type Exit = { dir: Dir; kind: ExitKind; path: Cell[] }
export type Junction = { x: number; z: number; heading: Dir; exits: Exit[] }
export type Wall = { x: number; z: number; dir: Dir }
export type Layout = {
  junctions: Junction[]
  goal: { x: number; z: number; heading: Dir }
  cells: Cell[]
  walls: Wall[]
}

const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const ck = (x: number, z: number) => `${x},${z}`
const ek = (ax: number, az: number, bx: number, bz: number) => {
  const a = ck(ax, az)
  const b = ck(bx, bz)
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

// Every junction has three exits (left, straight, right). One corridor leads on,
// the others wind off and end in a dead end or a trap. Corridors are 1-2 straight
// runs of 2-3 cells, and never touch each other, so walls stay between them.
export type MazeOpts = { runs: [number, number]; len: [number, number] }
const attempt = (n: number, trapChance: number, o: MazeOpts): Layout | null => {
  const used = new Set<string>()
  const edges = new Set<string>()
  const journal: { cell: string; edge: string }[] = []
  const junctions: Junction[] = []
  let goal: Layout['goal'] | null = null
  let budget = 4000

  const rollback = (to: number) => {
    while (journal.length > to) {
      const e = journal.pop()!
      used.delete(e.cell)
      edges.delete(e.edge)
    }
  }

  const carve = (from: Cell, dir: Dir, runs: number[]) => {
    const mark = journal.length
    const path: Cell[] = []
    let [cx, cz] = from
    let d = dir
    for (let r = 0; r < runs.length; r++) {
      for (let i = 0; i < runs[r]!; i++) {
        const nx = cx + DX[d]!
        const nz = cz + DZ[d]!
        const clear =
          !used.has(ck(nx, nz)) &&
          [0, 1, 2, 3].every((q) => {
            const ax = nx + DX[q]!
            const az = nz + DZ[q]!
            return (ax === cx && az === cz) || !used.has(ck(ax, az))
          })
        if (!clear) {
          rollback(mark)
          return null
        }
        used.add(ck(nx, nz))
        edges.add(ek(cx, cz, nx, nz))
        journal.push({ cell: ck(nx, nz), edge: ek(cx, cz, nx, nz) })
        path.push([nx, nz])
        cx = nx
        cz = nz
      }
      if (r < runs.length - 1) d = ((d + (Math.random() < 0.5 ? 1 : 3)) % 4) as Dir
    }
    return { path, dir: d }
  }

  const place = (k: number, x: number, z: number, heading: Dir): boolean => {
    const dirs = [(heading + 3) % 4, heading, (heading + 1) % 4] as Dir[]
    for (let tries = 0; tries < 25 && budget-- > 0; tries++) {
      const mark = journal.length
      const correct = rint(0, 2)
      const exits: Exit[] = []
      const ends: { cell: Cell; dir: Dir }[] = []
      let ok = true
      for (let i = 0; i < 3 && ok; i++) {
        const runs = Array.from({ length: rint(o.runs[0], o.runs[1]) }, () => rint(o.len[0], o.len[1]))
        const res = carve([x, z], dirs[i]!, runs)
        if (!res) {
          ok = false
          break
        }
        exits.push({
          dir: dirs[i]!,
          kind: i === correct ? 'path' : Math.random() < trapChance ? 'trap' : 'dead',
          path: res.path,
        })
        ends.push({ cell: res.path[res.path.length - 1]!, dir: res.dir })
      }
      if (ok) {
        junctions[k] = { x, z, heading, exits }
        const { cell, dir } = ends[correct]!
        if (k === n - 1) {
          goal = { x: cell[0], z: cell[1], heading: dir }
          return true
        }
        if (place(k + 1, cell[0], cell[1], dir)) return true
      }
      rollback(mark)
    }
    return false
  }

  for (const c of [ck(0, 0), ck(-1, 0), ck(-2, 0)]) used.add(c)
  edges.add(ek(0, 0, -1, 0))
  edges.add(ek(-1, 0, -2, 0))
  if (!place(0, 0, 0, 1) || !goal) return null

  const walls: Wall[] = []
  const seen = new Set<string>()
  for (const s of used) {
    const [x, z] = s.split(',').map(Number) as Cell
    for (const d of [0, 1, 2, 3] as Dir[]) {
      const key = ek(x, z, x + DX[d]!, z + DZ[d]!)
      if (edges.has(key) || seen.has(key)) continue
      seen.add(key)
      walls.push({ x, z, dir: d })
    }
  }
  const cells = [...used].map((s) => s.split(',').map(Number) as Cell)
  return { junctions, goal, cells, walls }
}

export const generateMaze = (n: number, trapChance = 0.4, o: MazeOpts = { runs: [1, 2], len: [2, 3] }): Layout => {
  for (let i = 0; i < 2000; i++) {
    if (i === 300) o = { runs: [1, Math.min(2, o.runs[1])], len: [2, 3] }
    const layout = attempt(n, trapChance, o)
    if (!layout) continue
    const picks = layout.junctions.map((j) => j.exits.findIndex((e) => e.kind === 'path'))
    const middle = picks.filter((p) => p === 1).length
    const streak = picks.some((p, k) => k >= 2 && p === picks[k - 1] && p === picks[k - 2])
    if (n >= 3 && (middle > Math.ceil(n * 0.4) || streak)) continue
    return layout
  }
  throw new Error('could not generate a maze')
}
