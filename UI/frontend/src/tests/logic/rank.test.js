import { describe, expect, it } from 'vitest'
import { rankTeams, winner } from '@/lib/rank.js'
import { fmtClock } from '@/lib/clock.js'

const t = (name, level, at) => ({ name, level, solves: at == null ? [] : [{ level, at }] })

describe('rankTeams', () => {
  it('orders by flags, then by who got there first', () => {
    const r = rankTeams([t('slow', 3, 900), t('none', 0), t('fast', 3, 300), t('mid', 2, 100)])
    expect(r.map((x) => x.name)).toEqual(['fast', 'slow', 'mid', 'none'])
  })
})

describe('winner', () => {
  it('is the first team across the finish line, or null', () => {
    expect(winner([t('a', 2, 10)], 3)).toBeNull()
    expect(winner([t('late', 3, 500), t('early', 3, 200)], 3).name).toBe('early')
  })
})

describe('fmtClock', () => {
  it('formats mm:ss and h:mm:ss', () => {
    expect(fmtClock(0)).toBe('00:00')
    expect(fmtClock(83.9)).toBe('01:23')
    expect(fmtClock(3723)).toBe('1:02:03')
  })
})
