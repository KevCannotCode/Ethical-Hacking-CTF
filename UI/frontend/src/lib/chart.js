// Pure geometry for the race chart: teams + elapsed seconds → SVG primitives. No DOM, no React.
const DASH = ['', '14 8', '4 7', '16 6 4 6']
const MARK = ['circle', 'square', 'diamond', 'triangle']
const PAD = { l: 60, r: 250, t: 44, b: 46 }
const LABEL_GAP = 28

export function layoutRace({ teams, elapsed, lastLevel, width: W, height: H }) {
  const xMax = Math.max(3600, Math.ceil((elapsed + 1) / 600) * 600)
  const x = (s) => PAD.l + (s / xMax) * (W - PAD.l - PAD.r)
  const y = (l) => H - PAD.b - (l / lastLevel) * (H - PAD.t - PAD.b)
  const right = W - PAD.r

  const grid = [], yLabels = [], xLabels = []
  const yStep = lastLevel > 16 ? 2 : 1
  for (let l = 0; l <= lastLevel; l++) {
    grid.push({ x1: PAD.l, x2: right, y1: y(l), y2: y(l) })
    if (l % yStep === 0) yLabels.push({ x: PAD.l - 10, y: y(l) + 8, text: String(l) })
  }
  for (let s = 0; s <= xMax; s += 600) {
    grid.push({ x1: x(s), x2: x(s), y1: PAD.t, y2: H - PAD.b })
    xLabels.push({ x: x(s), y: H - PAD.b + 30, text: `${s / 60} min` })
  }

  const lines = [], markers = [], ends = []
  teams.forEach((t, i) => {
    const off = (i % 4) * 1.5 - 2 // tiny vertical offset keeps overlapping lines visible
    let d = `M${x(0)} ${y(0) + off}`
    let lvl = 0
    for (const s of t.solves) {
      const at = Math.min(s.at, elapsed)
      d += ` H${x(at)} V${y(s.level) + off}`
      lvl = s.level
      markers.push({ kind: MARK[i % 4], cx: x(at), cy: y(s.level) + off, color: t.color, big: false })
    }
    d += ` H${x(elapsed)}`
    lines.push({ id: t.id, d, color: t.color, dash: DASH[i % 4] })
    markers.push({ kind: MARK[i % 4], cx: x(elapsed), cy: y(lvl) + off, color: t.color, big: true })
    ends.push({ id: t.id, text: `${t.name} · ${t.level}`, color: t.color, yEnd: y(lvl) + off })
  })

  // labels hug the line ends, pushed apart so they never overlap, clamped to the plot
  ends.sort((a, b) => a.yEnd - b.yEnd)
  let prev = PAD.t - LABEL_GAP
  for (const e of ends) { e.yLab = Math.max(e.yEnd, prev + LABEL_GAP); prev = e.yLab }
  let next = H - PAD.b + LABEL_GAP
  for (let k = ends.length - 1; k >= 0; k--) { ends[k].yLab = Math.min(ends[k].yLab, next - LABEL_GAP); next = ends[k].yLab }
  const lx = x(elapsed) + 18
  const labels = ends.map((e) => ({
    id: e.id, text: e.text, color: e.color, x: lx, y: e.yLab + 5,
    connector: Math.abs(e.yLab - e.yEnd) > 2 ? { x1: lx - 6, y1: e.yEnd, x2: lx - 2, y2: e.yLab } : null,
  }))

  return {
    grid, yLabels, xLabels, lines, markers, labels,
    finish: { x1: PAD.l, x2: right, y1: y(lastLevel), y2: y(lastLevel) },
    finishLabel: { x: PAD.l + 8, y: y(lastLevel) - 10 },
    flag: { x: right - 46, y: y(lastLevel) - 8 },
    now: { x1: x(elapsed), x2: x(elapsed), y1: PAD.t, y2: H - PAD.b },
  }
}
