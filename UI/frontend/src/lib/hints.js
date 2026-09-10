// Which hints are live right now: pure function of teams, elapsed seconds, and the finish line. No React, no I/O.
import { HINTS } from '@/data/hints.js'

// Levels 15+ are hard enough to earn a third hint; everyone else tops out at two.
export const maxHints = (level) => (level >= 15 ? 3 : 2)

// How long a team has sat on its current level (since its last solve, or since the start for level 0).
export function timeOnLevel(team, elapsed) {
  const since = team.solves.length ? team.solves[team.solves.length - 1].at : 0
  return Math.max(0, elapsed - since)
}

// Hints unlocked after `secStuck` on `level`: hint k at k × budget, capped by difficulty and available tips.
export function unlockedCount(level, secStuck) {
  const h = HINTS[level]
  if (!h) return 0
  const budget = h.minutes * 60
  const cap = Math.min(maxHints(level), h.tips.length)
  let n = 0
  while (n < cap && secStuck >= (n + 1) * budget) n += 1
  return n
}

// One team's hint state on its current level: the tips it has unlocked, and seconds to the next unlock.
export function teamHints(team, elapsed, lastLevel) {
  const level = team.level
  const base = { level, done: false, tips: [], nextInSec: null, remaining: 0, unlocked: 0, cap: 0 }
  if (level >= lastLevel) return { ...base, done: true }
  const h = HINTS[level]
  if (!h) return base
  const budget = h.minutes * 60
  const cap = Math.min(maxHints(level), h.tips.length)
  const sec = timeOnLevel(team, elapsed)
  const unlocked = unlockedCount(level, sec)
  const remaining = cap - unlocked
  const nextInSec = remaining > 0 ? Math.max(0, (unlocked + 1) * budget - sec) : null
  return { level, done: false, tips: h.tips.slice(0, unlocked), nextInSec, remaining, unlocked, cap }
}

// Room pulse for the big screen: soonest upcoming hint across teams, and how many phones are showing/awaiting one.
export function hintPulse(teams, elapsed, lastLevel) {
  let eta = null
  let waiting = 0
  let showing = 0
  for (const t of teams) {
    const h = teamHints(t, elapsed, lastLevel)
    if (h.done) continue
    if (h.tips.length > 0) showing += 1
    if (h.nextInSec != null) {
      waiting += 1
      eta = eta == null ? h.nextInSec : Math.min(eta, h.nextInSec)
    }
  }
  return { eta, waiting, showing }
}
