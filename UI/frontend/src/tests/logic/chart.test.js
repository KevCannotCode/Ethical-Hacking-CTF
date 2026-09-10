import { describe, expect, it } from 'vitest'
import { layoutRace } from '@/lib/chart.js'

const team = (id, level, solves, color = '#fff') => ({ id, name: id, color, level, solves })

describe('layoutRace', () => {
  it('draws a step line through every solve and ends at now', () => {
    const L = layoutRace({ teams: [team('a', 2, [{ level: 1, at: 60 }, { level: 2, at: 120 }])], elapsed: 300, lastLevel: 5, width: 1000, height: 500 })
    expect(L.lines).toHaveLength(1)
    expect(L.lines[0].d).toMatch(/^M.* H.* V.* H.* V.* H[\d.]+$/)
    expect(L.markers.filter((m) => m.big)).toHaveLength(1)
  })
  it('keeps end labels at least a gap apart', () => {
    const teams = [team('a', 0, []), team('b', 0, []), team('c', 0, [])]
    const L = layoutRace({ teams, elapsed: 10, lastLevel: 24, width: 1200, height: 600 })
    const ys = L.labels.map((l) => l.y).sort((p, q) => p - q)
    expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(28)
    expect(ys[2] - ys[1]).toBeGreaterThanOrEqual(28)
  })
  it('never plots a solve beyond the current time', () => {
    const L = layoutRace({ teams: [team('a', 1, [{ level: 1, at: 999 }])], elapsed: 100, lastLevel: 5, width: 1000, height: 500 })
    const nowX = L.now.x1
    expect(L.markers.every((m) => m.cx <= nowX + 0.001)).toBe(true)
  })
})
